import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
 
// ─────────────────────────────────────────
//  POCKETYODHA — Finance Games Hub
//  3 games: Quiz · Budget Puzzle · Memory Match
// ─────────────────────────────────────────
 
// ── QUIZ DATA ──
const QUIZ_QUESTIONS = [
  { q: "What is the '50-30-20' rule in budgeting?", options: ["50% needs, 30% wants, 20% savings", "50% savings, 30% needs, 20% wants", "50% wants, 30% savings, 20% needs", "50% food, 30% rent, 20% fun"], correct: 0, xp: 20, explanation: "The 50-30-20 rule: 50% on needs, 30% on wants, 20% on savings. A classic framework for healthy finances." },
  { q: "If you invest ₹1,000 at 10% annual interest for 3 years (compound), how much do you have?", options: ["₹1,300", "₹1,331", "₹1,310", "₹1,100"], correct: 1, xp: 30, explanation: "Compound interest: 1000 × (1.10)³ = ₹1,331. The magic of compounding makes your money grow exponentially." },
  { q: "A message says: 'URGENT: Your KYC is pending. Click here and enter OTP to avoid account blocking.' What do you do?", options: ["Click and enter OTP immediately", "Call the bank first, then decide", "Ignore — banks never ask for OTP via SMS", "Share with family to verify"], correct: 2, xp: 25, explanation: "Banks NEVER ask for OTP via SMS links. This is a classic phishing scam. Always call your bank's official number." },
  { q: "What does SIP stand for in investments?", options: ["Systematic Investment Plan", "Safe Investment Protocol", "Savings Interest Plan", "Standard Investment Policy"], correct: 0, xp: 20, explanation: "SIP = Systematic Investment Plan. You invest a fixed amount regularly in mutual funds — building wealth slowly but surely." },
  { q: "You get ₹5,000 pocket money. After spending on needs, you have ₹1,500 left. Best use?", options: ["Spend it on wants immediately", "Keep all ₹1,500 as emergency fund", "Split: ₹500 wants, ₹1,000 savings", "Invest everything in crypto"], correct: 2, xp: 25, explanation: "Smart split: enjoy some, save some. A small emergency fund + some savings is healthier than all-or-nothing." },
  { q: "What is an Emergency Fund?", options: ["Money saved for vacations", "3-6 months of expenses saved for unexpected events", "A government scheme for poor people", "Money kept in stocks for emergencies"], correct: 1, xp: 20, explanation: "An emergency fund = 3-6 months of expenses in liquid savings. Your financial shield against job loss, medical bills, or unexpected expenses." },
  { q: "You borrowed ₹2,000 from a friend. They charge 5% interest per month. After 3 months, you owe?", options: ["₹2,100", "₹2,315.25", "₹2,300", "₹2,600"], correct: 1, xp: 35, explanation: "₹2000 × (1.05)³ = ₹2,315.25. Compound interest on debt is dangerous — this is why high-interest loans trap people." },
  { q: "A UPI payment request comes from 'PAYTM-SUPPORT' asking you to RECEIVE ₹500 but enter your PIN. What is this?", options: ["Genuine Paytm support", "A cashback offer", "A 'collect money' scam — never enter PIN to receive money", "A reward from your bank"], correct: 2, xp: 30, explanation: "You NEVER enter your PIN to receive money. This is the 'collect request scam' — entering your PIN will deduct money, not add it." },
  { q: "Which habit helps build wealth most effectively over 10 years?", options: ["Spending on experiences", "Saving a fixed % every month consistently", "Winning the lottery", "Buying expensive things on EMI"], correct: 1, xp: 20, explanation: "Consistency beats intensity. Saving ₹500/month for 10 years at 12% returns = ₹1.15 lakh. Slow and steady wins." },
  { q: "What is the difference between a debit card and a credit card?", options: ["No difference — both are same", "Debit uses your money; credit is borrowed money you must repay", "Credit card is free money from bank", "Debit card has higher limits"], correct: 1, xp: 20, explanation: "Debit = your own money. Credit = borrowed money. Credit builds credit score but can trap you in debt if not repaid on time." },
]
 
// ── BUDGET PUZZLE DATA ──
const PUZZLE_SCENARIOS = [
  {
    income: 5000,
    title: "Student Budget Challenge",
    expenses: [
      { label: 'Mess / Canteen', amount: 1500, type: 'need', emoji: '🍛' },
      { label: 'Transport', amount: 400, type: 'need', emoji: '🚌' },
      { label: 'Stationery', amount: 200, type: 'need', emoji: '📚' },
      { label: 'Mobile Recharge', amount: 299, type: 'need', emoji: '📱' },
      { label: 'Swiggy (3×)', amount: 900, type: 'want', emoji: '🛵' },
      { label: 'Movie OTT', amount: 199, type: 'want', emoji: '🎬' },
      { label: 'Clothes shopping', amount: 1200, type: 'want', emoji: '👕' },
      { label: 'Coffee Café', amount: 600, type: 'want', emoji: '☕' },
    ],
    savingsTarget: 750,
  },
  {
    income: 25000,
    title: "Young Professional Budget",
    expenses: [
      { label: 'Rent (share)', amount: 7000, type: 'need', emoji: '🏠' },
      { label: 'Groceries', amount: 3000, type: 'need', emoji: '🛒' },
      { label: 'Transport/Uber', amount: 2000, type: 'need', emoji: '🚗' },
      { label: 'Electricity Bill', amount: 800, type: 'need', emoji: '💡' },
      { label: 'Zomato (weekly)', amount: 2400, type: 'want', emoji: '🛵' },
      { label: 'Netflix+Prime', amount: 600, type: 'want', emoji: '📺' },
      { label: 'Weekend outings', amount: 3000, type: 'want', emoji: '🎉' },
      { label: 'Clothes/Shopping', amount: 3500, type: 'want', emoji: '🛍️' },
    ],
    savingsTarget: 5000,
  },
]
 
// ── MEMORY CARD DATA ──
const MEMORY_PAIRS = [
  { id: 'sip', term: 'SIP', definition: 'Monthly investment plan' },
  { id: 'otp', term: 'OTP', definition: 'Never share this' },
  { id: '5030', term: '50-30-20', definition: 'Budget rule' },
  { id: 'emg', term: 'Emergency Fund', definition: '3-6 months expenses' },
  { id: 'comp', term: 'Compound Interest', definition: 'Interest on interest' },
  { id: 'nfq', term: 'Net Worth', definition: 'Assets minus liabilities' },
]
 
// ════════════════════════════════════════
//  QUIZ GAME
// ════════════════════════════════════════
function QuizGame({ onFinish, addXP }) {
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  const [showExplain, setShowExplain] = useState(false)
  const [done, setDone] = useState(false)
  const [timeLeft, setTimeLeft] = useState(20)
  const [timerActive, setTimerActive] = useState(true)
 
  const q = QUIZ_QUESTIONS[qIdx]
 
  useEffect(() => {
    if (!timerActive || selected !== null) return
    if (timeLeft <= 0) { handleAnswer(-1); return }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, timerActive, selected])
 
  const handleAnswer = (idx) => {
    setTimerActive(false)
    setSelected(idx)
    setShowExplain(true)
    if (idx === q.correct) {
      setScore(s => s + 1)
      setTotalXP(x => x + q.xp)
      addXP(q.xp)
    }
  }
 
  const handleNext = () => {
    if (qIdx < QUIZ_QUESTIONS.length - 1) {
      setQIdx(i => i + 1)
      setSelected(null)
      setShowExplain(false)
      setTimeLeft(20)
      setTimerActive(true)
    } else {
      setDone(true)
    }
  }
 
  if (done) {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100)
    return (
      <div style={{ textAlign: 'center', padding: '32px 20px', animation: 'fade-up 0.4s ease' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>{pct >= 80 ? '🏆' : pct >= 50 ? '⚔️' : '💀'}</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: pct >= 80 ? '#fbbf24' : pct >= 50 ? '#4d9fff' : '#ef4444', marginBottom: 8 }}>
          {pct >= 80 ? 'FINANCE MASTER!' : pct >= 50 ? 'GOOD HUNTER' : 'KEEP TRAINING'}
        </div>
        <div style={{ fontSize: 14, color: '#8aa0c8', marginBottom: 24 }}>{score} / {QUIZ_QUESTIONS.length} correct · +{totalXP} XP earned</div>
        <button onClick={() => onFinish(score, totalXP)} style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '13px 36px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 1.5, cursor: 'pointer', clipPath: 'polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)' }}>
          Back to Games
        </button>
      </div>
    )
  }
 
  const timerColor = timeLeft > 10 ? '#22c55e' : timeLeft > 5 ? '#fbbf24' : '#ef4444'
 
  return (
    <div style={{ padding: '0 0 20px', animation: 'fade-up 0.3s ease' }}>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 12 }}>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', color: '#3d5270', fontWeight: 600, letterSpacing: 1 }}>Q {qIdx + 1} / {QUIZ_QUESTIONS.length}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', color: timerColor, fontWeight: 500 }}>⏱ {timeLeft}s</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#fbbf24' }}>+{q.xp} XP</span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: '100%', width: `${((qIdx) / QUIZ_QUESTIONS.length) * 100}%`, background: 'linear-gradient(90deg,#2563eb,#4d9fff)', transition: 'width 0.4s ease' }} />
      </div>
 
      {/* Question */}
      <div style={{ background: 'rgba(9,15,30,0.9)', border: '1px solid rgba(77,159,255,0.15)', padding: '18px', marginBottom: 16, fontSize: 15, lineHeight: 1.6 }}>
        {q.q}
      </div>
 
      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options.map((opt, i) => {
          let bg = 'rgba(15,24,48,0.7)', border = 'rgba(77,159,255,0.1)', color = '#8aa0c8'
          if (selected !== null) {
            if (i === q.correct) { bg = 'rgba(34,197,94,0.1)'; border = 'rgba(34,197,94,0.4)'; color = '#22c55e' }
            else if (i === selected) { bg = 'rgba(239,68,68,0.1)'; border = 'rgba(239,68,68,0.3)'; color = '#ef4444' }
          }
          return (
            <button key={i} onClick={() => selected === null && handleAnswer(i)} style={{ background: bg, border: `1px solid ${border}`, color, padding: '13px 16px', cursor: selected === null ? 'pointer' : 'default', textAlign: 'left', fontSize: 14, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, minWidth: 18, marginTop: 2 }}>{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          )
        })}
      </div>
 
      {/* Explanation */}
      {showExplain && (
        <div style={{ marginTop: 14, background: selected === q.correct ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)', border: `1px solid ${selected === q.correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, padding: '12px 16px', fontSize: 13, color: '#8aa0c8', borderLeft: `3px solid ${selected === q.correct ? '#22c55e' : '#ef4444'}`, animation: 'fade-up 0.3s ease' }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: selected === q.correct ? '#22c55e' : '#ef4444', marginBottom: 4, fontSize: 12, letterSpacing: 1 }}>
            {selected === q.correct ? '✓ CORRECT' : '✗ WRONG'}
          </div>
          {q.explanation}
        </div>
      )}
 
      {showExplain && (
        <button onClick={handleNext} style={{ width: '100%', marginTop: 14, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1.5, cursor: 'pointer', clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)' }}>
          {qIdx < QUIZ_QUESTIONS.length - 1 ? 'Next Question →' : 'See Results →'}
        </button>
      )}
    </div>
  )
}
 
// ════════════════════════════════════════
//  BUDGET PUZZLE
// ════════════════════════════════════════
function BudgetPuzzle({ onFinish, addXP }) {
  const [scenIdx] = useState(0)
  const [selected, setSelected] = useState(new Set())
  const [submitted, setSubmitted] = useState(false)
 
  const scenario = PUZZLE_SCENARIOS[scenIdx]
  const totalSelected = scenario.expenses.filter((_, i) => selected.has(i)).reduce((s, e) => s + e.amount, 0)
  const totalAll = scenario.expenses.reduce((s, e) => s + e.amount, 0)
  const savings = scenario.income - totalSelected
  const goalMet = savings >= scenario.savingsTarget
 
  const toggleExp = (i) => {
    if (submitted) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }
 
  const handleSubmit = () => {
    setSubmitted(true)
    if (goalMet) addXP(100)
  }
 
  return (
    <div style={{ padding: '0 0 20px', animation: 'fade-up 0.3s ease' }}>
      <div style={{ background: 'rgba(9,15,30,0.9)', border: '1px solid rgba(251,191,36,0.2)', padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#fbbf24', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: 6 }}>The Challenge</div>
        <div style={{ fontSize: 14, marginBottom: 8 }}>{scenario.title} — Income: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#22c55e' }}>₹{scenario.income.toLocaleString('en-IN')}</span></div>
        <div style={{ fontSize: 13, color: '#8aa0c8' }}>Select expenses to cut so you can save <span style={{ color: '#fbbf24' }}>₹{scenario.savingsTarget.toLocaleString('en-IN')}</span> this month.</div>
      </div>
 
      {/* Live calc */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[
          { label: 'Spending', val: `₹${totalSelected.toLocaleString('en-IN')}`, color: '#ef4444' },
          { label: 'Savings', val: `₹${savings.toLocaleString('en-IN')}`, color: savings >= scenario.savingsTarget ? '#22c55e' : '#f97316' },
          { label: 'Target', val: `₹${scenario.savingsTarget.toLocaleString('en-IN')}`, color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: 'rgba(9,15,30,0.8)', border: '1px solid rgba(77,159,255,0.08)', padding: '8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: '#3d5270', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
 
      {/* Expense list */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: '#3d5270', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, marginBottom: 10 }}>
          Tap to include / exclude expenses
        </div>
        {scenario.expenses.map((exp, i) => {
          const isSelected = selected.has(i)
          const typeColor = exp.type === 'need' ? '#22c55e' : '#f97316'
          return (
            <button
              key={i}
              onClick={() => toggleExp(i)}
              style={{ width: '100%', background: isSelected ? `rgba(${exp.type === 'need' ? '34,197,94' : '249,115,22'},0.08)` : 'rgba(9,15,30,0.5)', border: `1px solid ${isSelected ? typeColor : 'rgba(77,159,255,0.06)'}`, padding: '11px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, transition: 'all 0.15s', opacity: submitted && !isSelected ? 0.5 : 1 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: isSelected ? typeColor : 'rgba(255,255,255,0.05)', border: `1px solid ${typeColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>
                  {isSelected ? '✓' : ''}
                </div>
                <span style={{ fontSize: 14 }}>{exp.emoji}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 14, color: isSelected ? '#dce8ff' : '#8aa0c8' }}>{exp.label}</div>
                  <div style={{ fontSize: 10, color: typeColor, letterSpacing: 0.5 }}>{exp.type}</div>
                </div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: isSelected ? typeColor : '#3d5270' }}>₹{exp.amount}</div>
            </button>
          )
        })}
      </div>
 
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0}
          style={{ width: '100%', background: goalMet ? 'linear-gradient(135deg,#15803d,#22c55e)' : 'linear-gradient(135deg,#dc2626,#ef4444)', border: 'none', color: '#fff', padding: '13px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1.5, cursor: 'pointer', clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)' }}
        >
          Lock In Budget → {goalMet ? `✓ SAVES ₹${savings.toLocaleString('en-IN')}` : `⚠ Short by ₹${Math.abs(savings - scenario.savingsTarget).toLocaleString('en-IN')}`}
        </button>
      ) : (
        <div style={{ animation: 'fade-up 0.4s ease' }}>
          <div style={{ background: goalMet ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${goalMet ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, padding: '16px', marginBottom: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{goalMet ? '🏆' : '💀'}</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: goalMet ? '#22c55e' : '#ef4444' }}>
              {goalMet ? 'Budget Mastered!' : 'Over Budget!'}
            </div>
            <div style={{ fontSize: 13, color: '#8aa0c8', marginTop: 6 }}>
              {goalMet ? `You saved ₹${savings.toLocaleString('en-IN')} — +100 XP earned!` : `You need to cut ₹${Math.abs(savings - scenario.savingsTarget).toLocaleString('en-IN')} more from wants.`}
            </div>
          </div>
          <button onClick={() => onFinish(goalMet ? 1 : 0, goalMet ? 100 : 0)} style={{ width: '100%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1.5, cursor: 'pointer', clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)' }}>
            Back to Games
          </button>
        </div>
      )}
    </div>
  )
}
 
// ════════════════════════════════════════
//  MEMORY MATCH
// ════════════════════════════════════════
function MemoryMatch({ onFinish, addXP }) {
  const allCards = [
    ...MEMORY_PAIRS.map((p, i) => ({ id: `t${i}`, pairId: p.id, text: p.term, isTerm: true })),
    ...MEMORY_PAIRS.map((p, i) => ({ id: `d${i}`, pairId: p.id, text: p.definition, isTerm: false })),
  ].sort(() => Math.random() - 0.5)
 
  const [cards] = useState(allCards)
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState(new Set())
  const [moves, setMoves] = useState(0)
  const [done, setDone] = useState(false)
 
  const handleFlip = useCallback((card) => {
    if (flipped.length === 2 || flipped.find(c => c.id === card.id) || matched.has(card.pairId)) return
    const newFlipped = [...flipped, card]
    setFlipped(newFlipped)
 
    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      if (newFlipped[0].pairId === newFlipped[1].pairId) {
        const newMatched = new Set([...matched, newFlipped[0].pairId])
        setMatched(newMatched)
        setFlipped([])
        addXP(15)
        if (newMatched.size === MEMORY_PAIRS.length) {
          setTimeout(() => setDone(true), 600)
        }
      } else {
        setTimeout(() => setFlipped([]), 1000)
      }
    }
  }, [flipped, matched])
 
  if (done) {
    const xpEarned = matched.size * 15
    return (
      <div style={{ textAlign: 'center', padding: '32px 20px', animation: 'fade-up 0.4s ease' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🧠</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#4d9fff', marginBottom: 8 }}>Memory Master!</div>
        <div style={{ fontSize: 14, color: '#8aa0c8', marginBottom: 24 }}>{moves} moves · +{xpEarned} XP earned</div>
        <button onClick={() => onFinish(matched.size, xpEarned)} style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '13px 36px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1.5, cursor: 'pointer', clipPath: 'polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)' }}>
          Back to Games
        </button>
      </div>
    )
  }
 
  return (
    <div style={{ padding: '0 0 20px', animation: 'fade-up 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 12 }}>
        <span style={{ color: '#3d5270', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: 1 }}>MATCH TERMS TO DEFINITIONS</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#8aa0c8' }}>{matched.size}/{MEMORY_PAIRS.length} · {moves} moves</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {cards.map(card => {
          const isFlipped = !!flipped.find(c => c.id === card.id)
          const isMatched = matched.has(card.pairId)
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card)}
              style={{ height: 70, background: isMatched ? 'rgba(34,197,94,0.12)' : isFlipped ? 'rgba(77,159,255,0.12)' : 'rgba(15,24,48,0.8)', border: `1px solid ${isMatched ? 'rgba(34,197,94,0.4)' : isFlipped ? 'rgba(77,159,255,0.4)' : 'rgba(77,159,255,0.1)'}`, cursor: isMatched ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', transition: 'all 0.2s', transform: isFlipped || isMatched ? 'scale(1.02)' : 'scale(1)' }}
            >
              {isFlipped || isMatched ? (
                <div style={{ fontSize: 11, textAlign: 'center', lineHeight: 1.35, color: isMatched ? '#22c55e' : '#4d9fff', fontFamily: card.isTerm ? 'Rajdhani, sans-serif' : 'DM Sans, sans-serif', fontWeight: card.isTerm ? 700 : 400 }}>{card.text}</div>
              ) : (
                <div style={{ fontSize: 22, color: '#3d5270' }}>?</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
 
// ════════════════════════════════════════
//  GAMES HUB
// ════════════════════════════════════════
export default function Games() {
  const navigate = useNavigate()
  const { user, addXP } = useUserStore()
  const [activeGame, setActiveGame] = useState(null) // null | 'quiz' | 'puzzle' | 'memory'
  const [scores, setScores] = useState({ quiz: null, puzzle: null, memory: null })
 
  if (!user) { navigate('/register'); return null }
 
  const handleFinish = (game, score, xp) => {
    setScores(s => ({ ...s, [game]: score }))
    setActiveGame(null)
  }
 
  const GAMES = [
    { id: 'quiz', title: 'Finance Quiz', emoji: '🧠', desc: '10 questions · Money basics · Scam detection · Investments', xp: '200+ XP', accent: '#4d9fff', badge: scores.quiz !== null ? `${scores.quiz}/10` : 'PLAY' },
    { id: 'puzzle', title: 'Budget Puzzle', emoji: '🧩', desc: 'Allocate income wisely · Cut waste · Hit savings target', xp: '100 XP', accent: '#22c55e', badge: scores.puzzle !== null ? 'Done' : 'PLAY' },
    { id: 'memory', title: 'Money Memory', emoji: '🃏', desc: 'Match finance terms to definitions · Build vocabulary', xp: '90+ XP', accent: '#a855f7', badge: scores.memory !== null ? 'Done' : 'PLAY' },
  ]
 
  return (
    <div style={{ minHeight: '100vh', background: '#03050d', color: '#dce8ff', fontFamily: 'DM Sans, sans-serif', paddingBottom: 90 }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(77,159,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(77,159,255,0.02) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />
      <div style={{ position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)', width: 500, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.08),transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
 
      {/* Top bar */}
      <div style={{ background: 'rgba(9,15,30,0.95)', borderBottom: '1px solid rgba(77,159,255,0.08)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(16px)' }}>
        <button onClick={() => activeGame ? setActiveGame(null) : navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#8aa0c8', cursor: 'pointer', fontSize: 20 }}>←</button>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: 3 }}>🎮 FINANCE GAMES</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#fbbf24' }}>{user.xp} XP</div>
      </div>
 
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 14px', position: 'relative', zIndex: 1 }}>
 
        {!activeGame ? (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24, paddingTop: 8 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🎮</div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 22, letterSpacing: 2, marginBottom: 6 }}>Game Dojo</div>
              <div style={{ fontSize: 13, color: '#8aa0c8' }}>Learn finance through play · Earn XP · Level up</div>
            </div>
 
            {/* Game cards */}
            {GAMES.map(game => (
              <div
                key={game.id}
                onClick={() => setActiveGame(game.id)}
                style={{ background: 'rgba(9,15,30,0.85)', border: `1px solid rgba(${hexToRgb(game.accent)},0.2)`, padding: '20px', marginBottom: 10, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 8px 32px rgba(${hexToRgb(game.accent)},0.12)`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 52, height: 52, background: `rgba(${hexToRgb(game.accent)},0.12)`, border: `1px solid rgba(${hexToRgb(game.accent)},0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                      {game.emoji}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 17, color: '#dce8ff', marginBottom: 4 }}>{game.title}</div>
                      <div style={{ fontSize: 12, color: '#3d5270', lineHeight: 1.5 }}>{game.desc}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                    <div style={{ fontSize: 11, background: `rgba(${hexToRgb(game.accent)},0.15)`, border: `1px solid rgba(${hexToRgb(game.accent)},0.3)`, color: game.accent, padding: '3px 10px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{game.badge}</div>
                    <div style={{ fontSize: 11, color: '#fbbf24', fontFamily: 'JetBrains Mono, monospace' }}>{game.xp}</div>
                  </div>
                </div>
              </div>
            ))}
 
            {/* Leaderboard teaser */}
            <div style={{ background: 'rgba(9,15,30,0.6)', border: '1px solid rgba(77,159,255,0.08)', padding: '14px 16px', marginTop: 8 }}>
              <div style={{ fontSize: 10, color: '#3d5270', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, marginBottom: 10 }}>Your Game Stats</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { l: 'Quiz Best', v: scores.quiz !== null ? `${scores.quiz}/10` : '—', c: '#4d9fff' },
                  { l: 'Puzzles', v: scores.puzzle !== null ? '✓' : '0', c: '#22c55e' },
                  { l: 'Quiz XP', v: `${user.quizScore || 0}`, c: '#fbbf24' },
                ].map(s => (
                  <div key={s.l} style={{ flex: 1, background: 'rgba(15,24,48,0.6)', border: '1px solid rgba(77,159,255,0.06)', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 9, color: '#3d5270', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ animation: 'fade-up 0.3s ease' }}>
            <div style={{ fontSize: 10, color: '#3d5270', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setActiveGame(null)} style={{ background: 'none', border: 'none', color: '#3d5270', cursor: 'pointer', fontSize: 16, padding: 0 }}>←</button>
              {GAMES.find(g => g.id === activeGame)?.title}
            </div>
            {activeGame === 'quiz' && <QuizGame onFinish={(s, x) => handleFinish('quiz', s, x)} addXP={addXP} />}
            {activeGame === 'puzzle' && <BudgetPuzzle onFinish={(s, x) => handleFinish('puzzle', s, x)} addXP={addXP} />}
            {activeGame === 'memory' && <MemoryMatch onFinish={(s, x) => handleFinish('memory', s, x)} addXP={addXP} />}
          </div>
        )}
      </div>
 
      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(3,5,13,0.97)', borderTop: '1px solid rgba(77,159,255,0.08)', display: 'flex', backdropFilter: 'blur(16px)', zIndex: 50 }}>
        {[
          { emoji: '🏠', label: 'Home', to: '/dashboard' },
          { emoji: '⚔️', label: 'Battle', to: '/battle' },
          { emoji: '💰', label: 'Log', to: '/expenses' },
          { emoji: '🎮', label: 'Games', to: '/games', active: true },
          { emoji: '👤', label: 'Profile', to: '/profile' },
        ].map(b => (
          <button key={b.to} onClick={() => navigate(b.to)} style={{ flex: 1, background: 'none', border: 'none', borderTop: b.active ? '2px solid #a855f7' : '2px solid transparent', padding: '12px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: b.active ? '#a855f7' : '#3d5270' }}>
            <span style={{ fontSize: 20 }}>{b.emoji}</span>
            <span style={{ fontSize: 9, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{b.label}</span>
          </button>
        ))}
      </div>
 
      <style>{`@keyframes fade-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
 
function hexToRgb(hex) {
  if (!hex?.startsWith('#')) return '77,159,255'
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`
}