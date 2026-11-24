// Mirrors the practice API's data into the in-browser Postgres, so a learner can cross-check
// what the API answered against what the database really stored (tables tg_orders, tg_order_items, tg_payments).
import { apiSnapshot, apiVersion } from './server.ts'

const q = (v: unknown) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`)

export function apiSyncSql(): string {
  const s = apiSnapshot()
  const parts = [
    `CREATE TABLE IF NOT EXISTS tg_orders (id INT PRIMARY KEY, user_id INT, restaurant_id INT, subtotal INT, discount INT, delivery_fee INT, total INT, coupon_code TEXT, status TEXT, created_at TIMESTAMPTZ)`,
    `CREATE TABLE IF NOT EXISTS tg_order_items (order_id INT, menu_item_id INT, name TEXT, qty INT, price INT)`,
    `CREATE TABLE IF NOT EXISTS tg_payments (id INT PRIMARY KEY, order_id INT, amount INT, method TEXT, status TEXT, idempotency_key TEXT, created_at TIMESTAMPTZ)`,
    `DELETE FROM tg_order_items`,
    `DELETE FROM tg_payments`,
    `DELETE FROM tg_orders`,
  ]
  if (s.orders.length)
    parts.push(`INSERT INTO tg_orders VALUES ${s.orders.map((o) => `(${[o.id, o.userId, o.restaurantId, o.subtotal, o.discount, o.deliveryFee, o.total, o.couponCode, o.status, o.createdAt].map(q).join(', ')})`).join(', ')}`)
  const items = s.orders.flatMap((o) => o.items.map((i) => [o.id, i.menuItemId, i.name, i.qty, i.price]))
  if (items.length) parts.push(`INSERT INTO tg_order_items VALUES ${items.map((r) => `(${r.map(q).join(', ')})`).join(', ')}`)
  if (s.payments.length)
    parts.push(`INSERT INTO tg_payments VALUES ${s.payments.map((p) => `(${[p.id, p.orderId, p.amount, p.method, p.status, s.paymentKeys[p.id] ?? null, p.createdAt].map(q).join(', ')})`).join(', ')}`)
  return parts.join(';\n') + ';'
}

export { apiVersion }
