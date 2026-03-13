const KEY_INCOME      = m => `budget_income_${m}`;
const KEY_EXPENSE     = m => `budget_expense_${m}`;
const KEY_LIMITS      = 'budget_limits';
const KEY_CATEGORIES  = 'budget_categories';

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Income
export function getIncome(month)        { return load(KEY_INCOME(month)); }
export function addIncome(month, entry) {
  const list = getIncome(month);
  list.push({ ...entry, id: crypto.randomUUID() });
  save(KEY_INCOME(month), list);
}
export function deleteIncome(month, id) {
  save(KEY_INCOME(month), getIncome(month).filter(e => e.id !== id));
}

// Expenses
export function getExpenses(month)          { return load(KEY_EXPENSE(month)); }
export function addExpense(month, entry)    {
  const list = getExpenses(month);
  list.push({ ...entry, id: crypto.randomUUID() });
  save(KEY_EXPENSE(month), list);
}
export function deleteExpense(month, id)    {
  save(KEY_EXPENSE(month), getExpenses(month).filter(e => e.id !== id));
}

// Batch import: { month -> { income: [], expenses: [] } }
export function batchImport(byMonth) {
  for (const [month, { income, expenses }] of Object.entries(byMonth)) {
    if (income.length) {
      const existing = getIncome(month);
      const merged = [...existing, ...income.map(e => ({ ...e, id: crypto.randomUUID() }))];
      save(KEY_INCOME(month), merged);
    }
    if (expenses.length) {
      const existing = getExpenses(month);
      const merged = [...existing, ...expenses.map(e => ({ ...e, id: crypto.randomUUID() }))];
      save(KEY_EXPENSE(month), merged);
    }
  }
}

// Budget limits
export function getLimits()        { try { return JSON.parse(localStorage.getItem(KEY_LIMITS)) || {}; } catch { return {}; } }
export function saveLimits(limits) { localStorage.setItem(KEY_LIMITS, JSON.stringify(limits)); }

// Categories
export function getCategories(defaults) {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY_CATEGORIES));
    return Array.isArray(stored) && stored.length ? stored : defaults;
  } catch { return defaults; }
}
export function saveCategories(cats) { localStorage.setItem(KEY_CATEGORIES, JSON.stringify(cats)); }
