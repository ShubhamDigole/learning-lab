import type { Lesson } from './types.ts'

// Selenium 2 (part B): lists and loops over table rows, alerts and stale elements, TestNG setup/teardown and data-driven tests.
// The learner works on CareBridge's /doctors, /appointments and /login pages.

const APPTS_URL = 'https://carebridge.test/appointments'

export const selProLessonsB: Lesson[] = [
  // ───────────────────────── S2.2 Lists, tables and loops
  {
    id: 'se2-2',
    code: 'S2.2',
    level: 'intermediate',
    title: { en: 'Lists, Tables and Loops: Check Every Row', mr: 'Lists, Tables आणि Loops: प्रत्येक ओळ तपासा' },
    skill: 'findElements and loops',
    realLife: {
      place: 'school',
      title: { en: 'The homework register', mr: 'गृहपाठाचं रजिस्टर' },
      story: {
        en: 'Deshpande bai teaches class 7 in a Kothrud school. One lazy Monday she opens only the first notebook, Aarav\'s. It is perfect, so she writes "everyone done" in the register. On Tuesday the principal opens the pile and finds two empty notebooks. From then on she does it properly: she goes down the register row by row, opens every notebook, reads the name, checks the work and adds up the marks. When she says "all done", she has proof for every single row.',
        mr: 'देशपांडे बाई कोथरूडच्या एका शाळेत सातवीला शिकवतात. एका आळशी सोमवारी त्या फक्त पहिली वही उघडतात, आरवची. ती एकदम छान असते, म्हणून त्या रजिस्टरमध्ये "सगळ्यांचा झाला" असं लिहितात. मंगळवारी मुख्याध्यापक गठ्ठा उघडतात आणि दोन कोऱ्या वह्या सापडतात. तेव्हापासून बाई नीट काम करतात: रजिस्टरमध्ये ओळीने खाली जातात, प्रत्येक वही उघडतात, नाव वाचतात, काम तपासतात आणि मार्क्सची बेरीज करतात. आता त्या "सगळ्यांचा झाला" म्हणतात तेव्हा प्रत्येक ओळीचा पुरावा त्यांच्याकडे असतो.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Open every notebook, not only the first one', mr: 'फक्त पहिलीच नाही, प्रत्येक वही उघडा' },
        items: [
          { icon: '📗', label: 'Aarav', mr: 'आरव', pass: true },
          { icon: '📘', label: 'Bhakti', mr: 'भक्ती', pass: true },
          { icon: '📕', label: 'Chinmay', mr: 'चिन्मय', pass: false },
          { icon: '📙', label: 'Diya', mr: 'दिया', pass: true },
          { icon: '📓', label: 'Eshan', mr: 'ईशान', pass: false },
          { icon: '📒', label: 'Fatima', mr: 'फातिमा', pass: true },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'neutral', text: { en: 'Last release, someone tested the Cardiology filter by reading the first row. "Cardiology, works!" Then a patient booked a skin doctor for a heart problem.', mr: 'मागच्या release मध्ये कोणीतरी Cardiology filter फक्त पहिली ओळ वाचून test केला. "Cardiology, चालतंय!" मग एका पेशंटने हृदयाच्या त्रासासाठी त्वचेचा डॉक्टर बुक केला.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'row one is always pretty. i hide in row five. nobody scrolls to row five.', mr: 'पहिली ओळ नेहमी सुंदर असते. मी पाचव्या ओळीत लपतो. पाचव्या ओळीपर्यंत कोणीच जात नाही.' } },
        { who: 'rex', mood: 'happy', text: { en: 'A loop does. findElements hands you the whole table as a List, and a for-each loop walks through it row by row. Row five, row fifty, no complaints.', mr: 'loop जातो. findElements संपूर्ण table एका List मध्ये देतो, आणि for-each loop त्यातून ओळीने फिरतो. पाचवी ओळ, पन्नासावी ओळ, कुठलीही तक्रार नाही.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'Check every row, {name}. One good row only proves one good row.', mr: 'प्रत्येक ओळ तपासा, {name}. एक चांगली ओळ फक्त एवढंच सिद्ध करते की ती एक ओळ चांगली आहे.' } },
      ],
      problem: { en: 'A test that reads only the first matching element misses bugs in every other row. Checking dozens of rows by hand, every release, is slow and people skip it.', mr: 'फक्त पहिला element वाचणारी test बाकीच्या ओळींमधले bug चुकवते. प्रत्येक release ला डझनभर ओळी हाताने तपासणं हळू असतं, आणि लोक ते टाळतात.' },
      solution: { en: 'Collect all matching elements with findElements, check how many there are, then loop over the List and assert something about every single row.', mr: 'findElements ने सगळे जुळणारे elements गोळा करा, ते किती आहेत ते तपासा, आणि मग List वर loop चालवून प्रत्येक ओळीबद्दल assertion करा.' },
    },
    lesson: [
      { en: 'findElement (no s) gives you the first match, or throws NoSuchElementException. findElements (with an s) gives you a List<WebElement> with every match. It never throws: if nothing matches, you get an empty list whose size() is 0.', mr: 'findElement (s शिवाय) पहिला जुळणारा element देतो, नाहीतर NoSuchElementException टाकतो. findElements (s सह) प्रत्येक जुळणाऱ्या element ची List<WebElement> देतो. तो कधीच exception टाकत नाही: काहीच जुळलं नाही तर रिकामी list मिळते, जिचा size() 0 असतो.' },
      { en: 'A List is like the class register. rows.size() says how many rows. rows.get(0) is the first row, because counting starts at 0. The for-each loop for (WebElement row : rows) { ... } reads as "for every row in rows, do this". Inside the braces, row is the current row.', mr: 'List म्हणजे वर्गाचं रजिस्टर. rows.size() सांगतो किती ओळी आहेत. rows.get(0) म्हणजे पहिली ओळ, कारण मोजणी 0 पासून सुरू होते. for-each loop for (WebElement row : rows) { ... } असा वाचा: "rows मधल्या प्रत्येक row साठी हे करा". braces च्या आत row म्हणजे सध्याची ओळ.' },
      { en: 'To read a cell, search inside the row: row.findElement(By.className("fee")) looks only in that row, not the whole page. getText() always gives a String, like "500". To do maths, turn it into a number with Integer.parseInt("500"). Adding two Strings only glues them: "500" + "450" is "500450".', mr: 'एखादा cell वाचायला row च्या आत शोधा: row.findElement(By.className("fee")) फक्त त्या ओळीत पाहतो, संपूर्ण page मध्ये नाही. getText() नेहमी String देतो, जसं "500". गणित करायचं तर Integer.parseInt("500") ने त्याचा number करा. दोन Strings ची बेरीज म्हणजे फक्त जोडणं: "500" + "450" म्हणजे "500450".' },
      { en: 'The tester\'s angle: first assert the count, then assert something for every row. If the page shows zero rows, a loop never runs, so its assertions never run and the test passes on a broken page. Also put the row\'s name in the assertion message, so a failure reads "Dr. Kavita Rao expected [Cardiology] but found [General]".', mr: 'टेस्टरचा दृष्टिकोन: आधी संख्येचं assertion, मग प्रत्येक ओळीबद्दल assertion. page वर शून्य ओळी असतील तर loop चालतच नाही, म्हणजे त्यातली assertions चालत नाहीत आणि बिघडलेल्या page वरही test pass होते. आणि assertion message मध्ये ओळीचं नाव टाका, म्हणजे failure असं वाचता येईल: "Dr. Kavita Rao expected [Cardiology] but found [General]".' },
    ],
    syntax: {
      template: 'List<WebElement> rows = driver.findElements(By.cssSelector("tr.doctor-row"));\nAssert.assertEquals(rows.size(), 6);\n\nfor (WebElement row : rows) {\n    String name = row.findElement(By.className("name")).getText();\n    int fee = Integer.parseInt(row.findElement(By.className("fee")).getText());\n}',
      parts: [
        { code: 'driver.findElements(...)', means: { en: 'every element that matches, as a List (empty if none, never an exception)', mr: 'जुळणारे सगळे elements, एका List मध्ये (काहीच नसेल तर रिकामी, exception कधीच नाही)' } },
        { code: 'List<WebElement> rows', means: { en: 'a variable that holds a list of web elements', mr: 'web elements ची list ठेवणारा variable' } },
        { code: 'rows.size()', means: { en: 'how many items are in the list', mr: 'list मध्ये किती items आहेत' } },
        { code: 'rows.get(0)', means: { en: 'the first item (counting starts at 0, the last is get(size() - 1))', mr: 'पहिला item (मोजणी 0 पासून, शेवटचा म्हणजे get(size() - 1))' } },
        { code: 'for (WebElement row : rows) { }', means: { en: 'for-each loop: run the block once for every row', mr: 'for-each loop: प्रत्येक row साठी block एकदा चालवा' } },
        { code: 'row.findElement(...)', means: { en: 'search inside this one row only', mr: 'फक्त या एका ओळीच्या आत शोधा' } },
        { code: 'Integer.parseInt("500")', means: { en: 'turn text into a whole number you can add', mr: 'text चा पूर्णांक number करा, जो बेरजेत वापरता येतो' } },
      ],
      example: [
        { code: 'List<WebElement> rows = driver.findElements(By.cssSelector("tr.doctor-row"));', note: { en: 'bai opens the register: every row at once', mr: 'बाई रजिस्टर उघडतात: सगळ्या ओळी एकदम' } },
        { code: 'System.out.println(rows.size());', note: { en: 'prints 6: six names in the register', mr: '6 print होतं: रजिस्टरमध्ये सहा नावं' } },
        { code: 'System.out.println(rows.get(0).findElement(By.className("name")).getText());', note: { en: 'the first row (index 0): Dr. Meera Kulkarni', mr: 'पहिली ओळ (index 0): Dr. Meera Kulkarni' } },
        { code: 'int total = 0;', note: { en: 'the marks total starts at zero', mr: 'मार्क्सची बेरीज शून्यापासून सुरू' } },
        { code: 'for (WebElement row : rows) { total = total + Integer.parseInt(row.findElement(By.className("fee")).getText()); }', note: { en: 'open every notebook and add its marks', mr: 'प्रत्येक वही उघडा आणि तिचे मार्क्स जोडा' } },
        { code: 'Assert.assertEquals(total, 4850);', note: { en: 'the class total matches: 500 + 1200 + 700 + 900 + 450 + 1100', mr: 'वर्गाची बेरीज जुळते: 500 + 1200 + 700 + 900 + 450 + 1100' } },
      ],
      pitfall: { en: 'Inside the loop, use row.findElement, not driver.findElement. driver.findElement(By.className("name")) searches the whole page and always returns the first name, so your loop reads Dr. Meera Kulkarni six times.', mr: 'loop च्या आत row.findElement वापरा, driver.findElement नाही. driver.findElement(By.className("name")) संपूर्ण page मध्ये शोधतो आणि नेहमी पहिलंच नाव देतो, म्हणजे तुमचा loop सहा वेळा Dr. Meera Kulkarni वाचतो.' },
    },
    practice: {
      intro: { en: 'The Doctors page (https://carebridge.test/doctors) needs no login. Each doctor is a tr with class doctor-row, and its cells have the classes name, speciality, fee and rating. Time to read the whole register.', mr: 'Doctors page (https://carebridge.test/doctors) ला login लागत नाही. प्रत्येक डॉक्टर म्हणजे doctor-row class असलेला एक tr, आणि त्याच्या cells ना name, speciality, fee आणि rating हे classes आहेत. आता संपूर्ण रजिस्टर वाचूया.' },
      steps: [
        {
          kind: 'selenium',
          prompt: { en: 'Open the Doctors page, collect every doctor row with findElements, and assert that there are exactly 6 rows.', mr: 'Doctors page उघडा, findElements ने डॉक्टरांच्या सगळ्या ओळी गोळा करा, आणि बरोबर 6 ओळी आहेत असं assert करा.' },
          starter: `driver.get("https://carebridge.test/doctors");
// TODO: collect every row: driver.findElements(By.cssSelector("tr.doctor-row"))
// TODO: assert that the list has 6 rows
`,
          solution: `driver.get("https://carebridge.test/doctors");
List<WebElement> rows = driver.findElements(By.cssSelector("tr.doctor-row"));
Assert.assertEquals(rows.size(), 6);
`,
          minAssertions: 1,
          mustUse: [{ pattern: 'findElements\\(', message: { en: 'Use driver.findElements (with an s) to get every row as a List.', mr: 'प्रत्येक ओळ List मध्ये मिळवायला driver.findElements (s सह) वापरा.' } }],
          hints: [
            { en: 'findElements (with an s) gives back a List. Keep it in a variable: List<WebElement> rows = ...', mr: 'findElements (s सह) एक List परत देतो. ती variable मध्ये ठेवा: List<WebElement> rows = ...' },
            { en: 'The number of items in the list is rows.size(). Compare it with 6 using Assert.assertEquals(actual, expected).', mr: 'list मधल्या items ची संख्या म्हणजे rows.size(). Assert.assertEquals(actual, expected) ने ती 6 शी तुलना करा.' },
            { en: 'List<WebElement> rows = driver.findElements(By.cssSelector("tr.doctor-row"));\nAssert.assertEquals(rows.size(), 6);', mr: 'List<WebElement> rows = driver.findElements(By.cssSelector("tr.doctor-row"));\nAssert.assertEquals(rows.size(), 6);' },
          ],
          successLine: { en: 'Six rows, counted by the robot. You just opened the whole register in one line.', mr: 'सहा ओळी, robot ने मोजल्या. एका ओळीत तुम्ही संपूर्ण रजिस्टर उघडलं.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Now read the register aloud. Inside the loop, find the cell with class "name" in the current row and print its text. You should print all six doctor names, one per line, in table order.', mr: 'आता रजिस्टर मोठ्याने वाचा. loop च्या आत, सध्याच्या row मधला "name" class असलेला cell शोधा आणि त्याचा text print करा. सहाही डॉक्टरांची नावं, एका ओळीत एक, table च्या क्रमाने print व्हायला हवीत.' },
          starter: `driver.get("https://carebridge.test/doctors");
List<WebElement> rows = driver.findElements(By.cssSelector("tr.doctor-row"));
for (WebElement row : rows) {
    // TODO: find the cell with class "name" inside this row and print its text
}
`,
          solution: `driver.get("https://carebridge.test/doctors");
List<WebElement> rows = driver.findElements(By.cssSelector("tr.doctor-row"));
for (WebElement row : rows) {
    String name = row.findElement(By.className("name")).getText();
    System.out.println(name);
}
`,
          output: ['Dr. Meera Kulkarni', 'Dr. Arjun Shah', 'Dr. Neha Joshi', 'Dr. Imran Sheikh', 'Dr. Kavita Rao', 'Dr. Sanjay Patil'],
          mustUse: [{ pattern: 'for\\s*\\(', message: { en: 'Use a for-each loop over rows, so the code works for any number of doctors.', mr: 'rows वर for-each loop वापरा, म्हणजे कितीही डॉक्टर असले तरी code चालेल.' } }],
          hints: [
            { en: 'Inside the braces, row is the current row. Search inside it with row.findElement(...).', mr: 'braces च्या आत row म्हणजे सध्याची ओळ. तिच्या आत row.findElement(...) ने शोधा.' },
            { en: 'If you see the same name six times, you used driver.findElement. That searches the whole page and always finds the first name.', mr: 'तेच नाव सहा वेळा दिसलं तर तुम्ही driver.findElement वापरलं. तो संपूर्ण page मध्ये शोधतो आणि नेहमी पहिलंच नाव सापडतं.' },
            { en: 'String name = row.findElement(By.className("name")).getText();\nSystem.out.println(name);', mr: 'String name = row.findElement(By.className("name")).getText();\nSystem.out.println(name);' },
          ],
          successLine: { en: 'Six names, six lines, in order. The loop visited every row exactly once.', mr: 'सहा नावं, सहा ओळी, क्रमाने. loop ने प्रत्येक ओळीला बरोबर एकदा भेट दिली.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Add up every doctor\'s fee. The loop already reads each fee as text. Turn it into a number with Integer.parseInt, add it to total, and after the loop assert that total is 4850.', mr: 'प्रत्येक डॉक्टरची fee जोडा. loop आधीच प्रत्येक fee text म्हणून वाचतो. Integer.parseInt ने त्याचा number करा, total मध्ये जोडा, आणि loop नंतर total 4850 आहे असं assert करा.' },
          starter: `driver.get("https://carebridge.test/doctors");
List<WebElement> rows = driver.findElements(By.cssSelector("tr.doctor-row"));
int total = 0;
for (WebElement row : rows) {
    String feeText = row.findElement(By.className("fee")).getText();
    // TODO: turn feeText into a number and add it to total
}
// TODO: assert that total is 4850
`,
          solution: `driver.get("https://carebridge.test/doctors");
List<WebElement> rows = driver.findElements(By.cssSelector("tr.doctor-row"));
int total = 0;
for (WebElement row : rows) {
    String feeText = row.findElement(By.className("fee")).getText();
    total = total + Integer.parseInt(feeText);
}
System.out.println("Total fees: " + total);
Assert.assertEquals(total, 4850);
`,
          minAssertions: 1,
          mustUse: [{ pattern: 'Integer\\.parseInt\\(', message: { en: 'Turn the fee text into a number with Integer.parseInt(feeText) before adding it.', mr: 'जोडण्याआधी Integer.parseInt(feeText) ने fee च्या text चा number करा.' } }],
          hints: [
            { en: 'feeText is a String like "500". Integer.parseInt(feeText) gives the number 500.', mr: 'feeText हा "500" सारखा String आहे. Integer.parseInt(feeText) ने number 500 मिळतो.' },
            { en: 'Grow the total inside the loop: total = total + ...; Put the assertion after the closing brace, so it runs once at the end.', mr: 'loop च्या आत total वाढवा: total = total + ...; assertion closing brace नंतर ठेवा, म्हणजे ते शेवटी एकदाच चालेल.' },
            { en: 'total = total + Integer.parseInt(feeText);\n...\nAssert.assertEquals(total, 4850);', mr: 'total = total + Integer.parseInt(feeText);\n...\nAssert.assertEquals(total, 4850);' },
          ],
          successLine: { en: '4850, the same as 500 + 1200 + 700 + 900 + 450 + 1100. Numbers you can do maths with, read straight from the page.', mr: '4850, म्हणजे 500 + 1200 + 700 + 900 + 450 + 1100. page वरून थेट वाचलेले, गणित करता येणारे numbers.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'The real mission. Pick Cardiology in the speciality filter, then prove that every row left in the table is a Cardiology doctor. First assert the list is not empty, then loop and assert each row\'s speciality cell says "Cardiology". Put the doctor\'s name in the assertion message. Submit runs your test on hidden buggy builds too.', mr: 'खरं मिशन. speciality filter मध्ये Cardiology निवडा, आणि मग table मध्ये उरलेली प्रत्येक ओळ Cardiology डॉक्टरचीच आहे हे सिद्ध करा. आधी list रिकामी नाही असं assert करा, मग loop चालवून प्रत्येक ओळीचा speciality cell "Cardiology" म्हणतो असं assert करा. assertion message मध्ये डॉक्टरचं नाव टाका. Submit तुमची test लपवलेल्या बग असलेल्या builds वरही चालवतो.' },
          starter: `driver.get("https://carebridge.test/doctors");
new Select(driver.findElement(By.id("speciality"))).selectByVisibleText("Cardiology");
List<WebElement> rows = driver.findElements(By.cssSelector("tr.doctor-row"));
// TODO: assert that rows is not empty
// TODO: loop over rows and assert each row's "speciality" cell is "Cardiology"
`,
          solution: `driver.get("https://carebridge.test/doctors");
new Select(driver.findElement(By.id("speciality"))).selectByVisibleText("Cardiology");
List<WebElement> rows = driver.findElements(By.cssSelector("tr.doctor-row"));
Assert.assertFalse(rows.isEmpty(), "No doctors shown");
for (WebElement row : rows) {
    String name = row.findElement(By.className("name")).getText();
    String speciality = row.findElement(By.className("speciality")).getText();
    Assert.assertEquals(speciality, "Cardiology", name);
}
`,
          minAssertions: 2,
          mustUse: [{ pattern: 'for\\s*\\(', message: { en: 'Loop over the rows and check each one. Counting alone does not prove what is inside each row.', mr: 'ओळींवर loop चालवा आणि प्रत्येक तपासा. फक्त मोजण्याने प्रत्येक ओळीत काय आहे ते सिद्ध होत नाही.' } }],
          mustCatch: [{ bug: 'filter-extra', label: { en: 'The Cardiology filter also shows a General doctor', mr: 'Cardiology filter एक General डॉक्टरही दाखवतो' } }],
          hints: [
            { en: 'rows.isEmpty() is true when the list has nothing. Assert.assertFalse(rows.isEmpty(), "No doctors shown") guards against a silent empty loop.', mr: 'list मध्ये काहीच नसेल तर rows.isEmpty() true असतं. Assert.assertFalse(rows.isEmpty(), "No doctors shown") रिकाम्या, शांत loop पासून वाचवतो.' },
            { en: 'In the loop, read two cells from the row: class "name" and class "speciality".', mr: 'loop मध्ये row मधून दोन cells वाचा: class "name" आणि class "speciality".' },
            { en: 'The third argument of assertEquals is the message. Passing the name makes the failure say which doctor is wrong.', mr: 'assertEquals चा तिसरा argument म्हणजे message. नाव दिलं की failure सांगतो कोणता डॉक्टर चुकीचा आहे.' },
            { en: 'for (WebElement row : rows) {\n    String name = row.findElement(By.className("name")).getText();\n    String speciality = row.findElement(By.className("speciality")).getText();\n    Assert.assertEquals(speciality, "Cardiology", name);\n}', mr: 'for (WebElement row : rows) {\n    String name = row.findElement(By.className("name")).getText();\n    String speciality = row.findElement(By.className("speciality")).getText();\n    Assert.assertEquals(speciality, "Cardiology", name);\n}' },
          ],
          successLine: { en: 'Caught it: on the buggy build Dr. Kavita Rao (General) sneaks into the Cardiology list, and your loop names her. Row five has nowhere to hide.', mr: 'पकडलं: बग असलेल्या build वर Dr. Kavita Rao (General) Cardiology यादीत घुसतात, आणि तुमचा loop त्यांचं नाव सांगतो. पाचव्या ओळीला आता लपायला जागा नाही.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'The page has no element with class "slot". What does driver.findElements(By.className("slot")) give you?', mr: 'page वर "slot" class असलेला एकही element नाही. driver.findElements(By.className("slot")) काय देतो?' },
        options: [
          { en: 'It throws NoSuchElementException', mr: 'तो NoSuchElementException टाकतो' },
          { en: 'It returns null', mr: 'तो null परत देतो' },
          { en: 'An empty list, whose size() is 0', mr: 'रिकामी list, जिचा size() 0 असतो' },
          { en: 'It waits forever for a slot', mr: 'तो slot ची कायम वाट पाहतो' },
        ],
        answer: 2,
        explain: { en: 'findElements never throws for "nothing found". It hands back an empty list. Only findElement (no s) throws NoSuchElementException.', mr: '"काहीच सापडलं नाही" यासाठी findElements कधीच exception टाकत नाही. तो रिकामी list देतो. फक्त findElement (s शिवाय) NoSuchElementException टाकतो.' },
      },
      {
        q: { en: 'rows holds the 6 doctor rows. Which line gives you the last row?', mr: 'rows मध्ये डॉक्टरांच्या 6 ओळी आहेत. कोणती ओळ शेवटची row देते?' },
        options: ['rows.get(5)', 'rows.get(6)', 'rows.get(-1)', 'rows.last()'],
        answer: 0,
        explain: { en: 'Counting starts at 0, so 6 rows are get(0) to get(5). get(6) is past the end and fails.', mr: 'मोजणी 0 पासून सुरू होते, म्हणून 6 ओळी म्हणजे get(0) ते get(5). get(6) शेवटाच्या पुढे जातो आणि fail होतो.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: 'String a = "500";\nString b = "450";\nSystem.out.println(a + b);\nSystem.out.println(Integer.parseInt(a) + Integer.parseInt(b));',
        options: [
          { en: '950, then 950', mr: '950, मग 950' },
          { en: '500450, then 500450', mr: '500450, मग 500450' },
          { en: '950, then 500450', mr: '950, मग 500450' },
          { en: '500450, then 950', mr: '500450, मग 950' },
        ],
        answer: 3,
        explain: { en: 'Two Strings joined with + are glued together: "500450". After Integer.parseInt they are numbers, so + really adds: 950. That is why fees need parseInt before you sum them.', mr: '+ ने जोडलेले दोन Strings फक्त चिकटतात: "500450". Integer.parseInt नंतर ते numbers असतात, म्हणून + खरी बेरीज करतो: 950. म्हणूनच fees ची बेरीज करण्याआधी parseInt लागतो.' },
      },
      {
        q: { en: 'This test also passes when the filter shows no rows at all. What is the weakness?', mr: 'filter एकही ओळ दाखवत नसतानाही ही test pass होते. कमजोरी काय आहे?' },
        code: 'List<WebElement> rows = driver.findElements(By.cssSelector("tr.doctor-row"));\nfor (WebElement row : rows) {\n    Assert.assertEquals(row.findElement(By.className("speciality")).getText(), "Cardiology");\n}',
        options: [
          { en: 'None: findElements throws when the table is empty', mr: 'काहीच नाही: table रिकामं असेल तर findElements exception टाकतो' },
          { en: 'With zero rows the loop never runs, so no assertion runs. Also assert the count or that the list is not empty', mr: 'शून्य ओळी असल्या की loop चालतच नाही, म्हणजे एकही assertion चालत नाही. संख्येचं किंवा list रिकामी नसल्याचं assertion पण करा' },
          { en: 'The assertEquals arguments are in the wrong order', mr: 'assertEquals चे arguments चुकीच्या क्रमाने आहेत' },
          { en: 'A for-each loop cannot be used with WebElement', mr: 'WebElement सोबत for-each loop वापरता येत नाही' },
        ],
        answer: 1,
        explain: { en: 'A loop over an empty list does nothing, quietly. A broken page with no rows would look green. Guard it with an assertion on size() or isEmpty() first.', mr: 'रिकाम्या list वरचा loop शांतपणे काहीच करत नाही. शून्य ओळी असलेलं बिघडलेलं page हिरवं दिसेल. आधी size() किंवा isEmpty() वर assertion करून ते टाळा.' },
      },
    ],
    recap: { line: { en: 'findElements gives the whole register as a List. Check the count, then loop with for-each and assert every row.', mr: 'findElements संपूर्ण रजिस्टर एका List मध्ये देतो. आधी संख्या तपासा, मग for-each loop ने प्रत्येक ओळीवर assertion करा.' }, icon: '📋' },
  },

  // ───────────────────────── S2.3 Alerts and stale elements
  {
    id: 'se2-3',
    code: 'S2.3',
    level: 'intermediate',
    title: { en: 'Pop-ups and Changing Pages: Alerts and Stale Elements', mr: 'Pop-ups आणि बदलणारी pages: Alerts आणि Stale Elements' },
    skill: 'Alerts and stale elements',
    realLife: {
      place: 'bank',
      title: { en: 'The "Are you sure?" counter and the old notice', mr: '"नक्की ना?" विचारणारा काउंटर आणि जुनी सूचना' },
      story: {
        en: 'Joshi kaka goes to his bank in Sadashiv Peth to close an old account. The clerk does not just close it. She turns the screen towards him: "Are you sure you want to close this account?" Nothing else happens at that counter until he answers. Yes closes it, no keeps it. On the way out he remembers the holiday list he photographed on the notice board yesterday. He shows the photo and asks about "the third notice". The guard laughs: that paper was taken down this morning and a new sheet is pinned there. His photo points at a paper that no longer exists. He has to look at the board again.',
        mr: 'जोशी काका एक जुनं खातं बंद करायला सदाशिव पेठेतल्या आपल्या बँकेत जातात. क्लार्क ते लगेच बंद करत नाही. ती स्क्रीन त्यांच्याकडे वळवते: "हे खातं नक्की बंद करायचं आहे ना?" काका उत्तर देईपर्यंत त्या काउंटरवर दुसरं काहीच होत नाही. हो म्हटलं तर बंद, नाही म्हटलं तर चालू. बाहेर पडताना त्यांना आठवतं की कालच त्यांनी सूचना फलकावरच्या सुट्ट्यांच्या यादीचा फोटो काढला होता. ते फोटो दाखवून "तिसऱ्या सूचनेबद्दल" विचारतात. शिपाई हसतो: तो कागद आज सकाळीच काढला, तिथे नवा कागद लावला आहे. त्यांचा फोटो आता अस्तित्वात नसलेल्या कागदाकडे बोट दाखवतो. त्यांना फलक पुन्हा पाहावा लागतो.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🏦', label: 'Ask to close the account', mr: 'खातं बंद करायला सांगा' },
          { icon: '❓', label: '"Are you sure?"', mr: '"नक्की ना?"' },
          { icon: '🙋', label: 'Answer yes or no', mr: 'हो किंवा नाही सांगा' },
          { icon: '📸', label: 'Photo of yesterday\'s notice', mr: 'कालच्या सूचनेचा फोटो' },
          { icon: '📌', label: 'Point at the photo today', mr: 'आज फोटोकडे बोट दाखवा' },
        ],
        breakAt: 4,
        breakNote: { en: 'That paper was replaced this morning. Look at the board again.', mr: 'तो कागद आज सकाळीच बदलला. फलक पुन्हा पाहा.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'happy', text: { en: 'New on My appointments: Cancel now asks "Cancel this appointment?" before it cancels. No more cancelled visits by a slipped finger.', mr: 'My appointments वर नवं: Cancel आता रद्द करण्याआधी "Cancel this appointment?" विचारतो. बोट घसरून visit रद्द होणं बंद.' } },
        { who: 'rex', mood: 'worried', text: { en: 'And our old cancel test now dies on the line right after the click: UnhandledAlertException. That pop-up blocks the whole page until someone answers it.', mr: 'आणि आपली जुनी cancel test आता click नंतरच्या ओळीवरच मरते: UnhandledAlertException. कोणी उत्तर देईपर्यंत तो pop-up संपूर्ण page अडवतो.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'and when you do answer, i redraw the whole table. the rows you saved point at nothing. stale, stale, stale.', mr: 'आणि तुम्ही उत्तर दिलंत की मी संपूर्ण table पुन्हा काढतो. तुम्ही जपून ठेवलेल्या ओळी कशाकडेच बोट दाखवत नाहीत. stale, stale, stale.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'Two habits for the robot, {name}: answer the alert, and find elements again after the page changes.', mr: 'robot साठी दोन सवयी, {name}: alert ला उत्तर द्या, आणि page बदलल्यावर elements पुन्हा शोधा.' } },
      ],
      problem: { en: 'A browser alert blocks the page, so every command after the click fails. And once the page redraws, elements found earlier are gone, so old references throw StaleElementReferenceException. Tests fail in confusing ways and people call them flaky.', mr: 'browser alert page अडवतो, त्यामुळे click नंतरची प्रत्येक command fail होते. आणि page पुन्हा काढलं गेलं की आधी शोधलेले elements नाहीसे होतात, म्हणून जुने references StaleElementReferenceException टाकतात. tests गोंधळात टाकणाऱ्या पद्धतीने fail होतात आणि लोक त्यांना flaky म्हणतात.' },
      solution: { en: 'Use driver.switchTo().alert() to read the pop-up and answer it with accept() or dismiss(). Assert its text. After any change to the page, find the elements again before you use them.', mr: 'pop-up वाचायला driver.switchTo().alert() वापरा आणि accept() किंवा dismiss() ने उत्तर द्या. त्याच्या text चं assertion करा. page मध्ये काहीही बदल झाल्यावर elements वापरण्याआधी पुन्हा शोधा.' },
    },
    lesson: [
      { en: 'A JavaScript alert is a small browser pop-up with OK and Cancel. It is not part of the page, so findElement cannot see it. While it is open, every other command fails with UnhandledAlertException. First switch to it: Alert alert = driver.switchTo().alert();', mr: 'JavaScript alert म्हणजे OK आणि Cancel असलेला browser चा छोटा pop-up. तो page चा भाग नसतो, म्हणून findElement ला तो दिसत नाही. तो उघडा असेपर्यंत दुसरी प्रत्येक command UnhandledAlertException ने fail होते. आधी त्यावर switch करा: Alert alert = driver.switchTo().alert();' },
      { en: 'alert.getText() reads the question. alert.accept() presses OK. alert.dismiss() presses Cancel. If no alert is open, switchTo().alert() throws NoAlertPresentException. That is useful: if the app forgets to ask, your test fails right on that line.', mr: 'alert.getText() प्रश्न वाचतो. alert.accept() OK दाबतो. alert.dismiss() Cancel दाबतो. कोणताही alert उघडा नसेल तर switchTo().alert() NoAlertPresentException टाकतो. हे उपयोगी आहे: app विचारायला विसरलं तर तुमची test नेमकी त्याच ओळीवर fail होते.' },
      { en: 'A WebElement points at one exact element, as it was when you found it. It is a photo of the notice. When the page redraws (after a cancel, a refresh, a filter, a new page), the old element is removed and a fresh one takes its place. Using the old one throws StaleElementReferenceException. The fix: find it again after the change.', mr: 'WebElement एका नेमक्या element कडे बोट दाखवतो, तुम्ही शोधला तेव्हा तो जसा होता तसा. तो सूचनेचा फोटो आहे. page पुन्हा काढलं गेलं (cancel, refresh, filter, नवं page) की जुना element काढला जातो आणि त्याच्या जागी नवा येतो. जुना वापरला तर StaleElementReferenceException येतो. उपाय: बदलानंतर तो पुन्हा शोधा.' },
      { en: 'The tester\'s angle: assert the alert\'s text, because the patient must see the right question. Test both answers: OK must change the data, Cancel must leave it exactly as it was. And after answering, read the result fresh from the page.', mr: 'टेस्टरचा दृष्टिकोन: alert च्या text चं assertion करा, कारण पेशंटला योग्य प्रश्नच दिसायला हवा. दोन्ही उत्तरं test करा: OK ने डेटा बदलायला हवा, Cancel ने तो जसाच्या तसा ठेवायला हवा. आणि उत्तर दिल्यावर निकाल page वरून नव्याने वाचा.' },
    ],
    syntax: {
      template: 'driver.findElement(By.cssSelector("tr[data-id=\'CB-0998\'] .cancel-btn")).click();\nAlert alert = driver.switchTo().alert();\nString question = alert.getText();\nalert.accept();     // OK\n// alert.dismiss(); // Cancel\nWebElement status = driver.findElement(By.cssSelector("tr[data-id=\'CB-0998\'] .status"));',
      parts: [
        { code: 'driver.switchTo().alert()', means: { en: 'move the robot\'s attention to the open pop-up', mr: 'robot चं लक्ष उघड्या pop-up कडे न्या' } },
        { code: 'alert.getText()', means: { en: 'read the question in the pop-up', mr: 'pop-up मधला प्रश्न वाचा' } },
        { code: 'alert.accept()', means: { en: 'press OK (yes)', mr: 'OK दाबा (हो)' } },
        { code: 'alert.dismiss()', means: { en: 'press Cancel (no)', mr: 'Cancel दाबा (नाही)' } },
        { code: 'UnhandledAlertException', means: { en: 'you tried something else while an alert was still open', mr: 'alert उघडा असतानाच तुम्ही दुसरं काहीतरी केलं' } },
        { code: 'StaleElementReferenceException', means: { en: 'the element you saved is no longer on the page. Find it again.', mr: 'तुम्ही ठेवलेला element आता page वर नाही. तो पुन्हा शोधा.' } },
      ],
      example: [
        { code: 'driver.findElement(By.cssSelector("tr[data-id=\'CB-0998\'] .cancel-btn")).click();', note: { en: 'kaka asks to close the account', mr: 'काका खातं बंद करायला सांगतात' } },
        { code: 'Alert alert = driver.switchTo().alert();', note: { en: 'the clerk turns the screen towards him', mr: 'क्लार्क स्क्रीन त्यांच्याकडे वळवते' } },
        { code: 'Assert.assertEquals(alert.getText(), "Cancel this appointment?");', note: { en: 'read the question before you answer it', mr: 'उत्तर देण्याआधी प्रश्न वाचा' } },
        { code: 'alert.accept();', note: { en: '"Yes, close it"', mr: '"हो, बंद करा"' } },
        { code: 'String status = driver.findElement(By.cssSelector("tr[data-id=\'CB-0998\'] .status")).getText();', note: { en: 'look at the board again, fresh', mr: 'फलक पुन्हा, नव्याने पाहा' } },
        { code: 'Assert.assertEquals(status, "Cancelled");', note: { en: 'the account really is closed', mr: 'खातं खरंच बंद झालं' } },
      ],
      pitfall: { en: 'Do not save a row in a variable, change the page, and then use the saved row. After a cancel the whole table is drawn again, so your saved row is yesterday\'s photo. Find it again after every change.', mr: 'ओळ variable मध्ये ठेवून, page बदलून, मग ती ठेवलेली ओळ वापरू नका. cancel नंतर संपूर्ण table पुन्हा काढलं जातं, म्हणजे तुमची ठेवलेली ओळ कालचा फोटो आहे. प्रत्येक बदलानंतर ती पुन्हा शोधा.' },
    },
    practice: {
      intro: { en: 'Asha is already logged in. My appointments has two bookings: CB-0998 (Dr. Neha Joshi) and CB-0999 (Dr. Meera Kulkarni). Each row is a tr with class appt-row and a data-id, with a .status cell and a .cancel-btn button. In the browser pane on the right, an open alert shows as a dark box.', mr: 'Asha आधीच logged in आहे. My appointments मध्ये दोन bookings आहेत: CB-0998 (Dr. Neha Joshi) आणि CB-0999 (Dr. Meera Kulkarni). प्रत्येक ओळ म्हणजे appt-row class आणि data-id असलेला tr, ज्यात .status cell आणि .cancel-btn button आहे. उजवीकडच्या browser pane मध्ये उघडा alert एका गडद box सारखा दिसतो.' },
      steps: [
        {
          kind: 'selenium',
          prompt: { en: 'Cancel CB-0998 properly. After the click, switch to the alert, assert its text is "Cancel this appointment?", accept it, and assert that the status of CB-0998 is now "Cancelled".', mr: 'CB-0998 नीट रद्द करा. click नंतर alert वर switch करा, त्याचा text "Cancel this appointment?" आहे असं assert करा, तो accept करा, आणि CB-0998 चा status आता "Cancelled" आहे असं assert करा.' },
          starter: `driver.get("https://carebridge.test/appointments");
driver.findElement(By.cssSelector("tr[data-id='CB-0998'] .cancel-btn")).click();
// TODO: switch to the alert and keep it in a variable
// TODO: assert its text is "Cancel this appointment?"
// TODO: accept it
// TODO: assert the status of CB-0998 is now "Cancelled"
`,
          solution: `driver.get("https://carebridge.test/appointments");
driver.findElement(By.cssSelector("tr[data-id='CB-0998'] .cancel-btn")).click();
Alert alert = driver.switchTo().alert();
Assert.assertEquals(alert.getText(), "Cancel this appointment?");
alert.accept();
String status = driver.findElement(By.cssSelector("tr[data-id='CB-0998'] .status")).getText();
Assert.assertEquals(status, "Cancelled");
`,
          startUrl: APPTS_URL,
          loggedIn: true,
          minAssertions: 2,
          mustUse: [{ pattern: 'switchTo\\(\\)\\s*\\.\\s*alert\\(\\)', message: { en: 'Switch to the pop-up with driver.switchTo().alert() before you answer it.', mr: 'उत्तर देण्याआधी driver.switchTo().alert() ने pop-up वर switch करा.' } }],
          verify: [{ check: (s) => s.appointments.some((a) => a.id === 'CB-0998' && a.status === 'Cancelled'), message: { en: 'CB-0998 is not cancelled yet. Did you accept the alert?', mr: 'CB-0998 अजून रद्द झालेलं नाही. तुम्ही alert accept केला का?' } }],
          mustCatch: [{ bug: 'cancel-no-confirm', label: { en: 'Cancel removes the appointment without asking', mr: 'Cancel न विचारता appointment रद्द करतो' } }],
          hints: [
            { en: 'Alert alert = driver.switchTo().alert(); gives you the pop-up as an object.', mr: 'Alert alert = driver.switchTo().alert(); ने pop-up एका object सारखा मिळतो.' },
            { en: 'Read the question with alert.getText() and compare it in Assert.assertEquals. Then alert.accept() presses OK.', mr: 'alert.getText() ने प्रश्न वाचा आणि Assert.assertEquals मध्ये तुलना करा. मग alert.accept() OK दाबतो.' },
            { en: 'The status cell of that row: By.cssSelector("tr[data-id=\'CB-0998\'] .status")', mr: 'त्या ओळीचा status cell: By.cssSelector("tr[data-id=\'CB-0998\'] .status")' },
            { en: 'Alert alert = driver.switchTo().alert();\nAssert.assertEquals(alert.getText(), "Cancel this appointment?");\nalert.accept();\nString status = driver.findElement(By.cssSelector("tr[data-id=\'CB-0998\'] .status")).getText();\nAssert.assertEquals(status, "Cancelled");', mr: 'Alert alert = driver.switchTo().alert();\nAssert.assertEquals(alert.getText(), "Cancel this appointment?");\nalert.accept();\nString status = driver.findElement(By.cssSelector("tr[data-id=\'CB-0998\'] .status")).getText();\nAssert.assertEquals(status, "Cancelled");' },
          ],
          successLine: { en: 'And on the buggy build that cancels without asking, switchTo().alert() throws NoAlertPresentException. The missing question is now a failing test.', mr: 'आणि न विचारता रद्द करणाऱ्या बग असलेल्या build वर switchTo().alert() NoAlertPresentException टाकतो. न विचारलेला प्रश्न आता fail होणारी test आहे.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Now the "no" answer. This script clicks Cancel on CB-0999 and then reads the status. Press Run first and read the red line in the log. Then add one line that dismisses the alert (presses Cancel), so the status stays "Booked".', mr: 'आता "नाही" हे उत्तर. ही script CB-0999 वर Cancel click करते आणि मग status वाचते. आधी Run दाबा आणि log मधली लाल ओळ वाचा. मग alert dismiss करणारी (Cancel दाबणारी) एक ओळ जोडा, म्हणजे status "Booked" च राहील.' },
          starter: `driver.get("https://carebridge.test/appointments");
driver.findElement(By.cssSelector("tr[data-id='CB-0999'] .cancel-btn")).click();
// TODO: switch to the alert and dismiss it
String status = driver.findElement(By.cssSelector("tr[data-id='CB-0999'] .status")).getText();
Assert.assertEquals(status, "Booked");
`,
          solution: `driver.get("https://carebridge.test/appointments");
driver.findElement(By.cssSelector("tr[data-id='CB-0999'] .cancel-btn")).click();
driver.switchTo().alert().dismiss();
String status = driver.findElement(By.cssSelector("tr[data-id='CB-0999'] .status")).getText();
Assert.assertEquals(status, "Booked");
`,
          startUrl: APPTS_URL,
          loggedIn: true,
          minAssertions: 1,
          mustUse: [{ pattern: '\\.dismiss\\(\\)', message: { en: 'Press Cancel on the pop-up with dismiss().', mr: 'pop-up वर dismiss() ने Cancel दाबा.' } }],
          verify: [{ check: (s) => s.appointments.some((a) => a.id === 'CB-0999' && a.status === 'Booked'), message: { en: 'CB-0999 got cancelled. Dismiss means "no", so it must stay Booked.', mr: 'CB-0999 रद्द झालं. dismiss म्हणजे "नाही", म्हणून ते Booked च राहायला हवं.' } }],
          mustCatch: [{ bug: 'cancel-no-confirm', label: { en: 'Cancel removes the appointment without asking', mr: 'Cancel न विचारता appointment रद्द करतो' } }],
          hints: [
            { en: 'The red line says UnhandledAlertException: the pop-up is open, so the robot cannot read the page yet.', mr: 'लाल ओळ म्हणते UnhandledAlertException: pop-up उघडा आहे, म्हणून robot अजून page वाचू शकत नाही.' },
            { en: 'Accept is OK. The other one, for Cancel, is dismiss().', mr: 'accept म्हणजे OK. Cancel साठीचा दुसरा म्हणजे dismiss().' },
            { en: 'driver.switchTo().alert().dismiss();', mr: 'driver.switchTo().alert().dismiss();' },
          ],
          successLine: { en: 'Asked, refused, still Booked. Testing the "no" path is how you catch a Cancel button that cancels anyway.', mr: 'विचारलं, नकार दिला, तरी Booked. "नाही" चा मार्ग test केल्यानेच, नाही म्हटलं तरी रद्द करणारं Cancel बटण पकडलं जातं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'This script saves the CB-0999 row in a variable, cancels CB-0998, and then reads CB-0999 again through the saved row. Press Run and watch the log. Why does the last line fail?', mr: 'ही script CB-0999 ची ओळ variable मध्ये ठेवते, CB-0998 रद्द करते, आणि मग ठेवलेल्या ओळीतून CB-0999 पुन्हा वाचते. Run दाबा आणि log पाहा. शेवटची ओळ fail का होते?' },
          seleniumSandbox: {
            code: `driver.get("https://carebridge.test/appointments");
WebElement row = driver.findElement(By.cssSelector("tr[data-id='CB-0999']"));
System.out.println("Before: " + row.findElement(By.className("status")).getText());
driver.findElement(By.cssSelector("tr[data-id='CB-0998'] .cancel-btn")).click();
driver.switchTo().alert().accept();
System.out.println("After: " + row.findElement(By.className("status")).getText());
`,
            startUrl: APPTS_URL,
            loggedIn: true,
          },
          options: [
            { en: 'CB-0999 was cancelled too, so its row disappeared', mr: 'CB-0999 सुद्धा रद्द झालं, म्हणून त्याची ओळ गायब झाली' },
            { en: 'The cancel redrew the table, so the saved row points at an element that is no longer on the page: StaleElementReferenceException', mr: 'cancel ने table पुन्हा काढलं, म्हणून ठेवलेली ओळ आता page वर नसलेल्या element कडे बोट दाखवते: StaleElementReferenceException' },
            { en: 'The alert is still open, so the page is blocked', mr: 'alert अजून उघडा आहे, म्हणून page अडलं आहे' },
            { en: 'The locator for CB-0999 is spelled wrong', mr: 'CB-0999 चा locator चुकीचा लिहिला आहे' },
          ],
          correct: [1],
          explain: { en: 'The first read worked, so the locator is fine, and the alert was accepted. CB-0999 is still Booked on the page. But accepting redrew the table, and the row in the variable is the old, removed one. Selenium says StaleElementReferenceException.', mr: 'पहिलं वाचन चाललं, म्हणजे locator बरोबर आहे, आणि alert accept झाला. page वर CB-0999 अजून Booked आहे. पण accept केल्यावर table पुन्हा काढलं गेलं, आणि variable मधली ओळ जुनी, काढून टाकलेली आहे. Selenium म्हणतो StaleElementReferenceException.' },
          hints: [
            { en: 'Read the exception name in the red line of the log.', mr: 'log मधल्या लाल ओळीतलं exception चं नाव वाचा.' },
            { en: 'The "Before" line printed fine with the same locator. What changed between "Before" and "After"?', mr: 'त्याच locator ने "Before" ओळ नीट print झाली. "Before" आणि "After" मध्ये काय बदललं?' },
          ],
          successLine: { en: 'Yesterday\'s photo of the notice board. Next: look at the board again.', mr: 'सूचना फलकाचा कालचा फोटो. पुढे: फलक पुन्हा पाहा.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'Fix the stale script. After accepting the alert, find the CB-0999 row again (assign it to row once more) before reading its status. All three assertions must pass.', mr: 'stale script दुरुस्त करा. alert accept केल्यावर, status वाचण्याआधी CB-0999 ची ओळ पुन्हा शोधा (row ला पुन्हा value द्या). तिन्ही assertions pass व्हायला हवीत.' },
          starter: `driver.get("https://carebridge.test/appointments");
WebElement row = driver.findElement(By.cssSelector("tr[data-id='CB-0999']"));
Assert.assertEquals(row.findElement(By.className("status")).getText(), "Booked");
driver.findElement(By.cssSelector("tr[data-id='CB-0998'] .cancel-btn")).click();
driver.switchTo().alert().accept();
// TODO: the table was drawn again. Find the CB-0999 row again here.
Assert.assertEquals(row.findElement(By.className("status")).getText(), "Booked");
Assert.assertEquals(driver.findElement(By.cssSelector("tr[data-id='CB-0998'] .status")).getText(), "Cancelled");
`,
          solution: `driver.get("https://carebridge.test/appointments");
WebElement row = driver.findElement(By.cssSelector("tr[data-id='CB-0999']"));
Assert.assertEquals(row.findElement(By.className("status")).getText(), "Booked");
driver.findElement(By.cssSelector("tr[data-id='CB-0998'] .cancel-btn")).click();
driver.switchTo().alert().accept();
row = driver.findElement(By.cssSelector("tr[data-id='CB-0999']"));
Assert.assertEquals(row.findElement(By.className("status")).getText(), "Booked");
Assert.assertEquals(driver.findElement(By.cssSelector("tr[data-id='CB-0998'] .status")).getText(), "Cancelled");
`,
          startUrl: APPTS_URL,
          loggedIn: true,
          minAssertions: 3,
          hints: [
            { en: 'Nothing is wrong with the locator. The element is simply old. Look it up again with the same locator.', mr: 'locator मध्ये काहीच चूक नाही. element फक्त जुना झाला आहे. त्याच locator ने तो पुन्हा शोधा.' },
            { en: 'row already exists, so do not write WebElement again. Just give it a new value: row = driver.findElement(...);', mr: 'row आधीच आहे, म्हणून पुन्हा WebElement लिहू नका. फक्त नवी value द्या: row = driver.findElement(...);' },
            { en: 'row = driver.findElement(By.cssSelector("tr[data-id=\'CB-0999\']"));', mr: 'row = driver.findElement(By.cssSelector("tr[data-id=\'CB-0999\']"));' },
          ],
          successLine: { en: 'Fresh look, fresh element. CB-0998 is Cancelled, CB-0999 untouched, and no stale photos in sight.', mr: 'नवी नजर, नवा element. CB-0998 Cancelled, CB-0999 जसंच्या तसं, आणि एकही stale फोटो नाही.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'An alert is open and the script calls driver.findElement(By.id("search")). What happens?', mr: 'एक alert उघडा आहे आणि script driver.findElement(By.id("search")) call करते. काय होतं?' },
        options: [
          { en: 'It finds the element behind the alert', mr: 'alert मागचा element सापडतो' },
          { en: 'UnhandledAlertException: the alert must be answered first', mr: 'UnhandledAlertException: आधी alert ला उत्तर द्यायला हवं' },
          { en: 'The alert closes by itself', mr: 'alert आपोआप बंद होतो' },
          { en: 'NoSuchElementException', mr: 'NoSuchElementException' },
        ],
        answer: 1,
        explain: { en: 'An open alert blocks the page. Switch to it and accept or dismiss it before any other command.', mr: 'उघडा alert page अडवतो. दुसऱ्या कोणत्याही command आधी त्यावर switch करा आणि accept किंवा dismiss करा.' },
      },
      {
        q: { en: 'Which line presses Cancel on the pop-up?', mr: 'कोणती ओळ pop-up वर Cancel दाबते?' },
        options: ['alert.accept();', 'alert.close();', 'driver.navigate().back();', 'alert.dismiss();'],
        answer: 3,
        explain: { en: 'dismiss() is Cancel (no). accept() is OK (yes).', mr: 'dismiss() म्हणजे Cancel (नाही). accept() म्हणजे OK (हो).' },
      },
      {
        q: { en: 'Your test clicks Cancel and then calls driver.switchTo().alert(). On a buggy build the app cancels at once, without asking. What does your test do?', mr: 'तुमची test Cancel click करते आणि मग driver.switchTo().alert() call करते. बग असलेल्या build वर app न विचारता लगेच रद्द करतं. तुमची test काय करते?' },
        options: [
          { en: 'It fails with NoAlertPresentException, which exposes the missing question', mr: 'NoAlertPresentException ने fail होते, आणि न विचारलेला प्रश्न उघड होतो' },
          { en: 'It passes, because the appointment did get cancelled', mr: 'pass होते, कारण appointment रद्द तर झालीच' },
          { en: 'It waits forever for the alert', mr: 'alert ची कायम वाट पाहते' },
          { en: 'It fails with UnhandledAlertException', mr: 'UnhandledAlertException ने fail होते' },
        ],
        answer: 0,
        explain: { en: 'switchTo().alert() with no alert open throws NoAlertPresentException. Your test turns the missing confirmation into a red result.', mr: 'alert उघडा नसताना switchTo().alert() NoAlertPresentException टाकतो. तुमची test न विचारलेल्या प्रश्नाला लाल निकालात बदलते.' },
      },
      {
        q: { en: 'What happens on the last line, and what is the fix?', mr: 'शेवटच्या ओळीवर काय होतं, आणि उपाय काय?' },
        code: 'WebElement search = driver.findElement(By.id("search"));\ndriver.navigate().refresh();\nsearch.sendKeys("Joshi");',
        options: [
          { en: 'NoSuchElementException: fix the locator', mr: 'NoSuchElementException: locator दुरुस्त करा' },
          { en: 'TimeoutException: add a wait', mr: 'TimeoutException: wait जोडा' },
          { en: 'StaleElementReferenceException: find the element again after the refresh', mr: 'StaleElementReferenceException: refresh नंतर element पुन्हा शोधा' },
          { en: 'Nothing, it types Joshi', mr: 'काहीच नाही, Joshi टाइप होतं' },
        ],
        answer: 2,
        explain: { en: 'The refresh drew a brand new page. The saved search box is the old one. Find it again after the refresh.', mr: 'refresh ने पूर्ण नवं page काढलं. ठेवलेला search box जुना आहे. refresh नंतर तो पुन्हा शोधा.' },
      },
    ],
    recap: { line: { en: 'Alert open? switchTo().alert(), read it, then accept or dismiss. Page changed? Find the element again.', mr: 'alert उघडा? switchTo().alert(), तो वाचा, मग accept किंवा dismiss. page बदललं? element पुन्हा शोधा.' }, icon: '🔔' },
  },

  // ───────────────────────── S2.4 TestNG setup, teardown, data
  {
    id: 'se2-4',
    code: 'S2.4',
    level: 'intermediate',
    title: { en: 'TestNG: Setup, Teardown and Data-Driven Tests', mr: 'TestNG: Setup, Teardown आणि Data-Driven Tests' },
    skill: 'TestNG annotations and DataProvider',
    realLife: {
      place: 'wedding',
      title: { en: 'The wedding caterer\'s routine', mr: 'लग्नातल्या केटररचं रोजचं काम' },
      story: {
        en: 'Patil kaka caters a big wedding in Pune. Before every pangat sits down, his team sets up: fresh leaves, water glasses filled, the counter wiped. Then they serve the batch. After the batch gets up, they clear the leaves and wipe everything again, even if a guest spilled the whole aamti. The next batch never eats on the last batch\'s mess. In the kitchen, the cook makes the same thali recipe all day, but the order list changes: one guest wants it less spicy, one wants Jain food, one wants extra puran poli. One recipe, many orders. And kaka decides the order: the elders\' pangat first, then everyone else.',
        mr: 'पाटील काका पुण्यातल्या एका मोठ्या लग्नाचं केटरिंग करतात. प्रत्येक पंगत बसण्याआधी त्यांची टीम तयारी करते: नवी पानं, भरलेले पाण्याचे ग्लास, पुसलेला काउंटर. मग पंगतीला वाढलं जातं. पंगत उठल्यावर ते पानं उचलतात आणि सगळं पुन्हा पुसतात, एखाद्या पाहुण्याने पूर्ण आमटी सांडली असली तरी. पुढची पंगत कधीच आधीच्या पंगतीच्या पसाऱ्यात जेवत नाही. स्वयंपाकघरात आचारी दिवसभर तीच थाळीची रेसिपी बनवतो, पण ऑर्डरची यादी बदलते: एकाला कमी तिखट, एकाला जैन जेवण, एकाला जास्त पुरणपोळी. एक रेसिपी, अनेक ऑर्डर. आणि क्रम काका ठरवतात: आधी वडीलधाऱ्यांची पंगत, मग बाकी सगळे.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🧽', label: 'Set up the counter (@BeforeMethod)', mr: 'काउंटर तयार करा (@BeforeMethod)' },
          { icon: '🍛', label: 'Serve the batch (@Test)', mr: 'पंगतीला वाढा (@Test)' },
          { icon: '🧹', label: 'Clean up (@AfterMethod)', mr: 'साफसफाई (@AfterMethod)' },
          { icon: '📋', label: 'Next order on the list (@DataProvider)', mr: 'यादीतली पुढची ऑर्डर (@DataProvider)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Our login checks are one long script. When the first check fails, the rest never run, and every check shares one tired browser.', mr: 'आपले login checks म्हणजे एक लांबलचक script. पहिला check fail झाला की बाकीचे चालतच नाहीत, आणि सगळे checks एकाच थकलेल्या browser मध्ये चालतात.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'one test logs in. the next test is already logged in. surprise! your "wrong password" test passes for the wrong reason.', mr: 'एक test login करते. पुढची test आधीच logged in असते. surprise! तुमची "wrong password" test चुकीच्या कारणाने pass होते.' } },
        { who: 'rex', mood: 'happy', text: { en: 'Welcome to TestNG. Every @Test gets a fresh browser from @BeforeMethod, and @AfterMethod closes it, pass or fail. A clean leaf for every guest.', mr: 'TestNG मध्ये स्वागत. प्रत्येक @Test ला @BeforeMethod कडून नवा browser मिळतो, आणि @AfterMethod तो बंद करतो, pass असो की fail. प्रत्येक पाहुण्याला स्वच्छ पान.' } },
        { who: 'meera', mood: 'neutral', text: { en: 'And for many inputs, one recipe, {name}: @DataProvider. Three wrong logins, one test method, three results.', mr: 'आणि अनेक inputs साठी एकच रेसिपी, {name}: @DataProvider. तीन चुकीचे logins, एक test method, तीन निकाल.' } },
      ],
      problem: { en: 'In one long script, an early failure hides every later check, and leftovers like a logged-in session leak into the next check. Copying the same test for every input makes files huge and hard to fix.', mr: 'एका लांब script मध्ये सुरुवातीचं failure पुढचे सगळे checks लपवतं, आणि logged-in session सारखा उरलेला पसारा पुढच्या check मध्ये जातो. प्रत्येक input साठी तीच test copy केली तर files प्रचंड मोठ्या होतात आणि दुरुस्त करायला कठीण.' },
      solution: { en: 'Write a TestNG class: @BeforeMethod and @AfterMethod give each test a clean browser, each @Test passes or fails on its own, priority sets the order, and @DataProvider runs one test once per row of data.', mr: 'TestNG class लिहा: @BeforeMethod आणि @AfterMethod प्रत्येक test ला स्वच्छ browser देतात, प्रत्येक @Test स्वतंत्रपणे pass किंवा fail होते, priority क्रम ठरवते, आणि @DataProvider एक test डेटाच्या प्रत्येक ओळीसाठी एकदा चालवतो.' },
    },
    lesson: [
      { en: 'TestNG is the test runner most Selenium Java teams use. You write a class, and every method marked @Test is one test with its own PASSED or FAILED line. One failing test does not stop the others.', mr: 'TestNG हा बहुतेक Selenium Java टीम्स वापरतात तो test runner आहे. तुम्ही एक class लिहिता, आणि @Test लावलेली प्रत्येक method म्हणजे स्वतःची PASSED किंवा FAILED ओळ असलेली एक test. एक test fail झाली तरी बाकीच्या थांबत नाहीत.' },
      { en: '@BeforeMethod runs before every @Test. @AfterMethod runs after every @Test, even when the test failed. Put driver = new ChromeDriver(); and opening the page in @BeforeMethod, and driver.quit(); in @AfterMethod. Every test starts in a fresh, logged-out browser, so tests cannot spoil each other.', mr: '@BeforeMethod प्रत्येक @Test आधी चालते. @AfterMethod प्रत्येक @Test नंतर चालते, test fail झाली तरीही. driver = new ChromeDriver(); आणि page उघडणं @BeforeMethod मध्ये ठेवा, आणि driver.quit(); @AfterMethod मध्ये. प्रत्येक test नव्या, logged-out browser मध्ये सुरू होते, म्हणून tests एकमेकांना बिघडवू शकत नाहीत.' },
      { en: 'The run order: TestNG runs tests by priority, lowest first. No priority means 0. Tests with the same priority run in alphabetical order of their method names. enabled = false skips a test. Still, a good test never depends on another one: each should pass when run alone.', mr: 'चालण्याचा क्रम: TestNG tests priority नुसार चालवतो, सगळ्यात कमी आधी. priority नसेल तर ती 0. एकाच priority च्या tests त्यांच्या method नावांच्या अक्षरक्रमाने चालतात. enabled = false test वगळते. तरीही, चांगली test कधीच दुसऱ्या test वर अवलंबून नसते: प्रत्येक test एकटी चालवली तरी pass व्हायला हवी.' },
      { en: '@DataProvider is a method that returns Object[][]: a table where each inner { } is one row, one run. A @Test(dataProvider = "name") method receives the row\'s values as its parameters. The tester\'s angle: put the expected result in the row too, so every input checks its own message.', mr: '@DataProvider म्हणजे Object[][] परत देणारी method: एक table, ज्यात प्रत्येक आतला { } म्हणजे एक ओळ, एक run. @Test(dataProvider = "name") method ला ओळीतल्या values तिचे parameters म्हणून मिळतात. टेस्टरचा दृष्टिकोन: अपेक्षित निकालही त्याच ओळीत ठेवा, म्हणजे प्रत्येक input स्वतःचा message तपासेल.' },
    ],
    syntax: {
      template: 'public class LoginTest {\n    WebDriver driver;\n\n    @BeforeMethod\n    public void setUp() {\n        driver = new ChromeDriver();\n        driver.get("https://carebridge.test/login");\n    }\n\n    @Test(priority = 1)\n    public void validLogin() { /* steps and assertions */ }\n\n    @DataProvider(name = "badLogins")\n    public Object[][] badLogins() {\n        return new Object[][] { {"asha", "nope", "Invalid username or password"} };\n    }\n\n    @Test(priority = 2, dataProvider = "badLogins")\n    public void wrongLogin(String user, String pass, String message) { /* ... */ }\n\n    @AfterMethod\n    public void tearDown() {\n        driver.quit();\n    }\n}',
      parts: [
        { code: '@BeforeMethod', means: { en: 'runs before every single @Test: open a fresh browser and the start page', mr: 'प्रत्येक @Test आधी चालते: नवा browser आणि सुरुवातीचं page उघडा' } },
        { code: '@AfterMethod', means: { en: 'runs after every @Test, pass or fail: close the browser', mr: 'प्रत्येक @Test नंतर चालते, pass असो की fail: browser बंद करा' } },
        { code: '@Test(priority = 1)', means: { en: 'one test. Lower priority runs first (default 0), ties go alphabetical', mr: 'एक test. कमी priority आधी चालते (default 0), बरोबरी असेल तर अक्षरक्रम' } },
        { code: '@Test(enabled = false)', means: { en: 'skip this test for now', mr: 'ही test सध्या वगळा' } },
        { code: '@DataProvider(name = "badLogins")', means: { en: 'a method that supplies rows of test data', mr: 'test data च्या ओळी पुरवणारी method' } },
        { code: 'new Object[][] { {...}, {...} }', means: { en: 'the data table: each inner { } is one row, one run', mr: 'data table: प्रत्येक आतला { } म्हणजे एक ओळ, एक run' } },
        { code: 'dataProvider = "badLogins"', means: { en: 'run this test once per row, with the row values as parameters', mr: 'ही test प्रत्येक ओळीसाठी एकदा चालवा, ओळीतल्या values parameters म्हणून' } },
      ],
      example: [
        { code: '@BeforeMethod public void setUp() { driver = new ChromeDriver(); }', note: { en: 'fresh leaves and a wiped counter before every pangat', mr: 'प्रत्येक पंगतीआधी नवी पानं आणि पुसलेला काउंटर' } },
        { code: '@Test(priority = 1) public void elders() { }', note: { en: 'the elders\' pangat is served first', mr: 'वडीलधाऱ्यांची पंगत आधी वाढली जाते' } },
        { code: '@Test(priority = 2) public void guests() { }', note: { en: 'then everyone else', mr: 'मग बाकी सगळे' } },
        { code: '@AfterMethod public void tearDown() { driver.quit(); }', note: { en: 'clear the leaves after every batch, even after a spill', mr: 'प्रत्येक पंगतीनंतर पानं उचला, सांडलं असलं तरी' } },
        { code: '@DataProvider(name = "orders") public Object[][] orders() { return new Object[][] { {"Jain"}, {"less spicy"} }; }', note: { en: 'the order list from the guests', mr: 'पाहुण्यांच्या ऑर्डरची यादी' } },
        { code: '@Test(dataProvider = "orders") public void serve(String order) { }', note: { en: 'one recipe, cooked once per order', mr: 'एक रेसिपी, प्रत्येक ऑर्डरसाठी एकदा' } },
      ],
      pitfall: { en: 'Do not put driver.quit() at the end of a @Test. If an assertion fails, the lines after it never run, and the browser stays open. @AfterMethod always runs, so the cleanup belongs there.', mr: 'driver.quit() @Test च्या शेवटी ठेवू नका. एखादं assertion fail झालं तर त्यानंतरच्या ओळी चालतच नाहीत, आणि browser उघडाच राहतो. @AfterMethod नेहमी चालते, म्हणून साफसफाई तिथेच.' },
    },
    practice: {
      intro: { en: 'This lab runs a whole TestNG class. In the log, a ▶ line marks each test starting, followed by PASSED or FAILED. new ChromeDriver() after driver.quit() opens a clean, logged-out browser, just like on a real machine.', mr: 'ही lab संपूर्ण TestNG class चालवते. log मध्ये प्रत्येक test सुरू होताना ▶ ओळ येते, आणि मग PASSED किंवा FAILED. driver.quit() नंतर new ChromeDriver() स्वच्छ, logged-out browser उघडतो, अगदी खऱ्या मशीनसारखा.' },
      steps: [
        {
          kind: 'selenium',
          prompt: { en: 'Complete this test class. @BeforeMethod must open the login page. validLogin must assert the title is "Dashboard | CareBridge". wrongLogin must assert the #login-error text is "Invalid username or password". Run it and watch two separate PASSED lines.', mr: 'हा test class पूर्ण करा. @BeforeMethod ने login page उघडायला हवं. validLogin ने title "Dashboard | CareBridge" आहे असं assert करायला हवं. wrongLogin ने #login-error चा text "Invalid username or password" आहे असं assert करायला हवं. Run करा आणि दोन वेगवेगळ्या PASSED ओळी पाहा.' },
          starter: `public class LoginTest {
    WebDriver driver;

    @BeforeMethod
    public void setUp() {
        driver = new ChromeDriver();
        // TODO: open https://carebridge.test/login
    }

    @Test(priority = 1)
    public void validLogin() {
        driver.findElement(By.id("username")).sendKeys("asha");
        driver.findElement(By.id("password")).sendKeys("care123", Keys.ENTER);
        // TODO: assert the title is "Dashboard | CareBridge"
    }

    @Test(priority = 2)
    public void wrongLogin() {
        driver.findElement(By.id("username")).sendKeys("asha");
        driver.findElement(By.id("password")).sendKeys("wrong999", Keys.ENTER);
        // TODO: assert the #login-error text is "Invalid username or password"
    }

    @AfterMethod
    public void tearDown() {
        driver.quit();
    }
}
`,
          solution: `public class LoginTest {
    WebDriver driver;

    @BeforeMethod
    public void setUp() {
        driver = new ChromeDriver();
        driver.get("https://carebridge.test/login");
    }

    @Test(priority = 1)
    public void validLogin() {
        driver.findElement(By.id("username")).sendKeys("asha");
        driver.findElement(By.id("password")).sendKeys("care123", Keys.ENTER);
        Assert.assertEquals(driver.getTitle(), "Dashboard | CareBridge");
    }

    @Test(priority = 2)
    public void wrongLogin() {
        driver.findElement(By.id("username")).sendKeys("asha");
        driver.findElement(By.id("password")).sendKeys("wrong999", Keys.ENTER);
        Assert.assertEquals(driver.findElement(By.id("login-error")).getText(), "Invalid username or password");
    }

    @AfterMethod
    public void tearDown() {
        driver.quit();
    }
}
`,
          minAssertions: 2,
          mustUse: [
            { pattern: '@BeforeMethod', message: { en: 'Keep the @BeforeMethod: it gives every test a fresh start.', mr: '@BeforeMethod ठेवा: ती प्रत्येक test ला नवी सुरुवात देते.' } },
            { pattern: '@AfterMethod', message: { en: 'Keep the @AfterMethod with driver.quit(): it cleans up after every test.', mr: 'driver.quit() असलेली @AfterMethod ठेवा: ती प्रत्येक test नंतर साफसफाई करते.' } },
          ],
          mustCatch: [{ bug: 'login-error-hidden', label: { en: 'A wrong password shows no error message', mr: 'चुकीच्या password वर error message दिसत नाही' } }],
          hints: [
            { en: 'Press Run first: both tests fail with NoSuchElementException, because the fresh browser is on the home page, not the login page.', mr: 'आधी Run दाबा: दोन्ही tests NoSuchElementException ने fail होतात, कारण नवा browser home page वर आहे, login page वर नाही.' },
            { en: 'In setUp, add driver.get("https://carebridge.test/login"); right after new ChromeDriver(). It runs before each test.', mr: 'setUp मध्ये new ChromeDriver() नंतर लगेच driver.get("https://carebridge.test/login"); जोडा. ती प्रत्येक test आधी चालते.' },
            { en: 'validLogin: Assert.assertEquals(driver.getTitle(), "Dashboard | CareBridge");', mr: 'validLogin: Assert.assertEquals(driver.getTitle(), "Dashboard | CareBridge");' },
            { en: 'Assert.assertEquals(driver.findElement(By.id("login-error")).getText(), "Invalid username or password");', mr: 'Assert.assertEquals(driver.findElement(By.id("login-error")).getText(), "Invalid username or password");' },
          ],
          successLine: { en: 'Two tests, two fresh browsers, two PASSED lines. And wrongLogin did not pass by accident: it started logged out.', mr: 'दोन tests, दोन नवे browsers, दोन PASSED ओळी. आणि wrongLogin योगायोगाने pass झाली नाही: ती logged-out अवस्थेत सुरू झाली.' },
        },
        {
          kind: 'selenium',
          prompt: { en: 'One recipe, many orders. The @DataProvider has one wrong login. Add two more rows: an unknown user "rahul" with password "care123" (message "Invalid username or password"), and both fields empty, "" and "" (message "Enter your username and password"). Then assert that #login-error shows the message from each row.', mr: 'एक रेसिपी, अनेक ऑर्डर. @DataProvider मध्ये एक चुकीचा login आहे. अजून दोन ओळी जोडा: अनोळखी user "rahul" आणि password "care123" (message "Invalid username or password"), आणि दोन्ही fields रिकामी, "" आणि "" (message "Enter your username and password"). मग प्रत्येक ओळीचा message #login-error मध्ये दिसतो असं assert करा.' },
          starter: `public class WrongLoginTest {
    WebDriver driver;

    @BeforeMethod
    public void setUp() {
        driver = new ChromeDriver();
        driver.get("https://carebridge.test/login");
    }

    @AfterMethod
    public void tearDown() {
        driver.quit();
    }

    @DataProvider(name = "badLogins")
    public Object[][] badLogins() {
        return new Object[][] {
            {"asha", "wrong999", "Invalid username or password"}
            // TODO: add a row for the unknown user "rahul" with password "care123"
            // TODO: add a row with both fields empty
        };
    }

    @Test(dataProvider = "badLogins")
    public void wrongLogin(String user, String pass, String message) {
        driver.findElement(By.id("username")).sendKeys(user);
        driver.findElement(By.id("password")).sendKeys(pass);
        driver.findElement(By.id("login-btn")).click();
        // TODO: assert that the #login-error text equals message
    }
}
`,
          solution: `public class WrongLoginTest {
    WebDriver driver;

    @BeforeMethod
    public void setUp() {
        driver = new ChromeDriver();
        driver.get("https://carebridge.test/login");
    }

    @AfterMethod
    public void tearDown() {
        driver.quit();
    }

    @DataProvider(name = "badLogins")
    public Object[][] badLogins() {
        return new Object[][] {
            {"asha", "wrong999", "Invalid username or password"},
            {"rahul", "care123", "Invalid username or password"},
            {"", "", "Enter your username and password"}
        };
    }

    @Test(dataProvider = "badLogins")
    public void wrongLogin(String user, String pass, String message) {
        driver.findElement(By.id("username")).sendKeys(user);
        driver.findElement(By.id("password")).sendKeys(pass);
        driver.findElement(By.id("login-btn")).click();
        Assert.assertEquals(driver.findElement(By.id("login-error")).getText(), message);
    }
}
`,
          minAssertions: 3,
          mustUse: [{ pattern: '"rahul"', message: { en: 'Add the row for the unknown user "rahul".', mr: 'अनोळखी user "rahul" ची ओळ जोडा.' } }],
          mustCatch: [{ bug: 'login-error-hidden', label: { en: 'A wrong login shows no error message', mr: 'चुकीच्या login वर error message दिसत नाही' } }],
          hints: [
            { en: 'Rows are separated by commas: {...}, {...}, {...}. Do not forget the comma after the first row.', mr: 'ओळी comma ने वेगळ्या होतात: {...}, {...}, {...}. पहिल्या ओळीनंतरचा comma विसरू नका.' },
            { en: 'Each row has three values in the same order as the parameters: user, pass, message. Empty fields are just "".', mr: 'प्रत्येक ओळीत parameters च्याच क्रमाने तीन values: user, pass, message. रिकामी field म्हणजे फक्त "".' },
            { en: 'Compare the error text with the message parameter, not with a fixed text, so each row checks its own message.', mr: 'error text ची तुलना message parameter शी करा, ठरलेल्या text शी नाही, म्हणजे प्रत्येक ओळ स्वतःचा message तपासेल.' },
            { en: '{"rahul", "care123", "Invalid username or password"},\n{"", "", "Enter your username and password"}\n...\nAssert.assertEquals(driver.findElement(By.id("login-error")).getText(), message);', mr: '{"rahul", "care123", "Invalid username or password"},\n{"", "", "Enter your username and password"}\n...\nAssert.assertEquals(driver.findElement(By.id("login-error")).getText(), message);' },
          ],
          successLine: { en: 'Three rows, three runs, three PASSED lines, from one test method. Adding a fourth wrong login is now one line of data.', mr: 'तीन ओळी, तीन runs, तीन PASSED ओळी, एकाच test method मधून. आता चौथा चुकीचा login जोडणं म्हणजे डेटाची एक ओळ.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Kaka decides the serving order. Read the priorities in this class, guess the order, then press Run and check the log. In which order do the tests run?', mr: 'वाढण्याचा क्रम काका ठरवतात. या class मधल्या priorities वाचा, क्रमाचा अंदाज लावा, मग Run दाबा आणि log तपासा. tests कोणत्या क्रमाने चालतात?' },
          seleniumSandbox: {
            code: `public class OrderTest {
    @Test(priority = 2)
    public void bookAppointment() { System.out.println("bookAppointment"); }

    @Test
    public void openHome() { System.out.println("openHome"); }

    @Test(priority = 1)
    public void login() { System.out.println("login"); }

    @Test(priority = 1)
    public void checkDoctors() { System.out.println("checkDoctors"); }

    @Test(priority = 3, enabled = false)
    public void cancelAppointment() { System.out.println("cancelAppointment"); }
}
`,
          },
          options: [
            'bookAppointment, openHome, login, checkDoctors, cancelAppointment',
            'openHome, checkDoctors, login, bookAppointment',
            'openHome, login, checkDoctors, bookAppointment, cancelAppointment',
            'login, checkDoctors, bookAppointment, cancelAppointment, openHome',
          ],
          correct: [1],
          explain: { en: 'openHome has no priority, so it is 0 and goes first. login and checkDoctors share priority 1, so alphabetical order puts checkDoctors before login. bookAppointment (2) is next. cancelAppointment is enabled = false, so it never runs.', mr: 'openHome ला priority नाही, म्हणजे ती 0, म्हणून ती आधी. login आणि checkDoctors दोघांची priority 1, म्हणून अक्षरक्रमाने checkDoctors आधी, मग login. त्यानंतर bookAppointment (2). cancelAppointment enabled = false आहे, म्हणून ती चालतच नाही.' },
          hints: [
            { en: 'No priority means priority 0. Lowest runs first.', mr: 'priority नसेल तर ती 0. सगळ्यात कमी आधी चालते.' },
            { en: 'Two tests with the same priority go in alphabetical order. And look closely at enabled.', mr: 'एकाच priority च्या दोन tests अक्षरक्रमाने जातात. आणि enabled कडे नीट पाहा.' },
          ],
          successLine: { en: 'Elders first, then alphabetical, and the disabled one never sits down. Remember: good tests still pass in any order.', mr: 'आधी वडीलधारे, मग अक्षरक्रम, आणि disabled test पंगतीला बसतच नाही. लक्षात ठेवा: चांगल्या tests कोणत्याही क्रमात pass होतात.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Where should driver.quit() go so that the browser closes even when a test fails?', mr: 'test fail झाली तरी browser बंद व्हावा म्हणून driver.quit() कुठे ठेवावं?' },
        options: [
          { en: 'At the end of every @Test method', mr: 'प्रत्येक @Test method च्या शेवटी' },
          { en: 'In @BeforeMethod', mr: '@BeforeMethod मध्ये' },
          { en: 'In the @DataProvider', mr: '@DataProvider मध्ये' },
          { en: 'In @AfterMethod', mr: '@AfterMethod मध्ये' },
        ],
        answer: 3,
        explain: { en: '@AfterMethod runs after every test, pass or fail. Lines at the end of a @Test are skipped when an assertion fails.', mr: '@AfterMethod प्रत्येक test नंतर चालते, pass असो की fail. assertion fail झालं की @Test च्या शेवटच्या ओळी वगळल्या जातात.' },
      },
      {
        q: { en: 'A class has three @Test methods and one @BeforeMethod. How many times does @BeforeMethod run?', mr: 'एका class मध्ये तीन @Test methods आणि एक @BeforeMethod आहे. @BeforeMethod किती वेळा चालते?' },
        options: [
          { en: 'Once, at the very start', mr: 'एकदा, अगदी सुरुवातीला' },
          { en: 'Three times, once before each test', mr: 'तीन वेळा, प्रत्येक test आधी एकदा' },
          { en: 'Never, unless a test calls it', mr: 'कधीच नाही, test ने call केल्याशिवाय' },
          { en: 'Six times', mr: 'सहा वेळा' },
        ],
        answer: 1,
        explain: { en: 'The name says it: before each test method. Fresh setup for every batch. (Once for the whole class is @BeforeClass.)', mr: 'नावातच आहे: प्रत्येक test method आधी. प्रत्येक पंगतीसाठी नवी तयारी. (संपूर्ण class साठी एकदा म्हणजे @BeforeClass.)' },
      },
      {
        q: { en: 'How many test results does TestNG report for wrongLogin?', mr: 'wrongLogin साठी TestNG किती test निकाल दाखवतो?' },
        code: '@DataProvider(name = "logins")\npublic Object[][] logins() {\n    return new Object[][] { {"asha", "x"}, {"bob", "care123"}, {"", ""}, {"ASHA", "nope"} };\n}\n\n@Test(dataProvider = "logins")\npublic void wrongLogin(String user, String pass) { /* ... */ }',
        options: ['1', '2', '4', '8'],
        answer: 2,
        explain: { en: 'Four rows, so the test runs four times, with four separate PASSED or FAILED lines. Each row is one run.', mr: 'चार ओळी, म्हणून test चार वेळा चालते, चार वेगवेगळ्या PASSED किंवा FAILED ओळींसह. प्रत्येक ओळ म्हणजे एक run.' },
      },
      {
        q: { en: 'In which order do these tests run?', mr: 'या tests कोणत्या क्रमाने चालतात?' },
        code: '@Test(priority = 1) public void search() { }\n@Test(priority = 0) public void open() { }\n@Test(priority = 1) public void filter() { }',
        options: ['open, filter, search', 'search, open, filter', 'open, search, filter', 'filter, search, open'],
        answer: 0,
        explain: { en: 'Priority 0 first: open. Then priority 1, in alphabetical order: filter before search.', mr: 'आधी priority 0: open. मग priority 1, अक्षरक्रमाने: search आधी filter.' },
      },
    ],
    recap: { line: { en: '@BeforeMethod sets up, @Test serves, @AfterMethod cleans up, every time. Priority sets the order, @DataProvider cooks one recipe for many orders.', mr: '@BeforeMethod तयारी करते, @Test वाढते, @AfterMethod साफ करते, प्रत्येक वेळी. priority क्रम ठरवते, @DataProvider एका रेसिपीने अनेक ऑर्डर बनवतो.' }, icon: '🍽️' },
  },
]
