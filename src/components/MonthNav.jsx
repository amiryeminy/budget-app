import { prevMonth, nextMonth, displayMonth, monthKey } from '../utils';

export default function MonthNav({ month, onChange }) {
  const isCurrentMonth = month === monthKey(new Date());

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <button className="btn-icon" onClick={() => onChange(prevMonth(month))} title="Previous month">
        ‹
      </button>
      <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.15rem', color: 'var(--text)', minWidth: 148, textAlign: 'center' }}>
        {displayMonth(month)}
      </span>
      <button className="btn-icon" onClick={() => onChange(nextMonth(month))} title="Next month">
        ›
      </button>
      {!isCurrentMonth && (
        <button
          className="btn-ghost"
          style={{ fontSize: '0.78rem', padding: '0.38rem 0.75rem' }}
          onClick={() => onChange(monthKey(new Date()))}
        >
          Today
        </button>
      )}
    </div>
  );
}
