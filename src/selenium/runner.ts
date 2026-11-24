// A WebDriver look-alike over the CareBridge app, plus the TestNG-style runner.
// Errors use the real Selenium exception names and messages, so what she learns transfers to real jobs.
import { BASE, CareBridgeApp, type BugId } from './app.ts'
import { CompileError, Interpreter, JavaException, JLambda, javaEquals, javaString, JDouble, parseJava, type MethodDecl } from './java.ts'

export interface LogEntry {
  line: number
  text: string
  ok: boolean
  kind: 'cmd' | 'assert' | 'print' | 'warn' | 'error' | 'test'
}
export interface TestResult {
  name: string
  pass: boolean
  error?: string
  line?: number
}
export interface RunResult {
  ok: boolean
  compileError?: { message: string; line: number }
  tests: TestResult[]
  log: LogEntry[]
  output: string[]
  assertions: { passed: number; failed: number }
  usedSleep: boolean
  app: CareBridgeApp
}
export type ActKind = 'find' | 'click' | 'type' | 'read' | 'nav' | 'select' | 'alert' | 'wait'
export interface Hooks {
  /** move the robot cursor to an element and highlight it */
  act?: (el: Element | null, kind: ActKind) => Promise<void>
  /** one character was typed */
  typed?: () => Promise<void>
  /** a statement on this line is about to run */
  line?: (line: number) => void
  /** a log line was written */
  log?: (e: LogEntry) => void
}
export interface RunOptions {
  doc: Document
  bugs?: BugId[]
  timeScale?: number
  loggedIn?: boolean
  startUrl?: string
  seed?: number
  hooks?: Hooks
  /** for Java-only lessons: no browser commands */
  noBrowser?: boolean
  /** called whenever a fresh app starts in the document */
  onApp?: (app: CareBridgeApp) => void
}

const KEYS: Record<string, string> = { ENTER: '\uE007', RETURN: '\uE006', TAB: '\uE004', ESCAPE: '\uE00C', BACK_SPACE: '\uE003', SPACE: ' ', DELETE: '\uE017', ARROW_DOWN: '\uE015', ARROW_UP: '\uE013', CONTROL: '\uE009', SHIFT: '\uE008' }
// Special keys only: a plain space must be typed as a space.
const KEY_NAME: Record<string, string> = Object.fromEntries(Object.entries(KEYS).filter(([k]) => k !== 'SPACE').map(([k, v]) => [v, k]))
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

class Locator {
  __java = 'By'
  how: string
  using: string
  constructor(how: string, using: string) {
    this.how = how
    this.using = using
  }
  toString() {
    return `By.${this.how}: ${this.using}`
  }
  json() {
    const method = { id: 'css selector', name: 'css selector', className: 'css selector', cssSelector: 'css selector', tagName: 'css selector', xpath: 'xpath', linkText: 'link text', partialLinkText: 'partial link text' }[this.how]
    const selector = this.how === 'id' ? `#${this.using}` : this.how === 'name' ? `*[name="${this.using}"]` : this.how === 'className' ? `.${this.using}` : this.using
    return `{"method":"${method}","selector":"${selector}"}`
  }
}

const norm = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()
function displayed(el: Element) {
  return el.isConnected && !el.closest('[hidden]') && (el as HTMLInputElement).type !== 'hidden'
}

export class Session {
  app!: CareBridgeApp
  opts: RunOptions
  it!: Interpreter
  log: LogEntry[] = []
  output: string[] = []
  passed = 0
  failed = 0
  usedSleep = false
  muted = false
  implicitMs = 0
  quit = false
  history: string[] = []
  hist = -1
  scale: number

  constructor(opts: RunOptions) {
    this.opts = opts
    this.scale = opts.timeScale ?? 1
    this.boot()
  }

  boot() {
    const d = this.opts.doc
    this.app?.dispose()
    d.open()
    d.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>')
    d.close()
    this.app = new CareBridgeApp(d, { bugs: this.opts.bugs, timeScale: this.scale, seed: this.opts.seed, loggedIn: this.opts.loggedIn })
    if (this.opts.startUrl) this.app.navigate(this.opts.startUrl)
    this.opts.onApp?.(this.app)
    this.history = [this.app.url]
    this.hist = 0
    this.quit = false
    this.implicitMs = 0
  }

  get line() {
    return this.it?.line ?? 0
  }
  note(text: string, ok = true, kind: LogEntry['kind'] = 'cmd') {
    if (this.muted) return
    const e = { line: this.line, text, ok, kind }
    this.log.push(e)
    this.opts.hooks?.log?.(e)
  }
  err(type: string, message: string): never {
    this.note(`${type}: ${message}`, false, 'error')
    throw new JavaException(type, message, this.line)
  }
  alive() {
    if (this.opts.noBrowser) this.err('IllegalStateException', 'There is no browser in this lesson. Only plain Java runs here.')
    if (this.quit) this.err('NoSuchSessionException', 'invalid session id: the browser was closed with driver.quit(). Create a new ChromeDriver first.')
  }
  noAlert() {
    if (this.app.state.alert) this.err('UnhandledAlertException', `unexpected alert open: {Alert text : ${this.app.state.alert.text}}`)
  }
  async act(el: Element | null, kind: ActKind) {
    if (this.opts.hooks?.act) await this.opts.hooks.act(el, kind)
  }

  locate(root: Document | Element, by: Locator): Element[] {
    const doc = this.opts.doc
    const css = (s: string): Element[] => {
      try {
        return [...root.querySelectorAll(s)]
      } catch {
        this.err('InvalidSelectorException', `invalid selector: An invalid or illegal selector was specified: "${s}"`)
      }
    }
    const cssEsc = (s: string) => s.replace(/(["\\])/g, '\\$1')
    switch (by.how) {
      case 'id': return css(`[id="${cssEsc(by.using)}"]`)
      case 'name': return css(`[name="${cssEsc(by.using)}"]`)
      case 'className':
        if (/\s/.test(by.using.trim())) this.err('InvalidSelectorException', `Compound class names not permitted: "${by.using}". Use By.cssSelector(".a.b") instead.`)
        return css(`.${by.using.trim().replace(/([^\w-])/g, '\\$1')}`)
      case 'cssSelector': return css(by.using)
      case 'tagName': return css(by.using)
      case 'linkText': return [...root.querySelectorAll('a')].filter((a) => norm(a.textContent) === by.using.trim())
      case 'partialLinkText': return [...root.querySelectorAll('a')].filter((a) => norm(a.textContent).includes(by.using.trim()))
      case 'xpath': {
        try {
          const r = doc.evaluate(by.using, root, null, 7 /* ORDERED_NODE_SNAPSHOT_TYPE */, null)
          const out: Element[] = []
          for (let i = 0; i < r.snapshotLength; i++) {
            const n = r.snapshotItem(i)
            if (n && n.nodeType === 1) out.push(n as Element)
          }
          return out
        } catch {
          this.err('InvalidSelectorException', `invalid selector: Unable to locate an element with the xpath expression ${by.using} because it is not a valid XPath expression`)
        }
      }
    }
    this.err('InvalidSelectorException', `Unknown locator ${by.how}`)
  }

  async find(root: Document | Element, by: unknown, quiet = false): Promise<Element> {
    if (!(by instanceof Locator)) this.err('IllegalArgumentException', 'findElement needs a locator, for example By.id("username")')
    const end = Date.now() + this.implicitMs * this.scale
    for (;;) {
      const found = this.locate(root, by)[0]
      if (found) {
        if (!quiet) await this.act(found, 'find')
        return found
      }
      if (Date.now() >= end) break
      await sleep(Math.max(5, 100 * this.scale))
    }
    if (quiet) throw new JavaException('NoSuchElementException', 'not found', this.line)
    this.err('NoSuchElementException', `no such element: Unable to locate element: ${by.json()}`)
  }

  wrap(el: Element, desc: string): WebElementObj {
    return new WebElementObj(this, el, desc)
  }

  pause(ms: number) {
    return sleep(ms * this.scale)
  }
}

export class WebElementObj {
  __java = 'WebElement'
  s: Session
  el: Element
  desc: string
  constructor(s: Session, el: Element, desc: string) {
    this.s = s
    this.el = el
    this.desc = desc
  }
  toString() {
    return `[[ChromeDriver: chrome on windows] -> ${this.desc}]`
  }
  private check() {
    this.s.alive()
    this.s.noAlert()
    if (!this.el.isConnected) this.s.err('StaleElementReferenceException', `stale element reference: the element ${this.desc} is no longer on the page (the page changed). Find it again.`)
  }
  async click() {
    this.check()
    if (!displayed(this.el)) this.s.err('ElementNotInteractableException', `element not interactable: ${this.desc} is not visible`)
    await this.s.act(this.el, 'click')
    const disabled = (this.el as HTMLButtonElement).disabled
    this.s.note(`click() on ${this.desc}${disabled ? '  (disabled: nothing happened)' : ''}`, !disabled, disabled ? 'warn' : 'cmd')
    if (!disabled) (this.el as HTMLElement).click()
  }
  async sendKeys(...parts: unknown[]) {
    this.check()
    const el = this.el as HTMLInputElement
    const tag = el.tagName.toLowerCase()
    if (!['input', 'textarea'].includes(tag) || ['checkbox', 'radio', 'button', 'submit'].includes(el.type)) this.s.err('ElementNotInteractableException', `element not interactable: you can only type into a text box, but ${this.desc} is a <${tag}>`)
    if (!displayed(el)) this.s.err('ElementNotInteractableException', `element not interactable: ${this.desc} is not visible`)
    if (el.disabled) this.s.err('InvalidElementStateException', `invalid element state: ${this.desc} is disabled`)
    const text = parts.flat().map((p) => (p instanceof JDouble ? javaString(p) : String(p))).join('')
    await this.s.act(el, 'type')
    const shown = [...text].map((c) => (KEY_NAME[c] ? `Keys.${KEY_NAME[c]}` : c)).join('')
    this.s.note(`sendKeys("${shown}") into ${this.desc}`)
    el.focus?.()
    let buf = ''
    const flush = () => {
      if (!buf) return
      if (el.type === 'date') {
        const v = el.value + buf
        const m = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(v)
        el.value = m ? `${m[3]}-${m[2]}-${m[1]}` : v
      } else el.value = el.value + buf
      buf = ''
      el.dispatchEvent(new (el.ownerDocument.defaultView!.Event)('input', { bubbles: true }))
    }
    for (const c of text) {
      if (c === KEYS.ENTER || c === KEYS.RETURN) {
        flush()
        el.dispatchEvent(new (el.ownerDocument.defaultView!.KeyboardEvent)('keydown', { key: 'Enter', bubbles: true }))
        continue
      }
      if (c === KEYS.BACK_SPACE) { flush(); el.value = el.value.slice(0, -1); continue }
      if (KEY_NAME[c]) continue
      buf += c
      if (this.s.opts.hooks?.typed && el.type !== 'date') {
        flush()
        await this.s.opts.hooks.typed()
      }
    }
    flush()
    el.dispatchEvent(new (el.ownerDocument.defaultView!.Event)('change', { bubbles: true }))
  }
  async clear() {
    this.check()
    ;(this.el as HTMLInputElement).value = ''
    this.el.dispatchEvent(new (this.el.ownerDocument.defaultView!.Event)('input', { bubbles: true }))
    this.s.note(`clear() on ${this.desc}`)
  }
  async submit() {
    this.check()
    this.s.note(`submit() on ${this.desc}`)
    this.el.dispatchEvent(new (this.el.ownerDocument.defaultView!.KeyboardEvent)('keydown', { key: 'Enter', bubbles: true }))
  }
  async getText() {
    this.check()
    await this.s.act(this.el, 'read')
    const t = displayed(this.el) && !['input', 'textarea'].includes(this.el.tagName.toLowerCase()) ? norm(this.el.textContent) : ''
    this.s.note(`getText() of ${this.desc} → "${t}"`)
    return t
  }
  async getAttribute(name: string) {
    this.check()
    const el = this.el as HTMLInputElement
    let v: string | null
    if (name === 'value') v = 'value' in el ? el.value : (el as Element).getAttribute('value')
    else if (['checked', 'selected', 'disabled', 'readonly', 'required'].includes(name)) v = (el as unknown as Record<string, unknown>)[name === 'readonly' ? 'readOnly' : name] ? 'true' : null
    else if (name === 'class' || name === 'className') v = el.getAttribute('class')
    else v = el.getAttribute(name)
    this.s.note(`getAttribute("${name}") of ${this.desc} → ${v === null ? 'null' : `"${v}"`}`)
    return v
  }
  getDomAttribute(name: string) { return this.getAttribute(name) }
  getDomProperty(name: string) { return this.getAttribute(name) }
  async getTagName() { this.check(); return this.el.tagName.toLowerCase() }
  async isDisplayed() {
    if (!this.el.isConnected) this.s.err('StaleElementReferenceException', `stale element reference: ${this.desc} is no longer on the page`)
    const v = displayed(this.el)
    this.s.note(`isDisplayed() of ${this.desc} → ${v}`)
    return v
  }
  async isEnabled() { this.check(); const v = !(this.el as HTMLButtonElement).disabled; this.s.note(`isEnabled() of ${this.desc} → ${v}`); return v }
  async isSelected() { this.check(); const v = Boolean((this.el as HTMLInputElement).checked || (this.el as HTMLOptionElement).selected); this.s.note(`isSelected() of ${this.desc} → ${v}`); return v }
  async findElement(by: Locator) { this.check(); const el = await this.s.find(this.el, by); this.s.note(`findElement(${by}) inside ${this.desc}`); return this.s.wrap(el, String(by)) }
  async findElements(by: Locator) { this.check(); const els = this.s.locate(this.el, by); this.s.note(`findElements(${by}) inside ${this.desc} → ${els.length}`); return els.map((e) => this.s.wrap(e, String(by))) }
  async getCssValue(prop: string) { this.check(); return (this.el as HTMLElement).style?.getPropertyValue(prop) ?? '' }
}

function duration(ms: number) {
  return { __java: 'Duration', ms, toString: () => `PT${ms / 1000}S` }
}
type Cond = ((d: unknown) => unknown) & { desc?: string }
const cond = (desc: string, f: (d: DriverObj) => unknown): Cond => Object.assign((d: unknown) => f(d as DriverObj), { desc })

class DriverObj {
  __java = 'WebDriver'
  s: Session
  constructor(s: Session) {
    this.s = s
  }
  toString() { return 'ChromeDriver: chrome on windows' }
  async get(url: unknown) {
    this.s.alive()
    this.s.noAlert()
    const u = String(url)
    if (!/^https?:\/\//i.test(u)) this.s.err('InvalidArgumentException', `invalid argument: "${u}" is not a full web address. Start it with https://, e.g. ${BASE}/login`)
    await this.s.act(null, 'nav')
    this.s.app.navigate(u)
    this.s.history = this.s.history.slice(0, this.s.hist + 1)
    this.s.history.push(this.s.app.url)
    this.s.hist = this.s.history.length - 1
    this.s.note(`get("${u}") → ${this.s.app.title}`)
  }
  async getTitle() { this.s.alive(); this.s.noAlert(); const t = this.s.app.title; this.s.note(`getTitle() → "${t}"`); return t }
  async getCurrentUrl() { this.s.alive(); this.s.noAlert(); const u = this.s.app.url; this.s.note(`getCurrentUrl() → "${u}"`); return u }
  async getPageSource() { this.s.alive(); return this.s.opts.doc.documentElement.outerHTML }
  async findElement(by: Locator) {
    this.s.alive()
    this.s.noAlert()
    const el = await this.s.find(this.s.opts.doc, by)
    this.s.note(`findElement(${by})`)
    return this.s.wrap(el, String(by))
  }
  async findElements(by: Locator) {
    this.s.alive()
    this.s.noAlert()
    let els = this.s.locate(this.s.opts.doc, by)
    if (!els.length && this.s.implicitMs) {
      try {
        await this.s.find(this.s.opts.doc, by, true)
      } catch { /* none appeared */ }
      els = this.s.locate(this.s.opts.doc, by)
    }
    this.s.note(`findElements(${by}) → ${els.length} element${els.length === 1 ? '' : 's'}`)
    return els.map((e) => this.s.wrap(e, String(by)))
  }
  navigate() {
    const s = this.s
    return {
      to: (u: string) => this.get(u),
      back: async () => { s.alive(); if (s.hist > 0) { s.hist--; s.app.navigate(s.history[s.hist]) } s.note('navigate().back()') },
      forward: async () => { s.alive(); if (s.hist < s.history.length - 1) { s.hist++; s.app.navigate(s.history[s.hist]) } s.note('navigate().forward()') },
      refresh: async () => { s.alive(); s.app.navigate(s.app.url); s.note('navigate().refresh()') },
    }
  }
  manage() {
    const s = this.s
    return {
      timeouts: () => ({
        implicitlyWait: (d: { ms: number }) => { s.implicitMs = d.ms; s.note(`implicitlyWait(${d.ms / 1000}s)`) ; return {} },
        pageLoadTimeout: () => ({}),
      }),
      window: () => ({ maximize: () => s.note('window().maximize()'), fullscreen: () => undefined, setSize: () => undefined }),
      deleteAllCookies: () => { s.app.state.loggedIn = false; s.app.state.user = null; s.note('deleteAllCookies()') },
    }
  }
  switchTo() {
    const s = this.s
    return {
      alert: async () => {
        s.alive()
        if (!s.app.state.alert) s.err('NoAlertPresentException', 'no such alert: there is no alert open right now')
        await s.act(s.opts.doc.querySelector('.modal'), 'alert')
        s.note('switchTo().alert()')
        return new AlertObj(s)
      },
      defaultContent: () => this,
      frame: () => this,
    }
  }
  async quit() { this.s.note('quit(): browser closed'); this.s.quit = true }
  async close() { return this.quit() }
}

class AlertObj {
  __java = 'Alert'
  s: Session
  constructor(s: Session) { this.s = s }
  getText() { const t = this.s.app.state.alert?.text ?? ''; this.s.note(`alert.getText() → "${t}"`); return t }
  accept() { if (!this.s.app.acceptAlert()) this.s.err('NoAlertPresentException', 'no such alert'); this.s.note('alert.accept()') }
  dismiss() { if (!this.s.app.dismissAlert()) this.s.err('NoAlertPresentException', 'no such alert'); this.s.note('alert.dismiss()') }
  sendKeys() { this.s.note('alert.sendKeys()') }
}

class WaitObj {
  __java = 'WebDriverWait'
  s: Session
  timeout: number
  poll = 500
  constructor(s: Session, timeout: number) {
    this.s = s
    this.timeout = timeout
  }
  withTimeout(d: { ms: number }) { this.timeout = d.ms; return this }
  pollingEvery(d: { ms: number }) { this.poll = d.ms; return this }
  ignoring() { return this }
  withMessage() { return this }
  async until(c: unknown) {
    const s = this.s
    s.alive()
    const desc = c instanceof JLambda ? 'your condition' : ((c as Cond)?.desc ?? 'condition')
    const end = Date.now() + this.timeout * s.scale
    await s.act(null, 'wait')
    for (;;) {
      let v: unknown = null
      s.muted = true // polling misses are not interesting
      try {
        v = c instanceof JLambda ? await c.call(new DriverObj(s)) : await (c as Cond)(new DriverObj(s))
      } catch (e) {
        if (!(e instanceof JavaException) || !['NoSuchElementException', 'StaleElementReferenceException'].includes(e.type)) {
          s.muted = false
          throw e
        }
      } finally {
        s.muted = false
      }
      if (v !== null && v !== undefined && v !== false) {
        s.note(`wait.until(${desc}) ✓`)
        if (v instanceof WebElementObj) await s.act(v.el, 'find')
        return v
      }
      if (Date.now() >= end) break
      await sleep(Math.max(5, Math.min(this.poll, 200) * s.scale))
    }
    s.err('TimeoutException', `Expected condition failed: waiting for ${desc} (tried for ${this.timeout / 1000} second(s) with ${this.poll} milliseconds interval)`)
  }
}

class SelectObj {
  __java = 'Select'
  s: Session
  el: HTMLSelectElement
  desc: string
  constructor(s: Session, we: WebElementObj) {
    if (!(we instanceof WebElementObj)) s.err('IllegalArgumentException', 'new Select(...) needs a WebElement')
    if (we.el.tagName.toLowerCase() !== 'select') s.err('UnexpectedTagNameException', `Element should have been "select" but was "${we.el.tagName.toLowerCase()}"`)
    this.s = s
    this.el = we.el as HTMLSelectElement
    this.desc = we.desc
  }
  private async pick(i: number, how: string) {
    await this.s.act(this.el, 'select')
    this.el.selectedIndex = i
    this.el.dispatchEvent(new (this.el.ownerDocument.defaultView!.Event)('change', { bubbles: true }))
    this.s.note(`${how} on ${this.desc}`)
  }
  async selectByVisibleText(t: string) {
    const i = [...this.el.options].findIndex((o) => norm(o.textContent) === t.trim())
    if (i < 0) this.s.err('NoSuchElementException', `Cannot locate option with text: ${t}`)
    await this.pick(i, `selectByVisibleText("${t}")`)
  }
  async selectByValue(v: string) {
    const i = [...this.el.options].findIndex((o) => o.value === v)
    if (i < 0) this.s.err('NoSuchElementException', `Cannot locate option with value: ${v}`)
    await this.pick(i, `selectByValue("${v}")`)
  }
  async selectByIndex(i: number) {
    if (i < 0 || i >= this.el.options.length) this.s.err('NoSuchElementException', `Cannot locate option with index: ${i}`)
    await this.pick(i, `selectByIndex(${i})`)
  }
  getFirstSelectedOption() { return this.s.wrap(this.el.options[this.el.selectedIndex], `${this.desc} option`) }
  getOptions() { return [...this.el.options].map((o) => this.s.wrap(o, `${this.desc} option`)) }
  isMultiple() { return this.el.multiple }
}

function testngAssert(s: Session, firstIsActual: boolean) {
  const pass = (what: string) => { s.passed++; s.note(`✓ ${what}`, true, 'assert') }
  const failA = (msg: string) => {
    s.failed++
    s.note(`✕ ${msg}`, false, 'assert')
    throw new JavaException('AssertionError', msg, s.line)
  }
  const show = (v: unknown) => javaString(v)
  return {
    assertEquals: (a: unknown, b: unknown, m?: string) => {
      const [actual, expected, msg] = firstIsActual ? [a, b, m] : [b, a, m]
      if (javaEquals(actual, expected)) pass(`assertEquals: [${show(actual)}]`)
      else failA(`${msg ? msg + ' ' : ''}expected [${show(expected)}] but found [${show(actual)}]`)
    },
    assertNotEquals: (a: unknown, b: unknown, m?: string) => (!javaEquals(a, b) ? pass(`assertNotEquals: [${show(a)}] is not [${show(b)}]`) : failA(`${m ? m + ' ' : ''}did not expect [${show(a)}] but found [${show(b)}]`)),
    assertTrue: (c: unknown, m?: string) => (c === true ? pass('assertTrue') : failA(`${m ? m + ' ' : ''}expected [true] but found [${show(c)}]`)),
    assertFalse: (c: unknown, m?: string) => (c === false ? pass('assertFalse') : failA(`${m ? m + ' ' : ''}expected [false] but found [${show(c)}]`)),
    assertNull: (v: unknown, m?: string) => (v === null || v === undefined ? pass('assertNull') : failA(`${m ? m + ' ' : ''}expected [null] but found [${show(v)}]`)),
    assertNotNull: (v: unknown, m?: string) => (v !== null && v !== undefined ? pass('assertNotNull') : failA(`${m ? m + ' ' : ''}expected object to not be null`)),
    fail: (m?: string) => failA(m ?? 'fail() was called'),
  }
}

function softAssert(s: Session) {
  const errors: string[] = []
  const show = (v: unknown) => javaString(v)
  const rec = (ok: boolean, msg: string) => {
    if (ok) { s.passed++; s.note(`✓ soft check`, true, 'assert') }
    else { errors.push(msg); s.note(`✕ soft check failed (keeps going): ${msg}`, false, 'assert') }
  }
  return {
    __java: 'SoftAssert',
    assertEquals: (a: unknown, e: unknown, m?: string) => rec(javaEquals(a, e), `${m ? m + ' ' : ''}expected [${show(e)}] but found [${show(a)}]`),
    assertTrue: (c: unknown, m?: string) => rec(c === true, `${m ? m + ' ' : ''}expected [true] but found [${show(c)}]`),
    assertFalse: (c: unknown, m?: string) => rec(c === false, `${m ? m + ' ' : ''}expected [false] but found [${show(c)}]`),
    assertNotNull: (v: unknown, m?: string) => rec(v !== null && v !== undefined, `${m ? m + ' ' : ''}expected object to not be null`),
    assertAll: () => {
      if (errors.length) {
        s.failed++
        const msg = `The following asserts failed:\n\t${errors.join(',\n\t')}`
        s.note(`✕ assertAll(): ${errors.length} soft check${errors.length > 1 ? 's' : ''} failed`, false, 'assert')
        throw new JavaException('AssertionError', msg, s.line)
      }
      s.note('✓ assertAll(): every soft check passed', true, 'assert')
    },
  }
}

function hostFor(s: Session) {
  const driver = new DriverObj(s)
  const by = (how: string) => (v: unknown) => {
    if (typeof v !== 'string') s.err('IllegalArgumentException', `By.${how}(...) needs text in double quotes`)
    return new Locator(how, v)
  }
  const ec = {
    visibilityOfElementLocated: (b: Locator) => cond(`visibility of element located by ${b}`, async () => { const el = s.locate(s.opts.doc, b)[0]; return el && displayed(el) ? s.wrap(el, String(b)) : null }),
    presenceOfElementLocated: (b: Locator) => cond(`presence of element located by ${b}`, async () => { const el = s.locate(s.opts.doc, b)[0]; return el ? s.wrap(el, String(b)) : null }),
    elementToBeClickable: (b: Locator | WebElementObj) => cond(`element to be clickable: ${b instanceof Locator ? b : b.desc}`, async () => {
      const el = b instanceof Locator ? s.locate(s.opts.doc, b)[0] : b.el
      return el && displayed(el) && !(el as HTMLButtonElement).disabled ? s.wrap(el, b instanceof Locator ? String(b) : b.desc) : null
    }),
    visibilityOf: (w: WebElementObj) => cond(`visibility of ${w.desc}`, async () => (displayed(w.el) ? w : null)),
    invisibilityOfElementLocated: (b: Locator) => cond(`element located by ${b} to no longer be visible`, async () => { const el = s.locate(s.opts.doc, b)[0]; return !el || !displayed(el) }),
    textToBePresentInElementLocated: (b: Locator, t: string) => cond(`text ('${t}') to be present in element located by ${b}`, async () => { const el = s.locate(s.opts.doc, b)[0]; return Boolean(el && norm(el.textContent).includes(t)) }),
    textToBePresentInElement: (w: WebElementObj, t: string) => cond(`text ('${t}') to be present in ${w.desc}`, async () => norm(w.el.textContent).includes(t)),
    titleIs: (t: string) => cond(`title to be "${t}"`, async () => s.app.title === t),
    titleContains: (t: string) => cond(`title to contain "${t}"`, async () => s.app.title.includes(t)),
    urlContains: (t: string) => cond(`url to contain "${t}"`, async () => s.app.url.includes(t)),
    urlToBe: (t: string) => cond(`url to be "${t}"`, async () => s.app.url === t),
    numberOfElementsToBe: (b: Locator, n: number) => cond(`number of elements found by ${b} to be ${n}`, async () => (s.locate(s.opts.doc, b).length === n ? s.locate(s.opts.doc, b).map((e) => s.wrap(e, String(b))) : null)),
    alertIsPresent: () => cond('alert to be present', async () => (s.app.state.alert ? new AlertObj(s) : null)),
    attributeToBe: (b: Locator, a: string, v: string) => cond(`attribute ${a} to be "${v}" for ${b}`, async () => s.locate(s.opts.doc, b)[0]?.getAttribute(a) === v),
  }
  const out = {
    __java: 'PrintStream',
    println: (v?: unknown) => { const t = v === undefined ? '' : javaString(v); s.output.push(t); s.note(t, true, 'print') },
    print: (v: unknown) => { const t = javaString(v); if (s.output.length) s.output[s.output.length - 1] += t; else s.output.push(t); s.note(t, true, 'print') },
  }
  const globals: Record<string, unknown> = {
    driver,
    By: { id: by('id'), name: by('name'), className: by('className'), cssSelector: by('cssSelector'), xpath: by('xpath'), linkText: by('linkText'), partialLinkText: by('partialLinkText'), tagName: by('tagName') },
    Keys: KEYS,
    Duration: { ofSeconds: (n: number) => duration(n * 1000), ofMillis: (n: number) => duration(n) },
    ExpectedConditions: ec,
    Assert: testngAssert(s, true),
    Assertions: testngAssert(s, false),
    System: { out, err: out, currentTimeMillis: () => Date.now() },
    Thread: {
      sleep: async (ms: number) => {
        s.usedSleep = true
        s.note(`Thread.sleep(${ms}): the test just waits, even if the page is ready sooner`, true, 'warn')
        await s.act(null, 'wait')
        await s.pause(ms)
      },
    },
    Integer: {
      parseInt: (v: string) => { if (!/^\s*-?\d+\s*$/.test(String(v))) s.err('NumberFormatException', `For input string: "${v}"`); return parseInt(v, 10) },
      valueOf: (v: string | number) => (typeof v === 'number' ? v : parseInt(v, 10)),
      MAX_VALUE: 2147483647,
    },
    Double: { parseDouble: (v: string) => { const n = Number(String(v).trim()); if (Number.isNaN(n)) s.err('NumberFormatException', `For input string: "${v}"`); return new JDouble(n) } },
    String: { valueOf: (v: unknown) => javaString(v), join: (sep: string, list: unknown[]) => list.map(javaString).join(sep), format: (f: string, ...a: unknown[]) => { let i = 0; return f.replace(/%[sdf]/g, () => javaString(a[i++])) } },
    Math: { max: (a: number, b: number) => Math.max(a, b), min: (a: number, b: number) => Math.min(a, b), abs: (a: number) => Math.abs(a), round: (a: unknown) => Math.round(a instanceof JDouble ? a.v : (a as number)) },
    Arrays: { asList: (...a: unknown[]) => (a.length === 1 && Array.isArray(a[0]) ? [...a[0]] : a) },
    List: { of: (...a: unknown[]) => a },
    WebDriverManager: { chromedriver: () => ({ setup: () => undefined }) },
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const constructors: Record<string, (...a: any[]) => unknown> = {
    ChromeDriver: () => {
      if (s.quit) {
        s.boot()
        s.note('new ChromeDriver(): a fresh browser opened')
      }
      return driver
    },
    FirefoxDriver: () => constructors.ChromeDriver(),
    EdgeDriver: () => constructors.ChromeDriver(),
    ChromeOptions: () => ({ addArguments: () => undefined }),
    WebDriverWait: (_d: unknown, d: { ms: number } | number) => new WaitObj(s, typeof d === 'number' ? d * 1000 : d?.ms ?? 10000),
    FluentWait: () => new WaitObj(s, 10000),
    Select: (we: unknown) => new SelectObj(s, we as WebElementObj),
    SoftAssert: () => softAssert(s),
    ArrayList: (init?: unknown) => (Array.isArray(init) ? [...init] : []),
    LinkedList: () => [],
    HashMap: () => new Map(),
    Object: () => ({}),
    RuntimeException: (m?: string) => new JavaException('RuntimeException', m ?? ''),
    Exception: (m?: string) => new JavaException('Exception', m ?? ''),
    AssertionError: (m?: string) => new JavaException('AssertionError', m ?? ''),
  }
  return { globals, constructors }
}

const ann = (m: MethodDecl, n: string) => m.annotations.find((a) => a.name === n)

/** Parse and run a test script. Never throws. */
export async function runSelenium(code: string, opts: RunOptions): Promise<RunResult> {
  const s = new Session(opts)
  const result = (ok: boolean, tests: TestResult[], compileError?: { message: string; line: number }): RunResult => ({
    ok,
    tests,
    compileError,
    log: s.log,
    output: s.output,
    assertions: { passed: s.passed, failed: s.failed },
    usedSleep: s.usedSleep,
    app: s.app,
  })
  let prog
  try {
    prog = parseJava(code)
  } catch (e) {
    if (e instanceof CompileError) return result(false, [], { message: e.message, line: e.line })
    return result(false, [], { message: String(e), line: 0 })
  }
  const host = hostFor(s)
  s.it = new Interpreter(prog, { ...host, onLine: (l) => opts.hooks?.line?.(l) })
  const tests: TestResult[] = []
  const asResult = (name: string, e: unknown): TestResult => {
    if (e instanceof JavaException) {
      if (e.type === 'CompileError') return { name, pass: false, error: `Compile error on line ${e.line}: ${e.message}`, line: e.line }
      return { name, pass: false, error: `${e.type === 'AssertionError' ? 'java.lang.AssertionError' : e.type}: ${e.message}`, line: e.line }
    }
    return { name, pass: false, error: `Internal error: ${String(e)}` }
  }
  try {
    await s.it.runTopLevel()
  } catch (e) {
    const r = asResult('script', e)
    if (r.error?.startsWith('Compile error')) return result(false, [], { message: r.error.replace(/^Compile error on line \d+: /, ''), line: r.line ?? 0 })
    tests.push(r)
    s.note(`Test FAILED: ${r.error}`, false, 'test')
    s.app.dispose()
    return result(false, tests)
  }
  const testMethods = prog.methods.filter((m) => ann(m, 'Test') && ann(m, 'Test')!.args.enabled !== false)
  if (testMethods.length === 0) {
    tests.push({ name: 'script', pass: true })
  } else {
    const run = async (m: MethodDecl | undefined, args: unknown[] = []) => m && (await s.it.callMethod(m, args, null))
    const before = prog.methods.filter((m) => ann(m, 'BeforeMethod'))
    const after = prog.methods.filter((m) => ann(m, 'AfterMethod'))
    try {
      for (const m of prog.methods.filter((m) => ann(m, 'BeforeClass'))) await run(m)
    } catch (e) {
      tests.push(asResult('@BeforeClass', e))
      return result(false, tests)
    }
    const ordered = [...testMethods].sort((a, b) => Number(ann(a, 'Test')!.args.priority ?? 0) - Number(ann(b, 'Test')!.args.priority ?? 0) || a.name.localeCompare(b.name))
    for (const m of ordered) {
      const dp = ann(m, 'Test')!.args.dataProvider as string | undefined
      let rows: unknown[][] = [[]]
      if (dp) {
        const prov = prog.methods.find((x) => ann(x, 'DataProvider') && (ann(x, 'DataProvider')!.args.name ?? x.name) === dp)
        if (!prov) { tests.push({ name: m.name, pass: false, error: `No @DataProvider named "${dp}"` }); continue }
        rows = ((await run(prov)) as unknown[][]) ?? []
      }
      for (const row of rows) {
        const label = dp ? `${m.name}(${row.map((v) => (typeof v === 'string' ? `"${v}"` : javaString(v))).join(', ')})` : m.name
        s.note(`▶ ${label}`, true, 'test')
        let r: TestResult = { name: label, pass: true }
        try {
          for (const b of before) await run(b)
          await run(m, row)
        } catch (e) {
          r = asResult(label, e)
        }
        try {
          for (const a of after) await run(a)
        } catch (e) {
          if (r.pass) r = asResult(label, e)
        }
        s.note(r.pass ? `PASSED: ${label}` : `FAILED: ${label}: ${r.error}`, r.pass, 'test')
        tests.push(r)
        if (r.error?.startsWith('Compile error')) return result(false, tests, { message: r.error.replace(/^Compile error on line \d+: /, ''), line: r.line ?? 0 })
      }
    }
    try {
      for (const m of prog.methods.filter((m) => ann(m, 'AfterClass'))) await run(m)
    } catch { /* ignore */ }
  }
  s.app.dispose()
  return result(tests.every((t) => t.pass), tests)
}

/** Show the app in a document without running any code (the lab's idle state). */
export function bootPreview(opts: RunOptions): CareBridgeApp {
  return new Session(opts).app
}
