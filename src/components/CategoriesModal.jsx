import { useState } from 'react';
import { DEFAULT_CATEGORIES } from '../constants';

const EMOJI_PALETTE = [
  '🏠','🏡','🏢','🏗','🛏','🛋','🔑','🪴',
  '🍽','🥗','🛒','☕','🍕','🍔','🥩','🍱',
  '🚗','🚌','✈️','🚲','⛽','🛵','🚢','🚂',
  '💊','🏥','🧘','🏋️','💉','🦷','🩺','👟',
  '🎬','🎵','🎮','📺','🎭','🎨','🎲','📚',
  '⚡','💧','📱','🌐','🔌','🏠','📡','🔧',
  '💰','💳','📈','🏦','💵','🪙','🎯','📊',
  '📦','🗂','✏️','🔖','📝','🎁','🛍','🧾',
];

const COLOR_PALETTE = [
  '#6366f1','#8b5cf6','#ec4899','#f43f5e',
  '#f59e0b','#eab308','#84cc16','#22c55e',
  '#14b8a6','#06b6d4','#3b82f6','#64748b',
  '#f97316','#4ade80','#a78bfa','#94a3b8',
];

function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: 40, height: 40, fontSize: '1.25rem', border: '1px solid var(--border)',
          borderRadius: 9, background: 'var(--surface2)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.2s',
        }}
        title="Pick icon"
      >
        {value}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 100,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '0.6rem',
          display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4,
          width: 256, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {EMOJI_PALETTE.map(em => (
            <button
              key={em}
              type="button"
              onClick={() => { onChange(em); setOpen(false); }}
              style={{
                fontSize: '1.1rem', border: 'none', background: em === value ? 'rgba(245,166,35,0.15)' : 'transparent',
                borderRadius: 6, cursor: 'pointer', padding: 4, lineHeight: 1,
                outline: em === value ? '1.5px solid var(--amber)' : 'none',
              }}
            >{em}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorDot({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: value, border: '2px solid rgba(255,255,255,0.15)',
          cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 0 0 2px var(--surface2)',
        }}
        title="Pick color"
      />
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)', zIndex: 100,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '0.6rem',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
          width: 136, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {COLOR_PALETTE.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setOpen(false); }}
              style={{
                width: 24, height: 24, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                outline: c === value ? '2px solid var(--amber)' : '2px solid transparent',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesModal({ categories, onSave, onClose }) {
  const [list, setList] = useState(categories.map(c => ({ ...c })));
  const [confirmDelete, setConfirmDelete] = useState(null); // index of item to delete

  function update(i, field, val) {
    setList(l => l.map((c, j) => j === i ? { ...c, [field]: val } : c));
  }

  function addCategory() {
    setList(l => [...l, {
      id:    `cat_${Date.now()}`,
      label: 'New Category',
      icon:  '📦',
      color: '#94a3b8',
    }]);
  }

  function removeCategory(i) {
    setList(l => l.filter((_, j) => j !== i));
    setConfirmDelete(null);
  }

  function handleSave() {
    const cleaned = list
      .filter(c => c.label.trim())
      .map(c => ({ ...c, label: c.label.trim() }));
    if (cleaned.length === 0) return;
    onSave(cleaned);
    onClose();
  }

  function resetDefaults() {
    setList(DEFAULT_CATEGORIES.map(c => ({ ...c })));
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        style={{ maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* Header */}
        <div style={{ padding: '1.4rem 1.6rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 400 }}>Edit Categories</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
              onClick={resetDefaults}
              title="Reset to defaults"
            >
              Reset
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.6rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
            Click the icon or color dot to change them. Drag to reorder is not supported — use delete and re-add.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {list.map((cat, i) => (
              <div
                key={cat.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.65rem 0.75rem',
                  background: 'var(--surface2)', borderRadius: 10,
                  border: '1px solid var(--border)',
                }}
              >
                {/* Emoji picker */}
                <EmojiPicker value={cat.icon} onChange={v => update(i, 'icon', v)} />

                {/* Label */}
                <input
                  className="inp"
                  value={cat.label}
                  onChange={e => update(i, 'label', e.target.value)}
                  style={{ flex: 1, padding: '0.4rem 0.65rem', fontSize: '0.875rem' }}
                  maxLength={24}
                />

                {/* Color picker */}
                <ColorDot value={cat.color} onChange={v => update(i, 'color', v)} />

                {/* Delete */}
                {confirmDelete === i ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>Delete?</span>
                    <button
                      type="button"
                      onClick={() => removeCategory(i)}
                      style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                    >Yes</button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--muted)' }}
                    >No</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(i)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 4, flexShrink: 0 }}
                    title="Delete category"
                  >×</button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCategory}
            style={{
              marginTop: '0.85rem', width: '100%', padding: '0.6rem',
              background: 'transparent', border: '1.5px dashed var(--border)',
              borderRadius: 10, color: 'var(--muted)', cursor: 'pointer',
              fontSize: '0.85rem', transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber)'; e.currentTarget.style.color = 'var(--amber)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            + Add Category
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.6rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" style={{ flex: 2 }} onClick={handleSave}>Save Categories</button>
        </div>
      </div>
    </div>
  );
}
