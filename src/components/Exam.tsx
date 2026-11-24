import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { ExamQ } from '../content/types.ts'
import { Bi, L } from '../lib/i18n.tsx'
import { sfx } from '../lib/sound.ts'
import { highlightCode } from './CodeExample.tsx'
import { OptionLabel } from './TaskRunner.tsx'
import { Stamp } from './Celebrate.tsx'

export const PASS_RATIO = 0.75

/** Graded exam: one question at a time, instant feedback, 75% to pass, unlimited retakes. */
export function Exam({ questions, onPass }: { questions: ExamQ[]; onPass: (score: number, total: number) => void }) {
  const [attempt, setAttempt] = useState(0)
  const order = useMemo(() => questions.map((_, i) => i).sort(() => Math.random() - 0.5), [questions, attempt])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const done = i >= order.length
  const need = Math.ceil(questions.length * PASS_RATIO)

  if (done) {
    const passed = score >= need
    return (
      <div className={`exam-result ${passed ? 'pass' : 'fail'}`}>
        <div className="exam-score tabular">
          {score} / {questions.length}
        </div>
        {passed ? (
          <>
            <Bi t={{ en: 'Exam passed. This skill is now in your Case Journal.', mr: 'परीक्षा उत्तीर्ण. हे कौशल्य आता तुमच्या केस जर्नलमध्ये आहे.' }} className="lead" />
            <Stamp text="PASSED" tone="green" />
            <button type="button" className="btn primary big" onClick={() => onPass(score, questions.length)}>
              <L en="See the recap" mr="सारांश पाहा" />
            </button>
          </>
        ) : (
          <>
            <Bi t={{ en: `You need ${need} to pass. Review the lesson and try again: the questions shuffle each time.`, mr: `उत्तीर्ण होण्यासाठी ${need} हवेत. धडा पुन्हा पाहा आणि परत प्रयत्न करा: प्रश्न प्रत्येक वेळी बदलतात.` }} className="lead" />
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setAttempt((a) => a + 1)
                setI(0)
                setScore(0)
                setPicked(null)
              }}
            >
              <L en="Retake the exam" mr="परीक्षा पुन्हा द्या" />
            </button>
          </>
        )}
      </div>
    )
  }

  const q = questions[order[i]]
  const answer = (k: number) => {
    if (picked !== null) return
    setPicked(k)
    if (k === q.answer) {
      sfx.chime()
      setScore((s) => s + 1)
    } else sfx.buzz()
  }

  return (
    <div className="exam">
      <div className="exam-progress" aria-hidden>
        {order.map((_, k) => (
          <span key={k} className={k < i ? 'done' : k === i ? 'now' : ''} />
        ))}
      </div>
      <div className="step-counter tabular">
        <L en={`Question ${i + 1} of ${order.length}`} mr={`प्रश्न ${i + 1} / ${order.length}`} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={`${attempt}-${i}`} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
          <Bi t={q.q} className="prompt" />
          {q.code && (
            <pre className="code-card">
              <code>{highlightCode(q.code)}</code>
            </pre>
          )}
          <div className="options" role="radiogroup">
            {q.options.map((o, k) => (
              <button type="button" role="radio" aria-checked={picked === k} key={k} className={`option ${picked !== null && k === q.answer ? 'correct' : ''} ${picked === k && k !== q.answer ? 'wrong' : ''}`} onClick={() => answer(k)} disabled={picked !== null && picked !== k && k !== q.answer}>
                <span className="option-box" aria-hidden>{String.fromCharCode(65 + k)}</span>
                <OptionLabel o={o} />
              </button>
            ))}
          </div>
          {picked !== null && (
            <motion.div className={`feedback ${picked === q.answer ? 'ok' : 'bad'}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} role="status">
              <Bi t={q.explain} />
              <div className="next-row">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    setPicked(null)
                    setI(i + 1)
                  }}
                >
                  {i === order.length - 1 ? <L en="Finish" mr="पूर्ण" /> : <L en="Next question" mr="पुढचा प्रश्न" />} ▸
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
