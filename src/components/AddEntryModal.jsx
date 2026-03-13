import { useState } from 'react';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

export default function AddEntryModal({ type, categories, onSave, onClose }) {
  const isIncome = type === 'income';

  const [form, setForm] = useState({
    amount:      '',
    date:        today(),
    source:      '',
    category:    categories[0]?.id || 'other',
    description: '',
  });
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (isIncome && !form.source.trim()) {
      setError('Enter an income source.');
      return;
    }
    onSave({ ...form, amount: Number(form.amount) });
    onClose();
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="font-serif" style={{ fontSize: '1.3rem', fontWeight: 400 }}>
            Add {isIncome ? 'Income' : 'Expense'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}
          >×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Amount */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Amount</label>
            <input
              className="inp"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              autoFocus
              style={{ fontFamily: 'DM Mono', fontSize: '1.1rem' }}
            />
          </div>

          {/* Date */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Date</label>
            <input className="inp" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>

          {/* Income: source | Expense: category + description */}
          {isIncome ? (
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Source</label>
              <input className="inp" type="text" placeholder="e.g. Salary, Freelance…" value={form.source} onChange={e => set('source', e.target.value)} />
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Category</label>
                <select className="inp" value={form.category} onChange={e => set('category', e.target.value)}>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Description <span style={{ opacity: 0.5 }}>(optional)</span></label>
                <input className="inp" type="text" placeholder="What was this for?" value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
            </>
          )}

          {error && <p style={{ color: 'var(--red)', fontSize: '0.82rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }}>Save {isIncome ? 'Income' : 'Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
