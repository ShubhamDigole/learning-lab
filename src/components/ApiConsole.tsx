import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { json as jsonLang } from '@codemirror/lang-json'
import { AnimatePresence, motion } from 'framer-motion'
import { useId, useMemo, useRef, useState, type ReactElement } from 'react'
import type { ApiDraft, ApiResponse, HttpMethod } from '../api/http.ts'
import { BASE_URL, METHODS, statusClass } from '../api/http.ts'
import { ENDPOINTS, send } from '../api/server.ts'
import { Bi, L } from '../lib/i18n.tsx'
import { useDark } from '../lib/useDark.ts'
import { sfx } from '../lib/sound.ts'

type Row = { id: number; key: string; value: string }
let rowId = 0
const toRows = (h?: Record<string, string>): Row[] => Object.entries(h ?? {}).map(([key, value]) => ({ id: ++rowId, key, value }))
const fromRows = (rows: Row[]) => Object.fromEntries(rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]))
const hasBody = (m: HttpMethod) => m === 'POST' || m === 'PUT' || m === 'PATCH'

/** Pretty JSON with keys, strings, numbers and literals coloured. */
export function JsonView({ value }: { value: unknown }) {
  const text = JSON.stringify(value, null, 2) ?? ''
  const out: ReactElement[] = []
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?\b)|\b(true|false|null)\b|(\s+|.)/g
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    const k = i++
    if (m[1] && m[2]) out.push(<span key={k}><span className="tok-key">{m[1]}</span>{m[2]}</span>)
    else if (m[1]) out.push(<span key={k} className="tok-str">{m[1]}</span>)
    else if (m[3]) out.push(<span key={k} className="tok-num">{m[3]}</span>)
    else if (m[4]) out.push(<span key={k} className="tok-kw">{m[4]}</span>)
    else out.push(<span key={k}>{m[0]}</span>)
  }
  return <code>{out}</code>
}

export function MethodPill({ method }: { method: HttpMethod }) {
  return <span className={`method-pill m-${method}`}>{method}</span>
}

const STATUS_HELP = {
  ok: { en: 'It worked.', mr: 'काम झालं.' },
  client: { en: 'The request has a problem. The body says why.', mr: 'request मध्ये काहीतरी चुकलं आहे. का ते body मध्ये लिहिलं आहे.' },
  server: { en: 'The server broke. That is a bug to report.', mr: 'सर्व्हर बिघडला. हा report करायचा bug आहे.' },
}

export function ResponseView({ res }: { res: ApiResponse }) {
  const [tab, setTab] = useState<'body' | 'headers'>('body')
  const cls = statusClass(res.status)
  const size = res.body === null ? 0 : JSON.stringify(res.body).length
  return (
    <motion.div className="response" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="response-head">
        <span className={`status-pill s-${cls}`}>
          {res.status} {res.statusText}
        </span>
        <span className={`res-meta tabular ${res.timeMs >= 1000 ? 'slow' : ''}`}>{res.timeMs.toLocaleString('en-IN')} ms</span>
        <span className="res-meta tabular">{size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`}</span>
        <div className="res-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'body'} className={tab === 'body' ? 'on' : ''} onClick={() => setTab('body')}>
            Body
          </button>
          <button type="button" role="tab" aria-selected={tab === 'headers'} className={tab === 'headers' ? 'on' : ''} onClick={() => setTab('headers')}>
            Headers ({Object.keys(res.headers).length})
          </button>
        </div>
      </div>
      <Bi t={STATUS_HELP[cls]} className={`status-help s-${cls}`} />
      {tab === 'body' ? (
        res.body === null ? (
          <p className="muted small res-empty">
            <L en="No body. 204 means: done, nothing to send back." mr="body नाही. 204 म्हणजे: काम झालं, परत पाठवण्यासारखं काही नाही." />
          </p>
        ) : (
          <pre className="code-card json-view">
            <JsonView value={res.body} />
          </pre>
        )
      ) : (
        <dl className="res-headers">
          {Object.entries(res.headers).map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </motion.div>
  )
}

/** The request travelling to the server and the answer coming back. */
function Wire({ trip, status }: { trip: number; status: number | null }) {
  return (
    <div className="wire" aria-hidden>
      <span className="wire-end">
        📱 <L en="You" mr="तुम्ही" />
      </span>
      <div className="wire-line">
        <AnimatePresence>
          {trip > 0 && status === null && (
            <motion.span key={`req-${trip}`} className="wire-packet" initial={{ left: '0%', opacity: 0 }} animate={{ left: 'calc(100% - 28px)', opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: 'easeIn' }}>
              ✉️
            </motion.span>
          )}
          {trip > 0 && status !== null && (
            <motion.span key={`res-${trip}`} className={`wire-packet back s-${statusClass(status)}`} initial={{ left: 'calc(100% - 44px)', opacity: 1 }} animate={{ left: '0%', opacity: [1, 1, 0] }} transition={{ duration: 0.6, ease: 'easeOut' }}>
              {status}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span className="wire-end">
        🍲 TiffinGo <L en="server" mr="सर्व्हर" />
      </span>
    </div>
  )
}

function ApiDocs({ onPick }: { onPick: (e: (typeof ENDPOINTS)[number]) => void }) {
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 900)
  return (
    <nav className="api-docs" aria-label="API docs">
      <button type="button" className="api-docs-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <L en="API docs" mr="API माहिती" />
      </button>
      {open && (
        <>
          <p className="muted small">
            <L en="Click one to fill the request." mr="request भरण्यासाठी एकावर क्लिक करा." />
          </p>
          <ul>
            {ENDPOINTS.map((e) => (
              <li key={e.method + e.path}>
                <button type="button" className="doc-item" onClick={() => onPick(e)}>
                  <span className="doc-line">
                    <MethodPill method={e.method} />
                    <code>{e.path}</code>
                    {e.auth && <span title="Needs login" aria-label="needs login">🔑</span>}
                  </span>
                  <L en={e.en} mr={e.mr} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </nav>
  )
}

/**
 * Postman-style request builder. Send explores; Submit (when onSubmit is given) sends and hands the
 * exchange to the grader.
 */
export function ApiConsole({ initial, onSubmit, submitting }: { initial?: Partial<ApiDraft>; onSubmit?: (draft: ApiDraft, res: ApiResponse) => void; submitting?: boolean }) {
  const uid = useId()
  const [method, setMethod] = useState<HttpMethod>(initial?.method ?? 'GET')
  const [path, setPath] = useState(initial?.path ?? '/')
  const [rows, setRows] = useState<Row[]>(() => toRows(initial?.headers))
  const [body, setBody] = useState(initial?.body ?? '')
  const [tab, setTab] = useState<'headers' | 'body'>(initial?.body ? 'body' : 'headers')
  const [res, setRes] = useState<ApiResponse | null>(null)
  const [trip, setTrip] = useState(0)
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const dark = useDark()
  const extensions = useMemo(() => [jsonLang(), EditorView.lineWrapping], [])

  const fire = (submit: boolean) => {
    if (busy) return
    const draft: ApiDraft = { method, path, headers: fromRows(rows), body: hasBody(method) ? body : undefined }
    const out = send(draft)
    sfx.click()
    setBusy(true)
    setRes(null)
    setTrip((t) => t + 1)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setRes(out)
      setBusy(false)
      if (out.status >= 500) sfx.glitch()
      if (submit && onSubmit) onSubmit(draft, out)
    }, Math.min(1600, Math.max(450, out.timeMs * 0.6)))
  }

  const addRow = (key = '', value = '') => setRows((r) => (key && r.some((x) => x.key.toLowerCase() === key.toLowerCase()) ? r : [...r, { id: ++rowId, key, value }]))

  const pick = (e: (typeof ENDPOINTS)[number]) => {
    sfx.click()
    setMethod(e.method)
    setPath(e.path)
    if (e.body) {
      setBody(e.body)
      addRow('Content-Type', 'application/json')
      setTab('body')
    }
    if (e.auth) addRow('Authorization', 'Bearer ')
  }

  return (
    <div className="api-console">
      <ApiDocs onPick={pick} />
      <div className="api-main">
        <div
          className="request-bar"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              fire(false)
            }
          }}
        >
          <label className="sr-only" htmlFor={`${uid}-m`}>Method</label>
          <select id={`${uid}-m`} className={`method-select m-${method}`} value={method} onChange={(e) => setMethod(e.target.value as HttpMethod)}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <div className="url-box">
            <span className="url-base">{BASE_URL}</span>
            <label className="sr-only" htmlFor={`${uid}-p`}>Path</label>
            <input id={`${uid}-p`} className="url-path" value={path} onChange={(e) => setPath(e.target.value)} spellCheck={false} autoComplete="off" placeholder="/restaurants" />
          </div>
          <button type="button" className="btn send-btn" onClick={() => fire(false)} disabled={busy}>
            <L en="Send" mr="पाठवा" />
          </button>
        </div>

        <div className="req-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'headers'} className={tab === 'headers' ? 'on' : ''} onClick={() => setTab('headers')}>
            Headers {rows.length > 0 && <span className="count">{rows.length}</span>}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'body'} className={tab === 'body' ? 'on' : ''} onClick={() => setTab('body')}>
            Body {hasBody(method) && body.trim() && <span className="count">JSON</span>}
          </button>
        </div>

        {tab === 'headers' ? (
          <div className="headers-editor">
            {rows.length === 0 && (
              <p className="muted small">
                <L en="No headers yet. Headers are extra labels on the request, like Content-Type or Authorization." mr="अजून headers नाहीत. Headers म्हणजे request वरची जास्तीची लेबलं, जसे Content-Type किंवा Authorization." />
              </p>
            )}
            {rows.map((r, i) => (
              <div className="header-row" key={r.id}>
                <input aria-label={`Header ${i + 1} name`} value={r.key} placeholder="Name" spellCheck={false} onChange={(e) => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, key: e.target.value } : x)))} />
                <input aria-label={`Header ${i + 1} value`} value={r.value} placeholder="Value" spellCheck={false} onChange={(e) => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, value: e.target.value } : x)))} />
                <button type="button" className="btn quiet small" aria-label={`Remove header ${r.key || i + 1}`} onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}>
                  ✕
                </button>
              </div>
            ))}
            <div className="header-add">
              <button type="button" className="btn small" onClick={() => addRow()}>
                <L en="+ Add header" mr="header जोडा" />
              </button>
              <button type="button" className="btn quiet small mono" onClick={() => addRow('Content-Type', 'application/json')}>
                + Content-Type
              </button>
              <button type="button" className="btn quiet small mono" onClick={() => addRow('Authorization', 'Bearer ')}>
                + Authorization
              </button>
            </div>
          </div>
        ) : hasBody(method) ? (
          <div className="editor">
            <CodeMirror theme={dark ? 'dark' : 'light'} value={body} minHeight="110px" maxHeight="260px" extensions={extensions} onChange={setBody} basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }} />
          </div>
        ) : (
          <p className="muted small body-note">
            <L en={`${method} requests do not send a body. Switch the method to POST, PUT or PATCH to send data.`} mr={`${method} request सोबत body जात नाही. डेटा पाठवायचा असेल तर method POST, PUT किंवा PATCH करा.`} />
          </p>
        )}

        <div className="console-actions">
          <button type="button" className="btn" onClick={() => fire(false)} disabled={busy}>
            ▶ <L en="Send" mr="पाठवा" /> <span className="kbd">Ctrl + Enter</span>
          </button>
          {onSubmit && (
            <button type="button" className="btn primary" onClick={() => fire(true)} disabled={busy || submitting}>
              <L en="Submit this request" mr="ही request सादर करा" />
            </button>
          )}
        </div>

        <Wire trip={trip} status={res ? res.status : null} />
        {res && <ResponseView res={res} />}
      </div>
    </div>
  )
}
