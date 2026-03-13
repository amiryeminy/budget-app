import { format, parseISO } from 'date-fns';
import { fmt } from '../utils';

function Row({ entry, type, catMap, onDelete }) {
  const cat = type === 'expense' ? catMap[entry.category] : null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.7rem 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
        background: type === 'income' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.08)',
      }}>
        {type === 'income' ? '↑' : (cat?.icon || '↓')}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {type === 'income' ? entry.source : (entry.description || cat?.label || 'Expense')}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
          {cat && <span style={{ color: cat.color, marginRight: 6 }}>{cat.label}</span>}
          {entry.date ? format(parseISO(entry.date), 'MMM d') : ''}
        </p>
      </div>
      <span className="font-mono" style={{
        fontSize: '0.9rem', fontWeight: 500, flexShrink: 0,
        color: type === 'income' ? 'var(--green)' : 'var(--red)',
      }}>
        {type === 'income' ? '+' : '-'}{fmt(entry.amount)}
      </span>
      <button
        onClick={() => onDelete(entry.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1, padding: '4px', flexShrink: 0 }}
        title="Delete"
      >
        ×
      </button>
    </div>
  );
}

export default function TransactionList({ income, expenses, catMap, onDeleteIncome, onDeleteExpense, delay = 'd6' }) {
  const all = [
    ...income.map(e  => ({ ...e, _type: 'income' })),
    ...expenses.map(e => ({ ...e, _type: 'expense' })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className={`card anim-fade-up ${delay}`} style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
        <span className="amber-line" />
        <h2 className="font-serif" style={{ fontSize: '1.1rem', fontWeight: 400 }}>Transactions</h2>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--muted)' }}>{all.length} entries</span>
      </div>

      {all.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', padding: '1rem 0' }}>No transactions yet.</p>
      ) : (
        <div>
          {all.map(entry => (
            <Row
              key={entry.id}
              entry={entry}
              type={entry._type}
              catMap={catMap}
              onDelete={entry._type === 'income' ? onDeleteIncome : onDeleteExpense}
            />
          ))}
        </div>
      )}
    </div>
  );
}
