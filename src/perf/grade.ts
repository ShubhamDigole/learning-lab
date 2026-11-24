// Grades a k6 practice step: the script must run, thresholds must hold on the good build and break on
// the planted performance bugs.
import type { PerfStep, T } from '../content/types.ts'
import { runK6, type PerfResult } from './k6.ts'

export interface PerfCatch {
  label: T
  caught: boolean
}
export interface PerfGrade {
  ok: boolean
  message: T
  catches: PerfCatch[]
}

function stripComments(code: string) {
  return code.replace(/("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (_m: string, str?: string) => str ?? '')
}

export function explainPerf(r: PerfResult): T {
  if (r.compileError) return { en: `Your script does not compile yet (line ${r.compileError.line}): ${r.compileError.message}`, mr: `तुमची script अजून compile होत नाही (ओळ ${r.compileError.line}): ${r.compileError.message}` }
  if (r.error) return { en: r.error, mr: `test चालली नाही: ${r.error}` }
  if (r.abortedBy) return { en: `The test stopped early: ${r.abortedBy}`, mr: `test लवकर थांबली: ${r.abortedBy}` }
  const err = r.logs.find((l) => l.startsWith('ERRO'))
  if (err) return { en: `Some iterations crashed: ${err.replace(/^ERRO /, '')}. Fix the script so every iteration runs to the end.`, mr: `काही iterations मध्येच बंद पडल्या: ${err.replace(/^ERRO /, '')}. प्रत्येक iteration शेवटपर्यंत चालेल अशी script दुरुस्त करा.` }
  const bad = r.thresholds.filter((t) => !t.pass)
  if (bad.length) {
    const list = bad.map((t) => `${t.metric}: ${t.expr} (got ${t.value === null ? 'no data' : t.metric.includes('duration') || /^p\(|avg|med|max|min/.test(t.expr) ? `${t.value.toFixed(0)}ms` : t.value.toFixed(3)})`).join('; ')
    return { en: `Thresholds crossed: ${list}. The server did not meet the goal you set.`, mr: `thresholds ओलांडले: ${list}. तुम्ही ठरवलेलं ध्येय server ने पूर्ण केलं नाही.` }
  }
  return { en: 'The test did not pass.', mr: 'test pass झाली नाही.' }
}

export async function gradePerf(step: PerfStep, code: string, r: PerfResult): Promise<PerfGrade> {
  const no = (message: T): PerfGrade => ({ ok: false, message, catches: [] })
  if (r.compileError || r.error) return no(explainPerf(r))
  if (r.logs.some((l) => l.startsWith('ERRO')) || r.abortedBy) {
    if (!(step.expectFailure && r.abortedBy?.includes('abortOnFail'))) return no(explainPerf(r))
  }
  if (step.requireThresholds && r.thresholds.length === 0) return no({ en: "Add thresholds to options, like thresholds: { http_req_duration: ['p(95)<500'] }. Without them the test cannot pass or fail.", mr: "options मध्ये thresholds जोडा, उदा. thresholds: { http_req_duration: ['p(95)<500'] }. त्यांच्याशिवाय test pass किंवा fail होऊ शकत नाही." })
  if (step.expectFailure) {
    if (r.thresholdsPassed) return no({ en: 'Your thresholds passed, but this build is slow or failing. Set a threshold that this build breaks (look at the summary numbers).', mr: 'तुमचे thresholds pass झाले, पण हा build हळू आहे किंवा errors देतो. हा build मोडेल असा threshold ठेवा (summary मधले आकडे पाहा).' })
    const good = await runK6(code, { bugs: [] })
    if (!good.thresholdsPassed) return no({ en: 'Your thresholds also fail on the healthy server, so they do not prove the bug. Pick a limit the healthy server meets and the buggy one breaks.', mr: 'तुमचे thresholds निरोगी server वरही fail होतात, म्हणजे ते bug सिद्ध करत नाहीत. निरोगी server पूर्ण करेल आणि buggy server मोडेल अशी मर्यादा निवडा.' })
  } else if (!r.thresholdsPassed) return no(explainPerf(r))
  const src = stripComments(code)
  for (const m of step.mustUse ?? []) if (!new RegExp(m.pattern).test(src)) return no(m.message)
  for (const m of step.mustNotUse ?? []) if (new RegExp(m.pattern).test(src)) return no(m.message)
  if (step.output) {
    const got = r.output.map((l) => l.trim())
    const want = step.output.map((l) => l.trim())
    if (got.length !== want.length || got.some((l, i) => l !== want[i])) return no({ en: `The printed output is not right yet. Expected:\n${want.join('\n')}\nYou printed:\n${got.join('\n') || '(nothing)'}`, mr: `print झालेलं output अजून बरोबर नाही. अपेक्षित:\n${want.join('\n')}\nतुम्ही print केलं:\n${got.join('\n') || '(काहीच नाही)'}` })
  }
  for (const v of step.verify ?? []) if (!v.check(r)) return no(v.message)
  const catches: PerfCatch[] = []
  for (const c of step.mustCatch ?? []) {
    const br = await runK6(code, { bugs: [...(step.build ?? []), c.bug] })
    catches.push({ label: c.label, caught: !br.thresholdsPassed || Boolean(br.abortedBy) })
  }
  const missed = catches.filter((c) => !c.caught).length
  if (missed) return { ok: false, catches, message: { en: `Your thresholds pass on the healthy server, but ${missed} planted problem${missed > 1 ? 's' : ''} slipped through. Tighten or add thresholds so ${missed > 1 ? 'they fail' : 'it fails'}.`, mr: `तुमचे thresholds निरोगी server वर pass होतात, पण ${missed} लपवलेल्या समस्या निसटल्या. त्या fail होतील असे thresholds कडक करा किंवा जोडा.` } }
  return { ok: true, catches, message: step.successLine ?? { en: 'Load test accepted.', mr: 'load test स्वीकारली.' } }
}
