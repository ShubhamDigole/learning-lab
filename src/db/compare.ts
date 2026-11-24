// Pure result-set comparison so any correct query passes, not just the reference one.

export interface QueryResult {
  columns: string[]
  rows: unknown[][]
}

export interface CompareOutcome {
  ok: boolean
  message: { en: string; mr: string }
}

function norm(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (v instanceof Date) return v.toISOString().slice(0, 19)
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(4)))
  if (typeof v === 'bigint') return v.toString()
  const s = String(v)
  // NUMERIC columns arrive as strings: "649.00" must equal 649
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const n = Number(s)
    return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(4)))
  }
  return s
}

/** A row's identity ignores column order, so `SELECT city, name` matches `SELECT name, city`. */
function rowKey(row: unknown[]): string {
  return row.map(norm).sort().join('␟')
}

export function compareResults(actual: QueryResult, expected: QueryResult, orderMatters = false): CompareOutcome {
  if (actual.columns.length !== expected.columns.length) {
    const a = actual.columns.length
    const e = expected.columns.length
    return {
      ok: false,
      message: {
        en: `Your query returns ${a} column${a === 1 ? '' : 's'}; the evidence needs ${e}.`,
        mr: `तुमची क्वेरी ${a} column देते; पुराव्यासाठी ${e} columns हवेत.`,
      },
    }
  }
  if (actual.rows.length !== expected.rows.length) {
    const diff = actual.rows.length - expected.rows.length
    const n = actual.rows.length
    return {
      ok: false,
      message: {
        en: `Your query returned ${n} row${n === 1 ? '' : 's'}, ${Math.abs(diff)} ${diff > 0 ? 'too many' : 'too few'}. ${diff > 0 ? 'Is your filter strict enough?' : 'Is your filter too strict?'}`,
        mr: `तुमच्या क्वेरीने ${n} rows दिल्या, ${Math.abs(diff)} ${diff > 0 ? 'जास्त' : 'कमी'}. ${diff > 0 ? 'फिल्टर पुरेसा कडक आहे का?' : 'फिल्टर जास्तच कडक आहे का?'}`,
      },
    }
  }
  const a = actual.rows.map(rowKey)
  const e = expected.rows.map(rowKey)
  const valuesDiffer = { en: 'Right number of rows, but some values differ. Check your filter and columns.', mr: 'rows ची संख्या बरोबर, पण काही व्हॅल्यूज वेगळ्या आहेत. फिल्टर आणि columns तपासा.' }
  if (orderMatters) {
    if (a.join('|') === e.join('|')) return { ok: true, message: { en: 'Exact match.', mr: 'अगदी बरोबर.' } }
    const sameSet = [...a].sort().join('|') === [...e].sort().join('|')
    return {
      ok: false,
      message: sameSet ? { en: 'Right rows, wrong order. Check ASC vs DESC.', mr: 'rows बरोबर, क्रम चुकीचा. ASC आणि DESC तपासा.' } : valuesDiffer,
    }
  }
  const sa = [...a].sort()
  const se = [...e].sort()
  for (let i = 0; i < sa.length; i++) if (sa[i] !== se[i]) return { ok: false, message: valuesDiffer }
  return { ok: true, message: { en: 'Match.', mr: 'जुळलं.' } }
}
