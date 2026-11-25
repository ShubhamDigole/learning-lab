// Grades a Python practice step. Explains Python errors in plain words (bilingual), compares printed
// output, runs hidden checks, then re-runs the same code on hidden data sets ("variants").
import type { PythonStep, T } from '../content/types.ts'
import type { AwsConfig, PyRun } from './harness.ts'

export type PyRunner = (code: string, files: Record<string, string>, checks: string[], aws: AwsConfig | null) => Promise<PyRun>
export interface PyVariantResult {
  label: T
  passed: boolean
}
export interface PyGrade {
  ok: boolean
  message: T
  variants: PyVariantResult[]
}

const TIPS: Record<string, T> = {
  SyntaxError: { en: 'Python could not read this line. Look for a missing bracket, quote, comma or colon (:) at the end of if/for/def lines.', mr: 'Python ला ही ओळ वाचता आली नाही. bracket, quote, comma किंवा if/for/def ओळीच्या शेवटचा colon (:) राहिला का ते पाहा.' },
  IndentationError: { en: 'The spaces at the start of a line are off. Lines inside if, for or def must be indented the same amount (4 spaces).', mr: 'ओळीच्या सुरुवातीच्या spaces चुकल्या आहेत. if, for किंवा def च्या आतल्या ओळी सारख्याच indent हव्यात (4 spaces).' },
  NameError: { en: 'A name is used before it exists, or it is spelled differently (Python cares about capital letters).', mr: 'एखादं नाव अस्तित्वात येण्याआधी वापरलं आहे, किंवा त्याचं स्पेलिंग वेगळं आहे (Python capital अक्षरं वेगळी मानतो).' },
  TypeError: { en: 'Two values of the wrong kind met, like adding text to a number. Convert with int(), float() or str() first.', mr: 'चुकीच्या प्रकारच्या दोन values एकत्र आल्या, उदा. text आणि number ची बेरीज. आधी int(), float() किंवा str() ने रूपांतर करा.' },
  ValueError: { en: 'The value has the right type but cannot be used, like int("12a"). Check the data.', mr: 'value चा प्रकार बरोबर आहे पण ती वापरता येत नाही, उदा. int("12a"). डेटा तपासा.' },
  KeyError: { en: 'That key is not in the dictionary. Check the spelling, or use .get(key) when it may be missing.', mr: 'ती key dictionary मध्ये नाही. स्पेलिंग तपासा, किंवा ती नसू शकते तेव्हा .get(key) वापरा.' },
  IndexError: { en: 'You asked for a position that the list does not have. Lists start at 0 and end at len(list) - 1.', mr: 'list मध्ये नसलेली जागा मागितली. list 0 पासून सुरू होते आणि len(list) - 1 ला संपते.' },
  ZeroDivisionError: { en: 'Something was divided by zero. Check for an empty list or a zero count before dividing.', mr: 'शून्याने भागाकार झाला. भागण्याआधी list रिकामी आहे का किंवा count शून्य आहे का ते तपासा.' },
  AttributeError: { en: 'That value does not have this method or field. Check the spelling and what type the value really is (print(type(x))).', mr: 'त्या value कडे ही method किंवा field नाही. स्पेलिंग आणि value चा खरा प्रकार तपासा (print(type(x))).' },
  FileNotFoundError: { en: 'That file does not exist here. The lab files are listed above the editor; check the path, like data/orders.csv.', mr: 'ती file इथे नाही. lab च्या files editor वर दिसतात; path तपासा, उदा. data/orders.csv.' },
  ModuleNotFoundError: { en: 'That library is not installed in this lab. The standard library works (csv, json, datetime, math, collections, re...).', mr: 'ती library या lab मध्ये install नाही. standard library चालते (csv, json, datetime, math, collections, re...).' },
  TimeoutError: { en: 'The program never finished. A while loop whose condition never becomes False is the usual cause.', mr: 'program संपलाच नाही. ज्याची condition कधीच False होत नाही असा while loop हे नेहमीचं कारण असतं.' },
}

/** Removes # comments but keeps strings (so "#" inside a string stays). */
function stripComments(code: string) {
  return code.replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|#[^\n]*/g, (_m: string, str?: string) => str ?? '')
}
const lines = (s: string) => s.replace(/\s+$/, '').split('\n').map((l) => l.replace(/\s+$/, ''))

export function explainPy(r: PyRun): T {
  const e = r.error!
  const tip = TIPS[e.type] ?? { en: 'Read the last line of the error: it names the problem.', mr: 'error ची शेवटची ओळ वाचा: तीच समस्या सांगते.' }
  const where = e.line ? ` (line ${e.line})` : ''
  return { en: `${e.message}${where}\n${tip.en}`, mr: `${e.message}${where}\n${tip.mr}` }
}

function compareOutput(got: string, want: string[]): T | null {
  const g = lines(got)
  const w = want.map((l) => l.replace(/\s+$/, ''))
  if (g.length === w.length && g.every((l, i) => l === w[i])) return null
  return { en: `The printed output is not right yet. Expected:\n${w.join('\n')}\nYou printed:\n${g.join('\n') || '(nothing)'}`, mr: `print झालेलं output अजून बरोबर नाही. अपेक्षित:\n${w.join('\n')}\nतुम्ही print केलं:\n${g.join('\n') || '(काहीच नाही)'}` }
}

const LAMBDA_TIPS: Record<string, T> = {
  KeyError: { en: 'The event did not have the key your handler asked for. Print the event first and follow its real shape: event["Records"][0]["s3"]["object"]["key"].', mr: 'handler ने मागितलेली key event मध्ये नव्हती. आधी event print करा आणि त्याचा खरा आकार पाळा: event["Records"][0]["s3"]["object"]["key"].' },
  ClientError: { en: 'An AWS call was refused. The error code says why: NoSuchKey (wrong key, often a URL-encoded key that was not decoded), AccessDenied (the role lacks a permission), NoSuchBucket.', mr: 'एक AWS call नाकारला गेला. error code कारण सांगतो: NoSuchKey (चुकीची key, बहुतेक URL-encoded key decode केली नाही), AccessDenied (role ला परवानगी नाही), NoSuchBucket.' },
  'Sandbox.Timedout': { en: 'The function ran longer than its timeout. Do less work per invocation, raise the timeout, or check context.get_remaining_time_in_millis().', mr: 'function त्याच्या timeout पेक्षा जास्त वेळ चाललं. एका invocation मध्ये कमी काम करा, timeout वाढवा, किंवा context.get_remaining_time_in_millis() तपासा.' },
  RecursiveInvocationDetected: { en: 'The function writes into the same place that triggers it, so it keeps calling itself. Write output to a different bucket or prefix, and filter the trigger.', mr: 'function ज्या जागेमुळे सुरू होतं तिथेच लिहितं, म्हणून ते स्वतःलाच परत परत बोलावतं. output दुसऱ्या bucket किंवा prefix मध्ये लिहा, आणि trigger filter करा.' },
}
function explainLambda(inv: NonNullable<PyRun['aws']>['invocations'][number]): T {
  const e = inv.error!
  const tip = LAMBDA_TIPS[e.errorType] ?? TIPS[e.errorType] ?? { en: 'Open the Lambda logs tab: the [ERROR] line and the traceback show where it failed.', mr: 'Lambda logs टॅब उघडा: [ERROR] ओळ आणि traceback कुठे बिघडलं ते दाखवतात.' }
  return { en: `Your Lambda failed (${inv.source} invocation): ${e.errorType}: ${e.errorMessage}
${tip.en}`, mr: `तुमचं Lambda बिघडलं (${inv.source} invocation): ${e.errorType}: ${e.errorMessage}
${tip.mr}` }
}

/** Checks one run against output/includes/checks. Returns a failure message or null. */
function judge(r: PyRun, output: string[] | undefined, includes: string[] | undefined, checks: { expr: string; message: T }[], allowLambdaErrors = false): T | null {
  if (r.error) return explainPy(r)
  const failed = r.aws?.invocations.find((i) => !i.ok)
  if (failed && !allowLambdaErrors) return explainLambda(failed)
  if (output) {
    const m = compareOutput(r.output, output)
    if (m) return m
  }
  for (const inc of includes ?? []) if (!r.output.includes(inc)) return { en: `The output should include "${inc}".`, mr: `output मध्ये "${inc}" असायला हवं.` }
  for (const [i, c] of checks.entries()) {
    const res = r.checks[i]
    if (!res?.ok) return res?.error && /NameError/.test(res.error) ? { en: `${c.message.en} (${res.error})`, mr: `${c.message.mr} (${res.error})` } : c.message
  }
  return null
}

export async function gradePython(step: PythonStep, code: string, r: PyRun, run: PyRunner): Promise<PyGrade> {
  const no = (message: T): PyGrade => ({ ok: false, message, variants: [] })
  const checks = step.checks ?? []
  const bad = judge(r, step.output, step.outputIncludes, checks, step.allowLambdaErrors)
  if (bad) return no(bad)
  const src = stripComments(code)
  for (const m of step.mustUse ?? []) if (!new RegExp(m.pattern).test(src)) return no(m.message)
  for (const m of step.mustNotUse ?? []) if (new RegExp(m.pattern).test(src)) return no(m.message)
  const variants: PyVariantResult[] = []
  let firstFail: T | null = null
  for (const v of step.variants ?? []) {
    const vChecks = v.checks ?? checks
    const vr = await run(code, { ...(step.files ?? {}), ...(v.files ?? {}) }, vChecks.map((c) => c.expr), v.aws ?? step.aws ?? null)
    const fail = judge(vr, v.output, v.outputIncludes, vChecks, step.allowLambdaErrors)
    variants.push({ label: v.label, passed: !fail })
    if (fail && !firstFail) firstFail = fail
  }
  const missed = variants.filter((v) => !v.passed).length
  if (missed) return { ok: false, variants, message: { en: `It works on this data, but ${missed} hidden data set${missed > 1 ? 's' : ''} broke it. ${firstFail?.en ?? ''}`, mr: `या डेटावर चालतं, पण ${missed} लपवलेल्या data sets वर बिघडलं. ${firstFail?.mr ?? ''}` } }
  return { ok: true, variants, message: step.successLine ?? { en: 'Correct. Your code does the job.', mr: 'बरोबर. तुमचा code काम करतो.' } }
}
