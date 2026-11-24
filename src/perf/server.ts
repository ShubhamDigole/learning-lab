// StageDoor: a ticketing API, modelled as a real server would behave under load.
// Requests are handled in arrival order by a pool of web workers (FIFO). Checkout also needs a
// connection from a small payment-gateway pool, and holds its web worker while it waits, so a slow
// checkout backs up everything else (the classic flash-sale meltdown).
// Bugs switch on known performance problems for tests to catch.

export type PerfBug =
  | 'no-cache' // GET /events skips its cache: 40ms becomes 220ms of CPU work
  | 'slow-seats' // the seat map runs one query per seat: 120ms becomes 700ms
  | 'small-pool' // the payment gateway pool has 3 connections instead of 12
  | 'memory-leak' // the server slows down the longer it runs (and errors after ~15 minutes)
  | 'slow-login' // password hashing is set far too high: login takes 600ms of CPU
  | 'errors-under-load' // when the payment gateway is saturated, 1 in 4 checkouts fails with 500

export const PERF_BASE = 'https://api.stagedoor.test'
export const WEB_WORKERS = 24
export const GATEWAY_POOL = 12
const SHED_AFTER_MS = 8000

export const EVENTS = [
  { id: 1, name: 'Arijit Live in Pune', venue: 'Pune Arena', date: '2026-12-31', priceFrom: 1499, seats: 12000 },
  { id: 2, name: 'IPL Final Screening', venue: 'Mumbai Dome', date: '2027-05-30', priceFrom: 499, seats: 8000 },
  { id: 3, name: 'Zakir Khan: Stand-up', venue: 'Bengaluru Hall', date: '2027-01-14', priceFrom: 999, seats: 2500 },
  { id: 4, name: 'Sunburn Goa', venue: 'Vagator Grounds', date: '2026-12-28', priceFrom: 3499, seats: 30000 },
  { id: 5, name: 'Natak: Ti Phulrani', venue: 'Bal Gandharva', date: '2027-02-02', priceFrom: 350, seats: 900 },
  { id: 6, name: 'Coldplay Tribute Night', venue: 'Delhi Grounds', date: '2027-03-08', priceFrom: 1999, seats: 15000 },
]

export interface SimRequest {
  method: string
  url: string
  body: string | null
  headers: Record<string, string>
}
export interface SimResponse {
  status: number
  body: string
  /** total time as the client sees it, in ms */
  duration: number
  waiting: number
  /** request never reached the app (dropped by the load balancer) */
  shed?: boolean
}

/** Small seeded random generator so every run of the same script gives the same numbers. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 1_000_000) / 1_000_000
  }
}

/** A min-heap of times (when each worker becomes free). */
class FreeTimes {
  h: number[]
  constructor(n: number) {
    this.h = new Array(n).fill(0)
  }
  min() {
    return this.h[0]
  }
  replaceMin(v: number) {
    const h = this.h
    h[0] = v
    let i = 0
    for (;;) {
      const l = 2 * i + 1
      const r = l + 1
      let m = i
      if (l < h.length && h[l] < h[m]) m = l
      if (r < h.length && h[r] < h[m]) m = r
      if (m === i) break
      ;[h[i], h[m]] = [h[m], h[i]]
      i = m
    }
  }
}

export class StageDoorServer {
  bugs: Set<PerfBug>
  rand: () => number
  web: FreeTimes
  gateway: FreeTimes
  carts = new Map<string, { eventId: number; quantity: number; user: string }>()
  orders = 0
  private nextCart = 1
  requests = 0

  constructor(bugs: PerfBug[] = [], seed = 42) {
    this.bugs = new Set(bugs)
    this.rand = rng(seed)
    this.web = new FreeTimes(WEB_WORKERS)
    this.gateway = new FreeTimes(this.bugs.has('small-pool') ? 3 : GATEWAY_POOL)
  }

  /** Lognormal-ish jitter around a base time, with a rare slow tail. */
  private jitter(ms: number) {
    const u = this.rand()
    const v = this.rand()
    const z = Math.sqrt(-2 * Math.log(u || 1e-9)) * Math.cos(2 * Math.PI * v)
    let f = Math.exp(0.28 * z)
    if (this.rand() < 0.01) f *= 3
    return Math.max(1, ms * f)
  }

  private leak(t: number) {
    return this.bugs.has('memory-leak') ? 1 + t / 240000 : 1
  }


  /** Decide what the app answers (status, body) and how much work it is. */
  private route(req: SimRequest): { status: number; body: unknown; cpu: number; gateway?: number } {
    const u = new URL(req.url)
    const p = u.pathname.replace(/\/+$/, '') || '/'
    const m = req.method.toUpperCase()
    const auth = (Object.entries(req.headers).find(([k]) => k.toLowerCase() === 'authorization')?.[1] ?? '').replace(/^Bearer\s+/i, '')
    const user = /^tok_(fan\d{3})$/.exec(auth)?.[1]
    let body: Record<string, unknown> = {}
    if (req.body) {
      try {
        body = JSON.parse(req.body)
      } catch {
        body = Object.fromEntries(new URLSearchParams(req.body))
      }
    }
    if (u.origin !== PERF_BASE) return { status: 0, body: '', cpu: 0 }
    if (p === '/health') return { status: 200, body: { status: 'ok' }, cpu: 2 }
    if (p === '/' && m === 'GET') return { status: 200, body: '<!doctype html><title>StageDoor</title><h1>StageDoor</h1>', cpu: 25 }
    if (p === '/events' && m === 'GET') return { status: 200, body: EVENTS.map(({ seats: _s, ...e }) => e), cpu: this.bugs.has('no-cache') ? 220 : 35 }
    let mm = /^\/events\/(\d+)$/.exec(p)
    if (mm && m === 'GET') {
      const e = EVENTS.find((x) => x.id === Number(mm![1]))
      return e ? { status: 200, body: e, cpu: 55 } : { status: 404, body: { error: 'Event not found' }, cpu: 10 }
    }
    mm = /^\/events\/(\d+)\/seats$/.exec(p)
    if (mm && m === 'GET') {
      const e = EVENTS.find((x) => x.id === Number(mm![1]))
      if (!e) return { status: 404, body: { error: 'Event not found' }, cpu: 10 }
      return { status: 200, body: { eventId: e.id, available: Math.max(0, e.seats - this.orders * 2), sections: ['Floor', 'Lower', 'Upper'] }, cpu: this.bugs.has('slow-seats') ? 700 : 110 }
    }
    if (p === '/auth/login' && m === 'POST') {
      const un = String(body.username ?? '')
      const ok = /^fan(\d{3})$/.exec(un)
      const cpu = this.bugs.has('slow-login') ? 600 : 85
      if (!ok || body.password !== `pass${ok[1]}`) return { status: 401, body: { error: 'Invalid username or password' }, cpu }
      return { status: 200, body: { token: `tok_${un}`, user: un }, cpu }
    }
    if (p === '/cart' && m === 'POST') {
      if (!user) return { status: 401, body: { error: 'Missing or invalid token' }, cpu: 5 }
      const eventId = Number(body.eventId)
      const quantity = Number(body.quantity ?? 1)
      const e = EVENTS.find((x) => x.id === eventId)
      if (!e) return { status: 404, body: { error: 'Event not found' }, cpu: 15 }
      if (!(quantity >= 1 && quantity <= 6)) return { status: 400, body: { error: 'quantity must be 1 to 6' }, cpu: 10 }
      const cartId = `c${this.nextCart++}`
      this.carts.set(cartId, { eventId, quantity, user })
      return { status: 201, body: { cartId, eventId, quantity, total: e.priceFrom * quantity }, cpu: 75 }
    }
    if (p === '/checkout' && m === 'POST') {
      if (!user) return { status: 401, body: { error: 'Missing or invalid token' }, cpu: 5 }
      const cart = this.carts.get(String(body.cartId ?? ''))
      if (!cart || cart.user !== user) return { status: 404, body: { error: 'Cart not found' }, cpu: 15 }
      this.carts.delete(String(body.cartId))
      this.orders++
      return { status: 200, body: { orderId: `SD-${100000 + this.orders}`, status: 'CONFIRMED' }, cpu: 20, gateway: 260 }
    }
    return { status: 404, body: { error: `No route ${m} ${p}` }, cpu: 5 }
  }

  /** Handle one request arriving at time t (ms). Calls must come in time order. */
  handle(req: SimRequest, t: number): SimResponse {
    this.requests++
    const net = 18 + this.rand() * 6
    const arrive = t + net / 2
    const r = this.route(req)
    if (r.status === 0) return { status: 0, body: '', duration: 30, waiting: 0 }
    const json = typeof r.body === 'string' ? r.body : JSON.stringify(r.body)
    const start = Math.max(arrive, this.web.min())
    const wait = start - arrive
    if (wait > SHED_AFTER_MS) {
      // the load balancer gives up instead of queueing forever
      return { status: 503, body: JSON.stringify({ error: 'Service Unavailable' }), duration: net + 4, waiting: 4, shed: true }
    }
    const k = this.leak(t)
    let end = start + this.jitter(r.cpu * k)
    let status = r.status
    if (r.gateway) {
      const gStart = Math.max(end, this.gateway.min())
      const gEnd = gStart + this.jitter(r.gateway * k)
      this.gateway.replaceMin(gEnd)
      end = gEnd
      // when the gateway gets busy, the buggy build fails some checkouts instead of waiting
      const busy = this.gateway.h.filter((x) => x > gStart).length
      if (this.bugs.has('errors-under-load') && busy >= 8 && this.rand() < 0.25) status = 500
    }
    if (this.bugs.has('memory-leak') && t > 900000 && this.rand() < 0.06) status = 500
    this.web.replaceMin(end)
    const body = status === 500 ? JSON.stringify({ error: 'Internal Server Error' }) : json
    const duration = end - arrive + net / 2
    return { status, body, duration, waiting: duration - net }
  }
}
