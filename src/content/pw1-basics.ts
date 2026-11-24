import type { Lesson } from './types.ts'

// Playwright 1 basics: the first real test (goto, toHaveTitle, toBeVisible, reading a failure) and user-facing locators.

const SKY = 'https://skyhop.test'
const IMPORT = "import { test, expect } from '@playwright/test';\n\n"
const FLIGHTS = '/flights?from=PNQ&to=DEL&date=2026-12-20&pax=1'

const HOME_TITLE_TEST = `${IMPORT}test('home page has the right title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('SkyHop | Fly happy');
});`

export const pwBasicsLessons: Lesson[] = [
  // ───────────────────────── W1.1 Your first Playwright test
  {
    id: 'pw1-1',
    code: 'W1.1',
    level: 'basic',
    title: { en: 'Your First Playwright Test', mr: 'तुमची पहिली Playwright test' },
    skill: 'test, page.goto, toHaveTitle, toBeVisible',
    realLife: {
      place: 'postoffice',
      title: { en: 'Sending Ninad to the post office', mr: 'निनादला पोस्ट ऑफिसमध्ये पाठवणं' },
      story: {
        en: 'Meera sends her cousin Ninad to collect a speed-post parcel. She writes a tiny checklist: go to the Kothrud post office, check the board says "Kothrud S.O.", and check the parcel counter is open before standing in the line. Ninad is patient: if the shutter is still half down, he waits a few minutes before deciding. Then he reports in Meera\'s format: "Board: expected Kothrud S.O., saw Kothrud S.O. Counter: expected open, saw closed." With expected and seen side by side, Meera knows at once what went wrong, without going there herself.',
        mr: 'मीरा तिच्या चुलत भावाला, निनादला, speed-post चं पार्सल आणायला पाठवते. ती एक छोटी checklist लिहिते: कोथरूड पोस्ट ऑफिसला जा, पाटीवर "Kothrud S.O." आहे का तपास, आणि रांगेत उभं राहण्याआधी पार्सल counter उघडा आहे का तपास. निनाद संयमी आहे: shutter अर्धा खाली असेल तर ठरवण्याआधी तो काही मिनिटं थांबतो. मग तो मीराच्या पद्धतीने सांगतो: "पाटी: अपेक्षित Kothrud S.O., दिसलं Kothrud S.O. Counter: अपेक्षित उघडा, दिसला बंद." अपेक्षित आणि दिसलेलं शेजारी शेजारी असल्यामुळे स्वतः न जाता मीराला लगेच कळतं काय चुकलं.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📮', label: 'Go to the post office (page.goto)', mr: 'पोस्ट ऑफिसला जा (page.goto)' },
          { icon: '🪧', label: 'The board shows the right name (toHaveTitle)', mr: 'पाटीवर योग्य नाव आहे (toHaveTitle)' },
          { icon: '🪟', label: 'The counter is open and visible (toBeVisible)', mr: 'counter उघडा आहे आणि दिसतो (toBeVisible)' },
          { icon: '📝', label: 'Report: Expected vs Received', mr: 'report: Expected विरुद्ध Received' },
        ],
        breakAt: 2,
        breakNote: { en: 'Counter closed: expected open, received closed. The report says exactly that.', mr: 'counter बंद: अपेक्षित उघडा, मिळाला बंद. report नेमकं तेच सांगतो.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'gremlin', mood: 'smug', text: { en: 'i changed the home title to "SkyHop | Fly hapy". the old selenium job was red anyway, so nobody looked. lol.', mr: 'मी home चा title "SkyHop | Fly hapy" केला. जुना selenium job तसाही लाल होता, म्हणून कोणी पाहिलंच नाही. lol.' } },
        { who: 'sam', mood: 'worried', text: { en: 'Customers sent us screenshots of the typo. Marketing is not happy, and not "hapy" either.', mr: 'ग्राहकांनी typo चे screenshots पाठवले. marketing खूश नाही, आणि "hapy" पण नाही.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Our first Playwright test checks exactly that, {name}. Open the home page, check the title, check the main heading is visible. Three lines.', mr: 'आपली पहिली Playwright test नेमकं तेच तपासते, {name}. home page उघडा, title तपासा, मुख्य heading दिसतं का तपासा. तीन ओळी.' } },
        { who: 'meera', mood: 'happy', text: { en: 'And when it fails, the report shows Expected and Received side by side. Even Sam can read it.', mr: 'आणि fail झाली की report Expected आणि Received शेजारी शेजारी दाखवतो. Sam सुद्धा वाचू शकेल.' } },
      ],
      problem: { en: 'Nothing checks the SkyHop pages on each release, so a typo in the title or a missing heading reaches customers first.', mr: 'प्रत्येक release ला SkyHop ची pages कोणी तपासत नाही, म्हणून title मधला typo किंवा गायब heading आधी ग्राहकांपर्यंत पोहोचतो.' },
      solution: { en: 'A Playwright test opens the page with page.goto, then checks it with web-first assertions: expect(page).toHaveTitle(...) and expect(locator).toBeVisible(). A wrong page turns the test red with Expected and Received in the report.', mr: 'Playwright test page.goto ने page उघडते, मग web-first assertions ने तपासते: expect(page).toHaveTitle(...) आणि expect(locator).toBeVisible(). page चुकीचं असेल तर test लाल होते आणि report मध्ये Expected आणि Received दिसतात.' },
    },
    lesson: [
      { en: 'A spec file (for example home.spec.ts) starts with import { test, expect } from \'@playwright/test\'. Then test(\'name\', async ({ page }) => { ... }) declares one test. Give it a name that reads like a test case title, such as "home page has the right title". page is a fresh browser tab, and every test starts on a blank page.', mr: 'spec file (उदा. home.spec.ts) import { test, expect } from \'@playwright/test\' ने सुरू होते. मग test(\'name\', async ({ page }) => { ... }) एक test declare करतं. test case च्या title सारखं वाचता येईल असं नाव द्या, जसं "home page has the right title". page म्हणजे नवा browser tab, आणि प्रत्येक test रिकाम्या page वरून सुरू होते.' },
      { en: 'await page.goto(\'/\') opens a page. Our project config sets baseURL to https://skyhop.test (in a real project that lives in playwright.config.ts), so \'/\' is the home page and \'/baggage\' is the baggage page. No full address needed, unlike driver.get in Selenium.', mr: 'await page.goto(\'/\') page उघडतं. आपल्या project च्या config मध्ये baseURL https://skyhop.test आहे (खऱ्या project मध्ये ते playwright.config.ts मध्ये असतं), म्हणून \'/\' म्हणजे home page आणि \'/baggage\' म्हणजे baggage page. Selenium मधल्या driver.get सारखा पूर्ण पत्ता लागत नाही.' },
      { en: 'Web-first assertions check the live page: await expect(page).toHaveTitle(\'SkyHop | Fly happy\') and await expect(page.getByRole(\'heading\', { name: \'Where to next?\' })).toBeVisible(). Like patient Ninad, they keep checking for up to 5 seconds before they fail, so a slow page does not make them flaky. Always await them.', mr: 'web-first assertions चालू page तपासतात: await expect(page).toHaveTitle(\'SkyHop | Fly happy\') आणि await expect(page.getByRole(\'heading\', { name: \'Where to next?\' })).toBeVisible(). संयमी निनादसारखे ते fail होण्याआधी 5 सेकंदांपर्यंत तपासत राहतात, म्हणून हळू page मुळे ते flaky होत नाहीत. त्यांना नेहमी await करा.' },
      { en: 'Reading a failure: the report shows the failing line, the assertion, Expected (what you wrote), Received (what the page had) and the Timeout. Read Received first: it usually tells you whether the site is wrong or your test is. And the tester\'s rule from Selenium still holds: if the page were broken, would this test turn red? Hidden buggy builds check that for you here.', mr: 'failure वाचणं: report fail झालेली ओळ, assertion, Expected (तुम्ही लिहिलेलं), Received (page वर होतं ते) आणि Timeout दाखवतो. आधी Received वाचा: site चुकीची आहे की तुमची test, हे बहुतेक तेच सांगतं. आणि Selenium मधला tester चा नियम अजूनही लागू आहे: page बिघडलं असतं तर ही test लाल झाली असती का? इथे लपवलेले buggy builds ते तुमच्यासाठी तपासतात.' },
    ],
    syntax: {
      template: `import { test, expect } from '@playwright/test';

test('test name', async ({ page }) => {
  await page.goto('/path');
  await expect(page).toHaveTitle('Exact title');
  await expect(page.getByRole('heading', { name: 'Heading text' })).toBeVisible();
});`,
      parts: [
        { code: "import { test, expect } from '@playwright/test'", means: { en: 'bring in the test runner and the assertions', mr: 'test runner आणि assertions आणा' } },
        { code: "test('name', async ({ page }) => { ... })", means: { en: 'one test: a readable name and an async body that receives page', mr: 'एक test: वाचता येईल असं नाव आणि page घेणारी async body' } },
        { code: "await page.goto('/')", means: { en: 'open a path on the base URL (https://skyhop.test)', mr: 'base URL (https://skyhop.test) वरचा path उघडा' } },
        { code: "await expect(page).toHaveTitle('...')", means: { en: 'the tab title must equal this text (retries up to 5 s)', mr: 'tab चा title हाच मजकूर असायला हवा (5 सेकंदांपर्यंत पुन्हा तपासतो)' } },
        { code: 'await expect(locator).toBeVisible()', means: { en: 'this element must be on the page and visible', mr: 'हा element page वर असायला आणि दिसायला हवा' } },
      ],
      example: [
        { code: "import { test, expect } from '@playwright/test';", note: { en: 'Meera\'s pen and checklist paper', mr: 'मीराचं पेन आणि checklist चा कागद' } },
        { code: "test('home page greets passengers', async ({ page }) => {", note: { en: 'one checklist with a clear name', mr: 'स्पष्ट नाव असलेली एक checklist' } },
        { code: "  await page.goto('/');", note: { en: 'go to the post office', mr: 'पोस्ट ऑफिसला जा' } },
        { code: "  await expect(page).toHaveTitle('SkyHop | Fly happy');", note: { en: 'read the name board', mr: 'नावाची पाटी वाचा' } },
        { code: "  await expect(page.getByRole('heading', { name: 'Where to next?' })).toBeVisible();", note: { en: 'the counter is open: the main heading is there', mr: 'counter उघडा आहे: मुख्य heading आहे' } },
        { code: '});', note: { en: 'end of the checklist; the report says pass or fail', mr: 'checklist संपली; report pass किंवा fail सांगतो' } },
      ],
      pitfall: { en: 'Forget await and the test fails with "Missing await: page.goto() ... Put await before it." Also, toHaveTitle with a string wants the whole title exactly: \'SkyHop | Fly happy\', with a space on each side of the bar.', mr: 'await विसरलात तर test "Missing await: page.goto() ... Put await before it." देऊन fail होते. आणि string दिली तर toHaveTitle ला पूर्ण title तंतोतंत हवा: \'SkyHop | Fly happy\', उभ्या रेषेच्या दोन्ही बाजूला space.' },
    },
    practice: {
      intro: { en: 'Your first Playwright tests. Editor on the left, browser on the right, the test report under Run and Submit. Hidden buggy builds of SkyHop will check that your assertions really catch problems.', mr: 'तुमच्या पहिल्या Playwright tests. editor डावीकडे, browser उजवीकडे, Run आणि Submit खाली test report. तुमचे assertions खरंच अडचणी पकडतात का, हे SkyHop चे लपवलेले buggy builds तपासतील.' },
      steps: [
        {
          kind: 'playwright',
          prompt: { en: 'Open the home page and check that its title is exactly "SkyHop | Fly happy". Use await expect(page).toHaveTitle(...).', mr: 'home page उघडा आणि त्याचा title नेमका "SkyHop | Fly happy" आहे का तपासा. await expect(page).toHaveTitle(...) वापरा.' },
          startUrl: `${SKY}/`,
          starter: `${IMPORT}test('home page has the right title', async ({ page }) => {
  await page.goto('/');
  // TODO: assert the page title is exactly 'SkyHop | Fly happy'
});
`,
          solution: HOME_TITLE_TEST,
          minAssertions: 1,
          mustUse: [{ pattern: 'toHaveTitle\\(', message: { en: 'Check the title with await expect(page).toHaveTitle(...).', mr: 'title await expect(page).toHaveTitle(...) ने तपासा.' } }],
          mustCatch: [{ bug: 'title-typo', label: { en: 'Home title misspelled as "SkyHop | Fly hapy"', mr: 'home title चं स्पेलिंग "SkyHop | Fly hapy" झालं' } }],
          hints: [
            { en: 'The assertion starts with await expect(page) because the title belongs to the whole page.', mr: 'title संपूर्ण page चा असतो, म्हणून assertion await expect(page) ने सुरू होतं.' },
            { en: 'Then the matcher: .toHaveTitle(\'...\') with the exact text.', mr: 'मग matcher: तंतोतंत मजकुरासह .toHaveTitle(\'...\').' },
            { en: "await expect(page).toHaveTitle('SkyHop | Fly happy');", mr: "await expect(page).toHaveTitle('SkyHop | Fly happy');" },
          ],
          successLine: { en: 'Caught it. On the buggy build your test said Expected "SkyHop | Fly happy", Received "SkyHop | Fly hapy". Gremlin\'s typo now lasts one run.', mr: 'पकडलं. buggy build वर तुमची test म्हणाली Expected "SkyHop | Fly happy", Received "SkyHop | Fly hapy". gremlin चा typo आता एकाच run पुरता.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Write the whole body this time. Open \'/baggage\', check the title is "Track baggage | SkyHop", and check the heading "Track your bag" is visible.', mr: 'या वेळी पूर्ण body लिहा. \'/baggage\' उघडा, title "Track baggage | SkyHop" आहे का तपासा, आणि "Track your bag" heading दिसतं का तपासा.' },
          startUrl: `${SKY}/`,
          starter: `${IMPORT}test('baggage page opens', async ({ page }) => {
  // TODO: open '/baggage'
  // TODO: assert the title is 'Track baggage | SkyHop'
  // TODO: assert the heading 'Track your bag' is visible
});
`,
          solution: `${IMPORT}test('baggage page opens', async ({ page }) => {
  await page.goto('/baggage');
  await expect(page).toHaveTitle('Track baggage | SkyHop');
  await expect(page.getByRole('heading', { name: 'Track your bag' })).toBeVisible();
});`,
          minAssertions: 2,
          mustUse: [
            { pattern: "goto\\(\\s*['\"`]/baggage['\"`]", message: { en: "Open the page with await page.goto('/baggage').", mr: "await page.goto('/baggage') ने page उघडा." } },
            { pattern: 'toBeVisible\\(', message: { en: 'Check the heading with await expect(...).toBeVisible().', mr: 'heading await expect(...).toBeVisible() ने तपासा.' } },
          ],
          hints: [
            { en: "Three lines, each starting with await. First: await page.goto('/baggage');", mr: "तीन ओळी, प्रत्येक await ने सुरू. पहिली: await page.goto('/baggage');" },
            { en: "The heading locator: page.getByRole('heading', { name: 'Track your bag' })", mr: "heading चा locator: page.getByRole('heading', { name: 'Track your bag' })" },
            { en: "await page.goto('/baggage');\nawait expect(page).toHaveTitle('Track baggage | SkyHop');\nawait expect(page.getByRole('heading', { name: 'Track your bag' })).toBeVisible();", mr: "await page.goto('/baggage');\nawait expect(page).toHaveTitle('Track baggage | SkyHop');\nawait expect(page.getByRole('heading', { name: 'Track your bag' })).toBeVisible();" },
          ],
          successLine: { en: 'A smoke test for the baggage page: it opens, it has the right name, the main heading is there.', mr: 'baggage page ची smoke test: ते उघडतं, त्याचं नाव बरोबर आहे, मुख्य heading आहे.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'This is your title test, running on a buggy build. Press Run and read the red report. What does it tell you?', mr: 'ही तुमचीच title test आहे, buggy build वर चालणारी. Run दाबा आणि लाल report वाचा. तो काय सांगतो?' },
          playwrightSandbox: { code: HOME_TITLE_TEST, startUrl: `${SKY}/`, build: ['title-typo'] },
          options: [
            { en: 'The test code has a syntax error', mr: 'test च्या code मध्ये syntax error आहे' },
            { en: 'The site\'s title is "SkyHop | Fly hapy": a typo on the site, and the test is right', mr: 'site चा title "SkyHop | Fly hapy" आहे: site वर typo आहे, आणि test बरोबर आहे' },
            { en: 'The page never loaded', mr: 'page load झालंच नाही' },
            { en: 'Playwright could not find the heading', mr: 'Playwright ला heading सापडलं नाही' },
          ],
          correct: [1],
          explain: { en: 'Expected is what you wrote, Received is what the page had. Received "SkyHop | Fly hapy" means the site is wrong. Playwright retried for the full 5 second timeout before it gave up, so this is not a timing problem.', mr: 'Expected म्हणजे तुम्ही लिहिलेलं, Received म्हणजे page वर होतं ते. Received "SkyHop | Fly hapy" म्हणजे site चुकीची आहे. हार मानण्याआधी Playwright ने पूर्ण 5 सेकंदांचा timeout तपासलं, म्हणून ही वेळेची अडचण नाही.' },
          hints: [
            { en: 'Find the two lines starting with Expected: and Received:.', mr: 'Expected: आणि Received: ने सुरू होणाऱ्या दोन ओळी शोधा.' },
            { en: 'Read Received slowly, letter by letter.', mr: 'Received हळू, अक्षर अक्षर वाचा.' },
          ],
          successLine: { en: 'Received first, then Expected. That is how you read every Playwright failure.', mr: 'आधी Received, मग Expected. प्रत्येक Playwright failure असाच वाचायचा.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Theo wrote this test in a hurry. Press Run and read the report. What is the fix?', mr: 'Theo ने ही test घाईत लिहिली. Run दाबा आणि report वाचा. उपाय काय?' },
          playwrightSandbox: { code: `${IMPORT}test('home page has the right title', async ({ page }) => {\n  page.goto('/');\n  await expect(page).toHaveTitle('SkyHop | Fly happy');\n});`, startUrl: `${SKY}/` },
          options: [
            { en: 'Change the expected title', mr: 'अपेक्षित title बदला' },
            { en: 'Add page.waitForTimeout(5000) after goto', mr: 'goto नंतर page.waitForTimeout(5000) जोडा' },
            { en: 'Use the full address https://skyhop.test/', mr: 'पूर्ण पत्ता https://skyhop.test/ वापरा' },
            { en: "Put await before page.goto('/'), as the report says", mr: "report सांगतो तसं page.goto('/') च्या आधी await लिहा" },
          ],
          correct: [3],
          explain: { en: 'page.goto returns a promise. Without await the test ran on before the navigation finished, and Playwright reports "Missing await: page.goto() on line 4 ... Put await before it." A fixed sleep would only hide the real mistake.', mr: 'page.goto promise देतं. await नसल्यामुळे navigation पूर्ण होण्याआधीच test पुढे गेली, आणि Playwright सांगतो "Missing await: page.goto() on line 4 ... Put await before it." ठरावीक sleep फक्त खरी चूक लपवेल.' },
          hints: [
            { en: 'The first words of the red line name the problem.', mr: 'लाल ओळीतले पहिले शब्द अडचणीचं नाव सांगतात.' },
            { en: 'Compare line 4 with the same line in your own tests.', mr: 'ओळ 4 ची तुमच्या tests मधल्या त्याच ओळीशी तुलना करा.' },
          ],
          successLine: { en: 'Every Playwright step gets an await. Remember the token.', mr: 'प्रत्येक Playwright पायरीला await. token आठवा.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Bug hunt. Support says Rohan\'s bag SH771205 went to Mumbai, but the site told him "Ready at belt 4". This build has that bug. The starter already tracks his bag. Add one assertion: the bag status (getByTestId(\'bag-status\')) should contain "Misrouted". Your test must fail on this buggy build and pass on the good one.', mr: 'bug शोध. support सांगतं की रोहनची bag SH771205 मुंबईला गेली, पण site ने त्याला "Ready at belt 4" सांगितलं. या build मध्ये तोच bug आहे. starter आधीच त्याची bag track करतो. एक assertion जोडा: bag status (getByTestId(\'bag-status\')) मध्ये "Misrouted" असायला हवं. तुमची test या buggy build वर fail आणि चांगल्या build वर pass व्हायला हवी.' },
          startUrl: `${SKY}/baggage`,
          build: ['bag-status'],
          expectFailure: true,
          starter: `${IMPORT}test('a misrouted bag says so', async ({ page }) => {
  await page.goto('/baggage');
  await page.getByLabel('Bag tag number').fill('SH771205');
  await page.getByRole('button', { name: 'Track bag' }).click();
  // TODO: assert the bag status contains 'Misrouted' (toContainText checks part of the text)
});
`,
          solution: `${IMPORT}test('a misrouted bag says so', async ({ page }) => {
  await page.goto('/baggage');
  await page.getByLabel('Bag tag number').fill('SH771205');
  await page.getByRole('button', { name: 'Track bag' }).click();
  await expect(page.getByTestId('bag-status')).toContainText('Misrouted');
});`,
          minAssertions: 0,
          mustUse: [{ pattern: "getByTestId\\(\\s*['\"`]bag-status['\"`]\\s*\\)", message: { en: "Check the status element: page.getByTestId('bag-status').", mr: "status चा element तपासा: page.getByTestId('bag-status')." } }],
          hints: [
            { en: 'Press Run on the starter first: it passes, because nothing checks the status. That is why this bug reached Rohan.', mr: 'आधी starter वर Run दाबा: तो pass होतो, कारण status कोणीच तपासत नाही. म्हणूनच हा bug रोहनपर्यंत पोहोचला.' },
            { en: "toContainText('Misrouted') passes if that word appears anywhere in the element's text.", mr: "element च्या मजकुरात तो शब्द कुठेही असला तर toContainText('Misrouted') pass होतो." },
            { en: "await expect(page.getByTestId('bag-status')).toContainText('Misrouted');", mr: "await expect(page.getByTestId('bag-status')).toContainText('Misrouted');" },
          ],
          successLine: { en: 'Red on the buggy build, green on the good one. That is a test you can trust. Rex is forwarding your report to Theo.', mr: 'buggy build वर लाल, चांगल्या build वर green. अशाच test वर विश्वास ठेवता येतो. Rex तुमचा report Theo ला पाठवतो आहे.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Which line opens the SkyHop home page in our project?', mr: 'आपल्या project मध्ये कोणती ओळ SkyHop चं home page उघडते?' },
        options: [
          "driver.get('https://skyhop.test/');",
          "await page.open('/');",
          "await page.goto('/');",
          "page.goto('/');",
        ],
        answer: 2,
        explain: { en: "page.goto with the path, and await in front. The base URL fills in https://skyhop.test. There is no page.open, and without await the test fails with Missing await.", mr: "path सह page.goto, आणि पुढे await. base URL https://skyhop.test भरतो. page.open असं काही नाही, आणि await शिवाय test Missing await देऊन fail होते." },
      },
      {
        q: { en: 'Your test failed with this report. What happened?', mr: 'तुमची test या report सह fail झाली. काय झालं?' },
        code: "await page.goto('/bagage');\nawait expect(page).toHaveTitle('Track baggage | SkyHop');\n\nError: expect(page).toHaveTitle(expected) failed\nExpected: \"Track baggage | SkyHop\"\nReceived: \"Page not found | SkyHop\"",
        options: [
          { en: 'The test opened a path with a typo (/bagage), so the site showed its "not found" page', mr: 'test ने typo असलेला path (/bagage) उघडला, म्हणून site ने "not found" page दाखवलं' },
          { en: 'The baggage page has a wrong title', mr: 'baggage page चा title चुकीचा आहे' },
          { en: 'The page was too slow', mr: 'page खूप हळू होतं' },
          { en: 'toHaveTitle does not work on this page', mr: 'toHaveTitle या page वर चालत नाही' },
        ],
        answer: 0,
        explain: { en: 'Received tells the story: the browser was on "Page not found". Look at the goto line: /bagage is missing a g. Here the test is wrong, not the site.', mr: 'Received सगळं सांगतो: browser "Page not found" वर होता. goto ची ओळ पाहा: /bagage मध्ये एक g कमी आहे. इथे test चुकीची आहे, site नाही.' },
      },
      {
        q: { en: 'What does this test prove?', mr: 'ही test काय सिद्ध करते?' },
        code: "test('home', async ({ page }) => {\n  await page.goto('/');\n  console.log(await page.title());\n});",
        options: [
          { en: 'That the title is correct', mr: 'title बरोबर आहे' },
          { en: 'That the search form works', mr: 'search form चालतो' },
          { en: 'That SkyHop has no bugs', mr: 'SkyHop मध्ये एकही bug नाही' },
          { en: 'Almost nothing: there is no expect, so it stays green even with "Fly hapy"', mr: 'जवळजवळ काहीच नाही: expect नाही, म्हणून "Fly hapy" असतानाही green राहते' },
        ],
        answer: 3,
        explain: { en: 'Printing is not checking. Add await expect(page).toHaveTitle(\'SkyHop | Fly happy\') to make it a test.', mr: 'print करणं म्हणजे तपासणं नाही. test बनवायला await expect(page).toHaveTitle(\'SkyHop | Fly happy\') जोडा.' },
      },
      {
        q: { en: 'Why must await expect(locator).toBeVisible() have await in front?', mr: 'await expect(locator).toBeVisible() च्या पुढे await का हवं?' },
        options: [
          { en: 'It makes the text bigger in the report', mr: 'त्यामुळे report मधला मजकूर मोठा होतो' },
          { en: 'It returns a promise and keeps retrying for up to 5 seconds; await waits for the final answer', mr: 'ते promise देतं आणि 5 सेकंदांपर्यंत पुन्हा तपासत राहतं; await अंतिम उत्तराची वाट पाहतं' },
          { en: 'It is only needed on Firefox', mr: 'ते फक्त Firefox वर लागतं' },
          { en: 'Without await the check runs twice', mr: 'await शिवाय check दोनदा चालतो' },
        ],
        answer: 1,
        explain: { en: 'Web-first assertions are async because they retry. Without await, the test would move on before the check finishes, and Playwright flags it as a Missing await.', mr: 'web-first assertions पुन्हा तपासतात म्हणून ते async असतात. await शिवाय check पूर्ण होण्याआधीच test पुढे जाईल, आणि Playwright त्याला Missing await म्हणतो.' },
      },
    ],
    recap: { line: { en: 'import test and expect, open with await page.goto(path), check with await expect(page).toHaveTitle and await expect(locator).toBeVisible, and read Received before Expected.', mr: 'test आणि expect import करा, await page.goto(path) ने उघडा, await expect(page).toHaveTitle आणि await expect(locator).toBeVisible ने तपासा, आणि Expected आधी Received वाचा.' }, icon: '🛫' },
  },

  // ───────────────────────── W1.2 Locators like a user sees the page
  {
    id: 'pw1-2',
    code: 'W1.2',
    level: 'basic',
    title: { en: 'Locators Like a User Sees the Page', mr: 'user ला दिसतं तसे Locators' },
    skill: 'getByRole, getByLabel, getByPlaceholder, getByText, getByTestId, strict mode',
    realLife: {
      place: 'market',
      title: { en: 'Finding one fruit stall in Mandai', mr: 'मंडईत एक फळांचा stall शोधणं' },
      story: {
        en: 'Aai sends Meera to buy mangoes from Joshi kaka in Mandai. Meera\'s brother once wrote the directions as "third stall on the left after the pillar". Then two new stalls opened near the pillar, and he bought from the wrong one. "The fruit stall" is no better: there are ten fruit stalls, and a sensible person stops and asks "which one?" instead of picking any. What works is what every shopper sees: "the fruit stall with the board Joshi Fruits". It still works when the stalls shift, and if two stalls ever had the same board, you would add one more detail, like "the one selling Ratnagiri hapus".',
        mr: 'आई मीराला मंडईतल्या जोशी काकांकडून आंबे आणायला पाठवते. मीराच्या भावाने एकदा रस्ता असा लिहिला होता: "खांबानंतर डावीकडचा तिसरा stall". मग खांबाजवळ दोन नवे stalls उघडले, आणि त्याने चुकीच्या stall वरून आंबे घेतले. "फळांचा stall" हेही काही बरं नाही: फळांचे दहा stalls आहेत, आणि शहाणा माणूस कोणताही न निवडता थांबून विचारतो "नेमका कोणता?". जे चालतं ते प्रत्येक ग्राहकाला दिसतं: "Joshi Fruits पाटी असलेला फळांचा stall". stalls इकडे तिकडे झाले तरी ते चालतं, आणि कधी दोन stalls ची पाटी सारखी असली तर तुम्ही एक तपशील जोडता, जसं "रत्नागिरी हापूस विकणारा".',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Find: the fruit stall with the board "Joshi Fruits" (role + name)', mr: 'शोधा: "Joshi Fruits" पाटी असलेला फळांचा stall (role + name)' },
        items: [
          { icon: '🍌', label: 'Fruit stall, board: Patil Fruits', mr: 'फळांचा stall, पाटी: Patil Fruits', pass: false },
          { icon: '🥭', label: 'Fruit stall, board: Joshi Fruits', mr: 'फळांचा stall, पाटी: Joshi Fruits', pass: true },
          { icon: '🥬', label: 'Vegetable stall, board: Joshi Bhaji', mr: 'भाजीचा stall, पाटी: Joshi Bhaji', pass: false },
          { icon: '🌼', label: 'Flower stall, third after the pillar', mr: 'फुलांचा stall, खांबानंतर तिसरा', pass: false },
          { icon: '🍋', label: 'Fruit stall, board: Shinde Fruits', mr: 'फळांचा stall, पाटी: Shinde Fruits', pass: false },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'worried', text: { en: 'The old suite used XPath like /html/body/div[2]/form/button[1]. I moved the Track bag button into a new card yesterday and 40 tests broke.', mr: 'जुन्या suite मध्ये /html/body/div[2]/form/button[1] सारखे XPath होते. काल मी Track bag बटण एका नव्या card मध्ये हलवलं आणि 40 tests मोडल्या.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'i don\'t even need bugs. i wrap one thing in one more div and your whole suite cries. lol.', mr: 'मला bugs ची गरजच नाही. एका गोष्टीभोवती एक div जास्त गुंडाळला की तुमचा पूर्ण suite रडतो. lol.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'So we find things the way a passenger does, {name}. A button named Track bag. A box labelled Bag tag number. The layout can move; those stay.', mr: 'म्हणून आपण प्रवासी शोधतो तशा गोष्टी शोधतो, {name}. Track bag नावाचं बटण. Bag tag number label असलेला box. layout हलू शकतो; हे टिकतात.' } },
        { who: 'meera', mood: 'happy', text: { en: 'And if a locator matches two things, Playwright stops and tells you. No silent clicks on the wrong flight.', mr: 'आणि एका locator ला दोन गोष्टी सापडल्या तर Playwright थांबून सांगतो. चुकीच्या flight वर गुपचूप click नाही.' } },
      ],
      problem: { en: 'Locators tied to layout (long CSS paths, XPath, nth-child) break whenever the page is rearranged, and when a locator matches several elements, a test may quietly act on the wrong one.', mr: 'layout ला बांधलेले locators (लांब CSS paths, XPath, nth-child) page ची मांडणी बदलली की मोडतात, आणि एका locator ला अनेक elements सापडले तर test गुपचूप चुकीच्या element वर काम करू शकते.' },
      solution: { en: 'Use user-facing locators: getByRole with a name first, then getByLabel, getByPlaceholder, getByText, and getByTestId. Strict mode refuses to guess when a locator matches several elements; you make it specific with a better name, exact: true, or filter({ hasText }).', mr: 'user ला दिसणारे locators वापरा: आधी name सह getByRole, मग getByLabel, getByPlaceholder, getByText, आणि getByTestId. एका locator ला अनेक elements सापडले तर strict mode अंदाज लावत नाही; चांगलं name, exact: true किंवा filter({ hasText }) वापरून तुम्ही तो नेमका करता.' },
    },
    lesson: [
      { en: 'The user-facing locators: getByRole(\'button\', { name: \'Track bag\' }) finds by role (button, link, heading, checkbox, textbox, region...) and accessible name. getByLabel(\'Bag tag number\') finds a form field by its label. getByPlaceholder(\'e.g. SH482913\') uses the grey hint text. getByText(\'Ready at belt 4\') finds visible text. getByTestId(\'bag-status\') uses a data-testid that developers add for tests. Recommended order: role first, then label, placeholder, text, test id. CSS and XPath come last.', mr: 'user ला दिसणारे locators: getByRole(\'button\', { name: \'Track bag\' }) role (button, link, heading, checkbox, textbox, region...) आणि accessible name वरून शोधतो. getByLabel(\'Bag tag number\') form field त्याच्या label वरून शोधतो. getByPlaceholder(\'e.g. SH482913\') राखाडी hint मजकूर वापरतो. getByText(\'Ready at belt 4\') दिसणारा मजकूर शोधतो. getByTestId(\'bag-status\') developers ने tests साठी लावलेला data-testid वापरतो. सुचवलेला क्रम: आधी role, मग label, placeholder, text, test id. CSS आणि XPath शेवटी.' },
      { en: 'The accessible name is what a screen reader would announce: the label text for an input, the text inside a button, link or heading, the aria-label of a region. By default a name or text matches ignoring case and as a part: { name: \'Track\' } matches both "Track bag" and "Track baggage". Add exact: true when you need the whole text.', mr: 'accessible name म्हणजे screen reader जे वाचून दाखवेल ते: input साठी label चा मजकूर, button, link किंवा heading मधला मजकूर, region चा aria-label. मूलतः name किंवा text capital/small न पाहता आणि भागाने जुळतं: { name: \'Track\' } "Track bag" आणि "Track baggage" दोन्हीशी जुळतं. पूर्ण मजकूर हवा असेल तर exact: true जोडा.' },
      { en: 'Strict mode: if an action or assertion\'s locator matches more than one element, Playwright fails with "strict mode violation: ... resolved to 5 elements" and lists them. Selenium\'s findElement would quietly take the first one, the wrong mango stall. Fix it by being more specific: a more exact role and name, exact: true, or narrowing a list with filter({ hasText: \'SH 201\' }) and then chaining getByRole inside it. Use first() only when you truly mean "the first one".', mr: 'strict mode: action किंवा assertion च्या locator ला एकापेक्षा जास्त elements सापडले तर Playwright "strict mode violation: ... resolved to 5 elements" देऊन fail होतो आणि त्यांची यादी दाखवतो. Selenium चा findElement गुपचूप पहिला घेतो, चुकीचा आंब्याचा stall. जास्त नेमके व्हा: जास्त अचूक role आणि name, exact: true, किंवा filter({ hasText: \'SH 201\' }) ने यादी कमी करा आणि मग तिच्या आत getByRole जोडा. first() फक्त तुम्हाला खरंच "पहिला" हवा असेल तेव्हाच.' },
      { en: 'Why layout-based CSS and XPath are fragile: \'#bag-result p:nth-child(3)\' or \'/html/body/main/div[2]/button\' describe where something sits, "third stall after the pillar". One extra div and they break, or worse, point at something else. User-facing locators also test the page for free: if a field has no proper label, getByLabel cannot find it, and you have found an accessibility bug.', mr: 'layout वर आधारित CSS आणि XPath नाजूक का: \'#bag-result p:nth-child(3)\' किंवा \'/html/body/main/div[2]/button\' एखादी गोष्ट कुठे बसली आहे ते सांगतात, "खांबानंतरचा तिसरा stall". एक div जास्त आला की ते मोडतात, किंवा त्याहून वाईट, दुसऱ्याच गोष्टीकडे बोट दाखवतात. user ला दिसणारे locators page ची मोफत चाचणीही करतात: field ला नीट label नसेल तर getByLabel ला तो सापडत नाही, आणि तुम्हाला accessibility bug सापडतो.' },
    ],
    syntax: {
      template: `page.getByRole('button', { name: 'Track bag' })
page.getByLabel('Bag tag number')
page.getByPlaceholder('e.g. SH482913')
page.getByText('Ready at belt 4')
page.getByTestId('bag-status')
page.getByTestId('flight-card').filter({ hasText: 'SH 201' }).getByRole('button', { name: 'Select' })`,
      parts: [
        { code: "getByRole(role, { name })", means: { en: 'first choice: what the element is, and what it is called', mr: 'पहिली निवड: element काय आहे, आणि त्याचं नाव काय' } },
        { code: "getByLabel('...')", means: { en: 'a form field by its label text', mr: 'label च्या मजकुरावरून form field' } },
        { code: "getByPlaceholder('...')", means: { en: 'an input by its grey hint text', mr: 'राखाडी hint मजकुरावरून input' } },
        { code: "getByText('...')", means: { en: 'an element by the text a user reads', mr: 'user वाचतो त्या मजकुरावरून element' } },
        { code: "getByTestId('...')", means: { en: 'by data-testid, a tag developers add just for tests', mr: 'data-testid वरून, developers फक्त tests साठी लावतात तो tag' } },
        { code: '{ exact: true }', means: { en: 'match the whole text, not a part', mr: 'पूर्ण मजकूर जुळवा, भाग नाही' } },
        { code: ".filter({ hasText: '...' })", means: { en: 'keep only the matches that contain this text', mr: 'हा मजकूर असलेलेच matches ठेवा' } },
      ],
      example: [
        { code: "await page.getByLabel('Bag tag number').fill('SH482913');", note: { en: 'the stall by its board, not its position', mr: 'stall त्याच्या पाटीवरून, जागेवरून नाही' } },
        { code: "await page.getByRole('button', { name: 'Track bag' }).click();", note: { en: 'a button, named Track bag: what every passenger sees', mr: 'Track bag नावाचं बटण: प्रत्येक प्रवाशाला दिसतं तेच' } },
        { code: "await expect(page.getByTestId('bag-status')).toHaveText('Ready at belt 4');", note: { en: 'a tag the shopkeeper put there just for you', mr: 'दुकानदाराने खास तुमच्यासाठी लावलेली खूण' } },
        { code: "const card = page.getByTestId('flight-card').filter({ hasText: 'SH 201' });", note: { en: '"a fruit stall" matches ten; keep the one with the right board', mr: '"फळांचा stall" दहांशी जुळतं; योग्य पाटीवाला ठेवा' } },
        { code: "await card.getByRole('button', { name: 'Select' }).click();", note: { en: 'now "Select" means exactly one button', mr: 'आता "Select" म्हणजे नेमकं एकच बटण' } },
      ],
      pitfall: { en: 'Names match a part of the text by default, so { name: \'Track\' } can match two buttons. And a password box has no textbox role: use getByLabel(\'Password\'), not getByRole(\'textbox\', ...).', mr: 'मूलतः name मजकुराच्या भागाशी जुळतं, म्हणून { name: \'Track\' } दोन बटणांशी जुळू शकतं. आणि password box ला textbox role नसतो: getByRole(\'textbox\', ...) नव्हे, getByLabel(\'Password\') वापरा.' },
    },
    practice: {
      intro: { en: 'Replace layout-based locators with user-facing ones, then meet strict mode and fix it. Some steps refuse CSS on purpose, so you practise the new habit.', mr: 'layout वर आधारित locators बदलून user ला दिसणारे locators वापरा, मग strict mode ला भेटा आणि तो सोडवा. काही steps मुद्दाम CSS नाकारतात, म्हणजे नव्या सवयीचा सराव होईल.' },
      steps: [
        {
          kind: 'playwright',
          prompt: { en: 'This test works today, but it is written the old way with CSS tied to the layout. Rewrite the three locators: the box by its label "Bag tag number", the button by role and name "Track bag", and the status by its test id "bag-status". No page.locator(...) allowed.', mr: 'ही test आज चालते, पण layout ला बांधलेल्या CSS ने जुन्या पद्धतीने लिहिली आहे. तीन locators पुन्हा लिहा: box त्याच्या "Bag tag number" label ने, बटण role आणि name "Track bag" ने, आणि status त्याच्या "bag-status" test id ने. page.locator(...) चालणार नाही.' },
          startUrl: `${SKY}/baggage`,
          starter: `${IMPORT}test('Asha can track her bag', async ({ page }) => {
  await page.goto('/baggage');
  // TODO: rewrite these three locators the way a passenger sees the page
  await page.locator('#bag-tag').fill('SH482913');
  await page.locator('form > button.btn-primary').click();
  await expect(page.locator('div#bag-result p:nth-child(3)')).toHaveText('Ready at belt 4');
});
`,
          solution: `${IMPORT}test('Asha can track her bag', async ({ page }) => {
  await page.goto('/baggage');
  await page.getByLabel('Bag tag number').fill('SH482913');
  await page.getByRole('button', { name: 'Track bag' }).click();
  await expect(page.getByTestId('bag-status')).toHaveText('Ready at belt 4');
});`,
          minAssertions: 1,
          mustUse: [
            { pattern: "getByLabel\\(\\s*['\"`]Bag tag number['\"`]", message: { en: "Find the box by its label: page.getByLabel('Bag tag number').", mr: "box त्याच्या label ने शोधा: page.getByLabel('Bag tag number')." } },
            { pattern: "getByRole\\(\\s*['\"`]button['\"`]\\s*,\\s*\\{\\s*name:\\s*['\"`]Track bag['\"`]", message: { en: "Find the button by role and name: page.getByRole('button', { name: 'Track bag' }).", mr: "बटण role आणि name ने शोधा: page.getByRole('button', { name: 'Track bag' })." } },
            { pattern: "getByTestId\\(\\s*['\"`]bag-status['\"`]", message: { en: "Read the status with page.getByTestId('bag-status').", mr: "status page.getByTestId('bag-status') ने वाचा." } },
          ],
          mustNotUse: [{ pattern: '\\.locator\\(', message: { en: 'It passes, but it still uses page.locator(...) with CSS tied to the layout. Replace every one with a user-facing locator.', mr: 'pass होतं, पण अजून layout ला बांधलेल्या CSS सह page.locator(...) वापरलं आहे. प्रत्येक ठिकाणी user ला दिसणारा locator वापरा.' } }],
          hints: [
            { en: 'Look at the practice browser: the box is labelled "Bag tag number" and the button says "Track bag".', mr: 'practice browser पाहा: box चा label "Bag tag number" आहे आणि बटणावर "Track bag" लिहिलं आहे.' },
            { en: "page.getByLabel('Bag tag number') and page.getByRole('button', { name: 'Track bag' })", mr: "page.getByLabel('Bag tag number') आणि page.getByRole('button', { name: 'Track bag' })" },
            { en: "await page.getByLabel('Bag tag number').fill('SH482913');\nawait page.getByRole('button', { name: 'Track bag' }).click();\nawait expect(page.getByTestId('bag-status')).toHaveText('Ready at belt 4');", mr: "await page.getByLabel('Bag tag number').fill('SH482913');\nawait page.getByRole('button', { name: 'Track bag' }).click();\nawait expect(page.getByTestId('bag-status')).toHaveText('Ready at belt 4');" },
          ],
          successLine: { en: 'Theo can now move that button into any card he likes. Your test does not care where it sits.', mr: 'आता Theo ते बटण हव्या त्या card मध्ये हलवू शकतो. ते कुठे बसलं आहे याची तुमच्या test ला पर्वा नाही.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Web check-in for booking SKY1A2. Fill the PNR box by its placeholder "6 characters, like SKY1A2", fill "Last name" (by its label) with Patil, click "Find booking". Then check the "Boarding pass" region is visible and the gate (test id "gate") says B7.', mr: 'booking SKY1A2 साठी web check-in. PNR box त्याच्या "6 characters, like SKY1A2" placeholder ने भरा, "Last name" (label ने) मध्ये Patil भरा, "Find booking" वर click करा. मग "Boarding pass" region दिसतो आणि gate (test id "gate") B7 आहे हे तपासा.' },
          startUrl: `${SKY}/checkin`,
          starter: `${IMPORT}test('Asha checks in online', async ({ page }) => {
  await page.goto('/checkin');
  // TODO: fill SKY1A2 into the box with placeholder '6 characters, like SKY1A2'
  // TODO: fill Patil into the box labelled 'Last name'
  // TODO: click the 'Find booking' button
  // TODO: expect the region 'Boarding pass' to be visible
  // TODO: expect the gate (test id 'gate') to have text 'B7'
});
`,
          solution: `${IMPORT}test('Asha checks in online', async ({ page }) => {
  await page.goto('/checkin');
  await page.getByPlaceholder('6 characters, like SKY1A2').fill('SKY1A2');
  await page.getByLabel('Last name').fill('Patil');
  await page.getByRole('button', { name: 'Find booking' }).click();
  await expect(page.getByRole('region', { name: 'Boarding pass' })).toBeVisible();
  await expect(page.getByTestId('gate')).toHaveText('B7');
});`,
          minAssertions: 2,
          mustUse: [
            { pattern: 'getByPlaceholder\\(', message: { en: "Fill the PNR box with page.getByPlaceholder('6 characters, like SKY1A2').", mr: "PNR box page.getByPlaceholder('6 characters, like SKY1A2') ने भरा." } },
            { pattern: "getByLabel\\(\\s*['\"`]Last name['\"`]", message: { en: "Fill the last name with page.getByLabel('Last name').", mr: "last name page.getByLabel('Last name') ने भरा." } },
            { pattern: "getByRole\\(\\s*['\"`]region['\"`]", message: { en: "Check the boarding pass with page.getByRole('region', { name: 'Boarding pass' }).", mr: "boarding pass page.getByRole('region', { name: 'Boarding pass' }) ने तपासा." } },
          ],
          mustNotUse: [{ pattern: '\\.locator\\(', message: { en: 'Use user-facing locators here, not page.locator(...).', mr: 'इथे page.locator(...) नव्हे, user ला दिसणारे locators वापरा.' } }],
          hints: [
            { en: 'A region is a section with a name. Here its name is "Boarding pass".', mr: 'region म्हणजे नाव असलेला section. इथे त्याचं नाव "Boarding pass" आहे.' },
            { en: "await page.getByPlaceholder('6 characters, like SKY1A2').fill('SKY1A2');\nawait page.getByLabel('Last name').fill('Patil');", mr: "await page.getByPlaceholder('6 characters, like SKY1A2').fill('SKY1A2');\nawait page.getByLabel('Last name').fill('Patil');" },
            { en: "await page.getByRole('button', { name: 'Find booking' }).click();\nawait expect(page.getByRole('region', { name: 'Boarding pass' })).toBeVisible();\nawait expect(page.getByTestId('gate')).toHaveText('B7');", mr: "await page.getByRole('button', { name: 'Find booking' }).click();\nawait expect(page.getByRole('region', { name: 'Boarding pass' })).toBeVisible();\nawait expect(page.getByTestId('gate')).toHaveText('B7');" },
          ],
          successLine: { en: 'Placeholder, label, role, test id: four kinds of locator in one short test. Asha boards at gate B7.', mr: 'placeholder, label, role, test id: एका छोट्या test मध्ये चार प्रकारचे locators. आशा gate B7 वरून विमानात बसते.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Rex wants to pick a flight on the results page. Press Run and read the report. Why did the click fail?', mr: 'Rex ला results page वर एक flight निवडायची आहे. Run दाबा आणि report वाचा. click fail का झाला?' },
          playwrightSandbox: { code: `${IMPORT}test('pick a flight', async ({ page }) => {\n  await page.goto('${FLIGHTS}');\n  await page.getByRole('button', { name: 'Select' }).click();\n});`, startUrl: `${SKY}${FLIGHTS}` },
          options: [
            { en: 'The Select button is disabled', mr: 'Select बटण disabled आहे' },
            { en: 'The flights had not loaded, so Playwright gave up at once', mr: 'flights load झाल्या नव्हत्या, म्हणून Playwright ने लगेच सोडून दिलं' },
            { en: 'Strict mode violation: there are 5 Select buttons, one per flight, and Playwright refuses to guess which one', mr: 'strict mode violation: 5 Select बटणं आहेत, प्रत्येक flight ला एक, आणि Playwright कोणतं ते अंदाजाने ठरवत नाही' },
            { en: 'Playwright clicked the first Select, so SH 201 was booked', mr: 'Playwright ने पहिल्या Select वर click केला, म्हणून SH 201 book झाली' },
          ],
          correct: [2],
          explain: { en: 'The report says getByRole(\'button\', { name: \'Select\' }) resolved to 5 elements and lists them. Selenium would have clicked the first one silently. Playwright makes you say which flight you mean.', mr: 'report सांगतो की getByRole(\'button\', { name: \'Select\' }) ला 5 elements सापडले, आणि त्यांची यादी दाखवतो. Selenium ने गुपचूप पहिल्यावर click केला असता. Playwright तुम्हाला कोणती flight ते सांगायला लावतो.' },
          hints: [
            { en: 'Look for the words "resolved to" in the red report.', mr: 'लाल report मध्ये "resolved to" हे शब्द शोधा.' },
            { en: 'Count the Select buttons in the browser on the right.', mr: 'उजवीकडच्या browser मधली Select बटणं मोजा.' },
          ],
          successLine: { en: 'Ten fruit stalls, one name. Playwright asks "which one?" instead of guessing.', mr: 'फळांचे दहा stalls, एक नाव. Playwright अंदाज न लावता विचारतो "नेमका कोणता?".' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Fix Rex\'s test so it picks SH 412. Narrow the flight cards (test id "flight-card") with filter({ hasText: \'SH 412\' }), then click the Select button inside that card. The checks after it are already written.', mr: 'Rex ची test दुरुस्त करा म्हणजे ती SH 412 निवडेल. flight cards (test id "flight-card") filter({ hasText: \'SH 412\' }) ने कमी करा, मग त्या card मधल्या Select बटणावर click करा. नंतरचे checks आधीच लिहिलेले आहेत.' },
          startUrl: `${SKY}${FLIGHTS}`,
          starter: `${IMPORT}test('pick SH 412', async ({ page }) => {
  await page.goto('${FLIGHTS}');
  // TODO: this matches 5 buttons. Narrow it to the SH 412 card first.
  await page.getByRole('button', { name: 'Select' }).click();
  await expect(page).toHaveTitle('Choose your seat | SkyHop');
  await expect(page.getByTestId('flight-summary')).toContainText('SH 412');
});
`,
          solution: `${IMPORT}test('pick SH 412', async ({ page }) => {
  await page.goto('${FLIGHTS}');
  const card = page.getByTestId('flight-card').filter({ hasText: 'SH 412' });
  await card.getByRole('button', { name: 'Select' }).click();
  await expect(page).toHaveTitle('Choose your seat | SkyHop');
  await expect(page.getByTestId('flight-summary')).toContainText('SH 412');
});`,
          minAssertions: 2,
          mustUse: [{ pattern: 'filter\\(\\s*\\{\\s*hasText\\s*:', message: { en: "Narrow the cards with .filter({ hasText: 'SH 412' }).", mr: "cards .filter({ hasText: 'SH 412' }) ने कमी करा." } }],
          mustNotUse: [{ pattern: '\\.(first|last|nth)\\(', message: { en: 'first(), last() or nth() pick by position, the "third stall" again. A new flight at 08:00 would shift them. Filter by the flight number instead.', mr: 'first(), last() किंवा nth() जागेवरून निवडतात, पुन्हा "तिसरा stall". सकाळी 08:00 ची नवी flight आली की त्या सरकतील. त्याऐवजी flight नंबरने filter करा.' } }],
          hints: [
            { en: "First keep only the card that mentions SH 412: page.getByTestId('flight-card').filter({ hasText: 'SH 412' })", mr: "आधी SH 412 असलेलं card च ठेवा: page.getByTestId('flight-card').filter({ hasText: 'SH 412' })" },
            { en: 'Store it in a const, then chain getByRole on it. A locator inside a locator searches only inside it.', mr: 'ते एका const मध्ये ठेवा, मग त्यावर getByRole जोडा. locator च्या आतला locator फक्त त्याच्या आतच शोधतो.' },
            { en: "const card = page.getByTestId('flight-card').filter({ hasText: 'SH 412' });\nawait card.getByRole('button', { name: 'Select' }).click();", mr: "const card = page.getByTestId('flight-card').filter({ hasText: 'SH 412' });\nawait card.getByRole('button', { name: 'Select' }).click();" },
          ],
          successLine: { en: 'Filter the list, then act inside one item. You will use this pattern on every list in SkyHop.', mr: 'यादी filter करा, मग एका item च्या आत काम करा. SkyHop मधल्या प्रत्येक यादीवर तुम्ही हीच पद्धत वापराल.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Rohan\'s bag again. The starter fails with a strict mode violation: getByLabel(\'Bag\') matches the form "Track a bag" and the input. Fix it with the full label. Then check the heading "Bag SH771205" is visible and the text "Misrouted to Mumbai" is visible (getByText). A hidden build where the misrouted bag says "Ready at belt 4" must turn your test red.', mr: 'पुन्हा रोहनची bag. starter strict mode violation देऊन fail होतो: getByLabel(\'Bag\') "Track a bag" form आणि input दोन्हींशी जुळतो. पूर्ण label वापरून तो दुरुस्त करा. मग "Bag SH771205" heading दिसतं आणि "Misrouted to Mumbai" मजकूर दिसतो (getByText) हे तपासा. misrouted bag "Ready at belt 4" दाखवणाऱ्या लपवलेल्या build वर तुमची test लाल व्हायला हवी.' },
          startUrl: `${SKY}/baggage`,
          starter: `${IMPORT}test('Rohan sees where his bag is', async ({ page }) => {
  await page.goto('/baggage');
  // TODO: strict mode violation. Use the full label of the box.
  await page.getByLabel('Bag').fill('SH771205');
  await page.getByRole('button', { name: 'Track bag' }).click();
  // TODO: expect the heading 'Bag SH771205' to be visible
  // TODO: expect the text 'Misrouted to Mumbai' to be visible
});
`,
          solution: `${IMPORT}test('Rohan sees where his bag is', async ({ page }) => {
  await page.goto('/baggage');
  await page.getByLabel('Bag tag number').fill('SH771205');
  await page.getByRole('button', { name: 'Track bag' }).click();
  await expect(page.getByRole('heading', { name: 'Bag SH771205' })).toBeVisible();
  await expect(page.getByText('Misrouted to Mumbai')).toBeVisible();
});`,
          minAssertions: 2,
          mustUse: [
            { pattern: "getByRole\\(\\s*['\"`]heading['\"`]", message: { en: "Check the heading with page.getByRole('heading', { name: 'Bag SH771205' }).", mr: "heading page.getByRole('heading', { name: 'Bag SH771205' }) ने तपासा." } },
            { pattern: 'getByText\\(', message: { en: "Check the message with page.getByText('Misrouted to Mumbai').", mr: "message page.getByText('Misrouted to Mumbai') ने तपासा." } },
          ],
          mustNotUse: [{ pattern: "getByLabel\\(\\s*['\"`]Bag['\"`]\\s*\\)", message: { en: "getByLabel('Bag') still matches two elements. Use the full label 'Bag tag number'.", mr: "getByLabel('Bag') अजून दोन elements शी जुळतो. पूर्ण label 'Bag tag number' वापरा." } }],
          mustCatch: [{ bug: 'bag-status', label: { en: 'A misrouted bag says "Ready at belt 4"', mr: 'misrouted bag "Ready at belt 4" दाखवते' } }],
          hints: [
            { en: 'Read the report: the two matches are the form (aria-label "Track a bag") and the input (label "Bag tag number"). Names match a part of the text, so "Bag" fits both.', mr: 'report वाचा: दोन matches म्हणजे form (aria-label "Track a bag") आणि input (label "Bag tag number"). name मजकुराच्या भागाशी जुळतं, म्हणून "Bag" दोन्हींना लागू होतं.' },
            { en: "await page.getByLabel('Bag tag number').fill('SH771205');", mr: "await page.getByLabel('Bag tag number').fill('SH771205');" },
            { en: "await expect(page.getByRole('heading', { name: 'Bag SH771205' })).toBeVisible();\nawait expect(page.getByText('Misrouted to Mumbai')).toBeVisible();", mr: "await expect(page.getByRole('heading', { name: 'Bag SH771205' })).toBeVisible();\nawait expect(page.getByText('Misrouted to Mumbai')).toBeVisible();" },
          ],
          successLine: { en: 'Strict mode fixed, and your getByText check caught the lying status on the buggy build. Rohan\'s bag is coming home.', mr: 'strict mode सुटला, आणि तुमच्या getByText check ने buggy build वरचा खोटा status पकडला. रोहनची bag घरी येते आहे.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Which locator should you prefer for the Track bag button?', mr: 'Track bag बटणासाठी कोणता locator पसंत करावा?' },
        options: [
          "page.locator('#track-btn')",
          "page.locator('form > button:nth-child(4)')",
          "page.locator('//main/form/button')",
          "page.getByRole('button', { name: 'Track bag' })",
        ],
        answer: 3,
        explain: { en: 'Role plus name is what a passenger sees. It survives layout changes, and it fails if the button loses its accessible name, which is a real bug.', mr: 'role आणि name म्हणजे प्रवाशाला दिसतं ते. layout बदलला तरी टिकतं, आणि बटणाचं accessible name गेलं तर fail होतं, जो खरा bug आहे.' },
      },
      {
        q: { en: 'On the confirmation page this fails. What is the best fix?', mr: 'confirmation page वर हे fail होतं. सगळ्यात चांगला उपाय कोणता?' },
        code: "await page.getByRole('link', { name: 'my trips' }).click();\n\nError: strict mode violation: getByRole('link', { name: 'my trips' }) resolved to 2 elements:\n    1) <a href=\"/trips\">My trips</a>\n    2) <a class=\"btn\" href=\"/trips\">View my trips</a>",
        options: [
          { en: 'Add page.waitForTimeout(3000) before the click', mr: 'click आधी page.waitForTimeout(3000) जोडा' },
          { en: "Ask for the whole name: getByRole('link', { name: 'My trips', exact: true })", mr: "पूर्ण name मागा: getByRole('link', { name: 'My trips', exact: true })" },
          { en: 'Switch to an XPath with the full path to the link', mr: 'link च्या पूर्ण path सह XPath वापरा' },
          { en: 'Nothing: Playwright will click the first one anyway', mr: 'काहीच नाही: Playwright तसाही पहिल्यावर click करेल' },
        ],
        answer: 1,
        explain: { en: 'Names match a part of the text, so "my trips" also fits "View my trips". exact: true wants the whole name. Waiting does not change the count, and Playwright never clicks "the first" on its own.', mr: 'name मजकुराच्या भागाशी जुळतं, म्हणून "my trips" हे "View my trips" शीही जुळतं. exact: true ला पूर्ण name हवं. वाट पाहिल्याने संख्या बदलत नाही, आणि Playwright स्वतःहून कधीच "पहिल्यावर" click करत नाही.' },
      },
      {
        q: { en: 'Which line fills the password box on the SkyHop login page?', mr: 'SkyHop च्या login page वरचा password box कोणती ओळ भरते?' },
        options: [
          "await page.getByRole('textbox', { name: 'Password' }).fill('fly123');",
          "await page.getByRole('button', { name: 'Password' }).fill('fly123');",
          "await page.getByLabel('Password').fill('fly123');",
          "await page.getByText('fly123').fill('Password');",
        ],
        answer: 2,
        explain: { en: 'Password inputs have no textbox role, so getByRole(\'textbox\') will not find them. getByLabel finds any field by its label.', mr: 'password inputs ना textbox role नसतो, म्हणून getByRole(\'textbox\') ला ते सापडत नाहीत. getByLabel कोणताही field त्याच्या label वरून शोधतो.' },
      },
      {
        q: { en: 'Why is page.locator(\'#bag-result > section > p:nth-child(3)\') a fragile locator?', mr: 'page.locator(\'#bag-result > section > p:nth-child(3)\') हा नाजूक locator का आहे?' },
        options: [
          { en: 'It depends on the layout: one extra element breaks it or points it at something else, and it says nothing about what a user sees', mr: 'तो layout वर अवलंबून आहे: एक element जास्त आला की तो मोडतो किंवा दुसऱ्याच गोष्टीकडे जातो, आणि user ला काय दिसतं याबद्दल तो काहीच सांगत नाही' },
          { en: 'CSS selectors are not allowed in Playwright', mr: 'Playwright मध्ये CSS selectors चालत नाहीत' },
          { en: 'nth-child only works in Firefox', mr: 'nth-child फक्त Firefox मध्ये चालतं' },
          { en: 'It is too short to be unique', mr: 'तो एकमेव असण्याइतका लांब नाही' },
        ],
        answer: 0,
        explain: { en: 'It is "the third stall after the pillar". Playwright does support CSS, but getByTestId(\'bag-status\') or a role and name will survive the next redesign.', mr: 'हा म्हणजे "खांबानंतरचा तिसरा stall". Playwright मध्ये CSS चालतं, पण पुढच्या redesign नंतरही getByTestId(\'bag-status\') किंवा role आणि name टिकतील.' },
      },
    ],
    recap: { line: { en: 'Find things the way a user sees them: getByRole with a name first, then label, placeholder, text, test id. When strict mode says "resolved to 2 elements", get more specific with a name, exact: true or filter.', mr: 'user ला दिसतं तसं शोधा: आधी name सह getByRole, मग label, placeholder, text, test id. strict mode "resolved to 2 elements" म्हणाला की name, exact: true किंवा filter ने जास्त नेमके व्हा.' }, icon: '🧭' },
  },
]
