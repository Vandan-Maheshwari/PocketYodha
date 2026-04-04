import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useGameFX, GameFXStyles } from '../components/GameFX'
import { LEVEL_TITLES } from '../store/gameEngine'

const BADGE_LIST = [
  { id: 'first_log',   icon: '📝', name: 'First Log',     desc: 'Logged first expense',     xp: 10  },
  { id: 'battle_win',  icon: '⚔️', name: 'Battle Victor', desc: 'Won first battle',          xp: 50  },
  { id: 'streak_3',    icon: '🔥', name: 'On Fire',        desc: '3 day streak',             xp: 30  },
  { id: 'scam_detect', icon: '👁️', name: 'Scam Vision',   desc: 'Completed Scam Trial',     xp: 75  },
  { id: 'saver',       icon: '💰', name: 'Saver',          desc: 'Saved 20%+ income',        xp: 100 },
  { id: 'level5',      icon: '⭐', name: 'Rising Hunter',  desc: 'Reached Level 5',          xp: 60  },
  { id: 'no_trap',     icon: '🛡️', name: 'Trap Dodger',   desc: 'No traps for 7 days',      xp: 80  },
  { id: 'shadow',      icon: '👑', name: 'Shadow Monarch', desc: 'Reached Level 20',         xp: 500 },
]

const STAT_ITEMS = (user) => [
  { label: 'Total XP',    value: Math.round(user?.xp || 0),       icon: '⚡', color: '#c084fc' },
  { label: 'HP',          value: `${Math.round(user?.hp || 0)}/500`, icon: '❤️', color: '#ef4444' },
  { label: 'Level',       value: user?.level || 1,                 icon: '🏅', color: '#fbbf24' },
  { label: 'Streak',      value: `${user?.streak || 0}d`,          icon: '🔥', color: '#f97316' },
  { label: 'Income',      value: `₹${(user?.income || 0).toLocaleString('en-IN')}`, icon: '💰', color: '#22c55e' },
  { label: 'Save Target', value: `${user?.savePercent || 20}%`,    icon: '📈', color: '#4d9fff' },
]

export default function Profile() {
  const navigate   = useNavigate()
  const user       = useUserStore((s) => s.user)
  const logout     = useUserStore((s) => s.logout || s.clearUser)
  const { triggerFireMessage, FXLayer } = useGameFX()

  const [tab,       setTab]       = useState('stats') // stats | badges | settings
  const [editing,   setEditing]   = useState(false)
  const [hunterName, setHunterName] = useState(user?.hunterName || '')

  const level  = user?.level || 1
  const title  = (LEVEL_TITLES && LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]) || 'Broke Beginner'
  const xp     = user?.xp || 0
  const xpNext = level * 100
  const xpPct  = Math.min((xp % xpNext) / xpNext * 100, 100)
  const hpPct  = Math.min(((user?.hp || 0) / 500) * 100, 100)

  // earned badges (mock — first 3 always earned for demo)
  const earned = BADGE_LIST.slice(0, Math.max(1, Math.min(level, BADGE_LIST.length)))

  const saveHunterName = () => {
    if (hunterName.trim()) {
      useUserStore.getState().updateUser?.({ hunterName: hunterName.trim() })
      triggerFireMessage('Hunter name updated!')
    }
    setEditing(false)
  }

  return (
    <div style={s.root}>
      <GameFXStyles />
      <FXLayer />

      <div style={s.grid} />
      <div style={s.topGlow} />

      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← HQ</button>
        <span style={s.headerTitle}>HUNTER PROFILE</span>
        <div style={{ width: 60 }} />
      </div>

      <div style={s.content}>

        {/* ── AVATAR CARD ── */}
        <div style={s.avatarCard}>
          {/* bg glow matching avatar */}
          <div style={s.avatarGlow} />

          <div style={s.avatarWrap}>
            <div style={s.avatarRing}>
              <div style={s.avatarInner}>
                <span style={{ fontSize: 52 }}>
                  {user?.avatar || '⚔️'}
                </span>
              </div>
              {/* XP ring */}
              <svg style={s.xpRing} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(192,132,252,0.15)" strokeWidth="4"/>
                <circle cx="50" cy="50" r="46" fill="none" stroke="#c084fc" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${xpPct * 2.89} 289`}
                  strokeDashoffset="72"
                  style={{ transition: 'stroke-dasharray 1s ease', filter: 'drop-shadow(0 0 4px #c084fc)' }}
                />
              </svg>
            </div>
          </div>

          {/* Name + edit */}
          <div style={s.nameRow}>
            {editing ? (
              <div style={s.nameEditRow}>
                <input
                  value={hunterName}
                  onChange={e => setHunterName(e.target.value)}
                  style={s.nameInput}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveHunterName()}
                />
                <button style={s.saveNameBtn} onClick={saveHunterName}>✓</button>
              </div>
            ) : (
              <div style={s.nameDisplay}>
                <span style={s.hunterNameText}>{user?.hunterName || user?.name || 'Hunter'}</span>
                <button style={s.editNameBtn} onClick={() => setEditing(true)}>✎</button>
              </div>
            )}
          </div>

          {/* Level + title */}
          <div style={s.titleRow}>
            <span style={s.lvlBadge}>LV.{level}</span>
            <span style={s.titleText}>{title}</span>
          </div>

          {/* HP + XP mini bars */}
          <div style={s.miniBars}>
            <div style={s.miniBar}>
              <div style={s.miniBarLabel}>
                <span style={{ color: '#c084fc' }}>XP</span>
                <span style={{ color: '#475569' }}>{Math.round(xp % xpNext)}/{xpNext}</span>
              </div>
              <div style={s.miniTrack}>
                <div style={{ ...s.miniXpFill, width: `${xpPct}%` }} />
              </div>
            </div>
            <div style={s.miniBar}>
              <div style={s.miniBarLabel}>
                <span style={{ color: hpPct > 50 ? '#22c55e' : '#ef4444' }}>HP</span>
                <span style={{ color: '#475569' }}>{Math.round(user?.hp || 0)}/500</span>
              </div>
              <div style={s.miniTrack}>
                <div style={{
                  ...s.miniHpFill, width: `${hpPct}%`,
                  background: hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444',
                }} />
              </div>
            </div>
          </div>

          {/* Identity pills */}
          <div style={s.pillRow}>
            {[user?.occupation, user?.gender, `Age ${user?.age}`].filter(Boolean).map((p, i) => (
              <span key={i} style={s.identPill}>{p}</span>
            ))}
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={s.tabs}>
          {['stats', 'badges', 'settings'].map(t => (
            <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
              onClick={() => setTab(t)}>
              {t === 'stats' ? '📊 Stats' : t === 'badges' ? '🏅 Badges' : '⚙️ Settings'}
            </button>
          ))}
        </div>

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <div style={s.tabContent}>
            <div style={s.statsGrid}>
              {STAT_ITEMS(user).map(st => (
                <div key={st.label} style={s.statCard}>
                  <span style={{ fontSize: 22 }}>{st.icon}</span>
                  <span style={{ ...s.statVal, color: st.color }}>{st.value}</span>
                  <span style={s.statLabel}>{st.label}</span>
                </div>
              ))}
            </div>
            <div style={s.goalCard}>
              <div style={s.goalLabel}>🎯 ACTIVE GOAL</div>
              {user?.activeGoal ? (
                <>
                  <div style={s.goalName}>{user.activeGoal.emoji || '🎯'} {user.activeGoal.name}</div>
                  <div style={s.goalTrack}>
                    <div style={{ ...s.goalFill, width: `${Math.min((user.activeGoal.saved || 0) / (user.activeGoal.target || 1) * 100, 100)}%` }} />
                  </div>
                  <div style={s.goalMeta}>
                    <span style={{ color: '#22c55e' }}>₹{(user.activeGoal.saved || 0).toLocaleString('en-IN')}</span>
                    <span style={{ color: '#475569' }}>of ₹{(user.activeGoal.target || 0).toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : (
                <div style={{ color: '#475569', fontSize: 13 }}>No active goal — set one in Quests!</div>
              )}
            </div>
          </div>
        )}

        {/* ── BADGES TAB ── */}
        {tab === 'badges' && (
          <div style={s.tabContent}>
            <div style={s.badgeGrid}>
              {BADGE_LIST.map(b => {
                const isEarned = earned.some(e => e.id === b.id)
                return (
                  <div key={b.id} style={{ ...s.badgeCard, ...(isEarned ? s.badgeEarned : s.badgeLocked) }}>
                    <span style={{ fontSize: 28, filter: isEarned ? 'none' : 'grayscale(1)', opacity: isEarned ? 1 : 0.3 }}>{b.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isEarned ? '#e2e8f0' : '#334155' }}>{b.name}</span>
                    <span style={{ fontSize: 10, color: isEarned ? '#64748b' : '#1e293b', textAlign: 'center' }}>{b.desc}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: isEarned ? '#fbbf24' : '#334155' }}>+{b.xp} XP</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div style={s.tabContent}>
            <div style={s.settingRow}>
              <span style={s.settingLabel}>👤 Name</span>
              <span style={s.settingVal}>{user?.name}</span>
            </div>
            <div style={s.settingRow}>
              <span style={s.settingLabel}>🎂 Age</span>
              <span style={s.settingVal}>{user?.age}</span>
            </div>
            <div style={s.settingRow}>
              <span style={s.settingLabel}>💼 Occupation</span>
              <span style={s.settingVal}>{user?.occupation}</span>
            </div>
            <div style={s.settingRow}>
              <span style={s.settingLabel}>💰 Income</span>
              <span style={s.settingVal}>₹{(user?.income || 0).toLocaleString('en-IN')}/mo</span>
            </div>
            <div style={s.settingRow}>
              <span style={s.settingLabel}>📈 Save %</span>
              <span style={s.settingVal}>{user?.savePercent || 20}%</span>
            </div>
            <div style={{ height: 20 }} />
            <button style={s.logoutBtn} onClick={() => { logout?.(); navigate('/register') }}>
              🚪 Logout
            </button>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=DM+Sans:wght@400;600;700&display=swap');
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

const s = {
  root: { minHeight:'100vh', background:'#060818', color:'#fff', fontFamily:"'DM Sans',sans-serif", position:'relative', paddingBottom:40 },
  grid: { position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(192,132,252,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(192,132,252,0.03) 1px,transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none', zIndex:0 },
  topGlow: { position:'fixed', top:-200, left:'50%', transform:'translateX(-50%)', width:500, height:400, background:'radial-gradient(ellipse,rgba(124,58,237,0.12) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 },
  header: { position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'rgba(6,8,24,0.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(192,132,252,0.15)' },
  backBtn: { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit' },
  headerTitle: { fontSize:13, fontWeight:900, letterSpacing:3, color:'#c084fc' },
  content: { position:'relative', zIndex:2, maxWidth:520, margin:'0 auto', padding:'16px 16px 40px' },

  avatarCard: { position:'relative', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(192,132,252,0.2)', borderRadius:20, padding:'24px 18px 18px', marginBottom:16, textAlign:'center', overflow:'hidden', animation:'fadeUp 0.4s ease' },
  avatarGlow: { position:'absolute', top:-80, left:'50%', transform:'translateX(-50%)', width:300, height:200, background:'radial-gradient(ellipse,rgba(192,132,252,0.12) 0%,transparent 70%)', pointerEvents:'none' },
  avatarWrap: { display:'flex', justifyContent:'center', marginBottom:14 },
  avatarRing: { position:'relative', width:110, height:110 },
  avatarInner: { position:'absolute', inset:8, borderRadius:'50%', background:'rgba(192,132,252,0.1)', border:'2px solid rgba(192,132,252,0.3)', display:'flex', alignItems:'center', justifyContent:'center' },
  xpRing: { position:'absolute', inset:0, width:'100%', height:'100%', transform:'rotate(-90deg)' },

  nameRow: { marginBottom:8 },
  nameEditRow: { display:'flex', gap:8, justifyContent:'center' },
  nameInput: { background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(192,132,252,0.4)', borderRadius:8, color:'#fff', fontSize:20, padding:'6px 14px', outline:'none', fontFamily:'Rajdhani,sans-serif', fontWeight:700, textAlign:'center' },
  saveNameBtn: { background:'rgba(34,197,94,0.2)', border:'1px solid rgba(34,197,94,0.4)', color:'#22c55e', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:16, fontWeight:700 },
  nameDisplay: { display:'flex', alignItems:'center', justifyContent:'center', gap:8 },
  hunterNameText: { fontFamily:'Rajdhani,sans-serif', fontSize:26, fontWeight:900, background:'linear-gradient(90deg,#fff,#c084fc)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', animation:'shimmer 3s linear infinite' },
  editNameBtn: { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#64748b', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:14 },

  titleRow: { display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:14 },
  lvlBadge: { background:'linear-gradient(135deg,#7c3aed,#c084fc)', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:900, color:'#fff' },
  titleText: { color:'#94a3b8', fontSize:13, fontWeight:600 },

  miniBars: { display:'flex', flexDirection:'column', gap:8, marginBottom:12 },
  miniBar: {},
  miniBarLabel: { display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:700, marginBottom:4 },
  miniTrack: { height:6, background:'rgba(255,255,255,0.06)', borderRadius:100, overflow:'hidden' },
  miniXpFill: { height:'100%', borderRadius:100, background:'linear-gradient(90deg,#7c3aed,#c084fc)', transition:'width 1s ease' },
  miniHpFill: { height:'100%', borderRadius:100, transition:'width 1s ease' },

  pillRow: { display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap' },
  identPill: { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 },

  tabs: { display:'flex', background:'rgba(255,255,255,0.03)', borderRadius:12, padding:4, gap:4, marginBottom:14 },
  tab: { flex:1, background:'none', border:'none', color:'#475569', padding:'10px 8px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit', transition:'all 0.2s' },
  tabActive: { background:'rgba(192,132,252,0.15)', color:'#c084fc', boxShadow:'0 0 12px rgba(192,132,252,0.15)' },
  tabContent: { animation:'fadeUp 0.3s ease' },

  statsGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 },
  statCard: { display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 8px' },
  statVal: { fontFamily:'Rajdhani,sans-serif', fontSize:22, fontWeight:900 },
  statLabel: { fontSize:9, color:'#475569', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase' },

  goalCard: { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:12, padding:'14px 16px' },
  goalLabel: { fontSize:10, letterSpacing:2, color:'#22c55e', fontWeight:700, marginBottom:8 },
  goalName: { fontSize:16, fontWeight:700, marginBottom:10, color:'#e2e8f0' },
  goalTrack: { height:8, background:'rgba(255,255,255,0.06)', borderRadius:100, overflow:'hidden', marginBottom:6 },
  goalFill: { height:'100%', borderRadius:100, background:'linear-gradient(90deg,#16a34a,#22c55e)', transition:'width 1s ease' },
  goalMeta: { display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:700 },

  badgeGrid: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 },
  badgeCard: { display:'flex', flexDirection:'column', alignItems:'center', gap:4, borderRadius:12, padding:'16px 10px', textAlign:'center' },
  badgeEarned: { background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)' },
  badgeLocked: { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' },

  settingRow: { display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'13px 16px', marginBottom:8 },
  settingLabel: { fontSize:13, color:'#64748b', fontWeight:600 },
  settingVal: { fontSize:14, color:'#e2e8f0', fontWeight:700 },

  logoutBtn: { width:'100%', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#fca5a5', padding:'14px', borderRadius:12, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' },
}