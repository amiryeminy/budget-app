import { fmt } from '../utils';

function Stat({ label, value, color, delay, sub }) {
  return (
    <div className={`card anim-fade-up ${delay}`} style={{ padding: '1.4rem 1.5rem' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: '0.6rem' }}>
        {label}
      </p>
      <p className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 400, color: color || 'var(--text)', lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.5rem' }}>{sub}</p>}
    </div>
  );
}

export default function SummaryCards({ income, expenses }) {
  const totalIncome   = income.reduce((s, e) => s + Number(e.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const net           = totalIncome - totalExpenses;
  const utilPct       = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
      <Stat delay="d1" label="Total Income"   value={fmt(totalIncome)}   color="var(--green)" />
      <Stat delay="d2" label="Total Expenses" value={fmt(totalExpenses)} color="var(--red)" />
      <Stat
        delay="d3"
        label="Net Balance"
        value={fmt(net)}
        color={net >= 0 ? 'var(--green)' : 'var(--red)'}
        sub={net >= 0 ? '✓ Surplus' : '⚠ Deficit'}
      />
      <Stat
        delay="d4"
        label="Budget Used"
        value={`${utilPct}%`}
        color={utilPct >= 100 ? 'var(--red)' : utilPct >= 80 ? 'var(--yellow)' : 'var(--text)'}
        sub={`of income spent`}
      />
    </div>
  );
}
