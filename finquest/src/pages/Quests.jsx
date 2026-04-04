import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useExpenseStore } from '../hooks/useExpenses'
import { useGameFX, GameFXStyles } from '../components/GameFX'
import { getFireMessage } from '../store/gameEngine'
 
// ═══════════════════════════════════════════
//  POCKETYODHA — QUESTS V2
//  Smart goals · Custom · Battle-connected
//  Monthly saving auto-calculated
// ═══════════════════════════════════════════
 
// ── AI-Suggested goals (personalized by occupation + income) ──
function getSuggestedGoals(user) {
  const income = user.monthlyIncome
  const isStudent = user.occupation === 'student'
  const savingsRate = isStudent ? 0.15 : 0.20
  const monthlySave = Math.floor(income * savingsRate)
 
  if (isStudent) {
    return [
      { label: 'New Phone',        emoji: '📱', target: Math.max(8000, Math.round(income * 2)),    months: Math.ceil(Math.max(8000, income * 2) / monthlySave),   why: 'Most common student goal', popular: true },
      { label: 'Laptop',           emoji: '💻', target: Math.max(25000, Math.round(income * 6)),   months: Math.ceil(Math.max(25000, income * 6) / monthlySave),  why: 'For studies & freelancing' },
      { label: 'Emergency Fund',   emoji: '🛡️', target: Math.max(3000, Math.round(income * 0.8)),  months: Math.ceil(Math.max(3000, income * 0.8) / monthlySave), why: 'Your financial safety net', recommended: true },
      { label: 'Trip with Friends',emoji: '✈️', target: Math.max(5000, Math.round(income * 1.2)),  months: Math.ceil(Math.max(5000, income * 1.2) / monthlySave), why: 'Planned fun > impulse fun' },
      { label: 'Course / Skill',   emoji: '🎓', target: Math.max(2000, Math.round(income * 0.5)),  months: Math.ceil(Math.max(2000, income * 0.5) / monthlySave), why: 'Invest in yourself' },
    ]
  } else {
    return [
      { label: 'Emergency Fund (3 mo)', emoji: '🛡️', target: income * 3,              months: Math.ceil(income * 3 / monthlySave),   why: '3 months expenses = real safety', recommended: true },
      { label: 'New Bike / Scooter',    emoji: '🏍️', target: Math.max(60000, income * 4), months: Math.ceil(Math.max(60000, income * 4) / monthlySave), why: 'Independence + daily use' },
      { label: 'Vacation',              emoji: '✈️', target: Math.max(20000, income * 1.5), months: Math.ceil(Math.max(20000, income * 1.5) / monthlySave), why: 'Planned travel is guilt-free' },
      { label: 'Investment Start',      emoji: '📈', target: Math.max(10000, income),   months: Math.ceil(Math.max(10000, income) / monthlySave),   why: 'SIP corpus — start small', popular: true },
      { label: 'Rent Deposit',          emoji: '🏠', target: income * 2,              months: Math.ceil(income * 2 / monthlySave),   why: 'Independence milestone' },
    ]
  }
}
 
// ── Goal Card ──
function GoalCard({ goal, isActive, isCompleted, onSelect, monthlySave }) {
  const [hov, setHov] = useState(false)
  const pct = isActive && goal.target > 0
    ? Math.min(100, Math.round(((goal.current || 0) / goal.target) * 100))
    : 0
 
  return (
    <div
      onClick={() => !isCompleted && onSelect(goal)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: isActive ? 'rgba(251,191,36,0.06)' : isCompleted ? 'rgba(34,197,94,0.04)' : hov ? 'rgba(77,159,255,0.05)' : 'rgba(6,10,22,0.85)',
        border: `1px solid ${isActive ? 'rgba(251,191,36,0.3)' : isCompleted ? 'rgba(34,197,94,0.25)' : hov ? 'rgba(77,159,255,0.2)' : 'rgba(77,159,255,0.08)'}`,
        padding: '14px 16px', marginBottom: 8, cursor: isCompleted ? 'default' : 'pointer',
        transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
        transform: hov && !isCompleted ? 'translateY(-2px)' : 'none',
        boxShadow: isActive ? '0 0 20px rgba(251,191,36,0.08)' : hov ? '0 4px 20px rgba(77,159,255,0.08)' : 'none',
      }}
    >
      {isActive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />}
      {isCompleted && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#15803d,#22c55e)' }} />}
 
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isActive ? 10 : 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 24 }}>{goal.emoji}</span>
          <div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15 }}>{goal.label}</div>
              {goal.recommended && <div style={{ fontSize: 9, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '1px 6px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1 }}>SMART</div>}
              {goal.popular && <div style={{ fontSize: 9, background: 'rgba(77,159,255,0.1)', border: '1px solid rgba(77,159,255,0.3)', color: '#4d9fff', padding: '1px 6px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1 }}>POPULAR</div>}
              {isActive && <div style={{ fontSize: 9, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', padding: '1px 6px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1 }}>ACTIVE</div>}
              {isCompleted && <div style={{ fontSize: 9, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '1px 6px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1 }}>✓ DONE</div>}
            </div>
            {goal.why && <div style={{ fontSize: 11, color: '#3d5270' }}>{goal.why}</div>}
          </div>
        </div>
 
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, color: isActive ? '#fbbf24' : '#4d9fff' }}>₹{(goal.target || 0).toLocaleString('en-IN')}</div>
          {goal.months && !isActive && (
            <div style={{ fontSize: 10, color: '#3d5270', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{goal.months} mo</div>
          )}
        </div>
      </div>
 
      {/* Active goal progress */}
      {isActive && (
        <>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius: 3, boxShadow: '0 0 8px rgba(251,191,36,0.4)', transition: 'width 1s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
            <span style={{ color: '#3d5270' }}>₹{(goal.current || 0).toLocaleString('en-IN')} saved</span>
            <span style={{ color: '#fbbf24' }}>{pct}% · ₹{(goal.target - (goal.current || 0)).toLocaleString('en-IN')} left</span>
          </div>
        </>
      )}
    </div>
  )
}
 
// ── Saving Plan Calculator ──
function SavingPlanCard({ user, goal, onUpdateContribution }) {
  if (!goal) return null
 
  const defaultSave = Math.floor(user.monthlyIncome * (user.occupation === 'student' ? 0.15 : 0.20))
  const [contribution, setContribution] = useState(goal.monthlyContribution || defaultSave)
  const remaining = goal.target - (goal.current || 0)
  const months = contribution > 0 ? Math.ceil(remaining / contribution) : '∞'
  const dailyNeeded = contribution > 0 ? Math.floor(contribution / 30) : 0
  const weeklyNeeded = contribution > 0 ? Math.floor(contribution / 4) : 0
 
  return (
    <div style={{ background: 'rgba(6,10,22,0.9)', border: '1px solid rgba(251,191,36,0.2)', padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ fontSize: 9, color: '#fbbf24', letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: 14 }}>
        ⚡ Saving Plan Calculator
      </div>
 
      {/* Contribution slider */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
          <span style={{ color: '#8aa0c8', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>Monthly Contribution</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#fbbf24', fontSize: 16 }}>₹{contribution.toLocaleString('en-IN')}</span>
        </div>
        <input
          type="range"
          min={Math.floor(user.monthlyIncome * 0.05)}
          max={Math.floor(user.monthlyIncome * 0.6)}
          step={100}
          value={contribution}
          onChange={e => { setContribution(Number(e.target.value)); onUpdateContribution(Number(e.target.value)) }}
          style={{ width: '100%', accentColor: '#fbbf24', height: 4 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#1e3a5f', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
          <span>₹{Math.floor(user.monthlyIncome * 0.05).toLocaleString('en-IN')} (5%)</span>
          <span>₹{Math.floor(user.monthlyIncome * 0.6).toLocaleString('en-IN')} (60%)</span>
        </div>
      </div>
 
      {/* Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[
          { label: 'Goal in', val: `${months} mo`, color: months <= 6 ? '#22c55e' : months <= 12 ? '#fbbf24' : '#f97316', emoji: '🎯' },
          { label: 'Daily save', val: `₹${dailyNeeded}`, color: '#4d9fff', emoji: '📅' },
          { label: 'Weekly save', val: `₹${weeklyNeeded}`, color: '#a855f7', emoji: '📆' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(15,24,48,0.7)', border: '1px solid rgba(77,159,255,0.06)', padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}>{s.emoji}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: s.color, fontWeight: 700 }}>{s.val}</div>
            <div style={{ fontSize: 9, color: '#1e3a5f', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
 
      {/* Smart tip */}
      <div style={{ marginTop: 12, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', padding: '10px 12px', fontSize: 12, color: '#8aa0c8', borderLeft: '2px solid #22c55e' }}>
        💡 <strong style={{ color: '#dce8ff' }}>Smart tip:</strong> Save ₹{dailyNeeded}/day by skipping 1 Swiggy order + 1 chai per day. That's your goal funded.
      </div>
    </div>
  )
}
 
// ── Custom Goal Builder ──
function CustomGoalBuilder({ user, onSave, onCancel }) {
  const defaultSave = Math.floor(user.monthlyIncome * (user.occupation === 'student' ? 0.15 : 0.20))
 
  const [form, setForm] = useState({ label: '', emoji: '🎯', target: '', contribution: defaultSave })
  const remaining = Number(form.target) - 0
  const months = form.contribution > 0 && form.target > 0 ? Math.ceil(Number(form.target) / form.contribution) : null
 
  const EMOJIS = ['🎯','📱','💻','🏍️','✈️','🛡️','📈','🎓','🏠','🎮','💎','🚗','👗','🎵','📷','🎒']
 
  return (
    <div style={{ background: 'rgba(6,10,22,0.95)', border: '1px solid rgba(77,159,255,0.2)', padding: '20px', animation: 'fade-up 0.3s ease' }}>
      <div style={{ fontSize: 9, color: '#4d9fff', letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: 16 }}>✏ Custom Goal</div>
 
      {/* Emoji picker */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: '#3d5270', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: 8 }}>Pick Icon</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))} style={{ width: 36, height: 36, background: form.emoji === e ? 'rgba(77,159,255,0.15)' : 'rgba(15,24,48,0.6)', border: `1px solid ${form.emoji === e ? '#4d9fff' : 'rgba(77,159,255,0.1)'}`, cursor: 'pointer', fontSize: 18, transition: 'all 0.15s', transform: form.emoji === e ? 'scale(1.15)' : 'scale(1)' }}>
              {e}
            </button>
          ))}
        </div>
      </div>
 
      {/* Goal name */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: '#3d5270', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: 8 }}>Goal Name</div>
        <input
          value={form.label}
          onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          placeholder="e.g. Gaming PC, Europe Trip, Emergency Fund..."
          style={{ width: '100%', background: 'rgba(15,24,48,0.8)', border: '1px solid rgba(77,159,255,0.15)', color: '#dce8ff', padding: '12px 14px', fontSize: 14, fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = '#4d9fff'}
          onBlur={e => e.target.style.borderColor = 'rgba(77,159,255,0.15)'}
        />
      </div>
 
      {/* Target amount */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: '#3d5270', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: 8 }}>Target Amount</div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4d9fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 16 }}>₹</span>
          <input
            type="number"
            value={form.target}
            onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
            placeholder="10000"
            style={{ width: '100%', background: 'rgba(15,24,48,0.8)', border: '1px solid rgba(77,159,255,0.15)', color: '#dce8ff', padding: '12px 14px 12px 34px', fontSize: 20, fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#4d9fff'}
            onBlur={e => e.target.style.borderColor = 'rgba(77,159,255,0.15)'}
          />
        </div>
      </div>
 
      {/* Monthly contribution */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
          <div style={{ fontSize: 9, color: '#3d5270', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>Monthly Contribution</div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#fbbf24' }}>₹{form.contribution.toLocaleString('en-IN')}</span>
        </div>
        <input
          type="range"
          min={Math.floor(user.monthlyIncome * 0.05)}
          max={Math.floor(user.monthlyIncome * 0.6)}
          step={100}
          value={form.contribution}
          onChange={e => setForm(f => ({ ...f, contribution: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: '#4d9fff', height: 4 }}
        />
      </div>
 
      {/* Live preview */}
      {form.target > 0 && form.label && (
        <div style={{ background: 'rgba(77,159,255,0.05)', border: '1px solid rgba(77,159,255,0.15)', padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', animation: 'fade-up 0.2s ease' }}>
          <span style={{ fontSize: 24 }}>{form.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{form.label}</div>
            <div style={{ fontSize: 11, color: '#3d5270' }}>
              ₹{Number(form.target).toLocaleString('en-IN')} goal · {months ? `${months} months at ₹${form.contribution.toLocaleString('en-IN')}/mo` : 'set amount to calculate'}
            </div>
          </div>
        </div>
      )}
 
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(77,159,255,0.15)', color: '#3d5270', padding: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Cancel
        </button>
        <button
          onClick={() => {
            if (!form.label || !form.target) return
            onSave({ ...form, target: Number(form.target), monthlyContribution: form.contribution })
          }}
          disabled={!form.label || !form.target}
          style={{ flex: 2, background: form.label && form.target ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : 'rgba(15,24,48,0.5)', border: 'none', color: form.label && form.target ? '#000' : '#1e3a5f', padding: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1.5, cursor: form.label && form.target ? 'pointer' : 'not-allowed', clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)', transition: 'all 0.2s' }}
        >
          {form.emoji} Activate Quest
        </button>
      </div>
    </div>
  )
}
 
// ════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════
export default function Quests() {
  const navigate = useNavigate()
  const { user, setGoal, setGoalContribution, addToGoal } = useUserStore()
  const { getWeekExpenses } = useExpenseStore()
  const { triggerXP, triggerConfetti, triggerFireMessage, triggerFlash, FXLayer } = useGameFX()
 
  const [tab, setTab] = useState('goals') // goals | custom | history
  const [showCustom, setShowCustom] = useState(false)
  const [showSuccess, setShowSuccess] = useState(null)
  const [addingToGoal, setAddingToGoal] = useState(false)
 
  if (!user) { navigate('/register'); return null }
 
  const suggested = getSuggestedGoals(user)
  const monthlySave = Math.floor(user.monthlyIncome * (user.occupation === 'student' ? 0.15 : 0.20))
  const weekExp = getWeekExpenses()
  const weekWantTotal = weekExp.filter(e => e.type === 'want').reduce((s, e) => s + e.amount, 0)
  const goalPct = user.activeGoal
    ? Math.min(100, Math.round(((user.activeGoal.current || 0) / user.activeGoal.target) * 100))
    : 0
 
  const handleSetGoal = async (goal) => {
    await setGoal({ ...goal, monthlyContribution: goal.monthlyContribution || monthlySave })
    setShowSuccess(goal.label)
    triggerFlash('rgba(251,191,36,0.08)')
    triggerFireMessage(`${goal.emoji} Quest activated!`)
    setTimeout(() => setShowSuccess(null), 2500)
    setShowCustom(false)
    setTab('goals')
  }
 
  const handleAddToGoal = async () => {
    const amount = Math.floor(monthlySave * 0.25) // add 25% of monthly save as test
    setAddingToGoal(true)
    const completed = await addToGoal(amount)
    if (completed) {
      triggerConfetti()
      triggerFireMessage('🏆 QUEST COMPLETE! Goal achieved!')
    } else {
      triggerXP(0, '#fbbf24')
      triggerFireMessage(`+₹${amount} added to goal!`)
    }
    setTimeout(() => setAddingToGoal(false), 500)
  }
 
  return (
    <div style={{ minHeight: '100vh', background: '#03050d', color: '#dce8ff', fontFamily: 'DM Sans, sans-serif', paddingBottom: 90 }}>
      <GameFXStyles />
      <FXLayer />
 
      {/* Grid bg */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(77,159,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(77,159,255,0.015) 1px,transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,191,36,0.06),transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
 
      {/* Success toast */}
      {showSuccess && (
        <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', padding: '10px 24px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1, zIndex: 200, animation: 'fade-up 0.3s ease', whiteSpace: 'nowrap' }}>
          ✓ "{showSuccess}" Quest Activated!
        </div>
      )}
 
      {/* Top bar */}
      <div style={{ background: 'rgba(3,5,13,0.95)', borderBottom: '1px solid rgba(77,159,255,0.07)', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#8aa0c8', cursor: 'pointer', fontSize: 20 }}>←</button>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: 3 }}>📜 QUESTS</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#fbbf24' }}>{user.completedGoals.length} ✓</div>
      </div>
 
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px 14px', position: 'relative', zIndex: 1 }}>
 
        {/* ── PERSONALIZED SAVINGS PLAN ── */}
        <div style={{ background: 'rgba(6,10,22,0.9)', border: '1px solid rgba(251,191,36,0.2)', padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: '#fbbf24', letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: 10 }}>
            ⚡ Your Personalized Plan
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'Monthly Income', val: `₹${user.monthlyIncome.toLocaleString('en-IN')}`, color: '#4d9fff' },
              { label: `Save (${user.occupation === 'student' ? '15' : '20'}%)`, val: `₹${monthlySave.toLocaleString('en-IN')}/mo`, color: '#22c55e' },
              { label: 'Daily Save', val: `₹${Math.floor(monthlySave / 30)}/day`, color: '#fbbf24' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(15,24,48,0.6)', border: '1px solid rgba(77,159,255,0.06)', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: s.color, fontWeight: 700 }}>{s.val}</div>
                <div style={{ fontSize: 9, color: '#3d5270', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#8aa0c8', borderLeft: '2px solid #fbbf24', paddingLeft: 10 }}>
            {user.occupation === 'student'
              ? '💡 Students: 15% savings is the recommended minimum. Even ₹500/month builds a solid base.'
              : '💡 Working adults: 20% savings protects against job loss, emergencies, and builds real wealth.'}
          </div>
        </div>
 
        {/* ── ACTIVE GOAL CARD (always visible) ── */}
        {user.activeGoal ? (
          <div style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.3)', padding: '16px 18px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: '#fbbf24', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: 4 }}>Active Quest</div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, letterSpacing: 1 }}>{user.activeGoal.emoji} {user.activeGoal.label}</div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, color: '#fbbf24', fontWeight: 700 }}>{goalPct}%</div>
            </div>
 
            {/* Progress */}
            <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${goalPct}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius: 5, boxShadow: '0 0 12px rgba(251,191,36,0.4)', transition: 'width 1s ease' }} />
            </div>
 
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: '#22c55e' }}>₹{(user.activeGoal.current || 0).toLocaleString('en-IN')} saved</span>
              <span style={{ color: '#3d5270' }}>₹{(user.activeGoal.target - (user.activeGoal.current || 0)).toLocaleString('en-IN')} remaining</span>
              <span style={{ color: '#fbbf24' }}>₹{user.activeGoal.target.toLocaleString('en-IN')} goal</span>
            </div>
 
            {/* Time estimate */}
            {user.activeGoal.monthlyContribution > 0 && (
              <div style={{ background: 'rgba(15,24,48,0.6)', padding: '8px 12px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#3d5270' }}>At ₹{user.activeGoal.monthlyContribution.toLocaleString('en-IN')}/mo:</span>
                <span style={{ color: '#fbbf24', fontFamily: 'JetBrains Mono, monospace' }}>
                  {Math.ceil((user.activeGoal.target - (user.activeGoal.current || 0)) / user.activeGoal.monthlyContribution)} months left
                </span>
              </div>
            )}
 
            {/* Battle connection info */}
            {weekWantTotal > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', padding: '8px 12px', marginBottom: 12, fontSize: 11, color: '#ef4444', display: 'flex', gap: 6 }}>
                <span>⚔️</span>
                <span>You spent ₹{weekWantTotal.toLocaleString('en-IN')} on wants this week. Each battle you win redirects that to this goal.</span>
              </div>
            )}
 
            {/* Add to goal button */}
            <button
              onClick={handleAddToGoal}
              disabled={addingToGoal}
              style={{ width: '100%', background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', border: 'none', color: '#000', padding: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1.5, cursor: addingToGoal ? 'wait' : 'pointer', clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)', transition: 'all 0.2s' }}
            >
              {addingToGoal ? '⚡ Adding...' : `+ Add ₹${Math.floor(monthlySave * 0.25).toLocaleString('en-IN')} to Goal`}
            </button>
          </div>
        ) : (
          <div style={{ background: 'rgba(251,191,36,0.03)', border: '1px dashed rgba(251,191,36,0.2)', padding: '20px', marginBottom: 14, textAlign: 'center', cursor: 'pointer' }} onClick={() => setTab('goals')}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15, color: '#fbbf24' }}>No Active Quest</div>
            <div style={{ fontSize: 12, color: '#3d5270', marginTop: 4 }}>Select a goal below to start your quest</div>
          </div>
        )}
 
        {/* ── Saving Plan Calculator (for active goal) ── */}
        {user.activeGoal && (
          <SavingPlanCard
            user={user}
            goal={user.activeGoal}
            onUpdateContribution={(amount) => setGoalContribution(amount)}
          />
        )}
 
        {/* ── TABS ── */}
        <div style={{ display: 'flex', border: '1px solid rgba(77,159,255,0.08)', marginBottom: 14 }}>
          {[
            { id: 'goals',   label: '🎯 Goals' },
            { id: 'custom',  label: '✏ Custom' },
            { id: 'history', label: '✓ Done' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '11px 4px', background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #fbbf24' : '2px solid transparent', color: tab === t.id ? '#fbbf24' : '#3d5270', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }}>
              {t.label}
            </button>
          ))}
        </div>
 
        {/* ── GOALS TAB ── */}
        {tab === 'goals' && (
          <div style={{ animation: 'fade-up 0.3s ease' }}>
            <div style={{ fontSize: 9, color: '#3d5270', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: 10 }}>
              AI-Suggested for {user.occupation === 'student' ? 'Students' : 'Young Adults'}
            </div>
            {suggested.map((goal, i) => (
              <GoalCard key={i} goal={goal} isActive={user.activeGoal?.label === goal.label} isCompleted={false} onSelect={handleSetGoal} monthlySave={monthlySave} />
            ))}
          </div>
        )}
 
        {/* ── CUSTOM TAB ── */}
        {tab === 'custom' && (
          <div style={{ animation: 'fade-up 0.3s ease' }}>
            {!showCustom ? (
              <button
                onClick={() => setShowCustom(true)}
                style={{ width: '100%', background: 'rgba(6,10,22,0.8)', border: '1px dashed rgba(77,159,255,0.25)', color: '#4d9fff', padding: '18px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 1.5, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }}
              >
                ✏ Build Your Own Quest
              </button>
            ) : (
              <CustomGoalBuilder user={user} onSave={handleSetGoal} onCancel={() => setShowCustom(false)} />
            )}
          </div>
        )}
 
        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div style={{ animation: 'fade-up 0.3s ease' }}>
            {user.completedGoals.length === 0 ? (
              <div style={{ background: 'rgba(6,10,22,0.7)', border: '1px solid rgba(77,159,255,0.06)', padding: '24px', textAlign: 'center', color: '#1e3a5f', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏆</div>
                No completed goals yet. Set your first quest!
              </div>
            ) : (
              user.completedGoals.map((g, i) => (
                <GoalCard key={i} goal={g} isActive={false} isCompleted={true} onSelect={() => {}} monthlySave={monthlySave} />
              ))
            )}
          </div>
        )}
      </div>
 
      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(2,4,11,0.98)', borderTop: '1px solid rgba(77,159,255,0.06)', display: 'flex', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        {[
          { emoji: '🏠', label: 'Home', to: '/dashboard' },
          { emoji: '⚔️', label: 'Battle', to: '/battle' },
          { emoji: '💰', label: 'Log', to: '/expenses' },
          { emoji: '📜', label: 'Quests', to: '/quests', active: true },
          { emoji: '👤', label: 'Profile', to: '/profile' },
        ].map(b => (
          <button key={b.to} onClick={() => navigate(b.to)} style={{ flex: 1, background: 'none', border: 'none', borderTop: b.active ? '2px solid #fbbf24' : '2px solid transparent', padding: '12px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: b.active ? '#fbbf24' : '#1e3a5f' }}>
            <span style={{ fontSize: 20 }}>{b.emoji}</span>
            <span style={{ fontSize: 8, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>{b.label}</span>
          </button>
        ))}
      </div>
 
      <style>{`
        @keyframes fade-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        input[type=range]{cursor:pointer}
        input::placeholder{color:#1e3a5f}
        input:focus{outline:none}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
      `}</style>
    </div>
  )
}