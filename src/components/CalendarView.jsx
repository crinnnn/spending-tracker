import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingDown,
  TrendingUp,
  Clock,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  X,
  Store,
  FileText,
  Check,
  Coins,
  Trash2,
} from 'lucide-react';
import { getCurrencySymbol, formatCurrency } from '../utils/exportUtils';

/* ── helpers ── */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay(); // 0 = Sun
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const EXPENSE_CATEGORIES = [
  { label: 'Food & Drink', emoji: '🍔' },
  { label: 'Shopping', emoji: '🛍️' },
  { label: 'Transport', emoji: '🚗' },
  { label: 'Bills', emoji: '⚡' },
  { label: 'Entertainment', emoji: '🎮' },
  { label: 'Health', emoji: '💊' },
  { label: 'Other', emoji: '📦' },
];

const INCOME_CATEGORIES = [
  { label: 'Salary', emoji: '💰' },
  { label: 'Freelance', emoji: '💻' },
  { label: 'Business', emoji: '🏢' },
  { label: 'Investment', emoji: '📈' },
  { label: 'Gift', emoji: '🎁' },
  { label: 'Other', emoji: '📦' },
];

const catEmoji = {
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

export default function CalendarView({
  transactions = [],
  currency = 'PHP',
  onAddTransaction,
  onDeleteTransaction,
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD' or null

  /* Modal state */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [txType, setTxType] = useState('expense'); // 'expense' | 'income'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Drink');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const startDay = getFirstDayOfWeek(viewYear, viewMonth);

  /* Group transactions by date */
  const byDate = {};
  transactions.forEach((tx) => {
    const key = tx.date; // YYYY-MM-DD
    if (!key) return;
    if (!byDate[key]) byDate[key] = { expenses: 0, income: 0, items: [] };
    const amt = Number(tx.amount) || 0;
    const isInc = tx.category === 'Income' || tx.category === 'Salary' || tx.isIncome;
    if (isInc) {
      byDate[key].income += amt;
    } else {
      byDate[key].expenses += Math.abs(amt);
    }
    byDate[key].items.push(tx);
  });

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(formatKey(today.getFullYear(), today.getMonth(), today.getDate()));
  }

  const todayKey = formatKey(today.getFullYear(), today.getMonth(), today.getDate());

  /* Build grid cells: leading blanks + day numbers */
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  /* Month summary calculation */
  const monthPrefix = formatKey(viewYear, viewMonth, 1).slice(0, 7); // "YYYY-MM"
  const monthTxs = transactions.filter((tx) => tx.date && tx.date.startsWith(monthPrefix));
  const monthTotalExpenses = monthTxs
    .filter((t) => t.category !== 'Income' && t.category !== 'Salary' && !t.isIncome)
    .reduce((sum, t) => sum + (Math.abs(Number(t.amount)) || 0), 0);
  const monthTotalIncome = monthTxs
    .filter((t) => t.category === 'Income' || t.category === 'Salary' || t.isIncome)
    .reduce((sum, t) => sum + (Math.abs(Number(t.amount)) || 0), 0);

  /* Filtered transactions to display: either selected date or entire month */
  const displayedTxs = selectedDate
    ? (byDate[selectedDate]?.items || [])
    : monthTxs;

  /* Open Modal for a given date */
  function handleOpenAddModal(dateKey, e) {
    if (e) e.stopPropagation();
    setModalDate(dateKey);
    setSelectedDate(dateKey);
    setTxType('expense');
    setCategory('Food & Drink');
    setAmount('');
    setMerchant('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  }

  /* Close Modal */
  function handleCloseModal() {
    setIsModalOpen(false);
    setFormError('');
  }

  /* Close modal on Escape key */
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') handleCloseModal();
    }
    if (isModalOpen) {
      window.addEventListener('keydown', onKeyDown);
    }
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  /* Handle Transaction Submit */
  function handleSubmitTransaction(e) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!category) {
      setFormError('Please select a category.');
      return;
    }

    const newTx = {
      amount: parsedAmount,
      currency: currency,
      category: txType === 'income' ? (category === 'Income' ? 'Income' : category) : category,
      merchant: merchant.trim() || 'Unknown',
      date: modalDate,
      notes: notes.trim(),
      isIncome: txType === 'income',
    };

    onAddTransaction?.(newTx);
    handleCloseModal();
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#4A4556] dark:text-dark-text tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="text-indigo-400 dark:text-indigo-300" size={28} />
            Spending Calendar
          </h1>
          <p className="text-[#9B93A9] dark:text-dark-muted mt-1 text-sm">
            Click any day to quickly add an expense or income
          </p>
        </div>

        <button
          onClick={goToday}
          className="self-start sm:self-auto px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-dark-card border border-[#E6E6FA]/80 dark:border-dark-border text-[#4A4556] dark:text-dark-text shadow-sm hover:bg-[#E6E6FA]/20 dark:hover:bg-[#E6E6FA]/10 transition-colors cursor-pointer"
        >
          Jump to Today
        </button>
      </div>

      {/* ── Monthly Quick Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-[#FCE4EC]/50 dark:bg-[#FCE4EC]/10 border border-[#FCE4EC]/60 dark:border-[#FCE4EC]/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8C4A60] dark:text-rose-300 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-6 h-6 rounded-full bg-[#FCE4EC] dark:bg-[#FCE4EC]/20 flex items-center justify-center">
              <TrendingDown size={14} className="text-rose-500 dark:text-rose-400" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#4A4556] dark:text-dark-text mt-2">
            {formatCurrency(monthTotalExpenses, currency)}
          </p>
          <span className="text-[11px] text-[#9B93A9] dark:text-dark-muted mt-0.5 block">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
        </div>

        <div className="rounded-2xl bg-[#E0F4F1]/50 dark:bg-[#E0F4F1]/10 border border-[#E0F4F1]/60 dark:border-[#E0F4F1]/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#2C6B63] dark:text-emerald-300 uppercase tracking-wider">
              Total Income
            </span>
            <div className="w-6 h-6 rounded-full bg-[#E0F4F1] dark:bg-[#E0F4F1]/20 flex items-center justify-center">
              <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#4A4556] dark:text-dark-text mt-2">
            {formatCurrency(monthTotalIncome, currency)}
          </p>
          <span className="text-[11px] text-[#9B93A9] dark:text-dark-muted mt-0.5 block">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl bg-[#E6E6FA]/40 dark:bg-[#E6E6FA]/10 border border-[#E6E6FA]/60 dark:border-[#E6E6FA]/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#574C78] dark:text-purple-300 uppercase tracking-wider">
              Net Savings
            </span>
            <span className="text-xs">⚖️</span>
          </div>
          <p className="text-xl font-extrabold text-[#4A4556] dark:text-dark-text mt-2">
            {formatCurrency(monthTotalIncome - monthTotalExpenses, currency)}
          </p>
          <span className="text-[11px] text-[#9B93A9] dark:text-dark-muted mt-0.5 block">
            {monthTxs.length} transaction{monthTxs.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* ── Calendar Grid Card ── */}
      <div className="rounded-3xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border shadow-sm overflow-hidden transition-colors">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6E6FA]/30 dark:border-dark-border">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#4A4556] dark:text-dark-text hover:bg-[#E6E6FA]/30 dark:hover:bg-[#E6E6FA]/15 transition-colors cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>

          <div className="text-center">
            <h2 className="text-base sm:text-lg font-bold text-[#4A4556] dark:text-dark-text">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-indigo-500 dark:text-indigo-300 hover:underline font-medium mt-0.5 block cursor-pointer"
              >
                Viewing {formatDisplayDate(selectedDate)} · Show all month
              </button>
            )}
          </div>

          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#4A4556] dark:text-dark-text hover:bg-[#E6E6FA]/30 dark:hover:bg-[#E6E6FA]/15 transition-colors cursor-pointer"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Day-of-week Headers */}
        <div className="grid grid-cols-7 border-b border-[#E6E6FA]/20 dark:border-dark-border/40 bg-[#FDFBF7]/60 dark:bg-dark-bg/40">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-bold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider py-3"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 gap-px bg-[#E6E6FA]/30 dark:bg-dark-border/30 p-2">
          {cells.map((day, i) => {
            if (day === null) {
              return (
                <div
                  key={`blank-${i}`}
                  className="min-h-[70px] sm:min-h-[82px] bg-white/40 dark:bg-dark-card/40 rounded-xl"
                />
              );
            }

            const key = formatKey(viewYear, viewMonth, day);
            const data = byDate[key];
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;

            return (
              <button
                key={key}
                onClick={(e) => handleOpenAddModal(key, e)}
                className={`
                  group relative min-h-[70px] sm:min-h-[82px] p-1.5 rounded-xl flex flex-col justify-between items-stretch
                  transition-all duration-200 text-left cursor-pointer overflow-hidden
                  ${
                    isSelected
                      ? 'bg-[#E6E6FA]/80 dark:bg-[#E6E6FA]/25 ring-2 ring-indigo-400 dark:ring-indigo-300 shadow-sm'
                      : isToday
                      ? 'bg-[#E6E6FA]/30 dark:bg-[#E6E6FA]/10 hover:bg-[#E6E6FA]/50 hover:shadow-xs'
                      : 'bg-white dark:bg-dark-card hover:bg-[#FDFBF7] dark:hover:bg-dark-bg/80 hover:shadow-xs'
                  }
                `}
              >
                {/* Cell Header: Day Number & Hover Plus Icon */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`
                      w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full transition-transform duration-200
                      ${
                        isToday
                          ? 'bg-gradient-to-br from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/40 dark:to-[#E0F4F1]/40 text-[#4A4556] dark:text-dark-text font-bold shadow-xs'
                          : isSelected
                          ? 'text-indigo-600 dark:text-indigo-200 font-bold'
                          : 'text-[#4A4556] dark:text-dark-text'
                      }
                    `}
                  >
                    {day}
                  </span>

                  {/* Hover effect plus badge */}
                  <span
                    className="opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200 w-5 h-5 rounded-lg bg-[#E6E6FA] dark:bg-[#E6E6FA]/30 text-[#4A4556] dark:text-dark-text flex items-center justify-center shadow-xs"
                    title="Click to add expense or income"
                  >
                    <Plus size={12} strokeWidth={2.6} />
                  </span>
                </div>

                {/* Soft Pastel Indicator Badges */}
                <div className="w-full flex flex-col gap-0.5 mt-auto pt-1">
                  {data?.expenses > 0 && (
                    <span
                      title={`Expenses: ${formatCurrency(data.expenses, currency)}`}
                      className="w-full text-[9px] sm:text-[10px] font-semibold py-0.5 px-1 rounded-md text-center truncate bg-[#FCE4EC] dark:bg-[#FCE4EC]/25 text-[#8C4A60] dark:text-rose-200 border border-[#FCE4EC]/90 dark:border-rose-400/20"
                    >
                      -{getCurrencySymbol(currency)}{data.expenses >= 1000 ? `${(data.expenses / 1000).toFixed(1)}k` : data.expenses}
                    </span>
                  )}
                  {data?.income > 0 && (
                    <span
                      title={`Income: ${formatCurrency(data.income, currency)}`}
                      className="w-full text-[9px] sm:text-[10px] font-semibold py-0.5 px-1 rounded-md text-center truncate bg-[#E0F4F1] dark:bg-[#E0F4F1]/25 text-[#2C6B63] dark:text-emerald-200 border border-[#E0F4F1]/90 dark:border-emerald-400/20"
                    >
                      +{getCurrencySymbol(currency)}{data.income >= 1000 ? `${(data.income / 1000).toFixed(1)}k` : data.income}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Transaction List (Selected Day or Whole Month) ── */}
      <div className="rounded-3xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E6FA]/30 dark:border-dark-border">
          <div>
            <h3 className="text-sm font-bold text-[#4A4556] dark:text-dark-text">
              {selectedDate ? `Transactions for ${formatDisplayDate(selectedDate)}` : `${MONTH_NAMES[viewMonth]} Transactions`}
            </h3>
            <p className="text-xs text-[#9B93A9] dark:text-dark-muted mt-0.5">
              {displayedTxs.length} record{displayedTxs.length === 1 ? '' : 's'} found
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs font-semibold text-indigo-500 dark:text-indigo-300 hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            )}

            <button
              onClick={(e) => handleOpenAddModal(selectedDate || todayKey, e)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/20 dark:to-[#E0F4F1]/20 text-xs font-bold text-[#4A4556] dark:text-dark-text hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              Add Transaction
            </button>
          </div>
        </div>

        {displayedTxs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#E6E6FA]/30 dark:bg-[#E6E6FA]/10 flex items-center justify-center mx-auto mb-3 text-[#9B93A9] dark:text-dark-muted">
              <CalendarIcon size={24} />
            </div>
            <p className="text-sm font-medium text-[#4A4556] dark:text-dark-text">
              No transactions {selectedDate ? 'on this day' : 'in this month'}
            </p>
            <p className="text-xs text-[#9B93A9] dark:text-dark-muted mt-1">
              Click any calendar day cell or use the Add button above to log one!
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#E6E6FA]/30 dark:divide-dark-border/60">
            {displayedTxs.map((tx, idx) => {
              const isIncome = tx.category === 'Income' || tx.category === 'Salary' || tx.isIncome;
              const emoji = catEmoji[tx.category] || (isIncome ? '💰' : '💸');

              return (
                <li
                  key={tx.id || idx}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FDFBF7] dark:hover:bg-dark-bg/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0 ${
                        isIncome
                          ? 'bg-[#E0F4F1] dark:bg-[#E0F4F1]/20 border border-[#E0F4F1]'
                          : 'bg-[#FCE4EC] dark:bg-[#FCE4EC]/20 border border-[#FCE4EC]'
                      }`}
                    >
                      {emoji}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#4A4556] dark:text-dark-text truncate">
                        {tx.notes || tx.merchant || tx.category}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#9B93A9] dark:text-dark-muted">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Tag size={12} /> {tx.category}
                        </span>
                        {tx.merchant && tx.merchant !== 'Unknown' && (
                          <>
                            <span>·</span>
                            <span>{tx.merchant}</span>
                          </>
                        )}
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> {tx.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 text-sm font-bold ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-[#4A4556] dark:text-dark-text'
                        }`}
                      >
                        {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} className="text-rose-400" />}
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount, tx.currency || currency)}
                      </span>
                      <span className="block text-[10px] text-[#9B93A9] dark:text-dark-muted uppercase font-semibold">
                        {tx.currency || currency}
                      </span>
                    </div>

                    {onDeleteTransaction && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTransaction(tx.id);
                        }}
                        title="Delete transaction"
                        aria-label="Delete transaction"
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9B93A9] dark:text-dark-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Add Transaction Modal ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-dark-card rounded-3xl border border-[#E6E6FA]/80 dark:border-dark-border shadow-2xl p-6 sm:p-7 space-y-5 transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    txType === 'expense'
                      ? 'bg-[#FCE4EC] dark:bg-[#FCE4EC]/20 text-rose-500'
                      : 'bg-[#E0F4F1] dark:bg-[#E0F4F1]/20 text-emerald-500'
                  }`}
                >
                  <Coins size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#4A4556] dark:text-dark-text">
                    Add Transaction
                  </h3>
                  <p className="text-xs text-[#9B93A9] dark:text-dark-muted">
                    for {formatDisplayDate(modalDate)}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#9B93A9] dark:text-dark-muted hover:bg-[#E6E6FA]/30 dark:hover:bg-[#E6E6FA]/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/50 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('expense');
                    setCategory('Food & Drink');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    txType === 'expense'
                      ? 'bg-[#FCE4EC] text-[#8C4A60] dark:bg-[#FCE4EC]/25 dark:text-rose-200 border border-rose-300 dark:border-rose-400/40 shadow-xs'
                      : 'text-[#9B93A9] dark:text-dark-muted hover:text-[#4A4556] dark:hover:text-dark-text'
                  }`}
                >
                  <TrendingDown size={15} />
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setCategory('Salary');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    txType === 'income'
                      ? 'bg-[#E0F4F1] text-[#2C6B63] dark:bg-[#E0F4F1]/25 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-400/40 shadow-xs'
                      : 'text-[#9B93A9] dark:text-dark-muted hover:text-[#4A4556] dark:hover:text-dark-text'
                  }`}
                >
                  <TrendingUp size={15} />
                  Income
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-[#9B93A9] dark:text-dark-muted mb-1 uppercase tracking-wider">
                  Amount ({currency})
                </label>
                <div className="relative rounded-2xl border border-[#E6E6FA] dark:border-dark-border bg-[#FDFBF7] dark:bg-dark-bg focus-within:ring-2 focus-within:ring-indigo-300 dark:focus-within:ring-indigo-400/30 overflow-hidden transition-all">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#9B93A9] dark:text-dark-muted">
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    autoFocus
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 text-2xl font-bold text-[#4A4556] dark:text-dark-text bg-transparent outline-none placeholder:text-[#9B93A9]/40"
                  />
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#9B93A9] dark:text-dark-muted mb-1.5 uppercase tracking-wider">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {(txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => {
                    const isSelected = category === cat.label;
                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setCategory(cat.label)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? txType === 'expense'
                              ? 'bg-[#FCE4EC] text-[#8C4A60] dark:bg-[#FCE4EC]/25 dark:text-rose-200 border border-rose-300 dark:border-rose-400/40 font-bold shadow-xs scale-105'
                              : 'bg-[#E0F4F1] text-[#2C6B63] dark:bg-[#E0F4F1]/25 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-400/40 font-bold shadow-xs scale-105'
                            : 'bg-[#FDFBF7] dark:bg-dark-bg text-[#4A4556] dark:text-dark-text border border-[#E6E6FA]/60 dark:border-dark-border hover:bg-[#E6E6FA]/20 dark:hover:bg-[#E6E6FA]/10'
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Merchant / Payee Source */}
              <div>
                <label className="block text-xs font-semibold text-[#9B93A9] dark:text-dark-muted mb-1 uppercase tracking-wider">
                  {txType === 'expense' ? 'Merchant / Store' : 'Income Source'}
                </label>
                <div className="relative rounded-2xl border border-[#E6E6FA] dark:border-dark-border bg-[#FDFBF7] dark:bg-dark-bg focus-within:ring-2 focus-within:ring-indigo-300 dark:focus-within:ring-indigo-400/30 overflow-hidden transition-all">
                  <Store size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B93A9] dark:text-dark-muted" />
                  <input
                    type="text"
                    placeholder={txType === 'expense' ? 'e.g. Starbucks, Meralco' : 'e.g. Company Payroll, Client X'}
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-[#4A4556] dark:text-dark-text bg-transparent outline-none placeholder:text-[#9B93A9]/50"
                  />
                </div>
              </div>

              {/* Notes & Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9B93A9] dark:text-dark-muted mb-1 uppercase tracking-wider">
                    Date
                  </label>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E6E6FA] dark:border-dark-border bg-[#FDFBF7] dark:bg-dark-bg text-[#4A4556] dark:text-dark-text outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9B93A9] dark:text-dark-muted mb-1 uppercase tracking-wider">
                    Notes (Optional)
                  </label>
                  <div className="relative rounded-xl border border-[#E6E6FA] dark:border-dark-border bg-[#FDFBF7] dark:bg-dark-bg focus-within:ring-2 focus-within:ring-indigo-300 overflow-hidden">
                    <input
                      type="text"
                      placeholder="e.g. Lunch with team"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs text-[#4A4556] dark:text-dark-text bg-transparent outline-none placeholder:text-[#9B93A9]/50"
                    />
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300 font-medium">
                  {formError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#9B93A9] dark:text-dark-muted hover:bg-[#E6E6FA]/30 dark:hover:bg-[#E6E6FA]/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all duration-150 cursor-pointer ${
                    txType === 'expense'
                      ? 'bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 shadow-rose-200/50 dark:shadow-none'
                      : 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-200/50 dark:shadow-none'
                  }`}
                >
                  <Check size={14} strokeWidth={2.5} />
                  Save {txType === 'expense' ? 'Expense' : 'Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
