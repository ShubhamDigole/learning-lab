import type { Lesson } from './types.ts'

// Playwright "Start here": what Playwright is (and how it differs from Selenium), then just enough TypeScript.

const SKY = 'https://skyhop.test'

const TRACK_SPEC = `import { test, expect } from '@playwright/test';

test('a passenger can track a bag', async ({ page }) => {
  await page.goto('/baggage');
  await page.getByLabel('Bag tag number').fill('SH482913');
  await page.getByRole('button', { name: 'Track bag' }).click();
  await expect(page.getByTestId('bag-status')).toHaveText('Ready at belt 4');
});`

const FLIGHTS_SPEC = `import { test, expect } from '@playwright/test';

test('search shows five flights', async ({ page }) => {
  await page.goto('/flights?from=PNQ&to=DEL&date=2026-12-20&pax=1');
  // No sleep, no WebDriverWait. Watch the "Searching flights..." message first.
  await expect(page.getByTestId('result-count')).toHaveText('5 flights');
});`

const HOME_SPEC = `// A ready test. Press Run, watch the browser on the right, then press Submit.
import { test, expect } from '@playwright/test';

test('home page greets passengers', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('SkyHop | Fly happy');
  await expect(page.getByRole('heading', { name: 'Where to next?' })).toBeVisible();
});`

export const pwStartLessons: Lesson[] = [
  // ───────────────────────── W0.1 Meet Playwright
  {
    id: 'pw0-1',
    code: 'W0.1',
    level: 'basic',
    title: { en: 'Meet Playwright', mr: 'Playwright ची ओळख' },
    skill: 'What Playwright is and why teams pick it',
    realLife: {
      place: 'station',
      title: { en: 'Meeting Aaji off the Deccan Queen', mr: 'डेक्कन क्वीनवरून येणाऱ्या आजींना घ्यायला जाणं' },
      story: {
        en: 'Meera\'s father is going to Pune station to meet Aaji off the Deccan Queen. The old way, he guesses: he stands on the platform for a fixed 30 minutes, or walks up to the enquiry window every five minutes to ask "aali ka?". When the train is late he gives up too early. This time he watches the live board. It simply waits, and lights up the moment the train arrives. He does not count "the seventh coach from the engine" either, because the railway sometimes adds a coach in front. He looks for the coach board that says C3. He checks the seat number on Aaji\'s ticket, and his phone keeps a photo of every step, in case anyone asks later what happened.',
        mr: 'मीराचे बाबा डेक्कन क्वीनवरून येणाऱ्या आजींना घ्यायला पुणे स्टेशनला जातात. जुनी पद्धत म्हणजे अंदाज: ते platform वर ठरवून 30 मिनिटं उभे राहतात, किंवा दर पाच मिनिटांनी चौकशी खिडकीवर जाऊन "आली का?" विचारतात. गाडी उशिरा आली की ते खूप लवकर कंटाळून जातात. या वेळी ते live board बघतात. तो फक्त वाट पाहतो, आणि गाडी आली त्या क्षणी उजळतो. "engine पासून सातवा डबा" असंही ते मोजत नाहीत, कारण railway कधी कधी पुढे एक डबा जोडते. ते C3 लिहिलेली डब्याची पाटी शोधतात. आजींच्या तिकिटावरचा seat नंबर तपासतात, आणि नंतर कोणी विचारलं की काय झालं, म्हणून त्यांचा फोन प्रत्येक पायरीचा फोटो ठेवतो.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🚉', label: 'Go to the station (page.goto)', mr: 'स्टेशनला जा (page.goto)' },
          { icon: '⏳', label: 'The board waits for the train (auto-waiting)', mr: 'board गाडीची वाट पाहतो (auto-waiting)' },
          { icon: '🪧', label: 'Find the coach by its board C3 (getByRole)', mr: 'C3 पाटीवरून डबा शोधा (getByRole)' },
          { icon: '✅', label: 'Check the seat number (expect)', mr: 'seat नंबर तपासा (expect)' },
          { icon: '📸', label: 'A photo of every step (trace)', mr: 'प्रत्येक पायरीचा फोटो (trace)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Three passengers flew to Delhi this week and their bags went to Mumbai. And our release checks take four hours and fail at random.', mr: 'या आठवड्यात तीन प्रवासी दिल्लीला गेले आणि त्यांच्या bags मुंबईला गेल्या. आणि आपले release checks चार तास घेतात आणि मधेच कधीही fail होतात.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'The old Selenium suite has Thread.sleep(5000) everywhere. When the server is slow it fails, when it is fast it wastes time.', mr: 'जुन्या Selenium suite मध्ये सगळीकडे Thread.sleep(5000) आहे. server हळू असला की fail होते, जलद असला की वेळ वाया जातो.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'flaky tests are my favourite hiding place. red every morning means nobody reads the report. hehe.', mr: 'flaky tests म्हणजे माझी आवडती लपायची जागा. रोज सकाळी लाल म्हणजे report कोणीच वाचत नाही. हेहे.' } },
        { who: 'rex', mood: 'happy', text: { en: 'Time to bring in Playwright, {name}. It waits on its own, finds things the way a passenger sees them, and records a trace of every run.', mr: 'आता Playwright आणायची वेळ आली, {name}. तो स्वतःहून वाट पाहतो, प्रवाशाला जसं दिसतं तशा गोष्टी शोधतो, आणि प्रत्येक run चा trace ठेवतो.' } },
        { who: 'meera', mood: 'happy', text: { en: 'And you already know the tester\'s half: what to check. Playwright is a sharper tool for it.', mr: 'आणि tester चा अर्धा भाग तुला आधीच येतो: काय तपासायचं. Playwright त्यासाठी एक जास्त धारदार tool आहे.' } },
      ],
      problem: { en: 'Bags go missing and the release checks do not catch it. The Selenium scripts are slow and flaky, so a red run is normal and nobody trusts the report.', mr: 'bags हरवतात आणि release checks ते पकडत नाहीत. Selenium scripts हळू आणि flaky आहेत, त्यामुळे लाल run रोजचाच झाला आहे आणि report वर कोणाचा विश्वास नाही.' },
      solution: { en: 'Playwright with TypeScript: a built-in test runner and assertions, auto-waiting instead of sleeps, locators by role and label, traces to replay any failure, and Chromium, Firefox and WebKit from one test. Fewer random reds, so a red run means a real bug again.', mr: 'TypeScript सह Playwright: आतच असलेला test runner आणि assertions, sleep ऐवजी auto-waiting, role आणि label वरून locators, कोणताही failure पुन्हा पाहायला traces, आणि एकाच test मधून Chromium, Firefox आणि WebKit. विनाकारण लाल होणं कमी, म्हणून लाल run म्हणजे पुन्हा खरा bug.' },
    },
    lesson: [
      { en: 'Playwright is a free, open-source tool from Microsoft for testing web apps. One install gives you everything: the browser driver, a test runner (@playwright/test), assertions (expect) and an HTML report. With Selenium you put the pieces together yourself: WebDriver, TestNG, WebDriverWait and a report library.', mr: 'Playwright हे web apps तपासण्यासाठी Microsoft चं मोफत, open-source tool आहे. एका install मध्ये सगळं मिळतं: browser driver, test runner (@playwright/test), assertions (expect) आणि HTML report. Selenium मध्ये हे तुकडे तुम्ही स्वतः जोडायचे: WebDriver, TestNG, WebDriverWait आणि report library.' },
      { en: 'Auto-waiting: before a click, Playwright waits until the element is there, visible, enabled and not moving. Assertions like expect(...).toHaveText(...) keep retrying until the page matches, for up to 5 seconds. So no Thread.sleep, and almost never an explicit wait. That is the live board in the story.', mr: 'Auto-waiting: click करण्याआधी Playwright element आहे, दिसतो, enabled आहे आणि हलत नाही, याची वाट पाहतो. expect(...).toHaveText(...) सारखे assertions page जुळेपर्यंत, 5 सेकंदांपर्यंत, पुन्हा पुन्हा तपासतात. म्हणून Thread.sleep नाही, आणि explicit wait जवळजवळ कधीच नाही. गोष्टीतला live board हाच.' },
      { en: 'Locators by role: page.getByRole(\'button\', { name: \'Track bag\' }) finds things the way a passenger (and a screen reader) sees them, the coach board C3 rather than "the seventh coach". Locators are strict: if one matches two buttons, Playwright refuses to guess. A trace records every step with page snapshots and network calls, so a failure from last night can be replayed. The same test runs on Chromium (Chrome, Edge), Firefox and WebKit (the engine inside Safari).', mr: 'role वरून locators: page.getByRole(\'button\', { name: \'Track bag\' }) प्रवाशाला (आणि screen reader ला) जसं दिसतं तसं शोधतो, "सातवा डबा" नव्हे तर C3 ची पाटी. locators strict असतात: एकाला दोन बटणं सापडली तर Playwright अंदाज लावत नाही. trace प्रत्येक पायरी page च्या snapshots आणि network calls सकट नोंदवतो, म्हणून कालच्या रात्रीचा failure पुन्हा पाहता येतो. तीच test Chromium (Chrome, Edge), Firefox आणि WebKit (Safari मधलं engine) वर चालते.' },
      { en: 'Teams pick Playwright for modern web apps with lots of loading and JavaScript, when developers already write TypeScript, and when tests must run fast and in parallel in CI. It also mocks the network and tests APIs in the same tool (later lessons). Selenium is still strong for big existing Java suites, many languages and real device grids. Either way, the tool does not decide what to check. You do.', mr: 'खूप loading आणि JavaScript असलेल्या आधुनिक web apps साठी, developers आधीच TypeScript लिहीत असतील तेव्हा, आणि CI मध्ये tests जलद आणि parallel चालायला हव्या असतील तेव्हा teams Playwright निवडतात. त्याच tool मध्ये network mock करता येतं आणि API tests लिहिता येतात (पुढच्या lessons मध्ये). मोठ्या जुन्या Java suites, अनेक भाषा आणि खऱ्या devices च्या grids साठी Selenium अजूनही दमदार आहे. काहीही असो, काय तपासायचं ते tool ठरवत नाही. तुम्ही ठरवता.' },
    ],
    syntax: {
      template: `import { test, expect } from '@playwright/test';

test('a passenger can track a bag', async ({ page }) => {
  await page.goto('/baggage');
  await page.getByLabel('Bag tag number').fill('SH482913');
  await page.getByRole('button', { name: 'Track bag' }).click();
  await expect(page.getByTestId('bag-status')).toHaveText('Ready at belt 4');
});`,
      parts: [
        { code: "import { test, expect } from '@playwright/test'", means: { en: 'the runner and the assertions, built in (no TestNG needed)', mr: 'runner आणि assertions, आतच असलेले (TestNG लागत नाही)' } },
        { code: "test('name', async ({ page }) => { ... })", means: { en: 'one test with a name; Playwright hands you a fresh page (a browser tab)', mr: 'नाव असलेली एक test; Playwright तुम्हाला नवं page (browser tab) देतो' } },
        { code: 'await', means: { en: 'wait for this browser step to finish before the next line (next lesson explains why)', mr: 'पुढच्या ओळीआधी ही browser पायरी पूर्ण होऊ द्या (का ते पुढच्या lesson मध्ये)' } },
        { code: "page.getByRole('button', { name: 'Track bag' })", means: { en: 'find the button a passenger would call "Track bag"', mr: 'प्रवासी ज्याला "Track bag" म्हणेल ते बटण शोधा' } },
        { code: "expect(...).toHaveText('...')", means: { en: 'a web-first assertion: retries until the page matches or 5 seconds pass', mr: 'web-first assertion: page जुळेपर्यंत किंवा 5 सेकंद होईपर्यंत पुन्हा तपासतो' } },
      ],
      example: [
        { code: "await page.goto('/baggage');", note: { en: 'go to the station: our config already knows the address skyhop.test', mr: 'स्टेशनला जा: आपल्या config ला skyhop.test हा पत्ता आधीच माहीत आहे' } },
        { code: "await page.getByLabel('Bag tag number').fill('SH482913');", note: { en: 'find the box by its label, like the coach board C3', mr: 'box त्याच्या label वरून शोधा, C3 च्या पाटीसारखं' } },
        { code: "await page.getByRole('button', { name: 'Track bag' }).click();", note: { en: 'the click waits until the button is ready, like waiting for the train', mr: 'बटण तयार होईपर्यंत click वाट पाहतो, गाडीची वाट पाहण्यासारखं' } },
        { code: "await expect(page.getByTestId('bag-status')).toHaveText('Ready at belt 4');", note: { en: 'the live board: keeps checking until it shows, up to 5 seconds', mr: 'live board: दिसेपर्यंत, 5 सेकंदांपर्यंत, तपासत राहतो' } },
        { code: 'npx playwright test --trace on', note: { en: 'in a real project: run the tests and keep a photo of every step', mr: 'खऱ्या project मध्ये: tests चालवा आणि प्रत्येक पायरीचा फोटो ठेवा' } },
      ],
      pitfall: { en: 'Auto-waiting removes timing guesses, not thinking. A Playwright test with no assertion is as useless as a Selenium one. And every Playwright step starts with await; forget it and the test runs ahead of the browser.', mr: 'Auto-waiting वेळेचे अंदाज काढून टाकतं, विचार नाही. assertion नसलेली Playwright test Selenium च्या test इतकीच निरुपयोगी. आणि प्रत्येक Playwright पायरी await ने सुरू होते; ते विसरलात तर test browser च्या पुढे धावते.' },
    },
    practice: {
      intro: { en: 'No writing yet. Press Run, watch the browser on the right, and read the test report under the Run and Submit buttons.', mr: 'अजून लिहायचं नाही. Run दाबा, उजवीकडचा browser पाहा, आणि Run आणि Submit बटणांखालचा test report वाचा.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'Here is a complete Playwright test. Press Run and watch it track a bag on SkyHop. What status did the page show for bag SH482913?', mr: 'ही एक पूर्ण Playwright test आहे. Run दाबा आणि ती SkyHop वर bag track करताना पाहा. bag SH482913 साठी page ने कोणता status दाखवला?' },
          playwrightSandbox: { code: TRACK_SPEC, startUrl: `${SKY}/baggage` },
          options: ['Ready at belt 4', 'On its way', 'Misrouted to Mumbai. We will deliver it to you.', 'We could not find bag SH482913'],
          correct: [0],
          explain: { en: 'The last line expects bag-status to say "Ready at belt 4", and the report shows a green tick. Asha\'s bag is waiting at belt 4.', mr: 'शेवटची ओळ bag-status "Ready at belt 4" असेल अशी अपेक्षा करते, आणि report मध्ये हिरवी tick दिसते. आशाची bag belt 4 वर वाट पाहते आहे.' },
          hints: [
            { en: 'Watch the result card that appears after "Looking for your bag...".', mr: '"Looking for your bag..." नंतर दिसणारं result card पाहा.' },
            { en: 'Or read the last line of the test: it says exactly what it expects.', mr: 'किंवा test ची शेवटची ओळ वाचा: तिला नेमकं काय अपेक्षित आहे ते त्यात आहे.' },
          ],
          successLine: { en: 'Your first Playwright run. Four lines, one real check.', mr: 'तुमचा पहिला Playwright run. चार ओळी, एक खरा check.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'This test opens the flight results. The page first says "Searching flights..." for almost a second. There is no sleep and no wait line. Press Run. Why did the check still pass?', mr: 'ही test flight results उघडते. page आधी जवळजवळ एक सेकंद "Searching flights..." दाखवतं. कोणताही sleep नाही, wait ची ओळ नाही. Run दाबा. तरी check pass का झाला?' },
          playwrightSandbox: { code: FLIGHTS_SPEC, startUrl: `${SKY}/` },
          options: [
            { en: 'Playwright skipped the check because the page was loading', mr: 'page load होत होतं म्हणून Playwright ने check सोडून दिला' },
            { en: 'expect(...).toHaveText kept retrying until the text became "5 flights" (it would give up after 5 seconds)', mr: 'text "5 flights" होईपर्यंत expect(...).toHaveText पुन्हा पुन्हा तपासत राहिला (5 सेकंदांनंतर तो थांबला असता)' },
            { en: 'The results were already on the page before goto finished', mr: 'goto संपण्याआधीच results page वर होते' },
            { en: 'The lab secretly sleeps 10 seconds before every line', mr: 'lab प्रत्येक ओळीआधी गुपचूप 10 सेकंद sleep करते' },
          ],
          correct: [1],
          explain: { en: 'Web-first assertions retry. Playwright checked, saw "Searching flights...", checked again, and passed the moment "5 flights" appeared. In Selenium you would have written a WebDriverWait for this.', mr: 'web-first assertions पुन्हा तपासतात. Playwright ने तपासलं, "Searching flights..." दिसलं, पुन्हा तपासलं, आणि "5 flights" दिसताच pass केलं. Selenium मध्ये यासाठी तुम्ही WebDriverWait लिहिला असता.' },
          hints: [
            { en: 'Think of the live board at the station. It does not sleep for a fixed time.', mr: 'स्टेशनवरचा live board आठवा. तो ठरावीक वेळ झोपत नाही.' },
            { en: 'The report shows how long the test took. It is about one second, not ten.', mr: 'test ला किती वेळ लागला ते report दाखवतो. सुमारे एक सेकंद, दहा नाही.' },
          ],
          successLine: { en: 'That is auto-waiting: it waits as long as needed, and not a moment longer.', mr: 'हेच auto-waiting: जितकी गरज तितकीच वाट, एक क्षणही जास्त नाही.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'This test is ready and correct. Press Run and watch it open the SkyHop home page, check the title and check the main heading. Then press Submit.', mr: 'ही test तयार आणि बरोबर आहे. Run दाबा आणि ती SkyHop चं home page उघडून title आणि मुख्य heading तपासताना पाहा. मग Submit दाबा.' },
          starter: HOME_SPEC,
          solution: HOME_SPEC,
          starterPasses: true,
          startUrl: `${SKY}/`,
          minAssertions: 2,
          hints: [
            { en: 'You do not need to change anything. Press Run first.', mr: 'काहीही बदलायची गरज नाही. आधी Run दाबा.' },
            { en: 'Read the report: two green ticks, one per expect. Then press Submit.', mr: 'report वाचा: दोन हिरव्या ticks, प्रत्येक expect साठी एक. मग Submit दाबा.' },
          ],
          successLine: { en: 'Two checks, both green. Next lesson you will write lines like these yourself.', mr: 'दोन checks, दोन्ही green. पुढच्या lesson मध्ये अशा ओळी तुम्ही स्वतः लिहाल.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Which TWO come built into Playwright, where your Selenium + Java setup needed extra pieces or did not have them at all?', mr: 'तुमच्या Selenium + Java setup ला ज्यासाठी वेगळे तुकडे लागायचे किंवा जे नव्हतंच, अशा कोणत्या दोन गोष्टी Playwright मध्ये आतच येतात?' },
          options: [
            { en: 'A test runner and assertions (test and expect), so no TestNG', mr: 'test runner आणि assertions (test आणि expect), म्हणजे TestNG नको' },
            { en: 'A trace of each run that you can replay step by step', mr: 'प्रत्येक run चा trace, जो पायरी पायरीने पुन्हा पाहता येतो' },
            { en: 'A SQL database for SkyHop\'s bookings', mr: 'SkyHop च्या bookings साठी SQL database' },
            { en: 'A tool that designs the screens for the developers', mr: 'developers साठी screens design करणारं tool' },
          ],
          correct: [0, 1],
          explain: { en: '@playwright/test brings the runner, expect and the report. Traces are built in too. A database and screen design have nothing to do with a test tool.', mr: '@playwright/test सोबत runner, expect आणि report येतात. traces सुद्धा आतच आहेत. database आणि screen design चा test tool शी काही संबंध नाही.' },
          hints: [
            { en: 'Look at the import line of any test in this lesson.', mr: 'या lesson मधल्या कोणत्याही test ची import ओळ पाहा.' },
            { en: 'The photo log in the station story is one of them.', mr: 'स्टेशनच्या गोष्टीतला फोटोंचा log त्यातला एक आहे.' },
          ],
          successLine: { en: 'One install, the whole kit.', mr: 'एक install, संपूर्ण kit.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Which project is the strongest reason for a team to choose Playwright?', mr: 'team ने Playwright निवडावं यासाठी कोणता project सगळ्यात मजबूत कारण आहे?' },
          options: [
            { en: 'A native Android app with no web screens at all', mr: 'एकही web screen नसलेलं native Android app' },
            { en: 'Deciding whether the new logo feels friendly', mr: 'नवा logo आपलासा वाटतो का हे ठरवणं' },
            { en: 'A team with 2,000 stable Selenium Java tests and no reason to change', mr: '2,000 स्थिर Selenium Java tests असलेली team, बदलायचं काही कारण नाही' },
            { en: 'A busy web app full of loading spinners, built by a TypeScript team, whose tests must run fast in CI on Chromium, Firefox and WebKit', mr: 'loading spinners ने भरलेलं web app, TypeScript team ने बनवलेलं, ज्याच्या tests CI मध्ये Chromium, Firefox आणि WebKit वर जलद चालायला हव्यात' },
          ],
          correct: [3],
          explain: { en: 'Lots of loading (auto-waiting helps), TypeScript (same language as the app), CI speed and three engines: that is Playwright\'s home ground. Native mobile apps need other tools, a look-and-feel question needs a human, and stable suites can stay as they are.', mr: 'खूप loading (auto-waiting मदत करतं), TypeScript (app चीच भाषा), CI चा वेग आणि तीन engines: हे Playwright चं घरचं मैदान. native mobile apps साठी दुसरी tools लागतात, look and feel साठी माणूस लागतो, आणि स्थिर suites आहेत तशाच राहू शकतात.' },
          hints: [
            { en: 'Playwright drives web browsers. Which option has no browser in it?', mr: 'Playwright web browsers चालवतो. कोणत्या पर्यायात browser च नाही?' },
            { en: 'Look for the option that matches several Playwright strengths at once.', mr: 'एकाच वेळी Playwright च्या अनेक जमेच्या बाजूंशी जुळणारा पर्याय शोधा.' },
          ],
          successLine: { en: 'Pick the tool for the job, then decide what to check.', mr: 'कामासाठी योग्य tool निवडा, मग काय तपासायचं ते ठरवा.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does auto-waiting mean in Playwright?', mr: 'Playwright मध्ये auto-waiting म्हणजे काय?' },
        options: [
          { en: 'Every test sleeps 5 seconds before it starts', mr: 'प्रत्येक test सुरू होण्याआधी 5 सेकंद sleep करते' },
          { en: 'Before acting, Playwright waits until the element is ready, and assertions retry until they pass or time out', mr: 'काम करण्याआधी element तयार होईपर्यंत Playwright वाट पाहतो, आणि assertions pass होईपर्यंत किंवा वेळ संपेपर्यंत पुन्हा तपासतात' },
          { en: 'The tester has to press a button to continue', mr: 'पुढे जाण्यासाठी tester ला बटण दाबावं लागतं' },
          { en: 'Tests run only at night when the server is free', mr: 'server मोकळा असताना फक्त रात्री tests चालतात' },
        ],
        answer: 1,
        explain: { en: 'Playwright waits as long as needed (up to the timeout) and no longer. That replaces Thread.sleep and most WebDriverWait code.', mr: 'Playwright गरज असेल तितकीच (timeout पर्यंत) वाट पाहतो, जास्त नाही. त्यामुळे Thread.sleep आणि बहुतेक WebDriverWait code ची गरज उरत नाही.' },
      },
      {
        q: { en: 'Which locator style does Playwright recommend first?', mr: 'Playwright सगळ्यात आधी कोणती locator पद्धत सुचवतो?' },
        options: [
          "page.locator('/html/body/main/form/button[1]')",
          "page.locator('form > button:nth-child(4)')",
          "page.locator('#track-btn')",
          "page.getByRole('button', { name: 'Track bag' })",
        ],
        answer: 3,
        explain: { en: 'Role plus name is how a passenger sees the button. It survives layout changes, like the coach board C3.', mr: 'role आणि name म्हणजे प्रवाशाला बटण जसं दिसतं तसं. layout बदलला तरी ते टिकतं, C3 च्या पाटीसारखं.' },
      },
      {
        q: { en: 'A test failed on CI at 2 am and passes on your laptop. Which Playwright feature helps you see what happened?', mr: 'एक test रात्री 2 वाजता CI वर fail झाली आणि तुमच्या laptop वर pass होते. काय झालं ते पाहायला Playwright चं कोणतं feature मदत करतं?' },
        options: [
          { en: 'The trace: a step-by-step recording with page snapshots and network calls', mr: 'trace: page snapshots आणि network calls सकट पायरी पायरीची नोंद' },
          { en: 'Thread.sleep', mr: 'Thread.sleep' },
          { en: 'Running the test on Firefox only', mr: 'test फक्त Firefox वर चालवणं' },
          { en: 'Deleting the test', mr: 'test delete करणं' },
        ],
        answer: 0,
        explain: { en: 'Open the trace and replay the run: every action, what the page looked like, and which network calls happened.', mr: 'trace उघडा आणि run पुन्हा पाहा: प्रत्येक action, page कसं दिसत होतं, आणि कोणते network calls झाले.' },
      },
      {
        q: { en: 'Which browser engines can the same Playwright test run on?', mr: 'तीच Playwright test कोणत्या browser engines वर चालू शकते?' },
        options: [
          { en: 'Only Chrome', mr: 'फक्त Chrome' },
          { en: 'Only Internet Explorer', mr: 'फक्त Internet Explorer' },
          { en: 'Chromium, Firefox and WebKit (the engine inside Safari)', mr: 'Chromium, Firefox आणि WebKit (Safari मधलं engine)' },
          { en: 'Only the browser built into VS Code', mr: 'फक्त VS Code मधला browser' },
        ],
        answer: 2,
        explain: { en: 'Chromium covers Chrome and Edge, plus Firefox and WebKit. One test, three engines.', mr: 'Chromium मध्ये Chrome आणि Edge येतात, शिवाय Firefox आणि WebKit. एक test, तीन engines.' },
      },
    ],
    recap: { line: { en: 'Playwright brings the runner, expect, auto-waiting, role-based locators, traces and three browser engines in one install. You still decide what to check.', mr: 'Playwright एकाच install मध्ये runner, expect, auto-waiting, role वरचे locators, traces आणि तीन browser engines आणतो. काय तपासायचं ते तुम्हीच ठरवता.' }, icon: '🎭' },
  },

  // ───────────────────────── W0.2 Just enough TypeScript
  {
    id: 'pw0-2',
    code: 'W0.2',
    level: 'basic',
    title: { en: 'Just Enough TypeScript', mr: 'पुरेसं TypeScript' },
    skill: 'const/let, types, arrays, interfaces, arrow functions, async/await',
    realLife: {
      place: 'restaurant',
      title: { en: 'The token at the dosa counter', mr: 'डोसा counter वरचा token' },
      story: {
        en: 'Meera takes the new tester to a busy restaurant on FC Road. They order two masala dosas and the counter gives them token 42. A token is a promise: your dosa will come, just not yet. Her friend, very hungry, almost bites the token. Meera laughs: "You cannot eat the token. Wait at the table until 42 is called, then eat the dosa." The menu card helps too: every item has a name in words, a price as a number, and a green dot for veg, yes or no. Each thing has its own kind, and nobody writes the price in words.',
        mr: 'मीरा नव्या tester ला FC Road वरच्या गर्दीच्या restaurant मध्ये घेऊन जाते. ते दोन मसाला डोसे order करतात आणि counter त्यांना token 42 देतो. token म्हणजे promise: तुमचा डोसा येईल, फक्त आत्ता नाही. तिची मैत्रीण खूप भुकेली आहे, ती जवळजवळ token च चावते. मीरा हसते: "token खाता येत नाही. 42 पुकारेपर्यंत टेबलवर थांब, मग डोसा खा." menu card पण मदत करतं: प्रत्येक पदार्थाचं नाव शब्दांत, किंमत संख्येत, आणि veg साठी हिरवा ठिपका, हो किंवा नाही. प्रत्येक गोष्टीचा स्वतःचा प्रकार आहे, आणि किंमत कोणी शब्दांत लिहीत नाही.',
      },
      scene: {
        type: 'exchange',
        client: { icon: '🧑', label: 'You at the table (your test)', mr: 'टेबलवर तुम्ही (तुमची test)' },
        server: { icon: '👨‍🍳', label: 'The kitchen (the browser)', mr: 'स्वयंपाकघर (browser)' },
        request: { icon: '🎟️', label: 'Order, get token 42 (a Promise)', mr: 'order, token 42 मिळतो (Promise)' },
        response: { icon: '🥞', label: 'Dosa arrives (await gives the value)', mr: 'डोसा येतो (await value देतं)' },
        note: { en: 'await means: wait at the table until your token is called. Then you get the real dosa.', mr: 'await म्हणजे: तुमचा token पुकारेपर्यंत टेबलवर थांबा. मग खरा डोसा मिळतो.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'you', mood: 'worried', text: { en: 'Rex, I just got used to Java. Is TypeScript a whole new language?', mr: 'Rex, मला आत्ताच Java ची सवय झाली. TypeScript ही पूर्ण नवी भाषा आहे का?' } },
        { who: 'rex', mood: 'happy', text: { en: 'Smaller than Java for our needs. const and let instead of String and int, types after a colon, arrow functions. And one new habit: await.', mr: 'आपल्या गरजेसाठी Java पेक्षा छोटी. String आणि int ऐवजी const आणि let, colon नंतर types, arrow functions. आणि एक नवी सवय: await.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'Every Playwright call talks to a browser, and that takes time. So it hands you a promise, like a token. You await it to get the real result.', mr: 'प्रत्येक Playwright call browser शी बोलतो, आणि त्याला वेळ लागतो. म्हणून तो तुम्हाला promise देतो, token सारखा. खरा निकाल मिळवायला तुम्ही त्याला await करता.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'forget one await and your test reads the page before it loads. tokens taste terrible. hehe.', mr: 'एक await विसरा आणि तुमची test page load होण्याआधीच वाचते. token ची चव भयंकर असते. हेहे.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Twenty minutes of plain TypeScript, {name}. Then real tests.', mr: 'वीस मिनिटं साधं TypeScript, {name}. मग खऱ्या tests.' } },
      ],
      problem: { en: 'Playwright tests are written in TypeScript. Without the basics, a test is hard to read, and a missing await makes it check the page too early.', mr: 'Playwright tests TypeScript मध्ये लिहिलेल्या असतात. basics शिवाय test वाचायला कठीण जाते, आणि await राहिलं तर ती page खूप लवकर तपासते.' },
      solution: { en: 'Learn the small slice tests use: const and let, basic types, arrays and objects, template literals, arrow functions, and async/await with promises.', mr: 'tests मध्ये लागणारा छोटा भाग शिका: const आणि let, मूळ types, arrays आणि objects, template literals, arrow functions, आणि promises सोबत async/await.' },
    },
    lesson: [
      { en: 'Use const for a value that never changes (most of them) and let for one that does. Types go after a colon: const seat: string = \'12C\'; let bags: number = 1; const paid: boolean = true. TypeScript often guesses the type itself: const fare = 4500 is a number. In a real project the editor underlines a wrong type in red before you even run. (This practice lab only removes the types and runs the code, so read carefully.)', mr: 'कधीच न बदलणाऱ्या value साठी const (बहुतेक values) आणि बदलणाऱ्यासाठी let वापरा. type colon नंतर येतो: const seat: string = \'12C\'; let bags: number = 1; const paid: boolean = true. TypeScript बऱ्याचदा type स्वतःच ओळखतं: const fare = 4500 म्हणजे number. खऱ्या project मध्ये चुकीचा type असेल तर run करण्याआधीच editor लाल रेघ ओढतो. (हा practice lab फक्त types काढून code चालवतो, म्हणून नीट वाचा.)' },
      { en: 'Arrays hold a list: const fares: number[] = [4500, 3900]; fares.length is 2. Objects hold named fields: { tag: \'SH771205\', owner: \'Rohan Desai\' }, read with bag.tag. An interface describes the shape of an object, like a menu card. Template literals use backticks and ${...}: `Bag ${bag.tag}` builds the text "Bag SH771205".', mr: 'array मध्ये यादी असते: const fares: number[] = [4500, 3900]; fares.length म्हणजे 2. object मध्ये नाव असलेली fields असतात: { tag: \'SH771205\', owner: \'Rohan Desai\' }, bag.tag ने वाचा. interface object चा आकार सांगतं, menu card सारखा. template literals backticks आणि ${...} वापरतात: `Bag ${bag.tag}` मधून "Bag SH771205" हा मजकूर बनतो.' },
      { en: 'Arrow functions are short functions: const seatFee = (seat: string): number => (seat.startsWith(\'10\') ? 600 : 0). Inputs in brackets with their types, the return type after the colon, the body after =>. Every test body is an arrow function: async ({ page }) => { ... }. The curly braces in ({ page }) mean "from the things Playwright hands me, take page".', mr: 'arrow functions म्हणजे छोटी functions: const seatFee = (seat: string): number => (seat.startsWith(\'10\') ? 600 : 0). कंसात inputs त्यांच्या types सह, colon नंतर return type, => नंतर body. प्रत्येक test ची body arrow function असते: async ({ page }) => { ... }. ({ page }) मधले curly braces म्हणजे "Playwright देतो त्या गोष्टींमधून page घे".' },
      { en: 'Browser work takes time, so page.goto, click, fill and expect(...) return a Promise: the token, not the dosa. await waits until it is done and gives you the real value. await only works inside an async function, which is why every test is async. Forget it in plain code and you print "[object Promise]". Forget it in a test and Playwright stops you: "Missing await ... Put await before it."', mr: 'browser च्या कामाला वेळ लागतो, म्हणून page.goto, click, fill आणि expect(...) Promise देतात: token, डोसा नाही. await काम पूर्ण होईपर्यंत थांबतं आणि खरी value देतं. await फक्त async function मध्येच चालतं, म्हणून प्रत्येक test async असते. साध्या code मध्ये ते विसरलात तर "[object Promise]" print होतं. test मध्ये विसरलात तर Playwright थांबवतो: "Missing await ... Put await before it."' },
    ],
    syntax: {
      template: `const city: string = 'Pune';
let bags: number = 1;
const fares: number[] = [4500, 3900];
interface Bag { tag: string; misrouted: boolean }
const bag: Bag = { tag: 'SH771205', misrouted: true };
const fee = (seat: string): number => (seat.startsWith('10') ? 600 : 0);
const status = await trackBag(bag.tag);
console.log(\`Bag \${bag.tag}: \${status}\`);`,
      parts: [
        { code: 'const / let', means: { en: 'const never changes, let can change later', mr: 'const कधीच बदलत नाही, let नंतर बदलू शकतो' } },
        { code: ': string  : number  : boolean', means: { en: 'the type after a colon: text, number, true/false', mr: 'colon नंतरचा type: मजकूर, संख्या, true/false' } },
        { code: 'number[]', means: { en: 'an array (list) of numbers', mr: 'संख्यांचा array (यादी)' } },
        { code: 'interface Bag { ... }', means: { en: 'the shape of an object: which fields, which types', mr: 'object चा आकार: कोणती fields, कोणते types' } },
        { code: '(seat: string): number => ...', means: { en: 'an arrow function: inputs, return type, body', mr: 'arrow function: inputs, return type, body' } },
        { code: '`text ${value}`', means: { en: 'a template literal: backticks, values inside ${ }', mr: 'template literal: backticks, ${ } मध्ये values' } },
        { code: 'await', means: { en: 'wait for the promise and take the real value (only inside async)', mr: 'promise ची वाट पाहा आणि खरी value घ्या (फक्त async मध्ये)' } },
      ],
      example: [
        { code: "const dish: string = 'Masala dosa';", note: { en: 'the dish name is text and does not change: const', mr: 'पदार्थाचं नाव मजकूर आहे आणि बदलत नाही: const' } },
        { code: 'let plates: number = 2;\nplates = plates + 1;', note: { en: 'a friend joins, the count changes: let', mr: 'एक मित्र येतो, संख्या बदलते: let' } },
        { code: 'const bill: number[] = [120, 120, 60];', note: { en: 'the order slip: a list of prices', mr: 'order ची चिठ्ठी: किमतींची यादी' } },
        { code: "const dosa = await kitchen('Masala dosa');", note: { en: 'wait at the table until token 42 is called', mr: '42 पुकारेपर्यंत टेबलवर थांबा' } },
        { code: 'console.log(`Served: ${dosa} for ${plates} people`);', note: { en: 'backticks build the sentence from the values', mr: 'backticks values वापरून वाक्य बनवतात' } },
      ],
      pitfall: { en: 'Template literals need backticks (`), not quotes: \'Bag ${tag}\' prints the dollar sign and braces as they are. And await works only inside an async function; without it you hold a token, and printing it shows "[object Promise]".', mr: 'template literals ना backticks (`) लागतात, quotes नाही: \'Bag ${tag}\' डॉलर चिन्ह आणि braces जसेच्या तसे print करतं. आणि await फक्त async function मध्येच चालतं; त्याशिवाय तुमच्या हातात token असतो, आणि तो print केला तर "[object Promise]" दिसतं.' },
    },
    practice: {
      intro: { en: 'No browser in this lesson. Write plain TypeScript, press Run, and compare what console.log prints with what the step asks for. The output must match exactly, spaces and capitals included.', mr: 'या lesson मध्ये browser नाही. साधं TypeScript लिहा, Run दाबा, आणि console.log ने काय print केलं याची step ने मागितलेल्याशी तुलना करा. output तंतोतंत जुळायला हवं, spaces आणि capitals सकट.' },
      steps: [
        {
          kind: 'playwright',
          noBrowser: true,
          prompt: { en: 'Asha checks in one bag, then adds a second. Change bags to 2 with bags = bags + 1, then print exactly: Asha Patil, seat 12C, bags: 2. Build the line with a template literal (backticks and ${...}).', mr: 'आशा एक bag check in करते, मग दुसरी जोडते. bags = bags + 1 ने bags 2 करा, मग तंतोतंत print करा: Asha Patil, seat 12C, bags: 2. ती ओळ template literal ने बनवा (backticks आणि ${...}).' },
          starter: `const passenger: string = 'Asha Patil';
const seat: string = '12C';
let bags: number = 1;
// TODO: Asha adds one more bag (bags = bags + 1)
// TODO: print: Asha Patil, seat 12C, bags: 2   (use backticks and \${...})
`,
          solution: `const passenger: string = 'Asha Patil';
const seat: string = '12C';
let bags: number = 1;
bags = bags + 1;
console.log(\`\${passenger}, seat \${seat}, bags: \${bags}\`);`,
          output: ['Asha Patil, seat 12C, bags: 2'],
          mustUse: [{ pattern: '`[^`]*\\$\\{', message: { en: 'Build the line with a template literal: backticks and ${...}.', mr: 'ओळ template literal ने बनवा: backticks आणि ${...}.' } }],
          hints: [
            { en: 'bags is a let, so you may change it: bags = bags + 1;', mr: 'bags हा let आहे, म्हणून तो बदलता येतो: bags = bags + 1;' },
            { en: 'Inside backticks, put each value in ${ }: `${passenger}, seat ...`', mr: 'backticks मध्ये प्रत्येक value ${ } मध्ये ठेवा: `${passenger}, seat ...`' },
            { en: 'bags = bags + 1;\nconsole.log(`${passenger}, seat ${seat}, bags: ${bags}`);', mr: 'bags = bags + 1;\nconsole.log(`${passenger}, seat ${seat}, bags: ${bags}`);' },
          ],
          successLine: { en: 'const for what stays, let for what changes, backticks to build the sentence.', mr: 'जे टिकतं त्यासाठी const, जे बदलतं त्यासाठी let, वाक्य बनवायला backticks.' },
        },
        {
          kind: 'playwright',
          noBrowser: true,
          prompt: { en: 'Here are the five Pune to Delhi fares. Print three lines: the count as "5 flights" (use fares.length), the cheapest as "Cheapest: 3600" (Math.min(...fares) gives the smallest), and then the whole array with console.log(fares).', mr: 'पुणे ते दिल्लीचे हे पाच fares आहेत. तीन ओळी print करा: संख्या "5 flights" अशी (fares.length वापरा), सगळ्यात स्वस्त "Cheapest: 3600" अशी (Math.min(...fares) सगळ्यात लहान देतं), आणि मग console.log(fares) ने पूर्ण array.' },
          starter: `const fares: number[] = [4500, 3900, 5200, 4850, 3600];
// TODO: print: 5 flights        (fares.length)
// TODO: print: Cheapest: 3600   (Math.min(...fares))
// TODO: print the whole array
`,
          solution: `const fares: number[] = [4500, 3900, 5200, 4850, 3600];
console.log(\`\${fares.length} flights\`);
console.log(\`Cheapest: \${Math.min(...fares)}\`);
console.log(fares);`,
          output: ['5 flights', 'Cheapest: 3600', '[ 4500, 3900, 5200, 4850, 3600 ]'],
          mustUse: [{ pattern: 'fares\\.length', message: { en: 'Count the fares with fares.length, so the line stays right when a flight is added.', mr: 'fares.length ने fares मोजा, म्हणजे flight वाढली तरी ओळ बरोबर राहील.' } }],
          hints: [
            { en: 'fares.length is the number of items in the array.', mr: 'fares.length म्हणजे array मधल्या items ची संख्या.' },
            { en: 'The three dots in Math.min(...fares) spread the array into separate numbers.', mr: 'Math.min(...fares) मधले तीन dots array ला वेगवेगळ्या संख्यांमध्ये पसरवतात.' },
            { en: 'console.log(`${fares.length} flights`);\nconsole.log(`Cheapest: ${Math.min(...fares)}`);\nconsole.log(fares);', mr: 'console.log(`${fares.length} flights`);\nconsole.log(`Cheapest: ${Math.min(...fares)}`);\nconsole.log(fares);' },
          ],
          successLine: { en: 'An array of numbers, counted and searched. You will do this with real prices from the page soon.', mr: 'संख्यांचा array, मोजला आणि शोधला. लवकरच तुम्ही page वरच्या खऱ्या किमतींसोबत हेच कराल.' },
        },
        {
          kind: 'playwright',
          noBrowser: true,
          prompt: { en: 'Describe a bag with an interface. Finish the Bag interface (owner: string, misrouted: boolean), create Rohan\'s bag (tag SH771205, owner Rohan Desai, misrouted true), print the object, then print: Bag SH771205 belongs to Rohan Desai.', mr: 'interface वापरून bag चं वर्णन करा. Bag interface पूर्ण करा (owner: string, misrouted: boolean), रोहनची bag बनवा (tag SH771205, owner Rohan Desai, misrouted true), object print करा, मग print करा: Bag SH771205 belongs to Rohan Desai.' },
          starter: `interface Bag {
  tag: string;
  // TODO: add owner (string) and misrouted (boolean)
}

// TODO: const rohansBag: Bag = { ... };
// TODO: print the object, then: Bag SH771205 belongs to Rohan Desai
`,
          solution: `interface Bag {
  tag: string;
  owner: string;
  misrouted: boolean;
}

const rohansBag: Bag = { tag: 'SH771205', owner: 'Rohan Desai', misrouted: true };
console.log(rohansBag);
console.log(\`Bag \${rohansBag.tag} belongs to \${rohansBag.owner}\`);`,
          output: ["{ tag: 'SH771205', owner: 'Rohan Desai', misrouted: true }", 'Bag SH771205 belongs to Rohan Desai'],
          mustUse: [
            { pattern: 'interface\\s+Bag\\s*\\{[^}]*owner\\s*:\\s*string[^}]*misrouted\\s*:\\s*boolean', message: { en: 'Add owner: string and misrouted: boolean inside the Bag interface.', mr: 'Bag interface मध्ये owner: string आणि misrouted: boolean जोडा.' } },
            { pattern: ':\\s*Bag\\s*=', message: { en: 'Give the object its type: const rohansBag: Bag = { ... }.', mr: 'object ला त्याचा type द्या: const rohansBag: Bag = { ... }.' } },
          ],
          hints: [
            { en: 'Each field is name: type; on its own line, like tag: string;', mr: 'प्रत्येक field name: type; अशी स्वतःच्या ओळीत, tag: string; सारखी.' },
            { en: "const rohansBag: Bag = { tag: 'SH771205', owner: 'Rohan Desai', misrouted: true };", mr: "const rohansBag: Bag = { tag: 'SH771205', owner: 'Rohan Desai', misrouted: true };" },
            { en: 'Print the object as it is, then read its fields with a dot: rohansBag.tag, rohansBag.owner.', mr: 'object जसाच्या तसा print करा, मग dot ने त्याची fields वाचा: rohansBag.tag, rohansBag.owner.' },
            { en: 'console.log(rohansBag);\nconsole.log(`Bag ${rohansBag.tag} belongs to ${rohansBag.owner}`);', mr: 'console.log(rohansBag);\nconsole.log(`Bag ${rohansBag.tag} belongs to ${rohansBag.owner}`);' },
          ],
          successLine: { en: 'An interface is the menu card for your data. Page objects later use the same idea.', mr: 'interface म्हणजे तुमच्या data चं menu card. पुढे page objects हीच कल्पना वापरतात.' },
        },
        {
          kind: 'playwright',
          noBrowser: true,
          prompt: { en: 'Row 10 seats have extra legroom and cost ₹600. Every other seat is free. Finish the arrow function seatFee so the three lines print 600, then 0, then Total for 10A and 10B: ₹1200.', mr: 'row 10 च्या seats ना जास्त legroom आहे आणि त्यांची किंमत ₹600 आहे. बाकीच्या seats मोफत. arrow function seatFee पूर्ण करा म्हणजे तीन ओळी 600, मग 0, मग Total for 10A and 10B: ₹1200 print करतील.' },
          starter: `const seatFee = (seat: string): number => {
  // TODO: return 600 if the seat starts with '10', otherwise 0
  return 0;
};

console.log(seatFee('10A'));
console.log(seatFee('12C'));
console.log(\`Total for 10A and 10B: ₹\${seatFee('10A') + seatFee('10B')}\`);
`,
          solution: `const seatFee = (seat: string): number => {
  if (seat.startsWith('10')) return 600;
  return 0;
};

console.log(seatFee('10A'));
console.log(seatFee('12C'));
console.log(\`Total for 10A and 10B: ₹\${seatFee('10A') + seatFee('10B')}\`);`,
          output: ['600', '0', 'Total for 10A and 10B: ₹1200'],
          mustUse: [{ pattern: 'startsWith\\(', message: { en: "Check the seat with seat.startsWith('10').", mr: "seat.startsWith('10') ने seat तपासा." } }],
          hints: [
            { en: "seat.startsWith('10') is true for 10A and false for 12C.", mr: "seat.startsWith('10') हे 10A साठी true आणि 12C साठी false आहे." },
            { en: 'Add an if before the last return: if (...) return 600;', mr: 'शेवटच्या return आधी एक if जोडा: if (...) return 600;' },
            { en: "if (seat.startsWith('10')) return 600;\nreturn 0;", mr: "if (seat.startsWith('10')) return 600;\nreturn 0;" },
          ],
          successLine: { en: 'Input, type, rule, answer. Every test body you write is an arrow function like this.', mr: 'input, type, नियम, उत्तर. तुम्ही लिहाल ती प्रत्येक test body अशीच arrow function असते.' },
        },
        {
          kind: 'playwright',
          noBrowser: true,
          prompt: { en: 'trackBag asks the baggage system, which takes a moment, so it returns a Promise. Press Run first: it prints "Status: [object Promise]", the token instead of the dosa. Fix it with await, then also track SH771205 and print: Rohan: Misrouted to Mumbai.', mr: 'trackBag baggage system ला विचारतं, त्याला थोडा वेळ लागतो, म्हणून ते Promise देतं. आधी Run दाबा: ते "Status: [object Promise]" print करतं, डोशाऐवजी token. await वापरून ते दुरुस्त करा, मग SH771205 सुद्धा track करा आणि print करा: Rohan: Misrouted to Mumbai.' },
          starter: `// trackBag pretends to ask the baggage system. It takes a moment, so it returns a Promise.
const trackBag = async (tag: string): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return tag === 'SH771205' ? 'Misrouted to Mumbai' : 'Ready at belt 4';
};

// TODO: this prints the token. Wait for the real answer with await.
const status = trackBag('SH482913');
console.log(\`Status: \${status}\`);
// TODO: track SH771205 and print: Rohan: Misrouted to Mumbai
`,
          solution: `const trackBag = async (tag: string): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return tag === 'SH771205' ? 'Misrouted to Mumbai' : 'Ready at belt 4';
};

const status = await trackBag('SH482913');
console.log(\`Status: \${status}\`);
const rohan = await trackBag('SH771205');
console.log(\`Rohan: \${rohan}\`);`,
          output: ['Status: Ready at belt 4', 'Rohan: Misrouted to Mumbai'],
          mustUse: [{ pattern: 'await\\s+trackBag\\(', message: { en: 'Put await before trackBag(...) to get the real status.', mr: 'खरा status मिळवायला trackBag(...) च्या आधी await लिहा.' } }],
          hints: [
            { en: 'Without await, status holds the Promise (the token). With await, it holds the text.', mr: 'await शिवाय status मध्ये Promise (token) असतो. await सह त्यात मजकूर असतो.' },
            { en: "const status = await trackBag('SH482913');", mr: "const status = await trackBag('SH482913');" },
            { en: "const status = await trackBag('SH482913');\nconsole.log(`Status: ${status}`);\nconst rohan = await trackBag('SH771205');\nconsole.log(`Rohan: ${rohan}`);", mr: "const status = await trackBag('SH482913');\nconsole.log(`Status: ${status}`);\nconst rohan = await trackBag('SH771205');\nconsole.log(`Rohan: ${rohan}`);" },
          ],
          successLine: { en: 'No more eating tokens. Every Playwright step works the same way: await it, then use the result.', mr: 'आता token खाणं बंद. प्रत्येक Playwright पायरी अशीच चालते: await करा, मग निकाल वापरा.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'A passenger\'s name will not change in the test, but the bag count will. Which pair fits?', mr: 'test मध्ये प्रवाशाचं नाव बदलणार नाही, पण bags ची संख्या बदलेल. कोणती जोडी योग्य?' },
        options: [
          "let name = 'Asha'; let bags = 1;",
          "const name = 'Asha'; const bags = 1;",
          "const name = 'Asha'; let bags = 1;",
          "let name = 'Asha'; const bags = 1;",
        ],
        answer: 2,
        explain: { en: 'const for what stays the same, let for what changes. Reassigning a const is an error.', mr: 'जे तसंच राहतं त्यासाठी const, जे बदलतं त्यासाठी let. const ला नवी value देणं ही चूक आहे.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: "const tag = 'SH482913';\nconsole.log('Bag ${tag}');",
        options: [
          { en: 'Bag SH482913', mr: 'Bag SH482913' },
          { en: 'Bag ${tag}, because single quotes do not fill in values; backticks do', mr: 'Bag ${tag}, कारण single quotes values भरत नाहीत; backticks भरतात' },
          { en: 'An error', mr: 'error' },
          { en: 'Bag undefined', mr: 'Bag undefined' },
        ],
        answer: 1,
        explain: { en: 'Only a template literal in backticks replaces ${tag}: `Bag ${tag}`.', mr: 'फक्त backticks मधलं template literal ${tag} बदलतं: `Bag ${tag}`.' },
      },
      {
        q: { en: 'Why does every Playwright test body start with async?', mr: 'प्रत्येक Playwright test ची body async ने का सुरू होते?' },
        options: [
          { en: 'So that you can use await inside it, because browser steps return promises', mr: 'म्हणजे त्यात await वापरता येईल, कारण browser च्या पायऱ्या promises देतात' },
          { en: 'It makes the test run in a hidden browser', mr: 'त्यामुळे test लपलेल्या browser मध्ये चालते' },
          { en: 'It turns off auto-waiting', mr: 'ते auto-waiting बंद करतं' },
          { en: 'It is only decoration and can be removed', mr: 'ते फक्त सजावट आहे, काढलं तरी चालेल' },
        ],
        answer: 0,
        explain: { en: 'await works only inside an async function. Playwright actions and assertions return promises, so the test must be async.', mr: 'await फक्त async function मध्येच चालतं. Playwright actions आणि assertions promises देतात, म्हणून test async असायलाच हवी.' },
      },
      {
        q: { en: 'Which line declares an array of fares with its type?', mr: 'कोणती ओळ fares चा array त्याच्या type सह declare करते?' },
        options: [
          'const fares: string = [4500, 3900];',
          'const fares = number[4500, 3900];',
          'let fares: number = 4500, 3900;',
          'const fares: number[] = [4500, 3900];',
        ],
        answer: 3,
        explain: { en: 'number[] means "a list of numbers", and the values go in square brackets.', mr: 'number[] म्हणजे "संख्यांची यादी", आणि values चौकोनी कंसात जातात.' },
      },
    ],
    recap: { line: { en: 'const and let, types after a colon, arrays, interfaces, backtick templates, arrow functions, and await on every promise: the TypeScript a tester needs.', mr: 'const आणि let, colon नंतर types, arrays, interfaces, backtick templates, arrow functions, आणि प्रत्येक promise वर await: tester ला लागणारं TypeScript.' }, icon: '🎟️' },
  },
]
