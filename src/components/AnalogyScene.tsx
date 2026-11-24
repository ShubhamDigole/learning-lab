import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Scene, SceneItem } from '../content/types.ts'
import { Bi, useLang, L } from '../lib/i18n.tsx'

/** Plays a scene in timed phases: 0 = set the stage, 1+ = the action and the result. */
function usePhases(count: number, gap = 1300, runKey = 0) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    setPhase(0)
    const timers = Array.from({ length: count }, (_, i) => setTimeout(() => setPhase(i + 1), gap * (i + 1)))
    return () => timers.forEach(clearTimeout)
  }, [count, gap, runKey])
  return phase
}

function Label({ item }: { item: SceneItem }) {
  const { marathi } = useLang()
  return (
    <span className="scene-label">
      <span lang="en">{item.label}</span>
      {marathi && item.mr && <span lang="mr" className="scene-label-mr">{item.mr}</span>}
    </span>
  )
}

export function AnalogyScene({ scene }: { scene: Scene }) {
  const [run, setRun] = useState(0)
  return (
    <figure className="scene">
      <div className="scene-stage">
        {scene.type === 'filter' && <FilterScene scene={scene} run={run} />}
        {scene.type === 'sort' && <SortScene scene={scene} run={run} />}
        {scene.type === 'group' && <GroupScene scene={scene} run={run} />}
        {scene.type === 'match' && <MatchScene scene={scene} run={run} />}
        {scene.type === 'ruler' && <RulerScene scene={scene} run={run} />}
        {scene.type === 'steps' && <StepsScene scene={scene} run={run} />}
        {scene.type === 'tally' && <TallyScene scene={scene} run={run} />}
        {scene.type === 'exchange' && <ExchangeScene scene={scene} run={run} />}
      </div>
      <button type="button" className="btn quiet small replay" onClick={() => setRun((r) => r + 1)}>
        <L en="↻ Replay" mr="पुन्हा पाहा" />
      </button>
    </figure>
  )
}

type Of<K extends Scene['type']> = Extract<Scene, { type: K }>

function FilterScene({ scene, run }: { scene: Of<'filter'>; run: number }) {
  const phase = usePhases(1, 1600, run)
  return (
    <div className="filter-wrap">
      <Bi t={scene.rule} className="rule-card" />
      <div className="filter-grid">
        {scene.items.map((it, i) => (
          <motion.div
            key={`${run}-${i}`}
            className={`chip ${phase && it.pass ? 'pass' : ''} ${phase && !it.pass ? 'fail' : ''}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: phase && !it.pass ? 0.35 : 1, y: phase && it.pass ? -4 : 0, scale: phase && it.pass ? 1.04 : 1 }}
            transition={{ delay: phase ? i * 0.05 : i * 0.07, type: 'spring', stiffness: 260, damping: 20 }}
          >
            <span className="chip-icon" aria-hidden>{it.icon}</span>
            <Label item={it} />
            {phase > 0 && <span className="chip-mark" aria-label={it.pass ? 'kept' : 'removed'}>{it.pass ? '✓' : '✕'}</span>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SortScene({ scene, run }: { scene: Of<'sort'>; run: number }) {
  const phase = usePhases(2, 1400, run)
  const max = Math.max(...scene.items.map((i) => i.value))
  const order = phase >= 1 ? [...scene.items].sort((a, b) => b.value - a.value) : scene.items
  return (
    <div className="sort-row">
      {order.map((it, rank) => {
        const winner = phase >= 2 && rank < scene.top
        return (
          <motion.div key={`${run}-${it.label}`} layout transition={{ type: 'spring', stiffness: 200, damping: 22 }} className={`sort-col ${phase >= 2 && !winner ? 'dim' : ''}`}>
            <div className="medal">{winner ? `#${rank + 1}` : ''}</div>
            <div className="sort-icon" aria-hidden>{it.icon}</div>
            <motion.div className="stem" initial={{ height: 0 }} animate={{ height: 20 + (it.value / max) * 120 }} transition={{ duration: 0.6 }} />
            <div className="sort-label">{it.label}</div>
            <div className="sort-value tabular">
              {it.value} {scene.unit}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function GroupScene({ scene, run }: { scene: Of<'group'>; run: number }) {
  const phase = usePhases(2, 1400, run)
  const counts = scene.groups.map((_, gi) => scene.items.filter((it) => it.group === gi).length)
  const maxCount = Math.max(...counts)
  return (
    <div className="group-wrap">
      {phase === 0 && (
        <div className="basket">
          {scene.items.map((it, i) => (
            <motion.span key={`${run}-${i}`} layoutId={`g${run}-${i}`} className={`token g${it.group}`} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1, rotate: ((i * 37) % 30) - 15 }} transition={{ delay: i * 0.05 }}>
              {it.icon}
            </motion.span>
          ))}
        </div>
      )}
      {phase >= 1 && (
        <div className="piles">
          {scene.groups.map((g, gi) => {
            const members = scene.items.map((it, i) => ({ ...it, i })).filter((it) => it.group === gi)
            const highlight = phase >= 2 && members.length === maxCount
            return (
              <div key={gi} className={`pile ${highlight ? 'highlight' : ''}`}>
                <div className="pile-head">
                  <span aria-hidden>{g.icon}</span> <Label item={g} />
                </div>
                <div className="pile-items">
                  {members.map((m) => (
                    <motion.span key={m.i} layoutId={`g${run}-${m.i}`} className={`token g${m.group}`}>
                      {m.icon}
                    </motion.span>
                  ))}
                </div>
                <motion.div className="pile-count tabular" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}>
                  COUNT = {members.length}
                </motion.div>
              </div>
            )
          })}
        </div>
      )}
      {phase >= 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Bi t={scene.note} className="scene-note" />
        </motion.div>
      )}
    </div>
  )
}

function MatchScene({ scene, run }: { scene: Of<'match'>; run: number }) {
  const phase = usePhases(2, 1500, run)
  const { marathi } = useLang()
  const ROW = marathi ? 64 : 56
  const W = 560
  const L = 220
  const R = 340
  const linkedLeft = new Set(scene.links.map(([l]) => l))
  const rowOfRight = (j: number) => (phase >= 2 ? scene.links.find(([, r]) => r === j)?.[0] ?? j : j)
  const h = Math.max(scene.left.length, scene.right.length) * ROW + 36
  const y = (row: number) => 36 + row * ROW + (ROW - 10) / 2
  return (
    <div className="match-scroll">
      <div className="match" style={{ width: W, height: h + 56 }}>
        <Bi t={scene.leftTitle} className="match-title" />
        <Bi t={scene.rightTitle} className="match-title right" />
        <svg className="match-lines" width={W} height={h} aria-hidden>
          {phase === 1 &&
            scene.links.map(([l, r], i) => (
              <motion.path key={`${run}-c${i}`} d={`M${L} ${y(l)} C${(L + R) / 2} ${y(l)} ${(L + R) / 2} ${y(r)} ${R} ${y(r)}`} fill="none" stroke="var(--link)" strokeWidth={2.5} pathLength={1} strokeDasharray="1" initial={{ strokeDashoffset: 1 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 0.6, delay: i * 0.25 }} />
            ))}
          {phase >= 2 && scene.links.map(([l], i) => <motion.path key={`${run}-s${i}`} d={`M${L} ${y(l)} L${R} ${y(l)}`} stroke="var(--link)" strokeWidth={2.5} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />)}
        </svg>
        {scene.left.map((it, i) => {
          const orphan = !linkedLeft.has(i)
          const gone = phase >= 2 && orphan && scene.mode === 'inner'
          const glow = phase >= 2 && orphan && scene.mode === 'left'
          return (
            <motion.div key={`${run}-l${i}`} className={`match-card ${glow ? 'orphan' : ''}`} style={{ top: 36 + i * ROW, left: 0, width: L, height: ROW - 10 }} initial={{ x: -40, opacity: 0 }} animate={{ x: glow ? [0, -5, 5, -3, 3, 0] : 0, opacity: gone ? 0.15 : 1 }} transition={{ delay: phase ? 0.6 : i * 0.08, duration: glow ? 0.5 : 0.35 }}>
              <span className="chip-icon" aria-hidden>{it.icon}</span> <Label item={it} />
            </motion.div>
          )
        })}
        {scene.right.map((it, j) => (
          <motion.div key={`${run}-r${j}`} className="match-card right" style={{ left: R, width: W - R, height: ROW - 10 }} initial={{ x: 40, opacity: 0, top: 36 + j * ROW }} animate={{ x: 0, opacity: 1, top: 36 + rowOfRight(j) * ROW }} transition={{ delay: phase >= 2 ? 0 : 0.3 + j * 0.08, type: 'spring', stiffness: 160, damping: 20 }}>
            <span className="chip-icon" aria-hidden>{it.icon}</span> <Label item={it} />
          </motion.div>
        ))}
        {phase >= 2 &&
          scene.mode === 'left' &&
          scene.left.map((_, i) =>
            linkedLeft.has(i) ? null : (
              <motion.div key={`n${run}${i}`} className="null-slot" style={{ top: 36 + i * ROW, left: R, width: W - R, height: ROW - 10 }} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}>
                NULL
              </motion.div>
            ),
          )}
        {phase >= 2 && (
          <motion.div className="match-note" style={{ top: h + 8 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <Bi
              className="scene-note"
              t={scene.mode === 'inner' ? { en: 'INNER JOIN keeps only rows with a partner.', mr: 'INNER JOIN फक्त जोडीदार असलेल्या rows ठेवतो.' } : { en: 'LEFT JOIN keeps every left row. A blank partner = NULL.', mr: 'LEFT JOIN डावीकडची प्रत्येक row ठेवतो. रिकामा जोडीदार = NULL.' }}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}

function RulerScene({ scene, run }: { scene: Of<'ruler'>; run: number }) {
  const phase = usePhases(scene.marks.length, 900, run)
  const { marathi } = useLang()
  const W = 640
  const x = (v: number) => 20 + ((v - scene.min) / (scene.max - scene.min)) * (W - 40)
  const mid = (scene.lo + scene.hi) / 2
  return (
    <div className="ruler-scroll">
      <div className="ruler" style={{ width: W }}>
        <div className="ruler-band" style={{ left: x(scene.lo), width: x(scene.hi) - x(scene.lo) }}>
          {scene.lo}–{scene.hi} {scene.unit}
        </div>
        <div className="ruler-line" />
        {Array.from({ length: Math.floor((scene.max - scene.min) / 10) + 1 }, (_, i) => scene.min + i * 10).map((v) => (
          <div key={v} className="tick" style={{ left: x(v) }}>
            <span className="tabular">{v}</span>
          </div>
        ))}
        {scene.marks.map((m, i) => {
          const ok = m.value >= scene.lo && m.value <= scene.hi
          const side = m.value < scene.lo || (ok && m.value > mid) ? 'left' : 'right'
          return phase > i ? (
            <motion.div key={`${run}-${i}`} className={`kid ${ok ? 'ok' : 'no'} ${side}`} style={{ left: x(m.value) }} initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
              <div className="kid-box">
                <div className="kid-icon" aria-hidden>🧒</div>
                <div className="kid-val tabular">
                  {m.value} {scene.unit}
                </div>
                <div className="kid-note">
                  {ok ? '✓' : '✕'} {m.note}
                </div>
                {marathi && <div className="kid-note" lang="mr">{m.mr}</div>}
              </div>
              <div className="kid-stick" />
            </motion.div>
          ) : null
        })}
      </div>
    </div>
  )
}

function StepsScene({ scene, run }: { scene: Of<'steps'>; run: number }) {
  const stop = scene.breakAt ?? scene.steps.length - 1
  const phase = usePhases(stop + 2, 900, run)
  const pos = Math.min(phase, stop)
  const broken = scene.breakAt !== undefined && phase > stop
  return (
    <div className="steps">
      <ol className="steps-row">
        {scene.steps.map((s, i) => (
          <li key={i} className={`step ${i <= pos ? 'reached' : ''} ${broken && i === stop ? 'broken' : ''} ${broken && i > stop ? 'never' : ''}`}>
            <motion.div className="step-icon" aria-hidden animate={i === pos ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.4 }}>
              {s.icon}
            </motion.div>
            <Label item={s} />
          </li>
        ))}
      </ol>
      {broken && scene.breakNote && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Bi t={scene.breakNote} className="scene-note warn" />
        </motion.div>
      )}
    </div>
  )
}

function TallyScene({ scene, run }: { scene: Of<'tally'>; run: number }) {
  const phase = usePhases(scene.items.length, 900, run)
  let total = 0
  const rows = scene.items.map((it) => ({ ...it, total: (total += it.value) }))
  const fmt = (n: number) => `${n < 0 ? '−' : ''}${scene.unit}${Math.abs(n).toLocaleString('en-IN')}`
  return (
    <table className="tally">
      <thead>
        <tr>
          <th scope="col"><L en="Entry" mr="नोंद" /></th>
          <th scope="col" className="num"><L en="Amount" mr="रक्कम" /></th>
          <th scope="col" className="num"><L en="Balance" mr="शिल्लक" /></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) =>
          phase > i ? (
            <motion.tr key={`${run}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={scene.alertBelow !== undefined && r.total < scene.alertBelow ? 'alert' : ''}>
              <td>
                <span aria-hidden>{r.icon}</span> <Label item={r} />
              </td>
              <td className={`num tabular ${r.value < 0 ? 'neg' : 'pos'}`}>
                {r.value > 0 ? '+' : ''}
                {fmt(r.value)}
              </td>
              <td className="num tabular strong">{fmt(r.total)}</td>
            </motion.tr>
          ) : null,
        )}
      </tbody>
    </table>
  )
}

/** A request card walks from the client to the server; the server works; a response card walks back. */
function ExchangeScene({ scene, run }: { scene: Of<'exchange'>; run: number }) {
  const phase = usePhases(4, 1200, run)
  return (
    <div className="exchange">
      <div className="ex-row">
        <div className={`ex-party ${phase === 0 || phase >= 3 ? 'active' : ''}`}>
          <span className="ex-icon" aria-hidden>{scene.client.icon}</span>
          <Label item={scene.client} />
        </div>
        <div className="ex-lane">
          <div className="ex-track" aria-hidden />
          {phase >= 1 && phase < 3 && (
            <motion.div key={`rq-${run}`} className="ex-card request" initial={{ left: '0%', x: '0%', opacity: 0 }} animate={{ left: '100%', x: '-100%', opacity: 1 }} transition={{ duration: 0.9, ease: 'easeInOut' }}>
              <span aria-hidden>{scene.request.icon}</span>
              <Label item={scene.request} />
            </motion.div>
          )}
          {phase >= 3 && (
            <motion.div key={`rs-${run}`} className="ex-card response" initial={{ left: '100%', x: '-100%', opacity: 0 }} animate={{ left: '0%', x: '0%', opacity: 1 }} transition={{ duration: 0.9, ease: 'easeInOut' }}>
              <span aria-hidden>{scene.response.icon}</span>
              <Label item={scene.response} />
            </motion.div>
          )}
          <div className="ex-arrows" aria-hidden>
            <span className={phase >= 1 ? 'on' : ''}>
              request →
            </span>
            <span className={phase >= 3 ? 'on' : ''}>
              ← response
            </span>
          </div>
        </div>
        <motion.div className={`ex-party ${phase === 2 ? 'active working' : ''}`} animate={phase === 2 ? { rotate: [0, -3, 3, -2, 0] } : { rotate: 0 }} transition={{ duration: 0.6, repeat: phase === 2 ? 1 : 0 }}>
          <span className="ex-icon" aria-hidden>{scene.server.icon}</span>
          <Label item={scene.server} />
        </motion.div>
      </div>
      {phase >= 4 && scene.note && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Bi t={scene.note} className="scene-note" />
        </motion.div>
      )}
    </div>
  )
}
