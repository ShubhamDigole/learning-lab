// Grades a Playwright practice step. Bilingual feedback that explains Playwright errors in plain words.
import type { PlaywrightStep, T } from '../content/types.ts'
import { runPlaywright, type PwResult } from './runner.ts'

export interface PwCatch {
  label: T
  caught: boolean
}
export interface PwGrade {
  ok: boolean
  message: T
  catches: PwCatch[]
}

const TIPS: { test: RegExp; tip: T }[] = [
  { test: /^Missing await/, tip: { en: 'Every Playwright action and web-first assertion returns a promise. Without await, the test races ahead and checks the page too early.', mr: 'प्रत्येक Playwright action आणि web-first assertion promise देतो. await नसेल तर test पुढे धावते आणि page खूप लवकर तपासते.' } },
  { test: /strict mode violation/, tip: { en: 'Your locator matched more than one element, so Playwright refused to guess. Make it more specific: filter({ hasText: ... }), a name, or first() if you really mean the first one.', mr: 'तुमच्या locator ला एकापेक्षा जास्त elements सापडले, म्हणून Playwright ने अंदाज लावला नाही. तो जास्त नेमका करा: filter({ hasText: ... }), name, किंवा खरंच पहिला हवा असेल तर first().' } },
  { test: /Timeout \d+ms exceeded\.\nCall log:\n {2}- waiting for .*\n?$/, tip: { en: 'Playwright waited 5 seconds and never found that element. Check the role, the name or the label text on the page (the practice browser shows it).', mr: 'Playwright ने 5 सेकंद वाट पाहिली पण तो element सापडला नाही. page वरचा role, name किंवा label चा मजकूर तपासा (practice browser मध्ये दिसतो).' } },
  { test: /element is not enabled/, tip: { en: 'The element is there but disabled, so the click kept waiting. Something has to happen first (pick a seat, fill the form...).', mr: 'element आहे पण disabled आहे, म्हणून click वाट पाहत राहिला. आधी काहीतरी व्हायला हवं (seat निवडा, form भरा...).' } },
  { test: /element is not visible/, tip: { en: 'The element exists but is hidden. Wait for the step that shows it, or check you found the right one.', mr: 'element आहे पण लपलेला आहे. तो दाखवणारी पायरी होऊ द्या, किंवा योग्य element शोधला का ते तपासा.' } },
  { test: /expect\(locator\).*failed[\s\S]*<element\(s\) not found>/, tip: { en: 'The assertion never found the element. Is the locator right, and did the page get there?', mr: 'assertion ला element सापडलाच नाही. locator बरोबर आहे का, आणि page तिथे पोहोचलं का?' } },
  { test: /expect\((locator|page)\).*failed/, tip: { en: 'The assertion waited 5 seconds, but the page never showed what you expected. Compare Expected and Received.', mr: 'assertion ने 5 सेकंद वाट पाहिली, पण page ने अपेक्षित ते दाखवलं नाही. Expected आणि Received यांची तुलना करा.' } },
  { test: /expect\(received\)/, tip: { en: 'A plain value assertion failed. Compare Expected and Received.', mr: 'एक साध्या value चं assertion fail झालं. Expected आणि Received यांची तुलना करा.' } },
  { test: /ERR_NAME_NOT_RESOLVED|invalid URL/, tip: { en: "The practice browser only opens skyhop.test. Use page.goto('/') or a path like '/baggage'.", mr: "practice browser फक्त skyhop.test उघडतो. page.goto('/') किंवा '/baggage' सारखा path वापरा." } },
  { test: /No tests found/, tip: { en: "Put your steps inside test('name', async ({ page }) => { ... }).", mr: "तुमच्या पायऱ्या test('name', async ({ page }) => { ... }) मध्ये लिहा." } },
  { test: /is not a function/, tip: { en: 'Something you called does not exist. Check the spelling (getByRole, toHaveText...) and that the test takes ({ page }) with curly braces.', mr: 'तुम्ही बोलावलेलं काहीतरी अस्तित्वात नाही. स्पेलिंग तपासा (getByRole, toHaveText...) आणि test ({ page }) curly braces सह घेते का ते पाहा.' } },
  { test: /is not defined/, tip: { en: 'A name is used before it exists. Check spelling and capital letters.', mr: 'एखादं नाव अस्तित्वात येण्याआधी वापरलं आहे. स्पेलिंग आणि capital अक्षरं तपासा.' } },
  { test: /Test timeout/, tip: { en: 'The whole test took longer than 30 seconds. Look for a step that waits forever.', mr: 'संपूर्ण test ला 30 सेकंदांपेक्षा जास्त वेळ लागला. कायम वाट पाहणारी पायरी शोधा.' } },
]

/** Removes // and /* *\/ comments but keeps strings (so a URL like 'https://x' stays). */
function stripComments(code: string) {
  return code.replace(/("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (_m: string, str?: string) => str ?? '')
}

export function explainPwFailure(r: PwResult): T {
  if (r.compileError) return { en: `Your code does not compile yet (line ${r.compileError.line}): ${r.compileError.message}`, mr: `तुमचा code अजून compile होत नाही (ओळ ${r.compileError.line}): ${r.compileError.message}` }
  const t = r.tests.find((x) => !x.pass)
  if (!t) return { en: 'The test did not pass.', mr: 'test pass झाली नाही.' }
  const err = t.error ?? ''
  const tip = TIPS.find((x) => x.test.test(err))?.tip ?? { en: 'Read the red lines in the log to see what went wrong.', mr: 'काय चुकलं ते log मधल्या लाल ओळींत वाचा.' }
  const first = err.split('\n').slice(0, 5).join('\n')
  const where = t.line ? ` (line ${t.line})` : ''
  return { en: `${first}${where}\n${tip.en}`, mr: `${first}${where}\n${tip.mr}` }
}

export async function gradePlaywright(step: PlaywrightStep, code: string, r: PwResult, makeDoc: () => { doc: Document; dispose: () => void }): Promise<PwGrade> {
  const no = (message: T): PwGrade => ({ ok: false, message, catches: [] })
  if (r.compileError) return no(explainPwFailure(r))
  if (step.expectFailure) {
    const t = r.tests.find((x) => !x.pass)
    if (!t) return no({ en: 'Your test passed, but this build has a bug. Add an assertion that checks the thing that is broken.', mr: 'तुमची test pass झाली, पण या build मध्ये bug आहे. जे बिघडलं आहे ते तपासणारं assertion जोडा.' })
    if (/^Missing await|is not a function|is not defined/.test(t.error ?? '')) return no(explainPwFailure(r))
    const { doc, dispose } = makeDoc()
    try {
      const good = await runPlaywright(code, { doc, bugs: [], timeScale: 0.15, loggedIn: step.loggedIn })
      if (!good.ok) {
        const e = (good.tests.find((x) => !x.pass)?.error ?? good.compileError?.message ?? '').split('\n')[0]
        return no({ en: `Your test also fails on the good build (${e}), so it is not failing because of the bug. Make it pass when the site works and fail only when the bug is there.`, mr: `तुमची test चांगल्या build वरही fail होते (${e}), म्हणजे ती bug मुळे fail होत नाही. site बरोबर असताना pass आणि bug असतानाच fail होईल अशी test करा.` })
      }
    } finally {
      dispose()
    }
  } else if (!r.ok) return no(explainPwFailure(r))
  const src = stripComments(code)
  for (const m of step.mustUse ?? []) if (!new RegExp(m.pattern).test(src)) return no(m.message)
  for (const m of step.mustNotUse ?? []) if (new RegExp(m.pattern).test(src)) return no(m.message)
  if (step.noWaitForTimeout && r.usedWaitForTimeout) return no({ en: 'It passed, but it uses page.waitForTimeout. Fixed waits make tests slow and flaky. Let an auto-waiting assertion such as expect(...).toBeVisible() do the waiting.', mr: 'pass झालं, पण page.waitForTimeout वापरलं आहे. ठरावीक वेळेच्या waits मुळे tests हळू आणि बेभरवशाच्या होतात. expect(...).toBeVisible() सारख्या आपोआप वाट पाहणाऱ्या assertion ला वाट पाहू द्या.' })
  const ran = r.tests.filter((t) => !t.skipped).length
  if ((step.minTests ?? 0) > ran) return no({ en: `Write at least ${step.minTests} tests (separate test(...) blocks). You have ${ran}.`, mr: `किमान ${step.minTests} tests लिहा (वेगवेगळे test(...) blocks). तुमच्या ${ran} आहेत.` })
  if ((step.minAssertions ?? 0) > r.assertions.passed) {
    const n = step.minAssertions!
    return no({ en: `Add ${n === 1 ? 'an assertion' : `at least ${n} assertions`} with expect(...). Without a check, a test only proves that nothing crashed.`, mr: `expect(...) वापरून ${n === 1 ? 'एक assertion' : `किमान ${n} assertions`} जोडा. check शिवाय test फक्त एवढंच सिद्ध करते की काही crash झालं नाही.` })
  }
  if (step.output) {
    const got = r.output.map((l) => l.trim())
    const want = step.output.map((l) => l.trim())
    if (got.length !== want.length || got.some((l, i) => l !== want[i])) {
      return no({ en: `The printed output is not right yet. Expected:\n${want.join('\n')}\nYou printed:\n${got.join('\n') || '(nothing)'}`, mr: `print झालेलं output अजून बरोबर नाही. अपेक्षित:\n${want.join('\n')}\nतुम्ही print केलं:\n${got.join('\n') || '(काहीच नाही)'}` })
    }
  }
  if (step.verify?.length) {
    if (!r.app) return no(step.verify[0].message)
    for (const v of step.verify) if (!v.check(r.app.state)) return no(v.message)
  }
  const catches: PwCatch[] = []
  for (const c of step.mustCatch ?? []) {
    const { doc, dispose } = makeDoc()
    try {
      const br = await runPlaywright(code, { doc, bugs: [...(step.build ?? []), c.bug], timeScale: 0.15, loggedIn: step.loggedIn })
      catches.push({ label: c.label, caught: !br.ok })
    } finally {
      dispose()
    }
  }
  const missed = catches.filter((c) => !c.caught).length
  if (missed) return { ok: false, catches, message: { en: `Your test passes on the good build, but ${missed} planted bug${missed > 1 ? 's' : ''} slipped through. Add assertions that would notice ${missed > 1 ? 'them' : 'it'}.`, mr: `तुमची test चांगल्या build वर pass होते, पण ${missed} लपवलेले bug निसटले. ते लक्षात येतील असे assertions जोडा.` } }
  return { ok: true, catches, message: step.successLine ?? { en: 'Test passed. Evidence accepted.', mr: 'test pass झाली. पुरावा स्वीकारला.' } }
}
