import { create } from 'zustand'
import { persist } from 'zustand/middleware'
 
// ─────────────────────────────────────────
//  FINQUEST — Expense Store
//  Handles all expense logic + classification
// ─────────────────────────────────────────
 
// Simple rule-based classifier (no ML needed for hackathon)
// Your teammate can swap this with TensorFlow.js later
const NEEDS_KEYWORDS = [
  'rent','groceries','medicine','hospital','doctor','electricity','water','gas',
  'transport','bus','auto','metro','school','college','fees','insurance',
  'chai','tea','food','rice','dal','sabzi','milk','bread','egg',
  'recharge','mobile','internet','wifi', 'petrol', 'diesel'
]
const WANTS_KEYWORDS = [
  'swiggy','zomato','blinkit','amazon','flipkart','netflix','hotstar','prime',
  'movie','game','gaming','party','bar','beer','wine','mall','shopping',
  'clothes','shoes','gadget','iphone','laptop','earphones','coffee','cafe',
  'pizza','burger','ice cream','chocolate','snacks','chips','juice'
]
const TRAP_KEYWORDS = [
  'lottery','prize','won','claim','offer','discount','cashback','free',
  'lucky','selected','otp','verify','kyc','block','urgent','suspended',
  'crypto','invest','scheme','double','triple','guaranteed','return'
]
 
export function classifyExpense(description) {
  const lower = description.toLowerCase()
  if (TRAP_KEYWORDS.some(k => lower.includes(k))) return 'trap'
  if (WANTS_KEYWORDS.some(k => lower.includes(k))) return 'want'
  if (NEEDS_KEYWORDS.some(k => lower.includes(k))) return 'need'
  return 'want' // default to want if unclear
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