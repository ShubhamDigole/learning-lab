import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { StateEffect, StateField } from '@codemirror/state'
import { Decoration } from '@codemirror/view'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PlaywrightStep, SkyBug, T } from '../content/types.ts'
import { gradePlaywright, type PwCatch } from '../playwright/grade.ts'
import { bootSkyPreview, runPlaywright, type PwAct, type PwLog, type PwResult } from '../playwright/runner.ts'
import type { SkyHopApp } from '../playwright/app.ts'
import { Bi, L } from '../lib/i18n.tsx'
import { useDark } from '../lib/useDark.ts'
import { sfx } from '../lib/sound.ts'

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
  slow: { act: 700, type: 60, label: { en: 'Slow', mr: 'हळू' } },
  normal: { act: 340, type: 25, label: { en: 'Normal', mr: 'मध्यम' } },
  fast: { act: 60, type: 0, label: { en: 'Fast', mr: 'जलद' } },
}
type Speed = keyof typeof SPEED
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export function hiddenDoc() {
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
  kind: PwAct | 'idle'
}

/** The Playwright lab: a TypeScript spec beside a practice browser showing SkyHop. */
export function PlaywrightLab({
  step,
  sandbox,
  solved,
  onSuccess,
  onFail,
}: {
  step?: PlaywrightStep
  sandbox?: { code: string; startUrl?: string; loggedIn?: boolean; build?: SkyBug[] }
  solved?: boolean
  onSuccess?: () => void
  onFail?: (t: T) => void
}) {
  const cfg = step ?? sandbox!
  const noBrowser = Boolean(step?.noBrowser)
  const [code, setCode] = useState(step ? step.starter : sandbox!.code)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState<Speed>('normal')
  const [log, setLog] = useState<PwLog[]>([])
  const [result, setResult] = useState<PwResult | null>(null)
  const [catches, setCatches] = useState<PwCatch[] | null>(null)
  const [grading, setGrading] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [flash, setFlash] = useState(0)
  const [cursor, setCursor] = useState<Cursor>({ x: 40, y: 40, box: null, kind: 'idle' })
  const frame = useRef<HTMLIFrameElement>(null)
  const view = useRef<EditorView | null>(null)
  const logEnd = useRef<HTMLDivElement>(null)
  const speedRef = useRef(speed)
  speedRef.current = speed
  const dark = useDark()
  const extensions = useMemo(() => [javascript({ typescript: true }), EditorView.lineWrapping, markField], [])

  useEffect(() => {
    const doc = frame.current?.contentDocument
    if (!doc || noBrowser) return
    const app = bootSkyPreview({ doc, loggedIn: cfg.loggedIn, startUrl: cfg.startUrl, bugs: cfg.build })
    const sync = () => {
      setUrl(app.url)
      setTitle(app.title)
    }
    app.onChange = sync
    sync()
    return () => app.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: 'nearest' })
  }, [log.length])

  const mark = (line: number | null, kind: 'run' | 'error' = 'run') => view.current?.dispatch({ effects: setMark.of({ line, kind }) })

  const act = async (el: Element | null, kind: PwAct) => {
    const sp = SPEED[speedRef.current]
    if (kind === 'shot') {
      setFlash((f) => f + 1)
      sfx.click()
    }
    if (el && 'getBoundingClientRect' in el) {
      ;(el as HTMLElement).scrollIntoView?.({ block: 'center', inline: 'nearest' })
      const r = el.getBoundingClientRect()
      setCursor({ x: r.left + Math.min(r.width / 2, 60), y: r.top + r.height / 2, box: { l: r.left, t: r.top, w: r.width, h: r.height }, kind })
      if (kind === 'click' || kind === 'check') sfx.click()
    } else setCursor((c) => ({ ...c, box: null, kind }))
    await wait(kind === 'assert' || kind === 'find' ? sp.act * 0.5 : sp.act)
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
    const r = await runPlaywright(code, {
      doc,
      bugs: cfg.build,
      loggedIn: cfg.loggedIn,
      noBrowser,
      onApp: (_app: SkyHopApp | null, u: string, t: string) => {
        setUrl(u)
        setTitle(t)
      },
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
      const g = await gradePlaywright(step, code, r, hiddenDoc)
      setGrading(false)
      setCatches(g.catches.length ? g.catches : null)
      if (g.ok) onSuccess?.()
      else onFail?.(g.message)
    }
  }

  const ran = result?.tests.filter((t) => !t.skipped) ?? []
  const passed = ran.filter((t) => t.pass).length
  const skipped = (result?.tests.length ?? 0) - ran.length
  return (
    <div className={`sel-lab pw-lab ${noBrowser ? 'no-browser' : ''}`}>
      <div className="sel-top">
        <div className="sel-editor-wrap">
          <div className="sel-file">
            <span aria-hidden>🎭</span> {noBrowser ? 'warmup.ts' : 'skyhop.spec.ts'}
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
            <CodeMirror
              theme={dark ? 'dark' : 'light'}
              value={code}
              minHeight="260px"
              maxHeight="480px"
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
                {title || (url === 'about:blank' ? 'about:blank' : 'SkyHop')}
              </span>
              {running && <span className="robot-badge">🎭 <L en="Playwright is driving" mr="Playwright चालवतंय" /></span>}
            </div>
            <div className="browser-url">
              <span aria-hidden>{url === 'about:blank' ? '○' : '🔒'}</span>
              <span className="mono">{url}</span>
            </div>
            <div className="browser-view">
              <iframe ref={frame} title="SkyHop practice site" />
              <AnimatePresence>
                {flash > 0 && <motion.div key={flash} className="shot-flash" initial={{ opacity: 0.85 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} aria-hidden />}
                {running && cursor.box && (
                  <motion.div key="box" className={`robot-box k-${cursor.kind === 'assert' ? 'read' : cursor.kind === 'check' ? 'click' : cursor.kind}`} initial={{ opacity: 0 }} animate={{ opacity: 1, left: cursor.box.l - 4, top: cursor.box.t - 4, width: cursor.box.w + 8, height: cursor.box.h + 8 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} />
                )}
              </AnimatePresence>
              {running && (
                <motion.div className={`robot-cursor k-${cursor.kind}`} animate={{ left: cursor.x, top: cursor.y, scale: cursor.kind === 'click' || cursor.kind === 'check' ? [1, 0.8, 1] : 1 }} transition={{ duration: 0.28, ease: 'easeOut' }} aria-hidden>
                  <svg width="22" height="26" viewBox="0 0 22 26">
                    <path d="M2 2 L2 21 L7 16 L11 24 L14 22.5 L10 15 L17 15 Z" fill="#fff" stroke="#1f2a5c" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                  {cursor.kind === 'wait' && <span className="cursor-tag">⏳</span>}
                  {cursor.kind === 'type' && <span className="cursor-tag">⌨️</span>}
                  {cursor.kind === 'assert' && <span className="cursor-tag">✔</span>}
                  {cursor.kind === 'dialog' && <span className="cursor-tag">💬</span>}
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
          <span>{noBrowser ? 'Output' : <L en="Test report" mr="टेस्ट रिपोर्ट" />}</span>
          {result && !result.compileError && !noBrowser && (
            <span className={`testng ${result.ok ? 'ok' : 'bad'}`}>
              {ran.length - passed > 0 ? `${ran.length - passed} failed` : ''}
              {ran.length - passed > 0 && passed ? ', ' : ''}
              {passed ? `${passed} passed` : ''}
              {skipped ? `, ${skipped} skipped` : ''}
              {result.assertions.passed + result.assertions.failed > 0 && ` · ${result.assertions.passed} expect${result.assertions.passed === 1 ? '' : 's'} passed`}
            </span>
          )}
        </div>
        <ol className="sel-log">
          {log.length === 0 && !result && (
            <li className="muted">{noBrowser ? <L en="Press Run to run your code." mr="तुमचा code चालवण्यासाठी Run दाबा." /> : <L en="Press Run to start the test." mr="test सुरू करण्यासाठी Run दाबा." />}</li>
          )}
          {log
            .filter((e) => !noBrowser || e.kind === 'print' || e.kind === 'error')
            .map((e, i) => (
              <li key={i} className={`lg-${e.kind === 'net' ? 'cmd' : e.kind === 'step' ? 'test' : e.kind} ${e.ok ? '' : 'bad'} ${e.kind === 'net' ? 'lg-net' : ''}`}>
                {!noBrowser && <span className="lg-line tabular">{e.kind === 'test' || e.kind === 'error' ? '' : e.line || ''}</span>}
                <span className="lg-text">{e.text}</span>
              </li>
            ))}
          {result?.compileError && (
            <li className="lg-error bad">
              <span className="lg-line tabular">{result.compileError.line}</span>
              <span className="lg-text">SyntaxError: {result.compileError.message}</span>
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
