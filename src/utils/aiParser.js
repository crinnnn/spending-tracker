import { GoogleGenAI } from '@google/genai';
import api from '../services/api';

/**
 * Helper to call Gemini models with automatic fallback if a model is temporarily unavailable.
 */
async function generateWithFallback(ai, contents, systemInstruction) {
  const models = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastError;

  for (const model of models) {
    try {
      const config = systemInstruction ? { systemInstruction } : undefined;
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      lastError = err;
      console.warn(`Gemini model ${model} failed, trying next...`, err.message);
    }
  }

  throw lastError || new Error('Failed to get a response from Gemini AI.');
}

function cleanJsonResponse(rawText) {
  if (!rawText) return '[]';
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/g, '')
    .trim();
  return cleaned;
}

/**
 * Parse a natural-language expense description into structured data
 * using Gemini. Supports multiple expenses in a single input.
 */
export async function parseExpenseWithAI(userInput, defaultCurrency = 'PHP') {
  // 1. Try Backend AI Endpoint first
  try {
    const backendData = await api.aiParseExpense(userInput, defaultCurrency);
    if (backendData && Array.isArray(backendData) && backendData.length > 0) {
      return backendData;
    }
  } catch (err) {
    console.warn('Backend AI parse unavailable, using client-side fallback:', err.message);
  }

  // 2. Client-side fallback if backend unavailable
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing API key. Set VITE_GEMINI_API_KEY in your .env file or ensure backend is running.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const now = new Date();
  const localDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const localDay = now.toLocaleDateString('en-US', { weekday: 'long' });

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateRef = `Today: ${localDate} (${localDay}). Tomorrow: ${tomorrow.toLocaleDateString('en-CA')}. Yesterday: ${yesterday.toLocaleDateString('en-CA')}.`;

  const prompt = `You are a strict JSON expense parser.

Date reference — ${dateRef}
Default currency — ${defaultCurrency}

Given the following natural-language input, extract EVERY separate expense or transaction mentioned. Return a JSON **array** of objects — one object per distinct expense.

Each object must have these exact keys:
- "amount"    (number, positive)
- "currency"  (string, ISO 4217 code — default to "${defaultCurrency}" if not specified)
- "category"  (string, one of: Food & Drink, Transport, Shopping, Bills, Entertainment, Health, Income, Other)
- "merchant"  (string, best guess for store / payee / source name — use "Unknown" if unclear)
- "date"      (string, YYYY-MM-DD — resolve relative words like "yesterday", "last Monday", etc. based on today's date)
- "notes"     (string, short description for this specific expense)

Rules:
1. Respond with ONLY a valid JSON array — no explanation, no markdown wrappers.
2. If the input contains multiple expenses, return one object per expense.
3. If only one expense is described, return an array with one object.
4. If amount is ambiguous, pick the most likely value.

User input: "${userInput}"`;

  const raw = await generateWithFallback(ai, prompt);
  const cleaned = cleanJsonResponse(raw);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI returned invalid JSON: ${raw}`);
  }

  const items = Array.isArray(parsed) ? parsed : [parsed];

  return items.map((item) => ({
    amount: Math.abs(Number(item.amount)) || 0,
    currency: (item.currency || defaultCurrency).toUpperCase(),
    category: item.category || 'Other',
    merchant: item.merchant || 'Unknown',
    date: item.date || localDate,
    notes: item.notes || '',
  }));
}

/**
 * Scan a receipt or bill photo/document using multimodal Gemini.
 * Extracts merchant, date, total, category, and line items if available.
 *
 * @param {{ base64Data: string, mimeType: string, defaultCurrency?: string }} params
 */
export async function parseReceiptWithAI({ base64Data, mimeType, defaultCurrency = 'PHP' }) {
  // 1. Try Backend AI Route
  try {
    const backendData = await api.aiParseReceipt(base64Data, mimeType, defaultCurrency);
    if (backendData && Array.isArray(backendData) && backendData.length > 0) {
      return backendData;
    }
  } catch (err) {
    console.warn('Backend receipt parse unavailable, using client-side fallback:', err.message);
  }

  // 2. Client fallback
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing API key. Set VITE_GEMINI_API_KEY in your .env file or ensure backend is running.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const now = new Date();
  const localDate = now.toLocaleDateString('en-CA');

  const prompt = `You are an expert receipt & invoice scanner.
Analyze this receipt image and extract the transaction data.

Current date reference: ${localDate}
Default currency: ${defaultCurrency}

Return a valid JSON array of objects. Usually a receipt is a single overall expense transaction, but if multiple distinct line-items should be tracked or if it contains multiple bills, you can return multiple items. If there is a single total receipt, return 1 item with the total amount paid.

Each object must follow this structure:
- "amount": number (the total or item amount, e.g. 150.50)
- "currency": string (ISO 4217 code, e.g. "${defaultCurrency}")
- "category": string (one of: Food & Drink, Transport, Shopping, Bills, Entertainment, Health, Income, Other)
- "merchant": string (the name of the store, restaurant, vendor, or utility company)
- "date": string (YYYY-MM-DD from receipt date; if unreadable or missing, use "${localDate}")
- "notes": string (brief summary of purchased items, e.g. "Groceries, milk & eggs")

Respond ONLY with a JSON array. No markdown formatting, no conversational text.`;

  const contents = [
    {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: base64Data,
      },
    },
    prompt,
  ];

  const raw = await generateWithFallback(ai, contents);
  const cleaned = cleanJsonResponse(raw);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI returned invalid JSON for receipt: ${raw}`);
  }

  const items = Array.isArray(parsed) ? parsed : [parsed];

  return items.map((item) => ({
    amount: Math.abs(Number(item.amount)) || 0,
    currency: (item.currency || defaultCurrency).toUpperCase(),
    category: item.category || 'Shopping',
    merchant: item.merchant || 'Unknown Merchant',
    date: item.date || localDate,
    notes: item.notes || 'Receipt purchase',
  }));
}

/**
 * Generate intelligent financial advice, health scoring, and actionable coaching
 * based on the user's real transactions, monthly budgets, and savings goals.
 */
export async function getAIFinancialAdvice({ transactions = [], budgets = {}, currency = 'PHP', customQuestion = '' }) {
  // 1. Try Backend AI Route
  try {
    const backendData = await api.aiFinancialAdvice({ transactions, budgets, currency, customQuestion });
    if (backendData && backendData.healthScore !== undefined) {
      return backendData;
    }
  } catch (err) {
    console.warn('Backend AI advisor unavailable, using client-side fallback:', err.message);
  }

  // 2. Client fallback
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing API key. Set VITE_GEMINI_API_KEY in your .env file or ensure backend is running.');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Calculate summary metrics to send to AI
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals = {};

  transactions.forEach((tx) => {
    const amt = Math.abs(Number(tx.amount)) || 0;
    const isInc = tx.category === 'Income' || tx.category === 'Salary' || tx.isIncome;
    if (isInc) {
      totalIncome += amt;
    } else {
      totalExpenses += amt;
      const cat = tx.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    }
  });

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const dataContext = {
    currency,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate: `${savingsRate}%`,
    categorySpending: categoryTotals,
    monthlyBudgets: budgets,
    transactionCount: transactions.length,
    recentTransactions: transactions.slice(0, 10).map((t) => ({
      date: t.date,
      category: t.category,
      amount: t.amount,
      merchant: t.merchant,
      notes: t.notes,
    })),
  };

  const prompt = `You are SpendWise AI, an empathetic, smart, and highly practical personal finance advisor.
Analyze the user's spending data and provide tailored financial guidance.

Financial Context:
${JSON.stringify(dataContext, null, 2)}

${customQuestion ? `Specific User Question: "${customQuestion}"` : 'Please provide a comprehensive financial health check.'}

Respond with a valid JSON object matching this schema:
{
  "healthScore": number (1 to 100 representing overall financial health),
  "healthStatus": string (e.g. "Excellent", "Good", "Needs Attention", "At Risk"),
  "summary": string (2-3 sentences summarizing their current financial standing warmly),
  "keyObservations": [
    string (specific observation about their spending or saving)
  ],
  "budgetAlerts": [
    string (alert if any category is over budget or approaching its limit, or empty array if all good)
  ],
  "actionableTips": [
    string (concrete, high-impact tips to save or optimize spending this month)
  ],
  "directAnswer": string (if a specific user question was provided, give a thorough, encouraging answer; otherwise provide a motivating closing note)
}

Rules:
1. Return ONLY the JSON object. Do not wrap in markdown or add conversational filler outside the JSON.
2. Be specific with figures in ${currency}.`;

  const raw = await generateWithFallback(ai, prompt);
  const cleaned = cleanJsonResponse(raw);

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`AI response could not be parsed: ${raw}`);
  }
}
