import type { Lesson, T } from './types.ts'

// Playwright 2, part B: dialogs, readable reports and the debugging toolbox for CI (W2.4),
// and the boss, The Release Gate (W2.5).

const H = "import { test, expect } from '@playwright/test';\n\n"
const HP = "import { test, expect, type Page } from '@playwright/test';\n\n"
const FL = '/flights?from=PNQ&to=DEL&date=2026-12-20&pax=1'
/** a hint that is only code: the same text in both languages */
const c = (s: string): T => ({ en: s, mr: s })

export const pwProLessonsB: Lesson[] = [
  // ───────────────────────── W2.4 Dialogs, debugging and CI
  {
    id: 'pw2-4',
    code: 'W2.4',
    level: 'intermediate',
    title: { en: 'Dialogs, Debugging and Running in CI', mr: 'Dialogs, debugging आणि CI मध्ये चालवणं' },
    skill: "page.on('dialog'), test.step, screenshot, expect.soft, trace viewer, UI mode, retries, CI",
    realLife: {
      place: 'wedding',
      title: { en: 'The last walk through the wedding hall', mr: 'लग्नाच्या हॉलमधली शेवटची फेरी' },
      story: {
        en: 'The night before her cousin\'s wedding, Meera walks through the hall with the manager and a checklist. She goes section by section: stage, kitchen, seating, and she says the name of each section out loud so everyone knows where they are. She takes a photo in every section. In the seating area a fan does not work. She does not stop the whole walk there: she writes it down and keeps going, and finds a short chair row and a loose light too. One round, three problems, all on one list. Then the decorator asks, "Shall I take down the old flower arch? We cannot put it back." The caretaker always says "no" to questions nobody prepared him for, so Meera answers herself: "Yes, take it down." Next morning, when the family asks why the arch is gone, the photos and the list tell the whole story.',
        mr: 'चुलत बहिणीच्या लग्नाच्या आदल्या रात्री मीरा हातात checklist घेऊन manager सोबत हॉलमध्ये फेरी मारते. ती एकेक भाग पाहते: स्टेज, स्वयंपाकघर, बसण्याची जागा, आणि प्रत्येक भागाचं नाव मोठ्याने सांगते, म्हणजे सगळे कुठे आहेत ते सगळ्यांना कळतं. प्रत्येक भागात ती एक फोटो काढते. बसण्याच्या जागेत एक पंखा चालत नाही. ती तिथेच पूर्ण फेरी थांबवत नाही: ती ते लिहून ठेवते आणि पुढे जाते, आणि खुर्च्यांची एक कमी पडलेली रांग आणि एक सैल दिवाही शोधते. एक फेरी, तीन अडचणी, सगळ्या एकाच यादीत. मग decorator विचारतो, "जुनी फुलांची कमान काढू का? परत लावता येणार नाही." काळजीवाहू माणूस अशा अनपेक्षित प्रश्नांना नेहमी "नाही" म्हणतो, म्हणून मीरा स्वतः उत्तर देते: "हो, काढा." दुसऱ्या दिवशी सकाळी कमान का नाही असं घरचे विचारतात, तेव्हा फोटो आणि यादी पूर्ण गोष्ट सांगतात.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🎤', label: 'Stage: checked, photo taken', mr: 'स्टेज: तपासलं, फोटो काढला' },
          { icon: '🍲', label: 'Kitchen: checked, photo taken', mr: 'स्वयंपाकघर: तपासलं, फोटो काढला' },
          { icon: '🪑', label: 'Seating: 3 problems noted, walk goes on', mr: 'बसण्याची जागा: 3 अडचणी नोंदल्या, फेरी सुरू' },
          { icon: '💐', label: '"Take down the arch?" Meera says yes', mr: '"कमान काढू का?" मीरा हो म्हणते' },
          { icon: '📋', label: 'One list with photos for the family', mr: 'घरच्यांसाठी फोटोंसह एक यादी' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'worried', text: { en: 'Tonight the suite moves into CI. If a test fails at 2 am, I get a red cross and three hundred lines of log. And if it passes on the second try, do we ship or not?', mr: 'आज रात्री suite CI मध्ये जातो. रात्री 2 वाजता एखादी test fail झाली तर मला एक लाल फुली आणि log च्या तीनशे ओळी मिळतात. आणि दुसऱ्या प्रयत्नात pass झाली, तर ship करायचं की नाही?' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> cancel trip used to ask "are you sure?". i made it shy. one click and the trip is gone. your tests click and never notice. ⌁', mr: '>> cancel trip आधी विचारायचं "नक्की?". मी त्याला लाजाळू केलं. एक click आणि trip गायब. तुमच्या tests click करतात आणि त्यांना कळतही नाही. ⌁' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Two jobs today. Handle the browser\'s own pop-ups on purpose. And make every failure explain itself: named steps, screenshots, soft checks and a trace you can replay.', mr: 'आज दोन कामं. browser चे स्वतःचे pop-ups ठरवून हाताळा. आणि प्रत्येक failure ने स्वतःच स्वतःला समजावून सांगावं: नाव दिलेले steps, screenshots, soft checks आणि पुन्हा पाहता येईल असा trace.' } },
        { who: 'meera', mood: 'happy', text: { en: 'A red test should read like a story, {name}. Today you learn to write that story.', mr: 'लाल test एखाद्या गोष्टीसारखी वाचता यायला हवी, {name}. आज तुम्ही ती गोष्ट लिहायला शिकाल.' } },
      ],
      problem: { en: 'Cancel trip asks a native "are you sure?" question that a test cannot see unless it listens for it, and the Gremlin removed that question. Meanwhile CI failures arrive as long logs nobody can read at 2 am, one failed check hides the next three, and a test that passes on retry is quietly treated as fine.', mr: 'Cancel trip एक native "नक्की?" प्रश्न विचारतो, जो test ने ऐकायची तयारी केल्याशिवाय तिला दिसत नाही, आणि gremlin ने तो प्रश्नच काढून टाकला. त्यात CI मधले failures रात्री 2 वाजता कोणालाच वाचता न येणाऱ्या लांब logs सारखे येतात, एक fail झालेला check पुढचे तीन लपवतो, आणि retry मध्ये pass झालेली test गुपचूप ठीक मानली जाते.' },
      solution: { en: "page.on('dialog') to answer native dialogs on purpose and check their message; test.step and page.screenshot so the report reads step by step; expect.soft to collect every failure in one run; and the debugging toolbox: --headed, --debug, UI mode, codegen, the HTML report and the trace viewer, with retries that flag flaky tests instead of hiding them.", mr: "native dialogs ना ठरवून उत्तर द्यायला आणि त्यांचा message तपासायला page.on('dialog'); report पायरी-पायरीने वाचता यावा म्हणून test.step आणि page.screenshot; एकाच run मध्ये सगळे failures गोळा करायला expect.soft; आणि debugging ची साधनं: --headed, --debug, UI mode, codegen, HTML report आणि trace viewer, सोबत flaky tests लपवण्याऐवजी दाखवणारे retries." },
    },
    lesson: [
      { en: "confirm(), alert() and prompt() pop-ups are drawn by the browser, not by the page, so no locator can find them. Playwright answers them for you: with no listener, every dialog is dismissed at once, as if the user pressed Cancel. To say yes, listen before the click: page.on('dialog', dialog => dialog.accept()). Inside the listener, dialog.message() is the question the user saw, and that question is part of what you test. One rule: a listener you add must call accept() or dismiss(), otherwise the page waits forever.", mr: "confirm(), alert() आणि prompt() चे pop-ups browser काढतो, page नाही, म्हणून कोणताही locator ते शोधू शकत नाही. Playwright तुमच्यासाठी उत्तर देतो: listener नसेल तर प्रत्येक dialog लगेच dismiss होतो, जणू user ने Cancel दाबलं. हो म्हणायचं असेल तर click च्या आधी ऐकायला सुरुवात करा: page.on('dialog', dialog => dialog.accept()). listener मध्ये dialog.message() म्हणजे user ने पाहिलेला प्रश्न, आणि तो प्रश्नसुद्धा तुम्ही test करायचा भाग आहे. एक नियम: तुम्ही जोडलेल्या listener ने accept() किंवा dismiss() बोलवायलाच हवं, नाहीतर page कायम थांबून राहतं." },
      { en: "Make the report readable. await test.step('Pay for the trip', async () => { ... }) groups lines under a name, so a failure says \"in step Pay for the trip\". await page.screenshot({ path: 'shots/payment.png' }) saves a picture on the way (the config option screenshot: 'only-on-failure' does it for every failure). And await expect.soft(...) records a failed check and keeps going; the test still fails at the end, with every soft failure listed. Use soft checks for independent things on one page, like price lines. Keep a normal expect where later steps depend on it.", mr: "report वाचण्याजोगा करा. await test.step('Pay for the trip', async () => { ... }) ओळींना एका नावाखाली गटात ठेवतो, म्हणून failure \"in step Pay for the trip\" असं सांगतो. await page.screenshot({ path: 'shots/payment.png' }) वाटेत एक फोटो जतन करतो (config मधला screenshot: 'only-on-failure' पर्याय प्रत्येक failure साठी हेच करतो). आणि await expect.soft(...) fail झालेला check नोंदवतो आणि पुढे जातो; test शेवटी तरीही fail होते, सगळ्या soft failures च्या यादीसह. एकाच page वरच्या स्वतंत्र गोष्टींसाठी soft checks वापरा, जसं price च्या ओळी. पुढच्या पायऱ्या ज्यावर अवलंबून आहेत तिथे साधा expect ठेवा." },
      { en: "The debugging toolbox. npx playwright test --headed shows the browser while it runs. --debug opens the Inspector and pauses before each action so you can step through (await page.pause() pauses at one line). --ui opens UI mode: run one test, watch it, and travel back through every action. npx playwright codegen records your clicks as code: a quick start, then you clean the locators and add the assertions. The trace viewer (trace: 'on-first-retry' in the config, then npx playwright show-trace) replays a CI run action by action with page snapshots, network calls and console. npx playwright show-report opens the HTML report.", mr: "debugging ची साधनं. npx playwright test --headed चालताना browser दाखवतो. --debug Inspector उघडतो आणि प्रत्येक action आधी थांबतो, म्हणजे तुम्ही एकेक पायरी चालवू शकता (await page.pause() एका ओळीवर थांबवतो). --ui म्हणजे UI mode: एक test चालवा, पाहा, आणि प्रत्येक action मधून मागे जाऊन पाहा. npx playwright codegen तुमचे clicks code म्हणून नोंदवतो: पटकन सुरुवात, मग locators नीट करा आणि assertions जोडा. trace viewer (config मध्ये trace: 'on-first-retry', मग npx playwright show-trace) CI चा run action-न-action पुन्हा दाखवतो, page चे snapshots, network calls आणि console सह. npx playwright show-report HTML report उघडतो." },
      { en: "In CI (GitHub Actions, Jenkins...) the suite runs headless on every push: install the browsers (npx playwright install --with-deps), run npx playwright test, keep the HTML report and traces as artifacts. Set retries: process.env.CI ? 2 : 0. A test that fails and then passes on a retry is marked flaky: the gate let it through, but something raced, in the test or in the app, so it gets a ticket. Visual testing, await expect(page).toHaveScreenshot(), compares pixels with a saved baseline image; our lab cannot draw pixels, so we only describe it here.", mr: "CI मध्ये (GitHub Actions, Jenkins...) प्रत्येक push वर suite headless चालतो: browsers install करा (npx playwright install --with-deps), npx playwright test चालवा, HTML report आणि traces artifacts म्हणून ठेवा. retries: process.env.CI ? 2 : 0 ठेवा. आधी fail होऊन retry मध्ये pass होणारी test flaky म्हणून दाखवली जाते: gate ने तिला जाऊ दिलं, पण test मध्ये किंवा app मध्ये कुठेतरी शर्यत लागली, म्हणून तिचं ticket बनतं. Visual testing, म्हणजे await expect(page).toHaveScreenshot(), जतन केलेल्या baseline फोटोशी pixels ची तुलना करतं; आपली lab pixels काढू शकत नाही, म्हणून इथे आपण त्याचं फक्त वर्णन करतो." },
    ],
    syntax: {
      template: `test.use({ storageState: 'auth/asha.json' });

test('cancel asks before it cancels', async ({ page }) => {
  let question = '';
  page.on('dialog', dialog => { question = dialog.message(); dialog.accept(); });
  await test.step('Cancel the Goa trip', async () => {
    await page.goto('/trips');
    await page.getByRole('button', { name: 'Cancel trip' }).click();
  });
  await page.screenshot({ path: 'shots/cancelled.png' });
  expect(question).toBe('Cancel trip SKY1A2? This cannot be undone.');
  await expect.soft(page.getByTestId('trip-status').first()).toHaveText('Cancelled');
});`,
      parts: [
        { code: "page.on('dialog', dialog => ...)", means: { en: 'listen for native pop-ups; register it before the click that opens one', mr: 'native pop-ups साठी ऐकत राहा; pop-up उघडणाऱ्या click च्या आधी नोंदवा' } },
        { code: 'dialog.message()', means: { en: 'the question the user saw, worth checking', mr: 'user ने पाहिलेला प्रश्न, तपासण्याजोगा' } },
        { code: 'dialog.accept() / dialog.dismiss()', means: { en: 'press OK or Cancel; with no listener Playwright dismisses', mr: 'OK किंवा Cancel दाबा; listener नसेल तर Playwright dismiss करतो' } },
        { code: "test.step('name', async () => { ... })", means: { en: 'a named chapter in the report and the trace', mr: 'report आणि trace मधला नाव असलेला एक भाग' } },
        { code: "page.screenshot({ path, fullPage: true })", means: { en: 'save a picture of the page on the way', mr: 'वाटेत page चा फोटो जतन करा' } },
        { code: 'expect.soft(...)', means: { en: 'note the failure and keep going; the test fails at the end', mr: 'failure नोंदवा आणि पुढे जा; test शेवटी fail होते' } },
        { code: '--headed · --debug · --ui · codegen · show-trace · show-report', means: { en: 'watch, step, time-travel, record, replay a CI run, read the report', mr: 'पाहा, एकेक पायरी, मागे जाऊन पाहा, नोंदवा, CI run पुन्हा पाहा, report वाचा' } },
      ],
      example: [
        { code: "page.on('dialog', d => d.accept());", note: { en: 'Meera decides the answer before the decorator asks', mr: 'decorator विचारण्याआधीच मीरा उत्तर ठरवते' } },
        { code: "await test.step('Seating area', async () => { /* ... */ });", note: { en: 'she names each section out loud', mr: 'ती प्रत्येक भागाचं नाव मोठ्याने सांगते' } },
        { code: "await page.screenshot({ path: 'shots/seating.png' });", note: { en: 'a photo in every section', mr: 'प्रत्येक भागात एक फोटो' } },
        { code: "await expect.soft(page.getByTestId('total')).toHaveText('₹4,799');", note: { en: 'a broken fan is written down, and the walk goes on', mr: 'बिघडलेला पंखा लिहून ठेवला, आणि फेरी सुरूच' } },
        { code: 'npx playwright show-trace trace.zip', note: { en: 'next morning the photos and the list tell the story', mr: 'दुसऱ्या दिवशी सकाळी फोटो आणि यादी गोष्ट सांगतात' } },
      ],
      exampleNote: { en: 'A good failure report answers three questions without a rerun: in which step, what did the page look like, and what else was wrong.', mr: 'चांगला failure report पुन्हा न चालवता तीन प्रश्नांची उत्तरं देतो: कोणत्या step मध्ये, page कसं दिसत होतं, आणि अजून काय चुकलं होतं.' },
      pitfall: { en: "Register page.on('dialog') before the click, not after: the dialog opens during the click. And a pass on retry is not a pass: it is a flaky test, and a flaky gate soon gets ignored. Read the trace of the failed attempt and fix the race.", mr: "page.on('dialog') click च्या आधी नोंदवा, नंतर नाही: dialog click होतानाच उघडतो. आणि retry मधला pass हा खरा pass नाही: ती flaky test आहे, आणि flaky gate कडे लवकरच दुर्लक्ष होतं. fail झालेल्या प्रयत्नाचा trace वाचा आणि शर्यत दुरुस्त करा." },
    },
    practice: {
      intro: { en: 'First see what Playwright does with a dialog when nobody answers. Then answer it on purpose, turn a booking into a story with steps and a screenshot, catch two bugs in one run with soft checks, and decide what a flaky pass in CI means.', mr: 'आधी कोणी उत्तर दिलं नाही तर Playwright dialog चं काय करतो ते पाहा. मग ठरवून उत्तर द्या, steps आणि screenshot ने एका booking ची गोष्ट बनवा, soft checks ने एकाच run मध्ये दोन bugs पकडा, आणि CI मधला flaky pass म्हणजे काय ते ठरवा.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'Theo wrote this test to cancel Asha\'s Goa trip. Press Run, read the log (look for the yellow line) and the browser. Why is the trip still Confirmed?', mr: 'Asha ची Goa trip cancel करायला Theo ने ही test लिहिली. Run दाबा, log (पिवळी ओळ शोधा) आणि browser वाचा. trip अजून Confirmed का आहे?' },
          playwrightSandbox: {
            startUrl: '/trips',
            loggedIn: true,
            code: `${H}test.use({ storageState: 'auth/asha.json' });

test('cancel the Goa trip', async ({ page }) => {
  await page.goto('/trips');
  const trip = page.getByTestId('trip').filter({ hasText: 'SKY1A2' });
  await trip.getByRole('button', { name: 'Cancel trip' }).click();
  await page.reload();
  await expect(trip.getByTestId('trip-status')).toHaveText('Confirmed');
});
`,
          },
          options: [
            { en: 'The Cancel trip locator matched nothing, so nothing was clicked', mr: 'Cancel trip च्या locator ला काहीच सापडलं नाही, म्हणून click झालंच नाही' },
            { en: 'The page asked "Cancel trip SKY1A2? This cannot be undone." and, with no dialog listener, Playwright dismissed it like pressing Cancel', mr: 'page ने विचारलं "Cancel trip SKY1A2? This cannot be undone." आणि dialog listener नसल्यामुळे Playwright ने Cancel दाबल्यासारखा तो dismiss केला' },
            { en: 'The trips API is down', mr: 'trips चा API बंद आहे' },
            { en: 'page.reload() brought the cancelled trip back', mr: 'page.reload() ने cancel झालेली trip परत आणली' },
          ],
          correct: [1],
          explain: { en: 'The click worked and the confirm dialog opened. Playwright answers every dialog nobody listens for with dismiss, and the log says so. On the good build that is safe: nothing is cancelled by accident. To really cancel, the test must say yes with page.on(\'dialog\', ...).', mr: 'click झालं आणि confirm dialog उघडला. ज्या dialog साठी कोणी ऐकत नाही त्याला Playwright dismiss ने उत्तर देतो, आणि log तसं सांगतो. चांगल्या build वर हे सुरक्षित आहे: चुकून काहीच cancel होत नाही. खरंच cancel करायचं असेल तर test ने page.on(\'dialog\', ...) ने हो म्हणायला हवं.' },
          hints: [
            { en: 'Find the yellow warning in the log. Which word does it use for what happened to the dialog?', mr: 'log मधली पिवळी सूचना शोधा. dialog चं काय झालं हे सांगायला ती कोणता शब्द वापरते?' },
            { en: 'Like the caretaker at the hall: a question nobody prepared him for gets a "no".', mr: 'हॉलमधल्या काळजीवाहू माणसासारखं: ज्या प्रश्नासाठी त्याला कोणी तयार केलं नाही, त्याचं उत्तर "नाही".' },
          ],
          successLine: { en: 'Playwright says no unless you say yes. Safe by default, and now you know where the warning shows up.', mr: 'तुम्ही हो म्हटल्याशिवाय Playwright नाही म्हणतो. आपोआप सुरक्षित, आणि सूचना कुठे दिसते ते आता तुम्हाला माहीत आहे.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Now cancel it on purpose, and check the question. Before the click, listen for the dialog: save dialog.message() into question and accept it. Then assert the trip\'s trip-status is "Cancelled", the role=status message is "Trip SKY1A2 cancelled. Your refund has started." and question is "Cancel trip SKY1A2? This cannot be undone." Your test must also catch the Gremlin\'s build where the dialog is gone.', mr: 'आता ठरवून cancel करा, आणि प्रश्न तपासा. click च्या आधी dialog साठी ऐका: dialog.message() question मध्ये ठेवा आणि accept करा. मग trip चं trip-status "Cancelled" आहे, role=status मधला message "Trip SKY1A2 cancelled. Your refund has started." आहे आणि question "Cancel trip SKY1A2? This cannot be undone." आहे हे assert करा. dialog गायब असलेला gremlin चा build सुद्धा तुमच्या test ने पकडायला हवा.' },
          startUrl: '/trips',
          loggedIn: true,
          starter: `${H}test.use({ storageState: 'auth/asha.json' });

test('cancel asks before it cancels', async ({ page }) => {
  let question = '';
  // TODO: listen for the dialog: save dialog.message() in question, then accept it
  await page.goto('/trips');
  const trip = page.getByTestId('trip').filter({ hasText: 'SKY1A2' });
  await trip.getByRole('button', { name: 'Cancel trip' }).click();
  // TODO: assert the trip-status inside trip is 'Cancelled'
  // TODO: assert the role=status message
  // TODO: assert question with expect(question).toBe(...)
});
`,
          solution: `${H}test.use({ storageState: 'auth/asha.json' });

test('cancel asks before it cancels', async ({ page }) => {
  let question = '';
  page.on('dialog', dialog => {
    question = dialog.message();
    dialog.accept();
  });
  await page.goto('/trips');
  const trip = page.getByTestId('trip').filter({ hasText: 'SKY1A2' });
  await trip.getByRole('button', { name: 'Cancel trip' }).click();
  await expect(trip.getByTestId('trip-status')).toHaveText('Cancelled');
  await expect(page.getByRole('status')).toHaveText('Trip SKY1A2 cancelled. Your refund has started.');
  expect(question).toBe('Cancel trip SKY1A2? This cannot be undone.');
});
`,
          minAssertions: 3,
          noWaitForTimeout: true,
          mustUse: [
            { pattern: "page\\.(on|once)\\(\\s*'dialog'", message: { en: "Listen for the dialog with page.on('dialog', dialog => { ... }) before the click.", mr: "click च्या आधी page.on('dialog', dialog => { ... }) ने dialog साठी ऐका." } },
            { pattern: '\\.message\\(\\)', message: { en: 'Save the question with dialog.message() and check it.', mr: 'प्रश्न dialog.message() ने जतन करा आणि तपासा.' } },
            { pattern: '\\.accept\\(\\)', message: { en: 'Say yes with dialog.accept(), or the trip stays Confirmed.', mr: 'dialog.accept() ने हो म्हणा, नाहीतर trip Confirmed च राहते.' } },
          ],
          verify: [{ check: (s) => s.dialogs.some((d) => d.accepted), message: { en: 'No dialog was accepted. Register the listener before the click and call dialog.accept() inside it.', mr: 'एकही dialog accept झाला नाही. listener click च्या आधी नोंदवा आणि त्यात dialog.accept() बोलवा.' } }],
          mustCatch: [{ bug: 'cancel-no-dialog', label: { en: 'Cancel trip cancels at once, without asking', mr: 'Cancel trip न विचारता लगेच cancel करतं' } }],
          hints: [
            { en: 'The listener is a function that gets the dialog. Inside it, do two things: copy dialog.message() into question, then call dialog.accept(). It must come before the click.', mr: 'listener हे dialog मिळणारं एक function आहे. त्यात दोन गोष्टी करा: dialog.message() question मध्ये ठेवा, मग dialog.accept() बोलवा. ते click च्या आधी यायला हवं.' },
            c("page.on('dialog', dialog => {\n  question = dialog.message();\n  dialog.accept();\n});"),
            { en: 'question is a plain string, so it uses a plain expect(question).toBe(...) with no await. The status line and the badge are on the page, so they use await expect(locator).toHaveText(...).', mr: 'question हा साधा string आहे, म्हणून त्याला await शिवाय साधा expect(question).toBe(...) लागतो. status ची ओळ आणि badge page वर आहेत, म्हणून त्यांना await expect(locator).toHaveText(...) लागतो.' },
            c("await expect(trip.getByTestId('trip-status')).toHaveText('Cancelled');\nawait expect(page.getByRole('status')).toHaveText('Trip SKY1A2 cancelled. Your refund has started.');\nexpect(question).toBe('Cancel trip SKY1A2? This cannot be undone.');"),
          ],
          successLine: { en: 'On the Gremlin\'s build the trip was cancelled too, but question stayed empty, and your last line went red. You test the question, not only the click.', mr: 'gremlin च्या build वरही trip cancel झाली, पण question रिकामाच राहिला, आणि तुमची शेवटची ओळ लाल झाली. तुम्ही फक्त click नाही, प्रश्नसुद्धा test करता.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Make this booking read like a story. The first step is done. Add three more test.step blocks: "Add insurance" (tick "Add travel insurance", click "Continue to payment"), "Check the price" (page.screenshot to "shots/payment.png", then insurance "₹299", total "₹4,799" and the button "Pay ₹4,799" visible), and "Pay" (click that button, assert paid is "₹4,799").', mr: 'या booking ची गोष्ट वाचता येईल अशी करा. पहिली पायरी झाली आहे. अजून तीन test.step blocks जोडा: "Add insurance" ("Add travel insurance" वर tick, "Continue to payment" वर click), "Check the price" ("shots/payment.png" ला page.screenshot, मग insurance "₹299", total "₹4,799" आणि "Pay ₹4,799" बटण दिसतं), आणि "Pay" (त्या बटणावर click, paid "₹4,799" आहे हे assert).' },
          startUrl: '/passenger?demo=1',
          starter: `${H}test('an insured booking, step by step', async ({ page }) => {
  await test.step('Open the passenger page', async () => {
    await page.goto('/passenger?demo=1');
    await expect(page.getByLabel('Full name')).toHaveValue('Asha Patil');
  });
  // TODO: test.step('Add insurance', ...)
  // TODO: test.step('Check the price', ...) with a screenshot and three assertions
  // TODO: test.step('Pay', ...)
});
`,
          solution: `${H}test('an insured booking, step by step', async ({ page }) => {
  await test.step('Open the passenger page', async () => {
    await page.goto('/passenger?demo=1');
    await expect(page.getByLabel('Full name')).toHaveValue('Asha Patil');
  });
  await test.step('Add insurance', async () => {
    await page.getByRole('checkbox', { name: 'Add travel insurance' }).check();
    await page.getByRole('button', { name: 'Continue to payment' }).click();
  });
  await test.step('Check the price', async () => {
    await page.screenshot({ path: 'shots/payment.png' });
    await expect(page.getByTestId('insurance')).toHaveText('₹299');
    await expect(page.getByTestId('total')).toHaveText('₹4,799');
    await expect(page.getByRole('button', { name: 'Pay ₹4,799' })).toBeVisible();
  });
  await test.step('Pay', async () => {
    await page.getByRole('button', { name: 'Pay ₹4,799' }).click();
    await expect(page.getByTestId('paid')).toHaveText('₹4,799');
  });
});
`,
          minAssertions: 5,
          noWaitForTimeout: true,
          mustUse: [
            { pattern: 'test\\.step\\([\\s\\S]*test\\.step\\([\\s\\S]*test\\.step\\([\\s\\S]*test\\.step\\(', message: { en: 'Use four test.step blocks in total: the one given plus Add insurance, Check the price and Pay.', mr: 'एकूण चार test.step blocks वापरा: दिलेला एक, आणि Add insurance, Check the price आणि Pay.' } },
            { pattern: 'page\\.screenshot\\(', message: { en: "Take a picture on the payment page: await page.screenshot({ path: 'shots/payment.png' }).", mr: "payment page वर फोटो काढा: await page.screenshot({ path: 'shots/payment.png' })." } },
          ],
          mustCatch: [{ bug: 'total-wrong', label: { en: 'The total counts insurance twice', mr: 'total मध्ये insurance दोनदा मोजला जातो' } }],
          hints: [
            { en: 'Every step has the same shape: await test.step(\'name\', async () => { ...lines... }); The lines inside are the ones you already know. 4500 + 299 = 4799.', mr: 'प्रत्येक step ची रचना एकच: await test.step(\'name\', async () => { ...ओळी... }); आतल्या ओळी तुम्हाला आधीच माहीत आहेत. 4500 + 299 = 4799.' },
            c("await test.step('Add insurance', async () => {\n  await page.getByRole('checkbox', { name: 'Add travel insurance' }).check();\n  await page.getByRole('button', { name: 'Continue to payment' }).click();\n});"),
            { en: 'In "Check the price", the screenshot comes first, then three expects on the test ids insurance and total and on the Pay button.', mr: '"Check the price" मध्ये आधी screenshot, मग insurance आणि total या test ids वर आणि Pay बटणावर तीन expects.' },
            c("await test.step('Check the price', async () => {\n  await page.screenshot({ path: 'shots/payment.png' });\n  await expect(page.getByTestId('insurance')).toHaveText('₹299');\n  await expect(page.getByTestId('total')).toHaveText('₹4,799');\n  await expect(page.getByRole('button', { name: 'Pay ₹4,799' })).toBeVisible();\n});\nawait test.step('Pay', async () => {\n  await page.getByRole('button', { name: 'Pay ₹4,799' }).click();\n  await expect(page.getByTestId('paid')).toHaveText('₹4,799');\n});"),
          ],
          successLine: { en: 'On the buggy build the report now says: in step "Check the price", total was ₹5,098, and there is a picture of the page. Theo can read that at 2 am without running anything.', mr: 'buggy build वर report आता सांगतो: "Check the price" या step मध्ये total ₹5,098 होता, आणि page चा फोटोही आहे. Theo रात्री 2 वाजता काहीही न चालवता ते वाचू शकतो.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Tonight\'s build has more than one problem on the results page, and you want them all from one run. After the results load, sort by "Lowest price" (value "price") and soft-check that the first price is "₹3,600". Tick "Non-stop only" and soft-check that there are 3 cards and that no card contains "1 stop" (filter + toHaveCount(0)). On this build the test must fail, and the report should list every soft failure. On the good build it must pass.', mr: 'आजच्या रात्रीच्या build मध्ये results page वर एकापेक्षा जास्त अडचणी आहेत, आणि त्या सगळ्या तुम्हाला एकाच run मधून हव्यात. results आल्यावर "Lowest price" (value "price") ने sort करा आणि पहिली price "₹3,600" आहे हे soft-check करा. "Non-stop only" वर tick करा आणि 3 cards आहेत आणि एकाही card मध्ये "1 stop" नाही (filter + toHaveCount(0)) हे soft-check करा. या build वर test fail व्हायला हवी, आणि report ने प्रत्येक soft failure सांगायला हवं. चांगल्या build वर ती pass व्हायला हवी.' },
          startUrl: FL,
          build: ['nonstop-filter', 'sort-price'],
          expectFailure: true,
          starter: `${H}test('results page, all checks in one run', async ({ page }) => {
  await page.goto('${FL}');
  await expect(page.getByTestId('result-count')).toHaveText('5 flights');
  // TODO: sort by 'price', soft-check the first price is '₹3,600'
  // TODO: tick 'Non-stop only', soft-check 3 cards
  // TODO: soft-check no card contains '1 stop'
});
`,
          solution: `${H}test('results page, all checks in one run', async ({ page }) => {
  await page.goto('${FL}');
  await expect(page.getByTestId('result-count')).toHaveText('5 flights');
  await page.getByLabel('Sort by').selectOption('price');
  await expect.soft(page.getByTestId('price').first()).toHaveText('₹3,600');
  await page.getByLabel('Non-stop only').check();
  await expect.soft(page.getByTestId('flight-card')).toHaveCount(3);
  await expect.soft(page.getByTestId('flight-card').filter({ hasText: '1 stop' })).toHaveCount(0);
});
`,
          noWaitForTimeout: true,
          mustUse: [{ pattern: 'expect\\.soft\\([\\s\\S]*expect\\.soft\\([\\s\\S]*expect\\.soft\\(', message: { en: 'Use expect.soft for all three checks, so one failure does not hide the others.', mr: 'तिन्ही checks साठी expect.soft वापरा, म्हणजे एक failure बाकीचे लपवणार नाही.' } }],
          hints: [
            { en: 'expect.soft has the same shape as expect, and it still needs await in front: await expect.soft(locator).toHaveText(...).', mr: 'expect.soft ची रचना expect सारखीच आहे, आणि त्याच्या पुढेही await लागतो: await expect.soft(locator).toHaveText(...).' },
            c("await page.getByLabel('Sort by').selectOption('price');\nawait expect.soft(page.getByTestId('price').first()).toHaveText('₹3,600');"),
            { en: 'For the non-stop checks: check() the box, then soft toHaveCount(3) on the cards, and soft toHaveCount(0) on the cards filtered with hasText: \'1 stop\'.', mr: 'non-stop च्या checks साठी: box ला check() करा, मग cards वर soft toHaveCount(3), आणि hasText: \'1 stop\' ने filter केलेल्या cards वर soft toHaveCount(0).' },
            c("await page.getByLabel('Non-stop only').check();\nawait expect.soft(page.getByTestId('flight-card')).toHaveCount(3);\nawait expect.soft(page.getByTestId('flight-card').filter({ hasText: '1 stop' })).toHaveCount(0);"),
          ],
          successLine: { en: 'One run, three red lines: the sort does nothing, and the filter lets SH 305 through. With plain expects you would have found the sort, fixed it, rerun, and only then met the filter.', mr: 'एक run, तीन लाल ओळी: sort काहीच करत नाही, आणि filter SH 305 ला जाऊ देतो. साध्या expects ने तुम्हाला आधी sort सापडला असता, तो दुरुस्त करून पुन्हा चालवल्यावरच filter भेटला असता.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Last night\'s CI report: "booking › pays with coupon" failed on the first attempt, passed on retry #1, and is marked flaky. The pipeline is green. Theo says: "Green is green, ship it." What do you do?', mr: 'काल रात्रीचा CI report: "booking › pays with coupon" पहिल्या प्रयत्नात fail झाली, retry #1 मध्ये pass झाली, आणि flaky म्हणून दाखवली आहे. pipeline हिरवी आहे. Theo म्हणतो: "हिरवं म्हणजे हिरवं, ship करा." तुम्ही काय करता?' },
          options: [
            { en: 'Ship and forget it: retries exist so we never have to look at these', mr: 'ship करा आणि विसरा: retries असतात ते यांच्याकडे कधी पाहावं लागू नये म्हणूनच' },
            { en: 'Delete the test, it is unreliable', mr: 'test delete करा, ती भरवशाची नाही' },
            { en: 'Let the release go if the gate allows it, open the trace of the failed first attempt in the trace viewer, find what raced (test or app) and file a ticket to fix it', mr: 'gate परवानगी देत असेल तर release जाऊ द्या, fail झालेल्या पहिल्या प्रयत्नाचा trace trace viewer मध्ये उघडा, काय शर्यत लागली (test की app) ते शोधा आणि दुरुस्तीसाठी ticket टाका' },
            { en: 'Add page.waitForTimeout(3000) before the coupon step', mr: 'coupon च्या पायरीआधी page.waitForTimeout(3000) टाका' },
          ],
          correct: [2],
          explain: { en: 'A flaky test is a real signal: either the test races the page or the app has a timing bug a passenger could hit too. With trace: \'on-first-retry\' the failed attempt was recorded, so you can see the page, network and console at the exact action that failed. Deleting it loses coverage, a sleep hides the race, and ignoring it teaches everyone to distrust the gate.', mr: 'flaky test हा खरा इशारा आहे: एकतर test page शी शर्यत लावते, किंवा app मध्ये timing चा bug आहे जो प्रवाशालाही लागू शकतो. trace: \'on-first-retry\' मुळे fail झालेला प्रयत्न नोंदवला गेला, म्हणून नेमक्या fail झालेल्या action वर page, network आणि console तुम्ही पाहू शकता. delete केल्याने coverage जातं, sleep शर्यत लपवतो, आणि दुर्लक्ष केलं तर gate वरचा विश्वास सगळ्यांचाच उडतो.' },
          hints: [
            { en: 'Flaky means: same code, different result. Something is not deterministic. Where can you see exactly what happened in the failed attempt?', mr: 'flaky म्हणजे: तोच code, वेगळा निकाल. काहीतरी ठरलेलं नाही. fail झालेल्या प्रयत्नात नेमकं काय झालं ते कुठे पाहता येईल?' },
            { en: 'Two of the options hide the problem, one throws away the test. Which one keeps the evidence and acts on it?', mr: 'दोन पर्याय अडचण लपवतात, एक test फेकून देतो. कोणता पुरावा जपतो आणि त्यावर कृती करतो?' },
          ],
          successLine: { en: 'Retries keep the pipeline moving. Traces make sure the flakiness gets fixed. That is how a gate stays trusted.', mr: 'retries pipeline चालू ठेवतात. traces flakiness दुरुस्त होईल याची खात्री करतात. gate वरचा विश्वास असाच टिकतो.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'This test has no dialog listener. The page opens a confirm "Cancel trip SKY1A2? This cannot be undone." during the click. What happens?', mr: 'या test मध्ये dialog listener नाही. click होताना page confirm "Cancel trip SKY1A2? This cannot be undone." उघडतं. काय होतं?' },
        code: "await page.goto('/trips');\nawait page.getByRole('button', { name: 'Cancel trip' }).click();",
        options: [
          { en: 'The test hangs until the 30 second test timeout', mr: 'test 30 सेकंदांच्या test timeout पर्यंत अडकून राहते' },
          { en: 'Playwright dismisses the dialog automatically, so the trip is not cancelled', mr: 'Playwright dialog आपोआप dismiss करतो, म्हणून trip cancel होत नाही' },
          { en: 'Playwright accepts the dialog automatically, so the trip is cancelled', mr: 'Playwright dialog आपोआप accept करतो, म्हणून trip cancel होते' },
          { en: 'The click fails with "dialog is blocking the page"', mr: 'click "dialog is blocking the page" देऊन fail होतं' },
        ],
        answer: 1,
        explain: { en: 'With no listener, every dialog is dismissed. To say yes, register page.on(\'dialog\', d => d.accept()) before the click. A listener that never accepts or dismisses is what makes a page hang.', mr: 'listener नसेल तर प्रत्येक dialog dismiss होतो. हो म्हणायचं असेल तर click च्या आधी page.on(\'dialog\', d => d.accept()) नोंदवा. कधीच accept किंवा dismiss न करणारा listener असेल, तेव्हा page अडकतं.' },
      },
      {
        q: { en: 'A test failed in CI last night but passes on your laptop. Which tool lets you replay that CI run action by action, with page snapshots, network calls and console?', mr: 'काल रात्री CI मध्ये एक test fail झाली पण तुमच्या laptop वर pass होते. कोणतं साधन तो CI run action-न-action पुन्हा दाखवतं, page snapshots, network calls आणि console सह?' },
        options: [
          { en: 'npx playwright codegen', mr: 'npx playwright codegen' },
          { en: 'npx playwright test --headed', mr: 'npx playwright test --headed' },
          { en: 'await page.pause()', mr: 'await page.pause()' },
          { en: 'The trace viewer: record with trace: \'on-first-retry\', then npx playwright show-trace', mr: 'trace viewer: trace: \'on-first-retry\' ने नोंदवा, मग npx playwright show-trace' },
        ],
        answer: 3,
        explain: { en: 'codegen records new code, --headed and page.pause() help on your own machine. Only the trace was recorded during the CI run itself, so only the trace shows what happened there.', mr: 'codegen नवा code नोंदवतो, --headed आणि page.pause() तुमच्या स्वतःच्या machine वर मदत करतात. CI run चालू असताना फक्त trace नोंदवला गेला, म्हणून तिथे काय झालं ते फक्त trace दाखवतो.' },
      },
      {
        q: { en: 'On the buggy build the first two lines fail. What does the report show?', mr: 'buggy build वर पहिल्या दोन ओळी fail होतात. report काय दाखवतो?' },
        code: "await expect.soft(page.getByTestId('fare')).toHaveText('₹4,500');\nawait expect.soft(page.getByTestId('total')).toHaveText('₹4,799');\nawait expect.soft(page.getByTestId('insurance')).toHaveText('₹299');",
        options: [
          { en: 'The test fails, all three lines ran, and both failures are listed', mr: 'test fail होते, तिन्ही ओळी चालल्या, आणि दोन्ही failures यादीत दिसतात' },
          { en: 'The test passes, because soft failures are only warnings', mr: 'test pass होते, कारण soft failures फक्त सूचना असतात' },
          { en: 'The test stops at the first line, like a normal expect', mr: 'साध्या expect सारखी test पहिल्या ओळीवरच थांबते' },
          { en: 'Only the last failure is reported', mr: 'फक्त शेवटचं failure सांगितलं जातं' },
        ],
        answer: 0,
        explain: { en: 'expect.soft notes the failure and keeps going. At the end the test is marked failed and lists every soft failure, so one run shows the whole picture.', mr: 'expect.soft failure नोंदवतो आणि पुढे जातो. शेवटी test fail म्हणून दाखवली जाते आणि प्रत्येक soft failure यादीत येतं, म्हणजे एकाच run मध्ये पूर्ण चित्र दिसतं.' },
      },
      {
        q: { en: 'Sam wants a test that notices when the Pay button moves 40 pixels or turns grey. Which statement about visual testing is true?', mr: 'Pay बटण 40 pixels सरकलं किंवा राखाडी झालं तर लक्षात येईल अशी test Sam ला हवी आहे. visual testing बद्दल कोणतं विधान खरं आहे?' },
        options: [
          { en: 'toHaveText already catches colour and position changes', mr: 'toHaveText रंग आणि जागेतले बदल आधीच पकडतो' },
          { en: 'page.screenshot() fails the test when the page looks different', mr: 'page वेगळं दिसलं की page.screenshot() test fail करतो' },
          { en: 'await expect(page).toHaveScreenshot() compares the page with a saved baseline image; the first run creates the baseline, and a real design change is accepted on purpose with --update-snapshots', mr: 'await expect(page).toHaveScreenshot() page ची जतन केलेल्या baseline फोटोशी तुलना करतं; पहिला run baseline बनवतो, आणि खरा design बदल --update-snapshots ने ठरवून स्वीकारला जातो' },
          { en: 'Visual tests never need updating', mr: 'visual tests कधीच update कराव्या लागत नाहीत' },
        ],
        answer: 2,
        explain: { en: 'page.screenshot() only saves a picture. toHaveScreenshot compares pixels with a baseline and fails on a difference. Baselines must be reviewed and updated deliberately when the design really changes. (Our lab cannot compare pixels, so this one stays on paper.)', mr: 'page.screenshot() फक्त फोटो जतन करतो. toHaveScreenshot baseline शी pixels ची तुलना करतं आणि फरक दिसला की fail होतं. design खरंच बदललं की baselines तपासून ठरवून update कराव्या लागतात. (आपली lab pixels ची तुलना करू शकत नाही, म्हणून हे कागदावरच राहतं.)' },
      },
    ],
    recap: { line: { en: "Answer dialogs on purpose with page.on('dialog') and check their message. Name your steps, take screenshots, collect failures with expect.soft, and read CI failures in the trace. A pass on retry is a flaky test to fix.", mr: "page.on('dialog') ने dialogs ना ठरवून उत्तर द्या आणि त्यांचा message तपासा. steps ना नावं द्या, screenshots काढा, expect.soft ने failures गोळा करा, आणि CI मधले failures trace मध्ये वाचा. retry मधला pass म्हणजे दुरुस्त करायची flaky test." }, icon: '🔦' },
  },

  // ───────────────────────── W2.5 Boss: The Release Gate
  {
    id: 'pw2-5',
    code: 'W2.5',
    level: 'intermediate',
    isBoss: true,
    title: { en: 'Boss: The Release Gate', mr: 'बॉस: रिलीजचं दार' },
    skill: 'A CI release suite: describe, hooks, page objects, API setup and network mocks',
    realLife: {
      place: 'station',
      title: { en: 'The Deccan Queen does not leave until every check is green', mr: 'प्रत्येक check हिरवा झाल्याशिवाय डेक्कन क्वीन निघत नाही' },
      story: {
        en: 'Meera\'s uncle is a train examiner at Pune station. Before the Deccan Queen leaves for Mumbai, his team walks the train. Each person has one job: one checks the brakes on every coach, one tests the doors, one reads the coupling between coaches, one confirms the signal with the control room by phone instead of walking to the signal. They do it the same way every morning, so a check never depends on who is on duty. Today the coupling between coach 4 and 5 is loose. Everything else is green. The train waits. Nobody says "it was fine yesterday" or "check it again and hope". Ten minutes later the coupling is fixed, every check is green, and the train leaves. Passengers never even hear about it.',
        mr: 'मीराचे काका पुणे स्टेशनवर train examiner आहेत. डेक्कन क्वीन मुंबईला निघण्याआधी त्यांची टीम पूर्ण गाडी तपासते. प्रत्येकाचं एक काम: एक जण प्रत्येक डब्याचे brakes तपासतो, एक जण दारं, एक जण डब्यांमधली जोडणी पाहतो, आणि एक जण signal पर्यंत चालत न जाता control room ला फोन करून signal पक्का करतो. ते रोज सकाळी हे एकाच पद्धतीने करतात, म्हणजे कोण duty वर आहे यावर check अवलंबून नसतो. आज डबा 4 आणि 5 मधली जोडणी सैल आहे. बाकी सगळं हिरवं. गाडी थांबते. कोणीही "काल तर ठीक होतं" किंवा "पुन्हा तपासून पाहू, बरं होईल" म्हणत नाही. दहा मिनिटांत जोडणी दुरुस्त होते, प्रत्येक check हिरवा होतो, आणि गाडी निघते. प्रवाशांना याबद्दल कळतही नाही.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🛑', label: 'Brakes on every coach: green', mr: 'प्रत्येक डब्याचे brakes: हिरवे' },
          { icon: '🚪', label: 'Doors: green', mr: 'दारं: हिरवी' },
          { icon: '🔗', label: 'Coupling coach 4 to 5: loose', mr: 'डबा 4 ते 5 जोडणी: सैल' },
          { icon: '📞', label: 'Signal confirmed by phone', mr: 'signal फोनवरून पक्का' },
          { icon: '🚆', label: 'The train leaves', mr: 'गाडी निघते' },
        ],
        breakAt: 2,
        breakNote: { en: 'One red check holds the train. Fix it, then every check runs green, then it leaves.', mr: 'एक लाल check गाडी थांबवतो. तो दुरुस्त करा, मग सगळे checks हिरवे, मग गाडी निघते.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'neutral', text: { en: 'From Monday, nothing reaches SkyHop passengers unless the release suite is green in CI. No green, no release. Even for my favourite feature.', mr: 'सोमवारपासून CI मध्ये release suite हिरवा असल्याशिवाय काहीच SkyHop च्या प्रवाशांपर्यंत पोहोचणार नाही. हिरवा नाही, release नाही. माझ्या आवडत्या feature साठीसुद्धा.' } },
        { who: 'theo', mood: 'worried', text: { en: 'Then the suite has to be fast and it must never cry wolf. One flaky test and people start clicking "merge anyway".', mr: 'मग suite जलद हवा आणि त्याने कधीच खोटा आरडाओरडा करता कामा नये. एक flaky test, आणि लोक "तरीही merge करा" दाबायला लागतात.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> eight presents, hidden all over skyhop. a filter that lies. an outage that stays quiet. a coupon that doubles. a trip that vanishes. a cancel that never asks. can one gate stop them all? ⌁', mr: '>> आठ भेटी, संपूर्ण skyhop भर लपवलेल्या. खोटं बोलणारा filter. शांत राहणारं outage. दुप्पट होणारा coupon. गायब होणारी trip. कधीच न विचारणारं cancel. एक gate हे सगळं थांबवू शकेल? ⌁' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Build it like a pro: grouped tests with hooks for the setup, page objects for the screens, the API for quick setup and backend rules, and a mock for the outage we cannot wait for.', mr: 'व्यावसायिकासारखं बांधा: setup साठी hooks असलेल्या गटांतल्या tests, screens साठी page objects, पटकन setup आणि backend च्या नियमांसाठी API, आणि ज्या outage ची वाट पाहू शकत नाही त्यासाठी mock.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Boss round, {name}. Two hints per step. Every check in this gate has to earn its place.', mr: 'बॉस round, {name}. प्रत्येक step ला दोन hints. या gate मधल्या प्रत्येक check ने आपली जागा कमवायला हवी.' } },
      ],
      problem: { en: 'Releases reach passengers with bugs hiding in every corner: a non-stop filter that lets a 1-stop flight through, an API outage the page does not admit, a hidden login error, a doubling coupon, a double-counted insurance, a seat the backend sells twice, a new trip missing from My trips, and a cancel that never asks. A slow or flaky suite cannot guard that door.', mr: 'प्रत्येक कोपऱ्यात लपलेल्या bugs सह releases प्रवाशांपर्यंत पोहोचतात: 1-stop flight ला जाऊ देणारा non-stop filter, page मान्यच करत नाही असं API outage, लपलेला login error, दुप्पट होणारा coupon, दोनदा मोजलेला insurance, backend दोनदा विकणारी seat, My trips मधून गायब नवी trip, आणि कधीच न विचारणारं cancel. संथ किंवा flaky suite हे दार राखू शकत नाही.' },
      solution: { en: 'A release suite where every test is independent, fast and meaningful: describe blocks with beforeEach for setup, page objects so a changed label is fixed in one place, request calls to create data and check backend rules, route.fulfill to rehearse an outage on demand, and dialog handling for the cancel flow. Each test has to fail on a real bug.', mr: 'असा release suite जिथे प्रत्येक test स्वतंत्र, जलद आणि अर्थपूर्ण आहे: setup साठी beforeEach असलेले describe blocks, बदललेला label एकाच ठिकाणी दुरुस्त व्हावा म्हणून page objects, data तयार करायला आणि backend चे नियम तपासायला request calls, हवं तेव्हा outage ची रंगीत तालीम करायला route.fulfill, आणि cancel flow साठी dialog हाताळणी. प्रत्येक test खऱ्या bug वर fail व्हायलाच हवी.' },
    },
    lesson: [
      { en: 'A release gate is a suite CI runs on every change; red means the release waits. That only works if every test is independent (each one sets up what it needs, in any order), fast (no sleeps, the API for setup), and deterministic (the same build always gives the same result). Group tests with test.describe, put the shared opening in test.beforeEach, and keep the screens in page objects so a renamed button is one edit.', mr: 'release gate म्हणजे प्रत्येक बदलावर CI चालवतो असा suite; लाल म्हणजे release थांबतं. हे तेव्हाच चालतं जेव्हा प्रत्येक test स्वतंत्र असते (प्रत्येक जण आपल्याला लागणारं स्वतः तयार करते, कोणत्याही क्रमाने), जलद असते (sleep नाही, setup साठी API), आणि ठरलेली असते (एकाच build वर नेहमी एकच निकाल). tests test.describe ने गटात ठेवा, सामायिक सुरुवात test.beforeEach मध्ये ठेवा, आणि screens page objects मध्ये ठेवा, म्हणजे नाव बदललेलं बटण म्हणजे एकच दुरुस्ती.' },
      { en: 'Pick the right level for each check. The API is the fast way to create a booking or to check a backend rule (a taken seat must be refused with 409). The UI is where you check what the passenger sees: the trip in My trips, the alert, the price. A mock (page.route + fulfill) gives you situations you cannot create on demand, like the flights API returning 500.', mr: 'प्रत्येक check साठी योग्य पातळी निवडा. booking तयार करायला किंवा backend चा नियम तपासायला API हा जलद मार्ग आहे (घेतलेली seat 409 सह नाकारली गेलीच पाहिजे). प्रवाशाला काय दिसतं ते UI वर तपासा: My trips मधली trip, alert, price. mock (page.route + fulfill) तुम्हाला अशा परिस्थिती देतो ज्या हवं तेव्हा तयार करता येत नाहीत, जसं flights API ने 500 देणं.' },
      { en: 'Every test in the gate must be able to fail for a real reason. "The page opened" catches nothing. Check the claim against the truth: the filter against the stops, the message against the error, the discount against the rules, the question before the cancel. In this boss level each step is re-run on the Gremlin\'s builds, and your suite has to go red on every one.', mr: 'gate मधली प्रत्येक test खऱ्या कारणासाठी fail होऊ शकली पाहिजे. "page उघडलं" काहीच पकडत नाही. दाव्याची सत्याशी तुलना करा: filter ची stops शी, message ची error शी, discount ची नियमांशी, cancel आधीच्या प्रश्नाची. या बॉस level मध्ये प्रत्येक step gremlin च्या builds वर पुन्हा चालवली जाते, आणि प्रत्येकावर तुमचा suite लाल व्हायलाच हवा.' },
    ],
    syntax: {
      template: `class LoginPage {
  constructor(private page: Page) {}
  async login(email: string, password: string) { /* fill, fill, click */ }
}

test.describe('flight results', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('${FL}');
  });
  test('an outage is shown', async ({ page }) => {
    await page.route('**/api/flights*', route => route.fulfill({ status: 500, json: {} }));
    await page.reload();
    await expect(page.getByRole('alert')).toBeVisible();
  });
});

test('API refuses a taken seat', async ({ request }) => {
  const res = await request.post('/api/bookings', { data: { /* ... */ } });
  expect(res.status()).toBe(409);
});`,
      parts: [
        { code: "test.describe('name', () => { ... })", means: { en: 'a group of tests that share a name and hooks', mr: 'नाव आणि hooks वाटून घेणारा tests चा गट' } },
        { code: 'test.beforeEach(async ({ page }) => ...)', means: { en: 'runs before every test in the group: each test still starts fresh', mr: 'गटातल्या प्रत्येक test आधी चालतो: प्रत्येक test तरीही नव्याने सुरू होते' } },
        { code: 'class LoginPage { ... }', means: { en: 'a page object: one place that knows how a screen works', mr: 'page object: screen कसा चालतो हे माहीत असलेली एकच जागा' } },
        { code: "page.route('**/api/flights*', r => r.fulfill({ status: 500 }))", means: { en: 'rehearse an outage on demand; set it before the page asks', mr: 'हवं तेव्हा outage ची तालीम; page विचारण्याआधी लावा' } },
        { code: "request.post('/api/bookings', { data })", means: { en: 'create data or test a backend rule without clicking', mr: 'click न करता data तयार करा किंवा backend चा नियम तपासा' } },
        { code: "page.on('dialog', d => d.accept())", means: { en: 'say yes to the cancel question, after checking it', mr: 'cancel च्या प्रश्नाला तपासून हो म्हणा' } },
      ],
      example: [
        { code: "test.describe('release gate', () => {", note: { en: 'the examiners\' morning round', mr: 'examiners ची सकाळची फेरी' } },
        { code: "  test.beforeEach(async ({ page }) => { await page.goto('/'); });", note: { en: 'every check starts at the same platform', mr: 'प्रत्येक check एकाच platform वरून सुरू' } },
        { code: "  const res = await request.post('/api/bookings', { data });", note: { en: 'confirming the signal by phone, not by walking', mr: 'signal चालत जाऊन नाही, फोनवरून पक्का' } },
        { code: "  await page.route('**/api/flights*', r => r.fulfill({ status: 500 }));", note: { en: 'a brake drill: practise the failure on purpose', mr: 'brake चा सराव: ठरवून failure चा सराव' } },
        { code: "  await expect(page.getByRole('alert')).toBeVisible();", note: { en: 'one red check holds the train', mr: 'एक लाल check गाडी थांबवतो' } },
      ],
      pitfall: { en: 'Do not let tests lean on each other. The backend is shared within a run, so a test that cancels SKY1A2 changes what the next test sees. Create the data each test needs (the API is quickest), use your own new PNR, and never count on test order.', mr: 'tests ना एकमेकांवर टेकू देऊ नका. एका run मध्ये backend सामायिक असतो, म्हणून SKY1A2 cancel करणारी test पुढच्या test ला काय दिसतं ते बदलते. प्रत्येक test ला लागणारा data तयार करा (API सगळ्यात जलद), स्वतःचा नवा PNR वापरा, आणि tests च्या क्रमावर कधीच अवलंबून राहू नका.' },
    },
    practice: {
      intro: { en: 'Four gates and a decision. Each step is re-run on the Gremlin\'s builds, eight bugs in all, and your suite must go red on every one of them. Two hints per step: keep the browser and the report open while you build.', mr: 'चार gates आणि एक निर्णय. प्रत्येक step gremlin च्या builds वर पुन्हा चालवली जाते, एकूण आठ bugs, आणि प्रत्येकावर तुमचा suite लाल व्हायलाच हवा. प्रत्येक step ला दोन hints: test लिहिताना browser आणि report उघडे ठेवा.' },
      steps: [
        {
          kind: 'playwright',
          prompt: { en: 'Gate 1, the results page. In the describe block, beforeEach opens the PNQ to DEL results for 2026-12-20 and waits for result-count "5 flights". Test 1: tick "Non-stop only", expect 3 flight cards and no card containing "1 stop". Test 2: route "**/api/flights*" to a 500, reload, and expect the alert "We could not load flights. Please try again." and the "Retry" button.', mr: 'Gate 1, results page. describe block मध्ये beforeEach 2026-12-20 चे PNQ ते DEL results उघडतो आणि result-count "5 flights" ची वाट पाहतो. Test 1: "Non-stop only" वर tick करा, 3 flight cards आणि "1 stop" असलेलं एकही card नाही अशी अपेक्षा करा. Test 2: "**/api/flights*" ला 500 कडे route करा, reload करा, आणि alert "We could not load flights. Please try again." आणि "Retry" बटण अपेक्षित धरा.' },
          startUrl: FL,
          starter: `${H}test.describe('flight results', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: open the results and wait for '5 flights'
  });

  test('non-stop only hides 1-stop flights', async ({ page }) => {
    // TODO
  });

  test('an outage is shown, not hidden', async ({ page }) => {
    // TODO: route to a 500, reload, check the alert and Retry
  });
});
`,
          solution: `${H}test.describe('flight results', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('${FL}');
    await expect(page.getByTestId('result-count')).toHaveText('5 flights');
  });

  test('non-stop only hides 1-stop flights', async ({ page }) => {
    await page.getByLabel('Non-stop only').check();
    await expect(page.getByTestId('flight-card')).toHaveCount(3);
    await expect(page.getByTestId('flight-card').filter({ hasText: '1 stop' })).toHaveCount(0);
  });

  test('an outage is shown, not hidden', async ({ page }) => {
    await page.route('**/api/flights*', route => route.fulfill({ status: 500, json: { error: 'down' } }));
    await page.reload();
    await expect(page.getByRole('alert')).toHaveText('We could not load flights. Please try again.');
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });
});
`,
          minTests: 2,
          minAssertions: 6,
          noWaitForTimeout: true,
          mustUse: [
            { pattern: 'test\\.beforeEach\\(', message: { en: 'Open the results in test.beforeEach, so both tests start the same way.', mr: 'results test.beforeEach मध्ये उघडा, म्हणजे दोन्ही tests एकाच पद्धतीने सुरू होतील.' } },
            { pattern: 'page\\.route\\(', message: { en: "Rehearse the outage with page.route('**/api/flights*', ...).", mr: "outage ची तालीम page.route('**/api/flights*', ...) ने करा." } },
            { pattern: 'fulfill\\(', message: { en: 'Answer the request yourself with route.fulfill({ status: 500, ... }).', mr: 'request ला स्वतः route.fulfill({ status: 500, ... }) ने उत्तर द्या.' } },
          ],
          mustCatch: [
            { bug: 'nonstop-filter', label: { en: '"Non-stop only" still shows the 1-stop SH 305', mr: '"Non-stop only" तरीही 1-stop SH 305 दाखवतो' } },
            { bug: 'error-silent', label: { en: 'A failed flights API shows "0 flights" and no error', mr: 'flights API fail झाला की "0 flights" दिसतं आणि error नाही' } },
          ],
          hints: [
            { en: 'beforeEach already loaded the page once, so the mock must come first and then page.reload() asks the API again. The filter check is toHaveCount(0) on cards filtered with hasText: \'1 stop\'.', mr: 'beforeEach ने page आधीच एकदा उघडलं आहे, म्हणून आधी mock लावा आणि मग page.reload() API ला पुन्हा विचारतो. filter चा check म्हणजे hasText: \'1 stop\' ने filter केलेल्या cards वर toHaveCount(0).' },
            c(`await page.goto('${FL}');\nawait expect(page.getByTestId('result-count')).toHaveText('5 flights');\n// test 2:\nawait page.route('**/api/flights*', route => route.fulfill({ status: 500, json: { error: 'down' } }));\nawait page.reload();\nawait expect(page.getByRole('alert')).toHaveText('We could not load flights. Please try again.');\nawait expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();`),
          ],
          successLine: { en: 'The lying filter and the silent outage both went red. And the outage test runs every night, without waiting for a real server to fall over.', mr: 'खोटं बोलणारा filter आणि शांत outage, दोन्ही लाल झाले. आणि outage ची test खरा server पडायची वाट न पाहता रोज रात्री चालते.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Gate 2, login, with a page object. Finish LoginPage.login(email, password): fill Email and Password (getByLabel) and click "Log in". Test 1: a wrong password ("wrong") shows the alert "Wrong email or password" and no "Hi, Asha". Test 2: "fly123" shows "Hi, Asha" and the URL is "/". Use login.login(...) in both tests.', mr: 'Gate 2, login, page object सह. LoginPage.login(email, password) पूर्ण करा: Email आणि Password (getByLabel) भरा आणि "Log in" वर click करा. Test 1: चुकीचा password ("wrong") दिल्यावर alert "Wrong email or password" दिसतो आणि "Hi, Asha" नाही. Test 2: "fly123" दिल्यावर "Hi, Asha" दिसतं आणि URL "/" आहे. दोन्ही tests मध्ये login.login(...) वापरा.' },
          startUrl: '/login',
          starter: `${HP}class LoginPage {
  constructor(private page: Page) {}
  async open() {
    await this.page.goto('/login');
  }
  async login(email: string, password: string) {
    // TODO: fill Email and Password, click 'Log in'
  }
  error() {
    return this.page.getByRole('alert');
  }
}

test.describe('login', () => {
  let login: LoginPage;
  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.open();
  });

  test('a wrong password is explained', async ({ page }) => {
    // TODO
  });

  test('the right password logs in', async ({ page }) => {
    // TODO
  });
});
`,
          solution: `${HP}class LoginPage {
  constructor(private page: Page) {}
  async open() {
    await this.page.goto('/login');
  }
  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Log in' }).click();
  }
  error() {
    return this.page.getByRole('alert');
  }
}

test.describe('login', () => {
  let login: LoginPage;
  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.open();
  });

  test('a wrong password is explained', async ({ page }) => {
    await login.login('asha@skyhop.test', 'wrong');
    await expect(login.error()).toHaveText('Wrong email or password');
    await expect(page.getByText('Hi, Asha')).toHaveCount(0);
  });

  test('the right password logs in', async ({ page }) => {
    await login.login('asha@skyhop.test', 'fly123');
    await expect(page.getByText('Hi, Asha')).toBeVisible();
    await expect(page).toHaveURL('/');
  });
});
`,
          minTests: 2,
          minAssertions: 4,
          noWaitForTimeout: true,
          mustUse: [{ pattern: 'login\\.login\\([\\s\\S]*login\\.login\\(', message: { en: 'Use the page object in both tests: await login.login(email, password).', mr: 'दोन्ही tests मध्ये page object वापरा: await login.login(email, password).' } }],
          mustCatch: [{ bug: 'login-error-hidden', label: { en: 'A wrong password shows no error', mr: 'चुकीच्या password ला error दिसत नाही' } }],
          hints: [
            { en: 'Inside the class, the page is this.page. Password fields have no textbox role, so use getByLabel for both. In the tests, the error locator comes from login.error().', mr: 'class च्या आत page म्हणजे this.page. password fields ना textbox role नसतो, म्हणून दोन्हींसाठी getByLabel वापरा. tests मध्ये error चा locator login.error() मधून येतो.' },
            c("await this.page.getByLabel('Email').fill(email);\nawait this.page.getByLabel('Password').fill(password);\nawait this.page.getByRole('button', { name: 'Log in' }).click();\n// test 1:\nawait login.login('asha@skyhop.test', 'wrong');\nawait expect(login.error()).toHaveText('Wrong email or password');\nawait expect(page.getByText('Hi, Asha')).toHaveCount(0);"),
          ],
          successLine: { en: 'On the buggy build the wrong password just sat there with no word to the passenger, and your page object test said so. If the button is renamed tomorrow, you fix one line in LoginPage.', mr: 'buggy build वर चुकीचा password प्रवाशाला एकही शब्द न सांगता तसाच पडून राहिला, आणि तुमच्या page object test ने ते सांगितलं. उद्या बटणाचं नाव बदललं तर LoginPage मधली एकच ओळ दुरुस्त करायची.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Gate 3, payment, with a page object. beforeEach opens /passenger?demo=1, ticks "Add travel insurance", continues to payment and creates the PaymentPage. Finish applyCoupon(code): fill "Coupon code" and click "Apply". Test 1: insurance is "₹299", total is "₹4,799" and the button "Pay ₹4,799" is visible. Test 2: apply FLY10, expect the message "Coupon FLY10 applied. You save ₹450"; apply it again, expect "Coupon FLY10 is already applied" and the discount still "-₹450".', mr: 'Gate 3, payment, page object सह. beforeEach /passenger?demo=1 उघडतो, "Add travel insurance" वर tick करतो, payment कडे जातो आणि PaymentPage तयार करतो. applyCoupon(code) पूर्ण करा: "Coupon code" भरा आणि "Apply" वर click करा. Test 1: insurance "₹299", total "₹4,799" आणि "Pay ₹4,799" बटण दिसतं. Test 2: FLY10 लावा, message "Coupon FLY10 applied. You save ₹450" अपेक्षित धरा; तो पुन्हा लावा, "Coupon FLY10 is already applied" आणि discount अजूनही "-₹450" अपेक्षित धरा.' },
          startUrl: '/passenger?demo=1',
          starter: `${HP}class PaymentPage {
  constructor(private page: Page) {}
  async applyCoupon(code: string) {
    // TODO: fill 'Coupon code', click 'Apply'
  }
  message() {
    return this.page.getByRole('status');
  }
  line(id: string) {
    return this.page.getByTestId(id);
  }
}

test.describe('payment', () => {
  let pay: PaymentPage;
  test.beforeEach(async ({ page }) => {
    await page.goto('/passenger?demo=1');
    await page.getByRole('checkbox', { name: 'Add travel insurance' }).check();
    await page.getByRole('button', { name: 'Continue to payment' }).click();
    pay = new PaymentPage(page);
  });

  test('the total adds up', async ({ page }) => {
    // TODO: insurance, total, Pay button
  });

  test('a coupon works only once', async () => {
    // TODO: apply twice, check both messages and the discount
  });
});
`,
          solution: `${HP}class PaymentPage {
  constructor(private page: Page) {}
  async applyCoupon(code: string) {
    await this.page.getByLabel('Coupon code').fill(code);
    await this.page.getByRole('button', { name: 'Apply' }).click();
  }
  message() {
    return this.page.getByRole('status');
  }
  line(id: string) {
    return this.page.getByTestId(id);
  }
}

test.describe('payment', () => {
  let pay: PaymentPage;
  test.beforeEach(async ({ page }) => {
    await page.goto('/passenger?demo=1');
    await page.getByRole('checkbox', { name: 'Add travel insurance' }).check();
    await page.getByRole('button', { name: 'Continue to payment' }).click();
    pay = new PaymentPage(page);
  });

  test('the total adds up', async ({ page }) => {
    await expect(pay.line('insurance')).toHaveText('₹299');
    await expect(pay.line('total')).toHaveText('₹4,799');
    await expect(page.getByRole('button', { name: 'Pay ₹4,799' })).toBeVisible();
  });

  test('a coupon works only once', async () => {
    await pay.applyCoupon('FLY10');
    await expect(pay.message()).toHaveText('Coupon FLY10 applied. You save ₹450');
    await pay.applyCoupon('FLY10');
    await expect(pay.message()).toHaveText('Coupon FLY10 is already applied');
    await expect(pay.line('discount')).toHaveText('-₹450');
  });
});
`,
          minTests: 2,
          minAssertions: 6,
          noWaitForTimeout: true,
          mustUse: [{ pattern: 'applyCoupon\\([\\s\\S]*applyCoupon\\([\\s\\S]*applyCoupon\\(', message: { en: 'Apply the coupon twice in test 2 with pay.applyCoupon(\'FLY10\').', mr: 'test 2 मध्ये pay.applyCoupon(\'FLY10\') ने coupon दोनदा लावा.' } }],
          mustCatch: [
            { bug: 'coupon-twice', label: { en: 'FLY10 can be applied again and the discount doubles', mr: 'FLY10 पुन्हा लावता येतो आणि discount दुप्पट होतो' } },
            { bug: 'total-wrong', label: { en: 'The total counts insurance twice', mr: 'total मध्ये insurance दोनदा मोजला जातो' } },
          ],
          hints: [
            { en: 'applyCoupon uses this.page.getByLabel(\'Coupon code\') and the Apply button. Work the money out yourself: 4500 + 299 = 4799, and 10 percent of the ₹4,500 fare is ₹450, once.', mr: 'applyCoupon मध्ये this.page.getByLabel(\'Coupon code\') आणि Apply बटण वापरा. पैशांचा हिशोब स्वतः करा: 4500 + 299 = 4799, आणि ₹4,500 च्या fare चे 10 टक्के म्हणजे ₹450, एकदाच.' },
            c("await this.page.getByLabel('Coupon code').fill(code);\nawait this.page.getByRole('button', { name: 'Apply' }).click();\n// test 2:\nawait pay.applyCoupon('FLY10');\nawait expect(pay.message()).toHaveText('Coupon FLY10 applied. You save ₹450');\nawait pay.applyCoupon('FLY10');\nawait expect(pay.message()).toHaveText('Coupon FLY10 is already applied');\nawait expect(pay.line('discount')).toHaveText('-₹450');"),
          ],
          successLine: { en: 'The doubling coupon said "You save ₹900", the double insurance said ₹5,098, and both went red. Not one rupee wrong reaches a passenger.', mr: 'दुप्पट coupon म्हणाला "You save ₹900", दुहेरी insurance म्हणाला ₹5,098, आणि दोन्ही लाल झाले. प्रवाशापर्यंत एकही चुकीचा रुपया पोहोचत नाही.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Gate 4, the API and the UI together. Test 1: POST /api/bookings for flightId "SH201", date "2026-12-20", seats ["10A"] (a taken seat) and passenger; expect status 409. Test 2: POST a booking for "SH412", date "2026-12-22", seats ["11A"]; expect 201 and read pnr. Then open /trips (Asha is logged in), expect that trip\'s trip-status "Confirmed", cancel it while saving the dialog message and accepting, expect "Cancelled", and expect the message `Cancel trip ${pnr}? This cannot be undone.`', mr: 'Gate 4, API आणि UI एकत्र. Test 1: flightId "SH201", date "2026-12-20", seats ["10A"] (घेतलेली seat) आणि passenger सह POST /api/bookings; status 409 अपेक्षित धरा. Test 2: "SH412", date "2026-12-22", seats ["11A"] साठी booking POST करा; 201 अपेक्षित धरा आणि pnr वाचा. मग /trips उघडा (Asha login आहे), त्या trip चं trip-status "Confirmed" अपेक्षित धरा, dialog चा message जतन करून आणि accept करून ती cancel करा, "Cancelled" अपेक्षित धरा, आणि message `Cancel trip ${pnr}? This cannot be undone.` अपेक्षित धरा.' },
          startUrl: '/trips',
          loggedIn: true,
          starter: `${H}test.use({ storageState: 'auth/asha.json' });
const passenger = { name: 'Asha Patil', email: 'asha@skyhop.test', phone: '9822012345' };

test('the API refuses a taken seat', async ({ request }) => {
  // TODO: POST SH201 / 2026-12-20 / seat 10A, expect 409
});

test('a new trip shows up and cancels only after asking', async ({ page, request }) => {
  // TODO: POST SH412 / 2026-12-22 / seat 11A, expect 201, read pnr
  // TODO: listen for the dialog (save the message, accept)
  // TODO: open /trips, find the trip by pnr, expect 'Confirmed'
  // TODO: cancel it, expect 'Cancelled' and the dialog message
});
`,
          solution: `${H}test.use({ storageState: 'auth/asha.json' });
const passenger = { name: 'Asha Patil', email: 'asha@skyhop.test', phone: '9822012345' };

test('the API refuses a taken seat', async ({ request }) => {
  const res = await request.post('/api/bookings', { data: { flightId: 'SH201', date: '2026-12-20', seats: ['10A'], passenger } });
  expect(res.status()).toBe(409);
});

test('a new trip shows up and cancels only after asking', async ({ page, request }) => {
  const res = await request.post('/api/bookings', { data: { flightId: 'SH412', date: '2026-12-22', seats: ['11A'], passenger } });
  expect(res.status()).toBe(201);
  const { pnr } = await res.json();
  let question = '';
  page.on('dialog', dialog => {
    question = dialog.message();
    dialog.accept();
  });
  await page.goto('/trips');
  const trip = page.getByTestId('trip').filter({ hasText: pnr });
  await expect(trip.getByTestId('trip-status')).toHaveText('Confirmed');
  await trip.getByRole('button', { name: 'Cancel trip' }).click();
  await expect(trip.getByTestId('trip-status')).toHaveText('Cancelled');
  expect(question).toBe(\`Cancel trip \${pnr}? This cannot be undone.\`);
});
`,
          minTests: 2,
          minAssertions: 5,
          noWaitForTimeout: true,
          mustUse: [
            { pattern: 'request\\.post\\(', message: { en: "Create and test bookings with request.post('/api/bookings', { data: ... }).", mr: "bookings request.post('/api/bookings', { data: ... }) ने तयार करा आणि तपासा." } },
            { pattern: "page\\.(on|once)\\(\\s*'dialog'", message: { en: "Answer the cancel question with page.on('dialog', ...).", mr: "cancel च्या प्रश्नाला page.on('dialog', ...) ने उत्तर द्या." } },
          ],
          mustCatch: [
            { bug: 'seat-taken', label: { en: 'Taken seats can still be booked', mr: 'घेतलेल्या seats तरीही book करता येतात' } },
            { bug: 'trip-missing', label: { en: 'A new booking does not show in My trips', mr: 'नवी booking My trips मध्ये दिसत नाही' } },
            { bug: 'cancel-no-dialog', label: { en: 'Cancel trip cancels at once, without asking', mr: 'Cancel trip न विचारता लगेच cancel करतं' } },
          ],
          hints: [
            { en: 'request.post takes { data: { flightId, date, seats, passenger } }; res.status() is a plain number (expect without await), and await res.json() gives { pnr }. Find the card with filter({ hasText: pnr }). The dialog listener goes before the click on Cancel trip.', mr: 'request.post ला { data: { flightId, date, seats, passenger } } लागतो; res.status() हा साधा number आहे (await शिवाय expect), आणि await res.json() मधून { pnr } मिळतो. card filter({ hasText: pnr }) ने शोधा. dialog listener Cancel trip च्या click आधी येतो.' },
            c("const res = await request.post('/api/bookings', { data: { flightId: 'SH412', date: '2026-12-22', seats: ['11A'], passenger } });\nexpect(res.status()).toBe(201);\nconst { pnr } = await res.json();\nlet question = '';\npage.on('dialog', dialog => { question = dialog.message(); dialog.accept(); });\nawait page.goto('/trips');\nconst trip = page.getByTestId('trip').filter({ hasText: pnr });\nawait expect(trip.getByTestId('trip-status')).toHaveText('Confirmed');\nawait trip.getByRole('button', { name: 'Cancel trip' }).click();\nawait expect(trip.getByTestId('trip-status')).toHaveText('Cancelled');\nexpect(question).toBe(`Cancel trip ${pnr}? This cannot be undone.`);"),
          ],
          successLine: { en: 'Three bugs in two tests: the backend sold a taken seat, the new trip vanished from My trips, and the cancel never asked. Each test made its own booking, so nothing depends on SKY1A2 or on test order.', mr: 'दोन tests मध्ये तीन bugs: backend ने घेतलेली seat विकली, नवी trip My trips मधून गायब झाली, आणि cancel ने कधीच विचारलं नाही. प्रत्येक test ने स्वतःची booking केली, म्हणून काहीच SKY1A2 वर किंवा tests च्या क्रमावर अवलंबून नाही.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Monday\'s release run in CI: 14 passed. "booking › pays with coupon" is flaky (failed once, passed on retry). "payment › a coupon works only once" failed: Expected "Coupon FLY10 is already applied", Received "Coupon FLY10 applied. You save ₹900". Sam asks: "Can we release?" What does the gate say?', mr: 'सोमवारचा CI मधला release run: 14 pass. "booking › pays with coupon" flaky आहे (एकदा fail, retry मध्ये pass). "payment › a coupon works only once" fail झाली: Expected "Coupon FLY10 is already applied", Received "Coupon FLY10 applied. You save ₹900". Sam विचारतो: "release करू शकतो का?" gate काय सांगतो?' },
          options: [
            { en: 'Release: 15 out of 16 is good enough', mr: 'release करा: 16 पैकी 15 पुरेसं आहे' },
            { en: 'Release, and mark the coupon test test.skip until someone has time', mr: 'release करा, आणि कोणाला वेळ मिळेपर्यंत coupon test ला test.skip लावा' },
            { en: 'Rerun the whole pipeline until everything is green', mr: 'सगळं हिरवं होईपर्यंत पूर्ण pipeline पुन्हा पुन्हा चालवा' },
            { en: 'Not yet: the coupon failure is a real bug (customers would get double discount), so the release waits for the fix; the flaky test also gets a ticket with its trace', mr: 'अजून नाही: coupon चं failure हा खरा bug आहे (ग्राहकांना दुप्पट discount मिळेल), म्हणून fix होईपर्यंत release थांबतं; flaky test साठीही trace सह ticket जातं' },
          ],
          correct: [3],
          explain: { en: 'The failure reads clearly: the second FLY10 doubled the discount. That is money leaving SkyHop on every booking, and exactly what the gate is for. Skipping the test or rerunning until green turns the gate into decoration. The flaky test did pass, but it still gets a ticket so the gate stays trusted.', mr: 'failure स्पष्ट वाचता येतं: दुसऱ्या FLY10 ने discount दुप्पट केला. म्हणजे प्रत्येक booking वर SkyHop चे पैसे जातात, आणि gate नेमकं यासाठीच आहे. test skip करणं किंवा हिरवं होईपर्यंत पुन्हा चालवणं म्हणजे gate फक्त शोभेचं करणं. flaky test pass झाली, तरी gate वरचा विश्वास टिकावा म्हणून तिचंही ticket जातं.' },
          hints: [
            { en: 'Read Received: what would a customer get if this went live?', mr: 'Received वाचा: हे live गेलं तर ग्राहकाला काय मिळेल?' },
            { en: 'Like the loose coupling at Pune station: does the train leave because 15 checks are green?', mr: 'पुणे स्टेशनवरच्या सैल जोडणीसारखं: 15 checks हिरवे आहेत म्हणून गाडी निघते का?' },
          ],
          successLine: { en: 'Red means wait, and you can say exactly why. That is a gate people trust.', mr: 'लाल म्हणजे थांबा, आणि का ते तुम्ही नेमकं सांगू शकता. लोक विश्वास ठेवतात तो gate असाच असतो.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Your My trips test needs a fresh booking that belongs to Asha. What is the fastest reliable way to get one?', mr: 'तुमच्या My trips test ला Asha ची एक नवी booking हवी आहे. ती मिळवण्याचा सगळ्यात जलद आणि भरवशाचा मार्ग कोणता?' },
        options: [
          { en: 'Click through search, seats, passenger and payment in every test', mr: 'प्रत्येक test मध्ये search, seats, passenger आणि payment मधून click करत जा' },
          { en: 'Reuse the booking a previous test made', mr: 'आधीच्या test ने केलेली booking पुन्हा वापरा' },
          { en: 'Create it with request.post(\'/api/bookings\', { data }) in the test itself, then check it in the UI', mr: 'ती test मध्येच request.post(\'/api/bookings\', { data }) ने तयार करा, मग UI मध्ये तपासा' },
          { en: 'Ask Theo to add it to the database by hand before each run', mr: 'प्रत्येक run आधी Theo ला ती database मध्ये हाताने टाकायला सांगा' },
        ],
        answer: 2,
        explain: { en: 'The API sets up data in about a second and the test owns it, so it does not depend on order or on anyone else. The UI is still where you check what Asha sees.', mr: 'API साधारण एका सेकंदात data तयार करतो आणि तो test च्या मालकीचा असतो, म्हणून तो क्रमावर किंवा इतर कोणावर अवलंबून नसतो. Asha ला काय दिसतं ते मात्र UI वरच तपासायचं.' },
      },
      {
        q: { en: 'Why does the release suite mock a 500 from the flights API instead of waiting for a real outage?', mr: 'release suite खऱ्या outage ची वाट पाहण्याऐवजी flights API कडून 500 चा mock का करतो?' },
        options: [
          { en: 'Because a real outage cannot be created on demand; the mock makes the error path testable on every run', mr: 'कारण खरं outage हवं तेव्हा तयार करता येत नाही; mock मुळे error चा मार्ग प्रत्येक run मध्ये test करता येतो' },
          { en: 'Because mocks are faster, so every test should mock every API', mr: 'कारण mocks जलद असतात, म्हणून प्रत्येक test ने प्रत्येक API mock करावा' },
          { en: 'Because the real flights API never fails', mr: 'कारण खरा flights API कधीच fail होत नाही' },
          { en: 'Because route.fulfill also fixes the server', mr: 'कारण route.fulfill server सुद्धा दुरुस्त करतो' },
        ],
        answer: 0,
        explain: { en: 'Mock what you cannot produce on purpose, like an outage. Do not mock everything: the gate also needs tests that hit the real backend, or a broken API would sail through.', mr: 'जे ठरवून घडवता येत नाही ते mock करा, जसं outage. सगळंच mock करू नका: gate ला खऱ्या backend वर जाणाऱ्या tests सुद्धा लागतात, नाहीतर बिघडलेला API सहज निसटेल.' },
      },
      {
        q: { en: 'How many times does page.goto run when this describe block runs?', mr: 'हा describe block चालतो तेव्हा page.goto किती वेळा चालतो?' },
        code: "test.describe('results', () => {\n  test.beforeEach(async ({ page }) => { await page.goto('/flights?from=PNQ&to=DEL&date=2026-12-20'); });\n  test('count', async ({ page }) => { /* ... */ });\n  test('filter', async ({ page }) => { /* ... */ });\n  test('sort', async ({ page }) => { /* ... */ });\n});",
        options: [
          { en: 'Once, before the first test', mr: 'एकदा, पहिल्या test आधी' },
          { en: 'Never, because beforeEach is only for logins', mr: 'कधीच नाही, कारण beforeEach फक्त login साठी असतो' },
          { en: 'Twice', mr: 'दोनदा' },
          { en: 'Three times: before each of the three tests, each on its own fresh page', mr: 'तीन वेळा: तीनपैकी प्रत्येक test आधी, प्रत्येक वेळी स्वतःच्या नव्या page वर' },
        ],
        answer: 3,
        explain: { en: 'beforeEach runs before every test in its describe block. Each test gets a fresh page, which is what keeps tests independent. (beforeAll would run once.)', mr: 'beforeEach आपल्या describe block मधल्या प्रत्येक test आधी चालतो. प्रत्येक test ला नवं page मिळतं, आणि त्यामुळेच tests स्वतंत्र राहतात. (beforeAll एकदाच चालला असता.)' },
      },
      {
        q: { en: 'Theo renames the button "Log in" to "Sign in". Twelve tests log in through LoginPage.login(). How many places do you fix?', mr: 'Theo "Log in" बटणाचं नाव "Sign in" करतो. बारा tests LoginPage.login() मधून login करतात. तुम्ही किती ठिकाणी दुरुस्ती करता?' },
        options: [
          { en: 'Twelve, one in each test', mr: 'बारा, प्रत्येक test मध्ये एक' },
          { en: 'One: the locator inside LoginPage.login()', mr: 'एक: LoginPage.login() मधला locator' },
          { en: 'None, Playwright guesses the new name', mr: 'एकही नाही, Playwright नवं नाव ओळखतो' },
          { en: 'You must rewrite the tests with CSS selectors', mr: 'tests CSS selectors सह पुन्हा लिहाव्या लागतात' },
        ],
        answer: 1,
        explain: { en: 'That is the point of a page object: the knowledge of how a screen works lives in one class. The tests say what to do, the page object knows how.', mr: 'page object चा हाच उद्देश: screen कसा चालतो याचं ज्ञान एकाच class मध्ये राहतं. tests काय करायचं ते सांगतात, page object ला ते कसं करायचं ते माहीत असतं.' },
      },
    ],
    recap: { line: { en: 'A release gate is independent, fast, deterministic tests: describe and beforeEach for setup, page objects for screens, the API for data and backend rules, mocks for outages, and every test able to fail on a real bug. Red means the release waits.', mr: 'release gate म्हणजे स्वतंत्र, जलद, ठरलेल्या tests: setup साठी describe आणि beforeEach, screens साठी page objects, data आणि backend च्या नियमांसाठी API, outages साठी mocks, आणि प्रत्येक test खऱ्या bug वर fail होऊ शकणारी. लाल म्हणजे release थांबतं.' }, icon: '🛂' },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: '>> the filter. the outage. the coupon. the seat. the vanishing trip. the shy cancel. all eight. red. before release. ⌁⌁', mr: '>> filter. outage. coupon. seat. गायब trip. लाजाळू cancel. आठही. लाल. release आधीच. ⌁⌁' } },
      { who: 'gremlin', mood: 'smug', text: { en: '>> fine. you guard the door. but how fast can your door open when ten thousand people knock at once? ⌁', mr: '>> ठीक आहे. तुम्ही दार राखता. पण एकाच वेळी दहा हजार लोकांनी दार ठोठावलं तर तुमचं दार किती जलद उघडतं? ⌁' } },
      { who: 'theo', mood: 'happy', text: { en: 'The suite runs in under two minutes in CI, and no "merge anyway" this week. When it goes red, the report tells me the step and shows me the page.', mr: 'CI मध्ये suite दोन मिनिटांच्या आत चालतो, आणि या आठवड्यात एकही "तरीही merge करा" नाही. तो लाल झाला की report मला step सांगतो आणि page दाखवतो.' } },
      { who: 'sam', mood: 'happy', text: { en: 'Monday\'s release waited forty minutes for the coupon fix and then went out clean. That is the best forty minutes we ever spent.', mr: 'सोमवारचं release coupon च्या fix साठी चाळीस मिनिटं थांबलं आणि मग स्वच्छ बाहेर पडलं. आपण घालवलेली ही सगळ्यात चांगली चाळीस मिनिटं.' } },
      { who: 'rex', mood: 'happy', text: { en: 'Hooks, page objects, mocks, the API and a gate in CI. You build suites like a pro now, {name}.', mr: 'Hooks, page objects, mocks, API आणि CI मधला gate. आता तुम्ही व्यावसायिकासारखे suites बांधता, {name}.' } },
      { who: 'meera', mood: 'happy', text: { en: 'Rank up, {name}: Senior SDET. SkyHop\'s release gate is yours.', mr: 'नवीन रँक, {name}: Senior SDET. SkyHop चं release gate आता तुमचं.' } },
    ],
  },
]
