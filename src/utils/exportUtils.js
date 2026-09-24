/**
 * Utilities for CSV Export, JSON Backup, JSON Import, and Currency Formatting.
 */

export const CURRENCY_SYMBOLS = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'AU$',
  SGD: 'SG$',
};

export function getCurrencySymbol(code = 'PHP') {
  return CURRENCY_SYMBOLS[code.toUpperCase()] || code;
}

export function formatCurrency(amount, code = 'PHP') {
  const num = Number(amount) || 0;
  const symbol = getCurrencySymbol(code);
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Trigger CSV download for transactions
 */
export function exportToCSV(transactions = [], currency = 'PHP') {
  if (!transactions.length) {
    throw new Error('No transactions available to export.');
  }

  const headers = ['Date', 'Type', 'Category', 'Merchant', 'Amount', 'Currency', 'Notes'];

  const rows = transactions.map((tx) => {
    const isInc = tx.category === 'Income' || tx.category === 'Salary' || tx.isIncome;
    const type = isInc ? 'Income' : 'Expense';
    const amount = Math.abs(Number(tx.amount)) || 0;
    const notes = (tx.notes || '').replace(/"/g, '""');
    const merchant = (tx.merchant || '').replace(/"/g, '""');
    const category = (tx.category || 'Other').replace(/"/g, '""');

    return [
      `"${tx.date || ''}"`,
      `"${type}"`,
      `"${category}"`,
      `"${merchant}"`,
      amount,
      `"${tx.currency || currency}"`,
      `"${notes}"`,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `spendwise-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Trigger JSON backup download
 */
export function exportToJSON(data, filename) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', filename || `spendwise-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Parse and validate an uploaded JSON backup file
 */
export function readAndValidateJSON(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file selected'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        let transactions = [];
        let budgets = null;
        let subscriptions = null;
        let settings = null;

        if (Array.isArray(parsed)) {
          // Direct array of transactions
          transactions = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
          // Wrapped backup object
          if (Array.isArray(parsed.transactions)) {
            transactions = parsed.transactions;
          }
          if (parsed.budgets) budgets = parsed.budgets;
          if (parsed.subscriptions) subscriptions = parsed.subscriptions;
          if (parsed.settings) settings = parsed.settings;
        }

        // Validate transactions structure
        const validatedTransactions = transactions.filter((t) => t && typeof t === 'object' && (t.amount !== undefined || t.category));

        if (validatedTransactions.length === 0 && !budgets && !subscriptions) {
          return reject(new Error('The uploaded file does not appear to contain valid SpendWise data.'));
        }

        resolve({
          transactions: validatedTransactions,
          budgets,
          subscriptions,
          settings,
          count: validatedTransactions.length,
        });
      } catch {
        reject(new Error('Invalid JSON file format. Please upload a valid JSON backup.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}
