import { useState, useEffect, useCallback, useRef } from 'react'

// ═══════════════════════════════════════════════════════
//  POCKETYODHA — GAME FX ENGINE
//  All visual effects in one place
//  Import and use anywhere
// ═══════════════════════════════════════════════════════

// ── XP POPUP ── (flies up from action point)
export function XPPopup({ amount, label, color, x, y, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed',
      left: x || '50%',
      top: y || '40%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      pointerEvents: 'none',
      animation: 'xp-fly-up 1.4s cubic-bezier(0.22,1,0.36,1) forwards',
      fontFamily: 'Cinzel, serif',
      fontWeight: 900,
      fontSize: 28,
      color: color || '#4d9fff',
      textShadow: `0 0 20px ${color || '#4d9fff'}, 0 0 40px ${color || '#4d9fff'}80`,
      whiteSpace: 'nowrap',
      letterSpacing: 2,
    }}>
      {label || `+${amount} XP`}
    </div>
  )
}

// ── CONFETTI BURST ──
export function ConfettiBurst({ active, onDone }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#4d9fff', '#a855f7', '#fbbf24', '#22c55e', '#ef4444', '#f97316', '#ec4899']
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      opacity: 1,
    }))

    let frame = 0
    let raf
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.12 // gravity
        p.rotation += p.rotSpeed
        p.opacity = Math.max(0, 1 - frame / 80)
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      })
      if (frame < 90) raf = requestAnimationFrame(animate)
      else { ctx.clearRect(0, 0, canvas.width, canvas.height); onDone?.() }
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [active])

  if (!active) return null
  return (
    <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }} />
  )
}

// ── LEVEL UP SCREEN ── (full screen dramatic reveal)
export function LevelUpScreen({ level, title, rankColor, onDone }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100)
    const t2 = setTimeout(() => setPhase(2), 600)
    const t3 = setTimeout(() => setPhase(3), 1200)
    const t4 = setTimeout(() => onDone(), 3200)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9997,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      animation: 'fade-in 0.3s ease',
    }}>
      {/* Radial burst */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${rankColor}20 0%, transparent 60%)`, animation: 'burst-pulse 0.6s ease' }} />

      {/* Rings */}
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 100 + i * 80, height: 100 + i * 80,
          borderRadius: '50%',
          border: `1px solid ${rankColor}${40 - i * 10}`,
          animation: `ring-expand 1s ${i * 0.15}s cubic-bezier(0.22,1,0.36,1) both`,
        }} />
      ))}

      {phase >= 1 && (
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 5, color: rankColor, textTransform: 'uppercase', marginBottom: 8, animation: 'fade-up 0.4s ease' }}>
            Level Up!
          </div>
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 96, color: '#fff', lineHeight: 1, textShadow: `0 0 60px ${rankColor}, 0 0 120px ${rankColor}60`, animation: 'scale-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {level}
          </div>
        </div>
      )}

      {phase >= 2 && title && (
        <div style={{ marginTop: 16, textAlign: 'center', animation: 'fade-up 0.4s ease', position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: rankColor, letterSpacing: 3 }}>{title.emoji} {title.title}</div>
          <div style={{ fontSize: 13, color: '#8aa0c8', marginTop: 6, letterSpacing: 1 }}>New title unlocked</div>
        </div>
      )}

      {phase >= 3 && (
        <div style={{ marginTop: 28, animation: 'fade-up 0.4s ease', position: 'relative', zIndex: 1 }}>
          <button onClick={onDone} style={{ background: rankColor, border: 'none', color: '#000', padding: '12px 36px', fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 14, letterSpacing: 3, cursor: 'pointer', clipPath: 'polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%)' }}>
            CONTINUE
          </button>
        </div>
      )}
    </div>
  )
}

// ── ACHIEVEMENT TOAST ──
export function AchievementToast({ achievement, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [onDone])

  const tierColors = { easy: '#22c55e', medium: '#4d9fff', hard: '#fbbf24', secret: '#a855f7' }
  const color = tierColors[achievement.tier] || '#4d9fff'

  return (
    <div style={{
      position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9990, animation: 'achievement-slide 3.5s cubic-bezier(0.22,1,0.36,1) forwards',
      background: 'rgba(3,5,13,0.98)',
      border: `1px solid ${color}60`,
      boxShadow: `0 0 40px ${color}30, 0 20px 60px rgba(0,0,0,0.6)`,
      padding: '14px 20px',
      display: 'flex', gap: 14, alignItems: 'center',
      minWidth: 280, maxWidth: 340,
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{
        width: 48, height: 48, flexShrink: 0,
        background: `${color}15`, border: `1px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
        clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
        boxShadow: `0 0 20px ${color}40`,
      }}>
        {achievement.emoji}
      </div>
      <div>
        <div style={{ fontSize: 9, color, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: 3 }}>
          🏆 Achievement Unlocked
        </div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: '#dce8ff', letterSpacing: 0.5 }}>{achievement.title}</div>
        <div style={{ fontSize: 11, color: '#8aa0c8', marginTop: 2 }}>{achievement.desc} · <span style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>+{achievement.xp} XP</span></div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, background: color, animation: 'drain 3.5s linear forwards', width: '100%' }} />
    </div>
  )
}

// ── STREAK FIRE ──
export function StreakFire({ streak }) {
  if (streak < 3) return null
  const intensity = Math.min(streak / 30, 1)
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <div style={{ fontSize: 18, animation: 'fire-dance 0.5s ease-in-out infinite alternate', filter: `drop-shadow(0 0 ${4 + intensity * 8}px #f97316)` }}>🔥</div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#f97316', fontSize: 14 }}>{streak}</span>
    </div>
  )
}

// ── DAMAGE NUMBER ──
export function DamageNumber({ value, color, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1200); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{
      position: 'fixed', top: '35%', left: '50%', transform: 'translateX(-50%)',
      fontFamily: 'Cinzel, serif', fontWeight: 900,
      fontSize: 52, color, textShadow: `0 0 30px ${color}`,
      animation: 'damage-fly 1.2s ease forwards',
      pointerEvents: 'none', zIndex: 9996,
    }}>
      {value}
    </div>
  )
}

// ── FIRE MESSAGE TOAST ──
export function FireMessage({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2000); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(9,15,30,0.95)', border: '1px solid rgba(77,159,255,0.2)',
      backdropFilter: 'blur(20px)',
      padding: '12px 24px',
      fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
      fontSize: 16, color: '#dce8ff', letterSpacing: 0.5,
      animation: 'fire-msg 2s cubic-bezier(0.22,1,0.36,1) forwards',
      pointerEvents: 'none', zIndex: 9993,
      whiteSpace: 'nowrap',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      {message}
    </div>
  )
}

// ── SCREEN FLASH ──
export function ScreenFlash({ color, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 400); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{
      position: 'fixed', inset: 0, background: color || 'rgba(77,159,255,0.1)',
      zIndex: 9995, pointerEvents: 'none',
      animation: 'flash 0.4s ease forwards',
    }} />
  )
}

// ── FLOATING XP COINS (antigravity) ──
export function FloatingCoins({ count = 5, color, targetY }) {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9994 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${30 + Math.random() * 40}%`,
          bottom: 80,
          fontSize: 18,
          animation: `coin-fly 0.8s ${i * 0.08}s cubic-bezier(0.22,1,0.36,1) forwards`,
          '--tx': `${(Math.random() - 0.5) * 80}px`,
          '--ty': targetY ? `-${window.innerHeight - targetY}px` : '-60vh',
        }}>
          ⚡
        </div>
      ))}
    </div>
  )
}

// ── GLOBAL GAME FX MANAGER (use this hook everywhere) ──
export function useGameFX() {
  const [effects, setEffects] = useState([])

  const addEffect = useCallback((type, data) => {
    const id = Date.now() + Math.random()
    setEffects(prev => [...prev, { id, type, data }])
    return id
  }, [])

  const removeEffect = useCallback((id) => {
    setEffects(prev => prev.filter(e => e.id !== id))
  }, [])

  const triggerXP = useCallback((amount, color, x, y) => {
    addEffect('xp', { amount, color, x, y })
  }, [addEffect])

  const triggerLevelUp = useCallback((level, title, rankColor) => {
    addEffect('levelup', { level, title, rankColor })
  }, [addEffect])

  const triggerAchievement = useCallback((achievement) => {
    addEffect('achievement', { achievement })
  }, [addEffect])

  const triggerConfetti = useCallback(() => {
    addEffect('confetti', {})
  }, [addEffect])

  const triggerDamage = useCallback((value, color) => {
    addEffect('damage', { value, color })
  }, [addEffect])

  const triggerFireMessage = useCallback((message) => {
    addEffect('fire', { message })
  }, [addEffect])

  const triggerFlash = useCallback((color) => {
    addEffect('flash', { color })
  }, [addEffect])

  const triggerCoins = useCallback((count, color) => {
    addEffect('coins', { count, color })
  }, [addEffect])

  const FXLayer = () => (
    <>
      {effects.map(e => {
        switch (e.type) {
          case 'xp':
            return <XPPopup key={e.id} {...e.data} onDone={() => removeEffect(e.id)} />
          case 'levelup':
            return <LevelUpScreen key={e.id} {...e.data} onDone={() => removeEffect(e.id)} />
          case 'achievement':
            return <AchievementToast key={e.id} {...e.data.achievement ? e.data : { achievement: e.data }} onDone={() => removeEffect(e.id)} />
          case 'confetti':
            return <ConfettiBurst key={e.id} active={true} onDone={() => removeEffect(e.id)} />
          case 'damage':
            return <DamageNumber key={e.id} {...e.data} onDone={() => removeEffect(e.id)} />
          case 'fire':
            return <FireMessage key={e.id} message={e.data.message} onDone={() => removeEffect(e.id)} />
          case 'flash':
            return <ScreenFlash key={e.id} {...e.data} onDone={() => removeEffect(e.id)} />
          case 'coins':
            return <FloatingCoins key={e.id} {...e.data} />
          default: return null
        }
      })}
    </>
  )

  return { triggerXP, triggerLevelUp, triggerAchievement, triggerConfetti, triggerDamage, triggerFireMessage, triggerFlash, triggerCoins, FXLayer }
}

// ── GLOBAL CSS KEYFRAMES — inject once into document ──
export function GameFXStyles() {
  return (
    <style>{`
      @keyframes xp-fly-up {
        0%   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.2); }
        20%  { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1); }
        80%  { opacity: 1; transform: translateX(-50%) translateY(-60px) scale(0.9); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-80px) scale(0.8); }
      }

      @keyframes fade-up {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      @keyframes fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      @keyframes burst-pulse {
        0%   { opacity: 0; transform: scale(0.5); }
        50%  { opacity: 1; transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }

      @keyframes ring-expand {
        from { opacity: 0.8; transform: scale(0); }
        to   { opacity: 0; transform: scale(2.5); }
      }

      @keyframes scale-pop {
        0%   { transform: scale(0); opacity: 0; }
        60%  { transform: scale(1.15); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }

      @keyframes achievement-slide {
        0%   { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        10%  { opacity: 1; transform: translateX(-50%) translateY(0); }
        85%  { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      }

      @keyframes drain {
        from { width: 100%; }
        to   { width: 0%; }
      }

      @keyframes fire-dance {
        from { transform: rotate(-5deg) scale(1); }
        to   { transform: rotate(5deg) scale(1.1); }
      }

      @keyframes damage-fly {
        0%   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.3); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-70px) scale(0.9); }
      }

      @keyframes fire-msg {
        0%   { opacity: 0; transform: translateX(-50%) translateY(20px); }
        15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
        75%  { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      }

      @keyframes flash {
        0%   { opacity: 0.4; }
        100% { opacity: 0; }
      }

      @keyframes coin-fly {
        0%   { transform: translate(0, 0) scale(1); opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)) scale(0.3); opacity: 0; }
      }

      @keyframes antigravity {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        25%  { transform: translateY(-12px) rotate(1deg); }
        75%  { transform: translateY(-6px) rotate(-1deg); }
      }

      @keyframes glow-pulse {
        0%, 100% { box-shadow: 0 0 20px var(--glow-color, rgba(77,159,255,0.3)); }
        50%      { box-shadow: 0 0 40px var(--glow-color, rgba(77,159,255,0.6)); }
      }

      @keyframes xp-bar-fill {
        from { width: var(--from, 0%); }
        to   { width: var(--to, 100%); }
      }

      @keyframes title-shimmer {
        0%   { background-position: -200% center; }
        100% { background-position: 200% center; }
      }

      @keyframes number-count {
        from { transform: translateY(100%); opacity: 0; }
        to   { transform: translateY(0); opacity: 1; }
      }

      @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%     { transform: translateX(-8px); }
        40%     { transform: translateX(8px); }
        60%     { transform: translateX(-4px); }
        80%     { transform: translateX(4px); }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-10px); }
      }

      @keyframes border-glow {
        0%, 100% { border-color: rgba(77,159,255,0.2); }
        50%      { border-color: rgba(77,159,255,0.6); }
      }

      .antigravity { animation: antigravity 4s ease-in-out infinite; }
      .glow-pulse  { animation: glow-pulse 2s ease-in-out infinite; }
      .float       { animation: float 3s ease-in-out infinite; }

      /* Micro interaction — button press */
      .btn-game {
        transition: all 0.15s cubic-bezier(0.34,1.56,0.64,1) !important;
      }
      .btn-game:active {
        transform: scale(0.94) !important;
      }
      .btn-game:hover {
        transform: scale(1.03) translateY(-2px) !important;
      }

      /* Scanlines */
      .scanlines::after {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
        pointer-events: none;
        z-index: 10;
      }

      /* Glitch effect */
      @keyframes glitch {
        0%   { clip-path: inset(0 0 95% 0); transform: translate(-2px, 0); }
        20%  { clip-path: inset(30% 0 50% 0); transform: translate(2px, 0); }
        40%  { clip-path: inset(60% 0 20% 0); transform: translate(-1px, 0); }
        60%  { clip-path: inset(80% 0 5% 0); transform: translate(1px, 0); }
        80%  { clip-path: inset(10% 0 75% 0); transform: translate(-2px, 0); }
        100% { clip-path: inset(0 0 95% 0); transform: translate(0, 0); }
      }

      /* XP bar animated fill */
      .xp-bar-animated {
        transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
      }

      /* Card hover */
      .game-card {
        transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        cursor: pointer;
      }
      .game-card:hover {
        transform: translateY(-4px);
      }

      /* Ripple on click */
      .ripple-btn {
        position: relative;
        overflow: hidden;
      }
      .ripple-btn::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%);
        transform: scale(0);
        animation: none;
      }
      .ripple-btn:active::after {
        animation: ripple 0.4s ease;
      }
      @keyframes ripple {
        from { transform: scale(0); opacity: 1; }
        to   { transform: scale(2.5); opacity: 0; }
      }

      ::-webkit-scrollbar { width: 3px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(77,159,255,0.3); border-radius: 2px; }
    `}</style>
  )
}