// A k6 look-alike. The learner's script is real k6 JavaScript (types stripped with sucrase); it runs
// against the StageDoor server model in simulated time, so a 10-minute soak test finishes in a second.
//
// How time works: k6 scripts are synchronous, so each virtual user (VU) iteration is re-run from the
// start every time it reaches a new HTTP call, replaying the answers it already got. That lets every
// request reach the server in true time order (a FIFO queue), which is what makes queueing, slowdowns
// and errors under load behave like the real thing.
import { transform } from 'sucrase'
import { PERF_BASE, rng, StageDoorServer, type PerfBug, type SimRequest } from './server.ts'

export interface Sample {
  t: number
  v: number
  tags: Record<string, string>
}
export interface ThresholdResult {
  metric: string
  expr: string
  pass: boolean
  value: number | null
}
export interface TrendStats {
  avg: number
  min: number
  med: number
  max: number
  p90: number
  p95: number
  p99: number
  count: number
}
export interface PerfResult {
  ok: boolean
  compileError?: { message: string; line: number }
  /** an error that stopped the test (bad options, script crash in setup...) */
  error?: string
  summary: string
  thresholds: ThresholdResult[]
  thresholdsPassed: boolean
  checks: { name: string; group: string; passes: number; fails: number }[]
  checksRate: number | null
  http: { count: number; failedRate: number; rps: number; duration: TrendStats | null }
  byName: Record<string, { count: number; failed: number; duration: TrendStats }>
  iterations: number
  dropped: number
  interrupted: number
  maxVUs: number
  durationS: number
  series: { t: number[]; vus: number[]; rps: number[]; p95: number[]; errors: number[] }
  logs: string[]
  output: string[]
  abortedBy?: string
  options: Record<string, unknown>
  usedSleep: boolean
}
export interface PerfOptions {
  bugs?: PerfBug[]
  /** called now and then so the UI stays responsive */
  yieldEvery?: number
}

const MAX_VUS = 1000
const MAX_REQUESTS = 600000
const MAX_DURATION_MS = 2 * 3600 * 1000
const MAX_ITERATIONS = 300000

class Pause {
  req: SimRequest[]
  t: number
  timeout: number
  constructor(req: SimRequest[], t: number, timeout: number) {
    this.req = req
    this.t = t
    this.timeout = timeout
  }
}
class FailError extends Error {}
class AbortTest extends Error {}

export function parseDuration(v: unknown): number {
  if (typeof v === 'number') return v
  const s = String(v ?? '').trim()
  if (!s) return 0
  let ms = 0
  const re = /(\d+(?:\.\d+)?)(ms|s|m|h)/g
  let m: RegExpExecArray | null
  let matched = ''
  while ((m = re.exec(s))) {
    matched += m[0]
    const n = Number(m[1])
    ms += m[2] === 'ms' ? n : m[2] === 's' ? n * 1000 : m[2] === 'm' ? n * 60000 : n * 3600000
  }
  if (matched !== s) throw new Error(`invalid duration "${s}". Use values like "30s", "2m" or "1m30s".`)
  return ms
}

function quantile(sorted: number[], q: number) {
  if (!sorted.length) return 0
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}
function trend(vals: number[]): TrendStats | null {
  if (!vals.length) return null
  const s = [...vals].sort((a, b) => a - b)
  const sum = s.reduce((a, b) => a + b, 0)
  return { avg: sum / s.length, min: s[0], med: quantile(s, 0.5), max: s[s.length - 1], p90: quantile(s, 0.9), p95: quantile(s, 0.95), p99: quantile(s, 0.99), count: s.length }
}
export function fmtMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2).replace(/\.?0+$/, '')}s`
  const m = Math.floor(ms / 60000)
  const s = Math.round((ms % 60000) / 1000)
  return `${m}m${s}s`
}
function getPath(o: unknown, path: string): unknown {
  let cur = o
  for (const p of path.split('.').filter(Boolean)) {
    if (cur === null || cur === undefined) return undefined
    if (p === '#' && Array.isArray(cur)) return cur.length
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

// ---------- the simulated "users.json" file for data-driven tests ----------
const USERS = Array.from({ length: 200 }, (_, i) => {
  const n = String(i + 1).padStart(3, '0')
  return { username: `fan${n}`, password: `pass${n}` }
})
const FILES: Record<string, string> = {
  'users.json': JSON.stringify(USERS, null, 2),
  'users.csv': 'username,password\n' + USERS.map((u) => `${u.username},${u.password}`).join('\n'),
  'events.json': JSON.stringify([1, 2, 3, 4, 5, 6]),
}

interface Ctx {
  vu: number
  iter: number
  scenario: string
  iterInScenario: number
  clock: number
  call: number
  replay: { res: ResponseObj; end: number }[]
  buffer: (() => void)[]
  groups: string[]
  rand: () => number
}

class ResponseObj {
  status: number
  body: string
  headers: Record<string, string>
  timings: Record<string, number>
  url: string
  request: { method: string; url: string; body: string | null; headers: Record<string, string> }
  error: string
  error_code: number
  constructor(req: SimRequest, status: number, body: string, duration: number, waiting: number, error = '', code = 0) {
    this.status = status
    this.body = body
    this.headers = { 'Content-Type': 'application/json' }
    this.timings = { duration, waiting, sending: 0.05, receiving: Math.max(0.1, duration - waiting - 0.05), blocked: 0, connecting: 0, tls_handshaking: 0 }
    this.url = req.url
    this.request = { method: req.method, url: req.url, body: req.body, headers: req.headers }
    this.error = error
    this.error_code = code
  }
  json(selector?: string) {
    let v: unknown
    try {
      v = JSON.parse(this.body)
    } catch {
      throw new Error(`cannot parse json due to an error at line 1, character 1: the body is not JSON (status ${this.status})`)
    }
    return selector ? getPath(v, selector) : v
  }
  html() {
    throw new Error('res.html() is not supported in this lab')
  }
}

interface Metric {
  type: 'trend' | 'counter' | 'rate' | 'gauge'
  samples: Sample[]
  isTime?: boolean
}

export function compileK6(code: string): { js: string } | { error: { message: string; line: number } } {
  try {
    const js = transform(code, { transforms: ['typescript', 'imports'], disableESTransforms: true }).code
    try {
      new Function('require', 'exports', 'module', 'open', '__ENV', 'console', 'Math', js)
    } catch (e) {
      return { error: { message: String((e as Error).message), line: 0 } }
    }
    return { js }
  } catch (e) {
    const msg = String((e as Error).message)
    const m = /\((\d+):(\d+)\)/.exec(msg)
    return { error: { message: msg.replace(/\s*\(\d+:\d+\)$/, ''), line: m ? Number(m[1]) : 0 } }
  }
}

interface Scenario {
  name: string
  executor: string
  exec: string
  startTime: number
  gracefulStop: number
  vus: number
  duration: number
  iterations: number
  stages: { duration: number; target: number }[]
  startVUs: number
  rate: number
  timeUnit: number
  startRate: number
  preAllocatedVUs: number
  maxVUs: number
  maxDuration: number
}

function parseScenarios(opts: Record<string, unknown>): Scenario[] {
  const base = (name: string, o: Record<string, unknown>): Scenario => ({
    name,
    executor: String(o.executor ?? ''),
    exec: String(o.exec ?? 'default'),
    startTime: parseDuration(o.startTime ?? 0),
    gracefulStop: parseDuration(o.gracefulStop ?? '30s'),
    vus: Number(o.vus ?? 1),
    duration: parseDuration(o.duration ?? 0),
    iterations: Number(o.iterations ?? 0),
    stages: ((o.stages as { duration: unknown; target: unknown }[]) ?? []).map((s) => ({ duration: parseDuration(s.duration), target: Number(s.target ?? 0) })),
    startVUs: Number(o.startVUs ?? 1),
    rate: Number(o.rate ?? 0),
    timeUnit: parseDuration(o.timeUnit ?? '1s'),
    startRate: Number(o.startRate ?? 0),
    preAllocatedVUs: Number(o.preAllocatedVUs ?? 1),
    maxVUs: Number(o.maxVUs ?? o.preAllocatedVUs ?? 1),
    maxDuration: parseDuration(o.maxDuration ?? '10m'),
  })
  if (opts.scenarios && typeof opts.scenarios === 'object') {
    return Object.entries(opts.scenarios as Record<string, Record<string, unknown>>).map(([name, o]) => {
      const sc = base(name, o)
      const known = ['constant-vus', 'ramping-vus', 'constant-arrival-rate', 'ramping-arrival-rate', 'per-vu-iterations', 'shared-iterations']
      if (!known.includes(sc.executor)) throw new Error(`scenario "${name}": executor "${sc.executor}" is not supported here. Use one of: ${known.join(', ')}`)
      return sc
    })
  }
  const o = opts
  if (Array.isArray(o.stages) && o.stages.length) return [{ ...base('default', o), executor: 'ramping-vus', startVUs: Number(o.vus ?? 1) }]
  if (o.iterations && !o.duration) return [{ ...base('default', o), executor: 'shared-iterations' }]
  if (o.duration) return [{ ...base('default', o), executor: 'constant-vus' }]
  return [{ ...base('default', o), executor: 'shared-iterations', iterations: Number(o.iterations ?? 1), vus: Number(o.vus ?? 1) }]
}

function stageValue(stages: { duration: number; target: number }[], start: number, t: number): number {
  let prev = start
  let at = 0
  for (const s of stages) {
    if (t < at + s.duration) return prev + ((s.target - prev) * (t - at)) / Math.max(1, s.duration)
    at += s.duration
    prev = s.target
  }
  return prev
}
const stagesLength = (stages: { duration: number }[]) => stages.reduce((a, s) => a + s.duration, 0)

/** Run a k6 script in simulated time. Never throws. */
export async function runK6(code: string, opts: PerfOptions = {}): Promise<PerfResult> {
  const logs: string[] = []
  const output: string[] = []
  const metrics = new Map<string, Metric>()
  const checkStats = new Map<string, { name: string; group: string; passes: number; fails: number }>()
  let usedSleep = false
  const empty = (extra: Partial<PerfResult>): PerfResult => ({
    ok: false,
    summary: '',
    thresholds: [],
    thresholdsPassed: false,
    checks: [],
    checksRate: null,
    http: { count: 0, failedRate: 0, rps: 0, duration: null },
    byName: {},
    iterations: 0,
    dropped: 0,
    interrupted: 0,
    maxVUs: 0,
    durationS: 0,
    series: { t: [], vus: [], rps: [], p95: [], errors: [] },
    logs,
    output,
    options: {},
    usedSleep,
    ...extra,
  })
  const compiled = compileK6(code)
  if ('error' in compiled) return empty({ compileError: compiled.error })

  const metric = (name: string, type: Metric['type'], isTime = false) => {
    let m = metrics.get(name)
    if (!m) metrics.set(name, (m = { type, samples: [], isTime }))
    return m
  }
  ;['http_reqs', 'http_req_duration', 'http_req_waiting', 'http_req_failed', 'iterations', 'iteration_duration', 'checks', 'data_received', 'data_sent'].forEach((n) =>
    metric(n, n === 'http_reqs' || n === 'iterations' || n.startsWith('data_') ? 'counter' : n === 'http_req_failed' || n === 'checks' ? 'rate' : 'trend', n.endsWith('duration') || n === 'http_req_waiting'),
  )

  const server = new StageDoorServer(opts.bugs, 42)
  let ctx: Ctx | null = null
  let inInit = true
  const need = (what: string) => {
    if (!ctx) throw new Error(`${what} can only be used inside the default function (or setup/teardown), not in the init code at the top of the file`)
    return ctx
  }
  const tagsNow = (c: Ctx, extra: Record<string, string> = {}) => ({ scenario: c.scenario, group: c.groups.length ? '::' + c.groups.join('::') : '', ...extra })

  // ----- k6/http -----
  const toReq = (method: string, url: unknown, body: unknown, params: Record<string, unknown> = {}): SimRequest => {
    if (typeof url !== 'string') throw new Error(`http.${method.toLowerCase()}: the URL must be a string`)
    if (!/^https?:\/\//.test(url)) throw new Error(`invalid URL "${url}": use the full address, like ${PERF_BASE}/events`)
    let b: string | null = null
    if (body !== undefined && body !== null) b = typeof body === 'string' ? body : new URLSearchParams(Object.entries(body as Record<string, string>)).toString()
    const headers = { ...((params.headers as Record<string, string>) ?? {}) }
    return { method, url, body: b, headers }
  }
  const nameOf = (req: SimRequest, params: Record<string, unknown>) => String((params.tags as Record<string, string>)?.name ?? req.url)
  const issue = (reqs: { req: SimRequest; params: Record<string, unknown> }[]): ResponseObj[] => {
    const c = need('http requests')
    const start = c.clock
    const out: ResponseObj[] = []
    let end = start
    for (let i = 0; i < reqs.length; i++) {
      const idx = c.call++
      const rec = c.replay[idx]
      if (!rec) throw new Pause(reqs.slice(i).map((r) => r.req), start, parseDuration(reqs[i].params.timeout ?? '60s'))
      out.push(rec.res)
      end = Math.max(end, rec.end)
      const { req, params } = reqs[i]
      const res = rec.res
      const t = start
      const tags = tagsNow(c, { name: nameOf(req, params), method: req.method, status: String(res.status), url: req.url, expected_response: String(res.status >= 200 && res.status < 400), ...((params.tags as Record<string, string>) ?? {}) })
      c.buffer.push(() => {
        metric('http_reqs', 'counter').samples.push({ t, v: 1, tags })
        metric('http_req_duration', 'trend', true).samples.push({ t, v: res.timings.duration, tags })
        metric('http_req_waiting', 'trend', true).samples.push({ t, v: res.timings.waiting, tags })
        metric('http_req_failed', 'rate').samples.push({ t, v: res.status >= 200 && res.status < 400 ? 0 : 1, tags })
        metric('data_received', 'counter').samples.push({ t, v: res.body.length + 180, tags })
        metric('data_sent', 'counter').samples.push({ t, v: (req.body?.length ?? 0) + 120, tags })
      })
    }
    c.clock = end
    return out
  }
  const httpMod = {
    get: (url: unknown, params?: Record<string, unknown>) => issue([{ req: toReq('GET', url, null, params), params: params ?? {} }])[0],
    del: (url: unknown, body?: unknown, params?: Record<string, unknown>) => issue([{ req: toReq('DELETE', url, body, params), params: params ?? {} }])[0],
    head: (url: unknown, params?: Record<string, unknown>) => issue([{ req: toReq('HEAD', url, null, params), params: params ?? {} }])[0],
    post: (url: unknown, body?: unknown, params?: Record<string, unknown>) => issue([{ req: toReq('POST', url, body, params), params: params ?? {} }])[0],
    put: (url: unknown, body?: unknown, params?: Record<string, unknown>) => issue([{ req: toReq('PUT', url, body, params), params: params ?? {} }])[0],
    patch: (url: unknown, body?: unknown, params?: Record<string, unknown>) => issue([{ req: toReq('PATCH', url, body, params), params: params ?? {} }])[0],
    request: (method: string, url: unknown, body?: unknown, params?: Record<string, unknown>) => issue([{ req: toReq(String(method).toUpperCase(), url, body, params), params: params ?? {} }])[0],
    batch: (list: unknown[]) =>
      issue(
        list.map((x) => {
          if (typeof x === 'string') return { req: toReq('GET', x, null), params: {} }
          if (Array.isArray(x)) return { req: toReq(String(x[0]).toUpperCase(), x[1], x[2], x[3] as Record<string, unknown>), params: (x[3] as Record<string, unknown>) ?? {} }
          const o = x as { method?: string; url: string; body?: unknown; params?: Record<string, unknown> }
          return { req: toReq(String(o.method ?? 'GET').toUpperCase(), o.url, o.body, o.params), params: o.params ?? {} }
        }),
      ),
    expectedStatuses: () => null,
    setResponseCallback: () => {},
  }

  // ----- k6 -----
  const check = (val: unknown, sets: Record<string, (v: unknown) => unknown>, tags: Record<string, string> = {}) => {
    const c = need('check()')
    let all = true
    for (const [name, fn] of Object.entries(sets ?? {})) {
      let pass = false
      try {
        pass = Boolean(typeof fn === 'function' ? fn(val) : fn)
      } catch (e) {
        pass = false
        const msg = `check "${name}" threw: ${(e as Error).message}`
        c.buffer.push(() => logs.push(msg))
      }
      all = all && pass
      const t = c.clock
      const group = c.groups.length ? '::' + c.groups.join('::') : ''
      const tg = { ...tagsNow(c), check: name, ...tags }
      c.buffer.push(() => {
        metric('checks', 'rate').samples.push({ t, v: pass ? 1 : 0, tags: tg })
        const key = group + '\u0000' + name
        const st = checkStats.get(key) ?? { name, group, passes: 0, fails: 0 }
        if (pass) st.passes++
        else st.fails++
        checkStats.set(key, st)
      })
    }
    return all
  }
  const sleep = (s: unknown) => {
    const c = need('sleep()')
    usedSleep = true
    const n = Number(s)
    if (!(n >= 0)) throw new Error('sleep() needs a number of seconds, like sleep(1)')
    c.clock += n * 1000
  }
  const group = (name: string, fn: () => unknown) => {
    const c = need('group()')
    const start = c.clock
    c.groups.push(String(name))
    try {
      return fn()
    } finally {
      const tags = tagsNow(c)
      c.groups.pop()
      const end = c.clock
      c.buffer.push(() => metric('group_duration', 'trend', true).samples.push({ t: start, v: end - start, tags }))
    }
  }
  const fail = (msg = '') => {
    throw new FailError(msg)
  }

  // ----- k6/metrics -----
  class CustomMetric {
    name: string
    type: Metric['type']
    constructor(name: string, type: Metric['type'], isTime = false) {
      if (!inInit) throw new Error('metrics must be created in the init code (at the top of the file)')
      this.name = name
      this.type = type
      metric(name, type, isTime)
    }
    add(v: number | boolean, tags: Record<string, string> = {}) {
      const c = need(`${this.name}.add()`)
      const t = c.clock
      const tg = { ...tagsNow(c), ...tags }
      const val = typeof v === 'boolean' ? (v ? 1 : 0) : Number(v)
      c.buffer.push(() => metric(this.name, this.type).samples.push({ t, v: val, tags: tg }))
    }
  }
  const metricsMod = {
    Trend: class extends CustomMetric {
      constructor(name: string, isTime = false) {
        super(name, 'trend', isTime)
      }
    },
    Counter: class extends CustomMetric {
      constructor(name: string) {
        super(name, 'counter')
      }
    },
    Rate: class extends CustomMetric {
      constructor(name: string) {
        super(name, 'rate')
      }
    },
    Gauge: class extends CustomMetric {
      constructor(name: string) {
        super(name, 'gauge')
      }
    },
  }
  const execMod = {
    get vu() {
      const c = ctx
      return { idInTest: c?.vu ?? 0, idInInstance: c?.vu ?? 0, iterationInInstance: c?.iter ?? 0, iterationInScenario: c?.iterInScenario ?? 0 }
    },
    get scenario() {
      return { name: ctx?.scenario ?? 'default', iterationInTest: ctx?.iterInScenario ?? 0, executor: '' }
    },
    test: {
      abort: (msg = '') => {
        throw new AbortTest(msg || 'test.abort() was called')
      },
    },
  }
  const utils = {
    randomIntBetween: (a: number, b: number) => Math.floor((ctx?.rand ?? Math.random)() * (b - a + 1)) + a,
    randomItem: <T,>(arr: T[]) => arr[Math.floor((ctx?.rand ?? Math.random)() * arr.length)],
    randomString: (n: number) => Array.from({ length: n }, () => 'abcdefghijklmnopqrstuvwxyz'[Math.floor((ctx?.rand ?? Math.random)() * 26)]).join(''),
    uuidv4: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, () => Math.floor((ctx?.rand ?? Math.random)() * 16).toString(16)),
  }
  const modules: Record<string, unknown> = {
    k6: { check, sleep, group, fail, randomSeed: () => {} },
    'k6/http': { default: httpMod, ...httpMod },
    'k6/metrics': metricsMod,
    'k6/data': { SharedArray: class { constructor(_n: string, fn: () => unknown[]) { return fn() as unknown as object } } },
    'k6/execution': { default: execMod },
  }
  const requireFn = (name: string) => {
    if (name in modules) return modules[name]
    if (/^https:\/\/jslib\.k6\.io\/k6-utils\//.test(name)) return utils
    throw new Error(`Cannot find module "${name}". This lab supports k6, k6/http, k6/metrics, k6/data, k6/execution and jslib k6-utils.`)
  }
  const open = (path: string) => {
    if (!inInit) throw new Error('open() can only be called in the init code (at the top of the file)')
    const name = String(path).replace(/^\.?\/?(data\/)?/, '')
    if (!(name in FILES)) throw new Error(`open ${path}: no such file. Files you can use: ${Object.keys(FILES).join(', ')}`)
    return FILES[name]
  }
  const consoleShim = {
    log: (...a: unknown[]) => {
      const text = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')
      if (ctx) ctx.buffer.push(() => (output.length < 200 ? output.push(text) : null))
      else output.push(text)
    },
  }
  Object.assign(consoleShim, { info: consoleShim.log, warn: consoleShim.log, error: consoleShim.log, debug: () => {} })
  const mathShim = Object.create(Math) as Math
  mathShim.random = () => (ctx ? ctx.rand() : 0.5)

  // ----- init code -----
  const mod = { exports: {} as Record<string, unknown> }
  try {
    // __VU and __ITER change for every iteration, so they read from the running context
    const js = compiled.js.replace(/\b__VU\b/g, '__k6ctx.vu').replace(/\b__ITER\b/g, '__k6ctx.iter')
    const k6ctx = {
      get vu() {
        return ctx?.vu ?? 0
      },
      get iter() {
        return ctx?.iter ?? 0
      },
    }
    const f = new Function('require', 'exports', 'module', 'open', '__ENV', 'console', 'Math', '__k6ctx', js)
    f(requireFn, mod.exports, mod, open, { BASE_URL: PERF_BASE }, consoleShim, mathShim, k6ctx)
  } catch (e) {
    return empty({ error: `The init code failed: ${(e as Error).message}` })
  }
  inInit = false
  const exp = mod.exports
  const options = (exp.options as Record<string, unknown>) ?? {}
  let scenarios: Scenario[]
  try {
    scenarios = parseScenarios(options)
  } catch (e) {
    return empty({ error: `options: ${(e as Error).message}`, options })
  }
  for (const sc of scenarios) {
    if (typeof exp[sc.exec] !== 'function') return empty({ error: sc.exec === 'default' ? 'There is no default function. Add: export default function () { ... }' : `scenario "${sc.name}": function '${sc.exec}' is not exported`, options })
    const peak = Math.max(sc.vus, sc.startVUs, sc.maxVUs, ...sc.stages.map((s) => s.target))
    if (peak > MAX_VUS) return empty({ error: `This practice lab simulates up to ${MAX_VUS} VUs. Your options ask for ${peak}.`, options })
    if (sc.executor === 'ramping-vus' && !sc.stages.length) return empty({ error: `scenario "${sc.name}": ramping-vus needs stages`, options })
  }
  if (scenarios.some((sc) => sc.executor.includes('arrival'))) metric('dropped_iterations', 'counter')
  metric('group_duration', 'trend', true)
  const thresholdDefs: { metric: string; base: string; filter: Record<string, string>; exprs: { expr: string; abortOnFail: boolean }[] }[] = []
  for (const [key, val] of Object.entries((options.thresholds as Record<string, unknown>) ?? {})) {
    const mm = /^([\w.]+)(?:\{(.*)\})?$/.exec(key.trim())
    if (!mm) return empty({ error: `thresholds: cannot read the metric name "${key}"`, options })
    if (!metrics.has(mm[1])) return empty({ error: `invalid threshold defined on ${key}; reason: no metric name "${mm[1]}" found. Check the spelling, or create it with new Trend('${mm[1]}') at the top of the file.`, options })
    const filter: Record<string, string> = {}
    if (mm[2]) for (const part of mm[2].split(',')) {
      const i = part.indexOf(':')
      if (i < 0) return empty({ error: `thresholds: tag filter "${part}" in "${key}" must look like name:value`, options })
      filter[part.slice(0, i).trim()] = part.slice(i + 1).trim()
    }
    const list = (Array.isArray(val) ? val : [val]).map((x) => (typeof x === 'string' ? { expr: x, abortOnFail: false } : { expr: String((x as { threshold: string }).threshold), abortOnFail: Boolean((x as { abortOnFail?: boolean }).abortOnFail) }))
    for (const x of list) if (!/^\s*(avg|min|max|med|count|rate|value|p\(\d+(?:\.\d+)?\))\s*(<=|>=|==|===|!=|<|>)\s*-?\d+(?:\.\d+)?\s*$/.test(x.expr)) return empty({ error: `thresholds: "${x.expr}" for ${key} is not valid. Write something like 'p(95)<500' or 'rate<0.01'.`, options })
    thresholdDefs.push({ metric: key, base: mm[1], filter, exprs: list })
  }

  // ----- setup -----
  const runOnce = (fn: () => unknown, label: string, t0: number): { value: unknown; end: number } => {
    const c: Ctx = { vu: 0, iter: 0, scenario: label, iterInScenario: 0, clock: t0, call: 0, replay: [], buffer: [], groups: [], rand: rng(7) }
    for (let guard = 0; guard < 500; guard++) {
      c.clock = t0
      c.call = 0
      c.buffer = []
      c.groups = []
      c.rand = rng(7)
      ctx = c
      try {
        const value = fn()
        ctx = null
        c.buffer.forEach((b) => b())
        return { value, end: c.clock }
      } catch (e) {
        ctx = null
        if (!(e instanceof Pause)) throw e
        for (const req of e.req) {
          const r = server.handle(req, e.t)
          c.replay.push({ res: new ResponseObj(req, r.status, r.body, r.duration, r.waiting), end: e.t + r.duration })
        }
      }
    }
    throw new Error(`${label}() made too many requests`)
  }
  let data: unknown
  let t0 = 0
  try {
    if (typeof exp.setup === 'function') {
      const r = runOnce(() => (exp.setup as () => unknown)(), 'setup', 0)
      data = r.value === undefined ? undefined : JSON.parse(JSON.stringify(r.value))
      t0 = r.end
    }
  } catch (e) {
    return empty({ error: `setup() failed: ${(e as Error).message}`, options })
  }

  // ----- the load -----
  interface VU {
    id: number
    sc: Scenario
    iter: number
    busy: boolean
    replay: { res: ResponseObj; end: number }[]
    iterStart: number
    pending: Pause | null
  }
  type Ev = { t: number; vu: VU; kind: 'start' | 'request' | 'free' } | { t: number; kind: 'arrival'; sc: Scenario; pool: VU[] }
  const heap: Ev[] = []
  const push = (e: Ev) => {
    heap.push(e)
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (heap[p].t <= heap[i].t) break
      ;[heap[p], heap[i]] = [heap[i], heap[p]]
      i = p
    }
  }
  const pop = (): Ev | undefined => {
    const top = heap[0]
    const last = heap.pop()
    if (heap.length && last) {
      heap[0] = last
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = l + 1
        let m = i
        if (l < heap.length && heap[l].t < heap[m].t) m = l
        if (r < heap.length && heap[r].t < heap[m].t) m = r
        if (m === i) break
        ;[heap[i], heap[m]] = [heap[m], heap[i]]
        i = m
      }
    }
    return top
  }

  let vuSeq = 0
  const intervals: [number, number][] = []
  let iterations = 0
  let dropped = 0
  let interrupted = 0
  const errorCounts = new Map<string, number>()
  const scState = new Map<string, { done: number; started: number; perVU: Map<number, number> }>()
  let abortedAt: number | null = null
  let abortedBy: string | undefined
  let maxVUs = 0

  const endOf = (sc: Scenario) => {
    const start = t0 + sc.startTime
    switch (sc.executor) {
      case 'constant-vus':
      case 'constant-arrival-rate':
        return start + sc.duration
      case 'ramping-vus':
      case 'ramping-arrival-rate':
        return start + stagesLength(sc.stages)
      default:
        return start + sc.maxDuration
    }
  }
  const testEnd = Math.max(...scenarios.map(endOf))
  if (testEnd - t0 > MAX_DURATION_MS) return empty({ error: 'This practice lab simulates tests up to 2 hours long.', options })

  const allowed = (vu: VU, t: number): 'go' | 'wait' | 'stop' => {
    const sc = vu.sc
    const start = t0 + sc.startTime
    const st = scState.get(sc.name)!
    if (abortedAt !== null) return 'stop'
    if (t < start) return 'wait'
    if (t >= endOf(sc)) return 'stop'
    switch (sc.executor) {
      case 'constant-vus':
        return 'go'
      case 'ramping-vus': {
        const target = Math.round(stageValue(sc.stages, sc.startVUs, t - start))
        if (vu.id - firstId(sc) < target) return 'go'
        const remaining = sc.stages.length && t - start < stagesLength(sc.stages) ? 'wait' : 'stop'
        return remaining
      }
      case 'per-vu-iterations':
        return (st.perVU.get(vu.id) ?? 0) < sc.iterations ? 'go' : 'stop'
      case 'shared-iterations':
        return st.started < sc.iterations ? 'go' : 'stop'
      default:
        return 'stop'
    }
  }
  const firstIds = new Map<string, number>()
  const firstId = (sc: Scenario) => firstIds.get(sc.name)!

  const runAttempt = (vu: VU, now: number) => {
    const fn = exp[vu.sc.exec] as (d: unknown) => unknown
    const c: Ctx = { vu: vu.id, iter: vu.iter, scenario: vu.sc.name, iterInScenario: vu.iter, clock: vu.iterStart, call: 0, replay: vu.replay, buffer: [], groups: [], rand: rng(vu.id * 7919 + vu.iter * 104729 + 1) }
    ctx = c
    let error: unknown = null
    let paused: Pause | null = null
    try {
      fn(data)
    } catch (e) {
      if (e instanceof Pause) paused = e
      else error = e
    }
    ctx = null
    if (paused) {
      vu.pending = paused
      push({ t: paused.t, vu, kind: 'request' })
      return
    }
    // iteration finished (or crashed): commit what it measured
    c.buffer.forEach((b) => b())
    // an iteration always takes a little time, so a crashing or empty function cannot freeze the clock
    const end = Math.max(c.clock, now + (c.call === 0 ? (error ? 50 : 1) : 0))
    if (iterations >= MAX_ITERATIONS && abortedAt === null) {
      abortedAt = end
      abortedBy = c.call === 0 && error ? `every iteration fails at once: ${(error as Error)?.message ?? String(error)}` : `more than ${MAX_ITERATIONS.toLocaleString('en-US')} iterations. Add sleep() between requests, or use fewer VUs.`
    }
    if (error instanceof AbortTest) {
      abortedAt = end
      abortedBy = `test.abort(): ${error.message}`
    } else if (error) {
      const msg = error instanceof FailError ? `fail: ${error.message}` : `${(error as Error)?.message ?? String(error)}`
      errorCounts.set(msg, (errorCounts.get(msg) ?? 0) + 1)
    }
    const tags = { scenario: vu.sc.name, group: '' }
    metric('iterations', 'counter').samples.push({ t: vu.iterStart, v: 1, tags })
    metric('iteration_duration', 'trend', true).samples.push({ t: vu.iterStart, v: end - vu.iterStart, tags })
    intervals.push([vu.iterStart, end])
    iterations++
    vu.iter++
    vu.replay = []
    vu.pending = null
    // The VU is busy until its iteration really ends (last response or sleep), not when its last request leaves.
    if (vu.sc.executor !== 'constant-arrival-rate' && vu.sc.executor !== 'ramping-arrival-rate') {
      vu.busy = false
      push({ t: end, vu, kind: 'start' })
    } else if (end <= now) vu.busy = false
    else push({ t: end, vu, kind: 'free' })
  }

  const startIteration = (vu: VU, t: number) => {
    const st = scState.get(vu.sc.name)!
    st.started++
    st.perVU.set(vu.id, (st.perVU.get(vu.id) ?? 0) + 1)
    vu.busy = true
    vu.iterStart = t
    vu.replay = []
    runAttempt(vu, t)
  }

  for (const sc of scenarios) {
    scState.set(sc.name, { done: 0, started: 0, perVU: new Map() })
    firstIds.set(sc.name, vuSeq + 1)
    const start = t0 + sc.startTime
    if (sc.executor === 'constant-arrival-rate' || sc.executor === 'ramping-arrival-rate') {
      const pool: VU[] = Array.from({ length: sc.preAllocatedVUs }, () => ({ id: ++vuSeq, sc, iter: 0, busy: false, replay: [], iterStart: 0, pending: null }))
      push({ t: start, kind: 'arrival', sc, pool })
    } else {
      const n = sc.executor === 'ramping-vus' ? Math.max(sc.startVUs, ...sc.stages.map((s) => s.target)) : sc.vus
      for (let i = 0; i < n; i++) push({ t: start, vu: { id: ++vuSeq, sc, iter: 0, busy: false, replay: [], iterStart: 0, pending: null }, kind: 'start' })
    }
  }

  let processed = 0
  let nextAbortCheck = t0 + 5000
  const abortDefs = thresholdDefs.filter((d) => d.exprs.some((x) => x.abortOnFail))
  const yieldEvery = opts.yieldEvery ?? 4000
  try {
    for (let ev = pop(); ev; ev = pop()) {
      if (++processed % yieldEvery === 0) await new Promise((r) => setTimeout(r, 0))
      if (server.requests > MAX_REQUESTS) {
        abortedAt = ev.t
        abortedBy = `this test would send more than ${MAX_REQUESTS.toLocaleString('en-US')} requests, which is too big for the practice lab. Use fewer VUs or a shorter duration.`
      }
      if (abortDefs.length && ev.t >= nextAbortCheck && abortedAt === null) {
        nextAbortCheck = ev.t + 5000
        const failing = evaluate(abortDefs, metrics, ev.t - t0).find((r) => !r.pass && abortDefs.some((d) => d.metric === r.metric && d.exprs.some((x) => x.abortOnFail && x.expr === r.expr)))
        if (failing) {
          abortedAt = ev.t
          abortedBy = `thresholds on metrics '${failing.metric}' were crossed; at least one has abortOnFail enabled, stopping test prematurely`
        }
      }
      if (ev.kind === 'arrival') {
        const sc = ev.sc
        const start = t0 + sc.startTime
        if (abortedAt !== null || ev.t >= endOf(sc)) continue
        const rel = ev.t - start
        const rate = sc.executor === 'constant-arrival-rate' ? sc.rate : stageValue(sc.stages, sc.startRate, rel)
        let vu = ev.pool.find((v) => !v.busy)
        if (!vu && ev.pool.length < sc.maxVUs) {
          vu = { id: ++vuSeq, sc, iter: 0, busy: false, replay: [], iterStart: 0, pending: null }
          ev.pool.push(vu)
        }
        if (vu) startIteration(vu, ev.t)
        else {
          dropped++
          metric('dropped_iterations', 'counter').samples.push({ t: ev.t, v: 1, tags: { scenario: sc.name, group: '' } })
        }
        const gap = rate > 0 ? sc.timeUnit / rate : 1000
        push({ t: ev.t + gap, kind: 'arrival', sc, pool: ev.pool })
        continue
      }
      const vu = ev.vu
      if (ev.kind === 'free') {
        vu.busy = false
        continue
      }
      if (ev.kind === 'start') {
        const a = allowed(vu, ev.t)
        if (a === 'go') startIteration(vu, ev.t)
        else if (a === 'wait') push({ t: Math.max(ev.t + 1000, t0 + vu.sc.startTime), vu, kind: 'start' })
        continue
      }
      // a request reaches the server
      const p = vu.pending!
      const hardStop = (abortedAt ?? endOf(vu.sc) + vu.sc.gracefulStop)
      if (ev.t > hardStop || abortedAt !== null) {
        interrupted++
        vu.busy = false
        continue
      }
      for (const req of p.req) {
        const r = server.handle(req, p.t)
        const timedOut = r.duration > p.timeout
        const res = timedOut ? new ResponseObj(req, 0, '', p.timeout, p.timeout, 'request timeout', 1050) : new ResponseObj(req, r.status, r.body, r.duration, r.waiting)
        vu.replay.push({ res, end: p.t + res.timings.duration })
      }
      runAttempt(vu, ev.t)
    }
  } catch (e) {
    return empty({ error: `The test crashed: ${(e as Error).message}`, options })
  }

  // ----- teardown -----
  const endT = abortedAt ?? Math.max(testEnd, ...intervals.map((i) => i[1]))
  try {
    if (typeof exp.teardown === 'function') runOnce(() => (exp.teardown as (d: unknown) => unknown)(data), 'teardown', endT)
  } catch (e) {
    logs.push(`teardown() failed: ${(e as Error).message}`)
  }
  for (const [msg, n] of errorCounts) logs.push(`ERRO ${msg}${n > 1 ? `  (×${n} iterations)` : ''}`)

  // ----- VUs over time (from the iteration intervals) -----
  const total = Math.max(1, endT - t0)
  const bucket = Math.max(1000, Math.ceil(total / 120 / 1000) * 1000)
  const nb = Math.max(1, Math.ceil(total / bucket))
  const vusS = new Array(nb).fill(0)
  for (const [a, b] of intervals) {
    for (let i = Math.max(0, Math.floor((a - t0) / bucket)); i <= Math.min(nb - 1, Math.floor((b - t0 - 1) / bucket)); i++) {
      const lo = t0 + i * bucket
      const hi = lo + bucket
      vusS[i] += (Math.min(b, hi) - Math.max(a, lo)) / bucket
    }
  }
  for (const v of vusS) maxVUs = Math.max(maxVUs, Math.round(v))
  const peakDeclared = Math.max(...scenarios.map((sc) => (sc.executor === 'ramping-vus' ? Math.max(sc.startVUs, ...sc.stages.map((s) => s.target)) : sc.executor.includes('arrival') ? sc.maxVUs : sc.vus)))
  maxVUs = Math.min(Math.max(maxVUs, 1), peakDeclared)
  const reqs = metrics.get('http_req_duration')!.samples
  const failed = metrics.get('http_req_failed')!.samples
  const rpsS = new Array(nb).fill(0)
  const errS = new Array(nb).fill(0)
  const durB: number[][] = Array.from({ length: nb }, () => [])
  reqs.forEach((s, i) => {
    const b = Math.min(nb - 1, Math.max(0, Math.floor((s.t - t0) / bucket)))
    rpsS[b]++
    durB[b].push(s.v)
    errS[b] += failed[i]?.v ?? 0
  })
  const series = {
    t: Array.from({ length: nb }, (_, i) => ((i + 1) * bucket) / 1000),
    vus: vusS.map((v) => Math.round(v * 10) / 10),
    rps: rpsS.map((n) => n / (bucket / 1000)),
    p95: durB.map((d) => (d.length ? quantile([...d].sort((a, b) => a - b), 0.95) : 0)),
    errors: errS.map((e, i) => (rpsS[i] ? e / rpsS[i] : 0)),
  }

  // ----- results -----
  const thresholds = evaluate(thresholdDefs, metrics, total)
  const thresholdsPassed = thresholds.every((t) => t.pass)
  const byName: PerfResult['byName'] = {}
  const groupsByName = new Map<string, number[]>()
  const failsByName = new Map<string, number>()
  reqs.forEach((s, i) => {
    const n = s.tags.name
    if (!groupsByName.has(n)) groupsByName.set(n, [])
    groupsByName.get(n)!.push(s.v)
    failsByName.set(n, (failsByName.get(n) ?? 0) + (failed[i]?.v ?? 0))
  })
  for (const [n, v] of groupsByName) byName[n] = { count: v.length, failed: failsByName.get(n) ?? 0, duration: trend(v)! }
  const checkSamples = metrics.get('checks')!.samples
  const checksRate = checkSamples.length ? checkSamples.reduce((a, s) => a + s.v, 0) / checkSamples.length : null
  const failedRate = failed.length ? failed.reduce((a, s) => a + s.v, 0) / failed.length : 0
  const result: PerfResult = {
    ok: thresholdsPassed && errorCounts.size === 0 && !abortedBy,
    summary: '',
    thresholds,
    thresholdsPassed,
    checks: [...checkStats.values()],
    checksRate,
    http: { count: reqs.length, failedRate, rps: reqs.length / (total / 1000), duration: trend(reqs.map((s) => s.v)) },
    byName,
    iterations,
    dropped,
    interrupted,
    maxVUs,
    durationS: total / 1000,
    series,
    logs,
    output,
    abortedBy,
    options,
    usedSleep,
  }
  result.summary = summaryText(result, metrics, thresholdDefs, vuSeq)
  return result
}

function filterSamples(m: Metric | undefined, filter: Record<string, string>) {
  if (!m) return []
  const keys = Object.keys(filter)
  if (!keys.length) return m.samples
  return m.samples.filter((s) => keys.every((k) => (s.tags[k] ?? '') === filter[k]))
}
function aggregate(m: Metric | undefined, samples: Sample[], agg: string, totalMs: number): number | null {
  if (!m) return null
  const vals = samples.map((s) => s.v)
  if (m.type === 'counter' && !samples.length && (agg === 'count' || agg === 'rate')) return 0
  if (agg === 'count') return m.type === 'counter' ? vals.reduce((a, b) => a + b, 0) : vals.length
  if (agg === 'rate') {
    if (m.type === 'counter') return vals.reduce((a, b) => a + b, 0) / (totalMs / 1000)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }
  if (agg === 'value') return vals.length ? vals[vals.length - 1] : null
  if (!vals.length) return null
  const s = [...vals].sort((a, b) => a - b)
  if (agg === 'avg') return s.reduce((a, b) => a + b, 0) / s.length
  if (agg === 'min') return s[0]
  if (agg === 'max') return s[s.length - 1]
  if (agg === 'med') return quantile(s, 0.5)
  const p = /^p\((\d+(?:\.\d+)?)\)$/.exec(agg)
  if (p) return quantile(s, Number(p[1]) / 100)
  return null
}
function evaluate(defs: { metric: string; base: string; filter: Record<string, string>; exprs: { expr: string }[] }[], metrics: Map<string, Metric>, totalMs: number): ThresholdResult[] {
  const out: ThresholdResult[] = []
  for (const d of defs) {
    const m = metrics.get(d.base)
    const samples = filterSamples(m, d.filter)
    for (const { expr } of d.exprs) {
      const mm = /^\s*(avg|min|max|med|count|rate|value|p\(\d+(?:\.\d+)?\))\s*(<=|>=|===|==|!=|<|>)\s*(-?\d+(?:\.\d+)?)\s*$/.exec(expr)!
      const value = aggregate(m, samples, mm[1], totalMs)
      const n = Number(mm[3])
      let pass = true
      if (value === null) pass = !m ? false : true
      else {
        const op = mm[2]
        pass = op === '<' ? value < n : op === '<=' ? value <= n : op === '>' ? value > n : op === '>=' ? value >= n : op === '!=' ? value !== n : value === n
      }
      out.push({ metric: d.metric, expr, pass, value })
    }
  }
  return out
}

/** The end-of-test summary, laid out like k6 prints it. */
function summaryText(r: PerfResult, metrics: Map<string, Metric>, defs: { metric: string; base: string; filter: Record<string, string> }[], vusMax: number): string {
  const lines: string[] = []
  const dots = (name: string, width = 32) => (name + ' ').padEnd(width, '.') + ':'
  const totalMs = r.durationS * 1000
  const mark = (metricKey: string) => {
    const ts = r.thresholds.filter((t) => t.metric === metricKey)
    if (!ts.length) return '  '
    return ts.every((t) => t.pass) ? '✓ ' : '✗ '
  }
  // checks, grouped
  const byGroup = new Map<string, typeof r.checks>()
  for (const c of r.checks) {
    if (!byGroup.has(c.group)) byGroup.set(c.group, [])
    byGroup.get(c.group)!.push(c)
  }
  for (const [g, cs] of byGroup) {
    const depth = g ? g.split('::').filter(Boolean).length : 0
    if (g) lines.push('', `     ${'  '.repeat(depth - 1)}█ ${g.split('::').filter(Boolean).pop()}`, '')
    for (const c of cs) {
      const pad = '     ' + '  '.repeat(depth)
      if (c.fails === 0) lines.push(`${pad}✓ ${c.name}`)
      else {
        lines.push(`${pad}✗ ${c.name}`)
        lines.push(`${pad} ↳  ${Math.floor((c.passes / (c.passes + c.fails)) * 100)}% — ✓ ${c.passes} / ✗ ${c.fails}`)
      }
    }
  }
  if (r.checks.length) lines.push('')
  const fmtTrend = (vals: number[], isTime: boolean) => {
    const t = trend(vals)
    if (!t) return 'avg=0 min=0 med=0 max=0 p(90)=0 p(95)=0'
    const f = (n: number) => (isTime ? fmtMs(n) : Number(n.toFixed(2)).toString())
    return `avg=${f(t.avg)} min=${f(t.min)} med=${f(t.med)} max=${f(t.max)} p(90)=${f(t.p90)} p(95)=${f(t.p95)}`
  }
  const rate = (vals: number[]) => {
    const yes = vals.filter((v) => v).length
    const pct = vals.length ? (yes / vals.length) * 100 : 0
    return `${pct.toFixed(2)}%`.padEnd(7) + ` ✓ ${String(yes).padEnd(8)} ✗ ${vals.length - yes}`
  }
  const names = [...metrics.keys()].filter((n) => metrics.get(n)!.samples.length > 0 || defs.some((d) => d.base === n))
  if (r.dropped && !names.includes('dropped_iterations')) names.push('dropped_iterations')
  names.push('vus', 'vus_max')
  const order = (n: string) => n
  for (const name of names.sort((a, b) => order(a).localeCompare(order(b)))) {
    let value = ''
    if (name === 'vus') value = `${String(Math.round(r.series.vus[r.series.vus.length - 1] ?? 0)).padEnd(6)} min=${String(Math.round(Math.min(...r.series.vus, Infinity) || 0)).padEnd(6)} max=${r.maxVUs}`
    else if (name === 'vus_max') value = `${String(vusMax).padEnd(6)} min=${String(vusMax).padEnd(6)} max=${vusMax}`
    else if (name === 'dropped_iterations' && !metrics.has(name)) value = `${String(r.dropped).padEnd(6)} ${(r.dropped / (totalMs / 1000)).toFixed(2)}/s`
    else {
      const m = metrics.get(name)!
      const vals = m.samples.map((s) => s.v)
      if (m.type === 'trend') value = fmtTrend(vals, Boolean(m.isTime))
      else if (m.type === 'rate') value = rate(vals)
      else if (m.type === 'gauge') value = `${vals[vals.length - 1] ?? 0}`
      else {
        const sum = vals.reduce((a, b) => a + b, 0)
        value = name.startsWith('data_') ? `${(sum / 1000).toFixed(1)} kB`.padEnd(7) + ` ${(sum / 1000 / (totalMs / 1000)).toFixed(1)} kB/s` : `${String(sum).padEnd(6)} ${(sum / (totalMs / 1000)).toFixed(2)}/s`
      }
    }
    lines.push(`   ${mark(name)}${dots(name)} ${value}`)
    for (const d of defs.filter((x) => x.base === name && Object.keys(x.filter).length)) {
      const m = metrics.get(name)!
      const vals = filterSamples(m, d.filter).map((s) => s.v)
      const label = `  { ${Object.entries(d.filter).map(([k, v]) => `${k}:${v}`).join(', ')} }`
      const v = m.type === 'trend' ? fmtTrend(vals, Boolean(m.isTime)) : m.type === 'rate' ? rate(vals) : String(vals.reduce((a, b) => a + b, 0))
      lines.push(`   ${mark(d.metric)}${dots(label)} ${v}`)
    }
  }
  const secs = r.durationS
  const mm = Math.floor(secs / 60)
  const ss = (secs % 60).toFixed(1).padStart(4, '0')
  lines.push('', `running (${mm}m${ss}s), 00/${vusMax} VUs, ${r.iterations} complete and ${r.interrupted} interrupted iterations`)
  if (r.abortedBy) lines.push(`ERRO[${String(Math.round(secs)).padStart(4, '0')}] ${r.abortedBy}`)
  else if (!r.thresholdsPassed) lines.push(`ERRO[${String(Math.round(secs)).padStart(4, '0')}] thresholds on metrics '${[...new Set(r.thresholds.filter((t) => !t.pass).map((t) => t.metric))].join(', ')}' have been crossed`)
  return lines.join('\n')
}
