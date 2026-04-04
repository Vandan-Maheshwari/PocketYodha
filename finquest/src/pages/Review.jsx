import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useGameFX, GameFXStyles } from '../components/GameFX'
import api from '../api'
 
const MEMES = [
  { min: 90, emoji: '👑', text: 'Shadow Monarch Mode', sub: 'Your finances are IMMACULATE bro', color: '#fbbf24' },
  { min: 75, emoji: '⚔️', text: 'Strong Hunter', sub: 'Demons couldn\'t beat you this week!', color: '#22c55e' },
  { min: 55, emoji: '🛡️', text: 'Average Warrior', sub: 'Could be worse... could be better', color: '#4d9fff' },
  { min: 35, emoji: '😰', text: 'Under Pressure', sub: 'Goblin mode: partially activated', color: '#f59e0b' },
  { min: 0,  emoji: '💀', text: 'Goblin Ate Budget', sub: 'Bhai kya kar raha hai 😭', color: '#ef4444' },
]
 
function getMeme(score) {
  return MEMES.find(m => score >= m.min) || MEMES[MEMES.length - 1]
}
 
function DonutChart({ needs, wants, traps, total }) {
  const size = 160, stroke = 22, r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const needsPct  = total > 0 ? (needs  / total) : 0.34
  const wantsPct  = total > 0 ? (wants  / total) : 0.33
  const trapsPct  = total > 0 ? (traps  / total) : 0.33
 
  const needsDash  = circ * needsPct
  const wantsDash  = circ * wantsPct
  const trapsDash  = circ * trapsPct
  const needsOff   = 0
  const wantsOff   = -(needsDash)
  const trapsOff   = -(needsDash + wantsDash)
 
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
      {needsPct > 0 && <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#22c55e" strokeWidth={stroke}
        strokeDasharray={`${needsDash} ${circ}`} strokeDashoffset={needsOff} strokeLinecap="butt"
        style={{ transition:'stroke-dasharray 1s ease', filter:'drop-shadow(0 0 4px #22c55e)' }}/>}
      {wantsPct > 0 && <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f59e0b" strokeWidth={stroke}
        strokeDasharray={`${wantsDash} ${circ}`} strokeDashoffset={wantsOff} strokeLinecap="butt"
        style={{ transition:'stroke-dasharray 1s ease', filter:'drop-shadow(0 0 4px #f59e0b)' }}/>}
      {trapsPct > 0 && <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ef4444" strokeWidth={stroke}
        strokeDasharray={`${trapsDash} ${circ}`} strokeDashoffset={trapsOff} strokeLinecap="butt"
        style={{ transition:'stroke-dasharray 1s ease', filter:'drop-shadow(0 0 4px #ef4444)' }}/>}
    </svg>
  )
}
 
function HabitRing({ score }) {
  const size = 140, stroke = 12, r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * (score / 100)
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
 
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset="0" strokeLinecap="round"
        style={{ transition:'stroke-dasharray 1.5s cubic-bezier(0.4,0,0.2,1)', filter:`drop-shadow(0 0 6px ${color})` }}/>
    </svg>
  )
}
 
export default function Review() {
  const navigate = useNavigate()
  const user     = useUserStore((s) => s.user)
  const { triggerConfetti, triggerFireMessage, FXLayer } = useGameFX()
 
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [scanLine,  setScanLine]  = useState(0)
  const [revealed,  setRevealed]  = useState(false)
 
  useEffect(() => {
    const sl = setInterval(() => setScanLine(p => p >= 100 ? 0 : p + 0.3), 16)
    return () => clearInterval(sl)
  }, [])
 
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await api.getWeeklyReview(user?.id || 'guest')
      if (res) {
        setData(res)
        setTimeout(() => {
          setRevealed(true)
          if (res.habit_score >= 75) { triggerConfetti(); triggerFireMessage(`🏆 ${res.verdict}!`) }
        }, 400)
      } else {
        // fallback demo data
        setData({
          week_summary: { total_spend: 3200, needs: 1800, wants: 1200, traps: 200, expense_count: 12 },
          battles: { wins: 4, losses: 1 },
          habit_score: 72,
          verdict: 'Strong Hunter',
          expenses: []
        })
        setTimeout(() => setRevealed(true), 400)
      }
      setLoading(false)
    }
    load()
  }, [user])
 
  if (loading) return (
    <div style={s.loadWrap}>
      <div style={{ fontSize: 48, animation: 'spin 1s linear infinite' }}>⚙️</div>
      <div style={{ color: '#c084fc', fontFamily: 'Rajdhani,sans-serif', fontSize: 18, fontWeight: 700, marginTop: 16 }}>GENERATING REPORT...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
 
  if (!data) return null
 
  const { week_summary: ws, battles, habit_score, verdict } = data
  const meme   = getMeme(habit_score)
  const total  = ws.total_spend || 1
  const income = user?.income || 0
  const saveTarget = Math.round(income * ((user?.savePercent || 20) / 100))
  const actualSaved = Math.max(0, income - ws.total_spend)
 
  return (
    <div style={s.root}>
      <GameFXStyles />
      <FXLayer />
 
      <div style={s.grid} />
      <div style={{ position:'fixed', inset:0, background:`radial-gradient(ellipse at 50% 20%, ${meme.color}18 0%, transparent 60%)`, pointerEvents:'none', zIndex:0, transition:'background 1s' }} />
      <div style={{ ...s.scanline, top:`${scanLine}vh` }} />
 
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← HQ</button>
        <span style={s.headerTitle}>WEEKLY REPORT</span>
        <div style={{ width: 60 }} />
      </div>
 
      <div style={s.content}>
 
        {/* ── HABIT SCORE CARD ── */}
        <div style={{ ...s.card, ...(revealed ? { animation:'fadeUp 0.5s ease both' } : { opacity:0 }) }}>
          <div style={s.scoreRow}>
            <div style={s.ringWrap}>
              <HabitRing score={habit_score} />
              <div style={s.ringInner}>
                <span style={{ ...s.scoreNum, color: meme.color }}>{habit_score}</span>
                <span style={s.scoreLabel}>SCORE</span>
              </div>
            </div>
            <div style={s.scoreRight}>
              <div style={{ fontSize: 48 }}>{meme.emoji}</div>
              <div style={{ ...s.verdictText, color: meme.color }}>{meme.text}</div>
              <div style={s.verdictSub}>{meme.sub}</div>
              <div style={s.weekLabel}>Week of {new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</div>
            </div>
          </div>
        </div>
 
        {/* ── SPEND BREAKDOWN ── */}
        <div style={{ ...s.card, ...(revealed ? { animation:'fadeUp 0.5s 0.1s ease both' } : { opacity:0 }) }}>
          <div style={s.cardTitle}>💰 SPEND BREAKDOWN</div>
          <div style={s.breakdownRow}>
            <div style={s.donutWrap}>
              <DonutChart needs={ws.needs} wants={ws.wants} traps={ws.traps} total={total} />
              <div style={s.donutCenter}>
                <span style={{ fontFamily:'Rajdhani,sans-serif', fontSize:18, fontWeight:900, color:'#fff' }}>
                  ₹{ws.total_spend.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize:10, color:'#475569' }}>TOTAL</span>
              </div>
            </div>
            <div style={s.legend}>
              {[
                { label:'Needs',  val: ws.needs,  color:'#22c55e', icon:'✅' },
                { label:'Wants',  val: ws.wants,  color:'#f59e0b', icon:'⚠️' },
                { label:'Traps',  val: ws.traps,  color:'#ef4444', icon:'☠️' },
              ].map(l => (
                <div key={l.label} style={s.legendRow}>
                  <div style={{ ...s.legendDot, background: l.color }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:'#94a3b8' }}>{l.icon} {l.label}</div>
                    <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:18, fontWeight:900, color: l.color }}>
                      ₹{l.val.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:'#475569' }}>{total > 0 ? Math.round(l.val/total*100) : 0}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
 
        {/* ── BATTLE STATS ── */}
        <div style={{ ...s.card, ...(revealed ? { animation:'fadeUp 0.5s 0.2s ease both' } : { opacity:0 }) }}>
          <div style={s.cardTitle}>⚔️ BATTLE RECORD</div>
          <div style={s.battleRow}>
            <div style={s.battleStat}>
              <span style={{ fontSize:32 }}>🏆</span>
              <span style={{ fontFamily:'Rajdhani,sans-serif', fontSize:36, fontWeight:900, color:'#22c55e' }}>{battles.wins}</span>
              <span style={{ fontSize:11, color:'#475569' }}>WINS</span>
            </div>
            <div style={s.battleVs}>VS</div>
            <div style={s.battleStat}>
              <span style={{ fontSize:32 }}>💀</span>
              <span style={{ fontFamily:'Rajdhani,sans-serif', fontSize:36, fontWeight:900, color:'#ef4444' }}>{battles.losses}</span>
              <span style={{ fontSize:11, color:'#475569' }}>LOSSES</span>
            </div>
            <div style={{ ...s.battleStat, borderLeft:'1px solid rgba(255,255,255,0.06)', paddingLeft:20 }}>
              <span style={{ fontSize:32 }}>📋</span>
              <span style={{ fontFamily:'Rajdhani,sans-serif', fontSize:36, fontWeight:900, color:'#c084fc' }}>{ws.expense_count}</span>
              <span style={{ fontSize:11, color:'#475569' }}>LOGGED</span>
            </div>
          </div>
        </div>
 
        {/* ── SAVINGS ── */}
        {income > 0 && (
          <div style={{ ...s.card, ...(revealed ? { animation:'fadeUp 0.5s 0.3s ease both' } : { opacity:0 }) }}>
            <div style={s.cardTitle}>💾 SAVINGS PROGRESS</div>
            <div style={s.savingsRow}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:'#94a3b8', marginBottom:6 }}>
                  Target: <span style={{ color:'#22c55e', fontWeight:700 }}>₹{saveTarget.toLocaleString('en-IN')}</span>
                </div>
                <div style={s.savingsTrack}>
                  <div style={{ ...s.savingsFill, width:`${Math.min(actualSaved/Math.max(saveTarget,1)*100,100)}%` }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                  <span style={{ fontSize:11, color:'#475569' }}>Saved this week</span>
                  <span style={{ fontFamily:'Rajdhani,sans-serif', fontSize:16, fontWeight:900, color: actualSaved >= saveTarget ? '#22c55e' : '#f59e0b' }}>
                    ₹{actualSaved.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
 
        {/* ── NEXT WEEK TIPS ── */}
        <div style={{ ...s.card, borderColor:'rgba(77,159,255,0.2)', ...(revealed ? { animation:'fadeUp 0.5s 0.4s ease both' } : { opacity:0 }) }}>
          <div style={{ ...s.cardTitle, color:'#4d9fff' }}>🎯 NEXT WEEK TARGETS</div>
          {[
            ws.wants > ws.needs  && '⚠️ Wants > Needs this week — aim to flip that ratio',
            ws.traps > 0         && '☠️ Trap detected — stay alert for scams next week',
            battles.losses > battles.wins && '⚔️ More losses than wins — practice in ScamTrial',
            habit_score < 60     && '📈 Habit score below 60 — log every expense daily',
            actualSaved < saveTarget && `💰 Save ₹${(saveTarget - actualSaved).toLocaleString('en-IN')} more to hit your target`,
          ].filter(Boolean).slice(0, 3).map((tip, i) => (
            <div key={i} style={s.tipRow}>{tip}</div>
          ))}
          {habit_score >= 80 && <div style={s.tipRow}>🔥 Excellent week! Keep the streak going!</div>}
        </div>
 
        {/* CTA */}
        <button style={s.ctaBtn} onClick={() => navigate('/expenses')}>
          ⚡ Start New Week
        </button>
 
      </div>
 
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=DM+Sans:wght@400;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes scanAnim { from{top:0} to{top:100vh} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
 
const s = {
  root: { minHeight:'100vh', background:'#060818', color:'#fff', fontFamily:"'DM Sans',sans-serif", position:'relative', paddingBottom:40 },
  loadWrap: { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#060818' },
  grid: { position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(192,132,252,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(192,132,252,0.03) 1px,transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none', zIndex:0 },
  scanline: { position:'fixed', left:0, right:0, height:2, background:'rgba(192,132,252,0.08)', zIndex:1, pointerEvents:'none', animation:'scanAnim 6s linear infinite' },
  header: { position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'rgba(6,8,24,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(192,132,252,0.15)' },
  backBtn: { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit' },
  headerTitle: { fontSize:13, fontWeight:900, letterSpacing:3, color:'#c084fc', fontFamily:'Rajdhani,sans-serif' },
  content: { position:'relative', zIndex:2, maxWidth:520, margin:'0 auto', padding:'16px 16px 40px' },
 
  card: { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'18px', marginBottom:12 },
  cardTitle: { fontSize:11, letterSpacing:3, color:'#64748b', fontWeight:700, marginBottom:14, textTransform:'uppercase' },
 
  scoreRow: { display:'flex', alignItems:'center', gap:20 },
  ringWrap: { position:'relative', flexShrink:0 },
  ringInner: { position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' },
  scoreNum: { fontFamily:'Rajdhani,sans-serif', fontSize:32, fontWeight:900, lineHeight:1 },
  scoreLabel: { fontSize:9, color:'#475569', letterSpacing:2, fontWeight:700 },
  scoreRight: { flex:1 },
  verdictText: { fontFamily:'Rajdhani,sans-serif', fontSize:20, fontWeight:900, marginTop:4 },
  verdictSub: { fontSize:12, color:'#64748b', marginTop:2, lineHeight:1.4 },
  weekLabel: { fontSize:10, color:'#334155', marginTop:8 },
 
  breakdownRow: { display:'flex', alignItems:'center', gap:16 },
  donutWrap: { position:'relative', flexShrink:0 },
  donutCenter: { position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' },
  legend: { flex:1, display:'flex', flexDirection:'column', gap:10 },
  legendRow: { display:'flex', alignItems:'center', gap:10 },
  legendDot: { width:10, height:10, borderRadius:'50%', flexShrink:0 },
 
  battleRow: { display:'flex', alignItems:'center', justifyContent:'space-around' },
  battleStat: { display:'flex', flexDirection:'column', alignItems:'center', gap:4 },
  battleVs: { fontFamily:'Rajdhani,sans-serif', fontSize:18, fontWeight:900, color:'#334155', letterSpacing:4 },
 
  savingsRow: { display:'flex', gap:16 },
  savingsTrack: { height:10, background:'rgba(255,255,255,0.06)', borderRadius:100, overflow:'hidden' },
  savingsFill: { height:'100%', borderRadius:100, background:'linear-gradient(90deg,#16a34a,#22c55e)', transition:'width 1.5s ease', boxShadow:'0 0 8px rgba(34,197,94,0.4)' },
 
  tipRow: { fontSize:13, color:'#94a3b8', lineHeight:1.6, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
 
  ctaBtn: { width:'100%', background:'linear-gradient(135deg,#7c3aed,#c084fc)', border:'none', color:'#fff', padding:'16px', borderRadius:14, fontSize:16, fontWeight:900, fontFamily:'Rajdhani,sans-serif', letterSpacing:2, cursor:'pointer', boxShadow:'0 0 24px rgba(192,132,252,0.3)' },
}