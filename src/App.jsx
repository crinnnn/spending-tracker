import { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import DashboardView from './components/DashboardView';
import AddExpense from './components/AddExpense';
import CalendarView from './components/CalendarView';
import SubscriptionsView, { DEFAULT_SAMPLE_SUBSCRIPTIONS } from './components/SubscriptionsView';
import InsightsView from './components/InsightsView';
import ProfileView from './components/ProfileView';
import EditTransactionModal from './components/EditTransactionModal';
import BudgetModal from './components/BudgetModal';
import AIAdvisorModal from './components/AIAdvisorModal';
import api from './services/api';
import './App.css';

/* ── Initial Seed Transactions (September 2026) ── */
const INITIAL_TRANSACTIONS = [
  { id: 'tx-1', amount: 180, currency: 'PHP', category: 'Food & Drink', merchant: 'Starbucks', date: '2026-09-15', notes: 'Morning coffee' },
  { id: 'tx-2', amount: 1450, currency: 'PHP', category: 'Shopping', merchant: 'SM Supermarket', date: '2026-09-14', notes: 'Weekly groceries' },
  { id: 'tx-3', amount: 25000, currency: 'PHP', category: 'Income', merchant: 'Freelance Client', date: '2026-09-10', notes: 'UI design milestone' },
  { id: 'tx-4', amount: 3500, currency: 'PHP', category: 'Bills', merchant: 'Meralco', date: '2026-09-07', notes: 'Electric bill' },
  { id: 'tx-5', amount: 550, currency: 'PHP', category: 'Entertainment', merchant: 'Netflix', date: '2026-09-03', notes: 'Monthly subscription' },
  { id: 'tx-6', amount: 45000, currency: 'PHP', category: 'Income', merchant: 'Company Payroll', date: '2026-09-01', notes: 'Monthly salary' },
];

const INITIAL_BUDGETS = {
  'Food & Drink': 8000,
  Shopping: 4000,
  Transport: 3000,
  Bills: 5000,
  Entertainment: 2000,
  Health: 1500,
  Other: 2000,
};

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [backendConnected, setBackendConnected] = useState(false);

  /* ── Dark Mode ── */
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('spendwise-dark') === 'true';
    } catch {
      return false;
    }
  });

  function toggleDarkMode(setter) {
    if (typeof setter === 'function') {
      setDarkMode((prev) => {
        const next = setter(prev);
        try { localStorage.setItem('spendwise-dark', String(next)); } catch {}
        return next;
      });
    } else {
      setDarkMode(setter);
      try { localStorage.setItem('spendwise-dark', String(setter)); } catch {}
    }
  }

  /* ── Currency Preference ── */
  const [currency, setCurrency] = useState(() => {
    try {
      return localStorage.getItem('spendwise-currency') || 'PHP';
    } catch {
      return 'PHP';
    }
  });

  function handleCurrencyChange(newCurrency) {
    setCurrency(newCurrency);
    try {
      localStorage.setItem('spendwise-currency', newCurrency);
    } catch {}
    api.updateSettings({ currency: newCurrency }).catch(() => {});
  }

  /* ── Transactions State ── */
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('spendwise-transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  /* ── Budgets State ── */
  const [budgets, setBudgets] = useState(() => {
    try {
      const saved = localStorage.getItem('spendwise-budgets');
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  /* ── Subscriptions State ── */
  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const saved = localStorage.getItem('spendwise-subscriptions');
      return saved ? JSON.parse(saved) : DEFAULT_SAMPLE_SUBSCRIPTIONS;
    } catch {
      return DEFAULT_SAMPLE_SUBSCRIPTIONS;
    }
  });

  /* ── Backend Sync on Mount ── */
  useEffect(() => {
    async function loadData() {
      try {
        const isHealthy = await api.checkHealth();
        if (isHealthy) {
          setBackendConnected(true);
          const [backendTx, backendBudgets, backendSubs, backendSettings] = await Promise.all([
            api.getTransactions().catch(() => null),
            api.getBudgets().catch(() => null),
            api.getSubscriptions().catch(() => null),
            api.getSettings().catch(() => null),
          ]);

          if (backendTx && Array.isArray(backendTx) && backendTx.length > 0) {
            setTransactions(backendTx);
            try { localStorage.setItem('spendwise-transactions', JSON.stringify(backendTx)); } catch {}
          }
          if (backendBudgets && typeof backendBudgets === 'object' && Object.keys(backendBudgets).length > 0) {
            setBudgets(backendBudgets);
            try { localStorage.setItem('spendwise-budgets', JSON.stringify(backendBudgets)); } catch {}
          }
          if (backendSubs && Array.isArray(backendSubs) && backendSubs.length > 0) {
            setSubscriptions(backendSubs);
            try { localStorage.setItem('spendwise-subscriptions', JSON.stringify(backendSubs)); } catch {}
          }
          if (backendSettings && backendSettings.currency) {
            setCurrency(backendSettings.currency);
            try { localStorage.setItem('spendwise-currency', backendSettings.currency); } catch {}
          }
        }
      } catch (err) {
        console.warn('Backend synchronization notice:', err.message);
      }
    }

    loadData();
  }, []);

  /* ── Modals State ── */
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);

  /* ── Transaction CRUD ── */
  function handleSaveExpense(parsed) {
    const newTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...parsed,
    };
    setTransactions((prev) => {
      const updated = [newTx, ...prev];
      try {
        localStorage.setItem('spendwise-transactions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    api.createTransaction(newTx).catch((err) => console.warn('Failed to persist tx to backend:', err));
  }

  function handleUpdateTransaction(updatedTx) {
    setTransactions((prev) => {
      const updated = prev.map((tx) => (tx.id === updatedTx.id ? updatedTx : tx));
      try {
        localStorage.setItem('spendwise-transactions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setEditingTransaction(null);
    api.updateTransaction(updatedTx.id, updatedTx).catch((err) => console.warn('Failed to update tx on backend:', err));
  }

  function handleDeleteTransaction(id) {
    setTransactions((prev) => {
      const updated = prev.filter((tx) => tx.id !== id);
      try {
        localStorage.setItem('spendwise-transactions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    api.deleteTransaction(id).catch((err) => console.warn('Failed to delete tx on backend:', err));
  }

  /* ── Budgets CRUD ── */
  function handleSaveBudgets(newBudgets) {
    setBudgets(newBudgets);
    try {
      localStorage.setItem('spendwise-budgets', JSON.stringify(newBudgets));
    } catch {}
    api.updateBudgets(newBudgets).catch((err) => console.warn('Failed to update budgets on backend:', err));
  }

  /* ── Subscriptions CRUD ── */
  function handleSaveSubscription(newSub) {
    setSubscriptions((prev) => {
      const updated = [newSub, ...prev];
      try {
        localStorage.setItem('spendwise-subscriptions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    api.createSubscription(newSub).catch((err) => console.warn('Failed to save subscription on backend:', err));
  }

  function handleDeleteSubscription(id) {
    setSubscriptions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('spendwise-subscriptions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    api.deleteSubscription(id).catch((err) => console.warn('Failed to delete subscription on backend:', err));
  }

  /* ── Backup Restore & Reset ── */
  async function handleRestoreData(data) {
    if (data.transactions) {
      setTransactions(data.transactions);
      try {
        localStorage.setItem('spendwise-transactions', JSON.stringify(data.transactions));
      } catch {}
    }
    if (data.budgets) {
      setBudgets(data.budgets);
      try {
        localStorage.setItem('spendwise-budgets', JSON.stringify(data.budgets));
      } catch {}
    }
    if (data.subscriptions) {
      setSubscriptions(data.subscriptions);
      try {
        localStorage.setItem('spendwise-subscriptions', JSON.stringify(data.subscriptions));
      } catch {}
    }
    try {
      await api.restoreDatabase(data);
    } catch (err) {
      console.warn('Backend restore notice:', err.message);
    }
  }

  async function handleResetData() {
    if (window.confirm('Reset all transactions and budgets to the default sample dataset?')) {
      setTransactions(INITIAL_TRANSACTIONS);
      setBudgets(INITIAL_BUDGETS);
      setSubscriptions(DEFAULT_SAMPLE_SUBSCRIPTIONS);
      try {
        localStorage.setItem('spendwise-transactions', JSON.stringify(INITIAL_TRANSACTIONS));
        localStorage.setItem('spendwise-budgets', JSON.stringify(INITIAL_BUDGETS));
        localStorage.setItem('spendwise-subscriptions', JSON.stringify(DEFAULT_SAMPLE_SUBSCRIPTIONS));
      } catch {}
      try {
        await api.resetDatabase();
      } catch (err) {
        console.warn('Backend reset notice:', err.message);
      }
    }
  }

  /* Spending by category map for budget comparisons */
  const spendingByCategory = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      const isInc = tx.category === 'Income' || tx.category === 'Salary' || tx.isIncome;
      if (!isInc) {
        const cat = tx.category || 'Other';
        map[cat] = (map[cat] || 0) + (Math.abs(Number(tx.amount)) || 0);
      }
    });
    return map;
  }, [transactions]);

  /* Views mapping */
  const views = {
    home: (
      <DashboardView
        transactions={transactions}
        budgets={budgets}
        currency={currency}
        setActiveTab={setActiveTab}
        onOpenAdvisor={() => setIsAdvisorModalOpen(true)}
        onOpenBudgets={() => setIsBudgetModalOpen(true)}
        onEditTransaction={(tx) => setEditingTransaction(tx)}
        onDeleteTransaction={handleDeleteTransaction}
      />
    ),
    add: (
      <AddExpense
        currency={currency}
        onSave={handleSaveExpense}
        setActiveTab={setActiveTab}
      />
    ),
    calendar: (
      <CalendarView
        transactions={transactions}
        currency={currency}
        onAddTransaction={handleSaveExpense}
        onDeleteTransaction={handleDeleteTransaction}
      />
    ),
    subscriptions: (
      <SubscriptionsView
        subscriptions={subscriptions}
        currency={currency}
        onSaveSubscription={handleSaveSubscription}
        onDeleteSubscription={handleDeleteSubscription}
        onLogExpense={handleSaveExpense}
      />
    ),
    analytics: (
      <InsightsView
        transactions={transactions}
        budgets={budgets}
        currency={currency}
        setActiveTab={setActiveTab}
        onOpenAdvisor={() => setIsAdvisorModalOpen(true)}
        onOpenBudgets={() => setIsBudgetModalOpen(true)}
      />
    ),
    profile: (
      <ProfileView
        transactions={transactions}
        budgets={budgets}
        subscriptions={subscriptions}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        onResetData={handleResetData}
        onRestoreData={handleRestoreData}
      />
    ),
  };

  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={toggleDarkMode}
        currency={currency}
        backendConnected={backendConnected}
      >
        {views[activeTab] || views.home}
      </Layout>

      {/* ── Global Modals ── */}
      <EditTransactionModal
        isOpen={Boolean(editingTransaction)}
        transaction={editingTransaction}
        currency={currency}
        onClose={() => setEditingTransaction(null)}
        onSave={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        budgets={budgets}
        spendingByCategory={spendingByCategory}
        currency={currency}
        onClose={() => setIsBudgetModalOpen(false)}
        onSaveBudgets={handleSaveBudgets}
      />

      <AIAdvisorModal
        isOpen={isAdvisorModalOpen}
        transactions={transactions}
        budgets={budgets}
        currency={currency}
        onClose={() => setIsAdvisorModalOpen(false)}
      />
    </>
  );
}

export default App;
