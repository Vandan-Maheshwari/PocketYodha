// ─────────────────────────────────────────
//  POCKETYODHA — Avatar System
//  12 illustrated warrior avatars
//  Each has a unique SVG design + personality
// ─────────────────────────────────────────
 
export const AVATARS = [
  {
    id: 'shadow_monk',
    name: 'Shadow Monk',
    description: 'Silent master of discipline',
    category: 'neutral',
    primaryColor: '#4d9fff',
    secondaryColor: '#1e3a5f',
    accentColor: '#a855f7',
    suitedFor: ['student', 'young_adult'],
  },
  {
    id: 'flame_warrior',
    name: 'Flame Warrior',
    description: 'Fierce and unstoppable',
    category: 'aggressive',
    primaryColor: '#ef4444',
    secondaryColor: '#7f1d1d',
    accentColor: '#fbbf24',
    suitedFor: ['young_adult'],
  },
  {
    id: 'crystal_mage',
    name: 'Crystal Mage',
    description: 'Master of foresight',
    category: 'magic',
    primaryColor: '#a855f7',
    secondaryColor: '#3b0764',
    accentColor: '#60a5fa',
    suitedFor: ['student', 'young_adult'],
  },
  {
    id: 'gold_sentinel',
    name: 'Gold Sentinel',
    description: 'Protector of wealth',
    category: 'defender',
    primaryColor: '#fbbf24',
    secondaryColor: '#451a03',
    accentColor: '#f97316',
    suitedFor: ['young_adult'],
  },
  {
    id: 'storm_archer',
    name: 'Storm Archer',
    description: 'Strikes from a distance',
    category: 'ranged',
    primaryColor: '#22c55e',
    secondaryColor: '#052e16',
    accentColor: '#4d9fff',
    suitedFor: ['student'],
  },
  {
    id: 'void_hunter',
    name: 'Void Hunter',
    description: 'Thrives in the unknown',
    category: 'stealth',
    primaryColor: '#6366f1',
    secondaryColor: '#1e1b4b',
    accentColor: '#ec4899',
    suitedFor: ['student', 'young_adult'],
  },
  {
    id: 'iron_sage',
    name: 'Iron Sage',
    description: 'Ancient wisdom, unbreakable',
    category: 'wisdom',
    primaryColor: '#94a3b8',
    secondaryColor: '#0f172a',
    accentColor: '#fbbf24',
    suitedFor: ['young_adult'],
  },
  {
    id: 'phoenix_girl',
    name: 'Phoenix',
    description: 'Rises from every setback',
    category: 'magic',
    primaryColor: '#f97316',
    secondaryColor: '#431407',
    accentColor: '#fbbf24',
    suitedFor: ['student', 'young_adult'],
  },
  {
    id: 'forest_guardian',
    name: 'Forest Guardian',
    description: 'Nature-powered patience',
    category: 'nature',
    primaryColor: '#22c55e',
    secondaryColor: '#052e16',
    accentColor: '#86efac',
    suitedFor: ['student'],
  },
  {
    id: 'neon_ronin',
    name: 'Neon Ronin',
    description: 'City-street survivor',
    category: 'urban',
    primaryColor: '#ec4899',
    secondaryColor: '#4a044e',
    accentColor: '#4d9fff',
    suitedFor: ['student', 'young_adult'],
  },
  {
    id: 'thunder_knight',
    name: 'Thunder Knight',
    description: 'Commands lightning',
    category: 'warrior',
    primaryColor: '#fbbf24',
    secondaryColor: '#1c1917',
    accentColor: '#4d9fff',
    suitedFor: ['young_adult'],
  },
  {
    id: 'sakura_blade',
    name: 'Sakura Blade',
    description: 'Grace in every strike',
    category: 'elegant',
    primaryColor: '#f43f5e',
    secondaryColor: '#4c0519',
    accentColor: '#fbbf24',
    suitedFor: ['student', 'young_adult'],
  },
]
 
// SVG Avatar renderer — creates a unique illustrated character for each avatar
// This renders as actual styled SVG art, not emojis
export function renderAvatarSVG(avatarId, size = 80) {
  const avatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0]
  const p = avatar.primaryColor
  const s = avatar.secondaryColor
  const a = avatar.accentColor
  const half = size / 2
  const scale = size / 80
 
  // Each avatar gets a unique visual design
  const designs = {
    shadow_monk: `
      <circle cx="${half}" cy="${half * 0.7}" r="${18 * scale}" fill="${s}"/>
      <ellipse cx="${half}" cy="${half * 0.68}" rx="${10 * scale}" ry="${12 * scale}" fill="${p}" opacity="0.9"/>
      <rect x="${half - 22 * scale}" y="${half * 0.9}" width="${44 * scale}" height="${32 * scale}" rx="${8 * scale}" fill="${s}"/>
      <rect x="${half - 14 * scale}" y="${half * 0.9}" width="${28 * scale}" height="${32 * scale}" rx="${6 * scale}" fill="${p}" opacity="0.8"/>
      <line x1="${half - 24 * scale}" y1="${half * 1.1}" x2="${half - 36 * scale}" y2="${half * 1.5}" stroke="${a}" stroke-width="${3 * scale}" stroke-linecap="round"/>
      <line x1="${half + 24 * scale}" y1="${half * 1.1}" x2="${half + 36 * scale}" y2="${half * 1.5}" stroke="${a}" stroke-width="${3 * scale}" stroke-linecap="round"/>
      <circle cx="${half - 7 * scale}" cy="${half * 0.65}" r="${3 * scale}" fill="${a}"/>
      <circle cx="${half + 7 * scale}" cy="${half * 0.65}" r="${3 * scale}" fill="${a}"/>
      <rect x="${half - 3 * scale}" y="${half * 0.8}" width="${6 * scale}" height="${8 * scale}" rx="${2 * scale}" fill="${a}" opacity="0.7"/>
    `,
    flame_warrior: `
      <circle cx="${half}" cy="${half * 0.7}" r="${18 * scale}" fill="${s}"/>
      <ellipse cx="${half}" cy="${half * 0.68}" rx="${10 * scale}" ry="${12 * scale}" fill="#b91c1c" opacity="0.9"/>
      <path d="M${half - 12 * scale} ${half * 0.45} Q${half} ${half * 0.2} ${half + 12 * scale} ${half * 0.45}" fill="none" stroke="${a}" stroke-width="${3 * scale}" stroke-linecap="round"/>
      <rect x="${half - 22 * scale}" y="${half * 0.9}" width="${44 * scale}" height="${32 * scale}" rx="${8 * scale}" fill="${s}"/>
      <rect x="${half - 14 * scale}" y="${half * 0.9}" width="${28 * scale}" height="${32 * scale}" rx="${6 * scale}" fill="${p}" opacity="0.7"/>
      <path d="M${half + 28 * scale} ${half * 0.6} Q${half + 40 * scale} ${half * 0.3} ${half + 32 * scale} ${half}" fill="${a}" opacity="0.9"/>
      <circle cx="${half - 6 * scale}" cy="${half * 0.65}" r="${3 * scale}" fill="${a}"/>
      <circle cx="${half + 6 * scale}" cy="${half * 0.65}" r="${3 * scale}" fill="${a}"/>
    `,
    crystal_mage: `
      <circle cx="${half}" cy="${half * 0.7}" r="${18 * scale}" fill="${s}"/>
      <ellipse cx="${half}" cy="${half * 0.68}" rx="${10 * scale}" ry="${12 * scale}" fill="${p}" opacity="0.85"/>
      <polygon points="${half},${half * 0.28} ${half - 8 * scale},${half * 0.45} ${half + 8 * scale},${half * 0.45}" fill="${a}" opacity="0.9"/>
      <rect x="${half - 22 * scale}" y="${half * 0.9}" width="${44 * scale}" height="${32 * scale}" rx="${8 * scale}" fill="${s}"/>
      <rect x="${half - 12 * scale}" y="${half * 0.9}" width="${24 * scale}" height="${32 * scale}" rx="${5 * scale}" fill="${p}" opacity="0.75"/>
      <circle cx="${half}" cy="${half * 1.5}" r="${6 * scale}" fill="${a}" opacity="0.8"/>
      <line x1="${half}" y1="${half * 1.1}" x2="${half}" y2="${half * 1.44}" stroke="${a}" stroke-width="${2 * scale}"/>
      <circle cx="${half - 7 * scale}" cy="${half * 0.65}" r="${3 * scale}" fill="${a}"/>
      <circle cx="${half + 7 * scale}" cy="${half * 0.65}" r="${3 * scale}" fill="${a}"/>
    `,
    gold_sentinel: `
      <circle cx="${half}" cy="${half * 0.7}" r="${18 * scale}" fill="${s}"/>
      <path d="M${half - 18 * scale} ${half * 0.58} L${half - 14 * scale} ${half * 0.38} L${half} ${half * 0.32} L${half + 14 * scale} ${half * 0.38} L${half + 18 * scale} ${half * 0.58}" fill="${a}" opacity="0.9"/>
      <ellipse cx="${half}" cy="${half * 0.72}" rx="${10 * scale}" ry="${11 * scale}" fill="#92400e" opacity="0.9"/>
      <rect x="${half - 24 * scale}" y="${half * 0.9}" width="${48 * scale}" height="${34 * scale}" rx="${6 * scale}" fill="${s}"/>
      <rect x="${half - 16 * scale}" y="${half * 0.9}" width="${32 * scale}" height="${34 * scale}" rx="${5 * scale}" fill="${a}" opacity="0.6"/>
      <rect x="${half - 3 * scale}" y="${half * 0.9}" width="${6 * scale}" height="${34 * scale}" fill="${a}" opacity="0.8"/>
      <circle cx="${half - 7 * scale}" cy="${half * 0.68}" r="${3 * scale}" fill="${a}"/>
      <circle cx="${half + 7 * scale}" cy="${half * 0.68}" r="${3 * scale}" fill="${a}"/>
    `,
    storm_archer: `
      <circle cx="${half}" cy="${half * 0.7}" r="${18 * scale}" fill="${s}"/>
      <ellipse cx="${half}" cy="${half * 0.68}" rx="${10 * scale}" ry="${12 * scale}" fill="${p}" opacity="0.85"/>
      <rect x="${half - 20 * scale}" y="${half * 0.9}" width="${40 * scale}" height="${30 * scale}" rx="${8 * scale}" fill="${s}"/>
      <rect x="${half - 12 * scale}" y="${half * 0.9}" width="${24 * scale}" height="${30 * scale}" rx="${5 * scale}" fill="${p}" opacity="0.7"/>
      <line x1="${half + 28 * scale}" y1="${half * 0.5}" x2="${half + 28 * scale}" y2="${half * 1.4}" stroke="${a}" stroke-width="${3 * scale}" stroke-linecap="round"/>
      <path d="M${half + 28 * scale} ${half * 0.9} Q${half + 40 * scale} ${half} ${half + 28 * scale} ${half * 1.1}" fill="none" stroke="${a}" stroke-width="${2 * scale}"/>
      <circle cx="${half - 7 * scale}" cy="${half * 0.65}" r="${3 * scale}" fill="${a}"/>
      <circle cx="${half + 7 * scale}" cy="${half * 0.65}" r="${3 * scale}" fill="${a}"/>
    `,
    void_hunter: `
      <circle cx="${half}" cy="${half * 0.7}" r="${18 * scale}" fill="${s}"/>
      <ellipse cx="${half}" cy="${half * 0.68}" rx="${10 * scale}" ry="${12 * scale}" fill="#312e81" opacity="0.9"/>
      <path d="M${half - 18 * scale} ${half * 0.52} Q${half - 22 * scale} ${half * 0.4} ${half - 16 * scale} ${half * 0.35} Q${half} ${half * 0.28} ${half + 16 * scale} ${half * 0.35} Q${half + 22 * scale} ${half * 0.4} ${half + 18 * scale} ${half * 0.52}" fill="${s}" stroke="${a}" stroke-width="${1.5 * scale}"/>
      <rect x="${half - 20 * scale}" y="${half * 0.9}" width="${40 * scale}" height="${30 * scale}" rx="${8 * scale}" fill="${s}"/>
      <rect x="${half - 12 * scale}" y="${half * 0.9}" width="${24 * scale}" height="${30 * scale}" rx="${5 * scale}" fill="${p}" opacity="0.6"/>
      <circle cx="${half - 7 * scale}" cy="${half * 0.64}" r="${4 * scale}" fill="${a}" opacity="0.9"/>
      <circle cx="${half + 7 * scale}" cy="${half * 0.64}" r="${4 * scale}" fill="${a}" opacity="0.9"/>
      <circle cx="${half - 7 * scale}" cy="${half * 0.64}" r="${2 * scale}" fill="${s}"/>
      <circle cx="${half + 7 * scale}" cy="${half * 0.64}" r="${2 * scale}" fill="${s}"/>
    `,
    iron_sage: `
      <circle cx="${half}" cy="${half * 0.7}" r="${18 * scale}" fill="${s}"/>
      <ellipse cx="${half}" cy="${half * 0.68}" rx="${11 * scale}" ry="${12 * scale}" fill="#374151" opacity="0.9"/>
      <path d="M${half - 14 * scale} ${half * 0.5} L${half - 18 * scale} ${half * 0.4} M${half + 14 * scale} ${half * 0.5} L${half + 18 * scale} ${half * 0.4}" stroke="${a}" stroke-width="${3 * scale}" stroke-linecap="round"/>
      <rect x="${half - 22 * scale}" y="${half * 0.88}" width="${44 * scale}" height="${34 * scale}" rx="${6 * scale}" fill="${s}"/>
      <rect x="${half - 14 * scale}" y="${half * 0.88}" width="${28 * scale}" height="${34 * scale}" rx="${5 * scale}" fill="#374151" opacity="0.8"/>
      <circle cx="${half - 7 * scale}" cy="${half * 0.66}" r="${3 * scale}" fill="${a}"/>
      <circle cx="${half + 7 * scale}" cy="${half * 0.66}" r="${3 * scale}" fill="${a}"/>
      <line x1="${half - 5 * scale}" y1="${half * 0.76}" x2="${half + 5 * scale}" y2="${half * 0.76}" stroke="${a}" stroke-width="${1.5 * scale}" stroke-linecap="round"/>
    `,
    phoenix_girl: `
      <circle cx="${half}" cy="${half * 0.7}" r="${18 * scale}" fill="${s}"/>
      <ellipse cx="${half}" cy="${half * 0.68}" rx="${10 * scale}" ry="${12 * scale}" fill="#9a3412" opacity="0.9"/>
      <path d="M${half - 20 * scale} ${half * 0.45} Q${half - 28 * scale} ${half * 0.2} ${half - 16 * scale} ${half * 0.35}" fill="${a}" opacity="0.85"/>
      <path d="M${half + 20 * scale} ${half * 0.45} Q${half + 28 * scale} ${half * 0.2} ${half + 16 * scale} ${half * 0.35}" fill="${a}" opacity="0.85"/>
      <rect x="${half - 20 * scale}" y="${half * 0.88}" width="${40 * scale}" height="${32 * scale}" rx="${8 * scale}" fill="${s}"/>
      <rect x="${half - 12 * scale}" y="${half * 0.88}" width="${24 * scale}" height="${32 * scale}" rx="${5 * scale}" fill="${p}" opacity="0.7"/>
      <circle cx="${half - 7 * scale}" cy="${half * 0.66}" r="${3 * scale}" fill="${a}"/>
      <circle cx="${half + 7 * scale}" cy="${half * 0.66}" r="${3 * scale}" fill="${a}"/>
    `,
    forest_guardian: `
      <circle cx="${half}" cy="${half * 0.7}" r="${18 * scale}" fill="${s}"/>
      <ellipse cx="${half}" cy="${half * 0.68}" rx="${10 * scale}" ry="${12 * scale}" fill="#14532d" opacity="0.9"/>
      <path d="M${half - 16 * scale} ${half * 0.5} Q${half - 20 * scale} ${half * 0.3} ${half} ${half * 0.28} Q${half + 20 * scale} ${half * 0.3} ${half + 16 * scale} ${half * 0.5}" fill="${a}" opacity="0.8"/>
      <rect x="${half - 22 * scale}" y="${half * 0.88}" width="${44 * scale}" height="${33 * scale}" rx="${7 * scale}" fill="${s}"/>
      <rect x="${half - 14 * scale}" y="${half * 0.88}" width="${28 * scale}" height="${33 * scale}" rx="${5 * scale}" fill="${p}" opacity="0.7"/>
      <circle cx="${half - 7 * scale}" cy="${half * 0.66}" r="${3 * scale}" fill="${a}"/>
      <circle cx="${half + 7 * scale}" cy="${half * 0.66}" r="${3 * scale}" fill="${a}"/>
    `,
    neon_ronin: `
      <circle cx="${half}" cy="${half * 0.7}" r="${18 * scale}" fill="${s}"/>
      <ellipse cx="${half}" cy="${half * 0.68}" rx="${10 * scale}" ry="${12 * scale}" fill="#701a75" opacity="0.9"/>
      <line x1="${half - 28 * scale}" y1="${half * 0.55}" x2="${half + 28 * scale}" y2="${half * 0.85}" stroke="${p}" stroke-width="${2 * scale}" opacity="0.7"/>
      <rect x="${half - 20 * scale}" y="${half * 0.88}" width="${40 * scale}" height="${32 * scale}" rx="${8 * scale}" fill="${s}"/>
      <rect x="${half - 12 * scale}" y="${half * 0.88}" width="${24 * scale}" height="${32 * scale}" rx="${5 * scale}" fill="${p}" opacity="0.65"/>
      <circle cx="${half - 7 * scale}" cy="${half * 0.64}" r="${3.5 * scale}" fill="${p}"/>
      <circle cx="${half + 7 * scale}" cy="${half * 0.64}" r="${3.5 * scale}" fill="${a}"/>
    `,
    thunder_knight: `
      <circle cx="${half}" cy="${half * 0.7}" r="${18 * scale}" fill="${s}"/>
      <path d="M${half - 16 * scale} ${half * 0.52} L${half - 18 * scale} ${half * 0.38} L${half} ${half * 0.3} L${half + 18 * scale} ${half * 0.38} L${half + 16 * scale} ${half * 0.52}" fill="${a}" opacity="0.9"/>
      <ellipse cx="${half}" cy="${half * 0.72}" rx="${10 * scale}" ry="${11 * scale}" fill="#1c1917" opacity="0.95"/>
      <rect x="${half - 24 * scale}" y="${half * 0.88}" width="${48 * scale}" height="${34 * scale}" rx="${6 * scale}" fill="${s}"/>
      <rect x="${half - 16 * scale}" y="${half * 0.88}" width="${32 * scale}" height="${34 * scale}" rx="${5 * scale}" fill="#292524" opacity="0.9"/>
      <path d="M${half - 3 * scale} ${half * 0.9} L${half + 3 * scale} ${half} L${half - 2 * scale} ${half} L${half + 4 * scale} ${half * 1.15}" fill="${a}" opacity="0.9"/>
      <circle cx="${half - 7 * scale}" cy="${half * 0.68}" r="${3 * scale}" fill="${a}"/>
      <circle cx="${half + 7 * scale}" cy="${half * 0.68}" r="${3 * scale}" fill="${a}"/>
    `,
    sakura_blade: `
      <circle cx="${half}" cy="${half * 0.7}" r="${18 * scale}" fill="${s}"/>
      <ellipse cx="${half}" cy="${half * 0.68}" rx="${10 * scale}" ry="${12 * scale}" fill="#9f1239" opacity="0.9"/>
      <circle cx="${half - 12 * scale}" cy="${half * 0.5}" r="${4 * scale}" fill="${p}" opacity="0.8"/>
      <circle cx="${half + 12 * scale}" cy="${half * 0.5}" r="${4 * scale}" fill="${p}" opacity="0.8"/>
      <rect x="${half - 20 * scale}" y="${half * 0.88}" width="${40 * scale}" height="${33 * scale}" rx="${10 * scale}" fill="${s}"/>
      <rect x="${half - 12 * scale}" y="${half * 0.88}" width="${24 * scale}" height="${33 * scale}" rx="${7 * scale}" fill="${p}" opacity="0.65"/>
      <line x1="${half + 24 * scale}" y1="${half * 0.5}" x2="${half + 24 * scale}" y2="${half * 1.4}" stroke="${a}" stroke-width="${2.5 * scale}" stroke-linecap="round"/>
      <circle cx="${half - 7 * scale}" cy="${half * 0.66}" r="${3 * scale}" fill="${a}"/>
      <circle cx="${half + 7 * scale}" cy="${half * 0.66}" r="${3 * scale}" fill="${a}"/>
    `,
  }
 
  const design = designs[avatarId] || designs['shadow_monk']
 
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_${avatarId}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${avatar.secondaryColor}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="${avatar.secondaryColor}" stop-opacity="1"/>
        </radialGradient>
      </defs>
      <circle cx="${half}" cy="${half}" r="${half - 2}" fill="url(#bg_${avatarId})" stroke="${avatar.primaryColor}" stroke-width="2" stroke-opacity="0.6"/>
      ${design}
    </svg>
  `
}
 
// React component for avatar display
export function AvatarImage({ avatarId, size = 80, className = '' }) {
  const avatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0]
  const svg = renderAvatarSVG(avatarId, size)
 
  return {
    svg,
    avatar,
    dangerouslySetInnerHTML: { __html: svg }
  }
}