import type { Lesson } from './types.ts'
import type { PerfResult } from '../perf/k6.ts'

// Performance 2, part A: stress and spike tests (the breaking point), soak tests (the slow leak),
// and real test data (SharedArray, correlation, setup, groups, custom metrics).
//
// Measured on the engine before choosing the numbers below:
//  - buyer journey (login, seats, sleep 1, cart, checkout, sleep 1), staircase holding 50/100/150/200/300 VUs:
//    ~76 / ~150 / ~160 / ~162 / ~166 req/s, p95 ~350 ms / ~400 ms / ~680 ms / ~1 s / ~1.6 s, 0% errors.
//    The limit is the payment gateway (12 connections x ~0.26 s, ~46 checkouts/s). VU stages alone never
//    bring 503s here (800 VUs: p95 ~5 s, 0% errors).
//  - stress 100/200/300 (30s ramp + 30s hold each): 0% errors healthy; errors-under-load ~6% of all requests
//    (~24% of checkouts) fail. A 10-VU smoke test on errors-under-load: 1 failed checkout of 234 (passes).
//    abortOnFail on 'http_req_failed{name:checkout}' rate<0.05 stops the errors-under-load run at 20 s.
//  - spike 20 -> 600 VUs in 10 s: p95 ~4.5 s at the peak, 0% errors, back to ~350 ms after. errors-under-load ~4.8%.
//  - spike 20 -> 1000 VUs: ~5.6% of requests get 503 (load shedding), each 503 in under ~28 ms;
//    p95 back to ~380 ms after the drop.
//  - soak browse journey at 40 VUs: healthy p95 ~160 ms flat for 30 min (and for 1 h).
//    memory-leak, 2 min hold: p95 ~240 ms, p99 ~330 ms, 0 errors (passes p95<400).
//    memory-leak, 30 min hold: p95 ~890 ms, 2.8% failed (fails). On the chart ~290 ms at min 3,
//    ~550 ms at min 11, errors from ~min 16, ~1.3 s at min 30.
//    1 h soak with abortOnFail on http_req_failed rate<0.01: memory-leak stops at ~18.6 min.
//    slow-seats p95 ~960 ms. no-cache p95 ~310 ms (not used as a catch here).
//  - data journey (SharedArray fans, setup, groups, Trend, Counter) at 100 VUs: checkout_time p95 ~490 ms,
//    orders ~3400, checks 100%. small-pool: checkout_time ~4.4 s, orders ~1160. errors-under-load: checks ~92.7%.

type Stage = { duration: unknown; target: number }
const stagesOf = (r: PerfResult): Stage[] => (Array.isArray(r.options.stages) ? (r.options.stages as Stage[]) : [])
const secs = (d: unknown): number => {
  if (typeof d === 'number') return d / 1000
  let s = 0
  for (const m of String(d).matchAll(/(\d+(?:\.\d+)?)(ms|s|m|h)/g)) s += Number(m[1]) * (m[2] === 'ms' ? 0.001 : m[2] === 's' ? 1 : m[2] === 'm' ? 60 : 3600)
  return s
}
const holds = (r: PerfResult) => stagesOf(r).filter((s, i, a) => i > 0 && s.target > 0 && s.target === a[i - 1].target).length
const peakTarget = (r: PerfResult) => Math.max(0, ...stagesOf(r).map((s) => Number(s.target) || 0))
const peakIndex = (r: PerfResult) => stagesOf(r).findIndex((s) => s.target >= 500)
const spikeIsSudden = (r: PerfResult) => {
  const st = stagesOf(r)
  const p = peakIndex(r)
  return p >= 1 && st[p - 1].target <= 50 && secs(st[p].duration) <= 15
}
const spikeRecovers = (r: PerfResult) => {
  const st = stagesOf(r)
  const p = peakIndex(r)
  const q = st.findIndex((s, i) => i > p && s.target <= 50)
  return p >= 0 && q > p && st.some((s, i) => i > q && s.target > 0 && s.target <= 50 && secs(s.duration) >= 30)
}
const usesAbortOnFail = (r: PerfResult) => /"abortOnFail":true/.test(JSON.stringify(r.options.thresholds ?? {}))
const hasThreshold = (r: PerfResult, metric: string, start: string) => r.thresholds.some((t) => t.metric === metric && t.expr.replace(/\s/g, '').startsWith(start))
const eventsListCalls = (r: PerfResult) => Object.entries(r.byName).filter(([n]) => n === 'events' || /\/events$/.test(n)).reduce((a, [, b]) => a + b.count, 0)

// ───────────────────────── P2.1 scripts (stress and spike)

const BUY_HEAD = `import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';
const JSON_HEADERS = { 'Content-Type': 'application/json' };
`

const BUY_JOURNEY = `export default function () {
  // many VUs share the 200 fan accounts: VU 201 is fan001 again
  const n = String(((__VU - 1) % 200) + 1).padStart(3, '0');
  const login = http.post(BASE + '/auth/login', JSON.stringify({ username: 'fan' + n, password: 'pass' + n }), { headers: JSON_HEADERS, tags: { name: 'login' } });
  check(login, { 'logged in': (r) => r.status === 200 });
  const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + login.json('token') };

  http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
  sleep(1);

  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });
  check(co, { 'order confirmed': (r) => r.status === 200 });
  sleep(1);
}
`

const P21_STAIRS = `${BUY_HEAD}
// Rex's staircase: climb, hold 40s, climb, hold 40s...
export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '40s', target: 50 },
    { duration: '10s', target: 100 },
    { duration: '40s', target: 100 },
    { duration: '10s', target: 150 },
    { duration: '40s', target: 150 },
    { duration: '10s', target: 200 },
    { duration: '40s', target: 200 },
    { duration: '10s', target: 300 },
    { duration: '40s', target: 300 },
    { duration: '20s', target: 0 },
  ],
};

${BUY_JOURNEY}`

const STRESS_THRESHOLDS = `  thresholds: {
    // a stress test may get slow, but it must not start failing
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },`

const P21_STRESS_START = `${BUY_HEAD}
export const options = {
  // TODO: replace vus + duration with a staircase:
  //   up to 100 VUs in 30s, hold 30s
  //   up to 200 VUs in 30s, hold 30s
  //   up to 300 VUs in 30s, hold 30s
  //   down to 0 in 20s
  vus: 100,
  duration: '1m',
${STRESS_THRESHOLDS}
};

${BUY_JOURNEY}`

const STRESS_STAGES = `  stages: [
    { duration: '30s', target: 100 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 300 },
    { duration: '30s', target: 300 },
    { duration: '20s', target: 0 },
  ],`

const P21_STRESS_SOL = `${BUY_HEAD}
export const options = {
${STRESS_STAGES}
${STRESS_THRESHOLDS}
};

${BUY_JOURNEY}`

const P21_SPIKE_START = `${BUY_HEAD}
export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '10s', target: 0 },
    // TODO: make it a spike:
    //   20 VUs: ramp to 20 in 20s, hold 20s
    //   jump to 600 VUs in 10s, hold 600 for 40s
    //   drop back to 20 in 10s, hold 20 for 40s (recovery)
  ],
${STRESS_THRESHOLDS}
};

${BUY_JOURNEY}`

const P21_SPIKE_SOL = `${BUY_HEAD}
export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '20s', target: 20 },
    { duration: '10s', target: 600 },
    { duration: '40s', target: 600 },
    { duration: '10s', target: 20 },
    { duration: '40s', target: 20 },
  ],
${STRESS_THRESHOLDS}
};

${BUY_JOURNEY}`

const P21_SPIKE_1000 = `${BUY_HEAD}
export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '20s', target: 20 },
    { duration: '10s', target: 1000 },
    { duration: '40s', target: 1000 },
    { duration: '10s', target: 20 },
    { duration: '40s', target: 20 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    // how long did the refused requests take?
    'http_req_duration{status:503}': ['max<100'],
  },
};

${BUY_JOURNEY}`

const P21_ABORT_START = `${BUY_HEAD}
export const options = {
  // TODO: Theo's smoke test. Make it the stress staircase:
  //   100, 200, 300 VUs (30s ramp + 30s hold each), then down to 0 in 20s
  vus: 10,
  duration: '1m',
  thresholds: {
    checks: ['rate>0.99'],
    // TODO: stop the test early when this is crossed:
    //   [{ threshold: 'rate<0.05', abortOnFail: true }]
    'http_req_failed{name:checkout}': ['rate<0.05'],
  },
};

${BUY_JOURNEY}`

const P21_ABORT_SOL = `${BUY_HEAD}
export const options = {
${STRESS_STAGES}
  thresholds: {
    checks: ['rate>0.99'],
    'http_req_failed{name:checkout}': [{ threshold: 'rate<0.05', abortOnFail: true }],
  },
};

${BUY_JOURNEY}`

// ───────────────────────── P2.2 scripts (soak)

const SOAK_HEAD = `import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';
`

const SOAK_BODY = `export default function () {
  http.get(BASE + '/events', { tags: { name: 'events' } });
  sleep(1);
  http.get(BASE + '/events/1', { tags: { name: 'event' } });
  sleep(1);
  const seats = http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
  check(seats, { 'seats 200': (r) => r.status === 200 });
  sleep(1);
}
`

const SOAK_THRESHOLDS = `  thresholds: {
    http_req_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.01'],
  },`

const P22_SHORT_START = `${SOAK_HEAD}
export const options = {
  stages: [
    { duration: '1m', target: 40 },
    { duration: '2m', target: 40 }, // TODO: hold for 30m instead of 2m
    { duration: '30s', target: 0 },
  ],
${SOAK_THRESHOLDS}
};

${SOAK_BODY}`

const P22_SOAK_30 = `${SOAK_HEAD}
export const options = {
  stages: [
    { duration: '1m', target: 40 },
    { duration: '30m', target: 40 },
    { duration: '30s', target: 0 },
  ],
${SOAK_THRESHOLDS}
};

${SOAK_BODY}`

const NIGHT_STAGES = `  stages: [
    { duration: '2m', target: 40 },
    { duration: '1h', target: 40 }, // 8 hours in real life
    { duration: '1m', target: 0 },
  ],`

const P22_NIGHT_START = `${SOAK_HEAD}
export const options = {
${NIGHT_STAGES}
  // TODO: thresholds for the overnight soak:
  //   http_req_duration: p95 under 400 ms and p99 under 800 ms
  //   http_req_failed: under 1%, and stop the test early if crossed (abortOnFail)
};

${SOAK_BODY}`

const P22_NIGHT_SOL = `${SOAK_HEAD}
export const options = {
${NIGHT_STAGES}
  thresholds: {
    http_req_duration: ['p(95)<400', 'p(99)<800'],
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }],
  },
};

${SOAK_BODY}`

// ───────────────────────── P2.3 scripts (real data)

const D_STAGES = `  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '20s', target: 0 },
  ],`

const D_OPTIONS = `export const options = {
${D_STAGES}
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};`

const D_BUY = `  const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + login.json('token') };
  sleep(1);
  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  check(cart, { 'cart created': (r) => r.status === 201 });
  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });
  check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });
  sleep(1);
}
`

const P23_USERS_START = `import http from 'k6/http';
import { check, sleep } from 'k6';
// TODO: import { SharedArray } from 'k6/data';

const BASE = 'https://api.stagedoor.test';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

// TODO: load the 200 fans once, here in the init code:
//   const users = new SharedArray('fans', () => JSON.parse(open('./users.json')));

${D_OPTIONS}

export default function () {
  // TODO: every VU is the same fan. Pick one per VU: users[(__VU - 1) % users.length]
  const fan = { username: 'fan001', password: 'pass001' };
  const login = http.post(BASE + '/auth/login', JSON.stringify(fan), { headers: JSON_HEADERS, tags: { name: 'login' } });
  check(login, { 'logged in': (r) => r.status === 200 });
${D_BUY}`

const P23_USERS_SOL = `import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const BASE = 'https://api.stagedoor.test';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

const users = new SharedArray('fans', () => JSON.parse(open('./users.json')));

${D_OPTIONS}

export default function () {
  const fan = users[(__VU - 1) % users.length];
  const login = http.post(BASE + '/auth/login', JSON.stringify(fan), { headers: JSON_HEADERS, tags: { name: 'login' } });
  check(login, { 'logged in': (r) => r.status === 200 });
${D_BUY}`

const D_HEAD = `import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE = 'https://api.stagedoor.test';
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const users = new SharedArray('fans', () => JSON.parse(open('./users.json')));
`

const D_LOGIN = `  const fan = users[(__VU - 1) % users.length];
  const login = http.post(BASE + '/auth/login', JSON.stringify(fan), { headers: JSON_HEADERS, tags: { name: 'login' } });
  check(login, { 'logged in': (r) => r.status === 200 });
  const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + login.json('token') };
`

const P23_CORR_START = `${D_HEAD}
${D_OPTIONS}

export default function () {
${D_LOGIN}
  const list = http.get(BASE + '/events', { tags: { name: 'events' } });
  // TODO: pick a real show from the list: randomItem(list.json())
  const show = { id: 7, priceFrom: 1499 }; // last season's show
  sleep(1);

  http.get(BASE + '/events/' + show.id + '/seats', { tags: { name: 'seats' } });
  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: show.id, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  check(cart, { 'cart total is right': (r) => r.json('total') === show.priceFrom * 2 });

  // TODO: send the cartId from the cart response, not 'c1'
  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: 'c1' }), { headers: auth, tags: { name: 'checkout' } });
  check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });
  sleep(1);
}
`

const P23_CORR_SOL = `${D_HEAD}
${D_OPTIONS}

export default function () {
${D_LOGIN}
  const list = http.get(BASE + '/events', { tags: { name: 'events' } });
  const show = randomItem(list.json());
  sleep(1);

  http.get(BASE + '/events/' + show.id + '/seats', { tags: { name: 'seats' } });
  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: show.id, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  check(cart, { 'cart total is right': (r) => r.json('total') === show.priceFrom * 2 });

  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });
  check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });
  sleep(1);
}
`

const P23_SETUP_START = `${D_HEAD}
${D_OPTIONS}

// TODO: add export function setup() { ... } that fetches the list once
//   and returns { eventId: show.id }

export default function () {
  // TODO: move these two lines into setup(), then use data.eventId below
  const list = http.get(BASE + '/events', { tags: { name: 'events' } });
  const show = list.json().find((e) => e.name.includes('Arijit'));

${D_LOGIN}  sleep(1);
  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: show.id, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  check(cart, { 'cart created': (r) => r.status === 201 });
  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });
  check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });
  sleep(1);
}
`

const P23_SETUP_SOL = `${D_HEAD}
${D_OPTIONS}

export function setup() {
  const list = http.get(BASE + '/events', { tags: { name: 'events' } });
  const show = list.json().find((e) => e.name.includes('Arijit'));
  return { eventId: show.id };
}

export default function (data) {
${D_LOGIN}  sleep(1);
  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: data.eventId, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  check(cart, { 'cart created': (r) => r.status === 201 });
  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });
  check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });
  sleep(1);
}
`

const M_HEAD = `import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend, Counter } from 'k6/metrics';

const BASE = 'https://api.stagedoor.test';
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const users = new SharedArray('fans', () => JSON.parse(open('./users.json')));
`

const M_STAGES = `  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '20s', target: 0 },
  ],`

const P23_METRICS_START = `${M_HEAD}
// TODO: create the metrics here, in the init code:
//   a Trend 'checkout_time' (a time, so pass true) and a Counter 'orders'

export const options = {
${M_STAGES}
  thresholds: {
    checks: ['rate>0.99'],
    // TODO: checkout_time p95 under 800 ms, orders count over 2000
  },
};

export default function () {
  const fan = users[(__VU - 1) % users.length];

  // TODO: wrap the login step in group('login', () => { ... })
  const login = http.post(BASE + '/auth/login', JSON.stringify(fan), { headers: JSON_HEADERS, tags: { name: 'login' } });
  check(login, { 'logged in': (r) => r.status === 200 });
  const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + login.json('token') };
  sleep(1);

  // TODO: wrap the cart step in group('cart', () => { ... })
  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  check(cart, { 'cart created': (r) => r.status === 201 });

  // TODO: wrap the checkout step in group('checkout', () => { ... })
  //   then add its duration to checkout_time, and 1 to orders when it is confirmed
  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });
  check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });
  sleep(1);
}
`

const P23_METRICS_SOL = `${M_HEAD}
const checkoutTime = new Trend('checkout_time', true);
const orders = new Counter('orders');

export const options = {
${M_STAGES}
  thresholds: {
    checks: ['rate>0.99'],
    checkout_time: ['p(95)<800'],
    orders: ['count>2000'],
  },
};

export default function () {
  const fan = users[(__VU - 1) % users.length];
  let auth;
  group('login', () => {
    const login = http.post(BASE + '/auth/login', JSON.stringify(fan), { headers: JSON_HEADERS, tags: { name: 'login' } });
    check(login, { 'logged in': (r) => r.status === 200 });
    auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + login.json('token') };
  });
  sleep(1);

  let cartId;
  group('cart', () => {
    const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
    check(cart, { 'cart created': (r) => r.status === 201 });
    cartId = cart.json('cartId');
  });

  group('checkout', () => {
    const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cartId }), { headers: auth, tags: { name: 'checkout' } });
    const ok = check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });
    checkoutTime.add(co.timings.duration);
    if (ok) orders.add(1);
  });
  sleep(1);
}
`

const GATEWAY_500: { en: string; mr: string } = { en: 'Checkouts fail with 500 when the payment gateway is busy', mr: 'payment gateway busy असताना checkouts 500 देऊन fail होतात' }

export const pfProLessonsA: Lesson[] = [
  // ───────────────────────── P2.1 Stress and spike tests
  {
    id: 'pf2-1',
    code: 'P2.1',
    level: 'intermediate',
    title: { en: 'Stress and spike tests: find the breaking point', mr: 'Stress आणि spike tests: server कुठे मोडतो ते शोधा' },
    skill: 'stress stages, spike stages, reading the breaking point, graceful 503s, abortOnFail',
    realLife: {
      place: 'themepark',
      title: { en: 'The giant wheel on a Diwali holiday', mr: 'दिवाळीच्या सुट्टीतला मोठा पाळणा' },
      story: {
        en: 'At the jatra in our village, the giant wheel takes 40 people every 5 minutes. Shinde kaka, who runs it, knows his numbers. With 20 people waiting, nobody waits long. With 40, each round goes full. With 100, the wheel still carries 40 every 5 minutes, because it simply cannot turn faster, so the wait grows to 15 minutes, then half an hour. That point, where every round is full and only the queue grows, is his limit. Then at 4 pm a school trip of 300 children arrives at once. A wise kaka hands out time tokens: "Your class rides at 5:30, go and eat bhel." A careless one lets them all stand in the sun until someone faints.',
        mr: 'आमच्या गावच्या जत्रेत मोठा पाळणा दर 5 मिनिटांनी 40 लोकांना फिरवतो. तो चालवणारे शिंदे काका त्यांचे आकडे ओळखून आहेत. 20 लोक थांबले असतील तर कोणालाच फार थांबावं लागत नाही. 40 असतील तर प्रत्येक फेरी भरून जाते. 100 असतील तरी पाळणा दर 5 मिनिटांनी 40 च लोक नेतो, कारण तो यापेक्षा जोरात फिरूच शकत नाही, म्हणून वाट 15 मिनिटं, मग अर्धा तास होते. जिथे प्रत्येक फेरी भरलेली असते आणि फक्त रांग वाढत जाते, ती त्यांची मर्यादा. मग दुपारी 4 वाजता 300 मुलांची शाळेची सहल एकदम येते. शहाणे काका वेळेचे tokens देतात: "तुमचा वर्ग 5:30 ला बसेल, तोपर्यंत भेळ खा." बेफिकीर काका सगळ्यांना उन्हात उभं ठेवतात, कोणीतरी चक्कर येऊन पडेपर्यंत.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🙂', label: '20 people: hardly any wait', mr: '20 लोक: जवळजवळ थांबायला लागत नाही' },
          { icon: '🎡', label: '40 people: every round full', mr: '40 लोक: प्रत्येक फेरी भरलेली' },
          { icon: '⏳', label: '100 people: still 40 a round, the wait grows (the limit)', mr: '100 लोक: तरी फेरीला 40 च, वाट वाढते (मर्यादा)' },
          { icon: '🚌', label: '300 children at once (spike)', mr: 'एकदम 300 मुलं (spike)' },
          { icon: '🎟️', label: 'Time tokens: a quick, polite "come back later"', mr: 'वेळेचे tokens: पटकन, नम्र "नंतर या"' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'The stadium tour goes on sale next month. Ten cities, one huge opening sale. Rex, I need one answer for the organisers: will it hold, yes or no?', mr: 'stadium tour ची विक्री पुढच्या महिन्यात सुरू होते. दहा शहरं, एक प्रचंड opening sale. Rex, organisers साठी मला एकच उत्तर हवंय: टिकेल का, हो की नाही?' } },
        { who: 'theo', mood: 'neutral', text: { en: 'And I need more than yes or no. At how many fans does it start to struggle, and what gives up first? Then I know what to fix.', mr: 'आणि मला हो-नाही पेक्षा जास्त हवंय. किती fans वर त्याला त्रास सुरू होतो, आणि आधी काय हार मानतं? मग मला कळेल काय दुरुस्त करायचं.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Then we stop at nothing. We climb in steps, 100, 200, 300 fans, past the expected crowd, until StageDoor shows its limit. And we throw a sudden wall of fans at it, to see if it falls over or says "please wait".', mr: 'मग आपण थांबायचंच नाही. पायरी पायरीने चढायचं, 100, 200, 300 fans, अपेक्षित गर्दीच्या पुढे, StageDoor त्याची मर्यादा दाखवेपर्यंत. आणि अचानक fans ची भिंत त्याच्यावर सोडायची, तो कोसळतो की "थांबा जरा" म्हणतो ते पाहायला.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> cute staircase. i don\'t climb stairs. i arrive all at once. ⌁', mr: '>> गोड जिना आहे. मी जिने चढत नाही. मी एकदमच येतो. ⌁' } },
        { who: 'meera', mood: 'happy', text: { en: '{name}, you read the chart this time. Find the point where it bends, and tell Theo exactly where it is.', mr: '{name}, या वेळी chart तुम्ही वाचायचा. जिथे तो वाकतो ती जागा शोधा, आणि ती नेमकी कुठे आहे ते Theo ला सांगा.' } },
      ],
      problem: { en: 'A load test at the expected crowd only says "it works today". It cannot say how much room is left, what breaks first, or how the server behaves when overloaded: slows down politely, says "busy" quickly, or hangs and drags everything down. A tour sale with a surprise crowd needs those answers before the day.', mr: 'अपेक्षित गर्दीवरची load test फक्त "आज चालतंय" एवढंच सांगते. अजून किती जागा उरली आहे, आधी काय मोडतं, किंवा जास्त भार आल्यावर server कसा वागतो हे ती सांगू शकत नाही: नम्रपणे हळू होतो, पटकन "busy" सांगतो, की अडकून बसतो आणि सगळ्यालाच खाली ओढतो. अनपेक्षित गर्दी येणाऱ्या tour sale ला ही उत्तरं त्या दिवसाच्या आधी हवीत.' },
      solution: { en: 'A stress test climbs in steps past the expected load and holds each step, so the chart shows where p95 bends upward and requests per second stop growing: the breaking point. A spike test jumps from a few users to many in seconds and back, to see if the server survives and recovers. abortOnFail stops a run that has already failed, so nobody waits for the end of a hopeless test.', mr: 'stress test अपेक्षित load च्या पुढे पायरी पायरीने चढते आणि प्रत्येक पायरीवर थांबते, म्हणजे chart दाखवतो की p95 कुठे वर वळतो आणि requests per second वाढायचे कुठे थांबतात: तोच breaking point. spike test काही सेकंदांत थोड्या users वरून खूप users वर उडी मारते आणि परत येते, server टिकतो का आणि सावरतो का ते पाहायला. abortOnFail आधीच fail झालेली test थांबवतं, म्हणजे निकाल ठरलेल्या test च्या शेवटाची कोणी वाट पाहत बसत नाही.' },
    },
    lesson: [
      { en: 'Three tests, one tool. A load test checks the expected crowd (you did that in P1.5). A stress test keeps going past it, step by step, to find the limit. A spike test throws a sudden crowd at the server and takes it away again. In k6 all three are just different stages. Stress: climb, hold, climb, hold, so each step gets a flat part you can read. Spike: a few VUs, a jump to many in 10 seconds, a short hold, a drop back, then a calm part to watch recovery.', mr: 'तीन tests, एकच साधन. load test अपेक्षित गर्दी तपासते (ते तुम्ही P1.5 मध्ये केलं). stress test त्याच्या पुढे पायरी पायरीने जात राहते, मर्यादा शोधायला. spike test server वर अचानक गर्दी सोडते आणि परत काढून घेते. k6 मध्ये तिन्ही फक्त वेगवेगळे stages आहेत. stress: चढा, थांबा, चढा, थांबा, म्हणजे प्रत्येक पायरीला वाचता येईल असा सपाट भाग मिळतो. spike: थोडे VUs, 10 सेकंदांत खूप VUs पर्यंत उडी, थोडा वेळ थांबणं, परत खाली, आणि मग सावरणं पाहायला शांत भाग.' },
      { en: 'Reading the breaking point: watch Requests/s and p95 together. While the server has room, more VUs means more requests per second, and p95 stays flat. At the limit, Requests/s stops growing; every extra VU just waits in the queue, so p95 climbs. On StageDoor the buyer journey reaches about 160 requests/s near 100 VUs. At 200 and 300 VUs it is still about 160, while p95 goes from 0.4 s to 1 s to 1.6 s. The limit is near 100 VUs, even though not one error appeared. The cause: 12 payment-gateway connections at about 0.26 s each serve about 46 checkouts per second, and every fan needs one.', mr: 'breaking point वाचणं: Requests/s आणि p95 एकत्र पाहा. server कडे जागा असेपर्यंत जास्त VUs म्हणजे सेकंदाला जास्त requests, आणि p95 सपाट राहतो. मर्यादेवर Requests/s वाढायचे थांबतात; प्रत्येक जास्तीचा VU फक्त रांगेत थांबतो, म्हणून p95 चढतो. StageDoor वर buyer journey सुमारे 100 VUs वर सेकंदाला सुमारे 160 requests पर्यंत पोहोचते. 200 आणि 300 VUs वरही ते सुमारे 160 च राहतात, तर p95 0.4 s वरून 1 s, मग 1.6 s होतो. एकही error आला नाही, तरी मर्यादा 100 VUs जवळ आहे. कारण: payment gateway चे 12 connections, प्रत्येकी सुमारे 0.26 s, सेकंदाला सुमारे 46 checkouts करू शकतात, आणि प्रत्येक fan ला एक लागतो.' },
      { en: 'Failing well. Every server breaks somewhere; the question is how. Graceful failure is a quick, honest "busy, try again" (HTTP 503 in a few milliseconds), and normal speed again as soon as the crowd drops. Bad failure is requests that hang for a minute and time out (fans hit refresh and add even more load), or 500 errors that lose orders. StageDoor sheds load: a request that would wait more than 8 seconds gets a 503 at once. And Theo\'s worst fear is the errors-under-load bug: when the payment gateway gets busy, 1 in 4 checkouts returns 500. A 10-VU smoke test never sees it; heavy checkout load does.', mr: 'चांगल्या प्रकारे fail होणं. प्रत्येक server कुठेतरी मोडतोच; प्रश्न असा आहे की कसा. graceful failure म्हणजे पटकन, प्रामाणिक "busy आहे, परत प्रयत्न करा" (काही milliseconds मध्ये HTTP 503), आणि गर्दी कमी होताच परत नेहमीचा वेग. वाईट failure म्हणजे एक मिनिट अडकून timeout होणाऱ्या requests (fans refresh दाबतात आणि load अजून वाढवतात), किंवा orders गमावणारे 500 errors. StageDoor load shed करतो: जी request 8 सेकंदांपेक्षा जास्त थांबेल तिला लगेच 503 मिळतो. आणि Theo ला सगळ्यात जास्त भीती errors-under-load bug ची आहे: payment gateway busy झाला की 4 पैकी 1 checkout 500 देतो. 10 VUs ची smoke test तो कधीच पाहत नाही; checkout वरचा मोठा load पाहतो.' },
      { en: 'Stop early when it is hopeless. A threshold can be an object: { threshold: \'rate<0.05\', abortOnFail: true }. k6 checks it while the test runs and stops the moment it is crossed. A 20-minute stress run that is already failing at minute one gives back 19 minutes, and stops hammering a shared test server. Then report like a tester: "Buyer journey saturates near 100 VUs (about 160 req/s, payment gateway pool). Spike to 600 VUs: slow, no errors, recovered in seconds."', mr: 'काही उपयोग नसेल तेव्हा लवकर थांबा. threshold एक object पण असू शकतो: { threshold: \'rate<0.05\', abortOnFail: true }. test चालू असतानाच k6 तो तपासतो आणि तो ओलांडला की लगेच थांबतो. पहिल्या मिनिटालाच fail होत असलेली 20 मिनिटांची stress run 19 मिनिटं परत देते, आणि सगळ्यांच्या shared test server वर मारा थांबतो. मग tester सारखा report करा: "buyer journey सुमारे 100 VUs वर saturate होते (सेकंदाला सुमारे 160 requests, payment gateway pool). 600 VUs चा spike: हळू, errors नाहीत, काही सेकंदांत सावरला."' },
    ],
    syntax: {
      template: "// stress: climb and hold, step by step\nstages: [\n  { duration: '30s', target: 100 },\n  { duration: '30s', target: 100 },\n  { duration: '30s', target: 200 },\n  { duration: '30s', target: 200 },\n  { duration: '20s', target: 0 },\n],\n\n// spike: calm, a sudden wall, calm again\nstages: [\n  { duration: '20s', target: 20 },\n  { duration: '10s', target: 600 },\n  { duration: '40s', target: 600 },\n  { duration: '10s', target: 20 },\n  { duration: '40s', target: 20 },\n],\n\nthresholds: {\n  'http_req_failed{name:checkout}': [{ threshold: 'rate<0.05', abortOnFail: true }],\n},",
      parts: [
        { code: "{ duration: '30s', target: 200 }, { duration: '30s', target: 200 }", means: { en: 'a stress step: climb to the next level, then hold it so the chart has a flat part to read', mr: 'stress ची एक पायरी: पुढच्या पातळीपर्यंत चढा, मग तिथे थांबा म्हणजे chart वर वाचण्यासाठी सपाट भाग मिळतो' } },
        { code: "{ duration: '10s', target: 600 }", means: { en: 'the spike: from 20 to 600 VUs in just 10 seconds', mr: 'spike: फक्त 10 सेकंदांत 20 वरून 600 VUs' } },
        { code: "{ duration: '40s', target: 20 }", means: { en: 'calm again after the spike: does p95 come back to normal? That is recovery', mr: 'spike नंतर परत शांत: p95 परत नेहमीसारखा होतो का? यालाच recovery म्हणतात' } },
        { code: "{ threshold: 'rate<0.05', abortOnFail: true }", means: { en: 'a threshold that stops the whole test as soon as it is crossed', mr: 'ओलांडला जाताच पूर्ण test थांबवणारा threshold' } },
      ],
      example: [
        { code: "{ duration: '2m', target: 2000 },", note: { en: 'step 1: the crowd Sam expects for the tour opening', mr: 'पायरी 1: tour opening साठी Sam ला अपेक्षित असलेली गर्दी' } },
        { code: "{ duration: '5m', target: 2000 },", note: { en: 'hold it: read p95 and Requests/s on the flat part', mr: 'तिथे थांबा: सपाट भागावर p95 आणि Requests/s वाचा' } },
        { code: "{ duration: '2m', target: 4000 },", note: { en: 'step 2: double the fans. Do the requests per second double too?', mr: 'पायरी 2: fans दुप्पट. सेकंदाच्या requests पण दुप्पट होतात का?' } },
        { code: "{ duration: '5m', target: 4000 },", note: { en: 'if Requests/s stays flat while p95 climbs, you have found the limit', mr: 'p95 चढत असताना Requests/s सपाट राहिले, तर मर्यादा सापडली' } },
        { code: "http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: true }],", note: { en: 'if 1 request in 10 fails, stop: we already know enough', mr: '10 पैकी 1 request fail झाली तर थांबा: आपल्याला पुरेसं कळलंय' } },
      ],
      pitfall: { en: 'A ramp with no holds mixes every load level together, so you cannot say at which VU count things went wrong. Hold each step. A stress test\'s thresholds should guard against bad failure (errors, wrong answers); do not demand a low p95 at three times the expected crowd. And never stress or spike production without written permission: you are trying to break it.', mr: 'थांबे नसलेल्या ramp मध्ये सगळ्या load पातळ्या मिसळून जातात, म्हणून कोणत्या VU संख्येवर बिघडलं ते सांगता येत नाही. प्रत्येक पायरीवर थांबा. stress test चे thresholds वाईट failure पासून (errors, चुकीची उत्तरं) रक्षण करायला हवेत; अपेक्षित गर्दीच्या तिप्पट गर्दीवर कमी p95 ची मागणी करू नका. आणि लेखी परवानगीशिवाय production वर कधीच stress किंवा spike चालवू नका: तुम्ही तो मोडायचा प्रयत्न करताय.' },
    },
    practice: {
      intro: { en: 'Today you push StageDoor past its comfort zone on purpose. Watch the live chart on the right and the Requests/s tile together: the story is in how the lines move with each other. Hidden builds will check your tests.', mr: 'आज तुम्ही मुद्दाम StageDoor ला त्याच्या आरामाच्या पलीकडे ढकलणार. उजवीकडचा live chart आणि Requests/s चा आकडा एकत्र पाहा: रेषा एकमेकांसोबत कशा हलतात त्यातच गोष्ट आहे. लपवलेले builds तुमच्या tests तपासतील.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'Rex climbs the buyer journey in steps: 50, 100, 150, 200 and 300 VUs, holding each step for 40 seconds. Press Run load test. During each flat part of the VU line, read the Requests/s tile and the p95 line. Where is StageDoor\'s breaking point?', mr: 'Rex buyer journey पायरी पायरीने चढवतो: 50, 100, 150, 200 आणि 300 VUs, प्रत्येक पायरीवर 40 सेकंद थांबत. Run load test दाबा. VU रेषेच्या प्रत्येक सपाट भागात Requests/s चा आकडा आणि p95 ची रेषा वाचा. StageDoor चा breaking point कुठे आहे?' },
          perfSandbox: { code: P21_STAIRS },
          options: [
            { en: 'Around 50 VUs: that is where p95 first goes above 300 ms', mr: 'सुमारे 50 VUs: तिथेच p95 पहिल्यांदा 300 ms च्या वर जातो' },
            { en: 'Around 100 VUs: after that Requests/s stays near 160 while p95 keeps climbing', mr: 'सुमारे 100 VUs: त्यानंतर Requests/s 160 जवळच राहतात आणि p95 चढत राहतो' },
            { en: 'Around 300 VUs: that is where p95 passes 1.5 s', mr: 'सुमारे 300 VUs: तिथे p95 1.5 s च्या पुढे जातो' },
            { en: 'There is no breaking point: not a single request failed', mr: 'breaking point नाहीच: एकही request fail झाली नाही' },
          ],
          correct: [1],
          explain: { en: 'At 50 VUs about 76 requests/s, at 100 about 150. Then 150, 200 and 300 VUs all give about 160 requests/s, while p95 goes 0.4 s, 0.7 s, 1 s, 1.6 s. More users, the same work done, a longer wait: the server is full. No error appeared, yet the limit is clear. Tell Theo: "The buyer journey saturates near 100 VUs, about 160 requests/s. Extra users only queue."', mr: '50 VUs वर सेकंदाला सुमारे 76 requests, 100 वर सुमारे 150. मग 150, 200 आणि 300 VUs, तिन्ही सुमारे 160 requests/s देतात, तर p95 0.4 s, 0.7 s, 1 s, 1.6 s होत जातो. users जास्त, काम तेवढंच, वाट जास्त: server भरलाय. एकही error आला नाही, तरी मर्यादा स्पष्ट आहे. Theo ला सांगा: "buyer journey सुमारे 100 VUs वर saturate होते, सेकंदाला सुमारे 160 requests. जास्तीचे users फक्त रांगेत थांबतात."' },
          hints: [
            { en: 'Write down Requests/s at each flat part of the VU line. When does it stop going up?', mr: 'VU रेषेच्या प्रत्येक सपाट भागावर Requests/s लिहून ठेवा. ते वाढायचे कधी थांबतात?' },
            { en: 'If the server had room, going from 100 to 200 VUs would double Requests/s. Does it?', mr: 'server कडे जागा असती तर 100 वरून 200 VUs केल्यावर Requests/s दुप्पट झाले असते. होतात का?' },
          ],
          successLine: { en: 'That bend is the most useful number in a stress report. Theo knows the room left now: none beyond about 100 fans doing this journey.', mr: 'तो वाक हा stress report मधला सगळ्यात उपयोगी आकडा आहे. आता Theo ला उरलेली जागा कळली: ही journey करणाऱ्या सुमारे 100 fans च्या पुढे काहीच नाही.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Turn Theo\'s steady 100-VU test into a stress test. Replace vus and duration with stages that climb in three steps: up to 100 VUs in 30s and hold 30s, up to 200 in 30s and hold 30s, up to 300 in 30s and hold 30s, then down to 0 in 20s. Keep the thresholds: under stress the server may get slow, but it must not start failing.', mr: 'Theo ची 100 VUs ची स्थिर test stress test मध्ये बदला. vus आणि duration च्या जागी तीन पायऱ्यांत चढणारे stages टाका: 30s मध्ये 100 VUs आणि 30s थांबा, 30s मध्ये 200 आणि 30s थांबा, 30s मध्ये 300 आणि 30s थांबा, मग 20s मध्ये 0. thresholds तसेच ठेवा: stress खाली server हळू होऊ शकतो, पण त्याने fail व्हायला सुरुवात करता कामा नये.' },
          starter: P21_STRESS_START,
          solution: P21_STRESS_SOL,
          requireThresholds: true,
          mustNotUse: [{ pattern: '\\bvus\\s*:', message: { en: 'Remove vus: the stages decide the number of VUs now.', mr: 'vus: काढून टाका: आता VUs ची संख्या stages ठरवतात.' } }],
          verify: [
            { check: (r) => peakTarget(r) >= 300, message: { en: 'The staircase should climb all the way to 300 VUs.', mr: 'जिना 300 VUs पर्यंत पूर्ण चढायला हवा.' } },
            { check: (r) => holds(r) >= 3, message: { en: 'Hold each step: after climbing to 100, 200 and 300, add a stage with the same target so the chart has a flat part to read.', mr: 'प्रत्येक पायरीवर थांबा: 100, 200 आणि 300 पर्यंत चढल्यावर तोच target असलेला stage टाका, म्हणजे chart वर वाचण्यासाठी सपाट भाग मिळेल.' } },
          ],
          mustCatch: [{ bug: 'errors-under-load', label: GATEWAY_500 }],
          hints: [
            { en: 'One step is two stages: one that climbs to the new target, and one that keeps the same target (the hold).', mr: 'एक पायरी म्हणजे दोन stages: एक नव्या target पर्यंत चढणारा, आणि एक तोच target ठेवणारा (hold).' },
            { en: 'Three steps make six stages, plus one to ramp down to 0. Remove vus and duration.', mr: 'तीन पायऱ्या म्हणजे सहा stages, आणि 0 पर्यंत उतरायला एक. vus आणि duration काढून टाका.' },
            { en: "stages: [\n  { duration: '30s', target: 100 },\n  { duration: '30s', target: 100 },\n  { duration: '30s', target: 200 },\n  { duration: '30s', target: 200 },\n  { duration: '30s', target: 300 },\n  { duration: '30s', target: 300 },\n  { duration: '20s', target: 0 },\n],", mr: "stages: [\n  { duration: '30s', target: 100 },\n  { duration: '30s', target: 100 },\n  { duration: '30s', target: 200 },\n  { duration: '30s', target: 200 },\n  { duration: '30s', target: 300 },\n  { duration: '30s', target: 300 },\n  { duration: '20s', target: 0 },\n]," },
          ],
          successLine: { en: 'Three readable steps, zero errors on the healthy build, and the hidden build with checkout 500s failed your thresholds. That is a stress test with the right guard rails.', mr: 'वाचता येतील अशा तीन पायऱ्या, निरोगी build वर शून्य errors, आणि checkout वर 500 देणाऱ्या लपवलेल्या build वर तुमचे thresholds fail झाले. योग्य कठडे असलेली stress test हीच.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'The Gremlin promised a sudden rush. Build a spike test: ramp to 20 VUs in 20s and hold 20s, then jump to 600 VUs in just 10s, hold 600 for 40s, drop back to 20 in 10s, and hold 20 for 40s to watch the recovery. Replace the three calm stages that are there now.', mr: 'Gremlin ने अचानक गर्दीचं वचन दिलंय. spike test बनवा: 20s मध्ये 20 VUs आणि 20s थांबा, मग फक्त 10s मध्ये 600 VUs वर उडी, 600 वर 40s थांबा, 10s मध्ये परत 20 वर, आणि recovery पाहायला 20 वर 40s थांबा. आत्ता असलेले तीन शांत stages बदला.' },
          starter: P21_SPIKE_START,
          solution: P21_SPIKE_SOL,
          requireThresholds: true,
          verify: [
            { check: (r) => peakTarget(r) >= 500, message: { en: 'The spike should reach 600 VUs.', mr: 'spike 600 VUs पर्यंत पोहोचायला हवा.' } },
            { check: spikeIsSudden, message: { en: 'A spike is sudden: go from 20 VUs to 600 in 10 seconds, right after the calm start.', mr: 'spike अचानक असतो: शांत सुरुवातीनंतर लगेच 10 सेकंदांत 20 वरून 600 VUs.' } },
            { check: spikeRecovers, message: { en: 'After the peak, drop back to 20 VUs and stay there for at least 30 seconds, so you can see if the server recovers.', mr: 'शिखरानंतर परत 20 VUs वर या आणि किमान 30 सेकंद तिथे राहा, म्हणजे server सावरतो का ते दिसेल.' } },
          ],
          mustCatch: [{ bug: 'errors-under-load', label: GATEWAY_500 }],
          hints: [
            { en: 'Six stages: calm up, calm hold, jump, peak hold, drop, calm hold.', mr: 'सहा stages: शांत चढ, शांत थांबा, उडी, शिखरावर थांबा, उतार, शांत थांबा.' },
            { en: "The jump is one short stage: { duration: '10s', target: 600 }.", mr: "उडी म्हणजे एक छोटा stage: { duration: '10s', target: 600 }." },
            { en: "stages: [\n  { duration: '20s', target: 20 },\n  { duration: '20s', target: 20 },\n  { duration: '10s', target: 600 },\n  { duration: '40s', target: 600 },\n  { duration: '10s', target: 20 },\n  { duration: '40s', target: 20 },\n],", mr: "stages: [\n  { duration: '20s', target: 20 },\n  { duration: '20s', target: 20 },\n  { duration: '10s', target: 600 },\n  { duration: '40s', target: 600 },\n  { duration: '10s', target: 20 },\n  { duration: '40s', target: 20 },\n]," },
          ],
          successLine: { en: 'Look at the chart: p95 jumps to about 4.5 s at the peak, then falls back to about 350 ms within seconds of the drop. No errors. StageDoor bends, but it does not break, and it recovers.', mr: 'chart पाहा: शिखरावर p95 सुमारे 4.5 s पर्यंत उडतो, आणि गर्दी उतरल्यावर काही सेकंदांत परत सुमारे 350 ms वर येतो. errors नाहीत. StageDoor वाकतो, पण मोडत नाही, आणि सावरतो.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Rex pushes the spike to 1000 VUs, on the healthy build. The script also measures how long the refused requests took: \'http_req_duration{status:503}\'. Press Run load test, watch where the red error bars appear, then read the summary. How did StageDoor fail?', mr: 'Rex निरोगी build वरच spike 1000 VUs पर्यंत नेतो. नाकारलेल्या requests ना किती वेळ लागला तेही script मोजते: \'http_req_duration{status:503}\'. Run load test दाबा, लाल error bars कुठे येतात ते पाहा, मग summary वाचा. StageDoor कसा fail झाला?' },
          perfSandbox: { code: P21_SPIKE_1000 },
          options: [
            { en: 'It crashed: errors started at the spike and never stopped, even after the crowd left', mr: 'तो crash झाला: spike ला errors सुरू झाले आणि गर्दी गेल्यावरही थांबले नाहीत' },
            { en: 'It hung: the failed requests waited about a minute and then timed out', mr: 'तो अडकला: fail झालेल्या requests सुमारे एक मिनिट थांबल्या आणि मग timeout झाल्या' },
            { en: 'Gracefully: at the peak some requests got a 503 back in under 30 ms, and once the crowd dropped the errors stopped and p95 went back to about 380 ms', mr: 'gracefully: शिखरावर काही requests ना 30 ms च्या आत 503 परत मिळाला, आणि गर्दी उतरताच errors थांबले आणि p95 परत सुमारे 380 ms वर आला' },
            { en: 'It returned 500 errors on checkout because of a code bug', mr: 'code मधल्या bug मुळे त्याने checkout वर 500 errors दिले' },
          ],
          correct: [2],
          explain: { en: 'The red bars appear only at the peak, and they are 503s: StageDoor refuses at once any request it could not start within 8 seconds ({ status:503 } max is about 28 ms). After the drop, p95 is back near 380 ms. That is good failure: the app can show "High demand, retrying in a moment" instead of a spinning wheel. Now Sam gets a real answer: "Up to 600 fans arriving at once: slow but fine. At 1000: about 5.6% of requests get a quick retry message."', mr: 'लाल bars फक्त शिखरावर येतात, आणि ते 503 आहेत: जी request 8 सेकंदांत सुरू होऊ शकली नसती ती StageDoor लगेच नाकारतो ({ status:503 } चा max सुमारे 28 ms). उतारानंतर p95 परत 380 ms जवळ येतो. हे चांगलं failure आहे: फिरत्या चक्राऐवजी app "खूप मागणी आहे, थोड्याच वेळात परत प्रयत्न करतोय" दाखवू शकतं. आता Sam ला खरं उत्तर मिळतं: "एकदम येणारे 600 fans पर्यंत: हळू पण ठीक. 1000 वर: सुमारे 5.6% requests ना पटकन retry चा संदेश मिळतो."' },
          hints: [
            { en: 'Where are the red bars on the chart: everywhere, or only while the VU line is at the top?', mr: 'chart वर लाल bars कुठे आहेत: सगळीकडे, की फक्त VU रेषा शिखरावर असताना?' },
            { en: 'In the summary, find the { status:503 } line under http_req_duration. How long did a 503 take?', mr: 'summary मध्ये http_req_duration खालची { status:503 } ओळ शोधा. एका 503 ला किती वेळ लागला?' },
          ],
          successLine: { en: 'Fast no, quick recovery. Theo adds a "waiting room" message for 503s, so fans see a friendly screen instead of an error.', mr: 'पटकन नकार, लवकर सावरणं. Theo 503 साठी "waiting room" चा संदेश जोडतो, म्हणजे fans ना error ऐवजी मैत्रीपूर्ण screen दिसतो.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Theo\'s new build passed his 10-VU smoke test and he wants to ship it. You suspect checkout breaks only under heavy load. Turn the smoke test into the stress staircase (100, 200, 300 VUs, 30s ramp and 30s hold each, then down to 0 in 20s), and make the checkout error threshold stop the test early: [{ threshold: \'rate<0.05\', abortOnFail: true }]. On this build the run should stop by itself within the first minute.', mr: 'Theo चा नवा build त्याच्या 10 VUs च्या smoke test मध्ये pass झाला आणि त्याला तो ship करायचाय. तुम्हाला शंका आहे की checkout फक्त मोठ्या load खाली मोडतो. smoke test ला stress जिन्यात बदला (100, 200, 300 VUs, प्रत्येकी 30s ramp आणि 30s hold, मग 20s मध्ये 0), आणि checkout चा error threshold test लवकर थांबवेल असा करा: [{ threshold: \'rate<0.05\', abortOnFail: true }]. या build वर run पहिल्या मिनिटातच आपोआप थांबायला हवी.' },
          starter: P21_ABORT_START,
          solution: P21_ABORT_SOL,
          build: ['errors-under-load'],
          expectFailure: true,
          requireThresholds: true,
          verify: [
            { check: (r) => peakTarget(r) >= 300, message: { en: 'Use the stress staircase up to 300 VUs. At 10 VUs the payment gateway is never busy, so the bug hides.', mr: '300 VUs पर्यंतचा stress जिना वापरा. 10 VUs वर payment gateway कधीच busy होत नाही, म्हणून bug लपून राहतो.' } },
            { check: (r) => Boolean(r.abortedBy), message: { en: 'The test ran to the end. Write the checkout threshold as an object with abortOnFail: true, so k6 stops as soon as it is crossed.', mr: 'test शेवटपर्यंत चालली. checkout चा threshold abortOnFail: true असलेला object म्हणून लिहा, म्हणजे तो ओलांडताच k6 थांबेल.' } },
          ],
          hints: [
            { en: 'Two changes: stages in place of vus and duration, and the checkout threshold as an object inside the array.', mr: 'दोन बदल: vus आणि duration च्या जागी stages, आणि checkout चा threshold array मध्ये object म्हणून.' },
            { en: "'http_req_failed{name:checkout}': [{ threshold: 'rate<0.05', abortOnFail: true }],", mr: "'http_req_failed{name:checkout}': [{ threshold: 'rate<0.05', abortOnFail: true }]," },
            { en: "stages: [\n  { duration: '30s', target: 100 },\n  { duration: '30s', target: 100 },\n  { duration: '30s', target: 200 },\n  { duration: '30s', target: 200 },\n  { duration: '30s', target: 300 },\n  { duration: '30s', target: 300 },\n  { duration: '20s', target: 0 },\n],\nthresholds: {\n  checks: ['rate>0.99'],\n  'http_req_failed{name:checkout}': [{ threshold: 'rate<0.05', abortOnFail: true }],\n},", mr: "stages: [\n  { duration: '30s', target: 100 },\n  { duration: '30s', target: 100 },\n  { duration: '30s', target: 200 },\n  { duration: '30s', target: 200 },\n  { duration: '30s', target: 300 },\n  { duration: '30s', target: 300 },\n  { duration: '20s', target: 0 },\n],\nthresholds: {\n  checks: ['rate>0.99'],\n  'http_req_failed{name:checkout}': [{ threshold: 'rate<0.05', abortOnFail: true }],\n}," },
          ],
          successLine: { en: 'Stopped after about 20 seconds, at around 50 VUs: more than 5% of checkouts were already failing with 500. The smoke test saw 1 failure in 234. Your report to Theo: "errors-under-load: checkout returns 500 once the payment gateway gets busy, from about 40 to 50 VUs. abortOnFail stopped the run at 20 s."', mr: 'सुमारे 20 सेकंदांनी, सुमारे 50 VUs वर थांबली: 5% पेक्षा जास्त checkouts आधीच 500 देऊन fail होत होते. smoke test ने 234 पैकी फक्त 1 failure पाहिलं. Theo साठी तुमचा report: "errors-under-load: payment gateway busy होताच, सुमारे 40 ते 50 VUs पासून, checkout 500 देतो. abortOnFail ने run 20 s वर थांबवली."' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Stress results on the healthy build, holding each step: 100 VUs: 150 req/s, p95 0.4 s. 200 VUs: 160 req/s, p95 1 s. 400 VUs: 160 req/s, p95 2.2 s. 0% errors. What do you report?', mr: 'निरोगी build वरचे stress निकाल, प्रत्येक पायरीवर थांबून: 100 VUs: 150 req/s, p95 0.4 s. 200 VUs: 160 req/s, p95 1 s. 400 VUs: 160 req/s, p95 2.2 s. 0% errors. तुम्ही काय report कराल?' },
        options: [
          { en: 'No breaking point was found, because there were no errors', mr: 'breaking point सापडला नाही, कारण errors नव्हते' },
          { en: 'The system saturates near 100 VUs: throughput stops growing, and extra users only wait longer', mr: 'system सुमारे 100 VUs वर saturate होते: throughput वाढायचा थांबतो, आणि जास्तीचे users फक्त जास्त वेळ थांबतात' },
          { en: 'k6 cannot send more than 160 requests per second', mr: 'k6 सेकंदाला 160 पेक्षा जास्त requests पाठवू शकत नाही' },
          { en: 'The server is fine up to 400 VUs, since p95 is still under 3 s', mr: 'server 400 VUs पर्यंत ठीक आहे, कारण p95 अजून 3 s च्या आत आहे' },
        ],
        answer: 1,
        explain: { en: 'Doubling the users did not raise the requests per second; it only raised the waiting. That bend is the breaking point, even with zero errors.', mr: 'users दुप्पट केल्यावर सेकंदाच्या requests वाढल्या नाहीत; फक्त थांबणं वाढलं. तोच वाक breaking point आहे, शून्य errors असले तरी.' },
      },
      {
        q: { en: 'Which stages describe a spike test?', mr: 'कोणते stages spike test दाखवतात?' },
        options: [
          "[{ duration: '5m', target: 50 }, { duration: '30m', target: 50 }, { duration: '5m', target: 0 }]",
          "[{ duration: '2m', target: 100 }, { duration: '2m', target: 200 }, { duration: '2m', target: 300 }, { duration: '2m', target: 400 }]",
          "[{ duration: '30s', target: 10 }]",
          "[{ duration: '1m', target: 20 }, { duration: '10s', target: 800 }, { duration: '1m', target: 800 }, { duration: '10s', target: 20 }, { duration: '2m', target: 20 }]",
        ],
        answer: 3,
        explain: { en: 'A spike is a sudden jump (20 to 800 in 10 seconds), a short hold, a drop, and a calm part to watch recovery. The first is a long steady test, the second a climb, the third a tiny smoke test.', mr: 'spike म्हणजे अचानक उडी (10 सेकंदांत 20 वरून 800), थोडा वेळ थांबणं, उतार, आणि recovery पाहायला शांत भाग. पहिला लांब स्थिर test आहे, दुसरा चढ, तिसरा छोटी smoke test.' },
      },
      {
        q: { en: 'Under overload, which behaviour is graceful failure?', mr: 'जास्त भार असताना कोणतं वागणं graceful failure आहे?' },
        options: [
          { en: 'Extra requests get a 503 within milliseconds, and response times return to normal soon after the crowd drops', mr: 'जास्तीच्या requests ना काही milliseconds मध्ये 503 मिळतो, आणि गर्दी कमी झाल्यावर लवकरच response times नेहमीसारखे होतात' },
          { en: 'Requests wait 60 seconds and then time out, so the server never has to say no', mr: 'requests 60 सेकंद थांबतात आणि मग timeout होतात, म्हणजे server ला कधीच नाही म्हणावं लागत नाही' },
          { en: 'The server returns 200 with an empty page', mr: 'server रिकाम्या page सह 200 देतो' },
          { en: 'The server restarts itself and loses the carts in progress', mr: 'server स्वतःच restart होतो आणि चालू असलेले carts गमावतो' },
        ],
        answer: 0,
        explain: { en: 'A fast, honest "busy" lets the app show a retry message and protects the users already being served. Hanging requests make fans refresh and add load; empty 200s and lost carts are worse than errors.', mr: 'पटकन, प्रामाणिक "busy" मुळे app retry चा संदेश दाखवू शकतं आणि आधीच सेवा मिळत असलेल्या users ना वाचवतं. अडकलेल्या requests मुळे fans refresh करतात आणि load वाढवतात; रिकामे 200 आणि गमावलेले carts तर errors पेक्षाही वाईट.' },
      },
      {
        q: { en: 'What does this threshold do?', mr: 'हा threshold काय करतो?' },
        code: "'http_req_failed{name:checkout}': [{ threshold: 'rate<0.05', abortOnFail: true }]",
        options: [
          { en: 'It retries failed checkouts up to 5 times', mr: 'तो fail झालेले checkouts 5 वेळा परत करून पाहतो' },
          { en: 'It ignores checkout failures until the test ends', mr: 'test संपेपर्यंत तो checkout failures कडे दुर्लक्ष करतो' },
          { en: 'If 5% or more of checkout requests fail, k6 stops the test early and marks it failed', mr: '5% किंवा जास्त checkout requests fail झाल्या, तर k6 test लवकर थांबवतो आणि fail ठरवतो' },
          { en: 'It aborts each checkout request that takes longer than 0.05 s', mr: '0.05 s पेक्षा जास्त वेळ घेणारी प्रत्येक checkout request तो रद्द करतो' },
        ],
        answer: 2,
        explain: { en: 'abortOnFail turns a threshold into an emergency stop: k6 evaluates it during the run and ends the test the moment it is crossed, with the threshold marked ✗.', mr: 'abortOnFail threshold ला emergency stop बनवतं: run चालू असतानाच k6 तो तपासतो आणि तो ओलांडला की लगेच test संपवतो, threshold ला ✗ देऊन.' },
      },
    ],
    recap: { line: { en: 'Stress: climb and hold in steps until requests per second stop growing and p95 climbs (the breaking point). Spike: a sudden wall of users and back, then watch recovery. Good failure is a fast 503; abortOnFail stops a hopeless run.', mr: 'stress: सेकंदाच्या requests वाढायच्या थांबून p95 चढेपर्यंत पायरी पायरीने चढा आणि थांबा (breaking point). spike: users ची अचानक भिंत आणि परत, मग recovery पाहा. चांगलं failure म्हणजे पटकन 503; abortOnFail निकाल ठरलेली run थांबवतं.' }, icon: '🧗' },
  },

  // ───────────────────────── P2.2 Soak tests
  {
    id: 'pf2-2',
    code: 'P2.2',
    level: 'intermediate',
    title: { en: 'Soak tests: the slow leak', mr: 'Soak tests: हळूहळू होणारी गळती' },
    skill: 'long steady load, early vs late p95, soak thresholds, overnight runs with abortOnFail',
    realLife: {
      place: 'home',
      title: { en: 'The water tank with a tiny leak', mr: 'बारीक गळती असलेली पाण्याची टाकी' },
      story: {
        en: 'The tank on our building terrace is filled every evening at 6. Last month Joshi kaka changed a valve. He filled the tank, watched it for two minutes, saw no drop, and went home happy. At 6 the next morning the whole building had no water for bathing. The leak was a drip, a few litres an hour, and it got worse as the valve loosened through the night. Two minutes could never show it. Now the watchman marks the water level at 10 pm and again at 5 am. Same tank, same valve, but now the check is as long as the problem.',
        mr: 'आमच्या building च्या गच्चीवरची टाकी रोज संध्याकाळी 6 वाजता भरते. मागच्या महिन्यात जोशी काकांनी एक valve बदलला. त्यांनी टाकी भरली, दोन मिनिटं पाहिली, पाणी कमी होताना दिसलं नाही, आणि खुशीत घरी गेले. दुसऱ्या दिवशी सकाळी 6 वाजता अख्ख्या building ला आंघोळीला पाणी नव्हतं. गळती म्हणजे एक ठिबक होती, तासाला काही लिटर, आणि रात्रभर valve सैल होत गेला तशी ती वाढत गेली. दोन मिनिटांत ती कधीच दिसली नसती. आता watchman रात्री 10 वाजता आणि परत पहाटे 5 वाजता पाण्याची पातळी लिहून ठेवतो. तीच टाकी, तोच valve, पण आता तपासणी समस्येइतकीच लांब आहे.',
      },
      scene: {
        type: 'tally',
        unit: 'L',
        alertBelow: 200,
        items: [
          { icon: '🚰', label: '6 pm: tank filled', mr: 'संध्या 6: टाकी भरली', value: 1000 },
          { icon: '👀', label: '6:02 pm: two-minute check, looks full', mr: 'संध्या 6:02: दोन मिनिटांची तपासणी, भरलेली दिसते', value: -2 },
          { icon: '🌙', label: '6 pm to midnight: a slow drip', mr: 'संध्या 6 ते मध्यरात्र: हळू ठिबक', value: -180 },
          { icon: '💧', label: 'Midnight to 4 am: the valve loosens', mr: 'मध्यरात्र ते पहाटे 4: valve सैल होतो', value: -350 },
          { icon: '🚿', label: '4 am to 6 am: morning baths', mr: 'पहाटे 4 ते 6: सकाळच्या आंघोळी', value: -400 },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'happy', text: { en: 'The opening sale survived the stress test. After that the tour sells steadily for three weeks. Same servers, no restarts. We are good, right?', mr: 'opening sale stress test मधून वाचला. त्यानंतर tour ची विक्री तीन आठवडे स्थिर चालते. तेच servers, restart नाही. आपण ठीक आहोत, बरोबर?' } },
        { who: 'theo', mood: 'neutral', text: { en: 'My new session cache passed a 2-minute load test this morning. All green.', mr: 'माझा नवा session cache आज सकाळी 2 मिनिटांच्या load test मध्ये pass झाला. सगळं हिरवं.' } },
        { who: 'rex', mood: 'worried', text: { en: 'Two minutes tells us about the first two minutes. Some problems grow with time: memory that is never freed, connections that are never returned, logs filling the disk. For those we run a soak test: normal load, for a long time.', mr: 'दोन मिनिटं आपल्याला फक्त पहिल्या दोन मिनिटांबद्दल सांगतात. काही समस्या वेळेसोबत वाढतात: कधीच मोकळी न होणारी memory, कधीच परत न येणारे connections, disk भरवणारे logs. त्यांच्यासाठी आपण soak test चालवतो: नेहमीचा load, खूप वेळ.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> no rush this time. i\'ll let the drip do the work. by week two, you\'re dry. ⌁', mr: '>> या वेळी घाई नाही. ठिबकच काम करेल. दुसऱ्या आठवड्यापर्यंत तुमची टाकी कोरडी. ⌁' } },
        { who: 'meera', mood: 'neutral', text: { en: 'So we run the same journey at a normal level: half an hour in the lab, a whole night before launch. Then we compare minute 3 with minute 30.', mr: 'म्हणून तीच journey नेहमीच्या पातळीवर चालवू: lab मध्ये अर्धा तास, launch आधी पूर्ण रात्र. मग मिनिट 3 ची तुलना मिनिट 30 शी करू.' } },
      ],
      problem: { en: 'A short test passes on a server that gets a little slower every minute. The trouble shows up on day three of the tour, at 2 am, when nobody is watching: pages take seconds, then requests start failing, and the only fix is a restart in the middle of the sale.', mr: 'दर मिनिटाला थोडा थोडा हळू होणाऱ्या server वर छोटी test pass होते. अडचण tour च्या तिसऱ्या दिवशी, रात्री 2 वाजता, कोणी पाहत नसताना दिसते: pages ना सेकंद लागतात, मग requests fail व्हायला लागतात, आणि sale च्या मधेच restart हाच एक उपाय उरतो.' },
      solution: { en: 'A soak test holds a moderate, realistic load for a long time (30 minutes in this lab, 8 to 12 hours in real teams) with the normal thresholds. On the chart, compare the p95 line early and late: on a healthy server it stays flat, on a leaking one it climbs steadily. abortOnFail stops a soak that is already failing, so the night is not wasted.', mr: 'soak test मध्यम, खऱ्यासारखा load खूप वेळ धरून ठेवते (या lab मध्ये 30 मिनिटं, खऱ्या teams मध्ये 8 ते 12 तास), नेहमीच्या thresholds सोबत. chart वर p95 ची रेषा सुरुवातीला आणि शेवटी तुलना करा: निरोगी server वर ती सपाट राहते, गळणाऱ्या server वर ती सतत चढत जाते. abortOnFail आधीच fail होत असलेली soak थांबवतं, म्हणजे रात्र वाया जात नाही.' },
    },
    lesson: [
      { en: 'A soak test (also called an endurance test) uses the same journey and the same thresholds as a normal load test, at a normal, steady level (often 50 to 80% of the expected peak), held for hours. It is not about the crowd; it is about time. It catches memory leaks, connection pools that slowly run dry, caches that grow without limit, disks filling with logs, and the 3 am cleanup job that slows everything down.', mr: 'soak test (हिला endurance test पण म्हणतात) नेहमीच्या load test सारखीच journey आणि तेच thresholds वापरते, नेहमीच्या, स्थिर पातळीवर (बहुतेकदा अपेक्षित शिखराच्या 50 ते 80%), तासन् तास. ती गर्दीबद्दल नाही; ती वेळेबद्दल आहे. ती memory leaks पकडते, हळूहळू रिकामे होणारे connection pools, मर्यादेशिवाय वाढणारे caches, logs ने भरणारी disk, आणि सगळं हळू करणारा पहाटे 3 चा cleanup job.' },
      { en: 'Reading a soak chart: ignore the ramp and look at the long flat part of the VU line. On the healthy StageDoor, p95 sits at about 160 ms from minute 2 to minute 30. On the memory-leak build it is about 290 ms near minute 3, about 550 ms near minute 11, past 1 s by minute 25, and around minute 16 the red error bars start: about 6% of requests fail. The VU line never moved. Same load, worse every minute: that is the fingerprint of a leak.', mr: 'soak chart वाचणं: ramp कडे दुर्लक्ष करा आणि VU रेषेचा लांब सपाट भाग पाहा. निरोगी StageDoor वर p95 मिनिट 2 पासून मिनिट 30 पर्यंत सुमारे 160 ms वर टिकून राहतो. memory-leak build वर तो मिनिट 3 जवळ सुमारे 290 ms, मिनिट 11 जवळ सुमारे 550 ms, मिनिट 25 पर्यंत 1 s च्या पुढे, आणि सुमारे मिनिट 16 ला लाल error bars सुरू होतात: सुमारे 6% requests fail होतात. VU रेषा कधीच हलली नाही. load तोच, दर मिनिटाला अजून वाईट: हीच leak ची ओळख.' },
      { en: 'Why short tests miss it: thresholds judge the whole run. In a 2-minute test the leak build only gets about 1.5 times slower, so p95 is about 240 ms and a 400 ms goal passes. In 30 minutes the slow later minutes dominate, overall p95 reaches about 890 ms, and the same goal fails. Same script, same thresholds; only the duration changed. Duration is part of the test design, not a detail.', mr: 'छोट्या tests ना ती का दिसत नाही: thresholds पूर्ण run चा निकाल देतात. 2 मिनिटांच्या test मध्ये leak build फक्त सुमारे 1.5 पट हळू होतो, म्हणून p95 सुमारे 240 ms येतो आणि 400 ms चं ध्येय pass होतं. 30 मिनिटांत नंतरची हळू मिनिटं वरचढ होतात, एकूण p95 सुमारे 890 ms पर्यंत जातो, आणि तेच ध्येय fail होतं. तीच script, तेच thresholds; फक्त duration बदलला. duration हा test design चा भाग आहे, किरकोळ तपशील नाही.' },
      { en: 'Soaks in real life take hours, so teams run them overnight or at weekends, on a production-like environment, before big releases; not on every commit. Use the normal SLA (p95, p99, error rate) plus abortOnFail on errors, so a broken build stops at minute 18 instead of running until morning. And ask the developers to watch server memory and connection counts during the run: k6 shows the symptom, server graphs show the cause.', mr: 'खऱ्या आयुष्यात soaks ना तास लागतात, म्हणून teams त्या रात्री किंवा weekend ला, production सारख्या environment वर, मोठ्या releases आधी चालवतात; प्रत्येक commit वर नाही. नेहमीचा SLA (p95, p99, error rate) वापरा, आणि errors वर abortOnFail, म्हणजे बिघडलेला build सकाळपर्यंत चालण्याऐवजी मिनिट 18 ला थांबेल. आणि run चालू असताना server ची memory आणि connections ची संख्या पाहायला developers ना सांगा: k6 लक्षण दाखवतो, server चे graphs कारण दाखवतात.' },
    ],
    syntax: {
      template: "export const options = {\n  stages: [\n    { duration: '2m', target: 40 },  // ramp up\n    { duration: '30m', target: 40 }, // the soak: steady, normal load\n    { duration: '1m', target: 0 },   // ramp down\n  ],\n  thresholds: {\n    http_req_duration: ['p(95)<400', 'p(99)<800'],\n    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }],\n  },\n};",
      parts: [
        { code: "{ duration: '30m', target: 40 }", means: { en: 'the long hold. 40 VUs is a normal evening, not the peak', mr: 'लांब hold. 40 VUs म्हणजे नेहमीची संध्याकाळ, शिखर नाही' } },
        { code: "['p(95)<400', 'p(99)<800']", means: { en: 'the normal SLA, judged over the whole long run', mr: 'नेहमीचा SLA, पूर्ण लांब run वर निकाल' } },
        { code: "{ threshold: 'rate<0.01', abortOnFail: true }", means: { en: 'stop the soak as soon as 1% or more of requests have failed', mr: '1% किंवा जास्त requests fail होताच soak थांबवा' } },
      ],
      example: [
        { code: "{ duration: '10m', target: 300 },", note: { en: 'evening traffic during the tour weeks builds up', mr: 'tour च्या आठवड्यांमधली संध्याकाळची गर्दी वाढते' } },
        { code: "{ duration: '8h', target: 300 },", note: { en: 'held all night, 11 pm to 7 am, while the office sleeps', mr: 'रात्रभर धरून ठेवलेली, रात्री 11 ते सकाळी 7, office झोपलेलं असताना' } },
        { code: "{ duration: '5m', target: 0 },", note: { en: 'morning: read the report over chai', mr: 'सकाळ: चहा घेत report वाचा' } },
        { code: "http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }],", note: { en: 'if it breaks at 2 am, stop and keep the logs', mr: 'रात्री 2 ला मोडलं तर थांबा आणि logs जपून ठेवा' } },
        { code: "'http_req_duration{name:seats}': ['p(95)<300'],", note: { en: 'the seat map must be as fast at 6 am as at midnight', mr: 'seat map सकाळी 6 ला पण मध्यरात्रीइतकाच जलद हवा' } },
      ],
      pitfall: { en: 'Do not soak at peak load: then you cannot tell a leak from plain overload. Keep the load steady and normal, so only time changes. And look at the shape, not only the final numbers: a p95 that climbs from 160 ms to 390 ms may still pass a 400 ms goal today, and fail tomorrow night.', mr: 'शिखराच्या load वर soak करू नका: मग leak आणि साधा जास्त भार यातला फरक कळत नाही. load स्थिर आणि नेहमीचा ठेवा, म्हणजे फक्त वेळ बदलेल. आणि फक्त शेवटचे आकडे नाही, आकार पाहा: 160 ms वरून 390 ms पर्यंत चढणारा p95 आज 400 ms चं ध्येय pass करेलही, आणि उद्या रात्री fail होईल.' },
    },
    practice: {
      intro: { en: 'Long tests, fast lab: a 30-minute soak plays back here in about a second. Always compare the beginning of the chart with the end.', mr: 'लांब tests, जलद lab: इथे 30 मिनिटांची soak सुमारे एका सेकंदात चालते. नेहमी chart ची सुरुवात शेवटाशी तुलना करा.' },
      steps: [
        {
          kind: 'perf',
          prompt: { en: 'This is Theo\'s 2-minute test, running on his new build. Press Run load test: all green. Now make it a soak test: change the hold from 2m to 30m, keep the thresholds exactly as they are, and run it again. Submit when the same thresholds catch what 2 minutes missed.', mr: 'ही Theo ची 2 मिनिटांची test आहे, त्याच्या नव्या build वर चालणारी. Run load test दाबा: सगळं हिरवं. आता तिला soak test बनवा: hold 2m वरून 30m करा, thresholds जसेच्या तसे ठेवा, आणि परत चालवा. 2 मिनिटांना जे दिसलं नाही ते तेच thresholds पकडतील तेव्हा Submit करा.' },
          starter: P22_SHORT_START,
          solution: P22_SOAK_30,
          build: ['memory-leak'],
          expectFailure: true,
          requireThresholds: true,
          verify: [
            { check: (r) => r.durationS >= 20 * 60, message: { en: 'Hold for at least 20 minutes (30m is the plan). The leak needs time to show.', mr: 'किमान 20 मिनिटं hold करा (plan 30m चा आहे). leak दिसायला वेळ लागतो.' } },
            { check: (r) => r.thresholds.some((t) => t.metric === 'http_req_duration' && t.expr.replace(/\s/g, '') === 'p(95)<400'), message: { en: "Keep Rex's thresholds as they are (http_req_duration: ['p(95)<400']). The point is that the same goal fails once the test is long enough.", mr: "Rex चे thresholds जसेच्या तसे ठेवा (http_req_duration: ['p(95)<400']). मुद्दा हाच की test पुरेशी लांब झाली की तेच ध्येय fail होतं." } },
          ],
          hints: [
            { en: 'Only one value changes: the duration of the middle stage.', mr: 'फक्त एकच value बदलते: मधल्या stage चा duration.' },
            { en: "{ duration: '30m', target: 40 },", mr: "{ duration: '30m', target: 40 }," },
          ],
          successLine: { en: 'Same script, same thresholds. 2 minutes: p95 about 240 ms, pass. 30 minutes: p95 about 890 ms and 2.8% failed requests. The leak was always there; the short test simply stopped before it showed.', mr: 'तीच script, तेच thresholds. 2 मिनिटं: p95 सुमारे 240 ms, pass. 30 मिनिटं: p95 सुमारे 890 ms आणि 2.8% failed requests. leak नेहमीच होती; छोटी test ती दिसण्याआधीच थांबली एवढंच.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Here is the 30-minute soak on the memory-leak build. Press Run load test and compare the start of the hold with the end. What does the p95 line do while the VU line stays flat at 40?', mr: 'ही memory-leak build वरची 30 मिनिटांची soak आहे. Run load test दाबा आणि hold ची सुरुवात शेवटाशी तुलना करा. VU रेषा 40 वर सपाट असताना p95 ची रेषा काय करते?' },
          perfSandbox: { code: P22_SOAK_30, build: ['memory-leak'] },
          options: [
            { en: 'It stays flat at about 160 ms: the server is healthy', mr: 'ती सुमारे 160 ms वर सपाट राहते: server निरोगी आहे' },
            { en: 'It is high at the start, then settles down once the caches warm up', mr: 'ती सुरुवातीला जास्त असते, मग caches तयार झाल्यावर स्थिरावते' },
            { en: 'It climbs steadily, from about 290 ms near minute 3 to about 1.3 s at minute 30, and errors start around minute 16', mr: 'ती सतत चढते, मिनिट 3 जवळच्या सुमारे 290 ms वरून मिनिट 30 ला सुमारे 1.3 s पर्यंत, आणि सुमारे मिनिट 16 ला errors सुरू होतात' },
            { en: 'It jumps up and down at random, so the test is unreliable', mr: 'ती उगाच वर-खाली उड्या मारते, म्हणजे test विश्वासार्ह नाही' },
          ],
          correct: [2],
          explain: { en: 'The load never changes, but every minute the server is slower: about 290 ms near minute 3, about 550 ms near minute 11, about 1.3 s at the end, and from minute 16 about 6% of requests fail. The p95 line crosses the 400 ms goal line around minute 7. A steady climb under steady load is the fingerprint of a leak. Report the early and late numbers side by side, and ask Theo to watch server memory during the same run.', mr: 'load कधीच बदलत नाही, पण दर मिनिटाला server अजून हळू: मिनिट 3 जवळ सुमारे 290 ms, मिनिट 11 जवळ सुमारे 550 ms, शेवटी सुमारे 1.3 s, आणि मिनिट 16 पासून सुमारे 6% requests fail. p95 ची रेषा सुमारे मिनिट 7 ला 400 ms च्या goal रेषेला ओलांडते. स्थिर load खाली सतत चढ हीच leak ची ओळख. सुरुवातीचे आणि शेवटचे आकडे शेजारी शेजारी report करा, आणि त्याच run दरम्यान server ची memory पाहायला Theo ला सांगा.' },
          hints: [
            { en: 'Read p95 when the VU line first becomes flat, and again just before it drops.', mr: 'VU रेषा पहिल्यांदा सपाट होते तेव्हा p95 वाचा, आणि परत ती खाली येण्याच्या थोडं आधी.' },
            { en: 'Watch for the red error bars. When do they start?', mr: 'लाल error bars कडे लक्ष ठेवा. ते कधी सुरू होतात?' },
          ],
          successLine: { en: 'Theo finds it: the new cache stores every session and never removes old ones. Memory grows until the server struggles.', mr: 'Theo ला सापडलं: नवा cache प्रत्येक session साठवतो आणि जुने कधीच काढत नाही. server ला त्रास होईपर्यंत memory वाढत जाते.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Rex schedules an overnight soak before the tour launch: 40 VUs held for 1 hour (8 hours in real life). Add the thresholds: on http_req_duration, p95 under 400 ms and p99 under 800 ms; on http_req_failed, a rate under 1% that stops the test early: [{ threshold: \'rate<0.01\', abortOnFail: true }]. Hidden builds will leak memory and slow the seat map.', mr: 'Rex tour launch आधी रात्रभराची soak ठरवतो: 40 VUs, 1 तास hold (खऱ्या आयुष्यात 8 तास). thresholds जोडा: http_req_duration वर p95 400 ms च्या आत आणि p99 800 ms च्या आत; http_req_failed वर 1% पेक्षा कमी rate, जो test लवकर थांबवेल: [{ threshold: \'rate<0.01\', abortOnFail: true }]. लपवलेले builds memory गळवतील आणि seat map हळू करतील.' },
          starter: P22_NIGHT_START,
          solution: P22_NIGHT_SOL,
          requireThresholds: true,
          verify: [
            { check: (r) => r.durationS >= 3600, message: { en: 'Keep the 1-hour hold: this is the overnight run.', mr: '1 तासाचा hold तसाच ठेवा: ही रात्रभराची run आहे.' } },
            { check: (r) => hasThreshold(r, 'http_req_duration', 'p(99)'), message: { en: "Add a p(99) limit next to p(95): http_req_duration: ['p(95)<400', 'p(99)<800'].", mr: "p(95) शेजारी p(99) ची मर्यादा टाका: http_req_duration: ['p(95)<400', 'p(99)<800']." } },
            { check: usesAbortOnFail, message: { en: "Write the error threshold as an object with abortOnFail: true, so a broken build stops early: http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }].", mr: "error threshold abortOnFail: true असलेला object म्हणून लिहा, म्हणजे बिघडलेला build लवकर थांबेल: http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }]." } },
          ],
          mustCatch: [
            { bug: 'memory-leak', label: { en: 'The server slows down the longer it runs (memory leak)', mr: 'server जितका जास्त चालतो तितका हळू होतो (memory leak)' } },
            { bug: 'slow-seats', label: { en: 'Seat map runs one query per seat (700 ms)', mr: 'seat map प्रत्येक seat साठी एक query चालवतो (700 ms)' } },
          ],
          hints: [
            { en: 'Add thresholds inside options, after stages. Two keys: http_req_duration and http_req_failed.', mr: 'options मध्ये stages नंतर thresholds टाका. दोन keys: http_req_duration आणि http_req_failed.' },
            { en: "An abortOnFail threshold is an object inside the array: [{ threshold: 'rate<0.01', abortOnFail: true }].", mr: "abortOnFail threshold म्हणजे array मधला object: [{ threshold: 'rate<0.01', abortOnFail: true }]." },
            { en: "thresholds: {\n  http_req_duration: ['p(95)<400', 'p(99)<800'],\n  http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }],\n},", mr: "thresholds: {\n  http_req_duration: ['p(95)<400', 'p(99)<800'],\n  http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }],\n}," },
          ],
          successLine: { en: 'On the leak build your soak stopped itself at about minute 18, when failed requests passed 1%. In real life that is a 2 am alert and saved logs, not a wasted night.', mr: 'leak build वर तुमची soak सुमारे मिनिट 18 ला, failed requests 1% च्या पुढे गेल्यावर, आपोआप थांबली. खऱ्या आयुष्यात याचा अर्थ रात्री 2 चा alert आणि जपलेले logs, वाया गेलेली रात्र नाही.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Sam asks: "Can we run the soak test on every pull request, like the smoke test?" What is the best answer?', mr: 'Sam विचारतो: "smoke test सारखी soak test पण प्रत्येक pull request वर चालवू शकतो का?" सगळ्यात चांगलं उत्तर कोणतं?' },
          options: [
            { en: 'Yes, run the full 8-hour soak on every pull request', mr: 'हो, प्रत्येक pull request वर पूर्ण 8 तासांची soak चालवा' },
            { en: 'No: a soak takes hours, so run it nightly or at weekends on a production-like environment, and keep a short smoke test on every pull request', mr: 'नाही: soak ला तास लागतात, म्हणून ती रोज रात्री किंवा weekend ला production सारख्या environment वर चालवा, आणि प्रत्येक pull request वर छोटी smoke test ठेवा' },
            { en: 'No: soak tests are only for databases', mr: 'नाही: soak tests फक्त databases साठी असतात' },
            { en: 'There is no need: the stress test already passed', mr: 'गरजच नाही: stress test आधीच pass झाली' },
          ],
          correct: [1],
          explain: { en: 'Each kind of test has its rhythm. Smoke tests are quick and run on every change. Soaks are long, need a quiet production-like environment, and run overnight or at weekends, especially before big releases like the tour. A stress test cannot replace a soak: it is short, so a slow leak never shows.', mr: 'प्रत्येक प्रकारच्या test ची स्वतःची लय असते. smoke tests जलद असतात आणि प्रत्येक बदलावर चालतात. soaks लांब असतात, त्यांना शांत, production सारखं environment लागतं, आणि त्या रात्री किंवा weekend ला चालतात, खास करून tour सारख्या मोठ्या releases आधी. stress test soak ची जागा घेऊ शकत नाही: ती छोटी असते, म्हणून हळू leak कधीच दिसत नाही.' },
          hints: [
            { en: 'How long does a real soak run? Would developers wait that long for every pull request?', mr: 'खरी soak किती वेळ चालते? प्रत्येक pull request साठी developers इतकी वाट पाहतील का?' },
            { en: 'Think of the water tank: the watchman checks overnight, not every time someone opens a tap.', mr: 'पाण्याची टाकी आठवा: watchman रात्रभरात तपासतो, कोणी नळ उघडला की प्रत्येक वेळी नाही.' },
          ],
          successLine: { en: 'Rex adds it to the plan: smoke on every pull request, load and stress before each release, soak every night in the week before the tour.', mr: 'Rex plan मध्ये टाकतो: प्रत्येक pull request वर smoke, प्रत्येक release आधी load आणि stress, tour च्या आधीच्या आठवड्यात रोज रात्री soak.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'The memory-leak build passes a 2-minute test with p(95)<400 (p95 about 240 ms) but fails a 30-minute test with the same threshold. Why?', mr: 'memory-leak build p(95)<400 सह 2 मिनिटांची test pass करतो (p95 सुमारे 240 ms) पण त्याच threshold सह 30 मिनिटांची test fail करतो. का?' },
        options: [
          { en: 'k6 measures response time differently in long tests', mr: 'लांब tests मध्ये k6 response time वेगळ्या प्रकारे मोजतो' },
          { en: 'The 30-minute test used more VUs', mr: '30 मिनिटांच्या test ने जास्त VUs वापरले' },
          { en: 'The server gets slower the longer it runs, and the threshold judges the whole run, so the slow later minutes push p95 over 400 ms', mr: 'server जितका जास्त चालतो तितका हळू होतो, आणि threshold पूर्ण run चा निकाल देतो, म्हणून नंतरची हळू मिनिटं p95 ला 400 ms च्या पुढे ढकलतात' },
          { en: 'The 2-minute test had a typo in its thresholds', mr: '2 मिनिटांच्या test च्या thresholds मध्ये typo होता' },
        ],
        answer: 2,
        explain: { en: 'Same load, same threshold; only time changed. A leak grows with time, so only a long enough test lets it dominate the numbers.', mr: 'load तोच, threshold तोच; फक्त वेळ बदलला. leak वेळेसोबत वाढते, म्हणून फक्त पुरेशी लांब test तिला आकड्यांवर वरचढ होऊ देते.' },
      },
      {
        q: { en: 'A soak chart: VUs flat at 40 for 30 minutes. Which p95 pattern points to a leak?', mr: 'एक soak chart: 30 मिनिटं VUs 40 वर सपाट. p95 चा कोणता आकार leak कडे बोट दाखवतो?' },
        options: [
          { en: 'p95 climbs slowly and steadily from start to end', mr: 'p95 सुरुवातीपासून शेवटपर्यंत हळूहळू, सतत चढतो' },
          { en: 'p95 is higher during the ramp up, then flat', mr: 'ramp up दरम्यान p95 जास्त, मग सपाट' },
          { en: 'p95 is flat, with a few single random spikes', mr: 'p95 सपाट, मधेच काही एकट्या उड्या' },
          { en: 'p95 is flat and the same as last week', mr: 'p95 सपाट आणि मागच्या आठवड्याइतकाच' },
        ],
        answer: 0,
        explain: { en: 'The load is constant, so a steady upward drift means the server itself is degrading over time. A short bump during ramp up is warm-up, and single spikes are noise (look at p99 and errors for those).', mr: 'load स्थिर आहे, म्हणून सतत वर सरकणं म्हणजे server स्वतःच वेळेसोबत बिघडतोय. ramp up मधला छोटा उंचवटा म्हणजे warm-up, आणि एकट्या उड्या म्हणजे गोंगाट (त्यांच्यासाठी p99 आणि errors पाहा).' },
      },
      {
        q: { en: 'What load level should a soak test use?', mr: 'soak test ने कोणती load पातळी वापरावी?' },
        options: [
          { en: 'As many VUs as the lab allows', mr: 'lab देईल तितके जास्तीत जास्त VUs' },
          { en: 'One VU, to keep the test cheap', mr: 'test स्वस्त राहावी म्हणून एक VU' },
          { en: 'Double the expected peak', mr: 'अपेक्षित शिखराच्या दुप्पट' },
          { en: 'A steady, normal level (often 50 to 80% of the expected peak), so only time changes', mr: 'स्थिर, नेहमीची पातळी (बहुतेकदा अपेक्षित शिखराच्या 50 ते 80%), म्हणजे फक्त वेळ बदलेल' },
        ],
        answer: 3,
        explain: { en: 'A soak isolates time as the only variable. At peak or double load you are running a stress test, and overload hides the slow drift you are looking for.', mr: 'soak वेळ हा एकच बदलणारा घटक ठेवते. शिखरावर किंवा दुप्पट load वर तुम्ही stress test चालवताय, आणि जास्त भार तुम्ही शोधत असलेलं हळू सरकणं लपवतो.' },
      },
      {
        q: { en: 'When would a team usually run this test?', mr: 'team ही test साधारणपणे कधी चालवेल?' },
        code: "stages: [\n  { duration: '10m', target: 300 },\n  { duration: '8h', target: 300 },\n  { duration: '5m', target: 0 },\n]",
        options: [
          { en: 'On every commit, before code review', mr: 'प्रत्येक commit वर, code review आधी' },
          { en: 'Overnight or at the weekend before a big release, on a production-like environment', mr: 'मोठ्या release आधी रात्री किंवा weekend ला, production सारख्या environment वर' },
          { en: 'During the real sale, on production', mr: 'खऱ्या sale दरम्यान, production वर' },
          { en: 'Never: k6 cannot run tests that long', mr: 'कधीच नाही: k6 इतक्या लांब tests चालवू शकत नाही' },
        ],
        answer: 1,
        explain: { en: 'An 8-hour hold at a normal level is a soak. It runs while people sleep, on an environment that looks like production, before releases that must stay up for weeks.', mr: 'नेहमीच्या पातळीवर 8 तासांचा hold म्हणजे soak. ती लोक झोपलेले असताना, production सारख्या दिसणाऱ्या environment वर, आठवडे चालू राहायला हव्या अशा releases आधी चालते.' },
      },
    ],
    recap: { line: { en: 'A soak test holds a normal load for hours with the normal SLA. Compare early and late p95: a steady climb under steady load is a leak. Short tests miss it; run soaks overnight with abortOnFail.', mr: 'soak test नेहमीचा load तासन् तास नेहमीच्या SLA सोबत धरून ठेवते. सुरुवातीचा आणि शेवटचा p95 तुलना करा: स्थिर load खाली सतत चढ म्हणजे leak. छोट्या tests ना ती दिसत नाही; soaks रात्री abortOnFail सोबत चालवा.' }, icon: '💧' },
  },

  // ───────────────────────── P2.3 Real data
  {
    id: 'pf2-3',
    code: 'P2.3',
    level: 'intermediate',
    title: { en: 'Real data: users, tokens and correlation', mr: 'खरा data: users, tokens आणि correlation' },
    skill: 'SharedArray, open(), __VU, correlation, setup(), group(), Trend, Counter',
    realLife: {
      place: 'clinic',
      title: { en: 'The case paper at the OPD', mr: 'OPD मधला case paper' },
      story: {
        en: 'At the government hospital OPD, Aaji gets a case paper at the window with her own name and number: 4127. The doctor\'s room calls out "4127", not just "next patient". The doctor writes the medicines on that same paper, and the pharmacy reads it to hand over the right tablets. Every counter uses what the counter before it gave out. Now imagine a drill where all 200 volunteers say they are "Aaji, 4127". The window finds her file in a second every time, the doctor sees one patient 200 times, and the drill proves nothing about a real busy Monday morning.',
        mr: 'सरकारी हॉस्पिटलच्या OPD मध्ये आजींना खिडकीवर त्यांच्याच नावाचा आणि नंबरचा case paper मिळतो: 4127. डॉक्टरांच्या खोलीतून "4127" पुकारलं जातं, फक्त "पुढचा पेशंट" नाही. डॉक्टर त्याच paper वर औषधं लिहितात, आणि pharmacy तो वाचून योग्य गोळ्या देते. प्रत्येक counter आधीच्या counter ने दिलेली गोष्ट वापरतो. आता कल्पना करा, एका सरावात सगळे 200 volunteers "आजी, 4127" असं सांगतात. खिडकीला प्रत्येक वेळी त्यांची file एका सेकंदात सापडते, डॉक्टर एकाच पेशंटला 200 वेळा पाहतात, आणि गर्दीच्या खऱ्या सोमवार सकाळबद्दल तो सराव काहीच सिद्ध करत नाही.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🪪', label: 'Window: case paper no. 4127', mr: 'खिडकी: case paper क्र. 4127' },
          { icon: '🩺', label: 'Doctor calls "4127"', mr: 'डॉक्टर "4127" पुकारतात' },
          { icon: '📝', label: 'Medicines written on paper 4127', mr: 'paper 4127 वर औषधं लिहिली' },
          { icon: '💊', label: 'Pharmacy reads paper 4127', mr: 'pharmacy paper 4127 वाचते' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'worried', text: { en: 'Something bothers me about our flash-sale script. Every fan buys event 1, the script builds usernames by hand, and if I copy a cartId from yesterday\'s run, checkout fails.', mr: 'आपल्या flash-sale script बद्दल मला काहीतरी खटकतंय. प्रत्येक fan event 1 च घेतो, script usernames हाताने बनवते, आणि कालच्या run मधला cartId copy केला तर checkout fail होतो.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Real fans are different people buying different shows. If all VUs act like one fan, the database serves one hot row from cache, and we measure a server that never exists. Let\'s feed the test from a data file, the way JMeter uses a CSV Data Set Config.', mr: 'खरे fans वेगवेगळी माणसं असतात आणि वेगवेगळे shows घेतात. सगळे VUs एकाच fan सारखे वागले तर database cache मधून एकच गरम row देतो, आणि आपण कधीच अस्तित्वात नसलेला server मोजतो. JMeter जसा CSV Data Set Config वापरतो, तसं test ला data file मधून खाऊ घालूया.' } },
        { who: 'sam', mood: 'neutral', text: { en: 'And I want the report in business words: how long checkout took, and how many orders we actually sold.', mr: 'आणि मला report business च्या भाषेत हवा: checkout ला किती वेळ लागला, आणि आपण खरंच किती orders विकल्या.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> one fake fan × 1000 = one very fast lie. i love your test reports. ⌁', mr: '>> एक खोटा fan × 1000 = एक खूप जलद खोटं. मला तुमचे test reports फार आवडतात. ⌁' } },
        { who: 'meera', mood: 'happy', text: { en: 'Then here is the plan: fans from users.json, every value carried from one answer to the next request, one-time work in setup, a group for each step, and our own metrics for checkout time and orders.', mr: 'मग plan असा: users.json मधले fans, प्रत्येक value एका उत्तरातून पुढच्या request मध्ये नेलेली, एकदाच करायचं काम setup मध्ये, प्रत्येक step साठी group, आणि checkout वेळ व orders साठी आपले स्वतःचे metrics.' } },
      ],
      problem: { en: 'A load test with hard-coded data is a fake: one user, one show, one cart id. Caches make it look fast, last season\'s ids break it, and a cart id copied from one run fails in the next. And the summary speaks in requests, while the business asks about orders.', mr: 'hard-coded data असलेली load test खोटी असते: एक user, एक show, एक cart id. caches मुळे ती जलद दिसते, मागच्या season चे ids तिला मोडतात, आणि एका run मधून copy केलेला cart id पुढच्या run मध्ये fail होतो. आणि summary requests च्या भाषेत बोलते, तर business orders बद्दल विचारतो.' },
      solution: { en: 'SharedArray loads users.json once and shares it with every VU; __VU picks a different fan for each VU. Correlation reads values like the token, an event id and the cartId from each response and sends them in the next request. setup() does one-time preparation and passes the result to every VU. group() names each step, and custom metrics (Trend, Counter) report checkout time and orders sold.', mr: 'SharedArray users.json एकदाच load करतो आणि प्रत्येक VU सोबत share करतो; __VU प्रत्येक VU साठी वेगळा fan निवडतो. correlation प्रत्येक response मधून token, event id आणि cartId सारख्या values वाचतं आणि पुढच्या request मध्ये पाठवतं. setup() एकदाच करायची तयारी करतो आणि निकाल प्रत्येक VU ला देतो. group() प्रत्येक step ला नाव देतो, आणि custom metrics (Trend, Counter) checkout वेळ आणि विकलेल्या orders सांगतात.' },
    },
    lesson: [
      { en: 'Test data from a file. const users = new SharedArray(\'fans\', () => JSON.parse(open(\'./users.json\'))); reads the file once in the init code and shares one copy with all VUs (a plain array would be copied into every VU and eat memory). Then users[(__VU - 1) % users.length] gives VU 1 the first fan, VU 2 the second, and wraps around if there are more VUs than fans. Why it matters: 100 VUs logging in as the same user hit one cached row, one session, one cart. Real fans spread across the database, and that is where locks and slow queries show up. JMeter calls this CSV Data Set Config.', mr: 'file मधून test data. const users = new SharedArray(\'fans\', () => JSON.parse(open(\'./users.json\'))); init code मध्ये file एकदाच वाचतो आणि एकच copy सगळ्या VUs सोबत share करतो (साधा array प्रत्येक VU मध्ये copy होईल आणि memory खाईल). मग users[(__VU - 1) % users.length] VU 1 ला पहिला fan देतो, VU 2 ला दुसरा, आणि fans पेक्षा VUs जास्त असतील तर परत सुरुवातीपासून. हे का महत्त्वाचं: एकाच user ने login करणारे 100 VUs एकच cached row, एकच session, एकच cart वापरतात. खरे fans database भर पसरलेले असतात, आणि locks आणि हळू queries तिथेच दिसतात. JMeter याला CSV Data Set Config म्हणतो.' },
      { en: 'Correlation: carry each answer forward. Login gives a token, the list of shows gives the ids and prices, the cart gives a cartId. Read them with res.json(\'token\') or res.json(), and use them in the next request. Never hard-code ids: last season\'s show id returns 404, and a cartId from yesterday belongs to nobody. In JMeter this is a JSON Extractor that saves ${cartId} for the next sampler.', mr: 'correlation: प्रत्येक उत्तर पुढे न्या. login token देतं, shows ची यादी ids आणि किमती देते, cart cartId देतो. ते res.json(\'token\') किंवा res.json() ने वाचा, आणि पुढच्या request मध्ये वापरा. ids कधीच hard-code करू नका: मागच्या season च्या show चा id 404 देतो, आणि कालचा cartId कोणाचाच नसतो. JMeter मध्ये हा JSON Extractor आहे, जो पुढच्या sampler साठी ${cartId} साठवतो.' },
      { en: 'setup() runs once, before the load starts, and whatever it returns reaches every VU as the argument of the default function: export default function (data). Use it for one-time work: fetch the list of shows and find the Arijit concert, create test data, get an admin token. Return plain data (numbers, strings, arrays), not response objects. teardown(data) runs once at the end, for cleaning up.', mr: 'setup() load सुरू होण्याआधी एकदाच चालतो, आणि तो जे return करतो ते default function चा argument म्हणून प्रत्येक VU ला मिळतं: export default function (data). एकदाच करायच्या कामासाठी तो वापरा: shows ची यादी आणून Arijit चा concert शोधणं, test data बनवणं, admin token घेणं. साधा data return करा (numbers, strings, arrays), response objects नाही. teardown(data) शेवटी एकदा चालतो, साफसफाईसाठी.' },
      { en: 'Speak business. group(\'checkout\', () => { ... }) names each step (JMeter: Transaction Controller). Custom metrics count what the business cares about: new Trend(\'checkout_time\', true) and checkoutTime.add(res.timings.duration) record each checkout time in ms; new Counter(\'orders\') and orders.add(1) count confirmed orders. Both appear in the summary and can carry thresholds: checkout_time: [\'p(95)<800\'], orders: [\'count>2000\'].', mr: 'business ची भाषा बोला. group(\'checkout\', () => { ... }) प्रत्येक step ला नाव देतो (JMeter: Transaction Controller). custom metrics business ला महत्त्वाचं ते मोजतात: new Trend(\'checkout_time\', true) आणि checkoutTime.add(res.timings.duration) प्रत्येक checkout चा वेळ ms मध्ये नोंदवतात; new Counter(\'orders\') आणि orders.add(1) confirm झालेल्या orders मोजतात. दोन्ही summary मध्ये दिसतात आणि त्यांच्यावर thresholds ठेवता येतात: checkout_time: [\'p(95)<800\'], orders: [\'count>2000\'].' },
    ],
    syntax: {
      template: "import { SharedArray } from 'k6/data';\nimport { Trend, Counter } from 'k6/metrics';\n\nconst users = new SharedArray('fans', () => JSON.parse(open('./users.json')));\nconst checkoutTime = new Trend('checkout_time', true);\nconst orders = new Counter('orders');\n\nexport function setup() {\n  const show = http.get(BASE + '/events').json().find((e) => e.name.includes('Arijit'));\n  return { eventId: show.id };\n}\n\nexport default function (data) {\n  const fan = users[(__VU - 1) % users.length];\n  // ... login with fan, cart with data.eventId ...\n  group('checkout', () => {\n    const res = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), params);\n    checkoutTime.add(res.timings.duration);\n    if (res.json('status') === 'CONFIRMED') orders.add(1);\n  });\n}",
      parts: [
        { code: "new SharedArray('fans', () => JSON.parse(open('./users.json')))", means: { en: 'load the test data once and share it with all VUs (init code only)', mr: 'test data एकदाच load करा आणि सगळ्या VUs सोबत share करा (फक्त init code मध्ये)' } },
        { code: 'users[(__VU - 1) % users.length]', means: { en: 'a different fan for each VU (__VU starts at 1)', mr: 'प्रत्येक VU साठी वेगळा fan (__VU 1 पासून सुरू होतो)' } },
        { code: "cart.json('cartId')", means: { en: 'correlation: a value from this answer, sent in the next request', mr: 'correlation: या उत्तरातली value, पुढच्या request मध्ये पाठवलेली' } },
        { code: 'export function setup() { return { ... } }', means: { en: 'runs once before the load; its return value reaches every VU as data', mr: 'load आधी एकदा चालतो; त्याची return value प्रत्येक VU ला data म्हणून मिळते' } },
        { code: "new Trend('checkout_time', true) / new Counter('orders')", means: { en: 'your own metrics: a timing (true means milliseconds) and a running count; .add() records a value', mr: 'तुमचे स्वतःचे metrics: एक वेळ (true म्हणजे milliseconds) आणि एक चालू मोजणी; .add() value नोंदवतो' } },
      ],
      example: [
        { code: 'const fan = users[(__VU - 1) % users.length];', note: { en: 'VU 42 is fan042: 200 different fans, like the real queue', mr: 'VU 42 म्हणजे fan042: 200 वेगवेगळे fans, खऱ्या रांगेसारखे' } },
        { code: 'const show = randomItem(list.json());', note: { en: 'fans spread across all six shows, not only Arijit', mr: 'fans सहाही shows मध्ये पसरतात, फक्त Arijit नाही' } },
        { code: "const cartId = cart.json('cartId');", note: { en: 'the case paper number, carried to the next counter', mr: 'case paper चा नंबर, पुढच्या counter वर नेलेला' } },
        { code: 'checkoutTime.add(co.timings.duration);', note: { en: 'Sam\'s first question: how long did paying take?', mr: 'Sam चा पहिला प्रश्न: पैसे भरायला किती वेळ लागला?' } },
        { code: "orders: ['count>2000'],", note: { en: 'and the second: did we really sell? At least 2000 confirmed orders in the run', mr: 'आणि दुसरा: आपण खरंच विकलं का? run मध्ये किमान 2000 confirm झालेल्या orders' } },
      ],
      pitfall: { en: 'open() and new SharedArray(...) work only in the init code at the top of the file, not inside the default function. __VU starts at 1, so use __VU - 1 for the first row. setup() data is copied to each VU as plain JSON, so return numbers, strings and arrays, not response objects.', mr: 'open() आणि new SharedArray(...) फक्त file च्या वरच्या init code मध्ये चालतात, default function च्या आत नाही. __VU 1 पासून सुरू होतो, म्हणून पहिल्या row साठी __VU - 1 वापरा. setup() चा data प्रत्येक VU ला साध्या JSON म्हणून copy होतो, म्हणून numbers, strings आणि arrays return करा, response objects नाही.' },
    },
    practice: {
      intro: { en: 'Time to make the fake fans real. The lab has a users.json with 200 fans (fan001 / pass001 up to fan200 / pass200). Every script must still pass on the healthy StageDoor.', mr: 'खोट्या fans ना खरं बनवायची वेळ. lab मध्ये 200 fans असलेली users.json आहे (fan001 / pass001 ते fan200 / pass200). प्रत्येक script निरोगी StageDoor वर pass व्हायलाच हवी.' },
      steps: [
        {
          kind: 'perf',
          prompt: { en: 'Every VU in this script logs in as fan001. Load the 200 fans from users.json with a SharedArray in the init code, and give each VU its own fan: users[(__VU - 1) % users.length]. That fan object is already the right login body.', mr: 'या script मधला प्रत्येक VU fan001 म्हणून login करतो. init code मध्ये SharedArray ने users.json मधले 200 fans load करा, आणि प्रत्येक VU ला त्याचा स्वतःचा fan द्या: users[(__VU - 1) % users.length]. तो fan object आधीच login साठी योग्य body आहे.' },
          starter: P23_USERS_START,
          solution: P23_USERS_SOL,
          requireThresholds: true,
          mustUse: [
            { pattern: 'new\\s+SharedArray\\s*\\(', message: { en: "Create the data with new SharedArray('fans', () => ...) in the init code.", mr: "init code मध्ये new SharedArray('fans', () => ...) ने data बनवा." } },
            { pattern: "open\\(\\s*['\"](\\.\\/)?users\\.json['\"]\\s*\\)", message: { en: "Read the file with open('./users.json') inside the SharedArray function.", mr: "SharedArray च्या function मध्ये open('./users.json') ने file वाचा." } },
            { pattern: '__VU', message: { en: 'Pick the fan with __VU, so each VU gets a different one.', mr: '__VU ने fan निवडा, म्हणजे प्रत्येक VU ला वेगळा मिळेल.' } },
          ],
          mustNotUse: [{ pattern: 'fan001', message: { en: 'Remove the hard-coded fan001: the fan must come from users.json.', mr: 'hard-coded fan001 काढून टाका: fan users.json मधूनच यायला हवा.' } }],
          hints: [
            { en: "Import it first: import { SharedArray } from 'k6/data';", mr: "आधी import करा: import { SharedArray } from 'k6/data';" },
            { en: "Create it at the top, outside the default function: const users = new SharedArray('fans', () => JSON.parse(open('./users.json')));", mr: "default function च्या बाहेर, वर बनवा: const users = new SharedArray('fans', () => JSON.parse(open('./users.json')));" },
            { en: "import { SharedArray } from 'k6/data';\nconst users = new SharedArray('fans', () => JSON.parse(open('./users.json')));\n// inside the default function:\nconst fan = users[(__VU - 1) % users.length];", mr: "import { SharedArray } from 'k6/data';\nconst users = new SharedArray('fans', () => JSON.parse(open('./users.json')));\n// inside the default function:\nconst fan = users[(__VU - 1) % users.length];" },
          ],
          successLine: { en: 'Fifty VUs, fifty different fans. Each has its own token and its own cart, like the real queue at 10 am.', mr: 'पन्नास VUs, पन्नास वेगवेगळे fans. प्रत्येकाचा स्वतःचा token आणि स्वतःचा cart, सकाळी 10 च्या खऱ्या रांगेसारखा.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Theo\'s old script buys event 7, a show from last season, and checks out a hard-coded cart c1. Correlate instead: pick a show from the GET /events response with randomItem(list.json()), so its id goes into the seats and cart requests, and send the cartId from the cart response to checkout. The cart check compares the total with show.priceFrom, so it passes only with real data.', mr: 'Theo ची जुनी script event 7 घेते, जो मागच्या season चा show आहे, आणि hard-coded cart c1 चा checkout करते. त्याऐवजी correlate करा: GET /events च्या response मधून randomItem(list.json()) ने show निवडा, म्हणजे त्याचा id seats आणि cart requests मध्ये जाईल, आणि cart response मधला cartId checkout ला पाठवा. cart चा check total ची तुलना show.priceFrom शी करतो, म्हणजे तो फक्त खऱ्या data सोबतच pass होतो.' },
          starter: P23_CORR_START,
          solution: P23_CORR_SOL,
          requireThresholds: true,
          mustUse: [{ pattern: "json\\(\\s*['\"]cartId['\"]\\s*\\)", message: { en: "Send the cartId from the cart response: cart.json('cartId').", mr: "cart response मधला cartId पाठवा: cart.json('cartId')." } }],
          mustNotUse: [
            { pattern: "['\"]c1['\"]", message: { en: "Remove the hard-coded 'c1': carts belong to one fan and are used up by checkout.", mr: "hard-coded 'c1' काढून टाका: cart एकाच fan चा असतो आणि checkout नंतर संपतो." } },
            { pattern: 'id\\s*:\\s*7\\b', message: { en: 'Remove the fake show with id 7: take the show from the list of events.', mr: 'id 7 असलेला खोटा show काढून टाका: show events च्या यादीतून घ्या.' } },
          ],
          hints: [
            { en: "Two TODOs: replace the fake show with one from the list, and replace 'c1' with the id the cart response gave.", mr: "दोन TODOs: खोट्या show च्या जागी यादीतला show, आणि 'c1' च्या जागी cart response ने दिलेला id." },
            { en: 'list.json() is the array of six shows. randomItem is already imported.', mr: 'list.json() म्हणजे सहा shows चा array. randomItem आधीच import केलेलं आहे.' },
            { en: "const show = randomItem(list.json());\n// ...\nconst co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });", mr: "const show = randomItem(list.json());\n// ...\nconst co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });" },
          ],
          successLine: { en: 'Fans now buy all six shows, every cart total matches its show\'s price, and every checkout uses its own cart. That is correlation.', mr: 'आता fans सहाही shows घेतात, प्रत्येक cart चा total त्याच्या show च्या किमतीशी जुळतो, आणि प्रत्येक checkout स्वतःचा cart वापरतो. हेच correlation.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Every loop fetches the whole list of shows just to find the Arijit concert: one extra request per fan per loop, which real fans at checkout do not send. Move that work into setup(): fetch the list once, find the show, and return { eventId: show.id }. Then give the default function a data parameter and use data.eventId. The list of shows should be requested exactly once in the whole test.', mr: 'प्रत्येक loop फक्त Arijit चा concert शोधायला shows ची पूर्ण यादी आणतो: प्रत्येक fan च्या प्रत्येक loop मध्ये एक जास्तीची request, जी checkout करणारे खरे fans पाठवत नाहीत. हे काम setup() मध्ये न्या: यादी एकदा आणा, show शोधा, आणि { eventId: show.id } return करा. मग default function ला data parameter द्या आणि data.eventId वापरा. पूर्ण test मध्ये shows ची यादी नेमकी एकदाच मागितली जायला हवी.' },
          starter: P23_SETUP_START,
          solution: P23_SETUP_SOL,
          requireThresholds: true,
          mustUse: [{ pattern: 'export\\s+function\\s+setup\\s*\\(', message: { en: 'Add export function setup() { ... } and return { eventId: show.id } from it.', mr: 'export function setup() { ... } टाका आणि त्यातून { eventId: show.id } return करा.' } }],
          verify: [{ check: (r) => eventsListCalls(r) === 1, message: { en: 'GET /events should run exactly once, inside setup(). Remove it from the default function.', mr: 'GET /events नेमकी एकदाच, setup() च्या आत चालायला हवी. ती default function मधून काढा.' } }],
          hints: [
            { en: 'setup is a named export: export function setup() { ... return { eventId: show.id }; }', mr: 'setup हा named export आहे: export function setup() { ... return { eventId: show.id }; }' },
            { en: 'The default function receives what setup returned: export default function (data) { ... data.eventId ... }', mr: 'setup ने जे return केलं ते default function ला मिळतं: export default function (data) { ... data.eventId ... }' },
            { en: "export function setup() {\n  const list = http.get(BASE + '/events', { tags: { name: 'events' } });\n  const show = list.json().find((e) => e.name.includes('Arijit'));\n  return { eventId: show.id };\n}\n\nexport default function (data) {\n  // ... the cart request uses eventId: data.eventId\n}", mr: "export function setup() {\n  const list = http.get(BASE + '/events', { tags: { name: 'events' } });\n  const show = list.json().find((e) => e.name.includes('Arijit'));\n  return { eventId: show.id };\n}\n\nexport default function (data) {\n  // ... the cart request uses eventId: data.eventId\n}" },
          ],
          successLine: { en: 'One request in setup instead of thousands in the loop. setup() is where one-time preparation lives: lookups, test data, admin tokens.', mr: 'loop मधल्या हजारो requests ऐवजी setup मध्ये एक. एकदाच करायची तयारी setup() मध्येच राहते: शोध, test data, admin tokens.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Sam wants business numbers. In the init code, create a Trend \'checkout_time\' (a time, so pass true) and a Counter \'orders\'. Wrap the three steps in group(\'login\', ...), group(\'cart\', ...) and group(\'checkout\', ...). Inside checkout, add the checkout duration to the Trend and add 1 to orders when the order is confirmed. Then add thresholds: checkout_time p95 under 800 ms and orders count over 2000.', mr: 'Sam ला business चे आकडे हवेत. init code मध्ये Trend \'checkout_time\' (वेळ आहे, म्हणून true द्या) आणि Counter \'orders\' बनवा. तिन्ही steps group(\'login\', ...), group(\'cart\', ...) आणि group(\'checkout\', ...) मध्ये ठेवा. checkout मध्ये checkout चा duration Trend मध्ये टाका आणि order confirm झाली की orders मध्ये 1 टाका. मग thresholds जोडा: checkout_time चा p95 800 ms च्या आत आणि orders चा count 2000 च्या वर.' },
          starter: P23_METRICS_START,
          solution: P23_METRICS_SOL,
          requireThresholds: true,
          verify: [
            { check: (r) => r.checks.some((c) => c.group === '::checkout'), message: { en: "No check ran inside a group named checkout. Wrap the checkout request and its check in group('checkout', () => { ... }).", mr: "checkout नावाच्या group मध्ये एकही check चालला नाही. checkout request आणि तिचा check group('checkout', () => { ... }) मध्ये ठेवा." } },
            { check: (r) => r.checks.some((c) => c.group === '::login') && r.checks.some((c) => c.group === '::cart'), message: { en: "Wrap the login and cart steps (with their checks) in group('login', ...) and group('cart', ...).", mr: "login आणि cart steps (त्यांच्या checks सकट) group('login', ...) आणि group('cart', ...) मध्ये ठेवा." } },
            { check: (r) => hasThreshold(r, 'checkout_time', 'p(95)<'), message: { en: "Add a threshold on your Trend: checkout_time: ['p(95)<800'].", mr: "तुमच्या Trend वर threshold टाका: checkout_time: ['p(95)<800']." } },
            { check: (r) => hasThreshold(r, 'orders', 'count>'), message: { en: "Add a threshold on your Counter: orders: ['count>2000'].", mr: "तुमच्या Counter वर threshold टाका: orders: ['count>2000']." } },
          ],
          mustCatch: [
            { bug: 'small-pool', label: { en: 'Payment gateway pool has 3 connections instead of 12', mr: 'payment gateway pool मध्ये 12 ऐवजी 3 connections' } },
            { bug: 'errors-under-load', label: GATEWAY_500 },
          ],
          hints: [
            { en: "Init code: const checkoutTime = new Trend('checkout_time', true); const orders = new Counter('orders');", mr: "init code: const checkoutTime = new Trend('checkout_time', true); const orders = new Counter('orders');" },
            { en: 'Values made inside a group are needed later (the token, the cartId). Declare them before the group with let, and assign them inside.', mr: 'group च्या आत बनलेल्या values नंतर लागतात (token, cartId). त्या group च्या आधी let ने declare करा, आणि आत assign करा.' },
            { en: "check() returns true when all its conditions pass, so: const ok = check(co, { ... }); checkoutTime.add(co.timings.duration); if (ok) orders.add(1);", mr: "सगळ्या अटी pass झाल्या की check() true देतो, म्हणून: const ok = check(co, { ... }); checkoutTime.add(co.timings.duration); if (ok) orders.add(1);" },
            { en: "group('checkout', () => {\n  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cartId }), { headers: auth, tags: { name: 'checkout' } });\n  const ok = check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });\n  checkoutTime.add(co.timings.duration);\n  if (ok) orders.add(1);\n});\n// thresholds:\ncheckout_time: ['p(95)<800'],\norders: ['count>2000'],", mr: "group('checkout', () => {\n  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cartId }), { headers: auth, tags: { name: 'checkout' } });\n  const ok = check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });\n  checkoutTime.add(co.timings.duration);\n  if (ok) orders.add(1);\n});\n// thresholds:\ncheckout_time: ['p(95)<800'],\norders: ['count>2000']," },
          ],
          successLine: { en: 'The summary now shows checkout_time (p95 about 490 ms) and orders (about 3400), under █ login, █ cart and █ checkout. On the small-pool build orders fell to about 1160: a number Sam understands without a lecture on percentiles.', mr: 'आता summary मध्ये █ login, █ cart आणि █ checkout खाली checkout_time (p95 सुमारे 490 ms) आणि orders (सुमारे 3400) दिसतात. small-pool build वर orders सुमारे 1160 पर्यंत घसरल्या: percentiles वरच्या भाषणाशिवाय Sam ला समजणारा आकडा.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'The tour client\'s QA team uses JMeter, and they ask how your k6 script maps to their test plan. Which pairing is right?', mr: 'tour client ची QA team JMeter वापरते, आणि ते विचारतात की तुमची k6 script त्यांच्या test plan शी कशी जुळते. कोणती जोडी बरोबर आहे?' },
          options: [
            { en: "SharedArray + open('./users.json') = Thread Group; res.json('cartId') = Listener", mr: "SharedArray + open('./users.json') = Thread Group; res.json('cartId') = Listener" },
            { en: "SharedArray + open('./users.json') = CSV Data Set Config; res.json('cartId') = JSON Extractor", mr: "SharedArray + open('./users.json') = CSV Data Set Config; res.json('cartId') = JSON Extractor" },
            { en: 'SharedArray = Response Assertion; res.json() = HTTP Request sampler', mr: 'SharedArray = Response Assertion; res.json() = HTTP Request sampler' },
            { en: 'setup() = CSV Data Set Config; group() = JSON Extractor', mr: 'setup() = CSV Data Set Config; group() = JSON Extractor' },
          ],
          correct: [1],
          explain: { en: 'A CSV Data Set Config feeds each thread a row of test data, like SharedArray with __VU. A JSON Extractor saves a value from a response into a variable such as ${cartId} for later samplers, like res.json(\'cartId\'). The rest of the map: Thread Group = VUs and stages, Transaction Controller = group(), Assertion = check, Listener = the summary.', mr: 'CSV Data Set Config प्रत्येक thread ला test data ची एक row देतो, __VU सोबतच्या SharedArray सारखं. JSON Extractor response मधली value ${cartId} सारख्या variable मध्ये पुढच्या samplers साठी साठवतो, res.json(\'cartId\') सारखं. बाकीचा नकाशा: Thread Group = VUs आणि stages, Transaction Controller = group(), Assertion = check, Listener = summary.' },
          hints: [
            { en: 'Which JMeter element reads rows from a data file? Which one pulls a value out of a JSON response?', mr: 'data file मधून rows वाचणारा JMeter element कोणता? JSON response मधून value काढणारा कोणता?' },
            { en: 'A Listener shows results and a Thread Group sets the users; neither of them reads data or extracts values.', mr: 'Listener निकाल दाखवतो आणि Thread Group users ठरवतो; दोघांपैकी कोणीच data वाचत नाही किंवा values काढत नाही.' },
          ],
          successLine: { en: 'Same ideas, different words. Now you can read a JMeter job post and say: I have done this in k6.', mr: 'कल्पना त्याच, शब्द वेगळे. आता तुम्ही JMeter ची job post वाचून म्हणू शकता: हे मी k6 मध्ये केलंय.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Why is a test where 100 VUs all log in as fan001 misleading?', mr: '100 VUs सगळे fan001 म्हणून login करतात अशी test दिशाभूल करणारी का आहे?' },
        options: [
          { en: 'k6 cannot send the same request body twice', mr: 'k6 तीच request body दोनदा पाठवू शकत नाही' },
          { en: 'The server always rejects a second login for the same user', mr: 'server एकाच user चं दुसरं login नेहमी नाकारतो' },
          { en: 'All VUs hit the same user data, session and cached rows, so the server looks faster than it would with 100 real, different fans', mr: 'सगळे VUs तोच user data, session आणि cached rows वापरतात, म्हणून 100 खऱ्या, वेगवेगळ्या fans पेक्षा server जास्त जलद दिसतो' },
          { en: 'It makes the test take longer', mr: 'त्यामुळे test ला जास्त वेळ लागतो' },
        ],
        answer: 2,
        explain: { en: 'One user means one hot row in the cache and none of the real spread across the database. Locks, slow queries and per-user limits only show with many different users.', mr: 'एक user म्हणजे cache मधली एक गरम row आणि database भर खरं पसरणं अजिबात नाही. locks, हळू queries आणि प्रत्येक user च्या मर्यादा फक्त अनेक वेगवेगळ्या users सोबतच दिसतात.' },
      },
      {
        q: { en: 'What does each VU receive as data?', mr: 'प्रत्येक VU ला data म्हणून काय मिळतं?' },
        code: "export function setup() {\n  const list = http.get(BASE + '/events').json();\n  return { eventId: list.find((e) => e.name.includes('Zakir')).id };\n}\n\nexport default function (data) {\n  // ...\n}",
        options: [
          { en: '{ eventId: 3 }, worked out once before the load starts and passed to every VU', mr: '{ eventId: 3 }, load सुरू होण्याआधी एकदाच काढलेलं आणि प्रत्येक VU ला दिलेलं' },
          { en: 'A fresh list of events, fetched by every VU on every iteration', mr: 'events ची नवी यादी, प्रत्येक VU ने प्रत्येक iteration ला आणलेली' },
          { en: 'Nothing: the return value of setup() is thrown away', mr: 'काहीच नाही: setup() ची return value फेकून दिली जाते' },
          { en: 'The whole HTTP response object from GET /events', mr: 'GET /events चा पूर्ण HTTP response object' },
        ],
        answer: 0,
        explain: { en: 'setup() runs once. "Zakir Khan: Stand-up" has id 3, so every VU gets { eventId: 3 } as its data argument.', mr: 'setup() एकदाच चालतो. "Zakir Khan: Stand-up" चा id 3 आहे, म्हणून प्रत्येक VU ला data argument म्हणून { eventId: 3 } मिळतं.' },
      },
      {
        q: { en: 'A value from one response is sent in the next request (the token, the cartId). What is this called, and which JMeter element does it?', mr: 'एका response मधली value पुढच्या request मध्ये पाठवली जाते (token, cartId). याला काय म्हणतात, आणि JMeter मध्ये हे कोणता element करतो?' },
        options: [
          { en: 'Parameterization; CSV Data Set Config', mr: 'parameterization; CSV Data Set Config' },
          { en: 'Ramp-up; Thread Group', mr: 'ramp-up; Thread Group' },
          { en: 'Assertion; Response Assertion', mr: 'assertion; Response Assertion' },
          { en: 'Correlation; JSON Extractor (or Regular Expression Extractor)', mr: 'correlation; JSON Extractor (किंवा Regular Expression Extractor)' },
        ],
        answer: 3,
        explain: { en: 'Correlation carries dynamic values from response to request. Parameterization (CSV Data Set Config, SharedArray) feeds input data from a file; the two work together.', mr: 'correlation बदलत्या values response मधून request मध्ये नेतं. parameterization (CSV Data Set Config, SharedArray) file मधून input data देतं; दोन्ही एकत्र काम करतात.' },
      },
      {
        q: { en: 'You want the summary to show how many orders were confirmed, and the test to fail if there are 2000 or fewer. Which fits?', mr: 'summary मध्ये किती orders confirm झाल्या ते दिसावं, आणि 2000 किंवा कमी असतील तर test fail व्हावी असं तुम्हाला हवंय. काय योग्य आहे?' },
        options: [
          "new Trend('orders') with orders: ['p(95)>2000']",
          "new Counter('orders'), orders.add(1) for each confirmed order, and orders: ['count>2000']",
          "new Rate('orders') with orders: ['rate<2000']",
          "a check named 'orders' with checks: ['count>2000']",
        ],
        answer: 1,
        explain: { en: 'A Counter adds up values, and count is its total for the run. A Trend is for timings and sizes (p95, avg), a Rate for yes/no ratios, and checks count passed checks, not orders.', mr: 'Counter values ची बेरीज करतो, आणि count म्हणजे run मधली त्याची एकूण संख्या. Trend वेळ आणि आकारांसाठी असतो (p95, avg), Rate हो/नाही च्या प्रमाणासाठी, आणि checks pass झालेले checks मोजतात, orders नाही.' },
      },
    ],
    recap: { line: { en: 'Real data makes real load: SharedArray + open() + __VU for different fans, correlation for token, show id and cartId, setup() for one-time work, group() for steps, Trend and Counter for business numbers (JMeter: CSV Data Set Config, JSON Extractor).', mr: 'खरा data म्हणजे खरा load: वेगवेगळ्या fans साठी SharedArray + open() + __VU, token, show id आणि cartId साठी correlation, एकदाच करायच्या कामासाठी setup(), steps साठी group(), business च्या आकड्यांसाठी Trend आणि Counter (JMeter: CSV Data Set Config, JSON Extractor).' }, icon: '🪪' },
  },
]
