import { useState, useRef } from 'react';
import {
  Download,
  RotateCcw,
  Check,
  ChevronRight,
  Upload,
  FileSpreadsheet,
  Coins,
  ShieldCheck,
  AlertCircle,
  User,
  Target,
} from 'lucide-react';
import { exportToCSV, exportToJSON, readAndValidateJSON, CURRENCY_SYMBOLS, formatCurrency } from '../utils/exportUtils';

export default function ProfileView({
  transactions = [],
  budgets = {},
  subscriptions = [],
  currency = 'PHP',
  onCurrencyChange,
  onResetData,
  onRestoreData,
}) {
  const [csvCopied, setCsvCopied] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [importStatus, setImportStatus] = useState(null); // { error?: string, success?: string }
  const fileInputRef = useRef(null);

  function handleExportCSV() {
    try {
      exportToCSV(transactions, currency);
      setCsvCopied(true);
      setTimeout(() => setCsvCopied(false), 2500);
    } catch (err) {
      alert(err.message || 'Export failed');
    }
  }

  function handleExportJSON() {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      currency,
      transactions,
      budgets,
      subscriptions,
    };
    exportToJSON(backup, `spendwise-full-backup-${new Date().toISOString().slice(0, 10)}.json`);
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2500);
  }

  async function handleFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(null);
    try {
      const data = await readAndValidateJSON(file);
      onRestoreData(data);
      setImportStatus({ success: `Successfully imported ${data.count} transactions!` });
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err) {
      setImportStatus({ error: err.message || 'Failed to import backup file.' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Avatar & Profile Card */}
      <div className="rounded-3xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-6 shadow-sm text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E6E6FA] to-[#FCE4EC] dark:from-[#E6E6FA]/30 dark:to-[#FCE4EC]/30 mx-auto flex items-center justify-center shadow-md">
          <span className="text-2xl font-bold text-[#4A4556] dark:text-dark-text">U</span>
        </div>
        <h2 className="text-lg font-bold text-[#4A4556] dark:text-dark-text mt-4">SpendWise User</h2>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Node.js + MongoDB Database Live</p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          <span className="px-3 py-1 text-xs font-semibold bg-[#E0F4F1] dark:bg-[#E0F4F1]/15 text-[#2C6B63] dark:text-emerald-300 rounded-full">
            {transactions.length} Transactions in DB
          </span>
          <span className="px-3 py-1 text-xs font-semibold bg-[#E6E6FA] dark:bg-[#E6E6FA]/15 text-[#574C78] dark:text-purple-300 rounded-full">
            {subscriptions.length} Subscriptions
          </span>
        </div>
      </div>

      {/* Currency Preference */}
      <div className="rounded-3xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider flex items-center gap-1.5">
          <Coins size={14} /> Currency & Regional Settings
        </h3>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FDFBF7] dark:bg-dark-bg/60 border border-[#E6E6FA]/60 dark:border-dark-border">
          <div>
            <p className="text-sm font-semibold text-[#4A4556] dark:text-dark-text">Primary Currency</p>
            <p className="text-xs text-[#9B93A9] dark:text-dark-muted">Used for calculations and AI defaults</p>
          </div>

          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-dark-card border border-[#E6E6FA] dark:border-dark-border text-xs font-bold text-[#4A4556] dark:text-dark-text cursor-pointer"
          >
            {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
              <option key={code} value={code}>
                {code} ({symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Import & Export Data Management */}
      <div className="rounded-3xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#9B93A9] dark:text-dark-muted uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck size={14} /> Data Portability & Backup
        </h3>

        {/* Status notification */}
        {importStatus?.success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Check size={16} /> {importStatus.success}
          </div>
        )}
        {importStatus?.error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle size={16} /> {importStatus.error}
          </div>
        )}

        {/* Export CSV */}
        <button
          onClick={handleExportCSV}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-[#E6E6FA]/60 dark:border-dark-border hover:bg-[#FDFBF7] dark:hover:bg-dark-bg transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E0F4F1]/60 dark:bg-[#E0F4F1]/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet size={18} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#4A4556] dark:text-dark-text">Export to CSV (Excel / Sheets)</p>
              <p className="text-xs text-[#9B93A9] dark:text-dark-muted">Spreadsheet compatible data download</p>
            </div>
          </div>
          {csvCopied ? <Check size={16} className="text-emerald-500" /> : <ChevronRight size={16} className="text-[#9B93A9]" />}
        </button>

        {/* Export JSON */}
        <button
          onClick={handleExportJSON}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-[#E6E6FA]/60 dark:border-dark-border hover:bg-[#FDFBF7] dark:hover:bg-dark-bg transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E6E6FA]/60 dark:bg-[#E6E6FA]/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Download size={18} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#4A4556] dark:text-dark-text">Export Full Backup (JSON)</p>
              <p className="text-xs text-[#9B93A9] dark:text-dark-muted">Includes transactions, budgets & subscriptions</p>
            </div>
          </div>
          {jsonCopied ? <Check size={16} className="text-emerald-500" /> : <ChevronRight size={16} className="text-[#9B93A9]" />}
        </button>

        {/* Import Backup */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-[#E6E6FA]/60 dark:border-dark-border hover:bg-[#FDFBF7] dark:hover:bg-dark-bg transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/20 dark:to-[#E0F4F1]/20 flex items-center justify-center text-[#4A4556] dark:text-dark-text">
                <Upload size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#4A4556] dark:text-dark-text">Restore / Import Backup (JSON)</p>
                <p className="text-xs text-[#9B93A9] dark:text-dark-muted">Upload a previous SpendWise backup</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#9B93A9]" />
          </button>
        </div>

        {/* Reset to Sample Data */}
        <button
          onClick={onResetData}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-[#FCE4EC] dark:border-[#FCE4EC]/30 hover:bg-[#FCE4EC]/20 dark:hover:bg-[#FCE4EC]/10 transition-colors cursor-pointer mt-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FCE4EC] dark:bg-[#FCE4EC]/20 flex items-center justify-center text-rose-500">
              <RotateCcw size={18} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Reset to Sample Dataset</p>
              <p className="text-xs text-[#9B93A9] dark:text-dark-muted">Restore default sample transactions</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#9B93A9]" />
        </button>
      </div>
    </div>
  );
}
