import type { Lesson } from './types.ts'

// Playwright 2 (part A): hooks, describe and page objects; watching and mocking the network; API testing with request, and UI plus API together.

const SKY = 'https://skyhop.test'
const IMPORT = "import { test, expect } from '@playwright/test';\n\n"
const IMPORT_TYPES = "import { test, expect, type Page, type Locator } from '@playwright/test';\n\n"
const FLIGHTS = '/flights?from=PNQ&to=DEL&date=2026-12-20&pax=1'
const ERROR_TEXT = 'We could not load flights. Please try again.'

const INDEPENDENT_DEMO = `${IMPORT}test('search opens the results', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Departure date').fill('2026-12-20');
  await page.getByRole('button', { name: 'Search flights' }).click();
  await expect(page.getByTestId('result-count')).toHaveText('5 flights');
});

test('non-stop filter keeps 3 flights', async ({ page }) => {
  // "the first test already opened the results, so I can carry on"
  await page.getByLabel('Non-stop only').check();
  await expect(page.getByTestId('flight-card')).toHaveCount(3);
});`

const ROUTE_TOO_LATE = `${IMPORT}test('a server error shows a clear message', async ({ page }) => {
  await page.goto('${FLIGHTS}');
  await page.route('**/api/flights*', route => route.fulfill({ status: 500, json: { error: 'Server down' } }));
  await expect(page.getByRole('alert')).toHaveText('${ERROR_TEXT}');
});`

const SEARCH_PAGE_CLASS = `class SearchPage {
  readonly from: Locator;
  readonly to: Locator;
  readonly date: Locator;
  readonly searchButton: Locator;

  constructor(private page: Page) {
    this.from = page.getByLabel('From');
    this.to = page.getByLabel('To');
    this.date = page.getByLabel('Departure date');
    this.searchButton = page.getByRole('button', { name: 'Search flights' });
  }

  async open() {
    await this.page.goto('/');
  }
`

const SEARCH_TESTS = `
test.describe('search', () => {
  let searchPage: SearchPage;

  test.beforeEach(async ({ page }) => {
    searchPage = new SearchPage(page);
    await searchPage.open();
  });

  test('Pune to Goa shows flights', async ({ page }) => {
    await searchPage.search('PNQ', 'GOI', '2026-12-20');
    await expect(page).toHaveTitle('Flights PNQ to GOI | SkyHop');
    await expect(page.getByTestId('result-count')).toHaveText('5 flights');
  });

  test('the same city twice is refused', async ({ page }) => {
    await searchPage.search('PNQ', 'PNQ', '2026-12-20');
    await expect(page.getByRole('alert')).toHaveText('From and To must be different cities');
  });
});`

const SEAT_TESTS = `
test.describe('seat map', () => {
  let seats: SeatPage;

  test.beforeEach(async ({ page }) => {
    seats = new SeatPage(page);
    await page.goto('/seats?demo=1');
  });

  test('picking 12C selects it and unlocks Continue', async () => {
    await expect(seats.continueButton).toBeDisabled();
    await seats.pickSeat('12C');
    await expect(seats.selected).toHaveText('Selected: 12C');
    await expect(seats.continueButton).toBeEnabled();
  });

  test('a taken seat cannot be picked', async () => {
    await expect(seats.seat('10A')).toBeDisabled();
  });

  test('extra legroom costs 600 rupees', async () => {
    await seats.pickSeat('10C');
    await expect(seats.seatFee).toHaveText('Seat fee: ₹600');
  });
});`

const BOOKING_DATA = `{
    flightId: 'SH412', from: 'PNQ', to: 'DEL', date: '2026-12-21', pax: 1, seats: ['11A'],
    passenger: { name: 'Asha Patil', email: 'asha@skyhop.test', phone: '9822012345' },
  }`

export const pwProLessonsA: Lesson[] = [
  // ───────────────────────── W2.1 Hooks, describe and the Page Object Model
  {
    id: 'pw2-1',
    code: 'W2.1',
    level: 'intermediate',
    title: { en: 'Hooks, describe and the Page Object Model', mr: 'Hooks, describe आणि Page Object Model' },
    skill: 'test.describe, test.beforeEach, independent tests, page object classes, test.use({ storageState })',
    realLife: {
      place: 'wedding',
      title: { en: 'Aunty\'s wedding caterers', mr: 'मावशीचे लग्नातले caterers' },
      story: {
        en: 'Meera\'s aunt runs Annapurna Caterers in Nashik. At a wedding, the food is grouped into counters: sweets, main course, drinks. Before every single plate, the same small ritual happens: a fresh banana leaf, a pinch of salt, a glass of water. Nobody serves the next guest on the last guest\'s leaf. The servers do not need to know where the oil tins or the gas cylinders are kept. They just tell Shankar kaka, the head cook, "two puris and one basundi", and he knows how. And the family\'s close relatives wear a pass, so they walk straight in without the gate check every time.',
        mr: 'मीराची मावशी नाशिकमध्ये अन्नपूर्णा Caterers चालवते. लग्नात जेवण counters मध्ये विभागलेलं असतं: गोड पदार्थ, मुख्य जेवण, पेयं. प्रत्येक ताटाआधी तोच छोटा विधी होतो: नवं केळीचं पान, चिमूटभर मीठ, पाण्याचा ग्लास. आधीच्या पाहुण्याच्या पानावर कोणीच पुढच्या पाहुण्याला वाढत नाही. वाढप्यांना तेलाचे डबे किंवा gas cylinder कुठे ठेवलेत हे माहीत असायची गरज नसते. ते फक्त मुख्य आचारी शंकर काकांना सांगतात, "दोन पुऱ्या आणि एक बासुंदी", आणि ते कसं करायचं हे काकांना माहीत असतं. आणि घरच्या जवळच्या नातेवाईकांकडे pass असतो, म्हणून ते दर वेळी दारावरची तपासणी न करता थेट आत येतात.',
      },
      scene: {
        type: 'group',
        groups: [
          { icon: '🍮', label: 'Sweets counter (describe)', mr: 'गोड पदार्थांचा counter (describe)' },
          { icon: '🍛', label: 'Main course counter (describe)', mr: 'मुख्य जेवणाचा counter (describe)' },
          { icon: '🥤', label: 'Drinks counter (describe)', mr: 'पेयांचा counter (describe)' },
        ],
        items: [
          { icon: '🍩', group: 0 },
          { icon: '🍨', group: 0 },
          { icon: '🫓', group: 1 },
          { icon: '🍚', group: 1 },
          { icon: '🥘', group: 1 },
          { icon: '🥛', group: 2 },
          { icon: '🍵', group: 2 },
        ],
        note: { en: 'Each counter is a describe block. Every plate starts with a fresh banana leaf: that is beforeEach.', mr: 'प्रत्येक counter म्हणजे एक describe block. प्रत्येक ताट नव्या केळीच्या पानाने सुरू होतं: तेच beforeEach.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'happy', text: { en: 'Big news. After the Lost Luggage case, SkyHop wants your Playwright suite to be the gate. No release goes out unless it is green in CI.', mr: 'मोठी बातमी. Lost Luggage case नंतर SkyHop ला तुमचा Playwright suite दार म्हणून हवा आहे. CI मध्ये तो green असल्याशिवाय कोणतंही release बाहेर जाणार नाही.' } },
        { who: 'theo', mood: 'worried', text: { en: 'Then it has to be tidy. Right now 30 tests each copy the same six lines of search. If I rename one label, I fix 30 places.', mr: 'मग तो नीटनेटका हवा. आत्ता 30 tests प्रत्येकी search च्या त्याच सहा ओळी copy करतात. मी एक label बदलला तर 30 ठिकाणी दुरुस्ती.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> rename one button, watch thirty tests bleed. copy paste is my favourite feature. ⌁', mr: '>> एका बटणाचं नाव बदला, तीस tests रक्तबंबाळ. copy paste हे माझं आवडतं feature. ⌁' } },
        { who: 'rex', mood: 'neutral', text: { en: 'We organise it, {name}. test.describe groups the tests, beforeEach does the shared setup, and page objects keep every locator in one place. Same idea as your Selenium POM, lighter.', mr: 'आपण ते नीट रचूया, {name}. test.describe tests गटात ठेवतो, beforeEach सामायिक setup करतो, आणि page objects प्रत्येक locator एकाच ठिकाणी ठेवतात. तुमच्या Selenium POM सारखीच कल्पना, फक्त हलकी.' } },
      ],
      problem: { en: 'A growing suite full of copied setup lines is slow to change and easy to break: one renamed button means editing dozens of tests, and tests that lean on each other fail in confusing ways.', mr: 'copy केलेल्या setup ओळींनी भरलेला वाढता suite बदलायला हळू आणि मोडायला सोपा असतो: एका बटणाचं नाव बदललं की डझनभर tests बदलाव्या लागतात, आणि एकमेकांवर अवलंबून असलेल्या tests गोंधळात टाकणाऱ्या पद्धतीने fail होतात.' },
      solution: { en: 'Group related tests with test.describe, put shared setup in test.beforeEach, keep every test independent, wrap each page\'s locators and actions in a TypeScript page object class, and start logged-in tests from a saved login with test.use({ storageState }).', mr: 'संबंधित tests test.describe ने गटात ठेवा, सामायिक setup test.beforeEach मध्ये ठेवा, प्रत्येक test स्वतंत्र ठेवा, प्रत्येक page चे locators आणि actions एका TypeScript page object class मध्ये गुंडाळा, आणि login लागणाऱ्या tests test.use({ storageState }) ने जतन केलेल्या login पासून सुरू करा.' },
    },
    lesson: [
      { en: 'test.describe(\'seat map\', () => { ... }) groups tests under one heading, like a counter at the wedding. Inside it, test.beforeEach(async ({ page }) => { ... }) runs before every test in that group, and test.afterEach runs after each one. test.beforeAll and test.afterAll run once for the group. From TestNG you know these: beforeEach is @BeforeMethod, beforeAll is @BeforeClass. The report shows the full name, such as "seat map › a taken seat cannot be picked".', mr: 'test.describe(\'seat map\', () => { ... }) tests एका शीर्षकाखाली गटात ठेवतो, लग्नातल्या counter सारखं. त्याच्या आत test.beforeEach(async ({ page }) => { ... }) त्या गटातल्या प्रत्येक test आधी चालतो, आणि test.afterEach प्रत्येक test नंतर. test.beforeAll आणि test.afterAll गटासाठी एकदाच चालतात. TestNG मधून हे तुम्हाला माहीत आहेत: beforeEach म्हणजे @BeforeMethod, beforeAll म्हणजे @BeforeClass. report पूर्ण नाव दाखवतो, जसं "seat map › a taken seat cannot be picked".' },
      { en: 'Keep every test independent: a fresh banana leaf for every plate. Each test gets its own new page, starting blank, so a test must never count on what an earlier test left behind. That lets Playwright run tests in any order, or in parallel, and a failure points at one test only. Shared steps (goto, login) go in beforeEach, never in "test number 1". One thing is shared in our practice project: the backend, so a booking made in one test still exists in the next. Make the data each test needs instead of hoping it is there.', mr: 'प्रत्येक test स्वतंत्र ठेवा: प्रत्येक ताटाला नवं केळीचं पान. प्रत्येक test ला स्वतःचं नवं, रिकामं page मिळतं, म्हणून आधीच्या test ने मागे सोडलेल्या गोष्टीवर कोणत्याही test ने अवलंबून राहू नये. त्यामुळे Playwright tests कोणत्याही क्रमाने किंवा parallel चालवू शकतो, आणि failure फक्त एकाच test कडे बोट दाखवतो. सामायिक पायऱ्या (goto, login) beforeEach मध्ये जातात, "test नंबर 1" मध्ये कधीच नाही. आपल्या practice project मध्ये एक गोष्ट सामायिक आहे: backend, म्हणून एका test मध्ये केलेलं booking पुढच्या test मध्येही असतं. प्रत्येक test ला लागणारा data तो असेल अशी आशा न करता स्वतः तयार करा.' },
      { en: 'A page object is Shankar kaka: a class that knows one page. class SeatPage { constructor(private page: Page) {} } stores the page in one line. readonly locators are built in the constructor, and methods such as pickSeat(\'12C\') or search(\'PNQ\', \'GOI\', date) do the clicks. The test reads like the test case, and when Theo renames a label you fix one line. Unlike Selenium\'s @FindBy and PageFactory, no special setup is needed: a Playwright locator is lazy, it searches only when you use it, so creating it early is safe.', mr: 'page object म्हणजे शंकर काका: एक page ओळखणारा class. class SeatPage { constructor(private page: Page) {} } एका ओळीत page साठवतो. readonly locators constructor मध्ये तयार होतात, आणि pickSeat(\'12C\') किंवा search(\'PNQ\', \'GOI\', date) सारख्या methods clicks करतात. test, test case सारखी वाचता येते, आणि Theo ने label बदलला की तुम्ही एकच ओळ दुरुस्त करता. Selenium च्या @FindBy आणि PageFactory सारखं वेगळं setup लागत नाही: Playwright locator आळशी असतो, तो वापरल्यावरच शोधतो, म्हणून तो आधी तयार करणं सुरक्षित आहे.' },
      { en: 'Keep the checks in the test, and the "how to click" in the page object. That way a reader sees what is being verified. For pages behind login, typing the password in every test is slow and tests the login page fifty times. test.use({ storageState: \'auth/asha.json\' }) starts each test already logged in from a saved state, like the relatives\' pass. In a real project, a setup step logs in once and saves that file. In our lab, any path with "asha" in it works.', mr: 'checks test मध्ये ठेवा, आणि "click कसं करायचं" page object मध्ये. त्यामुळे वाचणाऱ्याला काय तपासलं जातंय ते दिसतं. login मागच्या pages साठी, प्रत्येक test मध्ये password टाईप करणं हळू असतं आणि login page पन्नास वेळा तपासतं. test.use({ storageState: \'auth/asha.json\' }) प्रत्येक test जतन केलेल्या state मधून आधीच login करून सुरू करतो, नातेवाईकांच्या pass सारखं. खऱ्या project मध्ये एक setup पायरी एकदा login करून ती file जतन करते. आपल्या lab मध्ये नावात "asha" असलेला कोणताही path चालतो.' },
    ],
    syntax: {
      template: `import { test, expect, type Page, type Locator } from '@playwright/test';

class SeatPage {
  readonly selected: Locator;
  constructor(private page: Page) {
    this.selected = page.getByTestId('selected-seats');
  }
  async pickSeat(id: string) {
    await this.page.getByRole('button', { name: \`Seat \${id}\` }).click();
  }
}

test.use({ storageState: 'auth/asha.json' });

test.describe('group name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/path');
  });
  test('one behaviour', async ({ page }) => { /* ... */ });
});`,
      parts: [
        { code: "test.describe('name', () => { ... })", means: { en: 'a group of related tests; its name prefixes each test in the report', mr: 'संबंधित tests चा गट; report मध्ये त्याचं नाव प्रत्येक test च्या आधी येतं' } },
        { code: 'test.beforeEach(async ({ page }) => { ... })', means: { en: 'runs before every test in the group (TestNG @BeforeMethod)', mr: 'गटातल्या प्रत्येक test आधी चालतो (TestNG चा @BeforeMethod)' } },
        { code: 'test.beforeAll / afterEach / afterAll', means: { en: 'once before the group, after each test, once after the group', mr: 'गटाआधी एकदा, प्रत्येक test नंतर, गटानंतर एकदा' } },
        { code: 'constructor(private page: Page) {}', means: { en: 'TypeScript shortcut: takes the page and keeps it as this.page', mr: 'TypeScript shortcut: page घेतो आणि this.page म्हणून ठेवतो' } },
        { code: 'readonly selected: Locator', means: { en: 'a locator the class sets once and nobody reassigns', mr: 'class एकदा ठरवतो आणि कोणी परत बदलत नाही असा locator' } },
        { code: "test.use({ storageState: 'auth/asha.json' })", means: { en: 'tests in this file or group start logged in from a saved state', mr: 'या file किंवा गटातल्या tests जतन केलेल्या state मधून login करून सुरू होतात' } },
      ],
      example: [
        { code: "test.describe('seat map', () => {", note: { en: 'one counter at the wedding', mr: 'लग्नातला एक counter' } },
        { code: '  let seats: SeatPage;', note: { en: 'the head cook for this counter', mr: 'या counter चा मुख्य आचारी' } },
        { code: "  test.beforeEach(async ({ page }) => { seats = new SeatPage(page); await page.goto('/seats?demo=1'); });", note: { en: 'a fresh banana leaf before every plate', mr: 'प्रत्येक ताटाआधी नवं केळीचं पान' } },
        { code: "  test('picking 12C selects it', async () => { await seats.pickSeat('12C'); await expect(seats.selected).toHaveText('Selected: 12C'); });", note: { en: '"two puris": the server asks, the cook knows how', mr: '"दोन पुऱ्या": वाढपी सांगतो, आचाऱ्याला कसं ते माहीत' } },
        { code: "  test('10A is taken', async () => { await expect(seats.seat('10A')).toBeDisabled(); });", note: { en: 'a second plate, its own fresh leaf, no leftovers from the first', mr: 'दुसरं ताट, स्वतःचं नवं पान, पहिल्याचं उरलेलं काही नाही' } },
        { code: '});', note: { en: 'the counter is done; the report lists "seat map › ..." for each', mr: 'counter संपला; report प्रत्येकासाठी "seat map › ..." दाखवतो' } },
      ],
      exampleNote: { en: 'Here seat(id) is a small method that returns a locator, and pickSeat(id) clicks it.', mr: 'इथे seat(id) ही locator परत देणारी छोटी method आहे, आणि pickSeat(id) त्यावर click करते.' },
      pitfall: { en: 'A test that only works after another test has run is a trap: alone, or in a different order, it starts on a blank page and times out. Also, every method in a page object that acts on the page is async, so the test must await it: await seats.pickSeat(\'12C\').', mr: 'दुसरी test चालल्यानंतरच चालणारी test हा सापळा आहे: एकटी, किंवा वेगळ्या क्रमाने, ती रिकाम्या page वर सुरू होते आणि timeout होते. आणि page वर काम करणारी page object मधली प्रत्येक method async असते, म्हणून test ने तिला await करायला हवं: await seats.pickSeat(\'12C\').' },
    },
    practice: {
      intro: { en: 'Turn loose tests into an organised suite: groups, shared setup, page objects and a saved login. Some steps ask for a minimum number of tests and check that you used describe, beforeEach or a class.', mr: 'सुट्या tests ना नीट रचलेल्या suite मध्ये बदला: गट, सामायिक setup, page objects आणि जतन केलेलं login. काही steps किमान tests ची संख्या मागतात आणि तुम्ही describe, beforeEach किंवा class वापरला का ते तपासतात.' },
      steps: [
        {
          kind: 'playwright',
          prompt: { en: 'These two tests forgot to open a page, so both start blank. Wrap them in test.describe(\'flight results\', ...) and add a test.beforeEach that opens the results page (the TODO gives the path). Do not add goto inside the tests.', mr: 'या दोन tests page उघडायला विसरल्या, म्हणून दोन्ही रिकाम्या सुरू होतात. त्यांना test.describe(\'flight results\', ...) मध्ये गुंडाळा आणि results page उघडणारा test.beforeEach जोडा (path TODO मध्ये आहे). tests च्या आत goto लिहू नका.' },
          startUrl: `${SKY}${FLIGHTS}`,
          starter: `${IMPORT}// TODO: wrap both tests in test.describe('flight results', () => { ... })
// TODO: inside it, add test.beforeEach that goes to '${FLIGHTS}'

test('shows all 5 flights', async ({ page }) => {
  await expect(page.getByTestId('result-count')).toHaveText('5 flights');
  await expect(page.getByTestId('flight-card')).toHaveCount(5);
});

test('non-stop filter hides flights with a stop', async ({ page }) => {
  await page.getByLabel('Non-stop only').check();
  await expect(page.getByTestId('flight-card')).toHaveCount(3);
  await expect(page.getByTestId('flight-card').filter({ hasText: '1 stop' })).toHaveCount(0);
});
`,
          solution: `${IMPORT}test.describe('flight results', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('${FLIGHTS}');
  });

  test('shows all 5 flights', async ({ page }) => {
    await expect(page.getByTestId('result-count')).toHaveText('5 flights');
    await expect(page.getByTestId('flight-card')).toHaveCount(5);
  });

  test('non-stop filter hides flights with a stop', async ({ page }) => {
    await page.getByLabel('Non-stop only').check();
    await expect(page.getByTestId('flight-card')).toHaveCount(3);
    await expect(page.getByTestId('flight-card').filter({ hasText: '1 stop' })).toHaveCount(0);
  });
});`,
          minTests: 2,
          minAssertions: 4,
          mustUse: [
            { pattern: 'test\\.describe\\(', message: { en: "Group the tests with test.describe('flight results', () => { ... }).", mr: "tests test.describe('flight results', () => { ... }) ने गटात ठेवा." } },
            { pattern: 'test\\.beforeEach\\(', message: { en: 'Put the shared goto in test.beforeEach(async ({ page }) => { ... }).', mr: 'सामायिक goto test.beforeEach(async ({ page }) => { ... }) मध्ये ठेवा.' } },
          ],
          mustCatch: [{ bug: 'nonstop-filter', label: { en: 'Non-stop filter still shows SH 305 (1 stop)', mr: 'Non-stop filter अजूनही SH 305 (1 stop) दाखवतो' } }],
          hints: [
            { en: 'Press Run on the starter: both tests time out, because each one starts on a blank page.', mr: 'starter वर Run दाबा: दोन्ही tests timeout होतात, कारण प्रत्येक रिकाम्या page वर सुरू होते.' },
            { en: 'The shape: test.describe(\'flight results\', () => { test.beforeEach(...); test(...); test(...); });', mr: 'आकार: test.describe(\'flight results\', () => { test.beforeEach(...); test(...); test(...); });' },
            { en: `test.describe('flight results', () => {\n  test.beforeEach(async ({ page }) => {\n    await page.goto('${FLIGHTS}');\n  });\n  // ...both tests here, unchanged\n});`, mr: `test.describe('flight results', () => {\n  test.beforeEach(async ({ page }) => {\n    await page.goto('${FLIGHTS}');\n  });\n  // ...both tests here, unchanged\n});` },
          ],
          successLine: { en: 'One goto, used by every test in the group. The report now reads "flight results › shows all 5 flights".', mr: 'एक goto, गटातली प्रत्येक test वापरते. report आता "flight results › shows all 5 flights" असं वाचतो.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Theo thinks the second test can "carry on" from the first. Press Run and read the report. Why does the second test fail?', mr: 'Theo ला वाटतं दुसरी test पहिलीपासून "पुढे चालू" शकते. Run दाबा आणि report वाचा. दुसरी test fail का होते?' },
          playwrightSandbox: { code: INDEPENDENT_DEMO, startUrl: `${SKY}/` },
          options: [
            { en: 'The non-stop filter on SkyHop is broken', mr: 'SkyHop वरचा non-stop filter बिघडला आहे' },
            { en: 'Each test gets a fresh, blank page. The second test never opened the results; the shared steps belong in a beforeEach', mr: 'प्रत्येक test ला नवं, रिकामं page मिळतं. दुसऱ्या test ने results कधी उघडलेच नाहीत; सामायिक पायऱ्या beforeEach मध्ये हव्यात' },
            { en: 'The first test closed the browser too early', mr: 'पहिल्या test ने browser खूप लवकर बंद केला' },
            { en: 'It needs page.waitForTimeout(1000) at the start', mr: 'सुरुवातीला page.waitForTimeout(1000) हवं' },
          ],
          correct: [1],
          explain: { en: 'The log shows the second test starting on about:blank and waiting 5 seconds for a "Non-stop only" checkbox that is not there. Tests never share a page. That is a feature: each test can run alone, in any order, in parallel. Put the goto (or the whole search) in test.beforeEach.', mr: 'log दाखवतो की दुसरी test about:blank वर सुरू होते आणि तिथे नसलेल्या "Non-stop only" checkbox साठी 5 सेकंद वाट पाहते. tests कधीच page share करत नाहीत. हे feature आहे: प्रत्येक test एकटी, कोणत्याही क्रमाने, parallel चालू शकते. goto (किंवा पूर्ण search) test.beforeEach मध्ये ठेवा.' },
          hints: [
            { en: 'Look at the browser while the second test runs. What page is it on?', mr: 'दुसरी test चालताना browser पाहा. ते कोणत्या page वर आहे?' },
            { en: 'The red line says Playwright was waiting for the checkbox. Why could it not appear?', mr: 'लाल ओळ सांगते की Playwright checkbox साठी थांबला होता. तो का दिसू शकला नाही?' },
          ],
          successLine: { en: 'A fresh leaf for every plate. Tests that lean on each other fall over together.', mr: 'प्रत्येक ताटाला नवं पान. एकमेकांवर टेकलेल्या tests एकत्रच कोसळतात.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Here is a SearchPage page object with its locators ready. Write its search(from, to, date) method: pick From, pick To, fill the date, click Search flights. Both tests already use it. The second one makes sure the same city twice is refused.', mr: 'हा SearchPage page object आहे, त्याचे locators तयार आहेत. त्याची search(from, to, date) method लिहा: From निवडा, To निवडा, date भरा, Search flights वर click करा. दोन्ही tests ती आधीच वापरतात. दुसरी test एकच शहर दोनदा दिलं तर ते नाकारलं जातं हे तपासते.' },
          startUrl: `${SKY}/`,
          starter: `${IMPORT_TYPES}${SEARCH_PAGE_CLASS}
  async search(from: string, to: string, date: string) {
    // TODO: select 'from' in this.from, select 'to' in this.to,
    // fill 'date' into this.date, then click this.searchButton
  }
}
${SEARCH_TESTS}
`,
          solution: `${IMPORT_TYPES}${SEARCH_PAGE_CLASS}
  async search(from: string, to: string, date: string) {
    await this.from.selectOption(from);
    await this.to.selectOption(to);
    await this.date.fill(date);
    await this.searchButton.click();
  }
}
${SEARCH_TESTS}`,
          minTests: 2,
          minAssertions: 3,
          mustUse: [
            { pattern: 'class\\s+SearchPage', message: { en: 'Keep the SearchPage class: the tests use it.', mr: 'SearchPage class ठेवा: tests ती वापरतात.' } },
            { pattern: 'constructor\\(\\s*private\\s+page', message: { en: 'Keep the constructor(private page: Page) shortcut in the class.', mr: 'class मध्ये constructor(private page: Page) shortcut ठेवा.' } },
            { pattern: 'this\\.searchButton\\.click\\(', message: { en: 'Inside search(), use the class\'s own locators, for example await this.searchButton.click().', mr: 'search() च्या आत class चेच locators वापरा, उदा. await this.searchButton.click().' } },
          ],
          mustCatch: [{ bug: 'same-city', label: { en: 'Searching Pune to Pune is allowed', mr: 'पुणे ते पुणे search करता येतं' } }],
          hints: [
            { en: 'Inside a class, reach its locators with this: this.from, this.to, this.date, this.searchButton.', mr: 'class च्या आत त्याचे locators this ने वापरा: this.from, this.to, this.date, this.searchButton.' },
            { en: 'The selects take the airport code as the value: await this.from.selectOption(from);', mr: 'selects airport code value म्हणून घेतात: await this.from.selectOption(from);' },
            { en: 'await this.from.selectOption(from);\nawait this.to.selectOption(to);\nawait this.date.fill(date);\nawait this.searchButton.click();', mr: 'await this.from.selectOption(from);\nawait this.to.selectOption(to);\nawait this.date.fill(date);\nawait this.searchButton.click();' },
          ],
          successLine: { en: 'Two tests, one search method. If Theo renames "Search flights", you change one line in SearchPage and every test follows.', mr: 'दोन tests, एक search method. Theo ने "Search flights" चं नाव बदललं तर तुम्ही SearchPage मधली एक ओळ बदलता आणि सगळ्या tests मागोमाग येतात.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Build the seat map suite. In SeatPage, write pickSeat(id) that clicks the seat (use the seat(id) method). Then add a test.beforeEach that creates the page object and opens \'/seats?demo=1\'. The three tests are written.', mr: 'seat map चा suite तयार करा. SeatPage मध्ये seat वर click करणारी pickSeat(id) लिहा (seat(id) method वापरा). मग page object तयार करून \'/seats?demo=1\' उघडणारा test.beforeEach जोडा. तीन tests लिहिलेल्या आहेत.' },
          startUrl: `${SKY}/seats?demo=1`,
          starter: `${IMPORT_TYPES}class SeatPage {
  readonly selected: Locator;
  readonly seatFee: Locator;
  readonly continueButton: Locator;

  constructor(private page: Page) {
    this.selected = page.getByTestId('selected-seats');
    this.seatFee = page.getByTestId('seat-fee');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
  }

  seat(id: string) {
    return this.page.getByRole('button', { name: 'Seat ' + id });
  }

  // TODO: async pickSeat(id: string) that clicks this.seat(id)
}

test.describe('seat map', () => {
  let seats: SeatPage;

  // TODO: test.beforeEach that sets seats = new SeatPage(page) and goes to '/seats?demo=1'

  test('picking 12C selects it and unlocks Continue', async () => {
    await expect(seats.continueButton).toBeDisabled();
    await seats.pickSeat('12C');
    await expect(seats.selected).toHaveText('Selected: 12C');
    await expect(seats.continueButton).toBeEnabled();
  });

  test('a taken seat cannot be picked', async () => {
    await expect(seats.seat('10A')).toBeDisabled();
  });

  test('extra legroom costs 600 rupees', async () => {
    await seats.pickSeat('10C');
    await expect(seats.seatFee).toHaveText('Seat fee: ₹600');
  });
});
`,
          solution: `${IMPORT_TYPES}class SeatPage {
  readonly selected: Locator;
  readonly seatFee: Locator;
  readonly continueButton: Locator;

  constructor(private page: Page) {
    this.selected = page.getByTestId('selected-seats');
    this.seatFee = page.getByTestId('seat-fee');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
  }

  seat(id: string) {
    return this.page.getByRole('button', { name: 'Seat ' + id });
  }

  async pickSeat(id: string) {
    await this.seat(id).click();
  }
}
${SEAT_TESTS}`,
          minTests: 3,
          minAssertions: 5,
          mustUse: [
            { pattern: 'async\\s+pickSeat\\s*\\(', message: { en: 'Add the method async pickSeat(id: string) { ... } to SeatPage.', mr: 'SeatPage मध्ये async pickSeat(id: string) { ... } ही method जोडा.' } },
            { pattern: 'test\\.beforeEach\\(', message: { en: 'Create the page object and open the page in test.beforeEach.', mr: 'page object तयार करा आणि page test.beforeEach मध्ये उघडा.' } },
          ],
          mustCatch: [{ bug: 'seat-taken', label: { en: 'Taken seats can still be picked', mr: 'घेतलेल्या seats सुद्धा निवडता येतात' } }],
          hints: [
            { en: 'pickSeat is two lines: the method header and await this.seat(id).click();', mr: 'pickSeat दोन ओळींची आहे: method चं header आणि await this.seat(id).click();' },
            { en: 'The beforeEach fills the variable declared above it: seats = new SeatPage(page);', mr: 'beforeEach त्याच्या वर declare केलेला variable भरतो: seats = new SeatPage(page);' },
            { en: "async pickSeat(id: string) {\n  await this.seat(id).click();\n}\n\ntest.beforeEach(async ({ page }) => {\n  seats = new SeatPage(page);\n  await page.goto('/seats?demo=1');\n});", mr: "async pickSeat(id: string) {\n  await this.seat(id).click();\n}\n\ntest.beforeEach(async ({ page }) => {\n  seats = new SeatPage(page);\n  await page.goto('/seats?demo=1');\n});" },
          ],
          successLine: { en: 'Three short tests that read like test cases. The taken seat check also caught the build where 10A could be booked twice.', mr: 'test cases सारख्या वाचता येणाऱ्या तीन छोट्या tests. घेतलेल्या seat च्या check ने 10A दोनदा book होऊ शकणारा build सुद्धा पकडला.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'My trips needs a login. Add test.use({ storageState: \'auth/asha.json\' }) so the test starts logged in, and write the trip(pnr) method in TripsPage: the trip cards (test id "trip") filtered by that PNR.', mr: 'My trips ला login लागतं. test.use({ storageState: \'auth/asha.json\' }) जोडा म्हणजे test login करूनच सुरू होईल, आणि TripsPage मध्ये trip(pnr) method लिहा: त्या PNR ने filter केलेले trip cards (test id "trip").' },
          startUrl: `${SKY}/trips`,
          starter: `${IMPORT_TYPES}class TripsPage {
  readonly count: Locator;

  constructor(private page: Page) {
    this.count = page.getByTestId('trip-count');
  }

  async open() {
    await this.page.goto('/trips');
  }

  // TODO: trip(pnr: string) returns the 'trip' cards filtered by hasText: pnr
}

// TODO: start every test in this file logged in as Asha (storageState 'auth/asha.json')

test('Asha sees her two trips', async ({ page }) => {
  const trips = new TripsPage(page);
  await trips.open();
  await expect(page.getByText('Hi, Asha')).toBeVisible();
  await expect(trips.count).toHaveText('2 trips');
  await expect(trips.trip('SKY1A2').getByTestId('trip-status')).toHaveText('Confirmed');
  await expect(trips.trip('SKY0Z9').getByTestId('trip-status')).toHaveText('Completed');
});
`,
          solution: `${IMPORT_TYPES}class TripsPage {
  readonly count: Locator;

  constructor(private page: Page) {
    this.count = page.getByTestId('trip-count');
  }

  async open() {
    await this.page.goto('/trips');
  }

  trip(pnr: string) {
    return this.page.getByTestId('trip').filter({ hasText: pnr });
  }
}

test.use({ storageState: 'auth/asha.json' });

test('Asha sees her two trips', async ({ page }) => {
  const trips = new TripsPage(page);
  await trips.open();
  await expect(page.getByText('Hi, Asha')).toBeVisible();
  await expect(trips.count).toHaveText('2 trips');
  await expect(trips.trip('SKY1A2').getByTestId('trip-status')).toHaveText('Confirmed');
  await expect(trips.trip('SKY0Z9').getByTestId('trip-status')).toHaveText('Completed');
});`,
          minAssertions: 4,
          mustUse: [
            { pattern: 'test\\.use\\(\\s*\\{\\s*storageState', message: { en: "Start logged in with test.use({ storageState: 'auth/asha.json' }).", mr: "test.use({ storageState: 'auth/asha.json' }) ने login करून सुरू करा." } },
            { pattern: 'trip\\s*\\(\\s*pnr', message: { en: 'Add the method trip(pnr: string) { ... } to TripsPage.', mr: 'TripsPage मध्ये trip(pnr: string) { ... } ही method जोडा.' } },
          ],
          mustNotUse: [{ pattern: "getByLabel\\(\\s*['\"`]Password", message: { en: 'No typing the password in this test. The saved storageState is the whole point.', mr: 'या test मध्ये password टाईप करायचा नाही. जतन केलेला storageState हाच तर मुद्दा आहे.' } }],
          hints: [
            { en: 'Without a login, /trips sends you to the login page. Press Run on the starter to see it.', mr: 'login शिवाय /trips तुम्हाला login page वर पाठवतं. ते पाहण्यासाठी starter वर Run दाबा.' },
            { en: "test.use goes at the top level of the file, above the test: test.use({ storageState: 'auth/asha.json' });", mr: "test.use file च्या सर्वात वरच्या पातळीवर, test च्या वर जातो: test.use({ storageState: 'auth/asha.json' });" },
            { en: "trip(pnr: string) {\n  return this.page.getByTestId('trip').filter({ hasText: pnr });\n}\n\ntest.use({ storageState: 'auth/asha.json' });", mr: "trip(pnr: string) {\n  return this.page.getByTestId('trip').filter({ hasText: pnr });\n}\n\ntest.use({ storageState: 'auth/asha.json' });" },
          ],
          successLine: { en: 'Logged in from the first line, no password typed. Across a 200-test suite that saves minutes on every CI run.', mr: 'पहिल्या ओळीपासून login, password टाईप न करता. 200 tests च्या suite मध्ये प्रत्येक CI run ला यामुळे काही मिनिटं वाचतात.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'In TestNG you used @BeforeMethod to open the start page before each test. What is the Playwright version?', mr: 'TestNG मध्ये प्रत्येक test आधी सुरुवातीचं page उघडायला तुम्ही @BeforeMethod वापरलं. Playwright मध्ये ते काय?' },
        options: [
          "test.beforeAll(async ({ page }) => { await page.goto('/'); });",
          "test.beforeEach(async ({ page }) => { await page.goto('/'); });",
          "test.describe('start', async ({ page }) => { await page.goto('/'); });",
          "test.use({ goto: '/' });",
        ],
        answer: 1,
        explain: { en: 'beforeEach runs before every test in its group, like @BeforeMethod. beforeAll runs once (like @BeforeClass), describe only groups tests, and test.use sets options such as storageState.', mr: 'beforeEach त्याच्या गटातल्या प्रत्येक test आधी चालतो, @BeforeMethod सारखा. beforeAll एकदाच चालतो (@BeforeClass सारखा), describe फक्त tests गटात ठेवतो, आणि test.use storageState सारखे options ठरवतो.' },
      },
      {
        q: { en: 'What does this constructor do?', mr: 'हा constructor काय करतो?' },
        code: 'class TripsPage {\n  constructor(private page: Page) {}\n}',
        options: [
          { en: 'It opens a new browser tab', mr: 'तो नवा browser tab उघडतो' },
          { en: 'It makes the page read-only so no test can click it', mr: 'तो page फक्त वाचण्यापुरतं करतो म्हणजे कोणतीही test click करू शकत नाही' },
          { en: 'Nothing, because the body is empty', mr: 'काहीच नाही, कारण body रिकामी आहे' },
          { en: 'It takes the page and keeps it as a private field, this.page, in one line', mr: 'तो page घेतो आणि त्याला private field, this.page, म्हणून एका ओळीत ठेवतो' },
        ],
        answer: 3,
        explain: { en: 'private in front of a constructor parameter is a TypeScript shortcut: it declares the field and assigns it. The methods then use this.page.getByRole(...). In Java you wrote the field and this.driver = driver by hand.', mr: 'constructor parameter च्या आधी private हा TypeScript shortcut आहे: तो field declare करतो आणि त्यात value ठेवतो. मग methods this.page.getByRole(...) वापरतात. Java मध्ये तुम्ही field आणि this.driver = driver हाताने लिहायचात.' },
      },
      {
        q: { en: 'Where should the checks (expect) usually live when you use page objects?', mr: 'page objects वापरताना checks (expect) सहसा कुठे असावेत?' },
        options: [
          { en: 'In the test, so a reader sees what is verified; the page object holds locators and actions', mr: 'test मध्ये, म्हणजे वाचणाऱ्याला काय तपासलं जातं ते दिसतं; page object मध्ये locators आणि actions' },
          { en: 'Only inside the page object constructor', mr: 'फक्त page object च्या constructor मध्ये' },
          { en: 'In playwright.config.ts', mr: 'playwright.config.ts मध्ये' },
          { en: 'Nowhere: page objects replace assertions', mr: 'कुठेच नाही: page objects assertions ची जागा घेतात' },
        ],
        answer: 0,
        explain: { en: 'A test like "await seats.pickSeat(\'12C\'); await expect(seats.selected).toHaveText(\'Selected: 12C\')" reads like the test case. The page object hides how to click; the test shows what must be true.', mr: '"await seats.pickSeat(\'12C\'); await expect(seats.selected).toHaveText(\'Selected: 12C\')" सारखी test, test case सारखी वाचता येते. click कसं करायचं ते page object लपवतो; काय खरं असायला हवं ते test दाखवते.' },
      },
      {
        q: { en: 'Why put test.use({ storageState: \'auth/asha.json\' }) at the top of the My trips spec?', mr: 'My trips च्या spec च्या सुरुवातीला test.use({ storageState: \'auth/asha.json\' }) का ठेवायचं?' },
        options: [
          { en: 'It stores every test result in a file', mr: 'तो प्रत्येक test चा निकाल file मध्ये साठवतो' },
          { en: 'It makes the tests run one after another', mr: 'तो tests एकामागून एक चालवतो' },
          { en: 'Every test starts already logged in from a saved state, without typing the password each time', mr: 'प्रत्येक test जतन केलेल्या state मधून आधीच login करून सुरू होते, दर वेळी password टाईप न करता' },
          { en: 'It logs out after every test', mr: 'तो प्रत्येक test नंतर logout करतो' },
        ],
        answer: 2,
        explain: { en: 'storageState is a saved login (cookies and storage). Tests start behind the login, so they are faster and spend their time on My trips instead of the login page.', mr: 'storageState म्हणजे जतन केलेलं login (cookies आणि storage). tests login च्या पलीकडून सुरू होतात, म्हणून त्या जलद असतात आणि त्यांचा वेळ login page ऐवजी My trips वर जातो.' },
      },
    ],
    recap: { line: { en: 'Group with test.describe, share setup in test.beforeEach, keep every test independent, put locators and actions in page object classes (checks stay in the test), and start logged in with test.use({ storageState }).', mr: 'test.describe ने गट करा, सामायिक setup test.beforeEach मध्ये, प्रत्येक test स्वतंत्र ठेवा, locators आणि actions page object classes मध्ये ठेवा (checks test मध्येच), आणि test.use({ storageState }) ने login करून सुरू करा.' }, icon: '🏗️' },
  },

  // ───────────────────────── W2.2 The network: watch it and mock it
  {
    id: 'pw2-2',
    code: 'W2.2',
    level: 'intermediate',
    title: { en: 'The network: watch it and mock it', mr: 'Network: त्यावर लक्ष ठेवा आणि त्याचं mock करा' },
    skill: 'page.waitForResponse, response status and JSON, page.route, route.fulfill, route.abort, route.fetch',
    realLife: {
      place: 'restaurant',
      title: { en: 'Kiran trains a new waiter', mr: 'किरण नव्या वेटरला शिकवतो' },
      story: {
        en: 'Meera\'s friend Kiran runs a misal house in Kolhapur and trains every new waiter himself. He cannot wait for the one day a month the kitchen really runs out of misal to see how a new boy handles it. So he plays the kitchen himself: "Today, pretend the kitchen says misal is finished." A good waiter tells the table politely and suggests poha. A bad one brings an empty plate and says nothing. Kiran also listens: when the waiter calls an order, Kiran starts listening for the kitchen\'s reply before the call goes out, so he never misses a fast answer. And sometimes he changes just one thing, "tell him the thali is ₹999 today", to see if the bill still looks right.',
        mr: 'मीराचा मित्र किरण कोल्हापुरात misal चं हॉटेल चालवतो आणि प्रत्येक नव्या वेटरला स्वतः शिकवतो. महिन्यातून एकदा खरंच misal संपते त्या दिवसाची वाट पाहून नवा मुलगा ते कसं हाताळतो हे पाहणं त्याला परवडत नाही. म्हणून तो स्वतःच kitchen बनतो: "आज समज kitchen ने सांगितलं misal संपली." चांगला वेटर टेबलला नम्रपणे सांगतो आणि पोहे सुचवतो. वाईट वेटर रिकामी प्लेट आणतो आणि काहीच बोलत नाही. किरण ऐकतोही: वेटर order सांगतो तेव्हा, ती सांगितली जाण्याआधीच किरण kitchen च्या उत्तरासाठी कान देतो, म्हणजे जलद उत्तर कधी चुकत नाही. आणि कधी कधी तो फक्त एकच गोष्ट बदलतो, "त्याला सांग आज थाळी ₹999 ची आहे", म्हणजे bill तरीही बरोबर दिसतं का ते कळतं.',
      },
      scene: {
        type: 'exchange',
        client: { icon: '🧑‍🍳', label: 'New waiter (the page)', mr: 'नवा वेटर (page)' },
        server: { icon: '🍲', label: 'Kitchen (the API), played by Kiran', mr: 'kitchen (API), किरण बनलेला' },
        request: { icon: '📝', label: 'One misal pav', mr: 'एक misal pav' },
        response: { icon: '🚫', label: '"Misal finished" (mocked)', mr: '"misal संपली" (mock)' },
        note: { en: 'page.route lets the test play the kitchen. Does the waiter say sorry, or bring an empty plate?', mr: 'page.route मुळे test kitchen बनू शकते. वेटर माफी मागतो, की रिकामी प्लेट आणतो?' },
      },
    },
    solves: {
      dialogue: [
        { who: 'gremlin', mood: 'smug', text: { en: '>> i made /api/flights answer 500 for ten minutes. your site said "0 flights". people thought skyhop sold its planes. lol ⌁', mr: '>> मी दहा मिनिटं /api/flights ला 500 द्यायला लावलं. तुमची site म्हणाली "0 flights". लोकांना वाटलं skyhop ने विमानं विकली. lol ⌁' } },
        { who: 'sam', mood: 'worried', text: { en: 'Customers did not see an error, so they did not retry. They just went to another airline.', mr: 'ग्राहकांना error दिसला नाही, म्हणून त्यांनी पुन्हा प्रयत्न केला नाही. ते सरळ दुसऱ्या airline कडे गेले.' } },
        { who: 'theo', mood: 'worried', text: { en: 'And I cannot make the real server fail on demand. It fails maybe once a month. How do we test that page before every release?', mr: 'आणि मी खरा server हवा तेव्हा fail करू शकत नाही. तो महिन्यातून एखादा वेळ fail होतो. प्रत्येक release आधी ते page कसं तपासायचं?' } },
        { who: 'rex', mood: 'happy', text: { en: 'The test plays the server, {name}. page.route answers the page\'s requests with whatever we choose: a 500, an empty list, a dropped line. And waitForResponse lets us watch what the real server says.', mr: 'test च server बनते, {name}. page.route page च्या requests ना आपण ठरवू ते उत्तर देतो: 500, रिकामी list, तुटलेली line. आणि waitForResponse ने खरा server काय सांगतो त्यावर लक्ष ठेवता येतं.' } },
      ],
      problem: { en: 'Error pages, empty results and slow or dropped connections are rare and random on the real server, so nobody tests them, and that is exactly where bugs like "0 flights with no error" hide.', mr: 'error pages, रिकामे results आणि हळू किंवा तुटलेली connections खऱ्या server वर क्वचित आणि अचानक येतात, म्हणून कोणी ती तपासत नाही, आणि "error शिवाय 0 flights" सारखे bugs नेमके तिथेच लपतात.' },
      solution: { en: 'Watch real traffic with page.waitForResponse and check its status and JSON. Mock it with page.route: route.fulfill to answer with any status or data, route.abort for a dropped connection, and route.fetch plus fulfill to change one field of the real answer. Rare cases become ordinary, repeatable tests.', mr: 'खरं traffic page.waitForResponse ने पाहा आणि त्याचा status आणि JSON तपासा. page.route ने त्याचं mock करा: कोणताही status किंवा data देण्यासाठी route.fulfill, तुटलेल्या connection साठी route.abort, आणि खऱ्या उत्तरातलं एकच field बदलण्यासाठी route.fetch आणि fulfill. दुर्मीळ प्रसंग साध्या, पुन्हा चालवता येणाऱ्या tests बनतात.' },
    },
    lesson: [
      { en: 'Watching: const responsePromise = page.waitForResponse(\'**/api/flights*\') starts listening and gives a promise. Start it before the click that sends the request, then await it after: const response = await responsePromise. If you start listening after the click, a fast reply may already be gone and the wait times out. Then check it like in Postman: expect(response.status()).toBe(200) and const flights = await response.json().', mr: 'लक्ष ठेवणं: const responsePromise = page.waitForResponse(\'**/api/flights*\') ऐकायला सुरुवात करतो आणि promise देतो. request पाठवणाऱ्या click आधी ते सुरू करा, आणि नंतर await करा: const response = await responsePromise. click नंतर ऐकायला सुरुवात केली तर जलद उत्तर आधीच निघून गेलेलं असू शकतं आणि wait timeout होतं. मग Postman सारखं तपासा: expect(response.status()).toBe(200) आणि const flights = await response.json().' },
      { en: 'Mocking: await page.route(\'**/api/flights*\', route => route.fulfill({ status: 500, json: { error: \'Server down\' } })). From now on, every matching request from the page comes to your handler, and the real server never sees it. Set the route up before page.goto, because the page asks for flights as soon as it loads. "**" means any start of the URL, and "*" means anything up to the next slash, so the query string matches too.', mr: 'mock करणं: await page.route(\'**/api/flights*\', route => route.fulfill({ status: 500, json: { error: \'Server down\' } })). आतापासून page कडून येणारी प्रत्येक जुळणारी request तुमच्या handler कडे येते, आणि खऱ्या server ला ती दिसतही नाही. route, page.goto च्या आधी लावा, कारण page load होताच flights मागतं. "**" म्हणजे URL ची कोणतीही सुरुवात, आणि "*" म्हणजे पुढच्या slash पर्यंत काहीही, म्हणून query string सुद्धा जुळते.' },
      { en: 'The other moves: route.fulfill({ status: 200, json: [] }) gives an empty list. route.abort() drops the connection, as if the passenger\'s Wi-Fi died. Add { times: 1 } to page.route to mock only the first request, so a Retry reaches the real server. And to change one thing: const response = await route.fetch() gets the real answer, you edit the JSON, then route.fulfill({ response, json: changed }) sends it on with the same status and headers.', mr: 'बाकीच्या चाली: route.fulfill({ status: 200, json: [] }) रिकामी list देतो. route.abort() connection तोडतो, जणू प्रवाशाचं Wi-Fi गेलं. पहिलीच request mock करायची असेल तर page.route ला { times: 1 } जोडा, म्हणजे Retry खऱ्या server पर्यंत पोहोचतो. आणि एकच गोष्ट बदलायची असेल तर: const response = await route.fetch() खरं उत्तर आणतो, तुम्ही JSON बदलता, मग route.fulfill({ response, json: changed }) तो त्याच status आणि headers सह पुढे पाठवतो.' },
      { en: 'Why testers love this: the rare day becomes every run. The error page, the empty list and the ₹99,999 fare are tested on every release, with the same data each time, so the test is stable and fast. In Selenium you needed a separate proxy or a WireMock server for this; here it is built in. Remember what a mock proves: that the UI handles that answer well. It does not prove the real server sends it, which is why we also test the API itself (next lesson).', mr: 'testers ना हे का आवडतं: दुर्मीळ दिवस प्रत्येक run मध्ये येतो. error page, रिकामी list आणि ₹99,999 चं भाडं प्रत्येक release ला, दर वेळी त्याच data सह तपासलं जातं, म्हणून test स्थिर आणि जलद राहते. Selenium मध्ये यासाठी वेगळा proxy किंवा WireMock server लागायचा; इथे ते आतच आहे. mock काय सिद्ध करतो ते लक्षात ठेवा: UI ते उत्तर नीट हाताळतो. खरा server ते पाठवतो हे तो सिद्ध करत नाही, म्हणूनच आपण API सुद्धा तपासतो (पुढचा lesson).' },
    ],
    syntax: {
      template: `// watch: start waiting BEFORE the action
const responsePromise = page.waitForResponse('**/api/flights*');
await page.getByRole('button', { name: 'Search flights' }).click();
const response = await responsePromise;
expect(response.status()).toBe(200);
const flights = await response.json();

// mock: set up BEFORE page.goto
await page.route('**/api/flights*', route => route.fulfill({ status: 500, json: { error: 'down' } }));
await page.route('**/api/flights*', route => route.abort(), { times: 1 });
await page.route('**/api/flights*', async route => {
  const response = await route.fetch();
  const json = await response.json();
  json[0].price = 99999;
  await route.fulfill({ response, json });
});`,
      parts: [
        { code: "page.waitForResponse('**/api/flights*')", means: { en: 'a promise that resolves when a matching response arrives', mr: 'जुळणारं response आल्यावर पूर्ण होणारा promise' } },
        { code: 'response.status() / await response.json()', means: { en: 'the HTTP status, and the body as JavaScript data', mr: 'HTTP status, आणि body JavaScript data म्हणून' } },
        { code: 'page.route(pattern, handler)', means: { en: 'send matching requests from the page to your handler', mr: 'page कडून येणाऱ्या जुळणाऱ्या requests तुमच्या handler कडे पाठवा' } },
        { code: 'route.fulfill({ status, json })', means: { en: 'answer the request yourself; the server is never asked', mr: 'request ला स्वतः उत्तर द्या; server ला विचारलंच जात नाही' } },
        { code: 'route.abort()', means: { en: 'fail the request like a dropped connection', mr: 'तुटलेल्या connection सारखी request fail करा' } },
        { code: 'route.fetch() + fulfill({ response, json })', means: { en: 'get the real answer, change part of it, pass it on', mr: 'खरं उत्तर आणा, त्याचा भाग बदला, पुढे पाठवा' } },
        { code: '{ times: 1 }', means: { en: 'the route handles only the first matching request', mr: 'route फक्त पहिली जुळणारी request हाताळतो' } },
      ],
      example: [
        { code: "await page.route('**/api/flights*', route => route.fulfill({ status: 500, json: { error: 'down' } }));", note: { en: 'Kiran says "today the kitchen is out of misal"', mr: 'किरण सांगतो "आज kitchen मध्ये misal संपली"' } },
        { code: `await page.goto('${FLIGHTS}');`, note: { en: 'the waiter takes the order', mr: 'वेटर order घेतो' } },
        { code: `await expect(page.getByRole('alert')).toHaveText('${ERROR_TEXT}');`, note: { en: 'a good waiter says sorry clearly', mr: 'चांगला वेटर स्पष्टपणे माफी मागतो' } },
        { code: "await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();", note: { en: 'and offers something: "shall I check again?"', mr: 'आणि काहीतरी सुचवतो: "पुन्हा विचारू का?"' } },
        { code: "await expect(page.getByTestId('result-count')).toBeHidden();", note: { en: 'no empty plate saying "0 flights"', mr: '"0 flights" म्हणणारी रिकामी प्लेट नाही' } },
      ],
      pitfall: { en: 'Order matters twice. page.route must come before the goto or click that sends the request, or the real server answers first. And waitForResponse must start before the click, then be awaited after it. Writing await page.waitForResponse(...) after the click can wait for a reply that already came and went.', mr: 'क्रम दोनदा महत्त्वाचा. request पाठवणाऱ्या goto किंवा click च्या आधी page.route हवा, नाहीतर खरा server आधी उत्तर देतो. आणि waitForResponse click आधी सुरू होऊन नंतर await व्हायला हवा. click नंतर await page.waitForResponse(...) लिहिलं तर आधीच येऊन गेलेल्या उत्तराची वाट पाहत बसाल.' },
    },
    practice: {
      intro: { en: 'First you watch the real traffic, then you play the server: a 500, an empty day, a dropped line, and one changed price. The browser on the right shows exactly what a passenger would see.', mr: 'आधी तुम्ही खरं traffic पाहाल, मग server बनाल: 500, रिकामा दिवस, तुटलेली line, आणि एक बदललेली किंमत. उजवीकडचा browser प्रवाशाला नेमकं काय दिसेल ते दाखवतो.' },
      steps: [
        {
          kind: 'playwright',
          prompt: { en: 'Watch the search talk to the server. Before the click, start page.waitForResponse(\'**/api/flights*\'). After the click, await it, check its status is 200 and that its JSON has 5 flights.', mr: 'search server शी कसं बोलतं ते पाहा. click आधी page.waitForResponse(\'**/api/flights*\') सुरू करा. click नंतर त्याला await करा, त्याचा status 200 आहे आणि JSON मध्ये 5 flights आहेत हे तपासा.' },
          startUrl: `${SKY}/`,
          starter: `${IMPORT}test('search asks the flights API and shows its answer', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Departure date').fill('2026-12-20');
  // TODO: start waiting for the response of '**/api/flights*' (before the click!)
  await page.getByRole('button', { name: 'Search flights' }).click();
  // TODO: await the response, expect status 200, and expect its JSON to have length 5
  await expect(page.getByTestId('result-count')).toHaveText('5 flights');
});
`,
          solution: `${IMPORT}test('search asks the flights API and shows its answer', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Departure date').fill('2026-12-20');
  const responsePromise = page.waitForResponse('**/api/flights*');
  await page.getByRole('button', { name: 'Search flights' }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const flights = await response.json();
  expect(flights).toHaveLength(5);
  await expect(page.getByTestId('result-count')).toHaveText('5 flights');
});`,
          minAssertions: 3,
          mustUse: [
            { pattern: "waitForResponse\\([\\s\\S]*name:\\s*['\"`]Search flights", message: { en: 'Start page.waitForResponse(...) before the Search flights click, and await it after.', mr: 'page.waitForResponse(...) Search flights च्या click आधी सुरू करा, आणि नंतर await करा.' } },
            { pattern: '\\.json\\(\\)', message: { en: 'Read the body with await response.json() and check it.', mr: 'body await response.json() ने वाचा आणि तपासा.' } },
          ],
          hints: [
            { en: 'Do not await the waitForResponse line itself. Keep its promise in a const, click, then await the const.', mr: 'waitForResponse ची ओळ स्वतः await करू नका. त्याचा promise एका const मध्ये ठेवा, click करा, मग तो const await करा.' },
            { en: "const responsePromise = page.waitForResponse('**/api/flights*');", mr: "const responsePromise = page.waitForResponse('**/api/flights*');" },
            { en: "const responsePromise = page.waitForResponse('**/api/flights*');\nawait page.getByRole('button', { name: 'Search flights' }).click();\nconst response = await responsePromise;\nexpect(response.status()).toBe(200);\nexpect(await response.json()).toHaveLength(5);", mr: "const responsePromise = page.waitForResponse('**/api/flights*');\nawait page.getByRole('button', { name: 'Search flights' }).click();\nconst response = await responsePromise;\nexpect(response.status()).toBe(200);\nexpect(await response.json()).toHaveLength(5);" },
          ],
          successLine: { en: 'Now your test checks both sides: the server sent 5 flights, and the page shows 5 flights.', mr: 'आता तुमची test दोन्ही बाजू तपासते: server ने 5 flights पाठवल्या, आणि page 5 flights दाखवतं.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Recreate the Gremlin\'s attack. Mock \'**/api/flights*\' to answer status 500, then open the results page. A passenger must see the alert "We could not load flights. Please try again." and a Retry button. Hidden builds will check that your test catches the silent "0 flights" bug.', mr: 'gremlin चा हल्ला पुन्हा करा. \'**/api/flights*\' चं mock करा म्हणजे तो status 500 देईल, मग results page उघडा. प्रवाशाला "We could not load flights. Please try again." हा alert आणि Retry बटण दिसायला हवं. लपवलेले builds तपासतील की तुमची test गुपचूप "0 flights" वाला bug पकडते.' },
          startUrl: `${SKY}${FLIGHTS}`,
          starter: `${IMPORT}test('a server error shows a clear message', async ({ page }) => {
  // TODO: route '**/api/flights*' to route.fulfill({ status: 500, json: { error: 'Server down' } })
  await page.goto('${FLIGHTS}');
  await expect(page.getByRole('alert')).toHaveText('${ERROR_TEXT}');
  // TODO: expect the 'Retry' button to be visible
});
`,
          solution: `${IMPORT}test('a server error shows a clear message', async ({ page }) => {
  await page.route('**/api/flights*', route => route.fulfill({ status: 500, json: { error: 'Server down' } }));
  await page.goto('${FLIGHTS}');
  await expect(page.getByRole('alert')).toHaveText('${ERROR_TEXT}');
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});`,
          minAssertions: 2,
          mustUse: [
            { pattern: 'page\\.route\\(', message: { en: "Mock the API with await page.route('**/api/flights*', ...).", mr: "API चं mock await page.route('**/api/flights*', ...) ने करा." } },
            { pattern: 'status:\\s*500', message: { en: 'Answer with route.fulfill({ status: 500, ... }).', mr: 'route.fulfill({ status: 500, ... }) ने उत्तर द्या.' } },
          ],
          mustCatch: [{ bug: 'error-silent', label: { en: 'Flights API fails, page shows "0 flights" and no error', mr: 'flights API fail होतो, page "0 flights" दाखवतं आणि error नाही' } }],
          hints: [
            { en: 'Press Run on the starter: the real server answers, 5 flights show, and the alert never comes.', mr: 'starter वर Run दाबा: खरा server उत्तर देतो, 5 flights दिसतात, आणि alert कधीच येत नाही.' },
            { en: 'The route goes before the goto, because the page asks for flights the moment it opens.', mr: 'route goto च्या आधी जातो, कारण page उघडताच flights मागतं.' },
            { en: "await page.route('**/api/flights*', route => route.fulfill({ status: 500, json: { error: 'Server down' } }));\n// ...goto and the alert check...\nawait expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();", mr: "await page.route('**/api/flights*', route => route.fulfill({ status: 500, json: { error: 'Server down' } }));\n// ...goto and the alert check...\nawait expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();" },
          ],
          successLine: { en: 'Caught. On the buggy build the alert never appeared, only "0 flights". The once-a-month failure is now tested on every release.', mr: 'पकडलं. buggy build वर alert कधी आलाच नाही, फक्त "0 flights". महिन्यातून एकदा होणारं failure आता प्रत्येक release ला तपासलं जातं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Theo wrote the same mock, but his test fails on the good build. Press Run and watch the browser. What went wrong?', mr: 'Theo ने तेच mock लिहिलं, पण त्याची test चांगल्या build वरही fail होते. Run दाबा आणि browser पाहा. काय चुकलं?' },
          playwrightSandbox: { code: ROUTE_TOO_LATE, startUrl: `${SKY}${FLIGHTS}` },
          options: [
            { en: 'route.fulfill cannot send a 500', mr: 'route.fulfill 500 पाठवू शकत नाही' },
            { en: 'The alert text has a typo', mr: 'alert च्या मजकुरात typo आहे' },
            { en: 'The pattern **/api/flights* does not match the request', mr: '**/api/flights* हा pattern request शी जुळत नाही' },
            { en: 'The route was set up after page.goto, so the flights request had already gone to the real server', mr: 'route page.goto नंतर लावला, म्हणून flights ची request आधीच खऱ्या server कडे गेली होती' },
          ],
          correct: [3],
          explain: { en: 'The page asked for flights while it loaded, before page.route existed. The real server answered with 5 flights, so there was never an error to show. Move page.route above page.goto.', mr: 'page load होत असताना, page.route अस्तित्वात येण्याआधीच, त्याने flights मागितल्या. खऱ्या server ने 5 flights दिल्या, म्हणून दाखवायला error कधी नव्हताच. page.route, page.goto च्या वर हलवा.' },
          hints: [
            { en: 'In the browser, did the flights load or not?', mr: 'browser मध्ये flights load झाल्या की नाही?' },
            { en: 'Compare the order of the first two lines with your test from the last step.', mr: 'पहिल्या दोन ओळींचा क्रम मागच्या step मधल्या तुमच्या test शी तुलना करा.' },
          ],
          successLine: { en: 'Kiran briefs the waiter before the customer walks in. A route works the same way.', mr: 'किरण ग्राहक आत येण्याआधीच वेटरला सांगतो. route सुद्धा असाच चालतो.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Two rare days, two tests. Test 1: mock an empty list (status 200, json: []) and check "0 flights" and the text "No flights found on this date.". Test 2: drop the connection once with route.abort() and { times: 1 }, check the alert, click Retry, and check the 5 real flights arrive.', mr: 'दोन दुर्मीळ दिवस, दोन tests. test 1: रिकाम्या list चं mock करा (status 200, json: []) आणि "0 flights" आणि "No flights found on this date." मजकूर तपासा. test 2: route.abort() आणि { times: 1 } ने connection एकदा तोडा, alert तपासा, Retry वर click करा, आणि 5 खऱ्या flights येतात हे तपासा.' },
          startUrl: `${SKY}${FLIGHTS}`,
          starter: `${IMPORT}test.describe('rare days on the flights page', () => {
  test('a day with no flights', async ({ page }) => {
    // TODO: route '**/api/flights*' to route.fulfill({ status: 200, json: [] })
    await page.goto('${FLIGHTS}');
    await expect(page.getByTestId('result-count')).toHaveText('0 flights');
    await expect(page.getByText('No flights found on this date.')).toBeVisible();
  });

  test('a dropped connection, then Retry works', async ({ page }) => {
    // TODO: route '**/api/flights*' to route.abort(), only once: { times: 1 }
    await page.goto('${FLIGHTS}');
    // TODO: expect the alert, click 'Retry', expect 5 flight cards
  });
});
`,
          solution: `${IMPORT}test.describe('rare days on the flights page', () => {
  test('a day with no flights', async ({ page }) => {
    await page.route('**/api/flights*', route => route.fulfill({ status: 200, json: [] }));
    await page.goto('${FLIGHTS}');
    await expect(page.getByTestId('result-count')).toHaveText('0 flights');
    await expect(page.getByText('No flights found on this date.')).toBeVisible();
  });

  test('a dropped connection, then Retry works', async ({ page }) => {
    await page.route('**/api/flights*', route => route.abort(), { times: 1 });
    await page.goto('${FLIGHTS}');
    await expect(page.getByRole('alert')).toHaveText('${ERROR_TEXT}');
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByTestId('flight-card')).toHaveCount(5);
  });
});`,
          minTests: 2,
          minAssertions: 4,
          mustUse: [
            { pattern: 'json:\\s*\\[\\s*\\]', message: { en: 'Test 1 needs an empty list: route.fulfill({ status: 200, json: [] }).', mr: 'test 1 ला रिकामी list हवी: route.fulfill({ status: 200, json: [] }).' } },
            { pattern: '\\.abort\\(', message: { en: 'Test 2 drops the connection with route.abort().', mr: 'test 2 route.abort() ने connection तोडते.' } },
            { pattern: 'times:\\s*1', message: { en: "Pass { times: 1 } as the third argument of page.route, so Retry reaches the real server.", mr: "page.route चा तिसरा argument म्हणून { times: 1 } द्या, म्हणजे Retry खऱ्या server पर्यंत पोहोचेल." } },
          ],
          mustCatch: [{ bug: 'error-silent', label: { en: 'A dropped connection shows "0 flights" and no error', mr: 'तुटलेलं connection "0 flights" दाखवतं आणि error नाही' } }],
          hints: [
            { en: 'Both routes go before the goto. The empty list is a normal 200 answer that simply has no flights in it.', mr: 'दोन्ही routes goto च्या आधी. रिकामी list म्हणजे flights नसलेलं साधं 200 उत्तर.' },
            { en: "{ times: 1 } is the third argument: page.route('**/api/flights*', route => route.abort(), { times: 1 });", mr: "{ times: 1 } हा तिसरा argument: page.route('**/api/flights*', route => route.abort(), { times: 1 });" },
            { en: `await page.route('**/api/flights*', route => route.abort(), { times: 1 });\nawait page.goto('${FLIGHTS}');\nawait expect(page.getByRole('alert')).toHaveText('${ERROR_TEXT}');\nawait page.getByRole('button', { name: 'Retry' }).click();\nawait expect(page.getByTestId('flight-card')).toHaveCount(5);`, mr: `await page.route('**/api/flights*', route => route.abort(), { times: 1 });\nawait page.goto('${FLIGHTS}');\nawait expect(page.getByRole('alert')).toHaveText('${ERROR_TEXT}');\nawait page.getByRole('button', { name: 'Retry' }).click();\nawait expect(page.getByTestId('flight-card')).toHaveCount(5);` },
          ],
          successLine: { en: 'An empty day says so honestly, and a dropped line recovers with Retry. Both used to be "we will test it when it happens".', mr: 'रिकामा दिवस तसं प्रामाणिकपणे सांगतो, आणि तुटलेली line Retry ने सावरते. दोन्ही आधी "होईल तेव्हा तपासू" या यादीत होत्या.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Change just one field of the real answer. In the route handler, get the real response with route.fetch(), set SH201\'s price to 99999, and send it on with route.fulfill({ response, json }). Then check the SH 201 card shows ₹99,999, and after sorting by Lowest price it is the last price and ₹3,600 is the first.', mr: 'खऱ्या उत्तरातलं फक्त एक field बदला. route handler मध्ये route.fetch() ने खरं response आणा, SH201 ची price 99999 करा, आणि route.fulfill({ response, json }) ने पुढे पाठवा. मग SH 201 card ₹99,999 दाखवतं, आणि Lowest price ने sort केल्यावर ती शेवटची price असते आणि ₹3,600 पहिली असते हे तपासा.' },
          startUrl: `${SKY}${FLIGHTS}`,
          starter: `${IMPORT}test('a very high fare shows correctly and sorts last', async ({ page }) => {
  await page.route('**/api/flights*', async route => {
    // TODO: const response = await route.fetch();
    // TODO: const flights = await response.json();
    // TODO: find the flight with id 'SH201' and set its price to 99999
    // TODO: await route.fulfill({ response, json: flights });
  });
  await page.goto('${FLIGHTS}');
  const card = page.getByTestId('flight-card').filter({ hasText: 'SH 201' });
  await expect(card.getByTestId('price')).toHaveText('₹99,999');
  await page.getByLabel('Sort by').selectOption('price');
  // TODO: expect the first price to be '₹3,600' and the last price to be '₹99,999'
});
`,
          solution: `${IMPORT}test('a very high fare shows correctly and sorts last', async ({ page }) => {
  await page.route('**/api/flights*', async route => {
    const response = await route.fetch();
    const flights = await response.json();
    const sh201 = flights.find(f => f.id === 'SH201');
    sh201.price = 99999;
    await route.fulfill({ response, json: flights });
  });
  await page.goto('${FLIGHTS}');
  const card = page.getByTestId('flight-card').filter({ hasText: 'SH 201' });
  await expect(card.getByTestId('price')).toHaveText('₹99,999');
  await page.getByLabel('Sort by').selectOption('price');
  await expect(page.getByTestId('price').first()).toHaveText('₹3,600');
  await expect(page.getByTestId('price').last()).toHaveText('₹99,999');
});`,
          minAssertions: 3,
          mustUse: [
            { pattern: 'route\\.fetch\\(', message: { en: 'Get the real answer first with await route.fetch().', mr: 'आधी await route.fetch() ने खरं उत्तर आणा.' } },
            { pattern: 'fulfill\\(\\s*\\{\\s*response', message: { en: 'Send it on with route.fulfill({ response, json: flights }).', mr: 'तो route.fulfill({ response, json: flights }) ने पुढे पाठवा.' } },
          ],
          mustCatch: [{ bug: 'sort-price', label: { en: 'Sort by Lowest price does nothing', mr: 'Lowest price ने sort केल्यावर काहीच होत नाही' } }],
          hints: [
            { en: 'The handler is async, because route.fetch() and response.json() both need await.', mr: 'handler async आहे, कारण route.fetch() आणि response.json() दोघांनाही await लागतो.' },
            { en: "const sh201 = flights.find(f => f.id === 'SH201');\nsh201.price = 99999;", mr: "const sh201 = flights.find(f => f.id === 'SH201');\nsh201.price = 99999;" },
            { en: "const response = await route.fetch();\nconst flights = await response.json();\nflights.find(f => f.id === 'SH201').price = 99999;\nawait route.fulfill({ response, json: flights });\n// ...and at the end:\nawait expect(page.getByTestId('price').first()).toHaveText('₹3,600');\nawait expect(page.getByTestId('price').last()).toHaveText('₹99,999');", mr: "const response = await route.fetch();\nconst flights = await response.json();\nflights.find(f => f.id === 'SH201').price = 99999;\nawait route.fulfill({ response, json: flights });\n// ...and at the end:\nawait expect(page.getByTestId('price').first()).toHaveText('₹3,600');\nawait expect(page.getByTestId('price').last()).toHaveText('₹99,999');" },
          ],
          successLine: { en: 'Everything real except one number. The comma format held, and the sort put the giant fare last. On the buggy build it stayed first.', mr: 'एक आकडा सोडून सगळं खरं. comma ची मांडणी टिकली, आणि sort ने मोठं भाडं शेवटी टाकलं. buggy build वर ते पहिलंच राहिलं.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'This test sometimes times out on the wait. Why?', mr: 'ही test कधी कधी wait वर timeout होते. का?' },
        code: "await page.getByRole('button', { name: 'Search flights' }).click();\nconst response = await page.waitForResponse('**/api/flights*');\nexpect(response.status()).toBe(200);",
        options: [
          { en: 'waitForResponse only works with full URLs', mr: 'waitForResponse फक्त पूर्ण URLs सोबत चालतो' },
          { en: 'The status should be checked with toBeVisible', mr: 'status toBeVisible ने तपासायला हवा' },
          { en: 'It starts listening after the click, so a fast response can arrive before anyone is waiting for it', mr: 'तो click नंतर ऐकायला सुरुवात करतो, म्हणून कोणी वाट पाहण्याआधीच जलद response येऊ शकतं' },
          { en: 'The click needs force: true', mr: 'click ला force: true हवं' },
        ],
        answer: 2,
        explain: { en: 'Start the wait first and keep the promise: const p = page.waitForResponse(...); then click; then const response = await p. That way no reply can slip past.', mr: 'आधी wait सुरू करा आणि promise ठेवा: const p = page.waitForResponse(...); मग click; मग const response = await p. त्यामुळे कोणतंही उत्तर निसटू शकत नाही.' },
      },
      {
        q: { en: 'Which handler makes the flights request fail like a dropped connection?', mr: 'कोणता handler flights ची request तुटलेल्या connection सारखी fail करतो?' },
        options: [
          'route => route.abort()',
          'route => route.continue()',
          'route => route.fulfill({ status: 200, json: [] })',
          'route => route.fetch()',
        ],
        answer: 0,
        explain: { en: 'abort() fails the request with no response at all. continue() sends it to the real server, fulfill answers it (here with an empty list), and fetch() only gets the real answer without deciding anything.', mr: 'abort() कोणत्याही response शिवाय request fail करतो. continue() ती खऱ्या server कडे पाठवतो, fulfill तिला उत्तर देतो (इथे रिकाम्या list ने), आणि fetch() काहीही न ठरवता फक्त खरं उत्तर आणतो.' },
      },
      {
        q: { en: 'Theo asks: "Why mock a 500 instead of testing against the real server?" The best answer?', mr: 'Theo विचारतो: "खऱ्या server विरुद्ध तपासण्याऐवजी 500 चं mock का करायचं?" सर्वात चांगलं उत्तर?' },
        options: [
          { en: 'Mocks make the real server faster', mr: 'mocks मुळे खरा server जलद होतो' },
          { en: 'Mocked tests never need assertions', mr: 'mock केलेल्या tests ना assertions लागत नाहीत' },
          { en: 'Because the real server has no errors', mr: 'कारण खऱ्या server मध्ये errors नसतातच' },
          { en: 'The real 500 is rare and random; the mock makes it happen on every run, the same way, so the error page is tested before each release', mr: 'खरा 500 क्वचित आणि अचानक येतो; mock तो प्रत्येक run मध्ये, त्याच पद्धतीने घडवतो, म्हणून प्रत्येक release आधी error page तपासलं जातं' },
        ],
        answer: 3,
        explain: { en: 'Mocking turns a rare situation into a stable, repeatable test. It checks how the UI handles that answer. Whether the real API sends correct data is checked separately with API tests.', mr: 'mocking दुर्मीळ प्रसंगाला स्थिर, पुन्हा चालवता येणाऱ्या test मध्ये बदलतं. UI ते उत्तर कसं हाताळतो ते ती तपासते. खरा API बरोबर data पाठवतो का, हे API tests ने वेगळं तपासलं जातं.' },
      },
      {
        q: { en: 'What does this route do?', mr: 'हा route काय करतो?' },
        code: "await page.route('**/api/flights*', async route => {\n  const response = await route.fetch();\n  const json = await response.json();\n  json[0].price = 99999;\n  await route.fulfill({ response, json });\n});",
        options: [
          { en: 'It blocks the flights request', mr: 'तो flights ची request अडवतो' },
          { en: 'It gets the real answer, changes the first flight\'s price, and passes the rest through unchanged', mr: 'तो खरं उत्तर आणतो, पहिल्या flight ची price बदलतो, आणि बाकी सगळं न बदलता पुढे पाठवतो' },
          { en: 'It changes the price in the real database', mr: 'तो खऱ्या database मधली price बदलतो' },
          { en: 'It sends two responses to the page', mr: 'तो page ला दोन responses पाठवतो' },
        ],
        answer: 1,
        explain: { en: 'route.fetch() asks the real server, you edit the JSON in memory, and fulfill({ response, json }) answers with the real status and headers plus your edited body. The server\'s data is not touched.', mr: 'route.fetch() खऱ्या server ला विचारतो, तुम्ही memory मधला JSON बदलता, आणि fulfill({ response, json }) खरा status आणि headers व तुमच्या बदललेल्या body सह उत्तर देतो. server च्या data ला हात लागत नाही.' },
      },
    ],
    recap: { line: { en: 'Start waitForResponse before the action and check status and JSON. Set page.route before goto: fulfill for any answer, abort for a dropped line, fetch plus fulfill to change one field. Rare cases become every-run tests.', mr: 'action आधी waitForResponse सुरू करा आणि status आणि JSON तपासा. goto आधी page.route लावा: कोणत्याही उत्तरासाठी fulfill, तुटलेल्या line साठी abort, एक field बदलायला fetch आणि fulfill. दुर्मीळ प्रसंग प्रत्येक run च्या tests बनतात.' }, icon: '📡' },
  },

  // ───────────────────────── W2.3 API testing with request, and UI plus API together
  {
    id: 'pw2-3',
    code: 'W2.3',
    level: 'intermediate',
    title: { en: 'API testing with request, and UI plus API together', mr: 'request ने API testing, आणि UI व API एकत्र' },
    skill: 'request fixture, get and post with data and headers, toBeOK, token login, API setup for UI tests, 409, UI vs API totals',
    realLife: {
      place: 'bank',
      title: { en: 'Baba\'s passbook and the bank SMS', mr: 'बाबांचं passbook आणि बँकेचा SMS' },
      story: {
        en: 'Meera\'s Baba deposits three cheques this month. To see them in the passbook he has to stand in the queue at the branch and wait for the printer: slow. The bank\'s SMS and net banking show the real records in seconds. So he checks the records first, quickly, then looks at the passbook only to see that it prints the same thing. One day the records showed three deposits, but the passbook printed only two: the printer skipped the newest one. Another time the passbook balance was ₹299 higher than the bank\'s own balance. When the screen and the records disagree, one of them is lying, and comparing the two is how Baba found out.',
        mr: 'मीराचे बाबा या महिन्यात तीन cheques भरतात. ते passbook मध्ये पाहण्यासाठी त्यांना शाखेत रांगेत उभं राहून printer ची वाट पाहावी लागते: हळू. बँकेचा SMS आणि net banking खऱ्या नोंदी काही सेकंदांत दाखवतात. म्हणून ते आधी नोंदी पटकन तपासतात, आणि मग passbook फक्त तेच छापतं का एवढं पाहतात. एके दिवशी नोंदींमध्ये तीन जमा दिसल्या, पण passbook ने फक्त दोनच छापल्या: printer ने सगळ्यात नवी नोंद सोडली. दुसऱ्या वेळी passbook मधली शिल्लक बँकेच्या स्वतःच्या शिलकेपेक्षा ₹299 जास्त होती. screen आणि नोंदी जुळत नाहीत तेव्हा त्यातलं एक खोटं बोलतं, आणि दोन्हींची तुलना करूनच बाबांना ते कळलं.',
      },
      scene: {
        type: 'match',
        leftTitle: { en: 'Bank records (API)', mr: 'बँकेच्या नोंदी (API)' },
        rightTitle: { en: 'Passbook (UI)', mr: 'passbook (UI)' },
        left: [
          { icon: '🧾', label: 'Cheque 1: ₹4,500', mr: 'cheque 1: ₹4,500' },
          { icon: '🧾', label: 'Cheque 2: ₹3,850', mr: 'cheque 2: ₹3,850' },
          { icon: '🧾', label: 'Cheque 3: ₹5,200 (new)', mr: 'cheque 3: ₹5,200 (नवा)' },
        ],
        right: [
          { icon: '📒', label: 'Line 1: ₹4,500', mr: 'ओळ 1: ₹4,500' },
          { icon: '📒', label: 'Line 2: ₹3,850', mr: 'ओळ 2: ₹3,850' },
        ],
        links: [
          [0, 0],
          [1, 1],
        ],
        mode: 'left',
      },
    },
    solves: {
      dialogue: [
        { who: 'gremlin', mood: 'smug', text: { en: '>> new bookings now vanish from my trips. the api says Confirmed. the page says nothing. which one do you trust? ⌁', mr: '>> नवी bookings आता my trips मधून गायब होतात. api म्हणतो Confirmed. page काहीच म्हणत नाही. कोणावर विश्वास ठेवणार? ⌁' } },
        { who: 'theo', mood: 'worried', text: { en: 'And our My trips tests are slow. Each one books a flight through four pages first, 40 seconds, before it checks a single card.', mr: 'आणि आपल्या My trips tests हळू आहेत. प्रत्येक test एकही card तपासण्याआधी चार pages मधून flight book करते, 40 सेकंद.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Then we book through the API in one second, and spend the UI time only on what the UI does. The request fixture talks to the server directly, in the same test file.', mr: 'मग आपण API ने एका सेकंदात book करू, आणि UI चा वेळ फक्त UI जे करतो त्यावर खर्च करू. request fixture त्याच test file मधून थेट server शी बोलतो.' } },
        { who: 'meera', mood: 'happy', text: { en: 'It is your Postman work, {name}: status, JSON, tokens. Only now the API check and the screen check sit side by side.', mr: 'हे तुमचंच Postman चं काम आहे, {name}: status, JSON, tokens. फक्त आता API चा check आणि screen चा check शेजारी शेजारी बसतात.' } },
      ],
      problem: { en: 'UI-only tests are slow because they build their data by clicking, and they cannot tell whether the screen and the server agree, so a booking that the server confirms but the page hides goes unnoticed.', mr: 'फक्त UI च्या tests हळू असतात कारण त्या clicks करून data तयार करतात, आणि screen आणि server जुळतात का हे त्यांना कळत नाही, म्हणून server ने confirm केलेलं पण page ने लपवलेलं booking लक्षात येत नाही.' },
      solution: { en: 'Use the request fixture to call the API: get and post with data and headers, expect(response).toBeOK(), check status and JSON. Log in through the API for a token, create test data through the API, then check the UI shows it, and compare what the screen says with what the server says.', mr: 'API ला बोलावण्यासाठी request fixture वापरा: data आणि headers सह get आणि post, expect(response).toBeOK(), status आणि JSON तपासा. token साठी API ने login करा, test data API ने तयार करा, मग UI ते दाखवतो का ते तपासा, आणि screen जे सांगते त्याची server जे सांगतो त्याच्याशी तुलना करा.' },
    },
    lesson: [
      { en: 'Ask for request next to page: async ({ page, request }) => { ... }. It sends HTTP calls straight to the server with the same base URL, with no browser involved: await request.get(\'/api/flights\', { params: { from: \'PNQ\', to: \'DEL\', date: \'2026-12-20\' } }) or await request.post(\'/api/login\', { data: { email, password } }). data is sent as JSON, like the Body tab in Postman.', mr: 'page च्या शेजारी request मागा: async ({ page, request }) => { ... }. तो त्याच base URL सह, browser शिवाय, थेट server कडे HTTP calls पाठवतो: await request.get(\'/api/flights\', { params: { from: \'PNQ\', to: \'DEL\', date: \'2026-12-20\' } }) किंवा await request.post(\'/api/login\', { data: { email, password } }). data JSON म्हणून जातो, Postman मधल्या Body tab सारखा.' },
      { en: 'Check the answer the way you did in Postman. await expect(response).toBeOK() passes for any 2xx status. For an exact code use expect(response.status()).toBe(201). const body = await response.json() gives you the data, then plain value checks: expect(body.total).toBe(4799), expect(list).toHaveLength(2). Negative cases matter just as much: a second booking of a taken seat must get 409 with a clear error.', mr: 'उत्तर Postman मध्ये तपासायचात तसंच तपासा. await expect(response).toBeOK() कोणत्याही 2xx status साठी pass होतो. नेमक्या code साठी expect(response.status()).toBe(201) वापरा. const body = await response.json() data देतो, मग साधे value checks: expect(body.total).toBe(4799), expect(list).toHaveLength(2). negative cases तितक्याच महत्त्वाच्या: घेतलेल्या seat चं दुसरं booking 409 आणि स्पष्ट error घेऊन परत यायला हवं.' },
      { en: 'Tokens: POST /api/login returns { token }. Send it on protected calls with headers: { Authorization: `Bearer ${token}` }. Without it, GET /api/trips says 401. This is also how a real project makes its storageState file: log in once through the API, not through the form fifty times.', mr: 'tokens: POST /api/login { token } परत देतो. protected calls वर तो headers: { Authorization: `Bearer ${token}` } ने पाठवा. तो नसेल तर GET /api/trips 401 म्हणतो. खरा project त्याची storageState file अशीच बनवतो: पन्नास वेळा form ने नव्हे, एकदा API ने login करून.' },
      { en: 'UI plus API together, two patterns. Arrange through the API, assert in the UI: create the booking with one POST, then open My trips and check the card. That is Baba checking the records, then the passbook. Or act in the UI, assert with the API: pay on the page, then compare the screen\'s total with the total the server saved. API setup makes UI tests fast and focused, and comparing the two sides catches bugs that neither side shows alone. In our lab the backend is shared, so data you create in a test is really there.', mr: 'UI आणि API एकत्र, दोन पद्धती. API ने तयारी, UI मध्ये assertion: एका POST ने booking तयार करा, मग My trips उघडून card तपासा. बाबा आधी नोंदी, मग passbook तपासतात तसंच. किंवा UI मध्ये action, API ने assertion: page वर pay करा, मग screen वरच्या total ची server ने जतन केलेल्या total शी तुलना करा. API setup मुळे UI tests जलद आणि नेमक्या होतात, आणि दोन्ही बाजूंची तुलना असे bugs पकडते जे एकटी कोणतीच बाजू दाखवत नाही. आपल्या lab मध्ये backend सामायिक आहे, म्हणून test मध्ये तयार केलेला data खरंच तिथे असतो.' },
    ],
    syntax: {
      template: `test('name', async ({ page, request }) => {
  const login = await request.post('/api/login', { data: { email: 'asha@skyhop.test', password: 'fly123' } });
  await expect(login).toBeOK();
  const { token } = await login.json();

  const res = await request.get('/api/trips', { headers: { Authorization: \`Bearer \${token}\` } });
  expect(res.status()).toBe(200);
  const trips = await res.json();
  expect(trips).toHaveLength(2);
});`,
      parts: [
        { code: 'async ({ page, request })', means: { en: 'ask for the request fixture: an HTTP client with the same base URL', mr: 'request fixture मागा: त्याच base URL चा HTTP client' } },
        { code: "request.get(url, { params, headers })", means: { en: 'a GET; params become the query string', mr: 'GET; params चं query string बनतं' } },
        { code: "request.post(url, { data, headers })", means: { en: 'a POST with a JSON body', mr: 'JSON body सह POST' } },
        { code: 'await expect(response).toBeOK()', means: { en: 'the status is between 200 and 299', mr: 'status 200 ते 299 च्या दरम्यान आहे' } },
        { code: 'response.status() / await response.json()', means: { en: 'the exact status code, and the body as data', mr: 'नेमका status code, आणि body data म्हणून' } },
        { code: 'headers: { Authorization: `Bearer ${token}` }', means: { en: 'prove who you are on protected calls', mr: 'protected calls वर तुम्ही कोण आहात ते सिद्ध करा' } },
      ],
      example: [
        { code: "const res = await request.post('/api/bookings', { data: booking });", note: { en: 'Baba deposits the cheque at the bank directly', mr: 'बाबा cheque थेट बँकेत भरतात' } },
        { code: 'expect(res.status()).toBe(201);', note: { en: 'the bank confirms: entry created', mr: 'बँक खात्री देते: नोंद झाली' } },
        { code: 'const { pnr } = await res.json();', note: { en: 'the receipt number from the SMS', mr: 'SMS मधला पावती नंबर' } },
        { code: "await page.goto('/trips');", note: { en: 'now open the passbook', mr: 'आता passbook उघडा' } },
        { code: "await expect(page.getByTestId('trip').filter({ hasText: pnr })).toBeVisible();", note: { en: 'the passbook must print the same entry', mr: 'passbook ने तीच नोंद छापायला हवी' } },
      ],
      pitfall: { en: 'response.json() and the request calls return promises: forget await and you get a Promise instead of data, so body.pnr is undefined. And toBeOK only says "some 2xx": when the exact code matters (201 Created, 409 Conflict), check response.status().', mr: 'response.json() आणि request calls promises देतात: await विसरलात तर data ऐवजी Promise मिळतो, म्हणून body.pnr undefined येतो. आणि toBeOK फक्त "कोणताही 2xx" सांगतो: नेमका code महत्त्वाचा असेल (201 Created, 409 Conflict) तेव्हा response.status() तपासा.' },
    },
    practice: {
      intro: { en: 'Pure API tests first, then API and UI in one test. The browser stays blank while only request runs; that is normal, no page is involved.', mr: 'आधी फक्त API च्या tests, मग एकाच test मध्ये API आणि UI. फक्त request चालत असताना browser रिकामा राहतो; ते साहजिक आहे, कोणतंही page वापरलं जात नाही.' },
      steps: [
        {
          kind: 'playwright',
          prompt: { en: 'Test the flights API directly. Test 1: GET /api/flights with params from PNQ, to DEL, date 2026-12-20; expect toBeOK, 5 flights, and SH412 priced 5200. Test 2: GET \'/api/flights?from=PNQ\' (no destination) must answer 400.', mr: 'flights API थेट तपासा. test 1: from PNQ, to DEL, date 2026-12-20 या params सह GET /api/flights; toBeOK, 5 flights, आणि SH412 ची price 5200 अपेक्षित. test 2: GET \'/api/flights?from=PNQ\' (destination शिवाय) 400 द्यायला हवा.' },
          startUrl: `${SKY}/`,
          starter: `${IMPORT}test('flights API answers with 5 flights', async ({ request }) => {
  const response = await request.get('/api/flights', { params: { from: 'PNQ', to: 'DEL', date: '2026-12-20' } });
  // TODO: await expect(response).toBeOK();
  const flights = await response.json();
  // TODO: expect 5 flights, and the flight with id 'SH412' to have price 5200
});

test('flights API refuses a search without a destination', async ({ request }) => {
  // TODO: GET '/api/flights?from=PNQ' and expect status 400
});
`,
          solution: `${IMPORT}test('flights API answers with 5 flights', async ({ request }) => {
  const response = await request.get('/api/flights', { params: { from: 'PNQ', to: 'DEL', date: '2026-12-20' } });
  await expect(response).toBeOK();
  const flights = await response.json();
  expect(flights).toHaveLength(5);
  const sh412 = flights.find(f => f.id === 'SH412');
  expect(sh412.price).toBe(5200);
});

test('flights API refuses a search without a destination', async ({ request }) => {
  const response = await request.get('/api/flights?from=PNQ');
  expect(response.status()).toBe(400);
});`,
          minTests: 2,
          minAssertions: 4,
          mustUse: [
            { pattern: 'toBeOK\\(', message: { en: 'Check the first response with await expect(response).toBeOK().', mr: 'पहिलं response await expect(response).toBeOK() ने तपासा.' } },
            { pattern: 'status\\(\\)\\)\\.toBe\\(\\s*400', message: { en: 'In test 2, check expect(response.status()).toBe(400).', mr: 'test 2 मध्ये expect(response.status()).toBe(400) तपासा.' } },
          ],
          hints: [
            { en: 'It is Postman in code: send, then check status and body. The body is a plain array after await response.json().', mr: 'हे code मधलं Postman आहे: पाठवा, मग status आणि body तपासा. await response.json() नंतर body साधा array असतो.' },
            { en: "flights.find(f => f.id === 'SH412') gives one flight object; check its .price.", mr: "flights.find(f => f.id === 'SH412') एक flight object देतो; त्याची .price तपासा." },
            { en: "await expect(response).toBeOK();\nexpect(flights).toHaveLength(5);\nexpect(flights.find(f => f.id === 'SH412').price).toBe(5200);\n\nconst bad = await request.get('/api/flights?from=PNQ');\nexpect(bad.status()).toBe(400);", mr: "await expect(response).toBeOK();\nexpect(flights).toHaveLength(5);\nexpect(flights.find(f => f.id === 'SH412').price).toBe(5200);\n\nconst bad = await request.get('/api/flights?from=PNQ');\nexpect(bad.status()).toBe(400);" },
          ],
          successLine: { en: 'Two API tests in well under a second, no browser at all. A happy path and a bad request, like your first Postman collection.', mr: 'एका सेकंदापेक्षा खूप कमी वेळात दोन API tests, browser अजिबात नाही. happy path आणि वाईट request, तुमच्या पहिल्या Postman collection सारखं.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Log in through the API. POST /api/login with Asha\'s email and password, expect toBeOK, read the token. Then GET /api/trips with the header Authorization: Bearer <token> and expect 2 trips, one of them SKY1A2. Test 2: GET /api/trips with no token must answer 401.', mr: 'API ने login करा. आशाचा email आणि password घेऊन POST /api/login, toBeOK अपेक्षित, token वाचा. मग Authorization: Bearer <token> header सह GET /api/trips आणि 2 trips अपेक्षित, त्यातली एक SKY1A2. test 2: token शिवाय GET /api/trips ने 401 द्यायला हवा.' },
          startUrl: `${SKY}/`,
          starter: `${IMPORT}test('the login token opens My trips', async ({ request }) => {
  const login = await request.post('/api/login', { data: { email: 'asha@skyhop.test', password: 'fly123' } });
  await expect(login).toBeOK();
  // TODO: read the token from login.json()
  // TODO: GET '/api/trips' with headers: { Authorization: 'Bearer ' + token }
  // TODO: expect toBeOK, 2 trips, and the PNRs to contain 'SKY1A2'
});

test('My trips without a token is refused', async ({ request }) => {
  // TODO: GET '/api/trips' with no headers and expect status 401
});
`,
          solution: `${IMPORT}test('the login token opens My trips', async ({ request }) => {
  const login = await request.post('/api/login', { data: { email: 'asha@skyhop.test', password: 'fly123' } });
  await expect(login).toBeOK();
  const { token } = await login.json();
  const response = await request.get('/api/trips', { headers: { Authorization: 'Bearer ' + token } });
  await expect(response).toBeOK();
  const trips = await response.json();
  expect(trips).toHaveLength(2);
  expect(trips.map(t => t.pnr)).toContain('SKY1A2');
});

test('My trips without a token is refused', async ({ request }) => {
  const response = await request.get('/api/trips');
  expect(response.status()).toBe(401);
});`,
          minTests: 2,
          minAssertions: 5,
          mustUse: [
            { pattern: 'Authorization', message: { en: "Send the token in headers: { Authorization: 'Bearer ' + token }.", mr: "token headers: { Authorization: 'Bearer ' + token } मध्ये पाठवा." } },
            { pattern: 'status\\(\\)\\)\\.toBe\\(\\s*401', message: { en: 'In test 2, check expect(response.status()).toBe(401).', mr: 'test 2 मध्ये expect(response.status()).toBe(401) तपासा.' } },
          ],
          hints: [
            { en: "const { token } = await login.json(); pulls the token out of the body.", mr: "const { token } = await login.json(); body मधून token काढतो." },
            { en: "The header value is the word Bearer, a space, then the token: 'Bearer ' + token", mr: "header ची value म्हणजे Bearer हा शब्द, एक space, मग token: 'Bearer ' + token" },
            { en: "const { token } = await login.json();\nconst response = await request.get('/api/trips', { headers: { Authorization: 'Bearer ' + token } });\nawait expect(response).toBeOK();\nconst trips = await response.json();\nexpect(trips).toHaveLength(2);\nexpect(trips.map(t => t.pnr)).toContain('SKY1A2');", mr: "const { token } = await login.json();\nconst response = await request.get('/api/trips', { headers: { Authorization: 'Bearer ' + token } });\nawait expect(response).toBeOK();\nconst trips = await response.json();\nexpect(trips).toHaveLength(2);\nexpect(trips.map(t => t.pnr)).toContain('SKY1A2');" },
          ],
          successLine: { en: 'A token in 0.3 seconds, no login form. And the door stays shut without it: 401.', mr: '0.3 सेकंदात token, login form नाही. आणि त्याशिवाय दार बंदच राहतं: 401.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Arrange through the API, assert in the UI. POST /api/bookings with the data given, expect 201 and read the PNR from the JSON. Then open My trips (the test is logged in with storageState) and check that trip card is visible and Confirmed, and the count says 3 trips.', mr: 'API ने तयारी, UI मध्ये assertion. दिलेल्या data सह POST /api/bookings, 201 अपेक्षित आणि JSON मधून PNR वाचा. मग My trips उघडा (test storageState ने login आहे) आणि ते trip card दिसतं आणि Confirmed आहे, आणि count 3 trips सांगतो हे तपासा.' },
          startUrl: `${SKY}/trips`,
          starter: `${IMPORT}test.use({ storageState: 'auth/asha.json' });

test('a booking made through the API shows in My trips', async ({ page, request }) => {
  const data = ${BOOKING_DATA};
  // TODO: POST '/api/bookings' with { data }, expect status 201
  // TODO: read the PNR: const { pnr } = await response.json();
  const pnr = 'SKY????';
  await page.goto('/trips');
  const trip = page.getByTestId('trip').filter({ hasText: pnr });
  await expect(trip).toBeVisible();
  await expect(trip.getByTestId('trip-status')).toHaveText('Confirmed');
  await expect(page.getByTestId('trip-count')).toHaveText('3 trips');
});
`,
          solution: `${IMPORT}test.use({ storageState: 'auth/asha.json' });

test('a booking made through the API shows in My trips', async ({ page, request }) => {
  const data = ${BOOKING_DATA};
  const response = await request.post('/api/bookings', { data });
  expect(response.status()).toBe(201);
  const { pnr } = await response.json();
  await page.goto('/trips');
  const trip = page.getByTestId('trip').filter({ hasText: pnr });
  await expect(trip).toBeVisible();
  await expect(trip.getByTestId('trip-status')).toHaveText('Confirmed');
  await expect(page.getByTestId('trip-count')).toHaveText('3 trips');
});`,
          minAssertions: 4,
          mustUse: [{ pattern: "request\\.post\\(\\s*['\"`]/api/bookings", message: { en: "Create the booking with await request.post('/api/bookings', { data }).", mr: "booking await request.post('/api/bookings', { data }) ने तयार करा." } }],
          mustCatch: [{ bug: 'trip-missing', label: { en: 'A new booking does not show in My trips', mr: 'नवं booking My trips मध्ये दिसत नाही' } }],
          hints: [
            { en: 'Replace the fake SKY???? line with the real PNR from the response.', mr: 'खोटी SKY???? ओळ response मधल्या खऱ्या PNR ने बदला.' },
            { en: "const response = await request.post('/api/bookings', { data });", mr: "const response = await request.post('/api/bookings', { data });" },
            { en: "const response = await request.post('/api/bookings', { data });\nexpect(response.status()).toBe(201);\nconst { pnr } = await response.json();", mr: "const response = await request.post('/api/bookings', { data });\nexpect(response.status()).toBe(201);\nconst { pnr } = await response.json();" },
          ],
          successLine: { en: 'Setup in one second instead of forty. And on the buggy build the server said Confirmed while My trips hid the card: caught.', mr: 'चाळीस ऐवजी एका सेकंदात setup. आणि buggy build वर server Confirmed म्हणाला पण My trips ने card लपवलं: पकडलं.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Two passengers race for seat 11B on SH 201, 2026-12-20. Book it once through the API (expect 201). Book the same seat again and expect 409 with the error "Seat 11B is already taken".', mr: 'दोन प्रवासी SH 201, 2026-12-20 वरच्या seat 11B साठी धडपडतात. API ने ती एकदा book करा (201 अपेक्षित). तीच seat पुन्हा book करा आणि "Seat 11B is already taken" या error सह 409 अपेक्षित.' },
          startUrl: `${SKY}/`,
          starter: `${IMPORT}test('the same seat cannot be sold twice', async ({ request }) => {
  const booking = {
    flightId: 'SH201', from: 'PNQ', to: 'DEL', date: '2026-12-20', pax: 1, seats: ['11B'],
    passenger: { name: 'Asha Patil', email: 'asha@skyhop.test', phone: '9822012345' },
  };
  const first = await request.post('/api/bookings', { data: booking });
  expect(first.status()).toBe(201);
  // TODO: post the same booking again
  // TODO: expect status 409 and the JSON error 'Seat 11B is already taken'
});
`,
          solution: `${IMPORT}test('the same seat cannot be sold twice', async ({ request }) => {
  const booking = {
    flightId: 'SH201', from: 'PNQ', to: 'DEL', date: '2026-12-20', pax: 1, seats: ['11B'],
    passenger: { name: 'Asha Patil', email: 'asha@skyhop.test', phone: '9822012345' },
  };
  const first = await request.post('/api/bookings', { data: booking });
  expect(first.status()).toBe(201);
  const second = await request.post('/api/bookings', { data: booking });
  expect(second.status()).toBe(409);
  const body = await second.json();
  expect(body.error).toBe('Seat 11B is already taken');
});`,
          minAssertions: 3,
          mustUse: [{ pattern: 'toBe\\(\\s*409', message: { en: 'Check the second answer with expect(second.status()).toBe(409).', mr: 'दुसरं उत्तर expect(second.status()).toBe(409) ने तपासा.' } }],
          mustCatch: [{ bug: 'seat-taken', label: { en: 'The API sells a seat that is already taken', mr: 'API आधीच घेतलेली seat विकतो' } }],
          hints: [
            { en: 'The backend remembers the first booking, so the second identical POST should clash.', mr: 'backend पहिलं booking लक्षात ठेवतो, म्हणून दुसरा तसाच POST टकरायला हवा.' },
            { en: '409 means Conflict. The reason is in the JSON body, in the error field.', mr: '409 म्हणजे Conflict. कारण JSON body मध्ये, error field मध्ये असतं.' },
            { en: "const second = await request.post('/api/bookings', { data: booking });\nexpect(second.status()).toBe(409);\nexpect((await second.json()).error).toBe('Seat 11B is already taken');", mr: "const second = await request.post('/api/bookings', { data: booking });\nexpect(second.status()).toBe(409);\nexpect((await second.json()).error).toBe('Seat 11B is already taken');" },
          ],
          successLine: { en: 'A double sale is hard to click in a UI test and easy to send twice through the API. On the buggy build the second POST got 201: two people, one seat.', mr: 'दुहेरी विक्री UI test मध्ये click करून घडवणं कठीण, पण API ने दोनदा पाठवणं सोपं. buggy build वर दुसऱ्या POST ला 201 मिळालं: दोन माणसं, एक seat.' },
        },
        {
          kind: 'playwright',
          prompt: { en: 'Act in the UI, assert with the API. On /passenger?demo=1, tick travel insurance and continue to payment. Read the total on screen as a number. Start waiting for the \'**/api/bookings\' response, click Pay, and check the screen total equals the total in the server\'s JSON.', mr: 'UI मध्ये action, API ने assertion. /passenger?demo=1 वर travel insurance tick करा आणि payment कडे जा. screen वरचा total आकडा म्हणून वाचा. \'**/api/bookings\' च्या response ची वाट पाहायला सुरुवात करा, Pay वर click करा, आणि screen वरचा total server च्या JSON मधल्या total इतकाच आहे हे तपासा.' },
          startUrl: `${SKY}/passenger?demo=1`,
          starter: `${IMPORT}test('the total on screen is what the server charges', async ({ page }) => {
  await page.goto('/passenger?demo=1');
  await page.getByLabel('Add travel insurance').check();
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(page).toHaveTitle('Payment | SkyHop');
  const shown = (await page.getByTestId('total').textContent()) ?? '';
  const screenTotal = Number(shown.replace(/[^0-9]/g, ''));
  // TODO: start waiting for the response of '**/api/bookings'
  await page.getByRole('button', { name: /^Pay/ }).click();
  // TODO: await it, read its JSON, and expect screenTotal to be the JSON's total
});
`,
          solution: `${IMPORT}test('the total on screen is what the server charges', async ({ page }) => {
  await page.goto('/passenger?demo=1');
  await page.getByLabel('Add travel insurance').check();
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(page).toHaveTitle('Payment | SkyHop');
  const shown = (await page.getByTestId('total').textContent()) ?? '';
  const screenTotal = Number(shown.replace(/[^0-9]/g, ''));
  const bookingPromise = page.waitForResponse('**/api/bookings');
  await page.getByRole('button', { name: /^Pay/ }).click();
  const booking = await (await bookingPromise).json();
  expect(screenTotal).toBe(booking.total);
});`,
          minAssertions: 2,
          mustUse: [
            { pattern: "waitForResponse\\([\\s\\S]*name:\\s*/\\^?Pay", message: { en: 'Start page.waitForResponse(\'**/api/bookings\') before the Pay click.', mr: 'Pay च्या click आधी page.waitForResponse(\'**/api/bookings\') सुरू करा.' } },
            { pattern: 'toBe\\(\\s*\\w+\\.total', message: { en: "Compare the two: expect(screenTotal).toBe(booking.total).", mr: "दोन्हींची तुलना करा: expect(screenTotal).toBe(booking.total)." } },
          ],
          mustCatch: [{ bug: 'total-wrong', label: { en: 'The screen counts insurance twice in the total', mr: 'screen total मध्ये insurance दोनदा मोजते' } }],
          hints: [
            { en: 'Same pattern as the last lesson: keep the waitForResponse promise in a const before the click, await it after.', mr: 'मागच्या lesson सारखीच पद्धत: click आधी waitForResponse चा promise एका const मध्ये ठेवा, नंतर await करा.' },
            { en: "const bookingPromise = page.waitForResponse('**/api/bookings');", mr: "const bookingPromise = page.waitForResponse('**/api/bookings');" },
            { en: "const bookingPromise = page.waitForResponse('**/api/bookings');\nawait page.getByRole('button', { name: /^Pay/ }).click();\nconst booking = await (await bookingPromise).json();\nexpect(screenTotal).toBe(booking.total);", mr: "const bookingPromise = page.waitForResponse('**/api/bookings');\nawait page.getByRole('button', { name: /^Pay/ }).click();\nconst booking = await (await bookingPromise).json();\nexpect(screenTotal).toBe(booking.total);" },
          ],
          successLine: { en: 'On the buggy build the screen said ₹5,098 and the server saved ₹4,799. Neither side looks wrong alone; side by side, the extra ₹299 is obvious.', mr: 'buggy build वर screen ₹5,098 म्हणाली आणि server ने ₹4,799 जतन केले. एकटी कोणतीच बाजू चुकीची दिसत नाही; शेजारी ठेवल्यावर जास्तीचे ₹299 लगेच दिसतात.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does await expect(response).toBeOK() check?', mr: 'await expect(response).toBeOK() काय तपासतो?' },
        options: [
          { en: 'That the JSON body is not empty', mr: 'JSON body रिकामी नाही' },
          { en: 'That the response came back in under 5 seconds', mr: 'response 5 सेकंदांच्या आत आलं' },
          { en: 'That the status is exactly 200', mr: 'status नेमका 200 आहे' },
          { en: 'That the status is in the 2xx range, such as 200 or 201', mr: 'status 2xx मध्ये आहे, जसं 200 किंवा 201' },
        ],
        answer: 3,
        explain: { en: 'toBeOK passes for any 200 to 299. When you need exactly 201 Created or a 409 Conflict, check expect(response.status()).toBe(...) instead.', mr: 'toBeOK 200 ते 299 मधल्या कोणत्याही status साठी pass होतो. नेमका 201 Created किंवा 409 Conflict हवा असेल तर त्याऐवजी expect(response.status()).toBe(...) तपासा.' },
      },
      {
        q: { en: 'Why create the booking with request.post before checking My trips in the UI?', mr: 'UI मध्ये My trips तपासण्याआधी booking request.post ने का तयार करायचं?' },
        options: [
          { en: 'Because the UI cannot make bookings', mr: 'कारण UI bookings करू शकत नाही' },
          { en: 'Setup takes a second instead of clicking through four pages, and the UI test checks only what My trips does', mr: 'चार pages मधून click करण्याऐवजी setup एका सेकंदात होतो, आणि UI test फक्त My trips काय करतं तेच तपासते' },
          { en: 'request.post skips the server and writes to the page directly', mr: 'request.post server ला वगळून थेट page वर लिहितो' },
          { en: 'So the test does not need any assertions', mr: 'म्हणजे test ला assertions लागणार नाहीत' },
        ],
        answer: 1,
        explain: { en: 'API setup makes UI tests fast and focused. The booking flow still gets its own UI test; every other test that only needs "a booking exists" creates it through the API.', mr: 'API setup मुळे UI tests जलद आणि नेमक्या होतात. booking च्या flow ची स्वतःची UI test असतेच; फक्त "एक booking आहे" एवढंच लागणारी बाकी प्रत्येक test ते API ने तयार करते.' },
      },
      {
        q: { en: 'On the good build, what does the second call return?', mr: 'चांगल्या build वर दुसरा call काय परत देतो?' },
        code: "const data = { flightId: 'SH201', date: '2026-12-20', pax: 1, seats: ['11B'], passenger };\nawait request.post('/api/bookings', { data });\nconst second = await request.post('/api/bookings', { data });",
        options: [
          { en: '201 Created, with a second PNR', mr: '201 Created, दुसऱ्या PNR सह' },
          { en: '401 Unauthorized, because there is no token', mr: '401 Unauthorized, कारण token नाही' },
          { en: '409 Conflict, with the error "Seat 11B is already taken"', mr: '409 Conflict, "Seat 11B is already taken" या error सह' },
          { en: '404 Not Found', mr: '404 Not Found' },
        ],
        answer: 2,
        explain: { en: 'The backend is shared and remembers the first booking, so the same seat on the same flight and date clashes. If a build answered 201 here, it would be selling one seat to two people.', mr: 'backend सामायिक आहे आणि पहिलं booking लक्षात ठेवतो, म्हणून त्याच flight आणि तारखेची तीच seat टकरते. एखाद्या build ने इथे 201 दिलं तर तो एकच seat दोघांना विकत असेल.' },
      },
      {
        q: { en: 'A test fails with this report. What does it tell you?', mr: 'एक test या report सह fail होते. तो काय सांगतो?' },
        code: 'expect(screenTotal).toBe(booking.total);\n\nError: expect(received).toBe(expected)\nExpected: 4799\nReceived: 5098',
        options: [
          { en: 'The screen showed ₹299 more than the server saved: the page adds something twice, a bug a UI-only check could miss', mr: 'server ने जतन केलेल्यापेक्षा screen ने ₹299 जास्त दाखवले: page काहीतरी दोनदा जोडतं, फक्त UI च्या check ला चुकू शकणारा bug' },
          { en: 'The server is too slow', mr: 'server खूप हळू आहे' },
          { en: 'toBe cannot compare numbers', mr: 'toBe आकड्यांची तुलना करू शकत नाही' },
          { en: 'The test forgot to log in', mr: 'test login करायला विसरली' },
        ],
        answer: 0,
        explain: { en: 'Received is the screen (5098), Expected is the server (4799). The difference, 299, is exactly the insurance: counted twice on the page. Comparing UI and API caught it.', mr: 'Received म्हणजे screen (5098), Expected म्हणजे server (4799). फरक, 299, नेमका insurance चा आहे: page वर दोनदा मोजलेला. UI आणि API ची तुलना करून तो पकडला.' },
      },
    ],
    recap: { line: { en: 'request.get and request.post talk to the API directly; check toBeOK, status() and json(). Log in via API for a token, set up data via API, then check the UI shows it and that the screen agrees with the server.', mr: 'request.get आणि request.post थेट API शी बोलतात; toBeOK, status() आणि json() तपासा. token साठी API ने login करा, data API ने तयार करा, मग UI ते दाखवतो का आणि screen server शी जुळते का ते तपासा.' }, icon: '🔌' },
  },
]
