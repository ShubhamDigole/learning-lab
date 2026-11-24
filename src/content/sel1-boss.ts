import type { Lesson } from './types.ts'

// Selenium 1, part 3: smart waits (S1.6) and the boss, The Midnight Release (S1.7).
// From here on, every booking flow waits for the time slots with an explicit wait.

const SLOT_1030 = `By.cssSelector(".slot[data-time='10:30']")`

export const selWaitBossLessons: Lesson[] = [
  // ───────────────────────── S1.6 Waits
  {
    id: 'se1-6',
    code: 'S1.6',
    level: 'basic',
    title: { en: "Waits: Don't Sleep, Wait Smart", mr: 'Waits: झोपू नका, हुशारीने वाट पाहा' },
    skill: 'Explicit waits (WebDriverWait)',
    realLife: {
      place: 'station',
      title: { en: 'Waiting for the 8:12 local', mr: '8:12 ची लोकल पकडताना' },
      story: {
        en: 'Meera reaches Thane station for the 8:12 fast local. She does not decide "I will stand here exactly 10 minutes, eyes closed, and then jump." If the train comes in 3 minutes, she boards in 3 minutes. If it is late, she keeps watching the board. But she also has a limit: if nothing comes in 20 minutes, she stops waiting and takes a rickshaw, and tells her office the trains are stuck. Wait for the train, not for the clock. And always have a limit.',
        mr: 'मीरा 8:12 ची फास्ट लोकल पकडायला ठाणे स्टेशनवर पोहोचते. ती असं ठरवत नाही की "मी इथे डोळे मिटून बरोबर 10 मिनिटं उभी राहीन आणि मग उडी मारेन." गाडी 3 मिनिटांत आली तर ती 3 मिनिटांत चढते. गाडी उशिरा असेल तर ती बोर्डकडे पाहत राहते. पण तिची एक मर्यादाही असते: 20 मिनिटांत काहीच आलं नाही तर ती वाट पाहणं थांबवते, रिक्षा घेते, आणि ऑफिसला कळवते की गाड्या अडकल्यात. घड्याळाची नाही, गाडीची वाट पाहा. आणि मर्यादा नेहमी ठेवा.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🚉', label: 'Reach the platform', mr: 'प्लॅटफॉर्मवर पोहोचा' },
          { icon: '👀', label: 'Watch the board, train not here yet', mr: 'बोर्ड पाहा, गाडी अजून नाही' },
          { icon: '🚆', label: 'Train arrives: board at once', mr: 'गाडी आली: लगेच चढा' },
          { icon: '🛺', label: 'No train in 20 min: rickshaw', mr: '20 मिनिटांत गाडी नाही: रिक्षा' },
        ],
        breakAt: 2,
        breakNote: { en: 'She waited 3 minutes, not 10. Waiting stops the moment the train is there.', mr: 'तिने 10 नाही, 3 मिनिटं वाट पाहिली. गाडी येताच वाट पाहणं संपतं.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Last night 14 booking tests went red. This morning the same tests are green. Nobody touched the code!', mr: 'काल रात्री booking च्या 14 tests लाल झाल्या. आज सकाळी त्याच tests हिरव्या. code ला कोणी हातही लावला नाही!' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Classic. The script clicked a time slot before the slot existed. Selenium does not wait unless you tell it to.', mr: 'नेहमीचंच. slot दिसायच्या आधीच script ने त्यावर click केलं. तुम्ही सांगितल्याशिवाय Selenium वाट पाहत नाही.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'The slots come from our server. Usually about a second. On a busy night, longer.', mr: 'slots आमच्या server कडून येतात. साधारण एक सेकंद. गर्दीच्या रात्री जास्त.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> tick tock. i love a test that sleeps. it sleeps, i strike. ⌁', mr: '>> टिक टॉक. झोपणारी test मला फार आवडते. ती झोपते, मी हल्ला करतो. ⌁' } },
        { who: 'meera', mood: 'happy', text: { en: 'We wait smart, {name}. Wait for the exact thing you need, and set a limit.', mr: 'आपण हुशारीने वाट पाहू, {name}. नेमक्या गोष्टीची वाट पाहा, आणि मर्यादा ठेवा.' } },
      ],
      problem: { en: 'Parts of the page arrive late. A script that does not wait fails at random, and a script that sleeps a fixed time is slow and still fails on a slow day. Red tests that turn green on their own destroy trust in the suite.', mr: 'page चे काही भाग उशिरा येतात. वाट न पाहणारी script कधीही fail होते, आणि ठरावीक वेळ झोपणारी script संथ असते आणि संथ दिवशी तरीही fail होते. आपोआप हिरव्या होणाऱ्या लाल tests मुळे suite वरचा विश्वास उडतो.' },
      solution: { en: 'Use an explicit wait: WebDriverWait with an ExpectedCondition. It checks again and again, moves on the moment the condition is true, and gives up with a clear TimeoutException after the limit.', mr: 'explicit wait वापरा: ExpectedCondition सोबत WebDriverWait. तो पुन्हा पुन्हा तपासतो, condition खरी होताच पुढे जातो, आणि मर्यादा संपल्यावर स्पष्ट TimeoutException देऊन थांबतो.' },
    },
    lesson: [
      { en: 'Pages load in pieces. On CareBridge, you click "Check availability", the page says "Checking availability..." and the slots appear about a second later. Selenium is much faster than that. findElement looks once, right now. If the slot is not there yet, you get NoSuchElementException, even though your locator is perfect.', mr: 'page तुकड्या तुकड्यांनी लोड होतं. CareBridge वर तुम्ही "Check availability" ला click करता, page "Checking availability..." दाखवतं आणि साधारण एका सेकंदाने slots दिसतात. Selenium याहून खूप वेगवान आहे. findElement एकदाच, आत्ता लगेच पाहतो. slot अजून आला नसेल तर locator अगदी बरोबर असूनही NoSuchElementException येतो.' },
      { en: 'Thread.sleep(3000) is standing with closed eyes for exactly 3 seconds. If the page is ready in 1 second, you waste 2. Across 300 tests, that is ten wasted minutes on every run. And on a slow night, 3 seconds is not enough, so the test still fails. Slow and flaky at the same time.', mr: 'Thread.sleep(3000) म्हणजे डोळे मिटून बरोबर 3 सेकंद उभं राहणं. page 1 सेकंदात तयार झालं तर 2 सेकंद वाया. 300 tests मध्ये प्रत्येक run ला दहा मिनिटं वाया. आणि संथ रात्री 3 सेकंद पुरत नाहीत, म्हणजे test तरीही fail होते. संथ आणि बेभरवशी, एकाच वेळी.' },
      { en: 'An implicit wait, driver.manage().timeouts().implicitlyWait(...), is one global setting: every findElement keeps trying for up to that long. It helps a little, but it only waits for an element to exist (not to be clickable), it applies everywhere, and it hides slowness that might itself be a bug.', mr: 'implicit wait, म्हणजे driver.manage().timeouts().implicitlyWait(...), ही एक global setting आहे: प्रत्येक findElement तेवढा वेळ प्रयत्न करत राहतो. थोडी मदत होते, पण ती फक्त element अस्तित्वात येईपर्यंत थांबते (click करता येईपर्यंत नाही), सगळीकडे लागू होते, आणि स्वतःच bug असू शकणारा संथपणा लपवते.' },
      { en: 'An explicit wait is the smart way. new WebDriverWait(driver, Duration.ofSeconds(10)) plus wait.until(ExpectedConditions...) checks every half second and returns the moment the condition is true. If 10 seconds pass, it throws TimeoutException and says exactly what it waited for. For a tester, that message is gold: a timeout on a page that should load in 1 second is a performance bug worth reporting.', mr: 'explicit wait ही हुशार पद्धत आहे. new WebDriverWait(driver, Duration.ofSeconds(10)) आणि wait.until(ExpectedConditions...) दर अर्ध्या सेकंदाला तपासतो आणि condition खरी होताच परत येतो. 10 सेकंद संपले तर तो TimeoutException देतो आणि नेमकी कशाची वाट पाहत होता ते सांगतो. टेस्टरसाठी हा message सोन्यासारखा: 1 सेकंदात लोड व्हायला हवं असलेल्या page वर timeout म्हणजे report करण्यासारखा performance bug.' },
    ],
    syntax: {
      template: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

WebElement slot = wait.until(
    ExpectedConditions.elementToBeClickable(${SLOT_1030}));
slot.click();

wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("booking-id")));
wait.until(ExpectedConditions.urlContains("/confirmation"));`,
      parts: [
        { code: 'new WebDriverWait(driver, Duration.ofSeconds(10))', means: { en: 'a waiter with a limit: try for at most 10 seconds', mr: 'मर्यादा असलेला waiter: जास्तीत जास्त 10 सेकंद प्रयत्न' } },
        { code: 'wait.until(...)', means: { en: 'keep checking the condition (every 500 ms) until it is true, then return at once', mr: 'condition खरी होईपर्यंत (दर 500 ms ला) तपासत राहा, आणि मग लगेच परत या' } },
        { code: 'ExpectedConditions.visibilityOfElementLocated(by)', means: { en: 'the element is on the page and visible; returns the element', mr: 'element page वर आहे आणि दिसतोय; element परत देतो' } },
        { code: 'ExpectedConditions.elementToBeClickable(by)', means: { en: 'visible and enabled, safe to click; returns the element', mr: 'दिसतोय आणि enabled आहे, click करायला सुरक्षित; element परत देतो' } },
        { code: 'ExpectedConditions.urlContains("/confirmation")', means: { en: 'the browser has moved to a page whose address contains this text', mr: 'browser अशा page वर गेला ज्याच्या पत्त्यात हा मजकूर आहे' } },
        { code: 'TimeoutException', means: { en: 'what you get when the limit runs out: the message names the condition', mr: 'मर्यादा संपल्यावर येणारी exception: message मध्ये condition चं नाव असतं' } },
      ],
      example: [
        { code: 'WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));', note: { en: 'Meera decides her limit before the train is even announced', mr: 'गाडीची घोषणा होण्याआधीच मीरा आपली मर्यादा ठरवते' } },
        { code: 'driver.findElement(By.id("check-slots")).click();', note: { en: 'the board says "train expected": the slots are on their way', mr: 'बोर्ड म्हणतो "गाडी येत आहे": slots येतायत' } },
        { code: `WebElement slot = wait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030}));`, note: { en: 'watch the platform until the train is really there and the doors are open', mr: 'गाडी खरंच येऊन दारं उघडेपर्यंत प्लॅटफॉर्मकडे पाहा' } },
        { code: 'slot.click();', note: { en: 'board at once, no extra standing around', mr: 'लगेच चढा, उगाच उभं राहणं नाही' } },
        { code: 'wait.until(ExpectedConditions.urlContains("/confirmation"));', note: { en: 'wait until you have really reached the next station', mr: 'पुढच्या स्टेशनवर खरंच पोहोचेपर्यंत थांबा' } },
      ],
      exampleNote: { en: 'If the slots show up in 1 second, the wait takes 1 second. If they never show up, you get TimeoutException after 10 seconds, with a message that says what never happened.', mr: 'slots 1 सेकंदात आले तर wait 1 सेकंदच घेतो. कधीच आले नाहीत तर 10 सेकंदांनी TimeoutException येतो, आणि message सांगतो काय घडलंच नाही.' },
      pitfall: { en: 'Do not mix implicitlyWait and WebDriverWait in one suite. The two can stack up and make timeouts unpredictable. Leave the implicit wait at zero and use explicit waits where the page is really slow.', mr: 'एकाच suite मध्ये implicitlyWait आणि WebDriverWait एकत्र वापरू नका. दोन्ही एकमेकांत मिसळून timeouts अंदाज न येण्यासारखे होतात. implicit wait शून्यावर ठेवा आणि page खरंच संथ असेल तिथे explicit waits वापरा.' },
    },
    practice: {
      intro: { en: 'You are logged in as Asha on the booking page. The slots take about a second to appear. First watch a script fail, then make it wait smart.', mr: 'तुम्ही Asha म्हणून booking page वर logged in आहात. slots दिसायला साधारण एक सेकंद लागतो. आधी एक script fail होताना पाहा, मग तिला हुशारीने वाट पाहायला शिकवा.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'Press Run and watch the browser on the right. The script types a date, clicks "Check availability" and immediately clicks the 10:30 slot. Read the red line in the log. Why did it fail?', mr: 'Run दाबा आणि उजवीकडचा browser पाहा. script तारीख टाइप करते, "Check availability" ला click करते आणि लगेच 10:30 च्या slot ला click करते. log मधली लाल ओळ वाचा. ती fail का झाली?' },
          seleniumSandbox: {
            loggedIn: true,
            startUrl: 'https://carebridge.test/book',
            code: `driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
// no waiting at all
driver.findElement(${SLOT_1030}).click();
System.out.println("Slot picked!");`,
          },
          options: [
            { en: 'The locator for the 10:30 slot is spelled wrong', mr: '10:30 च्या slot चा locator चुकीचा लिहिलाय' },
            { en: 'The slots were still loading. findElement looked only once, before they appeared', mr: 'slots अजून लोड होत होते. findElement ने ते दिसायच्या आधी एकदाच पाहिलं' },
            { en: 'Asha is not logged in', mr: 'Asha logged in नाही' },
            { en: 'The 10:30 slot is already taken', mr: '10:30 चा slot आधीच बुक आहे' },
          ],
          correct: [1],
          explain: { en: 'NoSuchElementException: the page still said "Checking availability...". The locator is fine (you will use the same one in a moment). The script was simply faster than the server.', mr: 'NoSuchElementException: page अजून "Checking availability..." दाखवत होतं. locator बरोबर आहे (तोच तुम्ही थोड्या वेळाने वापरणार आहात). script फक्त server पेक्षा वेगवान होती.' },
          hints: [
            { en: 'Look at the browser at the moment the script fails. What does the slot area say?', mr: 'script fail होते त्या क्षणी browser पाहा. slot च्या भागात काय लिहिलंय?' },
            { en: 'The slots appear about a second after the click. findElement does not wait.', mr: 'click नंतर साधारण एका सेकंदाने slots दिसतात. findElement वाट पाहत नाही.' },
          ],
          successLine: { en: 'Right. A perfect locator still fails if you look too early.', mr: 'बरोबर. खूप लवकर पाहिलं तर अगदी बरोबर locator सुद्धा fail होतो.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Fix it with an explicit wait. Create a WebDriverWait of 5 seconds, wait until the 10:30 slot is clickable, click it, and assert that its class now contains "selected". No Thread.sleep allowed.', mr: 'explicit wait ने हे दुरुस्त करा. 5 सेकंदांचा WebDriverWait तयार करा, 10:30 चा slot clickable होईपर्यंत थांबा, त्याला click करा, आणि त्याच्या class मध्ये आता "selected" आहे असं assert करा. Thread.sleep चालणार नाही.' },
          loggedIn: true,
          startUrl: 'https://carebridge.test/book',
          noSleep: true,
          minAssertions: 1,
          mustUse: [
            { pattern: 'new\\s+WebDriverWait\\(', message: { en: 'Create a WebDriverWait: new WebDriverWait(driver, Duration.ofSeconds(5)).', mr: 'WebDriverWait तयार करा: new WebDriverWait(driver, Duration.ofSeconds(5)).' } },
            { pattern: 'elementToBeClickable\\(', message: { en: 'Wait with ExpectedConditions.elementToBeClickable(...) so you only click when the slot is ready.', mr: 'ExpectedConditions.elementToBeClickable(...) ने वाट पाहा, म्हणजे slot तयार झाल्यावरच click होईल.' } },
          ],
          starter: `driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();

// TODO 1: create a WebDriverWait with a limit of 5 seconds
// TODO 2: wait until the 10:30 slot is clickable (use the wait instead of findElement)
WebElement slot = driver.findElement(${SLOT_1030});
slot.click();

// TODO 3: assert that slot.getAttribute("class") contains "selected"
`,
          solution: `driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();

WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
WebElement slot = wait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030}));
slot.click();

Assert.assertTrue(slot.getAttribute("class").contains("selected"), "10:30 should be selected");
`,
          hints: [
            { en: 'The wait line looks like: WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));', mr: 'wait ची ओळ अशी दिसते: WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));' },
            { en: 'wait.until(...) returns the element once it is ready, so you can store it: WebElement slot = wait.until(ExpectedConditions.elementToBeClickable(...));', mr: 'wait.until(...) element तयार झाल्यावर तोच परत देतो, म्हणून तो साठवता येतो: WebElement slot = wait.until(ExpectedConditions.elementToBeClickable(...));' },
            { en: 'After the click the class becomes "slot selected". Check it with Assert.assertTrue(... .contains("selected")).', mr: 'click नंतर class "slot selected" होतो. Assert.assertTrue(... .contains("selected")) ने तपासा.' },
            {
              en: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));\nWebElement slot = wait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030}));\nslot.click();\nAssert.assertTrue(slot.getAttribute("class").contains("selected"));`,
              mr: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));\nWebElement slot = wait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030}));\nslot.click();\nAssert.assertTrue(slot.getAttribute("class").contains("selected"));`,
            },
          ],
          successLine: { en: 'The wait took about one second, not five. It moved on the moment the slot was ready.', mr: 'wait ने पाच नाही, साधारण एकच सेकंद घेतला. slot तयार होताच तो पुढे गेला.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'An old script books an appointment using two Thread.sleep calls. Press Run: it even passes. But it wastes time on every run and breaks on a slow night. Replace the first sleep with a wait for the 10:30 slot, and the second with a wait until the URL contains "/confirmation". Keep the assertion.', mr: 'एक जुनी script दोन Thread.sleep वापरून appointment बुक करते. Run दाबा: ती pass सुद्धा होते. पण प्रत्येक run ला वेळ वाया घालवते आणि संथ रात्री तुटते. पहिल्या sleep च्या जागी 10:30 च्या slot ची wait लावा, आणि दुसऱ्याच्या जागी URL मध्ये "/confirmation" येईपर्यंतची wait. assertion तसंच ठेवा.' },
          loggedIn: true,
          startUrl: 'https://carebridge.test/book',
          noSleep: true,
          minAssertions: 1,
          mustUse: [
            { pattern: 'urlContains\\(\\s*"/confirmation"\\s*\\)', message: { en: 'Wait for the next page with ExpectedConditions.urlContains("/confirmation").', mr: 'पुढच्या page साठी ExpectedConditions.urlContains("/confirmation") ने वाट पाहा.' } },
          ],
          starter: `driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
Thread.sleep(3000); // TODO: replace with an explicit wait for the 10:30 slot
driver.findElement(${SLOT_1030}).click();

driver.findElement(By.id("patient-name")).sendKeys("Asha Patil");
driver.findElement(By.id("terms")).click();
driver.findElement(By.id("confirm-btn")).click();
Thread.sleep(2000); // TODO: replace with a wait until the URL contains "/confirmation"

Assert.assertEquals(driver.findElement(By.id("booking-id")).getText(), "CB-1001");
`,
          solution: `driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
wait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030})).click();

driver.findElement(By.id("patient-name")).sendKeys("Asha Patil");
driver.findElement(By.id("terms")).click();
driver.findElement(By.id("confirm-btn")).click();
wait.until(ExpectedConditions.urlContains("/confirmation"));

Assert.assertEquals(driver.findElement(By.id("booking-id")).getText(), "CB-1001");
`,
          hints: [
            { en: 'Create one wait at the top and reuse it: WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));', mr: 'वर एकच wait तयार करा आणि तोच पुन्हा वापरा: WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));' },
            { en: 'You can wait and click in one line: wait.until(ExpectedConditions.elementToBeClickable(...)).click();', mr: 'wait आणि click एकाच ओळीत करता येतं: wait.until(ExpectedConditions.elementToBeClickable(...)).click();' },
            { en: 'After Confirm, the page moves to /confirmation about half a second later: wait.until(ExpectedConditions.urlContains("/confirmation"));', mr: 'Confirm नंतर साधारण अर्ध्या सेकंदाने page /confirmation वर जातं: wait.until(ExpectedConditions.urlContains("/confirmation"));' },
            {
              en: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));\nwait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030})).click();\n...\nwait.until(ExpectedConditions.urlContains("/confirmation"));`,
              mr: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));\nwait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030})).click();\n...\nwait.until(ExpectedConditions.urlContains("/confirmation"));`,
            },
          ],
          successLine: { en: 'Same result, about 3 seconds faster, and it will not break on a slow night. Booking CB-1001 is confirmed.', mr: 'तोच निकाल, साधारण 3 सेकंद लवकर, आणि संथ रात्री तुटणार नाही. booking CB-1001 confirm झालं.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Tonight the test server is overloaded: slots take about 6 seconds. Press Run. The 3 second wait gives up with TimeoutException. Pick a sensible new limit: enough room above 6 seconds, but not a silly 60. Then Run and Submit.', mr: 'आज रात्री test server वर खूप भार आहे: slots ला साधारण 6 सेकंद लागतात. Run दाबा. 3 सेकंदांची wait TimeoutException देऊन थांबते. एक योग्य नवी मर्यादा निवडा: 6 सेकंदांपेक्षा पुरेशी जास्त, पण 60 सारखी अवास्तव नाही. मग Run आणि Submit.' },
          loggedIn: true,
          startUrl: 'https://carebridge.test/book',
          build: ['slots-slow'],
          noSleep: true,
          minAssertions: 1,
          mustUse: [
            { pattern: 'Duration\\.ofSeconds\\(\\s*([7-9]|1[0-5])\\s*\\)', message: { en: 'Choose a limit between 7 and 15 seconds: above the 6 seconds the slots need, and still short enough that a real hang fails fast.', mr: '7 ते 15 सेकंदांमधली मर्यादा निवडा: slots ला लागणाऱ्या 6 सेकंदांपेक्षा जास्त, आणि तरीही खरंच अडकलं तर test लवकर fail होईल इतकी कमी.' } },
          ],
          mustNotUse: [
            { pattern: 'implicitlyWait', message: { en: 'Keep it explicit: change the WebDriverWait limit instead of adding an implicit wait.', mr: 'explicit च ठेवा: implicit wait जोडण्याऐवजी WebDriverWait ची मर्यादा बदला.' } },
          ],
          starter: `driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();

// TODO: 3 seconds is too short tonight. Choose a better limit.
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(3));
wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".slot")));

Assert.assertEquals(driver.findElements(By.cssSelector(".slot")).size(), 4, "all four time slots");
`,
          solution: `driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();

WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(8));
wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".slot")));

Assert.assertEquals(driver.findElements(By.cssSelector(".slot")).size(), 4, "all four time slots");
`,
          hints: [
            { en: 'Read the TimeoutException: "tried for 3 second(s)". The slots need about 6.', mr: 'TimeoutException वाचा: "tried for 3 second(s)". slots ला साधारण 6 लागतात.' },
            { en: 'Only the number inside Duration.ofSeconds(...) needs to change. Give it a little room, like 8 or 10.', mr: 'फक्त Duration.ofSeconds(...) मधला आकडा बदलायचा आहे. थोडी जागा ठेवा, जसे 8 किंवा 10.' },
            { en: 'WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(8));', mr: 'WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(8));' },
          ],
          successLine: { en: 'Passed in about 6 seconds, not 8: the wait still stops early. And remember to tell Theo that slots took 6 seconds. That slowness is a finding too.', mr: '8 नाही, साधारण 6 सेकंदांत pass: wait अजूनही लवकर थांबतो. आणि Theo ला सांगायला विसरू नका की slots ला 6 सेकंद लागले. तो संथपणा सुद्धा एक finding आहे.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'The slots appear after 1 second. The script uses Thread.sleep(5000) before clicking one. What happens?', mr: 'slots 1 सेकंदाने दिसतात. script एकावर click करण्याआधी Thread.sleep(5000) वापरते. काय होतं?' },
        options: [
          { en: 'The sleep ends early as soon as the slots appear', mr: 'slots दिसताच sleep लवकर संपतो' },
          { en: 'It throws TimeoutException after 5 seconds', mr: '5 सेकंदांनी TimeoutException येतो' },
          { en: 'It always waits the full 5 seconds, wasting 4 on every run', mr: 'तो नेहमी पूर्ण 5 सेकंद थांबतो, प्रत्येक run ला 4 सेकंद वाया' },
          { en: 'Selenium skips the sleep because the page is ready', mr: 'page तयार आहे म्हणून Selenium sleep वगळतो' },
        ],
        answer: 2,
        explain: { en: 'Thread.sleep does not look at the page at all. It stands with closed eyes for the full time, and on a really slow day it still is not enough.', mr: 'Thread.sleep page कडे अजिबात पाहत नाही. तो पूर्ण वेळ डोळे मिटून उभा राहतो, आणि खरंच संथ दिवशी तरीही पुरत नाही.' },
      },
      {
        q: { en: 'The booking id appears 2 seconds after Confirm. About how long does this line wait?', mr: 'Confirm नंतर 2 सेकंदांनी booking id दिसतो. ही ओळ साधारण किती वेळ थांबते?' },
        code: 'WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));\nwait.until(ExpectedConditions.visibilityOfElementLocated(By.id("booking-id")));',
        options: [
          { en: 'About 2 seconds', mr: 'साधारण 2 सेकंद' },
          { en: 'Exactly 10 seconds', mr: 'बरोबर 10 सेकंद' },
          { en: '12 seconds', mr: '12 सेकंद' },
          { en: 'It does not wait at all', mr: 'तो अजिबात थांबत नाही' },
        ],
        answer: 0,
        explain: { en: '10 seconds is only the limit. The wait checks every half second and returns as soon as the element is visible.', mr: '10 सेकंद ही फक्त मर्यादा आहे. wait दर अर्ध्या सेकंदाला तपासतो आणि element दिसताच परत येतो.' },
      },
      {
        q: { en: 'An explicit wait reaches its limit and the condition is still false. What does Selenium throw?', mr: 'explicit wait आपल्या मर्यादेपर्यंत पोहोचला आणि condition अजूनही खोटी आहे. Selenium काय देतो?' },
        options: ['NoSuchElementException', 'StaleElementReferenceException', 'ElementNotInteractableException', 'TimeoutException'],
        answer: 3,
        explain: { en: 'TimeoutException, with a message like "Expected condition failed: waiting for url to contain "/confirmation" (tried for 10 second(s)...)". It tells you exactly what never happened.', mr: 'TimeoutException, आणि message असा: "Expected condition failed: waiting for url to contain "/confirmation" (tried for 10 second(s)...)". काय घडलंच नाही ते तो नेमकं सांगतो.' },
      },
      {
        q: { en: 'Why do experienced testers prefer an explicit wait over a global implicit wait?', mr: 'अनुभवी टेस्टर global implicit wait पेक्षा explicit wait का पसंत करतात?' },
        options: [
          { en: 'Explicit waits never fail', mr: 'explicit waits कधीच fail होत नाहीत' },
          { en: 'It waits for a specific condition, like clickable or a URL, only where the page is slow', mr: 'तो नेमक्या condition ची, जसे clickable किंवा URL, फक्त page संथ असेल तिथे वाट पाहतो' },
          { en: 'Implicit waits only work in Firefox', mr: 'implicit waits फक्त Firefox मध्ये चालतात' },
          { en: 'Explicit waits make the server faster', mr: 'explicit waits मुळे server वेगवान होतो' },
        ],
        answer: 1,
        explain: { en: 'An implicit wait only waits for elements to exist, everywhere, and hides slowness. An explicit wait says exactly what it needs and where, and fails with a clear message.', mr: 'implicit wait फक्त elements अस्तित्वात येईपर्यंत, सगळीकडे थांबतो, आणि संथपणा लपवतो. explicit wait नेमकं काय आणि कुठे हवं ते सांगतो, आणि fail झाला तर स्पष्ट message देतो.' },
      },
    ],
    recap: { line: { en: 'Never sleep. Wait for the exact thing with WebDriverWait, give it a sensible limit, and read a TimeoutException as a clue.', mr: 'कधीच झोपू नका. WebDriverWait ने नेमक्या गोष्टीची वाट पाहा, योग्य मर्यादा द्या, आणि TimeoutException ला एक सुगावा म्हणून वाचा.' }, icon: '⏱️' },
  },

  // ───────────────────────── S1.7 Boss: The Midnight Release
  {
    id: 'se1-7',
    code: 'S1.7',
    level: 'basic',
    isBoss: true,
    title: { en: 'Boss: The Midnight Release', mr: 'बॉस: मध्यरात्रीचं रिलीज' },
    skill: 'End-to-end UI regression',
    realLife: {
      place: 'wedding',
      title: { en: 'The night before the wedding', mr: 'लग्नाच्या आदल्या रात्री' },
      story: {
        en: 'It is 11 pm, the night before cousin Pooja\'s wedding. Meera\'s mavshi does her final round of the hall. She does not just look at it from the gate and say "looks fine". She walks the path a guest will walk: the entrance, the mandap, the seats, the buffet. She tastes every sweet. The jalebi is perfect. The gulab jamun is salty: someone used salt instead of sugar. Better to find it at 11 pm than with 500 guests at noon.',
        mr: 'रात्रीचे 11 वाजलेत, चुलत बहीण पूजाच्या लग्नाची आदली रात्र. मीराची मावशी हॉलची शेवटची फेरी मारते. ती गेटवरून पाहून "छान दिसतंय" म्हणत नाही. पाहुणा ज्या मार्गाने जाईल त्याच मार्गाने ती चालते: प्रवेशद्वार, मंडप, खुर्च्या, बुफे. प्रत्येक गोड पदार्थ चाखते. जिलेबी उत्तम. गुलाबजाम खारट: कोणीतरी साखरेऐवजी मीठ टाकलंय. दुपारी 500 पाहुण्यांसमोर कळण्यापेक्षा रात्री 11 वाजता कळलेलं बरं.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🚪', label: 'Entrance', mr: 'प्रवेशद्वार' },
          { icon: '💐', label: 'Mandap', mr: 'मंडप' },
          { icon: '🪑', label: 'Seats', mr: 'खुर्च्या' },
          { icon: '🍮', label: 'Taste the sweets', mr: 'गोड पदार्थ चाखा' },
          { icon: '🎉', label: 'Guests arrive', mr: 'पाहुणे येतात' },
        ],
        breakAt: 3,
        breakNote: { en: 'Salty gulab jamun! Found the night before, fixed by morning.', mr: 'खारट गुलाबजाम! आदल्या रात्री सापडले, सकाळपर्यंत दुरुस्त.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'It is 11 pm. The new booking release goes live at 2 am, and hospitals across Pune will use it in the morning.', mr: 'रात्रीचे 11 वाजलेत. नवं booking release रात्री 2 वाजता live होतं, आणि सकाळी पुण्यातली हॉस्पिटल्स ते वापरणार आहेत.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> i left a few gifts in tonight\'s build. wrong fees, stuck buttons, missing bookings. click click, good luck. ⌁', mr: '>> आजच्या build मध्ये मी काही भेटी ठेवल्यात. चुकीची fees, अडकलेली बटणं, गायब bookings. click click, शुभेच्छा. ⌁' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Then we walk the patient\'s path, end to end, and check every number on the way. Waits where the page is slow, assertions where money is involved.', mr: 'मग आपण रुग्णाचा मार्ग सुरुवातीपासून शेवटपर्यंत चालू, आणि वाटेतला प्रत्येक आकडा तपासू. page संथ असेल तिथे waits, पैसे असतील तिथे assertions.' } },
        { who: 'meera', mood: 'worried', text: { en: 'Boss rules, {name}: only 2 hints per step. Everything you learned is on the table: locators, Select, assertions, waits.', mr: 'बॉसचे नियम, {name}: प्रत्येक स्टेपला फक्त 2 हिंट्स. शिकलेलं सगळं वापरा: locators, Select, assertions, waits.' } },
      ],
      problem: { en: 'A release is three hours away and the build may hide bugs in the most important flow: booking a doctor and paying the right fee. Clicking through by hand at midnight is slow and easy to get wrong.', mr: 'release तीन तासांवर आहे आणि build सगळ्यात महत्त्वाच्या flow मध्ये bugs लपवत असेल: डॉक्टरची appointment बुक करणं आणि योग्य fee भरणं. मध्यरात्री हाताने click करत तपासणं संथ आहे आणि चुका होणं सोपं आहे.' },
      solution: { en: 'Write an end-to-end Selenium regression: log in, book, confirm, and check the appointments list. Every step waits smartly and every important value is asserted, so each planted bug turns a test red.', mr: 'end-to-end Selenium regression लिहा: login, booking, confirm, आणि appointments ची यादी तपासा. प्रत्येक स्टेप हुशारीने वाट पाहते आणि प्रत्येक महत्त्वाची value assert होते, म्हणजे लपवलेला प्रत्येक bug एक test लाल करतो.' },
    },
    lesson: [
      { en: 'An end-to-end test walks the whole journey a real patient takes: log in, choose a doctor, pick a date and time, confirm, and see the booking in "My appointments". If any piece breaks, the journey breaks.', mr: 'end-to-end test खरा रुग्ण जो संपूर्ण प्रवास करतो तो चालते: login, डॉक्टर निवडा, तारीख आणि वेळ निवडा, confirm, आणि "My appointments" मध्ये booking पाहा. कोणताही तुकडा तुटला तर प्रवास तुटतो.' },
      { en: 'A test that only clicks proves nothing. Assert what matters to the patient: the booking id, the doctor, and above all the fee. Dr. Arjun Shah charges ₹1200, so the confirmation must say ₹1200, not "some number".', mr: 'फक्त click करणारी test काहीच सिद्ध करत नाही. रुग्णासाठी जे महत्त्वाचं ते assert करा: booking id, डॉक्टर, आणि सगळ्यात आधी fee. Dr. Arjun Shah ची fee ₹1200 आहे, म्हणून confirmation वर ₹1200 च दिसायला हवं, "कोणताही आकडा" नाही.' },
      { en: 'Add a negative check: try to do something the app must refuse. Confirm with an empty patient name and expect "Patient name is required". Happy paths alone never catch a missing rule.', mr: 'एक negative check जोडा: app ने नाकारायला हवी अशी गोष्ट करून पाहा. रुग्णाचं नाव रिकामं ठेवून confirm करा आणि "Patient name is required" अपेक्षित ठेवा. फक्त happy paths ने गायब झालेला नियम कधीच पकडला जात नाही.' },
      { en: 'Finally, the go / no-go call. A red test is not a nuisance to delete. It is a fact for the team: what broke, the expected value and the found value. You ship only when the suite is green for the right reasons.', mr: 'शेवटी go / no-go चा निर्णय. लाल test ही काढून टाकायची कटकट नाही. ती टीमसाठी एक वस्तुस्थिती आहे: काय तुटलं, expected value आणि found value. suite योग्य कारणांनी हिरवा असेल तेव्हाच ship करा.' },
    ],
    syntax: {
      template: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
new Select(driver.findElement(By.id("doctor"))).selectByVisibleText("Dr. Arjun Shah (Cardiology)");
driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
wait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030})).click();
driver.findElement(By.id("patient-name")).sendKeys("Asha Patil");
driver.findElement(By.id("terms")).click();
driver.findElement(By.id("confirm-btn")).click();
wait.until(ExpectedConditions.urlContains("/confirmation"));
Assert.assertEquals(driver.findElement(By.id("fee")).getText(), "₹1200");`,
      parts: [
        { code: 'new Select(...).selectByVisibleText(...)', means: { en: 'choose the doctor exactly as the dropdown shows it', mr: 'dropdown मध्ये जसा दिसतो तसाच डॉक्टर निवडा' } },
        { code: 'wait.until(...elementToBeClickable(...)).click()', means: { en: 'wait for the slot, then click it in one line', mr: 'slot ची वाट पाहा, आणि एकाच ओळीत click करा' } },
        { code: 'By.id("terms")', means: { en: 'the terms checkbox: Confirm stays disabled until a slot is picked and this is ticked', mr: 'terms चा checkbox: slot निवडेपर्यंत आणि हा tick होईपर्यंत Confirm disabled राहतं' } },
        { code: 'urlContains("/confirmation")', means: { en: 'the booking takes about half a second to save: wait for the next page', mr: 'booking save व्हायला साधारण अर्धा सेकंद लागतो: पुढच्या page ची वाट पाहा' } },
        { code: 'Assert.assertEquals(..., "₹1200")', means: { en: 'the money check: the fee must match the chosen doctor', mr: 'पैशांची तपासणी: fee निवडलेल्या डॉक्टरशी जुळायलाच हवी' } },
      ],
      example: [
        { code: 'driver.findElement(By.id("password")).sendKeys("care123", Keys.ENTER);', note: { en: 'the entrance: log in', mr: 'प्रवेशद्वार: login' } },
        { code: 'new Select(driver.findElement(By.id("doctor"))).selectByVisibleText("Dr. Arjun Shah (Cardiology)");', note: { en: 'the mandap: choose the doctor', mr: 'मंडप: डॉक्टर निवडा' } },
        { code: `wait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030})).click();`, note: { en: 'the seats: wait for the slots, take 10:30', mr: 'खुर्च्या: slots ची वाट पाहा, 10:30 घ्या' } },
        { code: 'Assert.assertEquals(driver.findElement(By.id("fee")).getText(), "₹1200");', note: { en: 'taste the sweets: is the fee really right?', mr: 'गोड चाखा: fee खरंच बरोबर आहे का?' } },
        { code: 'Assert.assertEquals(driver.findElement(By.id("booking-id")).getText(), "CB-1001");', note: { en: 'the guest list: the booking got its id', mr: 'पाहुण्यांची यादी: booking ला id मिळाला' } },
      ],
      pitfall: { en: 'Do not assert only that the confirmation page opened. A wrong fee still opens it. Check the values a patient would complain about.', mr: 'फक्त confirmation page उघडलं एवढंच assert करू नका. चुकीची fee असली तरी ते उघडतं. रुग्ण ज्या values बद्दल तक्रार करेल त्या तपासा.' },
    },
    practice: {
      intro: { en: 'Five hits to defeat the Gremlin before 2 am. Each test you submit is also run on builds with the Gremlin\'s bugs, and it must turn red there.', mr: 'रात्री 2 च्या आधी Gremlin ला हरवायला पाच फटके. तुम्ही submit केलेली प्रत्येक test Gremlin चे bugs असलेल्या builds वरही चालवली जाते, आणि तिथे ती लाल व्हायलाच हवी.' },
      steps: [
        {
          kind: 'selenium',
          prompt: { en: 'Hit 1, the entrance. Open the login page, assert the title is "Login | CareBridge", log in as asha / care123, and assert the welcome heading says "Welcome, Asha Patil".', mr: 'फटका 1, प्रवेशद्वार. login page उघडा, title "Login | CareBridge" आहे असं assert करा, asha / care123 ने login करा, आणि welcome heading "Welcome, Asha Patil" म्हणतं असं assert करा.' },
          startUrl: 'https://carebridge.test/login',
          minAssertions: 2,
          noSleep: true,
          mustCatch: [
            { bug: 'title-typo', label: { en: 'Login title says "CareBrigde"', mr: 'login title मध्ये "CareBrigde"' } },
            { bug: 'welcome-name', label: { en: 'Dashboard says "Welcome, undefined"', mr: 'dashboard वर "Welcome, undefined"' } },
          ],
          starter: `driver.get("https://carebridge.test/login");
// TODO 1: assert the title is "Login | CareBridge"

// TODO 2: log in as asha / care123 (Keys.ENTER works in the password box)

// TODO 3: assert the welcome heading (class "welcome") says "Welcome, Asha Patil"
`,
          solution: `driver.get("https://carebridge.test/login");
Assert.assertEquals(driver.getTitle(), "Login | CareBridge");

driver.findElement(By.id("username")).sendKeys("asha");
driver.findElement(By.id("password")).sendKeys("care123", Keys.ENTER);

Assert.assertEquals(driver.findElement(By.className("welcome")).getText(), "Welcome, Asha Patil");
`,
          hints: [
            { en: 'Two assertions: Assert.assertEquals(driver.getTitle(), "Login | CareBridge"); and one on driver.findElement(By.className("welcome")).getText().', mr: 'दोन assertions: Assert.assertEquals(driver.getTitle(), "Login | CareBridge"); आणि एक driver.findElement(By.className("welcome")).getText() वर.' },
            { en: 'driver.findElement(By.id("username")).sendKeys("asha");\ndriver.findElement(By.id("password")).sendKeys("care123", Keys.ENTER);', mr: 'driver.findElement(By.id("username")).sendKeys("asha");\ndriver.findElement(By.id("password")).sendKeys("care123", Keys.ENTER);' },
            { en: 'The dashboard loads at once after login, so no wait is needed here.', mr: 'login नंतर dashboard लगेच लोड होतं, म्हणून इथे wait ची गरज नाही.' },
          ],
          successLine: { en: 'Hit! The entrance is guarded: a title typo or a broken name would turn this red.', mr: 'फटका! प्रवेशद्वार सुरक्षित: title मधली चूक किंवा बिघडलेलं नाव ही test लाल करेल.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Hit 2, the heart of the release. Book Dr. Arjun Shah (fee ₹1200) for 2026-12-10 at 10:30. Before typing the name, do a negative check: click Confirm with an empty name and assert #form-error says "Patient name is required". Then type "Asha Patil", confirm, wait for /confirmation, and assert the booking id CB-1001 and the fee ₹1200.', mr: 'फटका 2, release चं हृदय. Dr. Arjun Shah (fee ₹1200) साठी 2026-12-10 ला 10:30 ची appointment बुक करा. नाव टाइप करण्याआधी negative check करा: नाव रिकामं ठेवून Confirm ला click करा आणि #form-error "Patient name is required" म्हणतं असं assert करा. मग "Asha Patil" टाइप करा, confirm करा, /confirmation ची वाट पाहा, आणि booking id CB-1001 आणि fee ₹1200 assert करा.' },
          loggedIn: true,
          startUrl: 'https://carebridge.test/book',
          minAssertions: 3,
          noSleep: true,
          mustUse: [
            { pattern: 'new\\s+WebDriverWait\\(', message: { en: 'The slots and the confirmation page arrive late. Use a WebDriverWait.', mr: 'slots आणि confirmation page उशिरा येतात. WebDriverWait वापरा.' } },
          ],
          mustCatch: [
            { bug: 'wrong-fee', label: { en: 'Confirmation charges ₹50 extra', mr: 'confirmation वर ₹50 जास्त' } },
            { bug: 'confirm-stuck', label: { en: 'Confirm button never becomes enabled', mr: 'Confirm बटण कधीच enabled होत नाही' } },
            { bug: 'name-not-required', label: { en: 'Booking works with an empty patient name', mr: 'रुग्णाचं नाव रिकामं असूनही booking होतं' } },
          ],
          starter: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
new Select(driver.findElement(By.id("doctor"))).selectByVisibleText("Dr. Arjun Shah (Cardiology)");
driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
// TODO 1: wait until the 10:30 slot is clickable, and click it

driver.findElement(By.id("terms")).click();

// TODO 2: negative check. Click Confirm with NO patient name,
//         then assert #form-error says "Patient name is required"

// TODO 3: type the patient name "Asha Patil" and click Confirm again
// TODO 4: wait until the URL contains "/confirmation"
// TODO 5: assert #booking-id is "CB-1001" and #fee is "₹1200"
`,
          solution: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
new Select(driver.findElement(By.id("doctor"))).selectByVisibleText("Dr. Arjun Shah (Cardiology)");
driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
wait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030})).click();

driver.findElement(By.id("terms")).click();

driver.findElement(By.id("confirm-btn")).click();
Assert.assertEquals(driver.findElement(By.id("form-error")).getText(), "Patient name is required");

driver.findElement(By.id("patient-name")).sendKeys("Asha Patil");
driver.findElement(By.id("confirm-btn")).click();
wait.until(ExpectedConditions.urlContains("/confirmation"));

Assert.assertEquals(driver.findElement(By.id("booking-id")).getText(), "CB-1001");
Assert.assertEquals(driver.findElement(By.id("fee")).getText(), "₹1200");
`,
          hints: [
            { en: 'Negative check first: driver.findElement(By.id("confirm-btn")).click(); then Assert.assertEquals(driver.findElement(By.id("form-error")).getText(), "Patient name is required");', mr: 'आधी negative check: driver.findElement(By.id("confirm-btn")).click(); मग Assert.assertEquals(driver.findElement(By.id("form-error")).getText(), "Patient name is required");' },
            { en: `Slot: wait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030})).click();  After the second Confirm: wait.until(ExpectedConditions.urlContains("/confirmation")); then assert By.id("booking-id") and By.id("fee").`, mr: `Slot: wait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030})).click();  दुसऱ्या Confirm नंतर: wait.until(ExpectedConditions.urlContains("/confirmation")); मग By.id("booking-id") आणि By.id("fee") assert करा.` },
            { en: 'The fee text includes the rupee sign: "₹1200".', mr: 'fee च्या मजकुरात रुपयाचं चिन्ह आहे: "₹1200".' },
          ],
          successLine: { en: 'Huge hit! A wrong fee, a stuck button and a missing name rule would all turn this test red.', mr: 'जोरदार फटका! चुकीची fee, अडकलेलं बटण आणि गायब नावाचा नियम, तिन्ही ही test लाल करतील.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Hit 3. The booking part is written for you. Now follow the patient: click "My appointments" on the confirmation page (id go-appointments) and prove the new booking is listed. The row for it is tr.appt-row with data-id "CB-1001". Assert there is exactly one, and that its .doctor cell says "Dr. Arjun Shah".', mr: 'फटका 3. booking चा भाग तुमच्यासाठी लिहिलेला आहे. आता रुग्णाच्या मागे जा: confirmation page वर "My appointments" ला click करा (id go-appointments) आणि नवं booking यादीत आहे हे सिद्ध करा. त्याची row म्हणजे data-id "CB-1001" असलेली tr.appt-row. ती बरोबर एकच आहे, आणि तिच्या .doctor cell मध्ये "Dr. Arjun Shah" आहे असं assert करा.' },
          loggedIn: true,
          startUrl: 'https://carebridge.test/book',
          minAssertions: 1,
          noSleep: true,
          mustCatch: [
            { bug: 'appt-missing', label: { en: 'New booking missing from My appointments', mr: 'नवं booking My appointments मधून गायब' } },
          ],
          starter: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
new Select(driver.findElement(By.id("doctor"))).selectByVisibleText("Dr. Arjun Shah (Cardiology)");
driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
wait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030})).click();
driver.findElement(By.id("patient-name")).sendKeys("Asha Patil");
driver.findElement(By.id("terms")).click();
driver.findElement(By.id("confirm-btn")).click();
wait.until(ExpectedConditions.urlContains("/confirmation"));

// TODO 1: click the "My appointments" link (id go-appointments)
// TODO 2: find the rows tr.appt-row[data-id='CB-1001'] with findElements
// TODO 3: assert there is exactly 1, and its .doctor cell says "Dr. Arjun Shah"
`,
          solution: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
new Select(driver.findElement(By.id("doctor"))).selectByVisibleText("Dr. Arjun Shah (Cardiology)");
driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
wait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030})).click();
driver.findElement(By.id("patient-name")).sendKeys("Asha Patil");
driver.findElement(By.id("terms")).click();
driver.findElement(By.id("confirm-btn")).click();
wait.until(ExpectedConditions.urlContains("/confirmation"));

driver.findElement(By.id("go-appointments")).click();
List<WebElement> mine = driver.findElements(By.cssSelector("tr.appt-row[data-id='CB-1001']"));
Assert.assertEquals(mine.size(), 1, "new booking in My appointments");
Assert.assertEquals(mine.get(0).findElement(By.className("doctor")).getText(), "Dr. Arjun Shah");
`,
          hints: [
            { en: 'findElements never throws: it returns a list, maybe empty. List<WebElement> mine = driver.findElements(By.cssSelector("tr.appt-row[data-id=\'CB-1001\']"));', mr: 'findElements कधीच exception देत नाही: तो list देतो, कदाचित रिकामी. List<WebElement> mine = driver.findElements(By.cssSelector("tr.appt-row[data-id=\'CB-1001\']"));' },
            { en: 'Assert.assertEquals(mine.size(), 1);  then  Assert.assertEquals(mine.get(0).findElement(By.className("doctor")).getText(), "Dr. Arjun Shah");', mr: 'Assert.assertEquals(mine.size(), 1);  मग  Assert.assertEquals(mine.get(0).findElement(By.className("doctor")).getText(), "Dr. Arjun Shah");' },
            { en: 'The link is on the confirmation page: driver.findElement(By.id("go-appointments")).click();', mr: 'link confirmation page वर आहे: driver.findElement(By.id("go-appointments")).click();' },
          ],
          successLine: { en: 'Hit! If a booking vanishes from the list, the patient never shows up. Now you would know before they do.', mr: 'फटका! booking यादीतून गायब झालं तर रुग्ण येतच नाही. आता त्यांच्या आधी तुम्हाला कळेल.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Hit 4, bug hunt. This is tonight\'s real build. Someone says the 11:00 slot, which is already booked, can be booked again. Write the assertion that proves it: the 11:00 slot must not be enabled. Your test should FAIL here, on that assertion.', mr: 'फटका 4, bug hunt. हा आजचा खरा build आहे. कोणीतरी म्हणतंय की आधीच बुक असलेला 11:00 चा slot पुन्हा बुक करता येतो. ते सिद्ध करणारं assertion लिहा: 11:00 चा slot enabled असता कामा नये. तुमची test इथे, त्याच assertion वर, FAIL व्हायला हवी.' },
          loggedIn: true,
          startUrl: 'https://carebridge.test/book',
          build: ['double-book'],
          expectFailure: true,
          noSleep: true,
          starter: `driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".slot")));

WebElement taken = driver.findElement(By.cssSelector(".slot[data-time='11:00']"));
// TODO: 11:00 is already booked by another patient.
//       Assert that it cannot be clicked (isEnabled() should be false).
`,
          solution: `driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".slot")));

WebElement taken = driver.findElement(By.cssSelector(".slot[data-time='11:00']"));
Assert.assertFalse(taken.isEnabled(), "11:00 is already booked, it must be disabled");
`,
          hints: [
            { en: 'The slot still has the class "taken", so checking the class would pass. Check whether it can actually be clicked: taken.isEnabled().', mr: 'slot ला अजूनही "taken" class आहे, म्हणून class तपासला तर pass होईल. तो खरंच click करता येतो का ते तपासा: taken.isEnabled().' },
            { en: 'Assert.assertFalse(taken.isEnabled(), "11:00 is already booked, it must be disabled");', mr: 'Assert.assertFalse(taken.isEnabled(), "11:00 is already booked, it must be disabled");' },
          ],
          successLine: { en: 'Caught! "expected [false] but found [true]": two patients could land in the same 11:00 chair. That is a blocker.', mr: 'पकडलं! "expected [false] but found [true]": दोन रुग्ण 11:00 च्या एकाच खुर्चीत येऊ शकतात. हा blocker आहे.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Final hit. It is 1:40 am. Theo pushed a patch for every bug you found. Press Run to play your whole regression suite on the patched build, and read every line of the log. Go or no-go for the 2 am release?', mr: 'शेवटचा फटका. रात्रीचे 1:40. तुम्ही शोधलेल्या प्रत्येक bug साठी Theo ने patch टाकला. patched build वर तुमचा संपूर्ण regression suite चालवायला Run दाबा, आणि log ची प्रत्येक ओळ वाचा. रात्री 2 च्या release साठी go की no-go?' },
          seleniumSandbox: {
            startUrl: 'https://carebridge.test/login',
            code: `public class MidnightReleaseTest {
  WebDriver driver;
  WebDriverWait wait;

  @BeforeMethod
  public void logIn() {
    driver = new ChromeDriver();
    wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    driver.get("https://carebridge.test/login");
    driver.findElement(By.id("username")).sendKeys("asha");
    driver.findElement(By.id("password")).sendKeys("care123", Keys.ENTER);
    Assert.assertEquals(driver.findElement(By.className("welcome")).getText(), "Welcome, Asha Patil");
  }

  @AfterMethod
  public void tearDown() {
    driver.quit();
  }

  @Test(priority = 1)
  public void takenSlotIsDisabled() {
    driver.get("https://carebridge.test/book");
    driver.findElement(By.id("date")).sendKeys("2026-12-10");
    driver.findElement(By.id("check-slots")).click();
    wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".slot")));
    Assert.assertFalse(driver.findElement(By.cssSelector(".slot[data-time='11:00']")).isEnabled());
  }

  @Test(priority = 2)
  public void bookingChargesTheRightFee() {
    driver.get("https://carebridge.test/book");
    new Select(driver.findElement(By.id("doctor"))).selectByVisibleText("Dr. Arjun Shah (Cardiology)");
    driver.findElement(By.id("date")).sendKeys("2026-12-10");
    driver.findElement(By.id("check-slots")).click();
    wait.until(ExpectedConditions.elementToBeClickable(${SLOT_1030})).click();
    driver.findElement(By.id("terms")).click();
    driver.findElement(By.id("confirm-btn")).click();
    Assert.assertEquals(driver.findElement(By.id("form-error")).getText(), "Patient name is required");
    driver.findElement(By.id("patient-name")).sendKeys("Asha Patil");
    driver.findElement(By.id("confirm-btn")).click();
    wait.until(ExpectedConditions.urlContains("/confirmation"));
    Assert.assertEquals(driver.findElement(By.id("booking-id")).getText(), "CB-1001");
    Assert.assertEquals(driver.findElement(By.id("fee")).getText(), "₹1200");
    driver.findElement(By.id("go-appointments")).click();
    Assert.assertEquals(driver.findElements(By.cssSelector("tr.appt-row[data-id='CB-1001']")).size(), 1);
  }
}`,
          },
          options: [
            { en: 'Go: both tests passed on the patched build, including the checks that caught tonight\'s bugs', mr: 'Go: patched build वर दोन्ही tests pass झाल्या, आज रात्री bugs पकडणाऱ्या checks सकट' },
            { en: 'Go without running anything: Theo said it is fixed', mr: 'काहीही न चालवता Go: Theo म्हणाला दुरुस्त झालंय' },
            { en: 'No-go: a test that passes proves nothing', mr: 'No-go: pass होणारी test काहीच सिद्ध करत नाही' },
            { en: 'No-go: the suite has no Thread.sleep, so it cannot be trusted', mr: 'No-go: suite मध्ये Thread.sleep नाही, म्हणून त्यावर विश्वास ठेवता येत नाही' },
          ],
          correct: [0],
          explain: { en: 'The same assertions that turned red on the Gremlin\'s builds are green now: the taken slot is disabled, the empty name is refused, the fee is ₹1200 and the booking is listed. A green suite with meaningful checks is real evidence. Ship it.', mr: 'Gremlin च्या builds वर लाल झालेली तीच assertions आता हिरवी आहेत: बुक झालेला slot disabled आहे, रिकामं नाव नाकारलं जातं, fee ₹1200 आहे आणि booking यादीत आहे. अर्थपूर्ण checks असलेला हिरवा suite हा खरा पुरावा आहे. Ship करा.' },
          hints: [
            { en: 'Look for PASSED or FAILED next to each test name in the log.', mr: 'log मध्ये प्रत्येक test च्या नावापुढे PASSED की FAILED ते पाहा.' },
            { en: 'These are the exact checks that failed on the buggy builds. What does it mean when they pass now?', mr: 'bugs असलेल्या builds वर नेमक्या याच checks fail झाल्या होत्या. आता त्या pass होतात याचा अर्थ काय?' },
          ],
          successLine: { en: 'Final hit! Release approved with evidence, not hope.', mr: 'शेवटचा फटका! release मंजूर, आशेवर नाही तर पुराव्यावर.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'You just clicked "Confirm booking". Which line should come next, before you read #booking-id?', mr: 'तुम्ही आत्ताच "Confirm booking" ला click केलं. #booking-id वाचण्याआधी पुढची ओळ कोणती असावी?' },
        options: [
          { en: 'Thread.sleep(5000);', mr: 'Thread.sleep(5000);' },
          { en: 'wait.until(ExpectedConditions.urlContains("/confirmation"));', mr: 'wait.until(ExpectedConditions.urlContains("/confirmation"));' },
          { en: 'driver.navigate().refresh();', mr: 'driver.navigate().refresh();' },
          { en: 'Nothing, the confirmation page is already there', mr: 'काहीच नाही, confirmation page आधीच आलेलं असतं' },
        ],
        answer: 1,
        explain: { en: 'Saving takes about half a second. Wait for the URL (or for #booking-id to be visible), never a fixed sleep.', mr: 'save व्हायला साधारण अर्धा सेकंद लागतो. URL ची (किंवा #booking-id दिसण्याची) वाट पाहा, ठरावीक sleep कधीच नाही.' },
      },
      {
        q: { en: 'Why click Confirm once with an empty patient name in the boss test?', mr: 'बॉस test मध्ये रुग्णाचं नाव रिकामं ठेवून एकदा Confirm का दाबलं?' },
        options: [
          { en: 'To make the test faster', mr: 'test वेगवान करायला' },
          { en: 'Because the button needs two clicks', mr: 'कारण बटणाला दोन clicks लागतात' },
          { en: 'To reset the form', mr: 'form reset करायला' },
          { en: 'It is a negative check: it proves the app refuses a booking without a name', mr: 'हा negative check आहे: नावाशिवाय booking app नाकारतं हे तो सिद्ध करतो' },
        ],
        answer: 3,
        explain: { en: 'A happy path alone never notices a missing rule. Expecting "Patient name is required" catches the build where empty names slip through.', mr: 'फक्त happy path ला गायब नियम कधीच लक्षात येत नाही. "Patient name is required" अपेक्षित ठेवल्याने रिकामी नावं निसटणारा build पकडला जातो.' },
      },
      {
        q: { en: 'Your release suite fails with this line. What do you do?', mr: 'तुमचा release suite या ओळीने fail होतो. तुम्ही काय करता?' },
        code: 'java.lang.AssertionError: expected [₹1200] but found [₹1250]',
        options: [
          { en: 'Report a no-go: Dr. Arjun Shah\'s patients would be charged ₹50 extra', mr: 'no-go कळवा: Dr. Arjun Shah च्या रुग्णांकडून ₹50 जास्त घेतले जातील' },
          { en: 'Change the expected value to ₹1250 so the suite is green', mr: 'suite हिरवा व्हावा म्हणून expected value ₹1250 करा' },
          { en: 'Run it again until it passes', mr: 'pass होईपर्यंत पुन्हा पुन्हा चालवा' },
          { en: 'Delete the fee assertion, the page opened anyway', mr: 'fee चं assertion काढून टाका, page तर उघडलंच' },
        ],
        answer: 0,
        explain: { en: 'The doctor\'s fee is ₹1200. The test is right and the build is wrong. Report it with the expected and found values.', mr: 'डॉक्टरची fee ₹1200 आहे. test बरोबर आहे आणि build चुकीचा. expected आणि found values सोबत report करा.' },
      },
      {
        q: { en: 'Which check proves that booking CB-1001 really appears in My appointments?', mr: 'booking CB-1001 खरंच My appointments मध्ये दिसतं हे कोणती तपासणी सिद्ध करते?' },
        options: [
          { en: 'Assert.assertEquals(driver.getTitle(), "My appointments | CareBridge");', mr: 'Assert.assertEquals(driver.getTitle(), "My appointments | CareBridge");' },
          { en: 'Assert.assertTrue(driver.findElement(By.id("appointments")).isDisplayed());', mr: 'Assert.assertTrue(driver.findElement(By.id("appointments")).isDisplayed());' },
          { en: 'Assert.assertEquals(driver.findElements(By.cssSelector("tr.appt-row[data-id=\'CB-1001\']")).size(), 1);', mr: 'Assert.assertEquals(driver.findElements(By.cssSelector("tr.appt-row[data-id=\'CB-1001\']")).size(), 1);' },
          { en: 'driver.findElement(By.id("go-appointments")).click();', mr: 'driver.findElement(By.id("go-appointments")).click();' },
        ],
        answer: 2,
        explain: { en: 'The title and the table show up even when the new row is missing. Only counting the row with data-id CB-1001 proves the booking is listed.', mr: 'नवी row नसली तरी title आणि table दिसतातच. data-id CB-1001 असलेली row मोजल्यानेच booking यादीत आहे हे सिद्ध होतं.' },
      },
    ],
    recap: { line: { en: 'Walk the patient\'s path end to end, wait smart, assert the values that matter, add a negative check, and decide go / no-go on evidence.', mr: 'रुग्णाचा मार्ग सुरुवातीपासून शेवटपर्यंत चाला, हुशारीने वाट पाहा, महत्त्वाच्या values assert करा, एक negative check जोडा, आणि go / no-go पुराव्यावर ठरवा.' }, icon: '🌙' },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: '>> no. no no no. every gift unwrapped before midnight. ⌁⌁', mr: '>> नाही. नाही नाही नाही. मध्यरात्रीच्या आधीच प्रत्येक भेट उघडली. ⌁⌁' } },
      { who: 'gremlin', mood: 'smug', text: { en: '>> enjoy your green suite. next time i won\'t break the app. i\'ll make your tests flaky. green today, red tomorrow. ⌁', mr: '>> घे तुझा हिरवा suite. पुढच्या वेळी मी app तोडणार नाही. मी तुझ्या tests बेभरवशी करीन. आज हिरव्या, उद्या लाल. ⌁' } },
      { who: 'theo', mood: 'happy', text: { en: 'All patches are in and your suite is green. Release is live. It is 2:04 am, I am going to sleep.', mr: 'सगळे patches आले आणि तुमचा suite हिरवा आहे. release live झालं. रात्रीचे 2:04 वाजलेत, मी झोपायला चाललो.' } },
      { who: 'sam', mood: 'happy', text: { en: 'Not one wrong fee, not one double booking. The hospitals will never know how close it was. Thank you, {name}!', mr: 'एकही चुकीची fee नाही, एकही double booking नाही. किती थोडक्यात वाचलो हे हॉस्पिटल्सना कधीच कळणार नाही. धन्यवाद, {name}!' } },
      { who: 'meera', mood: 'happy', text: { en: 'Rank up, {name}: Junior SDET. Next stop, CareBridge Labs. Rex says it is time your tests grew up.', mr: 'नवीन रँक, {name}: Junior SDET. पुढचा थांबा CareBridge Labs. Rex म्हणतो आता तुमच्या tests नी मोठं व्हायची वेळ आली.' } },
    ],
  },
]
