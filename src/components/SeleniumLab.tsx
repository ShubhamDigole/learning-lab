import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { java } from '@codemirror/lang-java'
import { StateEffect, StateField } from '@codemirror/state'
import { Decoration } from '@codemirror/view'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { BugId, SeleniumStep, T } from '../content/types.ts'
import type { CareBridgeApp } from '../selenium/app.ts'
import { gradeSelenium, type CatchResult } from '../selenium/grade.ts'
import { bootPreview, runSelenium, type ActKind, type LogEntry, type RunResult } from '../selenium/runner.ts'
import { Bi, L } from '../lib/i18n.tsx'
import { useDark } from '../lib/useDark.ts'
import { sfx } from '../lib/sound.ts'

// ---------- editor line marks (the line running now, or the line that failed) ----------
const setMark = StateEffect.define<{ line: number | null; kind: 'run' | 'error' }>()
const markField = StateField.define({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const e of tr.effects) {
      if (!e.is(setMark)) continue
      if (e.value.line === null || e.value.line < 1) return Decoration.none
      const line = tr.state.doc.line(Math.min(e.value.line, tr.state.doc.lines))
      return Decoration.set([Decoration.line({ class: e.value.kind === 'run' ? 'cm-run-line' : 'cm-error-line' }).range(line.from)])
    }
    return deco.map(tr.changes)
  },
  provide: (f) => EditorView.decorations.from(f),
})

const SPEED = {
  slow: { act: 750, type: 70, label: { en: 'Slow', mr: 'हळू' } },
  normal: { act: 380, type: 30, label: { en: 'Normal', mr: 'मध्यम' } },
  fast: { act: 80, type: 0, label: { en: 'Fast', mr: 'जलद' } },
}
type Speed = keyof typeof SPEED
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function hiddenDoc() {
  const f = document.createElement('iframe')
  f.setAttribute('aria-hidden', 'true')
  f.tabIndex = -1
  f.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;height:700px;visibility:hidden'
  document.body.appendChild(f)
  return { doc: f.contentDocument!, dispose: () => f.remove() }
}

interface Cursor {
  x: number
  y: number
  box: { l: number; t: number; w: number; h: number } | null
  kind: ActKind | 'idle'
}

/**
 * The Selenium lab: a Java editor beside a practice browser. Run plays the script with a robot
 * cursor; Submit (when a step is given) grades it, including re-runs on buggy builds.
 */
export function SeleniumLab({
  step,
  sandbox,
  solved,
  onSuccess,
  onFail,
}: {
  step?: SeleniumStep
  sandbox?: { code: string; startUrl?: string; loggedIn?: boolean; build?: BugId[] }
  solved?: boolean
  onSuccess?: () => void
  onFail?: (t: T) => void
}) {
  const cfg = step ?? sandbox!
  const noBrowser = Boolean(step?.noBrowser)
  const [code, setCode] = useState(step ? step.starter : sandbox!.code)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState<Speed>('normal')
  const [log, setLog] = useState<LogEntry[]>([])
  const [result, setResult] = useState<RunResult | null>(null)
  const [catches, setCatches] = useState<CatchResult[] | null>(null)
  const [grading, setGrading] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [cursor, setCursor] = useState<Cursor>({ x: 40, y: 40, box: null, kind: 'idle' })
  const frame = useRef<HTMLIFrameElement>(null)
  const view = useRef<EditorView | null>(null)
  const logEnd = useRef<HTMLDivElement>(null)
  const speedRef = useRef(speed)
  speedRef.current = speed
  const dark = useDark()
  const extensions = useMemo(() => [java(), EditorView.lineWrapping, markField], [])

  const watch = (app: CareBridgeApp) => {
    const sync = () => {
      setUrl(app.url)
      setTitle(app.title)
    }
    app.onChange = sync
    sync()
  }

  // Idle state: the browser shows the start page so the learner can look around (and click) first.
  useEffect(() => {
    const doc = frame.current?.contentDocument
    if (!doc || noBrowser) return
    const app = bootPreview({ doc, loggedIn: cfg.loggedIn, startUrl: cfg.startUrl, bugs: cfg.build })
    watch(app)
    return () => app.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: 'nearest' })
  }, [log.length])

  const mark = (line: number | null, kind: 'run' | 'error' = 'run') => view.current?.dispatch({ effects: setMark.of({ line, kind }) })

  const act = async (el: Element | null, kind: ActKind) => {
    const sp = SPEED[speedRef.current]
    if (el && 'getBoundingClientRect' in el) {
      ;(el as HTMLElement).scrollIntoView?.({ block: 'center', inline: 'nearest' })
      const r = el.getBoundingClientRect()
      setCursor({ x: r.left + Math.min(r.width / 2, 60), y: r.top + r.height / 2, box: { l: r.left, t: r.top, w: r.width, h: r.height }, kind })
      if (kind === 'click') sfx.click()
    } else setCursor((c) => ({ ...c, box: null, kind }))
    await wait(kind === 'find' ? sp.act * 0.6 : sp.act)
  }

  const run = async (submit: boolean) => {
    if (running || grading) return
    const doc = frame.current?.contentDocument
    if (!doc) return
    sfx.click()
    setRunning(true)
    setLog([])
    setResult(null)
    setCatches(null)
    mark(null)
    const r = await runSelenium(code, {
      doc,
      bugs: cfg.build,
      loggedIn: cfg.loggedIn,
      startUrl: cfg.startUrl,
      noBrowser,
      seed: Math.floor(Math.random() * 100000),
      onApp: watch,
      hooks: noBrowser
        ? { log: (e) => setLog((l) => [...l, e]), line: (n) => mark(n) }
        : { act, typed: () => wait(SPEED[speedRef.current].type), line: (n) => mark(n), log: (e) => setLog((l) => [...l, e]) },
    })
    setRunning(false)
    setResult(r)
    setCursor((c) => ({ ...c, box: null, kind: 'idle' }))
    const failLine = r.compileError?.line ?? r.tests.find((t) => !t.pass)?.line
    mark(failLine ?? null, 'error')
    if (r.ok) sfx.chime()
    else sfx.buzz()
    if (submit && step && !solved) {
      setGrading(true)
      const g = await gradeSelenium(step, code, r, hiddenDoc)
      setGrading(false)
      setCatches(g.catches.length ? g.catches : null)
      if (g.ok) onSuccess?.()
      else onFail?.(g.message)
    }
  }

  const passed = result?.tests.filter((t) => t.pass).length ?? 0
  return (
    <div className={`sel-lab ${noBrowser ? 'no-browser' : ''}`}>
      <div className="sel-top">
        <div className="sel-editor-wrap">
          <div className="sel-file">
            <span aria-hidden>☕</span> {noBrowser ? 'Main.java' : 'CareBridgeTest.java'}
          </div>
          <div
            className="editor sel-editor"
            onKeyDownCapture={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                e.stopPropagation()
                run(Boolean(e.shiftKey && step))
              }
            }}
          >
            <CodeMirror theme={dark ? 'dark' : 'light'}
              value={code}
              minHeight="260px"
              maxHeight="460px"
              extensions={extensions}
              onChange={(v) => {
                setCode(v)
                mark(null)
              }}
              onCreateEditor={(v) => (view.current = v)}
              basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
            />
          </div>
        </div>

        {!noBrowser && (
          <div className="sel-browser" aria-label="Practice browser">
            <div className="browser-bar">
              <span className="dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span className="browser-tab" title={title}>
                {title || 'CareBridge'}
              </span>
              {running && <span className="robot-badge">🤖 <L en="Selenium is driving" mr="Selenium चालवतंय" /></span>}
            </div>
            <div className="browser-url">
              <span aria-hidden>🔒</span>
              <span className="mono">{url}</span>
            </div>
            <div className="browser-view">
              <iframe ref={frame} title="CareBridge practice site" />
              <AnimatePresence>
                {running && cursor.box && (
                  <motion.div key="box" className={`robot-box k-${cursor.kind}`} initial={{ opacity: 0 }} animate={{ opacity: 1, left: cursor.box.l - 4, top: cursor.box.t - 4, width: cursor.box.w + 8, height: cursor.box.h + 8 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
                )}
              </AnimatePresence>
              {running && (
                <motion.div className={`robot-cursor k-${cursor.kind}`} animate={{ left: cursor.x, top: cursor.y, scale: cursor.kind === 'click' ? [1, 0.8, 1] : 1 }} transition={{ duration: 0.3, ease: 'easeOut' }} aria-hidden>
                  <svg width="22" height="26" viewBox="0 0 22 26">
                    <path d="M2 2 L2 21 L7 16 L11 24 L14 22.5 L10 15 L17 15 Z" fill="#fff" stroke="#17324d" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                  {cursor.kind === 'wait' && <span className="cursor-tag">⏳</span>}
                  {cursor.kind === 'type' && <span className="cursor-tag">⌨️</span>}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="console-actions sel-actions">
        <button type="button" className="btn" onClick={() => run(false)} disabled={running || grading}>
          ▶ <L en="Run" mr="चालवा" /> <span className="kbd">Ctrl + Enter</span>
        </button>
        {step && (
          <button type="button" className="btn primary" onClick={() => run(true)} disabled={running || grading || solved}>
            {grading ? <L en="Checking with planted bugs..." mr="लपवलेल्या bugs सोबत तपासतोय..." /> : <L en="Submit" mr="सादर करा" />}
          </button>
        )}
        {!noBrowser && (
          <div className="speed" role="radiogroup" aria-label="Robot speed">
            {(Object.keys(SPEED) as Speed[]).map((k) => (
              <button type="button" key={k} role="radio" aria-checked={speed === k} className={speed === k ? 'on' : ''} onClick={() => setSpeed(k)}>
                <L en={SPEED[k].label.en} mr={SPEED[k].label.mr} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sel-console">
        <div className="sel-console-head">
          <span>{noBrowser ? 'Output' : <L en="Test log" mr="टेस्ट log" />}</span>
          {result && !result.compileError && (
            <span className={`testng ${result.ok ? 'ok' : 'bad'}`}>
              {result.ok ? '✓' : '✕'} Tests run: {result.tests.length}, Passed: {passed}, Failures: {result.tests.length - passed}
              {result.assertions.passed + result.assertions.failed > 0 && ` · Assertions: ${result.assertions.passed} passed`}
            </span>
          )}
        </div>
        <ol className="sel-log">
          {log.length === 0 && !result && (
            <li className="muted">
              {noBrowser ? <L en="Press Run to run your code." mr="तुमचा code चालवण्यासाठी Run दाबा." /> : <L en="Press Run to start the robot." mr="robot सुरू करण्यासाठी Run दाबा." />}
            </li>
          )}
          {log
            .filter((e) => !noBrowser || e.kind === 'print' || e.kind === 'error' || e.kind === 'assert')
            .map((e, i) => (
              <li key={i} className={`lg-${e.kind} ${e.ok ? '' : 'bad'}`}>
                {!noBrowser && <span className="lg-line tabular">{e.line || ''}</span>}
                <span className="lg-text">{e.text}</span>
              </li>
            ))}
          {result?.compileError && (
            <li className="lg-error bad">
              <span className="lg-line tabular">{result.compileError.line}</span>
              <span className="lg-text">
                Compile error: {result.compileError.message}
              </span>
            </li>
          )}
          <div ref={logEnd} />
        </ol>
      </div>

      {catches && (
        <div className="mutants">
          <div className="test-editor-label">
            <L en="Planted bugs: did your test catch them?" mr="लपवलेले bugs: तुमच्या test ने पकडले का?" />
          </div>
          <ul>
            {catches.map((c, i) => (
              <motion.li key={i} className={c.caught ? 'pass' : 'fail'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
                <span className="tr-mark" aria-hidden>{c.caught ? '🪤' : '🐛'}</span>
                <Bi t={c.label} as="span" />
                <span className="tr-state">{c.caught ? <L en="caught" mr="पकडला" /> : <L en="slipped through" mr="निसटला" />}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
