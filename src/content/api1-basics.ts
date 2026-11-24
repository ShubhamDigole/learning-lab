import type { Lesson } from './types.ts'

// API 1 basics: methods, status codes, reading JSON. The learner works on TiffinGo's /feedback and /restaurants endpoints.

const JSON_HEADER = { 'Content-Type': 'application/json' }

export const apiBasicsLessons: Lesson[] = [
  // ───────────────────────── A1.1 HTTP methods
  {
    id: 'ap1-1',
    code: 'A1.1',
    level: 'basic',
    title: { en: 'HTTP Methods: GET, POST, PUT, PATCH, DELETE', mr: 'HTTP Methods: GET, POST, PUT, PATCH, DELETE' },
    skill: 'HTTP methods (CRUD)',
    realLife: {
      place: 'library',
      title: { en: 'The library card register', mr: 'ग्रंथालयाचं कार्ड रजिस्टर' },
      story: {
        en: 'Kulkarni kaka runs the society library. Every member has a card in his wooden register box. When someone asks "which books do I have?", he only looks at the card. A new member joins: he adds a new card. A member moves house: he rewrites the whole card from scratch. Only the phone number changed: he corrects just that one line. A member leaves Pune: he removes the card. Five jobs, and he never mixes them up.',
        mr: 'कुलकर्णी काका सोसायटीचं ग्रंथालय चालवतात. प्रत्येक सभासदाचं कार्ड त्यांच्या लाकडी रजिस्टर पेटीत असतं. कोणी विचारलं "माझ्याकडे कोणती पुस्तकं आहेत?", तर ते फक्त कार्ड पाहतात. नवा सभासद आला: ते नवं कार्ड जोडतात. सभासदाने घर बदललं: ते संपूर्ण कार्ड नव्याने लिहितात. फक्त फोन नंबर बदलला: ते तेवढी एकच ओळ दुरुस्त करतात. सभासद पुणे सोडून गेला: ते कार्ड काढून टाकतात. पाच कामं, आणि काका ती कधीच गोंधळत नाहीत.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '👀', label: 'Look at a card (GET)', mr: 'कार्ड पाहा (GET)' },
          { icon: '➕', label: 'Add a new card (POST)', mr: 'नवं कार्ड जोडा (POST)' },
          { icon: '📝', label: 'Rewrite the whole card (PUT)', mr: 'संपूर्ण कार्ड पुन्हा लिहा (PUT)' },
          { icon: '✏️', label: 'Correct one line (PATCH)', mr: 'एक ओळ दुरुस्त करा (PATCH)' },
          { icon: '🗑️', label: 'Remove the card (DELETE)', mr: 'कार्ड काढून टाका (DELETE)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'neutral', text: { en: 'Our new feature: customers rate a restaurant, edit their rating, or delete it. The screens are not ready yet, but the feedback API is.', mr: 'आमचं नवं फीचर: ग्राहक रेस्टॉरंटला रेटिंग देतात, ते बदलतात, किंवा डिलीट करतात. स्क्रीन अजून तयार नाहीत, पण feedback API तयार आहे.' } },
        { who: 'theo', mood: 'happy', text: { en: 'Same address, /feedback, but different methods do different jobs. GET reads, POST adds, PATCH edits, DELETE removes.', mr: 'पत्ता एकच, /feedback, पण वेगवेगळ्या methods वेगवेगळी कामं करतात. GET वाचतो, POST जोडतो, PATCH बदलतो, DELETE काढतो.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'a server can say "deleted!" and keep the data anyway. who checks? nobody checks.', mr: 'server "deleted!" म्हणू शकतो आणि तरीही डेटा ठेवू शकतो. कोण तपासतं? कोणीच नाही.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'We check, {name}. After every change, we read it back with a GET. Proof beats promises.', mr: 'आपण तपासतो, {name}. प्रत्येक बदलानंतर आपण GET ने परत वाचतो. आश्वासनापेक्षा पुरावा मोठा.' } },
      ],
      problem: { en: 'The feedback screens do not exist yet, so nobody can test them by clicking. And a server that says "done" may not have done anything.', mr: 'feedback च्या स्क्रीन अजून नाहीत, त्यामुळे क्लिक करून कोणीच तपासू शकत नाही. आणि "झालं" म्हणणाऱ्या server ने खरंच काही केलं असेलच असं नाही.' },
      solution: { en: 'Use the right method for each job (GET, POST, PUT, PATCH, DELETE) straight on the API, then confirm each change with a GET.', mr: 'प्रत्येक कामासाठी योग्य method (GET, POST, PUT, PATCH, DELETE) थेट API वर वापरा, आणि प्रत्येक बदल GET ने खात्री करून घ्या.' },
    },
    lesson: [
      { en: 'The method is the first word of every request. It tells the server what you want to do with the address. The address says which card, the method says which job.', mr: 'Method हा प्रत्येक request चा पहिला शब्द असतो. तो server ला सांगतो की त्या पत्त्यावर तुम्हाला काय करायचं आहे. पत्ता सांगतो कोणतं कार्ड, method सांगते कोणतं काम.' },
      { en: 'GET reads and changes nothing. POST creates something new, and the server gives it a new id. DELETE removes it. These three cover most of your day.', mr: 'GET वाचतो आणि काहीही बदलत नाही. POST काहीतरी नवं तयार करतो, आणि server त्याला नवा id देतो. DELETE ते काढून टाकतो. दिवसभराचं बहुतेक काम या तिघांत होतं.' },
      { en: 'PUT and PATCH both change something that already exists. PUT replaces the whole thing, so you must send every field. PATCH changes only the fields you send. Rewriting the whole card versus correcting one line.', mr: 'PUT आणि PATCH दोन्ही आधीपासून असलेली गोष्ट बदलतात. PUT संपूर्ण गोष्ट बदलतो, म्हणून सगळी fields पाठवावी लागतात. PATCH फक्त तुम्ही पाठवलेली fields बदलतो. संपूर्ण कार्ड पुन्हा लिहिणं आणि एक ओळ दुरुस्त करणं, एवढाच फरक.' },
      { en: 'The tester\'s habit: after every POST, PUT, PATCH or DELETE, send a GET and see the change with your own eyes. A deleted item should answer 404. A patched field should show the new value, and the other fields should stay the same.', mr: 'टेस्टरची सवय: प्रत्येक POST, PUT, PATCH किंवा DELETE नंतर GET पाठवा आणि बदल स्वतःच्या डोळ्यांनी पाहा. डिलीट केलेली गोष्ट 404 द्यायला हवी. PATCH केलेल्या field मध्ये नवी value दिसायला हवी, आणि बाकीची fields तशीच राहायला हवीत.' },
    ],
    syntax: {
      template: 'GET    /feedback?restaurantId=3\nPOST   /feedback\nPUT    /feedback/7001\nPATCH  /feedback/7001\nDELETE /feedback/7001',
      parts: [
        { code: 'GET', means: { en: 'read: look at the card, change nothing', mr: 'वाचा: कार्ड पाहा, काहीही बदलू नका' } },
        { code: 'POST', means: { en: 'create: add a new card (the server picks the new id)', mr: 'तयार करा: नवं कार्ड जोडा (नवा id server ठरवतो)' } },
        { code: 'PUT', means: { en: 'replace: rewrite the whole card, every field', mr: 'पूर्ण बदला: संपूर्ण कार्ड पुन्हा लिहा, सगळी fields' } },
        { code: 'PATCH', means: { en: 'update part: correct only the fields you send', mr: 'काही भाग बदला: फक्त पाठवलेली fields दुरुस्त करा' } },
        { code: 'DELETE', means: { en: 'remove: take the card out of the box', mr: 'काढा: कार्ड पेटीतून काढून टाका' } },
        { code: '/feedback/7001', means: { en: 'the path of one exact card (feedback number 7001)', mr: 'एका नेमक्या कार्डचा path (feedback क्रमांक 7001)' } },
      ],
      example: [
        { code: 'GET /feedback?restaurantId=3', note: { en: 'kaka reads all cards for Dosa Corner', mr: 'काका Dosa Corner ची सगळी कार्डं वाचतात' } },
        { code: 'POST /feedback  {"restaurantId":3,"rating":5,"comment":"Loved the masala dosa"}', note: { en: 'a new member card: the server answers 201 and the new id', mr: 'नवं सभासद कार्ड: server 201 आणि नवा id देतो' } },
        { code: 'PUT /feedback/7001  {"restaurantId":3,"rating":4,"comment":"Updated"}', note: { en: 'rewrite the whole card: all three fields', mr: 'संपूर्ण कार्ड पुन्हा लिहा: तिन्ही fields' } },
        { code: 'PATCH /feedback/7001  {"rating":3}', note: { en: 'only the phone number changed: one line', mr: 'फक्त फोन नंबर बदलला: एकच ओळ' } },
        { code: 'DELETE /feedback/7002', note: { en: 'the member left: card removed, answer 204', mr: 'सभासद गेला: कार्ड काढलं, उत्तर 204' } },
      ],
      pitfall: { en: 'Do not use PUT to change one field. PUT replaces everything, so PUT /feedback/7001 with only {"rating":4} gets a 400: restaurantId and comment are missing. For one field, use PATCH.', mr: 'एक field बदलायला PUT वापरू नका. PUT सगळं बदलतो, म्हणून फक्त {"rating":4} घेऊन PUT /feedback/7001 केलं तर 400 येतो: restaurantId आणि comment नाहीत. एका field साठी PATCH वापरा.' },
    },
    practice: {
      intro: { en: 'Feedback needs no login, so you can try every method right away. The server starts fresh: Dosa Corner has feedback 7001 and 7002.', mr: 'feedback ला login लागत नाही, म्हणून तुम्ही लगेच प्रत्येक method वापरून पाहू शकता. server नव्याने सुरू होतो: Dosa Corner कडे feedback 7001 आणि 7002 आहेत.' },
      steps: [
        {
          kind: 'api',
          prompt: { en: 'Read all feedback for Dosa Corner (restaurant 3). Pick the method that only reads, and add the query restaurantId=3 to the path.', mr: 'Dosa Corner (restaurant 3) चे सगळे feedback वाचा. फक्त वाचणारी method निवडा, आणि path ला query restaurantId=3 जोडा.' },
          starter: { path: '/feedback' },
          expect: { method: 'GET', path: '/feedback', query: { restaurantId: '3' }, status: 200 },
          solution: { method: 'GET', path: '/feedback?restaurantId=3' },
          hints: [
            { en: 'Reading never changes anything. Which method is that?', mr: 'वाचल्याने काहीच बदलत नाही. ती method कोणती?' },
            { en: 'The query starts with ? and looks like name=value.', mr: 'query ? ने सुरू होते आणि name=value अशी दिसते.' },
            { en: 'GET /feedback?restaurantId=3', mr: 'GET /feedback?restaurantId=3' },
          ],
          successLine: { en: 'Two cards: 7001 (rating 5) and 7002 (rating 4). Remember them.', mr: 'दोन कार्डं: 7001 (rating 5) आणि 7002 (rating 4). लक्षात ठेवा.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Add a brand new feedback for Dosa Corner. The body and the Content-Type header are ready. Choose the method that creates something new, and press Submit this request.', mr: 'Dosa Corner साठी नवा feedback जोडा. body आणि Content-Type header तयार आहेत. नवं काहीतरी तयार करणारी method निवडा, आणि Submit this request दाबा.' },
          starter: { path: '/feedback', headers: JSON_HEADER, body: '{\n  "restaurantId": 3,\n  "rating": 5,\n  "comment": "Loved the masala dosa"\n}' },
          expect: { method: 'POST', path: '/feedback', status: 201 },
          solution: { method: 'POST', path: '/feedback', headers: JSON_HEADER, body: '{\n  "restaurantId": 3,\n  "rating": 5,\n  "comment": "Loved the masala dosa"\n}' },
          hints: [
            { en: 'You are adding a new card to the box.', mr: 'तुम्ही पेटीत नवं कार्ड जोडताय.' },
            { en: 'It is not PUT: PUT needs an existing id in the path.', mr: 'PUT नाही: PUT ला path मध्ये आधीपासून असलेला id लागतो.' },
            { en: 'Choose POST.', mr: 'POST निवडा.' },
          ],
          successLine: { en: '201 Created. The server picked a new id for the card: 7004 on your first POST. Look for it in the body.', mr: '201 Created. server ने नव्या कार्डसाठी नवा id निवडला: पहिल्या POST ला 7004. body मध्ये तो शोधा.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Feedback 7001 has rating 5, but the customer changed their mind. Change only its rating to 3. The body {"rating": 3} and the header are ready. Choose the method and type the path.', mr: 'feedback 7001 चं rating 5 आहे, पण ग्राहकाने विचार बदलला. फक्त त्याचं rating 3 करा. body {"rating": 3} आणि header तयार आहेत. method निवडा आणि path टाइप करा.' },
          starter: { headers: JSON_HEADER, body: '{\n  "rating": 3\n}' },
          expect: { method: 'PATCH', path: '/feedback/7001', body: { rating: 3 }, bodyAbsent: ['restaurantId', 'comment'], status: 200 },
          solution: { method: 'PATCH', path: '/feedback/7001', headers: JSON_HEADER, body: '{\n  "rating": 3\n}' },
          hints: [
            { en: 'You correct one line on an existing card. Which method changes only part of it?', mr: 'तुम्ही आधीपासून असलेल्या कार्डवरची एक ओळ दुरुस्त करताय. कोणती method फक्त काही भाग बदलते?' },
            { en: 'The path points at one exact card: /feedback/ then its id.', mr: 'path एका नेमक्या कार्डकडे बोट दाखवतो: /feedback/ आणि मग त्याचा id.' },
            { en: 'PATCH /feedback/7001', mr: 'PATCH /feedback/7001' },
          ],
          successLine: { en: '200 OK. Rating is now 3, and the comment "Crispy dosa, great chutney!" is untouched. That is PATCH.', mr: '200 OK. rating आता 3 आहे, आणि comment "Crispy dosa, great chutney!" तसाच आहे. हाच PATCH.' },
        },
        {
          kind: 'api',
          prompt: { en: 'The customer who wrote feedback 7002 wants it removed. Remove it. No body is needed.', mr: 'feedback 7002 लिहिणाऱ्या ग्राहकाला तो काढून टाकायचा आहे. तो काढा. body ची गरज नाही.' },
          starter: {},
          expect: { method: 'DELETE', path: '/feedback/7002' },
          solution: { method: 'DELETE', path: '/feedback/7002' },
          hints: [
            { en: 'Which method takes a card out of the box?', mr: 'कोणती method कार्ड पेटीतून काढते?' },
            { en: 'The path is the card you want gone: /feedback/ and its id.', mr: 'path म्हणजे जे कार्ड काढायचं ते: /feedback/ आणि त्याचा id.' },
            { en: 'DELETE /feedback/7002', mr: 'DELETE /feedback/7002' },
          ],
          successLine: { en: 'The first DELETE answers 204 No Content: done, and nothing to send back. But is it really gone?', mr: 'पहिल्या DELETE ला 204 No Content येतो: झालं, आणि परत पाठवायला काही नाही. पण खरंच गेलं का?' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Now the tester\'s habit: prove it. Press Send to read Dosa Corner\'s feedback again. What do you see?', mr: 'आता टेस्टरची सवय: सिद्ध करा. Dosa Corner चे feedback पुन्हा वाचायला Send दाबा. काय दिसतं?' },
          apiSandbox: { method: 'GET', path: '/feedback?restaurantId=3' },
          options: [
            { en: '7002 is still there, so the DELETE lied', mr: '7002 अजून आहे, म्हणजे DELETE खोटं बोललं' },
            { en: '7002 is gone, 7001 shows rating 3, and the new 7004 is there', mr: '7002 गेला, 7001 चं rating 3 दिसतं, आणि नवा 7004 आहे' },
            { en: '7004 is missing, so the POST failed', mr: '7004 नाही, म्हणजे POST फसला' },
            { en: 'The list is empty', mr: 'यादी रिकामी आहे' },
          ],
          correct: [1],
          explain: { en: 'Every change really happened: the POST, the PATCH and the DELETE. On a buggy server, this is exactly where you would catch the lie.', mr: 'प्रत्येक बदल खरंच झाला: POST, PATCH आणि DELETE. बग असलेल्या server वर, नेमकं इथेच खोटं पकडलं जातं.' },
          hints: [
            { en: 'Press Send and read the ids in the data list.', mr: 'Send दाबा आणि data यादीतले id वाचा.' },
            { en: 'Check three things: is 7002 there, what is 7001\'s rating, is 7004 there?', mr: 'तीन गोष्टी तपासा: 7002 आहे का, 7001 चं rating किती, 7004 आहे का?' },
          ],
          successLine: { en: 'Proof beats promises. That habit will catch real bugs.', mr: 'आश्वासनापेक्षा पुरावा मोठा. ही सवय खरे बग पकडेल.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'A customer wants to fix only the rating of their feedback. Which method fits best?', mr: 'ग्राहकाला त्याच्या feedback चं फक्त rating दुरुस्त करायचं आहे. कोणती method सगळ्यात योग्य?' },
        options: ['GET', 'POST', 'PATCH', 'DELETE'],
        answer: 2,
        explain: { en: 'PATCH changes only the fields you send. The other fields stay as they were.', mr: 'PATCH फक्त पाठवलेली fields बदलतो. बाकीची fields जशीच्या तशी राहतात.' },
      },
      {
        q: { en: 'Which method only reads and never changes anything?', mr: 'कोणती method फक्त वाचते आणि काहीही बदलत नाही?' },
        options: ['GET', 'PUT', 'POST', 'PATCH'],
        answer: 0,
        explain: { en: 'GET is looking at the card. Safe to send as many times as you like.', mr: 'GET म्हणजे कार्ड पाहणं. कितीही वेळा पाठवलं तरी सुरक्षित.' },
      },
      {
        q: { en: 'This request gets 400 Bad Request. Why?', mr: 'या request ला 400 Bad Request येतो. का?' },
        code: 'PUT /feedback/7001\nContent-Type: application/json\n\n{ "rating": 4 }',
        options: [
          { en: 'Feedback 7001 does not exist', mr: 'feedback 7001 अस्तित्वात नाही' },
          { en: 'PUT is not allowed on feedback', mr: 'feedback वर PUT चालत नाही' },
          { en: 'The rating 4 is too high', mr: 'rating 4 खूप जास्त आहे' },
          { en: 'PUT replaces the whole feedback, so restaurantId and comment must be sent too', mr: 'PUT संपूर्ण feedback बदलतो, म्हणून restaurantId आणि comment सुद्धा पाठवावे लागतात' },
        ],
        answer: 3,
        explain: { en: 'PUT means rewrite the whole card. The server says restaurantId and comment are missing. For one field, use PATCH.', mr: 'PUT म्हणजे संपूर्ण कार्ड पुन्हा लिहिणं. server सांगतो restaurantId आणि comment नाहीत. एका field साठी PATCH वापरा.' },
      },
      {
        q: { en: 'DELETE /feedback/7002 answered 204. What should a good tester do next?', mr: 'DELETE /feedback/7002 ने 204 उत्तर दिलं. चांगल्या टेस्टरने पुढे काय करावं?' },
        options: [
          { en: 'Nothing, 204 means it worked', mr: 'काही नाही, 204 म्हणजे झालं' },
          { en: 'Send GET /feedback/7002 and expect 404 Not Found', mr: 'GET /feedback/7002 पाठवा आणि 404 Not Found अपेक्षित ठेवा' },
          { en: 'Send POST /feedback/7002 to bring it back', mr: 'परत आणायला POST /feedback/7002 पाठवा' },
          { en: 'Send the same DELETE ten more times', mr: 'तीच DELETE अजून दहा वेळा पाठवा' },
        ],
        answer: 1,
        explain: { en: 'Read it back. If it is really gone, the server answers 404 "Feedback 7002 not found".', mr: 'परत वाचा. खरंच गेलं असेल तर server 404 "Feedback 7002 not found" देतो.' },
      },
    ],
    recap: { line: { en: 'GET reads, POST adds, PUT replaces all, PATCH changes part, DELETE removes. Then prove it with a GET.', mr: 'GET वाचतो, POST जोडतो, PUT सगळं बदलतो, PATCH काही भाग बदलतो, DELETE काढतो. मग GET ने सिद्ध करा.' }, icon: '🗂️' },
  },

  // ───────────────────────── A1.2 Status codes
  {
    id: 'ap1-2',
    code: 'A1.2',
    level: 'basic',
    title: { en: 'Status Codes: What the Server Is Telling You', mr: 'Status Codes: server तुम्हाला काय सांगतोय' },
    skill: 'HTTP status codes',
    realLife: {
      place: 'postoffice',
      title: { en: 'The courier counter outcomes', mr: 'कुरिअर काउंटरवरचे निकाल' },
      story: {
        en: 'At the courier counter in Deccan, every parcel ends with a short note. "Delivered" (200). "New parcel booked, here is your receipt number" (201). "No such address" (404). "You forgot your ID proof" (401). "You are not allowed into that building" (403). And one bad day: "Our office is flooded, nothing is moving" (500). The first two mean success. The middle ones mean you must fix something on your side. The last one is the courier company\'s own problem.',
        mr: 'डेक्कनच्या कुरिअर काउंटरवर प्रत्येक पार्सलचा शेवट एका छोट्या शेऱ्याने होतो. "पोहोचलं" (200). "नवं पार्सल बुक झालं, ही घ्या पावती" (201). "असा पत्ताच नाही" (404). "तुम्ही ओळखपत्र आणायला विसरलात" (401). "त्या इमारतीत तुम्हाला प्रवेश नाही" (403). आणि एक वाईट दिवस: "आमच्या ऑफिसमध्ये पाणी भरलंय, काहीच हलत नाही" (500). पहिले दोन म्हणजे यश. मधले म्हणजे तुम्हाला तुमच्या बाजूने काहीतरी दुरुस्त करायचं आहे. शेवटचा कुरिअर कंपनीचाच प्रॉब्लेम आहे.',
      },
      scene: {
        type: 'group',
        groups: [
          { icon: '✅', label: '2xx: it worked', mr: '2xx: काम झालं' },
          { icon: '🙋', label: '4xx: fix your request', mr: '4xx: तुमची request दुरुस्त करा' },
          { icon: '🔥', label: '5xx: the server broke', mr: '5xx: server बिघडला' },
        ],
        items: [
          { icon: '📦', group: 0 },
          { icon: '❓', group: 1 },
          { icon: '🧾', group: 0 },
          { icon: '🪪', group: 1 },
          { icon: '🌊', group: 2 },
          { icon: '🚫', group: 1 },
        ],
        note: { en: 'Delivered and booked = 2xx. Wrong address, no ID, not allowed = 4xx. Flooded office = 5xx.', mr: 'पोहोचलं आणि बुक झालं = 2xx. चुकीचा पत्ता, ओळखपत्र नाही, परवानगी नाही = 4xx. पाणी भरलेलं ऑफिस = 5xx.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'happy', text: { en: 'Good news: the Offers screen looks fine. It says "No offers today".', mr: 'चांगली बातमी: Offers स्क्रीन ठीक दिसते. तिच्यावर "No offers today" लिहिलं आहे.' } },
        { who: 'rex', mood: 'smug', text: { en: 'Did anyone check what the API actually answered? A calm screen can hide a burning kitchen.', mr: 'API ने खरं काय उत्तर दिलं ते कोणी पाहिलं का? शांत स्क्रीनमागे जळतं स्वयंपाकघर लपलेलं असू शकतं.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'shhh. the screen is smiling. don\'t look at the status code. nobody ever looks at the status code.', mr: 'श्श्श. स्क्रीन हसतेय. status code कडे पाहू नका. कोणीच कधी status code पाहत नाही.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'We always look, {name}. The status code is the server\'s honest one-line answer: did it work, did you ask wrong, or did the server break?', mr: 'आपण नेहमी पाहतो, {name}. status code म्हणजे server चं प्रामाणिक एका ओळीचं उत्तर: काम झालं, तुम्ही चुकीचं विचारलं, की server बिघडला?' } },
      ],
      problem: { en: 'Screens often turn errors into friendly messages like "No offers today". Real server failures stay hidden and never get reported.', mr: 'स्क्रीन बऱ्याचदा errors ला "No offers today" सारख्या गोड मेसेजमध्ये बदलतात. server चे खरे बिघाड लपून राहतात आणि कधीच रिपोर्ट होत नाहीत.' },
      solution: { en: 'Read the status code of every response. Its first digit tells you who has to act: 2xx all good, 4xx fix the request, 5xx report to the developer.', mr: 'प्रत्येक response चा status code वाचा. त्याचा पहिला अंक सांगतो कोणी काय करायचं: 2xx सगळं ठीक, 4xx request दुरुस्त करा, 5xx डेव्हलपरला रिपोर्ट करा.' },
    },
    lesson: [
      { en: 'Every response starts with a three-digit status code. You do not need to learn them all. Look at the first digit: it tells you the family.', mr: 'प्रत्येक response तीन अंकी status code ने सुरू होतो. ते सगळे पाठ करायची गरज नाही. पहिला अंक पाहा: तो कुटुंब सांगतो.' },
      { en: '2xx means it worked. 200 OK = here is your answer. 201 Created = a new thing was made (after a POST). 204 No Content = done, nothing to send back (after a DELETE).', mr: '2xx म्हणजे काम झालं. 200 OK = हे घ्या उत्तर. 201 Created = नवी गोष्ट तयार झाली (POST नंतर). 204 No Content = झालं, परत पाठवायला काही नाही (DELETE नंतर).' },
      { en: '4xx means the request has a problem, so fix the request. 400 Bad Request = wrong data. 401 Unauthorized = you did not show who you are (no login token). 403 Forbidden = you are known, but not allowed. 404 Not Found = no such thing. 5xx means the server broke: 500 Internal Server Error. That is never the user\'s fault, so report it to the developer.', mr: '4xx म्हणजे request मध्ये प्रॉब्लेम आहे, म्हणून request दुरुस्त करा. 400 Bad Request = चुकीचा डेटा. 401 Unauthorized = तुम्ही कोण आहात ते दाखवलं नाही (login token नाही). 403 Forbidden = तुम्ही ओळखीचे आहात, पण परवानगी नाही. 404 Not Found = अशी गोष्टच नाही. 5xx म्हणजे server बिघडला: 500 Internal Server Error. ही कधीच user ची चूक नसते, म्हणून डेव्हलपरला रिपोर्ट करा.' },
      { en: 'Testers check the code, not just the screen. A bug report always includes the request, the status code you got, the status code you expected, and the response body. Also, bad input should get a 4xx. If wrong data gets a 200, or crashes into a 500, that is a bug too.', mr: 'टेस्टर्स फक्त स्क्रीन नाही, code तपासतात. बग रिपोर्टमध्ये नेहमी request, मिळालेला status code, अपेक्षित status code, आणि response body असते. आणि चुकीच्या input ला 4xx यायला हवा. चुकीच्या डेटाला 200 आला, किंवा 500 ने server कोसळला, तर तोही बग आहे.' },
    ],
    syntax: {
      template: 'HTTP/1.1 404 Not Found\ncontent-type: application/json; charset=utf-8\n\n{\n  "error": "NOT_FOUND",\n  "message": "Restaurant 999 not found"\n}',
      parts: [
        { code: '2xx', means: { en: 'success: 200 OK, 201 Created, 204 No Content', mr: 'यश: 200 OK, 201 Created, 204 No Content' } },
        { code: '4xx', means: { en: 'the request has a problem: 400, 401, 403, 404. Fix the request.', mr: 'request मध्ये प्रॉब्लेम: 400, 401, 403, 404. request दुरुस्त करा.' } },
        { code: '5xx', means: { en: 'the server broke: 500. Report it to the developer.', mr: 'server बिघडला: 500. डेव्हलपरला रिपोर्ट करा.' } },
        { code: '404 Not Found', means: { en: 'the code plus its short name, on the first line of the response', mr: 'code आणि त्याचं छोटं नाव, response च्या पहिल्या ओळीत' } },
        { code: '"message"', means: { en: 'the body usually explains the error in words. Always read it.', mr: 'body बहुधा error शब्दांत समजावते. ती नेहमी वाचा.' } },
      ],
      example: [
        { code: '200 OK', note: { en: 'parcel delivered', mr: 'पार्सल पोहोचलं' } },
        { code: '201 Created', note: { en: 'new parcel booked, here is the receipt number', mr: 'नवं पार्सल बुक झालं, ही पावती' } },
        { code: '404 Not Found', note: { en: 'no such address', mr: 'असा पत्ताच नाही' } },
        { code: '401 Unauthorized', note: { en: 'you forgot your ID proof', mr: 'तुम्ही ओळखपत्र विसरलात' } },
        { code: '403 Forbidden', note: { en: 'we know you, but you may not enter that building', mr: 'तुम्ही ओळखीचे आहात, पण त्या इमारतीत प्रवेश नाही' } },
        { code: '500 Internal Server Error', note: { en: 'the courier office is flooded', mr: 'कुरिअर ऑफिसमध्ये पाणी भरलंय' } },
      ],
      pitfall: { en: '401 and 403 sound alike. 401 = "who are you?" (no valid token). 403 = "I know who you are, and you still cannot have this".', mr: '401 आणि 403 सारखे वाटतात. 401 = "तुम्ही कोण?" (योग्य token नाही). 403 = "तुम्ही कोण ते माहीत आहे, तरीही हे तुम्हाला मिळणार नाही".' },
    },
    practice: {
      intro: { en: 'Time to make the server say different things on purpose, and read what each code means.', mr: 'आता मुद्दाम server कडून वेगवेगळी उत्तरं मिळवूया, आणि प्रत्येक code चा अर्थ वाचूया.' },
      steps: [
        {
          kind: 'api',
          prompt: { en: 'TiffinGo has restaurants 1 to 12. A shared link points to restaurant 999. Ask for it with GET and make the server answer 404.', mr: 'TiffinGo कडे restaurants 1 ते 12 आहेत. एक शेअर केलेली लिंक restaurant 999 कडे जाते. GET ने ते मागा आणि server कडून 404 मिळवा.' },
          starter: { method: 'GET', path: '/restaurants/' },
          expect: { method: 'GET', path: '/restaurants/999', status: 404 },
          solution: { method: 'GET', path: '/restaurants/999' },
          hints: [
            { en: 'One restaurant is /restaurants/ followed by its id.', mr: 'एक restaurant म्हणजे /restaurants/ आणि त्यानंतर त्याचा id.' },
            { en: 'Put 999 after the last slash.', mr: 'शेवटच्या slash नंतर 999 लिहा.' },
            { en: '/restaurants/999', mr: '/restaurants/999' },
          ],
          successLine: { en: '404 with the message "Restaurant 999 not found". A clear, correct error. That is how it should look.', mr: '404 आणि मेसेज "Restaurant 999 not found". स्पष्ट, योग्य error. असंच असायला हवं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'The Offers screen says "No offers today". Press Send to see what the API really answers. Whose problem is this, and what do you do?', mr: 'Offers स्क्रीन "No offers today" म्हणते. API खरं काय उत्तर देतो ते पाहायला Send दाबा. हा प्रॉब्लेम कोणाचा, आणि तुम्ही काय कराल?' },
          apiSandbox: { method: 'GET', path: '/offers' },
          options: [
            { en: 'Mine: I typed the request wrong, so I fix the path', mr: 'माझा: मी request चुकीची टाइप केली, म्हणून path दुरुस्त करेन' },
            { en: 'Nobody\'s: there are simply no offers today', mr: 'कोणाचाच नाही: आज फक्त ऑफर्स नाहीत' },
            { en: 'The server\'s: it answered 500, so I report it to Theo with the request and response', mr: 'server चा: त्याने 500 उत्तर दिलं, म्हणून मी request आणि response सह Theo ला रिपोर्ट करेन' },
            { en: 'The customer\'s: they need to log in first', mr: 'ग्राहकाचा: त्यांनी आधी login करायला हवं' },
          ],
          correct: [2],
          explain: { en: 'GET /offers answers 500 Internal Server Error: "Something went wrong on our side". The screen hides a real server failure. 5xx goes to the developer.', mr: 'GET /offers ला 500 Internal Server Error येतो: "Something went wrong on our side". स्क्रीन server चा खरा बिघाड लपवते. 5xx डेव्हलपरकडे जातो.' },
          hints: [
            { en: 'Press Send and look at the status code first.', mr: 'Send दाबा आणि आधी status code पाहा.' },
            { en: 'The code starts with 5. Which family is that?', mr: 'code 5 ने सुरू होतो. ते कोणतं कुटुंब?' },
            { en: '5xx = the server broke. Who fixes the server?', mr: '5xx = server बिघडला. server कोण दुरुस्त करतो?' },
          ],
          successLine: { en: 'Caught it: a smiling screen over a 500. That one goes in the bug tracker.', mr: 'पकडलं: 500 वर हसणारी स्क्रीन. हा बग ट्रॅकरमध्ये जाणार.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Ratings must be from 1 to 5. A good server refuses anything else with 400. Test it: change the rating in this feedback to 9, press Submit this request, and make sure the server says 400.', mr: 'rating 1 ते 5 च असायला हवं. चांगला server बाकी सगळं 400 ने नाकारतो. तपासा: या feedback चं rating 9 करा, Submit this request दाबा, आणि server 400 म्हणतो याची खात्री करा.' },
          starter: { method: 'POST', path: '/feedback', headers: JSON_HEADER, body: '{\n  "restaurantId": 3,\n  "rating": 5,\n  "comment": "Amazing"\n}' },
          expect: { method: 'POST', path: '/feedback', body: { rating: 9 }, status: 400 },
          solution: { method: 'POST', path: '/feedback', headers: JSON_HEADER, body: '{\n  "restaurantId": 3,\n  "rating": 9,\n  "comment": "Amazing"\n}' },
          hints: [
            { en: 'Everything is ready except the rating. Change it in the body.', mr: 'rating सोडून सगळं तयार आहे. body मध्ये ते बदला.' },
            { en: 'Replace the 5 with 9. Keep the comma after it.', mr: '5 च्या जागी 9 लिहा. त्यानंतरचा comma तसाच ठेवा.' },
            { en: '"rating": 9,', mr: '"rating": 9,' },
          ],
          successLine: { en: '400 with "rating must be a whole number from 1 to 5". The server guarded the door. If it had said 201, that would be a bug to report.', mr: '400 आणि "rating must be a whole number from 1 to 5". server ने दार राखलं. त्याने 201 दिला असता, तर तो रिपोर्ट करायचा बग असता.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Which of these codes mean "the request has a problem, fix the request"? Pick all that apply.', mr: 'यापैकी कोणते codes म्हणजे "request मध्ये प्रॉब्लेम आहे, request दुरुस्त करा"? लागू असलेले सगळे निवडा.' },
          options: ['201 Created', '404 Not Found', '500 Internal Server Error', '401 Unauthorized'],
          correct: [1, 3],
          explain: { en: '404 and 401 start with 4: fix the request (the address, or the login). 201 is success. 500 is the server\'s own failure.', mr: '404 आणि 401 हे 4 ने सुरू होतात: request दुरुस्त करा (पत्ता, किंवा login). 201 म्हणजे यश. 500 म्हणजे server चा स्वतःचा बिघाड.' },
          hints: [
            { en: 'Look only at the first digit of each code.', mr: 'प्रत्येक code चा फक्त पहिला अंक पाहा.' },
            { en: 'The request family starts with 4. There are two of them here.', mr: 'request चं कुटुंब 4 ने सुरू होतं. इथे असे दोन आहेत.' },
          ],
        },
      ],
    },
    exam: [
      {
        q: { en: 'GET /restaurants/999 answers 404. What does that mean?', mr: 'GET /restaurants/999 ला 404 येतो. याचा अर्थ काय?' },
        options: [
          { en: 'The server crashed', mr: 'server कोसळला' },
          { en: 'There is no restaurant with id 999', mr: 'id 999 चं restaurant नाही' },
          { en: 'You need to log in', mr: 'तुम्हाला login करावं लागेल' },
          { en: 'The restaurant was created', mr: 'restaurant तयार झालं' },
        ],
        answer: 1,
        explain: { en: '404 Not Found: no such address. The body says "Restaurant 999 not found".', mr: '404 Not Found: असा पत्ताच नाही. body सांगते "Restaurant 999 not found".' },
      },
      {
        q: { en: 'The app screen shows a friendly "No offers today", but the API answered 500. What do you do?', mr: 'ॲपच्या स्क्रीनवर गोड "No offers today" दिसतं, पण API ने 500 उत्तर दिलं. तुम्ही काय कराल?' },
        options: [
          { en: 'Nothing, the screen looks fine', mr: 'काही नाही, स्क्रीन ठीक दिसते' },
          { en: 'Change my request until it works', mr: 'चालेपर्यंत माझी request बदलत राहीन' },
          { en: 'Tell customers to try tomorrow', mr: 'ग्राहकांना उद्या प्रयत्न करायला सांगेन' },
          { en: 'Report a bug to the developer with the request, the 500 and the response body', mr: 'request, 500 आणि response body सह डेव्हलपरला बग रिपोर्ट करेन' },
        ],
        answer: 3,
        explain: { en: '5xx is a server failure. The friendly screen is hiding it, which makes it worse. Report it with evidence.', mr: '5xx म्हणजे server चा बिघाड. गोड स्क्रीन तो लपवतेय, त्यामुळे तर अजूनच वाईट. पुराव्यासह रिपोर्ट करा.' },
      },
      {
        q: { en: 'Which family of codes means "the server broke"?', mr: 'कोणतं codes चं कुटुंब म्हणजे "server बिघडला"?' },
        options: ['5xx', '2xx', '3xx', '4xx'],
        answer: 0,
        explain: { en: '5xx: the courier office is flooded. Not the customer\'s fault.', mr: '5xx: कुरिअर ऑफिसमध्ये पाणी भरलंय. ग्राहकाची चूक नाही.' },
      },
      {
        q: { en: 'You get this response. What went wrong?', mr: 'तुम्हाला हा response मिळतो. काय चुकलं?' },
        code: 'HTTP/1.1 401 Unauthorized\n\n{\n  "error": "UNAUTHORIZED",\n  "message": "Login required. Send the header Authorization: Bearer <token> ..."\n}',
        options: [
          { en: 'The server is down', mr: 'server बंद आहे' },
          { en: 'The page does not exist', mr: 'पान अस्तित्वात नाही' },
          { en: 'You did not show who you are: the login token is missing', mr: 'तुम्ही कोण आहात ते दाखवलं नाही: login token नाही' },
          { en: 'Your order was created', mr: 'तुमची ऑर्डर तयार झाली' },
        ],
        answer: 2,
        explain: { en: '401 = forgot your ID proof. Log in, get a token, and send it in the Authorization header.', mr: '401 = ओळखपत्र विसरलात. login करा, token मिळवा, आणि Authorization header मध्ये पाठवा.' },
      },
    ],
    recap: { line: { en: '2xx worked, 4xx fix your request, 5xx the server broke. Check the code, not just the screen.', mr: '2xx काम झालं, 4xx तुमची request दुरुस्त करा, 5xx server बिघडला. फक्त स्क्रीन नाही, code तपासा.' }, icon: '🚦' },
  },

  // ───────────────────────── A1.3 Reading JSON
  {
    id: 'ap1-3',
    code: 'A1.3',
    level: 'basic',
    title: { en: 'Reading JSON Responses', mr: 'JSON responses वाचणं' },
    skill: 'Reading JSON',
    realLife: {
      place: 'kitchen',
      title: { en: 'The stacked steel tiffin', mr: 'एकावर एक रचलेला स्टीलचा डबा' },
      story: {
        en: 'Every morning Aai packs Meera\'s steel dabba. Each compartment has a label: "sabzi: bhendi", "dal: varan", "sweet: none today". One tier holds a smaller box inside it, with its own labels: chutney and pickle. And one tier is a neat row of rotis: first roti, second roti, third. Meera knows exactly where to look: "third tier, the pickle box". Reading JSON is opening that dabba.',
        mr: 'रोज सकाळी आई मीराचा स्टीलचा डबा भरते. प्रत्येक कप्प्याला लेबल असतं: "भाजी: भेंडी", "डाळ: वरण", "गोड: आज नाही". एका कप्प्यात आत अजून एक छोटा डबा असतो, त्याची स्वतःची लेबलं: चटणी आणि लोणचं. आणि एका कप्प्यात पोळ्यांची नीट रांग: पहिली पोळी, दुसरी, तिसरी. कुठे पाहायचं ते मीराला नेमकं माहीत असतं: "तिसरा कप्पा, लोणच्याचा डबा". JSON वाचणं म्हणजे हा डबा उघडणं.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🍱', label: 'Whole dabba = object { }', mr: 'संपूर्ण डबा = object { }' },
          { icon: '🏷️', label: 'Label + food = key: value', mr: 'लेबल + पदार्थ = key: value' },
          { icon: '🥡', label: 'Box inside a tier = nested object', mr: 'कप्प्यातला डबा = nested object' },
          { icon: '🫓', label: 'Row of rotis = list [ ]', mr: 'पोळ्यांची रांग = list [ ]' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'neutral', text: { en: 'Every TiffinGo response body is JSON. The app reads it and draws the screen from it.', mr: 'TiffinGo चा प्रत्येक response body JSON असतो. ॲप तो वाचतं आणि त्यावरून स्क्रीन तयार करतं.' } },
        { who: 'sam', mood: 'worried', text: { en: 'A customer added Rava Dosa to the cart, and only at checkout got an error: "sold out". Why did the menu screen let them pick it at all?', mr: 'एका ग्राहकाने Rava Dosa cart मध्ये टाकला, आणि checkout लाच एरर आला: "sold out". मेन्यू स्क्रीनने तो निवडू तरी का दिला?' } },
        { who: 'meera', mood: 'happy', text: { en: 'The answer is written in the menu response, {name}. You just need to know where to look, like finding the pickle box in a dabba.', mr: 'उत्तर मेन्यूच्या response मध्ये लिहिलेलं आहे, {name}. फक्त कुठे पाहायचं ते माहीत हवं, डब्यातला लोणच्याचा डबा शोधतो तसं.' } },
      ],
      problem: { en: 'A response body looks like a wall of brackets and quotes. If you cannot read it, you cannot tell whether the server sent the wrong data or the app read it wrong.', mr: 'response body म्हणजे brackets आणि quotes ची भिंत वाटते. ते वाचता आलं नाही, तर server ने चुकीचा डेटा पाठवला की ॲपने चुकीचा वाचला, हे सांगता येत नाही.' },
      solution: { en: 'Learn the few JSON shapes (object, key and value, list, nesting) and how to point at one value with a path like items[3].available. Then you can check any field in seconds.', mr: 'JSON चे थोडेसे आकार (object, key आणि value, list, nesting) शिका, आणि items[3].available सारख्या path ने एका value कडे बोट कसं दाखवायचं ते शिका. मग कोणतंही field काही सेकंदांत तपासता येतं.' },
    },
    lesson: [
      { en: 'JSON is a neat way to pack data as text. An object is the whole dabba, written between curly brackets { }. Inside, each compartment is a key and a value: "name": "Dosa Corner". The key is the label, always in double quotes. Pairs are separated by commas.', mr: 'JSON म्हणजे डेटा text म्हणून नीट भरण्याची पद्धत. Object म्हणजे संपूर्ण डबा, curly brackets { } मध्ये लिहिलेला. आत प्रत्येक कप्पा म्हणजे key आणि value: "name": "Dosa Corner". key म्हणजे लेबल, नेहमी double quotes मध्ये. जोड्या commas ने वेगळ्या केलेल्या असतात.' },
      { en: 'A value can be text in quotes ("Pune"), a number without quotes (4.5), true or false (no quotes), or null, which means "nothing here", like "sweet: none today". Quotes matter: "411005" is text, 411005 is a number.', mr: 'Value म्हणजे quotes मधला text ("Pune"), quotes शिवाय number (4.5), true किंवा false (quotes नाहीत), किंवा null, म्हणजे "इथे काहीच नाही", "गोड: आज नाही" सारखं. quotes महत्त्वाचे: "411005" म्हणजे text, 411005 म्हणजे number.' },
      { en: 'A value can also be another object (a box inside a tier), like "address": { "area": ..., "city": ... }. Or a list in square brackets [ ] (the row of rotis), like "tags": ["breakfast", "dosa"]. Lists count from 0, so the first roti is number 0.', mr: 'Value म्हणजे दुसरा object सुद्धा असू शकतो (कप्प्यातला डबा), जसं "address": { "area": ..., "city": ... }. किंवा square brackets [ ] मधली list (पोळ्यांची रांग), जसं "tags": ["breakfast", "dosa"]. list 0 पासून मोजतात, म्हणून पहिली पोळी म्हणजे क्रमांक 0.' },
      { en: 'To point at one value, write a path. A dot goes inside an object: address.city. Square brackets pick from a list: items[1] is the second item. Join them: items[1].price. Testers use paths to check exact fields, for example "items[3].available must be false, so the app must show Sold out".', mr: 'एका value कडे बोट दाखवायला path लिहा. dot म्हणजे object च्या आत जाणं: address.city. square brackets list मधून निवडतात: items[1] म्हणजे दुसरा item. जोडून लिहा: items[1].price. टेस्टर्स नेमकी fields तपासायला paths वापरतात, उदा. "items[3].available false आहे, म्हणून ॲपने Sold out दाखवायलाच हवं".' },
    ],
    syntax: {
      template: '{\n  "id": 3,\n  "name": "Dosa Corner",\n  "veg": true,\n  "rating": 4.5,\n  "address": {\n    "area": "Shivajinagar",\n    "city": "Pune",\n    "pincode": "411005"\n  },\n  "tags": ["breakfast", "dosa"]\n}',
      parts: [
        { code: '{ }', means: { en: 'an object: the whole dabba', mr: 'object: संपूर्ण डबा' } },
        { code: '"name": "Dosa Corner"', means: { en: 'a key (label) and its value (the food inside)', mr: 'key (लेबल) आणि त्याची value (आतला पदार्थ)' } },
        { code: '"Dosa Corner"', means: { en: 'a string: text, always in double quotes', mr: 'string: text, नेहमी double quotes मध्ये' } },
        { code: '4.5', means: { en: 'a number: no quotes', mr: 'number: quotes नाहीत' } },
        { code: 'true / false', means: { en: 'a yes or no value (boolean): no quotes', mr: 'हो किंवा नाही value (boolean): quotes नाहीत' } },
        { code: 'null', means: { en: 'nothing here: the label exists, the box is empty', mr: 'इथे काहीच नाही: लेबल आहे, कप्पा रिकामा' } },
        { code: '"address": { ... }', means: { en: 'a nested object: a box inside a tier. Path: address.city', mr: 'nested object: कप्प्यातला डबा. Path: address.city' } },
        { code: '[ "breakfast", "dosa" ]', means: { en: 'a list (array), counted from 0. Path: tags[0] is "breakfast"', mr: 'list (array), 0 पासून मोजतात. Path: tags[0] म्हणजे "breakfast"' } },
      ],
      example: [
        { code: 'name             → "Dosa Corner"', note: { en: 'the label on the top compartment', mr: 'वरच्या कप्प्यावरचं लेबल' } },
        { code: 'rating           → 4.5', note: { en: 'a number, so no quotes', mr: 'number, म्हणून quotes नाहीत' } },
        { code: 'address.city     → "Pune"', note: { en: 'open the address box, read the city label', mr: 'address चा डबा उघडा, city चं लेबल वाचा' } },
        { code: 'address.pincode  → "411005"', note: { en: 'in quotes, so it is text', mr: 'quotes मध्ये, म्हणून text' } },
        { code: 'tags[0]          → "breakfast"', note: { en: 'the first roti in the row is number 0', mr: 'रांगेतली पहिली पोळी म्हणजे क्रमांक 0' } },
        { code: 'tags[1]          → "dosa"', note: { en: 'the second roti is number 1', mr: 'दुसरी पोळी म्हणजे क्रमांक 1' } },
      ],
      pitfall: { en: 'Lists count from 0. items[1] is the second item, not the first. Many wrong bug reports come from counting from 1.', mr: 'list 0 पासून मोजतात. items[1] म्हणजे दुसरा item, पहिला नाही. 1 पासून मोजल्यामुळे बरेच चुकीचे बग रिपोर्ट होतात.' },
    },
    practice: {
      intro: { en: 'Open real TiffinGo responses and find exact values. Press Send each time, then read carefully.', mr: 'TiffinGo चे खरे responses उघडा आणि नेमक्या values शोधा. प्रत्येक वेळी Send दाबा, मग नीट वाचा.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'Press Send. What is the value of address.pincode?', mr: 'Send दाबा. address.pincode ची value काय आहे?' },
          apiSandbox: { method: 'GET', path: '/restaurants/3' },
          options: ['411038', '"411005"', 'Shivajinagar', '25'],
          correct: [1],
          explain: { en: 'Open the address object, then read pincode: "411005". It is in quotes, so it is a string.', mr: 'address object उघडा, मग pincode वाचा: "411005". ते quotes मध्ये आहे, म्हणून string.' },
          hints: [
            { en: 'address.pincode means: go inside address, then find pincode.', mr: 'address.pincode म्हणजे: address च्या आत जा, मग pincode शोधा.' },
            { en: 'The address object has three keys: area, city and pincode.', mr: 'address object मध्ये तीन keys आहेत: area, city आणि pincode.' },
          ],
          successLine: { en: 'You opened a box inside a box. That is nesting.', mr: 'तुम्ही डब्यातला डबा उघडला. यालाच nesting म्हणतात.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Press Send to get Dosa Corner\'s menu. What is items[1].price? (Remember: lists count from 0.)', mr: 'Dosa Corner चा मेन्यू मिळवायला Send दाबा. items[1].price किती आहे? (लक्षात ठेवा: list 0 पासून मोजतात.)' },
          apiSandbox: { method: 'GET', path: '/restaurants/3/menu' },
          options: ['120', '40', '80', '130'],
          correct: [2],
          explain: { en: 'items[0] is Masala Dosa (120), items[1] is Idli Sambar, price 80.', mr: 'items[0] म्हणजे Masala Dosa (120), items[1] म्हणजे Idli Sambar, price 80.' },
          hints: [
            { en: 'The first item in the list is items[0].', mr: 'list मधला पहिला item म्हणजे items[0].' },
            { en: 'So items[1] is the second dish. Read its price.', mr: 'म्हणजे items[1] हा दुसरा पदार्थ. त्याची price वाचा.' },
            { en: 'The second dish is Idli Sambar.', mr: 'दुसरा पदार्थ Idli Sambar आहे.' },
          ],
        },
        {
          kind: 'choice',
          prompt: { en: 'Back to Sam\'s mystery. Press Send. Which dish has "available": false, so the app should show it as sold out?', mr: 'आता Sam च्या कोड्याकडे. Send दाबा. कोणत्या पदार्थाचं "available": false आहे, म्हणजे ॲपने तो sold out दाखवायला हवा?' },
          apiSandbox: { method: 'GET', path: '/restaurants/3/menu' },
          options: ['Masala Dosa', 'Idli Sambar', 'Filter Coffee', 'Rava Dosa'],
          correct: [3],
          explain: { en: 'items[3] is Rava Dosa with "available": false. The server told the truth and the app ignored it. That is an app bug: report it with this response as proof.', mr: 'items[3] म्हणजे Rava Dosa, "available": false सह. server ने खरं सांगितलं आणि ॲपने त्याकडे दुर्लक्ष केलं. हा ॲपचा बग आहे: हा response पुरावा म्हणून जोडून रिपोर्ट करा.' },
          hints: [
            { en: 'Every dish has an "available" key. Most say true.', mr: 'प्रत्येक पदार्थाला "available" key आहे. बहुतेकांची true आहे.' },
            { en: 'Look at the last dish in the list.', mr: 'list मधला शेवटचा पदार्थ पाहा.' },
          ],
          successLine: { en: 'Mystery solved: the server said sold out, the app did not listen.', mr: 'कोडं सुटलं: server ने sold out सांगितलं, ॲपने ऐकलं नाही.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'From restaurant 3\'s response, which of these values are numbers? Pick all that apply.', mr: 'restaurant 3 च्या response मधल्या यापैकी कोणत्या values numbers आहेत? लागू असलेल्या सगळ्या निवडा.' },
          options: ['4.5', '"411005"', '25', 'true'],
          correct: [0, 2],
          explain: { en: '4.5 (rating) and 25 (deliveryMins) have no quotes, so they are numbers. "411005" is text because of the quotes, and true is a boolean.', mr: '4.5 (rating) आणि 25 (deliveryMins) ला quotes नाहीत, म्हणून ते numbers. "411005" quotes मुळे text आहे, आणि true म्हणजे boolean.' },
          hints: [
            { en: 'Quotes make a value text, even if it looks like a number.', mr: 'quotes मुळे value text होते, ती number सारखी दिसली तरी.' },
            { en: 'true is a yes or no value, not a number. Two options are numbers.', mr: 'true म्हणजे हो किंवा नाही value, number नाही. दोन पर्याय numbers आहेत.' },
          ],
        },
      ],
    },
    exam: [
      {
        q: { en: 'In this order, what is items[1].name?', mr: 'या ऑर्डरमध्ये items[1].name काय आहे?' },
        code: '{\n  "id": 4001,\n  "items": [\n    { "name": "Masala Dosa", "qty": 2, "price": 120 },\n    { "name": "Filter Coffee", "qty": 2, "price": 40 }\n  ],\n  "couponCode": null,\n  "total": 350\n}',
        options: ['"Masala Dosa"', '2', 'items', '"Filter Coffee"'],
        answer: 3,
        explain: { en: 'Lists count from 0: items[0] is Masala Dosa, items[1] is Filter Coffee.', mr: 'list 0 पासून मोजतात: items[0] म्हणजे Masala Dosa, items[1] म्हणजे Filter Coffee.' },
      },
      {
        q: { en: 'In the same order, "couponCode": null means...', mr: 'त्याच ऑर्डरमध्ये "couponCode": null म्हणजे...' },
        options: [
          { en: 'The coupon code is the word "null"', mr: 'coupon code म्हणजे "null" हा शब्द' },
          { en: 'The field exists, but there is no value: no coupon was used', mr: 'field आहे, पण value नाही: कोणताही coupon वापरला नाही' },
          { en: 'The server crashed', mr: 'server कोसळला' },
          { en: 'The order is free', mr: 'ऑर्डर मोफत आहे' },
        ],
        answer: 1,
        explain: { en: 'null = "sweet: none today". The label is there, the compartment is empty.', mr: 'null = "गोड: आज नाही". लेबल आहे, कप्पा रिकामा.' },
      },
      {
        q: { en: 'The API docs say price must be a number. A response has "price": "120". Is that a bug?', mr: 'API docs सांगतात price number असायला हवी. एका response मध्ये "price": "120" आहे. हा बग आहे का?' },
        options: [
          { en: 'Yes: "120" in quotes is text, not a number', mr: 'हो: quotes मधलं "120" म्हणजे text, number नाही' },
          { en: 'No, 120 is 120', mr: 'नाही, 120 म्हणजे 120च' },
          { en: 'Only if the price is wrong', mr: 'फक्त किंमत चुकली असेल तर' },
          { en: 'No, quotes are optional in JSON', mr: 'नाही, JSON मध्ये quotes ऐच्छिक असतात' },
        ],
        answer: 0,
        explain: { en: 'The type is part of the promise. An app doing maths on "120" can break (for example "120" + 30 becomes "12030"). Report it.', mr: 'type सुद्धा आश्वासनाचा भाग आहे. "120" वर गणित करणारं ॲप बिघडू शकतं (उदा. "120" + 30 चं "12030" होतं). रिपोर्ट करा.' },
      },
      {
        q: { en: 'Which path reads the city in this response?', mr: 'या response मधलं city कोणता path वाचतो?' },
        code: '{\n  "name": "Dosa Corner",\n  "address": { "area": "Shivajinagar", "city": "Pune" },\n  "tags": ["breakfast", "dosa"]\n}',
        options: ['tags[0]', 'city.address', 'address.city', 'address[1]'],
        answer: 2,
        explain: { en: 'Go into address with a dot, then read city: address.city gives "Pune".', mr: 'dot ने address च्या आत जा, मग city वाचा: address.city म्हणजे "Pune".' },
      },
    ],
    recap: { line: { en: 'JSON: { } object, "key": value, [ ] list from 0. Read with paths like address.city and items[1].price.', mr: 'JSON: { } object, "key": value, [ ] list 0 पासून. address.city आणि items[1].price सारख्या paths ने वाचा.' }, icon: '🍱' },
  },
]
