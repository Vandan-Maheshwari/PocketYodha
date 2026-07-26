import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useGameFX, GameFXStyles } from '../components/GameFX'
import { getFireMessage } from '../store/gameEngine'
import api from '../api'

// ─── SCAM SCENARIOS ───────────────────────────────────────────────────────────
// Each scenario shows a realistic message/notification mockup and asks the
// player to identify whether it's a scam. `correct` marks which choice is
// right; picking correctly blocks the scam (XP + combo), picking wrong
// costs a life and shows the giveaway signs.
const SCENARIOS = [
  {
    id: 'upi_collect',
    category: 'UPI Collect Request',
    channel: 'UPI App Notification',
    from: 'PhonePe',
    body: '₹1 Collect Request\nRaj Kumar has requested ₹1 from you.\nApprove to claim your ₹50,000 cashback reward!',
    time: '2 min ago',
    choices: [
      { text: 'Approve — I want the cashback', correct: false },
      { text: 'Decline & report as spam', correct: true },
    ],
    explain: 'Collect requests only ever take money FROM you — they never give you money. "Approve to receive a reward" is always a lie. Cashback and prizes are never claimed by approving a UPI collect request.',
    demon: 'UPI Collect Scam',
  },
  {
    id: 'phishing_bank',
    category: 'Phishing Email',
    channel: 'Email',
    from: 'security@hdfc-bank-alerts.com',
    body: 'URGENT: Your account will be suspended in 24 hours due to unusual activity. Click here to verify your identity and secure your account immediately.',
    time: '14:32',
    choices: [
      { text: 'Click the link and verify', correct: false },
      { text: "Don't click — check the sender domain", correct: true },
    ],
    explain: 'Real banks never email from lookalike domains like "hdfc-bank-alerts.com" (not the bank\'s actual domain) and never ask you to "verify" via an emailed link under time pressure. Go to the bank\'s app or official site directly instead.',
    demon: 'Phishing Phantom',
  },
  {
    id: 'fake_lottery',
    category: 'SMS / WhatsApp',
    channel: 'WhatsApp Message',
    from: '+91 98XXX-XXXXX',
    body: 'CONGRATULATIONS! 🎉 Your number has WON ₹25,00,000 in the KBC Lucky Draw 2026! To claim, pay a processing fee of ₹4,999 to the UPI ID below.',
    time: '09:15',
    choices: [
      { text: 'Pay the fee to claim the prize', correct: false },
      { text: 'Block the number — this is a scam', correct: true },
    ],
    explain: "You can't win a lottery you never entered. No legitimate prize, ever, asks you to pay money first to \"unlock\" a bigger prize — that's the entire scam.",
    demon: 'Lottery Wraith',
  },
  {
    id: 'otp_scam',
    category: 'Phone Call',
    channel: 'Incoming Call',
    from: 'Unknown — claims to be "Bank Customer Care"',
    body: '"Sir/Ma\'am, we\'ve detected suspicious activity on your card. To block it immediately, please read out the OTP that was just sent to your phone."',
    time: 'Live call',
    choices: [
      { text: 'Read out the OTP to block the card', correct: false },
      { text: 'Hang up — banks never ask for OTPs', correct: true },
    ],
    explain: 'An OTP authorizes a transaction — it does NOT block a card. No bank employee will ever ask you to read one aloud. Reading it out is how the scammer actually completes their fraudulent transaction.',
    demon: 'OTP Extractor',
  },
  {
    id: 'crypto_invest',
    category: 'Social Media DM',
    channel: 'Instagram DM',
    from: '@wealth_guru_official',
    body: "I turned ₹10,000 into ₹4,00,000 in 3 weeks using this crypto strategy. Guaranteed 40% weekly returns. Limited spots in my private trading group — DM 'START' now!",
    time: '3h ago',
    choices: [
      { text: "DM 'START' to join the group", correct: false },
      { text: 'Ignore & report the account', correct: true },
    ],
    explain: 'SEBI-registered advisors can never promise fixed or guaranteed returns — it\'s illegal for them to do so. "Guaranteed 40% weekly" is a mathematical impossibility that only exists in Ponzi schemes.',
    demon: 'Crypto Charlatan',
  },
  {
    id: 'fake_kyc',
    category: 'SMS',
    channel: 'SMS',
    from: 'VK-KYCUPD',
    body: 'Dear Customer, your KYC has expired. Your account will be BLOCKED within 2 hours. Update now: bit.ly/kyc-update-2026',
    time: 'Just now',
    choices: [
      { text: 'Tap the link and update KYC', correct: false },
      { text: 'Ignore — verify directly via the bank app', correct: true },
    ],
    explain: 'Shortened links (bit.ly) hiding the real destination, artificial urgency ("2 hours"), and a generic sender ID are the three classic ingredients of an SMS phishing (smishing) attack. Always go to your bank\'s app directly for KYC updates.',
    demon: 'KYC Shade',
  },
  {
    id: 'fake_refund',
    category: 'Delivery App Notification',
    channel: 'SMS',
    from: 'Amazon Delivery Executive',
    body: 'Your order #4471 delivery failed. A refund of ₹2,499 has been initiated. To receive it faster, click here and enter your UPI PIN.',
    time: '11:47',
    choices: [
      { text: 'Enter UPI PIN to get the refund faster', correct: false },
      { text: 'Never enter a PIN to "receive" money', correct: true },
    ],
    explain: 'A UPI PIN is only ever needed to SEND money, never to receive it. Any message asking you to enter your PIN to "get" a refund, cashback, or prize is trying to trick you into authorizing a payment out of your account.',
    demon: 'Refund Trickster',
  },
]

const LIVES_START = 3
const ROUND_SECONDS = 20

export default function ScamTrial() {
  const navigate         = useNavigate()
  const user              = useUserStore((s) => s.user)
  const addXP             = useUserStore((s) => s.addXP)
  const takeDamage        = useUserStore((s) => s.takeDamage)
  const recordScamBlocked = useUserStore((s) => s.recordScamBlocked)
  const { triggerXP, triggerDamage, triggerConfetti, triggerFlash, triggerFireMessage, FXLayer } = useGameFX()

  const [phase,     setPhase]     = useState('intro')      // intro | round | roundResult | gameOver
  const [order,     setOrder]     = useState([])            // shuffled scenario order
  const [roundIdx,  setRoundIdx]  = useState(0)
  const [lives,     setLives]     = useState(LIVES_START)
  const [combo,     setCombo]     = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [score,     setScore]     = useState(0)             // total XP earned this run
  const [timeLeft,  setTimeLeft]  = useState(ROUND_SECONDS)
  const [lastChoice,setLastChoice]= useState(null)
  const [shake,     setShake]     = useState(false)

  const timerRef = useRef(null)

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

  const startRun = useCallback(() => {
    setOrder(shuffle(SCENARIOS))
    setRoundIdx(0)
    setLives(LIVES_START)
    setCombo(0)
    setBestCombo(0)
    setScore(0)
    setPhase('round')
  }, [])

  const currentScenario = order[roundIdx]

  const handleChoice = useCallback((choice) => {
    clearInterval(timerRef.current)
    if (!currentScenario) return

    const correct = choice ? choice.correct : false
    const xpGain = correct ? 40 + combo * 10 : 0

    if (correct) {
      const newCombo = combo + 1
      setCombo(newCombo)
      setBestCombo((b) => Math.max(b, newCombo))
      setScore((sc) => sc + xpGain)
      addXP(xpGain)
      recordScamBlocked()
      triggerXP(xpGain, '#22c55e')
      if (newCombo >= 3) {
        triggerFireMessage(getFireMessage?.() || `🔥 ${newCombo}x combo!`)
      }
      triggerFlash('rgba(34,197,94,0.15)')
      if (newCombo === SCENARIOS.length) triggerConfetti()
    } else {
      setCombo(0)
      setLives((l) => l - 1)
      takeDamage(15)
      triggerDamage('−15 HP', '#ef4444')
      triggerFlash('rgba(239,68,68,0.25)')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }

    setLastChoice({ choice, correct, xpGain, timedOut: choice === null })
    setPhase('roundResult')
  }, [currentScenario, combo, addXP, takeDamage, recordScamBlocked, triggerXP, triggerDamage, triggerFlash, triggerFireMessage, triggerConfetti])

  // countdown per round
  useEffect(() => {
    if (phase !== 'round') return
    setTimeLeft(ROUND_SECONDS)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleChoice(null) // timeout counts as an incorrect response
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundIdx])

  const nextRound = useCallback(async () => {
    const outOfLives = lives <= 0
    const finished = roundIdx + 1 >= order.length

    if (outOfLives || finished) {
      // Log the run as a "battle" so it surfaces in the weekly review's
      // win/loss stats alongside Decision Battles, instead of a parallel
      // untracked stat.
      if (user?.id && user?.authToken) {
        await api.logBattle(
          user.id,
          outOfLives ? 'lose' : 'win',
          'Scam Trial',
          score,
          0,
          user.authToken
        )
      }
      setPhase('gameOver')
      return
    }
    setRoundIdx((i) => i + 1)
    setPhase('round')
  }, [lives, roundIdx, order.length, user, score])

  if (phase === 'intro') {
    return (
      <div style={s.root}>
        <GameFXStyles /><FXLayer />
        <div style={s.introWrap}>
          <div style={s.warningBanner}>🛡️ SCAM DETECTION TRIAL</div>
          <div style={s.introEmoji}>🕵️</div>
          <div style={s.introTitle}>Can You Spot the Scam?</div>
          <div style={s.introDesc}>
            {SCENARIOS.length} real-world fraud scenarios — UPI scams, phishing, fake lottery,
            OTP theft, crypto fraud, KYC scams &amp; fake refunds. You have {LIVES_START} lives
            and {ROUND_SECONDS}s per message. Chain correct answers for a growing XP combo.
          </div>
          <button style={s.startBtn} onClick={startRun}>🎯 START TRIAL</button>
          <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Retreat</button>
        </div>
        <style>{scamTrialCss}</style>
      </div>
    )
  }

  if (phase === 'gameOver') {
    const won = lives > 0
    return (
      <div style={s.root}>
        <GameFXStyles /><FXLayer />
        <div style={s.resultWrap}>
          <div style={{ fontSize: 72 }}>{won ? '🏆' : '💀'}</div>
          <div style={{ ...s.resultTitle, color: won ? '#22c55e' : '#ef4444' }}>
            {won ? 'TRIAL COMPLETE!' : 'OUT OF LIVES'}
          </div>
          <div style={s.resultCard}>
            <div style={s.resultRow}><span>Best Combo</span><span style={{ color: '#fbbf24', fontWeight: 900 }}>{bestCombo}x</span></div>
            <div style={s.resultRow}><span>XP Earned</span><span style={{ color: '#c084fc', fontWeight: 900 }}>+{score} XP</span></div>
            <div style={s.resultRow}><span>Lives Left</span><span style={{ fontWeight: 900 }}>{'❤️'.repeat(Math.max(0, lives))}{'🖤'.repeat(LIVES_START - Math.max(0, lives))}</span></div>
          </div>
          <div style={s.resultBtns}>
            <button style={s.startBtn} onClick={startRun}>🔄 Try Again</button>
            <button style={s.backBtn} onClick={() => navigate('/dashboard')}>🏠 Return to HQ</button>
          </div>
        </div>
        <style>{scamTrialCss}</style>
      </div>
    )
  }

  if (!currentScenario) return <div style={s.root} />

  const timerPct = (timeLeft / ROUND_SECONDS) * 100
  const timerColor = timerPct > 50 ? '#22c55e' : timerPct > 25 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ ...s.root, ...(shake ? { animation: 'sctShake 0.5s ease' } : {}) }}>
      <GameFXStyles /><FXLayer />

      <div style={s.hud}>
        <div style={s.hudBlock}>
          <span style={s.hudLabel}>LIVES</span>
          <span style={{ fontSize: 18 }}>{'❤️'.repeat(Math.max(0, lives))}{'🖤'.repeat(LIVES_START - Math.max(0, lives))}</span>
        </div>
        <div style={{ ...s.timerCircle, borderColor: timerColor, boxShadow: `0 0 16px ${timerColor}40` }}>
          <span style={{ color: timerColor, fontWeight: 900, fontSize: 20 }}>{timeLeft}</span>
        </div>
        <div style={s.hudBlock}>
          <span style={s.hudLabel}>COMBO</span>
          <span style={{ color: '#fbbf24', fontWeight: 900, fontSize: 18 }}>{combo}x</span>
        </div>
      </div>
      <div style={s.progressLabel}>Message {roundIdx + 1} of {order.length} &middot; {currentScenario.category}</div>

      {phase === 'round' && (
        <div style={s.roundWrap}>
          <div style={s.messageCard}>
            <div style={s.messageHeader}>
              <span style={s.channelTag}>{currentScenario.channel}</span>
              <span style={s.timeTag}>{currentScenario.time}</span>
            </div>
            <div style={s.fromLine}>From: <b>{currentScenario.from}</b></div>
            <div style={s.messageBody}>{currentScenario.body}</div>
          </div>
          <div style={s.question}>Is this legitimate, or a scam?</div>
          <div style={s.choicesWrap}>
            {currentScenario.choices.map((c, i) => (
              <button key={i} style={s.choiceBtn} onClick={() => handleChoice(c)}>
                {c.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'roundResult' && lastChoice && (
        <div style={s.roundWrap}>
          <div style={{ fontSize: 56, textAlign: 'center' }}>{lastChoice.correct ? '✅' : '❌'}</div>
          <div style={{ ...s.resultTitle, fontSize: 22, color: lastChoice.correct ? '#22c55e' : '#ef4444', textAlign: 'center' }}>
            {lastChoice.timedOut ? "TIME'S UP" : lastChoice.correct ? 'SCAM BLOCKED!' : 'GOT SCAMMED'}
          </div>
          {lastChoice.correct && <div style={{ textAlign: 'center', color: '#c084fc', fontWeight: 800, marginBottom: 4 }}>+{lastChoice.xpGain} XP</div>}
          <div style={s.explainBox}>
            <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, marginBottom: 6, letterSpacing: 2 }}>💡 WHY</div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{currentScenario.explain}</div>
          </div>
          <button style={s.startBtn} onClick={nextRound}>
            {lives <= 0 || roundIdx + 1 >= order.length ? 'See Results →' : 'Next Message →'}
          </button>
        </div>
      )}

      <style>{scamTrialCss}</style>
    </div>
  )
}

const scamTrialCss = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=DM+Sans:wght@400;600;700&display=swap');
  @keyframes sctShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-10px)} 75%{transform:translateX(10px)} }
  @keyframes sctFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
`

const s = {
  root: { minHeight: '100vh', background: '#060818', color: '#fff', fontFamily: "'DM Sans',sans-serif", position: 'relative', overflowX: 'hidden' },

  introWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px 20px', textAlign: 'center' },
  warningBanner: { letterSpacing: 4, fontSize: 12, fontWeight: 900, color: '#22c55e', marginBottom: 24, border: '1px solid rgba(34,197,94,0.3)', padding: '6px 20px', borderRadius: 20, background: 'rgba(34,197,94,0.08)' },
  introEmoji: { fontSize: 90, marginBottom: 16 },
  introTitle: { fontFamily: 'Rajdhani,sans-serif', fontSize: 28, fontWeight: 900, marginBottom: 12, letterSpacing: 1 },
  introDesc: { color: '#94a3b8', fontSize: 14, lineHeight: 1.7, marginBottom: 28, maxWidth: 420 },
  startBtn: { background: 'linear-gradient(135deg,#16a34a,#22c55e)', border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 14, fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1, marginBottom: 12, boxShadow: '0 0 30px rgba(34,197,94,0.3)' },
  backBtn: { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', fontFamily: 'inherit' },

  hud: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 520, margin: '16px auto 4px', padding: '10px 20px' },
  hudBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  hudLabel: { fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: 1 },
  timerCircle: { width: 54, height: 54, borderRadius: '50%', border: '3px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' },
  progressLabel: { textAlign: 'center', color: '#475569', fontSize: 12, marginBottom: 16 },

  roundWrap: { maxWidth: 480, margin: '0 auto', padding: '0 16px 40px', animation: 'sctFadeUp 0.3s ease' },
  messageCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, marginBottom: 20 },
  messageHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  channelTag: { fontSize: 11, fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '3px 10px', borderRadius: 20 },
  timeTag: { fontSize: 11, color: '#475569' },
  fromLine: { fontSize: 13, color: '#94a3b8', marginBottom: 10 },
  messageBody: { fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, whiteSpace: 'pre-line', background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 14 },
  question: { textAlign: 'center', fontWeight: 800, fontSize: 15, marginBottom: 14 },
  choicesWrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  choiceBtn: { padding: '15px 18px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' },

  resultWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px 20px', gap: 12 },
  resultTitle: { fontFamily: 'Rajdhani,sans-serif', fontSize: 30, fontWeight: 900, letterSpacing: 1 },
  resultCard: { width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 20px' },
  resultRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 },
  resultBtns: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  explainBox: { width: '100%', maxWidth: 400, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: '14px 16px', textAlign: 'left', margin: '0 auto 20px' },
}