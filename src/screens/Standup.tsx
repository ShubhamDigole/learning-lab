import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { allLessons } from '../content/index.ts'
import type { ExamQ } from '../content/types.ts'
import { Portrait } from '../components/Portrait.tsx'
import { Confetti } from '../components/Celebrate.tsx'
import { OptionLabel } from '../components/TaskRunner.tsx'
import { highlightCode } from '../components/CodeExample.tsx'
import type { ProgressApi } from '../state/progress.ts'
import { Bi, L } from '../lib/i18n.tsx'
import { sfx } from '../lib/sound.ts'

export function dueSkills(api: ProgressApi): string[] {
  const now = Date.now()
  return Object.entries(api.progress.skills)
    .filter(([, s]) => s.state !== 'seen' && s.due <= now)
    .map(([k]) => k)
}

/** Meera's 2-minute daily standup: spaced recall questions mixed across lessons. */
export function Standup({ api, onExit }: { api: ProgressApi; onExit: () => void }) {
  const [items] = useState(() => {
    const due = dueSkills(api)
    const practiced = Object.entries(api.progress.skills)
      .filter(([, s]) => s.state !== 'seen')
      .map(([k]) => k)
    const pool = due.length ? due : practiced
    const qs: { skill: string; item: ExamQ }[] = []
    for (const l of allLessons) if (pool.includes(l.skill)) for (const item of l.exam) qs.push({ skill: l.skill, item })
    return qs.sort(() => Math.random() - 0.5).slice(0, 5)
  })
  const bonus = useMemo(() => dueSkills(api).length === 0, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const cur = items[i]

  if (items.length === 0)
    return (
      <div className="standup center">
        <Portrait who="meera" mood="happy" />
        <Bi t={{ en: 'Nothing to review yet. Finish your first lesson and I will quiz you tomorrow.', mr: 'अजून उजळणीसाठी काही नाही. पहिला धडा पूर्ण कर, उद्या मी प्रश्न विचारेन.' }} className="lead" />
        <button type="button" className="btn primary" onClick={onExit}>
          Back to the map
        </button>
      </div>
    )

  if (!cur)
    return (
      <div className="standup center">
        <Confetti />
        <Portrait who="meera" mood="happy" />
        <h2 className="tabular">
          Standup done: {score}/{items.length}
        </h2>
        <Bi t={score === items.length ? { en: 'Flawless. Those skills are sticking.', mr: 'एकदम बरोबर. ही कौशल्यं पक्की होतायत.' } : { en: 'Missed ones come back sooner. That is how memory works.', mr: 'चुकलेले प्रश्न लवकर परत येतील. स्मरणशक्ती अशीच काम करते.' }} className="lead" />
        <button type="button" className="btn primary big" onClick={onExit}>
          Back to work ▸
        </button>
      </div>
    )

  const answer = (k: number) => {
    if (picked !== null) return
    setPicked(k)
    const ok = k === cur.item.answer
    if (ok) {
      sfx.chime()
      setScore((s) => s + 1)
    } else sfx.buzz()
    if (!bonus) api.reviewSkill(cur.skill, ok)
  }

  return (
    <div className="standup">
      <header className="lesson-head">
        <button type="button" className="btn quiet small" onClick={onExit}>
          <L en="← Map" mr="नकाशा" />
        </button>
        <div className="lesson-heading">
          <div className="eyebrow"><L en={bonus ? 'Daily standup, bonus round' : 'Daily standup'} mr="रोजची उजळणी" /></div>
          <h1 className="lesson-title">Two minutes with Meera</h1>
        </div>
        <span className="skill-tag tabular">
          {i + 1} / {items.length}
        </span>
      </header>
      <div className="standup-q">
        <Portrait who="meera" mood={picked === null ? 'neutral' : picked === cur.item.answer ? 'happy' : 'worried'} size={84} />
        <AnimatePresence mode="wait">
          <motion.div key={i} className="bubble" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="eyebrow">{cur.skill}</div>
            <Bi t={cur.item.q} />
          </motion.div>
        </AnimatePresence>
      </div>
      {cur.item.code && (
        <pre className="code-card">
          <code>{highlightCode(cur.item.code)}</code>
        </pre>
      )}
      <div className="options" role="radiogroup">
        {cur.item.options.map((o, k) => (
          <button type="button" role="radio" aria-checked={picked === k} key={k} className={`option ${picked !== null && k === cur.item.answer ? 'correct' : ''} ${picked === k && k !== cur.item.answer ? 'wrong' : ''}`} onClick={() => answer(k)}>
            <span className="option-box" aria-hidden>{String.fromCharCode(65 + k)}</span>
            <OptionLabel o={o} />
          </button>
        ))}
      </div>
      {picked !== null && (
        <motion.div className={`feedback ${picked === cur.item.answer ? 'ok' : 'bad'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="status">
          <Bi t={cur.item.explain} />
          <div className="next-row">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setPicked(null)
                setI(i + 1)
              }}
            >
              <L en="Next" mr="पुढे" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
