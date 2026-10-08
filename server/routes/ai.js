import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const router = Router();

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the server. Set GEMINI_API_KEY or VITE_GEMINI_API_KEY in .env.');
  }
  return new GoogleGenAI({ apiKey });
}

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
  return rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/g, '')
    .trim();
}

// POST /api/ai/parse-expense - Natural language expense parsing
router.post('/parse-expense', async (req, res) => {
  try {
    const { userInput, defaultCurrency = 'PHP' } = req.body;
    if (!userInput || !userInput.trim()) {
      return res.status(400).json({ success: false, error: 'User input text is required' });
    }

    const ai = getGenAI();
    const now = new Date();
    const localDate = now.toISOString().slice(0, 10);
    const localDay = now.toLocaleDateString('en-US', { weekday: 'long' });

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const systemInstruction = `You are an expert expense-tracking assistant.
Analyze user messages describing expenses or income, and convert them into structured JSON data.

Rules:
1. Output MUST be valid JSON array of objects.
2. Default currency is "${defaultCurrency}". If specified (e.g. $, USD, PHP, ₱), convert or record currency code.
3. Categories MUST be one of:
   - "Food & Drink"
   - "Shopping"
   - "Transport"
   - "Bills"
   - "Entertainment"
   - "Health"
   - "Income"
   - "Other"
4. Amount must be a positive number.
5. Dates must be YYYY-MM-DD.
   - Reference today: ${localDate} (${localDay})
   - Yesterday: ${yesterday.toISOString().slice(0, 10)}
   - Tomorrow: ${tomorrow.toISOString().slice(0, 10)}
6. If the user mentions multiple transactions, return an object for each in the array.
7. Return ONLY the JSON array. Do not wrap in markdown or add conversational text.`;

    const prompt = `Parse this expense description into JSON:\n"${userInput}"`;
    const raw = await generateWithFallback(ai, prompt, systemInstruction);
    const cleaned = cleanJsonResponse(raw);
    const parsed = JSON.parse(cleaned);

    const results = (Array.isArray(parsed) ? parsed : [parsed]).map((item) => ({
      amount: Math.abs(Number(item.amount)) || 0,
      currency: item.currency || defaultCurrency,
      category: item.category || 'Other',
      merchant: item.merchant || 'Expense',
      date: item.date || localDate,
      notes: item.notes || userInput.slice(0, 50),
    }));

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Error parsing expense with AI:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ai/parse-receipt - Receipt OCR and parsing
router.post('/parse-receipt', async (req, res) => {
  try {
    const { base64Data, mimeType = 'image/jpeg', defaultCurrency = 'PHP' } = req.body;
    if (!base64Data) {
      return res.status(400).json({ success: false, error: 'base64Data is required' });
    }

    const ai = getGenAI();
    const now = new Date();
    const localDate = now.toISOString().slice(0, 10);

    const systemInstruction = `You are an expert OCR receipt parsing assistant.
Analyze receipt photos and extract expense transactions as a valid JSON array.

Output format:
[
  {
    "amount": number (positive total or item cost),
    "currency": string (e.g. "${defaultCurrency}", "PHP", "USD"),
    "category": string (Food & Drink, Shopping, Transport, Bills, Entertainment, Health, Other),
    "merchant": string (store name from receipt),
    "date": string (YYYY-MM-DD from receipt, fallback to "${localDate}"),
    "notes": string (brief summary of purchased items)
  }
]
Return ONLY the raw JSON array.`;

    const contents = [
      {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: `Extract the receipt purchase details and total. Use ${defaultCurrency} if no other currency is shown.` },
        ],
      },
    ];

    const raw = await generateWithFallback(ai, contents, systemInstruction);
    const cleaned = cleanJsonResponse(raw);
    const parsed = JSON.parse(cleaned);

    const results = (Array.isArray(parsed) ? parsed : [parsed]).map((item) => ({
      amount: Math.abs(Number(item.amount)) || 0,
      currency: item.currency || defaultCurrency,
      category: item.category || 'Other',
      merchant: item.merchant || 'Receipt Merchant',
      date: item.date || localDate,
      notes: item.notes || 'Receipt purchase',
    }));

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Error parsing receipt with AI:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ai/financial-advice - Financial health and recommendations
router.post('/financial-advice', async (req, res) => {
  try {
    const { transactions = [], budgets = {}, currency = 'PHP', customQuestion = '' } = req.body;
    const ai = getGenAI();

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
    const parsed = JSON.parse(cleaned);

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('Error generating financial advice:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
