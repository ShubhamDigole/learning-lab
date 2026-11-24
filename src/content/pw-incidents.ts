import type { Incident, T } from './types.ts'

// Real incidents replayed on the SkyHop practice site. Facts checked against the US District Court
// (S.D.N.Y.) findings of fact in "In re Citibank August 11, 2020 Wire Transfers", 20-CV-6539 (JMF),
// filed 16 February 2021, and CNBC's report of the appeal decision (8 September 2022).
// Real people and companies are involved: keep the tone respectful and factual. No blame on individuals.

const H = "import { test, expect } from '@playwright/test';\n\n"
/** a hint that is only code: the same text in both languages */
const c = (s: string): T => ({ en: s, mr: s })

export const pwIncidents: Incident[] = [
  {
    id: 'citibank-2020',
    title: { en: 'The Screen That Said "Principal to Wash"', mr: '"Principal to Wash" म्हणणारा screen' },
    year: 'USA · August 2020',
    unlockAfter: 'pw1-6',
    headline: 'BANK SENDS ALMOST $900 MILLION OF ITS OWN MONEY BY MISTAKE',
    counterLabel: { en: 'of Citibank\'s own money (US dollars) sent out by mistake, when only a $7.8 million interest payment was meant to go', mr: 'चुकून बाहेर गेलेले Citibank चे स्वतःचे पैसे (US dollars), जेव्हा फक्त $7.8 दशलक्षाचा interest payment जायचा होता' },
    counterTo: 894,
    counterPrefix: '$',
    counterSuffix: 'M',
    beats: [
      {
        icon: '🏦',
        time: { en: '11 August 2020, afternoon', mr: '11 ऑगस्ट 2020, दुपार' },
        text: {
          en: 'Citibank was the agent for a large loan taken by the cosmetics company Revlon. Its job that day: pass about $7.8 million of interest to the lenders. In Citibank\'s loan software, Flexcube, the way to do this was to enter it as if the whole loan was being paid off, and send the principal, about $894 million, to an internal "wash account" so that it never left the bank.',
          mr: 'Revlon या cosmetics कंपनीने घेतलेल्या एका मोठ्या कर्जासाठी Citibank agent होती. त्या दिवशीचं काम: सुमारे $7.8 दशलक्ष interest lenders पर्यंत पोहोचवणं. Citibank च्या Flexcube या कर्जाच्या software मध्ये हे करायची पद्धत अशी होती: पूर्ण कर्ज फेडतोय असं भरायचं, आणि principal, म्हणजे सुमारे $894 दशलक्ष, एका अंतर्गत "wash account" कडे पाठवायचं, म्हणजे ते बँकेबाहेर जाणारच नाही.',
        },
      },
      {
        icon: '☑️',
        time: { en: 'About 5:15 to 5:45 pm', mr: 'साधारण संध्याकाळी 5:15 ते 5:45' },
        text: {
          en: 'The screen showed several boxes, each with a field for an account number. The bank\'s manual said that to keep the principal inside, ALL of three fields had to be set to the wash account: FRONT, FUND and PRINCIPAL. The person entering the payment (the "maker") ticked only PRINCIPAL. To him, the screen looked exactly right.',
          mr: 'screen वर अनेक boxes होते, प्रत्येकासोबत account number भरायची जागा. बँकेच्या manual मध्ये लिहिलं होतं की principal आत ठेवायचं असेल तर तिन्ही fields wash account वर लावायलाच हवेत: FRONT, FUND आणि PRINCIPAL. payment भरणाऱ्या व्यक्तीने ("maker") फक्त PRINCIPAL वर tick केलं. त्याला screen अगदी बरोबर दिसत होता.',
        },
      },
      {
        icon: '👀',
        time: { en: 'Just before 6 pm', mr: 'संध्याकाळी 6 च्या थोडं आधी' },
        text: {
          en: 'Citibank\'s "six-eye" rule needs three people to approve: a maker and a checker (both from the contractor Wipro, in India) and an approver (a Citibank senior manager in Delaware). All three believed the principal was going to the wash account. The approver wrote: "Looks good, please proceed. Principal is going to wash." A warning popped up: "Account used is Wire Account and Funds will be sent out of the bank. Do you want to continue?" It did not show how much money. The checker clicked Yes.',
          mr: 'Citibank च्या "six-eye" नियमानुसार तीन लोकांची मंजुरी लागते: maker आणि checker (दोघंही भारतातल्या Wipro या contractor कडचे) आणि approver (Delaware मधला Citibank चा senior manager). तिघांनाही वाटत होतं की principal wash account कडे जातंय. approver ने लिहिलं: "Looks good, please proceed. Principal is going to wash." एक सूचना आली: "Account used is Wire Account and Funds will be sent out of the bank. Do you want to continue?" किती पैसे जाणार ते त्यात दिसत नव्हतं. checker ने Yes दाबलं.',
        },
      },
      {
        icon: '💸',
        time: { en: '12 August 2020, 9 am', mr: '12 ऑगस्ट 2020, सकाळी 9' },
        text: {
          en: 'The next morning, the daily check that matches money in against money out showed huge gaps. Each of the 315 lenders had received its full share of the principal, to the penny: about $894 million of Citibank\'s own money, on top of the interest. Citibank began asking for it back that afternoon.',
          mr: 'दुसऱ्या दिवशी सकाळी, आलेल्या आणि गेलेल्या पैशांची रोज जुळवणी करणाऱ्या तपासणीत मोठे फरक दिसले. 315 पैकी प्रत्येक lender ला principal मधला आपला पूर्ण वाटा, अगदी पैशा-पैशासकट, मिळाला होता: interest शिवाय Citibank चे स्वतःचे सुमारे $894 दशलक्ष. त्याच दुपारी Citibank ने ते परत मागायला सुरुवात केली.',
        },
      },
      {
        icon: '⚖️',
        time: { en: '2021 to 2022', mr: '2021 ते 2022' },
        text: {
          en: 'Some lenders returned the money. Lenders managed by ten firms kept more than $500 million, and Citibank took them to court. In February 2021 a US federal judge ruled they could keep it, and called the error "one of the biggest blunders in banking history". In September 2022 an appeals court overturned that ruling in Citibank\'s favour. Two years of court cases, all starting from one screen that looked right.',
          mr: 'काही lenders नी पैसे परत केले. दहा कंपन्यांनी सांभाळलेल्या lenders नी $500 दशलक्षांहून जास्त ठेवले, आणि Citibank त्यांना कोर्टात घेऊन गेली. फेब्रुवारी 2021 मध्ये एका US federal judge ने निकाल दिला की ते पैसे ठेवू शकतात, आणि या चुकीला "बँकिंगच्या इतिहासातली सगळ्यात मोठी घोडचूक" म्हटलं. सप्टेंबर 2022 मध्ये appeals court ने तो निकाल उलटवून Citibank च्या बाजूने निर्णय दिला. दोन वर्षं कोर्टकचेरी, आणि सुरुवात एका बरोबर दिसणाऱ्या screen पासून.',
        },
      },
    ],
    lesson: {
      en: 'Three careful people approved a screen whose labels did not match what the system would do, and a warning that did not say how much. A test that only proves "the clicks work" would have passed. Test the outcome and what the user is told: the amount on the button equals the amount charged, and the question appears before anything that cannot be undone.',
      mr: 'तीन काळजीपूर्वक काम करणाऱ्या लोकांनी असा screen मंजूर केला ज्याचे labels system प्रत्यक्षात जे करणार होती त्याच्याशी जुळत नव्हते, आणि अशी सूचना जी किती पैसे ते सांगत नव्हती. फक्त "clicks चालतात" हे सिद्ध करणारी test pass झाली असती. निकाल आणि user ला काय सांगितलं जातं ते test करा: बटणावरची रक्कम म्हणजेच कापली जाणारी रक्कम, आणि परत न करता येणाऱ्या कोणत्याही कृतीआधी प्रश्न दिसतो.',
    },
    source: { label: 'US District Court, S.D.N.Y.: In re Citibank August 11, 2020 Wire Transfers, findings of fact (16 February 2021)', url: 'https://www.nysd.uscourts.gov/sites/default/files/2021-02/20cv6539%20Citibank%20Opinion.pdf' },
    rewind: {
      intro: {
        en: 'Rewind time. SkyHop is about to release a new payment page. Every button clicks, every page loads. But does the screen tell the truth? You check that what the passenger is told matches what really happens: the amount on the Pay button, and the question before a trip is cancelled.',
        mr: 'वेळ मागे घ्या. SkyHop नवं payment page release करणार आहे. प्रत्येक बटण click होतं, प्रत्येक page उघडतं. पण screen खरं सांगतो का? प्रवाशाला जे सांगितलं जातं ते प्रत्यक्षात जे घडतं त्याच्याशी जुळतं का, हे तुम्ही तपासा: Pay बटणावरची रक्कम, आणि trip cancel होण्याआधीचा प्रश्न.',
      },
      steps: [
        {
          kind: 'playwright',
          prompt: { en: 'This is the release build. The test already adds travel insurance to the demo booking (SH 201, fare ₹4,500) and opens the payment page. Work out the total yourself (₹4,500 + ₹299), then assert: the total line is "₹4,799", the button "Pay ₹4,799" is visible, and after clicking it, paid on the confirmation is "₹4,799". On this build the test must FAIL on an assertion that proves the screen is not telling the truth.', mr: 'हा release build आहे. test आधीच demo booking (SH 201, fare ₹4,500) मध्ये travel insurance जोडते आणि payment page उघडते. total स्वतः काढा (₹4,500 + ₹299), मग assert करा: total ची ओळ "₹4,799" आहे, "Pay ₹4,799" बटण दिसतं, आणि त्यावर click केल्यावर confirmation वरचं paid "₹4,799" आहे. या build वर test ने, screen खरं सांगत नाही हे सिद्ध करणाऱ्या assertion वर FAIL व्हायला हवं.' },
          startUrl: '/passenger?demo=1',
          build: ['total-wrong'],
          expectFailure: true,
          noWaitForTimeout: true,
          starter: `${H}test('the Pay button tells the truth', async ({ page }) => {
  await page.goto('/passenger?demo=1');
  await page.getByRole('checkbox', { name: 'Add travel insurance' }).check();
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  // ₹4,500 fare + ₹299 insurance. Work out the total yourself, never copy it from the screen.
  // TODO: assert the total line is '₹4,799'
  // TODO: assert the button 'Pay ₹4,799' is visible, click it, assert paid is '₹4,799'
});
`,
          solution: `${H}test('the Pay button tells the truth', async ({ page }) => {
  await page.goto('/passenger?demo=1');
  await page.getByRole('checkbox', { name: 'Add travel insurance' }).check();
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(page.getByTestId('total')).toHaveText('₹4,799');
  const pay = page.getByRole('button', { name: 'Pay ₹4,799' });
  await expect(pay).toBeVisible();
  await pay.click();
  await expect(page.getByTestId('paid')).toHaveText('₹4,799');
});
`,
          mustUse: [{ pattern: "getByTestId\\(\\s*'total'\\s*\\)[\\s\\S]*toHaveText\\(\\s*'₹4,799'", message: { en: "Check the total line against your own sum: await expect(page.getByTestId('total')).toHaveText('₹4,799');", mr: "total ची ओळ तुमच्या स्वतःच्या बेरजेशी तपासा: await expect(page.getByTestId('total')).toHaveText('₹4,799');" } }],
          hints: [
            { en: 'The claim is what the screen shows: the total line and the label on the Pay button. The truth is your own sum, 4500 + 299 = 4799. Compare them with toHaveText and a button found by its exact name.', mr: 'दावा म्हणजे screen जे दाखवतो ते: total ची ओळ आणि Pay बटणावरचं label. सत्य म्हणजे तुमची स्वतःची बेरीज, 4500 + 299 = 4799. toHaveText आणि नेमक्या नावाने शोधलेल्या बटणाने त्यांची तुलना करा.' },
            c("await expect(page.getByTestId('total')).toHaveText('₹4,799');"),
            c("const pay = page.getByRole('button', { name: 'Pay ₹4,799' });\nawait expect(pay).toBeVisible();\nawait pay.click();\nawait expect(page.getByTestId('paid')).toHaveText('₹4,799');"),
          ],
          successLine: { en: 'Received "₹5,098": the insurance counted twice, and the button would have said "Pay ₹5,098". Every click worked. Only a check on the amount, against a sum you worked out yourself, could see it.', mr: 'Received "₹5,098": insurance दोनदा मोजला, आणि बटणाने "Pay ₹5,098" सांगितलं असतं. प्रत्येक click चाललं. फक्त तुम्ही स्वतः काढलेल्या बेरजेशी रकमेची तुलना करणाऱ्या check लाच हे दिसू शकलं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Rex wrote this test for the Cancel trip button. It listens for any dialog, writes down its message and answers Cancel, so nothing should be cancelled. Press Run on the release build and read the report. What does it prove?', mr: 'Rex ने Cancel trip बटणासाठी ही test लिहिली. ती कोणत्याही dialog साठी ऐकते, त्याचा message लिहून ठेवते आणि Cancel असं उत्तर देते, म्हणजे काहीच cancel व्हायला नको. release build वर Run दाबा आणि report वाचा. ती काय सिद्ध करते?' },
          playwrightSandbox: {
            startUrl: '/trips',
            loggedIn: true,
            build: ['cancel-no-dialog'],
            code: `${H}test.use({ storageState: 'auth/asha.json' });

test('cancel must ask first', async ({ page }) => {
  const asked: string[] = [];
  page.on('dialog', dialog => {
    asked.push(dialog.message());
    dialog.dismiss();
  });
  await page.goto('/trips');
  const trip = page.getByTestId('trip').filter({ hasText: 'SKY1A2' });
  await trip.getByRole('button', { name: 'Cancel trip' }).click();
  await page.reload();
  await expect(trip.getByTestId('trip-status')).toHaveText('Confirmed');
  expect(asked).toEqual(['Cancel trip SKY1A2? This cannot be undone.']);
});
`,
          },
          options: [
            { en: 'The test is broken: Cancel trip cannot be clicked', mr: 'test बिघडली आहे: Cancel trip वर click करता येत नाही' },
            { en: 'Nothing is wrong: the trip shows Cancelled, so the button works', mr: 'काहीच चुकलेलं नाही: trip Cancelled दाखवते, म्हणजे बटण चालतं' },
            { en: 'One click cancelled the trip with no question at all: the answer "Cancel" was never even asked for, so the screen did something the passenger never agreed to', mr: 'एका click ने कोणताही प्रश्न न विचारता trip cancel झाली: "Cancel" हे उत्तर मागितलंच गेलं नाही, म्हणजे प्रवाशाने कधीच मान्य न केलेली गोष्ट screen ने केली' },
            { en: 'The reload cancelled the trip', mr: 'reload ने trip cancel केली' },
          ],
          correct: [2],
          explain: { en: 'The test said "no" to every question, yet the trip came back Cancelled, and the list of questions asked is empty. On the good build the same test passes: the question appears, gets "no", and the trip stays Confirmed. Like the Citibank warning that never showed the amount, a missing or vague question lets one click do something that cannot be undone.', mr: 'test ने प्रत्येक प्रश्नाला "नाही" म्हटलं, तरीही trip Cancelled दिसली, आणि विचारलेल्या प्रश्नांची यादी रिकामी आहे. चांगल्या build वर हीच test pass होते: प्रश्न येतो, त्याला "नाही" मिळतं, आणि trip Confirmed राहते. रक्कम कधीच न दाखवणाऱ्या Citibank च्या सूचनेसारखंच, गायब किंवा अस्पष्ट प्रश्न एका click ला परत न करता येणारी गोष्ट करू देतो.' },
          hints: [
            { en: 'Look at Received for the trip status. The test answered every dialog with dismiss. How could the trip still be cancelled?', mr: 'trip status साठीचं Received पाहा. test ने प्रत्येक dialog ला dismiss ने उत्तर दिलं. तरी trip cancel कशी झाली?' },
            { en: 'If the dialog had appeared, what would the array asked contain?', mr: 'dialog आला असता, तर asked या array मध्ये काय असतं?' },
          ],
          successLine: { en: 'A question before an action that cannot be undone is part of the product. Now your suite checks that it is asked, and what it says.', mr: 'परत न करता येणाऱ्या कृतीआधीचा प्रश्न हा product चाच भाग आहे. आता तुमचा suite तो विचारला जातो का, आणि तो काय म्हणतो, हे तपासतो.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Back to Citibank. A test was written for the Flexcube payment screen: tick PRINCIPAL, enter the wash account, click through the warning, and assert that no error appears. Why would that test have passed on 11 August 2020?', mr: 'परत Citibank कडे. Flexcube च्या payment screen साठी एक test लिहिली: PRINCIPAL वर tick, wash account भरा, सूचनेतून click करत पुढे जा, आणि कोणताही error दिसत नाही हे assert करा. 11 ऑगस्ट 2020 ला ती test pass का झाली असती?' },
          options: [
            { en: 'Because it checked only that the clicks worked. A useful test checks the outcome: how much money actually leaves, and that the warning says the amount', mr: 'कारण तिने फक्त clicks चालतात एवढंच तपासलं. उपयोगी test निकाल तपासते: प्रत्यक्षात किती पैसे बाहेर जातात, आणि सूचना रक्कम सांगते का' },
            { en: 'Because tests cannot run on banking software', mr: 'कारण banking software वर tests चालू शकत नाहीत' },
            { en: 'Because three people approved it, so it was correct', mr: 'कारण तिघांनी मंजुरी दिली, म्हणजे ते बरोबरच होतं' },
            { en: 'It would have failed, because the warning appeared', mr: 'ती fail झाली असती, कारण सूचना आली होती' },
          ],
          correct: [0],
          explain: { en: 'Nothing errored. The boxes ticked, the warning was answered, the screens moved on. The problem was the outcome: $894 million left instead of staying in the wash account. Tests that assert outcomes (the amount sent, the total charged) and what the user is told (does the warning name the amount?) catch what clicking alone never will.', mr: 'कुठेच error आला नाही. boxes tick झाले, सूचनेला उत्तर दिलं, screens पुढे गेले. अडचण निकालात होती: $894 दशलक्ष wash account मध्ये राहण्याऐवजी बाहेर गेले. निकाल (पाठवलेली रक्कम, कापलेला total) आणि user ला काय सांगितलं जातं (सूचनेत रक्कम आहे का?) हे assert करणाऱ्या tests, फक्त click करून कधीच न दिसणारं पकडतात.' },
          hints: [
            { en: 'What did the test assert? Was there an error on 11 August?', mr: 'test ने काय assert केलं? 11 ऑगस्टला error आला होता का?' },
            { en: 'Think about the Pay button you just tested: you checked the amount, not only that the button clicked.', mr: 'आत्ताच test केलेल्या Pay बटणाचा विचार करा: तुम्ही फक्त बटण click झालं एवढं नाही, रक्कम तपासलीत.' },
          ],
          successLine: { en: 'Clicks prove the screen moves. Outcomes prove it tells the truth. Your suite checks both.', mr: 'clicks सिद्ध करतात की screen पुढे जातो. निकाल सिद्ध करतात की तो खरं सांगतो. तुमचा suite दोन्ही तपासतो.' },
        },
      ],
    },
  },
]
