import { animate, AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Incident } from '../content/types.ts'
import { Confetti, Stamp } from '../components/Celebrate.tsx'
import { TaskRunner } from '../components/TaskRunner.tsx'
import { Bi, L } from '../lib/i18n.tsx'
import { sfx } from '../lib/sound.ts'

type Phase = 'cold' | 'replay' | 'rewinding' | 'rewind' | 'verdict'

export function IncidentReplay({ incident, onCaught, onExit }: { incident: Incident; onCaught: () => void; onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>('cold')
  const [beat, setBeat] = useState(0)
  const counter = useMotionValue(0)
  const shown = useTransform(counter, (v) => `${incident.counterPrefix}${v.toFixed(Number.isInteger(incident.counterTo) ? 0 : 2)}${incident.counterSuffix}`)

  useEffect(() => {
    if (phase !== 'cold') return
    const c = animate(counter, incident.counterTo, { duration: 3, ease: 'easeOut' })
    return () => c.stop()
  }, [phase, counter, incident.counterTo])

  useEffect(() => {
    if (phase !== 'rewinding') return
    sfx.rewind()
    const t = setTimeout(() => setPhase('rewind'), 2000)
    return () => clearTimeout(t)
  }, [phase])

  return (
    <div className="incident">
      <header className="lesson-head">
        <button type="button" className="btn quiet small" onClick={onExit}>
          <L en="← Map" mr="नकाशा" />
        </button>
        <div className="lesson-heading">
          <div className="lesson-meta"><span className="lesson-code">Incident file</span> <span>{incident.year}</span></div>
          <Bi t={incident.title} as="h1" className="lesson-title" />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {phase === 'cold' && (
          <motion.section key="cold" className="panel cold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="ticker" aria-hidden>
              <div className="ticker-inner">
                Breaking news: {incident.headline}. Breaking news: {incident.headline}.
              </div>
            </div>
            <article className="newspaper">
              <div className="masthead">The Kestrel Chronicle<span>A fictional paper telling a real story</span></div>
              <h2 className="headline">{incident.headline}</h2>
              <motion.div className="counter tabular">{shown}</motion.div>
              <Bi t={incident.counterLabel} className="muted" />
            </article>
            <button type="button" className="btn primary big" onClick={() => setPhase('replay')}>
              <L en="▶ Watch what happened" mr="काय घडलं ते पाहा" />
            </button>
          </motion.section>
        )}

        {phase === 'replay' && (
          <motion.section key="replay" className="panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ol className="timeline">
              {incident.beats.map((b, i) => (
                <li key={i}>
                  <button type="button" className={`tl-beat ${i <= beat ? 'on' : ''} ${i === beat ? 'current' : ''}`} onClick={() => setBeat(i)} aria-current={i === beat ? 'step' : undefined}>
                    <span className="tl-icon" aria-hidden>{b.icon}</span>
                    <Bi t={b.time} className="tl-time" />
                  </button>
                </li>
              ))}
            </ol>
            <AnimatePresence mode="wait">
              <motion.div key={beat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Bi t={incident.beats[beat].text} className="tl-text" />
              </motion.div>
            </AnimatePresence>
            <div className="lesson-foot">
              <button type="button" className="btn quiet" onClick={() => setBeat(Math.max(0, beat - 1))} disabled={beat === 0}>
                ← Back
              </button>
              {beat < incident.beats.length - 1 ? (
                <button type="button" className="btn" onClick={() => setBeat(beat + 1)}>
                  Next ▸
                </button>
              ) : (
                <button type="button" className="btn primary big" onClick={() => setPhase('rewinding')}>
                  <L en="◀◀ Rewind time and stop it" mr="वेळ मागे घ्या" />
                </button>
              )}
            </div>
          </motion.section>
        )}

        {phase === 'rewinding' && (
          <motion.section key="rw" className="panel rewinding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="vhs">◀◀ REWIND</div>
            <div className="rw-icons" aria-hidden>
              {[...incident.beats].reverse().map((b, i) => (
                <motion.span key={i} initial={{ x: 260, opacity: 0 }} animate={{ x: -260, opacity: [0, 1, 0] }} transition={{ duration: 0.5, delay: i * 0.28 }}>
                  {b.icon}
                </motion.span>
              ))}
            </div>
          </motion.section>
        )}

        {phase === 'rewind' && (
          <motion.section key="rewind" className="panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="eyebrow"><L en="The night before go-live" mr="गो-लाइव्हच्या आदल्या रात्री" /></div>
            <Bi t={incident.rewind.intro} className="lead" />
            <TaskRunner
              steps={incident.rewind.steps}
              onComplete={() => {
                onCaught()
                setPhase('verdict')
              }}
            />
          </motion.section>
        )}

        {phase === 'verdict' && (
          <motion.section key="verdict" className="panel verdict" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Confetti count={36} />
            <article className="newspaper">
              <div className="masthead">The Kestrel Chronicle<span>The timeline where a tester caught it</span></div>
              <h2 className="headline">DISASTER AVERTED: TESTER CATCHES IT BEFORE LAUNCH</h2>
              <Stamp text="CAUGHT" tone="green" />
            </article>
            <Bi t={incident.lesson} className="lead" />
            <p className="muted small">
              Read the real story:{' '}
              <a href={incident.source.url} target="_blank" rel="noreferrer">
                {incident.source.label}
              </a>
            </p>
            <button type="button" className="btn primary big" onClick={onExit}>
              Back to the map ▸
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
