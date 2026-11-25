import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DialogueLine, Lesson } from '../content/types.ts'
import { placeOf, trackOf } from '../content/index.ts'
import { AnalogyScene } from '../components/AnalogyScene.tsx'
import { Confetti, Stamp, Stars } from '../components/Celebrate.tsx'
import { SyntaxView } from '../components/CodeExample.tsx'
import { Dialogue } from '../components/Dialogue.tsx'
import { Exam } from '../components/Exam.tsx'
import { TaskRunner } from '../components/TaskRunner.tsx'
import type { ProgressApi } from '../state/progress.ts'
import { Bi, L } from '../lib/i18n.tsx'
import { sfx } from '../lib/sound.ts'

const STEPS = [
  { key: 'real', en: 'Real life', mr: 'रोजच्या जीवनात' },
  { key: 'solves', en: 'How it solves it', mr: 'हे कसं सोडवतं' },
  { key: 'lesson', en: 'Lesson', mr: 'धडा' },
  { key: 'syntax', en: 'Syntax', mr: 'रचना' },
  { key: 'practice', en: 'Practice', mr: 'सराव' },
  { key: 'exam', en: 'Exam', mr: 'परीक्षा' },
  { key: 'recap', en: 'Recap', mr: 'सारांश' },
] as const

const LEVEL = { basic: { en: 'Foundations', mr: 'पाया' }, intermediate: { en: 'Intermediate', mr: 'मध्यम' }, advanced: { en: 'Advanced', mr: 'प्रगत' } }

const STEP_INTRO = [
  { en: 'An everyday example first. No code.', mr: 'आधी रोजच्या जीवनातलं उदाहरण. कोड नाही.' },
  { en: 'The problem at the client, and how SQL fixes it.', mr: 'क्लायंटकडची समस्या, आणि SQL ती कशी सोडवतं.' },
  { en: 'The idea in plain words.', mr: 'सोप्या शब्दांत कल्पना.' },
  { en: 'How to write it.', mr: 'ते कसं लिहायचं.' },
  { en: 'Try it in the live database.', mr: 'लाइव्ह डेटाबेसमध्ये करून पाहा.' },
  { en: 'Four questions. Three to pass.', mr: 'चार प्रश्न. उत्तीर्ण होण्यासाठी तीन.' },
]
const SEL_INTRO: Record<number, { en: string; mr: string }> = {
  1: { en: 'The problem at the client, and how test automation fixes it.', mr: 'क्लायंटकडची समस्या, आणि test automation ती कशी सोडवतं.' },
  4: { en: 'Write Java on the left, press Run, and watch Selenium drive the practice browser.', mr: 'डावीकडे Java लिहा, Run दाबा, आणि Selenium सराव browser कसा चालवतं ते पाहा.' },
}
const API_INTRO: Record<number, { en: string; mr: string }> = {
  1: { en: 'The problem at the client, and how API testing fixes it.', mr: 'क्लायंटकडची समस्या, आणि API टेस्टिंग ती कशी सोडवतं.' },
  4: { en: 'Try it on the practice API. Nothing here touches a real server.', mr: 'सराव API वर करून पाहा. इथे कोणत्याही खऱ्या सर्व्हरला धक्का लागत नाही.' },
}

const PW_INTRO: Record<number, { en: string; mr: string }> = {
  1: { en: 'The problem at the client, and how Playwright fixes it.', mr: 'क्लायंटकडची समस्या, आणि Playwright ती कशी सोडवतं.' },
  4: { en: 'Write TypeScript on the left, press Run, and watch Playwright drive the practice browser.', mr: 'डावीकडे TypeScript लिहा, Run दाबा, आणि Playwright सराव browser कसा चालवतं ते पाहा.' },
}
const PERF_INTRO: Record<number, { en: string; mr: string }> = {
  1: { en: 'The problem at the client, and how load testing fixes it.', mr: 'क्लायंटकडची समस्या, आणि load testing ती कशी सोडवतं.' },
  4: { en: 'Write a k6 script, press Run, and watch virtual users hit the practice server in fast-forward.', mr: 'k6 script लिहा, Run दाबा, आणि virtual users सराव server वर वेगाने धडकताना पाहा.' },
}

const DATA_INTRO: Record<number, { en: string; mr: string }> = {
  1: { en: 'The problem at the client, and how a data engineer fixes it.', mr: 'क्लायंटकडची समस्या, आणि डेटा इंजिनिअर ती कशी सोडवतो.' },
  4: { en: 'Write real Python, press Run, and check what it prints. Submit also tries your code on hidden data.', mr: 'खरं Python लिहा, Run दाबा, आणि काय print होतं ते तपासा. Submit तुमचा code लपवलेल्या डेटावरही चालवून पाहतं.' },
}

export function starsFor(examScore: number, examTotal: number, hints: number) {
  if (examScore === examTotal && hints === 0) return 3
  if (hints <= 2) return 2
  return 1
}

export function LessonPlayer({ lesson, api, onExit }: { lesson: Lesson; api: ProgressApi; onExit: () => void }) {
  const [step, setStep] = useState(0)
  const [reached, setReached] = useState(0)
  const [dialogueDone, setDialogueDone] = useState(false)
  const [hints, setHints] = useState<number | null>(null)
  const [stars, setStars] = useState<number | null>(null)
  const [outroDone, setOutroDone] = useState(false)
  const clientPlace = placeOf(lesson.id)
  const track = trackOf(lesson.id)
  const narration: DialogueLine[] = useMemo(() => [{ who: 'meera', mood: 'happy', text: lesson.realLife.story }], [lesson.realLife.story])

  useEffect(() => {
    api.markSeen(lesson.skill)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id])

  const go = (s: number) => {
    sfx.click()
    setStep(s)
    setReached((r) => Math.max(r, s))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onDialogueDone = useCallback(() => setDialogueDone(true), [])
  const onOutroDone = useCallback(() => setOutroDone(true), [])
  const noop = useCallback(() => {}, [])

  // Practice and exam must be passed; the reading steps never block.
  const canNext = step === 4 ? hints !== null : step === 5 ? stars !== null : step < 6

  return (
    <div className={`lesson ${lesson.isBoss ? 'boss' : ''}`}>
      <header className="lesson-head">
        <button type="button" className="btn quiet small" onClick={onExit}>
          <L en="← Map" mr="नकाशा" />
        </button>
        <div className="lesson-heading">
          <div className="lesson-meta">
            <span className="lesson-code tabular">{lesson.code}</span>
            <L en={LEVEL[lesson.level].en} mr={LEVEL[lesson.level].mr} />
            {lesson.isBoss && <span className="boss-chip">Boss fight</span>}
          </div>
          <Bi t={lesson.title} as="h1" className="lesson-title" />
        </div>
        <span className="skill-tag">{lesson.skill}</span>
      </header>

      <div className="lesson-body">
        <nav className="rail" aria-label="Lesson steps">
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.key}>
                <button type="button" className={`rail-step ${i === step ? 'current' : ''} ${i <= reached ? 'reached' : ''}`} disabled={i > reached} onClick={() => go(i)} aria-current={i === step ? 'step' : undefined}>
                  <span className="rail-n tabular">{i + 1}</span>
                  <span className="rail-label">
                    <span>{s.en}</span>
                    <span lang="mr" className="rail-mr">{s.mr}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="lesson-main">
          {step < 6 && <Bi t={(track === 'api' && API_INTRO[step]) || (track === 'selenium' && SEL_INTRO[step]) || (track === 'playwright' && PW_INTRO[step]) || (track === 'perf' && PERF_INTRO[step]) || ((track === 'python' || track === 'dstart' || track === 'cloud' || track === 'bigdata' || track === 'warehouse') && DATA_INTRO[step]) || STEP_INTRO[step]} className="step-intro" />}
          <AnimatePresence mode="wait">
            <motion.section key={step} className={`panel ${step <= 1 ? 'panel-stage' : ''}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {step === 0 && (
                <>
                  <Bi t={lesson.realLife.title} as="h2" />
                  <Dialogue lines={narration} onDone={noop} place={lesson.realLife.place} />
                  <AnalogyScene scene={lesson.realLife.scene} />
                </>
              )}

              {step === 1 && (
                <>
                  <Dialogue lines={lesson.solves.dialogue} onDone={onDialogueDone} place={clientPlace} />
                  <motion.div className="problem-solution" initial={{ opacity: 0.35 }} animate={{ opacity: dialogueDone ? 1 : 0.35 }}>
                    <div className="ps problem">
                      <h3 className="ps-title">
                        <L en="The problem" mr="समस्या" />
                      </h3>
                      <Bi t={lesson.solves.problem} />
                    </div>
                    <div className="ps-arrow" aria-hidden>
                      →
                    </div>
                    <div className="ps solution">
                      <h3 className="ps-title">
                        <L en="How this solves it" mr="हे कसं सोडवतं" />
                      </h3>
                      <Bi t={lesson.solves.solution} />
                    </div>
                  </motion.div>
                </>
              )}

              {step === 2 && (
                <>
                  <Bi t={lesson.title} as="h2" />
                  <ol className="concepts">
                    {lesson.lesson.map((p, i) => (
                      <motion.li key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.3 }}>
                        <Bi t={p} />
                      </motion.li>
                    ))}
                  </ol>
                </>
              )}

              {step === 3 && <SyntaxView lesson={lesson} />}

              {step === 4 && (
                <>
                  <Bi t={lesson.practice.intro} className="lead" />
                  {hints === null ? (
                    <TaskRunner
                      steps={lesson.practice.steps}
                      isBoss={lesson.isBoss}
                      onComplete={(h) => {
                        setHints(h)
                        go(5)
                      }}
                    />
                  ) : (
                    <Bi t={{ en: 'Practice complete. On to the exam.', mr: 'सराव पूर्ण. आता परीक्षा.' }} className="feedback ok" />
                  )}
                </>
              )}

              {step === 5 &&
                (stars === null ? (
                  <Exam
                    questions={lesson.exam}
                    onPass={(score, total) => {
                      const s = starsFor(score, total, hints ?? 0)
                      setStars(s)
                      setTimeout(() => sfx.fanfare(), 250)
                      api.completeLesson(lesson.id, lesson.skill, s)
                      go(6)
                    }}
                  />
                ) : (
                  <Bi t={{ en: 'Exam passed.', mr: 'परीक्षा उत्तीर्ण.' }} className="feedback ok" />
                ))}

              {step === 6 && (
                <div className="recap">
                  {stars !== null && <Confetti />}
                  <motion.div className="recap-card" initial={{ rotateX: 70, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120 }}>
                    <div className="recap-icon" aria-hidden>
                      {lesson.recap.icon}
                    </div>
                    <div className="recap-skill">{lesson.skill}</div>
                    <Bi t={lesson.recap.line} className="recap-line" />
                    {stars !== null && <Stars n={stars} />}
                    <Stamp text="SAVED TO JOURNAL" tone="teal" />
                  </motion.div>
                  {lesson.interview && lesson.interview.length > 0 && (
                    <section className="interview" aria-label="Interview corner">
                      <h3>
                        <span aria-hidden>🎤</span> <L en="Interview corner: questions you may be asked" mr="मुलाखत कोपरा: तुम्हाला विचारले जाऊ शकणारे प्रश्न" />
                      </h3>
                      {lesson.interview.map((it, i) => (
                        <details key={i} className="iv-item">
                          <summary>
                            <Bi t={it.q} />
                          </summary>
                          <div className="iv-answer">
                            <Bi t={it.a} />
                          </div>
                        </details>
                      ))}
                    </section>
                  )}
                  {lesson.outro && <Dialogue lines={lesson.outro} onDone={onOutroDone} place={clientPlace} />}
                  {(outroDone || !lesson.outro) && (
                    <motion.button type="button" className="btn primary big" onClick={onExit} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <L en="Back to the map" mr="नकाशावर परत" />
                    </motion.button>
                  )}
                </div>
              )}
            </motion.section>
          </AnimatePresence>
        </div>
      </div>

      {step < 6 && (
        <footer className="action-bar">
          <div className="action-bar-inner">
            <button type="button" className="btn quiet" onClick={() => go(step - 1)} disabled={step === 0}>
              <L en="← Back" mr="मागे" />
            </button>
            <span className="action-progress tabular">
              <L en={`Step ${step + 1} of 7`} mr={`पायरी ${step + 1} / 7`} />
            </span>
            <button type="button" className="btn primary" onClick={() => go(step + 1)} disabled={!canNext} title={canNext ? undefined : step === 4 ? 'Finish the practice first' : 'Pass the exam first'}>
              {canNext ? <L en="Next" mr="पुढे" /> : step === 4 ? <L en="Finish practice to continue" mr="पुढे जाण्यासाठी सराव पूर्ण करा" /> : <L en="Pass the exam to continue" mr="पुढे जाण्यासाठी परीक्षा उत्तीर्ण व्हा" />}
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
