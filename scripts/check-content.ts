import { PGlite } from '@electric-sql/pglite'
import { buildSeedSql } from '../src/db/seed.ts'
import { compareResults } from '../src/db/compare.ts'
import { allLessons, incidents } from '../src/content/index.ts'
import { resetServer, send } from '../src/api/server.ts'
import { apiSyncSql } from '../src/api/dbsync.ts'
import { gradeExchange } from '../src/api/grade.ts'
import { gradeTests } from '../src/api/pm.ts'
import type { TaskStep } from '../src/content/types.ts'
import { JSDOM } from 'jsdom'
import { runSelenium } from '../src/selenium/runner.ts'
import { gradeSelenium } from '../src/selenium/grade.ts'
import { parseJava } from '../src/selenium/java.ts'
import { runPlaywright, compileSpec } from '../src/playwright/runner.ts'
import { gradePlaywright } from '../src/playwright/grade.ts'
import { runK6, compileK6 } from '../src/perf/k6.ts'
import { gradePerf } from '../src/perf/grade.ts'
import { execPython, type AwsConfig } from '../src/python/harness.ts'
import { gradePython } from '../src/python/grade.ts'

// --only=pw0-1,pf  checks just the lessons whose id starts with one of these (fast, skips the database)
const onlyArg = process.argv.find((a) => a.startsWith('--only='))
const only = onlyArg ? onlyArg.slice(7).split(',').filter(Boolean) : null
const pick = (id: string) => !only || only.some((p) => id.startsWith(p))
const lessons = allLessons.filter((l) => pick(l.id))
const incidentList = incidents.filter((i) => !only || only.some((p) => i.unlockAfter.startsWith(p)))

const needDb = !only
const db = needDb ? new PGlite() : (null as unknown as PGlite)
if (needDb) {
  const { sql, facts } = buildSeedSql()
  await db.exec(sql)
  await db.exec(apiSyncSql())
  console.log('facts', facts)
}

const run = async (q: string) => {
  const r = await db.query(q, [], { rowMode: 'array' })
  return { columns: r.fields.map((f) => f.name), rows: r.rows as unknown[][] }
}
let failures = 0
const steps = [
  ...lessons.flatMap((l) => l.practice.steps.map((s) => ({ where: `${l.code} ${l.title.en}`, s }))),
  ...incidentList.flatMap((i) => i.rewind.steps.map((s) => ({ where: `incident ${i.id}`, s }))),
]
for (const { where, s } of steps) {
  if (!needDb) break
  if (s.kind !== 'sql') continue
  try {
    const r = await run(s.expected)
    const self = compareResults(r, r, s.orderMatters)
    console.log(`OK  ${where.slice(0, 40).padEnd(40)} ${String(r.rows.length).padStart(4)} rows  ${JSON.stringify(r.rows.slice(0, 2))}`)
    if (!self.ok) { failures++; console.log('  self-compare failed') }
  } catch (e) {
    failures++
    console.log(`ERR ${where}: ${(e as Error).message}`)
  }
}
// Story facts
if (needDb) {
const kit = await run(`SELECT COUNT(DISTINCT o.id) FROM orders o JOIN order_items i ON i.order_id=o.id JOIN products p ON p.id=i.product_id LEFT JOIN shipments s ON s.order_id=o.id WHERE s.id IS NULL AND o.status='PAID' AND p.name='Sproutling Plant Kit'`)
console.log('stuck orders containing kit:', kit.rows[0][0], '(expect 38)')
const kitElsewhere = await run(`SELECT COUNT(*) FROM order_items i JOIN orders o ON o.id=i.order_id WHERE i.product_id=7 AND o.status<>'PAID'`)
console.log('kit in non-stuck orders:', kitElsewhere.rows[0][0], '(expect 0)')
// Alternative correct answers should pass
const alt = compareResults(await run(`SELECT city, name FROM customers WHERE city='Pune'`), await run(`SELECT name, city FROM customers WHERE city = 'Pune'`))
console.log('column-order-insensitive:', alt.ok)
const wrong = compareResults(await run(`SELECT o.id FROM orders o LEFT JOIN shipments s ON s.order_id=o.id WHERE s.id IS NULL AND o.status='PAID'`), await run(`SELECT o.id FROM orders o LEFT JOIN shipments s ON s.order_id=o.id WHERE s.id IS NULL`))
console.log('wrong answer feedback:', wrong.message.en, '|', wrong.message.mr)
}
// Every exam answer index must point at a real option, and practice choices too
for (const l of lessons) {
  for (const q of l.exam) if (q.answer < 0 || q.answer >= q.options.length) { failures++; console.log('BAD exam answer', l.code, q.q.en) }
  for (const s of l.practice.steps) if (s.kind === 'choice' && s.correct.some((c) => c >= s.options.length)) { failures++; console.log('BAD choice', l.code) }
  if (l.exam.length < 4) { failures++; console.log('exam too short', l.code) }
}
// API track: run every solution request and test script against the practice server, in lesson order.
const apiRun = async (where: string, steps: TaskStep[]) => {
  resetServer()
  for (const [i, s] of steps.entries()) {
    const tag = `${where.slice(0, 44).padEnd(44)} step ${i + 1}`
    if (s.kind === 'api') {
      const res = send(s.solution)
      const g = gradeExchange(s.solution, res, s.expect)
      if (g.ok) console.log(`OK  ${tag} ${s.solution.method} ${s.solution.path} -> ${res.status}`)
      else { failures++; console.log(`ERR ${tag}: ${g.message.en} (status ${res.status} ${JSON.stringify(res.body).slice(0, 120)})`) }
    } else if (s.kind === 'test') {
      const real = send(s.request)
      const g = gradeTests(s.solution, real, s.mutants.map((m) => m.patch))
      const starter = gradeTests(s.starter, real, s.mutants.map((m) => m.patch))
      if (g.ok && !starter.ok) console.log(`OK  ${tag} tests: ${g.onReal.results.length} pass, caught ${g.caught.filter(Boolean).length}/${g.caught.length}`)
      else {
        failures++
        console.log(`ERR ${tag}: solution ok=${g.ok} ${g.onReal.error ?? ''} ${JSON.stringify(g.onReal.results.filter((r) => !r.pass))} caught=${JSON.stringify(g.caught)} | starter passes=${starter.ok}`)
      }
    } else if (s.kind === 'sql') {
      await db.exec(apiSyncSql())
      try {
        const r = await run(s.expected)
        console.log(`OK  ${tag} SQL (API data) ${r.rows.length} rows ${JSON.stringify(r.rows.slice(0, 3))}`)
      } catch (e) { failures++; console.log(`ERR ${tag}: ${(e as Error).message}`) }
    } else if (s.kind === 'choice' && s.sandbox) {
      await db.exec(apiSyncSql())
    } else if (s.kind === 'choice' && s.apiSandbox) {
      send({ method: 'GET', path: '/health', ...s.apiSandbox })
    }
  }
}
if (needDb) {
for (const l of allLessons) if (l.practice.steps.some((s) => s.kind === 'api' || s.kind === 'test' || (s.kind === 'choice' && s.apiSandbox))) await apiRun(`${l.code} ${l.title.en}`, l.practice.steps)
for (const i of incidents) if (i.rewind.steps.some((s) => s.kind === 'api' || s.kind === 'test')) await apiRun(`incident ${i.id}`, i.rewind.steps)
}

// Selenium track: every solution must pass its own rules (and catch its bugs); starters must not pass.
const makeDoc = () => {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>')
  return { doc: dom.window.document, dispose: () => dom.window.close() }
}
const selRun = async (where: string, steps: TaskStep[]) => {
  for (const [i, s] of steps.entries()) {
    const tag = `${where.slice(0, 44).padEnd(44)} step ${i + 1}`
    if (s.kind === 'choice' && s.seleniumSandbox) {
      try { parseJava(s.seleniumSandbox.code) } catch (e) { failures++; console.log(`ERR ${tag}: sandbox code does not parse: ${(e as Error).message}`) }
      continue
    }
    if (s.kind !== 'selenium') continue
    const opts = { bugs: s.build, timeScale: 0.05, loggedIn: s.loggedIn, startUrl: s.startUrl, noBrowser: s.noBrowser }
    const d1 = makeDoc()
    const r = await runSelenium(s.solution, { doc: d1.doc, ...opts })
    const g = await gradeSelenium(s, s.solution, r, makeDoc)
    d1.dispose()
    const d2 = makeDoc()
    const rs = await runSelenium(s.starter, { doc: d2.doc, ...opts })
    const gs = await gradeSelenium(s, s.starter, rs, makeDoc)
    d2.dispose()
    const starterOk = s.starterPasses ? gs.ok : !gs.ok
    if (g.ok && starterOk) console.log(`OK  ${tag} selenium: ${r.tests.length} test(s), ${r.assertions.passed} asserts, caught ${g.catches.filter((c) => c.caught).length}/${g.catches.length}${r.output.length ? ' out=' + JSON.stringify(r.output).slice(0, 80) : ''}`)
    else {
      failures++
      console.log(`ERR ${tag}: solution ok=${g.ok} (${g.message.en.slice(0, 200)}) | starter ${s.starterPasses ? 'should pass' : 'should not pass'} but ok=${gs.ok} (${gs.message.en.slice(0, 120)})`)
    }
  }
}
for (const l of lessons) if (l.practice.steps.some((s) => s.kind === 'selenium' || (s.kind === 'choice' && s.seleniumSandbox))) await selRun(`${l.code} ${l.title.en}`, l.practice.steps)
for (const i of incidentList) if (i.rewind.steps.some((s) => s.kind === 'selenium')) await selRun(`incident ${i.id}`, i.rewind.steps)

// Playwright track: solutions pass (and catch their bugs); starters do not.
const pwRun = async (where: string, steps: TaskStep[]) => {
  for (const [i, s] of steps.entries()) {
    const tag = `${where.slice(0, 44).padEnd(44)} step ${i + 1}`
    if (s.kind === 'choice' && s.playwrightSandbox) {
      const c = compileSpec(s.playwrightSandbox.code)
      if ('error' in c) { failures++; console.log(`ERR ${tag}: sandbox code does not compile: ${c.error.message} (line ${c.error.line})`) }
      continue
    }
    if (s.kind !== 'playwright') continue
    const opts = { bugs: s.build, timeScale: 0.05, loggedIn: s.loggedIn, noBrowser: s.noBrowser }
    const d1 = makeDoc()
    const r = await runPlaywright(s.solution, { doc: d1.doc, ...opts })
    const g = await gradePlaywright(s, s.solution, r, makeDoc)
    d1.dispose()
    const d2 = makeDoc()
    const rs = await runPlaywright(s.starter, { doc: d2.doc, ...opts })
    const gs = await gradePlaywright(s, s.starter, rs, makeDoc)
    d2.dispose()
    const starterOk = s.starterPasses ? gs.ok : !gs.ok
    if (g.ok && starterOk) console.log(`OK  ${tag} playwright: ${r.tests.length} test(s), ${r.assertions.passed} expects, caught ${g.catches.filter((c) => c.caught).length}/${g.catches.length}${r.output.length ? ' out=' + JSON.stringify(r.output).slice(0, 80) : ''}`)
    else {
      failures++
      console.log(`ERR ${tag}: solution ok=${g.ok} (${g.message.en.slice(0, 300)}) | starter ${s.starterPasses ? 'should pass' : 'should not pass'} but ok=${gs.ok} (${gs.message.en.slice(0, 120)})`)
    }
  }
}
for (const l of lessons) if (l.practice.steps.some((s) => s.kind === 'playwright' || (s.kind === 'choice' && s.playwrightSandbox))) await pwRun(`${l.code} ${l.title.en}`, l.practice.steps)
for (const i of incidentList) if (i.rewind.steps.some((s) => s.kind === 'playwright')) await pwRun(`incident ${i.id}`, i.rewind.steps)

// Performance track: solutions run and pass their thresholds (and catch their bugs); starters do not.
const pfRun = async (where: string, steps: TaskStep[]) => {
  for (const [i, s] of steps.entries()) {
    const tag = `${where.slice(0, 44).padEnd(44)} step ${i + 1}`
    if (s.kind === 'choice' && s.perfSandbox) {
      const c = compileK6(s.perfSandbox.code)
      if ('error' in c) { failures++; console.log(`ERR ${tag}: sandbox script does not compile: ${c.error.message}`); continue }
      const r = await runK6(s.perfSandbox.code, { bugs: s.perfSandbox.build })
      if (r.error) { failures++; console.log(`ERR ${tag}: sandbox script fails: ${r.error}`) }
      else console.log(`OK  ${tag} perf sandbox: ${r.http.count} reqs, p95 ${r.http.duration?.p95.toFixed(0)}ms, failed ${(r.http.failedRate * 100).toFixed(1)}%, thresholds ${r.thresholdsPassed ? 'pass' : 'fail'}`)
      continue
    }
    if (s.kind !== 'perf') continue
    const r = await runK6(s.solution, { bugs: s.build })
    const g = await gradePerf(s, s.solution, r)
    const rs = await runK6(s.starter, { bugs: s.build })
    const gs = await gradePerf(s, s.starter, rs)
    const starterOk = s.starterPasses ? gs.ok : !gs.ok
    if (g.ok && starterOk) console.log(`OK  ${tag} perf: ${r.http.count} reqs, ${r.maxVUs} VUs, p95 ${r.http.duration?.p95.toFixed(0)}ms, caught ${g.catches.filter((c) => c.caught).length}/${g.catches.length}`)
    else {
      failures++
      console.log(`ERR ${tag}: solution ok=${g.ok} (${g.message.en.slice(0, 300)}) | starter ${s.starterPasses ? 'should pass' : 'should not pass'} but ok=${gs.ok} (${gs.message.en.slice(0, 120)})`)
    }
  }
}
for (const l of lessons) if (l.practice.steps.some((s) => s.kind === 'perf' || (s.kind === 'choice' && s.perfSandbox))) await pfRun(`${l.code} ${l.title.en}`, l.practice.steps)
for (const i of incidentList) if (i.rewind.steps.some((s) => s.kind === 'perf' || (s.kind === 'choice' && s.perfSandbox))) await pfRun(`incident ${i.id}`, i.rewind.steps)

// Data World / Python: solutions pass (output, checks, hidden data); starters do not.
const pySources = [...lessons.map((l) => ({ where: l.code + " " + l.title.en, steps: l.practice.steps })), ...incidentList.map((x) => ({ where: "incident " + x.id, steps: x.rewind.steps }))].filter((src) => src.steps.some((s) => s.kind === "python" || (s.kind === "choice" && s.pythonSandbox)))
if (pySources.length) {
  const { loadPyodide } = await import('pyodide')
  const py = await loadPyodide()
  const runner = async (code: string, files: Record<string, string>, checks: string[], aws: AwsConfig | null) => execPython(py as never, code, files, checks, aws)
  for (const l of pySources) {
    for (const [i, s] of l.steps.entries()) {
      const tag = `${l.where.slice(0, 44).padEnd(44)} step ${i + 1}`
      if (s.kind === 'choice' && s.pythonSandbox) {
        const r = execPython(py as never, s.pythonSandbox.code, s.pythonSandbox.files ?? {}, [], s.pythonSandbox.aws ?? null)
        console.log(`OK  ${tag} python sandbox: ${r.error ? 'raises ' + r.error.type : 'prints ' + JSON.stringify(r.output.slice(0, 60))}`)
        continue
      }
      if (s.kind !== 'python') continue
      const checks = (s.checks ?? []).map((c) => c.expr)
      const r = execPython(py as never, s.solution, s.files ?? {}, checks, s.aws ?? null)
      const g = await gradePython(s, s.solution, r, runner)
      const rs = execPython(py as never, s.starter, s.files ?? {}, checks, s.aws ?? null)
      const gs = await gradePython(s, s.starter, rs, runner)
      const starterOk = s.starterPasses ? gs.ok : !gs.ok
      if (g.ok && starterOk) console.log(`OK  ${tag} python: out=${JSON.stringify(r.output.slice(0, 70))} hidden data ${g.variants.filter((v) => v.passed).length}/${g.variants.length}`)
      else {
        failures++
        console.log(`ERR ${tag}: solution ok=${g.ok} (${g.message.en.slice(0, 400)}) | starter ${s.starterPasses ? 'should pass' : 'should not pass'} but ok=${gs.ok} (${gs.message.en.slice(0, 120)})`)
      }
    }
  }
}

// Every bilingual text must have both languages.
const walkT = (v: unknown, where: string) => {
  if (!v || typeof v !== 'object') return
  if (Array.isArray(v)) return v.forEach((x) => walkT(x, where))
  const o = v as Record<string, unknown>
  if (typeof o.en === 'string' && 'mr' in o && Boolean(o.en.trim()) !== Boolean(typeof o.mr === 'string' && o.mr.trim())) { failures++; console.log('MISSING TEXT', where, JSON.stringify(o).slice(0, 80)) }
  for (const x of Object.values(o)) walkT(x, where)
}
for (const l of lessons) walkT(l, l.code)
for (const i of incidentList) walkT(i, `incident ${i.id}`)
const ids = allLessons.map((l) => l.id)
for (const id of ids) if (ids.indexOf(id) !== ids.lastIndexOf(id)) { failures++; console.log('DUPLICATE id', id) }

console.log('lessons:', lessons.length, 'exam questions:', lessons.reduce((n, l) => n + l.exam.length, 0), only ? `(only ${only.join(',')})` : '')
console.log(failures ? `${failures} FAILURES` : 'ALL GOOD')
process.exit(failures ? 1 : 0)
