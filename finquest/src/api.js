// src/api.js
// Drop this in src/ and import in any component
// Usage: import api from '../api'

const BASE = "http://localhost:5000/api";

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "API error");
    return data;
  } catch (err) {
    console.error(`[API] ${method} ${path} failed:`, err.message);
    return null;
  }
}

const api = {
  // ── USER ──────────────────────────────────────────────────────
  saveUser: (user) => request("POST", "/user", user),
  loadUser: (userId) => request("GET", `/user/${userId}`),

  // ── EXPENSES ──────────────────────────────────────────────────
  logExpense: (data) => request("POST", "/expenses", data),
  getExpenses: (userId, days = 30) => request("GET", `/expenses/${userId}?days=${days}`),
  deleteExpense: (id) => request("DELETE", `/expenses/${id}`),

  // ── CLASSIFIER (standalone, no save) ─────────────────────────
  classify: (description, amount = 0) =>
    request("POST", "/classify", { description, amount }),

  // ── OCR ───────────────────────────────────────────────────────
  scanReceipt: (base64Image) =>
    request("POST", "/ocr", { image: base64Image }),

  // ── BATTLES ───────────────────────────────────────────────────
  logBattle: (userId, result, demon, xpChange, hpChange) =>
    request("POST", "/battle", {
      user_id: userId,
      result,
      demon,
      xp_change: xpChange,
      hp_change: hpChange,
    }),

  // ── WEEKLY REVIEW ─────────────────────────────────────────────
  getWeeklyReview: (userId) => request("GET", `/review/${userId}`),

  // ── ACHIEVEMENTS ──────────────────────────────────────────────
  saveAchievement: (userId, achievement) =>
    request("POST", "/achievements", { user_id: userId, achievement }),
  getAchievements: (userId) => request("GET", `/achievements/${userId}`),
};

export default api;


// ─── HOW TO USE IN COMPONENTS ────────────────────────────────────────────────
//
// In ExpenseCapture.jsx:
//   import api from '../api'
//   const result = await api.classify(description, amount)
//   // result = { type: 'want', label: '...', hp_impact: -5, trigger_battle: false }
//
// In Battle.jsx (after win):
//   await api.logBattle(user.id, 'win', demon.name, 60, 0)
//
// In Register.jsx (after onboarding):
//   await api.saveUser({ id: user.id, name, age, occupation, income, ... })
//
// In Dashboard.jsx (sync on load):
//   const serverData = await api.loadUser(user.id)
//   if (serverData) updateUser(serverData)  // sync from server → Zustand