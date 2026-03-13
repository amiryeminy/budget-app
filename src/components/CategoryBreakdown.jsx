import { fmt, budgetStatus, statusColor } from '../utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem' }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.label}</p>
      <p style={{ color: 'var(--muted)' }}>Spent: <span style={{ color: 'var(--text)', fontFamily: 'DM Mono' }}>{fmt(d.spent)}</span></p>
      {d.limit > 0 && <p style={{ color: 'var(--muted)' }}>Limit: <span style={{ color: 'var(--text)', fontFamily: 'DM Mono' }}>{fmt(d.limit)}</span></p>}
    </div>
  );
}

export default function CategoryBreakdown({ expenses, limits, categories, delay = 'd5' }) {
  const data = categories.map(cat => {
    const spent = expenses.filter(e => e.category === cat.id).reduce((s, e) => s + Number(e.amount), 0);
    const limit = Number(limits[cat.id] || 0);
    const status = budgetStatus(spent, limit);
    return { id: cat.id, label: cat.label, icon: cat.icon, spent, limit, color: cat.color, status };
  }).filter(d => d.spent > 0 || d.limit > 0);

  if (data.length === 0) {
    return (
      <div className={`card anim-fade-up ${delay}`} style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No expense data yet for this month.</p>
      </div>
    );
  }

  return (
    <div className={`card anim-fade-up ${delay}`} style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <span className="amber-line" />
        <h2 className="font-serif" style={{ fontSize: '1.1rem', fontWeight: 400 }}>Spending by Category</h2>
      </div>

      {/* Bar Chart */}
      <div style={{ height: 220, marginBottom: '1.5rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={24} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'DM Sans' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'DM Mono' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${v/1000}k` : v}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="spent" radius={[5, 5, 0, 0]}>
              {data.map(entry => (
                <Cell key={entry.id} fill={statusColor(entry.status)} fillOpacity={0.85} />
              ))}
            </Bar>
            {data.some(d => d.limit > 0) && (
              <Bar dataKey="limit" radius={[5, 5, 0, 0]} fill="var(--border)" fillOpacity={0.5} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {data.map(d => {
          const pct = d.limit > 0 ? Math.min((d.spent / d.limit) * 100, 100) : 0;
          const sc  = statusColor(d.status);
          return (
            <div key={d.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{d.icon}</span> {d.label}
                </span>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="font-mono" style={{ fontSize: '0.85rem', color: sc }}>{fmt(d.spent)}</span>
                  {d.limit > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>/ {fmt(d.limit)}</span>
                  )}
                  {d.status === 'over' && <span style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 600 }}>OVER</span>}
                </span>
              </div>
              {d.limit > 0 && (
                <div className="prog-track">
                  <div className="prog-fill" style={{ width: `${pct}%`, background: sc }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
