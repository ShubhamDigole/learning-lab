// "Planted bugs" for test-writing tasks: each one changes a correct response the way a real bug would.
// A learner's tests pass the task only when they pass on the real response and fail on every mutant.
import type { ApiResponse } from './http.ts'
import { STATUS_TEXT } from './http.ts'

export type Mutant = (r: ApiResponse) => ApiResponse

const copy = (r: ApiResponse): ApiResponse => ({ ...r, headers: { ...r.headers }, body: r.body === null ? null : JSON.parse(JSON.stringify(r.body)) })

function walk(body: unknown, path: string, fn: (parent: Record<string, unknown> | unknown[], key: string) => void) {
  const keys = path.split('.')
  let cur = body as Record<string, unknown>
  for (const k of keys.slice(0, -1)) {
    if (cur === null || typeof cur !== 'object') return
    cur = cur[k] as Record<string, unknown>
  }
  if (cur !== null && typeof cur === 'object') fn(cur, keys[keys.length - 1])
}

/** The server answers with a different status code. */
export const withStatus = (status: number): Mutant => (r) => ({ ...copy(r), status, statusText: STATUS_TEXT[status] ?? '' })

/** One field gets a wrong value. Paths use dots: "items.0.qty". */
export const setField = (path: string, value: unknown): Mutant => (r) => {
  const c = copy(r)
  walk(c.body, path, (p, k) => ((p as Record<string, unknown>)[k] = value))
  return c
}

/** One field disappears from the body. */
export const dropField = (path: string): Mutant => (r) => {
  const c = copy(r)
  walk(c.body, path, (p, k) => {
    if (Array.isArray(p)) p.splice(Number(k), 1)
    else delete p[k]
  })
  return c
}

/** The response becomes slow. */
export const slow = (ms: number): Mutant => (r) => ({ ...copy(r), timeMs: ms })

/** A response header disappears. */
export const dropHeader = (name: string): Mutant => (r) => {
  const c = copy(r)
  for (const k of Object.keys(c.headers)) if (k.toLowerCase() === name.toLowerCase()) delete c.headers[k]
  return c
}

/** The whole body is replaced. */
export const withBody = (body: unknown): Mutant => (r) => ({ ...copy(r), body })

/** Several changes at once. */
export const combine = (...ms: Mutant[]): Mutant => (r) => ms.reduce((acc, m) => m(acc), r)
