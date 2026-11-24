import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { sql as sqlLang, PostgreSQL } from '@codemirror/lang-sql'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { getSchema, runQuery, SqlError } from '../db/engine.ts'
import type { QueryResult } from '../db/compare.ts'
import { Bi, L } from '../lib/i18n.tsx'
import { useDark } from '../lib/useDark.ts'

type Schema = Awaited<ReturnType<typeof getSchema>>
let schemaCache: Schema | null = null

export function SchemaPanel() {
  const [schema, setSchema] = useState<Schema | null>(schemaCache)
  const [open, setOpen] = useState<string | null>(null)
  useEffect(() => {
    if (!schemaCache) getSchema().then((s) => setSchema((schemaCache = s)))
  }, [])
  return (
    <nav className="schema" aria-label="Tables">
      <div className="eyebrow"><L en="Tables" mr="टेबल्स" /></div>
      {!schema && <div className="muted small">Opening the database…</div>}
      <ul>
        {schema?.map((t) => (
          <li key={t.table}>
            <button type="button" className={`schema-name ${open === t.table ? 'open' : ''}`} aria-expanded={open === t.table} onClick={() => setOpen(open === t.table ? null : t.table)}>
              {t.table}
            </button>
            {open === t.table && (
              <ul className="schema-cols">
                {t.columns.map((c) => (
                  <li key={c.name}>
                    <code>{c.name}</code> <span className="muted">{c.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function ResultTable({ result }: { result: QueryResult }) {
  const shown = result.rows.slice(0, 200)
  return (
    <div className="results">
      <div className="results-head">
        <span className="badge tabular">
          {result.rows.length} row{result.rows.length === 1 ? '' : 's'}
        </span>
        {result.rows.length > 200 && <span className="muted small"><L en="showing the first 200" mr="पहिल्या 200 दाखवल्या" /></span>}
      </div>
      <div className="results-scroll">
        <table>
          <thead>
            <tr>
              {result.columns.map((c, i) => (
                <th key={i} scope="col">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 14) * 0.03 }}>
                {r.map((v, j) => (
                  <td key={j} className={`tabular ${v === null ? 'null' : ''}`}>
                    {v === null ? 'NULL' : v instanceof Date ? v.toISOString().replace('T', ' ').slice(0, 19).replace(' 00:00:00', '') : String(v)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

let consoleSeq = 0

/** Editor + Run. `onSubmit` adds a "Submit evidence" button for graded steps. */
export function QueryConsole({ initial = '', onSubmit, submitting }: { initial?: string; onSubmit?: (sql: string) => void; submitting?: boolean }) {
  const [code, setCode] = useState(initial)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<{ en: string; mr: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [id] = useState(() => `sql-editor-${++consoleSeq}`)
  const dark = useDark()
  const extensions = useMemo(() => [sqlLang({ dialect: PostgreSQL, upperCaseKeywords: true }), EditorView.lineWrapping, EditorView.contentAttributes.of({ 'aria-label': 'SQL editor' })], [])

  useEffect(() => {
    setCode(initial)
    setResult(null)
    setError(null)
  }, [initial])

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      setResult(await runQuery(code))
    } catch (e) {
      setResult(null)
      setError(e instanceof SqlError ? { en: e.message, mr: e.mr } : { en: String(e), mr: '' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="console">
      <SchemaPanel />
      <div className="console-main">
        <div
          className="editor"
          id={id}
          onKeyDownCapture={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              run()
              if (onSubmit && e.shiftKey) onSubmit(code)
            }
          }}
        >
          <CodeMirror theme={dark ? 'dark' : 'light'} value={code} minHeight="132px" maxHeight="320px" extensions={extensions} onChange={setCode} basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }} />
        </div>
        <div className="console-actions">
          <button type="button" className="btn" onClick={run} disabled={busy}>
            ▶ Run <span className="kbd">Ctrl + Enter</span>
          </button>
          {onSubmit && (
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                run() // show the rows being graded, so the learner sees the evidence
                onSubmit(code)
              }}
              disabled={submitting}
            >
              <L en="Submit evidence" mr="पुरावा सादर करा" />
            </button>
          )}
        </div>
        {error && (
          <motion.div className="sql-error" role="alert" initial={{ x: -6 }} animate={{ x: [0, -5, 5, -3, 3, 0] }}>
            <Bi t={error} />
          </motion.div>
        )}
        {result && <ResultTable result={result} />}
      </div>
    </div>
  )
}
