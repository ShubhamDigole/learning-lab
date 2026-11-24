import type { Lesson } from './types.ts'
import { dropField, setField, slow, withStatus } from '../api/mutants.ts'

// API 2: Like a Pro (part B). TiffinGo Pay: idempotency, pagination and speed, and the Double Charge boss.

const AUTH = { 'Content-Type': 'application/json', Authorization: 'Bearer tg_asha_9f2c' }
const PAY_4003 = '{\n  "orderId": 4003,\n  "amount": 180,\n  "method": "UPI"\n}'

export const apiProLessonsB: Lesson[] = [
  // ───────────────────────── A2.5 Idempotency
  {
    id: 'ap2-5',
    code: 'A2.5',
    level: 'intermediate',
    title: { en: 'Idempotency: When Pay Is Pressed Twice', mr: 'Idempotency: Pay दोनदा दाबलं तर?' },
    skill: 'Idempotency & safe retries',
    realLife: {
      place: 'office',
      title: { en: 'The lift button and the donation box', mr: 'लिफ्टचं बटण आणि दानपेटी' },
      story: {
        en: 'In Meera\'s office building, people waiting for the lift press the button five times. Still, one lift comes. Pressing again changes nothing. On Sunday, Aaji drops a ten-rupee coin into the temple donation box. She is not sure it went in, so she drops another one. Now the temple has twenty rupees from her: two donations. Some actions are safe to repeat. Others add up every single time.',
        mr: 'मीराच्या ऑफिसच्या इमारतीत लिफ्टची वाट पाहणारे लोक बटण पाच वेळा दाबतात. तरी लिफ्ट एकच येते. पुन्हा दाबून काहीच बदलत नाही. रविवारी आजी देवळातल्या दानपेटीत दहा रुपयांचं नाणं टाकतात. ते आत पडलं की नाही याची खात्री नसते, म्हणून त्या अजून एक टाकतात. आता देवळाला त्यांच्याकडून वीस रुपये मिळाले: दोन दान. काही गोष्टी पुन्हा केल्या तरी चालतात. काही गोष्टींची दर वेळी भर पडते.',
      },
      scene: {
        type: 'group',
        groups: [
          { icon: '🔁', label: 'Safe to repeat', mr: 'पुन्हा केलं तरी चालतं' },
          { icon: '➕', label: 'Adds up every time', mr: 'दर वेळी भर पडते' },
        ],
        items: [
          { icon: '🛗', group: 0 },
          { icon: '🪙', group: 1 },
          { icon: '💡', group: 0 },
          { icon: '📮', group: 1 },
          { icon: '🔘', group: 0 },
          { icon: '💸', group: 1 },
        ],
        note: { en: 'Pressing the lift button again changes nothing. Every coin in the box is one more donation.', mr: 'लिफ्टचं बटण पुन्हा दाबून काही बदलत नाही. पेटीतलं प्रत्येक नाणं म्हणजे अजून एक दान.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Complaints from the payments desk, {name}. Customers say: one tiffin, two UPI debits!', mr: 'पेमेंट्स डेस्ककडून तक्रारी आल्यात, {name}. ग्राहक म्हणतात: डबा एक, UPI वरून पैसे दोनदा कापले!' } },
        { who: 'theo', mood: 'neutral', text: { en: 'The app waits 10 seconds for the payment answer. On slow mobile data it gives up and sends the same payment again.', mr: 'ॲप पेमेंटच्या उत्तरासाठी 10 सेकंद थांबतं. मोबाइल डेटा हळू असेल तर ते थांबणं सोडून तेच पेमेंट पुन्हा पाठवतं.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'heh. weak signal + retry = double money. one modak, paid twice. delicious.', mr: 'हेहे. कमकुवत सिग्नल + retry = दुप्पट पैसे. मोदक एक, पैसे दोनदा. वा!' } },
        { who: 'meera', mood: 'neutral', text: { en: 'This is the donation box problem. Let\'s prove it with requests, {name}, and then test the fix: the Idempotency-Key header.', mr: 'हा दानपेटीचा प्रश्न आहे. आधी requests ने तो सिद्ध करूया, {name}, आणि मग उपाय तपासूया: Idempotency-Key header.' } },
      ],
      problem: { en: 'When the network is slow, the app retries POST /payments, and each retry creates a new payment. One order, two charges.', mr: 'नेटवर्क हळू असलं की ॲप POST /payments पुन्हा पाठवतं, आणि प्रत्येक retry नवीन पेमेंट तयार करतो. ऑर्डर एक, पैसे दोनदा.' },
      solution: { en: 'The app sends an Idempotency-Key header with each payment. If the same key comes again, the server returns the first payment and charges nothing new. Testers retry on purpose and count the payments.', mr: 'ॲप प्रत्येक पेमेंटसोबत Idempotency-Key header पाठवतं. तीच key पुन्हा आली तर सर्व्हर पहिलंच पेमेंट परत देतो आणि नवे पैसे कापत नाही. टेस्टर्स मुद्दाम retry करतात आणि payments मोजतात.' },
    },
    lesson: [
      {
        en: 'A request is idempotent (a long word for "safe to repeat") when sending it once or five times leaves the server in the same state. GET only reads, so it is always safe. PUT replaces something with the same value, so the second time changes nothing. DELETE removes something once; the second call finds nothing (often 404), and nothing extra is deleted.',
        mr: 'एखादी request एकदा पाठवा किंवा पाच वेळा, सर्व्हरची स्थिती तीच राहिली तर ती idempotent आहे (म्हणजे "पुन्हा पाठवली तरी चालते"). GET फक्त वाचतं, म्हणून ते नेहमी सुरक्षित. PUT एखादी गोष्ट त्याच value ने बदलतं, त्यामुळे दुसऱ्यांदा काहीच बदलत नाही. DELETE एकदा काढून टाकतं; दुसऱ्या वेळी काही सापडत नाही (बहुतेक 404), आणि जास्तीचं काहीच डिलीट होत नाही.',
      },
      {
        en: 'POST is the donation box. Every POST creates something new. Two POST /orders make two orders. Two POST /payments make two payments.',
        mr: 'POST म्हणजे दानपेटी. प्रत्येक POST काहीतरी नवीन तयार करतो. दोन POST /orders म्हणजे दोन ऑर्डर्स. दोन POST /payments म्हणजे दोन payments.',
      },
      {
        en: 'Networks are not perfect. Mobile data drops, the app times out, and apps retry on their own (and people press Pay again). So a payment API must survive retries.',
        mr: 'नेटवर्क कधीच परिपूर्ण नसतं. मोबाइल डेटा जातो, ॲपचा वेळ संपतो, आणि ॲप्स स्वतःहून पुन्हा पाठवतात (आणि लोकही पुन्हा Pay दाबतात). म्हणून पेमेंट API ला retry सहन करता आलेच पाहिजेत.',
      },
      {
        en: 'The fix: the app makes one unique key for each payment attempt and sends it in the Idempotency-Key header. The server remembers it. Same key again means the same answer, with no new charge. Your job as a tester: pay twice without a key, pay twice with the same key, and count with GET /orders/{id}/payments.',
        mr: 'उपाय: ॲप प्रत्येक पेमेंटच्या प्रयत्नासाठी एक वेगळी key बनवतं आणि ती Idempotency-Key header मध्ये पाठवतं. सर्व्हर ती लक्षात ठेवतो. तीच key पुन्हा आली की तेच उत्तर, नवे पैसे नाहीत. टेस्टर म्हणून तुमचं काम: key शिवाय दोनदा पैसे भरा, त्याच key ने दोनदा भरा, आणि GET /orders/{id}/payments ने मोजा.',
      },
    ],
    syntax: {
      template: 'POST /v1/payments\nContent-Type: application/json\nAuthorization: Bearer tg_asha_9f2c\nIdempotency-Key: pay-4003-001\n\n{ "orderId": 4003, "amount": 180, "method": "UPI" }',
      parts: [
        { code: 'POST /v1/payments', means: { en: 'creates a payment: on its own, not safe to repeat', mr: 'पेमेंट तयार करतं: एकटं असताना पुन्हा पाठवणं सुरक्षित नाही' } },
        { code: 'Idempotency-Key: pay-4003-001', means: { en: 'a unique name for this one payment attempt; a retry sends the same key', mr: 'या एका पेमेंट प्रयत्नाचं वेगळं नाव; retry मध्ये तीच key जाते' } },
        { code: 'idempotent-replayed: true', means: { en: 'a response header from TiffinGo: "I have seen this key, here is the first answer again"', mr: 'TiffinGo चा response header: "ही key मी पाहिली आहे, हे घ्या पहिलंच उत्तर पुन्हा"' } },
        { code: 'GET /orders/4003/payments', means: { en: 'the tester\'s counter: lists every payment for one order', mr: 'टेस्टरचा हिशोब: एका ऑर्डरची सगळी payments दाखवतो' } },
      ],
      example: [
        { code: 'GET /orders/4003            (twice)', note: { en: 'only reads, like looking at the lift display: safe', mr: 'फक्त वाचतं, लिफ्टचा डिस्प्ले पाहण्यासारखं: सुरक्षित' } },
        { code: 'PUT /me/address             (same body twice)', note: { en: 'the same address written twice: still one address', mr: 'तोच पत्ता दोनदा लिहिला: पत्ता एकच' } },
        { code: 'DELETE /feedback/7003       (twice)', note: { en: 'gone after the first call; the second answers 404 and deletes nothing more', mr: 'पहिल्याच वेळी गेलं; दुसरी वेळ 404 देते आणि आणखी काही डिलीट करत नाही' } },
        { code: 'POST /payments              (no key, twice)', note: { en: 'two coins in the box: two payments', mr: 'पेटीत दोन नाणी: दोन payments' } },
        { code: 'POST /payments + Idempotency-Key: pay-4003-001  (twice)', note: { en: 'same key: the server returns the first payment. One charge.', mr: 'तीच key: सर्व्हर पहिलंच पेमेंट परत देतो. पैसे एकदाच.' } },
      ],
      pitfall: {
        en: 'Making a new key for every retry ruins the idea. The key belongs to the payment attempt, so a retry must reuse the same key. A new key means a new charge.',
        mr: 'प्रत्येक retry साठी नवी key बनवली तर सगळा उपायच फसतो. key पेमेंटच्या प्रयत्नाची असते, म्हणून retry मध्ये तीच key वापरायची. नवी key म्हणजे नवे पैसे.',
      },
    },
    practice: {
      intro: {
        en: 'Asha\'s order 4003 (Ukadiche Modak, total 180) is waiting to be paid. You play the app: pay, retry like a bad network would, count the damage, then test the fix.',
        mr: 'आशाची ऑर्डर 4003 (उकडीचे मोदक, एकूण 180) पैसे भरायची वाट पाहतेय. तुम्ही ॲप बना: पैसे भरा, खराब नेटवर्कसारखं retry करा, नुकसान मोजा, आणि मग उपाय तपासा.',
      },
      steps: [
        {
          kind: 'api',
          prompt: {
            en: 'Pay for order 4003: send POST /payments with orderId 4003, amount 180 and method "UPI". The headers are ready.',
            mr: 'ऑर्डर 4003 चे पैसे भरा: POST /payments पाठवा, orderId 4003, amount 180 आणि method "UPI". headers तयार आहेत.',
          },
          starter: { method: 'POST', path: '/payments', headers: AUTH, body: '{\n  "orderId": 4003\n}' },
          expect: { method: 'POST', path: '/payments', body: { orderId: 4003, amount: 180, method: 'UPI' }, status: 201 },
          solution: { method: 'POST', path: '/payments', headers: AUTH, body: PAY_4003 },
          hints: [
            { en: 'Two fields are missing from the body: amount and method.', mr: 'body मध्ये दोन fields नाहीत: amount आणि method.' },
            { en: 'amount must equal the order total (180). method is text, so it needs quotes: "UPI".', mr: 'amount ऑर्डरच्या एकूण रकमेइतकाच हवा (180). method हा text आहे, म्हणून quotes हवेत: "UPI".' },
            { en: '{ "orderId": 4003, "amount": 180, "method": "UPI" }', mr: '{ "orderId": 4003, "amount": 180, "method": "UPI" }' },
          ],
          successLine: { en: '201 Created, status CAPTURED. Note the payment id in the response.', mr: '201 Created, status CAPTURED. response मधला payment id लक्षात ठेवा.' },
        },
        {
          kind: 'api',
          prompt: {
            en: 'Now be the bad network. The answer took too long, so the app retried the exact same request. It is filled in for you: press Submit this request without changing anything.',
            mr: 'आता खराब नेटवर्क बना. उत्तर यायला खूप वेळ लागला, म्हणून ॲपने तीच request पुन्हा पाठवली. ती भरलेली आहे: काहीही न बदलता Submit this request दाबा.',
          },
          starter: { method: 'POST', path: '/payments', headers: AUTH, body: PAY_4003 },
          expect: { method: 'POST', path: '/payments', noHeaders: ['Idempotency-Key'], body: { orderId: 4003, amount: 180, method: 'UPI' }, status: 201 },
          solution: { method: 'POST', path: '/payments', headers: AUTH, body: PAY_4003 },
          hints: [
            { en: 'A retry sends the same request again. Do not change anything.', mr: 'retry म्हणजे तीच request पुन्हा. काहीही बदलू नका.' },
            { en: 'POST /payments with the same body: orderId 4003, amount 180, method "UPI".', mr: 'त्याच body सह POST /payments: orderId 4003, amount 180, method "UPI".' },
          ],
          successLine: { en: '201 again, with a new payment id. The server never noticed it was a retry.', mr: 'पुन्हा 201, आणि नवा payment id. हा retry आहे हे सर्व्हरला कळलंच नाही.' },
        },
        {
          kind: 'choice',
          prompt: {
            en: 'Press Send to list every payment for order 4003. How many times was Asha charged, and how much in total?',
            mr: 'ऑर्डर 4003 ची सगळी payments पाहण्यासाठी Send दाबा. आशाचे पैसे किती वेळा कापले गेले, आणि एकूण किती?',
          },
          apiSandbox: { method: 'GET', path: '/orders/4003/payments', headers: { Authorization: 'Bearer tg_asha_9f2c' } },
          options: [
            { en: 'One payment of ₹180: the server spotted the retry', mr: '₹180 चं एकच पेमेंट: सर्व्हरने retry ओळखला' },
            { en: 'Two or more payments of ₹180 each: every send was a new charge', mr: 'प्रत्येकी ₹180 ची दोन किंवा जास्त payments: प्रत्येक वेळी नवे पैसे कापले' },
            { en: 'One payment of ₹360', mr: '₹360 चं एकच पेमेंट' },
            { en: 'No payments: the payment failed', mr: 'एकही पेमेंट नाही: पेमेंट फेल झालं' },
          ],
          correct: [1],
          explain: {
            en: 'On a clean run, data holds two payments (9001 and 9002), each ₹180. If you also pressed Send along the way, you see even more. One plate of modak, ₹360 gone. That is a real bug: without an Idempotency-Key, every retry is a new charge. Report it like this: send the same POST /payments twice; expected 1 payment; actual 2 payments (9001, 9002).',
            mr: 'नीट क्रमाने केलं असेल तर data मध्ये दोन payments आहेत (9001 आणि 9002), प्रत्येकी ₹180. मधे Send सुद्धा दाबलं असेल तर अजून जास्त दिसतील. मोदकाची एक प्लेट, ₹360 गेले. हा खरा बग आहे: Idempotency-Key शिवाय प्रत्येक retry म्हणजे नवे पैसे. रिपोर्ट असा लिहा: तीच POST /payments दोनदा पाठवली; अपेक्षित 1 पेमेंट; प्रत्यक्षात 2 payments (9001, 9002).',
          },
          hints: [
            { en: 'Count the items inside "data" in the response.', mr: 'response मधल्या "data" मधल्या गोष्टी मोजा.' },
            { en: 'Each item is one payment of 180 for the same order. More than one item means...', mr: 'प्रत्येक गोष्ट म्हणजे त्याच ऑर्डरचं 180 चं एक पेमेंट. एकापेक्षा जास्त गोष्टी म्हणजे...' },
          ],
          successLine: { en: 'Double charge proven, with ids. Now let\'s test the fix.', mr: 'दुहेरी पैसे सिद्ध झाले, id सकट. आता उपाय तपासूया.' },
        },
        {
          kind: 'api',
          prompt: {
            en: 'Test the fix. Send the same payment, this time with a header Idempotency-Key. Use the value pay-4003-001 (any unique text works, but this one makes the next step easy).',
            mr: 'उपाय तपासा. तेच पेमेंट पाठवा, या वेळी Idempotency-Key header सह. value pay-4003-001 वापरा (कोणताही वेगळा text चालतो, पण हा वापरला तर पुढची पायरी सोपी होईल).',
          },
          starter: { method: 'POST', path: '/payments', headers: AUTH, body: PAY_4003 },
          expect: { method: 'POST', path: '/payments', headers: { 'Idempotency-Key': '*' }, body: { orderId: 4003, amount: 180, method: 'UPI' }, status: 201 },
          solution: { method: 'POST', path: '/payments', headers: { ...AUTH, 'Idempotency-Key': 'pay-4003-001' }, body: PAY_4003 },
          hints: [
            { en: 'Add a new header row. Its name is Idempotency-Key.', mr: 'नवी header row जोडा. तिचं नाव Idempotency-Key.' },
            { en: 'The value is pay-4003-001. Keep Content-Type and Authorization as they are.', mr: 'value आहे pay-4003-001. Content-Type आणि Authorization आहेत तसेच ठेवा.' },
            { en: 'Idempotency-Key: pay-4003-001', mr: 'Idempotency-Key: pay-4003-001' },
          ],
          successLine: { en: '201 Created. The first time a key arrives, it is a real new payment. The server saved your key next to it.', mr: '201 Created. key पहिल्यांदा येते तेव्हा ते खरंच नवं पेमेंट असतं. सर्व्हरने तुमची key त्याच्यासोबत जपून ठेवली.' },
        },
        {
          kind: 'choice',
          prompt: {
            en: 'The network drops again, and the app retries with the same key. Press Send, then read the response body and headers. What happened?',
            mr: 'नेटवर्क पुन्हा गेलं, आणि ॲपने त्याच key ने retry केला. Send दाबा, आणि response body व headers वाचा. काय झालं?',
          },
          apiSandbox: { method: 'POST', path: '/payments', headers: { ...AUTH, 'Idempotency-Key': 'pay-4003-001' }, body: PAY_4003 },
          options: [
            { en: 'A new payment with a new id was created', mr: 'नव्या id सह नवं पेमेंट तयार झालं' },
            { en: 'The server sent back the same payment as before, with the header idempotent-replayed: true', mr: 'सर्व्हरने आधीचंच पेमेंट परत पाठवलं, idempotent-replayed: true या header सह' },
            { en: 'The server refused with 409 Conflict', mr: 'सर्व्हरने 409 Conflict देऊन नकार दिला' },
            { en: 'The server answered 401 because the key is a second password', mr: 'key हा दुसरा पासवर्ड आहे म्हणून सर्व्हरने 401 दिलं' },
          ],
          correct: [1],
          explain: {
            en: 'Same payment id as the last step, plus the response header idempotent-replayed: true. However many retries, one charge. A careful tester also runs GET /orders/4003/payments once more: the list must not grow.',
            mr: 'मागच्या पायरीतलाच payment id, आणि सोबत response header idempotent-replayed: true. कितीही retry झाले तरी पैसे एकदाच. काळजीपूर्वक टेस्टर GET /orders/4003/payments पुन्हा एकदा चालवतो: यादी वाढता कामा नये.',
          },
          hints: [
            { en: 'Compare the id in this response with the id from the last step.', mr: 'या response मधला id मागच्या पायरीतल्या id शी जुळवा.' },
            { en: 'Click the Headers tab of the response. Look for one that starts with "idempotent".', mr: 'response चा Headers tab उघडा. "idempotent" ने सुरू होणारा header शोधा.' },
            { en: 'If you used a different key last time, press Send twice. The second answer is the retry.', mr: 'मागच्या वेळी वेगळी key वापरली असेल तर Send दोनदा दाबा. दुसरं उत्तर म्हणजे retry.' },
          ],
          successLine: { en: 'One key, one charge. The donation box now knows Aaji already paid.', mr: 'एक key, पैसे एकदाच. आजींनी आधीच दान दिलंय हे आता दानपेटीला कळतं.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Which of these creates something new every time you send it?', mr: 'यापैकी कोणती request प्रत्येक वेळी पाठवल्यावर काहीतरी नवीन तयार करते?' },
        options: ['GET /orders/4001', 'PUT /me/address', 'POST /payments', 'DELETE /feedback/7001'],
        answer: 2,
        explain: { en: 'POST creates. Send it twice and you get two payments. GET, PUT and DELETE are safe to repeat.', mr: 'POST तयार करतं. दोनदा पाठवलं की दोन payments. GET, PUT आणि DELETE पुन्हा पाठवले तरी चालतात.' },
      },
      {
        q: { en: 'The app retries a payment after a timeout. What should the retry send in Idempotency-Key?', mr: 'वेळ संपल्यावर ॲप पेमेंटचा retry करतं. retry ने Idempotency-Key मध्ये काय पाठवायला हवं?' },
        options: [
          { en: 'The same key as the first try', mr: 'पहिल्या प्रयत्नातलीच key' },
          { en: 'A brand-new key', mr: 'अगदी नवी key' },
          { en: 'No key at all', mr: 'कोणतीच key नाही' },
          { en: 'The login token', mr: 'लॉगिनचा token' },
        ],
        answer: 0,
        explain: { en: 'The same key tells the server "this is the same payment again". A new key looks like a new payment.', mr: 'तीच key सर्व्हरला सांगते "हेच पेमेंट पुन्हा आलंय". नवी key म्हणजे नवं पेमेंट वाटतं.' },
      },
      {
        q: { en: 'What does this response tell you?', mr: 'हा response तुम्हाला काय सांगतो?' },
        code: 'HTTP/1.1 201 Created\nidempotent-replayed: true\n\n{ "id": 9003, "orderId": 4003, "amount": 180, "status": "CAPTURED" }',
        options: [
          { en: 'A second charge was made', mr: 'दुसऱ्यांदा पैसे कापले गेले' },
          { en: 'The server knew the key and sent back the first payment, with no new charge', mr: 'सर्व्हरने key ओळखली आणि पहिलंच पेमेंट परत पाठवलं, नवे पैसे नाहीत' },
          { en: 'The request failed', mr: 'request फेल झाली' },
          { en: 'The token has expired', mr: 'token ची मुदत संपली' },
        ],
        answer: 1,
        explain: { en: 'idempotent-replayed: true means "seen this key before, here is the same answer". Payment 9003 was created only once.', mr: 'idempotent-replayed: true म्हणजे "ही key आधी पाहिलीय, हे घ्या तेच उत्तर". पेमेंट 9003 एकदाच तयार झालं.' },
      },
      {
        q: { en: 'You send DELETE /feedback/7003 twice. The first answers 204, the second 404. Is DELETE still idempotent?', mr: 'तुम्ही DELETE /feedback/7003 दोनदा पाठवता. पहिल्यांदा 204, दुसऱ्यांदा 404. तरी DELETE idempotent आहे का?' },
        options: [
          { en: 'No, because the two answers are different', mr: 'नाही, कारण दोन उत्तरं वेगळी आहेत' },
          { en: 'No, because it deleted two feedbacks', mr: 'नाही, कारण दोन अभिप्राय डिलीट झाले' },
          { en: 'Only if you send a token', mr: 'token पाठवला तरच' },
          { en: 'Yes: after the first call the feedback is gone, and the second call changes nothing more', mr: 'हो: पहिल्या वेळी अभिप्राय गेला, आणि दुसऱ्या वेळी आणखी काहीच बदललं नाही' },
        ],
        answer: 3,
        explain: { en: 'Idempotent is about what the server holds afterwards. After one call or two, feedback 7003 is simply gone.', mr: 'Idempotent म्हणजे नंतर सर्व्हरकडे काय उरतं ते. एकदा पाठवा किंवा दोनदा, अभिप्राय 7003 फक्त गेलेला असतो.' },
      },
    ],
    recap: {
      line: { en: 'GET, PUT and DELETE are safe to repeat; POST is not. Retry on purpose, count the payments, and insist on an Idempotency-Key.', mr: 'GET, PUT आणि DELETE पुन्हा पाठवले तरी चालतात; POST नाही. मुद्दाम retry करा, payments मोजा, आणि Idempotency-Key चा आग्रह धरा.' },
      icon: '🔁',
    },
  },

  // ───────────────────────── A2.6 Pagination, sorting and response time
  {
    id: 'ap2-6',
    code: 'A2.6',
    level: 'intermediate',
    title: { en: 'Pagination, Sorting and Response Time', mr: 'Pagination, Sorting आणि Response Time' },
    skill: 'Pages, sort order & speed',
    realLife: {
      place: 'station',
      title: { en: 'The thick railway timetable', mr: 'रेल्वेचं जाडजूड वेळापत्रक' },
      story: {
        en: 'At Pune station, the timetable book is hundreds of pages thick, so you read it page by page. Page 2 must start exactly where page 1 ended. If page 2 repeats the last train of page 1, you think there are two Deccan Queens. If it skips one, you miss your train. And at the enquiry window, a clerk who takes 10 minutes to give the right answer still makes you miss the train. Right and on time: both matter.',
        mr: 'पुणे स्टेशनवरचं वेळापत्रक शेकडो पानांचं असतं, म्हणून आपण ते पान-पान वाचतो. पान 2 नेमकं तिथून सुरू व्हायला हवं जिथे पान 1 संपलं. पान 2 ने पान 1 ची शेवटची गाडी पुन्हा छापली तर वाटेल दोन डेक्कन क्वीन आहेत. एखादी गाडी गाळली तर तुमची गाडी चुकेल. आणि चौकशी खिडकीवरचा कारकून बरोबर उत्तर द्यायला 10 मिनिटं घेत असेल, तरी गाडी चुकतेच. बरोबर आणि वेळेवर: दोन्ही महत्त्वाचं.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📖', label: 'Page 1: trains 1 to 5', mr: 'पान 1: गाड्या 1 ते 5' },
          { icon: '📖', label: 'Page 2: trains 6 to 10', mr: 'पान 2: गाड्या 6 ते 10' },
          { icon: '📖', label: 'Page 3: trains 11 and 12', mr: 'पान 3: गाड्या 11 आणि 12' },
          { icon: '⏱️', label: 'Answer in seconds', mr: 'काही सेकंदांत उत्तर' },
        ],
        breakAt: 1,
        breakNote: { en: 'Page 2 starts with train 5 again: one train is printed twice.', mr: 'पान 2 पुन्हा गाडी 5 पासून सुरू होतं: एक गाडी दोनदा छापली गेली.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Customers scrolling the restaurant list say one restaurant shows up twice. And searching for dosa feels like waiting for a late train.', mr: 'रेस्टॉरंट्सची यादी स्क्रोल करणारे ग्राहक म्हणतात एक रेस्टॉरंट दोनदा दिसतं. आणि dosa शोधणं म्हणजे उशिरा येणाऱ्या गाडीची वाट पाहण्यासारखं वाटतं.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'The app asks for restaurants five at a time: page 1, page 2, page 3. Nobody ever checked where one page ends and the next begins.', mr: 'ॲप रेस्टॉरंट्स पाच-पाच करून मागतं: पान 1, पान 2, पान 3. एक पान कुठे संपतं आणि पुढचं कुठे सुरू होतं, हे कोणीच तपासलं नाही.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'one restaurant, two times. and search? go make chai. it will still be loading.', mr: 'रेस्टॉरंट एक, दिसतं दोनदा. आणि search? जा, चहा करून ये. तरी लोड होत असेल.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Two new checks today, {name}: lists must be complete and in order, and answers must be fast. Speed is a test result too.', mr: 'आज दोन नवीन तपासण्या, {name}: याद्या पूर्ण आणि क्रमाने हव्यात, आणि उत्तरं जलद हवीत. वेगसुद्धा एक टेस्ट रिझल्ट आहे.' } },
      ],
      problem: { en: 'Long lists come in pages. If page 2 starts one item early, an item repeats. And a slow answer makes customers give up, even when the data is right.', mr: 'मोठ्या याद्या पानांमध्ये येतात. पान 2 एक item आधी सुरू झालं तर एक item दोनदा येतो. आणि उत्तर हळू आलं तर डेटा बरोबर असूनही ग्राहक कंटाळून निघून जातात.' },
      solution: { en: 'Testers fetch page after page and compare the edges, check the sort order item by item, and set a time limit for every response, for example under 1000 ms.', mr: 'टेस्टर्स एकामागून एक पानं मागवतात आणि कडा जुळवतात, sort order एकेक item करून तपासतात, आणि प्रत्येक response ला वेळेची मर्यादा ठेवतात, उदा. 1000 ms पेक्षा कमी.' },
    },
    lesson: [
      {
        en: 'Servers rarely send everything at once. They send pages. page says which page, limit says how many per page, and the response usually tells you total. With 12 restaurants and limit=5: page 1 has restaurants 1 to 5, page 2 has 6 to 10, page 3 has 11 and 12.',
        mr: 'सर्व्हर सहसा सगळं एकदम पाठवत नाहीत. ते पानं पाठवतात. page सांगतं कोणतं पान, limit सांगतं एका पानावर किती, आणि response सहसा total सांगतो. 12 रेस्टॉरंट्स आणि limit=5: पान 1 वर 1 ते 5, पान 2 वर 6 ते 10, पान 3 वर 11 आणि 12.',
      },
      {
        en: 'The tester\'s page check: the last item of page 1 and the first item of page 2 must be different, no item may appear twice, and all pages together must add up to total. A repeat or a gap is a bug.',
        mr: 'टेस्टरची पानांची तपासणी: पान 1 चा शेवटचा item आणि पान 2 चा पहिला item वेगळे हवेत, कोणताही item दोनदा येता कामा नये, आणि सगळी पानं मिळून total इतकी भरायला हवीत. पुनरावृत्ती किंवा गाळलेला item म्हणजे बग.',
      },
      {
        en: 'sort decides the order. sort=rating means the highest rating comes first. Do not trust the name: walk down the list and check that each rating is at least as big as the next one.',
        mr: 'sort क्रम ठरवतं. sort=rating म्हणजे सर्वात जास्त rating आधी. नावावर विश्वास ठेवू नका: यादीतून खाली जा आणि प्रत्येक rating पुढच्यापेक्षा कमी नाही ना, हे तपासा.',
      },
      {
        en: 'Every response also has a time in milliseconds (1000 ms = 1 second). Teams set a target, like "every answer in under 1000 ms". Missing it is a real bug, even with perfect data. This is your first taste of performance testing; a full performance track comes later.',
        mr: 'प्रत्येक response ला milliseconds मध्ये वेळ असतो (1000 ms = 1 सेकंद). टीम एक लक्ष्य ठरवते, जसं "प्रत्येक उत्तर 1000 ms च्या आत". ते चुकलं तर डेटा अगदी बरोबर असला तरी तो खरा बग आहे. ही performance testing ची पहिली झलक आहे; पूर्ण performance ट्रॅक पुढे येईल.',
      },
    ],
    syntax: {
      template: 'GET /v1/restaurants?page=2&limit=5&sort=rating\n\n200 OK   (216 ms)\n{\n  "page": 2,\n  "limit": 5,\n  "total": 12,\n  "data": [ ...5 restaurants... ]\n}',
      parts: [
        { code: 'page=2', means: { en: 'which page you want, starting at 1', mr: 'कोणतं पान हवं, 1 पासून सुरू' } },
        { code: 'limit=5', means: { en: 'how many items on one page', mr: 'एका पानावर किती items' } },
        { code: '"total": 12', means: { en: 'how many items exist across all pages', mr: 'सगळ्या पानांवर मिळून किती items आहेत' } },
        { code: 'sort=rating', means: { en: 'the order: here, highest rating first', mr: 'क्रम: इथे सर्वात जास्त rating आधी' } },
        { code: '(216 ms)', means: { en: 'the response time; compare it with the team\'s target', mr: 'response time; टीमच्या लक्ष्याशी तुलना करा' } },
      ],
      example: [
        { code: 'GET /restaurants?page=1&limit=5', note: { en: 'timetable page 1: restaurants 1 to 5', mr: 'वेळापत्रकाचं पान 1: रेस्टॉरंट्स 1 ते 5' } },
        { code: 'GET /restaurants?page=2&limit=5', note: { en: 'page 2 must start with restaurant 6, the next train', mr: 'पान 2 रेस्टॉरंट 6 ने सुरू व्हायला हवं, पुढची गाडी' } },
        { code: '"total": 12', note: { en: '5 + 5 + 2 = 12: every page together, no more, no less', mr: '5 + 5 + 2 = 12: सगळी पानं मिळून, कमी नाही, जास्त नाही' } },
        { code: 'GET /restaurants?sort=rating&limit=3', note: { en: 'the top 3 by rating, like the fastest expresses printed first', mr: 'rating नुसार पहिले 3, जसं सर्वात जलद एक्स्प्रेस आधी छापलेल्या' } },
        { code: 'pm.expect(pm.response.responseTime).to.be.below(1000)', note: { en: 'the clerk must answer in under 1 second', mr: 'कारकुनाने 1 सेकंदाच्या आत उत्तर द्यायला हवं' } },
      ],
      pitfall: {
        en: 'Checking only page 1 misses this whole family of bugs. Pagination bugs live at the edges: always compare the last item of one page with the first item of the next.',
        mr: 'फक्त पान 1 तपासलं तर असे सगळे बग्स सुटतात. pagination चे बग्स कडांवर राहतात: एका पानाचा शेवटचा item आणि पुढच्या पानाचा पहिला item नेहमी जुळवून पाहा.',
      },
    },
    practice: {
      intro: {
        en: 'TiffinGo has 12 restaurants. Read the list page by page like a timetable, time the search, then automate the checks.',
        mr: 'TiffinGo वर 12 रेस्टॉरंट्स आहेत. यादी वेळापत्रकासारखी पान-पान वाचा, search ला किती वेळ लागतो ते मोजा, आणि मग तपासण्या automate करा.',
      },
      steps: [
        {
          kind: 'api',
          prompt: { en: 'Ask for the first page of restaurants, 5 per page.', mr: 'रेस्टॉरंट्सचं पहिलं पान मागा, एका पानावर 5.' },
          starter: { method: 'GET', path: '/restaurants' },
          expect: { method: 'GET', path: '/restaurants', query: { page: '1', limit: '5' }, status: 200 },
          solution: { method: 'GET', path: '/restaurants?page=1&limit=5' },
          hints: [
            { en: 'Query parameters go after a ?, and are joined with &.', mr: 'Query parameters ? नंतर येतात, आणि & ने जोडतात.' },
            { en: 'You need page=1 and limit=5.', mr: 'तुम्हाला page=1 आणि limit=5 हवं.' },
            { en: '/restaurants?page=1&limit=5', mr: '/restaurants?page=1&limit=5' },
          ],
          successLine: { en: 'Page 1 is here, with total 12. Note the last restaurant on this page.', mr: 'पान 1 आलं, total 12 सह. या पानावरचं शेवटचं रेस्टॉरंट लक्षात ठेवा.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Turn the page: ask for page 2, still 5 per page.', mr: 'पान उलटा: पान 2 मागा, एका पानावर अजूनही 5.' },
          starter: { method: 'GET', path: '/restaurants?page=1&limit=5' },
          expect: { method: 'GET', path: '/restaurants', query: { page: '2', limit: '5' }, status: 200 },
          solution: { method: 'GET', path: '/restaurants?page=2&limit=5' },
          hints: [
            { en: 'Change only the page number.', mr: 'फक्त पानाचा क्रमांक बदला.' },
            { en: '/restaurants?page=2&limit=5', mr: '/restaurants?page=2&limit=5' },
          ],
          successLine: { en: 'Page 2 is here. Now compare its first item with the last item of page 1.', mr: 'पान 2 आलं. आता त्याचा पहिला item पान 1 च्या शेवटच्या item शी जुळवा.' },
        },
        {
          kind: 'choice',
          prompt: {
            en: 'Compare the two pages (press Send to see page 2 again). Which restaurant appears on both page 1 and page 2?',
            mr: 'दोन्ही पानं जुळवा (पान 2 पुन्हा पाहायला Send दाबा). कोणतं रेस्टॉरंट पान 1 आणि पान 2 दोन्हीवर दिसतं?',
          },
          apiSandbox: { method: 'GET', path: '/restaurants?page=2&limit=5' },
          options: ['Saffron Thali (id 1)', 'Tandoor Tales (id 5)', 'Green Bowl (id 6)', 'Chai Tapri (id 9)'],
          correct: [1],
          explain: {
            en: 'Page 1 ends with Tandoor Tales (id 5), and page 2 starts with it again. Page 2 should start at id 6. Count it up: 5 + 5 + 3 = 13 items, but total says 12. Bug report: GET /restaurants?page=2&limit=5 starts with id 5, which was already the last item of page 1; expected first item id 6.',
            mr: 'पान 1 Tandoor Tales (id 5) ने संपतं, आणि पान 2 पुन्हा त्याच्यानेच सुरू होतं. पान 2 id 6 ने सुरू व्हायला हवं. मोजून पाहा: 5 + 5 + 3 = 13 items, पण total म्हणतो 12. बग रिपोर्ट: GET /restaurants?page=2&limit=5 id 5 ने सुरू होतं, जो पान 1 चा शेवटचा item होता; अपेक्षित पहिला item id 6.',
          },
          hints: [
            { en: 'Look at the last item of page 1 and the first item of page 2.', mr: 'पान 1 चा शेवटचा item आणि पान 2 चा पहिला item पाहा.' },
            { en: 'Page 1 had ids 1 to 5. Which id does page 2 start with?', mr: 'पान 1 वर ids 1 ते 5 होते. पान 2 कोणत्या id ने सुरू होतं?' },
          ],
          successLine: { en: 'Caught at the edge, where pagination bugs live.', mr: 'कडेवर पकडला, जिथे pagination चे बग्स राहतात.' },
        },
        {
          kind: 'choice',
          prompt: {
            en: 'The team\'s target: every response in under 1000 ms. Press Send and read the time next to the status. Does search pass?',
            mr: 'टीमचं लक्ष्य: प्रत्येक response 1000 ms च्या आत. Send दाबा आणि status शेजारचा वेळ वाचा. search पास होतं का?',
          },
          apiSandbox: { method: 'GET', path: '/search?q=dosa' },
          options: [
            { en: 'Yes: about 200 ms', mr: 'हो: सुमारे 200 ms' },
            { en: 'Yes: the data is right, so speed does not matter', mr: 'हो: डेटा बरोबर आहे, त्यामुळे वेगाला महत्त्व नाही' },
            { en: 'No: about 2500 ms, two and a half times the target', mr: 'नाही: सुमारे 2500 ms, लक्ष्याच्या अडीचपट' },
            { en: 'No: it answered 500', mr: 'नाही: त्याने 500 दिलं' },
          ],
          correct: [2],
          explain: {
            en: 'The data is right (Dosa Corner, Masala Dosa, Rava Dosa) and the status is 200, but it took about 2.5 seconds. That fails the target. Report it with numbers: GET /search?q=dosa, measured about 2500 ms, target under 1000 ms.',
            mr: 'डेटा बरोबर आहे (Dosa Corner, Masala Dosa, Rava Dosa) आणि status 200 आहे, पण सुमारे 2.5 सेकंद लागले. लक्ष्य चुकलं. आकड्यांसह रिपोर्ट करा: GET /search?q=dosa, मोजलेला वेळ सुमारे 2500 ms, लक्ष्य 1000 ms च्या आत.',
          },
          hints: [
            { en: 'The time is shown next to the status code, in ms.', mr: 'वेळ status code शेजारी ms मध्ये दिसतो.' },
            { en: '1000 ms = 1 second. Is the number bigger or smaller than 1000?', mr: '1000 ms = 1 सेकंद. आकडा 1000 पेक्षा मोठा आहे की लहान?' },
          ],
          successLine: { en: 'A right answer that arrives late is still a bug. Logged.', mr: 'उशिरा आलेलं बरोबर उत्तरसुद्धा बगच. नोंदवलं.' },
        },
        {
          kind: 'test',
          prompt: {
            en: 'Automate it. For GET /restaurants?sort=rating&limit=3, write tests that check: exactly 3 items, ratings sorted high to low, and a response time under 1000 ms.',
            mr: 'आता automate करा. GET /restaurants?sort=rating&limit=3 साठी tests लिहा: नेमके 3 items, rating जास्त ते कमी क्रमाने, आणि response time 1000 ms च्या आत.',
          },
          request: { method: 'GET', path: '/restaurants?sort=rating&limit=3' },
          starter:
            "// Check the top 3 by rating: exactly 3 items, sorted high to low, and fast (under 1000 ms).\n// One test is done for you. Add the rest.\npm.test('status is 200', () => {\n  pm.response.to.have.status(200)\n})\n",
          solution:
            "pm.test('status is 200', () => {\n  pm.response.to.have.status(200)\n})\nconst data = pm.response.json().data\npm.test('exactly 3 items', () => {\n  pm.expect(data).to.have.lengthOf(3)\n})\npm.test('sorted by rating, high to low', () => {\n  for (let i = 1; i < data.length; i++) {\n    pm.expect(data[i - 1].rating).to.be.at.least(data[i].rating)\n  }\n})\npm.test('answers in under 1000 ms', () => {\n  pm.expect(pm.response.responseTime).to.be.below(1000)\n})\n",
          mutants: [
            { label: { en: 'Slow server: answers in 2500 ms', mr: 'हळू सर्व्हर: 2500 ms मध्ये उत्तर' }, patch: slow(2500) },
            { label: { en: 'Wrong order: the first restaurant\'s rating drops to 3.0', mr: 'चुकीचा क्रम: पहिल्या रेस्टॉरंटचं rating 3.0 होतं' }, patch: setField('data.0.rating', 3.0) },
            { label: { en: 'Missing item: only 2 restaurants come back', mr: 'item गायब: फक्त 2 रेस्टॉरंट्स येतात' }, patch: dropField('data.2') },
          ],
          hints: [
            { en: 'Read the list once at the top: const data = pm.response.json().data', mr: 'वरच यादी एकदा वाचा: const data = pm.response.json().data' },
            { en: 'Count: pm.expect(data).to.have.lengthOf(3). Speed: pm.expect(pm.response.responseTime).to.be.below(1000)', mr: 'Count: pm.expect(data).to.have.lengthOf(3). Speed: pm.expect(pm.response.responseTime).to.be.below(1000)' },
            { en: 'Order: loop from i = 1 and check that data[i - 1].rating is at least data[i].rating.', mr: 'क्रम: i = 1 पासून loop करा आणि data[i - 1].rating हे data[i].rating पेक्षा कमी नाही ना ते तपासा.' },
            { en: "for (let i = 1; i < data.length; i++) { pm.expect(data[i - 1].rating).to.be.at.least(data[i].rating) }", mr: "for (let i = 1; i < data.length; i++) { pm.expect(data[i - 1].rating).to.be.at.least(data[i].rating) }" },
          ],
          successLine: { en: 'Count, order and speed, checked on every run. Your first performance test.', mr: 'संख्या, क्रम आणि वेग, प्रत्येक run मध्ये तपासले जातात. तुमची पहिली performance test.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'There are 12 restaurants and limit=5. What should page 3 contain?', mr: '12 रेस्टॉरंट्स आहेत आणि limit=5. पान 3 वर काय असायला हवं?' },
        options: [
          { en: '5 restaurants', mr: '5 रेस्टॉरंट्स' },
          { en: 'Nothing', mr: 'काहीच नाही' },
          { en: 'Restaurants 1 to 5 again', mr: 'पुन्हा रेस्टॉरंट्स 1 ते 5' },
          { en: '2 restaurants: 11 and 12', mr: '2 रेस्टॉरंट्स: 11 आणि 12' },
        ],
        answer: 3,
        explain: { en: '5 on page 1, 5 on page 2, and the last 2 on page 3. 5 + 5 + 2 = 12.', mr: 'पान 1 वर 5, पान 2 वर 5, आणि शेवटचे 2 पान 3 वर. 5 + 5 + 2 = 12.' },
      },
      {
        q: { en: 'What is the bug here?', mr: 'इथे बग कोणता?' },
        code: 'GET /restaurants?page=1&limit=5   ids: 1, 2, 3, 4, 5\nGET /restaurants?page=2&limit=5   ids: 5, 6, 7, 8, 9',
        options: [
          { en: 'Page 2 starts one item early, so id 5 repeats', mr: 'पान 2 एक item आधी सुरू होतं, म्हणून id 5 दोनदा येतो' },
          { en: 'limit should be 4', mr: 'limit 4 असायला हवं' },
          { en: 'There is no bug: pages always overlap', mr: 'बग नाही: पानं नेहमी एकमेकांवर येतात' },
          { en: 'Page 2 should be empty', mr: 'पान 2 रिकामं असायला हवं' },
        ],
        answer: 0,
        explain: { en: 'Page 2 should start at id 6. A repeated edge item is the classic off-by-one pagination bug.', mr: 'पान 2 id 6 ने सुरू व्हायला हवं. कडेचा item दोनदा येणं हा pagination चा ठरलेला off-by-one बग आहे.' },
      },
      {
        q: { en: 'A list with sort=rating returns ratings 4.8, 4.6, 4.7. What do you report?', mr: 'sort=rating असलेली यादी ratings 4.8, 4.6, 4.7 देते. तुम्ही काय रिपोर्ट कराल?' },
        options: [
          { en: 'Nothing: they are all above 4', mr: 'काहीच नाही: सगळे 4 पेक्षा जास्त आहेत' },
          { en: 'The list is too short', mr: 'यादी फार छोटी आहे' },
          { en: 'A sort bug: 4.6 comes before 4.7', mr: 'sort बग: 4.6 हे 4.7 च्या आधी आलं' },
          { en: 'A speed problem', mr: 'वेगाची समस्या' },
        ],
        answer: 2,
        explain: { en: 'High to low means each rating is at least the next one. 4.6 then 4.7 breaks that.', mr: 'जास्त ते कमी म्हणजे प्रत्येक rating पुढच्यापेक्षा कमी नसावं. 4.6 नंतर 4.7 हा नियम मोडतो.' },
      },
      {
        q: { en: 'The target is under 1000 ms. Search returns the right dishes in 2524 ms. Pass or fail?', mr: 'लक्ष्य 1000 ms च्या आत आहे. search बरोबर पदार्थ 2524 ms मध्ये देतं. पास की फेल?' },
        options: [
          { en: 'Pass: the data is right', mr: 'पास: डेटा बरोबर आहे' },
          { en: 'Fail: right data that arrives too late is still a bug', mr: 'फेल: खूप उशिरा आलेला बरोबर डेटासुद्धा बगच' },
          { en: 'Pass: anything under 3 seconds is fine', mr: 'पास: 3 सेकंदांच्या आतलं सगळं चालतं' },
          { en: 'You cannot test speed in API testing', mr: 'API testing मध्ये वेग तपासता येत नाही' },
        ],
        answer: 1,
        explain: { en: 'The team agreed on 1000 ms. 2524 ms misses it, so the test fails, with the numbers in the report.', mr: 'टीमने 1000 ms ठरवलं होतं. 2524 ms ने ते चुकलं, म्हणून test फेल, आणि रिपोर्टमध्ये आकडे.' },
      },
    ],
    recap: {
      line: { en: 'Pages must join with no repeats and no gaps, the sort order must hold item by item, and every answer has a time limit.', mr: 'पानं पुनरावृत्ती किंवा गाळल्याशिवाय जुळायला हवीत, sort क्रम प्रत्येक item ला टिकायला हवा, आणि प्रत्येक उत्तराला वेळेची मर्यादा असते.' },
      icon: '📖',
    },
  },

  // ───────────────────────── A2.7 Boss: The Double Charge
  {
    id: 'ap2-7',
    code: 'A2.8',
    level: 'intermediate',
    isBoss: true,
    title: { en: 'Boss: The Double Charge', mr: 'Boss: दुहेरी पैसे' },
    skill: 'End-to-end API testing & bug reports',
    syntaxPlain: true,
    realLife: {
      place: 'market',
      title: { en: 'Diwali eve at the sweet shop', mr: 'दिवाळीच्या आदल्या दिवशी मिठाईचं दुकान' },
      story: {
        en: 'On Diwali eve, Joshi Mithai Bhandar has a queue down the road. The card machine hangs on "Processing...", so a customer taps his card again. That night Mr. Joshi matches every bill against the bank statement: one box of kaju katli, two payments. He refunds it, writes it in his register, and next morning tells the machine company exactly what happened. Busy days show every weak spot.',
        mr: 'दिवाळीच्या आदल्या दिवशी जोशी मिठाई भांडारासमोर रस्त्यापर्यंत रांग असते. कार्ड मशीन "Processing..." वर अडकतं, म्हणून एक ग्राहक पुन्हा कार्ड टॅप करतो. त्या रात्री जोशीकाका प्रत्येक बिल बँकेच्या स्टेटमेंटशी जुळवतात: काजू कतलीचा एक बॉक्स, पैसे दोनदा. ते पैसे परत करतात, वहीत नोंद करतात, आणि दुसऱ्या दिवशी सकाळी मशीनवाल्या कंपनीला नेमकं काय झालं ते सांगतात. गर्दीचे दिवस प्रत्येक कमकुवत जागा उघडी पाडतात.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🛒', label: 'Long queue', mr: 'मोठी रांग' },
          { icon: '💳', label: 'Tap the card', mr: 'कार्ड टॅप' },
          { icon: '⏳', label: 'Processing...', mr: 'Processing...' },
          { icon: '💳', label: 'Tap again', mr: 'पुन्हा टॅप' },
          { icon: '🧾', label: 'One box, one bill', mr: 'एक बॉक्स, एक बिल' },
        ],
        breakAt: 3,
        breakNote: { en: 'The second tap became a second payment.', mr: 'दुसरा टॅप म्हणजे दुसरं पेमेंट झालं.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'It is the TiffinGo Big Tiffin Sale, and support is flooded: "charged twice!", "charged twice!"', mr: 'TiffinGo चा Big Tiffin Sale चालू आहे, आणि सपोर्टकडे तक्रारींचा पूर: "पैसे दोनदा कापले!", "पैसे दोनदा कापले!"' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'sale day is my favourite day. every slow network is a free double charge. and that is not even my only bug. find them all, if you can.', mr: 'सेलचा दिवस माझा आवडता. प्रत्येक हळू नेटवर्क म्हणजे फुकटचे दुहेरी पैसे. आणि हा माझा एकमेव बग नाही. शोधून दाखव सगळे, जमलं तर.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'The release goes out tonight. I want proof: requests, tests and a clear list of bugs.', mr: 'रिलीज आज रात्री जाणार. मला पुरावा हवा: requests, tests आणि बग्सची स्पष्ट यादी.' } },
        { who: 'meera', mood: 'happy', text: { en: 'You know every tool now, {name}. Log in, order, pay safely, guard the order math with tests, and give Sam the release report.', mr: 'तुला आता सगळी साधनं येतात, {name}. लॉगिन कर, ऑर्डर दे, सुरक्षितपणे पैसे भर, ऑर्डरचं गणित tests ने राख, आणि सॅमला रिलीज रिपोर्ट दे.' } },
      ],
      problem: { en: 'Under sale-day load, retries create double payments, and older bugs hide in the noise. The release needs a clear, proven list of what is broken.', mr: 'सेलच्या गर्दीत retry मुळे दुहेरी payments होतात, आणि जुने बग्स गोंधळात लपतात. रिलीजसाठी काय तुटलंय याची स्पष्ट, सिद्ध केलेली यादी हवी.' },
      solution: { en: 'Walk the customer\'s whole journey through the API, pay with an Idempotency-Key, guard the order math with automated tests, and report every bug with proof.', mr: 'API मधून ग्राहकाचा संपूर्ण प्रवास करा, Idempotency-Key सह पैसे भरा, ऑर्डरचं गणित automated tests ने राखा, आणि प्रत्येक बग पुराव्यासह रिपोर्ट करा.' },
    },
    lesson: [
      {
        en: 'A journey test follows a real customer: log in, place an order, pay, then read the order back. Each step uses something from the one before (the token, the order id, the total). That is chaining.',
        mr: 'Journey test खऱ्या ग्राहकासारखा चालतो: लॉगिन, ऑर्डर, पैसे, आणि मग ऑर्डर परत वाचणं. प्रत्येक पायरी आधीच्या पायरीतलं काहीतरी वापरते (token, order id, total). यालाच chaining म्हणतात.',
      },
      {
        en: 'Money rules come first: total = subtotal - discount + deliveryFee, the total is above 0, the payment amount equals the order total, and there is one payment per order.',
        mr: 'पैशांचे नियम सर्वात आधी: total = subtotal - discount + deliveryFee, total 0 पेक्षा जास्त, पेमेंटची रक्कम ऑर्डरच्या total इतकी, आणि एका ऑर्डरला एकच पेमेंट.',
      },
      {
        en: 'Security rules next: Asha\'s token must open only Asha\'s orders. A 200 on someone else\'s order is a bug; the server must answer 403.',
        mr: 'मग सुरक्षेचे नियम: आशाच्या token ने फक्त आशाच्याच ऑर्डर्स उघडायला हव्यात. दुसऱ्याच्या ऑर्डरवर 200 आलं तर तो बग; सर्व्हरने 403 द्यायला हवं.',
      },
      {
        en: 'A release report lists each bug with the request, what you expected, what you got, and how serious it is. Double charges and data leaks go at the top.',
        mr: 'रिलीज रिपोर्टमध्ये प्रत्येक बगसाठी request, काय अपेक्षित होतं, काय मिळालं, आणि तो किती गंभीर आहे हे असतं. दुहेरी पैसे आणि डेटा लीक सर्वात वर.',
      },
    ],
    syntax: {
      template: 'Bug:       Retried payment charges twice\nRequest:   POST /payments (no Idempotency-Key), sent 2 times\nExpected:  1 payment for order 4003\nActual:    2 payments (9001, 9002), ₹360 taken\nSeverity:  Critical (customers lose money)',
      parts: [
        { code: 'Bug', means: { en: 'a one-line title that says what goes wrong', mr: 'काय चुकतं ते सांगणारं एका ओळीचं शीर्षक' } },
        { code: 'Request', means: { en: 'the exact steps, so anyone can repeat it', mr: 'नेमक्या पायऱ्या, म्हणजे कोणीही पुन्हा करून पाहू शकेल' } },
        { code: 'Expected', means: { en: 'what the rule says should happen', mr: 'नियमानुसार काय व्हायला हवं' } },
        { code: 'Actual', means: { en: 'what really happened, with ids and numbers', mr: 'प्रत्यक्षात काय झालं, ids आणि आकड्यांसह' } },
        { code: 'Severity', means: { en: 'how bad it is: money and personal data are critical', mr: 'किती गंभीर: पैसे आणि वैयक्तिक डेटा म्हणजे critical' } },
      ],
      example: [
        { code: 'POST /auth/login            -> token tg_asha_9f2c', note: { en: 'open the shop: the customer logs in', mr: 'दुकान उघडलं: ग्राहक लॉगिन करतो' } },
        { code: 'POST /orders                -> 201, total 270', note: { en: 'the bill: 2 Masala Dosa + delivery', mr: 'बिल: 2 मसाला डोसे + डिलिव्हरी' } },
        { code: 'POST /payments + Idempotency-Key -> 201', note: { en: 'one tap counts once, however many taps', mr: 'कितीही टॅप केले तरी पैसे एकदाच' } },
        { code: 'GET /orders/4001            -> total = 320 - 0 + 30', note: { en: 'Mr. Joshi matching bills at night', mr: 'रात्री बिलं जुळवणारे जोशीकाका' } },
        { code: 'GET /orders/4002 (Asha)     -> must be 403', note: { en: 'Rohan\'s bill is none of Asha\'s business', mr: 'रोहनचं बिल आशाने पाहायचं नाही' } },
      ],
      pitfall: {
        en: 'A report that says "payments are broken" gets ignored. Give the exact request, the numbers you saw and what you expected.',
        mr: '"payments तुटलेत" एवढंच लिहिलेला रिपोर्ट कोणी वाचत नाही. नेमकी request, दिसलेले आकडे आणि अपेक्षित काय होतं ते द्या.',
      },
    },
    practice: {
      intro: {
        en: 'Sale day. You are testing as Asha, the customer. Walk the whole journey, guard the order math, then write the report. Hints are limited in a boss fight.',
        mr: 'सेलचा दिवस. तुम्ही आशा, म्हणजे ग्राहक बनून टेस्ट करताय. संपूर्ण प्रवास करा, ऑर्डरचं गणित राखा, आणि मग रिपोर्ट लिहा. boss fight मध्ये hints मर्यादित असतात.',
      },
      steps: [
        {
          kind: 'api',
          prompt: { en: 'Log in as Asha (username asha, password chai123).', mr: 'आशा म्हणून लॉगिन करा (username asha, password chai123).' },
          starter: { method: 'POST', path: '/auth/login', headers: { 'Content-Type': 'application/json' }, body: '' },
          expect: { method: 'POST', path: '/auth/login', body: { username: 'asha' }, status: 200 },
          solution: { method: 'POST', path: '/auth/login', headers: { 'Content-Type': 'application/json' }, body: '{\n  "username": "asha",\n  "password": "chai123"\n}' },
          hints: [
            { en: 'The body needs two text fields: username and password.', mr: 'body मध्ये दोन text fields हवीत: username आणि password.' },
            { en: '{ "username": "asha", "password": "chai123" }', mr: '{ "username": "asha", "password": "chai123" }' },
          ],
          successLine: { en: 'Token tg_asha_9f2c. You are in.', mr: 'Token tg_asha_9f2c. तुम्ही आत आलात.' },
        },
        {
          kind: 'api',
          prompt: {
            en: 'Place a sale-day order: restaurant 3 (Dosa Corner), 2 Masala Dosa (menu item 301).',
            mr: 'सेलच्या दिवशीची ऑर्डर द्या: रेस्टॉरंट 3 (Dosa Corner), 2 मसाला डोसे (menu item 301).',
          },
          starter: { method: 'POST', path: '/orders', headers: AUTH, body: '' },
          expect: { method: 'POST', path: '/orders', body: { restaurantId: 3, items: [{ menuItemId: 301, qty: 2 }] }, status: 201 },
          solution: { method: 'POST', path: '/orders', headers: AUTH, body: '{\n  "restaurantId": 3,\n  "items": [\n    { "menuItemId": 301, "qty": 2 }\n  ]\n}' },
          hints: [
            { en: '{ "restaurantId": 3, "items": [ { "menuItemId": 301, "qty": 2 } ] }', mr: '{ "restaurantId": 3, "items": [ { "menuItemId": 301, "qty": 2 } ] }' },
            { en: 'restaurantId is a number; items is a list in [ ], with one { } per dish.', mr: 'restaurantId हा number; items ही [ ] मधली यादी, प्रत्येक पदार्थासाठी एक { }.' },
          ],
          successLine: { en: 'Order 5001 placed: 240 + 30 delivery = total 270. Keep that number.', mr: 'ऑर्डर 5001 झाली: 240 + 30 डिलिव्हरी = एकूण 270. हा आकडा लक्षात ठेवा.' },
        },
        {
          kind: 'api',
          prompt: {
            en: 'Pay for order 5001 (total 270) by UPI, and make the payment safe to retry.',
            mr: 'ऑर्डर 5001 चे (एकूण 270) UPI ने पैसे भरा, आणि पेमेंट retry साठी सुरक्षित करा.',
          },
          starter: { method: 'POST', path: '/payments', headers: AUTH, body: '' },
          expect: { method: 'POST', path: '/payments', headers: { 'Idempotency-Key': '*' }, body: { amount: 270, method: 'UPI' }, status: 201 },
          solution: { method: 'POST', path: '/payments', headers: { ...AUTH, 'Idempotency-Key': 'sale-5001' }, body: '{\n  "orderId": 5001,\n  "amount": 270,\n  "method": "UPI"\n}' },
          hints: [
            { en: 'Add a header Idempotency-Key with any unique value, for example sale-5001.', mr: 'Idempotency-Key header जोडा, कोणत्याही वेगळ्या value सह, उदा. sale-5001.' },
            { en: '{ "orderId": 5001, "amount": 270, "method": "UPI" }', mr: '{ "orderId": 5001, "amount": 270, "method": "UPI" }' },
          ],
          successLine: { en: 'Paid once, with a key. Retries can no longer double charge this order.', mr: 'key सह एकदाच पैसे भरले. आता retry ने या ऑर्डरचे पैसे दोनदा कापले जाणार नाहीत.' },
        },
        {
          kind: 'test',
          prompt: {
            en: 'Guard the order math. For GET /orders/4001 (sent with Asha\'s token), write tests that check: status 200, total = subtotal - discount + deliveryFee, total above 0, and userId is 1.',
            mr: 'ऑर्डरचं गणित राखा. GET /orders/4001 साठी (आशाच्या token सह पाठवलेली) tests लिहा: status 200, total = subtotal - discount + deliveryFee, total 0 पेक्षा जास्त, आणि userId 1.',
          },
          request: { method: 'GET', path: '/orders/4001', headers: { Authorization: 'Bearer tg_asha_9f2c' } },
          starter:
            "// Guard the money: status 200, total = subtotal - discount + deliveryFee,\n// total above 0, and the order belongs to Asha (userId 1).\npm.test('status is 200', () => {\n  pm.response.to.have.status(200)\n})\n",
          solution:
            "const o = pm.response.json()\npm.test('status is 200', () => {\n  pm.response.to.have.status(200)\n})\npm.test('total = subtotal - discount + deliveryFee', () => {\n  pm.expect(o.total).to.equal(o.subtotal - o.discount + o.deliveryFee)\n})\npm.test('total is above 0', () => {\n  pm.expect(o.total).to.be.above(0)\n})\npm.test('order belongs to Asha', () => {\n  pm.expect(o.userId).to.equal(1)\n})\n",
          mutants: [
            { label: { en: 'FLAT500 strikes: the total becomes -350', mr: 'FLAT500 चा फटका: total -350 होतो' }, patch: setField('total', -350) },
            { label: { en: 'Someone else\'s order: userId is 2', mr: 'दुसऱ्याची ऑर्डर: userId 2' }, patch: setField('userId', 2) },
            { label: { en: 'Server crash: 500', mr: 'सर्व्हर क्रॅश: 500' }, patch: withStatus(500) },
          ],
          hints: [
            { en: 'Read the body once: const o = pm.response.json(). Then o.total must equal o.subtotal - o.discount + o.deliveryFee.', mr: 'body एकदा वाचा: const o = pm.response.json(). मग o.total हे o.subtotal - o.discount + o.deliveryFee इतकं हवं.' },
            { en: 'Two more tests: pm.expect(o.total).to.be.above(0) and pm.expect(o.userId).to.equal(1)', mr: 'अजून दोन tests: pm.expect(o.total).to.be.above(0) आणि pm.expect(o.userId).to.equal(1)' },
            { en: "pm.test('total adds up', () => { pm.expect(o.total).to.equal(o.subtotal - o.discount + o.deliveryFee) })", mr: "pm.test('total adds up', () => { pm.expect(o.total).to.equal(o.subtotal - o.discount + o.deliveryFee) })" },
          ],
          successLine: { en: 'Negative totals, wrong owners and crashes now fail the build. The gremlin is running out of hiding places.', mr: 'उणे total, चुकीचा मालक आणि क्रॅश आता build फेल करतात. ग्रेमलिनच्या लपायच्या जागा संपत आल्या.' },
        },
        {
          kind: 'choice',
          prompt: {
            en: 'Sam needs the release report. Which of these are real bugs in the TiffinGo API? Pick every one. (The console is open if you want to re-check.)',
            mr: 'सॅमला रिलीज रिपोर्ट हवा आहे. यापैकी TiffinGo API मधले खरे बग्स कोणते? सगळे निवडा. (पुन्हा तपासायचं असेल तर console उघडा आहे.)',
          },
          apiSandbox: { method: 'GET', path: '/orders/4002', headers: { Authorization: 'Bearer tg_asha_9f2c' } },
          options: [
            { en: 'POST /payments without an Idempotency-Key charges again on every retry', mr: 'Idempotency-Key शिवाय POST /payments प्रत्येक retry ला पुन्हा पैसे कापतं' },
            { en: 'GET /orders without a token answers 401', mr: 'token शिवाय GET /orders ला 401 मिळतं' },
            { en: 'Coupon FLAT500 on a small order gives a negative total (-350)', mr: 'छोट्या ऑर्डरवर FLAT500 कूपनने total उणे होतो (-350)' },
            { en: 'Asha\'s token can read Rohan\'s order 4002 (200 instead of 403)', mr: 'आशाच्या token ने रोहनची ऑर्डर 4002 वाचता येते (403 ऐवजी 200)' },
            { en: 'Paying again with the same Idempotency-Key returns the first payment', mr: 'त्याच Idempotency-Key ने पुन्हा पैसे भरले की पहिलंच पेमेंट परत मिळतं' },
            { en: 'POST /orders accepts qty 0', mr: 'POST /orders qty 0 स्वीकारतं' },
          ],
          correct: [0, 2, 3, 5],
          explain: {
            en: 'Four real bugs: the double charge without a key, the negative total with FLAT500, reading another customer\'s order (should be 403), and qty 0 accepted (should be 400). A 401 without a token and a replayed payment with the same key are the server doing its job: those go in the report as passed checks. Put the double charge and the order leak at the top.',
            mr: 'चार खरे बग्स: key शिवाय दुहेरी पैसे, FLAT500 ने उणे total, दुसऱ्या ग्राहकाची ऑर्डर वाचता येणं (403 हवं), आणि qty 0 स्वीकारणं (400 हवं). token शिवाय 401 आणि त्याच key ने पहिलंच पेमेंट परत येणं म्हणजे सर्व्हर आपलं काम नीट करतोय: ते रिपोर्टमध्ये पास झालेल्या तपासण्या म्हणून जातात. दुहेरी पैसे आणि ऑर्डर लीक सर्वात वर ठेवा.',
          },
          hints: [
            { en: 'A bug is the server doing something it should refuse. A correct refusal (like 401 without a token) is not a bug.', mr: 'बग म्हणजे सर्व्हरने नाकारायला हवं ते करणं. योग्य नकार (जसं token शिवाय 401) हा बग नाही.' },
            { en: 'Exactly two of the six are the server working correctly: one is about a missing token, one about a reused key.', mr: 'सहापैकी नेमके दोन म्हणजे सर्व्हर नीट काम करतोय: एक token नसण्याबद्दल, एक तीच key पुन्हा वापरण्याबद्दल.' },
            { en: 'Press Send: Asha\'s token opens Rohan\'s order 4002. That one is definitely a bug.', mr: 'Send दाबा: आशाच्या token ने रोहनची ऑर्डर 4002 उघडते. तो नक्कीच बग आहे.' },
          ],
          successLine: { en: 'Release report delivered: four bugs, each with proof. Boss defeated!', mr: 'रिलीज रिपोर्ट दिला: चार बग्स, प्रत्येकाचा पुरावा सकट. Boss हरला!' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'An order has subtotal 120, discount 500 and deliveryFee 30. What total does the API show, and is it OK?', mr: 'एका ऑर्डरचा subtotal 120, discount 500 आणि deliveryFee 30 आहे. API कोणता total दाखवतं, आणि ते बरोबर आहे का?' },
        options: [
          { en: '650, and that is fine', mr: '650, आणि ते ठीक आहे' },
          { en: '-350, a bug: a total must never go below 0', mr: '-350, बग: total कधीच 0 च्या खाली जाता कामा नये' },
          { en: '150, and that is fine', mr: '150, आणि ते ठीक आहे' },
          { en: '0, and that is fine', mr: '0, आणि ते ठीक आहे' },
        ],
        answer: 1,
        explain: { en: '120 - 500 + 30 = -350. The app would owe the customer money. FLAT500 needs a minimum order.', mr: '120 - 500 + 30 = -350. म्हणजे ॲपच ग्राहकाला पैसे देणं लागेल. FLAT500 ला किमान ऑर्डरची अट हवी.' },
      },
      {
        q: { en: 'GET /orders/4002 with Asha\'s token returns 200 and Rohan\'s order. What should the server answer?', mr: 'आशाच्या token सह GET /orders/4002 ला 200 आणि रोहनची ऑर्डर मिळते. सर्व्हरने काय उत्तर द्यायला हवं?' },
        options: ['200', '401', '403', '404'],
        answer: 2,
        explain: { en: 'Asha is logged in (so not 401) but not allowed to see Rohan\'s order: 403 Forbidden.', mr: 'आशा लॉगिन केलेली आहे (म्हणून 401 नाही) पण तिला रोहनची ऑर्डर पाहायची परवानगी नाही: 403 Forbidden.' },
      },
      {
        q: { en: 'Which line belongs in a good bug report for the double charge?', mr: 'दुहेरी पैशांच्या चांगल्या बग रिपोर्टमध्ये कोणती ओळ हवी?' },
        options: [
          { en: 'Payments are broken', mr: 'Payments तुटलेत' },
          { en: 'The app feels weird on sale day', mr: 'सेलच्या दिवशी ॲप विचित्र वाटतं' },
          { en: 'Please fix fast', mr: 'कृपया लवकर दुरुस्त करा' },
          { en: 'Expected 1 payment for order 4003, got 2 (9001 and 9002)', mr: 'ऑर्डर 4003 साठी 1 पेमेंट अपेक्षित, मिळाली 2 (9001 आणि 9002)' },
        ],
        answer: 3,
        explain: { en: 'Expected vs actual, with ids. Anyone can check it and nobody can argue with it.', mr: 'अपेक्षित विरुद्ध प्रत्यक्ष, ids सह. कोणीही तपासू शकतो आणि कोणी वाद घालू शकत नाही.' },
      },
      {
        q: { en: 'Which bug goes at the very top of the release report?', mr: 'रिलीज रिपोर्टमध्ये सर्वात वर कोणता बग जातो?' },
        options: [
          { en: 'Double charge on retry: customers lose money', mr: 'retry ला दुहेरी पैसे: ग्राहकांचे पैसे जातात' },
          { en: 'A typo in an error message', mr: 'एरर मेसेजमधली टायपो' },
          { en: 'Search takes about 2.5 seconds', mr: 'search ला सुमारे 2.5 सेकंद लागतात' },
          { en: 'One restaurant shows twice in the list', mr: 'यादीत एक रेस्टॉरंट दोनदा दिसतं' },
        ],
        answer: 0,
        explain: { en: 'All are real, but money comes first. Customers losing money is critical; the rest can follow.', mr: 'सगळे खरे आहेत, पण पैसे आधी. ग्राहकांचे पैसे जाणं critical; बाकीचे नंतर.' },
      },
    ],
    recap: {
      line: { en: 'Journey tested, money math guarded, double charge caught and reported with proof.', mr: 'प्रवास तपासला, पैशांचं गणित राखलं, दुहेरी पैसे पकडले आणि पुराव्यासह रिपोर्ट केले.' },
      icon: '🏆',
    },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: 'no no no. my beautiful double charge... beaten by one header?! fine. i will hide in the browser, where you cannot send requests by hand.', mr: 'नाही नाही नाही. माझे सुंदर दुहेरी पैसे... एका header ने हरले?! ठीक आहे. मी browser मध्ये लपेन, जिथे तू हाताने requests पाठवू शकत नाहीस.' } },
      { who: 'sam', mood: 'happy', text: { en: 'Release report received. The Idempotency-Key fix ships tonight, and every other bug is on the board with proof. Thank you, {name}!', mr: 'रिलीज रिपोर्ट मिळाला. Idempotency-Key चा fix आज रात्री जाईल, आणि बाकी प्रत्येक बग पुराव्यासह बोर्डवर आहे. धन्यवाद, {name}!' } },
      { who: 'meera', mood: 'happy', text: { en: 'A full API test cycle, {name}: manual checks, automated tests, contracts, safe retries and speed. Next, we chase the gremlin into the browser with Selenium and Java.', mr: 'संपूर्ण API test cycle, {name}: manual तपासण्या, automated tests, contracts, सुरक्षित retry आणि वेग. पुढे आपण Selenium आणि Java घेऊन ग्रेमलिनचा पाठलाग browser मध्ये करू.' } },
      { who: 'rex', mood: 'smug', text: { en: 'Bring chai. Java is wordy.', mr: 'चहा घेऊन ये. Java खूप बोलकी आहे.' } },
    ],
  },
]
