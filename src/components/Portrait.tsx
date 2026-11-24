import { motion } from 'framer-motion'
import type { CharacterId, Mood } from '../content/types.ts'

type HairStyle = 'long' | 'short' | 'spiky' | 'curly' | 'bun'

export const CHARACTERS: Record<
  Exclude<CharacterId, 'gremlin' | 'narrator'>,
  { name: string; role: string; skin: string; hair: string; style: HairStyle; shirt: string }
> = {
  meera: { name: 'Meera Rao', role: 'QA Lead', skin: '#b7794f', hair: '#2a1a14', style: 'long', shirt: '#1f8a85' },
  theo: { name: 'Theo Lindqvist', role: 'Backend Dev', skin: '#f0c9a6', hair: '#d9a441', style: 'short', shirt: '#e8735a' },
  rex: { name: 'Rex Calloway', role: 'Senior Automation', skin: '#7a4b2f', hair: '#151515', style: 'spiky', shirt: '#3b3742' },
  sam: { name: 'Sam Adeyemi', role: 'Product Manager', skin: '#5a3820', hair: '#1d120c', style: 'curly', shirt: '#7b4fa0' },
  you: { name: 'You', role: 'QA Engineer', skin: '#d09a73', hair: '#3b2418', style: 'bun', shirt: '#e9b949' },
}

const MOUTH: Record<Mood, string> = {
  happy: 'M50 66 Q60 76 70 66',
  neutral: 'M52 68 L68 68',
  worried: 'M51 71 Q60 65 69 71',
  surprised: '',
  smug: 'M52 68 Q63 72 70 63',
  angry: 'M51 72 Q60 66 69 72',
}

function brows(mood: Mood) {
  switch (mood) {
    case 'worried':
      return ['M43 45 L53 43', 'M67 43 L77 45']
    case 'angry':
      return ['M43 42 L54 46', 'M66 46 L77 42']
    case 'surprised':
      return ['M43 41 Q48 38 54 41', 'M66 41 Q72 38 77 41']
    case 'smug':
      return ['M43 44 L54 44', 'M66 42 L77 40']
    default:
      return ['M43 44 L54 43', 'M66 43 L77 44']
  }
}

function HairBack({ style, color }: { style: HairStyle; color: string }) {
  if (style === 'long') return <path d="M28 52 Q26 20 60 18 Q94 20 92 52 L94 96 L26 96 Z" fill={color} />
  return null
}

function HairFront({ style, color }: { style: HairStyle; color: string }) {
  switch (style) {
    case 'long':
      return <path d="M30 52 Q30 20 60 20 Q90 20 90 52 Q84 32 62 30 Q50 40 30 52Z" fill={color} />
    case 'short':
      return <path d="M30 48 Q30 18 60 18 Q90 18 90 48 Q86 30 60 30 Q36 30 30 48Z" fill={color} />
    case 'spiky':
      return <path d="M30 46 L34 24 L42 32 L48 16 L56 28 L62 14 L68 28 L76 18 L80 32 L88 24 L90 46 Q80 32 60 32 Q40 32 30 46Z" fill={color} />
    case 'curly':
      return (
        <g fill={color}>
          {[32, 42, 52, 62, 72, 82, 88].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 26 : 32} r={10} />
          ))}
          <circle cx={60} cy={22} r={12} />
        </g>
      )
    case 'bun':
      return (
        <g fill={color}>
          <circle cx={60} cy={14} r={11} />
          <path d="M30 50 Q30 20 60 20 Q90 20 90 50 Q84 32 60 31 Q36 32 30 50Z" />
        </g>
      )
  }
}

export function Portrait({ who, mood = 'neutral', size = 120, talking = false, framed = true }: { who: CharacterId; mood?: Mood; size?: number; talking?: boolean; framed?: boolean }) {
  if (who === 'gremlin') return <Gremlin size={size} mood={mood} talking={talking} framed={framed} />
  if (who === 'narrator') return null
  const c = CHARACTERS[who]
  const [b1, b2] = brows(mood)
  return (
    <motion.svg
      key={mood}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      initial={{ y: 6, scale: 0.96 }}
      animate={{ y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 14 }}
      className={`portrait ${talking ? 'is-talking' : ''}`}
      aria-label={`${c.name}, ${mood}`}
    >
      {framed && <circle cx={60} cy={60} r={58} fill="var(--portrait-bg)" />}
      <HairBack style={c.style} color={c.hair} />
      <path d="M22 120 Q24 92 60 90 Q96 92 98 120 Z" fill={c.shirt} />
      <rect x={53} y={76} width={14} height={16} rx={5} fill={c.skin} />
      <circle cx={60} cy={54} r={30} fill={c.skin} />
      <HairFront style={c.style} color={c.hair} />
      <g className="blink">
        <ellipse cx={49} cy={55} rx={3.4} ry={mood === 'surprised' ? 5 : 4} fill="#1d1622" />
        <ellipse cx={71} cy={55} rx={3.4} ry={mood === 'surprised' ? 5 : 4} fill="#1d1622" />
      </g>
      <g stroke="#1d1622" strokeWidth={2.4} strokeLinecap="round" fill="none">
        <path d={b1} />
        <path d={b2} />
        {talking ? (
          <g className="talk">
            <path className="mouth-closed" d={MOUTH[mood] || 'M52 68 L68 68'} />
            <ellipse className="mouth-open" cx={60} cy={69} rx={6} ry={4.5} fill="#5b1d2a" />
          </g>
        ) : mood === 'surprised' ? (
          <ellipse cx={60} cy={69} rx={4.5} ry={5.5} fill="#1d1622" />
        ) : (
          <path d={MOUTH[mood]} />
        )}
      </g>
      {mood === 'happy' && (
        <g fill="#ff8a8a" opacity={0.45}>
          <ellipse cx={42} cy={64} rx={5} ry={3} />
          <ellipse cx={78} cy={64} rx={5} ry={3} />
        </g>
      )}
    </motion.svg>
  )
}

export function Gremlin({ size = 120, mood = 'smug', talking = false, framed = true }: { size?: number; mood?: Mood; talking?: boolean; framed?: boolean }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`gremlin glitch ${talking ? 'is-talking' : ''}`}
      initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
      aria-label="The Gremlin"
    >
      {framed && <circle cx={60} cy={60} r={58} fill="#211a2b" />}
      <path d="M44 30 L38 10 M76 30 L84 12" stroke="#9cf06b" strokeWidth={3} strokeLinecap="round" />
      <circle cx={38} cy={10} r={4} fill="#ff4fd8" />
      <circle cx={84} cy={12} r={4} fill="#ff4fd8" />
      <path d="M24 74 Q20 30 60 28 Q100 30 96 74 Q92 100 60 102 Q28 100 24 74Z" fill="#6b3fa0" />
      <path d="M24 74 Q20 30 60 28 Q100 30 96 74" fill="none" stroke="#9cf06b" strokeWidth={2} strokeDasharray="4 5" />
      <circle cx={60} cy={58} r={17} fill="#f7f1ff" />
      <circle cx={mood === 'angry' ? 60 : 64} cy={58} r={8} fill="#1b1424" />
      <circle cx={66} cy={55} r={2.5} fill="#fff" />
      {mood === 'angry' ? (
        <path d="M42 38 L58 46 M78 38 L62 46" stroke="#9cf06b" strokeWidth={3} strokeLinecap="round" />
      ) : null}
      {talking ? (
        <g className="talk">
          <path className="mouth-closed" d="M44 86 Q60 92 78 84" stroke="#9cf06b" strokeWidth={3} fill="none" strokeLinecap="round" />
          <ellipse className="mouth-open" cx={61} cy={87} rx={11} ry={7} fill="#0e0a14" stroke="#9cf06b" strokeWidth={2} />
        </g>
      ) : (
        <path d={mood === 'angry' ? 'M44 88 L52 82 L60 88 L68 82 L76 88' : 'M44 84 Q60 96 78 82'} stroke="#9cf06b" strokeWidth={3} fill="none" strokeLinecap="round" />
      )}
    </motion.svg>
  )
}
