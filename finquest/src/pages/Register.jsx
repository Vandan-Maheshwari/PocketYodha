import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { AVATARS, renderAvatarSVG } from '../assets/avatars'
 
// ─────────────────────────────────────────
//  POCKETYODHA — Registration
//  Step 1: Personal details
//  Step 2: Financial setup
//  Step 3: Avatar + Hunter name
//  Step 4: Cinematic awakening
// ─────────────────────────────────────────
 
const OCCUPATIONS = [
  { id: 'student', label: 'Student', emoji: '🎓', desc: 'School / College / University' },
  { id: 'working', label: 'Working Professional', emoji: '💼', desc: 'Job / Salary' },
  { id: 'freelancer', label: 'Freelancer', emoji: '💻', desc: 'Gigs / Projects' },
  { id: 'business', label: 'Business / Self-Employed', emoji: '🏪', desc: 'Own business' },
]
 
const GENDERS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
  { id: 'prefer_not', label: 'Prefer not to say' },
]
 
// Particle background
function Particles() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {Array.from({ length: 60 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: Math.random() * 3 + 1 + 'px',
          height: Math.random() * 3 + 1 + 'px',
          background: i % 3 === 0 ? '#4d9fff' : i % 3 === 1 ? '#a855f7' : '#fbbf24',
          borderRadius: '50%',
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          opacity: Math.random() * 0.4 + 0.05,
          animation: `particle-float ${4 + Math.random() * 6}s ${Math.random() * 5}s ease-in-out infinite alternate`,
        }} />
      ))}
      <style>{`
        @keyframes particle-float {
          0% { transform: translateY(0px) translateX(0px); }
          100% { transform: translateY(-${20 + Math.random() * 30}px) translateX(${(Math.random() - 0.5) * 20}px); }
        }
      `}</style>
    </div>
  )
}
 
// Step progress indicator
function StepProgress({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: i < current ? 32 : i === current ? 32 : 10,
            height: 10,
            borderRadius: 5,
            background: i < current
              ? 'linear-gradient(90deg,#2563eb,#7c3aed)'
              : i === current
              ? 'linear-gradient(90deg,#4d9fff,#a855f7)'
              : 'rgba(77,159,255,0.15)',
            transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: i === current ? '0 0 12px rgba(77,159,255,0.5)' : 'none',
          }} />
          {i < total - 1 && <div style={{ width: 20, height: 1, background: 'rgba(77,159,255,0.2)' }} />}
        </div>
      ))}
    </div>
  )
}
 
// Shared input style
const inp = {
  width: '100%',
  background: 'rgba(15,24,48,0.8)',
  border: '1px solid rgba(77,159,255,0.2)',
  color: '#dce8ff',
  padding: '13px 16px',
  fontSize: 15,
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  borderRadius: 0,
  transition: 'border-color 0.2s, box-shadow 0.2s',
}
 
const label = {
  display: 'block',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '2.5px',
  textTransform: 'uppercase',
  color: '#3d5270',
  marginBottom: 8,
  fontFamily: 'Rajdhani, sans-serif',
}
 
// ── STEP 1: Personal Details ──
function Step1({ data, set, onNext }) {
  const [errors, setErrors] = useState({})
 
  const validate = () => {
    const e = {}
    if (!data.name?.trim()) e.name = 'Name is required'
    if (!data.age || data.age < 13 || data.age > 35) e.age = 'Age must be 13–35'
    if (!data.gender) e.gender = 'Select a gender'
    if (!data.occupation) e.occupation = 'Select your occupation'
    setErrors(e)
    return Object.keys(e).length === 0
  }
 
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={eyebrow}>⚔ Hunter Registration — Step 1 of 3</div>
        <h1 style={title}>Who Are You,<br /><span style={grad}>Yodha?</span></h1>
        <p style={sub}>Tell us about yourself. The more we know, the more personalized your journey.</p>
      </div>
 
      {/* Name */}
      <div style={{ marginBottom: 16 }}>
        <label style={label}>Your Name</label>
        <input
          style={{ ...inp, borderColor: errors.name ? '#ef4444' : 'rgba(77,159,255,0.2)' }}
          placeholder="e.g. Arjun Sharma"
          value={data.name || ''}
          onChange={e => set(d => ({ ...d, name: e.target.value }))}
          onFocus={e => e.target.style.borderColor = '#4d9fff'}
          onBlur={e => e.target.style.borderColor = errors.name ? '#ef4444' : 'rgba(77,159,255,0.2)'}
        />
        {errors.name && <div style={errStyle}>{errors.name}</div>}
      </div>
 
      {/* Age + Gender */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={label}>Age</label>
          <input
            type="number" min="13" max="35"
            style={{ ...inp, borderColor: errors.age ? '#ef4444' : 'rgba(77,159,255,0.2)' }}
            placeholder="18"
            value={data.age || ''}
            onChange={e => set(d => ({ ...d, age: e.target.value }))}
          />
          {errors.age && <div style={errStyle}>{errors.age}</div>}
        </div>
        <div>
          <label style={label}>Gender</label>
          <select
            style={{ ...inp, cursor: 'pointer' }}
            value={data.gender || ''}
            onChange={e => set(d => ({ ...d, gender: e.target.value }))}
          >
            <option value="">Select...</option>
            {GENDERS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
          {errors.gender && <div style={errStyle}>{errors.gender}</div>}
        </div>
      </div>
 
      {/* Occupation */}
      <div style={{ marginBottom: 16 }}>
        <label style={label}>Occupation / Category</label>
        {errors.occupation && <div style={{ ...errStyle, marginBottom: 8 }}>{errors.occupation}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {OCCUPATIONS.map(occ => (
            <button
              key={occ.id}
              onClick={() => set(d => ({ ...d, occupation: occ.id }))}
              style={{
                background: data.occupation === occ.id ? 'rgba(77,159,255,0.12)' : 'rgba(15,24,48,0.6)',
                border: `1px solid ${data.occupation === occ.id ? '#4d9fff' : 'rgba(77,159,255,0.15)'}`,
                color: data.occupation === occ.id ? '#4d9fff' : '#8aa0c8',
                padding: '12px 10px', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: data.occupation === occ.id ? '0 0 16px rgba(77,159,255,0.15)' : 'none',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{occ.emoji}</div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14 }}>{occ.label}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{occ.desc}</div>
            </button>
          ))}
        </div>
      </div>
 
      {/* Institution + City */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div>
          <label style={label}>{data.occupation === 'student' ? 'College / School' : 'Company / Work'}</label>
          <input style={inp} placeholder="e.g. IIT Delhi" value={data.institution || ''} onChange={e => set(d => ({ ...d, institution: e.target.value }))} />
        </div>
        <div>
          <label style={label}>City</label>
          <input style={inp} placeholder="e.g. Mumbai" value={data.city || ''} onChange={e => set(d => ({ ...d, city: e.target.value }))} />
        </div>
      </div>
 
      <button onClick={() => validate() && onNext()} style={btnPrimary}>
        Continue →
      </button>
    </div>
  )
}
 
// ── STEP 2: Financial Setup ──
function Step2({ data, set, onNext, onBack }) {
  const isStudent = data.occupation === 'student'
 
  const suggestedAmounts = isStudent
    ? [1000, 2000, 3000, 5000, 8000]
    : [10000, 20000, 30000, 50000, 80000]
 
  const dailyBudget = data.monthlyIncome ? Math.floor(data.monthlyIncome / 30) : 0
  const savingsGoal = data.monthlyIncome ? Math.floor(data.monthlyIncome * (isStudent ? 0.15 : 0.20)) : 0
 
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={eyebrow}>⚔ Hunter Registration — Step 2 of 3</div>
        <h1 style={title}>Your <span style={grad}>Financial Power</span></h1>
        <p style={sub}>This sets up your budget, quests, and battle difficulty. All private and local.</p>
      </div>
 
      {/* Monthly income */}
      <div style={{ marginBottom: 16 }}>
        <label style={label}>{isStudent ? 'Monthly Pocket Money / Stipend (₹)' : 'Monthly Take-Home Salary (₹)'}</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4d9fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 500 }}>₹</span>
          <input
            type="number"
            style={{ ...inp, paddingLeft: 36, fontSize: 20, fontFamily: 'JetBrains Mono, monospace' }}
            placeholder="0"
            value={data.monthlyIncome || ''}
            onChange={e => set(d => ({ ...d, monthlyIncome: Number(e.target.value) }))}
          />
        </div>
        {/* Quick-pick amounts */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {suggestedAmounts.map(amt => (
            <button
              key={amt}
              onClick={() => set(d => ({ ...d, monthlyIncome: amt }))}
              style={{
                background: data.monthlyIncome === amt ? 'rgba(77,159,255,0.15)' : 'rgba(15,24,48,0.6)',
                border: `1px solid ${data.monthlyIncome === amt ? '#4d9fff' : 'rgba(77,159,255,0.15)'}`,
                color: data.monthlyIncome === amt ? '#4d9fff' : '#8aa0c8',
                padding: '6px 14px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
                transition: 'all 0.15s',
              }}
            >₹{amt.toLocaleString('en-IN')}</button>
          ))}
        </div>
      </div>
 
      {/* Live calculations */}
      {data.monthlyIncome > 0 && (
        <div style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, animation: 'fade-up 0.3s ease' }}>
          {[
            { label: 'Daily budget', val: `₹${dailyBudget}`, color: '#4d9fff' },
            { label: 'Save target', val: `₹${savingsGoal}/mo`, color: '#22c55e' },
            { label: 'Spend limit', val: `₹${data.monthlyIncome - savingsGoal}/mo`, color: '#f97316' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(15,24,48,0.8)', border: '1px solid rgba(77,159,255,0.12)', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: '#3d5270', letterSpacing: 1, textTransform: 'uppercase', marginTop: 3, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
 
      {/* Spending style */}
      <div style={{ marginBottom: 16 }}>
        <label style={label}>How would you describe your spending style?</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { id: 'saver', label: 'Saver — I try to spend as little as possible', emoji: '💰' },
            { id: 'balanced', label: 'Balanced — I manage okay most months', emoji: '⚖️' },
            { id: 'spender', label: 'Spender — I always seem to run out', emoji: '💸' },
            { id: 'impulsive', label: 'Impulsive — I buy things without thinking', emoji: '🛒' },
          ].map(style => (
            <button
              key={style.id}
              onClick={() => set(d => ({ ...d, spendingStyle: style.id }))}
              style={{
                background: data.spendingStyle === style.id ? 'rgba(77,159,255,0.1)' : 'rgba(15,24,48,0.5)',
                border: `1px solid ${data.spendingStyle === style.id ? '#4d9fff' : 'rgba(77,159,255,0.12)'}`,
                color: data.spendingStyle === style.id ? '#dce8ff' : '#8aa0c8',
                padding: '12px 16px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 14,
                transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif',
              }}
            >
              <span style={{ fontSize: 20 }}>{style.emoji}</span>
              {style.label}
            </button>
          ))}
        </div>
      </div>
 
      {/* Financial goal */}
      <div style={{ marginBottom: 24 }}>
        <label style={label}>Biggest financial challenge right now?</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { id: 'saving', label: 'Saving money', emoji: '💰' },
            { id: 'scams', label: 'Avoiding scams', emoji: '🛡️' },
            { id: 'impulse', label: 'Impulse buying', emoji: '🛒' },
            { id: 'investing', label: 'Learning to invest', emoji: '📈' },
          ].map(ch => (
            <button
              key={ch.id}
              onClick={() => set(d => ({ ...d, mainChallenge: ch.id }))}
              style={{
                background: data.mainChallenge === ch.id ? 'rgba(168,85,247,0.1)' : 'rgba(15,24,48,0.5)',
                border: `1px solid ${data.mainChallenge === ch.id ? '#a855f7' : 'rgba(77,159,255,0.12)'}`,
                color: data.mainChallenge === ch.id ? '#a855f7' : '#8aa0c8',
                padding: '12px 10px', cursor: 'pointer', textAlign: 'center', fontSize: 13,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 5 }}>{ch.emoji}</div>
              {ch.label}
            </button>
          ))}
        </div>
      </div>
 
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={btnGhost}>← Back</button>
        <button
          onClick={() => data.monthlyIncome && onNext()}
          style={{ ...btnPrimary, flex: 1, opacity: data.monthlyIncome ? 1 : 0.4 }}
          disabled={!data.monthlyIncome}
        >Continue →</button>
      </div>
    </div>
  )
}
 
// ── STEP 3: Avatar + Hunter Name ──
function Step3({ data, set, onFinish, onBack }) {
  const [filter, setFilter] = useState('all')
 
  const filtered = filter === 'all'
    ? AVATARS
    : AVATARS.filter(a => a.suitedFor.includes(data.occupation === 'student' ? 'student' : 'young_adult'))
 
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={eyebrow}>⚔ Hunter Registration — Step 3 of 3</div>
        <h1 style={title}>Choose Your<br /><span style={grad}>Warrior</span></h1>
        <p style={sub}>This avatar represents you in every battle and quest.</p>
      </div>
 
      {/* Hunter name */}
      <div style={{ marginBottom: 20 }}>
        <label style={label}>Hunter Name (shown in game)</label>
        <input
          style={inp}
          placeholder={`e.g. ${data.name?.split(' ')[0] || 'Shadow'} Yodha`}
          value={data.hunterName || data.name || ''}
          onChange={e => set(d => ({ ...d, hunterName: e.target.value }))}
        />
      </div>
 
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'recommended'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? 'rgba(77,159,255,0.15)' : 'transparent',
              border: `1px solid ${filter === f ? '#4d9fff' : 'rgba(77,159,255,0.2)'}`,
              color: filter === f ? '#4d9fff' : '#8aa0c8',
              padding: '7px 16px', cursor: 'pointer', fontSize: 12,
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
            }}
          >
            {f === 'all' ? 'All Warriors' : 'Recommended for You'}
          </button>
        ))}
      </div>
 
      {/* Avatar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
        {filtered.map(av => {
          const isSelected = data.avatarId === av.id
          return (
            <button
              key={av.id}
              onClick={() => set(d => ({ ...d, avatarId: av.id }))}
              style={{
                background: isSelected ? `rgba(${hexToRgb(av.primaryColor)},0.12)` : 'rgba(15,24,48,0.5)',
                border: `2px solid ${isSelected ? av.primaryColor : 'rgba(77,159,255,0.1)'}`,
                padding: '12px 6px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                transition: 'all 0.2s',
                boxShadow: isSelected ? `0 0 20px ${av.primaryColor}30` : 'none',
                transform: isSelected ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              <div
                style={{ width: 60, height: 60 }}
                dangerouslySetInnerHTML={{ __html: renderAvatarSVG(av.id, 60) }}
              />
              <div style={{ fontSize: 10, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: isSelected ? av.primaryColor : '#8aa0c8', letterSpacing: 0.5, textAlign: 'center', lineHeight: 1.3 }}>
                {av.name}
              </div>
            </button>
          )
        })}
      </div>
 
      {/* Selected avatar detail */}
      {data.avatarId && (() => {
        const av = AVATARS.find(a => a.id === data.avatarId)
        return av ? (
          <div style={{ background: `rgba(${hexToRgb(av.primaryColor)},0.06)`, border: `1px solid ${av.primaryColor}30`, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'center', animation: 'fade-up 0.3s ease' }}>
            <div dangerouslySetInnerHTML={{ __html: renderAvatarSVG(av.id, 56) }} />
            <div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 16, color: av.primaryColor, marginBottom: 3 }}>{av.name}</div>
              <div style={{ fontSize: 13, color: '#8aa0c8' }}>{av.description}</div>
              <div style={{ fontSize: 11, color: '#3d5270', marginTop: 4, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: 1 }}>
                TYPE: {av.category.toUpperCase()}
              </div>
            </div>
          </div>
        ) : null
      })()}
 
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={btnGhost}>← Back</button>
        <button
          onClick={() => data.avatarId && onFinish()}
          style={{ ...btnPrimary, flex: 1, opacity: data.avatarId ? 1 : 0.4 }}
          disabled={!data.avatarId}
        >
          Awaken My Yodha ⚡
        </button>
      </div>
    </div>
  )
}
 
// ── AWAKENING CINEMATIC ──
function AwakeningCinematic({ data, onComplete }) {
  const [phase, setPhase] = useState(0)
  const av = AVATARS.find(a => a.id === data.avatarId) || AVATARS[0]
 
  useState(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 2600),
      setTimeout(() => setPhase(4), 3600),
      setTimeout(() => onComplete(), 5200),
    ]
    return () => timers.forEach(clearTimeout)
  })
 
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'DM Sans, sans-serif' }}>
      <Particles />
 
      {phase === 0 && (
        <div style={{ color: '#3d5270', fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: 4, animation: 'fade-up 0.5s ease' }}>
          INITIATING AWAKENING PROTOCOL...
        </div>
      )}
 
      {phase >= 1 && (
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, animation: 'fade-up 0.5s ease' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 80, fontWeight: 900, color: av.primaryColor, letterSpacing: 8, textShadow: `0 0 60px ${av.primaryColor}`, lineHeight: 1, marginBottom: 8 }}>
            RANK E
          </div>
          <div style={{ color: '#8aa0c8', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase' }}>Hunter Awakened</div>
        </div>
      )}
 
      {phase >= 2 && (
        <div style={{ textAlign: 'center', marginTop: 32, animation: 'fade-up 0.5s ease', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 100, height: 100, margin: '0 auto 16px', animation: 'float 2s ease-in-out infinite' }}
            dangerouslySetInnerHTML={{ __html: renderAvatarSVG(data.avatarId, 100) }}
          />
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 28, letterSpacing: 3, color: '#dce8ff' }}>
            {data.hunterName || data.name}
          </div>
          <div style={{ fontSize: 13, color: av.primaryColor, letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' }}>{av.name}</div>
        </div>
      )}
 
      {phase >= 3 && (
        <div style={{ display: 'flex', gap: 28, marginTop: 28, animation: 'fade-up 0.5s ease', position: 'relative', zIndex: 1 }}>
          {[
            { l: 'Level', v: '1', c: '#4d9fff' },
            { l: 'HP', v: '100', c: '#ef4444' },
            { l: 'Rank', v: 'E', c: '#94a3b8' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 10, color: '#3d5270', letterSpacing: 2, textTransform: 'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}
 
      {phase >= 4 && (
        <div style={{ marginTop: 36, fontSize: 13, color: '#3d5270', letterSpacing: 2, animation: 'fade-up 0.5s ease', position: 'relative', zIndex: 1 }}>
          ENTERING THE DOJO...
        </div>
      )}
 
      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>
    </div>
  )
}
 
// ── MAIN ──
export default function Register() {
  const navigate = useNavigate()
  const { register, isRegistered, isLoggedIn } = useUserStore()
  const [step, setStep] = useState(0)
  const [awakening, setAwakening] = useState(false)
  const [formData, setFormData] = useState({
    name: '', age: '', gender: '', occupation: '', institution: '', city: '',
    monthlyIncome: '', spendingStyle: '', mainChallenge: '',
    avatarId: '', hunterName: '',
  })
 
  // Already registered → go to dashboard
  if (isRegistered && isLoggedIn && !awakening) {
    navigate('/dashboard')
    return null
  }
 
  const handleFinish = () => {
    register(formData)
    setAwakening(true)
  }
 
  if (awakening) {
    return <AwakeningCinematic data={formData} onComplete={() => navigate('/dashboard')} />
  }
 
  return (
    <div style={{ minHeight: '100vh', background: '#03050d', color: '#dce8ff', fontFamily: 'DM Sans, sans-serif', overflowX: 'hidden' }}>
      <Particles />
 
      {/* Grid bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(77,159,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(77,159,255,0.03) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />
 
      {/* Glows */}
      <div style={{ position: 'fixed', top: -150, right: -150, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,0.1),transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.08),transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
 
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
 
        {/* Logo */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cinzel, serif', fontSize: 16, fontWeight: 900, color: '#fff', boxShadow: '0 0 24px rgba(77,159,255,0.3)' }}>P</div>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 20, letterSpacing: 3, color: '#dce8ff' }}>POCKET<span style={{ background: 'linear-gradient(135deg,#4d9fff,#a855f7)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>YODHA</span></span>
        </div>
 
        <StepProgress current={step} total={3} />
 
        <div style={{ width: '100%', maxWidth: 520, background: 'rgba(9,15,30,0.85)', border: '1px solid rgba(77,159,255,0.1)', backdropFilter: 'blur(24px)', padding: '36px 28px', animation: 'fade-up 0.4s ease both' }} key={step}>
          {step === 0 && <Step1 data={formData} set={setFormData} onNext={() => setStep(1)} />}
          {step === 1 && <Step2 data={formData} set={setFormData} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
          {step === 2 && <Step3 data={formData} set={setFormData} onFinish={handleFinish} onBack={() => setStep(1)} />}
        </div>
 
        {/* Login link */}
        <div style={{ marginTop: 20, fontSize: 13, color: '#3d5270' }}>
          Already registered?{' '}
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#4d9fff', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
            Log in here
          </button>
        </div>
      </div>
 
      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        input:focus,select:focus { border-color: #4d9fff !important; box-shadow: 0 0 0 1px rgba(77,159,255,0.2); }
        input::placeholder { color: #3d5270; }
        select option { background: #0f1830; color: #dce8ff; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #2563eb; }
      `}</style>
    </div>
  )
}
 
// Shared styles
const eyebrow = { fontFamily: 'Rajdhani, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: '#4d9fff', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }
const title = { fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 'clamp(28px,5vw,44px)', lineHeight: 1.05, letterSpacing: 2, marginBottom: 10 }
const grad = { background: 'linear-gradient(135deg,#4d9fff,#a855f7)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }
const sub = { fontSize: 14, color: '#8aa0c8', fontWeight: 300, lineHeight: 1.6 }
const errStyle = { fontSize: 11, color: '#ef4444', marginTop: 4 }
const btnPrimary = { width: '100%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '14px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', clipPath: 'polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)', boxShadow: '0 0 28px rgba(37,99,235,0.25)', transition: 'all 0.2s' }
const btnGhost = { background: 'transparent', border: '1px solid rgba(77,159,255,0.2)', color: '#8aa0c8', padding: '14px 24px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }
 
function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '77,159,255'
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`
}