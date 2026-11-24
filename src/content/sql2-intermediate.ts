import type { Lesson } from './types.ts'

export const intermediateLessons: Lesson[] = [
  // ───────────────────────── 2.1 NULL & COALESCE
  {
    id: 'b2-1',
    code: '2.1',
    level: 'intermediate',
    title: { en: 'The Missing Phone Numbers', mr: 'गायब फोन नंबर' },
    skill: 'NULL & COALESCE',
    realLife: {
      place: 'school',
      title: { en: 'The school emergency contact sheet', mr: 'शाळेची आपत्कालीन संपर्क यादी' },
      story: {
        en: 'A child falls ill at school. The teacher calls the mother\'s mobile. No mobile listed? She calls the home landline. Neither? She writes "NO CONTACT" and tells the principal. She always ends up with an answer.',
        mr: 'शाळेत एक मूल आजारी पडतं. शिक्षिका आईच्या मोबाइलवर फोन करतात. मोबाइल नंबर नाही? मग घरच्या लँडलाइनवर. दोन्ही नाहीत? त्या "संपर्क नाही" असं लिहून मुख्याध्यापकांना सांगतात. शेवटी उत्तर मिळतंच.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📱', label: 'Mobile?', mr: 'मोबाइल?' },
          { icon: '☎️', label: 'Landline?', mr: 'लँडलाइन?' },
          { icon: '📝', label: '"NO CONTACT"', mr: '"संपर्क नाही"' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Our delivery partner says some customers cannot be reached. Their phone field is just... blank.', mr: 'डिलिव्हरी पार्टनर म्हणतो काही ग्राहकांशी संपर्कच होत नाही. त्यांचा phone रकाना रिकामा आहे.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'Some of them gave a landline instead. It is in alt_phone.', mr: 'काहींनी त्याऐवजी लँडलाइन दिलाय. तो alt_phone मध्ये आहे.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Blank in a database has a special name, {name}: NULL. Let us learn to handle it.', mr: 'डेटाबेसमधल्या रिकाम्या जागेला खास नाव आहे, {name}: NULL. ते कसं हाताळायचं ते शिकूया.' } },
      ],
      problem: { en: 'NULL values silently break filters, counts and reports. "WHERE phone = NULL" returns nothing, so the problem stays hidden.', mr: 'NULL व्हॅल्यूज फिल्टर्स, counts आणि रिपोर्ट्स गुपचूप बिघडवतात. "WHERE phone = NULL" काहीच देत नाही, त्यामुळे समस्या लपून राहते.' },
      solution: { en: 'IS NULL finds the gaps. COALESCE fills them with the first value that exists, just like the teacher\'s call list.', mr: 'IS NULL रिकाम्या जागा शोधतो. COALESCE त्या पहिल्या उपलब्ध व्हॅल्यूने भरतो, अगदी शिक्षिकेच्या फोन यादीसारखं.' },
    },
    lesson: [
      { en: 'NULL means "unknown" or "not given". It is not zero and not an empty string.', mr: 'NULL म्हणजे "अज्ञात" किंवा "दिलेलं नाही". तो शून्य नाही आणि रिकामा टेक्स्टही नाही.' },
      { en: 'Any comparison with NULL is unknown, so = NULL never matches. Use IS NULL and IS NOT NULL.', mr: 'NULL शी कोणतीही तुलना अज्ञात असते, म्हणून = NULL कधीच जुळत नाही. IS NULL आणि IS NOT NULL वापरा.' },
      { en: 'COALESCE(a, b, c) returns the first value that is not NULL. COUNT(column) skips NULLs; COUNT(*) does not.', mr: 'COALESCE(a, b, c) पहिली NULL नसलेली व्हॅल्यू देतो. COUNT(column) NULL सोडून मोजतो; COUNT(*) सगळं मोजतो.' },
    ],
    syntax: {
      template: "SELECT name, COALESCE(col1, col2, 'default')\nFROM table\nWHERE col1 IS NULL;",
      parts: [
        { code: 'IS NULL / IS NOT NULL', means: { en: 'test for a missing value', mr: 'व्हॅल्यू नाही का ते तपासा' } },
        { code: 'COALESCE(a, b, ...)', means: { en: 'first non-NULL value in the list', mr: 'यादीतली पहिली NULL नसलेली व्हॅल्यू' } },
        { code: 'AS contact', means: { en: 'give the result column a name', mr: 'निकालाच्या column ला नाव द्या' } },
      ],
      example: [
        { code: 'SELECT child,', note: { en: 'the student', mr: 'विद्यार्थी' } },
        { code: "  COALESCE(mobile, landline, 'NO CONTACT') AS call_on", note: { en: 'mobile, else landline, else the note', mr: 'मोबाइल, नसेल तर लँडलाइन, नसेल तर नोंद' } },
        { code: 'FROM contacts;', note: { en: 'the contact sheet', mr: 'संपर्क यादी' } },
      ],
      pitfall: { en: 'COUNT(phone) and COUNT(*) give different answers when phone has NULLs. Know which one your report needs.', mr: 'phone मध्ये NULL असतील तर COUNT(phone) आणि COUNT(*) वेगळी उत्तरं देतात. रिपोर्टला कोणतं हवं ते ओळखा.' },
    },
    practice: {
      intro: { en: 'The customers table has phone and alt_phone columns.', mr: 'customers टेबलमध्ये phone आणि alt_phone columns आहेत.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'List the name of every customer whose phone is missing.', mr: 'ज्या ग्राहकांचा phone नाही त्या प्रत्येकाचं name दाखवा.' },
          expected: 'SELECT name FROM customers WHERE phone IS NULL',
          hints: [
            { en: 'Missing means NULL.', mr: 'नाही म्हणजे NULL.' },
            { en: 'Use IS NULL, not = NULL.', mr: '= NULL नव्हे, IS NULL वापरा.' },
            { en: 'SELECT name FROM customers WHERE phone IS ____', mr: 'SELECT name FROM customers WHERE phone IS ____' },
            { en: 'SELECT name FROM customers WHERE phone IS NULL;', mr: 'SELECT name FROM customers WHERE phone IS NULL;' },
          ],
          successLine: { en: '6 customers with no phone.', mr: '6 ग्राहकांचा phone नाही.' },
        },
        {
          kind: 'sql',
          prompt: { en: "For those same customers, show the name and a contact column: phone, else alt_phone, else 'NO CONTACT'.", mr: "त्याच ग्राहकांसाठी name आणि एक contact column दाखवा: phone, नसेल तर alt_phone, नसेल तर 'NO CONTACT'." },
          starter: 'SELECT name, COALESCE(\nFROM customers\nWHERE phone IS NULL',
          expected: "SELECT name, COALESCE(phone, alt_phone, 'NO CONTACT') FROM customers WHERE phone IS NULL",
          hints: [
            { en: 'COALESCE takes the columns in the order you want to try them.', mr: 'COALESCE मध्ये columns ज्या क्रमाने वापरायचे त्या क्रमाने द्या.' },
            { en: "The last argument is the text 'NO CONTACT'.", mr: "शेवटचा argument म्हणजे 'NO CONTACT' हा टेक्स्ट." },
            { en: "COALESCE(phone, alt_phone, 'NO CONTACT')", mr: "COALESCE(phone, alt_phone, 'NO CONTACT')" },
            { en: "SELECT name, COALESCE(phone, alt_phone, 'NO CONTACT') AS contact FROM customers WHERE phone IS NULL;", mr: "SELECT name, COALESCE(phone, alt_phone, 'NO CONTACT') AS contact FROM customers WHERE phone IS NULL;" },
          ],
          successLine: { en: '3 have a landline. 3 are truly unreachable: that is the bug report.', mr: '3 जणांकडे लँडलाइन आहे. 3 जणांशी संपर्कच शक्य नाही: हाच बग रिपोर्ट.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does WHERE phone = NULL return?', mr: 'WHERE phone = NULL काय देतं?' },
        options: [
          { en: 'Rows with no phone', mr: 'phone नसलेल्या rows' },
          { en: 'Nothing, ever', mr: 'कधीच काही नाही' },
          { en: 'Every row', mr: 'सगळ्या rows' },
          { en: 'An error', mr: 'एरर' },
        ],
        answer: 1,
        explain: { en: 'NULL compared with anything is unknown, so no row passes.', mr: 'NULL ची कशाशीही तुलना अज्ञात असते, म्हणून एकही row पास होत नाही.' },
      },
      {
        q: { en: 'What is COALESCE(NULL, NULL, 5, 7)?', mr: 'COALESCE(NULL, NULL, 5, 7) किती?' },
        options: ['NULL', '5', '7', '12'],
        answer: 1,
        explain: { en: 'The first non-NULL value is 5.', mr: 'पहिली NULL नसलेली व्हॅल्यू 5 आहे.' },
      },
      {
        q: { en: '10 customers, 4 have no email. What do COUNT(*) and COUNT(email) return?', mr: '10 ग्राहक, 4 जणांचा email नाही. COUNT(*) आणि COUNT(email) किती देतात?' },
        options: ['10 and 10', '10 and 6', '6 and 10', '4 and 6'],
        answer: 1,
        explain: { en: 'COUNT(column) skips NULLs.', mr: 'COUNT(column) NULL मोजत नाही.' },
      },
      {
        q: { en: 'Which is NOT the same as NULL?', mr: 'यापैकी कोणतं NULL सारखं नाही?' },
        options: [{ en: 'An unknown value', mr: 'अज्ञात व्हॅल्यू' }, { en: 'A value never entered', mr: 'कधीच न भरलेली व्हॅल्यू' }, { en: 'The number 0', mr: 'संख्या 0' }, { en: 'A missing value', mr: 'गायब व्हॅल्यू' }],
        answer: 2,
        explain: { en: '0 is a real, known number. NULL is "no value".', mr: '0 ही खरी, माहीत असलेली संख्या आहे. NULL म्हणजे "व्हॅल्यूच नाही".' },
      },
    ],
    recap: { line: { en: 'NULL = unknown. Find it with IS NULL, fill it with COALESCE.', mr: 'NULL = अज्ञात. IS NULL ने शोधा, COALESCE ने भरा.' }, icon: '📇' },
    outro: [{ who: 'gremlin', mood: 'smug', text: { en: '>> blank fields are my favourite hiding place. ⌁', mr: '>> रिकामे रकाने ही माझी आवडती लपायची जागा. ⌁' } }],
  },

  // ───────────────────────── 2.2 IN, BETWEEN, LIKE
  {
    id: 'b2-2',
    code: '2.2',
    level: 'intermediate',
    title: { en: 'Smarter Filters', mr: 'हुशार फिल्टर्स' },
    skill: 'IN, BETWEEN & LIKE',
    realLife: {
      place: 'postoffice',
      title: { en: 'The post office sorting desk', mr: 'पोस्ट ऑफिसचं सॉर्टिंग टेबल' },
      story: {
        en: 'A postman sorts letters for the Pune van. Any PIN code starting with 411 goes in. He does not need to know every Pune PIN code, only the pattern.',
        mr: 'पोस्टमन पुण्याच्या गाडीसाठी पत्रं वेगळी करतो. 411 ने सुरू होणारा कोणताही PIN कोड आत जातो. त्याला पुण्याचे सगळे PIN कोड माहीत असायची गरज नाही, फक्त पॅटर्न.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'PIN code LIKE \'411%\' (starts with 411)', mr: "PIN कोड LIKE '411%' (411 ने सुरू)" },
        items: [
          { icon: '✉️', label: '411038', mr: 'कोथरूड', pass: true },
          { icon: '✉️', label: '400001', mr: 'मुंबई', pass: false },
          { icon: '✉️', label: '411001', mr: 'पुणे स्टेशन', pass: true },
          { icon: '✉️', label: '440010', mr: 'नागपूर', pass: false },
          { icon: '✉️', label: '411057', mr: 'हिंजवडी', pass: true },
          { icon: '✉️', label: '422002', mr: 'नाशिक', pass: false },
          { icon: '✉️', label: '411014', mr: 'विमान नगर', pass: true },
          { icon: '✉️', label: '431001', mr: 'संभाजीनगर', pass: false },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'neutral', text: { en: 'Support asks: "Show orders from Oct 10 to 12 that are PAID or CANCELLED." Then: "Which products start with S?"', mr: 'सपोर्ट विचारतो: "10 ते 12 ऑक्टोबरच्या PAID किंवा CANCELLED ऑर्डर्स दाखवा." मग: "S ने सुरू होणारे products कोणते?"' } },
        { who: 'theo', mood: 'worried', text: { en: 'And two customer emails look broken. They have no @ at all.', mr: 'आणि दोन ग्राहकांचे ईमेल बिघडलेले दिसतात. त्यात @ च नाही.' } },
      ],
      problem: { en: 'Long chains of OR conditions are hard to read and easy to get wrong. Exact matches cannot find patterns like "contains @".', mr: 'OR च्या लांब साखळ्या वाचायला कठीण आणि चुकायला सोप्या. नेमकी तुलना "@ आहे का" सारखे पॅटर्न शोधू शकत नाही.' },
      solution: { en: 'IN checks a list, BETWEEN checks a range, LIKE matches a text pattern. Testers use LIKE constantly for format validation.', mr: 'IN यादी तपासतो, BETWEEN रेंज तपासतो, LIKE टेक्स्ट पॅटर्न जुळवतो. फॉरमॅट व्हॅलिडेशनसाठी टेस्टर्स LIKE सतत वापरतात.' },
    },
    lesson: [
      { en: "IN ('A', 'B') is short for = 'A' OR = 'B'. NOT IN means none of them.", mr: "IN ('A', 'B') म्हणजे = 'A' OR = 'B' चं छोटं रूप. NOT IN म्हणजे यापैकी कोणतंच नाही." },
      { en: 'BETWEEN x AND y includes both ends. It works on numbers and dates.', mr: 'BETWEEN x AND y मध्ये दोन्ही टोकं धरली जातात. नंबर्स आणि तारखांवर चालतं.' },
      { en: "LIKE uses wildcards: % means any number of characters, _ means exactly one. 'S%' = starts with S, '%@%' = contains @.", mr: "LIKE मध्ये wildcards: % म्हणजे कितीही अक्षरं, _ म्हणजे नेमकं एक. 'S%' = S ने सुरू, '%@%' = @ आहे." },
    ],
    syntax: {
      template: "WHERE col IN ('a', 'b')\n  AND col BETWEEN low AND high\n  AND col LIKE 'pattern%';",
      parts: [
        { code: "IN ('a','b')", means: { en: 'matches any value in the list', mr: 'यादीतल्या कोणत्याही व्हॅल्यूशी जुळतं' } },
        { code: 'BETWEEN a AND b', means: { en: 'inside the range, ends included', mr: 'रेंजमध्ये, दोन्ही टोकांसह' } },
        { code: "LIKE '411%'", means: { en: 'text pattern; % = anything', mr: 'टेक्स्ट पॅटर्न; % = काहीही' } },
      ],
      example: [
        { code: 'SELECT pin, city FROM letters', note: { en: 'every letter', mr: 'प्रत्येक पत्र' } },
        { code: "WHERE pin LIKE '411%'", note: { en: 'Pune PIN codes', mr: 'पुण्याचे PIN कोड' } },
        { code: "  AND type IN ('SPEED', 'REGISTERED')", note: { en: 'only these two types', mr: 'फक्त हे दोन प्रकार' } },
        { code: "  AND posted_on BETWEEN '2026-10-01' AND '2026-10-07';", note: { en: 'first week of October', mr: 'ऑक्टोबरचा पहिला आठवडा' } },
      ],
      pitfall: { en: 'NOT IN with a NULL in the list returns nothing. A classic interview trap.', mr: 'यादीत NULL असेल तर NOT IN काहीच देत नाही. मुलाखतीतला लोकप्रिय सापळा.' },
    },
    practice: {
      intro: { en: 'Filter like a pro.', mr: 'प्रोसारखं फिल्टर करा.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: "Show the id of orders placed between 2026-10-10 and 2026-10-12 whose status is PAID or CANCELLED.", mr: '2026-10-10 ते 2026-10-12 दरम्यानच्या, status PAID किंवा CANCELLED असलेल्या ऑर्डर्सचे id दाखवा.' },
          expected: "SELECT id FROM orders WHERE order_date BETWEEN '2026-10-10' AND '2026-10-12' AND status IN ('PAID', 'CANCELLED')",
          hints: [
            { en: 'One BETWEEN for the dates, one IN for the statuses.', mr: 'तारखांसाठी एक BETWEEN, status साठी एक IN.' },
            { en: "BETWEEN '2026-10-10' AND '2026-10-12'", mr: "BETWEEN '2026-10-10' AND '2026-10-12'" },
            { en: "... AND status IN ('PAID', 'CANCELLED')", mr: "... AND status IN ('PAID', 'CANCELLED')" },
            { en: "SELECT id FROM orders WHERE order_date BETWEEN '2026-10-10' AND '2026-10-12' AND status IN ('PAID', 'CANCELLED');", mr: "SELECT id FROM orders WHERE order_date BETWEEN '2026-10-10' AND '2026-10-12' AND status IN ('PAID', 'CANCELLED');" },
          ],
        },
        {
          kind: 'sql',
          prompt: { en: 'Format check: show the id and email of customers whose email does NOT contain an @.', mr: 'फॉरमॅट तपासणी: ज्यांच्या email मध्ये @ नाही अशा ग्राहकांचे id आणि email दाखवा.' },
          expected: "SELECT id, email FROM customers WHERE email NOT LIKE '%@%'",
          hints: [
            { en: "'%@%' means: anything, then @, then anything.", mr: "'%@%' म्हणजे: काहीही, मग @, मग काहीही." },
            { en: 'You want the opposite: NOT LIKE.', mr: 'तुम्हाला उलट हवंय: NOT LIKE.' },
            { en: "WHERE email NOT LIKE '%@%'", mr: "WHERE email NOT LIKE '%@%'" },
            { en: "SELECT id, email FROM customers WHERE email NOT LIKE '%@%';", mr: "SELECT id, email FROM customers WHERE email NOT LIKE '%@%';" },
          ],
          successLine: { en: 'Two broken emails. The signup form never validated the format. Bug filed.', mr: 'दोन बिघडलेले ईमेल. साइनअप फॉर्मने फॉरमॅट तपासलाच नाही. बग नोंदवला.' },
        },
      ],
    },
    exam: [
      {
        q: { en: "Which names match LIKE 'Ma%'?", mr: "LIKE 'Ma%' शी कोणती नावं जुळतात?" },
        options: ['Asha, Rohan', 'Mahesh, Maya', 'Uma, Rama', 'Kamal, Amar'],
        answer: 1,
        explain: { en: 'Ma% = starts with "Ma".', mr: 'Ma% = "Ma" ने सुरू.' },
      },
      {
        q: { en: 'Does BETWEEN 10 AND 20 include 10 and 20?', mr: 'BETWEEN 10 AND 20 मध्ये 10 आणि 20 येतात का?' },
        options: [{ en: 'Yes, both', mr: 'हो, दोन्ही' }, { en: 'Only 10', mr: 'फक्त 10' }, { en: 'Only 20', mr: 'फक्त 20' }, { en: 'Neither', mr: 'कोणतंच नाही' }],
        answer: 0,
        explain: { en: 'BETWEEN is inclusive. Remember boundary testing from P.1!', mr: 'BETWEEN मध्ये दोन्ही टोकं येतात. P.1 मधलं boundary testing आठवा!' },
      },
      {
        q: { en: "What does '_' mean in LIKE 'A_ha'?", mr: "LIKE 'A_ha' मध्ये '_' म्हणजे काय?" },
        options: [{ en: 'Any number of characters', mr: 'कितीही अक्षरं' }, { en: 'Exactly one character', mr: 'नेमकं एक अक्षर' }, { en: 'A space', mr: 'एक स्पेस' }, { en: 'Nothing', mr: 'काहीच नाही' }],
        answer: 1,
        explain: { en: "_ is one character: 'Asha' matches, 'Ashha' does not.", mr: "_ म्हणजे एक अक्षर: 'Asha' जुळतं, 'Ashha' नाही." },
      },
      {
        q: { en: 'Which is the same as status IN (\'PAID\', \'SHIPPED\')?', mr: "status IN ('PAID', 'SHIPPED') च्या बरोबरीचं कोणतं?" },
        options: ["status = 'PAID' AND status = 'SHIPPED'", "status = 'PAID' OR status = 'SHIPPED'", "status LIKE 'PAID SHIPPED'", "status BETWEEN 'PAID' AND 'SHIPPED'"],
        answer: 1,
        explain: { en: 'IN is a list of ORs. AND would need one row to be both at once.', mr: 'IN म्हणजे OR ची यादी. AND साठी एका row ला एकाच वेळी दोन्ही असावं लागेल.' },
      },
    ],
    recap: { line: { en: 'IN = list, BETWEEN = range (ends included), LIKE = pattern (% any, _ one).', mr: 'IN = यादी, BETWEEN = रेंज (टोकांसह), LIKE = पॅटर्न (% काहीही, _ एक).' }, icon: '📮' },
  },

  // ───────────────────────── 2.3 CASE WHEN
  {
    id: 'b2-3',
    code: '2.3',
    level: 'intermediate',
    title: { en: 'Labelling the Evidence', mr: 'पुराव्यांना लेबल लावणं' },
    skill: 'CASE WHEN',
    realLife: {
      place: 'school',
      title: { en: 'A teacher grading exam papers', mr: 'शिक्षक पेपर तपासतात' },
      story: {
        en: 'For each paper: 75 or more gets a Distinction, 60 or more a First Class, everything else Pass. The teacher checks the rules top to bottom and stops at the first one that fits.',
        mr: 'प्रत्येक पेपरसाठी: 75 किंवा जास्त म्हणजे डिस्टिंक्शन, 60 किंवा जास्त म्हणजे फर्स्ट क्लास, बाकी पास. शिक्षक नियम वरून खाली तपासतात आणि पहिला जुळणारा नियम लागू करतात.',
      },
      scene: {
        type: 'group',
        groups: [
          { icon: '🏅', label: 'Distinction (75+)', mr: 'डिस्टिंक्शन' },
          { icon: '🥈', label: 'First class (60+)', mr: 'फर्स्ट क्लास' },
          { icon: '📄', label: 'Pass', mr: 'पास' },
        ],
        items: [0, 2, 1, 0, 1, 1, 2, 0, 1].map((group) => ({ icon: '📝', group })),
        note: { en: 'Each paper gets exactly one label: the first rule that fits', mr: 'प्रत्येक पेपरला एकच लेबल: पहिला जुळणारा नियम' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'happy', text: { en: 'Finance wants orders labelled BIG (5000+), MEDIUM (1500+) or SMALL, and a count of each.', mr: 'फायनान्सला ऑर्डर्सना BIG (5000+), MEDIUM (1500+) किंवा SMALL असं लेबल आणि प्रत्येकाची संख्या हवी आहे.' } },
        { who: 'rex', mood: 'smug', text: { en: 'Export to Excel and add a formula. Done.', mr: 'Excel मध्ये एक्सपोर्ट करा आणि फॉर्म्युला लावा. झालं.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'Every week? With live data? Let the database label it, {name}.', mr: 'दर आठवड्याला? लाइव्ह डेटासह? डेटाबेसलाच लेबल लावू दे, {name}.' } },
      ],
      problem: { en: 'Business rules ("BIG if 5000+") live in people\'s heads and spreadsheets. Every manual export is a chance for a mistake.', mr: 'बिझनेस नियम ("5000+ असेल तर BIG") लोकांच्या डोक्यात आणि स्प्रेडशीटमध्ये असतात. प्रत्येक मॅन्युअल एक्सपोर्ट म्हणजे चुकीची संधी.' },
      solution: { en: 'CASE WHEN writes the rule inside the query. Testers use it to classify rows and to compare expected vs actual labels.', mr: 'CASE WHEN नियम क्वेरीतच लिहितो. टेस्टर्स rows चं वर्गीकरण करायला आणि अपेक्षित विरुद्ध प्रत्यक्ष लेबल तुलना करायला वापरतात.' },
    },
    lesson: [
      { en: 'CASE checks conditions top to bottom and returns the value of the first one that is true.', mr: 'CASE अटी वरून खाली तपासतो आणि पहिल्या खऱ्या अटीची व्हॅल्यू देतो.' },
      { en: 'ELSE is the fallback. Without ELSE, unmatched rows get NULL.', mr: 'ELSE म्हणजे शेवटचा पर्याय. ELSE नसेल तर न जुळलेल्या rows ना NULL मिळतं.' },
      { en: 'You can GROUP BY a CASE expression to count each label.', mr: 'प्रत्येक लेबल मोजायला CASE expression वर GROUP BY करता येतं.' },
    ],
    syntax: {
      template: "CASE\n  WHEN condition1 THEN 'label1'\n  WHEN condition2 THEN 'label2'\n  ELSE 'other'\nEND AS label",
      parts: [
        { code: 'WHEN ... THEN', means: { en: 'a rule and the value it gives', mr: 'नियम आणि त्याची व्हॅल्यू' } },
        { code: 'ELSE', means: { en: 'value when no rule matched', mr: 'कोणताच नियम न जुळल्यास व्हॅल्यू' } },
        { code: 'END AS label', means: { en: 'close the CASE and name the column', mr: 'CASE बंद करा आणि column ला नाव द्या' } },
      ],
      example: [
        { code: 'SELECT student,', note: { en: 'each paper', mr: 'प्रत्येक पेपर' } },
        { code: "  CASE WHEN marks >= 75 THEN 'Distinction'", note: { en: 'checked first', mr: 'आधी तपासलं जातं' } },
        { code: "       WHEN marks >= 60 THEN 'First class'", note: { en: 'only if the first failed', mr: 'पहिला नियम फेल झाला तरच' } },
        { code: "       ELSE 'Pass' END AS grade", note: { en: 'everyone else', mr: 'बाकी सगळे' } },
        { code: 'FROM results;', note: { en: 'the marks table', mr: 'गुणांचं टेबल' } },
      ],
      pitfall: { en: 'Order matters. If ">= 60" came first, a 90-mark paper would be labelled First class.', mr: 'क्रम महत्त्वाचा. ">= 60" आधी असता तर 90 गुणांच्या पेपरला फर्स्ट क्लास लेबल मिळालं असतं.' },
    },
    practice: {
      intro: { en: 'Let the database apply Finance\'s rules.', mr: 'फायनान्सचे नियम डेटाबेसलाच लागू करू दे.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: "Show every order's id and a size label: 'BIG' if total >= 5000, 'MEDIUM' if total >= 1500, else 'SMALL'.", mr: "प्रत्येक ऑर्डरचा id आणि size लेबल दाखवा: total >= 5000 असेल तर 'BIG', >= 1500 असेल तर 'MEDIUM', नाहीतर 'SMALL'." },
          starter: 'SELECT id,\n  CASE\n    WHEN total >= 5000 THEN \'BIG\'\n    \nFROM orders',
          expected: "SELECT id, CASE WHEN total >= 5000 THEN 'BIG' WHEN total >= 1500 THEN 'MEDIUM' ELSE 'SMALL' END FROM orders",
          hints: [
            { en: 'Add the MEDIUM rule, then ELSE, then END.', mr: 'MEDIUM नियम, मग ELSE, मग END जोडा.' },
            { en: "WHEN total >= 1500 THEN 'MEDIUM' ELSE 'SMALL' END", mr: "WHEN total >= 1500 THEN 'MEDIUM' ELSE 'SMALL' END" },
            { en: 'Do not forget END before FROM.', mr: 'FROM आधी END विसरू नका.' },
            { en: "SELECT id, CASE WHEN total >= 5000 THEN 'BIG' WHEN total >= 1500 THEN 'MEDIUM' ELSE 'SMALL' END AS size FROM orders;", mr: "SELECT id, CASE WHEN total >= 5000 THEN 'BIG' WHEN total >= 1500 THEN 'MEDIUM' ELSE 'SMALL' END AS size FROM orders;" },
          ],
        },
        {
          kind: 'sql',
          prompt: { en: 'Now count the orders per size label. Show the label and the count.', mr: 'आता प्रत्येक size लेबलच्या ऑर्डर्स मोजा. लेबल आणि count दाखवा.' },
          expected: "SELECT CASE WHEN total >= 5000 THEN 'BIG' WHEN total >= 1500 THEN 'MEDIUM' ELSE 'SMALL' END, COUNT(*) FROM orders GROUP BY 1",
          hints: [
            { en: 'Same CASE, plus COUNT(*), plus GROUP BY.', mr: 'तोच CASE, सोबत COUNT(*), आणि GROUP BY.' },
            { en: 'GROUP BY 1 means "group by the first column".', mr: 'GROUP BY 1 म्हणजे "पहिल्या column नुसार group करा".' },
            { en: "SELECT CASE ... END AS size, COUNT(*) FROM orders GROUP BY 1", mr: "SELECT CASE ... END AS size, COUNT(*) FROM orders GROUP BY 1" },
            { en: "SELECT CASE WHEN total >= 5000 THEN 'BIG' WHEN total >= 1500 THEN 'MEDIUM' ELSE 'SMALL' END AS size, COUNT(*) FROM orders GROUP BY 1;", mr: "SELECT CASE WHEN total >= 5000 THEN 'BIG' WHEN total >= 1500 THEN 'MEDIUM' ELSE 'SMALL' END AS size, COUNT(*) FROM orders GROUP BY 1;" },
          ],
          successLine: { en: 'BIG 98, MEDIUM 137, SMALL 65. Finance\'s weekly report, automated.', mr: 'BIG 98, MEDIUM 137, SMALL 65. फायनान्सचा साप्ताहिक रिपोर्ट, ऑटोमॅटिक.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'total = 7000. What label does this give?', mr: 'total = 7000. हे कोणतं लेबल देईल?' },
        code: "CASE WHEN total >= 1500 THEN 'MEDIUM'\n     WHEN total >= 5000 THEN 'BIG'\n     ELSE 'SMALL' END",
        options: ['BIG', 'MEDIUM', 'SMALL', 'NULL'],
        answer: 1,
        explain: { en: 'The first true rule wins. 7000 >= 1500 is checked first. That is a bug in the rule order!', mr: 'पहिला खरा नियम जिंकतो. 7000 >= 1500 आधी तपासलं जातं. नियमांच्या क्रमातला हा बग आहे!' },
      },
      {
        q: { en: 'A CASE has no ELSE and no rule matches. Result?', mr: 'CASE मध्ये ELSE नाही आणि कोणताच नियम जुळत नाही. निकाल?' },
        options: [{ en: 'An error', mr: 'एरर' }, 'NULL', "'ELSE'", '0'],
        answer: 1,
        explain: { en: 'No match and no ELSE gives NULL.', mr: 'जुळत नाही आणि ELSE नाही तर NULL.' },
      },
      {
        q: { en: 'Which keyword closes a CASE?', mr: 'CASE कोणत्या शब्दाने बंद होतो?' },
        options: ['STOP', 'END', 'DONE', 'ESAC'],
        answer: 1,
        explain: { en: 'CASE ... END.', mr: 'CASE ... END.' },
      },
      {
        q: { en: 'How can CASE help a tester?', mr: 'CASE टेस्टरला कसा मदत करतो?' },
        options: [
          { en: 'It deletes bad rows', mr: 'तो वाईट rows डिलीट करतो' },
          { en: 'It recomputes the expected label so you can compare it with the stored label', mr: 'तो अपेक्षित लेबल पुन्हा काढतो, म्हणजे साठवलेल्या लेबलशी तुलना करता येते' },
          { en: 'It speeds up queries', mr: 'तो क्वेरी वेगवान करतो' },
          { en: 'It creates tables', mr: 'तो टेबल्स बनवतो' },
        ],
        answer: 1,
        explain: { en: 'Expected (your CASE) vs actual (stored column): mismatches are bugs.', mr: 'अपेक्षित (तुमचा CASE) विरुद्ध प्रत्यक्ष (साठवलेला column): न जुळणारे म्हणजे बग्स.' },
      },
    ],
    recap: { line: { en: 'CASE WHEN applies rules top to bottom; the first true rule wins.', mr: 'CASE WHEN नियम वरून खाली लावतो; पहिला खरा नियम जिंकतो.' }, icon: '🏷️' },
  },

  // ───────────────────────── 2.4 Subqueries & EXISTS
  {
    id: 'b2-4',
    code: '2.4',
    level: 'intermediate',
    title: { en: 'A Question Inside a Question', mr: 'प्रश्नाच्या आत प्रश्न' },
    skill: 'Subqueries & EXISTS',
    realLife: {
      place: 'school',
      title: { en: 'Who scored above the class average?', mr: 'वर्गाच्या सरासरीपेक्षा जास्त गुण कोणाला?' },
      story: {
        en: 'To answer "who scored above average?" you first answer a smaller question: "what IS the average?" Only then can you compare each student to it.',
        mr: '"सरासरीपेक्षा जास्त कोणाला?" याचं उत्तर द्यायला आधी छोटा प्रश्न सोडवावा लागतो: "सरासरी किती आहे?" मगच प्रत्येक विद्यार्थ्याची त्याच्याशी तुलना करता येते.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📋', label: 'All marks', mr: 'सगळे गुण' },
          { icon: '🧮', label: 'Average = 64', mr: 'सरासरी = 64' },
          { icon: '⚖️', label: 'Compare each', mr: 'प्रत्येकाची तुलना' },
          { icon: '🏆', label: 'Above average', mr: 'सरासरीपेक्षा जास्त' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'neutral', text: { en: 'Which orders are bigger than our average order? And which customers have ever cancelled?', mr: 'कोणत्या ऑर्डर्स आपल्या सरासरी ऑर्डरपेक्षा मोठ्या आहेत? आणि कोणत्या ग्राहकांनी कधी ऑर्डर रद्द केली आहे?' } },
        { who: 'theo', mood: 'worried', text: { en: 'The average changes every day, so we cannot hard-code a number.', mr: 'सरासरी दररोज बदलते, त्यामुळे एखादा नंबर कायमचा लिहून ठेवता येत नाही.' } },
      ],
      problem: { en: 'Hard-coding a number like "> 3200" breaks tomorrow. Running two queries and copying the result is manual and fragile.', mr: '"> 3200" सारखा नंबर लिहून ठेवला तर उद्या चुकतो. दोन क्वेरीज चालवून निकाल कॉपी करणं मॅन्युअल आणि नाजूक आहे.' },
      solution: { en: 'A subquery computes the inner answer live, inside the main query. EXISTS checks "is there at least one matching row?"', mr: 'Subquery आतलं उत्तर मुख्य क्वेरीतच लाइव्ह काढते. EXISTS तपासतो "किमान एक जुळणारी row आहे का?"' },
    },
    lesson: [
      { en: 'A subquery is a SELECT inside brackets. The inner query runs first and its result is used by the outer one.', mr: 'Subquery म्हणजे कंसातली SELECT. आतली क्वेरी आधी चालते आणि तिचा निकाल बाहेरची क्वेरी वापरते.' },
      { en: 'A scalar subquery returns one value: WHERE total > (SELECT AVG(total) FROM orders).', mr: 'Scalar subquery एकच व्हॅल्यू देते: WHERE total > (SELECT AVG(total) FROM orders).' },
      { en: 'EXISTS (subquery) is true when the subquery returns at least one row. NOT EXISTS finds things with no match, like LEFT JOIN + IS NULL.', mr: 'Subquery ने किमान एक row दिली तर EXISTS खरं. NOT EXISTS जोडीदार नसलेल्या गोष्टी शोधतो, LEFT JOIN + IS NULL सारखं.' },
    ],
    syntax: {
      template: 'SELECT ... FROM a\nWHERE col > (SELECT AVG(col) FROM a);\n\nSELECT ... FROM a\nWHERE EXISTS (SELECT 1 FROM b WHERE b.a_id = a.id);',
      parts: [
        { code: '( SELECT ... )', means: { en: 'the inner question, answered first', mr: 'आतला प्रश्न, आधी सोडवला जातो' } },
        { code: 'EXISTS', means: { en: 'true if the inner query finds any row', mr: 'आतल्या क्वेरीला कोणतीही row सापडली तर खरं' } },
        { code: 'b.a_id = a.id', means: { en: 'links the inner query to the current outer row', mr: 'आतली क्वेरी बाहेरच्या चालू row शी जोडतो' } },
      ],
      example: [
        { code: 'SELECT student, marks FROM results', note: { en: 'outer question', mr: 'बाहेरचा प्रश्न' } },
        { code: 'WHERE marks > (', note: { en: 'compare with...', mr: 'याच्याशी तुलना...' } },
        { code: '  SELECT AVG(marks) FROM results', note: { en: 'inner question: the average', mr: 'आतला प्रश्न: सरासरी' } },
        { code: ');', note: { en: 'recomputed every time you run it', mr: 'प्रत्येक वेळी नव्याने काढली जाते' } },
      ],
      pitfall: { en: 'A subquery used with = must return exactly one value. If it returns many rows, use IN instead.', mr: '= सोबत वापरलेल्या subquery ने नेमकी एकच व्हॅल्यू द्यायला हवी. अनेक rows येत असतील तर IN वापरा.' },
    },
    practice: {
      intro: { en: 'Ask nested questions.', mr: 'प्रश्नात प्रश्न विचारा.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'Show the id and total of every order whose total is above the average order total.', mr: 'ज्या ऑर्डरचा total सरासरी total पेक्षा जास्त आहे अशा प्रत्येक ऑर्डरचा id आणि total दाखवा.' },
          expected: 'SELECT id, total FROM orders WHERE total > (SELECT AVG(total) FROM orders)',
          hints: [
            { en: 'The inner question is "what is the average total?"', mr: 'आतला प्रश्न: "सरासरी total किती?"' },
            { en: '(SELECT AVG(total) FROM orders)', mr: '(SELECT AVG(total) FROM orders)' },
            { en: 'WHERE total > (SELECT AVG(total) FROM orders)', mr: 'WHERE total > (SELECT AVG(total) FROM orders)' },
            { en: 'SELECT id, total FROM orders WHERE total > (SELECT AVG(total) FROM orders);', mr: 'SELECT id, total FROM orders WHERE total > (SELECT AVG(total) FROM orders);' },
          ],
          successLine: { en: '119 orders above average.', mr: '119 ऑर्डर्स सरासरीपेक्षा जास्त.' },
        },
        {
          kind: 'sql',
          prompt: { en: 'Show the name of every customer who has at least one CANCELLED order. Use EXISTS.', mr: 'किमान एक CANCELLED ऑर्डर असलेल्या प्रत्येक ग्राहकाचं name दाखवा. EXISTS वापरा.' },
          starter: 'SELECT c.name\nFROM customers c\nWHERE EXISTS (\n  SELECT 1 FROM orders o\n  WHERE \n)',
          expected: "SELECT c.name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'CANCELLED')",
          hints: [
            { en: 'Inside EXISTS, link the order to the customer.', mr: 'EXISTS च्या आत ऑर्डर ग्राहकाशी जोडा.' },
            { en: 'o.customer_id = c.id, plus the status rule.', mr: 'o.customer_id = c.id, आणि status चा नियम.' },
            { en: "WHERE o.customer_id = c.id AND o.status = 'CANCELLED'", mr: "WHERE o.customer_id = c.id AND o.status = 'CANCELLED'" },
            { en: "SELECT c.name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'CANCELLED');", mr: "SELECT c.name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'CANCELLED');" },
          ],
        },
      ],
    },
    exam: [
      {
        q: { en: 'Which part runs first?', mr: 'कोणता भाग आधी चालतो?' },
        code: 'SELECT name FROM products\nWHERE price > (SELECT AVG(price) FROM products);',
        options: [{ en: 'The outer SELECT', mr: 'बाहेरची SELECT' }, { en: 'The inner AVG subquery', mr: 'आतली AVG subquery' }, { en: 'Both at once', mr: 'दोन्ही एकदम' }, { en: 'Neither', mr: 'कोणतीच नाही' }],
        answer: 1,
        explain: { en: 'The inner question gives the average; the outer one uses it.', mr: 'आतला प्रश्न सरासरी देतो; बाहेरचा ती वापरतो.' },
      },
      {
        q: { en: 'EXISTS returns true when the subquery returns...', mr: 'Subquery ने काय दिलं तर EXISTS खरं?' },
        options: [{ en: 'Exactly one row', mr: 'नेमकी एक row' }, { en: 'At least one row', mr: 'किमान एक row' }, { en: 'No rows', mr: 'एकही row नाही' }, { en: 'A number above 0', mr: '0 पेक्षा मोठा नंबर' }],
        answer: 1,
        explain: { en: 'EXISTS only asks "is there anything?"', mr: 'EXISTS फक्त विचारतो "काही आहे का?"' },
      },
      {
        q: { en: 'NOT EXISTS (orders for this customer) finds...', mr: 'NOT EXISTS (या ग्राहकाच्या ऑर्डर्स) काय शोधतो?' },
        options: [{ en: 'Customers who never ordered', mr: 'कधीच ऑर्डर न केलेले ग्राहक' }, { en: 'Customers with many orders', mr: 'अनेक ऑर्डर्स असलेले ग्राहक' }, { en: 'Deleted orders', mr: 'डिलीट झालेल्या ऑर्डर्स' }, { en: 'All customers', mr: 'सगळे ग्राहक' }],
        answer: 0,
        explain: { en: 'Same idea as LEFT JOIN + IS NULL, written differently.', mr: 'LEFT JOIN + IS NULL ची तीच कल्पना, वेगळ्या पद्धतीने.' },
      },
      {
        q: { en: 'This fails with "more than one row returned". Fix?', mr: 'हे "एकापेक्षा जास्त rows" एरर देतं. उपाय?' },
        code: "SELECT * FROM orders\nWHERE customer_id = (SELECT id FROM customers WHERE city = 'Pune');",
        options: [{ en: 'Use IN instead of =', mr: '= ऐवजी IN वापरा' }, { en: 'Add LIMIT 100', mr: 'LIMIT 100 जोडा' }, { en: 'Remove WHERE', mr: 'WHERE काढा' }, { en: 'Use LIKE', mr: 'LIKE वापरा' }],
        answer: 0,
        explain: { en: 'Pune has many customers, so compare against a list: IN (...).', mr: 'पुण्यात अनेक ग्राहक आहेत, म्हणून यादीशी तुलना करा: IN (...).' },
      },
    ],
    recap: { line: { en: 'Subquery = answer the small question first. EXISTS = "is there at least one?"', mr: 'Subquery = आधी छोटा प्रश्न सोडवा. EXISTS = "किमान एक आहे का?"' }, icon: '🪆' },
  },

  // ───────────────────────── 2.5 Duplicates & data quality
  {
    id: 'b2-5',
    code: '2.5',
    level: 'intermediate',
    title: { en: 'The Twins Who Are Not Twins', mr: 'जुळे नसलेले जुळे' },
    skill: 'Duplicates & constraints',
    realLife: {
      place: 'bank',
      title: { en: 'Two customers with the same Aadhaar number', mr: 'एकच आधार नंबर असलेले दोन ग्राहक' },
      story: {
        en: 'At a bank\'s KYC desk, an officer stacks forms by Aadhaar number. Any pile with two forms means two "different" people claim the same identity. A good bank form would have refused the second one.',
        mr: 'बँकेच्या KYC टेबलवर अधिकारी फॉर्म आधार नंबरनुसार रचतो. ज्या ढिगात दोन फॉर्म आहेत तिथे दोन "वेगवेगळे" लोक एकच ओळख सांगतायत. चांगल्या बँक फॉर्मने दुसरा फॉर्म नाकारला असता.',
      },
      scene: {
        type: 'group',
        groups: [
          { icon: '🪪', label: '…4821', mr: 'एक फॉर्म' },
          { icon: '🪪', label: '…7710', mr: 'दोन फॉर्म!' },
          { icon: '🪪', label: '…3095', mr: 'एक फॉर्म' },
        ],
        items: [0, 1, 2, 1].map((group) => ({ icon: '📄', group })),
        note: { en: 'Pile …7710 has 2 forms: a duplicate identity', mr: '…7710 ढिगात 2 फॉर्म: डुप्लिकेट ओळख' },
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'worried', text: { en: 'Password-reset emails are going to the wrong people. Two accounts can share one email?!', mr: 'पासवर्ड-रीसेट ईमेल चुकीच्या लोकांकडे जातायत. दोन अकाउंट्सचा एकच ईमेल असू शकतो?!' } },
        { who: 'rex', mood: 'neutral', text: { en: 'And the partner feed references customers that do not exist. Who checks this stuff?', mr: 'आणि पार्टनर फीडमध्ये अस्तित्वात नसलेल्या ग्राहकांचा उल्लेख आहे. हे कोण तपासतं?' } },
        { who: 'meera', mood: 'happy', text: { en: 'We do. Data quality testing, {name}. Every bank and shop pays for this skill.', mr: 'आपण. डेटा क्वालिटी टेस्टिंग, {name}. प्रत्येक बँक आणि दुकान या कौशल्यासाठी पैसे देतं.' } },
      ],
      problem: { en: 'The database accepted bad data because the rules (constraints) were never defined. Nobody notices until customers are hurt.', mr: 'नियम (constraints) कधी ठरवलेच नाहीत म्हणून डेटाबेसने वाईट डेटा स्वीकारला. ग्राहकांना त्रास होईपर्यंत कोणाच्या लक्षात येत नाही.' },
      solution: { en: 'Constraints (PRIMARY KEY, UNIQUE, FOREIGN KEY, NOT NULL, CHECK) stop bad data at the door. Your queries prove where they are missing.', mr: 'Constraints (PRIMARY KEY, UNIQUE, FOREIGN KEY, NOT NULL, CHECK) वाईट डेटा दारातच अडवतात. तुमच्या क्वेरीज ते कुठे नाहीत हे सिद्ध करतात.' },
    },
    lesson: [
      { en: 'PRIMARY KEY: unique and never empty (like a passport number). UNIQUE: no two rows share the value. NOT NULL: must be filled.', mr: 'PRIMARY KEY: युनिक आणि कधीच रिकामा नाही (पासपोर्ट नंबरसारखा). UNIQUE: दोन rows ची व्हॅल्यू एक नसावी. NOT NULL: भरलंच पाहिजे.' },
      { en: 'FOREIGN KEY: a value must exist in another table (an order\'s customer_id must be a real customer). CHECK: a custom rule (price > 0).', mr: 'FOREIGN KEY: व्हॅल्यू दुसऱ्या टेबलमध्ये असलीच पाहिजे (ऑर्डरचा customer_id खरा ग्राहक हवा). CHECK: स्वतःचा नियम (price > 0).' },
      { en: 'To test a missing constraint, query for the violations: GROUP BY + HAVING for duplicates, LEFT JOIN + IS NULL for orphans.', mr: 'गायब constraint तपासायला उल्लंघन शोधा: डुप्लिकेटसाठी GROUP BY + HAVING, orphans साठी LEFT JOIN + IS NULL.' },
    ],
    syntax: {
      template: '-- duplicates\nSELECT col, COUNT(*) FROM t\nGROUP BY col HAVING COUNT(*) > 1;\n\n-- orphans (broken foreign key)\nSELECT c.id FROM child c\nLEFT JOIN parent p ON p.id = c.parent_id\nWHERE p.id IS NULL;',
      parts: [
        { code: 'HAVING COUNT(*) > 1', means: { en: 'values used more than once', mr: 'एकापेक्षा जास्त वेळा वापरलेल्या व्हॅल्यूज' } },
        { code: 'LEFT JOIN ... IS NULL', means: { en: 'child rows pointing to nothing', mr: 'कशाकडेच निर्देश न करणाऱ्या child rows' } },
        { code: 'DISTINCT', means: { en: 'show each value once', mr: 'प्रत्येक व्हॅल्यू एकदाच दाखवा' } },
      ],
      example: [
        { code: 'SELECT aadhaar, COUNT(*)', note: { en: 'each ID and how many forms', mr: 'प्रत्येक ID आणि किती फॉर्म' } },
        { code: 'FROM kyc_forms', note: { en: 'the stack of forms', mr: 'फॉर्मचा ढीग' } },
        { code: 'GROUP BY aadhaar', note: { en: 'one pile per ID', mr: 'प्रत्येक ID चा ढीग' } },
        { code: 'HAVING COUNT(*) > 1;', note: { en: 'only suspicious piles', mr: 'फक्त संशयास्पद ढीग' } },
      ],
      pitfall: { en: 'DISTINCT hides duplicates; it does not fix them. Use it to look, never to "clean" a test result.', mr: 'DISTINCT डुप्लिकेट लपवतो, दुरुस्त करत नाही. बघण्यासाठी वापरा, टेस्ट निकाल "स्वच्छ" करायला कधीच नाही.' },
    },
    practice: {
      intro: { en: 'Prove the missing constraints.', mr: 'गायब constraints सिद्ध करा.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'Find every email used by more than one customer. Show the email and how many times it appears.', mr: 'एकापेक्षा जास्त ग्राहकांनी वापरलेला प्रत्येक email शोधा. email आणि तो किती वेळा आहे ते दाखवा.' },
          expected: 'SELECT email, COUNT(*) FROM customers GROUP BY email HAVING COUNT(*) > 1',
          hints: [
            { en: 'One pile per email.', mr: 'प्रत्येक email चा ढीग.' },
            { en: 'Keep piles bigger than 1 with HAVING.', mr: 'HAVING ने 1 पेक्षा मोठे ढीग ठेवा.' },
            { en: 'GROUP BY email HAVING COUNT(*) > 1', mr: 'GROUP BY email HAVING COUNT(*) > 1' },
            { en: 'SELECT email, COUNT(*) FROM customers GROUP BY email HAVING COUNT(*) > 1;', mr: 'SELECT email, COUNT(*) FROM customers GROUP BY email HAVING COUNT(*) > 1;' },
          ],
          successLine: { en: '3 shared emails. The email column needs a UNIQUE constraint.', mr: '3 सामायिक ईमेल. email column ला UNIQUE constraint हवा.' },
        },
        {
          kind: 'sql',
          prompt: { en: 'The partner feed (staging_orders) has no foreign keys. List the feed_id of rows whose customer_id does not exist in customers.', mr: 'पार्टनर फीडला (staging_orders) foreign keys नाहीत. ज्या rows चा customer_id customers मध्ये नाही त्यांचे feed_id दाखवा.' },
          expected: 'SELECT s.feed_id FROM staging_orders s LEFT JOIN customers c ON c.id = s.customer_id WHERE c.id IS NULL',
          hints: [
            { en: 'Orphans: LEFT JOIN + IS NULL.', mr: 'Orphans: LEFT JOIN + IS NULL.' },
            { en: 'staging_orders is the "guest list"; customers are the "cards".', mr: 'staging_orders म्हणजे "पाहुण्यांची यादी"; customers म्हणजे "कार्ड".' },
            { en: 'LEFT JOIN customers c ON c.id = s.customer_id WHERE c.id IS NULL', mr: 'LEFT JOIN customers c ON c.id = s.customer_id WHERE c.id IS NULL' },
            { en: 'SELECT s.feed_id FROM staging_orders s LEFT JOIN customers c ON c.id = s.customer_id WHERE c.id IS NULL;', mr: 'SELECT s.feed_id FROM staging_orders s LEFT JOIN customers c ON c.id = s.customer_id WHERE c.id IS NULL;' },
          ],
          successLine: { en: '3 orphan rows. With a FOREIGN KEY, the database would have refused them.', mr: '3 orphan rows. FOREIGN KEY असता तर डेटाबेसने त्या नाकारल्या असत्या.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Which constraint stops two customers sharing one email?', mr: 'दोन ग्राहकांचा एकच email थांबवणारा constraint कोणता?' },
        options: ['NOT NULL', 'UNIQUE', 'CHECK', 'DEFAULT'],
        answer: 1,
        explain: { en: 'UNIQUE forbids repeated values.', mr: 'UNIQUE पुनरावृत्ती होणाऱ्या व्हॅल्यूज रोखतो.' },
      },
      {
        q: { en: 'An order with customer_id = 905 but no customer 905 is called...', mr: 'customer_id = 905 असलेली पण 905 ग्राहकच नसलेली ऑर्डर म्हणजे...' },
        options: [{ en: 'A duplicate', mr: 'डुप्लिकेट' }, { en: 'An orphan (broken foreign key)', mr: 'Orphan (तुटलेला foreign key)' }, { en: 'A NULL', mr: 'NULL' }, { en: 'A primary key', mr: 'Primary key' }],
        answer: 1,
        explain: { en: 'It points to a parent that does not exist.', mr: 'ती अस्तित्वात नसलेल्या पालकाकडे निर्देश करते.' },
      },
      {
        q: { en: 'A PRIMARY KEY is...', mr: 'PRIMARY KEY म्हणजे...' },
        options: [{ en: 'Unique and never NULL', mr: 'युनिक आणि कधीच NULL नाही' }, { en: 'Optional', mr: 'ऐच्छिक' }, { en: 'Always text', mr: 'नेहमी टेक्स्ट' }, { en: 'Shared between rows', mr: 'rows मध्ये सामायिक' }],
        answer: 0,
        explain: { en: 'Like a passport number: one per person, always present.', mr: 'पासपोर्ट नंबरसारखा: प्रत्येकाचा एक, नेहमी असतो.' },
      },
      {
        q: { en: 'Which CHECK rule would block negative prices?', mr: 'कोणता CHECK नियम ऋण किमती रोखेल?' },
        options: ['CHECK (price IS NULL)', 'CHECK (price > 0)', 'CHECK (price < 0)', 'CHECK (price = price)'],
        answer: 1,
        explain: { en: 'CHECK (price > 0) rejects zero and negative prices.', mr: 'CHECK (price > 0) शून्य आणि ऋण किमती नाकारतो.' },
      },
    ],
    recap: { line: { en: 'Duplicates: GROUP BY + HAVING. Orphans: LEFT JOIN + IS NULL. Constraints stop both.', mr: 'डुप्लिकेट: GROUP BY + HAVING. Orphans: LEFT JOIN + IS NULL. Constraints दोन्ही थांबवतात.' }, icon: '🪪' },
  },

  // ───────────────────────── 2.6 INSERT / UPDATE / DELETE & transactions
  {
    id: 'b2-6',
    code: '2.6',
    level: 'intermediate',
    title: { en: 'Changing the Data Safely', mr: 'डेटा सुरक्षितपणे बदलणं' },
    skill: 'INSERT, UPDATE & transactions',
    realLife: {
      place: 'bank',
      title: { en: 'A bank transfer between two accounts', mr: 'दोन अकाउंट्समधलं बँक ट्रान्सफर' },
      story: {
        en: 'Sending ₹500 to a friend is two steps: take ₹500 from you, add ₹500 to them. If the power cuts after step one, the bank must undo it. Either both steps happen, or neither does.',
        mr: 'मित्राला ₹500 पाठवणं म्हणजे दोन पायऱ्या: तुमच्याकडून ₹500 घ्या, त्याला ₹500 द्या. पहिल्या पायरीनंतर वीज गेली तर बँकेने ते रद्द केलंच पाहिजे. एकतर दोन्ही पायऱ्या होतात, नाहीतर एकही नाही.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🏁', label: 'BEGIN', mr: 'सुरुवात' },
          { icon: '➖', label: 'Debit ₹500 from you', mr: 'तुमच्याकडून ₹500 वजा' },
          { icon: '➕', label: 'Credit ₹500 to friend', mr: 'मित्राला ₹500 जमा' },
          { icon: '✅', label: 'COMMIT', mr: 'पक्कं करा' },
        ],
        breakAt: 2,
        breakNote: { en: 'Power cut before the credit? ROLLBACK undoes the debit. Nobody loses money.', mr: 'जमा होण्याआधी वीज गेली? ROLLBACK वजावट रद्द करतो. कोणाचे पैसे जात नाहीत.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'rex', mood: 'neutral', text: { en: 'To test the "back in stock" email, I need the Plant Kit to have stock. And I need a fresh test customer.', mr: '"परत स्टॉकमध्ये" ईमेल तपासायला Plant Kit ला stock हवा. आणि एक नवीन टेस्ट ग्राहक हवा.' } },
        { who: 'meera', mood: 'worried', text: { en: 'Changing data is powerful, {name}. One UPDATE without WHERE changes EVERY row.', mr: 'डेटा बदलणं शक्तिशाली आहे, {name}. WHERE शिवायचा एक UPDATE प्रत्येक row बदलतो.' } },
      ],
      problem: { en: 'Testers must set up test data, but careless changes can corrupt a shared test database for the whole team.', mr: 'टेस्टर्सना टेस्ट डेटा तयार करावा लागतो, पण निष्काळजी बदल संपूर्ण टीमचा सामायिक टेस्ट डेटाबेस बिघडवू शकतात.' },
      solution: { en: 'INSERT, UPDATE and DELETE change data. Transactions (BEGIN ... COMMIT / ROLLBACK) make changes all-or-nothing and let you undo test setup.', mr: 'INSERT, UPDATE आणि DELETE डेटा बदलतात. Transactions (BEGIN ... COMMIT / ROLLBACK) बदल सगळे-किंवा-काहीच करतात आणि टेस्ट सेटअप रद्द करू देतात.' },
    },
    lesson: [
      { en: 'INSERT adds rows, UPDATE changes rows, DELETE removes rows. UPDATE and DELETE need a WHERE, or they hit every row.', mr: 'INSERT rows जोडतो, UPDATE rows बदलतो, DELETE rows काढतो. UPDATE आणि DELETE ला WHERE हवाच, नाहीतर प्रत्येक row बदलते.' },
      { en: 'RETURNING shows you the rows you just changed. A tester\'s best friend for verifying test setup.', mr: 'RETURNING नुकत्याच बदललेल्या rows दाखवतो. टेस्ट सेटअप तपासण्यासाठी टेस्टरचा जिवलग मित्र.' },
      { en: 'A transaction groups changes: BEGIN starts it, COMMIT saves everything, ROLLBACK undoes everything. (In this console, every query is rolled back automatically, so you cannot break anything.)', mr: 'Transaction बदल एकत्र करतो: BEGIN सुरू करतो, COMMIT सगळं जतन करतो, ROLLBACK सगळं रद्द करतो. (या कन्सोलमध्ये प्रत्येक क्वेरी आपोआप rollback होते, त्यामुळे तुम्ही काहीच बिघडवू शकत नाही.)' },
    ],
    syntax: {
      template: "INSERT INTO t (col1, col2) VALUES (v1, v2) RETURNING *;\nUPDATE t SET col = value WHERE condition RETURNING *;\nDELETE FROM t WHERE condition;",
      parts: [
        { code: 'INSERT INTO ... VALUES', means: { en: 'add a new row', mr: 'नवीन row जोडा' } },
        { code: 'UPDATE ... SET ... WHERE', means: { en: 'change matching rows', mr: 'जुळणाऱ्या rows बदला' } },
        { code: 'RETURNING', means: { en: 'show what changed', mr: 'काय बदललं ते दाखवा' } },
        { code: 'BEGIN / COMMIT / ROLLBACK', means: { en: 'start, save, or undo a group of changes', mr: 'बदलांचा गट सुरू करा, जतन करा किंवा रद्द करा' } },
      ],
      example: [
        { code: 'BEGIN;', note: { en: 'start the transfer', mr: 'ट्रान्सफर सुरू' } },
        { code: 'UPDATE accounts SET balance = balance - 500 WHERE id = 1;', note: { en: 'debit you', mr: 'तुमच्याकडून वजा' } },
        { code: 'UPDATE accounts SET balance = balance + 500 WHERE id = 2;', note: { en: 'credit your friend', mr: 'मित्राला जमा' } },
        { code: 'COMMIT;', note: { en: 'both happen, or ROLLBACK for neither', mr: 'दोन्ही होतात, किंवा ROLLBACK ने एकही नाही' } },
      ],
      pitfall: { en: 'Run a SELECT with the same WHERE first. If it returns the rows you expect, then run the UPDATE or DELETE.', mr: 'आधी त्याच WHERE ने SELECT चालवा. अपेक्षित rows आल्या तरच UPDATE किंवा DELETE चालवा.' },
    },
    practice: {
      intro: { en: 'Set up test data. (Safe: this console rolls back every change.)', mr: 'टेस्ट डेटा तयार करा. (सुरक्षित: हा कन्सोल प्रत्येक बदल rollback करतो.)' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: "Set the stock of 'Sproutling Plant Kit' to 25, and RETURN its name and stock.", mr: "'Sproutling Plant Kit' चा stock 25 करा, आणि त्याचं name आणि stock RETURN करा." },
          starter: 'UPDATE products\nSET \nWHERE \nRETURNING name, stock',
          expected: "UPDATE products SET stock = 25 WHERE name = 'Sproutling Plant Kit' RETURNING name, stock",
          hints: [
            { en: 'SET stock = 25', mr: 'SET stock = 25' },
            { en: "WHERE name = 'Sproutling Plant Kit' (never forget the WHERE!)", mr: "WHERE name = 'Sproutling Plant Kit' (WHERE कधीच विसरू नका!)" },
            { en: "UPDATE products SET stock = 25 WHERE name = '...' RETURNING name, stock", mr: "UPDATE products SET stock = 25 WHERE name = '...' RETURNING name, stock" },
            { en: "UPDATE products SET stock = 25 WHERE name = 'Sproutling Plant Kit' RETURNING name, stock;", mr: "UPDATE products SET stock = 25 WHERE name = 'Sproutling Plant Kit' RETURNING name, stock;" },
          ],
          successLine: { en: 'One row updated, verified with RETURNING.', mr: 'एक row बदलली, RETURNING ने खात्री केली.' },
        },
        {
          kind: 'sql',
          prompt: { en: "Insert a test customer: id 61, name 'Test User', city 'Pune', joined_on '2026-11-23'. RETURN the id and name.", mr: "एक टेस्ट ग्राहक जोडा: id 61, name 'Test User', city 'Pune', joined_on '2026-11-23'. id आणि name RETURN करा." },
          starter: 'INSERT INTO customers (id, name, city, joined_on)\nVALUES ()\nRETURNING id, name',
          expected: "INSERT INTO customers (id, name, city, joined_on) VALUES (61, 'Test User', 'Pune', '2026-11-23') RETURNING id, name",
          hints: [
            { en: 'Values go in the same order as the column list.', mr: 'Values कॉलम यादीच्या क्रमानेच द्या.' },
            { en: "VALUES (61, 'Test User', 'Pune', '2026-11-23')", mr: "VALUES (61, 'Test User', 'Pune', '2026-11-23')" },
            { en: 'Text and dates in quotes, the number without.', mr: 'टेक्स्ट आणि तारखा कोट्समध्ये, नंबर कोट्सशिवाय.' },
            { en: "INSERT INTO customers (id, name, city, joined_on) VALUES (61, 'Test User', 'Pune', '2026-11-23') RETURNING id, name;", mr: "INSERT INTO customers (id, name, city, joined_on) VALUES (61, 'Test User', 'Pune', '2026-11-23') RETURNING id, name;" },
          ],
        },
        {
          kind: 'choice',
          prompt: { en: 'A transfer ran BEGIN, the debit, then failed before the credit. What should happen?', mr: 'ट्रान्सफरमध्ये BEGIN, वजावट झाली, आणि जमा होण्याआधी फेल झालं. काय व्हायला हवं?' },
          options: [
            'COMMIT',
            'ROLLBACK',
            { en: 'Retry only the credit later', mr: 'नंतर फक्त जमा पुन्हा करा' },
            { en: 'Nothing', mr: 'काहीच नाही' },
          ],
          correct: [1],
          explain: { en: 'ROLLBACK undoes the debit, so the money is never lost. Testing that failures roll back is a key DB test.', mr: 'ROLLBACK वजावट रद्द करतो, त्यामुळे पैसे कधीच हरवत नाहीत. फेल झाल्यावर rollback होतो का हे तपासणं महत्त्वाची DB टेस्ट आहे.' },
          hints: [{ en: 'Either both steps happen, or neither.', mr: 'एकतर दोन्ही पायऱ्या, नाहीतर एकही नाही.' }],
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does this do?', mr: 'हे काय करतं?' },
        code: 'UPDATE products SET price = 0;',
        options: [{ en: 'Nothing', mr: 'काहीच नाही' }, { en: 'Sets EVERY product price to 0', mr: 'प्रत्येक product ची price 0 करतो' }, { en: 'Sets one price to 0', mr: 'एक price 0 करतो' }, { en: 'An error', mr: 'एरर' }],
        answer: 1,
        explain: { en: 'No WHERE means every row. Always add a WHERE.', mr: 'WHERE नाही म्हणजे प्रत्येक row. नेहमी WHERE लावा.' },
      },
      {
        q: { en: 'Which keyword undoes all changes in the current transaction?', mr: 'चालू transaction मधले सगळे बदल कोणता शब्द रद्द करतो?' },
        options: ['COMMIT', 'ROLLBACK', 'DELETE', 'UNDO'],
        answer: 1,
        explain: { en: 'ROLLBACK undoes; COMMIT saves.', mr: 'ROLLBACK रद्द करतो; COMMIT जतन करतो.' },
      },
      {
        q: { en: 'Why add RETURNING to an INSERT in a test?', mr: 'टेस्टमध्ये INSERT ला RETURNING का जोडावं?' },
        options: [{ en: 'It makes it faster', mr: 'वेगवान होतं' }, { en: 'To see and verify exactly what was inserted', mr: 'नेमकं काय जोडलं ते पाहून खात्री करायला' }, { en: 'It is required', mr: 'ते आवश्यक आहे' }, { en: 'To delete the row after', mr: 'नंतर row डिलीट करायला' }],
        answer: 1,
        explain: { en: 'Verify your setup before you test on top of it.', mr: 'त्यावर टेस्ट करण्याआधी सेटअपची खात्री करा.' },
      },
      {
        q: { en: 'Safest habit before running a DELETE?', mr: 'DELETE चालवण्याआधीची सर्वात सुरक्षित सवय?' },
        options: [{ en: 'Run a SELECT with the same WHERE and check the rows', mr: 'त्याच WHERE ने SELECT चालवून rows तपासा' }, { en: 'Run it twice', mr: 'दोनदा चालवा' }, { en: 'Remove the WHERE', mr: 'WHERE काढा' }, { en: 'Restart the database', mr: 'डेटाबेस रीस्टार्ट करा' }],
        answer: 0,
        explain: { en: 'Preview, then change.', mr: 'आधी पाहा, मग बदला.' },
      },
    ],
    recap: { line: { en: 'INSERT adds, UPDATE changes, DELETE removes. Always WHERE. Transactions = all or nothing.', mr: 'INSERT जोडतो, UPDATE बदलतो, DELETE काढतो. नेहमी WHERE. Transaction = सगळं किंवा काहीच नाही.' }, icon: '🏦' },
  },

  // ───────────────────────── 2.7 BOSS
  {
    id: 'b2-7',
    code: '2.7',
    level: 'intermediate',
    title: { en: 'Boss: The Poisoned Feed', mr: 'बॉस: विषारी फीड' },
    skill: 'Data quality audit',
    isBoss: true,
    realLife: {
      place: 'market',
      title: { en: 'The vegetable market quality check', mr: 'भाजी मंडईतली गुणवत्ता तपासणी' },
      story: {
        en: 'A wholesaler receives a truck of crates every night. Before paying, the inspector checks: any crate with no label? Any rotten one? Any crate counted twice? One bad truck can spoil the whole shop.',
        mr: 'घाऊक व्यापाऱ्याकडे रोज रात्री क्रेट्सचा ट्रक येतो. पैसे देण्याआधी तपासणीस पाहतो: लेबल नसलेला क्रेट? सडलेला? दोनदा मोजलेला? एक वाईट ट्रक संपूर्ण दुकान खराब करू शकतो.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Accept only clean crates', mr: 'फक्त स्वच्छ क्रेट्स स्वीकारा' },
        items: [
          { icon: '🥬', label: 'OK', mr: 'ठीक', pass: true },
          { icon: '🍅', label: 'No label', mr: 'लेबल नाही', pass: false },
          { icon: '🥕', label: 'OK', mr: 'ठीक', pass: true },
          { icon: '🧅', label: 'Counted twice', mr: 'दोनदा मोजलं', pass: false },
          { icon: '🥔', label: 'OK', mr: 'ठीक', pass: true },
          { icon: '🍆', label: 'Rotten', mr: 'सडलेलं', pass: false },
          { icon: '🥒', label: 'OK', mr: 'ठीक', pass: true },
          { icon: '🌶️', label: 'Wrong date', mr: 'चुकीची तारीख', pass: false },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'gremlin', mood: 'smug', text: { en: '>> i poisoned tonight\'s partner feed. load it and your reports go crazy. reject it and you lose a day of sales. choose. ⌁', mr: '>> आजच्या पार्टनर फीडमध्ये मी विष मिसळलंय. लोड केलं तर रिपोर्ट्स वेडे होतील. नाकारलं तर एक दिवसाची विक्री जाईल. निवड कर. ⌁' } },
        { who: 'sam', mood: 'worried', text: { en: 'I need a decision with evidence in the next hour.', mr: 'मला पुढच्या तासात पुराव्यासह निर्णय हवाय.' } },
        { who: 'meera', mood: 'neutral', text: { en: '2 hints per step, {name}. Use everything from this level.', mr: 'प्रत्येक स्टेपला 2 हिंट्स, {name}. या लेव्हलमधलं सगळं वापर.' } },
      ],
      problem: { en: 'A nightly feed (staging_orders) arrives with no constraints. Loading bad rows corrupts revenue reports and customer records.', mr: 'रात्रीची फीड (staging_orders) कोणत्याही constraints शिवाय येते. वाईट rows लोड केल्या तर उत्पन्नाचे रिपोर्ट्स आणि ग्राहक रेकॉर्ड्स बिघडतात.' },
      solution: { en: 'Run a data-quality audit: NULL/negative values, duplicates, orphans and format checks, then decide with numbers.', mr: 'डेटा-क्वालिटी ऑडिट करा: NULL/ऋण व्हॅल्यूज, डुप्लिकेट, orphans आणि फॉरमॅट तपासण्या, मग आकड्यांसह निर्णय घ्या.' },
    },
    lesson: [
      { en: 'A data-quality audit checks completeness (NULLs), validity (ranges, formats), uniqueness (duplicates) and integrity (orphans).', mr: 'डेटा-क्वालिटी ऑडिट तपासतो: पूर्णता (NULLs), वैधता (रेंज, फॉरमॅट), युनिकनेस (डुप्लिकेट) आणि इंटेग्रिटी (orphans).' },
      { en: 'Each check is one query. Together they become a reusable test suite you can run every night.', mr: 'प्रत्येक तपासणी म्हणजे एक क्वेरी. सगळ्या मिळून दर रात्री चालवता येणारा टेस्ट सूट बनतो.' },
      { en: 'The output of an audit is a decision plus evidence: what is wrong, how many rows, and what to do.', mr: 'ऑडिटचा निकाल म्हणजे निर्णय आणि पुरावा: काय चुकलंय, किती rows, आणि काय करायचं.' },
    ],
    syntax: {
      template: "WHERE amount IS NULL OR amount <= 0          -- validity\nGROUP BY order_ref HAVING COUNT(*) > 1       -- uniqueness\nWHERE currency <> 'INR' OR order_date > DATE '2026-11-23'  -- format & range",
      parts: [
        { code: 'IS NULL OR <= 0', means: { en: 'missing or impossible amounts', mr: 'गायब किंवा अशक्य रक्कम' } },
        { code: 'HAVING COUNT(*) > 1', means: { en: 'the same order sent twice', mr: 'तीच ऑर्डर दोनदा पाठवलेली' } },
        { code: "<> 'INR'", means: { en: 'exact text: \'inr\' is not \'INR\'', mr: "नेमका टेक्स्ट: 'inr' म्हणजे 'INR' नाही" } },
      ],
      example: [
        { code: 'SELECT feed_id, amount', note: { en: 'suspect rows', mr: 'संशयित rows' } },
        { code: 'FROM staging_orders', note: { en: 'tonight\'s feed', mr: 'आजची फीड' } },
        { code: 'WHERE amount IS NULL', note: { en: 'missing amount', mr: 'रक्कम नाही' } },
        { code: '   OR amount <= 0;', note: { en: 'impossible amount', mr: 'अशक्य रक्कम' } },
      ],
    },
    practice: {
      intro: { en: 'Audit the feed. Each step drains the Gremlin.', mr: 'फीडचं ऑडिट करा. प्रत्येक स्टेप ग्रेमलिनची ताकद कमी करते.' },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'Step 1: List the feed_id of rows whose amount is missing, zero or negative.', mr: 'स्टेप 1: ज्या rows ची amount नाही, शून्य किंवा ऋण आहे त्यांचे feed_id दाखवा.' },
          expected: 'SELECT feed_id FROM staging_orders WHERE amount IS NULL OR amount <= 0',
          hints: [
            { en: 'Two conditions joined with OR.', mr: 'OR ने जोडलेल्या दोन अटी.' },
            { en: 'amount IS NULL OR amount <= 0', mr: 'amount IS NULL OR amount <= 0' },
          ],
          successLine: { en: '4 bad amounts.', mr: '4 चुकीच्या रकमा.' },
        },
        {
          kind: 'sql',
          prompt: { en: 'Step 2: Find every order_ref that appears more than once in the feed.', mr: 'स्टेप 2: फीडमध्ये एकापेक्षा जास्त वेळा आलेला प्रत्येक order_ref शोधा.' },
          expected: 'SELECT order_ref FROM staging_orders GROUP BY order_ref HAVING COUNT(*) > 1',
          hints: [
            { en: 'Duplicates: GROUP BY + HAVING.', mr: 'डुप्लिकेट: GROUP BY + HAVING.' },
            { en: 'GROUP BY order_ref HAVING COUNT(*) > 1', mr: 'GROUP BY order_ref HAVING COUNT(*) > 1' },
          ],
          successLine: { en: '3 orders sent twice.', mr: '3 ऑर्डर्स दोनदा पाठवल्या.' },
        },
        {
          kind: 'sql',
          prompt: { en: "Step 3: List the feed_id of rows with a currency other than exactly 'INR' or an order_date after 2026-11-23.", mr: "स्टेप 3: ज्या rows चा currency नेमका 'INR' नाही किंवा order_date 2026-11-23 नंतरची आहे त्यांचे feed_id दाखवा." },
          expected: "SELECT feed_id FROM staging_orders WHERE currency <> 'INR' OR order_date > '2026-11-23'",
          hints: [
            { en: "Text comparison is exact: 'inr' <> 'INR'.", mr: "टेक्स्ट तुलना नेमकी असते: 'inr' <> 'INR'." },
            { en: "currency <> 'INR' OR order_date > '2026-11-23'", mr: "currency <> 'INR' OR order_date > '2026-11-23'" },
          ],
          successLine: { en: '2 lowercase currencies and 1 order from the future.', mr: '2 लहान अक्षरातले currency आणि भविष्यातली 1 ऑर्डर.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Step 4: The feed has 40 rows. You found 4 bad amounts, 3 duplicates, 3 orphans (from 2.5) and 3 format errors. Your call?', mr: 'स्टेप 4: फीडमध्ये 40 rows आहेत. तुम्हाला 4 चुकीच्या रकमा, 3 डुप्लिकेट, 3 orphans (2.5 मधून) आणि 3 फॉरमॅट चुका सापडल्या. तुमचा निर्णय?' },
          options: [
            { en: 'Load everything; fix it later', mr: 'सगळं लोड करा; नंतर दुरुस्त करू' },
            { en: 'Load the clean rows, quarantine the 13 bad ones, send the partner a defect report with the queries', mr: 'स्वच्छ rows लोड करा, 13 वाईट rows वेगळ्या ठेवा, पार्टनरला क्वेरीजसह दोष-रिपोर्ट पाठवा' },
            { en: 'Delete the whole feed silently', mr: 'संपूर्ण फीड गुपचूप डिलीट करा' },
            { en: 'Fix the numbers by hand', mr: 'आकडे हाताने दुरुस्त करा' },
          ],
          correct: [1],
          explain: { en: 'Protect the reports, keep the sales, and give the partner evidence they can act on. That is a senior tester\'s answer.', mr: 'रिपोर्ट्स सुरक्षित, विक्री कायम, आणि पार्टनरला कृती करता येईल असा पुरावा. हे सीनियर टेस्टरचं उत्तर आहे.' },
          hints: [{ en: 'Which option protects the data AND the business?', mr: 'कोणता पर्याय डेटा आणि व्यवसाय दोन्ही सुरक्षित ठेवतो?' }],
          successLine: { en: 'Sam forwards your report to the partner\'s CTO. Feed fixed by morning.', mr: 'सॅम तुमचा रिपोर्ट पार्टनरच्या CTO ला पाठवतो. सकाळपर्यंत फीड दुरुस्त.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Which dimension does a duplicate order_ref break?', mr: 'डुप्लिकेट order_ref कोणता नियम मोडतो?' },
        options: [{ en: 'Completeness', mr: 'पूर्णता' }, { en: 'Uniqueness', mr: 'युनिकनेस' }, { en: 'Validity', mr: 'वैधता' }, { en: 'Timeliness', mr: 'वेळेवरपणा' }],
        answer: 1,
        explain: { en: 'Each order should appear once.', mr: 'प्रत्येक ऑर्डर एकदाच असावी.' },
      },
      {
        q: { en: "Why does currency <> 'INR' catch 'inr'?", mr: "currency <> 'INR' हे 'inr' का पकडतं?" },
        options: [{ en: 'Text comparison is case-sensitive', mr: 'टेक्स्ट तुलना केस-सेन्सिटिव्ह असते' }, { en: 'Because of NULL', mr: 'NULL मुळे' }, { en: 'It does not', mr: 'पकडत नाही' }, { en: 'Because of LIKE', mr: 'LIKE मुळे' }],
        answer: 0,
        explain: { en: "'inr' and 'INR' are different strings in Postgres.", mr: "Postgres मध्ये 'inr' आणि 'INR' वेगवेगळे strings आहेत." },
      },
      {
        q: { en: 'Best way to make this audit repeatable every night?', mr: 'हे ऑडिट दर रात्री पुन्हा करण्याचा सर्वोत्तम मार्ग?' },
        options: [{ en: 'Re-type the queries each time', mr: 'प्रत्येक वेळी क्वेरीज पुन्हा टाइप करा' }, { en: 'Save the queries as an automated test suite', mr: 'क्वेरीज ऑटोमेटेड टेस्ट सूट म्हणून जतन करा' }, { en: 'Check a random sample by eye', mr: 'डोळ्यांनी रँडम नमुना तपासा' }, { en: 'Trust the partner', mr: 'पार्टनरवर विश्वास ठेवा' }],
        answer: 1,
        explain: { en: 'Queries are tests. Later you will run them from Java in CI.', mr: 'क्वेरीज म्हणजे टेस्ट्स. पुढे त्या Java मधून CI मध्ये चालवशील.' },
      },
      {
        q: { en: 'A row has amount = NULL. Does "WHERE amount <= 0" catch it?', mr: 'एका row ची amount = NULL आहे. "WHERE amount <= 0" ती पकडतं का?' },
        options: [{ en: 'Yes', mr: 'हो' }, { en: 'No, you need IS NULL too', mr: 'नाही, IS NULL पण हवं' }, { en: 'Only in Postgres', mr: 'फक्त Postgres मध्ये' }, { en: 'Only with LIKE', mr: 'फक्त LIKE सोबत' }],
        answer: 1,
        explain: { en: 'NULL <= 0 is unknown, not true. Always check NULL separately.', mr: 'NULL <= 0 अज्ञात आहे, खरं नाही. NULL नेहमी वेगळं तपासा.' },
      },
    ],
    recap: { line: { en: 'Audit = completeness + validity + uniqueness + integrity, then decide with evidence.', mr: 'ऑडिट = पूर्णता + वैधता + युनिकनेस + इंटेग्रिटी, मग पुराव्यासह निर्णय.' }, icon: '🧪' },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: '>> fine. the bank, then. let\'s see you handle REAL money. ⌁⌁⌁', mr: '>> ठीक. मग बँक. बघू खरे पैसे कसे हाताळतेस. ⌁⌁⌁' } },
      { who: 'meera', mood: 'happy', text: { en: 'Rank up: Data Quality Analyst. Ledgerly Bank is unlocked, {name}. Advanced SQL lives there.', mr: 'नवीन रँक: Data Quality Analyst. Ledgerly Bank उघडली, {name}. ॲडव्हान्स्ड SQL तिथे आहे.' } },
    ],
  },
]
