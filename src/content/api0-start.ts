import type { Lesson } from './types.ts'

// API track, "Start here": no prior knowledge assumed. Explained the way you would explain it to a family member.

export const apiStartLessons: Lesson[] = [
  // ───────────────────────── A0.1 What is an API?
  {
    id: 'ap0-1',
    code: 'A0.1',
    level: 'basic',
    title: { en: 'Start Here: What Is an API?', mr: 'सुरुवात: API म्हणजे काय?' },
    skill: 'What an API is',
    syntaxPlain: true,
    realLife: {
      place: 'restaurant',
      title: { en: 'The waiter at the Udupi restaurant', mr: 'उडुपी हॉटेलमधला वेटर' },
      story: {
        en: 'Meera takes her nephew to an Udupi restaurant on FC Road. Nobody walks into the kitchen. They read the menu card, tell the waiter "two masala dosas and one filter coffee", and the waiter carries the order inside. A little later he comes back with the plates. The menu card tells you what you may ask for. The waiter carries your order in and your plate out. The kitchen does the real cooking, and you never even see it.',
        mr: 'मीरा तिच्या भाच्याला FC Road वरच्या उडुपी हॉटेलमध्ये घेऊन जाते. कोणीही स्वयंपाकघरात जात नाही. ते मेन्यू कार्ड वाचतात, वेटरला सांगतात "दोन मसाला डोसे आणि एक फिल्टर कॉफी", आणि वेटर ऑर्डर आत घेऊन जातो. थोड्या वेळाने तो प्लेट्स घेऊन परत येतो. मेन्यू कार्ड सांगतं तुम्ही काय मागू शकता. वेटर तुमची ऑर्डर आत नेतो आणि प्लेट बाहेर आणतो. खरा स्वयंपाक स्वयंपाकघरात होतो, आणि ते तुम्हाला दिसतसुद्धा नाही.',
      },
      scene: {
        type: 'exchange',
        client: { icon: '🧑', label: 'You at the table (app)', mr: 'टेबलवर तुम्ही (ॲप)' },
        server: { icon: '👨‍🍳', label: 'Kitchen (server)', mr: 'स्वयंपाकघर (server)' },
        request: { icon: '📝', label: 'Order slip (request)', mr: 'ऑर्डरची चिठ्ठी (request)' },
        response: { icon: '🍛', label: 'Your plate (response)', mr: 'तुमची प्लेट (response)' },
        note: { en: 'The waiter (the API) carries both ways. You never enter the kitchen.', mr: 'वेटर (म्हणजे API) दोन्ही बाजूंनी ने-आण करतो. तुम्ही स्वयंपाकघरात कधीच जात नाही.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Customers tap "Place order" in the TiffinGo app, see a happy screen, and then... nothing. No food. The kitchen says the order never arrived.', mr: 'ग्राहक TiffinGo ॲपमध्ये "Place order" दाबतात, छान स्क्रीन दिसते, आणि मग... काहीच नाही. जेवण येत नाही. किचन म्हणतं ऑर्डर आलीच नाही.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'The app never talks to the kitchen system directly. It sends every request to our servers through the API, and the servers reply.', mr: 'ॲप किचन सिस्टमशी कधीच थेट बोलत नाही. ते प्रत्येक request आमच्या servers ला API मार्फत पाठवतं, आणि servers उत्तर देतात.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'heh. orders go in... and vanish. somewhere between your pretty screens and the kitchen. good luck clicking around to find where.', mr: 'हेहे. ऑर्डर आत जाते... आणि गायब. तुमच्या सुंदर स्क्रीन आणि किचनच्या मध्ये कुठेतरी. क्लिक करत शोधा आता, शुभेच्छा.' } },
        { who: 'meera', mood: 'happy', text: { en: 'We will not click around, {name}. We will talk to the waiter directly. That is API testing.', mr: 'आपण क्लिक करत फिरणार नाही, {name}. आपण थेट वेटरशी बोलू. यालाच API टेस्टिंग म्हणतात.' } },
      ],
      problem: { en: 'Orders vanish somewhere between the app and the kitchen: "the silent kitchen". Clicking through screens is slow, and the screens hide what the server really answered.', mr: 'ऑर्डर्स ॲप आणि किचनच्या मध्ये कुठेतरी गायब होतात: "शांत स्वयंपाकघर". स्क्रीनमधून क्लिक करत जाणं हळू आहे, आणि server ने खरं काय उत्तर दिलं ते स्क्रीन लपवते.' },
      solution: { en: 'Testing the API directly shows exactly what goes in and what comes back, so you find the broken link faster. It even works before the screens are built.', mr: 'API थेट तपासल्याने नेमकं काय आत गेलं आणि काय परत आलं ते दिसतं, त्यामुळे तुटलेली कडी लवकर सापडते. स्क्रीन तयार होण्याआधीसुद्धा हे करता येतं.' },
    },
    lesson: [
      { en: 'API means Application Programming Interface. Forget the long name. An API is the waiter between two programs: one program asks, the other answers, and the API carries the message both ways.', mr: 'API म्हणजे Application Programming Interface. लांब नाव विसरा. API म्हणजे दोन programs मधला वेटर: एक program विचारतो, दुसरा उत्तर देतो, आणि API निरोप दोन्ही बाजूंनी पोहोचवतो.' },
      { en: 'The program that asks is the client (the TiffinGo phone app). The program that does the work is the server (TiffinGo\'s computers). The question is a request, and the answer is a response.', mr: 'विचारणारा program म्हणजे client (TiffinGo चं फोन ॲप). काम करणारा program म्हणजे server (TiffinGo चे संगणक). प्रश्न म्हणजे request, आणि उत्तर म्हणजे response.' },
      { en: 'Just like the menu card, an API has docs: a list of everything you may ask for and how to ask. In this game the API docs list sits on the left of the console.', mr: 'मेन्यू कार्डसारखेच API चे docs असतात: तुम्ही काय काय मागू शकता आणि कसं मागायचं याची यादी. या गेममध्ये API docs ची यादी console च्या डावीकडे आहे.' },
      { en: 'A tester sends requests straight to the API and checks every answer. If the answer is wrong, the bug is in the server. If the answer is right but the screen is wrong, the bug is in the app. That one check saves hours.', mr: 'टेस्टर थेट API ला requests पाठवतो आणि प्रत्येक उत्तर तपासतो. उत्तर चुकलं, तर बग server मध्ये. उत्तर बरोबर पण स्क्रीन चुकीची, तर बग ॲपमध्ये. ही एक तपासणी तासन्तास वाचवते.' },
    ],
    syntax: {
      template: ' 📱 Client           🤵 API             👨‍🍳 Server\n (the app)  ──request──▶ (the waiter) ──▶  (the kitchen)\n            ◀──response── ◀───────────────\n\n 📖 API docs = the menu card: what you may ask for',
      parts: [
        { code: 'Client', means: { en: 'the one who asks: the phone app, a website, or you in the console', mr: 'विचारणारा: फोन ॲप, वेबसाइट, किंवा console मधले तुम्ही' } },
        { code: 'API', means: { en: 'the waiter: takes the request in, brings the response out', mr: 'वेटर: request आत नेतो, response बाहेर आणतो' } },
        { code: 'Server', means: { en: 'the kitchen: does the real work and keeps the data', mr: 'स्वयंपाकघर: खरं काम करतो आणि डेटा ठेवतो' } },
        { code: 'Request', means: { en: 'what you ask for (your order)', mr: 'तुम्ही काय मागता (तुमची ऑर्डर)' } },
        { code: 'Response', means: { en: 'what comes back (your plate)', mr: 'काय परत येतं (तुमची प्लेट)' } },
        { code: 'API docs', means: { en: 'the menu card: the list of things you can ask for', mr: 'मेन्यू कार्ड: तुम्ही काय मागू शकता याची यादी' } },
      ],
      example: [
        { code: 'Menu card    = API docs', note: { en: 'what you are allowed to ask for', mr: 'तुम्हाला काय मागता येईल' } },
        { code: 'Waiter       = the API', note: { en: 'carries the order in and the plate out', mr: 'ऑर्डर आत नेतो, प्लेट बाहेर आणतो' } },
        { code: 'Kitchen      = the server', note: { en: 'does the cooking, out of sight', mr: 'स्वयंपाक करतो, डोळ्याआड' } },
        { code: 'Your order   = the request', note: { en: '"two masala dosas, please"', mr: '"दोन मसाला डोसे, प्लीज"' } },
        { code: 'Your plate   = the response', note: { en: 'what you check before you eat', mr: 'खाण्याआधी तुम्ही तपासता ते' } },
      ],
      pitfall: { en: 'An API is not the screen. The screen is just one customer of the API. The same API can serve the phone app, the website and the kitchen tablet.', mr: 'API म्हणजे स्क्रीन नाही. स्क्रीन फक्त API चा एक ग्राहक आहे. एकच API फोन ॲप, वेबसाइट आणि किचनचा टॅबलेट या सगळ्यांना सेवा देऊ शकतो.' },
    },
    practice: {
      intro: { en: 'Time to talk to the waiter. The console is already filled in. Press Send and read what comes back.', mr: 'आता वेटरशी बोलूया. console आधीच भरलेला आहे. Send दाबा आणि काय परत येतं ते वाचा.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'This request asks the TiffinGo API for restaurant number 3. Press Send. What is this restaurant\'s name?', mr: 'ही request TiffinGo API कडे restaurant क्रमांक 3 मागते. Send दाबा. या रेस्टॉरंटचं नाव काय आहे?' },
          apiSandbox: { method: 'GET', path: '/restaurants/3' },
          options: ['Saffron Thali', 'Misal Point', 'Dosa Corner', 'Chai Tapri'],
          correct: [2],
          explain: { en: 'The response says "name": "Dosa Corner". You asked the server directly, with no app screen in between.', mr: 'response मध्ये "name": "Dosa Corner" आहे. तुम्ही मधे कोणतीही ॲप स्क्रीन न घेता थेट server ला विचारलं.' },
          hints: [
            { en: 'Press Send first, then look at the response that appears below the buttons.', mr: 'आधी Send दाबा, मग buttons च्या खाली येणारा response पाहा.' },
            { en: 'Find the word "name" in the response. The value next to it is the answer.', mr: 'response मध्ये "name" हा शब्द शोधा. त्याच्या शेजारची value हेच उत्तर.' },
          ],
          successLine: { en: 'Your first API request. The waiter brought the plate.', mr: 'तुमची पहिली API request. वेटरने प्लेट आणली.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'In the TiffinGo story, who plays the waiter?', mr: 'TiffinGo च्या गोष्टीत वेटरची भूमिका कोण करतं?' },
          options: [
            { en: 'The customer who taps "Place order"', mr: '"Place order" दाबणारा ग्राहक' },
            { en: 'The TiffinGo phone app', mr: 'TiffinGo फोन ॲप' },
            { en: 'The API', mr: 'API' },
            { en: 'The kitchen system', mr: 'किचन सिस्टम' },
          ],
          correct: [2],
          explain: { en: 'The app is the diner, the servers and kitchen system are the kitchen, and the API carries messages between them.', mr: 'ॲप म्हणजे जेवायला आलेला ग्राहक, servers आणि किचन सिस्टम म्हणजे स्वयंपाकघर, आणि API त्यांच्यामध्ये निरोप ने-आण करतो.' },
          hints: [
            { en: 'The waiter does not cook and does not eat. He only carries things between two sides.', mr: 'वेटर स्वयंपाक करत नाही आणि जेवतही नाही. तो फक्त दोन बाजूंमध्ये ने-आण करतो.' },
            { en: 'Which one sits between the app and the servers?', mr: 'ॲप आणि servers च्या मध्ये कोण आहे?' },
          ],
        },
        {
          kind: 'choice',
          prompt: { en: 'Testers often start by asking "is the kitchen even open?". This request calls /health. Press Send. What status does the server report?', mr: 'टेस्टर्स बऱ्याचदा सुरुवात "किचन चालू तरी आहे का?" या प्रश्नाने करतात. ही request /health ला विचारते. Send दाबा. server आपला status काय सांगतो?' },
          apiSandbox: { method: 'GET', path: '/health' },
          options: ['UP', 'DOWN', 'BUSY', 'CLOSED'],
          correct: [0],
          explain: { en: 'The response says "status": "UP" (version 1.4.2). The server is alive, so if orders vanish, something else is wrong.', mr: 'response मध्ये "status": "UP" आहे (version 1.4.2). server चालू आहे, म्हणजे ऑर्डर्स गायब होत असतील तर दुसरंच काहीतरी चुकतंय.' },
          hints: [
            { en: 'Press Send and look for the word "status" in the response body.', mr: 'Send दाबा आणि response body मध्ये "status" हा शब्द शोधा.' },
            { en: 'It is a short word in capitals, the opposite of DOWN.', mr: 'तो मोठ्या अक्षरांतला छोटा शब्द आहे, DOWN च्या उलट.' },
          ],
          successLine: { en: 'The kitchen is open. Now we can start the real investigation.', mr: 'स्वयंपाकघर चालू आहे. आता खरा तपास सुरू करू शकतो.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'In the restaurant story, the API is like...', mr: 'हॉटेलच्या गोष्टीत API म्हणजे...' },
        options: [
          { en: 'The kitchen', mr: 'स्वयंपाकघर' },
          { en: 'The waiter', mr: 'वेटर' },
          { en: 'The plate of food', mr: 'जेवणाची प्लेट' },
          { en: 'The customer', mr: 'ग्राहक' },
        ],
        answer: 1,
        explain: { en: 'The waiter carries your order in and your plate out, just as an API carries requests and responses.', mr: 'वेटर तुमची ऑर्डर आत नेतो आणि प्लेट बाहेर आणतो, तसंच API requests आणि responses ने-आण करतो.' },
      },
      {
        q: { en: 'The answer that comes back from the server is called the...', mr: 'server कडून परत येणाऱ्या उत्तराला काय म्हणतात?' },
        options: ['request', 'client', 'menu', 'response'],
        answer: 3,
        explain: { en: 'You send a request, the server sends back a response.', mr: 'तुम्ही request पाठवता, server response परत पाठवतो.' },
      },
      {
        q: { en: 'Why do testers test the API directly instead of only clicking through screens?', mr: 'टेस्टर्स फक्त स्क्रीनवर क्लिक न करता API थेट का तपासतात?' },
        options: [
          { en: 'It is faster, shows exactly what the server answered, and works before the screens exist', mr: 'हे जलद आहे, server ने नेमकं काय उत्तर दिलं ते दाखवतं, आणि स्क्रीन तयार होण्याआधीही करता येतं' },
          { en: 'Because screens never have bugs', mr: 'कारण स्क्रीनमध्ये कधीच बग नसतात' },
          { en: 'To change the server\'s code', mr: 'server चा code बदलण्यासाठी' },
          { en: 'Because the app is not allowed to use the API', mr: 'कारण ॲपला API वापरायची परवानगी नसते' },
        ],
        answer: 0,
        explain: { en: 'The API shows the truth behind the screen, quickly, even while the app is still being built.', mr: 'API स्क्रीनमागचं सत्य पटकन दाखवतो, ॲप अजून बनत असतानासुद्धा.' },
      },
      {
        q: { en: 'The API returns the right data, but the app screen shows the wrong price. Where is the bug most likely?', mr: 'API बरोबर डेटा देतो, पण ॲपच्या स्क्रीनवर चुकीची किंमत दिसते. बग बहुधा कुठे आहे?' },
        options: [
          { en: 'In the server', mr: 'server मध्ये' },
          { en: 'In the database', mr: 'डेटाबेसमध्ये' },
          { en: 'In the app (the screen)', mr: 'ॲपमध्ये (स्क्रीनमध्ये)' },
          { en: 'There is no bug', mr: 'बग नाहीच' },
        ],
        answer: 2,
        explain: { en: 'The kitchen sent the right plate, so the mix-up happened on the app side. Report it to the app team.', mr: 'स्वयंपाकघराने योग्य प्लेट पाठवली, म्हणजे गोंधळ ॲपच्या बाजूला झाला. ॲप टीमला रिपोर्ट करा.' },
      },
    ],
    recap: { line: { en: 'API = the waiter between the app (client) and the kitchen (server). Request goes in, response comes out.', mr: 'API = ॲप (client) आणि स्वयंपाकघर (server) मधला वेटर. Request आत जाते, response बाहेर येतो.' }, icon: '🤵' },
  },

  // ───────────────────────── A0.2 Request, response and the URL
  {
    id: 'ap0-2',
    code: 'A0.2',
    level: 'basic',
    title: { en: 'Start Here: Request, Response and the URL', mr: 'सुरुवात: Request, Response आणि URL' },
    skill: 'URL anatomy, request & response',
    realLife: {
      place: 'postoffice',
      title: { en: 'A speed-post letter', mr: 'स्पीड पोस्टचं पत्र' },
      story: {
        en: 'Meera sends a speed-post letter from Pune to her cousin in Mumbai. The envelope has the city, then the street and house number, and a little note: "deliver after 5 pm". The postman finds the right house because every part of the address is in order. Two days later a reply letter arrives, with a delivery stamp that says it reached safely. The address is the URL. The reply is the response. The stamp is the status.',
        mr: 'मीरा पुण्याहून मुंबईतल्या तिच्या चुलत बहिणीला स्पीड पोस्टने पत्र पाठवते. पाकिटावर आधी शहर, मग रस्ता आणि घर क्रमांक, आणि एक छोटी सूचना: "संध्याकाळी 5 नंतर द्या". पत्त्याचा प्रत्येक भाग क्रमाने असल्यामुळे पोस्टमनला बरोबर घर सापडतं. दोन दिवसांनी उत्तराचं पत्र येतं, त्यावर पोहोचल्याचा शिक्का असतो. पत्ता म्हणजे URL. उत्तराचं पत्र म्हणजे response. शिक्का म्हणजे status.',
      },
      scene: {
        type: 'exchange',
        client: { icon: '🧑', label: 'Meera in Pune (client)', mr: 'पुण्यात मीरा (client)' },
        server: { icon: '🏠', label: 'House in Mumbai (server)', mr: 'मुंबईतलं घर (server)' },
        request: { icon: '✉️', label: 'Letter + address (URL)', mr: 'पत्र + पत्ता (URL)' },
        response: { icon: '📬', label: 'Reply + stamp (status)', mr: 'उत्तर + शिक्का (status)' },
        note: { en: 'City = host, street and house = path, the little note = query.', mr: 'शहर = host, रस्ता आणि घर = path, छोटी सूचना = query.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'neutral', text: { en: 'Every request the TiffinGo app sends has an address, like a letter. One wrong letter in it and the request lands at the wrong door.', mr: 'TiffinGo ॲप पाठवत असलेल्या प्रत्येक request ला पत्रासारखा पत्ता असतो. त्यात एक अक्षर चुकलं की request चुकीच्या दारात पोहोचते.' } },
        { who: 'sam', mood: 'worried', text: { en: 'Customers say the "Veg only" switch shows them non-veg food. Is the app sending the wrong address, or is the server answering wrong?', mr: 'ग्राहक म्हणतात "Veg only" बटण दाबलं तरी non-veg पदार्थ दिसतात. ॲप चुकीचा पत्ता पाठवतंय, की server चुकीचं उत्तर देतोय?' } },
        { who: 'meera', mood: 'happy', text: { en: 'To answer that, {name}, you need to read an address the way the postman does: piece by piece. Then read the reply and its stamp.', mr: 'याचं उत्तर द्यायला, {name}, तुला पोस्टमनसारखा पत्ता वाचता यायला हवा: भाग भाग करून. मग उत्तर आणि त्यावरचा शिक्का वाचायचा.' } },
      ],
      problem: { en: 'A request is a jumble of letters until you can read it. Without that, you cannot tell whether the app asked the wrong question or the server gave the wrong answer.', mr: 'वाचता येईपर्यंत request म्हणजे अक्षरांचा गोंधळ वाटतो. ते वाचता आलं नाही, तर ॲपने चुकीचा प्रश्न विचारला की server ने चुकीचं उत्तर दिलं, हे सांगता येत नाही.' },
      solution: { en: 'Split the URL into host, path and query, and split the response into status, headers and body. Then every request and answer becomes easy to check.', mr: 'URL चे host, path आणि query असे भाग करा, आणि response चे status, headers आणि body असे भाग करा. मग प्रत्येक request आणि उत्तर तपासणं सोपं होतं.' },
    },
    lesson: [
      { en: 'A URL is the full address of what you want. Take https://api.tiffingo.test/v1/restaurants/3/menu?veg=true. The scheme https:// is the delivery service (secure post). The host api.tiffingo.test is the city: which server. /v1 is the version of the API, like the building wing.', mr: 'URL म्हणजे तुम्हाला जे हवं त्याचा पूर्ण पत्ता. हा पाहा: https://api.tiffingo.test/v1/restaurants/3/menu?veg=true. scheme https:// म्हणजे पोस्ट सेवा (सुरक्षित पोस्ट). host api.tiffingo.test म्हणजे शहर: कोणता server. /v1 म्हणजे API चं version, इमारतीच्या विंगसारखं.' },
      { en: 'The path /restaurants/3/menu is the street and house: restaurant number 3, its menu. Everything after the ? is the query: extra notes like veg=true. Several notes are joined with &, for example /restaurants?city=Pune&veg=true.', mr: 'path /restaurants/3/menu म्हणजे रस्ता आणि घर: restaurant क्रमांक 3, त्याचा मेन्यू. ? नंतरचं सगळं म्हणजे query: veg=true सारख्या जादा सूचना. अनेक सूचना & ने जोडतात, उदा. /restaurants?city=Pune&veg=true.' },
      { en: 'A request has four parts: the method (what you want to do, like GET = fetch), the URL, headers (labels on the envelope) and sometimes a body (the letter inside). A response has three: a status code (the stamp, like 200 OK), headers, and a body (the reply letter).', mr: 'Request चे चार भाग असतात: method (काय करायचं, जसं GET = आणा), URL, headers (पाकिटावरची लेबलं) आणि कधी कधी body (आतलं पत्र). Response चे तीन: status code (शिक्का, जसा 200 OK), headers, आणि body (उत्तराचं पत्र).' },
      { en: 'A tester reads all of it. Did the app send the right path and query? Did the stamp say 200? Does the body hold what the query asked for? A wrong answer to the right question is a server bug.', mr: 'टेस्टर हे सगळं वाचतो. ॲपने योग्य path आणि query पाठवली का? शिक्का 200 चा होता का? query ने जे मागितलं तेच body मध्ये आहे का? योग्य प्रश्नाचं चुकीचं उत्तर म्हणजे server चा बग.' },
    ],
    syntax: {
      template: 'GET https://api.tiffingo.test/v1/restaurants/3/menu?veg=true\nAccept: application/json\n\nHTTP/1.1 200 OK\ncontent-type: application/json; charset=utf-8\n\n{ "restaurantId": 3, "restaurantName": "Dosa Corner", "items": [ ... ] }',
      parts: [
        { code: 'GET', means: { en: 'the method: what you want to do (GET = fetch, read only)', mr: 'method: काय करायचं (GET = आणा, फक्त वाचा)' } },
        { code: 'https://', means: { en: 'the scheme: the secure delivery service', mr: 'scheme: सुरक्षित पोस्ट सेवा' } },
        { code: 'api.tiffingo.test', means: { en: 'the host: which server (the city)', mr: 'host: कोणता server (शहर)' } },
        { code: '/v1', means: { en: 'the version, or base path, of the API', mr: 'API चं version, किंवा base path' } },
        { code: '/restaurants/3/menu', means: { en: 'the path: exactly which thing (street and house)', mr: 'path: नेमकी कोणती गोष्ट (रस्ता आणि घर)' } },
        { code: '?veg=true', means: { en: 'the query: extra notes, written as name=value', mr: 'query: जादा सूचना, name=value अशा लिहिलेल्या' } },
        { code: 'Accept: application/json', means: { en: 'a request header: a label on the envelope', mr: 'request header: पाकिटावरचं लेबल' } },
        { code: '200 OK', means: { en: 'the status code: the delivery stamp', mr: 'status code: पोहोचल्याचा शिक्का' } },
        { code: '{ ... }', means: { en: 'the response body: the reply letter (JSON)', mr: 'response body: उत्तराचं पत्र (JSON)' } },
      ],
      example: [
        { code: 'https://', note: { en: 'speed post, sealed so nobody reads it on the way', mr: 'स्पीड पोस्ट, वाटेत कोणी वाचू नये म्हणून बंद' } },
        { code: 'api.tiffingo.test', note: { en: 'the city: Mumbai', mr: 'शहर: मुंबई' } },
        { code: '/v1', note: { en: 'the building wing', mr: 'इमारतीची विंग' } },
        { code: '/restaurants/3/menu', note: { en: 'the street and house number', mr: 'रस्ता आणि घर क्रमांक' } },
        { code: '?veg=true', note: { en: 'the little note: "deliver after 5 pm"', mr: 'छोटी सूचना: "संध्याकाळी 5 नंतर द्या"' } },
        { code: '200 OK', note: { en: 'the stamp: delivered safely', mr: 'शिक्का: सुखरूप पोहोचलं' } },
      ],
      pitfall: { en: 'The ? starts the query, and it comes only once. Extra notes are joined with &, so ?city=Pune&veg=true is right and ?city=Pune?veg=true is wrong.', mr: '? ने query सुरू होते, आणि तो फक्त एकदाच येतो. जादा सूचना & ने जोडतात, म्हणून ?city=Pune&veg=true बरोबर, ?city=Pune?veg=true चूक.' },
    },
    practice: {
      intro: { en: 'Now you write the address yourself. The base URL https://api.tiffingo.test/v1 is already fixed in the console. You type only the path, and the query when needed. Send lets you try a request as often as you like. Submit this request sends it and checks your answer.', mr: 'आता पत्ता तुम्ही स्वतः लिहा. base URL https://api.tiffingo.test/v1 console मध्ये आधीच ठरलेला आहे. तुम्ही फक्त path टाइप करा, आणि गरज असेल तेव्हा query. Send ने request हवी तितक्या वेळा पाठवून पाहता येते. Submit this request ती पाठवतं आणि तुमचं उत्तर तपासतं.' },
      steps: [
        {
          kind: 'api',
          prompt: { en: 'Fetch the menu of restaurant 3 (Dosa Corner). The method GET is already chosen. Type the path and press Submit this request.', mr: 'restaurant 3 (Dosa Corner) चा मेन्यू आणा. GET method आधीच निवडलेली आहे. path टाइप करा आणि Submit this request दाबा.' },
          starter: { method: 'GET', path: '' },
          expect: { method: 'GET', path: '/restaurants/3/menu', status: 200 },
          solution: { method: 'GET', path: '/restaurants/3/menu' },
          hints: [
            { en: 'The path goes from general to specific: restaurants, then which one, then its menu.', mr: 'path सामान्याकडून नेमक्याकडे जातो: restaurants, मग कोणतं, मग त्याचा मेन्यू.' },
            { en: 'Separate each piece with a slash /.', mr: 'प्रत्येक भाग slash / ने वेगळा करा.' },
            { en: '/restaurants/3/menu', mr: '/restaurants/3/menu' },
          ],
          successLine: { en: 'Status 200: delivered. You wrote your first API address.', mr: 'Status 200: पोहोचलं. तुम्ही तुमचा पहिला API पत्ता लिहिला.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Now add a little note: show only veg dishes. Add the query veg=true to the same path and press Submit this request. Then compare the list with the last one.', mr: 'आता छोटी सूचना जोडा: फक्त veg पदार्थ दाखवा. त्याच path ला query veg=true जोडा आणि Submit this request दाबा. मग ही यादी आधीच्या यादीशी ताडून पाहा.' },
          starter: { method: 'GET', path: '/restaurants/3/menu' },
          expect: { method: 'GET', path: '/restaurants/3/menu', query: { veg: 'true' }, status: 200 },
          solution: { method: 'GET', path: '/restaurants/3/menu?veg=true' },
          hints: [
            { en: 'The query goes at the very end of the path.', mr: 'query path च्या अगदी शेवटी येते.' },
            { en: 'It starts with a question mark, then name=value.', mr: 'ती प्रश्नचिन्हाने सुरू होते, मग name=value.' },
            { en: '/restaurants/3/menu?veg=true', mr: '/restaurants/3/menu?veg=true' },
          ],
          successLine: { en: 'Same 4 dishes: Dosa Corner is fully veg, so the filter had nothing to remove. A tester notices that too, and tries a restaurant with non-veg dishes next.', mr: 'तेच 4 पदार्थ: Dosa Corner पूर्ण veg आहे, म्हणून filter ला काढायला काहीच नव्हतं. टेस्टर हेही लक्षात घेतो, आणि पुढे non-veg पदार्थ असलेलं रेस्टॉरंट वापरून पाहतो.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Look at this URL: https://api.tiffingo.test/v1/restaurants/3/menu?veg=true. Which part is the query?', mr: 'हा URL पाहा: https://api.tiffingo.test/v1/restaurants/3/menu?veg=true. यातला query कोणता भाग आहे?' },
          options: ['api.tiffingo.test', '/restaurants/3/menu', '?veg=true', '/v1'],
          correct: [2],
          explain: { en: 'Everything after the ? is the query. api.tiffingo.test is the host, /v1 is the version and /restaurants/3/menu is the path.', mr: '? नंतरचं सगळं म्हणजे query. api.tiffingo.test हा host, /v1 हे version आणि /restaurants/3/menu हा path.' },
          hints: [
            { en: 'The query is the little note at the end of the address.', mr: 'query म्हणजे पत्त्याच्या शेवटची छोटी सूचना.' },
            { en: 'Look for the question mark.', mr: 'प्रश्नचिन्ह शोधा.' },
          ],
        },
        {
          kind: 'choice',
          prompt: { en: 'Every response has a stamp and labels too. Press Send. What is the status code, and what does the content-type header say?', mr: 'प्रत्येक response ला शिक्का आणि लेबलंही असतात. Send दाबा. status code काय आहे, आणि content-type header काय सांगतो?' },
          apiSandbox: { method: 'GET', path: '/restaurants/3' },
          options: [
            '201, text/html',
            '200, application/json; charset=utf-8',
            '404, application/json; charset=utf-8',
            '200, text/plain',
          ],
          correct: [1],
          explain: { en: 'The stamp is 200 OK, and the content-type header says the body is JSON (application/json; charset=utf-8). The response always has a status, headers and a body.', mr: 'शिक्का 200 OK आहे, आणि content-type header सांगतो की body JSON आहे (application/json; charset=utf-8). response मध्ये नेहमी status, headers आणि body असतात.' },
          hints: [
            { en: 'The status code is shown at the top of the response, next to the time.', mr: 'status code response च्या वर, वेळेच्या शेजारी दिसतो.' },
            { en: 'Click the Headers tab of the response and find content-type.', mr: 'response चा Headers tab उघडा आणि content-type शोधा.' },
            { en: 'The body you saw is JSON, so the header says application/json.', mr: 'तुम्ही पाहिलेली body JSON आहे, म्हणून header application/json सांगतो.' },
          ],
          successLine: { en: 'Address, stamp, labels, letter. You can read a whole exchange now.', mr: 'पत्ता, शिक्का, लेबलं, पत्र. आता तुम्ही संपूर्ण देवाणघेवाण वाचू शकता.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'In this URL, what is the host?', mr: 'या URL मध्ये host कोणता?' },
        code: 'https://api.tiffingo.test/v1/restaurants/3/menu?veg=true',
        options: ['/restaurants/3/menu', 'veg=true', 'https://', 'api.tiffingo.test'],
        answer: 3,
        explain: { en: 'The host is the city on the envelope: which server receives the request.', mr: 'host म्हणजे पाकिटावरचं शहर: कोणता server request घेतो.' },
      },
      {
        q: { en: 'A request is made of...', mr: 'Request कशाची बनलेली असते?' },
        options: [
          { en: 'Status code, headers and body', mr: 'Status code, headers आणि body' },
          { en: 'Method, URL, headers and (sometimes) a body', mr: 'Method, URL, headers आणि (कधी कधी) body' },
          { en: 'Only the URL', mr: 'फक्त URL' },
          { en: 'Host and stamp', mr: 'Host आणि शिक्का' },
        ],
        answer: 1,
        explain: { en: 'Method + URL + headers + body is the request. Status + headers + body is the response.', mr: 'Method + URL + headers + body म्हणजे request. Status + headers + body म्हणजे response.' },
      },
      {
        q: { en: 'You want the list of restaurants in Pune, veg only. Which path is written correctly?', mr: 'तुम्हाला पुण्यातल्या रेस्टॉरंट्सची यादी हवी आहे, फक्त veg. कोणता path बरोबर लिहिला आहे?' },
        options: [
          '/restaurants?city=Pune&veg=true',
          '/restaurants?city=Pune?veg=true',
          '/restaurants&city=Pune&veg=true',
          '/restaurants/city=Pune/veg=true',
        ],
        answer: 0,
        explain: { en: 'One ? starts the query, and & joins the extra notes.', mr: 'एक ? query सुरू करतो, आणि & जादा सूचना जोडतो.' },
      },
      {
        q: { en: 'In the speed-post story, the delivery stamp matches which part of a response?', mr: 'स्पीड पोस्टच्या गोष्टीत पोहोचल्याचा शिक्का response च्या कोणत्या भागाशी जुळतो?' },
        options: [
          { en: 'The body', mr: 'Body' },
          { en: 'The path', mr: 'Path' },
          { en: 'The status code', mr: 'Status code' },
          { en: 'The query', mr: 'Query' },
        ],
        answer: 2,
        explain: { en: 'The status code, like 200 OK, tells you at a glance what happened to your request.', mr: 'status code, जसा 200 OK, तुमच्या request चं काय झालं ते एका नजरेत सांगतो.' },
      },
    ],
    recap: { line: { en: 'URL = scheme + host + version + path + ?query. Request = method + URL + headers + body. Response = status + headers + body.', mr: 'URL = scheme + host + version + path + ?query. Request = method + URL + headers + body. Response = status + headers + body.' }, icon: '📮' },
  },
]
