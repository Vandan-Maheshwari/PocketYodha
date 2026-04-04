import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useGameFX, GameFXStyles } from '../components/GameFX'
import { getFireMessage } from '../store/gameEngine'
import api from '../api'
 
const DEMONS = [
  {
    id: 'swiggy',
    name: 'Food Delivery Phantom',
    emoji: '👹',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.4)',
    hp: 80,
    taunt: ["Your hunger grows... ORDER NOW!", "One more delivery won't hurt 👀", "Your friends are already eating 🍕"],
    choices: [
      { text: 'Cook at home instead', type: 'resist', xp: 50, hp: 0,   desc: '+50 XP · Saved ₹300' },
      { text: 'Order just this once', type: 'yield',  xp: 0,  hp: -15, desc: '−15 HP · ₹300 wasted' },
    ],
    tip: 'Cooking at home saves 60-70% vs food delivery. Over a month, that\'s ₹3,000–₹6,000 saved!',
  },
  {
    id: 'fomo',
    name: 'FOMO Specter',
    emoji: '👻',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.4)',
    hp: 90,
    taunt: ["Everyone is buying it. Don't miss out!", "Limited stock remaining ⚡", "Your friends already have one 😈"],
    choices: [
      { text: 'Wait 48 hours first',  type: 'resist', xp: 60, hp: 0,   desc: '+60 XP · Impulse blocked' },
      { text: 'Buy it immediately',   type: 'yield',  xp: 0,  hp: -20, desc: '−20 HP · Impulse spend' },
    ],
    tip: 'The 48-hour rule: wait 2 days before any unplanned purchase. 80% of the time the urge disappears.',
  },
  {
    id: 'upi',
    name: 'UPI Scam Wraith',
    emoji: '💀',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.5)',
    hp: 100,
    taunt: ["₹50,000 prize waiting for you!", "Just pay ₹299 to claim your reward 😈", "Your account will be blocked in 24 hrs!"],
    choices: [
      { text: 'Block & report scam',  type: 'resist', xp: 75, hp: 10,  desc: '+75 XP +10 HP · Scam blocked!' },
      { text: 'Pay the fee to claim', type: 'yield',  xp: 0,  hp: -40, desc: '−40 HP · Scammed! ₹299 lost' },
    ],
    tip: 'No legitimate prize ever asks you to pay first. UPI collect requests mean YOU pay — never click them.',
  },
  {
    id: 'shopping',
    name: 'Shopping Demon',
    emoji: '🛍️',
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.4)',
    hp: 75,
    taunt: ["70% SALE ends in 10 minutes! 🔥", "You deserve a treat!", "Add to cart... just browsing 😏"],
    choices: [
      { text: 'Close the tab',        type: 'resist', xp: 45, hp: 0,   desc: '+45 XP · Temptation resisted' },
      { text: 'Add to cart + buy',    type: 'yield',  xp: 0,  hp: -12, desc: '−12 HP · Impulse purchase' },
    ],
    tip: 'Remove saved card details from shopping sites. Friction = fewer impulse purchases.',
  },
  {
    id: 'crypto',
    name: 'Crypto Charlatan',
    emoji: '🐍',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.4)',
    hp: 95,
    taunt: ["300% returns GUARANTEED! 📈", "My group made ₹50,000 last week!", "This coin will 10x by Friday 🚀"],
    choices: [
      { text: 'Report and ignore',    type: 'resist', xp: 80, hp: 5,   desc: '+80 XP · Fraud blocked!' },
      { text: 'Invest ₹5,000',        type: 'yield',  xp: 0,  hp: -35, desc: '−35 HP · Investment scam!' },
    ],
    tip: 'SEBI-registered advisors can NEVER promise fixed returns. Guaranteed returns = guaranteed scam.',
  },
]
 
export default function Battle() {
  const navigate   = useNavigate()
  const user       = useUserStore((s) => s.user)
  const addXP      = useUserStore((s) => s.addXP)
  const takeDamage = useUserStore((s) => s.takeDamage)
  const { triggerXP, triggerDamage, triggerConfetti, triggerFlash, triggerFireMessage, FXLayer } = useGameFX()
 
  const [demon,      setDemon]      = useState(null)
  const [phase,      setPhase]      = useState('intro')   // intro|fight|result
  const [timeLeft,   setTimeLeft]   = useState(30)
  const [result,     setResult]     = useState(null)      // {win,xp,hp,choice}
  const [tauntIdx,   setTauntIdx]   = useState(0)
  const [demonHp,    setDemonHp]    = useState(100)
  const [shake,      setShake]      = useState(false)
  const [particles,  setParticles]  = useState([])
  const [attackAnim, setAttackAnim] = useState(false)
 
  const timerRef  = useRef(null)
  const tauntRef  = useRef(null)
 
  // pick random demon
  useEffect(() => {
    setDemon(DEMONS[Math.floor(Math.random() * DEMONS.length)])
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 3 + 1, dur: Math.random() * 4 + 2, delay: Math.random() * 3,
    })))
  }, [])
 
  // taunt rotation
  useEffect(() => {
    if (phase !== 'fight' || !demon) return
    tauntRef.current = setInterval(() => {
      setTauntIdx(p => (p + 1) % demon.taunt.length)
    }, 3000)
    return () => clearInterval(tauntRef.current)
  }, [phase, demon])
 
  // countdown timer
  useEffect(() => {
    if (phase !== 'fight') return
    setTimeLeft(30)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleTimeout()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])
 
  const handleTimeout = useCallback(() => {
    clearInterval(timerRef.current)
    const choice = demon.choices[1] // yield = timeout
    setResult({ win: false, xp: 0, hp: choice.hp, choice, timeout: true })
    takeDamage(Math.abs(choice.hp))
    triggerDamage(`${choice.hp} HP`, '#ef4444')
    triggerFlash('rgba(239,68,68,0.3)')
    setPhase('result')
  }, [demon, takeDamage, triggerDamage, triggerFlash])
 
  const handleChoice = useCallback(async (choice) => {
    clearInterval(timerRef.current)
    clearInterval(tauntRef.current)
 
    const win = choice.type === 'resist'
 
    // attack animation
    setAttackAnim(true)
    setTimeout(() => setAttackAnim(false), 400)
 
    if (win) {
      setDemonHp(0)
      addXP(choice.xp)
      triggerXP(choice.xp, demon.color)
      triggerConfetti()
      triggerFireMessage(getFireMessage?.() || '🔥 Victory!')
      triggerFlash(`${demon.glow.replace('0.4', '0.15')}`)
    } else {
      takeDamage(Math.abs(choice.hp))
      triggerDamage(`${choice.hp} HP`, '#ef4444')
      triggerFlash('rgba(239,68,68,0.25)')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
 
    await api.logBattle(
      user?.id || 'guest',
      win ? 'win' : 'lose',
      demon.name,
      win ? choice.xp : 0,
      win ? 0 : choice.hp
    )
 
    setResult({ win, xp: choice.xp, hp: choice.hp, choice })
    setTimeout(() => setPhase('result'), 300)
  }, [demon, addXP, takeDamage, triggerXP, triggerDamage, triggerConfetti, triggerFlash, triggerFireMessage, user])
 
  if (!demon) return <div style={{ background: '#060818', minHeight: '100vh' }} />
 
  const timerPct   = (timeLeft / 30) * 100
  const timerColor = timerPct > 50 ? '#22c55e' : timerPct > 25 ? '#f59e0b' : '#ef4444'
 
  return (
    <div style={{ ...s.root, ...(shake ? s.shakeRoot : {}) }}>
      <GameFXStyles />
      <FXLayer />
 
      {/* bg particles */}
      <div style={s.particleLayer}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: demon.color, opacity: 0.15,
            animation: `pulse ${p.dur}s ${p.delay}s infinite ease-in-out`,
          }} />
        ))}
      </div>
 
      {/* ambient glow from demon color */}
      <div style={{ ...s.demonGlow, background: `radial-gradient(ellipse at 50% 30%, ${demon.glow} 0%, transparent 65%)` }} />
 
      {/* ── INTRO SCREEN ── */}
      {phase === 'intro' && (
        <div style={s.introWrap}>
          <div style={s.warningBanner}>⚠️ DECISION ENCOUNTER</div>
          <div style={{ ...s.demonEmoji, filter: `drop-shadow(0 0 30px ${demon.color})`, animation: 'float 2s ease-in-out infinite' }}>
            {demon.emoji}
          </div>
          <div style={{ ...s.demonName, color: demon.color }}>{demon.name}</div>
          <div style={s.demonHpBar}>
            <div style={{ ...s.demonHpFill, width: `${demonHp}%`, background: demon.color }} />
          </div>
          <div style={s.introDesc}>A financial demon has appeared!<br />Make the right choice to defeat it.</div>
          <button style={{ ...s.fightBtn, background: demon.color, boxShadow: `0 0 30px ${demon.glow}` }}
            onClick={() => setPhase('fight')}>
            ⚔️ ENTER BATTLE
          </button>
          <button style={s.fleeBtn} onClick={() => navigate('/dashboard')}>← Retreat</button>
        </div>
      )}
 
      {/* ── FIGHT SCREEN ── */}
      {phase === 'fight' && (
        <div style={s.fightWrap}>
 
          {/* HUD */}
          <div style={s.fightHud}>
            <div style={s.playerHp}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>YOUR HP</span>
              <span style={{ color: '#ef4444', fontWeight: 900, fontFamily: 'Rajdhani,sans-serif', fontSize: 18 }}>
                {Math.round(user?.hp || 0)}
              </span>
            </div>
            <div style={{ ...s.timerCircle, borderColor: timerColor, boxShadow: `0 0 16px ${timerColor}40` }}>
              <span style={{ color: timerColor, fontFamily: 'Rajdhani,sans-serif', fontWeight: 900, fontSize: 22 }}>{timeLeft}</span>
              <span style={{ color: '#475569', fontSize: 9 }}>SEC</span>
            </div>
            <div style={s.playerXp}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>XP</span>
              <span style={{ color: '#c084fc', fontWeight: 900, fontFamily: 'Rajdhani,sans-serif', fontSize: 18 }}>
                {Math.round(user?.xp || 0)}
              </span>
            </div>
          </div>
 
          {/* Timer bar */}
          <div style={s.timerBar}>
            <div style={{ ...s.timerFill, width: `${timerPct}%`, background: timerColor, boxShadow: `0 0 8px ${timerColor}` }} />
          </div>
 
          {/* Demon */}
          <div style={{ ...s.demonCard, borderColor: demon.color + '40' }}>
            <div style={{ ...s.demonCardGlow, background: `radial-gradient(ellipse,${demon.glow} 0%,transparent 70%)` }} />
            <div style={{
              fontSize: 80, textAlign: 'center', marginBottom: 8,
              filter: `drop-shadow(0 0 20px ${demon.color})`,
              animation: attackAnim ? 'attackAnim 0.4s ease' : 'float 3s ease-in-out infinite',
            }}>{demon.emoji}</div>
            <div style={{ ...s.demonNameFight, color: demon.color }}>{demon.name}</div>
            {/* Demon HP */}
            <div style={s.demonHpRow}>
              <span style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>DEMON HP</span>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden', margin: '0 8px' }}>
                <div style={{ height: '100%', borderRadius: 100, background: demon.color, width: `${demonHp}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>
 
          {/* Taunt */}
          <div style={{ ...s.tauntBox, borderColor: demon.color + '40' }}>
            <span style={{ fontSize: 14 }}>{demon.emoji}</span>
            <span style={{ color: '#e2e8f0', fontSize: 14, fontStyle: 'italic' }}>"{demon.taunt[tauntIdx]}"</span>
          </div>
 
          {/* Choices */}
          <div style={s.choicesWrap}>
            {demon.choices.map((c, i) => (
              <button key={i}
                style={{ ...s.choiceBtn, ...(c.type === 'resist' ? s.resistBtn : s.yieldBtn) }}
                onClick={() => handleChoice(c)}>
                <div style={s.choiceTop}>
                  <span style={{ fontSize: 20 }}>{c.type === 'resist' ? '🛡️' : '💸'}</span>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{c.text}</span>
                </div>
                <div style={{ ...s.choiceImpact, color: c.type === 'resist' ? '#22c55e' : '#ef4444' }}>
                  {c.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
 
      {/* ── RESULT SCREEN ── */}
      {phase === 'result' && result && (
        <div style={s.resultWrap}>
          <div style={{ fontSize: 72, animation: 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {result.win ? '🏆' : '💀'}
          </div>
          <div style={{ ...s.resultTitle, color: result.win ? '#22c55e' : '#ef4444' }}>
            {result.timeout ? 'TIME\'S UP!' : result.win ? 'DEMON DEFEATED!' : 'DEMON WINS!'}
          </div>
          <div style={{ ...s.resultCard, borderColor: (result.win ? '#22c55e' : '#ef4444') + '40' }}>
            <div style={s.resultRow}>
              <span style={{ color: '#64748b' }}>Choice</span>
              <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{result.choice?.text}</span>
            </div>
            {result.win && (
              <div style={s.resultRow}>
                <span style={{ color: '#64748b' }}>XP Earned</span>
                <span style={{ color: '#c084fc', fontWeight: 900 }}>+{result.xp} XP ⚡</span>
              </div>
            )}
            {!result.win && (
              <div style={s.resultRow}>
                <span style={{ color: '#64748b' }}>HP Lost</span>
                <span style={{ color: '#ef4444', fontWeight: 900 }}>{result.hp} HP ❤️</span>
              </div>
            )}
          </div>
          <div style={s.tipBox}>
            <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, marginBottom: 6, letterSpacing: 2 }}>💡 FINANCE TIP</div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{demon.tip}</div>
          </div>
          <div style={s.resultBtns}>
            <button style={s.againBtn} onClick={() => {
              setDemon(DEMONS[Math.floor(Math.random() * DEMONS.length)])
              setDemonHp(100); setPhase('intro'); setResult(null); setTauntIdx(0)
            }}>⚔️ Fight Again</button>
            <button style={s.homeBtn} onClick={() => navigate('/dashboard')}>🏠 Return to HQ</button>
          </div>
        </div>
      )}
 
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=DM+Sans:wght@400;600;700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse { 0%,100%{opacity:0.15} 50%{opacity:0.4} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-10px)} 75%{transform:translateX(10px)} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
        @keyframes attackAnim { 0%{transform:scale(1)} 50%{transform:scale(1.3) rotate(-5deg)} 100%{transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  )
}
 
const s = {
  root: { minHeight:'100vh', background:'#060818', color:'#fff', fontFamily:"'DM Sans',sans-serif", position:'relative', overflowX:'hidden' },
  shakeRoot: { animation:'shake 0.5s ease' },
  particleLayer: { position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' },
  demonGlow: { position:'fixed', inset:0, pointerEvents:'none', zIndex:0 },
 
  // INTRO
  introWrap: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'24px 20px', textAlign:'center', position:'relative', zIndex:2 },
  warningBanner: { letterSpacing:4, fontSize:12, fontWeight:900, color:'#f59e0b', marginBottom:24, border:'1px solid rgba(245,158,11,0.3)', padding:'6px 20px', borderRadius:20, background:'rgba(245,158,11,0.08)' },
  demonEmoji: { fontSize:100, marginBottom:16 },
  demonName: { fontFamily:'Rajdhani,sans-serif', fontSize:28, fontWeight:900, marginBottom:12, letterSpacing:2 },
  demonHpBar: { width:200, height:8, background:'rgba(255,255,255,0.08)', borderRadius:100, overflow:'hidden', marginBottom:20 },
  demonHpFill: { height:'100%', borderRadius:100, transition:'width 0.5s ease' },
  introDesc: { color:'#64748b', fontSize:14, lineHeight:1.7, marginBottom:28 },
  fightBtn: { border:'none', color:'#fff', padding:'16px 40px', borderRadius:14, fontSize:18, fontWeight:900, cursor:'pointer', fontFamily:'inherit', letterSpacing:2, marginBottom:12 },
  fleeBtn: { background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:13, textDecoration:'underline', fontFamily:'inherit' },
 
  // FIGHT
  fightWrap: { position:'relative', zIndex:2, maxWidth:520, margin:'0 auto', padding:'16px 16px 40px' },
  fightHud: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, padding:'12px 16px', background:'rgba(255,255,255,0.03)', borderRadius:12, border:'1px solid rgba(255,255,255,0.06)' },
  playerHp: { display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2 },
  playerXp: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 },
  timerCircle: { width:60, height:60, borderRadius:'50%', border:'3px solid', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.4)', transition:'border-color 0.5s,box-shadow 0.5s' },
  timerBar: { height:4, background:'rgba(255,255,255,0.06)', borderRadius:100, overflow:'hidden', marginBottom:16 },
  timerFill: { height:'100%', borderRadius:100, transition:'width 1s linear,background 0.5s' },
  demonCard: { background:'rgba(255,255,255,0.03)', border:'1.5px solid', borderRadius:20, padding:'24px 16px 16px', marginBottom:14, position:'relative', overflow:'hidden', textAlign:'center' },
  demonCardGlow: { position:'absolute', inset:0, pointerEvents:'none', opacity:0.5 },
  demonNameFight: { fontFamily:'Rajdhani,sans-serif', fontSize:20, fontWeight:900, letterSpacing:2, marginBottom:12 },
  demonHpRow: { display:'flex', alignItems:'center', gap:8 },
  tauntBox: { background:'rgba(255,255,255,0.03)', border:'1px solid', borderRadius:12, padding:'12px 14px', marginBottom:16, display:'flex', gap:10, alignItems:'flex-start' },
  choicesWrap: { display:'flex', flexDirection:'column', gap:10 },
  choiceBtn: { display:'flex', flexDirection:'column', gap:6, padding:'16px', borderRadius:14, border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.2s' },
  choiceTop: { display:'flex', alignItems:'center', gap:10 },
  resistBtn: { background:'rgba(34,197,94,0.1)', border:'1.5px solid rgba(34,197,94,0.4)', color:'#86efac' },
  yieldBtn:  { background:'rgba(239,68,68,0.1)',  border:'1.5px solid rgba(239,68,68,0.35)',  color:'#fca5a5' },
  choiceImpact: { fontSize:12, fontWeight:700, paddingLeft:30 },
 
  // RESULT
  resultWrap: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'24px 20px', textAlign:'center', position:'relative', zIndex:2, gap:12 },
  resultTitle: { fontFamily:'Rajdhani,sans-serif', fontSize:32, fontWeight:900, letterSpacing:2 },
  resultCard: { width:'100%', maxWidth:400, background:'rgba(255,255,255,0.03)', border:'1px solid', borderRadius:16, padding:'16px 20px' },
  resultRow: { display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' },
  tipBox: { width:'100%', maxWidth:400, background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:12, padding:'14px 16px', textAlign:'left' },
  resultBtns: { display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' },
  againBtn: { background:'linear-gradient(135deg,#7c3aed,#c084fc)', border:'none', color:'#fff', padding:'14px 24px', borderRadius:12, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit' },
  homeBtn:  { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', padding:'14px 24px', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
}