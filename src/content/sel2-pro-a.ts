import type { Lesson } from './types.ts'

// Selenium 2, part 1: the Page Object Model (S2.1). Client: CareBridge Labs (diagnostics).

const LOGIN_PAGE_DONE = `class LoginPage {
  private WebDriver driver;
  private By username = By.id("username");
  private By password = By.id("password");
  private By loginButton = By.id("login-btn");
  private By error = By.id("login-error");

  public LoginPage(WebDriver driver) {
    this.driver = driver;
  }

  public void open() {
    driver.get("https://carebridge.test/login");
  }

  public void loginAs(String user, String pass) {
    driver.findElement(username).sendKeys(user);
    driver.findElement(password).sendKeys(pass);
    driver.findElement(loginButton).click();
  }

  public String errorText() {
    return driver.findElement(error).getText();
  }
}`

const DASHBOARD_PAGE = `class DashboardPage {
  private WebDriver driver;
  private By welcome = By.className("welcome");

  public DashboardPage(WebDriver driver) {
    this.driver = driver;
  }

  public String welcomeText() {
    return driver.findElement(welcome).getText();
  }
}`

export const selProLessonsA: Lesson[] = [
  // ───────────────────────── S2.1 Page Object Model
  {
    id: 'se2-1',
    code: 'S2.1',
    level: 'intermediate',
    title: { en: 'Page Object Model: One Place for Each Page', mr: 'Page Object Model: प्रत्येक page साठी एकच जागा' },
    skill: 'Page Object Model',
    realLife: {
      place: 'restaurant',
      title: { en: 'Order from the menu, not from the kitchen', mr: 'मेनूवरून ऑर्डर करा, स्वयंपाकघरातून नाही' },
      story: {
        en: 'At a Udupi restaurant on FC Road, Meera reads the menu card and says "one Masala Dosa". She does not walk into the kitchen and explain how to soak the rice, grind the batter and spread it on the tawa. The menu is the simple face, the kitchen hides the steps. One day the cook switches to a new tawa and a new batter recipe. The menu card stays the same, and every customer still just says "Masala Dosa". Only the kitchen changed.',
        mr: 'FC Road वरच्या एका उडुपी हॉटेलमध्ये मीरा मेनू कार्ड वाचते आणि म्हणते "एक मसाला डोसा". ती स्वयंपाकघरात जाऊन तांदूळ कसे भिजवायचे, पीठ कसं वाटायचं आणि तव्यावर कसं पसरायचं हे सांगत बसत नाही. मेनू हा साधा चेहरा आहे, स्वयंपाकघर पायऱ्या लपवतं. एके दिवशी आचारी नवा तवा आणि पिठाची नवी पद्धत वापरू लागतो. मेनू कार्ड तसंच राहतं, आणि प्रत्येक ग्राहक अजूनही फक्त "मसाला डोसा" म्हणतो. बदललं ते फक्त स्वयंपाकघर.',
      },
      scene: {
        type: 'match',
        leftTitle: { en: 'Menu card (what the test says)', mr: 'मेनू कार्ड (test काय म्हणते)' },
        rightTitle: { en: 'Kitchen (how the page does it)', mr: 'स्वयंपाकघर (page ते कसं करतं)' },
        left: [
          { icon: '🥞', label: 'Masala Dosa', mr: 'मसाला डोसा' },
          { icon: '☕', label: 'Filter coffee', mr: 'फिल्टर कॉफी' },
          { icon: '🍚', label: 'Idli sambar', mr: 'इडली सांबार' },
        ],
        right: [
          { icon: '🔥', label: 'Batter, tawa, potato bhaji', mr: 'पीठ, तवा, बटाट्याची भाजी' },
          { icon: '🫖', label: 'Decoction, milk, froth', mr: 'डिकॉक्शन, दूध, फेस' },
          { icon: '♨️', label: 'Steam idlis, boil sambar', mr: 'इडल्या वाफवा, सांबार उकळा' },
        ],
        links: [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
        mode: 'inner',
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'happy', text: { en: 'Welcome to CareBridge Labs, our diagnostics arm! Blood tests, reports, home sample pickup. We copied the clinic\'s Selenium tests to get started. Forty of them.', mr: 'CareBridge Labs मध्ये स्वागत, आमचा डायग्नॉस्टिक्स विभाग! रक्त तपासण्या, reports, घरून sample pickup. सुरुवात करायला आम्ही clinic च्या Selenium tests कॉपी केल्या. चाळीस tests.' } },
        { who: 'theo', mood: 'worried', text: { en: 'And this morning I renamed the login button\'s id. Forty tests went red. Every single one types By.id("login-btn") on its own.', mr: 'आणि आज सकाळी मी login बटणाचा id बदलला. चाळीस tests लाल झाल्या. प्रत्येक test स्वतःच By.id("login-btn") टाइप करते.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> change one id, break forty tests. best deal i ever got. ⌁', mr: '>> एक id बदला, चाळीस tests तोडा. माझा आजवरचा सगळ्यात फायद्याचा सौदा. ⌁' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Real suites use page objects. One class per page holds its locators and actions. Tests just say "log in as Asha", like ordering from a menu.', mr: 'खरे suites page objects वापरतात. प्रत्येक page साठी एक class, त्यात त्या page चे locators आणि actions. tests फक्त "Asha म्हणून login कर" म्हणतात, मेनूवरून ऑर्डर करावी तसं.' } },
        { who: 'meera', mood: 'happy', text: { en: 'One page, one class, {name}. Next time an id changes, you fix it in one place.', mr: 'एक page, एक class, {name}. पुढच्या वेळी id बदलला की तुम्ही तो एकाच ठिकाणी दुरुस्त कराल.' } },
      ],
      problem: { en: 'The same locators are copied into dozens of tests. One small change in the app breaks all of them, and fixing them means hunting through every file. The tests are also long and hard to read.', mr: 'तेच locators डझनभर tests मध्ये कॉपी झालेत. app मधला एक छोटा बदल सगळ्या tests तोडतो, आणि दुरुस्त करायला प्रत्येक file शोधावी लागते. tests लांबलचक आणि वाचायला अवघड सुद्धा आहेत.' },
      solution: { en: 'Use the Page Object Model: one class per page with private locator fields, a constructor that takes the driver, and methods like loginAs and errorText. Tests call those methods and keep the assertions.', mr: 'Page Object Model वापरा: प्रत्येक page साठी एक class, त्यात private locator fields, driver घेणारा constructor, आणि loginAs, errorText सारख्या methods. tests त्या methods वापरतात आणि assertions स्वतःकडे ठेवतात.' },
    },
    lesson: [
      { en: 'A page object is a Java class that stands for one page of the app. LoginPage knows where the username box is and how to log in. The test does not need to know. It only says what it wants.', mr: 'page object म्हणजे app च्या एका page चं प्रतिनिधित्व करणारा Java class. LoginPage ला username box कुठे आहे आणि login कसं करायचं हे माहीत असतं. test ला ते माहीत असण्याची गरज नाही. ती फक्त तिला काय हवं ते सांगते.' },
      { en: 'Inside the class: private By fields hold the locators (private By username = By.id("username");). A By only describes how to find an element, it does not search yet. A constructor receives the WebDriver, so the page can drive the browser. Methods do the work: actions like loginAs(user, pass), and readers like errorText() that return what the page shows.', mr: 'class मध्ये: private By fields locators ठेवतात (private By username = By.id("username");). By फक्त element कसा शोधायचा ते सांगतो, तो अजून शोधत नाही. constructor WebDriver घेतो, म्हणजे page browser चालवू शकतं. methods काम करतात: loginAs(user, pass) सारखे actions, आणि page वर जे दिसतं ते परत देणारे errorText() सारखे readers.' },
      { en: 'Tests become short and read like a test case: open the page, log in as Asha, check the welcome text. When an id changes, you change one field in one class, and all forty tests are fixed at once.', mr: 'tests लहान होतात आणि test case सारख्या वाचता येतात: page उघडा, Asha म्हणून login करा, welcome text तपासा. id बदलला की तुम्ही एका class मधली एक field बदलता, आणि चाळीसही tests एकाच वेळी दुरुस्त होतात.' },
      { en: 'The tester\'s rule: page objects report, tests judge. Keep Assert out of page objects. errorText() returns the text, and the test decides whether that text is right. Then the same page object works for happy tests and negative tests alike.', mr: 'टेस्टरचा नियम: page objects माहिती देतात, tests निर्णय घेतात. page objects मध्ये Assert ठेवू नका. errorText() मजकूर परत देतो, आणि तो बरोबर आहे की नाही हे test ठरवते. मग तोच page object happy tests आणि negative tests दोन्हींसाठी चालतो.' },
    ],
    syntax: {
      template: `class LoginPage {
  private WebDriver driver;
  private By username = By.id("username");
  private By loginButton = By.id("login-btn");

  public LoginPage(WebDriver driver) {
    this.driver = driver;
  }

  public void loginAs(String user, String pass) {
    driver.findElement(username).sendKeys(user);
    driver.findElement(By.id("password")).sendKeys(pass);
    driver.findElement(loginButton).click();
  }

  public String errorText() {
    return driver.findElement(By.id("login-error")).getText();
  }
}

LoginPage login = new LoginPage(driver);
login.loginAs("asha", "wrong");
Assert.assertEquals(login.errorText(), "Invalid username or password");`,
      parts: [
        { code: 'class LoginPage { ... }', means: { en: 'one class for one page: the menu card for the login page', mr: 'एका page साठी एक class: login page चं मेनू कार्ड' } },
        { code: 'private By username = By.id("username");', means: { en: 'a locator field: how to find the element, written once', mr: 'locator field: element कसा शोधायचा, एकदाच लिहिलेलं' } },
        { code: 'public LoginPage(WebDriver driver)', means: { en: 'the constructor: the page receives the browser it will drive', mr: 'constructor: page ला तो चालवणार असलेला browser मिळतो' } },
        { code: 'this.driver = driver;', means: { en: 'keep the browser in the field so every method can use it', mr: 'browser field मध्ये ठेवा, म्हणजे प्रत्येक method तो वापरू शकेल' } },
        { code: 'public void loginAs(String user, String pass)', means: { en: 'an action method: does the steps, returns nothing', mr: 'action method: पायऱ्या करते, काहीही परत देत नाही' } },
        { code: 'public String errorText()', means: { en: 'a reader method: returns what the page shows, no judging', mr: 'reader method: page वर जे दिसतं ते परत देते, निर्णय नाही' } },
      ],
      example: [
        { code: 'LoginPage login = new LoginPage(driver);', note: { en: 'pick up the menu card for this page', mr: 'या page चं मेनू कार्ड हातात घ्या' } },
        { code: 'login.open();', note: { en: 'walk into the restaurant', mr: 'हॉटेलमध्ये शिरा' } },
        { code: 'login.loginAs("asha", "care123");', note: { en: '"one Masala Dosa": the kitchen handles the steps', mr: '"एक मसाला डोसा": पायऱ्या स्वयंपाकघर सांभाळतं' } },
        { code: 'DashboardPage dash = new DashboardPage(driver);', note: { en: 'a new page, a new menu card', mr: 'नवं page, नवं मेनू कार्ड' } },
        { code: 'Assert.assertEquals(dash.welcomeText(), "Welcome, Asha Patil");', note: { en: 'the customer tastes and judges: the assertion lives in the test', mr: 'ग्राहक चव घेऊन ठरवतो: assertion test मध्येच राहतं' } },
      ],
      pitfall: { en: 'Do not hide Assert inside page object methods, and do not leave raw By.id(...) calls in your tests. The first makes the page object useless for negative tests. The second brings back the forty-places problem.', mr: 'page object च्या methods मध्ये Assert लपवू नका, आणि tests मध्ये थेट By.id(...) ठेवू नका. पहिल्यामुळे page object negative tests साठी निरुपयोगी होतो. दुसऱ्यामुळे चाळीस ठिकाणांचा प्रश्न परत येतो.' },
    },
    practice: {
      intro: { en: 'Time to build your first page objects. The class goes at the top of the editor, and the test code that uses it goes underneath.', mr: 'तुमचे पहिले page objects बनवायची वेळ. class editor मध्ये वर लिहायचा, आणि तो वापरणारा test code त्याखाली.' },
      steps: [
        {
          kind: 'selenium',
          prompt: { en: 'LoginPage has its locators and constructor, but two methods are empty. Fill in loginAs (type the user and password, click the button) and errorText (return the error\'s text). DashboardPage is done for you. The test below tries a wrong password first, then the right one. Run, then Submit.', mr: 'LoginPage मध्ये locators आणि constructor आहेत, पण दोन methods रिकाम्या आहेत. loginAs (user आणि password टाइप करा, बटण click करा) आणि errorText (error चा मजकूर परत द्या) भरा. DashboardPage तुमच्यासाठी तयार आहे. खालची test आधी चुकीचा password, मग बरोबर password वापरते. Run, मग Submit.' },
          startUrl: 'https://carebridge.test/login',
          minAssertions: 2,
          noSleep: true,
          mustUse: [
            { pattern: 'class\\s+LoginPage', message: { en: 'Keep the LoginPage class: the test must use it.', mr: 'LoginPage class ठेवा: test ने तोच वापरायला हवा.' } },
            { pattern: '\\.loginAs\\(', message: { en: 'Log in through the page object: login.loginAs(...).', mr: 'page object मधूनच login करा: login.loginAs(...).' } },
            { pattern: '\\.errorText\\(\\)', message: { en: 'Read the error through the page object: login.errorText().', mr: 'error page object मधूनच वाचा: login.errorText().' } },
          ],
          mustCatch: [
            { bug: 'login-error-hidden', label: { en: 'Wrong password shows no error', mr: 'चुकीच्या password ला error दिसत नाही' } },
            { bug: 'welcome-name', label: { en: 'Dashboard says "Welcome, undefined"', mr: 'dashboard वर "Welcome, undefined"' } },
          ],
          starter: `class LoginPage {
  private WebDriver driver;
  private By username = By.id("username");
  private By password = By.id("password");
  private By loginButton = By.id("login-btn");
  private By error = By.id("login-error");

  public LoginPage(WebDriver driver) {
    this.driver = driver;
  }

  public void open() {
    driver.get("https://carebridge.test/login");
  }

  public void loginAs(String user, String pass) {
    // TODO: type user into username, pass into password, click loginButton
  }

  public String errorText() {
    // TODO: return the text of the error element
    return "";
  }
}

${DASHBOARD_PAGE}

// ---------- the test ----------
LoginPage login = new LoginPage(driver);
login.open();
login.loginAs("asha", "wrong");
Assert.assertEquals(login.errorText(), "Invalid username or password");

login.open();
login.loginAs("asha", "care123");
DashboardPage dash = new DashboardPage(driver);
Assert.assertEquals(dash.welcomeText(), "Welcome, Asha Patil");
`,
          solution: `${LOGIN_PAGE_DONE}

${DASHBOARD_PAGE}

// ---------- the test ----------
LoginPage login = new LoginPage(driver);
login.open();
login.loginAs("asha", "wrong");
Assert.assertEquals(login.errorText(), "Invalid username or password");

login.open();
login.loginAs("asha", "care123");
DashboardPage dash = new DashboardPage(driver);
Assert.assertEquals(dash.welcomeText(), "Welcome, Asha Patil");
`,
          hints: [
            { en: 'Inside a page object you use the fields, not new locators: driver.findElement(username).sendKeys(user);', mr: 'page object मध्ये नवे locators नाही, fields वापरा: driver.findElement(username).sendKeys(user);' },
            { en: 'loginAs needs three lines: type into username, type into password, click loginButton.', mr: 'loginAs ला तीन ओळी लागतात: username मध्ये टाइप, password मध्ये टाइप, loginButton वर click.' },
            { en: 'errorText is one line: return driver.findElement(error).getText();', mr: 'errorText एकच ओळ: return driver.findElement(error).getText();' },
            {
              en: 'driver.findElement(username).sendKeys(user);\ndriver.findElement(password).sendKeys(pass);\ndriver.findElement(loginButton).click();\n...\nreturn driver.findElement(error).getText();',
              mr: 'driver.findElement(username).sendKeys(user);\ndriver.findElement(password).sendKeys(pass);\ndriver.findElement(loginButton).click();\n...\nreturn driver.findElement(error).getText();',
            },
          ],
          successLine: { en: 'Look at the test part: six short lines that read like a test case. Not one locator in sight.', mr: 'test चा भाग पाहा: test case सारख्या वाचता येणाऱ्या सहा छोट्या ओळी. एकही locator दिसत नाही.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Now write a page object yourself. Complete DoctorsPage with filterBy(String speciality), which chooses the speciality in the #speciality dropdown, and rowCount(), which returns how many tr.doctor-row rows are shown. Then use it: open the page, filter by Cardiology, and assert there are 2 doctors.', mr: 'आता स्वतः एक page object लिहा. DoctorsPage मध्ये filterBy(String speciality) लिहा, जी #speciality dropdown मध्ये speciality निवडते, आणि rowCount(), जी किती tr.doctor-row rows दिसतात ते परत देते. मग ते वापरा: page उघडा, Cardiology ने filter करा, आणि 2 डॉक्टर आहेत असं assert करा.' },
          startUrl: 'https://carebridge.test/doctors',
          minAssertions: 1,
          noSleep: true,
          mustUse: [
            { pattern: 'class\\s+DoctorsPage', message: { en: 'Keep the DoctorsPage class.', mr: 'DoctorsPage class ठेवा.' } },
            { pattern: 'void\\s+filterBy\\s*\\(\\s*String', message: { en: 'Write the method public void filterBy(String speciality) inside DoctorsPage.', mr: 'DoctorsPage मध्ये public void filterBy(String speciality) ही method लिहा.' } },
            { pattern: 'int\\s+rowCount\\s*\\(\\s*\\)', message: { en: 'Write the method public int rowCount() inside DoctorsPage.', mr: 'DoctorsPage मध्ये public int rowCount() ही method लिहा.' } },
            { pattern: '\\.filterBy\\(\\s*"Cardiology"\\s*\\)', message: { en: 'Use the page object in the test: doctors.filterBy("Cardiology").', mr: 'test मध्ये page object वापरा: doctors.filterBy("Cardiology").' } },
            { pattern: '\\.rowCount\\(\\)', message: { en: 'Assert on doctors.rowCount().', mr: 'doctors.rowCount() वर assert करा.' } },
          ],
          mustCatch: [
            { bug: 'filter-extra', label: { en: 'Cardiology filter also shows a General doctor', mr: 'Cardiology filter मध्ये एक General डॉक्टरही दिसतो' } },
          ],
          starter: `class DoctorsPage {
  private WebDriver driver;
  private By speciality = By.id("speciality");
  private By rows = By.cssSelector("tr.doctor-row");

  public DoctorsPage(WebDriver driver) {
    this.driver = driver;
  }

  public void open() {
    driver.get("https://carebridge.test/doctors");
  }

  // TODO 1: public void filterBy(String name)
  //         choose name in the speciality dropdown (use new Select(...))

  // TODO 2: public int rowCount()
  //         return how many rows are shown
}

// ---------- the test ----------
DoctorsPage doctors = new DoctorsPage(driver);
doctors.open();
// TODO 3: filter by "Cardiology" and assert that rowCount() is 2
`,
          solution: `class DoctorsPage {
  private WebDriver driver;
  private By speciality = By.id("speciality");
  private By rows = By.cssSelector("tr.doctor-row");

  public DoctorsPage(WebDriver driver) {
    this.driver = driver;
  }

  public void open() {
    driver.get("https://carebridge.test/doctors");
  }

  public void filterBy(String name) {
    new Select(driver.findElement(speciality)).selectByVisibleText(name);
  }

  public int rowCount() {
    return driver.findElements(rows).size();
  }
}

// ---------- the test ----------
DoctorsPage doctors = new DoctorsPage(driver);
doctors.open();
doctors.filterBy("Cardiology");
Assert.assertEquals(doctors.rowCount(), 2, "Cardiology doctors");
`,
          hints: [
            { en: 'filterBy uses Select on the speciality field: new Select(driver.findElement(speciality)).selectByVisibleText(name);', mr: 'filterBy speciality field वर Select वापरते: new Select(driver.findElement(speciality)).selectByVisibleText(name);' },
            { en: 'rowCount returns a number: public int rowCount() { return driver.findElements(rows).size(); }', mr: 'rowCount एक आकडा परत देते: public int rowCount() { return driver.findElements(rows).size(); }' },
            { en: 'The assertion stays in the test, not in the class: Assert.assertEquals(doctors.rowCount(), 2);', mr: 'assertion class मध्ये नाही, test मध्येच राहतं: Assert.assertEquals(doctors.rowCount(), 2);' },
            {
              en: 'public void filterBy(String name) {\n  new Select(driver.findElement(speciality)).selectByVisibleText(name);\n}\npublic int rowCount() {\n  return driver.findElements(rows).size();\n}\n...\ndoctors.filterBy("Cardiology");\nAssert.assertEquals(doctors.rowCount(), 2);',
              mr: 'public void filterBy(String name) {\n  new Select(driver.findElement(speciality)).selectByVisibleText(name);\n}\npublic int rowCount() {\n  return driver.findElements(rows).size();\n}\n...\ndoctors.filterBy("Cardiology");\nAssert.assertEquals(doctors.rowCount(), 2);',
            },
          ],
          successLine: { en: 'Dr. Arjun Shah and Dr. Sanjay Patil, exactly 2. If the filter ever lets a General doctor in, rowCount() says 3 and your test turns red.', mr: 'Dr. Arjun Shah आणि Dr. Sanjay Patil, बरोबर 2. filter ने कधी General डॉक्टर आत घेतला तर rowCount() 3 सांगेल आणि तुमची test लाल होईल.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Theo renames the login button from #login-btn to #signin. CareBridge Labs has 40 tests that log in. How many places must change without page objects (every test finds the button itself), and how many with a LoginPage?', mr: 'Theo login बटणाचं नाव #login-btn वरून #signin करतो. CareBridge Labs मध्ये login करणाऱ्या 40 tests आहेत. page objects शिवाय (प्रत्येक test स्वतः बटण शोधते) किती ठिकाणी बदल करावा लागेल, आणि LoginPage असेल तर किती?' },
          options: [
            { en: 'Without: 1. With: 40', mr: 'शिवाय: 1. सोबत: 40' },
            { en: 'Without: 40. With: 40', mr: 'शिवाय: 40. सोबत: 40' },
            { en: 'Without: 40. With: 1 (the loginButton field in LoginPage)', mr: 'शिवाय: 40. सोबत: 1 (LoginPage मधली loginButton field)' },
            { en: 'Without: 0. Selenium finds the new id by itself', mr: 'शिवाय: 0. Selenium नवा id आपोआप शोधतो' },
          ],
          correct: [2],
          explain: { en: 'Without page objects, all 40 tests contain By.id("login-btn"). With POM, only private By loginButton = By.id("signin"); changes, and all 40 tests are fixed together. Only the kitchen changed.', mr: 'page objects शिवाय, 40 ही tests मध्ये By.id("login-btn") आहे. POM सोबत फक्त private By loginButton = By.id("signin"); बदलतं, आणि 40 ही tests एकत्र दुरुस्त होतात. बदललं ते फक्त स्वयंपाकघर.' },
          hints: [
            { en: 'Where is By.id("login-btn") written in each case?', mr: 'प्रत्येक बाबतीत By.id("login-btn") कुठे लिहिलेलं आहे?' },
            { en: 'With POM, the tests only call login.loginAs(...). The locator lives in one field.', mr: 'POM सोबत tests फक्त login.loginAs(...) वापरतात. locator एकाच field मध्ये राहतो.' },
          ],
          successLine: { en: 'One field instead of forty files. That is why every serious suite uses page objects.', mr: 'चाळीस files ऐवजी एक field. म्हणूनच प्रत्येक गंभीर suite page objects वापरतो.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Rex reviews a teammate\'s page object. What is the problem with this method?\n\npublic void loginAs(String user, String pass) {\n  driver.findElement(username).sendKeys(user);\n  driver.findElement(password).sendKeys(pass);\n  driver.findElement(loginButton).click();\n  Assert.assertEquals(driver.getTitle(), "Dashboard | CareBridge");\n}', mr: 'Rex एका सहकाऱ्याचा page object तपासतो. या method मध्ये काय अडचण आहे?\n\npublic void loginAs(String user, String pass) {\n  driver.findElement(username).sendKeys(user);\n  driver.findElement(password).sendKeys(pass);\n  driver.findElement(loginButton).click();\n  Assert.assertEquals(driver.getTitle(), "Dashboard | CareBridge");\n}' },
          options: [
            { en: 'Nothing, assertions inside page objects save time', mr: 'काहीच नाही, page objects मधली assertions वेळ वाचवतात' },
            { en: 'The assertion belongs in the test. Now loginAs fails every wrong-password test before the test can check the error', mr: 'assertion test मध्ये हवं. आता चुकीच्या password च्या प्रत्येक test मध्ये, test error तपासण्याआधीच loginAs fail होतं' },
            { en: 'sendKeys cannot be used inside a class', mr: 'class मध्ये sendKeys वापरता येत नाही' },
            { en: 'The method should return a String', mr: 'method ने String परत द्यायला हवा' },
          ],
          correct: [1],
          explain: { en: 'Page objects report, tests judge. With the assert inside, loginAs("asha", "wrong") blows up on the title before your negative test can read errorText(). Move the check into the test.', mr: 'page objects माहिती देतात, tests निर्णय घेतात. assert आत असल्याने loginAs("asha", "wrong") तुमची negative test errorText() वाचायच्या आधीच title वर fail होतं. ती तपासणी test मध्ये हलवा.' },
          hints: [
            { en: 'Think about a test that logs in with a wrong password on purpose.', mr: 'मुद्दाम चुकीच्या password ने login करणाऱ्या test चा विचार करा.' },
            { en: 'Where should the decision "is this right?" live: in the page or in the test?', mr: '"हे बरोबर आहे का?" हा निर्णय कुठे असावा: page मध्ये की test मध्ये?' },
          ],
          successLine: { en: 'Exactly. Keep page objects neutral, and the same loginAs serves every test.', mr: 'बरोबर. page objects तटस्थ ठेवा, म्हणजे तोच loginAs प्रत्येक test ला उपयोगी पडतो.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'In a page object, what does this line do?', mr: 'page object मध्ये ही ओळ काय करते?' },
        code: 'private By username = By.id("username");',
        options: [
          { en: 'Finds the username box right away and types into it', mr: 'username box लगेच शोधते आणि त्यात टाइप करते' },
          { en: 'Stores how to find the username box, to be used later by the methods', mr: 'username box कसा शोधायचा ते साठवते, नंतर methods वापरतील' },
          { en: 'Creates a new username on the server', mr: 'server वर नवा username तयार करते' },
          { en: 'Checks that the username is correct', mr: 'username बरोबर आहे हे तपासते' },
        ],
        answer: 1,
        explain: { en: 'A By is only a description. Nothing is searched until a method calls driver.findElement(username).', mr: 'By हे फक्त वर्णन आहे. एखादी method driver.findElement(username) वापरेपर्यंत काहीच शोधलं जात नाही.' },
      },
      {
        q: { en: 'Where should Assert.assertEquals go when you use page objects?', mr: 'page objects वापरताना Assert.assertEquals कुठे असावं?' },
        options: [
          { en: 'Inside every page object method', mr: 'प्रत्येक page object method मध्ये' },
          { en: 'Only in the constructor', mr: 'फक्त constructor मध्ये' },
          { en: 'Nowhere, page objects make assertions unnecessary', mr: 'कुठेच नाही, page objects मुळे assertions ची गरज उरत नाही' },
          { en: 'In the test: page objects return values, the test judges them', mr: 'test मध्ये: page objects values परत देतात, test त्यांचा निर्णय घेते' },
        ],
        answer: 3,
        explain: { en: 'Page objects report, tests judge. That keeps one page object usable for both happy and negative tests.', mr: 'page objects माहिती देतात, tests निर्णय घेतात. त्यामुळे एकच page object happy आणि negative दोन्ही tests साठी वापरता येतो.' },
      },
      {
        q: { en: 'Why does a page object have this constructor?', mr: 'page object ला हा constructor का असतो?' },
        code: 'public LoginPage(WebDriver driver) {\n  this.driver = driver;\n}',
        options: [
          { en: 'So the page object has the browser it needs to find elements and click', mr: 'म्हणजे elements शोधायला आणि click करायला लागणारा browser page object कडे असतो' },
          { en: 'To open a second browser for each page', mr: 'प्रत्येक page साठी दुसरा browser उघडायला' },
          { en: 'To log in automatically', mr: 'आपोआप login करायला' },
          { en: 'Java requires every class to take a WebDriver', mr: 'Java मध्ये प्रत्येक class ने WebDriver घेणं बंधनकारक आहे' },
        ],
        answer: 0,
        explain: { en: 'The test hands over its own driver. this.driver = driver keeps it in the field, so loginAs and errorText can use it.', mr: 'test आपलाच driver देते. this.driver = driver तो field मध्ये ठेवतो, म्हणजे loginAs आणि errorText तो वापरू शकतात.' },
      },
      {
        q: { en: 'A suite of 30 tests uses LoginPage. The username box\'s id changes from "username" to "user-id". What must change?', mr: '30 tests चा suite LoginPage वापरतो. username box चा id "username" वरून "user-id" होतो. काय बदलावं लागेल?' },
        options: [
          { en: 'All 30 tests', mr: 'सगळ्या 30 tests' },
          { en: 'Nothing, Selenium adapts', mr: 'काहीच नाही, Selenium जुळवून घेतो' },
          { en: 'One field in LoginPage', mr: 'LoginPage मधली एक field' },
          { en: 'The TestNG version', mr: 'TestNG चं version' },
        ],
        answer: 2,
        explain: { en: 'private By username = By.id("user-id"); and every test is fixed. If the kitchen changes, only the kitchen changes.', mr: 'private By username = By.id("user-id"); आणि प्रत्येक test दुरुस्त. स्वयंपाकघर बदललं तर फक्त स्वयंपाकघरच बदलतं.' },
      },
    ],
    recap: { line: { en: 'One class per page: private locator fields, a constructor that takes the driver, action and reader methods. Tests stay short and keep the assertions.', mr: 'प्रत्येक page साठी एक class: private locator fields, driver घेणारा constructor, action आणि reader methods. tests लहान राहतात आणि assertions स्वतःकडे ठेवतात.' }, icon: '🧭' },
  },
]
