import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { StateEffect, StateField } from '@codemirror/state'
import { Decoration } from '@codemirror/view'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PythonStep, T } from '../content/types.ts'
import { runPython, warmPython } from '../python/client.ts'
import { gradePython, type PyVariantResult } from '../python/grade.ts'
import type { PyRun } from '../python/harness.ts'
import { Bi, L } from '../lib/i18n.tsx'
import { useDark } from '../lib/useDark.ts'
import { sfx } from '../lib/sound.ts'

const setMark = StateEffect.define<number | null>()
const markField = StateField.define({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const e of tr.effects) {
      if (!e.is(setMark)) continue
      if (e.value === null || e.value < 1) return Decoration.none
      const line = tr.state.doc.line(Math.min(e.value, tr.state.doc.lines))
      return Decoration.set([Decoration.line({ class: 'cm-error-line' }).range(line.from)])
    }
    return deco.map(tr.changes)
  },
  provide: (f) => EditorView.decorations.from(f),
})

function FilesPanel({ files }: { files: Record<string, string> }) {
  const names = Object.keys(files)
  const [open, setOpen] = useState(names[0])
  if (!names.length) return null
  const text = files[open] ?? ''
  const isCsv = open.endsWith('.csv')
  const rows = isCsv ? text.replace(/\n+$/, '').split('\n').map((l) => l.split(',')) : []
  return (
    <div className="py-files">
      <div className="py-file-tabs" role="tablist" aria-label="Data files">
        <span className="py-files-label">
          <L en="Files" mr="files" />
        </span>
        {names.map((n) => (
          <button type="button" role="tab" key={n} aria-selected={n === open} className={n === open ? 'on' : ''} onClick={() => setOpen(n)}>
            📄 {n}
          </button>
        ))}
      </div>
      <div className="py-file-view">
        {isCsv && rows.length < 40 ? (
          <table className="py-csv">
            <thead>
              <tr>{rows[0]?.map((c, i) => <th key={i}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(1).map((r, i) => (
                <tr key={i}>
                  {rows[0].map((_, j) => (
                    <td key={j} className={r[j] === undefined || r[j] === '' ? 'empty' : ''}>
                      {r[j] === undefined || r[j] === '' ? '∅' : r[j]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre>{text}</pre>
        )}
      </div>
    </div>
  )
}

/** The Python lab: real Python (Pyodide) with data files, printed output and hidden checks. */
export function PythonLab({ step, sandbox, solved, onSuccess, onFail }: { step?: PythonStep; sandbox?: { code: string; files?: Record<string, string> }; solved?: boolean; onSuccess?: () => void; onFail?: (t: T) => void }) {
  const files = (step ? step.files : sandbox?.files) ?? {}
  const [code, setCode] = useState(step ? step.starter : sandbox!.code)
  const [state, setState] = useState<'loading' | 'ready' | 'running' | 'grading'>('loading')
  const [result, setResult] = useState<PyRun | null>(null)
  const [variants, setVariants] = useState<PyVariantResult[] | null>(null)
  const view = useRef<EditorView | null>(null)
  const dark = useDark()
  const extensions = useMemo(() => [python(), EditorView.lineWrapping, markField], [])

  useEffect(() => {
    let alive = true
    warmPython().then(() => alive && setState((s) => (s === 'loading' ? 'ready' : s)))
    return () => {
      alive = false
    }
  }, [])

  const run = async (submit: boolean) => {
    if (state === 'running' || state === 'grading') return
    sfx.click()
    setState('running')
    setVariants(null)
    view.current?.dispatch({ effects: setMark.of(null) })
    const checks = (step?.checks ?? []).map((c) => c.expr)
    const r = await runPython(code, files, checks)
    setResult(r)
    if (r.error?.line) view.current?.dispatch({ effects: setMark.of(r.error.line) })
    if (r.error) sfx.buzz()
    if (submit && step && !solved) {
      setState('grading')
      const g = await gradePython(step, code, r, runPython)
      setVariants(g.variants.length ? g.variants : null)
      setState('ready')
      if (g.ok) onSuccess?.()
      else onFail?.(g.message)
    } else setState('ready')
  }

  const busy = state === 'running' || state === 'grading'
  return (
    <div className="py-lab">
      <FilesPanel files={files} />
      <div className="sel-editor-wrap">
        <div className="sel-file">
          <span aria-hidden>🐍</span> main.py <span className={`py-status ${state}`}>{state === 'loading' ? 'starting Python...' : 'Python 3.14'}</span>
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
            minHeight="200px"
            maxHeight="440px"
            extensions={extensions}
            onChange={(v) => {
              setCode(v)
              view.current?.dispatch({ effects: setMark.of(null) })
            }}
            onCreateEditor={(v) => (view.current = v)}
            basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false, indentOnInput: true }}
            indentWithTab
          />
        </div>
      </div>
      <div className="console-actions sel-actions">
        <button type="button" className="btn" onClick={() => run(false)} disabled={busy}>
          ▶ <L en="Run" mr="चालवा" /> <span className="kbd">Ctrl + Enter</span>
        </button>
        {step && (
          <button type="button" className="btn primary" onClick={() => run(true)} disabled={busy || solved}>
            {state === 'grading' ? <L en="Checking with hidden data..." mr="लपवलेल्या डेटासह तपासतोय..." /> : <L en="Submit" mr="सादर करा" />}
          </button>
        )}
        {state === 'loading' && (
          <span className="muted small">
            <L en="Python is starting (a few seconds the first time)." mr="Python सुरू होतंय (पहिल्यांदा काही सेकंद लागतात)." />
          </span>
        )}
      </div>
      <div className="sel-console py-console">
        <div className="sel-console-head">
          <span>Output</span>
          {result && <span className={`testng ${result.error ? 'bad' : 'ok'}`}>{result.error ? result.error.type : 'finished'}</span>}
        </div>
        <pre className="py-out" aria-live="polite">
          {busy && !result ? 'running...\n' : ''}
          {!result && !busy && <span className="muted">Press Run to run your code.</span>}
          {result?.output}
          {result?.error && <span className="bad">{(result.output && !result.output.endsWith('\n') ? '\n' : '') + (result.error.trace || result.error.message)}</span>}
          {result && !result.output && !result.error && <span className="muted">(the program printed nothing)</span>}
        </pre>
      </div>
      {variants && (
        <div className="mutants">
          <div className="test-editor-label">
            <L en="Hidden data sets: does your code still work?" mr="लपवलेले data sets: तुमचा code तरीही चालतो का?" />
          </div>
          <ul>
            {variants.map((v, i) => (
              <motion.li key={i} className={v.passed ? 'pass' : 'fail'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
                <span className="tr-mark" aria-hidden>{v.passed ? '✅' : '💥'}</span>
                <Bi t={v.label} as="span" />
                <span className="tr-state">{v.passed ? <L en="works" mr="चालतो" /> : <L en="breaks" mr="बिघडतो" />}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
