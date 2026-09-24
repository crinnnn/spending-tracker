import { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Send,
} from 'lucide-react';
import { getAIFinancialAdvice } from '../utils/aiParser';

const SUGGESTED_QUESTIONS = [
  'How can I trim my expenses by 15% this month?',
  'Analyze my top spending habits and spot hidden leaks.',
  'Can I comfortably afford a ₱10,000 emergency fund deposit?',
  'What is the best way to optimize my bills and groceries?',
];

export default function AIAdvisorModal({
  isOpen,
  transactions = [],
  budgets = {},
  currency = 'PHP',
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [error, setError] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');

  useEffect(() => {
    if (isOpen && !advice && transactions.length > 0) {
      loadAdvice();
    }
  }, [isOpen]);

  async function loadAdvice(question = '') {
    setLoading(true);
    setError('');

    try {
      const res = await getAIFinancialAdvice({
        transactions,
        budgets,
        currency,
        customQuestion: question,
      });
      setAdvice(res);
    } catch (err) {
      setError(err.message || 'Failed to generate AI advice. Please verify your API key.');
    } finally {
      setLoading(false);
    }
  }

  function handleAskCustom(e) {
    e.preventDefault();
    if (!customQuestion.trim() || loading) return;
    loadAdvice(customQuestion.trim());
  }

  function handlePromptClick(prompt) {
    setCustomQuestion(prompt);
    loadAdvice(prompt);
  }

  if (!isOpen) return null;

  const score = advice?.healthScore ?? 80;
  const scoreColor =
    score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-rose-500';
  const scoreBg =
    score >= 80
      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200'
      : score >= 60
      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200'
      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs transition-opacity animate-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-dark-card rounded-3xl border border-[#E6E6FA]/60 dark:border-dark-border shadow-2xl p-6 sm:p-7 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E6E6FA]/40 dark:border-dark-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E6E6FA] to-[#FCE4EC] dark:from-[#E6E6FA]/30 dark:to-[#FCE4EC]/30 flex items-center justify-center shadow-xs">
              <Sparkles size={20} className="text-[#4A4556] dark:text-dark-text" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#4A4556] dark:text-dark-text leading-tight">
                SpendWise AI Advisor
              </h2>
              <p className="text-xs text-[#9B93A9] dark:text-dark-muted">
                Intelligent financial coaching & spending anomaly detection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9B93A9] hover:text-[#4A4556] dark:hover:text-dark-text hover:bg-[#FDFBF7] dark:hover:bg-dark-bg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-5">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 size={36} className="animate-spin text-indigo-500 mx-auto" />
              <p className="text-sm font-semibold text-[#4A4556] dark:text-dark-text">
                Analyzing your transactions & budgets…
              </p>
              <p className="text-xs text-[#9B93A9] dark:text-dark-muted max-w-sm mx-auto">
                Gemini is crunching your numbers to find savings opportunities and financial insights.
              </p>
            </div>
          ) : error ? (
            <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 text-center space-y-3">
              <AlertTriangle size={28} className="text-rose-500 mx-auto" />
              <p className="text-sm text-rose-600 dark:text-rose-300 font-medium">{error}</p>
              <button
                onClick={() => loadAdvice(customQuestion)}
                className="px-4 py-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-200 text-xs font-bold cursor-pointer hover:opacity-90"
              >
                Try Again
              </button>
            </div>
          ) : advice ? (
            <>
              {/* Financial Health Score Banner */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${scoreBg} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-dark-card flex flex-col items-center justify-center shadow-xs shrink-0">
                    <span className={`text-xl font-black ${scoreColor}`}>{score}</span>
                    <span className="text-[9px] font-bold text-[#9B93A9] uppercase">Score</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#9B93A9] dark:text-dark-muted">
                        Financial Status
                      </span>
                      <span className={`text-xs font-extrabold ${scoreColor}`}>
                        • {advice.healthStatus || 'Good'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4A4556] dark:text-dark-text mt-1 leading-relaxed">
                      {advice.summary}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => loadAdvice('')}
                  className="self-end sm:self-center px-3 py-1.5 rounded-xl bg-white/80 dark:bg-dark-card border border-[#E6E6FA]/60 text-[11px] font-bold text-[#4A4556] dark:text-dark-text hover:bg-white shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  Refresh Health Check
                </button>
              </div>

              {/* Direct Answer to Custom Question (if asked) */}
              {advice.directAnswer && customQuestion && (
                <div className="p-4 rounded-2xl bg-[#E0F4F1]/60 dark:bg-[#E0F4F1]/15 border border-[#E0F4F1] dark:border-[#E0F4F1]/30">
                  <p className="text-[11px] font-bold text-[#2C6B63] dark:text-emerald-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <HelpCircle size={13} /> Advisor Response
                  </p>
                  <p className="text-xs font-semibold text-[#4A4556]/80 dark:text-dark-text/80 italic mb-2">
                    "{customQuestion}"
                  </p>
                  <p className="text-xs sm:text-sm text-[#4A4556] dark:text-dark-text leading-relaxed">
                    {advice.directAnswer}
                  </p>
                </div>
              )}

              {/* Budget Alerts (if any) */}
              {advice.budgetAlerts && advice.budgetAlerts.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Attention Needed
                  </h4>
                  <ul className="space-y-1.5">
                    {advice.budgetAlerts.map((alert, idx) => (
                      <li key={idx} className="text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{alert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Observations */}
              {advice.keyObservations && advice.keyObservations.length > 0 && (
                <div className="rounded-2xl bg-[#FDFBF7] dark:bg-dark-bg/60 border border-[#E6E6FA]/60 dark:border-dark-border p-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-[#4A4556] dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-indigo-500" /> Spending Patterns
                  </h4>
                  <ul className="space-y-2">
                    {advice.keyObservations.map((obs, idx) => (
                      <li key={idx} className="text-xs text-[#4A4556] dark:text-dark-text flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable Tips */}
              {advice.actionableTips && advice.actionableTips.length > 0 && (
                <div className="rounded-2xl bg-gradient-to-br from-[#E6E6FA]/30 to-[#E0F4F1]/30 dark:from-[#E6E6FA]/10 dark:to-[#E0F4F1]/10 border border-[#E6E6FA]/60 dark:border-dark-border p-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-[#4A4556] dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb size={14} className="text-amber-500" /> Actionable Money-Saving Steps
                  </h4>
                  <ul className="space-y-2">
                    {advice.actionableTips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-[#4A4556] dark:text-dark-text flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-[#9B93A9]">Click below to get your personalized financial advice</p>
              <button
                onClick={() => loadAdvice()}
                className="mt-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/20 dark:to-[#E0F4F1]/20 text-xs font-bold text-[#4A4556] dark:text-dark-text shadow-xs cursor-pointer"
              >
                Analyze Finances
              </button>
            </div>
          )}
        </div>

        {/* Suggested question chips */}
        <div className="pt-3 border-t border-[#E6E6FA]/40 dark:border-dark-border space-y-2">
          <p className="text-[10px] font-bold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider">
            Ask SpendWise AI
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handlePromptClick(q)}
                className="text-[11px] text-[#4A4556] dark:text-dark-text bg-[#FDFBF7] dark:bg-dark-bg hover:bg-[#E6E6FA]/40 dark:hover:bg-dark-border px-2.5 py-1 rounded-lg border border-[#E6E6FA]/50 dark:border-dark-border transition-colors cursor-pointer text-left truncate max-w-xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Ask Input */}
          <form onSubmit={handleAskCustom} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="Ask anything about your money, budget, or savings…"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-xs text-[#4A4556] dark:text-dark-text focus:ring-2 focus:ring-[#E6E6FA] transition-all"
            />
            <button
              type="submit"
              disabled={loading || !customQuestion.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/30 dark:to-[#E0F4F1]/30 text-xs font-bold text-[#4A4556] dark:text-dark-text shadow-xs hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={13} /> Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
