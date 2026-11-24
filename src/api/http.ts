// Shared HTTP types for the practice API. No network is ever used: requests go to an in-browser server.

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export const BASE_URL = 'https://api.tiffingo.test/v1'

/** What the learner builds in the API console. `path` is relative to BASE_URL, e.g. "/restaurants/3?veg=true". */
export interface ApiDraft {
  method: HttpMethod
  path: string
  headers?: Record<string, string>
  body?: string
}

export interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  /** parsed JSON body, or null for 204 */
  body: unknown
  /** simulated server time in milliseconds */
  timeMs: number
}

export const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
}

/** Accepts "/restaurants?x=1", "restaurants", the full URL, or "/v1/restaurants". */
export function parsePath(input: string): { pathname: string; query: Record<string, string> } {
  let p = input.trim()
  p = p.replace(/^https?:\/\/api\.tiffingo\.test/i, '')
  p = p.replace(/^\/?v1(?=\/|$)/i, '')
  if (!p.startsWith('/')) p = '/' + p
  const [rawPath, rawQuery = ''] = p.split('?', 2)
  const pathname = (rawPath.replace(/\/+$/, '') || '/').toLowerCase()
  const query: Record<string, string> = {}
  for (const pair of rawQuery.split('&')) {
    if (!pair) continue
    const [k, v = ''] = pair.split('=', 2)
    try {
      query[decodeURIComponent(k).trim()] = decodeURIComponent(v.replace(/\+/g, ' ')).trim()
    } catch {
      query[k] = v
    }
  }
  return { pathname, query }
}

/** Case-insensitive header lookup. */
export function header(headers: Record<string, string> | undefined, name: string): string | undefined {
  if (!headers) return undefined
  const k = Object.keys(headers).find((h) => h.toLowerCase() === name.toLowerCase())
  return k === undefined ? undefined : headers[k]
}

export function statusClass(status: number): 'ok' | 'client' | 'server' {
  return status < 400 ? 'ok' : status < 500 ? 'client' : 'server'
}
