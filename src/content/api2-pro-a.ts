import type { Lesson } from './types.ts'
import { dropField, setField, withStatus } from '../api/mutants.ts'

// API 2: Like a Pro (part A). The learner now works with the TiffinGo Pay team on the same server.
// Negative testing, automated checks with pm.test, chaining requests, and contract testing.

const JSON_HDR = { 'Content-Type': 'application/json' }
const ASHA = { Authorization: 'Bearer tg_asha_9f2c' }
const ASHA_JSON = { 'Content-Type': 'application/json', Authorization: 'Bearer tg_asha_9f2c' }

export const apiProLessonsA: Lesson[] = [
  // ───────────────────────── A2.1 Negative testing
  {
    id: 'ap2-1',
    code: 'A2.1',
    level: 'intermediate',
    title: { en: 'Negative Testing: Breaking It on Purpose', mr: 'Negative Testing: मुद्दाम तोडून पाहणं' },
    skill: 'Negative & boundary testing',
    realLife: {
      place: 'school',
      title: { en: 'The exam hall invigilator', mr: 'परीक्षा हॉलचे पर्यवेक्षक' },
      story: {
        en: 'Board exam day. Patil sir stands at the door of Hall 7 and checks every admit card. One boy has no card: sent to the office. One girl has a card for Hall 3: sent to Hall 3. One card has someone else\'s photo: stopped right there. Only students with a valid card, for this hall, with their own face, walk in. Patil sir is not being rude. He is protecting the exam from bad entries.',
        mr: 'बोर्ड परीक्षेचा दिवस. पाटील सर हॉल 7 च्या दारात उभे राहून प्रत्येकाचं admit card तपासतात. एका मुलाकडे card च नाही: त्याला ऑफिसमध्ये पाठवलं. एका मुलीचं card हॉल 3 चं आहे: तिला हॉल 3 ला पाठवलं. एका card वर दुसऱ्याच कोणाचा फोटो: तिथेच थांबवलं. फक्त वैध card असलेले, याच हॉलचे, स्वतःच्या फोटोचे विद्यार्थी आत जातात. पाटील सर उद्धट नाहीत. ते चुकीच्या entries पासून परीक्षा वाचवत आहेत.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Enter only with a valid admit card, for Hall 7, with your own photo', mr: 'फक्त वैध admit card, हॉल 7 चं, स्वतःच्या फोटोसह असेल तरच प्रवेश' },
        items: [
          { icon: '🧑‍🎓', label: 'Valid card, Hall 7', mr: 'वैध card, हॉल 7', pass: true },
          { icon: '🙅', label: 'No admit card', mr: 'admit card नाही', pass: false },
          { icon: '🏫', label: 'Card for Hall 3', mr: 'हॉल 3 चं card', pass: false },
          { icon: '🖼️', label: "Someone else's photo", mr: 'दुसऱ्याचा फोटो', pass: false },
          { icon: '👩‍🎓', label: 'Valid card, Hall 7', mr: 'वैध card, हॉल 7', pass: true },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'happy', text: { en: 'Welcome to TiffinGo Pay, {name}! Same server, but now we handle the money. Every wrong order here is a wrong bill.', mr: 'TiffinGo Pay मध्ये स्वागत, {name}! सर्व्हर तोच, पण आता आपण पैसे सांभाळतो. इथली प्रत्येक चुकीची ऑर्डर म्हणजे चुकीचं बिल.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'I tested the order API myself. Two dosas, three misal, all worked perfectly.', mr: 'मी स्वतः order API तपासलं. दोन डोसे, तीन मिसळ, सगळं छान चाललं.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'heh. u only tried the happy path. try ordering zero dosas. go on. i dare u.', mr: 'हेहे. तू फक्त happy path तपासलास. शून्य डोसे ऑर्डर करून बघ. चल. हिंमत असेल तर.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'That is our job now, {name}. Be the invigilator. Send the bad entries on purpose and check that the API turns them away.', mr: 'आता हेच आपलं काम आहे, {name}. पर्यवेक्षक बन. मुद्दाम चुकीच्या entries पाठव आणि API त्यांना परत पाठवतं का ते तपास.' } },
      ],
      problem: { en: 'Developers test with good data, so the API works on the happy path. Real users and attackers send empty fields, wrong types and silly numbers, and a weak API saves them as real orders.', mr: 'डेव्हलपर्स चांगल्या डेटाने तपासतात, त्यामुळे happy path वर API चालतं. पण खरे users आणि हल्लेखोर रिकामी fields, चुकीचे types आणि विचित्र आकडे पाठवतात, आणि कमकुवत API त्यांना खऱ्या ऑर्डर म्हणून save करतं.' },
      solution: { en: 'Negative testing sends bad data on purpose. A good API refuses it with a 400 and a clear message. If it says 201 instead, you have found a bug before a customer does.', mr: 'Negative testing मुद्दाम चुकीचा डेटा पाठवतं. चांगलं API तो 400 आणि स्पष्ट message सोबत नाकारतं. त्याऐवजी 201 आलं, तर ग्राहकाआधी तुम्हाला bug सापडला.' },
    },
    lesson: [
      { en: 'A positive test checks that good data works. A negative test checks that bad data is refused. Both matter, but bugs love to hide in the negative side, because developers rarely try it.', mr: 'Positive test तपासतो की चांगला डेटा चालतो. Negative test तपासतो की चुकीचा डेटा नाकारला जातो. दोन्ही महत्त्वाचे, पण bugs ना negative बाजूला लपायला आवडतं, कारण डेव्हलपर्स ती बाजू क्वचितच तपासतात.' },
      { en: 'Four easy kinds of bad data: a missing field (no comment), a wrong type (rating "five" instead of 5), an empty value (comment ""), and a number outside the allowed range (rating 9).', mr: 'चुकीच्या डेटाचे चार सोपे प्रकार: field गायब (comment नाही), चुकीचा type (5 ऐवजी rating "five"), रिकामी value (comment ""), आणि मर्यादेबाहेरचा आकडा (rating 9).' },
      { en: 'Boundary values are where most bugs live. If rating must be 1 to 5, test 0, 1, 5 and 6: just outside, the first allowed, the last allowed, just outside again. A developer who wrote "less than 5" instead of "5 or less" is caught at 5.', mr: 'बहुतेक bugs मर्यादेवर (boundary) राहतात. Rating 1 ते 5 असायला हवं, तर 0, 1, 5 आणि 6 तपासा: अगदी बाहेरचं, पहिलं चालणारं, शेवटचं चालणारं, आणि पुन्हा अगदी बाहेरचं. "5 किंवा कमी" ऐवजी "5 पेक्षा कमी" लिहिणारा डेव्हलपर 5 वर पकडला जातो.' },
      { en: 'What a good refusal looks like: status 400 Bad Request, nothing saved, and a message that names the field and the rule. A 201 means bad data got in. A 500 means the server crashed instead of checking. Both are bugs.', mr: 'चांगला नकार कसा दिसतो: status 400 Bad Request, काहीही save नाही, आणि field व नियम सांगणारा message. 201 म्हणजे चुकीचा डेटा आत गेला. 500 म्हणजे तपासण्याऐवजी सर्व्हर कोसळला. दोन्ही bugs आहेत.' },
    ],
    syntax: {
      template: 'POST /feedback\nContent-Type: application/json\n\n{\n  "restaurantId": 3,\n  "rating": 0,\n  "comment": "Okay"\n}\n\nExpected: 400 Bad Request\n{\n  "error": "VALIDATION",\n  "fields": { "rating": "must be a whole number from 1 to 5" }\n}',
      parts: [
        { code: '"rating": 0', means: { en: 'the bad value on purpose: one step below the smallest allowed (1)', mr: 'मुद्दाम चुकीची value: सगळ्यात लहान चालणाऱ्या (1) पेक्षा एक कमी' } },
        { code: 'Expected: 400', means: { en: 'decide the right answer before you press Send', mr: 'Send दाबण्याआधीच योग्य उत्तर ठरवा' } },
        { code: '"error": "VALIDATION"', means: { en: 'the server says why it refused', mr: 'सर्व्हर नकाराचं कारण सांगतो' } },
        { code: '"fields": { "rating": ... }', means: { en: 'a clear message names the exact field and the rule', mr: 'स्पष्ट message नेमकी field आणि नियम सांगतो' } },
      ],
      example: [
        { code: 'rating 0          -> expect 400', note: { en: 'like a card for the wrong hall: just outside the rule', mr: 'चुकीच्या हॉलच्या card सारखं: नियमाच्या अगदी बाहेर' } },
        { code: 'rating 1, 5       -> expect 201', note: { en: 'the first and last valid students walk in', mr: 'पहिला आणि शेवटचा वैध विद्यार्थी आत जातो' } },
        { code: 'rating 6          -> expect 400', note: { en: 'just outside on the other side', mr: 'दुसऱ्या बाजूने अगदी बाहेर' } },
        { code: 'no "comment"      -> expect 400', note: { en: 'like a student with no admit card', mr: 'admit card नसलेल्या विद्यार्थ्यासारखं' } },
        { code: 'rating "five"     -> expect 400', note: { en: 'wrong type: like a ration card instead of an admit card', mr: 'चुकीचा type: admit card ऐवजी रेशन कार्ड दाखवल्यासारखं' } },
      ],
      exampleNote: { en: 'Write the expected status first, then send. Your test is the gap between what you expected and what came back.', mr: 'आधी अपेक्षित status लिहा, मग पाठवा. अपेक्षित आणि मिळालेलं यातला फरक म्हणजेच तुमची test.' },
      pitfall: { en: 'Do not treat any 2xx as a pass. In negative testing, a 201 Created is the failure: the API let bad data in.', mr: 'प्रत्येक 2xx म्हणजे pass असं समजू नका. Negative testing मध्ये 201 Created म्हणजेच अपयश: API ने चुकीचा डेटा आत येऊ दिला.' },
    },
    practice: {
      intro: { en: 'Time to be Patil sir. Send bad entries on purpose and see who gets turned away, and who sneaks in.', mr: 'आता पाटील सर बनायची वेळ. मुद्दाम चुकीच्या entries पाठवा आणि कोणाला परत पाठवलं जातं, आणि कोण चोरून आत घुसतं ते पाहा.' },
      steps: [
        {
          kind: 'api',
          prompt: { en: 'Ratings must be 1 to 5. Test the lower boundary: change the rating to 0 and press Submit this request. A good API answers 400.', mr: 'Rating 1 ते 5 असायला हवं. खालची boundary तपासा: rating 0 करा आणि Submit this request दाबा. चांगलं API 400 उत्तर देतं.' },
          starter: { method: 'POST', path: '/feedback', headers: { ...JSON_HDR }, body: '{\n  "restaurantId": 3,\n  "rating": 5,\n  "comment": "Okay"\n}' },
          expect: { method: 'POST', path: '/feedback', body: { rating: 0 }, status: 400 },
          solution: { method: 'POST', path: '/feedback', headers: { ...JSON_HDR }, body: '{\n  "restaurantId": 3,\n  "rating": 0,\n  "comment": "Okay"\n}' },
          hints: [
            { en: 'Only one number changes: the rating.', mr: 'फक्त एक आकडा बदलतो: rating.' },
            { en: 'Replace 5 with 0. Keep restaurantId and comment as they are.', mr: '5 ऐवजी 0 लिहा. restaurantId आणि comment तसेच ठेवा.' },
            { en: '"rating": 0', mr: '"rating": 0' },
          ],
          successLine: { en: '400, with "rating": "must be a whole number from 1 to 5". The invigilator did his job. This check passes.', mr: '400, आणि "rating": "must be a whole number from 1 to 5". पर्यवेक्षकाने काम केलं. ही तपासणी pass.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Now the student with no admit card. Remove the comment field completely (keep rating 4) and submit it. Expect 400.', mr: 'आता admit card नसलेला विद्यार्थी. comment field पूर्णपणे काढून टाका (rating 4 ठेवा) आणि Submit करा. 400 अपेक्षित.' },
          starter: { method: 'POST', path: '/feedback', headers: { ...JSON_HDR }, body: '{\n  "restaurantId": 3,\n  "rating": 4,\n  "comment": "Tasty"\n}' },
          expect: { method: 'POST', path: '/feedback', bodyAbsent: ['comment'], status: 400 },
          solution: { method: 'POST', path: '/feedback', headers: { ...JSON_HDR }, body: '{\n  "restaurantId": 3,\n  "rating": 4\n}' },
          hints: [
            { en: 'Delete the whole "comment" line, the name and the value.', mr: '"comment" ची संपूर्ण ओळ काढा, नाव आणि value दोन्ही.' },
            { en: 'Watch the comma: the last field in JSON has no comma after it.', mr: 'comma कडे लक्ष द्या: JSON मधल्या शेवटच्या field नंतर comma नसतो.' },
            { en: '{ "restaurantId": 3, "rating": 4 }', mr: '{ "restaurantId": 3, "rating": 4 }' },
          ],
          successLine: { en: '400 with "comment": "is required". A clear message that names the field. Textbook.', mr: '400 आणि "comment": "is required". field चं नाव सांगणारा स्पष्ट message. अगदी पुस्तकातल्यासारखं.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Gremlin\'s dare. You cannot order zero dosas, so a good API should refuse qty 0 with a 400. Change qty to 0 and submit it. If the server answers 201 Created, you have proved a bug. Capture that proof.', mr: 'Gremlin चं आव्हान. शून्य डोसे ऑर्डर करता येत नाहीत, म्हणून चांगल्या API ने qty 0 ला 400 देऊन नकार द्यायला हवा. qty 0 करा आणि Submit करा. सर्व्हरने 201 Created दिलं, तर तुम्ही bug सिद्ध केला. तो पुरावा मिळवा.' },
          starter: { method: 'POST', path: '/orders', headers: { ...ASHA_JSON }, body: '{\n  "restaurantId": 3,\n  "items": [\n    { "menuItemId": 301, "qty": 1 }\n  ]\n}' },
          expect: { method: 'POST', path: '/orders', headers: { Authorization: '*' }, body: { items: [{ qty: 0 }] }, status: 201 },
          solution: { method: 'POST', path: '/orders', headers: { ...ASHA_JSON }, body: '{\n  "restaurantId": 3,\n  "items": [\n    { "menuItemId": 301, "qty": 0 }\n  ]\n}' },
          hints: [
            { en: 'Change only the qty inside items.', mr: 'items मधली फक्त qty बदला.' },
            { en: 'Keep the Authorization header, or you will get 401 instead of the bug.', mr: 'Authorization header ठेवा, नाहीतर bug ऐवजी 401 मिळेल.' },
            { en: '{ "menuItemId": 301, "qty": 0 }', mr: '{ "menuItemId": 301, "qty": 0 }' },
          ],
          successLine: { en: 'Bug proven. 201 Created: an order for zero Masala Dosas, subtotal 0, total 30. Asha pays 30 rupees delivery for nothing.', mr: 'Bug सिद्ध. 201 Created: शून्य मसाला डोशांची ऑर्डर, subtotal 0, total 30. आशा काहीही न मिळता 30 रुपये delivery भरते.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Theo asks: "So is qty 0 really a bug?" Which bug report would you file?', mr: 'थिओ विचारतो: "मग qty 0 खरंच bug आहे का?" तुम्ही कोणता bug report द्याल?' },
          options: [
            { en: 'No report. 201 means success, so the API worked.', mr: 'Report नाही. 201 म्हणजे यश, म्हणजे API चाललं.' },
            { en: 'Bug, Low severity. Title: "qty 0". No steps.', mr: 'Bug, Low severity. Title: "qty 0". Steps नाहीत.' },
            { en: 'Bug, High severity. Title: "POST /orders accepts qty 0". Steps: POST /orders as Asha with qty 0. Expected: 400 naming qty. Actual: 201, order saved with subtotal 0 and total 30. Request and response attached.', mr: 'Bug, High severity. Title: "POST /orders accepts qty 0". Steps: आशा म्हणून qty 0 सह POST /orders. Expected: qty चं नाव असलेला 400. Actual: 201, subtotal 0 आणि total 30 सह ऑर्डर save. Request आणि response जोडले.' },
            { en: 'Bug, High severity. "Ordering is broken sometimes, please check."', mr: 'Bug, High severity. "Ordering कधीकधी बिघडतं, कृपया पाहा."' },
          ],
          correct: [2],
          explain: { en: 'Bad data got saved and real money moves (the customer is charged delivery, the restaurant gets an empty order, and negative qty could even make negative totals). That is High. A good report has a clear title, exact steps, expected vs actual, and the proof.', mr: 'चुकीचा डेटा save झाला आणि खरे पैसे हलतात (ग्राहकाकडून delivery घेतली जाते, रेस्टॉरंटला रिकामी ऑर्डर जाते, आणि negative qty ने total सुद्धा negative होऊ शकतो). म्हणून High. चांगल्या report मध्ये स्पष्ट title, नेमक्या steps, expected आणि actual, आणि पुरावा असतो.' },
          hints: [
            { en: 'In negative testing, is 201 good news or bad news?', mr: 'Negative testing मध्ये 201 चांगली बातमी की वाईट?' },
            { en: 'Could a developer reproduce the bug from the report alone?', mr: 'फक्त report वाचून डेव्हलपर bug पुन्हा करू शकेल का?' },
            { en: 'Pick the one with steps, expected, actual and proof.', mr: 'steps, expected, actual आणि पुरावा असलेला निवडा.' },
          ],
          successLine: { en: 'Filed. Theo reads it once and says, "Fixing it today."', mr: 'Report दिला. थिओ एकदा वाचतो आणि म्हणतो, "आजच दुरुस्त करतो."' },
        },
        {
          kind: 'choice',
          prompt: { en: 'For POST /feedback, which of these are negative tests? Pick all that apply.', mr: 'POST /feedback साठी यापैकी negative tests कोणत्या? लागू असलेल्या सगळ्या निवडा.' },
          options: [
            { en: 'rating 6', mr: 'rating 6' },
            { en: 'rating "five" (text instead of a number)', mr: 'rating "five" (आकड्याऐवजी text)' },
            { en: 'A comment longer than the 280-character limit', mr: '280 अक्षरांच्या मर्यादेपेक्षा मोठा comment' },
            { en: 'rating 5 with a nice comment', mr: 'छान comment सह rating 5' },
            { en: 'rating 3 for restaurant 3', mr: 'रेस्टॉरंट 3 साठी rating 3' },
          ],
          correct: [0, 1, 2],
          explain: { en: 'Out of range, wrong type and too long are all bad data that must be refused. Rating 5 and rating 3 are valid, so those are positive tests.', mr: 'मर्यादेबाहेर, चुकीचा type आणि खूप मोठा, हे सगळे चुकीचे डेटा आहेत आणि नाकारले गेले पाहिजेत. Rating 5 आणि rating 3 वैध आहेत, म्हणून त्या positive tests आहेत.' },
          hints: [
            { en: 'A negative test sends data the API should refuse.', mr: 'Negative test असा डेटा पाठवते जो API ने नाकारायला हवा.' },
            { en: 'Which values break a rule: range, type or length?', mr: 'कोणत्या values नियम मोडतात: मर्यादा, type किंवा लांबी?' },
            { en: 'Three of the five break a rule.', mr: 'पाचपैकी तीन नियम मोडतात.' },
          ],
        },
      ],
    },
    exam: [
      {
        q: { en: 'Ratings must be 1 to 5. Which set tests the boundaries best?', mr: 'Rating 1 ते 5 असायला हवं. Boundaries सगळ्यात चांगल्या कोणत्या संचाने तपासल्या जातात?' },
        options: ['1, 2, 3', '0, 1, 5, 6', '3', '100, 200'],
        answer: 1,
        explain: { en: 'Just outside, first valid, last valid, just outside again. That is where off-by-one bugs hide.', mr: 'अगदी बाहेर, पहिलं वैध, शेवटचं वैध, पुन्हा अगदी बाहेर. off-by-one bugs तिथेच लपतात.' },
      },
      {
        q: { en: 'You send this. Which response means the API did its job?', mr: 'तुम्ही हे पाठवता. कोणता response म्हणजे API ने त्याचं काम केलं?' },
        code: 'POST /feedback\nContent-Type: application/json\n\n{ "restaurantId": 3, "rating": "five", "comment": "Nice" }',
        options: [
          '201 Created',
          '500 Internal Server Error',
          '200 OK',
          { en: '400 Bad Request with a message about rating', mr: 'rating बद्दल message सह 400 Bad Request' },
        ],
        answer: 3,
        explain: { en: '"five" is the wrong type. The API must refuse it with a 4xx and say which field is wrong.', mr: '"five" चुकीचा type आहे. API ने तो 4xx देऊन नाकारायला हवा आणि कोणती field चुकीची ते सांगायला हवं.' },
      },
      {
        q: { en: 'A request with a missing field gets 500 Internal Server Error. Is that fine?', mr: 'field गायब असलेल्या request ला 500 Internal Server Error मिळतो. हे ठीक आहे का?' },
        options: [
          { en: 'No. Bad input should get a 400 with a clear message. A 500 means the server crashed instead of checking.', mr: 'नाही. चुकीच्या input ला स्पष्ट message सह 400 मिळायला हवा. 500 म्हणजे तपासण्याऐवजी सर्व्हर कोसळला.' },
          { en: 'Yes. Any error code means it was refused.', mr: 'हो. कोणताही error code म्हणजे नकारच.' },
          { en: 'Yes, 500 is the right code for missing fields.', mr: 'हो, गायब fields साठी 500 हाच योग्य code आहे.' },
          { en: 'Only if it happens twice.', mr: 'दोनदा झालं तरच.' },
        ],
        answer: 0,
        explain: { en: 'The client made the mistake, so the answer is 4xx. A 500 is a separate bug: the server did not handle bad input.', mr: 'चूक client ची आहे, म्हणून उत्तर 4xx. 500 हा वेगळा bug आहे: सर्व्हरने चुकीचा input हाताळला नाही.' },
      },
      {
        q: { en: 'Negative testing means...', mr: 'Negative testing म्हणजे...' },
        options: [
          { en: 'Testing with a bad mood', mr: 'वाईट मूडमध्ये तपासणं' },
          { en: 'Only checking that good data works', mr: 'फक्त चांगला डेटा चालतो हे तपासणं' },
          { en: 'Sending bad data on purpose and checking that the API refuses it clearly', mr: 'मुद्दाम चुकीचा डेटा पाठवून API तो स्पष्टपणे नाकारतं का ते तपासणं' },
          { en: 'Deleting data from the server', mr: 'सर्व्हरवरचा डेटा delete करणं' },
        ],
        answer: 2,
        explain: { en: 'Be the invigilator: try the wrong admit cards and make sure none get in.', mr: 'पर्यवेक्षक बना: चुकीची admit cards वापरून पाहा आणि एकही आत जात नाही याची खात्री करा.' },
      },
    ],
    recap: { line: { en: 'Send bad data on purpose: missing, wrong type, empty, out of range. A good API says 400 with a clear message. A 201 is a bug.', mr: 'मुद्दाम चुकीचा डेटा पाठवा: गायब, चुकीचा type, रिकामा, मर्यादेबाहेर. चांगलं API स्पष्ट message सह 400 देतं. 201 म्हणजे bug.' }, icon: '🚫' },
  },

  // ───────────────────────── A2.2 pm.test
  {
    id: 'ap2-2',
    code: 'A2.2',
    level: 'intermediate',
    title: { en: 'Automated Checks with pm.test', mr: 'pm.test ने आपोआप तपासणी' },
    skill: 'Postman tests (pm.test)',
    realLife: {
      place: 'home',
      title: { en: 'The school bag checklist', mr: 'शाळेच्या दप्तराची यादी' },
      story: {
        en: 'Every morning at 7:30, Sunita tai checks her son Aarav\'s school bag against the same list stuck on the fridge: books, tiffin, water bottle, ID card. She does not trust memory. She does not skip a line because yesterday was fine. One Monday the bottle is missing. The list catches it at the door, not at lunchtime when Aarav is thirsty.',
        mr: 'रोज सकाळी 7:30 ला सुनीता ताई फ्रीजवर चिकटवलेल्या त्याच यादीनुसार मुलाचं, आरवचं, दप्तर तपासतात: पुस्तकं, डबा, पाण्याची बाटली, ओळखपत्र. त्या आठवणीवर विसंबत नाहीत. काल सगळं ठीक होतं म्हणून एखादी ओळ सोडत नाहीत. एका सोमवारी बाटली नसते. यादी ती दारातच पकडते, जेवणाच्या सुट्टीत आरवला तहान लागल्यावर नाही.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📚', label: 'Books', mr: 'पुस्तकं' },
          { icon: '🍱', label: 'Tiffin', mr: 'डबा' },
          { icon: '🧴', label: 'Water bottle', mr: 'पाण्याची बाटली' },
          { icon: '🪪', label: 'ID card', mr: 'ओळखपत्र' },
          { icon: '🎒', label: 'Bag ready', mr: 'दप्तर तयार' },
        ],
        breakAt: 2,
        breakNote: { en: 'Bottle missing! Caught at the door, not at lunchtime.', mr: 'बाटली नाही! दारातच पकडलं, जेवणाच्या सुट्टीत नाही.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'worried', text: { en: 'I changed one line in the order code last night. Now I have to click through all 40 requests again to be sure nothing else broke.', mr: 'काल रात्री मी order code मधली एक ओळ बदलली. आता काही बिघडलं नाही याची खात्री करायला सगळ्या 40 requests पुन्हा क्लिक करून पाहाव्या लागतील.' } },
        { who: 'rex', mood: 'smug', text: { en: 'Or you write the checks once and let Postman run them every time. Humans get tired. Scripts do not.', mr: 'किंवा तपासण्या एकदाच लिहायच्या आणि Postman ला दर वेळी चालवू द्यायच्या. माणसं थकतात. Scripts थकत नाहीत.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'lol. u checked the status yesterday. did u check the total today? i changed it. maybe.', mr: 'हाहा. काल तू status तपासलास. आज total तपासलास का? मी तो बदलला. कदाचित.' } },
        { who: 'meera', mood: 'happy', text: { en: 'That is what the Tests tab is for, {name}. It is Sunita tai\'s fridge list, for an API.', mr: 'Tests tab त्यासाठीच आहे, {name}. ती सुनीता ताईंची फ्रीजवरची यादी आहे, API साठी.' } },
      ],
      problem: { en: 'Reading every response by eye is slow and people miss things, especially on the hundredth run. A change in one place can quietly break something that worked yesterday (a regression).', mr: 'प्रत्येक response डोळ्यांनी वाचणं हळू आहे आणि माणसं गोष्टी चुकवतात, विशेषतः शंभराव्या वेळी. एका ठिकाणचा बदल कालपर्यंत चालणारी गोष्ट गुपचूप बिघडवू शकतो (regression).' },
      solution: { en: 'Postman tests are small checks written in JavaScript. They run after every request and say pass or fail, the same way every time, so a regression shows up in red the moment it happens.', mr: 'Postman tests म्हणजे JavaScript मध्ये लिहिलेल्या छोट्या तपासण्या. त्या प्रत्येक request नंतर चालतात आणि दर वेळी त्याच पद्धतीने pass किंवा fail सांगतात, त्यामुळे regression झाला की लगेच लाल रंगात दिसतो.' },
    },
    lesson: [
      { en: 'Every request in Postman has a Tests tab (newer versions call it Scripts, Post-response). Code you write there runs right after the response arrives.', mr: 'Postman मधल्या प्रत्येक request ला Tests tab असतो (नवीन versions मध्ये त्याला Scripts, Post-response म्हणतात). तिथे लिहिलेला code response आल्यावर लगेच चालतो.' },
      { en: 'One check looks like this: pm.test("a name", () => { ... }). The name is what you read in the results. Inside, pm.expect(value) says what must be true, for example pm.expect(order.total).to.equal(350).', mr: 'एक तपासणी अशी दिसते: pm.test("नाव", () => { ... }). Results मध्ये तुम्हाला हेच नाव दिसतं. आत, pm.expect(value) काय खरं असायला हवं ते सांगतं, उदाहरणार्थ pm.expect(order.total).to.equal(350).' },
      { en: 'pm.response.to.have.status(200) checks the status. pm.response.json() gives you the body, so you can check each field: its value (equal), its type (a("number")), or a range (above(0)).', mr: 'pm.response.to.have.status(200) status तपासतो. pm.response.json() body देतो, म्हणजे प्रत्येक field तपासता येते: तिची value (equal), तिचा type (a("number")), किंवा मर्यादा (above(0)).' },
      { en: 'A status check alone is weak: a 200 with the wrong price is still a bug. Good tests check the fields people actually see and pay for. A test that never fails, even when the data is wrong, protects nobody.', mr: 'फक्त status तपासणं कमकुवत आहे: चुकीच्या किमतीसह 200 सुद्धा bug च आहे. चांगल्या tests लोक प्रत्यक्ष पाहतात आणि ज्यासाठी पैसे भरतात त्या fields तपासतात. डेटा चुकीचा असूनही कधीच fail न होणारी test कोणालाच वाचवत नाही.' },
    ],
    syntax: {
      template: 'pm.test("Status is 200", () => {\n  pm.response.to.have.status(200)\n})\n\nconst order = pm.response.json()\n\npm.test("Total is 350", () => {\n  pm.expect(order.total).to.be.a("number")\n  pm.expect(order.total).to.equal(350)\n})',
      parts: [
        { code: 'pm.test("name", () => { ... })', means: { en: 'one line on the checklist, with a name you will read in the results', mr: 'यादीतली एक ओळ, नावासह, जे results मध्ये दिसतं' } },
        { code: 'pm.response.to.have.status(200)', means: { en: 'the status must be exactly 200', mr: 'status नेमका 200 असायला हवा' } },
        { code: 'pm.response.json()', means: { en: 'the response body as an object you can read', mr: 'response body, वाचता येईल अशा object स्वरूपात' } },
        { code: 'pm.expect(x).to.equal(y)', means: { en: 'x must be exactly y, or the test fails', mr: 'x नेमका y असायला हवा, नाहीतर test fail' } },
        { code: '.to.be.a("number")', means: { en: 'checks the type: "number", "string", "boolean", "object", "array"', mr: 'type तपासतो: "number", "string", "boolean", "object", "array"' } },
      ],
      example: [
        { code: 'pm.test("Status is 200", () => pm.response.to.have.status(200))', note: { en: 'the bag is there at all', mr: 'दप्तर आहे की नाही' } },
        { code: 'const r = pm.response.json()', note: { en: 'open the bag', mr: 'दप्तर उघडा' } },
        { code: 'pm.test("Name", () => pm.expect(r.name).to.equal("Dosa Corner"))', note: { en: 'the right books, not someone else\'s', mr: 'योग्य पुस्तकं, दुसऱ्याची नाहीत' } },
        { code: 'pm.test("Veg", () => pm.expect(r.veg).to.be.true)', note: { en: 'the tiffin has what we promised', mr: 'डब्यात ठरलेलंच आहे' } },
        { code: 'pm.test("Rating", () => pm.expect(r.rating).to.be.within(1, 5))', note: { en: 'a range check, like "bottle is full enough"', mr: 'मर्यादा तपासणी, "बाटली पुरेशी भरलेली" सारखी' } },
      ],
      exampleNote: { en: 'One test per idea, with a clear name. When one fails, the name tells you exactly what broke.', mr: 'एका कल्पनेसाठी एक test, स्पष्ट नावासह. एखादी fail झाली की नावावरूनच नेमकं काय बिघडलं ते कळतं.' },
      pitfall: { en: 'Text must match exactly: "Dosa Corner" and "Dosa Korner" are different. And to.equal checks type too, so 350 and "350" are not equal.', mr: 'Text नेमका जुळायला हवा: "Dosa Corner" आणि "Dosa Korner" वेगळे आहेत. आणि to.equal type सुद्धा तपासतो, म्हणून 350 आणि "350" समान नाहीत.' },
    },
    practice: {
      intro: { en: 'Write the checklist once. Press Run tests to try your script on the real response. Then press Submit tests: we plant bugs in the response (wrong name, wrong total, wrong status) and your tests must catch every one.', mr: 'यादी एकदा लिहा. खऱ्या response वर script चालवून पाहायला Run tests दाबा. मग Submit tests दाबा: आम्ही response मध्ये bugs पेरू (चुकीचं नाव, चुकीचा total, चुकीचा status) आणि तुमच्या tests ने प्रत्येक पकडायला हवा.' },
      steps: [
        {
          kind: 'test',
          prompt: { en: 'GET /restaurants/3 returns Dosa Corner. The starter only checks the status. Add tests so that a wrong name or a wrong veg flag also fails.', mr: 'GET /restaurants/3 Dosa Corner परत करतो. Starter फक्त status तपासतो. चुकीचं नाव किंवा चुकीचा veg flag आला तरी fail होईल अशा tests जोडा.' },
          request: { method: 'GET', path: '/restaurants/3' },
          starter: '// Checklist for Dosa Corner.\n// The status test is done. Add one test for the name ("Dosa Corner")\n// and one for veg (it must be true).\n// Tip: const r = pm.response.json()\n\npm.test("Status is 200", () => {\n  pm.response.to.have.status(200)\n})\n',
          solution: 'pm.test("Status is 200", () => {\n  pm.response.to.have.status(200)\n})\n\nconst r = pm.response.json()\n\npm.test("Name is Dosa Corner", () => {\n  pm.expect(r.name).to.equal("Dosa Corner")\n})\n\npm.test("It is veg", () => {\n  pm.expect(r.veg).to.be.true\n})\n',
          mutants: [
            { label: { en: 'Server error: status 500', mr: 'सर्व्हर error: status 500' }, patch: withStatus(500) },
            { label: { en: 'Name has a typo: "Dosa Korner"', mr: 'नावात चूक: "Dosa Korner"' }, patch: setField('name', 'Dosa Korner') },
            { label: { en: 'Veg flag flipped to false', mr: 'veg flag false झाला' }, patch: setField('veg', false) },
          ],
          hints: [
            { en: 'Read the body first: const r = pm.response.json()', mr: 'आधी body वाचा: const r = pm.response.json()' },
            { en: 'Use pm.expect(r.name).to.equal(...) with the exact name.', mr: 'नेमक्या नावासह pm.expect(r.name).to.equal(...) वापरा.' },
            { en: 'For veg: pm.expect(r.veg).to.be.true', mr: 'veg साठी: pm.expect(r.veg).to.be.true' },
            { en: 'pm.test("Name is Dosa Corner", () => { pm.expect(r.name).to.equal("Dosa Corner") })', mr: 'pm.test("Name is Dosa Corner", () => { pm.expect(r.name).to.equal("Dosa Corner") })' },
          ],
          successLine: { en: 'Every planted bug turned red. That checklist will never get tired.', mr: 'पेरलेला प्रत्येक bug लाल झाला. ही यादी कधीच थकणार नाही.' },
        },
        {
          kind: 'test',
          prompt: { en: 'Now money. GET /orders/4001 is Asha\'s delivered order: total 350, status DELIVERED. Write tests that catch a wrong total, a total sent as text, a wrong order status (the "status" field) and a 404.', mr: 'आता पैसे. GET /orders/4001 ही आशाची delivered ऑर्डर: total 350, status DELIVERED. चुकीचा total, text म्हणून आलेला total, चुकीचा order status ("status" field) आणि 404 पकडतील अशा tests लिहा.' },
          request: { method: 'GET', path: '/orders/4001', headers: { ...ASHA } },
          starter: '// Order 4001 should have total 350 (a number) and status "DELIVERED".\n// Add tests for the total and for the order status.\n\npm.test("Status code is 200", () => {\n  pm.response.to.have.status(200)\n})\n',
          solution: 'pm.test("Status code is 200", () => {\n  pm.response.to.have.status(200)\n})\n\nconst order = pm.response.json()\n\npm.test("Total is the number 350", () => {\n  pm.expect(order.total).to.be.a("number")\n  pm.expect(order.total).to.equal(350)\n})\n\npm.test("Order is delivered", () => {\n  pm.expect(order.status).to.equal("DELIVERED")\n})\n',
          mutants: [
            { label: { en: 'Total became -350', mr: 'Total -350 झाला' }, patch: setField('total', -350) },
            { label: { en: 'Total sent as text "350"', mr: 'Total text "350" म्हणून आला' }, patch: setField('total', '350') },
            { label: { en: 'Order status went back to PLACED', mr: 'ऑर्डर status परत PLACED झाला' }, patch: setField('status', 'PLACED') },
            { label: { en: 'Order not found: 404', mr: 'ऑर्डर सापडली नाही: 404' }, patch: withStatus(404) },
          ],
          hints: [
            { en: 'Careful: the HTTP status code and the order\'s "status" field are two different things.', mr: 'लक्ष द्या: HTTP status code आणि ऑर्डरची "status" field या दोन वेगळ्या गोष्टी आहेत.' },
            { en: 'to.equal(350) already fails for "350", because the types differ. Adding to.be.a("number") makes the reason clearer.', mr: 'to.equal(350) "350" साठी आधीच fail होतो, कारण types वेगळे आहेत. to.be.a("number") जोडल्याने कारण अधिक स्पष्ट होतं.' },
            { en: 'const order = pm.response.json(), then pm.expect(order.total).to.equal(350)', mr: 'const order = pm.response.json(), मग pm.expect(order.total).to.equal(350)' },
            { en: 'pm.test("Order is delivered", () => { pm.expect(order.status).to.equal("DELIVERED") })', mr: 'pm.test("Order is delivered", () => { pm.expect(order.status).to.equal("DELIVERED") })' },
          ],
          successLine: { en: 'Gremlin changed the total. Your tests went red in one second. Regression caught.', mr: 'Gremlin ने total बदलला. तुमच्या tests एका सेकंदात लाल झाल्या. Regression पकडला.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'After Theo\'s change, the runner shows: PASS "Status code is 200", FAIL "Total is the number 350" with the message: expected -350 to equal 350. What does this tell you?', mr: 'थिओच्या बदलानंतर runner दाखवतो: PASS "Status code is 200", FAIL "Total is the number 350", message: expected -350 to equal 350. यावरून काय कळतं?' },
          options: [
            { en: 'The test is broken. Delete it so the run is green again.', mr: 'Test बिघडली आहे. Run पुन्हा हिरवा व्हावा म्हणून ती delete करा.' },
            { en: 'The server answered 200 but sent total -350 instead of 350. That is a regression to report, with this result as proof.', mr: 'सर्व्हरने 200 दिलं पण 350 ऐवजी total -350 पाठवला. हा report करायचा regression आहे, आणि हा result पुरावा.' },
            { en: 'Everything is fine, because the status is 200.', mr: 'सगळं ठीक आहे, कारण status 200 आहे.' },
            { en: 'The server is down.', mr: 'सर्व्हर बंद आहे.' },
          ],
          correct: [1],
          explain: { en: '"expected -350 to equal 350" means the real value was -350. The status test passing shows why status checks alone are not enough. Never delete a red test to make the run green; report the bug.', mr: '"expected -350 to equal 350" म्हणजे खरी value -350 होती. Status test pass झाली, यावरून कळतं की फक्त status तपासणं पुरेसं नाही. Run हिरवा करण्यासाठी लाल test कधीही delete करू नका; bug report करा.' },
          hints: [
            { en: 'In "expected A to equal B", A is what the server really sent.', mr: '"expected A to equal B" मध्ये A म्हणजे सर्व्हरने खरोखर पाठवलेलं.' },
            { en: 'Did the request fail, or did it succeed with wrong data?', mr: 'Request fail झाली, की चुकीच्या डेटासह यशस्वी झाली?' },
          ],
        },
      ],
    },
    exam: [
      {
        q: { en: 'The response comes back as 404. What happens to this test?', mr: 'Response 404 येतो. या test चं काय होतं?' },
        code: 'pm.test("Status is 200", () => {\n  pm.response.to.have.status(200)\n})',
        options: [
          { en: 'It passes', mr: 'ती pass होते' },
          { en: 'It fails: expected status code 200 but got 404', mr: 'ती fail होते: expected status code 200 but got 404' },
          { en: 'Postman sends the request again', mr: 'Postman request पुन्हा पाठवतो' },
          { en: 'Nothing, tests only run on 200', mr: 'काहीच नाही, tests फक्त 200 वर चालतात' },
        ],
        answer: 1,
        explain: { en: 'Tests run on every response. 404 is not 200, so it fails with a message that shows both values.', mr: 'Tests प्रत्येक response वर चालतात. 404 म्हणजे 200 नाही, म्हणून दोन्ही values दाखवणाऱ्या message सह ती fail होते.' },
      },
      {
        q: { en: 'Which line checks that total is a number?', mr: 'total हा number आहे हे कोणती ओळ तपासते?' },
        options: [
          'pm.response.to.have.status(200)',
          'pm.expect(order.total).to.exist',
          'pm.expect(order).to.have.property("total")',
          'pm.expect(order.total).to.be.a("number")',
        ],
        answer: 3,
        explain: { en: 'to.be.a("number") checks the type. The others pass even if total is "350" as text.', mr: 'to.be.a("number") type तपासतो. बाकीच्या, total "350" असा text असला तरी pass होतात.' },
      },
      {
        q: { en: 'Why do automated tests catch regressions so well?', mr: 'Automated tests regressions इतक्या चांगल्या का पकडतात?' },
        options: [
          { en: 'They run the same checks after every change, without getting tired, so anything that used to work and now breaks shows up at once', mr: 'त्या प्रत्येक बदलानंतर न थकता त्याच तपासण्या चालवतात, त्यामुळे आधी चालणारी आणि आता बिघडलेली गोष्ट लगेच दिसते' },
          { en: 'They fix the bugs themselves', mr: 'त्या स्वतःच bugs दुरुस्त करतात' },
          { en: 'They make the server faster', mr: 'त्या सर्व्हर वेगवान करतात' },
          { en: 'They only run once, before release', mr: 'त्या फक्त एकदाच, रिलीजआधी चालतात' },
        ],
        answer: 0,
        explain: { en: 'Like the fridge list: same lines, every morning. Tests report problems; people fix them.', mr: 'फ्रीजवरच्या यादीसारखं: त्याच ओळी, रोज सकाळी. Tests प्रश्न सांगतात; माणसं दुरुस्त करतात.' },
      },
      {
        q: { en: 'Which total would make this test fail?', mr: 'कोणत्या total मुळे ही test fail होईल?' },
        code: 'const o = pm.response.json()\npm.test("Total is positive", () => {\n  pm.expect(o.total).to.be.above(0)\n})',
        options: ['350', '1', '0', '999'],
        answer: 2,
        explain: { en: 'above(0) means strictly greater than 0. Zero is not above zero, so the test fails.', mr: 'above(0) म्हणजे 0 पेक्षा नक्की जास्त. शून्य शून्यापेक्षा जास्त नाही, म्हणून test fail होते.' },
      },
    ],
    recap: { line: { en: 'pm.test + pm.expect = a checklist that runs after every request. Check fields and types, not only the status.', mr: 'pm.test + pm.expect = प्रत्येक request नंतर चालणारी यादी. फक्त status नाही, fields आणि types सुद्धा तपासा.' }, icon: '🎒' },
  },

  // ───────────────────────── A2.3 Chaining requests
  {
    id: 'ap2-3',
    code: 'A2.3',
    level: 'intermediate',
    title: { en: 'Chaining Requests: Use One Answer in the Next Question', mr: 'Requests ची साखळी: एका उत्तराचा पुढच्या प्रश्नात वापर' },
    skill: 'Request chaining & variables',
    realLife: {
      place: 'bank',
      title: { en: 'Token number 42 at the bank', mr: 'बँकेतला टोकन नंबर 42' },
      story: {
        en: 'Aaji goes to the bank to withdraw her pension. At the first counter the clerk checks her passbook and hands her token number 42. She waits. When the board shows 42, she walks to the cash counter and shows the token. The cashier does not ask everything again. Token 42 already says who she is and what she wants. One counter\'s answer becomes the next counter\'s question.',
        mr: 'आजी पेन्शन काढायला बँकेत जातात. पहिल्या counter वर कारकून त्यांचं पासबुक तपासतो आणि टोकन नंबर 42 देतो. त्या थांबतात. बोर्डवर 42 दिसल्यावर त्या cash counter ला जाऊन टोकन दाखवतात. कॅशियर सगळं पुन्हा विचारत नाही. टोकन 42 वरूनच कळतं त्या कोण आहेत आणि त्यांना काय हवं. एका counter चं उत्तर पुढच्या counter चा प्रश्न बनतं.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📘', label: 'Show passbook', mr: 'पासबुक दाखवा' },
          { icon: '🎟️', label: 'Get token 42', mr: 'टोकन 42 मिळवा' },
          { icon: '📺', label: 'Board shows 42', mr: 'बोर्डवर 42' },
          { icon: '🪪', label: 'Show token 42 at cash', mr: 'cash counter ला टोकन 42' },
          { icon: '💵', label: 'Pension in hand', mr: 'पेन्शन हातात' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'neutral', text: { en: 'Customers say cancelling a fresh order sometimes fails. I need the whole journey tested: log in, order, check it, cancel it.', mr: 'ग्राहक म्हणतात नवी ऑर्डर रद्द करणं कधीकधी fail होतं. मला संपूर्ण प्रवास तपासून हवा: login, ऑर्डर, ती तपासणं, रद्द करणं.' } },
        { who: 'you', mood: 'surprised', text: { en: 'But the order id does not exist until I place the order. How do I write the next request before I know it?', mr: 'पण ऑर्डर दिल्याशिवाय order id अस्तित्वातच नसतो. तो कळण्याआधी पुढची request कशी लिहू?' } },
        { who: 'meera', mood: 'happy', text: { en: 'Like aaji\'s token. Each response hands you a value, and you show it at the next counter. That is chaining.', mr: 'आजींच्या टोकनसारखं. प्रत्येक response तुम्हाला एक value देतो, आणि ती तुम्ही पुढच्या counter ला दाखवता. यालाच chaining म्हणतात.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'hardcode order 4003 in every test. what could go wrong. hehe.', mr: 'प्रत्येक test मध्ये order 4003 hardcode कर. काय बिघडणार आहे. हेहे.' } },
      ],
      problem: { en: 'A real feature is a journey of several requests. New ids appear only at run time, and a test with a fixed old id tests the wrong order or fails the second time it runs.', mr: 'खरं feature म्हणजे अनेक requests चा प्रवास असतो. नवे ids फक्त चालवतानाच तयार होतात, आणि जुना ठरलेला id असलेली test चुकीची ऑर्डर तपासते किंवा दुसऱ्यांदा चालवल्यावर fail होते.' },
      solution: { en: 'Chain the requests: take the token from the login response and the id from the order response, and feed each one into the next call. Postman stores them in variables so the chain runs on its own.', mr: 'Requests ची साखळी करा: login response मधून token आणि order response मधून id घ्या, आणि प्रत्येक पुढच्या call मध्ये वापरा. Postman त्या variables मध्ये ठेवतो, त्यामुळे साखळी आपोआप चालते.' },
    },
    lesson: [
      { en: 'A chain is a row of requests where each one needs something from the one before: login gives a token, the token lets you place an order, the order gives an id, the id lets you read or cancel that order.', mr: 'साखळी म्हणजे requests ची अशी रांग जिथे प्रत्येकीला आधीच्या request कडून काहीतरी हवं असतं: login token देतो, token ने ऑर्डर देता येते, ऑर्डर id देते, id ने ती ऑर्डर वाचता किंवा रद्द करता येते.' },
      { en: 'In Postman you save a value in the Tests tab of one request: pm.environment.set("orderId", pm.response.json().id). In the next request you write {{orderId}} in the URL, and Postman fills in the real number.', mr: 'Postman मध्ये एका request च्या Tests tab मध्ये value save करतात: pm.environment.set("orderId", pm.response.json().id). पुढच्या request च्या URL मध्ये {{orderId}} लिहायचं, आणि Postman खरा आकडा भरतो.' },
      { en: 'In this console there are no variables, so you do the copying yourself: read the value in the response and type it into the next request. Same idea, by hand.', mr: 'या console मध्ये variables नाहीत, म्हणून copy तुम्हीच करायचं: response मधली value वाचा आणि पुढच्या request मध्ये टाइप करा. कल्पना तीच, हाताने.' },
      { en: 'The tester\'s angle: check every link. Does the id you got really open the order you made? Does the cancel work on the new order? When a chain breaks, report which step broke and what value was passed in.', mr: 'टेस्टरची नजर: प्रत्येक कडी तपासा. मिळालेल्या id ने खरंच तुमची ऑर्डर उघडते का? नव्या ऑर्डरवर cancel चालतं का? साखळी तुटली, तर कोणती step तुटली आणि कोणती value पाठवली ते report करा.' },
    ],
    syntax: {
      template: '// 1. POST /auth/login  (Tests tab)\npm.environment.set("token", pm.response.json().token)\n\n// 2. POST /orders  with header  Authorization: Bearer {{token}}\n//    (Tests tab)\npm.environment.set("orderId", pm.response.json().id)\n\n// 3. GET /orders/{{orderId}}\n// 4. PATCH /orders/{{orderId}}   { "status": "CANCELLED" }',
      parts: [
        { code: 'pm.environment.set("token", ...)', means: { en: 'save a value under a name, like writing the token number on your palm', mr: 'value एका नावाने save करा, हातावर टोकन नंबर लिहिल्यासारखं' } },
        { code: 'pm.response.json().id', means: { en: 'the value to save: the id field of this response', mr: 'save करायची value: या response ची id field' } },
        { code: '{{orderId}}', means: { en: 'use the saved value here; Postman swaps in the real number', mr: 'save केलेली value इथे वापरा; Postman खरा आकडा टाकतो' } },
        { code: 'Bearer {{token}}', means: { en: 'the login token passed into the next request', mr: 'login token पुढच्या request मध्ये पाठवला' } },
      ],
      example: [
        { code: 'POST /auth/login           -> token tg_asha_9f2c', note: { en: 'show the passbook, get the token', mr: 'पासबुक दाखवा, टोकन मिळवा' } },
        { code: 'POST /orders (Bearer token) -> id 5001', note: { en: 'first counter gives you number 42', mr: 'पहिला counter नंबर 42 देतो' } },
        { code: 'GET /orders/5001           -> 200', note: { en: 'the board shows your number', mr: 'बोर्डवर तुमचा नंबर दिसतो' } },
        { code: 'PATCH /orders/5001         -> CANCELLED', note: { en: 'show the token at the cash counter', mr: 'cash counter ला टोकन दाखवा' } },
      ],
      exampleNote: { en: 'Each arrow is a value that travels to the next line. Break one arrow and every later step fails.', mr: 'प्रत्येक बाण म्हणजे पुढच्या ओळीत जाणारी value. एक बाण तुटला की पुढच्या सगळ्या steps fail होतात.' },
      pitfall: { en: 'Do not hardcode an old id like 4003. Always use the id from this run\'s response, or your test checks someone else\'s order.', mr: '4003 सारखा जुना id hardcode करू नका. नेहमी या run च्या response मधला id वापरा, नाहीतर तुमची test दुसऱ्याच कोणाची ऑर्डर तपासते.' },
    },
    practice: {
      intro: { en: 'Run Sam\'s whole journey. Each step needs a value from the step before. Read every response carefully: you are the variable today.', mr: 'Sam चा संपूर्ण प्रवास चालवा. प्रत्येक step ला आधीच्या step ची value हवी. प्रत्येक response नीट वाचा: आज variable तुम्हीच आहात.' },
      steps: [
        {
          kind: 'api',
          prompt: { en: 'Counter 1: log in as Asha (username asha, password chai123). Note the token in the response.', mr: 'Counter 1: आशा म्हणून login करा (username asha, password chai123). Response मधला token लक्षात ठेवा.' },
          starter: { method: 'POST', path: '/auth/login', headers: { ...JSON_HDR }, body: '{\n  "username": "",\n  "password": ""\n}' },
          expect: { method: 'POST', path: '/auth/login', body: { username: 'asha' }, status: 200 },
          solution: { method: 'POST', path: '/auth/login', headers: { ...JSON_HDR }, body: '{\n  "username": "asha",\n  "password": "chai123"\n}' },
          hints: [
            { en: 'Fill in both values inside the quotes.', mr: 'quotes च्या आत दोन्ही values भरा.' },
            { en: '{ "username": "asha", "password": "chai123" }', mr: '{ "username": "asha", "password": "chai123" }' },
          ],
          successLine: { en: 'Token received: tg_asha_9f2c. That is your token number 42.', mr: 'Token मिळाला: tg_asha_9f2c. हाच तुमचा टोकन नंबर 42.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Pass the token on. Paste it after "Bearer " in the Authorization header and place the order. Note the new order id in the response.', mr: 'Token पुढे द्या. Authorization header मध्ये "Bearer " नंतर तो paste करा आणि ऑर्डर द्या. Response मधला नवा order id लक्षात ठेवा.' },
          starter: { method: 'POST', path: '/orders', headers: { ...JSON_HDR, Authorization: 'Bearer ' }, body: '{\n  "restaurantId": 3,\n  "items": [\n    { "menuItemId": 301, "qty": 2 }\n  ]\n}' },
          expect: { method: 'POST', path: '/orders', headers: { Authorization: 'Bearer tg_asha_9f2c' }, status: 201 },
          solution: { method: 'POST', path: '/orders', headers: { ...ASHA_JSON }, body: '{\n  "restaurantId": 3,\n  "items": [\n    { "menuItemId": 301, "qty": 2 }\n  ]\n}' },
          hints: [
            { en: 'The token comes from the login response of the step before.', mr: 'Token आधीच्या step च्या login response मधून येतो.' },
            { en: 'Keep one space between Bearer and the token.', mr: 'Bearer आणि token मध्ये एक space ठेवा.' },
            { en: 'Bearer tg_asha_9f2c', mr: 'Bearer tg_asha_9f2c' },
          ],
          successLine: { en: '201 Created. Look at "id" in the body (and the location header). That is the value for the next counter.', mr: '201 Created. Body मधला "id" पाहा (आणि location header). हीच पुढच्या counter साठीची value.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Counter 3: read back the order you just created. Put its id in the path. Do not use an old order like 4001 or 4003.', mr: 'Counter 3: आत्ताच तयार केलेली ऑर्डर परत वाचा. तिचा id path मध्ये टाका. 4001 किंवा 4003 सारखी जुनी ऑर्डर वापरू नका.' },
          starter: { method: 'GET', path: '/orders/', headers: { ...ASHA } },
          expect: { method: 'GET', pathPattern: '^/orders/5\\d{3}$', status: 200 },
          solution: { method: 'GET', path: '/orders/5001', headers: { ...ASHA } },
          hints: [
            { en: 'Scroll back to the last response and find "id".', mr: 'मागच्या response मध्ये "id" शोधा.' },
            { en: 'New orders start at 5001 in a fresh session.', mr: 'नव्या session मध्ये नव्या ऑर्डर्स 5001 पासून सुरू होतात.' },
            { en: '/orders/5001', mr: '/orders/5001' },
          ],
          successLine: { en: '200, status PLACED, 2 Masala Dosas, total 270. The id really opens your order. Link checked.', mr: '200, status PLACED, 2 मसाला डोसे, total 270. id ने खरंच तुमचीच ऑर्डर उघडते. कडी तपासली.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Last counter: cancel that same new order. Use PATCH with the new id and the body {"status": "CANCELLED"}. An order can be cancelled only once, so press Submit this request directly (a second cancel answers 409).', mr: 'शेवटचा counter: तीच नवी ऑर्डर रद्द करा. नव्या id सह PATCH आणि body {"status": "CANCELLED"} वापरा. ऑर्डर एकदाच रद्द होते, म्हणून थेट Submit this request दाबा (दुसऱ्यांदा रद्द केलं तर 409 येतो).' },
          starter: { method: 'PATCH', path: '/orders/', headers: { ...ASHA_JSON }, body: '{\n  "status": "CANCELLED"\n}' },
          expect: { method: 'PATCH', pathPattern: '^/orders/5\\d{3}$', body: { status: 'CANCELLED' }, status: 200 },
          solution: { method: 'PATCH', path: '/orders/5001', headers: { ...ASHA_JSON }, body: '{\n  "status": "CANCELLED"\n}' },
          hints: [
            { en: 'Same id as the step before.', mr: 'आधीच्या step चाच id.' },
            { en: 'The method is already PATCH. Only the id is missing from the path.', mr: 'Method आधीच PATCH आहे. path मध्ये फक्त id कमी आहे.' },
            { en: '/orders/5001', mr: '/orders/5001' },
          ],
          successLine: { en: 'Status CANCELLED. The full journey works: login, order, read, cancel. Chain complete.', mr: 'Status CANCELLED. संपूर्ण प्रवास चालतो: login, ऑर्डर, वाचणं, रद्द करणं. साखळी पूर्ण.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'In the chain login → place order, what travels from the first response to the second request?', mr: 'login → ऑर्डर या साखळीत पहिल्या response मधून दुसऱ्या request मध्ये काय जातं?' },
        options: [
          { en: 'The password', mr: 'पासवर्ड' },
          { en: 'The order id', mr: 'order id' },
          { en: 'The token', mr: 'token' },
          { en: 'The restaurant name', mr: 'रेस्टॉरंटचं नाव' },
        ],
        answer: 2,
        explain: { en: 'Login answers with a token; the order request carries it as Authorization: Bearer <token>.', mr: 'Login token देतो; order request तो Authorization: Bearer <token> म्हणून पाठवते.' },
      },
      {
        q: { en: 'What does this line in the Tests tab do?', mr: 'Tests tab मधली ही ओळ काय करते?' },
        code: 'pm.environment.set("orderId", pm.response.json().id)',
        options: [
          { en: 'Saves the id from this response in a variable called orderId', mr: 'या response मधला id orderId नावाच्या variable मध्ये save करते' },
          { en: 'Creates a new order', mr: 'नवी ऑर्डर तयार करते' },
          { en: 'Deletes the order', mr: 'ऑर्डर delete करते' },
          { en: 'Checks that the id is 200', mr: 'id 200 आहे का ते तपासते' },
        ],
        answer: 0,
        explain: { en: 'It reads id from the body and stores it, ready for {{orderId}} in the next request.', mr: 'ती body मधून id वाचते आणि save करते, पुढच्या request मधल्या {{orderId}} साठी तयार.' },
      },
      {
        q: { en: 'orderId is 5001. What path does Postman really send?', mr: 'orderId 5001 आहे. Postman खरोखर कोणता path पाठवतो?' },
        code: 'GET /orders/{{orderId}}',
        options: ['/orders/{{orderId}}', '/orders/orderId', '/orders/', '/orders/5001'],
        answer: 3,
        explain: { en: 'Postman replaces {{orderId}} with the saved value before sending.', mr: 'पाठवण्याआधी Postman {{orderId}} च्या जागी save केलेली value टाकतो.' },
      },
      {
        q: { en: 'Your chain fails at step 2 (place order) with 401. What is the most likely cause?', mr: 'तुमची साखळी step 2 वर (ऑर्डर देणं) 401 देऊन fail होते. सगळ्यात संभाव्य कारण काय?' },
        options: [
          { en: 'The restaurant is closed', mr: 'रेस्टॉरंट बंद आहे' },
          { en: 'The token from step 1 was not passed on, or was copied wrong', mr: 'Step 1 चा token पुढे दिला नाही, किंवा चुकीचा copy झाला' },
          { en: 'The order id is wrong', mr: 'order id चुकीचा आहे' },
          { en: 'The server is too fast', mr: 'सर्व्हर खूप वेगवान आहे' },
        ],
        answer: 1,
        explain: { en: '401 means the server does not know who you are. The broken link is the token between step 1 and step 2. Report it that way: which step, which value.', mr: '401 म्हणजे सर्व्हरला तुम्ही कोण ते माहीत नाही. तुटलेली कडी म्हणजे step 1 आणि step 2 मधला token. असाच report करा: कोणती step, कोणती value.' },
      },
    ],
    recap: { line: { en: 'Chaining: each response hands a value (token, id) to the next request. Postman saves it with pm.environment.set and uses it as {{name}}.', mr: 'Chaining: प्रत्येक response पुढच्या request ला एक value (token, id) देतो. Postman ती pm.environment.set ने save करतो आणि {{name}} म्हणून वापरतो.' }, icon: '🔗' },
  },

  // ───────────────────────── A2.4 Schema and contract testing
  {
    id: 'ap2-4',
    code: 'A2.4',
    level: 'intermediate',
    title: { en: 'Schema and Contract Testing', mr: 'Schema आणि Contract Testing' },
    skill: 'Schema & contract testing',
    realLife: {
      place: 'postoffice',
      title: { en: 'The passport form', mr: 'पासपोर्टचा फॉर्म' },
      story: {
        en: 'Neha fills a passport form at the post office counter. Every box has a fixed shape. Pincode: exactly 6 digits. Date of birth: a real date. Name: cannot be empty. The clerk does not read the meaning of every word. He checks the shape. A form with letters in the pincode box, or a missing name, goes straight back. Because the shape is fixed, the passport office far away can read every form the same way.',
        mr: 'नेहा पोस्ट ऑफिसच्या counter वर पासपोर्टचा फॉर्म भरते. प्रत्येक box चा आकार ठरलेला. पिनकोड: नेमके 6 आकडे. जन्मतारीख: खरी तारीख. नाव: रिकामं चालणार नाही. कारकून प्रत्येक शब्दाचा अर्थ वाचत नाही. तो आकार तपासतो. पिनकोडच्या box मध्ये अक्षरं, किंवा नाव गायब, असा फॉर्म सरळ परत. आकार ठरलेला असल्यामुळे दूरचं पासपोर्ट ऑफिस प्रत्येक फॉर्म एकाच पद्धतीने वाचू शकतं.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Pincode: exactly 6 digits. Date of birth: a real date. No empty boxes.', mr: 'पिनकोड: नेमके 6 आकडे. जन्मतारीख: खरी तारीख. एकही box रिकामा नाही.' },
        items: [
          { icon: '📮', label: 'Pincode 411038', mr: 'पिनकोड 411038', pass: true },
          { icon: '🔤', label: 'Pincode 41A038', mr: 'पिनकोड 41A038', pass: false },
          { icon: '✂️', label: 'Pincode 41103', mr: 'पिनकोड 41103', pass: false },
          { icon: '📅', label: 'DOB 12-05-1995', mr: 'जन्मतारीख 12-05-1995', pass: true },
          { icon: '⬜', label: 'Name box empty', mr: 'नावाचा box रिकामा', pass: false },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'angry', text: { en: 'The app crashed for every customer who opened Chai Tapri in Nashik. The API said 200 OK!', mr: 'नाशिकमधलं Chai Tapri उघडणाऱ्या प्रत्येक ग्राहकासाठी ॲप crash झालं. API ने तर 200 OK सांगितलं!' } },
        { who: 'theo', mood: 'worried', text: { en: 'The data is all there. Rating 4.5. I just... sent it as text. Is that a big deal?', mr: 'डेटा सगळा आहे. Rating 4.5. मी फक्त... तो text म्हणून पाठवला. एवढं काय मोठं?' } },
        { who: 'gremlin', mood: 'smug', text: { en: '"4.5" or 4.5. same thing right? also i hid the city. nobody reads that box anyway.', mr: '"4.5" काय आणि 4.5 काय. सारखंच ना? आणि मी city लपवली. तो box कोणी वाचतच नाही.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'The app reads every box, {name}. It was built on a promise about the shape of this response. Today we test that promise: the contract.', mr: 'ॲप प्रत्येक box वाचतं, {name}. ते या response च्या आकाराबद्दलच्या वचनावर बांधलं आहे. आज आपण ते वचन तपासू: contract.' } },
      ],
      problem: { en: 'Apps on lakhs of phones read fields by name and expect fixed types. A renamed field, a missing field, or a number that turns into text makes them crash, even when the status is 200.', mr: 'लाखो फोनवरची ॲप्स fields नावाने वाचतात आणि ठरलेले types अपेक्षित धरतात. नाव बदललेली field, गायब field, किंवा text झालेला number, यामुळे status 200 असूनही ती crash होतात.' },
      solution: { en: 'Contract testing checks the shape of every response: the required fields are there and each one has the agreed type. JSON Schema writes that shape down formally so a tool can check it automatically.', mr: 'Contract testing प्रत्येक response चा आकार तपासतं: आवश्यक fields आहेत आणि प्रत्येकीचा ठरलेला type आहे. JSON Schema तो आकार औपचारिकपणे लिहून ठेवतं, म्हणजे tool तो आपोआप तपासू शकतं.' },
    },
    lesson: [
      { en: 'A contract is the agreed shape of a response: which fields come back and what type each one is. For a restaurant: id is a number, name is text, city is text, veg is true or false, rating is a number.', mr: 'Contract म्हणजे response चा ठरलेला आकार: कोणत्या fields येतात आणि प्रत्येकीचा type काय. रेस्टॉरंटसाठी: id हा number, name हा text, city हा text, veg हा true किंवा false, rating हा number.' },
      { en: 'The app is built on that promise. Code like rating.toFixed(1) works on 4.5 and crashes on "4.5". Code that shows city prints "undefined" when city is missing. Status 200 does not save you.', mr: 'ॲप त्या वचनावर बांधलेलं असतं. rating.toFixed(1) सारखा code 4.5 वर चालतो आणि "4.5" वर crash होतो. city दाखवणारा code city गायब असेल तर "undefined" छापतो. Status 200 वाचवत नाही.' },
      { en: 'Breaking changes: renaming a field, removing a field, changing a type, making a field null. Safe changes: adding a new optional field. Old app versions on people\'s phones cannot be updated overnight, so breaking changes hurt for months.', mr: 'Breaking changes: field चं नाव बदलणं, field काढणं, type बदलणं, field null करणं. सुरक्षित बदल: नवी optional field जोडणं. लोकांच्या फोनवरची जुनी ॲप versions एका रात्रीत update होत नाहीत, म्हणून breaking changes महिनोन्महिने त्रास देतात.' },
      { en: 'JSON Schema is the formal contract: a JSON document listing required fields and types. Real Postman can check it with pm.response.to.have.jsonSchema(schema). In this console you write the same checks with pm.expect: have.property for required fields and to.be.a(...) for types.', mr: 'JSON Schema म्हणजे औपचारिक contract: आवश्यक fields आणि types सांगणारं एक JSON document. खरं Postman ते pm.response.to.have.jsonSchema(schema) ने तपासू शकतं. या console मध्ये तुम्ही त्याच तपासण्या pm.expect ने लिहिता: आवश्यक fields साठी have.property आणि types साठी to.be.a(...).' },
    ],
    syntax: {
      template: '{\n  "type": "object",\n  "required": ["id", "name", "city", "veg", "rating", "address"],\n  "properties": {\n    "id":      { "type": "number" },\n    "name":    { "type": "string" },\n    "city":    { "type": "string" },\n    "veg":     { "type": "boolean" },\n    "rating":  { "type": "number" },\n    "address": { "type": "object" }\n  }\n}',
      parts: [
        { code: '"type": "object"', means: { en: 'the whole response is one { } object', mr: 'संपूर्ण response एक { } object आहे' } },
        { code: '"required": [...]', means: { en: 'boxes that must never be missing', mr: 'कधीही गायब होऊ नयेत असे boxes' } },
        { code: '"properties"', means: { en: 'the shape of each box', mr: 'प्रत्येक box चा आकार' } },
        { code: '{ "type": "number" }', means: { en: 'this box takes only numbers: 4.5 yes, "4.5" no', mr: 'या box मध्ये फक्त numbers: 4.5 हो, "4.5" नाही' } },
        { code: '{ "type": "boolean" }', means: { en: 'only true or false: not "yes", not 1', mr: 'फक्त true किंवा false: "yes" नाही, 1 नाही' } },
      ],
      example: [
        { code: 'const r = pm.response.json()', note: { en: 'take the form from the counter', mr: 'counter वरून फॉर्म घ्या' } },
        { code: 'pm.expect(r).to.have.property("city")', note: { en: 'the city box is not empty', mr: 'city चा box रिकामा नाही' } },
        { code: 'pm.expect(r.rating).to.be.a("number")', note: { en: 'only digits in a digits box', mr: 'आकड्यांच्या box मध्ये फक्त आकडे' } },
        { code: 'pm.expect(r.veg).to.be.a("boolean")', note: { en: 'a tick box: yes or no, nothing else', mr: 'टिक box: हो किंवा नाही, बाकी काही नाही' } },
        { code: 'pm.expect(r.address.pincode).to.match(/^\\d{6}$/)', note: { en: 'pincode: exactly 6 digits, like the passport form', mr: 'पिनकोड: नेमके 6 आकडे, पासपोर्ट फॉर्मसारखे' } },
      ],
      exampleNote: { en: 'These tests do not care that the rating is 4.5. They care that it is a number. That is the difference between a value test and a contract test.', mr: 'या tests ना rating 4.5 आहे याची पर्वा नाही. तो number आहे याची आहे. Value test आणि contract test यातला हाच फरक.' },
      pitfall: { en: 'typeof null is tricky: a null address is not an object for the app. Check to.be.an("object"), which fails for null here, and do not stop at to.exist.', mr: 'null फसवा असतो: null address ॲपसाठी object नाही. to.be.an("object") तपासा, जो इथे null साठी fail होतो, आणि फक्त to.exist वर थांबू नका.' },
    },
    practice: {
      intro: { en: 'Be the post office clerk. First find the broken form, then write the shape checks that would have caught it.', mr: 'पोस्ट ऑफिसचा कारकून बना. आधी बिघडलेला फॉर्म शोधा, मग तो पकडणाऱ्या आकार तपासण्या लिहा.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'Send GET /restaurants/9 (Chai Tapri) and compare it with the contract: id number, name string, city string, veg boolean, rating number. Which rules does it break? Pick all that apply.', mr: 'GET /restaurants/9 (Chai Tapri) पाठवा आणि contract शी तुलना करा: id number, name string, city string, veg boolean, rating number. तो कोणते नियम मोडतो? लागू असलेले सगळे निवडा.' },
          apiSandbox: { method: 'GET', path: '/restaurants/9' },
          options: [
            { en: 'rating is text ("4.5") instead of a number', mr: 'rating number ऐवजी text ("4.5") आहे' },
            { en: 'city is missing at the top level', mr: 'वरच्या स्तरावर city गायब आहे' },
            { en: 'veg is text instead of true/false', mr: 'veg true/false ऐवजी text आहे' },
            { en: 'id is missing', mr: 'id गायब आहे' },
          ],
          correct: [0, 1],
          explain: { en: 'Look closely: "rating": "4.5" has quotes, so it is a string. And there is no "city" next to name (only inside address). veg is true and id is 9, both fine. This is planted bug 7.', mr: 'नीट पाहा: "rating": "4.5" ला quotes आहेत, म्हणजे तो string. आणि name शेजारी "city" नाही (फक्त address च्या आत आहे). veg true आणि id 9, दोन्ही ठीक. हा पेरलेला bug 7 आहे.' },
          hints: [
            { en: 'Quotes around a number turn it into text.', mr: 'आकड्याभोवती quotes असले की तो text होतो.' },
            { en: 'Compare with GET /restaurants/3: which top-level field does 9 not have?', mr: 'GET /restaurants/3 शी तुलना करा: 9 कडे वरच्या स्तरावरची कोणती field नाही?' },
            { en: 'Two rules are broken: one type, one missing field.', mr: 'दोन नियम मोडले आहेत: एक type, एक गायब field.' },
          ],
          successLine: { en: 'Found both. Status 200, and still broken. That is why contracts get their own tests.', mr: 'दोन्ही सापडले. Status 200, तरीही बिघडलेलं. म्हणूनच contracts साठी स्वतंत्र tests लागतात.' },
        },
        {
          kind: 'test',
          prompt: { en: 'Write contract tests for GET /restaurants/3. Check that the required fields exist and each has the right type. They must catch: rating as text, city missing, veg as "yes", and address set to null.', mr: 'GET /restaurants/3 साठी contract tests लिहा. आवश्यक fields आहेत आणि प्रत्येकीचा type बरोबर आहे हे तपासा. त्यांनी पकडायलाच हवं: text म्हणून rating, गायब city, "yes" म्हणून veg, आणि null केलेला address.' },
          request: { method: 'GET', path: '/restaurants/3' },
          starter: '// Contract for a restaurant:\n// id number, name string, city string, veg boolean,\n// rating number, address object.\n// Check that the fields exist and have these types.\n\npm.test("Status is 200", () => {\n  pm.response.to.have.status(200)\n})\n',
          solution: 'pm.test("Status is 200", () => {\n  pm.response.to.have.status(200)\n})\n\nconst r = pm.response.json()\n\npm.test("Required fields are present", () => {\n  pm.expect(r).to.include.keys("id", "name", "city", "veg", "rating", "address")\n})\n\npm.test("Fields have the right types", () => {\n  pm.expect(r.id).to.be.a("number")\n  pm.expect(r.name).to.be.a("string")\n  pm.expect(r.city).to.be.a("string")\n  pm.expect(r.veg).to.be.a("boolean")\n  pm.expect(r.rating).to.be.a("number")\n  pm.expect(r.address).to.be.an("object")\n})\n\npm.test("Pincode is 6 digits", () => {\n  pm.expect(r.address.pincode).to.match(/^\\d{6}$/)\n})\n',
          mutants: [
            { label: { en: 'rating sent as text "4.5"', mr: 'rating text "4.5" म्हणून आला' }, patch: setField('rating', '4.5') },
            { label: { en: 'city missing', mr: 'city गायब' }, patch: dropField('city') },
            { label: { en: 'veg sent as "yes"', mr: 'veg "yes" म्हणून आला' }, patch: setField('veg', 'yes') },
            { label: { en: 'address is null', mr: 'address null आहे' }, patch: setField('address', null) },
          ],
          hints: [
            { en: 'Start with const r = pm.response.json(). The status test catches none of these bugs: all of them answer 200.', mr: 'const r = pm.response.json() ने सुरुवात करा. Status test यापैकी एकही bug पकडत नाही: सगळे 200 देतात.' },
            { en: 'Types: pm.expect(r.rating).to.be.a("number"), and the same idea for city, veg and address.', mr: 'Types: pm.expect(r.rating).to.be.a("number"), आणि city, veg, address साठी तसंच.' },
            { en: 'For address use to.be.an("object"): null is not an object here.', mr: 'address साठी to.be.an("object") वापरा: इथे null हा object नाही.' },
            { en: 'pm.test("Types", () => { pm.expect(r.city).to.be.a("string"); pm.expect(r.veg).to.be.a("boolean"); pm.expect(r.rating).to.be.a("number"); pm.expect(r.address).to.be.an("object") })', mr: 'pm.test("Types", () => { pm.expect(r.city).to.be.a("string"); pm.expect(r.veg).to.be.a("boolean"); pm.expect(r.rating).to.be.a("number"); pm.expect(r.address).to.be.an("object") })' },
          ],
          successLine: { en: 'Contract locked. If anyone breaks the shape again, your tests go red before the app crashes.', mr: 'Contract पक्कं. पुन्हा कोणी आकार बिघडवला, तर ॲप crash होण्याआधीच तुमच्या tests लाल होतील.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Theo plans four changes to GET /restaurants/{id}. Which ones would break old app versions that are still on customers\' phones? Pick all that apply.', mr: 'थिओ GET /restaurants/{id} मध्ये चार बदल करणार आहे. ग्राहकांच्या फोनवर अजून असलेल्या जुन्या ॲप versions कोणते बदल बिघडवतील? लागू असलेले सगळे निवडा.' },
          options: [
            { en: 'Rename deliveryMins to deliveryTime', mr: 'deliveryMins चं नाव deliveryTime करणं' },
            { en: 'Add a new field "offerText"', mr: '"offerText" ही नवी field जोडणं' },
            { en: 'Send veg as "yes" / "no" instead of true / false', mr: 'veg true / false ऐवजी "yes" / "no" म्हणून पाठवणं' },
            { en: 'Show the fields in a different order', mr: 'fields वेगळ्या क्रमाने दाखवणं' },
          ],
          correct: [0, 2],
          explain: { en: 'Old apps look for deliveryMins by name and expect veg to be true or false, so a rename and a type change both break them. A new field is ignored by old apps, and JSON field order does not matter.', mr: 'जुनी ॲप्स deliveryMins नावाने शोधतात आणि veg true किंवा false अपेक्षित धरतात, म्हणून नाव बदलणं आणि type बदलणं दोन्ही त्यांना बिघडवतात. नवी field जुनी ॲप्स दुर्लक्षित करतात, आणि JSON मध्ये fields चा क्रम महत्त्वाचा नसतो.' },
          hints: [
            { en: 'Old apps read fields by name and expect fixed types.', mr: 'जुनी ॲप्स fields नावाने वाचतात आणि ठरलेले types अपेक्षित धरतात.' },
            { en: 'Does an old app even know a new field exists?', mr: 'जुन्या ॲपला नवी field आहे हे तरी माहीत असतं का?' },
            { en: 'One rename and one type change.', mr: 'एक नाव बदल आणि एक type बदल.' },
          ],
        },
      ],
    },
    exam: [
      {
        q: { en: 'An API contract is...', mr: 'API contract म्हणजे...' },
        options: [
          { en: 'The legal agreement with the hosting company', mr: 'hosting कंपनीसोबतचा कायदेशीर करार' },
          { en: 'The agreed shape of a response: which fields come back and their types', mr: 'response चा ठरलेला आकार: कोणत्या fields येतात आणि त्यांचे types' },
          { en: 'The list of status codes', mr: 'status codes ची यादी' },
          { en: 'The server password', mr: 'सर्व्हरचा पासवर्ड' },
        ],
        answer: 1,
        explain: { en: 'Like the boxes on a passport form: fixed names, fixed shapes.', mr: 'पासपोर्ट फॉर्मवरच्या boxes सारखं: ठरलेली नावं, ठरलेले आकार.' },
      },
      {
        q: { en: 'This response breaks the contract. Which test catches the rating problem?', mr: 'हा response contract मोडतो. Rating ची अडचण कोणती test पकडते?' },
        code: '{ "id": 9, "name": "Chai Tapri", "veg": true, "rating": "4.5" }',
        options: [
          'pm.response.to.have.status(200)',
          'pm.expect(r).to.have.property("rating")',
          'pm.expect(r.rating).to.exist',
          'pm.expect(r.rating).to.be.a("number")',
        ],
        answer: 3,
        explain: { en: 'The rating is there, so the first three pass. Only the type check sees that "4.5" is a string.', mr: 'Rating आहे, म्हणून पहिल्या तीन pass होतात. "4.5" हा string आहे हे फक्त type तपासणीला दिसतं.' },
      },
      {
        q: { en: 'Which change is usually safe for old app versions?', mr: 'जुन्या ॲप versions साठी सहसा कोणता बदल सुरक्षित असतो?' },
        options: [
          { en: 'Adding a new optional field', mr: 'नवी optional field जोडणं' },
          { en: 'Renaming a field', mr: 'field चं नाव बदलणं' },
          { en: 'Changing a number to text', mr: 'number चं text करणं' },
          { en: 'Removing a field', mr: 'field काढून टाकणं' },
        ],
        answer: 0,
        explain: { en: 'Old apps simply ignore a field they do not know. The other three break code that reads the old field.', mr: 'जुनी ॲप्स माहीत नसलेली field सरळ दुर्लक्षित करतात. बाकीचे तीन बदल जुनी field वाचणारा code बिघडवतात.' },
      },
      {
        q: { en: 'The schema says "required": ["id", "name", "city"]. The response has no city. What happens?', mr: 'Schema म्हणतो "required": ["id", "name", "city"]. Response मध्ये city नाही. काय होतं?' },
        options: [
          { en: 'It passes, city is just text', mr: 'pass होतो, city फक्त text आहे' },
          { en: 'It passes if the status is 200', mr: 'status 200 असेल तर pass होतो' },
          { en: 'Schema validation fails: a required field is missing', mr: 'Schema validation fail होतं: आवश्यक field गायब आहे' },
          { en: 'The server adds the city by itself', mr: 'सर्व्हर स्वतःच city जोडतो' },
        ],
        answer: 2,
        explain: { en: 'Required means it must be there. A missing required field is a contract break, whatever the status.', mr: 'Required म्हणजे असायलाच हवी. Status काहीही असो, आवश्यक field गायब असणं म्हणजे contract मोडणं.' },
      },
    ],
    recap: { line: { en: 'Contract = the agreed shape: required fields and their types. Test it on every response; a 200 with the wrong shape still crashes apps.', mr: 'Contract = ठरलेला आकार: आवश्यक fields आणि त्यांचे types. प्रत्येक response वर तपासा; चुकीच्या आकारासह 200 सुद्धा ॲप crash करतो.' }, icon: '📐' },
  },
]
