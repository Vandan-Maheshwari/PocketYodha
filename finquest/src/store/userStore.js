import { create } from 'zustand'
import { persist } from 'zustand/middleware'
 
// ─────────────────────────────────────────
//  POCKETYODHA — User Store
//  Single source of truth for all user state
// ─────────────────────────────────────────
 
// Personalization config based on user profile
export function getPersonalizationConfig(profile) {
  const isStudent = profile.occupation === 'student'
  const isYoungAdult = !isStudent
 
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
 
// XP thresholds per level
export function xpForLevel(level) {
  return Math.floor(500 * Math.pow(1.35, level - 1))
}
 
// Rank from level
export function rankFromLevel(level) {
  if (level >= 20) return { rank: 'S', color: '#ef4444', label: 'Shadow Monarch' }
  if (level >= 15) return { rank: 'A', color: '#fbbf24', label: 'Gold Sentinel' }
  if (level >= 10) return { rank: 'B', color: '#a855f7', label: 'Violet Mage' }
  if (level >= 6)  return { rank: 'C', color: '#60a5fa', label: 'Iron Hunter' }
  if (level >= 3)  return { rank: 'D', color: '#22c55e', label: 'Stone Warrior' }
  return { rank: 'E', color: '#94a3b8', label: 'Awakened Soul' }
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
          // Registration fields
          name: string,
          age: number,
          gender: string,         // 'male' | 'female' | 'other' | 'prefer_not'
          occupation: string,     // 'student' | 'working' | 'freelancer' | 'business'
          institution: string,    // college/company name
          city: string,
          monthlyIncome: number,  // pocket money or salary
          category: string,       // 'student' | 'young_adult'
 
          // Profile / Avatar
          avatarId: string,       // selected avatar id
          hunterName: string,     // display name in game
 
          // RPG Stats
          level: number,
          xp: number,
          xpToNext: number,
          hp: number,
          maxHp: number,
          mana: number,           // savings pool
          rank: string,
          streak: number,
          totalDaysActive: number,
 
          // Goals
          activeGoal: { label, emoji, target, current },
          completedGoals: [],
 
          // Personalization
          config: {},             // from getPersonalizationConfig()
 
          // Game stats
          battlesWon: number,
          battlesLost: number,
          scamsBlocked: number,
          quizScore: number,
          badges: [],
 
          // Timestamps
          registeredAt: number,
          lastLoginAt: number,
        }
      */
 
      // ─── REGISTRATION ───
      register: (formData) => {
        const config = getPersonalizationConfig(formData)
        const user = {
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
 
          // RPG Stats — all start fresh
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
      },
 
      // ─── UPDATE AVATAR ───
      setAvatar: (avatarId) => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, avatarId } })
      },
 
      setHunterName: (name) => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, hunterName: name } })
      },
 
      // ─── LOGIN / LOGOUT ───
      login: () => {
        const { user } = get()
        if (!user) return
        set({ isLoggedIn: true, user: { ...user, lastLoginAt: Date.now() } })
      },
      logout: () => set({ isLoggedIn: false }),
 
      // ─── XP + LEVELING ───
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
        return leveledUp
      },
 
      // ─── HP ───
      takeDamage: (amount) => {
        const { user } = get()
        if (!user) return
        const hp = Math.max(0, user.hp - amount)
        set({ user: { ...user, hp } })
      },
 
      healHP: (amount) => {
        const { user } = get()
        if (!user) return
        const hp = Math.min(user.maxHp, user.hp + amount)
        set({ user: { ...user, hp } })
      },
 
      // ─── MANA (SAVINGS) ───
      addMana: (amount) => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, mana: Math.max(0, user.mana + amount) } })
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
 
      // ─── GOALS ───
      setGoal: (goal) => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, activeGoal: { ...goal, current: 0 } } })
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
      },
 
      // ─── STREAK ───
      incrementStreak: () => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, streak: user.streak + 1 } })
      },
 
      // ─── BADGES ───
      addBadge: (badge) => {
        const { user } = get()
        if (!user || user.badges.includes(badge)) return
        set({ user: { ...user, badges: [...user.badges, badge] } })
      },
 
      // ─── RESET (dev) ───
      reset: () => set({ isRegistered: false, isLoggedIn: false, user: null }),
    }),
    { name: 'pocketyodha-user' }
  )
)