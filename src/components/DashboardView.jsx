import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Sparkles,
  Plus,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Trash2,
  Edit3,
  Sliders,
  AlertTriangle,
  Tag,
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../utils/exportUtils';

const CAT_COLORS = {
  'Food & Drink': '#FCE4EC',
  Shopping: '#E6E6FA',
  Transport: '#E0F4F1',
  Bills: '#FFF9C4',
  Utilities: '#FFF9C4',
  Entertainment: '#F3E5F5',
  Health: '#E8F5E9',
  Salary: '#E0F4F1',
  Freelance: '#E0F4F1',
  Business: '#E0F4F1',
  Investment: '#E0F4F1',
  Gift: '#E0F4F1',
  Income: '#E0F4F1',
  Other: '#ECEFF1',
};

const CAT_EMOJIS = {
  'Food & Drink': '🍔',
  Shopping: '🛍️',
  Transport: '🚗',
  Bills: '⚡',
  Utilities: '⚡',
  Entertainment: '🎮',
  Health: '💊',
  Salary: '💰',
  Freelance: '💻',
  Business: '🏢',
  Investment: '📈',
  Gift: '🎁',
  Income: '💰',
  Other: '📦',
};

export default function DashboardView({
  transactions = [],
  budgets = {},
  currency = 'PHP',
  setActiveTab,
  onOpenAdvisor,
  onOpenBudgets,
  onEditTransaction,
  onDeleteTransaction,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'expense' | 'income'
  const [filterCategory, setFilterCategory] = useState('all');

  /* Core financial aggregates */
  const {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    categoryData,
    categoryMap,
    topExpenseCategory,
  } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const catMap = {};

    transactions.forEach((tx) => {
      const amt = Math.abs(Number(tx.amount)) || 0;
      const isInc = tx.category === 'Income' || tx.category === 'Salary' || tx.isIncome;
      if (isInc) {
        inc += amt;
      } else {
        exp += amt;
        const cat = tx.category || 'Other';
        catMap[cat] = (catMap[cat] || 0) + amt;
      }
    });

    const net = inc - exp;
    const rate = inc > 0 ? Math.round((net / inc) * 100) : 0;

    const catArray = Object.entries(catMap)
      .map(([name, amount]) => ({
        name,
        amount,
        pct: exp > 0 ? Math.round((amount / exp) * 100) : 0,
        color: CAT_COLORS[name] || '#E6E6FA',
        emoji: CAT_EMOJIS[name] || '🏷️',
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome: inc,
      totalExpenses: exp,
      netSavings: net,
      savingsRate: rate,
      categoryData: catArray,
      categoryMap: catMap,
      topExpenseCategory: catArray[0] || null,
    };
  }, [transactions]);

  /* Overall monthly budget calculation */
  const { totalBudgetCap, totalBudgetSpent, overallBudgetPct } = useMemo(() => {
    const cap = Object.values(budgets).reduce((sum, v) => sum + (Number(v) || 0), 0);
    const spent = totalExpenses;
    const pct = cap > 0 ? Math.round((spent / cap) * 100) : 0;
    return {
      totalBudgetCap: cap,
      totalBudgetSpent: spent,
      overallBudgetPct: pct,
    };
  }, [budgets, totalExpenses]);

  /* Filtered transactions */
  const filteredTxs = useMemo(() => {
    return transactions
      .filter((tx) => {
        const isInc = tx.category === 'Income' || tx.category === 'Salary' || tx.isIncome;
        if (filterType === 'expense' && isInc) return false;
        if (filterType === 'income' && !isInc) return false;
        if (filterCategory !== 'all' && tx.category !== filterCategory) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNotes = (tx.notes || '').toLowerCase().includes(q);
          const matchMerchant = (tx.merchant || '').toLowerCase().includes(q);
          const matchCat = (tx.category || '').toLowerCase().includes(q);
          return matchNotes || matchMerchant || matchCat;
        }
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [transactions, filterType, filterCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#4A4556] dark:text-dark-text tracking-tight">
            Good day 👋
          </h1>
          <p className="text-[#9B93A9] dark:text-dark-muted mt-1 text-sm sm:text-base">
            Live overview of your expenses, budgets & AI advice
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('add')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/25 dark:to-[#E0F4F1]/25 text-xs font-bold text-[#4A4556] dark:text-dark-text shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
          >
            <Plus size={15} /> Add Expense
          </button>
          <button
            onClick={onOpenBudgets}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-dark-card border border-[#E6E6FA] dark:border-dark-border text-xs font-semibold text-[#4A4556] dark:text-dark-text shadow-xs hover:bg-[#E6E6FA]/20 transition-colors cursor-pointer"
          >
            <Sliders size={14} /> Budgets
          </button>
          <button
            onClick={onOpenAdvisor}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FCE4EC] to-[#E6E6FA] dark:from-[#FCE4EC]/20 dark:to-[#E6E6FA]/20 text-xs font-bold text-[#4A4556] dark:text-dark-text shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
          >
            <Sparkles size={14} /> AI Advisor
          </button>
        </div>
      </div>

      {/* ── Net Balance Banner Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#E6E6FA] via-[#E0F4F1] to-[#FCE4EC] dark:from-[#E6E6FA]/20 dark:via-[#E0F4F1]/20 dark:to-[#FCE4EC]/20 p-6 sm:p-8 shadow-sm">
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/25 dark:bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -bottom-10 w-36 h-36 rounded-full bg-white/20 dark:bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-[#4A4556]/70 dark:text-dark-text/70 uppercase tracking-wider">
              Net Balance
            </p>
            <p className="text-3xl sm:text-5xl font-black text-[#4A4556] dark:text-dark-text mt-2 tracking-tight">
              {formatCurrency(netSavings, currency)}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 bg-white/70 dark:bg-dark-card/70 backdrop-blur text-[#4A4556] dark:text-dark-text text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
                {savingsRate >= 0 ? (
                  <TrendingUp size={13} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown size={13} className="text-rose-500" />
                )}
                {savingsRate}% savings rate
              </span>
              <span className="text-xs text-[#4A4556]/70 dark:text-dark-muted font-medium">
                {transactions.length} recorded transaction{transactions.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2">
            <button
              onClick={() => setActiveTab('add')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-dark-card/80 hover:bg-white dark:hover:bg-dark-card text-xs font-bold text-[#4A4556] dark:text-dark-text shadow-sm transition-all cursor-pointer text-center"
            >
              + Quick Add
            </button>
            <button
              onClick={onOpenAdvisor}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-[#E6E6FA]/60 dark:bg-[#E6E6FA]/20 hover:bg-[#E6E6FA]/80 text-xs font-bold text-[#4A4556] dark:text-dark-text shadow-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              <Sparkles size={13} /> Get AI Advice
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Income */}
        <div className="rounded-2xl p-4 sm:p-5 shadow-sm bg-[#E0F4F1]/60 dark:bg-[#E0F4F1]/10 border border-[#E0F4F1] dark:border-[#E0F4F1]/20">
          <p className="text-[11px] font-bold text-[#2C6B63] dark:text-emerald-300 uppercase tracking-wider">Income</p>
          <p className="text-xl sm:text-2xl font-black text-[#4A4556] dark:text-dark-text mt-1 truncate">
            {formatCurrency(totalIncome, currency)}
          </p>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <TrendingUp size={12} /> Total earned
          </span>
        </div>

        {/* Expenses */}
        <div className="rounded-2xl p-4 sm:p-5 shadow-sm bg-[#FCE4EC]/60 dark:bg-[#FCE4EC]/10 border border-[#FCE4EC] dark:border-[#FCE4EC]/20">
          <p className="text-[11px] font-bold text-[#8C4A60] dark:text-rose-300 uppercase tracking-wider">Expenses</p>
          <p className="text-xl sm:text-2xl font-black text-[#4A4556] dark:text-dark-text mt-1 truncate">
            {formatCurrency(totalExpenses, currency)}
          </p>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-500 dark:text-rose-400 mt-1">
            <TrendingDown size={12} /> Total spent
          </span>
        </div>

        {/* Savings / Budget Load */}
        <div className="rounded-2xl p-4 sm:p-5 shadow-sm bg-[#E6E6FA]/60 dark:bg-[#E6E6FA]/10 border border-[#E6E6FA] dark:border-[#E6E6FA]/20">
          <p className="text-[11px] font-bold text-[#574C78] dark:text-purple-300 uppercase tracking-wider">Net Retained</p>
          <p className="text-xl sm:text-2xl font-black text-[#4A4556] dark:text-dark-text mt-1 truncate">
            {formatCurrency(netSavings, currency)}
          </p>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-purple-600 dark:text-purple-300 mt-1">
            ⚖️ Retained capital
          </span>
        </div>
      </div>

      {/* ── Category Budgets Progress Card ── */}
      {totalBudgetCap > 0 && (
        <div className="rounded-2xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-indigo-500" />
              <h3 className="text-sm font-bold text-[#4A4556] dark:text-dark-text">Monthly Budget Status</h3>
            </div>
            <button
              onClick={onOpenBudgets}
              className="text-xs font-semibold text-indigo-500 dark:text-indigo-300 hover:underline cursor-pointer"
            >
              Adjust Limits →
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9B93A9] dark:text-dark-muted">
              Spent {formatCurrency(totalBudgetSpent, currency)} of {formatCurrency(totalBudgetCap, currency)}
            </span>
            <span
              className={`font-bold ${
                overallBudgetPct > 100
                  ? 'text-rose-500'
                  : overallBudgetPct >= 80
                  ? 'text-amber-500'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {overallBudgetPct}% budget spent
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#FDFBF7] dark:bg-dark-bg overflow-hidden border border-[#E6E6FA]/30 dark:border-dark-border">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallBudgetPct > 100 ? 'bg-rose-500' : overallBudgetPct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(overallBudgetPct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* ── AI Advisor Snapshot Box ── */}
      <div className="rounded-2xl bg-gradient-to-r from-white via-white to-[#E6E6FA]/20 dark:from-dark-card dark:to-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E6E6FA] to-[#FCE4EC] dark:from-[#E6E6FA]/30 dark:to-[#FCE4EC]/30 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={20} className="text-[#4A4556] dark:text-dark-text" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#4A4556] dark:text-dark-text">AI Financial Health & Insights</h3>
              <p className="text-xs sm:text-sm text-[#9B93A9] dark:text-dark-muted mt-1 leading-relaxed max-w-xl">
                {topExpenseCategory
                  ? `Your highest expenditure category is ${topExpenseCategory.name} (${formatCurrency(topExpenseCategory.amount, currency)}, ${topExpenseCategory.pct}% of spending). Get a personalized financial health score and savings coaching.`
                  : "Start logging transactions or scan a receipt to receive AI financial coaching and budget optimizations!"}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAdvisor}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/25 dark:to-[#E0F4F1]/25 text-xs font-bold text-[#4A4556] dark:text-dark-text hover:opacity-95 transition-opacity shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Sparkles size={14} /> Consult AI Coach
          </button>
        </div>
      </div>

      {/* ── Dynamic Category Breakdown ── */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#4A4556] dark:text-dark-text">Spending by Category</h3>
          <button
            onClick={() => setActiveTab('analytics')}
            className="text-xs font-semibold text-indigo-500 dark:text-indigo-300 hover:underline cursor-pointer"
          >
            Full Analytics →
          </button>
        </div>

        {categoryData.length === 0 ? (
          <p className="text-xs text-[#9B93A9] dark:text-dark-muted py-2">
            No expense categories recorded yet.
          </p>
        ) : (
          <>
            <div className="flex rounded-full overflow-hidden h-3.5 bg-[#FDFBF7] dark:bg-dark-bg p-0.5 border border-[#E6E6FA]/30 dark:border-dark-border">
              {categoryData.map((c) => (
                <div
                  key={c.name}
                  className="transition-all duration-500 rounded-xs"
                  style={{ width: `${Math.max(c.pct, 3)}%`, backgroundColor: c.color }}
                  title={`${c.name}: ${formatCurrency(c.amount, currency)} (${c.pct}%)`}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
              {categoryData.map((c) => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs text-[#4A4556] dark:text-dark-text">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[#9B93A9] dark:text-dark-muted">{c.emoji}</span>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-[#9B93A9] dark:text-dark-muted font-bold">({c.pct}%)</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Recent Transactions with Search & Edit ── */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 pb-3 space-y-3 border-b border-[#E6E6FA]/40 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#4A4556] dark:text-dark-text">Transactions</h3>
              <p className="text-xs text-[#9B93A9] dark:text-dark-muted mt-0.5">
                {filteredTxs.length} record{filteredTxs.length === 1 ? '' : 's'} found
              </p>
            </div>
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs font-semibold text-indigo-500 dark:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View in Calendar <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B93A9]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by merchant, note, or category…"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-xs text-[#4A4556] dark:text-dark-text focus:ring-2 focus:ring-[#E6E6FA] transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-xs font-medium text-[#4A4556] dark:text-dark-text"
              >
                <option value="all">All Types</option>
                <option value="expense">Expenses Only</option>
                <option value="income">Income Only</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-xs font-medium text-[#4A4556] dark:text-dark-text"
              >
                <option value="all">All Categories</option>
                {Object.keys(CAT_EMOJIS).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredTxs.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-medium text-[#4A4556] dark:text-dark-text">No matching transactions found</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterCategory('all');
              }}
              className="text-xs text-indigo-500 font-semibold cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-[#E6E6FA]/20 dark:divide-dark-border/50">
            {filteredTxs.slice(0, 15).map((tx) => {
              const isInc = tx.category === 'Income' || tx.category === 'Salary' || tx.isIncome;
              const emoji = CAT_EMOJIS[tx.category] || (isInc ? '💰' : '💸');
              const bgColor = CAT_COLORS[tx.category] || '#E6E6FA';

              return (
                <li
                  key={tx.id}
                  className="flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-[#FDFBF7] dark:hover:bg-dark-bg/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0 shadow-xs"
                      style={{ backgroundColor: bgColor }}
                    >
                      {emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#4A4556] dark:text-dark-text truncate">
                        {tx.notes || tx.merchant || tx.category}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#9B93A9] dark:text-dark-muted">
                        <span className="font-medium">{tx.category}</span>
                        {tx.merchant && tx.merchant !== 'Unknown' && (
                          <>
                            <span>·</span>
                            <span>{tx.merchant}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-sm font-bold whitespace-nowrap ${
                          isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#4A4556] dark:text-dark-text'
                        }`}
                      >
                        {isInc ? '+' : '-'}
                        {formatCurrency(tx.amount, tx.currency || currency)}
                      </span>
                      <span className="block text-[10px] text-[#9B93A9] dark:text-dark-muted uppercase font-semibold">
                        {tx.currency || currency}
                      </span>
                    </div>

                    <button
                      onClick={() => onEditTransaction(tx)}
                      title="Edit transaction"
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9B93A9] hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
                    >
                      <Edit3 size={14} />
                    </button>

                    {onDeleteTransaction && (
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        title="Delete transaction"
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9B93A9] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
