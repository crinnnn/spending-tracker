import { useState } from 'react';
import {
  CalendarClock,
  Plus,
  Trash2,
  Check,
  Zap,
  ArrowUpRight,
  Sparkles,
  CreditCard,
  BellRing,
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../utils/exportUtils';

const DEFAULT_SAMPLE_SUBSCRIPTIONS = [
  { id: 'sub-1', name: 'Netflix Premium', amount: 550, category: 'Entertainment', cycle: 'monthly', billingDay: 3 },
  { id: 'sub-2', name: 'Spotify Duo', amount: 199, category: 'Entertainment', cycle: 'monthly', billingDay: 18 },
  { id: 'sub-3', name: 'Home Fiber Internet', amount: 1899, category: 'Bills', cycle: 'monthly', billingDay: 25 },
  { id: 'sub-4', name: 'Gym Membership', amount: 1500, category: 'Health', cycle: 'monthly', billingDay: 1 },
];

const CAT_EMOJIS = {
  Entertainment: '🎮',
  Bills: '⚡',
  Shopping: '🛍️',
  Health: '💊',
  'Food & Drink': '🍔',
  Other: '📦',
};

export default function SubscriptionsView({
  subscriptions = [],
  currency = 'PHP',
  onSaveSubscription,
  onDeleteSubscription,
  onLogExpense,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [cycle, setCycle] = useState('monthly');
  const [billingDay, setBillingDay] = useState('1');
  const [loggedId, setLoggedId] = useState(null);

  const totalMonthlyCommitment = subscriptions.reduce((sum, s) => {
    const amt = Number(s.amount) || 0;
    return sum + (s.cycle === 'yearly' ? amt / 12 : amt);
  }, 0);

  const totalYearlyCommitment = totalMonthlyCommitment * 12;

  function handleCreate(e) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!name.trim() || isNaN(num) || num <= 0) return;

    onSaveSubscription({
      id: `sub-${Date.now()}`,
      name: name.trim(),
      amount: num,
      category,
      cycle,
      billingDay: parseInt(billingDay, 10) || 1,
    });

    setName('');
    setAmount('');
    setIsAdding(false);
  }

  function handleQuickLog(sub) {
    const today = new Date().toISOString().slice(0, 10);
    onLogExpense({
      amount: sub.amount,
      currency,
      category: sub.category,
      merchant: sub.name,
      date: today,
      notes: `${sub.cycle === 'yearly' ? 'Annual' : 'Monthly'} subscription: ${sub.name}`,
    });

    setLoggedId(sub.id);
    setTimeout(() => setLoggedId(null), 3000);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#4A4556] dark:text-dark-text tracking-tight flex items-center gap-2.5">
            <CalendarClock className="text-indigo-500" size={28} /> Recurring Bills & Subscriptions
          </h1>
          <p className="text-[#9B93A9] dark:text-dark-muted mt-1 text-sm">
            Track fixed monthly commitments and never miss a renewal
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/25 dark:to-[#E0F4F1]/25 text-xs font-bold text-[#4A4556] dark:text-dark-text shadow-xs hover:opacity-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} /> Add Subscription
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#E6E6FA]/60 to-[#E0F4F1]/40 dark:from-[#E6E6FA]/15 dark:to-[#E0F4F1]/10 border border-[#E6E6FA]/60 dark:border-dark-border shadow-xs">
          <p className="text-[11px] font-bold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider">
            Monthly Fixed Load
          </p>
          <p className="text-2xl font-black text-[#4A4556] dark:text-dark-text mt-1">
            {formatCurrency(totalMonthlyCommitment, currency)}
          </p>
          <span className="text-[11px] text-[#9B93A9] dark:text-dark-muted mt-1 block">
            Across {subscriptions.length} active item{subscriptions.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border shadow-xs">
          <p className="text-[11px] font-bold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider">
            Projected Yearly Cost
          </p>
          <p className="text-2xl font-black text-[#4A4556] dark:text-dark-text mt-1">
            {formatCurrency(totalYearlyCommitment, currency)}
          </p>
          <span className="text-[11px] text-[#9B93A9] dark:text-dark-muted mt-1 block">
            Annual subscription outflow
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border shadow-xs flex flex-col justify-center">
          <div className="flex items-center gap-2 text-indigo-500 font-semibold text-xs mb-1">
            <Zap size={15} /> Quick Tip
          </div>
          <p className="text-xs text-[#9B93A9] dark:text-dark-muted leading-relaxed">
            Click "Log to Expenses" anytime a bill charges to automatically record it in your live transactions.
          </p>
        </div>
      </div>

      {/* Add Subscription Form (Collapsible) */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-dark-card border border-[#E6E6FA] dark:border-dark-border shadow-md space-y-4 animate-in"
        >
          <h3 className="text-sm font-bold text-[#4A4556] dark:text-dark-text">New Recurring Item</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#9B93A9] mb-1">Service / Bill Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Disney+, Electric Bill, Gym"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-sm text-[#4A4556] dark:text-dark-text focus:ring-2 focus:ring-[#E6E6FA]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9B93A9] mb-1">
                Amount ({getCurrencySymbol(currency)})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-sm font-semibold text-[#4A4556] dark:text-dark-text focus:ring-2 focus:ring-[#E6E6FA]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9B93A9] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-sm text-[#4A4556] dark:text-dark-text focus:ring-2 focus:ring-[#E6E6FA]"
              >
                <option value="Entertainment">Entertainment</option>
                <option value="Bills">Bills & Utilities</option>
                <option value="Health">Health & Fitness</option>
                <option value="Shopping">Shopping & Subscriptions</option>
                <option value="Food & Drink">Food Delivery / Dining</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#9B93A9] mb-1">Cycle</label>
                <select
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-sm text-[#4A4556] dark:text-dark-text focus:ring-2 focus:ring-[#E6E6FA]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="w-24">
                <label className="block text-xs font-semibold text-[#9B93A9] mb-1">Due Day</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={billingDay}
                  onChange={(e) => setBillingDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-sm text-center text-[#4A4556] dark:text-dark-text"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-semibold text-[#9B93A9] hover:text-[#4A4556]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/30 dark:to-[#E0F4F1]/30 text-xs font-bold text-[#4A4556] dark:text-dark-text shadow-xs hover:opacity-95"
            >
              Save Subscription
            </button>
          </div>
        </form>
      )}

      {/* Subscriptions List */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-[#E6E6FA]/40 dark:border-dark-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#4A4556] dark:text-dark-text">Your Subscriptions</h3>
          <span className="text-xs text-[#9B93A9]">{subscriptions.length} active</span>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-medium text-[#4A4556] dark:text-dark-text">No recurring subscriptions yet</p>
            <p className="text-xs text-[#9B93A9]">Add services like Netflix, Spotify, or your rent to keep track.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#E6E6FA]/30 dark:divide-dark-border/50">
            {subscriptions.map((sub) => {
              const emoji = CAT_EMOJIS[sub.category] || '📦';
              const isLogged = loggedId === sub.id;

              return (
                <li
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-6 py-4 hover:bg-[#FDFBF7] dark:hover:bg-dark-bg/50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#E6E6FA]/50 dark:bg-[#E6E6FA]/20 flex items-center justify-center text-lg shrink-0">
                      {emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#4A4556] dark:text-dark-text truncate">
                        {sub.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#9B93A9] dark:text-dark-muted">
                        <span className="capitalize">{sub.cycle}</span>
                        <span>•</span>
                        <span>Renews day {sub.billingDay} of month</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0">
                    <div className="text-left sm:text-right">
                      <span className="text-base font-extrabold text-[#4A4556] dark:text-dark-text">
                        {formatCurrency(sub.amount, currency)}
                      </span>
                      <span className="block text-[10px] text-[#9B93A9] uppercase font-semibold">
                        /{sub.cycle === 'yearly' ? 'yr' : 'mo'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickLog(sub)}
                        disabled={isLogged}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          isLogged
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-white dark:bg-dark-card border border-[#E6E6FA] dark:border-dark-border text-[#4A4556] dark:text-dark-text hover:bg-[#E6E6FA]/20 shadow-xs'
                        }`}
                      >
                        {isLogged ? (
                          <>
                            <Check size={13} /> Recorded!
                          </>
                        ) : (
                          <>
                            <Plus size={13} /> Log Expense
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onDeleteSubscription(sub.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9B93A9] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors cursor-pointer"
                        title="Delete subscription"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
export { DEFAULT_SAMPLE_SUBSCRIPTIONS };
