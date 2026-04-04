import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useGameFX, GameFXStyles } from '../components/GameFX'
import { LEVEL_TITLES, generateDailyMissions, getWeeklyChallenge } from '../store/gameEngine'

const NAV = [
  { icon: '⚔️', label: 'Log',     path: '/expenses' },
  { icon: '🏠', label: 'HQ',      path: '/dashboard' },
  { icon: '🎮', label: 'Games',   path: '/games' },
  { icon: '🗺️', label: 'Quests',  path: '/quests' },
  { icon: '👤', label: 'Profile', path: '/profile' },
]

const MODULES = [
  { icon: '📝', label: 'Log Expense',   sub: 'Track your spend',    path: '/expenses', color: '#f97316', key: 'log'    },
  { icon: '⚔️', label: 'Battle Arena',  sub: 'Fight your demons',   path: '/battle',   color: '#ef4444', key: 'battle' },
  { icon: '🗺️', label: 'Quests',        sub: 'Daily missions',      path: '/quests',   color: '#22c55e', key: 'quests' },
  { icon: '🧠', label: 'Skill Tree',    sub: 'Unlock powers',       path: '/skills',   color: '#c084fc', key: 'skills' },
  { icon: '📊', label: 'Weekly Review', sub: 'Your habit score',    path: '/review',   color: '#4d9fff', key: 'review' },
  { icon: '👁️', label: 'Scam Trial',    sub: 'Detect frauds',       path: '/scam-trial', color: '#fbbf24', key: 'scam'  },
]

export default function Dashboard() {
  const navigate   = useNavigate()
  const user       = useUserStore((s) => s.user)
  const { triggerFireMessage, triggerXP, FXLayer } = useGameFX()

  const [missions,   setMissions]   = useState([])
  const [doneIds,    setDoneIds]    = useState([])
  const [scanLine,   setScanLine]   = useState(0)
  const [particles,  setParticles]  = useState([])
  const [time,       setTime]       = useState(new Date())
  const canvasRef = useRef(null)

  const xp        = user?.xp    || 0
  const hp        = user?.hp    || 500
  const level     = user?.level || 1
  const title     = (LEVEL_TITLES && LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]) || 'Broke Beginner'
  const xpForNext = level * 100
  const xpPct     = Math.min((xp % xpForNext) / xpForNext * 100, 100)
  const hpPct     = Math.min((hp / 500) * 100, 100)
  const income    = user?.income || 0
  const saveAmt   = Math.round(income * ((user?.savePercent || 20) / 100))
  const dailyBudget = Math.round((income - saveAmt) / 30)

  // clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // scanline
  useEffect(() => {
    const t = setInterval(() => setScanLine(p => p >= 100 ? 0 : p + 0.3), 16)
    return () => clearInterval(t)
  }, [])

  // particles
  useEffect(() => {
    setParticles(Array.from({ length: 40 }, (_, i) => ({
      id: i, x: Math.random() * 100, size: Math.random() * 3 + 1,
      dur: Math.random() * 6 + 3, delay: Math.random() * 5, opacity: Math.random() * 0.5 + 0.1,
    })))
  }, [])

  // missions
  useEffect(() => {
    if (generateDailyMissions) setMissions(generateDailyMissions().slice(0, 3))
  }, [])

  const completeMission = (id, xpReward) => {
    if (doneIds.includes(id)) return
    setDoneIds(p => [...p, id])
    triggerXP(xpReward, '#fbbf24')
    triggerFireMessage(`+${xpReward} XP earned!`)
  }

  const greeting = () => {
    const h = time.getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div style={s.root}>
      <GameFXStyles />
      <FXLayer />

      {/* ambient grid */}
      <div style={s.grid} />

      {/* top glow */}
      <div style={s.topGlow} />

      {/* scanline */}
      <div style={{ ...s.scanline, top: `${scanLine}vh` }} />

      {/* particles */}
      <div style={s.particleLayer}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.x}%`, bottom: 0,
            width: p.size, height: p.size, borderRadius: '50%',
            background: 'rgba(192,132,252,0.6)', opacity: p.opacity,
            animation: `riseUp ${p.dur}s ${p.delay}s infinite ease-in`,
          }} />
        ))}
      </div>

      {/* corner brackets */}
      {['tl','tr','bl','br'].map(c => (
        <div key={c} style={{ ...s.corner, ...s[c] }} />
      ))}

      <div style={s.scroll}>

        {/* ── HERO CARD ── */}
        <div style={s.heroCard}>
          <div style={s.heroGlow} />

          {/* top row: time + streak */}
          <div style={s.heroTop}>
            <span style={s.clockText}>
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span style={s.streakBadge}>🔥 {user?.streak || 0} day streak</span>
          </div>

          {/* greeting + name */}
          <div style={s.greeting}>{greeting()},</div>
          <div style={s.hunterName}>{user?.hunterName || user?.name || 'Hunter'}</div>

          {/* rank badge */}
          <div style={s.rankRow}>
            <div style={s.levelBadge}>LV.{level}</div>
            <div style={s.titleBadge}>{title}</div>
          </div>

          {/* XP bar */}
          <div style={s.barSection}>
            <div style={s.barLabel}>
              <span style={{ color: '#c084fc' }}>⚡ XP</span>
              <span style={{ color: '#64748b' }}>{Math.round(xp % xpForNext)} / {xpForNext}</span>
            </div>
            <div style={s.barTrack}>
              <div style={{ ...s.xpFill, width: `${xpPct}%` }} />
            </div>
          </div>

          {/* HP bar */}
          <div style={s.barSection}>
            <div style={s.barLabel}>
              <span style={{ color: hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444' }}>❤️ HP</span>
              <span style={{ color: '#64748b' }}>{Math.round(hp)} / 500</span>
            </div>
            <div style={s.barTrack}>
              <div style={{
                ...s.hpFill,
                width: `${hpPct}%`,
                background: hpPct > 50 ? 'linear-gradient(90deg,#16a34a,#22c55e)' : hpPct > 25 ? 'linear-gradient(90deg,#d97706,#f59e0b)' : 'linear-gradient(90deg,#b91c1c,#ef4444)',
              }} />
            </div>
          </div>

          {/* budget pill */}
          {dailyBudget > 0 && (
            <div style={s.budgetPill}>
              <span style={{ color: '#64748b', fontSize: 11 }}>TODAY'S BUDGET</span>
              <span style={{ color: '#4d9fff', fontWeight: 900, fontSize: 18, fontFamily: 'Rajdhani,sans-serif' }}>₹{dailyBudget}</span>
            </div>
          )}
        </div>

        {/* ── DAILY MISSIONS ── */}
        {missions.length > 0 && (
          <div style={s.section}>
            <div style={s.sectionTitle}>
              <span>📋</span><span>DAILY MISSIONS</span>
              <span style={s.sectionBadge}>{doneIds.length}/{missions.length}</span>
            </div>
            {missions.map((m, i) => (
              <div key={m.id} style={{ ...s.missionRow, ...(doneIds.includes(m.id) ? s.missionDone : {}) }}
                onClick={() => completeMission(m.id, m.xp)}>
                <div style={{ ...s.missionCheck, ...(doneIds.includes(m.id) ? s.missionCheckDone : {}) }}>
                  {doneIds.includes(m.id) ? '✓' : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: doneIds.includes(m.id) ? '#475569' : '#e2e8f0' }}>{m.task}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{m.description || 'Complete to earn XP'}</div>
                </div>
                <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: 14 }}>+{m.xp} XP</div>
              </div>
            ))}
          </div>
        )}

        {/* ── MODULE GRID ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}><span>🎮</span><span>COMMAND CENTER</span></div>
          <div style={s.moduleGrid}>
            {MODULES.map(mod => (
              <button key={mod.key} style={{ ...s.modCard, '--c': mod.color }}
                onClick={() => navigate(mod.path)}>
                <div style={{ ...s.modGlow, background: `${mod.color}22` }} />
                <div style={{ ...s.modBorder, borderColor: mod.color + '33' }} />
                <span style={{ fontSize: 28, marginBottom: 6 }}>{mod.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0' }}>{mod.label}</span>
                <span style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{mod.sub}</span>
                <div style={{ ...s.modArrow, color: mod.color }}>→</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── WEEKLY SNAPSHOT ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}><span>📊</span><span>THIS WEEK</span></div>
          <div style={s.statsRow}>
            {[
              { label: 'BATTLES', value: user?.battles || 0, color: '#ef4444', icon: '⚔️' },
              { label: 'XP EARNED', value: Math.round(xp), color: '#c084fc', icon: '⚡' },
              { label: 'MISSIONS', value: doneIds.length, color: '#fbbf24', icon: '📋' },
            ].map(stat => (
              <div key={stat.label} style={s.statCard}>
                <span style={{ fontSize: 20 }}>{stat.icon}</span>
                <span style={{ ...s.statVal, color: stat.color }}>{stat.value}</span>
                <span style={s.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── BOTTOM NAV ── */}
      <nav style={s.nav}>
        {NAV.map(n => (
          <button key={n.path} style={{ ...s.navBtn, ...(window.location.pathname === n.path ? s.navBtnActive : {}) }}
            onClick={() => navigate(n.path)}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>{n.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=DM+Sans:wght@400;600;700&display=swap');
        @keyframes riseUp { 0%{transform:translateY(0);opacity:0.6} 100%{transform:translateY(-100vh);opacity:0} }
        @keyframes scanAnim { from{top:0} to{top:100vh} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  )
}

const s = {
  root: { minHeight:'100vh', background:'#060818', color:'#fff', fontFamily:"'DM Sans',sans-serif", position:'relative', overflowX:'hidden' },
  grid: { position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(192,132,252,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(192,132,252,0.03) 1px,transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none', zIndex:0 },
  topGlow: { position:'fixed', top:-200, left:'50%', transform:'translateX(-50%)', width:500, height:400, background:'radial-gradient(ellipse,rgba(124,58,237,0.15) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 },
  scanline: { position:'fixed', left:0, right:0, height:2, background:'rgba(192,132,252,0.08)', zIndex:1, pointerEvents:'none', animation:'scanAnim 6s linear infinite' },
  particleLayer: { position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' },
  corner: { position:'fixed', width:20, height:20, zIndex:10 },
  tl: { top:12, left:12, borderTop:'2px solid rgba(192,132,252,0.4)', borderLeft:'2px solid rgba(192,132,252,0.4)' },
  tr: { top:12, right:12, borderTop:'2px solid rgba(192,132,252,0.4)', borderRight:'2px solid rgba(192,132,252,0.4)' },
  bl: { bottom:80, left:12, borderBottom:'2px solid rgba(192,132,252,0.4)', borderLeft:'2px solid rgba(192,132,252,0.4)' },
  br: { bottom:80, right:12, borderBottom:'2px solid rgba(192,132,252,0.4)', borderRight:'2px solid rgba(192,132,252,0.4)' },
  scroll: { position:'relative', zIndex:2, maxWidth:520, margin:'0 auto', padding:'16px 16px 100px' },

  heroCard: { position:'relative', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(192,132,252,0.25)', borderRadius:20, padding:'20px 18px', marginBottom:16, overflow:'hidden', animation:'fadeUp 0.5s ease' },
  heroGlow: { position:'absolute', top:-60, right:-60, width:200, height:200, background:'radial-gradient(ellipse,rgba(192,132,252,0.12) 0%,transparent 70%)', pointerEvents:'none' },
  heroTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  clockText: { fontFamily:'Rajdhani,sans-serif', fontSize:13, color:'#475569', letterSpacing:2, fontWeight:700 },
  streakBadge: { background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.3)', color:'#fbbf24', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700 },
  greeting: { fontSize:13, color:'#64748b', marginBottom:2 },
  hunterName: { fontFamily:'Rajdhani,sans-serif', fontSize:32, fontWeight:900, color:'#fff', marginBottom:8, background:'linear-gradient(90deg,#fff,#c084fc,#fff)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', animation:'shimmer 3s linear infinite' },
  rankRow: { display:'flex', alignItems:'center', gap:8, marginBottom:16 },
  levelBadge: { background:'linear-gradient(135deg,#7c3aed,#c084fc)', padding:'4px 12px', borderRadius:20, fontSize:13, fontWeight:900, color:'#fff', boxShadow:'0 0 14px rgba(192,132,252,0.4)' },
  titleBadge: { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', padding:'4px 12px', borderRadius:20, fontSize:12, color:'#94a3b8', fontWeight:700 },
  barSection: { marginBottom:10 },
  barLabel: { display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:700, marginBottom:5 },
  barTrack: { height:8, background:'rgba(255,255,255,0.06)', borderRadius:100, overflow:'hidden' },
  xpFill: { height:'100%', borderRadius:100, background:'linear-gradient(90deg,#7c3aed,#c084fc)', boxShadow:'0 0 8px rgba(192,132,252,0.5)', transition:'width 1s cubic-bezier(0.4,0,0.2,1)' },
  hpFill: { height:'100%', borderRadius:100, transition:'width 1s cubic-bezier(0.4,0,0.2,1)' },
  budgetPill: { display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(77,159,255,0.08)', border:'1px solid rgba(77,159,255,0.2)', borderRadius:10, padding:'10px 14px', marginTop:12 },

  section: { marginBottom:16, animation:'fadeUp 0.5s ease' },
  sectionTitle: { display:'flex', alignItems:'center', gap:8, fontSize:11, fontWeight:900, letterSpacing:3, color:'#475569', marginBottom:12, textTransform:'uppercase' },
  sectionBadge: { marginLeft:'auto', background:'rgba(251,191,36,0.15)', color:'#fbbf24', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700 },

  missionRow: { display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 14px', marginBottom:8, cursor:'pointer', transition:'all 0.2s' },
  missionDone: { opacity:0.4 },
  missionCheck: { width:28, height:28, borderRadius:8, border:'1.5px solid rgba(192,132,252,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'#c084fc', flexShrink:0 },
  missionCheckDone: { background:'rgba(34,197,94,0.2)', border:'1.5px solid #22c55e', color:'#22c55e' },

  moduleGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 },
  modCard: { position:'relative', display:'flex', flexDirection:'column', alignItems:'center', padding:'16px 8px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', cursor:'pointer', fontFamily:'inherit', overflow:'hidden', transition:'all 0.25s' },
  modGlow: { position:'absolute', inset:0, opacity:0, transition:'opacity 0.3s' },
  modBorder: { position:'absolute', inset:0, borderRadius:14, border:'1.5px solid transparent', transition:'border-color 0.3s' },
  modArrow: { position:'absolute', bottom:8, right:10, fontSize:14, fontWeight:900, opacity:0.6 },

  statsRow: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 },
  statCard: { display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 8px' },
  statVal: { fontFamily:'Rajdhani,sans-serif', fontSize:24, fontWeight:900 },
  statLabel: { fontSize:9, color:'#475569', letterSpacing:2, fontWeight:700, textTransform:'uppercase' },

  nav: { position:'fixed', bottom:0, left:0, right:0, height:70, background:'rgba(6,8,24,0.97)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(192,132,252,0.15)', display:'flex', zIndex:100 },
  navBtn: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, background:'none', border:'none', color:'#475569', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' },
  navBtnActive: { color:'#c084fc' },
}