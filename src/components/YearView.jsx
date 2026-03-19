import { format, parseISO } from 'date-fns';
import { getIncome, getExpenses } from '../storage';
import { fmt, budgetStatus, statusColor } from '../utils';
import SummaryCards from './SummaryCards';
import CategoryBreakdown from './CategoryBreakdown';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  CartesianGrid,
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────────────────

function sum(entries) {
  return entries.reduce((s, e) => s + Number(e.amount), 0);
}

function loadYear(year) {
  return Array.from({ length: 12 }, (_, i) => {
    const key   = `${year}-${String(i + 1).padStart(2, '0')}`;
    const label = format(parseISO(key + '-01'), 'MMM');
    const income   = getIncome(key);
    const expenses = getExpenses(key);
    return { key, label, income, expenses };
  });
}

// ── Trend chart ───────────────────────────────────────────────────────────────

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem' }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-mono">{fmt(p.value)}</span>
        </p>
      ))}
      {payload.length === 2 && (
        <p style={{ color: 'var(--muted)', marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 4 }}>
          Net: <span className="font-mono" style={{ color: payload[0].value - payload[1].value >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmt(payload[0].value - payload[1].value)}
          </span>
        </p>
      )}
    </div>
  );
}

function TrendChart({ months }) {
  const data = months.map(m => ({
    month: m.label,
    Income:   sum(m.income),
    Expenses: sum(m.expenses),
  }));

  const hasData = data.some(d => d.Income > 0 || d.Expenses > 0);

  if (!hasData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No data for this year yet.</p>
      </div>
    );
  }

  return (
    <div style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={16} barGap={4} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'DM Sans' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'DM Mono' }}
            axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend
            wrapperStyle={{ fontSize: '0.78rem', color: 'var(--muted)', paddingTop: 8 }}
            formatter={v => <span style={{ color: 'var(--muted)' }}>{v}</span>}
          />
          <Bar dataKey="Income"   fill="var(--green)" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expenses" fill="var(--red)"   fillOpacity={0.75} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Month table ───────────────────────────────────────────────────────────────

function MonthTable({ months, year }) {
  const rows = months.map(m => {
    const inc = sum(m.income);
    const exp = sum(m.expenses);
    const net = inc - exp;
    return { ...m, inc, exp, net };
  }).filter(m => m.inc > 0 || m.exp > 0);

  if (rows.length === 0) return null;

  const totInc = rows.reduce((s, r) => s + r.inc, 0);
  const totExp = rows.reduce((s, r) => s + r.exp, 0);
  const totNet = totInc - totExp;

  return (
    <div className="card anim-fade-up d6" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <span className="amber-line" />
        <h2 className="font-serif" style={{ fontSize: '1.1rem', fontWeight: 400 }}>Month by Month</h2>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.65rem 1.5rem', textAlign: 'left', color: 'var(--muted)', fontWeight: 500, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Month</th>
              <th style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--muted)', fontWeight: 500, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Income</th>
              <th style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--muted)', fontWeight: 500, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expenses</th>
              <th style={{ padding: '0.65rem 1.5rem', textAlign: 'right', color: 'var(--muted)', fontWeight: 500, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.7rem 1.5rem', fontWeight: 500 }}>
                  {format(parseISO(r.key + '-01'), 'MMMM')}
                </td>
                <td className="font-mono" style={{ padding: '0.7rem 1rem', textAlign: 'right', color: 'var(--green)' }}>
                  {fmt(r.inc)}
                </td>
                <td className="font-mono" style={{ padding: '0.7rem 1rem', textAlign: 'right', color: 'var(--red)' }}>
                  {fmt(r.exp)}
                </td>
                <td className="font-mono" style={{ padding: '0.7rem 1.5rem', textAlign: 'right', color: r.net >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                  {r.net >= 0 ? '+' : ''}{fmt(r.net)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--surface2)' }}>
              <td style={{ padding: '0.7rem 1.5rem', fontWeight: 600, color: 'var(--amber)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</td>
              <td className="font-mono" style={{ padding: '0.7rem 1rem', textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>{fmt(totInc)}</td>
              <td className="font-mono" style={{ padding: '0.7rem 1rem', textAlign: 'right', color: 'var(--red)', fontWeight: 600 }}>{fmt(totExp)}</td>
              <td className="font-mono" style={{ padding: '0.7rem 1.5rem', textAlign: 'right', color: totNet >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                {totNet >= 0 ? '+' : ''}{fmt(totNet)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function YearView({ year, categories, limits }) {
  const months     = loadYear(year);
  const allIncome  = months.flatMap(m => m.income);
  const allExpenses = months.flatMap(m => m.expenses);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary cards (reuse monthly component with aggregated data) */}
      <SummaryCards income={allIncome} expenses={allExpenses} />

      {/* Monthly trend chart */}
      <div className="card anim-fade-up d5" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <span className="amber-line" />
          <h2 className="font-serif" style={{ fontSize: '1.1rem', fontWeight: 400 }}>Monthly Trend</h2>
        </div>
        <TrendChart months={months} />
      </div>

      {/* Category breakdown for the full year */}
      <CategoryBreakdown
        expenses={allExpenses}
        limits={limits}
        categories={categories}
        delay="d5"
        titleOverride="Spending by Category — Full Year"
      />

      {/* Month-by-month table */}
      <MonthTable months={months} year={year} />
    </div>
  );
}
