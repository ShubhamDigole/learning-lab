import type { Lesson, SceneItem } from './types.ts'

// {name} inserts the player's name. Marathi keeps SQL words (SELECT, JOIN...) in English, the way testers speak at work.

const guests: SceneItem[] = [
  { icon: '👵', label: 'Grandma Lata', mr: 'लता आजी' },
  { icon: '🧔', label: 'Uncle Raj', mr: 'राज काका' },
  { icon: '👩‍🎤', label: 'Cousin Mira', mr: 'मीरा ताई' },
  { icon: '🧑‍🍳', label: 'Chef Arun', mr: 'शेफ अरुण' },
  { icon: '👨‍🏫', label: 'Mr. Dsouza', mr: 'डिसूझा सर' },
]
const rsvps: SceneItem[] = [
  { icon: '💌', label: 'RSVP: Mira', mr: 'उत्तर: मीरा' },
  { icon: '💌', label: 'RSVP: Lata', mr: 'उत्तर: लता' },
  { icon: '💌', label: 'RSVP: Arun', mr: 'उत्तर: अरुण' },
]
const guestLinks: [number, number][] = [
  [0, 1],
  [2, 0],
  [3, 2],
]

export const prologueLessons: Lesson[] = [
  {
    id: 'p1',
    code: 'P.1',
    level: 'basic',
    title: { en: 'First Day: The Edge of the Ride', mr: 'पहिला दिवस: राईडची सीमा' },
    skill: 'Boundary values',
    syntaxPlain: true,
    realLife: {
      place: 'themepark',
      title: { en: 'The height ruler at a theme park ride', mr: 'थीम पार्कमधील उंची मोजण्याची पट्टी' },
      story: {
        en: 'A roller coaster allows riders from 120 to 190 cm. The attendant does not need to measure 70 kids to know the rule works. The interesting kids are the ones standing right at the line: 119, 120, 190 and 191 cm.',
        mr: 'एका रोलर कोस्टरवर 120 ते 190 सेमी उंचीचे लोकच बसू शकतात. नियम बरोबर चालतो का हे पाहायला 70 मुलं मोजायची गरज नाही. खरी महत्त्वाची मुलं म्हणजे अगदी रेषेवर उभी असलेली: 119, 120, 190 आणि 191 सेमी.',
      },
      scene: {
        type: 'ruler',
        unit: 'cm',
        min: 100,
        max: 210,
        lo: 120,
        hi: 190,
        marks: [
          { value: 119, note: 'just too short', mr: 'थोडा कमी' },
          { value: 120, note: 'just tall enough', mr: 'अगदी पुरेसा' },
          { value: 190, note: 'just short enough', mr: 'अगदी मर्यादेत' },
          { value: 191, note: 'just too tall', mr: 'थोडा जास्त' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'meera', mood: 'happy', text: { en: 'Welcome to Kestrel, {name}! First case: FunFrontier opens a new coaster tomorrow.', mr: 'केस्ट्रेलमध्ये स्वागत, {name}! पहिली केस: FunFrontier उद्या नवीन कोस्टर सुरू करतंय.' } },
        { who: 'sam', mood: 'neutral', text: { en: 'The gate scanner checks height: 120 to 190 cm. We have one day to test it.', mr: 'गेटवरचा स्कॅनर उंची तपासतो: 120 ते 190 सेमी. टेस्टिंगसाठी फक्त एक दिवस आहे.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> the scanner has a tiny secret. bet you cannot find it. ⌁', mr: '>> स्कॅनरमध्ये एक छोटंसं गुपित आहे. शोधून दाखव. ⌁' } },
      ],
      problem: { en: 'Random testing (130, 150, 170 cm) passes every time, so the team thinks the scanner is fine.', mr: 'मनाने निवडलेल्या उंची (130, 150, 170 सेमी) नेहमी पास होतात, त्यामुळे टीमला वाटतं स्कॅनर ठीक आहे.' },
      solution: { en: 'Boundary value testing checks exactly at each edge and one step outside it. Four tests find the off-by-one bug that a hundred random tests miss.', mr: 'बाउंडरी व्हॅल्यू टेस्टिंगमध्ये प्रत्येक सीमेवर आणि सीमेच्या अगदी बाहेर तपासतात. चार टेस्ट्स तो बग शोधतात जो शंभर रँडम टेस्ट्सना सापडत नाही.' },
    },
    lesson: [
      { en: 'Bugs love edges. A rule says "120 or more", but the code says "more than 120". Only a 120 cm rider can catch that.', mr: 'बग्सना सीमा आवडतात. नियम म्हणतो "120 किंवा जास्त", पण कोड म्हणतो "120 पेक्षा जास्त". हे फक्त 120 सेमीचा रायडरच पकडू शकतो.' },
      { en: 'For every range, test: just below the lower edge, on the lower edge, on the upper edge, just above the upper edge.', mr: 'प्रत्येक रेंजसाठी तपासा: खालच्या सीमेच्या थोडं खाली, खालच्या सीमेवर, वरच्या सीमेवर, वरच्या सीमेच्या थोडं वर.' },
      { en: 'You will use this idea everywhere later: in SQL filters (WHERE price < 700), in API limits, and in automated tests.', mr: 'ही कल्पना पुढे सगळीकडे वापरशील: SQL फिल्टरमध्ये (WHERE price < 700), API मर्यादांमध्ये आणि ऑटोमेटेड टेस्ट्समध्ये.' },
    ],
    syntax: {
      template: 'TC-ID  input  ->  expected result',
      parts: [
        { code: 'TC-ID', means: { en: 'a unique test case number', mr: 'टेस्ट केसचा युनिक नंबर' } },
        { code: 'input', means: { en: 'the exact value you try', mr: 'तुम्ही वापरणार ती नेमकी व्हॅल्यू' } },
        { code: 'expected result', means: { en: 'what the system should do', mr: 'सिस्टमने काय करायला हवं' } },
      ],
      example: [
        { code: 'TC-01  height = 119 cm  ->  REJECTED', note: { en: 'one step below the lower edge', mr: 'खालच्या सीमेच्या एक पाऊल खाली' } },
        { code: 'TC-02  height = 120 cm  ->  ALLOWED', note: { en: 'exactly on the lower edge', mr: 'अगदी खालच्या सीमेवर' } },
        { code: 'TC-03  height = 190 cm  ->  ALLOWED', note: { en: 'exactly on the upper edge', mr: 'अगदी वरच्या सीमेवर' } },
        { code: 'TC-04  height = 191 cm  ->  REJECTED', note: { en: 'one step above the upper edge', mr: 'वरच्या सीमेच्या एक पाऊल वर' } },
      ],
      pitfall: { en: 'Do not stop at "normal" values like 150. They almost never fail.', mr: '150 सारख्या "सामान्य" व्हॅल्यूजवर थांबू नका. त्या जवळजवळ कधीच फेल होत नाहीत.' },
    },
    practice: {
      intro: { en: 'The ride opens tomorrow. Pick your tests.', mr: 'राईड उद्या सुरू होणार. तुझ्या टेस्ट्स निवड.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'Riders must be 120 to 190 cm (inclusive). Pick the FOUR boundary test heights.', mr: 'रायडर 120 ते 190 सेमी (दोन्ही धरून) असावा. चार बाउंडरी टेस्ट उंची निवडा.' },
          options: ['50 cm', '119 cm', '120 cm', '150 cm', '190 cm', '191 cm', '250 cm'],
          correct: [1, 2, 4, 5],
          explain: { en: '119/120 and 190/191 sit right on the edges. 150 is a fine "normal" test, but it rarely catches off-by-one bugs.', mr: '119/120 आणि 190/191 अगदी सीमेवर आहेत. 150 ही चांगली "सामान्य" टेस्ट आहे, पण ती क्वचितच असे बग्स पकडते.' },
          hints: [
            { en: 'Look for values right next to 120 and 190.', mr: '120 आणि 190 च्या अगदी जवळच्या व्हॅल्यूज शोधा.' },
            { en: 'One value on each edge, one just outside each edge.', mr: 'प्रत्येक सीमेवर एक, आणि प्रत्येक सीमेच्या बाहेर एक.' },
          ],
          successLine: { en: 'Test 120 cm... REJECTED?! The scanner uses "more than 120". Bug found!', mr: '120 सेमी टेस्ट... REJECTED?! स्कॅनर "120 पेक्षा जास्त" वापरतो. बग सापडला!' },
        },
        {
          kind: 'choice',
          prompt: { en: 'TC-02 (exactly 120 cm) was REJECTED. How severe is this bug?', mr: 'TC-02 (अगदी 120 सेमी) REJECTED झाली. हा बग किती गंभीर आहे?' },
          options: [
            { en: 'Cosmetic: nobody will notice', mr: 'दिसण्यापुरता: कोणाच्या लक्षात येणार नाही' },
            { en: 'Medium: riders exactly 120 cm are wrongly turned away', mr: 'मध्यम: अगदी 120 सेमीच्या रायडर्सना चुकीने परत पाठवलं जातं' },
            { en: 'Critical: the ride is dangerous', mr: 'अतिगंभीर: राईड धोकादायक आहे' },
          ],
          correct: [1],
          explain: { en: 'Real riders are wrongly refused, but nobody is in danger. Severity = how bad; priority = how soon to fix.', mr: 'खरे रायडर्स चुकीने नाकारले जातात, पण कोणाला धोका नाही. Severity = किती वाईट; Priority = किती लवकर दुरुस्त करायचं.' },
          hints: [{ en: 'Is anyone unsafe? Or just unhappy?', mr: 'कोणाला धोका आहे का? की फक्त नाराजी?' }],
        },
      ],
    },
    exam: [
      {
        q: { en: 'A password must be 8 to 20 characters. Which set is the boundary test set?', mr: 'पासवर्ड 8 ते 20 अक्षरांचा असावा. बाउंडरी टेस्ट सेट कोणता?' },
        options: ['1, 10, 30', '7, 8, 20, 21', '8, 14, 20', '10, 11, 12'],
        answer: 1,
        explain: { en: 'One step outside and right on each edge: 7, 8, 20, 21.', mr: 'प्रत्येक सीमेवर आणि सीमेच्या एक पाऊल बाहेर: 7, 8, 20, 21.' },
      },
      {
        q: { en: 'A discount applies to orders of ₹500 or more. Which test is MOST likely to find a bug?', mr: '₹500 किंवा जास्तच्या ऑर्डरवर सवलत आहे. कोणती टेस्ट बग शोधण्याची सर्वात जास्त शक्यता आहे?' },
        options: ['₹100', '₹500', '₹750', '₹5000'],
        answer: 1,
        explain: { en: '₹500 sits exactly on the edge. "≥ 500" vs "> 500" mistakes show up only there.', mr: '₹500 अगदी सीमेवर आहे. "≥ 500" आणि "> 500" मधली चूक फक्त तिथेच दिसते.' },
      },
      {
        q: { en: 'Severity describes...', mr: 'Severity म्हणजे...' },
        options: [
          { en: 'How soon the bug must be fixed', mr: 'बग किती लवकर दुरुस्त करायचा' },
          { en: 'How bad the impact is', mr: 'परिणाम किती वाईट आहे' },
          { en: 'Who found the bug', mr: 'बग कोणी शोधला' },
          { en: 'Which screen it is on', mr: 'तो कोणत्या स्क्रीनवर आहे' },
        ],
        answer: 1,
        explain: { en: 'Severity = impact. Priority = urgency. A typo on the CEO\'s page: low severity, high priority.', mr: 'Severity = परिणाम. Priority = तातडी. CEO च्या पेजवर टायपो: कमी severity, जास्त priority.' },
      },
      {
        q: { en: 'Age must be 18 to 60. How many boundary tests do you need at minimum?', mr: 'वय 18 ते 60 असावं. कमीत कमी किती बाउंडरी टेस्ट्स लागतील?' },
        options: ['1', '2', '4', '43'],
        answer: 2,
        explain: { en: 'Four: 17, 18, 60, 61.', mr: 'चार: 17, 18, 60, 61.' },
      },
    ],
    recap: { line: { en: 'Test ON the edge and one step OUTSIDE it. Bugs live at the boundaries.', mr: 'सीमेवर आणि सीमेच्या एक पाऊल बाहेर टेस्ट करा. बग्स सीमांवर राहतात.' }, icon: '📏' },
    outro: [
      { who: 'meera', mood: 'happy', text: { en: 'Found on day one. Nicely done, {name}.', mr: 'पहिल्याच दिवशी सापडला. छान, {name}.' } },
      { who: 'gremlin', mood: 'angry', text: { en: '>> lucky. next time i hide it in the DATA. ⌁⌁', mr: '>> नशीब. पुढच्या वेळी मी डेटामध्ये लपवेन. ⌁⌁' } },
    ],
  },
]

export const foundationLessons: Lesson[] = [
  // ───────────────────────── 1.1 SELECT & WHERE
  {
    id: 'a1-1',
    code: '1.1',
    level: 'basic',
    title: { en: 'Asking the Database', mr: 'डेटाबेसला प्रश्न विचारणं' },
    skill: 'SELECT & WHERE',
    realLife: {
      place: 'library',
      title: { en: 'Asking the librarian', mr: 'ग्रंथपालाला विचारणं' },
      story: {
        en: 'You walk into a library and say: "Show me only mystery novels from 2020." The librarian checks every shelf, keeps the books that match your rule, and hands you just those.',
        mr: 'तुम्ही ग्रंथालयात जाऊन म्हणता: "मला फक्त 2020 च्या रहस्यकथा दाखवा." ग्रंथपाल प्रत्येक कपाट तपासतो, तुमच्या नियमात बसणारी पुस्तकं ठेवतो आणि फक्त तीच तुमच्या हातात देतो.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Only mystery novels from 2020', mr: 'फक्त 2020 च्या रहस्यकथा' },
        items: [
          { icon: '📕', label: 'Mystery · 2020', mr: 'रहस्य · 2020', pass: true },
          { icon: '📗', label: 'Cooking · 2020', mr: 'पाककला · 2020', pass: false },
          { icon: '📘', label: 'Mystery · 2018', mr: 'रहस्य · 2018', pass: false },
          { icon: '📕', label: 'Mystery · 2020', mr: 'रहस्य · 2020', pass: true },
          { icon: '📙', label: 'Travel · 2021', mr: 'प्रवास · 2021', pass: false },
          { icon: '📕', label: 'Mystery · 2020', mr: 'रहस्य · 2020', pass: true },
          { icon: '📓', label: 'Poetry · 2020', mr: 'कविता · 2020', pass: false },
          { icon: '📘', label: 'Mystery · 2022', mr: 'रहस्य · 2022', pass: false },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'worried', text: { en: "I'm Theo, backend dev at ShopSprout. Customers keep emailing: \"Where is my order?\"", mr: 'मी थिओ, ShopSprout चा बॅकएंड डेव्हलपर. ग्राहक सतत ईमेल करतायत: "माझी ऑर्डर कुठे आहे?"' } },
        { who: 'theo', mood: 'neutral', text: { en: 'To check one customer I click through 6 admin screens. It takes forever.', mr: 'एका ग्राहकाची माहिती पाहायला मला 6 ॲडमिन स्क्रीन उघडाव्या लागतात. खूप वेळ जातो.' } },
        { who: 'meera', mood: 'happy', text: { en: "Then we skip the screens and ask the database directly, {name}.", mr: 'मग स्क्रीन सोडून आपण थेट डेटाबेसलाच विचारू, {name}.' } },
      ],
      problem: { en: 'Testers check data by clicking through the UI, one record at a time. Slow, and easy to miss things.', mr: 'टेस्टर्स UI मधून एक-एक रेकॉर्ड उघडून डेटा तपासतात. हळू, आणि गोष्टी सुटण्याची शक्यता जास्त.' },
      solution: { en: 'SQL lets you ask the database a precise question and get every matching row in a second. That is how DB testers verify data.', mr: 'SQL ने तुम्ही डेटाबेसला नेमका प्रश्न विचारू शकता आणि सगळ्या जुळणाऱ्या रोज एका सेकंदात मिळतात. DB टेस्टर्स डेटा असाच तपासतात.' },
    },
    lesson: [
      { en: 'A database keeps data in tables, like spreadsheets. Each row is one thing (a customer). Each column is one detail (name, city).', mr: 'डेटाबेस माहिती टेबल्समध्ये ठेवतो, स्प्रेडशीटसारखी. प्रत्येक row म्हणजे एक गोष्ट (एक ग्राहक). प्रत्येक column म्हणजे एक माहिती (नाव, शहर).' },
      { en: 'SELECT says which columns you want. FROM says which table. WHERE says which rows to keep.', mr: 'SELECT सांगतो कोणते columns हवेत. FROM सांगतो कोणतं टेबल. WHERE सांगतो कोणत्या rows ठेवायच्या.' },
      { en: 'Text values go in single quotes: \'Pune\'. Numbers need no quotes: 700. Combine rules with AND / OR.', mr: 'टेक्स्ट व्हॅल्यू सिंगल कोट्समध्ये: \'Pune\'. नंबरला कोट्स नकोत: 700. नियम AND / OR ने जोडा.' },
    ],
    syntax: {
      template: 'SELECT column1, column2\nFROM table_name\nWHERE condition;',
      parts: [
        { code: 'SELECT', means: { en: 'the columns to show (* means all)', mr: 'दाखवायचे columns (* म्हणजे सगळे)' } },
        { code: 'FROM', means: { en: 'the table to read', mr: 'वाचायचं टेबल' } },
        { code: 'WHERE', means: { en: 'the rule each row must pass', mr: 'प्रत्येक row ने पाळायचा नियम' } },
        { code: '= <> < > <= >=', means: { en: 'compare values (<> means "not equal")', mr: 'व्हॅल्यूजची तुलना (<> म्हणजे "समान नाही")' } },
      ],
      example: [
        { code: 'SELECT title, year', note: { en: 'which details I want', mr: 'मला कोणती माहिती हवी' } },
        { code: 'FROM books', note: { en: 'which shelf (table)', mr: 'कोणतं कपाट (टेबल)' } },
        { code: "WHERE genre = 'Mystery'", note: { en: 'rule 1, text in quotes', mr: 'नियम 1, टेक्स्ट कोट्समध्ये' } },
        { code: '  AND year = 2020;', note: { en: 'rule 2, number without quotes', mr: 'नियम 2, नंबर कोट्सशिवाय' } },
      ],
      pitfall: { en: "WHERE city = Pune (no quotes) fails. The database thinks Pune is a column name.", mr: 'WHERE city = Pune (कोट्सशिवाय) फेल होतं. डेटाबेसला वाटतं Pune हे column चं नाव आहे.' },
    },
    practice: {
      intro: { en: 'ShopSprout\'s live database is open. Tables are listed on the left.', mr: 'ShopSprout चा लाइव्ह डेटाबेस उघडा आहे. टेबल्स डावीकडे दिसतायत.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'Theo needs to call customers in Pune. List the name and city of every customer who lives in Pune.', mr: 'थिओला पुण्यातल्या ग्राहकांना फोन करायचाय. पुण्यात राहणाऱ्या प्रत्येक ग्राहकाचं name आणि city दाखवा.' },
          starter: 'SELECT name, city\nFROM customers\nWHERE ',
          expected: "SELECT name, city FROM customers WHERE city = 'Pune'",
          hints: [
            { en: 'You already have SELECT and FROM. What rule should WHERE use?', mr: 'SELECT आणि FROM तयार आहेत. WHERE मध्ये कोणता नियम हवा?' },
            { en: "Compare the city column with the text 'Pune'.", mr: "city column ची तुलना 'Pune' या टेक्स्टशी करा." },
            { en: "WHERE city = '____'", mr: "WHERE city = '____'" },
            { en: "SELECT name, city FROM customers WHERE city = 'Pune';", mr: "SELECT name, city FROM customers WHERE city = 'Pune';" },
          ],
          successLine: { en: '10 customers in Pune. Theo is already dialing.', mr: 'पुण्यात 10 ग्राहक. थिओने फोन लावायला सुरुवातही केली.' },
        },
        {
          kind: 'sql',
          prompt: { en: 'Sam wants a "budget kitchen" banner. Show the name and price of Kitchen products under 700.', mr: 'सॅमला "स्वस्त किचन" बॅनर हवाय. 700 पेक्षा कमी किमतीच्या Kitchen products चं name आणि price दाखवा.' },
          expected: "SELECT name, price FROM products WHERE category = 'Kitchen' AND price < 700",
          hints: [
            { en: 'Two rules: a category rule and a price rule.', mr: 'दोन नियम: category चा आणि price चा.' },
            { en: 'Join the two rules with AND.', mr: 'दोन्ही नियम AND ने जोडा.' },
            { en: "WHERE category = 'Kitchen' AND price < ___", mr: "WHERE category = 'Kitchen' AND price < ___" },
            { en: "SELECT name, price FROM products WHERE category = 'Kitchen' AND price < 700;", mr: "SELECT name, price FROM products WHERE category = 'Kitchen' AND price < 700;" },
          ],
        },
      ],
    },
    exam: [
      {
        q: { en: 'Which part of a query decides WHICH ROWS come back?', mr: 'क्वेरीचा कोणता भाग ठरवतो की कोणत्या ROWS परत येतील?' },
        options: ['SELECT', 'FROM', 'WHERE', 'ORDER BY'],
        answer: 2,
        explain: { en: 'WHERE is the librarian\'s rule: it keeps only matching rows.', mr: 'WHERE म्हणजे ग्रंथपालाचा नियम: फक्त जुळणाऱ्या rows ठेवतो.' },
      },
      {
        q: { en: 'What is wrong here?', mr: 'यात काय चुकलंय?' },
        code: 'SELECT name FROM customers WHERE city = Mumbai;',
        options: [
          { en: 'Nothing', mr: 'काहीच नाही' },
          { en: "Text needs quotes: 'Mumbai'", mr: "टेक्स्टला कोट्स हवेत: 'Mumbai'" },
          { en: 'Use == instead of =', mr: '= ऐवजी == वापरा' },
          { en: 'SELECT must be lowercase', mr: 'SELECT लहान अक्षरात हवं' },
        ],
        answer: 1,
        explain: { en: "Text values need single quotes.", mr: 'टेक्स्ट व्हॅल्यूजना सिंगल कोट्स हवेत.' },
      },
      {
        q: { en: 'Which query shows ALL columns of the products table?', mr: 'कोणती क्वेरी products टेबलचे सगळे columns दाखवते?' },
        options: ['SELECT ALL products', 'SELECT * FROM products', 'SHOW products', 'SELECT products.*columns'],
        answer: 1,
        explain: { en: '* means "every column".', mr: '* म्हणजे "सगळे columns".' },
      },
      {
        q: { en: 'You want products that are NOT in the Garden category. Which WHERE works?', mr: 'Garden category मध्ये नसलेले products हवेत. कोणतं WHERE बरोबर?' },
        options: ["WHERE category <> 'Garden'", "WHERE category = NOT 'Garden'", "WHERE NOT category 'Garden'", "WHERE category != Garden"],
        answer: 0,
        explain: { en: '<> (or !=) means "not equal", and the text still needs quotes.', mr: '<> (किंवा !=) म्हणजे "समान नाही", आणि टेक्स्टला कोट्स लागतातच.' },
      },
    ],
    recap: { line: { en: 'SELECT = which columns, FROM = which table, WHERE = which rows.', mr: 'SELECT = कोणते columns, FROM = कोणतं टेबल, WHERE = कोणत्या rows.' }, icon: '📚' },
    outro: [
      { who: 'theo', mood: 'surprised', text: { en: 'Thirty seconds? It takes me ten minutes in the admin panel.', mr: 'तीस सेकंद? मला ॲडमिन पॅनेलमध्ये दहा मिनिटं लागतात.' } },
      { who: 'gremlin', mood: 'smug', text: { en: '>> cute. now find the things that are NOT there. ⌁', mr: '>> गोड. आता जे नाहीच ते शोधून दाखव. ⌁' } },
    ],
  },

  // ───────────────────────── 1.2 ORDER BY & LIMIT
  {
    id: 'a1-2',
    code: '1.2',
    level: 'basic',
    title: { en: 'The Leaderboard', mr: 'लीडरबोर्ड' },
    skill: 'ORDER BY & LIMIT',
    realLife: {
      place: 'fair',
      title: { en: 'The sunflower contest', mr: 'सूर्यफुलांची स्पर्धा' },
      story: {
        en: 'At the village fair, judges line up every sunflower from tallest to shortest, then hand ribbons to only the first three.',
        mr: 'गावच्या जत्रेत परीक्षक सगळी सूर्यफुलं सर्वात उंच ते सर्वात लहान अशी रांगेत लावतात, आणि फक्त पहिल्या तिघांना बक्षीस देतात.',
      },
      scene: {
        type: 'sort',
        unit: 'cm',
        top: 3,
        items: [
          { icon: '🌻', label: 'Sunny', value: 182 },
          { icon: '🌻', label: 'Goldie', value: 240 },
          { icon: '🌻', label: 'Beam', value: 155 },
          { icon: '🌻', label: 'Ray', value: 211 },
          { icon: '🌻', label: 'Petal', value: 198 },
          { icon: '🌻', label: 'Sprout', value: 120 },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'happy', text: { en: 'Marketing wants a "Luxury Picks" email: the 3 most expensive products, top first.', mr: 'मार्केटिंगला "लक्झरी पिक्स" ईमेल हवाय: सर्वात महाग 3 products, सर्वात महाग आधी.' } },
        { who: 'sam', mood: 'worried', text: { en: 'And the warehouse says something is running out. What has the least stock?', mr: 'आणि वेअरहाऊस म्हणतंय काहीतरी संपत आलंय. सर्वात कमी stock कशाचा आहे?' } },
      ],
      problem: { en: 'With 24 products, scanning a list by eye for "top 3" or "lowest" is slow and error-prone.', mr: '24 products मध्ये "टॉप 3" किंवा "सर्वात कमी" डोळ्यांनी शोधणं हळू आणि चुकीचं होऊ शकतं.' },
      solution: { en: 'ORDER BY sorts the rows for you and LIMIT keeps only the first few. Any "top N" question becomes one query.', mr: 'ORDER BY rows क्रमाने लावतो आणि LIMIT फक्त पहिल्या काही ठेवतो. कोणताही "टॉप N" प्रश्न एका क्वेरीत सुटतो.' },
    },
    lesson: [
      { en: 'ORDER BY sorts rows by a column. ASC = smallest first (the default). DESC = biggest first.', mr: 'ORDER BY एका column नुसार rows क्रमाने लावतो. ASC = लहान आधी (डीफॉल्ट). DESC = मोठं आधी.' },
      { en: 'LIMIT keeps only the first N rows after sorting.', mr: 'LIMIT क्रम लावल्यानंतर फक्त पहिल्या N rows ठेवतो.' },
      { en: 'Order of clauses matters: SELECT → FROM → WHERE → ORDER BY → LIMIT.', mr: 'क्लॉजचा क्रम महत्त्वाचा: SELECT → FROM → WHERE → ORDER BY → LIMIT.' },
    ],
    syntax: {
      template: 'SELECT columns\nFROM table\nORDER BY column [ASC | DESC]\nLIMIT n;',
      parts: [
        { code: 'ORDER BY', means: { en: 'the column to sort by', mr: 'कोणत्या column नुसार क्रम लावायचा' } },
        { code: 'ASC / DESC', means: { en: 'small→big or big→small', mr: 'लहान→मोठं किंवा मोठं→लहान' } },
        { code: 'LIMIT n', means: { en: 'keep only n rows', mr: 'फक्त n rows ठेवा' } },
      ],
      example: [
        { code: 'SELECT name, height', note: { en: 'what to show', mr: 'काय दाखवायचं' } },
        { code: 'FROM sunflowers', note: { en: 'which table', mr: 'कोणतं टेबल' } },
        { code: 'ORDER BY height DESC', note: { en: 'tallest first', mr: 'सर्वात उंच आधी' } },
        { code: 'LIMIT 3;', note: { en: 'only the top three', mr: 'फक्त पहिले तीन' } },
      ],
      pitfall: { en: 'LIMIT without ORDER BY gives "some" rows, not the top rows. Always sort first.', mr: 'ORDER BY शिवाय LIMIT कोणत्याही rows देतो, टॉप नव्हे. आधी क्रम लावा.' },
    },
    practice: {
      intro: { en: 'Line them up.', mr: 'रांगेत लावा.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'Show the name and price of the 3 most expensive products, most expensive first.', mr: 'सर्वात महाग 3 products चं name आणि price दाखवा, सर्वात महाग आधी.' },
          expected: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 3',
          orderMatters: true,
          hints: [
            { en: 'Sort by price. Which direction puts the most expensive first?', mr: 'price नुसार क्रम लावा. सर्वात महाग आधी येण्यासाठी कोणती दिशा?' },
            { en: 'DESC = biggest first. Then keep 3 rows.', mr: 'DESC = मोठं आधी. मग 3 rows ठेवा.' },
            { en: 'ORDER BY price DESC LIMIT __', mr: 'ORDER BY price DESC LIMIT __' },
            { en: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 3;', mr: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 3;' },
          ],
        },
        {
          kind: 'sql',
          prompt: { en: 'Which ONE product has the lowest stock? Show its name and stock.', mr: 'कोणत्या एका product चा stock सर्वात कमी आहे? त्याचं name आणि stock दाखवा.' },
          expected: 'SELECT name, stock FROM products ORDER BY stock ASC LIMIT 1',
          hints: [
            { en: 'Sort by stock, smallest first.', mr: 'stock नुसार, लहान आधी.' },
            { en: 'ASC (or nothing) = smallest first. Keep 1 row.', mr: 'ASC (किंवा काहीच नाही) = लहान आधी. 1 row ठेवा.' },
            { en: 'ORDER BY stock LIMIT 1', mr: 'ORDER BY stock LIMIT 1' },
            { en: 'SELECT name, stock FROM products ORDER BY stock LIMIT 1;', mr: 'SELECT name, stock FROM products ORDER BY stock LIMIT 1;' },
          ],
          successLine: { en: 'Sproutling Plant Kit: ZERO in stock. Sam frowns: "That one sells well..." Remember this.', mr: 'Sproutling Plant Kit: stock शून्य. सॅम म्हणतो: "हा तर खूप विकला जातो..." हे लक्षात ठेव.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'You want the 5 cheapest products. Which ending is right?', mr: 'सर्वात स्वस्त 5 products हवेत. कोणता शेवट बरोबर?' },
        options: ['ORDER BY price DESC LIMIT 5', 'ORDER BY price ASC LIMIT 5', 'LIMIT 5 ORDER BY price', 'WHERE price LIMIT 5'],
        answer: 1,
        explain: { en: 'Cheapest = smallest first = ASC. LIMIT comes last.', mr: 'सर्वात स्वस्त = लहान आधी = ASC. LIMIT शेवटी येतो.' },
      },
      {
        q: { en: 'What is the default sort direction?', mr: 'डीफॉल्ट क्रमाची दिशा कोणती?' },
        options: ['DESC', 'ASC', { en: 'Random', mr: 'रँडम' }, { en: 'By id', mr: 'id नुसार' }],
        answer: 1,
        explain: { en: 'Without ASC or DESC, SQL sorts smallest first.', mr: 'ASC किंवा DESC नसेल तर SQL लहान आधी लावतो.' },
      },
      {
        q: { en: 'What does this return?', mr: 'ही क्वेरी काय देते?' },
        code: 'SELECT name FROM customers ORDER BY joined_on DESC LIMIT 1;',
        options: [
          { en: 'The oldest customer', mr: 'सर्वात जुना ग्राहक' },
          { en: 'The newest customer', mr: 'सर्वात नवीन ग्राहक' },
          { en: 'All customers', mr: 'सगळे ग्राहक' },
          { en: 'An error', mr: 'एरर' },
        ],
        answer: 1,
        explain: { en: 'Latest date first, keep 1 = the most recently joined customer.', mr: 'नवीन तारीख आधी, 1 ठेवा = सर्वात अलीकडे जोडलेला ग्राहक.' },
      },
      {
        q: { en: 'Why is LIMIT without ORDER BY risky in a test?', mr: 'टेस्टमध्ये ORDER BY शिवाय LIMIT धोकादायक का?' },
        options: [
          { en: 'It is slower', mr: 'तो हळू चालतो' },
          { en: 'The rows you get are not guaranteed', mr: 'कोणत्या rows मिळतील याची खात्री नसते' },
          { en: 'It deletes data', mr: 'तो डेटा डिलीट करतो' },
          { en: 'It is not allowed', mr: 'त्याला परवानगी नाही' },
        ],
        answer: 1,
        explain: { en: 'Without a sort, the database may return any rows, so the test becomes flaky.', mr: 'क्रम नसेल तर डेटाबेस कोणत्याही rows देऊ शकतो, त्यामुळे टेस्ट अस्थिर होते.' },
      },
    ],
    recap: { line: { en: 'ORDER BY sorts (DESC = biggest first). LIMIT keeps the top few.', mr: 'ORDER BY क्रम लावतो (DESC = मोठं आधी). LIMIT वरच्या काही ठेवतो.' }, icon: '🌻' },
    outro: [{ who: 'meera', mood: 'neutral', text: { en: 'Zero stock on a bestseller. Detectives notice odd details, {name}.', mr: 'खूप विकल्या जाणाऱ्या वस्तूचा stock शून्य. गुप्तहेर अशा विचित्र गोष्टी टिपतात, {name}.' } }],
  },

  // ───────────────────────── 1.3 GROUP BY
  {
    id: 'a1-3',
    code: '1.3',
    level: 'basic',
    title: { en: 'Counting the Damage', mr: 'नुकसान मोजणं' },
    skill: 'COUNT & GROUP BY',
    realLife: {
      place: 'home',
      title: { en: 'Sorting the laundry', mr: 'कपडे वेगळे करणं' },
      story: {
        en: 'Tip out the laundry basket. Make one pile per color, count each pile, then point only at the piles with more than 2 socks.',
        mr: 'कपड्यांची टोपली रिकामी करा. प्रत्येक रंगाचा वेगळा ढीग करा, प्रत्येक ढीग मोजा, आणि फक्त 2 पेक्षा जास्त मोजे असलेल्या ढिगांकडे बोट दाखवा.',
      },
      scene: {
        type: 'group',
        groups: [
          { icon: '🟥', label: 'Red pile', mr: 'लाल ढीग' },
          { icon: '🟦', label: 'Blue pile', mr: 'निळा ढीग' },
          { icon: '⬜', label: 'White pile', mr: 'पांढरा ढीग' },
        ],
        items: [0, 1, 2, 1, 0, 1, 2, 1, 0].map((group) => ({ icon: '🧦', group })),
        note: { en: 'HAVING COUNT > 2 keeps only piles with more than 2 socks', mr: 'HAVING COUNT > 2 फक्त 2 पेक्षा जास्त मोजे असलेले ढीग ठेवतो' },
      },
    },
    solves: {
      dialogue: [
        { who: 'rex', mood: 'smug', text: { en: "Rex. Senior automation. So you're the manual tester. Let's see you count.", mr: 'मी रेक्स. सीनियर ऑटोमेशन. तर तू मॅन्युअल टेस्टर. बघू मोजता येतं का.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'How many orders are in each status? And is anyone paying twice? Finance thinks so.', mr: 'प्रत्येक status मध्ये किती ऑर्डर्स आहेत? आणि कोणी दोनदा पैसे भरलेत का? फायनान्सला तसं वाटतंय.' } },
      ],
      problem: { en: 'Finance needs totals per category, not 300 individual rows. Counting by hand is impossible.', mr: 'फायनान्सला प्रत्येक प्रकाराची बेरीज हवी, 300 वेगवेगळ्या rows नव्हे. हाताने मोजणं अशक्य आहे.' },
      solution: { en: 'GROUP BY makes piles, COUNT counts each pile, HAVING keeps only suspicious piles. Duplicate payments jump straight out.', mr: 'GROUP BY ढीग करतो, COUNT प्रत्येक ढीग मोजतो, HAVING फक्त संशयास्पद ढीग ठेवतो. डुप्लिकेट पेमेंट्स लगेच दिसतात.' },
    },
    lesson: [
      { en: 'COUNT(*) counts rows. SUM(), AVG(), MIN(), MAX() work the same way on a column.', mr: 'COUNT(*) rows मोजतो. SUM(), AVG(), MIN(), MAX() column वर असंच काम करतात.' },
      { en: 'GROUP BY splits rows into piles that share a value, then the function runs once per pile.', mr: 'GROUP BY एकसारखी व्हॅल्यू असलेल्या rows चे ढीग करतो, मग फंक्शन प्रत्येक ढिगावर एकदा चालतं.' },
      { en: 'WHERE filters rows BEFORE grouping. HAVING filters piles AFTER counting.', mr: 'WHERE ग्रुपिंगच्या आधी rows फिल्टर करतो. HAVING मोजल्यानंतर ढीग फिल्टर करतो.' },
    ],
    syntax: {
      template: 'SELECT column, COUNT(*)\nFROM table\nGROUP BY column\nHAVING COUNT(*) > n;',
      parts: [
        { code: 'COUNT(*)', means: { en: 'number of rows in each pile', mr: 'प्रत्येक ढिगातल्या rows ची संख्या' } },
        { code: 'GROUP BY', means: { en: 'the column that defines the piles', mr: 'कोणत्या column नुसार ढीग करायचे' } },
        { code: 'HAVING', means: { en: 'a rule on the pile (after counting)', mr: 'ढिगावरचा नियम (मोजल्यानंतर)' } },
      ],
      example: [
        { code: 'SELECT color, COUNT(*)', note: { en: 'each color and how many', mr: 'प्रत्येक रंग आणि किती' } },
        { code: 'FROM socks', note: { en: 'the laundry basket', mr: 'कपड्यांची टोपली' } },
        { code: 'GROUP BY color', note: { en: 'one pile per color', mr: 'प्रत्येक रंगाचा एक ढीग' } },
        { code: 'HAVING COUNT(*) > 2;', note: { en: 'piles with more than 2', mr: '2 पेक्षा जास्त असलेले ढीग' } },
      ],
      pitfall: { en: 'Every SELECTed column must be in GROUP BY or inside a function like COUNT().', mr: 'SELECT मधला प्रत्येक column GROUP BY मध्ये किंवा COUNT() सारख्या फंक्शनमध्ये हवा.' },
    },
    practice: {
      intro: { en: 'Count it up.', mr: 'मोजून बघ.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'How many orders are in each status? Show the status and the count.', mr: 'प्रत्येक status मध्ये किती ऑर्डर्स? status आणि count दाखवा.' },
          expected: 'SELECT status, COUNT(*) FROM orders GROUP BY status',
          hints: [
            { en: 'One pile per status.', mr: 'प्रत्येक status चा एक ढीग.' },
            { en: 'GROUP BY status, and COUNT(*) in the SELECT.', mr: 'GROUP BY status, आणि SELECT मध्ये COUNT(*).' },
            { en: 'SELECT status, COUNT(*) FROM orders GROUP BY ____', mr: 'SELECT status, COUNT(*) FROM orders GROUP BY ____' },
            { en: 'SELECT status, COUNT(*) FROM orders GROUP BY status;', mr: 'SELECT status, COUNT(*) FROM orders GROUP BY status;' },
          ],
          successLine: { en: '38 orders stuck in PAID. Paid, but never moving on.', mr: '38 ऑर्डर्स PAID मध्ये अडकल्या आहेत. पैसे भरले, पण पुढे काहीच नाही.' },
        },
        {
          kind: 'sql',
          prompt: { en: 'Find every order_id in payments that was paid MORE than once.', mr: 'payments मधले असे सगळे order_id शोधा ज्यांचे पैसे एकापेक्षा जास्त वेळा भरले गेले.' },
          expected: 'SELECT order_id FROM payments GROUP BY order_id HAVING COUNT(*) > 1',
          hints: [
            { en: 'One pile per order_id in payments.', mr: 'payments मध्ये प्रत्येक order_id चा एक ढीग.' },
            { en: 'Keep piles with more than one row. That filter happens AFTER counting.', mr: 'एकापेक्षा जास्त rows असलेले ढीग ठेवा. हा फिल्टर मोजल्यानंतर लागतो.' },
            { en: 'GROUP BY order_id HAVING COUNT(*) > 1', mr: 'GROUP BY order_id HAVING COUNT(*) > 1' },
            { en: 'SELECT order_id FROM payments GROUP BY order_id HAVING COUNT(*) > 1;', mr: 'SELECT order_id FROM payments GROUP BY order_id HAVING COUNT(*) > 1;' },
          ],
          successLine: { en: 'Three orders charged twice. Rex goes quiet: "...Okay. That\'s real."', mr: 'तीन ऑर्डर्सचे पैसे दोनदा घेतले. रेक्स शांत होतो: "...ठीक आहे. हे खरंय."' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'You want cities with more than 10 customers. Where does "COUNT(*) > 10" go?', mr: '10 पेक्षा जास्त ग्राहक असलेली शहरं हवीत. "COUNT(*) > 10" कुठे येईल?' },
        options: ['WHERE', 'HAVING', 'ORDER BY', 'SELECT'],
        answer: 1,
        explain: { en: 'A filter on a count happens after grouping: HAVING.', mr: 'count वरचा फिल्टर ग्रुपिंगनंतर: HAVING.' },
      },
      {
        q: { en: 'What does this return?', mr: 'ही क्वेरी काय देते?' },
        code: 'SELECT category, AVG(price)\nFROM products\nGROUP BY category;',
        options: [
          { en: 'One row per product', mr: 'प्रत्येक product साठी एक row' },
          { en: 'One row per category with its average price', mr: 'प्रत्येक category साठी एक row, सरासरी किमतीसह' },
          { en: 'One single average', mr: 'फक्त एक सरासरी' },
          { en: 'An error', mr: 'एरर' },
        ],
        answer: 1,
        explain: { en: 'One pile per category, AVG runs per pile.', mr: 'प्रत्येक category चा ढीग, AVG प्रत्येक ढिगावर.' },
      },
      {
        q: { en: 'Why does this fail?', mr: 'ही क्वेरी फेल का होते?' },
        code: 'SELECT status, customer_id, COUNT(*)\nFROM orders\nGROUP BY status;',
        options: [
          { en: 'COUNT needs a column name', mr: 'COUNT ला column नाव हवं' },
          { en: 'customer_id is not grouped or aggregated', mr: 'customer_id ना group केलाय ना aggregate' },
          { en: 'GROUP BY must come first', mr: 'GROUP BY आधी यायला हवं' },
          { en: 'status is a reserved word', mr: 'status राखीव शब्द आहे' },
        ],
        answer: 1,
        explain: { en: 'Each pile has many customer_ids. SQL cannot pick one.', mr: 'प्रत्येक ढिगात अनेक customer_id आहेत. SQL एक निवडू शकत नाही.' },
      },
      {
        q: { en: 'Which finds duplicate emails?', mr: 'डुप्लिकेट ईमेल कोणती क्वेरी शोधते?' },
        options: [
          'SELECT email FROM customers WHERE COUNT(*) > 1',
          'SELECT email FROM customers GROUP BY email HAVING COUNT(*) > 1',
          'SELECT DISTINCT email FROM customers',
          'SELECT email FROM customers ORDER BY email',
        ],
        answer: 1,
        explain: { en: 'Group by the value, keep groups bigger than 1. You will use this pattern a lot.', mr: 'व्हॅल्यूनुसार group करा, 1 पेक्षा मोठे groups ठेवा. हा पॅटर्न खूप वापरशील.' },
      },
    ],
    recap: { line: { en: 'GROUP BY makes piles, COUNT counts them, HAVING filters the piles.', mr: 'GROUP BY ढीग करतो, COUNT मोजतो, HAVING ढीग फिल्टर करतो.' }, icon: '🧺' },
    outro: [{ who: 'gremlin', mood: 'smug', text: { en: '>> double charges are just my opening act. wait till you meet the bank. ⌁', mr: '>> दुहेरी पैसे ही फक्त सुरुवात आहे. बँकेत भेटूच. ⌁' } }],
  },

  // ───────────────────────── 1.4 INNER JOIN
  {
    id: 'a1-4',
    code: '1.4',
    level: 'basic',
    title: { en: 'Following the Trail', mr: 'धागा पकडणं' },
    skill: 'INNER JOIN',
    realLife: {
      place: 'wedding',
      title: { en: 'The wedding guest list', mr: 'लग्नाची पाहुण्यांची यादी' },
      story: {
        en: 'You have the guest list and a pile of RSVP cards. Clip each card next to its guest. INNER JOIN keeps only the guests who have a card clipped on.',
        mr: 'तुमच्याकडे पाहुण्यांची यादी आणि RSVP कार्डांचा ढीग आहे. प्रत्येक कार्ड त्या पाहुण्याच्या नावापुढे लावा. INNER JOIN फक्त कार्ड लागलेले पाहुणे ठेवतो.',
      },
      scene: { type: 'match', leftTitle: { en: 'Guest list', mr: 'पाहुण्यांची यादी' }, rightTitle: { en: 'RSVP cards', mr: 'RSVP कार्ड' }, left: guests, right: rsvps, links: guestLinks, mode: 'inner' },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'neutral', text: { en: 'Orders are in one table, shipments in another, customers in a third. That is how databases are built.', mr: 'ऑर्डर्स एका टेबलमध्ये, शिपमेंट्स दुसऱ्यात, ग्राहक तिसऱ्यात. डेटाबेस असेच बनवतात.' } },
        { who: 'theo', mood: 'worried', text: { en: 'Support wants the carrier for every order from October 15th. That is two tables at once...', mr: 'सपोर्टला 15 ऑक्टोबरच्या प्रत्येक ऑर्डरचा carrier हवाय. म्हणजे एकाच वेळी दोन टेबल्स...' } },
      ],
      problem: { en: 'The answer is split across tables. Copying data between spreadsheets by hand is slow and mistakes creep in.', mr: 'उत्तर वेगवेगळ्या टेबल्समध्ये विखुरलेलं आहे. हाताने स्प्रेडशीटमध्ये कॉपी करणं हळू आणि चुकांचं आहे.' },
      solution: { en: 'A JOIN glues tables together on a shared ID, so one query answers a question that spans many tables.', mr: 'JOIN एका सामायिक ID वर टेबल्स जोडतो, त्यामुळे अनेक टेबल्समधला प्रश्न एका क्वेरीत सुटतो.' },
    },
    lesson: [
      { en: 'Data is split across tables on purpose, so nothing is stored twice. ID columns link them: shipments.order_id points to orders.id.', mr: 'काहीही दोनदा साठवू नये म्हणून डेटा मुद्दाम वेगळ्या टेबल्समध्ये ठेवतात. ID columns त्यांना जोडतात: shipments.order_id हा orders.id कडे निर्देश करतो.' },
      { en: 'JOIN ... ON places rows side by side wherever the IDs match.', mr: 'JOIN ... ON जिथे ID जुळतात तिथे rows शेजारी शेजारी लावतो.' },
      { en: 'INNER JOIN (or just JOIN) keeps only rows that found a partner in BOTH tables. Short nicknames (o, s) keep queries readable.', mr: 'INNER JOIN (किंवा फक्त JOIN) फक्त दोन्ही टेबल्समध्ये जोडीदार सापडलेल्या rows ठेवतो. छोटी टोपणनावं (o, s) क्वेरी वाचायला सोपी करतात.' },
    ],
    syntax: {
      template: 'SELECT a.col, b.col\nFROM table_a a\nJOIN table_b b ON b.a_id = a.id;',
      parts: [
        { code: 'table_a a', means: { en: 'a table with a short nickname', mr: 'टेबल आणि त्याचं छोटं टोपणनाव' } },
        { code: 'JOIN table_b b', means: { en: 'the second table to attach', mr: 'जोडायचं दुसरं टेबल' } },
        { code: 'ON b.a_id = a.id', means: { en: 'the matching rule (which IDs belong together)', mr: 'जुळण्याचा नियम (कोणते ID एकत्र)' } },
      ],
      example: [
        { code: 'SELECT g.name, r.meal', note: { en: 'columns from both tables', mr: 'दोन्ही टेबल्सचे columns' } },
        { code: 'FROM guests g', note: { en: 'the guest list', mr: 'पाहुण्यांची यादी' } },
        { code: 'JOIN rsvps r', note: { en: 'the RSVP cards', mr: 'RSVP कार्ड' } },
        { code: '  ON r.guest_id = g.id;', note: { en: 'clip card to matching guest', mr: 'कार्ड योग्य पाहुण्याला लावा' } },
      ],
      pitfall: { en: 'Forgetting ON (or matching the wrong columns) multiplies rows. Always check the row count.', mr: 'ON विसरलात (किंवा चुकीचे columns जुळवले) तर rows गुणाकाराने वाढतात. नेहमी row count तपासा.' },
    },
    practice: {
      intro: { en: 'Two tables, one answer.', mr: 'दोन टेबल्स, एक उत्तर.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'For orders placed on 2026-10-15, show the order id and the shipment carrier.', mr: '2026-10-15 ला दिलेल्या ऑर्डर्सचा order id आणि shipment carrier दाखवा.' },
          starter: 'SELECT o.id, s.carrier\nFROM orders o\nJOIN shipments s ON ',
          expected: "SELECT o.id, s.carrier FROM orders o JOIN shipments s ON s.order_id = o.id WHERE o.order_date = '2026-10-15'",
          hints: [
            { en: 'Which column in shipments points at orders?', mr: 'shipments मधला कोणता column orders कडे निर्देश करतो?' },
            { en: 'Match s.order_id with o.id, then filter by date.', mr: 's.order_id ला o.id शी जुळवा, मग तारखेने फिल्टर करा.' },
            { en: "... ON s.order_id = o.id WHERE o.order_date = '2026-10-15'", mr: "... ON s.order_id = o.id WHERE o.order_date = '2026-10-15'" },
            { en: "SELECT o.id, s.carrier FROM orders o JOIN shipments s ON s.order_id = o.id WHERE o.order_date = '2026-10-15';", mr: "SELECT o.id, s.carrier FROM orders o JOIN shipments s ON s.order_id = o.id WHERE o.order_date = '2026-10-15';" },
          ],
        },
        {
          kind: 'sql',
          prompt: { en: 'Now join customers: show the customer name and order id for orders placed on 2026-10-15.', mr: 'आता customers जोडा: 2026-10-15 च्या ऑर्डर्ससाठी ग्राहकाचं name आणि order id दाखवा.' },
          expected: "SELECT c.name, o.id FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.order_date = '2026-10-15'",
          hints: [
            { en: 'orders.customer_id points at customers.id.', mr: 'orders.customer_id हा customers.id कडे निर्देश करतो.' },
            { en: 'JOIN customers c ON c.id = o.customer_id', mr: 'JOIN customers c ON c.id = o.customer_id' },
            { en: "SELECT c.name, o.id FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.order_date = '____'", mr: "SELECT c.name, o.id FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.order_date = '____'" },
            { en: "SELECT c.name, o.id FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.order_date = '2026-10-15';", mr: "SELECT c.name, o.id FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.order_date = '2026-10-15';" },
          ],
          successLine: { en: '5 orders that day, but only 4 shipments in the first query. One is missing...', mr: 'त्या दिवशी 5 ऑर्डर्स, पण पहिल्या क्वेरीत फक्त 4 शिपमेंट्स. एक गायब आहे...' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'INNER JOIN between orders and shipments returns...', mr: 'orders आणि shipments मधला INNER JOIN काय देतो?' },
        options: [
          { en: 'Every order', mr: 'प्रत्येक ऑर्डर' },
          { en: 'Every shipment', mr: 'प्रत्येक शिपमेंट' },
          { en: 'Only orders that have a shipment', mr: 'फक्त शिपमेंट असलेल्या ऑर्डर्स' },
          { en: 'Only orders without a shipment', mr: 'फक्त शिपमेंट नसलेल्या ऑर्डर्स' },
        ],
        answer: 2,
        explain: { en: 'INNER keeps matched pairs only.', mr: 'INNER फक्त जुळलेल्या जोड्या ठेवतो.' },
      },
      {
        q: { en: 'In "JOIN customers c ON c.id = o.customer_id", what is c?', mr: '"JOIN customers c ON c.id = o.customer_id" मध्ये c काय आहे?' },
        options: [
          { en: 'A column', mr: 'एक column' },
          { en: 'A nickname (alias) for customers', mr: 'customers चं टोपणनाव (alias)' },
          { en: 'A function', mr: 'एक फंक्शन' },
          { en: 'A new table', mr: 'नवीन टेबल' },
        ],
        answer: 1,
        explain: { en: 'Aliases are short names so you can write c.name instead of customers.name.', mr: 'Alias म्हणजे छोटं नाव, म्हणजे customers.name ऐवजी c.name लिहिता येतं.' },
      },
      {
        q: { en: 'A join suddenly returns 9,000 rows instead of 300. Most likely cause?', mr: 'JOIN अचानक 300 ऐवजी 9,000 rows देतो. सर्वात शक्य कारण?' },
        options: [
          { en: 'Too many customers', mr: 'खूप ग्राहक' },
          { en: 'The ON condition is missing or wrong', mr: 'ON अट नाही किंवा चुकीची आहे' },
          { en: 'LIMIT is missing', mr: 'LIMIT नाही' },
          { en: 'The database is slow', mr: 'डेटाबेस हळू आहे' },
        ],
        answer: 1,
        explain: { en: 'Without the right ON, every row pairs with every row.', mr: 'योग्य ON नसेल तर प्रत्येक row प्रत्येक row शी जोडली जाते.' },
      },
      {
        q: { en: 'Which column usually links order_items to products?', mr: 'order_items आणि products सहसा कोणत्या column ने जोडतात?' },
        options: ['order_items.qty = products.stock', 'order_items.product_id = products.id', 'order_items.id = products.id', 'order_items.unit_price = products.price'],
        answer: 1,
        explain: { en: 'A foreign key (product_id) points to the primary key (id).', mr: 'Foreign key (product_id) हा primary key (id) कडे निर्देश करतो.' },
      },
    ],
    recap: { line: { en: 'INNER JOIN = only rows with a partner in BOTH tables.', mr: 'INNER JOIN = फक्त दोन्ही टेबल्समध्ये जोडीदार असलेल्या rows.' }, icon: '💍' },
    outro: [{ who: 'meera', mood: 'neutral', text: { en: 'INNER JOIN hides the ones without a partner. Next, we go looking for them.', mr: 'INNER JOIN जोडीदार नसलेल्यांना लपवतो. पुढच्या धड्यात आपण त्यांनाच शोधू.' } }],
  },

  // ───────────────────────── 1.5 LEFT JOIN
  {
    id: 'a1-5',
    code: '1.5',
    level: 'basic',
    title: { en: 'Who Never Replied?', mr: 'कोणी उत्तरच दिलं नाही?' },
    skill: 'LEFT JOIN & IS NULL',
    realLife: {
      place: 'wedding',
      title: { en: 'Who never replied to the invitation?', mr: 'आमंत्रणाला कोणी उत्तर दिलं नाही?' },
      story: {
        en: 'Same wedding. This time keep EVERY guest on the list and clip on cards where you have them. Guests with an empty space beside their name never replied. That empty space is NULL.',
        mr: 'तेच लग्न. या वेळी यादीतले सगळे पाहुणे ठेवा आणि जिथे कार्ड आहे तिथे लावा. ज्यांच्या नावापुढे जागा रिकामी आहे त्यांनी उत्तर दिलं नाही. ती रिकामी जागा म्हणजे NULL.',
      },
      scene: { type: 'match', leftTitle: { en: 'Guest list', mr: 'पाहुण्यांची यादी' }, rightTitle: { en: 'RSVP cards', mr: 'RSVP कार्ड' }, left: guests, right: rsvps, links: guestLinks, mode: 'left' },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'angry', text: { en: '*slams coffee* The warehouse swears it shipped EVERYTHING.', mr: '*कॉफी आपटतो* वेअरहाऊस शपथेवर सांगतंय की सगळं पाठवलं.' } },
        { who: 'sam', mood: 'worried', text: { en: 'Our dashboard says 41 orders never left. One of us is wrong.', mr: 'आपला डॅशबोर्ड म्हणतो 41 ऑर्डर्स गेल्याच नाहीत. आपल्यापैकी कोणीतरी चुकतंय.' } },
        { who: 'meera', mood: 'neutral', text: { en: "Don't argue. Query. {name}, find the orders with no shipment.", mr: 'वाद नको. क्वेरी लिहा. {name}, शिपमेंट नसलेल्या ऑर्डर्स शोध.' } },
      ],
      problem: { en: 'Missing records are invisible: no screen shows "the shipment that does not exist".', mr: 'गायब रेकॉर्ड्स दिसतच नाहीत: कोणतीही स्क्रीन "अस्तित्वात नसलेली शिपमेंट" दाखवत नाही.' },
      solution: { en: 'LEFT JOIN + IS NULL lists exactly what is missing. It is the most-used query in database testing.', mr: 'LEFT JOIN + IS NULL नेमकं काय गायब आहे ते दाखवतो. डेटाबेस टेस्टिंगमध्ये सर्वात जास्त वापरली जाणारी क्वेरी.' },
    },
    lesson: [
      { en: 'LEFT JOIN keeps EVERY row from the first (left) table and attaches matches from the second when they exist.', mr: 'LEFT JOIN पहिल्या (डाव्या) टेबलच्या सगळ्या rows ठेवतो आणि दुसऱ्या टेबलमधले जोडीदार असतील तर जोडतो.' },
      { en: 'Where there is no match, the second table\'s columns are empty. SQL calls "empty/unknown" NULL.', mr: 'जोडीदार नसेल तिथे दुसऱ्या टेबलचे columns रिकामे राहतात. SQL "रिकामं/अज्ञात" ला NULL म्हणतो.' },
      { en: 'Filter with IS NULL to keep only the rows that found no partner. Never use = NULL: NULL is never equal to anything.', mr: 'जोडीदार न मिळालेल्या rows ठेवायला IS NULL वापरा. = NULL कधीच वापरू नका: NULL कशाशीही समान नसतो.' },
    ],
    syntax: {
      template: 'SELECT a.id\nFROM table_a a\nLEFT JOIN table_b b ON b.a_id = a.id\nWHERE b.id IS NULL;',
      parts: [
        { code: 'LEFT JOIN', means: { en: 'keep all of table_a, attach b where possible', mr: 'table_a सगळं ठेवा, शक्य तिथे b जोडा' } },
        { code: 'WHERE b.id IS NULL', means: { en: 'keep only rows with no partner', mr: 'फक्त जोडीदार नसलेल्या rows ठेवा' } },
      ],
      example: [
        { code: 'SELECT g.name', note: { en: 'every guest on the list', mr: 'यादीतला प्रत्येक पाहुणा' } },
        { code: 'FROM guests g', note: { en: 'the guest list (LEFT table)', mr: 'पाहुण्यांची यादी (LEFT टेबल)' } },
        { code: 'LEFT JOIN rsvps r', note: { en: 'clip on cards where they exist', mr: 'असतील तिथे कार्ड लावा' } },
        { code: '  ON r.guest_id = g.id', note: { en: 'match card to guest', mr: 'कार्ड पाहुण्याशी जुळवा' } },
        { code: 'WHERE r.id IS NULL;', note: { en: 'only guests with no card', mr: 'फक्त कार्ड नसलेले पाहुणे' } },
      ],
      pitfall: { en: 'WHERE r.id = NULL returns nothing, ever. Use IS NULL.', mr: 'WHERE r.id = NULL कधीच काही देत नाही. IS NULL वापरा.' },
    },
    practice: {
      intro: { en: 'Find the missing orders.', mr: 'गायब ऑर्डर्स शोधा.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'List the id of every order that has NO matching shipment.', mr: 'ज्या ऑर्डरला एकही शिपमेंट नाही अशा प्रत्येक ऑर्डरचा id दाखवा.' },
          starter: 'SELECT o.id\nFROM orders o\nLEFT JOIN shipments s ON s.order_id = o.id\nWHERE ',
          expected: 'SELECT o.id FROM orders o LEFT JOIN shipments s ON s.order_id = o.id WHERE s.id IS NULL',
          hints: [
            { en: 'Orders with no shipment have empty (NULL) shipment columns.', mr: 'शिपमेंट नसलेल्या ऑर्डर्सचे shipment columns रिकामे (NULL) असतात.' },
            { en: 'Filter on a shipment column being NULL. IS NULL, not = NULL.', mr: 'shipment column NULL आहे यावर फिल्टर करा. IS NULL, = NULL नव्हे.' },
            { en: 'WHERE s.id IS ____', mr: 'WHERE s.id IS ____' },
            { en: 'SELECT o.id FROM orders o LEFT JOIN shipments s ON s.order_id = o.id WHERE s.id IS NULL;', mr: 'SELECT o.id FROM orders o LEFT JOIN shipments s ON s.order_id = o.id WHERE s.id IS NULL;' },
          ],
          visual: 'join',
          successLine: { en: '41 orders without a shipment. The dashboard was right.', mr: 'शिपमेंट नसलेल्या 41 ऑर्डर्स. डॅशबोर्ड बरोबर होता.' },
        },
        {
          kind: 'choice',
          prompt: { en: '3 of those 41 orders have status CANCELLED. Are those 3 bugs?', mr: 'त्या 41 पैकी 3 ऑर्डर्सचा status CANCELLED आहे. ते 3 बग्स आहेत का?' },
          options: [
            { en: 'Yes, all 41 are bugs', mr: 'हो, सगळ्या 41 बग्स आहेत' },
            { en: 'No: cancelled orders should never ship, so 38 are real bugs', mr: 'नाही: रद्द ऑर्डर्स पाठवायच्याच नसतात, त्यामुळे 38 खरे बग्स' },
            { en: 'We cannot tell', mr: 'सांगता येत नाही' },
          ],
          correct: [1],
          explain: { en: 'Check the business rule, not just the number. Cancelled orders are meant to stay unshipped.', mr: 'फक्त संख्या नाही, बिझनेस नियम तपासा. रद्द ऑर्डर्स पाठवल्या जात नाहीत.' },
          hints: [{ en: 'Should a cancelled order ever ship?', mr: 'रद्द झालेली ऑर्डर कधी पाठवायची असते का?' }],
          successLine: { en: 'Theo nods: "I\'d have reported all 41." You just earned his trust.', mr: 'थिओ मान हलवतो: "मी तर सगळ्या 41 रिपोर्ट केल्या असत्या." तू त्याचा विश्वास जिंकलीस.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Which filter finds rows with no match after a LEFT JOIN?', mr: 'LEFT JOIN नंतर जोडीदार नसलेल्या rows कोणता फिल्टर शोधतो?' },
        options: ['WHERE s.id = NULL', 'WHERE s.id IS NULL', "WHERE s.id = ''", 'WHERE s.id = 0'],
        answer: 1,
        explain: { en: 'NULL means unknown, so it never equals anything. Use IS NULL.', mr: 'NULL म्हणजे अज्ञात, तो कशाशीही समान नसतो. IS NULL वापरा.' },
      },
      {
        q: { en: 'LEFT JOIN keeps every row from...', mr: 'LEFT JOIN कोणत्या टेबलच्या सगळ्या rows ठेवतो?' },
        options: [
          { en: 'The right table', mr: 'उजवं टेबल' },
          { en: 'Both tables', mr: 'दोन्ही टेबल्स' },
          { en: 'The left (first) table', mr: 'डावं (पहिलं) टेबल' },
          { en: 'Neither', mr: 'कोणतंच नाही' },
        ],
        answer: 2,
        explain: { en: 'Every guest stays, card or no card.', mr: 'कार्ड असो वा नसो, प्रत्येक पाहुणा राहतो.' },
      },
      {
        q: { en: 'What does this find?', mr: 'ही क्वेरी काय शोधते?' },
        code: 'SELECT c.name\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id IS NULL;',
        options: [
          { en: 'Customers with at least one order', mr: 'किमान एक ऑर्डर असलेले ग्राहक' },
          { en: 'Customers who never ordered', mr: 'कधीच ऑर्डर न केलेले ग्राहक' },
          { en: 'Orders without customers', mr: 'ग्राहक नसलेल्या ऑर्डर्स' },
          { en: 'Every customer twice', mr: 'प्रत्येक ग्राहक दोनदा' },
        ],
        answer: 1,
        explain: { en: 'Customers are the "guest list", orders are the "cards".', mr: 'ग्राहक म्हणजे "पाहुण्यांची यादी", ऑर्डर्स म्हणजे "कार्ड".' },
      },
      {
        q: { en: 'As a tester, after finding 41 orphan rows, what do you check next?', mr: 'टेस्टर म्हणून 41 orphan rows सापडल्यानंतर पुढे काय तपासाल?' },
        options: [
          { en: 'Nothing, report all 41', mr: 'काही नाही, सगळ्या 41 रिपोर्ट करा' },
          { en: 'The business rules (status, dates) to separate real bugs from valid cases', mr: 'बिझनेस नियम (status, तारखा) तपासून खरे बग्स वेगळे करा' },
          { en: 'Delete them', mr: 'त्या डिलीट करा' },
          { en: 'Restart the database', mr: 'डेटाबेस रीस्टार्ट करा' },
        ],
        answer: 1,
        explain: { en: 'Numbers need context. That separates a good DB tester from a query writer.', mr: 'संख्येला संदर्भ हवा. यामुळेच चांगला DB टेस्टर फक्त क्वेरी लिहिणाऱ्यापेक्षा वेगळा ठरतो.' },
      },
    ],
    recap: { line: { en: 'LEFT JOIN + IS NULL = who never replied (what is missing).', mr: 'LEFT JOIN + IS NULL = कोणी उत्तर दिलं नाही (काय गायब आहे).' }, icon: '💌' },
    outro: [{ who: 'gremlin', mood: 'angry', text: { en: '>> 38. fine. but do you know WHY? ⌁⌁⌁', mr: '>> 38. ठीक. पण का, ते माहितीये? ⌁⌁⌁' } }],
  },

  // ───────────────────────── 1.6 BOSS
  {
    id: 'a1-6',
    code: '1.6',
    level: 'basic',
    title: { en: 'Boss: The Warehouse Gap', mr: 'बॉस: वेअरहाऊसमधली फट' },
    skill: 'Root-cause investigation',
    isBoss: true,
    realLife: {
      place: 'warehouse',
      title: { en: 'A parcel that never leaves the shop', mr: 'दुकानातून कधीच न निघणारं पार्सल' },
      story: {
        en: 'You pay at the shop. The shop sends your order to the warehouse. But if one item is out of stock, a lazy clerk silently drops the whole order in a drawer. Nobody is told.',
        mr: 'तुम्ही दुकानात पैसे भरता. दुकान ऑर्डर वेअरहाऊसला पाठवतं. पण एखादी वस्तू संपली असेल तर आळशी कारकून संपूर्ण ऑर्डर गुपचूप ड्रॉवरमध्ये टाकतो. कोणालाच कळत नाही.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🛒', label: 'Customer orders', mr: 'ग्राहक ऑर्डर करतो' },
          { icon: '💳', label: 'Payment taken', mr: 'पैसे घेतले' },
          { icon: '🗄️', label: 'Warehouse sync', mr: 'वेअरहाऊस सिंक' },
          { icon: '🚚', label: 'Shipped', mr: 'पाठवलं' },
        ],
        breakAt: 2,
        breakNote: { en: 'One item out of stock? The whole order goes in the drawer. Silently.', mr: 'एक वस्तू संपली? संपूर्ण ऑर्डर ड्रॉवरमध्ये. गुपचूप.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'gremlin', mood: 'smug', text: { en: '>> 38 orders, paid and forgotten. find my trick or the CEO hears about it. ⌁', mr: '>> 38 ऑर्डर्स, पैसे भरलेल्या आणि विसरलेल्या. माझी युक्ती शोध, नाहीतर CEO ला कळेल. ⌁' } },
        { who: 'meera', mood: 'worried', text: { en: 'No step-by-step help this time, {name}. Only 2 hints per step.', mr: 'या वेळी टप्प्याटप्प्याने मदत नाही, {name}. प्रत्येक स्टेपला फक्त 2 हिंट्स.' } },
        { who: 'rex', mood: 'neutral', text: { en: "For what it's worth... I think you can do this.", mr: 'खरं सांगू... मला वाटतं तू हे करू शकतेस.' } },
      ],
      problem: { en: 'We know WHAT is broken (38 stuck orders) but not WHY. Without the root cause, the fix is a guess.', mr: 'काय बिघडलंय (38 अडकलेल्या ऑर्डर्स) ते माहितीये, पण का ते नाही. मूळ कारणाशिवाय उपाय म्हणजे अंदाज.' },
      solution: { en: 'Combine everything: narrow the suspects with JOINs, find the pattern with GROUP BY, confirm with WHERE, then write a clear bug report.', mr: 'सगळं एकत्र वापरा: JOIN ने संशयित कमी करा, GROUP BY ने पॅटर्न शोधा, WHERE ने खात्री करा, मग स्पष्ट बग रिपोर्ट लिहा.' },
    },
    lesson: [
      { en: 'Real investigations loop: find the problem, look for a pattern, confirm the cause, report it.', mr: 'खरा तपास असा फिरतो: समस्या शोधा, पॅटर्न पाहा, कारणाची खात्री करा, रिपोर्ट करा.' },
      { en: 'A pattern is something ALL the broken rows share and the healthy rows do not.', mr: 'पॅटर्न म्हणजे अशी गोष्ट जी सगळ्या बिघडलेल्या rows मध्ये आहे आणि चांगल्या rows मध्ये नाही.' },
      { en: 'A great bug title says what happens, when it happens, and how big it is. No blame, no drama.', mr: 'चांगल्या बग टायटलमध्ये काय होतं, कधी होतं आणि किती मोठं आहे हे असतं. दोषारोप नाही, नाटक नाही.' },
    ],
    syntax: {
      template: 'SELECT ...\nFROM orders o\nLEFT JOIN shipments s ON s.order_id = o.id\nWHERE s.id IS NULL AND o.status = \'PAID\';',
      parts: [
        { code: 'LEFT JOIN ... IS NULL', means: { en: 'find what is missing', mr: 'काय गायब आहे ते शोधा' } },
        { code: "AND o.status = 'PAID'", means: { en: 'narrow to the real suspects', mr: 'खरे संशयित निवडा' } },
        { code: 'GROUP BY ... COUNT', means: { en: 'look for what they have in common', mr: 'त्यांच्यात सामायिक काय ते पाहा' } },
      ],
      example: [
        { code: 'SELECT p.name, COUNT(*)', note: { en: 'how often each product appears', mr: 'प्रत्येक product किती वेळा दिसतो' } },
        { code: 'FROM order_items i', note: { en: 'items inside orders', mr: 'ऑर्डरमधल्या वस्तू' } },
        { code: 'JOIN products p ON p.id = i.product_id', note: { en: 'product names', mr: 'product ची नावं' } },
        { code: 'GROUP BY p.name;', note: { en: 'one pile per product', mr: 'प्रत्येक product चा ढीग' } },
      ],
    },
    practice: {
      intro: { en: 'Defeat the Gremlin. Each step drains its health.', mr: 'ग्रेमलिनला हरवा. प्रत्येक स्टेप त्याची ताकद कमी करते.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'Step 1: Find the ids of PAID orders that have no shipment.', mr: 'स्टेप 1: शिपमेंट नसलेल्या PAID ऑर्डर्सचे id शोधा.' },
          expected: "SELECT o.id FROM orders o LEFT JOIN shipments s ON s.order_id = o.id WHERE s.id IS NULL AND o.status = 'PAID'",
          hints: [
            { en: "Start from last lesson's query.", mr: 'मागच्या धड्यातल्या क्वेरीपासून सुरुवात करा.' },
            { en: "Add a second rule with AND: status = 'PAID'.", mr: "AND ने दुसरा नियम जोडा: status = 'PAID'." },
          ],
          successLine: { en: '38 suspects. The Gremlin flickers.', mr: '38 संशयित. ग्रेमलिन थरथरतो.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Step 2: Investigate order_items for those stuck orders. Which product appears in EVERY stuck order?', mr: 'स्टेप 2: अडकलेल्या ऑर्डर्सचे order_items तपासा. कोणता product प्रत्येक अडकलेल्या ऑर्डरमध्ये आहे?' },
          sandbox: true,
          sandboxStarter: 'SELECT *\nFROM order_items\nLIMIT 10',
          options: ['Ceramic Mug', 'Sproutling Plant Kit', 'Yoga Mat', 'Terracotta Pot'],
          correct: [1],
          explain: { en: 'Every one of the 38 stuck orders contains the Sproutling Plant Kit.', mr: '38 पैकी प्रत्येक अडकलेल्या ऑर्डरमध्ये Sproutling Plant Kit आहे.' },
          hints: [
            { en: 'Join order_items and products to PAID orders, then GROUP BY product name and COUNT.', mr: 'order_items आणि products ला PAID ऑर्डर्सशी जोडा, मग product name ने GROUP BY करून COUNT करा.' },
            { en: "SELECT p.name, COUNT(*) FROM order_items i JOIN products p ON p.id = i.product_id JOIN orders o ON o.id = i.order_id WHERE o.status = 'PAID' GROUP BY p.name ORDER BY 2 DESC", mr: "SELECT p.name, COUNT(*) FROM order_items i JOIN products p ON p.id = i.product_id JOIN orders o ON o.id = i.order_id WHERE o.status = 'PAID' GROUP BY p.name ORDER BY 2 DESC" },
          ],
          successLine: { en: 'The same product every time. The Gremlin hisses.', mr: 'प्रत्येक वेळी तोच product. ग्रेमलिन फुसफुसतो.' },
        },
        {
          kind: 'sql',
          prompt: { en: 'Step 3: Confirm the root cause. Show the name and stock of the Sproutling Plant Kit.', mr: 'स्टेप 3: मूळ कारणाची खात्री करा. Sproutling Plant Kit चं name आणि stock दाखवा.' },
          expected: "SELECT name, stock FROM products WHERE name = 'Sproutling Plant Kit'",
          hints: [
            { en: 'A simple WHERE on products.', mr: 'products वर साधा WHERE.' },
            { en: "WHERE name = 'Sproutling Plant Kit'", mr: "WHERE name = 'Sproutling Plant Kit'" },
          ],
          successLine: { en: 'Stock: 0. The warehouse sync silently skips any order with an out-of-stock item.', mr: 'Stock: 0. वेअरहाऊस सिंक संपलेली वस्तू असलेली कोणतीही ऑर्डर गुपचूप सोडून देतं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Step 4: Pick the best bug report title.', mr: 'स्टेप 4: सर्वोत्तम बग रिपोर्ट टायटल निवडा.' },
          options: [
            'Orders broken!!!',
            'Warehouse is slow',
            'Paid orders containing an out-of-stock item are never shipped (38 orders, no error shown)',
            'Sproutling Plant Kit is bad',
          ],
          correct: [2],
          explain: { en: 'It says WHAT happens, WHEN, and HOW BIG. A developer can act on it without asking anything.', mr: 'त्यात काय होतं, कधी आणि किती मोठं हे आहे. डेव्हलपर काहीही न विचारता काम सुरू करू शकतो.' },
          hints: [{ en: 'Which title could a developer act on without asking you a single question?', mr: 'कोणत्या टायटलवर डेव्हलपर एकही प्रश्न न विचारता काम करू शकेल?' }],
          successLine: { en: 'Theo goes pale: "That\'s my sync job. Fixing it now."', mr: 'थिओचा चेहरा पडतो: "तो माझा सिंक जॉब आहे. आत्ताच दुरुस्त करतो."' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What makes a strong bug report title?', mr: 'चांगल्या बग रिपोर्ट टायटलमध्ये काय असतं?' },
        options: [
          { en: 'Lots of exclamation marks', mr: 'भरपूर उद्गारचिन्हं' },
          { en: 'What happens + when + how big', mr: 'काय होतं + कधी + किती मोठं' },
          { en: 'Who caused it', mr: 'कोणामुळे झालं' },
          { en: 'Just the screen name', mr: 'फक्त स्क्रीनचं नाव' },
        ],
        answer: 1,
        explain: { en: 'Facts, not feelings.', mr: 'भावना नाही, तथ्यं.' },
      },
      {
        q: { en: 'A "pattern" in a root-cause hunt is...', mr: 'मूळ कारण शोधताना "पॅटर्न" म्हणजे...' },
        options: [
          { en: 'Something all broken rows share and healthy rows do not', mr: 'जे सगळ्या बिघडलेल्या rows मध्ये आहे आणि चांगल्यांमध्ये नाही' },
          { en: 'The first row of the table', mr: 'टेबलची पहिली row' },
          { en: 'A random sample', mr: 'रँडम नमुना' },
          { en: 'The most expensive product', mr: 'सर्वात महाग product' },
        ],
        answer: 0,
        explain: { en: 'Comparing broken vs healthy rows is the core detective move.', mr: 'बिघडलेल्या आणि चांगल्या rows ची तुलना हेच गुप्तहेराचं मुख्य तंत्र.' },
      },
      {
        q: { en: 'Which query lists PAID orders with no shipment?', mr: 'शिपमेंट नसलेल्या PAID ऑर्डर्स कोणती क्वेरी दाखवते?' },
        options: [
          "SELECT id FROM orders WHERE status = 'PAID'",
          "SELECT o.id FROM orders o JOIN shipments s ON s.order_id = o.id WHERE o.status = 'PAID'",
          "SELECT o.id FROM orders o LEFT JOIN shipments s ON s.order_id = o.id WHERE s.id IS NULL AND o.status = 'PAID'",
          "SELECT id FROM shipments WHERE status = 'PAID'",
        ],
        answer: 2,
        explain: { en: 'LEFT JOIN + IS NULL finds the missing shipments; AND narrows to PAID.', mr: 'LEFT JOIN + IS NULL गायब शिपमेंट्स शोधतो; AND फक्त PAID ठेवतो.' },
      },
      {
        q: { en: 'The fix is deployed. What should the tester do?', mr: 'उपाय डिप्लॉय झाला. टेस्टरने काय करावं?' },
        options: [
          { en: 'Close the bug immediately', mr: 'लगेच बग बंद करावा' },
          { en: 'Re-run the same queries and confirm 0 stuck PAID orders', mr: 'त्याच क्वेरीज पुन्हा चालवून 0 अडकलेल्या PAID ऑर्डर्स आहेत याची खात्री करावी' },
          { en: 'Ask the developer if it works', mr: 'डेव्हलपरला विचारावं की चालतंय का' },
          { en: 'Nothing', mr: 'काहीच नाही' },
        ],
        answer: 1,
        explain: { en: 'Your queries become the re-test. Later you will automate exactly this.', mr: 'तुमच्या क्वेरीज म्हणजेच री-टेस्ट. पुढे नेमकं हेच ऑटोमेट करशील.' },
      },
    ],
    recap: { line: { en: 'Find it, find the pattern, confirm the cause, report it clearly.', mr: 'शोधा, पॅटर्न ओळखा, कारणाची खात्री करा, स्पष्ट रिपोर्ट करा.' }, icon: '🕵️' },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: '>> GLITCH. you got lucky AGAIN. ⌁⌁⌁', mr: '>> GLITCH. पुन्हा नशीब. ⌁⌁⌁' } },
      { who: 'meera', mood: 'happy', text: { en: 'Case closed, {name}. Rank up: Data Detective. The Incident Archive is open on the map.', mr: 'केस बंद, {name}. नवीन रँक: Data Detective. नकाशावर Incident Archive उघडलंय.' } },
    ],
  },
]
