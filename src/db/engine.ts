import { PGlite } from '@electric-sql/pglite'
import { buildSeedSql } from './seed.ts'
import type { QueryResult } from './compare.ts'
import { apiSyncSql, apiVersion } from '../api/dbsync.ts'

let syncedVersion = -1
/** Copy the practice API's current data into the tg_* tables before a query reads them. */
async function syncApi(db: PGlite) {
  const v = apiVersion()
  if (v === syncedVersion) return
  await db.exec(apiSyncSql())
  syncedVersion = v
}

let dbPromise: Promise<PGlite> | null = null

/** One in-browser Postgres per session, seeded with ShopSprout + bank migration data. */
export function getDb(): Promise<PGlite> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = new PGlite()
      await db.exec(buildSeedSql().sql)
      await syncApi(db)
      return db
    })()
  }
  return dbPromise
}

/** A SQL problem explained in plain words, in English and Marathi. */
export class SqlError extends Error {
  mr: string
  constructor(en: string, mr: string) {
    super(en)
    this.mr = mr
  }
}

/**
 * Runs a single statement inside a transaction that is always rolled back,
 * so a stray DELETE can never break the case files.
 */
// PGlite has a single connection, so queries must never interleave
// (two BEGIN/ROLLBACK pairs running at once would corrupt each other).
let queue: Promise<unknown> = Promise.resolve()
export function runQuery(sql: string): Promise<QueryResult> {
  const job = queue.then(() => runQueryNow(sql))
  queue = job.catch(() => undefined)
  return job
}

async function runQueryNow(sql: string): Promise<QueryResult> {
  const trimmed = sql.trim().replace(/;+\s*$/, '')
  if (!trimmed) throw new SqlError('Type a query first.', 'आधी क्वेरी टाइप करा.')
  if (trimmed.includes(';')) throw new SqlError('One query at a time. Remove the extra semicolon.', 'एका वेळी एकच क्वेरी. जास्तीचा अर्धविराम काढा.')
  const db = await getDb()
  await syncApi(db)
  await db.exec('BEGIN')
  try {
    const res = await db.query<Record<string, unknown>>(trimmed, [], { rowMode: 'array' } as never)
    const columns = res.fields.map((f) => f.name)
    const rows = (res.rows as unknown as unknown[][]).map((r) => (Array.isArray(r) ? r : columns.map((c) => (r as Record<string, unknown>)[c])))
    return { columns, rows }
  } catch (e) {
    const f = friendlyError((e as Error).message)
    throw new SqlError(f.en, f.mr)
  } finally {
    await db.exec('ROLLBACK')
  }
}

function friendlyError(msg: string): { en: string; mr: string } {
  const col = msg.match(/column "?([\w.]+)"? does not exist/)
  if (col) return { en: `There is no column called "${col[1]}". Check the table list on the left for the real names.`, mr: `"${col[1]}" नावाचा column नाही. खरी नावं डावीकडच्या टेबल यादीत पाहा.` }
  const rel = msg.match(/relation "?(\w+)"? does not exist/)
  if (rel) return { en: `There is no table called "${rel[1]}". Check the table list on the left.`, mr: `"${rel[1]}" नावाचं टेबल नाही. डावीकडची टेबल यादी पाहा.` }
  if (/syntax error at or near/.test(msg)) {
    const near = msg.match(/at or near "([^"]*)"/)?.[1] ?? '?'
    return { en: `The database could not read the query near "${near}". Check spelling, commas and quotes around text.`, mr: `"${near}" जवळ डेटाबेसला क्वेरी समजली नाही. स्पेलिंग, स्वल्पविराम आणि टेक्स्टभोवतीचे कोट्स तपासा.` }
  }
  if (/must appear in the GROUP BY clause/.test(msg)) {
    return { en: 'Every column you SELECT must be in GROUP BY or inside a function like COUNT() or SUM().', mr: 'SELECT मधला प्रत्येक column GROUP BY मध्ये किंवा COUNT(), SUM() सारख्या फंक्शनमध्ये हवा.' }
  }
  if (/window functions are not allowed in WHERE/.test(msg)) {
    return { en: 'Window functions cannot be used in WHERE. Compute them in a CTE first, then filter outside.', mr: 'Window functions WHERE मध्ये वापरता येत नाहीत. आधी CTE मध्ये काढा, मग बाहेर फिल्टर करा.' }
  }
  if (/duplicate key value/.test(msg)) {
    return { en: 'That id already exists: the PRIMARY KEY refused a duplicate.', mr: 'तो id आधीच आहे: PRIMARY KEY ने डुप्लिकेट नाकारला.' }
  }
  return { en: msg, mr: 'डेटाबेसने ही एरर दिली. वरचा इंग्रजी संदेश वाचा.' }
}

export async function getSchema(): Promise<{ table: string; columns: { name: string; type: string }[] }[]> {
  const db = await getDb()
  const res = await db.query<{ table_name: string; column_name: string; data_type: string }>(
    `SELECT table_name, column_name, data_type FROM information_schema.columns
     WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`,
  )
  const map = new Map<string, { name: string; type: string }[]>()
  for (const r of res.rows) {
    if (!map.has(r.table_name)) map.set(r.table_name, [])
    map.get(r.table_name)!.push({ name: r.column_name, type: r.data_type.replace('character varying', 'text') })
  }
  return [...map.entries()].map(([table, columns]) => ({ table, columns }))
}
