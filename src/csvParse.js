import { format, parse, isValid } from 'date-fns';

// ── CSV parser ──────────────────────────────────────────────────────────────

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('File appears empty.');

  const rows = lines.map(line => splitCSVLine(line));
  const headers = rows[0].map(h => h.trim());
  const data = rows.slice(1).filter(r => r.some(c => c.trim()));

  return { headers, rows: data };
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

// ── Column detection ────────────────────────────────────────────────────────

export function detectColumns(headers) {
  const h = headers.map(s => s.toLowerCase().trim());

  const find = (...terms) => {
    for (const t of terms) {
      const i = h.findIndex(col => col.includes(t));
      if (i !== -1) return i;
    }
    return -1;
  };

  const dateCol    = find('date', 'posted', 'trans');
  const descCol    = find('description', 'desc', 'payee', 'merchant', 'memo', 'name');
  const categoryCol = find('category', 'cat');

  // Income/expense split columns (e.g. "Amount Income" / "Amount Expense")
  const incomeCol  = find('amount income', 'income');
  const expenseCol = find('amount expense', 'expense');

  // Legacy debit/credit split (Capital One style)
  const debitCol   = find('debit');
  const creditCol  = find('credit');

  // Single amount column — only if no split columns detected
  const hasSplit = (incomeCol !== -1 && expenseCol !== -1) ||
                   (debitCol  !== -1 && creditCol  !== -1);
  const amtCol   = hasSplit ? -1 : find('amount', 'amt');

  const splitAmounts = hasSplit;

  return { dateCol, descCol, amtCol, incomeCol, expenseCol, debitCol, creditCol, categoryCol, splitAmounts };
}

// ── Amount parsing ──────────────────────────────────────────────────────────

export function parseAmount(str) {
  if (!str || str.trim() === '' || str.trim() === '-') return null;
  const cleaned = str.replace(/[$,\s]/g, '').replace(/[()]/g, m => m === '(' ? '-' : '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// ── Date parsing ────────────────────────────────────────────────────────────

const FORMATS_DMY  = ['dd/MM/yyyy', 'd/M/yyyy', 'dd/MM/yy', 'dd-MM-yyyy'];
const FORMATS_MDY  = ['MM/dd/yyyy', 'M/d/yyyy', 'MM/dd/yy', 'M/d/yy', 'MM-dd-yyyy'];
const FORMATS_ISO  = ['yyyy-MM-dd'];
const FORMATS_TEXT = ['MMM d, yyyy', 'MMMM d, yyyy', 'MMM dd yyyy', 'd MMM yyyy'];

/**
 * @param {string} str  raw date string
 * @param {'auto'|'dmy'|'mdy'|'iso'} hint  date format preference
 */
export function parseDate(str, hint = 'auto') {
  if (!str) return null;
  const s = str.trim();

  let order;
  if (hint === 'dmy') order = [...FORMATS_DMY, ...FORMATS_TEXT, ...FORMATS_ISO];
  else if (hint === 'mdy') order = [...FORMATS_MDY, ...FORMATS_TEXT, ...FORMATS_ISO];
  else if (hint === 'iso') order = [...FORMATS_ISO, ...FORMATS_TEXT, ...FORMATS_MDY, ...FORMATS_DMY];
  else {
    // auto: if any part > 12, sniff which position it's in
    const parts = s.split(/[\/\-]/);
    if (parts.length === 3) {
      const [a, b] = parts.map(Number);
      if (a > 12)       order = [...FORMATS_DMY, ...FORMATS_TEXT, ...FORMATS_ISO];
      else if (b > 12)  order = [...FORMATS_MDY, ...FORMATS_TEXT, ...FORMATS_ISO];
      else              order = [...FORMATS_MDY, ...FORMATS_DMY, ...FORMATS_TEXT, ...FORMATS_ISO];
    } else {
      order = [...FORMATS_TEXT, ...FORMATS_ISO, ...FORMATS_MDY, ...FORMATS_DMY];
    }
  }

  for (const fmt of order) {
    try {
      const d = parse(s, fmt, new Date());
      if (isValid(d)) return format(d, 'yyyy-MM-dd');
    } catch {}
  }
  const d = new Date(s);
  return isValid(d) ? format(d, 'yyyy-MM-dd') : null;
}

// ── Category matching ────────────────────────────────────────────────────────

export function matchCategory(rawCat, categories) {
  if (!rawCat || !rawCat.trim()) return null;
  const lower = rawCat.toLowerCase().trim();
  const exact = categories.find(c => c.label.toLowerCase() === lower);
  if (exact) return exact.id;
  const partial = categories.find(c =>
    lower.includes(c.label.toLowerCase()) || c.label.toLowerCase().includes(lower)
  );
  return partial ? partial.id : null;
}

// ── Row conversion ──────────────────────────────────────────────────────────

/**
 * Convert parsed rows into normalized transaction objects.
 * Returns array of: { date, description, amount, isExpense, rawCategory }
 *   amount is always positive; isExpense drives income vs expense.
 *
 * Sign convention options:
 *   'negative-expense'  — negative amount = expense (most bank checking accounts)
 *   'positive-expense'  — positive amount = expense (some credit cards)
 *   'split'             — separate income/expense or debit/credit columns
 */
export function normalizeRows(rows, cols, signConvention, dateHint = 'auto') {
  const { dateCol, descCol, amtCol, incomeCol, expenseCol, debitCol, creditCol, categoryCol, splitAmounts } = cols;
  const results = [];

  for (const row of rows) {
    const rawDate = dateCol >= 0 ? row[dateCol] : '';
    const rawDesc = descCol >= 0 ? row[descCol] : row.join(' ');
    const rawCategory = categoryCol >= 0 ? (row[categoryCol] || '').trim() : '';
    const date = parseDate(rawDate, dateHint) || '';
    const description = (rawDesc || '').trim();

    let amount = null;
    let isExpense = true;

    if (splitAmounts) {
      // Prefer income/expense cols, fall back to debit/credit
      const incCol = incomeCol  >= 0 ? incomeCol  : creditCol;
      const expCol = expenseCol >= 0 ? expenseCol : debitCol;
      const expAmt = expCol >= 0 ? parseAmount(row[expCol]) : null;
      const incAmt = incCol >= 0 ? parseAmount(row[incCol]) : null;
      if (expAmt != null && expAmt > 0)       { amount = expAmt; isExpense = true; }
      else if (incAmt != null && incAmt > 0)  { amount = incAmt; isExpense = false; }
      else continue;
    } else {
      const raw = amtCol >= 0 ? row[amtCol] : null;
      amount = parseAmount(raw);
      if (amount === null) continue;
      if (signConvention === 'positive-expense') {
        isExpense = amount > 0;
        amount = Math.abs(amount);
      } else {
        // negative-expense (default)
        isExpense = amount < 0;
        amount = Math.abs(amount);
      }
    }

    if (amount === 0) continue;

    results.push({ date, description, amount, isExpense, rawCategory });
  }

  return results;
}

// ── Auto-categorizer ────────────────────────────────────────────────────────

const RULES = [
  { id: 'housing',       kw: ['rent', 'mortgage', 'lease', 'hoa', 'property tax', 'realtor', 'zillow'] },
  { id: 'food',          kw: ['restaurant', 'cafe', 'coffee', 'grocery', 'supermarket', 'whole foods',
                               'trader joe', 'safeway', 'kroger', 'publix', 'aldi', 'costco', 'doordash',
                               'uber eats', 'grubhub', 'instacart', 'pizza', 'burger', 'sushi', 'mcdonald',
                               'starbucks', 'chipotle', 'subway', 'taco bell', 'wendy', 'chick-fil',
                               'panera', 'dunkin', 'bakery', 'deli', 'market', 'food'] },
  { id: 'transport',     kw: ['uber', 'lyft', 'taxi', 'gas station', 'shell', 'exxon', 'bp', 'chevron',
                               'mobil', 'sunoco', 'fuel', 'parking', 'toll', 'metro', 'transit', 'mta',
                               'bart', 'amtrak', 'airline', 'delta', 'united', 'southwest', 'american air',
                               'car wash', 'autozone', 'jiffy lube', 'car rental', 'hertz', 'enterprise'] },
  { id: 'health',        kw: ['pharmacy', 'cvs', 'walgreens', 'rite aid', 'hospital', 'clinic', 'doctor',
                               'dental', 'optometry', 'vision', 'medical', 'health', 'gym', 'fitness',
                               'planet fitness', 'equinox', 'anytime fitness', 'insurance'] },
  { id: 'entertainment', kw: ['netflix', 'spotify', 'hulu', 'disney', 'hbo', 'apple tv', 'amazon prime',
                               'youtube', 'twitch', 'steam', 'playstation', 'xbox', 'nintendo', 'movie',
                               'theater', 'cinema', 'concert', 'ticketmaster', 'stubhub', 'bar ', 'club ',
                               'bowling', 'golf', 'sport'] },
  { id: 'utilities',     kw: ['electric', 'electricity', 'water bill', 'gas bill', 'internet', 'comcast',
                               'xfinity', 'at&t', 'verizon', 't-mobile', 'spectrum', 'cox ', 'pge', 'pg&e',
                               'con ed', 'utility', 'phone bill', 'wireless'] },
  { id: 'savings',       kw: ['transfer to savings', 'savings', 'investment', '401k', 'ira', 'vanguard',
                               'fidelity', 'schwab', 'robinhood', 'deposit'] },
];

export function autoCategory(description) {
  const lower = description.toLowerCase();
  for (const rule of RULES) {
    if (rule.kw.some(kw => lower.includes(kw))) return rule.id;
  }
  return 'other';
}

// ── Detect likely sign convention ───────────────────────────────────────────

export function detectSignConvention(rows, cols) {
  if (cols.splitAmounts || cols.incomeCol >= 0 || cols.expenseCol >= 0) return 'split';
  if (cols.amtCol < 0) return 'negative-expense';
  // Sample first 20 data rows
  const sample = rows.slice(0, 20);
  let negCount = 0, posCount = 0;
  for (const row of sample) {
    const a = parseAmount(row[cols.amtCol]);
    if (a === null) continue;
    if (a < 0) negCount++;
    else if (a > 0) posCount++;
  }
  // If mostly negative, standard bank: negative = expense
  return negCount >= posCount ? 'negative-expense' : 'positive-expense';
}
