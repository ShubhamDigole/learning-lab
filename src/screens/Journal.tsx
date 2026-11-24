import { motion } from 'framer-motion'
import { useState } from 'react'
import { acts, allLessons, incidents } from '../content/index.ts'
import type { ProgressApi } from '../state/progress.ts'
import { Bi, L } from '../lib/i18n.tsx'

const STATE_LABEL = { seen: <L en="Seen" mr="पाहिलं" />, practiced: <L en="Practiced" mr="सराव" />, mastered: <L en="Mastered" mr="प्रभुत्व" /> } as const

export function Journal({ api, onExit }: { api: ProgressApi; onExit: () => void }) {
  const { progress } = api
  const [confirmReset, setConfirmReset] = useState(false)
  const stateOf = (id: string, skill: string) => progress.skills[skill] ?? (progress.completed[id] ? { state: 'practiced' as const, interval: 1, due: 0 } : undefined)
  const mastered = allLessons.filter((l) => stateOf(l.id, l.skill)?.state === 'mastered').length
  const practiced = allLessons.filter((l) => {
    const s = stateOf(l.id, l.skill)
    return s && s.state !== 'seen'
  }).length

  return (
    <div className="journal">
      <header className="lesson-head">
        <button type="button" className="btn quiet small" onClick={onExit}>
          <L en="← Map" mr="नकाशा" />
        </button>
        <div className="lesson-heading">
          <div className="eyebrow"><L en="Case journal" mr="केस जर्नल" /></div>
          <h1 className="lesson-title">Your skills</h1>
        </div>
        <span className="skill-tag tabular">
          {practiced} of {allLessons.length} practiced, {mastered} mastered
        </span>
      </header>

      {acts
        .filter((a) => a.lessons.length > 0)
        .map((a) => (
          <section key={a.id} className="journal-act">
            <Bi t={a.title} as="h2" />
            <div className="skill-tree">
              {a.lessons.map((l, i) => {
                const s = stateOf(l.id, l.skill)
                return (
                  <motion.div key={l.id} className={`skill-node ${s?.state ?? 'locked'}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className="sn-top">
                      <span className="sn-code tabular">{l.code}</span>
                      <span aria-hidden>{s ? l.recap.icon : ''}</span>
                    </div>
                    <div className="sn-name">{l.skill}</div>
                    <div className="sn-state">{s ? STATE_LABEL[s.state] : <L en="Not started" mr="सुरू नाही" />}</div>
                    {progress.completed[l.id] && <Bi t={l.recap.line} className="sn-recap" />}
                  </motion.div>
                )
              })}
            </div>
          </section>
        ))}

      <section className="journal-act">
        <h2><L en="Incident wall" mr="घटनांची भिंत" /></h2>
        <div className="skill-tree">
          {incidents.map((inc) => (
            <div key={inc.id} className={`skill-node ${progress.incidents[inc.id] ? 'mastered' : 'locked'}`}>
              <div className="sn-top">
                <span className="sn-code">{inc.year}</span>
              </div>
              <Bi t={inc.title} className="sn-name" />
              <div className="sn-state">{progress.incidents[inc.id] ? <L en="Caught" mr="पकडलं" /> : <L en="Not caught yet" mr="अजून पकडलं नाही" />}</div>
            </div>
          ))}
        </div>
      </section>

      <p className="reset">
        {confirmReset ? (
          <span className="confirm">
            <L en="Erase all progress?" mr="सगळी प्रगती पुसायची?" />{' '}
            <button type="button" className="btn small danger" onClick={() => { api.reset(); setConfirmReset(false) }}>
              Yes, erase
            </button>{' '}
            <button type="button" className="btn small quiet" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button type="button" className="linklike" onClick={() => setConfirmReset(true)}>
            Reset progress
          </button>
        )}
      </p>
    </div>
  )
}
