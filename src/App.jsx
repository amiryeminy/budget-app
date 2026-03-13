import { useState, useCallback } from 'react';
import { monthKey } from './utils';
import {
  getIncome, addIncome, deleteIncome,
  getExpenses, addExpense, deleteExpense,
  getLimits, saveLimits, batchImport,
  getCategories, saveCategories,
} from './storage';
import { DEFAULT_CATEGORIES, makeCatMap } from './constants';

import MonthNav          from './components/MonthNav';
import SummaryCards      from './components/SummaryCards';
import CategoryBreakdown from './components/CategoryBreakdown';
import TransactionList   from './components/TransactionList';
import AddEntryModal     from './components/AddEntryModal';
import BudgetLimitsModal from './components/BudgetLimitsModal';
import ImportModal       from './components/ImportModal';
import CategoriesModal   from './components/CategoriesModal';

export default function App() {
  const [month,      setMonth]      = useState(() => monthKey(new Date()));
  const [income,     setIncome]     = useState(() => getIncome(monthKey(new Date())));
  const [expenses,   setExpenses]   = useState(() => getExpenses(monthKey(new Date())));
  const [limits,     setLimits]     = useState(() => getLimits());
  const [categories, setCategories] = useState(() => getCategories(DEFAULT_CATEGORIES));
  const [modal,      setModal]      = useState(null);

  const catMap = makeCatMap(categories);

  const changeMonth = useCallback(m => {
    setMonth(m);
    setIncome(getIncome(m));
    setExpenses(getExpenses(m));
  }, []);

  function handleAddIncome(entry) {
    addIncome(month, entry);
    setIncome(getIncome(month));
  }

  function handleAddExpense(entry) {
    addExpense(month, entry);
    setExpenses(getExpenses(month));
  }

  function handleDeleteIncome(id) {
    deleteIncome(month, id);
    setIncome(getIncome(month));
  }

  function handleDeleteExpense(id) {
    deleteExpense(month, id);
    setExpenses(getExpenses(month));
  }

  function handleSaveLimits(newLimits) {
    saveLimits(newLimits);
    setLimits(newLimits);
  }

  function handleSaveCategories(newCats) {
    saveCategories(newCats);
    setCategories(newCats);
  }

  function handleImport(byMonth) {
    batchImport(byMonth);
    // Refresh current month view
    setIncome(getIncome(month));
    setExpenses(getExpenses(month));
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 1rem 4rem' }}>
      {/* ── Header ─────────────────────────────── */}
      <header
        className="anim-fade-up d0"
        style={{
          padding: '2rem 0 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '1rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '1.3rem', color: 'var(--amber)' }}>◈</span>
            <h1
              className="font-serif"
              style={{ fontSize: '1.75rem', fontWeight: 400, color: 'var(--amber)', lineHeight: 1 }}
            >
              Budget
            </h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 38 }}>
            Monthly spending tracker
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
          <button className="btn-ghost" onClick={() => setModal('import')} style={{ fontSize: '0.82rem' }}>
            ↑ Import CSV
          </button>
          <button className="btn-ghost" onClick={() => setModal('categories')} style={{ fontSize: '0.82rem' }}>
            ✦ Categories
          </button>
          <button className="btn-ghost" onClick={() => setModal('limits')} style={{ fontSize: '0.82rem' }}>
            ⚙ Limits
          </button>
          <button className="btn-ghost" onClick={() => setModal('income')}>
            + Income
          </button>
          <button className="btn-primary" onClick={() => setModal('expense')}>
            + Expense
          </button>
        </div>
      </header>

      {/* ── Month navigation ───────────────────── */}
      <div className="anim-fade-up d1" style={{ marginBottom: '1.75rem' }}>
        <MonthNav month={month} onChange={changeMonth} />
      </div>

      {/* ── Summary cards ──────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <SummaryCards income={income} expenses={expenses} />
      </div>

      {/* ── Category breakdown + chart ─────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <CategoryBreakdown expenses={expenses} limits={limits} categories={categories} delay="d5" />
      </div>

      {/* ── Transaction list ───────────────────── */}
      <TransactionList
        income={income}
        expenses={expenses}
        catMap={catMap}
        onDeleteIncome={handleDeleteIncome}
        onDeleteExpense={handleDeleteExpense}
        delay="d6"
      />

      {/* ── Modals ─────────────────────────────── */}
      {modal === 'income' && (
        <AddEntryModal type="income" categories={categories} onSave={handleAddIncome} onClose={() => setModal(null)} />
      )}
      {modal === 'expense' && (
        <AddEntryModal type="expense" categories={categories} onSave={handleAddExpense} onClose={() => setModal(null)} />
      )}
      {modal === 'limits' && (
        <BudgetLimitsModal limits={limits} categories={categories} onSave={handleSaveLimits} onClose={() => setModal(null)} />
      )}
      {modal === 'import' && (
        <ImportModal categories={categories} onImport={handleImport} onClose={() => setModal(null)} />
      )}
      {modal === 'categories' && (
        <CategoriesModal categories={categories} onSave={handleSaveCategories} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
