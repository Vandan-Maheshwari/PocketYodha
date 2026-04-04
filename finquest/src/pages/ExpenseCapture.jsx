import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useGameFX, GameFXStyles } from '../components/GameFX'
import { getFireMessage } from '../store/gameEngine'
import api from '../api'
 
// ─── CATEGORIES ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'food',     icon: '🍱', label: 'Food',     color: '#f97316' },
  { id: 'travel',   icon: '🚌', label: 'Travel',   color: '#3b82f6' },
  { id: 'shopping', icon: '🛍️', label: 'Shopping', color: '#ec4899' },
  { id: 'bills',    icon: '⚡', label: 'Bills',    color: '#eab308' },
  { id: 'health',   icon: '💊', label: 'Health',   color: '#22c55e' },
  { id: 'fun',      icon: '🎮', label: 'Fun',      color: '#a855f7' },
  { id: 'edu',      icon: '📚', label: 'Study',    color: '#06b6d4' },
  { id: 'other',    icon: '💸', label: 'Other',    color: '#94a3b8' },
]
 
const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500, 1000]
 
const TYPE_CONFIG = {
  need:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.4)',  icon: '✅', label: 'NEED',  msg: 'Smart spend!' },
  want:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', icon: '⚠️', label: 'WANT',  msg: 'Think twice!' },
  trap:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.5)',  icon: '☠️', label: 'TRAP',  msg: 'BATTLE TRIGGERED!' },
}
 
// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ExpenseCapture() {
  const navigate   = useNavigate()
  const user       = useUserStore((s) => s.user)
  const addXP      = useUserStore((s) => s.addXP)
  const takeDamage = useUserStore((s) => s.takeDamage)
  const { triggerXP, triggerDamage, triggerFireMessage, triggerFlash, triggerConfetti, FXLayer } = useGameFX()
 
  // form state
  const [amount,      setAmount]      = useState('')
  const [description, setDescription] = useState('')
  const [category,    setCategory]    = useState('food')
  const [inputMode,   setInputMode]   = useState('manual') // manual | voice | camera
  const [classResult, setClassResult] = useState(null)
  const [isLogging,   setIsLogging]   = useState(false)
  const [logged,      setLogged]      = useState([]) // recent logs
  const [scanning,    setScanning]    = useState(false)
  const [listening,   setListening]   = useState(false)
  const [voiceText,   setVoiceText]   = useState('')
  const [shake,       setShake]       = useState(false)
  const [particles,   setParticles]   = useState([])
 
  const fileRef = useRef(null)
 
  // ── Live classify on description change ──────────────────────────────────
  useEffect(() => {
    if (!description.trim() || description.length < 3) { setClassResult(null); return }
    const t = setTimeout(async () => {
      const res = await api.classify(description, parseFloat(amount) || 0)
      if (res) setClassResult(res)
    }, 500)
    return () => clearTimeout(t)
  }, [description, amount])
 
  // ── Float particles ───────────────────────────────────────────────────────
  useEffect(() => {
    const p = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 4,
      delay: Math.random() * 4,
    }))
    setParticles(p)
  }, [])
 
  // ── Log expense ───────────────────────────────────────────────────────────
  const handleLog = useCallback(async () => {
    if (!amount || !description.trim()) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
 
    setIsLogging(true)
    const amt = parseFloat(amount)
 
    const res = await api.logExpense({
      user_id:     user?.id || 'guest',
      amount:      amt,
      description,
      category,
    })
 
    if (res) {
      const cfg = TYPE_CONFIG[res.classified_as] || TYPE_CONFIG.need
 
      // Game FX
      if (res.classified_as === 'need') {
        addXP(15)
        triggerXP(15, '#22c55e')
        triggerFireMessage('✅ Smart spend logged!')
      } else if (res.classified_as === 'want') {
        takeDamage(5)
        triggerDamage('−5 HP', '#f59e0b')
        triggerFlash('rgba(245,158,11,0.2)')
        triggerFireMessage('⚠️ Want detected — discipline XP -5')
      } else {
        takeDamage(25)
        triggerDamage('−25 HP ☠️', '#ef4444')
        triggerFlash('rgba(239,68,68,0.3)')
        triggerFireMessage('☠️ TRAP! Battle incoming!')
      }
 
      setLogged(prev => [{
        amount: amt,
        description,
        category,
        type: res.classified_as,
        confidence: res.confidence,
        time: new Date().toLocaleTimeString(),
      }, ...prev.slice(0, 4)])
 
      setAmount('')
      setDescription('')
      setClassResult(null)
      setIsLogging(false)
 
      if (res.trigger_battle) {
        setTimeout(() => navigate('/battle'), 1200)
      }
    } else {
      setIsLogging(false)
    }
  }, [amount, description, category, user, addXP, takeDamage, navigate, triggerXP, triggerDamage, triggerFlash, triggerFireMessage])
 
  // ── Voice input ────────────────────────────────────────────────────────────
  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Voice not supported in this browser. Use Chrome.'); return }
    const rec = new SpeechRecognition()
    rec.lang = 'en-IN'
    rec.onstart  = () => setListening(true)
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      setVoiceText(text)
      // parse "50 chai" or "200 recharge"
      const match = text.match(/(\d+)\s+(.+)/)
      if (match) { setAmount(match[1]); setDescription(match[2]) }
      else { setDescription(text) }
      setInputMode('manual')
    }
    rec.onend = () => setListening(false)
    rec.start()
  }
 
  // ── Camera/OCR ─────────────────────────────────────────────────────────────
  const handleScan = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      const res = await api.scanReceipt(base64)
      if (res?.success) {
        setDescription(res.raw_text.substring(0, 60))
        if (res.extracted_amount) setAmount(String(res.extracted_amount))
        if (res.classified_as) setClassResult({ type: res.classified_as, confidence: res.confidence })
      }
      setScanning(false)
      setInputMode('manual')
    }
    reader.readAsDataURL(file)
  }
 
  const cfg = classResult ? (TYPE_CONFIG[classResult.type] || TYPE_CONFIG.need) : null
 
  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      <GameFXStyles />
      <FXLayer />
 
      {/* Floating particles */}
      <div style={s.particleLayer}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: 'rgba(192,132,252,0.4)',
            animation: `floatUp ${p.duration}s ${p.delay}s infinite ease-in-out`,
          }} />
        ))}
      </div>
 
      {/* HUD top bar */}
      <div style={s.hud}>
        <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← HQ</button>
        <div style={s.hudTitle}>
          <span style={s.hudIcon}>⚔️</span>
          <span style={s.hudText}>EXPENSE LOG</span>
        </div>
        <div style={s.hudRight}>
          {user && <span style={s.hpPill}>❤️ {Math.round(user.hp || 0)}</span>}
        </div>
      </div>
 
      {/* Scanline effect */}
      <div style={s.scanline} />
 
      {/* Main content */}
      <div style={s.content}>
 
        {/* MODE SELECTOR */}
        <div style={s.modeRow}>
          {[
            { id: 'manual', icon: '✏️', label: 'Manual' },
            { id: 'voice',  icon: '🎙️', label: 'Voice'  },
            { id: 'camera', icon: '📷', label: 'Scan'   },
          ].map(m => (
            <button
              key={m.id}
              style={{ ...s.modeBtn, ...(inputMode === m.id ? s.modeBtnActive : {}) }}
              onClick={() => {
                setInputMode(m.id)
                if (m.id === 'voice')  handleVoice()
                if (m.id === 'camera') fileRef.current?.click()
              }}
            >
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{m.label}</span>
            </button>
          ))}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleScan} />
 
        {/* LISTENING OVERLAY */}
        {listening && (
          <div style={s.listeningBadge}>
            <span style={{ animation: 'pulse 1s infinite' }}>🎙️</span>
            <span>Listening... say "50 chai" or "200 recharge"</span>
          </div>
        )}
 
        {/* SCANNING OVERLAY */}
        {scanning && (
          <div style={s.listeningBadge}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</span>
            <span>Scanning receipt...</span>
          </div>
        )}
 
        {/* AMOUNT INPUT */}
        <div style={{ ...s.amountBox, ...(shake ? s.shakeAnim : {}) }}>
          <div style={s.amountLabel}>DAMAGE AMOUNT (₹)</div>
          <div style={s.amountRow}>
            <span style={s.rupeeSign}>₹</span>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={s.amountInput}
            />
          </div>
          {/* Quick chips */}
          <div style={s.chips}>
            {QUICK_AMOUNTS.map(a => (
              <button key={a} style={{ ...s.chip, ...(amount == a ? s.chipActive : {}) }}
                onClick={() => setAmount(String(a))}>
                ₹{a}
              </button>
            ))}
          </div>
        </div>
 
        {/* DESCRIPTION */}
        <div style={s.descBox}>
          <div style={s.descLabel}>WHAT DID YOU SPEND ON?</div>
          <input
            type="text"
            placeholder="e.g. swiggy order, bus ticket, medicine..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={s.descInput}
          />
          {/* Live classifier badge */}
          {cfg && (
            <div style={{ ...s.classBadge, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
              <span>{cfg.icon}</span>
              <span style={{ fontWeight: 800 }}>{cfg.label}</span>
              <span style={{ opacity: 0.7 }}>{cfg.msg}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11 }}>{Math.round((classResult.confidence || 0) * 100)}% sure</span>
            </div>
          )}
        </div>
 
        {/* CATEGORY GRID */}
        <div style={s.catLabel}>SELECT CATEGORY</div>
        <div style={s.catGrid}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              style={{
                ...s.catBtn,
                ...(category === cat.id ? {
                  background: `${cat.color}22`,
                  border: `1.5px solid ${cat.color}`,
                  transform: 'scale(1.06)',
                  boxShadow: `0 0 16px ${cat.color}44`,
                } : {})
              }}
              onClick={() => setCategory(cat.id)}
            >
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              <span style={{ fontSize: 11, color: category === cat.id ? cat.color : '#64748b', fontWeight: 700 }}>{cat.label}</span>
            </button>
          ))}
        </div>
 
        {/* LOG BUTTON */}
        <button
          style={{ ...s.logBtn, ...(isLogging ? s.logBtnLoading : {}) }}
          onClick={handleLog}
          disabled={isLogging}
        >
          {isLogging
            ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</span>
            : <><span>⚡</span><span>LOG EXPENSE</span></>
          }
        </button>
 
        {/* RECENT LOGS */}
        {logged.length > 0 && (
          <div style={s.recentSection}>
            <div style={s.recentTitle}>RECENT LOGS</div>
            {logged.map((e, i) => {
              const tc = TYPE_CONFIG[e.type] || TYPE_CONFIG.need
              return (
                <div key={i} style={{ ...s.recentRow, borderLeft: `3px solid ${tc.color}`, animation: `fadeUp 0.3s ${i * 0.05}s both` }}>
                  <span style={{ fontSize: 18 }}>{CATEGORIES.find(c => c.id === e.category)?.icon || '💸'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{e.description}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{e.time}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: tc.color, fontFamily: 'Rajdhani, sans-serif', fontSize: 16 }}>₹{e.amount}</div>
                    <div style={{ fontSize: 10, color: tc.color, fontWeight: 700 }}>{tc.icon} {tc.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
 
      {/* CSS animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');
        @keyframes floatUp {
          0%,100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50%      { transform: translateY(-30px) scale(1.2); opacity: 0.8; }
        }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        @keyframes shake   { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        @keyframes scanAnim { from{top:0} to{top:100%} }
      `}</style>
    </div>
  )
}
 
// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = {
  root: {
    minHeight: '100vh',
    background: '#060818',
    color: '#fff',
    fontFamily: "'Rajdhani', 'DM Sans', sans-serif",
    position: 'relative',
    overflowX: 'hidden',
    paddingBottom: 100,
  },
  particleLayer: {
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
    overflow: 'hidden',
  },
  scanline: {
    position: 'fixed', left: 0, right: 0, height: 2, zIndex: 1,
    background: 'rgba(192,132,252,0.1)',
    animation: 'scanAnim 4s linear infinite',
    pointerEvents: 'none',
  },
  hud: {
    position: 'sticky', top: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(6,8,24,0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(192,132,252,0.2)',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#94a3b8', padding: '6px 14px', borderRadius: 8,
    cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
  },
  hudTitle: { display: 'flex', alignItems: 'center', gap: 8 },
  hudIcon:  { fontSize: 20 },
  hudText:  { fontSize: 14, fontWeight: 900, letterSpacing: 3, color: '#c084fc' },
  hudRight: {},
  hpPill: {
    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#fca5a5', padding: '4px 12px', borderRadius: 20,
    fontSize: 13, fontWeight: 700,
  },
  content: {
    position: 'relative', zIndex: 2,
    maxWidth: 520, margin: '0 auto', padding: '20px 16px',
  },
  modeRow: { display: 'flex', gap: 10, marginBottom: 20 },
  modeBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 4, padding: '12px 8px', borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  modeBtnActive: {
    background: 'rgba(192,132,252,0.15)',
    border: '1.5px solid rgba(192,132,252,0.5)',
    color: '#c084fc',
    boxShadow: '0 0 20px rgba(192,132,252,0.2)',
  },
  listeningBadge: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(192,132,252,0.1)',
    border: '1px solid rgba(192,132,252,0.3)',
    borderRadius: 10, padding: '10px 16px',
    color: '#c084fc', fontSize: 13, fontWeight: 600,
    marginBottom: 16,
  },
  amountBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(192,132,252,0.2)',
    borderRadius: 16, padding: '18px 16px', marginBottom: 14,
  },
  shakeAnim: { animation: 'shake 0.4s ease' },
  amountLabel: { fontSize: 10, letterSpacing: 3, color: '#c084fc', fontWeight: 700, marginBottom: 10 },
  amountRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  rupeeSign: { fontSize: 28, fontWeight: 700, color: '#c084fc' },
  amountInput: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: '#fff', fontSize: 36, fontWeight: 900,
    fontFamily: "'Rajdhani', sans-serif",
    MozAppearance: 'textfield',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#94a3b8', padding: '5px 10px', borderRadius: 6,
    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  chipActive: {
    background: 'rgba(192,132,252,0.15)',
    border: '1px solid rgba(192,132,252,0.5)',
    color: '#c084fc',
  },
  descBox: { marginBottom: 16 },
  descLabel: { fontSize: 10, letterSpacing: 3, color: '#64748b', fontWeight: 700, marginBottom: 8 },
  descInput: {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    color: '#fff', fontSize: 15, padding: '13px 16px',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  classBadge: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', borderRadius: 10, marginTop: 8,
    fontSize: 13, fontWeight: 600,
    animation: 'fadeUp 0.3s ease',
  },
  catLabel: { fontSize: 10, letterSpacing: 3, color: '#64748b', fontWeight: 700, marginBottom: 10 },
  catGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
    gap: 8, marginBottom: 20,
  },
  catBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '12px 4px', borderRadius: 12,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  logBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: '18px',
    background: 'linear-gradient(135deg, #7c3aed, #c084fc)',
    border: 'none', borderRadius: 14,
    color: '#fff', fontSize: 18, fontWeight: 900,
    fontFamily: 'inherit', letterSpacing: 2,
    cursor: 'pointer',
    boxShadow: '0 0 30px rgba(192,132,252,0.4)',
    transition: 'all 0.2s',
    marginBottom: 20,
  },
  logBtnLoading: { opacity: 0.7, cursor: 'not-allowed' },
  recentSection: { marginTop: 8 },
  recentTitle: { fontSize: 10, letterSpacing: 3, color: '#475569', fontWeight: 700, marginBottom: 10 },
  recentRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10, padding: '12px 14px', marginBottom: 8,
    paddingLeft: 12,
  },
}