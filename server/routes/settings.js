import { Router } from 'express';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { Subscription } from '../models/Subscription.js';
import { authenticateUser } from '../middleware/auth.js';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_SUBSCRIPTIONS,
} from '../db.js';

const router = Router();

// Protect all settings routes
router.use(authenticateUser);

// GET all settings for current user
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        currency: user.currency || 'PHP',
        darkMode: String(user.darkMode || false),
        userName: user.name,
        userEmail: user.email,
      },
    });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update settings for current user
router.put('/', async (req, res) => {
  try {
    const payload = req.body;
    const updates = {};
    if (payload.currency !== undefined) updates.currency = payload.currency;
    if (payload.darkMode !== undefined) updates.darkMode = payload.darkMode === 'true' || payload.darkMode === true;

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true });

    res.json({
      success: true,
      data: {
        currency: user.currency,
        darkMode: String(user.darkMode),
      },
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST reset current user's data to default starter dataset
router.post('/reset', async (req, res) => {
  try {
    const userId = req.user.id;
    await Promise.all([
      Transaction.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
      Subscription.deleteMany({ userId }),
    ]);

    const txDocs = INITIAL_TRANSACTIONS.map((tx) => ({
      ...tx,
      userId,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    }));
    await Transaction.insertMany(txDocs);

    const budgetDocs = Object.entries(INITIAL_BUDGETS).map(([category, amount]) => ({
      userId,
      category,
      amount,
    }));
    await Budget.insertMany(budgetDocs);

    const subDocs = INITIAL_SUBSCRIPTIONS.map((sub) => ({
      ...sub,
      userId,
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    }));
    await Subscription.insertMany(subDocs);

    res.json({
      success: true,
      message: 'Your personal spending tracker data was reset to starter defaults',
      data: {
        transactions: txDocs,
        budgets: INITIAL_BUDGETS,
        subscriptions: subDocs,
      },
    });
  } catch (err) {
    console.error('Error resetting user data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST restore backup data for current user
router.post('/restore', async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactions, budgets, subscriptions, currency } = req.body;

    if (Array.isArray(transactions)) {
      await Transaction.deleteMany({ userId });
      const toInsert = transactions.map((tx) => ({
        userId,
        id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        amount: Number(tx.amount) || 0,
        currency: tx.currency || 'PHP',
        category: tx.category || 'Other',
        merchant: tx.merchant || '',
        date: tx.date || new Date().toISOString().slice(0, 10),
        notes: tx.notes || '',
      }));
      await Transaction.insertMany(toInsert);
    }

    if (budgets && typeof budgets === 'object') {
      await Budget.deleteMany({ userId });
      const budgetDocs = Object.entries(budgets).map(([category, amount]) => ({
        userId,
        category,
        amount: Number(amount) || 0,
      }));
      await Budget.insertMany(budgetDocs);
    }

    if (Array.isArray(subscriptions)) {
      await Subscription.deleteMany({ userId });
      const toInsertSubs = subscriptions.map((sub) => ({
        userId,
        id: sub.id || `sub-${Date.now()}`,
        name: sub.name || 'Subscription',
        amount: Number(sub.amount) || 0,
        category: sub.category || 'Other',
        cycle: sub.cycle || 'monthly',
        billingDay: Number(sub.billingDay || sub.billing_day) || 1,
      }));
      await Subscription.insertMany(toInsertSubs);
    }

    if (currency) {
      await User.findByIdAndUpdate(userId, { $set: { currency } });
    }

    res.json({ success: true, message: 'Your personal backup data was restored successfully' });
  } catch (err) {
    console.error('Error restoring data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
