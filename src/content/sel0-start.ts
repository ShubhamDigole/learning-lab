import type { Lesson } from './types.ts'

// Selenium "Start here": no programming assumed. What automation is, and just enough Java to read and write a test.

const LOGIN_SCRIPT = `driver.get("https://carebridge.test/login");
driver.findElement(By.id("username")).sendKeys("asha");
driver.findElement(By.id("password")).sendKeys("care123");
driver.findElement(By.id("login-btn")).click();
Assert.assertEquals(driver.getTitle(), "Dashboard | CareBridge");`

const TITLE_SCRIPT = `// A ready test. Press Run, watch the browser on the right, then press Submit.
driver.get("https://carebridge.test/login");
String title = driver.getTitle();
System.out.println("The page title is: " + title);
Assert.assertEquals(title, "Login | CareBridge");`

export const selStartLessons: Lesson[] = [
  // ───────────────────────── S0.1 What is test automation?
  {
    id: 'se0-1',
    code: 'S0.1',
    level: 'basic',
    title: { en: 'Start Here: What Is Test Automation, and What Is Selenium?', mr: 'सुरुवात: Test Automation म्हणजे काय, आणि Selenium म्हणजे काय?' },
    skill: 'What automation is for',
    syntaxPlain: true,
    realLife: {
      place: 'home',
      title: { en: 'The washing machine that never gets tired', mr: 'कधीच न थकणारं वॉशिंग मशीन' },
      story: {
        en: 'Sunita aaji washed clothes by hand every Sunday: soak, scrub, rinse, rinse again, squeeze. Two hours, and her back hurt. Now the washing machine does the same program every time: same water, same spin, same minutes, even at midnight. Aaji has not retired, though. She still picks the program, and when the drum stops she checks the collar of her grandson\'s school shirt. The machine does the boring repeats. Aaji does the looking and judging.',
        mr: 'सुनीता आजी दर रविवारी हाताने कपडे धुवायच्या: भिजवणं, घासणं, खंगाळणं, पुन्हा खंगाळणं, पिळणं. दोन तास, आणि कंबर दुखायची. आता वॉशिंग मशीन प्रत्येक वेळी तोच program चालवतं: तेवढंच पाणी, तसाच spin, तेवढीच मिनिटं, अगदी मध्यरात्रीसुद्धा. पण आजी निवृत्त झालेल्या नाहीत. program त्याच निवडतात, आणि ड्रम थांबल्यावर नातवाच्या शाळेच्या शर्टची कॉलर त्याच तपासतात. कंटाळवाणी पुनरावृत्ती मशीन करतं. बघणं आणि ठरवणं आजी करतात.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🧺', label: 'Load the clothes (open the app)', mr: 'कपडे टाका (app उघडा)' },
          { icon: '🎛️', label: 'Pick the program (the script)', mr: 'program निवडा (script)' },
          { icon: '🔁', label: 'Same steps, every time', mr: 'प्रत्येक वेळी त्याच steps' },
          { icon: '✅', label: 'Report: clean or not (pass/fail)', mr: 'निकाल: स्वच्छ की नाही (pass/fail)' },
          { icon: '👵', label: 'Aaji still checks the collar (manual)', mr: 'कॉलर आजीच तपासतात (manual)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'CareBridge ships every Friday. Every Thursday night someone clicks through login and booking by hand until 2 am. We call it the midnight release.', mr: 'CareBridge दर शुक्रवारी release होतं. दर गुरुवारी रात्री कोणीतरी login आणि booking हाताने click करत रात्री 2 पर्यंत बसतं. आम्ही त्याला midnight release म्हणतो.' } },
        { who: 'rex', mood: 'smug', text: { en: 'Clicking the same 40 screens every week is a washing machine job, {name}. Let a robot do the scrubbing. You keep the judging.', mr: 'दर आठवड्याला त्याच 40 स्क्रीन click करणं हे वॉशिंग मशीनचं काम आहे, {name}. घासण्याचं काम robot ला दे. ठरवण्याचं काम तू ठेव.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'tired testers skip steps at 1 am. that is when i sneak in. hehe.', mr: 'रात्री 1 वाजता थकलेले testers steps सोडतात. तेव्हाच मी आत घुसतो. हेहे.' } },
        { who: 'meera', mood: 'happy', text: { en: 'A script never gets sleepy. It runs the same checks in minutes, and we spend our evening on the new features.', mr: 'script ला कधी झोप येत नाही. ती त्याच checks काही मिनिटांत करते, आणि आपली संध्याकाळ नव्या features वर जाते.' } },
      ],
      problem: { en: 'The weekly regression of login and booking takes a whole night by hand. Tired people miss steps, and bugs slip into Friday\'s release.', mr: 'login आणि booking चं साप्ताहिक regression हाताने करायला अख्खी रात्र लागते. थकलेली माणसं steps चुकवतात, आणि bugs शुक्रवारच्या release मध्ये घुसतात.' },
      solution: { en: 'Write the repeated checks once as a Selenium script in Java. TestNG runs them in minutes and reports pass or fail. People keep the exploring and the judging.', mr: 'पुन्हा पुन्हा होणाऱ्या checks एकदाच Java मध्ये Selenium script म्हणून लिहा. TestNG त्या काही मिनिटांत चालवतो आणि pass किंवा fail सांगतो. शोधाशोध आणि ठरवणं माणसांकडे राहतं.' },
    },
    lesson: [
      { en: 'Test automation means writing your manual test steps as a script, so a computer can repeat them exactly. Open the page, type, click, and check the result. Same steps, every run, at any hour.', mr: 'Test automation म्हणजे तुमच्या manual test च्या steps एका script मध्ये लिहिणं, म्हणजे संगणक त्या तंतोतंत पुन्हा करू शकतो. page उघडा, टाइप करा, click करा, आणि निकाल तपासा. प्रत्येक run ला त्याच steps, कोणत्याही वेळी.' },
      { en: 'Selenium WebDriver is a remote control for a real browser. Your script presses its buttons: "go to this address", "type asha in this box", "click Log in". The browser obeys, just like when you click it yourself.', mr: 'Selenium WebDriver म्हणजे खऱ्या browser चा remote control. तुमची script त्याची बटणं दाबते: "या पत्त्यावर जा", "या box मध्ये asha टाइप कर", "Log in वर click कर". browser ऐकतो, अगदी तुम्ही स्वतः click केल्यासारखा.' },
      { en: 'We write the instructions in Java, a very common language in testing jobs. TestNG is the referee: it runs every test, checks the assertions, and prints a clear report of what passed and what failed.', mr: 'आपण सूचना Java मध्ये लिहितो, testing च्या नोकऱ्यांमध्ये खूप वापरली जाणारी भाषा. TestNG म्हणजे पंच: तो प्रत्येक test चालवतो, assertions तपासतो, आणि काय pass झालं आणि काय fail झालं याचा स्पष्ट report देतो.' },
      { en: 'Automate what repeats and has a clear right answer: regression checks before every release, smoke tests after every deploy. Keep manual what needs a human eye: exploratory testing, and whether a screen looks and feels right.', mr: 'जे पुन्हा पुन्हा होतं आणि ज्याचं उत्तर स्पष्ट आहे ते automate करा: प्रत्येक release आधीचे regression checks, प्रत्येक deploy नंतरच्या smoke tests. ज्याला माणसाची नजर लागते ते manual ठेवा: exploratory testing, आणि स्क्रीन दिसायला आणि वापरायला बरोबर वाटते का.' },
    ],
    syntax: {
      template: 'You (tester)  →  write the steps in Java\nTestNG        →  runs each test, keeps score\nSelenium      →  the remote control\nBrowser       →  opens CareBridge, types, clicks\nAssertion     →  "is this what we expected?"  →  PASS or FAIL',
      parts: [
        { code: 'Java', means: { en: 'the language we write the instructions in', mr: 'ज्या भाषेत आपण सूचना लिहितो' } },
        { code: 'Selenium WebDriver', means: { en: 'the remote control that drives a real browser', mr: 'खरा browser चालवणारा remote control' } },
        { code: 'TestNG', means: { en: 'the referee: runs the tests and reports pass or fail', mr: 'पंच: tests चालवतो आणि pass किंवा fail सांगतो' } },
        { code: 'assertion', means: { en: 'the check at the end: what we expected versus what we found', mr: 'शेवटचा check: काय अपेक्षित होतं आणि काय सापडलं' } },
      ],
      example: [
        { code: 'Open https://carebridge.test/login', note: { en: 'load the clothes: the robot opens the page', mr: 'कपडे टाका: robot page उघडतो' } },
        { code: 'Type "asha" in Username', note: { en: 'the same program every time', mr: 'प्रत्येक वेळी तोच program' } },
        { code: 'Type "care123" in Password', note: { en: 'never a typo, even at midnight', mr: 'मध्यरात्रीसुद्धा एकही चूक नाही' } },
        { code: 'Click "Log in"', note: { en: 'the drum spins', mr: 'ड्रम फिरतो' } },
        { code: 'Check: title is "Dashboard | CareBridge"', note: { en: 'clean or not? TestNG says PASS or FAIL', mr: 'स्वच्छ की नाही? TestNG सांगतो PASS किंवा FAIL' } },
      ],
      pitfall: { en: 'Automation does not replace testers. A script only checks what you told it to check. Someone still has to decide what matters and explore what nobody thought of.', mr: 'Automation testers ची जागा घेत नाही. script फक्त तुम्ही सांगितलेलं तपासते. काय महत्त्वाचं ते ठरवायला आणि कोणालाच न सुचलेलं शोधायला माणूस लागतोच.' },
    },
    practice: {
      intro: { en: 'No Java writing yet. Watch the robot, press a few buttons, and decide what is worth automating.', mr: 'अजून Java लिहायचं नाही. robot ला पाहा, काही बटणं दाबा, आणि काय automate करण्यासारखं आहे ते ठरवा.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'This is a complete login test. Press Run and watch the robot in the browser on the right. What did it type into the username box?', mr: 'ही एक पूर्ण login test आहे. Run दाबा आणि उजवीकडच्या browser मध्ये robot ला पाहा. त्याने username box मध्ये काय टाइप केलं?' },
          seleniumSandbox: { code: LOGIN_SCRIPT, startUrl: 'https://carebridge.test/login' },
          options: ['asha', 'care123', 'Asha Patil', 'admin'],
          correct: [0],
          explain: { en: 'Line 2 says sendKeys("asha") into the box with id "username". The password box got care123. The robot types exactly what the script says, every single time.', mr: 'ओळ 2 मध्ये id "username" असलेल्या box मध्ये sendKeys("asha") आहे. password box मध्ये care123 गेलं. script मध्ये जे लिहिलं तेच robot टाइप करतो, प्रत्येक वेळी.' },
          hints: [
            { en: 'Watch the first box the cursor goes to, or read the log under the buttons.', mr: 'cursor पहिल्यांदा कोणत्या box कडे जातो ते पाहा, किंवा बटणांखालचा log वाचा.' },
            { en: 'Look for the line with By.id("username") and read what is inside sendKeys(...).', mr: 'By.id("username") असलेली ओळ शोधा आणि sendKeys(...) च्या आत काय आहे ते वाचा.' },
          ],
          successLine: { en: 'You just watched your first Selenium test drive a browser.', mr: 'तुम्ही नुकतीच तुमची पहिली Selenium test browser चालवताना पाहिली.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'This test is ready and correct. Press Run and watch it open the login page and check its title. Then press Submit to hand in the result.', mr: 'ही test तयार आणि बरोबर आहे. Run दाबा आणि ती login page उघडून त्याचा title तपासताना पाहा. मग निकाल देण्यासाठी Submit दाबा.' },
          starter: TITLE_SCRIPT,
          solution: TITLE_SCRIPT,
          starterPasses: true,
          startUrl: 'https://carebridge.test/',
          minAssertions: 1,
          hints: [
            { en: 'You do not need to change anything. Press Run first.', mr: 'काहीही बदलायची गरज नाही. आधी Run दाबा.' },
            { en: 'Read the log: the green tick line is the assertion that passed. Then press Submit.', mr: 'log वाचा: हिरव्या tick ची ओळ म्हणजे pass झालेलं assertion. मग Submit दाबा.' },
          ],
          successLine: { en: 'Green tick. The title matched, so TestNG called it a pass.', mr: 'हिरवी tick. title जुळला, म्हणून TestNG ने pass म्हटलं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Which of these is the best first thing to automate at CareBridge?', mr: 'CareBridge मध्ये सगळ्यात आधी automate करण्यासारखं काय आहे?' },
          options: [
            { en: 'Logging in with asha / care123, checked before every Friday release', mr: 'asha / care123 ने login, दर शुक्रवारच्या release आधी तपासलेलं' },
            { en: 'Whether the new teal colour feels calm to patients', mr: 'नवा teal रंग रुग्णांना शांत वाटतो का' },
            { en: 'A one-time check of a page that will be deleted next week', mr: 'पुढच्या आठवड्यात काढून टाकल्या जाणाऱ्या page चा एकदाच check' },
            { en: 'Trying odd things on a brand new feature to see what breaks', mr: 'अगदी नव्या feature वर विचित्र गोष्टी करून काय बिघडतं ते पाहणं' },
          ],
          correct: [0],
          explain: { en: 'Login repeats every week and has a clear right answer (you land on the dashboard). That is a perfect regression check for a script.', mr: 'login दर आठवड्याला होतं आणि त्याचं उत्तर स्पष्ट आहे (dashboard उघडतो). script साठी हा उत्तम regression check आहे.' },
          hints: [
            { en: 'Look for something that repeats often and has a clear yes or no answer.', mr: 'जे वारंवार होतं आणि ज्याचं उत्तर स्पष्ट हो किंवा नाही आहे ते शोधा.' },
            { en: 'The washing machine is great at the same program every week.', mr: 'दर आठवड्याला तोच program चालवण्यात वॉशिंग मशीन उत्तम आहे.' },
          ],
        },
        {
          kind: 'choice',
          prompt: { en: 'Which TWO should stay manual, done by a human tester?', mr: 'कोणत्या दोन गोष्टी manual राहाव्यात, माणसाने करायच्या?' },
          options: [
            { en: 'Exploring the new video-call feature freely to find surprises', mr: 'नव्या video-call feature मध्ये मोकळेपणाने फिरून अनपेक्षित गोष्टी शोधणं' },
            { en: 'Checking that the doctors page still shows 6 doctors after every deploy', mr: 'प्रत्येक deploy नंतर doctors page वर अजून 6 doctors दिसतात का तपासणं' },
            { en: 'Judging whether the booking screen looks clear for an elderly patient', mr: 'booking स्क्रीन वयस्कर रुग्णाला स्पष्ट दिसते का हे ठरवणं' },
            { en: 'Logging in and checking the dashboard title before every release', mr: 'प्रत्येक release आधी login करून dashboard चा title तपासणं' },
          ],
          correct: [0, 2],
          explain: { en: 'Exploring and judging look and feel need human curiosity and taste. The doctor count and the login check repeat with a clear answer, so a script should do them.', mr: 'शोधाशोध आणि look and feel ठरवण्यासाठी माणसाची जिज्ञासा आणि नजर लागते. doctors ची संख्या आणि login check पुन्हा पुन्हा होतात आणि उत्तर स्पष्ट आहे, म्हणून ते script ने करावं.' },
          hints: [
            { en: 'Which two have no single exact right answer?', mr: 'कोणत्या दोन गोष्टींना एकच नेमकं उत्तर नाही?' },
            { en: 'Aaji still checks the collar herself. Which jobs are like that?', mr: 'कॉलर आजी स्वतःच तपासतात. कोणती कामं तशी आहेत?' },
          ],
          successLine: { en: 'Robots repeat, humans judge. That split is the whole idea.', mr: 'robot पुनरावृत्ती करतात, माणसं ठरवतात. हीच संपूर्ण कल्पना.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'In one line, what is Selenium WebDriver?', mr: 'एका ओळीत, Selenium WebDriver म्हणजे काय?' },
        options: [
          { en: 'A remote control that drives a real browser', mr: 'खरा browser चालवणारा remote control' },
          { en: 'A database for test results', mr: 'test निकालांचा database' },
          { en: 'A programming language', mr: 'एक programming language' },
          { en: 'A tool that designs web pages', mr: 'web pages design करणारं tool' },
        ],
        answer: 0,
        explain: { en: 'Selenium opens, types and clicks in a browser for you. Java is the language; TestNG is the referee.', mr: 'Selenium तुमच्यासाठी browser मध्ये उघडतो, टाइप करतो आणि click करतो. Java ही भाषा आहे; TestNG पंच आहे.' },
      },
      {
        q: { en: 'What is TestNG\'s job in our setup?', mr: 'आपल्या setup मध्ये TestNG चं काम काय?' },
        options: [
          { en: 'It types into text boxes', mr: 'तो text boxes मध्ये टाइप करतो' },
          { en: 'It runs the tests and reports which passed and which failed', mr: 'तो tests चालवतो आणि कोणत्या pass आणि कोणत्या fail झाल्या ते सांगतो' },
          { en: 'It stores CareBridge\'s appointments', mr: 'तो CareBridge च्या appointments साठवतो' },
          { en: 'It makes the browser faster', mr: 'तो browser वेगवान करतो' },
        ],
        answer: 1,
        explain: { en: 'TestNG is the referee: it runs each test, counts the assertions and gives the pass/fail report.', mr: 'TestNG पंच आहे: तो प्रत्येक test चालवतो, assertions मोजतो आणि pass/fail report देतो.' },
      },
      {
        q: { en: 'Which task is the WORST fit for automation?', mr: 'automation साठी सगळ्यात कमी योग्य काम कोणतं?' },
        options: [
          { en: 'A smoke test after every deploy', mr: 'प्रत्येक deploy नंतरची smoke test' },
          { en: 'The weekly login regression', mr: 'साप्ताहिक login regression' },
          { en: 'Checking the booking form on every release', mr: 'प्रत्येक release ला booking form तपासणं' },
          { en: 'Deciding if a new screen feels friendly to patients', mr: 'नवी स्क्रीन रुग्णांना आपलीशी वाटते का हे ठरवणं' },
        ],
        answer: 3,
        explain: { en: '"Feels friendly" has no exact expected value a script could assert. That needs a human eye.', mr: '"आपलीशी वाटते" याचं script ला assert करता येईल असं नेमकं अपेक्षित उत्तर नाही. त्यासाठी माणसाची नजर लागते.' },
      },
      {
        q: { en: 'The midnight release problem was mainly that...', mr: 'midnight release ची मुख्य अडचण होती की...' },
        options: [
          { en: 'CareBridge had no login page', mr: 'CareBridge ला login page नव्हतं' },
          { en: 'The servers were too slow', mr: 'servers खूप हळू होते' },
          { en: 'The same checks were clicked by hand every week, slowly and with tired mistakes', mr: 'त्याच checks दर आठवड्याला हाताने click व्हायच्या, हळू आणि थकव्यामुळे चुका होत' },
          { en: 'Java was not installed', mr: 'Java install नव्हतं' },
        ],
        answer: 2,
        explain: { en: 'Repetitive manual regression is slow and error-prone. A script repeats it in minutes without getting tired.', mr: 'पुन्हा पुन्हा होणारं manual regression हळू असतं आणि त्यात चुका होतात. script ते न थकता काही मिनिटांत करते.' },
      },
    ],
    recap: { line: { en: 'Automation repeats the boring checks; Selenium drives the browser, Java holds the steps, TestNG keeps score, and humans still explore and judge.', mr: 'Automation कंटाळवाण्या checks पुन्हा करतं; Selenium browser चालवतो, Java मध्ये steps असतात, TestNG गुण मोजतो, आणि शोधाशोध व निर्णय माणसंच करतात.' }, icon: '🤖' },
  },

  // ───────────────────────── S0.2 Just enough Java
  {
    id: 'se0-2',
    code: 'S0.2',
    level: 'basic',
    title: { en: 'Start Here: Just Enough Java', mr: 'सुरुवात: पुरेसं Java' },
    skill: 'Java basics for testers',
    realLife: {
      place: 'kitchen',
      title: { en: 'Labelled steel jars', mr: 'लेबल लावलेले स्टीलचे डबे' },
      story: {
        en: 'In Aai\'s kitchen every steel jar has a label written with a marker: SUGAR, RICE, TOOR DAL. Each jar holds one kind of thing. Nobody pours rice into the oil bottle, and if a guest asks for sugar, Aai reads the label and grabs the right jar without opening five. One small rule: the label "Sugar" and the label "sugar" look the same to us, but Aai\'s new helper is very strict and treats them as two different jars.',
        mr: 'आईच्या स्वयंपाकघरात प्रत्येक स्टीलच्या डब्यावर marker ने लेबल लिहिलेलं असतं: साखर, तांदूळ, तूरडाळ. प्रत्येक डब्यात एकाच प्रकारची वस्तू. तेलाच्या बाटलीत कोणी तांदूळ ओतत नाही, आणि पाहुण्याने साखर मागितली तर आई लेबल वाचून पाच डबे न उघडता योग्य डबा उचलते. एक छोटा नियम: "Sugar" आणि "sugar" ही लेबलं आपल्याला सारखीच दिसतात, पण आईचा नवा मदतनीस फार काटेकोर आहे, तो त्यांना दोन वेगळे डबे समजतो.',
      },
      scene: {
        type: 'group',
        groups: [
          { icon: '🔤', label: 'String jar: text', mr: 'String डबा: मजकूर' },
          { icon: '🔢', label: 'int jar: whole numbers', mr: 'int डबा: पूर्ण संख्या' },
          { icon: '💧', label: 'double jar: decimals', mr: 'double डबा: दशांश संख्या' },
          { icon: '🔘', label: 'boolean jar: true / false', mr: 'boolean डबा: true / false' },
        ],
        items: [
          { icon: '👩', group: 0 },
          { icon: '🏥', group: 0 },
          { icon: '5️⃣', group: 1 },
          { icon: '💯', group: 1 },
          { icon: '🌡️', group: 2 },
          { icon: '⭐', group: 2 },
          { icon: '✅', group: 3 },
          { icon: '❌', group: 3 },
        ],
        note: { en: 'Each jar takes only its own kind. Rice never goes in the oil bottle.', mr: 'प्रत्येक डब्यात फक्त त्याच्याच प्रकारची वस्तू. तेलाच्या बाटलीत तांदूळ कधीच नाही.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'you', mood: 'worried', text: { en: 'Rex, I have never written code. Do I need to learn all of Java first?', mr: 'Rex, मी कधीच code लिहिलेला नाही. आधी संपूर्ण Java शिकावं लागेल का?' } },
        { who: 'rex', mood: 'happy', text: { en: 'Not at all. Tests use a tiny slice: jars with labels, printing, a dot to call a method, and new to make things. Twenty minutes, {name}.', mr: 'अजिबात नाही. tests मध्ये छोटासा भाग लागतो: लेबल असलेले डबे, print करणं, method बोलावायला एक dot, आणि वस्तू बनवायला new. वीस मिनिटं, {name}.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'One warning from a developer: Java is fussy. A missing ; or a small s where a capital S belongs, and nothing runs.', mr: 'एका developer कडून इशारा: Java फार काटेकोर आहे. एक ; राहिला किंवा मोठ्या S ऐवजी लहान s लिहिला, की काहीच चालत नाही.' } },
        { who: 'meera', mood: 'happy', text: { en: 'And the error message tells you the line. Read it like a bug report.', mr: 'आणि error message ओळ क्रमांक सांगतो. तो bug report सारखा वाचा.' } },
      ],
      problem: { en: 'Every Selenium test is written in Java. Without the basics, even a ready test looks like noise, and one missing semicolon stops everything.', mr: 'प्रत्येक Selenium test Java मध्ये लिहिलेली असते. basics शिवाय तयार test सुद्धा गोंधळ वाटते, आणि एक ; राहिला तरी सगळं थांबतं.' },
      solution: { en: 'Learn the small slice tests need: statements, variables and types, printing, joining text, calling methods with a dot, and creating objects with new.', mr: 'tests ला लागणारा छोटा भाग शिका: statements, variables आणि types, print करणं, मजकूर जोडणं, dot ने methods बोलावणं, आणि new ने objects तयार करणं.' },
    },
    lesson: [
      { en: 'A Java program is a list of statements, read top to bottom. Each statement ends with a semicolon ;, like a full stop at the end of a sentence. Java also cares about capital letters: System and system are two different words, and only System works.', mr: 'Java program म्हणजे वरून खाली वाचल्या जाणाऱ्या statements ची यादी. प्रत्येक statement ; ने संपतं, वाक्याच्या शेवटच्या पूर्णविरामासारखं. Java ला capital letters चा फरक कळतो: System आणि system हे दोन वेगळे शब्द आहेत, आणि फक्त System चालतो.' },
      { en: 'A variable is a labelled jar. You say its type, its name, and what goes in: String name = "Asha"; Types you will use: String (text in double quotes), int (whole numbers), double (decimals like 4.8), boolean (true or false). Java refuses to put the wrong kind in a jar.', mr: 'variable म्हणजे लेबल लावलेला डबा. तुम्ही त्याचा type, नाव, आणि आत काय ते सांगता: String name = "Asha"; वापरात येणारे types: String (double quotes मधला मजकूर), int (पूर्ण संख्या), double (4.8 सारख्या दशांश संख्या), boolean (true किंवा false). चुकीची वस्तू डब्यात टाकायला Java नकार देतो.' },
      { en: 'System.out.println(...) prints a line in the log. The + sign joins text: "Hello, " + name gives Hello, Asha. Careful: "Total: " + 2 + 3 joins as text and gives Total: 23. Put the maths in brackets: "Total: " + (2 + 3).', mr: 'System.out.println(...) log मध्ये एक ओळ print करतं. + चिन्ह मजकूर जोडतं: "Hello, " + name म्हणजे Hello, Asha. सावध: "Total: " + 2 + 3 मजकूर म्हणून जोडलं जातं आणि Total: 23 येतं. गणित कंसात लिहा: "Total: " + (2 + 3).' },
      { en: 'A dot calls a method, which means "ask this thing to do something": "asha".toUpperCase() gives ASHA, name.length() counts letters. The word new creates a fresh object: new ChromeDriver() opens a browser. In Selenium you will write driver.findElement(...).click() all day: dots, all the way down.', mr: 'dot ने method बोलावली जाते, म्हणजे "या वस्तूला काहीतरी करायला सांग": "asha".toUpperCase() म्हणजे ASHA, name.length() अक्षरं मोजतं. new हा शब्द नवं object तयार करतो: new ChromeDriver() browser उघडतो. Selenium मध्ये तुम्ही दिवसभर driver.findElement(...).click() लिहाल: सगळीकडे dots.' },
    ],
    syntax: {
      template: 'Type name = value;\nSystem.out.println("text " + name);\nname.methodName();\nType thing = new Type();',
      parts: [
        { code: 'String / int / double / boolean', means: { en: 'the kind of jar: text, whole number, decimal, true/false', mr: 'डब्याचा प्रकार: मजकूर, पूर्ण संख्या, दशांश, true/false' } },
        { code: 'name = value', means: { en: 'write the label and fill the jar', mr: 'लेबल लिहा आणि डबा भरा' } },
        { code: ';', means: { en: 'the full stop at the end of every statement', mr: 'प्रत्येक statement च्या शेवटचा पूर्णविराम' } },
        { code: 'System.out.println(...)', means: { en: 'print one line in the log', mr: 'log मध्ये एक ओळ print करा' } },
        { code: '+', means: { en: 'join text (or add numbers inside brackets)', mr: 'मजकूर जोडा (किंवा कंसात संख्यांची बेरीज)' } },
        { code: '.toUpperCase()', means: { en: 'a dot calls a method on a thing', mr: 'dot एखाद्या वस्तूवर method बोलावतो' } },
        { code: 'new', means: { en: 'make a brand new object, like new ChromeDriver()', mr: 'अगदी नवं object बनवा, जसं new ChromeDriver()' } },
      ],
      example: [
        { code: 'String jar = "Sugar";', note: { en: 'a text jar labelled jar, holding Sugar', mr: 'jar नावाचा मजकुराचा डबा, आत Sugar' } },
        { code: 'int spoons = 2;', note: { en: 'a whole-number jar', mr: 'पूर्ण संख्येचा डबा' } },
        { code: 'double kg = 1.5;', note: { en: 'decimals go in a double jar', mr: 'दशांश संख्या double डब्यात' } },
        { code: 'boolean isFull = kg > 1;', note: { en: 'true or false: is the jar full?', mr: 'true किंवा false: डबा भरलाय का?' } },
        { code: 'System.out.println(jar.toUpperCase() + " x " + spoons);', note: { en: 'prints SUGAR x 2', mr: 'SUGAR x 2 print होतं' } },
        { code: 'WebDriver driver = new ChromeDriver();', note: { en: 'new makes a fresh browser to drive', mr: 'new चालवण्यासाठी नवा browser बनवतो' } },
      ],
      pitfall: { en: 'Java is case-sensitive. system.out.println, String Name then using name, or Println will not compile. When you see "cannot find symbol", check the spelling and the capital letters first.', mr: 'Java case-sensitive आहे. system.out.println, String Name लिहून नंतर name वापरणं, किंवा Println compile होणार नाही. "cannot find symbol" दिसलं की आधी स्पेलिंग आणि capital letters तपासा.' },
    },
    practice: {
      intro: { en: 'Plain Java first, no browser. Write in the editor, press Run, read the printed lines in the log, then Submit. The grader checks the exact lines you print.', mr: 'आधी साधं Java, browser नाही. editor मध्ये लिहा, Run दाबा, log मधल्या print झालेल्या ओळी वाचा, मग Submit करा. तुम्ही print केलेल्या नेमक्या ओळी तपासल्या जातात.' },
      steps: [
        {
          kind: 'selenium',
          prompt: { en: 'The jar patient holds "Asha". Print exactly Hello, Asha by joining "Hello, " with the variable (do not type Asha again).', mr: 'patient या डब्यात "Asha" आहे. "Hello, " आणि variable जोडून नेमकं Hello, Asha print करा (Asha पुन्हा टाइप करू नका).' },
          noBrowser: true,
          starter: 'String patient = "Asha";\n// TODO: print Hello, Asha using the variable patient\n',
          solution: 'String patient = "Asha";\nSystem.out.println("Hello, " + patient);',
          output: ['Hello, Asha'],
          mustUse: [{ pattern: '\\+\\s*patient', message: { en: 'Join the text with the variable: "Hello, " + patient. Then the greeting changes when the jar changes.', mr: 'मजकूर variable शी जोडा: "Hello, " + patient. मग डबा बदलला की greeting पण बदलतं.' } }],
          hints: [
            { en: 'Printing is System.out.println(...); with a capital S.', mr: 'print करायला System.out.println(...); मोठ्या S ने.' },
            { en: 'Inside the brackets, join two things with +: the text "Hello, " and the variable.', mr: 'कंसात + ने दोन गोष्टी जोडा: मजकूर "Hello, " आणि variable.' },
            { en: 'Mind the space after the comma inside the quotes.', mr: 'quotes मध्ये comma नंतरची space विसरू नका.' },
            { en: 'System.out.println("Hello, " + patient);', mr: 'System.out.println("Hello, " + patient);' },
          ],
          successLine: { en: 'Hello, Asha. Your first line of Java ran.', mr: 'Hello, Asha. तुमची Java ची पहिली ओळ चालली.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Asha has 2 visits. Each visit costs a 500 consultation plus a 350 lab test. Print exactly Total: 1700, calculated from the variables.', mr: 'Asha च्या 2 visits आहेत. प्रत्येक visit ला 500 consultation आणि 350 lab test. variables वरून हिशेब करून नेमकं Total: 1700 print करा.' },
          noBrowser: true,
          starter: 'int consultFee = 500;\nint labFee = 350;\nint visits = 2;\n// TODO: print Total: 1700 using the three variables\n',
          solution: 'int consultFee = 500;\nint labFee = 350;\nint visits = 2;\nint total = (consultFee + labFee) * visits;\nSystem.out.println("Total: " + total);',
          output: ['Total: 1700'],
          mustUse: ['consultFee', 'labFee', 'visits'].map((v) => ({
            pattern: `[-+*/(]\\s*${v}\\b|\\b${v}\\s*[-+*/)]`,
            message: { en: `Use ${v} in the calculation, so the total stays right if a fee changes.`, mr: `हिशेबात ${v} वापरा, म्हणजे fee बदलली तरी total बरोबर राहील.` },
          })),
          mustNotUse: [{ pattern: '1700', message: { en: 'Do not type 1700 yourself. Let Java calculate it from the variables.', mr: '1700 स्वतः टाइप करू नका. variables वरून Java ला हिशेब करू द्या.' } }],
          hints: [
            { en: 'First add the two fees, then multiply by visits. * means multiply.', mr: 'आधी दोन fees ची बेरीज, मग visits ने गुणाकार. * म्हणजे गुणाकार.' },
            { en: 'Brackets decide the order: (consultFee + labFee) * visits.', mr: 'क्रम कंस ठरवतात: (consultFee + labFee) * visits.' },
            { en: 'Store it in an int jar first: int total = (consultFee + labFee) * visits; then join "Total: " + total.', mr: 'आधी int डब्यात ठेवा: int total = (consultFee + labFee) * visits; मग "Total: " + total जोडा.' },
            { en: 'int total = (consultFee + labFee) * visits;\nSystem.out.println("Total: " + total);', mr: 'int total = (consultFee + labFee) * visits;\nSystem.out.println("Total: " + total);' },
          ],
          successLine: { en: 'Total: 1700. A test that calculates is a test that stays right when data changes.', mr: 'Total: 1700. हिशेब करणारी test डेटा बदलला तरी बरोबर राहते.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Theo\'s snippet does not compile. Press Run and read the error. Fix the two small mistakes (one missing ;, one wrong capital letter) so it prints ASHA PATIL and Name length: 10.', mr: 'Theo चा snippet compile होत नाही. Run दाबा आणि error वाचा. दोन छोट्या चुका दुरुस्त करा (एक राहिलेला ;, एक चुकीचं capital letter), म्हणजे ASHA PATIL आणि Name length: 10 print होईल.' },
          noBrowser: true,
          starter: 'String name = "Asha Patil"\nsystem.out.println(name.toUpperCase());\nSystem.out.println("Name length: " + name.length());',
          solution: 'String name = "Asha Patil";\nSystem.out.println(name.toUpperCase());\nSystem.out.println("Name length: " + name.length());',
          output: ['ASHA PATIL', 'Name length: 10'],
          mustUse: [{ pattern: 'name\\.toUpperCase\\(\\)', message: { en: 'Keep name.toUpperCase(): fix the line, do not replace it with typed text.', mr: 'name.toUpperCase() ठेवा: ओळ दुरुस्त करा, तिच्या जागी टाइप केलेला मजकूर लिहू नका.' } }],
          hints: [
            { en: 'Read the error: it names the line. Line 1 is missing its full stop.', mr: 'error वाचा: तो ओळ सांगतो. ओळ 1 चा पूर्णविराम राहिला आहे.' },
            { en: 'After fixing line 1, run again. Now the error says "cannot find symbol: system".', mr: 'ओळ 1 दुरुस्त केल्यावर पुन्हा Run करा. आता error म्हणतो "cannot find symbol: system".' },
            { en: 'Line 3 is written correctly. Compare its first word with line 2.', mr: 'ओळ 3 बरोबर लिहिलेली आहे. तिचा पहिला शब्द ओळ 2 शी तुलना करा.' },
            { en: 'String name = "Asha Patil";\nSystem.out.println(name.toUpperCase());', mr: 'String name = "Asha Patil";\nSystem.out.println(name.toUpperCase());' },
          ],
          successLine: { en: 'Fixed. Reading the error line first saves hours. Space counts as a letter, so Asha Patil has 10.', mr: 'दुरुस्त. आधी error ची ओळ वाचल्याने तास वाचतात. space पण अक्षर म्हणून मोजली जाते, म्हणून Asha Patil मध्ये 10.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Patients aged 60 or more get 100 off the 500 fee. Use if / else: when age >= 60 print Senior fee: 400, otherwise print Fee: 500. Calculate from fee, not by typing 400.', mr: '60 किंवा जास्त वयाच्या रुग्णांना 500 fee वर 100 सूट. if / else वापरा: age >= 60 असेल तर Senior fee: 400 print करा, नाहीतर Fee: 500. 400 टाइप न करता fee वरून हिशेब करा.' },
          noBrowser: true,
          starter: 'int age = 67;\nint fee = 500;\nboolean senior = age >= 60;\n// TODO: if senior, print "Senior fee: " + (fee - 100)\n// TODO: else, print "Fee: " + fee\n',
          solution: 'int age = 67;\nint fee = 500;\nboolean senior = age >= 60;\nif (senior) {\n  System.out.println("Senior fee: " + (fee - 100));\n} else {\n  System.out.println("Fee: " + fee);\n}',
          output: ['Senior fee: 400'],
          mustUse: [
            { pattern: 'if\\s*\\(', message: { en: 'Use an if (...) { } so the program decides by itself.', mr: 'if (...) { } वापरा, म्हणजे program स्वतः ठरवेल.' } },
            { pattern: 'else', message: { en: 'Add the else branch for patients under 60.', mr: '60 पेक्षा कमी वयाच्या रुग्णांसाठी else भाग जोडा.' } },
          ],
          mustNotUse: [{ pattern: '"Senior fee: 400"', message: { en: 'Calculate it: "Senior fee: " + (fee - 100).', mr: 'हिशेब करा: "Senior fee: " + (fee - 100).' } }],
          hints: [
            { en: 'The shape is: if (condition) { ... } else { ... }', mr: 'रचना: if (condition) { ... } else { ... }' },
            { en: 'senior is already a boolean jar holding true or false. Put it in the brackets: if (senior).', mr: 'senior हा आधीच true किंवा false असलेला boolean डबा आहे. तो कंसात ठेवा: if (senior).' },
            { en: 'Keep (fee - 100) in brackets, or + will join 500 and 100 as text.', mr: '(fee - 100) कंसातच ठेवा, नाहीतर + 500 आणि 100 मजकूर म्हणून जोडेल.' },
            { en: 'if (senior) {\n  System.out.println("Senior fee: " + (fee - 100));\n} else {\n  System.out.println("Fee: " + fee);\n}', mr: 'if (senior) {\n  System.out.println("Senior fee: " + (fee - 100));\n} else {\n  System.out.println("Fee: " + fee);\n}' },
          ],
          successLine: { en: 'Senior fee: 400. Change age to 30 and run again: you will see Fee: 500. That is a decision in code.', mr: 'Senior fee: 400. age 30 करून पुन्हा Run करा: Fee: 500 दिसेल. हाच code मधला निर्णय.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Which line puts a decimal fee into the right kind of jar?', mr: 'कोणती ओळ दशांश fee योग्य प्रकारच्या डब्यात ठेवते?' },
        options: ['double fee = 499.5;', 'int fee = 499.5;', 'String fee = 499.5;', 'boolean fee = 499.5;'],
        answer: 0,
        explain: { en: 'Decimals go in a double. int holds only whole numbers, and String needs text in quotes.', mr: 'दशांश संख्या double मध्ये जातात. int मध्ये फक्त पूर्ण संख्या, आणि String ला quotes मधला मजकूर लागतो.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: 'String doctor = "meera";\nSystem.out.println("Dr. " + doctor.toUpperCase());',
        options: ['Dr. meera', 'Dr. MEERA', 'DR. MEERA', 'Dr. Meera'],
        answer: 1,
        explain: { en: 'Only the variable gets toUpperCase(). The text "Dr. " stays as written.', mr: 'toUpperCase() फक्त variable ला लागतं. "Dr. " हा मजकूर जसा लिहिला तसाच राहतो.' },
      },
      {
        q: { en: 'This code will not compile. Why?', mr: 'हा code compile होणार नाही. का?' },
        code: 'String city = "Pune";\nsystem.out.println(city);',
        options: [
          { en: 'Pune needs single quotes', mr: 'Pune ला single quotes लागतात' },
          { en: 'city should be called City', mr: 'city चं नाव City हवं' },
          { en: 'You cannot print a String', mr: 'String print करता येत नाही' },
          { en: 'system must be System: Java cares about capital letters', mr: 'system ऐवजी System हवं: Java ला capital letters चा फरक कळतो' },
        ],
        answer: 3,
        explain: { en: 'Java is case-sensitive. The error says "cannot find symbol: system".', mr: 'Java case-sensitive आहे. error म्हणतो "cannot find symbol: system".' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: 'int a = 2;\nint b = 3;\nSystem.out.println("Sum: " + a + b);',
        options: ['Sum: 5', 'Sum: a + b', 'Sum: 23', { en: 'It does not compile', mr: 'compile होत नाही' }],
        answer: 2,
        explain: { en: 'After text, + joins as text: "Sum: 2" then "Sum: 23". Write "Sum: " + (a + b) to get Sum: 5.', mr: 'मजकुरानंतर + मजकूर म्हणून जोडतं: "Sum: 2" मग "Sum: 23". Sum: 5 हवं असेल तर "Sum: " + (a + b) लिहा.' },
      },
    ],
    recap: { line: { en: 'Statements end with ;, variables are labelled jars of one type, + joins text, a dot calls a method, new makes an object, and capitals matter.', mr: 'statements ; ने संपतात, variables म्हणजे एका type चे लेबल लावलेले डबे, + मजकूर जोडतो, dot method बोलावतो, new object बनवतो, आणि capitals महत्त्वाचे.' }, icon: '🫙' },
  },
]
