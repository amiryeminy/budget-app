import { useState, useRef } from 'react';
import { parseCSV, detectColumns, detectSignConvention, normalizeRows, autoCategory, matchCategory } from '../csvParse';
import { monthKey } from '../utils';
import { format, parseISO } from 'date-fns';

const STEP = { UPLOAD: 0, MAP: 1, REVIEW: 2, DONE: 3 };

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtAmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function safeMonthKey(dateStr) {
  if (!dateStr) return null;
  try { return monthKey(parseISO(dateStr)); } catch { return null; }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function UploadZone({ onFile }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handle = file => {
    if (!file || !file.name.endsWith('.csv')) return;
    const reader = new FileReader();
    reader.onload = e => onFile(e.target.result, file.name);
    reader.readAsText(file);
  };

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
      style={{
        border: `2px dashed ${dragging ? 'var(--amber)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
        background: dragging ? 'rgba(245,166,35,0.05)' : 'var(--surface2)',
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📂</div>
      <p style={{ fontWeight: 500, marginBottom: 4 }}>Drop your CSV file here</p>
      <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        or click to browse — supports Chase, Bank of America, Wells Fargo, Capital One, and generic CSVs
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={e => handle(e.target.files[0])}
      />
    </div>
  );
}

function ColSelect({ label, headers, value, onChange }) {
  return (
    <div style={{ flex: 1, minWidth: 130 }}>
      <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </label>
      <select className="inp" value={value} onChange={e => onChange(Number(e.target.value))}>
        <option value={-1}>— none —</option>
        {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
      </select>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ImportModal({ categories, onImport, onClose }) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const [step, setStep]   = useState(STEP.UPLOAD);
  const [error, setError] = useState('');

  // Step 1: parsed file data
  const [filename, setFilename]   = useState('');
  const [headers,  setHeaders]    = useState([]);
  const [rawRows,  setRawRows]    = useState([]);

  // Step 2: column mapping + sign convention + date format
  const [cols,       setCols]       = useState({});
  const [signConv,   setSignConv]   = useState('negative-expense');
  const [dateHint,   setDateHint]   = useState('auto');

  // Step 3: normalized rows with user edits
  const [txns, setTxns] = useState([]); // { date, description, amount, isExpense, category, include }

  // ── Step 1: load file ────────────────────────────────────────────────────
  function handleFile(text, name) {
    setError('');
    try {
      const { headers, rows } = parseCSV(text);
      if (rows.length === 0) throw new Error('No data rows found in file.');
      const detected = detectColumns(headers);
      const conv     = detectSignConvention(rows, detected);
      setFilename(name);
      setHeaders(headers);
      setRawRows(rows);
      setCols(detected);
      setSignConv(conv);
      setStep(STEP.MAP);
    } catch (err) {
      setError(err.message || 'Failed to parse CSV.');
    }
  }

  // ── Step 2 → Step 3: normalize ───────────────────────────────────────────
  function handleMap() {
    setError('');
    if (cols.dateCol < 0 && !cols.splitAmounts) {
      setError('Please select a Date column.');
      return;
    }
    if (cols.amtCol < 0 && !cols.splitAmounts) {
      setError('Please select an Amount column.');
      return;
    }
    const normalized = normalizeRows(rawRows, cols, signConv, dateHint);
    if (normalized.length === 0) {
      setError('No valid transactions found with the current column settings.');
      return;
    }
    const withMeta = normalized.map(t => ({
      ...t,
      category: t.isExpense
        ? (matchCategory(t.rawCategory, categories) || autoCategory(t.description))
        : 'income',
      include: true,
    }));
    setTxns(withMeta);
    setStep(STEP.REVIEW);
  }

  // ── Step 3: row edits ────────────────────────────────────────────────────
  const toggleInclude = i => setTxns(ts => ts.map((t, j) => j === i ? { ...t, include: !t.include } : t));
  const setCategory   = (i, cat) => setTxns(ts => ts.map((t, j) => j === i ? { ...t, category: cat } : t));
  const setType       = (i, isExpense) => setTxns(ts => ts.map((t, j) => j === i ? { ...t, isExpense, category: isExpense ? autoCategory(t.description) : 'income' } : t));
  const toggleAll     = include => setTxns(ts => ts.map(t => ({ ...t, include })));

  // ── Step 3 → import ─────────────────────────────────────────────────────
  function handleImport() {
    const selected = txns.filter(t => t.include);
    if (selected.length === 0) { setError('Select at least one transaction.'); return; }

    // Group by month
    const byMonth = {};
    for (const t of selected) {
      const mk = safeMonthKey(t.date) || monthKey(new Date());
      if (!byMonth[mk]) byMonth[mk] = { income: [], expenses: [] };
      if (t.isExpense) {
        byMonth[mk].expenses.push({ amount: t.amount, category: t.category, description: t.description, date: t.date });
      } else {
        byMonth[mk].income.push({ amount: t.amount, source: t.description, date: t.date });
      }
    }
    onImport(byMonth, selected.length);
    setStep(STEP.DONE);
  }

  // ── Summary counts ───────────────────────────────────────────────────────
  const included  = txns.filter(t => t.include);
  const expCount  = included.filter(t => t.isExpense).length;
  const incCount  = included.filter(t => !t.isExpense).length;
  const total     = included.reduce((s, t) => s + (t.isExpense ? -t.amount : t.amount), 0);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        style={{
          maxWidth: step === STEP.REVIEW ? 680 : 480,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.4rem 1.6rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 400 }}>Import CSV</h2>
            {filename && <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>{filename}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Step indicators */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['Upload', 'Map', 'Review'].map((label, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 600,
                    background: step > i ? 'var(--amber)' : step === i ? 'rgba(245,166,35,0.2)' : 'var(--surface2)',
                    color: step > i ? '#09090f' : step === i ? 'var(--amber)' : 'var(--muted)',
                    border: step === i ? '1.5px solid var(--amber)' : '1.5px solid transparent',
                  }}>{step > i ? '✓' : i + 1}</div>
                  {i < 2 && <div style={{ width: 12, height: 1, background: step > i ? 'var(--amber)' : 'var(--border)' }} />}
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.4rem 1.6rem' }}>

          {/* ── Step 0: Upload ── */}
          {step === STEP.UPLOAD && (
            <div>
              <UploadZone onFile={handleFile} />
              {error && <p style={{ color: 'var(--red)', fontSize: '0.82rem', marginTop: '0.75rem' }}>{error}</p>}
              <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--surface2)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 6 }}>Expected columns</strong>
                <span style={{ fontFamily: 'DM Mono', fontSize: '0.75rem', color: 'var(--amber)' }}>Date, Description, Amount Income, Amount Expense, Category</span>
                <br />
                <span style={{ marginTop: 6, display: 'block' }}>Also supports Chase · Bank of America · Wells Fargo · Capital One · Citi · and any CSV with date, description, and amount columns.</span>
              </div>
            </div>
          )}

          {/* ── Step 1: Map columns ── */}
          {step === STEP.MAP && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                We detected <strong style={{ color: 'var(--text)' }}>{rawRows.length} rows</strong>. Confirm which columns to use.
              </p>

              {/* Row 1: Date + Description */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <ColSelect label="Date column"        headers={headers} value={cols.dateCol ?? -1}  onChange={v => setCols(c => ({ ...c, dateCol: v }))} />
                <ColSelect label="Description column" headers={headers} value={cols.descCol ?? -1}  onChange={v => setCols(c => ({ ...c, descCol: v }))} />
              </div>

              {/* Row 2: Amount columns */}
              {!cols.splitAmounts ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <ColSelect label="Amount column" headers={headers} value={cols.amtCol ?? -1} onChange={v => setCols(c => ({ ...c, amtCol: v, splitAmounts: false }))} />
                  <div style={{ flex: 1, minWidth: 130 }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Sign convention
                    </label>
                    <select className="inp" value={signConv} onChange={e => setSignConv(e.target.value)}>
                      <option value="negative-expense">Negative = expense (checking accounts)</option>
                      <option value="positive-expense">Positive = expense (some credit cards)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <ColSelect
                    label="Amount Income column"
                    headers={headers}
                    value={cols.incomeCol >= 0 ? cols.incomeCol : (cols.creditCol ?? -1)}
                    onChange={v => setCols(c => ({ ...c, incomeCol: v, creditCol: v }))}
                  />
                  <ColSelect
                    label="Amount Expense column"
                    headers={headers}
                    value={cols.expenseCol >= 0 ? cols.expenseCol : (cols.debitCol ?? -1)}
                    onChange={v => setCols(c => ({ ...c, expenseCol: v, debitCol: v }))}
                  />
                </div>
              )}

              {/* Row 3: Category + Date format */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <ColSelect
                  label="Category column (optional)"
                  headers={headers}
                  value={cols.categoryCol ?? -1}
                  onChange={v => setCols(c => ({ ...c, categoryCol: v }))}
                />
                <div style={{ flex: 1, minWidth: 130 }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Date format
                  </label>
                  <select className="inp" value={dateHint} onChange={e => setDateHint(e.target.value)}>
                    <option value="auto">Auto-detect</option>
                    <option value="dmy">DD/MM/YYYY</option>
                    <option value="mdy">MM/DD/YYYY</option>
                    <option value="iso">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="split"
                  checked={!!cols.splitAmounts}
                  onChange={e => setCols(c => ({ ...c, splitAmounts: e.target.checked, amtCol: -1 }))}
                  style={{ accentColor: 'var(--amber)' }}
                />
                <label htmlFor="split" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                  File has separate Income / Expense amount columns
                </label>
              </div>

              {/* Preview first 3 rows */}
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Preview (first 3 rows)</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawRows.slice(0, 3).map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)', color: 'var(--text)', whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && <p style={{ color: 'var(--red)', fontSize: '0.82rem' }}>{error}</p>}
            </div>
          )}

          {/* ── Step 2: Review ── */}
          {step === STEP.REVIEW && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Summary bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface2)', borderRadius: 10, fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--muted)' }}>{included.length} selected</span>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span style={{ color: 'var(--red)' }}>{expCount} expenses</span>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span style={{ color: 'var(--green)' }}>{incCount} income</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'DM Mono', color: total >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  net {fmtAmt(total)}
                </span>
                <button
                  className="btn-ghost"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', marginLeft: 4 }}
                  onClick={() => toggleAll(true)}
                >All</button>
                <button
                  className="btn-ghost"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                  onClick={() => toggleAll(false)}
                >None</button>
              </div>

              {error && <p style={{ color: 'var(--red)', fontSize: '0.82rem' }}>{error}</p>}

              {/* Transaction rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {txns.map((t, i) => {
                  const cat = catMap[t.category];
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.55rem 0.75rem',
                        borderRadius: 8,
                        background: t.include ? 'var(--surface2)' : 'transparent',
                        opacity: t.include ? 1 : 0.4,
                        transition: 'opacity 0.15s, background 0.15s',
                        fontSize: '0.82rem',
                      }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={t.include}
                        onChange={() => toggleInclude(i)}
                        style={{ accentColor: 'var(--amber)', flexShrink: 0, width: 15, height: 15 }}
                      />

                      {/* Date */}
                      <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap', minWidth: 56 }}>
                        {t.date ? format(parseISO(t.date), 'MMM d') : '—'}
                      </span>

                      {/* Description */}
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.description}>
                        {t.description}
                      </span>

                      {/* Type toggle */}
                      <button
                        onClick={() => setType(i, !t.isExpense)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px',
                          borderRadius: 99, fontSize: '0.72rem', fontWeight: 600,
                          color: t.isExpense ? 'var(--red)' : 'var(--green)',
                          background: t.isExpense ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
                          flexShrink: 0,
                        }}
                      >
                        {t.isExpense ? '↓ exp' : '↑ inc'}
                      </button>

                      {/* Category (expenses only) */}
                      {t.isExpense ? (
                        <select
                          className="inp"
                          value={catMap[t.category] ? t.category : (categories[0]?.id || 'other')}
                          onChange={e => setCategory(i, e.target.value)}
                          style={{ width: 110, fontSize: '0.75rem', padding: '3px 6px', flexShrink: 0 }}
                        >
                          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                        </select>
                      ) : (
                        <span style={{ width: 110, flexShrink: 0 }} />
                      )}

                      {/* Amount */}
                      <span className="font-mono" style={{ color: t.isExpense ? 'var(--red)' : 'var(--green)', whiteSpace: 'nowrap', minWidth: 70, textAlign: 'right', flexShrink: 0 }}>
                        {t.isExpense ? '-' : '+'}{fmtAmt(t.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === STEP.DONE && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h3 className="font-serif" style={{ fontSize: '1.3rem', fontWeight: 400, marginBottom: '0.5rem' }}>Import complete</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                Transactions have been saved and distributed across their respective months.
              </p>
              <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={onClose}>Done</button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== STEP.DONE && (
          <div style={{ padding: '1rem 1.6rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
            {step > STEP.UPLOAD && (
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { setError(''); setStep(s => s - 1); }}>
                ← Back
              </button>
            )}
            {step === STEP.UPLOAD && (
              <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            )}
            {step === STEP.MAP && (
              <button className="btn-primary" style={{ flex: 2 }} onClick={handleMap}>
                Preview transactions →
              </button>
            )}
            {step === STEP.REVIEW && (
              <button className="btn-primary" style={{ flex: 2 }} onClick={handleImport} disabled={included.length === 0}>
                Import {included.length} transaction{included.length !== 1 ? 's' : ''} →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
