import type { Lesson } from './types.ts'

// "Start here": no prior knowledge assumed. Explained the way you would explain it to a family member.

export const startLessons: Lesson[] = [
  // ───────────────────────── 0.1 What is a database?
  {
    id: 's0-1',
    code: '0.1',
    level: 'basic',
    title: { en: 'Start Here: What Is a Database?', mr: 'सुरुवात: डेटाबेस म्हणजे काय?' },
    skill: 'Data, tables & databases',
    syntaxPlain: true,
    realLife: {
      place: 'shop',
      title: { en: 'The kirana shop registers', mr: 'किराणा दुकानाच्या वह्या' },
      story: {
        en: 'Ramesh runs a kirana shop. At first he wrote everything on loose bills, and they got lost. Now he keeps three registers: one for customers, one for stock, one for udhaar (credit). All three sit in one cupboard. When someone asks "how much does Mrs. Joshi owe?", he opens the right register and answers in seconds.',
        mr: 'रमेशचं किराणा दुकान आहे. सुरुवातीला तो सगळं सुट्ट्या बिलांवर लिहायचा, आणि ती हरवायची. आता तो तीन वह्या ठेवतो: एक ग्राहकांची, एक मालाची, एक उधारीची. तिन्ही एकाच कपाटात. कोणी विचारलं "जोशी काकूंची किती उधारी आहे?", तर तो योग्य वही उघडून काही सेकंदांत सांगतो.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🧾', label: 'Loose bills (data)', mr: 'सुट्टी बिलं (डेटा)' },
          { icon: '📒', label: 'Registers (tables)', mr: 'वह्या (टेबल्स)' },
          { icon: '🗄️', label: 'Cupboard (database)', mr: 'कपाट (डेटाबेस)' },
          { icon: '⚡', label: 'Answers in seconds', mr: 'काही सेकंदांत उत्तर' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'meera', mood: 'happy', text: { en: 'Before any SQL, one simple idea, {name}. Every app you have ever tested keeps its information somewhere.', mr: 'SQL च्या आधी एक सोपी कल्पना, {name}. तू आजवर तपासलेलं प्रत्येक ॲप आपली माहिती कुठेतरी ठेवतं.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'At ShopSprout that is 60 customers, 24 products and 300 orders a month. Paper registers would fill a room.', mr: 'ShopSprout मध्ये 60 ग्राहक, 24 products आणि महिन्याला 300 ऑर्डर्स आहेत. कागदी वह्यांनी एक खोली भरेल.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'So it lives in a database: Ramesh\'s cupboard, but on a computer, and it never loses a page.', mr: 'म्हणून ती डेटाबेसमध्ये असते: रमेशचं कपाट, पण संगणकावर, आणि एकही पान हरवत नाही.' } },
      ],
      problem: { en: 'Information scattered on screens, spreadsheets and emails is easy to lose, hard to search and impossible to trust.', mr: 'स्क्रीन, स्प्रेडशीट आणि ईमेलमध्ये विखुरलेली माहिती हरवायला सोपी, शोधायला कठीण आणि भरवसा ठेवायला अशक्य असते.' },
      solution: { en: 'A database keeps information in neat tables, like registers in one cupboard. Each table holds one kind of thing, so any question can be answered quickly.', mr: 'डेटाबेस माहिती व्यवस्थित टेबल्समध्ये ठेवतो, एका कपाटातल्या वह्यांसारखी. प्रत्येक टेबलमध्ये एकाच प्रकारची माहिती, त्यामुळे कोणत्याही प्रश्नाचं उत्तर लवकर मिळतं.' },
    },
    lesson: [
      { en: 'Data is just information: a name, a price, a date. A table is a register for one kind of thing, like customers.', mr: 'डेटा म्हणजे फक्त माहिती: नाव, किंमत, तारीख. टेबल म्हणजे एकाच प्रकारच्या गोष्टीची वही, जसे ग्राहक.' },
      { en: 'Each row is one entry (one customer). Each column is one detail written for every entry (name, city, phone).', mr: 'प्रत्येक row म्हणजे एक नोंद (एक ग्राहक). प्रत्येक column म्हणजे प्रत्येक नोंदीसाठी लिहिलेली एक माहिती (नाव, शहर, फोन).' },
      { en: 'A database is the cupboard: many related tables kept together. Tables are kept separate so nothing is written twice.', mr: 'डेटाबेस म्हणजे कपाट: एकमेकांशी संबंधित अनेक टेबल्स एकत्र. काहीही दोनदा लिहू नये म्हणून टेबल्स वेगळी ठेवतात.' },
    ],
    syntax: {
      template: 'table: customers\n┌────┬─────────────┬──────┐\n│ id │ name        │ city │   ← columns (details)\n├────┼─────────────┼──────┤\n│ 1  │ Asha Patil  │ Pune │   ← one row = one customer\n│ 2  │ Rohan Khan  │ Delhi│\n└────┴─────────────┴──────┘',
      parts: [
        { code: 'table', means: { en: 'a register for one kind of thing', mr: 'एका प्रकारच्या गोष्टीची वही' } },
        { code: 'row', means: { en: 'one entry: one customer, one order', mr: 'एक नोंद: एक ग्राहक, एक ऑर्डर' } },
        { code: 'column', means: { en: 'one detail for every row: name, city', mr: 'प्रत्येक row ची एक माहिती: नाव, शहर' } },
        { code: 'database', means: { en: 'the cupboard holding all the tables', mr: 'सगळी टेबल्स ठेवणारं कपाट' } },
      ],
      example: [
        { code: 'customers   = who buys', note: { en: 'like Ramesh\'s customer register', mr: 'रमेशच्या ग्राहक वहीसारखं' } },
        { code: 'products    = what we sell', note: { en: 'the stock register', mr: 'मालाची वही' } },
        { code: 'orders      = who bought what, and when', note: { en: 'the sales register', mr: 'विक्रीची वही' } },
        { code: 'shipments   = when it left the warehouse', note: { en: 'the delivery register', mr: 'डिलिव्हरीची वही' } },
      ],
      pitfall: { en: 'A database is not one giant spreadsheet. It is many small tables, each with one job.', mr: 'डेटाबेस म्हणजे एक मोठी स्प्रेडशीट नाही. ती अनेक छोटी टेबल्स आहेत, प्रत्येकाचं एक काम.' },
    },
    practice: {
      intro: { en: 'No typing needed yet. Look and answer.', mr: 'अजून टाइप करायची गरज नाही. पाहा आणि उत्तर द्या.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'Click Run to open the real customers table. How many columns does it have?', mr: 'खरं customers टेबल उघडण्यासाठी Run दाबा. त्यात किती columns आहेत?' },
          sandbox: true,
          sandboxStarter: 'SELECT *\nFROM customers\nLIMIT 5',
          options: ['4', '5', '7', '60'],
          correct: [2],
          explain: { en: 'id, name, city, joined_on, email, phone and alt_phone: 7 details for every customer.', mr: 'id, name, city, joined_on, email, phone आणि alt_phone: प्रत्येक ग्राहकाच्या 7 माहिती.' },
          hints: [{ en: 'Count the headings across the top of the result.', mr: 'निकालाच्या वरच्या शीर्षकांची संख्या मोजा.' }],
          successLine: { en: 'You just read a real database table.', mr: 'तुम्ही नुकतंच खरं डेटाबेस टेबल वाचलं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'In the customers table, one customer is one...', mr: 'customers टेबलमध्ये एक ग्राहक म्हणजे एक...' },
          options: [{ en: 'row', mr: 'row (ओळ)' }, { en: 'column', mr: 'column (स्तंभ)' }, { en: 'table', mr: 'टेबल' }, { en: 'database', mr: 'डेटाबेस' }],
          correct: [0],
          explain: { en: 'One entry in the register = one row.', mr: 'वहीतली एक नोंद = एक row.' },
          hints: [{ en: 'Think of one line in Ramesh\'s register.', mr: 'रमेशच्या वहीतली एक ओळ आठवा.' }],
        },
        {
          kind: 'choice',
          prompt: { en: 'Which table would store the date an order left the warehouse?', mr: 'ऑर्डर वेअरहाऊसमधून कधी निघाली ही तारीख कोणत्या टेबलमध्ये असेल?' },
          options: ['customers', 'products', 'shipments', 'payments'],
          correct: [2],
          explain: { en: 'Each table has one job. Leaving the warehouse is a shipment.', mr: 'प्रत्येक टेबलचं एक काम. वेअरहाऊसमधून निघणं म्हणजे shipment.' },
          hints: [{ en: 'Which register is about deliveries?', mr: 'कोणती वही डिलिव्हरीबद्दल आहे?' }],
        },
      ],
    },
    exam: [
      {
        q: { en: 'A database is...', mr: 'डेटाबेस म्हणजे...' },
        options: [
          { en: 'A collection of related tables', mr: 'संबंधित टेबल्सचा संग्रह' },
          { en: 'A single long list', mr: 'एक लांब यादी' },
          { en: 'A website', mr: 'एक वेबसाइट' },
          { en: 'A type of computer', mr: 'एक प्रकारचा संगणक' },
        ],
        answer: 0,
        explain: { en: 'The cupboard holding many registers.', mr: 'अनेक वह्या ठेवणारं कपाट.' },
      },
      {
        q: { en: 'In a table, a column is...', mr: 'टेबलमध्ये column म्हणजे...' },
        options: [
          { en: 'One complete entry', mr: 'एक पूर्ण नोंद' },
          { en: 'One kind of detail written for every entry', mr: 'प्रत्येक नोंदीसाठी लिहिलेली एक प्रकारची माहिती' },
          { en: 'The whole table', mr: 'संपूर्ण टेबल' },
          { en: 'A password', mr: 'पासवर्ड' },
        ],
        answer: 1,
        explain: { en: 'Name, city, phone: each is a column.', mr: 'नाव, शहर, फोन: प्रत्येक एक column.' },
      },
      {
        q: { en: 'Which of these is a ROW in the products table?', mr: 'यापैकी products टेबलमधली ROW कोणती?' },
        options: ['price', 'Ceramic Mug · Kitchen · 349', 'products', 'stock'],
        answer: 1,
        explain: { en: 'A row is one complete product with all its details.', mr: 'Row म्हणजे सगळ्या माहितीसह एक पूर्ण product.' },
      },
      {
        q: { en: 'Why is data split into several tables?', mr: 'डेटा अनेक टेबल्समध्ये का विभागतात?' },
        options: [
          { en: 'To make it look bigger', mr: 'मोठा दिसावा म्हणून' },
          { en: 'So nothing is written twice and each table has one job', mr: 'काहीही दोनदा लिहू नये आणि प्रत्येक टेबलचं एक काम असावं म्हणून' },
          { en: 'Because computers are small', mr: 'संगणक लहान असतात म्हणून' },
          { en: 'It is not', mr: 'विभागत नाहीत' },
        ],
        answer: 1,
        explain: { en: 'Like separate registers for customers, stock and credit.', mr: 'ग्राहक, माल आणि उधारीच्या वेगळ्या वह्यांसारखं.' },
      },
    ],
    recap: { line: { en: 'Table = a register, row = one entry, column = one detail, database = the cupboard.', mr: 'टेबल = वही, row = एक नोंद, column = एक माहिती, डेटाबेस = कपाट.' }, icon: '🗄️' },
  },

  // ───────────────────────── 0.2 What is SQL?
  {
    id: 's0-2',
    code: '0.2',
    level: 'basic',
    title: { en: 'Start Here: What Is SQL, and Why Do Testers Use It?', mr: 'सुरुवात: SQL म्हणजे काय, आणि टेस्टर्स ते का वापरतात?' },
    skill: 'What SQL is for',
    realLife: {
      place: 'station',
      title: { en: 'The railway enquiry counter', mr: 'रेल्वे चौकशी खिडकी' },
      story: {
        en: 'At Pune station you ask the enquiry clerk: "Trains to Mumbai, after 6 pm, today?" You do not search the timetable yourself. You ask a clear question in a familiar shape: what, where, which ones. The clerk checks the big timetable register and reads out only the matching trains.',
        mr: 'पुणे स्टेशनवर तुम्ही चौकशी खिडकीवर विचारता: "आज संध्याकाळी 6 नंतर मुंबईला जाणाऱ्या गाड्या?" तुम्ही स्वतः वेळापत्रक शोधत नाही. तुम्ही ओळखीच्या पद्धतीने स्पष्ट प्रश्न विचारता: काय, कुठून, कोणत्या. कारकून मोठं वेळापत्रक तपासतो आणि फक्त जुळणाऱ्या गाड्या सांगतो.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🙋', label: 'Ask a clear question', mr: 'स्पष्ट प्रश्न विचारा' },
          { icon: '🧑‍💼', label: 'Clerk checks the timetable', mr: 'कारकून वेळापत्रक पाहतो' },
          { icon: '📋', label: 'Keeps matching trains', mr: 'जुळणाऱ्या गाड्या निवडतो' },
          { icon: '🎫', label: 'Answer in seconds', mr: 'काही सेकंदांत उत्तर' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'rex', mood: 'smug', text: { en: 'Manual testers only see screens. The interesting bugs hide underneath.', mr: 'मॅन्युअल टेस्टर्सना फक्त स्क्रीन दिसतात. खरे बग्स खाली लपलेले असतात.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'Every screen you test just shows data from the database. SQL lets you check the truth behind the screen, {name}.', mr: 'तू तपासतेस ती प्रत्येक स्क्रीन फक्त डेटाबेसमधला डेटा दाखवते. SQL ने तू स्क्रीनमागचं सत्य तपासू शकतेस, {name}.' } },
        { who: 'meera', mood: 'happy', text: { en: 'And asking questions is safe. A question (SELECT) only reads. It never changes or deletes anything.', mr: 'आणि प्रश्न विचारणं सुरक्षित आहे. प्रश्न (SELECT) फक्त वाचतो. तो काहीही बदलत किंवा डिलीट करत नाही.' } },
      ],
      problem: { en: 'A screen can say "Delivered" while the database says otherwise. Screens show 10 rows at a time and never show what is missing.', mr: 'स्क्रीन "Delivered" म्हणू शकते, पण डेटाबेस वेगळंच सांगू शकतो. स्क्रीन एका वेळी 10 rows दाखवते आणि काय गायब आहे ते कधीच दाखवत नाही.' },
      solution: { en: 'SQL asks the database directly. It checks thousands of rows in a second and finds missing, duplicate or wrong data. That is exactly what DB testers are hired for.', mr: 'SQL थेट डेटाबेसला विचारतं. ते एका सेकंदात हजारो rows तपासतं आणि गायब, डुप्लिकेट किंवा चुकीचा डेटा शोधतं. DB टेस्टर्सना नेमकं याच कामासाठी घेतात.' },
    },
    lesson: [
      { en: 'SQL means Structured Query Language. A query is simply a question. People say "S-Q-L" or "sequel". Both are fine.', mr: 'SQL म्हणजे Structured Query Language. Query म्हणजे फक्त प्रश्न. लोक "S-Q-L" किंवा "सीक्वल" म्हणतात. दोन्ही बरोबर.' },
      { en: 'Every question has the same shape as the enquiry counter: what you want (SELECT), from which table (FROM), and which ones (WHERE).', mr: 'प्रत्येक प्रश्नाची रचना चौकशी खिडकीसारखीच: काय हवं (SELECT), कोणत्या टेबलमधून (FROM), आणि कोणते (WHERE).' },
      { en: 'Testers use SQL to check that screens match stored data, find missing or duplicate records, prepare test data, and verify data after a release. It works almost the same in Postgres, MySQL, Oracle and SQL Server.', mr: 'टेस्टर्स SQL वापरतात: स्क्रीन आणि साठवलेला डेटा जुळतो का तपासायला, गायब किंवा डुप्लिकेट रेकॉर्ड शोधायला, टेस्ट डेटा तयार करायला, आणि रिलीजनंतर डेटा तपासायला. Postgres, MySQL, Oracle आणि SQL Server मध्ये ते जवळजवळ सारखंच चालतं.' },
    ],
    syntax: {
      template: 'SELECT what_you_want\nFROM which_table\nWHERE which_ones;',
      parts: [
        { code: 'SELECT', means: { en: '"show me..."', mr: '"मला दाखवा..."' } },
        { code: 'FROM', means: { en: '"...from this table"', mr: '"...या टेबलमधून"' } },
        { code: 'WHERE', means: { en: '"...only the ones where this is true"', mr: '"...फक्त ज्यांच्यासाठी हे खरं आहे"' } },
        { code: ';', means: { en: 'the question mark at the end of the question', mr: 'प्रश्नाच्या शेवटचं प्रश्नचिन्ह' } },
      ],
      example: [
        { code: 'SELECT name', note: { en: 'show me the names...', mr: 'मला नावं दाखवा...' } },
        { code: 'FROM customers', note: { en: '...from the customers table...', mr: '...customers टेबलमधून...' } },
        { code: "WHERE city = 'Pune';", note: { en: '...only for people in Pune.', mr: '...फक्त पुण्यातल्या लोकांची.' } },
      ],
      pitfall: { en: 'SQL words are not case-sensitive (select = SELECT). We write them in capitals only so they stand out.', mr: 'SQL शब्द लहान-मोठ्या अक्षरांत फरक करत नाहीत (select = SELECT). ते उठून दिसावेत म्हणून आपण मोठ्या अक्षरांत लिहितो.' },
    },
    practice: {
      intro: { en: 'Your first real question to a database. Just click Run.', mr: 'डेटाबेसला तुमचा पहिला खरा प्रश्न. फक्त Run दाबा.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'Click Run. How many customers live in Pune?', mr: 'Run दाबा. पुण्यात किती ग्राहक राहतात?' },
          sandbox: true,
          sandboxStarter: "SELECT name, city\nFROM customers\nWHERE city = 'Pune'",
          options: ['6', '10', '12', '60'],
          correct: [1],
          explain: { en: 'The row count badge says 10. You asked; the database answered.', mr: 'row count दाखवतो 10. तुम्ही विचारलं; डेटाबेसने उत्तर दिलं.' },
          hints: [{ en: 'Look at the number next to "rows" above the result.', mr: 'निकालाच्या वर "rows" शेजारचा आकडा पाहा.' }],
          successLine: { en: 'Your first SQL query. Welcome to database testing.', mr: 'तुमची पहिली SQL क्वेरी. डेटाबेस टेस्टिंगमध्ये स्वागत.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Which of these is a tester\'s job with SQL?', mr: 'यापैकी SQL ने करायचं टेस्टरचं काम कोणतं?' },
          options: [
            { en: 'Change the website colours', mr: 'वेबसाइटचे रंग बदलणं' },
            { en: 'Check that the order status on screen matches the database', mr: 'स्क्रीनवरचा ऑर्डर status डेटाबेसशी जुळतो का तपासणं' },
            { en: 'Write marketing emails', mr: 'मार्केटिंग ईमेल लिहिणं' },
            { en: 'Repair the server', mr: 'सर्व्हर दुरुस्त करणं' },
          ],
          correct: [1],
          explain: { en: 'Comparing the screen with the stored data is the heart of DB testing.', mr: 'स्क्रीन आणि साठवलेल्या डेटाची तुलना हे DB टेस्टिंगचं हृदय आहे.' },
          hints: [{ en: 'Which one compares a screen with stored data?', mr: 'कोणतं काम स्क्रीनची साठवलेल्या डेटाशी तुलना करतं?' }],
        },
        {
          kind: 'choice',
          prompt: { en: 'Does a SELECT query change any data?', mr: 'SELECT क्वेरी कोणताही डेटा बदलते का?' },
          options: [{ en: 'Yes, it removes rows', mr: 'हो, ती rows काढते' }, { en: 'No, it only reads', mr: 'नाही, ती फक्त वाचते' }, { en: 'Only the first time', mr: 'फक्त पहिल्यांदा' }],
          correct: [1],
          explain: { en: 'SELECT is a question. Asking never changes the answer sheet.', mr: 'SELECT म्हणजे प्रश्न. प्रश्न विचारल्याने उत्तरपत्रिका बदलत नाही.' },
          hints: [{ en: 'Does asking the enquiry clerk change the timetable?', mr: 'चौकशी खिडकीवर विचारल्याने वेळापत्रक बदलतं का?' }],
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does SQL stand for?', mr: 'SQL चा पूर्ण अर्थ काय?' },
        options: ['Structured Query Language', 'Simple Question List', 'System Quality Level', 'Server Query Link'],
        answer: 0,
        explain: { en: 'Structured Query Language: a structured way to ask questions.', mr: 'Structured Query Language: प्रश्न विचारण्याची रचनाबद्ध पद्धत.' },
      },
      {
        q: { en: 'A "query" is...', mr: '"Query" म्हणजे...' },
        options: [{ en: 'A question you ask the database', mr: 'डेटाबेसला विचारलेला प्रश्न' }, { en: 'A type of table', mr: 'टेबलचा प्रकार' }, { en: 'An error', mr: 'एरर' }, { en: 'A password', mr: 'पासवर्ड' }],
        answer: 0,
        explain: { en: 'Query = question.', mr: 'Query = प्रश्न.' },
      },
      {
        q: { en: 'Read this query in plain words:', mr: 'ही क्वेरी साध्या शब्दांत वाचा:' },
        code: 'SELECT name FROM products WHERE price < 500;',
        options: [
          { en: 'Show the names of products that cost less than 500', mr: '500 पेक्षा कमी किमतीच्या products ची नावं दाखवा' },
          { en: 'Delete products under 500', mr: '500 खालचे products डिलीट करा' },
          { en: 'Set every price to 500', mr: 'प्रत्येक किंमत 500 करा' },
          { en: 'Count all products', mr: 'सगळे products मोजा' },
        ],
        answer: 0,
        explain: { en: 'SELECT = show me, FROM = which table, WHERE = which ones.', mr: 'SELECT = दाखवा, FROM = कोणतं टेबल, WHERE = कोणते.' },
      },
      {
        q: { en: 'The main reason testers learn SQL is to...', mr: 'टेस्टर्स SQL शिकण्याचं मुख्य कारण...' },
        options: [
          { en: 'Design screens', mr: 'स्क्रीन डिझाइन करणं' },
          { en: 'Verify the data behind the screens', mr: 'स्क्रीनमागचा डेटा तपासणं' },
          { en: 'Speed up the internet', mr: 'इंटरनेट वेगवान करणं' },
          { en: 'Replace developers', mr: 'डेव्हलपर्सची जागा घेणं' },
        ],
        answer: 1,
        explain: { en: 'The screen is only a window. SQL checks what is really stored.', mr: 'स्क्रीन फक्त खिडकी आहे. खरं काय साठवलंय ते SQL तपासतं.' },
      },
    ],
    recap: { line: { en: 'SQL = a clear question to the database: SELECT what, FROM where, WHERE which ones.', mr: 'SQL = डेटाबेसला स्पष्ट प्रश्न: SELECT काय, FROM कुठून, WHERE कोणते.' }, icon: '🚉' },
    outro: [{ who: 'meera', mood: 'happy', text: { en: 'That is the whole idea, {name}. Now let\'s use it on a real case at ShopSprout.', mr: 'हीच संपूर्ण कल्पना, {name}. आता ShopSprout मधल्या खऱ्या केसवर वापरूया.' } }],
  },
]
