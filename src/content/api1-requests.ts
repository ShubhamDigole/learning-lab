import type { Lesson } from './types.ts'

// API 1, part 2: shaping requests. Path and query parameters, sending a body with headers,
// logging in with a token, and the boss fight that ends the TiffinGo act.

const JSON_CT = { 'Content-Type': 'application/json' }
const ASHA = { Authorization: 'Bearer tg_asha_9f2c' }

export const apiRequestLessons: Lesson[] = [
  // ───────────────────────── A1.4 Path and query parameters
  {
    id: 'ap1-4',
    code: 'A1.4',
    level: 'basic',
    title: { en: 'Path and Query Parameters', mr: 'Path आणि Query Parameters' },
    skill: 'Path & query parameters',
    realLife: {
      place: 'market',
      title: { en: 'Stall number 3, ripe tomatoes only', mr: 'स्टॉल नंबर 3, फक्त लाल टोमॅटो' },
      story: {
        en: 'Saturday morning at the vegetable market. Aai walks straight to "stall number 3", the one she trusts. That number picks one stall out of fifty. Then she tells the bhajiwala: "Tomatoes. Only ripe ones. 1 kg." He does not hand her the whole basket. He picks only what matches her words and weighs out exactly 1 kg.',
        mr: 'शनिवारी सकाळी भाजी मंडईत आई थेट "स्टॉल नंबर 3" वर जाते, तिच्या विश्वासातल्या. तो नंबर पन्नास स्टॉल्समधून एक स्टॉल निवडतो. मग ती भाजीवाल्याला सांगते: "टोमॅटो. फक्त लाल, पिकलेले. 1 किलो." तो तिला अख्खी टोपली देत नाही. तिच्या शब्दांशी जुळणारे टोमॅटोच निवडतो आणि बरोबर 1 किलो तोलून देतो.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Stall 3: tomatoes, ripe only, 1 kg', mr: 'स्टॉल 3: टोमॅटो, फक्त पिकलेले, 1 किलो' },
        items: [
          { icon: '🍅', label: 'Ripe tomato', mr: 'पिकलेला टोमॅटो', pass: true },
          { icon: '🟢', label: 'Green tomato', mr: 'कच्चा टोमॅटो', pass: false },
          { icon: '🍅', label: 'Ripe tomato', mr: 'पिकलेला टोमॅटो', pass: true },
          { icon: '🧅', label: 'Onion', mr: 'कांदा', pass: false },
          { icon: '🍅', label: 'Ripe tomato', mr: 'पिकलेला टोमॅटो', pass: true },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Customers in Pune say the app shows them biryani places from Mumbai. Nobody wants a 3 hour delivery.', mr: 'पुण्यातले ग्राहक म्हणतात ॲप त्यांना मुंबईची बिर्याणीची ठिकाणं दाखवतं. 3 तासांची डिलिव्हरी कोणाला हवीये?' } },
        { who: 'theo', mood: 'neutral', text: { en: 'The app asks for /restaurants and gets all 12. It should ask for /restaurants?city=Pune.', mr: 'ॲप /restaurants मागतं आणि सगळी 12 मिळतात. त्याने /restaurants?city=Pune मागायला हवं.' } },
        { who: 'meera', mood: 'happy', text: { en: 'That little ?city=Pune is a query parameter, {name}. It is the "only ripe ones" of the API world.', mr: 'ते छोटंसं ?city=Pune म्हणजे query parameter, {name}. API च्या जगातलं "फक्त पिकलेले".' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> filters are my favourite hiding place. one wrong item in a list of eight... who checks every row? ⌁', mr: '>> filters ही माझी आवडती लपायची जागा. आठांच्या यादीत एक चुकीचं... प्रत्येक ओळ कोण तपासतो? ⌁' } },
      ],
      problem: { en: 'Without filters, the app downloads everything and the customer scrolls through things they never asked for. With broken filters, they get the wrong things.', mr: 'filters नसतील तर ॲप सगळंच आणतं आणि ग्राहक न मागितलेल्या गोष्टींमधून स्क्रोल करत बसतो. filters बिघडले तर चुकीच्या गोष्टी मिळतात.' },
      solution: { en: 'The path picks one exact thing (/restaurants/3). Query parameters after a ? filter, sort and limit a list. A tester checks that every item in the answer obeys the filter.', mr: 'path एक नेमकी गोष्ट निवडतो (/restaurants/3). ? नंतरचे query parameters यादी गाळतात, क्रमाने लावतात आणि मर्यादित करतात. टेस्टर तपासतो की उत्तरातली प्रत्येक गोष्ट filter पाळते.' },
    },
    lesson: [
      { en: 'A path parameter is part of the address itself. In /restaurants/3, the 3 says "this one restaurant", like stall number 3. Change it to 4 and you get a different restaurant.', mr: 'path parameter पत्त्याचाच भाग असतो. /restaurants/3 मध्ये 3 म्हणतो "हेच एक रेस्टॉरंट", स्टॉल नंबर 3 सारखं. 4 केलं की वेगळं रेस्टॉरंट मिळतं.' },
      { en: 'Query parameters come after a question mark: /restaurants?city=Pune. Each one is a name=value pair. Join more of them with &: ?city=Pune&veg=true. They shape the answer: which ones, in what order, how many.', mr: 'Query parameters प्रश्नचिन्हानंतर येतात: /restaurants?city=Pune. प्रत्येक जोडी name=value अशी. जास्त जोडायचे असतील तर & वापरा: ?city=Pune&veg=true. ते उत्तराला आकार देतात: कोणते, कोणत्या क्रमाने, किती.' },
      { en: 'TiffinGo understands city, veg, cuisine, sort (rating, name or deliveryMins), limit and page. The answer also tells you total: how many matched in all.', mr: 'TiffinGo ला city, veg, cuisine, sort (rating, name किंवा deliveryMins), limit आणि page समजतात. उत्तरात total पण असतं: एकूण किती जुळले.' },
      { en: 'The tester\'s rule: never trust a filter by looking at the first row. Read every item. If you asked for veg=true, every single item must say "veg": true. One that does not is a bug.', mr: 'टेस्टरचा नियम: पहिली ओळ पाहून filter वर विश्वास ठेवू नका. प्रत्येक item वाचा. veg=true मागितलं असेल तर प्रत्येक item मध्ये "veg": true हवंच. एक जरी नसेल तर तो बग आहे.' },
    ],
    syntax: {
      template: 'GET /restaurants/3\n\nGET /restaurants?city=Pune&veg=true&sort=rating&limit=3',
      parts: [
        { code: '/restaurants/3', means: { en: 'path parameter: picks one exact restaurant (stall number 3)', mr: 'path parameter: एक नेमकं रेस्टॉरंट निवडतो (स्टॉल नंबर 3)' } },
        { code: '?', means: { en: 'starts the query parameters. Use it only once.', mr: 'query parameters सुरू होतात. फक्त एकदाच वापरा.' } },
        { code: 'city=Pune', means: { en: 'one filter: name=value', mr: 'एक filter: name=value' } },
        { code: '&', means: { en: 'joins one more parameter ("and also...")', mr: 'अजून एक parameter जोडतो ("आणि हेही...")' } },
        { code: 'sort=rating&limit=3', means: { en: 'shape the answer: best rated first, only 3', mr: 'उत्तराला आकार: सर्वात चांगलं रेटिंग आधी, फक्त 3' } },
      ],
      example: [
        { code: 'GET /restaurants/4', note: { en: 'go to stall number 4: one exact restaurant', mr: 'स्टॉल नंबर 4 वर जा: एक नेमकं रेस्टॉरंट' } },
        { code: 'GET /restaurants?city=Pune', note: { en: 'only stalls in Pune', mr: 'फक्त पुण्यातले स्टॉल्स' } },
        { code: 'GET /restaurants?city=Pune&veg=true', note: { en: 'Pune, and only veg (only ripe tomatoes)', mr: 'पुणे, आणि फक्त veg (फक्त पिकलेले टोमॅटो)' } },
        { code: 'GET /restaurants?sort=rating', note: { en: 'best first, like picking the reddest tomatoes on top', mr: 'चांगलं आधी, सगळ्यात लाल टोमॅटो वर ठेवल्यासारखं' } },
        { code: 'GET /restaurants?sort=rating&limit=3', note: { en: 'only the top 3 (just 1 kg, not the whole basket)', mr: 'फक्त पहिले 3 (फक्त 1 किलो, अख्खी टोपली नाही)' } },
      ],
      pitfall: { en: 'Only the first parameter gets a ?. The rest use &. Writing ?city=Pune?veg=true breaks the veg filter, and the server still answers 200, so it looks fine. Also, a misspelt name like ?veggie=true is usually ignored silently and you get all 12.', mr: 'फक्त पहिल्या parameter ला ? लागतं. बाकीच्यांना &. ?city=Pune?veg=true लिहिलं तर veg filter मोडतो, आणि तरीही सर्व्हर 200 देतो, म्हणून सगळं ठीक वाटतं. आणि ?veggie=true सारखं चुकीचं नाव सहसा गुपचूप दुर्लक्षित होतं आणि सगळी 12 मिळतात.' },
    },
    practice: {
      intro: { en: 'Time to shop at the TiffinGo market. Build each request, press Submit this request, and read every item that comes back.', mr: 'आता TiffinGo मंडईत खरेदी करूया. प्रत्येक request बनवा, Submit this request दाबा, आणि परत आलेला प्रत्येक item वाचा.' },
      steps: [
        {
          kind: 'api',
          prompt: { en: 'Sam wants only restaurants in Pune. Add a query parameter to the path so the list shows Pune only.', mr: 'Sam ला फक्त पुण्यातली रेस्टॉरंट्स हवीत. path मध्ये query parameter जोडा म्हणजे यादीत फक्त पुणे दिसेल.' },
          starter: { method: 'GET', path: '/restaurants' },
          expect: { method: 'GET', path: '/restaurants', query: { city: 'Pune' }, status: 200 },
          solution: { method: 'GET', path: '/restaurants?city=Pune' },
          hints: [
            { en: 'Query parameters go after a question mark at the end of the path.', mr: 'Query parameters path च्या शेवटी प्रश्नचिन्हानंतर येतात.' },
            { en: 'The parameter name is city, and the value is Pune.', mr: 'parameter चं नाव city, आणि value Pune.' },
            { en: '/restaurants?city=Pune', mr: '/restaurants?city=Pune' },
          ],
          successLine: { en: '5 restaurants, all in Pune. "total": 5.', mr: '5 रेस्टॉरंट्स, सगळी पुण्यातली. "total": 5.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Now add a second filter: Pune and veg only. Keep city=Pune and join veg=true to it.', mr: 'आता दुसरा filter जोडा: पुणे आणि फक्त veg. city=Pune ठेवा आणि त्याला veg=true जोडा.' },
          starter: { method: 'GET', path: '/restaurants?city=Pune' },
          expect: { method: 'GET', path: '/restaurants', query: { city: 'Pune', veg: 'true' }, status: 200 },
          solution: { method: 'GET', path: '/restaurants?city=Pune&veg=true' },
          hints: [
            { en: 'The second parameter is joined with &, not with another ?.', mr: 'दुसरा parameter & ने जोडतात, दुसऱ्या ? ने नाही.' },
            { en: 'Add &veg=true at the end of the path.', mr: 'path च्या शेवटी &veg=true जोडा.' },
            { en: '/restaurants?city=Pune&veg=true', mr: '/restaurants?city=Pune&veg=true' },
          ],
          successLine: { en: 'Done. But look at "total": 5 again, the same as all of Pune. Hmm. Keep that thought.', mr: 'झालं. पण "total" पाहा: पुन्हा 5, संपूर्ण पुण्याइतकंच. हम्म. हा विचार लक्षात ठेवा.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Press Send to get every veg restaurant. Read each item\'s "veg" field. Which restaurant should not be in this list?', mr: 'सगळी veg रेस्टॉरंट्स मिळवण्यासाठी Send दाबा. प्रत्येक item चं "veg" field वाचा. कोणतं रेस्टॉरंट या यादीत नसायला हवं?' },
          apiSandbox: { method: 'GET', path: '/restaurants?veg=true' },
          options: ['Green Bowl', 'Pav Bhaji Junction', 'Kolhapuri Kitchen', 'Sweet Modak'],
          correct: [2],
          explain: { en: 'Kolhapuri Kitchen (id 10) says "veg": false, yet the veg=true filter let it through. A vegetarian customer could order mutton rassa by mistake. Report it like this: "GET /restaurants?veg=true returns Kolhapuri Kitchen (id 10) with veg:false. Expected: only veg:true items."', mr: 'Kolhapuri Kitchen (id 10) मध्ये "veg": false आहे, तरीही veg=true filter ने ते आत येऊ दिलं. शाकाहारी ग्राहक चुकून मटण रस्सा मागवू शकतो. रिपोर्ट असा लिहा: "GET /restaurants?veg=true मध्ये Kolhapuri Kitchen (id 10) veg:false सह येतं. अपेक्षित: फक्त veg:true items."' },
          hints: [
            { en: 'Do not stop at the first few rows. Scroll through all 8.', mr: 'पहिल्या काही ओळींवर थांबू नका. सगळे 8 पाहा.' },
            { en: 'Look for one item where "veg" is false.', mr: 'असा एक item शोधा ज्यात "veg" false आहे.' },
            { en: 'It is id 10, a spicy Kolhapuri place.', mr: 'तो id 10 आहे, एक तिखट कोल्हापुरी ठिकाण.' },
          ],
          successLine: { en: 'Bug 1 caught. The Gremlin hisses.', mr: 'बग 1 पकडला. ग्रेमलिन फुसफुसतो.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Sam wants a "Top 3" banner on the home screen. Ask for all restaurants sorted by rating, but only 3 of them.', mr: 'Sam ला होम स्क्रीनवर "Top 3" बॅनर हवा आहे. सगळी रेस्टॉरंट्स rating नुसार लावून मागा, पण फक्त 3.' },
          starter: { method: 'GET', path: '/restaurants' },
          expect: { method: 'GET', path: '/restaurants', query: { sort: 'rating', limit: '3' }, status: 200 },
          solution: { method: 'GET', path: '/restaurants?sort=rating&limit=3' },
          hints: [
            { en: 'You need two parameters: one to sort, one to limit how many.', mr: 'दोन parameters हवेत: एक क्रमाने लावायला, एक किती ते ठरवायला.' },
            { en: 'sort=rating puts the best first. limit=3 keeps only 3.', mr: 'sort=rating चांगलं आधी लावतो. limit=3 फक्त 3 ठेवतो.' },
            { en: '/restaurants?sort=rating&limit=3', mr: '/restaurants?sort=rating&limit=3' },
          ],
          successLine: { en: 'Sweet Modak 4.8, Misal Point 4.7, Saffron Thali 4.6. Pune wins the banner.', mr: 'Sweet Modak 4.8, Misal Point 4.7, Saffron Thali 4.6. बॅनरवर पुण्याचा कब्जा.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'In GET /restaurants/7, what does the 7 do?', mr: 'GET /restaurants/7 मध्ये 7 काय करतो?' },
        options: [
          { en: 'Picks one exact restaurant, the one with id 7', mr: 'एक नेमकं रेस्टॉरंट निवडतो, ज्याचा id 7 आहे' },
          { en: 'Limits the list to 7 restaurants', mr: 'यादी 7 रेस्टॉरंट्सपुरती मर्यादित करतो' },
          { en: 'Sorts by rating 7 and above', mr: '7 आणि त्यावरच्या rating नुसार लावतो' },
          { en: 'Shows page 7', mr: 'पान 7 दाखवतो' },
        ],
        answer: 0,
        explain: { en: 'A path parameter is part of the address and picks one thing, like stall number 7.', mr: 'path parameter पत्त्याचा भाग असतो आणि एक गोष्ट निवडतो, स्टॉल नंबर 7 सारखी.' },
      },
      {
        q: { en: 'Which request asks for veg restaurants in Nashik?', mr: 'नाशिकमधली veg रेस्टॉरंट्स कोणती request मागते?' },
        options: ['GET /restaurants?city=Nashik?veg=true', 'GET /restaurants/Nashik/veg', 'GET /restaurants?city=Nashik&veg=true', 'GET /restaurants&city=Nashik&veg=true'],
        answer: 2,
        explain: { en: 'One ? to start, then & between parameters.', mr: 'सुरुवातीला एक ?, मग parameters मध्ये &.' },
      },
      {
        q: { en: 'You send GET /restaurants?veggie=true by mistake. The server answers 200 with all 12 restaurants. What happened?', mr: 'तुम्ही चुकून GET /restaurants?veggie=true पाठवलं. सर्व्हर सगळ्या 12 रेस्टॉरंट्ससह 200 देतो. काय झालं?' },
        options: [
          { en: 'All 12 restaurants are veg', mr: 'सगळी 12 रेस्टॉरंट्स veg आहेत' },
          { en: 'The server crashed', mr: 'सर्व्हर बंद पडला' },
          { en: 'The token expired', mr: 'token संपला' },
          { en: 'The server did not know "veggie", so it ignored it and applied no filter', mr: 'सर्व्हरला "veggie" माहीत नव्हतं, म्हणून त्याने दुर्लक्ष केलं आणि कोणताही filter लावला नाही' },
        ],
        answer: 3,
        explain: { en: 'Unknown parameters are often ignored silently. A 200 does not prove your filter worked. Read the items.', mr: 'अनोळखी parameters बहुतेक वेळा गुपचूप दुर्लक्षित होतात. 200 म्हणजे filter चालला याचा पुरावा नाही. items वाचा.' },
      },
      {
        q: { en: 'GET /restaurants?city=Mumbai returns 5 items. One of them says "city": "Pune". What do you do?', mr: 'GET /restaurants?city=Mumbai 5 items देतो. त्यातल्या एकात "city": "Pune" आहे. तुम्ही काय कराल?' },
        options: [
          { en: 'Ignore it, 4 out of 5 is good enough', mr: 'दुर्लक्ष करा, 5 पैकी 4 पुरेसं आहे' },
          { en: 'Report a bug: the city filter lets a Pune restaurant through, with the request and the item id', mr: 'बग रिपोर्ट करा: city filter पुण्याचं रेस्टॉरंट आत येऊ देतो, request आणि item id सह' },
          { en: 'Change the app to show all cities', mr: 'ॲपमध्ये सगळी शहरं दाखवायला सांगा' },
          { en: 'Send the request again until it is right', mr: 'बरोबर येईपर्यंत request पुन्हा पाठवा' },
        ],
        answer: 1,
        explain: { en: 'Every item must obey the filter. Give the exact request, the wrong item and what you expected.', mr: 'प्रत्येक item ने filter पाळायलाच हवा. नेमकी request, चुकीचा item आणि अपेक्षित काय होतं ते द्या.' },
      },
    ],
    recap: { line: { en: 'The path picks one thing; ?name=value&name=value filters and shapes a list. Check every item obeys the filter.', mr: 'path एक गोष्ट निवडतो; ?name=value&name=value यादी गाळतो आणि आकार देतो. प्रत्येक item filter पाळतो का ते तपासा.' }, icon: '🍅' },
  },

  // ───────────────────────── A1.5 Request body and headers
  {
    id: 'ap1-5',
    code: 'A1.5',
    level: 'basic',
    title: { en: 'Sending Data: Request Body and Headers', mr: 'डेटा पाठवणं: Request Body आणि Headers' },
    skill: 'Request body & headers',
    realLife: {
      place: 'bank',
      title: { en: 'The bank deposit slip', mr: 'बँकेची पैसे भरण्याची स्लिप' },
      story: {
        en: 'Baba goes to the bank to deposit 5,000 rupees. He picks up the deposit slip, the one with "Pay-in Slip" printed on top, and fills the boxes: account number, name, amount. The clerk glances at the top first: "Ah, a deposit slip." Now she knows how to read the boxes. She checks them, stamps the counterfoil and hands it back. That stamped piece is his proof: "Created. Here is where your money went."',
        mr: 'बाबा बँकेत 5,000 रुपये भरायला जातात. ते वर "Pay-in Slip" छापलेली स्लिप घेतात आणि रकाने भरतात: खाते क्रमांक, नाव, रक्कम. कॅशियर बाई आधी वरचं नाव पाहतात: "अच्छा, पैसे भरण्याची स्लिप." आता रकाने कसे वाचायचे ते त्यांना कळतं. त्या तपासतात, काउंटरफॉइलवर शिक्का मारतात आणि परत देतात. तो शिक्का मारलेला तुकडा म्हणजे बाबांचा पुरावा: "जमा झाले. पैसे इथे गेले."',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🏷️', label: 'Slip type on top (Content-Type)', mr: 'वर स्लिपचा प्रकार (Content-Type)' },
          { icon: '✍️', label: 'Fill the boxes (body)', mr: 'रकाने भरा (body)' },
          { icon: '🧑‍💼', label: 'Clerk checks the boxes', mr: 'कॅशियर रकाने तपासतात' },
          { icon: '🧾', label: 'Stamped counterfoil (201)', mr: 'शिक्का मारलेला काउंटरफॉइल (201)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'The new feedback form on the app is broken. People type a review, tap "Post review", and get an error.', mr: 'ॲपवरचा नवीन feedback फॉर्म बिघडलाय. लोक review लिहितात, "Post review" दाबतात, आणि एरर येतो.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'Our logs say 415 Unsupported Media Type. The app sends the data, but forgets to say what kind of data it is.', mr: 'आमचे logs 415 Unsupported Media Type सांगतात. ॲप डेटा पाठवतं, पण तो कोणत्या प्रकारचा आहे ते सांगायला विसरतं.' } },
        { who: 'meera', mood: 'happy', text: { en: 'A filled slip with no title on top, {name}. The clerk refuses to guess. Let\'s learn how to send data properly.', mr: 'वर नाव नसलेली भरलेली स्लिप, {name}. कॅशियर अंदाज लावत नाहीत. डेटा नीट कसा पाठवायचा ते शिकूया.' } },
      ],
      problem: { en: 'GET only asks. To create or change something, the app must send data. If the data or its label is wrong, the server refuses and the customer\'s review is lost.', mr: 'GET फक्त विचारतं. काही तयार करायचं किंवा बदलायचं असेल तर ॲपला डेटा पाठवावा लागतो. डेटा किंवा त्याचं लेबल चुकलं तर सर्व्हर नाकारतो आणि ग्राहकाचा review हरवतो.' },
      solution: { en: 'Send the data as JSON in the request body, and add the header Content-Type: application/json so the server knows how to read it. A good server answers 201 Created and tells you where the new thing lives.', mr: 'डेटा JSON स्वरूपात request body मध्ये पाठवा, आणि Content-Type: application/json हा header जोडा म्हणजे सर्व्हरला तो कसा वाचायचा ते कळेल. चांगला सर्व्हर 201 Created देतो आणि नवीन गोष्ट कुठे आहे ते सांगतो.' },
    },
    lesson: [
      { en: 'The body is the filled boxes: the data you send, written as JSON. POST, PUT and PATCH usually carry a body. GET does not.', mr: 'body म्हणजे भरलेले रकाने: तुम्ही पाठवता तो डेटा, JSON मध्ये लिहिलेला. POST, PUT आणि PATCH सहसा body घेऊन जातात. GET नाही.' },
      { en: 'Headers are labels on the outside of the request. Content-Type: application/json says "the body is JSON". Without it TiffinGo answers 415, just like a clerk who will not read a slip with no title.', mr: 'Headers म्हणजे request च्या बाहेरची लेबलं. Content-Type: application/json म्हणतो "body JSON आहे". तो नसेल तर TiffinGo 415 देतो, नाव नसलेली स्लिप न वाचणाऱ्या कॅशियरसारखं.' },
      { en: 'When POST creates something, a good server answers 201 Created. The response body shows the saved record with its new id, and a location header gives its address, like the stamped counterfoil.', mr: 'POST ने काही तयार झालं की चांगला सर्व्हर 201 Created देतो. response body मध्ये नवीन id सह साठवलेली नोंद दिसते, आणि location header तिचा पत्ता देतो, शिक्का मारलेल्या काउंटरफॉइलसारखा.' },
      { en: 'PUT replaces the whole record, so you send every field. PATCH changes only the fields you send. The tester checks: missing header gives 415, a broken or incomplete body gives 400 with a clear message, and a good one gives 201 or 200 with exactly what you sent.', mr: 'PUT संपूर्ण नोंद बदलतो, म्हणून प्रत्येक field पाठवा. PATCH फक्त पाठवलेली fields बदलतो. टेस्टर तपासतो: header नसेल तर 415, बिघडलेली किंवा अपूर्ण body असेल तर स्पष्ट message सह 400, आणि बरोबर असेल तर पाठवलं तेच घेऊन 201 किंवा 200.' },
    ],
    syntax: {
      template: 'POST /feedback\nContent-Type: application/json\n\n{\n  "restaurantId": 3,\n  "rating": 5,\n  "comment": "Crispy dosa!"\n}',
      parts: [
        { code: 'POST /feedback', means: { en: 'the method and path: "create a new feedback"', mr: 'method आणि path: "नवीन feedback तयार करा"' } },
        { code: 'Content-Type: application/json', means: { en: 'a header: the title on top of the slip, saying the body is JSON', mr: 'एक header: स्लिपवरचं नाव, body JSON आहे असं सांगणारं' } },
        { code: '(empty line)', means: { en: 'separates the headers from the body', mr: 'headers आणि body वेगळे करते' } },
        { code: '{ "rating": 5, ... }', means: { en: 'the body: the filled boxes, as JSON', mr: 'body: भरलेले रकाने, JSON मध्ये' } },
        { code: '201 + location', means: { en: 'the answer: created, and here is its address', mr: 'उत्तर: तयार झालं, आणि हा त्याचा पत्ता' } },
      ],
      example: [
        { code: 'POST /feedback', note: { en: 'walk to the deposit counter', mr: 'पैसे भरण्याच्या काउंटरवर जा' } },
        { code: 'Content-Type: application/json', note: { en: 'the slip says what kind of form it is', mr: 'स्लिप कोणत्या प्रकारचा फॉर्म आहे ते सांगते' } },
        { code: '{ "restaurantId": 4, "rating": 4, "comment": "Misal was perfect" }', note: { en: 'the filled boxes', mr: 'भरलेले रकाने' } },
        { code: '← 201 Created', note: { en: 'the clerk stamps it: saved', mr: 'कॅशियर शिक्का मारतात: जमा' } },
        { code: '← location: /v1/feedback/7004', note: { en: 'the counterfoil: where your new feedback lives', mr: 'काउंटरफॉइल: तुमचा नवीन feedback कुठे आहे' } },
      ],
      pitfall: { en: 'JSON is strict. Names and text need double quotes ("rating", not rating or \'rating\'), and no comma after the last field. One slip and the server answers 400 BAD_JSON. And never forget the Content-Type header, or you get 415.', mr: 'JSON कडक असतं. नावं आणि मजकुराला double quotes हवेत ("rating", rating किंवा \'rating\' नाही), आणि शेवटच्या field नंतर comma नको. एक चूक आणि सर्व्हर 400 BAD_JSON देतो. आणि Content-Type header कधीच विसरू नका, नाहीतर 415.' },
    },
    practice: {
      intro: { en: 'Fill the slip, label it, get it stamped. Remember: every successful POST creates a new feedback, and new ids start at 7004.', mr: 'स्लिप भरा, लेबल लावा, शिक्का मिळवा. लक्षात ठेवा: प्रत्येक यशस्वी POST नवीन feedback तयार करतो, आणि नवीन id 7004 पासून सुरू होतात.' },
      steps: [
        {
          kind: 'api',
          prompt: { en: 'This is the broken request from the app. Press Send as it is and read the error. Then fix it and press Submit this request, so the server answers 201.', mr: 'ॲपमधली ही बिघडलेली request आहे. आहे तशी Send करा आणि एरर वाचा. मग ती दुरुस्त करा आणि Submit this request दाबा, म्हणजे सर्व्हर 201 देईल.' },
          starter: { method: 'POST', path: '/feedback', body: '{\n  "restaurantId": 3,\n  "rating": 5,\n  "comment": "Crispy dosa, loved it"\n}' },
          expect: { method: 'POST', path: '/feedback', headers: { 'Content-Type': 'application/json' }, status: 201 },
          solution: { method: 'POST', path: '/feedback', headers: JSON_CT, body: '{\n  "restaurantId": 3,\n  "rating": 5,\n  "comment": "Crispy dosa, loved it"\n}' },
          hints: [
            { en: '415 means "I do not know what kind of data this is". The body is fine. Something is missing outside it.', mr: '415 म्हणजे "हा डेटा कोणत्या प्रकारचा ते मला माहीत नाही". body ठीक आहे. बाहेरचं काहीतरी गायब आहे.' },
            { en: 'Open the Headers tab and click + Content-Type (or + Add header and type it).', mr: 'Headers tab उघडा आणि + Content-Type वर क्लिक करा (किंवा + Add header दाबून स्वतः टाइप करा).' },
            { en: 'Content-Type: application/json', mr: 'Content-Type: application/json' },
          ],
          successLine: { en: '201 Created. The feedback is saved with a new id (7004 on a fresh run). The app team gets a one-line fix.', mr: '201 Created. Feedback नव्या id सह साठवला (नव्याने सुरुवात केली असेल तर 7004). ॲप टीमला एका ओळीचा उपाय मिळाला.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'This request is complete. Press Send once, then click the Headers tab of the response. The location header holds the address of the new feedback. Which statement is true?', mr: 'ही request पूर्ण आहे. एकदाच Send दाबा, मग response चा Headers tab उघडा. location header मध्ये नवीन feedback चा पत्ता असतो. कोणतं विधान खरं आहे?' },
          apiSandbox: { method: 'POST', path: '/feedback', headers: JSON_CT, body: '{\n  "restaurantId": 4,\n  "rating": 4,\n  "comment": "Misal was perfect"\n}' },
          options: [
            { en: 'It is /v1/restaurants/4, the restaurant you reviewed', mr: 'तो /v1/restaurants/4 आहे, ज्या रेस्टॉरंटचा review दिला ते' },
            { en: 'It is /v1/feedback/ followed by the same id as the "id" field in the body', mr: 'तो /v1/feedback/ आणि त्यापुढे body मधल्या "id" field चाच id आहे' },
            { en: 'It is /v1/feedback/7004, the same as step 1', mr: 'तो /v1/feedback/7004 आहे, स्टेप 1 सारखाच' },
            { en: 'There is no location header', mr: 'location header नाहीच' },
          ],
          correct: [1],
          explain: { en: 'On a fresh run step 1 created 7004, so this one is 7005, and the location says /v1/feedback/7005. The id in the body matches the location. Press Send again and you get 7006. Every POST makes a new record, which is why a tester watches for accidental double submits.', mr: 'नव्याने सुरुवात केली असेल तर स्टेप 1 ने 7004 तयार केला, म्हणून हा 7005, आणि location म्हणतो /v1/feedback/7005. body मधला id आणि location जुळतात. पुन्हा Send दाबलं तर 7006 मिळेल. प्रत्येक POST नवीन नोंद बनवतो, म्हणून टेस्टर चुकून दोनदा submit होणं तपासतो.' },
          hints: [
            { en: 'Look in the Headers tab of the response, not the Body tab.', mr: 'response च्या Headers tab मध्ये पाहा, Body tab मध्ये नाही.' },
            { en: 'Now open the Body tab and compare its "id" with the number at the end of location.', mr: 'आता Body tab उघडा आणि त्यातला "id" location च्या शेवटच्या आकड्याशी जुळवा.' },
          ],
          successLine: { en: 'You read the counterfoil. That is where the new record lives.', mr: 'तुम्ही काउंटरफॉइल वाचला. नवीन नोंद तिथेच राहते.' },
        },
        {
          kind: 'api',
          prompt: { en: 'A happy customer wants to praise Sweet Modak (restaurant 11). Send a POST to /feedback with rating 5 and the comment "Best modak in Pune". The header is ready; write the body yourself.', mr: 'एका खूश ग्राहकाला Sweet Modak (restaurant 11) चं कौतुक करायचं आहे. /feedback ला POST पाठवा: rating 5 आणि comment "Best modak in Pune". header तयार आहे; body तुम्ही लिहा.' },
          starter: { method: 'POST', path: '/feedback', headers: JSON_CT, body: '{\n  \n}' },
          expect: { method: 'POST', path: '/feedback', headers: { 'Content-Type': 'application/json' }, body: { restaurantId: 11, rating: 5, comment: 'Best modak in Pune' }, status: 201 },
          solution: { method: 'POST', path: '/feedback', headers: JSON_CT, body: '{\n  "restaurantId": 11,\n  "rating": 5,\n  "comment": "Best modak in Pune"\n}' },
          hints: [
            { en: 'You need three fields: restaurantId, rating and comment.', mr: 'तीन fields हवीत: restaurantId, rating आणि comment.' },
            { en: 'Numbers have no quotes (11, 5). Text has double quotes ("Best modak in Pune"). Commas between fields, none after the last.', mr: 'आकड्यांना quotes नाहीत (11, 5). मजकुराला double quotes ("Best modak in Pune"). fields मध्ये comma, शेवटच्या नंतर नाही.' },
            { en: '{ "restaurantId": 11, "rating": 5, "comment": "Best modak in Pune" }', mr: '{ "restaurantId": 11, "rating": 5, "comment": "Best modak in Pune" }' },
          ],
          successLine: { en: 'Saved with a new id. You just wrote your first JSON body from scratch.', mr: 'नवीन id सह साठवलं. तुम्ही पहिल्यांदाच स्वतः JSON body लिहिली.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Feedback 7003 said "Too spicy for my kids" with rating 2. The customer calmed down and wants rating 3. Use PUT on /feedback/7003. Press Send on the starter first and read what the server says is missing.', mr: 'Feedback 7003 मध्ये "Too spicy for my kids" आणि rating 2 होतं. ग्राहक शांत झाला आणि त्याला rating 3 हवं आहे. /feedback/7003 वर PUT वापरा. आधी starter Send करा आणि सर्व्हर काय गायब आहे म्हणतो ते वाचा.' },
          starter: { method: 'PUT', path: '/feedback/7003', headers: JSON_CT, body: '{\n  "rating": 3\n}' },
          expect: { method: 'PUT', path: '/feedback/7003', headers: { 'Content-Type': 'application/json' }, body: { restaurantId: 4, rating: 3 }, status: 200 },
          solution: { method: 'PUT', path: '/feedback/7003', headers: JSON_CT, body: '{\n  "restaurantId": 4,\n  "rating": 3,\n  "comment": "Too spicy for my kids"\n}' },
          hints: [
            { en: 'PUT replaces the whole feedback, so it needs every field, even the ones you are not changing.', mr: 'PUT संपूर्ण feedback बदलतो, म्हणून प्रत्येक field हवं, न बदलणारी सुद्धा.' },
            { en: 'The 400 response lists the missing fields: restaurantId and comment. Feedback 7003 is about restaurant 4.', mr: '400 response गायब fields सांगतो: restaurantId आणि comment. Feedback 7003 restaurant 4 बद्दल आहे.' },
            { en: '{ "restaurantId": 4, "rating": 3, "comment": "Too spicy for my kids" }', mr: '{ "restaurantId": 4, "rating": 3, "comment": "Too spicy for my kids" }' },
          ],
          successLine: { en: '200 OK. PUT means "here is the whole slip again", not just one box.', mr: '200 OK. PUT म्हणजे "ही पूर्ण स्लिप पुन्हा", फक्त एक रकाना नाही.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'You send a correct JSON body but the server answers 415. What is most likely missing?', mr: 'तुम्ही योग्य JSON body पाठवली पण सर्व्हर 415 देतो. बहुधा काय गायब आहे?' },
        options: [
          { en: 'The id in the path', mr: 'path मधला id' },
          { en: 'A query parameter', mr: 'एक query parameter' },
          { en: 'The header Content-Type: application/json', mr: 'Content-Type: application/json हा header' },
          { en: 'A faster internet connection', mr: 'वेगवान इंटरनेट' },
        ],
        answer: 2,
        explain: { en: '415 Unsupported Media Type: the server does not know what kind of body you sent.', mr: '415 Unsupported Media Type: तुम्ही कोणत्या प्रकारची body पाठवली ते सर्व्हरला माहीत नाही.' },
      },
      {
        q: { en: 'What is wrong with this body?', mr: 'या body मध्ये काय चूक आहे?' },
        code: '{\n  "restaurantId": 3,\n  "rating": 5,\n}',
        options: [
          { en: 'There is a comma after the last field', mr: 'शेवटच्या field नंतर comma आहे' },
          { en: 'Numbers need quotes', mr: 'आकड्यांना quotes हवेत' },
          { en: 'JSON must start with [', mr: 'JSON [ ने सुरू व्हायला हवं' },
          { en: 'Nothing, it is valid', mr: 'काही नाही, ते बरोबर आहे' },
        ],
        answer: 0,
        explain: { en: 'A comma after the last field breaks JSON, so the server answers 400. (This body also has no comment, which TiffinGo needs.)', mr: 'शेवटच्या field नंतरचा comma JSON मोडतो, म्हणून सर्व्हर 400 देतो. (या body मध्ये comment पण नाही, जी TiffinGo ला हवी.)' },
      },
      {
        q: { en: 'A POST creates a new feedback. Which answer does a good server give?', mr: 'POST ने नवीन feedback तयार होतो. चांगला सर्व्हर कोणतं उत्तर देतो?' },
        options: [
          { en: '200 with an empty body', mr: 'रिकाम्या body सह 200' },
          { en: '204 No Content', mr: '204 No Content' },
          { en: '404 Not Found', mr: '404 Not Found' },
          { en: '201 Created, the saved record with its id, and a location header', mr: '201 Created, id सह साठवलेली नोंद, आणि location header' },
        ],
        answer: 3,
        explain: { en: 'Like the stamped counterfoil: proof it was created and where to find it.', mr: 'शिक्का मारलेल्या काउंटरफॉइलसारखं: तयार झाल्याचा पुरावा आणि ते कुठे सापडेल.' },
      },
      {
        q: { en: 'You want to change only the rating of feedback 7001. Which is the better choice?', mr: 'तुम्हाला feedback 7001 चं फक्त rating बदलायचं आहे. कोणता पर्याय योग्य?' },
        options: [
          { en: 'PUT /feedback/7001 with only { "rating": 3 }', mr: 'फक्त { "rating": 3 } सह PUT /feedback/7001' },
          { en: 'PATCH /feedback/7001 with { "rating": 3 }', mr: '{ "rating": 3 } सह PATCH /feedback/7001' },
          { en: 'GET /feedback/7001?rating=3', mr: 'GET /feedback/7001?rating=3' },
          { en: 'POST /feedback with { "rating": 3 }', mr: '{ "rating": 3 } सह POST /feedback' },
        ],
        answer: 1,
        explain: { en: 'PATCH changes only what you send. PUT needs the whole record. GET never changes anything, and POST would create a new one.', mr: 'PATCH फक्त पाठवलेलं बदलतो. PUT ला संपूर्ण नोंद लागते. GET कधीच काही बदलत नाही, आणि POST नवीन तयार करेल.' },
      },
    ],
    recap: { line: { en: 'Body = the filled boxes (JSON). Content-Type = the slip\'s title. 201 + location = the stamped counterfoil.', mr: 'Body = भरलेले रकाने (JSON). Content-Type = स्लिपचं नाव. 201 + location = शिक्का मारलेला काउंटरफॉइल.' }, icon: '🧾' },
  },

  // ───────────────────────── A1.6 Authentication
  {
    id: 'ap1-6',
    code: 'A1.6',
    level: 'basic',
    title: { en: 'Authentication: Tokens, 401 and 403', mr: 'Authentication: Tokens, 401 आणि 403' },
    skill: 'Tokens, 401 & 403',
    realLife: {
      place: 'hotel',
      title: { en: 'The hotel key card', mr: 'हॉटेलचं key card' },
      story: {
        en: 'The family reaches a hotel in Mahabaleshwar. At reception, the manager checks Aai\'s Aadhaar card once and hands over a key card for room 204. From now on nobody asks for ID again: the card is enough. It opens room 204. Try it on room 305 and the light should stay red, because that is someone else\'s room. Forget the card inside and the door does not open at all.',
        mr: 'कुटुंब महाबळेश्वरच्या हॉटेलमध्ये पोहोचतं. रिसेप्शनवर मॅनेजर एकदाच आईचं आधार कार्ड तपासतात आणि रूम 204 चं key card देतात. आता कोणी परत ओळखपत्र मागत नाही: कार्ड पुरेसं आहे. ते रूम 204 उघडतं. रूम 305 वर लावलं तर लाल दिवाच लागायला हवा, कारण ती दुसऱ्याची रूम आहे. कार्ड आत विसरलं तर दार उघडतच नाही.',
      },
      scene: {
        type: 'exchange',
        client: { icon: '🧳', label: 'Guest with key card', mr: 'key card असलेला पाहुणा' },
        server: { icon: '🚪', label: 'Door of room 204', mr: 'रूम 204 चं दार' },
        request: { icon: '💳', label: 'Tap card (token)', mr: 'कार्ड लावा (token)' },
        response: { icon: '🟢', label: 'Click! Opens (200)', mr: 'क्लिक! उघडलं (200)' },
        note: { en: 'No card: 401. Card for another room: 403.', mr: 'कार्ड नाही: 401. दुसऱ्या रूमचं कार्ड: 403.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'neutral', text: { en: 'Some endpoints are private: your profile, your orders. The server must know who is asking.', mr: 'काही endpoints खाजगी असतात: तुमची प्रोफाइल, तुमच्या ऑर्डर्स. विचारणारा कोण ते सर्व्हरला कळायला हवं.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'So you log in once and get a token, {name}. After that every request shows the token, like tapping a key card.', mr: 'म्हणून एकदा लॉगिन करायचं आणि token मिळवायचा, {name}. त्यानंतर प्रत्येक request token दाखवते, key card लावल्यासारखं.' } },
        { who: 'rex', mood: 'smug', text: { en: 'Checking that the right card opens the door is easy. Real testers check that the wrong card does not.', mr: 'योग्य कार्डने दार उघडतं हे तपासणं सोपं. खरे टेस्टर्स चुकीच्या कार्डने उघडत नाही ना ते तपासतात.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> i left one door in this hotel unlocked. guess which. ⌁', mr: '>> या हॉटेलचं एक दार मी उघडं ठेवलंय. ओळख पाहू, कोणतं ते. ⌁' } },
      ],
      problem: { en: 'If private endpoints answer anyone, a stranger can read your address and orders. If they refuse the owner, the app is useless.', mr: 'खाजगी endpoints कोणालाही उत्तर देत असतील तर अनोळखी माणूस तुमचा पत्ता आणि ऑर्डर्स वाचू शकतो. मालकालाच नाकारत असतील तर ॲप निरुपयोगी आहे.' },
      solution: { en: 'Log in with POST /auth/login to get a token, then send Authorization: Bearer <token> on every private request. Test three doors: no card (401), your card (200), someone else\'s room (403).', mr: 'POST /auth/login ने लॉगिन करून token मिळवा, मग प्रत्येक खाजगी request वर Authorization: Bearer <token> पाठवा. तीन दारं तपासा: कार्ड नाही (401), तुमचं कार्ड (200), दुसऱ्याची रूम (403).' },
    },
    lesson: [
      { en: 'Authentication means "who are you?". You prove it once with a username and password at POST /auth/login. The server gives back a token: a long secret word, your key card.', mr: 'Authentication म्हणजे "तुम्ही कोण?". ते एकदाच POST /auth/login वर username आणि password ने सिद्ध करता. सर्व्हर token परत देतो: एक लांब गुप्त शब्द, तुमचं key card.' },
      { en: 'On every private request you add one header: Authorization: Bearer tg_asha_9f2c. "Bearer" means "whoever carries this card". Keep the space between Bearer and the token.', mr: 'प्रत्येक खाजगी request वर एक header जोडा: Authorization: Bearer tg_asha_9f2c. "Bearer" म्हणजे "हे कार्ड जवळ बाळगणारा". Bearer आणि token मध्ये space ठेवा.' },
      { en: '401 Unauthorized means "I do not know who you are": no token, or a wrong one. 403 Forbidden means "I know who you are, but this is not yours". Authorization is that second check: "are you allowed?"', mr: '401 Unauthorized म्हणजे "तुम्ही कोण ते मला माहीत नाही": token नाही, किंवा चुकीचा. 403 Forbidden म्हणजे "तुम्ही कोण ते माहीत आहे, पण हे तुमचं नाही". Authorization म्हणजे हा दुसरा प्रश्न: "तुम्हाला परवानगी आहे का?"' },
      { en: 'The most dangerous API bug is a missing 403: you change an id in the path and see another customer\'s data. Testers call it IDOR or broken access control. Always try someone else\'s id with your own token.', mr: 'सर्वात धोकादायक API बग म्हणजे 403 न येणं: path मधला id बदलला की दुसऱ्या ग्राहकाचा डेटा दिसतो. टेस्टर्स त्याला IDOR किंवा broken access control म्हणतात. नेहमी स्वतःच्या token ने दुसऱ्याचा id वापरून पाहा.' },
    ],
    syntax: {
      template: 'POST /auth/login\nContent-Type: application/json\n\n{ "username": "asha", "password": "chai123" }\n\nGET /me\nAuthorization: Bearer tg_asha_9f2c',
      parts: [
        { code: 'POST /auth/login', means: { en: 'show your ID at reception, once', mr: 'रिसेप्शनवर एकदाच ओळखपत्र दाखवा' } },
        { code: '"token": "tg_asha_9f2c"', means: { en: 'the key card the server gives back', mr: 'सर्व्हर परत देतो ते key card' } },
        { code: 'Authorization', means: { en: 'the header that carries the card', mr: 'कार्ड घेऊन जाणारा header' } },
        { code: 'Bearer tg_asha_9f2c', means: { en: 'the word Bearer, a space, then the token', mr: 'Bearer हा शब्द, एक space, मग token' } },
        { code: '401 / 403', means: { en: '401: who are you? 403: I know you, but not yours', mr: '401: तुम्ही कोण? 403: ओळखतो, पण तुमचं नाही' } },
      ],
      example: [
        { code: 'POST /auth/login { "username": "asha", ... }', note: { en: 'Aai shows her Aadhaar at reception', mr: 'आई रिसेप्शनवर आधार दाखवते' } },
        { code: '← 200 { "token": "tg_asha_9f2c" }', note: { en: 'she gets the key card for room 204', mr: 'तिला रूम 204 चं key card मिळतं' } },
        { code: 'GET /me + Authorization: Bearer tg_asha_9f2c ← 200', note: { en: 'her card opens her own room', mr: 'तिचं कार्ड तिचीच रूम उघडतं' } },
        { code: 'GET /me (no Authorization) ← 401', note: { en: 'card left inside: the door stays shut', mr: 'कार्ड आत राहिलं: दार बंदच' } },
        { code: 'GET /orders/4002 (Rohan\'s) ← should be 403', note: { en: 'her card on room 305: the light must stay red', mr: 'तिचं कार्ड रूम 305 वर: लाल दिवाच हवा' } },
      ],
      pitfall: { en: 'Do not mix up 401 and 403. 401 is about the card (missing or fake). 403 is about the room (not yours). Also, a token is a key: blur it in screenshots and never paste a real one into a bug report.', mr: '401 आणि 403 मध्ये गोंधळ करू नका. 401 कार्डबद्दल आहे (नाही किंवा खोटं). 403 रूमबद्दल आहे (तुमची नाही). आणि token म्हणजे चावी: screenshots मध्ये तो धूसर करा आणि खरा token कधीच बग रिपोर्टमध्ये टाकू नका.' },
    },
    practice: {
      intro: { en: 'Check in as Asha (username asha, password chai123). Then test every door, including the ones that should stay shut.', mr: 'Asha म्हणून चेक-इन करा (username asha, password chai123). मग प्रत्येक दार तपासा, बंद राहायला हवीत ती सुद्धा.' },
      steps: [
        {
          kind: 'api',
          prompt: { en: 'First, try the door without a card. Send GET /me with no Authorization header. A safe server must refuse with 401.', mr: 'आधी कार्डशिवाय दार उघडून पाहा. Authorization header शिवाय GET /me पाठवा. सुरक्षित सर्व्हरने 401 देऊन नाकारायलाच हवं.' },
          starter: { method: 'GET', path: '/me' },
          expect: { method: 'GET', path: '/me', noHeaders: ['Authorization'], status: 401 },
          solution: { method: 'GET', path: '/me' },
          hints: [
            { en: 'The starter is already right. Just press Submit this request and read the answer.', mr: 'starter आधीच बरोबर आहे. फक्त Submit this request दाबा आणि उत्तर वाचा.' },
            { en: 'If the Headers tab has an Authorization row, remove it with the ✕. No card at all.', mr: 'Headers tab मध्ये Authorization ची row असेल तर ✕ ने काढून टाका. कार्ड अजिबात नाही.' },
          ],
          successLine: { en: '401 Unauthorized. The door stays shut. That is a passing test.', mr: '401 Unauthorized. दार बंदच. ही टेस्ट पास झाली.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Now check in at reception. Log in as asha with password chai123 and get your token.', mr: 'आता रिसेप्शनवर चेक-इन करा. asha आणि password chai123 ने लॉगिन करा आणि तुमचा token मिळवा.' },
          starter: { method: 'POST', path: '/auth/login', headers: JSON_CT, body: '{\n  "username": "",\n  "password": ""\n}' },
          expect: { method: 'POST', path: '/auth/login', body: { username: 'asha', password: 'chai123' }, status: 200 },
          solution: { method: 'POST', path: '/auth/login', headers: JSON_CT, body: '{\n  "username": "asha",\n  "password": "chai123"\n}' },
          hints: [
            { en: 'Fill both empty values inside the quotes.', mr: 'quotes मधल्या दोन्ही रिकाम्या values भरा.' },
            { en: 'The password is case-sensitive: chai123, all small letters.', mr: 'password मध्ये लहान-मोठी अक्षरं महत्त्वाची: chai123, सगळी लहान.' },
            { en: '{ "username": "asha", "password": "chai123" }', mr: '{ "username": "asha", "password": "chai123" }' },
          ],
          successLine: { en: 'Key card received: "token": "tg_asha_9f2c". Copy it, you need it next.', mr: 'key card मिळालं: "token": "tg_asha_9f2c". कॉपी करा, पुढे लागेल.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Tap your card on your own door. Send GET /me with the header Authorization: Bearer tg_asha_9f2c.', mr: 'तुमचं कार्ड तुमच्याच दारावर लावा. Authorization: Bearer tg_asha_9f2c हा header घेऊन GET /me पाठवा.' },
          starter: { method: 'GET', path: '/me' },
          expect: { method: 'GET', path: '/me', headers: { Authorization: 'Bearer tg_asha_9f2c' }, status: 200 },
          solution: { method: 'GET', path: '/me', headers: ASHA },
          hints: [
            { en: 'Open the Headers tab and click + Authorization. It fills in the name and the word Bearer for you.', mr: 'Headers tab उघडा आणि + Authorization वर क्लिक करा. नाव आणि Bearer हा शब्द आपोआप भरला जातो.' },
            { en: 'The value is the word Bearer, one space, then the token from the last step.', mr: 'value म्हणजे Bearer हा शब्द, एक space, मग मागच्या स्टेपमधला token.' },
            { en: 'Authorization: Bearer tg_asha_9f2c', mr: 'Authorization: Bearer tg_asha_9f2c' },
          ],
          successLine: { en: '200 OK. Asha Patil, Kothrud, Pune. Your card opens your room.', mr: '200 OK. Asha Patil, Kothrud, Pune. तुमचं कार्ड तुमची रूम उघडतं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Order 4002 belongs to Rohan (userId 2). This request uses Asha\'s token. Press Send. What did the server do, and is it right?', mr: 'ऑर्डर 4002 Rohan ची आहे (userId 2). ही request Asha चा token वापरते. Send दाबा. सर्व्हरने काय केलं, आणि ते बरोबर आहे का?' },
          apiSandbox: { method: 'GET', path: '/orders/4002', headers: ASHA },
          options: [
            { en: '401, because Asha\'s token is wrong. That is correct.', mr: '401, कारण Asha चा token चुकीचा आहे. हे बरोबर आहे.' },
            { en: '200 with Rohan\'s order. That is fine, Asha is logged in.', mr: 'Rohan च्या ऑर्डरसह 200. ठीक आहे, Asha लॉगिन आहे.' },
            { en: '200 with Rohan\'s order. That is a serious security bug: it should answer 403 Forbidden.', mr: 'Rohan च्या ऑर्डरसह 200. हा गंभीर security बग आहे: 403 Forbidden यायला हवं.' },
            { en: '404, because order 4002 does not exist.', mr: '404, कारण ऑर्डर 4002 अस्तित्वातच नाही.' },
          ],
          correct: [2],
          explain: { en: 'Asha can read Rohan\'s order: his items and his total of 300. Just changing the number in the path opens another customer\'s room. This is IDOR (broken access control). Report it as critical: "GET /orders/4002 with Asha\'s token returns 200 and Rohan\'s order. Expected: 403."', mr: 'Asha ला Rohan ची ऑर्डर वाचता येते: त्याच्या वस्तू आणि त्याचं 300 चं बिल. path मधला फक्त आकडा बदलला की दुसऱ्या ग्राहकाची रूम उघडते. याला IDOR (broken access control) म्हणतात. critical म्हणून रिपोर्ट करा: "Asha च्या token ने GET /orders/4002 वर 200 आणि Rohan ची ऑर्डर मिळते. अपेक्षित: 403."' },
          hints: [
            { en: 'Look at the status code first, then at "userId" in the body.', mr: 'आधी status code पाहा, मग body मधला "userId".' },
            { en: 'Asha is user 1. The order says "userId": 2. Should she see it?', mr: 'Asha user 1 आहे. ऑर्डरमध्ये "userId": 2 आहे. तिला ती दिसायला हवी का?' },
            { en: 'Someone else\'s room with your card should be 403.', mr: 'तुमच्या कार्डने दुसऱ्याची रूम म्हणजे 403 हवं.' },
          ],
          successLine: { en: 'Bug 4 caught: an open door in the hotel. The Gremlin stops grinning.', mr: 'बग 4 पकडला: हॉटेलमधलं उघडं दार. ग्रेमलिनचं हसू थांबलं.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Compare with another door. Try to cancel Rohan\'s order 4002 with PATCH, using Asha\'s card. A safe server answers 403. Add the missing header.', mr: 'दुसऱ्या दाराशी तुलना करा. Asha चं कार्ड वापरून PATCH ने Rohan ची ऑर्डर 4002 रद्द करून पाहा. सुरक्षित सर्व्हर 403 देतो. गायब header जोडा.' },
          starter: { method: 'PATCH', path: '/orders/4002', headers: JSON_CT, body: '{\n  "status": "CANCELLED"\n}' },
          expect: { method: 'PATCH', path: '/orders/4002', headers: { Authorization: 'Bearer tg_asha_9f2c' }, status: 403 },
          solution: { method: 'PATCH', path: '/orders/4002', headers: { ...JSON_CT, ...ASHA }, body: '{\n  "status": "CANCELLED"\n}' },
          hints: [
            { en: 'Without a card you get 401. Which header carries the card?', mr: 'कार्डशिवाय 401 मिळतो. कोणता header कार्ड घेऊन जातो?' },
            { en: 'Keep Content-Type and add a second row: Authorization: Bearer tg_asha_9f2c', mr: 'Content-Type ठेवा आणि दुसरी row जोडा: Authorization: Bearer tg_asha_9f2c' },
          ],
          successLine: { en: '403 here, 200 on GET. The server knows the rule but forgets it on one door. Put both results in your bug report.', mr: 'इथे 403, GET वर 200. सर्व्हरला नियम माहीत आहे पण एका दारावर विसरतो. दोन्ही निकाल तुमच्या बग रिपोर्टमध्ये टाका.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'You call GET /orders with no Authorization header. What should a safe server answer?', mr: 'Authorization header शिवाय GET /orders पाठवलं. सुरक्षित सर्व्हरने काय द्यावं?' },
        options: ['200', '401', '403', '404'],
        answer: 1,
        explain: { en: 'No card at all: "I do not know who you are" is 401.', mr: 'कार्डच नाही: "तुम्ही कोण ते माहीत नाही" म्हणजे 401.' },
      },
      {
        q: { en: 'Which header is written correctly?', mr: 'कोणता header बरोबर लिहिला आहे?' },
        options: ['Authorization: tg_asha_9f2c', 'Token: Bearer tg_asha_9f2c', 'Authorization: Bearertg_asha_9f2c', 'Authorization: Bearer tg_asha_9f2c'],
        answer: 3,
        explain: { en: 'Header name Authorization, value Bearer, one space, then the token.', mr: 'header चं नाव Authorization, value म्हणजे Bearer, एक space, मग token.' },
      },
      {
        q: { en: 'Logged in as Rohan, you open GET /orders/4003 (Asha\'s order) and see her items. What is this?', mr: 'Rohan म्हणून लॉगिन करून GET /orders/4003 (Asha ची ऑर्डर) उघडली आणि तिच्या वस्तू दिसल्या. हे काय आहे?' },
        options: [
          { en: 'Broken access control (IDOR): it should be 403', mr: 'Broken access control (IDOR): 403 यायला हवं' },
          { en: 'Correct, Rohan has a valid token', mr: 'बरोबर, Rohan कडे वैध token आहे' },
          { en: 'A slow response', mr: 'हळू response' },
          { en: 'A 415 problem', mr: '415 ची समस्या' },
        ],
        answer: 0,
        explain: { en: 'A valid token only proves who you are. The server must still check that the order is yours.', mr: 'वैध token फक्त तुम्ही कोण ते सिद्ध करतो. ऑर्डर तुमची आहे का हे सर्व्हरने तपासायलाच हवं.' },
      },
      {
        q: { en: 'What is the difference between 401 and 403?', mr: '401 आणि 403 मध्ये फरक काय?' },
        options: [
          { en: 'They mean the same thing', mr: 'दोन्हींचा अर्थ एकच' },
          { en: '401 is a server crash, 403 is a slow server', mr: '401 म्हणजे सर्व्हर बंद पडणं, 403 म्हणजे हळू सर्व्हर' },
          { en: '401: I do not know who you are. 403: I know you, but you are not allowed', mr: '401: तुम्ही कोण ते माहीत नाही. 403: ओळखतो, पण परवानगी नाही' },
          { en: '401 is for GET, 403 is for POST', mr: '401 GET साठी, 403 POST साठी' },
        ],
        answer: 2,
        explain: { en: 'No card or a fake card is 401. Your card on someone else\'s room is 403.', mr: 'कार्ड नाही किंवा खोटं कार्ड म्हणजे 401. तुमचं कार्ड दुसऱ्याच्या रूमवर म्हणजे 403.' },
      },
    ],
    recap: { line: { en: 'Log in once, carry the token as Authorization: Bearer. No card is 401, wrong room is 403. Always try someone else\'s id.', mr: 'एकदा लॉगिन करा, token Authorization: Bearer म्हणून न्या. कार्ड नाही म्हणजे 401, चुकीची रूम म्हणजे 403. नेहमी दुसऱ्याचा id वापरून पाहा.' }, icon: '🔑' },
  },

  // ───────────────────────── A1.7 Boss: The Silent Kitchen
  {
    id: 'ap1-7',
    code: 'A1.7',
    level: 'basic',
    isBoss: true,
    title: { en: 'Boss: The Silent Kitchen', mr: 'बॉस: शांत स्वयंपाकघर' },
    skill: 'End-to-end API investigation',
    realLife: {
      place: 'kitchen',
      title: { en: 'The dabba that came with a refund', mr: 'परताव्यासोबत आलेला डबा' },
      story: {
        en: 'A dabbawala delivers a lunch box worth 40 rupees. Stuck to it is a bill: "Discount 500. You get 430 back." The customer laughs and takes the money. Nobody in the kitchen notices, because the kitchen never checks the bill. It just cooks. Do that a thousand times and the business is gone.',
        mr: 'डबेवाला 40 रुपयांचा डबा पोहोचवतो. त्यावर एक बिल चिकटवलेलं: "सूट 500. तुम्हाला 430 परत." ग्राहक हसतो आणि पैसे घेतो. स्वयंपाकघरात कोणालाच कळत नाही, कारण तिथे कोणी बिल तपासत नाही. फक्त स्वयंपाक होतो. असं हजार वेळा झालं तर धंदाच बुडेल.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🔑', label: 'Log in', mr: 'लॉगिन' },
          { icon: '🥗', label: 'Pick a restaurant', mr: 'रेस्टॉरंट निवडा' },
          { icon: '🛒', label: 'Place the order', mr: 'ऑर्डर द्या' },
          { icon: '🎟️', label: 'Apply coupon', mr: 'कूपन लावा' },
          { icon: '🧾', label: 'Final bill', mr: 'अंतिम बिल' },
        ],
        breakAt: 3,
        breakNote: { en: 'FLAT500 on a 40 rupee order: the bill says -430.', mr: '40 रुपयांच्या ऑर्डरवर FLAT500: बिल म्हणतं -430.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Finance is panicking. Some orders have strange totals, and a few are below zero. Below zero!', mr: 'फायनान्स घाबरलंय. काही ऑर्डर्सचे totals विचित्र आहेत, आणि काही तर शून्याखाली. शून्याखाली!' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> the kitchen cooks whatever the api says. and the api says whatever i want. find me if you can. ⌁', mr: '>> api जे सांगतं ते स्वयंपाकघर शिजवतं. आणि api मला हवं ते सांगतं. शोधून दाखव. ⌁' } },
        { who: 'meera', mood: 'worried', text: { en: 'Boss rules, {name}: only 2 hints per step. Use everything: paths, filters, body, headers, tokens.', mr: 'बॉसचे नियम, {name}: प्रत्येक स्टेपला फक्त 2 हिंट्स. सगळं वापर: paths, filters, body, headers, tokens.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'Walk the same path a customer does. Log in, find food, order, apply a coupon. Watch every number.', mr: 'ग्राहक ज्या मार्गाने जातो त्याच मार्गाने जा. लॉगिन, जेवण शोधा, ऑर्डर, कूपन. प्रत्येक आकडा पाहा.' } },
      ],
      problem: { en: 'Customers see odd totals but nobody knows which request causes them. Without steps to reproduce, the developers cannot fix it.', mr: 'ग्राहकांना विचित्र totals दिसतात पण कोणती request त्यांना कारणीभूत आहे ते कोणालाच माहीत नाही. reproduce करायच्या steps शिवाय developers उपाय करू शकत नाहीत.' },
      solution: { en: 'Replay a real customer journey through the API, one request at a time. Check every status and every number. When one is wrong, you have the exact request to put in the bug report.', mr: 'खऱ्या ग्राहकाचा प्रवास API मधून पुन्हा करा, एका वेळी एक request. प्रत्येक status आणि प्रत्येक आकडा तपासा. एखादा चुकीचा असेल तर बग रिपोर्टसाठी नेमकी request तुमच्या हातात.' },
    },
    lesson: [
      { en: 'An end-to-end check walks a whole user journey through the API: log in, search, create, change. Each step uses what the previous one gave you, like the token.', mr: 'end-to-end तपासणी API मधून वापरकर्त्याचा संपूर्ण प्रवास करते: लॉगिन, शोध, तयार करणं, बदलणं. प्रत्येक स्टेप आधीच्या स्टेपने दिलेलं वापरते, जसे token.' },
      { en: 'For money, do the maths yourself. TiffinGo\'s rule: total = subtotal - discount + deliveryFee (30). A total below zero is always a bug.', mr: 'पैशांच्या बाबतीत हिशोब स्वतः करा. TiffinGo चा नियम: total = subtotal - discount + deliveryFee (30). शून्याखालचा total नेहमीच बग असतो.' },
      { en: 'A good bug report has: the exact request (method, path, headers without the real token, body), what came back, what you expected, and why it matters.', mr: 'चांगल्या बग रिपोर्टमध्ये असतं: नेमकी request (method, path, खऱ्या token शिवाय headers, body), काय परत आलं, काय अपेक्षित होतं, आणि ते महत्त्वाचं का.' },
    ],
    syntax: {
      template: 'POST /orders\nAuthorization: Bearer tg_asha_9f2c\nContent-Type: application/json\n\n{\n  "restaurantId": 6,\n  "items": [ { "menuItemId": 601, "qty": 2 } ],\n  "couponCode": "WELCOME50"\n}',
      parts: [
        { code: 'Authorization: Bearer ...', means: { en: 'orders are private: show your key card', mr: 'ऑर्डर्स खाजगी: key card दाखवा' } },
        { code: 'Content-Type: application/json', means: { en: 'the slip\'s title: the body is JSON', mr: 'स्लिपचं नाव: body JSON आहे' } },
        { code: '"items": [ ... ]', means: { en: 'a list of dishes: which menu item, how many', mr: 'पदार्थांची यादी: कोणता menu item, किती' } },
        { code: '"couponCode"', means: { en: 'optional: WELCOME50 or FLAT500', mr: 'ऐच्छिक: WELCOME50 किंवा FLAT500' } },
      ],
      example: [
        { code: 'POST /auth/login', note: { en: 'get the key card', mr: 'key card मिळवा' } },
        { code: 'GET /restaurants?city=Nashik&veg=true', note: { en: 'find veg food in Nashik', mr: 'नाशिकमध्ये veg जेवण शोधा' } },
        { code: 'POST /orders { "restaurantId": 6, ... }', note: { en: 'order with card, label and body', mr: 'कार्ड, लेबल आणि body सह ऑर्डर' } },
        { code: '← 201 { "subtotal": 320, "deliveryFee": 30, "total": 350 }', note: { en: 'check the maths: 320 - 0 + 30 = 350', mr: 'हिशोब तपासा: 320 - 0 + 30 = 350' } },
        { code: 'PATCH /orders/4001 { "status": "CANCELLED" }', note: { en: 'try a change that should be refused', mr: 'नाकारायला हवा असा बदल करून पाहा' } },
      ],
      pitfall: { en: 'A 201 only means "saved". It does not mean "correct". Read the numbers in the body every time.', mr: '201 म्हणजे फक्त "साठवलं". "बरोबर" असा अर्थ नाही. body मधले आकडे प्रत्येक वेळी वाचा.' },
    },
    practice: {
      intro: { en: 'Defeat the Gremlin. Walk the customer journey; each step drains its health.', mr: 'ग्रेमलिनला हरवा. ग्राहकाचा प्रवास करा; प्रत्येक स्टेप त्याची ताकद कमी करते.' },
      steps: [
        {
          kind: 'api',
          prompt: { en: 'Step 1: Log in as Asha (asha / chai123) and get her token.', mr: 'स्टेप 1: Asha म्हणून लॉगिन करा (asha / chai123) आणि तिचा token मिळवा.' },
          starter: { method: 'POST', path: '/auth/login', headers: JSON_CT },
          expect: { method: 'POST', path: '/auth/login', body: { username: 'asha', password: 'chai123' }, status: 200 },
          solution: { method: 'POST', path: '/auth/login', headers: JSON_CT, body: '{\n  "username": "asha",\n  "password": "chai123"\n}' },
          hints: [
            { en: 'The body needs two fields: username and password.', mr: 'body मध्ये दोन fields हवीत: username आणि password.' },
            { en: '{ "username": "asha", "password": "chai123" }', mr: '{ "username": "asha", "password": "chai123" }' },
          ],
          successLine: { en: 'Token in hand. The Gremlin flickers.', mr: 'token हातात. ग्रेमलिन थरथरतो.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Step 2: Asha is visiting Nashik and wants veg food. List veg restaurants in Nashik.', mr: 'स्टेप 2: Asha नाशिकला गेली आहे आणि तिला veg जेवण हवं. नाशिकमधली veg रेस्टॉरंट्स दाखवा.' },
          starter: { method: 'GET', path: '/restaurants' },
          expect: { method: 'GET', path: '/restaurants', query: { city: 'Nashik', veg: 'true' }, status: 200 },
          solution: { method: 'GET', path: '/restaurants?city=Nashik&veg=true' },
          hints: [
            { en: 'Two query parameters: city and veg, joined with &.', mr: 'दोन query parameters: city आणि veg, & ने जोडलेले.' },
            { en: '/restaurants?city=Nashik&veg=true', mr: '/restaurants?city=Nashik&veg=true' },
          ],
          successLine: { en: 'Green Bowl (id 6) and Chai Tapri. Did you spot that Chai Tapri has no "city" field? Keep that for later.', mr: 'Green Bowl (id 6) आणि Chai Tapri. Chai Tapri मध्ये "city" field नाही हे दिसलं का? ते नंतरसाठी लक्षात ठेवा.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Step 3: Order 2 Sprout Salads (menu item 601) from Green Bowl (restaurant 6). Orders are private and the body is JSON, so you need two headers.', mr: 'स्टेप 3: Green Bowl (restaurant 6) मधून 2 Sprout Salads (menu item 601) मागवा. ऑर्डर्स खाजगी आहेत आणि body JSON आहे, म्हणून दोन headers लागतील.' },
          starter: { method: 'POST', path: '/orders', headers: JSON_CT },
          expect: {
            method: 'POST',
            path: '/orders',
            headers: { Authorization: 'Bearer tg_asha_9f2c', 'Content-Type': 'application/json' },
            body: { restaurantId: 6, items: [{ menuItemId: 601, qty: 2 }] },
            status: 201,
          },
          solution: { method: 'POST', path: '/orders', headers: { ...JSON_CT, ...ASHA }, body: '{\n  "restaurantId": 6,\n  "items": [\n    { "menuItemId": 601, "qty": 2 }\n  ]\n}' },
          hints: [
            { en: 'Add Authorization: Bearer tg_asha_9f2c next to Content-Type. The body has restaurantId and an items list.', mr: 'Content-Type शेजारी Authorization: Bearer tg_asha_9f2c जोडा. body मध्ये restaurantId आणि items ची यादी.' },
            { en: '{ "restaurantId": 6, "items": [ { "menuItemId": 601, "qty": 2 } ] }', mr: '{ "restaurantId": 6, "items": [ { "menuItemId": 601, "qty": 2 } ] }' },
          ],
          successLine: { en: '201 Created, order 5001. Subtotal 320 + delivery 30 = total 350. The maths is right.', mr: '201 Created, ऑर्डर 5001. subtotal 320 + delivery 30 = total 350. हिशोब बरोबर.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Step 4: TiffinGo\'s coupon rules say FLAT500 gives 500 off on orders of 1000 or more. Here someone uses it on 2 cutting chais from Chai Tapri. Press Send and read the numbers. Pick every true statement.', mr: 'स्टेप 4: TiffinGo च्या coupon नियमांनुसार FLAT500 ने 1000 किंवा जास्तच्या ऑर्डरवर 500 सूट मिळते. इथे कोणीतरी ते Chai Tapri च्या 2 कटिंग चहांवर वापरतंय. Send दाबा आणि आकडे वाचा. सगळी खरी विधानं निवडा.' },
          apiSandbox: { method: 'POST', path: '/orders', headers: { ...JSON_CT, ...ASHA }, body: '{\n  "restaurantId": 9,\n  "items": [\n    { "menuItemId": 901, "qty": 2 }\n  ],\n  "couponCode": "FLAT500"\n}' },
          options: [
            { en: 'The total is -430. A total can never be below zero.', mr: 'total -430 आहे. total कधीच शून्याखाली असू शकत नाही.' },
            { en: 'The delivery fee of 30 is the bug.', mr: '30 ची delivery fee हाच बग आहे.' },
            { en: 'The server should refuse with a 400 error that says FLAT500 needs an order of at least 1000.', mr: 'सर्व्हरने 400 एरर देऊन नाकारायला हवं, FLAT500 ला किमान 1000 ची ऑर्डर लागते असं सांगत.' },
            { en: 'Nothing is wrong. The server answered 201.', mr: 'काहीच चूक नाही. सर्व्हरने 201 दिलं.' },
          ],
          correct: [0, 2],
          explain: { en: 'Subtotal 40 - discount 500 + delivery 30 = -430. TiffinGo would owe the customer money for drinking chai. The server never checks the 1000 minimum. Bug report: "POST /orders with couponCode FLAT500 on a 40 rupee order returns 201 with total -430. Expected: 400, FLAT500 needs a minimum order of 1000."', mr: 'subtotal 40 - discount 500 + delivery 30 = -430. चहा प्यायल्याबद्दल TiffinGo च ग्राहकाला पैसे देणं लागेल. सर्व्हर 1000 ची किमान मर्यादा तपासतच नाही. बग रिपोर्ट: "40 रुपयांच्या ऑर्डरवर couponCode FLAT500 सह POST /orders केल्यावर 201 आणि total -430 मिळतो. अपेक्षित: 400, FLAT500 ला किमान 1000 ची ऑर्डर लागते."' },
          hints: [
            { en: 'Find subtotal, discount, deliveryFee and total in the body. Do the maths.', mr: 'body मध्ये subtotal, discount, deliveryFee आणि total शोधा. हिशोब करा.' },
            { en: 'Two answers are true: one about the number, one about what the server should do.', mr: 'दोन उत्तरं खरी आहेत: एक आकड्याबद्दल, एक सर्व्हरने काय करावं याबद्दल.' },
          ],
          successLine: { en: 'Bug 3 caught: the negative bill. The Gremlin is down to its last bar.', mr: 'बग 3 पकडला: उणं बिल. ग्रेमलिनची शेवटची ताकद उरली.' },
        },
        {
          kind: 'api',
          prompt: { en: 'Step 5: The Gremlin\'s last trick: "cancel" food that was already eaten. Try to cancel order 4001, which was DELIVERED, as Asha. A healthy server refuses with 409 Conflict.', mr: 'स्टेप 5: ग्रेमलिनची शेवटची युक्ती: आधीच खाल्लेलं जेवण "रद्द" करणं. Asha म्हणून ऑर्डर 4001 रद्द करून पाहा, जी DELIVERED झाली आहे. निरोगी सर्व्हर 409 Conflict देऊन नाकारतो.' },
          starter: { method: 'POST', path: '/orders/4001', headers: JSON_CT, body: '{\n  "status": "CANCELLED"\n}' },
          expect: { method: 'PATCH', path: '/orders/4001', headers: { Authorization: 'Bearer tg_asha_9f2c' }, body: { status: 'CANCELLED' }, status: 409 },
          solution: { method: 'PATCH', path: '/orders/4001', headers: { ...JSON_CT, ...ASHA }, body: '{\n  "status": "CANCELLED"\n}' },
          hints: [
            { en: 'Orders are private, so add your card first. Then read the 405 answer: its message lists the methods this path allows.', mr: 'ऑर्डर्स खाजगी आहेत, म्हणून आधी कार्ड जोडा. मग 405 उत्तर वाचा: त्याचा message या path ला चालणाऱ्या methods सांगतो.' },
            { en: 'Method PATCH, and add Authorization: Bearer tg_asha_9f2c', mr: 'Method PATCH, आणि Authorization: Bearer tg_asha_9f2c जोडा' },
          ],
          successLine: { en: '409: "Order 4001 is DELIVERED and cannot be cancelled". This door holds. The Gremlin collapses.', mr: '409: "Order 4001 is DELIVERED and cannot be cancelled". हे दार टिकलं. ग्रेमलिन कोसळला.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'An order has subtotal 260, discount 100 and deliveryFee 30. What should the total be?', mr: 'एका ऑर्डरचा subtotal 260, discount 100 आणि deliveryFee 30 आहे. total किती असायला हवा?' },
        options: ['160', '190', '390', '230'],
        answer: 1,
        explain: { en: '260 - 100 + 30 = 190. Always do the maths on money fields.', mr: '260 - 100 + 30 = 190. पैशांच्या fields चा हिशोब नेहमी करा.' },
      },
      {
        q: { en: 'Which request places an order correctly?', mr: 'कोणती request ऑर्डर बरोबर देते?' },
        options: [
          { en: 'GET /orders with a body and both headers', mr: 'body आणि दोन्ही headers सह GET /orders' },
          { en: 'POST /orders with a body and Content-Type, but no Authorization', mr: 'body आणि Content-Type सह POST /orders, पण Authorization नाही' },
          { en: 'POST /orders with Authorization, Content-Type and a JSON body', mr: 'Authorization, Content-Type आणि JSON body सह POST /orders' },
          { en: 'POST /orders?restaurantId=6 with no headers', mr: 'headers शिवाय POST /orders?restaurantId=6' },
        ],
        answer: 2,
        explain: { en: 'Create with POST, prove who you are with the token, label the body, send the body.', mr: 'POST ने तयार करा, token ने ओळख द्या, body ला लेबल लावा, body पाठवा.' },
      },
      {
        q: { en: 'You try to cancel an order that was already delivered. Which answer is right?', mr: 'आधीच डिलिव्हर झालेली ऑर्डर रद्द करायचा प्रयत्न केला. कोणतं उत्तर बरोबर?' },
        options: ['409 Conflict', '200 OK', '201 Created', '415 Unsupported Media Type'],
        answer: 0,
        explain: { en: '409 means the request clashes with the current state of the thing. A delivered order cannot be cancelled.', mr: '409 म्हणजे request त्या गोष्टीच्या सध्याच्या स्थितीशी जुळत नाही. डिलिव्हर झालेली ऑर्डर रद्द होऊ शकत नाही.' },
      },
      {
        q: { en: 'What belongs in a good API bug report?', mr: 'चांगल्या API बग रिपोर्टमध्ये काय असायला हवं?' },
        options: [
          { en: 'Only "the API is broken"', mr: 'फक्त "API बिघडलाय"' },
          { en: 'Your real token, so the developer can log in as you', mr: 'तुमचा खरा token, म्हणजे developer तुमच्या नावाने लॉगिन करू शकेल' },
          { en: 'A screenshot of the home page', mr: 'होम पेजचा screenshot' },
          { en: 'The exact request, the response, what you expected and why it matters', mr: 'नेमकी request, response, अपेक्षित काय होतं आणि ते महत्त्वाचं का' },
        ],
        answer: 3,
        explain: { en: 'With the exact request, anyone can reproduce it in seconds. Never share a real token.', mr: 'नेमक्या request ने कोणीही काही सेकंदांत reproduce करू शकतो. खरा token कधीच शेअर करू नका.' },
      },
    ],
    recap: { line: { en: 'Walk the whole journey, check every status and every number. 201 only means saved, so check that it is correct too.', mr: 'संपूर्ण प्रवास करा, प्रत्येक status आणि प्रत्येक आकडा तपासा. 201 म्हणजे फक्त साठवलं, म्हणून ते बरोबर आहे का तेही तपासा.' }, icon: '🍱' },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: '>> glitch. fine. keep your little kitchen. ⌁⌁', mr: '>> glitch. ठीक आहे. ठेव तुझं छोटंसं स्वयंपाकघर. ⌁⌁' } },
      { who: 'gremlin', mood: 'smug', text: { en: '>> but food is cheap. money is where i really live. see you at the payment counter. charge once, charge twice... ⌁', mr: '>> पण जेवण स्वस्त असतं. मी खरा राहतो पैशांत. payment counter वर भेटू. एकदा पैसे, दोनदा पैसे... ⌁' } },
      { who: 'sam', mood: 'happy', text: { en: 'Finance has the exact requests and the developers are already fixing them. Thank you, {name}!', mr: 'फायनान्सकडे नेमक्या requests आहेत आणि developers आधीच दुरुस्ती करतायत. धन्यवाद, {name}!' } },
      { who: 'meera', mood: 'happy', text: { en: 'Case closed, {name}. Rank up: API Explorer. Next stop, TiffinGo Pay, where every bug costs real money.', mr: 'केस बंद, {name}. नवीन रँक: API Explorer. पुढचा थांबा TiffinGo Pay, जिथे प्रत्येक बग खऱ्या पैशांचा असतो.' } },
    ],
  },
]
