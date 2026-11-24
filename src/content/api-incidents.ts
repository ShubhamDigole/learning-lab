import type { Incident } from './types.ts'

// Real incidents replayed on the TiffinGo practice server. Facts checked against ABC News reporting
// (including the regulator ACMA's Federal Court filing). Real people were affected: keep the tone respectful.

export const apiIncidents: Incident[] = [
  {
    id: 'optus-2022',
    title: { en: 'The Door Left Open', mr: 'उघडा राहिलेला दरवाजा' },
    year: 'Australia · September 2022',
    unlockAfter: 'ap1-6',
    headline: 'MILLIONS OF CUSTOMERS EXPOSED IN OPTUS CYBER ATTACK',
    counterLabel: { en: 'current and former customers whose details were accessed', mr: 'ज्यांची माहिती पाहिली गेली असे सध्याचे आणि जुने ग्राहक' },
    counterTo: 9.5,
    counterPrefix: '',
    counterSuffix: 'M',
    beats: [
      {
        icon: '🔓',
        time: { en: 'Years before', mr: 'काही वर्षं आधी' },
        text: {
          en: 'Optus is one of Australia\'s biggest telecom companies. The regulator ACMA later said a coding error in one of its access controls (the check on who is asking) went unnoticed for about four years. Optus fixed it on one website domain, but another, unused domain stayed open.',
          mr: 'Optus ही ऑस्ट्रेलियातल्या सर्वात मोठ्या टेलिकॉम कंपन्यांपैकी एक. नियामक ACMA ने नंतर सांगितलं की त्यांच्या एका access control मध्ये (विचारणारा कोण आहे हे तपासणारी चौकी) कोडिंगची चूक होती, आणि ती सुमारे चार वर्षं कोणाच्याच लक्षात आली नाही. Optus ने ती एका website domain वर दुरुस्त केली, पण दुसरं, न वापरलेलं domain उघडंच राहिलं.',
        },
      },
      {
        icon: '🕵️',
        time: { en: '17 to 20 September 2022', mr: '17 ते 20 सप्टेंबर 2022' },
        text: {
          en: 'An attacker found the open door and took customer records. ACMA said it needed no special skill: it was done by a simple process of trial and error.',
          mr: 'एका हल्लेखोराला तो उघडा दरवाजा सापडला आणि त्याने ग्राहकांची माहिती नेली. ACMA च्या मते यासाठी कोणतंही खास कौशल्य लागलं नाही: हे साध्या trial and error ने झालं.',
        },
      },
      {
        icon: '📢',
        time: { en: '22 September 2022', mr: '22 सप्टेंबर 2022' },
        text: {
          en: 'Optus announced the cyber attack. Names, dates of birth, phone numbers and email addresses were exposed, and for some people their address and driver\'s licence or passport number too. Optus said passwords and payment details were not compromised.',
          mr: 'Optus ने सायबर हल्ल्याची घोषणा केली. नावं, जन्मतारखा, फोन नंबर आणि ईमेल पत्ते उघड झाले, आणि काही लोकांचे पत्ते आणि ड्रायव्हिंग लायसन्स किंवा पासपोर्ट नंबरसुद्धा. पासवर्ड आणि पेमेंटची माहिती सुरक्षित असल्याचं Optus ने सांगितलं.',
        },
      },
      {
        icon: '👥',
        time: { en: 'The scale', mr: 'व्याप्ती' },
        text: {
          en: 'According to ACMA, the details of more than 9.5 million current and former customers were accessed, and about 10,200 customers had their details published on the dark web.',
          mr: 'ACMA नुसार 95 लाखांहून जास्त सध्याच्या आणि जुन्या ग्राहकांची माहिती पाहिली गेली, आणि सुमारे 10,200 ग्राहकांची माहिती dark web वर प्रसिद्ध झाली.',
        },
      },
      {
        icon: '⚖️',
        time: { en: '2024 and 2025', mr: '2024 आणि 2025' },
        text: {
          en: 'Two regulators took Optus to the Federal Court: ACMA in May 2024 and the privacy regulator OAIC in August 2025. Optus apologised to its customers and said it had fixed the weakness.',
          mr: 'दोन नियामकांनी Optus ला Federal Court मध्ये नेलं: मे 2024 मध्ये ACMA आणि ऑगस्ट 2025 मध्ये privacy नियामक OAIC. Optus ने ग्राहकांची माफी मागितली आणि ती कमकुवत जागा दुरुस्त केल्याचं सांगितलं.',
        },
      },
    ],
    lesson: {
      en: 'An endpoint that answers without asking who you are will be found. Call every endpoint, even old and forgotten ones, with no token: the only right answer is 401.',
      mr: 'तुम्ही कोण आहात हे न विचारता उत्तर देणारा endpoint कधी ना कधी सापडतोच. प्रत्येक endpoint, अगदी जुने आणि विसरलेलेसुद्धा, token शिवाय call करून पाहा: एकमेव बरोबर उत्तर 401.',
    },
    source: { label: 'ABC News: Optus cyber attack could have been prevented four years prior, says telecoms watchdog', url: 'https://www.abc.net.au/news/2024-06-20/optus-hack/104002682' },
    rewind: {
      intro: {
        en: 'Rewind time. You are testing TiffinGo before launch and find an old endpoint nobody remembers: GET /internal/customers. Find out whether the door is open, before an attacker does. (Practice data only: Asha, Rohan and Fatima are made up.)',
        mr: 'वेळ मागे घ्या. तुम्ही लॉन्चआधी TiffinGo टेस्ट करताय आणि तुम्हाला कोणालाच आठवत नसलेला एक जुना endpoint सापडतो: GET /internal/customers. हल्लेखोराच्या आधी तपासा, दरवाजा उघडा आहे का. (फक्त सरावाचा डेटा: आशा, रोहन आणि फातिमा काल्पनिक आहेत.)',
      },
      steps: [
        {
          kind: 'api',
          prompt: {
            en: 'Prove the door is open. Call GET /internal/customers/1 with no Authorization header at all. An attacker has no token, so neither do you.',
            mr: 'दरवाजा उघडा आहे हे सिद्ध करा. GET /internal/customers/1 call करा, कोणताही Authorization header न देता. हल्लेखोराकडे token नसतो, म्हणून तुमच्याकडेही नाही.',
          },
          starter: { method: 'GET', path: '/internal/customers' },
          expect: { method: 'GET', path: '/internal/customers/1', noHeaders: ['Authorization'], status: 200 },
          solution: { method: 'GET', path: '/internal/customers/1' },
          hints: [
            { en: 'Add the customer id to the end of the path. Leave the header rows empty.', mr: 'path च्या शेवटी customer id जोडा. header rows रिकाम्याच ठेवा.' },
            { en: 'GET /internal/customers/1', mr: 'GET /internal/customers/1' },
          ],
          successLine: {
            en: '200 OK: Asha\'s phone, email, home address and the last 4 digits of her Aadhaar, and nobody asked who you are. The door is open.',
            mr: '200 OK: आशाचा फोन, ईमेल, घरचा पत्ता आणि आधारचे शेवटचे 4 अंक, आणि तुम्ही कोण आहात हे कोणीच विचारलं नाही. दरवाजा उघडा आहे.',
          },
        },
        {
          kind: 'choice',
          prompt: {
            en: 'What should the server have answered to a request with no token, and how serious is this?',
            mr: 'token नसलेल्या request ला सर्व्हरने काय उत्तर द्यायला हवं होतं, आणि हे किती गंभीर आहे?',
          },
          options: [
            { en: '200: internal endpoints can be trusted', mr: '200: internal endpoints वर विश्वास ठेवता येतो' },
            { en: '401 Unauthorized. Critical: anyone on the internet can read customers\' personal data', mr: '401 Unauthorized. Critical: इंटरनेटवर कोणीही ग्राहकांची वैयक्तिक माहिती वाचू शकतो' },
            { en: '404, and it is a minor cosmetic issue', mr: '404, आणि ही किरकोळ दिसण्याची समस्या आहे' },
            { en: '500, because the server crashed', mr: '500, कारण सर्व्हर क्रॅश झाला' },
          ],
          correct: [1],
          explain: {
            en: 'No token means the question "who are you?" has no answer, so the only right reply is 401. Leaking personal data is critical: report it at once with the exact request, stop the release, and ask for the endpoint to be locked or removed. Check the list too: GET /internal/customers returns every customer.',
            mr: 'token नाही म्हणजे "तुम्ही कोण?" या प्रश्नाला उत्तरच नाही, म्हणून एकमेव बरोबर उत्तर 401. वैयक्तिक माहिती लीक होणं critical आहे: नेमक्या request सह लगेच रिपोर्ट करा, रिलीज थांबवा, आणि endpoint बंद करायला किंवा काढून टाकायला सांगा. यादीसुद्धा तपासा: GET /internal/customers प्रत्येक ग्राहक देतो.',
          },
          hints: [
            { en: 'Which status code means "log in first"?', mr: '"आधी लॉगिन करा" म्हणजे कोणता status code?' },
            { en: 'Phones, addresses and ID numbers in the wrong hands: is that minor?', mr: 'फोन, पत्ते आणि ओळखपत्र क्रमांक चुकीच्या हातात: हे किरकोळ आहे का?' },
          ],
          successLine: { en: 'Door found, reported and locked before launch. That is what testers are for.', mr: 'दरवाजा सापडला, रिपोर्ट झाला आणि लॉन्चआधी बंद झाला. टेस्टर्स यासाठीच असतात.' },
        },
      ],
    },
  },
]
