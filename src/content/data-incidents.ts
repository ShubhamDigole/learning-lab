import type { Incident } from './types.ts'

// Real incidents replayed in the Data World labs. Capital One (2019), facts checked against:
// US Department of Justice, W.D. Washington (arrest press release and case page, 2019: intrusion "through a
// misconfigured web application firewall"; conviction press release, June 2022: a scanning tool for
// misconfigured AWS accounts, more than 30 entities, more than 100 million US people affected);
// Capital One's facts page and its 29 July 2019 press release (access on 22 and 23 March 2019, report on
// 17 July, confirmed 19 July, about 100 million people in the US and 6 million in Canada, data types and
// counts, encrypted data could be decrypted, tokenized fields stayed protected);
// the OCC news release 2020-101 (6 August 2020, $80 million civil money penalty); KrebsOnSecurity,
// "What We Can Learn from the Capital One Hack" (August 2019: misconfigured WAF with too many permissions,
// SSRF to the metadata service); the criminal complaint as quoted in the class-action complaint (the
// WAF role's credentials, "List Buckets" and "Sync" commands, more than 700 folders or buckets); AWS EC2 docs
// on IMDSv2 (session tokens, defence against SSRF). Real people were affected: keep the tone factual.

const TRAIL = `{"time": "2026-11-24T01:58:10Z", "role": "waf-role", "action": "PutObject", "resource": "chaicart-waf-logs/waf/2026/11/24/0158.log"}
{"time": "2026-11-24T02:00:07Z", "role": "etl-role", "action": "GetObject", "resource": "chaicart-raw/raw/orders/2026/11/24/Pune Camp.csv"}
{"time": "2026-11-24T02:00:08Z", "role": "etl-role", "action": "PutObject", "resource": "chaicart-lake/clean/orders/dt=2026-11-24/store=pune-camp/orders.csv"}
{"time": "2026-11-24T02:13:44Z", "role": "waf-role", "action": "ListBuckets", "resource": "*"}
{"time": "2026-11-24T02:13:51Z", "role": "waf-role", "action": "ListBucket", "resource": "chaicart-cards"}
{"time": "2026-11-24T02:14:02Z", "role": "waf-role", "action": "GetObject", "resource": "chaicart-cards/applications/2026/11/batch-001.csv"}
{"time": "2026-11-24T02:15:00Z", "role": "waf-role", "action": "PutObject", "resource": "chaicart-waf-logs/waf/2026/11/24/0215.log"}
{"time": "2026-11-24T02:20:31Z", "role": "etl-role", "action": "ListBucket", "resource": "chaicart-raw"}
`

const TRAIL_QUIET = `{"time": "2026-11-25T01:58:10Z", "role": "waf-role", "action": "PutObject", "resource": "chaicart-waf-logs/waf/2026/11/25/0158.log"}
{"time": "2026-11-25T02:00:07Z", "role": "etl-role", "action": "GetObject", "resource": "chaicart-raw/raw/orders/2026/11/25/Kothrud & Baner.csv"}
{"time": "2026-11-25T02:00:09Z", "role": "etl-role", "action": "PutObject", "resource": "chaicart-lake/clean/orders/dt=2026-11-25/store=kothrud-baner/orders.csv"}
`

const TRAIL_NEW_ROLE = `{"time": "2026-11-26T02:00:07Z", "role": "etl-role", "action": "DeleteObject", "resource": "chaicart-raw/raw/orders/2026/11/26/Aundh.csv"}
{"time": "2026-11-26T02:01:00Z", "role": "intern-role", "action": "GetObject", "resource": "chaicart-cards/applications/2026/11/batch-002.csv"}
{"time": "2026-11-26T02:02:00Z", "role": "waf-role", "action": "PutObject", "resource": "chaicart-waf-logs/waf/2026/11/26/0202.log"}
`

const TRAIL_HEAD = `import json

NORMAL = {
    'waf-role': {'PutObject'},
    'etl-role': {'GetObject', 'PutObject', 'ListBucket'},
}
`

const PERM_TESTS = `
tests = {
    'list all buckets': lambda: s3.list_buckets(),
    'list the customer bucket': lambda: s3.list_objects_v2(Bucket='chaicart-cards'),
    'read a customer file': lambda: s3.get_object(Bucket='chaicart-cards', Key='applications/2026/11/batch-001.csv'),
}
for name, call in tests.items():
    print(f"{name}: {'denied' if is_denied(call) else 'ALLOWED, too much power'}")

writes_logs = not is_denied(lambda: s3.put_object(Bucket='chaicart-waf-logs', Key='waf/2026/11/24/health.txt', Body='ok'))
print('write its own logs:', 'allowed' if writes_logs else 'denied, the firewall cannot work')
`

const PERM_HEAD = `import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')     # this script runs with the firewall's role: waf-role
`

const CARDS = { 'applications/2026/11/batch-001.csv': 'applicant,city,income\nA. Kulkarni,Pune,840000\nR. Shaikh,Nashik,620000\n' }
const WAF_DENY = ['s3:ListAllMyBuckets', 's3:ListBucket@chaicart-cards', 's3:GetObject@chaicart-cards/*']

export const dataIncidents: Incident[] = [
  {
    id: 'capital-one-2019',
    title: { en: 'The Firewall That Held Too Many Keys', mr: 'खूप जास्त किल्ल्या असलेली firewall' },
    year: 'USA and Canada · July 2019',
    unlockAfter: 'lk1-6',
    headline: 'HACKER COPIES DATA OF 106 MILLION CARD CUSTOMERS AND APPLICANTS FROM BANK\'S CLOUD STORAGE',
    counterLabel: { en: 'people in the US (about 100 million) and Canada (about 6 million) whose personal information was accessed', mr: 'ज्यांची वैयक्तिक माहिती पाहिली गेली असे अमेरिकेतले (सुमारे 10 कोटी) आणि कॅनडातले (सुमारे 60 लाख) लोक' },
    counterTo: 106,
    counterPrefix: '',
    counterSuffix: 'M',
    beats: [
      {
        icon: '🏦',
        time: { en: 'The setup', mr: 'रचना' },
        text: {
          en: 'Capital One, one of the biggest credit card issuers in the US, ran many systems on AWS. In front of some applications sat a web application firewall (WAF) on a cloud server, there to block bad requests. Like every server, it had an IAM role that gave it temporary credentials. That role could read S3 buckets full of customer data, far more than a firewall ever needs.',
          mr: 'Capital One, अमेरिकेतल्या सगळ्यात मोठ्या credit card देणाऱ्या कंपन्यांपैकी एक, अनेक systems AWS वर चालवत होती. काही applications समोर एका cloud server वर web application firewall (WAF) होती, वाईट requests अडवायला. प्रत्येक server प्रमाणे तिलाही एक IAM role होता जो तिला तात्पुरते credentials देत असे. तो role ग्राहकांच्या data ने भरलेले S3 buckets वाचू शकत होता, firewall ला कधीही लागेल त्यापेक्षा खूपच जास्त.',
        },
      },
      {
        icon: '🕳️',
        time: { en: '22 and 23 March 2019', mr: '22 आणि 23 मार्च 2019' },
        text: {
          en: 'An outsider used a scanning tool to find cloud servers with misconfigured firewalls. Capital One\'s WAF could be tricked into making requests for the attacker (a server-side request forgery, SSRF), including to the instance metadata service, which hands out the role\'s credentials. With those credentials the attacker ran "List Buckets", something that role never did in normal work, and then "Sync" to copy data from more than 700 folders or buckets.',
          mr: 'एका बाहेरच्या व्यक्तीने चुकीच्या configuration च्या firewalls असलेले cloud servers शोधायला scanning tool वापरलं. Capital One ची WAF फसवून attacker साठी requests पाठवायला लावता येत होती (server-side request forgery, SSRF), त्यात instance metadata service कडे सुद्धा, जी role चे credentials देते. त्या credentials ने attacker ने "List Buckets" चालवलं, जे तो role रोजच्या कामात कधीच करत नव्हता, आणि मग 700 हून जास्त folders किंवा buckets मधला data copy करायला "Sync".',
        },
      },
      {
        icon: '📂',
        time: { en: 'What was copied', mr: 'काय copy झालं' },
        text: {
          en: 'Credit card applications from 2005 to early 2019: names, addresses, phone numbers, dates of birth, self-reported income, plus credit scores, limits and balances. About 140,000 US Social Security numbers, about 80,000 linked bank account numbers and about 1 million Canadian Social Insurance Numbers were among them. The data was encrypted, but the role\'s access also allowed decrypting it. Fields Capital One had tokenized, with separate keys, stayed protected.',
          mr: '2005 ते 2019 च्या सुरुवातीपर्यंतचे credit card अर्ज: नावं, पत्ते, फोन नंबर, जन्मतारखा, स्वतः सांगितलेलं उत्पन्न, शिवाय credit scores, limits आणि balances. त्यात सुमारे 1,40,000 अमेरिकन Social Security numbers, सुमारे 80,000 जोडलेले bank account numbers आणि सुमारे 10 लाख कॅनेडियन Social Insurance Numbers होते. data encrypted होता, पण role च्या access मुळे तो decrypt सुद्धा करता आला. Capital One ने वेगळ्या keys ने tokenize केलेली fields मात्र सुरक्षित राहिली.',
        },
      },
      {
        icon: '📨',
        time: { en: '17 to 29 July 2019', mr: '17 ते 29 जुलै 2019' },
        text: {
          en: 'Nobody inside noticed for almost four months. The attacker posted about the data on GitHub, and on 17 July someone who saw the post emailed Capital One\'s responsible disclosure address. Capital One confirmed the intrusion on 19 July and told the FBI. On 29 July it went public, and the FBI arrested a former Seattle tech worker the same day.',
          mr: 'जवळपास चार महिने आतल्या कोणाच्याच लक्षात आलं नाही. attacker ने data बद्दल GitHub वर post टाकली, आणि 17 जुलैला ती post पाहिलेल्या एकाने Capital One च्या responsible disclosure पत्त्यावर email केला. Capital One ने 19 जुलैला घुसखोरीची खात्री केली आणि FBI ला कळवलं. 29 जुलैला ते जाहीर झालं, आणि त्याच दिवशी FBI ने सिएटलमधल्या एका माजी tech कर्मचाऱ्याला अटक केली.',
        },
      },
      {
        icon: '⚖️',
        time: { en: 'Afterwards', mr: 'नंतर' },
        text: {
          en: 'In November 2019 AWS released IMDSv2, a metadata service that needs a session token, as extra defence against exactly this kind of SSRF. On 6 August 2020 the US bank regulator OCC fined Capital One $80 million for failing to assess the risks properly before moving major IT operations to the public cloud. In June 2022 a Seattle jury convicted the hacker of wire fraud and computer intrusion charges.',
          mr: 'नोव्हेंबर 2019 मध्ये AWS ने IMDSv2 आणली, session token मागणारी metadata service, नेमक्या अशा SSRF विरुद्ध जास्तीचं संरक्षण म्हणून. 6 ऑगस्ट 2020 ला अमेरिकेच्या बँक नियामक OCC ने, मोठी IT कामं public cloud वर हलवण्याआधी धोक्यांचं नीट मूल्यमापन न केल्याबद्दल Capital One ला $80 दशलक्ष दंड केला. जून 2022 मध्ये सिएटलच्या jury ने hacker ला wire fraud आणि computer intrusion च्या आरोपांत दोषी ठरवलं.',
        },
      },
    ],
    lesson: {
      en: 'The buckets were never public, so S3 Block Public Access and encryption could not help: the requests came with a real role\'s credentials. What protects you is least privilege (a firewall role writes its own logs and nothing else), IMDSv2 required on every server, separate keys or tokenization for the most sensitive fields, and monitoring that alarms when a role does something it never does, like ListBuckets. AWS secures the cloud; your configuration is yours to test.',
      mr: 'buckets कधीच public नव्हते, म्हणून S3 Block Public Access आणि encryption काही करू शकले नाहीत: requests खऱ्या role च्या credentials सह आल्या होत्या. तुमचं संरक्षण करतं ते least privilege (firewall चा role फक्त स्वतःचे logs लिहितो, बाकी काही नाही), प्रत्येक server वर IMDSv2 बंधनकारक, सगळ्यात संवेदनशील fields साठी वेगळ्या keys किंवा tokenization, आणि role कधीच न करणारं काहीतरी, उदा. ListBuckets, करतो तेव्हा alarm देणारं monitoring. AWS cloud सुरक्षित ठेवतं; तुमचं configuration तपासणं तुमचं काम.',
    },
    source: { label: 'US Department of Justice, Western District of Washington: United States v. Paige Thompson (2019 to 2022)', url: 'https://www.justice.gov/usao-wdwa/united-states-v-paige-thompson' },
    rewind: {
      intro: {
        en: 'Rewind time, to ChaiCart Cloud today. ChaiCart now has its own web firewall, running with a role called waf-role, and a bucket called chaicart-cards with loyalty-card applications. You will prove the role holds only the keys it needs, and build the alarm that would have spotted the March 2019 night in minutes instead of months.',
        mr: 'वेळ मागे घ्या, आजच्या ChaiCart Cloud कडे. ChaiCart कडे आता स्वतःची web firewall आहे, waf-role नावाच्या role ने चालणारी, आणि loyalty-card अर्ज असलेलं chaicart-cards नावाचं bucket. role कडे फक्त लागणाऱ्या किल्ल्या आहेत हे तुम्ही सिद्ध कराल, आणि मार्च 2019 ची रात्र महिन्यांऐवजी मिनिटांत पकडणारा alarm बनवाल.',
      },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'Write a permission test, the way a tester writes negative tests. is_denied(call) runs call(); it returns True when it raises a ClientError whose code is "AccessDenied", False when the call succeeds, and re-raises any other error. The script then tries what an attacker would try with the firewall\'s role, and checks that it can still write its own logs. This lab runs the script as waf-role. A hidden run uses the 2019-style role that can do everything, and your test must report it.', mr: 'tester negative tests लिहितो तशी permission test लिहा. is_denied(call) call() चालवतं; code "AccessDenied" असलेला ClientError आला तर True देतं, call यशस्वी झाला तर False, आणि इतर कोणताही error पुन्हा raise करतं. मग script firewall च्या role ने attacker जे करून पाहील ते करून पाहते, आणि तो अजूनही स्वतःचे logs लिहू शकतो हे तपासते. हा lab script waf-role म्हणून चालवतो. एक लपवलेला run सगळं करू शकणारा 2019 सारखा role वापरतो, आणि तुमच्या test ने ते सांगायलाच हवं.' },
          aws: { buckets: { 'chaicart-cards': CARDS, 'chaicart-waf-logs': {} }, deny: WAF_DENY },
          starter: `${PERM_HEAD}
def is_denied(call):
    # TODO: run call(); AccessDenied -> True, success -> False, any other error -> raise
    return False
${PERM_TESTS}`,
          solution: `${PERM_HEAD}
def is_denied(call):
    try:
        call()
    except ClientError as e:
        if e.response['Error']['Code'] == 'AccessDenied':
            return True
        raise
    return False
${PERM_TESTS}`,
          output: ['list all buckets: denied', 'list the customer bucket: denied', 'read a customer file: denied', 'write its own logs: allowed'],
          checks: [
            { expr: 'is_denied(lambda: None) is False', message: { en: 'A call that succeeds is not denied: is_denied should return False.', mr: 'यशस्वी झालेला call denied नाही: is_denied ने False द्यायला हवं.' } },
            { expr: "s3_exists('chaicart-waf-logs', 'waf/2026/11/24/health.txt')", message: { en: 'The log write should really happen (call() must run).', mr: 'log write खरंच व्हायला हवं (call() चालायला हवा).' } },
          ],
          variants: [
            {
              label: { en: 'The 2019-style role: allowed to do everything', mr: '2019 सारखा role: सगळं करायची परवानगी' },
              aws: { buckets: { 'chaicart-cards': CARDS, 'chaicart-waf-logs': {} } },
              output: ['list all buckets: ALLOWED, too much power', 'list the customer bucket: ALLOWED, too much power', 'read a customer file: ALLOWED, too much power', 'write its own logs: allowed'],
            },
            {
              label: { en: 'A role locked so tight the firewall cannot write logs', mr: 'इतका घट्ट role की firewall logs लिहू शकत नाही' },
              aws: { buckets: { 'chaicart-cards': CARDS, 'chaicart-waf-logs': {} }, deny: [...WAF_DENY, 's3:PutObject'] },
              output: ['list all buckets: denied', 'list the customer bucket: denied', 'read a customer file: denied', 'write its own logs: denied, the firewall cannot work'],
              checks: [],
            },
          ],
          hints: [
            { en: 'try: call() except ClientError as e: check e.response["Error"]["Code"] == "AccessDenied" and return True, else raise. After the try block, return False.', mr: 'try: call() except ClientError as e: e.response["Error"]["Code"] == "AccessDenied" तपासा आणि return True, नाहीतर raise. try block नंतर return False.' },
            { en: "def is_denied(call):\n    try:\n        call()\n    except ClientError as e:\n        if e.response['Error']['Code'] == 'AccessDenied':\n            return True\n        raise\n    return False", mr: "def is_denied(call):\n    try:\n        call()\n    except ClientError as e:\n        if e.response['Error']['Code'] == 'AccessDenied':\n            return True\n        raise\n    return False" },
          ],
          successLine: { en: 'Three doors locked, one door open. Run this test in every deployment and an over-powered role can never ship quietly.', mr: 'तीन दारं बंद, एक दार उघडं. ही test प्रत्येक deployment मध्ये चालवा, मग खूप ताकदीचा role कधीच गुपचूप ship होऊ शकत नाही.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Now the alarm. data/cloudtrail.jsonl has one API call per line (time, role, action, resource), like CloudTrail. NORMAL lists what each role does in normal work. Print one line per call that is unusual (an action not in NORMAL for that role, or a role not in NORMAL at all) as "ALERT <time> <role> <action> <resource>", then "alerts: <n>". In 2019 the WAF role ran List Buckets, something it never did: this script would have flagged it the same night.', mr: 'आता alarm. data/cloudtrail.jsonl मध्ये प्रत्येक ओळीत एक API call आहे (time, role, action, resource), CloudTrail सारखा. NORMAL मध्ये प्रत्येक role रोजच्या कामात काय करतो ते आहे. असामान्य प्रत्येक call साठी (त्या role साठी NORMAL मध्ये नसलेला action, किंवा NORMAL मध्ये अजिबात नसलेला role) "ALERT <time> <role> <action> <resource>" अशी एक ओळ print करा, मग "alerts: <n>". 2019 मध्ये WAF role ने List Buckets चालवलं, जे तो कधीच करत नव्हता: या script ने ते त्याच रात्री पकडलं असतं.' },
          files: { 'data/cloudtrail.jsonl': TRAIL },
          starter: `${TRAIL_HEAD}
alerts = 0
with open('data/cloudtrail.jsonl', encoding='utf-8') as f:
    for line in f:
        call = json.loads(line)
        # TODO: if call['action'] is not in NORMAL for call['role'] (or the role is unknown):
        #       print the ALERT line and count it
print(f'alerts: {alerts}')
`,
          solution: `${TRAIL_HEAD}
alerts = 0
with open('data/cloudtrail.jsonl', encoding='utf-8') as f:
    for line in f:
        call = json.loads(line)
        if call['action'] not in NORMAL.get(call['role'], set()):
            print(f"ALERT {call['time']} {call['role']} {call['action']} {call['resource']}")
            alerts += 1
print(f'alerts: {alerts}')
`,
          output: [
            'ALERT 2026-11-24T02:13:44Z waf-role ListBuckets *',
            'ALERT 2026-11-24T02:13:51Z waf-role ListBucket chaicart-cards',
            'ALERT 2026-11-24T02:14:02Z waf-role GetObject chaicart-cards/applications/2026/11/batch-001.csv',
            'alerts: 3',
          ],
          variants: [
            { label: { en: 'A quiet night', mr: 'शांत रात्र' }, files: { 'data/cloudtrail.jsonl': TRAIL_QUIET }, output: ['alerts: 0'] },
            {
              label: { en: 'A delete by the ETL role and a role nobody knows', mr: 'ETL role कडून delete आणि कोणालाच माहीत नसलेला role' },
              files: { 'data/cloudtrail.jsonl': TRAIL_NEW_ROLE },
              output: ['ALERT 2026-11-26T02:00:07Z etl-role DeleteObject chaicart-raw/raw/orders/2026/11/26/Aundh.csv', 'ALERT 2026-11-26T02:01:00Z intern-role GetObject chaicart-cards/applications/2026/11/batch-002.csv', 'alerts: 2'],
            },
          ],
          mustNotUse: [{ pattern: 'ListBuckets', message: { en: 'Do not search for "ListBuckets" by name: flag anything outside each role\'s normal actions, so tomorrow\'s new trick is caught too.', mr: '"ListBuckets" नावाने शोधू नका: प्रत्येक role च्या नेहमीच्या actions बाहेरचं सगळं पकडा, म्हणजे उद्याची नवी युक्तीसुद्धा पकडली जाईल.' } }],
          hints: [
            { en: 'NORMAL.get(call["role"], set()) gives the role\'s normal actions, or an empty set for an unknown role. If call["action"] is not in it, print the ALERT line and add 1.', mr: 'NORMAL.get(call["role"], set()) role च्या नेहमीच्या actions देतो, किंवा अनोळखी role साठी रिकामा set. call["action"] त्यात नसेल तर ALERT ओळ print करा आणि 1 वाढवा.' },
            { en: "        if call['action'] not in NORMAL.get(call['role'], set()):\n            print(f\"ALERT {call['time']} {call['role']} {call['action']} {call['resource']}\")\n            alerts += 1", mr: "        if call['action'] not in NORMAL.get(call['role'], set()):\n            print(f\"ALERT {call['time']} {call['role']} {call['action']} {call['resource']}\")\n            alerts += 1" },
          ],
          successLine: { en: 'Thirteen minutes after the first strange call, the alarm fires. In 2019 it took an outsider\'s email almost four months later.', mr: 'पहिल्या विचित्र call नंतर तेरा मिनिटांत alarm वाजतो. 2019 मध्ये जवळपास चार महिन्यांनंतर एका बाहेरच्या व्यक्तीच्या email ने कळलं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Your manager says: "Our buckets have Block Public Access on and default encryption, so a Capital One breach cannot happen to us." Which controls would actually have stopped or limited that attack?', mr: 'तुमचा manager म्हणतो: "आपल्या buckets वर Block Public Access चालू आहे आणि default encryption आहे, म्हणून Capital One सारखा breach आपल्याला होऊ शकत नाही." कोणत्या controls नी तो हल्ला खरंच थांबवला किंवा मर्यादित केला असता?' },
          options: [
            { en: 'Block Public Access and SSE-S3 encryption on every bucket', mr: 'प्रत्येक bucket वर Block Public Access आणि SSE-S3 encryption' },
            { en: 'A longer password for the AWS console', mr: 'AWS console साठी लांब password' },
            { en: 'Least privilege for the firewall role, IMDSv2 required on the server, and an alarm when a role calls an action it never uses', mr: 'firewall role साठी least privilege, server वर IMDSv2 बंधनकारक, आणि role कधीच न वापरलेला action बोलावतो तेव्हा alarm' },
            { en: 'Moving the data to S3 Glacier', mr: 'data S3 Glacier मध्ये हलवणं' },
          ],
          correct: [2],
          explain: { en: 'The buckets were not public and the data was encrypted; the attacker used a real role\'s temporary credentials, and S3 decrypts SSE data for anyone the policy allows. Least privilege would have given the stolen credentials nothing worth taking, IMDSv2\'s session token blocks simple SSRF requests to the metadata service, and an alarm on unusual calls shortens months to minutes. No console password was involved.', mr: 'buckets public नव्हते आणि data encrypted होता; attacker ने खऱ्या role चे तात्पुरते credentials वापरले, आणि policy ज्याला allow करते त्याच्यासाठी S3 SSE data decrypt करतं. least privilege मुळे चोरलेल्या credentials ना घेण्यासारखं काहीच मिळालं नसतं, IMDSv2 चा session token metadata service कडे जाणाऱ्या साध्या SSRF requests अडवतो, आणि असामान्य calls वरचा alarm महिन्यांचे मिनिटं करतो. console password चा यात संबंधच नव्हता.' },
          hints: [
            { en: 'Were the requests anonymous, or did they carry valid credentials?', mr: 'requests anonymous होत्या, की त्यांच्याकडे वैध credentials होते?' },
            { en: 'Think about what the role could do, how its credentials leaked, and how long it took to notice.', mr: 'role काय करू शकत होता, त्याचे credentials कसे गळले, आणि लक्षात यायला किती वेळ लागला याचा विचार करा.' },
          ],
          successLine: { en: 'Locks on the front door do not help when the thief holds a real key. Give out fewer keys, and watch how they are used.', mr: 'चोराकडे खरी किल्ली असेल तर पुढच्या दाराची कुलूपं उपयोगी पडत नाहीत. कमी किल्ल्या द्या, आणि त्या कशा वापरल्या जातात ते पाहा.' },
        },
      ],
    },
  },
]
