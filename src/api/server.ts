// The TiffinGo practice API, running entirely in the browser (and in Node for the content checker).
//
// Planted bugs, found by the learner during the API track:
//  1. GET /restaurants?veg=true also returns Kolhapuri Kitchen (id 10), which has veg:false.
//  2. POST /orders accepts qty 0 or negative quantities (should be 400).
//  3. Coupon FLAT500 has no minimum order, so a small order gets a negative total.
//  4. GET /orders/{id} returns other customers' orders (should be 403). PATCH checks correctly.
//  5. POST /payments without an Idempotency-Key charges again on every retry.
//  6. Pagination: page 2+ starts one item early, so the last item of the previous page repeats.
//  7. Restaurant 9 breaks the contract: rating is a string and city is missing.
//  8. GET /search takes about 2.4 seconds.
//  9. GET /offers always fails with 500.
// 10. GET /internal/customers answers without any login and leaks personal data.
import type { ApiDraft, ApiResponse, HttpMethod } from './http.ts'
import { header, parsePath, STATUS_TEXT } from './http.ts'
import type { Feedback, Order, Payment, Restaurant, User } from './data.ts'
import { INTERNAL_CUSTOMERS, MENU, RESTAURANTS, SEED_FEEDBACK, SEED_ORDERS, USERS } from './data.ts'

const clone = <X,>(x: X): X => JSON.parse(JSON.stringify(x))
const NOW = '2026-11-23T10:00:00Z'
const DELIVERY_FEE = 30

function fresh() {
  return {
    feedback: clone(SEED_FEEDBACK) as Feedback[],
    orders: clone(SEED_ORDERS) as Order[],
    payments: [] as Payment[],
    idem: new Map<string, ApiResponse>(),
    paymentKeys: {} as Record<number, string>,
    nextOrder: 5001,
    nextFeedback: 7004,
    nextPayment: 9001,
    requests: 0,
  }
}
let state = fresh()
let version = 1

/** Start every practice session from the same data. */
export function resetServer() {
  state = fresh()
  version++
}

/** Changes whenever the stored data may have changed (used to mirror it into the SQL database). */
export function apiVersion() {
  return version
}

/** A copy of what the server has stored. */
export function apiSnapshot() {
  return clone({ orders: state.orders, payments: state.payments, paymentKeys: state.paymentKeys })
}

class HttpError {
  status: number
  body: Record<string, unknown>
  headers: Record<string, string>
  constructor(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) {
    this.status = status
    this.body = body
    this.headers = headers
  }
}
const fail = (status: number, error: string, message: string, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) => new HttpError(status, { error, message, ...extra }, headers)

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return Math.abs(h)
}

function respond(status: number, body: unknown, extra: Record<string, string> = {}, timeMs = 0): ApiResponse {
  state.requests++
  version++
  const headers: Record<string, string> = {}
  if (status !== 204) headers['content-type'] = 'application/json; charset=utf-8'
  headers['x-request-id'] = `req_${1000 + state.requests}`
  Object.assign(headers, extra)
  return { status, statusText: STATUS_TEXT[status] ?? '', headers, body: status === 204 ? null : body, timeMs }
}

// ---------- serializers ----------
function restaurantSummary(r: Restaurant) {
  const out: Record<string, unknown> = { id: r.id, name: r.name, city: r.city, veg: r.veg, rating: r.rating, cuisine: r.cuisine, deliveryMins: r.deliveryMins, open: r.open }
  return contractBug(r, out)
}
function restaurantDetail(r: Restaurant) {
  const out: Record<string, unknown> = { ...restaurantSummary(r), address: { ...r.address }, tags: [...r.tags] }
  return contractBug(r, out)
}
/** Bug 7: restaurant 9 sends rating as text and forgets city. */
function contractBug(r: Restaurant, out: Record<string, unknown>) {
  if (r.id === 9) {
    out.rating = String(r.rating)
    delete out.city
  }
  return out
}

// ---------- request helpers ----------
function authUser(draft: ApiDraft): User {
  const auth = header(draft.headers, 'Authorization')
  if (!auth || !auth.trim()) throw fail(401, 'UNAUTHORIZED', 'Login required. Send the header Authorization: Bearer <token> (get a token from POST /auth/login).')
  const m = /^Bearer\s+(\S+)$/i.exec(auth.trim())
  if (!m) throw fail(401, 'INVALID_TOKEN', 'Use the format: Authorization: Bearer <token>')
  const user = USERS.find((u) => u.token === m[1])
  if (!user) throw fail(401, 'INVALID_TOKEN', 'This token is not valid. Log in again.')
  return user
}

function jsonBody(draft: ApiDraft): Record<string, unknown> {
  const raw = (draft.body ?? '').trim()
  if (!raw) throw fail(400, 'BODY_REQUIRED', 'This request needs a JSON body.')
  const ct = header(draft.headers, 'Content-Type')
  if (!ct || !/application\/json/i.test(ct)) throw fail(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send JSON with the header Content-Type: application/json')
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    throw fail(400, 'BAD_JSON', `The body is not valid JSON: ${(e as Error).message}`)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw fail(400, 'BAD_JSON', 'The body must be a JSON object: { ... }')
  return parsed as Record<string, unknown>
}

function idParam(raw: string, what: string) {
  if (!/^\d+$/.test(raw)) throw fail(400, 'BAD_ID', `${what} id must be a number, got "${raw}"`)
  return Number(raw)
}

function notAllowed(allow: HttpMethod[]): never {
  throw fail(405, 'METHOD_NOT_ALLOWED', `Use one of: ${allow.join(', ')}`, {}, { allow: allow.join(', ') })
}

function findRestaurant(id: number) {
  const r = RESTAURANTS.find((x) => x.id === id)
  if (!r) throw fail(404, 'NOT_FOUND', `Restaurant ${id} not found`)
  return r
}

function findOrder(id: number) {
  const o = state.orders.find((x) => x.id === id)
  if (!o) throw fail(404, 'NOT_FOUND', `Order ${id} not found`)
  return o
}

function validateFeedback(b: Record<string, unknown>, partial: boolean) {
  const fields: Record<string, string> = {}
  if (!partial || 'restaurantId' in b) {
    if (typeof b.restaurantId !== 'number' || !RESTAURANTS.some((r) => r.id === b.restaurantId)) fields.restaurantId = 'must be the id of a real restaurant'
  }
  if (!partial || 'rating' in b) {
    if (typeof b.rating !== 'number' || !Number.isInteger(b.rating) || b.rating < 1 || b.rating > 5) fields.rating = 'must be a whole number from 1 to 5'
  }
  if (!partial || 'comment' in b) {
    if (typeof b.comment !== 'string' || !b.comment.trim()) fields.comment = 'is required'
    else if (b.comment.length > 280) fields.comment = 'must be 280 characters or fewer'
  }
  if (Object.keys(fields).length) throw fail(400, 'VALIDATION', 'Some fields are not valid', { fields })
}

// ---------- routes ----------
function route(draft: ApiDraft): ApiResponse {
  const method = draft.method
  const { pathname, query } = parsePath(draft.path)
  const seg = pathname.split('/').filter(Boolean)
  const t = 60 + (hash(method + pathname) % 180)

  if (pathname === '/health') {
    if (method !== 'GET') notAllowed(['GET'])
    return respond(200, { status: 'UP', version: '1.4.2', time: NOW }, {}, 12)
  }

  if (pathname === '/offers') {
    if (method !== 'GET') notAllowed(['GET'])
    return respond(500, { error: 'INTERNAL', message: 'Something went wrong on our side. Please try again later.' }, {}, 310)
  }

  if (pathname === '/search') {
    if (method !== 'GET') notAllowed(['GET'])
    const q = (query.q ?? '').toLowerCase()
    if (!q) throw fail(400, 'VALIDATION', 'Query parameter q is required, e.g. /search?q=dosa')
    const restaurants = RESTAURANTS.filter((r) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q)).map(restaurantSummary)
    const dishes = MENU.filter((m) => m.name.toLowerCase().includes(q)).map((m) => ({ id: m.id, name: m.name, price: m.price, restaurantId: m.restaurantId }))
    return respond(200, { query: query.q, restaurants, dishes }, {}, 2400 + (hash(q) % 200))
  }

  if (seg[0] === 'restaurants') {
    if (seg.length === 1) {
      if (method !== 'GET') notAllowed(['GET'])
      let list = [...RESTAURANTS]
      if (query.city) list = list.filter((r) => r.city.toLowerCase() === query.city.toLowerCase())
      if (query.cuisine) list = list.filter((r) => r.cuisine.toLowerCase() === query.cuisine.toLowerCase())
      if (query.veg !== undefined) {
        const want = query.veg.toLowerCase()
        if (want !== 'true' && want !== 'false') throw fail(400, 'VALIDATION', 'veg must be true or false')
        // Bug 1: Kolhapuri Kitchen slips through the veg filter.
        list = list.filter((r) => (want === 'true' ? r.veg || r.id === 10 : !r.veg))
      }
      if (query.sort) {
        const s = query.sort
        if (s === 'rating') list.sort((a, b) => b.rating - a.rating || a.id - b.id)
        else if (s === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
        else if (s === 'deliveryMins') list.sort((a, b) => a.deliveryMins - b.deliveryMins || a.id - b.id)
        else throw fail(400, 'BAD_SORT', 'sort must be rating, name or deliveryMins')
      }
      const limit = query.limit === undefined ? 20 : Number(query.limit)
      const page = query.page === undefined ? 1 : Number(query.page)
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw fail(400, 'VALIDATION', 'limit must be a whole number from 1 to 50')
      if (!Number.isInteger(page) || page < 1) throw fail(400, 'VALIDATION', 'page must be a whole number, starting at 1')
      // Bug 6: off by one on every page after the first.
      const start = (page - 1) * limit - (page > 1 ? 1 : 0)
      const data = list.slice(start, start + limit).map(restaurantSummary)
      return respond(200, { page, limit, total: list.length, data }, {}, t)
    }
    const id = idParam(seg[1], 'Restaurant')
    if (seg.length === 2) {
      if (method !== 'GET') notAllowed(['GET'])
      return respond(200, restaurantDetail(findRestaurant(id)), {}, t)
    }
    if (seg.length === 3 && seg[2] === 'menu') {
      if (method !== 'GET') notAllowed(['GET'])
      const r = findRestaurant(id)
      let items = MENU.filter((m) => m.restaurantId === id)
      if (query.veg?.toLowerCase() === 'true') items = items.filter((m) => m.veg)
      return respond(200, { restaurantId: r.id, restaurantName: r.name, items: items.map(({ id, name, price, veg, available }) => ({ id, name, price, veg, available })) }, {}, t)
    }
  }

  if (pathname === '/auth/login') {
    if (method !== 'POST') notAllowed(['POST'])
    const b = jsonBody(draft)
    if (typeof b.username !== 'string' || typeof b.password !== 'string') throw fail(400, 'VALIDATION', 'username and password are required')
    const username = (b.username as string).trim().toLowerCase()
    const u = USERS.find((x) => x.username === username && x.password === b.password)
    if (!u) throw fail(401, 'INVALID_CREDENTIALS', 'Wrong username or password')
    return respond(200, { token: u.token, tokenType: 'Bearer', expiresIn: 3600, user: { id: u.id, name: u.name } }, {}, t)
  }

  if (pathname === '/me') {
    const u = authUser(draft)
    if (method === 'GET') return respond(200, { id: u.id, username: u.username, name: u.name, phone: u.phone, address: { ...u.address } }, {}, t)
    if (method === 'PATCH') {
      const b = jsonBody(draft)
      if ('phone' in b && (typeof b.phone !== 'string' || !/^\+?[\d ]{10,15}$/.test(b.phone))) throw fail(400, 'VALIDATION', 'Some fields are not valid', { fields: { phone: 'must be a phone number' } })
      const updated = { id: u.id, username: u.username, name: typeof b.name === 'string' ? b.name : u.name, phone: typeof b.phone === 'string' ? b.phone : u.phone, address: { ...u.address } }
      return respond(200, updated, {}, t)
    }
    notAllowed(['GET', 'PATCH'])
  }

  if (pathname === '/me/address') {
    const u = authUser(draft)
    if (method === 'GET') return respond(200, { ...u.address }, {}, t)
    if (method === 'PUT') {
      const b = jsonBody(draft)
      const fields: Record<string, string> = {}
      for (const f of ['line', 'city', 'pincode']) if (typeof b[f] !== 'string' || !(b[f] as string).trim()) fields[f] = 'is required'
      if (!fields.pincode && !/^\d{6}$/.test(b.pincode as string)) fields.pincode = 'must be 6 digits'
      if (Object.keys(fields).length) throw fail(400, 'VALIDATION', 'PUT replaces the whole address, so send line, city and pincode', { fields })
      return respond(200, { line: b.line, city: b.city, pincode: b.pincode }, {}, t)
    }
    notAllowed(['GET', 'PUT'])
  }

  if (seg[0] === 'orders') {
    const u = authUser(draft)
    if (seg.length === 1) {
      if (method === 'GET') return respond(200, { data: state.orders.filter((o) => o.userId === u.id) }, {}, t)
      if (method === 'POST') return createOrder(u, jsonBody(draft), t)
      notAllowed(['GET', 'POST'])
    }
    const id = idParam(seg[1], 'Order')
    if (seg.length === 2) {
      if (method === 'GET') {
        // Bug 4: no ownership check, so anyone logged in can read anyone's order.
        return respond(200, findOrder(id), {}, t)
      }
      if (method === 'PATCH') {
        const o = findOrder(id)
        if (o.userId !== u.id) throw fail(403, 'FORBIDDEN', 'This order belongs to another customer')
        const b = jsonBody(draft)
        if (b.status !== 'CANCELLED') throw fail(400, 'VALIDATION', 'Only {"status": "CANCELLED"} is allowed')
        if (o.status === 'DELIVERED' || o.status === 'CANCELLED') throw fail(409, 'CONFLICT', `Order ${o.id} is ${o.status} and cannot be cancelled`)
        o.status = 'CANCELLED'
        return respond(200, o, {}, t)
      }
      notAllowed(['GET', 'PATCH'])
    }
    if (seg.length === 3 && seg[2] === 'payments') {
      if (method !== 'GET') notAllowed(['GET'])
      const o = findOrder(id)
      if (o.userId !== u.id) throw fail(403, 'FORBIDDEN', 'This order belongs to another customer')
      return respond(200, { orderId: o.id, data: state.payments.filter((p) => p.orderId === o.id) }, {}, t)
    }
  }

  if (pathname === '/payments') {
    const u = authUser(draft)
    if (method !== 'POST') notAllowed(['POST'])
    const key = header(draft.headers, 'Idempotency-Key')?.trim()
    const idemKey = key ? `${u.id}:${key}` : ''
    if (idemKey && state.idem.has(idemKey)) {
      const prev = state.idem.get(idemKey)!
      return respond(prev.status, prev.body, { 'idempotent-replayed': 'true' }, t)
    }
    const b = jsonBody(draft)
    if (typeof b.orderId !== 'number') throw fail(400, 'VALIDATION', 'orderId is required')
    const o = findOrder(b.orderId)
    if (o.userId !== u.id) throw fail(403, 'FORBIDDEN', 'This order belongs to another customer')
    if (b.amount !== o.total) throw fail(400, 'AMOUNT_MISMATCH', `amount must equal the order total (${o.total})`)
    if (!['UPI', 'CARD', 'COD'].includes(String(b.method))) throw fail(400, 'VALIDATION', 'method must be UPI, CARD or COD')
    // Bug 5: without an Idempotency-Key every retry is a new charge.
    const p: Payment = { id: state.nextPayment++, orderId: o.id, amount: o.total, method: String(b.method), status: 'CAPTURED', createdAt: NOW }
    state.payments.push(p)
    if (key) state.paymentKeys[p.id] = key
    const res = respond(201, p, { location: `/v1/payments/${p.id}` }, t)
    if (idemKey) state.idem.set(idemKey, res)
    return res
  }

  if (seg[0] === 'feedback') {
    if (seg.length === 1) {
      if (method === 'GET') {
        const rid = query.restaurantId ? Number(query.restaurantId) : undefined
        return respond(200, { data: state.feedback.filter((f) => rid === undefined || f.restaurantId === rid) }, {}, t)
      }
      if (method === 'POST') {
        const b = jsonBody(draft)
        validateFeedback(b, false)
        const f: Feedback = { id: state.nextFeedback++, restaurantId: b.restaurantId as number, rating: b.rating as number, comment: (b.comment as string).trim() }
        state.feedback.push(f)
        return respond(201, f, { location: `/v1/feedback/${f.id}` }, t)
      }
      notAllowed(['GET', 'POST'])
    }
    if (seg.length === 2) {
      const id = idParam(seg[1], 'Feedback')
      const f = state.feedback.find((x) => x.id === id)
      if (!f) throw fail(404, 'NOT_FOUND', `Feedback ${id} not found`)
      if (method === 'GET') return respond(200, f, {}, t)
      if (method === 'PUT') {
        const b = jsonBody(draft)
        validateFeedback(b, false)
        Object.assign(f, { restaurantId: b.restaurantId, rating: b.rating, comment: (b.comment as string).trim() })
        return respond(200, f, {}, t)
      }
      if (method === 'PATCH') {
        const b = jsonBody(draft)
        validateFeedback(b, true)
        for (const k of ['restaurantId', 'rating', 'comment'] as const) if (k in b) (f as unknown as Record<string, unknown>)[k] = b[k]
        return respond(200, f, {}, t)
      }
      if (method === 'DELETE') {
        state.feedback = state.feedback.filter((x) => x.id !== id)
        return respond(204, null, {}, t)
      }
    }
  }

  if (seg[0] === 'internal' && seg[1] === 'customers') {
    if (method !== 'GET') notAllowed(['GET'])
    // Bug 10: no authentication at all on an old internal endpoint.
    if (seg.length === 2) return respond(200, { data: INTERNAL_CUSTOMERS }, {}, t)
    const id = idParam(seg[2], 'Customer')
    const c = INTERNAL_CUSTOMERS.find((x) => x.id === id)
    if (!c) throw fail(404, 'NOT_FOUND', `Customer ${id} not found`)
    return respond(200, c, {}, t)
  }

  throw fail(404, 'NOT_FOUND', `No route for ${method} ${pathname}. Check the API docs on the left.`)
}

function createOrder(u: User, b: Record<string, unknown>, t: number): ApiResponse {
  const fields: Record<string, string> = {}
  if (typeof b.restaurantId !== 'number') fields.restaurantId = 'is required (a number)'
  if (!Array.isArray(b.items) || b.items.length === 0) fields.items = 'must be a list with at least one item'
  if (Object.keys(fields).length) throw fail(400, 'VALIDATION', 'Some fields are not valid', { fields })
  const r = findRestaurant(b.restaurantId as number)
  if (!r.open) throw fail(409, 'RESTAURANT_CLOSED', `${r.name} is closed right now`)
  const lines: Order['items'] = []
  for (const raw of b.items as unknown[]) {
    const it = raw as Record<string, unknown>
    const m = MENU.find((x) => x.id === it?.menuItemId && x.restaurantId === r.id)
    if (!m) throw fail(400, 'VALIDATION', 'Some fields are not valid', { fields: { items: `menu item ${String(it?.menuItemId)} is not on ${r.name}'s menu` } })
    if (!m.available) throw fail(409, 'ITEM_UNAVAILABLE', `${m.name} is sold out today`)
    // Bug 2: qty is only checked for being a number, so 0 and negatives get through.
    if (typeof it.qty !== 'number' || !Number.isInteger(it.qty)) throw fail(400, 'VALIDATION', 'Some fields are not valid', { fields: { qty: 'must be a whole number' } })
    lines.push({ menuItemId: m.id, name: m.name, qty: it.qty, price: m.price })
  }
  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0)
  let discount = 0
  const coupon = typeof b.couponCode === 'string' && b.couponCode.trim() ? b.couponCode.trim().toUpperCase() : null
  if (coupon === 'WELCOME50') discount = Math.min(100, Math.round(subtotal / 2))
  // Bug 3: FLAT500 should need a 1000 minimum order; there is no check.
  else if (coupon === 'FLAT500') discount = 500
  else if (coupon) throw fail(400, 'INVALID_COUPON', `Coupon ${coupon} does not exist`)
  const o: Order = { id: state.nextOrder++, userId: u.id, restaurantId: r.id, items: lines, subtotal, discount, deliveryFee: DELIVERY_FEE, total: subtotal - discount + DELIVERY_FEE, couponCode: coupon, status: 'PLACED', createdAt: NOW }
  state.orders.push(o)
  return respond(201, o, { location: `/v1/orders/${o.id}` }, t)
}

/** Send one request to the practice server. Never throws. */
export function send(draft: ApiDraft): ApiResponse {
  try {
    return route(draft)
  } catch (e) {
    if (e instanceof HttpError) return respond(e.status, e.body, e.headers, 40 + (hash(draft.path) % 60))
    return respond(500, { error: 'INTERNAL', message: String(e) }, {}, 50)
  }
}

/** Endpoint list shown in the console's docs panel. */
export const ENDPOINTS: { method: HttpMethod; path: string; en: string; mr: string; auth?: boolean; body?: string }[] = [
  { method: 'GET', path: '/health', en: 'Is the server up?', mr: 'सर्व्हर चालू आहे का?' },
  { method: 'GET', path: '/restaurants', en: 'List restaurants. Filters: city, veg, cuisine, sort, page, limit', mr: 'रेस्टॉरंट्सची यादी. फिल्टर: city, veg, cuisine, sort, page, limit' },
  { method: 'GET', path: '/restaurants/3', en: 'One restaurant by id', mr: 'id ने एक रेस्टॉरंट' },
  { method: 'GET', path: '/restaurants/3/menu', en: "A restaurant's menu", mr: 'रेस्टॉरंटचा मेन्यू' },
  { method: 'GET', path: '/search?q=dosa', en: 'Search restaurants and dishes', mr: 'रेस्टॉरंट्स आणि पदार्थ शोधा' },
  { method: 'GET', path: '/offers', en: "Today's offers", mr: 'आजच्या ऑफर्स' },
  { method: 'GET', path: '/feedback?restaurantId=3', en: 'Read feedback', mr: 'अभिप्राय वाचा' },
  { method: 'POST', path: '/feedback', en: 'Add feedback', mr: 'अभिप्राय जोडा', body: '{\n  "restaurantId": 3,\n  "rating": 5,\n  "comment": "Loved it"\n}' },
  { method: 'PUT', path: '/feedback/7001', en: 'Replace feedback (send every field)', mr: 'अभिप्राय पूर्ण बदला (सगळी fields पाठवा)', body: '{\n  "restaurantId": 3,\n  "rating": 4,\n  "comment": "Updated"\n}' },
  { method: 'PATCH', path: '/feedback/7001', en: 'Change part of a feedback', mr: 'अभिप्रायाचा काही भाग बदला', body: '{\n  "rating": 3\n}' },
  { method: 'DELETE', path: '/feedback/7001', en: 'Delete feedback', mr: 'अभिप्राय काढून टाका' },
  { method: 'POST', path: '/auth/login', en: 'Log in, get a token (asha / chai123)', mr: 'लॉगिन करा, token मिळवा (asha / chai123)', body: '{\n  "username": "asha",\n  "password": "chai123"\n}' },
  { method: 'GET', path: '/me', en: 'My profile', mr: 'माझी प्रोफाइल', auth: true },
  { method: 'PATCH', path: '/me', en: 'Change my phone or name', mr: 'माझा फोन किंवा नाव बदला', auth: true, body: '{\n  "phone": "+91 90000 12345"\n}' },
  { method: 'PUT', path: '/me/address', en: 'Replace my address', mr: 'माझा पत्ता बदला', auth: true, body: '{\n  "line": "5 FC Road",\n  "city": "Pune",\n  "pincode": "411004"\n}' },
  { method: 'GET', path: '/orders', en: 'My orders', mr: 'माझ्या ऑर्डर्स', auth: true },
  { method: 'POST', path: '/orders', en: 'Place an order', mr: 'ऑर्डर द्या', auth: true, body: '{\n  "restaurantId": 3,\n  "items": [\n    { "menuItemId": 301, "qty": 2 }\n  ]\n}' },
  { method: 'GET', path: '/orders/4001', en: 'One order', mr: 'एक ऑर्डर', auth: true },
  { method: 'PATCH', path: '/orders/4003', en: 'Cancel an order', mr: 'ऑर्डर रद्द करा', auth: true, body: '{\n  "status": "CANCELLED"\n}' },
  { method: 'GET', path: '/orders/4003/payments', en: 'Payments for an order', mr: 'ऑर्डरची payments', auth: true },
  { method: 'POST', path: '/payments', en: 'Pay for an order', mr: 'ऑर्डरचे पैसे भरा', auth: true, body: '{\n  "orderId": 4003,\n  "amount": 180,\n  "method": "UPI"\n}' },
]
