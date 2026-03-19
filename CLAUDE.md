# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A monthly budget management SPA with no backend — all data stored in localStorage.

**Stack:** React + Vite, Tailwind CSS, Recharts, date-fns

## Dev Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server (localhost:5173)
npm run build        # build + deploy → updates index.html + assets/ in project root
npm run lint         # run ESLint
npm run preview      # preview production build
```

Served at **https://www.amir.com/budget-app/**. Build uses `index.src.html` as the Vite entry (never overwritten), outputs to `dist/`, then copies `dist/index.src.html → index.html` and `dist/assets/ → assets/` for serving.

## Architecture

- **Data layer:** `src/storage.js` — all reads/writes to localStorage. Income and expense entries keyed by `budget_income_YYYY-MM` / `budget_expense_YYYY-MM`. Budget limits stored under `budget_limits` (persist across months).
- **State management:** React state only. `App.jsx` owns all state and passes handlers down. Month changes reload from localStorage via `changeMonth()`.
- **No routing:** Single view. Forms/settings open as sheet modals (`AddEntryModal`, `BudgetLimitsModal`).
- **CSS:** `src/index.css` uses CSS custom properties (`var(--bg)`, `var(--amber)`, etc.) and utility classes (`.card`, `.btn-primary`, `.inp`, `.anim-fade-up`). Tailwind is available but minimal — custom classes cover most needs.
- **Charts:** Recharts `BarChart` in `CategoryBreakdown.jsx`. `react-is` must be installed as a peer dep of recharts.

## Source Layout

```
src/
  constants.js          — CATEGORIES array + CAT_MAP lookup
  storage.js            — localStorage get/add/delete helpers
  utils.js              — monthKey, fmt (currency), budgetStatus, statusColor
  csvParse.js           — CSV import parsing logic
  App.jsx               — root; owns all state
  components/
    MonthNav.jsx        — prev/next month buttons
    SummaryCards.jsx    — 4 stat cards (income, expenses, net, % used)
    CategoryBreakdown.jsx — bar chart + per-category progress rows
    TransactionList.jsx — unified income+expense list, sorted by date
    AddEntryModal.jsx   — sheet modal for adding income or expense
    BudgetLimitsModal.jsx — sheet modal for setting per-category limits
    CategoriesModal.jsx — sheet modal for managing categories
    ImportModal.jsx     — sheet modal for CSV import
    YearView.jsx        — yearly summary view
```

## Core Data Model

```js
Income entry:  { id, source, amount, date }       // date: 'YYYY-MM-DD'
Expense entry: { id, category, description, amount, date }
Limits:        { [categoryId]: number }            // object, not array

Categories: housing | food | transport | health | entertainment | utilities | savings | other
```

## UI Conventions

- **Color-coded status:** green = under 80% of limit, yellow = 80–100%, red = over 100%
- **Status helpers:** `budgetStatus(spent, limit)` → `'ok'|'warn'|'over'|'none'`; `statusColor(status)` → CSS var string
- **Fonts:** DM Serif Display (headings, `.font-serif`), DM Mono (numbers, `.font-mono`), DM Sans (body)
- **Animations:** `.anim-fade-up .d0–.d7` staggered delays on mount
