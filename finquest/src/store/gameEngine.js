// ═══════════════════════════════════════════════════════
//  POCKETYODHA — GAME ENGINE
//  The brain behind all gamification
//  Action → Reward → Progress → Unlock → Repeat
// ═══════════════════════════════════════════════════════

// ── LEVEL TITLES ──
export const LEVEL_TITLES = [
  { level: 1,  title: 'Broke Beginner',      emoji: '😤', color: '#94a3b8' },
  { level: 2,  title: 'Penny Warrior',        emoji: '🪙', color: '#94a3b8' },
  { level: 3,  title: 'Budget Rookie',        emoji: '📋', color: '#22c55e' },
  { level: 4,  title: 'Smart Spender',        emoji: '🧠', color: '#22c55e' },
  { level: 5,  title: 'Savings Padawan',      emoji: '⚡', color: '#60a5fa' },
  { level: 6,  title: 'Money Guardian',       emoji: '🛡️', color: '#60a5fa' },
  { level: 7,  title: 'Debt Slayer',          emoji: '⚔️', color: '#a855f7' },
  { level: 8,  title: 'Wealth Architect',     emoji: '🏗️', color: '#a855f7' },
  { level: 9,  title: 'Compound Wizard',      emoji: '🔮', color: '#f97316' },
  { level: 10, title: 'Pro Strategist',       emoji: '♟️', color: '#f97316' },
  { level: 12, title: 'Financial Ninja',      emoji: '🥷', color: '#fbbf24' },
  { level: 15, title: 'Gold Sentinel',        emoji: '👑', color: '#fbbf24' },
  { level: 18, title: 'Scam Annihilator',     emoji: '🔱', color: '#ef4444' },
  { level: 20, title: 'Shadow Monarch',       emoji: '💀', color: '#ef4444' },
]

export function getTitleForLevel(level) {
  let title = LEVEL_TITLES[0]
  for (const t of LEVEL_TITLES) {
    if (level >= t.level) title = t
  }
  return title
}

// ── XP REQUIREMENTS ──
export function xpForLevel(level) {
  return Math.floor(300 * Math.pow(1.3, level - 1))
}

// ── RANK SYSTEM ──
export function rankFromLevel(level) {
  if (level >= 20) return { rank: 'S', color: '#ef4444', glow: 'rgba(239,68,68,0.4)', label: 'Shadow Monarch' }
  if (level >= 15) return { rank: 'A', color: '#fbbf24', glow: 'rgba(251,191,36,0.4)', label: 'Gold Sentinel' }
  if (level >= 10) return { rank: 'B', color: '#a855f7', glow: 'rgba(168,85,247,0.4)', label: 'Violet Mage' }
  if (level >= 6)  return { rank: 'C', color: '#60a5fa', glow: 'rgba(96,165,250,0.4)', label: 'Iron Hunter' }
  if (level >= 3)  return { rank: 'D', color: '#22c55e', glow: 'rgba(34,197,94,0.4)',  label: 'Stone Warrior' }
  return { rank: 'E', color: '#94a3b8', glow: 'rgba(148,163,184,0.3)', label: 'Awakened Soul' }
}

// ── ACHIEVEMENTS ──
export const ACHIEVEMENTS = [
  // EASY — Onboarding
  { id: 'first_login',    title: 'Awakened',          desc: 'Created your hunter profile',    emoji: '⚡', xp: 50,  tier: 'easy',   secret: false },
  { id: 'first_expense',  title: 'First Blood',       desc: 'Logged your first expense',      emoji: '💸', xp: 30,  tier: 'easy',   secret: false },
  { id: 'first_battle',   title: 'Demon Slayer I',    desc: 'Won your first battle',          emoji: '⚔️', xp: 50,  tier: 'easy',   secret: false },
  { id: 'first_quiz',     title: 'Scholar',           desc: 'Completed first quiz',           emoji: '🧠', xp: 40,  tier: 'easy',   secret: false },
  { id: 'set_goal',       title: 'Dreamer',           desc: 'Set your first savings goal',    emoji: '🎯', xp: 30,  tier: 'easy',   secret: false },
  { id: 'avatar_set',     title: 'Identity',          desc: 'Chose your warrior avatar',      emoji: '🎭', xp: 20,  tier: 'easy',   secret: false },

  // MEDIUM — Engagement
  { id: 'streak_3',       title: 'On Fire 🔥',        desc: '3-day login streak',             emoji: '🔥', xp: 100, tier: 'medium', secret: false },
  { id: 'streak_7',       title: 'Unstoppable',       desc: '7-day streak achieved',          emoji: '🏆', xp: 200, tier: 'medium', secret: false },
  { id: 'battles_5',      title: 'Demon Slayer V',    desc: 'Won 5 impulse battles',          emoji: '👹', xp: 150, tier: 'medium', secret: false },
  { id: 'scam_3',         title: 'Scam Shield',       desc: 'Blocked 3 scam attempts',        emoji: '🛡️', xp: 120, tier: 'medium', secret: false },
  { id: 'quiz_perfect',   title: 'Finance Genius',    desc: 'Perfect score on any quiz',      emoji: '💯', xp: 200, tier: 'medium', secret: false },
  { id: 'level_5',        title: 'Rising Star',       desc: 'Reached Level 5',                emoji: '⭐', xp: 150, tier: 'medium', secret: false },
  { id: 'save_1000',      title: 'Rupee Guardian',    desc: 'Saved ₹1,000 in mana pool',      emoji: '💰', xp: 180, tier: 'medium', secret: false },

  // HARD — Retention
  { id: 'streak_30',      title: 'Legendary Streak',  desc: '30-day streak — you\'re insane', emoji: '👑', xp: 500, tier: 'hard',   secret: false },
  { id: 'level_10',       title: 'Pro Strategist',    desc: 'Reached Level 10',               emoji: '♟️', xp: 400, tier: 'hard',   secret: false },
  { id: 'battles_20',     title: 'Demon King',        desc: 'Won 20 battles total',           emoji: '💀', xp: 350, tier: 'hard',   secret: false },
  { id: 'goal_complete',  title: 'Quest Master',      desc: 'Completed a savings goal',       emoji: '🏅', xp: 300, tier: 'hard',   secret: false },
  { id: 'rank_s',         title: 'Shadow Monarch',    desc: 'Achieved Rank S (Level 20)',     emoji: '🔱', xp: 1000,tier: 'hard',   secret: false },

  // SECRET — Surprise
  { id: 'night_owl',      title: 'Night Owl 🦉',      desc: 'Logged expense after midnight',  emoji: '🌙', xp: 75,  tier: 'secret', secret: true },
  { id: 'speed_quiz',     title: 'Lightning Brain',   desc: 'Answered quiz in under 3s',      emoji: '⚡', xp: 100, tier: 'secret', secret: true },
  { id: 'big_save',       title: 'Frugal Legend',     desc: 'Saved ₹10,000 total',            emoji: '🤑', xp: 250, tier: 'secret', secret: true },
  { id: 'comeback',       title: 'Comeback Kid',      desc: 'Returned after 3+ days away',   emoji: '🔄', xp: 80,  tier: 'secret', secret: true },
]

// ── DAILY MISSIONS ──
export function generateDailyMissions(user) {
  const isStudent = user.occupation === 'student'
  const all = [
    { id: 'log_3',      title: 'Log 3 Expenses',          desc: 'Track your spending',            xp: 30,  emoji: '📒', type: 'entry',   target: 3 },
    { id: 'win_battle', title: 'Defeat a Demon',           desc: 'Win 1 impulse battle',           xp: 50,  emoji: '⚔️', type: 'battle',  target: 1 },
    { id: 'quiz_5',     title: 'Answer 5 Quiz Questions',  desc: 'Stay sharp on finances',         xp: 40,  emoji: '🧠', type: 'quiz',    target: 5 },
    { id: 'no_want',    title: 'Zero Wants Today',         desc: 'Only log needs today',           xp: 60,  emoji: '🧘', type: 'budget',  target: 1 },
    { id: 'save_50',    title: isStudent ? 'Save ₹50' : 'Save ₹200',  desc: 'Add to your mana pool', xp: 45, emoji: '💰', type: 'save', target: isStudent ? 50 : 200 },
    { id: 'streak_up',  title: 'Keep Streak Alive',        desc: 'Login + 1 action today',         xp: 25,  emoji: '🔥', type: 'streak',  target: 1 },
  ]
  // Return 3 random missions per day (seeded by date so they don't change on refresh)
  const seed = new Date().toDateString()
  const seedNum = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const shuffled = [...all].sort((a, b) => {
    const ha = Math.sin(seedNum + a.id.length) * 10000
    const hb = Math.sin(seedNum + b.id.length) * 10000
    return ha - hb
  })
  return shuffled.slice(0, 3)
}

// ── WEEKLY CHALLENGE ──
export const WEEKLY_CHALLENGES = [
  { id: 'wk_no_swiggy',   title: 'No Food Delivery Week',   desc: '7 days, no Swiggy/Zomato',          xp: 300, emoji: '🚫🛵', difficulty: 'hard'   },
  { id: 'wk_log_all',     title: 'Perfect Logger',          desc: 'Log every expense for 5 days',       xp: 200, emoji: '📊',  difficulty: 'medium' },
  { id: 'wk_quiz_master', title: 'Quiz Week',               desc: 'Score 80%+ on 3 quizzes',            xp: 250, emoji: '🏆',  difficulty: 'medium' },
  { id: 'wk_battle_5',    title: 'Demon Week',              desc: 'Win 5 battles this week',            xp: 280, emoji: '⚔️',  difficulty: 'hard'   },
  { id: 'wk_save_20',     title: 'The 20% Challenge',       desc: 'Save 20% of weekly income',          xp: 350, emoji: '💰',  difficulty: 'hard'   },
]

export function getWeeklyChallenge() {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  return WEEKLY_CHALLENGES[weekNum % WEEKLY_CHALLENGES.length]
}

// ── VARIABLE REWARDS (Behavioral psychology — random bonus) ──
export function getRandomBonus() {
  const roll = Math.random()
  if (roll < 0.05) return { xp: 500, message: '🎰 JACKPOT! Rare bonus!',      color: '#fbbf24', rare: true }
  if (roll < 0.15) return { xp: 100, message: '🎁 Lucky Drop! Bonus XP!',     color: '#a855f7', rare: true }
  if (roll < 0.30) return { xp: 50,  message: '✨ Bonus XP incoming!',         color: '#4d9fff', rare: false }
  return null
}

// ── FIRE MESSAGES (Behavioral — makes it feel alive) ──
export const FIRE_MESSAGES = [
  "You're on fire 🔥",
  "Demon defeated! ⚔️",
  "Kya mast move tha bhai! 😤",
  "Financial beast mode activated 💪",
  "Your future self thanks you 🙏",
  "Budget warrior energy ⚡",
  "Scam couldn't catch you 🛡️",
  "Sigma grindset activated 👑",
  "Legend in the making 🏆",
  "That's how it's done! 🎯",
]

export function getFireMessage() {
  return FIRE_MESSAGES[Math.floor(Math.random() * FIRE_MESSAGES.length)]
}

// ── LOSS AVERSION MESSAGES ──
export const STREAK_BREAK_MESSAGES = [
  "Your streak broke 💔 — comeback bonus awaits!",
  "3 days gone... but legends return stronger 🔥",
  "The demons won today. Tomorrow you fight back.",
]

// ── PROGRESS BIAS (Show 70% not 0%) ──
export function getProgressBias(actual, max) {
  // Show at least 15% filled so user feels they've already started
  return Math.max(15, Math.round((actual / max) * 100))
}

// ── SCARCITY TIMER ──
export function getScarcityChallenge() {
  const now = Date.now()
  const end = now + (2 * 60 * 60 * 1000) // 2 hours from now
  return {
    title: '⏰ Limited: Double XP Event',
    desc: 'Any action earns 2× XP for the next 2 hours',
    endsAt: end,
    multiplier: 2,
  }
}

// ── XP ACTIONS TABLE ──
export const XP_ACTIONS = {
  log_need:       { xp: 15,  label: '+15 XP',  color: '#22c55e' },
  log_want:       { xp: 5,   label: '+5 XP',   color: '#f97316' },
  log_trap:       { xp: 0,   label: '−5 HP',   color: '#ef4444' },
  battle_win:     { xp: 60,  label: '+60 XP',  color: '#4d9fff' },
  battle_lose:    { xp: 0,   label: '−10 HP',  color: '#ef4444' },
  quiz_correct:   { xp: 25,  label: '+25 XP',  color: '#a855f7' },
  quiz_wrong:     { xp: 5,   label: '+5 XP',   color: '#8aa0c8' },  // still reward for trying
  daily_login:    { xp: 20,  label: '+20 XP',  color: '#fbbf24' },
  streak_bonus:   { xp: 10,  label: '+10 XP',  color: '#fbbf24' },  // per streak day
  mission_done:   { xp: 50,  label: '+50 XP',  color: '#22c55e' },
  goal_reached:   { xp: 300, label: '+300 XP', color: '#fbbf24' },
  achievement:    { xp: 100, label: '+100 XP', color: '#a855f7' },
}

// ── THEME UNLOCKS ──
export const UNLOCKABLE_THEMES = [
  { id: 'default',   name: 'Void Dark',      level: 1,  primary: '#4d9fff', bg: '#03050d',  description: 'Default hunter theme' },
  { id: 'crimson',   name: 'Crimson Blood',  level: 5,  primary: '#ef4444', bg: '#0d0505',  description: 'For the battle-hardened' },
  { id: 'forest',    name: 'Emerald Forest', level: 8,  primary: '#22c55e', bg: '#030d05',  description: 'Nature\'s warrior' },
  { id: 'royal',     name: 'Royal Purple',   level: 10, primary: '#a855f7', bg: '#05030d',  description: 'The mage\'s domain' },
  { id: 'solar',     name: 'Solar Gold',     level: 15, primary: '#fbbf24', bg: '#0d0a00',  description: 'Radiate like the sun' },
  { id: 'shadow',    name: 'Shadow Void',    level: 20, primary: '#ec4899', bg: '#000000',  description: 'Monarch of darkness' },
]