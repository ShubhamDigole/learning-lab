// Grades a Selenium practice step. Bilingual feedback; explains Selenium exceptions in plain words.
import type { SeleniumStep, T } from '../content/types.ts'
import { runSelenium, type RunResult } from './runner.ts'

export interface CatchResult {
  label: T
  caught: boolean
}
export interface SeleniumGrade {
  ok: boolean
  message: T
  catches: CatchResult[]
}

const TIPS: Record<string, T> = {
  NoSuchElementException: { en: 'The locator found nothing on the page. Check the spelling of the id, name or class in the page, or wait for the element if it appears later.', mr: 'locator ला page वर काहीच सापडलं नाही. id, name किंवा class चं स्पेलिंग तपासा, किंवा element नंतर येत असेल तर त्याची वाट पाहा.' },
  TimeoutException: { en: 'The wait gave up: the condition never became true in time. Check the locator and the condition.', mr: 'wait थांबला: ठरलेल्या वेळेत condition खरी झाली नाही. locator आणि condition तपासा.' },
  ElementNotInteractableException: { en: 'The element exists but cannot be used (hidden, or not a text box).', mr: 'element आहे पण वापरता येत नाही (लपलेला आहे, किंवा text box नाही).' },
  StaleElementReferenceException: { en: 'The page changed after you found the element. Find it again after the page changes.', mr: 'element शोधल्यानंतर page बदललं. page बदलल्यावर तो पुन्हा शोधा.' },
  InvalidSelectorException: { en: 'The locator itself is written wrongly. Check the CSS or XPath syntax.', mr: 'locator च चुकीचा लिहिला आहे. CSS किंवा XPath ची रचना तपासा.' },
  InvalidArgumentException: { en: 'driver.get() needs a full address starting with https://', mr: 'driver.get() ला https:// ने सुरू होणारा पूर्ण पत्ता लागतो.' },
  UnhandledAlertException: { en: 'An alert popped up and is blocking the page. Switch to it and accept or dismiss it first.', mr: 'एक alert आला आहे आणि page अडवतो आहे. आधी त्यावर switch करून accept किंवा dismiss करा.' },
  NoAlertPresentException: { en: 'There was no alert open at that moment.', mr: 'त्या वेळी कोणताही alert उघडा नव्हता.' },
  NullPointerException: { en: 'A variable is null (empty). Did you create it with new, or assign it before using it?', mr: 'एक variable null (रिकामा) आहे. तो new ने तयार केला का, किंवा वापरण्याआधी value दिली का?' },
  NoSuchSessionException: { en: 'The browser was already closed with driver.quit().', mr: 'browser आधीच driver.quit() ने बंद झाला होता.' },
  AssertionError: { en: 'An assertion failed: the page did not show what your test expected. Read the expected and found values.', mr: 'एक assertion fail झालं: test ला अपेक्षित ते page वर दिसलं नाही. expected आणि found values वाचा.' },
}

/** Removes // and /* *\/ comments but keeps everything inside "strings" (an XPath like "//button" stays). */
function stripComments(code: string) {
  return code.replace(/("(?:[^"\\\n]|\\.)*")|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (_m: string, str?: string) => str ?? '')
}

/** Explain why a run failed, in both languages. */
export function explainFailure(r: RunResult): T {
  if (r.compileError) return { en: `Your code does not compile yet (line ${r.compileError.line}): ${r.compileError.message}`, mr: `तुमचा code अजून compile होत नाही (ओळ ${r.compileError.line}): ${r.compileError.message}` }
  const t = r.tests.find((x) => !x.pass)
  if (!t) return { en: 'The test did not pass.', mr: 'test pass झाली नाही.' }
  const type = (t.error ?? '').split(':')[0].replace('java.lang.', '')
  const tip = TIPS[type] ?? { en: 'Read the red line in the log to see what went wrong.', mr: 'काय चुकलं ते log मधल्या लाल ओळीत वाचा.' }
  const where = t.line ? ` (line ${t.line})` : ''
  return { en: `${t.error}${where}. ${tip.en}`, mr: `${t.error}${where}. ${tip.mr}` }
}

/**
 * Checks the learner's run against the step's rules, then (if needed) re-runs the same code against
 * buggy builds of the app. `makeDoc` gives a fresh document for each hidden run.
 */
export async function gradeSelenium(step: SeleniumStep, code: string, r: RunResult, makeDoc: () => { doc: Document; dispose: () => void }): Promise<SeleniumGrade> {
  const no = (message: T): SeleniumGrade => ({ ok: false, message, catches: [] })
  if (r.compileError) return no(explainFailure(r))
  if (step.expectFailure) {
    const t = r.tests.find((x) => !x.pass)
    if (!t) return no({ en: 'Your test passed, but this build has a bug. Add an assertion that checks the thing that is broken.', mr: 'तुमची test pass झाली, पण या build मध्ये bug आहे. जे बिघडलं आहे ते तपासणारं assertion जोडा.' })
    // Proof that the failure comes from the bug: the same test must pass on the good build.
    const { doc, dispose } = makeDoc()
    try {
      const good = await runSelenium(code, { doc, bugs: [], timeScale: 0.15, loggedIn: step.loggedIn, startUrl: step.startUrl })
      if (!good.ok) {
        const e = good.tests.find((x) => !x.pass)?.error ?? good.compileError?.message ?? ''
        return no({ en: `Your test also fails on the good build (${e}), so it is not failing because of the bug. Fix the test so it passes when the app works and fails only when the bug is there.`, mr: `तुमची test चांगल्या build वरही fail होते (${e}), म्हणजे ती bug मुळे fail होत नाही. app बरोबर असताना pass आणि bug असतानाच fail होईल अशी test करा.` })
      }
    } finally {
      dispose()
    }
  } else if (!r.ok) return no(explainFailure(r))
  const src = stripComments(code)
  for (const m of step.mustUse ?? []) if (!new RegExp(m.pattern).test(src)) return no(m.message)
  for (const m of step.mustNotUse ?? []) if (new RegExp(m.pattern).test(src)) return no(m.message)
  if (step.noSleep && r.usedSleep) return no({ en: 'It passed, but it uses Thread.sleep. Use an explicit wait (WebDriverWait) so the test waits only as long as needed.', mr: 'pass झालं, पण Thread.sleep वापरलं आहे. explicit wait (WebDriverWait) वापरा, म्हणजे test लागेल तितकीच वाट पाहील.' })
  if ((step.minAssertions ?? 0) > r.assertions.passed) {
    const n = step.minAssertions!
    return no({ en: `Add ${n === 1 ? 'an assertion' : `at least ${n} assertions`} (Assert.assertEquals / assertTrue). Without a check, a test only proves that nothing crashed.`, mr: `${n === 1 ? 'एक assertion' : `किमान ${n} assertions`} जोडा (Assert.assertEquals / assertTrue). check शिवाय test फक्त एवढंच सिद्ध करते की काही crash झालं नाही.` })
  }
  if (step.output) {
    const got = r.output.map((l) => l.trim())
    const want = step.output.map((l) => l.trim())
    if (got.length !== want.length || got.some((l, i) => l !== want[i])) {
      return no({ en: `The printed output is not right yet. Expected:\n${want.join('\n')}\nYou printed:\n${got.join('\n') || '(nothing)'}`, mr: `print झालेलं output अजून बरोबर नाही. अपेक्षित:\n${want.join('\n')}\nतुम्ही print केलं:\n${got.join('\n') || '(काहीच नाही)'}` })
    }
  }
  for (const v of step.verify ?? []) if (!v.check(r.app.state)) return no(v.message)
  const catches: CatchResult[] = []
  for (const c of step.mustCatch ?? []) {
    const { doc, dispose } = makeDoc()
    try {
      const br = await runSelenium(code, { doc, bugs: [...(step.build ?? []), c.bug], timeScale: 0.15, loggedIn: step.loggedIn, startUrl: step.startUrl })
      catches.push({ label: c.label, caught: !br.ok })
    } finally {
      dispose()
    }
  }
  const missed = catches.filter((c) => !c.caught).length
  if (missed) return { ok: false, catches, message: { en: `Your test passes on the good build, but ${missed} planted bug${missed > 1 ? 's' : ''} slipped through. Add assertions that would notice ${missed > 1 ? 'them' : 'it'}.`, mr: `तुमची test चांगल्या build वर pass होते, पण ${missed} लपवलेले bug निसटले. ते लक्षात येतील असे assertions जोडा.` } }
  return { ok: true, catches, message: step.successLine ?? { en: 'Test passed. Evidence accepted.', mr: 'test pass झाली. पुरावा स्वीकारला.' } }
}
