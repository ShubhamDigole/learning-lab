// Grades one request/response exchange against a task's expectations. Feedback is bilingual.
import type { T } from '../content/types.ts'
import type { ApiDraft, ApiResponse, HttpMethod } from './http.ts'
import { header, parsePath } from './http.ts'

export interface ApiExpect {
  method?: HttpMethod
  /** exact path without the query string, e.g. "/restaurants/3" */
  path?: string
  /** regular expression for the path, e.g. "^/orders/\\d+$" */
  pathPattern?: string
  /** query parameters that must be present (values compared case-insensitively) */
  query?: Record<string, string>
  /** headers that must be present; value "*" means any value */
  headers?: Record<string, string>
  /** the JSON body must contain at least these fields and values */
  body?: unknown
  /** headers that must NOT be sent, e.g. ["Authorization"] */
  noHeaders?: string[]
  /** top-level body fields that must NOT be sent, e.g. ["comment"] */
  bodyAbsent?: string[]
  /** the status the server must answer with */
  status?: number
}

const norm = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase().replace(/\s+/g, ' ') : v)

/** Does `actual` contain everything in `expected`? Arrays match in any order. */
export function subset(expected: unknown, actual: unknown): boolean {
  if (expected === null || typeof expected !== 'object') return norm(expected) === norm(actual)
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false
    return expected.every((e) => actual.some((a) => subset(e, a)))
  }
  if (!actual || typeof actual !== 'object' || Array.isArray(actual)) return false
  return Object.entries(expected as Record<string, unknown>).every(([k, v]) => subset(v, (actual as Record<string, unknown>)[k]))
}

export function gradeExchange(draft: ApiDraft, res: ApiResponse, expect: ApiExpect): { ok: boolean; message: T } {
  const ok = { ok: true, message: { en: 'Correct request.', mr: 'योग्य request.' } }
  const no = (en: string, mr: string) => ({ ok: false, message: { en, mr } })
  const { pathname, query } = parsePath(draft.path)

  if (expect.method && draft.method !== expect.method) return no(`You sent ${draft.method}. This task needs a different method.`, `तुम्ही ${draft.method} पाठवलं. या कामासाठी वेगळी method हवी.`)
  if (expect.path && pathname !== parsePath(expect.path).pathname) return no(`The path is not right yet. You sent ${pathname}.`, `path अजून बरोबर नाही. तुम्ही ${pathname} पाठवलं.`)
  if (expect.pathPattern && !new RegExp(expect.pathPattern).test(pathname)) return no(`The path is not right yet. You sent ${pathname}.`, `path अजून बरोबर नाही. तुम्ही ${pathname} पाठवलं.`)
  for (const [k, v] of Object.entries(expect.query ?? {})) {
    const key = Object.keys(query).find((q) => q.toLowerCase() === k.toLowerCase())
    if (key === undefined || norm(query[key]) !== norm(v)) return no(`Query parameter "${k}" is missing or has the wrong value.`, `Query parameter "${k}" नाही किंवा त्याची value चुकीची आहे.`)
  }
  for (const [k, v] of Object.entries(expect.headers ?? {})) {
    const got = header(draft.headers, k)
    if (got === undefined || !got.trim() || (v !== '*' && norm(got) !== norm(v))) return no(`Header "${k}" is missing or has the wrong value.`, `Header "${k}" नाही किंवा त्याची value चुकीची आहे.`)
  }
  for (const k of expect.noHeaders ?? []) {
    const got = header(draft.headers, k)
    if (got !== undefined && got.trim()) return no(`This task must be sent without the "${k}" header. Remove it.`, `ही request "${k}" header शिवाय पाठवायची आहे. तो काढा.`)
  }
  if (expect.bodyAbsent?.length) {
    let parsed: unknown
    try {
      parsed = JSON.parse(draft.body ?? '')
    } catch {
      return no('The body is not valid JSON yet. Check the quotes, commas and brackets.', 'body अजून योग्य JSON नाही. quotes, commas आणि brackets तपासा.')
    }
    for (const k of expect.bodyAbsent) {
      if (parsed && typeof parsed === 'object' && k in (parsed as object)) return no(`Leave the "${k}" field out of the body completely.`, `body मधून "${k}" field पूर्णपणे काढा.`)
    }
  }
  if (expect.body !== undefined) {
    let parsed: unknown
    try {
      parsed = JSON.parse(draft.body ?? '')
    } catch {
      return no('The body is not valid JSON yet. Check the quotes, commas and brackets.', 'body अजून योग्य JSON नाही. quotes, commas आणि brackets तपासा.')
    }
    if (!subset(expect.body, parsed)) return no('The body is not right yet. Check the field names and values.', 'body अजून बरोबर नाही. field ची नावं आणि values तपासा.')
  }
  if (expect.status !== undefined && res.status !== expect.status) return no(`The server answered ${res.status}. This task expects ${expect.status}. Read the response body: it says what went wrong.`, `सर्व्हरने ${res.status} उत्तर दिलं. या कामात ${expect.status} अपेक्षित आहे. response body वाचा: काय चुकलं ते तिथे लिहिलं आहे.`)
  return ok
}
