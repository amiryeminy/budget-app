import { format, addMonths, subMonths, parseISO } from 'date-fns';

export function monthKey(date) {
  return format(date, 'yyyy-MM');
}

export function nextMonth(key) {
  return monthKey(addMonths(parseISO(key + '-01'), 1));
}

export function prevMonth(key) {
  return monthKey(subMonths(parseISO(key + '-01'), 1));
}

export function displayMonth(key) {
  return format(parseISO(key + '-01'), 'MMMM yyyy');
}

export function fmt(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function budgetStatus(spent, limit) {
  if (!limit || limit === 0) return 'none';
  const pct = spent / limit;
  if (pct >= 1)   return 'over';
  if (pct >= 0.8) return 'warn';
  return 'ok';
}

export function statusColor(status) {
  if (status === 'over') return 'var(--red)';
  if (status === 'warn') return 'var(--yellow)';
  return 'var(--green)';
}

export function statusBg(status) {
  if (status === 'over') return 'rgba(248,113,113,0.1)';
  if (status === 'warn') return 'rgba(251,191,36,0.1)';
  return 'rgba(74,222,128,0.08)';
}
