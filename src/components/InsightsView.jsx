import { useMemo } from 'react';
import {
  PieChart,
  Calendar as CalendarIcon,
  Sparkles,
  Sliders,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '../utils/exportUtils';

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

export default function InsightsView({
  transactions = [],
  budgets = {},
  currency = 'PHP',
  setActiveTab,
  onOpenAdvisor,
  onOpenBudgets,
}) {
  const {
    monthlyData,
    categoryBreakdown,
    avgSpend,
    maxExpense,
    totalVolume,
    totalCount,
    expenseCount,
  } = useMemo(() => {
    const monthMap = {};
    const catMap = {};
    let totalExp = 0;
    let maxExp = { amount: 0, merchant: 'None' };

    transactions.forEach((tx) => {
      const amt = Math.abs(Number(tx.amount)) || 0;
      const isInc = tx.category === 'Income' || tx.category === 'Salary' || tx.isIncome;
      const mKey = (tx.date || '').slice(0, 7) || 'Current';

      if (!isInc) {
        totalExp += amt;
        monthMap[mKey] = (monthMap[mKey] || 0) + amt;
        catMap[tx.category || 'Other'] = (catMap[tx.category || 'Other'] || 0) + amt;

        if (amt > maxExp.amount) {
          maxExp = { amount: amt, merchant: tx.merchant || tx.notes || tx.category };
        }
      }
    });

    const mKeys = Object.keys(monthMap).sort();
    const mData = mKeys.map((k) => ({
      month: k,
      amount: monthMap[k],
    }));

    const catList = Object.entries(catMap)
      .map(([name, amount]) => ({
        name,
        amount,
        pct: totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0,
        color: CAT_COLORS[name] || '#E6E6FA',
        emoji: CAT_EMOJIS[name] || '📦',
        budget: budgets[name] || 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const expCount = transactions.filter(
      (t) => !(t.category === 'Income' || t.category === 'Salary' || t.isIncome)
    ).length;

    return {
      monthlyData: mData.length > 0 ? mData : [{ month: 'Current', amount: 0 }],
      categoryBreakdown: catList,
      avgSpend: expCount > 0 ? Math.round(totalExp / expCount) : 0,
      maxExpense: maxExp,
      totalVolume: totalExp,
      totalCount: transactions.length,
      expenseCount: expCount,
    };
  }, [transactions, budgets]);

  const maxMonthVal = Math.max(...monthlyData.map((m) => m.amount), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#4A4556] dark:text-dark-text tracking-tight">
            Spending Insights
          </h1>
          <p className="text-[#9B93A9] dark:text-dark-muted mt-1 text-sm">
            Deep dive into trends, category allocations, and budget health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBudgets}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-dark-card border border-[#E6E6FA] dark:border-dark-border text-xs font-bold text-[#4A4556] dark:text-dark-text shadow-xs hover:bg-[#E6E6FA]/20 cursor-pointer flex items-center gap-1.5"
          >
            <Sliders size={14} /> Budgets
          </button>
          <button
            onClick={onOpenAdvisor}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/25 dark:to-[#E0F4F1]/25 text-xs font-bold text-[#4A4556] dark:text-dark-text shadow-xs hover:opacity-95 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles size={14} /> AI Analysis
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-4 shadow-sm">
          <p className="text-[10px] font-bold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider">
            Avg Transaction
          </p>
          <p className="text-lg font-black text-[#4A4556] dark:text-dark-text mt-1">
            {formatCurrency(avgSpend, currency)}
          </p>
          <span className="text-[10px] text-[#9B93A9]">{expenseCount} expense records</span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-4 shadow-sm">
          <p className="text-[10px] font-bold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider">
            Largest Expense
          </p>
          <p className="text-lg font-black text-[#4A4556] dark:text-dark-text mt-1">
            {formatCurrency(maxExpense.amount, currency)}
          </p>
          <span className="text-[10px] text-[#9B93A9] dark:text-dark-muted truncate block">
            {maxExpense.merchant}
          </span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-4 shadow-sm">
          <p className="text-[10px] font-bold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider">
            Total Spent
          </p>
          <p className="text-lg font-black text-[#4A4556] dark:text-dark-text mt-1">
            {formatCurrency(totalVolume, currency)}
          </p>
          <span className="text-[10px] text-rose-500 font-semibold">Total outflow</span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-4 shadow-sm">
          <p className="text-[10px] font-bold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider">
            Total Records
          </p>
          <p className="text-lg font-black text-[#4A4556] dark:text-dark-text mt-1">
            {totalCount}
          </p>
          <span className="text-[10px] text-indigo-500 font-semibold">Active dataset</span>
        </div>
      </div>

      {/* Dynamic Monthly Spending Timeline */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-[#4A4556] dark:text-dark-text">Monthly Expense Timeline</h3>
            <p className="text-xs text-[#9B93A9] dark:text-dark-muted">Comparing total expenses across billing periods</p>
          </div>
          <span className="text-xs text-[#9B93A9] dark:text-dark-muted bg-[#FDFBF7] dark:bg-dark-bg px-3 py-1 rounded-full border border-[#E6E6FA]/40 dark:border-dark-border">
            {monthlyData.length} active period{monthlyData.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex items-end justify-between gap-3 h-44 pt-4">
          {monthlyData.map((m) => {
            const heightPx = Math.max(Math.round((m.amount / maxMonthVal) * 120), 14);
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-[#4A4556] dark:text-dark-text truncate">
                  {formatCurrency(m.amount, currency)}
                </span>
                <div className="w-full relative flex items-end justify-center">
                  <div
                    className="w-full max-w-[48px] rounded-xl bg-gradient-to-t from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/30 dark:to-[#E0F4F1]/30 transition-all duration-500 hover:scale-105"
                    style={{ height: `${heightPx}px` }}
                  />
                </div>
                <span className="text-[11px] text-[#9B93A9] dark:text-dark-muted font-medium">
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown & Budget Comparison */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#4A4556] dark:text-dark-text flex items-center gap-2">
            <PieChart size={16} /> Category Spending vs. Budgets
          </h3>
          <button
            onClick={onOpenBudgets}
            className="text-xs font-semibold text-indigo-500 dark:text-indigo-300 hover:underline cursor-pointer"
          >
            Set Category Limits →
          </button>
        </div>

        <div className="space-y-4 pt-1">
          {categoryBreakdown.map((c) => {
            const hasBudget = c.budget > 0;
            const budgetPct = hasBudget ? Math.round((c.amount / c.budget) * 100) : null;
            const isOverBudget = hasBudget && c.amount > c.budget;

            return (
              <div key={c.name} className="p-3 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg/60 border border-[#E6E6FA]/50 dark:border-dark-border">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-[#4A4556] dark:text-dark-text flex items-center gap-1.5">
                    <span>{c.emoji}</span>
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-[#9B93A9] dark:text-dark-muted font-normal">({c.pct}% of total)</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[#4A4556] dark:text-dark-text font-black">
                      {formatCurrency(c.amount, currency)}
                    </span>

                    {hasBudget && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isOverBudget
                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                            : budgetPct >= 80
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        }`}
                      >
                        {isOverBudget && <AlertTriangle size={10} />}
                        {budgetPct}% of {formatCurrency(c.budget, currency)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-2 rounded-full bg-white dark:bg-dark-card overflow-hidden border border-[#E6E6FA]/30 dark:border-dark-border">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(hasBudget ? budgetPct : c.pct, 100)}%`,
                      backgroundColor: isOverBudget ? '#F43F5E' : c.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
