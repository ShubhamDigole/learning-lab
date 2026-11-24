// CareBridge: a small clinic web app that Selenium scripts drive. Plain DOM (no framework), so every
// click and keystroke updates the page synchronously, exactly like a server-rendered site would.
// Bugs can be switched on per run to give tests something real to catch.

export type BugId =
  | 'title-typo' // login page title says "CareBrigde"
  | 'login-error-hidden' // wrong password: the error message never shows
  | 'welcome-name' // dashboard says "Welcome, undefined"
  | 'filter-extra' // Cardiology filter also shows a General doctor
  | 'search-case' // doctor search is case sensitive
  | 'slots-slow' // time slots take 6 seconds instead of about 1
  | 'slots-random' // time slots take a random 0.3 to 2.5 seconds (flaky without proper waits)
  | 'double-book' // an already taken slot can be booked
  | 'confirm-stuck' // the Confirm button never becomes enabled
  | 'wrong-fee' // confirmation shows the fee plus 50 by mistake
  | 'name-not-required' // booking works with an empty patient name
  | 'cancel-no-confirm' // Cancel removes the appointment without asking
  | 'appt-missing' // a new booking does not appear in My appointments

export const BASE = 'https://carebridge.test'

export interface Doctor {
  id: number
  name: string
  speciality: string
  fee: number
  rating: number
}
export const DOCTORS: Doctor[] = [
  { id: 1, name: 'Dr. Meera Kulkarni', speciality: 'General', fee: 500, rating: 4.8 },
  { id: 2, name: 'Dr. Arjun Shah', speciality: 'Cardiology', fee: 1200, rating: 4.6 },
  { id: 3, name: 'Dr. Neha Joshi', speciality: 'Pediatrics', fee: 700, rating: 4.9 },
  { id: 4, name: 'Dr. Imran Sheikh', speciality: 'Dermatology', fee: 900, rating: 4.4 },
  { id: 5, name: 'Dr. Kavita Rao', speciality: 'General', fee: 450, rating: 4.5 },
  { id: 6, name: 'Dr. Sanjay Patil', speciality: 'Cardiology', fee: 1100, rating: 4.7 },
]
export const SLOTS = ['10:00', '10:30', '11:00', '16:00']
const TAKEN = '11:00'

export interface Appointment {
  id: string
  doctorId: number
  date: string
  time: string
  patient: string
  reason: string
  visitType: string
  status: 'Booked' | 'Cancelled'
  fee: number
}

export interface AppState {
  path: string
  loggedIn: boolean
  user: { username: string; name: string } | null
  appointments: Appointment[]
  lastBooking: Appointment | null
  alert: { text: string; onAccept: () => void } | null
  loginAttempts: number
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export const APP_CSS = `
*{box-sizing:border-box}body{margin:0;font:15px/1.5 "Segoe UI",system-ui,sans-serif;color:#17324d;background:#f4f8fb}
header.top{display:flex;align-items:center;gap:14px;padding:8px 14px;background:#0f6e6e;color:#fff;flex-wrap:wrap}
header.top .logo{font-weight:800;font-size:17px}header.top nav{display:flex;gap:4px 12px;flex-wrap:wrap;font-size:13px}
header.top a{color:#dff7f4;text-decoration:none;font-weight:600}header.top a:hover{text-decoration:underline}
main{padding:16px;max-width:760px;margin:0 auto}h1{font-size:24px;margin:0 0 12px}h2{font-size:20px;margin:0 0 10px}
.card{background:#fff;border:1px solid #d5e3ec;border-radius:10px;padding:16px;margin-bottom:14px}
label{display:block;font-weight:600;margin:10px 0 4px}input,select,textarea{width:100%;padding:8px 10px;border:1px solid #9fb6c6;border-radius:6px;font:inherit;background:#fff}
input[type=checkbox]{width:auto}.check{display:flex;gap:8px;align-items:center;margin-top:12px;font-weight:500}
.btn{display:inline-block;text-decoration:none;border:none;border-radius:6px;padding:9px 16px;font:inherit;font-weight:700;cursor:pointer;background:#e3eef5;color:#17324d;margin-top:12px}
.btn-primary{background:#0f6e6e;color:#fff}.btn:disabled{opacity:.45;cursor:not-allowed}.btn-danger{background:#c0392b;color:#fff}
.error{color:#b42318;font-weight:600}.muted{color:#5b7286}.ok{color:#0f7b4b;font-weight:700}
table{width:100%;border-collapse:collapse;background:#fff}th,td{text-align:left;padding:8px;border-bottom:1px solid #e1ebf1}th{background:#eef5f9}
.slots{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.slot{margin-top:0;background:#fff;border:1.5px solid #0f6e6e;color:#0f6e6e}
.slot.selected{background:#0f6e6e;color:#fff}.slot.taken{border-color:#aaa;color:#999;text-decoration:line-through}
.spinner{color:#5b7286;font-style:italic}.badge{display:inline-block;padding:1px 8px;border-radius:99px;background:#e6f4f1;color:#0f6e6e;font-size:13px;font-weight:700}
.badge.cancelled{background:#fdecea;color:#b42318}.modal-back{position:fixed;inset:0;background:rgba(10,30,50,.45);display:grid;place-items:center}
.modal{background:#fff;border-radius:10px;padding:18px 20px;min-width:260px;box-shadow:0 10px 30px rgba(0,0,0,.3)}
.modal p{margin:0 0 6px;font-weight:600}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
`

/** A tiny router + renderer over a document. One instance per test run. */
export class CareBridgeApp {
  doc: Document
  bugs: Set<BugId>
  scale: number
  state: AppState
  title = ''
  private timers: ReturnType<typeof setTimeout>[] = []
  private rand: () => number
  private nextId = 1001
  private booking = { doctorId: 1, date: '', slot: '', slotsShown: false }
  onChange?: () => void

  constructor(doc: Document, opts: { bugs?: BugId[]; timeScale?: number; seed?: number; loggedIn?: boolean } = {}) {
    this.doc = doc
    this.bugs = new Set(opts.bugs ?? [])
    this.scale = opts.timeScale ?? 1
    let s = opts.seed ?? 7
    this.rand = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648)
    this.state = {
      path: '/',
      loggedIn: Boolean(opts.loggedIn),
      user: opts.loggedIn ? { username: 'asha', name: 'Asha Patil' } : null,
      appointments: [
        { id: 'CB-0998', doctorId: 3, date: '2026-12-02', time: '10:00', patient: 'Riya Patil', reason: 'Fever', visitType: 'In clinic', status: 'Booked', fee: 700 },
        { id: 'CB-0999', doctorId: 1, date: '2026-12-05', time: '16:00', patient: 'Asha Patil', reason: 'Check-up', visitType: 'Video call', status: 'Booked', fee: 500 },
      ],
      lastBooking: null,
      alert: null,
      loginAttempts: 0,
    }
    const style = doc.createElement('style')
    style.textContent = APP_CSS
    doc.head.appendChild(style)
    doc.body.addEventListener('click', (e) => this.onClick(e))
    doc.body.addEventListener('input', (e) => this.onInput(e))
    doc.body.addEventListener('change', (e) => this.onInput(e))
    doc.body.addEventListener('keydown', (e) => this.onKey(e as KeyboardEvent))
    this.navigate(BASE + '/')
  }

  dispose() {
    this.timers.forEach(clearTimeout)
  }
  private later(ms: number, fn: () => void) {
    this.timers.push(setTimeout(fn, ms * this.scale))
  }
  get url() {
    return BASE + this.state.path
  }
  private $(sel: string) {
    return this.doc.querySelector(sel) as HTMLElement | null
  }

  // ---------- routing ----------
  navigate(url: string) {
    let path = url.trim()
    if (path.startsWith(BASE)) path = path.slice(BASE.length)
    else if (/^https?:\/\//.test(path)) path = '/__offline?host=' + encodeURIComponent(path)
    if (!path.startsWith('/')) path = '/' + path
    const [p] = path.split('?')
    const needsLogin = ['/dashboard', '/book', '/appointments', '/confirmation'].includes(p)
    if (needsLogin && !this.state.loggedIn) path = '/login'
    this.state.path = path
    this.render()
  }

  private shell(body: string) {
    const nav = this.state.loggedIn
      ? `<a href="/dashboard" id="nav-dashboard">Dashboard</a><a href="/doctors" id="nav-doctors">Doctors</a><a href="/book" id="nav-book">Book appointment</a><a href="/appointments" id="nav-appointments">My appointments</a><a href="/logout" id="nav-logout">Log out</a>`
      : `<a href="/doctors" id="nav-doctors">Doctors</a><a href="/login" id="nav-login">Log in</a>`
    return `<header class="top"><span class="logo">CareBridge</span><nav>${nav}</nav></header><main>${body}</main>`
  }

  render(): void {
    const [p, qs = ''] = this.state.path.split('?')
    const q = new URLSearchParams(qs)
    let title = 'CareBridge'
    let body = ''
    if (p === '/' || p === '/home') {
      title = 'CareBridge | Your clinic, online'
      body = `<h1>Your clinic, online</h1><div class="card"><p>Find a doctor, book a visit and manage appointments.</p><a class="btn btn-primary" id="home-login" href="/login">Log in</a> <a class="btn" href="/doctors" id="home-doctors">See doctors</a></div>`
    } else if (p === '/login') {
      title = this.bugs.has('title-typo') ? 'Login | CareBrigde' : 'Login | CareBridge'
      body = `<h1>Log in</h1><form class="card" id="login-form" onsubmit="return false"><label for="username">Username</label><input id="username" name="username" autocomplete="off"><label for="password">Password</label><input id="password" name="password" type="password"><p id="login-error" class="error" hidden></p><button type="button" id="login-btn" class="btn btn-primary">Log in</button></form><p class="muted">Demo account: asha / care123</p>`
    } else if (p === '/logout') {
      this.state.loggedIn = false
      this.state.user = null
      this.state.path = '/login'
      return this.render()
    } else if (p === '/dashboard') {
      title = 'Dashboard | CareBridge'
      const name = this.bugs.has('welcome-name') ? 'undefined' : this.state.user!.name
      const upcoming = this.state.appointments.filter((a) => a.status === 'Booked').length
      body = `<h1 class="welcome">Welcome, ${esc(name)}</h1><div class="grid2"><div class="card"><h2>Upcoming</h2><p><span id="upcoming-count">${upcoming}</span> appointments</p><a class="btn" href="/appointments" id="see-appointments">My appointments</a></div><div class="card"><h2>Need a doctor?</h2><a class="btn btn-primary" id="book-link" href="/book">Book appointment</a></div></div>`
    } else if (p === '/doctors') {
      title = 'Doctors | CareBridge'
      body = `<h1>Our doctors</h1><div class="card"><div class="grid2"><div><label for="search">Search</label><input id="search" name="search" placeholder="Name or speciality"></div><div><label for="speciality">Speciality</label><select id="speciality" name="speciality"><option value="all">All</option><option value="General">General</option><option value="Cardiology">Cardiology</option><option value="Pediatrics">Pediatrics</option><option value="Dermatology">Dermatology</option></select></div></div></div><table id="doctors-table"><thead><tr><th>Doctor</th><th>Speciality</th><th>Fee (₹)</th><th>Rating</th><th></th></tr></thead><tbody id="doctor-rows"></tbody></table><p id="result-count" class="muted"></p>`
    } else if (p === '/book') {
      title = 'Book appointment | CareBridge'
      const pre = Number(q.get('doctor')) || 1
      this.booking = { doctorId: pre, date: '', slot: '', slotsShown: false }
      body = `<h1>Book an appointment</h1><form class="card" id="booking-form" onsubmit="return false"><label for="doctor">Doctor</label><select id="doctor" name="doctor">${DOCTORS.map((d) => `<option value="${d.id}"${d.id === pre ? ' selected' : ''}>${esc(d.name)} (${d.speciality})</option>`).join('')}</select><label for="date">Date</label><input id="date" name="date" type="date"><button type="button" class="btn" id="check-slots">Check availability</button><div id="slot-area"></div><label for="patient-name">Patient name</label><input id="patient-name" name="patientName"><label for="visit-type">Visit type</label><select id="visit-type" name="visitType"><option value="clinic">In clinic</option><option value="video">Video call</option></select><label for="reason">Reason for visit</label><textarea id="reason" name="reason" rows="2"></textarea><label class="check"><input type="checkbox" id="terms" name="terms"> I agree to the clinic's terms</label><p id="form-error" class="error" hidden></p><button type="button" id="confirm-btn" class="btn btn-primary" disabled>Confirm booking</button></form>`
    } else if (p === '/confirmation') {
      title = 'Booking confirmed | CareBridge'
      const b = this.state.lastBooking
      const d = DOCTORS.find((x) => x.id === b?.doctorId)
      body = b && d
        ? `<div class="card confirmation"><h1 id="confirm-title" class="ok">Appointment confirmed</h1><p>Booking id: <strong id="booking-id">${b.id}</strong></p><p id="summary">${esc(d.name)}, ${b.date} at ${b.time}</p><p>Patient: <span id="patient">${esc(b.patient)}</span></p><p>Fee: <strong id="fee">₹${b.fee}</strong></p><a class="btn" href="/appointments" id="go-appointments">My appointments</a></div>`
        : `<h1>No booking yet</h1>`
    } else if (p === '/appointments') {
      title = 'My appointments | CareBridge'
      const rows = this.state.appointments
        .filter((a) => !(this.bugs.has('appt-missing') && a.id === this.state.lastBooking?.id))
        .map((a) => {
          const d = DOCTORS.find((x) => x.id === a.doctorId)!
          return `<tr class="appt-row" data-id="${a.id}"><td class="appt-id">${a.id}</td><td class="doctor">${esc(d.name)}</td><td class="date">${a.date}</td><td class="time">${a.time}</td><td class="status"><span class="badge ${a.status === 'Cancelled' ? 'cancelled' : ''}">${a.status}</span></td><td>${a.status === 'Booked' ? `<button type="button" class="btn btn-danger cancel-btn" data-id="${a.id}">Cancel</button>` : ''}</td></tr>`
        })
        .join('')
      body = `<h1>My appointments</h1><table id="appointments"><thead><tr><th>Id</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table><p class="muted" id="appt-count">${this.state.appointments.length} appointments</p>`
    } else if (p === '/__offline') {
      title = 'This site can’t be reached'
      body = `<h1>This site can’t be reached</h1><p class="muted">The practice browser only opens ${BASE}.</p>`
    } else {
      title = 'Page not found | CareBridge'
      body = `<h1 id="not-found">Page not found</h1><p class="muted">No page at ${esc(p)}.</p><a class="btn" href="/">Home</a>`
    }
    this.title = title
    this.doc.title = title
    this.doc.body.innerHTML = this.shell(body) + (this.state.alert ? this.modalHtml() : '')
    if (p === '/doctors') this.renderDoctors()
    this.onChange?.()
  }

  private modalHtml() {
    return `<div class="modal-back" id="alert-modal"><div class="modal" role="alertdialog"><p>${esc(this.state.alert!.text)}</p><span class="muted">(a browser alert: the test must accept or dismiss it)</span></div></div>`
  }

  // ---------- doctors ----------
  private renderDoctors() {
    const search = ((this.$('#search') as HTMLInputElement | null)?.value ?? '').trim()
    const spec = (this.$('#speciality') as HTMLSelectElement | null)?.value ?? 'all'
    const list = DOCTORS.filter((d) => {
      const hay = `${d.name} ${d.speciality}`
      const matches = !search || (this.bugs.has('search-case') ? hay.includes(search) : hay.toLowerCase().includes(search.toLowerCase()))
      const specOk = spec === 'all' || d.speciality === spec || (this.bugs.has('filter-extra') && spec === 'Cardiology' && d.id === 5)
      return matches && specOk
    })
    const tbody = this.$('#doctor-rows')
    if (!tbody) return
    tbody.innerHTML = list
      .map((d) => `<tr class="doctor-row" data-id="${d.id}"><td class="name">${esc(d.name)}</td><td class="speciality">${d.speciality}</td><td class="fee">${d.fee}</td><td class="rating">${d.rating}</td><td><a class="btn book-btn" href="/book?doctor=${d.id}" data-doctor-id="${d.id}">Book</a></td></tr>`)
      .join('')
    const count = this.$('#result-count')
    if (count) count.textContent = `${list.length} doctor${list.length === 1 ? '' : 's'} found`
  }

  // ---------- events ----------
  private onInput(e: Event) {
    const t = e.target as HTMLElement
    if (this.state.path.startsWith('/doctors') && (t.id === 'search' || t.id === 'speciality')) this.renderDoctors()
    if (this.state.path.startsWith('/book')) {
      if (t.id === 'doctor') {
        this.booking.doctorId = Number((t as HTMLSelectElement).value)
        this.clearSlots()
      }
      if (t.id === 'date') {
        this.booking.date = (t as HTMLInputElement).value
        this.clearSlots()
      }
      this.updateConfirm()
    }
  }

  private onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && this.state.path === '/login' && ((e.target as HTMLElement).id === 'password' || (e.target as HTMLElement).id === 'username')) this.login()
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
    if (btn.id === 'login-btn') this.login()
    else if (btn.id === 'check-slots') this.checkSlots()
    else if (btn.classList.contains('slot')) this.pickSlot(btn)
    else if (btn.id === 'confirm-btn') this.confirm()
    else if (btn.classList.contains('cancel-btn')) this.askCancel(btn.dataset.id!)
  }

  private login() {
    const u = (this.$('#username') as HTMLInputElement).value.trim()
    const pw = (this.$('#password') as HTMLInputElement).value
    this.state.loginAttempts++
    if (u.toLowerCase() === 'asha' && pw === 'care123') {
      this.state.loggedIn = true
      this.state.user = { username: 'asha', name: 'Asha Patil' }
      this.navigate('/dashboard')
      return
    }
    const err = this.$('#login-error')!
    err.textContent = u && pw ? 'Invalid username or password' : 'Enter your username and password'
    if (!this.bugs.has('login-error-hidden')) err.hidden = false
  }

  private clearSlots() {
    this.booking.slot = ''
    this.booking.slotsShown = false
    const area = this.$('#slot-area')
    if (area) area.innerHTML = ''
  }

  private checkSlots() {
    const area = this.$('#slot-area')!
    if (!this.booking.date) {
      area.innerHTML = `<p class="error" id="date-error">Pick a date first</p>`
      return
    }
    area.innerHTML = `<p class="spinner" id="slots-loading">Checking availability...</p>`
    const delay = this.bugs.has('slots-slow') ? 6000 : this.bugs.has('slots-random') ? 300 + Math.floor(this.rand() * 2200) : 1200
    const date = this.booking.date
    this.later(delay, () => {
      if (!this.state.path.startsWith('/book') || this.booking.date !== date) return
      const a = this.$('#slot-area')
      if (!a) return
      this.booking.slotsShown = true
      a.innerHTML = `<label>Available times</label><div class="slots" id="slots">${SLOTS.map((s) => {
        const taken = s === TAKEN
        const dis = taken && !this.bugs.has('double-book')
        return `<button type="button" class="slot${taken ? ' taken' : ''}" data-time="${s}"${dis ? ' disabled' : ''}>${s}</button>`
      }).join('')}</div>`
      this.onChange?.()
    })
  }

  private pickSlot(btn: HTMLButtonElement) {
    this.doc.querySelectorAll('.slot.selected').forEach((b) => b.classList.remove('selected'))
    btn.classList.add('selected')
    this.booking.slot = btn.dataset.time!
    this.updateConfirm()
  }

  private updateConfirm() {
    const c = this.$('#confirm-btn') as HTMLButtonElement | null
    const terms = (this.$('#terms') as HTMLInputElement | null)?.checked
    if (c) c.disabled = this.bugs.has('confirm-stuck') || !(this.booking.slot && terms)
  }

  private confirm() {
    const name = (this.$('#patient-name') as HTMLInputElement).value.trim()
    const err = this.$('#form-error')!
    if (!name && !this.bugs.has('name-not-required')) {
      err.textContent = 'Patient name is required'
      err.hidden = false
      return
    }
    const d = DOCTORS.find((x) => x.id === this.booking.doctorId)!
    const vt = (this.$('#visit-type') as HTMLSelectElement).selectedOptions[0]?.textContent ?? 'In clinic'
    const a: Appointment = {
      id: `CB-${this.nextId++}`,
      doctorId: d.id,
      date: this.booking.date,
      time: this.booking.slot,
      patient: name,
      reason: (this.$('#reason') as HTMLTextAreaElement).value,
      visitType: vt,
      status: 'Booked',
      fee: d.fee + (this.bugs.has('wrong-fee') ? 50 : 0),
    }
    this.state.appointments.push(a)
    this.state.lastBooking = a
    const btn = this.$('#confirm-btn') as HTMLButtonElement
    btn.disabled = true
    btn.textContent = 'Booking...'
    this.later(600, () => {
      if (this.state.path.startsWith('/book')) this.navigate('/confirmation')
    })
  }

  private askCancel(id: string) {
    const doCancel = () => {
      const a = this.state.appointments.find((x) => x.id === id)
      if (a) a.status = 'Cancelled'
      this.state.alert = null
      this.render()
    }
    if (this.bugs.has('cancel-no-confirm')) return doCancel()
    this.state.alert = { text: 'Cancel this appointment?', onAccept: doCancel }
    this.render()
  }

  /** Used by the driver's alert API. */
  acceptAlert() {
    const a = this.state.alert
    if (!a) return false
    a.onAccept()
    return true
  }
  dismissAlert() {
    if (!this.state.alert) return false
    this.state.alert = null
    this.render()
    return true
  }
}
