import { Router } from 'express';
import { Transaction } from '../models/Transaction.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Protect all transaction routes
router.use(authenticateUser);

// GET all transactions for the authenticated user
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const formatted = transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      currency: t.currency || 'PHP',
      category: t.category,
      merchant: t.merchant || '',
      date: t.date,
      notes: t.notes || '',
      createdAt: t.createdAt,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new transaction (or batch) for the authenticated user
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const items = Array.isArray(body) ? body : [body];
    const toInsert = [];

    for (const item of items) {
      const id = item.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      toInsert.push({
        userId: req.user.id,
        id,
        amount: Number(item.amount) || 0,
        currency: item.currency || 'PHP',
        category: item.category || 'Other',
        merchant: item.merchant || '',
        date: item.date || new Date().toISOString().slice(0, 10),
        notes: item.notes || '',
      });
    }

    const inserted = await Transaction.insertMany(toInsert);

    const formatted = inserted.map((t) => ({
      id: t.id,
      amount: t.amount,
      currency: t.currency,
      category: t.category,
      merchant: t.merchant,
      date: t.date,
      notes: t.notes,
    }));

    res.status(201).json({
      success: true,
      data: Array.isArray(body) ? formatted : formatted[0],
    });
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update transaction by ID for the authenticated user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, currency, category, merchant, date, notes } = req.body;

    const updateFields = {};
    if (amount !== undefined) updateFields.amount = Number(amount);
    if (currency !== undefined) updateFields.currency = currency;
    if (category !== undefined) updateFields.category = category;
    if (merchant !== undefined) updateFields.merchant = merchant;
    if (date !== undefined) updateFields.date = date;
    if (notes !== undefined) updateFields.notes = notes;

    const updated = await Transaction.findOneAndUpdate(
      { id, userId: req.user.id },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.json({
      success: true,
      data: {
        id: updated.id,
        amount: updated.amount,
        currency: updated.currency,
        category: updated.category,
        merchant: updated.merchant,
        date: updated.date,
        notes: updated.notes,
      },
    });
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE transaction by ID for the authenticated user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.findOneAndDelete({ id, userId: req.user.id });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction deleted successfully', id });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
