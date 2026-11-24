import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PerfBug, PerfStep, T } from '../content/types.ts'
import { gradePerf, type PerfCatch } from '../perf/grade.ts'
import { fmtMs, runK6, type PerfResult } from '../perf/k6.ts'
import { Bi, L } from '../lib/i18n.tsx'
import { useDark } from '../lib/useDark.ts'
import { sfx } from '../lib/sound.ts'

const PLAY = {
  slow: { ms: 9000, label: { en: 'Slow', mr: 'हळू' } },
  normal: { ms: 5000, label: { en: 'Normal', mr: 'मध्यम' } },
  fast: { ms: 1500, label: { en: 'Fast', mr: 'जलद' } },
}
type Play = keyof typeof PLAY

function niceMax(v: number) {
  if (v <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}
const fmtClock = (s: number) => `${Math.floor(s / 60)}m${(s % 60).toFixed(1).padStart(4, '0')}s`

/** Response time (line), VUs (area) and errors (bars), drawn up to `upto` buckets. */
function LoadChart({ r, upto }: { r: PerfResult; upto: number }) {
  const W = 560
  const H = 220
  const pad = { l: 52, r: 44, t: 14, b: 30 }
  const s = r.series
  const n = s.t.length
  const tMax = s.t[n - 1] || 1
  const pMax = niceMax(Math.max(...s.p95, 1) * 1.1)
  const vMax = niceMax(Math.max(...s.vus, 1))
  const x = (t: number) => pad.l + (t / tMax) * (W - pad.l - pad.r)
  const yP = (v: number) => H - pad.b - (v / pMax) * (H - pad.t - pad.b)
  const yV = (v: number) => H - pad.b - (v / vMax) * (H - pad.t - pad.b)
  const k = Math.max(1, Math.min(n, upto))
  const pts = (arr: number[], y: (v: number) => number) => arr.slice(0, k).map((v, i) => `${x(s.t[i]).toFixed(1)},${y(v).toFixed(1)}`)
  const area = `M${x(0)},${H - pad.b} L${pts(s.vus, yV).join(' L')} L${x(s.t[k - 1])},${H - pad.b} Z`
  const bw = Math.max(1.5, (W - pad.l - pad.r) / n - 1)
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  const thresholdLine = r.thresholds
    .filter((t) => t.metric.startsWith('http_req_duration') && /^p\(9\d\)/.test(t.expr))
    .map((t) => Number(/(\d+(?:\.\d+)?)\s*$/.exec(t.expr)?.[1]))
    .filter((v) => v && v <= pMax)[0]
  return (
    <svg className="load-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Chart: ${r.maxVUs} virtual users, p95 response time up to ${fmtMs(Math.max(...s.p95))}`}>
      {ticks.map((f) => (
        <g key={f}>
          <line x1={pad.l} x2={W - pad.r} y1={yP(pMax * f)} y2={yP(pMax * f)} className="lc-grid" />
          <text x={pad.l - 6} y={yP(pMax * f) + 4} textAnchor="end" className="lc-axis">
            {fmtMs(pMax * f).replace('.00', '')}
          </text>
          <text x={W - pad.r + 6} y={yV(vMax * f) + 4} className="lc-axis lc-vu-axis">
            {Math.round(vMax * f)}
          </text>
        </g>
      ))}
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={x(tMax * f)} y={H - 10} textAnchor={f === 0 ? 'start' : f === 1 ? 'end' : 'middle'} className="lc-axis">
          {fmtClock(tMax * f).replace(/\.\ds$/, 's')}
        </text>
      ))}
      <path d={area} className="lc-vus" />
      {s.errors.slice(0, k).map((e, i) =>
        e > 0 ? <rect key={i} x={x(s.t[i]) - bw} y={H - pad.b - Math.max(2, e * 60)} width={bw} height={Math.max(2, e * 60)} className="lc-err" /> : null,
      )}
      {thresholdLine && (
        <g>
          <line x1={pad.l} x2={W - pad.r} y1={yP(thresholdLine)} y2={yP(thresholdLine)} className="lc-threshold" />
          <text x={W - pad.r - 4} y={yP(thresholdLine) - 4} textAnchor="end" className="lc-axis lc-th-label">
            goal {fmtMs(thresholdLine).replace('.00', '')}
          </text>
        </g>
      )}
      <polyline points={pts(s.p95, yP).join(' ')} className="lc-p95" />
      <circle cx={x(s.t[k - 1])} cy={yP(s.p95[k - 1])} r={4} className="lc-dot" />
      <text x={pad.l} y={10} className="lc-axis lc-legend">
        p95 response time
      </text>
      <text x={W - pad.r} y={10} textAnchor="end" className="lc-axis lc-vu-axis">
        VUs
      </text>
    </svg>
  )
}

function SummaryText({ text }: { text: string }) {
  return (
    <pre className="k6-summary">
      {text.split('\n').map((l, i) => (
        <span key={i} className={/^\s*✗|ERRO/.test(l) ? 'bad' : /^\s*✓/.test(l) ? 'good' : /█/.test(l) ? 'grp' : ''}>
          {l + '\n'}
        </span>
      ))}
    </pre>
  )
}

/** The load-test lab: write a k6 script, watch the simulated test play out, read the summary. */
export function LoadLab({ step, sandbox, solved, onSuccess, onFail }: { step?: PerfStep; sandbox?: { code: string; build?: PerfBug[] }; solved?: boolean; onSuccess?: () => void; onFail?: (t: T) => void }) {
  const cfg = step ?? sandbox!
  const [code, setCode] = useState(step ? step.starter : sandbox!.code)
  const [busy, setBusy] = useState<'sim' | 'grade' | null>(null)
  const [result, setResult] = useState<PerfResult | null>(null)
  const [upto, setUpto] = useState(0)
  const [play, setPlay] = useState<Play>('normal')
  const [catches, setCatches] = useState<PerfCatch[] | null>(null)
  const [tab, setTab] = useState<'summary' | 'endpoints'>('summary')
  const raf = useRef(0)
  const dark = useDark()
  const extensions = useMemo(() => [javascript(), EditorView.lineWrapping], [])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const animate = (r: PerfResult) =>
    new Promise<void>((done) => {
      const n = r.series.t.length
      const start = performance.now()
      const total = PLAY[play].ms
      const tick = (now: number) => {
        const f = Math.min(1, (now - start) / total)
        setUpto(Math.max(1, Math.round(f * n)))
        if (f < 1) raf.current = requestAnimationFrame(tick)
        else done()
      }
      raf.current = requestAnimationFrame(tick)
    })

  const run = async (submit: boolean) => {
    if (busy) return
    sfx.click()
    cancelAnimationFrame(raf.current)
    setBusy('sim')
    setResult(null)
    setCatches(null)
    setUpto(0)
    await new Promise((r) => setTimeout(r, 30))
    const r = await runK6(code, { bugs: cfg.build })
    setResult(r)
    if (!r.compileError && !r.error && r.series.t.length) await animate(r)
    setBusy(null)
    if (r.ok) sfx.chime()
    else sfx.buzz()
    if (submit && step && !solved) {
      setBusy('grade')
      const g = await gradePerf(step, code, r)
      setBusy(null)
      setCatches(g.catches.length ? g.catches : null)
      if (g.ok) onSuccess?.()
      else onFail?.(g.message)
    }
  }

  const r = result
  const n = r?.series.t.length ?? 0
  const i = Math.max(0, Math.min(n, upto) - 1)
  const done = r && upto >= n
  // while playing: the moment on the chart; when finished: the whole test (the last bucket is often a quiet ramp-down)
  const live = r && n ? (done ? { t: r.durationS, vus: r.maxVUs, rps: r.http.rps, p95: r.http.duration?.p95 ?? 0, err: r.http.failedRate } : { t: r.series.t[i], vus: r.series.vus[i], rps: r.series.rps[i], p95: r.series.p95[i], err: r.series.errors[i] }) : null
  const mood = !live ? 'idle' : live.err > 0.05 || live.p95 > 2000 ? 'down' : live.err > 0 || live.p95 > 600 ? 'strain' : 'ok'
  const reqSoFar = r ? Math.round(r.series.rps.slice(0, upto).reduce((a, b) => a + b, 0) * (r.series.t[0] || 1)) : 0

  return (
    <div className="load-lab">
      <div className="load-top">
        <div className="sel-editor-wrap">
          <div className="sel-file">
            <span aria-hidden>📈</span> load-test.js <span className="muted small">· k6</span>
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
            <CodeMirror theme={dark ? 'dark' : 'light'} value={code} minHeight="260px" maxHeight="500px" extensions={extensions} onChange={setCode} basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }} />
          </div>
        </div>

        <div className="load-panel" aria-live="polite">
          <div className="load-head">
            <span className={`server-light s-${mood}`} aria-hidden>
              <span />
            </span>
            <div className="load-head-text">
              <strong>StageDoor API</strong>
              <span className="mono small">
                {busy === 'sim' && !r ? 'simulating...' : live ? `running (${fmtClock(live.t)}), ${String(Math.round(live.vus)).padStart(2, '0')}/${r!.maxVUs} VUs, ${reqSoFar} requests` : 'idle · press Run'}
              </span>
            </div>
          </div>
          <div className="load-progress">
            <motion.span animate={{ width: `${n ? (upto / n) * 100 : 0}%` }} transition={{ duration: 0.1 }} />
          </div>
          <div className="load-tiles">
            <div className="tile">
              <span className="tile-label">{done ? "Peak VUs" : "VUs"}</span>
              <span className="tile-value tabular">{live ? Math.round(live.vus) : '–'}</span>
            </div>
            <div className="tile">
              <span className="tile-label">
                <L en="Requests/s" mr="requests/सेकंद" />
              </span>
              <span className="tile-value tabular">{live ? live.rps.toFixed(0) : '–'}</span>
            </div>
            <div className={`tile ${live && live.p95 > 600 ? 'warn' : ''}`}>
              <span className="tile-label">p95</span>
              <span className="tile-value tabular">{live ? fmtMs(live.p95) : '–'}</span>
            </div>
            <div className={`tile ${live && live.err > 0 ? 'bad' : ''}`}>
              <span className="tile-label">
                <L en="Errors" mr="errors" />
              </span>
              <span className="tile-value tabular">{live ? `${(live.err * 100).toFixed(1)}%` : '–'}</span>
            </div>
          </div>
          {r && n > 0 ? (
            <LoadChart r={r} upto={upto} />
          ) : (
            <div className="load-empty">
              {r?.compileError ? (
                <p className="sql-error mono small">
                  SyntaxError (line {r.compileError.line}): {r.compileError.message}
                </p>
              ) : r?.error ? (
                <p className="sql-error mono small">ERRO {r.error}</p>
              ) : (
                <p className="muted">
                  <L en="Press Run. The test plays out here in fast-forward: virtual users, response time and errors." mr="Run दाबा. test इथे वेगाने चालताना दिसेल: virtual users, response time आणि errors." />
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="console-actions sel-actions">
        <button type="button" className="btn" onClick={() => run(false)} disabled={Boolean(busy)}>
          ▶ <L en="Run load test" mr="load test चालवा" /> <span className="kbd">Ctrl + Enter</span>
        </button>
        {step && (
          <button type="button" className="btn primary" onClick={() => run(true)} disabled={Boolean(busy) || solved}>
            {busy === 'grade' ? <L en="Checking against problem builds..." mr="समस्या असलेल्या builds वर तपासतोय..." /> : <L en="Submit" mr="सादर करा" />}
          </button>
        )}
        <div className="speed" role="radiogroup" aria-label="Playback speed">
          {(Object.keys(PLAY) as Play[]).map((k) => (
            <button type="button" key={k} role="radio" aria-checked={play === k} className={play === k ? 'on' : ''} onClick={() => setPlay(k)}>
              <L en={PLAY[k].label.en} mr={PLAY[k].label.mr} />
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {r && done && !r.compileError && !r.error && (
          <motion.div className="load-results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {r.thresholds.length > 0 && (
              <div className="th-chips">
                {r.thresholds.map((t, j) => (
                  <span key={j} className={`th-chip ${t.pass ? 'ok' : 'bad'}`}>
                    {t.pass ? '✓' : '✗'} <span className="mono">{t.metric}</span> <span className="mono">{t.expr}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === 'summary'} className={tab === 'summary' ? 'on' : ''} onClick={() => setTab('summary')}>
                <L en="k6 summary" mr="k6 summary" />
              </button>
              <button type="button" role="tab" aria-selected={tab === 'endpoints'} className={tab === 'endpoints' ? 'on' : ''} onClick={() => setTab('endpoints')}>
                <L en="By endpoint" mr="endpoint नुसार" />
              </button>
            </div>
            {tab === 'summary' ? (
              <SummaryText text={r.summary} />
            ) : (
              <div className="table-wrap">
                <table className="ep-table">
                  <thead>
                    <tr>
                      <th>name</th>
                      <th>requests</th>
                      <th>avg</th>
                      <th>p95</th>
                      <th>max</th>
                      <th>failed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(r.byName)
                      .sort((a, b) => b[1].duration.p95 - a[1].duration.p95)
                      .map(([name, b]) => (
                        <tr key={name}>
                          <td className="mono">{name.replace('https://api.stagedoor.test', '')}</td>
                          <td className="tabular">{b.count}</td>
                          <td className="tabular">{fmtMs(b.duration.avg)}</td>
                          <td className={`tabular ${b.duration.p95 > 600 ? 'hot' : ''}`}>{fmtMs(b.duration.p95)}</td>
                          <td className="tabular">{fmtMs(b.duration.max)}</td>
                          <td className={`tabular ${b.failed ? 'hot' : ''}`}>{b.failed ? `${((b.failed / b.count) * 100).toFixed(1)}%` : '0'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            {(r.logs.length > 0 || r.output.length > 0) && (
              <pre className="k6-summary k6-logs">{[...r.output.slice(0, 12).map((o) => `INFO ${o}`), ...r.logs].join('\n')}</pre>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {catches && (
        <div className="mutants">
          <div className="test-editor-label">
            <L en="Problem builds: did your thresholds catch them?" mr="समस्या असलेले builds: तुमच्या thresholds ने पकडले का?" />
          </div>
          <ul>
            {catches.map((c, j) => (
              <motion.li key={j} className={c.caught ? 'pass' : 'fail'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: j * 0.12 }}>
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
