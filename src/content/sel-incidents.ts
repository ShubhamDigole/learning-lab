import type { Incident } from './types.ts'

// Real incidents replayed on the CareBridge practice app. Facts checked against the US Department of
// Health and Human Services Office of Inspector General case study "HealthCare.gov: Case Study of CMS
// Management of the Federal Marketplace" (OEI-06-14-00350, February 2016). Real people were affected:
// keep the tone respectful and factual.

export const selIncidents: Incident[] = [
  {
    id: 'healthcare-gov-2013',
    title: { en: 'The Website That Opened Too Soon', mr: 'खूप लवकर उघडलेली website' },
    year: 'USA · October 2013',
    unlockAfter: 'se1-7',
    headline: 'NEW HEALTH INSURANCE WEBSITE BUCKLES WITHIN HOURS OF LAUNCH',
    counterLabel: { en: 'people who managed to apply and pick a plan on the first day', mr: 'पहिल्या दिवशी अर्ज करून plan निवडू शकलेले लोक' },
    counterTo: 6,
    counterPrefix: '',
    counterSuffix: '',
    beats: [
      {
        icon: '🏛️',
        time: { en: 'The plan', mr: 'योजना' },
        text: {
          en: 'HealthCare.gov is the US government website where people compare and buy private health insurance, for those living in states without their own marketplace. It was built by the agency CMS with many contractors, and the launch date was set: 1 October 2013.',
          mr: 'HealthCare.gov ही अमेरिकन सरकारची website आहे, जिथे स्वतःचं marketplace नसलेल्या राज्यांतले लोक खासगी आरोग्य विमा तुलना करून विकत घेतात. ती CMS या सरकारी संस्थेने अनेक contractors सोबत बांधली, आणि launch ची तारीख ठरली: 1 ऑक्टोबर 2013.',
        },
      },
      {
        icon: '🧪',
        time: { en: 'August to September 2013', mr: 'ऑगस्ट ते सप्टेंबर 2013' },
        text: {
          en: 'By August, staff and contractors knew the system would not be fully tested before launch. The pieces arrived too late, so full end-to-end testing (checking that all the parts work together, the way a real user goes through them) was never completed. One contractor later said: "End-to-end testing is critical. It\'s suicide not to do it."',
          mr: 'ऑगस्टपर्यंत staff आणि contractors ना कळलं होतं की launch आधी system पूर्ण tested होणार नाही. भाग खूप उशिरा आले, त्यामुळे पूर्ण end-to-end testing (खरा user जसा जातो तसे सगळे भाग एकत्र चालतात का हे तपासणं) कधीच पूर्ण झालं नाही. एका contractor ने नंतर सांगितलं: "End-to-end testing अत्यंत महत्त्वाचं आहे. ते न करणं म्हणजे आत्महत्या."',
        },
      },
      {
        icon: '💥',
        time: { en: '1 October 2013', mr: '1 ऑक्टोबर 2013' },
        text: {
          en: 'About 250,000 people used the site at the same time, far more than planned. Outages began within 2 hours of launch, and many people could not log in or sign up. Investigators found it was not only the crowd: there were core problems in how the website performed.',
          mr: 'सुमारे 2,50,000 लोकांनी एकाच वेळी site वापरली, ठरवलेल्यापेक्षा खूपच जास्त. launch नंतर 2 तासांत site बंद पडायला सुरुवात झाली, आणि अनेकांना login किंवा sign up करता आलं नाही. चौकशीत आढळलं की फक्त गर्दी हे कारण नव्हतं: website च्या कामगिरीतच मूलभूत समस्या होत्या.',
        },
      },
      {
        icon: '6️⃣',
        time: { en: 'The first day', mr: 'पहिला दिवस' },
        text: {
          en: 'In the end, only six people were able to submit an application and select a plan on the first day. One contractor remembered: "Everything was turning red on our screens."',
          mr: 'शेवटी पहिल्या दिवशी फक्त सहा लोक अर्ज पाठवून plan निवडू शकले. एका contractor ला आठवतं: "आमच्या screens वर सगळं लाल होत चाललं होतं."',
        },
      },
      {
        icon: '🛠️',
        time: { en: 'Two months later', mr: 'दोन महिन्यांनंतर' },
        text: {
          en: 'CMS and the contractors worked as one team and fixed the most important things first. By 1 December 2013 the site was much better: it was working over 90 percent of the time, up from 42 percent in early November. The first enrollment period ended with 5.4 million people choosing a plan through the federal marketplace.',
          mr: 'CMS आणि contractors नी एक टीम म्हणून काम केलं आणि सगळ्यात महत्त्वाच्या गोष्टी आधी दुरुस्त केल्या. 1 डिसेंबर 2013 पर्यंत site खूप सुधारली: नोव्हेंबरच्या सुरुवातीला 42 टक्के वेळ चालणारी site आता 90 टक्क्यांहून जास्त वेळ चालू होती. पहिला enrollment कालावधी संपला तेव्हा 54 लाख लोकांनी federal marketplace मधून plan निवडला होता.',
        },
      },
    ],
    lesson: {
      en: 'An end-to-end smoke test of the main journey, run on the fully joined-up system before launch, is the cheapest insurance there is. If the core flow cannot pass it, the launch is not ready.',
      mr: 'launch आधी, सगळे भाग जोडलेल्या पूर्ण system वर मुख्य प्रवासाची end-to-end smoke test चालवणं हा सगळ्यात स्वस्त विमा आहे. मुख्य flow ती pass करू शकत नसेल, तर launch तयार नाही.',
    },
    source: { label: 'HHS Office of Inspector General: HealthCare.gov case study (OEI-06-14-00350, 2016)', url: 'https://oig.hhs.gov/oei/reports/oei-06-14-00350.pdf' },
    rewind: {
      intro: {
        en: 'Rewind time. It is the night before CareBridge opens online booking to the whole city. Every piece has been tested on its own, but nobody has walked the full journey from start to finish. You write the end-to-end smoke test, and you run it before launch.',
        mr: 'वेळ मागे घ्या. CareBridge संपूर्ण शहरासाठी online booking उघडणार त्याच्या आदल्या रात्रीची वेळ आहे. प्रत्येक भाग स्वतंत्रपणे tested आहे, पण सुरुवातीपासून शेवटपर्यंत पूर्ण प्रवास कोणीच केलेला नाही. तुम्ही end-to-end smoke test लिहा, आणि ती launch आधी चालवा.',
      },
      steps: [
        {
          kind: 'selenium',
          prompt: { en: 'This is tonight\'s release build. The smoke test already picks a date, waits for the 10:30 slot, types the patient name and ticks the terms. Finish the journey: assert that Confirm booking is enabled, click it, wait for /confirmation and assert the title is "Booking confirmed | CareBridge". On this build the test must FAIL on an assertion that proves the core flow is broken.', mr: 'हा आजच्या रात्रीचा release build आहे. smoke test आधीच तारीख निवडते, 10:30 च्या slot ची वाट पाहते, पेशंटचं नाव टाइप करते आणि terms वर tick करते. प्रवास पूर्ण करा: Confirm booking enabled आहे हे assert करा, त्यावर click करा, /confirmation ची वाट पाहा आणि title "Booking confirmed | CareBridge" आहे हे assert करा. या build वर test ने, मुख्य flow बिघडलाय हे सिद्ध करणाऱ्या assertion वर FAIL व्हायला हवं.' },
          startUrl: 'https://carebridge.test/book',
          loggedIn: true,
          build: ['confirm-stuck'],
          expectFailure: true,
          noSleep: true,
          starter: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
driver.get("https://carebridge.test/book");
driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".slot[data-time='10:30']"))).click();
driver.findElement(By.id("patient-name")).sendKeys("Asha Patil");
driver.findElement(By.id("terms")).click();

// TODO: assert that "confirm-btn" is enabled (isEnabled()), with the message "Confirm button is enabled"
// TODO: click it, wait for "/confirmation", and assert the title is "Booking confirmed | CareBridge"`,
          solution: `WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
driver.get("https://carebridge.test/book");
driver.findElement(By.id("date")).sendKeys("2026-12-10");
driver.findElement(By.id("check-slots")).click();
wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".slot[data-time='10:30']"))).click();
driver.findElement(By.id("patient-name")).sendKeys("Asha Patil");
driver.findElement(By.id("terms")).click();

Assert.assertTrue(driver.findElement(By.id("confirm-btn")).isEnabled(), "Confirm button is enabled");
driver.findElement(By.id("confirm-btn")).click();
wait.until(ExpectedConditions.urlContains("/confirmation"));
Assert.assertEquals(driver.getTitle(), "Booking confirmed | CareBridge");`,
          hints: [
            { en: 'With a slot picked and the terms ticked, Confirm should be enabled. Check that with Assert.assertTrue(... .isEnabled(), "...").', mr: 'slot निवडला आणि terms tick केल्या की Confirm enabled व्हायला हवं. ते Assert.assertTrue(... .isEnabled(), "...") ने तपासा.' },
            { en: 'Assert.assertTrue(driver.findElement(By.id("confirm-btn")).isEnabled(), "Confirm button is enabled");', mr: 'Assert.assertTrue(driver.findElement(By.id("confirm-btn")).isEnabled(), "Confirm button is enabled");' },
            { en: 'Then: driver.findElement(By.id("confirm-btn")).click(); wait.until(ExpectedConditions.urlContains("/confirmation")); and assert the title. On this build the run stops at the isEnabled check, and that red line is your proof.', mr: 'मग: driver.findElement(By.id("confirm-btn")).click(); wait.until(ExpectedConditions.urlContains("/confirmation")); आणि title assert करा. या build वर run isEnabled च्या check वरच थांबतो, आणि ती लाल ओळ हाच तुमचा पुरावा.' },
          ],
          successLine: { en: '"Confirm button is enabled expected [true] but found [false]". Nobody can book. You found it the night before launch, not on launch day.', mr: '"Confirm button is enabled expected [true] but found [false]". कोणालाच booking करता येत नाही. हे तुम्हाला launch च्या आदल्या रात्री सापडलं, launch च्या दिवशी नाही.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Every team had tested its own piece, and each piece worked alone. What would an end-to-end smoke test before launch have caught that those piece-by-piece tests missed?', mr: 'प्रत्येक टीमने आपापला भाग test केला होता, आणि प्रत्येक भाग एकटा चालत होता. तुकड्या-तुकड्यांच्या tests मधून जे निसटलं, ते launch आधीच्या end-to-end smoke test ने काय पकडलं असतं?' },
          options: [
            { en: 'Spelling mistakes in the help pages', mr: 'help pages मधल्या स्पेलिंगच्या चुका' },
            { en: 'Nothing new: if every piece passes alone, the whole system must work', mr: 'नवं काहीच नाही: प्रत्येक भाग एकटा pass झाला तर पूर्ण system चालणारच' },
            { en: 'Which colour the buttons should be', mr: 'बटणांचा रंग कोणता असावा' },
            { en: 'That a real user cannot finish the core journey when the pieces are joined together, so the launch should wait until it passes', mr: 'भाग एकत्र जोडल्यावर खरा user मुख्य प्रवास पूर्ण करू शकत नाही, म्हणून ती pass होईपर्यंत launch थांबायला हवं' },
          ],
          correct: [3],
          explain: { en: 'Pieces can each pass alone and still fail together. An end-to-end smoke test walks the real journey (log in, apply, choose, confirm) on the joined-up system. If it cannot finish, nobody else will either, and that is the moment to say "not yet".', mr: 'प्रत्येक भाग एकटा pass होऊनही एकत्र fail होऊ शकतो. end-to-end smoke test जोडलेल्या system वर खरा प्रवास करते (login, अर्ज, निवड, confirm). ती पूर्ण करू शकली नाही तर दुसरं कोणीच करू शकणार नाही, आणि "अजून नाही" म्हणायची तीच वेळ.' },
          hints: [
            { en: 'Think about what "end-to-end" means: from the first page to the last, through every piece.', mr: '"end-to-end" म्हणजे काय याचा विचार करा: पहिल्या page पासून शेवटच्या पर्यंत, प्रत्येक भागातून.' },
            { en: 'The investigators said the pieces arrived too late to be tested together. What does testing them together prove?', mr: 'चौकशीत सांगितलं की भाग एकत्र test करण्यासाठी खूप उशिरा आले. ते एकत्र test केल्याने काय सिद्ध होतं?' },
          ],
          successLine: { en: 'One smoke test, the night before launch. That is how you protect millions of people from a red screen.', mr: 'launch च्या आदल्या रात्री एक smoke test. लाखो लोकांना लाल screen पासून असंच वाचवता येतं.' },
        },
      ],
    },
  },
]
