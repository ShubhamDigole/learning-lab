import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { ApiStep, ChoiceStep, SqlStep, T, TaskStep } from '../content/types.ts'
import { gradeExchange } from '../api/grade.ts'
import { resetServer } from '../api/server.ts'
import { ApiConsole } from './ApiConsole.tsx'
import { TestConsole } from './TestConsole.tsx'
import { SeleniumLab } from './SeleniumLab.tsx'
import { PlaywrightLab } from './PlaywrightLab.tsx'
import { LoadLab } from './LoadLab.tsx'
import { compareResults } from '../db/compare.ts'
import { runQuery, SqlError } from '../db/engine.ts'
import { Bi, L } from '../lib/i18n.tsx'
import { sfx } from '../lib/sound.ts'
import { Confetti, Stamp } from './Celebrate.tsx'
import { JoinVisualizer } from './JoinVisualizer.tsx'
import { Gremlin, Portrait } from './Portrait.tsx'
import { QueryConsole } from './QueryConsole.tsx'

/** Runs a list of practice steps. Calls onComplete(hintsUsed) when every step is solved. */
export function TaskRunner({ steps, isBoss, onComplete }: { steps: TaskStep[]; isBoss?: boolean; onComplete: (hintsUsed: number) => void }) {
  // Every practice session starts the practice API from the same data (runs before any console renders).
  useState(() => resetServer())
  const [idx, setIdx] = useState(0)
  const [solved, setSolved] = useState(false)
  const [hintsShown, setHintsShown] = useState(0)
  const [totalHints, setTotalHints] = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: T } | null>(null)
  const [resultCount, setResultCount] = useState(0)
  const [hit, setHit] = useState(0)
  const step = steps[idx]
  const maxHints = isBoss ? Math.min(2, step.hints.length) : step.hints.length

  const succeed = (count = 0) => {
    sfx.thud()
    setTimeout(() => sfx.chime(), 150)
    setResultCount(count)
    setSolved(true)
    setHit((h) => h + 1)
    setFeedback({ ok: true, text: step.successLine ?? { en: 'Evidence accepted.', mr: 'पुरावा स्वीकारला.' } })
  }
  const fail = (text: T) => {
    sfx.buzz()
    setFeedback({ ok: false, text })
  }

  const next = () => {
    if (idx === steps.length - 1) return onComplete(totalHints)
    setIdx(idx + 1)
    setSolved(false)
    setHintsShown(0)
    setFeedback(null)
  }

  const showHint = () => {
    if (hintsShown >= maxHints) return
    sfx.click()
    setHintsShown(hintsShown + 1)
    setTotalHints((t) => t + 1)
  }

  return (
    <div className="task">
      {isBoss && <BossBar total={steps.length} remaining={steps.length - idx - (solved ? 1 : 0)} hit={hit} />}
      <div className="step-counter tabular">
        <L en={`Task ${idx + 1} of ${steps.length}`} mr={`काम ${idx + 1} / ${steps.length}`} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          <Bi t={step.prompt} className="prompt" />
          {step.kind === 'sql' && <SqlStepView step={step} solved={solved} onSuccess={succeed} onFail={fail} />}
          {step.kind === 'choice' && <ChoiceStepView step={step} solved={solved} onSuccess={() => succeed()} onFail={fail} />}
          {step.kind === 'api' && <ApiStepView step={step} solved={solved} onSuccess={() => succeed()} onFail={fail} />}
          {step.kind === 'test' && <TestConsole step={step} solved={solved} onSuccess={() => succeed()} onFail={fail} />}
          {step.kind === 'selenium' && <SeleniumLab key={idx} step={step} solved={solved} onSuccess={() => succeed()} onFail={fail} />}
          {step.kind === 'playwright' && <PlaywrightLab key={idx} step={step} solved={solved} onSuccess={() => succeed()} onFail={fail} />}
          {step.kind === 'perf' && <LoadLab key={idx} step={step} solved={solved} onSuccess={() => succeed()} onFail={fail} />}
        </motion.div>
      </AnimatePresence>

      <div className="hint-row">
        {!solved && (
          <button type="button" className="btn quiet" onClick={showHint} disabled={hintsShown >= maxHints}>
            <L en={`Ask Meera for a hint (${maxHints - hintsShown} left)`} mr="मीराला हिंट विचारा" />
          </button>
        )}
        <div className="hints">
          {step.hints.slice(0, hintsShown).map((h, i) => (
            <motion.div key={i} className="hint" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
              <Portrait who="meera" mood="neutral" size={34} />
              <div>
                <div className="eyebrow">Hint {i + 1}</div>
                <Bi t={h} className={h.en === h.mr ? 'mono hint-code' : ''} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div key={feedback.text.en} role="status" className={`feedback ${feedback.ok ? 'ok' : 'bad'}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Bi t={feedback.text} />
            {feedback.ok && <Stamp text={isBoss ? 'HIT' : 'EVIDENCE'} tone="green" />}
            {feedback.ok && <Confetti count={14} />}
          </motion.div>
        )}
      </AnimatePresence>

      {solved && step.kind === 'sql' && step.visual === 'join' && <JoinVisualizer total={resultCount} />}
      {solved && step.kind === 'choice' && <Bi t={step.explain} className="explain-box" />}

      {solved && (
        <motion.div className="next-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <button type="button" className="btn primary big" onClick={next}>
            {idx === steps.length - 1 ? <L en="Practice done" mr="सराव पूर्ण" /> : <L en="Next step" mr="पुढची पायरी" />}
          </button>
        </motion.div>
      )}
    </div>
  )
}

function SqlStepView({ step, solved, onSuccess, onFail }: { step: SqlStep; solved: boolean; onSuccess: (count: number) => void; onFail: (t: T) => void }) {
  const [busy, setBusy] = useState(false)
  const submit = async (code: string) => {
    if (solved) return
    setBusy(true)
    try {
      const actual = await runQuery(code)
      const expected = await runQuery(step.expected)
      const out = compareResults(actual, expected, step.orderMatters)
      if (out.ok) onSuccess(actual.rows.length)
      else onFail(out.message)
    } catch (e) {
      onFail(e instanceof SqlError ? { en: e.message, mr: e.mr } : { en: String(e), mr: '' })
    } finally {
      setBusy(false)
    }
  }
  return <QueryConsole initial={step.starter ?? ''} onSubmit={submit} submitting={busy || solved} />
}

const CODE_LIKE = /page\.|expect\(|await |http\.|getBy|toHave|=>|p\(\d+\)|rate<|sleep\(|SELECT|WHERE|ORDER|GROUP|CHECK|IN \(|=|^(GET|POST|PUT|PATCH|DELETE)\b|^\/|^[{[]|pm\.|Bearer|Content-Type|^\d{3}\b|^[a-z]+(\.[a-zA-Z0-9[\]]+)+$/

export function OptionLabel({ o }: { o: ChoiceStep['options'][number] }) {
  return typeof o === 'string' ? <span className={CODE_LIKE.test(o) ? 'mono small-code' : ''}>{o}</span> : <Bi t={o} as="span" />
}

function ApiStepView({ step, solved, onSuccess, onFail }: { step: ApiStep; solved: boolean; onSuccess: () => void; onFail: (t: T) => void }) {
  return (
    <ApiConsole
      initial={step.starter}
      submitting={solved}
      onSubmit={(draft, res) => {
        if (solved) return
        const g = gradeExchange(draft, res, step.expect)
        if (g.ok) onSuccess()
        else onFail(g.message)
      }}
    />
  )
}

function ChoiceStepView({ step, solved, onSuccess, onFail }: { step: ChoiceStep; solved: boolean; onSuccess: () => void; onFail: (t: T) => void }) {
  const multi = step.correct.length > 1
  const [picked, setPicked] = useState<number[]>([])
  const toggle = (i: number) => {
    if (solved) return
    sfx.click()
    setPicked((p) => (multi ? (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]) : [i]))
  }
  const check = () => {
    const ok = picked.length === step.correct.length && step.correct.every((c) => picked.includes(c))
    if (ok) onSuccess()
    else if (multi && picked.length !== step.correct.length) onFail({ en: `Pick exactly ${step.correct.length}. You picked ${picked.length}.`, mr: `नेमके ${step.correct.length} निवडा. तुम्ही ${picked.length} निवडले.` })
    else onFail({ en: 'Not quite. Look again, or ask Meera for a hint.', mr: 'अगदी बरोबर नाही. पुन्हा पाहा, किंवा मीराला हिंट विचारा.' })
  }
  return (
    <div>
      {step.seleniumSandbox && (
        <div className="sandbox">
          <Bi t={{ en: 'Practice lab: press Run and watch the robot, then answer below.', mr: 'सराव lab: Run दाबा आणि robot पाहा, मग खाली उत्तर द्या.' }} className="muted small" />
          <SeleniumLab sandbox={step.seleniumSandbox} />
        </div>
      )}
      {step.playwrightSandbox && (
        <div className="sandbox">
          <Bi t={{ en: 'Practice lab: press Run and watch Playwright drive the page, then answer below.', mr: 'सराव lab: Run दाबा आणि Playwright page कसं चालवतं ते पाहा, मग खाली उत्तर द्या.' }} className="muted small" />
          <PlaywrightLab sandbox={step.playwrightSandbox} />
        </div>
      )}
      {step.perfSandbox && (
        <div className="sandbox">
          <Bi t={{ en: 'Load-test lab: press Run, watch the test play out, read the summary, then answer below.', mr: 'load-test lab: Run दाबा, test चालताना पाहा, summary वाचा, मग खाली उत्तर द्या.' }} className="muted small" />
          <LoadLab sandbox={step.perfSandbox} />
        </div>
      )}
      {step.apiSandbox && (
        <div className="sandbox">
          <Bi t={{ en: 'Practice API: press Send, read the answer, then pick below.', mr: 'सराव API: Send दाबा, उत्तर वाचा, मग खाली निवडा.' }} className="muted small" />
          <ApiConsole initial={step.apiSandbox} />
        </div>
      )}
      {step.sandbox && (
        <div className="sandbox">
          <Bi t={{ en: 'Investigation console: run any query you like.', mr: 'तपास कन्सोल: हवी ती क्वेरी चालवा.' }} className="muted small" />
          <QueryConsole initial={step.sandboxStarter ?? 'SELECT *\nFROM orders\nLIMIT 10'} />
        </div>
      )}
      {multi && <Bi t={{ en: `Pick ${step.correct.length}.`, mr: `${step.correct.length} निवडा.` }} className="muted small" />}
      <div className="options" role={multi ? 'group' : 'radiogroup'}>
        {step.options.map((o, i) => {
          const isOn = picked.includes(i)
          const reveal = solved && step.correct.includes(i)
          return (
            <button type="button" key={i} role={multi ? 'checkbox' : 'radio'} aria-checked={isOn} className={`option ${isOn ? 'on' : ''} ${reveal ? 'correct' : ''}`} onClick={() => toggle(i)}>
              <span className="option-box" aria-hidden>{multi ? (isOn ? '■' : '□') : isOn ? '●' : '○'}</span>
              <OptionLabel o={o} />
            </button>
          )
        })}
      </div>
      {!solved && (
        <button type="button" className="btn primary" onClick={check} disabled={picked.length === 0}>
          <L en="Lock in answer" mr="उत्तर निश्चित करा" />
        </button>
      )}
    </div>
  )
}

function BossBar({ total, remaining, hit }: { total: number; remaining: number; hit: number }) {
  return (
    <motion.div className="bossbar" key={hit} animate={hit ? { x: [0, -8, 8, -5, 5, 0] } : {}} transition={{ duration: 0.4 }}>
      <Gremlin size={56} mood={remaining === 0 ? 'angry' : 'smug'} />
      <div className="boss-health">
        <div className="boss-name">The Gremlin {remaining === 0 && <L en="defeated" mr="पराभूत" />}</div>
        <div className="segments" role="meter" aria-valuemin={0} aria-valuemax={total} aria-valuenow={remaining} aria-label="Gremlin health">
          {Array.from({ length: total }, (_, i) => (
            <motion.span key={i} className={i < remaining ? 'seg on' : 'seg'} animate={i >= remaining ? { opacity: [1, 1, 0.3] } : {}} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
