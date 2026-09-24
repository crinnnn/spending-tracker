import { useState, useEffect } from 'react';
import { X, Check, Trash2, Calendar, Tag, Store, FileText } from 'lucide-react';
import { getCurrencySymbol } from '../utils/exportUtils';

const CATEGORIES = [
  'Food & Drink',
  'Shopping',
  'Transport',
  'Bills',
  'Entertainment',
  'Health',
  'Salary',
  'Income',
  'Other',
];

export default function EditTransactionModal({
  isOpen,
  transaction,
  currency = 'PHP',
  onClose,
  onSave,
  onDelete,
}) {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food & Drink',
    merchant: '',
    date: '',
    notes: '',
    isIncome: false,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      const isInc =
        transaction.category === 'Income' ||
        transaction.category === 'Salary' ||
        transaction.isIncome;
      setFormData({
        amount: Math.abs(Number(transaction.amount)) || '',
        category: transaction.category || (isInc ? 'Income' : 'Food & Drink'),
        merchant: transaction.merchant || '',
        date: transaction.date || new Date().toISOString().slice(0, 10),
        notes: transaction.notes || '',
        isIncome: isInc,
      });
      setError('');
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const numAmt = parseFloat(formData.amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    onSave({
      ...transaction,
      amount: numAmt,
      category: formData.category,
      merchant: formData.merchant.trim() || 'Unknown',
      date: formData.date,
      notes: formData.notes.trim(),
      isIncome: formData.isIncome || formData.category === 'Income' || formData.category === 'Salary',
      currency: transaction.currency || currency,
    });
    onClose();
  }

  function handleTypeChange(isIncome) {
    setFormData((prev) => ({
      ...prev,
      isIncome,
      category: isIncome
        ? prev.category === 'Salary' ? 'Salary' : 'Income'
        : prev.category === 'Income' || prev.category === 'Salary' ? 'Food & Drink' : prev.category,
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in">
      <div className="relative w-full max-w-md bg-white dark:bg-dark-card rounded-3xl border border-[#E6E6FA]/60 dark:border-dark-border shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E6E6FA]/40 dark:border-dark-border">
          <h2 className="text-lg font-bold text-[#4A4556] dark:text-dark-text">Edit Transaction</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9B93A9] hover:text-[#4A4556] dark:hover:text-dark-text hover:bg-[#FDFBF7] dark:hover:bg-dark-bg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Income vs Expense Pill Toggle */}
          <div className="flex rounded-xl bg-[#FDFBF7] dark:bg-dark-bg p-1 border border-[#E6E6FA]/50 dark:border-dark-border">
            <button
              type="button"
              onClick={() => handleTypeChange(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !formData.isIncome
                  ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 shadow-xs'
                  : 'text-[#9B93A9] dark:text-dark-muted hover:text-[#4A4556]'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                formData.isIncome
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-[#9B93A9] dark:text-dark-muted hover:text-[#4A4556]'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider mb-1.5">
              Amount ({getCurrencySymbol(currency)})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#9B93A9]">
                {getCurrencySymbol(currency)}
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-base font-bold text-[#4A4556] dark:text-dark-text focus:ring-2 focus:ring-[#E6E6FA] transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag size={12} /> Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-sm font-medium text-[#4A4556] dark:text-dark-text focus:ring-2 focus:ring-[#E6E6FA] transition-all cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Merchant / Payee */}
          <div>
            <label className="block text-xs font-semibold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Store size={12} /> Merchant / Source
            </label>
            <input
              type="text"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-sm text-[#4A4556] dark:text-dark-text focus:ring-2 focus:ring-[#E6E6FA] transition-all"
              placeholder="e.g. Starbucks, Meralco, Employer"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-sm text-[#4A4556] dark:text-dark-text focus:ring-2 focus:ring-[#E6E6FA] transition-all cursor-pointer"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText size={12} /> Description / Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-sm text-[#4A4556] dark:text-dark-text focus:ring-2 focus:ring-[#E6E6FA] transition-all"
              placeholder="e.g. Dinner with team, Groceries"
            />
          </div>

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete this transaction?')) {
                    onDelete(transaction.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 size={15} /> Delete
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#E6E6FA]/80 dark:border-dark-border text-xs font-semibold text-[#9B93A9] hover:text-[#4A4556] dark:hover:text-dark-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/30 dark:to-[#E0F4F1]/30 text-xs font-bold text-[#4A4556] dark:text-dark-text shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={15} /> Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
