// Deterministic seed for the ShopSprout (e-commerce) database used in Act 1,
// plus the legacy/migrated bank tables used by the TSB incident file.
// The story facts baked in here:
//  - 41 orders have no shipment: 38 are stuck as PAID, 3 are CANCELLED.
//  - Every stuck PAID order contains the "Sproutling Plant Kit", whose stock is 0.
//    (Root cause: the warehouse sync silently skips orders with out-of-stock items.)
//  - 4 orders were paid twice (a Gremlin foreshadow for Act 2's double charges).
//  - TSB-style migration: 7 accounts missing after migration, 5 with wrong balances.

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`

const FIRST = ['Asha', 'Rohan', 'Meghna', 'Kabir', 'Isha', 'Arjun', 'Zara', 'Vikram', 'Neha', 'Dev', 'Ananya', 'Farhan', 'Lena', 'Omar', 'Priya', 'Sofia', 'Tariq', 'Mia', 'Nikhil', 'Ruth']
const LAST = ['Patil', 'Sharma', 'Khan', 'Fernandes', 'Iyer', 'Okafor', 'Mehta', 'Silva', 'Joshi', 'Nair', 'Brooks', 'Das']
const CITIES = ['Pune', 'Mumbai', 'Bengaluru', 'Delhi', 'Chennai', 'Hyderabad']
const CARRIERS = ['SwiftShip', 'BlueDart Lane', 'ParcelPigeon']

export const PRODUCTS: { name: string; category: string; price: number; stock: number }[] = [
  { name: 'Bamboo Cutting Board', category: 'Kitchen', price: 649, stock: 120 },
  { name: 'Copper Water Bottle', category: 'Kitchen', price: 899, stock: 80 },
  { name: 'Spice Jar Set', category: 'Kitchen', price: 1199, stock: 45 },
  { name: 'Cast Iron Skillet', category: 'Kitchen', price: 2499, stock: 30 },
  { name: 'Ceramic Mug', category: 'Kitchen', price: 349, stock: 200 },
  { name: 'Linen Tea Towels', category: 'Kitchen', price: 299, stock: 150 },
  { name: 'Sproutling Plant Kit', category: 'Garden', price: 799, stock: 0 },
  { name: 'Terracotta Pot', category: 'Garden', price: 249, stock: 300 },
  { name: 'Watering Can', category: 'Garden', price: 549, stock: 60 },
  { name: 'Herb Seed Pack', category: 'Garden', price: 149, stock: 500 },
  { name: 'Garden Gloves', category: 'Garden', price: 399, stock: 90 },
  { name: 'Solar Fairy Lights', category: 'Garden', price: 1299, stock: 40 },
  { name: 'Scented Candle', category: 'Home', price: 499, stock: 140 },
  { name: 'Woven Throw Blanket', category: 'Home', price: 2199, stock: 25 },
  { name: 'Wall Clock', category: 'Home', price: 1599, stock: 35 },
  { name: 'Photo Frame', category: 'Home', price: 449, stock: 110 },
  { name: 'Desk Organizer', category: 'Home', price: 699, stock: 70 },
  { name: 'Reading Lamp', category: 'Home', price: 3299, stock: 15 },
  { name: 'Yoga Mat', category: 'Fitness', price: 1499, stock: 50 },
  { name: 'Steel Dumbbell Pair', category: 'Fitness', price: 2799, stock: 20 },
  { name: 'Skipping Rope', category: 'Fitness', price: 299, stock: 160 },
  { name: 'Foam Roller', category: 'Fitness', price: 999, stock: 40 },
  { name: 'Water Sipper', category: 'Fitness', price: 449, stock: 95 },
  { name: 'Resistance Bands', category: 'Fitness', price: 799, stock: 65 },
]
const PLANT_KIT_ID = 7

export interface SeedFacts {
  ordersWithoutShipment: number
  stuckPaidOrders: number
  cancelledOrders: number
  doublePaidOrders: number
  missingAccounts: number
  wrongBalances: number
}

export function buildSeedSql(): { sql: string; facts: SeedFacts } {
  const rnd = mulberry32(20261123)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)]
  const out: string[] = []

  out.push(`
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  joined_on DATE NOT NULL,
  email TEXT,
  phone TEXT,
  alt_phone TEXT
);
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  order_date DATE NOT NULL,
  status TEXT NOT NULL,
  total NUMERIC(10,2) NOT NULL
);
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL
);
CREATE TABLE shipments (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  shipped_on DATE NOT NULL,
  carrier TEXT NOT NULL
);
CREATE TABLE payments (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  amount NUMERIC(10,2) NOT NULL,
  paid_on DATE NOT NULL,
  method TEXT NOT NULL
);
CREATE TABLE legacy_accounts (
  account_no TEXT PRIMARY KEY,
  holder TEXT NOT NULL,
  balance NUMERIC(12,2) NOT NULL
);
CREATE TABLE migrated_accounts (
  account_no TEXT PRIMARY KEY,
  holder TEXT NOT NULL,
  balance NUMERIC(12,2) NOT NULL
);
`)

  // Customers
  // Contact data has planted quality problems for the intermediate lessons:
  //  - phone is NULL for ids 9,18,27,36,45,54; alt_phone exists only for 18,36,54 (so 3 have no contact)
  //  - ids 57,58,59 reuse the emails of 27,28,29 (3 duplicate emails, no UNIQUE constraint)
  //  - ids 33 and 44 have emails without an @
  const nameOf = (i: number) => `${FIRST[(i * 7) % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`
  const emailOf = (i: number) => `${nameOf(i).toLowerCase().replace(' ', '.')}${i}@sproutmail.in`
  const customers: string[] = []
  for (let i = 1; i <= 60; i++) {
    const name = nameOf(i)
    const city = CITIES[i % CITIES.length]
    const day = 1 + ((i * 13) % 28)
    const month = 1 + ((i * 3) % 9)
    let email = i >= 57 && i <= 59 ? emailOf(i - 30) : emailOf(i)
    if (i === 33 || i === 44) email = email.replace('@', '')
    const phone = i % 9 === 0 ? 'NULL' : q(`98${String(20000000 + i * 7919).slice(0, 8)}`)
    const alt = i % 18 === 0 ? q(`020-24${String(10000 + i * 37)}`) : 'NULL'
    customers.push(`(${i}, ${q(name)}, ${q(city)}, '2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}', ${q(email)}, ${phone}, ${alt})`)
  }
  out.push(`INSERT INTO customers VALUES\n${customers.join(',\n')};`)

  // Products
  out.push(
    `INSERT INTO products VALUES\n${PRODUCTS.map(
      (p, i) => `(${i + 1}, ${q(p.name)}, ${q(p.category)}, ${p.price}, ${p.stock})`,
    ).join(',\n')};`,
  )

  // Orders: ids 1001..1300. Choose 41 without shipments deterministically.
  const orderIds = Array.from({ length: 300 }, (_, i) => 1001 + i)
  const stuck = new Set<number>()
  const cancelled = new Set<number>()
  for (let k = 0; k < 41; k++) {
    const id = 1001 + ((k * 89 + 17) % 300)
    if (k < 3) cancelled.add(id)
    else stuck.add(id)
  }
  const doublePaid = new Set([1012, 1077, 1150, 1233].filter((id) => !stuck.has(id) && !cancelled.has(id)))

  const orders: string[] = []
  const items: string[] = []
  const shipments: string[] = []
  const payments: string[] = []
  let itemId = 1
  let shipId = 1
  let payId = 1
  const nonKitProducts = PRODUCTS.map((_, i) => i + 1).filter((id) => id !== PLANT_KIT_ID)

  for (const id of orderIds) {
    const customer = 1 + Math.floor(rnd() * 60)
    const day = 1 + Math.floor(rnd() * 31)
    const date = `2026-10-${String(day).padStart(2, '0')}`
    let total = 0
    const n = 1 + Math.floor(rnd() * 3)
    const lines: [number, number][] = []
    if (stuck.has(id)) lines.push([PLANT_KIT_ID, 1])
    while (lines.length < n + (stuck.has(id) ? 1 : 0)) {
      const pid = pick(nonKitProducts)
      if (!lines.some(([p]) => p === pid)) lines.push([pid, 1 + Math.floor(rnd() * 3)])
    }
    for (const [pid, qty] of lines) {
      const price = PRODUCTS[pid - 1].price
      total += price * qty
      items.push(`(${itemId++}, ${id}, ${pid}, ${qty}, ${price})`)
    }
    const status = cancelled.has(id) ? 'CANCELLED' : stuck.has(id) ? 'PAID' : rnd() < 0.7 ? 'DELIVERED' : 'SHIPPED'
    orders.push(`(${id}, ${customer}, '${date}', '${status}', ${total})`)

    if (!stuck.has(id) && !cancelled.has(id)) {
      const shipDay = Math.min(31, day + 1 + Math.floor(rnd() * 2))
      shipments.push(`(${shipId++}, ${id}, '2026-10-${String(shipDay).padStart(2, '0')}', ${q(pick(CARRIERS))})`)
    }
    if (!cancelled.has(id)) {
      const method = pick(['UPI', 'Card', 'Wallet', 'NetBanking'])
      payments.push(`(${payId++}, ${id}, ${total}, '${date}', '${method}')`)
      if (doublePaid.has(id)) payments.push(`(${payId++}, ${id}, ${total}, '${date}', '${method}')`)
    }
  }
  out.push(`INSERT INTO orders VALUES\n${orders.join(',\n')};`)
  out.push(`INSERT INTO order_items VALUES\n${items.join(',\n')};`)
  out.push(`INSERT INTO shipments VALUES\n${shipments.join(',\n')};`)
  out.push(`INSERT INTO payments VALUES\n${payments.join(',\n')};`)

  // Bank migration tables (TSB incident file)
  const legacy: string[] = []
  const migrated: string[] = []
  let missing = 0
  let wrong = 0
  for (let i = 1; i <= 120; i++) {
    const acct = `TSQ-${String(40000 + i * 37)}`
    const holder = `${FIRST[(i * 3) % FIRST.length]} ${LAST[(i * 11) % LAST.length]}`
    const balance = Math.round(rnd() * 25000000) / 100
    legacy.push(`(${q(acct)}, ${q(holder)}, ${balance.toFixed(2)})`)
    if (i % 17 === 0) {
      missing++
      continue
    }
    let newBalance = balance
    if (i % 23 === 0) {
      newBalance = Math.round(balance * 100 - 100 * (1 + (i % 9))) / 100
      wrong++
    }
    migrated.push(`(${q(acct)}, ${q(holder)}, ${newBalance.toFixed(2)})`)
  }
  out.push(`INSERT INTO legacy_accounts VALUES\n${legacy.join(',\n')};`)
  out.push(`INSERT INTO migrated_accounts VALUES\n${migrated.join(',\n')};`)

  out.push(buildPartnerFeed())
  out.push(buildLedgerly())

  return {
    sql: out.join('\n'),
    facts: {
      ordersWithoutShipment: stuck.size + cancelled.size,
      stuckPaidOrders: stuck.size,
      cancelledOrders: cancelled.size,
      doublePaidOrders: doublePaid.size,
      missingAccounts: missing,
      wrongBalances: wrong,
    },
  }
}

/**
 * Partner feed (intermediate boss). No constraints, on purpose. Planted defects:
 *  orphans (customer missing): feed 5, 18, 33 · negative amount: 9, 27 · NULL amount: 14, 36
 *  duplicate order_ref: 21, 22, 23 repeat 11, 12, 13 · lowercase currency: 7, 30 · future date: 39
 */
function buildPartnerFeed(): string {
  const rows: string[] = []
  for (let i = 1; i <= 40; i++) {
    const ref = [21, 22, 23].includes(i) ? 5000 + (i - 10) : 5000 + i
    const customer = [5, 18, 33].includes(i) ? 900 + i : 1 + ((i * 7) % 60)
    let amount: string = String(500 + i * 37)
    if ([9, 27].includes(i)) amount = String(-(500 + i * 37))
    if ([14, 36].includes(i)) amount = 'NULL'
    const currency = [7, 30].includes(i) ? 'inr' : 'INR'
    const date = i === 39 ? '2027-01-05' : `2026-11-${String(1 + (i % 22)).padStart(2, '0')}`
    rows.push(`(${i}, ${ref}, ${customer}, ${amount}, '${currency}', '${date}')`)
  }
  return `CREATE TABLE staging_orders (
  feed_id INTEGER,
  order_ref INTEGER,
  customer_id INTEGER,
  amount NUMERIC(10,2),
  currency TEXT,
  order_date DATE
);
INSERT INTO staging_orders VALUES
${rows.join(',\n')};`
}

/**
 * Ledgerly bank (advanced lessons). Planted:
 *  - 6 double charges: same account, merchant and amount, 40-90 s apart (accounts 2, 6, 9, 11, 15, 19)
 *  - 2 overdrafts: running balance dips below zero (accounts 4 and 13)
 *  - card settlements: 4 payments never settled, 2 "ghost" settlements with no ledger row
 *  - audit_log: 60,000 rows with a primary key, for EXPLAIN
 */
function buildLedgerly(): string {
  const rnd = mulberry32(777)
  const MERCHANTS = ['FreshMart', 'MetroRail', 'ChaiPoint', 'PowerGrid Bills', 'BookNook', 'CineMax', 'QuickCab', 'PharmaPlus']
  const CITIES2 = ['Pune', 'Mumbai', 'Nagpur', 'Nashik']
  const HOLDERS = ['Aarav Kulkarni', 'Sneha Deshpande', 'Rahul Joshi', 'Pooja Patil', 'Omkar Shinde', 'Gauri Pawar', 'Nikhil Bhosale', 'Rutuja Jadhav', 'Sagar More', 'Anjali Gokhale', 'Vivek Chavan', 'Kavya Apte', 'Tejas Salunkhe', 'Mrunal Kale', 'Harsh Naik', 'Ishita Ranade', 'Pranav Mane', 'Shruti Dixit', 'Aditya Karve', 'Neha Bapat']
  const doubles = new Set([2, 6, 9, 11, 15, 19])
  const overdraft = new Set([4, 13])
  type Tx = { account: number; time: number; amount: number; kind: string; merchant: string; key: string }
  const txs: Tx[] = []
  const base = Date.UTC(2026, 10, 1, 9, 0, 0)
  const H = 3600_000
  let keyN = 1
  const accounts: string[] = []
  for (let a = 1; a <= 20; a++) {
    accounts.push(`(${a}, ${q(HOLDERS[a - 1])}, '${CITIES2[a % 4]}', '2025-${String(1 + (a % 12)).padStart(2, '0')}-15', '${a % 3 === 0 ? 'CURRENT' : 'SAVINGS'}')`)
    let t = base + a * 7 * 60_000
    let bal = 20000 + Math.round(rnd() * 60000)
    txs.push({ account: a, time: t, amount: bal, kind: 'DEPOSIT', merchant: 'Salary', key: `K${keyN++}` })
    let doubled = false
    let overdrawn = false
    for (let k = 0; k < 18; k++) {
      t += (8 + Math.floor(rnd() * 30)) * H
      const r = rnd()
      if (overdraft.has(a) && k === 8 && !overdrawn) {
        const amt = bal + 3000
        txs.push({ account: a, time: t, amount: -amt, kind: 'PAYMENT', merchant: 'QuickCab', key: `K${keyN++}` })
        bal -= amt
        t += 20 * H
        txs.push({ account: a, time: t, amount: 15000, kind: 'DEPOSIT', merchant: 'Transfer In', key: `K${keyN++}` })
        bal += 15000
        overdrawn = true
        continue
      }
      if (r < 0.75 && bal > 2000) {
        const amt = Math.min(Math.round(100 + rnd() * 4900), bal - 1500)
        const merchant = MERCHANTS[Math.floor(rnd() * MERCHANTS.length)]
        const key = `K${keyN++}`
        txs.push({ account: a, time: t, amount: -amt, kind: 'PAYMENT', merchant, key })
        bal -= amt
        if (doubles.has(a) && !doubled && k >= 4 && bal - amt > 1000) {
          txs.push({ account: a, time: t + (40 + Math.floor(rnd() * 50)) * 1000, amount: -amt, kind: 'PAYMENT', merchant, key })
          bal -= amt
          doubled = true
        }
      } else if (r < 0.85) {
        const amt = Math.round(50 + rnd() * 900)
        txs.push({ account: a, time: t, amount: amt, kind: 'REFUND', merchant: MERCHANTS[Math.floor(rnd() * MERCHANTS.length)], key: `K${keyN++}` })
        bal += amt
      } else if (r < 0.92 && bal > 100) {
        txs.push({ account: a, time: t, amount: -25, kind: 'FEE', merchant: 'Ledgerly', key: `K${keyN++}` })
        bal -= 25
      } else {
        const amt = 5000 + Math.round(rnd() * 15000)
        txs.push({ account: a, time: t, amount: amt, kind: 'DEPOSIT', merchant: 'Transfer In', key: `K${keyN++}` })
        bal += amt
      }
    }
  }
  txs.sort((x, y) => x.time - y.time)
  const iso = (ms: number) => new Date(ms).toISOString().replace('T', ' ').slice(0, 19)
  const txRows = txs.map((tx, i) => `(${i + 1}, ${tx.account}, '${iso(tx.time)}', ${tx.amount.toFixed(2)}, '${tx.kind}', ${q(tx.merchant)}, '${tx.key}')`)

  // Settlements from the card network: every PAYMENT except 4, plus 2 ghosts.
  const paymentIds = txs.map((tx, i) => ({ tx, id: i + 1 })).filter((x) => x.tx.kind === 'PAYMENT')
  const unsettled = new Set([paymentIds[10].id, paymentIds[57].id, paymentIds[121].id, paymentIds[180].id])
  const settle = paymentIds
    .filter((p) => !unsettled.has(p.id))
    .map((p) => `(${p.id}, ${(-p.tx.amount).toFixed(2)}, '${iso(p.tx.time + 24 * H).slice(0, 10)}')`)
  settle.push(`(99001, 1499.00, '2026-11-20')`, `(99002, 320.00, '2026-11-21')`)

  return `CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  holder TEXT NOT NULL,
  city TEXT NOT NULL,
  opened_on DATE NOT NULL,
  kind TEXT NOT NULL
);
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  txn_time TIMESTAMP NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  kind TEXT NOT NULL,
  merchant TEXT NOT NULL,
  idem_key TEXT NOT NULL
);
CREATE TABLE settlements (
  txn_id INTEGER NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  settled_on DATE NOT NULL
);
INSERT INTO accounts VALUES
${accounts.join(',\n')};
INSERT INTO transactions VALUES
${txRows.join(',\n')};
INSERT INTO settlements VALUES
${settle.join(',\n')};
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL,
  event TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  note TEXT NOT NULL
);
INSERT INTO audit_log
SELECT g, 1 + g % 20, (ARRAY['LOGIN','VIEW','TRANSFER','LOGOUT'])[1 + g % 4],
       TIMESTAMP '2026-11-01' + g * INTERVAL '30 seconds', 'event ' || g
FROM generate_series(1, 60000) AS g;
ANALYZE audit_log;`
}
