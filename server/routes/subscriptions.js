import { Router } from 'express';
import { Subscription } from '../models/Subscription.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Protect all subscription routes
router.use(authenticateUser);

// GET all subscriptions for the authenticated user
router.get('/', async (req, res) => {
  try {
    const docs = await Subscription.find({ userId: req.user.id }).sort({ billingDay: 1 }).lean();
    const formatted = docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      amount: doc.amount,
      category: doc.category,
      cycle: doc.cycle || 'monthly',
      billingDay: doc.billingDay || 1,
      createdAt: doc.createdAt,
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new subscription for the authenticated user
router.post('/', async (req, res) => {
  try {
    const { id, name, amount, category, cycle, billingDay } = req.body;
    if (!name || amount === undefined) {
      return res.status(400).json({ success: false, error: 'Name and amount are required' });
    }

    const subId = id || `sub-${Date.now()}`;
    const newSub = await Subscription.create({
      userId: req.user.id,
      id: subId,
      name,
      amount: Number(amount) || 0,
      category: category || 'Other',
      cycle: cycle || 'monthly',
      billingDay: Number(billingDay) || 1,
    });

    res.status(201).json({
      success: true,
      data: {
        id: newSub.id,
        name: newSub.name,
        amount: newSub.amount,
        category: newSub.category,
        cycle: newSub.cycle,
        billingDay: newSub.billingDay,
      },
    });
  } catch (err) {
    console.error('Error creating subscription:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update subscription for the authenticated user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, category, cycle, billingDay } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (amount !== undefined) updateFields.amount = Number(amount);
    if (category !== undefined) updateFields.category = category;
    if (cycle !== undefined) updateFields.cycle = cycle;
    if (billingDay !== undefined) updateFields.billingDay = Number(billingDay);

    const updated = await Subscription.findOneAndUpdate(
      { id, userId: req.user.id },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    res.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        amount: updated.amount,
        category: updated.category,
        cycle: updated.cycle,
        billingDay: updated.billingDay,
      },
    });
  } catch (err) {
    console.error('Error updating subscription:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE subscription for the authenticated user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Subscription.findOneAndDelete({ id, userId: req.user.id });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    res.json({ success: true, message: 'Subscription deleted successfully', id });
  } catch (err) {
    console.error('Error deleting subscription:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
