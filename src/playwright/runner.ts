// A Playwright look-alike over the SkyHop app, plus a tiny @playwright/test runner.
// The learner's code is real TypeScript/JavaScript: types are stripped with sucrase and the file runs
// as an async function. Locators auto-wait and are strict, assertions retry, and errors use the real
// Playwright wording, so what she learns here works in a real project.
import { transform } from 'sucrase'
import { SKY_BASE, SkyBackend, SkyHopApp, type NetRequest, type NetResponse, type SkyBug } from './app.ts'

export interface PwLog {
  line: number
  text: string
  ok: boolean
  kind: 'cmd' | 'assert' | 'print' | 'warn' | 'error' | 'test' | 'step' | 'net'
}
export interface PwTest {
  name: string
  pass: boolean
  skipped?: boolean
  error?: string
  line?: number
  ms: number
}
export interface PwResult {
  ok: boolean
  compileError?: { message: string; line: number }
  tests: PwTest[]
  log: PwLog[]
  output: string[]
  assertions: { passed: number; failed: number }
  usedWaitForTimeout: boolean
  app: SkyHopApp | null
  backend: SkyBackend
}
export type PwAct = 'find' | 'click' | 'type' | 'read' | 'nav' | 'select' | 'check' | 'wait' | 'assert' | 'dialog' | 'shot'
export interface PwHooks {
  act?: (el: Element | null, kind: PwAct) => Promise<void>
  typed?: () => Promise<void>
  line?: (line: number) => void
  log?: (e: PwLog) => void
}
export interface PwOptions {
  doc: Document
  bugs?: SkyBug[]
  timeScale?: number
  loggedIn?: boolean
  hooks?: PwHooks
  noBrowser?: boolean
  onApp?: (app: SkyHopApp | null, url: string, title: string) => void
}

const ACTION_TIMEOUT = 5000
const EXPECT_TIMEOUT = 5000
const TEST_TIMEOUT = 30000
const norm = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()
const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const fmtMatch = (v: string | RegExp) => (v instanceof RegExp ? String(v) : q(v))

class PwError extends Error {
  line: number
  constructor(message: string, line: number) {
    super(message)
    this.line = line
  }
}
class SkipError extends Error {}
class AbortedError extends Error {}

// ---------- line numbers from stack traces ----------
let LINE_OFFSET: number | null = null
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (...args: string[]) => (...a: unknown[]) => Promise<unknown>
function calibrate() {
  if (LINE_OFFSET !== null) return LINE_OFFSET
  try {
    // Same header layout as the AsyncFunction the spec runs in (params on line 1, body from line 3).
    const stack = String(new Function('a', 'b', 'return new Error("probe").stack\n//# sourceURL=__probe.ts')())
    const m = /__probe\.ts:(\d+)/.exec(stack)
    LINE_OFFSET = m ? Number(m[1]) - 1 : 2
  } catch {
    LINE_OFFSET = 2
  }
  return LINE_OFFSET
}
calibrate()
function lineOf(stack: string | undefined): number {
  if (!stack) return 0
  const m = /spec\.ts:(\d+)/.exec(stack)
  return m ? Math.max(0, Number(m[1]) - (LINE_OFFSET ?? 2)) : 0
}
const here = () => lineOf(new Error().stack)

// ---------- accessibility: roles and names ----------
const NAME_FROM_CONTENT = new Set(['button', 'link', 'heading', 'cell', 'columnheader', 'rowheader', 'row', 'option', 'menuitem', 'tab', 'checkbox', 'radio', 'switch', 'treeitem', 'tooltip'])
function roleOf(el: Element): string {
  const explicit = el.getAttribute('role')
  if (explicit) return explicit.trim().split(/\s+/)[0]
  const tag = el.tagName.toLowerCase()
  const type = (el.getAttribute('type') ?? 'text').toLowerCase()
  switch (tag) {
    case 'button':
      return 'button'
    case 'a':
      return el.hasAttribute('href') ? 'link' : ''
    case 'input':
      if (['button', 'submit', 'reset', 'image'].includes(type)) return 'button'
      if (type === 'checkbox') return 'checkbox'
      if (type === 'radio') return 'radio'
      if (type === 'search') return 'searchbox'
      if (type === 'number') return 'spinbutton'
      if (type === 'range') return 'slider'
      if (['text', 'email', 'tel', 'url'].includes(type)) return 'textbox'
      return ''
    case 'textarea':
      return 'textbox'
    case 'select':
      return el.hasAttribute('multiple') || Number(el.getAttribute('size') ?? 0) > 1 ? 'listbox' : 'combobox'
    case 'option':
      return 'option'
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return 'heading'
    case 'ul':
    case 'ol':
      return 'list'
    case 'li':
      return 'listitem'
    case 'table':
      return 'table'
    case 'tr':
      return 'row'
    case 'td':
      return 'cell'
    case 'th':
      return 'columnheader'
    case 'img':
      return el.getAttribute('alt') === '' ? 'presentation' : 'img'
    case 'nav':
      return 'navigation'
    case 'main':
      return 'main'
    case 'header':
      return el.closest('main,article,section') ? '' : 'banner'
    case 'footer':
      return 'contentinfo'
    case 'form':
      return accName(el) ? 'form' : ''
    case 'section':
      return accName(el) ? 'region' : ''
    case 'article':
      return 'article'
    case 'dialog':
      return 'dialog'
    case 'fieldset':
      return 'group'
    case 'dl':
      return ''
    default:
      return ''
  }
}
function visibleText(el: Element): string {
  let out = ''
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) out += n.textContent
    else if (n.nodeType === 1) {
      const e = n as Element
      if (e.getAttribute('aria-hidden') === 'true' || e.hasAttribute('hidden')) return
      if (e.tagName === 'IMG') out += e.getAttribute('alt') ?? ''
      else out += ' ' + visibleText(e) + ' '
    }
  })
  return out
}
function labelsOf(el: Element): string {
  const doc = el.ownerDocument
  const parts: string[] = []
  const id = el.getAttribute('id')
  if (id) doc.querySelectorAll(`label[for="${id}"]`).forEach((l) => parts.push(visibleText(l)))
  const wrap = el.closest('label')
  if (wrap && !(id && wrap.getAttribute('for') === id)) parts.push(visibleText(wrap))
  return norm(parts.join(' '))
}
function accName(el: Element): string {
  const doc = el.ownerDocument
  const lb = el.getAttribute('aria-labelledby')
  if (lb) return norm(lb.split(/\s+/).map((id) => (doc.getElementById(id) ? visibleText(doc.getElementById(id)!) : '')).join(' '))
  const al = el.getAttribute('aria-label')
  if (al && al.trim()) return norm(al)
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'select' || tag === 'textarea') {
    const type = (el.getAttribute('type') ?? '').toLowerCase()
    if (['button', 'submit', 'reset'].includes(type)) return norm((el as HTMLInputElement).value || (type === 'submit' ? 'Submit' : type === 'reset' ? 'Reset' : ''))
    if (type === 'image') return norm(el.getAttribute('alt') ?? '')
    const l = labelsOf(el)
    if (l) return l
    return norm(el.getAttribute('title') ?? el.getAttribute('placeholder') ?? '')
  }
  if (tag === 'img') return norm(el.getAttribute('alt') ?? el.getAttribute('title') ?? '')
  if (tag === 'fieldset') {
    const lg = el.querySelector('legend')
    if (lg) return norm(visibleText(lg))
  }
  if (NAME_FROM_CONTENT.has(roleOf(el))) return norm(visibleText(el))
  return norm(el.getAttribute('title') ?? '')
}
function isHidden(el: Element): boolean {
  if (!el.isConnected) return true
  for (let e: Element | null = el; e; e = e.parentElement) {
    if (e.hasAttribute('hidden')) return true
    const st = (e as HTMLElement).style
    if (st && (st.display === 'none' || (e === el && st.visibility === 'hidden'))) return true
    if (['HEAD', 'SCRIPT', 'STYLE', 'TEMPLATE'].includes(e.tagName)) return true
  }
  return el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'hidden'
}
const ariaHidden = (el: Element) => Boolean(el.closest('[aria-hidden="true"]'))
const isDisabled = (el: Element) => Boolean((el as HTMLButtonElement).disabled) || el.getAttribute('aria-disabled') === 'true' || Boolean(el.closest('fieldset[disabled]'))
function textMatches(text: string, want: string | RegExp, exact?: boolean): boolean {
  const t = norm(text)
  if (want instanceof RegExp) return want.test(t)
  if (exact) return t === norm(want)
  return t.toLowerCase().includes(norm(want).toLowerCase())
}
function preview(el: Element): string {
  const attrs = Array.from(el.attributes)
    .filter((a) => !['style'].includes(a.name))
    .slice(0, 4)
    .map((a) => (a.value === '' ? a.name : `${a.name}="${a.value.length > 30 ? a.value.slice(0, 30) + '…' : a.value}"`))
    .join(' ')
  const tag = el.tagName.toLowerCase()
  const text = norm(el.textContent).slice(0, 40)
  return `<${tag}${attrs ? ' ' + attrs : ''}>${text}${norm(el.textContent).length > 40 ? '…' : ''}</${tag}>`
}

// ---------- locators ----------
interface RoleOpts {
  name?: string | RegExp
  exact?: boolean
  checked?: boolean
  disabled?: boolean
  pressed?: boolean
  selected?: boolean
  expanded?: boolean
  level?: number
  includeHidden?: boolean
}
type Part =
  | { t: 'css'; sel: string }
  | { t: 'role'; role: string; o: RoleOpts }
  | { t: 'text' | 'label' | 'placeholder' | 'alt' | 'title'; text: string | RegExp; exact?: boolean }
  | { t: 'testid'; id: string | RegExp }
  | { t: 'nth'; n: number }
  | { t: 'filter'; hasText?: string | RegExp; hasNotText?: string | RegExp; has?: Locator; hasNot?: Locator; visible?: boolean }
  | { t: 'and' | 'or'; other: Locator }

function sortDoc(list: Element[]): Element[] {
  const uniq = Array.from(new Set(list))
  return uniq.sort((a, b) => (a === b ? 0 : a.compareDocumentPosition(b) & 4 ? -1 : 1))
}
function descendants(roots: Element[]): Element[] {
  const out: Element[] = []
  for (const r of roots) out.push(...Array.from(r.querySelectorAll('*')))
  return sortDoc(out)
}

function cssResolve(roots: Element[], selector: string): Element[] {
  const doc = roots[0]?.ownerDocument
  if (!doc) return []
  const chain = selector.split(/\s+>>\s+/)
  let cur = roots
  for (const raw of chain) {
    let sel = raw.trim()
    if (/^nth=-?\d+$/.test(sel)) {
      const n = Number(sel.slice(4))
      cur = n < 0 ? cur.slice(n, n === -1 ? undefined : n + 1) : cur.slice(n, n + 1)
      continue
    }
    if (sel.startsWith('text=')) {
      let t = sel.slice(5)
      const exact = /^".*"$/.test(t)
      if (exact) t = t.slice(1, -1)
      cur = textResolve(cur, t, exact)
      continue
    }
    if (sel.startsWith('xpath=') || sel.startsWith('//') || sel.startsWith('..')) {
      const xp = sel.replace(/^xpath=/, '')
      const found: Element[] = []
      for (const r of cur) {
        try {
          const res = doc.evaluate(xp, r, null, 7, null)
          for (let i = 0; i < res.snapshotLength; i++) found.push(res.snapshotItem(i) as Element)
        } catch {
          throw new Error(`Unexpected token in XPath "${xp}"`)
        }
      }
      cur = sortDoc(found)
      continue
    }
    sel = sel.replace(/^css=/, '')
    let visibleOnly = false
    let hasText: string | null = null
    let textExact: string | null = null
    const ht = /:has-text\((["'])(.*?)\1\)/.exec(sel)
    if (ht) {
      hasText = ht[2]
      sel = sel.replace(ht[0], '')
    }
    const tx = /:text\((["'])(.*?)\1\)/.exec(sel)
    if (tx) {
      textExact = tx[2]
      sel = sel.replace(tx[0], '')
    }
    if (sel.includes(':visible')) {
      visibleOnly = true
      sel = sel.replace(/:visible/g, '')
    }
    if (!sel.trim()) sel = '*'
    const found: Element[] = []
    for (const r of cur) {
      try {
        found.push(...Array.from(r.querySelectorAll(sel)))
      } catch {
        throw new Error(`Unexpected token "${sel}" while parsing css selector "${raw}". Did you mean to CSS.escape it?`)
      }
    }
    cur = sortDoc(found).filter((e) => (!visibleOnly || !isHidden(e)) && (hasText === null || textMatches(e.textContent ?? '', hasText)) && (textExact === null || textMatches(e.textContent ?? '', textExact)))
  }
  return cur
}
function ownText(el: Element) {
  const tag = el.tagName
  if (tag === 'INPUT' && ['button', 'submit', 'reset'].includes((el as HTMLInputElement).type)) return (el as HTMLInputElement).value
  return el.textContent ?? ''
}
function textResolve(roots: Element[], want: string | RegExp, exact?: boolean): Element[] {
  const all = descendants(roots).filter((e) => !['SCRIPT', 'STYLE', 'HEAD', 'TITLE', 'TEMPLATE', 'OPTION'].includes(e.tagName) && !e.closest('head'))
  const hits = new Set(all.filter((e) => textMatches(ownText(e), want, exact)))
  return all.filter((e) => hits.has(e) && !Array.from(e.children).some((c) => hits.has(c)))
}
function labelResolve(roots: Element[], want: string | RegExp, exact?: boolean): Element[] {
  return descendants(roots).filter((e) => {
    if (e.hasAttribute('aria-label') && textMatches(e.getAttribute('aria-label')!, want, exact)) return true
    const lb = e.getAttribute('aria-labelledby')
    if (lb && textMatches(lb.split(/\s+/).map((id) => e.ownerDocument.getElementById(id)?.textContent ?? '').join(' '), want, exact)) return true
    if (!['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(e.tagName)) return false
    const l = labelsOf(e)
    return Boolean(l) && textMatches(l, want, exact)
  })
}

export class Locator {
  s: Session
  parts: Part[]
  desc: string
  constructor(s: Session, parts: Part[], desc: string) {
    this.s = s
    this.parts = parts
    this.desc = desc
  }
  private add(p: Part, d: string) {
    return new Locator(this.s, [...this.parts, p], this.desc ? `${this.desc}.${d}` : d)
  }
  /** Resolve now, inside these roots (defaults to the page). */
  resolve(roots?: Element[]): Element[] {
    let cur = roots ?? this.s.roots()
    if (!cur.length) return []
    for (const p of this.parts) {
      switch (p.t) {
        case 'css':
          cur = cssResolve(cur, p.sel)
          break
        case 'role': {
          const o = p.o
          cur = descendants(cur).filter((e) => {
            if (roleOf(e) !== p.role) return false
            if (!o.includeHidden && (isHidden(e) || ariaHidden(e))) return false
            if (o.name !== undefined && !textMatches(accName(e), o.name, o.exact)) return false
            if (o.level !== undefined && e.tagName !== `H${o.level}` && e.getAttribute('aria-level') !== String(o.level)) return false
            if (o.checked !== undefined && Boolean((e as HTMLInputElement).checked || e.getAttribute('aria-checked') === 'true') !== o.checked) return false
            if (o.pressed !== undefined && (e.getAttribute('aria-pressed') === 'true') !== o.pressed) return false
            if (o.disabled !== undefined && isDisabled(e) !== o.disabled) return false
            if (o.selected !== undefined && Boolean((e as HTMLOptionElement).selected || e.getAttribute('aria-selected') === 'true') !== o.selected) return false
            if (o.expanded !== undefined && (e.getAttribute('aria-expanded') === 'true') !== o.expanded) return false
            return true
          })
          break
        }
        case 'text':
          cur = textResolve(cur, p.text, p.exact)
          break
        case 'label':
          cur = labelResolve(cur, p.text, p.exact)
          break
        case 'placeholder':
          cur = descendants(cur).filter((e) => e.hasAttribute('placeholder') && textMatches(e.getAttribute('placeholder')!, p.text, p.exact))
          break
        case 'alt':
          cur = descendants(cur).filter((e) => e.hasAttribute('alt') && textMatches(e.getAttribute('alt')!, p.text, p.exact))
          break
        case 'title':
          cur = descendants(cur).filter((e) => e.hasAttribute('title') && textMatches(e.getAttribute('title')!, p.text, p.exact))
          break
        case 'testid':
          cur = descendants(cur).filter((e) => {
            const v = e.getAttribute('data-testid')
            return v !== null && (p.id instanceof RegExp ? p.id.test(v) : v === p.id)
          })
          break
        case 'nth':
          cur = p.n === -1 ? cur.slice(-1) : cur.slice(p.n, p.n + 1)
          break
        case 'filter':
          cur = cur.filter((e) => {
            if (p.hasText !== undefined && !textMatches(e.textContent ?? '', p.hasText)) return false
            if (p.hasNotText !== undefined && textMatches(e.textContent ?? '', p.hasNotText)) return false
            if (p.has && p.has.resolve([e]).length === 0) return false
            if (p.hasNot && p.hasNot.resolve([e]).length > 0) return false
            if (p.visible !== undefined && isHidden(e) === p.visible) return false
            return true
          })
          break
        case 'and': {
          const other = new Set(p.other.resolve())
          cur = cur.filter((e) => other.has(e))
          break
        }
        case 'or':
          cur = sortDoc([...cur, ...p.other.resolve()])
          break
      }
    }
    return cur
  }

  // ----- building -----
  locator(sel: string | Locator, o: { hasText?: string | RegExp; has?: Locator } = {}) {
    if (sel instanceof Locator) return new Locator(this.s, [...this.parts, ...sel.parts], `${this.desc}.locator(${sel.desc})`)
    let l = this.add({ t: 'css', sel }, `locator(${q(sel)})`)
    if (o.hasText !== undefined || o.has) l = l.filter(o)
    return l
  }
  getByRole(role: string, o: RoleOpts = {}) {
    const opts = Object.entries(o)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? q(v) : String(v)}`)
    return this.add({ t: 'role', role, o }, `getByRole(${q(role)}${opts.length ? `, { ${opts.join(', ')} }` : ''})`)
  }
  private byText(t: 'text' | 'label' | 'placeholder' | 'alt' | 'title', fn: string, text: string | RegExp, o: { exact?: boolean } = {}) {
    if (text === undefined || text === null) throw this.s.fail(`${fn}: expected a string or a regular expression`)
    return this.add({ t, text, exact: o.exact }, `${fn}(${fmtMatch(text)}${o.exact ? ', { exact: true }' : ''})`)
  }
  getByText(text: string | RegExp, o?: { exact?: boolean }) {
    return this.byText('text', 'getByText', text, o)
  }
  getByLabel(text: string | RegExp, o?: { exact?: boolean }) {
    return this.byText('label', 'getByLabel', text, o)
  }
  getByPlaceholder(text: string | RegExp, o?: { exact?: boolean }) {
    return this.byText('placeholder', 'getByPlaceholder', text, o)
  }
  getByAltText(text: string | RegExp, o?: { exact?: boolean }) {
    return this.byText('alt', 'getByAltText', text, o)
  }
  getByTitle(text: string | RegExp, o?: { exact?: boolean }) {
    return this.byText('title', 'getByTitle', text, o)
  }
  getByTestId(id: string | RegExp) {
    return this.add({ t: 'testid', id }, `getByTestId(${fmtMatch(id)})`)
  }
  first() {
    return this.add({ t: 'nth', n: 0 }, 'first()')
  }
  last() {
    return this.add({ t: 'nth', n: -1 }, 'last()')
  }
  nth(n: number) {
    return this.add({ t: 'nth', n }, `nth(${n})`)
  }
  filter(o: { hasText?: string | RegExp; hasNotText?: string | RegExp; has?: Locator; hasNot?: Locator; visible?: boolean } = {}) {
    const d = Object.entries(o)
      .map(([k, v]) => `${k}: ${v instanceof Locator ? v.desc : typeof v === 'string' ? q(v) : String(v)}`)
      .join(', ')
    return this.add({ t: 'filter', ...o }, `filter({ ${d} })`)
  }
  and(other: Locator) {
    return this.add({ t: 'and', other }, `and(${other.desc})`)
  }
  or(other: Locator) {
    return this.add({ t: 'or', other }, `or(${other.desc})`)
  }

  // ----- reading now (no waiting) -----
  count() {
    return this.s.track(`locator.count`, async () => {
      const n = this.resolve().length
      this.s.note(`${this.desc}.count() → ${n}`)
      return n
    })
  }
  all() {
    return this.s.track(`locator.all`, async () => this.resolve().map((_, i) => this.nth(i)))
  }
  allTextContents() {
    return this.s.track('locator.allTextContents', async () => {
      const v = this.resolve().map((e) => e.textContent ?? '')
      this.s.note(`${this.desc}.allTextContents() → ${JSON.stringify(v.map(norm))}`)
      return v
    })
  }
  allInnerTexts() {
    return this.s.track('locator.allInnerTexts', async () => {
      const v = this.resolve().map((e) => norm(visibleText(e)))
      this.s.note(`${this.desc}.allInnerTexts() → ${JSON.stringify(v)}`)
      return v
    })
  }
  isVisible() {
    return this.s.track('locator.isVisible', async () => {
      const els = this.resolve()
      if (els.length > 1) throw this.s.strict('locator.isVisible', this, els)
      const v = els.length === 1 && !isHidden(els[0])
      this.s.note(`${this.desc}.isVisible() → ${v}`)
      return v
    })
  }
  isHidden() {
    return this.s.track('locator.isHidden', async () => {
      const els = this.resolve()
      if (els.length > 1) throw this.s.strict('locator.isHidden', this, els)
      return els.length === 0 || isHidden(els[0])
    })
  }

  // ----- waiting reads -----
  private read<T>(api: string, fn: (el: Element) => T, show = true) {
    return this.s.track(`locator.${api}`, async () => {
      const el = await this.s.waitOne(`locator.${api}`, this, 'attached')
      await this.s.act(el, 'read')
      const v = fn(el)
      if (show) this.s.note(`${this.desc}.${api}() → ${JSON.stringify(v)}`)
      return v
    })
  }
  textContent() {
    return this.read('textContent', (e) => e.textContent)
  }
  innerText() {
    return this.read('innerText', (e) => norm(visibleText(e)))
  }
  innerHTML() {
    return this.read('innerHTML', (e) => e.innerHTML, false)
  }
  inputValue() {
    return this.read('inputValue', (e) => {
      if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(e.tagName)) throw this.s.fail('locator.inputValue: Error: Node is not an <input>, <textarea> or <select> element')
      return (e as HTMLInputElement).value
    })
  }
  getAttribute(name: string) {
    return this.read('getAttribute', (e) => e.getAttribute(name))
  }
  isEnabled() {
    return this.read('isEnabled', (e) => !isDisabled(e))
  }
  isDisabled() {
    return this.read('isDisabled', (e) => isDisabled(e))
  }
  isChecked() {
    return this.read('isChecked', (e) => {
      if (!['checkbox', 'radio'].includes(roleOf(e))) throw this.s.fail('locator.isChecked: Error: Not a checkbox or radio button')
      return Boolean((e as HTMLInputElement).checked)
    })
  }
  isEditable() {
    return this.read('isEditable', (e) => !isDisabled(e) && !e.hasAttribute('readonly'))
  }
  evaluate(fn: (el: Element, arg?: unknown) => unknown, arg?: unknown) {
    return this.read('evaluate', (e) => this.s.evalIn(fn, [e, arg]), false)
  }
  boundingBox() {
    return this.read('boundingBox', (e) => {
      const r = e.getBoundingClientRect()
      return { x: r.left, y: r.top, width: r.width, height: r.height }
    }, false)
  }
  waitFor(o: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number } = {}) {
    return this.s.track('locator.waitFor', async () => {
      const state = o.state ?? 'visible'
      const line = this.s.curLine
      await this.s.poll(`locator.waitFor`, o.timeout ?? ACTION_TIMEOUT, () => {
        const els = this.resolve()
        if (els.length > 1 && (state === 'visible' || state === 'attached')) throw this.s.strict('locator.waitFor', this, els)
        const el = els[0]
        if (state === 'attached') return Boolean(el)
        if (state === 'detached') return !el
        if (state === 'visible') return Boolean(el) && !isHidden(el)
        return !el || isHidden(el)
      }, [`waiting for ${this.desc} to be ${state}`], line)
      this.s.note(`${this.desc}.waitFor({ state: '${state}' }) ✓`)
    })
  }

  // ----- actions -----
  click(o: { timeout?: number; force?: boolean; clickCount?: number } = {}) {
    return this.s.track('locator.click', async () => {
      const el = await this.s.waitOne('locator.click', this, o.force ? 'attached' : 'enabled', o.timeout)
      await this.s.act(el, 'click')
      this.s.note(`click ${this.desc}`)
      for (let i = 0; i < (o.clickCount ?? 1); i++) this.s.clickEl(el)
      await this.s.settle()
    })
  }
  dblclick() {
    return this.click({ clickCount: 2 })
  }
  hover() {
    return this.s.track('locator.hover', async () => {
      const el = await this.s.waitOne('locator.hover', this, 'visible')
      await this.s.act(el, 'find')
      this.s.note(`hover ${this.desc}`)
    })
  }
  focus() {
    return this.s.track('locator.focus', async () => {
      const el = await this.s.waitOne('locator.focus', this, 'attached')
      ;(el as HTMLElement).focus?.()
    })
  }
  fill(value: string, o: { timeout?: number } = {}) {
    return this.s.track('locator.fill', async () => {
      if (typeof value !== 'string') throw this.s.fail(`locator.fill: value: expected string, got ${typeof value}`)
      const el = await this.s.waitOne('locator.fill', this, 'editable', o.timeout)
      const input = el as HTMLInputElement
      const tag = el.tagName
      const type = (input.type ?? '').toLowerCase()
      if (!(tag === 'TEXTAREA' || (tag === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'image', 'range', 'color'].includes(type)))) {
        throw this.s.fail(tag === 'INPUT' ? `locator.fill: Error: Input of type "${type}" cannot be filled` : 'locator.fill: Error: Element is not an <input>, <textarea> or [contenteditable] element')
      }
      if (type === 'date' && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw this.s.fail(`locator.fill: Error: Malformed value "${value}" for a date input. Use the format yyyy-mm-dd, like '2026-12-20'.`)
      await this.s.act(el, 'type')
      input.focus?.()
      input.value = ''
      if (this.s.opts.hooks?.typed && value.length <= 40) {
        for (const ch of value) {
          input.value += ch
          await this.s.opts.hooks.typed()
        }
      }
      input.value = value
      this.s.fire(el, 'input')
      this.s.fire(el, 'change')
      this.s.note(`fill ${this.desc} with ${JSON.stringify(value)}`)
      await this.s.settle()
    })
  }
  clear() {
    return this.fill('')
  }
  pressSequentially(text: string, _o: { delay?: number } = {}) {
    return this.s.track('locator.pressSequentially', async () => {
      const el = await this.s.waitOne('locator.pressSequentially', this, 'editable')
      await this.s.act(el, 'type')
      ;(el as HTMLElement).focus?.()
      for (const ch of String(text)) {
        this.s.keyOn(el, ch)
        await this.s.opts.hooks?.typed?.()
      }
      this.s.note(`type ${JSON.stringify(text)} into ${this.desc}`)
      await this.s.settle()
    })
  }
  type(text: string) {
    return this.pressSequentially(text)
  }
  press(key: string) {
    return this.s.track('locator.press', async () => {
      const el = await this.s.waitOne('locator.press', this, 'attached')
      await this.s.act(el, 'type')
      ;(el as HTMLElement).focus?.()
      this.s.pressKey(el, key)
      this.s.note(`press "${key}" in ${this.desc}`)
      await this.s.settle()
    })
  }
  check(o: { timeout?: number } = {}) {
    return this.setChecked(true, o, 'check')
  }
  uncheck(o: { timeout?: number } = {}) {
    return this.setChecked(false, o, 'uncheck')
  }
  setChecked(checked: boolean, o: { timeout?: number } = {}, api = 'setChecked') {
    return this.s.track(`locator.${api}`, async () => {
      const el = (await this.s.waitOne(`locator.${api}`, this, 'enabled', o.timeout)) as HTMLInputElement
      if (!['checkbox', 'radio'].includes(roleOf(el))) throw this.s.fail(`locator.${api}: Error: Not a checkbox or radio button`)
      if (el.checked === checked) {
        this.s.note(`${api} ${this.desc} (already ${checked ? 'checked' : 'unchecked'})`)
        return
      }
      if (!checked && roleOf(el) === 'radio') throw this.s.fail(`locator.${api}: Error: Cannot uncheck radio button. Check another radio button in the same group instead.`)
      await this.s.act(el, 'check')
      this.s.clickEl(el)
      if (el.checked !== checked) throw this.s.fail(`locator.${api}: Error: Clicking the checkbox did not change its state`)
      this.s.note(`${api} ${this.desc}`)
      await this.s.settle()
    })
  }
  selectOption(values: string | string[] | { value?: string; label?: string; index?: number } | { value?: string; label?: string; index?: number }[], o: { timeout?: number } = {}) {
    return this.s.track('locator.selectOption', async () => {
      const line = this.s.curLine
      const el = (await this.s.waitOne('locator.selectOption', this, 'enabled', o.timeout)) as HTMLSelectElement
      if (el.tagName !== 'SELECT') throw this.s.fail('locator.selectOption: Error: Element is not a <select> element')
      const wants = Array.isArray(values) ? values : [values]
      const opts = Array.from(el.options)
      const pick = (w: (typeof wants)[number]) =>
        opts.findIndex((op, i) => (typeof w === 'string' ? op.value === w || norm(op.textContent) === norm(w) : (w.value === undefined || op.value === w.value) && (w.label === undefined || norm(op.textContent) === norm(w.label)) && (w.index === undefined || i === w.index)))
      let idx = -1
      await this.s.poll('locator.selectOption', o.timeout ?? ACTION_TIMEOUT, () => (idx = pick(wants[0])) >= 0, [`waiting for ${this.desc}`, `  - did not find some options: ${JSON.stringify(wants[0])}`, `  - available options: ${opts.map((x) => `"${norm(x.textContent)}" (value "${x.value}")`).join(', ')}`], line)
      await this.s.act(el, 'select')
      el.selectedIndex = idx
      this.s.fire(el, 'input')
      this.s.fire(el, 'change')
      this.s.note(`selectOption ${JSON.stringify(wants[0])} in ${this.desc}`)
      await this.s.settle()
      return [el.value]
    })
  }
  scrollIntoViewIfNeeded() {
    return this.s.track('locator.scrollIntoViewIfNeeded', async () => {
      const el = await this.s.waitOne('locator.scrollIntoViewIfNeeded', this, 'visible')
      await this.s.act(el, 'find')
    })
  }
  screenshot(o: { path?: string } = {}) {
    return this.s.track('locator.screenshot', async () => {
      const el = await this.s.waitOne('locator.screenshot', this, 'visible')
      await this.s.act(el, 'shot')
      this.s.note(`📸 screenshot of ${this.desc}${o.path ? ` saved to ${o.path}` : ''}`)
    })
  }
  highlight() {
    return this.s.track('locator.highlight', async () => {
      const el = this.resolve()[0] ?? null
      await this.s.act(el, 'find')
    })
  }
  toString() {
    return this.desc
  }
}

// ---------- tracked promises: so a missing `await` can be reported ----------
class Tracked<T> implements PromiseLike<T> {
  awaited = false
  p: Promise<T>
  desc: string
  line: number
  constructor(p: Promise<T>, desc: string, line: number) {
    this.p = p
    this.desc = desc
    this.line = line
    p.catch(() => {})
  }
  then<A = T, B = never>(a?: ((v: T) => A | PromiseLike<A>) | null, b?: ((e: unknown) => B | PromiseLike<B>) | null): Promise<A | B> {
    this.awaited = true
    return this.p.then(a, b)
  }
  catch<B = never>(b?: ((e: unknown) => B | PromiseLike<B>) | null) {
    this.awaited = true
    return this.p.catch(b)
  }
  finally(f?: (() => void) | null) {
    this.awaited = true
    return this.p.finally(f)
  }
}

// ---------- network objects ----------
function globToRegex(glob: string): RegExp {
  let re = '^'
  let group = false
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += '.*'
        i++
      } else re += '[^/]*'
    } else if (c === '{') {
      group = true
      re += '(?:'
    } else if (c === '}') {
      group = false
      re += ')'
    } else if (c === ',' && group) re += '|'
    else re += c.replace(/[.+?^$()|[\]\\]/g, '\\$&')
  }
  return new RegExp(re + '$')
}
type UrlMatch = string | RegExp | ((u: URL) => boolean)
function urlMatches(m: UrlMatch, url: string): boolean {
  if (typeof m === 'function') {
    try {
      return Boolean(m(new URL(url)))
    } catch {
      return false
    }
  }
  if (m instanceof RegExp) return m.test(url)
  const pat = m.startsWith('/') && !m.startsWith('//') ? SKY_BASE + m : m
  if (!/[*{]/.test(pat)) return url === pat || url.split('?')[0] === pat
  return globToRegex(pat).test(url)
}
function describeMatch(m: UrlMatch) {
  return typeof m === 'function' ? 'predicate' : m instanceof RegExp ? String(m) : `"${m}"`
}

class RequestObj {
  r: NetRequest
  constructor(r: NetRequest) {
    this.r = r
  }
  url() {
    return this.r.url
  }
  method() {
    return this.r.method
  }
  headers() {
    return { ...this.r.headers }
  }
  postData() {
    return this.r.body === undefined ? null : JSON.stringify(this.r.body)
  }
  postDataJSON() {
    return this.r.body ?? null
  }
  resourceType() {
    return 'fetch'
  }
}
const STATUS: Record<number, string> = { 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 409: 'Conflict', 429: 'Too Many Requests', 500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable' }
export class ResponseObj {
  req: RequestObj
  res: NetResponse
  constructor(req: NetRequest, res: NetResponse) {
    this.req = new RequestObj(req)
    this.res = res
  }
  url() {
    return this.req.url()
  }
  status() {
    return this.res.status
  }
  statusText() {
    return STATUS[this.res.status] ?? ''
  }
  ok() {
    return this.res.status >= 200 && this.res.status < 300
  }
  headers() {
    return { 'content-type': 'application/json', ...(this.res.headers ?? {}) }
  }
  request() {
    return this.req
  }
  async json() {
    if (this.res.json !== undefined) return JSON.parse(JSON.stringify(this.res.json))
    try {
      return JSON.parse(this.res.body ?? '')
    } catch {
      throw new Error('response.json: Unexpected token in JSON body')
    }
  }
  async text() {
    return this.res.json !== undefined ? JSON.stringify(this.res.json) : (this.res.body ?? '')
  }
  async body() {
    return this.text()
  }
}

class RouteObj {
  s: Session
  req: NetRequest
  send: () => Promise<NetResponse>
  decided: ((r: NetResponse | null | 'fallback') => void) | null = null
  done = false
  constructor(s: Session, req: NetRequest, send: () => Promise<NetResponse>) {
    this.s = s
    this.req = req
    this.send = send
  }
  request() {
    return new RequestObj(this.req)
  }
  private decide(r: NetResponse | null | 'fallback') {
    if (this.done) throw new Error('route: Route is already handled!')
    this.done = true
    this.decided?.(r)
  }
  async fulfill(o: { status?: number; json?: unknown; body?: string; contentType?: string; headers?: Record<string, string>; response?: ResponseObj } = {}) {
    const base = o.response?.res
    const status = o.status ?? base?.status ?? 200
    const r: NetResponse = o.json !== undefined ? { status, json: JSON.parse(JSON.stringify(o.json)) } : o.body !== undefined ? { status, body: o.body } : base ? { ...base, status } : { status, body: '' }
    this.s.note(`route.fulfill ${this.req.method} ${this.req.url.replace(SKY_BASE, '')} → ${status} (mocked)`, true, 'net')
    this.decide(r)
  }
  async abort(code = 'failed') {
    this.s.note(`route.abort ${this.req.method} ${this.req.url.replace(SKY_BASE, '')} (${code})`, true, 'net')
    this.decide(null)
  }
  async continue(o: { headers?: Record<string, string>; postData?: unknown } = {}) {
    if (o.headers) this.req.headers = { ...o.headers }
    if (o.postData !== undefined) this.req.body = typeof o.postData === 'string' ? JSON.parse(o.postData) : o.postData
    this.decide(await this.send())
  }
  async fallback() {
    this.decide('fallback')
  }
  async fetch() {
    const res = await this.send()
    return new ResponseObj(this.req, res)
  }
}

class DialogObj {
  msg: string
  kind: string
  resolve: (ok: boolean) => void
  handled = false
  s: Session
  constructor(s: Session, msg: string, kind: string, resolve: (ok: boolean) => void) {
    this.s = s
    this.msg = msg
    this.kind = kind
    this.resolve = resolve
  }
  message() {
    return this.msg
  }
  type() {
    return this.kind
  }
  defaultValue() {
    return ''
  }
  async accept() {
    if (this.handled) throw new Error('dialog.accept: Cannot accept dialog which is already handled!')
    this.handled = true
    this.s.note(`dialog.accept() "${this.msg}"`, true, 'cmd')
    await this.s.act(null, 'dialog')
    this.resolve(true)
  }
  async dismiss() {
    if (this.handled) throw new Error('dialog.dismiss: Cannot dismiss dialog which is already handled!')
    this.handled = true
    this.s.note(`dialog.dismiss() "${this.msg}"`, true, 'cmd')
    await this.s.act(null, 'dialog')
    this.resolve(false)
  }
}

class APIRequest {
  s: Session
  constructor(s: Session) {
    this.s = s
  }
  private call(method: string, url: string, o: { data?: unknown; headers?: Record<string, string>; params?: Record<string, string | number> } = {}) {
    return this.s.track(`apiRequestContext.${method.toLowerCase()}`, async () => {
      let full = url.startsWith('/') ? SKY_BASE + url : url
      if (o.params) {
        const u = new URL(full)
        for (const [k, v] of Object.entries(o.params)) u.searchParams.set(k, String(v))
        full = u.toString()
      }
      if (!/^https?:\/\//.test(full)) throw this.s.fail(`apiRequestContext.${method.toLowerCase()}: Invalid URL "${url}"`)
      const headers: Record<string, string> = { accept: 'application/json', ...(o.headers ?? {}) }
      const req: NetRequest = { method, url: full, headers, body: o.data }
      const res = await this.s.backend.handle(req)
      this.s.note(`${method} ${full.replace(SKY_BASE, '')} → ${res.status} ${STATUS[res.status] ?? ''}`, res.status < 400, 'net')
      return new ResponseObj(req, res)
    })
  }
  get(url: string, o?: { headers?: Record<string, string>; params?: Record<string, string | number> }) {
    return this.call('GET', url, o)
  }
  post(url: string, o?: { data?: unknown; headers?: Record<string, string> }) {
    return this.call('POST', url, o)
  }
  put(url: string, o?: { data?: unknown; headers?: Record<string, string> }) {
    return this.call('PUT', url, o)
  }
  patch(url: string, o?: { data?: unknown; headers?: Record<string, string> }) {
    return this.call('PATCH', url, o)
  }
  delete(url: string, o?: { headers?: Record<string, string> }) {
    return this.call('DELETE', url, o)
  }
  fetch(url: string, o: { method?: string; data?: unknown; headers?: Record<string, string> } = {}) {
    return this.call((o.method ?? 'GET').toUpperCase(), url, o)
  }
  async dispose() {}
}

// ---------- the page ----------
class PageObj {
  s: Session
  keyboard: { press: (k: string) => Promise<void>; type: (t: string) => Promise<void>; insertText: (t: string) => Promise<void>; down: (k: string) => Promise<void>; up: (k: string) => Promise<void> }
  constructor(s: Session) {
    this.s = s
    const focused = () => (s.app ? (s.app.doc.activeElement as Element) : null) ?? s.app?.doc.body ?? null
    this.keyboard = {
      press: (k) => s.track('keyboard.press', async () => {
        const el = focused()
        if (el) s.pressKey(el, k)
        s.note(`keyboard.press("${k}")`)
        await s.settle()
      }) as unknown as Promise<void>,
      type: (t) => s.track('keyboard.type', async () => {
        const el = focused()
        if (el) for (const ch of t) s.keyOn(el, ch)
        s.note(`keyboard.type(${JSON.stringify(t)})`)
      }) as unknown as Promise<void>,
      insertText: (t) => s.track('keyboard.insertText', async () => {
        const el = focused() as HTMLInputElement | null
        if (el && 'value' in el) {
          el.value += t
          s.fire(el, 'input')
        }
      }) as unknown as Promise<void>,
      down: async () => {},
      up: async () => {},
    }
  }
  private loc(sel: string) {
    return new Locator(this.s, [{ t: 'css', sel }], `locator(${q(sel)})`)
  }
  locator(sel: string, o: { hasText?: string | RegExp; has?: Locator } = {}) {
    let l = this.loc(sel)
    if (o.hasText !== undefined || o.has) l = l.filter(o)
    return l
  }
  getByRole(role: string, o?: RoleOpts) {
    return new Locator(this.s, [], '').getByRole(role, o)
  }
  getByText(t: string | RegExp, o?: { exact?: boolean }) {
    return new Locator(this.s, [], '').getByText(t, o)
  }
  getByLabel(t: string | RegExp, o?: { exact?: boolean }) {
    return new Locator(this.s, [], '').getByLabel(t, o)
  }
  getByPlaceholder(t: string | RegExp, o?: { exact?: boolean }) {
    return new Locator(this.s, [], '').getByPlaceholder(t, o)
  }
  getByTestId(t: string | RegExp) {
    return new Locator(this.s, [], '').getByTestId(t)
  }
  getByAltText(t: string | RegExp, o?: { exact?: boolean }) {
    return new Locator(this.s, [], '').getByAltText(t, o)
  }
  getByTitle(t: string | RegExp, o?: { exact?: boolean }) {
    return new Locator(this.s, [], '').getByTitle(t, o)
  }
  goto(url: string, _o: { waitUntil?: string; timeout?: number } = {}) {
    return this.s.track('page.goto', async () => {
      if (typeof url !== 'string') throw this.s.fail('page.goto: url: expected string')
      let full: string
      try {
        full = new URL(url, SKY_BASE + '/').toString()
      } catch {
        throw this.s.fail(`page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL "${url}"`)
      }
      if (!full.startsWith(SKY_BASE)) throw this.s.fail(`page.goto: net::ERR_NAME_NOT_RESOLVED at ${full}\nThe practice browser can only open ${SKY_BASE}.`)
      await this.s.act(null, 'nav')
      this.s.navigate(full)
      this.s.note(`goto ${full}`)
      await this.s.settle()
      const notFound = this.s.app!.title.startsWith('Page not found')
      return new ResponseObj({ method: 'GET', url: full, headers: {} }, { status: notFound ? 404 : 200, body: '<html>' })
    })
  }
  reload() {
    return this.s.track('page.reload', async () => {
      if (!this.s.app) return null
      this.s.navigate(this.s.app.url, false)
      this.s.note('reload')
      await this.s.settle()
      return null
    })
  }
  goBack() {
    return this.s.track('page.goBack', async () => {
      if (this.s.hist <= 0) return null
      this.s.hist--
      this.s.navigate(this.s.history[this.s.hist], false)
      this.s.note('goBack')
      await this.s.settle()
      return null
    })
  }
  goForward() {
    return this.s.track('page.goForward', async () => {
      if (this.s.hist >= this.s.history.length - 1) return null
      this.s.hist++
      this.s.navigate(this.s.history[this.s.hist], false)
      this.s.note('goForward')
      await this.s.settle()
      return null
    })
  }
  url() {
    return this.s.app ? this.s.app.url : 'about:blank'
  }
  title() {
    return this.s.track('page.title', async () => {
      const t = this.s.app?.title ?? ''
      this.s.note(`page.title() → ${JSON.stringify(t)}`)
      return t
    })
  }
  content() {
    return this.s.track('page.content', async () => (this.s.app ? this.s.app.doc.documentElement.outerHTML : '<html></html>'))
  }
  // old-style selector API (still common in real projects)
  click(sel: string, o?: { timeout?: number }) {
    return this.loc(sel).click(o)
  }
  dblclick(sel: string) {
    return this.loc(sel).dblclick()
  }
  fill(sel: string, v: string) {
    return this.loc(sel).fill(v)
  }
  type(sel: string, v: string) {
    return this.loc(sel).pressSequentially(v)
  }
  press(sel: string, k: string) {
    return this.loc(sel).press(k)
  }
  check(sel: string) {
    return this.loc(sel).check()
  }
  uncheck(sel: string) {
    return this.loc(sel).uncheck()
  }
  selectOption(sel: string, v: string | string[]) {
    return this.loc(sel).selectOption(v)
  }
  hover(sel: string) {
    return this.loc(sel).hover()
  }
  textContent(sel: string) {
    return this.loc(sel).textContent()
  }
  innerText(sel: string) {
    return this.loc(sel).innerText()
  }
  inputValue(sel: string) {
    return this.loc(sel).inputValue()
  }
  getAttribute(sel: string, n: string) {
    return this.loc(sel).getAttribute(n)
  }
  isVisible(sel: string) {
    return this.loc(sel).isVisible()
  }
  isChecked(sel: string) {
    return this.loc(sel).isChecked()
  }
  waitForSelector(sel: string, o: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number } = {}) {
    return this.loc(sel).waitFor(o)
  }
  $() {
    throw this.s.fail('page.$() returns an ElementHandle, which is discouraged and not supported in this lab. Use page.locator(selector) instead.')
  }
  $$() {
    throw this.s.fail('page.$$() returns ElementHandles, which are discouraged and not supported in this lab. Use page.locator(selector).all() instead.')
  }
  waitForTimeout(ms: number) {
    return this.s.track('page.waitForTimeout', async () => {
      this.s.usedWaitForTimeout = true
      this.s.note(`page.waitForTimeout(${ms}) is a fixed wait. Prefer an auto-waiting assertion like expect(...).toBeVisible().`, true, 'warn')
      await this.s.act(null, 'wait')
      await this.s.sleep(ms)
    })
  }
  waitForLoadState() {
    return this.s.track('page.waitForLoadState', async () => {
      await this.s.settle()
    })
  }
  waitForURL(url: UrlMatch, o: { timeout?: number } = {}) {
    return this.s.track('page.waitForURL', async () => {
      const line = this.s.curLine
      await this.s.act(null, 'wait')
      await this.s.poll('page.waitForURL', o.timeout ?? ACTION_TIMEOUT, () => Boolean(this.s.app) && urlMatches(url, this.s.app!.url), [`waiting for navigation to ${describeMatch(url)}`, `  current url: "${this.url()}"`], line)
      this.s.note(`waitForURL ${describeMatch(url)} ✓`)
    })
  }
  waitForResponse(m: UrlMatch | ((r: ResponseObj) => boolean | Promise<boolean>), o: { timeout?: number } = {}) {
    return this.s.waitEvent('response', 'page.waitForResponse', m, o.timeout)
  }
  waitForRequest(m: UrlMatch | ((r: RequestObj) => boolean), o: { timeout?: number } = {}) {
    return this.s.waitEvent('request', 'page.waitForRequest', m, o.timeout)
  }
  route(m: UrlMatch, handler: (route: RouteObj) => unknown, o: { times?: number } = {}) {
    return this.s.track('page.route', async () => {
      this.s.routes.unshift({ m, handler, times: o.times ?? Infinity })
      this.s.note(`page.route ${describeMatch(m)}`, true, 'net')
    })
  }
  unroute(m: UrlMatch) {
    return this.s.track('page.unroute', async () => {
      this.s.routes = this.s.routes.filter((r) => String(r.m) !== String(m))
    })
  }
  unrouteAll() {
    return this.s.track('page.unrouteAll', async () => {
      this.s.routes = []
    })
  }
  on(ev: string, fn: (x: unknown) => unknown) {
    ;(this.s.listeners[ev] ??= []).push({ fn, once: false })
    return this
  }
  once(ev: string, fn: (x: unknown) => unknown) {
    ;(this.s.listeners[ev] ??= []).push({ fn, once: true })
    return this
  }
  off(ev: string, fn: (x: unknown) => unknown) {
    this.s.listeners[ev] = (this.s.listeners[ev] ?? []).filter((l) => l.fn !== fn)
    return this
  }
  removeListener(ev: string, fn: (x: unknown) => unknown) {
    return this.off(ev, fn)
  }
  evaluate(fn: (arg?: unknown) => unknown, arg?: unknown) {
    return this.s.track('page.evaluate', async () => this.s.evalIn(fn, [arg]))
  }
  screenshot(o: { path?: string; fullPage?: boolean } = {}) {
    return this.s.track('page.screenshot', async () => {
      await this.s.act(null, 'shot')
      this.s.note(`📸 screenshot${o.fullPage ? ' (full page)' : ''}${o.path ? ` saved to ${o.path}` : ''}`)
    })
  }
  pause() {
    return this.s.track('page.pause', async () => {
      this.s.note('page.pause() opens the Playwright Inspector in a real run. Skipped here.', true, 'warn')
    })
  }
  setViewportSize(_v: { width: number; height: number }) {
    return this.s.track('page.setViewportSize', async () => {})
  }
  setDefaultTimeout(_ms: number) {}
  setDefaultNavigationTimeout(_ms: number) {}
  context() {
    return this.s.context
  }
  async close() {}
  isClosed() {
    return false
  }
  async bringToFront() {}
}

// ---------- expect ----------
type MatchVal = string | RegExp
function fmt(v: unknown): string {
  if (typeof v === 'string') return JSON.stringify(v)
  if (v instanceof RegExp) return String(v)
  if (v === undefined) return 'undefined'
  if (typeof v === 'function') return '[Function]'
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}
function deepEqual(a: unknown, b: unknown, strict: boolean): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (a instanceof RegExp || b instanceof RegExp) return String(a) === String(b)
  const ka = Object.keys(a).filter((k) => strict || (a as Record<string, unknown>)[k] !== undefined)
  const kb = Object.keys(b).filter((k) => strict || (b as Record<string, unknown>)[k] !== undefined)
  if (ka.length !== kb.length) return false
  return ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], strict))
}
function matchesObject(a: unknown, b: unknown): boolean {
  if (typeof b !== 'object' || b === null) return Object.is(a, b) || deepEqual(a, b, false)
  if (typeof a !== 'object' || a === null) return false
  if (Array.isArray(b)) return Array.isArray(a) && a.length === b.length && b.every((x, i) => matchesObject(a[i], x))
  return Object.entries(b).every(([k, v]) => matchesObject((a as Record<string, unknown>)[k], v))
}
function getPath(o: unknown, path: string | string[]): { found: boolean; value: unknown } {
  const parts = Array.isArray(path) ? path : path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
  let cur: unknown = o
  for (const p of parts) {
    if (cur === null || cur === undefined || !(p in Object(cur))) return { found: false, value: undefined }
    cur = (cur as Record<string, unknown>)[p]
  }
  return { found: true, value: cur }
}

function makeExpect(s: Session) {
  const build = (actual: unknown, message: string | undefined, soft: boolean, negate: boolean, pollFn?: () => unknown, pollTimeout?: number): Record<string, unknown> => {
    const head = (m: string) => (message ? `${message}\n\n${m}` : m)
    const record = (pass: boolean, text: string, line: number) => {
      if (s.dry) {
        if (!pass) throw new PwError(head(text), line)
        return
      }
      if (pass) {
        s.passed++
        s.note(text, true, 'assert')
        return
      }
      s.failed++
      const err = new PwError(head(text), line)
      s.note(err.message.split('\n')[0] + (err.message.includes('Received') ? '  ' + (/Received[^:]*:\s*(.*)/.exec(err.message)?.[1] ?? '') : ''), false, 'assert')
      if (soft) {
        s.softErrors.push(err)
        return
      }
      throw err
    }
    const not = negate ? '.not' : ''

    if (actual instanceof Locator) {
      const loc = actual
      const run = (name: string, expectedStr: string, check: (els: Element[]) => { pass: boolean; received: string; strictOk?: boolean }, o: { timeout?: number } = {}, argNote = 'expected') => {
        const line = here()
        s.line(line)
        return s.track(`expect.${name}`, async () => {
          const timeout = o.timeout ?? EXPECT_TIMEOUT
          const end = Date.now() + timeout * s.scale
          let last = { pass: false, received: '<element(s) not found>' }
          let firstEl: Element | null = null
          for (;;) {
            s.checkAbort()
            const els = loc.resolve()
            firstEl = els[0] ?? null
            last = check(els)
            if (last.pass !== negate) break
            if (Date.now() >= end) break
            await s.sleep(100)
          }
          const pass = last.pass !== negate
          if (pass) {
            await s.act(firstEl, 'assert')
            record(true, `✓ expect(${loc.desc})${not}.${name}(${expectedStr === '' ? '' : expectedStr})`, line)
          } else {
            const lines = [`Error: expect(locator)${not}.${name}(${argNote}) failed`, '', `Locator:  ${loc.desc}`]
            if (expectedStr !== '') lines.push(`Expected: ${negate ? 'not ' : ''}${expectedStr}`)
            else lines.push(`Expected: ${negate ? 'not ' : ''}${name.replace(/^toBe/, '').replace(/^./, (c) => c.toLowerCase())}`)
            lines.push(`Received: ${last.received}`, `Timeout:  ${timeout}ms`)
            record(false, lines.join('\n'), line)
          }
        })
      }
      const one = (els: Element[], name: string) => {
        if (els.length > 1) throw s.strict(`expect.${name}`, loc, els)
        return els[0]
      }
      const textCheck = (expected: MatchVal | MatchVal[], contains: boolean, o: { ignoreCase?: boolean; useInnerText?: boolean } = {}) => (els: Element[]) => {
        const get = (e: Element) => norm(o.useInnerText ? visibleText(e) : e.textContent)
        const m = (t: string, w: MatchVal) => {
          if (w instanceof RegExp) return w.test(t)
          const a = o.ignoreCase ? t.toLowerCase() : t
          const b = o.ignoreCase ? norm(w).toLowerCase() : norm(w)
          return contains ? a.includes(b) : a === b
        }
        if (Array.isArray(expected)) {
          const texts = els.map(get)
          const pass = contains ? expected.every((w) => texts.some((t) => m(t, w))) : texts.length === expected.length && texts.every((t, i) => m(t, expected[i]))
          return { pass, received: els.length ? JSON.stringify(texts) : '<element(s) not found>' }
        }
        const el = one(els, contains ? 'toContainText' : 'toHaveText')
        if (!el) return { pass: false, received: '<element(s) not found>' }
        return { pass: m(get(el), expected), received: JSON.stringify(get(el)) }
      }
      const stateCheck = (name: string, test: (el: Element) => boolean, recv: (el: Element) => string) => (els: Element[]) => {
        const el = one(els, name)
        if (!el) return { pass: false, received: '<element(s) not found>' }
        return { pass: test(el), received: recv(el) }
      }
      const api: Record<string, unknown> = {
        toBeVisible: (o: { timeout?: number; visible?: boolean } = {}) =>
          run('toBeVisible', '', (els) => {
            const el = one(els, 'toBeVisible')
            if (!el) return { pass: o.visible === false, received: '<element(s) not found>' }
            const vis = !isHidden(el)
            return { pass: o.visible === false ? !vis : vis, received: vis ? 'visible' : 'hidden' }
          }, o),
        toBeHidden: (o: { timeout?: number } = {}) =>
          run('toBeHidden', '', (els) => {
            const el = one(els, 'toBeHidden')
            if (!el) return { pass: true, received: '<element(s) not found>' }
            const hid = isHidden(el)
            return { pass: hid, received: hid ? 'hidden' : 'visible' }
          }, o),
        toBeAttached: (o: { timeout?: number } = {}) => run('toBeAttached', '', (els) => ({ pass: Boolean(one(els, 'toBeAttached')), received: els.length ? 'attached' : 'detached' }), o),
        toBeEnabled: (o: { timeout?: number } = {}) => run('toBeEnabled', '', stateCheck('toBeEnabled', (e) => !isDisabled(e), (e) => (isDisabled(e) ? 'disabled' : 'enabled')), o),
        toBeDisabled: (o: { timeout?: number } = {}) => run('toBeDisabled', '', stateCheck('toBeDisabled', (e) => isDisabled(e), (e) => (isDisabled(e) ? 'disabled' : 'enabled')), o),
        toBeEditable: (o: { timeout?: number } = {}) => run('toBeEditable', '', stateCheck('toBeEditable', (e) => !isDisabled(e) && !e.hasAttribute('readonly'), (e) => (isDisabled(e) || e.hasAttribute('readonly') ? 'readonly' : 'editable')), o),
        toBeChecked: (o: { timeout?: number; checked?: boolean } = {}) => {
          const want = o.checked ?? true
          return run('toBeChecked', want ? '' : '{ checked: false }', stateCheck('toBeChecked', (e) => Boolean((e as HTMLInputElement).checked || e.getAttribute('aria-checked') === 'true') === want, (e) => ((e as HTMLInputElement).checked || e.getAttribute('aria-checked') === 'true' ? 'checked' : 'unchecked')), o)
        },
        toBeFocused: (o: { timeout?: number } = {}) => run('toBeFocused', '', stateCheck('toBeFocused', (e) => e.ownerDocument.activeElement === e, (e) => (e.ownerDocument.activeElement === e ? 'focused' : 'not focused')), o),
        toBeEmpty: (o: { timeout?: number } = {}) =>
          run('toBeEmpty', '', stateCheck('toBeEmpty', (e) => ('value' in e && ['INPUT', 'TEXTAREA'].includes(e.tagName) ? !(e as HTMLInputElement).value : !norm(e.textContent)), (e) => JSON.stringify('value' in e && ['INPUT', 'TEXTAREA'].includes(e.tagName) ? (e as HTMLInputElement).value : norm(e.textContent))), o),
        toHaveText: (expected: MatchVal | MatchVal[], o: { timeout?: number; ignoreCase?: boolean; useInnerText?: boolean } = {}) => run('toHaveText', fmt(expected), textCheck(expected, false, o), o),
        toContainText: (expected: MatchVal | MatchVal[], o: { timeout?: number; ignoreCase?: boolean; useInnerText?: boolean } = {}) => run('toContainText', fmt(expected), textCheck(expected, true, o), o),
        toHaveValue: (expected: MatchVal, o: { timeout?: number } = {}) =>
          run('toHaveValue', fmt(expected), stateCheck('toHaveValue', (e) => { const v = (e as HTMLInputElement).value ?? ''; return expected instanceof RegExp ? expected.test(v) : v === expected }, (e) => JSON.stringify((e as HTMLInputElement).value ?? '')), o),
        toHaveAttribute: (name: string, value?: MatchVal, o: { timeout?: number } = {}) =>
          run('toHaveAttribute', value === undefined ? q(name) : `${q(name)}, ${fmt(value)}`, stateCheck('toHaveAttribute', (e) => { const v = e.getAttribute(name); return value === undefined ? v !== null : v !== null && (value instanceof RegExp ? value.test(v) : v === value) }, (e) => JSON.stringify(e.getAttribute(name))), o),
        toHaveClass: (expected: MatchVal, o: { timeout?: number } = {}) =>
          run('toHaveClass', fmt(expected), stateCheck('toHaveClass', (e) => { const c = e.getAttribute('class') ?? ''; return expected instanceof RegExp ? expected.test(c) : c === expected }, (e) => JSON.stringify(e.getAttribute('class') ?? '')), o),
        toContainClass: (expected: string, o: { timeout?: number } = {}) =>
          run('toContainClass', fmt(expected), stateCheck('toContainClass', (e) => expected.split(/\s+/).every((c) => e.classList.contains(c)), (e) => JSON.stringify(e.getAttribute('class') ?? '')), o),
        toHaveId: (id: string, o: { timeout?: number } = {}) => run('toHaveId', fmt(id), stateCheck('toHaveId', (e) => e.id === id, (e) => JSON.stringify(e.id)), o),
        toHaveAccessibleName: (name: MatchVal, o: { timeout?: number } = {}) => run('toHaveAccessibleName', fmt(name), stateCheck('toHaveAccessibleName', (e) => textMatches(accName(e), name, true), (e) => JSON.stringify(accName(e))), o),
        toHaveRole: (role: string, o: { timeout?: number } = {}) => run('toHaveRole', fmt(role), stateCheck('toHaveRole', (e) => roleOf(e) === role, (e) => JSON.stringify(roleOf(e))), o),
        toHaveCount: (n: number, o: { timeout?: number } = {}) => run('toHaveCount', String(n), (els) => ({ pass: els.length === n, received: String(els.length) }), o),
        toHaveScreenshot: () => {
          throw s.fail('toHaveScreenshot compares pictures pixel by pixel. This practice lab does not do visual comparisons; use text and state assertions instead.')
        },
      }
      return api
    }

    if (actual instanceof PageObj) {
      const page = actual
      const run = (name: string, expected: MatchVal, get: () => string, o: { timeout?: number } = {}) => {
        const line = here()
        s.line(line)
        return s.track(`expect.${name}`, async () => {
          const timeout = o.timeout ?? EXPECT_TIMEOUT
          const end = Date.now() + timeout * s.scale
          const want = name === 'toHaveURL' && typeof expected === 'string' && expected.startsWith('/') ? SKY_BASE + expected : expected
          const m = (v: string) => (want instanceof RegExp ? want.test(v) : name === 'toHaveTitle' ? norm(v) === norm(want) : v === want)
          let v = get()
          while ((m(v) === negate) && Date.now() < end) {
            s.checkAbort()
            await s.sleep(100)
            v = get()
          }
          const pass = m(v) !== negate
          if (pass) {
            await s.act(null, 'assert')
            record(true, `✓ expect(page)${not}.${name}(${fmt(expected)})`, line)
          } else record(false, [`Error: expect(page)${not}.${name}(expected) failed`, '', `Expected: ${negate ? 'not ' : ''}${fmt(want)}`, `Received: ${JSON.stringify(v)}`, `Timeout:  ${timeout}ms`].join('\n'), line)
        })
      }
      return {
        toHaveTitle: (t: MatchVal, o?: { timeout?: number }) => run('toHaveTitle', t, () => s.app?.title ?? '', o),
        toHaveURL: (u: MatchVal, o?: { timeout?: number }) => run('toHaveURL', u, () => page.url(), o),
        toHaveScreenshot: () => {
          throw s.fail('toHaveScreenshot compares pictures pixel by pixel. This practice lab does not do visual comparisons.')
        },
      }
    }

    // plain values (and API responses)
    const sync = (name: string, pass: boolean, expectedStr: string | null, receivedStr: string, extra = '') => {
      const line = here()
      const ok = pass !== negate
      const label = `expect(received)${not}.${name}(${expectedStr === null ? '' : 'expected'})${extra}`
      if (ok) record(true, `✓ ${label.replace('received', fmt(actual).slice(0, 40))}`, line)
      else {
        const lines = [`Error: ${label}`, '']
        if (expectedStr !== null) lines.push(`Expected: ${negate ? 'not ' : ''}${expectedStr}`)
        lines.push(`Received: ${receivedStr}`)
        record(false, lines.join('\n'), line)
      }
    }
    const generic = (val: unknown): Record<string, unknown> => ({
      toBe: (e: unknown) => sync('toBe', Object.is(val, e), fmt(e), fmt(val), ' // Object.is equality'),
      toEqual: (e: unknown) => sync('toEqual', deepEqual(val, e, false), fmt(e), fmt(val), ' // deep equality'),
      toStrictEqual: (e: unknown) => sync('toStrictEqual', deepEqual(val, e, true), fmt(e), fmt(val)),
      toMatchObject: (e: unknown) => sync('toMatchObject', matchesObject(val, e), fmt(e), fmt(val)),
      toContain: (e: unknown) => sync('toContain', typeof val === 'string' ? val.includes(String(e)) : Array.isArray(val) ? val.includes(e) : false, fmt(e), fmt(val)),
      toContainEqual: (e: unknown) => sync('toContainEqual', Array.isArray(val) && val.some((x) => deepEqual(x, e, false)), fmt(e), fmt(val)),
      toHaveLength: (n: number) => sync('toHaveLength', (val as { length?: number })?.length === n, String(n), String((val as { length?: number })?.length)),
      toHaveProperty: (p: string, v?: unknown) => {
        const r = getPath(val, p)
        sync('toHaveProperty', r.found && (v === undefined || deepEqual(r.value, v, false)), v === undefined ? `path ${fmt(p)}` : `${fmt(p)} = ${fmt(v)}`, r.found ? fmt(r.value) : `${fmt(val).slice(0, 80)} (no property ${p})`)
      },
      toBeTruthy: () => sync('toBeTruthy', Boolean(val), null, fmt(val)),
      toBeFalsy: () => sync('toBeFalsy', !val, null, fmt(val)),
      toBeNull: () => sync('toBeNull', val === null, null, fmt(val)),
      toBeUndefined: () => sync('toBeUndefined', val === undefined, null, fmt(val)),
      toBeDefined: () => sync('toBeDefined', val !== undefined, null, fmt(val)),
      toBeNaN: () => sync('toBeNaN', Number.isNaN(val), null, fmt(val)),
      toBeGreaterThan: (n: number) => sync('toBeGreaterThan', (val as number) > n, `> ${n}`, fmt(val)),
      toBeGreaterThanOrEqual: (n: number) => sync('toBeGreaterThanOrEqual', (val as number) >= n, `>= ${n}`, fmt(val)),
      toBeLessThan: (n: number) => sync('toBeLessThan', (val as number) < n, `< ${n}`, fmt(val)),
      toBeLessThanOrEqual: (n: number) => sync('toBeLessThanOrEqual', (val as number) <= n, `<= ${n}`, fmt(val)),
      toBeCloseTo: (n: number, d = 2) => sync('toBeCloseTo', Math.abs((val as number) - n) < Math.pow(10, -d) / 2, fmt(n), fmt(val)),
      toMatch: (r: MatchVal) => sync('toMatch', typeof val === 'string' && (r instanceof RegExp ? r.test(val) : val.includes(r)), fmt(r), fmt(val)),
      toBeInstanceOf: (c: new (...a: unknown[]) => unknown) => sync('toBeInstanceOf', val instanceof c, c?.name ?? '?', fmt(val)),
      toThrow: (m?: MatchVal) => {
        let threw = false
        let msg = ''
        try {
          ;(val as () => void)()
        } catch (e) {
          threw = true
          msg = (e as Error)?.message ?? String(e)
        }
        sync('toThrow', threw && (m === undefined || (m instanceof RegExp ? m.test(msg) : msg.includes(m))), m === undefined ? null : fmt(m), threw ? fmt(msg) : 'function did not throw')
      },
      toBeOK: () => {
        const r = val as ResponseObj
        const okv = r instanceof ResponseObj && r.ok()
        sync('toBeOK', okv, null, r instanceof ResponseObj ? `${r.status()} ${r.statusText()}` : fmt(val))
      },
    })
    if (pollFn) {
      const g = generic(undefined)
      const out: Record<string, unknown> = {}
      for (const k of Object.keys(g)) {
        out[k] = (...args: unknown[]) => {
          const line = here()
          return s.track(`expect.poll.${k}`, async () => {
            const end = Date.now() + (pollTimeout ?? EXPECT_TIMEOUT) * s.scale
            for (;;) {
              s.checkAbort()
              const v = await pollFn()
              const timedOut = Date.now() >= end
              s.dry = true
              let ok = true
              try {
                ;(build(v, message, false, negate)[k] as (...a: unknown[]) => void)(...args)
              } catch {
                ok = false
              } finally {
                s.dry = false
              }
              if (ok || timedOut) {
                try {
                  ;(build(v, message, soft, negate)[k] as (...a: unknown[]) => void)(...args)
                } catch (e) {
                  if (e instanceof PwError) e.line = line
                  throw e
                }
                return
              }
              await s.sleep(100)
            }
          })
        }
      }
      return out
    }
    return generic(actual)
  }

  const withNot = (actual: unknown, message: string | undefined, soft: boolean, pollFn?: () => unknown, pollTimeout?: number) => {
    const o = build(actual, message, soft, false, pollFn, pollTimeout)
    Object.defineProperty(o, 'not', { get: () => build(actual, message, soft, true, pollFn, pollTimeout) })
    return o
  }
  const expectFn = (actual: unknown, message?: string | { message?: string }) => withNot(actual, typeof message === 'string' ? message : message?.message, false)
  expectFn.soft = (actual: unknown, message?: string) => withNot(actual, message, true)
  expectFn.poll = (fn: () => unknown, o: { timeout?: number; message?: string } = {}) => withNot(undefined, o.message, false, fn, o.timeout)
  expectFn.configure = (_o: unknown) => expectFn
  return expectFn
}

// ---------- console.log like Node prints it ----------
function inspect(v: unknown, depth = 0): string {
  if (typeof v === 'string') return depth === 0 ? v : `'${v}'`
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v)
  if (typeof v === 'function') return `[Function: ${v.name || '(anonymous)'}]`
  if (v instanceof RegExp) return String(v)
  if (v instanceof Locator) return `Locator@${v.desc}`
  if (Array.isArray(v)) return v.length ? `[ ${v.map((x) => inspect(x, depth + 1)).join(', ')} ]` : '[]'
  if (v instanceof Error) return v.stack?.split('\n')[0] ?? String(v)
  if (typeof v === 'object') {
    if (depth > 2) return '[Object]'
    const e = Object.entries(v as object)
    return e.length ? `{ ${e.map(([k, x]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${inspect(x, depth + 1)}`).join(', ')} }` : '{}'
  }
  return String(v)
}

// ---------- the session (one per run) ----------
export class Session {
  opts: PwOptions
  scale: number
  backend: SkyBackend
  app: SkyHopApp | null = null
  log: PwLog[] = []
  output: string[] = []
  passed = 0
  failed = 0
  usedWaitForTimeout = false
  history: string[] = []
  hist = -1
  routes: { m: UrlMatch; handler: (r: RouteObj) => unknown; times: number }[] = []
  listeners: Record<string, { fn: (x: unknown) => unknown; once: boolean }[]> = {}
  pending: Tracked<unknown>[] = []
  softErrors: PwError[] = []
  routeErrors: unknown[] = []
  aborted = false
  loggedIn: boolean
  curLine = 0
  dry = false
  context: Record<string, unknown>

  constructor(opts: PwOptions) {
    this.opts = opts
    this.scale = opts.timeScale ?? 1
    this.backend = new SkyBackend(opts.bugs, this.scale)
    this.loggedIn = Boolean(opts.loggedIn)
    this.context = {
      cookies: async () => [],
      clearCookies: async () => {
        this.loggedIn = false
        if (this.app) {
          this.app.state.loggedIn = false
          this.app.state.user = null
        }
      },
      storageState: async () => ({ cookies: [], origins: [] }),
      route: (m: UrlMatch, h: (r: RouteObj) => unknown) => this.track('browserContext.route', async () => void this.routes.unshift({ m, handler: h, times: Infinity })),
      setOffline: async () => {},
    }
  }

  /** A blank page (about:blank) until the test calls page.goto(). */
  blank() {
    this.app?.dispose()
    this.app = null
    const d = this.opts.doc
    d.open()
    d.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>')
    d.close()
    this.history = []
    this.hist = -1
    this.routes = []
    this.listeners = {}
    this.opts.onApp?.(null, 'about:blank', '')
  }

  navigate(url: string, push = true) {
    if (!this.app) {
      const d = this.opts.doc
      d.open()
      d.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>')
      d.close()
      this.app = new SkyHopApp(d, { bugs: this.opts.bugs, timeScale: this.scale, loggedIn: this.loggedIn, backend: this.backend })
      this.app.net = (req, send) => this.network(req, send)
      this.app.dialog = (msg, type) => this.onDialog(msg, type)
      const app = this.app
      app.onChange = () => this.opts.onApp?.(app, app.url, app.title)
    }
    this.app.navigate(url)
    if (push) {
      this.history = this.history.slice(0, this.hist + 1)
      this.history.push(this.app.url)
      this.hist = this.history.length - 1
    }
    this.opts.onApp?.(this.app, this.app.url, this.app.title)
  }

  roots(): Element[] {
    return this.app ? [this.app.doc.documentElement] : []
  }

  line(n: number) {
    if (n) {
      this.curLine = n
      this.opts.hooks?.line?.(n)
    }
  }
  note(text: string, ok = true, kind: PwLog['kind'] = 'cmd') {
    const e = { line: this.curLine, text, ok, kind }
    this.log.push(e)
    this.opts.hooks?.log?.(e)
  }
  fail(message: string): PwError {
    return new PwError(message, this.curLine)
  }
  strict(api: string, loc: Locator, els: Element[]): PwError {
    const list = els.slice(0, 4).map((e, i) => `    ${i + 1}) ${preview(e)}`)
    if (els.length > 4) list.push(`    ...`)
    return this.fail(`${api}: Error: strict mode violation: ${loc.desc} resolved to ${els.length} elements:\n${list.join('\n')}\n\nCall log:\n  - waiting for ${loc.desc}`)
  }
  checkAbort() {
    if (this.aborted) throw new AbortedError('Test ended')
  }
  async sleep(ms: number) {
    await new Promise((r) => setTimeout(r, Math.max(1, ms * this.scale)))
  }
  async settle() {
    await new Promise((r) => setTimeout(r, 0))
  }
  async act(el: Element | null, kind: PwAct) {
    if (this.opts.hooks?.act) await this.opts.hooks.act(el, kind)
  }

  /** Wrap an API call: remember its line, and track the promise to catch a missing await. */
  track<T>(desc: string, fn: () => Promise<T>): Tracked<T> {
    const line = here()
    this.line(line)
    if (this.opts.noBrowser && /^(locator|page|keyboard)\./.test(desc)) {
      const t = new Tracked<T>(Promise.reject(new PwError(`${desc}: there is no browser in this lesson. Only plain code runs here.`, line)), desc, line)
      this.pending.push(t as Tracked<unknown>)
      return t
    }
    const p = (async () => {
      this.checkAbort()
      if (this.routeErrors.length) throw this.routeErrors.shift()
      try {
        return await fn()
      } catch (e) {
        if (e instanceof PwError && !e.line) e.line = line
        throw e
      }
    })()
    const t = new Tracked(p, desc, line)
    this.pending.push(t as Tracked<unknown>)
    return t
  }

  async poll(api: string, timeout: number, cond: () => boolean, callLog: string[], line: number) {
    const end = Date.now() + timeout * this.scale
    for (;;) {
      this.checkAbort()
      if (cond()) return
      if (Date.now() >= end) throw new PwError(`${api}: Timeout ${timeout}ms exceeded.\nCall log:\n${callLog.map((l) => (l.startsWith('  ') ? l : `  - ${l}`)).join('\n')}`, line)
      await this.sleep(100)
    }
  }

  /** Wait until the locator points at exactly one element in the wanted state. */
  async waitOne(api: string, loc: Locator, state: 'attached' | 'visible' | 'enabled' | 'editable', timeout = ACTION_TIMEOUT): Promise<Element> {
    const line = this.curLine
    const end = Date.now() + timeout * this.scale
    let el: Element | undefined
    let why = ''
    for (;;) {
      this.checkAbort()
      const els = loc.resolve()
      if (els.length > 1) throw this.strict(api, loc, els)
      el = els[0]
      if (el) {
        if (state === 'attached') return el
        if (isHidden(el)) why = 'element is not visible'
        else if ((state === 'enabled' || state === 'editable') && isDisabled(el)) why = 'element is not enabled'
        else if (state === 'editable' && el.hasAttribute('readonly')) why = 'element is not editable'
        else return el
      }
      if (Date.now() >= end) {
        const log = [`  - waiting for ${loc.desc}`]
        if (el) log.push(`  - locator resolved to ${preview(el)}`, `  - ${why}`)
        throw new PwError(`${api}: Timeout ${timeout}ms exceeded.\nCall log:\n${log.join('\n')}`, line)
      }
      await this.sleep(100)
    }
  }

  fire(el: Element, type: string) {
    const w = el.ownerDocument.defaultView as unknown as { Event: typeof Event }
    el.dispatchEvent(new w.Event(type, { bubbles: true }))
  }
  clickEl(el: Element) {
    ;(el as HTMLElement).focus?.()
    ;(el as HTMLElement).click()
  }
  private selectAll = false
  keyOn(el: Element, ch: string) {
    const w = el.ownerDocument.defaultView as unknown as { KeyboardEvent: typeof KeyboardEvent }
    el.dispatchEvent(new w.KeyboardEvent('keydown', { key: ch, bubbles: true }))
    const input = el as HTMLInputElement
    if ('value' in input && ['INPUT', 'TEXTAREA'].includes(el.tagName)) {
      input.value = this.selectAll ? ch : input.value + ch
      this.selectAll = false
      this.fire(el, 'input')
    }
    el.dispatchEvent(new w.KeyboardEvent('keyup', { key: ch, bubbles: true }))
  }
  pressKey(el: Element, combo: string) {
    const w = el.ownerDocument.defaultView as unknown as { KeyboardEvent: typeof KeyboardEvent }
    const parts = combo.split('+')
    const key = parts[parts.length - 1]
    const mods = parts.slice(0, -1)
    if (key.length === 1 && mods.length === 0) return this.keyOn(el, key)
    const input = el as HTMLInputElement
    if ((mods.includes('Control') || mods.includes('Meta') || mods.includes('ControlOrMeta')) && key.toLowerCase() === 'a') {
      this.selectAll = true
      return
    }
    el.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true, ctrlKey: mods.includes('Control'), shiftKey: mods.includes('Shift') }))
    if (key === 'Backspace' && 'value' in input) {
      input.value = this.selectAll ? '' : input.value.slice(0, -1)
      this.selectAll = false
      this.fire(el, 'input')
    }
    if (key === 'Enter' && el.tagName === 'INPUT') this.fire(el, 'change')
    el.dispatchEvent(new w.KeyboardEvent('keyup', { key, bubbles: true }))
  }

  /** Run a function inside the page (page.evaluate). Like Playwright, the function is sent as source text. */
  evalIn(fn: unknown, args: unknown[]) {
    if (!this.app) throw this.fail('page.evaluate: the page is blank. Call page.goto() first.')
    const src = typeof fn === 'function' ? fn.toString() : `() => (${String(fn)})`
    const win = this.app.doc.defaultView
    const f = new Function('document', 'window', `return (${src})`)(this.app.doc, win) as (...a: unknown[]) => unknown
    return f(...args)
  }

  emit(ev: string, x: unknown) {
    const ls = this.listeners[ev] ?? []
    this.listeners[ev] = ls.filter((l) => !l.once)
    for (const l of ls) {
      try {
        const r = l.fn(x) as Promise<unknown> | undefined
        if (r && typeof r.then === 'function') r.then(undefined, (e: unknown) => this.routeErrors.push(e))
      } catch (e) {
        this.routeErrors.push(e)
      }
    }
  }

  waitEvent(ev: 'response' | 'request', api: string, m: unknown, timeout = ACTION_TIMEOUT) {
    const line = here()
    let resolve!: (v: unknown) => void
    let reject!: (e: unknown) => void
    const p = new Promise<unknown>((a, b) => {
      resolve = a
      reject = b
    })
    let done = false
    const test = async (x: ResponseObj | RequestObj) => {
      if (done) return
      const url = x.url()
      let ok = false
      if (typeof m === 'function') {
        try {
          ok = Boolean(await (m as (x: unknown) => unknown)(x))
        } catch {
          ok = false
        }
      } else ok = urlMatches(m as UrlMatch, url)
      if (ok) {
        done = true
        resolve(x)
      }
    }
    const l = { fn: (x: unknown) => void test(x as ResponseObj), once: false }
    ;(this.listeners[ev] ??= []).push(l)
    const timer = setTimeout(() => {
      if (done) return
      done = true
      reject(new PwError(`${api}: Timeout ${timeout}ms exceeded while waiting for event "${ev}"\n  waiting for ${ev} ${describeMatch(m as UrlMatch)}`, line))
    }, timeout * this.scale)
    const t = new Tracked(
      p.finally(() => {
        clearTimeout(timer)
        this.listeners[ev] = (this.listeners[ev] ?? []).filter((x) => x !== l)
      }),
      api,
      line,
    )
    this.pending.push(t)
    return t
  }

  /** Every request from the page passes through here: routes first, then the real backend. */
  async network(req: NetRequest, send: () => Promise<NetResponse>): Promise<NetResponse | null> {
    this.emit('request', new RequestObj(req))
    const matching = this.routes.filter((r) => r.times > 0 && urlMatches(r.m, req.url))
    let res: NetResponse | null | 'fallback' = 'fallback'
    for (const r of matching) {
      r.times--
      const route = new RouteObj(this, req, send)
      const decided = new Promise<NetResponse | null | 'fallback'>((a) => (route.decided = a))
      try {
        const out = r.handler(route) as Promise<unknown> | undefined
        if (out && typeof out.then === 'function') out.then(undefined, (e: unknown) => this.routeErrors.push(e))
      } catch (e) {
        this.routeErrors.push(e)
        return null
      }
      res = await decided
      if (res !== 'fallback') break
    }
    if (res === 'fallback') res = await send()
    if (res) this.emit('response', new ResponseObj(req, res))
    if (!res) this.emit('requestfailed', new RequestObj(req))
    this.note(`${req.method} ${req.url.replace(SKY_BASE, '')} → ${res ? res.status : 'failed'}`, !res || res.status < 400, 'net')
    return res
  }

  async onDialog(message: string, type: 'confirm' | 'alert'): Promise<boolean> {
    const ls = this.listeners.dialog ?? []
    if (!ls.length) {
      this.note(`Dialog "${message}" was dismissed automatically. Playwright dismisses dialogs unless you handle them with page.on('dialog', ...).`, true, 'warn')
      await this.act(null, 'dialog')
      return false
    }
    return new Promise<boolean>((resolve) => {
      const d = new DialogObj(this, message, type, resolve)
      this.emit('dialog', d)
      setTimeout(() => {
        if (!d.handled) {
          d.handled = true
          this.note(`The dialog handler never called dialog.accept() or dialog.dismiss(). The page would hang here.`, false, 'warn')
          resolve(false)
        }
      }, 2000 * this.scale)
    })
  }
}

// ---------- compile ----------
export function compileSpec(code: string): { js: string } | { error: { message: string; line: number } } {
  try {
    const js = transform(code, { transforms: ['typescript', 'imports'], disableESTransforms: true }).code
    try {
      new AsyncFunction('require', 'exports', 'module', 'console', 'document', 'window', js)
    } catch (e) {
      return { error: { message: String((e as Error).message), line: lineOf((e as Error).stack) || 0 } }
    }
    return { js }
  } catch (e) {
    const msg = String((e as Error).message)
    const m = /\((\d+):(\d+)\)/.exec(msg)
    return { error: { message: msg.replace(/\s*\(\d+:\d+\)$/, ''), line: m ? Number(m[1]) : 0 } }
  }
}

interface Suite {
  title: string
  parent: Suite | null
  beforeEach: Function[]
  afterEach: Function[]
  beforeAll: Function[]
  afterAll: Function[]
  use: Record<string, unknown>
  skip?: boolean
}
interface TestDef {
  title: string
  suite: Suite
  fn: Function
  line: number
  skip?: boolean
  only?: boolean
  fixme?: boolean
  slow?: boolean
}

/** Parse and run a spec file. Never throws. */
export async function runPlaywright(code: string, opts: PwOptions): Promise<PwResult> {
  calibrate()
  const s = new Session(opts)
  const result = (ok: boolean, tests: PwTest[], compileError?: { message: string; line: number }): PwResult => ({
    ok,
    tests,
    compileError,
    log: s.log,
    output: s.output,
    assertions: { passed: s.passed, failed: s.failed },
    usedWaitForTimeout: s.usedWaitForTimeout,
    app: s.app,
    backend: s.backend,
  })
  const compiled = compileSpec(code)
  if ('error' in compiled) return result(false, [], compiled.error)

  // collect
  const root: Suite = { title: '', parent: null, beforeEach: [], afterEach: [], beforeAll: [], afterAll: [], use: {} }
  let suite = root
  const tests: TestDef[] = []
  let running: { title: string; skip: () => void; slow: () => void } | null = null
  const fnOf = (a: unknown[]) => a.find((x) => typeof x === 'function') as Function | undefined
  const addTest = (title: unknown, rest: unknown[], extra: Partial<TestDef> = {}) => {
    if (typeof title !== 'string') throw new PwError(`test(): the first argument must be the test title, like test('books a flight', async ({ page }) => { ... })`, here())
    const fn = fnOf(rest)
    if (!fn) throw new PwError(`test('${title}'): the test body is missing. Add an async function: async ({ page }) => { ... }`, here())
    tests.push({ title, suite, fn, line: here(), ...extra })
  }
  const test = (title: unknown, ...rest: unknown[]) => addTest(title, rest)
  const describe = (title: unknown, ...rest: unknown[]) => {
    const fn = fnOf(rest) ?? (typeof title === 'function' ? (title as Function) : undefined)
    const parent = suite
    suite = { title: typeof title === 'string' ? title : '', parent, beforeEach: [], afterEach: [], beforeAll: [], afterAll: [], use: {} }
    try {
      fn?.()
    } finally {
      suite = parent
    }
  }
  const describeSkip = (title: unknown, ...rest: unknown[]) => {
    const start = tests.length
    describe(title, ...rest)
    for (let i = start; i < tests.length; i++) tests[i].skip = true
  }
  Object.assign(describe, { serial: describe, parallel: describe, skip: describeSkip, fixme: describeSkip, only: describe, configure: () => {} })
  Object.assign(test, {
    describe,
    beforeEach: (...a: unknown[]) => suite.beforeEach.push(fnOf(a)!),
    afterEach: (...a: unknown[]) => suite.afterEach.push(fnOf(a)!),
    beforeAll: (...a: unknown[]) => suite.beforeAll.push(fnOf(a)!),
    afterAll: (...a: unknown[]) => suite.afterAll.push(fnOf(a)!),
    only: (title: unknown, ...rest: unknown[]) => addTest(title, rest, { only: true }),
    skip: (title?: unknown, ...rest: unknown[]) => {
      if (typeof title === 'string' && fnOf(rest)) return addTest(title, rest, { skip: true })
      if (running) {
        if (title === undefined || title === true || (typeof title === 'boolean' && title)) throw new SkipError('skipped')
        return
      }
    },
    fixme: (title?: unknown, ...rest: unknown[]) => {
      if (typeof title === 'string' && fnOf(rest)) return addTest(title, rest, { skip: true, fixme: true })
      if (running) throw new SkipError('fixme')
    },
    slow: () => running?.slow(),
    setTimeout: () => {},
    use: (o: Record<string, unknown>) => Object.assign(suite.use, o),
    step: async (title: string, fn: () => Promise<unknown>) => {
      s.note(`▸ ${title}`, true, 'step')
      return fn()
    },
    info: () => ({ title: running?.title ?? '', annotations: [], attach: async () => {} }),
    extend: () => test,
    fail: () => {},
  })
  const expect = makeExpect(s)
  const modules: Record<string, unknown> = {
    '@playwright/test': { test, expect, devices: {}, defineConfig: (x: unknown) => x, request: { newContext: async () => new APIRequest(s) } },
  }
  const requireFn = (name: string) => {
    if (name in modules) return modules[name]
    throw new PwError(`Cannot find module '${name}'. In this lab everything lives in one file; only '@playwright/test' can be imported.`, here())
  }
  const consoleShim = {
    log: (...a: unknown[]) => {
      const text = a.map((x) => inspect(x)).join(' ')
      s.output.push(...text.split('\n'))
      s.note(text, true, 'print')
    },
  }
  Object.assign(consoleShim, { info: consoleShim.log, warn: consoleShim.log, error: consoleShim.log, table: consoleShim.log })
  const noDom = (name: string) =>
    new Proxy(
      {},
      {
        get() {
          throw new PwError(`${name} is not defined. Test code runs in Node, outside the page. Use page.locator(...) to reach the page, or page.evaluate(() => ${name}...) to run code inside it.`, here())
        },
      },
    )
  const mod = { exports: {} as Record<string, unknown> }

  const asFail = (name: string, e: unknown, ms: number): PwTest => {
    if (e instanceof PwError) return { name, pass: false, error: e.message, line: e.line, ms }
    if (e instanceof Error) {
      const msg = `${e.name}: ${e.message}`
      return { name, pass: false, error: msg, line: lineOf(e.stack), ms }
    }
    return { name, pass: false, error: String(e), ms }
  }

  s.blank()
  try {
    const f = new AsyncFunction('require', 'exports', 'module', 'console', 'document', 'window', compiled.js + '\n//# sourceURL=spec.ts')
    await f(requireFn, mod.exports, mod, consoleShim, noDom('document'), noDom('window'))
  } catch (e) {
    const r = asFail('spec.ts', e, 0)
    if (e instanceof SyntaxError) return result(false, [], { message: e.message, line: r.line ?? 0 })
    s.note(`Error while loading the file: ${r.error}`, false, 'error')
    return result(false, [r])
  }

  if (opts.noBrowser && tests.length === 0) {
    const unawaited = s.pending.find((p) => !p.awaited)
    if (unawaited) return result(false, [{ name: 'script', pass: false, error: `Missing await: ${unawaited.desc}() on line ${unawaited.line} returns a promise. Put await before it.`, line: unawaited.line, ms: 0 }])
    return result(true, [{ name: 'script', pass: true, ms: 0 }])
  }
  if (tests.length === 0) {
    s.note('Error: No tests found. Write your steps inside test(\'name\', async ({ page }) => { ... }).', false, 'error')
    return result(false, [{ name: 'spec.ts', pass: false, error: "No tests found. Write your steps inside test('name', async ({ page }) => { ... }).", ms: 0 }])
  }

  const only = tests.some((t) => t.only)
  const list = tests.filter((t) => !only || t.only)
  const out: PwTest[] = []
  const chain = (su: Suite): Suite[] => (su.parent ? [...chain(su.parent), su] : [su])
  const ranBeforeAll = new Set<Suite>()
  const request = new APIRequest(s)
  const fullTitle = (t: TestDef) => [...chain(t.suite).map((x) => x.title).filter(Boolean), t.title].join(' › ')

  for (let ti = 0; ti < list.length; ti++) {
    const t = list[ti]
    const name = fullTitle(t)
    if (t.skip) {
      out.push({ name, pass: true, skipped: true, ms: 0 })
      s.note(`-  ${name} (skipped)`, true, 'test')
      continue
    }
    const suites = chain(t.suite)
    const use = Object.assign({}, ...suites.map((x) => x.use)) as Record<string, unknown>
    s.loggedIn = Boolean(opts.loggedIn) || (typeof use.storageState === 'string' && /asha/i.test(use.storageState))
    s.pending = []
    s.softErrors = []
    s.routeErrors = []
    s.aborted = false
    s.blank()
    const page = new PageObj(s)
    const fixtures = { page, request, context: s.context, browserName: 'chromium', baseURL: SKY_BASE, browser: { newPage: async () => page } }
    const start = Date.now()
    s.note(`▶ ${name}`, true, 'test')
    let failure: PwTest | null = null
    let skipped = false
    let slow = 1
    running = { title: t.title, skip: () => {}, slow: () => (slow = 3) }
    const body = async () => {
      for (const su of suites) {
        if (!ranBeforeAll.has(su)) {
          ranBeforeAll.add(su)
          for (const h of su.beforeAll) await h({ request, browserName: 'chromium' })
        }
      }
      for (const su of suites) for (const h of su.beforeEach) await h(fixtures)
      await t.fn(fixtures)
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([
        body(),
        new Promise((_, rej) => {
          timer = setTimeout(() => rej(new PwError(`Test timeout of ${TEST_TIMEOUT * slow}ms exceeded.`, s.curLine)), TEST_TIMEOUT * slow * s.scale)
        }),
      ])
    } catch (e) {
      if (e instanceof SkipError) skipped = true
      else failure = asFail(name, e, Date.now() - start)
    } finally {
      clearTimeout(timer)
    }
    if (!skipped) {
      try {
        for (const su of [...suites].reverse()) for (const h of su.afterEach) await h(fixtures)
      } catch (e) {
        if (!failure) failure = asFail(name, e, Date.now() - start)
      }
    }
    s.aborted = true
    await s.settle()
    const unawaited = s.pending.find((p) => !p.awaited)
    if (unawaited) failure = { name, pass: false, error: `Missing await: ${unawaited.desc}() on line ${unawaited.line} was not awaited, so the test ran on without waiting for it. Put await before it.`, line: unawaited.line, ms: Date.now() - start }
    else if (!failure && s.softErrors.length) failure = { name, pass: false, error: s.softErrors.map((e) => e.message).join('\n\n'), line: s.softErrors[0].line, ms: Date.now() - start }
    else if (!failure && s.routeErrors.length) failure = asFail(name, s.routeErrors[0], Date.now() - start)
    const ms = Date.now() - start
    if (skipped) {
      out.push({ name, pass: true, skipped: true, ms })
      s.note(`-  ${name} (skipped)`, true, 'test')
    } else if (failure) {
      out.push(failure)
      s.note(`✘  ${name}`, false, 'test')
      s.note(failure.error ?? '', false, 'error')
    } else {
      out.push({ name, pass: true, ms })
      s.note(`✓  ${name} (${(ms / 1000).toFixed(1)}s)`, true, 'test')
    }
    const last = ti === list.length - 1
    if (last) {
      for (const su of [...ranBeforeAll].reverse()) for (const h of su.afterAll) await Promise.resolve(h({ request })).catch(() => {})
    }
    if (!last) s.app?.dispose()
  }
  running = null
  return result(out.every((t) => t.pass), out)
}

/** Show the app without running any code (the lab's idle state). */
export function bootSkyPreview(opts: PwOptions & { startUrl?: string }): SkyHopApp {
  const d = opts.doc
  d.open()
  d.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>')
  d.close()
  const app = new SkyHopApp(d, { bugs: opts.bugs, timeScale: 1, loggedIn: opts.loggedIn })
  if (opts.startUrl) app.navigate(opts.startUrl)
  return app
}
