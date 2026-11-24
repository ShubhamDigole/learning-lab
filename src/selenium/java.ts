// A small interpreter for the slice of Java used in Selenium tests: variables, strings, arithmetic,
// if/for/while, try/catch, lists and arrays, lambdas, user classes (page objects) and TestNG-style
// annotated methods. Every method call is awaited, so host objects (the WebDriver) can animate.

// ---------- errors ----------
export class JavaException extends Error {
  type: string
  line: number
  constructor(type: string, message: string, line = 0) {
    super(message)
    this.type = type
    this.line = line
  }
}
export class CompileError extends Error {
  line: number
  constructor(message: string, line: number) {
    super(message)
    this.line = line
  }
}

// ---------- lexer ----------
type Tok = { t: 'id' | 'num' | 'str' | 'char' | 'op' | 'eof'; v: string; line: number; dbl?: boolean }
const OPS = ['>>>=', '<<=', '>>=', '...', '->', '::', '++', '--', '&&', '||', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '(', ')', '{', '}', '[', ']', ';', ',', '.', '=', '<', '>', '+', '-', '*', '/', '%', '!', '?', ':', '@', '&', '|']

function lex(src: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  let line = 1
  while (i < src.length) {
    const c = src[i]
    if (c === '\n') { line++; i++; continue }
    if (/\s/.test(c)) { i++; continue }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue }
    if (c === '/' && src[i + 1] === '*') {
      i += 2
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++ }
      i += 2
      continue
    }
    if (c === '"') {
      let s = ''
      i++
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\n') throw new CompileError('A text value (string) is missing its closing quote "', line)
        if (src[i] === '\\') {
          const n = src[i + 1]
          s += n === 'n' ? '\n' : n === 't' ? '\t' : n === 'u' ? String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16)) : n
          i += n === 'u' ? 6 : 2
        } else s += src[i++]
      }
      if (src[i] !== '"') throw new CompileError('A text value (string) is missing its closing quote "', line)
      i++
      out.push({ t: 'str', v: s, line })
      continue
    }
    if (c === "'") {
      let s = src[i + 1]
      let len = 3
      if (s === '\\') { s = src[i + 2] === 'n' ? '\n' : src[i + 2]; len = 4 }
      out.push({ t: 'char', v: s, line })
      i += len
      continue
    }
    if (/[0-9]/.test(c)) {
      const m = /^\d+(\.\d+)?([eE][+-]?\d+)?[LlDdFf]?/.exec(src.slice(i))!
      const raw = m[0]
      out.push({ t: 'num', v: raw.replace(/[LlDdFf]$/, ''), line, dbl: /[.eEdDfF]/.test(raw) })
      i += raw.length
      continue
    }
    if (/[A-Za-z_$]/.test(c)) {
      const m = /^[A-Za-z_$][\w$]*/.exec(src.slice(i))!
      out.push({ t: 'id', v: m[0], line })
      i += m[0].length
      continue
    }
    const op = OPS.find((o) => src.startsWith(o, i))
    if (!op) throw new CompileError(`Unexpected character "${c}"`, line)
    out.push({ t: 'op', v: op, line })
    i += op.length
  }
  out.push({ t: 'eof', v: '', line })
  return out
}

// ---------- AST ----------
type Expr =
  | { k: 'lit'; v: unknown; line: number }
  | { k: 'name'; n: string; line: number }
  | { k: 'this'; line: number }
  | { k: 'member'; o: Expr; n: string; line: number }
  | { k: 'call'; o: Expr | null; n: string; args: Expr[]; line: number }
  | { k: 'index'; o: Expr; i: Expr; line: number }
  | { k: 'new'; cls: string; args: Expr[]; line: number }
  | { k: 'newArray'; size: Expr | null; init: Expr[] | null; line: number }
  | { k: 'arrayLit'; items: Expr[]; line: number }
  | { k: 'unary'; op: string; e: Expr; line: number }
  | { k: 'update'; op: '++' | '--'; prefix: boolean; e: Expr; line: number }
  | { k: 'bin'; op: string; a: Expr; b: Expr; line: number }
  | { k: 'assign'; op: string; target: Expr; e: Expr; line: number }
  | { k: 'cond'; c: Expr; a: Expr; b: Expr; line: number }
  | { k: 'lambda'; params: string[]; body: Expr | Stmt[]; line: number }
  | { k: 'cast'; type: string; e: Expr; line: number }

type Stmt =
  | { k: 'var'; type: string; name: string; init: Expr | null; line: number }
  | { k: 'expr'; e: Expr; line: number }
  | { k: 'if'; c: Expr; a: Stmt; b: Stmt | null; line: number }
  | { k: 'for'; init: Stmt[]; c: Expr | null; upd: Expr[]; body: Stmt; line: number }
  | { k: 'foreach'; name: string; e: Expr; body: Stmt; line: number }
  | { k: 'while'; c: Expr; body: Stmt; line: number }
  | { k: 'block'; body: Stmt[]; line: number }
  | { k: 'return'; e: Expr | null; line: number }
  | { k: 'break'; line: number }
  | { k: 'continue'; line: number }
  | { k: 'throw'; e: Expr; line: number }
  | { k: 'try'; body: Stmt[]; catches: { types: string[]; name: string; body: Stmt[] }[]; fin: Stmt[] | null; line: number }

export interface Annotation {
  name: string
  args: Record<string, unknown>
}
export interface MethodDecl {
  name: string
  params: string[]
  body: Stmt[]
  annotations: Annotation[]
  line: number
  isCtor?: boolean
}
interface ClassDecl {
  name: string
  fields: Stmt[]
  methods: MethodDecl[]
  ctor: MethodDecl | null
}
export interface Program {
  classes: Map<string, ClassDecl>
  methods: MethodDecl[]
  statements: Stmt[]
}

const MODIFIERS = new Set(['public', 'private', 'protected', 'static', 'final', 'abstract', 'synchronized'])
const PRIMS = new Set(['int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'void', 'var'])

// ---------- parser ----------
class Parser {
  p = 0
  toks: Tok[]
  constructor(toks: Tok[]) {
    this.toks = toks
  }
  get cur() { return this.toks[this.p] }
  atEnd() { return this.toks[this.p].t === 'eof' }
  peek(n = 1) { return this.toks[Math.min(this.p + n, this.toks.length - 1)] }
  is(v: string) { return this.cur.v === v && (this.cur.t === 'op' || this.cur.t === 'id') }
  eat(v: string) {
    if (!this.is(v)) {
      const got = this.cur.t === 'eof' ? 'the end of the code' : `"${this.cur.v}"`
      throw new CompileError(v === ';' ? `Missing ; at the end of a line (found ${got})` : `Expected "${v}" but found ${got}`, v === ';' ? this.toks[this.p - 1]?.line ?? this.cur.line : this.cur.line)
    }
    return this.toks[this.p++]
  }
  ident() {
    if (this.cur.t !== 'id') throw new CompileError(`Expected a name but found "${this.cur.v || 'the end of the code'}"`, this.cur.line)
    return this.toks[this.p++].v
  }

  program(): Program {
    const prog: Program = { classes: new Map(), methods: [], statements: [] }
    this.members(prog, null)
    return prog
  }

  annotations(): Annotation[] {
    const out: Annotation[] = []
    while (this.is('@')) {
      this.p++
      const name = this.ident()
      const args: Record<string, unknown> = {}
      if (this.is('(')) {
        this.p++
        while (!this.is(')')) {
          if (this.cur.t === 'id' && this.peek().v === '=') {
            const k = this.ident()
            this.p++
            args[k] = this.annotationValue()
          } else args.value = this.annotationValue()
          if (this.is(',')) this.p++
        }
        this.eat(')')
      }
      out.push({ name, args })
    }
    return out
  }
  annotationValue(): unknown {
    const t = this.toks[this.p++]
    if (t.t === 'str') return t.v
    if (t.t === 'num') return Number(t.v)
    if (t.v === 'true' || t.v === 'false') return t.v === 'true'
    if (t.v === '{') {
      const arr: unknown[] = []
      while (!this.is('}')) { arr.push(this.annotationValue()); if (this.is(',')) this.p++ }
      this.p++
      return arr
    }
    return t.v
  }

  /** Top level, or inside a class body when `cls` is given. */
  members(prog: Program, cls: ClassDecl | null) {
    while (this.cur.t !== 'eof' && !(cls && this.is('}'))) {
      if (this.is('import') || this.is('package')) {
        while (!this.is(';') && !this.atEnd()) this.p++
        this.eat(';')
        continue
      }
      if (this.is(';')) { this.p++; continue }
      const start = this.p
      const anns = this.annotations()
      while (this.cur.t === 'id' && MODIFIERS.has(this.cur.v)) this.p++
      if (this.is('class')) {
        this.p++
        const name = this.ident()
        while (!this.is('{')) this.p++ // extends / implements
        this.eat('{')
        const decl: ClassDecl = { name, fields: [], methods: [], ctor: null }
        this.members(prog, decl)
        this.eat('}')
        // A class holding @Test methods is the test class itself: flatten it to the top level.
        if (!cls && decl.methods.some((m) => m.annotations.some((a) => a.name === 'Test' || a.name === 'BeforeMethod'))) {
          prog.statements.push(...decl.fields)
          prog.methods.push(...decl.methods)
          if (decl.ctor) prog.statements.push(...decl.ctor.body)
        } else prog.classes.set(name, decl)
        continue
      }
      // constructor:  Name(params) {
      if (cls && this.cur.v === cls.name && this.peek().v === '(') {
        const line = this.cur.line
        this.p++
        const params = this.params()
        this.skipThrows()
        cls.ctor = { name: cls.name, params, body: this.block(), annotations: anns, line, isCtor: true }
        continue
      }
      // method:  Type name(params) {
      const save = this.p
      if (this.tryType() && this.cur.t === 'id' && this.peek().v === '(') {
        const line = this.cur.line
        const name = this.ident()
        const params = this.params()
        this.skipThrows()
        const m: MethodDecl = { name, params, body: this.block(), annotations: anns, line }
        if (cls) cls.methods.push(m)
        else prog.methods.push(m)
        continue
      }
      this.p = save
      if (cls) {
        const s = this.statement()
        if (s.k !== 'var') throw new CompileError('Only fields, a constructor and methods can go directly inside a class', s.line)
        cls.fields.push(s)
        continue
      }
      this.p = anns.length || this.p !== start ? save : start
      prog.statements.push(this.statement())
    }
  }

  skipThrows() {
    if (this.is('throws')) {
      this.p++
      this.ident()
      while (this.is(',')) { this.p++; this.ident() }
    }
  }

  params(): string[] {
    this.eat('(')
    const out: string[] = []
    while (!this.is(')')) {
      while (this.is('final')) this.p++
      if (!this.tryType()) throw new CompileError('Expected a parameter type', this.cur.line)
      out.push(this.ident())
      if (this.is(',')) this.p++
    }
    this.eat(')')
    return out
  }

  /** Reads a type such as int, String, List<WebElement>, String[], Map<String, Integer>. */
  tryType(): string | null {
    if (this.cur.t !== 'id') return null
    if (!PRIMS.has(this.cur.v) && !/^[A-Z]/.test(this.cur.v)) return null
    let name = this.ident()
    while (this.is('.') && this.peek().t === 'id' && /^[A-Z]/.test(this.peek().v)) { this.p++; name = this.ident() }
    if (this.is('<')) {
      let depth = 0
      do {
        if (this.is('<')) depth++
        else if (this.is('>')) depth--
        else if (this.cur.v === '>>') depth -= 2
        else if (!(this.cur.t === 'id' || this.is(',') || this.is('?') || this.is('.') || this.is('[') || this.is(']'))) return null
        this.p++
      } while (depth > 0 && !this.atEnd())
    }
    while (this.is('[') && this.peek().v === ']') { this.p += 2; name += '[]' }
    if (this.is('...')) { this.p++; name += '[]' }
    return name
  }

  block(): Stmt[] {
    this.eat('{')
    const out: Stmt[] = []
    while (!this.is('}')) {
      if (this.cur.t === 'eof') throw new CompileError('A { has no matching }', this.cur.line)
      out.push(this.statement())
    }
    this.eat('}')
    return out
  }

  statement(): Stmt {
    const line = this.cur.line
    if (this.is('{')) return { k: 'block', body: this.block(), line }
    if (this.is(';')) { this.p++; return { k: 'block', body: [], line } }
    if (this.is('if')) {
      this.p++
      this.eat('(')
      const c = this.expr()
      this.eat(')')
      const a = this.statement()
      let b: Stmt | null = null
      if (this.is('else')) { this.p++; b = this.statement() }
      return { k: 'if', c, a, b, line }
    }
    if (this.is('while')) {
      this.p++
      this.eat('(')
      const c = this.expr()
      this.eat(')')
      return { k: 'while', c, body: this.statement(), line }
    }
    if (this.is('for')) {
      this.p++
      this.eat('(')
      const save = this.p
      while (this.is('final')) this.p++
      if (this.tryType() && this.cur.t === 'id' && this.peek().v === ':') {
        const name = this.ident()
        this.eat(':')
        const e = this.expr()
        this.eat(')')
        return { k: 'foreach', name, e, body: this.statement(), line }
      }
      this.p = save
      const init: Stmt[] = []
      if (!this.is(';')) init.push(this.simple())
      while (this.is(',')) { this.p++; init.push(this.simple()) }
      this.eat(';')
      const c = this.is(';') ? null : this.expr()
      this.eat(';')
      const upd: Expr[] = []
      while (!this.is(')')) { upd.push(this.expr()); if (this.is(',')) this.p++ }
      this.eat(')')
      return { k: 'for', init, c, upd, body: this.statement(), line }
    }
    if (this.is('return')) {
      this.p++
      const e = this.is(';') ? null : this.expr()
      this.eat(';')
      return { k: 'return', e, line }
    }
    if (this.is('break')) { this.p++; this.eat(';'); return { k: 'break', line } }
    if (this.is('continue')) { this.p++; this.eat(';'); return { k: 'continue', line } }
    if (this.is('throw')) {
      this.p++
      const e = this.expr()
      this.eat(';')
      return { k: 'throw', e, line }
    }
    if (this.is('try')) {
      this.p++
      const body = this.block()
      const catches: { types: string[]; name: string; body: Stmt[] }[] = []
      while (this.is('catch')) {
        this.p++
        this.eat('(')
        while (this.is('final')) this.p++
        const types = [this.ident()]
        while (this.is('|')) { this.p++; types.push(this.ident()) }
        const name = this.ident()
        this.eat(')')
        catches.push({ types, name, body: this.block() })
      }
      let fin: Stmt[] | null = null
      if (this.is('finally')) { this.p++; fin = this.block() }
      return { k: 'try', body, catches, fin, line }
    }
    const s = this.simple()
    this.eat(';')
    return s
  }

  /** A declaration or an expression, without the trailing semicolon. */
  simple(): Stmt {
    const line = this.cur.line
    const save = this.p
    while (this.is('final')) this.p++
    const type = this.tryType()
    if (type && this.cur.t === 'id' && (this.peek().v === '=' || this.peek().v === ';' || this.peek().v === ',' || this.peek().v === ':')) {
      const name = this.ident()
      let init: Expr | null = null
      if (this.is('=')) {
        this.p++
        init = this.is('{') ? this.arrayLiteral() : this.expr()
      }
      return { k: 'var', type, name, init, line }
    }
    this.p = save
    // "string name = ..." : a type written in lowercase
    if (this.cur.t === 'id' && this.peek().t === 'id' && ['=', ';'].includes(this.peek(2).v) && /^[a-z]/.test(this.cur.v)) {
      const t = this.cur.v
      throw new CompileError(`cannot find symbol: class ${t}. Java types start with a capital letter: did you mean ${t[0].toUpperCase() + t.slice(1)}?`, line)
    }
    return { k: 'expr', e: this.expr(), line }
  }

  arrayLiteral(): Expr {
    const line = this.cur.line
    this.eat('{')
    const items: Expr[] = []
    while (!this.is('}')) {
      items.push(this.is('{') ? this.arrayLiteral() : this.expr())
      if (this.is(',')) this.p++
    }
    this.eat('}')
    return { k: 'arrayLit', items, line }
  }

  expr(): Expr {
    return this.assign()
  }
  assign(): Expr {
    const left = this.ternary()
    if (['=', '+=', '-=', '*=', '/=', '%='].includes(this.cur.v) && this.cur.t === 'op') {
      const line = this.cur.line
      const op = this.toks[this.p++].v
      if (!['name', 'member', 'index'].includes(left.k)) throw new CompileError('You can only assign to a variable', line)
      return { k: 'assign', op, target: left, e: this.assign(), line }
    }
    return left
  }
  ternary(): Expr {
    const c = this.binary(0)
    if (this.is('?')) {
      const line = this.cur.line
      this.p++
      const a = this.expr()
      this.eat(':')
      return { k: 'cond', c, a, b: this.expr(), line }
    }
    return c
  }
  static PREC: string[][] = [['||'], ['&&'], ['==', '!='], ['<', '>', '<=', '>=', 'instanceof'], ['+', '-'], ['*', '/', '%']]
  binary(level: number): Expr {
    if (level >= Parser.PREC.length) return this.unary()
    let a = this.binary(level + 1)
    while (Parser.PREC[level].includes(this.cur.v) && (this.cur.t === 'op' || this.cur.v === 'instanceof')) {
      const line = this.cur.line
      const op = this.toks[this.p++].v
      if (op === 'instanceof') {
        const type = this.tryType() ?? this.ident()
        a = { k: 'bin', op, a, b: { k: 'lit', v: type, line }, line }
        continue
      }
      a = { k: 'bin', op, a, b: this.binary(level + 1), line }
    }
    return a
  }
  unary(): Expr {
    const line = this.cur.line
    if (this.cur.t === 'op' && (this.is('!') || this.is('-') || this.is('+'))) {
      const op = this.toks[this.p++].v
      return { k: 'unary', op, e: this.unary(), line }
    }
    if (this.cur.t === 'op' && (this.is('++') || this.is('--'))) {
      const op = this.toks[this.p++].v as '++' | '--'
      return { k: 'update', op, prefix: true, e: this.unary(), line }
    }
    // cast:  (String) x   or  (int) y
    if (this.is('(') && this.peek().t === 'id' && (PRIMS.has(this.peek().v) || /^[A-Z]/.test(this.peek().v)) && this.peek(2).v === ')' && (this.peek(3).t !== 'op' || this.peek(3).v === '(')) {
      this.p++
      const type = this.ident()
      this.eat(')')
      return { k: 'cast', type, e: this.unary(), line }
    }
    return this.postfix()
  }
  postfix(): Expr {
    let e = this.primary()
    for (;;) {
      const line = this.cur.line
      if (this.is('.')) {
        this.p++
        if (this.is('<')) { while (!this.is('>')) this.p++; this.p++ } // explicit generic call: obj.<T>method()
        const n = this.ident()
        if (this.is('(')) e = { k: 'call', o: e, n, args: this.args(), line }
        else e = { k: 'member', o: e, n, line }
      } else if (this.is('[')) {
        this.p++
        const i = this.expr()
        this.eat(']')
        e = { k: 'index', o: e, i, line }
      } else if (this.cur.t === 'op' && (this.is('++') || this.is('--'))) {
        const op = this.toks[this.p++].v as '++' | '--'
        e = { k: 'update', op, prefix: false, e, line }
      } else if (this.is('::')) {
        this.p++
        const n = this.ident()
        const target = e
        e = { k: 'lambda', params: ['__x'], body: { k: 'call', o: target, n, args: [{ k: 'name', n: '__x', line }], line }, line }
      } else return e
    }
  }
  args(): Expr[] {
    this.eat('(')
    const out: Expr[] = []
    while (!this.is(')')) {
      out.push(this.expr())
      if (this.is(',')) this.p++
      else if (!this.is(')')) throw new CompileError(`Expected , or ) but found "${this.cur.v}"`, this.cur.line)
    }
    this.eat(')')
    return out
  }
  primary(): Expr {
    const t = this.cur
    const line = t.line
    if (t.t === 'num') { this.p++; return { k: 'lit', v: t.dbl ? new JDouble(Number(t.v)) : Number(t.v), line } }
    if (t.t === 'str') { this.p++; return { k: 'lit', v: t.v, line } }
    if (t.t === 'char') { this.p++; return { k: 'lit', v: t.v, line } }
    if (t.t === 'id') {
      if (t.v === 'true' || t.v === 'false') { this.p++; return { k: 'lit', v: t.v === 'true', line } }
      if (t.v === 'null') { this.p++; return { k: 'lit', v: null, line } }
      if (t.v === 'this') { this.p++; return { k: 'this', line } }
      if (t.v === 'new') {
        this.p++
        const cls = this.ident()
        let name = cls
        while (this.is('.')) { this.p++; name = this.ident() }
        if (this.is('<')) { let d = 0; do { if (this.is('<')) d++; else if (this.is('>')) d--; this.p++ } while (d > 0) }
        if (this.is('[')) {
          let size: Expr | null = null
          this.p++
          if (!this.is(']')) size = this.expr()
          this.eat(']')
          while (this.is('[')) { this.p++; if (!this.is(']')) this.expr(); this.eat(']') }
          const init = this.is('{') ? (this.arrayLiteral() as { items: Expr[] }).items : null
          return { k: 'newArray', size, init, line }
        }
        const args = this.args()
        if (this.is('{')) throw new CompileError('Anonymous classes are not supported here. Use a lambda instead', line)
        return { k: 'new', cls: name, args, line }
      }
      // lambda:  x -> ...
      if (this.peek().v === '->') {
        const param = this.ident()
        this.p++
        return { k: 'lambda', params: [param], body: this.is('{') ? this.block() : this.expr(), line }
      }
      this.p++
      if (this.is('(')) return { k: 'call', o: null, n: t.v, args: this.args(), line }
      return { k: 'name', n: t.v, line }
    }
    if (this.is('(')) {
      // (a, b) -> ...   or  () -> ...
      const save = this.p
      this.p++
      const names: string[] = []
      while (this.cur.t === 'id' && (this.peek().v === ',' || this.peek().v === ')')) { names.push(this.ident()); if (this.is(',')) this.p++ }
      if (this.is(')') && this.peek().v === '->') {
        this.p += 2
        return { k: 'lambda', params: names, body: this.is('{') ? this.block() : this.expr(), line }
      }
      this.p = save + 1
      const e = this.expr()
      this.eat(')')
      return e
    }
    throw new CompileError(t.t === 'eof' ? 'The code ends too early. Is a ) or } missing?' : `Unexpected "${t.v}"`, line)
  }
}

export function parseJava(src: string): Program {
  return new Parser(lex(src)).program()
}

// ---------- runtime values ----------
/** A number written with a decimal point, so it prints and divides like a Java double. */
export class JDouble {
  v: number
  constructor(v: number) {
    this.v = v
  }
}
const num = (x: unknown) => (x instanceof JDouble ? x.v : (x as number))
const isNum = (x: unknown) => typeof x === 'number' || x instanceof JDouble

export class JObject {
  cls: ClassDecl
  fields = new Map<string, unknown>()
  constructor(cls: ClassDecl) {
    this.cls = cls
  }
}

export class JLambda {
  params: string[]
  body: Expr | Stmt[]
  scope: Scope
  self: JObject | null
  interp: Interpreter
  constructor(params: string[], body: Expr | Stmt[], scope: Scope, self: JObject | null, interp: Interpreter) {
    this.params = params
    this.body = body
    this.scope = scope
    this.self = self
    this.interp = interp
  }
  call(...args: unknown[]) {
    return this.interp.callLambda(this, args)
  }
}

/** The Java way to print a value. */
export function javaString(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (v instanceof JDouble) return Number.isInteger(v.v) ? v.v.toFixed(1) : String(v.v)
  if (Array.isArray(v)) return '[' + v.map(javaString).join(', ') + ']'
  if (typeof v === 'object' && typeof (v as { toString?: unknown }).toString === 'function' && (v as object).toString !== Object.prototype.toString) return String(v)
  if (v instanceof JObject) return `${v.cls.name}@1b6d3586`
  return String(v)
}

class Scope {
  vars = new Map<string, unknown>()
  parent: Scope | null
  constructor(parent: Scope | null) {
    this.parent = parent
  }
  find(n: string): Scope | null {
    let s: Scope | null = this
    while (s) {
      if (s.vars.has(n)) return s
      s = s.parent
    }
    return null
  }
}

class ReturnSignal { v: unknown; constructor(v: unknown) { this.v = v } }
class BreakSignal {}
class ContinueSignal {}

export interface Host {
  /** global names: By, Keys, Assert, System, driver ... */
  globals: Record<string, unknown>
  /** constructors for `new X(...)` */
  constructors: Record<string, (...args: unknown[]) => unknown>
  /** called before each statement (for highlighting and loop guards) */
  onLine?: (line: number) => void
}

const STEP_LIMIT = 50000

export class Interpreter {
  prog: Program
  host: Host
  global = new Scope(null)
  steps = 0
  line = 0
  constructor(prog: Program, host: Host) {
    this.prog = prog
    this.host = host
    for (const [k, v] of Object.entries(host.globals)) this.global.vars.set(k, v)
  }

  fail(type: string, message: string): never {
    throw new JavaException(type, message, this.line)
  }

  async runTopLevel() {
    for (const s of this.prog.statements) await this.exec(s, this.global, null)
  }

  async callMethod(m: MethodDecl, args: unknown[], self: JObject | null) {
    const scope = new Scope(this.global)
    m.params.forEach((p, i) => scope.vars.set(p, args[i]))
    try {
      for (const s of m.body) await this.exec(s, scope, self)
    } catch (e) {
      if (e instanceof ReturnSignal) return e.v
      throw e
    }
    return undefined
  }

  async callLambda(l: JLambda, args: unknown[]) {
    const scope = new Scope(l.scope)
    l.params.forEach((p, i) => scope.vars.set(p, args[i]))
    if (Array.isArray(l.body)) {
      try {
        for (const s of l.body) await this.exec(s, scope, l.self)
      } catch (e) {
        if (e instanceof ReturnSignal) return e.v
        throw e
      }
      return undefined
    }
    return this.eval(l.body, scope, l.self)
  }

  async execBlock(body: Stmt[], scope: Scope, self: JObject | null) {
    const inner = new Scope(scope)
    for (const s of body) await this.exec(s, inner, self)
  }

  async exec(s: Stmt, scope: Scope, self: JObject | null): Promise<void> {
    this.line = s.line
    if (++this.steps > STEP_LIMIT) this.fail('TimeoutException', 'The script ran too many steps. Is there a loop that never ends?')
    this.host.onLine?.(s.line)
    switch (s.k) {
      case 'var': {
        if (scope.vars.has(s.name) && scope !== this.global) this.fail('CompileError', `variable ${s.name} is already defined`)
        let v = s.init ? await this.eval(s.init, scope, self) : defaultFor(s.type)
        if (['double', 'float'].includes(s.type) && typeof v === 'number') v = new JDouble(v)
        if (['int', 'long', 'short', 'byte'].includes(s.type) && v instanceof JDouble) this.fail('CompileError', `incompatible types: possible lossy conversion from double to ${s.type}`)
        if (s.type === 'String' && v !== null && typeof v !== 'string') this.fail('CompileError', `incompatible types: ${typeName(v)} cannot be converted to String`)
        if (s.type === 'int' && typeof v === 'string') this.fail('CompileError', 'incompatible types: String cannot be converted to int')
        scope.vars.set(s.name, v)
        return
      }
      case 'expr':
        await this.eval(s.e, scope, self)
        return
      case 'if':
        if (truthy(await this.eval(s.c, scope, self), this)) await this.exec(s.a, new Scope(scope), self)
        else if (s.b) await this.exec(s.b, new Scope(scope), self)
        return
      case 'while':
        while (truthy(await this.eval(s.c, scope, self), this)) {
          try {
            await this.exec(s.body, new Scope(scope), self)
          } catch (e) {
            if (e instanceof BreakSignal) break
            if (e instanceof ContinueSignal) continue
            throw e
          }
        }
        return
      case 'for': {
        const fs = new Scope(scope)
        for (const i of s.init) await this.exec(i, fs, self)
        while (!s.c || truthy(await this.eval(s.c, fs, self), this)) {
          try {
            await this.exec(s.body, new Scope(fs), self)
          } catch (e) {
            if (e instanceof BreakSignal) break
            if (!(e instanceof ContinueSignal)) throw e
          }
          for (const u of s.upd) await this.eval(u, fs, self)
        }
        return
      }
      case 'foreach': {
        const list = await this.eval(s.e, scope, self)
        if (list === null || list === undefined) this.fail('NullPointerException', 'Cannot loop over null')
        const items = Array.isArray(list) ? [...list] : list instanceof Map ? [...list.keys()] : this.fail('CompileError', 'for-each needs a list or an array')
        for (const it of items) {
          const ls = new Scope(scope)
          ls.vars.set(s.name, it)
          try {
            await this.exec(s.body, ls, self)
          } catch (e) {
            if (e instanceof BreakSignal) break
            if (!(e instanceof ContinueSignal)) throw e
          }
        }
        return
      }
      case 'block':
        await this.execBlock(s.body, scope, self)
        return
      case 'return':
        throw new ReturnSignal(s.e ? await this.eval(s.e, scope, self) : undefined)
      case 'break':
        throw new BreakSignal()
      case 'continue':
        throw new ContinueSignal()
      case 'throw': {
        const v = await this.eval(s.e, scope, self)
        if (v instanceof JavaException) throw v
        this.fail('RuntimeException', javaString(v))
        return
      }
      case 'try': {
        try {
          await this.execBlock(s.body, scope, self)
        } catch (e) {
          if (!(e instanceof JavaException)) throw e
          const c = s.catches.find((c) => c.types.some((t) => catches(t, e.type)))
          if (!c) throw e
          const cs = new Scope(scope)
          cs.vars.set(c.name, e)
          await this.execBlock(c.body, cs, self)
        } finally {
          if (s.fin) await this.execBlock(s.fin, scope, self)
        }
        return
      }
    }
  }

  async eval(e: Expr, scope: Scope, self: JObject | null): Promise<unknown> {
    this.line = e.line
    switch (e.k) {
      case 'lit':
        return e.v
      case 'this':
        return self
      case 'name': {
        const s = scope.find(e.n)
        if (s) return s.vars.get(e.n)
        if (self && self.fields.has(e.n)) return self.fields.get(e.n)
        if (this.prog.classes.has(e.n)) return { __class: e.n }
        this.fail('CompileError', `cannot find symbol: ${e.n}. Is it spelled right, and declared before this line?`)
      }
      // falls through (fail never returns)
      case 'member': {
        const o = await this.eval(e.o, scope, self)
        if (o === null || o === undefined) this.fail('NullPointerException', `Cannot read "${e.n}" because the value is null`)
        if (Array.isArray(o) && e.n === 'length') return o.length
        if (o instanceof JObject) {
          if (!o.fields.has(e.n)) this.fail('CompileError', `cannot find symbol: field ${e.n}`)
          return o.fields.get(e.n)
        }
        if (typeof o === 'object' && e.n in (o as object)) return (o as Record<string, unknown>)[e.n]
        this.fail('CompileError', `cannot find symbol: ${e.n}`)
      }
      // falls through
      case 'call':
        return this.evalCall(e, scope, self)
      case 'index': {
        const o = await this.eval(e.o, scope, self)
        const i = num(await this.eval(e.i, scope, self))
        if (!Array.isArray(o)) this.fail('CompileError', 'array required, but found something else')
        if (i < 0 || i >= o.length) this.fail('ArrayIndexOutOfBoundsException', `Index ${i} out of bounds for length ${o.length}`)
        return o[i]
      }
      case 'new': {
        const args = []
        for (const a of e.args) args.push(await this.eval(a, scope, self))
        const cls = this.prog.classes.get(e.cls)
        if (cls) return this.instantiate(cls, args)
        const ctor = this.host.constructors[e.cls]
        if (!ctor) this.fail('CompileError', `cannot find symbol: class ${e.cls}`)
        return ctor(...args)
      }
      case 'newArray': {
        if (e.init) {
          const out = []
          for (const a of e.init) out.push(await this.eval(a, scope, self))
          return out
        }
        const n = e.size ? num(await this.eval(e.size, scope, self)) : 0
        return new Array(n).fill(null)
      }
      case 'arrayLit': {
        const out = []
        for (const a of e.items) out.push(await this.eval(a, scope, self))
        return out
      }
      case 'unary': {
        const v = await this.eval(e.e, scope, self)
        if (e.op === '!') return !truthy(v, this)
        if (!isNum(v)) this.fail('CompileError', `bad operand type for unary ${e.op}`)
        return e.op === '-' ? (v instanceof JDouble ? new JDouble(-v.v) : -(v as number)) : v
      }
      case 'update': {
        const old = await this.eval(e.e, scope, self)
        if (!isNum(old)) this.fail('CompileError', `bad operand for ${e.op}`)
        const nv = num(old) + (e.op === '++' ? 1 : -1)
        await this.store(e.e, old instanceof JDouble ? new JDouble(nv) : nv, scope, self)
        return e.prefix ? nv : old
      }
      case 'bin': {
        if (e.op === '&&') return truthy(await this.eval(e.a, scope, self), this) && truthy(await this.eval(e.b, scope, self), this)
        if (e.op === '||') return truthy(await this.eval(e.a, scope, self), this) || truthy(await this.eval(e.b, scope, self), this)
        const a = await this.eval(e.a, scope, self)
        const b = await this.eval(e.b, scope, self)
        return binop(e.op, a, b, this)
      }
      case 'assign': {
        let v = await this.eval(e.e, scope, self)
        if (e.op !== '=') v = binop(e.op[0], await this.eval(e.target, scope, self), v, this)
        await this.store(e.target, v, scope, self)
        return v
      }
      case 'cond':
        return truthy(await this.eval(e.c, scope, self), this) ? this.eval(e.a, scope, self) : this.eval(e.b, scope, self)
      case 'lambda':
        return new JLambda(e.params, e.body, scope, self, this)
      case 'cast': {
        const v = await this.eval(e.e, scope, self)
        if (e.type === 'int' || e.type === 'long') return Math.trunc(num(v))
        if (e.type === 'double') return new JDouble(num(v))
        return v
      }
    }
  }

  async store(target: Expr, v: unknown, scope: Scope, self: JObject | null) {
    if (target.k === 'name') {
      const s = scope.find(target.n)
      if (s) {
        const old = s.vars.get(target.n)
        s.vars.set(target.n, old instanceof JDouble && typeof v === 'number' ? new JDouble(v) : v)
        return
      }
      if (self && self.fields.has(target.n)) return void self.fields.set(target.n, v)
      this.fail('CompileError', `cannot find symbol: ${target.n}. Declare it first, e.g. String ${target.n} = ...;`)
    }
    if (target.k === 'member') {
      const o = await this.eval(target.o, scope, self)
      if (o instanceof JObject) return void o.fields.set(target.n, v)
      this.fail('CompileError', `cannot assign a value to ${target.n}`)
    }
    if (target.k === 'index') {
      const o = await this.eval(target.o, scope, self)
      const i = num(await this.eval(target.i, scope, self))
      if (!Array.isArray(o)) this.fail('CompileError', 'array required')
      if (i < 0 || i >= o.length) this.fail('ArrayIndexOutOfBoundsException', `Index ${i} out of bounds for length ${o.length}`)
      o[i] = v
    }
  }

  async instantiate(cls: ClassDecl, args: unknown[]) {
    const obj = new JObject(cls)
    for (const f of cls.fields) {
      if (f.k !== 'var') continue
      obj.fields.set(f.name, f.init ? await this.eval(f.init, new Scope(this.global), obj) : defaultFor(f.type))
    }
    if (cls.ctor) await this.callMethod(cls.ctor, args, obj)
    else if (args.length) this.fail('CompileError', `constructor ${cls.name} takes no arguments`)
    return obj
  }

  async evalCall(e: Extract<Expr, { k: 'call' }>, scope: Scope, self: JObject | null): Promise<unknown> {
    const args: unknown[] = []
    // A call with no receiver: own method, top-level method, or a lambda variable.
    if (e.o === null) {
      for (const a of e.args) args.push(await this.eval(a, scope, self))
      if (self) {
        const m = self.cls.methods.find((m) => m.name === e.n && m.params.length === args.length)
        if (m) return this.callMethod(m, args, self)
      }
      const top = this.prog.methods.find((m) => m.name === e.n && m.params.length === args.length)
      if (top) return this.callMethod(top, args, null)
      this.fail('CompileError', `cannot find symbol: method ${e.n}()`)
    }
    const o = await this.eval(e.o, scope, self)
    for (const a of e.args) args.push(await this.eval(a, scope, self))
    const line = e.line
    const r = await this.invoke(o, e.n, args)
    this.line = line
    return r
  }

  async invoke(o: unknown, n: string, args: unknown[]): Promise<unknown> {
    if (o === null || o === undefined) this.fail('NullPointerException', `Cannot call "${n}()" because the value is null`)
    if (o instanceof JObject) {
      const m = o.cls.methods.find((m) => m.name === n && m.params.length === args.length)
      if (!m) this.fail('CompileError', `cannot find symbol: method ${n}() in class ${o.cls.name}`)
      return this.callMethod(m, args, o)
    }
    if (typeof o === 'string') return stringMethod(o, n, args, this)
    if (Array.isArray(o)) return listMethod(o, n, args, this)
    if (o instanceof JLambda) return o.call(...args)
    if (o instanceof JavaException) {
      if (n === 'getMessage') return o.message
      if (n === 'toString') return `${o.type}: ${o.message}`
    }
    if (isNum(o) || typeof o === 'boolean') this.fail('CompileError', `${typeName(o)} cannot be dereferenced (you cannot call .${n}() on it)`)
    const f = (o as Record<string, unknown>)[n]
    if (typeof f !== 'function') this.fail('CompileError', `cannot find symbol: method ${n}(). Check the spelling and capital letters`)
    return await (f as (...a: unknown[]) => unknown).apply(o, args)
  }
}

function defaultFor(type: string) {
  if (['int', 'long', 'short', 'byte'].includes(type)) return 0
  if (type === 'double' || type === 'float') return new JDouble(0)
  if (type === 'boolean') return false
  return null
}

function typeName(v: unknown) {
  if (v === null) return 'null'
  if (v instanceof JDouble) return 'double'
  if (typeof v === 'number') return 'int'
  if (typeof v === 'boolean') return 'boolean'
  if (typeof v === 'string') return 'String'
  if (Array.isArray(v)) return 'List'
  return (v as { __java?: string }).__java ?? 'Object'
}

function truthy(v: unknown, it: Interpreter) {
  if (typeof v !== 'boolean') it.fail('CompileError', `incompatible types: ${typeName(v)} cannot be converted to boolean`)
  return v
}

function catches(declared: string, thrown: string) {
  if (declared === thrown || declared === 'Exception' || declared === 'Throwable') return thrown !== 'AssertionError' || declared === 'Throwable'
  if (declared === 'WebDriverException' || declared === 'RuntimeException') return thrown.endsWith('Exception')
  if (declared === 'Error') return thrown === 'AssertionError'
  return false
}

export function javaEquals(a: unknown, b: unknown): boolean {
  if (isNum(a) && isNum(b)) return num(a) === num(b)
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => javaEquals(x, b[i]))
  return a === b
}

function binop(op: string, a: unknown, b: unknown, it: Interpreter): unknown {
  if (op === '+' && (typeof a === 'string' || typeof b === 'string')) return javaString(a) + javaString(b)
  if (op === '==') return javaEquals(a, b)
  if (op === '!=') return !javaEquals(a, b)
  if (op === 'instanceof') return typeName(a) === b || (b === 'Object' && a !== null)
  if (!isNum(a) || !isNum(b)) it.fail('CompileError', `bad operand types for ${op}: ${typeName(a)} and ${typeName(b)}`)
  const dbl = a instanceof JDouble || b instanceof JDouble
  const x = num(a)
  const y = num(b)
  const wrap = (r: number) => (dbl ? new JDouble(r) : r)
  switch (op) {
    case '+': return wrap(x + y)
    case '-': return wrap(x - y)
    case '*': return wrap(x * y)
    case '/':
      if (!dbl && y === 0) it.fail('ArithmeticException', '/ by zero')
      return dbl ? new JDouble(x / y) : Math.trunc(x / y)
    case '%': return wrap(x % y)
    case '<': return x < y
    case '>': return x > y
    case '<=': return x <= y
    case '>=': return x >= y
  }
  it.fail('CompileError', `unknown operator ${op}`)
}

function stringMethod(s: string, n: string, a: unknown[], it: Interpreter): unknown {
  const str = (i: number) => {
    const v = a[i]
    if (typeof v !== 'string') it.fail('CompileError', `${n}() needs text (a String) here`)
    return v
  }
  switch (n) {
    case 'length': return s.length
    case 'equals': return s === a[0]
    case 'equalsIgnoreCase': return typeof a[0] === 'string' && s.toLowerCase() === a[0].toLowerCase()
    case 'contains': return s.includes(str(0))
    case 'startsWith': return s.startsWith(str(0))
    case 'endsWith': return s.endsWith(str(0))
    case 'toUpperCase': return s.toUpperCase()
    case 'toLowerCase': return s.toLowerCase()
    case 'trim': case 'strip': return s.trim()
    case 'isEmpty': return s.length === 0
    case 'isBlank': return s.trim().length === 0
    case 'indexOf': return s.indexOf(str(0))
    case 'charAt': return s.charAt(num(a[0]))
    case 'substring': {
      const from = num(a[0])
      const to = a.length > 1 ? num(a[1]) : s.length
      if (from < 0 || to > s.length || from > to) it.fail('StringIndexOutOfBoundsException', `begin ${from}, end ${to}, length ${s.length}`)
      return s.substring(from, to)
    }
    case 'replace': return s.split(str(0)).join(str(1))
    case 'split': return s.split(new RegExp(str(0)))
    case 'matches': return new RegExp(`^(?:${str(0)})$`).test(s)
    case 'toString': return s
    case 'hashCode': return s.length
  }
  it.fail('CompileError', `cannot find symbol: method ${n}() on a String`)
}

function listMethod(l: unknown[], n: string, a: unknown[], it: Interpreter): unknown {
  switch (n) {
    case 'size': return l.length
    case 'get': {
      const i = num(a[0])
      if (i < 0 || i >= l.length) it.fail('IndexOutOfBoundsException', `Index ${i} out of bounds for length ${l.length}`)
      return l[i]
    }
    case 'isEmpty': return l.length === 0
    case 'contains': return l.some((x) => javaEquals(x, a[0]))
    case 'indexOf': return l.findIndex((x) => javaEquals(x, a[0]))
    case 'add':
      if (a.length === 2) l.splice(num(a[0]), 0, a[1])
      else l.push(a[0])
      return true
    case 'remove': return l.splice(num(a[0]), 1)[0]
    case 'clear': l.length = 0; return undefined
    case 'toString': return javaString(l)
    case 'forEach': return (async () => { for (const x of l) await (a[0] as JLambda).call(x) })()
  }
  it.fail('CompileError', `cannot find symbol: method ${n}() on a List`)
}
