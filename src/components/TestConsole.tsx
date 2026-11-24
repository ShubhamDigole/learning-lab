import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { ApiResponse } from '../api/http.ts'
import { gradeTests, runTests, type TestRun } from '../api/pm.ts'
import { send } from '../api/server.ts'
import type { T, TestStep } from '../content/types.ts'
import { Bi, L } from '../lib/i18n.tsx'
import { useDark } from '../lib/useDark.ts'
import { MethodPill, ResponseView } from './ApiConsole.tsx'

function Results({ run }: { run: TestRun }) {
  return (
    <div className="test-results" role="status">
      {run.error && <div className="sql-error mono small">{run.error}</div>}
      {run.results.length === 0 && !run.error && (
        <p className="muted small">
          <L en="No tests ran. Wrap each check in pm.test('name', () => { ... })." mr="एकही test चालली नाही. प्रत्येक check pm.test('name', () => { ... }) मध्ये लिहा." />
        </p>
      )}
      <ul>
        {run.results.map((r, i) => (
          <motion.li key={i} className={r.pass ? 'pass' : 'fail'} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
            <span className="tr-mark" aria-hidden>{r.pass ? '✓' : '✕'}</span>
            <span className="tr-name">{r.name}</span>
            {r.error && <span className="tr-err mono">{r.error}</span>}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

/** Write Postman tests for one fixed request; Submit also runs them against the planted bugs. */
export function TestConsole({ step, solved, onSuccess, onFail }: { step: TestStep; solved: boolean; onSuccess: () => void; onFail: (t: T) => void }) {
  const [real] = useState<ApiResponse>(() => send(step.request))
  const [code, setCode] = useState(step.starter)
  const [run, setRun] = useState<TestRun | null>(null)
  const [caught, setCaught] = useState<boolean[] | null>(null)
  const [showRes, setShowRes] = useState(true)
  const dark = useDark()
  const extensions = useMemo(() => [javascript(), EditorView.lineWrapping], [])

  const runOnly = () => {
    setRun(runTests(code, real))
    setCaught(null)
  }
  const submit = () => {
    if (solved) return
    const g = gradeTests(code, real, step.mutants.map((m) => m.patch))
    setRun(g.onReal)
    setCaught(g.caught)
    if (g.ok) return onSuccess()
    if (g.onReal.error) return onFail({ en: 'The script has an error. Read the red message and fix the code.', mr: 'script मध्ये error आहे. लाल संदेश वाचा आणि code दुरुस्त करा.' })
    if (g.onReal.results.length === 0) return onFail({ en: "Write at least one test: pm.test('name', () => { ... })", mr: "किमान एक test लिहा: pm.test('name', () => { ... })" })
    if (g.onReal.results.some((r) => !r.pass)) return onFail({ en: 'A test fails on the real, correct response. A good test passes when the API is right. Fix that test first.', mr: 'खऱ्या, बरोबर response वर एक test fail होते. API बरोबर असताना चांगली test pass व्हायला हवी. आधी ती test दुरुस्त करा.' })
    const missed = g.caught.filter((c) => !c).length
    onFail({ en: `Your tests pass, but ${missed} planted bug${missed > 1 ? 's' : ''} slipped through. Add checks that would catch ${missed > 1 ? 'them' : 'it'}.`, mr: `तुमच्या tests pass होतात, पण ${missed} लपवलेले bug निसटले. ते पकडतील असे checks जोडा.` })
  }

  const h = step.request.headers ?? {}
  return (
    <div className="test-console">
      <div className="test-request">
        <MethodPill method={step.request.method} />
        <code>{step.request.path}</code>
        {Object.entries(h).map(([k, v]) => (
          <span key={k} className="muted small mono">
            {k}: {v}
          </span>
        ))}
        <button type="button" className="btn quiet small" aria-expanded={showRes} onClick={() => setShowRes(!showRes)}>
          {showRes ? <L en="Hide response" mr="response लपवा" /> : <L en="Show response" mr="response दाखवा" />}
        </button>
      </div>
      {showRes && <ResponseView res={real} />}

      <div className="test-editor-label">
        <L en="Tests (Postman's Tests tab)" mr="Tests (Postman चा Tests टॅब)" />
      </div>
      <div
        className="editor"
        onKeyDownCapture={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            e.stopPropagation()
            if (e.shiftKey) submit()
            else runOnly()
          }
        }}
      >
        <CodeMirror theme={dark ? 'dark' : 'light'} value={code} minHeight="150px" maxHeight="340px" extensions={extensions} onChange={setCode} basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }} />
      </div>
      <div className="console-actions">
        <button type="button" className="btn" onClick={runOnly}>
          ▶ <L en="Run tests" mr="tests चालवा" /> <span className="kbd">Ctrl + Enter</span>
        </button>
        <button type="button" className="btn primary" onClick={submit} disabled={solved}>
          <L en="Submit tests" mr="tests सादर करा" />
        </button>
      </div>
      {run && <Results run={run} />}
      {caught && (
        <div className="mutants">
          <div className="test-editor-label">
            <L en="Planted bugs: would your tests catch them?" mr="लपवलेले bugs: तुमच्या tests ते पकडतील का?" />
          </div>
          <ul>
            {step.mutants.map((m, i) => (
              <motion.li key={i} className={caught[i] ? 'pass' : 'fail'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.12 }}>
                <span className="tr-mark" aria-hidden>{caught[i] ? '🪤' : '🐛'}</span>
                <Bi t={m.label} as="span" />
                <span className="tr-state">{caught[i] ? <L en="caught" mr="पकडला" /> : <L en="slipped through" mr="निसटला" />}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
