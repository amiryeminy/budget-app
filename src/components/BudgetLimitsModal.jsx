import { useState } from 'react';

export default function BudgetLimitsModal({ limits, categories, onSave, onClose }) {
  const [form, setForm] = useState(
    Object.fromEntries(categories.map(c => [c.id, limits[c.id] || '']))
  );

  function handleSubmit(e) {
    e.preventDefault();
    const cleaned = {};
    for (const [k, v] of Object.entries(form)) {
      const n = Number(v);
      if (v !== '' && n > 0) cleaned[k] = n;
    }
    onSave(cleaned);
    onClose();
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="font-serif" style={{ fontSize: '1.3rem', fontWeight: 400 }}>Budget Limits</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}
          >×</button>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
          Set a monthly spending limit per category. Leave blank for no limit.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ width: 28, textAlign: 'center', fontSize: '1.1rem' }}>{cat.icon}</span>
              <label style={{ flex: 1, fontSize: '0.875rem' }}>{cat.label}</label>
              <input
                className="inp"
                type="number"
                min="0"
                step="1"
                placeholder="No limit"
                value={form[cat.id]}
                onChange={e => setForm(f => ({ ...f, [cat.id]: e.target.value }))}
                style={{ width: 120, textAlign: 'right', fontFamily: 'DM Mono' }}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }}>Save Limits</button>
          </div>
        </form>
      </div>
    </div>
  );
}
