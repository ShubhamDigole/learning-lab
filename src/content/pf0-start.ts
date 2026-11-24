import type { Lesson } from './types.ts'

// Performance 0: what performance testing is, and how to read the numbers. No coding yet: the learner runs
// prepared k6 tests against StageDoor and reads the chart and the summary.

const B = 'https://api.stagedoor.test'

// The flash-sale journey one fan makes: log in, look at seats, think, add to cart, pay, think.
const flow = (options: string) => `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = ${options};

export default function () {
  const n = String((__VU % 200) + 1).padStart(3, '0');
  const login = http.post('${B}/auth/login',
    JSON.stringify({ username: 'fan' + n, password: 'pass' + n }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } });
  const auth = { headers: { Authorization: 'Bearer ' + login.json('token'), 'Content-Type': 'application/json' } };

  http.get('${B}/events/1/seats', { tags: { name: 'seats' } });
  sleep(1);

  const cart = http.post('${B}/cart', JSON.stringify({ eventId: 1, quantity: 2 }), { ...auth, tags: { name: 'cart' } });
  const res = http.post('${B}/checkout', JSON.stringify({ cartId: cart.json('cartId') }), { ...auth, tags: { name: 'checkout' } });
  check(res, { 'order confirmed': (r) => r.status === 200 });
  sleep(1);
}
`

export const pfStartLessons: Lesson[] = [
  // ───────────────────────── P0.1 What performance testing is
  {
    id: 'pf0-1',
    code: 'P0.1',
    level: 'basic',
    title: { en: 'What performance testing is', mr: 'Performance testing म्हणजे काय' },
    skill: 'Load, stress, spike and soak tests',
    realLife: {
      place: 'station',
      title: { en: 'Tatkal at 10 am', mr: 'सकाळी 10 चं Tatkal' },
      story: {
        en: 'At 9:55 Meera\'s father opens the railway site to book a Tatkal ticket to Nagpur. The site is quick: he searches, picks the train, fills the names. Then the clock turns 10:00, and lakhs of people press "Book" in the same minute. The page spins. Then it shows an error. His money is cut, the ticket is not booked, and the refund takes a week. The site was never broken for one person. It broke for everyone at once.',
        mr: '9:55 ला मीराचे बाबा नागपूरचं Tatkal तिकीट काढायला रेल्वेची साइट उघडतात. साइट पटकन चालते: ते शोधतात, गाडी निवडतात, नावं भरतात. मग घड्याळात 10:00 वाजतात, आणि त्याच मिनिटाला लाखो लोक "Book" दाबतात. पान फिरत राहतं. मग error दाखवतं. पैसे कापले जातात, तिकीट मिळत नाही, आणि refund ला आठवडा लागतो. एका माणसासाठी साइट कधीच बिघडली नव्हती. सगळ्यांसाठी एकदम बिघडली.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🧍', label: '9:55 one user: fast', mr: '9:55 एक user: पटकन' },
          { icon: '👥', label: '10:00 a thousand users: slower', mr: '10:00 हजार users: हळू' },
          { icon: '🌊', label: '10:01 lakhs of users: errors', mr: '10:01 लाखो users: errors' },
          { icon: '🎫', label: 'Ticket booked', mr: 'तिकीट बुक' },
        ],
        breakAt: 2,
        breakNote: { en: 'Fine for one person, broken for the crowd.', mr: 'एकासाठी ठीक, गर्दीसाठी बिघडलेली.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'happy', text: { en: 'Arijit Live in Pune goes on sale Friday at 10 am. This year it will be flawless. I clicked through checkout myself. Super fast!', mr: 'Arijit Live in Pune ची विक्री शुक्रवारी सकाळी 10 ला सुरू होते. यंदा सगळं परफेक्ट होणार. मी स्वतः checkout करून पाहिलं. एकदम फास्ट!' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Last year it was fast for you too, Sam. Then 40,000 fans arrived and it crashed in four minutes. People were charged and got no tickets.', mr: 'गेल्या वर्षीही तुझ्यासाठी फास्टच होतं, Sam. मग 40,000 fans आले आणि चार मिनिटांत सगळं कोसळलं. लोकांचे पैसे गेले आणि तिकीटं मिळाली नाहीत.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'one user is a test. forty thousand users is a party. and i am bringing the whole crowd at 10:00:00.', mr: 'एक user म्हणजे test. चाळीस हजार users म्हणजे पार्टी. आणि मी 10:00:00 ला सगळी गर्दी घेऊन येतोय.' } },
        { who: 'meera', mood: 'neutral', text: { en: '{name}, this is a new kind of testing. We will not ask "does it work?". We will ask "does it still work when everyone comes at once?". Rex will show us k6.', mr: '{name}, हा testing चा नवा प्रकार आहे. आपण "चालतं का?" असं विचारणार नाही. आपण विचारणार "सगळे एकदम आले तरी चालतं का?". Rex आपल्याला k6 दाखवेल.' } },
      ],
      problem: { en: 'Every functional test passed, and the site still crashed on sale day. Clicking through as one user can never show what happens when thousands of fans press "Pay" in the same minute.', mr: 'प्रत्येक functional test pass झाली, तरीही विक्रीच्या दिवशी साइट कोसळली. एक user म्हणून क्लिक करून कधीच कळत नाही की हजारो fans एकाच मिनिटात "Pay" दाबतात तेव्हा काय होतं.' },
      solution: { en: 'Performance testing: a tool like k6 plays thousands of virtual users at once, measures response time, throughput and error rate, and shows where the site slows down or breaks, before the real fans arrive.', mr: 'Performance testing: k6 सारखं tool हजारो virtual users एकदम चालवतं, response time, throughput आणि error rate मोजतं, आणि साइट कुठे हळू होते किंवा मोडते ते दाखवतं, खरे fans येण्याआधीच.' },
    },
    lesson: [
      { en: 'Functional testing asks "is the answer right?". Performance testing asks "is it still right, and fast, when many people ask at the same time?". A server has limited workers, database connections and payment lines. One user never fills them. A crowd does, and then everyone waits in a queue.', mr: 'Functional testing विचारतं "उत्तर बरोबर आहे का?". Performance testing विचारतं "खूप लोकांनी एकाच वेळी विचारलं तरी उत्तर बरोबर आणि पटकन येतं का?". server कडे मर्यादित workers, database connections आणि payment लाइन्स असतात. एक user त्या कधीच भरत नाही. गर्दी भरते, आणि मग सगळे रांगेत थांबतात.' },
      { en: 'Four kinds of tests, four questions. A load test runs the traffic you expect (the 10 am sale with 100 fans at once in our lab) and checks the goal is met. A stress test keeps adding users past that, to find the breaking point. A spike test throws a sudden jump of users at the site, like 10:00:00 sharp. A soak test runs normal load for hours, to catch slow problems like a memory leak.', mr: 'चार प्रकारच्या tests, चार प्रश्न. Load test अपेक्षित traffic चालवते (आपल्या lab मध्ये 10 च्या विक्रीला एकदम 100 fans) आणि ध्येय पूर्ण होतं का ते पाहते. Stress test त्यापलीकडे users वाढवत राहते, मोडण्याचा बिंदू शोधायला. Spike test अचानक users ची उडी साइटवर फेकते, अगदी 10:00:00 सारखी. Soak test तासन्तास नेहमीचा load चालवते, memory leak सारख्या हळूहळू येणाऱ्या समस्या पकडायला.' },
      { en: 'Four numbers tell the story. Response time: how long one request takes, in milliseconds. Throughput: how many requests the server finishes per second. Error rate: what share of requests failed. Concurrent users: how many are active at the same moment (in k6 they are VUs, virtual users). When the site is healthy, more users means more throughput. When it is full, throughput stops growing and response time climbs. That bend is the bottleneck.', mr: 'चार आकडे गोष्ट सांगतात. Response time: एका request ला किती वेळ लागतो, milliseconds मध्ये. Throughput: server दर सेकंदाला किती requests पूर्ण करतो. Error rate: किती टक्के requests fail झाल्या. Concurrent users: एकाच क्षणी किती users सक्रिय आहेत (k6 मध्ये त्यांना VUs, virtual users म्हणतात). साइट निरोगी असेल तर जास्त users म्हणजे जास्त throughput. ती भरली की throughput वाढायचं थांबतं आणि response time वाढत जातो. तो वळणबिंदू म्हणजे bottleneck.' },
      { en: 'Who asks for it, and when? Product managers before a big launch or sale, ops teams before Diwali or a cricket final, and clients whose contract promises a response time (an SLA). Testers run it before release and after big changes. In job posts you will also see JMeter: same ideas, different tool. A JMeter Thread Group is k6\'s VUs, a Sampler is a request, a Listener is the report.', mr: 'कोण मागतं, आणि कधी? मोठ्या launch किंवा sale आधी product managers, दिवाळी किंवा क्रिकेट फायनलआधी ops टीम, आणि ज्यांच्या contract मध्ये response time चं वचन (SLA) आहे ते clients. टेस्टर्स ती release आधी आणि मोठ्या बदलांनंतर चालवतात. नोकरीच्या जाहिरातींमध्ये JMeter सुद्धा दिसेल: कल्पना त्याच, tool वेगळं. JMeter चा Thread Group म्हणजे k6 चे VUs, Sampler म्हणजे request, Listener म्हणजे report.' },
    ],
    syntaxPlain: true,
    syntax: {
      template: 'Load test   expected traffic        → does it meet the goal?\nStress test more and more users       → where does it break?\nSpike test  a sudden jump of users    → does it survive 10:00:00?\nSoak test   normal load for hours     → does it get worse over time?',
      parts: [
        { code: 'VU (virtual user)', means: { en: 'one simulated fan running the script again and again', mr: 'एक simulated fan, जो script पुन्हा पुन्हा चालवतो' } },
        { code: 'response time', means: { en: 'how long one request took, in ms (1000 ms = 1 second)', mr: 'एका request ला लागलेला वेळ, ms मध्ये (1000 ms = 1 सेकंद)' } },
        { code: 'throughput', means: { en: 'requests finished per second (k6 prints it next to http_reqs as /s)', mr: 'दर सेकंदाला पूर्ण झालेल्या requests (k6 ते http_reqs शेजारी /s म्हणून दाखवतं)' } },
        { code: 'error rate', means: { en: 'share of failed requests (k6 calls it http_req_failed)', mr: 'fail झालेल्या requests चं प्रमाण (k6 त्याला http_req_failed म्हणतं)' } },
        { code: 'bottleneck', means: { en: 'the one part that fills up first and makes everyone wait', mr: 'जो भाग सगळ्यात आधी भरतो आणि सगळ्यांना थांबवतो' } },
      ],
      example: [
        { code: 'Load test:   100 fans buy tickets for 3 minutes', note: { en: 'Friday 10 am, the expected rush', mr: 'शुक्रवार सकाळी 10, अपेक्षित गर्दी' } },
        { code: 'Stress test: 100 → 800 fans, step by step', note: { en: 'how far can StageDoor go before it bends?', mr: 'StageDoor वाकण्याआधी किती पुढे जाऊ शकतो?' } },
        { code: 'Spike test:  10 → 600 fans in 10 seconds', note: { en: 'the gremlin\'s crowd at 10:00:00', mr: '10:00:00 ला gremlin ची गर्दी' } },
        { code: 'Soak test:   40 fans for 2 hours', note: { en: 'does a memory leak slowly choke the server?', mr: 'memory leak हळूहळू server चा गळा दाबतो का?' } },
        { code: 'Report:      checkout p95 470 ms, 0% errors at 100 VUs', note: { en: 'numbers a developer can act on', mr: 'developer ज्यावर काम करू शकेल असे आकडे' } },
      ],
      pitfall: { en: '"No errors" does not mean "fine". A site that answers every request in 4 seconds has a 0% error rate and still loses the fans. Always read response time and errors together.', mr: '"errors नाहीत" म्हणजे "सगळं ठीक" असं नाही. प्रत्येक request ला 4 सेकंदांनी उत्तर देणाऱ्या साइटचा error rate 0% असतो, तरी fans निघून जातात. response time आणि errors नेहमी एकत्र वाचा.' },
    },
    practice: {
      intro: { en: 'No coding today. Rex has prepared some k6 tests. Press "Run load test", watch the live chart on the right, then read the summary and the "By endpoint" tab under it.', mr: 'आज coding नाही. Rex ने काही k6 tests तयार ठेवल्या आहेत. "Run load test" दाबा, उजवीकडचा live chart पाहा, मग त्याखालचा summary आणि "By endpoint" tab वाचा.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'First, Sam\'s view: one fan (1 VU) buying tickets for 30 seconds. Run it and open "By endpoint". About how long does checkout take for one fan?', mr: 'आधी Sam ची नजर: एक fan (1 VU) 30 सेकंद तिकीटं घेतोय. चालवा आणि "By endpoint" उघडा. एका fan साठी checkout ला साधारण किती वेळ लागतो?' },
          perfSandbox: { code: flow(`{ vus: 1, duration: '30s' }`) },
          options: [
            { en: 'About 30 ms', mr: 'साधारण 30 ms' },
            { en: 'About 3 seconds', mr: 'साधारण 3 सेकंद' },
            { en: 'About 300 ms, with no errors', mr: 'साधारण 300 ms, एकही error नाही' },
            { en: 'It times out', mr: 'timeout होतो' },
          ],
          correct: [2],
          explain: { en: 'Checkout takes around 280 to 350 ms for one fan, and every order is confirmed. Sam is right that it is fast for one person. That is exactly what last year\'s team saw too.', mr: 'एका fan साठी checkout ला साधारण 280 ते 350 ms लागतात, आणि प्रत्येक order confirm होते. एका माणसासाठी फास्ट आहे, हे Sam चं बरोबर आहे. गेल्या वर्षीच्या टीमलाही नेमकं हेच दिसलं होतं.' },
          hints: [
            { en: 'Press "Run load test", then open the "By endpoint" tab.', mr: '"Run load test" दाबा, मग "By endpoint" tab उघडा.' },
            { en: 'Find the row named checkout and read its avg and p95.', mr: 'checkout नावाची ओळ शोधा आणि तिचे avg आणि p95 वाचा.' },
            { en: 'Both are a few hundred milliseconds, well under a second.', mr: 'दोन्ही काहीशे milliseconds आहेत, एका सेकंदापेक्षा खूप कमी.' },
          ],
          successLine: { en: 'One fan, happy. Now let us invite the crowd.', mr: 'एक fan, खूश. आता गर्दीला बोलावूया.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'A stress test: fans keep arriving on the seat map until there are 800 at once. Run it and watch the chart. What happens as the VUs climb?', mr: 'एक stress test: seat map वर fans येत राहतात, एकदम 800 होईपर्यंत. चालवा आणि chart पाहा. VUs वाढतात तसं काय होतं?' },
          perfSandbox: { code: `import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 800 },
    { duration: '30s', target: 800 },
  ],
};

export default function () {
  http.get('${B}/events/1/seats');
  sleep(0.5);
}
` },
          options: [
            { en: 'Nothing changes: the response time stays flat', mr: 'काहीच बदलत नाही: response time सपाट राहतो' },
            { en: 'The response time climbs from under 100 ms to over 3 seconds, while errors stay at zero', mr: 'response time 100 ms खालून 3 सेकंदांपेक्षा जास्त वाढतो, आणि errors शून्यच राहतात' },
            { en: 'The server crashes at 50 VUs', mr: '50 VUs ला server कोसळतो' },
            { en: 'The response time gets faster with more users', mr: 'जास्त users आले की response time कमी होतो' },
          ],
          correct: [1],
          explain: { en: 'Up to about 130 VUs the server keeps up. After that every worker is busy, requests queue, and p95 climbs past 3 seconds. Nothing fails, so a "no errors" report would look fine. A fan waiting 3 seconds for a seat map does not think it is fine.', mr: 'साधारण 130 VUs पर्यंत server ला झेपतं. त्यानंतर प्रत्येक worker व्यस्त असतो, requests रांगेत थांबतात, आणि p95 3 सेकंदांच्या पुढे जातो. काहीच fail होत नाही, म्हणून "errors नाहीत" असा रिपोर्ट ठीक वाटला असता. seat map साठी 3 सेकंद थांबणाऱ्या fan ला ते ठीक वाटत नाही.' },
          hints: [
            { en: 'Watch the VUs line and the p95 line on the chart together.', mr: 'chart वरची VUs ची रेषा आणि p95 ची रेषा एकत्र पाहा.' },
            { en: 'Check the errors line too. Does it ever leave zero?', mr: 'errors ची रेषाही पाहा. ती कधी शून्यावरून हलते का?' },
            { en: 'Read http_req_duration in the summary: look at p(95).', mr: 'summary मधलं http_req_duration वाचा: p(95) पाहा.' },
          ],
          successLine: { en: 'Slow is the first kind of broken. You found the bend.', mr: 'हळू होणं हा बिघाडाचा पहिला प्रकार. तुम्ही वळणबिंदू शोधला.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Theo\'s new build has a payment change. Rex runs the 10 am sale with 100 fans for a minute. Run it, then read the checks and the "By endpoint" tab. What is going wrong?', mr: 'Theo च्या नव्या build मध्ये payment चा बदल आहे. Rex 100 fans सह 10 ची विक्री एक मिनिट चालवतो. चालवा, मग checks आणि "By endpoint" tab वाचा. काय चुकतंय?' },
          perfSandbox: { code: flow(`{ vus: 100, duration: '1m' }`), build: ['errors-under-load'] },
          options: [
            { en: 'Login fails for everyone', mr: 'सगळ्यांचा login fail होतो' },
            { en: 'The seat map returns 404', mr: 'seat map 404 देतो' },
            { en: 'Nothing, every order is confirmed', mr: 'काहीच नाही, प्रत्येक order confirm होते' },
            { en: 'About 1 in 4 checkouts fails, while login, seats and cart are fine', mr: 'साधारण 4 पैकी 1 checkout fail होतो, आणि login, seats आणि cart ठीक आहेत' },
          ],
          correct: [3],
          explain: { en: '"order confirmed" shows ✗ with about 76%, and in "By endpoint" only checkout has failures. Overall http_req_failed is about 6%, which hides that a quarter of buyers lost their order. This bug only appears under load: with one fan it never shows.', mr: '"order confirmed" समोर ✗ आणि साधारण 76% दिसतं, आणि "By endpoint" मध्ये फक्त checkout ला failures आहेत. एकूण http_req_failed साधारण 6% आहे, त्यामुळे लपतं की एक चतुर्थांश खरेदीदारांची order गेली. हा bug फक्त load खाली दिसतो: एका fan सह तो कधीच दिसत नाही.' },
          hints: [
            { en: 'Look at the top of the summary: the check "order confirmed". What percentage passed?', mr: 'summary च्या वर पाहा: "order confirmed" हा check. किती टक्के pass झाले?' },
            { en: 'In "By endpoint", which row has a non-zero failed count?', mr: '"By endpoint" मध्ये कोणत्या ओळीत failed संख्या शून्य नाही?' },
            { en: '76% passed means about 24% failed: roughly 1 in 4.', mr: '76% pass म्हणजे साधारण 24% fail: जवळपास 4 पैकी 1.' },
          ],
          successLine: { en: 'Exactly last year\'s pain: charged, no ticket. Now Theo knows where to look.', mr: 'नेमकं गेल्या वर्षीचं दुःख: पैसे गेले, तिकीट नाही. आता Theo ला कुठे पाहायचं ते कळलं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Match the question to the test. Sam asks: "Next month we run a 6-hour Diwali offer. Will the site still be quick in hour five?" Which test answers that?', mr: 'प्रश्नाला test जोडा. Sam विचारतो: "पुढच्या महिन्यात आपण 6 तासांची दिवाळी ऑफर चालवतोय. पाचव्या तासातही साइट पटकन चालेल का?" कोणती test याचं उत्तर देते?' },
          options: [
            { en: 'A soak test: normal load for hours', mr: 'Soak test: तासन्तास नेहमीचा load' },
            { en: 'A spike test: a sudden jump of users', mr: 'Spike test: users ची अचानक उडी' },
            { en: 'A stress test: users until it breaks', mr: 'Stress test: मोडेपर्यंत users' },
            { en: 'A functional test with one user', mr: 'एका user सह functional test' },
          ],
          correct: [0],
          explain: { en: 'Sam is asking about time. Slow leaks only show after hours of steady load, so you run a soak test. You will write one in P2.', mr: 'Sam वेळेबद्दल विचारतोय. हळू leaks तासन्तास सतत load नंतरच दिसतात, म्हणून soak test चालवायची. तुम्ही P2 मध्ये अशी test लिहाल.' },
          hints: [
            { en: 'Is Sam worried about how many users, or about how long?', mr: 'Sam ला किती users ची काळजी आहे, की किती वेळाची?' },
            { en: 'Which test runs normal load for a long time?', mr: 'कोणती test नेहमीचा load खूप वेळ चालवते?' },
          ],
        },
      ],
    },
    exam: [
      {
        q: { en: 'Checkout works perfectly when you click through it alone. Why is that not enough before a flash sale?', mr: 'एकटे क्लिक करताना checkout परफेक्ट चालतो. flash sale आधी एवढं पुरेसं का नाही?' },
        options: [
          { en: 'Because one user cannot fill the server\'s workers and payment lines, so queues and errors under a crowd stay hidden', mr: 'कारण एक user server चे workers आणि payment लाइन्स भरू शकत नाही, त्यामुळे गर्दीतल्या रांगा आणि errors लपून राहतात' },
          { en: 'Because the browser was too fast', mr: 'कारण browser खूप फास्ट होता' },
          { en: 'Because functional tests are always wrong', mr: 'कारण functional tests नेहमी चुकीच्या असतात' },
          { en: 'It is enough: if it works once, it works for everyone', mr: 'पुरेसं आहे: एकदा चाललं की सगळ्यांसाठी चालतं' },
        ],
        answer: 0,
        explain: { en: 'Limits like 24 web workers or 12 payment connections only matter when many requests arrive together. Only a load test fills them.', mr: '24 web workers किंवा 12 payment connections सारख्या मर्यादा खूप requests एकत्र आल्यावरच महत्त्वाच्या ठरतात. फक्त load test त्या भरते.' },
      },
      {
        q: { en: 'You want to find out how many users StageDoor can take before it bends. Which test?', mr: 'StageDoor वाकण्याआधी किती users घेऊ शकतो ते शोधायचं आहे. कोणती test?' },
        options: [
          { en: 'Soak test', mr: 'Soak test' },
          { en: 'Smoke test with 1 user', mr: '1 user सह smoke test' },
          { en: 'Stress test', mr: 'Stress test' },
          { en: 'Spike test', mr: 'Spike test' },
        ],
        answer: 2,
        explain: { en: 'A stress test keeps adding users past the expected load until response time or errors go bad. That is the breaking point.', mr: 'Stress test अपेक्षित load च्या पलीकडे users वाढवत राहते, response time किंवा errors बिघडेपर्यंत. तोच मोडण्याचा बिंदू.' },
      },
      {
        q: { en: 'In a stress test, throughput stays at about 215 requests per second from 200 VUs to 800 VUs, while response time keeps climbing. What does that mean?', mr: 'एका stress test मध्ये 200 VUs पासून 800 VUs पर्यंत throughput साधारण 215 requests per second वरच राहतो, आणि response time वाढत राहतो. याचा अर्थ काय?' },
        options: [
          { en: 'k6 is broken', mr: 'k6 बिघडलं आहे' },
          { en: 'The server is full: extra users only wait in the queue', mr: 'server भरला आहे: जास्तीचे users फक्त रांगेत थांबतात' },
          { en: 'The server got faster', mr: 'server फास्ट झाला' },
          { en: 'Everything is fine because there are no errors', mr: 'errors नाहीत म्हणून सगळं ठीक आहे' },
        ],
        answer: 1,
        explain: { en: 'Flat throughput plus rising response time is the sign of a bottleneck. The server finishes the same work per second, so new users just queue.', mr: 'सपाट throughput आणि वाढता response time हे bottleneck चं लक्षण आहे. server दर सेकंदाला तेवढंच काम पूर्ण करतो, म्हणून नवे users फक्त रांगेत थांबतात.' },
      },
      {
        q: { en: 'Which JMeter word matches k6\'s virtual users (VUs)?', mr: 'k6 च्या virtual users (VUs) ला JMeter मधला कोणता शब्द जुळतो?' },
        options: [
          { en: 'Listener', mr: 'Listener' },
          { en: 'Assertion', mr: 'Assertion' },
          { en: 'Sampler', mr: 'Sampler' },
          { en: 'Thread Group (its number of threads)', mr: 'Thread Group (त्यातल्या threads ची संख्या)' },
        ],
        answer: 3,
        explain: { en: 'In JMeter each thread is one simulated user, set in the Thread Group. A Sampler is a request, a Listener is the report, an Assertion is a check.', mr: 'JMeter मध्ये प्रत्येक thread म्हणजे एक simulated user, जो Thread Group मध्ये ठरवतात. Sampler म्हणजे request, Listener म्हणजे report, Assertion म्हणजे check.' },
      },
    ],
    recap: { line: { en: 'Works for one is not works for all. Load, stress, spike, soak: read response time, throughput and errors together.', mr: 'एकासाठी चालणं म्हणजे सगळ्यांसाठी चालणं नाही. Load, stress, spike, soak: response time, throughput आणि errors एकत्र वाचा.' }, icon: '🎟️' },
  },

  // ───────────────────────── P0.2 Reading the numbers
  {
    id: 'pf0-2',
    code: 'P0.2',
    level: 'basic',
    title: { en: 'Reading the numbers: averages hide pain', mr: 'आकडे वाचणं: सरासरी दुःख लपवते' },
    skill: 'Average, median, p90/p95/p99 and goals',
    realLife: {
      place: 'office',
      title: { en: 'The chai stall at lunch hour', mr: 'जेवणाच्या वेळची चहाची टपरी' },
      story: {
        en: 'At 1 pm the whole IT park comes down to Bandu\'s chai stall. Bandu is proud: "Average wait, two minutes!" And it is true. Nineteen people got their cutting chai in about two minutes. But Meera\'s friend Kedar waited fifteen minutes, because his order slipped off the board. The average looks happy. Kedar does not. And tomorrow Kedar goes to the other stall, and tells five friends.',
        mr: 'दुपारी 1 वाजता संपूर्ण IT park बंडूच्या चहाच्या टपरीवर उतरतो. बंडूला अभिमान आहे: "सरासरी थांबणं, दोन मिनिटं!" आणि ते खरंही आहे. एकोणीस लोकांना साधारण दोन मिनिटांत कटिंग मिळाली. पण मीराचा मित्र केदार पंधरा मिनिटं थांबला, कारण त्याची order बोर्डवरून निसटली. सरासरी खूश दिसते. केदार नाही. आणि उद्या केदार दुसऱ्या टपरीवर जातो, आणि पाच मित्रांना सांगतो.',
      },
      scene: {
        type: 'sort',
        unit: 'min',
        top: 1,
        items: [
          { icon: '🧑‍💻', label: 'Anil', value: 2 },
          { icon: '👩‍💼', label: 'Priya', value: 2 },
          { icon: '🧔', label: 'Kedar', value: 15 },
          { icon: '👨‍🔧', label: 'Ravi', value: 3 },
          { icon: '👩‍🎨', label: 'Sneha', value: 2 },
          { icon: '🧑‍🏫', label: 'Omkar', value: 1 },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'happy', text: { en: 'I ran a load test on the new build. Average response time 117 ms. Ship it!', mr: 'मी नव्या build वर load test चालवली. सरासरी response time 117 ms. Ship करूया!' } },
        { who: 'rex', mood: 'neutral', text: { en: 'And the p95? The average is Bandu\'s chai stall. It hides the one fan in twenty who waits forever.', mr: 'आणि p95? सरासरी म्हणजे बंडूची टपरी. ती वीसपैकी त्या एका fan ला लपवते जो कायम थांबतो.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'averages are my favourite disguise. a few very slow users, a nice round mean, and nobody notices.', mr: 'सरासरी हा माझा आवडता वेश. काही खूप हळू users, छान गोल mean, आणि कोणालाच कळत नाही.' } },
        { who: 'meera', mood: 'neutral', text: { en: '{name}, today you learn to read the numbers like Rex: median, p95, p99, and how to write a goal that means something.', mr: '{name}, आज तुम्ही Rex सारखे आकडे वाचायला शिकाल: median, p95, p99, आणि अर्थपूर्ण ध्येय कसं लिहायचं.' } },
      ],
      problem: { en: 'An average mixes everyone into one number. A few very slow requests, often the seat map or the payment, vanish inside it, and the team ships a build that hurts real fans.', mr: 'सरासरी सगळ्यांना एका आकड्यात मिसळते. काही खूप हळू requests, बऱ्याचदा seat map किंवा payment, त्यात गायब होतात, आणि टीम खऱ्या fans ना त्रास देणारा build ship करते.' },
      solution: { en: 'Read percentiles. p95 says "95% of requests were this fast or faster". Write goals with them, like "95% of checkouts under 800 ms, under 1% errors", and the slow tail can no longer hide.', mr: 'Percentiles वाचा. p95 सांगतो "95% requests इतक्या किंवा यापेक्षा पटकन आल्या". त्यांच्या मदतीने ध्येयं लिहा, उदा. "95% checkouts 800 ms खाली, 1% पेक्षा कमी errors", मग हळू शेपूट लपू शकत नाही.' },
    },
    lesson: [
      { en: 'The average (avg) adds all response times and divides by the count. The median (med) is the middle one: half the requests were faster, half slower. When most requests are quick and a few are very slow, the average gets pulled up a little and the median does not move at all. Neither one shows the slow few.', mr: 'सरासरी (avg) सगळे response times बेरीज करून संख्येने भागते. Median (med) म्हणजे मधला: अर्ध्या requests त्यापेक्षा पटकन, अर्ध्या हळू. बहुतेक requests पटकन आणि काही खूप हळू असतील, तर सरासरी थोडीशी वर ओढली जाते आणि median अजिबात हलत नाही. दोघांपैकी कोणीच त्या हळू काहींना दाखवत नाही.' },
      { en: 'Percentiles do. Sort every response time from fast to slow. p90 is the time that 90% of requests beat. p95: 95% beat it, so 1 request in 20 was slower. p99: 1 in 100 was slower. In a flash sale with 40,000 fans, "1 in 20" is 2,000 people. That is why teams set goals on p95 and keep an eye on p99. Max is a single worst request, too noisy to set a goal on.', mr: 'Percentiles दाखवतात. प्रत्येक response time पटकनपासून हळूपर्यंत लावा. p90 म्हणजे असा वेळ ज्यापेक्षा 90% requests पटकन आल्या. p95: 95% पटकन, म्हणजे 20 पैकी 1 request त्यापेक्षा हळू. p99: 100 पैकी 1 हळू. 40,000 fans च्या flash sale मध्ये "20 पैकी 1" म्हणजे 2,000 लोक. म्हणून टीम्स p95 वर ध्येय ठेवतात आणि p99 वर लक्ष ठेवतात. Max म्हणजे एकच सगळ्यात वाईट request, ध्येय ठेवायला खूप अस्थिर.' },
      { en: 'Load comes from two things: how many VUs, and how long each one pauses. A real fan reads the seat map before clicking, so a script pauses with sleep(1). That pause is think time. 10 VUs with sleep(1) send about 10 requests per second. The same 10 VUs with sleep(0.1) send about 7 times more. So "10 users" alone tells you nothing. Always say the think time too, and read throughput (http_reqs per second) in the summary.', mr: 'Load दोन गोष्टींमधून येतो: किती VUs, आणि प्रत्येक जण किती थांबतो. खरा fan क्लिक करण्याआधी seat map वाचतो, म्हणून script sleep(1) ने थांबते. त्या थांब्याला think time म्हणतात. sleep(1) सह 10 VUs दर सेकंदाला साधारण 10 requests पाठवतात. तेच 10 VUs sleep(0.1) सह साधारण 7 पट जास्त पाठवतात. म्हणजे फक्त "10 users" म्हणून काहीच कळत नाही. think time सुद्धा सांगा, आणि summary मध्ये throughput (http_reqs per second) वाचा.' },
      { en: 'A good goal is a number you can measure, about the requests that matter, under a stated load. Weak: "the site should be fast". Strong: "At 100 concurrent buyers, 95% of checkouts finish under 800 ms, and under 1% of requests fail". In k6 this becomes a threshold that passes or fails the test by itself. You will write those in P1.4.', mr: 'चांगलं ध्येय म्हणजे मोजता येणारा आकडा, महत्त्वाच्या requests बद्दल, ठरलेल्या load खाली. कमजोर: "साइट फास्ट हवी". मजबूत: "100 एकाच वेळच्या खरेदीदारांवर 95% checkouts 800 ms खाली पूर्ण होतात, आणि 1% पेक्षा कमी requests fail होतात". k6 मध्ये हे threshold बनतं, जे स्वतःच test pass किंवा fail करतं. तुम्ही ते P1.4 मध्ये लिहाल.' },
    ],
    syntaxPlain: true,
    syntax: {
      template: 'http_req_duration: avg=117ms min=22ms med=47ms max=1.87s p(90)=202ms p(95)=700ms\nhttp_req_failed..: 0.00%\nhttp_reqs........: 5610   90.6/s',
      parts: [
        { code: 'avg', means: { en: 'the average: pulled a little by slow requests, easy to fool', mr: 'सरासरी: हळू requests ने थोडी ओढली जाते, फसवायला सोपी' } },
        { code: 'med', means: { en: 'the median: the middle request, half faster and half slower', mr: 'median: मधली request, अर्ध्या पटकन आणि अर्ध्या हळू' } },
        { code: 'p(90) / p(95)', means: { en: '90% / 95% of requests were this fast or faster', mr: '90% / 95% requests इतक्या किंवा यापेक्षा पटकन' } },
        { code: 'p(99)', means: { en: '1 request in 100 was slower than this (you can add it to the summary or a threshold)', mr: '100 पैकी 1 request यापेक्षा हळू होती (summary किंवा threshold मध्ये जोडता येतो)' } },
        { code: 'max', means: { en: 'the single slowest request: worth a look, too noisy for a goal', mr: 'एकच सगळ्यात हळू request: पाहण्यासारखी, ध्येयासाठी खूप अस्थिर' } },
        { code: 'http_reqs ... 90.6/s', means: { en: 'total requests, and throughput per second', mr: 'एकूण requests, आणि दर सेकंदाचा throughput' } },
      ],
      example: [
        { code: 'avg=117ms', note: { en: 'Theo\'s happy number', mr: 'Theo चा खूश आकडा' } },
        { code: 'med=47ms', note: { en: 'half the fans got an answer in under 50 ms', mr: 'अर्ध्या fans ना 50 ms खाली उत्तर मिळालं' } },
        { code: 'p(90)=202ms', note: { en: 'still fine for 9 fans in 10', mr: '10 पैकी 9 fans साठी अजून ठीक' } },
        { code: 'p(95)=700ms', note: { en: 'one fan in twenty waited 0.7 s or more: Kedar at the chai stall', mr: 'वीसपैकी एक fan 0.7 s किंवा जास्त थांबला: टपरीवरचा केदार' } },
        { code: 'Goal: p(95) < 800 ms for checkout, errors < 1%, at 100 VUs', note: { en: 'measurable, about checkout, under a stated load', mr: 'मोजता येणारं, checkout बद्दल, ठरलेल्या load खाली' } },
      ],
      pitfall: { en: 'Do not report only the average, and do not report a number without the load. "p95 = 300 ms" means nothing until you add "at 100 VUs with 1 s think time, on checkout".', mr: 'फक्त सरासरी रिपोर्ट करू नका, आणि load शिवाय आकडा रिपोर्ट करू नका. "p95 = 300 ms" ला अर्थ तेव्हाच येतो जेव्हा "100 VUs, 1 s think time, checkout वर" असं जोडता.' },
    },
    practice: {
      intro: { en: 'Rex has three tests ready, and one question about goals. Run each test and read the summary under the chart.', mr: 'Rex कडे तीन tests तयार आहेत, आणि ध्येयांबद्दल एक प्रश्न. प्रत्येक test चालवा आणि chart खालचा summary वाचा.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'This is Theo\'s build. Each fan loads the events list nine times and the seat map once, with 20 fans for a minute. Run it. The average is about 117 ms. Is the build healthy?', mr: 'हा Theo चा build आहे. प्रत्येक fan events list नऊ वेळा आणि seat map एकदा उघडतो, 20 fans एक मिनिट. चालवा. सरासरी साधारण 117 ms आहे. build निरोगी आहे का?' },
          perfSandbox: { code: `import http from 'k6/http';
import { sleep } from 'k6';

export const options = { vus: 20, duration: '1m' };

export default function () {
  for (let i = 0; i < 9; i++) {
    http.get('${B}/events', { tags: { name: 'events' } });
  }
  http.get('${B}/events/1/seats', { tags: { name: 'seats' } });
  sleep(1);
}
`, build: ['slow-seats'] },
          options: [
            { en: 'Yes: an average of 117 ms is very fast', mr: 'हो: 117 ms सरासरी खूप फास्ट आहे' },
            { en: 'Yes: the median is under 50 ms', mr: 'हो: median 50 ms खाली आहे' },
            { en: 'No: p95 is about 700 ms, because the seat map takes 0.7 s or more', mr: 'नाही: p95 साधारण 700 ms आहे, कारण seat map ला 0.7 s किंवा जास्त लागतात' },
            { en: 'No: there are many errors', mr: 'नाही: खूप errors आहेत' },
          ],
          correct: [2],
          explain: { en: 'Nine quick events requests hide one slow seat map in the average. p95 jumps to about 700 ms, and "By endpoint" shows seats at a median of 700 ms (a healthy build gives about 120 ms). There are no errors at all. Report it as: "seat map is about 6 times slower than before".', mr: 'नऊ पटकन events requests सरासरीत एक हळू seat map लपवतात. p95 साधारण 700 ms ला उडी मारतो, आणि "By endpoint" मध्ये seats चा median 700 ms दिसतो (निरोगी build मध्ये साधारण 120 ms). errors अजिबात नाहीत. असं रिपोर्ट करा: "seat map आधीपेक्षा साधारण 6 पट हळू आहे".' },
          hints: [
            { en: 'In the summary, read every number on the http_req_duration line, not only avg.', mr: 'summary मध्ये http_req_duration ओळीवरचा प्रत्येक आकडा वाचा, फक्त avg नाही.' },
            { en: 'Compare med and p(95). Why is there such a big gap?', mr: 'med आणि p(95) ची तुलना करा. एवढं मोठं अंतर का?' },
            { en: 'Open "By endpoint": which row is slow?', mr: '"By endpoint" उघडा: कोणती ओळ हळू आहे?' },
          ],
          successLine: { en: 'Caught. Theo\'s seat map runs one database query per seat. The average never would have told you.', mr: 'पकडलं. Theo चा seat map प्रत्येक seat साठी एक database query चालवतो. सरासरीने हे कधीच सांगितलं नसतं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Your report says: "checkout p95 = 800 ms". What does that mean for the fans?', mr: 'तुमच्या रिपोर्टमध्ये लिहिलंय: "checkout p95 = 800 ms". fans साठी याचा अर्थ काय?' },
          options: [
            { en: 'Every checkout took exactly 800 ms', mr: 'प्रत्येक checkout ला बरोबर 800 ms लागले' },
            { en: '95% of checkouts finished in 800 ms or less, and 1 in 20 took longer', mr: '95% checkouts 800 ms किंवा कमी वेळात पूर्ण झाले, आणि 20 पैकी 1 ला जास्त वेळ लागला' },
            { en: 'The average checkout took 800 ms', mr: 'सरासरी checkout ला 800 ms लागले' },
            { en: '95% of checkouts failed after 800 ms', mr: '800 ms नंतर 95% checkouts fail झाले' },
          ],
          correct: [1],
          explain: { en: 'p95 is the line that 95% of requests beat. The other 5%, one fan in twenty, waited longer than 800 ms.', mr: 'p95 म्हणजे अशी रेषा जी 95% requests ओलांडत नाहीत. उरलेले 5%, वीसपैकी एक fan, 800 ms पेक्षा जास्त थांबले.' },
          hints: [
            { en: 'p95 is about 95 requests out of 100.', mr: 'p95 म्हणजे 100 पैकी 95 requests बद्दल.' },
            { en: 'If 95% were at or under 800 ms, what about the rest?', mr: '95% जर 800 ms किंवा खाली असतील, तर बाकीचे?' },
          ],
        },
        {
          kind: 'choice',
          prompt: { en: '10 VUs with sleep(1) send about 9.5 requests per second to /events. This test keeps the same 10 VUs, but the pause is only sleep(0.1). Run it and read http_reqs. About how many requests per second now?', mr: 'sleep(1) सह 10 VUs /events ला दर सेकंदाला साधारण 9.5 requests पाठवतात. या test मध्ये तेच 10 VUs आहेत, पण थांबा फक्त sleep(0.1) आहे. चालवा आणि http_reqs वाचा. आता दर सेकंदाला साधारण किती requests?' },
          perfSandbox: { code: `import http from 'k6/http';
import { sleep } from 'k6';

export const options = { vus: 10, duration: '30s' };

export default function () {
  http.get('${B}/events');
  sleep(0.1);
}
` },
          options: [
            { en: 'About 9.5 per second: same VUs, same load', mr: 'साधारण 9.5 per second: तेच VUs, तोच load' },
            { en: 'About 1 per second', mr: 'साधारण 1 per second' },
            { en: 'About 1,000 per second', mr: 'साधारण 1,000 per second' },
            { en: 'About 68 per second: shorter think time, about 7 times the load', mr: 'साधारण 68 per second: कमी think time, साधारण 7 पट load' },
          ],
          correct: [3],
          explain: { en: 'Each loop now takes about 0.15 s (the request plus 0.1 s of sleep) instead of 1.05 s, so each VU loops about 7 times as often. Same "10 users", very different load. That is why every load test report states the think time.', mr: 'आता प्रत्येक फेरीला 1.05 s ऐवजी साधारण 0.15 s लागतात (request आणि 0.1 s sleep), म्हणून प्रत्येक VU साधारण 7 पट जास्त वेळा फिरतो. तेच "10 users", खूप वेगळा load. म्हणूनच प्रत्येक load test रिपोर्टमध्ये think time लिहितात.' },
          hints: [
            { en: 'Find the http_reqs line. The number after the total ends in /s.', mr: 'http_reqs ओळ शोधा. एकूण संख्येनंतरचा आकडा /s ने संपतो.' },
            { en: 'Each VU now waits 0.1 s instead of 1 s between requests.', mr: 'आता प्रत्येक VU requests मध्ये 1 s ऐवजी 0.1 s थांबतो.' },
            { en: 'The answer is a few dozen per second.', mr: 'उत्तर दर सेकंदाला काही डझन आहे.' },
          ],
          successLine: { en: 'VUs plus think time make the load. Remember that when P1.3 teaches stages.', mr: 'VUs आणि think time मिळून load बनतो. P1.3 मध्ये stages शिकताना हे लक्षात ठेवा.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Sam must write the goal for Friday\'s sale. Which one is a goal a load test can really pass or fail?', mr: 'Sam ला शुक्रवारच्या विक्रीचं ध्येय लिहायचं आहे. कोणतं ध्येय load test खरंच pass किंवा fail करू शकते?' },
          options: [
            { en: 'The site should feel fast on sale day', mr: 'विक्रीच्या दिवशी साइट फास्ट वाटायला हवी' },
            { en: 'The average response time should be low', mr: 'सरासरी response time कमी हवा' },
            { en: 'At 100 concurrent buyers, 95% of checkouts under 800 ms and under 1% errors', mr: '100 एकाच वेळच्या खरेदीदारांवर 95% checkouts 800 ms खाली आणि 1% पेक्षा कमी errors' },
            { en: 'No request may ever take more than 100 ms', mr: 'कोणत्याही request ला कधीच 100 ms पेक्षा जास्त वेळ लागू नये' },
          ],
          correct: [2],
          explain: { en: 'It names the load (100 buyers), the request that matters (checkout), a percentile (p95), a limit (800 ms) and an error budget (1%). The last option sounds strict, but a max on every request fails on a single unlucky request and checkout alone needs about 300 ms.', mr: 'त्यात load (100 खरेदीदार), महत्त्वाची request (checkout), percentile (p95), मर्यादा (800 ms) आणि error budget (1%) आहे. शेवटचा पर्याय कडक वाटतो, पण प्रत्येक request वरचा max एका दुर्दैवी request ने fail होतो आणि एकट्या checkout ला साधारण 300 ms लागतात.' },
          hints: [
            { en: 'Can you measure "feel fast"? Can you measure "low"?', mr: '"फास्ट वाटणं" मोजता येतं का? "कमी" मोजता येतं का?' },
            { en: 'A good goal says how many users, which request, which percentile and what limit.', mr: 'चांगलं ध्येय सांगतं किती users, कोणती request, कोणता percentile आणि कोणती मर्यादा.' },
          ],
          successLine: { en: 'That sentence becomes a k6 threshold in P1.4.', mr: 'हेच वाक्य P1.4 मध्ये k6 threshold बनेल.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Twenty requests: nineteen take 100 ms and one takes 4 seconds. Which number shows the slow one best?', mr: 'वीस requests: एकोणीसला 100 ms लागतात आणि एकीला 4 सेकंद. कोणता आकडा हळू request सगळ्यात चांगली दाखवतो?' },
        options: [
          { en: 'The median', mr: 'Median' },
          { en: 'The minimum', mr: 'Minimum' },
          { en: 'The count', mr: 'Count' },
          { en: 'A high percentile such as p95 or p99', mr: 'p95 किंवा p99 सारखा उंच percentile' },
        ],
        answer: 3,
        explain: { en: 'The median stays at 100 ms. The high percentiles reach into the slow tail, which is where the unhappy fan lives.', mr: 'Median 100 ms वरच राहतो. उंच percentiles हळू शेपटीपर्यंत पोहोचतात, जिथे नाराज fan असतो.' },
      },
      {
        q: { en: 'What does p95 = 450 ms mean?', mr: 'p95 = 450 ms म्हणजे काय?' },
        options: [
          { en: '95% of requests took 450 ms or less', mr: '95% requests ला 450 ms किंवा कमी वेळ लागला' },
          { en: 'The average was 450 ms', mr: 'सरासरी 450 ms होती' },
          { en: '95 requests were sent', mr: '95 requests पाठवल्या' },
          { en: '5% of requests failed', mr: '5% requests fail झाल्या' },
        ],
        answer: 0,
        explain: { en: 'Percentiles measure speed. Failures are counted in http_req_failed. 95% beat 450 ms; 1 in 20 was slower.', mr: 'Percentiles वेग मोजतात. Failures http_req_failed मध्ये मोजले जातात. 95% ने 450 ms ओलांडले नाहीत; 20 पैकी 1 हळू होती.' },
      },
      {
        q: { en: 'Two tests both use 10 VUs. Test A has sleep(1), test B has sleep(0.1). Which one puts more load on the server?', mr: 'दोन्ही tests 10 VUs वापरतात. Test A मध्ये sleep(1), test B मध्ये sleep(0.1). कोणती server वर जास्त load टाकते?' },
        options: [
          { en: 'Test A', mr: 'Test A' },
          { en: 'Test B, because shorter think time means more requests per second', mr: 'Test B, कारण कमी think time म्हणजे दर सेकंदाला जास्त requests' },
          { en: 'The same, because both have 10 VUs', mr: 'सारखाच, कारण दोघांत 10 VUs आहेत' },
          { en: 'Neither, sleep turns off the load', mr: 'कोणतीच नाही, sleep load बंद करतो' },
        ],
        answer: 1,
        explain: { en: 'Load = VUs and think time together. Less sleep, more loops per second, more requests per second.', mr: 'Load = VUs आणि think time एकत्र. कमी sleep, दर सेकंदाला जास्त फेऱ्या, दर सेकंदाला जास्त requests.' },
      },
      {
        q: { en: 'Which is the strongest performance goal?', mr: 'यापैकी सगळ्यात मजबूत performance ध्येय कोणतं?' },
        options: [
          { en: 'Checkout should be quick', mr: 'Checkout पटकन व्हायला हवा' },
          { en: 'Average under 1 second', mr: 'सरासरी 1 सेकंदाखाली' },
          { en: 'At 100 concurrent buyers, checkout p95 under 800 ms with under 1% errors', mr: '100 एकाच वेळच्या खरेदीदारांवर checkout p95 800 ms खाली आणि 1% पेक्षा कमी errors' },
          { en: 'The server should never be slow', mr: 'server कधीच हळू नसावा' },
        ],
        answer: 2,
        explain: { en: 'Load, request, percentile, limit, error budget: all measurable, all stated.', mr: 'Load, request, percentile, मर्यादा, error budget: सगळं मोजता येणारं, सगळं स्पष्ट.' },
      },
    ],
    recap: { line: { en: 'Averages hide pain. Read med, p95 and p99, state the load and think time, and write goals like "95% of checkouts under 800 ms".', mr: 'सरासरी दुःख लपवते. med, p95 आणि p99 वाचा, load आणि think time सांगा, आणि "95% checkouts 800 ms खाली" अशी ध्येयं लिहा.' }, icon: '📊' },
  },
]
