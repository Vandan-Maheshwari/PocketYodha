// src/api.js
// Drop this in src/ and import in any component
// Usage: import api from '../api'
//
// FIX (security review, July 2026):
// - BASE was hardcoded to localhost, so this could never point at a real
//   deployed backend. Now reads VITE_API_URL, falling back to localhost
//   for local dev.
// - request() used to swallow every failure and return `null`, so callers
//   had no way to tell "network down" apart from "validation error" apart
//   from "succeeded." It now always returns { success, data, error, status }
//   so a component can show a real message instead of silently pretending
//   a save worked. Existing callers that only used the return value as
//   "the data" need a small update — see the bottom of this file.
// - Endpoints that touch a specific user's data (user, expenses, battles,
//   review, achievements) now require a bearer token, returned once by
//   the backend at registration and stored on user.authToken. Without it
//   the backend rejects the request with 401/403 instead of trusting a
//   client-supplied user_id (that was the IDOR hole).

const BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000/api'

async function request(method, path, body = null, token = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (token) opts.headers['Authorization'] = `Bearer ${token}`
  if (body) opts.body = JSON.stringify(body)

  try {
    const res = await fetch(`${BASE}${path}`, opts)
    let data = null
    try {
      data = await res.json()
    } catch {
      // non-JSON response (e.g. a proxy error page) — leave data null
    }

    if (!res.ok) {
      const error = data?.error || `Request failed (${res.status})`
      console.error(`[API] ${method} ${path} failed:`, error)
      return { success: false, data: null, error, status: res.status }
    }
    return { success: true, data, error: null, status: res.status }
  } catch (err) {
    // Network-level failure (server unreachable, CORS, offline, etc.)
    console.error(`[API] ${method} ${path} network error:`, err.message)
    return { success: false, data: null, error: 'network', status: 0 }
  }
}

const api = {
  // ── USER ──────────────────────────────────────────────────────
  // saveUser: on first call (registration) no token exists yet — the
  // backend creates the account and returns { token }. On every
  // subsequent call, pass the stored token so the backend can verify
  // this caller actually owns this user id.
  saveUser: (user, token = null) => request('POST', '/user', user, token),
  loadUser: (userId, token) => request('GET', `/user/${userId}`, null, token),

  // ── EXPENSES ──────────────────────────────────────────────────
  logExpense: (data, token) => request('POST', '/expenses', data, token),
  getExpenses: (userId, token, days = 30, page = 1, pageSize = 50) =>
    request('GET', `/expenses/${userId}?days=${days}&page=${page}&page_size=${pageSize}`, null, token),
  deleteExpense: (id, token) => request('DELETE', `/expenses/${id}`, null, token),

  // ── CLASSIFIER (standalone, no save, no user data — no auth needed) ──
  classify: (description, amount = 0) =>
    request('POST', '/classify', { description, amount }),

  // ── OCR (no user data — no auth needed, but rate-limited server-side) ──
  scanReceipt: (base64Image) =>
    request('POST', '/ocr', { image: base64Image }),

  // ── BATTLES ───────────────────────────────────────────────────
  logBattle: (userId, result, demon, xpChange, hpChange, token) =>
    request('POST', '/battle', {
      user_id: userId,
      result,
      demon,
      xp_change: xpChange,
      hp_change: hpChange,
    }, token),

  // ── WEEKLY REVIEW ─────────────────────────────────────────────
  getWeeklyReview: (userId, token) => request('GET', `/review/${userId}`, null, token),

  // ── ACHIEVEMENTS ──────────────────────────────────────────────
  saveAchievement: (userId, achievement, token) =>
    request('POST', '/achievements', { user_id: userId, achievement }, token),
  getAchievements: (userId, token) => request('GET', `/achievements/${userId}`, null, token),
}

export default api

// ─── HOW TO USE IN COMPONENTS ────────────────────────────────────────────────
//
// Every call now returns { success, data, error, status } — check
// `success` before using `data`, and show `error` to the user on failure
// instead of assuming the write went through.
//
// In ExpenseCapture.jsx:
//   import api from '../api'
//   const res = await api.classify(description, amount)
//   if (res.success) { /* use res.data.type, res.data.label, ... */ }
//
// In Battle.jsx (after win):
//   const res = await api.logBattle(user.id, 'win', demon.name, 60, 0, user.authToken)
//   if (!res.success) showToast('Battle result not saved — ' + res.error)
//
// In Register.jsx / userStore.js (after onboarding):
//   const res = await api.saveUser(user)               // first call, no token
//   if (res.success) user.authToken = res.data.token    // store the token returned
//
// In Dashboard.jsx (sync on load):
//   const res = await api.loadUser(user.id, user.authToken)
//   if (res.success) updateUser(res.data)  // sync from server → Zustand