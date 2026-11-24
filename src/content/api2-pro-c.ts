import type { Lesson } from './types.ts'

// API 2: Like a Pro (part C). Cross-checking what the API said against what the database stored.

const AUTH = { 'Content-Type': 'application/json', Authorization: 'Bearer tg_asha_9f2c' }
const PAY_4003 = '{\n  "orderId": 4003,\n  "amount": 180,\n  "method": "UPI"\n}'

export const apiProLessonsC: Lesson[] = [
  // ───────────────────────── A2.7 API + database cross-checks
  {
    id: 'ap2-db',
    code: 'A2.7',
    level: 'intermediate',
    title: { en: 'Trust but Verify: Cross-Check the API with SQL', mr: 'विश्वास ठेवा, पण तपासा: API ची SQL ने उलटतपासणी' },
    skill: 'API + database cross-checks',
    realLife: {
      place: 'bank',
      title: { en: 'Baba\'s SMS and Baba\'s passbook', mr: 'बाबांचा SMS आणि बाबांचं पासबुक' },
      story: {
        en: 'Meera\'s Baba pays ₹180 for his tiffin by UPI. The app keeps spinning, so he presses Pay again. His phone beeps: "Rs 180 debited from A/c XX4521." One tiffin, ₹180. All fine, he thinks. On Saturday he goes to the bank and puts his passbook in the printing machine. It types two lines: ₹180, ₹180, same shop, same minute. The SMS is what the bank says happened, one message at a time. The passbook is what really got written in the ledger. Baba takes the printed page to the counter, and the clerk refunds ₹180.',
        mr: 'मीराचे बाबा डब्याचे ₹180 UPI ने भरतात. ॲप फिरतच राहतं, म्हणून ते पुन्हा Pay दाबतात. फोन वाजतो: "Rs 180 debited from A/c XX4521." डबा एक, ₹180. सगळं ठीक, त्यांना वाटतं. शनिवारी ते बँकेत जाऊन पासबुक प्रिंटिंग मशीनमध्ये घालतात. मशीन दोन ओळी छापतं: ₹180, ₹180, तेच दुकान, तेच मिनिट. SMS म्हणजे बँक सांगते ते, एका वेळी एक मेसेज. पासबुक म्हणजे खातेवहीत खरंच काय लिहिलं गेलं ते. बाबा छापलेलं पान घेऊन काउंटरवर जातात, आणि कारकून ₹180 परत करतो.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📱', label: 'SMS: Rs 180 debited', mr: 'SMS: Rs 180 कापले' },
          { icon: '🏦', label: 'Visit the bank', mr: 'बँकेत जा' },
          { icon: '🖨️', label: 'Print the passbook', mr: 'पासबुक छापा' },
          { icon: '📒', label: '₹180 written twice', mr: '₹180 दोनदा लिहिलेले' },
          { icon: '🧾', label: 'Complaint with proof', mr: 'पुराव्यासह तक्रार' },
        ],
        breakAt: 3,
        breakNote: { en: 'The SMS said one payment. The ledger holds two.', mr: 'SMS ने एक पेमेंट सांगितलं. खातेवहीत दोन आहेत.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'happy', text: { en: 'Good news: every POST in my logs got a 201 Created. Orders, payments, all green. So the data is fine, right?', mr: 'चांगली बातमी: माझ्या logs मधल्या प्रत्येक POST ला 201 Created मिळालं. ऑर्डर्स, payments, सगळं हिरवं. म्हणजे डेटा ठीक आहे, बरोबर?' } },
        { who: 'gremlin', mood: 'smug', text: { en: '201 means the api said yes. what it actually saved... that is my little secret. every response smiles at you.', mr: '201 म्हणजे api ने हो म्हटलं. खरं काय save झालं... ते माझं छोटंसं गुपित. प्रत्येक response तुमच्याकडे बघून हसतो.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'A 201 is Baba\'s SMS, {name}. The database is the passbook. TiffinGo now copies its data into three tables: tg_orders, tg_order_items and tg_payments. Let\'s open them with SQL.', mr: '201 म्हणजे बाबांचा SMS, {name}. डेटाबेस म्हणजे पासबुक. TiffinGo आता आपला डेटा तीन टेबल्समध्ये कॉपी करतं: tg_orders, tg_order_items आणि tg_payments. चल, SQL ने ती उघडूया.' } },
        { who: 'you', mood: 'happy', text: { en: 'My SQL track comes back! I can count and compare rows that the API never shows me together.', mr: 'माझं SQL परत कामाला आलं! API कधीच एकत्र न दाखवणाऱ्या rows मी मोजू आणि जुळवू शकते.' } },
      ],
      problem: { en: 'A 201 only proves that the API said yes. A retried payment, a negative total or a zero quantity can each come back with a cheerful 201, and a response shows one record at a time, so patterns across many records stay hidden.', mr: '201 फक्त एवढंच सिद्ध करतो की API ने हो म्हटलं. retry झालेलं पेमेंट, उणा total किंवा शून्य quantity, प्रत्येकाला आनंदाने 201 मिळू शकतो. आणि response एका वेळी एकच रेकॉर्ड दाखवतो, म्हणून अनेक रेकॉर्ड्समधले पॅटर्न लपून राहतात.' },
      solution: { en: 'After each write, the tester checks the database: the row exists, its id, amount and status match the response, and sweep queries (GROUP BY, HAVING, WHERE) find duplicates and broken rules across every record.', mr: 'प्रत्येक write नंतर टेस्टर डेटाबेस तपासतो: row आहे का, तिचा id, amount आणि status response शी जुळतो का, आणि sweep queries (GROUP BY, HAVING, WHERE) सगळ्या रेकॉर्ड्समधले duplicates आणि मोडलेले नियम शोधतात.' },
    },
    lesson: [
      {
        en: 'The response is what the server says happened. The database is what it really stored. Most days they agree. Testers still check, because sometimes they do not: the response was built before the save, the save failed quietly, a value was changed on the way, or an extra row slipped in.',
        mr: 'response म्हणजे सर्व्हर सांगतो ते. डेटाबेस म्हणजे त्याने खरंच काय साठवलं ते. बहुतेक वेळा दोन्ही जुळतात. तरी टेस्टर्स तपासतात, कारण कधी कधी जुळत नाहीत: save होण्याआधीच response तयार झाला, save शांतपणे फेल झालं, वाटेत एखादी value बदलली, किंवा एक जास्तीची row घुसली.',
      },
      {
        en: 'Retries hide duplicates. Each retry gets its own 201, and each response looks perfect on its own. Only when you count rows per order does the double show up. That is a job for GROUP BY order_id HAVING COUNT(*) > 1.',
        mr: 'retry मुळे duplicates लपतात. प्रत्येक retry ला स्वतःचा 201 मिळतो, आणि प्रत्येक response एकट्याने पाहिला तर अगदी बरोबर दिसतो. ऑर्डरनुसार rows मोजल्या तरच दुप्पट दिसतं. हे काम GROUP BY order_id HAVING COUNT(*) > 1 चं.',
      },
      {
        en: 'What to compare: ids (the id in the response exists in the table), amounts (payment amount = order total, total = subtotal - discount + delivery_fee), counts (one payment per order) and statuses (CAPTURED, PLACED). Then check the rules on every row: total above 0, qty at least 1.',
        mr: 'काय जुळवायचं: ids (response मधला id टेबलमध्ये आहे का), रकमा (पेमेंटची रक्कम = ऑर्डरचा total, total = subtotal - discount + delivery_fee), संख्या (एका ऑर्डरला एकच पेमेंट) आणि status (CAPTURED, PLACED). मग प्रत्येक row वर नियम तपासा: total 0 पेक्षा जास्त, qty किमान 1.',
      },
      {
        en: 'When: right after each write (POST, PUT, PATCH, DELETE), plus one sweep over all records at the end of the session. In the bug report, give both sides: the request and its response, and the SQL query with the rows it returned.',
        mr: 'कधी: प्रत्येक write नंतर लगेच (POST, PUT, PATCH, DELETE), आणि session च्या शेवटी सगळ्या रेकॉर्ड्सवर एक sweep. बग रिपोर्टमध्ये दोन्ही बाजू द्या: request आणि तिचा response, आणि SQL query व तिने दिलेल्या rows.',
      },
    ],
    syntax: {
      template: '-- 1. The API said:  POST /payments  ->  201 Created, id 9002\n-- 2. The database check, right after the write:\nSELECT order_id, COUNT(*) AS payments, SUM(amount) AS charged\nFROM tg_payments\nGROUP BY order_id\nHAVING COUNT(*) > 1;',
      parts: [
        { code: '-- The API said', means: { en: 'the response: what the system says happened (the SMS)', mr: 'response: सिस्टम काय झालं म्हणते ते (SMS)' } },
        { code: 'tg_payments', means: { en: 'the table: what really got stored (the passbook)', mr: 'टेबल: खरंच काय साठवलं गेलं ते (पासबुक)' } },
        { code: 'GROUP BY order_id', means: { en: 'one pile of rows per order', mr: 'प्रत्येक ऑर्डरसाठी rows चा एक ढीग' } },
        { code: 'HAVING COUNT(*) > 1', means: { en: 'keep only orders paid more than once: the double charge', mr: 'एकापेक्षा जास्त वेळा पैसे भरलेल्या ऑर्डर्सच ठेवा: दुहेरी पैसे' } },
        { code: 'SUM(amount) AS charged', means: { en: 'how much money left the customer in total', mr: 'ग्राहकाचे एकूण किती पैसे गेले' } },
      ],
      example: [
        { code: 'POST /payments            -> 201, id 9001', note: { en: 'the SMS: "Rs 180 debited". Looks fine.', mr: 'SMS: "Rs 180 कापले". ठीक दिसतं.' } },
        { code: 'POST /payments (retry)    -> 201, id 9002', note: { en: 'a second polite yes. Alone, it also looks fine.', mr: 'दुसरा नम्र होकार. एकटा पाहिला तर तोही ठीक दिसतो.' } },
        { code: 'SELECT * FROM tg_payments WHERE id = 9002', note: { en: 'the id from the response must exist in the table: was it really stored?', mr: 'response मधला id टेबलमध्ये हवाच: तो खरंच साठवला गेला का?' } },
        { code: 'SELECT order_id, COUNT(*) FROM tg_payments GROUP BY order_id HAVING COUNT(*) > 1', note: { en: 'the passbook view: order 4003 shows up with 2 payments', mr: 'पासबुकची नजर: ऑर्डर 4003 दोन payments सह दिसते' } },
        { code: 'SELECT id, total FROM tg_orders WHERE total < 0', note: { en: 'a rule check on every order, like spotting an impossible line in the passbook', mr: 'प्रत्येक ऑर्डरवर नियमाची तपासणी, पासबुकमधली अशक्य ओळ शोधण्यासारखी' } },
      ],
      pitfall: {
        en: 'Seeing "the row exists" and stopping there. A row can exist and still be wrong: check its amount and status, and count the rows too. One payment row is good news; two for the same order is the bug.',
        mr: '"row आहे" एवढं पाहून थांबणं. row असूनही चुकीची असू शकते: तिची रक्कम आणि status तपासा, आणि rows मोजाही. एका ऑर्डरची एक payment row म्हणजे चांगली बातमी; दोन म्हणजे बग.',
      },
    },
    practice: {
      intro: {
        en: 'Now each SQL query sees the API\'s latest data in three tables: tg_orders (id, user_id, restaurant_id, subtotal, discount, delivery_fee, total, coupon_code, status, created_at), tg_order_items (order_id, menu_item_id, name, qty, price) and tg_payments (id, order_id, amount, method, status, idempotency_key, created_at). Write with the API, then verify with SQL.',
        mr: 'आता प्रत्येक SQL query ला API चा ताजा डेटा तीन टेबल्समध्ये दिसतो: tg_orders (id, user_id, restaurant_id, subtotal, discount, delivery_fee, total, coupon_code, status, created_at), tg_order_items (order_id, menu_item_id, name, qty, price) आणि tg_payments (id, order_id, amount, method, status, idempotency_key, created_at). API ने लिहा, मग SQL ने तपासा.',
      },
      steps: [
        {
          kind: 'api',
          prompt: {
            en: 'Play Baba\'s phone. Pay for Asha\'s order 4003 (total 180) with UPI, without an Idempotency-Key. Finish the body and send it.',
            mr: 'बाबांचा फोन बना. आशाच्या ऑर्डर 4003 चे (total 180) पैसे UPI ने भरा, Idempotency-Key शिवाय. body पूर्ण करा आणि पाठवा.',
          },
          starter: { method: 'POST', path: '/payments', headers: AUTH, body: '{\n  "orderId": 4003\n}' },
          expect: { method: 'POST', path: '/payments', noHeaders: ['Idempotency-Key'], body: { orderId: 4003, amount: 180, method: 'UPI' }, status: 201 },
          solution: { method: 'POST', path: '/payments', headers: AUTH, body: PAY_4003 },
          hints: [
            { en: 'The body still needs amount and method.', mr: 'body मध्ये अजून amount आणि method हवेत.' },
            { en: 'amount must equal the order total, 180. method is text: "UPI".', mr: 'amount ऑर्डरच्या total इतकाच हवा, 180. method हा text आहे: "UPI".' },
            { en: '{ "orderId": 4003, "amount": 180, "method": "UPI" }', mr: '{ "orderId": 4003, "amount": 180, "method": "UPI" }' },
          ],
          successLine: { en: '201 Created, payment 9001. The SMS has arrived.', mr: '201 Created, पेमेंट 9001. SMS आला.' },
        },
        {
          kind: 'api',
          prompt: {
            en: 'The app kept spinning, so Baba pressed Pay again. Send the exact same request once more.',
            mr: 'ॲप फिरतच राहिलं, म्हणून बाबांनी पुन्हा Pay दाबलं. तीच request अगदी तशीच पुन्हा एकदा पाठवा.',
          },
          starter: { method: 'POST', path: '/payments', headers: AUTH, body: PAY_4003 },
          expect: { method: 'POST', path: '/payments', noHeaders: ['Idempotency-Key'], body: { orderId: 4003, amount: 180, method: 'UPI' }, status: 201 },
          solution: { method: 'POST', path: '/payments', headers: AUTH, body: PAY_4003 },
          hints: [
            { en: 'A retry changes nothing. Just press Submit.', mr: 'retry मध्ये काहीच बदलत नाही. फक्त Submit दाबा.' },
            { en: 'POST /payments with orderId 4003, amount 180, method "UPI", and no Idempotency-Key header.', mr: 'POST /payments, orderId 4003, amount 180, method "UPI", आणि Idempotency-Key header नाही.' },
          ],
          successLine: { en: 'Another 201, payment 9002. Two happy answers. Neither one says "you already paid".', mr: 'पुन्हा 201, पेमेंट 9002. दोन आनंदी उत्तरं. एकही म्हणत नाही "तुम्ही आधीच पैसे भरलेत".' },
        },
        {
          kind: 'sql',
          prompt: {
            en: 'Now open the passbook. In tg_payments, find every order that has more than one payment. Show order_id and the number of payments.',
            mr: 'आता पासबुक उघडा. tg_payments मध्ये एकापेक्षा जास्त पेमेंट असलेली प्रत्येक ऑर्डर शोधा. order_id आणि payments ची संख्या दाखवा.',
          },
          starter: 'SELECT order_id, COUNT(*)\nFROM tg_payments\n',
          expected: 'SELECT order_id, COUNT(*) FROM tg_payments GROUP BY order_id HAVING COUNT(*) > 1',
          hints: [
            { en: 'You need one group per order, then keep only the big groups.', mr: 'प्रत्येक ऑर्डरसाठी एक गट हवा, मग फक्त मोठे गट ठेवा.' },
            { en: 'GROUP BY order_id makes the groups. A filter on a count goes in HAVING, not WHERE.', mr: 'GROUP BY order_id गट बनवतो. count वरचा फिल्टर HAVING मध्ये जातो, WHERE मध्ये नाही.' },
            { en: 'GROUP BY order_id HAVING COUNT(*) > 1', mr: 'GROUP BY order_id HAVING COUNT(*) > 1' },
            { en: 'SELECT order_id, COUNT(*) FROM tg_payments GROUP BY order_id HAVING COUNT(*) > 1;', mr: 'SELECT order_id, COUNT(*) FROM tg_payments GROUP BY order_id HAVING COUNT(*) > 1;' },
          ],
          successLine: { en: 'Order 4003: 2 payments. ₹360 for one plate of modak, proven straight from the database.', mr: 'ऑर्डर 4003: 2 payments. मोदकाच्या एका प्लेटसाठी ₹360, थेट डेटाबेसमधून सिद्ध.' },
        },
        {
          kind: 'api',
          prompt: {
            en: 'Next, Asha orders 1 Masala Dosa from restaurant 3. She added a Filter Coffee and removed it, but the app sent it as qty 0 instead of dropping it. Add her coupon: "couponCode": "FLAT500". Send it.',
            mr: 'आता आशा रेस्टॉरंट 3 मधून 1 मसाला डोसा मागवते. तिने Filter Coffee टाकली आणि काढली, पण ॲपने ती काढून न टाकता qty 0 म्हणून पाठवली. तिचं कूपन जोडा: "couponCode": "FLAT500". पाठवा.',
          },
          starter: { method: 'POST', path: '/orders', headers: AUTH, body: '{\n  "restaurantId": 3,\n  "items": [\n    { "menuItemId": 301, "qty": 1 },\n    { "menuItemId": 303, "qty": 0 }\n  ]\n}' },
          expect: { method: 'POST', path: '/orders', body: { restaurantId: 3, couponCode: 'FLAT500', items: [{ menuItemId: 303, qty: 0 }] }, status: 201 },
          solution: { method: 'POST', path: '/orders', headers: AUTH, body: '{\n  "restaurantId": 3,\n  "items": [\n    { "menuItemId": 301, "qty": 1 },\n    { "menuItemId": 303, "qty": 0 }\n  ],\n  "couponCode": "FLAT500"\n}' },
          hints: [
            { en: 'Keep both items as they are. Add one more field at the top level of the body.', mr: 'दोन्ही items आहेत तसेच ठेवा. body च्या वरच्या पातळीवर अजून एक field जोडा.' },
            { en: 'Put a comma after the closing ] of items, then add the coupon field.', mr: 'items च्या शेवटच्या ] नंतर comma टाका, मग कूपनचं field जोडा.' },
            { en: '"couponCode": "FLAT500"', mr: '"couponCode": "FLAT500"' },
          ],
          successLine: { en: '201 Created, order 5001. Another polite yes. Now let\'s read what got stored.', mr: '201 Created, ऑर्डर 5001. पुन्हा एक नम्र होकार. आता काय साठवलं गेलं ते वाचूया.' },
        },
        {
          kind: 'sql',
          prompt: {
            en: 'Money check on every order. In tg_orders, find orders whose total is below zero, or whose total does not equal subtotal - discount + delivery_fee. Show id and total.',
            mr: 'प्रत्येक ऑर्डरची पैशांची तपासणी. tg_orders मध्ये ज्या ऑर्डर्सचा total 0 पेक्षा कमी आहे, किंवा total हा subtotal - discount + delivery_fee इतका नाही, त्या शोधा. id आणि total दाखवा.',
          },
          starter: 'SELECT id, total\nFROM tg_orders\nWHERE ',
          expected: 'SELECT id, total FROM tg_orders WHERE total < 0 OR total <> subtotal - discount + delivery_fee',
          hints: [
            { en: 'Two rules, and breaking either one is a bug. Join them with OR.', mr: 'दोन नियम, आणि कोणताही एक मोडला तरी बग. ते OR ने जोडा.' },
            { en: '"Does not equal" in SQL is <>.', mr: 'SQL मध्ये "बरोबर नाही" म्हणजे <>.' },
            { en: 'WHERE total < 0 OR total <> subtotal - discount + delivery_fee', mr: 'WHERE total < 0 OR total <> subtotal - discount + delivery_fee' },
            { en: 'SELECT id, total FROM tg_orders WHERE total < 0 OR total <> subtotal - discount + delivery_fee;', mr: 'SELECT id, total FROM tg_orders WHERE total < 0 OR total <> subtotal - discount + delivery_fee;' },
          ],
          successLine: { en: 'Order 5001: total -350. The math adds up (120 - 500 + 30), but a negative bill breaks the money rule. FLAT500 has no minimum order.', mr: 'ऑर्डर 5001: total -350. गणित जुळतं (120 - 500 + 30), पण उणं बिल पैशांचा नियम मोडतं. FLAT500 ला किमान ऑर्डरची अट नाही.' },
        },
        {
          kind: 'choice',
          prompt: {
            en: 'Last sweep. The query looks for order items with a quantity of zero or less. Press Run, read the row, then pick everything that belongs in the bug report.',
            mr: 'शेवटचा sweep. ही query शून्य किंवा त्याहून कमी quantity असलेले order items शोधते. Run दाबा, row वाचा, आणि बग रिपोर्टमध्ये जे जे हवं ते सगळं निवडा.',
          },
          sandbox: true,
          sandboxStarter: 'SELECT order_id, name, qty, price\nFROM tg_order_items\nWHERE qty <= 0',
          options: [
            { en: 'The request: POST /orders with { "menuItemId": 303, "qty": 0 }, and the response: 201 Created, order 5001', mr: 'request: POST /orders, { "menuItemId": 303, "qty": 0 } सह, आणि response: 201 Created, ऑर्डर 5001' },
            { en: 'The SQL query you ran, and the row it returned: order 5001, Filter Coffee, qty 0', mr: 'तुम्ही चालवलेली SQL query, आणि तिने दिलेली row: ऑर्डर 5001, Filter Coffee, qty 0' },
            { en: 'Expected: 400 naming qty, and nothing saved. Actual: 201, and the item was stored with qty 0', mr: 'अपेक्षित: qty चं नाव घेणारा 400, आणि काहीच save नाही. प्रत्यक्षात: 201, आणि item qty 0 सह साठवला गेला' },
            { en: '"The API answered 201, so the data must be fine."', mr: '"API ने 201 दिलं, म्हणजे डेटा ठीकच असणार."' },
          ],
          correct: [0, 1, 2],
          explain: {
            en: 'A strong report shows both sides: what the API said (the request and the 201) and what the database stored (the query and its row), plus expected versus actual. The last option is exactly the trap this lesson is about.',
            mr: 'चांगला रिपोर्ट दोन्ही बाजू दाखवतो: API काय म्हणाला (request आणि 201) आणि डेटाबेसने काय साठवलं (query आणि तिची row), सोबत अपेक्षित आणि प्रत्यक्ष. शेवटचा पर्याय म्हणजे नेमका हाच सापळा ज्याबद्दल हा धडा आहे.',
          },
          hints: [
            { en: 'The query returns one row. Which order is it from?', mr: 'query एक row देते. ती कोणत्या ऑर्डरची आहे?' },
            { en: 'A report needs the steps, the evidence and expected versus actual. More than one option is right.', mr: 'रिपोर्टला पायऱ्या, पुरावा आणि अपेक्षित विरुद्ध प्रत्यक्ष हवं. एकापेक्षा जास्त पर्याय बरोबर आहेत.' },
            { en: 'Only one option is not evidence at all: it is the excuse.', mr: 'फक्त एक पर्याय पुरावा नाहीच: ती सबब आहे.' },
          ],
          successLine: { en: 'One 201, two hidden bugs in order 5001, and three in the whole session. The passbook never lies.', mr: 'एक 201, ऑर्डर 5001 मध्ये दोन लपलेले बग्स, आणि पूर्ण session मध्ये तीन. पासबुक कधीच खोटं बोलत नाही.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'POST /payments answered 201 Created. What does that prove?', mr: 'POST /payments ने 201 Created उत्तर दिलं. यावरून काय सिद्ध होतं?' },
        options: [
          { en: 'The customer was charged exactly once', mr: 'ग्राहकाचे पैसे बरोबर एकदाच कापले गेले' },
          { en: 'The database holds the right row with the right amount', mr: 'डेटाबेसमध्ये योग्य रकमेची योग्य row आहे' },
          { en: 'Only that the API said yes. What was stored still needs checking.', mr: 'फक्त एवढंच की API ने हो म्हटलं. काय साठवलं गेलं ते अजून तपासायचं आहे.' },
          { en: 'Nothing at all: 201 is an error', mr: 'काहीच नाही: 201 म्हणजे एरर' },
        ],
        answer: 2,
        explain: { en: 'A 201 is the SMS. The two retried payments in practice each got a 201, and only the table showed the double.', mr: '201 म्हणजे SMS. सरावात retry झालेल्या दोन्ही payments ना 201 मिळाला, आणि दुप्पट फक्त टेबलनेच दाखवलं.' },
      },
      {
        q: { en: 'Which query proves a double charge?', mr: 'कोणती query दुहेरी पैसे सिद्ध करते?' },
        options: [
          'SELECT order_id, COUNT(*) FROM tg_payments GROUP BY order_id HAVING COUNT(*) > 1',
          'SELECT order_id FROM tg_payments WHERE COUNT(*) > 1',
          'SELECT * FROM tg_payments WHERE amount > 0',
          'SELECT COUNT(*) FROM tg_orders',
        ],
        answer: 0,
        explain: { en: 'Group the payments by order and keep groups with more than one row. WHERE cannot filter on COUNT(*); that is what HAVING is for.', mr: 'payments ऑर्डरनुसार गटात ठेवा आणि एकापेक्षा जास्त rows असलेले गट ठेवा. WHERE ने COUNT(*) वर फिल्टर करता येत नाही; त्यासाठीच HAVING आहे.' },
      },
      {
        q: { en: 'Your sweep query on tg_orders returns this row. What is the right conclusion?', mr: 'tg_orders वरची तुमची sweep query ही row देते. योग्य निष्कर्ष कोणता?' },
        code: 'id   | subtotal | discount | delivery_fee | total\n5001 | 120      | 500      | 30           | -350',
        options: [
          { en: 'All fine: the API answered 201', mr: 'सगळं ठीक: API ने 201 दिलं' },
          { en: 'The math is wrong: 120 - 500 + 30 is not -350', mr: 'गणित चुकलं: 120 - 500 + 30 म्हणजे -350 नाही' },
          { en: 'The delivery fee should be 0', mr: 'डिलिव्हरी फी 0 असायला हवी' },
          { en: 'The math adds up, but a negative total breaks the money rule: the coupon has no minimum order. Bug.', mr: 'गणित जुळतं, पण उणा total पैशांचा नियम मोडतो: कूपनला किमान ऑर्डरची अट नाही. बग.' },
        ],
        answer: 3,
        explain: { en: '120 - 500 + 30 = -350, so the formula holds. The total must still be above 0. FLAT500 needs a minimum order of 1000.', mr: '120 - 500 + 30 = -350, म्हणजे सूत्र बरोबर. तरी total 0 पेक्षा जास्तच हवा. FLAT500 ला 1000 ची किमान ऑर्डर हवी.' },
      },
      {
        q: { en: 'When should you run the database check?', mr: 'डेटाबेसची तपासणी कधी करायची?' },
        options: [
          { en: 'Once, at the very end of the release', mr: 'एकदाच, रिलीजच्या अगदी शेवटी' },
          { en: 'Right after each write (POST, PUT, PATCH, DELETE), comparing ids, amounts, counts and statuses', mr: 'प्रत्येक write नंतर लगेच (POST, PUT, PATCH, DELETE), ids, रकमा, संख्या आणि status जुळवत' },
          { en: 'Only when a request fails with 400 or 500', mr: 'request 400 किंवा 500 ने फेल झाली तरच' },
          { en: 'Only after GET requests', mr: 'फक्त GET requests नंतर' },
        ],
        answer: 1,
        explain: { en: 'Writes change data, so check right after them, while you still know the ids. The dangerous bugs come back with 201, not 400.', mr: 'write डेटा बदलतात, म्हणून ids लक्षात असतानाच लगेच तपासा. धोकादायक बग्स 400 नव्हे, 201 घेऊन येतात.' },
      },
    ],
    recap: {
      line: { en: 'The response is the SMS; the database is the passbook. After every write, check the row, the amount, the status and the count.', mr: 'response म्हणजे SMS; डेटाबेस म्हणजे पासबुक. प्रत्येक write नंतर row, रक्कम, status आणि संख्या तपासा.' },
      icon: '📒',
    },
  },
]
