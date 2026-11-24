// Seed data for TiffinGo, the food-delivery client of the API track. Deterministic, so every
// learner sees the same ids, prices and planted bugs. Bugs are documented in server.ts.

export interface Restaurant {
  id: number
  name: string
  city: string
  veg: boolean
  rating: number
  cuisine: string
  deliveryMins: number
  open: boolean
  address: { area: string; city: string; pincode: string }
  tags: string[]
}

export interface MenuItem {
  id: number
  restaurantId: number
  name: string
  price: number
  veg: boolean
  available: boolean
}

export interface User {
  id: number
  username: string
  password: string
  token: string
  name: string
  phone: string
  address: { line: string; city: string; pincode: string }
}

export interface Order {
  id: number
  userId: number
  restaurantId: number
  items: { menuItemId: number; name: string; qty: number; price: number }[]
  subtotal: number
  discount: number
  deliveryFee: number
  total: number
  couponCode: string | null
  status: 'PLACED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
  createdAt: string
}

export interface Feedback {
  id: number
  restaurantId: number
  rating: number
  comment: string
}

export interface Payment {
  id: number
  orderId: number
  amount: number
  method: string
  status: 'CAPTURED'
  createdAt: string
}

const r = (id: number, name: string, city: string, veg: boolean, rating: number, cuisine: string, deliveryMins: number, area: string, pincode: string, tags: string[], open = true): Restaurant => ({
  id,
  name,
  city,
  veg,
  rating,
  cuisine,
  deliveryMins,
  open,
  address: { area, city, pincode },
  tags,
})

export const RESTAURANTS: Restaurant[] = [
  r(1, 'Saffron Thali', 'Pune', true, 4.6, 'Maharashtrian', 30, 'Kothrud', '411038', ['thali', 'family']),
  r(2, 'Bombay Biryani House', 'Mumbai', false, 4.3, 'Biryani', 40, 'Andheri', '400053', ['biryani', 'spicy']),
  r(3, 'Dosa Corner', 'Pune', true, 4.5, 'South Indian', 25, 'Shivajinagar', '411005', ['breakfast', 'dosa']),
  r(4, 'Misal Point', 'Pune', true, 4.7, 'Maharashtrian', 20, 'Sadashiv Peth', '411030', ['spicy', 'breakfast']),
  r(5, 'Tandoor Tales', 'Mumbai', false, 4.1, 'North Indian', 45, 'Bandra', '400050', ['tandoor']),
  r(6, 'Green Bowl', 'Nashik', true, 4.2, 'Salads', 30, 'College Road', '422005', ['healthy']),
  r(7, 'Coastal Curry Co.', 'Mumbai', false, 4.4, 'Seafood', 50, 'Dadar', '400014', ['fish', 'coastal']),
  r(8, 'Pav Bhaji Junction', 'Mumbai', true, 4.0, 'Street food', 25, 'Girgaon', '400004', ['street food']),
  r(9, 'Chai Tapri', 'Nashik', true, 4.5, 'Cafe', 15, 'Gangapur Road', '422013', ['chai', 'snacks']),
  r(10, 'Kolhapuri Kitchen', 'Pune', false, 3.9, 'Kolhapuri', 35, 'Baner', '411045', ['spicy', 'mutton']),
  r(11, 'Sweet Modak', 'Pune', true, 4.8, 'Desserts', 20, 'Deccan', '411004', ['sweets']),
  r(12, 'Punjabi Dhaba', 'Nashik', false, 4.0, 'North Indian', 40, 'Panchavati', '422003', ['tandoor', 'family'], false),
]

const MENU_NAMES: Record<number, [string, number, boolean][]> = {
  1: [['Puneri Thali', 220, true], ['Puran Poli', 90, true], ['Masale Bhaat', 140, true]],
  2: [['Chicken Biryani', 260, false], ['Veg Biryani', 190, true], ['Mutton Biryani', 340, false]],
  3: [['Masala Dosa', 120, true], ['Idli Sambar', 80, true], ['Filter Coffee', 40, true], ['Rava Dosa', 130, true]],
  4: [['Misal Pav', 90, true], ['Kanda Bhaji', 70, true], ['Taak', 30, true]],
  5: [['Paneer Tikka', 240, true], ['Butter Chicken', 310, false], ['Garlic Naan', 60, true]],
  6: [['Sprout Salad', 160, true], ['Quinoa Bowl', 220, true], ['Fresh Lime Soda', 60, true]],
  7: [['Fish Thali', 350, false], ['Prawn Curry', 380, false], ['Sol Kadhi', 50, true]],
  8: [['Pav Bhaji', 130, true], ['Masala Pav', 90, true], ['Tawa Pulao', 150, true]],
  9: [['Cutting Chai', 20, true], ['Vada Pav', 25, true], ['Poha', 40, true]],
  10: [['Tambda Rassa', 280, false], ['Pandhra Rassa', 280, false], ['Bhakri', 30, true]],
  11: [['Ukadiche Modak (5 pcs)', 150, true], ['Shrikhand', 110, true], ['Basundi', 120, true]],
  12: [['Dal Makhani', 210, true], ['Tandoori Chicken', 330, false], ['Lassi', 70, true]],
}

export const MENU: MenuItem[] = Object.entries(MENU_NAMES).flatMap(([rid, items]) =>
  items.map(([name, price, veg], i) => ({ id: Number(rid) * 100 + i + 1, restaurantId: Number(rid), name, price, veg, available: !(Number(rid) === 3 && i === 3) })),
)

export const USERS: User[] = [
  { id: 1, username: 'asha', password: 'chai123', token: 'tg_asha_9f2c', name: 'Asha Patil', phone: '+91 98220 11111', address: { line: '12 Lane 4, Kothrud', city: 'Pune', pincode: '411038' } },
  { id: 2, username: 'rohan', password: 'vada456', token: 'tg_rohan_51ab', name: 'Rohan Kulkarni', phone: '+91 98190 22222', address: { line: '7 Hill Road, Bandra', city: 'Mumbai', pincode: '400050' } },
]

export const SEED_ORDERS: Order[] = [
  {
    id: 4001,
    userId: 1,
    restaurantId: 3,
    items: [{ menuItemId: 301, name: 'Masala Dosa', qty: 2, price: 120 }, { menuItemId: 303, name: 'Filter Coffee', qty: 2, price: 40 }],
    subtotal: 320,
    discount: 0,
    deliveryFee: 30,
    total: 350,
    couponCode: null,
    status: 'DELIVERED',
    createdAt: '2026-11-20T08:15:00Z',
  },
  {
    id: 4002,
    userId: 2,
    restaurantId: 4,
    items: [{ menuItemId: 401, name: 'Misal Pav', qty: 3, price: 90 }],
    subtotal: 270,
    discount: 0,
    deliveryFee: 30,
    total: 300,
    couponCode: null,
    status: 'PLACED',
    createdAt: '2026-11-22T13:02:00Z',
  },
  {
    id: 4003,
    userId: 1,
    restaurantId: 11,
    items: [{ menuItemId: 1101, name: 'Ukadiche Modak (5 pcs)', qty: 1, price: 150 }],
    subtotal: 150,
    discount: 0,
    deliveryFee: 30,
    total: 180,
    couponCode: null,
    status: 'PLACED',
    createdAt: '2026-11-23T09:40:00Z',
  },
]

export const SEED_FEEDBACK: Feedback[] = [
  { id: 7001, restaurantId: 3, rating: 5, comment: 'Crispy dosa, great chutney!' },
  { id: 7002, restaurantId: 3, rating: 4, comment: 'Good, but the coffee was cold.' },
  { id: 7003, restaurantId: 4, rating: 2, comment: 'Too spicy for my kids.' },
]

/** A forgotten internal endpoint exposes these (used by the Optus incident replay). */
export const INTERNAL_CUSTOMERS = [
  { id: 1, name: 'Asha Patil', phone: '+91 98220 11111', email: 'asha.patil@example.com', aadhaarLast4: '4821', address: '12 Lane 4, Kothrud, Pune' },
  { id: 2, name: 'Rohan Kulkarni', phone: '+91 98190 22222', email: 'rohan.k@example.com', aadhaarLast4: '9907', address: '7 Hill Road, Bandra, Mumbai' },
  { id: 3, name: 'Fatima Shaikh', phone: '+91 97300 33333', email: 'fatima.s@example.com', aadhaarLast4: '1274', address: '3 MG Road, Nashik' },
]
