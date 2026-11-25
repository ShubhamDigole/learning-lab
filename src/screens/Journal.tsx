import { motion } from 'framer-motion'
import { useState } from 'react'
import { acts, allLessons, incidents } from '../content/index.ts'
import type { ProgressApi } from '../state/progress.ts'
import { Bi, L } from '../lib/i18n.tsx'

const STATE_LABEL = { seen: <L en="Seen" mr="पाहिलं" />, practiced: <L en="Practiced" mr="सराव" />, mastered: <L en="Mastered" mr="प्रभुत्व" /> } as const

export function Journal({ api, onExit }: { api: ProgressApi; onExit: () => void }) {
  const { progress } = api
  const [confirmReset, setConfirmReset] = useState(false)
  const [tab, setTab] = useState<'skills' | 'interview'>('skills')
  const [search, setSearch] = useState('')
  const ivLessons = allLessons.filter((l) => l.interview?.length)
  const ivDone = ivLessons.filter((l) => progress.completed[l.id])
  const q = search.trim().toLowerCase()
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

      <div className="journal-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'skills'} className={tab === 'skills' ? 'on' : ''} onClick={() => setTab('skills')}>
          📒 <L en="Skills" mr="कौशल्यं" />
        </button>
        <button type="button" role="tab" aria-selected={tab === 'interview'} className={tab === 'interview' ? 'on' : ''} onClick={() => setTab('interview')}>
          🎤 <L en="Interview prep" mr="मुलाखतीची तयारी" /> ({ivDone.reduce((n, l) => n + (l.interview?.length ?? 0), 0)})
        </button>
      </div>

      {tab === 'interview' && (
        <section className="journal-act interview-prep">
          <Bi t={{ en: 'Model answers from every level you have finished. Read the question, answer it out loud, then open the model answer.', mr: 'तुम्ही पूर्ण केलेल्या प्रत्येक लेव्हलमधली आदर्श उत्तरं. प्रश्न वाचा, मोठ्याने उत्तर द्या, मग आदर्श उत्तर उघडा.' }} className="muted" />
          <label className="iv-search">
            <span className="sr-only">Search</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search: lifecycle, idempotent, cold start..." aria-label="Search interview questions" />
          </label>
          {ivDone.length === 0 && (
            <p className="muted">
              <L en="Finish a level that has an Interview corner (the S3 and Lambda chapters in the Data World) and its questions appear here." mr="Interview corner असलेली एखादी लेव्हल पूर्ण करा (Data World मधले S3 आणि Lambda chapters), मग तिचे प्रश्न इथे दिसतील." />
            </p>
          )}
          {ivDone.map((l) => {
            const items = (l.interview ?? []).filter((it) => !q || (it.q.en + ' ' + it.a.en + ' ' + it.q.mr + ' ' + it.a.mr).toLowerCase().includes(q))
            if (!items.length) return null
            return (
              <div key={l.id} className="interview">
                <h3>
                  <span className="li-code tabular">{l.code}</span> <L en={l.title.en} mr={l.title.mr} />
                </h3>
                {items.map((it, i) => (
                  <details key={i} className="iv-item">
                    <summary>
                      <Bi t={it.q} />
                    </summary>
                    <div className="iv-answer">
                      <Bi t={it.a} />
                    </div>
                  </details>
                ))}
              </div>
            )
          })}
          {ivLessons.length > ivDone.length && (
            <p className="muted small">
              <L en={`${ivLessons.length - ivDone.length} more levels with interview questions unlock as you play.`} mr={`खेळत जाल तसे interview प्रश्न असलेल्या आणखी ${ivLessons.length - ivDone.length} लेव्हल उघडतील.`} />
            </p>
          )}
        </section>
      )}

      {tab === 'skills' && acts
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

      {tab === 'skills' && <section className="journal-act">
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
      </section>}

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
