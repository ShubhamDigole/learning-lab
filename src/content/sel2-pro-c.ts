import type { Lesson } from './types.ts'

// Selenium 2 at CareBridge Labs: flaky tests (S2.5) and the boss fight (S2.6).
// Every script runs against the CareBridge practice app (src/selenium/app.ts).

const BOOK_SLOW = `// Last night's booking test. Asha is already logged in.
driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
Thread.sleep(1000); // "the slots surely load in 1 second"
driver.findElement(By.cssSelector(".slot[data-time='10:30']")).click();
System.out.println("Slot 10:30 picked!");`

export const selProLessonsC: Lesson[] = [
  // ───────────────────────── S2.5 Flaky tests
  {
    id: 'se2-5',
    code: 'S2.5',
    level: 'intermediate',
    title: { en: 'Flaky Tests: Make Them Trustworthy', mr: 'Flaky Tests: त्यांना भरवशाचं बनवा' },
    skill: 'Fixing flaky tests',
    realLife: {
      place: 'market',
      title: { en: 'The scale nobody trusts', mr: 'कोणालाच भरवसा नसलेला तराजू' },
      story: {
        en: 'Every Sunday, Aai buys onions from Shinde mama at the mandai. One week she weighs the same 1 kg bag three times on his electronic scale: 1.00 kg, then 1.15 kg, then 0.87 kg. Same onions, same scale. Now even when it shows exactly 1.00, nobody believes it, and customers walk to the next stall. The scale is not always wrong. It is unpredictable, and that is just as useless. Shinde mama finds the cause: the scale sits on a wobbly table, right under the fan. He moves it to a steady spot away from the fan, and every morning he checks it with a standard 1 kg weight. Now one reading is enough, and people trust it again.',
        mr: 'दर रविवारी आई मंडईत शिंदे मामांकडून कांदे घेते. एका आठवड्यात तिने तीच 1 किलोची पिशवी त्यांच्या इलेक्ट्रॉनिक तराजूवर तीनदा तोलली: 1.00 किलो, मग 1.15 किलो, मग 0.87 किलो. कांदे तेच, तराजू तोच. आता तो अगदी 1.00 दाखवतो तेव्हाही कोणी विश्वास ठेवत नाही, आणि गिऱ्हाईक शेजारच्या गाळ्यावर जातात. तराजू नेहमी चुकतो असं नाही. तो बेभरवशाचा आहे, आणि तेही तितकंच निरुपयोगी. शिंदे मामा कारण शोधतात: तराजू एका डुगडुगणाऱ्या टेबलावर, अगदी पंख्याखाली ठेवलाय. ते तो पंख्यापासून दूर एका स्थिर जागी ठेवतात, आणि रोज सकाळी 1 किलोच्या प्रमाणित वजनाने तपासतात. आता एकच वाचन पुरतं, आणि लोकांचा पुन्हा भरवसा बसतो.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Same 1 kg of onions, weighed five times. Which readings are honest?', mr: 'तेच 1 किलो कांदे, पाच वेळा तोलले. कोणती वाचनं खरी?' },
        items: [
          { icon: '⚖️', label: '1.00 kg', mr: '1.00 किलो', pass: true },
          { icon: '⚖️', label: '1.15 kg', mr: '1.15 किलो', pass: false },
          { icon: '⚖️', label: '0.87 kg', mr: '0.87 किलो', pass: false },
          { icon: '⚖️', label: '1.00 kg', mr: '1.00 किलो', pass: true },
          { icon: '⚖️', label: '1.09 kg', mr: '1.09 किलो', pass: false },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'The nightly suite is red again. Is booking broken? Do we stop the release?', mr: 'nightly suite पुन्हा लाल आहे. booking बिघडलंय का? रिलीज थांबवायचं का?' } },
        { who: 'theo', mood: 'neutral', text: { en: 'Relax, it is the booking test again. Rerun it and it goes green. I ignore that one now.', mr: 'शांत हो, पुन्हा तीच booking test आहे. पुन्हा चालवली की हिरवी होते. मी आता तिच्याकडे दुर्लक्ष करतो.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'perfect. and the night my real bug arrives, you will ignore that red too.', mr: 'मस्त. आणि ज्या रात्री माझा खरा bug येईल, तेव्हाही तुम्ही त्या लाल रंगाकडे दुर्लक्ष कराल.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'A test that cries wolf is worse than no test. Today we find out why it flickers, {name}, and we fix the test. Not the rerun button.', mr: 'उगाच "लांडगा आला" ओरडणारी test असण्यापेक्षा test नसलेली बरी. {name}, आज आपण ती का डुगडुगते ते शोधू, आणि test दुरुस्त करू. rerun बटण नाही.' } },
      ],
      problem: { en: 'The booking test passes on some nights and fails on others, with the same code and the same app. The team reruns it until it goes green and has started ignoring red builds, so a real bug can hide among the false alarms.', mr: 'booking test काही रात्री pass होते आणि काही रात्री fail, code तोच आणि app तेच. टीम हिरवी होईपर्यंत ती पुन्हा चालवते आणि लाल builds कडे दुर्लक्ष करायला लागली आहे, त्यामुळे खोट्या धोक्याच्या घंटांमध्ये खरा bug लपू शकतो.' },
      solution: { en: 'Remove the causes of flakiness: replace fixed sleeps with explicit waits on the right condition, use stable locators, keep every test independent with its own fresh setup, and use SoftAssert to report several checks in one run.', mr: 'flaky पणाची कारणं काढून टाका: ठरलेल्या sleep ऐवजी योग्य condition वर explicit wait वापरा, स्थिर locators वापरा, प्रत्येक test स्वतःच्या ताज्या setup सह स्वतंत्र ठेवा, आणि एकाच run मध्ये अनेक checks कळवण्यासाठी SoftAssert वापरा.' },
    },
    lesson: [
      { en: 'A flaky test passes sometimes and fails sometimes, with no change in the code or the app. Like Shinde mama\'s scale, the real damage is trust. Once people learn that red can mean "nothing", they stop reading red, even on the day it means a real bug.', mr: 'flaky test कधी pass होते, कधी fail, code किंवा app मध्ये काहीही बदल न होता. शिंदे मामांच्या तराजूसारखंच, खरं नुकसान भरवशाचं होतं. लाल म्हणजे "काही नाही" असू शकतं हे लोकांना कळलं की ते लाल वाचणंच सोडतात, अगदी ज्या दिवशी तो खरा bug असतो त्या दिवशीसुद्धा.' },
      { en: 'The usual causes: a fixed Thread.sleep(1000) that guesses how long the page takes (on a slow night the guess is wrong). Fragile locators like /html/body/main/div[2]/p/span that break when someone adds one div. Tests that depend on each other or on leftover data, for example a cancel test that only passes if the booking test ran first.', mr: 'नेहमीची कारणं: ठरलेला Thread.sleep(1000), जो page ला किती वेळ लागेल याचा अंदाज बांधतो (एखाद्या संथ रात्री अंदाज चुकतो). /html/body/main/div[2]/p/span सारखे नाजूक locators, जे कोणी एक div जोडला तरी तुटतात. एकमेकांवर किंवा आधीच्या उरलेल्या data वर अवलंबून असलेल्या tests, उदाहरणार्थ booking test आधी चालली तरच pass होणारी cancel test.' },
      { en: 'The cures: wait for the exact thing you need with WebDriverWait (the slot is clickable, the URL contains /confirmation), so the test waits only as long as needed. Locate by id, name or a meaningful CSS like .slot[data-time=\'10:30\']. Give every test its own fresh setup: a new browser in @BeforeMethod, its own login, its own data. Then the order of tests does not matter.', mr: 'उपाय: तुम्हाला नेमकं जे हवं त्याची WebDriverWait ने वाट पाहा (slot clickable झाला, URL मध्ये /confirmation आलं), म्हणजे test लागेल तितकीच वाट पाहते. id, name किंवा .slot[data-time=\'10:30\'] सारख्या अर्थपूर्ण CSS ने element शोधा. प्रत्येक test ला स्वतःचा ताजा setup द्या: @BeforeMethod मध्ये नवा browser, स्वतःचं login, स्वतःचा data. मग tests कोणत्या क्रमाने चालतात याने फरक पडत नाही.' },
      { en: 'SoftAssert helps when one page has several facts to check. A normal Assert stops at the first failure, so you learn about one problem per run. SoftAssert notes every failed check and keeps going, and assertAll() at the end fails the test with the full list. The tester\'s rule: rerun a failure once to learn whether it is flaky, never to hide it.', mr: 'एका page वर अनेक गोष्टी तपासायच्या असतील तेव्हा SoftAssert मदत करतो. साधा Assert पहिल्याच failure ला थांबतो, म्हणून एका run मध्ये एकच problem कळतो. SoftAssert प्रत्येक fail झालेला check नोंदवतो आणि पुढे चालू राहतो, आणि शेवटी assertAll() पूर्ण यादीसह test fail करतो. टेस्टरचा नियम: failure flaky आहे का हे शिकण्यासाठी एकदा rerun करा, लपवण्यासाठी कधीच नाही.' },
    ],
    syntax: {
      template: `// 1. wait for the condition, not the clock
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".slot[data-time='10:30']"))).click();

// 2. a stable locator
driver.findElement(By.id("upcoming-count"));

// 3. soft checks, one full report
SoftAssert soft = new SoftAssert();
soft.assertEquals(actual, expected, "what you checked");
soft.assertAll();`,
      parts: [
        { code: 'new WebDriverWait(driver, Duration.ofSeconds(5))', means: { en: 'a waiter that tries again and again, for at most 5 seconds', mr: 'पुन्हा पुन्हा प्रयत्न करणारा waiter, जास्तीत जास्त 5 seconds' } },
        { code: 'ExpectedConditions.elementToBeClickable(...)', means: { en: 'the exact condition: the element is there, visible and enabled', mr: 'नेमकी condition: element आहे, दिसतो आणि enabled आहे' } },
        { code: 'By.id("upcoming-count")', means: { en: 'a stable locator: an id survives a redesign, a long path does not', mr: 'स्थिर locator: redesign नंतरही id टिकतो, लांबलचक path नाही' } },
        { code: 'new SoftAssert()', means: { en: 'a notebook of checks: failures are written down, the test keeps going', mr: 'checks ची वही: failures लिहून ठेवले जातात, test पुढे चालू राहते' } },
        { code: 'soft.assertEquals(actual, expected, "msg")', means: { en: 'one soft check, with a message that names it in the report', mr: 'एक soft check, report मध्ये त्याचं नाव सांगणाऱ्या message सह' } },
        { code: 'soft.assertAll()', means: { en: 'the end: fail now if any soft check failed, listing all of them', mr: 'शेवट: एखादा soft check fail झाला असेल तर आत्ता fail करा, सगळ्यांची यादी देऊन' } },
      ],
      example: [
        { code: 'Thread.sleep(1000);', note: { en: 'guessing the weight by eye: right only on some days', mr: 'डोळ्यांनी वजनाचा अंदाज: काही दिवसच बरोबर' } },
        { code: `wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".slot[data-time='10:30']")));`, note: { en: 'the steady table: waits exactly as long as the slots take, up to 5 seconds', mr: 'स्थिर टेबल: slots ला जितका वेळ लागेल तितकीच वाट, 5 seconds पर्यंत' } },
        { code: 'By.xpath("/html/body/main/div[2]/p/span")', note: { en: 'the wobbly table: one new div and it falls over', mr: 'डुगडुगणारं टेबल: एक नवा div आला की कोसळतं' } },
        { code: 'By.id("upcoming-count")', note: { en: 'the fixed spot away from the fan: still true after a redesign', mr: 'पंख्यापासून दूरची ठरलेली जागा: redesign नंतरही खरी' } },
        { code: 'soft.assertEquals(count, "2", "upcoming count");', note: { en: 'write every reading in the notebook, even the wrong ones', mr: 'प्रत्येक वाचन वहीत लिहा, चुकीचं असलं तरी' } },
        { code: 'soft.assertAll();', note: { en: 'show the whole notebook at the end of the day', mr: 'दिवसाच्या शेवटी पूर्ण वही दाखवा' } },
      ],
      pitfall: { en: 'Do not "fix" a flaky test by raising the sleep to Thread.sleep(5000) or by rerunning until green. A bigger sleep makes every run slower and still fails on an even slower night, and a rerun only hides the cause. And never forget soft.assertAll(): without it, SoftAssert writes the failures down and the test still passes.', mr: 'flaky test "दुरुस्त" करण्यासाठी sleep वाढवून Thread.sleep(5000) करू नका, किंवा हिरवी होईपर्यंत rerun करू नका. मोठ्या sleep ने प्रत्येक run संथ होतो आणि त्याहून संथ रात्री तरीही fail होतो, आणि rerun फक्त कारण लपवतो. आणि soft.assertAll() कधीच विसरू नका: त्याशिवाय SoftAssert failures लिहून ठेवतो आणि test तरीही pass होते.' },
    },
    practice: {
      intro: { en: 'Tonight\'s build has a twist: the time slots load after a random delay, sometimes fast and sometimes slow. That is exactly the kind of night that exposes a flaky test. Asha is already logged in.', mr: 'आजच्या build मध्ये एक गोम आहे: time slots कधी लवकर तर कधी उशिरा, random वेळाने येतात. flaky test उघडी पाडणारी हीच ती रात्र. Asha आधीच logged in आहे.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'This is last night\'s booking test, with a Thread.sleep(1000). Press Run four or five times and watch the browser and the log. Why does the same code pass on some runs and fail on others?', mr: 'ही कालची booking test आहे, Thread.sleep(1000) सह. Run चार पाच वेळा दाबा आणि browser आणि log पाहा. तोच code काही run मध्ये pass आणि काहींमध्ये fail का होतो?' },
          seleniumSandbox: { code: BOOK_SLOW, startUrl: 'https://carebridge.test/book', loggedIn: true, build: ['slots-random'] },
          options: [
            { en: 'Java runs the lines in a random order', mr: 'Java ओळी random क्रमाने चालवतो' },
            { en: 'The slots appear after a different delay each time. When they take longer than 1 second, the click looks for a slot that is not there yet', mr: 'slots प्रत्येक वेळी वेगळ्या वेळाने येतात. त्यांना 1 second पेक्षा जास्त वेळ लागला की click अजून न आलेला slot शोधतो' },
            { en: 'The locator .slot[data-time=\'10:30\'] is misspelled', mr: '.slot[data-time=\'10:30\'] हा locator चुकीचा लिहिलाय' },
            { en: 'The 10:30 slot is already taken by another patient', mr: '10:30 चा slot आधीच दुसऱ्या पेशंटने घेतलाय' },
          ],
          correct: [1],
          explain: { en: 'Thread.sleep(1000) is a guess. When the slots load in 0.6 seconds, the guess works and the test passes. When they take 1.8 seconds, findElement looks too early and throws NoSuchElementException. The code never changed, only the timing. That is a flaky test.', mr: 'Thread.sleep(1000) हा एक अंदाज आहे. slots 0.6 seconds मध्ये आले तर अंदाज बरोबर ठरतो आणि test pass होते. त्यांना 1.8 seconds लागले तर findElement खूप लवकर शोधतो आणि NoSuchElementException येतो. code कधीच बदलला नाही, फक्त वेळ बदलली. हीच flaky test.' },
          hints: [
            { en: 'Watch the "Checking availability..." text. Does it last the same time on every run?', mr: '"Checking availability..." हा मजकूर पाहा. तो प्रत्येक run मध्ये तितकाच वेळ राहतो का?' },
            { en: 'On a failing run, the red line is NoSuchElementException. The slot was not on the page yet.', mr: 'fail झालेल्या run मध्ये लाल ओळ NoSuchElementException असते. slot अजून page वर आलाच नव्हता.' },
            { en: 'The answer is about timing: the delay changes, the sleep does not.', mr: 'उत्तर वेळेबद्दल आहे: delay बदलतो, sleep बदलत नाही.' },
          ],
          successLine: { en: 'Same code, different timing, different result. Now let us remove the guess.', mr: 'code तोच, वेळ वेगळी, निकाल वेगळा. आता तो अंदाज काढून टाकू.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Make the booking test trustworthy on this random build. Replace BOTH Thread.sleep lines with explicit waits: wait until the 10:30 slot is clickable (and click it), and later wait until the URL contains "/confirmation". Keep the 5 second wait: slots that take longer than that are a real bug for patients. Run it a few times: it should pass every time.', mr: 'या random build वर booking test भरवशाची बनवा. दोन्ही Thread.sleep ओळींच्या जागी explicit waits वापरा: 10:30 चा slot clickable होईपर्यंत वाट पाहा (आणि त्यावर click करा), आणि नंतर URL मध्ये "/confirmation" येईपर्यंत वाट पाहा. 5 second चा wait तसाच ठेवा: त्याहून जास्त वेळ घेणारे slots हा पेशंटसाठी खरा bug आहे. काही वेळा Run करा: प्रत्येक वेळी pass व्हायला हवी.' },
          startUrl: 'https://carebridge.test/book',
          loggedIn: true,
          build: ['slots-random'],
          noSleep: true,
          minAssertions: 1,
          starter: `driver.get("https://carebridge.test/book");
driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));

// TODO: replace this guess with wait.until(...) for the 10:30 slot to be clickable
Thread.sleep(1000);
driver.findElement(By.cssSelector(".slot[data-time='10:30']")).click();

driver.findElement(By.id("patient-name")).sendKeys("Asha Patil");
driver.findElement(By.id("terms")).click();
driver.findElement(By.id("confirm-btn")).click();

// TODO: replace this guess with a wait until the URL contains "/confirmation"
Thread.sleep(1000);
Assert.assertEquals(driver.findElement(By.id("booking-id")).getText(), "CB-1001");`,
          solution: `driver.get("https://carebridge.test/book");
driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));

wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".slot[data-time='10:30']"))).click();

driver.findElement(By.id("patient-name")).sendKeys("Asha Patil");
driver.findElement(By.id("terms")).click();
driver.findElement(By.id("confirm-btn")).click();

wait.until(ExpectedConditions.urlContains("/confirmation"));
Assert.assertEquals(driver.findElement(By.id("booking-id")).getText(), "CB-1001");`,
          mustUse: [{ pattern: '\\.until\\(', message: { en: 'Use wait.until(...) with an ExpectedConditions condition, so the test waits for the page, not for the clock.', mr: 'ExpectedConditions च्या condition सह wait.until(...) वापरा, म्हणजे test घड्याळाची नाही तर page ची वाट पाहील.' } }],
          mustCatch: [{ bug: 'slots-slow', label: { en: 'Slots take 6 seconds to load (too slow for patients)', mr: 'slots यायला 6 seconds लागतात (पेशंटसाठी खूप संथ)' } }],
          hints: [
            { en: 'The wait object is already made. You only need wait.until(ExpectedConditions.something(By...)) in place of each sleep.', mr: 'wait object आधीच तयार आहे. प्रत्येक sleep च्या जागी फक्त wait.until(ExpectedConditions.something(By...)) हवं.' },
            { en: 'For the slot use elementToBeClickable. until(...) returns the element, so you can add .click() straight after it. For the page change use urlContains.', mr: 'slot साठी elementToBeClickable वापरा. until(...) element परत देतो, म्हणून लगेच पुढे .click() लावू शकता. page बदलासाठी urlContains वापरा.' },
            { en: `wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".slot[data-time='10:30']"))).click();`, mr: `wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".slot[data-time='10:30']"))).click();` },
            { en: 'wait.until(ExpectedConditions.urlContains("/confirmation"));', mr: 'wait.until(ExpectedConditions.urlContains("/confirmation"));' },
          ],
          successLine: { en: 'Fast slots or slow slots, it passes every time. And on the 6 second build it fails, because that slowness is a real bug.', mr: 'slots लवकर येवो वा उशिरा, test प्रत्येक वेळी pass. आणि 6 second च्या build वर ती fail होते, कारण तो संथपणा खरा bug आहे.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Theo moved the dashboard cards into a grid last sprint. Users see nothing different, but this old test now fails every night: its absolute XPath walks a path that no longer exists. Replace it with a stable locator. The number has id "upcoming-count".', mr: 'Theo ने मागच्या sprint मध्ये dashboard चे cards एका grid मध्ये हलवले. users ना काहीच फरक दिसत नाही, पण ही जुनी test आता रोज रात्री fail होते: तिचा absolute XPath आता अस्तित्वात नसलेल्या वाटेने जातो. त्याच्या जागी स्थिर locator वापरा. आकड्याचा id "upcoming-count" आहे.' },
          startUrl: 'https://carebridge.test/dashboard',
          loggedIn: true,
          minAssertions: 1,
          starter: `driver.get("https://carebridge.test/dashboard");

// Recorded before the redesign. It walks the page from the very top.
// TODO: replace it with a stable locator: the span has id="upcoming-count"
String count = driver.findElement(By.xpath("/html/body/main/div[2]/p/span")).getText();

Assert.assertEquals(count, "2", "upcoming appointments");`,
          solution: `driver.get("https://carebridge.test/dashboard");

String count = driver.findElement(By.id("upcoming-count")).getText();

Assert.assertEquals(count, "2", "upcoming appointments");`,
          mustNotUse: [{ pattern: '"/html|By\\.xpath\\("/(?!/)', message: { en: 'It works today, but it still uses an absolute XPath that starts at the top of the page. One new div and it breaks again. Use By.id("upcoming-count").', mr: 'आज चालतं, पण अजूनही page च्या अगदी वरून सुरू होणारा absolute XPath वापरलाय. एक नवा div आला की पुन्हा तुटेल. By.id("upcoming-count") वापरा.' } }],
          hints: [
            { en: 'An absolute XPath like /html/body/main/div[2]/... depends on every box above the element. Ids do not care about layout.', mr: '/html/body/main/div[2]/... सारखा absolute XPath element च्या वरच्या प्रत्येक box वर अवलंबून असतो. id ला layout ची पर्वा नसते.' },
            { en: 'Swap only the locator inside findElement(...). Keep getText() and the assertion.', mr: 'findElement(...) मधला फक्त locator बदला. getText() आणि assertion तसंच ठेवा.' },
            { en: 'String count = driver.findElement(By.id("upcoming-count")).getText();', mr: 'String count = driver.findElement(By.id("upcoming-count")).getText();' },
          ],
          successLine: { en: 'Green again, and this time it will survive the next redesign. That red was a test bug, not an app bug.', mr: 'पुन्हा हिरवी, आणि या वेळी पुढच्या redesign मध्येही टिकेल. तो लाल रंग test चा bug होता, app चा नाही.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Check three facts on the dashboard in one run with SoftAssert: the title is "Dashboard | CareBridge" (done for you), the welcome text (class "welcome") is "Welcome, Asha Patil", and the upcoming count (id "upcoming-count") is "2". Finish with assertAll() so every failure is reported together.', mr: 'SoftAssert ने एकाच run मध्ये dashboard वरच्या तीन गोष्टी तपासा: title "Dashboard | CareBridge" आहे (हे केलेलं आहे), welcome मजकूर (class "welcome") "Welcome, Asha Patil" आहे, आणि upcoming count (id "upcoming-count") "2" आहे. शेवटी assertAll() लावा, म्हणजे सगळे failures एकत्र कळतील.' },
          startUrl: 'https://carebridge.test/dashboard',
          loggedIn: true,
          minAssertions: 3,
          starter: `driver.get("https://carebridge.test/dashboard");
SoftAssert soft = new SoftAssert();

soft.assertEquals(driver.getTitle(), "Dashboard | CareBridge", "title");
// TODO: soft check: the welcome text (class "welcome") is "Welcome, Asha Patil"
// TODO: soft check: the upcoming count (id "upcoming-count") is "2"
// TODO: report every soft check at the end`,
          solution: `driver.get("https://carebridge.test/dashboard");
SoftAssert soft = new SoftAssert();

soft.assertEquals(driver.getTitle(), "Dashboard | CareBridge", "title");
soft.assertEquals(driver.findElement(By.className("welcome")).getText(), "Welcome, Asha Patil", "welcome");
soft.assertEquals(driver.findElement(By.id("upcoming-count")).getText(), "2", "upcoming count");
soft.assertAll();`,
          mustUse: [
            { pattern: 'new\\s+SoftAssert\\s*\\(', message: { en: 'Use a SoftAssert (new SoftAssert()) for these checks.', mr: 'या checks साठी SoftAssert (new SoftAssert()) वापरा.' } },
            { pattern: '\\.assertAll\\s*\\(', message: { en: 'Add soft.assertAll() at the end. Without it, failed soft checks are written down and the test still passes.', mr: 'शेवटी soft.assertAll() जोडा. त्याशिवाय fail झालेले soft checks फक्त लिहून ठेवले जातात आणि test तरीही pass होते.' } },
          ],
          mustCatch: [{ bug: 'welcome-name', label: { en: 'Dashboard says "Welcome, undefined"', mr: 'Dashboard वर "Welcome, undefined" दिसतं' } }],
          hints: [
            { en: 'Copy the title line and change two things: what you read and what you expect.', mr: 'title ची ओळ copy करा आणि दोन गोष्टी बदला: काय वाचता आणि काय अपेक्षित आहे.' },
            { en: 'Read the welcome text with driver.findElement(By.className("welcome")).getText(). The last line is soft.assertAll();', mr: 'welcome मजकूर driver.findElement(By.className("welcome")).getText() ने वाचा. शेवटची ओळ soft.assertAll(); आहे.' },
            { en: 'soft.assertEquals(driver.findElement(By.className("welcome")).getText(), "Welcome, Asha Patil", "welcome");', mr: 'soft.assertEquals(driver.findElement(By.className("welcome")).getText(), "Welcome, Asha Patil", "welcome");' },
            { en: 'soft.assertEquals(driver.findElement(By.id("upcoming-count")).getText(), "2", "upcoming count");\nsoft.assertAll();', mr: 'soft.assertEquals(driver.findElement(By.id("upcoming-count")).getText(), "2", "upcoming count");\nsoft.assertAll();' },
          ],
          successLine: { en: 'Three facts, one run, one full report. On the "Welcome, undefined" build, assertAll names the exact check that broke.', mr: 'तीन गोष्टी, एक run, एक पूर्ण report. "Welcome, undefined" च्या build वर assertAll नेमका कोणता check तुटला ते सांगतो.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What makes a test "flaky"?', mr: 'test "flaky" कशामुळे ठरते?' },
        options: [
          { en: 'It fails every single time', mr: 'ती प्रत्येक वेळी fail होते' },
          { en: 'It passes sometimes and fails sometimes, with no change in the code or the app', mr: 'code किंवा app मध्ये बदल न होता ती कधी pass तर कधी fail होते' },
          { en: 'It takes more than a minute to run', mr: 'ती चालायला एका मिनिटापेक्षा जास्त वेळ घेते' },
          { en: 'It has no assertions', mr: 'तिच्यात एकही assertion नाही' },
        ],
        answer: 1,
        explain: { en: 'Flaky means unpredictable, like the scale. A test that fails every time is consistent: it points at a real bug or a test bug.', mr: 'flaky म्हणजे बेभरवशाची, त्या तराजूसारखी. प्रत्येक वेळी fail होणारी test सुसंगत असते: ती खऱ्या bug कडे किंवा test च्या bug कडे बोट दाखवते.' },
      },
      {
        q: { en: 'This test fails on 2 nights out of 10. What is the best fix?', mr: 'ही test 10 पैकी 2 रात्री fail होते. सगळ्यात चांगला उपाय कोणता?' },
        code: `driver.findElement(By.id("check-slots")).click();
Thread.sleep(2000);
driver.findElement(By.cssSelector(".slot[data-time='10:30']")).click();`,
        options: [
          { en: 'Change it to Thread.sleep(5000)', mr: 'तो Thread.sleep(5000) करा' },
          { en: 'Rerun it until it goes green', mr: 'हिरवी होईपर्यंत rerun करा' },
          { en: 'Delete the test', mr: 'test delete करा' },
          { en: 'Replace the sleep with wait.until(ExpectedConditions.elementToBeClickable(...)) for the slot', mr: 'sleep च्या जागी slot साठी wait.until(ExpectedConditions.elementToBeClickable(...)) वापरा' },
        ],
        answer: 3,
        explain: { en: 'An explicit wait checks again and again and moves on the moment the slot is clickable. A bigger sleep is slower and still a guess. Rerunning hides the cause.', mr: 'explicit wait पुन्हा पुन्हा तपासतो आणि slot clickable होताच पुढे जातो. मोठा sleep जास्त संथ आणि तरीही अंदाजच. rerun कारण लपवतो.' },
      },
      {
        q: { en: 'On a buggy build, the first two soft checks fail. What happens?', mr: 'एका buggy build वर पहिले दोन soft checks fail होतात. काय होतं?' },
        code: `SoftAssert soft = new SoftAssert();
soft.assertEquals(fee, "₹500", "fee");
soft.assertEquals(patient, "Asha Patil", "patient");
soft.assertEquals(title, "Booking confirmed | CareBridge", "title");
soft.assertAll();`,
        options: [
          { en: 'All three checks run, then assertAll() fails the test and lists both failures', mr: 'तिन्ही checks चालतात, मग assertAll() test fail करतो आणि दोन्ही failures ची यादी देतो' },
          { en: 'The test stops at the fee check', mr: 'test fee च्या check वरच थांबते' },
          { en: 'The test passes, because soft checks never fail a test', mr: 'test pass होते, कारण soft checks कधीच test fail करत नाहीत' },
          { en: 'Only the last failure is reported', mr: 'फक्त शेवटचा failure कळवला जातो' },
        ],
        answer: 0,
        explain: { en: 'SoftAssert keeps going and writes down every failure. assertAll() then fails the test with the full list: fee and patient.', mr: 'SoftAssert पुढे चालू राहतो आणि प्रत्येक failure लिहून ठेवतो. मग assertAll() पूर्ण यादीसह test fail करतो: fee आणि patient.' },
      },
      {
        q: { en: 'cancelBooking passes only when bookSlot runs first, because it cancels the booking CB-1001 that bookSlot created. What is wrong?', mr: 'cancelBooking फक्त bookSlot आधी चालली तरच pass होते, कारण ती bookSlot ने तयार केलेलं CB-1001 booking cancel करते. काय चुकलंय?' },
        options: [
          { en: 'cancelBooking needs a longer Thread.sleep', mr: 'cancelBooking ला जास्त मोठा Thread.sleep हवा' },
          { en: 'Nothing: tests always run in the same order', mr: 'काहीच नाही: tests नेहमी त्याच क्रमाने चालतात' },
          { en: 'cancelBooking depends on another test\'s leftover data. It should create or pick its own appointment in its own setup', mr: 'cancelBooking दुसऱ्या test च्या उरलेल्या data वर अवलंबून आहे. तिने स्वतःच्या setup मध्ये स्वतःची appointment तयार करावी किंवा निवडावी' },
          { en: 'bookSlot should be deleted', mr: 'bookSlot delete करावी' },
        ],
        answer: 2,
        explain: { en: 'Tests that lean on each other break when one is skipped, renamed or run alone. Each test should set up everything it needs.', mr: 'एकमेकांवर टेकलेल्या tests, एखादी skip झाली, नाव बदललं किंवा एकटी चालवली की तुटतात. प्रत्येक test ने तिला लागणारं सगळं स्वतः तयार करावं.' },
      },
    ],
    recap: { line: { en: 'Flaky tests kill trust. Wait for conditions, not clocks. Use stable locators. Keep tests independent. Use SoftAssert to see every failure at once.', mr: 'flaky tests भरवसा मारतात. घड्याळाची नाही, condition ची वाट पाहा. स्थिर locators वापरा. tests स्वतंत्र ठेवा. सगळे failures एकदम पाहण्यासाठी SoftAssert वापरा.' }, icon: '⚖️' },
  },

  // ───────────────────────── S2.6 Boss: the flaky suite
  {
    id: 'se2-6',
    code: 'S2.6',
    level: 'intermediate',
    isBoss: true,
    title: { en: 'Boss: The Flaky Suite', mr: 'Boss: बेभरवशाचा Suite' },
    skill: 'Trusted end-to-end suite',
    realLife: {
      place: 'home',
      title: { en: 'The society fire alarm', mr: 'सोसायटीचा फायर अलार्म' },
      story: {
        en: 'In Sai Krupa society, the fire alarm rang almost every evening. Sometimes the corridor sensor was faulty and rang for nothing. Sometimes it was the alarm fitted right above Joshi kaku\'s kitchen, so every tadka set it off. Soon nobody came out when it rang. Then one night there was real smoke from the meter room, and people ignored it for ten long minutes. The new secretary, Kulkarni sir, sorted every ring into three boxes: real smoke, faulty sensor, alarm in the wrong place. He replaced the faulty sensor and moved the kitchen alarm. Now when it rings, everyone runs.',
        mr: 'साई कृपा सोसायटीत फायर अलार्म जवळजवळ रोज संध्याकाळी वाजायचा. कधी कॉरिडॉरचा sensor खराब असायचा आणि उगाच वाजायचा. कधी जोशी काकूंच्या स्वयंपाकघराच्या अगदी वर बसवलेला अलार्म असायचा, त्यामुळे प्रत्येक फोडणीला तो वाजायचा. लवकरच तो वाजला तरी कोणी बाहेर यायचं नाही. मग एका रात्री मीटर रूममधून खरा धूर आला, आणि लोकांनी दहा मिनिटं दुर्लक्ष केलं. नवे सेक्रेटरी कुलकर्णी सरांनी प्रत्येक वाजणं तीन खोक्यांत विभागलं: खरा धूर, खराब sensor, चुकीच्या जागी बसवलेला अलार्म. त्यांनी खराब sensor बदलला आणि स्वयंपाकघरातला अलार्म हलवला. आता तो वाजला की सगळे धावतात.',
      },
      scene: {
        type: 'group',
        groups: [
          { icon: '🔥', label: 'Real smoke (real bug)', mr: 'खरा धूर (खरा bug)' },
          { icon: '🎲', label: 'Faulty sensor (flaky test)', mr: 'खराब sensor (flaky test)' },
          { icon: '🍳', label: 'Alarm in the wrong place (test bug)', mr: 'चुकीच्या जागी अलार्म (test bug)' },
        ],
        items: [
          { icon: '🔔', group: 1 },
          { icon: '🔔', group: 2 },
          { icon: '🔔', group: 1 },
          { icon: '🚨', group: 0 },
          { icon: '🔔', group: 2 },
          { icon: '🔔', group: 1 },
        ],
        note: { en: 'Only one ring was a real fire. Sort the rest, fix them, and the alarm is worth listening to again.', mr: 'फक्त एकदाच खरी आग होती. बाकीचे विभागा, दुरुस्त करा, आणि अलार्म पुन्हा ऐकण्यासारखा होतो.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'gremlin', mood: 'smug', text: { en: 'i sprinkled a little randomness into your nightly suite. red every night. somewhere in that red are my real bugs. good luck finding them.', mr: 'मी तुमच्या nightly suite मध्ये थोडी randomness शिंपडली. रोज रात्री लाल. त्या लाल रंगात कुठेतरी माझे खरे bugs आहेत. शोधा बघू.' } },
        { who: 'sam', mood: 'worried', text: { en: 'The team stopped reading the red builds weeks ago. Release is on Friday. I need one answer: is booking safe or not?', mr: 'टीमने आठवड्यांपूर्वीच लाल builds वाचणं सोडलं. रिलीज शुक्रवारी आहे. मला एकच उत्तर हवं: booking सुरक्षित आहे की नाही?' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Then we rebuild trust. A page object, data-driven checks, explicit waits, real assertions, and every failure triaged: real bug, flaky test or test bug.', mr: 'मग आपण भरवसा पुन्हा उभा करू. page object, data-driven checks, explicit waits, खरे assertions, आणि प्रत्येक failure ची वर्गवारी: खरा bug, flaky test की test bug.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Your boss fight, {name}. Make this suite something people believe again.', mr: '{name}, ही तुमची boss fight. हा suite पुन्हा लोकांना विश्वास वाटेल असा बनवा.' } },
      ],
      problem: { en: 'The nightly suite is red every night with a mix of flaky tests and real bugs. Nobody trusts it, so real bugs like wrong fees, missing appointments and double bookings can slip into Friday\'s release.', mr: 'nightly suite रोज रात्री flaky tests आणि खऱ्या bugs च्या मिश्रणाने लाल असतो. कोणालाच त्याचा भरवसा नाही, त्यामुळे चुकीची fee, गायब appointments आणि double booking सारखे खरे bugs शुक्रवारच्या रिलीजमध्ये घुसू शकतात.' },
      solution: { en: 'Rebuild the suite with everything from Selenium 2: a page object for login, a data-driven check over doctors, a robust end-to-end booking with explicit waits and meaningful assertions, proper alert handling, and a clear triage of every failure.', mr: 'Selenium 2 मधलं सगळं वापरून suite पुन्हा बांधा: login साठी page object, doctors वर data-driven check, explicit waits आणि अर्थपूर्ण assertions सह मजबूत end-to-end booking, alert ची योग्य हाताळणी, आणि प्रत्येक failure ची स्पष्ट वर्गवारी.' },
    },
    lesson: [
      { en: 'A trusted suite has three habits. It passes every time on a good build. It fails every time on a broken build. And when it fails, the message says exactly what broke, like "expected [₹1200] but found [₹1250]".', mr: 'भरवशाच्या suite च्या तीन सवयी असतात. चांगल्या build वर तो प्रत्येक वेळी pass होतो. बिघडलेल्या build वर प्रत्येक वेळी fail होतो. आणि fail झाला की message नेमकं काय तुटलं ते सांगतो, जसं "expected [₹1200] but found [₹1250]".' },
      { en: 'Page objects keep locators in one place, so a redesign means one fix instead of fifty. A DataProvider or a loop covers many doctors with one test, and each row is reported on its own.', mr: 'page objects locators एकाच जागी ठेवतात, म्हणून redesign झालं तर पन्नास ऐवजी एकच दुरुस्ती. DataProvider किंवा loop एकाच test ने अनेक doctors तपासतो, आणि प्रत्येक row चा निकाल वेगळा कळतो.' },
      { en: 'Explicit waits make timing stop mattering. Assertions on the facts patients care about (the fee, the taken slot being disabled, the new row in My appointments) turn hidden bugs into red lines with proof.', mr: 'explicit waits मुळे वेळेचा प्रश्नच उरत नाही. पेशंटला महत्त्वाच्या गोष्टींवरचे assertions (fee, घेतलेला slot disabled असणं, My appointments मधली नवी row) लपलेल्या bugs ना पुराव्यासह लाल ओळींत बदलतात.' },
      { en: 'Triage every failure. Real bug: the app is wrong, it fails every run, and the assertion shows the wrong value. Flaky test: it passes sometimes, usually timing or shared data. Test bug: the test itself is wrong, like an old locator or a wrong expected value, while the app is fine.', mr: 'प्रत्येक failure ची वर्गवारी करा. खरा bug: app चुकतंय, प्रत्येक run मध्ये fail होतं, आणि assertion चुकीची value दाखवतो. flaky test: कधी कधी pass होते, बहुतेक वेळेमुळे किंवा shared data मुळे. test bug: test च चुकीची आहे, जसं जुना locator किंवा चुकीची expected value, app मात्र ठीक आहे.' },
    ],
    syntax: {
      template: `class LoginPage {
  WebDriver driver;
  public LoginPage(WebDriver driver) { this.driver = driver; }
  public void loginAs(String user, String pass) { ... }
}

@DataProvider(name = "doctors")
public Object[][] doctors() { return new Object[][] { {"meera", "500"} }; }

wait.until(ExpectedConditions.elementToBeClickable(By.id("confirm-btn"))).click();
Alert alert = wait.until(ExpectedConditions.alertIsPresent());`,
      parts: [
        { code: 'class LoginPage { ... }', means: { en: 'a page object: the login page\'s locators and actions in one place', mr: 'page object: login page चे locators आणि actions एकाच जागी' } },
        { code: '@DataProvider(name = "doctors")', means: { en: 'the rows of test data: one test runs once per row', mr: 'test data च्या rows: एक test प्रत्येक row साठी एकदा चालते' } },
        { code: 'elementToBeClickable(By.id("confirm-btn"))', means: { en: 'wait until Confirm is really usable, then click it', mr: 'Confirm खरंच वापरता येईपर्यंत वाट पाहा, मग click करा' } },
        { code: 'ExpectedConditions.alertIsPresent()', means: { en: 'wait for the browser alert and get hold of it', mr: 'browser alert ची वाट पाहा आणि तो हातात घ्या' } },
      ],
      example: [
        { code: 'login.loginAs("asha", "care123");', note: { en: 'one line in the test, the details live in the page object', mr: 'test मध्ये एक ओळ, तपशील page object मध्ये' } },
        { code: '{"meera", "500"}, {"arjun", "1200"}, {"neha", "700"}', note: { en: 'three doctors, one test, three separate results', mr: 'तीन doctors, एक test, तीन वेगळे निकाल' } },
        { code: `Assert.assertFalse(driver.findElement(By.cssSelector(".slot[data-time='11:00']")).isEnabled());`, note: { en: 'the taken slot must stay locked: this catches double booking', mr: 'घेतलेला slot बंदच राहायला हवा: हे double booking पकडतं' } },
        { code: 'Assert.assertEquals(driver.findElement(By.id("fee")).getText(), "₹1200");', note: { en: 'the real smoke: a wrong fee fails every single run', mr: 'खरा धूर: चुकीची fee प्रत्येक run मध्ये fail होते' } },
        { code: 'alert.accept();', note: { en: 'answer the alert before touching the page again', mr: 'page ला पुन्हा हात लावण्याआधी alert ला उत्तर द्या' } },
      ],
      pitfall: { en: 'Do not mark a red test "flaky" just because a rerun went green. First read the failure: an assertion with a wrong value that repeats every run is a real bug, even if it is annoying. Calling a real bug flaky is exactly how the gremlin wins.', mr: 'rerun मध्ये हिरवी झाली म्हणून एखादी लाल test "flaky" ठरवू नका. आधी failure वाचा: प्रत्येक run मध्ये पुन्हा येणारा, चुकीची value दाखवणारा assertion हा खरा bug आहे, कितीही त्रासदायक असला तरी. खऱ्या bug ला flaky म्हणणं हाच ग्रेमलिनचा विजय.' },
    },
    practice: {
      intro: { en: 'Five fixes stand between you and a suite people trust. Each script is graded on the good build and then re-run on the gremlin\'s buggy builds: a trustworthy test passes on the first and fails on every one of the others.', mr: 'तुमच्या आणि लोकांना भरवसा वाटणाऱ्या suite मध्ये पाच दुरुस्त्या उरल्यात. प्रत्येक script आधी चांगल्या build वर तपासली जाते आणि मग ग्रेमलिनच्या buggy builds वर पुन्हा चालवली जाते: भरवशाची test पहिल्यावर pass होते आणि बाकी प्रत्येकावर fail.' },
      steps: [
        {
          kind: 'selenium',
          prompt: { en: 'Step 1, a page object. Finish loginAs in the LoginPage class: type the user into "username", the password into "password", and click "login-btn". The test below it already uses the page object and checks the dashboard.', mr: 'पायरी 1, page object. LoginPage class मधली loginAs पूर्ण करा: user "username" मध्ये, password "password" मध्ये टाइप करा, आणि "login-btn" वर click करा. खालची test आधीच page object वापरते आणि dashboard तपासते.' },
          startUrl: 'https://carebridge.test/',
          minAssertions: 2,
          starter: `class LoginPage {
  WebDriver driver;

  public LoginPage(WebDriver driver) {
    this.driver = driver;
  }

  public void open() {
    driver.get("https://carebridge.test/login");
  }

  public void loginAs(String user, String pass) {
    // TODO: type user into id "username"
    // TODO: type pass into id "password"
    // TODO: click id "login-btn"
  }
}

LoginPage login = new LoginPage(driver);
login.open();
login.loginAs("asha", "care123");
Assert.assertEquals(driver.getTitle(), "Dashboard | CareBridge");
Assert.assertEquals(driver.findElement(By.className("welcome")).getText(), "Welcome, Asha Patil");`,
          solution: `class LoginPage {
  WebDriver driver;

  public LoginPage(WebDriver driver) {
    this.driver = driver;
  }

  public void open() {
    driver.get("https://carebridge.test/login");
  }

  public void loginAs(String user, String pass) {
    driver.findElement(By.id("username")).sendKeys(user);
    driver.findElement(By.id("password")).sendKeys(pass);
    driver.findElement(By.id("login-btn")).click();
  }
}

LoginPage login = new LoginPage(driver);
login.open();
login.loginAs("asha", "care123");
Assert.assertEquals(driver.getTitle(), "Dashboard | CareBridge");
Assert.assertEquals(driver.findElement(By.className("welcome")).getText(), "Welcome, Asha Patil");`,
          mustUse: [{ pattern: 'class\\s+LoginPage', message: { en: 'Keep the LoginPage class: the test should log in through the page object.', mr: 'LoginPage class ठेवा: test ने page object मधूनच login करायला हवं.' } }],
          mustCatch: [{ bug: 'welcome-name', label: { en: 'Dashboard says "Welcome, undefined"', mr: 'Dashboard वर "Welcome, undefined" दिसतं' } }],
          hints: [
            { en: 'Inside loginAs, use the method\'s own inputs: sendKeys(user) and sendKeys(pass), not fixed text.', mr: 'loginAs च्या आत method चे स्वतःचे inputs वापरा: sendKeys(user) आणि sendKeys(pass), ठरलेला मजकूर नाही.' },
            { en: 'driver.findElement(By.id("username")).sendKeys(user);\ndriver.findElement(By.id("password")).sendKeys(pass);\ndriver.findElement(By.id("login-btn")).click();', mr: 'driver.findElement(By.id("username")).sendKeys(user);\ndriver.findElement(By.id("password")).sendKeys(pass);\ndriver.findElement(By.id("login-btn")).click();' },
            { en: 'The page object has its own driver field, set in the constructor. Use driver.findElement inside the class.', mr: 'page object चं स्वतःचं driver field आहे, constructor मध्ये set होतं. class च्या आत driver.findElement वापरा.' },
          ],
          successLine: { en: 'Login lives in one place now. If the button id ever changes, one fix repairs every test.', mr: 'login आता एकाच जागी राहतं. बटणाचा id कधी बदलला तर एका दुरुस्तीने प्रत्येक test ठीक होते.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Step 2, data-driven. Patients often type names in small letters. Add the rows {"arjun", "1200"} and {"neha", "700"} to the DataProvider, then in the test assert that the result count is "1 doctor found" and that the row\'s fee cell (class "fee") shows the fee.', mr: 'पायरी 2, data-driven. पेशंट बऱ्याचदा नावं लहान अक्षरांत टाइप करतात. DataProvider मध्ये {"arjun", "1200"} आणि {"neha", "700"} या rows जोडा, आणि test मध्ये assert करा की result count "1 doctor found" आहे आणि row च्या fee cell (class "fee") मध्ये ती fee दिसते.' },
          startUrl: 'https://carebridge.test/doctors',
          minAssertions: 6,
          starter: `public class DoctorFeeTest {
  WebDriver driver;

  @BeforeMethod
  public void setUp() {
    driver = new ChromeDriver();
    driver.get("https://carebridge.test/doctors");
  }

  @AfterMethod
  public void tearDown() {
    driver.quit();
  }

  @DataProvider(name = "doctors")
  public Object[][] doctors() {
    // TODO: add {"arjun", "1200"} and {"neha", "700"}
    return new Object[][] { {"meera", "500"} };
  }

  @Test(dataProvider = "doctors")
  public void feeIsRight(String search, String fee) {
    driver.findElement(By.id("search")).sendKeys(search);
    // TODO: assert the text of id "result-count" is "1 doctor found"
    // TODO: assert the text of the cell with class "fee" equals fee
  }
}`,
          solution: `public class DoctorFeeTest {
  WebDriver driver;

  @BeforeMethod
  public void setUp() {
    driver = new ChromeDriver();
    driver.get("https://carebridge.test/doctors");
  }

  @AfterMethod
  public void tearDown() {
    driver.quit();
  }

  @DataProvider(name = "doctors")
  public Object[][] doctors() {
    return new Object[][] { {"meera", "500"}, {"arjun", "1200"}, {"neha", "700"} };
  }

  @Test(dataProvider = "doctors")
  public void feeIsRight(String search, String fee) {
    driver.findElement(By.id("search")).sendKeys(search);
    Assert.assertEquals(driver.findElement(By.id("result-count")).getText(), "1 doctor found");
    Assert.assertEquals(driver.findElement(By.cssSelector("tr.doctor-row .fee")).getText(), fee);
  }
}`,
          mustUse: [{ pattern: '@DataProvider', message: { en: 'Keep the @DataProvider: one test, many rows of data.', mr: '@DataProvider ठेवा: एक test, data च्या अनेक rows.' } }],
          mustCatch: [{ bug: 'search-case', label: { en: 'Search only works with capital letters', mr: 'search फक्त capital अक्षरांनीच चालतो' } }],
          hints: [
            { en: 'Rows go inside the braces, separated by commas: { {"meera", "500"}, {"arjun", "1200"}, {"neha", "700"} }', mr: 'rows कंसात, स्वल्पविरामाने वेगळ्या: { {"meera", "500"}, {"arjun", "1200"}, {"neha", "700"} }' },
            { en: 'Compare with the method\'s fee parameter, not with a fixed "500": Assert.assertEquals(..., fee);', mr: 'ठरलेल्या "500" शी नाही, method च्या fee parameter शी तुलना करा: Assert.assertEquals(..., fee);' },
            { en: 'Assert.assertEquals(driver.findElement(By.id("result-count")).getText(), "1 doctor found");', mr: 'Assert.assertEquals(driver.findElement(By.id("result-count")).getText(), "1 doctor found");' },
            { en: 'Assert.assertEquals(driver.findElement(By.cssSelector("tr.doctor-row .fee")).getText(), fee);', mr: 'Assert.assertEquals(driver.findElement(By.cssSelector("tr.doctor-row .fee")).getText(), fee);' },
          ],
          successLine: { en: 'Three doctors, three green rows, each in a fresh browser. And the small-letter search bug has nowhere to hide.', mr: 'तीन doctors, तीन हिरव्या rows, प्रत्येक ताज्या browser मध्ये. आणि लहान अक्षरांच्या search bug ला लपायला जागाच नाही.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Step 3, the big one: a robust booking with Dr. Arjun Shah. No Thread.sleep. Wait for the 10:30 slot, assert that the taken 11:00 slot is NOT enabled, wait until Confirm is clickable, then on the confirmation page assert the fee is "₹1200". Finally open My appointments and assert the new booking\'s row is there. Four of the gremlin\'s bugs must turn this test red.', mr: 'पायरी 3, सगळ्यात मोठी: Dr. Arjun Shah सोबत मजबूत booking. Thread.sleep नाही. 10:30 च्या slot ची वाट पाहा, घेतलेला 11:00 चा slot enabled नाही हे assert करा, Confirm clickable होईपर्यंत वाट पाहा, मग confirmation page वर fee "₹1200" आहे हे assert करा. शेवटी My appointments उघडा आणि नव्या booking ची row तिथे आहे हे assert करा. ग्रेमलिनच्या चार bugs नी ही test लाल व्हायला हवी.' },
          startUrl: 'https://carebridge.test/book?doctor=2',
          loggedIn: true,
          noSleep: true,
          minAssertions: 3,
          starter: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
driver.get("https://carebridge.test/book?doctor=2");
driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();

// TODO: wait until the 10:30 slot is visible
// TODO: assert the taken 11:00 slot is NOT enabled
driver.findElement(By.cssSelector(".slot[data-time='10:30']")).click();
driver.findElement(By.id("patient-name")).sendKeys("Asha Patil");
driver.findElement(By.id("terms")).click();

// TODO: wait until "confirm-btn" is clickable, then click it
// TODO: wait for "/confirmation", then assert the fee (id "fee") is "₹1200"
// TODO: read the booking id, open https://carebridge.test/appointments
//       and assert exactly 1 row matches tr[data-id='...that id...']`,
          solution: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
driver.get("https://carebridge.test/book?doctor=2");
driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();

wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".slot[data-time='10:30']")));
Assert.assertFalse(driver.findElement(By.cssSelector(".slot[data-time='11:00']")).isEnabled(), "11:00 is taken");
driver.findElement(By.cssSelector(".slot[data-time='10:30']")).click();
driver.findElement(By.id("patient-name")).sendKeys("Asha Patil");
driver.findElement(By.id("terms")).click();

wait.until(ExpectedConditions.elementToBeClickable(By.id("confirm-btn"))).click();
wait.until(ExpectedConditions.urlContains("/confirmation"));
Assert.assertEquals(driver.findElement(By.id("fee")).getText(), "₹1200");
String id = driver.findElement(By.id("booking-id")).getText();
driver.get("https://carebridge.test/appointments");
Assert.assertEquals(driver.findElements(By.cssSelector("tr[data-id='" + id + "']")).size(), 1, "new booking listed");`,
          mustCatch: [
            { bug: 'double-book', label: { en: 'The taken 11:00 slot can be booked', mr: 'घेतलेला 11:00 चा slot book करता येतो' } },
            { bug: 'confirm-stuck', label: { en: 'Confirm booking never becomes enabled', mr: 'Confirm booking कधीच enabled होत नाही' } },
            { bug: 'wrong-fee', label: { en: 'Confirmation shows the fee plus ₹50', mr: 'confirmation वर fee पेक्षा ₹50 जास्त दिसतात' } },
            { bug: 'appt-missing', label: { en: 'The new booking is missing from My appointments', mr: 'नवं booking My appointments मध्ये दिसत नाही' } },
          ],
          hints: [
            { en: 'Two waits: visibilityOfElementLocated for the 10:30 slot, and elementToBeClickable(By.id("confirm-btn")) followed by .click(). A third, urlContains("/confirmation"), before reading the fee.', mr: 'दोन waits: 10:30 च्या slot साठी visibilityOfElementLocated, आणि elementToBeClickable(By.id("confirm-btn")) नंतर .click(). तिसरा, urlContains("/confirmation"), fee वाचण्याआधी.' },
            { en: `Assert.assertFalse(driver.findElement(By.cssSelector(".slot[data-time='11:00']")).isEnabled(), "11:00 is taken");`, mr: `Assert.assertFalse(driver.findElement(By.cssSelector(".slot[data-time='11:00']")).isEnabled(), "11:00 is taken");` },
            { en: 'Save the id first: String id = driver.findElement(By.id("booking-id")).getText(); then build the locator with + id +.', mr: 'आधी id साठवा: String id = driver.findElement(By.id("booking-id")).getText(); मग + id + ने locator बनवा.' },
            { en: `Assert.assertEquals(driver.findElements(By.cssSelector("tr[data-id='" + id + "']")).size(), 1, "new booking listed");`, mr: `Assert.assertEquals(driver.findElements(By.cssSelector("tr[data-id='" + id + "']")).size(), 1, "new booking listed");` },
          ],
          successLine: { en: 'One test, no guessing, four real bugs caught. This is the test the team will trust on Friday.', mr: 'एक test, कोणताही अंदाज नाही, चार खरे bugs पकडले. शुक्रवारी टीम याच test वर भरवसा ठेवेल.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Step 4, cancel with an alert. This test clicks Cancel on appointment CB-0999 but forgets the browser alert, so it crashes. Wait for the alert, assert its text is "Cancel this appointment?", accept it, and then the status check can run.', mr: 'पायरी 4, alert सह cancel. ही test appointment CB-0999 वर Cancel click करते पण browser alert विसरते, म्हणून crash होते. alert ची वाट पाहा, त्याचा मजकूर "Cancel this appointment?" आहे हे assert करा, तो accept करा, आणि मग status चा check चालू शकेल.' },
          startUrl: 'https://carebridge.test/appointments',
          loggedIn: true,
          noSleep: true,
          minAssertions: 2,
          starter: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
driver.get("https://carebridge.test/appointments");
driver.findElement(By.cssSelector("tr[data-id='CB-0999'] .cancel-btn")).click();

// TODO: wait for the alert (ExpectedConditions.alertIsPresent())
// TODO: assert its text is "Cancel this appointment?", then accept it

Assert.assertEquals(driver.findElement(By.cssSelector("tr[data-id='CB-0999'] .status")).getText(), "Cancelled");`,
          solution: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
driver.get("https://carebridge.test/appointments");
driver.findElement(By.cssSelector("tr[data-id='CB-0999'] .cancel-btn")).click();

Alert alert = wait.until(ExpectedConditions.alertIsPresent());
Assert.assertEquals(alert.getText(), "Cancel this appointment?");
alert.accept();

Assert.assertEquals(driver.findElement(By.cssSelector("tr[data-id='CB-0999'] .status")).getText(), "Cancelled");`,
          mustCatch: [{ bug: 'cancel-no-confirm', label: { en: 'Cancel removes the appointment without asking', mr: 'Cancel न विचारताच appointment काढून टाकतो' } }],
          hints: [
            { en: 'wait.until(ExpectedConditions.alertIsPresent()) gives you the alert. Store it in an Alert variable.', mr: 'wait.until(ExpectedConditions.alertIsPresent()) तुम्हाला alert देतो. तो एका Alert variable मध्ये ठेवा.' },
            { en: 'Alert alert = wait.until(ExpectedConditions.alertIsPresent());\nAssert.assertEquals(alert.getText(), "Cancel this appointment?");\nalert.accept();', mr: 'Alert alert = wait.until(ExpectedConditions.alertIsPresent());\nAssert.assertEquals(alert.getText(), "Cancel this appointment?");\nalert.accept();' },
            { en: 'The UnhandledAlertException means the alert is blocking the page. Accept it before the next findElement.', mr: 'UnhandledAlertException म्हणजे alert page अडवतोय. पुढच्या findElement आधी तो accept करा.' },
          ],
          successLine: { en: 'Cancel asks first, the patient says yes, the status says Cancelled. And on the build that cancels without asking, this test goes red.', mr: 'Cancel आधी विचारतो, पेशंट हो म्हणतो, status Cancelled दाखवतो. आणि न विचारता cancel करणाऱ्या build वर ही test लाल होते.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Step 5, triage. Last night\'s report has three red tests. Sort each one: real bug, flaky test or test bug.\n\nA) bookingFee: "expected [₹1200] but found [₹1250]". Fails on every run.\nB) pickSlot: NoSuchElementException on .slot. Fails 3 runs out of 10. It uses Thread.sleep(1000).\nC) upcomingCount: NoSuchElementException on /html/body/main/div[2]/p/span. Fails every run since the redesign, and the dashboard looks perfect to users.', mr: 'पायरी 5, वर्गवारी. कालच्या report मध्ये तीन लाल tests आहेत. प्रत्येकीची वर्गवारी करा: खरा bug, flaky test की test bug.\n\nA) bookingFee: "expected [₹1200] but found [₹1250]". प्रत्येक run मध्ये fail.\nB) pickSlot: .slot वर NoSuchElementException. 10 पैकी 3 run मध्ये fail. Thread.sleep(1000) वापरते.\nC) upcomingCount: /html/body/main/div[2]/p/span वर NoSuchElementException. redesign पासून प्रत्येक run मध्ये fail, आणि users ना dashboard अगदी बरोबर दिसतो.' },
          options: [
            { en: 'A flaky test, B real bug, C test bug', mr: 'A flaky test, B खरा bug, C test bug' },
            { en: 'All three are real bugs: red is red', mr: 'तिन्ही खरे bugs: लाल म्हणजे लाल' },
            { en: 'A real bug, B flaky test, C test bug', mr: 'A खरा bug, B flaky test, C test bug' },
            { en: 'A real bug, B test bug, C flaky test', mr: 'A खरा bug, B test bug, C flaky test' },
          ],
          correct: [2],
          explain: { en: 'A fails every run with a wrong value the patient would pay: a real bug, report it to Theo with that line as proof. B passes or fails with timing and uses a sleep: a flaky test, fix it with an explicit wait. C fails every run but the app is fine: the old absolute XPath is a test bug, fix the locator.', mr: 'A प्रत्येक run मध्ये पेशंटला भरावी लागेल अशी चुकीची value दाखवून fail होते: खरा bug, ती ओळ पुरावा म्हणून Theo ला कळवा. B वेळेनुसार pass किंवा fail होते आणि sleep वापरते: flaky test, explicit wait ने दुरुस्त करा. C प्रत्येक run मध्ये fail होते पण app ठीक आहे: जुना absolute XPath हा test bug, locator दुरुस्त करा.' },
          hints: [
            { en: 'Ask two questions for each: does it fail every run, and is the app really wrong for users?', mr: 'प्रत्येकीसाठी दोन प्रश्न विचारा: ती प्रत्येक run मध्ये fail होते का, आणि users साठी app खरंच चुकतंय का?' },
            { en: 'A wrong fee on every run is the app\'s fault. Sometimes red plus a sleep means timing. Always red plus a happy app means the test is wrong.', mr: 'प्रत्येक run मध्ये चुकीची fee ही app ची चूक. कधी कधी लाल आणि सोबत sleep म्हणजे वेळेचा प्रश्न. नेहमी लाल पण app ठीक म्हणजे test चुकली.' },
          ],
          successLine: { en: 'One real bug with proof, one flaky test to fix, one test bug to fix. Red means something again.', mr: 'एक पुराव्यासह खरा bug, एक दुरुस्त करायची flaky test, एक दुरुस्त करायचा test bug. लाल रंगाला पुन्हा अर्थ आला.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'A test fails on every run with "expected [₹1200] but found [₹1250]". What is it most likely?', mr: 'एक test प्रत्येक run मध्ये "expected [₹1200] but found [₹1250]" ने fail होते. हे बहुधा काय आहे?' },
        options: [
          { en: 'A flaky test', mr: 'flaky test' },
          { en: 'A slow network', mr: 'संथ network' },
          { en: 'A real bug: the app shows the wrong fee', mr: 'खरा bug: app चुकीची fee दाखवतं' },
          { en: 'A missing Thread.sleep', mr: 'Thread.sleep नाही म्हणून' },
        ],
        answer: 2,
        explain: { en: 'It is consistent and the assertion shows a wrong value. That is the app\'s fault, with proof attached.', mr: 'ती सुसंगत आहे आणि assertion चुकीची value दाखवतो. ही app ची चूक आहे, पुराव्यासह.' },
      },
      {
        q: { en: 'The login button\'s id changes from "login-btn" to "sign-in". Why is a LoginPage page object a big help here?', mr: 'login बटणाचा id "login-btn" वरून "sign-in" झाला. इथे LoginPage page object मोठी मदत का ठरतो?' },
        options: [
          { en: 'You fix the locator once in LoginPage, and every test that logs in works again', mr: 'LoginPage मध्ये locator एकदाच दुरुस्त करा, आणि login करणारी प्रत्येक test पुन्हा चालते' },
          { en: 'The page object finds the new id by itself', mr: 'page object नवा id आपोआप शोधतो' },
          { en: 'Page objects make tests run faster', mr: 'page objects मुळे tests जास्त वेगाने चालतात' },
          { en: 'Page objects do not need locators at all', mr: 'page objects ना locators लागतच नाहीत' },
        ],
        answer: 0,
        explain: { en: 'The locator lives in one place. One edit repairs fifty tests, and the tests themselves stay readable.', mr: 'locator एकाच जागी राहतो. एका बदलाने पन्नास tests ठीक होतात, आणि tests स्वतः वाचायला सोप्या राहतात.' },
      },
      {
        q: { en: 'Which planted bug does this line catch?', mr: 'ही ओळ कोणता लपवलेला bug पकडते?' },
        code: `Assert.assertFalse(driver.findElement(By.cssSelector(".slot[data-time='11:00']")).isEnabled());`,
        options: [
          { en: 'The confirmation shows the wrong fee', mr: 'confirmation वर चुकीची fee दिसते' },
          { en: 'The Confirm button never becomes enabled', mr: 'Confirm बटण कधीच enabled होत नाही' },
          { en: 'The new booking is missing from My appointments', mr: 'नवं booking My appointments मध्ये दिसत नाही' },
          { en: 'The already taken 11:00 slot can be booked twice', mr: 'आधीच घेतलेला 11:00 चा slot दुसऱ्यांदा book करता येतो' },
        ],
        answer: 3,
        explain: { en: '11:00 is taken, so its button must be disabled. If it is enabled, two patients can book the same slot.', mr: '11:00 घेतलेला आहे, म्हणून त्याचं बटण disabled असायला हवं. ते enabled असेल तर दोन पेशंट एकच slot book करू शकतात.' },
      },
      {
        q: { en: 'A test failed on Monday night and passed on Tuesday. Nobody changed any code. What should you do first?', mr: 'एक test सोमवारी रात्री fail झाली आणि मंगळवारी pass. कोणीच code बदलला नाही. आधी काय करावं?' },
        options: [
          { en: 'Mark it green and move on', mr: 'हिरवी म्हणून पुढे जा' },
          { en: 'Look for the flaky cause: a Thread.sleep, a missing wait, or data left behind by another test', mr: 'flaky पणाचं कारण शोधा: Thread.sleep, राहून गेलेला wait, किंवा दुसऱ्या test ने मागे सोडलेला data' },
          { en: 'Delete the test so the build stays green', mr: 'build हिरवा राहावा म्हणून test delete करा' },
          { en: 'Add Thread.sleep(10000) everywhere', mr: 'सगळीकडे Thread.sleep(10000) लावा' },
        ],
        answer: 1,
        explain: { en: 'Same code, different result: that is flaky. Find the cause and fix the test, so that red means something again.', mr: 'code तोच, निकाल वेगळा: हे flaky आहे. कारण शोधा आणि test दुरुस्त करा, म्हणजे लाल रंगाला पुन्हा अर्थ येईल.' },
      },
    ],
    recap: { line: { en: 'A trusted suite passes on good builds, fails on broken ones, and says exactly why. Triage every red: real bug, flaky test or test bug.', mr: 'भरवशाचा suite चांगल्या builds वर pass होतो, बिघडलेल्यांवर fail होतो, आणि नेमकं का ते सांगतो. प्रत्येक लाल रंगाची वर्गवारी करा: खरा bug, flaky test की test bug.' }, icon: '🛡️' },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: 'green?! a green suite that people actually believe?! my lovely false alarms... fine. i will go somewhere new. somewhere with airports.', mr: 'हिरवा?! लोकांना खरंच भरवसा वाटणारा हिरवा suite?! माझ्या लाडक्या खोट्या घंटा... ठीक आहे. मी नव्या ठिकाणी जाईन. जिथे विमानतळ आहेत.' } },
      { who: 'sam', mood: 'happy', text: { en: 'The nightly suite is green, and when it went red this week it was a real bug every time. Friday\'s release is on. Thank you, {name}!', mr: 'nightly suite हिरवा आहे, आणि या आठवड्यात जेव्हा लाल झाला तेव्हा प्रत्येक वेळी खरा bug होता. शुक्रवारचं रिलीज होणार. धन्यवाद, {name}!' } },
      { who: 'meera', mood: 'happy', text: { en: 'You took a suite nobody trusted and made it one everybody reads, {name}. Next come Playwright, the modern way to drive browsers, and then performance testing.', mr: '{name}, कोणालाच भरवसा नसलेला suite तुम्ही असा बनवलात की आता सगळे तो वाचतात. पुढे Playwright, browser चालवण्याची आधुनिक पद्धत, आणि मग performance testing.' } },
      { who: 'rex', mood: 'smug', text: { en: 'Not one Thread.sleep in the whole suite. I may frame it.', mr: 'संपूर्ण suite मध्ये एकही Thread.sleep नाही. मी कदाचित फ्रेम करून लावेन.' } },
    ],
  },
]
