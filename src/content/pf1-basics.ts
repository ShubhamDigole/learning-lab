import type { Lesson } from './types.ts'

// Performance 1 basics: the first k6 script, and checks. The learner writes real k6 scripts against StageDoor.

const B = 'https://api.stagedoor.test'

const hasUrl = (keys: string[], end: string) => keys.some((k) => k === end || k.endsWith(end))

// A short flash-sale journey used by the checks threshold step.
const saleFlow = (thresholds: string) => `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 60,
  duration: '1m',
  thresholds: {
${thresholds}
  },
};

export default function () {
  const n = String((__VU % 200) + 1).padStart(3, '0');
  const login = http.post('${B}/auth/login',
    JSON.stringify({ username: 'fan' + n, password: 'pass' + n }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } });
  check(login, { 'logged in': (r) => r.status === 200 });
  const auth = { headers: { Authorization: 'Bearer ' + login.json('token'), 'Content-Type': 'application/json' } };

  http.get('${B}/events/1/seats', { tags: { name: 'seats' } });
  sleep(1);

  const cart = http.post('${B}/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { ...auth, tags: { name: 'cart' } });
  const res = http.post('${B}/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { ...auth, tags: { name: 'checkout' } });
  check(res, {
    'order confirmed': (r) => r.status === 200 && r.json('status') === 'CONFIRMED',
  });
  sleep(1);
}
`

export const pfBasicsLessons: Lesson[] = [
  // ───────────────────────── P1.1 Your first k6 script
  {
    id: 'pf1-1',
    code: 'P1.1',
    level: 'basic',
    title: { en: 'Your first k6 script', mr: 'तुमची पहिली k6 script' },
    skill: 'k6 script, options, summary',
    realLife: {
      place: 'wedding',
      title: { en: 'The caterer\'s trial lunch', mr: 'केटररचं ट्रायल जेवण' },
      story: {
        en: 'Meera\'s cousin is getting married, and 800 guests will eat at once. Joshi caterers do not wait for the big day to find out if the kitchen copes. One week before, they run a trial: a written menu (what each guest takes), ten friends as guests, one hour on the clock. Each friend takes a plate, eats slowly, comes back for more. At the end, Joshi kaka writes a report: plates served, how long the queue took, what ran out. Then they invite more friends.',
        mr: 'मीराच्या चुलत बहिणीचं लग्न आहे, आणि 800 पाहुणे एकदम जेवणार आहेत. स्वयंपाकघराला झेपेल का, हे पाहायला जोशी केटरर्स मोठ्या दिवसाची वाट पाहत नाहीत. आठवडाभर आधी ते ट्रायल घेतात: लिहिलेला मेन्यू (प्रत्येक पाहुणा काय घेतो), दहा मित्र पाहुणे म्हणून, घड्याळावर एक तास. प्रत्येक मित्र ताट घेतो, हळू जेवतो, पुन्हा वाढून घ्यायला येतो. शेवटी जोशी काका रिपोर्ट लिहितात: किती ताटं वाढली, रांगेला किती वेळ लागला, काय संपलं. मग ते अजून मित्रांना बोलावतात.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📜', label: 'Menu: what each guest does (default function)', mr: 'मेन्यू: प्रत्येक पाहुणा काय करतो (default function)' },
          { icon: '👥', label: 'Ten friends (vus: 10)', mr: 'दहा मित्र (vus: 10)' },
          { icon: '⏱️', label: 'One hour on the clock (duration)', mr: 'घड्याळावर एक तास (duration)' },
          { icon: '🍛', label: 'Eat slowly, come back (sleep)', mr: 'हळू जेवा, परत या (sleep)' },
          { icon: '🧾', label: 'The report (end-of-test summary)', mr: 'रिपोर्ट (end-of-test summary)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'rex', mood: 'happy', text: { en: 'Enough watching my tests, {name}. Today you write your own. k6 scripts are plain JavaScript, and you already know TypeScript from Playwright.', mr: 'माझ्या tests पाहणं पुरे, {name}. आज तुम्ही स्वतःची लिहाल. k6 scripts साधं JavaScript असतात, आणि Playwright मुळे तुम्हाला TypeScript आधीच येतं.' } },
        { who: 'sam', mood: 'worried', text: { en: 'Will it not crash the real site? The sale is on Friday!', mr: 'खरी साइट कोसळणार नाही ना? विक्री शुक्रवारी आहे!' } },
        { who: 'meera', mood: 'neutral', text: { en: 'We run against the test server, and we start small: 10 fans for 30 seconds. Like the caterer\'s trial lunch before the wedding.', mr: 'आपण test server वर चालवतो, आणि लहान सुरुवात करतो: 10 fans, 30 सेकंद. लग्नाआधीच्या केटररच्या ट्रायल जेवणासारखं.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'ten fans. how cute. write your little script. i will be writing mine too.', mr: 'दहा fans. किती गोड. लिहा तुमची छोटी script. मीही माझी लिहितोय.' } },
      ],
      problem: { en: 'A load test is only as good as its script. Without a clear plan of what each fan does, how many fans, and for how long, the numbers mean nothing.', mr: 'Load test तिच्या script इतकीच चांगली असते. प्रत्येक fan काय करतो, किती fans, आणि किती वेळ, याचा स्पष्ट plan नसेल तर आकड्यांना अर्थ नाही.' },
      solution: { en: 'A k6 script has three parts: imports, an options object (how many VUs, how long), and a default function (what one fan does, again and again). k6 runs it and prints an end-of-test summary.', mr: 'k6 script चे तीन भाग असतात: imports, options object (किती VUs, किती वेळ), आणि default function (एक fan काय करतो, पुन्हा पुन्हा). k6 ती चालवतं आणि end-of-test summary छापतं.' },
    },
    lesson: [
      { en: 'Start with imports. import http from \'k6/http\' gives you http.get and http.post. import { sleep } from \'k6\' gives you the pause. k6 does not run in a browser, so there is no page and no clicking: each request goes straight to the API, like in the API console.', mr: 'imports ने सुरुवात करा. import http from \'k6/http\' मुळे http.get आणि http.post मिळतात. import { sleep } from \'k6\' मुळे थांबा मिळतो. k6 browser मध्ये चालत नाही, म्हणून page नाही आणि क्लिक नाही: प्रत्येक request थेट API कडे जाते, API console सारखी.' },
      { en: 'export default function () { ... } is what one virtual user does. k6 calls it again and again, as long as the test runs. One run of it is called an iteration. Inside, send a request with http.get(url) and then sleep(1): a real fan pauses to read before the next click.', mr: 'export default function () { ... } म्हणजे एक virtual user काय करतो. test चालू असेपर्यंत k6 तो पुन्हा पुन्हा चालवतं. त्याच्या एका फेरीला iteration म्हणतात. आत http.get(url) ने request पाठवा आणि मग sleep(1): खरा fan पुढच्या क्लिकआधी वाचायला थांबतो.' },
      { en: 'export const options = { vus: 10, duration: \'30s\' } sets the load: 10 VUs, each looping for 30 seconds. Durations are strings like \'30s\', \'2m\' or \'1m30s\'. In JMeter terms: options is the Thread Group (threads and duration), each http call is a Sampler.', mr: 'export const options = { vus: 10, duration: \'30s\' } load ठरवतं: 10 VUs, प्रत्येक 30 सेकंद फिरतो. durations म्हणजे \'30s\', \'2m\' किंवा \'1m30s\' सारख्या strings. JMeter च्या भाषेत: options म्हणजे Thread Group (threads आणि duration), प्रत्येक http call म्हणजे Sampler.' },
      { en: 'Press "Run load test" and k6 prints the summary (JMeter calls this a Listener report). Read it top to bottom: http_req_duration (response times: avg, med, p90, p95), http_req_failed (error rate), http_reqs (total requests and requests per second), iterations, vus. The last line says how long it ran and how many iterations finished. That is your first report to Rex.', mr: '"Run load test" दाबा आणि k6 summary छापतं (JMeter याला Listener report म्हणतं). वरून खाली वाचा: http_req_duration (response times: avg, med, p90, p95), http_req_failed (error rate), http_reqs (एकूण requests आणि दर सेकंदाच्या requests), iterations, vus. शेवटची ओळ सांगते test किती वेळ चालली आणि किती iterations पूर्ण झाल्या. हाच Rex ला तुमचा पहिला रिपोर्ट.' },
    ],
    syntax: {
      template: "import http from 'k6/http';\nimport { sleep } from 'k6';\n\nexport const options = {\n  vus: 10,\n  duration: '30s',\n};\n\nexport default function () {\n  http.get('https://api.stagedoor.test/events');\n  sleep(1);\n}",
      parts: [
        { code: "import http from 'k6/http'", means: { en: 'the HTTP client: http.get, http.post and friends', mr: 'HTTP client: http.get, http.post वगैरे' } },
        { code: "import { sleep } from 'k6'", means: { en: 'the pause between actions (think time)', mr: 'कृतींमधला थांबा (think time)' } },
        { code: 'export const options', means: { en: 'the load settings: how many VUs, for how long', mr: 'load ची settings: किती VUs, किती वेळ' } },
        { code: "vus: 10, duration: '30s'", means: { en: '10 virtual users, each looping for 30 seconds', mr: '10 virtual users, प्रत्येक 30 सेकंद फिरतो' } },
        { code: 'export default function ()', means: { en: 'what one VU does in one iteration, repeated until time is up', mr: 'एक VU एका iteration मध्ये काय करतो, वेळ संपेपर्यंत पुन्हा पुन्हा' } },
        { code: 'http.get(url)', means: { en: 'send one GET request and wait for the response', mr: 'एक GET request पाठवा आणि response ची वाट पाहा' } },
        { code: 'sleep(1)', means: { en: 'pause 1 second, like a fan reading the page', mr: '1 सेकंद थांबा, page वाचणाऱ्या fan सारखं' } },
      ],
      example: [
        { code: 'http_req_duration ...: avg=47.23ms min=25.66ms med=45.57ms max=93.15ms p(90)=63.26ms p(95)=67.59ms', note: { en: 'response times: 95% of event lists came back in under 68 ms', mr: 'response times: 95% events lists 68 ms खाली परत आल्या' } },
        { code: 'http_req_failed .....: 0.00%   ✓ 0        ✗ 290', note: { en: 'error rate: ✓ counts failed requests, so ✓ 0 is good news', mr: 'error rate: ✓ fail झालेल्या requests मोजतो, म्हणून ✓ 0 ही चांगली बातमी' } },
        { code: 'http_reqs ...........: 290    9.51/s', note: { en: '290 requests in all, about 9.5 per second: that is throughput', mr: 'एकूण 290 requests, दर सेकंदाला साधारण 9.5: हाच throughput' } },
        { code: 'iteration_duration ..: avg=1.05s', note: { en: 'one loop = the request (about 50 ms) + sleep(1)', mr: 'एक फेरी = request (साधारण 50 ms) + sleep(1)' } },
        { code: 'running (0m30.5s), 00/10 VUs, 290 complete and 0 interrupted iterations', note: { en: '10 fans, 30 seconds, 290 trips to the buffet', mr: '10 fans, 30 सेकंद, बुफेच्या 290 फेऱ्या' } },
      ],
      exampleNote: { en: 'http_req_failed reads backwards at first: its ✓ counts requests that DID fail. Read the percentage: 0.00% means no errors.', mr: 'http_req_failed सुरुवातीला उलटं वाटतं: त्याचा ✓ fail झालेल्या requests मोजतो. टक्केवारी वाचा: 0.00% म्हणजे एकही error नाही.' },
      pitfall: { en: 'Forgetting sleep(). Without it each VU fires requests as fast as the server answers, so 10 VUs act like hundreds of impatient fans. Your test then measures a crowd that will never exist.', mr: 'sleep() विसरणं. त्याशिवाय प्रत्येक VU server उत्तर देतो तितक्या वेगाने requests फेकतो, म्हणजे 10 VUs शेकडो अधीर fans सारखे वागतात. मग तुमची test कधीच न येणारी गर्दी मोजते.' },
    },
    practice: {
      intro: { en: 'The editor holds a real k6 script. Fill in each TODO, press "Run load test", watch the chart on the right, then Submit. The base URL is https://api.stagedoor.test.', mr: 'editor मध्ये खरी k6 script आहे. प्रत्येक TODO भरा, "Run load test" दाबा, उजवीकडचा chart पाहा, मग Submit करा. base URL आहे https://api.stagedoor.test.' },
      steps: [
        {
          kind: 'perf',
          prompt: { en: 'Rex has written everything except the request. Inside the default function, send a GET request to https://api.stagedoor.test/events, the list of upcoming shows.', mr: 'Rex ने request सोडून सगळं लिहिलं आहे. default function च्या आत https://api.stagedoor.test/events ला GET request पाठवा, येणाऱ्या shows ची यादी.' },
          starter: `import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  // TODO: send a GET request to https://api.stagedoor.test/events
  sleep(1);
}
`,
          solution: `import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  http.get('${B}/events');
  sleep(1);
}
`,
          mustUse: [{ pattern: 'http\\.get\\(', message: { en: 'Use http.get(...) to send the request.', mr: 'request पाठवायला http.get(...) वापरा.' } }],
          verify: [
            { check: (r) => r.http.count > 0, message: { en: 'No requests were sent. Add http.get(...) inside the default function.', mr: 'एकही request गेली नाही. default function च्या आत http.get(...) जोडा.' } },
            { check: (r) => hasUrl(Object.keys(r.byName), '/events'), message: { en: 'The request should go to https://api.stagedoor.test/events.', mr: 'request https://api.stagedoor.test/events कडे जायला हवी.' } },
          ],
          hints: [
            { en: 'The http object has a get function. It takes the full URL as a string.', mr: 'http object कडे get function आहे. ते पूर्ण URL string म्हणून घेतं.' },
            { en: 'Write it on the TODO line, before sleep(1). End the line with a semicolon.', mr: 'TODO च्या ओळीवर, sleep(1) आधी लिहा. ओळ semicolon ने संपवा.' },
            { en: "http.get('https://api.stagedoor.test/events');", mr: "http.get('https://api.stagedoor.test/events');" },
          ],
          successLine: { en: 'Your first load test! About 290 requests, p95 under 70 ms, 0% errors. StageDoor is calm at 10 fans.', mr: 'तुमची पहिली load test! साधारण 290 requests, p95 70 ms खाली, 0% errors. 10 fans वर StageDoor शांत आहे.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'This time the options are empty, so k6 runs just 1 VU for a single iteration. Set the load Rex asked for: 10 VUs for 30 seconds.', mr: 'या वेळी options रिकामे आहेत, म्हणून k6 फक्त 1 VU एकाच iteration साठी चालवतं. Rex ने मागितलेला load ठेवा: 10 VUs, 30 सेकंद.' },
          starter: `import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  // TODO: 10 virtual users for 30 seconds
};

export default function () {
  http.get('${B}/events');
  sleep(1);
}
`,
          solution: `import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  http.get('${B}/events');
  sleep(1);
}
`,
          verify: [
            { check: (r) => r.maxVUs >= 10, message: { en: 'The test should reach 10 VUs. Add vus: 10 to options.', mr: 'test 10 VUs पर्यंत पोहोचायला हवी. options मध्ये vus: 10 जोडा.' } },
            { check: (r) => r.durationS >= 30, message: { en: 'The test should run for at least 30 seconds. Add duration: \'30s\' to options.', mr: 'test किमान 30 सेकंद चालायला हवी. options मध्ये duration: \'30s\' जोडा.' } },
          ],
          hints: [
            { en: 'options needs two keys: one for the number of virtual users, one for the time.', mr: 'options ला दोन keys हव्यात: एक virtual users च्या संख्येसाठी, एक वेळेसाठी.' },
            { en: "The time is a string with a unit, like '30s'. Separate the two keys with a comma.", mr: "वेळ म्हणजे unit सह string, उदा. '30s'. दोन keys comma ने वेगळ्या करा." },
            { en: "vus: 10,\n  duration: '30s',", mr: "vus: 10,\n  duration: '30s'," },
          ],
          successLine: { en: 'Ten fans, thirty seconds. Watch the VUs line hold flat at 10 on the chart.', mr: 'दहा fans, तीस सेकंद. chart वर VUs ची रेषा 10 वर सपाट राहते ती पाहा.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Theo wrote this script and says "StageDoor handles 200 requests a second at 10 users!". Run it and look at http_reqs. Then make the VUs behave like real fans: add a 1 second pause after the request.', mr: 'Theo ने ही script लिहिली आणि म्हणतो "10 users वर StageDoor दर सेकंदाला 200 requests घेतो!". चालवा आणि http_reqs पाहा. मग VUs ना खऱ्या fans सारखं वागायला लावा: request नंतर 1 सेकंदाचा थांबा जोडा.' },
          starter: `import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  http.get('${B}/events');
  // TODO: a real fan pauses about 1 second here
}
`,
          solution: `import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  http.get('${B}/events');
  sleep(1);
}
`,
          verify: [
            { check: (r) => r.usedSleep, message: { en: 'Add sleep(1) after the request, so each VU pauses like a real fan.', mr: 'request नंतर sleep(1) जोडा, म्हणजे प्रत्येक VU खऱ्या fan सारखा थांबेल.' } },
            { check: (r) => r.http.rps < 20, message: { en: 'Still too many requests per second for 10 fans. Pause about 1 second in every iteration.', mr: '10 fans साठी दर सेकंदाला अजूनही खूप requests. प्रत्येक iteration मध्ये साधारण 1 सेकंद थांबा.' } },
          ],
          hints: [
            { en: 'sleep is already imported from \'k6\'. It takes seconds, not milliseconds.', mr: 'sleep आधीच \'k6\' मधून import केलेलं आहे. ते seconds घेतं, milliseconds नाही.' },
            { en: 'Put it on the TODO line, after http.get.', mr: 'ते TODO च्या ओळीवर, http.get नंतर लिहा.' },
            { en: 'sleep(1);', mr: 'sleep(1);' },
          ],
          successLine: { en: 'From about 200 requests a second down to about 10. Same 10 VUs: think time changes the load completely.', mr: 'दर सेकंदाला साधारण 200 requests वरून साधारण 10 वर. तेच 10 VUs: think time मुळे load पूर्ण बदलतो.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Rex wants your first report. Run this test and read the summary. Which sentence is correct?', mr: 'Rex ला तुमचा पहिला रिपोर्ट हवा आहे. ही test चालवा आणि summary वाचा. कोणतं वाक्य बरोबर आहे?' },
          perfSandbox: { code: `import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  http.get('${B}/events');
  sleep(1);
}
` },
          options: [
            { en: '10 requests were sent, one per VU', mr: '10 requests गेल्या, प्रत्येक VU ची एक' },
            { en: 'All 290 requests failed, because http_req_failed shows ✗ 290', mr: 'सगळ्या 290 requests fail झाल्या, कारण http_req_failed ✗ 290 दाखवतो' },
            { en: 'The average is 1.05 s, so the events list is slow', mr: 'सरासरी 1.05 s आहे, म्हणून events list हळू आहे' },
            { en: 'About 290 requests at about 9.5 per second, p95 under 70 ms, and 0% errors', mr: 'साधारण 290 requests, दर सेकंदाला साधारण 9.5, p95 70 ms खाली, आणि 0% errors' },
          ],
          correct: [3],
          explain: { en: 'http_reqs shows 290 and 9.51/s. http_req_duration p(95) is about 68 ms. http_req_failed is 0.00%: its ✗ 290 means 290 requests did not fail. The 1.05 s is iteration_duration, which includes the 1 second sleep.', mr: 'http_reqs मध्ये 290 आणि 9.51/s दिसतं. http_req_duration चा p(95) साधारण 68 ms आहे. http_req_failed 0.00% आहे: त्याचा ✗ 290 म्हणजे 290 requests fail झाल्या नाहीत. 1.05 s म्हणजे iteration_duration, ज्यात 1 सेकंदाचा sleep येतो.' },
          hints: [
            { en: 'Read three lines: http_reqs, http_req_duration and http_req_failed.', mr: 'तीन ओळी वाचा: http_reqs, http_req_duration आणि http_req_failed.' },
            { en: 'For http_req_failed, trust the percentage first.', mr: 'http_req_failed साठी आधी टक्केवारीवर विश्वास ठेवा.' },
            { en: '1.05 s is on the iteration_duration line. Does that include sleep?', mr: '1.05 s iteration_duration ओळीवर आहे. त्यात sleep येतो का?' },
          ],
          successLine: { en: 'Report sent: "10 VUs, 1 s think time, 30 s: /events p95 68 ms, 0% errors, 9.5 req/s." Rex nods.', mr: 'रिपोर्ट गेला: "10 VUs, 1 s think time, 30 s: /events p95 68 ms, 0% errors, 9.5 req/s." Rex मान डोलावतो.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'Now write one from scratch. Fans will hammer the seat map for Arijit Live in Pune: https://api.stagedoor.test/events/1/seats. Write a script with 20 VUs for 1 minute, each fan loading the seat map and pausing 1 second.', mr: 'आता एक पूर्ण नव्याने लिहा. Arijit Live in Pune चा seat map fans सतत उघडतील: https://api.stagedoor.test/events/1/seats. 20 VUs, 1 मिनिट, प्रत्येक fan seat map उघडतो आणि 1 सेकंद थांबतो, अशी script लिहा.' },
          starter: `// TODO: import http from k6/http, and sleep from k6

// TODO: options with 20 VUs for 1 minute

// TODO: the default function: GET the seat map of event 1, then sleep 1 second
`,
          solution: `import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '1m',
};

export default function () {
  http.get('${B}/events/1/seats');
  sleep(1);
}
`,
          verify: [
            { check: (r) => hasUrl(Object.keys(r.byName), '/events/1/seats'), message: { en: 'Send the GET request to https://api.stagedoor.test/events/1/seats.', mr: 'GET request https://api.stagedoor.test/events/1/seats ला पाठवा.' } },
            { check: (r) => r.maxVUs >= 20, message: { en: 'Use 20 VUs.', mr: '20 VUs वापरा.' } },
            { check: (r) => r.durationS >= 60, message: { en: "Run for 1 minute: duration: '1m'.", mr: "1 मिनिट चालवा: duration: '1m'." } },
            { check: (r) => r.usedSleep, message: { en: 'Add sleep(1) after the request.', mr: 'request नंतर sleep(1) जोडा.' } },
          ],
          hints: [
            { en: 'Same three parts as before: imports, export const options, export default function.', mr: 'आधीसारखेच तीन भाग: imports, export const options, export default function.' },
            { en: "One minute is written '1m'. The seat map path is /events/1/seats.", mr: "एक मिनिट '1m' असं लिहितात. seat map चा path /events/1/seats आहे." },
            { en: "Copy the script from step 1 and change three things: vus, duration and the URL.", mr: "पहिल्या step ची script कॉपी करा आणि तीन गोष्टी बदला: vus, duration आणि URL." },
            { en: "import http from 'k6/http';\nimport { sleep } from 'k6';\n\nexport const options = { vus: 20, duration: '1m' };\n\nexport default function () {\n  http.get('https://api.stagedoor.test/events/1/seats');\n  sleep(1);\n}", mr: "import http from 'k6/http';\nimport { sleep } from 'k6';\n\nexport const options = { vus: 20, duration: '1m' };\n\nexport default function () {\n  http.get('https://api.stagedoor.test/events/1/seats');\n  sleep(1);\n}" },
          ],
          successLine: { en: 'Written from scratch. The seat map is the heaviest page (a big database query): look at its p95 next to the events list from step 1.', mr: 'पूर्ण स्वतः लिहिली. seat map हे सगळ्यात जड page आहे (मोठी database query): त्याचा p95 पहिल्या step च्या events list शेजारी ठेवून पाहा.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does export default function () { ... } hold in a k6 script?', mr: 'k6 script मध्ये export default function () { ... } मध्ये काय असतं?' },
        options: [
          { en: 'The number of VUs', mr: 'VUs ची संख्या' },
          { en: 'What one virtual user does in one iteration; k6 repeats it until the test ends', mr: 'एक virtual user एका iteration मध्ये काय करतो; test संपेपर्यंत k6 ते पुन्हा पुन्हा चालवतं' },
          { en: 'The end-of-test summary', mr: 'end-of-test summary' },
          { en: 'Code that runs once before the test starts', mr: 'test सुरू होण्याआधी एकदाच चालणारा code' },
        ],
        answer: 1,
        explain: { en: 'The default function is the fan\'s journey. Each VU loops through it again and again for the whole duration.', mr: 'default function म्हणजे fan चा प्रवास. प्रत्येक VU संपूर्ण duration भर त्यातून पुन्हा पुन्हा फिरतो.' },
      },
      {
        q: { en: 'What load does this create?', mr: 'यामुळे कोणता load तयार होतो?' },
        code: "export const options = {\n  vus: 50,\n  duration: '2m',\n};",
        options: [
          { en: '50 requests in total', mr: 'एकूण 50 requests' },
          { en: '2 VUs for 50 minutes', mr: '2 VUs, 50 मिनिटं' },
          { en: '50 requests per second', mr: 'दर सेकंदाला 50 requests' },
          { en: '50 virtual users, each looping through the default function for 2 minutes', mr: '50 virtual users, प्रत्येक 2 मिनिटं default function मधून फिरतो' },
        ],
        answer: 3,
        explain: { en: 'vus is how many fans at once, duration is how long. The requests per second depend on what the function does and how long it sleeps.', mr: 'vus म्हणजे एकदम किती fans, duration म्हणजे किती वेळ. दर सेकंदाच्या requests function काय करतं आणि किती sleep करतं त्यावर ठरतात.' },
      },
      {
        q: { en: 'What does this summary line tell you?', mr: 'summary ची ही ओळ काय सांगते?' },
        code: 'http_reqs......................: 290    9.51/s',
        options: [
          { en: '290 requests were sent in all, about 9.5 per second (throughput)', mr: 'एकूण 290 requests गेल्या, दर सेकंदाला साधारण 9.5 (throughput)' },
          { en: '290 requests failed', mr: '290 requests fail झाल्या' },
          { en: 'Each request took 9.51 seconds', mr: 'प्रत्येक request ला 9.51 सेकंद लागले' },
          { en: '290 VUs were running', mr: '290 VUs चालू होते' },
        ],
        answer: 0,
        explain: { en: 'http_reqs is the count of requests, and the number with /s is the rate: the throughput.', mr: 'http_reqs म्हणजे requests ची संख्या, आणि /s असलेला आकडा म्हणजे दर: throughput.' },
      },
      {
        q: { en: '10 VUs send about 200 requests per second with this script. What is missing to make it realistic?', mr: 'या script ने 10 VUs दर सेकंदाला साधारण 200 requests पाठवतात. ती वास्तववादी करायला काय कमी आहे?' },
        code: "export default function () {\n  http.get('https://api.stagedoor.test/events');\n}",
        options: [
          { en: 'More VUs', mr: 'जास्त VUs' },
          { en: 'A longer URL', mr: 'मोठी URL' },
          { en: 'Think time: a sleep() after the request', mr: 'Think time: request नंतर sleep()' },
          { en: 'A browser', mr: 'browser' },
        ],
        answer: 2,
        explain: { en: 'Without sleep each VU fires the next request the moment the last one returns. Real fans pause, so add sleep(1).', mr: 'sleep शिवाय प्रत्येक VU मागची request परत येताच पुढची फेकतो. खरे fans थांबतात, म्हणून sleep(1) जोडा.' },
      },
    ],
    recap: { line: { en: 'Imports, options { vus, duration }, a default function with http.get and sleep. Then read http_req_duration, http_req_failed and http_reqs.', mr: 'Imports, options { vus, duration }, http.get आणि sleep असलेलं default function. मग http_req_duration, http_req_failed आणि http_reqs वाचा.' }, icon: '📝' },
  },

  // ───────────────────────── P1.2 Checks
  {
    id: 'pf1-2',
    code: 'P1.2',
    level: 'basic',
    title: { en: 'Checks: right answers, not only fast ones', mr: 'Checks: फक्त पटकन नाही, बरोबर उत्तरंही' },
    skill: 'k6 checks and the checks rate',
    realLife: {
      place: 'restaurant',
      title: { en: 'The fastest waiter in Camp', mr: 'कॅम्पमधला सगळ्यात फास्ट वेटर' },
      story: {
        en: 'At a busy Irani cafe in Camp, the new waiter is proud of his speed. Every plate reaches a table within two minutes. But table 4 ordered bun maska and got an omelette. Table 7 got their chai without sugar. The owner does not ask "how fast?" only. He asks "was it the right plate?". A fast wrong answer is still a wrong answer.',
        mr: 'कॅम्पमधल्या गर्दीच्या इराणी कॅफेमध्ये नवा वेटर स्वतःच्या वेगावर खूश आहे. प्रत्येक ताट दोन मिनिटांत टेबलवर पोहोचतं. पण टेबल 4 ने बन मस्का मागवला आणि त्यांना ऑम्लेट मिळालं. टेबल 7 ला साखरेशिवाय चहा मिळाला. मालक फक्त "किती पटकन?" असं विचारत नाहीत. ते विचारतात "ताट बरोबर होतं का?". पटकन आलेलं चुकीचं उत्तर तरीही चुकीचंच.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Served on time AND the right plate', mr: 'वेळेत आलं आणि ताट बरोबर' },
        items: [
          { icon: '🥯', label: 'Bun maska, 2 min', mr: 'बन मस्का, 2 मिनिटं', pass: true },
          { icon: '🍳', label: 'Omelette instead of bun maska', mr: 'बन मस्काऐवजी ऑम्लेट', pass: false },
          { icon: '☕', label: 'Chai, 1 min', mr: 'चहा, 1 मिनिट', pass: true },
          { icon: '🫖', label: 'Chai without sugar', mr: 'साखरेशिवाय चहा', pass: false },
          { icon: '🍪', label: 'Khari biscuit, 2 min', mr: 'खारी बिस्किट, 2 मिनिटं', pass: true },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'happy', text: { en: 'Checkout p95 is about 550 ms at 60 fans. Fast enough for Friday!', mr: '60 fans वर checkout p95 साधारण 550 ms आहे. शुक्रवारसाठी पुरेसं फास्ट!' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Fast at what? Last year the gateway answered quickly too. It answered with errors.', mr: 'कशात फास्ट? गेल्या वर्षीही gateway पटकनच उत्तर देत होता. errors चं उत्तर.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'a fast error is my best trick. your chart stays green, the fan gets nothing.', mr: 'पटकन येणारा error ही माझी सगळ्यात भारी युक्ती. तुमचा chart हिरवा राहतो, fan ला काहीच मिळत नाही.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'So every response gets checked, {name}, like the assertions in Playwright. Status, and what is inside the body.', mr: 'म्हणून प्रत्येक response तपासायचा, {name}, Playwright मधल्या assertions सारखा. Status, आणि body मध्ये काय आहे ते.' } },
      ],
      problem: { en: 'Response time alone says nothing about correctness. Under load a server can return errors, empty lists or half-made orders quickly, and the timing numbers still look good.', mr: 'फक्त response time बरोबरपणाबद्दल काहीच सांगत नाही. load खाली server पटकन errors, रिकाम्या याद्या किंवा अर्धवट orders देऊ शकतो, आणि वेळेचे आकडे तरीही छान दिसतात.' },
      solution: { en: 'k6 checks: small true or false tests on each response (status 200, the body has 6 events, the order says CONFIRMED). The summary shows the pass rate of each check, and a threshold on checks can fail the whole test.', mr: 'k6 checks: प्रत्येक response वर छोट्या true किंवा false चाचण्या (status 200, body मध्ये 6 events, order वर CONFIRMED). summary प्रत्येक check चा pass rate दाखवतो, आणि checks वरचा threshold संपूर्ण test fail करू शकतो.' },
    },
    lesson: [
      { en: 'import { check } from \'k6\'. Then check(res, { \'status is 200\': (r) => r.status === 200 }). The first argument is the response. The second is an object: each key is the name you will see in the summary, each value is a small function that returns true or false. In JMeter this is a Response Assertion.', mr: 'import { check } from \'k6\'. मग check(res, { \'status is 200\': (r) => r.status === 200 }). पहिला argument म्हणजे response. दुसरा एक object: प्रत्येक key म्हणजे summary मध्ये दिसणारं नाव, प्रत्येक value म्हणजे true किंवा false देणारं छोटं function. JMeter मध्ये याला Response Assertion म्हणतात.' },
      { en: 'Check the body too. res.json() turns the JSON body into a JavaScript value, so (r) => r.json().length === 6 checks the events list has 6 shows. res.json(\'status\') reads one field directly, like (r) => r.json(\'status\') === \'CONFIRMED\'. Put several checks in one object: status first, then the body.', mr: 'body सुद्धा तपासा. res.json() JSON body ला JavaScript value मध्ये बदलतं, म्हणून (r) => r.json().length === 6 events list मध्ये 6 shows आहेत का ते तपासतं. res.json(\'status\') एक field थेट वाचतं, उदा. (r) => r.json(\'status\') === \'CONFIRMED\'. एकाच object मध्ये अनेक checks ठेवा: आधी status, मग body.' },
      { en: 'A check is softer than a Playwright expect. A failing check does not stop the VU, and it does not fail the test by itself. k6 counts passes and fails. In the summary a check that always passed shows ✓ name. One that sometimes failed shows ✗ name, then a line like ↳ 76% — ✓ 1616 / ✗ 494. The checks line further down gives the rate for all checks together.', mr: 'Check हा Playwright च्या expect पेक्षा मवाळ असतो. fail होणारा check VU ला थांबवत नाही, आणि स्वतःहून test fail करत नाही. k6 pass आणि fail मोजतं. summary मध्ये नेहमी pass झालेला check ✓ name दाखवतो. कधी कधी fail झालेला ✗ name दाखवतो, आणि मग ↳ 76% — ✓ 1616 / ✗ 494 सारखी ओळ. खालची checks ओळ सगळ्या checks चा एकत्रित rate देते.' },
      { en: 'To make wrong answers fail the run, add a threshold: thresholds: { checks: [\'rate>0.99\'] } means "more than 99% of all checks must pass". Now a gateway that fails 1 order in 5 turns the run red, with ✗ next to checks and an ERRO line at the end. P1.4 goes deeper into thresholds.', mr: 'चुकीच्या उत्तरांनी run fail व्हावा म्हणून threshold जोडा: thresholds: { checks: [\'rate>0.99\'] } म्हणजे "सगळ्या checks पैकी 99% पेक्षा जास्त pass व्हायला हवेत". आता 5 पैकी 1 order fail करणारा gateway run लाल करतो, checks शेजारी ✗ आणि शेवटी ERRO ओळ. P1.4 मध्ये thresholds खोलात शिकू.' },
    ],
    syntax: {
      template: "import http from 'k6/http';\nimport { check, sleep } from 'k6';\n\nexport const options = {\n  vus: 10,\n  duration: '30s',\n  thresholds: { checks: ['rate>0.99'] },\n};\n\nexport default function () {\n  const res = http.get('https://api.stagedoor.test/events');\n  check(res, {\n    'status is 200': (r) => r.status === 200,\n    'has 6 events': (r) => r.json().length === 6,\n  });\n  sleep(1);\n}",
      parts: [
        { code: "import { check, sleep } from 'k6'", means: { en: 'check comes from the same k6 module as sleep', mr: 'check सुद्धा sleep च्याच k6 module मधून येतं' } },
        { code: 'const res = http.get(...)', means: { en: 'keep the response in a variable so you can check it', mr: 'response variable मध्ये ठेवा, म्हणजे तो तपासता येईल' } },
        { code: 'check(res, { ... })', means: { en: 'run every named test on this response and count pass or fail', mr: 'या response वर प्रत्येक नाव दिलेली चाचणी चालवा आणि pass किंवा fail मोजा' } },
        { code: "'status is 200': (r) => r.status === 200", means: { en: 'a name for the summary, and a function that returns true or false', mr: 'summary साठी नाव, आणि true किंवा false देणारं function' } },
        { code: 'r.json().length === 6', means: { en: 'read the JSON body and test what is inside', mr: 'JSON body वाचा आणि आत काय आहे ते तपासा' } },
        { code: "checks: ['rate>0.99']", means: { en: 'a threshold: more than 99% of checks must pass, or the test fails', mr: 'threshold: 99% पेक्षा जास्त checks pass व्हायला हवेत, नाहीतर test fail' } },
      ],
      example: [
        { code: '✓ status is 200', note: { en: 'passed every single time', mr: 'प्रत्येक वेळी pass' } },
        { code: '✗ order confirmed', note: { en: 'failed at least once during the sale', mr: 'विक्रीदरम्यान किमान एकदा fail' } },
        { code: '↳  76% — ✓ 1616 / ✗ 494', note: { en: '494 fans paid and got no confirmed order', mr: '494 fans नी पैसे भरले आणि confirm order मिळाली नाही' } },
        { code: '✗ checks .........................: 76.59%  ✓ 1616     ✗ 494', note: { en: 'all checks together, crossed against rate>0.99', mr: 'सगळे checks एकत्र, rate>0.99 विरुद्ध ओलांडलेले' } },
        { code: "ERRO[0063] thresholds on metrics 'checks' have been crossed", note: { en: 'the run fails: the CI pipeline would stop here', mr: 'run fail: CI pipeline इथे थांबली असती' } },
      ],
      pitfall: { en: 'A failing check alone does not fail the test. Without a checks threshold the run ends green even if every order failed. Always pair important checks with checks: [\'rate>0.99\'].', mr: 'फक्त fail होणारा check test fail करत नाही. checks threshold शिवाय प्रत्येक order fail झाली तरी run हिरवा संपतो. महत्त्वाच्या checks सोबत नेहमी checks: [\'rate>0.99\'] ठेवा.' },
    },
    practice: {
      intro: { en: 'Time to check the answers, not only the speed. Fill the TODOs, press "Run load test", read the checks at the top of the summary, then Submit.', mr: 'आता फक्त वेग नाही, उत्तरं तपासायची. TODOs भरा, "Run load test" दाबा, summary च्या वरचे checks वाचा, मग Submit करा.' },
      steps: [
        {
          kind: 'perf',
          prompt: { en: 'Add a check named \'status is 200\' that passes when the events list answers with status 200.', mr: 'events list ने status 200 दिल्यावर pass होणारा \'status is 200\' नावाचा check जोडा.' },
          starter: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('${B}/events');
  // TODO: check(res, { 'status is 200': ... })
  sleep(1);
}
`,
          solution: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('${B}/events');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
`,
          mustUse: [
            { pattern: 'check\\(\\s*res', message: { en: 'Call check(res, { ... }) on the response.', mr: 'response वर check(res, { ... }) call करा.' } },
            { pattern: '\\.status', message: { en: 'Your check should look at r.status.', mr: 'तुमच्या check ने r.status पाहायला हवं.' } },
          ],
          verify: [
            { check: (r) => r.checks.length >= 1, message: { en: 'No check ran. Add check(res, { ... }) after the request.', mr: 'एकही check चालला नाही. request नंतर check(res, { ... }) जोडा.' } },
            { check: (r) => r.checksRate === 1, message: { en: 'Your check failed on a healthy server. Test r.status === 200.', mr: 'निरोगी server वर तुमचा check fail झाला. r.status === 200 तपासा.' } },
          ],
          hints: [
            { en: 'The second argument is an object. The key is the name in quotes, the value is a function of r.', mr: 'दुसरा argument object आहे. key म्हणजे quotes मधलं नाव, value म्हणजे r चं function.' },
            { en: 'The function compares r.status with 200 using ===.', mr: 'function r.status ची 200 शी === ने तुलना करतं.' },
            { en: "check(res, { 'status is 200': (r) => r.status === 200 });", mr: "check(res, { 'status is 200': (r) => r.status === 200 });" },
          ],
          successLine: { en: '✓ status is 200 at the top of the summary, and checks at 100.00%.', mr: 'summary च्या वर ✓ status is 200, आणि checks 100.00%.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'A 200 with an empty list would still pass your first check. StageDoor has 6 upcoming shows. Add a second check, \'has 6 events\', that reads the JSON body and expects 6 items.', mr: 'रिकाम्या यादीसह 200 आला तरी तुमचा पहिला check pass होईल. StageDoor कडे 6 येणारे shows आहेत. दुसरा check जोडा, \'has 6 events\', जो JSON body वाचतो आणि 6 items अपेक्षित ठेवतो.' },
          starter: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('${B}/events');
  check(res, {
    'status is 200': (r) => r.status === 200,
    // TODO: 'has 6 events': the JSON body is a list of 6 shows
  });
  sleep(1);
}
`,
          solution: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('${B}/events');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has 6 events': (r) => r.json().length === 6,
  });
  sleep(1);
}
`,
          mustUse: [{ pattern: '\\.json\\(', message: { en: 'Read the body with r.json().', mr: 'body r.json() ने वाचा.' } }],
          verify: [
            { check: (r) => r.checks.length >= 2, message: { en: 'Add a second check to the same object, after the status check.', mr: 'त्याच object मध्ये status check नंतर दुसरा check जोडा.' } },
            { check: (r) => r.checksRate === 1, message: { en: 'A check failed on the healthy server. The events list has exactly 6 items: r.json().length === 6.', mr: 'निरोगी server वर एक check fail झाला. events list मध्ये बरोबर 6 items आहेत: r.json().length === 6.' } },
          ],
          hints: [
            { en: 'r.json() gives you the list. A list has a length.', mr: 'r.json() तुम्हाला यादी देतं. यादीला length असते.' },
            { en: 'Put a comma after the status check, then add the new key and function on the TODO line.', mr: 'status check नंतर comma ठेवा, मग TODO च्या ओळीवर नवी key आणि function जोडा.' },
            { en: "'has 6 events': (r) => r.json().length === 6,", mr: "'has 6 events': (r) => r.json().length === 6," },
          ],
          successLine: { en: 'Two ✓ lines. Now a fast empty list would get caught.', mr: 'दोन ✓ ओळी. आता पटकन आलेली रिकामी यादी पकडली जाईल.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Rex wrote a check that fails on purpose, to show you what it looks like. Arijit tickets start at ₹1499, and the script expects 999. Run it and read the summary. What happens?', mr: 'Rex ने मुद्दाम fail होणारा check लिहिला, तो कसा दिसतो ते दाखवायला. Arijit ची तिकीटं ₹1499 पासून सुरू होतात, आणि script 999 अपेक्षित ठेवते. चालवा आणि summary वाचा. काय होतं?' },
          perfSandbox: { code: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
};

export default function () {
  const res = http.get('${B}/events/1');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'price from 999': (r) => r.json('priceFrom') === 999,
  });
  sleep(1);
}
` },
          options: [
            { en: 'k6 stops at the first failed check', mr: 'पहिल्या fail झालेल्या check वर k6 थांबतं' },
            { en: '✗ price from 999 with ↳ 0%, the checks line shows 50%, and the run still ends with no ERRO line', mr: '✗ price from 999 आणि ↳ 0%, checks ओळ 50% दाखवते, आणि तरीही run ERRO ओळीशिवाय संपतो' },
            { en: 'Both checks show ✓', mr: 'दोन्ही checks ✓ दाखवतात' },
            { en: 'The requests fail, so http_req_failed is 100%', mr: 'requests fail होतात, म्हणून http_req_failed 100% आहे' },
          ],
          correct: [1],
          explain: { en: 'The price check fails every time (↳ 0% — ✓ 0 / ✗ 145), the status check passes every time, so checks is 50%. The requests themselves succeeded, so http_req_failed stays 0%. And there is no threshold, so nothing marks the run as failed. That is the trap.', mr: 'price check प्रत्येक वेळी fail होतो (↳ 0% — ✓ 0 / ✗ 145), status check प्रत्येक वेळी pass होतो, म्हणून checks 50%. requests स्वतः यशस्वी झाल्या, म्हणून http_req_failed 0% राहतो. आणि threshold नाही, म्हणून run fail झाला असं काहीच दाखवत नाही. हाच सापळा.' },
          hints: [
            { en: 'Read the lines with ✓ and ✗ at the very top of the summary.', mr: 'summary च्या अगदी वरच्या ✓ आणि ✗ असलेल्या ओळी वाचा.' },
            { en: 'Look at the very last lines too. Is there an ERRO line?', mr: 'अगदी शेवटच्या ओळीही पाहा. ERRO ओळ आहे का?' },
            { en: 'One of two checks fails every time. What is the overall rate?', mr: 'दोनपैकी एक check प्रत्येक वेळी fail होतो. एकूण rate किती?' },
          ],
          successLine: { en: 'Checks report. Thresholds judge. Next step: make the judge strict.', mr: 'Checks रिपोर्ट करतात. Thresholds निर्णय देतात. पुढचा step: निर्णय देणाऱ्याला कडक करा.' },
        },
        {
          kind: 'perf',
          prompt: { en: 'The 10 am sale for 60 fans, with a check that each order says CONFIRMED. Add a threshold so the test fails when 1% or more of the checks fail. After you pass, Rex replays it on Theo\'s payment build, which fails some orders under load. Your threshold must catch it.', mr: '60 fans साठी 10 ची विक्री, प्रत्येक order वर CONFIRMED आहे का ते पाहणाऱ्या check सह. असा threshold जोडा की 1% किंवा जास्त checks fail झाले तर test fail होईल. तुम्ही pass झाल्यावर Rex ती Theo च्या payment build वर पुन्हा चालवतो, जो load खाली काही orders fail करतो. तुमच्या threshold ने तो पकडायलाच हवा.' },
          starter: saleFlow('    // TODO: more than 99% of checks must pass'),
          solution: saleFlow("    checks: ['rate>0.99'],"),
          requireThresholds: true,
          mustUse: [{ pattern: "checks['\"]?\\s*:\\s*\\[", message: { en: "Put the threshold on the checks metric: checks: ['rate>0.99'].", mr: "threshold checks metric वर ठेवा: checks: ['rate>0.99']." } }],
          mustCatch: [{ bug: 'errors-under-load', label: { en: 'Payment gateway fails 1 in 4 checkouts under load', mr: 'load खाली payment gateway 4 पैकी 1 checkout fail करतो' } }],
          hints: [
            { en: 'The threshold goes inside thresholds: { }, with the metric name as the key and a list of rules as the value.', mr: 'threshold thresholds: { } च्या आत जातो, metric चं नाव key आणि नियमांची list value.' },
            { en: "The metric is checks. The rule is a string: 'rate>0.99'.", mr: "metric checks आहे. नियम एक string आहे: 'rate>0.99'." },
            { en: "checks: ['rate>0.99'],", mr: "checks: ['rate>0.99']," },
          ],
          successLine: { en: 'Green on the healthy build, red on Theo\'s: ✗ order confirmed at about 82%. Theo has a bug to fix before Friday.', mr: 'निरोगी build वर हिरवा, Theo च्या build वर लाल: ✗ order confirmed साधारण 82%. शुक्रवारआधी Theo ला एक bug दुरुस्त करायचा आहे.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'A check fails for 10% of iterations and the script has no thresholds. What happens?', mr: '10% iterations मध्ये एक check fail होतो आणि script मध्ये thresholds नाहीत. काय होतं?' },
        options: [
          { en: 'k6 stops the test at the first failure', mr: 'पहिल्या failure ला k6 test थांबवतं' },
          { en: 'The VU that failed is removed', mr: 'fail झालेला VU काढून टाकला जातो' },
          { en: 'The summary shows ✗ with 90%, and the run still does not fail', mr: 'summary ✗ आणि 90% दाखवतो, आणि तरीही run fail होत नाही' },
          { en: 'The response time doubles', mr: 'response time दुप्पट होतो' },
        ],
        answer: 2,
        explain: { en: 'Checks only count. To fail the run you need a threshold such as checks: [\'rate>0.99\'].', mr: 'Checks फक्त मोजतात. run fail करायला checks: [\'rate>0.99\'] सारखा threshold हवा.' },
      },
      {
        q: { en: 'What does this part of the summary mean?', mr: 'summary च्या या भागाचा अर्थ काय?' },
        code: '✗ has 6 events\n ↳  90% — ✓ 270 / ✗ 30',
        options: [
          { en: 'The check passed 270 times and failed 30 times', mr: 'check 270 वेळा pass आणि 30 वेळा fail झाला' },
          { en: '90% of requests were slow', mr: '90% requests हळू होत्या' },
          { en: 'There are 270 events', mr: '270 events आहेत' },
          { en: 'The check never ran', mr: 'check कधीच चालला नाही' },
        ],
        answer: 0,
        explain: { en: '✗ means it failed at least once. 270 passes and 30 fails is 90%. Some responses had a wrong number of events.', mr: '✗ म्हणजे तो किमान एकदा fail झाला. 270 pass आणि 30 fail म्हणजे 90%. काही responses मध्ये events ची संख्या चुकीची होती.' },
      },
      {
        q: { en: 'Which threshold fails the test when more than 1% of checks fail?', mr: '1% पेक्षा जास्त checks fail झाले तर कोणता threshold test fail करतो?' },
        options: [
          { en: "http_req_duration: ['p(95)<500']", mr: "http_req_duration: ['p(95)<500']" },
          { en: "http_reqs: ['count>100']", mr: "http_reqs: ['count>100']" },
          { en: "checks: ['rate<0.01']", mr: "checks: ['rate<0.01']" },
          { en: "checks: ['rate>0.99']", mr: "checks: ['rate>0.99']" },
        ],
        answer: 3,
        explain: { en: 'The checks rate is the share that PASSED, so you want it above 0.99. rate<0.01 would demand that almost every check fails.', mr: 'checks rate म्हणजे pass झालेल्यांचं प्रमाण, म्हणून ते 0.99 पेक्षा जास्त हवं. rate<0.01 म्हणजे जवळपास प्रत्येक check fail व्हायला हवा.' },
      },
      {
        q: { en: 'In JMeter, which element does the same job as a k6 check?', mr: 'JMeter मध्ये कोणता element k6 check चंच काम करतो?' },
        options: [
          { en: 'Thread Group', mr: 'Thread Group' },
          { en: 'Response Assertion', mr: 'Response Assertion' },
          { en: 'CSV Data Set Config', mr: 'CSV Data Set Config' },
          { en: 'Constant Timer', mr: 'Constant Timer' },
        ],
        answer: 1,
        explain: { en: 'A Response Assertion tests the status or body of each response. Thread Group is the VUs, CSV Data Set Config feeds test data, a timer is think time.', mr: 'Response Assertion प्रत्येक response चा status किंवा body तपासतो. Thread Group म्हणजे VUs, CSV Data Set Config test data देतो, timer म्हणजे think time.' },
      },
    ],
    recap: { line: { en: 'check(res, { name: (r) => ... }) tests status and body; ✗ shows the pass %. Add checks: [\'rate>0.99\'] so wrong answers fail the run.', mr: 'check(res, { name: (r) => ... }) status आणि body तपासतो; ✗ pass % दाखवतो. checks: [\'rate>0.99\'] जोडा म्हणजे चुकीची उत्तरं run fail करतील.' }, icon: '✅' },
  },
]
