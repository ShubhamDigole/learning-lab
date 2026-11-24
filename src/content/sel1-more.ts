import type { Lesson } from './types.ts'

// Selenium 1, part 2: XPath and locator choice, talking to form controls, and assertions that prove something.
// No time slots here: they appear after a delay and need waits (S1.6).

const BASE = 'https://carebridge.test'

export const selMoreLessons: Lesson[] = [
  // ───────────────────────── S1.3 XPath and stable locators
  {
    id: 'se1-3',
    code: 'S1.3',
    level: 'basic',
    title: { en: "XPath, and Choosing Locators That Don't Break", mr: 'XPath, आणि न तुटणारे locators निवडणं' },
    skill: 'XPath and locator choice',
    realLife: {
      place: 'market',
      title: { en: 'Directions to a friend\'s flat', mr: 'मित्राच्या फ्लॅटचा पत्ता' },
      story: {
        en: 'Your cousin is visiting you in Kothrud for the first time. Aai gives directions on the phone: "Go past the Ganpati temple, take the third building, the one next to the paan shop." It works today. Next month the paan shop closes and a new building comes up in between, and your cousin is standing at the wrong gate. Baba just says: "Sai Residency, Flat 302." That works whatever happens on the street. Directions that count steps from a landmark break when the street changes. A name that belongs to the place itself keeps working.',
        mr: 'तुमचा चुलत भाऊ पहिल्यांदाच कोथरूडला तुमच्याकडे येतोय. आई फोनवर पत्ता सांगते: "गणपती मंदिर ओलांडून पुढे जा, तिसरी इमारत, पानाच्या टपरीशेजारची." आज हे चालतं. पुढच्या महिन्यात पानाची टपरी बंद होते, मध्ये एक नवी इमारत उभी राहते, आणि भाऊ चुकीच्या गेटसमोर उभा असतो. बाबा फक्त सांगतात: "साई रेसिडेन्सी, फ्लॅट 302." रस्त्यावर काहीही बदललं तरी हे चालतं. एखाद्या खुणेपासून पावलं मोजणारा पत्ता रस्ता बदलला की तुटतो. त्या जागेचं स्वतःचं नाव मात्र चालत राहतं.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Directions that still work after the street changes', mr: 'रस्ता बदलल्यावरही चालणारे पत्ते' },
        items: [
          { icon: '🏢', label: 'Sai Residency, Flat 302', mr: 'साई रेसिडेन्सी, फ्लॅट 302', pass: true },
          { icon: '🛕', label: 'Third building after the temple', mr: 'मंदिरानंतरची तिसरी इमारत', pass: false },
          { icon: '🌿', label: 'Next to the paan shop', mr: 'पानाच्या टपरीशेजारी', pass: false },
          { icon: '🔔', label: 'Door with the name plate "Patil"', mr: '"पाटील" पाटी असलेलं दार', pass: true },
          { icon: '🚶', label: 'Left, left, then 40 steps', mr: 'डावीकडे, डावीकडे, मग 40 पावलं', pass: false },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'rex', mood: 'neutral', text: { en: 'id, name and CSS cover most of the page. But some elements have no id at all. The login button is easy to describe by its words: "Log in".', mr: 'id, name आणि CSS ने page चा बराचसा भाग मिळतो. पण काही elements ना id च नसतो. login button त्याच्या शब्दांवरून सहज ओळखता येतं: "Log in".' } },
        { who: 'theo', mood: 'worried', text: { en: 'Last sprint someone copied a locator from the browser: /html/body/main/form/button. I added one div and forty tests went red.', mr: 'मागच्या sprint मध्ये कोणीतरी browser मधून locator कॉपी केला: /html/body/main/form/button. मी एक div जोडला आणि चाळीस tests लाल झाल्या.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'one tiny div. forty broken tests. i love counting-the-steps locators.', mr: 'एक छोटासा div. चाळीस तुटलेल्या tests. पावलं मोजणारे locators मला फार आवडतात.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Then we write locators like Baba gives addresses: by what the element is, never by how many steps from the top it sits.', mr: 'मग आपण locators बाबांसारखे लिहू: element काय आहे त्यावरून, वरून किती पावलांवर आहे त्यावरून कधीच नाही.' } },
      ],
      problem: { en: 'Some elements have no id, and copied absolute paths break as soon as the page layout changes a little. Broken locators make tests fail even when the app is fine.', mr: 'काही elements ना id नसतो, आणि कॉपी केलेले absolute paths page ची रचना थोडी बदलली की तुटतात. तुटलेले locators app ठीक असतानाही tests fail करतात.' },
      solution: { en: 'Use short relative XPath that describes the element (its tag, an attribute, its text), By.linkText for links, and follow a preference order: id, name, CSS, then XPath.', mr: 'element चं वर्णन करणारा छोटा relative XPath वापरा (त्याचा tag, एखादा attribute, त्याचा text), links साठी By.linkText, आणि हा क्रम पाळा: id, name, CSS, आणि मग XPath.' },
    },
    lesson: [
      { en: 'XPath is another way to point at an element. It starts with // which means "anywhere on the page". Then the tag, then a condition in square brackets: //input[@id=\'username\'] means "an input whose id is username". The @ means attribute.', mr: 'XPath हा element कडे बोट दाखवण्याचा आणखी एक मार्ग आहे. तो // ने सुरू होतो, म्हणजे "page वर कुठेही". मग tag, आणि मग चौकटी कंसात अट: //input[@id=\'username\'] म्हणजे "ज्याचा id username आहे असा input". @ म्हणजे attribute.' },
      { en: 'XPath can do one thing CSS cannot: find an element by its visible words. //button[text()=\'Log in\'] finds the button that says exactly "Log in". contains() is the forgiving version: //tr[contains(., \'Neha Joshi\')] finds the table row that has "Neha Joshi" anywhere in its text. The dot means "all the text inside".', mr: 'XPath एक गोष्ट करू शकतो जी CSS करू शकत नाही: दिसणाऱ्या शब्दांवरून element शोधणं. //button[text()=\'Log in\'] नेमकं "Log in" लिहिलेलं button शोधतो. contains() ही थोडी सैल आवृत्ती: //tr[contains(., \'Neha Joshi\')] अशी table row शोधतो जिच्या text मध्ये कुठेही "Neha Joshi" आहे. डॉट म्हणजे "आतला सगळा text".' },
      { en: 'An absolute XPath starts with a single / and walks from the very top: /html/body/main/form/button. That is "third building after the temple". Add one wrapper div and it points at nothing. A relative XPath starting with // describes the element itself, so it survives layout changes.', mr: 'absolute XPath एकाच / ने सुरू होतो आणि अगदी वरपासून चालतो: /html/body/main/form/button. हेच "मंदिरानंतरची तिसरी इमारत". एक wrapper div जोडला की तो कशाकडेच बोट दाखवत नाही. // ने सुरू होणारा relative XPath element चंच वर्णन करतो, म्हणून रचना बदलली तरी टिकतो.' },
      { en: 'The tester\'s preference order: id first (Flat 302), then name, then CSS, then XPath when you need text or nothing else works. For links there is a shortcut: By.linkText("Doctors") finds the link whose words are exactly "Doctors". A locator that breaks for no reason is a false alarm, and false alarms teach the team to ignore red tests.', mr: 'टेस्टरचा पसंतीक्रम: आधी id (फ्लॅट 302), मग name, मग CSS, आणि text लागत असेल किंवा दुसरं काहीच चालत नसेल तेव्हा XPath. links साठी एक shortcut आहे: By.linkText("Doctors") नेमके "Doctors" शब्द असलेली link शोधतो. विनाकारण तुटणारा locator म्हणजे खोटा धोक्याचा इशारा, आणि अशा इशाऱ्यांमुळे टीम लाल tests कडे दुर्लक्ष करायला शिकते.' },
    ],
    syntax: {
      template: `By.xpath("//tag[@attribute='value']")
By.xpath("//tag[text()='exact words']")
By.xpath("//tag[contains(., 'some words')]")
By.linkText("exact link words")`,
      parts: [
        { code: '//', means: { en: 'anywhere on the page (relative: safe)', mr: 'page वर कुठेही (relative: सुरक्षित)' } },
        { code: '/html/body/...', means: { en: 'absolute path from the top: breaks when the layout changes', mr: 'वरपासूनचा absolute path: रचना बदलली की तुटतो' } },
        { code: "[@id='login-btn']", means: { en: 'a condition on an attribute (@ means attribute)', mr: 'attribute वरची अट (@ म्हणजे attribute)' } },
        { code: "text()='Log in'", means: { en: 'the element\'s own words, matched exactly', mr: 'element चे स्वतःचे शब्द, नेमके जुळणारे' } },
        { code: "contains(., 'Neha')", means: { en: 'the text inside contains these words somewhere', mr: 'आतल्या text मध्ये हे शब्द कुठेतरी आहेत' } },
        { code: 'By.linkText("Doctors")', means: { en: 'the link whose visible words are exactly "Doctors"', mr: 'ज्या link चे दिसणारे शब्द नेमके "Doctors" आहेत' } },
      ],
      example: [
        { code: `driver.findElement(By.id("login-btn"));`, note: { en: 'Flat 302: the best address when an id exists', mr: 'फ्लॅट 302: id असेल तर सगळ्यात चांगला पत्ता' } },
        { code: `driver.findElement(By.xpath("//button[text()='Log in']"));`, note: { en: 'the door with the "Patil" name plate: found by what it says', mr: '"पाटील" पाटी असलेलं दार: त्यावर काय लिहिलंय त्यावरून सापडलं' } },
        { code: `driver.findElement(By.xpath("//tr[contains(., 'Neha Joshi')]"));`, note: { en: 'the row that mentions Neha Joshi, wherever it sits in the table', mr: 'Neha Joshi चा उल्लेख असलेली row, table मध्ये कुठेही असो' } },
        { code: `driver.findElement(By.linkText("Doctors")).click();`, note: { en: 'click the link that says Doctors', mr: 'Doctors लिहिलेल्या link वर click करा' } },
        { code: `driver.findElement(By.xpath("/html/body/main/form/button"));`, note: { en: 'third building after the temple: works today, breaks tomorrow', mr: 'मंदिरानंतरची तिसरी इमारत: आज चालतं, उद्या तुटतं' } },
      ],
      pitfall: { en: 'Inside a Java string the XPath uses single quotes for values: "//button[text()=\'Log in\']". If you use double quotes inside, Java thinks the string ended early. Also, text() must match exactly: "Log in" and "Login" are different words.', mr: 'Java string च्या आत XPath मधल्या values साठी single quotes वापरा: "//button[text()=\'Log in\']". आत double quotes वापरले तर Java ला वाटतं string आधीच संपली. आणि text() नेमकं जुळायला हवं: "Log in" आणि "Login" वेगळे शब्द आहेत.' },
    },
    practice: {
      intro: { en: 'Time to find elements by what they are. Press Run to watch the robot in the browser on the right, then Submit when it passes.', mr: 'आता elements ते काय आहेत त्यावरून शोधूया. उजवीकडच्या browser मध्ये robot पाहायला Run दाबा, आणि pass झालं की Submit करा.' },
      steps: [
        {
          kind: 'selenium',
          prompt: { en: 'The username and password are already typed. Find the login button with XPath, by its text "Log in", and click it. The assertion then checks you reached the dashboard.', mr: 'username आणि password आधीच टाइप केले आहेत. login button XPath ने, त्याच्या "Log in" text वरून शोधा, आणि त्यावर click करा. मग assertion तपासतो की तुम्ही dashboard वर पोहोचलात.' },
          startUrl: `${BASE}/login`,
          starter: `driver.get("${BASE}/login");
driver.findElement(By.id("username")).sendKeys("asha");
driver.findElement(By.id("password")).sendKeys("care123");
// TODO: find the button whose text is 'Log in' with By.xpath and click it

Assert.assertEquals(driver.getTitle(), "Dashboard | CareBridge");`,
          solution: `driver.get("${BASE}/login");
driver.findElement(By.id("username")).sendKeys("asha");
driver.findElement(By.id("password")).sendKeys("care123");
driver.findElement(By.xpath("//button[text()='Log in']")).click();
Assert.assertEquals(driver.getTitle(), "Dashboard | CareBridge");`,
          mustUse: [{ pattern: 'By\\.xpath\\(', message: { en: "Find the button with By.xpath, for example //button[text()='Log in'].", mr: "button By.xpath ने शोधा, उदाहरणार्थ //button[text()='Log in']." } }],
          minAssertions: 1,
          hints: [
            { en: 'The page also has a link that says "Log in" in the top bar. Ask for a button tag so you get the right one.', mr: 'वरच्या पट्टीत "Log in" लिहिलेली एक link पण आहे. योग्य element मिळावा म्हणून button tag मागा.' },
            { en: 'The shape is //button[text()=\'...\']. Use single quotes inside the Java string.', mr: 'रचना अशी: //button[text()=\'...\']. Java string च्या आत single quotes वापरा.' },
            { en: 'driver.findElement(By.xpath("//button[text()=\'Log in\']")).click();', mr: 'driver.findElement(By.xpath("//button[text()=\'Log in\']")).click();' },
          ],
          successLine: { en: 'Found by its words, clicked, and the dashboard opened. No id needed.', mr: 'शब्दांवरून सापडलं, click झालं, आणि dashboard उघडला. id ची गरजच पडली नाही.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'You are on the home page. Use By.linkText to click the "Doctors" link in the top bar, then assert the title is "Doctors | CareBridge".', mr: 'तुम्ही home page वर आहात. वरच्या पट्टीतल्या "Doctors" link वर By.linkText वापरून click करा, आणि मग title "Doctors | CareBridge" आहे हे assert करा.' },
          startUrl: `${BASE}/`,
          starter: `driver.get("${BASE}/");
// TODO: click the link whose words are exactly "Doctors"

// TODO: assert the page title
`,
          solution: `driver.get("${BASE}/");
driver.findElement(By.linkText("Doctors")).click();
Assert.assertEquals(driver.getTitle(), "Doctors | CareBridge");`,
          mustUse: [{ pattern: 'By\\.linkText\\(', message: { en: 'Use By.linkText("Doctors") to find the link.', mr: 'link शोधायला By.linkText("Doctors") वापरा.' } }],
          minAssertions: 1,
          hints: [
            { en: 'linkText matches the whole visible text of a link. The home page also has "See doctors", which is a different text.', mr: 'linkText link चा संपूर्ण दिसणारा text जुळवतो. home page वर "See doctors" पण आहे, तो वेगळा text आहे.' },
            { en: 'After the click, read driver.getTitle() and compare it with Assert.assertEquals(actual, expected).', mr: 'click नंतर driver.getTitle() वाचा आणि Assert.assertEquals(actual, expected) ने तुलना करा.' },
            { en: 'driver.findElement(By.linkText("Doctors")).click();\nAssert.assertEquals(driver.getTitle(), "Doctors | CareBridge");', mr: 'driver.findElement(By.linkText("Doctors")).click();\nAssert.assertEquals(driver.getTitle(), "Doctors | CareBridge");' },
          ],
          successLine: { en: 'Links are the easiest elements to find: by the words a user would click.', mr: 'links शोधायला सगळ्यात सोप्या: user ज्या शब्दांवर click करेल त्यावरून.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Press Run: both locators find the same login button today. Tomorrow Theo wraps the login form in a new <div class="panel">. Which locator still finds the button?', mr: 'Run दाबा: आज दोन्ही locators तेच login button शोधतात. उद्या Theo login form ला एका नव्या <div class="panel"> मध्ये गुंडाळतो. कोणता locator तरीही button शोधेल?' },
          seleniumSandbox: {
            startUrl: `${BASE}/login`,
            code: `driver.get("${BASE}/login");
WebElement brittle = driver.findElement(By.xpath("/html/body/main/form/button"));
System.out.println("Absolute XPath found: " + brittle.getText());
WebElement stable = driver.findElement(By.xpath("//button[text()='Log in']"));
System.out.println("Relative XPath found: " + stable.getText());`,
          },
          options: [
            { en: '/html/body/main/form/button, because it is more precise', mr: '/html/body/main/form/button, कारण तो जास्त नेमका आहे' },
            { en: "//button[text()='Log in'], because it describes the button itself", mr: "//button[text()='Log in'], कारण तो button चंच वर्णन करतो" },
            { en: 'Both, because they work today', mr: 'दोन्ही, कारण आज ते चालतात' },
            { en: 'Neither, XPath always breaks', mr: 'एकही नाही, XPath नेहमीच तुटतो' },
          ],
          correct: [1],
          explain: { en: 'The absolute path counts steps from the top: html, body, main, form, button. A new div adds a step, so form is no longer directly under main and the path finds nothing. The relative XPath asks for "a button that says Log in", wherever it lives. (By.id("login-btn") would survive too, and is even better.)', mr: 'absolute path वरपासून पावलं मोजतो: html, body, main, form, button. नवा div एक पाऊल वाढवतो, त्यामुळे form थेट main खाली राहत नाही आणि path ला काहीच सापडत नाही. relative XPath "Log in लिहिलेलं button" मागतो, ते कुठेही असो. (By.id("login-btn") सुद्धा टिकेल, आणि तो तर अजून चांगला आहे.)' },
          hints: [
            { en: 'Count the steps in the absolute path. What happens to that list when a new div appears between main and form?', mr: 'absolute path मधली पावलं मोजा. main आणि form च्या मध्ये नवा div आला तर त्या यादीचं काय होतं?' },
            { en: 'Think of "third building after the temple" versus "Flat 302".', mr: '"मंदिरानंतरची तिसरी इमारत" आणि "फ्लॅट 302" आठवा.' },
          ],
          successLine: { en: 'Describe the element itself, and the layout can change around it freely.', mr: 'element चं स्वतःचं वर्णन करा, मग त्याच्या भोवतीची रचना कितीही बदलू दे.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'On the Doctors page, find Dr. Neha Joshi\'s row with an XPath that uses contains(), then read the fee cell inside that row and assert it is "700".', mr: 'Doctors page वर, contains() वापरणाऱ्या XPath ने Dr. Neha Joshi ची row शोधा, मग त्या row मधला fee cell वाचा आणि तो "700" आहे हे assert करा.' },
          startUrl: `${BASE}/doctors`,
          starter: `driver.get("${BASE}/doctors");
// TODO: change the XPath so it finds the row that contains 'Neha Joshi'
WebElement row = driver.findElement(By.xpath("//tr[@id='TODO']"));
String fee = row.findElement(By.className("fee")).getText();
Assert.assertEquals(fee, "700");`,
          solution: `driver.get("${BASE}/doctors");
WebElement row = driver.findElement(By.xpath("//tr[contains(., 'Neha Joshi')]"));
String fee = row.findElement(By.className("fee")).getText();
Assert.assertEquals(fee, "700");`,
          mustUse: [{ pattern: 'By\\.xpath\\(', message: { en: 'Find the row with By.xpath and use contains() in it, for example //tr[contains(., \'Neha Joshi\')].', mr: 'तुमच्या XPath मध्ये contains() वापरा, उदाहरणार्थ //tr[contains(., \'Neha Joshi\')].' } }],
          minAssertions: 1,
          hints: [
            { en: 'The rows have no id. But each row\'s text includes the doctor\'s name.', mr: 'rows ना id नाही. पण प्रत्येक row च्या text मध्ये डॉक्टरचं नाव आहे.' },
            { en: 'The dot in contains(., \'...\') means all the text inside the row.', mr: 'contains(., \'...\') मधला डॉट म्हणजे row मधला सगळा text.' },
            { en: 'WebElement row = driver.findElement(By.xpath("//tr[contains(., \'Neha Joshi\')]"));', mr: 'WebElement row = driver.findElement(By.xpath("//tr[contains(., \'Neha Joshi\')]"));' },
          ],
          successLine: { en: 'Row by name, then the fee inside it: 700. If the table is sorted differently tomorrow, this still works.', mr: 'नावावरून row, मग तिच्या आतला fee: 700. उद्या table वेगळ्या क्रमाने लागली तरी हे चालेल.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Which locator is the most stable choice for the login button?', mr: 'login button साठी सगळ्यात टिकाऊ locator कोणता?' },
        code: `<button type="button" id="login-btn" class="btn btn-primary">Log in</button>`,
        options: ['By.id("login-btn")', 'By.xpath("/html/body/main/form/button")', 'By.className("btn")', 'By.xpath("//form/*[6]")'],
        answer: 0,
        explain: { en: 'An id is unique and belongs to the element itself: Flat 302. The class "btn" is shared by many buttons, and the other two count positions.', mr: 'id एकमेव असतो आणि element चाच असतो: फ्लॅट 302. "btn" class अनेक buttons ना असतो, आणि बाकीचे दोन जागा मोजतात.' },
      },
      {
        q: { en: 'What does this XPath find?', mr: 'हा XPath काय शोधतो?' },
        code: `By.xpath("//a[text()='Book appointment']")`,
        options: [
          { en: 'Every link on the page', mr: 'page वरची प्रत्येक link' },
          { en: 'Any element containing the word Book', mr: 'Book शब्द असलेला कोणताही element' },
          { en: 'A link whose text is exactly "Book appointment"', mr: 'ज्या link चा text नेमका "Book appointment" आहे अशी link' },
          { en: 'Nothing, text() is not allowed in XPath', mr: 'काहीच नाही, XPath मध्ये text() चालत नाही' },
        ],
        answer: 2,
        explain: { en: '//a means a link anywhere, and text()=\'...\' asks for those exact words. By.linkText("Book appointment") would do the same job more simply.', mr: '//a म्हणजे कुठेही असलेली link, आणि text()=\'...\' नेमके तेच शब्द मागतो. By.linkText("Book appointment") हेच काम अजून सोप्या पद्धतीने करेल.' },
      },
      {
        q: { en: 'A test fails after a designer adds a banner at the top of the page. The app works fine. Which locator was most likely used?', mr: 'designer ने page च्या वर एक banner जोडल्यावर एक test fail होते. app व्यवस्थित चालतंय. बहुधा कोणता locator वापरला होता?' },
        options: [
          'By.id("search")',
          'By.name("search")',
          "By.xpath(\"//input[@id='search']\")",
          'By.xpath("/html/body/main/div/div/div/input")',
        ],
        answer: 3,
        explain: { en: 'Only the absolute path depends on the exact chain of tags from the top. The others describe the search box itself and do not care what is above it.', mr: 'फक्त absolute path वरपासूनच्या tags च्या नेमक्या साखळीवर अवलंबून असतो. बाकीचे search box चंच वर्णन करतात, आणि वर काय आहे याची त्यांना पर्वा नसते.' },
      },
      {
        q: { en: 'What is the usual preference order for choosing a locator?', mr: 'locator निवडण्याचा नेहमीचा पसंतीक्रम कोणता?' },
        options: [
          { en: 'XPath, CSS, name, id', mr: 'XPath, CSS, name, id' },
          { en: 'id, name, CSS, then XPath', mr: 'id, name, CSS, आणि मग XPath' },
          { en: 'Absolute XPath first, it is the most exact', mr: 'आधी absolute XPath, तो सगळ्यात नेमका असतो' },
          { en: 'Whatever the browser copies for you', mr: 'browser जे कॉपी करून देईल ते' },
        ],
        answer: 1,
        explain: { en: 'Start with what belongs to the element (id, name), then CSS, and use XPath when you need text or nothing else fits. Copied locators are often absolute paths.', mr: 'element चं स्वतःचं जे आहे त्यापासून सुरुवात करा (id, name), मग CSS, आणि text लागत असेल किंवा दुसरं काही बसत नसेल तेव्हा XPath. कॉपी केलेले locators बहुतेक वेळा absolute paths असतात.' },
      },
    ],
    recap: { line: { en: 'Describe the element itself: id, name, CSS, then relative XPath with text() or contains(). Links: By.linkText.', mr: 'element चं स्वतःचं वर्णन करा: id, name, CSS, आणि मग text() किंवा contains() सह relative XPath. links साठी: By.linkText.' }, icon: '🧭' },
  },

  // ───────────────────────── S1.4 Interacting with the page
  {
    id: 'se1-4',
    code: 'S1.4',
    level: 'basic',
    title: { en: 'Talking to the Page: click, sendKeys, clear, dropdowns, checkboxes', mr: 'page शी संवाद: click, sendKeys, clear, dropdowns, checkboxes' },
    skill: 'Form interactions and Select',
    realLife: {
      place: 'clinic',
      title: { en: 'The receptionist\'s registration form', mr: 'रिसेप्शनिस्टचा नोंदणी फॉर्म' },
      story: {
        en: 'At Dr. Kulkarni\'s clinic in Sadashiv Peth, Sunita tai registers every new patient on the computer. She types the name. Oops, "Riyaa" with an extra a, so she erases it and types "Riya" again. She opens the doctor list and picks "Dr. Neha Joshi". She ticks "Patient agrees to clinic terms". The Save button stays grey until a time is chosen, and she knows that is correct. Type, erase, choose from a list, tick a box, check the button. Five small moves, all day long.',
        mr: 'सदाशिव पेठेतल्या डॉ. कुलकर्णींच्या दवाखान्यात सुनीता ताई प्रत्येक नव्या पेशंटची नोंद कॉम्प्युटरवर करतात. त्या नाव टाइप करतात. अरेच्चा, "Riyaa", एक a जास्त, म्हणून त्या ते पुसतात आणि पुन्हा "Riya" टाइप करतात. डॉक्टरांची यादी उघडून "Dr. Neha Joshi" निवडतात. "पेशंटला दवाखान्याचे नियम मान्य" वर टिक करतात. वेळ निवडेपर्यंत Save button राखाडीच राहतं, आणि ते बरोबर आहे हे त्यांना माहीत असतं. टाइप करा, पुसा, यादीतून निवडा, टिक करा, button तपासा. पाच छोट्या हालचाली, दिवसभर.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '⌨️', label: 'Type the name (sendKeys)', mr: 'नाव टाइप करा (sendKeys)' },
          { icon: '🧽', label: 'Erase the mistake (clear)', mr: 'चूक पुसा (clear)' },
          { icon: '📋', label: 'Pick a doctor (Select)', mr: 'डॉक्टर निवडा (Select)' },
          { icon: '☑️', label: 'Tick consent (click)', mr: 'संमतीवर टिक करा (click)' },
          { icon: '🔘', label: 'Save is grey? (isEnabled)', mr: 'Save राखाडी आहे? (isEnabled)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'neutral', text: { en: 'The booking form has a doctor drop-down, a name box, a terms checkbox and a Confirm button. Patients use all of it every day.', mr: 'booking form मध्ये doctor drop-down, नावाचा box, terms checkbox आणि Confirm button आहे. पेशंट्स रोज हे सगळं वापरतात.' } },
        { who: 'rex', mood: 'happy', text: { en: 'Clicking is only the start. A real script types, erases, picks from lists, ticks boxes and then asks the page what state it is in.', mr: 'click ही फक्त सुरुवात आहे. खरा script टाइप करतो, पुसतो, यादीतून निवडतो, boxes वर टिक करतो, आणि मग page ला विचारतो की ते कोणत्या स्थितीत आहे.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'what if the confirm button lights up too early? patients book with no time slot. heh.', mr: 'confirm button खूप लवकर चालू झालं तर? पेशंट्स वेळ न निवडता book करतील. हेहे.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'Then we test that too, {name}. A button that should be disabled is a fact we can check.', mr: 'मग तेही आपण तपासू, {name}. जे button बंद असायला हवं, ते तपासता येणारं एक तथ्य आहे.' } },
      ],
      problem: { en: 'Forms have text boxes, drop-downs and checkboxes, and each needs a different action. Testing every combination by hand before each release takes hours.', mr: 'forms मध्ये text boxes, drop-downs आणि checkboxes असतात, आणि प्रत्येकासाठी वेगळी कृती लागते. प्रत्येक release आधी प्रत्येक combination हाताने तपासायला तास लागतात.' },
      solution: { en: 'Use sendKeys to type (with Keys.ENTER to press Enter), clear to erase, new Select(...) for drop-downs, click for checkboxes, and read the state back with getAttribute("value"), isSelected and isEnabled.', mr: 'टाइप करायला sendKeys (Enter दाबायला Keys.ENTER सह), पुसायला clear, drop-downs साठी new Select(...), checkboxes साठी click, आणि स्थिती परत वाचायला getAttribute("value"), isSelected आणि isEnabled वापरा.' },
    },
    lesson: [
      { en: 'sendKeys types into a text box, letter by letter, like a person. It adds to whatever is already there, so use clear() first when you want to replace text. Keys.ENTER presses the Enter key: sendKeys("care123", Keys.ENTER) types the password and submits the login.', mr: 'sendKeys text box मध्ये माणसासारखं, एकेक अक्षर टाइप करतो. आधीपासून जे आहे त्यात तो भर घालतो, म्हणून text बदलायचा असेल तर आधी clear() वापरा. Keys.ENTER म्हणजे Enter key दाबणं: sendKeys("care123", Keys.ENTER) password टाइप करून login पाठवतो.' },
      { en: 'To read what is inside a text box, use getAttribute("value"). getText() is for visible words on the page, like headings and table cells, and it gives an empty string for input boxes.', mr: 'text box मध्ये काय आहे ते वाचायला getAttribute("value") वापरा. getText() page वरच्या दिसणाऱ्या शब्दांसाठी आहे, जसे headings आणि table cells, आणि input boxes साठी तो रिकामी string देतो.' },
      { en: 'A drop-down is a <select> element. Wrap it: new Select(driver.findElement(By.id("speciality"))). Then selectByVisibleText("Cardiology") picks by the words you see, and selectByValue("3") picks by the hidden value. getFirstSelectedOption() tells you what is chosen now.', mr: 'drop-down म्हणजे <select> element. त्याला असं गुंडाळा: new Select(driver.findElement(By.id("speciality"))). मग selectByVisibleText("Cardiology") दिसणाऱ्या शब्दांवरून निवडतो, आणि selectByValue("3") लपलेल्या value वरून निवडतो. आत्ता काय निवडलं आहे ते getFirstSelectedOption() सांगतो.' },
      { en: 'A checkbox is ticked with click(), and isSelected() tells you if it is ticked. isEnabled() tells you if a button can be used. The tester\'s angle: after every action, ask the page what changed. A disabled button that should be disabled is a passing check, and one that lights up too early is a bug.', mr: 'checkbox वर click() ने टिक होते, आणि ती टिक आहे का ते isSelected() सांगतो. button वापरता येतं का ते isEnabled() सांगतो. टेस्टरची नजर: प्रत्येक कृतीनंतर page ला विचारा काय बदललं. जे button बंद असायला हवं ते बंद असणं म्हणजे pass झालेला check, आणि ते खूप लवकर चालू होणं म्हणजे bug.' },
    ],
    syntax: {
      template: `WebElement box = driver.findElement(By.id("..."));
box.sendKeys("text");          // type
box.sendKeys("text", Keys.ENTER); // type, then press Enter
box.clear();                   // erase
box.getAttribute("value");     // read what is typed
new Select(driver.findElement(By.id("..."))).selectByVisibleText("...");
element.click();  element.isSelected();  element.isEnabled();`,
      parts: [
        { code: 'sendKeys("text")', means: { en: 'type into a text box (adds to what is there)', mr: 'text box मध्ये टाइप करा (आधीच्या मजकुरात भर पडते)' } },
        { code: 'Keys.ENTER', means: { en: 'press the Enter key', mr: 'Enter key दाबा' } },
        { code: 'clear()', means: { en: 'erase the text box', mr: 'text box पुसून रिकामा करा' } },
        { code: 'getAttribute("value")', means: { en: 'what is typed inside a text box right now', mr: 'text box मध्ये आत्ता काय टाइप केलं आहे' } },
        { code: 'new Select(el).selectByVisibleText("...")', means: { en: 'pick a drop-down option by the words you see (selectByValue picks by value)', mr: 'drop-down मधला पर्याय दिसणाऱ्या शब्दांवरून निवडा (selectByValue value वरून निवडतो)' } },
        { code: 'isSelected() / isEnabled()', means: { en: 'is the checkbox ticked? can the button be used?', mr: 'checkbox वर टिक आहे का? button वापरता येतं का?' } },
      ],
      example: [
        { code: `WebElement name = driver.findElement(By.id("patient-name"));`, note: { en: 'Sunita tai puts the cursor in the name box', mr: 'सुनीता ताई नावाच्या box मध्ये cursor ठेवतात' } },
        { code: `name.sendKeys("Riyaa");`, note: { en: 'oops, an extra a', mr: 'अरेच्चा, एक a जास्त' } },
        { code: `name.clear();\nname.sendKeys("Riya");`, note: { en: 'erase and type again', mr: 'पुसा आणि पुन्हा टाइप करा' } },
        { code: `new Select(driver.findElement(By.id("doctor"))).selectByVisibleText("Dr. Neha Joshi (Pediatrics)");`, note: { en: 'pick the doctor from the list, by the words on screen', mr: 'स्क्रीनवरच्या शब्दांवरून यादीतून डॉक्टर निवडा' } },
        { code: `driver.findElement(By.id("terms")).click();`, note: { en: 'tick the consent box', mr: 'संमतीच्या box वर टिक करा' } },
        { code: `Assert.assertFalse(driver.findElement(By.id("confirm-btn")).isEnabled());`, note: { en: 'Save is still grey: no time chosen yet, and that is correct', mr: 'Save अजून राखाडी: वेळ अजून निवडली नाही, आणि ते बरोबर आहे' } },
      ],
      pitfall: { en: 'Calling click() on a <select> does not choose anything, and sendKeys on a checkbox fails with ElementNotInteractableException. Each control has its own move: Select for drop-downs, click for checkboxes, sendKeys for text boxes.', mr: '<select> वर click() केल्याने काहीच निवडलं जात नाही, आणि checkbox वर sendKeys केलं तर ElementNotInteractableException येतो. प्रत्येक control ची स्वतःची हालचाल आहे: drop-downs साठी Select, checkboxes साठी click, text boxes साठी sendKeys.' },
    },
    practice: {
      intro: { en: 'Four small jobs on CareBridge forms. Run to watch the robot, Submit when the log is green. Some steps also hide a bug in a build to see if your check would notice.', mr: 'CareBridge च्या forms वर चार छोटी कामं. robot पाहायला Run, log हिरवा झाला की Submit. काही steps मध्ये एका build मध्ये bug लपवलेला असतो, तुमचा check तो पकडतो का ते पाहायला.' },
      steps: [
        {
          kind: 'selenium',
          prompt: { en: 'Log in without clicking the button: type the password and press Enter in the same sendKeys, using Keys.ENTER.', mr: 'button वर click न करता login करा: एकाच sendKeys मध्ये password टाइप करा आणि Keys.ENTER वापरून Enter दाबा.' },
          startUrl: `${BASE}/login`,
          starter: `driver.get("${BASE}/login");
driver.findElement(By.id("username")).sendKeys("asha");
// TODO: type care123 into #password and press Enter in the same sendKeys
driver.findElement(By.id("password")).sendKeys("care123");
Assert.assertEquals(driver.getTitle(), "Dashboard | CareBridge");`,
          solution: `driver.get("${BASE}/login");
driver.findElement(By.id("username")).sendKeys("asha");
driver.findElement(By.id("password")).sendKeys("care123", Keys.ENTER);
Assert.assertEquals(driver.getTitle(), "Dashboard | CareBridge");`,
          mustUse: [{ pattern: 'Keys\\.ENTER', message: { en: 'Press Enter with Keys.ENTER inside sendKeys.', mr: 'sendKeys मध्ये Keys.ENTER ने Enter दाबा.' } }],
          mustNotUse: [{ pattern: '\\.click\\(', message: { en: 'No clicking this time: Enter should do the login.', mr: 'या वेळी click नको: Enter नेच login व्हायला हवं.' } }],
          minAssertions: 1,
          hints: [
            { en: 'sendKeys can take more than one thing, separated by commas.', mr: 'sendKeys ला स्वल्पविरामाने वेगळ्या केलेल्या एकापेक्षा जास्त गोष्टी देता येतात.' },
            { en: 'Add Keys.ENTER after the password text.', mr: 'password च्या text नंतर Keys.ENTER जोडा.' },
            { en: 'driver.findElement(By.id("password")).sendKeys("care123", Keys.ENTER);', mr: 'driver.findElement(By.id("password")).sendKeys("care123", Keys.ENTER);' },
          ],
          successLine: { en: 'Enter works on the login form, just like a real user pressing it.', mr: 'login form वर Enter चालतो, खऱ्या user ने दाबल्यासारखाच.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'On the Doctors page, type "car" (lowercase) into #search. Cardiology matches, so assert #result-count says "2 doctors found". A hidden build makes search case sensitive; lowercase text is what exposes it.', mr: 'Doctors page वर #search मध्ये "car" (lowercase) टाइप करा. Cardiology जुळतं, म्हणून #result-count "2 doctors found" दाखवतो हे assert करा. एका लपलेल्या build मध्ये search case sensitive होतो; lowercase text नेच तो उघडा पडतो.' },
          startUrl: `${BASE}/doctors`,
          starter: `driver.get("${BASE}/doctors");
// TODO: type car into the search box (id "search")

String count = driver.findElement(By.id("result-count")).getText();
Assert.assertEquals(count, "2 doctors found");`,
          solution: `driver.get("${BASE}/doctors");
driver.findElement(By.id("search")).sendKeys("car");
String count = driver.findElement(By.id("result-count")).getText();
Assert.assertEquals(count, "2 doctors found");`,
          mustUse: [{ pattern: 'sendKeys\\(\\s*"car"', message: { en: 'Type exactly "car" in lowercase. That is the text that shows the case bug.', mr: 'नेमकं lowercase "car" टाइप करा. तोच text case bug दाखवतो.' } }],
          minAssertions: 1,
          mustCatch: [{ bug: 'search-case', label: { en: 'Search is case sensitive ("car" finds no Cardiology)', mr: 'search case sensitive आहे ("car" ने Cardiology सापडत नाही)' } }],
          hints: [
            { en: 'The search filters as you type, so no button is needed.', mr: 'search टाइप करतानाच filter करतो, त्यामुळे button ची गरज नाही.' },
            { en: 'Find By.id("search") and call sendKeys("car") on it.', mr: 'By.id("search") शोधा आणि त्यावर sendKeys("car") करा.' },
            { en: 'driver.findElement(By.id("search")).sendKeys("car");', mr: 'driver.findElement(By.id("search")).sendKeys("car");' },
          ],
          successLine: { en: 'Two cardiologists found, and on the buggy build your check saw "0 doctors found". Picking the right test data is half of testing.', mr: 'दोन cardiologists सापडले, आणि buggy build वर तुमच्या check ला "0 doctors found" दिसलं. योग्य test data निवडणं हे अर्धं testing आहे.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Still on Doctors: choose "Cardiology" in the #speciality drop-down with new Select(...), then assert there are exactly 2 rows with the class doctor-row.', mr: 'अजून Doctors वरच: #speciality drop-down मध्ये new Select(...) वापरून "Cardiology" निवडा, आणि मग doctor-row class असलेल्या नेमक्या 2 rows आहेत हे assert करा.' },
          startUrl: `${BASE}/doctors`,
          starter: `driver.get("${BASE}/doctors");
// TODO: wrap #speciality in new Select(...) and choose Cardiology

List<WebElement> rows = driver.findElements(By.className("doctor-row"));
Assert.assertEquals(rows.size(), 2);`,
          solution: `driver.get("${BASE}/doctors");
Select speciality = new Select(driver.findElement(By.id("speciality")));
speciality.selectByVisibleText("Cardiology");
List<WebElement> rows = driver.findElements(By.className("doctor-row"));
Assert.assertEquals(rows.size(), 2);`,
          mustUse: [{ pattern: 'new\\s+Select\\(', message: { en: 'Use new Select(...) to work with the drop-down.', mr: 'drop-down सोबत काम करायला new Select(...) वापरा.' } }],
          minAssertions: 1,
          mustCatch: [{ bug: 'filter-extra', label: { en: 'Cardiology filter also shows a General doctor', mr: 'Cardiology filter एक General डॉक्टरपण दाखवतो' } }],
          hints: [
            { en: 'First find the <select> with By.id("speciality"), then wrap it in new Select(...).', mr: 'आधी By.id("speciality") ने <select> शोधा, मग त्याला new Select(...) मध्ये गुंडाळा.' },
            { en: 'selectByVisibleText("Cardiology") or selectByValue("Cardiology") both work here.', mr: 'इथे selectByVisibleText("Cardiology") किंवा selectByValue("Cardiology") दोन्ही चालतात.' },
            { en: 'Select speciality = new Select(driver.findElement(By.id("speciality")));\nspeciality.selectByVisibleText("Cardiology");', mr: 'Select speciality = new Select(driver.findElement(By.id("speciality")));\nspeciality.selectByVisibleText("Cardiology");' },
          ],
          successLine: { en: 'Two rows on the good build, three on the buggy one. Counting rows caught a filter that lets in a stranger.', mr: 'चांगल्या build वर दोन rows, buggy build वर तीन. rows मोजल्याने अनोळखी डॉक्टरला आत घेणारा filter पकडला.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Asha is logged in on the booking page. Choose "Dr. Neha Joshi (Pediatrics)" with Select. The script types "Riyaa" by mistake: clear it and type "Riya". Tick #terms. Then assert three facts: the name box value is "Riya", #terms isSelected, and #confirm-btn is still disabled (no slot picked yet).', mr: 'Asha booking page वर logged in आहे. Select वापरून "Dr. Neha Joshi (Pediatrics)" निवडा. script चुकून "Riyaa" टाइप करतो: ते clear करा आणि "Riya" टाइप करा. #terms वर टिक करा. मग तीन तथ्यं assert करा: नावाच्या box ची value "Riya" आहे, #terms isSelected आहे, आणि #confirm-btn अजून बंद आहे (अजून slot निवडला नाही).' },
          startUrl: `${BASE}/book`,
          loggedIn: true,
          starter: `driver.get("${BASE}/book");
Select doctor = new Select(driver.findElement(By.id("doctor")));
// TODO: choose Dr. Neha Joshi (Pediatrics)

WebElement name = driver.findElement(By.id("patient-name"));
name.sendKeys("Riyaa");
// TODO: clear the box and type Riya

WebElement terms = driver.findElement(By.id("terms"));
// TODO: tick the terms checkbox

Assert.assertEquals(name.getAttribute("value"), "Riya");
Assert.assertTrue(terms.isSelected(), "Terms should be ticked");
// TODO: assert that #confirm-btn is not enabled (assertFalse + isEnabled)
`,
          solution: `driver.get("${BASE}/book");
Select doctor = new Select(driver.findElement(By.id("doctor")));
doctor.selectByVisibleText("Dr. Neha Joshi (Pediatrics)");
WebElement name = driver.findElement(By.id("patient-name"));
name.sendKeys("Riyaa");
name.clear();
name.sendKeys("Riya");
WebElement terms = driver.findElement(By.id("terms"));
terms.click();
Assert.assertEquals(name.getAttribute("value"), "Riya");
Assert.assertTrue(terms.isSelected(), "Terms should be ticked");
Assert.assertFalse(driver.findElement(By.id("confirm-btn")).isEnabled(), "Confirm must wait for a time slot");`,
          mustUse: [
            { pattern: 'select(ByVisibleText|ByValue)\\(', message: { en: 'Choose the doctor with selectByVisibleText or selectByValue.', mr: 'डॉक्टर selectByVisibleText किंवा selectByValue ने निवडा.' } },
            { pattern: '\\.clear\\(\\)', message: { en: 'Erase the mistake with clear() before typing again.', mr: 'पुन्हा टाइप करण्याआधी clear() ने चूक पुसा.' } },
            { pattern: 'isEnabled\\(\\)', message: { en: 'Check the Confirm button with isEnabled().', mr: 'Confirm button isEnabled() ने तपासा.' } },
          ],
          verify: [{ check: (s) => s.path.startsWith('/book'), message: { en: 'Stay on the booking page: nothing should be booked yet.', mr: 'booking page वरच राहा: अजून काहीही book व्हायला नको.' } }],
          minAssertions: 3,
          hints: [
            { en: 'The doctor option text is exactly "Dr. Neha Joshi (Pediatrics)". Its value is "3", so selectByValue("3") also works.', mr: 'डॉक्टरच्या पर्यायाचा text नेमका "Dr. Neha Joshi (Pediatrics)" आहे. त्याची value "3" आहे, म्हणून selectByValue("3") पण चालतं.' },
            { en: 'sendKeys adds to the box. Call name.clear() first, then name.sendKeys("Riya").', mr: 'sendKeys box मध्ये भर घालतो. आधी name.clear(), मग name.sendKeys("Riya").' },
            { en: 'A checkbox is ticked with click(). The last check is assertFalse on isEnabled().', mr: 'checkbox वर click() ने टिक होते. शेवटचा check म्हणजे isEnabled() वर assertFalse.' },
            { en: 'doctor.selectByVisibleText("Dr. Neha Joshi (Pediatrics)");\nname.clear();\nname.sendKeys("Riya");\nterms.click();\nAssert.assertFalse(driver.findElement(By.id("confirm-btn")).isEnabled(), "Confirm must wait for a time slot");', mr: 'doctor.selectByVisibleText("Dr. Neha Joshi (Pediatrics)");\nname.clear();\nname.sendKeys("Riya");\nterms.click();\nAssert.assertFalse(driver.findElement(By.id("confirm-btn")).isEnabled(), "Confirm must wait for a time slot");' },
          ],
          successLine: { en: 'Typed, erased, chosen, ticked, and the Confirm button correctly stays grey. Picking the slot needs waits: that is S1.6.', mr: 'टाइप केलं, पुसलं, निवडलं, टिक केलं, आणि Confirm button बरोबर राखाडीच राहिलं. slot निवडायला waits लागतात: ते S1.6 मध्ये.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'The name box already says "Riyaa". What does it contain after this code?', mr: 'नावाच्या box मध्ये आधीच "Riyaa" आहे. हा code चालल्यावर त्यात काय असेल?' },
        code: `name.sendKeys("Riya");`,
        options: ['Riya', 'RiyaaRiya', 'Riyaa', { en: 'An empty box', mr: 'रिकामा box' }],
        answer: 1,
        explain: { en: 'sendKeys adds to what is already there. To replace the text, call clear() first.', mr: 'sendKeys आधीच्या मजकुरात भर घालतो. text बदलायचा असेल तर आधी clear() करा.' },
      },
      {
        q: { en: 'How do you read what is typed inside a text box?', mr: 'text box मध्ये काय टाइप केलं आहे ते कसं वाचायचं?' },
        options: ['getText()', 'getTitle()', 'isSelected()', 'getAttribute("value")'],
        answer: 3,
        explain: { en: 'getText() reads visible words on the page and gives "" for input boxes. The typed text lives in the value.', mr: 'getText() page वरचे दिसणारे शब्द वाचतो आणि input boxes साठी "" देतो. टाइप केलेला text value मध्ये असतो.' },
      },
      {
        q: { en: 'Which line picks "Pediatrics" in the #speciality drop-down?', mr: '#speciality drop-down मध्ये "Pediatrics" कोणती ओळ निवडते?' },
        options: [
          'driver.findElement(By.id("speciality")).sendKeys("Pediatrics");',
          'driver.findElement(By.id("speciality")).click("Pediatrics");',
          'new Select(driver.findElement(By.id("speciality"))).selectByVisibleText("Pediatrics");',
          'new Select("Pediatrics");',
        ],
        answer: 2,
        explain: { en: 'Drop-downs are handled by wrapping the <select> element in new Select(...), then choosing an option.', mr: 'drop-downs हाताळायला <select> element ला new Select(...) मध्ये गुंडाळा, आणि मग पर्याय निवडा.' },
      },
      {
        q: { en: 'No time slot is picked yet. What should this assertion do on a correct build?', mr: 'अजून कोणताही time slot निवडलेला नाही. योग्य build वर हे assertion काय करायला हवं?' },
        code: `Assert.assertFalse(driver.findElement(By.id("confirm-btn")).isEnabled());`,
        options: [
          { en: 'Pass, because the button is disabled until a slot and terms are chosen', mr: 'pass, कारण slot आणि terms निवडेपर्यंत button बंद असतं' },
          { en: 'Fail, because buttons are always enabled', mr: 'fail, कारण buttons नेहमी चालू असतात' },
          { en: 'Throw NoSuchElementException', mr: 'NoSuchElementException टाकेल' },
          { en: 'Click the button', mr: 'button वर click करेल' },
        ],
        answer: 0,
        explain: { en: 'isEnabled() is false, so assertFalse passes. If a bug turned the button on too early, this check would go red.', mr: 'isEnabled() false आहे, म्हणून assertFalse pass होतं. bug मुळे button खूप लवकर चालू झालं, तर हा check लाल होईल.' },
      },
    ],
    recap: { line: { en: 'sendKeys types (Keys.ENTER presses Enter), clear erases, Select picks, click ticks. Then ask the page: getAttribute("value"), isSelected, isEnabled.', mr: 'sendKeys टाइप करतो (Keys.ENTER Enter दाबतो), clear पुसतो, Select निवडतो, click टिक करतो. मग page ला विचारा: getAttribute("value"), isSelected, isEnabled.' }, icon: '📝' },
  },

  // ───────────────────────── S1.5 Assertions
  {
    id: 'se1-5',
    code: 'S1.5',
    level: 'basic',
    title: { en: 'Assertions: Making a Test Prove Something', mr: 'Assertions: test ला काहीतरी सिद्ध करायला लावणं' },
    skill: 'TestNG assertions',
    realLife: {
      place: 'restaurant',
      title: { en: 'Checking the bill before you pay', mr: 'पैसे देण्याआधी बिल तपासणं' },
      story: {
        en: 'Sunday lunch at a misal place on FC Road. You ordered two misal pav, one poha and two cutting chai. The bill comes. Your friend just looks at the total and says "fine, pay it". You read it line by line, and there it is: a paneer tikka nobody ordered. Your friend\'s "check" could never have found anything, because it never compared the bill with the order. Yours could, so it did.',
        mr: 'रविवारचं जेवण FC रोडवरच्या मिसळच्या हॉटेलमध्ये. तुम्ही दोन मिसळ पाव, एक पोहे आणि दोन कटिंग चहा मागवले. बिल येतं. मित्र फक्त एकूण रक्कम पाहतो आणि म्हणतो "ठीक आहे, देऊन टाक". तुम्ही ओळ न ओळ वाचता, आणि तिथेच दिसतं: कोणीही न मागवलेला पनीर टिक्का. मित्राच्या "तपासणी" ला कधीच काही सापडलं नसतं, कारण त्याने बिलाची ऑर्डरशी तुलनाच केली नाही. तुमच्या तपासणीला सापडू शकत होतं, म्हणून सापडलं.',
      },
      scene: {
        type: 'match',
        leftTitle: { en: 'What you ordered', mr: 'तुम्ही काय मागवलं' },
        rightTitle: { en: 'What the bill says', mr: 'बिलावर काय आहे' },
        left: [
          { icon: '🍲', label: 'Misal pav x2', mr: 'मिसळ पाव x2' },
          { icon: '🍛', label: 'Poha x1', mr: 'पोहे x1' },
          { icon: '☕', label: 'Cutting chai x2', mr: 'कटिंग चहा x2' },
        ],
        right: [
          { icon: '🍲', label: 'Misal pav x2', mr: 'मिसळ पाव x2' },
          { icon: '🍛', label: 'Poha x1', mr: 'पोहे x1' },
          { icon: '☕', label: 'Cutting chai x2', mr: 'कटिंग चहा x2' },
          { icon: '🧀', label: 'Paneer tikka x1', mr: 'पनीर टिक्का x1' },
        ],
        links: [[0, 0], [1, 1], [2, 2]],
        mode: 'inner',
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'happy', text: { en: 'Good news: the login test is green. It types a wrong password, clicks Log in, and nothing crashes.', mr: 'चांगली बातमी: login test हिरवी आहे. ती चुकीचा password टाइप करते, Log in वर click करते, आणि काहीच crash होत नाही.' } },
        { who: 'rex', mood: 'worried', text: { en: 'And what does it check? If the error message never appears, would it still be green?', mr: 'आणि ती तपासते काय? error message कधीच दिसला नाही, तरी ती हिरवीच राहील का?' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'i already hid the error message in tonight\'s build. your green test says hi.', mr: 'आजच्या रात्रीच्या build मध्ये मी error message आधीच लपवलाय. तुमची हिरवी test नमस्कार सांगतेय.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'A test that cannot fail is a friend who only looks at the total. Let us make it read the bill, {name}.', mr: 'जी test कधीच fail होऊ शकत नाही, ती फक्त एकूण रक्कम पाहणाऱ्या मित्रासारखी. चला, तिला बिल वाचायला लावूया, {name}.' } },
      ],
      problem: { en: 'A script that only clicks around passes even when the page is broken. Green tests that check nothing give the team false confidence before a release.', mr: 'फक्त इकडेतिकडे click करणारा script page बिघडलेलं असतानाही pass होतो. काहीच न तपासणाऱ्या हिरव्या tests release आधी टीमला खोटा आत्मविश्वास देतात.' },
      solution: { en: 'Add TestNG assertions that compare what the page shows with what it should show: assertEquals(actual, expected), assertTrue, assertFalse, each with a clear message. Then ask: would this test catch a bug?', mr: 'page जे दाखवतं त्याची, त्याने जे दाखवायला हवं त्याच्याशी तुलना करणारे TestNG assertions जोडा: assertEquals(actual, expected), assertTrue, assertFalse, प्रत्येकासोबत स्पष्ट message. मग विचारा: ही test bug पकडेल का?' },
    },
    lesson: [
      { en: 'An assertion is the moment your test compares the bill with the order. Assert.assertEquals(actual, expected) checks that two values are the same. In TestNG the actual value comes first (what the page shows) and the expected value second (what it should show).', mr: 'assertion म्हणजे तो क्षण जेव्हा test बिलाची ऑर्डरशी तुलना करते. Assert.assertEquals(actual, expected) दोन values सारख्या आहेत का ते तपासतो. TestNG मध्ये actual value आधी (page जे दाखवतं) आणि expected value नंतर (त्याने जे दाखवायला हवं).' },
      { en: 'Assert.assertTrue(condition, "message") passes only when the condition is true, assertFalse only when it is false. The message is for the person reading the failure at midnight: "Error message should be visible" says far more than a bare "expected [true] but found [false]".', mr: 'Assert.assertTrue(condition, "message") फक्त condition true असेल तेव्हाच pass होतो, आणि assertFalse फक्त false असेल तेव्हा. message हा मध्यरात्री failure वाचणाऱ्या माणसासाठी असतो: "Error message should be visible" हे नुसत्या "expected [true] but found [false]" पेक्षा खूप जास्त सांगतं.' },
      { en: 'When an assertion fails, TestNG prints "expected [X] but found [Y]". X is what you wrote as expected, Y is what the page really showed. Read Y first: it tells you what the app did. The test stops at the first failed assertion, so check one clear fact per assertion.', mr: 'assertion fail झालं की TestNG "expected [X] but found [Y]" छापतो. X म्हणजे तुम्ही expected म्हणून लिहिलं ते, Y म्हणजे page ने खरंच दाखवलं ते. आधी Y वाचा: app ने काय केलं ते तो सांगतो. पहिल्याच fail झालेल्या assertion वर test थांबते, म्हणून प्रत्येक assertion मध्ये एकच स्पष्ट तथ्य तपासा.' },
      { en: 'The tester\'s question for every test: would this catch a bug? Imagine the feature is broken. If your test would still be green, it proves nothing. In this game, some steps run your code again on a buggy build, and it must go red there.', mr: 'प्रत्येक test साठी टेस्टरचा प्रश्न: ही bug पकडेल का? feature बिघडलं आहे अशी कल्पना करा. तरीही तुमची test हिरवी राहत असेल, तर ती काहीच सिद्ध करत नाही. या game मध्ये काही steps तुमचा code buggy build वर पुन्हा चालवतात, आणि तिथे तो लाल व्हायलाच हवा.' },
    ],
    syntax: {
      template: `Assert.assertEquals(actual, expected);
Assert.assertEquals(actual, expected, "what this checks");
Assert.assertTrue(condition, "what should be true");
Assert.assertFalse(condition, "what should be false");`,
      parts: [
        { code: 'Assert.assertEquals(actual, expected)', means: { en: 'the page value must equal the expected value (actual first in TestNG)', mr: 'page वरची value expected value इतकीच हवी (TestNG मध्ये actual आधी)' } },
        { code: 'Assert.assertTrue(condition, "msg")', means: { en: 'passes only if the condition is true', mr: 'condition true असेल तरच pass' } },
        { code: 'Assert.assertFalse(condition, "msg")', means: { en: 'passes only if the condition is false', mr: 'condition false असेल तरच pass' } },
        { code: '"msg"', means: { en: 'your note, printed in front of the failure', mr: 'तुमची टीप, failure च्या आधी छापली जाते' } },
        { code: 'expected [X] but found [Y]', means: { en: 'how a failure reads: X is what you wanted, Y is what the page showed', mr: 'failure असा वाचायचा: X म्हणजे तुम्हाला हवं होतं ते, Y म्हणजे page ने दाखवलं ते' } },
      ],
      example: [
        { code: `String bill = driver.findElement(By.id("login-error")).getText();`, note: { en: 'pick up the bill: read what the page shows', mr: 'बिल हातात घ्या: page काय दाखवतं ते वाचा' } },
        { code: `Assert.assertEquals(bill, "Invalid username or password");`, note: { en: 'compare it line by line with what you expected', mr: 'अपेक्षित गोष्टीशी ओळ न ओळ तुलना करा' } },
        { code: `Assert.assertTrue(error.isDisplayed(), "Error message should be visible");`, note: { en: 'one fact, with a note your teammate can understand', mr: 'एक तथ्य, टीममधल्या सहकाऱ्याला समजेल अशा टिपेसह' } },
        { code: `// expected [Invalid username or password] but found []`, note: { en: 'the failure: you wanted the message, the page showed nothing', mr: 'failure: तुम्हाला message हवा होता, page ने काहीच दाखवलं नाही' } },
        { code: `Assert.assertTrue(true);`, note: { en: 'only looking at the total: this can never fail, so it proves nothing', mr: 'फक्त एकूण रक्कम पाहणं: हे कधीच fail होऊ शकत नाही, म्हणून काहीच सिद्ध करत नाही' } },
      ],
      pitfall: { en: 'Swapping the order, assertEquals("Invalid username or password", text), still passes when the values match, but on failure the message lies: it calls the page value "expected". In TestNG, always write actual first, expected second.', mr: 'क्रम उलटा केला, assertEquals("Invalid username or password", text), तर values जुळतात तेव्हा test pass होते, पण fail झाल्यावर message खोटं सांगतो: तो page च्या value ला "expected" म्हणतो. TestNG मध्ये नेहमी आधी actual, मग expected लिहा.' },
    },
    practice: {
      intro: { en: 'Tonight\'s build has bugs in it. First prove one with a failing test, then write checks on the good build that would catch them. Run, read the log under the browser, then Submit.', mr: 'आजच्या रात्रीच्या build मध्ये bugs आहेत. आधी एका failing test ने एक bug सिद्ध करा, मग चांगल्या build वर असे checks लिहा जे ते पकडतील. Run करा, browser खालचा log वाचा, मग Submit करा.' },
      steps: [
        {
          kind: 'selenium',
          prompt: { en: 'Bug hunt. This practice browser runs the build where gremlin hid the login error. The script logs in with a wrong password. Add an assertion that the error message is displayed. On this build your test must fail on that assertion: that red line is your proof.', mr: 'Bug hunt. हा practice browser तो build चालवतो ज्यात gremlin ने login error लपवला आहे. script चुकीच्या password ने login करतो. error message दिसतो आहे असं assertion जोडा. या build वर तुमची test त्या assertion वर fail व्हायलाच हवी: ती लाल ओळ म्हणजे तुमचा पुरावा.' },
          startUrl: `${BASE}/login`,
          build: ['login-error-hidden'],
          expectFailure: true,
          starter: `driver.get("${BASE}/login");
driver.findElement(By.id("username")).sendKeys("asha");
driver.findElement(By.id("password")).sendKeys("wrong123", Keys.ENTER);
WebElement error = driver.findElement(By.id("login-error"));
// TODO: assert that the error is displayed, with a clear message
`,
          solution: `driver.get("${BASE}/login");
driver.findElement(By.id("username")).sendKeys("asha");
driver.findElement(By.id("password")).sendKeys("wrong123", Keys.ENTER);
WebElement error = driver.findElement(By.id("login-error"));
Assert.assertTrue(error.isDisplayed(), "Error message should be visible after a wrong password");`,
          mustUse: [{ pattern: 'isDisplayed\\(\\)', message: { en: 'Check the error with isDisplayed() inside an assertion.', mr: 'error assertion च्या आत isDisplayed() ने तपासा.' } }],
          hints: [
            { en: 'Right now the script passes: it clicks around and checks nothing. That green is a lie on this build.', mr: 'आत्ता script pass होतो: तो इकडेतिकडे click करतो आणि काहीच तपासत नाही. या build वर ती हिरवी खूण खोटी आहे.' },
            { en: 'error.isDisplayed() gives true or false. Which assertion wants true?', mr: 'error.isDisplayed() true किंवा false देतो. कोणतं assertion true मागतं?' },
            { en: 'Assert.assertTrue(error.isDisplayed(), "Error message should be visible after a wrong password");', mr: 'Assert.assertTrue(error.isDisplayed(), "Error message should be visible after a wrong password");' },
          ],
          successLine: { en: 'Red, and red for the right reason: "Error message should be visible ... expected [true] but found [false]". That is a bug report with proof attached.', mr: 'लाल, आणि योग्य कारणासाठी लाल: "Error message should be visible ... expected [true] but found [false]". हा पुराव्यासह bug report आहे.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Now the good build. Same wrong login, but this time assert the exact error text: "Invalid username or password". After it passes, it is run again on the hidden-error build and must fail there.', mr: 'आता चांगला build. तोच चुकीचा login, पण या वेळी नेमका error text assert करा: "Invalid username or password". pass झाल्यावर तो लपलेल्या error च्या build वर पुन्हा चालवला जातो, आणि तिथे fail व्हायलाच हवा.' },
          startUrl: `${BASE}/login`,
          starter: `driver.get("${BASE}/login");
driver.findElement(By.id("username")).sendKeys("asha");
driver.findElement(By.id("password")).sendKeys("wrong123", Keys.ENTER);
String message = driver.findElement(By.id("login-error")).getText();
System.out.println("Error says: " + message);
// TODO: replace the println check with a real assertion (actual first, expected second)
`,
          solution: `driver.get("${BASE}/login");
driver.findElement(By.id("username")).sendKeys("asha");
driver.findElement(By.id("password")).sendKeys("wrong123", Keys.ENTER);
String message = driver.findElement(By.id("login-error")).getText();
Assert.assertEquals(message, "Invalid username or password");`,
          minAssertions: 1,
          mustCatch: [{ bug: 'login-error-hidden', label: { en: 'Wrong password: the error message never shows', mr: 'चुकीचा password: error message कधीच दिसत नाही' } }],
          hints: [
            { en: 'Printing the text is looking at it with your eyes. An assertion makes the computer compare it every single run.', mr: 'text print करणं म्हणजे डोळ्यांनी पाहणं. assertion मुळे computer प्रत्येक run मध्ये तुलना करतो.' },
            { en: 'assertEquals takes the actual value (message) first and the expected text second.', mr: 'assertEquals आधी actual value (message) घेतो आणि नंतर expected text.' },
            { en: 'Assert.assertEquals(message, "Invalid username or password");', mr: 'Assert.assertEquals(message, "Invalid username or password");' },
          ],
          successLine: { en: 'Green on the good build, red on the buggy one. A test you can trust has to be able to go both ways.', mr: 'चांगल्या build वर हिरवी, buggy build वर लाल. विश्वास ठेवण्याजोगी test दोन्ही बाजूंनी जाऊ शकायला हवी.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Asha is logged in on the dashboard. The starter\'s check only asks "is the heading there?", which can never catch a wrong name. Replace it with two clear facts: the .welcome heading says "Welcome, Asha Patil" and #upcoming-count says "2".', mr: 'Asha dashboard वर logged in आहे. starter मधला check फक्त "heading आहे का?" विचारतो, त्यामुळे चुकीचं नाव तो कधीच पकडू शकत नाही. त्याऐवजी दोन स्पष्ट तथ्यं तपासा: .welcome heading "Welcome, Asha Patil" दाखवतो आणि #upcoming-count "2" दाखवतो.' },
          startUrl: `${BASE}/dashboard`,
          loggedIn: true,
          starter: `driver.get("${BASE}/dashboard");
WebElement welcome = driver.findElement(By.className("welcome"));
// TODO: this check cannot catch a wrong name. Replace it with assertEquals on the text.
Assert.assertTrue(welcome.isDisplayed(), "Welcome heading is shown");
// TODO: assert the upcoming count (id "upcoming-count") is "2"
`,
          solution: `driver.get("${BASE}/dashboard");
WebElement welcome = driver.findElement(By.className("welcome"));
Assert.assertEquals(welcome.getText(), "Welcome, Asha Patil", "Welcome heading");
Assert.assertEquals(driver.findElement(By.id("upcoming-count")).getText(), "2", "Upcoming appointments");`,
          minAssertions: 2,
          mustCatch: [{ bug: 'welcome-name', label: { en: 'Dashboard says "Welcome, undefined"', mr: 'dashboard "Welcome, undefined" दाखवतो' } }],
          hints: [
            { en: 'On the buggy build the heading is still displayed, it just says "Welcome, undefined". isDisplayed() cannot tell the difference.', mr: 'buggy build वरसुद्धा heading दिसतो, फक्त तो "Welcome, undefined" म्हणतो. isDisplayed() ला हा फरक कळत नाही.' },
            { en: 'Compare welcome.getText() with the exact expected words. The count is text too: compare it with "2" in quotes.', mr: 'welcome.getText() ची नेमक्या अपेक्षित शब्दांशी तुलना करा. count सुद्धा text आहे: त्याची quotes मधल्या "2" शी तुलना करा.' },
            { en: 'Assert.assertEquals(welcome.getText(), "Welcome, Asha Patil", "Welcome heading");\nAssert.assertEquals(driver.findElement(By.id("upcoming-count")).getText(), "2", "Upcoming appointments");', mr: 'Assert.assertEquals(welcome.getText(), "Welcome, Asha Patil", "Welcome heading");\nAssert.assertEquals(driver.findElement(By.id("upcoming-count")).getText(), "2", "Upcoming appointments");' },
          ],
          successLine: { en: 'Two facts, two assertions, each with a message. The "undefined" bug cannot hide from you now.', mr: 'दोन तथ्यं, दोन assertions, प्रत्येकासोबत message. "undefined" bug आता तुमच्यापासून लपू शकत नाही.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'This lab runs a build with a hidden bug. Press Run and read the red line in the log. What did the page actually show?', mr: 'हा lab एका लपवलेल्या bug असलेला build चालवतो. Run दाबा आणि log मधली लाल ओळ वाचा. page ने खरंच काय दाखवलं?' },
          seleniumSandbox: {
            startUrl: `${BASE}/doctors`,
            build: ['search-case'],
            code: `driver.get("${BASE}/doctors");
driver.findElement(By.id("search")).sendKeys("car");
String count = driver.findElement(By.id("result-count")).getText();
Assert.assertEquals(count, "2 doctors found", "Search for car");`,
          },
          options: ['2 doctors found', '6 doctors found', 'Search for car', '0 doctors found'],
          correct: [3],
          explain: { en: 'The failure reads "Search for car expected [2 doctors found] but found [0 doctors found]". The first part is your message, the expected value is what you wrote, and the found value is what the page really showed: 0. Lowercase "car" found nobody, so search is case sensitive.', mr: 'failure असं वाचतं: "Search for car expected [2 doctors found] but found [0 doctors found]". पहिला भाग तुमचा message, expected value म्हणजे तुम्ही लिहिलेली, आणि found value म्हणजे page ने खरंच दाखवलेली: 0. lowercase "car" ने कोणीच सापडलं नाही, म्हणजे search case sensitive आहे.' },
          hints: [
            { en: 'Find the words "but found" in the red line.', mr: 'लाल ओळीत "but found" हे शब्द शोधा.' },
            { en: 'expected is what the test wanted. found is what the page gave.', mr: 'expected म्हणजे test ला हवं होतं ते. found म्हणजे page ने दिलं ते.' },
          ],
          successLine: { en: 'Read the "found" part first: it is what the app really did.', mr: 'आधी "found" भाग वाचा: app ने खरंच काय केलं ते तोच सांगतो.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'In TestNG, which line is written in the right order?', mr: 'TestNG मध्ये कोणती ओळ योग्य क्रमाने लिहिली आहे?' },
        options: [
          'Assert.assertEquals("Dashboard | CareBridge", driver.getTitle());',
          'Assert.assertEquals(driver.getTitle());',
          'Assert.assertEquals(driver.getTitle(), "Dashboard | CareBridge");',
          'Assert.assertTrue(driver.getTitle(), "Dashboard | CareBridge");',
        ],
        answer: 2,
        explain: { en: 'TestNG wants actual first (what the page gives) and expected second. assertTrue takes a single true/false condition.', mr: 'TestNG ला आधी actual (page जे देतं) आणि नंतर expected हवं. assertTrue ला एकच true/false condition लागते.' },
      },
      {
        q: { en: 'A test fails with this line. What did the page really show?', mr: 'एक test या ओळीसह fail होते. page ने खरंच काय दाखवलं?' },
        code: `java.lang.AssertionError: Welcome heading expected [Welcome, Asha Patil] but found [Welcome, undefined]`,
        options: ['Welcome, undefined', 'Welcome, Asha Patil', 'Welcome heading', { en: 'Nothing, the page crashed', mr: 'काहीच नाही, page crash झालं' }],
        answer: 0,
        explain: { en: 'The value after "but found" is what the page showed. "Welcome heading" is just the message the tester wrote.', mr: '"but found" नंतरची value म्हणजे page ने दाखवलेली. "Welcome heading" हा फक्त टेस्टरने लिहिलेला message आहे.' },
      },
      {
        q: { en: 'Which test can never fail, and so proves nothing about the login error?', mr: 'कोणती test कधीच fail होऊ शकत नाही, आणि म्हणून login error बद्दल काहीच सिद्ध करत नाही?' },
        options: [
          'Assert.assertEquals(error.getText(), "Invalid username or password");',
          'Assert.assertTrue(error.isDisplayed(), "Error should show");',
          'Assert.assertFalse(error.getText().isEmpty(), "Error text should not be empty");',
          'System.out.println(error.getText());',
        ],
        answer: 3,
        explain: { en: 'Printing only shows the text. Whatever the page says, nothing compares it, so the test stays green even when the error is missing.', mr: 'print फक्त text दाखवतो. page काहीही दाखवो, त्याची तुलना कोणीच करत नाही, त्यामुळे error नसला तरी test हिरवीच राहते.' },
      },
      {
        q: { en: 'Why add a message like "Error message should be visible" to an assertion?', mr: 'assertion मध्ये "Error message should be visible" सारखा message का जोडायचा?' },
        options: [
          { en: 'It makes the test run faster', mr: 'त्यामुळे test जास्त वेगाने चालते' },
          { en: 'It tells whoever reads the failure which fact broke, without opening the code', mr: 'failure वाचणाऱ्याला code न उघडता कळतं की कोणतं तथ्य मोडलं' },
          { en: 'Without it the assertion is skipped', mr: 'त्याशिवाय assertion वगळलं जातं' },
          { en: 'It turns a failure into a pass', mr: 'त्यामुळे failure चं pass होतं' },
        ],
        answer: 1,
        explain: { en: 'The message is printed in front of "expected ... but found ...". At midnight, a clear message saves the team from digging through code.', mr: 'message "expected ... but found ..." च्या आधी छापला जातो. मध्यरात्री, स्पष्ट message मुळे टीमला code मध्ये खोदकाम करावं लागत नाही.' },
      },
    ],
    recap: { line: { en: 'Read every line of the bill: assertEquals(actual, expected), assertTrue/assertFalse with a message, one fact each. Always ask: would this catch a bug?', mr: 'बिलाची प्रत्येक ओळ वाचा: assertEquals(actual, expected), message सह assertTrue/assertFalse, प्रत्येकात एक तथ्य. नेहमी विचारा: ही test bug पकडेल का?' }, icon: '🧾' },
  },
]
