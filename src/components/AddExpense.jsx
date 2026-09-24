import { useState, useRef } from 'react';
import {
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  X,
  Trash2,
  Mic,
  MicOff,
  UploadCloud,
  FileImage,
  Camera,
  Edit3,
} from 'lucide-react';
import { parseExpenseWithAI, parseReceiptWithAI } from '../utils/aiParser';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/voiceRecognition';
import { formatCurrency, getCurrencySymbol } from '../utils/exportUtils';

/* ── Category → emoji mapping ── */
const catEmoji = {
  'Food & Drink': '🍔',
  Transport: '🚗',
  Shopping: '🛍️',
  Bills: '⚡',
  Entertainment: '🎮',
  Health: '💊',
  Income: '💰',
  Salary: '💰',
  Other: '📦',
};

export default function AddExpense({ onSave, setActiveTab, currency = 'PHP' }) {
  const [activeMode, setActiveMode] = useState('text'); // 'text' | 'receipt'
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [savedCount, setSavedCount] = useState(0);

  /* Voice recognition state */
  const [isListening, setIsListening] = useState(false);
  const recognizerRef = useRef(null);

  /* Receipt scanning state */
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const fileInputRef = useRef(null);

  /* ────────────────── Voice Recognition ────────────────── */
  function toggleVoice() {
    if (!isSpeechRecognitionSupported()) {
      setError('Voice recognition is not supported in this browser. Please try typing your expenses.');
      return;
    }

    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    setError('');
    const recognizer = createSpeechRecognizer({
      onStart: () => setIsListening(true),
      onResult: ({ transcript }) => {
        setInput(transcript);
      },
      onError: (msg) => {
        setError(msg);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
    }
  }

  /* ────────────────── Text AI Parse ────────────────── */
  async function handleParseText() {
    if (!input.trim()) return;
    setLoading(true);
    setLoadingMsg('Parsing your expenses with Gemini AI…');
    setError('');
    setParsedItems([]);
    setSavedCount(0);

    try {
      const results = await parseExpenseWithAI(input.trim(), currency);
      setParsedItems(results);
    } catch (err) {
      setError(err.message || 'Something went wrong while parsing.');
    } finally {
      setLoading(false);
    }
  }

  /* ────────────────── Receipt Image Scan ────────────────── */
  function handleFileSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, or WebP).');
      return;
    }

    // Limit to 6MB
    if (file.size > 6 * 1024 * 1024) {
      setError('Receipt image must be smaller than 6MB.');
      return;
    }

    setReceiptFile(file);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      setReceiptPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleScanReceipt() {
    if (!receiptFile || !receiptPreview) return;
    setLoading(true);
    setLoadingMsg('Scanning receipt photo with Gemini Multimodal AI…');
    setError('');
    setParsedItems([]);
    setSavedCount(0);

    try {
      // Extract base64 without prefix
      const base64Data = receiptPreview.split(',')[1];
      const results = await parseReceiptWithAI({
        base64Data,
        mimeType: receiptFile.type || 'image/jpeg',
        defaultCurrency: currency,
      });

      setParsedItems(results);
    } catch (err) {
      setError(err.message || 'Failed to scan receipt image.');
    } finally {
      setLoading(false);
    }
  }

  function handleClearReceipt() {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  /* ────────────────── Review Card Controls ────────────────── */
  function handleRemoveOne(index) {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdateItem(index, field, value) {
    setParsedItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function handleConfirmAll() {
    parsedItems.forEach((item) => onSave?.(item));
    setSavedCount(parsedItems.length);
    setParsedItems([]);
    setInput('');
    handleClearReceipt();
  }

  function handleDiscardAll() {
    setParsedItems([]);
    setError('');
  }

  const totalAmount = parsedItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#4A4556] dark:text-dark-text tracking-tight">
          Add Expense
        </h1>
        <p className="text-[#9B93A9] dark:text-dark-muted mt-1 text-sm">
          Natural speech, text sentences, or snap a photo of any receipt
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex rounded-2xl bg-white dark:bg-dark-card p-1.5 border border-[#E6E6FA]/60 dark:border-dark-border shadow-xs">
        <button
          type="button"
          onClick={() => setActiveMode('text')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeMode === 'text'
              ? 'bg-[#E6E6FA]/60 dark:bg-[#E6E6FA]/20 text-[#4A4556] dark:text-dark-text shadow-xs'
              : 'text-[#9B93A9] hover:text-[#4A4556]'
          }`}
        >
          <Sparkles size={16} /> Text & Voice Prompt
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('receipt')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeMode === 'receipt'
              ? 'bg-[#E6E6FA]/60 dark:bg-[#E6E6FA]/20 text-[#4A4556] dark:text-dark-text shadow-xs'
              : 'text-[#9B93A9] hover:text-[#4A4556]'
          }`}
        >
          <Camera size={16} /> Scan Receipt Photo
        </button>
      </div>

      {/* ── Mode 1: Text & Voice ── */}
      {activeMode === 'text' && (
        <div className="rounded-3xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-5 sm:p-6 shadow-sm space-y-4 animate-in">
          <div className="relative">
            <textarea
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`e.g. "Paid electric bill 3,500 ${currency} last Monday and bought nachos for 180"`}
              className="w-full resize-none rounded-2xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/50 dark:border-dark-border px-4 py-3 pr-12 text-sm text-[#4A4556] dark:text-dark-text placeholder:text-[#9B93A9]/60 dark:placeholder:text-dark-muted/50 focus:outline-none focus:ring-2 focus:ring-[#E6E6FA] transition-all"
            />

            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleVoice}
              title={isListening ? 'Stop listening' : 'Start voice dictation'}
              className={`absolute right-3 top-3 w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md'
                  : 'text-[#9B93A9] hover:text-[#4A4556] hover:bg-[#E6E6FA]/30 dark:hover:bg-dark-border'
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>

          {isListening && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Listening… speak your expenses clearly
            </div>
          )}

          <button
            onClick={handleParseText}
            disabled={loading || !input.trim()}
            className={`
              w-full flex items-center justify-center gap-2 rounded-xl py-3.5
              text-sm font-semibold transition-all cursor-pointer
              ${
                loading
                  ? 'bg-[#E6E6FA]/40 dark:bg-[#E6E6FA]/10 text-[#9B93A9] cursor-wait'
                  : 'bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/30 dark:to-[#E0F4F1]/30 text-[#4A4556] dark:text-dark-text hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
              }
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100
            `}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {loadingMsg}
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Parse with Gemini AI
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Mode 2: Scan Receipt Photo ── */}
      {activeMode === 'receipt' && (
        <div className="rounded-3xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-5 sm:p-6 shadow-sm space-y-4 animate-in">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />

          {!receiptPreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files?.[0]);
              }}
              className="border-2 border-dashed border-[#E6E6FA] dark:border-dark-border hover:border-indigo-400 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-[#FDFBF7] dark:hover:bg-dark-bg/60 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/30 dark:to-[#E0F4F1]/30 flex items-center justify-center mx-auto text-indigo-500 mb-3 group-hover:scale-110 transition-transform shadow-xs">
                <UploadCloud size={28} />
              </div>
              <p className="text-sm font-bold text-[#4A4556] dark:text-dark-text">
                Upload or drop receipt photo
              </p>
              <p className="text-xs text-[#9B93A9] dark:text-dark-muted mt-1">
                Supports PNG, JPG, or WebP receipts up to 6MB
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-xl bg-white dark:bg-dark-card border border-[#E6E6FA] dark:border-dark-border text-xs font-semibold text-[#4A4556] dark:text-dark-text shadow-xs"
              >
                Browse Photos
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-[#E6E6FA] dark:border-dark-border max-h-72 bg-black/5 flex items-center justify-center">
                <img
                  src={receiptPreview}
                  alt="Receipt Preview"
                  className="max-h-72 w-auto object-contain rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleClearReceipt}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 rounded-xl border border-[#E6E6FA] text-xs font-semibold text-[#9B93A9] hover:text-[#4A4556] cursor-pointer"
                >
                  Change Photo
                </button>

                <button
                  type="button"
                  onClick={handleScanReceipt}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/30 dark:to-[#E0F4F1]/30 py-3 text-sm font-bold text-[#4A4556] dark:text-dark-text hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Scanning Receipt…
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Scan Receipt with Gemini
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Error Notification ── */}
      {error && (
        <div className="rounded-2xl bg-[#FCE4EC]/60 dark:bg-[#FCE4EC]/15 border border-[#FCE4EC] dark:border-[#FCE4EC]/30 p-4 flex items-start gap-3 animate-in">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        </div>
      )}

      {/* ── Combined & Editable Preview Card ── */}
      {parsedItems.length > 0 && (
        <div className="rounded-3xl bg-[#E0F4F1]/50 dark:bg-[#E0F4F1]/10 border border-[#E0F4F1] dark:border-[#E0F4F1]/30 shadow-sm overflow-hidden animate-in">
          {/* Card header */}
          <div className="px-5 sm:px-6 pt-5 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#4A4556] dark:text-dark-text flex items-center gap-1.5">
                <Sparkles size={15} className="text-indigo-500" /> Extracted Expenses ({parsedItems.length})
              </h3>
              <p className="text-xs text-[#9B93A9] dark:text-dark-muted mt-0.5">
                Total: <strong className="text-[#4A4556] dark:text-dark-text">{formatCurrency(totalAmount, currency)}</strong>
              </p>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 bg-white/70 dark:bg-dark-card px-2.5 py-1 rounded-full shadow-xs">
              Editable review
            </span>
          </div>

          {/* Expense rows */}
          <div className="px-5 sm:px-6 pb-2 space-y-2.5">
            {parsedItems.map((item, index) => (
              <div
                key={`${item.date}-${item.amount}-${index}`}
                className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl bg-white/80 dark:bg-dark-card/80 p-3.5 border border-white/90 dark:border-dark-border group shadow-xs"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl shrink-0">
                    {catEmoji[item.category] || '📦'}
                  </span>

                  <div className="flex-1 min-w-0 space-y-1">
                    <input
                      type="text"
                      value={item.notes || item.merchant || ''}
                      onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                      placeholder="Expense note / merchant"
                      className="w-full text-xs sm:text-sm font-bold text-[#4A4556] dark:text-dark-text bg-transparent border-b border-transparent hover:border-[#E6E6FA] focus:border-indigo-400 focus:outline-none"
                    />

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#9B93A9]">
                      <input
                        type="text"
                        value={item.merchant || ''}
                        onChange={(e) => handleUpdateItem(index, 'merchant', e.target.value)}
                        placeholder="Merchant"
                        className="text-[11px] bg-transparent border-b border-transparent hover:border-[#E6E6FA] max-w-[110px]"
                      />
                      <span>•</span>
                      <input
                        type="date"
                        value={item.date || ''}
                        onChange={(e) => handleUpdateItem(index, 'date', e.target.value)}
                        className="text-[11px] bg-transparent border-b border-transparent hover:border-[#E6E6FA]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6E6FA]/40">
                  <div className="relative max-w-[120px]">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9B93A9]">
                      {getCurrencySymbol(item.currency || currency)}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={item.amount || ''}
                      onChange={(e) => handleUpdateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-2 py-1 text-xs sm:text-sm font-black text-[#4A4556] dark:text-dark-text bg-[#FDFBF7] dark:bg-dark-bg rounded-lg border border-[#E6E6FA]/60 text-right"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveOne(index)}
                    className="p-1.5 rounded-lg hover:bg-[#FCE4EC]/60 text-[#9B93A9] hover:text-rose-500 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-5 sm:px-6 py-4 border-t border-[#E0F4F1]/60 dark:border-dark-border/50">
            <button
              onClick={handleDiscardAll}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#E6E6FA]/60 dark:border-dark-border py-3 text-xs sm:text-sm font-medium text-[#9B93A9] dark:text-dark-muted hover:bg-white/60 dark:hover:bg-dark-bg transition-all cursor-pointer"
            >
              <X size={15} /> Discard
            </button>
            <button
              onClick={handleConfirmAll}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/30 dark:to-[#E0F4F1]/30 py-3 text-xs sm:text-sm font-bold text-[#4A4556] dark:text-dark-text hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            >
              <Check size={16} /> Save {parsedItems.length > 1 ? `All (${parsedItems.length})` : 'Transaction'}
            </button>
          </div>
        </div>
      )}

      {/* ── Saved Confirmation Notice ── */}
      {savedCount > 0 && parsedItems.length === 0 && (
        <div className="rounded-3xl bg-[#E0F4F1]/60 dark:bg-[#E0F4F1]/15 border border-[#E0F4F1] dark:border-[#E0F4F1]/30 p-5 space-y-3 animate-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Check size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                {savedCount} {savedCount === 1 ? 'transaction' : 'transactions'} saved successfully!
              </span>
            </div>
            <button
              onClick={() => setSavedCount(0)}
              className="text-xs text-[#9B93A9] hover:text-[#4A4556] cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-dark-card border border-[#E6E6FA] dark:border-dark-border text-xs font-semibold text-[#4A4556] dark:text-dark-text hover:bg-[#E6E6FA]/20 transition-all cursor-pointer text-center"
            >
              Go to Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/25 dark:to-[#E0F4F1]/25 text-xs font-semibold text-[#4A4556] dark:text-dark-text hover:opacity-90 transition-all cursor-pointer text-center"
            >
              View on Calendar
            </button>
          </div>
        </div>
      )}

      {/* ── Quick Tips ── */}
      <div className="rounded-3xl bg-white dark:bg-dark-card border border-[#E6E6FA]/60 dark:border-dark-border p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-[#9B93A9] dark:text-dark-muted mb-3 uppercase tracking-wider">
          💡 Try saying or typing
        </h3>
        <div className="space-y-2">
          {[
            `"Spent 250 ${currency} on groceries at SM today"`,
            `"Paid electric bill 3,500 ${currency} last Monday and bought nachos for 180"`,
            `"Coffee at Starbucks 195, lunch at Jollibee 180, grab ride 120"`,
            `"Salary deposit 45,000 ${currency} and bought airpods for 7,990"`,
          ].map((tip) => (
            <button
              key={tip}
              onClick={() => {
                setInput(tip.replace(/"/g, ''));
                setParsedItems([]);
                setError('');
                setSavedCount(0);
                setActiveMode('text');
              }}
              className="block w-full text-left text-xs text-[#9B93A9] dark:text-dark-muted hover:text-[#4A4556] dark:hover:text-dark-text px-3 py-2 rounded-xl hover:bg-[#FDFBF7] dark:hover:bg-dark-bg transition-colors cursor-pointer"
            >
              {tip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
