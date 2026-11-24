// A small, Postman-compatible test runner: pm.test, pm.expect (chai style) and pm.response.
// Learners write the same test scripts they would write in Postman's "Tests" tab.
import type { ApiResponse } from './http.ts'
import { header } from './http.ts'

export interface TestResult {
  name: string
  pass: boolean
  error?: string
}
export interface TestRun {
  results: TestResult[]
  /** a syntax or runtime error outside any pm.test */
  error?: string
}

class AssertionError extends Error {}

const show = (v: unknown) => {
  let s: string
  try {
    s = typeof v === 'string' ? JSON.stringify(v) : v === undefined ? 'undefined' : JSON.stringify(v)
  } catch {
    s = String(v)
  }
  return s.length > 60 ? s.slice(0, 57) + '...' : s
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a as object)
  const kb = Object.keys(b as object)
  if (ka.length !== kb.length) return false
  return ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

function typeOf(v: unknown) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

/** chai-style assertion chain: pm.expect(x).to.be.above(3), .to.have.property('id'), .to.not.equal(0) ... */
export class Assertion {
  private v: unknown
  private neg = false
  private deepFlag = false
  constructor(v: unknown) {
    this.v = v
  }
  // language chains
  get to() { return this }
  get be() { return this }
  get been() { return this }
  get is() { return this }
  get that() { return this }
  get which() { return this }
  get and() { return this }
  get has() { return this }
  get have() { return this }
  get with() { return this }
  get at() { return this }
  get of() { return this }
  get does() { return this }
  get not() {
    this.neg = !this.neg
    return this
  }
  get deep() {
    this.deepFlag = true
    return this
  }

  private check(cond: boolean, msg: string, negMsg: string) {
    if (this.neg ? cond : !cond) throw new AssertionError(this.neg ? negMsg : msg)
    return this
  }

  equal(x: unknown) {
    const same = this.deepFlag ? deepEqual(this.v, x) : this.v === x
    return this.check(same, `expected ${show(this.v)} to equal ${show(x)}`, `expected ${show(this.v)} to not equal ${show(x)}`)
  }
  equals(x: unknown) { return this.equal(x) }
  eq(x: unknown) { return this.equal(x) }
  eql(x: unknown) {
    return this.check(deepEqual(this.v, x), `expected ${show(this.v)} to deeply equal ${show(x)}`, `expected ${show(this.v)} to not deeply equal ${show(x)}`)
  }
  above(n: number) {
    return this.check(typeof this.v === 'number' && this.v > n, `expected ${show(this.v)} to be above ${n}`, `expected ${show(this.v)} to be at most ${n}`)
  }
  greaterThan(n: number) { return this.above(n) }
  gt(n: number) { return this.above(n) }
  below(n: number) {
    return this.check(typeof this.v === 'number' && this.v < n, `expected ${show(this.v)} to be below ${n}`, `expected ${show(this.v)} to be at least ${n}`)
  }
  lessThan(n: number) { return this.below(n) }
  lt(n: number) { return this.below(n) }
  least(n: number) {
    return this.check(typeof this.v === 'number' && this.v >= n, `expected ${show(this.v)} to be at least ${n}`, `expected ${show(this.v)} to be below ${n}`)
  }
  gte(n: number) { return this.least(n) }
  most(n: number) {
    return this.check(typeof this.v === 'number' && this.v <= n, `expected ${show(this.v)} to be at most ${n}`, `expected ${show(this.v)} to be above ${n}`)
  }
  lte(n: number) { return this.most(n) }
  within(lo: number, hi: number) {
    return this.check(typeof this.v === 'number' && this.v >= lo && this.v <= hi, `expected ${show(this.v)} to be within ${lo}..${hi}`, `expected ${show(this.v)} to not be within ${lo}..${hi}`)
  }
  a(type: string) {
    const t = typeOf(this.v)
    return this.check(t === type.toLowerCase(), `expected ${show(this.v)} to be a ${type}, but it is a ${t}`, `expected ${show(this.v)} not to be a ${type}`)
  }
  an(type: string) { return this.a(type) }
  private includeValue(x: unknown) {
    let has = false
    if (typeof this.v === 'string') has = this.v.includes(String(x))
    else if (Array.isArray(this.v)) has = this.v.some((e) => deepEqual(e, x))
    else if (this.v && typeof this.v === 'object' && x && typeof x === 'object') has = Object.entries(x).every(([k, val]) => deepEqual((this.v as Record<string, unknown>)[k], val))
    return this.check(has, `expected ${show(this.v)} to include ${show(x)}`, `expected ${show(this.v)} to not include ${show(x)}`)
  }
  /** chai: .include(x) checks a value; .include.keys(...) checks a subset of keys */
  get include() {
    const f = ((x: unknown) => this.includeValue(x)) as unknown as ((x: unknown) => Assertion) & { keys: (...ks: (string | string[])[]) => Assertion }
    f.keys = (...ks) => this.keyCheck(ks.flat(), false)
    return f
  }
  get includes() { return this.include }
  get contain() { return this.include }
  get contains() { return this.include }
  oneOf(list: unknown[]) {
    return this.check(list.some((e) => deepEqual(e, this.v)), `expected ${show(this.v)} to be one of ${show(list)}`, `expected ${show(this.v)} to not be one of ${show(list)}`)
  }
  match(re: RegExp) {
    return this.check(typeof this.v === 'string' && re.test(this.v), `expected ${show(this.v)} to match ${re}`, `expected ${show(this.v)} not to match ${re}`)
  }
  lengthOf(n: number) {
    const len = typeof this.v === 'string' || Array.isArray(this.v) ? this.v.length : undefined
    return this.check(len === n, `expected length ${n} but got ${len === undefined ? 'no length' : len}`, `expected length not to be ${n}`)
  }
  property(name: string, ...value: unknown[]) {
    const obj = this.v
    const has = obj !== null && typeof obj === 'object' && name in (obj as object)
    if (value.length === 0) {
      this.check(has, `expected ${show(obj)} to have property "${name}"`, `expected ${show(obj)} to not have property "${name}"`)
    } else {
      const got = has ? (obj as Record<string, unknown>)[name] : undefined
      const same = this.deepFlag ? deepEqual(got, value[0]) : got === value[0]
      this.check(has && same, `expected property "${name}" to be ${show(value[0])}, but got ${show(got)}`, `expected property "${name}" to not be ${show(value[0])}`)
    }
    if (this.neg || !has) return this
    return new Assertion((obj as Record<string, unknown>)[name])
  }
  private keyCheck(list: string[], exact: boolean) {
    const obj = this.v as Record<string, unknown>
    const isObj = obj !== null && typeof obj === 'object'
    const own = isObj ? Object.keys(obj) : []
    const ok = isObj && list.every((k) => k in obj) && (!exact || own.length === list.length)
    const extra = own.filter((k) => !list.includes(k))
    return this.check(ok, exact && extra.length && list.every((k) => k in obj) ? `expected ${show(obj)} to have exactly the keys ${list.join(', ')} (it also has ${extra.join(', ')}; use .include.keys for some of them)` : `expected ${show(obj)} to have keys ${list.join(', ')}`, `expected ${show(obj)} to not have keys ${list.join(', ')}`)
  }
  /** chai: .have.keys(...) means exactly these keys (like Postman) */
  keys(...ks: (string | string[])[]) {
    return this.keyCheck(ks.flat(), true)
  }
  get ok() { return this.check(Boolean(this.v), `expected ${show(this.v)} to be truthy`, `expected ${show(this.v)} to be falsy`) }
  get true() { return this.check(this.v === true, `expected ${show(this.v)} to be true`, `expected ${show(this.v)} to not be true`) }
  get false() { return this.check(this.v === false, `expected ${show(this.v)} to be false`, `expected ${show(this.v)} to not be false`) }
  get null() { return this.check(this.v === null, `expected ${show(this.v)} to be null`, `expected value to not be null`) }
  get undefined() { return this.check(this.v === undefined, `expected ${show(this.v)} to be undefined`, `expected value to not be undefined`) }
  get exist() { return this.check(this.v !== null && this.v !== undefined, `expected value to exist`, `expected ${show(this.v)} to not exist`) }
  get empty() {
    const v = this.v
    const isEmpty = v === '' || (Array.isArray(v) && v.length === 0) || (v !== null && typeof v === 'object' && Object.keys(v).length === 0)
    return this.check(isEmpty, `expected ${show(v)} to be empty`, `expected ${show(v)} to not be empty`)
  }
}

function responseApi(res: ApiResponse) {
  const fail = (msg: string) => {
    throw new AssertionError(msg)
  }
  const be = {
    get ok() { if (res.status < 200 || res.status > 299) fail(`expected a 2xx status but got ${res.status}`); return true },
    get success() { return be.ok },
    get clientError() { if (res.status < 400 || res.status > 499) fail(`expected a 4xx status but got ${res.status}`); return true },
    get serverError() { if (res.status < 500) fail(`expected a 5xx status but got ${res.status}`); return true },
    get notFound() { if (res.status !== 404) fail(`expected 404 but got ${res.status}`); return true },
  }
  return {
    code: res.status,
    status: res.statusText,
    responseTime: res.timeMs,
    json: () => {
      if (res.body === null) throw new Error('The response has no body (status 204), so there is no JSON to read')
      return JSON.parse(JSON.stringify(res.body))
    },
    text: () => (res.body === null ? '' : JSON.stringify(res.body)),
    headers: {
      get: (name: string) => header(res.headers, name),
      has: (name: string) => header(res.headers, name) !== undefined,
    },
    to: {
      have: {
        status: (code: number) => {
          if (res.status !== code) fail(`expected response to have status code ${code} but got ${res.status}`)
        },
        header: (name: string, value?: string) => {
          const got = header(res.headers, name)
          if (got === undefined) fail(`expected response to have header "${name}"`)
          if (value !== undefined && got !== value) fail(`expected header "${name}" to be "${value}" but got "${got}"`)
        },
      },
      be,
    },
  }
}

/** Runs a Postman-style test script against one response. */
export function runTests(code: string, res: ApiResponse): TestRun {
  const results: TestResult[] = []
  const env = new Map<string, unknown>()
  const pm = {
    test: (name: string, fn: () => void) => {
      try {
        fn()
        results.push({ name: String(name), pass: true })
      } catch (e) {
        results.push({ name: String(name), pass: false, error: e instanceof Error ? e.message : String(e) })
      }
    },
    expect: (v: unknown) => new Assertion(v),
    response: responseApi(res),
    environment: { set: (k: string, v: unknown) => env.set(k, v), get: (k: string) => env.get(k) },
  }
  const quiet = { log: () => {}, info: () => {}, warn: () => {}, error: () => {} }
  try {
    new Function('pm', 'console', `"use strict";\n${code}`)(pm, quiet)
    return { results }
  } catch (e) {
    return { results, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) }
  }
}

/** Grades a test-writing task: tests must pass on the real response and fail on every planted bug. */
export function gradeTests(code: string, real: ApiResponse, mutants: ((r: ApiResponse) => ApiResponse)[]) {
  const onReal = runTests(code, real)
  const caught = mutants.map((m) => {
    const run = runTests(code, m(real))
    return Boolean(run.error) || run.results.some((r) => !r.pass)
  })
  const realOk = !onReal.error && onReal.results.length > 0 && onReal.results.every((r) => r.pass)
  return { onReal, caught, ok: realOk && caught.every(Boolean) }
}
