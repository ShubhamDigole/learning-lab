import { motion } from 'framer-motion'
import type { ReactElement } from 'react'
import type { Lesson } from '../content/types.ts'
import { Bi, L } from '../lib/i18n.tsx'

const KEYWORDS = new Set(
  'SELECT FROM WHERE AND OR NOT ORDER BY GROUP HAVING LIMIT JOIN LEFT INNER ON AS IS NULL COUNT SUM AVG MIN MAX DISTINCT ASC DESC INSERT INTO VALUES UPDATE SET DELETE RETURNING WITH CASE WHEN THEN ELSE END IN BETWEEN LIKE EXISTS UNION ALL INTERSECT EXCEPT OVER PARTITION ROW_NUMBER RANK DENSE_RANK LAG LEAD COALESCE EXPLAIN CREATE INDEX BEGIN COMMIT ROLLBACK INTERVAL DATE'.split(' '),
)

/** Small SQL highlighter: keywords, strings, numbers, comments. */
export function highlightSql(code: string) {
  const out: ReactElement[] = []
  const re = /('(?:[^']|'')*')|(--.*$)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z_0-9]*)|(\s+|.)/gm
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(code))) {
    const k = i++
    if (m[1]) out.push(<span key={k} className="tok-str">{m[1]}</span>)
    else if (m[2]) out.push(<span key={k} className="tok-com">{m[2]}</span>)
    else if (m[3]) out.push(<span key={k} className="tok-num">{m[3]}</span>)
    else if (m[4]) out.push(<span key={k} className={KEYWORDS.has(m[4]) ? 'tok-kw' : undefined}>{m[4]}</span>)
    else out.push(<span key={k}>{m[0]}</span>)
  }
  return out
}

const JS_WORDS = new Set('pm const let var function return true false null undefined if else new'.split(' '))

/** Highlighter for HTTP requests, headers, JSON and Postman test scripts. */
export function highlightApi(code: string) {
  const out: ReactElement[] = []
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|('(?:[^'\\]|\\.)*')|(\/\/.*$|#.*$)|(-?\b\d+(?:\.\d+)?\b)|^(GET|POST|PUT|PATCH|DELETE|HTTP\/1\.1)\b|^([A-Za-z][\w-]*)(?=:\s)|([A-Za-z_$][\w$]*)|(\s+|.)/gm
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(code))) {
    const k = i++
    if (m[1] && m[2]) out.push(<span key={k}><span className="tok-key">{m[1]}</span>{m[2]}</span>)
    else if (m[1] || m[3]) out.push(<span key={k} className="tok-str">{m[1] ?? m[3]}</span>)
    else if (m[4]) out.push(<span key={k} className="tok-com">{m[4]}</span>)
    else if (m[5]) out.push(<span key={k} className="tok-num">{m[5]}</span>)
    else if (m[6]) out.push(<span key={k} className={`tok-method m-${m[6].startsWith('HTTP') ? 'HTTP' : m[6]}`}>{m[6]}</span>)
    else if (m[7]) out.push(<span key={k} className="tok-key">{m[7]}</span>)
    else if (m[8]) out.push(<span key={k} className={JS_WORDS.has(m[8]) ? 'tok-kw' : undefined}>{m[8]}</span>)
    else out.push(<span key={k}>{m[0]}</span>)
  }
  return out
}

const API_LIKE = /^(GET|POST|PUT|PATCH|DELETE|HTTP\/1\.1)\s|pm\.|^\s*[{[]|^[A-Za-z][\w-]*:\s|^\s*"[\w-]+"\s*:/m

const JAVA_WORDS = new Set('abstract boolean break catch class continue double else extends final finally for if import int long new null private protected public return static this throw throws true false try void while var char'.split(' '))
const JAVA_LIKE = /driver\.|By\.|Assert\.|System\.out|WebElement|WebDriver|@Test|@Before|\bpublic\b|\bnew [A-Z]|\b(String|int|double|boolean)\s+\w+\s*[=;:,)]/

/** Highlighter for Java: keywords, strings, numbers, comments, annotations, class names. */
export function highlightJava(code: string) {
  const out: ReactElement[] = []
  const re = /("(?:[^"\\]|\\.)*")|(\/\/.*$|\/\*[\s\S]*?\*\/)|(@[A-Za-z]+)|(\b\d+(?:\.\d+)?[LDF]?\b)|([A-Za-z_$][\w$]*)|(\s+|.)/gm
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(code))) {
    const k = i++
    if (m[1]) out.push(<span key={k} className="tok-str">{m[1]}</span>)
    else if (m[2]) out.push(<span key={k} className="tok-com">{m[2]}</span>)
    else if (m[3]) out.push(<span key={k} className="tok-ann">{m[3]}</span>)
    else if (m[4]) out.push(<span key={k} className="tok-num">{m[4]}</span>)
    else if (m[5]) out.push(<span key={k} className={JAVA_WORDS.has(m[5]) ? 'tok-kw' : /^[A-Z]/.test(m[5]) ? 'tok-type' : undefined}>{m[5]}</span>)
    else out.push(<span key={k}>{m[0]}</span>)
  }
  return out
}

const TS_WORDS = new Set('async await break case catch class const continue default else export extends false finally for from function if import in let new null of return static super switch this throw true try typeof undefined var void while readonly private public type interface'.split(' '))
const JS_LIKE = /\bawait\b|\b(const|let)\s+[\w{[]|=>|\bimport\b[^;\n]*\bfrom\b|\bexport\s+(default|const|function)|\bpage\.(goto|getBy|locator)|\bexpect\(|\bhttp\.(get|post|put|del|batch)\(|\btest\(['"`]|console\.log|\bcheck\(res/

/** Highlighter for TypeScript / JavaScript (Playwright tests and k6 scripts). */
export function highlightJs(code: string) {
  const out: ReactElement[] = []
  const re = /('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\/\/.*$|\/\*[\s\S]*?\*\/)|(\/(?![*/\s])(?:[^/\\\n]|\\.)+\/[gimsuy]*(?=[\s,;)\].]|$))|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+|.)/gm
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(code))) {
    const k = i++
    if (m[1]) out.push(<span key={k} className="tok-str">{m[1]}</span>)
    else if (m[2]) out.push(<span key={k} className="tok-com">{m[2]}</span>)
    else if (m[3]) out.push(<span key={k} className="tok-str">{m[3]}</span>)
    else if (m[4]) out.push(<span key={k} className="tok-num">{m[4]}</span>)
    else if (m[5]) out.push(<span key={k} className={TS_WORDS.has(m[5]) ? 'tok-kw' : /^[A-Z]/.test(m[5]) ? 'tok-type' : undefined}>{m[5]}</span>)
    else out.push(<span key={k}>{m[0]}</span>)
  }
  return out
}

/** Picks the TypeScript, Java, API or SQL highlighter from the code itself. */
export function highlightCode(code: string) {
  if (JS_LIKE.test(code) && !/\bSELECT\b/.test(code) && !/System\.out|\bdriver\.|@Test/.test(code)) return highlightJs(code)
  if (JAVA_LIKE.test(code) && !/\bSELECT\b/.test(code)) return highlightJava(code)
  return API_LIKE.test(code) ? highlightApi(code) : highlightSql(code)
}

export function SyntaxView({ lesson }: { lesson: Lesson }) {
  const s = lesson.syntax
  const isText = Boolean(lesson.syntaxPlain)
  return (
    <div className="syntax">
      <section className="syntax-block">
        <h3 className="eyebrow"><L en="Template" mr="रचना" /></h3>
        <pre className="code-card template">
          <code>{isText ? s.template : highlightCode(s.template)}</code>
        </pre>
      </section>

      <section className="syntax-block">
        <h3 className="eyebrow"><L en="What each part means" mr="प्रत्येक भागाचा अर्थ" /></h3>
        <dl className="parts">
          {s.parts.map((p, i) => (
            <motion.div key={i} className="part" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.12 }}>
              <dt>
                <code>{p.code}</code>
              </dt>
              <dd>
                <Bi t={p.means} />
              </dd>
            </motion.div>
          ))}
        </dl>
      </section>

      <section className="syntax-block">
        <h3 className="eyebrow">
          <L en="Worked example, from the real-life story" mr="खऱ्या उदाहरणावरून" />
        </h3>
        <ol className="code-card example">
          {s.example.map((l, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.35 }}>
              <code>{isText ? l.code : highlightCode(l.code)}</code>
              {l.note && l.note.en && (
                <span className="note">
                  <Bi t={l.note} />
                </span>
              )}
            </motion.li>
          ))}
        </ol>
      </section>

      {s.pitfall && (
        <aside className="pitfall">
          <strong><L en="Common mistake" mr="नेहमीची चूक" /></strong>
          <Bi t={s.pitfall} />
        </aside>
      )}
    </div>
  )
}
