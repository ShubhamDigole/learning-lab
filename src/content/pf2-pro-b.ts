import type { Lesson } from './types.ts'
import type { PerfResult } from '../perf/k6.ts'

// Performance 2, part B: open and closed models (arrival-rate scenarios, dropped_iterations, two scenarios at
// once, JMeter in one page) and the boss: the full opening-night test plan and the launch verdict.
//
// Measured on the engine before choosing the numbers below:
//  - closed model, 150 VUs on /events/1/seats with sleep(1): healthy ~131 req/s, p95 ~200ms.
//    slow-seats: ~31 req/s, p95 ~4.2s, 0% errors (the test slows down with the server).
//  - open model, constant-arrival-rate 150/s on seats: healthy p95 ~189ms, 0% errors. slow-seats: ~75% 503s, p95 ~8.9s.
//  - ramping-arrival-rate 10 -> 100/s (seats, sleep 1, events): healthy needs ~119 VUs, 0 dropped with maxVUs 200,
//    seats p95 ~190ms, events ~67ms. With maxVUs 20: ~6,400 dropped iterations. slow-seats and no-cache: p95 in seconds
//    and thousands of dropped iterations.
//  - browsers 30/s + buyers 20/s (constant-arrival-rate): browsers p95 ~172ms, buyers p95 ~380ms, 0% errors.
//    small-pool: p95 ~8s. slow-seats: p95 ~4s. (errors-under-load only ~1% at this rate.)
//  - boss plan: browsers 30/s + buyers ramping to 30/s (SharedArray users, full journey): events p95 ~70ms,
//    seats ~193ms, login ~148ms, checkout ~454ms, 0% errors, 0 dropped.
//    errors-under-load: ~17% checkout failures. small-pool: p95 ~7-9s and ~1,700 dropped. slow-seats: p95 ~6-7s.
//    Above ~35 buyers/s the healthy server saturates: at 45/s p95 ~3.5s and iterations are dropped.

type Sc = Record<string, unknown>
const scenariosOf = (r: PerfResult): Record<string, Sc> => (r.options.scenarios && typeof r.options.scenarios === 'object' ? (r.options.scenarios as Record<string, Sc>) : {})
const anyExecutor = (r: PerfResult, ex: string) => Object.values(scenariosOf(r)).some((s) => s.executor === ex)

const BASE_LINE = "const BASE = 'https://api.stagedoor.test';"

// ───────────────────────── P2.4 scripts

const P24_CLOSED_SANDBOX = `import http from 'k6/http';
import { sleep } from 'k6';

${BASE_LINE}

// closed model: 150 VUs, each one waits for its answer, thinks 1 s, then asks again
export const options = {
  vus: 150,
  duration: '1m',
  thresholds: { http_req_failed: ['rate<0.01'] },
};

export default function () {
  http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
  sleep(1);
}
`

const P24_OPEN_START = `import http from 'k6/http';
import { check, sleep } from 'k6';

${BASE_LINE}

export const options = {
  // TODO: this is a closed model. Replace vus + duration with an open model:
  //   scenarios: { fans: { executor 'constant-arrival-rate', 150 iterations per '1s',
  //   for '1m', preAllocatedVUs 30, maxVUs 200 } }
  vus: 150,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:seats}': ['p(95)<500'],
  },
};

export default function () {
  const res = http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
  check(res, { 'seats 200': (r) => r.status === 200 });
  // TODO: with an arrival rate, the executor decides when the next fan arrives: remove this sleep
  sleep(1);
}
`

const P24_OPEN_SOL = `import http from 'k6/http';
import { check } from 'k6';

${BASE_LINE}

export const options = {
  scenarios: {
    fans: {
      executor: 'constant-arrival-rate',
      rate: 150,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 30,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:seats}': ['p(95)<500'],
  },
};

export default function () {
  const res = http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
  check(res, { 'seats 200': (r) => r.status === 200 });
}
`

const P24_RAMP_BODY = `export default function () {
  const seats = http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
  check(seats, { 'seats 200': (r) => r.status === 200 });
  sleep(1);
  http.get(BASE + '/events', { tags: { name: 'events' } });
}
`

const P24_RAMP_START = `import http from 'k6/http';
import { check, sleep } from 'k6';

${BASE_LINE}

export const options = {
  scenarios: {
    rush: {
      // TODO 1: make it ramping-arrival-rate: startRate 10, timeUnit '1s', and stages
      //   30s up to 100, 1m at 100, 10s down to 0 (then rate and duration are not needed)
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '1m40s',
      // TODO 2: 20 VUs cannot keep up with 100 fans a second: preAllocatedVUs 50, maxVUs 200
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:seats}': ['p(95)<500'],
    'http_req_duration{name:events}': ['p(95)<300'],
    // TODO 3: the test itself must deliver every fan: dropped_iterations count below 1
  },
};

${P24_RAMP_BODY}`

const P24_RAMP_SOL = `import http from 'k6/http';
import { check, sleep } from 'k6';

${BASE_LINE}

export const options = {
  scenarios: {
    rush: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:seats}': ['p(95)<500'],
    'http_req_duration{name:events}': ['p(95)<300'],
    dropped_iterations: ['count<1'],
  },
};

${P24_RAMP_BODY}`

const P24_TWO_FUNCS = `export function browse() {
  http.get(BASE + '/events', { tags: { name: 'events' } });
  sleep(1);
  http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
}

export function buy() {
  const n = String((__VU % 200) + 1).padStart(3, '0');
  const login = http.post(BASE + '/auth/login', JSON.stringify({ username: 'fan' + n, password: 'pass' + n }), { headers: JSON_HEADERS, tags: { name: 'login' } });
  const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + login.json('token') };
  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  sleep(1);
  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });
  check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });
}
`

const P24_TWO_HEAD = `import http from 'k6/http';
import { check, sleep } from 'k6';

${BASE_LINE}
const JSON_HEADERS = { 'Content-Type': 'application/json' };
`

const P24_TWO_THRESHOLDS = `  thresholds: {
    'http_req_duration{scenario:browsers}': ['p(95)<400'],
    'http_req_duration{scenario:buyers}': ['p(95)<800'],
    'http_req_failed{scenario:buyers}': ['rate<0.01'],
    dropped_iterations: ['count<1'],
  },`

const P24_TWO_START = `${P24_TWO_HEAD}
export const options = {
  scenarios: {
    browsers: {
      executor: 'constant-arrival-rate',
      exec: 'browse',
      rate: 30,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
    // TODO: a second scenario named buyers that runs the buy function:
    //   constant-arrival-rate, 20 per '1s', for '40s', starting 10s after the browsers,
    //   preAllocatedVUs 30, maxVUs 150
  },
${P24_TWO_THRESHOLDS}
};

${P24_TWO_FUNCS}`

const P24_TWO_SOL = `${P24_TWO_HEAD}
export const options = {
  scenarios: {
    browsers: {
      executor: 'constant-arrival-rate',
      exec: 'browse',
      rate: 30,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
    buyers: {
      executor: 'constant-arrival-rate',
      exec: 'buy',
      startTime: '10s',
      rate: 20,
      timeUnit: '1s',
      duration: '40s',
      preAllocatedVUs: 30,
      maxVUs: 150,
    },
  },
${P24_TWO_THRESHOLDS}
};

${P24_TWO_FUNCS}`

// ───────────────────────── P2.5 scripts (the opening night test plan)

const B_HEAD = `import http from 'k6/http';
import { check, sleep } from 'k6';

${BASE_LINE}
const JSON_HEADERS = { 'Content-Type': 'application/json' };
`

const B_HEAD_DATA = `import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

${BASE_LINE}
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const users = new SharedArray('users', () => JSON.parse(open('./users.json')));
`

const B_BROWSERS = `    browsers: {
      executor: 'constant-arrival-rate',
      exec: 'browse',
      rate: 30,
      timeUnit: '1s',
      duration: '1m30s',
      preAllocatedVUs: 20,
      maxVUs: 100,
    },`

const B_BUYERS = `    buyers: {
      executor: 'ramping-arrival-rate',
      exec: 'buy',
      startTime: '10s',
      startRate: 2,
      timeUnit: '1s',
      preAllocatedVUs: 30,
      maxVUs: 200,
      stages: [
        { duration: '20s', target: 30 },
        { duration: '50s', target: 30 },
        { duration: '10s', target: 0 },
      ],
    },`

const B_BROWSE = `export function browse() {
  const list = http.get(BASE + '/events', { tags: { name: 'events' } });
  check(list, { 'events 200': (r) => r.status === 200 });
  sleep(1);
  http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
}
`

const B_BUY_VU = `export function buy() {
  const n = String((__VU % 200) + 1).padStart(3, '0');
  const login = http.post(BASE + '/auth/login', JSON.stringify({ username: 'fan' + n, password: 'pass' + n }), { headers: JSON_HEADERS, tags: { name: 'login' } });
  check(login, { 'logged in': (r) => r.status === 200 });
  const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + login.json('token') };

  http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
  sleep(1);

  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  check(cart, { 'cart created': (r) => r.status === 201 });
  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });
  check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });
}
`

const B_BUY = `export function buy() {
  const user = users[__VU % users.length];
  const login = http.post(BASE + '/auth/login', JSON.stringify(user), { headers: JSON_HEADERS, tags: { name: 'login' } });
  check(login, { 'logged in': (r) => r.status === 200 });
  const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + login.json('token') };

  http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
  sleep(1);

  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  check(cart, { 'cart created': (r) => r.status === 201 });
  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });
  check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });
}
`

const B_BASIC_THRESHOLDS = `  thresholds: {
    checks: ['rate>0.99'],
    dropped_iterations: ['count<1'],
  },`

const B1_START = `${B_HEAD}
export const options = {
  scenarios: {
${B_BROWSERS}
    // TODO: the buyers scenario, running buy():
    //   ramping-arrival-rate, starting 10s after the browsers, startRate 2 per '1s',
    //   stages: 20s up to 30, 50s at 30, 10s down to 0
    //   preAllocatedVUs 30, maxVUs 200
  },
${B_BASIC_THRESHOLDS}
};

${B_BROWSE}
${B_BUY_VU}`

const B1_SOL = `${B_HEAD}
export const options = {
  scenarios: {
${B_BROWSERS}
${B_BUYERS}
  },
${B_BASIC_THRESHOLDS}
};

${B_BROWSE}
${B_BUY_VU}`

const B2_START = `import http from 'k6/http';
import { check, sleep } from 'k6';
// TODO: import SharedArray from 'k6/data'

${BASE_LINE}
const JSON_HEADERS = { 'Content-Type': 'application/json' };
// TODO: load ./users.json once for all VUs: new SharedArray('users', () => JSON.parse(open('./users.json')))

export const options = {
  scenarios: {
${B_BROWSERS}
${B_BUYERS}
  },
${B_BASIC_THRESHOLDS}
};

${B_BROWSE}
export function buy() {
  // TODO: every buyer logs in as fan001. Pick a real fan from the file: users[__VU % users.length]
  const user = { username: 'fan001', password: 'pass001' };
  const login = http.post(BASE + '/auth/login', JSON.stringify(user), { headers: JSON_HEADERS, tags: { name: 'login' } });
  check(login, { 'logged in': (r) => r.status === 200 });
  const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + login.json('token') };

  http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
  sleep(1);

  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  check(cart, { 'cart created': (r) => r.status === 201 });
  // TODO: finish the journey: POST /checkout with this cart's id (name it 'checkout')
  //       and check 'order confirmed': the response field status is 'CONFIRMED'
}
`

const B2_SOL = `${B_HEAD_DATA}
export const options = {
  scenarios: {
${B_BROWSERS}
${B_BUYERS}
  },
${B_BASIC_THRESHOLDS}
};

${B_BROWSE}
${B_BUY}`

const B3_START = `${B_HEAD_DATA}
export const options = {
  scenarios: {
${B_BROWSERS}
${B_BUYERS}
  },
  thresholds: {
    checks: ['rate>0.99'],
    dropped_iterations: ['count<1'],
    // TODO: Sam's launch goals, one per endpoint, plus the error goals.
    //   healthy p95 at this load: events ~70 ms, seats ~195 ms, login ~150 ms, checkout ~455 ms
  },
};

${B_BROWSE}
${B_BUY}`

const B_FULL_THRESHOLDS = `  thresholds: {
    'http_req_duration{name:events}': ['p(95)<300'],
    'http_req_duration{name:seats}': ['p(95)<500'],
    'http_req_duration{name:login}': ['p(95)<400'],
    'http_req_duration{name:checkout}': ['p(95)<800'],
    'http_req_failed{name:checkout}': ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    dropped_iterations: ['count<1'],
  },`

const B3_SOL = `${B_HEAD_DATA}
export const options = {
  scenarios: {
${B_BROWSERS}
${B_BUYERS}
  },
${B_FULL_THRESHOLDS}
};

${B_BROWSE}
${B_BUY}`

// the Gremlin's sudden rush: buyers go past the plan (30/s) to 45/s
const B4_SANDBOX = `${B_HEAD_DATA}
export const options = {
  scenarios: {
    browsers: {
      executor: 'constant-arrival-rate',
      exec: 'browse',
      rate: 30,
      timeUnit: '1s',
      duration: '2m10s',
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
    buyers: {
      executor: 'ramping-arrival-rate',
      exec: 'buy',
      startTime: '10s',
      startRate: 2,
      timeUnit: '1s',
      preAllocatedVUs: 30,
      maxVUs: 400,
      stages: [
        { duration: '20s', target: 30 }, // the plan: 30 buyers a second
        { duration: '40s', target: 30 },
        { duration: '20s', target: 45 }, // the Gremlin's sudden rush
        { duration: '30s', target: 45 },
        { duration: '10s', target: 0 },
      ],
    },
  },
${B_FULL_THRESHOLDS}
};

${B_BROWSE}
${B_BUY}`

export const pfProLessonsB: Lesson[] = [
  // ───────────────────────── P2.4 Open and closed models, scenarios, and JMeter in one page
  {
    id: 'pf2-4',
    code: 'P2.4',
    level: 'intermediate',
    title: { en: 'Open and closed models, scenarios, and JMeter in one page', mr: 'Open आणि closed models, scenarios, आणि एका पानात JMeter' },
    skill: 'constant-arrival-rate, ramping-arrival-rate, dropped_iterations, exec, startTime',
    realLife: {
      place: 'station',
      title: { en: 'A thali restaurant and a local train platform', mr: 'थाळीचं हॉटेल आणि लोकलचा platform' },
      story: {
        en: 'Near Dadar station there is a thali restaurant with 20 tables. When the kitchen is slow, nothing dramatic happens: a new family sits down only when a table is free, so the hall always looks calm. Just outside is platform 1. At 6 pm a local train arrives every three minutes and drops 300 people, whether the stairs are clear or not. If the stairs are slow, the crowd on the platform just keeps growing. The restaurant controls how many people come in. The station does not. A ticket sale at 10 am works like the platform.',
        mr: 'दादर स्टेशनजवळ 20 टेबलांचं एक थाळीचं हॉटेल आहे. स्वयंपाकघर हळू झालं तरी काही नाट्यमय घडत नाही: टेबल मोकळं झालं तरच नवीन कुटुंब बसतं, म्हणून हॉल नेहमी शांत दिसतो. बाहेरच platform 1 आहे. संध्याकाळी 6 वाजता दर तीन मिनिटांनी लोकल येते आणि 300 लोक उतरतात, जिना मोकळा असो वा नसो. जिना हळू असेल तर platform वरची गर्दी वाढतच जाते. हॉटेल किती लोक आत येतात ते ठरवतं. स्टेशन ठरवू शकत नाही. सकाळी 10 चा ticket sale अगदी त्या platform सारखा असतो.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🍽️', label: 'Restaurant: a new family sits only when a table frees up (closed)', mr: 'हॉटेल: टेबल मोकळं झालं तरच नवीन कुटुंब बसतं (closed)' },
          { icon: '🐢', label: 'Slow kitchen: fewer families served, the hall still looks calm', mr: 'हळू स्वयंपाकघर: कमी कुटुंबं जेवतात, हॉल तरीही शांत दिसतो' },
          { icon: '🚆', label: 'Platform: 300 people every 3 minutes, no matter what (open)', mr: 'platform: दर 3 मिनिटांनी 300 लोक, काहीही झालं तरी (open)' },
          { icon: '🌊', label: 'Slow stairs: the crowd keeps growing', mr: 'हळू जिना: गर्दी वाढतच जाते' },
        ],
        breakAt: 3,
        breakNote: { en: 'Arrivals do not wait for the platform to clear. Real fans at 10 am do not either.', mr: 'येणारे लोक platform मोकळा होण्याची वाट पाहत नाहीत. सकाळी 10 चे खरे fans सुद्धा नाही.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'happy', text: { en: 'Good news. I ran 800 VUs at the seat map and got zero errors. The server just got slower. We can take any crowd!', mr: 'चांगली बातमी. मी seat map वर 800 VUs चालवले आणि एकही error नाही. server फक्त हळू झाला. आपण कितीही गर्दी घेऊ शकतो!' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Your 800 VUs are polite, Theo. Each one waits for its answer before asking again. When the server slows down, your test slows down with it. Real fans keep arriving at 10 am, slow server or not.', mr: 'तुझे 800 VUs खूप सभ्य आहेत, Theo. प्रत्येकजण उत्तर मिळाल्याशिवाय पुन्हा विचारत नाही. server हळू झाला की तुझी test पण त्याच्यासोबत हळू होते. खरे fans सकाळी 10 ला येतच राहतात, server हळू असो वा नसो.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> my bots don\'t wait their turn. 150 new ones every second, starting at 10:00:00. ⌁', mr: '>> माझे bots आपल्या पाळीची वाट पाहत नाहीत. दर सेकंदाला 150 नवे, 10:00:00 पासून. ⌁' } },
        { who: 'sam', mood: 'worried', text: { en: 'And the agency that tests our partners only speaks JMeter. Can we even compare their report with ours?', mr: 'आणि आपल्या partners ची testing करणारी agency फक्त JMeter बोलते. त्यांचा report आपल्या report शी तुलना तरी करता येईल का?' } },
        { who: 'meera', mood: 'happy', text: { en: '{name}, two jobs: model the crowd the way it really arrives, and learn JMeter\'s words so you can read any report. They are the same ideas with different names.', mr: '{name}, दोन कामं: गर्दी खरोखर जशी येते तसं model करा, आणि JMeter चे शब्द शिका म्हणजे कुठलाही report वाचता येईल. कल्पना त्याच, फक्त नावं वेगळी.' } },
      ],
      problem: { en: 'A test with a fixed number of VUs is a closed model: each VU sends the next request only after the last answer comes back. When the server slows down, the test sends less, so the load drops exactly when the server struggles. The report says "slow, but zero errors", while real fans at 10 am would have seen errors. On top of that, a real sale has two crowds at once (people browsing and people buying), and the industry reports in JMeter terms.', mr: 'ठरावीक VUs असलेली test म्हणजे closed model: प्रत्येक VU आधीचं उत्तर आल्यावरच पुढची request पाठवतो. server हळू झाला की test कमी पाठवते, म्हणजे server ला त्रास होत असतानाच load कमी होतो. report सांगतो "हळू, पण एकही error नाही", आणि सकाळी 10 च्या खऱ्या fans ना errors दिसले असते. शिवाय खऱ्या sale मध्ये एकाच वेळी दोन गर्दी असतात (बघणारे आणि खरेदी करणारे), आणि industry JMeter च्या भाषेत report करते.' },
      solution: { en: 'An open model sets how many fans arrive per second, whatever the server does: the constant-arrival-rate and ramping-arrival-rate executors. dropped_iterations shows when k6 itself could not deliver the load, and a threshold on it keeps the test honest. Scenarios run browsers and buyers side by side, each with its own function (exec) and start time. And a one-page JMeter map turns Thread Group, Sampler, Assertion and Listener into the k6 words you already know.', mr: 'open model मध्ये server काहीही करो, दर सेकंदाला किती fans येतात ते तुम्ही ठरवता: constant-arrival-rate आणि ramping-arrival-rate executors. k6 स्वतः load पोहोचवू शकला नाही तर dropped_iterations ते दाखवतो, आणि त्यावरचा threshold test ला प्रामाणिक ठेवतो. scenarios मध्ये बघणारे आणि खरेदी करणारे शेजारी शेजारी चालतात, प्रत्येकाचं स्वतःचं function (exec) आणि सुरू होण्याची वेळ. आणि एका पानाचा JMeter नकाशा Thread Group, Sampler, Assertion आणि Listener यांना तुम्हाला आधीच माहीत असलेल्या k6 शब्दांत बदलतो.' },
    },
    lesson: [
      { en: 'Closed model: a fixed number of VUs loop through the script. A VU sends its next request only when the last one has answered. So the server sets the pace: if it slows down, every VU slows down, and the load falls. On the Gremlin\'s slow seat-map build, 150 VUs with 1 second of think time reached only about 31 requests per second, p95 4.2 s, and 0% errors. Even 400 VUs on the full buying journey only made every step take about 2 s, with zero errors. Closed tests are right for "N people are logged in all day". They hide trouble when the crowd arrives on its own clock.', mr: 'closed model: ठरावीक VUs script मध्ये फिरत राहतात. आधीच्या request चं उत्तर आल्यावरच VU पुढची request पाठवतो. म्हणजे वेग server ठरवतो: तो हळू झाला की प्रत्येक VU हळू होतो, आणि load कमी होतो. gremlin च्या हळू seat-map build वर, 1 सेकंद think time असलेले 150 VUs फक्त सेकंदाला सुमारे 31 requests पर्यंत पोहोचले, p95 4.2 s, आणि 0% errors. पूर्ण खरेदीच्या journey वर 400 VUs सुद्धा फक्त प्रत्येक step ला सुमारे 2 s लावू शकले, एकही error नाही. "दिवसभर N लोक logged in असतात" यासाठी closed tests बरोबर आहेत. पण गर्दी स्वतःच्या घड्याळाने येते तेव्हा त्या अडचणी लपवतात.' },
      { en: 'Open model: you set the arrivals, not the users. executor: \'constant-arrival-rate\' with rate: 150 and timeUnit: \'1s\' starts 150 iterations every second for the duration, whether earlier ones have finished or not. k6 needs a VU for each running iteration: it starts with preAllocatedVUs and adds more up to maxVUs. ramping-arrival-rate does the same with stages, where target is the rate (startRate is where it begins). The same slow build at 150 arrivals per second: about 3 in 4 fans got 503 Service Unavailable, because the server shed load. That is the real 10 am.', mr: 'open model: तुम्ही users नाही, येणाऱ्यांचा वेग ठरवता. executor: \'constant-arrival-rate\' सोबत rate: 150 आणि timeUnit: \'1s\' म्हणजे duration भर दर सेकंदाला 150 iterations सुरू, आधीच्या संपल्या असोत वा नसोत. चालू असलेल्या प्रत्येक iteration साठी k6 ला एक VU लागतो: तो preAllocatedVUs ने सुरू करतो आणि maxVUs पर्यंत वाढवतो. ramping-arrival-rate हेच stages सोबत करतो, जिथे target म्हणजे rate (startRate पासून सुरुवात). तोच हळू build, सेकंदाला 150 येणारे: साधारण 4 पैकी 3 fans ना 503 Service Unavailable मिळाला, कारण server ने load झटकला. हीच खरी सकाळची 10 ची वेळ.' },
      { en: 'When every VU is busy and maxVUs is reached, k6 cannot start the next arrival. It counts it in dropped_iterations: fans you asked for who never reached the server. A test with dropped iterations did not deliver its load, so add dropped_iterations: [\'count<1\'] (or a small limit) to make it fail. Scenarios run several crowds at once: each scenario gets exec (the exported function it runs) and startTime (when it begins). Filter goals by scenario too: \'http_req_duration{scenario:buyers}\'. Remember that rate counts iterations: 30 buyers a second with 4 requests each is about 120 requests a second.', mr: 'सगळे VUs busy असतील आणि maxVUs गाठले असतील, तर k6 पुढचा येणारा सुरू करू शकत नाही. तो dropped_iterations मध्ये मोजतो: तुम्ही मागितलेले पण server पर्यंत कधीच न पोहोचलेले fans. dropped iterations असलेल्या test ने तिचा load पोहोचवलाच नाही, म्हणून dropped_iterations: [\'count<1\'] (किंवा छोटी मर्यादा) जोडा म्हणजे ती fail होईल. scenarios एकाच वेळी अनेक गर्दी चालवतात: प्रत्येक scenario ला exec (तो चालवणारं exported function) आणि startTime (तो कधी सुरू होतो) असतो. ध्येयं scenario नुसारही filter करा: \'http_req_duration{scenario:buyers}\'. लक्षात ठेवा rate म्हणजे iterations: प्रत्येकी 4 requests असलेले सेकंदाला 30 buyers म्हणजे सेकंदाला सुमारे 120 requests.' },
      { en: 'JMeter in one page. Thread Group = VUs + ramp-up period + loop count (or duration). Sampler (HTTP Request) = one http.get or http.post. Assertion (Response Assertion) = check. Listener (Aggregate Report, Summary Report) = the end-of-test summary and By endpoint table; the Aggregate Report\'s "90% Line" is p(90). CSV Data Set Config = SharedArray with open(). JSON Extractor plus ${token} = res.json(\'token\') correlation. Transaction Controller = group. Constant Throughput Timer or Throughput Shaping Timer is the nearest thing to an arrival rate, while a plain Thread Group is a closed model. Pass/fail goals need a plugin or a CI step in JMeter; in k6 they are thresholds.', mr: 'एका पानात JMeter. Thread Group = VUs + ramp-up period + loop count (किंवा duration). Sampler (HTTP Request) = एक http.get किंवा http.post. Assertion (Response Assertion) = check. Listener (Aggregate Report, Summary Report) = test शेवटचा summary आणि By endpoint table; Aggregate Report मधली "90% Line" म्हणजे p(90). CSV Data Set Config = open() सह SharedArray. JSON Extractor आणि ${token} = res.json(\'token\') correlation. Transaction Controller = group. Constant Throughput Timer किंवा Throughput Shaping Timer हे arrival rate च्या सगळ्यात जवळचं, तर साधा Thread Group म्हणजे closed model. JMeter मध्ये pass/fail ध्येयांसाठी plugin किंवा CI step लागते; k6 मध्ये ते thresholds आहेत.' },
    ],
    syntax: {
      template: "export const options = {\n  scenarios: {\n    browsers: {\n      executor: 'constant-arrival-rate',\n      exec: 'browse',\n      rate: 30, timeUnit: '1s', duration: '1m',\n      preAllocatedVUs: 20, maxVUs: 100,\n    },\n    buyers: {\n      executor: 'ramping-arrival-rate',\n      exec: 'buy', startTime: '10s',\n      startRate: 2, timeUnit: '1s',\n      preAllocatedVUs: 30, maxVUs: 200,\n      stages: [{ duration: '20s', target: 30 }, { duration: '40s', target: 30 }],\n    },\n  },\n  thresholds: {\n    'http_req_duration{scenario:buyers}': ['p(95)<800'],\n    dropped_iterations: ['count<1'],\n  },\n};\n\nexport function browse() { /* ... */ }\nexport function buy() { /* ... */ }",
      parts: [
        { code: "executor: 'constant-arrival-rate'", means: { en: 'open model: a fixed number of new iterations per timeUnit, whatever the server does', mr: 'open model: server काहीही करो, दर timeUnit ला ठरावीक नव्या iterations' } },
        { code: "rate: 30, timeUnit: '1s'", means: { en: '30 arrivals every second (timeUnit \'1m\' would mean 30 a minute)', mr: 'दर सेकंदाला 30 येणारे (timeUnit \'1m\' म्हणजे मिनिटाला 30)' } },
        { code: 'preAllocatedVUs / maxVUs', means: { en: 'VUs ready at the start, and the most k6 may add when iterations pile up', mr: 'सुरुवातीला तयार VUs, आणि iterations साचल्या तर k6 जास्तीत जास्त किती वाढवू शकतो' } },
        { code: "exec: 'buy', startTime: '10s'", means: { en: 'this scenario runs the exported function buy, starting 10 seconds into the test', mr: 'हा scenario exported function buy चालवतो, test सुरू झाल्यावर 10 सेकंदांनी' } },
        { code: "dropped_iterations: ['count<1']", means: { en: 'fail the test if k6 could not start every arrival you asked for', mr: 'तुम्ही मागितलेला प्रत्येक येणारा k6 सुरू करू शकला नाही तर test fail' } },
      ],
      example: [
        { code: "rate: 150, timeUnit: '1s', duration: '1m',", note: { en: 'the Gremlin\'s 150 bots a second, for a minute: 9,000 arrivals', mr: 'gremlin चे सेकंदाला 150 bots, एक मिनिट: 9,000 येणारे' } },
        { code: "stages: [{ duration: '30s', target: 100 }, { duration: '1m', target: 100 }],", note: { en: 'in ramping-arrival-rate, target is fans per second, not VUs', mr: 'ramping-arrival-rate मध्ये target म्हणजे सेकंदाला fans, VUs नाही' } },
        { code: "preAllocatedVUs: 50, maxVUs: 200,", note: { en: 'enough VUs for 100 fans a second who each stay about a second', mr: 'प्रत्येकी सुमारे एक सेकंद थांबणाऱ्या सेकंदाला 100 fans साठी पुरेसे VUs' } },
        { code: "buyers: { executor: 'constant-arrival-rate', exec: 'buy', startTime: '10s', rate: 20 },", note: { en: 'buyers join 10 s after the browsers, 20 a second', mr: 'बघणाऱ्यांनंतर 10 s नी buyers येतात, सेकंदाला 20' } },
        { code: "'http_req_failed{scenario:buyers}': ['rate<0.01'],", note: { en: 'a goal for the buyers alone, whatever the browsers do', mr: 'फक्त buyers चं ध्येय, बघणारे काहीही करोत' } },
      ],
      pitfall: { en: 'A green test with dropped iterations is a test that never sent the crowd you planned. Read dropped_iterations in every arrival-rate summary, and put a threshold on it. Also, maxVUs too small looks like "the server was fine", when k6 simply ran out of VUs. And do not mix vus, duration or stages at the top level with scenarios: once you use scenarios, every crowd is described inside them.', mr: 'dropped iterations असलेली हिरवी test म्हणजे तुम्ही ठरवलेली गर्दी कधीच न पाठवलेली test. प्रत्येक arrival-rate summary मध्ये dropped_iterations वाचा, आणि त्यावर threshold ठेवा. शिवाय, maxVUs खूप लहान असेल तर "server ठीक होता" असं वाटतं, जेव्हा k6 कडे फक्त VUs संपलेले असतात. आणि scenarios सोबत वरच्या पातळीवर vus, duration किंवा stages मिसळू नका: scenarios वापरले की प्रत्येक गर्दी त्यांच्यातच लिहायची.' },
    },
    practice: {
      intro: { en: 'First see how a closed test hides a broken build, then rebuild it as an open model, ramp it, and run two crowds at once. Press Run load test, read the live chart on the right and the summary under it, then press Submit. The last step translates a JMeter plan.', mr: 'आधी closed test बिघडलेला build कसा लपवते ते पाहा, मग ती open model म्हणून पुन्हा बनवा, ramp करा, आणि दोन गर्दी एकत्र चालवा. Run load test दाबा, उजवीकडचा live chart आणि त्याखालचा summary वाचा, मग Submit दाबा. शेवटची step एक JMeter plan भाषांतरित करते.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'This is Theo\'s closed test: 150 VUs on the seat map, each thinking 1 second between requests. It runs on the Gremlin\'s slow seat-map build. The real crowd is about 150 fans a second. Press Run load test and look at Requests/s, p95 and the error rate. What really happened?', mr: 'ही Theo ची closed test आहे: seat map वर 150 VUs, प्रत्येकजण requests मध्ये 1 सेकंद विचार करतो. ती gremlin च्या हळू seat-map build वर चालते. खरी गर्दी साधारण सेकंदाला 150 fans. Run load test दाबा आणि Requests/s, p95 आणि error rate पाहा. खरं काय घडलं?' },
          perfSandbox: { code: P24_CLOSED_SANDBOX, build: ['slow-seats'] },
          options: [
            { en: 'The server is healthy: 0% errors means every fan was served', mr: 'server निरोगी आहे: 0% errors म्हणजे प्रत्येक fan ला सेवा मिळाली' },
            { en: 'k6 could not create enough VUs, so the numbers are not valid', mr: 'k6 पुरेसे VUs बनवू शकला नाही, म्हणून आकडे ग्राह्य नाहीत' },
            { en: 'Only about 31 requests a second reached the server, because each VU waited about 4 s for its answer before asking again. The test slowed down with the server, so it never sent the real crowd, and the errors stayed hidden.', mr: 'server पर्यंत सेकंदाला फक्त सुमारे 31 requests पोहोचल्या, कारण प्रत्येक VU पुन्हा विचारण्याआधी उत्तरासाठी सुमारे 4 s थांबला. test server सोबत हळू झाली, म्हणून तिने खरी गर्दी कधीच पाठवली नाही, आणि errors लपून राहिले.' },
            { en: 'The think time is too long; with sleep(0.1) the test would be realistic', mr: 'think time खूप जास्त आहे; sleep(0.1) ठेवलं तर test खरी होईल' },
          ],
          correct: [2],
          explain: { en: 'In a closed model the server sets the pace. 150 VUs with p95 about 4.2 s plus 1 s of think time can only send about 150 / 5 ≈ 30 requests a second, a fifth of the real crowd. Real fans do not wait for the previous fan to finish. That is why the next step uses an arrival rate.', mr: 'closed model मध्ये वेग server ठरवतो. p95 सुमारे 4.2 s आणि 1 s think time असलेले 150 VUs सेकंदाला फक्त सुमारे 150 / 5 ≈ 30 requests पाठवू शकतात, खऱ्या गर्दीचा पाचवा भाग. खरे fans आधीचा fan संपण्याची वाट पाहत नाहीत. म्हणूनच पुढची step arrival rate वापरते.' },
          hints: [
            { en: 'Compare the Requests/s tile with the 150 fans a second Sam expects. How far apart are they?', mr: 'Requests/s चा आकडा Sam ला अपेक्षित सेकंदाला 150 fans शी तुलना करा. दोघांत किती अंतर आहे?' },
            { en: 'One VU can only send one request per loop. A loop takes the response time plus the sleep. What happens to the loop when the response takes 4 seconds?', mr: 'एक VU एका loop मध्ये एकच request पाठवू शकतो. loop ला response time अधिक sleep इतका वेळ लागतो. response ला 4 सेकंद लागले तर loop चं काय होतं?' },
            { en: 'The server never saw the real crowd. The test politely slowed down, so nothing failed.', mr: 'server ने खरी गर्दी कधी पाहिलीच नाही. test सभ्यपणे हळू झाली, म्हणून काहीच fail झालं नाही.' },
          ],
          successLine: { en: 'Theo goes quiet. "So my 800 VUs were standing in a polite queue." Exactly.', mr: 'Theo शांत होतो. "म्हणजे माझे 800 VUs सभ्य रांगेत उभे होते." अगदी बरोबर.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Rebuild it as an open model. Replace vus and duration with a scenario named fans: executor constant-arrival-rate, rate 150, timeUnit \'1s\', duration \'1m\', preAllocatedVUs 30, maxVUs 200. Remove the sleep, because the executor now decides when the next fan arrives. It must pass on the healthy server and fail on the Gremlin\'s slow seat map.', mr: 'ती open model म्हणून पुन्हा बनवा. vus आणि duration च्या जागी fans नावाचा scenario: executor constant-arrival-rate, rate 150, timeUnit \'1s\', duration \'1m\', preAllocatedVUs 30, maxVUs 200. sleep काढा, कारण आता पुढचा fan कधी येतो ते executor ठरवतो. ती निरोगी server वर pass आणि gremlin च्या हळू seat map वर fail व्हायला हवी.' },
          starter: P24_OPEN_START,
          solution: P24_OPEN_SOL,
          requireThresholds: true,
          mustNotUse: [{ pattern: '\\bvus\\s*:', message: { en: 'Remove the top-level vus: the scenario decides the load now.', mr: 'वरच्या पातळीवरचं vus: काढा: आता load scenario ठरवतो.' } }],
          verify: [
            { check: (r) => anyExecutor(r, 'constant-arrival-rate'), message: { en: "Add options.scenarios with a scenario that uses executor: 'constant-arrival-rate'.", mr: "options.scenarios मध्ये executor: 'constant-arrival-rate' वापरणारा scenario टाका." } },
            { check: (r) => Object.values(scenariosOf(r)).some((s) => Number(s.rate) >= 140 && Number(s.rate) <= 160), message: { en: 'The Gremlin sends about 150 fans a second: rate: 150 with timeUnit: \'1s\'.', mr: 'gremlin सेकंदाला सुमारे 150 fans पाठवतो: rate: 150 आणि timeUnit: \'1s\'.' } },
            { check: (r) => r.http.rps > 120, message: { en: 'The test should deliver about 150 requests a second. Check rate, timeUnit and maxVUs.', mr: 'test ने सेकंदाला सुमारे 150 requests पोहोचवायला हव्यात. rate, timeUnit आणि maxVUs तपासा.' } },
          ],
          mustCatch: [{ bug: 'slow-seats', label: { en: 'Seat map runs one query per seat (700 ms)', mr: 'seat map प्रत्येक seat साठी एक query चालवतो (700 ms)' } }],
          hints: [
            { en: 'scenarios is an object of named scenarios. Each one is an object with executor and its settings.', mr: 'scenarios हा नाव दिलेल्या scenarios चा object आहे. प्रत्येक scenario हा executor आणि त्याच्या settings असलेला object आहे.' },
            { en: 'The default function stays the same. Only options changes, plus the sleep line goes away.', mr: 'default function तसंच राहतं. फक्त options बदलतं, आणि sleep ची ओळ जाते.' },
            { en: "scenarios: {\n  fans: {\n    executor: 'constant-arrival-rate',\n    rate: 150,\n    timeUnit: '1s',\n    duration: '1m',\n    preAllocatedVUs: 30,\n    maxVUs: 200,\n  },\n},", mr: "scenarios: {\n  fans: {\n    executor: 'constant-arrival-rate',\n    rate: 150,\n    timeUnit: '1s',\n    duration: '1m',\n    preAllocatedVUs: 30,\n    maxVUs: 200,\n  },\n}," },
          ],
          successLine: { en: 'Healthy: 150 fans a second, p95 under 200 ms. Slow seat map: about 3 in 4 fans get 503. The closed test called that build "fine".', mr: 'निरोगी: सेकंदाला 150 fans, p95 200 ms खाली. हळू seat map: साधारण 4 पैकी 3 fans ना 503. closed test ने त्या build ला "ठीक" म्हटलं होतं.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Fans do not all arrive in the first second: the rush builds up. Each fan opens the seat map, looks for a second, then goes back to the list. Do three things: make it ramping-arrival-rate (startRate 10, timeUnit \'1s\', stages 30s up to 100, 1m at 100, 10s down to 0), give it enough VUs (preAllocatedVUs 50, maxVUs 200), and add a threshold dropped_iterations count below 1. Run the starter first: it is green, yet look at dropped_iterations.', mr: 'सगळे fans पहिल्याच सेकंदाला येत नाहीत: गर्दी हळूहळू वाढते. प्रत्येक fan seat map उघडतो, एक सेकंद पाहतो, मग यादीकडे परत जातो. तीन गोष्टी करा: ते ramping-arrival-rate करा (startRate 10, timeUnit \'1s\', stages 30s मध्ये 100 पर्यंत, 1m 100 वर, 10s मध्ये 0 पर्यंत), पुरेसे VUs द्या (preAllocatedVUs 50, maxVUs 200), आणि dropped_iterations count 1 पेक्षा कमी असा threshold जोडा. आधी starter चालवा: ती हिरवी आहे, तरी dropped_iterations पाहा.' },
          starter: P24_RAMP_START,
          solution: P24_RAMP_SOL,
          requireThresholds: true,
          mustUse: [{ pattern: 'dropped_iterations', message: { en: "Add the honesty goal: dropped_iterations: ['count<1'].", mr: "प्रामाणिकपणाचं ध्येय जोडा: dropped_iterations: ['count<1']." } }],
          verify: [
            { check: (r) => anyExecutor(r, 'ramping-arrival-rate'), message: { en: "Use executor: 'ramping-arrival-rate' with startRate and stages.", mr: "startRate आणि stages सह executor: 'ramping-arrival-rate' वापरा." } },
            { check: (r) => Object.values(scenariosOf(r)).some((s) => Array.isArray(s.stages) && (s.stages as { target: number }[]).some((st) => Number(st.target) >= 90)), message: { en: 'The stages should reach 100 fans a second (target: 100).', mr: 'stages सेकंदाला 100 fans पर्यंत पोहोचायला हवेत (target: 100).' } },
            { check: (r) => r.dropped === 0, message: { en: 'k6 still dropped iterations: it ran out of VUs. Raise preAllocatedVUs and maxVUs.', mr: 'k6 ने अजूनही iterations सोडल्या: त्याचे VUs संपले. preAllocatedVUs आणि maxVUs वाढवा.' } },
          ],
          mustCatch: [
            { bug: 'slow-seats', label: { en: 'Seat map runs one query per seat (700 ms)', mr: 'seat map प्रत्येक seat साठी एक query चालवतो (700 ms)' } },
            { bug: 'no-cache', label: { en: 'The events list skips its cache (220 ms)', mr: 'events ची यादी cache वापरत नाही (220 ms)' } },
          ],
          hints: [
            { en: 'Each fan keeps a VU busy for over a second. At 100 fans a second that is more than 100 VUs at once, and the starter allows 20. Count the dropped ones in the summary.', mr: 'प्रत्येक fan एक VU एका सेकंदाहून जास्त busy ठेवतो. सेकंदाला 100 fans म्हणजे एकाच वेळी 100 हून जास्त VUs, आणि starter फक्त 20 देतो. summary मध्ये dropped मोजा.' },
            { en: 'In ramping-arrival-rate the stages\' target is a rate. startRate is the rate at second zero. rate and duration are not used.', mr: 'ramping-arrival-rate मध्ये stages चा target म्हणजे rate. startRate म्हणजे शून्याव्या सेकंदाचा rate. rate आणि duration वापरले जात नाहीत.' },
            { en: "rush: {\n  executor: 'ramping-arrival-rate',\n  startRate: 10,\n  timeUnit: '1s',\n  preAllocatedVUs: 50,\n  maxVUs: 200,\n  stages: [\n    { duration: '30s', target: 100 },\n    { duration: '1m', target: 100 },\n    { duration: '10s', target: 0 },\n  ],\n},\n// and in thresholds:\ndropped_iterations: ['count<1'],", mr: "rush: {\n  executor: 'ramping-arrival-rate',\n  startRate: 10,\n  timeUnit: '1s',\n  preAllocatedVUs: 50,\n  maxVUs: 200,\n  stages: [\n    { duration: '30s', target: 100 },\n    { duration: '1m', target: 100 },\n    { duration: '10s', target: 0 },\n  ],\n},\n// and in thresholds:\ndropped_iterations: ['count<1']," },
          ],
          successLine: { en: 'The starter was green, but it dropped thousands of fans and sent less than a quarter of the crowd. Now every fan arrives, the healthy server holds, and both of the Gremlin\'s builds fail with dropped fans and seconds of p95.', mr: 'starter हिरवा होता, पण त्याने हजारो fans सोडले आणि गर्दीचा चौथा भागही पाठवला नाही. आता प्रत्येक fan पोहोचतो, निरोगी server टिकतो, आणि gremlin चे दोन्ही builds सोडलेल्या fans आणि सेकंदांच्या p95 सह fail होतात.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Opening night has two crowds. Browsers already run at 30 a second. Add a second scenario named buyers that runs the buy function: constant-arrival-rate, rate 20, timeUnit \'1s\', duration \'40s\', startTime \'10s\', preAllocatedVUs 30, maxVUs 150. The thresholds per scenario are ready. It must pass on the healthy server and fail on two of the Gremlin\'s builds.', mr: 'पहिल्या प्रयोगाच्या रात्री दोन गर्दी असतात. बघणारे आधीच सेकंदाला 30 चालतात. buy function चालवणारा buyers नावाचा दुसरा scenario जोडा: constant-arrival-rate, rate 20, timeUnit \'1s\', duration \'40s\', startTime \'10s\', preAllocatedVUs 30, maxVUs 150. scenario नुसार thresholds तयार आहेत. ती निरोगी server वर pass आणि gremlin च्या दोन builds वर fail व्हायला हवी.' },
          starter: P24_TWO_START,
          solution: P24_TWO_SOL,
          requireThresholds: true,
          verify: [
            { check: (r) => Object.keys(scenariosOf(r)).length >= 2, message: { en: 'Add a second scenario next to browsers.', mr: 'browsers शेजारी दुसरा scenario जोडा.' } },
            { check: (r) => Object.values(scenariosOf(r)).some((s) => s.exec === 'buy'), message: { en: "The buyers scenario must run the buy function: exec: 'buy'.", mr: "buyers scenario ने buy function चालवायला हवं: exec: 'buy'." } },
            { check: (r) => Object.values(scenariosOf(r)).some((s) => s.exec === 'buy' && Boolean(s.startTime)), message: { en: "Buyers arrive after the doors open: startTime: '10s'.", mr: "दारं उघडल्यावर buyers येतात: startTime: '10s'." } },
            { check: (r) => (r.byName['checkout']?.count ?? 0) > 300, message: { en: 'Not enough checkouts ran. Is the buyers scenario running 20 a second for 40 s?', mr: 'पुरेसे checkouts झाले नाहीत. buyers scenario 40 s सेकंदाला 20 चालतोय का?' } },
          ],
          mustCatch: [
            { bug: 'small-pool', label: { en: 'Payment gateway pool has 3 connections instead of 12', mr: 'payment gateway pool मध्ये 12 ऐवजी 3 connections' } },
            { bug: 'slow-seats', label: { en: 'Seat map runs one query per seat (700 ms)', mr: 'seat map प्रत्येक seat साठी एक query चालवतो (700 ms)' } },
          ],
          hints: [
            { en: 'Copy the shape of the browsers scenario, then change the name, exec, rate and duration, and add startTime.', mr: 'browsers scenario चा आकार copy करा, मग नाव, exec, rate आणि duration बदला, आणि startTime जोडा.' },
            { en: 'exec is the name of an exported function, as a string. buy is already exported at the bottom.', mr: 'exec म्हणजे exported function चं नाव, string म्हणून. buy आधीच खाली exported आहे.' },
            { en: "buyers: {\n  executor: 'constant-arrival-rate',\n  exec: 'buy',\n  startTime: '10s',\n  rate: 20,\n  timeUnit: '1s',\n  duration: '40s',\n  preAllocatedVUs: 30,\n  maxVUs: 150,\n},", mr: "buyers: {\n  executor: 'constant-arrival-rate',\n  exec: 'buy',\n  startTime: '10s',\n  rate: 20,\n  timeUnit: '1s',\n  duration: '40s',\n  preAllocatedVUs: 30,\n  maxVUs: 150,\n}," },
          ],
          successLine: { en: 'Two crowds, one test. In the summary, { scenario:browsers } and { scenario:buyers } each get their own line, and a slow payment gateway turns both red because they share the same workers.', mr: 'दोन गर्दी, एक test. summary मध्ये { scenario:browsers } आणि { scenario:buyers } दोघांना स्वतःची ओळ मिळते, आणि हळू payment gateway दोघांना लाल करतो कारण ते तेच workers वाटून घेतात.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'The partner agency sends its JMeter plan. Pick the 3 lines that translate it correctly into k6.', mr: 'partner agency आपला JMeter plan पाठवते. k6 मध्ये बरोबर भाषांतर करणाऱ्या 3 ओळी निवडा.' },
          options: [
            { en: 'Thread Group: 200 threads, ramp-up 60 s, loop forever for 5 min → stages: ramp to 200 VUs in 1m, then hold, for 5 minutes in total', mr: 'Thread Group: 200 threads, ramp-up 60 s, 5 min सतत loop → stages: 1m मध्ये 200 VUs पर्यंत ramp, मग hold, एकूण 5 मिनिटं' },
            { en: 'Response Assertion "code is 200" → a threshold http_req_duration p(95)<200', mr: 'Response Assertion "code is 200" → http_req_duration p(95)<200 असा threshold' },
            { en: 'CSV Data Set Config users.csv + JSON Extractor $.token → SharedArray with open(\'./users.csv\') + res.json(\'token\')', mr: 'CSV Data Set Config users.csv + JSON Extractor $.token → open(\'./users.csv\') सह SharedArray + res.json(\'token\')' },
            { en: 'Aggregate Report "90% Line" for checkout → p(90) of http_req_duration{name:checkout} in the summary', mr: 'checkout साठी Aggregate Report ची "90% Line" → summary मधला http_req_duration{name:checkout} चा p(90)' },
          ],
          correct: [0, 2, 3],
          explain: { en: 'A Thread Group is VUs + ramp-up + loop count or duration, so it maps to stages (a closed model). CSV Data Set Config is test data from a file (SharedArray), and the JSON Extractor is correlation (res.json). The 90% Line is the 90th percentile. A Response Assertion checks the answer, so it maps to check(res, { \'status 200\': ... }), not to a time goal.', mr: 'Thread Group म्हणजे VUs + ramp-up + loop count किंवा duration, म्हणून तो stages शी जुळतो (closed model). CSV Data Set Config म्हणजे file मधला test data (SharedArray), आणि JSON Extractor म्हणजे correlation (res.json). 90% Line म्हणजे 90 वा percentile. Response Assertion उत्तर तपासतो, म्हणून तो check(res, { \'status 200\': ... }) शी जुळतो, वेळेच्या ध्येयाशी नाही.' },
          hints: [
            { en: 'An Assertion looks at one response and says yes or no. Which k6 function does that?', mr: 'Assertion एक response पाहून हो किंवा नाही सांगतो. k6 मधलं कोणतं function हे करतं?' },
            { en: 'The other three are right: Thread Group is the crowd shape, CSV + Extractor are data and correlation, the 90% Line is a percentile.', mr: 'बाकीच्या तीन बरोबर आहेत: Thread Group म्हणजे गर्दीचा आकार, CSV + Extractor म्हणजे data आणि correlation, 90% Line म्हणजे percentile.' },
          ],
          successLine: { en: 'Sam forwards your translation to the agency. Their reply: "Finally, someone who speaks both."', mr: 'Sam तुमचं भाषांतर agency ला पाठवतो. त्यांचं उत्तर: "शेवटी कोणीतरी दोन्ही भाषा बोलणारं."' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'A closed test with 300 VUs on the slow build reports 0% errors, p95 4 s, and 31 requests a second. Real traffic is 150 fans a second. What is the honest reading?', mr: 'हळू build वर 300 VUs ची closed test 0% errors, p95 4 s, आणि सेकंदाला 31 requests दाखवते. खरी गर्दी सेकंदाला 150 fans. प्रामाणिक अर्थ काय?' },
        options: [
          { en: 'The server passed: zero errors', mr: 'server pass झाला: शून्य errors' },
          { en: 'Add more VUs until errors appear, then report that VU count as capacity', mr: 'errors दिसेपर्यंत VUs वाढवा, मग तीच VU संख्या capacity म्हणून report करा' },
          { en: 'The test slowed down with the server and sent a fifth of the real crowd. Run it again with an arrival rate of 150 a second.', mr: 'test server सोबत हळू झाली आणि खऱ्या गर्दीचा पाचवा भागच पाठवला. सेकंदाला 150 च्या arrival rate ने पुन्हा चालवा.' },
          { en: 'p95 of 4 s is acceptable for a seat map', mr: 'seat map साठी 4 s चा p95 चालतो' },
        ],
        answer: 2,
        explain: { en: 'In a closed model each VU waits for its answer, so a slow server lowers the load and hides errors. An open model keeps fans arriving at the real rate.', mr: 'closed model मध्ये प्रत्येक VU उत्तराची वाट पाहतो, म्हणून हळू server load कमी करतो आणि errors लपवतो. open model खऱ्या वेगाने fans आणत राहतो.' },
      },
      {
        q: { en: 'How many iterations does this scenario try to start?', mr: 'हा scenario किती iterations सुरू करायचा प्रयत्न करतो?' },
        code: "fans: {\n  executor: 'constant-arrival-rate',\n  rate: 50,\n  timeUnit: '1s',\n  duration: '2m',\n  preAllocatedVUs: 20,\n  maxVUs: 100,\n}",
        options: ['6,000', '100', '50', '2,000'],
        answer: 0,
        explain: { en: '50 a second for 120 seconds is 6,000 arrivals, whatever the server does. maxVUs only limits how many can run at the same moment; arrivals that find no free VU are counted as dropped_iterations.', mr: '120 सेकंद सेकंदाला 50 म्हणजे 6,000 येणारे, server काहीही करो. maxVUs फक्त एकाच क्षणी किती चालू शकतात ते मर्यादित करतो; मोकळा VU न मिळालेले येणारे dropped_iterations मध्ये मोजले जातात.' },
      },
      {
        q: { en: 'An arrival-rate test is all green, but the summary shows dropped_iterations: 1,200. What does it mean?', mr: 'arrival-rate test पूर्ण हिरवी आहे, पण summary मध्ये dropped_iterations: 1,200 दिसतं. याचा अर्थ काय?' },
        options: [
          { en: '1,200 requests returned errors', mr: '1,200 requests नी errors दिले' },
          { en: 'The server rejected 1,200 fans with 503', mr: 'server ने 1,200 fans ना 503 देऊन नाकारलं' },
          { en: 'Nothing: dropped iterations are normal and can be ignored', mr: 'काही नाही: dropped iterations सामान्य आहेत आणि दुर्लक्ष करता येतं' },
          { en: 'k6 had no free VU (maxVUs reached), so 1,200 planned fans never reached the server. The load was not delivered: raise maxVUs and add a threshold on dropped_iterations.', mr: 'k6 कडे मोकळा VU नव्हता (maxVUs गाठले), म्हणून ठरवलेले 1,200 fans server पर्यंत पोहोचलेच नाहीत. load पोहोचवला गेला नाही: maxVUs वाढवा आणि dropped_iterations वर threshold ठेवा.' },
        ],
        answer: 3,
        explain: { en: 'Dropped iterations happen inside k6, before any request is sent. A green result with drops did not test the planned crowd. On a slow server, drops also grow because each fan holds a VU longer.', mr: 'dropped iterations k6 च्या आतच, कोणतीही request पाठवण्याआधी घडतात. drops असलेल्या हिरव्या निकालाने ठरवलेल्या गर्दीची test केलीच नाही. हळू server वर drops वाढतातही, कारण प्रत्येक fan VU जास्त वेळ धरून ठेवतो.' },
      },
      {
        q: { en: 'A job post asks for "JMeter: Thread Groups, CSV Data Set Config, Listeners". In k6, CSV Data Set Config is the same idea as:', mr: 'एका job post मध्ये "JMeter: Thread Groups, CSV Data Set Config, Listeners" मागितलंय. k6 मध्ये CSV Data Set Config ची कल्पना कशासारखी आहे?' },
        options: [
          { en: 'check()', mr: 'check()' },
          { en: 'SharedArray with open(\'./users.csv\'): test data loaded once and shared by all VUs', mr: 'open(\'./users.csv\') सह SharedArray: एकदाच load होणारा आणि सगळ्या VUs नी वाटून घेतलेला test data' },
          { en: 'thresholds', mr: 'thresholds' },
          { en: 'group()', mr: 'group()' },
        ],
        answer: 1,
        explain: { en: 'CSV Data Set Config feeds each thread a row of test data. In k6 that is SharedArray plus open(), with __VU or the iteration number choosing the row. check() is an Assertion, thresholds are pass/fail goals, group() is a Transaction Controller.', mr: 'CSV Data Set Config प्रत्येक thread ला test data ची एक ओळ देतो. k6 मध्ये ते SharedArray आणि open() आहे, ओळ __VU किंवा iteration क्रमांकाने निवडली जाते. check() म्हणजे Assertion, thresholds म्हणजे pass/fail ध्येयं, group() म्हणजे Transaction Controller.' },
      },
    ],
    recap: { line: { en: 'Closed models (VUs, stages) slow down with the server and hide trouble; open models (constant-arrival-rate, ramping-arrival-rate) keep fans arriving. Watch dropped_iterations, run crowds side by side with exec and startTime, and read JMeter as Thread Group = VUs, Sampler = request, Assertion = check, Listener = summary.', mr: 'closed models (VUs, stages) server सोबत हळू होतात आणि अडचणी लपवतात; open models (constant-arrival-rate, ramping-arrival-rate) fans आणत राहतात. dropped_iterations वर लक्ष ठेवा, exec आणि startTime ने गर्दी शेजारी शेजारी चालवा, आणि JMeter असं वाचा: Thread Group = VUs, Sampler = request, Assertion = check, Listener = summary.' }, icon: '🚉' },
  },

  // ───────────────────────── P2.5 Boss: Opening Night
  {
    id: 'pf2-5',
    code: 'P2.5',
    level: 'intermediate',
    isBoss: true,
    title: { en: 'Boss: Opening Night', mr: 'बॉस: पहिल्या प्रयोगाची रात्र' },
    skill: 'A full test plan: two scenarios, test data, per-endpoint goals and a launch verdict',
    realLife: {
      place: 'wedding',
      title: { en: 'The caterer\'s rehearsal before a big wedding', mr: 'मोठ्या लग्नाआधी आचाऱ्याची रंगीत तालीम' },
      story: {
        en: 'Shinde kaka is catering a wedding for 1,500 guests. He does not just cook a lot and hope. He plans two crowds: about 1,000 come for the reception, greet the couple and take a pani puri on the way out, and about 300 an hour stay for the full meal. He sets a goal for each counter: pani puri in under two minutes, the main buffet in under ten. The night before, he runs a trial with the real menu and his real staff. Then he tells the family straight: "We are ready for 300 an hour. If 450 sit down at once, the rotis will run late, so keep the second hall ready."',
        mr: 'शिंदे काका 1,500 पाहुण्यांच्या लग्नाचं जेवण करतायत. ते फक्त भरपूर स्वयंपाक करून आशा ठेवत नाहीत. ते दोन गर्दींचं नियोजन करतात: सुमारे 1,000 लोक reception साठी येतात, जोडप्याला भेटतात आणि जाताना एक पाणीपुरी घेतात, आणि तासाला सुमारे 300 लोक पूर्ण जेवणासाठी थांबतात. प्रत्येक counter साठी ते ध्येय ठरवतात: पाणीपुरी दोन मिनिटांच्या आत, मुख्य buffet दहा मिनिटांच्या आत. आदल्या रात्री ते खऱ्या menu आणि खऱ्या staff सोबत trial घेतात. मग कुटुंबाला सरळ सांगतात: "तासाला 300 साठी आम्ही तयार आहोत. एकदम 450 बसले तर पोळ्या उशिरा येतील, म्हणून दुसरा हॉल तयार ठेवा."',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🙏', label: 'Two crowds: 1,000 greet and leave, 300 an hour eat', mr: 'दोन गर्दी: 1,000 भेटून जातात, तासाला 300 जेवतात' },
          { icon: '📋', label: 'Real menu, real staff, real guest list', mr: 'खरा menu, खरा staff, खरी पाहुण्यांची यादी' },
          { icon: '⏱️', label: 'A goal per counter: pani puri 2 min, buffet 10 min', mr: 'प्रत्येक counter चं ध्येय: पाणीपुरी 2 min, buffet 10 min' },
          { icon: '🗣️', label: 'The verdict: ready for 300 an hour, second hall above that', mr: 'निकाल: तासाला 300 साठी तयार, त्यापेक्षा जास्त झाले तर दुसरा हॉल' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'The stadium tour opens Saturday at 10 am. The promoter wants one word from us on Friday night: go or no go. Not a chart. A word, and a reason.', mr: 'stadium tour शनिवारी सकाळी 10 ला उघडते. promoter ला शुक्रवारी रात्री आपल्याकडून एक शब्द हवाय: go की no go. chart नको. एक शब्द, आणि कारण.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'And I want to know where it breaks, not just whether it survives. If it breaks at 31 buyers a second, I need to know before the promoter does.', mr: 'आणि मला ते कुठे मोडतं ते जाणून घ्यायचंय, फक्त टिकतं की नाही नाही. सेकंदाला 31 buyers वर मोडत असेल, तर promoter च्या आधी मला कळायला हवं.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> browsers by the thousand, buyers by the hundred. and when you think you\'re safe: a sudden rush. ⌁', mr: '>> हजारोंनी browsers, शेकड्यांनी buyers. आणि तुम्हाला सुरक्षित वाटेल तेव्हा: अचानक गर्दी. ⌁' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Then we write a real test plan. Two crowds at their real rates, real fan accounts, the full journey, a goal per endpoint, and an error goal on the money step.', mr: 'मग आपण खरा test plan लिहू. खऱ्या वेगाने दोन गर्दी, खरी fan accounts, पूर्ण journey, प्रत्येक endpoint चं ध्येय, आणि पैशाच्या step वर error चं ध्येय.' } },
        { who: 'meera', mood: 'happy', text: { en: '{name}, this is your plan from start to finish. And at the end, you write the verdict for Sam.', mr: '{name}, हा plan सुरुवातीपासून शेवटपर्यंत तुमचा. आणि शेवटी, Sam साठी निकाल तुम्ही लिहायचा.' } },
      ],
      problem: { en: 'A launch decision needs more than one green run. The test must look like opening night (many browsers, fewer buyers, arriving at their own pace), use real accounts instead of one shared login, walk the full journey to a confirmed order, and judge each endpoint against a written goal. Then someone has to turn the numbers into a clear yes or no for people who do not read k6 summaries.', mr: 'launch च्या निर्णयासाठी एका हिरव्या run पेक्षा जास्त लागतं. test पहिल्या प्रयोगाच्या रात्रीसारखी दिसायला हवी (खूप बघणारे, कमी खरेदी करणारे, आपापल्या वेगाने येणारे), एकाच shared login ऐवजी खरी accounts वापरायला हवी, confirmed order पर्यंत पूर्ण journey करायला हवी, आणि प्रत्येक endpoint लिहिलेल्या ध्येयासमोर तपासायला हवा. मग k6 summary न वाचणाऱ्या लोकांसाठी कोणीतरी आकड्यांचं स्पष्ट हो किंवा नाही मध्ये रूपांतर करायला हवं.' },
      solution: { en: 'A test plan in one script: a browsers scenario at a constant arrival rate and a buyers scenario that ramps to the expected rate, fans from users.json through SharedArray, the full journey with correlation and checks, thresholds per endpoint plus error and dropped-iteration goals. Then a capacity run above the plan shows where it breaks, and the verdict states the load, the numbers, the limit and the condition.', mr: 'एका script मध्ये test plan: constant arrival rate ने browsers scenario आणि अपेक्षित वेगापर्यंत वाढणारा buyers scenario, SharedArray मधून users.json चे fans, correlation आणि checks सह पूर्ण journey, प्रत्येक endpoint चे thresholds आणि error व dropped-iteration ची ध्येयं. मग plan पेक्षा जास्त load चा capacity run ते कुठे मोडतं ते दाखवतो, आणि निकाल load, आकडे, मर्यादा आणि अट सांगतो.' },
    },
    lesson: [
      { en: 'The workload model comes first, from real numbers. StageDoor\'s last big sale had about 30 people browsing per second and, at the peak, about 30 buyers per second. So: browsers at a constant 30 arrivals a second, buyers ramping up to 30 a second, starting 10 s later. Write these numbers at the top of the plan so anyone can challenge them. A test is only as good as the traffic it copies.', mr: 'आधी workload model, खऱ्या आकड्यांवरून. StageDoor च्या मागच्या मोठ्या sale मध्ये सेकंदाला सुमारे 30 लोक बघत होते आणि शिखरावर सेकंदाला सुमारे 30 buyers होते. म्हणून: browsers सतत सेकंदाला 30 येणारे, buyers सेकंदाला 30 पर्यंत वाढणारे, 10 s नंतर सुरू. हे आकडे plan च्या सुरुवातीला लिहा म्हणजे कोणालाही त्यावर प्रश्न विचारता येईल. test ती ज्या traffic ची नक्कल करते तितकीच चांगली असते.' },
      { en: 'Real data and the real journey: each buyer is a different fan from users.json (SharedArray, users[__VU % users.length]), logs in, reads the seat map, thinks, adds to cart and checks out with its own cartId. Checks confirm every answer. One shared login or a hard-coded cart would test a sale that never happens.', mr: 'खरा data आणि खरी journey: प्रत्येक buyer users.json मधला वेगळा fan असतो (SharedArray, users[__VU % users.length]), login करतो, seat map वाचतो, विचार करतो, cart मध्ये टाकतो आणि स्वतःच्या cartId ने checkout करतो. checks प्रत्येक उत्तर confirm करतात. एकच shared login किंवा hard-coded cart कधीच न होणाऱ्या sale ची test करेल.' },
      { en: 'Goals that judge: a p95 per endpoint, set from healthy measurements with room to spare; an error goal on checkout, where a failure costs money; checks above 99%; and dropped_iterations below 1, so the test proves it delivered the crowd. A good set passes on the healthy build and fails on each known bad build, so a green run actually means something.', mr: 'निर्णय देणारी ध्येयं: प्रत्येक endpoint चा p95, निरोगी मोजमापावरून पुरेशी जागा ठेवून; checkout वर error चं ध्येय, जिथे failure ला पैसे लागतात; 99% पेक्षा जास्त checks; आणि 1 पेक्षा कमी dropped_iterations, म्हणजे test ने गर्दी पोहोचवली हे सिद्ध होतं. चांगला संच निरोगी build वर pass आणि प्रत्येक माहीत असलेल्या वाईट build वर fail होतो, म्हणजे हिरव्या run ला खरा अर्थ असतो.' },
      { en: 'The verdict: one word, then the evidence and the conditions. "Go for 30 buyers a second: all goals met, checkout p95 about 450 ms, 0% errors. Above about 35 a second the site slows sharply. Condition: the waiting room lets in at most 30 buyers a second." Sam can say that to a promoter, and Theo knows exactly where to dig.', mr: 'निकाल: एक शब्द, मग पुरावा आणि अटी. "सेकंदाला 30 buyers साठी go: सगळी ध्येयं पूर्ण, checkout p95 सुमारे 450 ms, 0% errors. सेकंदाला सुमारे 35 पेक्षा जास्त झाल्यावर site झपाट्याने हळू होते. अट: waiting room सेकंदाला जास्तीत जास्त 30 buyers आत सोडेल." Sam हे promoter ला सांगू शकतो, आणि Theo ला नेमकं कुठे खणायचं ते कळतं.' },
    ],
    syntax: {
      template: "const users = new SharedArray('users', () => JSON.parse(open('./users.json')));\n\nexport const options = {\n  scenarios: {\n    browsers: { executor: 'constant-arrival-rate', exec: 'browse', rate: 30, timeUnit: '1s', duration: '1m30s', preAllocatedVUs: 20, maxVUs: 100 },\n    buyers: { executor: 'ramping-arrival-rate', exec: 'buy', startTime: '10s', startRate: 2, timeUnit: '1s', preAllocatedVUs: 30, maxVUs: 200,\n      stages: [{ duration: '20s', target: 30 }, { duration: '50s', target: 30 }, { duration: '10s', target: 0 }] },\n  },\n  thresholds: {\n    'http_req_duration{name:checkout}': ['p(95)<800'],\n    'http_req_failed{name:checkout}': ['rate<0.01'],\n    dropped_iterations: ['count<1'],\n  },\n};",
      parts: [
        { code: 'browsers + buyers', means: { en: 'two crowds at their real rates, each running its own function', mr: 'खऱ्या वेगाने दोन गर्दी, प्रत्येक आपलं स्वतःचं function चालवते' } },
        { code: 'users[__VU % users.length]', means: { en: 'each VU takes a different fan from the file', mr: 'प्रत्येक VU file मधला वेगळा fan घेतो' } },
        { code: "'http_req_duration{name:checkout}'", means: { en: 'a goal per endpoint, so a red line names the slow step', mr: 'प्रत्येक endpoint चं ध्येय, म्हणजे लाल ओळ हळू step चं नाव सांगते' } },
        { code: "'http_req_failed{name:checkout}'", means: { en: 'the money step may not fail, even when it is fast', mr: 'पैशाची step fail होता कामा नये, ती जलद असली तरी' } },
        { code: "dropped_iterations: ['count<1']", means: { en: 'proof that the test delivered the whole crowd', mr: 'test ने पूर्ण गर्दी पोहोचवली याचा पुरावा' } },
      ],
      example: [
        { code: "rate: 30, timeUnit: '1s',", note: { en: 'browsers, as counted at the last big sale', mr: 'browsers, मागच्या मोठ्या sale मध्ये मोजल्याप्रमाणे' } },
        { code: "stages: [{ duration: '20s', target: 30 }, { duration: '50s', target: 30 }],", note: { en: 'buyers climb to the expected peak and hold it', mr: 'buyers अपेक्षित शिखरापर्यंत चढतात आणि तिथे टिकतात' } },
        { code: "const user = users[__VU % users.length];", note: { en: 'fan007 for VU 7, never one shared account', mr: 'VU 7 साठी fan007, कधीच एक shared account नाही' } },
        { code: "'http_req_duration{name:seats}': ['p(95)<500'],", note: { en: 'healthy seat map is about 195 ms at this load', mr: 'या load वर निरोगी seat map सुमारे 195 ms' } },
        { code: "'http_req_failed{name:checkout}': ['rate<0.01'],", note: { en: 'fewer than 1 in 100 checkouts may fail', mr: '100 पैकी 1 पेक्षा कमी checkouts fail होऊ शकतात' } },
      ],
      pitfall: { en: 'A plan tested only at the expected load says nothing about the margin. Run it once above the plan too, so you know where it breaks. And do not write the verdict as "the test passed": give the load it passed at, the key numbers, the limit you found and the condition for launch.', mr: 'फक्त अपेक्षित load वर tested plan आपल्याकडे किती जागा आहे याबद्दल काहीच सांगत नाही. एकदा plan पेक्षा जास्त load वरही चालवा, म्हणजे ते कुठे मोडतं ते कळेल. आणि निकाल "test pass झाली" असा लिहू नका: कोणत्या load वर pass झाली, मुख्य आकडे, सापडलेली मर्यादा आणि launch ची अट सांगा.' },
    },
    practice: {
      intro: { en: 'Opening night, built in four steps: the crowds, the data and journey, the goals, and the verdict. Boss rules: only 2 hints per step.', mr: 'पहिल्या प्रयोगाची रात्र, चार steps मध्ये: गर्दी, data आणि journey, ध्येयं, आणि निकाल. boss चे नियम: प्रत्येक step ला फक्त 2 hints.' },
      steps: [
        {
          kind: 'perf',
          prompt: { en: 'Step 1, the crowds. Browsers already arrive at 30 a second. Add the buyers scenario that runs buy(): ramping-arrival-rate, startTime \'10s\', startRate 2, timeUnit \'1s\', stages 20s up to 30, 50s at 30, 10s down to 0, preAllocatedVUs 30, maxVUs 200. The plan must deliver every arrival (no dropped iterations).', mr: 'Step 1, गर्दी. browsers आधीच सेकंदाला 30 येतात. buy() चालवणारा buyers scenario जोडा: ramping-arrival-rate, startTime \'10s\', startRate 2, timeUnit \'1s\', stages 20s मध्ये 30 पर्यंत, 50s 30 वर, 10s मध्ये 0 पर्यंत, preAllocatedVUs 30, maxVUs 200. plan ने प्रत्येक येणारा पोहोचवायला हवा (dropped iterations नाहीत).' },
          starter: B1_START,
          solution: B1_SOL,
          requireThresholds: true,
          verify: [
            { check: (r) => Object.values(scenariosOf(r)).some((s) => s.exec === 'buy' && s.executor === 'ramping-arrival-rate'), message: { en: "Add a scenario with executor: 'ramping-arrival-rate' and exec: 'buy'.", mr: "executor: 'ramping-arrival-rate' आणि exec: 'buy' असलेला scenario जोडा." } },
            { check: (r) => Object.values(scenariosOf(r)).some((s) => s.exec === 'buy' && Boolean(s.startTime)), message: { en: "Buyers start after the browsers: startTime: '10s'.", mr: "buyers browsers नंतर सुरू होतात: startTime: '10s'." } },
            { check: (r) => (r.byName['checkout']?.count ?? 0) > 1200, message: { en: 'Too few checkouts. The buyers stages should climb to 30 a second and hold for 50 s.', mr: 'checkouts खूप कमी. buyers चे stages सेकंदाला 30 पर्यंत चढून 50 s टिकायला हवेत.' } },
            { check: (r) => r.dropped === 0, message: { en: 'Some arrivals were dropped. Give the buyers preAllocatedVUs 30 and maxVUs 200.', mr: 'काही येणारे सुटले. buyers ना preAllocatedVUs 30 आणि maxVUs 200 द्या.' } },
          ],
          hints: [
            { en: 'Same shape as the browsers scenario, with exec: \'buy\', startTime, startRate and stages instead of rate and duration. In stages, target is buyers per second.', mr: 'browsers scenario सारखाच आकार, फक्त rate आणि duration ऐवजी exec: \'buy\', startTime, startRate आणि stages. stages मध्ये target म्हणजे सेकंदाला buyers.' },
            { en: "buyers: {\n  executor: 'ramping-arrival-rate',\n  exec: 'buy',\n  startTime: '10s',\n  startRate: 2,\n  timeUnit: '1s',\n  preAllocatedVUs: 30,\n  maxVUs: 200,\n  stages: [\n    { duration: '20s', target: 30 },\n    { duration: '50s', target: 30 },\n    { duration: '10s', target: 0 },\n  ],\n},", mr: "buyers: {\n  executor: 'ramping-arrival-rate',\n  exec: 'buy',\n  startTime: '10s',\n  startRate: 2,\n  timeUnit: '1s',\n  preAllocatedVUs: 30,\n  maxVUs: 200,\n  stages: [\n    { duration: '20s', target: 30 },\n    { duration: '50s', target: 30 },\n    { duration: '10s', target: 0 },\n  ],\n}," },
          ],
          successLine: { en: 'Two crowds on the chart: a flat line of browsers, and buyers climbing to 30 a second ten seconds later.', mr: 'chart वर दोन गर्दी: browsers ची सपाट रेषा, आणि दहा सेकंदांनी सेकंदाला 30 पर्यंत चढणारे buyers.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Step 2, real data and the full journey. Every buyer logs in as fan001, and the journey stops at the cart. Load users.json once with SharedArray, give each VU its own fan with users[__VU % users.length], then finish the journey: POST /checkout with this cart\'s cartId (tag name \'checkout\') and a check \'order confirmed\' that status is \'CONFIRMED\'.', mr: 'Step 2, खरा data आणि पूर्ण journey. प्रत्येक buyer fan001 म्हणून login करतो, आणि journey cart वरच थांबते. SharedArray ने users.json एकदाच load करा, users[__VU % users.length] ने प्रत्येक VU ला स्वतःचा fan द्या, मग journey पूर्ण करा: या cart च्या cartId सह POST /checkout (tag name \'checkout\') आणि status \'CONFIRMED\' आहे असा \'order confirmed\' check.' },
          starter: B2_START,
          solution: B2_SOL,
          requireThresholds: true,
          mustUse: [
            { pattern: 'new\\s+SharedArray\\s*\\(', message: { en: "Load the fans once: new SharedArray('users', () => JSON.parse(open('./users.json'))).", mr: "fans एकदाच load करा: new SharedArray('users', () => JSON.parse(open('./users.json')))." } },
            { pattern: 'users\\s*\\[', message: { en: 'Pick a fan from the array: users[__VU % users.length].', mr: 'array मधून fan निवडा: users[__VU % users.length].' } },
          ],
          mustNotUse: [{ pattern: "['\"]fan001['\"]", message: { en: 'Remove the hard-coded fan001: every buyer should be a different fan from the file.', mr: 'hard-coded fan001 काढा: प्रत्येक buyer file मधला वेगळा fan असायला हवा.' } }],
          verify: [
            { check: (r) => (r.byName['checkout']?.count ?? 0) > 1200 && (r.byName['checkout']?.failed ?? 1) === 0, message: { en: 'Every buyer should reach checkout and get 200. Send cart.json(\'cartId\') with the auth headers, tagged name: \'checkout\'.', mr: 'प्रत्येक buyer checkout पर्यंत पोहोचून 200 मिळवायला हवा. auth headers सह cart.json(\'cartId\') पाठवा, tag name: \'checkout\'.' } },
            { check: (r) => r.checks.some((c) => c.name === 'order confirmed' && c.passes > 0 && c.fails === 0), message: { en: "Add check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' }).", mr: "check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' }) जोडा." } },
          ],
          hints: [
            { en: "Three places: the import (import { SharedArray } from 'k6/data'), the users line in init code, and inside buy(): const user = users[__VU % users.length]. Checkout is the same as in the flash sale.", mr: "तीन जागा: import (import { SharedArray } from 'k6/data'), init code मधली users ची ओळ, आणि buy() च्या आत: const user = users[__VU % users.length]. checkout flash sale सारखाच." },
            { en: "const users = new SharedArray('users', () => JSON.parse(open('./users.json')));\n// in buy():\nconst user = users[__VU % users.length];\n// after the cart:\nconst co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });\ncheck(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });", mr: "const users = new SharedArray('users', () => JSON.parse(open('./users.json')));\n// in buy():\nconst user = users[__VU % users.length];\n// after the cart:\nconst co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });\ncheck(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });" },
          ],
          successLine: { en: 'Two hundred real fans, each with a token and a cart of their own, all the way to CONFIRMED.', mr: 'दोनशे खरे fans, प्रत्येकाचा स्वतःचा token आणि cart, थेट CONFIRMED पर्यंत.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Step 3, the goals. Add Sam\'s launch goals: a p95 for events, seats, login and checkout, an error goal on checkout (fewer than 1% may fail) and on all requests. Healthy p95 at this load: events about 70 ms, seats about 195 ms, login about 150 ms, checkout about 455 ms. Your goals must pass on the healthy server and fail on three of the Gremlin\'s builds.', mr: 'Step 3, ध्येयं. Sam ची launch ध्येयं जोडा: events, seats, login आणि checkout साठी p95, checkout वर error चं ध्येय (1% पेक्षा कमी fail) आणि सगळ्या requests वर. या load वर निरोगी p95: events सुमारे 70 ms, seats सुमारे 195 ms, login सुमारे 150 ms, checkout सुमारे 455 ms. तुमची ध्येयं निरोगी server वर pass आणि gremlin च्या तीन builds वर fail व्हायला हवीत.' },
          starter: B3_START,
          solution: B3_SOL,
          requireThresholds: true,
          mustUse: [
            { pattern: 'http_req_duration\\{name:seats\\}', message: { en: "Add a goal for the seat map: 'http_req_duration{name:seats}'.", mr: "seat map साठी ध्येय जोडा: 'http_req_duration{name:seats}'." } },
            { pattern: 'http_req_duration\\{name:checkout\\}', message: { en: "Add a goal for checkout: 'http_req_duration{name:checkout}'.", mr: "checkout साठी ध्येय जोडा: 'http_req_duration{name:checkout}'." } },
            { pattern: 'http_req_failed\\{name:checkout\\}', message: { en: "Add the money goal: 'http_req_failed{name:checkout}': ['rate<0.01'].", mr: "पैशाचं ध्येय जोडा: 'http_req_failed{name:checkout}': ['rate<0.01']." } },
          ],
          mustCatch: [
            { bug: 'errors-under-load', label: { en: 'Under load, 1 in 4 checkouts fails with 500', mr: 'load खाली 4 पैकी 1 checkout 500 सह fail' } },
            { bug: 'small-pool', label: { en: 'Payment gateway pool has 3 connections instead of 12', mr: 'payment gateway pool मध्ये 12 ऐवजी 3 connections' } },
            { bug: 'slow-seats', label: { en: 'Seat map runs one query per seat (700 ms)', mr: 'seat map प्रत्येक seat साठी एक query चालवतो (700 ms)' } },
          ],
          hints: [
            { en: 'About double the healthy p95 or more is a safe limit: events 300, seats 500, login 400, checkout 800. The error goals use http_req_failed with rate<0.01.', mr: 'निरोगी p95 च्या साधारण दुप्पट किंवा जास्त ही सुरक्षित मर्यादा: events 300, seats 500, login 400, checkout 800. error ध्येयं rate<0.01 सह http_req_failed वापरतात.' },
            { en: "'http_req_duration{name:events}': ['p(95)<300'],\n'http_req_duration{name:seats}': ['p(95)<500'],\n'http_req_duration{name:login}': ['p(95)<400'],\n'http_req_duration{name:checkout}': ['p(95)<800'],\n'http_req_failed{name:checkout}': ['rate<0.01'],\nhttp_req_failed: ['rate<0.01'],", mr: "'http_req_duration{name:events}': ['p(95)<300'],\n'http_req_duration{name:seats}': ['p(95)<500'],\n'http_req_duration{name:login}': ['p(95)<400'],\n'http_req_duration{name:checkout}': ['p(95)<800'],\n'http_req_failed{name:checkout}': ['rate<0.01'],\nhttp_req_failed: ['rate<0.01']," },
          ],
          successLine: { en: 'Green on the healthy build. Red on failing checkouts (about 1 in 6), on the tiny gateway pool and on the slow seat map. The plan can tell good from bad.', mr: 'निरोगी build वर हिरवं. fail होणारे checkouts (साधारण 6 पैकी 1), चिमुकला gateway pool आणि हळू seat map वर लाल. plan चांगलं आणि वाईट ओळखू शकतो.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Step 4, the verdict. Theo runs your plan on the healthy server, but lets the buyers climb past the plan to the Gremlin\'s sudden rush: 30 a second for the first minute, then up to 45. Press Run load test, watch where p95 turns up on the chart, and read the summary. Which message do you send Sam?', mr: 'Step 4, निकाल. Theo तुमचा plan निरोगी server वर चालवतो, पण buyers ना plan च्या पलीकडे gremlin च्या अचानक गर्दीपर्यंत चढू देतो: पहिलं मिनिट सेकंदाला 30, मग 45 पर्यंत. Run load test दाबा, chart वर p95 कुठे वर वळतो ते पाहा, आणि summary वाचा. Sam ला कोणता संदेश पाठवाल?' },
          perfSandbox: { code: B4_SANDBOX },
          options: [
            { en: '"No go. The thresholds are red, so the site is not ready."', mr: '"No go. thresholds लाल आहेत, म्हणजे site तयार नाही."' },
            { en: '"Go. Zero errors in the whole run, so the site can take any crowd."', mr: '"Go. पूर्ण run मध्ये शून्य errors, म्हणजे site कितीही गर्दी घेऊ शकते."' },
            { en: '"Go, with one condition. At the planned 30 buyers a second, p95 stays around 350 ms with 0% errors. Past about 35 a second, every step slows to over 3 s and fans start being dropped. Condition: the waiting room admits at most 30 buyers a second. Theo: the ceiling is the server\'s workers, mostly held by checkout."', mr: '"एका अटीवर Go. ठरवलेल्या सेकंदाला 30 buyers वर p95 सुमारे 350 ms राहतो, 0% errors. सेकंदाला सुमारे 35 च्या पलीकडे प्रत्येक step 3 s पेक्षा जास्त हळू होते आणि fans सुटायला लागतात. अट: waiting room सेकंदाला जास्तीत जास्त 30 buyers आत सोडेल. Theo: मर्यादा server च्या workers ची आहे, ज्यातले बहुतेक checkout धरून ठेवतो."' },
            { en: '"Go. Average response time is about 1 s, which is fine for a ticket site."', mr: '"Go. सरासरी response time सुमारे 1 s आहे, जो ticket site साठी ठीक आहे."' },
          ],
          correct: [2],
          explain: { en: 'This run was deliberately pushed past the plan, so red thresholds here describe the rush, not the planned load. The chart shows p95 flat around 350 ms during the 30-a-second minute and climbing past 3 s once buyers pass about 35 a second, with dropped iterations. Zero errors only means the queue never reached the 8 s shedding point; the slowdown is real. A good verdict gives the load, the numbers, the ceiling and the launch condition. The average mixes calm and rush and hides both.', mr: 'हा run मुद्दाम plan च्या पलीकडे ढकलला होता, म्हणून इथले लाल thresholds गर्दीचं वर्णन करतात, ठरवलेल्या load चं नाही. chart दाखवतो की सेकंदाला 30 च्या मिनिटात p95 सुमारे 350 ms वर सपाट राहतो आणि buyers सेकंदाला सुमारे 35 च्या पलीकडे गेल्यावर 3 s पेक्षा जास्त चढतो, dropped iterations सह. शून्य errors म्हणजे फक्त रांग 8 s च्या shedding पर्यंत पोहोचली नाही; हळू होणं खरं आहे. चांगला निकाल load, आकडे, मर्यादा आणि launch ची अट सांगतो. सरासरी शांत वेळ आणि गर्दी मिसळते आणि दोन्ही लपवते.' },
          hints: [
            { en: 'Split the chart in two: the first minute at 30 buyers a second, and the rush after it. Read p95 in each part separately.', mr: 'chart चे दोन भाग करा: सेकंदाला 30 buyers चं पहिलं मिनिट, आणि त्यानंतरची गर्दी. प्रत्येक भागातला p95 वेगळा वाचा.' },
            { en: 'Sam needs a word he can act on, plus the limit and the condition that keep it true. Which message has the load, the numbers, the ceiling and a condition?', mr: 'Sam ला ज्यावर कृती करता येईल असा शब्द हवा, आणि तो खरा ठेवणारी मर्यादा आणि अट. कोणत्या संदेशात load, आकडे, मर्यादा आणि अट आहे?' },
          ],
          successLine: { en: 'Sam reads it twice and forwards it to the promoter unchanged. Theo is already opening the checkout code.', mr: 'Sam तो दोनदा वाचतो आणि जसाच्या तसा promoter ला पाठवतो. Theo आधीच checkout चा code उघडतोय.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Opening night: about 30 people browse every second all evening, while buyers build up to 30 a second after the doors open. Which pair of executors models this best?', mr: 'पहिल्या प्रयोगाची रात्र: संध्याकाळभर दर सेकंदाला सुमारे 30 लोक बघतात, आणि दारं उघडल्यावर buyers सेकंदाला 30 पर्यंत वाढतात. कोणती executors ची जोडी हे सगळ्यात चांगलं model करते?' },
        options: [
          { en: 'browsers: constant-vus with 30 VUs; buyers: constant-vus with 30 VUs', mr: 'browsers: 30 VUs सह constant-vus; buyers: 30 VUs सह constant-vus' },
          { en: 'browsers: constant-arrival-rate at 30 a second; buyers: ramping-arrival-rate up to 30 a second, with a startTime', mr: 'browsers: सेकंदाला 30 चा constant-arrival-rate; buyers: startTime सह सेकंदाला 30 पर्यंत ramping-arrival-rate' },
          { en: 'One shared-iterations scenario with 60 iterations', mr: '60 iterations असलेला एक shared-iterations scenario' },
          { en: 'browsers: per-vu-iterations; buyers: none, checkout is tested by hand', mr: 'browsers: per-vu-iterations; buyers: काहीच नाही, checkout हाताने tested' },
        ],
        answer: 1,
        explain: { en: 'Both crowds arrive on their own clock, so they are open models: a steady rate for browsers and a ramping rate for buyers that starts a little later. 30 VUs is not 30 arrivals a second.', mr: 'दोन्ही गर्दी स्वतःच्या घड्याळाने येतात, म्हणून त्या open models आहेत: browsers साठी स्थिर rate आणि थोड्या उशिरा सुरू होणारा buyers साठी वाढता rate. 30 VUs म्हणजे सेकंदाला 30 येणारे नाहीत.' },
      },
      {
        q: { en: 'What do exec and startTime do in this scenario?', mr: 'या scenario मध्ये exec आणि startTime काय करतात?' },
        code: "buyers: {\n  executor: 'ramping-arrival-rate',\n  exec: 'buy',\n  startTime: '10s',\n  // ...\n}",
        options: [
          { en: 'exec runs buy once at the end; startTime is the timeout of each request', mr: 'exec शेवटी buy एकदा चालवतो; startTime म्हणजे प्रत्येक request चा timeout' },
          { en: 'exec names the thresholds; startTime delays the summary', mr: 'exec thresholds ना नाव देतो; startTime summary उशिरा दाखवतो' },
          { en: 'exec imports buy from another file; startTime is the think time', mr: 'exec दुसऱ्या file मधून buy import करतो; startTime म्हणजे think time' },
          { en: 'Each iteration of this scenario runs the exported function buy instead of the default one, and the scenario begins 10 s after the test starts', mr: 'या scenario ची प्रत्येक iteration default ऐवजी exported function buy चालवते, आणि scenario test सुरू झाल्यावर 10 s नी सुरू होतो' },
        ],
        answer: 3,
        explain: { en: 'exec points a scenario at a named exported function, so one script can hold several journeys. startTime staggers the scenarios, like buyers joining after the doors open.', mr: 'exec scenario ला नाव दिलेल्या exported function कडे वळवतो, म्हणजे एका script मध्ये अनेक journeys राहू शकतात. startTime scenarios मागेपुढे करतो, जसे दारं उघडल्यावर येणारे buyers.' },
      },
      {
        q: { en: 'On a new build, the plan shows: every p95 within its goal, http_req_failed{name:checkout} 16.7% ✗, checks 91.6% ✗. What do you report?', mr: 'नव्या build वर plan दाखवतो: प्रत्येक p95 त्याच्या ध्येयात, http_req_failed{name:checkout} 16.7% ✗, checks 91.6% ✗. तुम्ही काय report कराल?' },
        options: [
          { en: '"No go. At 30 buyers a second, about 1 in 6 checkouts fails (16.7%, goal under 1%), though response times are normal. Fans may be charged without a ticket. Checkout errors appear only under load: suspect the payment gateway handling."', mr: '"No go. सेकंदाला 30 buyers वर साधारण 6 पैकी 1 checkout fail होतो (16.7%, ध्येय 1% खाली), response times सामान्य असूनही. fans चे पैसे तिकिटाशिवाय कापले जाऊ शकतात. checkout errors फक्त load खाली येतात: payment gateway हाताळणीवर संशय."' },
          { en: '"Go. All response times are within goal."', mr: '"Go. सगळे response times ध्येयात आहेत."' },
          { en: '"Go, but slightly slow."', mr: '"Go, पण थोडं हळू."' },
          { en: '"Retry the test until it passes."', mr: '"pass होईपर्यंत test पुन्हा चालवा."' },
        ],
        answer: 0,
        explain: { en: 'Fast failures do not break time goals; the error goal on the money step catches them. A good report gives the load, the number, the goal, the business risk and a lead for the developers.', mr: 'जलद failures वेळेची ध्येयं मोडत नाहीत; पैशाच्या step वरचं error ध्येय त्यांना पकडतं. चांगला report load, आकडा, ध्येय, business चा धोका आणि developers साठी दिशा देतो.' },
      },
      {
        q: { en: 'Why run the plan once above the expected load (for example 45 buyers a second instead of 30)?', mr: 'plan एकदा अपेक्षित load पेक्षा जास्त (उदा. 30 ऐवजी सेकंदाला 45 buyers) का चालवायचा?' },
        options: [
          { en: 'To make the thresholds fail, so the report looks serious', mr: 'thresholds fail करण्यासाठी, म्हणजे report गंभीर दिसेल' },
          { en: 'Because k6 needs at least 45 iterations a second to measure p95', mr: 'कारण p95 मोजायला k6 ला सेकंदाला किमान 45 iterations लागतात' },
          { en: 'To find the ceiling and the margin: knowing it breaks at about 35 a second turns "go" into "go, with the waiting room at 30"', mr: 'मर्यादा आणि किती जागा आहे ते शोधण्यासाठी: सेकंदाला सुमारे 35 वर ते मोडतं हे माहीत असलं की "go" चं "waiting room 30 वर ठेवून go" होतं' },
          { en: 'It replaces the soak test', mr: 'तो soak test ची जागा घेतो' },
        ],
        answer: 2,
        explain: { en: 'A pass at the expected load tells you nothing about the margin. Going above it shows where the site breaks, which gives Sam a condition and Theo a target. It does not replace a soak test, which looks for problems that grow over hours.', mr: 'अपेक्षित load वरचा pass किती जागा आहे याबद्दल काहीच सांगत नाही. त्यापलीकडे गेल्यावर site कुठे मोडते ते दिसतं, ज्यामुळे Sam ला अट आणि Theo ला लक्ष्य मिळतं. तो soak test ची जागा घेत नाही, जी तासन्तास वाढणाऱ्या समस्या शोधते.' },
      },
    ],
    recap: { line: { en: 'A test plan is a workload model from real numbers (browsers + buyers at arrival rates), real fans from a file, the full journey, a goal per endpoint plus error and dropped-iteration goals, and one run above the plan. The verdict gives the load, the numbers, the ceiling and the condition.', mr: 'test plan म्हणजे खऱ्या आकड्यांवरून workload model (arrival rates ने browsers + buyers), file मधले खरे fans, पूर्ण journey, प्रत्येक endpoint चं ध्येय आणि error व dropped-iteration ची ध्येयं, आणि plan पेक्षा जास्त load चा एक run. निकाल load, आकडे, मर्यादा आणि अट सांगतो.' }, icon: '🎭' },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: '>> my sudden rush. you saw it coming and put a waiting room in front of it. ⌁⌁', mr: '>> माझी अचानक गर्दी. तुम्ही ती येताना पाहिली आणि तिच्यासमोर waiting room उभी केली. ⌁⌁' } },
      { who: 'gremlin', mood: 'smug', text: { en: '>> enjoy the show. i\'ll be in the next codebase. ⌁', mr: '>> प्रयोगाचा आनंद घ्या. मी पुढच्या codebase मध्ये भेटेन. ⌁' } },
      { who: 'theo', mood: 'happy', text: { en: 'I am moving the payment wait off the web workers. Next week we rerun your plan, unchanged, and read the new ceiling. Same test, new number, no arguments.', mr: 'मी payment ची वाट web workers वरून हलवतोय. पुढच्या आठवड्यात आपण तुमचा plan, न बदलता, पुन्हा चालवू आणि नवी मर्यादा वाचू. तीच test, नवा आकडा, वाद नाही.' } },
      { who: 'sam', mood: 'happy', text: { en: 'Opening night sold out in 40 minutes. The waiting room held, nobody saw an error, and the promoter signed us for the whole season. Thank you, {name}!', mr: 'पहिल्या प्रयोगाची सगळी तिकिटं 40 मिनिटांत संपली. waiting room टिकली, कोणालाच error दिसला नाही, आणि promoter ने पूर्ण season साठी आपल्याशी करार केला. धन्यवाद, {name}!' } },
      { who: 'rex', mood: 'happy', text: { en: 'You modelled the real crowd, proved the test delivered it, found the ceiling, and turned it into one clear decision. That is the job of a performance engineer.', mr: 'तुम्ही खरी गर्दी model केली, test ने ती पोहोचवली हे सिद्ध केलं, मर्यादा शोधली, आणि तिचं एका स्पष्ट निर्णयात रूपांतर केलं. हेच performance engineer चं काम आहे.' } },
      { who: 'meera', mood: 'happy', text: { en: 'Rank up, {name}: Performance Engineer. When someone says "it works on my machine", you can now ask: for how many, how fast, and for how long?', mr: 'नवीन रँक, {name}: Performance Engineer. आता कोणी "माझ्या machine वर चालतं" म्हटलं, की तुम्ही विचारू शकता: किती जणांसाठी, किती जलद, आणि किती वेळ?' } },
    ],
  },
]
