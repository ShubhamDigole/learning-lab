import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { runQuery } from '../db/engine.ts'
import { Bi } from '../lib/i18n.tsx'
import { Stamp } from './Celebrate.tsx'

interface Pair {
  order: number
  shipment: number | null
}

/** Replays the real LEFT JOIN on a sample of ShopSprout rows: links draw, orphans shake red. */
export function JoinVisualizer({ total }: { total: number }) {
  const [pairs, setPairs] = useState<Pair[] | null>(null)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    runQuery(
      `SELECT * FROM (
         (SELECT o.id, s.id AS sid FROM orders o LEFT JOIN shipments s ON s.order_id = o.id WHERE s.id IS NULL ORDER BY o.id LIMIT 2)
         UNION ALL
         (SELECT o.id, s.id FROM orders o JOIN shipments s ON s.order_id = o.id ORDER BY o.id LIMIT 4)
       ) t ORDER BY id`,
    ).then((r) => setPairs(r.rows.map((row) => ({ order: Number(row[0]), shipment: row[1] === null ? null : Number(row[1]) }))))
  }, [])

  useEffect(() => {
    if (!pairs) return
    const t = [1, 2, 3].map((p) => setTimeout(() => setPhase(p), p * 1100))
    return () => t.forEach(clearTimeout)
  }, [pairs])

  if (!pairs) return null
  const ROW = 44
  const shipped = pairs.filter((p) => p.shipment !== null)
  const right = [...shipped].sort((a, b) => (b.shipment! % 7) - (a.shipment! % 7))
  const h = pairs.length * ROW + 40
  return (
    <div className="joinviz">
      <Bi t={{ en: 'Replaying your LEFT JOIN on 6 sample orders', mr: '6 नमुना ऑर्डर्सवर तुमचा LEFT JOIN पुन्हा दाखवतोय' }} className="eyebrow" />
      <div className="match-scroll">
        <div className="joinviz-stage" style={{ height: h }}>
          <div className="match-title">orders</div>
          <div className="match-title right">shipments</div>
          <svg width={520} height={h} className="match-lines" aria-hidden>
            {phase >= 1 &&
              pairs.map((p, i) => {
                if (p.shipment === null) return null
                const j = right.findIndex((r) => r.order === p.order)
                return <motion.path key={i} d={`M190 ${30 + i * ROW + 17} C260 ${30 + i * ROW + 17} 260 ${30 + j * ROW + 17} 330 ${30 + j * ROW + 17}`} stroke="var(--link)" strokeWidth={2.5} fill="none" pathLength={1} strokeDasharray="1" initial={{ strokeDashoffset: 1 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 0.5, delay: i * 0.12 }} />
              })}
          </svg>
          {pairs.map((p, i) => (
            <motion.div key={p.order} className={`match-card ${phase >= 2 && p.shipment === null ? 'orphan' : ''}`} style={{ top: 30 + i * ROW, left: 0, width: 190, height: 34 }} initial={{ x: -30, opacity: 0 }} animate={{ x: phase >= 2 && p.shipment === null ? [0, -5, 5, -3, 3, 0] : 0, opacity: 1 }} transition={{ delay: phase >= 2 ? 0 : i * 0.06 }}>
              order {p.order}
            </motion.div>
          ))}
          {right.map((p, j) => (
            <motion.div key={p.order} className="match-card right" style={{ top: 30 + j * ROW, left: 330, width: 190, height: 34 }} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 + j * 0.06 }}>
              shipment #{p.shipment}
            </motion.div>
          ))}
        </div>
      </div>
      {phase >= 3 && (
        <motion.div className="evidence-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="evidence-big tabular">{total}</div>
          <Bi t={{ en: 'orders without a shipment', mr: 'शिपमेंट नसलेल्या ऑर्डर्स' }} />
          <Stamp text="EVIDENCE" />
        </motion.div>
      )}
    </div>
  )
}
