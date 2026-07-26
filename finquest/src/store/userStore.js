import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { xpForLevel, rankFromLevel, getTitleForLevel } from './gameEngine'
export { xpForLevel, rankFromLevel, getTitleForLevel }
import api from '../api'

// ─────────────────────────────────────────
//  POCKETYODHA — User Store
//  Single source of truth for all user state
//
//  FIX (security review, July 2026):
//  - xpForLevel/rankFromLevel used to be duplicated here with a DIFFERENT
//    formula than gameEngine.js, causing level/rank to visibly desync
//    between screens. gameEngine.js is now the single source of truth —
//    do not redefine these here again.
//  - user.id was never generated at registration, so every API call in
//    Battle/ExpenseCapture/Review silently fell back to a shared 'guest'
//    account. register() now generates a real id + auth token and
//    persists the profile to the backend.
// ─────────────────────────────────────────

// Personalization config based on user profile
export function getPersonalizationConfig(profile) {
  const isStudent = profile.occupation === 'student'

  return {
    // Suggested monthly saving % based on income
    savingsRate: isStudent ? 0.15 : 0.20,

    // Budget categories weighted by occupation
    topCategories: isStudent
      ? ['Food', 'Transport', 'Study Material', 'Recharge', 'Entertainment']
      : ['Food', 'Transport', 'Rent', 'Bills', 'Shopping'],

    // Battle scenarios relevant to user
    battleTheme: isStudent ? 'student' : 'professional',

    // Quest suggestions
    suggestedGoals: isStudent
      ? [
          { label: 'New Phone', emoji: '📱', target: 15000 },
          { label: 'Laptop', emoji: '💻', target: 45000 },
          { label: 'Emergency Fund', emoji: '🛡️', target: 5000 },
          { label: 'Trip with Friends', emoji: '✈️', target: 10000 },
        ]
      : [
          { label: 'Emergency Fund (3 months)', emoji: '🛡️', target: 30000 },
          { label: 'New Bike / Scooter', emoji: '🏍️', target: 80000 },
          { label: 'Vacation', emoji: '✈️', target: 25000 },
          { label: 'Investment Corpus', emoji: '📈', target: 50000 },
        ],

    // Daily budget = monthly income / 30
    dailyBudget: Math.floor((profile.monthlyIncome || 5000) / 30),
  }
}

// Generates a real unique id. crypto.randomUUID() is available in all
// modern browsers served over https/localhost; falls back for older envs.
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export const useUserStore = create(
  persist(
    (set, get) => ({
      // ── Auth state ──
      isRegistered: false,
      isLoggedIn: false,

      // ── User profile ──
      user: null,
      /*
        user = {
          id: string,              // real unique id, generated once at registration
          authToken: string,       // bearer token returned by backend, proves ownership of `id`

          // Registration fields
          name, age, gender, occupation, institution, city,
          monthlyIncome, category,

          // Profile / Avatar
          avatarId, hunterName,

          // RPG Stats (level/rank always derived via gameEngine.js — never hardcode elsewhere)
          level, xp, xpToNext, hp, maxHp, mana, rank, streak, totalDaysActive,

          // Goals
          activeGoal, completedGoals,

          config,

          battlesWon, battlesLost, scamsBlocked, quizScore, badges,

          registeredAt, lastLoginAt,
        }
      */

      // ── Sync status (surfaced so pages can show "not saved" indicators) ──
      syncStatus: 'idle', // idle | syncing | synced | offline

      // ─── SYNC TO BACKEND ───
      // Fire-and-forget push of the full profile. Called after mutations.
      // Not debounced/queued yet — fine at hackathon scale; for production,
      // batch these (e.g. via a short setTimeout debounce) to cut request volume.
      syncUser: async () => {
        const { user } = get()
        if (!user?.id || !user?.authToken) return
        set({ syncStatus: 'syncing' })
        const res = await api.saveUser(user, user.authToken)
        set({ syncStatus: res.success ? 'synced' : 'offline' })
        return res
      },

      // ─── REGISTRATION ───
      register: async (formData) => {
        const config = getPersonalizationConfig(formData)
        const id = generateId()
        const user = {
          id,
          authToken: null, // filled in once the backend confirms registration

          // Profile
          name: formData.name,
          age: formData.age,
          gender: formData.gender,
          occupation: formData.occupation,
          institution: formData.institution || '',
          city: formData.city || '',
          monthlyIncome: Number(formData.monthlyIncome) || 5000,
          category: formData.occupation === 'student' ? 'student' : 'young_adult',

          // Avatar (set after registration)
          avatarId: formData.avatarId || 'warrior_1',
          hunterName: formData.hunterName || formData.name,

          // RPG Stats — all start fresh. maxHp is 100 across the whole app
          // (frontend UI, backend schema, all clamps) — do not change this
          // number in one place without changing it everywhere (app.py too).
          level: 1,
          xp: 0,
          xpToNext: xpForLevel(1),
          hp: 100,
          maxHp: 100,
          mana: 0,
          rank: 'E',
          streak: 0,
          totalDaysActive: 1,

          // Goals
          activeGoal: null,
          completedGoals: [],

          // Config
          config,

          // Game stats
          battlesWon: 0,
          battlesLost: 0,
          scamsBlocked: 0,
          quizScore: 0,
          badges: ['🌟 New Hunter'],

          // Timestamps
          registeredAt: Date.now(),
          lastLoginAt: Date.now(),
        }
        set({ user, isRegistered: true, isLoggedIn: true })

        // Register with backend — this call returns the auth token that
        // proves ownership of this id on every future request. Without
        // this, the profile only ever exists client-side.
        const res = await api.saveUser(user)
        if (res.success && res.data?.token) {
          set({ user: { ...get().user, authToken: res.data.token }, syncStatus: 'synced' })
        } else {
          // Registration still "succeeds" locally so the demo/offline flow
          // isn't blocked, but flag it so the UI can warn the user their
          // progress isn't backed up yet.
          set({ syncStatus: 'offline' })
        }
        return res
      },

      // ─── UPDATE AVATAR ───
      setAvatar: (avatarId) => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, avatarId } })
        get().syncUser()
      },

      setHunterName: (name) => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, hunterName: name } })
        get().syncUser()
      },

      // ─── LOGIN / LOGOUT ───
      login: () => {
        const { user } = get()
        if (!user) return
        set({ isLoggedIn: true, user: { ...user, lastLoginAt: Date.now() } })
      },
      logout: () => set({ isLoggedIn: false }),

      // ─── XP + LEVELING ───
      // Single source of truth for the leveling curve: gameEngine.js's
      // xpForLevel/rankFromLevel. The backend (app.py) mirrors this exact
      // formula server-side — if you change the curve, update both places.
      addXP: (amount) => {
        const { user } = get()
        if (!user) return false

        let { xp, xpToNext, level } = user
        xp += amount
        let leveledUp = false

        while (xp >= xpToNext) {
          xp -= xpToNext
          level += 1
          xpToNext = xpForLevel(level)
          leveledUp = true
        }

        const { rank } = rankFromLevel(level)
        set({ user: { ...user, xp, xpToNext, level, rank } })
        get().syncUser()
        return leveledUp
      },

      // ─── HP (0-100 scale everywhere) ───
      takeDamage: (amount) => {
        const { user } = get()
        if (!user) return
        const hp = Math.max(0, user.hp - amount)
        set({ user: { ...user, hp } })
        get().syncUser()
      },

      healHP: (amount) => {
        const { user } = get()
        if (!user) return
        const hp = Math.min(user.maxHp, user.hp + amount)
        set({ user: { ...user, hp } })
        get().syncUser()
      },

      // ─── MANA (SAVINGS) ───
      addMana: (amount) => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, mana: Math.max(0, user.mana + amount) } })
        get().syncUser()
      },

      // ─── BATTLES ───
      recordBattleWin: () => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, battlesWon: user.battlesWon + 1 } })
      },
      recordBattleLoss: () => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, battlesLost: user.battlesLost + 1 } })
      },

      // ─── SCAM TRIAL ───
      recordScamBlocked: () => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, scamsBlocked: user.scamsBlocked + 1 } })
        get().syncUser()
      },

      // ─── GOALS ───
      setGoal: (goal) => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, activeGoal: { ...goal, current: 0 } } })
        get().syncUser()
      },

      updateGoalProgress: (amount) => {
        const { user } = get()
        if (!user || !user.activeGoal) return
        const current = Math.min(user.activeGoal.target, user.activeGoal.current + amount)
        const completed = current >= user.activeGoal.target
        if (completed) {
          set({
            user: {
              ...user,
              activeGoal: { ...user.activeGoal, current },
              completedGoals: [...user.completedGoals, { ...user.activeGoal, completedAt: Date.now() }],
              badges: [...user.badges, `🏆 ${user.activeGoal.label} Complete`],
            }
          })
        } else {
          set({ user: { ...user, activeGoal: { ...user.activeGoal, current } } })
        }
        get().syncUser()
      },

      // ─── STREAK ───
      incrementStreak: () => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, streak: user.streak + 1 } })
        get().syncUser()
      },

      // ─── BADGES ───
      addBadge: (badge) => {
        const { user } = get()
        if (!user || user.badges.includes(badge)) return
        set({ user: { ...user, badges: [...user.badges, badge] } })
      },

      // ─── RESET (dev) ───
      reset: () => set({ isRegistered: false, isLoggedIn: false, user: null, syncStatus: 'idle' }),
    }),
    { name: 'pocketyodha-user' }
  )
)