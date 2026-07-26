import { create } from 'zustand'
import { persist } from 'zustand/middleware'
 
// ─────────────────────────────────────────
//  FINQUEST — Expense Store
//  Handles all expense logic + classification
// ─────────────────────────────────────────
 
// FIX (security/consistency review, July 2026): this used to be an
// independently-maintained keyword list that had drifted from the backend's
// classifier in app.py — the two disagreed on real inputs (e.g. this file
// defaulted unclear expenses to 'want', app.py defaults to 'need'). That
// meant a user could see one classification instantly here and a different
// one once the server round-trip landed.
//
// app.py's classify_expense() is the single source of truth. This copy is
// kept ONLY for instant client-side feedback before the network call
// resolves (see ExpenseCapture.jsx's live-classify effect) and is written
// to score identically — same keyword lists, same trap > want > need
// priority, same default. If you change app.py's classifier, update this
// file to match, or better, delete this file and always await the API.
const NEEDS_KEYWORDS = [
  "rent","electricity","bill","bus","auto","metro","train","medicine","medical",
  "hospital","doctor","tuition","fee","grocery","groceries","dal","rice","roti",
  "sabzi","vegetables","milk","water","petrol","fuel","school","college","book",
  "stationery","internet","mobile","recharge","uniform","repair","maintenance"
]
const WANTS_KEYWORDS = [
  "swiggy","zomato","blinkit","instamart","amazon","flipkart","meesho","myntra",
  "ajio","nykaa","movie","cinema","pvr","inox","cafe","coffee","starbucks","ccd",
  "restaurant","hotel","dining","mall","shopping","clothes","fashion","shoe",
  "gaming","game","netflix","hotstar","spotify","youtube","premium","subscription",
  "party","celebration","gift","salon","spa","gym","fitness","travel","trip","tour",
  "ola","uber","rapido","bike","taxi","holiday","vacation"
]
const TRAP_KEYWORDS = [
  "lottery","prize","winner","won","congratulations","free money","claim",
  "invest now","guaranteed return","double money","crypto tips","forex",
  "mlm","network marketing","join now","limited offer","urgent","act fast",
  "otp","share otp","verify account","kyc expire","block","suspended",
  "phishing","unknown","suspicious","fraud","scam","hack"
]

export function classifyExpense(description, amount = 0) {
  const text = description.toLowerCase().trim()
  const trapScore = TRAP_KEYWORDS.filter(k => text.includes(k)).length
  const wantScore = WANTS_KEYWORDS.filter(k => text.includes(k)).length
  const needScore = NEEDS_KEYWORDS.filter(k => text.includes(k)).length

  if (amount > 2000 && trapScore === 0 && wantScore === 0 && needScore === 0) {
    return 'want'
  }
  if (trapScore > 0) return 'trap'
  if (wantScore > needScore) return 'want'
  if (needScore > 0) return 'need'
  return 'need' // matches backend's default — was 'want' here before, a real disagreement
}
 
// Quick-tap category presets
export const QUICK_CATEGORIES = [
  { id: 'food',      label: 'Food',       emoji: '🍛', type: 'need',  color: '#22c55e' },
  { id: 'transport', label: 'Travel',     emoji: '🚌', type: 'need',  color: '#22c55e' },
  { id: 'recharge',  label: 'Recharge',   emoji: '📱', type: 'need',  color: '#22c55e' },
  { id: 'groceries', label: 'Groceries',  emoji: '🛒', type: 'need',  color: '#22c55e' },
  { id: 'cafe',      label: 'Café',       emoji: '☕', type: 'want',  color: '#f97316' },
  { id: 'shopping',  label: 'Shopping',   emoji: '🛍️', type: 'want',  color: '#f97316' },
  { id: 'movies',    label: 'Movies',     emoji: '🎬', type: 'want',  color: '#f97316' },
  { id: 'gaming',    label: 'Gaming',     emoji: '🎮', type: 'want',  color: '#f97316' },
  { id: 'swiggy',    label: 'Swiggy',     emoji: '🛵', type: 'want',  color: '#f97316' },
  { id: 'medical',   label: 'Medical',    emoji: '💊', type: 'need',  color: '#22c55e' },
  { id: 'friends',   label: 'Friends',    emoji: '🎉', type: 'want',  color: '#f97316' },
  { id: 'other',     label: 'Other',      emoji: '💸', type: 'want',  color: '#8aa0c8' },
]
 
// HP damage + XP rewards per type
export const EXPENSE_IMPACT = {
  need: { hp: 0,  xp: 10, mana: 0   },
  want: { hp: -5, xp: 0,  mana: -1  },
  trap: { hp: -25,xp: 0,  mana: -10 },
}
 
export const useExpenseStore = create(
  persist(
    (set, get) => ({
      expenses: [],   // array of expense objects
      todayTotal: 0,
      weekTotal: 0,
 
      addExpense: (expense) => {
        const newExpense = {
          id: Date.now(),
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          type: expense.type || classifyExpense(expense.description),
          timestamp: Date.now(),
          date: new Date().toLocaleDateString('en-IN'),
        }
        const all = [newExpense, ...get().expenses]
 
        // Recalculate today + week totals
        const today = new Date().toLocaleDateString('en-IN')
        const todayTotal = all
          .filter(e => e.date === today)
          .reduce((sum, e) => sum + e.amount, 0)
 
        set({ expenses: all, todayTotal })
        return newExpense
      },
 
      deleteExpense: (id) => {
        set({ expenses: get().expenses.filter(e => e.id !== id) })
      },
 
      getTodayExpenses: () => {
        const today = new Date().toLocaleDateString('en-IN')
        return get().expenses.filter(e => e.date === today)
      },
 
      getWeekExpenses: () => {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        return get().expenses.filter(e => e.timestamp > weekAgo)
      },
 
      // Budget forecast: "broke in N days?"
      getBudgetForecast: (monthlyIncome) => {
        const today = get().getTodayExpenses()
        const dailyAvg = today.reduce((s, e) => s + e.amount, 0) || 0
        if (dailyAvg === 0) return null
        const dayOfMonth = new Date().getDate()
        const daysLeft = 30 - dayOfMonth
        const spent = get().getWeekExpenses().reduce((s, e) => s + e.amount, 0)
        const remaining = monthlyIncome - spent
        const daysUntilBroke = Math.floor(remaining / (dailyAvg || 1))
        return { dailyAvg, remaining, daysUntilBroke, isRisky: daysUntilBroke < 10 }
      },
 
      clearAll: () => set({ expenses: [], todayTotal: 0, weekTotal: 0 }),
    }),
    { name: 'finquest-expenses' }
  )
)