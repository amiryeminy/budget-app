export const DEFAULT_CATEGORIES = [
  { id: 'housing',       label: 'Housing',       icon: '🏠', color: '#6366f1' },
  { id: 'food',          label: 'Food',           icon: '🍽', color: '#f59e0b' },
  { id: 'transport',     label: 'Transport',      icon: '🚗', color: '#3b82f6' },
  { id: 'health',        label: 'Health',         icon: '💊', color: '#ec4899' },
  { id: 'entertainment', label: 'Entertainment',  icon: '🎬', color: '#8b5cf6' },
  { id: 'utilities',     label: 'Utilities',      icon: '⚡', color: '#14b8a6' },
  { id: 'savings',       label: 'Savings',        icon: '💰', color: '#4ade80' },
  { id: 'other',         label: 'Other',          icon: '📦', color: '#94a3b8' },
];

export function makeCatMap(categories) {
  return Object.fromEntries(categories.map(c => [c.id, c]));
}

// Kept for csvParse.js auto-categorizer (uses default IDs)
export const CATEGORIES = DEFAULT_CATEGORIES;
export const CAT_MAP    = makeCatMap(DEFAULT_CATEGORIES);
