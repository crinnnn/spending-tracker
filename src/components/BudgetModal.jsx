import { useState, useEffect } from 'react';
import { X, Check, DollarSign, Sparkles, AlertTriangle } from 'lucide-react';
import { getCurrencySymbol, formatCurrency } from '../utils/exportUtils';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Drink', emoji: '🍔', defaultCap: 8000 },
  { name: 'Shopping', emoji: '🛍️', defaultCap: 4000 },
  { name: 'Transport', emoji: '🚗', defaultCap: 3000 },
  { name: 'Bills', emoji: '⚡', defaultCap: 5000 },
  { name: 'Entertainment', emoji: '🎮', defaultCap: 2000 },
  { name: 'Health', emoji: '💊', defaultCap: 1500 },
  { name: 'Other', emoji: '📦', defaultCap: 2000 },
];

export default function BudgetModal({
  isOpen,
  budgets = {},
  spendingByCategory = {},
  currency = 'PHP',
  onClose,
  onSaveBudgets,
}) {
  const [localBudgets, setLocalBudgets] = useState({});

  useEffect(() => {
    setLocalBudgets(budgets || {});
  }, [budgets, isOpen]);

  if (!isOpen) return null;

  function handleBudgetChange(category, val) {
    const num = parseFloat(val);
    setLocalBudgets((prev) => ({
      ...prev,
      [category]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  }

  function handleApplyDefaults() {
    const defaults = {};
    DEFAULT_CATEGORIES.forEach((c) => {
      defaults[c.name] = c.defaultCap;
    });
    setLocalBudgets(defaults);
  }

  function handleSave() {
    onSaveBudgets(localBudgets);
    onClose();
  }

  const totalBudget = Object.values(localBudgets).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const totalSpent = Object.values(spendingByCategory).reduce((sum, v) => sum + (Number(v) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-3xl border border-[#E6E6FA]/60 dark:border-dark-border shadow-2xl p-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E6E6FA]/40 dark:border-dark-border">
          <div>
            <h2 className="text-lg font-bold text-[#4A4556] dark:text-dark-text">Category Monthly Budgets</h2>
            <p className="text-xs text-[#9B93A9] dark:text-dark-muted mt-0.5">
              Set monthly spending targets to keep your finances on track
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9B93A9] hover:text-[#4A4556] dark:hover:text-dark-text hover:bg-[#FDFBF7] dark:hover:bg-dark-bg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Overall summary banner */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-[#E6E6FA]/40 via-[#E0F4F1]/30 to-[#FCE4EC]/30 dark:from-[#E6E6FA]/15 dark:to-[#FCE4EC]/15 border border-[#E6E6FA]/40 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider">
              Total Monthly Target
            </p>
            <p className="text-xl font-black text-[#4A4556] dark:text-dark-text">
              {formatCurrency(totalBudget, currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider">
              Current Spent
            </p>
            <p className={`text-sm font-bold ${totalSpent > totalBudget && totalBudget > 0 ? 'text-rose-500' : 'text-[#4A4556] dark:text-dark-text'}`}>
              {formatCurrency(totalSpent, currency)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end mt-2">
          <button
            type="button"
            onClick={handleApplyDefaults}
            className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Sparkles size={13} /> Auto-fill sensible defaults
          </button>
        </div>

        {/* Category Inputs List */}
        <div className="flex-1 overflow-y-auto pr-1 mt-3 space-y-3">
          {DEFAULT_CATEGORIES.map(({ name, emoji }) => {
            const currentLimit = localBudgets[name] || 0;
            const spent = spendingByCategory[name] || 0;
            const pct = currentLimit > 0 ? Math.round((spent / currentLimit) * 100) : 0;
            const isOver = currentLimit > 0 && spent > currentLimit;

            return (
              <div
                key={name}
                className="p-3.5 rounded-2xl bg-[#FDFBF7] dark:bg-dark-bg/60 border border-[#E6E6FA]/60 dark:border-dark-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{emoji}</span>
                    <span className="text-sm font-semibold text-[#4A4556] dark:text-dark-text">{name}</span>
                  </div>

                  {currentLimit > 0 && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isOver
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                          : pct >= 80
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}
                    >
                      {isOver && <AlertTriangle size={11} />}
                      {pct}% used
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9B93A9]">
                      {getCurrencySymbol(currency)}
                    </span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={currentLimit || ''}
                      onChange={(e) => handleBudgetChange(name, e.target.value)}
                      placeholder="No limit set"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border text-sm font-semibold text-[#4A4556] dark:text-dark-text focus:ring-2 focus:ring-[#E6E6FA] transition-all"
                    />
                  </div>

                  <span className="text-xs text-[#9B93A9] dark:text-dark-muted shrink-0">
                    Spent: <strong className="text-[#4A4556] dark:text-dark-text">{formatCurrency(spent, currency)}</strong>
                  </span>
                </div>

                {/* Mini progress bar if budget set */}
                {currentLimit > 0 && (
                  <div className="w-full bg-[#E6E6FA]/30 dark:bg-dark-border rounded-full h-1.5 mt-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver
                          ? 'bg-rose-500'
                          : pct >= 80
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E6E6FA]/40 dark:border-dark-border mt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#E6E6FA]/80 dark:border-dark-border text-xs font-semibold text-[#9B93A9] hover:text-[#4A4556] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/30 dark:to-[#E0F4F1]/30 text-xs font-bold text-[#4A4556] dark:text-dark-text shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={15} /> Save Budgets
          </button>
        </div>
      </div>
    </div>
  );
}
