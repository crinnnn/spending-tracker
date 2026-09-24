import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { Subscription } from '../models/Subscription.js';
import { authenticateUser, generateToken } from '../middleware/auth.js';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_SUBSCRIPTIONS,
} from '../db.js';

const router = Router();

// Helper to seed initial sample data for a brand new user
async function seedUserData(userId) {
  try {
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
  } catch (err) {
    console.warn('Notice seeding starter data for new user:', err.message);
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists. Please log in instead.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      currency: 'PHP',
      darkMode: false,
    });

    // Seed default starter data for new user
    await seedUserData(user._id);

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        currency: user.currency,
        darkMode: user.darkMode,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both email and password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        currency: user.currency,
        darkMode: user.darkMode,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        currency: user.currency,
        darkMode: user.darkMode,
      },
    });
  } catch (err) {
    console.error('Auth check error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { name, currency, darkMode } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (currency !== undefined) updates.currency = currency;
    if (darkMode !== undefined) updates.darkMode = Boolean(darkMode);

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        currency: user.currency,
        darkMode: user.darkMode,
      },
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
