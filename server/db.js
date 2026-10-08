import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';

// Fix for Windows DNS resolution with MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

import { Transaction } from './models/Transaction.js';
import { Budget } from './models/Budget.js';
import { Subscription } from './models/Subscription.js';
import { Setting } from './models/Setting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initial default seed dataset
export const INITIAL_TRANSACTIONS = [
  { id: 'tx-1', amount: 180, currency: 'PHP', category: 'Food & Drink', merchant: 'Starbucks', date: '2026-09-15', notes: 'Morning coffee' },
  { id: 'tx-2', amount: 1450, currency: 'PHP', category: 'Shopping', merchant: 'SM Supermarket', date: '2026-09-14', notes: 'Weekly groceries' },
  { id: 'tx-3', amount: 25000, currency: 'PHP', category: 'Income', merchant: 'Freelance Client', date: '2026-09-10', notes: 'UI design milestone' },
  { id: 'tx-4', amount: 3500, currency: 'PHP', category: 'Bills', merchant: 'Meralco', date: '2026-09-07', notes: 'Electric bill' },
  { id: 'tx-5', amount: 550, currency: 'PHP', category: 'Entertainment', merchant: 'Netflix', date: '2026-09-03', notes: 'Monthly subscription' },
  { id: 'tx-6', amount: 45000, currency: 'PHP', category: 'Income', merchant: 'Company Payroll', date: '2026-09-01', notes: 'Monthly salary' },
];

export const INITIAL_BUDGETS = {
  'Food & Drink': 8000,
  Shopping: 4000,
  Transport: 3000,
  Bills: 5000,
  Entertainment: 2000,
  Health: 1500,
  Other: 2000,
};

export const INITIAL_SUBSCRIPTIONS = [
  { id: 'sub-1', name: 'Netflix Premium', amount: 550, category: 'Entertainment', cycle: 'monthly', billingDay: 3 },
  { id: 'sub-2', name: 'Spotify Duo', amount: 199, category: 'Entertainment', cycle: 'monthly', billingDay: 18 },
  { id: 'sub-3', name: 'Home Fiber Internet', amount: 1899, category: 'Bills', cycle: 'monthly', billingDay: 25 },
  { id: 'sub-4', name: 'Gym Membership', amount: 1500, category: 'Health', cycle: 'monthly', billingDay: 1 },
];

export async function seedDatabaseIfEmpty() {
  try {
    const txCount = await Transaction.countDocuments();
    if (txCount === 0) {
      console.log('🌱 Seeding initial transactions into MongoDB...');
      await Transaction.insertMany(INITIAL_TRANSACTIONS);
    }

    const budgetCount = await Budget.countDocuments();
    if (budgetCount === 0) {
      console.log('🌱 Seeding initial budgets into MongoDB...');
      const budgetDocs = Object.entries(INITIAL_BUDGETS).map(([category, amount]) => ({
        category,
        amount,
      }));
      await Budget.insertMany(budgetDocs);
    }

    const subCount = await Subscription.countDocuments();
    if (subCount === 0) {
      console.log('🌱 Seeding initial subscriptions into MongoDB...');
      await Subscription.insertMany(INITIAL_SUBSCRIPTIONS);
    }

    const settingCount = await Setting.countDocuments({ key: 'currency' });
    if (settingCount === 0) {
      await Setting.create({ key: 'currency', value: 'PHP' });
      await Setting.create({ key: 'darkMode', value: 'false' });
    }
  } catch (err) {
    console.warn('Notice while checking/seeding database:', err.message);
  }
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('\n⚠️  [MongoDB] MONGODB_URI is not set in your .env file!');
    console.warn('👉 Please add your MongoDB Atlas connection string to .env:');
    console.warn('   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/spending_tracker?retryWrites=true&w=majority\n');
    return false;
  }

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri);
    console.log(`🌿 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    await seedDatabaseIfEmpty();
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.warn('👉 Check your MongoDB Atlas username, password, and IP Whitelist (allow 0.0.0.0/0).');
    return false;
  }
}

export { mongoose, Transaction, Budget, Subscription, Setting };
export default mongoose;
