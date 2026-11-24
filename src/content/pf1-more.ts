import type { Lesson } from './types.ts'
import type { PerfResult } from '../perf/k6.ts'

// Performance 1, part 2: shaping real load (think time, stages, groups), thresholds as an SLA,
// and the boss: the full flash-sale journey for "Arijit Live in Pune".
//
// Measured on the engine (healthy build) before choosing the numbers below:
//  - browse journey (events, event, seats, think time) at 50 VUs: events p95 ~67ms, seats p95 ~187ms, seats p99 ~261ms
//    no-cache: events p95 ~374ms. slow-seats: seats p95 ~1.14s.
//  - flash-sale journey (login, seats, sleep 1, cart, checkout, sleep 1) ramping to 100 VUs:
//    login p95 ~159ms, seats ~196ms, cart ~143ms, checkout ~469ms, 0% errors.
//    small-pool: checkout ~3.8s (login/seats/cart ~1.75s). slow-login: login ~1.5s. slow-seats: seats ~1.56s.
//    errors-under-load: ~22% of checkouts fail with 500.

const stagesOf = (r: PerfResult) => (Array.isArray(r.options.stages) ? (r.options.stages as { duration: unknown; target: number }[]) : [])

// ───────────────────────── P1.3 scripts

const P13_STAGES_START = `import http from 'k6/http';
import { sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';

export const options = {
  // TODO: replace vus + duration with stages:
  //   ramp up to 20 VUs in 30s, hold 20 VUs for 1m, ramp down to 0 in 20s
  vus: 20,
  duration: '1m',
};

export default function () {
  http.get(BASE + '/events');
  sleep(1);
  http.get(BASE + '/events/1');
  sleep(1);
}
`

const P13_STAGES_SOL = `import http from 'k6/http';
import { sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  http.get(BASE + '/events');
  sleep(1);
  http.get(BASE + '/events/1');
  sleep(1);
}
`

const P13_THINK_START = `import http from 'k6/http';
import { sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';

export const options = {
  stages: [
    { duration: '30s', target: 40 },
    { duration: '1m', target: 40 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  http.get(BASE + '/events');
  // TODO: the fan reads the list of shows: pause 2 seconds
  http.get(BASE + '/events/1');
  // TODO: the fan reads about Arijit Live in Pune: pause 3 seconds
  http.get(BASE + '/events/1/seats');
  // TODO: the fan looks at the seat map: pause 1 second
}
`

const P13_THINK_SOL = `import http from 'k6/http';
import { sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';

export const options = {
  stages: [
    { duration: '30s', target: 40 },
    { duration: '1m', target: 40 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  http.get(BASE + '/events');
  sleep(2);
  http.get(BASE + '/events/1');
  sleep(3);
  http.get(BASE + '/events/1/seats');
  sleep(1);
}
`

const P13_GROUPS_START = `import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';

export const options = {
  stages: [
    { duration: '30s', target: 30 },
    { duration: '1m', target: 30 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  // TODO: put these two requests and their check inside group('browse', () => { ... })
  const list = http.get(BASE + '/events');
  const show = http.get(BASE + '/events/1');
  check(show, { 'event page 200': (r) => r.status === 200 });

  sleep(2);

  // TODO: put the seat map request and its check inside group('pick seats', () => { ... })
  const seats = http.get(BASE + '/events/1/seats');
  check(seats, { 'seat map 200': (r) => r.status === 200 });

  sleep(1);
}
`

const P13_GROUPS_SOL = `import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';

export const options = {
  stages: [
    { duration: '30s', target: 30 },
    { duration: '1m', target: 30 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  group('browse', () => {
    http.get(BASE + '/events');
    const show = http.get(BASE + '/events/1');
    check(show, { 'event page 200': (r) => r.status === 200 });
  });

  sleep(2);

  group('pick seats', () => {
    const seats = http.get(BASE + '/events/1/seats');
    check(seats, { 'seat map 200': (r) => r.status === 200 });
  });

  sleep(1);
}
`

const P13_SANDBOX = `import http from 'k6/http';
import { sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '20s', target: 60 },
    { duration: '1m', target: 60 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  http.get(BASE + '/events');
  sleep(1);
  http.get(BASE + '/events/1');
  sleep(1);
  http.get(BASE + '/events/1/seats');
  sleep(1);
}
`

// ───────────────────────── P1.4 scripts

const P14_JOURNEY_BODY = `export default function () {
  const list = http.get(BASE + '/events', { tags: { name: 'events' } });
  check(list, { 'events 200': (r) => r.status === 200 });
  sleep(2);
  const seats = http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
  check(seats, { 'seats 200': (r) => r.status === 200 });
  sleep(1);
}
`

const P14_STAGES = `  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '20s', target: 0 },
  ],`

const P14_FIRST_START = `import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';

export const options = {
${P14_STAGES}
  // TODO: add thresholds:
  //   95% of all requests faster than 500 ms
  //   fewer than 1% of requests failed
};

${P14_JOURNEY_BODY}`

const P14_FIRST_SOL = `import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';

export const options = {
${P14_STAGES}
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

${P14_JOURNEY_BODY}`

const P14_TAGS_START = `import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';

export const options = {
${P14_STAGES}
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    // TODO: one goal per endpoint:
    //   'http_req_duration{name:events}' p95 under 150 ms
    //   'http_req_duration{name:seats}'  p95 under 300 ms
  },
};

export default function () {
  // TODO: name this request: { tags: { name: 'events' } }
  const list = http.get(BASE + '/events');
  check(list, { 'events 200': (r) => r.status === 200 });
  sleep(2);
  // TODO: name this request: { tags: { name: 'seats' } }
  const seats = http.get(BASE + '/events/1/seats');
  check(seats, { 'seats 200': (r) => r.status === 200 });
  sleep(1);
}
`

const P14_TAGS_SOL = `import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';

export const options = {
${P14_STAGES}
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:events}': ['p(95)<150'],
    'http_req_duration{name:seats}': ['p(95)<300'],
  },
};

${P14_JOURNEY_BODY}`

const P14_SLA_START = `import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';

export const options = {
${P14_STAGES}
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:events}': ['p(95)<150'],
    // TODO: the SLA for seat maps: p95 under 300 ms AND p99 under 500 ms (two strings in one array)
    'http_req_duration{name:seats}': ['p(95)<300'],
    // TODO: more than 99% of checks must pass
  },
};

${P14_JOURNEY_BODY}`

const P14_SLA_SOL = `import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';

export const options = {
${P14_STAGES}
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:events}': ['p(95)<150'],
    'http_req_duration{name:seats}': ['p(95)<300', 'p(99)<500'],
    checks: ['rate>0.99'],
  },
};

${P14_JOURNEY_BODY}`

// ───────────────────────── P1.5 scripts (the flash sale)

const B_HEAD = `import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'https://api.stagedoor.test';
const JSON_HEADERS = { 'Content-Type': 'application/json' };
`

const B_LOGIN = `  // each VU is its own fan: VU 7 logs in as fan007 / pass007
  const n = String(__VU).padStart(3, '0');
  const login = http.post(BASE + '/auth/login', JSON.stringify({ username: 'fan' + n, password: 'pass' + n }), { headers: JSON_HEADERS, tags: { name: 'login' } });
  check(login, { 'logged in': (r) => r.status === 200 });
`

const B1_START = `${B_HEAD}
export const options = {
  vus: 10,
  duration: '30s',
  thresholds: { http_req_failed: ['rate<0.01'], checks: ['rate>0.99'] },
};

export default function () {
${B_LOGIN}
  // TODO: read the token from the login response: login.json('token')

  // TODO: send it: headers must also carry Authorization: 'Bearer ' + token
  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { headers: JSON_HEADERS, tags: { name: 'cart' } });
  check(cart, { 'cart created': (r) => r.status === 201 });
  sleep(1);
}
`

const B1_SOL = `${B_HEAD}
export const options = {
  vus: 10,
  duration: '30s',
  thresholds: { http_req_failed: ['rate<0.01'], checks: ['rate>0.99'] },
};

export default function () {
${B_LOGIN}
  const token = login.json('token');
  const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  check(cart, { 'cart created': (r) => r.status === 201 });
  sleep(1);
}
`

const B2_START = `${B_HEAD}
export const options = {
  vus: 10,
  duration: '30s',
  thresholds: { http_req_failed: ['rate<0.01'], checks: ['rate>0.99'] },
};

export default function () {
${B_LOGIN}
  const token = login.json('token');
  const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
  sleep(1);

  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  check(cart, { 'cart created': (r) => r.status === 201 });

  // TODO: Theo hard-coded 'c1'. Use the cartId from the cart response instead.
  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: 'c1' }), { headers: auth, tags: { name: 'checkout' } });
  // TODO: check 'order confirmed': the response field status is 'CONFIRMED'
  sleep(1);
}
`

const B_JOURNEY = `export default function () {
${B_LOGIN}
  const token = login.json('token');
  const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });
  sleep(1);

  const cart = http.post(BASE + '/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });
  check(cart, { 'cart created': (r) => r.status === 201 });

  const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });
  check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });
  sleep(1);
}
`

const B2_SOL = `${B_HEAD}
export const options = {
  vus: 10,
  duration: '30s',
  thresholds: { http_req_failed: ['rate<0.01'], checks: ['rate>0.99'] },
};

${B_JOURNEY}`

const B3_START = `${B_HEAD}
export const options = {
  // TODO: the 10 am rush: stages that ramp up to 100 VUs in 30s, hold 100 for 1m, ramp down to 0 in 20s
  vus: 100,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    // TODO: one p95 goal each for login, seats and checkout
    //   (healthy p95 today: login ~160 ms, seats ~200 ms, checkout ~470 ms)
  },
};

${B_JOURNEY}`

const B_STAGES = `  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '20s', target: 0 },
  ],`

const B3_SOL = `${B_HEAD}
export const options = {
${B_STAGES}
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    'http_req_duration{name:login}': ['p(95)<400'],
    'http_req_duration{name:seats}': ['p(95)<500'],
    'http_req_duration{name:checkout}': ['p(95)<800'],
  },
};

${B_JOURNEY}`

const B5_START = `${B_HEAD}
export const options = {
${B_STAGES}
  thresholds: {
    'http_req_duration{name:login}': ['p(95)<400'],
    'http_req_duration{name:seats}': ['p(95)<500'],
    'http_req_duration{name:checkout}': ['p(95)<800'],
    // TODO: the money step: fewer than 1% of checkout requests may fail
  },
};

${B_JOURNEY}`

const B5_SOL = `${B_HEAD}
export const options = {
${B_STAGES}
  thresholds: {
    'http_req_duration{name:login}': ['p(95)<400'],
    'http_req_duration{name:seats}': ['p(95)<500'],
    'http_req_duration{name:checkout}': ['p(95)<800'],
    'http_req_failed{name:checkout}': ['rate<0.01'],
  },
};

${B_JOURNEY}`

export const pfMoreLessons: Lesson[] = [
  // ───────────────────────── P1.3 Real users: think time and stages
  {
    id: 'pf1-3',
    code: 'P1.3',
    level: 'basic',
    title: { en: 'Real users: think time and stages', mr: 'खरे users: think time आणि stages' },
    skill: 'sleep, options.stages, group',
    realLife: {
      place: 'fair',
      title: { en: 'The Ganpati darshan queue', mr: 'गणपती दर्शनाची रांग' },
      story: {
        en: 'On the fifth day of Ganeshotsav, the mandal near my house plans its volunteers. Nobody expects the whole city at 7 pm sharp. A few families come first, the queue grows through the evening, it stays packed and steady from 9 to 11, and after midnight it slowly thins out. And nobody runs through either. Each person stops for darshan, takes prasad, clicks a photo. Those pauses matter. The mandal plans for this shape of crowd, with these pauses, and puts extra volunteers where people get stuck: at the prasad counter.',
        mr: 'गणेशोत्सवाच्या पाचव्या दिवशी आमच्या घराजवळचं मंडळ volunteers चं नियोजन करतं. संध्याकाळी बरोबर 7 वाजता अख्खं शहर येईल असं कोणीच धरत नाही. आधी काही कुटुंबं येतात, संध्याकाळभर रांग वाढत जाते, 9 ते 11 ती भरलेली आणि स्थिर राहते, आणि मध्यरात्रीनंतर हळूहळू कमी होते. आणि कोणी धावतही जात नाही. प्रत्येकजण दर्शनासाठी थांबतो, प्रसाद घेतो, फोटो काढतो. हे थांबणं महत्त्वाचं आहे. मंडळ गर्दीच्या याच आकाराचं, या थांब्यांसकट नियोजन करतं, आणि लोक जिथे अडकतात तिथे जास्त volunteers ठेवतं: प्रसादाच्या counter वर.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🚶', label: '7 pm: families trickle in (ramp up)', mr: 'संध्या 7: कुटुंबं हळूहळू येतात (ramp up)' },
          { icon: '👥', label: '9 to 11 pm: full and steady (hold)', mr: 'रात्री 9 ते 11: भरलेली, स्थिर रांग (hold)' },
          { icon: '🙏', label: 'Each person pauses for darshan (think time)', mr: 'प्रत्येकजण दर्शनासाठी थांबतो (think time)' },
          { icon: '🌙', label: 'After midnight: the crowd thins (ramp down)', mr: 'मध्यरात्रीनंतर: गर्दी कमी होते (ramp down)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'happy', text: { en: 'Easy plan. Last year a huge crowd came at 10 am. So our test starts every user at second zero, and they click nonstop.', mr: 'सोपा plan. मागच्या वर्षी 10 वाजता प्रचंड गर्दी आली. म्हणून आपली test सगळे users शून्याव्या सेकंदाला सुरू करेल, आणि ते न थांबता click करत राहतील.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'That tests a machine gun, Sam. A real fan reads the seat map, asks a friend on WhatsApp, then clicks. That pause is think time.', mr: 'ती तर machine gun ची test झाली, Sam. खरा fan seat map वाचतो, WhatsApp वर मित्राला विचारतो, मग click करतो. त्या थांबण्याला think time म्हणतात.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'And the crowd builds up. Fans start refreshing at 9:55, it peaks at 10:00, it thins by 10:20.', mr: 'आणि गर्दी हळूहळू वाढते. fans 9:55 पासून refresh करायला लागतात, 10:00 ला शिखर गाठतं, 10:20 पर्यंत कमी होतं.' } },
        { who: 'meera', mood: 'happy', text: { en: 'So we shape the test like the real day: ramp up, hold, ramp down, with pauses between clicks. And we name each part of the journey, so the report says where it hurt.', mr: 'म्हणून test ला खऱ्या दिवसासारखा आकार देऊ: ramp up, hold, ramp down, आणि clicks मध्ये थांबे. आणि journey च्या प्रत्येक भागाला नाव देऊ, म्हणजे report सांगेल की नेमकं कुठे दुखलं.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> shape it all you like. on sale day my bots won\'t sleep. ⌁', mr: '>> हवा तसा आकार द्या. sale च्या दिवशी माझे bots झोपणार नाहीत. ⌁' } },
      ],
      problem: { en: 'A test where every user starts at once and clicks without a break does not look like the real sale. It measures a crowd that never exists, so the numbers either scare everyone for nothing or give the wrong comfort. And a flat list of requests cannot say which part of the journey was slow.', mr: 'जिथे सगळे users एकदम सुरू होतात आणि न थांबता click करतात, ती test खऱ्या sale सारखी दिसत नाही. ती कधीच न येणारी गर्दी मोजते, त्यामुळे आकडे एकतर उगाच सगळ्यांना घाबरवतात किंवा चुकीचा दिलासा देतात. आणि requests ची सपाट यादी journey चा कोणता भाग हळू होता हे सांगू शकत नाही.' },
      solution: { en: 'sleep() adds think time between clicks. options.stages ramps the VUs up, holds them, and ramps them down, like the real crowd. group() names the parts of the journey (browse, pick seats), so checks are reported per part. The live chart shows the VU curve you asked for, right next to the p95 line.', mr: 'sleep() clicks मध्ये think time टाकतं. options.stages VUs वाढवतं, स्थिर ठेवतं आणि कमी करतं, खऱ्या गर्दीसारखं. group() journey च्या भागांना नाव देतं (browse, pick seats), म्हणजे checks प्रत्येक भागानुसार दिसतात. live chart तुम्ही मागितलेली VU curve p95 च्या रेषेशेजारीच दाखवतो.' },
    },
    lesson: [
      { en: 'Think time: a real fan spends seconds between clicks. sleep(2) pauses this VU for 2 seconds while the server serves others. Without sleep, one VU behaves like ten impatient fans. On StageDoor, 60 VUs with no sleep send about 340 requests per second; with one second of think time after each click it is about 55. The load is set by VUs and by how long one loop takes. Real pauses vary, so you can write sleep(1 + Math.random() * 2) for 1 to 3 seconds.', mr: 'think time: खरा fan दोन clicks मध्ये काही सेकंद घालवतो. sleep(2) हा VU 2 सेकंद थांबवतो, तोपर्यंत server इतरांना सेवा देतो. sleep नसेल तर एक VU दहा अधीर fans सारखा वागतो. StageDoor वर sleep नसलेले 60 VUs सेकंदाला सुमारे 340 requests पाठवतात; प्रत्येक click नंतर एक सेकंद think time दिला तर सुमारे 55. load हे VUs आणि एक loop किती वेळ घेतो यावरून ठरतं. खरे थांबे कमी-जास्त असतात, म्हणून sleep(1 + Math.random() * 2) लिहून 1 ते 3 सेकंद थांबवू शकता.' },
      { en: 'Stages shape the crowd. options.stages is a list of { duration, target }. In each stage k6 moves the number of VUs smoothly from where it is to target, over that duration. A typical shape: ramp up (30s to 50 VUs), hold (1m at 50, the steady part where you measure), ramp down (20s to 0). In JMeter this is the Thread Group: number of threads plus ramp-up period. Stages give you more control.', mr: 'stages गर्दीला आकार देतात. options.stages ही { duration, target } ची यादी आहे. प्रत्येक stage मध्ये k6 VUs ची संख्या आहे तिथून target पर्यंत, त्या duration मध्ये हळूहळू नेतो. नेहमीचा आकार: ramp up (30s मध्ये 50 VUs), hold (1m 50 वर, स्थिर भाग जिथे मोजायचं), ramp down (20s मध्ये 0). JMeter मध्ये हे Thread Group आहे: number of threads आणि ramp-up period. stages मध्ये जास्त नियंत्रण मिळतं.' },
      { en: 'group(\'browse\', () => { ... }) gives a name to a part of the journey. Checks inside it are listed under █ browse in the summary, and k6 times the whole group as group_duration. It is like JMeter\'s Transaction Controller. When a developer asks "which step was slow?", the group names answer in their language: browse, pick seats, checkout.', mr: 'group(\'browse\', () => { ... }) journey च्या एका भागाला नाव देतं. त्यातले checks summary मध्ये █ browse खाली दिसतात, आणि k6 पूर्ण group चा वेळ group_duration म्हणून मोजतो. हे JMeter च्या Transaction Controller सारखं आहे. developer ने "कोणती step हळू होती?" विचारलं की group ची नावं त्याच्याच भाषेत उत्तर देतात: browse, pick seats, checkout.' },
      { en: 'Reading the chart: the VU line is the shape you asked for, so check it first. Then watch the p95 line against it. On a healthy server p95 stays flat while VUs climb. If p95 climbs together with the VUs, the server is struggling: note the VU count where it started. Judge the numbers from the hold part, because the ramps are mixed with warm up and cool down.', mr: 'chart वाचणं: VU ची रेषा म्हणजे तुम्ही मागितलेला आकार, म्हणून आधी ती तपासा. मग तिच्यासमोर p95 ची रेषा पाहा. निरोगी server वर VUs वाढत असताना p95 सपाट राहतो. VUs सोबत p95 पण वाढत गेला तर server ला त्रास होतोय: तो कोणत्या VU संख्येला सुरू झाला ते लिहून ठेवा. आकडे hold भागावरून ठरवा, कारण ramps मध्ये warm up आणि cool down मिसळलेले असतात.' },
    ],
    syntax: {
      template: "export const options = {\n  stages: [\n    { duration: '30s', target: 50 }, // ramp up\n    { duration: '1m', target: 50 },  // hold\n    { duration: '20s', target: 0 },  // ramp down\n  ],\n};\n\nexport default function () {\n  group('browse', () => {\n    http.get(BASE + '/events');\n  });\n  sleep(2); // think time\n}",
      parts: [
        { code: 'stages: [ ... ]', means: { en: 'the shape of the test, one stage after another', mr: 'test चा आकार, एकामागून एक stage' } },
        { code: "{ duration: '30s', target: 50 }", means: { en: 'over 30 seconds, move to 50 VUs (target is the count at the end of the stage)', mr: '30 सेकंदांत 50 VUs पर्यंत जा (target म्हणजे stage च्या शेवटी किती VUs)' } },
        { code: "group('browse', () => { ... })", means: { en: 'name a part of the journey; checks and timings are reported under that name', mr: 'journey च्या एका भागाला नाव द्या; checks आणि वेळ त्या नावाखाली दिसतात' } },
        { code: 'sleep(2)', means: { en: 'think time: this VU pauses for 2 seconds', mr: 'think time: हा VU 2 सेकंद थांबतो' } },
      ],
      example: [
        { code: "{ duration: '5m', target: 2000 },", note: { en: '9:55 to 10:00: fans gather and refresh', mr: '9:55 ते 10:00: fans जमतात आणि refresh करतात' } },
        { code: "{ duration: '15m', target: 2000 },", note: { en: '10:00 to 10:15: the rush holds steady', mr: '10:00 ते 10:15: गर्दी स्थिर राहते' } },
        { code: "{ duration: '5m', target: 0 },", note: { en: 'sold out, the crowd leaves', mr: 'तिकिटं संपली, गर्दी निघून जाते' } },
        { code: "group('pick seats', () => { http.get(BASE + '/events/1/seats'); });", note: { en: 'the seat map step, reported under its own name', mr: 'seat map ची step, स्वतःच्या नावाखाली दिसते' } },
        { code: 'sleep(3);', note: { en: 'the fan asks a friend: "Floor or Lower?"', mr: 'fan मित्राला विचारतो: "Floor की Lower?"' } },
      ],
      pitfall: { en: 'target is the number of VUs at the end of the stage, not how many to add. After ramping to 50, { duration: \'1m\', target: 50 } means hold at 50. Also drop vus and duration when you use stages: vus would become the starting number, so the test starts with a wall instead of a ramp.', mr: 'target म्हणजे stage च्या शेवटी किती VUs, किती वाढवायचे ते नाही. 50 पर्यंत ramp केल्यावर { duration: \'1m\', target: 50 } म्हणजे 50 वर स्थिर. आणि stages वापरताना vus आणि duration काढून टाका: vus ही सुरुवातीची संख्या होईल, म्हणजे test हळूहळू वाढण्याऐवजी एकदम भिंतीसारखी सुरू होईल.' },
    },
    practice: {
      intro: { en: 'Time to make the load look real. Edit the k6 script, press Run load test and watch the VU line on the live chart on the right. Press Submit when it looks right.', mr: 'आता load खऱ्यासारखा बनवूया. k6 script बदला, Run load test दाबा आणि उजवीकडच्या live chart वर VU ची रेषा पाहा. बरोबर वाटलं की Submit दाबा.' },
      steps: [
        {
          kind: 'perf',
          prompt: { en: 'Sam\'s browse test starts all 20 fans at second zero. Give it a real shape with stages: ramp up to 20 VUs in 30s, hold 20 VUs for 1m, then ramp down to 0 in 20s. Remove vus and duration.', mr: 'Sam ची browse test सगळे 20 fans शून्याव्या सेकंदाला सुरू करते. stages वापरून तिला खरा आकार द्या: 30s मध्ये 20 VUs पर्यंत ramp up, 1m 20 VUs वर hold, मग 20s मध्ये 0 पर्यंत ramp down. vus आणि duration काढून टाका.' },
          starter: P13_STAGES_START,
          solution: P13_STAGES_SOL,
          mustNotUse: [{ pattern: '\\bvus\\s*:', message: { en: 'Remove vus: with stages, k6 would start with that many VUs at once. The stages decide the VUs now.', mr: 'vus: काढून टाका: stages सोबत k6 तेवढे VUs एकदम सुरू करेल. आता VUs stages ठरवतात.' } }],
          verify: [
            { check: (r) => stagesOf(r).length >= 3, message: { en: 'Add options.stages with three stages: ramp up, hold, ramp down.', mr: 'options.stages मध्ये तीन stages टाका: ramp up, hold, ramp down.' } },
            { check: (r) => r.maxVUs === 20, message: { en: 'The peak should be 20 VUs (target: 20).', mr: 'शिखर 20 VUs असायला हवं (target: 20).' } },
            { check: (r) => stagesOf(r)[0]?.target === 20 && stagesOf(r).at(-1)?.target === 0, message: { en: 'The first stage ramps up to 20 and the last stage ramps down to target 0.', mr: 'पहिला stage 20 पर्यंत ramp up करतो आणि शेवटचा stage target 0 पर्यंत ramp down.' } },
          ],
          hints: [
            { en: 'stages is an array of objects, one per stage, each with duration and target.', mr: 'stages हा objects चा array आहे, प्रत्येक stage साठी एक, प्रत्येकात duration आणि target.' },
            { en: 'Holding means the target stays the same as the stage before: { duration: \'1m\', target: 20 }.', mr: 'hold म्हणजे target आधीच्या stage इतकाच राहतो: { duration: \'1m\', target: 20 }.' },
            { en: "stages: [\n  { duration: '30s', target: 20 },\n  { duration: '1m', target: 20 },\n  { duration: '20s', target: 0 },\n],", mr: "stages: [\n  { duration: '30s', target: 20 },\n  { duration: '1m', target: 20 },\n  { duration: '20s', target: 0 },\n]," },
          ],
          successLine: { en: 'Look at the VU line: a ramp, a flat top, a ramp down. That is the shape of a real sale morning.', mr: 'VU ची रेषा पाहा: चढ, सपाट शिखर, उतार. खऱ्या sale च्या सकाळचा हाच आकार आहे.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'This script hammers StageDoor with no pauses at all. Add think time: sleep 2 seconds after the list of shows, 3 seconds after the event page, and 1 second after the seat map. Run it before and after and compare the Requests/s tile.', mr: 'ही script StageDoor वर अजिबात न थांबता मारा करते. think time टाका: shows च्या यादीनंतर 2 सेकंद, event page नंतर 3 सेकंद, आणि seat map नंतर 1 सेकंद sleep. आधी आणि नंतर चालवून Requests/s चा आकडा तुलना करा.' },
          starter: P13_THINK_START,
          solution: P13_THINK_SOL,
          verify: [
            { check: (r) => r.usedSleep, message: { en: 'Add sleep() calls for think time.', mr: 'think time साठी sleep() वापरा.' } },
            { check: (r) => r.http.rps < 30, message: { en: 'Still too many requests per second for 40 real fans. Pause after each of the three requests (2, 3 and 1 seconds).', mr: '40 खऱ्या fans साठी अजूनही सेकंदाला खूप जास्त requests. तिन्ही requests नंतर थांबा (2, 3 आणि 1 सेकंद).' } },
          ],
          hints: [
            { en: 'sleep is already imported. sleep(2) pauses this VU for 2 seconds.', mr: 'sleep आधीच import केलेलं आहे. sleep(2) हा VU 2 सेकंद थांबवतो.' },
            { en: 'Put one sleep line under each request, in place of each TODO.', mr: 'प्रत्येक request खाली, प्रत्येक TODO च्या जागी एक sleep ओळ टाका.' },
            { en: "http.get(BASE + '/events');\nsleep(2);\nhttp.get(BASE + '/events/1');\nsleep(3);\nhttp.get(BASE + '/events/1/seats');\nsleep(1);", mr: "http.get(BASE + '/events');\nsleep(2);\nhttp.get(BASE + '/events/1');\nsleep(3);\nhttp.get(BASE + '/events/1/seats');\nsleep(1);" },
          ],
          successLine: { en: 'Same 40 VUs, a fraction of the requests. Now each VU behaves like one fan, not ten.', mr: 'तेच 40 VUs, पण requests कितीतरी कमी. आता प्रत्येक VU दहा नाही, एका fan सारखा वागतो.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Name the two parts of the journey. Wrap the list and event page (and their check) in group(\'browse\', ...), and the seat map (and its check) in group(\'pick seats\', ...). After the run, the summary shows each check under its group.', mr: 'journey च्या दोन भागांना नाव द्या. यादी आणि event page (आणि त्यांचा check) group(\'browse\', ...) मध्ये, आणि seat map (आणि त्याचा check) group(\'pick seats\', ...) मध्ये ठेवा. run नंतर summary मध्ये प्रत्येक check त्याच्या group खाली दिसेल.' },
          starter: P13_GROUPS_START,
          solution: P13_GROUPS_SOL,
          verify: [
            { check: (r) => r.checks.some((c) => c.group === '::browse'), message: { en: 'No check ran inside a group named exactly browse. Put the event page check inside group(\'browse\', () => { ... }).', mr: 'नेमक्या browse नावाच्या group मध्ये एकही check चालला नाही. event page चा check group(\'browse\', () => { ... }) मध्ये ठेवा.' } },
            { check: (r) => r.checks.some((c) => c.group === '::pick seats'), message: { en: 'No check ran inside a group named exactly pick seats. Put the seat map check inside group(\'pick seats\', () => { ... }).', mr: 'नेमक्या pick seats नावाच्या group मध्ये एकही check चालला नाही. seat map चा check group(\'pick seats\', () => { ... }) मध्ये ठेवा.' } },
            { check: (r) => r.usedSleep, message: { en: 'Keep the think time between the groups.', mr: 'groups मधला think time तसाच ठेवा.' } },
          ],
          hints: [
            { en: 'group takes a name and an arrow function. Everything inside the braces belongs to that group.', mr: 'group ला एक नाव आणि एक arrow function लागतं. braces च्या आतलं सगळं त्या group चं असतं.' },
            { en: 'Keep sleep(2) between the groups, outside both of them.', mr: 'sleep(2) दोन्ही groups च्या बाहेर, त्यांच्या मध्ये ठेवा.' },
            { en: "group('browse', () => {\n  http.get(BASE + '/events');\n  const show = http.get(BASE + '/events/1');\n  check(show, { 'event page 200': (r) => r.status === 200 });\n});", mr: "group('browse', () => {\n  http.get(BASE + '/events');\n  const show = http.get(BASE + '/events/1');\n  check(show, { 'event page 200': (r) => r.status === 200 });\n});" },
          ],
          successLine: { en: 'The summary now reads like the journey: █ browse, █ pick seats. Developers will know exactly where to look.', mr: 'आता summary journey सारखी वाचली जाते: █ browse, █ pick seats. developers ना नेमकं कुठे पाहायचं ते कळेल.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Rex runs a two-step ramp: 10 VUs, then 60 VUs, a 1-minute hold, then down. Each loop has three requests and three 1-second pauses. Press Run load test and watch the Requests/s tile during the flat part of the VU line. About how many requests per second does StageDoor get at the hold?', mr: 'Rex दोन टप्प्यांचा ramp चालवतो: 10 VUs, मग 60 VUs, 1 मिनिट hold, मग खाली. प्रत्येक loop मध्ये तीन requests आणि 1 सेकंदाचे तीन थांबे आहेत. Run load test दाबा आणि VU रेषेच्या सपाट भागात Requests/s चा आकडा पाहा. hold वेळी StageDoor ला सेकंदाला साधारण किती requests येतात?' },
          perfSandbox: { code: P13_SANDBOX },
          options: [
            { en: 'About 6', mr: 'सुमारे 6' },
            { en: 'About 55', mr: 'सुमारे 55' },
            { en: 'About 180', mr: 'सुमारे 180' },
            { en: 'About 600', mr: 'सुमारे 600' },
          ],
          correct: [1],
          explain: { en: 'Each loop takes a little over 3 seconds (three 1-second pauses plus the responses) and sends 3 requests. So one VU sends about 1 request per second, and 60 VUs send about 55. VUs are not requests per second: think time decides how many requests each VU sends.', mr: 'प्रत्येक loop ला 3 सेकंदांपेक्षा थोडा जास्त वेळ लागतो (1 सेकंदाचे तीन थांबे आणि responses) आणि तो 3 requests पाठवतो. म्हणजे एक VU सेकंदाला सुमारे 1 request पाठवतो, आणि 60 VUs सुमारे 55. VUs म्हणजे requests per second नाही: प्रत्येक VU किती requests पाठवतो ते think time ठरवतो.' },
          hints: [
            { en: 'The Requests/s tile updates while the chart plays. Read it when the VU line is flat at 60.', mr: 'chart चालताना Requests/s चा आकडा बदलत राहतो. VU रेषा 60 वर सपाट असताना तो वाचा.' },
            { en: 'Or work it out: one loop is about 3.2 seconds for 3 requests, times 60 VUs.', mr: 'किंवा हिशोब करा: एक loop म्हणजे 3 requests साठी सुमारे 3.2 सेकंद, गुणिले 60 VUs.' },
          ],
          successLine: { en: 'Right. When Sam says "10,000 users", always ask: doing what, with how much think time?', mr: 'बरोबर. Sam "10,000 users" म्हणाला की नेहमी विचारा: काय करत, आणि किती think time सोबत?' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does the VU count do during the second stage?', mr: 'दुसऱ्या stage मध्ये VUs ची संख्या काय करते?' },
        code: "stages: [\n  { duration: '30s', target: 100 },\n  { duration: '2m', target: 100 },\n  { duration: '30s', target: 0 },\n]",
        options: [
          { en: 'It adds another 100 VUs, so 200 in total', mr: 'ती आणखी 100 VUs वाढवते, म्हणजे एकूण 200' },
          { en: 'It drops to 0 and climbs back to 100', mr: 'ती 0 वर येते आणि परत 100 पर्यंत चढते' },
          { en: 'It stays at 100 for 2 minutes (the hold)', mr: 'ती 2 मिनिटं 100 वर राहते (hold)' },
          { en: 'It climbs slowly from 0 to 100 over 2 minutes', mr: 'ती 2 मिनिटांत 0 पासून 100 पर्यंत हळूहळू चढते' },
        ],
        answer: 2,
        explain: { en: 'target is the count at the end of the stage. The first stage already reached 100, so a target of 100 means hold.', mr: 'target म्हणजे stage च्या शेवटी किती VUs. पहिल्या stage ने आधीच 100 गाठले, म्हणून target 100 म्हणजे hold.' },
      },
      {
        q: { en: 'Why do realistic k6 scripts put sleep() between requests?', mr: 'खऱ्यासारख्या k6 scripts requests मध्ये sleep() का ठेवतात?' },
        options: [
          { en: 'Real users pause to read and decide. Without it, each VU sends far more requests than a real person would.', mr: 'खरे users वाचायला आणि ठरवायला थांबतात. ते नसेल तर प्रत्येक VU खऱ्या माणसापेक्षा कितीतरी जास्त requests पाठवतो.' },
          { en: 'k6 crashes if two requests are sent back to back', mr: 'दोन requests लागोपाठ पाठवल्या तर k6 crash होतो' },
          { en: 'sleep makes the response times look better in the report', mr: 'sleep मुळे report मध्ये response times चांगले दिसतात' },
          { en: 'The server needs sleep to clear its cache', mr: 'server ला cache साफ करायला sleep लागतं' },
        ],
        answer: 0,
        explain: { en: 'Think time makes one VU behave like one fan. sleep time is not counted in http_req_duration, so it does not "improve" response times; it makes the load realistic.', mr: 'think time मुळे एक VU एका fan सारखा वागतो. sleep चा वेळ http_req_duration मध्ये मोजला जात नाही, म्हणजे तो response times "सुधारत" नाही; तो load खऱ्यासारखा बनवतो.' },
      },
      {
        q: { en: 'What does this part of the summary tell you?', mr: 'summary चा हा भाग काय सांगतो?' },
        code: '     █ browse\n\n       ✓ event page 200\n\n     █ pick seats\n\n       ✗ seat map 200\n        ↳  92% — ✓ 1104 / ✗ 96',
        options: [
          { en: 'The browse step failed for 8% of fans', mr: 'browse step 8% fans साठी fail झाली' },
          { en: 'The seat map was slow, but every answer was correct', mr: 'seat map हळू होता, पण प्रत्येक उत्तर बरोबर होतं' },
          { en: 'The test did not run the pick seats group', mr: 'test ने pick seats group चालवलाच नाही' },
          { en: 'In the pick seats part of the journey, 8% of seat map responses were not 200', mr: 'journey च्या pick seats भागात 8% seat map responses 200 नव्हते' },
        ],
        answer: 3,
        explain: { en: 'Checks are listed under the group they ran in. browse is all green; in pick seats, 96 of 1200 checks failed.', mr: 'checks ज्या group मध्ये चालले त्याखाली दिसतात. browse पूर्ण हिरवा आहे; pick seats मध्ये 1200 पैकी 96 checks fail झाले.' },
      },
      {
        q: { en: 'On the chart, the VU line climbs to 80. The p95 line stays flat near 150 ms until about 60 VUs, then shoots up to 2 s. What do you report?', mr: 'chart वर VU ची रेषा 80 पर्यंत चढते. p95 ची रेषा सुमारे 60 VUs पर्यंत 150 ms जवळ सपाट राहते, मग 2 s पर्यंत उसळते. तुम्ही काय report कराल?' },
        options: [
          { en: 'The test is broken because p95 should never change', mr: 'test बिघडली आहे कारण p95 कधीच बदलायला नको' },
          { en: 'The server copes up to about 60 VUs; beyond that response time climbs fast, so a limit is reached near 60', mr: 'server सुमारे 60 VUs पर्यंत झेपतो; त्यापुढे response time वेगाने वाढतो, म्हणजे 60 जवळ मर्यादा येते' },
          { en: 'The server is fine because the average is still low', mr: 'server ठीक आहे कारण average अजून कमी आहे' },
          { en: 'k6 ran out of VUs at 60', mr: 'k6 चे VUs 60 वर संपले' },
        ],
        answer: 1,
        explain: { en: 'Read p95 against the VU line. Flat means healthy; the point where it bends upward is where the bottleneck starts. Report that VU count with the numbers.', mr: 'p95 VU रेषेसमोर वाचा. सपाट म्हणजे निरोगी; जिथे ती वर वळते तिथे bottleneck सुरू होतो. ती VU संख्या आकड्यांसह report करा.' },
      },
    ],
    recap: { line: { en: 'Real users pause (sleep), arrive and leave gradually (stages: ramp up, hold, ramp down), and follow a journey you can name (group). Read p95 against the VU line.', mr: 'खरे users थांबतात (sleep), हळूहळू येतात आणि जातात (stages: ramp up, hold, ramp down), आणि नाव देता येईल अशी journey करतात (group). p95 VU रेषेसमोर वाचा.' }, icon: '📈' },
  },

  // ───────────────────────── P1.4 Thresholds: pass or fail like an SLA
  {
    id: 'pf1-4',
    code: 'P1.4',
    level: 'basic',
    title: { en: 'Thresholds: pass or fail like an SLA', mr: 'Thresholds: SLA सारखं pass किंवा fail' },
    skill: 'thresholds, p(95), p(99), rate, tags',
    realLife: {
      place: 'restaurant',
      title: { en: 'Thali in 10 minutes, or the sweet is free', mr: '10 मिनिटांत थाळी, नाहीतर गोड पदार्थ फुकट' },
      story: {
        en: 'Annapurna Mess puts up a board: "Thali in 10 minutes, or the gulab jamun is free." Kulkarni kaka does not go by feel. He notes the time of every order. At night he counts: 96 of 100 thalis came within 10 minutes, so the promise held. And he keeps different promises for different dishes. Chai must come in 3 minutes, biryani gets 20. If he used one 20-minute rule for everything, a chai that took 12 minutes would look fine, and the office crowd would stop coming.',
        mr: 'अन्नपूर्णा मेसने पाटी लावली आहे: "10 मिनिटांत थाळी, नाहीतर गुलाबजाम फुकट." कुलकर्णी काका अंदाजाने चालत नाहीत. ते प्रत्येक order ची वेळ लिहून ठेवतात. रात्री मोजतात: 100 पैकी 96 थाळ्या 10 मिनिटांत आल्या, म्हणजे वचन पाळलं. आणि वेगवेगळ्या पदार्थांसाठी वेगवेगळी वचनं. चहा 3 मिनिटांत यायलाच हवा, बिर्याणीला 20 मिनिटं. सगळ्यासाठी 20 मिनिटांचा एकच नियम ठेवला असता, तर 12 मिनिटं लागलेला चहा पण ठीक दिसला असता, आणि ऑफिसची गर्दी यायची बंद झाली असती.',
      },
      scene: {
        type: 'ruler',
        unit: 'min',
        min: 0,
        max: 20,
        lo: 0,
        hi: 10,
        marks: [
          { value: 4, note: 'Table 2 thali: 4 min', mr: 'टेबल 2 ची थाळी: 4 मिनिटं' },
          { value: 7, note: 'Table 5 thali: 7 min', mr: 'टेबल 5 ची थाळी: 7 मिनिटं' },
          { value: 9, note: 'Table 1 thali: 9 min', mr: 'टेबल 1 ची थाळी: 9 मिनिटं' },
          { value: 14, note: 'Table 8 thali: 14 min, free jamun', mr: 'टेबल 8 ची थाळी: 14 मिनिटं, जामून फुकट' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'happy', text: { en: 'Last week\'s load test looked great. The chart was smooth, Theo even showed it in the demo.', mr: 'मागच्या आठवड्याची load test छान दिसली. chart एकदम smooth होता, Theo ने तर demo मध्ये दाखवला.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Great compared to what? Nobody wrote down what good means. A test without thresholds always ends happy. That is a demo, not a test.', mr: 'कशाच्या तुलनेत छान? चांगलं म्हणजे काय, हे कोणीच लिहून ठेवलं नाही. thresholds नसलेली test नेहमी आनंदातच संपते. ती demo आहे, test नाही.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'Our SLA with the organisers says: 95% of seat maps in under 300 ms, and fewer than 1% errors. Let\'s write exactly that into the script.', mr: 'organisers सोबतचा आपला SLA सांगतो: 95% seat maps 300 ms च्या आत, आणि 1% पेक्षा कमी errors. नेमकं तेच script मध्ये लिहूया.' } },
        { who: 'theo', mood: 'surprised', text: { en: 'So if I break the cache by mistake, the run turns red and the pipeline stops my release?', mr: 'म्हणजे मी चुकून cache तोडला, तर run लाल होईल आणि pipeline माझं release थांबवेल?' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> thresholds are just numbers. i\'ll hide where your numbers don\'t look. ⌁', mr: '>> thresholds म्हणजे फक्त आकडे. तुमचे आकडे जिथे पाहत नाहीत तिथे मी लपेन. ⌁' } },
      ],
      problem: { en: 'Without a written goal every run "passes", so a slow build ships because nobody compared the numbers with the promise. And one goal for all requests hides one slow endpoint behind many fast ones.', mr: 'लिहिलेलं ध्येय नसेल तर प्रत्येक run "pass" होतो, म्हणून हळू build पण ship होतो कारण कोणीच आकडे वचनाशी तुलना केले नाहीत. आणि सगळ्या requests साठी एकच ध्येय ठेवलं तर अनेक जलद requests मागे एक हळू endpoint लपतो.' },
      solution: { en: 'thresholds in options turn the SLA into pass or fail: p(95) and p(99) on http_req_duration, a rate on http_req_failed, a rate on checks. Naming requests with tags: { name: \'seats\' } lets you set a goal per endpoint, like \'http_req_duration{name:seats}\'. A crossed threshold shows ✗ and k6 exits with an error, so CI can stop the release.', mr: 'options मधले thresholds SLA ला pass किंवा fail मध्ये बदलतात: http_req_duration वर p(95) आणि p(99), http_req_failed वर rate, checks वर rate. tags: { name: \'seats\' } ने requests ना नाव दिलं की प्रत्येक endpoint साठी वेगळं ध्येय ठेवता येतं, उदा. \'http_req_duration{name:seats}\'. threshold ओलांडला की ✗ दिसतो आणि k6 error सह बाहेर पडतो, म्हणजे CI release थांबवू शकतं.' },
    },
    lesson: [
      { en: 'A threshold is a promise written in code. thresholds: { http_req_duration: [\'p(95)<300\'] } means "95% of requests finish in under 300 ms". At the end k6 marks each threshold ✓ or ✗. If any is ✗, the whole test fails and k6 exits with a non-zero code, which a CI pipeline understands. In JMeter you would add assertions or a pass/fail plugin; in k6 it is built in.', mr: 'threshold म्हणजे code मध्ये लिहिलेलं वचन. thresholds: { http_req_duration: [\'p(95)<300\'] } म्हणजे "95% requests 300 ms च्या आत पूर्ण होतात". शेवटी k6 प्रत्येक threshold ला ✓ किंवा ✗ देतो. एकही ✗ असेल तर पूर्ण test fail होते आणि k6 non-zero code सह बाहेर पडतो, जो CI pipeline ला समजतो. JMeter मध्ये तुम्ही assertions किंवा pass/fail plugin जोडाल; k6 मध्ये ते आतच आहे.' },
      { en: 'The usual four: p(95) on http_req_duration for the normal fan, p(99) for the unlucky few (still capped), http_req_failed with rate<0.01 for fewer than 1% failed requests, and checks with rate>0.99 so the answers are also right, not only fast. One metric can carry several limits: [\'p(95)<300\', \'p(99)<500\']. Avoid avg as the only goal: it hides the slow tail, as you saw in P0.2.', mr: 'नेहमीचे चार: सामान्य fan साठी http_req_duration वर p(95), कमनशिबी थोड्यांसाठी p(99) (त्यालाही मर्यादा), 1% पेक्षा कमी failed requests साठी http_req_failed वर rate<0.01, आणि उत्तरं फक्त जलद नाही तर बरोबरही असावीत म्हणून checks वर rate>0.99. एका metric वर अनेक मर्यादा ठेवता येतात: [\'p(95)<300\', \'p(99)<500\']. फक्त avg वर ध्येय ठेवू नका: तो हळू शेपूट लपवतो, P0.2 मध्ये पाहिलं तसं.' },
      { en: 'One goal for everything is unfair, like one 20-minute rule for chai and biryani. Name each request: http.get(url, { tags: { name: \'seats\' } }). Then \'http_req_duration{name:seats}\': [\'p(95)<300\'] judges only the seat maps. Names also group the "By endpoint" table, and they keep /events/1/seats and /events/2/seats in one row instead of one row per id.', mr: 'सगळ्यासाठी एकच ध्येय अन्यायकारक आहे, चहा आणि बिर्याणीला 20 मिनिटांचा एकच नियम लावल्यासारखं. प्रत्येक request ला नाव द्या: http.get(url, { tags: { name: \'seats\' } }). मग \'http_req_duration{name:seats}\': [\'p(95)<300\'] फक्त seat maps ला तपासतो. नावांमुळे "By endpoint" table पण गटात दिसतो, आणि /events/1/seats व /events/2/seats प्रत्येक id साठी वेगळ्या ओळीत न येता एकाच ओळीत येतात.' },
      { en: 'Choosing numbers: the goal comes from the business (the SLA), the measurement tells you if it is realistic. Run on a healthy build first. Seat maps there have p95 near 190 ms, so 300 ms is a safe limit; 200 ms would flicker red for no reason. A limit like 5000 ms never fails and catches nothing. Leave a margin on both sides.', mr: 'आकडे निवडणं: ध्येय business कडून (SLA) येतं, आणि मोजमाप सांगतं की ते शक्य आहे का. आधी निरोगी build वर चालवा. तिथे seat maps चा p95 सुमारे 190 ms आहे, म्हणून 300 ms सुरक्षित मर्यादा; 200 ms उगाच मधूनच लाल होईल. 5000 ms सारखी मर्यादा कधीच fail होत नाही आणि काहीच पकडत नाही. दोन्ही बाजूंनी जागा ठेवा.' },
    ],
    syntax: {
      template: "export const options = {\n  thresholds: {\n    http_req_duration: ['p(95)<500', 'p(99)<1000'],\n    'http_req_duration{name:seats}': ['p(95)<300'],\n    http_req_failed: ['rate<0.01'],\n    checks: ['rate>0.99'],\n  },\n};\n\nhttp.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });",
      parts: [
        { code: "http_req_duration: ['p(95)<500']", means: { en: '95% of all requests faster than 500 ms', mr: 'सगळ्या requests पैकी 95% 500 ms पेक्षा जलद' } },
        { code: "'http_req_duration{name:seats}'", means: { en: 'the same metric, only for requests named seats (quotes needed because of the braces)', mr: 'तोच metric, फक्त seats नाव दिलेल्या requests साठी (braces मुळे quotes लागतात)' } },
        { code: "http_req_failed: ['rate<0.01']", means: { en: 'fewer than 1% of requests may fail', mr: '1% पेक्षा कमी requests fail होऊ शकतात' } },
        { code: "checks: ['rate>0.99']", means: { en: 'more than 99% of checks must pass', mr: '99% पेक्षा जास्त checks pass व्हायला हवेत' } },
        { code: "{ tags: { name: 'seats' } }", means: { en: 'give this request a name for thresholds and the By endpoint table', mr: 'thresholds आणि By endpoint table साठी या request ला नाव द्या' } },
      ],
      example: [
        { code: "'http_req_duration{name:seats}': ['p(95)<300', 'p(99)<500'],", note: { en: 'the organisers\' SLA for seat maps', mr: 'seat maps साठी organisers चा SLA' } },
        { code: "'http_req_duration{name:events}': ['p(95)<150'],", note: { en: 'the list of shows is cached, so it must be quick', mr: 'shows ची यादी cache मध्ये असते, म्हणून ती जलदच हवी' } },
        { code: "http_req_failed: ['rate<0.01'],", note: { en: 'fewer than 1 in 100 requests may fail', mr: '100 पैकी 1 पेक्षा कमी requests fail होऊ शकतात' } },
        { code: "checks: ['rate>0.99'],", note: { en: 'fast wrong answers do not count', mr: 'जलद पण चुकीची उत्तरं चालणार नाहीत' } },
        { code: "http.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });", note: { en: 'the request the seats goal is about', mr: 'seats चं ध्येय ज्या request बद्दल आहे ती' } },
      ],
      pitfall: { en: 'A threshold on a name that no request uses has no data, and the run tells you so. Spell the tag the same in both places: tags: { name: \'seats\' } and \'http_req_duration{name:seats}\', with no spaces inside the braces. And keep thresholds inside options.', mr: 'कोणतीच request वापरत नाही अशा नावावरच्या threshold ला data मिळत नाही, आणि run ते सांगतो. tag दोन्ही ठिकाणी सारखाच लिहा: tags: { name: \'seats\' } आणि \'http_req_duration{name:seats}\', braces च्या आत spaces नकोत. आणि thresholds options च्या आतच ठेवा.' },
    },
    practice: {
      intro: { en: 'Now your tests get a verdict. Every script here must pass on the healthy StageDoor, and hidden problem builds will check that your thresholds really fail when the server gets slow.', mr: 'आता तुमच्या tests ना निकाल मिळेल. इथली प्रत्येक script निरोगी StageDoor वर pass व्हायला हवी, आणि server हळू झाला की तुमचे thresholds खरंच fail होतात का हे लपवलेले problem builds तपासतील.' },
      steps: [
        {
          kind: 'perf',
          prompt: { en: 'This test runs, but it can never fail. Add thresholds: 95% of all requests under 500 ms, and fewer than 1% of requests failed.', mr: 'ही test चालते, पण ती कधीच fail होऊ शकत नाही. thresholds जोडा: सगळ्या requests पैकी 95% 500 ms च्या आत, आणि 1% पेक्षा कमी requests failed.' },
          starter: P14_FIRST_START,
          solution: P14_FIRST_SOL,
          requireThresholds: true,
          mustUse: [
            { pattern: 'http_req_duration[\\s\\S]*p\\(95\\)', message: { en: 'Add a p(95) limit on http_req_duration.', mr: 'http_req_duration वर p(95) ची मर्यादा टाका.' } },
            { pattern: 'http_req_failed', message: { en: 'Add a rate limit on http_req_failed.', mr: 'http_req_failed वर rate ची मर्यादा टाका.' } },
          ],
          hints: [
            { en: 'thresholds is an object inside options. Each key is a metric, each value an array of limits.', mr: 'thresholds हा options मधला एक object आहे. प्रत्येक key एक metric, प्रत्येक value मर्यादांचा array.' },
            { en: "Response time: http_req_duration: ['p(95)<500']. Errors: http_req_failed: ['rate<0.01'].", mr: "response time: http_req_duration: ['p(95)<500']. errors: http_req_failed: ['rate<0.01']." },
            { en: "thresholds: {\n  http_req_duration: ['p(95)<500'],\n  http_req_failed: ['rate<0.01'],\n},", mr: "thresholds: {\n  http_req_duration: ['p(95)<500'],\n  http_req_failed: ['rate<0.01'],\n}," },
          ],
          successLine: { en: 'Two ✓ marks in the summary. For the first time, "it looked fine" became "it met the goal".', mr: 'summary मध्ये दोन ✓. पहिल्यांदाच "ठीक दिसलं" चं "ध्येय पूर्ण झालं" झालं.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'The global 500 ms goal lets a slow list of shows hide behind everything else. Name the two requests (events and seats) with tags, then add per-endpoint goals: events p95 under 150 ms, seats p95 under 300 ms. Hidden builds will slow the seat map and switch off the events cache.', mr: '500 ms चं सगळ्यांसाठीचं एकच ध्येय shows ची हळू यादी बाकीच्यांच्या मागे लपू देतं. दोन्ही requests ना (events आणि seats) tags ने नाव द्या, मग प्रत्येक endpoint चं ध्येय टाका: events p95 150 ms च्या आत, seats p95 300 ms च्या आत. लपवलेले builds seat map हळू करतील आणि events चा cache बंद करतील.' },
          starter: P14_TAGS_START,
          solution: P14_TAGS_SOL,
          requireThresholds: true,
          mustUse: [
            { pattern: "name\\s*:\\s*['\"]seats['\"]", message: { en: "Name the seat map request: { tags: { name: 'seats' } }.", mr: "seat map च्या request ला नाव द्या: { tags: { name: 'seats' } }." } },
            { pattern: 'http_req_duration\\{name:seats\\}', message: { en: "Add a goal just for the seat map: 'http_req_duration{name:seats}'.", mr: "फक्त seat map साठी ध्येय टाका: 'http_req_duration{name:seats}'." } },
            { pattern: 'http_req_duration\\{name:events\\}', message: { en: "Add a goal just for the list of shows: 'http_req_duration{name:events}'.", mr: "फक्त shows च्या यादीसाठी ध्येय टाका: 'http_req_duration{name:events}'." } },
          ],
          mustCatch: [
            { bug: 'slow-seats', label: { en: 'Seat map runs one query per seat (700 ms)', mr: 'seat map प्रत्येक seat साठी एक query चालवतो (700 ms)' } },
            { bug: 'no-cache', label: { en: 'List of shows skips its cache (220 ms)', mr: 'shows ची यादी cache वापरत नाही (220 ms)' } },
          ],
          hints: [
            { en: 'Two changes: a tags object on each http.get, and two new keys in thresholds. The key needs quotes because of the braces.', mr: 'दोन बदल: प्रत्येक http.get वर tags object, आणि thresholds मध्ये दोन नव्या keys. braces मुळे key ला quotes लागतात.' },
            { en: "http.get(BASE + '/events', { tags: { name: 'events' } });\nhttp.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });", mr: "http.get(BASE + '/events', { tags: { name: 'events' } });\nhttp.get(BASE + '/events/1/seats', { tags: { name: 'seats' } });" },
            { en: "'http_req_duration{name:events}': ['p(95)<150'],\n'http_req_duration{name:seats}': ['p(95)<300'],", mr: "'http_req_duration{name:events}': ['p(95)<150'],\n'http_req_duration{name:seats}': ['p(95)<300']," },
          ],
          successLine: { en: 'Both problems caught. On the no-cache build, events p95 jumped to about 370 ms while the global number still looked fine. Per-endpoint goals see what averages hide.', mr: 'दोन्ही समस्या पकडल्या. no-cache build वर events चा p95 सुमारे 370 ms झाला, तरी सगळ्यांचा मिळून आकडा ठीक दिसत होता. प्रत्येक endpoint चं ध्येय average जे लपवतो ते पाहतं.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Write the organisers\' full SLA. Seat maps: p95 under 300 ms and p99 under 500 ms (both in one array). And more than 99% of checks must pass.', mr: 'organisers चा पूर्ण SLA लिहा. seat maps: p95 300 ms च्या आत आणि p99 500 ms च्या आत (दोन्ही एकाच array मध्ये). आणि 99% पेक्षा जास्त checks pass व्हायला हवेत.' },
          starter: P14_SLA_START,
          solution: P14_SLA_SOL,
          requireThresholds: true,
          verify: [
            { check: (r) => r.thresholds.some((t) => t.metric === 'http_req_duration{name:seats}' && t.expr.replace(/\s/g, '').startsWith('p(99)')), message: { en: "Add a p(99) limit to the seats array: ['p(95)<300', 'p(99)<500'].", mr: "seats च्या array मध्ये p(99) ची मर्यादा टाका: ['p(95)<300', 'p(99)<500']." } },
            { check: (r) => r.thresholds.some((t) => t.metric === 'checks'), message: { en: "Add a threshold on checks: checks: ['rate>0.99'].", mr: "checks वर threshold टाका: checks: ['rate>0.99']." } },
          ],
          mustCatch: [
            { bug: 'slow-seats', label: { en: 'Seat map runs one query per seat (700 ms)', mr: 'seat map प्रत्येक seat साठी एक query चालवतो (700 ms)' } },
            { bug: 'no-cache', label: { en: 'List of shows skips its cache (220 ms)', mr: 'shows ची यादी cache वापरत नाही (220 ms)' } },
          ],
          hints: [
            { en: 'One metric, two limits: put both strings in the same array, separated by a comma.', mr: 'एक metric, दोन मर्यादा: दोन्ही strings एकाच array मध्ये, comma ने वेगळ्या.' },
            { en: "'http_req_duration{name:seats}': ['p(95)<300', 'p(99)<500'],", mr: "'http_req_duration{name:seats}': ['p(95)<300', 'p(99)<500']," },
            { en: "'http_req_duration{name:seats}': ['p(95)<300', 'p(99)<500'],\nchecks: ['rate>0.99'],", mr: "'http_req_duration{name:seats}': ['p(95)<300', 'p(99)<500'],\nchecks: ['rate>0.99']," },
          ],
          successLine: { en: 'That is an SLA a developer can read and a pipeline can enforce. Fast, rarely very slow, and correct.', mr: 'हा SLA developer ला वाचता येतो आणि pipeline ला लागू करता येतो. जलद, क्वचितच खूप हळू, आणि बरोबर.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Theo pushed tonight\'s build. Rex runs your thresholds against it. Press Run load test and read the summary. What do you tell Theo?', mr: 'Theo ने आजचा build push केला. Rex त्यावर तुमचे thresholds चालवतो. Run load test दाबा आणि summary वाचा. तुम्ही Theo ला काय सांगाल?' },
          perfSandbox: { code: P14_SLA_SOL, build: ['no-cache'] },
          options: [
            { en: 'The seat map broke its SLA; check the seat query', mr: 'seat map ने SLA मोडला; seat ची query तपासा' },
            { en: 'The list of shows broke its goal: events p95 is about 370 ms against 150 ms, while seats and errors pass. Its cache may be off.', mr: 'shows च्या यादीने ध्येय मोडलं: events चा p95 150 ms च्या जागी सुमारे 370 ms आहे, तर seats आणि errors pass आहेत. त्याचा cache बंद असू शकतो.' },
            { en: 'Too many requests failed', mr: 'खूप requests fail झाल्या' },
            { en: 'Everything passed, ship it', mr: 'सगळं pass झालं, ship करा' },
          ],
          correct: [1],
          explain: { en: 'Only { name:events } has a ✗. Seats, errors and checks are ✓. A good report names the endpoint, the number, the goal, and what is fine: "GET /events p95 366 ms vs goal 150 ms at 50 VUs; healthy build was 67 ms; seats unaffected."', mr: 'फक्त { name:events } ला ✗ आहे. seats, errors आणि checks ✓ आहेत. चांगला report endpoint, आकडा, ध्येय आणि काय ठीक आहे ते सांगतो: "50 VUs वर GET /events चा p95 366 ms, ध्येय 150 ms; निरोगी build वर 67 ms होता; seats वर परिणाम नाही."' },
          hints: [
            { en: 'Look for the ✗ marks in the summary. Which { name: ... } line has one?', mr: 'summary मध्ये ✗ शोधा. कोणत्या { name: ... } ओळीवर तो आहे?' },
            { en: 'The By endpoint tab sorts by p95. Compare events with the healthy 67 ms.', mr: 'By endpoint tab p95 नुसार क्रम लावतो. events ची तुलना निरोगी 67 ms शी करा.' },
          ],
          successLine: { en: 'Theo checks the config: someone set CACHE_TTL to 0. Fixed before the sale.', mr: 'Theo config तपासतो: कोणीतरी CACHE_TTL 0 केला होता. sale आधी दुरुस्त झालं.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Which threshold means "fewer than 1% of requests may fail"?', mr: 'कोणता threshold म्हणजे "1% पेक्षा कमी requests fail होऊ शकतात"?' },
        options: [
          "http_req_duration: ['rate<0.01']",
          "http_req_failed: ['rate<0.01']",
          "checks: ['rate<0.01']",
          "http_req_failed: ['p(99)<1']",
        ],
        answer: 1,
        explain: { en: 'http_req_failed is a rate metric: the share of failed requests. rate<0.01 means under 1%.', mr: 'http_req_failed हा rate metric आहे: failed requests चा वाटा. rate<0.01 म्हणजे 1% पेक्षा कमी.' },
      },
      {
        q: { en: 'Theo says: "Set http_req_duration to p(95)<10000, then the test never fails." What is wrong with that?', mr: 'Theo म्हणतो: "http_req_duration p(95)<10000 ठेवा, म्हणजे test कधीच fail होणार नाही." यात काय चूक आहे?' },
        options: [
          { en: 'k6 does not accept numbers above 5000', mr: 'k6 5000 पेक्षा मोठे आकडे स्वीकारत नाही' },
          { en: 'Nothing, a test that never fails is the goal', mr: 'काहीच नाही, कधीच fail न होणारी test हेच ध्येय आहे' },
          { en: 'p(95) only works with tags', mr: 'p(95) फक्त tags सोबत चालतो' },
          { en: 'A limit no build can break catches nothing. The limit should come from the SLA and sit a safe margin above the healthy numbers.', mr: 'कोणताच build मोडू शकणार नाही अशी मर्यादा काहीच पकडत नाही. मर्यादा SLA मधून यायला हवी आणि निरोगी आकड्यांच्या वर सुरक्षित अंतरावर असायला हवी.' },
        ],
        answer: 3,
        explain: { en: 'A threshold is useful only if a real problem would break it. 10 seconds would let even the slow-seats build pass.', mr: 'खरी समस्या threshold मोडेल तरच तो उपयोगी. 10 सेकंदांमध्ये तर slow-seats build सुद्धा pass झाला असता.' },
      },
      {
        q: { en: 'The summary ends like this. What is the right report?', mr: 'summary अशी संपते. योग्य report कोणता?' },
        code: "   ✓ http_req_duration ..............: avg=210ms ... p(95)=480ms\n   ✗   { name:seats } ...............: avg=740ms ... p(95)=1.14s\n   ✓ http_req_failed ................: 0.00%\nERRO[0112] thresholds on metrics 'http_req_duration{name:seats}' have been crossed",
        options: [
          { en: 'The seat map misses its goal: p95 1.14 s. Other requests and errors are within limits.', mr: 'seat map त्याचं ध्येय गाठत नाही: p95 1.14 s. बाकीच्या requests आणि errors मर्यादेत आहेत.' },
          { en: 'The whole server is slow, every endpoint failed', mr: 'पूर्ण server हळू आहे, प्रत्येक endpoint fail झाला' },
          { en: 'The test passed because the overall p95 is under 500 ms', mr: 'एकूण p95 500 ms च्या आत आहे म्हणून test pass झाली' },
          { en: 'Requests to seats returned errors', mr: 'seats च्या requests ने errors दिले' },
        ],
        answer: 0,
        explain: { en: 'One ✗ fails the run. It sits on { name:seats }, and http_req_failed is 0%, so it is slow, not broken.', mr: 'एक ✗ म्हणजे run fail. तो { name:seats } वर आहे, आणि http_req_failed 0% आहे, म्हणजे ते हळू आहे, बिघडलेलं नाही.' },
      },
      {
        q: { en: 'Your script calls /events/1/seats, /events/2/seats and /events/3/seats. Why give all of them tags: { name: \'seats\' }?', mr: 'तुमची script /events/1/seats, /events/2/seats आणि /events/3/seats call करते. या सगळ्यांना tags: { name: \'seats\' } का द्यायचं?' },
        options: [
          { en: 'k6 refuses URLs with numbers unless they are tagged', mr: 'tag नसेल तर k6 आकडे असलेले URLs नाकारतो' },
          { en: 'Tags make the requests faster', mr: 'tags मुळे requests जलद होतात' },
          { en: 'So they count as one endpoint: one row in By endpoint and one threshold, instead of a separate row per id', mr: 'म्हणजे ते एकच endpoint मानले जातात: By endpoint मध्ये एक ओळ आणि एक threshold, प्रत्येक id साठी वेगळी ओळ नाही' },
          { en: 'Without a tag the server returns 404', mr: 'tag नसेल तर server 404 देतो' },
        ],
        answer: 2,
        explain: { en: 'Without a name, each URL is its own entry. The name tag groups them so \'http_req_duration{name:seats}\' covers every seat map.', mr: 'नाव नसेल तर प्रत्येक URL वेगळी नोंद होते. name tag त्यांना एकत्र करतो, म्हणजे \'http_req_duration{name:seats}\' प्रत्येक seat map ला लागू होतो.' },
      },
    ],
    recap: { line: { en: 'Thresholds turn the SLA into pass or fail: p(95)/p(99) on http_req_duration, rate on http_req_failed and checks. Name requests with tags for per-endpoint goals, and set limits from healthy measurements plus a margin.', mr: 'thresholds SLA ला pass किंवा fail मध्ये बदलतात: http_req_duration वर p(95)/p(99), http_req_failed आणि checks वर rate. प्रत्येक endpoint च्या ध्येयासाठी requests ना tags ने नाव द्या, आणि मर्यादा निरोगी मोजमापावरून, थोडी जागा ठेवून ठरवा.' }, icon: '🎯' },
  },

  // ───────────────────────── P1.5 Boss: The Flash Sale
  {
    id: 'pf1-5',
    code: 'P1.5',
    level: 'basic',
    isBoss: true,
    title: { en: 'Boss: The Flash Sale', mr: 'बॉस: फ्लॅश सेल' },
    skill: 'Full journey load test with per-endpoint thresholds',
    realLife: {
      place: 'station',
      title: { en: 'Tatkal at 10 am', mr: 'सकाळी 10 चं तत्काळ' },
      story: {
        en: 'Aai needs a Tatkal ticket to Nagpur. At 9:58 the whole family is ready: Baba on the laptop, Tai on her phone, the passenger details copied. At 10:00 they log in, pick the train, see seats, add passengers. All fine. Then the payment page, and the circle just turns and turns. Every year it is the same: everything works until one slow counter at the end, and that one counter makes the whole queue wait behind it. Baba says, "Fix the payment counter, and the whole line moves."',
        mr: 'आईला नागपूरचं तत्काळ तिकीट हवंय. 9:58 ला अख्खं कुटुंब तयार: बाबा laptop वर, ताई तिच्या phone वर, प्रवाशांची माहिती copy करून ठेवलेली. 10:00 ला ते login करतात, train निवडतात, seats पाहतात, प्रवासी जोडतात. सगळं ठीक. मग payment page, आणि ते चक्र फिरतच राहतं. दरवर्षी हेच: शेवटच्या एका हळू counter पर्यंत सगळं चालतं, आणि तो एक counter पूर्ण रांगेला मागे थांबवून ठेवतो. बाबा म्हणतात, "payment चा counter दुरुस्त करा, पूर्ण रांग पुढे सरकेल."',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🔑', label: 'Log in', mr: 'login' },
          { icon: '💺', label: 'See seats', mr: 'seats पाहा' },
          { icon: '🧾', label: 'Add passengers (cart)', mr: 'प्रवासी जोडा (cart)' },
          { icon: '💳', label: 'Pay (checkout)', mr: 'पैसे भरा (checkout)' },
          { icon: '🎫', label: 'Ticket confirmed', mr: 'तिकीट confirm' },
        ],
        breakAt: 3,
        breakNote: { en: 'The payment counter is the bottleneck. Everyone behind it waits, even people who only wanted to see seats.', mr: 'payment चा counter हा bottleneck आहे. त्याच्या मागचे सगळे थांबतात, फक्त seats पाहायला आलेले सुद्धा.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Tomorrow, 10 am, Arijit Live in Pune. Last year we lasted four minutes and fans were charged without tickets. I promised the organisers a flawless sale.', mr: 'उद्या सकाळी 10, Arijit Live in Pune. मागच्या वर्षी आपण चार मिनिटं टिकलो आणि fans चे पैसे कापले गेले पण तिकिटं मिळाली नाहीत. मी organisers ना निर्दोष sale चं वचन दिलंय.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> 10:00:00. a hundred of my bots, each with a fan account. login, seats, cart, pay. let\'s see what melts first. ⌁', mr: '>> 10:00:00. माझे शंभर bots, प्रत्येकाकडे fan account. login, seats, cart, pay. बघू आधी काय वितळतं. ⌁' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Then we rehearse tonight with the exact same journey: login, token, seats, cart, checkout. Ramp to 100 fans, hold, and let thresholds be the judge.', mr: 'मग आज रात्री आपण नेमक्या त्याच journey ची रंगीत तालीम करू: login, token, seats, cart, checkout. 100 fans पर्यंत ramp, hold, आणि निकाल thresholds देतील.' } },
        { who: 'theo', mood: 'worried', text: { en: 'And if something breaks, give me numbers and an endpoint. Not "it felt slow".', mr: 'आणि काही मोडलं तर मला आकडे आणि endpoint द्या. "हळू वाटलं" नको.' } },
        { who: 'meera', mood: 'happy', text: { en: '{name}, this one is yours. Build the full journey, set the goals, and find the bottleneck before the Gremlin does.', mr: '{name}, हे तुमचं काम. पूर्ण journey बनवा, ध्येयं ठरवा, आणि gremlin च्या आधी bottleneck शोधा.' } },
      ],
      problem: { en: 'A real buyer is a chain of steps, and each step needs something from the one before: the login token, the cart id. A test that only hits one URL never reaches checkout, and checkout is where last year\'s sale died. Without per-step goals nobody can say which step breaks first.', mr: 'खरा खरेदीदार म्हणजे steps ची साखळी, आणि प्रत्येक step ला आधीच्या step कडून काहीतरी लागतं: login token, cart id. फक्त एका URL वर मारा करणारी test checkout पर्यंत पोहोचतच नाही, आणि मागच्या वर्षीचा sale checkout वरच मेला. प्रत्येक step चं ध्येय नसेल तर आधी कोणती step मोडते हे कोणीच सांगू शकत नाही.' },
      solution: { en: 'Script the whole journey with correlation (res.json(\'token\'), cart.json(\'cartId\')), ramp it like the real morning with stages, confirm each answer with checks, and give each endpoint its own threshold. Then the By endpoint table points at the bottleneck with numbers.', mr: 'correlation सह पूर्ण journey ची script लिहा (res.json(\'token\'), cart.json(\'cartId\')), stages ने खऱ्या सकाळसारखा ramp द्या, प्रत्येक उत्तर checks ने confirm करा, आणि प्रत्येक endpoint ला स्वतःचा threshold द्या. मग By endpoint table आकड्यांसह bottleneck कडे बोट दाखवतो.' },
    },
    lesson: [
      { en: 'Correlation: taking a value from one response and sending it in the next request. Login answers { "token": "tok_fan007", "user": "fan007" }. const token = login.json(\'token\') reads it, and the cart and checkout requests send it as headers: { Authorization: \'Bearer \' + token }. The cart answer gives a cartId, and checkout must send that same id. In JMeter this is a JSON Extractor plus ${token}.', mr: 'correlation: एका response मधली value घेऊन ती पुढच्या request मध्ये पाठवणं. login उत्तर देतं { "token": "tok_fan007", "user": "fan007" }. const token = login.json(\'token\') ती वाचतं, आणि cart व checkout च्या requests ती headers: { Authorization: \'Bearer \' + token } म्हणून पाठवतात. cart च्या उत्तरात cartId येतो, आणि checkout ने तोच id पाठवायला हवा. JMeter मध्ये हे JSON Extractor आणि ${token} आहे.' },
      { en: 'Each VU needs its own fan account, or a hundred bots share one login, which no real sale looks like. \'fan\' + String(__VU).padStart(3, \'0\') turns VU 7 into fan007 (password pass007). Proper test data from a file comes later in the track.', mr: 'प्रत्येक VU ला स्वतःचं fan account हवं, नाहीतर शंभर bots एकच login वापरतील, जसा कोणताच खरा sale दिसत नाही. \'fan\' + String(__VU).padStart(3, \'0\') VU 7 ला fan007 बनवतं (password pass007). file मधून योग्य test data track मध्ये पुढे येईल.' },
      { en: 'Goals per step: name every request (login, seats, cart, checkout) and give the important ones their own p95 limit. Checks confirm each answer (201 for cart, status CONFIRMED for checkout). The money step deserves its own error goal: a failed checkout is a fan who may have been charged without a ticket.', mr: 'प्रत्येक step चं ध्येय: प्रत्येक request ला नाव द्या (login, seats, cart, checkout) आणि महत्त्वाच्या requests ना स्वतःची p95 मर्यादा द्या. checks प्रत्येक उत्तर confirm करतात (cart साठी 201, checkout साठी status CONFIRMED). पैशाच्या step ला स्वतःचं error ध्येय हवं: fail झालेला checkout म्हणजे असा fan ज्याचे पैसे कदाचित कापले गेले पण तिकीट नाही.' },
      { en: 'Finding the bottleneck: when one endpoint slows down, the others often slow too, because they share the same web workers. Look for the one that is slowest by far, and ask why. Then report it like a tester: which endpoint, its p95 at how many VUs, the healthy number for comparison, and what you suspect.', mr: 'bottleneck शोधणं: एक endpoint हळू झाला की बाकीचेही अनेकदा हळू होतात, कारण ते तेच web workers वापरतात. जो खूपच जास्त हळू आहे तो शोधा, आणि का ते विचारा. मग tester सारखा report करा: कोणता endpoint, किती VUs वर त्याचा p95, तुलनेसाठी निरोगी आकडा, आणि तुम्हाला काय वाटतं.' },
    ],
    syntax: {
      template: "const login = http.post(BASE + '/auth/login', JSON.stringify({ username, password }), { headers: JSON_HEADERS, tags: { name: 'login' } });\nconst token = login.json('token');\nconst auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };\n\nconst cart = http.post(BASE + '/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { headers: auth, tags: { name: 'cart' } });\nconst co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });\ncheck(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });",
      parts: [
        { code: "login.json('token')", means: { en: 'read the token field from the login answer', mr: 'login च्या उत्तरातला token field वाचा' } },
        { code: "Authorization: 'Bearer ' + token", means: { en: 'prove who you are on the cart and checkout requests (note the space after Bearer)', mr: 'cart आणि checkout requests वर तुम्ही कोण ते सिद्ध करा (Bearer नंतरची space लक्षात ठेवा)' } },
        { code: "cart.json('cartId')", means: { en: 'the id of the cart this VU just created, sent to checkout', mr: 'या VU ने आत्ताच बनवलेल्या cart चा id, checkout ला पाठवायचा' } },
        { code: "'http_req_duration{name:checkout}'", means: { en: 'a response-time goal just for the money step', mr: 'फक्त पैशाच्या step साठी response time चं ध्येय' } },
      ],
      example: [
        { code: "const n = String(__VU).padStart(3, '0');", note: { en: 'VU 42 becomes "042", so fan042 / pass042', mr: 'VU 42 चा "042" होतो, म्हणजे fan042 / pass042' } },
        { code: "const token = login.json('token');", note: { en: 'the wristband you get at the gate', mr: 'gate वर मिळणारा wristband' } },
        { code: "check(cart, { 'cart created': (r) => r.status === 201 });", note: { en: 'the seats are held for this fan', mr: 'या fan साठी seats राखून ठेवल्या' } },
        { code: "check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });", note: { en: 'paid and confirmed, not just "200"', mr: 'पैसे भरले आणि confirm झालं, फक्त "200" नाही' } },
        { code: "'http_req_duration{name:checkout}': ['p(95)<800'],", note: { en: 'healthy checkout is about 470 ms at 100 VUs, so 800 leaves room', mr: '100 VUs वर निरोगी checkout सुमारे 470 ms, म्हणून 800 मध्ये जागा राहते' } },
      ],
      pitfall: { en: 'If login fails, login.json(\'token\') is empty and every later step returns 401, so the test reports a slow cart when the real problem is login. Check each step\'s answer. And never hard-code a cartId: carts belong to one fan and are used up by checkout.', mr: 'login fail झालं तर login.json(\'token\') रिकामं येतं आणि पुढची प्रत्येक step 401 देते, म्हणजे खरी अडचण login मध्ये असताना test हळू cart दाखवते. प्रत्येक step चं उत्तर check करा. आणि cartId कधीच hard-code करू नका: cart एकाच fan चा असतो आणि checkout नंतर संपतो.' },
    },
    practice: {
      intro: { en: 'The dress rehearsal. Step by step you build the full buyer journey, then load it like 10 am. Boss rules: only 2 hints per step, so read them carefully.', mr: 'रंगीत तालीम. step by step तुम्ही पूर्ण खरेदीची journey बनवाल, मग तिच्यावर 10 वाजल्यासारखा load टाकाल. boss चे नियम: प्रत्येक step ला फक्त 2 hints, म्हणून ते नीट वाचा.' },
      steps: [
        {
          kind: 'perf',
          prompt: { en: 'Each fan logs in, then adds 2 tickets to the cart. Right now every cart request gets 401 because no token is sent. Read the token from the login response with login.json(\'token\') and send it on the cart request as Authorization: \'Bearer \' + token.', mr: 'प्रत्येक fan login करतो, मग cart मध्ये 2 तिकिटं टाकतो. आत्ता प्रत्येक cart request ला 401 मिळतो कारण token पाठवलाच जात नाही. login response मधून login.json(\'token\') ने token वाचा आणि cart request वर Authorization: \'Bearer \' + token म्हणून पाठवा.' },
          starter: B1_START,
          solution: B1_SOL,
          requireThresholds: true,
          mustUse: [
            { pattern: "json\\(\\s*['\"]token['\"]\\s*\\)", message: { en: "Read the token from the response: login.json('token').", mr: "response मधून token वाचा: login.json('token')." } },
            { pattern: 'Authorization', message: { en: 'Send the token in an Authorization header.', mr: 'token Authorization header मध्ये पाठवा.' } },
          ],
          verify: [{ check: (r) => (r.byName['cart']?.count ?? 0) > 0 && (r.byName['cart']?.failed ?? 1) === 0, message: { en: 'Every cart request should succeed with 201. Is the token reaching the cart request?', mr: 'प्रत्येक cart request 201 सह यशस्वी व्हायला हवी. token cart request पर्यंत पोहोचतोय का?' } }],
          hints: [
            { en: "Two lines: const token = login.json('token'); then a headers object with both Content-Type and Authorization, used by the cart request.", mr: "दोन ओळी: const token = login.json('token'); मग Content-Type आणि Authorization दोन्ही असलेला headers object, जो cart request वापरेल." },
            { en: "const token = login.json('token');\nconst auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };\n// and in the cart request: { headers: auth, tags: { name: 'cart' } }", mr: "const token = login.json('token');\nconst auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };\n// and in the cart request: { headers: auth, tags: { name: 'cart' } }" },
          ],
          successLine: { en: 'Ten fans, ten tokens, ten carts. The wristband works.', mr: 'दहा fans, दहा tokens, दहा carts. wristband चालतोय.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Theo\'s draft checks out cartId \'c1\' for everyone, so almost every checkout gets 404. Send the cartId from this fan\'s own cart response, and add a check named \'order confirmed\' that the checkout response field status is \'CONFIRMED\'.', mr: 'Theo चा draft सगळ्यांसाठी cartId \'c1\' चा checkout करतो, म्हणून जवळजवळ प्रत्येक checkout ला 404 मिळतो. या fan च्या स्वतःच्या cart response मधला cartId पाठवा, आणि checkout response मधला status field \'CONFIRMED\' आहे असा \'order confirmed\' नावाचा check जोडा.' },
          starter: B2_START,
          solution: B2_SOL,
          requireThresholds: true,
          mustUse: [{ pattern: "json\\(\\s*['\"]cartId['\"]\\s*\\)", message: { en: "Take the cart id from the cart response: cart.json('cartId').", mr: "cart response मधून cart id घ्या: cart.json('cartId')." } }],
          verify: [
            { check: (r) => (r.byName['checkout']?.count ?? 0) > 0 && (r.byName['checkout']?.failed ?? 1) === 0, message: { en: 'Every checkout should return 200. Is each fan sending the cartId of their own cart?', mr: 'प्रत्येक checkout ने 200 द्यायला हवा. प्रत्येक fan स्वतःच्या cart चा cartId पाठवतोय का?' } },
            { check: (r) => r.checks.some((c) => c.name === 'order confirmed' && c.passes > 0 && c.fails === 0), message: { en: "Add check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' }).", mr: "check(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' }) जोडा." } },
          ],
          hints: [
            { en: "Replace 'c1' with cart.json('cartId'). Then check the checkout response co: its JSON field status must equal 'CONFIRMED'.", mr: "'c1' च्या जागी cart.json('cartId') लिहा. मग checkout response co तपासा: त्याचा JSON field status 'CONFIRMED' असायला हवा." },
            { en: "const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });\ncheck(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });", mr: "const co = http.post(BASE + '/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { headers: auth, tags: { name: 'checkout' } });\ncheck(co, { 'order confirmed': (r) => r.json('status') === 'CONFIRMED' });" },
          ],
          successLine: { en: 'The full journey works end to end: login, seats, cart, checkout, CONFIRMED. Now let\'s make it 10 am.', mr: 'पूर्ण journey सुरुवातीपासून शेवटपर्यंत चालते: login, seats, cart, checkout, CONFIRMED. आता 10 वाजवूया.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Make it the real morning. Replace vus and duration with stages: ramp up to 100 VUs in 30s, hold for 1m, ramp down to 0 in 20s. Then give login, seats and checkout their own p95 goals. Healthy p95 today: login about 160 ms, seats about 200 ms, checkout about 470 ms. Your goals must pass on the healthy server and fail on three hidden builds.', mr: 'खरी सकाळ बनवा. vus आणि duration च्या जागी stages: 30s मध्ये 100 VUs पर्यंत ramp up, 1m hold, 20s मध्ये 0 पर्यंत ramp down. मग login, seats आणि checkout ला स्वतःची p95 ध्येयं द्या. आजचे निरोगी p95: login सुमारे 160 ms, seats सुमारे 200 ms, checkout सुमारे 470 ms. तुमची ध्येयं निरोगी server वर pass आणि तीन लपवलेल्या builds वर fail व्हायला हवीत.' },
          starter: B3_START,
          solution: B3_SOL,
          requireThresholds: true,
          mustNotUse: [{ pattern: '\\bvus\\s*:', message: { en: 'Remove vus: the stages decide the VUs now.', mr: 'vus: काढून टाका: आता VUs stages ठरवतात.' } }],
          mustUse: [
            { pattern: 'http_req_duration\\{name:login\\}', message: { en: "Add a goal for login: 'http_req_duration{name:login}'.", mr: "login साठी ध्येय टाका: 'http_req_duration{name:login}'." } },
            { pattern: 'http_req_duration\\{name:seats\\}', message: { en: "Add a goal for seats: 'http_req_duration{name:seats}'.", mr: "seats साठी ध्येय टाका: 'http_req_duration{name:seats}'." } },
            { pattern: 'http_req_duration\\{name:checkout\\}', message: { en: "Add a goal for checkout: 'http_req_duration{name:checkout}'.", mr: "checkout साठी ध्येय टाका: 'http_req_duration{name:checkout}'." } },
          ],
          verify: [
            { check: (r) => stagesOf(r).length >= 3 && stagesOf(r).at(-1)?.target === 0, message: { en: 'Use stages that ramp up, hold, and ramp down to target 0.', mr: 'ramp up, hold आणि target 0 पर्यंत ramp down करणारे stages वापरा.' } },
            { check: (r) => r.maxVUs >= 90 && r.maxVUs <= 120, message: { en: 'The peak should be about 100 VUs.', mr: 'शिखर सुमारे 100 VUs असायला हवं.' } },
          ],
          mustCatch: [
            { bug: 'small-pool', label: { en: 'Payment gateway pool has 3 connections instead of 12', mr: 'payment gateway pool मध्ये 12 ऐवजी 3 connections' } },
            { bug: 'slow-login', label: { en: 'Password hashing set far too high (login 600 ms)', mr: 'password hashing खूपच जास्त (login 600 ms)' } },
            { bug: 'slow-seats', label: { en: 'Seat map runs one query per seat (700 ms)', mr: 'seat map प्रत्येक seat साठी एक query चालवतो (700 ms)' } },
          ],
          hints: [
            { en: 'Leave room above the healthy numbers, roughly double or more: login under 400, seats under 500, checkout under 800. Tighter than about 1.3 times healthy will flicker red.', mr: 'निरोगी आकड्यांच्या वर जागा ठेवा, साधारण दुप्पट किंवा जास्त: login 400 च्या आत, seats 500 च्या आत, checkout 800 च्या आत. निरोगी आकड्याच्या 1.3 पटीपेक्षा कडक ठेवलं तर मधूनच लाल होईल.' },
            { en: "stages: [\n  { duration: '30s', target: 100 },\n  { duration: '1m', target: 100 },\n  { duration: '20s', target: 0 },\n],\nthresholds: {\n  http_req_failed: ['rate<0.01'],\n  checks: ['rate>0.99'],\n  'http_req_duration{name:login}': ['p(95)<400'],\n  'http_req_duration{name:seats}': ['p(95)<500'],\n  'http_req_duration{name:checkout}': ['p(95)<800'],\n},", mr: "stages: [\n  { duration: '30s', target: 100 },\n  { duration: '1m', target: 100 },\n  { duration: '20s', target: 0 },\n],\nthresholds: {\n  http_req_failed: ['rate<0.01'],\n  checks: ['rate>0.99'],\n  'http_req_duration{name:login}': ['p(95)<400'],\n  'http_req_duration{name:seats}': ['p(95)<500'],\n  'http_req_duration{name:checkout}': ['p(95)<800'],\n}," },
          ],
          successLine: { en: 'Green on the healthy server, red on all three of the Gremlin\'s builds. Your test is ready for 10 am.', mr: 'निरोगी server वर हिरवं, gremlin च्या तिन्ही builds वर लाल. तुमची test 10 वाजण्यासाठी तयार आहे.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'At 11 pm the Gremlin swaps in a build. Your thresholds go red everywhere. Press Run load test, open the By endpoint tab, and decide: which endpoint is the bottleneck?', mr: 'रात्री 11 वाजता gremlin एक build बदलतो. तुमचे thresholds सगळीकडे लाल होतात. Run load test दाबा, By endpoint tab उघडा, आणि ठरवा: bottleneck कोणता endpoint आहे?' },
          perfSandbox: { code: B3_SOL, build: ['small-pool'] },
          options: [
            { en: 'login: it is the first step and every fan hits it', mr: 'login: ती पहिली step आहे आणि प्रत्येक fan तिथे येतो' },
            { en: 'seats: it is the heaviest database query', mr: 'seats: ती सगळ्यात जड database query आहे' },
            { en: 'None: all four are slow by the same amount, so the server is simply too small', mr: 'कोणताच नाही: चारही सारखेच हळू आहेत, म्हणजे server फक्त लहान आहे' },
            { en: 'checkout: its p95 is about 3.8 s, roughly twice the others. The others are slow because they wait behind checkouts for a free worker.', mr: 'checkout: त्याचा p95 सुमारे 3.8 s, बाकीच्यांच्या साधारण दुप्पट. बाकीचे हळू आहेत कारण ते मोकळ्या worker साठी checkouts च्या मागे थांबतात.' },
          ],
          correct: [3],
          explain: { en: 'Checkout waits for a payment-gateway connection while holding a web worker. With only 3 connections, checkouts pile up, hold the workers, and login, seats and cart queue behind them at about 1.75 s. Report: "At 100 VUs, POST /checkout p95 3.8 s (healthy 470 ms); other endpoints about 1.75 s, which looks like queueing. Suspect the payment gateway pool."', mr: 'checkout web worker धरून ठेवून payment-gateway connection ची वाट पाहतो. फक्त 3 connections असल्यामुळे checkouts साचतात, workers अडकवतात, आणि login, seats आणि cart त्यांच्यामागे सुमारे 1.75 s रांगेत थांबतात. report: "100 VUs वर POST /checkout चा p95 3.8 s (निरोगी 470 ms); बाकीचे endpoints सुमारे 1.75 s, जे रांगेमुळे वाटतं. payment gateway pool वर संशय."' },
          hints: [
            { en: 'The table is sorted by p95, slowest first. Is the top row a little slower than the rest, or far slower?', mr: 'table p95 नुसार, सगळ्यात हळू आधी, लावलेला आहे. पहिली ओळ बाकीच्यांपेक्षा थोडी हळू आहे की खूपच?' },
            { en: 'Endpoints share 24 web workers. One step that holds a worker for seconds makes every other step wait in the queue. Find the one that holds them.', mr: 'endpoints 24 web workers वाटून घेतात. सेकंदभर worker धरून ठेवणारी एक step बाकी प्रत्येक step ला रांगेत थांबवते. workers धरून ठेवणारी शोधा.' },
          ],
          successLine: { en: 'Theo checks the config: GATEWAY_POOL=3. Back to 12, and the whole table drops back under 500 ms.', mr: 'Theo config तपासतो: GATEWAY_POOL=3. परत 12 केलं, आणि पूर्ण table परत 500 ms च्या खाली.' },
        },
        {
          kind: 'perf',
          prompt: { en: '9:40 am. Theo\'s last-minute hotfix is live, and the Gremlin hid one more trick in it: when the payment gateway gets busy, some checkouts fail with 500. Your timing goals still pass on it. Add a goal for the money step: fewer than 1% of checkout requests may fail. Your test must fail on tonight\'s build and pass on the healthy one.', mr: 'सकाळी 9:40. Theo चा शेवटच्या क्षणाचा hotfix live झालाय, आणि gremlin ने त्यात आणखी एक युक्ती लपवली: payment gateway busy झाला की काही checkouts 500 सह fail होतात. तुमची वेळेची ध्येयं त्यावर अजूनही pass होतात. पैशाच्या step साठी ध्येय जोडा: 1% पेक्षा कमी checkout requests fail होऊ शकतात. तुमची test आजच्या build वर fail आणि निरोगी build वर pass व्हायला हवी.' },
          starter: B5_START,
          solution: B5_SOL,
          build: ['errors-under-load'],
          expectFailure: true,
          requireThresholds: true,
          mustUse: [{ pattern: 'http_req_failed\\{name:checkout\\}', message: { en: "Put the error goal on checkout itself: 'http_req_failed{name:checkout}'.", mr: "error चं ध्येय checkout वरच ठेवा: 'http_req_failed{name:checkout}'." } }],
          hints: [
            { en: 'Same idea as the duration goals, with a different metric: http_req_failed filtered by the checkout name, and a rate limit.', mr: 'duration च्या ध्येयांसारखीच कल्पना, फक्त वेगळा metric: checkout नावाने filter केलेला http_req_failed, आणि rate ची मर्यादा.' },
            { en: "'http_req_failed{name:checkout}': ['rate<0.01'],", mr: "'http_req_failed{name:checkout}': ['rate<0.01']," },
          ],
          successLine: { en: 'About 1 in 5 checkouts failed on the hotfix build, and your test said so in red. Theo rolls the hotfix back at 9:52. Eight minutes to spare.', mr: 'hotfix build वर साधारण 5 पैकी 1 checkout fail झाला, आणि तुमच्या test ने ते लाल अक्षरात सांगितलं. Theo 9:52 ला hotfix मागे घेतो. आठ मिनिटं बाकी.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Login answers with this JSON. Which line reads the token?', mr: 'login हा JSON देतं. कोणती ओळ token वाचते?' },
        code: '{ "token": "tok_fan007", "user": "fan007" }',
        options: [
          "const token = login.token;",
          "const token = login.body.token;",
          "const token = login.json('token');",
          "const token = JSON.parse(login).token;",
        ],
        answer: 2,
        explain: { en: 'res.json(\'token\') reads one field from a JSON response. login.body is a string, so login.body.token is undefined.', mr: 'res.json(\'token\') JSON response मधला एक field वाचतं. login.body हा string आहे, म्हणून login.body.token undefined येतो.' },
      },
      {
        q: { en: 'At 100 VUs almost every checkout returns 404 "Cart not found". The script sends cartId: \'c1\'. Why?', mr: '100 VUs वर जवळजवळ प्रत्येक checkout 404 "Cart not found" देतो. script cartId: \'c1\' पाठवते. का?' },
        options: [
          { en: 'Each fan must check out the cart they just created. c1 belongs to one fan and is gone after one checkout, so take the id from the cart response.', mr: 'प्रत्येक fan ने आत्ताच बनवलेल्या cart चाच checkout करायला हवा. c1 एकाच fan चा असतो आणि एका checkout नंतर संपतो, म्हणून id cart response मधून घ्या.' },
          { en: 'The server is overloaded, so it loses carts', mr: 'server वर जास्त load आहे, म्हणून तो carts हरवतो' },
          { en: 'cartId must be a number, not a string', mr: 'cartId string नाही, number असायला हवा' },
          { en: 'Checkout needs a sleep() before it', mr: 'checkout आधी sleep() लागतं' },
        ],
        answer: 0,
        explain: { en: 'This is a correlation mistake, not a performance problem. cart.json(\'cartId\') gives each VU its own cart.', mr: 'ही correlation ची चूक आहे, performance ची समस्या नाही. cart.json(\'cartId\') प्रत्येक VU ला स्वतःचा cart देतं.' },
      },
      {
        q: { en: 'Which threshold catches a build where 1 in 5 checkouts fails with 500, even though all response times look normal?', mr: 'सगळे response times सामान्य दिसत असतानाही 5 पैकी 1 checkout 500 सह fail होतो, असा build कोणता threshold पकडतो?' },
        options: [
          "'http_req_duration{name:checkout}': ['p(95)<800']",
          "'http_req_failed{name:checkout}': ['rate<0.01']",
          "'http_req_duration{name:login}': ['p(99)<1000']",
          "iterations: ['count>100']",
        ],
        answer: 1,
        explain: { en: 'Fast failures do not break a duration goal. The error rate on checkout does: about 20% against a limit of 1%.', mr: 'जलद failures duration चं ध्येय मोडत नाहीत. checkout वरचा error rate मोडतो: 1% च्या मर्यादेसमोर सुमारे 20%.' },
      },
      {
        q: { en: 'By endpoint at 100 VUs: checkout p95 3.8 s, login 1.75 s, seats 1.75 s, cart 1.74 s. Last week, healthy checkout was 470 ms. Which is the best bug report?', mr: '100 VUs वर By endpoint: checkout p95 3.8 s, login 1.75 s, seats 1.75 s, cart 1.74 s. मागच्या आठवड्यात निरोगी checkout 470 ms होता. सगळ्यात चांगला bug report कोणता?' },
        options: [
          { en: '"The site is slow, please fix."', mr: '"site हळू आहे, कृपया दुरुस्त करा."' },
          { en: '"Login is broken, it takes 1.75 s."', mr: '"login बिघडलंय, त्याला 1.75 s लागतात."' },
          { en: '"Add more servers, all endpoints are slow."', mr: '"आणखी servers वाढवा, सगळे endpoints हळू आहेत."' },
          { en: '"At 100 VUs, POST /checkout p95 is 3.8 s (was 470 ms). Other endpoints rose to about 1.75 s, likely queueing behind checkout. Suspect the payment gateway connections."', mr: '"100 VUs वर POST /checkout चा p95 3.8 s (आधी 470 ms). बाकीचे endpoints सुमारे 1.75 s पर्यंत वाढले, बहुतेक checkout मागच्या रांगेमुळे. payment gateway connections वर संशय."' },
        ],
        answer: 3,
        explain: { en: 'A good performance bug report names the endpoint, the load, the number, the baseline, and the likely cause. The others guess or blame the victims.', mr: 'चांगला performance bug report endpoint, load, आकडा, आधीचा आकडा आणि संभाव्य कारण सांगतो. बाकीचे अंदाज लावतात किंवा बळींना दोष देतात.' },
      },
    ],
    recap: { line: { en: 'A flash-sale test is the full journey with correlation (token, cartId), stages like the real morning, checks on every answer and a threshold per endpoint. Find the bottleneck in By endpoint and report it with numbers.', mr: 'flash-sale test म्हणजे correlation (token, cartId) सह पूर्ण journey, खऱ्या सकाळसारखे stages, प्रत्येक उत्तरावर checks आणि प्रत्येक endpoint ला threshold. By endpoint मध्ये bottleneck शोधा आणि आकड्यांसह report करा.' }, icon: '🎟️' },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: '>> three tiny connections. you found them in one run. and my hotfix. and my slow login. ⌁⌁', mr: '>> तीन चिमुकले connections. एका run मध्ये शोधलेस. आणि माझा hotfix. आणि माझं हळू login. ⌁⌁' } },
      { who: 'gremlin', mood: 'smug', text: { en: '>> fine. next time i won\'t come at 10 am. i\'ll come all at once, and then i\'ll stay all night. ⌁', mr: '>> ठीक आहे. पुढच्या वेळी मी 10 वाजता येणार नाही. मी एकदम येईन, आणि मग रात्रभर थांबेन. ⌁' } },
      { who: 'theo', mood: 'happy', text: { en: 'Gateway pool at 12, hotfix rolled back, login hashing fixed. Your thresholds are green on all of it.', mr: 'gateway pool 12 वर, hotfix मागे घेतला, login hashing दुरुस्त. तुमचे thresholds सगळ्यावर हिरवे आहेत.' } },
      { who: 'sam', mood: 'happy', text: { en: 'Sold out in 18 minutes. Not one fan charged without a ticket. The organisers want us for the whole tour. Thank you, {name}!', mr: '18 मिनिटांत सगळी तिकिटं संपली. एकाही fan चे पैसे तिकिटाशिवाय कापले गेले नाहीत. organisers ना पूर्ण tour साठी आपणच हवे आहोत. धन्यवाद, {name}!' } },
      { who: 'rex', mood: 'happy', text: { en: 'You did not guess. You measured, wrote the goal down, and named the bottleneck with numbers. That is performance testing.', mr: 'तुम्ही अंदाज लावला नाही. तुम्ही मोजलं, ध्येय लिहून ठेवलं, आणि आकड्यांसह bottleneck दाखवला. यालाच performance testing म्हणतात.' } },
      { who: 'meera', mood: 'happy', text: { en: 'Rank up, {name}: Performance Tester. Next stop, StageDoor Live and opening night: stress, spikes and an all-night soak.', mr: 'नवीन रँक, {name}: Performance Tester. पुढचा थांबा StageDoor Live आणि पहिल्या प्रयोगाची रात्र: stress, spikes आणि रात्रभराचा soak.' } },
    ],
  },
]
