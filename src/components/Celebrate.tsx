import { motion } from 'framer-motion'
import { useMemo } from 'react'

export function Stamp({ text, tone = 'red' }: { text: string; tone?: 'red' | 'green' | 'teal' }) {
  return (
    <motion.div
      className={`stamp stamp-${tone}`}
      initial={{ scale: 3, rotate: -30, opacity: 0 }}
      animate={{ scale: 1, rotate: -10, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 16 }}
    >
      {text}
    </motion.div>
  )
}

/** A burst of tiny bugs and sparkles. */
export function Confetti({ count = 28 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        icon: ['🐞', '✨', '🐛', '⭐', '🔎', '🎉'][i % 6],
        x: (Math.random() - 0.5) * 520,
        y: -120 - Math.random() * 220,
        r: (Math.random() - 0.5) * 540,
        d: 0.9 + Math.random() * 0.8,
      })),
    [count],
  )
  return (
    <div className="confetti" aria-hidden>
      {bits.map((b, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 320], opacity: [1, 1, 0], rotate: b.r, scale: 1 }}
          transition={{ duration: b.d + 0.8, ease: 'easeOut' }}
        >
          {b.icon}
        </motion.span>
      ))}
    </div>
  )
}

export function Stars({ n, of = 3 }: { n: number; of?: number }) {
  return (
    <span className="stars" aria-label={`${n} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (
        <motion.span key={i} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3 + i * 0.2, type: 'spring' }} className={i < n ? 'on' : ''}>
          ★
        </motion.span>
      ))}
    </span>
  )
}
