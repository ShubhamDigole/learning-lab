// SkyHop: a small airline web app that Playwright tests drive. Plain DOM, accessible markup (labels,
// roles, names), so getByRole / getByLabel work the way they do on a well-built real site.
// The page talks to a tiny in-memory backend through `api()`, so tests can watch and mock the network.
// Bugs can be switched on per run to give tests something real to catch.

export type SkyBug =
  | 'title-typo' // home page title says "SkyHop | Fly hapy"
  | 'same-city' // searching Pune to Pune is allowed (no error)
  | 'nonstop-filter' // "Non-stop only" still shows the 1-stop SH 305
  | 'sort-price' // "Lowest price" sort does nothing
  | 'results-slow' // flight results take 7 seconds instead of 0.8
  | 'error-silent' // when the flights API fails, the page shows "0 flights" and no error
  | 'seat-taken' // taken seats can still be picked
  | 'name-optional' // passenger form accepts an empty name
  | 'coupon-twice' // FLY10 can be applied again and the discount doubles
  | 'total-wrong' // the payment total counts insurance twice
  | 'pnr-missing' // the confirmation page shows an empty PNR
  | 'trip-missing' // a new booking does not show in My trips
  | 'cancel-no-dialog' // Cancel trip cancels at once, without asking
  | 'bag-status' // a misrouted bag says "Ready at belt 4"
  | 'login-error-hidden' // a wrong password shows no error

export const SKY_BASE = 'https://skyhop.test'

export const AIRPORTS: Record<string, string> = { PNQ: 'Pune', DEL: 'Delhi', BOM: 'Mumbai', BLR: 'Bengaluru', GOI: 'Goa', CCU: 'Kolkata' }

export interface Flight {
  id: string
  number: string
  departs: string
  arrives: string
  stops: number
  price: number
}
export const FLIGHTS: Flight[] = [
  { id: 'SH201', number: 'SH 201', departs: '06:10', arrives: '08:15', stops: 0, price: 4500 },
  { id: 'SH305', number: 'SH 305', departs: '09:40', arrives: '13:05', stops: 1, price: 3900 },
  { id: 'SH412', number: 'SH 412', departs: '13:20', arrives: '15:25', stops: 0, price: 5200 },
  { id: 'SH518', number: 'SH 518', departs: '18:45', arrives: '20:50', stops: 0, price: 4850 },
  { id: 'SH623', number: 'SH 623', departs: '21:30', arrives: '01:55', stops: 1, price: 3600 },
]
export const SEAT_ROWS = [10, 11, 12, 13, 14, 15]
export const SEAT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
export const BASE_TAKEN = ['10A', '10B', '11C', '12D', '13A', '13F', '14B', '15E']
export const LEGROOM_FEE = 600
export const MEALS: Record<string, { label: string; price: number }> = {
  none: { label: 'No meal', price: 0 },
  veg: { label: 'Veg thali', price: 250 },
  chicken: { label: 'Chicken biryani', price: 300 },
}
export const INSURANCE = 299
export const COUPON = 'FLY10'

export const USERS = [{ email: 'asha@skyhop.test', password: 'fly123', name: 'Asha Patil', token: 'sky_asha_7f3' }]

export interface Passenger {
  name: string
  email: string
  phone: string
}
export interface Booking {
  pnr: string
  flightId: string
  number: string
  from: string
  to: string
  date: string
  departs: string
  pax: number
  seats: string[]
  passenger: Passenger
  meal: string
  insurance: boolean
  coupon: string | null
  total: number
  status: 'Confirmed' | 'Cancelled' | 'Completed'
}
export interface Bag {
  tag: string
  passenger: string
  from: string
  to: string
  flight: string
  scans: { time: string; place: string; event: string }[]
}
export const BAGS: Bag[] = [
  {
    tag: 'SH482913',
    passenger: 'Asha Patil',
    from: 'PNQ',
    to: 'DEL',
    flight: 'SH 201',
    scans: [
      { time: '07:05', place: 'Pune', event: 'Checked in' },
      { time: '07:40', place: 'Pune', event: 'Loaded onto SH 201' },
      { time: '09:10', place: 'Delhi', event: 'Unloaded' },
      { time: '09:25', place: 'Delhi', event: 'On belt 4' },
    ],
  },
  {
    tag: 'SH771205',
    passenger: 'Rohan Desai',
    from: 'PNQ',
    to: 'DEL',
    flight: 'SH 201',
    scans: [
      { time: '07:12', place: 'Pune', event: 'Checked in' },
      { time: '07:58', place: 'Pune', event: 'Loaded onto SH 207' },
      { time: '09:05', place: 'Mumbai', event: 'Unloaded' },
    ],
  },
  {
    tag: 'SH305550',
    passenger: 'Priya Nair',
    from: 'GOI',
    to: 'BLR',
    flight: 'SH 412',
    scans: [{ time: '12:50', place: 'Goa', event: 'Checked in' }],
  },
]

export interface PriceBreakdown {
  fare: number
  seatFee: number
  meal: number
  insurance: number
  discount: number
  total: number
}

/** The one place prices are worked out (the UI and the API both use it). */
export function priceOf(o: { price: number; pax: number; seats: string[]; meal: string; insurance: boolean; couponTimes: number }, bugs: Set<SkyBug>): PriceBreakdown {
  const fare = o.price * o.pax
  const seatFee = o.seats.filter((s) => s.startsWith('10')).length * LEGROOM_FEE
  const meal = (MEALS[o.meal]?.price ?? 0) * o.pax
  const insurance = o.insurance ? INSURANCE * o.pax : 0
  const discount = Math.round(fare * 0.1) * o.couponTimes
  const total = fare + seatFee + meal + insurance - discount + (bugs.has('total-wrong') ? insurance : 0)
  return { fare, seatFee, meal, insurance, discount, total }
}

export const rupees = (n: number) => '₹' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export interface NetRequest {
  method: string
  url: string
  headers: Record<string, string>
  body?: unknown
}
export interface NetResponse {
  status: number
  json?: unknown
  body?: string
  headers?: Record<string, string>
}

/** The SkyHop server. One per test run, shared by the page and the `request` fixture. */
export class SkyBackend {
  bugs: Set<SkyBug>
  scale: number
  bookings: Booking[]
  private seq = parseInt('4Q7', 36)
  private timers: ReturnType<typeof setTimeout>[] = []
  requests: NetRequest[] = []

  constructor(bugs: SkyBug[] = [], scale = 1) {
    this.bugs = new Set(bugs)
    this.scale = scale
    this.bookings = [
      { pnr: 'SKY1A2', flightId: 'SH330', number: 'SH 330', from: 'PNQ', to: 'GOI', date: '2026-12-24', departs: '06:15', pax: 1, seats: ['14C'], passenger: { name: 'Asha Patil', email: 'asha@skyhop.test', phone: '9822012345' }, meal: 'none', insurance: false, coupon: null, total: 3850, status: 'Confirmed' },
      { pnr: 'SKY0Z9', flightId: 'SH118', number: 'SH 118', from: 'BOM', to: 'PNQ', date: '2026-11-02', departs: '19:30', pax: 1, seats: ['8A'], passenger: { name: 'Asha Patil', email: 'asha@skyhop.test', phone: '9822012345' }, meal: 'veg', insurance: false, coupon: null, total: 2990, status: 'Completed' },
    ]
  }
  dispose() {
    this.timers.forEach(clearTimeout)
  }
  delayFor(method: string, path: string) {
    if (path.startsWith('/api/flights')) return this.bugs.has('results-slow') ? 7000 : 800
    if (path.startsWith('/api/bags')) return 600
    if (path.startsWith('/api/login')) return 300
    if (path.startsWith('/api/trips')) return 400
    if (path.startsWith('/api/bookings') && method === 'POST') return 1000
    return 300
  }
  takenSeats(flightId: string, date: string) {
    const booked = this.bookings.filter((b) => b.flightId === flightId && b.date === date && b.status !== 'Cancelled').flatMap((b) => b.seats)
    return [...BASE_TAKEN, ...booked]
  }
  bagStatus(b: Bag) {
    const last = b.scans[b.scans.length - 1]
    const dest = AIRPORTS[b.to]
    const belt = /On belt (\d+)/.exec(last.event)
    if (belt && last.place === dest) return `Ready at belt ${belt[1]}`
    if (last.place !== dest && last.place !== AIRPORTS[b.from]) return this.bugs.has('bag-status') ? 'Ready at belt 4' : `Misrouted to ${last.place}. We will deliver it to you.`
    if (last.place === dest) return 'Arrived. Waiting for the belt'
    return 'On its way'
  }

  /** Answer a request after a realistic delay. */
  handle(req: NetRequest): Promise<NetResponse> {
    this.requests.push(req)
    const u = new URL(req.url)
    const res = this.answer(req.method.toUpperCase(), u)
    return new Promise((r) => this.timers.push(setTimeout(() => r(res(req)), this.delayFor(req.method.toUpperCase(), u.pathname) * this.scale)))
  }

  private userFor(req: NetRequest) {
    const auth = Object.entries(req.headers ?? {}).find(([k]) => k.toLowerCase() === 'authorization')?.[1] ?? ''
    return USERS.find((x) => auth === `Bearer ${x.token}`)
  }

  private answer(method: string, u: URL): (req: NetRequest) => NetResponse {
    const p = u.pathname
    const json = (status: number, body: unknown): NetResponse => ({ status, json: body })
    if (u.origin !== SKY_BASE) return () => json(502, { error: 'This practice browser only reaches skyhop.test' })
    if (p === '/api/flights' && method === 'GET') {
      return () => {
        const from = u.searchParams.get('from')
        const to = u.searchParams.get('to')
        if (!from || !to) return json(400, { error: 'from and to are required' })
        if (!AIRPORTS[from] || !AIRPORTS[to]) return json(400, { error: 'Unknown airport code' })
        return json(200, FLIGHTS.map((f) => ({ ...f, from, to })))
      }
    }
    let m = /^\/api\/bags\/([^/]+)$/.exec(p)
    if (m && method === 'GET') {
      const tag = decodeURIComponent(m[1]).toUpperCase()
      return () => {
        const b = BAGS.find((x) => x.tag === tag)
        if (!b) return json(404, { error: `Bag ${tag} not found` })
        return json(200, { ...b, status: this.bagStatus(b) })
      }
    }
    if (p === '/api/login' && method === 'POST') {
      return (req) => {
        const body = (req.body ?? {}) as { email?: string; password?: string }
        const user = USERS.find((x) => x.email === String(body.email ?? '').trim().toLowerCase() && x.password === body.password)
        return user ? json(200, { token: user.token, name: user.name, email: user.email }) : json(401, { error: 'Invalid email or password' })
      }
    }
    if (p === '/api/trips' && method === 'GET') {
      return (req) => {
        const user = this.userFor(req)
        if (!user) return json(401, { error: 'Log in first' })
        return json(200, this.tripsFor(user.email))
      }
    }
    if (p === '/api/bookings' && method === 'POST') {
      return (req) => this.createBooking((req.body ?? {}) as Record<string, unknown>)
    }
    m = /^\/api\/bookings\/([^/]+)$/.exec(p)
    if (m) {
      const pnr = decodeURIComponent(m[1]).toUpperCase()
      if (method === 'GET') {
        return () => {
          const b = this.bookings.find((x) => x.pnr === pnr)
          return b ? json(200, b) : json(404, { error: `No booking ${pnr}` })
        }
      }
      if (method === 'DELETE') {
        return (req) => {
          const user = this.userFor(req)
          if (!user) return json(401, { error: 'Log in first' })
          const b = this.bookings.find((x) => x.pnr === pnr && x.passenger.email === user.email)
          if (!b) return json(404, { error: `No booking ${pnr}` })
          if (b.status !== 'Confirmed') return json(409, { error: `Booking ${pnr} is ${b.status.toLowerCase()}` })
          b.status = 'Cancelled'
          return json(200, { pnr, status: 'Cancelled', refund: b.total })
        }
      }
    }
    if (p === '/api/health') return () => json(200, { status: 'ok' })
    return () => json(404, { error: `No route ${method} ${p}` })
  }

  tripsFor(email: string) {
    const last = this.bookings[this.bookings.length - 1]
    return this.bookings.filter((b) => b.passenger.email.toLowerCase() === email.toLowerCase() && !(this.bugs.has('trip-missing') && b === last && b.pnr !== 'SKY0Z9' && b.pnr !== 'SKY1A2'))
  }

  createBooking(body: Record<string, unknown>, couponTimes?: number): NetResponse {
    const json = (status: number, b: unknown): NetResponse => ({ status, json: b })
    const f = FLIGHTS.find((x) => x.id === body.flightId)
    if (!f) return json(400, { error: 'Unknown flightId' })
    const from = String(body.from ?? 'PNQ')
    const to = String(body.to ?? 'DEL')
    const date = String(body.date ?? '')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(400, { error: 'date must look like 2026-12-20' })
    const pax = Number(body.pax ?? 1)
    const seats = Array.isArray(body.seats) ? body.seats.map(String) : []
    if (seats.length !== pax) return json(400, { error: `Pick ${pax} seat${pax > 1 ? 's' : ''}` })
    const taken = this.takenSeats(f.id, date)
    const clash = seats.find((s) => taken.includes(s))
    if (clash && !this.bugs.has('seat-taken')) return json(409, { error: `Seat ${clash} is already taken` })
    const ps = (body.passenger ?? {}) as Partial<Passenger>
    const passenger = { name: String(ps.name ?? '').trim(), email: String(ps.email ?? '').trim(), phone: String(ps.phone ?? '').trim() }
    if (!passenger.name && !this.bugs.has('name-optional')) return json(400, { error: 'passenger.name is required' })
    if (!/.+@.+\..+/.test(passenger.email)) return json(400, { error: 'passenger.email is not valid' })
    const meal = String(body.meal ?? 'none')
    const insurance = Boolean(body.insurance)
    const coupon = body.coupon ? String(body.coupon).toUpperCase() : null
    if (coupon && coupon !== COUPON) return json(400, { error: `Coupon ${coupon} is not valid` })
    const price = priceOf({ price: f.price, pax, seats, meal, insurance, couponTimes: couponTimes ?? (coupon ? 1 : 0) }, new Set())
    const b: Booking = { pnr: 'SKY' + (this.seq++).toString(36).toUpperCase(), flightId: f.id, number: f.number, from, to, date, departs: f.departs, pax, seats, passenger, meal, insurance, coupon, total: price.total, status: 'Confirmed' }
    this.bookings.push(b)
    return json(201, { pnr: b.pnr, status: b.status, total: b.total, breakdown: price })
  }
}

interface Draft {
  from: string
  to: string
  date: string
  pax: number
  flight: Flight | null
  seats: string[]
  passenger: Passenger | null
  meal: string
  insurance: boolean
  couponTimes: number
}

export interface SkyState {
  path: string
  loggedIn: boolean
  user: { email: string; name: string; token: string } | null
  draft: Draft
  lastBooking: Booking | null
  backend: SkyBackend
  /** native dialogs the page opened, and what happened to them */
  dialogs: { message: string; accepted: boolean }[]
}

const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export const SKY_CSS = `
*{box-sizing:border-box}body{margin:0;font:15px/1.5 "Segoe UI",system-ui,sans-serif;color:#1b2440;background:#f3f5fb}
header.top{display:flex;align-items:center;gap:6px 16px;padding:8px 14px;background:#1f2a5c;color:#fff;flex-wrap:wrap}
header.top .logo{font-weight:800;font-size:17px;color:#fff;text-decoration:none}header.top nav{display:flex;gap:4px 12px;flex-wrap:wrap;font-size:13px;align-items:center}
header.top nav a{color:#dfe5ff;text-decoration:none;font-weight:600}header.top nav a:hover{text-decoration:underline}.hi{color:#ffcf8a;font-weight:700}
main{padding:16px;max-width:780px;margin:0 auto}h1{font-size:24px;margin:0 0 10px}h2{font-size:19px;margin:0 0 8px}h3{margin:0;font-size:17px}
.card{background:#fff;border:1px solid #d9def0;border-radius:12px;padding:16px;margin-bottom:14px}
label{display:block;font-weight:600;margin:10px 0 4px}input,select{width:100%;padding:8px 10px;border:1px solid #a9b2d0;border-radius:8px;font:inherit;background:#fff;color:inherit}
input[type=checkbox],input[type=radio]{width:auto}.check{display:flex;gap:8px;align-items:center;font-weight:500;margin:6px 0}
fieldset{border:1px solid #d9def0;border-radius:8px;margin:12px 0 0;padding:4px 12px 8px}legend{font-weight:700;padding:0 4px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.btn{display:inline-block;text-decoration:none;border:none;border-radius:8px;padding:9px 16px;font:inherit;font-weight:700;cursor:pointer;background:#e6e9f7;color:#1b2440;margin-top:12px}
.btn-primary{background:#ff6b4a;color:#fff}.btn-danger{background:#c0392b;color:#fff}.btn:disabled{opacity:.45;cursor:not-allowed}.big{font-size:17px;padding:11px 22px}
.error{color:#b42318;font-weight:600}.muted{color:#5d6789}.ok{color:#0f7b4b;font-weight:700}
.toolbar{display:flex;gap:6px 16px;align-items:end;flex-wrap:wrap}.toolbar label{margin:0}.toolbar select{width:auto}
.flights{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.flight-card{display:grid;grid-template-columns:1fr auto;gap:2px 12px;background:#fff;border:1px solid #d9def0;border-radius:12px;padding:12px 14px}
.flight-card p{margin:0}.flight-card .price{font-weight:800;font-size:18px;color:#1f2a5c}.flight-card .select-btn{grid-row:span 2;align-self:center;margin:0}
.seatmap{display:grid;gap:6px;margin:10px 0}.seat-row{display:flex;gap:6px;align-items:center}.row-no{width:24px;color:#5d6789;font-size:13px}.aisle{width:14px}
.seat{width:38px;height:34px;border-radius:8px;border:1.5px solid #1f2a5c;background:#fff;color:#1f2a5c;font-weight:700;font-size:12px;cursor:pointer;padding:0}
.seat.legroom{border-color:#ff6b4a}.seat[aria-pressed=true]{background:#1f2a5c;color:#fff}.seat.taken{background:#e6e9f7;border-color:#c3c9e0;color:#9aa2c0;text-decoration:line-through}
dl.price-table{display:grid;grid-template-columns:1fr auto;gap:4px 12px;margin:0}dl.price-table dd{margin:0;text-align:right;font-variant-numeric:tabular-nums}.total{font-weight:800;font-size:17px;border-top:1px solid #d9def0;padding-top:6px}
.trips{list-style:none;margin:0;padding:0}.badge{display:inline-block;padding:1px 9px;border-radius:99px;background:#e3f6ec;color:#0f7b4b;font-size:13px;font-weight:700}
.badge.cancelled{background:#fdecea;color:#b42318}.badge.completed{background:#e6e9f7;color:#5d6789}
.timeline{margin:6px 0 0;padding-left:18px}.timeline time{font-weight:700;margin-right:6px;font-variant-numeric:tabular-nums}
.bag-status{font-weight:800;font-size:17px}.bag-status.warn{color:#b45309}.boarding-pass{border:2px dashed #1f2a5c}
@media (max-width:520px){.row,.grid2{grid-template-columns:1fr}}
`

export interface SkyOptions {
  bugs?: SkyBug[]
  timeScale?: number
  loggedIn?: boolean
  backend?: SkyBackend
}

/** A tiny router + renderer over a document. One instance per page. */
export class SkyHopApp {
  doc: Document
  bugs: Set<SkyBug>
  scale: number
  state: SkyState
  title = ''
  private timers: ReturnType<typeof setTimeout>[] = []
  private view = 0
  private flights: Flight[] | null = null
  private flightsError = false
  onChange?: () => void
  /** set by the test runner: every page request goes through here (page.route, waitForResponse) */
  net?: (req: NetRequest, send: () => Promise<NetResponse>) => Promise<NetResponse | null>
  /** set by the test runner: answers native confirm() dialogs. Without it, the real browser asks. */
  dialog?: (message: string, type: 'confirm' | 'alert') => Promise<boolean>

  constructor(doc: Document, opts: SkyOptions = {}) {
    this.doc = doc
    this.bugs = new Set(opts.bugs ?? [])
    this.scale = opts.timeScale ?? 1
    const backend = opts.backend ?? new SkyBackend(opts.bugs, this.scale)
    const asha = USERS[0]
    this.state = {
      path: '/',
      loggedIn: Boolean(opts.loggedIn),
      user: opts.loggedIn ? { email: asha.email, name: asha.name, token: asha.token } : null,
      draft: this.emptyDraft(),
      lastBooking: null,
      backend,
      dialogs: [],
    }
    const style = doc.createElement('style')
    style.textContent = SKY_CSS
    doc.head.appendChild(style)
    doc.body.addEventListener('click', (e) => this.onClick(e))
    doc.body.addEventListener('change', (e) => this.onChangeEvent(e))
    doc.body.addEventListener('keydown', (e) => this.onKey(e as KeyboardEvent))
    this.navigate(SKY_BASE + '/')
  }

  private emptyDraft(): Draft {
    return { from: 'PNQ', to: 'DEL', date: '', pax: 1, flight: null, seats: [], passenger: null, meal: 'none', insurance: false, couponTimes: 0 }
  }
  private demoDraft(): Draft {
    return { from: 'PNQ', to: 'DEL', date: '2026-12-20', pax: 1, flight: FLIGHTS[0], seats: ['12C'], passenger: { name: 'Asha Patil', email: 'asha@skyhop.test', phone: '9822012345' }, meal: 'none', insurance: false, couponTimes: 0 }
  }

  dispose() {
    this.timers.forEach(clearTimeout)
    this.view++
  }
  get url() {
    return SKY_BASE + this.state.path
  }
  private $(sel: string) {
    return this.doc.querySelector(sel) as HTMLElement | null
  }
  private val(sel: string) {
    return ((this.$(sel) as HTMLInputElement | null)?.value ?? '').trim()
  }

  /** Every request the page makes goes through the runner's network layer when there is one. */
  private async api(method: string, path: string, body?: unknown): Promise<NetResponse | null> {
    const headers: Record<string, string> = { accept: 'application/json' }
    if (body !== undefined) headers['content-type'] = 'application/json'
    if (this.state.user) headers.authorization = `Bearer ${this.state.user.token}`
    const req: NetRequest = { method, url: SKY_BASE + path, headers, body }
    const send = () => this.state.backend.handle(req)
    try {
      return this.net ? await this.net(req, send) : await send()
    } catch {
      return null
    }
  }

  // ---------- routing ----------
  navigate(url: string) {
    let path = url.trim()
    if (path.startsWith(SKY_BASE)) path = path.slice(SKY_BASE.length)
    else if (/^https?:\/\//.test(path)) path = '/__offline?host=' + encodeURIComponent(path)
    if (!path.startsWith('/')) path = '/' + path
    const [p, qs = ''] = path.split('?')
    const q = new URLSearchParams(qs)
    if (q.get('demo') === '1' && ['/seats', '/passenger', '/payment'].includes(p)) {
      this.state.draft = this.demoDraft()
      if (p === '/seats') this.state.draft.seats = []
    }
    if (p === '/trips' && !this.state.loggedIn) path = '/login?next=/trips'
    const d = this.state.draft
    if (p === '/seats' && !d.flight) path = '/'
    if (p === '/passenger' && d.seats.length !== d.pax) path = d.flight ? '/seats' : '/'
    if (p === '/payment' && !d.passenger) path = d.flight ? '/passenger' : '/'
    this.state.path = path
    this.render()
  }

  private shell(body: string) {
    const nav = `<a href="/">Book</a><a href="/trips">My trips</a><a href="/checkin">Check-in</a><a href="/baggage">Track baggage</a>${
      this.state.loggedIn ? `<span class="hi">Hi, ${esc(this.state.user!.name.split(' ')[0])}</span><a href="/logout">Log out</a>` : `<a href="/login">Log in</a>`
    }`
    return `<header class="top"><a class="logo" href="/">✈ SkyHop</a><nav aria-label="Main">${nav}</nav></header><main>${body}</main>`
  }

  render(): void {
    this.view++
    const [p, qs = ''] = this.state.path.split('?')
    const q = new URLSearchParams(qs)
    const d = this.state.draft
    let title = 'SkyHop'
    let body = ''
    let after: (() => void) | null = null
    const opts = (sel: string) => Object.entries(AIRPORTS).map(([code, city]) => `<option value="${code}"${code === sel ? ' selected' : ''}>${city} (${code})</option>`).join('')
    if (p === '/' || p === '/home') {
      title = this.bugs.has('title-typo') ? 'SkyHop | Fly hapy' : 'SkyHop | Fly happy'
      body = `<h1>Where to next?</h1><form class="card" aria-label="Search flights" onsubmit="return false"><div class="row"><div><label for="from">From</label><select id="from" name="from">${opts(d.from)}</select></div><div><label for="to">To</label><select id="to" name="to">${opts(d.to)}</select></div></div><div class="row"><div><label for="date">Departure date</label><input id="date" name="date" type="date" value="${esc(d.date)}"></div><div><label for="pax">Passengers</label><select id="pax" name="pax">${[1, 2, 3, 4].map((n) => `<option value="${n}"${n === d.pax ? ' selected' : ''}>${n} adult${n > 1 ? 's' : ''}</option>`).join('')}</select></div></div><p id="search-error" class="error" role="alert" hidden></p><button type="button" id="search-btn" class="btn btn-primary">Search flights</button></form><section class="card" aria-label="Offers"><h2>Winter offer</h2><p>Use code <strong>${COUPON}</strong> at payment for 10% off the fare.</p></section>`
    } else if (p === '/flights') {
      const from = q.get('from') ?? d.from
      const to = q.get('to') ?? d.to
      const date = q.get('date') ?? d.date
      const pax = Number(q.get('pax') ?? d.pax) || 1
      Object.assign(d, { from, to, date, pax })
      title = `Flights ${from} to ${to} | SkyHop`
      body = `<h1>${esc(AIRPORTS[from] ?? from)} to ${esc(AIRPORTS[to] ?? to)}</h1><p class="muted" data-testid="trip-summary">${esc(date)} · ${pax} passenger${pax > 1 ? 's' : ''}</p><div class="card toolbar"><label class="check"><input type="checkbox" id="nonstop"> Non-stop only</label><div><label for="sort">Sort by</label><select id="sort"><option value="departure">Departure time</option><option value="price">Lowest price</option></select></div></div><div id="results"><p role="status" class="muted">Searching flights...</p></div>`
      after = () => this.loadFlights(from, to, date)
    } else if (p === '/seats') {
      title = 'Choose your seat | SkyHop'
      const f = d.flight!
      const taken = this.state.backend.takenSeats(f.id, d.date)
      const rows = SEAT_ROWS.map((r) => {
        const seat = (l: string) => {
          const id = `${r}${l}`
          const isTaken = taken.includes(id)
          const legroom = r === 10
          const label = `Seat ${id}${isTaken ? ', taken' : legroom ? ', extra legroom' : ''}`
          const dis = isTaken && !this.bugs.has('seat-taken')
          return `<button type="button" class="seat${isTaken ? ' taken' : ''}${legroom ? ' legroom' : ''}" data-seat="${id}" aria-label="${label}" aria-pressed="${d.seats.includes(id)}"${dis ? ' disabled' : ''}>${id}</button>`
        }
        return `<div class="seat-row"><span class="row-no" aria-hidden="true">${r}</span>${SEAT_LETTERS.slice(0, 3).map(seat).join('')}<span class="aisle"></span>${SEAT_LETTERS.slice(3).map(seat).join('')}</div>`
      }).join('')
      body = `<h1>Choose your seat</h1><p class="muted" data-testid="flight-summary">${f.number} · ${esc(AIRPORTS[d.from])} to ${esc(AIRPORTS[d.to])} · ${esc(d.date)}</p><div class="card"><p>Pick ${d.pax} seat${d.pax > 1 ? 's' : ''}. Row 10 has extra legroom (+${rupees(LEGROOM_FEE)} a seat).</p><div class="seatmap" role="group" aria-label="Seat map">${rows}</div><p data-testid="selected-seats"></p><p data-testid="seat-fee"></p><button type="button" id="seats-continue" class="btn btn-primary">Continue</button></div>`
      after = () => this.updateSeats()
    } else if (p === '/passenger') {
      title = 'Passenger details | SkyHop'
      const ps = d.passenger
      const meal = (k: string) => `<label class="check"><input type="radio" name="meal" value="${k}"${d.meal === k ? ' checked' : ''}> ${MEALS[k].label}${MEALS[k].price ? ` (${rupees(MEALS[k].price)})` : ''}</label>`
      body = `<h1>Who is flying?</h1><form class="card" aria-label="Passenger details" onsubmit="return false"><label for="name">Full name</label><input id="name" name="name" autocomplete="off" value="${esc(ps?.name ?? '')}"><label for="email">Email</label><input id="email" name="email" type="email" value="${esc(ps?.email ?? '')}"><label for="phone">Phone</label><input id="phone" name="phone" type="tel" placeholder="10-digit mobile number" value="${esc(ps?.phone ?? '')}"><fieldset><legend>Meal</legend>${Object.keys(MEALS).map(meal).join('')}</fieldset><label class="check"><input type="checkbox" id="insurance"${d.insurance ? ' checked' : ''}> Add travel insurance (${rupees(INSURANCE)} a passenger)</label><ul id="form-errors" class="error" role="alert" hidden></ul><button type="button" id="to-payment" class="btn btn-primary">Continue to payment</button></form>`
    } else if (p === '/payment') {
      title = 'Payment | SkyHop'
      body = `<h1>Review and pay</h1><div class="grid2"><section class="card" aria-label="Price summary"><h2>Price summary</h2><dl class="price-table" id="price-table"></dl></section><section class="card" aria-label="Coupon"><label for="coupon">Coupon code</label><input id="coupon" name="coupon" autocomplete="off"><button type="button" id="apply-coupon" class="btn">Apply</button><p id="coupon-msg" role="status"></p></section></div><p id="pay-error" class="error" role="alert" hidden></p><button type="button" id="pay-btn" class="btn btn-primary big"></button>`
      after = () => this.updatePrices()
    } else if (p === '/confirmation') {
      title = 'Booking confirmed | SkyHop'
      const b = this.state.lastBooking
      body = b
        ? `<div class="card confirmation"><h1 class="ok">Booking confirmed</h1><p>Your PNR is <strong data-testid="pnr">${this.bugs.has('pnr-missing') ? '' : b.pnr}</strong></p><p data-testid="itinerary">${b.number} · ${esc(AIRPORTS[b.from])} to ${esc(AIRPORTS[b.to])} · ${b.date}</p><p>Seats: <span data-testid="seats">${b.seats.join(', ')}</span></p><p>Passenger: <span data-testid="passenger">${esc(b.passenger.name)}</span></p><p>Total paid: <strong data-testid="paid">${rupees(b.total)}</strong></p><a class="btn" href="/trips">View my trips</a></div>`
        : `<h1>No booking yet</h1><a class="btn" href="/">Search flights</a>`
    } else if (p === '/login') {
      title = 'Log in | SkyHop'
      body = `<h1>Log in</h1><form class="card" aria-label="Log in" onsubmit="return false"><label for="login-email">Email</label><input id="login-email" name="email" type="email" autocomplete="off"><label for="login-password">Password</label><input id="login-password" name="password" type="password"><p id="login-error" class="error" role="alert" hidden></p><button type="button" id="login-btn" class="btn btn-primary">Log in</button></form><p class="muted">Demo account: asha@skyhop.test / fly123</p>`
    } else if (p === '/logout') {
      this.state.loggedIn = false
      this.state.user = null
      this.state.path = '/'
      return this.render()
    } else if (p === '/trips') {
      title = 'My trips | SkyHop'
      body = `<h1>My trips</h1><div id="trips-area"><p role="status" class="muted">Loading your trips...</p></div><p id="trip-msg" role="status"></p>`
      after = () => this.loadTrips()
    } else if (p === '/checkin') {
      title = 'Web check-in | SkyHop'
      body = `<h1>Web check-in</h1><form class="card" aria-label="Check-in" onsubmit="return false"><label for="pnr">Booking reference (PNR)</label><input id="pnr" name="pnr" placeholder="6 characters, like SKY1A2" autocomplete="off"><label for="lastname">Last name</label><input id="lastname" name="lastname" autocomplete="off"><p id="checkin-error" class="error" role="alert" hidden></p><button type="button" id="find-booking" class="btn btn-primary">Find booking</button></form><div id="boarding"></div>`
    } else if (p === '/baggage') {
      title = 'Track baggage | SkyHop'
      body = `<h1>Track your bag</h1><form class="card" aria-label="Track a bag" onsubmit="return false"><label for="bag-tag">Bag tag number</label><input id="bag-tag" name="tag" placeholder="e.g. SH482913" autocomplete="off"><p id="bag-error" class="error" role="alert" hidden></p><button type="button" id="track-btn" class="btn btn-primary">Track bag</button></form><div id="bag-result"></div>`
    } else if (p === '/__offline') {
      title = 'This site can’t be reached'
      body = `<h1>This site can’t be reached</h1><p class="muted">The practice browser only opens ${SKY_BASE}.</p>`
    } else {
      title = 'Page not found | SkyHop'
      body = `<h1>Page not found</h1><p class="muted">No page at ${esc(p)}.</p><a class="btn" href="/">Home</a>`
    }
    this.title = title
    this.doc.title = title
    this.doc.body.innerHTML = this.shell(body)
    after?.()
    this.onChange?.()
  }

  // ---------- flights ----------
  private async loadFlights(from: string, to: string, date: string) {
    const v = this.view
    this.flights = null
    const res = await this.api('GET', `/api/flights?from=${from}&to=${to}&date=${date}`)
    if (v !== this.view) return
    if (!res || res.status >= 400 || !Array.isArray(res.json)) {
      this.flightsError = true
      this.flights = []
    } else {
      this.flightsError = false
      this.flights = res.json as Flight[]
    }
    this.renderFlights()
    this.onChange?.()
  }

  private renderFlights() {
    const area = this.$('#results')
    if (!area || !this.flights) return
    if (this.flightsError && !this.bugs.has('error-silent')) {
      area.innerHTML = `<p class="error" role="alert">We could not load flights. Please try again.</p><button type="button" id="retry" class="btn">Retry</button>`
      return
    }
    const nonstop = (this.$('#nonstop') as HTMLInputElement | null)?.checked
    const sort = (this.$('#sort') as HTMLSelectElement | null)?.value ?? 'departure'
    let list = this.flights.filter((f) => !nonstop || f.stops === 0 || (this.bugs.has('nonstop-filter') && f.id === 'SH305'))
    if (sort === 'price' && !this.bugs.has('sort-price')) list = [...list].sort((a, b) => a.price - b.price)
    else list = [...list].sort((a, b) => a.departs.localeCompare(b.departs))
    const cards = list
      .map((f) => `<li class="flight-card" data-testid="flight-card" data-flight="${esc(f.id)}"><h3>${esc(f.number)}</h3><button type="button" class="btn btn-primary select-btn" data-flight="${esc(f.id)}">Select</button><p class="times"><span class="dep">${esc(f.departs)}</span> → <span class="arr">${esc(f.arrives)}</span> · <span class="stops">${f.stops === 0 ? 'Non-stop' : `${f.stops} stop`}</span></p><p class="price" data-testid="price">${rupees(f.price)}</p></li>`)
      .join('')
    area.innerHTML = `<p data-testid="result-count">${list.length} flight${list.length === 1 ? '' : 's'}</p>${list.length ? `<ul class="flights" aria-label="Flights">${cards}</ul>` : `<p class="muted">No flights found on this date.</p>`}`
  }

  // ---------- seats ----------
  private updateSeats() {
    const d = this.state.draft
    this.doc.querySelectorAll('.seat').forEach((b) => b.setAttribute('aria-pressed', String(d.seats.includes((b as HTMLElement).dataset.seat!))))
    const sel = this.$('[data-testid="selected-seats"]')
    if (sel) sel.textContent = d.seats.length ? `Selected: ${d.seats.join(', ')}` : 'No seat selected'
    const fee = this.$('[data-testid="seat-fee"]')
    if (fee) fee.textContent = `Seat fee: ${rupees(d.seats.filter((s) => s.startsWith('10')).length * LEGROOM_FEE)}`
    const c = this.$('#seats-continue') as HTMLButtonElement | null
    if (c) c.disabled = d.seats.length !== d.pax
  }
  private pickSeat(id: string) {
    const d = this.state.draft
    if (d.seats.includes(id)) d.seats = d.seats.filter((s) => s !== id)
    else {
      d.seats = [...d.seats, id]
      if (d.seats.length > d.pax) d.seats = d.seats.slice(1)
    }
    this.updateSeats()
  }

  // ---------- payment ----------
  private prices() {
    const d = this.state.draft
    return priceOf({ price: d.flight!.price, pax: d.pax, seats: d.seats, meal: d.meal, insurance: d.insurance, couponTimes: d.couponTimes }, this.bugs)
  }
  private updatePrices() {
    const d = this.state.draft
    const pr = this.prices()
    const t = this.$('#price-table')
    if (t) {
      t.innerHTML = `<dt>Fare (${d.pax} × ${rupees(d.flight!.price)})</dt><dd data-testid="fare">${rupees(pr.fare)}</dd><dt>Seat fee</dt><dd data-testid="seat-fee">${rupees(pr.seatFee)}</dd><dt>Meal</dt><dd data-testid="meal">${rupees(pr.meal)}</dd><dt>Insurance</dt><dd data-testid="insurance">${rupees(pr.insurance)}</dd><dt>Discount</dt><dd data-testid="discount">-${rupees(pr.discount)}</dd><dt class="total">Total</dt><dd class="total" data-testid="total">${rupees(pr.total)}</dd>`
    }
    const pay = this.$('#pay-btn')
    if (pay) pay.textContent = `Pay ${rupees(pr.total)}`
  }
  private applyCoupon() {
    const d = this.state.draft
    const code = this.val('#coupon').toUpperCase()
    const msg = this.$('#coupon-msg')!
    if (code !== COUPON) {
      msg.className = 'error'
      msg.textContent = code ? `Coupon ${code} is not valid` : 'Enter a coupon code'
      return
    }
    if (d.couponTimes > 0 && !this.bugs.has('coupon-twice')) {
      msg.className = 'muted'
      msg.textContent = `Coupon ${COUPON} is already applied`
      return
    }
    d.couponTimes++
    const pr = this.prices()
    msg.className = 'ok'
    msg.textContent = `Coupon ${COUPON} applied. You save ${rupees(pr.discount)}`
    this.updatePrices()
  }
  private async pay() {
    const d = this.state.draft
    const btn = this.$('#pay-btn') as HTMLButtonElement
    btn.disabled = true
    btn.textContent = 'Processing payment...'
    const v = this.view
    const res = await this.api('POST', '/api/bookings', { flightId: d.flight!.id, from: d.from, to: d.to, date: d.date, pax: d.pax, seats: d.seats, passenger: d.passenger, meal: d.meal, insurance: d.insurance, coupon: d.couponTimes ? COUPON : null })
    if (v !== this.view) return
    if (!res || res.status !== 201) {
      const err = this.$('#pay-error')!
      err.textContent = 'Payment failed. You have not been charged.'
      err.hidden = false
      btn.disabled = false
      this.updatePrices()
      this.onChange?.()
      return
    }
    const pnr = (res.json as { pnr?: string })?.pnr
    // The confirmation shows the UI's own total (that is where the total-wrong bug lives).
    const saved = this.state.backend.bookings.find((b) => b.pnr === pnr)
    this.state.lastBooking = saved
      ? { ...saved, total: this.prices().total }
      : { pnr: pnr ?? '', flightId: d.flight!.id, number: d.flight!.number, from: d.from, to: d.to, date: d.date, departs: d.flight!.departs, pax: d.pax, seats: d.seats, passenger: d.passenger!, meal: d.meal, insurance: d.insurance, coupon: d.couponTimes ? COUPON : null, total: this.prices().total, status: 'Confirmed' }
    this.state.draft = { ...this.emptyDraft(), from: d.from, to: d.to }
    this.navigate('/confirmation')
  }

  // ---------- trips ----------
  private async loadTrips() {
    const v = this.view
    const res = await this.api('GET', '/api/trips')
    if (v !== this.view) return
    const area = this.$('#trips-area')
    if (!area) return
    if (!res || res.status !== 200 || !Array.isArray(res.json)) {
      area.innerHTML = `<p class="error" role="alert">We could not load your trips.</p>`
      this.onChange?.()
      return
    }
    const trips = res.json as Booking[]
    const card = (b: Booking) =>
      `<li class="card trip" data-testid="trip" data-pnr="${esc(b.pnr)}"><h2>${esc(AIRPORTS[b.from] ?? b.from)} to ${esc(AIRPORTS[b.to] ?? b.to)}</h2><p>PNR <strong class="pnr">${esc(b.pnr)}</strong> · ${esc(b.number)} · ${esc(b.date)}</p><p>Status: <span class="badge ${b.status.toLowerCase()}" data-testid="trip-status">${b.status}</span></p>${b.status === 'Confirmed' ? `<button type="button" class="btn btn-danger cancel-trip" data-pnr="${esc(b.pnr)}">Cancel trip</button>` : ''}</li>`
    area.innerHTML = `<ul class="trips" aria-label="Trips">${trips.map(card).join('')}</ul><p data-testid="trip-count" class="muted">${trips.length} trip${trips.length === 1 ? '' : 's'}</p>`
    this.onChange?.()
  }
  private async cancelTrip(pnr: string) {
    if (!this.bugs.has('cancel-no-dialog')) {
      const message = `Cancel trip ${pnr}? This cannot be undone.`
      const ok = await this.ask(message)
      this.state.dialogs.push({ message, accepted: ok })
      if (!ok) return
    }
    const v = this.view
    const res = await this.api('DELETE', `/api/bookings/${pnr}`)
    if (v !== this.view) return
    if (res?.status === 200) {
      await this.loadTrips()
      const msg = this.$('#trip-msg')
      if (msg) msg.textContent = `Trip ${pnr} cancelled. Your refund has started.`
    }
    this.onChange?.()
  }
  private async ask(message: string): Promise<boolean> {
    if (this.dialog) return this.dialog(message, 'confirm')
    const w = this.doc.defaultView as (Window & typeof globalThis) | null
    try {
      return Boolean(w?.confirm(message))
    } catch {
      return false
    }
  }

  // ---------- login ----------
  private async login() {
    const email = this.val('#login-email')
    const password = (this.$('#login-password') as HTMLInputElement).value
    const err = this.$('#login-error')!
    if (!email || !password) {
      err.textContent = 'Enter your email and password'
      err.hidden = false
      return
    }
    const v = this.view
    const res = await this.api('POST', '/api/login', { email, password })
    if (res?.status === 200) {
      // The session is saved even if the user already clicked away; only the redirect needs this page.
      const j = res.json as { token: string; name: string; email: string }
      this.state.loggedIn = true
      this.state.user = { email: j.email, name: j.name, token: j.token }
      if (v !== this.view) return this.render()
      const next = new URLSearchParams(this.state.path.split('?')[1] ?? '').get('next')
      this.navigate(next && next.startsWith('/') ? next : '/')
      return
    }
    if (v !== this.view) return
    err.textContent = 'Wrong email or password'
    if (!this.bugs.has('login-error-hidden')) err.hidden = false
    this.onChange?.()
  }

  // ---------- check-in ----------
  private async findBooking() {
    const pnr = this.val('#pnr').toUpperCase()
    const last = this.val('#lastname').toLowerCase()
    const err = this.$('#checkin-error')!
    const area = this.$('#boarding')!
    area.innerHTML = ''
    err.hidden = true
    if (!pnr || !last) {
      err.textContent = 'Enter your PNR and last name'
      err.hidden = false
      return
    }
    const v = this.view
    const res = await this.api('GET', `/api/bookings/${encodeURIComponent(pnr)}`)
    if (v !== this.view) return
    const b = res?.status === 200 ? (res.json as Booking) : null
    if (!b || b.passenger.name.toLowerCase().split(' ').pop() !== last) {
      err.textContent = 'We could not find that booking'
      err.hidden = false
    } else if (b.status !== 'Confirmed') {
      err.textContent = `This booking is ${b.status.toLowerCase()}`
      err.hidden = false
    } else {
      const [h, m] = b.departs.split(':').map(Number)
      const t = (h * 60 + m - 30 + 1440) % 1440
      const boarding = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
      area.innerHTML = `<section class="card boarding-pass" aria-label="Boarding pass"><h2>Boarding pass</h2><p>Passenger <strong data-testid="bp-name">${esc(b.passenger.name.toUpperCase())}</strong></p><p>Flight ${esc(b.number)} · Gate <span data-testid="gate">B7</span> · Seat <span data-testid="bp-seat">${esc(b.seats[0])}</span></p><p>Boarding at <span data-testid="boarding-time">${boarding}</span></p></section>`
    }
    this.onChange?.()
  }

  // ---------- baggage ----------
  private async trackBag() {
    const tag = this.val('#bag-tag').replace(/\s+/g, '').toUpperCase()
    const err = this.$('#bag-error')!
    const area = this.$('#bag-result')!
    err.hidden = true
    area.innerHTML = ''
    if (!/^SH\d{6}$/.test(tag)) {
      err.textContent = 'A bag tag is SH followed by 6 digits'
      err.hidden = false
      return
    }
    area.innerHTML = `<p role="status" class="muted">Looking for your bag...</p>`
    const v = this.view
    const res = await this.api('GET', `/api/bags/${tag}`)
    if (v !== this.view) return
    if (!res || res.status !== 200) {
      area.innerHTML = ''
      err.textContent = res?.status === 404 ? `We could not find bag ${tag}` : 'Bag tracking is down. Try again soon.'
      err.hidden = false
      this.onChange?.()
      return
    }
    const b = res.json as Bag & { status: string }
    const warn = /Misrouted|delay/i.test(b.status)
    area.innerHTML = `<section class="card bag" aria-label="Bag ${esc(b.tag)}"><h2>Bag ${esc(b.tag)}</h2><p class="muted">${esc(b.passenger)} · ${esc(AIRPORTS[b.from] ?? b.from)} to ${esc(AIRPORTS[b.to] ?? b.to)} · ${esc(b.flight)}</p><p data-testid="bag-status" class="bag-status${warn ? ' warn' : ''}">${esc(b.status)}</p><ol class="timeline" aria-label="Bag journey">${b.scans.map((s) => `<li><time>${esc(s.time)}</time> ${esc(s.event)} at ${esc(s.place)}</li>`).join('')}</ol></section>`
    this.onChange?.()
  }

  // ---------- events ----------
  private onChangeEvent(e: Event) {
    const t = e.target as HTMLInputElement
    const p = this.state.path.split('?')[0]
    const d = this.state.draft
    if (p === '/flights' && (t.id === 'nonstop' || t.id === 'sort')) this.renderFlights()
    if (p === '/' && ['from', 'to', 'date', 'pax'].includes(t.id)) {
      if (t.id === 'pax') d.pax = Number(t.value)
      else (d as unknown as Record<string, string>)[t.id] = t.value
    }
    if (p === '/passenger') {
      if (t.name === 'meal') d.meal = t.value
      if (t.id === 'insurance') d.insurance = t.checked
    }
  }

  private onKey(e: KeyboardEvent) {
    if (e.key !== 'Enter') return
    const id = (e.target as HTMLElement).id
    if (id === 'login-email' || id === 'login-password') this.login()
    else if (id === 'bag-tag') this.trackBag()
    else if (id === 'coupon') this.applyCoupon()
    else if (id === 'pnr' || id === 'lastname') this.findBooking()
  }

  private search() {
    const from = (this.$('#from') as HTMLSelectElement).value
    const to = (this.$('#to') as HTMLSelectElement).value
    const date = this.val('#date')
    const pax = Number((this.$('#pax') as HTMLSelectElement).value) || 1
    const err = this.$('#search-error')!
    if (from === to && !this.bugs.has('same-city')) {
      err.textContent = 'From and To must be different cities'
      err.hidden = false
      return
    }
    if (!date) {
      err.textContent = 'Choose a departure date'
      err.hidden = false
      return
    }
    this.state.draft = { ...this.emptyDraft(), from, to, date, pax }
    this.navigate(`/flights?from=${from}&to=${to}&date=${date}&pax=${pax}`)
  }

  private toPayment() {
    const name = this.val('#name')
    const email = this.val('#email')
    const phone = this.val('#phone').replace(/\s+/g, '')
    const errors: string[] = []
    if (!name && !this.bugs.has('name-optional')) errors.push("Enter the passenger's full name")
    if (!/.+@.+\..+/.test(email)) errors.push('Enter a valid email')
    if (!/^\d{10}$/.test(phone)) errors.push('Enter a 10-digit phone number')
    const box = this.$('#form-errors')!
    if (errors.length) {
      box.innerHTML = errors.map((x) => `<li>${esc(x)}</li>`).join('')
      box.hidden = false
      return
    }
    const d = this.state.draft
    d.passenger = { name, email, phone }
    d.meal = (this.doc.querySelector('input[name=meal]:checked') as HTMLInputElement | null)?.value ?? 'none'
    d.insurance = (this.$('#insurance') as HTMLInputElement).checked
    this.navigate('/payment')
  }

  private onClick(e: Event) {
    const t = e.target as HTMLElement
    const link = t.closest('a') as HTMLAnchorElement | null
    if (link) {
      e.preventDefault()
      this.navigate(link.getAttribute('href') ?? '/')
      return
    }
    const btn = t.closest('button') as HTMLButtonElement | null
    if (!btn || btn.disabled) return
    const d = this.state.draft
    if (btn.id === 'search-btn') this.search()
    else if (btn.classList.contains('select-btn')) {
      d.flight = this.flights?.find((f) => f.id === btn.dataset.flight) ?? FLIGHTS.find((f) => f.id === btn.dataset.flight) ?? null
      d.seats = []
      this.navigate('/seats')
    } else if (btn.id === 'retry') this.loadFlights(d.from, d.to, d.date)
    else if (btn.classList.contains('seat')) this.pickSeat(btn.dataset.seat!)
    else if (btn.id === 'seats-continue') this.navigate('/passenger')
    else if (btn.id === 'to-payment') this.toPayment()
    else if (btn.id === 'apply-coupon') this.applyCoupon()
    else if (btn.id === 'pay-btn') this.pay()
    else if (btn.id === 'login-btn') this.login()
    else if (btn.classList.contains('cancel-trip')) this.cancelTrip(btn.dataset.pnr!)
    else if (btn.id === 'find-booking') this.findBooking()
    else if (btn.id === 'track-btn') this.trackBag()
  }
}
