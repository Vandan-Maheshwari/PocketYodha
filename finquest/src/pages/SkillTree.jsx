import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore, rankFromLevel } from '../store/userStore'
import { useGameFX, GameFXStyles } from '../components/GameFX'
import { getTitleForLevel, getFireMessage } from '../store/gameEngine'
 
// ═══════════════════════════════════════════
//  POCKETYODHA — SKILL TREE V2
//  Full RPG progression · GameFX · Unlocks
// ═══════════════════════════════════════════
 
const SKILL_TREE = [
  // ── ROW 1 — Starter (Level 1, free) ──
  {
    id: 'expense_eye', name: 'Expense Eye', emoji: '👁️', row: 1, col: 1,
    desc: 'See your spending breakdown live. Need vs Want vs Trap classified instantly.',
    ability: 'Unlocks Budget Oracle on Entry Log screen.',
    requiresLevel: 1, requiresSkills: [], xpCost: 0,
    color: '#4d9fff', category: 'tracking', starter: true,
  },
  {
    id: 'demon_sight', name: 'Demon Sight', emoji: '🔍', row: 1, col: 2,
    desc: 'You can now see impulse triggers before they strike. Battle Arena unlocked.',
    ability: 'Unlocks Battle Arena. Demons become visible.',
    requiresLevel: 1, requiresSkills: [], xpCost: 0,
    color: '#ef4444', category: 'battle', starter: true,
  },
  {
    id: 'budget_sense', name: 'Budget Sense', emoji: '🧭', row: 1, col: 3,
    desc: 'Oracle activates. Warns you 10 days before your money runs out.',
    ability: 'Budget Oracle forecasts appear. Daily budget tracker active.',
    requiresLevel: 1, requiresSkills: [], xpCost: 0,
    color: '#22c55e', category: 'tracking', starter: true,
  },
 
  // ── ROW 2 — Apprentice (Level 3) ──
  {
    id: 'iron_will', name: 'Iron Will', emoji: '⚔️', row: 2, col: 1,
    desc: 'Defeat 5 impulse demons in a row. Mental armor forged in financial fire.',
    ability: '+10 HP after every battle win. Streak bonus ×1.5 XP.',
    requiresLevel: 3, requiresSkills: ['demon_sight'], xpCost: 150,
    color: '#ef4444', category: 'battle',
  },
  {
    id: 'scam_vision', name: 'Scam Vision', emoji: '🕵️', row: 2, col: 2,
    desc: 'Train your eyes to spot UPI fraud, phishing SMS and fake offers in seconds.',
    ability: 'Scam trials unlock in Games. +80 XP per trial. Scams auto-flagged.',
    requiresLevel: 3, requiresSkills: ['expense_eye'], xpCost: 150,
    color: '#a855f7', category: 'safety',
  },
  {
    id: 'savings_seed', name: 'Savings Seed', emoji: '🌱', row: 2, col: 3,
    desc: 'Plant a goal. Every want you resist waters the seed. Watch it grow.',
    ability: 'Goal Tracker activates. Mana pool shown. Goal XP bonus ×2.',
    requiresLevel: 3, requiresSkills: ['budget_sense'], xpCost: 150,
    color: '#22c55e', category: 'savings',
  },
 
  // ── ROW 3 — Adept (Level 6) ──
  {
    id: 'budget_shield', name: 'Budget Shield', emoji: '🛡️', row: 3, col: 1,
    desc: 'Emergency fund built to ₹1,000+. Acts as a real shield against financial hits.',
    ability: 'Trap expense damage reduced by 50%. Emergency fund shown on Dashboard.',
    requiresLevel: 6, requiresSkills: ['iron_will', 'savings_seed'], xpCost: 400,
    color: '#60a5fa', category: 'savings',
  },
  {
    id: 'phantom_guard', name: 'Phantom Guard', emoji: '👻', row: 3, col: 2,
    desc: 'Advanced scam detection. Spot deepfake voices, fake QR codes, social engineering.',
    ability: 'All scam trials unlock. UPI fraud patterns shown. Scam Radar active.',
    requiresLevel: 6, requiresSkills: ['scam_vision'], xpCost: 400,
    color: '#a855f7', category: 'safety',
  },
  {
    id: 'compound_mind', name: 'Compound Mind', emoji: '📈', row: 3, col: 3,
    desc: 'Understand how ₹500/month becomes ₹1.15 lakh in 10 years. Invest your mana.',
    ability: 'SIP Simulator unlocks in Games. Investment XP badge. Goal time shown.',
    requiresLevel: 6, requiresSkills: ['savings_seed'], xpCost: 400,
    color: '#fbbf24', category: 'investing',
  },
 
  // ── ROW 4 — Expert (Level 10) ──
  {
    id: 'oracle_sight', name: 'Oracle Sight', emoji: '🔮', row: 4, col: 1,
    desc: 'AI predicts your next 30 days of finances based on your actual patterns.',
    ability: '30-day forecast shown. Weekly habit score. Spending predictions active.',
    requiresLevel: 10, requiresSkills: ['budget_shield', 'compound_mind'], xpCost: 800,
    color: '#a855f7', category: 'investing',
  },
  {
    id: 'mana_surge', name: 'Mana Surge', emoji: '⚡', row: 4, col: 2,
    desc: 'Maintain perfect budget week. Double XP activates automatically for 48 hours.',
    ability: '2× XP multiplier every perfect week. Surge notification appears.',
    requiresLevel: 10, requiresSkills: ['iron_will', 'budget_shield'], xpCost: 800,
    color: '#4d9fff', category: 'battle',
  },
  {
    id: 'wealth_ward', name: 'Wealth Ward', emoji: '💎', row: 4, col: 3,
    desc: 'Your financial aura repels scams and amplifies savings simultaneously.',
    ability: 'All defensive stats +25%. Passive mana generation. Ward badge shown.',
    requiresLevel: 10, requiresSkills: ['phantom_guard', 'compound_mind'], xpCost: 800,
    color: '#fbbf24', category: 'investing',
  },
 
  // ── ROW 5 — S-RANK ──
  {
    id: 'gold_sensei', name: 'Gold Sensei', emoji: '👑', row: 5, col: 2,
    desc: 'The pinnacle. Mastered budgeting, scam defense, and wealth building. Legend.',
    ability: 'S-Rank title. All abilities active. Gold Sensei badge. Legend mode.',
    requiresLevel: 20, requiresSkills: ['oracle_sight', 'mana_surge', 'wealth_ward'], xpCost: 3000,
    color: '#fbbf24', category: 'legend',
  },
]
 
const CAT_COLORS = {
  tracking: '#4d9fff', battle: '#ef4444', safety: '#a855f7',
  savings: '#22c55e', investing: '#fbbf24', legend: '#fbbf24',
}
 
// ── SKILL HEX NODE ──
function SkillNode({ skill, isUnlocked, isActive, canUnlock, isSelected, onSelect }) {
  const [hov, setHov] = useState(false)
  const locked = !isUnlocked && !canUnlock
  const c = isUnlocked || canUnlock ? skill.color : '#1e3a5f'
 
  return (
    <div
      onClick={() => onSelect(skill)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        cursor: locked ? 'default' : 'pointer',
        opacity: locked ? 0.3 : 1,
        transition: 'all 0.2s',
        transform: hov && !locked ? 'scale(1.08) translateY(-3px)' : isSelected ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* Hexagon */}
      <div style={{
        width: 68, height: 68,
        clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
        background: isActive
          ? `linear-gradient(135deg,${skill.color},${skill.color}88)`
          : isUnlocked
          ? `rgba(${hexToRgb(skill.color)},0.15)`
          : canUnlock
          ? `rgba(${hexToRgb(skill.color)},0.08)`
          : 'rgba(255,255,255,0.02)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: locked ? 22 : 26,
        boxShadow: isActive
          ? `0 0 24px ${skill.color}60, 0 0 48px ${skill.color}20`
          : isSelected
          ? `0 0 16px ${skill.color}40`
          : canUnlock
          ? `0 0 10px ${skill.color}20`
          : 'none',
        outline: isSelected ? `2px solid ${skill.color}` : 'none',
        outlineOffset: 3,
        animation: isActive ? 'node-glow 2s ease-in-out infinite' : 'none',
        transition: 'all 0.3s',
        position: 'relative',
      }}>
        {locked ? '🔒' : skill.emoji}
 
        {/* Active dot */}
        {isActive && (
          <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: skill.color, boxShadow: `0 0 8px ${skill.color}`, animation: 'blink-dot 1.5s infinite' }} />
        )}
      </div>
 
      {/* Label */}
      <div style={{ fontSize: 9, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 0.5, color: isActive ? skill.color : isUnlocked ? '#dce8ff' : canUnlock ? '#8aa0c8' : '#1e3a5f', textAlign: 'center', lineHeight: 1.2, maxWidth: 72 }}>
        {skill.name}
      </div>
 
      {/* Level requirement */}
      {!isUnlocked && (
        <div style={{ fontSize: 8, color: canUnlock ? skill.color : '#1e3a5f', fontFamily: 'JetBrains Mono, monospace' }}>Lv.{skill.requiresLevel}</div>
      )}
    </div>
  )
}
 
// ── SKILL DETAIL PANEL ──
function SkillDetail({ skill, isUnlocked, isActive, canUnlock, hunterXP, hunterLevel, onUnlock }) {
  const [unlocking, setUnlocking] = useState(false)
 
  if (!skill) return (
    <div style={{ background: 'rgba(6,10,22,0.9)', border: '1px solid rgba(77,159,255,0.08)', padding: '24px', textAlign: 'center', color: '#1e3a5f', fontSize: 13 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>⬆</div>
      Tap a skill node above to view details
    </div>
  )
 
  const canAfford = hunterXP >= skill.xpCost
  const meetsLevel = hunterLevel >= skill.requiresLevel
 
  const handleUnlock = async () => {
    setUnlocking(true)
    await new Promise(r => setTimeout(r, 600))
    onUnlock(skill)
    setUnlocking(false)
  }
 
  return (
    <div style={{ background: `rgba(${hexToRgb(skill.color)},0.04)`, border: `1px solid ${skill.color}25`, animation: 'fade-up 0.25s ease' }}>
      {/* Header */}
      <div style={{ background: `rgba(${hexToRgb(skill.color)},0.08)`, borderBottom: `1px solid ${skill.color}20`, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 54, height: 54, clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)', background: isActive ? `linear-gradient(135deg,${skill.color},${skill.color}88)` : `rgba(${hexToRgb(skill.color)},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: isActive ? `0 0 20px ${skill.color}50` : 'none' }}>
          {skill.emoji}
        </div>
        <div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 17, letterSpacing: 1, marginBottom: 5 }}>{skill.name}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 9, background: `rgba(${hexToRgb(skill.color)},0.12)`, border: `1px solid ${skill.color}30`, color: skill.color, padding: '2px 8px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
              {CAT_COLORS[skill.category] ? skill.category : 'unknown'}
            </div>
            {isActive && <div style={{ fontSize: 9, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '2px 8px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1 }}>ACTIVE</div>}
            {isUnlocked && !isActive && <div style={{ fontSize: 9, background: 'rgba(77,159,255,0.1)', border: '1px solid rgba(77,159,255,0.3)', color: '#4d9fff', padding: '2px 8px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1 }}>UNLOCKED</div>}
            {skill.starter && <div style={{ fontSize: 9, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', padding: '2px 8px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1 }}>FREE</div>}
          </div>
        </div>
      </div>
 
      <div style={{ padding: '16px 18px' }}>
        <p style={{ fontSize: 13, color: '#8aa0c8', lineHeight: 1.7, marginBottom: 14 }}>{skill.desc}</p>
 
        {/* Ability box */}
        <div style={{ background: 'rgba(6,10,22,0.8)', borderLeft: `3px solid ${skill.color}`, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: skill.color, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: 4 }}>Ability Unlocked</div>
          <div style={{ fontSize: 13, color: '#dce8ff' }}>{skill.ability}</div>
        </div>
 
        {/* Requirements */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ fontSize: 10, background: meetsLevel ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${meetsLevel ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, color: meetsLevel ? '#22c55e' : '#ef4444', padding: '4px 10px', fontFamily: 'JetBrains Mono, monospace' }}>
            {meetsLevel ? '✓' : '✗'} Lv.{skill.requiresLevel} required
          </div>
          {skill.xpCost > 0 && (
            <div style={{ fontSize: 10, background: canAfford ? 'rgba(77,159,255,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${canAfford ? 'rgba(77,159,255,0.25)' : 'rgba(239,68,68,0.25)'}`, color: canAfford ? '#4d9fff' : '#ef4444', padding: '4px 10px', fontFamily: 'JetBrains Mono, monospace' }}>
              {canAfford ? '✓' : '✗'} {skill.xpCost} XP cost
            </div>
          )}
        </div>
 
        {/* Action button */}
        {!isUnlocked && canUnlock && (
          <button
            onClick={handleUnlock}
            disabled={!canAfford || unlocking}
            style={{ width: '100%', background: canAfford ? `linear-gradient(135deg,${skill.color}cc,${skill.color}88)` : 'rgba(15,24,48,0.5)', border: 'none', color: canAfford ? '#000' : '#1e3a5f', padding: '13px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1.5, textTransform: 'uppercase', cursor: canAfford ? 'pointer' : 'not-allowed', clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)', transition: 'all 0.2s', boxShadow: canAfford ? `0 0 20px ${skill.color}30` : 'none', animation: unlocking ? 'unlock-pulse 0.6s ease' : 'none' }}
          >
            {unlocking ? '⚡ Unlocking...' : canAfford ? `⚡ Unlock — ${skill.xpCost} XP` : `Need ${skill.xpCost} XP (have ${hunterXP})`}
          </button>
        )}
 
        {!isUnlocked && !canUnlock && (
          <div style={{ textAlign: 'center', padding: '12px', border: '1px solid rgba(77,159,255,0.08)', color: '#1e3a5f', fontSize: 13 }}>
            🔒 Requires Lv.{skill.requiresLevel}{skill.requiresSkills.length > 0 ? ` + prerequisite skills` : ''}
          </div>
        )}
 
        {isUnlocked && (
          <div style={{ textAlign: 'center', padding: '12px', border: `1px solid ${skill.color}30`, color: skill.color, fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1 }}>
            ✓ SKILL ACTIVE
          </div>
        )}
      </div>
    </div>
  )
}
 
// ════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════
export default function SkillTree() {
  const navigate = useNavigate()
  const { user, addXP } = useUserStore()
  const { triggerXP, triggerLevelUp, triggerConfetti, triggerFireMessage, triggerFlash, FXLayer } = useGameFX()
 
  const [unlocked, setUnlocked] = useState(new Set(['expense_eye', 'demon_sight', 'budget_sense']))
  const [selected, setSelected] = useState(null)
  const [unlockAnim, setUnlockAnim] = useState(null)
 
  if (!user) { navigate('/register'); return null }
 
  const { rank, color: rankColor } = rankFromLevel(user.level)
  const title = getTitleForLevel(user.level)
  const xpPct = Math.round((user.xp / user.xpToNext) * 100)
 
  const canUnlockSkill = (skill) => {
    if (unlocked.has(skill.id)) return false
    if (user.level < skill.requiresLevel) return false
    return skill.requiresSkills.every(req => unlocked.has(req))
  }
 
  const handleUnlock = (skill) => {
    if (!canUnlockSkill(skill)) return
    if (skill.xpCost > user.xp) return
 
    if (skill.xpCost > 0) addXP(-skill.xpCost)
    setUnlocked(prev => new Set([...prev, skill.id]))
    setUnlockAnim(skill.id)
 
    // FX sequence
    triggerFlash(`rgba(${hexToRgb(skill.color)},0.12)`)
    setTimeout(() => triggerXP(0, skill.color), 200)
    setTimeout(() => triggerConfetti(), 400)
    setTimeout(() => triggerFireMessage(`${skill.emoji} ${skill.name} unlocked!`), 600)
    setTimeout(() => setUnlockAnim(null), 2000)
  }
 
  const rows = [1, 2, 3, 4, 5]
  const unlockedCount = unlocked.size
  const rowLabels = ['Starter Skills', 'Apprentice · Lv.3', 'Adept · Lv.6', 'Expert · Lv.10', 'S-Rank · Lv.20']
 
  return (
    <div style={{ minHeight: '100vh', background: '#03050d', color: '#dce8ff', fontFamily: 'DM Sans, sans-serif', paddingBottom: 90 }}>
      <GameFXStyles />
      <FXLayer />
 
      {/* Grid bg */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(77,159,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(77,159,255,0.015) 1px,transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
 
      {/* Unlock animation overlay */}
      {unlockAnim && (() => {
        const sk = SKILL_TREE.find(s => s.id === unlockAnim)
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', animation: 'scale-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>{sk?.emoji}</div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, letterSpacing: 3, color: sk?.color }}>SKILL UNLOCKED</div>
              <div style={{ fontSize: 14, color: '#8aa0c8', marginTop: 6 }}>{sk?.name}</div>
            </div>
          </div>
        )
      })()}
 
      {/* Top bar */}
      <div style={{ background: 'rgba(3,5,13,0.95)', borderBottom: '1px solid rgba(77,159,255,0.07)', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#8aa0c8', cursor: 'pointer', fontSize: 20 }}>←</button>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: 3 }}>🛡 SKILL TREE</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#a855f7' }}>{unlockedCount}/{SKILL_TREE.length}</div>
      </div>
 
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px 14px' }}>
 
        {/* Hunter XP card */}
        <div style={{ background: 'rgba(6,10,22,0.9)', border: `1px solid ${rankColor}20`, padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)', background: `rgba(${hexToRgb(rankColor)},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: `0 0 14px ${rankColor}30` }}>
            {title.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11 }}>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: rankColor }}>{title.title}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#3d5270' }}>Lv.{user.level} · {user.xp} XP available</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${xpPct}%`, background: `linear-gradient(90deg,${rankColor}88,${rankColor})`, borderRadius: 3, transition: 'width 1s ease', boxShadow: `0 0 8px ${rankColor}50` }} />
            </div>
          </div>
        </div>
 
        {/* Category legend */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(CAT_COLORS).map(([cat, color]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#3d5270', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 0.5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
              {cat}
            </div>
          ))}
        </div>
 
        {/* ── SKILL TREE GRID ── */}
        <div style={{ background: 'rgba(6,10,22,0.9)', border: '1px solid rgba(77,159,255,0.08)', padding: '20px 12px', marginBottom: 14, overflowX: 'auto' }}>
          {rows.map((row, ri) => {
            const rowSkills = SKILL_TREE.filter(s => s.row === row)
            return (
              <div key={row} style={{ marginBottom: ri < 4 ? 24 : 0 }}>
                {/* Row label */}
                <div style={{ fontSize: 9, color: '#1e3a5f', letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textAlign: 'center', marginBottom: 14, position: 'relative' }}>
                  <span style={{ background: '#03050d', padding: '0 12px', position: 'relative', zIndex: 1 }}>{rowLabels[ri]}</span>
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(77,159,255,0.06)', transform: 'translateY(-50%)', zIndex: 0 }} />
                </div>
 
                {/* Skill nodes row */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, position: 'relative' }}>
                  {/* Connector line between nodes */}
                  {rowSkills.length > 1 && (
                    <div style={{ position: 'absolute', top: 34, left: '50%', transform: 'translateX(-50%)', height: 1, width: `${(rowSkills.length - 1) * 108}px`, background: 'rgba(77,159,255,0.08)' }} />
                  )}
 
                  {rowSkills.map(skill => (
                    <SkillNode
                      key={skill.id}
                      skill={skill}
                      isUnlocked={unlocked.has(skill.id)}
                      isActive={unlocked.has(skill.id)}
                      canUnlock={canUnlockSkill(skill)}
                      isSelected={selected?.id === skill.id}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
 
                {/* Vertical connector */}
                {ri < 4 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                    <div style={{ width: 1, height: 16, background: 'rgba(77,159,255,0.08)' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
 
        {/* ── SKILL DETAIL ── */}
        <SkillDetail
          skill={selected}
          isUnlocked={selected ? unlocked.has(selected.id) : false}
          isActive={selected ? unlocked.has(selected.id) : false}
          canUnlock={selected ? canUnlockSkill(selected) : false}
          hunterXP={user.xp}
          hunterLevel={user.level}
          onUnlock={handleUnlock}
        />
 
        {/* Progress summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 12 }}>
          {[
            { l: 'Unlocked', v: `${unlockedCount}/${SKILL_TREE.length}`, c: '#4d9fff' },
            { l: 'XP Available', v: user.xp, c: '#fbbf24' },
            { l: 'Next unlock', v: `Lv.${Math.min(...SKILL_TREE.filter(s => !unlocked.has(s.id)).map(s => s.requiresLevel))}`, c: '#a855f7' },
          ].map(s => (
            <div key={s.l} style={{ background: 'rgba(6,10,22,0.9)', border: '1px solid rgba(77,159,255,0.07)', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 9, color: '#1e3a5f', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
 
      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(2,4,11,0.98)', borderTop: '1px solid rgba(77,159,255,0.06)', display: 'flex', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        {[
          { emoji: '🏠', label: 'Home', to: '/dashboard' },
          { emoji: '⚔️', label: 'Battle', to: '/battle' },
          { emoji: '💰', label: 'Log', to: '/expenses' },
          { emoji: '🛡️', label: 'Skills', to: '/skills', active: true },
          { emoji: '👤', label: 'Profile', to: '/profile' },
        ].map(b => (
          <button key={b.to} onClick={() => navigate(b.to)} style={{ flex: 1, background: 'none', border: 'none', borderTop: b.active ? '2px solid #a855f7' : '2px solid transparent', padding: '12px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: b.active ? '#a855f7' : '#1e3a5f' }}>
            <span style={{ fontSize: 20 }}>{b.emoji}</span>
            <span style={{ fontSize: 8, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>{b.label}</span>
          </button>
        ))}
      </div>
 
      <style>{`
        @keyframes fade-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes node-glow{0%,100%{box-shadow:0 0 20px currentColor}50%{box-shadow:0 0 40px currentColor}}
        @keyframes blink-dot{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes scale-pop{0%{opacity:0;transform:scale(0.5)}60%{opacity:1;transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes unlock-pulse{0%,100%{opacity:1}50%{opacity:0.6}}
      `}</style>
    </div>
  )
}
 
function hexToRgb(hex) {
  if (!hex?.startsWith('#')) return '77,159,255'
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`
}