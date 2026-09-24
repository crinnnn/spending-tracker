/**
 * SpendWise API Client
 * Interfaces with the Express + MongoDB backend with JWT authentication.
 */

const API_BASE = '/api';

export function getStoredToken() {
  try {
    return localStorage.getItem('spendwise-token') || null;
  } catch {
    return null;
  }
}

export function setStoredAuth(token, user) {
  try {
    if (token) localStorage.setItem('spendwise-token', token);
    if (user) localStorage.setItem('spendwise-user', JSON.stringify(user));
  } catch {}
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem('spendwise-token');
    localStorage.removeItem('spendwise-user');
  } catch {}
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('spendwise-user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, config);
    const json = await res.json();
    if (!res.ok || json.success === false) {
      // If unauthorized, could clear token
      if (res.status === 401) {
        // Token expired or invalid
      }
      throw new Error(json.error || `HTTP error! status: ${res.status}`);
    }
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    console.warn(`API call failed for [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Auth
  register: async (name, email, password) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (res.token && res.user) {
      setStoredAuth(res.token, res.user);
    }
    return res;
  },

  login: async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token && res.user) {
      setStoredAuth(res.token, res.user);
    }
    return res;
  },

  getMe: async () => {
    return request('/auth/me');
  },

  updateProfile: async (data) => {
    return request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  logout: () => {
    clearStoredAuth();
  },

  // Transactions
  getTransactions: () => request('/transactions'),
  createTransaction: (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, data) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: () => request('/budgets'),
  updateBudgets: (budgets) => request('/budgets', { method: 'PUT', body: JSON.stringify(budgets) }),
  updateCategoryBudget: (category, amount) =>
    request(`/budgets/${encodeURIComponent(category)}`, { method: 'PUT', body: JSON.stringify({ amount }) }),

  // Subscriptions
  getSubscriptions: () => request('/subscriptions'),
  createSubscription: (data) => request('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  updateSubscription: (id, data) => request(`/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubscription: (id) => request(`/subscriptions/${id}`, { method: 'DELETE' }),

  // Settings & Backups
  getSettings: () => request('/settings'),
  updateSettings: (settings) => request('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  resetDatabase: () => request('/settings/reset', { method: 'POST' }),
  restoreDatabase: (data) => request('/settings/restore', { method: 'POST', body: JSON.stringify(data) }),

  // AI Services
  aiParseExpense: (userInput, defaultCurrency = 'PHP') =>
    request('/ai/parse-expense', {
      method: 'POST',
      body: JSON.stringify({ userInput, defaultCurrency }),
    }),
  aiParseReceipt: (base64Data, mimeType = 'image/jpeg', defaultCurrency = 'PHP') =>
    request('/ai/parse-receipt', {
      method: 'POST',
      body: JSON.stringify({ base64Data, mimeType, defaultCurrency }),
    }),
  aiFinancialAdvice: (payload) =>
    request('/ai/financial-advice', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export default api;
