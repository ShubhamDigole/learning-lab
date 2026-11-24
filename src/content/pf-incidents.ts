import type { Incident } from './types.ts'

// A real incident replayed on the StageDoor practice server. Facts checked against Ticketmaster's own
// statement "Taylor Swift | The Eras Tour Onsale Explained" (business.ticketmaster.com, November 2022) and
// NBC News' report of 17 November 2022 on the cancelled public sale. Real fans were affected: keep the tone
// respectful and factual.
//
// Measured on the engine for the rewind (healthy build, the P1.5 journey):
//  - stages 100 VUs then 400 VUs: at 100 VUs ~150 req/s, p95 ~0.4s; at 400 VUs only ~155-170 req/s, p95 ~2.1-2.4s,
//    0% errors. Four times the fans, about the same throughput: the extra fans only wait.
//  - waiting room at 120 VUs: login p95 ~253ms, seats ~291ms, checkout ~563ms, 0% errors.
//    small-pool: checkout ~4.4s, others ~2.5s. errors-under-load: ~22% of checkouts fail.

const B = 'https://api.stagedoor.test'

const JOURNEY = `export default function () {
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
  sleep(1);
}
`

const HEAD = `import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = '${B}';
const JSON_HEADERS = { 'Content-Type': 'application/json' };
`

const FOUR_X = `${HEAD}
export const options = {
  stages: [
    { duration: '1m', target: 100 }, // last year's peak
    { duration: '1m', target: 100 },
    { duration: '1m', target: 400 }, // four times the old peak
    { duration: '1m', target: 400 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:login}': ['p(95)<500'],
    'http_req_duration{name:seats}': ['p(95)<600'],
    'http_req_duration{name:checkout}': ['p(95)<1000'],
  },
};

${JOURNEY}`

const ROOM_START = `${HEAD}
export const options = {
  // TODO: the waiting room lets 120 fans in at a time. Use stages:
  //   ramp up to 120 VUs in 30s, hold 120 for 1m, ramp down to 0 in 20s
  vus: 400,
  duration: '1m',
  // TODO: thresholds from Sam's goals:
  //   login p95 under 500 ms, seats p95 under 600 ms, checkout p95 under 1000 ms,
  //   fewer than 1% of checkout requests fail, more than 99% of checks pass
};

${JOURNEY}`

const ROOM_SOL = `${HEAD}
export const options = {
  stages: [
    { duration: '30s', target: 120 },
    { duration: '1m', target: 120 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{name:login}': ['p(95)<500'],
    'http_req_duration{name:seats}': ['p(95)<600'],
    'http_req_duration{name:checkout}': ['p(95)<1000'],
    'http_req_failed{name:checkout}': ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

${JOURNEY}`

export const pfIncidents: Incident[] = [
  {
    id: 'ticketmaster-2022',
    title: { en: 'The Presale That Broke the Records, and the Site', mr: 'विक्रम मोडणारा presale, आणि मोडलेली site' },
    year: 'USA · November 2022',
    unlockAfter: 'pf1-5',
    headline: 'TICKETMASTER BUCKLES UNDER RECORD DEMAND FOR TAYLOR SWIFT TOUR PRESALE',
    counterLabel: { en: 'total system requests on presale day: four times Ticketmaster\'s previous peak', mr: 'presale च्या दिवशी एकूण system requests: Ticketmaster च्या आधीच्या सर्वोच्च आकड्याच्या चौपट' },
    counterTo: 3.5,
    counterPrefix: '',
    counterSuffix: 'B',
    beats: [
      {
        icon: '🎟️',
        time: { en: 'The plan', mr: 'योजना' },
        text: {
          en: 'Taylor Swift\'s The Eras Tour went on sale in the US through Ticketmaster\'s Verified Fan presale, meant to keep bots out. Over 3.5 million people registered, which Ticketmaster called the largest registration in its history. About 1.5 million were sent codes to buy, and the other 2 million were put on a waitlist. Ticketmaster based this on its history: about 40% of invited fans usually show up and buy.',
          mr: 'Taylor Swift ची The Eras Tour अमेरिकेत Ticketmaster च्या Verified Fan presale मधून विक्रीला आली, ज्याचा उद्देश bots ना बाहेर ठेवणं होता. 35 लाखांहून जास्त लोकांनी नोंदणी केली, जिला Ticketmaster ने त्यांच्या इतिहासातली सगळ्यात मोठी नोंदणी म्हटलं. सुमारे 15 लाख लोकांना खरेदीसाठी codes पाठवले, आणि बाकी 20 लाख लोकांना waitlist वर ठेवलं. Ticketmaster ने हे आपल्या अनुभवावरून ठरवलं: बोलावलेल्यांपैकी साधारण 40% fans प्रत्यक्ष येऊन खरेदी करतात.',
        },
      },
      {
        icon: '🌊',
        time: { en: '15 November 2022', mr: '15 नोव्हेंबर 2022' },
        text: {
          en: 'Presale day. Ticketmaster later said that a staggering number of bot attacks, plus fans who did not have invite codes, drove unprecedented traffic: 3.5 billion total system requests, four times its previous peak.',
          mr: 'presale चा दिवस. Ticketmaster ने नंतर सांगितलं की प्रचंड संख्येतले bot हल्ले, आणि invite codes नसलेले fans, यांमुळे कधीही न आलेलं traffic आलं: एकूण 3.5 अब्ज system requests, आधीच्या सर्वोच्च आकड्याच्या चौपट.',
        },
      },
      {
        icon: '⏳',
        time: { en: 'During the sale', mr: 'विक्री सुरू असताना' },
        text: {
          en: 'Fans waited for hours. At times the site crashed and sent people back to the start of the virtual queue. Ticketmaster said it slowed down some sales and pushed back others to stabilize its systems, and that about 15% of interactions on the site had problems, including passcode errors that made some fans lose tickets already in their carts.',
          mr: 'fans तासन्तास थांबले. कधीकधी site बंद पडली आणि लोकांना virtual queue च्या सुरुवातीला परत पाठवलं. Ticketmaster ने सांगितलं की systems स्थिर ठेवण्यासाठी त्यांनी काही विक्री हळू केली आणि काही पुढे ढकलली, आणि site वरच्या साधारण 15% interactions मध्ये अडचणी आल्या, त्यात passcode errors सुद्धा होते ज्यांमुळे काही fans ची cart मध्ये टाकलेली तिकिटं गेली.',
        },
      },
      {
        icon: '📈',
        time: { en: 'The same day', mr: 'त्याच दिवशी' },
        text: {
          en: 'Even so, over 2 million tickets were sold on 15 November, which Ticketmaster called the most ever sold for an artist in a single day. The demand was real. The system was not ready for all of it at once.',
          mr: 'तरीसुद्धा 15 नोव्हेंबरला 20 लाखांहून जास्त तिकिटं विकली गेली, ज्याला Ticketmaster ने एका कलाकारासाठी एका दिवसात विकलेली आजवरची सगळ्यात जास्त तिकिटं म्हटलं. मागणी खरी होती. system ती सगळी एकदम झेलायला तयार नव्हती.',
        },
      },
      {
        icon: '🛑',
        time: { en: '17 November 2022', mr: '17 नोव्हेंबर 2022' },
        text: {
          en: 'Ticketmaster cancelled the general public sale planned for the next day, citing extraordinarily high demand on its ticketing systems and too few tickets left to meet it. In its statement it apologised to Taylor Swift and to her fans, and admitted that its technology was not perfect, and clearly was not for this sale.',
          mr: 'Ticketmaster ने दुसऱ्या दिवशी ठरलेली सर्वांसाठीची विक्री रद्द केली, ticketing systems वरची असामान्य मागणी आणि ती पूर्ण करायला खूप कमी तिकिटं उरल्याचं कारण देत. आपल्या निवेदनात त्यांनी Taylor Swift आणि तिच्या fans ची माफी मागितली, आणि मान्य केलं की त्यांचं technology परिपूर्ण नाही, आणि या विक्रीसाठी तर नक्कीच नव्हतं.',
        },
      },
    ],
    lesson: {
      en: 'Test for the demand you can expect, not the peak you saw last time. Measure the ceiling of the full buying journey, push past your old peak to see what happens there, and size the waiting room from those numbers before the sale opens.',
      mr: 'मागच्या वेळी दिसलेल्या शिखरासाठी नाही, अपेक्षित मागणीसाठी test करा. पूर्ण खरेदी journey ची मर्यादा मोजा, जुन्या शिखराच्या पलीकडे जाऊन तिथे काय होतं ते पाहा, आणि sale उघडण्याआधी त्याच आकड्यांवरून waiting room चा आकार ठरवा.',
    },
    source: { label: 'Ticketmaster: Taylor Swift | The Eras Tour Onsale Explained (November 2022)', url: 'https://business.ticketmaster.com/press-release/taylor-swift-the-eras-tour-onsale-explained/' },
    rewind: {
      intro: {
        en: 'Rewind time. It is the night before StageDoor Live opens the presale for a stadium tour. Last year\'s biggest sale peaked at 100 fans in the site at once. Rex expects four times that. You load-test the full journey the way a presale like this should be tested: past the old peak, then at the size of the waiting room.',
        mr: 'वेळ मागे घ्या. StageDoor Live एका stadium tour चा presale उघडणार त्याच्या आदल्या रात्रीची वेळ आहे. मागच्या वर्षीच्या सगळ्यात मोठ्या sale चं शिखर म्हणजे site मध्ये एकाच वेळी 100 fans. Rex ला याच्या चौपट अपेक्षित आहेत. असा presale ज्या पद्धतीने test व्हायला हवा तशी तुम्ही पूर्ण journey ची load test करा: जुन्या शिखराच्या पलीकडे, मग waiting room च्या आकारावर.',
      },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'This test walks the full journey at last year\'s peak (100 fans) for two minutes, then climbs to four times that (400 fans). Press Run load test. Compare Requests/s and p95 on the live chart before and after the climb. What does it tell you?', mr: 'ही test दोन मिनिटं मागच्या वर्षीच्या शिखरावर (100 fans) पूर्ण journey चालवते, मग त्याच्या चौपट (400 fans) पर्यंत चढते. Run load test दाबा. live chart वर चढाईच्या आधी आणि नंतरचे Requests/s आणि p95 तुलना करा. यावरून काय कळतं?' },
          perfSandbox: { code: FOUR_X },
          options: [
            { en: 'Four times the fans gave four times the requests per second, so the server scales fine', mr: 'चौपट fans नी सेकंदाला चौपट requests दिल्या, म्हणजे server नीट वाढतो' },
            { en: 'Requests per second barely rose (about 150 to about 165) while p95 went from about 0.4 s to over 2 s. The server was already near its ceiling at the old peak; the extra fans only wait in line.', mr: 'सेकंदाला requests जवळजवळ वाढल्याच नाहीत (सुमारे 150 वरून सुमारे 165) आणि p95 सुमारे 0.4 s वरून 2 s पेक्षा जास्त झाला. जुन्या शिखरावरच server त्याच्या मर्यादेजवळ होता; जास्तीचे fans फक्त रांगेत थांबतात.' },
            { en: 'There are 0% errors, so the presale is safe at 400 fans', mr: '0% errors आहेत, म्हणजे 400 fans वर presale सुरक्षित आहे' },
            { en: 'The test is broken: it should show errors at 400 fans', mr: 'test बिघडली आहे: 400 fans वर errors दिसायला हवेत' },
          ],
          correct: [1],
          explain: { en: 'Throughput is the server\'s real capacity. When more users bring almost no extra requests per second and response times jump, you have found the ceiling. Every step taking over 2 s at 4x means the presale needs a plan: a waiting room sized below the ceiling. The 0% errors only mean these polite VUs waited; real fans would refresh and retry, which makes it worse.', mr: 'throughput म्हणजे server ची खरी क्षमता. जास्त users आल्यावर सेकंदाला जवळजवळ जास्त requests येत नाहीत आणि response times उडी घेतात, तेव्हा तुम्हाला मर्यादा सापडलेली असते. चौपट गर्दीवर प्रत्येक step ला 2 s पेक्षा जास्त म्हणजे presale ला योजना हवी: मर्यादेखाली आकार असलेली waiting room. 0% errors म्हणजे फक्त हे सभ्य VUs थांबले; खरे fans refresh आणि retry करतील, ज्याने परिस्थिती आणखी बिघडते.' },
          hints: [
            { en: 'Look at the Requests/s line on the chart when the VU line jumps from 100 to 400. Does it jump too?', mr: 'VU ची रेषा 100 वरून 400 वर उडी घेते तेव्हा chart वरची Requests/s ची रेषा पाहा. ती पण उडी घेते का?' },
            { en: 'If four times the people produce about the same number of requests, where are the extra people? Look at p95.', mr: 'चौपट लोक जवळजवळ तितक्याच requests देत असतील, तर जास्तीचे लोक कुठे आहेत? p95 पाहा.' },
            { en: 'The server serves about the same amount per second either way. The difference is how long everyone waits.', mr: 'server दोन्ही वेळा सेकंदाला जवळजवळ तितकंच काम करतो. फरक एवढाच की प्रत्येकजण किती वेळ थांबतो.' },
          ],
          successLine: { en: 'Ceiling found: about 150 to 170 requests a second for the full journey. Now we can plan the queue instead of hoping.', mr: 'मर्यादा सापडली: पूर्ण journey साठी सेकंदाला सुमारे 150 ते 170 requests. आता आशा ठेवण्याऐवजी रांगेचं नियोजन करू शकतो.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Rex sets the waiting room to let 120 fans into the site at a time; everyone else waits on a queue page. Prove the site meets Sam\'s goals at that size. Replace vus and duration with stages (30s up to 120 VUs, 1m at 120, 20s down to 0) and add thresholds: login p95 under 500 ms, seats p95 under 600 ms, checkout p95 under 1000 ms, fewer than 1% of checkout requests failing, and more than 99% of checks passing. Healthy p95 at 120 fans: login about 250 ms, seats about 290 ms, checkout about 560 ms. It must also fail on two hidden builds.', mr: 'Rex waiting room अशी ठेवतो की एका वेळी 120 fans site मध्ये येतील; बाकी सगळे queue page वर थांबतात. त्या आकारावर site Sam ची ध्येयं पूर्ण करते हे सिद्ध करा. vus आणि duration च्या जागी stages (30s मध्ये 120 VUs पर्यंत, 1m 120 वर, 20s मध्ये 0 पर्यंत) आणि thresholds जोडा: login p95 500 ms खाली, seats p95 600 ms खाली, checkout p95 1000 ms खाली, 1% पेक्षा कमी checkout requests fail, आणि 99% पेक्षा जास्त checks pass. 120 fans वर निरोगी p95: login सुमारे 250 ms, seats सुमारे 290 ms, checkout सुमारे 560 ms. ती दोन लपवलेल्या builds वर fail पण व्हायला हवी.' },
          starter: ROOM_START,
          solution: ROOM_SOL,
          requireThresholds: true,
          mustNotUse: [{ pattern: '\\bvus\\s*:', message: { en: 'Remove vus: the stages decide the VUs now.', mr: 'vus: काढून टाका: आता VUs stages ठरवतात.' } }],
          mustUse: [
            { pattern: 'http_req_duration\\{name:checkout\\}', message: { en: "Add the checkout goal: 'http_req_duration{name:checkout}': ['p(95)<1000'].", mr: "checkout चं ध्येय जोडा: 'http_req_duration{name:checkout}': ['p(95)<1000']." } },
            { pattern: 'http_req_failed\\{name:checkout\\}', message: { en: "Add the money goal: 'http_req_failed{name:checkout}': ['rate<0.01'].", mr: "पैशाचं ध्येय जोडा: 'http_req_failed{name:checkout}': ['rate<0.01']." } },
          ],
          verify: [
            { check: (r) => Array.isArray(r.options.stages) && (r.options.stages as unknown[]).length >= 3, message: { en: 'Use stages: ramp up, hold, ramp down.', mr: 'stages वापरा: ramp up, hold, ramp down.' } },
            { check: (r) => r.maxVUs >= 110 && r.maxVUs <= 130, message: { en: 'The waiting room holds 120 fans: the peak should be 120 VUs.', mr: 'waiting room मध्ये 120 fans मावतात: शिखर 120 VUs असायला हवं.' } },
          ],
          mustCatch: [
            { bug: 'small-pool', label: { en: 'Payment gateway pool has 3 connections instead of 12', mr: 'payment gateway pool मध्ये 12 ऐवजी 3 connections' } },
            { bug: 'errors-under-load', label: { en: 'Under load, 1 in 4 checkouts fails with 500', mr: 'load खाली 4 पैकी 1 checkout 500 सह fail' } },
          ],
          hints: [
            { en: 'Two parts: stages in place of vus and duration, then a thresholds object with five entries, one per goal.', mr: 'दोन भाग: vus आणि duration च्या जागी stages, मग पाच entries असलेला thresholds object, प्रत्येक ध्येयासाठी एक.' },
            { en: 'The duration goals filter http_req_duration by name; the money goal filters http_req_failed by name; checks uses rate>0.99.', mr: 'duration ची ध्येयं http_req_duration नावाने filter करतात; पैशाचं ध्येय http_req_failed नावाने filter करतं; checks rate>0.99 वापरतो.' },
            { en: "stages: [\n  { duration: '30s', target: 120 },\n  { duration: '1m', target: 120 },\n  { duration: '20s', target: 0 },\n],\nthresholds: {\n  'http_req_duration{name:login}': ['p(95)<500'],\n  'http_req_duration{name:seats}': ['p(95)<600'],\n  'http_req_duration{name:checkout}': ['p(95)<1000'],\n  'http_req_failed{name:checkout}': ['rate<0.01'],\n  checks: ['rate>0.99'],\n},", mr: "stages: [\n  { duration: '30s', target: 120 },\n  { duration: '1m', target: 120 },\n  { duration: '20s', target: 0 },\n],\nthresholds: {\n  'http_req_duration{name:login}': ['p(95)<500'],\n  'http_req_duration{name:seats}': ['p(95)<600'],\n  'http_req_duration{name:checkout}': ['p(95)<1000'],\n  'http_req_failed{name:checkout}': ['rate<0.01'],\n  checks: ['rate>0.99'],\n}," },
          ],
          successLine: { en: 'At 120 fans in the site, every goal holds with room to spare, and both hidden builds turn red. The waiting room size is now a measured number.', mr: 'site मध्ये 120 fans असताना प्रत्येक ध्येय पुरेशी जागा ठेवून टिकतं, आणि दोन्ही लपवलेले builds लाल होतात. waiting room चा आकार आता मोजलेला आकडा आहे.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'It is the evening before the presale. Which note do you send to Sam and Rex?', mr: 'presale च्या आदल्या दिवशीची संध्याकाळ आहे. Sam आणि Rex ला कोणती note पाठवाल?' },
          options: [
            { en: '"All good: 0% errors even at 400 fans."', mr: '"सगळं ठीक: 400 fans वरही 0% errors."' },
            { en: '"We cannot know until real fans arrive. Let\'s watch the dashboards tomorrow."', mr: '"खरे fans येईपर्यंत कळणार नाही. उद्या dashboards पाहूया."' },
            { en: '"Buy more servers so we never need a queue."', mr: '"आणखी servers विकत घ्या म्हणजे queue ची गरजच पडणार नाही."' },
            { en: '"Ceiling: about 150 to 170 requests a second for the full journey; at 4x last year\'s peak every step takes over 2 s. At 120 fans in the site, all goals pass (checkout p95 about 560 ms, 0% errors). Plan: waiting room at 120, keep bots and code-less visitors at the queue, and retest after any change."', mr: '"मर्यादा: पूर्ण journey साठी सेकंदाला सुमारे 150 ते 170 requests; मागच्या वर्षीच्या शिखराच्या चौपट गर्दीवर प्रत्येक step ला 2 s पेक्षा जास्त. site मध्ये 120 fans असताना सगळी ध्येयं pass (checkout p95 सुमारे 560 ms, 0% errors). योजना: waiting room 120 वर, bots आणि code नसलेल्या visitors ना queue वरच ठेवा, आणि कोणताही बदल झाल्यावर पुन्हा test करा."' },
          ],
          correct: [3],
          explain: { en: 'The useful note gives the measured ceiling, what happens beyond it, the size that is proven safe and the plan that follows from the numbers. "0% errors" from polite VUs hides a 2-second wait; "wait and see" is what the presale did; more servers without a measured target is a guess.', mr: 'उपयोगी note मोजलेली मर्यादा, तिच्या पलीकडे काय होतं, सुरक्षित सिद्ध झालेला आकार आणि आकड्यांवरून ठरणारी योजना सांगते. सभ्य VUs चे "0% errors" 2 सेकंदांची वाट लपवतात; "थांबा आणि पाहा" हेच त्या presale मध्ये झालं; मोजलेल्या लक्ष्याशिवाय जास्त servers म्हणजे अंदाज.' },
          hints: [
            { en: 'A good performance note has numbers, a limit, and a plan that comes from those numbers.', mr: 'चांगल्या performance note मध्ये आकडे, मर्यादा, आणि त्या आकड्यांवरून ठरलेली योजना असते.' },
            { en: 'Which note would still be useful if the demand turned out to be four times the old peak?', mr: 'मागणी जुन्या शिखराच्या चौपट निघाली तरी कोणती note उपयोगी ठरेल?' },
          ],
          successLine: { en: 'Presale morning: the queue page fills, the site inside stays fast, and nobody loses a ticket from their cart.', mr: 'presale ची सकाळ: queue page भरतं, आतली site जलद राहते, आणि कोणाचीच cart मधली तिकिटं जात नाहीत.' },
        },
      ],
    },
  },
]
