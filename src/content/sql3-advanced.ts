import type { Lesson } from './types.ts'

const DUP_CTE = `WITH w AS (
  SELECT t.*,
    LAG(amount)   OVER (PARTITION BY account_id ORDER BY txn_time) AS prev_amount,
    LAG(merchant) OVER (PARTITION BY account_id ORDER BY txn_time) AS prev_merchant,
    LAG(txn_time) OVER (PARTITION BY account_id ORDER BY txn_time) AS prev_time
  FROM transactions t
)`
const DUP_WHERE = "WHERE amount = prev_amount AND merchant = prev_merchant AND txn_time - prev_time < INTERVAL '5 minutes'"

export const advancedLessons: Lesson[] = [
  // ───────────────────────── 3.1 CTE
  {
    id: 'c3-1',
    code: '3.1',
    level: 'advanced',
    title: { en: 'Prep Bowls for Queries', mr: 'क्वेरीसाठी तयारीच्या वाट्या' },
    skill: 'CTEs (WITH)',
    realLife: {
      place: 'kitchen',
      title: { en: 'Cooking with prep bowls', mr: 'तयारीच्या वाट्यांसह स्वयंपाक' },
      story: {
        en: 'Before making pav bhaji, a good cook chops onions into one bowl, tomatoes into another, and boils potatoes in a third. Then the actual cooking is simple: use bowl 1, bowl 2, bowl 3. Each bowl has a name and one job.',
        mr: 'पावभाजी करण्याआधी चांगला स्वयंपाकी कांदा एका वाटीत, टोमॅटो दुसऱ्या वाटीत चिरतो आणि बटाटे तिसऱ्यात उकडतो. मग प्रत्यक्ष स्वयंपाक सोपा: वाटी 1, वाटी 2, वाटी 3 वापरा. प्रत्येक वाटीला नाव आणि एकच काम.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🧅', label: 'Bowl: onions', mr: 'वाटी: कांदा' },
          { icon: '🍅', label: 'Bowl: tomatoes', mr: 'वाटी: टोमॅटो' },
          { icon: '🥔', label: 'Bowl: potatoes', mr: 'वाटी: बटाटे' },
          { icon: '🍲', label: 'Cook using bowls', mr: 'वाट्या वापरून स्वयंपाक' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'neutral', text: { en: "Welcome to Ledgerly Bank. Compliance wants: \"Which accounts spend more than the average spender?\"", mr: 'Ledgerly बँकेत स्वागत. कम्प्लायन्सला हवंय: "कोणती अकाउंट्स सरासरी खर्च करणाऱ्यांपेक्षा जास्त खर्च करतात?"' } },
        { who: 'rex', mood: 'worried', text: { en: 'I tried. My query has subqueries inside subqueries. I cannot even read it anymore.', mr: 'मी प्रयत्न केला. माझ्या क्वेरीत subquery च्या आत subquery आहे. मलाच वाचता येत नाही.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Time for prep bowls, {name}. In SQL they are called CTEs.', mr: 'तयारीच्या वाट्यांची वेळ, {name}. SQL मध्ये त्यांना CTE म्हणतात.' } },
      ],
      problem: { en: 'Complex questions turn into nested subqueries that nobody can read, review or debug.', mr: 'गुंतागुंतीचे प्रश्न nested subqueries बनतात, जे कोणी वाचू, तपासू किंवा डीबग करू शकत नाही.' },
      solution: { en: 'A CTE (WITH name AS (...)) gives each step a name. The final query reads like a recipe, and you can test each step on its own.', mr: 'CTE (WITH name AS (...)) प्रत्येक पायरीला नाव देतो. शेवटची क्वेरी रेसिपीसारखी वाचता येते, आणि प्रत्येक पायरी वेगळी तपासता येते.' },
    },
    lesson: [
      { en: 'WITH name AS (SELECT ...) creates a temporary named result that lives only for this one query.', mr: 'WITH name AS (SELECT ...) फक्त या एका क्वेरीपुरता नाव असलेला तात्पुरता निकाल बनवतो.' },
      { en: 'You can chain several: WITH a AS (...), b AS (...) SELECT ... and later steps can use earlier ones.', mr: 'अनेक जोडता येतात: WITH a AS (...), b AS (...) SELECT ... आणि नंतरच्या पायऱ्या आधीच्या वापरू शकतात.' },
      { en: 'For testers, CTEs make long validation queries reviewable: one bowl per check.', mr: 'टेस्टर्ससाठी CTE लांब व्हॅलिडेशन क्वेरीज तपासण्यायोग्य करतात: प्रत्येक तपासणीसाठी एक वाटी.' },
    ],
    syntax: {
      template: 'WITH step1 AS (\n  SELECT ...\n),\nstep2 AS (\n  SELECT ... FROM step1\n)\nSELECT ... FROM step2;',
      parts: [
        { code: 'WITH step1 AS ( ... )', means: { en: 'a named prep bowl', mr: 'नाव असलेली तयारीची वाटी' } },
        { code: ', step2 AS ( ... )', means: { en: 'another bowl, may use step1', mr: 'दुसरी वाटी, step1 वापरू शकते' } },
        { code: 'SELECT ... FROM step2', means: { en: 'the final dish', mr: 'शेवटचा पदार्थ' } },
      ],
      example: [
        { code: 'WITH spend AS (', note: { en: 'bowl 1: spend per account', mr: 'वाटी 1: प्रत्येक अकाउंटचा खर्च' } },
        { code: "  SELECT account_id, SUM(-amount) AS spent FROM transactions WHERE kind = 'PAYMENT' GROUP BY account_id", note: { en: 'payments are negative, so flip the sign', mr: 'payments ऋण आहेत, म्हणून चिन्ह उलटा' } },
        { code: ')', note: { en: 'bowl ready', mr: 'वाटी तयार' } },
        { code: 'SELECT * FROM spend WHERE spent > 40000;', note: { en: 'use the bowl like a table', mr: 'वाटी टेबलसारखी वापरा' } },
      ],
      pitfall: { en: 'A CTE exists only inside its query. You cannot SELECT from it in a separate query later.', mr: 'CTE फक्त त्याच क्वेरीत असतो. नंतर वेगळ्या क्वेरीत त्यातून SELECT करता येत नाही.' },
    },
    practice: {
      intro: { en: 'New tables: accounts and transactions (payments are negative amounts).', mr: 'नवीन टेबल्स: accounts आणि transactions (payments ऋण रकमा आहेत).' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: "Using a CTE named spend (total PAYMENT spending per account), show account_id and spent for accounts that spent more than 40000.", mr: "spend नावाचा CTE (प्रत्येक अकाउंटचा एकूण PAYMENT खर्च) वापरून 40000 पेक्षा जास्त खर्च केलेल्या अकाउंट्सचे account_id आणि spent दाखवा." },
          starter: "WITH spend AS (\n  SELECT account_id, SUM(-amount) AS spent\n  FROM transactions\n  WHERE kind = 'PAYMENT'\n  GROUP BY account_id\n)\nSELECT ",
          expected: "WITH spend AS (SELECT account_id, SUM(-amount) AS spent FROM transactions WHERE kind = 'PAYMENT' GROUP BY account_id) SELECT account_id, spent FROM spend WHERE spent > 40000",
          hints: [
            { en: 'The bowl is ready. Now select from it like a table.', mr: 'वाटी तयार आहे. आता टेबलसारखं त्यातून SELECT करा.' },
            { en: 'SELECT account_id, spent FROM spend WHERE ...', mr: 'SELECT account_id, spent FROM spend WHERE ...' },
            { en: '... WHERE spent > 40000', mr: '... WHERE spent > 40000' },
            { en: "WITH spend AS (SELECT account_id, SUM(-amount) AS spent FROM transactions WHERE kind = 'PAYMENT' GROUP BY account_id) SELECT account_id, spent FROM spend WHERE spent > 40000;", mr: "WITH spend AS (SELECT account_id, SUM(-amount) AS spent FROM transactions WHERE kind = 'PAYMENT' GROUP BY account_id) SELECT account_id, spent FROM spend WHERE spent > 40000;" },
          ],
          successLine: { en: '5 big spenders. Account 13 spent over 1.1 lakh. Odd...', mr: '5 मोठे खर्च करणारे. अकाउंट 13 ने 1.1 लाखांहून जास्त खर्च केला. विचित्र...' },
        },
        {
          kind: 'sql',
          prompt: { en: 'Now Compliance\'s real question: show the account_id of accounts that spent more than the AVERAGE spend. Chain a second step or use a subquery on spend.', mr: 'आता कम्प्लायन्सचा खरा प्रश्न: सरासरी खर्चापेक्षा जास्त खर्च केलेल्या अकाउंट्सचे account_id दाखवा. दुसरी पायरी जोडा किंवा spend वर subquery वापरा.' },
          expected: "WITH spend AS (SELECT account_id, SUM(-amount) AS spent FROM transactions WHERE kind = 'PAYMENT' GROUP BY account_id) SELECT account_id FROM spend WHERE spent > (SELECT AVG(spent) FROM spend)",
          hints: [
            { en: 'Keep the spend bowl. The average is (SELECT AVG(spent) FROM spend).', mr: 'spend वाटी तशीच ठेवा. सरासरी म्हणजे (SELECT AVG(spent) FROM spend).' },
            { en: '... SELECT account_id FROM spend WHERE spent > (SELECT AVG(spent) FROM spend)', mr: '... SELECT account_id FROM spend WHERE spent > (SELECT AVG(spent) FROM spend)' },
            { en: 'Or chain: , avg_spend AS (SELECT AVG(spent) AS a FROM spend) and join it.', mr: 'किंवा जोडा: , avg_spend AS (SELECT AVG(spent) AS a FROM spend) आणि join करा.' },
            { en: "WITH spend AS (SELECT account_id, SUM(-amount) AS spent FROM transactions WHERE kind = 'PAYMENT' GROUP BY account_id) SELECT account_id FROM spend WHERE spent > (SELECT AVG(spent) FROM spend);", mr: "WITH spend AS (SELECT account_id, SUM(-amount) AS spent FROM transactions WHERE kind = 'PAYMENT' GROUP BY account_id) SELECT account_id FROM spend WHERE spent > (SELECT AVG(spent) FROM spend);" },
          ],
          successLine: { en: '6 accounts above average. Readable enough for Compliance to review.', mr: 'सरासरीपेक्षा जास्त 6 अकाउंट्स. कम्प्लायन्सला तपासता येईल इतकी वाचनीय क्वेरी.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'How long does a CTE exist?', mr: 'CTE किती वेळ अस्तित्वात असतो?' },
        options: [{ en: 'Forever, like a table', mr: 'कायम, टेबलसारखा' }, { en: 'Only during the one query that defines it', mr: 'फक्त तो ज्या क्वेरीत आहे तेवढाच' }, { en: 'Until the database restarts', mr: 'डेटाबेस रीस्टार्ट होईपर्यंत' }, { en: 'One hour', mr: 'एक तास' }],
        answer: 1,
        explain: { en: 'CTEs are temporary prep bowls for one query.', mr: 'CTE म्हणजे एका क्वेरीसाठी तात्पुरत्या वाट्या.' },
      },
      {
        q: { en: 'How do you define two CTEs?', mr: 'दोन CTE कसे लिहाल?' },
        options: ['WITH a AS (...) WITH b AS (...)', 'WITH a AS (...), b AS (...)', 'WITH a, b AS (...)', 'CTE a (...); CTE b (...);'],
        answer: 1,
        explain: { en: 'One WITH, CTEs separated by commas.', mr: 'एकच WITH, CTE स्वल्पविरामाने वेगळे.' },
      },
      {
        q: { en: 'Main benefit of CTEs for a test team?', mr: 'टेस्ट टीमसाठी CTE चा मुख्य फायदा?' },
        options: [{ en: 'They store data permanently', mr: 'डेटा कायमचा साठवतात' }, { en: 'Readable, step-by-step queries that are easy to review and debug', mr: 'वाचनीय, टप्प्याटप्प्याच्या क्वेरीज ज्या तपासणं आणि डीबग करणं सोपं' }, { en: 'They replace indexes', mr: 'ते indexes ची जागा घेतात' }, { en: 'They lock tables', mr: 'ते टेबल्स लॉक करतात' }],
        answer: 1,
        explain: { en: 'You can run each bowl alone to check it.', mr: 'प्रत्येक वाटी स्वतंत्रपणे चालवून तपासता येते.' },
      },
      {
        q: { en: 'What is wrong?', mr: 'काय चुकलंय?' },
        code: 'WITH big AS (SELECT * FROM orders WHERE total > 5000);\nSELECT COUNT(*) FROM big;',
        options: [{ en: 'Nothing', mr: 'काहीच नाही' }, { en: 'The semicolon ends the query, so big no longer exists', mr: 'अर्धविराम क्वेरी संपवतो, त्यामुळे big उरत नाही' }, { en: 'COUNT cannot be used', mr: 'COUNT वापरता येत नाही' }, { en: 'total is reserved', mr: 'total राखीव आहे' }],
        answer: 1,
        explain: { en: 'WITH and the final SELECT must be one statement.', mr: 'WITH आणि शेवटची SELECT एकच statement असायला हवी.' },
      },
    ],
    recap: { line: { en: 'WITH name AS (...) = a named prep bowl. Chain bowls, then cook.', mr: 'WITH name AS (...) = नाव असलेली तयारीची वाटी. वाट्या जोडा, मग स्वयंपाक.' }, icon: '🥣' },
  },

  // ───────────────────────── 3.2 ROW_NUMBER / RANK
  {
    id: 'c3-2',
    code: '3.2',
    level: 'advanced',
    title: { en: 'Token Numbers', mr: 'टोकन नंबर' },
    skill: 'Window: ROW_NUMBER & RANK',
    realLife: {
      place: 'bank',
      title: { en: 'Token numbers at the bank counters', mr: 'बँकेच्या काउंटर्सवरचे टोकन नंबर' },
      story: {
        en: 'A bank has three counters. Each counter gives its own tokens: 1, 2, 3... The numbering restarts for every counter. Nobody leaves their queue; each person just gets a number within it.',
        mr: 'बँकेत तीन काउंटर्स आहेत. प्रत्येक काउंटर स्वतःचे टोकन देतो: 1, 2, 3... प्रत्येक काउंटरसाठी क्रमांक पुन्हा 1 पासून. कोणीही रांग सोडत नाही; प्रत्येकाला त्याच्या रांगेत एक नंबर मिळतो.',
      },
      scene: {
        type: 'group',
        groups: [
          { icon: '🅰️', label: 'Counter A: 1, 2, 3', mr: 'काउंटर A' },
          { icon: '🅱️', label: 'Counter B: 1, 2, 3, 4', mr: 'काउंटर B' },
          { icon: '©️', label: 'Counter C: 1, 2', mr: 'काउंटर C' },
        ],
        items: [0, 1, 2, 1, 0, 1, 2, 1, 0].map((group) => ({ icon: '🎫', group })),
        note: { en: 'PARTITION BY counter: numbering restarts at 1 in every queue', mr: 'PARTITION BY counter: प्रत्येक रांगेत क्रमांक 1 पासून' },
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'neutral', text: { en: 'The app shows "last transaction" per account. I need to test it against the database.', mr: 'ॲप प्रत्येक अकाउंटचा "शेवटचा व्यवहार" दाखवतं. मला ते डेटाबेसशी तपासायचंय.' } },
        { who: 'sam', mood: 'happy', text: { en: 'And Marketing wants the richest customer in each city for a VIP event.', mr: 'आणि मार्केटिंगला VIP कार्यक्रमासाठी प्रत्येक शहरातला सर्वात श्रीमंत ग्राहक हवाय.' } },
      ],
      problem: { en: '"The latest per account" or "the top per city" cannot be done with GROUP BY alone: GROUP BY squashes rows and loses the details.', mr: '"प्रत्येक अकाउंटचा शेवटचा" किंवा "प्रत्येक शहरातला टॉप" फक्त GROUP BY ने होत नाही: GROUP BY rows दाबून टाकतो आणि तपशील हरवतात.' },
      solution: { en: 'Window functions number or rank rows inside groups (PARTITION BY) WITHOUT squashing them. Then keep number 1.', mr: 'Window functions groups मध्ये (PARTITION BY) rows ना क्रमांक किंवा रँक देतात, दाबून न टाकता. मग क्रमांक 1 ठेवा.' },
    },
    lesson: [
      { en: 'A window function adds a column computed over a "window" of related rows. Every row stays.', mr: 'Window function संबंधित rows च्या "खिडकी" वर काढलेला column जोडतो. प्रत्येक row राहते.' },
      { en: 'ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY txn_time DESC) gives 1 to the newest row of each account.', mr: 'ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY txn_time DESC) प्रत्येक अकाउंटच्या सर्वात नवीन row ला 1 देतो.' },
      { en: 'RANK() gives ties the same number and skips the next (1, 1, 3). DENSE_RANK() does not skip (1, 1, 2).', mr: 'RANK() बरोबरीच्यांना तोच नंबर देतो आणि पुढचा वगळतो (1, 1, 3). DENSE_RANK() वगळत नाही (1, 1, 2).' },
    ],
    syntax: {
      template: 'ROW_NUMBER() OVER (\n  PARTITION BY group_col\n  ORDER BY sort_col DESC\n) AS rn',
      parts: [
        { code: 'ROW_NUMBER()', means: { en: 'token number 1, 2, 3...', mr: 'टोकन नंबर 1, 2, 3...' } },
        { code: 'PARTITION BY', means: { en: 'which queue (restart numbering per group)', mr: 'कोणती रांग (प्रत्येक गटात पुन्हा क्रमांक)' } },
        { code: 'ORDER BY', means: { en: 'who gets number 1', mr: 'नंबर 1 कोणाला' } },
      ],
      example: [
        { code: 'WITH ranked AS (', note: { en: 'number rows first', mr: 'आधी rows ना क्रमांक' } },
        { code: '  SELECT account_id, id,', note: { en: 'keep the details', mr: 'तपशील ठेवा' } },
        { code: '    ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY txn_time DESC) AS rn', note: { en: 'newest = 1, per account', mr: 'सर्वात नवीन = 1, प्रत्येक अकाउंटमध्ये' } },
        { code: '  FROM transactions', note: { en: 'all transactions', mr: 'सगळे व्यवहार' } },
        { code: ') SELECT account_id, id FROM ranked WHERE rn = 1;', note: { en: 'keep token 1 only', mr: 'फक्त टोकन 1 ठेवा' } },
      ],
      pitfall: { en: 'You cannot write WHERE rn = 1 in the same SELECT that creates rn. Wrap it in a CTE first.', mr: 'rn बनवणाऱ्या त्याच SELECT मध्ये WHERE rn = 1 लिहिता येत नाही. आधी CTE मध्ये गुंडाळा.' },
    },
    practice: {
      intro: { en: 'Number the queues.', mr: 'रांगांना क्रमांक द्या.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'Show account_id and the id of the LATEST transaction for every account.', mr: 'प्रत्येक अकाउंटसाठी account_id आणि सर्वात शेवटच्या व्यवहाराचा id दाखवा.' },
          starter: 'WITH ranked AS (\n  SELECT account_id, id,\n    ROW_NUMBER() OVER (\n      PARTITION BY \n      ORDER BY \n    ) AS rn\n  FROM transactions\n)\nSELECT account_id, id FROM ranked WHERE rn = 1',
          expected: 'WITH ranked AS (SELECT account_id, id, ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY txn_time DESC) AS rn FROM transactions) SELECT account_id, id FROM ranked WHERE rn = 1',
          hints: [
            { en: 'Each account is its own queue.', mr: 'प्रत्येक अकाउंट म्हणजे स्वतःची रांग.' },
            { en: 'PARTITION BY account_id', mr: 'PARTITION BY account_id' },
            { en: 'Latest first: ORDER BY txn_time DESC', mr: 'नवीन आधी: ORDER BY txn_time DESC' },
            { en: 'WITH ranked AS (SELECT account_id, id, ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY txn_time DESC) AS rn FROM transactions) SELECT account_id, id FROM ranked WHERE rn = 1;', mr: 'WITH ranked AS (SELECT account_id, id, ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY txn_time DESC) AS rn FROM transactions) SELECT account_id, id FROM ranked WHERE rn = 1;' },
          ],
          successLine: { en: '20 accounts, 20 latest transactions. Theo can compare these with the app screen.', mr: '20 अकाउंट्स, 20 शेवटचे व्यवहार. थिओ हे ॲपच्या स्क्रीनशी तुलना करू शकतो.' },
        },
        {
          kind: 'sql',
          prompt: { en: "VIP list: for each city, show city, account_id and balance of the account with the highest balance (balance = SUM(amount) of its transactions).", mr: 'VIP यादी: प्रत्येक शहरासाठी सर्वात जास्त balance असलेल्या अकाउंटचे city, account_id आणि balance दाखवा (balance = त्याच्या व्यवहारांची SUM(amount)).' },
          starter: 'WITH b AS (\n  SELECT account_id, SUM(amount) AS balance\n  FROM transactions\n  GROUP BY account_id\n),\nr AS (\n  SELECT a.city, b.account_id, b.balance,\n    ROW_NUMBER() OVER (  ) AS rn\n  FROM b JOIN accounts a ON a.id = b.account_id\n)\nSELECT city, account_id, balance FROM r WHERE rn = 1',
          expected: 'WITH b AS (SELECT account_id, SUM(amount) AS balance FROM transactions GROUP BY account_id), r AS (SELECT a.city, b.account_id, b.balance, ROW_NUMBER() OVER (PARTITION BY a.city ORDER BY b.balance DESC) AS rn FROM b JOIN accounts a ON a.id = b.account_id) SELECT city, account_id, balance FROM r WHERE rn = 1',
          hints: [
            { en: 'The queue is the city. Number 1 goes to the biggest balance.', mr: 'रांग म्हणजे शहर. नंबर 1 सर्वात मोठ्या balance ला.' },
            { en: 'PARTITION BY a.city ORDER BY b.balance DESC', mr: 'PARTITION BY a.city ORDER BY b.balance DESC' },
            { en: 'ROW_NUMBER() OVER (PARTITION BY a.city ORDER BY b.balance DESC) AS rn', mr: 'ROW_NUMBER() OVER (PARTITION BY a.city ORDER BY b.balance DESC) AS rn' },
            { en: 'Fill that into the starter and run it.', mr: 'हे starter मध्ये भरा आणि चालवा.' },
          ],
          successLine: { en: 'One VIP per city: Mumbai, Nagpur, Nashik, Pune.', mr: 'प्रत्येक शहरातून एक VIP: मुंबई, नागपूर, नाशिक, पुणे.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Scores 90, 90, 80. What does RANK() give?', mr: 'गुण 90, 90, 80. RANK() काय देईल?' },
        options: ['1, 2, 3', '1, 1, 2', '1, 1, 3', '1, 2, 2'],
        answer: 2,
        explain: { en: 'RANK gives ties the same number and skips: 1, 1, 3. DENSE_RANK would give 1, 1, 2.', mr: 'RANK बरोबरीला तोच नंबर देतो आणि वगळतो: 1, 1, 3. DENSE_RANK 1, 1, 2 देईल.' },
      },
      {
        q: { en: 'What does PARTITION BY do?', mr: 'PARTITION BY काय करतो?' },
        options: [{ en: 'Deletes groups', mr: 'गट डिलीट करतो' }, { en: 'Restarts the window calculation for each group', mr: 'प्रत्येक गटासाठी window गणना पुन्हा सुरू करतो' }, { en: 'Sorts the final result', mr: 'शेवटचा निकाल क्रमाने लावतो' }, { en: 'Same as GROUP BY', mr: 'GROUP BY सारखाच' }],
        answer: 1,
        explain: { en: 'Like separate counters, each with its own token numbers. Rows are not squashed.', mr: 'वेगवेगळ्या काउंटर्ससारखं, प्रत्येकाचे स्वतःचे टोकन. Rows दाबल्या जात नाहीत.' },
      },
      {
        q: { en: 'Why does this fail?', mr: 'हे फेल का होतं?' },
        code: 'SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn\nFROM transactions\nWHERE rn = 1;',
        options: [{ en: 'WHERE runs before the window function, so rn does not exist yet', mr: 'WHERE window function आधी चालतो, त्यामुळे rn अजून नसतो' }, { en: 'ROW_NUMBER needs PARTITION BY', mr: 'ROW_NUMBER ला PARTITION BY हवा' }, { en: 'id is reserved', mr: 'id राखीव आहे' }, { en: 'It does not fail', mr: 'फेल होत नाही' }],
        answer: 0,
        explain: { en: 'Compute rn in a CTE, then filter outside.', mr: 'rn CTE मध्ये काढा, मग बाहेर फिल्टर करा.' },
      },
      {
        q: { en: 'GROUP BY vs window function: which keeps every row?', mr: 'GROUP BY की window function: कोणतं प्रत्येक row ठेवतं?' },
        options: ['GROUP BY', { en: 'Window function', mr: 'Window function' }, { en: 'Both', mr: 'दोन्ही' }, { en: 'Neither', mr: 'कोणतंच नाही' }],
        answer: 1,
        explain: { en: 'GROUP BY returns one row per group; a window function adds a column to every row.', mr: 'GROUP BY प्रत्येक गटाची एक row देतो; window function प्रत्येक row ला column जोडतो.' },
      },
    ],
    recap: { line: { en: 'ROW_NUMBER() OVER (PARTITION BY group ORDER BY x) = token numbers per queue. Keep rn = 1.', mr: 'ROW_NUMBER() OVER (PARTITION BY गट ORDER BY x) = प्रत्येक रांगेत टोकन नंबर. rn = 1 ठेवा.' }, icon: '🎫' },
  },

  // ───────────────────────── 3.3 LAG / LEAD
  {
    id: 'c3-3',
    code: '3.3',
    level: 'advanced',
    title: { en: 'Same as the Line Above', mr: 'वरच्या ओळीसारखंच' },
    skill: 'Window: LAG & LEAD',
    realLife: {
      place: 'shop',
      title: { en: 'The shopkeeper\'s bill book', mr: 'दुकानदाराची बिल वही' },
      story: {
        en: 'At closing time the shopkeeper reads his bill book line by line. When a line looks exactly like the one above it, same customer, same item, same amount, one minute apart, he circles it: probably entered twice.',
        mr: 'दुकान बंद करताना दुकानदार बिल वही ओळीओळीने वाचतो. एखादी ओळ अगदी वरच्या ओळीसारखी दिसली, तोच ग्राहक, तीच वस्तू, तीच रक्कम, एका मिनिटाच्या अंतराने, तर तो वर्तुळ करतो: बहुधा दोनदा लिहिलं.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Circle lines that match the line above within 5 minutes', mr: '5 मिनिटांत वरच्या ओळीशी जुळणाऱ्या ओळींना वर्तुळ करा' },
        items: [
          { icon: '🧾', label: '10:02 Chai ₹40', mr: 'चहा ₹40', pass: false },
          { icon: '🧾', label: '10:03 Chai ₹40', mr: 'पुन्हा तेच!', pass: true },
          { icon: '🧾', label: '11:30 Bread ₹55', mr: 'ब्रेड ₹55', pass: false },
          { icon: '🧾', label: '13:10 Milk ₹30', mr: 'दूध ₹30', pass: false },
          { icon: '🧾', label: '15:45 Eggs ₹84', mr: 'अंडी ₹84', pass: false },
          { icon: '🧾', label: '15:46 Eggs ₹84', mr: 'पुन्हा तेच!', pass: true },
          { icon: '🧾', label: '18:20 Sugar ₹48', mr: 'साखर ₹48', pass: false },
          { icon: '🧾', label: '19:05 Chai ₹40', mr: 'चहा ₹40', pass: false },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'gremlin', mood: 'smug', text: { en: '>> when the payment app freezes, people tap PAY again. i made sure the bank charges them twice. ⌁', mr: '>> पेमेंट ॲप अडकलं की लोक पुन्हा PAY दाबतात. मी खात्री केली की बँक दोनदा पैसे कापेल. ⌁' } },
        { who: 'sam', mood: 'angry', text: { en: 'Support has angry customers. Find every double charge. Today.', mr: 'सपोर्टकडे संतापलेले ग्राहक आहेत. प्रत्येक दुहेरी कपात शोधा. आजच.' } },
      ],
      problem: { en: 'A double charge is a row that looks like the previous row of the same account. Comparing each row with "the one before" is impossible with WHERE alone.', mr: 'दुहेरी कपात म्हणजे त्याच अकाउंटच्या आधीच्या row सारखी दिसणारी row. फक्त WHERE ने प्रत्येक row ची "आधीच्या" शी तुलना करता येत नाही.' },
      solution: { en: 'LAG(column) reads the value from the previous row in the window; LEAD reads the next one. Then compare like the shopkeeper.', mr: 'LAG(column) window मधल्या आधीच्या row ची व्हॅल्यू वाचतो; LEAD पुढची वाचतो. मग दुकानदारासारखी तुलना करा.' },
    },
    lesson: [
      { en: 'LAG(amount) OVER (PARTITION BY account_id ORDER BY txn_time) = this account\'s previous amount.', mr: 'LAG(amount) OVER (PARTITION BY account_id ORDER BY txn_time) = या अकाउंटची आधीची रक्कम.' },
      { en: 'The first row of each partition has no previous row, so LAG returns NULL there.', mr: 'प्रत्येक partition च्या पहिल्या row ला आधीची row नसते, म्हणून तिथे LAG NULL देतो.' },
      { en: 'Subtracting timestamps gives an interval: txn_time - prev_time < INTERVAL \'5 minutes\'.', mr: 'Timestamps वजा केले की interval मिळतो: txn_time - prev_time < INTERVAL \'5 minutes\'.' },
    ],
    syntax: {
      template: 'LAG(column)  OVER (PARTITION BY g ORDER BY t)  -- previous row\nLEAD(column) OVER (PARTITION BY g ORDER BY t)  -- next row',
      parts: [
        { code: 'LAG(col)', means: { en: 'value from the line above', mr: 'वरच्या ओळीतली व्हॅल्यू' } },
        { code: 'LEAD(col)', means: { en: 'value from the line below', mr: 'खालच्या ओळीतली व्हॅल्यू' } },
        { code: "INTERVAL '5 minutes'", means: { en: 'a length of time', mr: 'वेळेचा कालावधी' } },
      ],
      example: [
        { code: 'SELECT entry_time, item, amount,', note: { en: 'each bill line', mr: 'प्रत्येक बिल ओळ' } },
        { code: '  LAG(amount) OVER (ORDER BY entry_time) AS prev_amount', note: { en: 'amount on the line above', mr: 'वरच्या ओळीवरची रक्कम' } },
        { code: 'FROM bill_book;', note: { en: 'the shop\'s book', mr: 'दुकानाची वही' } },
      ],
      pitfall: { en: 'Forgetting PARTITION BY compares one customer\'s row with another customer\'s. Always partition by the owner.', mr: 'PARTITION BY विसरलात तर एका ग्राहकाची row दुसऱ्याच्या row शी तुलना होते. नेहमी मालकानुसार partition करा.' },
    },
    practice: {
      intro: { en: 'Read the bill book line by line.', mr: 'बिल वही ओळीओळीने वाचा.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'For account 2 only, show each transaction id, its amount, and the previous amount (ordered by txn_time).', mr: 'फक्त अकाउंट 2 साठी प्रत्येक व्यवहाराचा id, amount आणि आधीची amount दाखवा (txn_time नुसार).' },
          expected: 'SELECT id, amount, LAG(amount) OVER (ORDER BY txn_time) FROM transactions WHERE account_id = 2',
          hints: [
            { en: 'WHERE account_id = 2 already limits it to one account.', mr: 'WHERE account_id = 2 आधीच एका अकाउंटपुरतं मर्यादित करतो.' },
            { en: 'LAG(amount) OVER (ORDER BY txn_time)', mr: 'LAG(amount) OVER (ORDER BY txn_time)' },
            { en: 'SELECT id, amount, LAG(amount) OVER (ORDER BY txn_time) AS prev_amount FROM transactions WHERE ...', mr: 'SELECT id, amount, LAG(amount) OVER (ORDER BY txn_time) AS prev_amount FROM transactions WHERE ...' },
            { en: 'SELECT id, amount, LAG(amount) OVER (ORDER BY txn_time) AS prev_amount FROM transactions WHERE account_id = 2;', mr: 'SELECT id, amount, LAG(amount) OVER (ORDER BY txn_time) AS prev_amount FROM transactions WHERE account_id = 2;' },
          ],
          successLine: { en: 'Look closely: two rows in a row with -3681.00. Suspicious.', mr: 'नीट पाहा: सलग दोन rows मध्ये -3681.00. संशयास्पद.' },
        },
        {
          kind: 'sql',
          prompt: { en: 'Now all accounts: show id, account_id, merchant and amount of every transaction that matches the previous transaction of the SAME account (same amount and merchant) within 5 minutes.', mr: 'आता सगळी अकाउंट्स: त्याच अकाउंटच्या आधीच्या व्यवहाराशी 5 मिनिटांत जुळणाऱ्या (तीच रक्कम आणि merchant) प्रत्येक व्यवहाराचे id, account_id, merchant आणि amount दाखवा.' },
          starter: `${DUP_CTE}\nSELECT id, account_id, merchant, amount\nFROM w\nWHERE `,
          expected: `${DUP_CTE} SELECT id, account_id, merchant, amount FROM w ${DUP_WHERE}`,
          hints: [
            { en: 'The CTE already has prev_amount, prev_merchant and prev_time.', mr: 'CTE मध्ये prev_amount, prev_merchant आणि prev_time आधीच आहेत.' },
            { en: 'Three conditions joined with AND.', mr: 'AND ने जोडलेल्या तीन अटी.' },
            { en: "amount = prev_amount AND merchant = prev_merchant AND txn_time - prev_time < INTERVAL '5 minutes'", mr: "amount = prev_amount AND merchant = prev_merchant AND txn_time - prev_time < INTERVAL '5 minutes'" },
            { en: 'Add that after WHERE and run it.', mr: 'हे WHERE नंतर जोडा आणि चालवा.' },
          ],
          successLine: { en: '6 double charges across 6 accounts. Refunds are on their way.', mr: '6 अकाउंट्समध्ये 6 दुहेरी कपाती. परतावे पाठवले जातायत.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does LAG return on the first row of a partition?', mr: 'Partition च्या पहिल्या row वर LAG काय देतो?' },
        options: ['0', 'NULL', { en: 'The same row', mr: 'तीच row' }, { en: 'An error', mr: 'एरर' }],
        answer: 1,
        explain: { en: 'There is no line above, so NULL.', mr: 'वर ओळच नाही, म्हणून NULL.' },
      },
      {
        q: { en: 'To compare each day\'s sales with the NEXT day, use...', mr: 'प्रत्येक दिवसाच्या विक्रीची पुढच्या दिवसाशी तुलना करायला वापरा...' },
        options: ['LAG', 'LEAD', 'RANK', 'COUNT'],
        answer: 1,
        explain: { en: 'LEAD looks forward; LAG looks back.', mr: 'LEAD पुढे पाहतो; LAG मागे.' },
      },
      {
        q: { en: 'Why PARTITION BY account_id in the double-charge check?', mr: 'दुहेरी कपात तपासणीत PARTITION BY account_id का?' },
        options: [{ en: 'To make it faster', mr: 'वेगासाठी' }, { en: 'So each row is compared only with the same account\'s previous row', mr: 'प्रत्येक row ची तुलना फक्त त्याच अकाउंटच्या आधीच्या row शी व्हावी' }, { en: 'It is required syntax', mr: 'तो आवश्यक syntax आहे' }, { en: 'To sort by account', mr: 'अकाउंटनुसार क्रम लावायला' }],
        answer: 1,
        explain: { en: 'Two different people buying the same chai is not a double charge.', mr: 'दोन वेगळ्या लोकांनी तोच चहा घेणं म्हणजे दुहेरी कपात नाही.' },
      },
      {
        q: { en: 'What type is txn_time - prev_time?', mr: 'txn_time - prev_time चा प्रकार कोणता?' },
        options: [{ en: 'A number', mr: 'नंबर' }, { en: 'An interval (length of time)', mr: 'Interval (वेळेचा कालावधी)' }, { en: 'Text', mr: 'टेक्स्ट' }, { en: 'A date', mr: 'तारीख' }],
        answer: 1,
        explain: { en: "Compare it with INTERVAL '5 minutes'.", mr: "त्याची तुलना INTERVAL '5 minutes' शी करा." },
      },
    ],
    recap: { line: { en: 'LAG = the line above, LEAD = the line below. Partition by owner.', mr: 'LAG = वरची ओळ, LEAD = खालची ओळ. मालकानुसार partition करा.' }, icon: '🧾' },
  },

  // ───────────────────────── 3.4 Running totals
  {
    id: 'c3-4',
    code: '3.4',
    level: 'advanced',
    title: { en: 'The Passbook Balance', mr: 'पासबुकमधील शिल्लक' },
    skill: 'Running totals (SUM OVER)',
    realLife: {
      place: 'bank',
      title: { en: 'A bank passbook', mr: 'बँकेचं पासबुक' },
      story: {
        en: 'Every line in a passbook shows the money in or out, AND the balance after that line. The balance is a running total: the sum of everything so far. If it ever shows a minus, the account was overdrawn on that day.',
        mr: 'पासबुकच्या प्रत्येक ओळीत जमा किंवा नावे रक्कम, आणि त्या ओळीनंतरची शिल्लक असते. शिल्लक म्हणजे चालू बेरीज: आतापर्यंतच्या सगळ्याची बेरीज. कधी उणे दिसलं, तर त्या दिवशी अकाउंट ओव्हरड्रॉ झालं.',
      },
      scene: {
        type: 'tally',
        unit: '₹',
        alertBelow: 0,
        items: [
          { icon: '💰', label: 'Salary', mr: 'पगार', value: 20000 },
          { icon: '🛒', label: 'Groceries', mr: 'किराणा', value: -4500 },
          { icon: '🏠', label: 'Rent', mr: 'भाडं', value: -12000 },
          { icon: '📺', label: 'TV EMI', mr: 'टीव्ही EMI', value: -6000 },
          { icon: '💸', label: 'Transfer in', mr: 'जमा', value: 5000 },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'The regulator asks: did any account go below zero without an overdraft facility?', mr: 'नियामक विचारतो: overdraft सुविधा नसताना कोणतं अकाउंट शून्याखाली गेलं का?' } },
        { who: 'theo', mood: 'neutral', text: { en: 'We only store transactions, not the balance after each one.', mr: 'आपण फक्त व्यवहार साठवतो, प्रत्येकानंतरची शिल्लक नाही.' } },
      ],
      problem: { en: 'The final balance looks fine, but a dip below zero in the middle of the month is hidden inside the history.', mr: 'शेवटची शिल्लक ठीक दिसते, पण महिन्याच्या मध्ये शून्याखाली गेलेली शिल्लक इतिहासात लपलेली असते.' },
      solution: { en: 'SUM(amount) OVER (PARTITION BY account ORDER BY time) rebuilds the passbook balance after every transaction. Then look for negatives.', mr: 'SUM(amount) OVER (PARTITION BY account ORDER BY time) प्रत्येक व्यवहारानंतरची पासबुक शिल्लक पुन्हा काढतो. मग उणे शोधा.' },
    },
    lesson: [
      { en: 'SUM(...) OVER (ORDER BY time) adds up everything from the first row to the current row: a running total.', mr: 'SUM(...) OVER (ORDER BY time) पहिल्या row पासून चालू row पर्यंत सगळं बेरीज करतो: चालू बेरीज.' },
      { en: 'Add PARTITION BY account_id so every account has its own passbook.', mr: 'प्रत्येक अकाउंटचं स्वतःचं पासबुक असावं म्हणून PARTITION BY account_id जोडा.' },
      { en: 'Testers use running totals to verify stored balances, inventory levels and loyalty points.', mr: 'टेस्टर्स साठवलेल्या शिल्लक, स्टॉक पातळी आणि लॉयल्टी पॉइंट्स तपासायला चालू बेरीज वापरतात.' },
    ],
    syntax: {
      template: 'SUM(amount) OVER (\n  PARTITION BY account_id\n  ORDER BY txn_time\n) AS balance',
      parts: [
        { code: 'SUM(amount) OVER', means: { en: 'add up within the window', mr: 'window मध्ये बेरीज करा' } },
        { code: 'PARTITION BY account_id', means: { en: 'one passbook per account', mr: 'प्रत्येक अकाउंटचं एक पासबुक' } },
        { code: 'ORDER BY txn_time', means: { en: 'in date order, up to this line', mr: 'तारखेच्या क्रमाने, या ओळीपर्यंत' } },
      ],
      example: [
        { code: 'SELECT entry_date, amount,', note: { en: 'each passbook line', mr: 'पासबुकची प्रत्येक ओळ' } },
        { code: '  SUM(amount) OVER (ORDER BY entry_date) AS balance', note: { en: 'balance after this line', mr: 'या ओळीनंतरची शिल्लक' } },
        { code: 'FROM passbook;', note: { en: 'one account\'s entries', mr: 'एका अकाउंटच्या नोंदी' } },
      ],
      pitfall: { en: 'Without ORDER BY inside OVER, SUM gives the grand total on every row, not a running total.', mr: 'OVER मध्ये ORDER BY नसेल तर SUM प्रत्येक row वर एकूण बेरीज देतो, चालू बेरीज नाही.' },
    },
    practice: {
      intro: { en: 'Rebuild the passbooks.', mr: 'पासबुक पुन्हा तयार करा.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'For account 4, show id, txn_time, amount and the running balance after each transaction.', mr: 'अकाउंट 4 साठी id, txn_time, amount आणि प्रत्येक व्यवहारानंतरची चालू शिल्लक दाखवा.' },
          expected: 'SELECT id, txn_time, amount, SUM(amount) OVER (ORDER BY txn_time) FROM transactions WHERE account_id = 4',
          hints: [
            { en: 'One account, so no PARTITION BY needed.', mr: 'एकच अकाउंट, त्यामुळे PARTITION BY लागत नाही.' },
            { en: 'SUM(amount) OVER (ORDER BY txn_time)', mr: 'SUM(amount) OVER (ORDER BY txn_time)' },
            { en: 'SELECT id, txn_time, amount, SUM(amount) OVER (ORDER BY txn_time) AS balance FROM transactions WHERE ...', mr: 'SELECT id, txn_time, amount, SUM(amount) OVER (ORDER BY txn_time) AS balance FROM transactions WHERE ...' },
            { en: 'SELECT id, txn_time, amount, SUM(amount) OVER (ORDER BY txn_time) AS balance FROM transactions WHERE account_id = 4;', mr: 'SELECT id, txn_time, amount, SUM(amount) OVER (ORDER BY txn_time) AS balance FROM transactions WHERE account_id = 4;' },
          ],
          successLine: { en: 'Scroll down: one line shows -3000.00. Overdrawn!', mr: 'खाली स्क्रोल करा: एका ओळीत -3000.00. ओव्हरड्रॉ!' },
        },
        {
          kind: 'sql',
          prompt: { en: 'Across ALL accounts: show the account_id of every account whose running balance ever went below zero (each account once).', mr: 'सगळ्या अकाउंट्समध्ये: ज्यांची चालू शिल्लक कधीतरी शून्याखाली गेली अशा प्रत्येक अकाउंटचा account_id दाखवा (प्रत्येक अकाउंट एकदाच).' },
          starter: 'WITH r AS (\n  SELECT account_id,\n    SUM(amount) OVER (\n      \n    ) AS balance\n  FROM transactions\n)\nSELECT DISTINCT account_id FROM r WHERE balance < 0',
          expected: 'WITH r AS (SELECT account_id, SUM(amount) OVER (PARTITION BY account_id ORDER BY txn_time) AS balance FROM transactions) SELECT DISTINCT account_id FROM r WHERE balance < 0',
          hints: [
            { en: 'Each account needs its own passbook.', mr: 'प्रत्येक अकाउंटला स्वतःचं पासबुक हवं.' },
            { en: 'PARTITION BY account_id ORDER BY txn_time', mr: 'PARTITION BY account_id ORDER BY txn_time' },
            { en: 'DISTINCT shows each account once, even if it was negative for several lines.', mr: 'अनेक ओळी उणे असल्या तरी DISTINCT प्रत्येक अकाउंट एकदाच दाखवतो.' },
            { en: 'WITH r AS (SELECT account_id, SUM(amount) OVER (PARTITION BY account_id ORDER BY txn_time) AS balance FROM transactions) SELECT DISTINCT account_id FROM r WHERE balance < 0;', mr: 'WITH r AS (SELECT account_id, SUM(amount) OVER (PARTITION BY account_id ORDER BY txn_time) AS balance FROM transactions) SELECT DISTINCT account_id FROM r WHERE balance < 0;' },
          ],
          successLine: { en: 'Accounts 4 and 13. Both final balances look healthy, which is why nobody noticed.', mr: 'अकाउंट्स 4 आणि 13. दोघांची शेवटची शिल्लक चांगली दिसते, म्हणूनच कोणाच्या लक्षात आलं नाही.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Amounts +100, -30, +50 in time order. Running totals?', mr: 'वेळेच्या क्रमाने रकमा +100, -30, +50. चालू बेरीज?' },
        options: ['100, 70, 120', '100, -30, 50', '120, 120, 120', '100, 130, 180'],
        answer: 0,
        explain: { en: '100 → 100-30 = 70 → 70+50 = 120.', mr: '100 → 100-30 = 70 → 70+50 = 120.' },
      },
      {
        q: { en: 'SUM(amount) OVER () with no ORDER BY gives...', mr: 'ORDER BY नसलेला SUM(amount) OVER () काय देतो?' },
        options: [{ en: 'A running total', mr: 'चालू बेरीज' }, { en: 'The grand total on every row', mr: 'प्रत्येक row वर एकूण बेरीज' }, { en: 'An error', mr: 'एरर' }, 'NULL'],
        answer: 1,
        explain: { en: 'No order means the window is all rows.', mr: 'क्रम नाही म्हणजे window म्हणजे सगळ्या rows.' },
      },
      {
        q: { en: 'Why can a healthy final balance hide a problem?', mr: 'चांगली शेवटची शिल्लक समस्या कशी लपवू शकते?' },
        options: [{ en: 'It cannot', mr: 'लपवू शकत नाही' }, { en: 'The balance may have dipped below zero earlier and recovered', mr: 'शिल्लक आधी शून्याखाली जाऊन परत वर आली असेल' }, { en: 'Banks round numbers', mr: 'बँका आकडे गोल करतात' }, { en: 'Because of NULL', mr: 'NULL मुळे' }],
        answer: 1,
        explain: { en: 'That is exactly what accounts 4 and 13 did.', mr: 'अकाउंट्स 4 आणि 13 नी नेमकं हेच केलं.' },
      },
      {
        q: { en: 'Which clause gives every account its own running total?', mr: 'कोणता क्लॉज प्रत्येक अकाउंटला स्वतःची चालू बेरीज देतो?' },
        options: ['GROUP BY account_id', 'PARTITION BY account_id', 'ORDER BY account_id', 'WHERE account_id'],
        answer: 1,
        explain: { en: 'PARTITION BY restarts the sum per account.', mr: 'PARTITION BY प्रत्येक अकाउंटसाठी बेरीज पुन्हा सुरू करतो.' },
      },
    ],
    recap: { line: { en: 'SUM() OVER (PARTITION BY owner ORDER BY time) = the passbook balance after every line.', mr: 'SUM() OVER (PARTITION BY मालक ORDER BY वेळ) = प्रत्येक ओळीनंतरची पासबुक शिल्लक.' }, icon: '📒' },
  },

  // ───────────────────────── 3.5 Set operations
  {
    id: 'c3-5',
    code: '3.5',
    level: 'advanced',
    title: { en: 'Packing Checklist', mr: 'सामानाची यादी' },
    skill: 'UNION, INTERSECT & EXCEPT',
    realLife: {
      place: 'home',
      title: { en: 'The packing checklist before a trip', mr: 'प्रवासाआधीची सामानाची यादी' },
      story: {
        en: 'Before leaving for Goa you compare your checklist with the suitcase. Items on the list but not in the suitcase: forgotten. Items in the suitcase but not on the list: extra. Comparing two lists is something you already do.',
        mr: 'गोव्याला निघण्याआधी तुम्ही यादी आणि बॅग यांची तुलना करता. यादीत आहे पण बॅगेत नाही: विसरलं. बॅगेत आहे पण यादीत नाही: जास्तीचं. दोन याद्यांची तुलना तुम्ही आधीच करता.',
      },
      scene: {
        type: 'match',
        leftTitle: { en: 'Checklist', mr: 'यादी' },
        rightTitle: { en: 'Suitcase', mr: 'बॅग' },
        left: [
          { icon: '🩳', label: 'Shorts', mr: 'शॉर्ट्स' },
          { icon: '🕶️', label: 'Sunglasses', mr: 'गॉगल' },
          { icon: '🔌', label: 'Charger', mr: 'चार्जर' },
          { icon: '🪥', label: 'Toothbrush', mr: 'टूथब्रश' },
        ],
        right: [
          { icon: '🕶️', label: 'Sunglasses', mr: 'गॉगल' },
          { icon: '🩳', label: 'Shorts', mr: 'शॉर्ट्स' },
          { icon: '🪥', label: 'Toothbrush', mr: 'टूथब्रश' },
        ],
        links: [
          [0, 1],
          [1, 0],
          [3, 2],
        ],
        mode: 'left',
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'The card network sends us a settlement file every night. Finance says the totals do not match our ledger.', mr: 'कार्ड नेटवर्क दर रात्री सेटलमेंट फाइल पाठवतं. फायनान्स म्हणतं बेरीज आपल्या लेजरशी जुळत नाही.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Two lists of transaction ids. Something is on one list and not the other.', mr: 'व्यवहार id च्या दोन याद्या. काहीतरी एका यादीत आहे आणि दुसऱ्यात नाही.' } },
      ],
      problem: { en: 'Reconciliation (matching two systems) is a core banking test. Comparing thousands of ids by eye is impossible.', mr: 'Reconciliation (दोन सिस्टम्स जुळवणं) ही बँकिंगमधली मुख्य टेस्ट. हजारो id डोळ्यांनी तुलना करणं अशक्य.' },
      solution: { en: 'EXCEPT returns what is in the first list but not the second. INTERSECT returns what is in both. UNION combines lists.', mr: 'EXCEPT पहिल्या यादीत आहे पण दुसऱ्यात नाही ते देतो. INTERSECT दोन्हीत असलेलं देतो. UNION याद्या एकत्र करतो.' },
    },
    lesson: [
      { en: 'A EXCEPT B: rows in A that are not in B. Order matters: B EXCEPT A is a different question.', mr: 'A EXCEPT B: A मध्ये आहेत पण B मध्ये नाहीत अशा rows. क्रम महत्त्वाचा: B EXCEPT A हा वेगळा प्रश्न.' },
      { en: 'A INTERSECT B: rows in both. A UNION B: rows in either, duplicates removed (UNION ALL keeps them).', mr: 'A INTERSECT B: दोन्हीत असलेल्या rows. A UNION B: कोणत्याही एकात असलेल्या, डुप्लिकेट काढून (UNION ALL ठेवतो).' },
      { en: 'Both queries must return the same number of columns with compatible types.', mr: 'दोन्ही क्वेरीजमध्ये columns ची संख्या आणि प्रकार सारखे हवेत.' },
    ],
    syntax: {
      template: 'SELECT id FROM list_a\nEXCEPT        -- or INTERSECT / UNION\nSELECT id FROM list_b;',
      parts: [
        { code: 'EXCEPT', means: { en: 'in the first, missing from the second', mr: 'पहिल्यात आहे, दुसऱ्यात नाही' } },
        { code: 'INTERSECT', means: { en: 'in both', mr: 'दोन्हीत' } },
        { code: 'UNION / UNION ALL', means: { en: 'all together (without / with duplicates)', mr: 'सगळं एकत्र (डुप्लिकेटशिवाय / सह)' } },
      ],
      example: [
        { code: 'SELECT item FROM checklist', note: { en: 'what should be packed', mr: 'काय भरायला हवं' } },
        { code: 'EXCEPT', note: { en: 'minus', mr: 'वजा' } },
        { code: 'SELECT item FROM suitcase;', note: { en: 'what is packed = forgotten items', mr: 'काय भरलंय = विसरलेल्या वस्तू' } },
      ],
      pitfall: { en: 'EXCEPT compares whole rows. If you include amount and it differs by a paisa, the row counts as "missing".', mr: 'EXCEPT संपूर्ण rows ची तुलना करतो. amount घेतलं आणि एका पैशाने फरक असेल, तर ती row "गायब" धरली जाते.' },
    },
    practice: {
      intro: { en: 'Reconcile the ledger with the card network.', mr: 'लेजर आणि कार्ड नेटवर्क जुळवा.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'List the ids of PAYMENT transactions in our ledger that never appear in settlements (txn_id).', mr: 'आपल्या लेजरमधल्या PAYMENT व्यवहारांचे असे id दाखवा जे settlements (txn_id) मध्ये कधीच आले नाहीत.' },
          expected: "SELECT id FROM transactions WHERE kind = 'PAYMENT' EXCEPT SELECT txn_id FROM settlements",
          hints: [
            { en: 'First list: payment ids from transactions. Second list: txn_id from settlements.', mr: 'पहिली यादी: transactions मधले payment id. दुसरी: settlements मधले txn_id.' },
            { en: 'Put EXCEPT between them.', mr: 'त्यांच्यामध्ये EXCEPT ठेवा.' },
            { en: "SELECT id FROM transactions WHERE kind = 'PAYMENT' EXCEPT SELECT ...", mr: "SELECT id FROM transactions WHERE kind = 'PAYMENT' EXCEPT SELECT ..." },
            { en: "SELECT id FROM transactions WHERE kind = 'PAYMENT' EXCEPT SELECT txn_id FROM settlements;", mr: "SELECT id FROM transactions WHERE kind = 'PAYMENT' EXCEPT SELECT txn_id FROM settlements;" },
          ],
          successLine: { en: '4 payments the network never settled: the bank is owed this money.', mr: 'नेटवर्कने कधीच सेटल न केलेली 4 payments: हे पैसे बँकेला येणं बाकी आहे.' },
        },
        {
          kind: 'sql',
          prompt: { en: 'Now the other direction: list txn_ids in settlements that do not exist in our transactions at all.', mr: 'आता उलट दिशा: settlements मधले असे txn_id दाखवा जे आपल्या transactions मध्ये अजिबात नाहीत.' },
          expected: 'SELECT txn_id FROM settlements EXCEPT SELECT id FROM transactions',
          hints: [
            { en: 'Swap the two lists.', mr: 'दोन्ही याद्यांची जागा बदला.' },
            { en: 'SELECT txn_id FROM settlements EXCEPT SELECT id FROM transactions', mr: 'SELECT txn_id FROM settlements EXCEPT SELECT id FROM transactions' },
          ],
          successLine: { en: '2 "ghost" settlements: money moved for transactions the bank never made. Escalate!', mr: '2 "भुताटकी" सेटलमेंट्स: बँकेने कधी न केलेल्या व्यवहारांसाठी पैसे हलले. वरिष्ठांना कळवा!' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'A = {1,2,3,4}, B = {3,4,5}. What is A EXCEPT B?', mr: 'A = {1,2,3,4}, B = {3,4,5}. A EXCEPT B काय?' },
        options: ['{1,2}', '{5}', '{3,4}', '{1,2,3,4,5}'],
        answer: 0,
        explain: { en: 'In A, not in B: 1 and 2.', mr: 'A मध्ये आहे, B मध्ये नाही: 1 आणि 2.' },
      },
      {
        q: { en: 'Same sets. What is A INTERSECT B?', mr: 'त्याच संचांसाठी A INTERSECT B काय?' },
        options: ['{1,2}', '{3,4}', '{5}', '{}'],
        answer: 1,
        explain: { en: 'In both: 3 and 4.', mr: 'दोन्हीत: 3 आणि 4.' },
      },
      {
        q: { en: 'UNION vs UNION ALL?', mr: 'UNION आणि UNION ALL मधला फरक?' },
        options: [{ en: 'No difference', mr: 'फरक नाही' }, { en: 'UNION removes duplicates; UNION ALL keeps them', mr: 'UNION डुप्लिकेट काढतो; UNION ALL ठेवतो' }, { en: 'UNION ALL removes duplicates', mr: 'UNION ALL डुप्लिकेट काढतो' }, { en: 'UNION needs ORDER BY', mr: 'UNION ला ORDER BY हवा' }],
        answer: 1,
        explain: { en: 'In reconciliation, UNION ALL is safer when duplicates are themselves a bug to catch.', mr: 'Reconciliation मध्ये डुप्लिकेट हाच बग असेल तर UNION ALL सुरक्षित.' },
      },
      {
        q: { en: 'Which LEFT JOIN query gives the same result as "A EXCEPT B" on ids?', mr: 'id वर "A EXCEPT B" सारखाच निकाल कोणती LEFT JOIN क्वेरी देते?' },
        options: [
          'SELECT a.id FROM a JOIN b ON b.id = a.id',
          'SELECT a.id FROM a LEFT JOIN b ON b.id = a.id WHERE b.id IS NULL',
          'SELECT b.id FROM b LEFT JOIN a ON a.id = b.id',
          'SELECT a.id FROM a WHERE a.id = NULL',
        ],
        answer: 1,
        explain: { en: 'Same "who never replied?" pattern from 1.5. Two tools, one idea.', mr: '1.5 मधलाच "कोणी उत्तर दिलं नाही?" पॅटर्न. दोन साधनं, एक कल्पना.' },
      },
    ],
    recap: { line: { en: 'EXCEPT = forgotten items. INTERSECT = in both. UNION = everything.', mr: 'EXCEPT = विसरलेल्या वस्तू. INTERSECT = दोन्हीत. UNION = सगळं.' }, icon: '🧳' },
  },

  // ───────────────────────── 3.6 EXPLAIN & indexes
  {
    id: 'c3-6',
    code: '3.6',
    level: 'advanced',
    title: { en: 'Reading Every Page', mr: 'प्रत्येक पान वाचणं' },
    skill: 'EXPLAIN & indexes',
    realLife: {
      place: 'library',
      title: { en: 'Finding a topic in a 600-page textbook', mr: '600 पानांच्या पुस्तकात एक विषय शोधणं' },
      story: {
        en: 'To find "photosynthesis" you can read all 600 pages, or turn to the index at the back, which says "page 212". The index is extra pages to print and keep updated, but it makes finding things instant.',
        mr: '"प्रकाशसंश्लेषण" शोधायला तुम्ही सगळी 600 पानं वाचू शकता, किंवा मागची सूची उघडू शकता, जी सांगते "पान 212". सूची छापायला आणि अद्ययावत ठेवायला जास्तीची पानं लागतात, पण शोध क्षणात होतो.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📖', label: 'Open the index', mr: 'सूची उघडा' },
          { icon: '🔤', label: '"P" → photosynthesis', mr: '"प" → प्रकाशसंश्लेषण' },
          { icon: '📄', label: 'Page 212', mr: 'पान 212' },
          { icon: '✅', label: 'Found in seconds', mr: 'काही सेकंदांत सापडलं' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'rex', mood: 'angry', text: { en: 'The "search audit log" screen takes 9 seconds. Users think the app is broken.', mr: '"ऑडिट लॉग शोधा" स्क्रीनला 9 सेकंद लागतात. वापरकर्त्यांना वाटतं ॲप बिघडलंय.' } },
        { who: 'theo', mood: 'worried', text: { en: 'It works fine on my machine with 100 rows...', mr: 'माझ्या मशीनवर 100 rows सह छान चालतं...' } },
        { who: 'meera', mood: 'neutral', text: { en: 'Production has 60,000 rows, {name}. Let us ask the database HOW it runs the query.', mr: 'प्रॉडक्शनमध्ये 60,000 rows आहेत, {name}. डेटाबेसलाच विचारू की तो क्वेरी कशी चालवतो.' } },
      ],
      problem: { en: 'A query that is fast on small test data can be painfully slow on real data. Functional tests pass; users suffer.', mr: 'छोट्या टेस्ट डेटावर वेगवान असलेली क्वेरी खऱ्या डेटावर अतिशय हळू होऊ शकते. फंक्शनल टेस्ट्स पास; वापरकर्ते त्रस्त.' },
      solution: { en: 'EXPLAIN shows the query plan. "Seq Scan" = reading every page; "Index Scan" = using the index. Testers use it to catch slow queries before release.', mr: 'EXPLAIN क्वेरी प्लॅन दाखवतो. "Seq Scan" = प्रत्येक पान वाचणं; "Index Scan" = सूची वापरणं. टेस्टर्स रिलीजआधी हळू क्वेरीज पकडायला वापरतात.' },
    },
    lesson: [
      { en: 'EXPLAIN SELECT ... does not run the query; it prints the plan the database would use.', mr: 'EXPLAIN SELECT ... क्वेरी चालवत नाही; डेटाबेस कोणता प्लॅन वापरेल ते दाखवतो.' },
      { en: 'Seq Scan reads the whole table. Index Scan jumps straight to matching rows. Primary keys get an index automatically.', mr: 'Seq Scan संपूर्ण टेबल वाचतो. Index Scan थेट जुळणाऱ्या rows वर जातो. Primary keys ला index आपोआप मिळतो.' },
      { en: 'Indexes speed up reads but slow down writes and use space. Add them for columns you filter on often.', mr: 'Indexes वाचन वेगवान करतात पण लिहिणं हळू करतात आणि जागा घेतात. सतत फिल्टर करता त्या columns साठी जोडा.' },
    ],
    syntax: {
      template: 'EXPLAIN SELECT * FROM t WHERE col = value;\n\nCREATE INDEX idx_name ON t (col);',
      parts: [
        { code: 'EXPLAIN', means: { en: 'show the plan, do not run', mr: 'प्लॅन दाखवा, चालवू नका' } },
        { code: 'Seq Scan', means: { en: 'reads every row (slow on big tables)', mr: 'प्रत्येक row वाचतो (मोठ्या टेबलवर हळू)' } },
        { code: 'Index Scan', means: { en: 'uses an index (fast lookup)', mr: 'index वापरतो (जलद शोध)' } },
        { code: 'CREATE INDEX', means: { en: 'build the "index at the back"', mr: 'मागची "सूची" तयार करा' } },
      ],
      example: [
        { code: 'EXPLAIN', note: { en: 'how will you run this?', mr: 'हे कसं चालवशील?' } },
        { code: "SELECT * FROM textbook WHERE topic = 'photosynthesis';", note: { en: 'the question', mr: 'प्रश्न' } },
        { code: '-- Seq Scan on textbook', note: { en: 'reading all 600 pages', mr: 'सगळी 600 पानं वाचतोय' } },
        { code: 'CREATE INDEX idx_topic ON textbook (topic);', note: { en: 'print an index', mr: 'सूची छापा' } },
      ],
      pitfall: { en: 'In this console, cost numbers may look huge. Focus on the words: Seq Scan vs Index Scan.', mr: 'या कन्सोलमध्ये cost चे आकडे खूप मोठे दिसू शकतात. शब्दांकडे लक्ष द्या: Seq Scan विरुद्ध Index Scan.' },
    },
    practice: {
      intro: { en: 'audit_log has 60,000 rows. id is the primary key; note has no index.', mr: 'audit_log मध्ये 60,000 rows आहेत. id primary key आहे; note ला index नाही.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: "Run EXPLAIN SELECT * FROM audit_log WHERE id = 4242 in the console. Which plan does the database use?", mr: 'कन्सोलमध्ये EXPLAIN SELECT * FROM audit_log WHERE id = 4242 चालवा. डेटाबेस कोणता प्लॅन वापरतो?' },
          sandbox: true,
          sandboxStarter: 'EXPLAIN SELECT * FROM audit_log WHERE id = 4242',
          options: ['Seq Scan on audit_log', 'Index Scan using audit_log_pkey', 'Hash Join', 'Sort'],
          correct: [1],
          explain: { en: 'id is the primary key, so it has an index. The database jumps straight to row 4242.', mr: 'id हा primary key आहे, म्हणून त्याला index आहे. डेटाबेस थेट row 4242 वर जातो.' },
          hints: [
            { en: 'Click Run and read the first line of the result.', mr: 'Run दाबा आणि निकालाची पहिली ओळ वाचा.' },
            { en: 'Primary keys come with an index called <table>_pkey.', mr: 'Primary keys सोबत <table>_pkey नावाचा index येतो.' },
          ],
        },
        {
          kind: 'choice',
          prompt: { en: "Now run EXPLAIN SELECT * FROM audit_log WHERE note = 'event 4242'. What do you see, and what would fix it?", mr: "आता EXPLAIN SELECT * FROM audit_log WHERE note = 'event 4242' चालवा. काय दिसतं, आणि काय उपाय आहे?" },
          sandbox: true,
          sandboxStarter: "EXPLAIN SELECT * FROM audit_log WHERE note = 'event 4242'",
          options: [
            { en: 'Index Scan; nothing to fix', mr: 'Index Scan; काही दुरुस्त करायचं नाही' },
            { en: 'Seq Scan; add an index: CREATE INDEX ON audit_log (note)', mr: 'Seq Scan; index जोडा: CREATE INDEX ON audit_log (note)' },
            { en: 'Seq Scan; add LIMIT 1', mr: 'Seq Scan; LIMIT 1 जोडा' },
            { en: 'Seq Scan; delete old rows', mr: 'Seq Scan; जुन्या rows डिलीट करा' },
          ],
          correct: [1],
          explain: { en: 'No index on note means reading all 60,000 rows. An index turns it into a lookup. Report it with the EXPLAIN output as evidence.', mr: 'note वर index नाही म्हणजे सगळ्या 60,000 rows वाचणं. Index मुळे तो थेट शोध बनतो. EXPLAIN चा निकाल पुरावा म्हणून जोडून रिपोर्ट करा.' },
          hints: [
            { en: 'Read the first word of the plan.', mr: 'प्लॅनचा पहिला शब्द वाचा.' },
            { en: 'Which option builds "the index at the back of the book"?', mr: 'कोणता पर्याय "पुस्तकामागची सूची" तयार करतो?' },
          ],
          successLine: { en: 'Theo adds the index. The screen drops from 9 seconds to 40 ms.', mr: 'थिओ index जोडतो. स्क्रीन 9 सेकंदांवरून 40 ms वर येते.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Does EXPLAIN (without ANALYZE) run the query?', mr: 'EXPLAIN (ANALYZE शिवाय) क्वेरी चालवतो का?' },
        options: [{ en: 'Yes', mr: 'हो' }, { en: 'No, it only shows the plan', mr: 'नाही, फक्त प्लॅन दाखवतो' }, { en: 'Only for SELECT', mr: 'फक्त SELECT साठी' }, { en: 'Only twice', mr: 'फक्त दोनदा' }],
        answer: 1,
        explain: { en: 'EXPLAIN ANALYZE runs it and shows real timings; plain EXPLAIN only plans.', mr: 'EXPLAIN ANALYZE चालवून खरी वेळ दाखवतो; साधा EXPLAIN फक्त प्लॅन करतो.' },
      },
      {
        q: { en: 'What does "Seq Scan" mean?', mr: '"Seq Scan" म्हणजे काय?' },
        options: [{ en: 'Reading every row of the table', mr: 'टेबलची प्रत्येक row वाचणं' }, { en: 'Using an index', mr: 'Index वापरणं' }, { en: 'Sorting', mr: 'क्रम लावणं' }, { en: 'Joining', mr: 'जोडणं' }],
        answer: 0,
        explain: { en: 'Sequential scan = read all 600 pages.', mr: 'Sequential scan = सगळी 600 पानं वाचणं.' },
      },
      {
        q: { en: 'Downside of adding many indexes?', mr: 'खूप indexes जोडण्याचा तोटा?' },
        options: [{ en: 'None', mr: 'काहीच नाही' }, { en: 'Slower INSERT/UPDATE and more storage', mr: 'INSERT/UPDATE हळू आणि जास्त जागा' }, { en: 'Wrong results', mr: 'चुकीचे निकाल' }, { en: 'SELECT stops working', mr: 'SELECT चालणं बंद होतं' }],
        answer: 1,
        explain: { en: 'Every write must also update each index.', mr: 'प्रत्येक लिखाणासोबत प्रत्येक index पण अद्ययावत करावा लागतो.' },
      },
      {
        q: { en: 'Why can a query pass on test data and fail users in production?', mr: 'क्वेरी टेस्ट डेटावर पास होऊन प्रॉडक्शनमध्ये वापरकर्त्यांना त्रास का देऊ शकते?' },
        options: [{ en: 'Production has far more rows, so a missing index hurts', mr: 'प्रॉडक्शनमध्ये खूप जास्त rows असतात, त्यामुळे गायब index त्रास देतो' }, { en: 'SQL works differently in production', mr: 'प्रॉडक्शनमध्ये SQL वेगळं चालतं' }, { en: 'Testers use different SQL', mr: 'टेस्टर्स वेगळं SQL वापरतात' }, { en: 'It cannot', mr: 'असं होऊ शकत नाही' }],
        answer: 0,
        explain: { en: 'Test with realistic data volumes. That leads into performance testing in Act 7.', mr: 'खऱ्यासारख्या डेटा प्रमाणावर टेस्ट करा. यातूनच Act 7 मधलं performance testing सुरू होतं.' },
      },
    ],
    recap: { line: { en: 'EXPLAIN shows the plan. Seq Scan = every page, Index Scan = the index at the back.', mr: 'EXPLAIN प्लॅन दाखवतो. Seq Scan = प्रत्येक पान, Index Scan = मागची सूची.' }, icon: '🔖' },
  },

  // ───────────────────────── 3.7 BOSS
  {
    id: 'c3-7',
    code: '3.7',
    level: 'advanced',
    title: { en: 'Boss: The Ledger Audit', mr: 'बॉस: लेजर ऑडिट' },
    skill: 'Financial reconciliation',
    isBoss: true,
    realLife: {
      place: 'office',
      title: { en: 'The CA\'s year-end audit', mr: 'CA चं वर्षअखेरचं ऑडिट' },
      story: {
        en: 'At year end a Chartered Accountant does not trust any single report. She totals the double entries, rebuilds balances from scratch, and ticks every bank statement line against the books. Anything that does not tie out goes in the audit report.',
        mr: 'वर्षअखेरीस चार्टर्ड अकाउंटंट कोणत्याही एका रिपोर्टवर विश्वास ठेवत नाही. ती दुहेरी नोंदींची बेरीज करते, शिल्लक सुरुवातीपासून पुन्हा काढते, आणि बँक स्टेटमेंटची प्रत्येक ओळ वहीशी जुळवते. जे जुळत नाही ते ऑडिट रिपोर्टमध्ये जातं.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🔁', label: 'Total the duplicates', mr: 'डुप्लिकेटची बेरीज' },
          { icon: '📒', label: 'Rebuild balances', mr: 'शिल्लक पुन्हा काढा' },
          { icon: '✔️', label: 'Tick against statements', mr: 'स्टेटमेंटशी जुळवा' },
          { icon: '📑', label: 'Audit report', mr: 'ऑडिट रिपोर्ट' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'gremlin', mood: 'smug', text: { en: '>> final round. the regulator arrives tomorrow. one wrong number and Ledgerly loses its licence. ⌁', mr: '>> शेवटची फेरी. नियामक उद्या येतोय. एक चुकीचा आकडा आणि Ledgerly चा परवाना जाईल. ⌁' } },
        { who: 'sam', mood: 'worried', text: { en: 'I need three numbers for the audit report, and a recommendation.', mr: 'ऑडिट रिपोर्टसाठी मला तीन आकडे आणि एक शिफारस हवी.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Everything you learned at Ledgerly, {name}. 2 hints per step. Go.', mr: 'Ledgerly मध्ये शिकलेलं सगळं, {name}. प्रत्येक स्टेपला 2 हिंट्स. चल.' } },
      ],
      problem: { en: 'Money moved wrongly in three ways: double charges, hidden overdrafts and unsettled payments. The regulator wants exact amounts.', mr: 'पैसे तीन प्रकारे चुकीचे हलले: दुहेरी कपात, लपलेले ओव्हरड्राफ्ट आणि सेटल न झालेली payments. नियामकाला नेमक्या रकमा हव्यात.' },
      solution: { en: 'Combine CTEs, LAG, running totals and NOT EXISTS / EXCEPT into a single audit you can rerun any time.', mr: 'CTE, LAG, चालू बेरीज आणि NOT EXISTS / EXCEPT एकत्र करून कधीही पुन्हा चालवता येईल असं ऑडिट बनवा.' },
    },
    lesson: [
      { en: 'Aggregate on top of a window result: wrap the window query in a CTE, then SUM or MIN outside it.', mr: 'Window निकालावर aggregate: window क्वेरी CTE मध्ये गुंडाळा, मग बाहेर SUM किंवा MIN करा.' },
      { en: 'Auditors want amounts, not just row counts.', mr: 'ऑडिटर्सना फक्त rows ची संख्या नाही, रकमा हव्यात.' },
      { en: 'A good recommendation fixes the cause, not just the symptoms.', mr: 'चांगली शिफारस फक्त लक्षणं नाही, कारण दुरुस्त करते.' },
    ],
    syntax: {
      template: 'WITH w AS ( ...window functions... )\nSELECT SUM(-amount) FROM w WHERE ...;',
      parts: [
        { code: 'WITH w AS (...)', means: { en: 'compute the window columns first', mr: 'आधी window columns काढा' } },
        { code: 'SUM / MIN outside', means: { en: 'then aggregate the result', mr: 'मग निकालाचं aggregate करा' } },
        { code: 'NOT EXISTS', means: { en: 'rows with no match in another table', mr: 'दुसऱ्या टेबलमध्ये जुळणी नसलेल्या rows' } },
      ],
      example: [
        { code: 'WITH r AS (', note: { en: 'rebuild passbooks', mr: 'पासबुक पुन्हा तयार करा' } },
        { code: '  SELECT account_id, SUM(amount) OVER (PARTITION BY account_id ORDER BY txn_time) AS balance FROM transactions', note: { en: 'running balance', mr: 'चालू शिल्लक' } },
        { code: ')', note: { en: '', mr: '' } },
        { code: 'SELECT account_id, MIN(balance) FROM r GROUP BY account_id;', note: { en: 'lowest point of each passbook', mr: 'प्रत्येक पासबुकचा सर्वात खालचा बिंदू' } },
      ],
    },
    practice: {
      intro: { en: 'Defeat the Gremlin. Each step drains its health.', mr: 'ग्रेमलिनला हरवा. प्रत्येक स्टेप त्याची ताकद कमी करते.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'Step 1: What is the TOTAL amount double-charged (as a positive number)? Return a single value.', mr: 'स्टेप 1: एकूण किती रक्कम दोनदा कापली गेली (धन संख्या म्हणून)? एकच व्हॅल्यू द्या.' },
          starter: `${DUP_CTE}\nSELECT \nFROM w\n${DUP_WHERE}`,
          expected: `${DUP_CTE} SELECT SUM(-amount) FROM w ${DUP_WHERE}`,
          hints: [
            { en: 'The CTE and WHERE from 3.3 are ready. You only need the SELECT.', mr: '3.3 मधला CTE आणि WHERE तयार आहेत. फक्त SELECT हवा.' },
            { en: 'Payments are negative: SUM(-amount)', mr: 'Payments ऋण आहेत: SUM(-amount)' },
          ],
          successLine: { en: '₹21,407 to refund.', mr: '₹21,407 परत करायचे.' },
        },
        {
          kind: 'sql',
          prompt: { en: 'Step 2: For each account that went below zero, show account_id and its LOWEST running balance.', mr: 'स्टेप 2: शून्याखाली गेलेल्या प्रत्येक अकाउंटसाठी account_id आणि त्याची सर्वात कमी चालू शिल्लक दाखवा.' },
          expected: 'WITH r AS (SELECT account_id, SUM(amount) OVER (PARTITION BY account_id ORDER BY txn_time) AS balance FROM transactions) SELECT account_id, MIN(balance) FROM r WHERE balance < 0 GROUP BY account_id',
          hints: [
            { en: 'Rebuild the passbooks in a CTE (3.4), then GROUP BY account_id outside.', mr: 'पासबुक CTE मध्ये पुन्हा तयार करा (3.4), मग बाहेर GROUP BY account_id.' },
            { en: '... SELECT account_id, MIN(balance) FROM r WHERE balance < 0 GROUP BY account_id', mr: '... SELECT account_id, MIN(balance) FROM r WHERE balance < 0 GROUP BY account_id' },
          ],
          successLine: { en: 'Two accounts, each ₹3,000 overdrawn without a facility.', mr: 'दोन अकाउंट्स, प्रत्येक सुविधा नसताना ₹3,000 ओव्हरड्रॉ.' },
        },
        {
          kind: 'sql',
          prompt: { en: 'Step 3: List id and amount of every PAYMENT with no matching settlement. Use NOT EXISTS this time.', mr: 'स्टेप 3: सेटलमेंट नसलेल्या प्रत्येक PAYMENT चे id आणि amount दाखवा. या वेळी NOT EXISTS वापरा.' },
          expected: "SELECT t.id, t.amount FROM transactions t WHERE t.kind = 'PAYMENT' AND NOT EXISTS (SELECT 1 FROM settlements s WHERE s.txn_id = t.id)",
          hints: [
            { en: 'NOT EXISTS (SELECT 1 FROM settlements s WHERE s.txn_id = t.id)', mr: 'NOT EXISTS (SELECT 1 FROM settlements s WHERE s.txn_id = t.id)' },
            { en: "Do not forget t.kind = 'PAYMENT'.", mr: "t.kind = 'PAYMENT' विसरू नका." },
          ],
          successLine: { en: '4 unsettled payments, with amounts for the report.', mr: '4 सेटल न झालेली payments, रिपोर्टसाठी रकमांसह.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Step 4: Look at the double charges: each pair shares the SAME idem_key. What is the best fix to recommend?', mr: 'स्टेप 4: दुहेरी कपाती पाहा: प्रत्येक जोडीचा idem_key एकच आहे. कोणता उपाय सुचवावा?' },
          sandbox: true,
          sandboxStarter: 'SELECT idem_key, COUNT(*)\nFROM transactions\nGROUP BY idem_key\nHAVING COUNT(*) > 1',
          options: [
            { en: 'Ask customers not to tap twice', mr: 'ग्राहकांना दोनदा न दाबायला सांगा' },
            { en: 'Add a UNIQUE constraint on idem_key, so a retried payment cannot be stored twice', mr: 'idem_key वर UNIQUE constraint जोडा, म्हणजे पुन्हा केलेलं payment दोनदा साठवलं जाणार नाही' },
            { en: 'Refund manually every month', mr: 'दर महिन्याला हाताने परतावा द्या' },
            { en: 'Delete one of each pair', mr: 'प्रत्येक जोडीतली एक डिलीट करा' },
          ],
          correct: [1],
          explain: { en: 'Fix the cause at the database level. In Act 2 (API testing) you will test the same rule at the API: the idempotency key.', mr: 'कारण डेटाबेसच्या पातळीवरच दुरुस्त करा. Act 2 (API testing) मध्ये हाच नियम API वर तपासशील: idempotency key.' },
          hints: [
            { en: 'Which option makes the duplicate impossible, forever?', mr: 'कोणता पर्याय डुप्लिकेट कायमचं अशक्य करतो?' },
            { en: 'Remember constraints from 2.5.', mr: '2.5 मधले constraints आठवा.' },
          ],
          successLine: { en: 'The regulator signs off. Ledgerly keeps its licence.', mr: 'नियामक मंजुरी देतो. Ledgerly चा परवाना कायम.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'How do you SUM over the result of a window function?', mr: 'Window function च्या निकालावर SUM कसं कराल?' },
        options: [{ en: 'SUM(LAG(amount))', mr: 'SUM(LAG(amount))' }, { en: 'Compute the window in a CTE, then SUM outside', mr: 'Window CTE मध्ये काढा, मग बाहेर SUM करा' }, { en: 'It is impossible', mr: 'अशक्य आहे' }, { en: 'Use HAVING', mr: 'HAVING वापरा' }],
        answer: 1,
        explain: { en: 'Window functions cannot be nested inside aggregates directly.', mr: 'Window functions थेट aggregates मध्ये घालता येत नाहीत.' },
      },
      {
        q: { en: 'NOT EXISTS vs EXCEPT for unsettled payments: which can also return the amount?', mr: 'सेटल न झालेल्या payments साठी NOT EXISTS की EXCEPT: कोणतं रक्कमही देऊ शकतं?' },
        options: ['EXCEPT', 'NOT EXISTS', { en: 'Neither', mr: 'कोणतंच नाही' }, { en: 'Both equally, always', mr: 'दोन्ही नेहमी सारखेच' }],
        answer: 1,
        explain: { en: 'EXCEPT compares whole rows, so extra columns change the comparison. NOT EXISTS filters rows and lets you SELECT any columns.', mr: 'EXCEPT संपूर्ण rows ची तुलना करतो, त्यामुळे जास्तीचे columns तुलना बदलतात. NOT EXISTS rows फिल्टर करतो आणि कोणतेही columns SELECT करू देतो.' },
      },
      {
        q: { en: 'Which query layer best prevents double charges?', mr: 'दुहेरी कपात सर्वात चांगली कोणत्या पातळीवर रोखली जाते?' },
        options: [{ en: 'A monthly report', mr: 'मासिक रिपोर्ट' }, { en: 'A UNIQUE constraint on the idempotency key', mr: 'Idempotency key वर UNIQUE constraint' }, { en: 'A bigger server', mr: 'मोठा सर्व्हर' }, { en: 'More testers', mr: 'जास्त टेस्टर्स' }],
        answer: 1,
        explain: { en: 'Prevention beats detection.', mr: 'शोधण्यापेक्षा रोखणं चांगलं.' },
      },
      {
        q: { en: 'Your audit queries should be...', mr: 'तुमच्या ऑडिट क्वेरीज कशा असाव्यात?' },
        options: [{ en: 'Run once and deleted', mr: 'एकदा चालवून डिलीट' }, { en: 'Saved, reviewed and rerun automatically (for example nightly in CI)', mr: 'जतन, तपासलेल्या आणि आपोआप पुन्हा चालणाऱ्या (उदा. दर रात्री CI मध्ये)' }, { en: 'Kept secret', mr: 'गुप्त ठेवलेल्या' }, { en: 'Run only by developers', mr: 'फक्त डेव्हलपर्सनी चालवलेल्या' }],
        answer: 1,
        explain: { en: 'This is where SQL testing meets automation: Act 5 runs these from Java in CI.', mr: 'इथे SQL testing आणि automation भेटतात: Act 5 मध्ये या Java मधून CI मध्ये चालतील.' },
      },
    ],
    recap: { line: { en: 'Audit = duplicates + rebuilt balances + reconciliation, with exact amounts and a root-cause fix.', mr: 'ऑडिट = डुप्लिकेट + पुन्हा काढलेली शिल्लक + reconciliation, नेमक्या रकमा आणि मूळ कारणावर उपाय.' }, icon: '🏛️' },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: '>> ...you actually know SQL now. i\'ll be in the APIs. ⌁⌁⌁', mr: '>> ...तुला खरंच SQL येतं आता. मी APIs मध्ये भेटेन. ⌁⌁⌁' } },
      { who: 'meera', mood: 'happy', text: { en: 'Rank up: SQL Specialist, {name}. That was senior-level SQL. Interviewers will ask about window functions, and now you can answer.', mr: 'नवीन रँक: SQL Specialist, {name}. हे सीनियर-लेव्हलचं SQL होतं. मुलाखतीत window functions विचारतील, आणि आता तू उत्तर देऊ शकतेस.' } },
    ],
  },
]
