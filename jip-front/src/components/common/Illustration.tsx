import type { CSSProperties } from 'react'

const ILLUST: Record<string, { emoji: string; bg: string }> = {
  default:   { emoji: '🏠',   bg: '#F2F4F6' },
  kitchen:   { emoji: '🍳',   bg: '#FFF1EB' },
  bath:      { emoji: '🚿',   bg: '#E0EAFE' },
  film:      { emoji: '🎨',   bg: '#F5F3FF' },
  floor:     { emoji: '🪵',   bg: '#FEF3C7' },
  faucet:    { emoji: '🚰',   bg: '#FFF1EB' },
  sink:      { emoji: '🪣',   bg: '#FFF1EB' },
  counter:   { emoji: '🧱',   bg: '#FFF1EB' },
  sanding:   { emoji: '✨',   bg: '#FFF7ED' },
  door:      { emoji: '🚪',   bg: '#F5F3FF' },
  hinge:     { emoji: '🔩',   bg: '#FFF1EB' },
  toilet:    { emoji: '🚽',   bg: '#E0EAFE' },
  bidet:     { emoji: '💧',   bg: '#E0EAFE' },
  shower:    { emoji: '🚿',   bg: '#E0EAFE' },
  cabinet:   { emoji: '🗄️',  bg: '#E0EAFE' },
  accessory: { emoji: '🧻',   bg: '#E0EAFE' },
  wall:      { emoji: '🖼️',  bg: '#F5F3FF' },
  molding:   { emoji: '📐',   bg: '#F5F3FF' },
  patch:     { emoji: '🩹',   bg: '#FEF3C7' },
  wax:       { emoji: '✨',   bg: '#FEF3C7' },
  hero:      { emoji: '🔧',   bg: '#FFF1EB' },
  person:    { emoji: '👷‍♂️', bg: '#FEF3C7' },
}

const ITEM_ILLUST: Record<string, string> = {
  k1: 'counter', k2: 'sanding', k3: 'sink', k4: 'faucet', k5: 'door', k6: 'hinge',
  b1: 'faucet', b2: 'sink', b3: 'toilet', b4: 'bidet', b5: 'accessory', b6: 'shower', b7: 'cabinet',
  f1: 'door', f2: 'wall', f3: 'molding',
  fl1: 'patch', fl2: 'floor', fl3: 'wax',
}

const CAT_ILLUST: Record<string, string> = {
  kitchen: 'kitchen', bath: 'bath', film: 'film', floor: 'floor',
}

interface IllustrationProps {
  kind?: string
  style?: CSSProperties
}

export default function Illustration({ kind = 'default', style }: IllustrationProps) {
  const meta = ILLUST[kind] ?? ILLUST.default
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block', width: '100%', height: '100%', ...style }}
    >
      <rect width="100" height="100" fill={meta.bg} />
      <text
        x="50" y="52"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="50"
        style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}
      >
        {meta.emoji}
      </text>
    </svg>
  )
}

export function ItemIllust({ code, style }: { code: string; style?: CSSProperties }) {
  return <Illustration kind={ITEM_ILLUST[code] ?? 'default'} style={style} />
}

export function CatIllust({ code, style }: { code: string; style?: CSSProperties }) {
  return <Illustration kind={CAT_ILLUST[code] ?? 'default'} style={style} />
}
