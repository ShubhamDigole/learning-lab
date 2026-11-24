import type { Lesson, T } from './types.ts'

// Playwright 1, part 2: actions (W1.3), web-first assertions and auto-waiting (W1.4),
// lists and filters (W1.5) and the boss, Lost Luggage (W1.6).

const H = "import { test, expect } from '@playwright/test';\n\n"
const FL = '/flights?from=PNQ&to=DEL&date=2026-12-20&pax=1'
/** a hint that is only code: the same text in both languages */
const c = (s: string): T => ({ en: s, mr: s })

export const pwMoreLessons: Lesson[] = [
  // ───────────────────────── W1.3 Doing things
  {
    id: 'pw1-3',
    code: 'W1.3',
    level: 'basic',
    title: { en: 'Doing Things: fill, click, check, select, press', mr: 'काम करणं: fill, click, check, select, press' },
    skill: 'fill, click, check, selectOption, press',
    realLife: {
      place: 'station',
      title: { en: 'The reservation form at Pune station', mr: 'पुणे स्टेशनवरचा reservation फॉर्म' },
      story: {
        en: 'Meera is booking a ticket to Delhi for her aaji at the Pune station counter. She picks "Pune" and "New Delhi" from the station list, writes the date, ticks "Senior citizen" and chooses "Veg" for the meal. Then she waits. The counter window has a shutter, and the clerk is on a tea break. Meera does not push the form at a closed shutter. The moment the shutter goes up and the clerk says "next", she hands it in. And before she leaves, she reads the ticket: right date, right name, seat confirmed. Filling the form is half the job. Reading what comes back is the other half.',
        mr: 'मीरा पुणे स्टेशनच्या counter वर आजीसाठी दिल्लीचं तिकीट काढतेय. ती स्टेशनच्या यादीतून "Pune" आणि "New Delhi" निवडते, तारीख लिहिते, "Senior citizen" वर tick करते आणि जेवणासाठी "Veg" निवडते. मग ती थांबते. counter च्या खिडकीला shutter आहे, आणि clerk चहाला गेलाय. मीरा बंद shutter वर फॉर्म ढकलत नाही. shutter वर जाऊन clerk "next" म्हणताच ती फॉर्म देते. आणि निघण्याआधी ती तिकीट वाचते: तारीख बरोबर, नाव बरोबर, seat confirmed. फॉर्म भरणं हे अर्धं काम. परत काय आलं ते वाचणं हे उरलेलं अर्धं.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🚉', label: 'Pick From and To (selectOption)', mr: 'From आणि To निवडा (selectOption)' },
          { icon: '📅', label: 'Write the date (fill)', mr: 'तारीख लिहा (fill)' },
          { icon: '☑️', label: 'Tick Senior citizen, choose Veg (check)', mr: 'Senior citizen tick करा, Veg निवडा (check)' },
          { icon: '🪟', label: 'Wait for the shutter to open (visible, enabled)', mr: 'shutter उघडेपर्यंत थांबा (visible, enabled)' },
          { icon: '🎫', label: 'Hand it in and read the ticket (click, expect)', mr: 'फॉर्म द्या आणि तिकीट वाचा (click, expect)' },
        ],
        breakAt: 3,
        breakNote: { en: 'She waits for the window to open, then acts at once. Playwright does the same before every click.', mr: 'खिडकी उघडेपर्यंत ती थांबते, मग लगेच काम करते. प्रत्येक click आधी Playwright असंच करतो.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'A passenger searched Pune to Pune last week and the site happily showed flights. Another booked a ticket with no name on it. Who tests our forms?', mr: 'मागच्या आठवड्यात एका प्रवाशाने Pune ते Pune शोधलं आणि site ने आनंदाने flights दाखवल्या. दुसऱ्याने नाव नसलेलं तिकीट book केलं. आपले forms कोण तपासतं?' } },
        { who: 'rex', mood: 'neutral', text: { en: 'The old Selenium script did. It had a sleep before every click and still failed when a button was slow. Playwright actions wait for the element by themselves.', mr: 'जुनी Selenium script तपासायची. प्रत्येक click आधी तिच्यात sleep होता, तरी बटण उशिरा आलं की ती fail व्हायची. Playwright चे actions element साठी स्वतःहून वाट पाहतात.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> pune to pune. tickets with no name. i fill your forms better than you do. ⌁', mr: '>> pune ते pune. नाव नसलेली तिकिटं. तुमचे forms मी तुमच्यापेक्षा छान भरतो. ⌁' } },
        { who: 'meera', mood: 'happy', text: { en: 'Today you drive the forms like a passenger, {name}: pick, type, tick, click. Then read what the page says back.', mr: 'आज तुम्ही प्रवाशासारखे forms चालवा, {name}: निवडा, टाइप करा, tick करा, click करा. मग page काय उत्तर देतं ते वाचा.' } },
      ],
      problem: { en: 'Forms are where passengers actually do things, and validation bugs hide there: same city twice, an empty name. Manual testers cannot try every combination before each release, and the old scripts broke whenever a button took a moment to become clickable.', mr: 'forms वरच प्रवासी खरं काम करतात, आणि validation चे bugs तिथेच लपतात: दोनदा तेच शहर, रिकामं नाव. प्रत्येक release आधी manual testers प्रत्येक combination तपासू शकत नाहीत, आणि बटण click करण्यायोग्य व्हायला थोडा वेळ लागला की जुन्या scripts मोडायच्या.' },
      solution: { en: 'Playwright actions on locators: selectOption, fill, check, click, press. Before each action Playwright waits until the element is visible, stable and enabled, so no sleeps. After the action, an assertion checks what the passenger would see.', mr: 'locators वरचे Playwright actions: selectOption, fill, check, click, press. प्रत्येक action आधी element दिसेपर्यंत, स्थिर होईपर्यंत आणि enabled होईपर्यंत Playwright थांबतो, म्हणून sleep नको. action नंतर प्रवाशाला काय दिसेल ते assertion तपासतं.' },
    },
    lesson: [
      { en: 'Actions are methods on a locator. fill(text) types into a box and replaces whatever was there. click() clicks. check() ticks a checkbox or picks a radio button. selectOption() picks from a dropdown. press("Enter") presses one key. Every action returns a promise, so every action needs await.', mr: 'actions म्हणजे locator वरच्या methods. fill(text) box मध्ये टाइप करतो आणि आधीचा मजकूर बदलून टाकतो. click() click करतो. check() checkbox वर tick करतो किंवा radio button निवडतो. selectOption() dropdown मधून निवडतो. press("Enter") एक key दाबतो. प्रत्येक action promise देतो, म्हणून प्रत्येक action ला await लागतो.' },
      { en: 'selectOption accepts the option value or its visible label. On SkyHop the From box has options like "Pune (PNQ)" with value "PNQ", so selectOption("PNQ") and selectOption({ label: "Pune (PNQ)" }) pick the same city. The label must be the whole option text. A date box takes fill("2026-12-20"), always year-month-day. No clicking around a calendar.', mr: 'selectOption ला option ची value किंवा दिसणारं label चालतं. SkyHop वर From box मध्ये "Pune (PNQ)" सारखे options आहेत, ज्यांची value "PNQ" आहे, म्हणून selectOption("PNQ") आणि selectOption({ label: "Pune (PNQ)" }) एकच शहर निवडतात. label म्हणजे option चा पूर्ण मजकूर हवा. date box ला fill("2026-12-20") चालतं, नेहमी वर्ष-महिना-दिवस. calendar मध्ये click करत फिरायचं नाही.' },
      { en: 'Before every action Playwright runs actionability checks. For click: the element is attached, visible, stable (not moving) and enabled. For fill: also editable. It keeps retrying until all are true, up to the action timeout (5 seconds in our project). If the Continue button stays disabled, the log ends with "element is not enabled". In Selenium you wrote WebDriverWait with elementToBeClickable yourself. Here it is built into every action.', mr: 'प्रत्येक action आधी Playwright actionability checks करतो. click साठी: element page वर आहे, दिसतोय, स्थिर आहे (हलत नाही) आणि enabled आहे. fill साठी: editable सुद्धा. हे सगळं खरं होईपर्यंत तो पुन्हा पुन्हा प्रयत्न करतो, action timeout पर्यंत (आपल्या project मध्ये 5 सेकंद). Continue बटण disabled राहिलं तर log च्या शेवटी "element is not enabled" येतं. Selenium मध्ये elementToBeClickable सह WebDriverWait तुम्ही स्वतः लिहायचात. इथे ते प्रत्येक action मध्ये आधीच आहे.' },
      { en: 'The tester\'s rule: an action checks nothing. A click that "worked" only proves the button existed. After each meaningful action, assert what the passenger should see: the next page, the error message, the ticked box. And try the wrong inputs on purpose (same city, empty name). That is where the Gremlin hides.', mr: 'testers चा नियम: action काहीच तपासत नाही. click "झालं" म्हणजे फक्त बटण होतं एवढंच सिद्ध होतं. प्रत्येक महत्त्वाच्या action नंतर प्रवाशाला काय दिसायला हवं ते assert करा: पुढचं page, error message, tick झालेला box. आणि मुद्दाम चुकीचे inputs द्या (तेच शहर, रिकामं नाव). gremlin तिथेच लपतो.' },
    ],
    syntax: {
      template: `await page.getByLabel('From').selectOption('PNQ');
await page.getByLabel('To').selectOption({ label: 'Goa (GOI)' });
await page.getByLabel('Departure date').fill('2026-12-20');
await page.getByRole('radio', { name: 'Veg thali' }).check();
await page.getByLabel('Coupon code').press('Enter');
await page.getByRole('button', { name: 'Search flights' }).click();`,
      parts: [
        { code: "fill('text')", means: { en: 'type into a box; it replaces what was there (fill("") empties it)', mr: 'box मध्ये टाइप करा; आधीचा मजकूर बदलतो (fill("") box रिकामा करतो)' } },
        { code: 'click()', means: { en: 'click, after waiting until the element is visible, stable and enabled', mr: 'click करा, element दिसेपर्यंत, स्थिर आणि enabled होईपर्यंत थांबून' } },
        { code: 'check() / uncheck()', means: { en: 'tick or untick a checkbox; check() also picks a radio button', mr: 'checkbox वर tick करा किंवा काढा; check() radio button सुद्धा निवडतो' } },
        { code: "selectOption('PNQ')", means: { en: 'pick a dropdown option by its value (or by its full label text)', mr: 'dropdown मधला option त्याच्या value ने (किंवा पूर्ण label ने) निवडा' } },
        { code: "selectOption({ label: 'Goa (GOI)' })", means: { en: 'pick strictly by the visible label', mr: 'फक्त दिसणाऱ्या label ने निवडा' } },
        { code: "press('Enter')", means: { en: 'press one key in the element (Enter, Tab, Escape, Control+A...)', mr: 'element मध्ये एक key दाबा (Enter, Tab, Escape, Control+A...)' } },
      ],
      example: [
        { code: "await page.goto('/');", note: { en: 'Meera reaches the counter', mr: 'मीरा counter वर पोहोचते' } },
        { code: "await page.getByLabel('From').selectOption('PNQ');", note: { en: 'picks the station from the list, by its code', mr: 'यादीतून स्टेशन निवडते, त्याच्या code ने' } },
        { code: "await page.getByLabel('Departure date').fill('2026-12-20');", note: { en: 'writes the date on the form', mr: 'फॉर्मवर तारीख लिहिते' } },
        { code: "await page.getByLabel('Passengers').selectOption('2');", note: { en: 'two tickets: aaji and Meera', mr: 'दोन तिकिटं: आजी आणि मीरा' } },
        { code: "await page.getByRole('button', { name: 'Search flights' }).click();", note: { en: 'hands it in the moment the shutter is up', mr: 'shutter वर जाताच फॉर्म देते' } },
        { code: "await expect(page).toHaveTitle('Flights PNQ to DEL | SkyHop');", note: { en: 'and reads the ticket before leaving', mr: 'आणि निघण्याआधी तिकीट वाचते' } },
      ],
      pitfall: { en: 'fill replaces, it never adds. fill("Asha") then fill("Patil") leaves only "Patil". And selectOption by label needs the whole option text: "Goa (GOI)". selectOption("Goa") finds nothing, waits 5 seconds and lists the options it did see.', mr: 'fill बदलतो, कधी जोडत नाही. fill("Asha") आणि मग fill("Patil") केलं तर फक्त "Patil" उरतं. आणि label ने selectOption करताना option चा पूर्ण मजकूर लागतो: "Goa (GOI)". selectOption("Goa") ला काहीच सापडत नाही, तो 5 सेकंद थांबतो आणि त्याला दिसलेले options दाखवतो.' },
    },
    practice: {
      intro: { en: 'The search form, the seat page, the passenger form and the coupon box. Every step drives the real SkyHop forms. Press Run to watch the browser on the right, Submit to hand in. Hidden buggy builds check that your assertions catch the Gremlin.', mr: 'search form, seat page, passenger form आणि coupon box. प्रत्येक step खरे SkyHop forms चालवते. उजवीकडचा browser पाहायला Run दाबा, द्यायला Submit. तुमचे assertions gremlin ला पकडतात का, हे लपवलेले buggy builds तपासतील.' },
      steps: [
        {
          kind: 'playwright',
          prompt: { en: 'Search like a passenger. Pick From by its value "PNQ", pick To by its label "Goa (GOI)", fill the Departure date with 2026-12-20, pick Passengers "2 adults" and click Search flights. The two assertions at the bottom are already written.', mr: 'प्रवाशासारखं search करा. From त्याच्या value "PNQ" ने निवडा, To त्याच्या label "Goa (GOI)" ने निवडा, Departure date मध्ये 2026-12-20 भरा, Passengers मध्ये "2 adults" निवडा आणि Search flights वर click करा. खालचे दोन assertions आधीच लिहिलेले आहेत.' },
          startUrl: '/',
          starter: `${H}test('search Pune to Goa for two', async ({ page }) => {
  await page.goto('/');
  // TODO: pick From by value 'PNQ'
  // TODO: pick To by label 'Goa (GOI)'
  // TODO: fill the Departure date with '2026-12-20'
  // TODO: pick Passengers '2 adults'
  // TODO: click the Search flights button
  await expect(page).toHaveTitle('Flights PNQ to GOI | SkyHop');
  await expect(page.getByText('2026-12-20 · 2 passengers')).toBeVisible();
});
`,
          solution: `${H}test('search Pune to Goa for two', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('From').selectOption('PNQ');
  await page.getByLabel('To').selectOption({ label: 'Goa (GOI)' });
  await page.getByLabel('Departure date').fill('2026-12-20');
  await page.getByLabel('Passengers').selectOption({ label: '2 adults' });
  await page.getByRole('button', { name: 'Search flights' }).click();
  await expect(page).toHaveTitle('Flights PNQ to GOI | SkyHop');
  await expect(page.getByText('2026-12-20 · 2 passengers')).toBeVisible();
});
`,
          minAssertions: 2,
          mustUse: [
            { pattern: "selectOption\\(\\s*\\{\\s*label:\\s*'Goa \\(GOI\\)'", message: { en: "Pick To by its label: selectOption({ label: 'Goa (GOI)' }).", mr: "To त्याच्या label ने निवडा: selectOption({ label: 'Goa (GOI)' })." } },
            { pattern: "fill\\(\\s*'2026-12-20'\\s*\\)", message: { en: "Fill the date box with fill('2026-12-20').", mr: "date box fill('2026-12-20') ने भरा." } },
          ],
          hints: [
            { en: 'All four boxes have labels: From, To, Departure date, Passengers. Find each with page.getByLabel(...).', mr: 'चारही boxes ना labels आहेत: From, To, Departure date, Passengers. प्रत्येक page.getByLabel(...) ने शोधा.' },
            { en: "By value: selectOption('PNQ'). By label: selectOption({ label: 'Goa (GOI)' }). Passengers can be selectOption('2') or the label '2 adults'.", mr: "value ने: selectOption('PNQ'). label ने: selectOption({ label: 'Goa (GOI)' }). Passengers साठी selectOption('2') किंवा label '2 adults' चालेल." },
            c("await page.getByLabel('From').selectOption('PNQ');\nawait page.getByLabel('To').selectOption({ label: 'Goa (GOI)' });"),
            c("await page.getByLabel('From').selectOption('PNQ');\nawait page.getByLabel('To').selectOption({ label: 'Goa (GOI)' });\nawait page.getByLabel('Departure date').fill('2026-12-20');\nawait page.getByLabel('Passengers').selectOption('2');\nawait page.getByRole('button', { name: 'Search flights' }).click();"),
          ],
          successLine: { en: 'Searched by value, by label and by date, with no sleeps. Playwright waited for each box by itself.', mr: 'value, label आणि तारखेने search केलं, एकही sleep नाही. प्रत्येक box साठी Playwright स्वतःहून थांबला.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'The Gremlin says Pune to Pune works. Prove the site refuses it. Keep From as Pune, pick To "PNQ", fill a date (2026-12-20) and click Search flights. Assert the text "From and To must be different cities" is visible, and that you are still on the home page (title "SkyHop | Fly happy").', mr: 'gremlin म्हणतो Pune ते Pune चालतं. site ते नाकारते हे सिद्ध करा. From Pune च ठेवा, To मध्ये "PNQ" निवडा, तारीख भरा (2026-12-20) आणि Search flights वर click करा. "From and To must be different cities" हा मजकूर दिसतो आणि तुम्ही अजून home page वरच आहात (title "SkyHop | Fly happy") हे assert करा.' },
          startUrl: '/',
          starter: `${H}test('same city is refused', async ({ page }) => {
  await page.goto('/');
  // TODO: pick To 'PNQ' (From is already Pune)
  // TODO: fill the date, then click Search flights
  // TODO: assert the error text is visible
  // TODO: assert the title is still 'SkyHop | Fly happy'
});
`,
          solution: `${H}test('same city is refused', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('To').selectOption('PNQ');
  await page.getByLabel('Departure date').fill('2026-12-20');
  await page.getByRole('button', { name: 'Search flights' }).click();
  await expect(page.getByText('From and To must be different cities')).toBeVisible();
  await expect(page).toHaveTitle('SkyHop | Fly happy');
});
`,
          minAssertions: 2,
          mustUse: [{ pattern: "selectOption\\(", message: { en: 'Pick the To city with selectOption.', mr: 'To शहर selectOption ने निवडा.' } }],
          mustCatch: [{ bug: 'same-city', label: { en: 'Pune to Pune search is allowed', mr: 'Pune ते Pune search चालतो' } }],
          hints: [
            { en: 'Fill the date too. Otherwise the page may complain about the date instead, and you would not be testing the city rule.', mr: 'तारीखही भरा. नाहीतर page तारखेबद्दल तक्रार करेल, आणि तुम्ही शहराचा नियम तपासतच नसाल.' },
            c("await page.getByLabel('To').selectOption('PNQ');\nawait page.getByLabel('Departure date').fill('2026-12-20');\nawait page.getByRole('button', { name: 'Search flights' }).click();"),
            { en: 'Check the error with getByText(...).toBeVisible(), then the title with expect(page).toHaveTitle(...).', mr: 'error getByText(...).toBeVisible() ने तपासा, मग title expect(page).toHaveTitle(...) ने.' },
            c("await expect(page.getByText('From and To must be different cities')).toBeVisible();\nawait expect(page).toHaveTitle('SkyHop | Fly happy');"),
          ],
          successLine: { en: 'On the buggy build your test went red: no error, and the page jumped to flights. Pune to Pune is closed.', mr: 'buggy build वर तुमची test लाल झाली: error नाही, आणि page flights वर गेलं. Pune ते Pune बंद.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Theo wants to skip the seat page. Press Run. The test waits about 5 seconds and fails. Read the call log: what was Playwright waiting for?', mr: 'Theo ला seat page टाळायचं आहे. Run दाबा. test साधारण 5 सेकंद थांबते आणि fail होते. call log वाचा: Playwright कशाची वाट पाहत होता?' },
          playwrightSandbox: {
            startUrl: '/seats?demo=1',
            code: `${H}test('continue without a seat', async ({ page }) => {
  await page.goto('/seats?demo=1');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveTitle('Passenger details | SkyHop');
});
`,
          },
          options: [
            { en: 'For the button to appear: the locator is wrong and found nothing', mr: 'बटण दिसण्याची: locator चुकीचा आहे आणि काहीच सापडलं नाही' },
            { en: 'For the button to become enabled: it found the Continue button, but it stayed disabled because no seat was picked', mr: 'बटण enabled होण्याची: Continue बटण सापडलं, पण seat निवडली नसल्याने ते disabled राहिलं' },
            { en: 'For the page title to change', mr: 'page चा title बदलण्याची' },
            { en: 'For a network response from the server', mr: 'server कडून network response ची' },
          ],
          correct: [1],
          explain: { en: 'The log says "locator resolved to <button ... disabled>Continue</button>" and then "element is not enabled". The locator was fine. Playwright refused to click a disabled button and kept waiting for it to become enabled until the 5 second timeout. That is the right behaviour: a passenger cannot click it either. Pick a seat first.', mr: 'log म्हणतो "locator resolved to <button ... disabled>Continue</button>" आणि मग "element is not enabled". locator बरोबर होता. Playwright ने disabled बटणावर click करायला नकार दिला आणि ते enabled होण्याची 5 सेकंदांच्या timeout पर्यंत वाट पाहिली. हेच बरोबर आहे: प्रवासीसुद्धा त्यावर click करू शकत नाही. आधी seat निवडा.' },
          hints: [
            { en: 'Look at the last line of the call log.', mr: 'call log ची शेवटची ओळ पाहा.' },
            { en: 'The log shows the button it found. Is it missing, or is it there with "disabled"?', mr: 'log ला सापडलेलं बटण दाखवतो. ते गायब आहे, की "disabled" सह तिथे आहे?' },
          ],
          successLine: { en: 'Found but disabled reads very differently from not found. That call log tells you which.', mr: 'सापडलं पण disabled, आणि सापडलंच नाही, यात खूप फरक आहे. call log ते सांगतो.' },
        },
        {
          kind: 'playwright',
          prompt: { en: "The link /passenger?demo=1 opens the passenger form with Asha's details already filled. Empty the Full name box with fill(''). Pick the radio \"Veg thali\" and tick the checkbox \"Add travel insurance\", and assert both are checked with toBeChecked(). Then click Continue to payment and assert the text \"Enter the passenger's full name\" is visible.", mr: "/passenger?demo=1 हा link Asha ची माहिती आधीच भरलेला passenger form उघडतो. Full name box fill('') ने रिकामा करा. \"Veg thali\" radio निवडा आणि \"Add travel insurance\" checkbox वर tick करा, आणि दोन्ही checked आहेत हे toBeChecked() ने assert करा. मग Continue to payment वर click करा आणि \"Enter the passenger's full name\" हा मजकूर दिसतो असं assert करा." },
          startUrl: '/passenger?demo=1',
          starter: `${H}test('a ticket needs a name', async ({ page }) => {
  await page.goto('/passenger?demo=1');
  // TODO: empty the Full name box
  // TODO: pick the radio 'Veg thali' and tick the checkbox 'Add travel insurance'
  // TODO: assert both are checked
  // TODO: click Continue to payment
  // TODO: assert the error text is visible
});
`,
          solution: `${H}test('a ticket needs a name', async ({ page }) => {
  await page.goto('/passenger?demo=1');
  await page.getByLabel('Full name').fill('');
  const veg = page.getByRole('radio', { name: 'Veg thali' });
  const insurance = page.getByRole('checkbox', { name: 'Add travel insurance' });
  await veg.check();
  await insurance.check();
  await expect(veg).toBeChecked();
  await expect(insurance).toBeChecked();
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(page.getByText("Enter the passenger's full name")).toBeVisible();
});
`,
          minAssertions: 3,
          mustUse: [
            { pattern: '\\.check\\(\\)', message: { en: 'Tick the radio and the checkbox with check().', mr: 'radio आणि checkbox check() ने निवडा.' } },
            { pattern: 'toBeChecked\\(', message: { en: 'Assert the boxes are ticked with toBeChecked().', mr: 'boxes tick झालेत हे toBeChecked() ने assert करा.' } },
          ],
          mustCatch: [{ bug: 'name-optional', label: { en: 'Passenger form accepts an empty name', mr: 'passenger form रिकामं नाव स्वीकारतो' } }],
          hints: [
            { en: "fill('') replaces the text with nothing. Radios and checkboxes both use check(). Their roles are 'radio' and 'checkbox'.", mr: "fill('') मजकूर काढून टाकतो. radio आणि checkbox दोन्हींना check() लागतो. त्यांचे roles 'radio' आणि 'checkbox' आहेत." },
            c("await page.getByLabel('Full name').fill('');\nawait page.getByRole('radio', { name: 'Veg thali' }).check();\nawait page.getByRole('checkbox', { name: 'Add travel insurance' }).check();"),
            { en: "Store each locator in a const so you can act on it and assert on it: await expect(veg).toBeChecked(). The error text has an apostrophe, so wrap it in double quotes.", mr: "प्रत्येक locator एका const मध्ये ठेवा, म्हणजे त्यावर action आणि assertion दोन्ही करता येतील: await expect(veg).toBeChecked(). error मजकुरात apostrophe आहे, म्हणून तो double quotes मध्ये लिहा." },
            c("const veg = page.getByRole('radio', { name: 'Veg thali' });\nconst insurance = page.getByRole('checkbox', { name: 'Add travel insurance' });\nawait veg.check();\nawait insurance.check();\nawait expect(veg).toBeChecked();\nawait expect(insurance).toBeChecked();\nawait page.getByRole('button', { name: 'Continue to payment' }).click();\nawait expect(page.getByText(\"Enter the passenger's full name\")).toBeVisible();"),
          ],
          successLine: { en: 'Caught. On the buggy build the form let a nameless passenger through to payment. No more tickets for nobody.', mr: 'पकडलं. buggy build वर form ने नाव नसलेल्या प्रवाशाला payment पर्यंत जाऊ दिलं. आता "कोणीच नाही" च्या नावाने तिकिटं नाहीत.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Use the keyboard this time. Open /payment?demo=1, type FLY10 into Coupon code and press Enter (no click on Apply). Assert the text "Coupon FLY10 applied. You save ₹450" is visible and the button "Pay ₹4,050" is visible.', mr: 'या वेळी keyboard वापरा. /payment?demo=1 उघडा, Coupon code मध्ये FLY10 टाइप करा आणि Enter दाबा (Apply वर click नाही). "Coupon FLY10 applied. You save ₹450" हा मजकूर आणि "Pay ₹4,050" बटण दिसतं असं assert करा.' },
          startUrl: '/payment?demo=1',
          starter: `${H}test('coupon with the Enter key', async ({ page }) => {
  await page.goto('/payment?demo=1');
  // TODO: fill Coupon code with FLY10 and press Enter in the same box
  // TODO: assert the success message is visible
  // TODO: assert the button 'Pay ₹4,050' is visible
});
`,
          solution: `${H}test('coupon with the Enter key', async ({ page }) => {
  await page.goto('/payment?demo=1');
  const coupon = page.getByLabel('Coupon code');
  await coupon.fill('FLY10');
  await coupon.press('Enter');
  await expect(page.getByText('Coupon FLY10 applied. You save ₹450')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pay ₹4,050' })).toBeVisible();
});
`,
          minAssertions: 2,
          mustUse: [{ pattern: "press\\(\\s*'Enter'\\s*\\)", message: { en: "Press the key with press('Enter').", mr: "key press('Enter') ने दाबा." } }],
          mustNotUse: [{ pattern: "name:\\s*'Apply'", message: { en: 'No clicking Apply in this step. Press Enter in the coupon box instead.', mr: 'या step मध्ये Apply वर click नाही. त्याऐवजी coupon box मध्ये Enter दाबा.' } }],
          hints: [
            { en: 'press() is called on the same locator you filled: the Coupon code box.', mr: 'press() त्याच locator वर बोलवा जो तुम्ही भरला: Coupon code box.' },
            c("const coupon = page.getByLabel('Coupon code');\nawait coupon.fill('FLY10');\nawait coupon.press('Enter');"),
            { en: 'The new total is ₹4,500 minus ₹450. The button name changes with it.', mr: 'नवीन total म्हणजे ₹4,500 वजा ₹450. बटणाचं नावही त्यासोबत बदलतं.' },
            c("await expect(page.getByText('Coupon FLY10 applied. You save ₹450')).toBeVisible();\nawait expect(page.getByRole('button', { name: 'Pay ₹4,050' })).toBeVisible();"),
          ],
          successLine: { en: 'Keyboard users get the discount too. And you checked the money, which is what the passenger cares about.', mr: 'keyboard वापरणाऱ्यांनाही सवलत मिळते. आणि तुम्ही पैसे तपासले, प्रवाशाला तेच महत्त्वाचं असतं.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Which line picks "Goa (GOI)" in the To dropdown?', mr: 'कोणती ओळ To dropdown मध्ये "Goa (GOI)" निवडते?' },
        options: [
          "await page.getByLabel('To').fill('Goa');",
          "await page.getByLabel('To').click('Goa');",
          "await page.getByLabel('To').selectOption({ label: 'Goa (GOI)' });",
          "await page.getByLabel('To').check('GOI');",
        ],
        answer: 2,
        explain: { en: 'A dropdown (<select>) uses selectOption, by value ("GOI") or by the whole label ("Goa (GOI)"). fill is for text boxes, check for checkboxes and radios.', mr: 'dropdown (<select>) ला selectOption लागतो, value ("GOI") ने किंवा पूर्ण label ("Goa (GOI)") ने. fill text boxes साठी, check checkboxes आणि radios साठी.' },
      },
      {
        q: { en: 'What does Playwright wait for before it clicks a button?', mr: 'button वर click करण्याआधी Playwright कशाची वाट पाहतो?' },
        options: [
          { en: 'Until the button is attached, visible, stable and enabled, up to the action timeout', mr: 'button page वर येईपर्यंत, दिसेपर्यंत, स्थिर आणि enabled होईपर्यंत, action timeout पर्यंत' },
          { en: 'A fixed 3 seconds, every time', mr: 'प्रत्येक वेळी ठरावीक 3 सेकंद' },
          { en: 'Nothing: it clicks at once, like Selenium findElement', mr: 'कशाचीच नाही: Selenium findElement सारखा लगेच click करतो' },
          { en: 'Until every network request on the page has finished', mr: 'page वरची प्रत्येक network request संपेपर्यंत' },
        ],
        answer: 0,
        explain: { en: 'These are the actionability checks. They retry until true, so a slow button just works, and a button that stays disabled fails with "element is not enabled".', mr: 'हे actionability checks आहेत. ते खरे होईपर्यंत पुन्हा प्रयत्न करतात, म्हणून उशिरा येणारं बटण सहज चालतं, आणि disabled राहिलेलं बटण "element is not enabled" देऊन fail होतं.' },
      },
      {
        q: { en: 'What is in the Full name box after these two lines?', mr: 'या दोन ओळींनंतर Full name box मध्ये काय असेल?' },
        code: "await page.getByLabel('Full name').fill('Asha');\nawait page.getByLabel('Full name').fill('Patil');",
        options: [
          { en: 'Asha Patil', mr: 'Asha Patil' },
          { en: 'AshaPatil', mr: 'AshaPatil' },
          { en: 'Asha', mr: 'Asha' },
          { en: 'Patil, because fill replaces the old text', mr: 'Patil, कारण fill जुना मजकूर बदलून टाकतो' },
        ],
        answer: 3,
        explain: { en: 'fill clears the box and types the new text. To type the full name, fill it once: fill("Asha Patil").', mr: 'fill box रिकामा करून नवीन मजकूर टाइप करतो. पूर्ण नाव हवं असेल तर एकदाच fill करा: fill("Asha Patil").' },
      },
      {
        q: { en: 'A test fails with this log. What does it mean?', mr: 'एक test या log सह fail होते. याचा अर्थ काय?' },
        code: "locator.click: Timeout 5000ms exceeded.\nCall log:\n  - waiting for getByRole('button', { name: 'Continue' })\n  - locator resolved to <button ... disabled>Continue</button>\n  - element is not enabled",
        options: [
          { en: 'There is no Continue button on the page', mr: 'page वर Continue बटणच नाही' },
          { en: 'The button was found but stayed disabled, so something must happen first (like picking a seat)', mr: 'बटण सापडलं पण disabled राहिलं, म्हणजे आधी काहीतरी व्हायला हवं (जसं seat निवडणं)' },
          { en: 'The click worked but the page was slow', mr: 'click झालं पण page संथ होतं' },
          { en: 'The test forgot await', mr: 'test मध्ये await राहिला' },
        ],
        answer: 1,
        explain: { en: '"locator resolved to" means it was found. "element is not enabled" means Playwright waited 5 seconds for it to become clickable. Find out what unlocks it.', mr: '"locator resolved to" म्हणजे सापडलं. "element is not enabled" म्हणजे ते click करण्यायोग्य होण्याची Playwright ने 5 सेकंद वाट पाहिली. ते कशाने उघडतं ते शोधा.' },
      },
    ],
    recap: { line: { en: 'fill, click, check, selectOption and press act like a passenger, and each one waits until the element is visible and enabled. After every important action, assert what the passenger should see.', mr: 'fill, click, check, selectOption आणि press प्रवाशासारखं काम करतात, आणि प्रत्येक जण element दिसेपर्यंत आणि enabled होईपर्यंत थांबतो. प्रत्येक महत्त्वाच्या action नंतर प्रवाशाला काय दिसायला हवं ते assert करा.' }, icon: '🖱️' },
  },

  // ───────────────────────── W1.4 Web-first assertions
  {
    id: 'pw1-4',
    code: 'W1.4',
    level: 'basic',
    title: { en: 'Web-First Assertions and Auto-Waiting', mr: 'Web-first assertions आणि आपोआप वाट पाहणं' },
    skill: 'toHaveText, toContainText, toHaveCount, toBeEnabled, toHaveURL, timeouts',
    realLife: {
      place: 'kitchen',
      title: { en: 'Aaji and the pressure cooker', mr: 'आजी आणि प्रेशर कुकर' },
      story: {
        en: 'Aaji puts the dal in the pressure cooker. She does not set a phone timer for exactly 10 minutes. On a good gas day the third whistle comes at 8 minutes, on a slow day at 13. She keeps half an ear on the cooker while she cuts onions, and the moment the third whistle blows, she turns off the gas. Meera\'s cousin uses a fixed 10 minute timer: some days the dal is raw, some days it is burnt. Aaji also has a limit. If 20 minutes pass with no whistle at all, she stops waiting and checks the gasket. No whistle is not a reason to wait longer. It is news: something is wrong with the cooker.',
        mr: 'आजी प्रेशर कुकरमध्ये डाळ लावते. ती फोनवर ठरावीक 10 मिनिटांचा timer लावत नाही. gas चांगला असेल त्या दिवशी तिसरी शिट्टी 8 मिनिटांत येते, संथ दिवशी 13 मिनिटांत. कांदा चिरताना तिचा अर्धा कान कुकरकडे असतो, आणि तिसरी शिट्टी वाजताच ती gas बंद करते. मीराची चुलत बहीण ठरावीक 10 मिनिटांचा timer लावते: कधी डाळ कच्ची राहते, कधी करपते. आजीची एक मर्यादाही आहे. 20 मिनिटं झाली आणि एकही शिट्टी नाही, तर ती वाट पाहणं थांबवते आणि gasket तपासते. शिट्टी न येणं हे अजून थांबायचं कारण नाही. ती बातमी आहे: कुकरमध्ये काहीतरी बिघडलंय.',
      },
      scene: {
        type: 'ruler',
        unit: 'min',
        min: 0,
        max: 30,
        lo: 0,
        hi: 20,
        marks: [
          { value: 8, note: 'Third whistle on a good day: gas off at once', mr: 'चांगल्या दिवशी तिसरी शिट्टी: लगेच gas बंद' },
          { value: 13, note: 'Slow day: still inside the limit, still fine', mr: 'संथ दिवस: मर्यादेच्या आत, तरीही ठीक' },
          { value: 25, note: 'No whistle by the limit: check the gasket', mr: 'मर्यादेपर्यंत शिट्टी नाही: gasket तपासा' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'worried', text: { en: 'Every morning three Selenium tests on the results page go red. I rerun them and they go green. Nobody trusts that suite any more.', mr: 'रोज सकाळी results page वरच्या तीन Selenium tests लाल होतात. मी पुन्हा चालवतो आणि त्या हिरव्या होतात. आता त्या suite वर कोणाचाच विश्वास नाही.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'That script sleeps 2 seconds and then reads the count once. Playwright\'s expect keeps checking until the page agrees, up to 5 seconds, and stops the moment it does.', mr: 'ती script 2 सेकंद झोपते आणि मग count एकदाच वाचते. Playwright चा expect page जुळेपर्यंत पुन्हा पुन्हा तपासत राहतो, 5 सेकंदांपर्यंत, आणि जुळताच थांबतो.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> i made the flight results take 7 seconds. your test will blame itself and you will add a longer sleep. ⌁', mr: '>> मी flight results ला 7 सेकंद लावले. तुमची test स्वतःला दोष देईल आणि तुम्ही अजून मोठा sleep टाकाल. ⌁' } },
        { who: 'meera', mood: 'happy', text: { en: 'A timeout is a message too, {name}. Today you learn to read it, and to stop sleeping.', mr: 'timeout सुद्धा एक message आहे, {name}. आज तुम्ही तो वाचायला शिकाल, आणि झोपणं थांबवाल.' } },
      ],
      problem: { en: 'Pages fill in late: flights arrive after 0.8 seconds, the PNR after a payment call. Checks that read the page once are flaky, sleeps make the suite slow and still fail on a slow day, and a missing await lets a test race ahead without checking anything.', mr: 'pages उशिरा भरतात: flights 0.8 सेकंदांनी येतात, PNR payment call नंतर. page एकदाच वाचणारे checks बेभरवशी असतात, sleeps मुळे suite संथ होतो आणि संथ दिवशी तरीही fail होतो, आणि await राहिला तर test काहीच न तपासता पुढे धावते.' },
      solution: { en: 'Web-first assertions: await expect(locator).toHaveText(...), toHaveCount, toBeEnabled, toBeDisabled, toContainText and expect(page).toHaveURL. Each one retries until the page matches or the timeout ends, then reports Expected, Received and the timeout, so a failure tells you exactly what never happened.', mr: 'web-first assertions: await expect(locator).toHaveText(...), toHaveCount, toBeEnabled, toBeDisabled, toContainText आणि expect(page).toHaveURL. प्रत्येक जण page जुळेपर्यंत किंवा timeout संपेपर्यंत पुन्हा प्रयत्न करतो, मग Expected, Received आणि timeout सांगतो, म्हणजे failure नेमकं काय घडलंच नाही ते सांगतो.' },
    },
    lesson: [
      { en: 'A web-first assertion does not read the page once. await expect(page.getByTestId("result-count")).toHaveText("5 flights") checks, waits a moment, checks again, and passes the moment the text matches. If 5 seconds pass (our timeout), it fails. The flights arrive after 0.8 seconds, so the assertion simply takes 0.8 seconds. No sleep anywhere.', mr: 'web-first assertion page एकदाच वाचत नाही. await expect(page.getByTestId("result-count")).toHaveText("5 flights") तपासतं, क्षणभर थांबतं, पुन्हा तपासतं, आणि मजकूर जुळताच pass होतं. 5 सेकंद (आपला timeout) संपले तर fail होतं. flights 0.8 सेकंदांनी येतात, म्हणून assertion ला फक्त 0.8 सेकंद लागतात. कुठेही sleep नाही.' },
      { en: 'The everyday set: toHaveText (the whole text, spaces at the ends ignored), toContainText (a part of it), toHaveCount(5) (how many elements match), toBeEnabled and toBeDisabled (can it be clicked), and expect(page).toHaveURL("/flights?...") (where the browser is, with our baseURL in front). toHaveText also takes a regular expression when part of the text changes: toHaveText(/^SKY[A-Z0-9]{3}$/) accepts any new PNR.', mr: 'रोजचा संच: toHaveText (पूर्ण मजकूर, टोकांवरचे spaces सोडून), toContainText (त्यातला एक भाग), toHaveCount(5) (किती elements जुळतात), toBeEnabled आणि toBeDisabled (click करता येईल का), आणि expect(page).toHaveURL("/flights?...") (browser कुठे आहे, पुढे आपला baseURL लावून). मजकुराचा काही भाग बदलत असेल तर toHaveText ला regular expression पण चालतं: toHaveText(/^SKY[A-Z0-9]{3}$/) कोणताही नवीन PNR स्वीकारतं.' },
      { en: 'Three bad habits. page.waitForTimeout(2000) is Thread.sleep wearing a new shirt: slow on a fast day, flaky on a slow one. expect(await loc.textContent()).toBe("5 flights") reads once and never retries, so it can read the page before the results exist. And a missing await: expect(...) and click() return promises, and without await the test runs on before they finish. Our runner stops you with "Missing await ... Put await before it."', mr: 'तीन वाईट सवयी. page.waitForTimeout(2000) म्हणजे नवा शर्ट घातलेला Thread.sleep: जलद दिवशी संथ, संथ दिवशी बेभरवशी. expect(await loc.textContent()).toBe("5 flights") एकदाच वाचतं आणि पुन्हा प्रयत्न करत नाही, म्हणून results येण्याआधीच page वाचू शकतं. आणि राहिलेला await: expect(...) आणि click() promises देतात, आणि await नसेल तर ते संपण्याआधीच test पुढे जाते. आपला runner "Missing await ... Put await before it." सांगून तुम्हाला थांबवतो.' },
      { en: 'Reading a timeout failure: Expected, Received, Timeout 5000ms. Received "<element(s) not found>" means the element never appeared. Received with a different text means it appeared but was wrong. If results need 7 seconds, the test is right to fail: a passenger staring at "Searching flights..." for 7 seconds is a performance bug to report. Do not hide it with a bigger timeout. In Selenium you wrote a WebDriverWait for each slow thing. Here every expect already has one.', mr: 'timeout failure वाचणं: Expected, Received, Timeout 5000ms. Received "<element(s) not found>" म्हणजे element कधी आलाच नाही. Received मध्ये वेगळा मजकूर म्हणजे तो आला पण चुकीचा होता. results ना 7 सेकंद लागत असतील तर test fail होणं बरोबरच: प्रवासी 7 सेकंद "Searching flights..." कडे पाहत बसणं हा report करण्यासारखा performance bug आहे. मोठा timeout लावून तो लपवू नका. Selenium मध्ये प्रत्येक संथ गोष्टीसाठी तुम्ही WebDriverWait लिहायचात. इथे प्रत्येक expect मध्ये तो आधीच आहे.' },
    ],
    syntax: {
      template: `await expect(page.getByTestId('result-count')).toHaveText('5 flights');
await expect(page.getByTestId('trip-summary')).toContainText('2026-12-20');
await expect(page.getByTestId('flight-card')).toHaveCount(5);
await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
await expect(page).toHaveURL('/flights?from=PNQ&to=DEL&date=2026-12-20&pax=1');`,
      parts: [
        { code: "toHaveText('5 flights')", means: { en: 'the whole text matches (or a /regex/); retries until it does', mr: 'पूर्ण मजकूर जुळतो (किंवा /regex/); जुळेपर्यंत पुन्हा प्रयत्न' } },
        { code: "toContainText('2026-12-20')", means: { en: 'the text contains this part', mr: 'मजकुरात हा भाग आहे' } },
        { code: 'toHaveCount(5)', means: { en: 'exactly this many elements match the locator', mr: 'locator शी नेमके इतके elements जुळतात' } },
        { code: 'toBeEnabled() / toBeDisabled()', means: { en: 'can (or cannot) be clicked right now', mr: 'आत्ता click करता येतं (किंवा येत नाही)' } },
        { code: "expect(page).toHaveURL('/flights?...')", means: { en: 'the browser address, with the baseURL in front of a path', mr: 'browser चा पत्ता, path च्या पुढे baseURL लावून' } },
        { code: 'Timeout:  5000ms', means: { en: 'in a failure: it kept checking for 5 seconds and the page never matched', mr: 'failure मध्ये: 5 सेकंद तपासत राहिलं आणि page कधीच जुळलं नाही' } },
      ],
      example: [
        { code: `await page.goto('${FL}');`, note: { en: 'Aaji puts the cooker on the gas', mr: 'आजी कुकर gas वर ठेवते' } },
        { code: "await expect(page.getByTestId('result-count')).toHaveText('5 flights');", note: { en: 'listens for the third whistle, gas off the moment it comes', mr: 'तिसऱ्या शिट्टीकडे कान, येताच gas बंद' } },
        { code: "await expect(page.getByTestId('flight-card')).toHaveCount(5);", note: { en: 'counts the bowls on the table', mr: 'टेबलवरच्या वाट्या मोजते' } },
        { code: "await expect(page.getByTestId('trip-summary')).toContainText('1 passenger');", note: { en: 'a part is enough here: one plate for one guest', mr: 'इथे एक भाग पुरेसा: एका पाहुण्यासाठी एक ताट' } },
        { code: "// no page.waitForTimeout(10000) anywhere", note: { en: 'no fixed 10 minute timer: raw some days, burnt others', mr: 'ठरावीक 10 मिनिटांचा timer नाही: कधी कच्चं, कधी करपलेलं' } },
      ],
      exampleNote: { en: 'On a good build the whole test takes about a second. On a build where the results never come, it fails after 5 seconds and says what it was waiting for: the gasket check.', mr: 'चांगल्या build वर पूर्ण test ला साधारण एक सेकंद लागतो. results कधीच न येणाऱ्या build वर ती 5 सेकंदांनी fail होते आणि कशाची वाट पाहत होती ते सांगते: हीच gasket ची तपासणी.' },
      pitfall: { en: 'Keep await in front of expect(locator) and in front of every action. And do not write expect(await loc.textContent()).toBe(...) for page text: the await is inside, so the read happens once, too early. Put the locator inside expect and the await outside.', mr: 'expect(locator) च्या आणि प्रत्येक action च्या पुढे await ठेवा. आणि page च्या मजकुरासाठी expect(await loc.textContent()).toBe(...) लिहू नका: await आत आहे, म्हणून वाचन एकदाच, खूप लवकर होतं. locator expect च्या आत ठेवा आणि await बाहेर.' },
    },
    practice: {
      intro: { en: 'Retire the old habits one by one: the sleep, the read-once check, the missing await. Then read a real timeout from the Gremlin\'s slow build.', mr: 'जुन्या सवयी एकेक करून निवृत्त करा: sleep, एकदाच वाचणारा check, राहिलेला await. मग gremlin च्या संथ build वरचा खरा timeout वाचा.' },
      steps: [
        {
          kind: 'playwright',
          prompt: { en: 'This test was copied from the Selenium suite. It passes today, but it sleeps and reads once. Rewrite it the Playwright way: no waitForTimeout and no textContent. Assert that result-count has the text "5 flights" and that there are 5 flight cards (getByTestId("flight-card")).', mr: 'ही test Selenium suite मधून copy केली आहे. आज ती pass होते, पण ती झोपते आणि एकदाच वाचते. ती Playwright पद्धतीने पुन्हा लिहा: waitForTimeout नाही आणि textContent नाही. result-count चा मजकूर "5 flights" आहे आणि 5 flight cards (getByTestId("flight-card")) आहेत हे assert करा.' },
          startUrl: FL,
          starter: `${H}test('results show 5 flights', async ({ page }) => {
  await page.goto('${FL}');
  // Old Selenium habit: sleep, then read once
  await page.waitForTimeout(2000);
  const count = await page.getByTestId('result-count').textContent();
  expect(count).toBe('5 flights');
  // TODO: delete the three lines above
  // TODO: assert result-count has text '5 flights' with a web-first assertion
  // TODO: assert there are 5 flight cards
});
`,
          solution: `${H}test('results show 5 flights', async ({ page }) => {
  await page.goto('${FL}');
  await expect(page.getByTestId('result-count')).toHaveText('5 flights');
  await expect(page.getByTestId('flight-card')).toHaveCount(5);
});
`,
          minAssertions: 2,
          noWaitForTimeout: true,
          mustUse: [
            { pattern: 'toHaveText\\(', message: { en: "Check the count text with toHaveText('5 flights').", mr: "count चा मजकूर toHaveText('5 flights') ने तपासा." } },
            { pattern: 'toHaveCount\\(\\s*5\\s*\\)', message: { en: 'Count the cards with toHaveCount(5).', mr: 'cards toHaveCount(5) ने मोजा.' } },
          ],
          mustNotUse: [{ pattern: 'textContent\\(', message: { en: 'textContent() reads once and never retries. Put the locator inside expect(...) instead.', mr: 'textContent() एकदाच वाचतं आणि पुन्हा प्रयत्न करत नाही. त्याऐवजी locator expect(...) च्या आत ठेवा.' } }],
          hints: [
            { en: 'The locator goes inside expect, the await goes in front of expect.', mr: 'locator expect च्या आत, await expect च्या पुढे.' },
            c("await expect(page.getByTestId('result-count')).toHaveText('5 flights');"),
            { en: 'Cards: same shape with getByTestId("flight-card") and toHaveCount(5). Then delete the sleep and the textContent lines.', mr: 'cards साठी: getByTestId("flight-card") आणि toHaveCount(5) सह तीच रचना. मग sleep आणि textContent च्या ओळी काढा.' },
            c(`await page.goto('${FL}');\nawait expect(page.getByTestId('result-count')).toHaveText('5 flights');\nawait expect(page.getByTestId('flight-card')).toHaveCount(5);`),
          ],
          successLine: { en: 'Two seconds saved on this one test, and it no longer depends on luck. Multiply that by the whole suite.', mr: 'या एका test मध्ये दोन सेकंद वाचले, आणि ती आता नशिबावर अवलंबून नाही. पूर्ण suite ने गुणा.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Theo\'s seat test fails with "Missing await". Press Run, read the log, and fix the line. Then add one more check: the taken seat "Seat 10A" is disabled.', mr: 'Theo ची seat test "Missing await" देऊन fail होते. Run दाबा, log वाचा, आणि ती ओळ दुरुस्त करा. मग अजून एक check जोडा: घेतलेली "Seat 10A" disabled आहे.' },
          startUrl: '/seats?demo=1',
          starter: `${H}test('Continue unlocks after a seat', async ({ page }) => {
  await page.goto('/seats?demo=1');
  const next = page.getByRole('button', { name: 'Continue' });
  await expect(next).toBeDisabled();
  page.getByRole('button', { name: 'Seat 12C' }).click();
  await expect(page.getByTestId('selected-seats')).toHaveText('Selected: 12C');
  await expect(next).toBeEnabled();
  // TODO: assert 'Seat 10A' (taken) is disabled
});
`,
          solution: `${H}test('Continue unlocks after a seat', async ({ page }) => {
  await page.goto('/seats?demo=1');
  const next = page.getByRole('button', { name: 'Continue' });
  await expect(next).toBeDisabled();
  await page.getByRole('button', { name: 'Seat 12C' }).click();
  await expect(page.getByTestId('selected-seats')).toHaveText('Selected: 12C');
  await expect(next).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Seat 10A' })).toBeDisabled();
});
`,
          minAssertions: 4,
          mustUse: [{ pattern: "name:\\s*'Seat 10A'[\\s\\S]*toBeDisabled\\(", message: { en: "Add: await expect(page.getByRole('button', { name: 'Seat 10A' })).toBeDisabled();", mr: "हे जोडा: await expect(page.getByRole('button', { name: 'Seat 10A' })).toBeDisabled();" } }],
          hints: [
            { en: 'The log names the line. Every action returns a promise. Which line has no await in front?', mr: 'log ओळ सांगतो. प्रत्येक action promise देतो. कोणत्या ओळीच्या पुढे await नाही?' },
            c("await page.getByRole('button', { name: 'Seat 12C' }).click();"),
            { en: 'The taken seat\'s name is "Seat 10A, taken". getByRole matches part of the name, so name: "Seat 10A" finds it.', mr: 'घेतलेल्या seat चं नाव "Seat 10A, taken" आहे. getByRole नावाचा भाग जुळवतो, म्हणून name: "Seat 10A" ने ती सापडते.' },
            c("await expect(page.getByRole('button', { name: 'Seat 10A' })).toBeDisabled();"),
          ],
          successLine: { en: 'One missing word, and the test would have checked the page before the click landed. Now every step waits its turn.', mr: 'एक शब्द राहिला असता तर click होण्याआधीच test ने page तपासलं असतं. आता प्रत्येक पायरी आपल्या वेळेला चालते.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Sam runs this test on tonight\'s build and it fails. Press Run and read the failure (and the browser). What does it tell you?', mr: 'Sam ही test आजच्या रात्रीच्या build वर चालवतो आणि ती fail होते. Run दाबा आणि failure (आणि browser) वाचा. ते काय सांगतं?' },
          playwrightSandbox: {
            startUrl: FL,
            build: ['results-slow'],
            code: `${H}test('results show 5 flights', async ({ page }) => {
  await page.goto('${FL}');
  await expect(page.getByTestId('result-count')).toHaveText('5 flights');
});
`,
          },
          options: [
            { en: 'The locator is wrong: SkyHop has no result-count', mr: 'locator चुकीचा आहे: SkyHop वर result-count नाही' },
            { en: 'Playwright forgot to wait. Add page.waitForTimeout(8000) before the expect', mr: 'Playwright वाट पाहायला विसरला. expect च्या आधी page.waitForTimeout(8000) टाका' },
            { en: 'The results did not appear within the 5 second timeout while "Searching flights..." stayed on screen. The page is too slow: report it as a bug', mr: '"Searching flights..." screen वर असताना results 5 सेकंदांच्या timeout मध्ये आले नाहीत. page खूप संथ आहे: bug म्हणून report करा' },
            { en: 'The flights API returned an error', mr: 'flights API ने error दिला' },
          ],
          correct: [2],
          explain: { en: 'Received "<element(s) not found>" with Timeout 5000ms means: it kept looking for 5 seconds and the count never appeared. The same test passes on the good build in under a second, so the locator is fine. On this build the results take 7 seconds. A sleep or a bigger timeout would turn the test green and hide a real problem from passengers.', mr: 'Timeout 5000ms सह Received "<element(s) not found>" म्हणजे: तो 5 सेकंद शोधत राहिला आणि count कधी आलाच नाही. हीच test चांगल्या build वर एका सेकंदाच्या आत pass होते, म्हणजे locator बरोबर आहे. या build वर results ना 7 सेकंद लागतात. sleep किंवा मोठा timeout test हिरवी करेल आणि प्रवाशांची खरी अडचण लपवेल.' },
          hints: [
            { en: 'Look at Received and Timeout in the failure, then look at what the browser still shows.', mr: 'failure मधले Received आणि Timeout पाहा, मग browser अजून काय दाखवतो ते पाहा.' },
            { en: 'Would a passenger be happy to wait that long? Is that the test\'s fault?', mr: 'प्रवासी इतका वेळ आनंदाने थांबेल का? ही test ची चूक आहे का?' },
          ],
          successLine: { en: 'Aaji\'s gasket rule: no whistle by the limit is news. The Gremlin wanted you to add a sleep. You filed a bug instead.', mr: 'आजीचा gasket नियम: मर्यादेपर्यंत शिट्टी नाही ही बातमी आहे. तुम्ही sleep टाकावा अशी gremlin ची इच्छा होती. तुम्ही त्याऐवजी bug नोंदवला.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'From the home page, search Mumbai to Bengaluru: From by value "BOM", To by label "Bengaluru (BLR)", date 2026-12-20, then click Search flights. Assert the URL is "/flights?from=BOM&to=BLR&date=2026-12-20&pax=1", trip-summary contains "2026-12-20", and result-count has the text "5 flights". Your test should also catch the slow build.', mr: 'home page वरून Mumbai ते Bengaluru search करा: From value "BOM" ने, To label "Bengaluru (BLR)" ने, तारीख 2026-12-20, मग Search flights वर click करा. URL "/flights?from=BOM&to=BLR&date=2026-12-20&pax=1" आहे, trip-summary मध्ये "2026-12-20" आहे, आणि result-count चा मजकूर "5 flights" आहे हे assert करा. तुमच्या test ने संथ build सुद्धा पकडायला हवा.' },
          startUrl: '/',
          starter: `${H}test('search Mumbai to Bengaluru', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('From').selectOption('BOM');
  await page.getByLabel('To').selectOption({ label: 'Bengaluru (BLR)' });
  await page.getByLabel('Departure date').fill('2026-12-20');
  await page.getByRole('button', { name: 'Search flights' }).click();
  // TODO: assert the URL with toHaveURL
  // TODO: assert trip-summary contains '2026-12-20'
  // TODO: assert result-count has text '5 flights'
});
`,
          solution: `${H}test('search Mumbai to Bengaluru', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('From').selectOption('BOM');
  await page.getByLabel('To').selectOption({ label: 'Bengaluru (BLR)' });
  await page.getByLabel('Departure date').fill('2026-12-20');
  await page.getByRole('button', { name: 'Search flights' }).click();
  await expect(page).toHaveURL('/flights?from=BOM&to=BLR&date=2026-12-20&pax=1');
  await expect(page.getByTestId('trip-summary')).toContainText('2026-12-20');
  await expect(page.getByTestId('result-count')).toHaveText('5 flights');
});
`,
          minAssertions: 3,
          noWaitForTimeout: true,
          mustUse: [
            { pattern: 'toHaveURL\\(', message: { en: 'Check the address with expect(page).toHaveURL(...).', mr: 'पत्ता expect(page).toHaveURL(...) ने तपासा.' } },
            { pattern: 'toContainText\\(', message: { en: "Check part of the summary with toContainText('2026-12-20').", mr: "summary चा भाग toContainText('2026-12-20') ने तपासा." } },
          ],
          mustCatch: [{ bug: 'results-slow', label: { en: 'Flight results take 7 seconds', mr: 'flight results ना 7 सेकंद लागतात' } }],
          hints: [
            { en: 'toHaveURL is on expect(page), not on a locator. A path starting with / gets the baseURL in front.', mr: 'toHaveURL expect(page) वर असतो, locator वर नाही. / ने सुरू होणाऱ्या path च्या पुढे baseURL लागतो.' },
            c("await expect(page).toHaveURL('/flights?from=BOM&to=BLR&date=2026-12-20&pax=1');"),
            { en: 'The summary reads "2026-12-20 · 1 passenger", so toContainText fits. The count must be exact, so toHaveText.', mr: 'summary "2026-12-20 · 1 passenger" असा आहे, म्हणून toContainText योग्य. count नेमका हवा, म्हणून toHaveText.' },
            c("await expect(page).toHaveURL('/flights?from=BOM&to=BLR&date=2026-12-20&pax=1');\nawait expect(page.getByTestId('trip-summary')).toContainText('2026-12-20');\nawait expect(page.getByTestId('result-count')).toHaveText('5 flights');"),
          ],
          successLine: { en: 'Right address, right date, right results, and the slow build went red within the timeout. That is a test you can trust at 2 am.', mr: 'योग्य पत्ता, योग्य तारीख, योग्य results, आणि संथ build timeout मध्येच लाल झाला. रात्री 2 वाजता विश्वास ठेवता येईल अशी ही test आहे.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'The flights arrive 0.8 seconds after the page opens. Why does this line still pass without any wait?', mr: 'page उघडल्यानंतर 0.8 सेकंदांनी flights येतात. तरी ही ओळ कोणत्याही wait शिवाय pass का होते?' },
        code: "await expect(page.getByTestId('result-count')).toHaveText('5 flights');",
        options: [
          { en: 'Because page.goto waits for every API call to finish', mr: 'कारण page.goto प्रत्येक API call संपेपर्यंत थांबतो' },
          { en: 'Because toHaveText keeps re-checking until the text matches or the 5 second timeout ends', mr: 'कारण मजकूर जुळेपर्यंत किंवा 5 सेकंदांचा timeout संपेपर्यंत toHaveText पुन्हा पुन्हा तपासतो' },
          { en: 'Because Playwright sleeps 1 second before every expect', mr: 'कारण Playwright प्रत्येक expect आधी 1 सेकंद झोपतो' },
          { en: 'It does not pass; it needs waitForTimeout(1000)', mr: 'ती pass होत नाही; तिला waitForTimeout(1000) लागतो' },
        ],
        answer: 1,
        explain: { en: 'Web-first assertions retry. They pass the moment the page matches, so a fast page means a fast test.', mr: 'web-first assertions पुन्हा प्रयत्न करतात. page जुळताच ते pass होतात, म्हणजे जलद page म्हणजे जलद test.' },
      },
      {
        q: { en: 'What is risky about this check, right after page.goto?', mr: 'page.goto नंतर लगेच असलेल्या या check मध्ये धोका काय?' },
        code: "const text = await page.getByTestId('result-count').textContent();\nexpect(text).toBe('5 flights');",
        options: [
          { en: 'Nothing, it is the recommended style', mr: 'काहीच नाही, हीच सुचवलेली पद्धत आहे' },
          { en: 'toBe cannot compare strings', mr: 'toBe strings ची तुलना करू शकत नाही' },
          { en: 'It needs a second await before expect', mr: 'expect आधी दुसरा await लागतो' },
          { en: 'textContent reads once, maybe before the results exist, and the plain toBe never retries: a flaky test', mr: 'textContent एकदाच वाचतं, कदाचित results येण्याआधीच, आणि साधा toBe पुन्हा प्रयत्न करत नाही: बेभरवशी test' },
        ],
        answer: 3,
        explain: { en: 'Put the locator inside expect and use toHaveText. Then the read is retried until it matches.', mr: 'locator expect च्या आत ठेवा आणि toHaveText वापरा. मग जुळेपर्यंत वाचन पुन्हा पुन्हा होतं.' },
      },
      {
        q: { en: 'A test fails with this. What happened on the page?', mr: 'एक test असं fail होते. page वर काय घडलं?' },
        code: "Error: expect(locator).toHaveText(expected) failed\n\nLocator:  getByTestId('result-count')\nExpected: \"5 flights\"\nReceived: \"3 flights\"\nTimeout:  5000ms",
        options: [
          { en: 'The count was on the page the whole time, but it said 3 flights, not 5: a real mismatch to look into', mr: 'count पूर्ण वेळ page वर होता, पण तो 5 नाही, 3 flights म्हणत होता: तपासण्यासारखा खरा फरक' },
          { en: 'The element never appeared', mr: 'element कधी आलाच नाही' },
          { en: 'The page was slow; a longer timeout would fix it', mr: 'page संथ होतं; मोठा timeout लावला तर ठीक होईल' },
          { en: 'The test is missing an await', mr: 'test मध्ये await राहिला आहे' },
        ],
        answer: 0,
        explain: { en: 'Received shows a real value, so the element was found. For 5 seconds it said "3 flights". Maybe the non-stop filter was on, maybe a flight is missing. Either way, more waiting will not change it.', mr: 'Received खरी value दाखवतो, म्हणजे element सापडला. 5 सेकंद तो "3 flights" म्हणत होता. कदाचित non-stop filter चालू होता, कदाचित एखादी flight गायब आहे. काहीही असो, अजून थांबून ते बदलणार नाही.' },
      },
      {
        q: { en: 'trip-summary shows "2026-12-20 · 1 passenger". Which assertion passes?', mr: 'trip-summary मध्ये "2026-12-20 · 1 passenger" दिसतं. कोणतं assertion pass होतं?' },
        options: [
          "await expect(page.getByTestId('trip-summary')).toHaveText('2026-12-20');",
          "await expect(page.getByTestId('trip-summary')).toHaveCount('2026-12-20');",
          "await expect(page.getByTestId('trip-summary')).toContainText('2026-12-20');",
          "await expect(page).toHaveText('2026-12-20');",
        ],
        answer: 2,
        explain: { en: 'toContainText checks a part. toHaveText wants the whole text, toHaveCount takes a number, and the page itself has no toHaveText.', mr: 'toContainText एक भाग तपासतो. toHaveText ला पूर्ण मजकूर लागतो, toHaveCount ला संख्या लागते, आणि page वर toHaveText नसतो.' },
      },
    ],
    recap: { line: { en: 'await expect(locator) assertions retry until the page matches or 5 seconds pass. No sleeps, no read-once checks, never a missing await. A timeout is evidence worth reading.', mr: 'await expect(locator) assertions page जुळेपर्यंत किंवा 5 सेकंद होईपर्यंत पुन्हा प्रयत्न करतात. sleep नाही, एकदाच वाचणारे checks नाहीत, await कधीच राहू नये. timeout हा वाचण्यासारखा पुरावा आहे.' }, icon: '⏳' },
  },

  // ───────────────────────── W1.5 Lists, cards and filters
  {
    id: 'pw1-5',
    code: 'W1.5',
    level: 'basic',
    title: { en: 'Lists, Cards and Filters', mr: 'Lists, cards आणि filters' },
    skill: 'filter, nth, first, last, count, allTextContents',
    realLife: {
      place: 'market',
      title: { en: 'Mangoes at the Mandai', mr: 'मंडईतले आंबे' },
      story: {
        en: 'Meera is buying mangoes at the Mandai for Gudi Padwa. The vendor has a long row of crates. She does not say "give me a crate". She says "the crate with Alphonso written on it" (filter by text), or "only the crates with a green Ratnagiri sticker" (filter by what is inside). When she wants the one at the end, she says "the last crate". The board says "cheapest first", so she reads every price along the row: 600, 450, 700. Not cheapest first. She asks the vendor to fix the board before an aunty with less patience comes along.',
        mr: 'गुढीपाडव्यासाठी मीरा मंडईत आंबे घेतेय. विक्रेत्याकडे crates ची लांब रांग आहे. ती "एक crate द्या" असं म्हणत नाही. ती म्हणते "ज्या crate वर Alphonso लिहिलंय ती" (मजकुराने filter), किंवा "फक्त हिरव्या Ratnagiri sticker च्या crates" (आत काय आहे त्याने filter). शेवटची हवी असेल तर ती म्हणते "शेवटची crate". बोर्डवर लिहिलंय "आधी स्वस्त", म्हणून ती रांगेतल्या सगळ्या किंमती वाचते: 600, 450, 700. आधी स्वस्त नाही. कमी संयम असलेल्या एखाद्या काकू येण्याआधी ती विक्रेत्याला बोर्ड दुरुस्त करायला सांगते.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Only crates with a green Ratnagiri sticker (filter has)', mr: 'फक्त हिरव्या Ratnagiri sticker च्या crates (filter has)' },
        items: [
          { icon: '🥭', label: 'Alphonso ₹600, green sticker', mr: 'Alphonso ₹600, हिरवा sticker', pass: true },
          { icon: '🥭', label: 'Kesar ₹450, no sticker', mr: 'Kesar ₹450, sticker नाही', pass: false },
          { icon: '🥭', label: 'Alphonso ₹700, green sticker', mr: 'Alphonso ₹700, हिरवा sticker', pass: true },
          { icon: '🥭', label: 'Payari ₹400, red sticker', mr: 'Payari ₹400, लाल sticker', pass: false },
          { icon: '🥭', label: 'Hapus ₹650, green sticker', mr: 'Hapus ₹650, हिरवा sticker', pass: true },
          { icon: '🥭', label: 'Totapuri ₹300, no sticker', mr: 'Totapuri ₹300, sticker नाही', pass: false },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Passengers picked "Lowest price" and the cheapest flight was not on top. Forty people booked a dearer flight and asked for the difference back.', mr: 'प्रवाशांनी "Lowest price" निवडलं आणि सगळ्यात स्वस्त flight वर नव्हती. चाळीस लोकांनी महाग flight book केली आणि फरकाचे पैसे परत मागितले.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'The results are five cards, and every card has a Select button. A plain getByRole for Select is a strict mode violation.', mr: 'results म्हणजे पाच cards, आणि प्रत्येक card मध्ये Select बटण आहे. Select साठी साधा getByRole म्हणजे strict mode violation.' } },
        { who: 'rex', mood: 'happy', text: { en: 'So we narrow down. filter by text, filter by what is inside, nth for a position, and allTextContents to read the whole row at once.', mr: 'म्हणून आपण शोध अरुंद करतो. मजकुराने filter, आत काय आहे त्याने filter, जागेसाठी nth, आणि पूर्ण रांग एकदम वाचायला allTextContents.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> "non-stop only". mostly. one tiny stop never hurt anyone. ⌁', mr: '>> "non-stop only". बहुतेक. एक छोटासा stop कोणाला त्रास देतो? ⌁' } },
        { who: 'meera', mood: 'happy', text: { en: 'Lists are where bugs hide in plain sight, {name}. Count them, read them, check the order.', mr: 'lists मध्ये bugs सगळ्यांसमोर लपतात, {name}. त्या मोजा, वाचा, क्रम तपासा.' } },
      ],
      problem: { en: 'Results pages show many similar cards. Tests that grab "the third card" break when the order changes, tests that grab "the Select button" hit strict mode, and nobody checks that a sort or a filter really did its job across the whole list.', mr: 'results pages वर अनेक सारखे cards असतात. "तिसरं card" पकडणाऱ्या tests क्रम बदलला की मोडतात, "Select बटण" पकडणाऱ्या tests strict mode ला धडकतात, आणि sort किंवा filter ने पूर्ण list वर खरंच काम केलं का हे कोणीच तपासत नाही.' },
      solution: { en: 'Start from a locator for all cards, then narrow it: filter({ hasText }), filter({ has }), first(), last(), nth(i). Check how many with toHaveCount, read them all with allTextContents, and compare the order with a sorted copy.', mr: 'सगळ्या cards च्या locator पासून सुरू करा, मग तो अरुंद करा: filter({ hasText }), filter({ has }), first(), last(), nth(i). किती आहेत ते toHaveCount ने तपासा, सगळे allTextContents ने वाचा, आणि क्रमाची sorted copy शी तुलना करा.' },
    },
    lesson: [
      { en: 'page.getByTestId("flight-card") is one locator for all five cards. That is allowed: strict mode only complains when you act on, or check the text of, a locator that matches many. toHaveCount(5) and count() are made for many. To act on one card, narrow it down first.', mr: 'page.getByTestId("flight-card") हा पाचही cards साठी एक locator आहे. ते चालतं: अनेक जुळणाऱ्या locator वर action केला किंवा त्याचा मजकूर तपासला तरच strict mode तक्रार करतो. toHaveCount(5) आणि count() अनेकांसाठीच बनले आहेत. एका card वर काम करायचं असेल तर आधी शोध अरुंद करा.' },
      { en: 'filter({ hasText: "SH 412" }) keeps the cards whose text contains SH 412. filter({ has: page.getByText("1 stop") }) keeps the cards that contain a matching element. hasNotText and hasNot do the opposite. Then chain inside the card: card.getByRole("button", { name: "Select" }) is now exactly one button.', mr: 'filter({ hasText: "SH 412" }) ज्या cards च्या मजकुरात SH 412 आहे ते ठेवतो. filter({ has: page.getByText("1 stop") }) ज्या cards मध्ये जुळणारा element आहे ते ठेवतो. hasNotText आणि hasNot उलटं करतात. मग card च्या आत chain करा: card.getByRole("button", { name: "Select" }) आता नेमकं एकच बटण आहे.' },
      { en: 'Positions: first(), last() and nth(2) (counting from 0, so nth(2) is the third card). Use them when the position is the thing you test, like "after sorting, the cheapest is first". When you just want a flight, filter by its text, because the order can change.', mr: 'जागा: first(), last() आणि nth(2) (0 पासून मोजतात, म्हणजे nth(2) तिसरं card). जागाच तपासायची असेल तेव्हा ते वापरा, जसं "sort नंतर सगळ्यात स्वस्त पहिलं". फक्त एखादी flight हवी असेल तर तिच्या मजकुराने filter करा, कारण क्रम बदलू शकतो.' },
      { en: 'allTextContents() returns every match\'s text as a string[] right now. It does not wait, so first wait with await expect(cards).toHaveCount(5). To check a sort: turn "₹4,500" into 4500, make a sorted copy with [...prices].sort((a, b) => a - b), and expect(prices).toEqual(sorted). In Selenium this was findElements plus a loop. Same idea, fewer lines.', mr: 'allTextContents() प्रत्येक जुळणाऱ्याचा मजकूर string[] म्हणून आत्ताच देतो. तो वाट पाहत नाही, म्हणून आधी await expect(cards).toHaveCount(5) ने थांबा. sort तपासायला: "₹4,500" चं 4500 करा, [...prices].sort((a, b) => a - b) ने sorted copy बनवा, आणि expect(prices).toEqual(sorted). Selenium मध्ये हे findElements आणि loop होतं. कल्पना तीच, ओळी कमी.' },
    ],
    syntax: {
      template: `const cards = page.getByTestId('flight-card');
await expect(cards).toHaveCount(5);
const sh412 = cards.filter({ hasText: 'SH 412' });
const oneStop = cards.filter({ has: page.getByText('1 stop') });
await expect(cards.first().getByRole('heading')).toHaveText('SH 201');
const texts = await page.getByTestId('price').allTextContents();
const prices = texts.map(t => Number(t.replace(/[^0-9]/g, '')));
expect(prices).toEqual([...prices].sort((a, b) => a - b));`,
      parts: [
        { code: "filter({ hasText: 'SH 412' })", means: { en: 'keep the items whose text contains this', mr: 'ज्यांच्या मजकुरात हे आहे ते items ठेवा' } },
        { code: 'filter({ has: locator })', means: { en: 'keep the items that contain a matching element', mr: 'ज्यांच्यात जुळणारा element आहे ते items ठेवा' } },
        { code: 'first() / last() / nth(2)', means: { en: 'pick by position; nth counts from 0', mr: 'जागेने निवडा; nth 0 पासून मोजतो' } },
        { code: 'toHaveCount(n) / count()', means: { en: 'how many match: the assertion waits, count() reads once', mr: 'किती जुळतात: assertion थांबतं, count() एकदाच वाचतं' } },
        { code: 'allTextContents()', means: { en: 'every text as a string[], right now (no waiting)', mr: 'प्रत्येक मजकूर string[] म्हणून, आत्ताच (वाट न पाहता)' } },
        { code: '[...prices].sort((a, b) => a - b)', means: { en: 'a sorted copy to compare with; numbers need (a, b) => a - b', mr: 'तुलनेसाठी sorted copy; संख्यांना (a, b) => a - b लागतं' } },
      ],
      example: [
        { code: `await page.goto('${FL}');`, note: { en: 'Meera walks up to the row of crates', mr: 'मीरा crates च्या रांगेजवळ येते' } },
        { code: "const cards = page.getByTestId('flight-card');", note: { en: 'the whole row, all at once', mr: 'पूर्ण रांग, एकदम' } },
        { code: 'await expect(cards).toHaveCount(5);', note: { en: 'counts the crates before reading anything', mr: 'काहीही वाचण्याआधी crates मोजते' } },
        { code: "await expect(cards.filter({ hasText: 'SH 412' }).getByTestId('price')).toHaveText('₹5,200');", note: { en: '"the crate with Alphonso written on it": price?', mr: '"ज्या crate वर Alphonso लिहिलंय ती": किंमत?' } },
        { code: "await expect(cards.filter({ has: page.getByText('1 stop') })).toHaveCount(2);", note: { en: 'only the crates with the sticker inside', mr: 'फक्त आत sticker असलेल्या crates' } },
        { code: "const texts = await page.getByTestId('price').allTextContents();", note: { en: 'reads every price along the row to check the board', mr: 'बोर्ड तपासायला रांगेतली प्रत्येक किंमत वाचते' } },
      ],
      pitfall: { en: 'allTextContents and count() do not wait. Right after goto they can return [] and 0 because the results are still loading. Always wait first with await expect(cards).toHaveCount(5). And sort numbers with (a, b) => a - b: a plain .sort() compares them as text.', mr: 'allTextContents आणि count() वाट पाहत नाहीत. goto नंतर लगेच ते [] आणि 0 देऊ शकतात, कारण results अजून येतायत. नेहमी आधी await expect(cards).toHaveCount(5) ने थांबा. आणि संख्या (a, b) => a - b ने sort करा: साधा .sort() त्यांची मजकुरासारखी तुलना करतो.' },
    },
    practice: {
      intro: { en: 'All steps run on the results page for Pune to Delhi on 2026-12-20: five cards, SH 201 to SH 623. Narrow down, count, read and check the order.', mr: 'सगळ्या steps Pune ते Delhi, 2026-12-20 च्या results page वर चालतात: पाच cards, SH 201 ते SH 623. शोध अरुंद करा, मोजा, वाचा आणि क्रम तपासा.' },
      steps: [
        {
          kind: 'playwright',
          prompt: { en: 'Assert there are 5 cards. Then take the SH 412 card with filter({ hasText }), assert its price (data-testid "price") is "₹5,200", and click the Select button inside it. Finally assert flight-summary on the seat page contains "SH 412".', mr: '5 cards आहेत हे assert करा. मग filter({ hasText }) ने SH 412 चं card घ्या, त्याची किंमत (data-testid "price") "₹5,200" आहे हे assert करा, आणि त्याच्या आतल्या Select बटणावर click करा. शेवटी seat page वरच्या flight-summary मध्ये "SH 412" आहे हे assert करा.' },
          startUrl: FL,
          starter: `${H}test('book the SH 412 card', async ({ page }) => {
  await page.goto('${FL}');
  const cards = page.getByTestId('flight-card');
  // TODO: assert there are 5 cards
  // TODO: const sh412 = the card that has the text 'SH 412'
  // TODO: assert its price is '₹5,200'
  // TODO: click the Select button inside it
  // TODO: assert flight-summary contains 'SH 412'
});
`,
          solution: `${H}test('book the SH 412 card', async ({ page }) => {
  await page.goto('${FL}');
  const cards = page.getByTestId('flight-card');
  await expect(cards).toHaveCount(5);
  const sh412 = cards.filter({ hasText: 'SH 412' });
  await expect(sh412.getByTestId('price')).toHaveText('₹5,200');
  await sh412.getByRole('button', { name: 'Select' }).click();
  await expect(page.getByTestId('flight-summary')).toContainText('SH 412');
});
`,
          minAssertions: 3,
          mustUse: [{ pattern: 'filter\\(\\s*\\{\\s*hasText', message: { en: "Narrow the cards with filter({ hasText: 'SH 412' }).", mr: "cards filter({ hasText: 'SH 412' }) ने अरुंद करा." } }],
          hints: [
            { en: 'Narrow first, then chain inside the narrowed card: sh412.getByTestId("price"), sh412.getByRole("button", ...).', mr: 'आधी अरुंद करा, मग त्या card च्या आत chain करा: sh412.getByTestId("price"), sh412.getByRole("button", ...).' },
            c("await expect(cards).toHaveCount(5);\nconst sh412 = cards.filter({ hasText: 'SH 412' });"),
            c("await expect(sh412.getByTestId('price')).toHaveText('₹5,200');\nawait sh412.getByRole('button', { name: 'Select' }).click();"),
            c("await expect(cards).toHaveCount(5);\nconst sh412 = cards.filter({ hasText: 'SH 412' });\nawait expect(sh412.getByTestId('price')).toHaveText('₹5,200');\nawait sh412.getByRole('button', { name: 'Select' }).click();\nawait expect(page.getByTestId('flight-summary')).toContainText('SH 412');"),
          ],
          successLine: { en: 'One card out of five, one Select button out of five, and no strict mode error. And the price was checked before you clicked.', mr: 'पाचपैकी एक card, पाचपैकी एक Select बटण, आणि strict mode error नाही. आणि click आधी किंमतही तपासली.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Positions and contents. Assert that exactly 2 cards contain the text "1 stop" using filter({ has: page.getByText("1 stop") }). Then, in the default departure order, assert the heading of the first card is "SH 201", of nth(2) is "SH 412", and of the last card is "SH 623".', mr: 'जागा आणि आतलं. filter({ has: page.getByText("1 stop") }) वापरून नेमके 2 cards मध्ये "1 stop" आहे हे assert करा. मग departure च्या मूळ क्रमात, पहिल्या card चं heading "SH 201", nth(2) चं "SH 412", आणि शेवटच्या card चं "SH 623" आहे हे assert करा.' },
          startUrl: FL,
          starter: `${H}test('positions in departure order', async ({ page }) => {
  await page.goto('${FL}');
  const cards = page.getByTestId('flight-card');
  // TODO: assert 2 cards have a '1 stop' element inside (filter with has)
  // TODO: first card heading is 'SH 201'
  // TODO: nth(2) card heading is 'SH 412'
  // TODO: last card heading is 'SH 623'
});
`,
          solution: `${H}test('positions in departure order', async ({ page }) => {
  await page.goto('${FL}');
  const cards = page.getByTestId('flight-card');
  await expect(cards.filter({ has: page.getByText('1 stop') })).toHaveCount(2);
  await expect(cards.first().getByRole('heading')).toHaveText('SH 201');
  await expect(cards.nth(2).getByRole('heading')).toHaveText('SH 412');
  await expect(cards.last().getByRole('heading')).toHaveText('SH 623');
});
`,
          minAssertions: 4,
          mustUse: [
            { pattern: 'filter\\(\\s*\\{\\s*has:', message: { en: "Use filter({ has: page.getByText('1 stop') }).", mr: "filter({ has: page.getByText('1 stop') }) वापरा." } },
            { pattern: 'nth\\(\\s*2\\s*\\)', message: { en: 'Use nth(2) for the third card.', mr: 'तिसऱ्या card साठी nth(2) वापरा.' } },
            { pattern: 'last\\(\\)', message: { en: 'Use last() for the last card.', mr: 'शेवटच्या card साठी last() वापरा.' } },
          ],
          hints: [
            { en: 'Each card has exactly one heading (the h3 with the flight number), so card.getByRole("heading") is safe. nth counts from 0.', mr: 'प्रत्येक card मध्ये नेमकं एक heading आहे (flight number असलेला h3), म्हणून card.getByRole("heading") सुरक्षित आहे. nth 0 पासून मोजतो.' },
            c("await expect(cards.filter({ has: page.getByText('1 stop') })).toHaveCount(2);"),
            c("await expect(cards.first().getByRole('heading')).toHaveText('SH 201');"),
            c("await expect(cards.filter({ has: page.getByText('1 stop') })).toHaveCount(2);\nawait expect(cards.first().getByRole('heading')).toHaveText('SH 201');\nawait expect(cards.nth(2).getByRole('heading')).toHaveText('SH 412');\nawait expect(cards.last().getByRole('heading')).toHaveText('SH 623');"),
          ],
          successLine: { en: 'First, third, last, and the two with a stop. You can now point at any card in the row.', mr: 'पहिलं, तिसरं, शेवटचं, आणि stop असलेले दोन. आता रांगेतल्या कोणत्याही card कडे बोट दाखवता येतं.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'The Gremlin says "Non-stop only" is mostly honest. Tick the checkbox "Non-stop only", assert there are 3 cards, and assert that zero cards contain "1 stop".', mr: 'gremlin म्हणतो "Non-stop only" बहुतेक प्रामाणिक आहे. "Non-stop only" checkbox वर tick करा, 3 cards आहेत हे assert करा, आणि "1 stop" असलेले शून्य cards आहेत हे assert करा.' },
          startUrl: FL,
          starter: `${H}test('non-stop only means non-stop', async ({ page }) => {
  await page.goto('${FL}');
  const cards = page.getByTestId('flight-card');
  // TODO: tick 'Non-stop only'
  // TODO: assert 3 cards
  // TODO: assert 0 cards with the text '1 stop'
});
`,
          solution: `${H}test('non-stop only means non-stop', async ({ page }) => {
  await page.goto('${FL}');
  const cards = page.getByTestId('flight-card');
  await page.getByLabel('Non-stop only').check();
  await expect(cards).toHaveCount(3);
  await expect(cards.filter({ hasText: '1 stop' })).toHaveCount(0);
});
`,
          minAssertions: 2,
          mustUse: [{ pattern: '\\.check\\(\\)', message: { en: 'Tick the box with check().', mr: 'box check() ने tick करा.' } }],
          mustCatch: [{ bug: 'nonstop-filter', label: { en: '"Non-stop only" still shows the 1-stop SH 305', mr: '"Non-stop only" अजूनही 1-stop SH 305 दाखवतो' } }],
          hints: [
            { en: 'The checkbox has a label: getByLabel("Non-stop only").check(). toHaveCount(0) is a fine way to say "none".', mr: 'checkbox ला label आहे: getByLabel("Non-stop only").check(). "एकही नाही" सांगायला toHaveCount(0) छान आहे.' },
            c("await page.getByLabel('Non-stop only').check();\nawait expect(cards).toHaveCount(3);"),
            c("await expect(cards.filter({ hasText: '1 stop' })).toHaveCount(0);"),
          ],
          successLine: { en: 'On the buggy build SH 305 sneaked in with its stop, and your test counted 4 instead of 3. Busted.', mr: 'buggy build वर SH 305 आपल्या stop सकट घुसली, आणि तुमच्या test ने 3 ऐवजी 4 मोजले. पकडलं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Theo wrote a quick check of the prices. Press Run. It prints [] and fails. Why?', mr: 'Theo ने किंमतींचा एक झटपट check लिहिला. Run दाबा. तो [] print करतो आणि fail होतो. का?' },
          playwrightSandbox: {
            startUrl: FL,
            code: `${H}test('five prices', async ({ page }) => {
  await page.goto('${FL}');
  const prices = await page.getByTestId('price').allTextContents();
  console.log(prices);
  expect(prices).toHaveLength(5);
});
`,
          },
          options: [
            { en: 'The price test id is wrong', mr: 'price चा test id चुकीचा आहे' },
            { en: 'toHaveLength only works on strings', mr: 'toHaveLength फक्त strings वर चालतो' },
            { en: 'SkyHop only has 0 flights on that date', mr: 'त्या तारखेला SkyHop वर 0 flights आहेत' },
            { en: 'allTextContents reads right away without waiting, while the results were still loading. Wait first with await expect(cards).toHaveCount(5)', mr: 'allTextContents वाट न पाहता लगेच वाचतो, आणि तेव्हा results अजून येत होते. आधी await expect(cards).toHaveCount(5) ने थांबा' },
          ],
          correct: [3],
          explain: { en: 'allTextContents is a read, not an assertion. It returned what was there at that moment: nothing, because "Searching flights..." was still on screen. Add await expect(page.getByTestId("flight-card")).toHaveCount(5) before reading, and the same line returns all five prices.', mr: 'allTextContents हे वाचन आहे, assertion नाही. त्या क्षणी जे होतं ते त्याने दिलं: काहीच नाही, कारण "Searching flights..." अजून screen वर होतं. वाचण्याआधी await expect(page.getByTestId("flight-card")).toHaveCount(5) जोडा, आणि तीच ओळ पाचही किंमती देईल.' },
          hints: [
            { en: 'What did the browser show at the moment the prices were read?', mr: 'किंमती वाचल्या त्या क्षणी browser काय दाखवत होता?' },
            { en: 'Which Playwright calls wait, and which ones just read?', mr: 'Playwright चे कोणते calls थांबतात, आणि कोणते फक्त वाचतात?' },
          ],
          successLine: { en: 'Wait with an assertion, then read. That order makes list checks reliable.', mr: 'आधी assertion ने थांबा, मग वाचा. या क्रमामुळे list checks भरवशाचे होतात.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Now the refund bug. Pick "Lowest price" in Sort by. Read all prices with allTextContents, turn them into numbers, and assert they equal a sorted copy. Also assert the first price is "₹3,600".', mr: 'आता refund चा bug. Sort by मध्ये "Lowest price" निवडा. allTextContents ने सगळ्या किंमती वाचा, त्यांच्या संख्या करा, आणि त्या sorted copy सारख्याच आहेत हे assert करा. पहिली किंमत "₹3,600" आहे हेही assert करा.' },
          startUrl: FL,
          starter: `${H}test('lowest price really comes first', async ({ page }) => {
  await page.goto('${FL}');
  const cards = page.getByTestId('flight-card');
  await expect(cards).toHaveCount(5);
  // TODO: pick 'Lowest price' in the Sort by dropdown
  // TODO: const texts = all the price texts
  // TODO: const prices = texts as numbers ('₹4,500' -> 4500)
  // TODO: expect prices to equal a sorted copy
  // TODO: assert the first price is '₹3,600'
});
`,
          solution: `${H}test('lowest price really comes first', async ({ page }) => {
  await page.goto('${FL}');
  const cards = page.getByTestId('flight-card');
  await expect(cards).toHaveCount(5);
  await page.getByLabel('Sort by').selectOption({ label: 'Lowest price' });
  const texts = await page.getByTestId('price').allTextContents();
  const prices = texts.map(t => Number(t.replace(/[^0-9]/g, '')));
  const sorted = [...prices].sort((a, b) => a - b);
  expect(prices).toEqual(sorted);
  await expect(page.getByTestId('price').first()).toHaveText('₹3,600');
});
`,
          minAssertions: 2,
          mustUse: [
            { pattern: 'allTextContents\\(', message: { en: 'Read every price with allTextContents().', mr: 'प्रत्येक किंमत allTextContents() ने वाचा.' } },
            { pattern: 'toEqual\\(', message: { en: 'Compare the prices with the sorted copy using toEqual.', mr: 'किंमतींची sorted copy शी तुलना toEqual ने करा.' } },
          ],
          mustCatch: [{ bug: 'sort-price', label: { en: '"Lowest price" sort does nothing', mr: '"Lowest price" sort काहीच करत नाही' } }],
          hints: [
            { en: 'Sorting happens on the page as soon as the option changes, so you can read right after selectOption. Strip everything that is not a digit, then Number(...).', mr: 'option बदलताच page वर sort होतं, म्हणून selectOption नंतर लगेच वाचता येतं. अंक नसलेलं सगळं काढा, मग Number(...).' },
            c("await page.getByLabel('Sort by').selectOption({ label: 'Lowest price' });\nconst texts = await page.getByTestId('price').allTextContents();"),
            c("const prices = texts.map(t => Number(t.replace(/[^0-9]/g, '')));\nconst sorted = [...prices].sort((a, b) => a - b);\nexpect(prices).toEqual(sorted);"),
            c("await page.getByLabel('Sort by').selectOption({ label: 'Lowest price' });\nconst texts = await page.getByTestId('price').allTextContents();\nconst prices = texts.map(t => Number(t.replace(/[^0-9]/g, '')));\nconst sorted = [...prices].sort((a, b) => a - b);\nexpect(prices).toEqual(sorted);\nawait expect(page.getByTestId('price').first()).toHaveText('₹3,600');"),
          ],
          successLine: { en: 'On the buggy build your test printed the real order, [4500, 3900, 5200, 4850, 3600], next to the sorted one. No more refunds for forty people.', mr: 'buggy build वर तुमच्या test ने खरा क्रम, [4500, 3900, 5200, 4850, 3600], sorted क्रमाशेजारी दाखवला. आता चाळीस लोकांना refund नाही.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'On the results page this line fails at once. Why?', mr: 'results page वर ही ओळ लगेच fail होते. का?' },
        code: "await page.getByRole('button', { name: 'Select' }).click();",
        options: [
          { en: 'Select buttons are disabled until you log in', mr: 'login करेपर्यंत Select बटणं disabled असतात' },
          { en: 'getByRole does not work on buttons', mr: 'getByRole buttons वर चालत नाही' },
          { en: 'It needs a waitForTimeout first', mr: 'त्याआधी waitForTimeout लागतो' },
          { en: 'Strict mode: five cards each have a Select button, so the locator matches 5 elements. Filter the card first', mr: 'strict mode: पाचही cards मध्ये Select बटण आहे, म्हणून locator 5 elements शी जुळतो. आधी card filter करा' },
        ],
        answer: 3,
        explain: { en: "cards.filter({ hasText: 'SH 201' }).getByRole('button', { name: 'Select' }) picks exactly one.", mr: "cards.filter({ hasText: 'SH 201' }).getByRole('button', { name: 'Select' }) नेमकं एक निवडतो." },
      },
      {
        q: { en: 'In departure order the cards are SH 201, SH 305, SH 412, SH 518, SH 623. Which card is cards.nth(1)?', mr: 'departure क्रमात cards SH 201, SH 305, SH 412, SH 518, SH 623 असे आहेत. cards.nth(1) कोणतं card?' },
        options: [
          { en: 'SH 305, because nth counts from 0', mr: 'SH 305, कारण nth 0 पासून मोजतो' },
          { en: 'SH 201', mr: 'SH 201' },
          { en: 'SH 412', mr: 'SH 412' },
          { en: 'All cards with the number 1 in them', mr: 'ज्यांच्यात 1 हा अंक आहे ते सगळे cards' },
        ],
        answer: 0,
        explain: { en: 'nth(0) is the first, nth(1) the second. first() is the same as nth(0).', mr: 'nth(0) पहिलं, nth(1) दुसरं. first() म्हणजेच nth(0).' },
      },
      {
        q: { en: 'With all five flights showing, what does this count?', mr: 'पाचही flights दिसत असताना हे काय मोजतं?' },
        code: "await expect(cards.filter({ has: page.getByText('Non-stop') })).toHaveCount(?);",
        options: [
          { en: '5, every card', mr: '5, प्रत्येक card' },
          { en: '2', mr: '2' },
          { en: '3: SH 201, SH 412 and SH 518 contain "Non-stop"', mr: '3: SH 201, SH 412 आणि SH 518 मध्ये "Non-stop" आहे' },
          { en: '0, because has needs a test id', mr: '0, कारण has ला test id लागतो' },
        ],
        answer: 2,
        explain: { en: 'filter({ has }) keeps the cards that contain a matching element. Three flights are non-stop, two have 1 stop.', mr: 'filter({ has }) ज्या cards मध्ये जुळणारा element आहे ते ठेवतो. तीन flights non-stop आहेत, दोन ना 1 stop आहे.' },
      },
      {
        q: { en: 'Why wait with toHaveCount before calling allTextContents?', mr: 'allTextContents बोलावण्याआधी toHaveCount ने का थांबायचं?' },
        options: [
          { en: 'allTextContents needs a number as input', mr: 'allTextContents ला input म्हणून संख्या लागते' },
          { en: 'allTextContents does not wait: called too early it returns [] while the results are loading', mr: 'allTextContents थांबत नाही: खूप लवकर बोलावला तर results येत असताना [] देतो' },
          { en: 'toHaveCount sorts the list', mr: 'toHaveCount list sort करतो' },
          { en: 'It is not needed; allTextContents waits 5 seconds', mr: 'त्याची गरज नाही; allTextContents 5 सेकंद थांबतो' },
        ],
        answer: 1,
        explain: { en: 'Reads like allTextContents, count and textContent happen once. Let an assertion do the waiting, then read.', mr: 'allTextContents, count आणि textContent सारखी वाचनं एकदाच होतात. वाट पाहण्याचं काम assertion ला करू द्या, मग वाचा.' },
      },
    ],
    recap: { line: { en: 'One locator for the whole list, then narrow it with filter({ hasText }), filter({ has }), first, last or nth. Wait with toHaveCount, read with allTextContents, and check a sort against a sorted copy.', mr: 'पूर्ण list साठी एक locator, मग तो filter({ hasText }), filter({ has }), first, last किंवा nth ने अरुंद करा. toHaveCount ने थांबा, allTextContents ने वाचा, आणि sort ची sorted copy शी तुलना करा.' }, icon: '🃏' },
  },

  // ───────────────────────── W1.6 Boss: Lost Luggage
  {
    id: 'pw1-6',
    code: 'W1.6',
    level: 'basic',
    isBoss: true,
    title: { en: 'Boss: Lost Luggage', mr: 'बॉस: हरवलेलं सामान' },
    skill: 'End-to-end release checks with Playwright',
    realLife: {
      place: 'postoffice',
      title: { en: 'The Diwali parcel that said "Delivered"', mr: '"Delivered" म्हणणारं दिवाळीचं पार्सल' },
      story: {
        en: 'Meera\'s mother sends a box of Diwali faraal to her brother in Nagpur: chakli, karanji, besan laddoo. Two days later the tracking SMS says "Delivered". Mama calls: nothing has come. Meera goes to the post office and asks to see the full scan history, line by line. Booked at Pune. Sorted at Pune. Unloaded at Wardha. The parcel got off at the wrong town, and the system simply showed a happy word. The status lied. The journey told the truth. From then on, Meera reads both.',
        mr: 'मीराची आई नागपूरला तिच्या भावाला दिवाळीच्या फराळाचा डबा पाठवते: चकली, करंजी, बेसन लाडू. दोन दिवसांनी tracking SMS येतो "Delivered". मामाचा फोन येतो: काहीच आलं नाही. मीरा पोस्ट ऑफिसमध्ये जाऊन पूर्ण scan history ओळीने दाखवायला सांगते. Pune ला book झालं. Pune ला sort झालं. Wardha ला उतरवलं. पार्सल चुकीच्या गावी उतरलं, आणि system ने फक्त एक छान शब्द दाखवला. status खोटं बोललं. प्रवासाने खरं सांगितलं. तेव्हापासून मीरा दोन्ही वाचते.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📦', label: 'Booked at Pune', mr: 'Pune ला book' },
          { icon: '🏷️', label: 'Sorted at Pune', mr: 'Pune ला sort' },
          { icon: '🚚', label: 'Unloaded at Wardha (wrong town)', mr: 'Wardha ला उतरवलं (चुकीचं गाव)' },
          { icon: '📱', label: 'SMS says "Delivered"', mr: 'SMS म्हणतो "Delivered"' },
        ],
        breakAt: 3,
        breakNote: { en: 'The status said Delivered. The last scan said Wardha. A good check reads both.', mr: 'status म्हणालं Delivered. शेवटचा scan म्हणाला Wardha. चांगला check दोन्ही वाचतो.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Yesterday twelve passengers from Pune waited an hour at belt 4 in Delhi. Their bags were in Mumbai. Our tracker told them "Ready at belt 4".', mr: 'काल Pune हून आलेले बारा प्रवासी Delhi ला belt 4 वर तासभर थांबले. त्यांच्या bags Mumbai ला होत्या. आपल्या tracker ने त्यांना सांगितलं "Ready at belt 4".' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> the bag is in mumbai. the screen says belt 4. who do you believe? ⌁ and i left a few more presents in booking. happy hunting.', mr: '>> bag mumbai ला आहे. screen म्हणतो belt 4. विश्वास कोणावर ठेवणार? ⌁ आणि booking मध्ये मी अजून काही भेटी ठेवल्यात. शोधा.' } },
        { who: 'theo', mood: 'worried', text: { en: 'The release goes out at 6 pm. The old Selenium suite takes forty minutes and fails at random. We cannot wait for it.', mr: 'release संध्याकाळी 6 वाजता जातं. जुना Selenium suite चाळीस मिनिटं घेतो आणि कधीही fail होतो. त्याची वाट पाहू शकत नाही.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Then we write the release checks in Playwright, now. Baggage tracker, booking total, confirmation. Everything from this week.', mr: 'मग release checks आत्ताच Playwright मध्ये लिहू. baggage tracker, booking total, confirmation. या आठवड्यातलं सगळं.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Boss round, {name}. Only two hints per step, so make every assertion count.', mr: 'बॉस round, {name}. प्रत्येक step ला फक्त दोन hints, म्हणून प्रत्येक assertion महत्त्वाचं करा.' } },
      ],
      problem: { en: 'SkyHop\'s screens say comforting things that are not true: a misrouted bag shows "Ready at belt 4", a total may be wrong, a confirmation may have no PNR. A release with these bugs sends passengers to the wrong belt and the wrong bill, and the slow, flaky Selenium checks cannot gate a 6 pm release.', mr: 'SkyHop चे screens दिलासा देणाऱ्या पण खोट्या गोष्टी सांगतात: चुकीच्या ठिकाणी गेलेली bag "Ready at belt 4" दाखवते, total चुकीचा असू शकतो, confirmation वर PNR नसू शकतो. या bugs सह release झालं तर प्रवासी चुकीच्या belt वर आणि चुकीच्या बिलासमोर जातात, आणि संथ, बेभरवशी Selenium checks संध्याकाळच्या 6 च्या release ला थांबवू शकत नाहीत.' },
      solution: { en: 'Fast Playwright tests that walk the passenger\'s path and check the evidence: the bag status against its journey, every line of the price summary, the PNR format and the itinerary. Actions from W1.3, web-first assertions from W1.4, filters from W1.5.', mr: 'प्रवाशाच्या मार्गाने चालणाऱ्या आणि पुरावा तपासणाऱ्या जलद Playwright tests: bag चं status त्याच्या प्रवासाशी, price summary ची प्रत्येक ओळ, PNR चा format आणि itinerary. W1.3 मधले actions, W1.4 मधले web-first assertions, W1.5 मधले filters.' },
    },
    lesson: [
      { en: 'A boss test walks the path a real passenger walks, from the first page to the last, and asserts at every stop where something important could go wrong. Do not stop at "the page opened". Check what the passenger will act on: the status that sends them to a belt, the total they will pay, the PNR they will show at the airport.', mr: 'बॉस test खरा प्रवासी ज्या मार्गाने जातो त्याच मार्गाने जाते, पहिल्या page पासून शेवटच्या पर्यंत, आणि जिथे काही महत्त्वाचं बिघडू शकतं त्या प्रत्येक थांब्यावर assert करते. "page उघडलं" इथे थांबू नका. प्रवासी ज्यावर कृती करेल ते तपासा: त्याला belt कडे पाठवणारं status, तो भरणार तो total, विमानतळावर दाखवणार तो PNR.' },
      { en: 'Check the claim against the evidence. The tracker\'s status is a claim. The ordered list "Bag journey" is the evidence. A bag whose last scan is "Unloaded at Mumbai" cannot be "Ready at belt 4" in Delhi. Likewise, the total is a claim and the price lines are the evidence: fare + seat fee + meal + insurance - discount.', mr: 'दाव्याची पुराव्याशी तुलना करा. tracker चं status हा दावा आहे. "Bag journey" ही क्रमवार list हा पुरावा आहे. ज्या bag चा शेवटचा scan "Unloaded at Mumbai" आहे ती Delhi मध्ये "Ready at belt 4" असू शकत नाही. तसंच total हा दावा आणि price च्या ओळी हा पुरावा: fare + seat fee + meal + insurance - discount.' },
      { en: 'Your toolkit: getByLabel, getByRole, getByTestId and filter to find things; fill, press, click, check and selectOption to act; toHaveText, toContainText, toHaveCount, toHaveURL and regular expressions to check. No sleeps. And when a value changes on every run, like a new PNR, check its shape with a regex instead of one exact value.', mr: 'तुमची साधनं: शोधायला getByLabel, getByRole, getByTestId आणि filter; काम करायला fill, press, click, check आणि selectOption; तपासायला toHaveText, toContainText, toHaveCount, toHaveURL आणि regular expressions. sleep नाही. आणि नवीन PNR सारखी प्रत्येक run ला बदलणारी value असेल, तर एका नेमक्या value ऐवजी regex ने तिचा आकार तपासा.' },
    ],
    syntax: {
      template: `await page.goto('/baggage');
const tag = page.getByLabel('Bag tag number');
await tag.fill('SH771205');
await tag.press('Enter');
await expect(page.getByTestId('bag-status')).toHaveText('Misrouted to Mumbai. We will deliver it to you.');
const journey = page.getByRole('list', { name: 'Bag journey' }).getByRole('listitem');
await expect(journey.last()).toContainText('Unloaded at Mumbai');`,
      parts: [
        { code: "getByTestId('bag-status')", means: { en: 'the claim: what the screen tells the passenger', mr: 'दावा: screen प्रवाशाला काय सांगतो' } },
        { code: "getByRole('list', { name: 'Bag journey' })", means: { en: 'the evidence: the ordered list of scans', mr: 'पुरावा: scans ची क्रमवार list' } },
        { code: "getByRole('listitem').last()", means: { en: 'the latest scan, where the bag really is', mr: 'शेवटचा scan, bag खरी कुठे आहे' } },
        { code: "toHaveText('₹5,749')", means: { en: 'money is always checked exactly', mr: 'पैसे नेहमी नेमके तपासायचे' } },
        { code: 'toHaveText(/^SKY[A-Z0-9]{3}$/)', means: { en: 'a value that changes each run: check its shape', mr: 'प्रत्येक run ला बदलणारी value: तिचा आकार तपासा' } },
      ],
      example: [
        { code: "await page.goto('/baggage');", note: { en: 'Meera walks into the post office', mr: 'मीरा पोस्ट ऑफिसमध्ये जाते' } },
        { code: "await page.getByLabel('Bag tag number').fill('SH771205');", note: { en: 'gives the tracking number', mr: 'tracking number देते' } },
        { code: "await page.getByLabel('Bag tag number').press('Enter');", note: { en: 'asks the clerk to look it up', mr: 'clerk ला शोधायला सांगते' } },
        { code: "await expect(page.getByTestId('bag-status')).toContainText('Misrouted');", note: { en: 'reads the status, the claim', mr: 'status वाचते, म्हणजे दावा' } },
        { code: "await expect(page.getByRole('listitem').last()).toContainText('Mumbai');", note: { en: 'and reads the last scan, the evidence', mr: 'आणि शेवटचा scan वाचते, म्हणजे पुरावा' } },
      ],
      pitfall: { en: 'Do not check only the happy bag. SH482913 really is at belt 4, so a test that tracks only that bag stays green while every misrouted passenger is sent to the wrong belt. Track the bag that went wrong.', mr: 'फक्त सुखरूप bag तपासू नका. SH482913 खरंच belt 4 वर आहे, म्हणून फक्त तीच bag track करणारी test हिरवी राहते आणि चुकीच्या ठिकाणी गेलेल्या प्रत्येक प्रवाशाला चुकीच्या belt कडे पाठवलं जातं. जी bag चुकली तिला track करा.' },
    },
    practice: {
      intro: { en: 'The release gate for 6 pm. Four checks, each one a bug the Gremlin planted somewhere. Only two hints per step in a boss level, so read the prompt carefully and check the browser while you build.', mr: 'संध्याकाळच्या 6 च्या release चं gate. चार checks, प्रत्येक म्हणजे gremlin ने कुठेतरी लपवलेला bug. बॉस level मध्ये प्रत्येक step ला फक्त दोन hints, म्हणून prompt नीट वाचा आणि test लिहिताना browser पाहत राहा.' },
      steps: [
        {
          kind: 'playwright',
          prompt: { en: 'Rohan\'s bag SH771205 was loaded onto the wrong plane. On /baggage, fill the tag and press Enter. Assert bag-status has the text "Misrouted to Mumbai. We will deliver it to you.", the "Bag journey" list has 3 items, and the last item contains "Unloaded at Mumbai". Then track Asha\'s bag SH482913 with the Track bag button and assert its status is "Ready at belt 4".', mr: 'Rohan ची bag SH771205 चुकीच्या विमानात चढवली गेली. /baggage वर tag भरा आणि Enter दाबा. bag-status चा मजकूर "Misrouted to Mumbai. We will deliver it to you." आहे, "Bag journey" list मध्ये 3 items आहेत, आणि शेवटच्या item मध्ये "Unloaded at Mumbai" आहे हे assert करा. मग Asha ची bag SH482913 Track bag बटणाने track करा आणि तिचं status "Ready at belt 4" आहे हे assert करा.' },
          startUrl: '/baggage',
          starter: `${H}test('a misrouted bag says so', async ({ page }) => {
  await page.goto('/baggage');
  const tag = page.getByLabel('Bag tag number');
  // TODO: fill SH771205 and press Enter
  // TODO: assert the bag-status text
  // TODO: assert the 'Bag journey' list has 3 items, and the last contains 'Unloaded at Mumbai'
  // TODO: fill SH482913, click 'Track bag', assert 'Ready at belt 4'
});
`,
          solution: `${H}test('a misrouted bag says so', async ({ page }) => {
  await page.goto('/baggage');
  const tag = page.getByLabel('Bag tag number');
  await tag.fill('SH771205');
  await tag.press('Enter');
  await expect(page.getByTestId('bag-status')).toHaveText('Misrouted to Mumbai. We will deliver it to you.');
  const journey = page.getByRole('list', { name: 'Bag journey' }).getByRole('listitem');
  await expect(journey).toHaveCount(3);
  await expect(journey.last()).toContainText('Unloaded at Mumbai');
  await tag.fill('SH482913');
  await page.getByRole('button', { name: 'Track bag' }).click();
  await expect(page.getByTestId('bag-status')).toHaveText('Ready at belt 4');
});
`,
          minAssertions: 4,
          noWaitForTimeout: true,
          mustUse: [
            { pattern: "press\\(\\s*'Enter'\\s*\\)", message: { en: "Track the first bag with press('Enter').", mr: "पहिली bag press('Enter') ने track करा." } },
            { pattern: 'last\\(\\)', message: { en: 'Check the latest scan with last().', mr: 'शेवटचा scan last() ने तपासा.' } },
          ],
          mustCatch: [{ bug: 'bag-status', label: { en: 'A misrouted bag says "Ready at belt 4"', mr: 'चुकीच्या ठिकाणी गेलेली bag "Ready at belt 4" म्हणते' } }],
          hints: [
            { en: "The journey is an ordered list named \"Bag journey\": page.getByRole('list', { name: 'Bag journey' }).getByRole('listitem'). Store it in a const, then toHaveCount(3) and .last() with toContainText. The status is getByTestId('bag-status'). No sleeps: every expect waits for the 0.6 s lookup.", mr: "journey ही \"Bag journey\" नावाची क्रमवार list आहे: page.getByRole('list', { name: 'Bag journey' }).getByRole('listitem'). ती एका const मध्ये ठेवा, मग toHaveCount(3) आणि toContainText सह .last(). status म्हणजे getByTestId('bag-status'). sleep नको: प्रत्येक expect 0.6 सेकंदांच्या शोधासाठी थांबतो." },
            c("await tag.fill('SH771205');\nawait tag.press('Enter');\nawait expect(page.getByTestId('bag-status')).toHaveText('Misrouted to Mumbai. We will deliver it to you.');\nconst journey = page.getByRole('list', { name: 'Bag journey' }).getByRole('listitem');\nawait expect(journey).toHaveCount(3);\nawait expect(journey.last()).toContainText('Unloaded at Mumbai');\nawait tag.fill('SH482913');\nawait page.getByRole('button', { name: 'Track bag' }).click();\nawait expect(page.getByTestId('bag-status')).toHaveText('Ready at belt 4');"),
            { en: 'fill replaces the old tag, so the same tag locator works for the second bag.', mr: 'fill जुना tag बदलतो, म्हणून दुसऱ्या bag साठी तोच tag locator चालतो.' },
          ],
          successLine: { en: 'On the buggy build the screen said belt 4 while the journey ended in Mumbai, and your test refused to believe it. Twelve passengers will go to the help desk, not to belt 4.', mr: 'buggy build वर screen belt 4 म्हणत होता आणि प्रवास Mumbai ला संपला होता, आणि तुमच्या test ने त्यावर विश्वास ठेवला नाही. बारा प्रवासी belt 4 कडे नाही, help desk कडे जातील.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'The tracker must also handle mistakes. Write two tests on /baggage. Test 1: tag "SH12" shows the alert "A bag tag is SH followed by 6 digits". Test 2: tag "SH000000" shows the alert "We could not find bag SH000000". In both tests, assert there is no bag-status on the page (toHaveCount(0)).', mr: 'tracker ने चुकाही हाताळायला हव्यात. /baggage वर दोन tests लिहा. Test 1: tag "SH12" दिल्यावर alert "A bag tag is SH followed by 6 digits" दिसतो. Test 2: tag "SH000000" दिल्यावर alert "We could not find bag SH000000" दिसतो. दोन्ही tests मध्ये page वर bag-status नाही हे assert करा (toHaveCount(0)).' },
          startUrl: '/baggage',
          starter: `${H}test('a short tag is refused', async ({ page }) => {
  await page.goto('/baggage');
  // TODO: track 'SH12', assert the alert text and no bag-status
});

// TODO: a second test for the unknown tag 'SH000000'
`,
          solution: `${H}test('a short tag is refused', async ({ page }) => {
  await page.goto('/baggage');
  await page.getByLabel('Bag tag number').fill('SH12');
  await page.getByRole('button', { name: 'Track bag' }).click();
  await expect(page.getByRole('alert')).toHaveText('A bag tag is SH followed by 6 digits');
  await expect(page.getByTestId('bag-status')).toHaveCount(0);
});

test('an unknown tag is not found', async ({ page }) => {
  await page.goto('/baggage');
  await page.getByLabel('Bag tag number').fill('SH000000');
  await page.getByLabel('Bag tag number').press('Enter');
  await expect(page.getByRole('alert')).toHaveText('We could not find bag SH000000');
  await expect(page.getByTestId('bag-status')).toHaveCount(0);
});
`,
          minTests: 2,
          minAssertions: 4,
          noWaitForTimeout: true,
          mustUse: [{ pattern: "getByRole\\(\\s*'alert'", message: { en: "Find the error with getByRole('alert').", mr: "error getByRole('alert') ने शोधा." } }],
          hints: [
            { en: "Each test starts on a blank page, so each one needs its own page.goto('/baggage'). The error lives in getByRole('alert'). Check it with toHaveText, and check the missing status with getByTestId('bag-status') and toHaveCount(0).", mr: "प्रत्येक test रिकाम्या page वरून सुरू होते, म्हणून प्रत्येकीला स्वतःचा page.goto('/baggage') लागतो. error getByRole('alert') मध्ये असतो. तो toHaveText ने तपासा, आणि status नाही हे getByTestId('bag-status') आणि toHaveCount(0) ने." },
            c("test('an unknown tag is not found', async ({ page }) => {\n  await page.goto('/baggage');\n  await page.getByLabel('Bag tag number').fill('SH000000');\n  await page.getByLabel('Bag tag number').press('Enter');\n  await expect(page.getByRole('alert')).toHaveText('We could not find bag SH000000');\n  await expect(page.getByTestId('bag-status')).toHaveCount(0);\n});"),
            { en: 'Test 1 has the same shape with "SH12" and the format message.', mr: 'Test 1 ची रचना तीच, "SH12" आणि format च्या message सह.' },
          ],
          successLine: { en: 'Wrong format and unknown bag both get a clear message, and no fake status. Passengers who mistype are not left guessing.', mr: 'चुकीचा format आणि अनोळखी bag, दोन्हींना स्पष्ट message, आणि खोटं status नाही. चुकीचं टाइप करणारे प्रवासी अंदाज लावत बसत नाहीत.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Book from the very start. On the home page fill the date 2026-12-20 and search (Pune to Delhi is the default). Select the SH 412 card, pick Seat 14C and Continue. Fill Full name "Asha Patil", Email "asha@skyhop.test", Phone "9822012345", pick "Veg thali", tick "Add travel insurance" and Continue to payment. Assert the price lines: fare "₹5,200", meal "₹250", insurance "₹299", total "₹5,749", and the button "Pay ₹5,749" is visible.', mr: 'अगदी सुरुवातीपासून book करा. home page वर तारीख 2026-12-20 भरा आणि search करा (Pune ते Delhi आधीच निवडलेलं आहे). SH 412 चं card निवडा, Seat 14C निवडा आणि Continue करा. Full name "Asha Patil", Email "asha@skyhop.test", Phone "9822012345" भरा, "Veg thali" निवडा, "Add travel insurance" वर tick करा आणि Continue to payment करा. price च्या ओळी assert करा: fare "₹5,200", meal "₹250", insurance "₹299", total "₹5,749", आणि "Pay ₹5,749" बटण दिसतं.' },
          startUrl: '/',
          starter: `${H}test('the total adds up', async ({ page }) => {
  await page.goto('/');
  // TODO: fill the date and search
  // TODO: select the SH 412 card
  // TODO: pick Seat 14C and Continue
  // TODO: passenger details, Veg thali, insurance, Continue to payment
  // TODO: assert fare, meal, insurance, total and the Pay button
});
`,
          solution: `${H}test('the total adds up', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Departure date').fill('2026-12-20');
  await page.getByRole('button', { name: 'Search flights' }).click();
  const card = page.getByTestId('flight-card').filter({ hasText: 'SH 412' });
  await card.getByRole('button', { name: 'Select' }).click();
  await page.getByRole('button', { name: 'Seat 14C' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Full name').fill('Asha Patil');
  await page.getByLabel('Email').fill('asha@skyhop.test');
  await page.getByLabel('Phone').fill('9822012345');
  await page.getByRole('radio', { name: 'Veg thali' }).check();
  await page.getByRole('checkbox', { name: 'Add travel insurance' }).check();
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(page.getByTestId('fare')).toHaveText('₹5,200');
  await expect(page.getByTestId('meal')).toHaveText('₹250');
  await expect(page.getByTestId('insurance')).toHaveText('₹299');
  await expect(page.getByTestId('total')).toHaveText('₹5,749');
  await expect(page.getByRole('button', { name: 'Pay ₹5,749' })).toBeVisible();
});
`,
          minAssertions: 5,
          noWaitForTimeout: true,
          mustUse: [{ pattern: 'filter\\(', message: { en: "Pick the SH 412 card with filter({ hasText: 'SH 412' }).", mr: "SH 412 चं card filter({ hasText: 'SH 412' }) ने निवडा." } }],
          mustCatch: [{ bug: 'total-wrong', label: { en: 'The total counts insurance twice', mr: 'total मध्ये insurance दोनदा मोजला जातो' } }],
          hints: [
            { en: "Path: date + Search flights, then page.getByTestId('flight-card').filter({ hasText: 'SH 412' }).getByRole('button', { name: 'Select' }), then getByRole('button', { name: 'Seat 14C' }) and Continue. On the passenger page use getByLabel for the boxes and getByRole('radio' / 'checkbox') with check(). The price lines have test ids fare, meal, insurance, total. 5200 + 250 + 299 = 5749.", mr: "मार्ग: तारीख + Search flights, मग page.getByTestId('flight-card').filter({ hasText: 'SH 412' }).getByRole('button', { name: 'Select' }), मग getByRole('button', { name: 'Seat 14C' }) आणि Continue. passenger page वर boxes साठी getByLabel आणि check() सह getByRole('radio' / 'checkbox'). price च्या ओळींचे test ids fare, meal, insurance, total. 5200 + 250 + 299 = 5749." },
            c("await page.getByLabel('Departure date').fill('2026-12-20');\nawait page.getByRole('button', { name: 'Search flights' }).click();\nconst card = page.getByTestId('flight-card').filter({ hasText: 'SH 412' });\nawait card.getByRole('button', { name: 'Select' }).click();\nawait page.getByRole('button', { name: 'Seat 14C' }).click();\nawait page.getByRole('button', { name: 'Continue' }).click();\nawait page.getByLabel('Full name').fill('Asha Patil');\nawait page.getByLabel('Email').fill('asha@skyhop.test');\nawait page.getByLabel('Phone').fill('9822012345');\nawait page.getByRole('radio', { name: 'Veg thali' }).check();\nawait page.getByRole('checkbox', { name: 'Add travel insurance' }).check();\nawait page.getByRole('button', { name: 'Continue to payment' }).click();\nawait expect(page.getByTestId('total')).toHaveText('₹5,749');"),
            { en: 'Add the fare, meal and insurance lines and the Pay button the same way.', mr: 'fare, meal आणि insurance च्या ओळी आणि Pay बटण त्याच पद्धतीने जोडा.' },
          ],
          successLine: { en: 'On the buggy build the total said ₹6,048: insurance charged twice. Your line-by-line check caught ₹299 per passenger before a single rupee was taken.', mr: 'buggy build वर total ₹6,048 होता: insurance दोनदा लावला. तुमच्या ओळ-न-ओळ check ने एकही रुपया घेण्याआधी प्रत्येक प्रवाशाचे ₹299 पकडले.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Last gate: the confirmation. Open /payment?demo=1 and click the button "Pay ₹4,500". Assert the URL is "/confirmation", the heading "Booking confirmed" is visible, the pnr has the shape SKY plus 3 letters or digits (use a regex), itinerary is "SH 201 · Pune to Delhi · 2026-12-20" and paid is "₹4,500".', mr: 'शेवटचं gate: confirmation. /payment?demo=1 उघडा आणि "Pay ₹4,500" बटणावर click करा. URL "/confirmation" आहे, "Booking confirmed" heading दिसतं, pnr चा आकार SKY आणि पुढे 3 अक्षरं किंवा अंक आहे (regex वापरा), itinerary "SH 201 · Pune to Delhi · 2026-12-20" आहे आणि paid "₹4,500" आहे हे assert करा.' },
          startUrl: '/payment?demo=1',
          starter: `${H}test('payment gives a real PNR', async ({ page }) => {
  await page.goto('/payment?demo=1');
  // TODO: click 'Pay ₹4,500'
  // TODO: assert the URL and the heading
  // TODO: assert the PNR shape with a regex, the itinerary and the amount paid
});
`,
          solution: `${H}test('payment gives a real PNR', async ({ page }) => {
  await page.goto('/payment?demo=1');
  await page.getByRole('button', { name: 'Pay ₹4,500' }).click();
  await expect(page).toHaveURL('/confirmation');
  await expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeVisible();
  await expect(page.getByTestId('pnr')).toHaveText(/^SKY[A-Z0-9]{3}$/);
  await expect(page.getByTestId('itinerary')).toHaveText('SH 201 · Pune to Delhi · 2026-12-20');
  await expect(page.getByTestId('paid')).toHaveText('₹4,500');
});
`,
          minAssertions: 5,
          noWaitForTimeout: true,
          mustUse: [
            { pattern: 'toHaveURL\\(', message: { en: "Check the address with expect(page).toHaveURL('/confirmation').", mr: "पत्ता expect(page).toHaveURL('/confirmation') ने तपासा." } },
            { pattern: 'toHaveText\\(\\s*/', message: { en: 'Check the PNR shape with a regular expression: toHaveText(/^SKY[A-Z0-9]{3}$/).', mr: 'PNR चा आकार regular expression ने तपासा: toHaveText(/^SKY[A-Z0-9]{3}$/).' } },
          ],
          verify: [{ check: (s) => s.lastBooking !== null, message: { en: 'No booking was made. Click the Pay button and wait for the confirmation.', mr: 'booking झालं नाही. Pay बटणावर click करा आणि confirmation ची वाट पाहा.' } }],
          mustCatch: [{ bug: 'pnr-missing', label: { en: 'The confirmation shows an empty PNR', mr: 'confirmation वर PNR रिकामा दिसतो' } }],
          hints: [
            { en: 'Payment takes about a second ("Processing payment..."), and your assertions wait for it. The PNR changes on every booking, so check its shape: toHaveText(/^SKY[A-Z0-9]{3}$/). An empty PNR fails that, any real one passes.', mr: 'payment ला साधारण एक सेकंद लागतो ("Processing payment..."), आणि तुमचे assertions त्याची वाट पाहतात. प्रत्येक booking ला PNR बदलतो, म्हणून त्याचा आकार तपासा: toHaveText(/^SKY[A-Z0-9]{3}$/). रिकामा PNR त्यात fail होतो, कोणताही खरा pass होतो.' },
            c("await page.getByRole('button', { name: 'Pay ₹4,500' }).click();\nawait expect(page).toHaveURL('/confirmation');\nawait expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeVisible();\nawait expect(page.getByTestId('pnr')).toHaveText(/^SKY[A-Z0-9]{3}$/);\nawait expect(page.getByTestId('itinerary')).toHaveText('SH 201 · Pune to Delhi · 2026-12-20');\nawait expect(page.getByTestId('paid')).toHaveText('₹4,500');"),
            { en: 'The heading is an h1, so getByRole("heading", { name: "Booking confirmed" }) finds it.', mr: 'heading हा h1 आहे, म्हणून getByRole("heading", { name: "Booking confirmed" }) तो शोधतो.' },
          ],
          successLine: { en: 'On the buggy build the confirmation said "Your PNR is" and then nothing. Your regex said no. Every passenger leaves with a PNR they can check in with.', mr: 'buggy build वर confirmation म्हणालं "Your PNR is" आणि पुढे काहीच नाही. तुमच्या regex ने नाही म्हटलं. प्रत्येक प्रवासी check-in करता येईल असा PNR घेऊन जातो.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'The tracker shows status "Ready at belt 4", but the last scan in the journey is "Unloaded at Mumbai". Which check catches this bug for bag SH771205?', mr: 'tracker status "Ready at belt 4" दाखवतो, पण प्रवासातला शेवटचा scan "Unloaded at Mumbai" आहे. bag SH771205 साठी कोणता check हा bug पकडतो?' },
        options: [
          "await expect(page.getByTestId('bag-status')).toBeVisible();",
          "await expect(page.getByRole('list', { name: 'Bag journey' })).toBeVisible();",
          "await expect(page.getByTestId('bag-status')).toHaveText('Misrouted to Mumbai. We will deliver it to you.');",
          "await expect(page).toHaveTitle('Track baggage | SkyHop');",
        ],
        answer: 2,
        explain: { en: 'Only a check on the status text compares the claim with what is true. Visible elements and the right title are all still there on the buggy build.', mr: 'फक्त status च्या मजकुरावरचा check दाव्याची सत्याशी तुलना करतो. buggy build वरही elements दिसतात आणि title बरोबरच असतो.' },
      },
      {
        q: { en: 'Which PNR check fails on an empty PNR, but passes for any new booking (SKY4Q7, SKY4Q8...)?', mr: 'कोणता PNR check रिकाम्या PNR वर fail होतो, पण कोणत्याही नवीन booking साठी (SKY4Q7, SKY4Q8...) pass होतो?' },
        options: [
          "await expect(page.getByTestId('pnr')).toHaveText('SKY4Q7');",
          "await expect(page.getByTestId('pnr')).toHaveText(/^SKY[A-Z0-9]{3}$/);",
          "await expect(page.getByTestId('pnr')).toBeAttached();",
          "await expect(page.getByTestId('pnr')).toHaveCount(1);",
        ],
        answer: 1,
        explain: { en: 'The regex checks the shape. An exact "SKY4Q7" breaks as soon as another test books first, and an empty element is still attached and still counts as 1.', mr: 'regex आकार तपासतो. नेमका "SKY4Q7" दुसऱ्या test ने आधी booking केलं की मोडतो, आणि रिकामा element तरीही attached असतो आणि 1 म्हणूनच मोजला जातो.' },
      },
      {
        q: { en: 'SH 412 (₹5,200), Veg thali (₹250) and insurance (₹299), no seat fee, no coupon. What total should your test expect?', mr: 'SH 412 (₹5,200), Veg thali (₹250) आणि insurance (₹299), seat fee नाही, coupon नाही. तुमच्या test ने कोणता total अपेक्षित धरावा?' },
        options: [
          { en: '₹6,048', mr: '₹6,048' },
          { en: '₹5,450', mr: '₹5,450' },
          { en: '₹5,499', mr: '₹5,499' },
          { en: '₹5,749', mr: '₹5,749' },
        ],
        answer: 3,
        explain: { en: '5200 + 250 + 299 = 5749. ₹6,048 is what the buggy build showed: the insurance counted twice. Work out the expected number yourself; never copy it from the page you are testing.', mr: '5200 + 250 + 299 = 5749. ₹6,048 हे buggy build ने दाखवलं: insurance दोनदा मोजला. अपेक्षित संख्या स्वतः काढा; जे page तपासताय त्यावरून ती कधीच copy करू नका.' },
      },
      {
        q: { en: 'In your boss booking test, the click on Continue at the seat page fails with "element is not enabled". What is the most likely cause?', mr: 'तुमच्या बॉस booking test मध्ये seat page वरच्या Continue च्या click ला "element is not enabled" येतं. सगळ्यात संभाव्य कारण काय?' },
        options: [
          { en: 'No seat was picked: the seat click used a taken seat or a wrong name, so Continue stayed disabled', mr: 'seat निवडली गेली नाही: seat च्या click ने घेतलेली seat किंवा चुकीचं नाव वापरलं, म्हणून Continue disabled राहिलं' },
          { en: 'The page needs a waitForTimeout before Continue', mr: 'Continue आधी page ला waitForTimeout लागतो' },
          { en: 'Continue is a link, so click does not work on it', mr: 'Continue हा link आहे, म्हणून त्यावर click चालत नाही' },
          { en: 'The flight was sold out', mr: 'flight पूर्ण भरली होती' },
        ],
        answer: 0,
        explain: { en: 'Continue unlocks only when enough seats are picked. A taken seat like "Seat 14B, taken" is disabled, so clicking it waits and fails, or picks nothing. Read the call log, then check the seat step.', mr: 'पुरेशा seats निवडल्या तरच Continue उघडतं. "Seat 14B, taken" सारखी घेतलेली seat disabled असते, म्हणून तिच्यावरचा click थांबतो आणि fail होतो, किंवा काहीच निवडलं जात नाही. call log वाचा, मग seat ची पायरी तपासा.' },
      },
    ],
    recap: { line: { en: 'Walk the passenger\'s path and check the claim against the evidence: the bag status against its journey, the total against its lines, the PNR against its shape. Fast, no sleeps, and every assertion catches a real bug.', mr: 'प्रवाशाच्या मार्गाने चाला आणि दाव्याची पुराव्याशी तुलना करा: bag चं status त्याच्या प्रवासाशी, total त्याच्या ओळींशी, PNR त्याच्या आकाराशी. जलद, sleep नाही, आणि प्रत्येक assertion खरा bug पकडतो.' }, icon: '🧳' },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: '>> my belt 4 trick. caught in one run. and the double insurance. and the empty pnr. ⌁⌁', mr: '>> माझी belt 4 ची युक्ती. एका run मध्ये पकडली. आणि दुहेरी insurance. आणि रिकामा pnr. ⌁⌁' } },
      { who: 'gremlin', mood: 'smug', text: { en: '>> fine. next time i hide in the network. let us see you test a server that lies. ⌁', mr: '>> ठीक आहे. पुढच्या वेळी मी network मध्ये लपेन. खोटं बोलणारा server तुम्ही कसा तपासता ते पाहू. ⌁' } },
      { who: 'sam', mood: 'happy', text: { en: 'Release went out at 5:40 pm, twenty minutes early. The tracker tells the truth again, and nobody is waiting at belt 4 for a bag in Mumbai.', mr: 'release संध्याकाळी 5:40 ला गेलं, वीस मिनिटं आधी. tracker पुन्हा खरं सांगतो, आणि Mumbai मधल्या bag साठी belt 4 वर कोणीच थांबलेलं नाही.' } },
      { who: 'theo', mood: 'happy', text: { en: 'Your whole suite ran in under a minute. I am retiring the old Selenium job tonight.', mr: 'तुमचा पूर्ण suite एका मिनिटाच्या आत चालला. जुना Selenium job मी आज रात्री निवृत्त करतोय.' } },
      { who: 'rex', mood: 'happy', text: { en: 'Foundations done, {name}. Next we organise all this: hooks, page objects, and mocking that lying network.', mr: 'पाया पूर्ण, {name}. पुढे आपण हे सगळं नीट रचू: hooks, page objects, आणि त्या खोटं बोलणाऱ्या network चं mocking.' } },
      { who: 'meera', mood: 'happy', text: { en: 'Rank up, {name}: Automation Engineer. SkyHop\'s bags are safe, and so is the release.', mr: 'नवीन रँक, {name}: Automation Engineer. SkyHop च्या bags सुरक्षित, आणि release सुद्धा.' } },
    ],
  },
]
