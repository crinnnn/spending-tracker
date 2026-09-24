import { Router } from 'express';
import { Budget } from '../models/Budget.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Protect all budget routes
router.use(authenticateUser);

// GET all budgets for the authenticated user
router.get('/', async (req, res) => {
  try {
    const docs = await Budget.find({ userId: req.user.id }).lean();
    const budgets = {};
    for (const doc of docs) {
      budgets[doc.category] = doc.amount;
    }
    res.json({ success: true, data: budgets });
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update all budgets for the authenticated user
router.put('/', async (req, res) => {
  try {
    const budgets = req.body;
    if (!budgets || typeof budgets !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid budgets payload' });
    }

    const operations = Object.entries(budgets).map(([category, amount]) => ({
      updateOne: {
        filter: { userId: req.user.id, category },
        update: { $set: { amount: Number(amount) || 0 } },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await Budget.bulkWrite(operations);
    }

    const docs = await Budget.find({ userId: req.user.id }).lean();
    const updated = {};
    for (const doc of docs) {
      updated[doc.category] = doc.amount;
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating budgets:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update a specific category budget for the authenticated user
router.put('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { amount } = req.body;

    const updated = await Budget.findOneAndUpdate(
      { userId: req.user.id, category },
      { $set: { amount: Number(amount) || 0 } },
      { upsert: true, new: true }
    ).lean();

    res.json({ success: true, data: { category: updated.category, amount: updated.amount } });
  } catch (err) {
    console.error('Error updating category budget:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
