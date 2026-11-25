import type { Lesson } from './types.ts'

// S3 Data Lake (ChaiCart Cloud), second half: security and access, versioning / storage classes /
// lifecycle, and the boss: the Lake of Receipts.

// ───────────────────────── shared data: B1.4 Security and access

const R1042 = '{"receipt": "R-1042", "phone": "98xxxxxx21", "item": "masala chai", "qty": 2, "amount": 40}\n'
const R1043 = '{"receipt": "R-1043", "phone": "97xxxxxx08", "item": "vada pav", "qty": 3, "amount": 75}\n'

const LOCK_AWS = {
  buckets: {
    'chaicart-raw': { 'orders/dt=2026-11-24/orders.csv': 'id,amt\n1,50\n2,120\n' },
    'chaicart-receipts': { 'receipts/dt=2026-11-24/R-1042.json': R1042 },
    'theo-scratch': { 'notes.txt': 'try new menu api\n' },
  },
}
const LOCK_AWS_B = {
  buckets: {
    'chaicart-curated': { 'daily_sales/dt=2026-11-24/sales.csv': 'item,amount\nchai,900\n' },
    'chaicart-logs': { 'app/2026/11/24/app.log': 'GET /menu 200\n' },
    'chaicart-raw': { 'orders/dt=2026-11-24/orders.csv': 'id,amt\n1,50\n' },
    'kisan-sandbox': { 'prices.csv': 'crop,price\nonion,2400\n' },
    'theo-scratch': {},
  },
}

const LOCK_HEAD = String.raw`import json
import boto3

s3 = boto3.client('s3')
`

const LOCK_LOOP = String.raw`
locked = []
for b in s3.list_buckets()['Buckets']:
    name = b['Name']
    if not name.startswith('chaicart-'):
        continue
    s3.put_public_access_block(Bucket=name, PublicAccessBlockConfiguration={
        'BlockPublicAcls': True, 'IgnorePublicAcls': True,
        'BlockPublicPolicy': True, 'RestrictPublicBuckets': True})
`

const PROBE_HEAD = String.raw`import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
RAW, CLEAN = 'chaicart-raw', 'chaicart-clean'
SAMPLE = 'orders/dt=2026-11-24/orders.csv'
PROBE = '_probe/permission-check.txt'
`

const PROBE_TAIL = String.raw`
missing = []
if not check('s3:ListBucket', 'chaicart-raw', lambda: s3.list_objects_v2(Bucket=RAW, MaxKeys=1)):
    missing.append('s3:ListBucket')
if not check('s3:GetObject', 'chaicart-raw', lambda: s3.get_object(Bucket=RAW, Key=SAMPLE)):
    missing.append('s3:GetObject')
if not check('s3:PutObject', 'chaicart-clean', lambda: s3.put_object(Bucket=CLEAN, Key=PROBE, Body='ok')):
    missing.append('s3:PutObject')
if not check('s3:DeleteObject', 'chaicart-clean', lambda: s3.delete_object(Bucket=CLEAN, Key=PROBE)):
    missing.append('s3:DeleteObject')
print('missing permissions:', ', '.join(missing) or 'none')
`

const PROBE_AWS = (deny: string[]) => ({
  buckets: { 'chaicart-raw': { 'orders/dt=2026-11-24/orders.csv': 'id,amt\n1,50\n' }, 'chaicart-clean': {} },
  deny,
})

// ───────────────────────── shared data: B1.5 Versioning, storage classes, lifecycle

const R2201 = '{"receipt": "R-2201", "item": "cutting chai", "qty": 4, "amount": 60}\n'
const R2202 = '{"receipt": "R-2202", "item": "poha", "qty": 1, "amount": 35}\n'
const R2203 = '{"receipt": "R-2203", "item": "misal pav", "qty": 2, "amount": 160}\n'

// ───────────────────────── shared data: B1.6 Boss, The Lake of Receipts

const RC = (id: string, item: string, qty: number, amt: number) => `receipt_id,item,qty,amount\n${id},${item},${qty},${amt}\n`

const DUMP_NIGHT1: Record<string, string> = {
  'receipt_2026-11-22_R-1001.csv': RC('R-1001', 'masala chai', 2, 40),
  'receipt_2026-11-22_R-1002.csv': RC('R-1002', 'bun maska', 1, 30),
  'receipt_2026-11-23_R-1003.csv': RC('R-1003', 'vada pav', 3, 75),
  'Receipt 2026-11-23 R-1004.csv': RC('R-1004', 'poha', 2, 70),
  'receipt_2026-11-23_R-1005.csv': '',
  'gremlin_was_here.txt': 'hehe\n',
  'receipt_2026-11-31_R-1006.csv': RC('R-1006', 'kokum sharbat', 1, 45),
}
const DUMP_NIGHT2: Record<string, string> = {
  'receipt_2026-11-24_R-2001.csv': RC('R-2001', 'cutting chai', 4, 60),
  'receipt 2026-11-24 R-2002.csv': RC('R-2002', 'misal pav', 1, 80),
  'receipt_2026-11-24_R-2003.csv': '',
  'RECEIPT_2026-11-25_r-2004.csv': RC('R-2004', 'sabudana vada', 2, 90),
  'IMG_2201.jpg': 'not a receipt',
}
const TOTALS_21 = 'date,orders,amount\n2026-11-21,412,18650\n'
const TOTALS_20 = 'date,orders,amount\n2026-11-20,389,17210\n'
const T21 = 'curated/daily_totals/dt=2026-11-21/totals.csv'
const T20 = 'curated/daily_totals/dt=2026-11-20/totals.csv'

const lakeAws = (dump: Record<string, string>, curated: Record<string, string> = { [T21]: TOTALS_21 }) => ({
  buckets: { 'chaicart-dump': dump, 'chaicart-lake': curated },
  bucketConfig: { 'chaicart-lake': { versioning: 'Enabled' as const } },
})

const B_HEAD = String.raw`import re
from datetime import datetime
import boto3

s3 = boto3.client('s3')
DUMP, LAKE = 'chaicart-dump', 'chaicart-lake'
`

const B_PLAN = String.raw`
NAME = re.compile(r'receipt[ _](\d{4}-\d{2}-\d{2})[ _](R-\d+)\.csv', re.IGNORECASE)

def plan(key, size):
    m = NAME.fullmatch(key)
    if not m:
        return None, 'bad name'
    day, rid = m.group(1), m.group(2).upper()
    try:
        datetime.strptime(day, '%Y-%m-%d')
    except ValueError:
        return None, 'bad date'
    if size == 0:
        return None, 'empty file'
    return f'raw/receipts/dt={day}/{rid}.csv', None
`

const B_LIST = String.raw`
def list_objects(bucket, prefix=''):
    objs = []
    for page in s3.get_paginator('list_objects_v2').paginate(Bucket=bucket, Prefix=prefix):
        objs.extend(page.get('Contents', []))
    return objs
`

const B_MOVE = String.raw`
def move_all():
    files_in = list_objects(DUMP)
    moved = quarantined = 0
    for obj in files_in:
        key = obj['Key']
        target, reason = plan(key, obj['Size'])
        source = {'Bucket': DUMP, 'Key': key}
        if target:
            s3.copy_object(Bucket=LAKE, Key=target, CopySource=source)
            moved += 1
        else:
            s3.copy_object(Bucket=LAKE, Key='quarantine/' + key, CopySource=source,
                           Metadata={'reason': reason}, MetadataDirective='REPLACE')
            quarantined += 1
        s3.delete_object(Bucket=DUMP, Key=key)
    return len(files_in), moved, quarantined
`

const B_GREMLIN = String.raw`
# Last night (do not change): the Gremlin overwrote every curated file, twice
for obj in s3.list_objects_v2(Bucket=LAKE, Prefix='curated/').get('Contents', []):
    s3.put_object(Bucket=LAKE, Key=obj['Key'], Body='lol')
    s3.put_object(Bucket=LAKE, Key=obj['Key'], Body='date,orders,amount\n')
`

const B_RECOVER = String.raw`
def looks_valid(text):
    lines = text.strip().splitlines()
    return len(lines) >= 2 and lines[0] == 'date,orders,amount'

def recover(bucket, key):
    resp = s3.list_object_versions(Bucket=bucket, Prefix=key)
    versions = [v for v in resp.get('Versions', []) if v['Key'] == key]
    versions.sort(key=lambda v: v['LastModified'], reverse=True)
    for v in versions[1:]:
        body = s3.get_object(Bucket=bucket, Key=key, VersionId=v['VersionId'])['Body'].read().decode('utf-8')
        if looks_valid(body):
            s3.copy_object(Bucket=bucket, Key=key,
                           CopySource={'Bucket': bucket, 'Key': key, 'VersionId': v['VersionId']})
            return v['VersionId']
    return None
`

const B_LOCK = String.raw`
def lock_down(bucket):
    s3.put_public_access_block(Bucket=bucket, PublicAccessBlockConfiguration={
        'BlockPublicAcls': True, 'IgnorePublicAcls': True,
        'BlockPublicPolicy': True, 'RestrictPublicBuckets': True})
    s3.put_bucket_lifecycle_configuration(Bucket=bucket, LifecycleConfiguration={'Rules': [
        {'ID': 'raw-gets-colder', 'Filter': {'Prefix': 'raw/'}, 'Status': 'Enabled',
         'Transitions': [{'Days': 30, 'StorageClass': 'STANDARD_IA'},
                         {'Days': 90, 'StorageClass': 'GLACIER'}],
         'NoncurrentVersionExpiration': {'NoncurrentDays': 30},
         'AbortIncompleteMultipartUpload': {'DaysAfterInitiation': 7}},
        {'ID': 'quarantine-cleanup', 'Filter': {'Prefix': 'quarantine/'}, 'Status': 'Enabled',
         'Expiration': {'Days': 30}},
    ]})
    rules = s3.get_bucket_lifecycle_configuration(Bucket=bucket)['Rules']
    print(f'lake locked: public access blocked, {len(rules)} lifecycle rules')
`

const B_FINAL_RUN = String.raw`
lock_down(LAKE)
files_in, moved, quarantined = move_all()
print(f'files in: {files_in} | moved: {moved} | quarantined: {quarantined}')
assert files_in == moved + quarantined, 'a file went missing'
restored = 0
for obj in list_objects(LAKE, 'curated/'):
    if recover(LAKE, obj['Key']):
        restored += 1
print('restored:', restored)
`

const NIGHT1_RAW = ['raw/receipts/dt=2026-11-22/R-1001.csv', 'raw/receipts/dt=2026-11-22/R-1002.csv', 'raw/receipts/dt=2026-11-23/R-1003.csv', 'raw/receipts/dt=2026-11-23/R-1004.csv']
const NIGHT1_Q = ['quarantine/gremlin_was_here.txt', 'quarantine/receipt_2026-11-23_R-1005.csv', 'quarantine/receipt_2026-11-31_R-1006.csv']
const NIGHT2_RAW = ['raw/receipts/dt=2026-11-24/R-2001.csv', 'raw/receipts/dt=2026-11-24/R-2002.csv', 'raw/receipts/dt=2026-11-25/R-2004.csv']
const NIGHT2_Q = ['quarantine/IMG_2201.jpg', 'quarantine/receipt_2026-11-24_R-2003.csv']
const pyList = (xs: string[]) => '[' + xs.map((x) => `'${x}'`).join(', ') + ']'
const COPY_BEFORE_DELETE = "all(any(c.startswith('CopyObject chaicart-dump/' + d[len('DeleteObject chaicart-dump/'):] + ' -> ') for c in api_calls[:i]) for i, d in enumerate(api_calls) if d.startswith('DeleteObject chaicart-dump/'))"

export const s3MoreLessons: Lesson[] = [
  // ───────────────────────── B1.4 Security and access
  {
    id: 'lk1-4',
    code: 'B1.4',
    level: 'intermediate',
    title: { en: 'Security and access', mr: 'Security आणि access' },
    skill: 'IAM users, groups, roles and JSON policies, bucket policies, explicit deny, Block Public Access, encryption, presigned URLs, debugging AccessDenied',
    realLife: {
      place: 'bank',
      title: { en: 'The locker room at the co-operative bank', mr: 'सहकारी बँकेतली लॉकर रूम' },
      story: {
        en: 'Meera\'s aunt keeps her gold and property papers in locker 42 at a co-operative bank in Pune. At the counter, the clerk opens the register: her name is written against locker 42 and nothing else, so she can open that one locker and no other. On the locker room door hangs a board: "No entry after 5 p.m. No bags inside." That board applies to everyone, even the branch manager, and no permission in the register can beat it. The door to the street is never left open. Every locker needs two keys, hers and the bank\'s. One day her son must collect a document while she is in Nashik. He is not in the register, so she writes him a signed slip valid only for that afternoon. When the clerk says no to someone, he does not argue: he checks the register, the locker number, and the board on the door.',
        mr: 'मीराची मावशी आपलं सोनं आणि जमिनीचे कागद पुण्यातल्या एका सहकारी बँकेच्या लॉकर 42 मध्ये ठेवते. काउंटरवर clerk register उघडतो: तिचं नाव लॉकर 42 समोर लिहिलं आहे आणि दुसरं काहीही नाही, म्हणून ती तो एकच लॉकर उघडू शकते, दुसरा नाही. लॉकर रूमच्या दारावर एक फलक आहे: "संध्याकाळी 5 नंतर प्रवेश नाही. आत पिशव्या नेऊ नयेत." तो फलक सगळ्यांना लागू आहे, branch manager लाही, आणि register मधली कोणतीही परवानगी त्याला हरवू शकत नाही. रस्त्याकडचं दार कधीच उघडं ठेवलं जात नाही. प्रत्येक लॉकरला दोन चाव्या लागतात, तिची आणि बँकेची. एके दिवशी ती नाशिकला असताना तिच्या मुलाला एक कागद आणायचा असतो. त्याचं नाव register मध्ये नाही, म्हणून ती त्याला फक्त त्या दुपारपुरती चालणारी सही केलेली चिठ्ठी देते. clerk एखाद्याला नाही म्हणतो तेव्हा तो वाद घालत नाही: तो register, लॉकरचा नंबर आणि दारावरचा फलक तपासतो.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Who may open locker 42 right now?', mr: 'आत्ता लॉकर 42 कोण उघडू शकतं?' },
        items: [
          { icon: '👵', label: 'Aunt, named in the register', mr: 'मावशी, register मध्ये नाव आहे', pass: true },
          { icon: '🧑', label: 'Son with today\'s signed slip', mr: 'आजची सही केलेली चिठ्ठी असलेला मुलगा', pass: true },
          { icon: '🕵️', label: 'A stranger from the street', mr: 'रस्त्यावरचा अनोळखी माणूस', pass: false },
          { icon: '🕔', label: 'The manager at 6 p.m. (the door board wins)', mr: 'संध्याकाळी 6 ला manager (दारावरचा फलक जिंकतो)', pass: false },
          { icon: '📄', label: 'Son with yesterday\'s slip (expired)', mr: 'कालची चिठ्ठी असलेला मुलगा (मुदत संपली)', pass: false },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Customers want to download their receipts from the app. Every receipt has a phone number and an address. If one leaks, ChaiCart is on the news tomorrow.', mr: 'ग्राहकांना app मधून आपल्या पावत्या download करायच्या आहेत. प्रत्येक पावतीवर फोन नंबर आणि पत्ता आहे. एक जरी leak झाली तरी उद्या ChaiCart बातम्यांमध्ये असेल.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'The quick way was to make the chaicart-receipts bucket public. I tried. S3 refused my bucket policy with AccessDenied, even though I am an admin.', mr: 'झटपट मार्ग होता chaicart-receipts bucket public करणं. मी प्रयत्न केला. मी admin असूनही S3 ने माझी bucket policy AccessDenied देऊन नाकारली.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'public buckets are my favourite buffet. one "Principal": "*" and every receipt in pune is mine. go on theo, turn off block public access. ⌁', mr: 'public buckets म्हणजे माझा आवडता buffet. एक "Principal": "*" आणि पुण्यातली प्रत्येक पावती माझी. चल theo, block public access बंद कर. ⌁' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Nothing goes public. Every person and every Lambda gets exactly the permissions it needs, written as IAM policies. The bucket only speaks HTTPS, and a customer gets a link that dies in fifteen minutes.', mr: 'काहीही public होणार नाही. प्रत्येक माणसाला आणि प्रत्येक Lambda ला फक्त हव्या तेवढ्याच परवानग्या, IAM policies म्हणून लिहिलेल्या. bucket फक्त HTTPS बोलतो, आणि ग्राहकाला पंधरा मिनिटांत मरणारी link मिळते.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Security is testing in a different uniform, {name}: who can do what, and what happens when someone tries something they should not.', mr: 'Security म्हणजे वेगळ्या गणवेशातलं testing, {name}: कोण काय करू शकतं, आणि कोणी नको ते करायला गेलं तर काय होतं.' } },
      ],
      problem: { en: 'Receipts with personal data sit in S3. The app, the pipelines and people all need some access, the easy shortcut (a public bucket) is how most S3 leaks happen, and when a permission is missing the team only sees "AccessDenied".', mr: 'वैयक्तिक माहिती असलेल्या पावत्या S3 मध्ये आहेत. app, pipelines आणि माणसं सगळ्यांना थोडा access हवा, सोपा shortcut (public bucket) हाच बहुतेक S3 leaks चा मार्ग असतो, आणि परवानगी कमी पडली की team ला फक्त "AccessDenied" दिसतं.' },
      solution: { en: 'Least-privilege IAM policies for users and roles, a bucket policy that denies anything without HTTPS, Block Public Access kept on, default encryption (SSE-S3 or SSE-KMS), presigned URLs for one receipt at a time, and a calm step-by-step way to debug AccessDenied.', mr: 'users आणि roles साठी least-privilege IAM policies, HTTPS शिवाय आलेलं सगळं नाकारणारी bucket policy, Block Public Access कायम चालू, default encryption (SSE-S3 किंवा SSE-KMS), एका वेळी एका पावतीसाठी presigned URL, आणि AccessDenied शांतपणे पायरी पायरीने debug करायची पद्धत.' },
    },
    lesson: [
      { en: 'AWS says no to everything by default (an implicit deny). IAM gives permissions to identities: an IAM user is one person or app with long-term credentials, a group bundles users (like data-team) so they share policies, and a role is an identity with no password that a person or a service assumes to get temporary credentials. A Lambda runs with its execution role, an EC2 machine with an instance role, so no access keys live in your code. A policy is a JSON document: "Version": "2012-10-17", then a list of statements, each with Effect (Allow or Deny), Action (like s3:GetObject), Resource (an ARN) and an optional Condition. Note the two ARNs: s3:ListBucket acts on the bucket (arn:aws:s3:::chaicart-raw), s3:GetObject and s3:PutObject act on objects (arn:aws:s3:::chaicart-raw/*).', mr: 'AWS default ने सगळ्याला नाही म्हणतो (implicit deny). IAM identities ना परवानग्या देतो: IAM user म्हणजे long-term credentials असलेला एक माणूस किंवा app, group users ना एकत्र बांधतो (उदा. data-team) म्हणजे त्यांना त्याच policies मिळतात, आणि role म्हणजे password नसलेली identity जी माणूस किंवा service "assume" करून temporary credentials मिळवते. Lambda त्याच्या execution role ने चालतं, EC2 machine instance role ने, म्हणून code मध्ये कोणत्याही access keys नसतात. policy म्हणजे JSON document: "Version": "2012-10-17", मग statements ची list, प्रत्येकात Effect (Allow किंवा Deny), Action (उदा. s3:GetObject), Resource (एक ARN) आणि ऐच्छिक Condition. दोन ARNs लक्षात ठेवा: s3:ListBucket bucket वर चालतो (arn:aws:s3:::chaicart-raw), s3:GetObject आणि s3:PutObject objects वर (arn:aws:s3:::chaicart-raw/*).' },
      { en: 'Policies live in two places. An identity-based policy is attached to a user, group or role and says "what may I do". A resource-based policy, like a bucket policy, is attached to the bucket and says "who may touch me", so it has a Principal. Inside one account, an Allow in either one is enough; across accounts, both sides must allow. Then the golden rule: an explicit Deny anywhere beats every Allow, and no Allow at all means denied. Least privilege means only the actions a job needs, only on the buckets and prefixes it uses: the order-cleaning Lambda gets s3:GetObject on chaicart-raw/orders/* and s3:PutObject on chaicart-clean/*, never s3:* on "*".', mr: 'policies दोन ठिकाणी राहतात. identity-based policy user, group किंवा role ला जोडलेली असते आणि सांगते "मी काय करू शकते". resource-based policy, उदा. bucket policy, bucket ला जोडलेली असते आणि सांगते "मला कोण हात लावू शकतं", म्हणून तिच्यात Principal असतो. एकाच account मध्ये दोन्हीपैकी एकीत Allow पुरेसं; दुसऱ्या account कडून आलं तर दोन्ही बाजूंनी Allow हवं. मग सुवर्ण नियम: कुठेही असलेला explicit Deny प्रत्येक Allow ला हरवतो, आणि Allow च नसेल तर denied. Least privilege म्हणजे job ला लागतील तेवढ्याच actions, तो वापरतो त्याच buckets आणि prefixes वर: orders साफ करणाऱ्या Lambda ला chaicart-raw/orders/* वर s3:GetObject आणि chaicart-clean/* वर s3:PutObject, "*" वर s3:* कधीच नाही.' },
      { en: 'Public buckets are behind many famous data leaks: someone made a bucket public "for a quick test" and forgot. Since April 2023, every new bucket has Block Public Access switched on (all four settings) and ACLs disabled (Object Ownership "bucket owner enforced"), so access is decided by policies only. Keep it that way, and also turn it on at account level. To share one receipt, use a presigned URL: a link signed with your credentials that works for the time you choose, up to 7 days with IAM user keys (Signature Version 4). If a role signed it, it dies when the role\'s temporary session ends. Anyone holding the link can use it, so keep it short.', mr: 'अनेक प्रसिद्ध data leaks मागे public buckets होते: कोणीतरी "थोड्या testing साठी" bucket public केला आणि विसरला. April 2023 पासून प्रत्येक नव्या bucket वर Block Public Access चालू असतो (चारही settings) आणि ACLs बंद असतात (Object Ownership "bucket owner enforced"), म्हणजे access फक्त policies ठरवतात. तसंच ठेवा, आणि account level वरही चालू करा. एक पावती share करायची असेल तर presigned URL वापरा: तुमच्या credentials ने sign केलेली link, तुम्ही ठरवाल तेवढा वेळ चालणारी, IAM user keys ने जास्तीत जास्त 7 दिवस (Signature Version 4). role ने sign केली असेल तर role चं temporary session संपताच ती मरते. ज्याच्याकडे link आहे तो ती वापरू शकतो, म्हणून ती कमी वेळाची ठेवा.' },
      { en: 'Encryption at rest: since January 2023 every new object is encrypted with SSE-S3 (keys managed by S3, AES-256) by default. SSE-KMS uses a KMS key you control: the key policy decides who may decrypt and every use is logged in CloudTrail; S3 Bucket Keys can cut the KMS request cost by up to 99%. DSSE-KMS adds a second, independent layer for strict compliance rules. Client-side encryption means you encrypt before uploading. SSE-C (you send the key with every request) is now disabled by default on new buckets. Encryption in transit means HTTPS: enforce it with a bucket policy that denies any request where aws:SecureTransport is false. About this lab: IAM here is a simple deny list set by each step, so a refused action fails with a real-looking AccessDenied. put_bucket_policy checks your JSON and refuses a public Allow while Block Public Access is on, but the lab does not evaluate your conditions on later requests. Real AWS does.', mr: 'Encryption at rest: January 2023 पासून प्रत्येक नवा object default ने SSE-S3 ने encrypt होतो (keys S3 सांभाळतो, AES-256). SSE-KMS तुमच्या ताब्यातली KMS key वापरतो: key policy ठरवते कोण decrypt करू शकतं आणि प्रत्येक वापर CloudTrail मध्ये log होतो; S3 Bucket Keys ने KMS request चा खर्च 99% पर्यंत कमी होऊ शकतो. DSSE-KMS कडक compliance नियमांसाठी दुसरा, स्वतंत्र थर जोडतो. Client-side encryption म्हणजे upload करण्याआधी तुम्हीच encrypt करता. SSE-C (प्रत्येक request सोबत तुम्ही key पाठवता) आता नव्या buckets वर default ने बंद असतो. Encryption in transit म्हणजे HTTPS: aws:SecureTransport false असलेली प्रत्येक request नाकारणाऱ्या bucket policy ने ते सक्तीचं करा. या lab बद्दल: इथे IAM म्हणजे प्रत्येक पायरीने ठरवलेली साधी deny list, म्हणून नाकारलेली action खऱ्यासारख्या AccessDenied ने fail होते. put_bucket_policy तुमचा JSON तपासतो आणि Block Public Access चालू असताना public Allow नाकारतो, पण नंतरच्या requests वर lab तुमच्या conditions तपासत नाही. खरा AWS तपासतो.' },
    ],
    syntax: {
      template: String.raw`import json
import boto3

policy = {
    'Version': '2012-10-17',
    'Statement': [{
        'Sid': 'DenyInsecureTransport',
        'Effect': 'Deny',
        'Principal': '*',
        'Action': 's3:*',
        'Resource': ['arn:aws:s3:::chaicart-receipts',
                     'arn:aws:s3:::chaicart-receipts/*'],
        'Condition': {'Bool': {'aws:SecureTransport': 'false'}},
    }],
}
s3 = boto3.client('s3')
s3.put_bucket_policy(Bucket='chaicart-receipts', Policy=json.dumps(policy))

url = s3.generate_presigned_url('get_object',
        Params={'Bucket': 'chaicart-receipts', 'Key': key}, ExpiresIn=900)`,
      parts: [
        { code: "'Version': '2012-10-17'", means: { en: 'the policy language version; always this exact date string', mr: 'policy भाषेची version; नेहमी हीच तारीख string' } },
        { code: "'Effect': 'Allow' / 'Deny'", means: { en: 'allow or forbid; an explicit Deny beats every Allow', mr: 'परवानगी किंवा मनाई; explicit Deny प्रत्येक Allow ला हरवतो' } },
        { code: "'Principal': '*'", means: { en: 'who the statement is about (bucket policies only); "*" means anyone, which is fine in a Deny and dangerous in an Allow', mr: 'statement कोणाबद्दल आहे (फक्त bucket policies मध्ये); "*" म्हणजे कोणीही, Deny मध्ये चालतं, Allow मध्ये धोकादायक' } },
        { code: "'Action': 's3:GetObject'", means: { en: 'which API calls; s3:ListBucket, s3:PutObject, s3:DeleteObject, or s3:* for all', mr: 'कोणते API calls; s3:ListBucket, s3:PutObject, s3:DeleteObject, किंवा सगळ्यांसाठी s3:*' } },
        { code: "'Resource': 'arn:aws:s3:::bucket/*'", means: { en: 'on what: the bucket ARN for listing, bucket/* (or bucket/prefix/*) for objects', mr: 'कशावर: listing साठी bucket ARN, objects साठी bucket/* (किंवा bucket/prefix/*)' } },
        { code: "'Condition': {'Bool': {'aws:SecureTransport': 'false'}}", means: { en: 'when it applies; here: requests that did not use HTTPS', mr: 'कधी लागू होतं; इथे: HTTPS न वापरलेल्या requests' } },
        { code: 'generate_presigned_url(..., ExpiresIn=900)', means: { en: 'a signed link to one object for 900 seconds (15 minutes); max 7 days', mr: 'एका object ची 900 seconds (15 मिनिटं) चालणारी signed link; जास्तीत जास्त 7 दिवस' } },
      ],
      example: [
        { code: "{'Effect': 'Allow', 'Action': 's3:GetObject', 'Resource': 'arn:aws:s3:::chaicart-raw/orders/*'}", note: { en: 'the register line: this role may read order files, nothing else', mr: 'register मधली ओळ: हा role order files वाचू शकतो, बाकी काही नाही' } },
        { code: "{'Effect': 'Allow', 'Action': 's3:ListBucket', 'Resource': 'arn:aws:s3:::chaicart-raw'}", note: { en: 'listing works on the bucket itself, so no /* here', mr: 'listing bucket वरच चालतं, म्हणून इथे /* नाही' } },
        { code: "{'Effect': 'Deny', 'Principal': '*', ..., 'aws:SecureTransport': 'false'}", note: { en: 'the board on the door: it beats every Allow, even the admin\'s', mr: 'दारावरचा फलक: तो प्रत्येक Allow ला हरवतो, admin च्याही' } },
        { code: "s3.put_public_access_block(Bucket=b, PublicAccessBlockConfiguration={...all True})", note: { en: 'the street door stays shut, whatever a policy or ACL says', mr: 'policy किंवा ACL काहीही म्हणो, रस्त्याकडचं दार बंदच' } },
        { code: "s3.generate_presigned_url('get_object', Params=..., ExpiresIn=900)", note: { en: 'today\'s signed slip for the son: one receipt, fifteen minutes', mr: 'मुलासाठी आजची सही केलेली चिठ्ठी: एक पावती, पंधरा मिनिटं' } },
        { code: "except ClientError as e: e.response['Error']['Code'] == 'AccessDenied'", note: { en: 'the clerk said no; now read the message to learn which action and which policy', mr: 'clerk ने नाही म्हटलं; आता message वाचा, कोणती action आणि कोणती policy ते कळेल' } },
      ],
      pitfall: { en: 'AccessDenied has a checklist, not a guess. 1. Read the whole message: which principal (user or role), which action, which resource, and often which policy type said no. 2. Does the identity policy allow that exact action on that exact ARN (bucket vs bucket/*)? 3. Is there an explicit Deny (bucket policy conditions like aws:SecureTransport or a VPC endpoint, an SCP, a permissions boundary)? 4. Is the object SSE-KMS encrypted? Then the role also needs kms:Decrypt in the key policy. 5. A GetObject on a key that does not exist returns 403 instead of 404 when you lack s3:ListBucket, so check the key too. CloudTrail shows the denied call.', mr: 'AccessDenied साठी checklist असते, अंदाज नाही. 1. पूर्ण message वाचा: कोणता principal (user किंवा role), कोणती action, कोणता resource, आणि बहुतेक वेळा कोणत्या प्रकारच्या policy ने नाही म्हटलं. 2. identity policy त्या नेमक्या ARN वर (bucket की bucket/*) ती नेमकी action allow करते का? 3. कुठे explicit Deny आहे का (bucket policy मधल्या aws:SecureTransport किंवा VPC endpoint सारख्या conditions, SCP, permissions boundary)? 4. object SSE-KMS ने encrypt आहे का? मग role ला key policy मध्ये kms:Decrypt पण हवं. 5. s3:ListBucket नसेल तर अस्तित्वात नसलेल्या key वरचा GetObject 404 ऐवजी 403 देतो, म्हणून key पण तपासा. नाकारलेला call CloudTrail मध्ये दिसतो.' },
    },
    practice: {
      intro: { en: 'Lock down ChaiCart\'s buckets, see Block Public Access in action, share a receipt the safe way, and build a permission probe that tells you exactly which IAM permission is missing. The lab\'s IAM is a deny list that each step sets; hidden accounts change it.', mr: 'ChaiCart चे buckets बंदोबस्तात ठेवा, Block Public Access काम करताना पाहा, पावती सुरक्षित पद्धतीने share करा, आणि नेमकी कोणती IAM परवानगी कमी आहे ते सांगणारा permission probe बनवा. lab मधला IAM म्हणजे प्रत्येक पायरीने ठरवलेली deny list; लपवलेली accounts ती बदलतात.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'Lock down every bucket whose name starts with chaicart- (leave other teams\' buckets alone). The loop already turns on all four Block Public Access settings. Finish https_only_policy(bucket): a Deny for Principal "*" and Action "s3:*" on both the bucket ARN and bucket/*, with the Condition {"Bool": {"aws:SecureTransport": "false"}}. Then, in the loop, set default encryption to SSE-KMS (SSEAlgorithm "aws:kms", KMSMasterKeyID "alias/chaicart-data", BucketKeyEnabled True) and attach the policy with put_bucket_policy (Policy must be a JSON string: json.dumps). Open the AWS console panel after Run to see the badges. A hidden account has more buckets.', mr: 'ज्यांचं नाव chaicart- ने सुरू होतं ते सगळे buckets बंदोबस्तात ठेवा (इतर teams चे buckets सोडून द्या). loop आधीच Block Public Access च्या चारही settings चालू करतो. https_only_policy(bucket) पूर्ण करा: Principal "*" आणि Action "s3:*" साठी Deny, bucket ARN आणि bucket/* दोन्हींवर, Condition {"Bool": {"aws:SecureTransport": "false"}} सह. मग loop मध्ये default encryption SSE-KMS करा (SSEAlgorithm "aws:kms", KMSMasterKeyID "alias/chaicart-data", BucketKeyEnabled True) आणि put_bucket_policy ने policy जोडा (Policy हा JSON string हवा: json.dumps). Run नंतर AWS console panel उघडून badges पाहा. लपवलेल्या account मध्ये जास्त buckets आहेत.' },
          aws: LOCK_AWS,
          starter: String.raw`${LOCK_HEAD}
def https_only_policy(bucket):
    # TODO: one statement: Sid, Effect 'Deny', Principal '*', Action 's3:*',
    #       Resource [bucket ARN, bucket ARN + '/*'],
    #       Condition {'Bool': {'aws:SecureTransport': 'false'}}
    return {'Version': '2012-10-17', 'Statement': []}
${LOCK_LOOP}    # TODO: default encryption SSE-KMS with alias/chaicart-data and a bucket key
    s3.put_bucket_policy(Bucket=name, Policy=json.dumps(https_only_policy(name)))
    locked.append(name)
    print(name, 'locked')
print('buckets locked:', len(locked))
`,
          solution: String.raw`${LOCK_HEAD}
def https_only_policy(bucket):
    return {
        'Version': '2012-10-17',
        'Statement': [{
            'Sid': 'DenyInsecureTransport',
            'Effect': 'Deny',
            'Principal': '*',
            'Action': 's3:*',
            'Resource': [f'arn:aws:s3:::{bucket}', f'arn:aws:s3:::{bucket}/*'],
            'Condition': {'Bool': {'aws:SecureTransport': 'false'}},
        }],
    }
${LOCK_LOOP}    s3.put_bucket_encryption(Bucket=name, ServerSideEncryptionConfiguration={'Rules': [{
        'ApplyServerSideEncryptionByDefault': {'SSEAlgorithm': 'aws:kms', 'KMSMasterKeyID': 'alias/chaicart-data'},
        'BucketKeyEnabled': True}]})
    s3.put_bucket_policy(Bucket=name, Policy=json.dumps(https_only_policy(name)))
    locked.append(name)
    print(name, 'locked')
print('buckets locked:', len(locked))
`,
          output: ['chaicart-raw locked', 'chaicart-receipts locked', 'buckets locked: 2'],
          checks: [
            { expr: "https_only_policy('x')['Statement'][0]['Effect'] == 'Deny' and https_only_policy('x')['Statement'][0]['Principal'] == '*'", message: { en: 'The statement should be a Deny for Principal "*".', mr: 'statement Principal "*" साठी Deny हवं.' } },
            { expr: "https_only_policy('x')['Statement'][0]['Condition'] == {'Bool': {'aws:SecureTransport': 'false'}}", message: { en: 'The Condition should be exactly {"Bool": {"aws:SecureTransport": "false"}}: the string "false", not the Python False.', mr: 'Condition नेमकी {"Bool": {"aws:SecureTransport": "false"}} हवी: string "false", Python चं False नाही.' } },
            { expr: "set(json.loads(s3_bucket('chaicart-receipts')['policy'])['Statement'][0]['Resource']) == {'arn:aws:s3:::chaicart-receipts', 'arn:aws:s3:::chaicart-receipts/*'}", message: { en: 'The policy must cover both the bucket ARN and bucket/* (the objects).', mr: 'policy ने bucket ARN आणि bucket/* (objects) दोन्ही झाकायला हवेत.' } },
            { expr: "s3_bucket('chaicart-raw')['encryption'] == 'aws:kms' and s3_bucket('chaicart-raw').get('kms_key') == 'alias/chaicart-data'", message: { en: 'Default encryption should be SSE-KMS ("aws:kms") with KMSMasterKeyID "alias/chaicart-data".', mr: 'Default encryption SSE-KMS ("aws:kms") आणि KMSMasterKeyID "alias/chaicart-data" हवी.' } },
            { expr: "s3_bucket('theo-scratch')['policy'] is None and s3_bucket('theo-scratch')['encryption'] == 'AES256'", message: { en: 'theo-scratch is not a chaicart- bucket. Leave it untouched.', mr: 'theo-scratch हा chaicart- bucket नाही. त्याला हात लावू नका.' } },
          ],
          variants: [
            {
              label: { en: 'An account with three chaicart buckets and two others', mr: 'तीन chaicart buckets आणि दोन इतर असलेलं account' },
              aws: LOCK_AWS_B,
              output: ['chaicart-curated locked', 'chaicart-logs locked', 'chaicart-raw locked', 'buckets locked: 3'],
              checks: [
                { expr: "all('aws:SecureTransport' in s3_bucket(b)['policy'] and s3_bucket(b)['encryption'] == 'aws:kms' and all(s3_bucket(b)['public_block'].values()) for b in ['chaicart-curated', 'chaicart-logs', 'chaicart-raw'])", message: { en: 'Every chaicart- bucket needs Block Public Access, SSE-KMS and the HTTPS-only policy.', mr: 'प्रत्येक chaicart- bucket ला Block Public Access, SSE-KMS आणि HTTPS-only policy हवी.' } },
                { expr: "s3_bucket('kisan-sandbox')['policy'] is None and s3_bucket('theo-scratch')['policy'] is None", message: { en: 'Buckets of other teams must stay untouched.', mr: 'इतर teams चे buckets जसेच्या तसे राहायला हवेत.' } },
              ],
            },
          ],
          mustUse: [{ pattern: 'json\\.dumps', message: { en: 'put_bucket_policy wants the policy as a JSON string: json.dumps(policy).', mr: 'put_bucket_policy ला policy JSON string म्हणून हवी: json.dumps(policy).' } }],
          hints: [
            { en: 'Run the starter: S3 answers MalformedPolicy because the Statement list is empty. Build one statement dict with Sid, Effect, Principal, Action, Resource and Condition.', mr: 'starter run करा: Statement list रिकामी आहे म्हणून S3 MalformedPolicy देतो. Sid, Effect, Principal, Action, Resource आणि Condition असलेली एक statement dict बनवा.' },
            { en: "Resource needs two ARNs: f'arn:aws:s3:::{bucket}' and f'arn:aws:s3:::{bucket}/*'. Encryption: s3.put_bucket_encryption(Bucket=name, ServerSideEncryptionConfiguration={'Rules': [{'ApplyServerSideEncryptionByDefault': {...}, 'BucketKeyEnabled': True}]}).", mr: "Resource ला दोन ARNs लागतात: f'arn:aws:s3:::{bucket}' आणि f'arn:aws:s3:::{bucket}/*'. Encryption: s3.put_bucket_encryption(Bucket=name, ServerSideEncryptionConfiguration={'Rules': [{'ApplyServerSideEncryptionByDefault': {...}, 'BucketKeyEnabled': True}]})." },
            { en: "        'Statement': [{'Sid': 'DenyInsecureTransport', 'Effect': 'Deny', 'Principal': '*', 'Action': 's3:*',\n                       'Resource': [f'arn:aws:s3:::{bucket}', f'arn:aws:s3:::{bucket}/*'],\n                       'Condition': {'Bool': {'aws:SecureTransport': 'false'}}}]\n\n    s3.put_bucket_encryption(Bucket=name, ServerSideEncryptionConfiguration={'Rules': [{\n        'ApplyServerSideEncryptionByDefault': {'SSEAlgorithm': 'aws:kms', 'KMSMasterKeyID': 'alias/chaicart-data'},\n        'BucketKeyEnabled': True}]})", mr: "        'Statement': [{'Sid': 'DenyInsecureTransport', 'Effect': 'Deny', 'Principal': '*', 'Action': 's3:*',\n                       'Resource': [f'arn:aws:s3:::{bucket}', f'arn:aws:s3:::{bucket}/*'],\n                       'Condition': {'Bool': {'aws:SecureTransport': 'false'}}}]\n\n    s3.put_bucket_encryption(Bucket=name, ServerSideEncryptionConfiguration={'Rules': [{\n        'ApplyServerSideEncryptionByDefault': {'SSEAlgorithm': 'aws:kms', 'KMSMasterKeyID': 'alias/chaicart-data'},\n        'BucketKeyEnabled': True}]})" },
          ],
          successLine: { en: 'Doors shut, HTTPS only, every receipt under a key ChaiCart controls.', mr: 'दारं बंद, फक्त HTTPS, प्रत्येक पावती ChaiCart च्या ताब्यातल्या key खाली.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'This is what Theo ran yesterday: a bucket policy that lets anyone ("Principal": "*") read every receipt. Press Run and read the error and the Block Public Access settings. What is going on, and what should ChaiCart do so customers can download their receipts?', mr: 'काल Theo ने हे चालवलं: कोणालाही ("Principal": "*") प्रत्येक पावती वाचू देणारी bucket policy. Run दाबा आणि error आणि Block Public Access settings वाचा. काय चाललं आहे, आणि ग्राहकांना पावत्या download करता याव्यात म्हणून ChaiCart ने काय करावं?' },
          pythonSandbox: {
            code: String.raw`import json
import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
public_policy = {
    'Version': '2012-10-17',
    'Statement': [{'Effect': 'Allow', 'Principal': '*', 'Action': 's3:GetObject',
                   'Resource': 'arn:aws:s3:::chaicart-receipts/*'}],
}
try:
    s3.put_bucket_policy(Bucket='chaicart-receipts', Policy=json.dumps(public_policy))
    print('bucket is now public')
except ClientError as e:
    print(e.response['Error']['Code'])
    print(e.response['Error']['Message'])

print(s3.get_public_access_block(Bucket='chaicart-receipts')['PublicAccessBlockConfiguration'])
`,
            aws: { buckets: { 'chaicart-receipts': { 'receipts/dt=2026-11-24/R-1042.json': R1042 } } },
          },
          options: [
            { en: 'S3 has a bug; an admin should always be able to set any policy, so retry until it works', mr: 'S3 मध्ये bug आहे; admin ला कोणतीही policy लावता यायलाच हवी, म्हणून ती चालेपर्यंत परत प्रयत्न करा' },
            { en: 'Turn off Block Public Access for this bucket, because the app needs the files', mr: 'या bucket चा Block Public Access बंद करा, कारण app ला files हव्या आहेत' },
            { en: 'Block Public Access (BlockPublicPolicy) refused a policy that would make every receipt public. Keep it on, and let the app backend create a short presigned URL for the one receipt a logged-in customer asks for', mr: 'Block Public Access (BlockPublicPolicy) ने प्रत्येक पावती public करणारी policy नाकारली. तो चालूच ठेवा, आणि login केलेला ग्राहक जी एक पावती मागतो तिच्यासाठी app backend ने कमी वेळाची presigned URL बनवावी' },
            { en: 'Change "Principal": "*" to "Principal": "everyone" so S3 accepts it', mr: '"Principal": "*" ऐवजी "Principal": "everyone" लिहा म्हणजे S3 ते स्वीकारेल' },
          ],
          correct: [2],
          explain: { en: 'All four Block Public Access settings are True (the default for new buckets since April 2023). BlockPublicPolicy rejects any bucket policy that grants public access, even from an admin. A public bucket would let anyone who guesses a key read phone numbers and addresses. A presigned URL gives one person one object for a few minutes, and the bucket stays private.', mr: 'Block Public Access च्या चारही settings True आहेत (April 2023 पासून नव्या buckets साठी default). BlockPublicPolicy public access देणारी कोणतीही bucket policy नाकारतो, admin कडून आली तरी. public bucket मध्ये key चा अंदाज लावणारा कोणीही फोन नंबर आणि पत्ते वाचू शकला असता. presigned URL एका माणसाला एक object काही मिनिटांसाठी देते, आणि bucket private राहतो.' },
          hints: [
            { en: 'Look at the error message: which setting blocked the policy?', mr: 'error message पाहा: कोणत्या setting ने policy अडवली?' },
            { en: 'The safe answer never makes the bucket public. Which tool shares one object for a short time?', mr: 'सुरक्षित उत्तर bucket कधीच public करत नाही. एक object थोड्या वेळासाठी कोणतं साधन share करतं?' },
          ],
          successLine: { en: 'The street door stayed shut. That setting has stopped many leaks.', mr: 'रस्त्याकडचं दार बंदच राहिलं. या setting ने बरेच leaks थांबवले आहेत.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Build the receipt link for the app. share_receipt(receipt_id, day, minutes=15) should first check that the receipt exists with head_object (a missing key raises ClientError with code "404": return None), and only then return a presigned get_object URL that lives minutes * 60 seconds. The starter signs a 7-day link for anything, even a receipt that does not exist (boto3 signs locally and never checks). Hidden checks try other receipts, days and durations.', mr: 'app साठी पावतीची link बनवा. share_receipt(receipt_id, day, minutes=15) ने आधी head_object ने पावती आहे का ते तपासावं (key नसेल तर code "404" असलेला ClientError येतो: None परत द्या), आणि मगच minutes * 60 seconds चालणारी presigned get_object URL परत द्यावी. starter काहीही असलं तरी 7 दिवसांची link sign करतो, अस्तित्वात नसलेल्या पावतीचीसुद्धा (boto3 स्थानिक पातळीवर sign करतो आणि कधीच तपासत नाही). लपवलेल्या checks इतर पावत्या, दिवस आणि वेळ वापरून पाहतात.' },
          aws: { buckets: { 'chaicart-receipts': { 'receipts/dt=2026-11-24/R-1042.json': R1042, 'receipts/dt=2026-11-24/R-1043.json': R1043 } } },
          starter: String.raw`import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
BUCKET = 'chaicart-receipts'

def share_receipt(receipt_id, day, minutes=15):
    key = f'receipts/dt={day}/{receipt_id}.json'
    # TODO: head_object first; on ClientError with code '404' return None
    # TODO: the link must live minutes * 60 seconds, not 7 days
    return s3.generate_presigned_url('get_object', Params={'Bucket': BUCKET, 'Key': key}, ExpiresIn=604800)

url = share_receipt('R-1042', '2026-11-24')
print('link ready:', url is not None)
print('expires in seconds:', url.split('X-Amz-Expires=')[1].split('&')[0])
print('missing receipt:', share_receipt('R-9999', '2026-11-24'))
`,
          solution: String.raw`import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
BUCKET = 'chaicart-receipts'

def share_receipt(receipt_id, day, minutes=15):
    key = f'receipts/dt={day}/{receipt_id}.json'
    try:
        s3.head_object(Bucket=BUCKET, Key=key)
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            return None
        raise
    return s3.generate_presigned_url('get_object', Params={'Bucket': BUCKET, 'Key': key}, ExpiresIn=minutes * 60)

url = share_receipt('R-1042', '2026-11-24')
print('link ready:', url is not None)
print('expires in seconds:', url.split('X-Amz-Expires=')[1].split('&')[0])
print('missing receipt:', share_receipt('R-9999', '2026-11-24'))
`,
          output: ['link ready: True', 'expires in seconds: 900', 'missing receipt: None'],
          checks: [
            { expr: "'X-Amz-Expires=3600' in share_receipt('R-1043', '2026-11-24', minutes=60)", message: { en: 'share_receipt(..., minutes=60) should give a link with X-Amz-Expires=3600. Use ExpiresIn=minutes * 60.', mr: 'share_receipt(..., minutes=60) ने X-Amz-Expires=3600 असलेली link द्यायला हवी. ExpiresIn=minutes * 60 वापरा.' } },
            { expr: "share_receipt('R-1042', '2026-11-23') is None", message: { en: 'R-1042 does not exist on 2026-11-23, so share_receipt should return None.', mr: 'R-1042 2026-11-23 ला नाही, म्हणून share_receipt ने None परत द्यायला हवं.' } },
            { expr: "any(c.startswith('HeadObject chaicart-receipts/receipts/dt=2026-11-24/R-9999.json') for c in api_calls)", message: { en: 'Check the key with head_object before signing a link.', mr: 'link sign करण्याआधी head_object ने key तपासा.' } },
          ],
          mustUse: [{ pattern: 'head_object', message: { en: 'Use s3.head_object to check the receipt exists (it reads metadata only, no body).', mr: 'पावती आहे का ते तपासायला s3.head_object वापरा (तो फक्त metadata वाचतो, body नाही).' } }],
          hints: [
            { en: 'head_object on a missing key raises ClientError whose code is "404" (HEAD responses have no body, so there is no "NoSuchKey"). Catch it, return None for 404, and raise anything else.', mr: 'नसलेल्या key वर head_object ClientError देतो ज्याचा code "404" असतो (HEAD response ला body नसते, म्हणून "NoSuchKey" नसतं). तो पकडा, 404 साठी None परत द्या, आणि बाकी सगळं raise करा.' },
            { en: "    try:\n        s3.head_object(Bucket=BUCKET, Key=key)\n    except ClientError as e:\n        if e.response['Error']['Code'] == '404':\n            return None\n        raise\n    return s3.generate_presigned_url('get_object', Params={'Bucket': BUCKET, 'Key': key}, ExpiresIn=minutes * 60)", mr: "    try:\n        s3.head_object(Bucket=BUCKET, Key=key)\n    except ClientError as e:\n        if e.response['Error']['Code'] == '404':\n            return None\n        raise\n    return s3.generate_presigned_url('get_object', Params={'Bucket': BUCKET, 'Key': key}, ExpiresIn=minutes * 60)" },
          ],
          successLine: { en: 'One receipt, one customer, fifteen minutes. The bucket never went public.', mr: 'एक पावती, एक ग्राहक, पंधरा मिनिटं. bucket कधीच public झाला नाही.' },
        },
        {
          kind: 'python',
          prompt: { en: 'The order-cleaning job crashes with AccessDenied at 2 a.m. Build a permission probe, like a tester\'s smoke test for IAM. Finish check(action, bucket, call): run call(); print "<action> on <bucket>: allowed" and return True. If a ClientError has code AccessDenied, print "<action> on <bucket>: denied" and return False. Any other error code (like NoSuchKey) means S3 let you in, so print "<action> on <bucket>: allowed, but got <code>" and return True. Hidden accounts have different missing permissions.', mr: 'orders साफ करणारा job रात्री 2 वाजता AccessDenied ने crash होतो. permission probe बनवा, IAM साठी tester चा smoke test. check(action, bucket, call) पूर्ण करा: call() चालवा; "<action> on <bucket>: allowed" print करा आणि True परत द्या. ClientError चा code AccessDenied असेल तर "<action> on <bucket>: denied" print करा आणि False परत द्या. दुसरा कोणताही error code (उदा. NoSuchKey) म्हणजे S3 ने तुम्हाला आत येऊ दिलं, म्हणून "<action> on <bucket>: allowed, but got <code>" print करा आणि True परत द्या. लपवलेल्या accounts मध्ये वेगवेगळ्या परवानग्या कमी आहेत.' },
          aws: PROBE_AWS(['s3:PutObject@chaicart-clean/*']),
          starter: String.raw`${PROBE_HEAD}
def check(action, bucket, call):
    # TODO: try / except ClientError; denied only when the code is 'AccessDenied'
    call()
    print(f'{action} on {bucket}: allowed')
    return True
${PROBE_TAIL}`,
          solution: String.raw`${PROBE_HEAD}
def check(action, bucket, call):
    try:
        call()
    except ClientError as e:
        code = e.response['Error']['Code']
        if code == 'AccessDenied':
            print(f'{action} on {bucket}: denied')
            return False
        print(f'{action} on {bucket}: allowed, but got {code}')
        return True
    print(f'{action} on {bucket}: allowed')
    return True
${PROBE_TAIL}`,
          output: ['s3:ListBucket on chaicart-raw: allowed', 's3:GetObject on chaicart-raw: allowed', 's3:PutObject on chaicart-clean: denied', 's3:DeleteObject on chaicart-clean: allowed', 'missing permissions: s3:PutObject'],
          variants: [
            {
              label: { en: 'A role that cannot read raw orders or delete', mr: 'raw orders वाचू आणि delete करू न शकणारा role' },
              aws: PROBE_AWS(['s3:GetObject@chaicart-raw/*', 's3:DeleteObject']),
              output: ['s3:ListBucket on chaicart-raw: allowed', 's3:GetObject on chaicart-raw: denied', 's3:PutObject on chaicart-clean: allowed', 's3:DeleteObject on chaicart-clean: denied', 'missing permissions: s3:GetObject, s3:DeleteObject'],
            },
            {
              label: { en: 'A role with everything it needs', mr: 'हवं ते सगळं असलेला role' },
              aws: PROBE_AWS([]),
              output: ['s3:ListBucket on chaicart-raw: allowed', 's3:GetObject on chaicart-raw: allowed', 's3:PutObject on chaicart-clean: allowed', 's3:DeleteObject on chaicart-clean: allowed', 'missing permissions: none'],
            },
            {
              label: { en: 'A brand-new role with no S3 permissions at all', mr: 'कोणतीही S3 परवानगी नसलेला अगदी नवा role' },
              aws: PROBE_AWS(['s3:*']),
              output: ['s3:ListBucket on chaicart-raw: denied', 's3:GetObject on chaicart-raw: denied', 's3:PutObject on chaicart-clean: denied', 's3:DeleteObject on chaicart-clean: denied', 'missing permissions: s3:ListBucket, s3:GetObject, s3:PutObject, s3:DeleteObject'],
            },
            {
              label: { en: 'Permissions fine, but today\'s order file has not arrived', mr: 'परवानग्या ठीक, पण आजची order file आलेली नाही' },
              aws: { buckets: { 'chaicart-raw': {}, 'chaicart-clean': {} }, deny: [] },
              output: ['s3:ListBucket on chaicart-raw: allowed', 's3:GetObject on chaicart-raw: allowed, but got NoSuchKey', 's3:PutObject on chaicart-clean: allowed', 's3:DeleteObject on chaicart-clean: allowed', 'missing permissions: none'],
            },
          ],
          hints: [
            { en: 'Wrap call() in try / except ClientError as e. The code is e.response["Error"]["Code"]. Only "AccessDenied" means a missing permission.', mr: 'call() ला try / except ClientError as e मध्ये गुंडाळा. code म्हणजे e.response["Error"]["Code"]. फक्त "AccessDenied" म्हणजे परवानगी कमी.' },
            { en: 'NoSuchKey is good news for IAM: S3 checked your permissions, let you in, and then told you the truth about the key. Print it differently and return True.', mr: 'IAM साठी NoSuchKey ही चांगली बातमी: S3 ने परवानग्या तपासल्या, आत येऊ दिलं, आणि मग key बद्दल खरं सांगितलं. ते वेगळं print करा आणि True परत द्या.' },
            { en: "    try:\n        call()\n    except ClientError as e:\n        code = e.response['Error']['Code']\n        if code == 'AccessDenied':\n            print(f'{action} on {bucket}: denied')\n            return False\n        print(f'{action} on {bucket}: allowed, but got {code}')\n        return True\n    print(f'{action} on {bucket}: allowed')\n    return True", mr: "    try:\n        call()\n    except ClientError as e:\n        code = e.response['Error']['Code']\n        if code == 'AccessDenied':\n            print(f'{action} on {bucket}: denied')\n            return False\n        print(f'{action} on {bucket}: allowed, but got {code}')\n        return True\n    print(f'{action} on {bucket}: allowed')\n    return True" },
          ],
          successLine: { en: 'Now the 2 a.m. ticket says exactly which permission to add, instead of just "AccessDenied".', mr: 'आता रात्री 2 चं ticket फक्त "AccessDenied" न सांगता नेमकी कोणती परवानगी जोडायची ते सांगतं.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'A role\'s identity policy allows s3:GetObject on chaicart-receipts/*. The bucket policy denies s3:* when aws:SecureTransport is false. A script calls GetObject over plain HTTP. What happens?', mr: 'एका role ची identity policy chaicart-receipts/* वर s3:GetObject allow करते. bucket policy aws:SecureTransport false असताना s3:* deny करते. एक script साध्या HTTP वरून GetObject करतो. काय होतं?' },
        options: [
          { en: 'Allowed, because the identity policy is checked first', mr: 'Allowed, कारण identity policy आधी तपासली जाते' },
          { en: 'Allowed, because an Allow and a Deny cancel out', mr: 'Allowed, कारण Allow आणि Deny एकमेकांना रद्द करतात' },
          { en: 'Denied: an explicit Deny in any applicable policy beats every Allow', mr: 'Denied: लागू असलेल्या कोणत्याही policy मधला explicit Deny प्रत्येक Allow ला हरवतो' },
          { en: 'It depends on which policy was created last', mr: 'कोणती policy शेवटी बनवली त्यावर अवलंबून' },
        ],
        answer: 2,
        explain: { en: 'AWS first looks for any explicit Deny that matches. One is enough to refuse the request, whatever the Allows say. Only without a Deny does it look for an Allow.', mr: 'AWS आधी जुळणारा explicit Deny शोधतो. Allows काहीही म्हणोत, request नाकारायला एक Deny पुरेसा. Deny नसेल तरच तो Allow शोधतो.' },
      },
      {
        q: { en: 'A policy allows Action "s3:ListBucket" on Resource "arn:aws:s3:::chaicart-raw/*", yet list_objects_v2 on chaicart-raw gives AccessDenied. Why?', mr: 'एक policy Resource "arn:aws:s3:::chaicart-raw/*" वर Action "s3:ListBucket" allow करते, तरीही chaicart-raw वर list_objects_v2 AccessDenied देतो. का?' },
        options: [
          { en: 'ListBucket acts on the bucket, so the Resource must be arn:aws:s3:::chaicart-raw without /*', mr: 'ListBucket bucket वर चालतो, म्हणून Resource /* शिवाय arn:aws:s3:::chaicart-raw हवा' },
          { en: 'list_objects_v2 needs s3:GetObject, not s3:ListBucket', mr: 'list_objects_v2 ला s3:ListBucket नाही, s3:GetObject लागतो' },
          { en: 'Listing is never allowed for roles', mr: 'roles ना listing कधीच allowed नसतं' },
          { en: 'The bucket must be public to be listed', mr: 'list करायला bucket public असायला हवा' },
        ],
        answer: 0,
        explain: { en: 'Bucket-level actions (ListBucket, GetBucketPolicy...) use the bucket ARN; object-level actions (GetObject, PutObject, DeleteObject) use bucket/* or bucket/prefix/*. Mixing them up is one of the most common IAM bugs.', mr: 'Bucket-level actions (ListBucket, GetBucketPolicy...) bucket ARN वापरतात; object-level actions (GetObject, PutObject, DeleteObject) bucket/* किंवा bucket/prefix/* वापरतात. यांची गल्लत हा सगळ्यात सामान्य IAM bugs पैकी एक.' },
      },
      {
        q: { en: 'A customer should download only her own receipt from the ChaiCart app. What is the right design?', mr: 'ग्राहकाने ChaiCart app मधून फक्त स्वतःचीच पावती download करावी. योग्य design कोणतं?' },
        options: [
          { en: 'Make the bucket public and use long random receipt IDs nobody can guess', mr: 'bucket public करा आणि कोणाला अंदाज लावता येणार नाहीत असे लांब random receipt IDs वापरा' },
          { en: 'Give every customer an IAM user with access keys', mr: 'प्रत्येक ग्राहकाला access keys असलेला IAM user द्या' },
          { en: 'Email the whole receipts folder as a zip every night', mr: 'रोज रात्री पूर्ण receipts folder zip करून email करा' },
          { en: 'The backend checks that she is logged in and owns the receipt, then returns a presigned GET URL for that one key, valid for a few minutes', mr: 'backend ती login आहे आणि पावती तिचीच आहे ते तपासतो, मग त्या एका key साठी काही मिनिटं चालणारी presigned GET URL परत देतो' },
        ],
        answer: 3,
        explain: { en: 'The bucket stays private, the app decides who owns what, and the link expires quickly. IAM users are for your staff and systems, not for app customers.', mr: 'bucket private राहतो, कोणाचं काय ते app ठरवतं, आणि link लवकर expire होते. IAM users तुमच्या staff आणि systems साठी असतात, app च्या ग्राहकांसाठी नाहीत.' },
      },
      {
        q: { en: 'The bucket is new and nobody changed its settings. What does this print?', mr: 'bucket नवा आहे आणि कोणीही त्याच्या settings बदलल्या नाहीत. हे काय print करतं?' },
        code: `policy = {'Version': '2012-10-17', 'Statement': [{
    'Effect': 'Allow', 'Principal': '*', 'Action': 's3:GetObject',
    'Resource': 'arn:aws:s3:::chaicart-receipts/*'}]}
try:
    s3.put_bucket_policy(Bucket='chaicart-receipts', Policy=json.dumps(policy))
    print('public')
except ClientError as e:
    print(e.response['Error']['Code'])`,
        options: [
          { en: 'public', mr: 'public' },
          { en: 'AccessDenied, because Block Public Access (on by default) refuses a public policy', mr: 'AccessDenied, कारण Block Public Access (default ने चालू) public policy नाकारतो' },
          { en: 'MalformedPolicy, because Principal cannot be "*"', mr: 'MalformedPolicy, कारण Principal "*" असू शकत नाही' },
          { en: 'NoSuchBucket', mr: 'NoSuchBucket' },
        ],
        answer: 1,
        explain: { en: 'The JSON is valid and "*" is a legal Principal, but BlockPublicPolicy is on for new buckets, so S3 refuses with AccessDenied. In a Deny statement, Principal "*" is perfectly fine.', mr: 'JSON बरोबर आहे आणि "*" हा वैध Principal आहे, पण नव्या buckets वर BlockPublicPolicy चालू असतो, म्हणून S3 AccessDenied देऊन नाकारतो. Deny statement मध्ये Principal "*" अगदी चालतो.' },
      },
    ],
    recap: { line: { en: 'Deny by default, least-privilege Allows, explicit Deny wins. Block Public Access on, HTTPS only, SSE-KMS for sensitive data, presigned URLs to share, and a checklist for AccessDenied.', mr: 'Default ने Deny, least-privilege Allows, explicit Deny जिंकतो. Block Public Access चालू, फक्त HTTPS, संवेदनशील data साठी SSE-KMS, share करायला presigned URLs, आणि AccessDenied साठी checklist.' }, icon: '🔐' },
    interview: [
      {
        q: { en: 'What is the difference between an IAM user, a group, a role and a policy?', mr: 'IAM user, group, role आणि policy यांत फरक काय?' },
        a: { en: 'A user is one identity (a person or an app) with long-term credentials such as a password or access keys. A group is a set of users that share the same policies, like data-team. A role has no long-term credentials: a person, an AWS service or another account assumes it and gets temporary credentials from STS. A policy is the JSON document that actually grants or denies actions, and it is attached to users, groups, roles or resources. At ChaiCart our Lambda reads S3 through its execution role, so no access keys live in the code. The gotcha: prefer roles wherever possible, because leaked long-term keys are a classic breach.', mr: 'user म्हणजे password किंवा access keys सारखे long-term credentials असलेली एक identity (माणूस किंवा app). group म्हणजे सारख्या policies वापरणाऱ्या users चा संच, उदा. data-team. role कडे long-term credentials नसतात: माणूस, AWS service किंवा दुसरं account तो assume करतं आणि STS कडून temporary credentials मिळवतं. policy म्हणजे actions खरंच allow किंवा deny करणारा JSON document, आणि तो users, groups, roles किंवा resources ना जोडला जातो. ChaiCart मध्ये आमचं Lambda त्याच्या execution role ने S3 वाचतं, म्हणून code मध्ये access keys नाहीत. गोम: शक्य तिथे roles वापरा, कारण leak झालेल्या long-term keys हा breach चा जुना मार्ग आहे.' },
      },
      {
        q: { en: 'Identity-based policy vs bucket policy: when do you use which?', mr: 'Identity-based policy विरुद्ध bucket policy: कोणती कधी वापरता?' },
        a: { en: 'An identity-based policy is attached to a user, group or role and lists what that identity may do across services. A bucket policy is a resource-based policy attached to the bucket; it names a Principal and controls who may touch that bucket. Within one account, an Allow in either is enough. For cross-account access, both the caller\'s identity policy and the bucket policy must allow it. I use identity policies for our own roles and bucket policies for guardrails that must apply to everyone, like "deny without HTTPS", or to let a partner account read one prefix. Remember that an explicit Deny in either one always wins.', mr: 'identity-based policy user, group किंवा role ला जोडलेली असते आणि ती identity services मध्ये काय करू शकते ते सांगते. bucket policy ही bucket ला जोडलेली resource-based policy आहे; ती Principal सांगते आणि त्या bucket ला कोण हात लावू शकतं ते ठरवते. एकाच account मध्ये दोन्हीपैकी एकीत Allow पुरेसं. cross-account access साठी caller ची identity policy आणि bucket policy दोन्हींनी allow करायला हवं. मी आमच्या roles साठी identity policies वापरते, आणि सगळ्यांना लागू व्हायलाच हव्यात अशा guardrails साठी bucket policies वापरते, उदा. "HTTPS शिवाय deny", किंवा partner account ला एक prefix वाचू देणं. लक्षात ठेवा, दोन्हीपैकी कुठेही असलेला explicit Deny नेहमी जिंकतो.' },
      },
      {
        q: { en: 'How does AWS decide whether a request is allowed?', mr: 'request allowed आहे की नाही हे AWS कसं ठरवतं?' },
        a: { en: 'Everything starts as an implicit deny. AWS collects every policy that applies: identity policies, resource policies, permissions boundaries, session policies and Organizations SCPs and RCPs. If any of them has an explicit Deny that matches, the answer is Deny, full stop. Otherwise the request needs an Allow, and the guardrails (SCPs, boundaries) must not block it. If nothing allows it, it stays denied. So "explicit deny beats allow, and no allow means deny". For example, our HTTPS-only bucket policy blocks plain HTTP even for admins.', mr: 'सगळं implicit deny पासून सुरू होतं. AWS लागू होणाऱ्या सगळ्या policies गोळा करतो: identity policies, resource policies, permissions boundaries, session policies आणि Organizations च्या SCPs आणि RCPs. त्यापैकी कोणत्याही policy मध्ये जुळणारा explicit Deny असेल तर उत्तर Deny, विषय संपला. नाहीतर request ला Allow हवं, आणि guardrails (SCPs, boundaries) ने ते अडवू नये. काहीच allow करत नसेल तर ते denied राहतं. म्हणजे "explicit deny allow ला हरवतो, आणि allow नसेल तर deny". उदा. आमची HTTPS-only bucket policy admins साठीसुद्धा साधं HTTP अडवते.' },
      },
      {
        q: { en: 'Your Lambda gets AccessDenied when reading an S3 object. What do you check?', mr: 'तुमच्या Lambda ला S3 object वाचताना AccessDenied मिळतो. तुम्ही काय तपासता?' },
        a: { en: 'I go through it in order instead of guessing. First the full error message and CloudTrail: which role, which action, which resource, and often which policy type refused it. Then the execution role\'s policy: does it allow s3:GetObject on the right ARN, bucket/prefix/*, not just the bucket ARN? Next any explicit Deny: bucket policy conditions (HTTPS, VPC endpoint, source IP), SCPs, permissions boundaries. If the object uses SSE-KMS, the role also needs kms:Decrypt and the KMS key policy must allow it. Finally I check the key itself: without s3:ListBucket, a missing key shows up as 403 instead of 404, and the key in an S3 event is URL-encoded. The IAM policy simulator helps confirm the fix.', mr: 'मी अंदाज न लावता क्रमाने तपासते. आधी पूर्ण error message आणि CloudTrail: कोणता role, कोणती action, कोणता resource, आणि बहुतेक वेळा कोणत्या प्रकारच्या policy ने नाकारलं. मग execution role ची policy: ती योग्य ARN वर, म्हणजे bucket/prefix/* वर s3:GetObject allow करते का, फक्त bucket ARN वर नाही ना? मग कुठे explicit Deny आहे का: bucket policy च्या conditions (HTTPS, VPC endpoint, source IP), SCPs, permissions boundaries. object SSE-KMS वापरत असेल तर role ला kms:Decrypt पण हवं आणि KMS key policy ने ते allow करायला हवं. शेवटी key स्वतः तपासते: s3:ListBucket नसेल तर नसलेली key 404 ऐवजी 403 म्हणून दिसते, आणि S3 event मधली key URL-encoded असते. उपाय बरोबर आहे का ते IAM policy simulator ने पक्कं करता येतं.' },
      },
      {
        q: { en: 'Why are public buckets dangerous, and how do you prevent them?', mr: 'public buckets धोकादायक का आहेत, आणि ते तुम्ही कसे टाळता?' },
        a: { en: 'A public bucket can be read by anyone on the internet who finds or guesses its name, and many large data leaks started exactly like that. Since April 2023, new buckets have all four Block Public Access settings on and ACLs disabled through Object Ownership "bucket owner enforced", so only policies grant access. I keep Block Public Access on at both bucket and account level and never turn it off for convenience. To share data I use presigned URLs, CloudFront for websites, or a cross-account bucket policy for partners. IAM Access Analyzer can flag buckets shared outside the account. For ChaiCart receipts with phone numbers, "public" is simply never the answer.', mr: 'public bucket त्याचं नाव सापडणारा किंवा अंदाज लावणारा internet वरचा कोणीही वाचू शकतो, आणि बरेच मोठे data leaks नेमके असेच सुरू झाले. April 2023 पासून नव्या buckets वर Block Public Access च्या चारही settings चालू असतात आणि Object Ownership "bucket owner enforced" मुळे ACLs बंद असतात, म्हणजे फक्त policies access देतात. मी Block Public Access bucket आणि account दोन्ही level वर चालू ठेवते आणि सोयीसाठी कधीच बंद करत नाही. data share करायला presigned URLs, websites साठी CloudFront, किंवा partners साठी cross-account bucket policy वापरते. account बाहेर share झालेले buckets IAM Access Analyzer दाखवू शकतो. फोन नंबर असलेल्या ChaiCart पावत्यांसाठी "public" हे उत्तर कधीच नसतं.' },
      },
      {
        q: { en: 'What encryption options does S3 have, at rest and in transit?', mr: 'S3 मध्ये at rest आणि in transit encryption चे कोणते पर्याय आहेत?' },
        a: { en: 'At rest, every new object has been encrypted with SSE-S3 by default since January 2023, with keys managed by S3. SSE-KMS uses an AWS KMS key: you control the key policy, can audit every use in CloudTrail and can revoke access by changing the key policy; S3 Bucket Keys cut KMS request costs by up to 99%. DSSE-KMS applies two independent layers for strict compliance rules. With client-side encryption you encrypt before upload and AWS never sees the plain data. SSE-C, where you send your own key with each request, is now disabled by default on new buckets. In transit, use HTTPS and enforce it with a bucket policy denying requests where aws:SecureTransport is false. For receipts I would pick SSE-KMS with a bucket key plus the HTTPS-only policy.', mr: 'At rest: January 2023 पासून प्रत्येक नवा object default ने SSE-S3 ने encrypt होतो, keys S3 सांभाळतो. SSE-KMS AWS KMS key वापरतो: key policy तुमच्या हातात, प्रत्येक वापर CloudTrail मध्ये audit करता येतो, आणि key policy बदलून access काढून घेता येतो; S3 Bucket Keys KMS request खर्च 99% पर्यंत कमी करतात. DSSE-KMS कडक compliance साठी दोन स्वतंत्र थर लावतो. client-side encryption मध्ये upload आधीच तुम्ही encrypt करता आणि AWS ला साधा data कधीच दिसत नाही. SSE-C, ज्यात प्रत्येक request सोबत तुम्ही स्वतःची key पाठवता, ते आता नव्या buckets वर default ने बंद आहे. In transit: HTTPS वापरा आणि aws:SecureTransport false असलेल्या requests नाकारणाऱ्या bucket policy ने ते सक्तीचं करा. पावत्यांसाठी मी bucket key सह SSE-KMS आणि HTTPS-only policy निवडेन.' },
      },
      {
        q: { en: 'What is a presigned URL, and what are its limits?', mr: 'presigned URL म्हणजे काय, आणि त्याच्या मर्यादा काय?' },
        a: { en: 'A presigned URL is a normal S3 URL with a signature in the query string, created with the credentials of someone who has permission for that operation. Whoever holds it can do exactly that one operation (a GET or a PUT on one key) until it expires, without AWS credentials of their own. With IAM user keys and Signature Version 4 it can be valid for up to 7 days; if it was signed with temporary role credentials, it stops working when that session expires, even if you asked for longer. It also dies if the signing credentials are revoked. Because it works for anyone who has the link, I keep expiry short, like 15 minutes for a ChaiCart receipt. Presigned PUT URLs are also a clean way to let a shop upload a file without giving it AWS access.', mr: 'presigned URL म्हणजे query string मध्ये signature असलेली साधी S3 URL, त्या operation ची परवानगी असलेल्या कोणाच्यातरी credentials ने बनवलेली. ज्याच्याकडे ती आहे तो expire होईपर्यंत नेमकं तेच एक operation (एका key वर GET किंवा PUT) करू शकतो, स्वतःच्या AWS credentials शिवाय. IAM user keys आणि Signature Version 4 ने ती जास्तीत जास्त 7 दिवस चालू शकते; temporary role credentials ने sign केली असेल तर ते session संपताच ती बंद होते, जास्त वेळ मागितला तरी. sign करणारे credentials revoke झाले तरी ती मरते. link असलेल्या कोणासाठीही ती चालते, म्हणून मी expiry कमी ठेवते, उदा. ChaiCart पावतीसाठी 15 मिनिटं. presigned PUT URLs हा एखाद्या दुकानाला AWS access न देता file upload करू देण्याचाही स्वच्छ मार्ग आहे.' },
      },
      {
        q: { en: 'How do you apply least privilege for a data pipeline in practice?', mr: 'data pipeline साठी least privilege प्रत्यक्षात कसं लावता?' },
        a: { en: 'Each job gets its own role with only the actions it really calls, on only the ARNs it touches. For ChaiCart, the cleaning Lambda gets s3:GetObject on chaicart-raw/orders/*, s3:PutObject on chaicart-clean/orders/*, and s3:ListBucket on those buckets limited to a prefix with a condition, nothing more. I avoid "Action": "s3:*" and "Resource": "*" and split read and write between raw and curated zones. IAM Access Analyzer can generate a starting policy from the role\'s real activity in CloudTrail, and its findings show unused permissions to remove. I test the role like a tester: a small probe that tries each action and expects allowed or denied. The gotcha is starting wide "to fix it later"; later rarely comes.', mr: 'प्रत्येक job ला स्वतःचा role, ज्यात तो खरंच वापरतो तेवढ्याच actions, तो हात लावतो तेवढ्याच ARNs वर. ChaiCart मध्ये cleaning Lambda ला chaicart-raw/orders/* वर s3:GetObject, chaicart-clean/orders/* वर s3:PutObject, आणि त्या buckets वर prefix पुरता condition लावलेला s3:ListBucket, यापेक्षा जास्त काही नाही. मी "Action": "s3:*" आणि "Resource": "*" टाळते आणि raw आणि curated zones मध्ये read आणि write वेगळे ठेवते. IAM Access Analyzer CloudTrail मधल्या role च्या खऱ्या वापरावरून सुरुवातीची policy बनवू शकतो, आणि त्याच्या findings न वापरलेल्या परवानग्या दाखवतात ज्या काढता येतात. मी role tester सारखा तपासते: प्रत्येक action करून पाहणारा आणि allowed किंवा denied अपेक्षित धरणारा छोटा probe. गोम म्हणजे "नंतर दुरुस्त करू" म्हणून आधी जास्त परवानग्या देणं; ते नंतर क्वचितच येतं.' },
      },
    ],
  },
  // ───────────────────────── B1.5 Versioning, storage classes and lifecycle
  {
    id: 'lk1-5',
    code: 'B1.5',
    level: 'intermediate',
    title: { en: 'Versioning, storage classes and lifecycle', mr: 'Versioning, storage classes आणि lifecycle' },
    skill: 'Versioning and delete markers, recovering files, storage classes and their trade-offs, lifecycle rules, S3 cost, replication, event notifications',
    realLife: {
      place: 'library',
      title: { en: 'The library that never burns a book', mr: 'एकही पुस्तक न जाळणारं वाचनालय' },
      story: {
        en: 'Meera\'s old college library in Pune has a careful librarian, Kulkarni madam. When a new edition of a textbook arrives, she does not throw the old one away: she stamps it "older edition" and keeps it on a back shelf, so a student who needs the old page numbers can still find it. When someone asks to "remove" a book, she slides a "withdrawn" card into its place on the shelf; pull the card out and the book is back. Books nobody borrowed for a month go up to the top shelves, cheaper to keep but you pay the peon to bring the ladder. After three months they go down to the basement store, where you fill a request slip and wait hours. Old newspapers go to the city archive across town, which takes a day or two. A notice by the door lists these moving rules, so nobody has to remember them. Rare books get a second copy at the Nashik branch, in case the building floods.',
        mr: 'पुण्यातल्या मीराच्या जुन्या college वाचनालयात कुलकर्णी madam नावाच्या काळजीपूर्वक ग्रंथपाल आहेत. एखाद्या पाठ्यपुस्तकाची नवी आवृत्ती आली की त्या जुनी फेकून देत नाहीत: तिच्यावर "जुनी आवृत्ती" शिक्का मारून मागच्या कपाटात ठेवतात, म्हणजे जुने पान क्रमांक हवे असलेल्या विद्यार्थ्याला ती अजूनही सापडते. कोणी पुस्तक "काढून टाका" म्हटलं तर त्या कपाटात त्याच्या जागी "withdrawn" कार्ड सरकवतात; कार्ड काढलं की पुस्तक परत. महिनाभर कोणीच न नेलेली पुस्तकं वरच्या कप्प्यांत जातात, ठेवायला स्वस्त पण शिडी आणायला शिपायाला पैसे द्यावे लागतात. तीन महिन्यांनंतर ती तळघरातल्या भांडारात जातात, जिथे मागणीची चिठ्ठी भरून तासन्तास थांबावं लागतं. जुनी वर्तमानपत्रं शहराच्या पलीकडच्या archive मध्ये जातात, तिथून मिळायला एक-दोन दिवस लागतात. दाराजवळची एक सूचना हे हलवण्याचे नियम सांगते, म्हणजे ते कोणालाच लक्षात ठेवावे लागत नाहीत. दुर्मीळ पुस्तकांची दुसरी प्रत नाशिक शाखेत ठेवली जाते, इमारतीत पाणी शिरलं तर म्हणून.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📗', label: 'New edition on the front shelf, old one kept (versioning)', mr: 'नवी आवृत्ती पुढच्या कपाटात, जुनी जपलेली (versioning)' },
          { icon: '🏷️', label: '"Withdrawn" card instead of burning (delete marker)', mr: 'जाळण्याऐवजी "withdrawn" कार्ड (delete marker)' },
          { icon: '🪜', label: 'After 30 days: top shelf, ladder fee (Standard-IA)', mr: '30 दिवसांनंतर: वरचा कप्पा, शिडीचं शुल्क (Standard-IA)' },
          { icon: '🧊', label: 'After 90 days: basement, wait hours (Glacier)', mr: '90 दिवसांनंतर: तळघर, तासन्तास थांबा (Glacier)' },
          { icon: '📜', label: 'Moving rules on the notice board (lifecycle)', mr: 'सूचना फलकावर हलवण्याचे नियम (lifecycle)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'worried', text: { en: 'Bad news. Yesterday a deploy script wrote an empty file over a receipt, and another script deleted a whole day of receipts. Are they gone?', mr: 'वाईट बातमी. काल एका deploy script ने एका पावतीवर रिकामी file लिहिली, आणि दुसऱ्या script ने पूर्ण एका दिवसाच्या पावत्या delete केल्या. त्या गेल्या का?' } },
        { who: 'sam', mood: 'worried', text: { en: 'And the AWS bill went up again. We keep three years of raw app logs in S3 Standard that nobody has opened since Diwali.', mr: 'आणि AWS bill पुन्हा वाढलं. दिवाळीपासून कोणीही न उघडलेले तीन वर्षांचे raw app logs आपण S3 Standard मध्ये ठेवतो.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'delete, overwrite, delete again. without versioning, s3 forgets instantly. i love a bucket with no memory. ⌁', mr: 'delete, overwrite, पुन्हा delete. versioning नसेल तर s3 लगेच विसरतो. स्मरणशक्ती नसलेला bucket मला फार आवडतो. ⌁' } },
        { who: 'rex', mood: 'neutral', text: { en: 'With versioning on, nothing is really lost: an overwrite keeps the old version, a delete only adds a marker. And lifecycle rules move cold data to cheaper storage classes and clean up what we no longer need.', mr: 'versioning चालू असेल तर काहीच खरंच हरवत नाही: overwrite जुनी version जपतो, delete फक्त एक marker जोडतो. आणि lifecycle rules थंड data स्वस्त storage classes मध्ये हलवतात आणि गरज नसलेलं साफ करतात.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Think of it as undo for the whole data lake, {name}, plus a rulebook that saves money while everyone sleeps.', mr: 'हे पूर्ण data lake साठी undo समज, {name}, आणि सगळे झोपलेले असताना पैसे वाचवणारं नियमपुस्तक.' } },
      ],
      problem: { en: 'Scripts and people overwrite and delete files by mistake, and in an unversioned bucket that is permanent. Meanwhile old data sits in the most expensive storage class forever and the bill keeps growing.', mr: 'scripts आणि माणसं चुकून files overwrite आणि delete करतात, आणि versioning नसलेल्या bucket मध्ये ते कायमचं असतं. त्याच वेळी जुना data कायम सर्वात महाग storage class मध्ये पडून राहतो आणि bill वाढत राहतं.' },
      solution: { en: 'Turn on versioning and know how to restore an old version or remove a delete marker, choose storage classes by access pattern, write lifecycle rules for transitions, expiration, noncurrent versions and unfinished uploads, replicate what must survive a Region problem, and use event notifications to start processing when files land.', mr: 'versioning चालू करा आणि जुनी version परत आणायची किंवा delete marker काढायची पद्धत माहीत ठेवा, access pattern प्रमाणे storage classes निवडा, transitions, expiration, noncurrent versions आणि अर्धवट uploads साठी lifecycle rules लिहा, Region बिघडला तरी टिकायला हवं ते replicate करा, आणि files येताच processing सुरू करायला event notifications वापरा.' },
    },
    lesson: [
      { en: 'Versioning keeps every version of every key. A bucket is unversioned, versioning-enabled or versioning-suspended; once enabled it can never go back to unversioned, only to suspended. Objects that existed before you turned it on have the version ID "null". With versioning, an overwrite adds a new version on top, and a plain delete adds a delete marker: the key disappears from listings, but every version is still there. To undo an overwrite, copy the old version back on top (copy_object with a VersionId). To undo a delete, delete the delete marker itself by its VersionId. Deleting a specific VersionId is permanent. MFA delete adds a second factor for permanent deletes and for changing versioning; only the root user can enable it, through the CLI or API.', mr: 'Versioning प्रत्येक key ची प्रत्येक version जपतं. bucket unversioned, versioning-enabled किंवा versioning-suspended असतो; एकदा enable केलं की तो कधीच परत unversioned होत नाही, फक्त suspended होऊ शकतो. versioning चालू करण्याआधी असलेल्या objects ची version ID "null" असते. versioning असताना overwrite वर एक नवी version जोडतो, आणि साधा delete एक delete marker जोडतो: key listings मधून गायब होते, पण प्रत्येक version तिथेच असते. overwrite उलटवायचा असेल तर जुनी version वर copy करा (VersionId सह copy_object). delete उलटवायचा असेल तर delete marker लाच त्याच्या VersionId ने delete करा. ठराविक VersionId delete करणं कायमचं असतं. MFA delete कायमच्या deletes साठी आणि versioning बदलण्यासाठी दुसरा factor मागतो; तो फक्त root user CLI किंवा API ने चालू करू शकतो.' },
      { en: 'Storage classes trade storage price against access. All are designed for 11 nines (99.999999999%) durability. S3 Standard: default, millisecond access, 99.99% availability, at least 3 Availability Zones, no minimum duration. Intelligent-Tiering: moves each object between tiers by itself (infrequent after 30 days without access, archive instant after 90), a small monitoring fee per object, no retrieval fees; objects under 128 KB are not monitored. Standard-IA and One Zone-IA: cheaper storage, a per-GB retrieval fee, 30-day minimum, 128 KB minimum billable size; One Zone-IA lives in one AZ, so only for data you can re-create. Glacier Instant Retrieval: milliseconds, 90-day minimum. Glacier Flexible Retrieval: you must restore first (expedited typically 1 to 5 minutes, standard 3 to 5 hours, bulk 5 to 12 hours), 90 days. Glacier Deep Archive: cheapest, within 12 hours standard or 48 hours bulk, 180 days. Express One Zone: single-digit millisecond access in one AZ using directory buckets, for hot, latency-sensitive data.', mr: 'Storage classes साठवणीची किंमत आणि access यांच्यात तडजोड करतात. सगळ्या 11 nines (99.999999999%) durability साठी बनवलेल्या आहेत. S3 Standard: default, millisecond access, 99.99% availability, किमान 3 Availability Zones, किमान कालावधी नाही. Intelligent-Tiering: प्रत्येक object स्वतःहून tiers मध्ये हलवतो (30 दिवस access नसेल तर infrequent, 90 नंतर archive instant), प्रत्येक object मागे छोटी monitoring fee, retrieval fee नाही; 128 KB पेक्षा लहान objects monitor होत नाहीत. Standard-IA आणि One Zone-IA: स्वस्त साठवण, प्रति GB retrieval fee, 30 दिवसांचा किमान कालावधी, 128 KB किमान billable size; One Zone-IA एकाच AZ मध्ये असतो, म्हणून फक्त पुन्हा बनवता येणाऱ्या data साठी. Glacier Instant Retrieval: milliseconds, 90 दिवस किमान. Glacier Flexible Retrieval: आधी restore करावं लागतं (expedited साधारण 1 ते 5 मिनिटं, standard 3 ते 5 तास, bulk 5 ते 12 तास), 90 दिवस. Glacier Deep Archive: सर्वात स्वस्त, standard ने 12 तासांत किंवा bulk ने 48 तासांत, 180 दिवस. Express One Zone: directory buckets वापरून एका AZ मध्ये single-digit millisecond access, गरम, latency-sensitive data साठी.' },
      { en: 'A lifecycle configuration is the notice board: rules, each with a filter (usually a prefix like raw/), a status, and actions. Transitions move objects down to colder classes after N days (only downwards, and at least 30 days old before Standard-IA or One Zone-IA). Expiration deletes current versions after N days (in a versioned bucket it adds a delete marker). NoncurrentVersionExpiration deletes old versions N days after they were replaced, so versioning does not grow your bill forever. AbortIncompleteMultipartUpload removes the parts of uploads that never finished, which you pay for but cannot see. Lifecycle runs in the background, so changes are not instant, and since September 2024 objects smaller than 128 KB are not transitioned by default (each transition is a paid request, so for tiny files it costs more than it saves). In this lab, storage_class_after(bucket, key, days) replays your rules instantly and ignores size; real AWS does not.', mr: 'lifecycle configuration म्हणजे सूचना फलक: rules, प्रत्येकात filter (बहुतेक raw/ सारखा prefix), status, आणि actions. Transitions N दिवसांनंतर objects थंड classes मध्ये खाली हलवतात (फक्त खाली, आणि Standard-IA किंवा One Zone-IA आधी किमान 30 दिवस जुने). Expiration N दिवसांनंतर current versions delete करतं (versioned bucket मध्ये delete marker जोडतं). NoncurrentVersionExpiration जुन्या versions त्या बदलल्यानंतर N दिवसांनी delete करतं, म्हणजे versioning मुळे bill कायम वाढत नाही. AbortIncompleteMultipartUpload कधीच पूर्ण न झालेल्या uploads चे तुकडे काढतं, ज्यांचे पैसे लागतात पण जे दिसत नाहीत. lifecycle पार्श्वभूमीत चालतं, म्हणून बदल लगेच दिसत नाहीत, आणि September 2024 पासून 128 KB पेक्षा लहान objects default ने transition होत नाहीत (प्रत्येक transition ही पैसे लागणारी request आहे, म्हणून लहान files साठी ती वाचवते त्यापेक्षा जास्त खर्च होतो). या lab मध्ये storage_class_after(bucket, key, days) तुमचे rules क्षणात replay करतो आणि size दुर्लक्षित करतो; खरा AWS तसं करत नाही.' },
      { en: 'The S3 bill has four parts: storage (GB per month, by class), requests (PUT, COPY, POST and LIST cost more than GET, and lifecycle transitions count as requests), retrieval (per GB from IA and Glacier classes), and data transfer out (uploading into S3 is free; downloading to the internet is not). Millions of tiny files hurt on requests; cold data in Standard hurts on storage; a busy dashboard reading Glacier IR hurts on retrieval. Replication copies new objects to another bucket automatically: Cross-Region (CRR) for disaster recovery or users far away, Same-Region (SRR) for a copy in another account or for log aggregation. Both buckets need versioning, existing objects need S3 Batch Replication, and S3 Replication Time Control replicates 99.99% of objects within 15 minutes. Finally, event notifications: S3 can announce "object created" or "object removed" to Lambda, SQS, SNS or EventBridge, filtered by prefix and suffix. They are delivered at least once, usually within seconds. That is the bridge to the next act.', mr: 'S3 bill चे चार भाग: storage (class प्रमाणे दरमहा प्रति GB), requests (PUT, COPY, POST आणि LIST हे GET पेक्षा महाग, आणि lifecycle transitions पण requests म्हणून मोजले जातात), retrieval (IA आणि Glacier classes मधून प्रति GB), आणि data transfer out (S3 मध्ये upload फुकट; internet वर download नाही). लाखो लहान files requests वर महाग पडतात; Standard मधला थंड data storage वर; Glacier IR वाचणारा सतत चालणारा dashboard retrieval वर. Replication नवे objects आपोआप दुसऱ्या bucket मध्ये copy करतं: disaster recovery किंवा दूरच्या users साठी Cross-Region (CRR), दुसऱ्या account मधल्या copy साठी किंवा logs एकत्र करायला Same-Region (SRR). दोन्ही buckets ना versioning लागतं, आधीपासूनच्या objects साठी S3 Batch Replication लागतं, आणि S3 Replication Time Control 99.99% objects 15 मिनिटांत replicate करतं. शेवटी event notifications: S3 "object created" किंवा "object removed" ची बातमी Lambda, SQS, SNS किंवा EventBridge ला देऊ शकतो, prefix आणि suffix ने filter करून. त्या किमान एकदा (at least once) पोहोचतात, साधारण काही seconds मध्ये. हाच पुढच्या act कडे जाणारा पूल.' },
    ],
    syntax: {
      template: String.raw`s3.put_bucket_versioning(Bucket=b, VersioningConfiguration={'Status': 'Enabled'})

resp = s3.list_object_versions(Bucket=b, Prefix=key)
for v in resp.get('Versions', []):        # newest first per key
    print(v['VersionId'], v['IsLatest'])
for m in resp.get('DeleteMarkers', []):
    print('marker', m['VersionId'], m['IsLatest'])

s3.copy_object(Bucket=b, Key=key,
               CopySource={'Bucket': b, 'Key': key, 'VersionId': old_id})
s3.delete_object(Bucket=b, Key=key, VersionId=marker_id)

s3.put_bucket_lifecycle_configuration(Bucket=b, LifecycleConfiguration={'Rules': [{
    'ID': 'raw-gets-colder', 'Filter': {'Prefix': 'raw/'}, 'Status': 'Enabled',
    'Transitions': [{'Days': 30, 'StorageClass': 'STANDARD_IA'},
                    {'Days': 90, 'StorageClass': 'GLACIER'}],
    'Expiration': {'Days': 730},
    'NoncurrentVersionExpiration': {'NoncurrentDays': 30},
    'AbortIncompleteMultipartUpload': {'DaysAfterInitiation': 7},
}]})`,
      parts: [
        { code: "VersioningConfiguration={'Status': 'Enabled'}", means: { en: 'turn versioning on ("Suspended" pauses it; there is no way back to unversioned)', mr: 'versioning चालू करा ("Suspended" ते थांबवतं; unversioned कडे परत जायचा मार्ग नाही)' } },
        { code: "list_object_versions(...)['Versions'] / ['DeleteMarkers']", means: { en: 'every version and every delete marker under a prefix, with VersionId and IsLatest', mr: 'prefix खालची प्रत्येक version आणि प्रत्येक delete marker, VersionId आणि IsLatest सह' } },
        { code: "CopySource={..., 'VersionId': old_id}", means: { en: 'copy an old version back on top: it becomes the newest version, and history stays', mr: 'जुनी version वर copy करा: ती सर्वात नवी version होते, आणि इतिहास टिकतो' } },
        { code: 'delete_object(..., VersionId=marker_id)', means: { en: 'with a VersionId the delete is permanent; used on a delete marker it brings the file back', mr: 'VersionId सह delete कायमचा असतो; delete marker वर वापरला तर file परत येते' } },
        { code: "'Transitions': [{'Days': 30, 'StorageClass': 'STANDARD_IA'}]", means: { en: 'move objects to a colder class after N days (IA needs at least 30)', mr: 'N दिवसांनंतर objects थंड class मध्ये हलवा (IA ला किमान 30)' } },
        { code: "'Expiration' / 'NoncurrentVersionExpiration'", means: { en: 'delete current versions after N days / delete old versions N days after they were replaced', mr: 'N दिवसांनंतर current versions delete करा / जुन्या versions बदलल्यानंतर N दिवसांनी delete करा' } },
        { code: "'AbortIncompleteMultipartUpload'", means: { en: 'clean up the invisible parts of uploads that never finished', mr: 'कधीच पूर्ण न झालेल्या uploads चे न दिसणारे तुकडे साफ करा' } },
      ],
      example: [
        { code: "put_object(Key='R-2201.json', Body='{...}')  # version null", note: { en: 'a book that was on the shelf before the librarian started stamping editions', mr: 'ग्रंथपालांनी आवृत्त्यांवर शिक्का मारायला सुरुवात करण्याआधीच कपाटात असलेलं पुस्तक' } },
        { code: "put_object(Key='R-2201.json', Body='oops')  # new version on top", note: { en: 'the new edition goes on the front shelf; the old one moves to the back shelf', mr: 'नवी आवृत्ती पुढच्या कपाटात; जुनी मागच्या कपाटात जाते' } },
        { code: "delete_object(Key='R-2201.json')  # adds a delete marker", note: { en: 'the "withdrawn" card; the book is still in the building', mr: '"withdrawn" कार्ड; पुस्तक अजून इमारतीतच आहे' } },
        { code: "delete_object(Key='R-2201.json', VersionId=marker_id)", note: { en: 'pull the card out, the book is back on the shelf', mr: 'कार्ड काढा, पुस्तक परत कपाटात' } },
        { code: "{'Days': 90, 'StorageClass': 'GLACIER'}", note: { en: 'to the basement after three months: cheap, but you wait for a restore', mr: 'तीन महिन्यांनी तळघरात: स्वस्त, पण restore ची वाट पाहावी लागते' } },
        { code: "'Filter': {'Prefix': 'raw/'}", note: { en: 'the rule on the notice board applies to one section, not the whole library', mr: 'सूचना फलकावरचा नियम एका विभागाला लागू, पूर्ण वाचनालयाला नाही' } },
      ],
      pitfall: { en: 'Versioning without a NoncurrentVersionExpiration rule quietly multiplies your storage: every overwrite of a 1 GB file keeps another 1 GB. And "delete" in a versioned bucket only hides the file; to really free space you delete versions (or let lifecycle do it). Also, a lifecycle transition to Standard-IA under 30 days is refused, and moving tiny files to Glacier can cost more in requests and per-object overhead than it saves.', mr: 'NoncurrentVersionExpiration rule शिवायचं versioning गुपचूप storage वाढवत राहतं: 1 GB file च्या प्रत्येक overwrite सोबत आणखी 1 GB जपली जाते. आणि versioned bucket मधला "delete" फक्त file लपवतो; खरी जागा मोकळी करायला versions delete करावी लागतात (किंवा lifecycle ला करू द्या). तसंच 30 दिवसांच्या आतलं Standard-IA transition नाकारलं जातं, आणि लहान files Glacier मध्ये हलवणं requests आणि प्रति-object overhead मुळे वाचवते त्यापेक्षा महाग पडू शकतं.' },
    },
    practice: {
      intro: { en: 'Undo the Gremlin\'s overwrite and delete with versioning, write a lifecycle rulebook for the lake, meet a Glacier object, and wire the bucket to announce new files. Open the AWS console panel after each run: versions and delete markers show up there.', mr: 'versioning वापरून Gremlin चा overwrite आणि delete उलटवा, lake साठी lifecycle नियमपुस्तक लिहा, Glacier object ला भेटा, आणि नव्या files ची बातमी द्यायला bucket जोडा. प्रत्येक run नंतर AWS console panel उघडा: versions आणि delete markers तिथे दिसतात.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'Two TODOs. 1: turn versioning on for chaicart-receipts (it must happen before the Gremlin block, that is the whole point). 2: finish restore_previous(bucket, key): list the versions with list_object_versions(Bucket=bucket, Prefix=key), keep only those whose Key equals key, sort newest first by LastModified, and copy the second newest back on top with copy_object (CopySource with VersionId). Return that VersionId, or None if there is no older version. Run once without TODO 1 to see why versioning matters. A hidden account has two receipts.', mr: 'दोन TODOs. 1: chaicart-receipts साठी versioning चालू करा (ते Gremlin block च्या आधी व्हायला हवं, तोच तर मुद्दा आहे). 2: restore_previous(bucket, key) पूर्ण करा: list_object_versions(Bucket=bucket, Prefix=key) ने versions मिळवा, ज्यांची Key नेमकी key आहे त्याच ठेवा, LastModified ने सर्वात नवी आधी अशी sort करा, आणि दुसरी सर्वात नवी copy_object ने वर copy करा (VersionId सह CopySource). तो VersionId परत द्या, किंवा जुनी version नसेल तर None. TODO 1 शिवाय एकदा run करून पाहा, versioning का महत्त्वाचं ते कळेल. लपवलेल्या account मध्ये दोन पावत्या आहेत.' },
          aws: { buckets: { 'chaicart-receipts': { 'receipts/dt=2026-11-23/R-2201.json': R2201 } } },
          starter: String.raw`import boto3

s3 = boto3.client('s3')
BUCKET = 'chaicart-receipts'

# TODO 1: turn versioning on for BUCKET

# Last night (do not change): the Gremlin overwrites every receipt
for obj in s3.list_objects_v2(Bucket=BUCKET).get('Contents', []):
    s3.put_object(Bucket=BUCKET, Key=obj['Key'], Body='gremlin was here')

def restore_previous(bucket, key):
    # TODO 2: versions of exactly this key, newest first; copy the second newest back on top
    return None

for obj in s3.list_objects_v2(Bucket=BUCKET).get('Contents', []):
    print(obj['Key'], 'restored from version', restore_previous(BUCKET, obj['Key']))
`,
          solution: String.raw`import boto3

s3 = boto3.client('s3')
BUCKET = 'chaicart-receipts'

s3.put_bucket_versioning(Bucket=BUCKET, VersioningConfiguration={'Status': 'Enabled'})

# Last night (do not change): the Gremlin overwrites every receipt
for obj in s3.list_objects_v2(Bucket=BUCKET).get('Contents', []):
    s3.put_object(Bucket=BUCKET, Key=obj['Key'], Body='gremlin was here')

def restore_previous(bucket, key):
    resp = s3.list_object_versions(Bucket=bucket, Prefix=key)
    versions = [v for v in resp.get('Versions', []) if v['Key'] == key]
    versions.sort(key=lambda v: v['LastModified'], reverse=True)
    if len(versions) < 2:
        return None
    old = versions[1]['VersionId']
    s3.copy_object(Bucket=bucket, Key=key, CopySource={'Bucket': bucket, 'Key': key, 'VersionId': old})
    return old

for obj in s3.list_objects_v2(Bucket=BUCKET).get('Contents', []):
    print(obj['Key'], 'restored from version', restore_previous(BUCKET, obj['Key']))
`,
          output: ['receipts/dt=2026-11-23/R-2201.json restored from version null'],
          checks: [
            { expr: "'cutting chai' in s3_text('chaicart-receipts', 'receipts/dt=2026-11-23/R-2201.json')", message: { en: 'R-2201 should hold the original receipt again (cutting chai), not the Gremlin\'s text.', mr: 'R-2201 मध्ये पुन्हा मूळ पावती (cutting chai) हवी, Gremlin चा text नाही.' } },
            { expr: "s3_versions('chaicart-receipts', 'receipts/dt=2026-11-23/R-2201.json') == 3", message: { en: 'Expected 3 versions: the original (null), the Gremlin\'s, and your restored copy on top. Restore by copying, never by deleting history.', mr: '3 versions अपेक्षित: मूळ (null), Gremlin ची, आणि वर तुमची restored copy. इतिहास delete करून नाही, copy करून restore करा.' } },
            { expr: "s3_bucket('chaicart-receipts')['versioning'] == 'Enabled'", message: { en: 'Versioning should be Enabled on chaicart-receipts.', mr: 'chaicart-receipts वर versioning Enabled हवं.' } },
          ],
          variants: [
            {
              label: { en: 'Two receipts overwritten', mr: 'दोन पावत्या overwrite झालेल्या' },
              aws: { buckets: { 'chaicart-receipts': { 'receipts/dt=2026-11-24/R-2202.json': R2202, 'receipts/dt=2026-11-24/R-2203.json': R2203 } } },
              output: ['receipts/dt=2026-11-24/R-2202.json restored from version null', 'receipts/dt=2026-11-24/R-2203.json restored from version null'],
              checks: [
                { expr: "'poha' in s3_text('chaicart-receipts', 'receipts/dt=2026-11-24/R-2202.json') and 'misal pav' in s3_text('chaicart-receipts', 'receipts/dt=2026-11-24/R-2203.json')", message: { en: 'Both receipts should be restored to their own original content.', mr: 'दोन्ही पावत्या आपापल्या मूळ मजकुरात restore व्हायला हव्यात.' } },
              ],
            },
          ],
          hints: [
            { en: 'Versioning first: s3.put_bucket_versioning(Bucket=BUCKET, VersioningConfiguration={"Status": "Enabled"}). Without it, the Gremlin\'s put simply replaces the only copy.', mr: 'आधी versioning: s3.put_bucket_versioning(Bucket=BUCKET, VersioningConfiguration={"Status": "Enabled"}). त्याशिवाय Gremlin चा put एकमेव copy सरळ बदलून टाकतो.' },
            { en: 'Prefix=key can also match longer keys (R-22011.json), so filter v["Key"] == key. versions[0] is the Gremlin\'s; versions[1] is the one to bring back. Its VersionId is "null" because it existed before versioning was on.', mr: 'Prefix=key लांब keys शीही जुळू शकतो (R-22011.json), म्हणून v["Key"] == key ने filter करा. versions[0] Gremlin ची; versions[1] परत आणायची. तिचा VersionId "null" आहे कारण ती versioning चालू होण्याआधीपासून होती.' },
            { en: "    resp = s3.list_object_versions(Bucket=bucket, Prefix=key)\n    versions = [v for v in resp.get('Versions', []) if v['Key'] == key]\n    versions.sort(key=lambda v: v['LastModified'], reverse=True)\n    if len(versions) < 2:\n        return None\n    old = versions[1]['VersionId']\n    s3.copy_object(Bucket=bucket, Key=key, CopySource={'Bucket': bucket, 'Key': key, 'VersionId': old})\n    return old", mr: "    resp = s3.list_object_versions(Bucket=bucket, Prefix=key)\n    versions = [v for v in resp.get('Versions', []) if v['Key'] == key]\n    versions.sort(key=lambda v: v['LastModified'], reverse=True)\n    if len(versions) < 2:\n        return None\n    old = versions[1]['VersionId']\n    s3.copy_object(Bucket=bucket, Key=key, CopySource={'Bucket': bucket, 'Key': key, 'VersionId': old})\n    return old" },
          ],
          successLine: { en: 'Overwrite undone, and the history still shows exactly what the Gremlin did.', mr: 'overwrite उलटला, आणि Gremlin ने नेमकं काय केलं ते इतिहासात अजूनही दिसतं.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Versioning was already on when the Gremlin deleted the whole day receipts/dt=2026-11-23/. The files vanished from listings, but each one only got a delete marker. Finish undelete(bucket, prefix): list_object_versions with that prefix, and for every delete marker whose IsLatest is True, delete the marker itself (delete_object with Key and VersionId). Return how many you removed. Do not re-upload anything. A hidden account has a different day.', mr: 'Gremlin ने पूर्ण दिवस receipts/dt=2026-11-23/ delete केला तेव्हा versioning आधीच चालू होतं. files listings मधून गायब झाल्या, पण प्रत्येकीला फक्त delete marker मिळाला. undelete(bucket, prefix) पूर्ण करा: त्या prefix ने list_object_versions करा, आणि IsLatest True असलेल्या प्रत्येक delete marker ला स्वतःलाच delete करा (Key आणि VersionId सह delete_object). किती काढले ते परत द्या. काहीही पुन्हा upload करू नका. लपवलेल्या account मध्ये वेगळा दिवस आहे.' },
          aws: {
            buckets: { 'chaicart-receipts': { 'receipts/dt=2026-11-22/R-2101.json': R2201, 'receipts/dt=2026-11-23/R-2201.json': R2201, 'receipts/dt=2026-11-23/R-2202.json': R2202, 'receipts/dt=2026-11-23/R-2203.json': R2203 } },
            bucketConfig: { 'chaicart-receipts': { versioning: 'Enabled' } },
          },
          starter: String.raw`import boto3

s3 = boto3.client('s3')
BUCKET = 'chaicart-receipts'
PREFIX = 'receipts/dt=2026-11-23/'

def visible():
    return s3.list_objects_v2(Bucket=BUCKET).get('KeyCount', 0)

# Last night (do not change): the Gremlin deletes the whole day
for obj in s3.list_objects_v2(Bucket=BUCKET, Prefix=PREFIX).get('Contents', []):
    s3.delete_object(Bucket=BUCKET, Key=obj['Key'])
print('visible after the Gremlin:', visible())

def undelete(bucket, prefix):
    # TODO: remove every delete marker that is the latest version of its key
    return 0

print('undeleted:', undelete(BUCKET, PREFIX))
print('visible now:', visible())
`,
          solution: String.raw`import boto3

s3 = boto3.client('s3')
BUCKET = 'chaicart-receipts'
PREFIX = 'receipts/dt=2026-11-23/'

def visible():
    return s3.list_objects_v2(Bucket=BUCKET).get('KeyCount', 0)

# Last night (do not change): the Gremlin deletes the whole day
for obj in s3.list_objects_v2(Bucket=BUCKET, Prefix=PREFIX).get('Contents', []):
    s3.delete_object(Bucket=BUCKET, Key=obj['Key'])
print('visible after the Gremlin:', visible())

def undelete(bucket, prefix):
    resp = s3.list_object_versions(Bucket=bucket, Prefix=prefix)
    count = 0
    for m in resp.get('DeleteMarkers', []):
        if m['IsLatest']:
            s3.delete_object(Bucket=bucket, Key=m['Key'], VersionId=m['VersionId'])
            count += 1
    return count

print('undeleted:', undelete(BUCKET, PREFIX))
print('visible now:', visible())
`,
          output: ['visible after the Gremlin: 1', 'undeleted: 3', 'visible now: 4'],
          checks: [
            { expr: "all(s3_exists('chaicart-receipts', 'receipts/dt=2026-11-23/' + r) for r in ['R-2201.json', 'R-2202.json', 'R-2203.json'])", message: { en: 'All three receipts of 2026-11-23 should be visible again.', mr: '2026-11-23 च्या तिन्ही पावत्या पुन्हा दिसायला हव्यात.' } },
            { expr: "all(s3_versions('chaicart-receipts', k) == 1 for k in s3_keys('chaicart-receipts'))", message: { en: 'Each receipt should still have exactly one real version. Remove the delete marker; do not upload the file again.', mr: 'प्रत्येक पावतीची अजूनही एकच खरी version हवी. delete marker काढा; file पुन्हा upload करू नका.' } },
          ],
          variants: [
            {
              label: { en: 'A day with five receipts, one key with spaces', mr: 'पाच पावत्यांचा दिवस, एका key मध्ये spaces' },
              aws: {
                buckets: { 'chaicart-receipts': { 'receipts/dt=2026-11-23/R-2301.json': R2201, 'receipts/dt=2026-11-23/R-2302.json': R2202, 'receipts/dt=2026-11-23/R-2303 copy.json': R2203, 'receipts/dt=2026-11-23/R-2304.json': R2201, 'receipts/dt=2026-11-23/R-2305.json': R2202 } },
                bucketConfig: { 'chaicart-receipts': { versioning: 'Enabled' } },
              },
              output: ['visible after the Gremlin: 0', 'undeleted: 5', 'visible now: 5'],
              checks: [
                { expr: "s3_exists('chaicart-receipts', 'receipts/dt=2026-11-23/R-2303 copy.json') and len(s3_keys('chaicart-receipts')) == 5", message: { en: 'All five receipts, including the one with a space in its key, should be back.', mr: 'key मध्ये space असलेल्या पावतीसह पाचही पावत्या परत यायला हव्यात.' } },
              ],
            },
          ],
          hints: [
            { en: 'resp.get("DeleteMarkers", []) lists markers with Key, VersionId and IsLatest. A marker with IsLatest True is what hides the file.', mr: 'resp.get("DeleteMarkers", []) markers Key, VersionId आणि IsLatest सह देतो. IsLatest True असलेला marker च file लपवतो.' },
            { en: 'delete_object with a VersionId deletes exactly that version permanently. Aim it at the marker, and the version underneath becomes the latest again.', mr: 'VersionId सह delete_object नेमकी तीच version कायमची delete करतो. तो marker वर चालवा, म्हणजे खालची version पुन्हा latest होते.' },
            { en: "    resp = s3.list_object_versions(Bucket=bucket, Prefix=prefix)\n    count = 0\n    for m in resp.get('DeleteMarkers', []):\n        if m['IsLatest']:\n            s3.delete_object(Bucket=bucket, Key=m['Key'], VersionId=m['VersionId'])\n            count += 1\n    return count", mr: "    resp = s3.list_object_versions(Bucket=bucket, Prefix=prefix)\n    count = 0\n    for m in resp.get('DeleteMarkers', []):\n        if m['IsLatest']:\n            s3.delete_object(Bucket=bucket, Key=m['Key'], VersionId=m['VersionId'])\n            count += 1\n    return count" },
          ],
          successLine: { en: 'Three "withdrawn" cards pulled out. The books never left the building.', mr: 'तीन "withdrawn" कार्ड काढले. पुस्तकं इमारतीतून कधी गेलीच नव्हती.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Write the lake\'s lifecycle rulebook. Rule "raw-gets-colder" for prefix raw/: Standard-IA at 30 days, GLACIER (Flexible Retrieval) at 90 days, expire after 730 days, delete noncurrent versions 30 days after they become noncurrent, abort incomplete multipart uploads after 7 days. Rule "tmp-cleanup" for prefix tmp/: expire after 7 days. curated/ gets no rule. Run the starter first: S3 refuses its 7-day IA transition. Hidden checks replay your rules over time with storage_class_after.', mr: 'lake चं lifecycle नियमपुस्तक लिहा. raw/ prefix साठी rule "raw-gets-colder": 30 दिवसांनी Standard-IA, 90 दिवसांनी GLACIER (Flexible Retrieval), 730 दिवसांनी expire, noncurrent versions noncurrent झाल्यानंतर 30 दिवसांनी delete, अर्धवट multipart uploads 7 दिवसांनी abort. tmp/ prefix साठी rule "tmp-cleanup": 7 दिवसांनी expire. curated/ ला कोणताही rule नाही. आधी starter run करा: त्याचं 7 दिवसांचं IA transition S3 नाकारतो. लपवलेल्या checks storage_class_after ने तुमचे rules काळाप्रमाणे replay करतात.' },
          aws: {
            buckets: { 'chaicart-lake': { 'raw/orders/dt=2026-11-24/orders.csv': 'id,amt\n1,50\n', 'curated/daily_sales/dt=2026-11-24/sales.csv': 'item,amount\nchai,900\n', 'tmp/run-123/part-0.csv': 'x\n' } },
            bucketConfig: { 'chaicart-lake': { versioning: 'Enabled' } },
          },
          starter: String.raw`import boto3

s3 = boto3.client('s3')
LAKE = 'chaicart-lake'

rules = [
    {
        'ID': 'raw-gets-colder',
        'Filter': {'Prefix': 'raw/'},
        'Status': 'Enabled',
        'Transitions': [{'Days': 7, 'StorageClass': 'STANDARD_IA'}],
        # TODO: GLACIER at 90 days, expire at 730, noncurrent versions after 30 days,
        #       abort incomplete multipart uploads after 7 days
    },
    # TODO: rule 'tmp-cleanup' for tmp/: expire after 7 days
]
s3.put_bucket_lifecycle_configuration(Bucket=LAKE, LifecycleConfiguration={'Rules': rules})

for r in s3.get_bucket_lifecycle_configuration(Bucket=LAKE)['Rules']:
    print(r['ID'], '->', r['Filter']['Prefix'])
`,
          solution: String.raw`import boto3

s3 = boto3.client('s3')
LAKE = 'chaicart-lake'

rules = [
    {
        'ID': 'raw-gets-colder',
        'Filter': {'Prefix': 'raw/'},
        'Status': 'Enabled',
        'Transitions': [{'Days': 30, 'StorageClass': 'STANDARD_IA'},
                        {'Days': 90, 'StorageClass': 'GLACIER'}],
        'Expiration': {'Days': 730},
        'NoncurrentVersionExpiration': {'NoncurrentDays': 30},
        'AbortIncompleteMultipartUpload': {'DaysAfterInitiation': 7},
    },
    {
        'ID': 'tmp-cleanup',
        'Filter': {'Prefix': 'tmp/'},
        'Status': 'Enabled',
        'Expiration': {'Days': 7},
    },
]
s3.put_bucket_lifecycle_configuration(Bucket=LAKE, LifecycleConfiguration={'Rules': rules})

for r in s3.get_bucket_lifecycle_configuration(Bucket=LAKE)['Rules']:
    print(r['ID'], '->', r['Filter']['Prefix'])
`,
          output: ['raw-gets-colder -> raw/', 'tmp-cleanup -> tmp/'],
          checks: [
            { expr: "[storage_class_after('chaicart-lake', 'raw/orders/dt=2026-11-24/orders.csv', d) for d in (10, 45, 120, 800)] == ['STANDARD', 'STANDARD_IA', 'GLACIER', 'EXPIRED']", message: { en: 'A raw file should be STANDARD at day 10, STANDARD_IA at day 45, GLACIER at day 120 and expired at day 800.', mr: 'raw file दिवस 10 ला STANDARD, दिवस 45 ला STANDARD_IA, दिवस 120 ला GLACIER आणि दिवस 800 ला expired हवी.' } },
            { expr: "storage_class_after('chaicart-lake', 'tmp/run-123/part-0.csv', 8) == 'EXPIRED' and storage_class_after('chaicart-lake', 'tmp/run-123/part-0.csv', 6) == 'STANDARD'", message: { en: 'tmp/ files should expire after 7 days (still there on day 6, gone on day 8).', mr: 'tmp/ files 7 दिवसांनी expire व्हायला हव्यात (दिवस 6 ला आहेत, दिवस 8 ला गेल्या).' } },
            { expr: "storage_class_after('chaicart-lake', 'curated/daily_sales/dt=2026-11-24/sales.csv', 800) == 'STANDARD'", message: { en: 'curated/ must not be touched by any rule: dashboards read it every day.', mr: 'curated/ ला कोणताही rule लागू नको: dashboards तो रोज वाचतात.' } },
            { expr: "[r for r in s3_bucket('chaicart-lake')['lifecycle'] if r['ID'] == 'raw-gets-colder'][0].get('NoncurrentVersionExpiration', {}).get('NoncurrentDays') == 30 and [r for r in s3_bucket('chaicart-lake')['lifecycle'] if r['ID'] == 'raw-gets-colder'][0].get('AbortIncompleteMultipartUpload', {}).get('DaysAfterInitiation') == 7", message: { en: 'raw-gets-colder also needs NoncurrentVersionExpiration (NoncurrentDays 30) and AbortIncompleteMultipartUpload (DaysAfterInitiation 7).', mr: 'raw-gets-colder मध्ये NoncurrentVersionExpiration (NoncurrentDays 30) आणि AbortIncompleteMultipartUpload (DaysAfterInitiation 7) पण हवेत.' } },
          ],
          variants: [
            {
              label: { en: 'Another lake: receipts and a different tmp folder', mr: 'दुसरं lake: पावत्या आणि वेगळा tmp folder' },
              aws: {
                buckets: { 'chaicart-lake': { 'raw/receipts/dt=2026-10-01/R-0901.csv': 'r\n', 'tmp/backfill/x.csv': 'x\n', 'curated/top_items/dt=2026-10-01/top.csv': 't\n' } },
                bucketConfig: { 'chaicart-lake': { versioning: 'Enabled' } },
              },
              checks: [
                { expr: "storage_class_after('chaicart-lake', 'raw/receipts/dt=2026-10-01/R-0901.csv', 31) == 'STANDARD_IA' and storage_class_after('chaicart-lake', 'raw/receipts/dt=2026-10-01/R-0901.csv', 91) == 'GLACIER'", message: { en: 'raw/ files should be STANDARD_IA after 30 days and GLACIER after 90.', mr: 'raw/ files 30 दिवसांनी STANDARD_IA आणि 90 नंतर GLACIER व्हायला हव्यात.' } },
                { expr: "storage_class_after('chaicart-lake', 'tmp/backfill/x.csv', 7) == 'EXPIRED' and storage_class_after('chaicart-lake', 'curated/top_items/dt=2026-10-01/top.csv', 1000) == 'STANDARD'", message: { en: 'tmp/ expires at 7 days; curated/ stays STANDARD.', mr: 'tmp/ 7 दिवसांनी expire; curated/ STANDARD च राहतो.' } },
              ],
            },
          ],
          hints: [
            { en: 'The InvalidArgument error explains itself: objects must spend at least 30 days in Standard before Standard-IA. Each extra action is another key in the same rule dict: "Expiration", "NoncurrentVersionExpiration", "AbortIncompleteMultipartUpload".', mr: 'InvalidArgument error स्वतःच सांगतो: Standard-IA आधी objects नी किमान 30 दिवस Standard मध्ये राहायला हवं. प्रत्येक जास्तीची action त्याच rule dict मधली आणखी एक key आहे: "Expiration", "NoncurrentVersionExpiration", "AbortIncompleteMultipartUpload".' },
            { en: "Transitions is a list of two dicts. Expiration: {'Days': 730}. NoncurrentVersionExpiration: {'NoncurrentDays': 30}. AbortIncompleteMultipartUpload: {'DaysAfterInitiation': 7}. The second rule needs ID, Filter, Status and Expiration.", mr: "Transitions म्हणजे दोन dicts ची list. Expiration: {'Days': 730}. NoncurrentVersionExpiration: {'NoncurrentDays': 30}. AbortIncompleteMultipartUpload: {'DaysAfterInitiation': 7}. दुसऱ्या rule ला ID, Filter, Status आणि Expiration लागतात." },
            { en: "        'Transitions': [{'Days': 30, 'StorageClass': 'STANDARD_IA'},\n                        {'Days': 90, 'StorageClass': 'GLACIER'}],\n        'Expiration': {'Days': 730},\n        'NoncurrentVersionExpiration': {'NoncurrentDays': 30},\n        'AbortIncompleteMultipartUpload': {'DaysAfterInitiation': 7},\n    },\n    {'ID': 'tmp-cleanup', 'Filter': {'Prefix': 'tmp/'}, 'Status': 'Enabled', 'Expiration': {'Days': 7}},", mr: "        'Transitions': [{'Days': 30, 'StorageClass': 'STANDARD_IA'},\n                        {'Days': 90, 'StorageClass': 'GLACIER'}],\n        'Expiration': {'Days': 730},\n        'NoncurrentVersionExpiration': {'NoncurrentDays': 30},\n        'AbortIncompleteMultipartUpload': {'DaysAfterInitiation': 7},\n    },\n    {'ID': 'tmp-cleanup', 'Filter': {'Prefix': 'tmp/'}, 'Status': 'Enabled', 'Expiration': {'Days': 7}}," },
          ],
          successLine: { en: 'The notice board is up. Cold raw data gets cheaper every month, and nobody has to remember to clean tmp/.', mr: 'सूचना फलक लागला. थंड raw data दर महिन्याला स्वस्त होतो, आणि tmp/ साफ करायचं कोणालाच लक्षात ठेवावं लागत नाही.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'An auditor asks for a receipt from March 2024. It was archived long ago. Press Run: the code reads it the normal way. What is happening, and what is true?', mr: 'एका auditor ला March 2024 ची एक पावती हवी आहे. ती खूप आधी archive झाली. Run दाबा: code ती नेहमीच्या पद्धतीने वाचतो. काय होतंय, आणि खरं काय आहे?' },
          pythonSandbox: {
            code: String.raw`import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
key = 'archive/receipts/dt=2024-03-15/R-0042.json'
s3.put_object(Bucket='chaicart-archive', Key=key, Body='{"receipt": "R-0042", "amount": 40}', StorageClass='GLACIER')

print('storage class:', s3.head_object(Bucket='chaicart-archive', Key=key)['StorageClass'])
try:
    s3.get_object(Bucket='chaicart-archive', Key=key)
except ClientError as e:
    print(e.response['Error']['Code'], '-', e.response['Error']['Message'])
`,
            aws: { buckets: { 'chaicart-archive': {} } },
          },
          options: [
            { en: 'A lifecycle rule deleted the receipt, so it is gone', mr: 'lifecycle rule ने पावती delete केली, म्हणून ती गेली' },
            { en: 'GLACIER (Flexible Retrieval) objects are archived: you first call RestoreObject and wait (expedited typically 1 to 5 minutes, standard 3 to 5 hours, bulk 5 to 12 hours), then read the temporary copy. If people need instant reads of old files, Glacier Instant Retrieval is the right class', mr: 'GLACIER (Flexible Retrieval) objects archive झालेले असतात: आधी RestoreObject करून थांबावं लागतं (expedited साधारण 1 ते 5 मिनिटं, standard 3 ते 5 तास, bulk 5 ते 12 तास), मग temporary copy वाचायची. जुन्या files लगेच वाचायच्या असतील तर Glacier Instant Retrieval हा योग्य class' },
            { en: 'Retrying get_object with a Range header will read it', mr: 'Range header सह get_object पुन्हा केला की ती वाचता येईल' },
            { en: 'GLACIER means the object was moved to another Region', mr: 'GLACIER म्हणजे object दुसऱ्या Region मध्ये हलवला' },
          ],
          correct: [1],
          explain: { en: 'head_object still works (the metadata is there) but get_object answers InvalidObjectState: the data is archived. Restoring creates a temporary readable copy for the number of days you ask; the archive stays where it is. Choose the class by how fast people will need the data, not only by price.', mr: 'head_object अजूनही चालतो (metadata तिथे आहे) पण get_object InvalidObjectState देतो: data archive झाला आहे. Restore तुम्ही मागाल तेवढ्या दिवसांसाठी वाचता येणारी temporary copy बनवतो; archive जागेवरच राहतो. data किती लवकर लागेल त्यावरून class निवडा, फक्त किमतीवरून नाही.' },
          hints: [
            { en: 'Read the error code. Did head_object fail too?', mr: 'error code वाचा. head_object पण fail झाला का?' },
            { en: 'Glacier Flexible Retrieval and Deep Archive are "restore first" classes; Glacier Instant Retrieval is read in milliseconds.', mr: 'Glacier Flexible Retrieval आणि Deep Archive हे "आधी restore" classes आहेत; Glacier Instant Retrieval milliseconds मध्ये वाचता येतो.' },
          ],
          successLine: { en: 'The basement store: cheap shelves, but you fill a slip and wait.', mr: 'तळघरातलं भांडार: स्वस्त कपाटं, पण चिठ्ठी भरून थांबावं लागतं.' },
        },
        {
          kind: 'python',
          prompt: { en: 'The bridge to the next act. Tell chaicart-lake to notify the Lambda process-orders whenever a new order file lands. Add a Filter to the configuration so only keys under raw/orders/ that end in .csv trigger it: {"Key": {"FilterRules": [{"Name": "prefix", "Value": "raw/orders/"}, {"Name": "suffix", "Value": ".csv"}]}}. The prefix matters: the Lambda will write to curated/, and a trigger on the whole bucket would make it call itself. (In real AWS, the function must also allow s3.amazonaws.com to invoke it, or S3 refuses the configuration.)', mr: 'पुढच्या act कडे जाणारा पूल. नवी order file आली की process-orders Lambda ला कळवायला chaicart-lake ला सांगा. configuration मध्ये Filter जोडा म्हणजे फक्त raw/orders/ खालच्या आणि .csv ने संपणाऱ्या keys नेच ते सुरू होईल: {"Key": {"FilterRules": [{"Name": "prefix", "Value": "raw/orders/"}, {"Name": "suffix", "Value": ".csv"}]}}. prefix महत्त्वाचा: Lambda curated/ मध्ये लिहील, आणि पूर्ण bucket वरचा trigger त्याला स्वतःलाच बोलवायला लावेल. (खऱ्या AWS मध्ये function ने s3.amazonaws.com ला invoke करू द्यायला हवं, नाहीतर S3 configuration नाकारतो.)' },
          aws: { buckets: { 'chaicart-lake': { 'raw/orders/dt=2026-11-24/orders.csv': 'id,amt\n1,50\n' } } },
          starter: String.raw`import boto3

s3 = boto3.client('s3')
LAKE = 'chaicart-lake'
FN = 'arn:aws:lambda:ap-south-1:123456789012:function:process-orders'

config = {'LambdaFunctionConfigurations': [{
    'Id': 'new-raw-orders',
    'LambdaFunctionArn': FN,
    'Events': ['s3:ObjectCreated:*'],
    # TODO: 'Filter' so only raw/orders/*.csv triggers the function
}]}
s3.put_bucket_notification_configuration(Bucket=LAKE, NotificationConfiguration=config)

for c in s3.get_bucket_notification_configuration(Bucket=LAKE)['LambdaFunctionConfigurations']:
    rules = {r['Name']: r['Value'] for r in c['Filter']['Key']['FilterRules']}
    print(c['LambdaFunctionArn'].split(':')[-1], c['Events'], rules)
`,
          solution: String.raw`import boto3

s3 = boto3.client('s3')
LAKE = 'chaicart-lake'
FN = 'arn:aws:lambda:ap-south-1:123456789012:function:process-orders'

config = {'LambdaFunctionConfigurations': [{
    'Id': 'new-raw-orders',
    'LambdaFunctionArn': FN,
    'Events': ['s3:ObjectCreated:*'],
    'Filter': {'Key': {'FilterRules': [
        {'Name': 'prefix', 'Value': 'raw/orders/'},
        {'Name': 'suffix', 'Value': '.csv'},
    ]}},
}]}
s3.put_bucket_notification_configuration(Bucket=LAKE, NotificationConfiguration=config)

for c in s3.get_bucket_notification_configuration(Bucket=LAKE)['LambdaFunctionConfigurations']:
    rules = {r['Name']: r['Value'] for r in c['Filter']['Key']['FilterRules']}
    print(c['LambdaFunctionArn'].split(':')[-1], c['Events'], rules)
`,
          output: ["process-orders ['s3:ObjectCreated:*'] {'Prefix': 'raw/orders/', 'Suffix': '.csv'}"],
          checks: [
            { expr: "s3_bucket('chaicart-lake')['notifications'][0]['prefix'] == 'raw/orders/' and s3_bucket('chaicart-lake')['notifications'][0]['suffix'] == '.csv'", message: { en: 'The trigger should filter on prefix raw/orders/ and suffix .csv.', mr: 'trigger ने prefix raw/orders/ आणि suffix .csv वर filter करायला हवं.' } },
            { expr: "s3_bucket('chaicart-lake')['notifications'][0]['arn'].endswith(':function:process-orders')", message: { en: 'The trigger should point at the process-orders function ARN.', mr: 'trigger process-orders function च्या ARN कडे हवा.' } },
          ],
          hints: [
            { en: 'Filter sits next to Events inside the same dict: "Filter": {"Key": {"FilterRules": [...]}} with one rule named prefix and one named suffix.', mr: 'Filter त्याच dict मध्ये Events शेजारी येतो: "Filter": {"Key": {"FilterRules": [...]}}, ज्यात prefix नावाचा एक आणि suffix नावाचा एक rule.' },
            { en: "    'Filter': {'Key': {'FilterRules': [\n        {'Name': 'prefix', 'Value': 'raw/orders/'},\n        {'Name': 'suffix', 'Value': '.csv'},\n    ]}},", mr: "    'Filter': {'Key': {'FilterRules': [\n        {'Name': 'prefix', 'Value': 'raw/orders/'},\n        {'Name': 'suffix', 'Value': '.csv'},\n    ]}}," },
          ],
          successLine: { en: 'The lake now rings a bell for every new order file. Next act: the code that answers it.', mr: 'आता प्रत्येक नव्या order file साठी lake घंटा वाजवतो. पुढचा act: त्याला उत्तर देणारा code.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Versioning is on. Someone calls delete_object(Bucket=b, Key=k) with no VersionId. What happens?', mr: 'Versioning चालू आहे. कोणी VersionId शिवाय delete_object(Bucket=b, Key=k) करतं. काय होतं?' },
        options: [
          { en: 'Every version of k is permanently removed', mr: 'k ची प्रत्येक version कायमची निघून जाते' },
          { en: 'A delete marker becomes the latest version; k disappears from listings but all its versions remain and can be brought back', mr: 'delete marker latest version बनतो; k listings मधून गायब होते पण तिच्या सगळ्या versions राहतात आणि परत आणता येतात' },
          { en: 'S3 refuses the delete because versioning is on', mr: 'versioning चालू आहे म्हणून S3 delete नाकारतो' },
          { en: 'Only the oldest version is removed', mr: 'फक्त सर्वात जुनी version निघते' },
        ],
        answer: 1,
        explain: { en: 'A plain delete in a versioned bucket only adds a delete marker. Delete the marker (by its VersionId) and the file is back. Only a delete with a specific VersionId is permanent.', mr: 'versioned bucket मधला साधा delete फक्त delete marker जोडतो. marker (त्याच्या VersionId ने) delete केला की file परत. फक्त ठराविक VersionId सह केलेला delete कायमचा असतो.' },
      },
      {
        q: { en: 'Daily dashboard files are read every morning for a week, then almost never, but auditors may need any of them within milliseconds for 5 years. Which plan fits best?', mr: 'रोजच्या dashboard files आठवडाभर रोज सकाळी वाचल्या जातात, मग जवळजवळ कधीच नाही, पण auditors ना 5 वर्षं कोणतीही file milliseconds मध्ये लागू शकते. कोणता plan सगळ्यात योग्य?' },
        options: [
          { en: 'Keep everything in S3 Standard forever', mr: 'सगळं कायम S3 Standard मध्ये ठेवा' },
          { en: 'Put them straight into Glacier Deep Archive', mr: 'त्या थेट Glacier Deep Archive मध्ये ठेवा' },
          { en: 'One Zone-IA, because it is cheapest for important data', mr: 'One Zone-IA, कारण महत्त्वाच्या data साठी तो सर्वात स्वस्त' },
          { en: 'Standard first, a lifecycle transition to Standard-IA at 30 days and Glacier Instant Retrieval at 90, expiring after 5 years', mr: 'आधी Standard, 30 दिवसांनी Standard-IA आणि 90 ला Glacier Instant Retrieval असं lifecycle transition, 5 वर्षांनी expire' },
        ],
        answer: 3,
        explain: { en: 'Hot for a week means Standard; rare but instant reads later means IA then Glacier Instant Retrieval (milliseconds). Deep Archive needs hours to restore, and One Zone-IA lives in a single AZ, so it is for data you can re-create.', mr: 'आठवडाभर गरम म्हणजे Standard; नंतर क्वचित पण लगेच वाचायचं म्हणजे IA आणि मग Glacier Instant Retrieval (milliseconds). Deep Archive ला restore साठी तास लागतात, आणि One Zone-IA एकाच AZ मध्ये असतो, म्हणून तो पुन्हा बनवता येणाऱ्या data साठी.' },
      },
      {
        q: { en: 'What does this lifecycle rule do to a file under raw/?', mr: 'हा lifecycle rule raw/ खालच्या file चं काय करतो?' },
        code: `{'ID': 'raw', 'Filter': {'Prefix': 'raw/'}, 'Status': 'Enabled',
 'Transitions': [{'Days': 30, 'StorageClass': 'STANDARD_IA'},
                 {'Days': 180, 'StorageClass': 'DEEP_ARCHIVE'}],
 'NoncurrentVersionExpiration': {'NoncurrentDays': 60}}`,
        options: [
          { en: 'Standard-IA from day 30, Deep Archive from day 180, never expires; versions that were replaced are deleted 60 days after they became noncurrent', mr: 'दिवस 30 पासून Standard-IA, दिवस 180 पासून Deep Archive, कधीच expire होत नाही; बदललेल्या versions noncurrent झाल्यानंतर 60 दिवसांनी delete होतात' },
          { en: 'Deletes the file after 60 days', mr: '60 दिवसांनी file delete करतो' },
          { en: 'Moves it to Deep Archive on day 30', mr: 'दिवस 30 ला ती Deep Archive मध्ये हलवतो' },
          { en: 'Nothing, because Deep Archive cannot be used in lifecycle rules', mr: 'काहीच नाही, कारण lifecycle rules मध्ये Deep Archive वापरता येत नाही' },
        ],
        answer: 0,
        explain: { en: 'Transitions run in order of days. There is no Expiration, so the current version stays (in Deep Archive) forever. NoncurrentVersionExpiration only cleans up old versions.', mr: 'Transitions दिवसांच्या क्रमाने चालतात. Expiration नाही, म्हणून current version कायम (Deep Archive मध्ये) राहते. NoncurrentVersionExpiration फक्त जुन्या versions साफ करतं.' },
      },
      {
        q: { en: 'ChaiCart wants a copy of every new receipt in another Region for disaster recovery. What is required?', mr: 'disaster recovery साठी ChaiCart ला प्रत्येक नव्या पावतीची copy दुसऱ्या Region मध्ये हवी. काय लागतं?' },
        options: [
          { en: 'Nothing: S3 already copies every bucket to all Regions', mr: 'काहीच नाही: S3 आधीच प्रत्येक bucket सगळ्या Regions मध्ये copy करतो' },
          { en: 'A lifecycle rule with a transition to another Region', mr: 'दुसऱ्या Region कडे transition असलेला lifecycle rule' },
          { en: 'Cross-Region Replication: versioning on both buckets, an IAM role S3 can use, and a replication rule; existing receipts need S3 Batch Replication', mr: 'Cross-Region Replication: दोन्ही buckets वर versioning, S3 वापरू शकेल असा IAM role, आणि replication rule; आधीपासूनच्या पावत्यांसाठी S3 Batch Replication' },
          { en: 'Make the bucket public so the other Region can read it', mr: 'दुसऱ्या Region ला वाचता यावं म्हणून bucket public करा' },
        ],
        answer: 2,
        explain: { en: 'A bucket lives in one Region (its data is spread over AZs there). CRR copies new objects asynchronously; with Replication Time Control, 99.99% arrive within 15 minutes. Lifecycle changes storage class, never Region.', mr: 'bucket एकाच Region मध्ये असतो (त्याचा data तिथल्या AZs मध्ये पसरलेला असतो). CRR नवे objects asynchronously copy करतं; Replication Time Control सह 99.99% 15 मिनिटांत पोहोचतात. Lifecycle storage class बदलतो, Region कधीच नाही.' },
      },
    ],
    recap: { line: { en: 'Versioning turns overwrites into history and deletes into markers. Storage classes trade price for access speed, lifecycle moves and cleans on a schedule, replication copies across Regions, and notifications start the next step.', mr: 'Versioning overwrites चं इतिहासात आणि deletes चं markers मध्ये रूपांतर करतं. Storage classes किंमत आणि access वेग यांची तडजोड करतात, lifecycle ठरलेल्या वेळी हलवतं आणि साफ करतं, replication Regions पलीकडे copy करतं, आणि notifications पुढची पायरी सुरू करतात.' }, icon: '🗄️' },
    interview: [
      {
        q: { en: 'What is S3 versioning, and how do you recover an overwritten or deleted file?', mr: 'S3 versioning म्हणजे काय, आणि overwrite किंवा delete झालेली file परत कशी आणता?' },
        a: { en: 'Versioning keeps every version of a key, each with its own VersionId. An overwrite adds a new version; a plain delete adds a delete marker, so the data is still there. To recover an overwrite, I list the versions with list_object_versions and copy the good version back on top, which keeps the history. To recover a delete, I delete the delete marker by its VersionId. Once enabled, versioning can only be suspended, never removed, and objects created before it have the version ID null. The cost gotcha: add a NoncurrentVersionExpiration rule, or old versions pile up forever.', mr: 'Versioning key ची प्रत्येक version जपतं, प्रत्येकीला स्वतःचा VersionId. overwrite नवी version जोडतो; साधा delete delete marker जोडतो, म्हणजे data तिथेच असतो. overwrite परत आणायला मी list_object_versions ने versions पाहते आणि चांगली version वर copy करते, त्याने इतिहास टिकतो. delete परत आणायला delete marker त्याच्या VersionId ने delete करते. एकदा चालू केलं की versioning फक्त suspend करता येतं, काढता येत नाही, आणि त्याआधी बनलेल्या objects ची version ID null असते. खर्चाची गोम: NoncurrentVersionExpiration rule जोडा, नाहीतर जुन्या versions कायम साठत राहतात.' },
      },
      {
        q: { en: 'Compare the S3 storage classes. How do you choose?', mr: 'S3 storage classes ची तुलना करा. तुम्ही कसा निवडता?' },
        a: { en: 'I choose by how often and how fast the data is read. Standard is for hot data: milliseconds, 99.99% availability, no minimum duration. Standard-IA and One Zone-IA are cheaper to store but charge per GB retrieved, with a 30-day minimum and 128 KB minimum billable size; One Zone-IA sits in one AZ, so only for re-creatable data. Glacier Instant Retrieval gives milliseconds for data read about once a quarter, 90-day minimum. Glacier Flexible Retrieval needs a restore of minutes to hours, also 90 days, and Deep Archive is cheapest with restores within 12 to 48 hours and a 180-day minimum. Intelligent-Tiering is for unknown patterns: it moves objects itself, with no retrieval fees but a small per-object monitoring fee. All are designed for 11 nines durability; Express One Zone is the single-AZ, single-digit-millisecond option for very hot data.', mr: 'data किती वेळा आणि किती लवकर वाचला जातो त्यावरून मी निवडते. Standard गरम data साठी: milliseconds, 99.99% availability, किमान कालावधी नाही. Standard-IA आणि One Zone-IA साठवायला स्वस्त पण प्रति GB retrieval शुल्क, 30 दिवस किमान आणि 128 KB किमान billable size; One Zone-IA एकाच AZ मध्ये, म्हणून फक्त पुन्हा बनवता येणाऱ्या data साठी. Glacier Instant Retrieval तिमाहीत एकदा वाचल्या जाणाऱ्या data साठी milliseconds देतो, 90 दिवस किमान. Glacier Flexible Retrieval ला मिनिटं ते तास restore लागतो, तोही 90 दिवस, आणि Deep Archive सर्वात स्वस्त, 12 ते 48 तासांत restore आणि 180 दिवस किमान. Intelligent-Tiering अनोळखी patterns साठी: तो objects स्वतः हलवतो, retrieval fee नाही पण प्रति object छोटी monitoring fee. सगळे 11 nines durability साठी बनवलेले; Express One Zone अतिशय गरम data साठी single-AZ, single-digit-millisecond पर्याय.' },
      },
      {
        q: { en: 'Design a lifecycle policy for a data lake\'s raw zone.', mr: 'data lake च्या raw zone साठी lifecycle policy design करा.' },
        a: { en: 'Raw data is the source of truth, so I make it cheaper over time instead of deleting it early. For ChaiCart raw orders: Standard for 30 days while backfills and debugging happen, Standard-IA at 30, Glacier Flexible Retrieval at 90, and expiry at the retention the business and law require. On the same rule I add NoncurrentVersionExpiration so replaced versions do not live forever, and AbortIncompleteMultipartUpload after 7 days. tmp/ gets a short expiry, and curated/ has no transitions because dashboards read it daily. Gotchas: transitions only go down, IA needs objects at least 30 days old, objects under 128 KB are not transitioned by default since September 2024, and early deletion from IA or Glacier is charged for the minimum duration. So I also compact small files before archiving.', mr: 'raw data हा source of truth आहे, म्हणून तो लवकर delete न करता काळाप्रमाणे स्वस्त करते. ChaiCart raw orders साठी: backfills आणि debugging चालू असताना 30 दिवस Standard, 30 ला Standard-IA, 90 ला Glacier Flexible Retrieval, आणि व्यवसाय आणि कायदा मागेल त्या retention नंतर expiry. त्याच rule वर NoncurrentVersionExpiration जोडते म्हणजे बदललेल्या versions कायम राहत नाहीत, आणि 7 दिवसांनी AbortIncompleteMultipartUpload. tmp/ ला लहान expiry, आणि curated/ ला transitions नाहीत कारण dashboards तो रोज वाचतात. गोमी: transitions फक्त खाली जातात, IA साठी objects किमान 30 दिवस जुने हवेत, September 2024 पासून 128 KB पेक्षा लहान objects default ने transition होत नाहीत, आणि IA किंवा Glacier मधून लवकर delete केलं तर किमान कालावधीचे पैसे लागतात. म्हणून archive करण्याआधी मी लहान files एकत्र (compact) करते.' },
      },
      {
        q: { en: 'get_object fails with InvalidObjectState. Why, and what do you do?', mr: 'get_object InvalidObjectState ने fail होतो. का, आणि तुम्ही काय करता?' },
        a: { en: 'The object is in an archive class, Glacier Flexible Retrieval or Deep Archive (or an Intelligent-Tiering archive tier), so it cannot be read directly. I call RestoreObject with a number of days and a retrieval tier: for Flexible Retrieval, expedited typically takes 1 to 5 minutes, standard 3 to 5 hours, bulk 5 to 12 hours; Deep Archive takes up to 12 hours standard or 48 hours bulk. S3 then keeps a temporary readable copy for those days while the archived object stays put. head_object shows the restore status. If the business needs instant reads of old data, the fix is choosing Glacier Instant Retrieval instead, which reads in milliseconds.', mr: 'object archive class मध्ये आहे, Glacier Flexible Retrieval किंवा Deep Archive (किंवा Intelligent-Tiering चा archive tier), म्हणून तो थेट वाचता येत नाही. मी दिवसांची संख्या आणि retrieval tier देऊन RestoreObject करते: Flexible Retrieval साठी expedited साधारण 1 ते 5 मिनिटं, standard 3 ते 5 तास, bulk 5 ते 12 तास; Deep Archive ला standard ने 12 तासांपर्यंत किंवा bulk ने 48 तास. मग S3 त्या दिवसांसाठी वाचता येणारी temporary copy ठेवतो आणि archive झालेला object जागेवरच राहतो. restore ची स्थिती head_object दाखवतो. व्यवसायाला जुना data लगेच वाचायचा असेल तर उपाय म्हणजे त्याऐवजी Glacier Instant Retrieval निवडणं, जो milliseconds मध्ये वाचतो.' },
      },
      {
        q: { en: 'What makes up an S3 bill, and how do you reduce it?', mr: 'S3 bill कशाचं बनलेलं असतं, आणि ते कसं कमी करता?' },
        a: { en: 'Four parts: storage per GB-month by class, requests (writes and lists cost more than reads, and lifecycle transitions count as requests), retrieval per GB from IA and Glacier classes, and data transfer out to the internet or other Regions; transfer in is free. To reduce it I first measure with Storage Lens or Storage Class Analysis, then move cold data down with lifecycle, expire temp files, noncurrent versions and incomplete multipart uploads, and avoid millions of tiny objects by compacting into bigger Parquet files. For SSE-KMS I enable Bucket Keys to cut KMS request costs. At ChaiCart the quick win was three years of raw app logs sitting in Standard. The gotcha is moving data that is still read often into IA or Glacier: retrieval fees and minimum durations can make it more expensive.', mr: 'चार भाग: class प्रमाणे प्रति GB-month storage, requests (writes आणि lists reads पेक्षा महाग, आणि lifecycle transitions पण requests म्हणून मोजले जातात), IA आणि Glacier classes मधून प्रति GB retrieval, आणि internet किंवा इतर Regions कडे data transfer out; transfer in फुकट. कमी करायला आधी Storage Lens किंवा Storage Class Analysis ने मोजमाप करते, मग lifecycle ने थंड data खाली हलवते, temp files, noncurrent versions आणि अर्धवट multipart uploads expire करते, आणि लाखो लहान objects टाळायला मोठ्या Parquet files मध्ये compact करते. SSE-KMS साठी KMS request खर्च कमी करायला Bucket Keys चालू करते. ChaiCart मध्ये झटपट फायदा म्हणजे Standard मध्ये पडलेले तीन वर्षांचे raw app logs. गोम म्हणजे अजूनही वारंवार वाचला जाणारा data IA किंवा Glacier मध्ये हलवणं: retrieval fees आणि किमान कालावधीमुळे ते महाग पडू शकतं.' },
      },
      {
        q: { en: 'Explain S3 replication: CRR vs SRR, and what it does not do.', mr: 'S3 replication समजावा: CRR विरुद्ध SRR, आणि ते काय करत नाही.' },
        a: { en: 'Replication copies new objects asynchronously from a source bucket to a destination bucket. Cross-Region Replication is for disaster recovery, compliance or users in another Region; Same-Region Replication is for keeping a copy in another account, aggregating logs or separating prod and test. Both need versioning on both buckets and an IAM role that S3 assumes. It only replicates objects written after the rule exists; existing objects need S3 Batch Replication. Delete markers are not replicated unless you turn that on, and deletes of specific versions are never replicated, which protects against malicious deletes. Most objects replicate within minutes, and Replication Time Control promises 99.99% within 15 minutes. Gotcha: replication is not a backup by itself; combine it with versioning, Object Lock or a separate backup account.', mr: 'Replication नवे objects source bucket मधून destination bucket मध्ये asynchronously copy करतं. Cross-Region Replication disaster recovery, compliance किंवा दुसऱ्या Region मधल्या users साठी; Same-Region Replication दुसऱ्या account मध्ये copy ठेवायला, logs एकत्र करायला किंवा prod आणि test वेगळे ठेवायला. दोन्हींना दोन्ही buckets वर versioning आणि S3 assume करेल असा IAM role लागतो. rule बनल्यानंतर लिहिलेले objects च replicate होतात; आधीपासूनच्या objects साठी S3 Batch Replication लागतं. delete markers तुम्ही चालू केल्याशिवाय replicate होत नाहीत, आणि ठराविक versions चे deletes कधीच replicate होत नाहीत, जे वाईट हेतूच्या deletes पासून वाचवतं. बहुतेक objects काही मिनिटांत replicate होतात, आणि Replication Time Control 99.99% 15 मिनिटांत देण्याचं वचन देतो. गोम: replication स्वतः backup नाही; त्याला versioning, Object Lock किंवा वेगळ्या backup account ची जोड द्या.' },
      },
      {
        q: { en: 'How do S3 event notifications work, and what should you watch out for?', mr: 'S3 event notifications कसे चालतात, आणि कशाकडे लक्ष द्यायला हवं?' },
        a: { en: 'You configure the bucket to publish events like s3:ObjectCreated:* or s3:ObjectRemoved:* to a Lambda function, an SQS queue, an SNS topic, or to EventBridge for richer routing, with prefix and suffix filters. Delivery is at least once and usually within seconds, though it can take a minute or longer. So the consumer must be idempotent: processing the same file twice must give the same result. Ordering is not guaranteed; the sequencer field helps compare events for the same key. The classic bug is a Lambda that writes into the same bucket and prefix that triggers it, creating a loop, so ChaiCart triggers on raw/orders/*.csv and writes to curated/. For heavy or bursty traffic, putting SQS between S3 and Lambda gives buffering and retries.', mr: 'bucket ला s3:ObjectCreated:* किंवा s3:ObjectRemoved:* सारखे events Lambda function, SQS queue, SNS topic, किंवा जास्त routing साठी EventBridge कडे पाठवायला configure करता, prefix आणि suffix filters सह. Delivery किमान एकदा (at least once) आणि साधारण काही seconds मध्ये, कधी कधी एक मिनिट किंवा जास्त. म्हणून consumer idempotent हवा: तीच file दोनदा process झाली तरी निकाल तोच यायला हवा. क्रमाची खात्री नसते; एकाच key च्या events तुलना करायला sequencer field मदत करतं. जुना bug म्हणजे ज्या bucket आणि prefix मुळे ते सुरू होतं तिथेच लिहिणारं Lambda, ज्याने loop तयार होतो, म्हणून ChaiCart raw/orders/*.csv वर trigger करतं आणि curated/ मध्ये लिहितं. जड किंवा अचानक वाढणाऱ्या traffic साठी S3 आणि Lambda मध्ये SQS ठेवला तर buffering आणि retries मिळतात.' },
      },
      {
        q: { en: 'How do you protect S3 data from accidental or malicious deletion?', mr: 'S3 data चुकून किंवा जाणूनबुजून delete होण्यापासून कसा वाचवता?' },
        a: { en: 'Layers. Versioning first, so deletes become markers and overwrites keep the old version. Least-privilege IAM so few roles have s3:DeleteObject, and almost nobody has s3:DeleteObjectVersion or s3:PutBucketVersioning. MFA delete can require the root user\'s MFA code for permanent version deletes and versioning changes; only the root user can enable it, through the CLI or API. For records that must not change, S3 Object Lock gives write-once-read-many retention in governance or compliance mode, and it needs versioning. Replication or AWS Backup to a separate account protects against a compromised account. And I alert on unusual DeleteObject activity through CloudTrail. For ChaiCart receipts, versioning plus Object Lock for the legal retention period would be my answer.', mr: 'थरांनी. आधी versioning, म्हणजे deletes markers बनतात आणि overwrites जुनी version जपतात. Least-privilege IAM म्हणजे थोड्याच roles कडे s3:DeleteObject, आणि जवळजवळ कोणाकडेच s3:DeleteObjectVersion किंवा s3:PutBucketVersioning नाही. MFA delete कायमच्या version deletes आणि versioning बदलांसाठी root user चा MFA code मागू शकतो; तो फक्त root user CLI किंवा API ने चालू करू शकतो. न बदलायच्या records साठी S3 Object Lock governance किंवा compliance mode मध्ये write-once-read-many retention देतो, आणि त्याला versioning लागतं. वेगळ्या account मध्ये replication किंवा AWS Backup account compromise झालं तरी वाचवतो. आणि CloudTrail मधून असामान्य DeleteObject हालचालींवर alert लावते. ChaiCart पावत्यांसाठी versioning आणि कायदेशीर retention कालावधीसाठी Object Lock हे माझं उत्तर.' },
      },
    ],
  },
  // ───────────────────────── B1.6 Boss: The Lake of Receipts
  {
    id: 'lk1-6',
    code: 'B1.6',
    level: 'intermediate',
    isBoss: true,
    title: { en: 'Boss: The Lake of Receipts', mr: 'Boss: पावत्यांचं तळं' },
    skill: 'Reorganise a flat bucket into Hive partitions, quarantine with a reason, copy-then-delete, recover the last good version, lifecycle and Block Public Access, reconcile every file',
    realLife: {
      place: 'postoffice',
      title: { en: 'The sorting room at Pune GPO', mr: 'पुणे GPO मधली sorting room' },
      story: {
        en: 'Night shift at the Pune head post office. A truck tips three hundred letters onto one long table, all mixed up. The sorters do not throw anything in a corner. Each letter goes into the pigeonhole for its PIN code and date. A letter with a smudged address, an empty envelope, or a date that cannot exist goes into the dead-letter tray with a slip saying why. A letter is only crossed off the table after it is safely in its pigeonhole, never before. At 4 a.m. the supervisor counts: letters received = letters sorted + letters in the dead-letter tray. Then she checks the registered-post register, which someone scribbled over last night: she finds the last clean copy in the carbon book and copies it back. Before leaving, she makes sure the back door is locked and pins up the rule: dead letters are destroyed after thirty days.',
        mr: 'पुण्याच्या मुख्य टपाल कार्यालयात रात्रपाळी. एक ट्रक तीनशे पत्रं एका लांब टेबलावर ओततो, सगळी एकमेकांत मिसळलेली. sorters काहीही कोपऱ्यात फेकत नाहीत. प्रत्येक पत्र त्याच्या PIN code आणि तारखेच्या कप्प्यात जातं. पुसलेल्या पत्त्याचं पत्र, रिकामं पाकीट, किंवा अशक्य तारखेचं पत्र dead-letter ट्रेमध्ये जातं, का ते सांगणाऱ्या चिठ्ठीसह. पत्र कप्प्यात सुरक्षित पोहोचल्यानंतरच टेबलावरून खोडलं जातं, आधी कधीच नाही. पहाटे 4 वाजता supervisor मोजते: आलेली पत्रं = sort झालेली पत्रं + dead-letter ट्रेमधली पत्रं. मग ती registered-post register तपासते, ज्यावर काल रात्री कोणीतरी खरडलं आहे: carbon वहीत शेवटची स्वच्छ प्रत शोधून ती परत लिहिते. निघण्याआधी मागचं दार कुलूपबंद आहे याची खात्री करते आणि नियम लावते: dead letters तीस दिवसांनी नष्ट केली जातात.',
      },
      scene: {
        type: 'group',
        groups: [
          { icon: '📅', label: 'dt=2026-11-22', mr: 'dt=2026-11-22' },
          { icon: '📅', label: 'dt=2026-11-23', mr: 'dt=2026-11-23' },
          { icon: '🚧', label: 'quarantine/', mr: 'quarantine/' },
        ],
        items: [
          { icon: '🧾', group: 0 },
          { icon: '🧾', group: 0 },
          { icon: '🧾', group: 1 },
          { icon: '🧾', group: 1 },
          { icon: '📭', group: 2 },
          { icon: '👾', group: 2 },
          { icon: '❓', group: 2 },
        ],
        note: { en: 'files in = moved + quarantined: 7 = 4 + 3', mr: 'आलेल्या files = हलवलेल्या + quarantine: 7 = 4 + 3' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'angry', text: { en: 'The finance team opened chaicart-dump this morning: hundreds of receipts in one flat heap, odd names, empty files. And yesterday\'s daily totals file now says "date,orders,amount" and nothing else. Month-end close is tomorrow.', mr: 'आज सकाळी finance team ने chaicart-dump उघडला: एकाच सपाट ढिगात शेकडो पावत्या, विचित्र नावं, रिकाम्या files. आणि कालची daily totals file आता फक्त "date,orders,amount" म्हणते, बाकी काही नाही. उद्या month-end close आहे.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'a key with spaces. an empty receipt. 31 november. and your totals overwritten twice, the second time with a header that looks so real. ⌁ sort that, data engineer.', mr: 'spaces असलेली key. रिकामी पावती. 31 नोव्हेंबर. आणि तुमचे totals दोनदा overwrite, दुसऱ्यांदा अगदी खऱ्यासारख्या दिसणाऱ्या header ने. ⌁ sort कर आता, data engineer.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Move every good receipt into chaicart-lake under raw/receipts/dt=YYYY-MM-DD/, quarantine the rest with a reason, copy before you delete, recover the totals from versioning, lock the lake down with a lifecycle rule, and print a reconciliation. If files in does not equal moved plus quarantined, the run fails.', mr: 'प्रत्येक चांगली पावती chaicart-lake मध्ये raw/receipts/dt=YYYY-MM-DD/ खाली हलव, बाकीच्या कारणासह quarantine कर, delete करण्याआधी copy कर, versioning मधून totals परत आण, lifecycle rule सह lake बंदोबस्तात ठेव, आणि reconciliation print कर. आलेल्या files हलवलेल्या अधिक quarantine इतक्या नसतील तर run fail.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Every piece is yours already, {name}: keys and prefixes, pagination, partitions, policies, versions, lifecycle. Two hints per step tonight, and hidden buckets will test you: another day, a key with spaces, an empty dump.', mr: 'प्रत्येक तुकडा आधीच तुझा आहे, {name}: keys आणि prefixes, pagination, partitions, policies, versions, lifecycle. आज रात्री प्रत्येक पायरीला दोन hints, आणि लपवलेले buckets तुझी परीक्षा घेतील: दुसरा दिवस, spaces असलेली key, रिकामा dump.' } },
      ],
      problem: { en: 'Receipts land in one flat bucket with inconsistent names; some are empty, misnamed or carry impossible dates. A curated file was overwritten twice. Nothing can be queried by day, nothing reconciles, and a careless fix could lose files or make the lake public.', mr: 'पावत्या एकाच सपाट bucket मध्ये वेगवेगळ्या नावांनी येतात; काही रिकाम्या, चुकीच्या नावाच्या किंवा अशक्य तारखांच्या. एक curated file दोनदा overwrite झाली. दिवसानुसार काहीच query करता येत नाही, काहीच जुळत नाही, आणि घाईचा उपाय files गमावू शकतो किंवा lake public करू शकतो.' },
      solution: { en: 'A small, re-runnable job: plan() turns each key into a Hive-partitioned target or a quarantine reason, move_all() copies then deletes (quarantine keeps the reason as metadata) and returns the counts, recover() finds the newest version whose content is valid, lock_down() keeps public access blocked and adds lifecycle rules, and the run asserts files in = moved + quarantined.', mr: 'पुन्हा चालवता येणारा छोटा job: plan() प्रत्येक key चं Hive-partitioned target किंवा quarantine कारण ठरवतो, move_all() आधी copy मग delete करतो (quarantine कारण metadata म्हणून जपतो) आणि आकडे परत देतो, recover() ज्याचा मजकूर वैध आहे अशी सर्वात नवी version शोधतो, lock_down() public access बंद ठेवतो आणि lifecycle rules जोडतो, आणि run files in = moved + quarantined assert करतो.' },
    },
    lesson: [
      { en: 'S3 has no rename and no move. A "move" is copy_object to the new key, then delete_object of the old one, and the order matters: copy first, delete only after the copy succeeded, so a crash in between leaves a duplicate (harmless) instead of a lost file. Pass CopySource as a dict {"Bucket": ..., "Key": ...}: boto3 then handles keys with spaces and special characters for you, while a "bucket/key" string has to be URL-encoded by hand. A single CopyObject handles objects up to 5 GB; larger ones need a multipart copy (UploadPartCopy), which managed helpers like the client\'s copy() do for you.', mr: 'S3 मध्ये rename नाही आणि move नाही. "move" म्हणजे नव्या key वर copy_object, मग जुन्या key चा delete_object, आणि क्रम महत्त्वाचा: आधी copy, copy यशस्वी झाल्यावरच delete, म्हणजे मध्येच crash झालं तर file हरवण्याऐवजी duplicate (निरुपद्रवी) राहतो. CopySource dict म्हणून द्या {"Bucket": ..., "Key": ...}: मग spaces आणि विशेष अक्षरं असलेल्या keys boto3 तुमच्यासाठी सांभाळतो, तर "bucket/key" string हाताने URL-encode करावा लागतो. एक CopyObject 5 GB पर्यंतचे objects हाताळतो; मोठ्यांसाठी multipart copy (UploadPartCopy) लागतो, जो client च्या copy() सारखे managed helpers तुमच्यासाठी करतात.' },
      { en: 'Decide first, act second. A pure plan(key, size) function returns either a target key or a reason, and does not call AWS, so you can test it on twenty tricky names in a second. Use a regular expression with fullmatch (so "receipt_..._R-1.csv.bak" does not sneak in), validate the date with datetime.strptime (31 November fails), and treat size 0 as bad. Targets are deterministic: the same input always gives the same raw/receipts/dt=YYYY-MM-DD/R-ID.csv, which makes a re-run idempotent. Bad files go to quarantine/ with the reason stored as object metadata, and a lifecycle rule expires quarantine after 30 days, after a human has looked.', mr: 'आधी ठरवा, मग करा. शुद्ध plan(key, size) function एकतर target key किंवा कारण परत देतो, आणि AWS ला call करत नाही, म्हणून वीस अवघड नावांवर तो एका second मध्ये test करता येतो. fullmatch सह regular expression वापरा (म्हणजे "receipt_..._R-1.csv.bak" आत घुसत नाही), datetime.strptime ने तारीख तपासा (31 नोव्हेंबर fail होतो), आणि size 0 खराब माना. targets ठरलेले असतात: तोच input नेहमी तोच raw/receipts/dt=YYYY-MM-DD/R-ID.csv देतो, त्याने पुन्हा चालवणं idempotent होतं. खराब files कारण object metadata म्हणून ठेवून quarantine/ मध्ये जातात, आणि माणसाने पाहिल्यानंतर 30 दिवसांनी lifecycle rule quarantine expire करतो.' },
      { en: 'Recovering from versioning is a content decision, not "take the previous version". The Gremlin overwrote the totals twice, and the second junk version even has the right header. So walk the versions newest first, read each one with get_object(VersionId=...), validate it (right header and at least one data row), and copy the first valid one back on top. The broken versions stay in history as evidence, and the original has the version ID "null" because it was written before versioning was turned on.', mr: 'versioning मधून परत आणणं हा मजकुराचा निर्णय आहे, "मागची version घ्या" नाही. Gremlin ने totals दोनदा overwrite केले, आणि दुसऱ्या कचरा version ला बरोबर header सुद्धा आहे. म्हणून versions सर्वात नवी आधी अशा क्रमाने पाहा, प्रत्येक get_object(VersionId=...) ने वाचा, तपासा (बरोबर header आणि किमान एक data row), आणि पहिली वैध version वर copy करा. बिघडलेल्या versions पुरावा म्हणून इतिहासात राहतात, आणि मूळ version ची ID "null" आहे कारण ती versioning चालू होण्याआधी लिहिली गेली.' },
      { en: 'Reconcile like the 4 a.m. supervisor: files in = moved + quarantined, and assert it, so a silent bug fails loudly instead of losing a receipt. Handle the boring cases: an empty dump bucket has no "Contents" key at all, so use .get("Contents", []) or a paginator, and print 0 | 0 | 0 instead of crashing. Finally, lock the lake: Block Public Access stays on (call it explicitly, it is idempotent), raw/ gets colder with lifecycle (Standard-IA at 30 days, Glacier at 90, noncurrent versions cleaned after 30, unfinished uploads aborted after 7), and quarantine/ expires after 30 days.', mr: 'पहाटे 4 च्या supervisor सारखं जुळवा: files in = moved + quarantined, आणि ते assert करा, म्हणजे गुपचूप bug पावती हरवण्याऐवजी मोठ्याने fail होतो. कंटाळवाणे प्रसंगही सांभाळा: रिकाम्या dump bucket मध्ये "Contents" key च नसते, म्हणून .get("Contents", []) किंवा paginator वापरा, आणि crash होण्याऐवजी 0 | 0 | 0 print करा. शेवटी lake बंदोबस्तात ठेवा: Block Public Access चालू राहतो (तो स्पष्टपणे call करा, तो idempotent आहे), raw/ lifecycle ने थंड होतो (30 दिवसांनी Standard-IA, 90 ला Glacier, noncurrent versions 30 नंतर साफ, अर्धवट uploads 7 नंतर abort), आणि quarantine/ 30 दिवसांनी expire होतो.' },
    ],
    syntax: {
      template: String.raw`NAME = re.compile(r'receipt[ _](\d{4}-\d{2}-\d{2})[ _](R-\d+)\.csv', re.IGNORECASE)

def plan(key, size):            # -> (target, None) or (None, reason)
    ...

for obj in list_objects(DUMP):  # paginator, safe on an empty bucket
    target, reason = plan(obj['Key'], obj['Size'])
    source = {'Bucket': DUMP, 'Key': obj['Key']}
    if target:
        s3.copy_object(Bucket=LAKE, Key=target, CopySource=source)
    else:
        s3.copy_object(Bucket=LAKE, Key='quarantine/' + obj['Key'], CopySource=source,
                       Metadata={'reason': reason}, MetadataDirective='REPLACE')
    s3.delete_object(Bucket=DUMP, Key=obj['Key'])   # only after the copy

assert files_in == moved + quarantined`,
      parts: [
        { code: 'NAME.fullmatch(key)', means: { en: 'the whole key must match the pattern, not just a part of it', mr: 'फक्त एखादा भाग नाही, पूर्ण key pattern शी जुळायला हवी' } },
        { code: "datetime.strptime(day, '%Y-%m-%d')", means: { en: 'raises ValueError for impossible dates like 2026-11-31', mr: '2026-11-31 सारख्या अशक्य तारखांसाठी ValueError देतो' } },
        { code: "CopySource={'Bucket': DUMP, 'Key': key}", means: { en: 'the dict form: keys with spaces work without manual URL-encoding', mr: 'dict रूप: spaces असलेल्या keys हाताने URL-encode न करता चालतात' } },
        { code: "Metadata={'reason': reason}, MetadataDirective='REPLACE'", means: { en: 'store why a file was quarantined on the object itself (x-amz-meta-reason)', mr: 'file quarantine का झाली ते object वरच जपा (x-amz-meta-reason)' } },
        { code: 'delete_object(...)  # after copy', means: { en: 'a crash between the two leaves a duplicate, never a lost receipt', mr: 'दोघांच्या मध्ये crash झालं तर duplicate राहतो, पावती कधीच हरवत नाही' } },
        { code: 'assert files_in == moved + quarantined', means: { en: 'the reconciliation: every file is accounted for, or the run fails', mr: 'reconciliation: प्रत्येक file चा हिशोब, नाहीतर run fail' } },
      ],
      example: [
        { code: "plan('Receipt 2026-11-23 R-1004.csv', 120)", note: { en: '-> raw/receipts/dt=2026-11-23/R-1004.csv: spaces and capitals, still the right pigeonhole', mr: '-> raw/receipts/dt=2026-11-23/R-1004.csv: spaces आणि capitals, तरीही बरोबर कप्पा' } },
        { code: "plan('receipt_2026-11-31_R-1006.csv', 90)", note: { en: '-> (None, "bad date"): 31 November goes to the dead-letter tray', mr: '-> (None, "bad date"): 31 नोव्हेंबर dead-letter ट्रेमध्ये' } },
        { code: "plan('receipt_2026-11-23_R-1005.csv', 0)", note: { en: '-> (None, "empty file"): an empty envelope', mr: '-> (None, "empty file"): रिकामं पाकीट' } },
        { code: "copy_object(...); delete_object(...)", note: { en: 'into the pigeonhole first, crossed off the table second', mr: 'आधी कप्प्यात, मग टेबलावरून खोडणं' } },
        { code: "get_object(Bucket=LAKE, Key=key, VersionId=v['VersionId'])", note: { en: 'read an old carbon copy to check it is really clean', mr: 'जुनी carbon प्रत खरंच स्वच्छ आहे का ते वाचून पाहा' } },
        { code: "print(f'files in: {n} | moved: {m} | quarantined: {q}')", note: { en: 'the 4 a.m. count: received = sorted + dead letters', mr: 'पहाटे 4 ची मोजणी: आलेली = sort झालेली + dead letters' } },
      ],
      pitfall: { en: 'Delete-then-copy, or deleting before checking the copy worked, is how files vanish. Restoring "the previous version" without reading it can restore the Gremlin\'s second junk file. And "just make the bucket public so finance can see it" undoes the whole lesson before this one: share with presigned URLs or IAM roles instead.', mr: 'आधी delete मग copy, किंवा copy झाला का ते न पाहता delete करणं, हाच files गायब होण्याचा मार्ग. न वाचता "मागची version" restore केली तर Gremlin ची दुसरी कचरा file परत येऊ शकते. आणि "finance ला दिसावं म्हणून bucket public करा" म्हणजे मागचा पूर्ण धडा पुसणं: त्याऐवजी presigned URLs किंवा IAM roles ने share करा.' },
    },
    practice: {
      intro: { en: 'Four steps, two hints each. The AWS console panel shows both buckets after every run. Each step re-runs your code on hidden buckets: another night with new days and spaced keys, and an empty dump.', mr: 'चार पायऱ्या, प्रत्येकी दोन hints. प्रत्येक run नंतर AWS console panel दोन्ही buckets दाखवतो. प्रत्येक पायरी तुमचा code लपवलेल्या buckets वर पुन्हा चालवते: नवे दिवस आणि spaces असलेल्या keys ची दुसरी रात्र, आणि रिकामा dump.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'Plan before you touch anything. Rewrite plan(key, size) so it returns (target, None) or (None, reason). Use NAME.fullmatch(key); no match means "bad name". The date group must be a real date (datetime.strptime with %Y-%m-%d), else "bad date". Size 0 means "empty file". The target is raw/receipts/dt=<date>/<receipt id in capitals>.csv. Check in that order. The loop prints the plan for every file in chaicart-dump and the number of files seen. Hidden tests call plan with tricky names.', mr: 'काहीही हात लावण्याआधी plan करा. plan(key, size) असं पुन्हा लिहा की तो (target, None) किंवा (None, reason) परत देईल. NAME.fullmatch(key) वापरा; जुळलं नाही तर "bad name". तारखेचा group खरी तारीख हवी (%Y-%m-%d सह datetime.strptime), नाहीतर "bad date". Size 0 म्हणजे "empty file". target म्हणजे raw/receipts/dt=<date>/<capitals मध्ये receipt id>.csv. याच क्रमाने तपासा. loop chaicart-dump मधल्या प्रत्येक file चा plan आणि पाहिलेल्या files ची संख्या print करतो. लपवलेल्या tests अवघड नावांनी plan तपासतात.' },
          aws: lakeAws(DUMP_NIGHT1),
          starter: String.raw`${B_HEAD}
NAME = re.compile(r'receipt[ _](\d{4}-\d{2}-\d{2})[ _](R-\d+)\.csv', re.IGNORECASE)

def plan(key, size):
    # TODO: this only understands perfect keys like receipt_2026-11-22_R-1001.csv
    #       use NAME.fullmatch, check the date with datetime.strptime, quarantine empty files
    parts = key.replace('.csv', '').split('_')
    if len(parts) != 3:
        return None, 'bad name'
    return f'raw/receipts/dt={parts[1]}/{parts[2]}.csv', None
${B_LIST}
seen = list_objects(DUMP)
for obj in seen:
    target, reason = plan(obj['Key'], obj['Size'])
    print(obj['Key'], '->', target or f'quarantine ({reason})')
print('files seen:', len(seen))
`,
          solution: String.raw`${B_HEAD}${B_PLAN}${B_LIST}
seen = list_objects(DUMP)
for obj in seen:
    target, reason = plan(obj['Key'], obj['Size'])
    print(obj['Key'], '->', target or f'quarantine ({reason})')
print('files seen:', len(seen))
`,
          output: [
            'Receipt 2026-11-23 R-1004.csv -> raw/receipts/dt=2026-11-23/R-1004.csv',
            'gremlin_was_here.txt -> quarantine (bad name)',
            'receipt_2026-11-22_R-1001.csv -> raw/receipts/dt=2026-11-22/R-1001.csv',
            'receipt_2026-11-22_R-1002.csv -> raw/receipts/dt=2026-11-22/R-1002.csv',
            'receipt_2026-11-23_R-1003.csv -> raw/receipts/dt=2026-11-23/R-1003.csv',
            'receipt_2026-11-23_R-1005.csv -> quarantine (empty file)',
            'receipt_2026-11-31_R-1006.csv -> quarantine (bad date)',
            'files seen: 7',
          ],
          checks: [
            { expr: "plan('RECEIPT 2026-12-01 r-3001.csv', 50) == ('raw/receipts/dt=2026-12-01/R-3001.csv', None)", message: { en: 'plan("RECEIPT 2026-12-01 r-3001.csv", 50) should give ("raw/receipts/dt=2026-12-01/R-3001.csv", None): ignore case, write the id in capitals.', mr: 'plan("RECEIPT 2026-12-01 r-3001.csv", 50) ने ("raw/receipts/dt=2026-12-01/R-3001.csv", None) द्यायला हवं: case दुर्लक्षित करा, id capitals मध्ये लिहा.' } },
            { expr: "plan('receipt_2026-02-30_R-7.csv', 10) == (None, 'bad date')", message: { en: '30 February does not exist: plan should return (None, "bad date").', mr: '30 फेब्रुवारी अस्तित्वात नाही: plan ने (None, "bad date") द्यायला हवं.' } },
            { expr: "plan('receipt_2026-11-24_R-8.csv.bak', 10) == (None, 'bad name') and plan('old/receipt_2026-11-24_R-8.csv', 10) == (None, 'bad name')", message: { en: 'Only whole-key matches count: ".csv.bak" and a folder in front are bad names. Use fullmatch.', mr: 'फक्त पूर्ण key जुळली तरच: ".csv.bak" आणि पुढे folder म्हणजे bad name. fullmatch वापरा.' } },
            { expr: "plan('receipt_2026-11-31_R-9.csv', 0) == (None, 'bad date') and plan('notes.txt', 0) == (None, 'bad name')", message: { en: 'Check in order: name, then date, then size. A bad date with size 0 is still "bad date".', mr: 'क्रमाने तपासा: नाव, मग तारीख, मग size. size 0 असलेली अशक्य तारीखसुद्धा "bad date" च.' } },
          ],
          variants: [
            {
              label: { en: 'Another night: new days, a spaced key, capitals, a photo', mr: 'दुसरी रात्र: नवे दिवस, spaces असलेली key, capitals, एक फोटो' },
              aws: lakeAws(DUMP_NIGHT2),
              output: [
                'IMG_2201.jpg -> quarantine (bad name)',
                'RECEIPT_2026-11-25_r-2004.csv -> raw/receipts/dt=2026-11-25/R-2004.csv',
                'receipt 2026-11-24 R-2002.csv -> raw/receipts/dt=2026-11-24/R-2002.csv',
                'receipt_2026-11-24_R-2001.csv -> raw/receipts/dt=2026-11-24/R-2001.csv',
                'receipt_2026-11-24_R-2003.csv -> quarantine (empty file)',
                'files seen: 5',
              ],
            },
            {
              label: { en: 'An empty dump bucket', mr: 'रिकामा dump bucket' },
              aws: lakeAws({}),
              output: ['files seen: 0'],
            },
          ],
          hints: [
            { en: 'm = NAME.fullmatch(key); if not m: return None, "bad name". Then day, rid = m.group(1), m.group(2).upper(). Wrap datetime.strptime(day, "%Y-%m-%d") in try/except ValueError for "bad date", then check size == 0.', mr: 'm = NAME.fullmatch(key); if not m: return None, "bad name". मग day, rid = m.group(1), m.group(2).upper(). "bad date" साठी datetime.strptime(day, "%Y-%m-%d") ला try/except ValueError मध्ये ठेवा, मग size == 0 तपासा.' },
            { en: "    m = NAME.fullmatch(key)\n    if not m:\n        return None, 'bad name'\n    day, rid = m.group(1), m.group(2).upper()\n    try:\n        datetime.strptime(day, '%Y-%m-%d')\n    except ValueError:\n        return None, 'bad date'\n    if size == 0:\n        return None, 'empty file'\n    return f'raw/receipts/dt={day}/{rid}.csv', None", mr: "    m = NAME.fullmatch(key)\n    if not m:\n        return None, 'bad name'\n    day, rid = m.group(1), m.group(2).upper()\n    try:\n        datetime.strptime(day, '%Y-%m-%d')\n    except ValueError:\n        return None, 'bad date'\n    if size == 0:\n        return None, 'empty file'\n    return f'raw/receipts/dt={day}/{rid}.csv', None" },
          ],
          successLine: { en: 'Every letter has a pigeonhole or a slip saying why not. Nothing has moved yet, and that is the point.', mr: 'प्रत्येक पत्राला कप्पा आहे किंवा का नाही ते सांगणारी चिठ्ठी. अजून काहीच हललं नाही, आणि तोच मुद्दा आहे.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Now move. For every file in chaicart-dump: if plan gives a target, copy it to chaicart-lake at that key; otherwise copy it to chaicart-lake under "quarantine/" + the original key with Metadata {"reason": reason} and MetadataDirective "REPLACE". Use a CopySource dict. Only after the copy, delete the file from the dump. Count moved and quarantined, print "files in: N | moved: M | quarantined: Q", and assert files in == moved + quarantined.', mr: 'आता हलवा. chaicart-dump मधल्या प्रत्येक file साठी: plan target देत असेल तर ती chaicart-lake मध्ये त्या key वर copy करा; नाहीतर chaicart-lake मध्ये "quarantine/" + मूळ key खाली Metadata {"reason": reason} आणि MetadataDirective "REPLACE" सह copy करा. CopySource dict वापरा. copy नंतरच dump मधून file delete करा. moved आणि quarantined मोजा, "files in: N | moved: M | quarantined: Q" print करा, आणि files in == moved + quarantined assert करा.' },
          aws: lakeAws(DUMP_NIGHT1),
          starter: String.raw`${B_HEAD}${B_PLAN}${B_LIST}
files_in = list_objects(DUMP)
moved = quarantined = 0
for obj in files_in:
    key = obj['Key']
    target, reason = plan(key, obj['Size'])
    # TODO: copy to LAKE (target, or 'quarantine/' + key with the reason as metadata)
    # TODO: then delete the file from DUMP, and count it

print(f'files in: {len(files_in)} | moved: {moved} | quarantined: {quarantined}')
# TODO: assert the reconciliation
`,
          solution: String.raw`${B_HEAD}${B_PLAN}${B_LIST}${B_MOVE}
files_in, moved, quarantined = move_all()
print(f'files in: {files_in} | moved: {moved} | quarantined: {quarantined}')
assert files_in == moved + quarantined, 'a file went missing'
`,
          output: ['files in: 7 | moved: 4 | quarantined: 3'],
          checks: [
            { expr: "s3_keys('chaicart-dump') == []", message: { en: 'chaicart-dump should be empty after the move: delete each file after copying it.', mr: 'move नंतर chaicart-dump रिकामा हवा: प्रत्येक file copy केल्यानंतर delete करा.' } },
            { expr: `s3_keys('chaicart-lake', 'raw/') == ${pyList(NIGHT1_RAW)}`, message: { en: 'The four good receipts should be under raw/receipts/dt=YYYY-MM-DD/R-ID.csv in chaicart-lake.', mr: 'चार चांगल्या पावत्या chaicart-lake मध्ये raw/receipts/dt=YYYY-MM-DD/R-ID.csv खाली हव्यात.' } },
            { expr: `s3_keys('chaicart-lake', 'quarantine/') == ${pyList(NIGHT1_Q)}`, message: { en: 'The three bad files should be under quarantine/ with their original names.', mr: 'तीन खराब files आपल्या मूळ नावांनी quarantine/ खाली हव्यात.' } },
            { expr: "s3_bucket('chaicart-lake')['objects']['quarantine/receipt_2026-11-31_R-1006.csv'][-1]['meta'] == {'reason': 'bad date'}", message: { en: 'Quarantined files need their reason as metadata: Metadata={"reason": reason}, MetadataDirective="REPLACE".', mr: 'quarantine झालेल्या files ना त्यांचं कारण metadata म्हणून हवं: Metadata={"reason": reason}, MetadataDirective="REPLACE".' } },
            { expr: "'poha' in s3_text('chaicart-lake', 'raw/receipts/dt=2026-11-23/R-1004.csv')", message: { en: 'The receipt with spaces in its key (R-1004, poha) should arrive with its content.', mr: 'key मध्ये spaces असलेली पावती (R-1004, poha) तिच्या मजकुरासह पोहोचायला हवी.' } },
            { expr: COPY_BEFORE_DELETE, message: { en: 'Every file must be copied before it is deleted from the dump.', mr: 'प्रत्येक file dump मधून delete होण्याआधी copy व्हायला हवी.' } },
          ],
          variants: [
            {
              label: { en: 'Another night: new days, a spaced key, capitals, a photo', mr: 'दुसरी रात्र: नवे दिवस, spaces असलेली key, capitals, एक फोटो' },
              aws: lakeAws(DUMP_NIGHT2),
              output: ['files in: 5 | moved: 3 | quarantined: 2'],
              checks: [
                { expr: `s3_keys('chaicart-dump') == [] and s3_keys('chaicart-lake', 'raw/') == ${pyList(NIGHT2_RAW)} and s3_keys('chaicart-lake', 'quarantine/') == ${pyList(NIGHT2_Q)}`, message: { en: 'On the hidden night, receipts and quarantine files did not land in the right keys.', mr: 'लपवलेल्या रात्री पावत्या आणि quarantine files बरोबर keys मध्ये पोहोचल्या नाहीत.' } },
                { expr: "'misal pav' in s3_text('chaicart-lake', 'raw/receipts/dt=2026-11-24/R-2002.csv')", message: { en: 'The spaced key "receipt 2026-11-24 R-2002.csv" should land with its content.', mr: 'spaces असलेली key "receipt 2026-11-24 R-2002.csv" तिच्या मजकुरासह पोहोचायला हवी.' } },
              ],
            },
            {
              label: { en: 'An empty dump bucket', mr: 'रिकामा dump bucket' },
              aws: lakeAws({}),
              output: ['files in: 0 | moved: 0 | quarantined: 0'],
              checks: [{ expr: "s3_keys('chaicart-lake', 'raw/') == [] and s3_keys('chaicart-lake', 'quarantine/') == []", message: { en: 'An empty dump means nothing to move.', mr: 'रिकामा dump म्हणजे हलवायला काहीच नाही.' } }],
            },
          ],
          mustUse: [{ pattern: 'assert', message: { en: 'Assert the reconciliation: files in == moved + quarantined.', mr: 'reconciliation assert करा: files in == moved + quarantined.' } }],
          hints: [
            { en: "source = {'Bucket': DUMP, 'Key': key}. Good: s3.copy_object(Bucket=LAKE, Key=target, CopySource=source). Bad: the same with Key='quarantine/' + key, Metadata={'reason': reason}, MetadataDirective='REPLACE'. Then s3.delete_object(Bucket=DUMP, Key=key).", mr: "source = {'Bucket': DUMP, 'Key': key}. चांगली: s3.copy_object(Bucket=LAKE, Key=target, CopySource=source). खराब: तेच, Key='quarantine/' + key, Metadata={'reason': reason}, MetadataDirective='REPLACE' सह. मग s3.delete_object(Bucket=DUMP, Key=key)." },
            { en: "    source = {'Bucket': DUMP, 'Key': key}\n    if target:\n        s3.copy_object(Bucket=LAKE, Key=target, CopySource=source)\n        moved += 1\n    else:\n        s3.copy_object(Bucket=LAKE, Key='quarantine/' + key, CopySource=source,\n                       Metadata={'reason': reason}, MetadataDirective='REPLACE')\n        quarantined += 1\n    s3.delete_object(Bucket=DUMP, Key=key)\n\nassert len(files_in) == moved + quarantined", mr: "    source = {'Bucket': DUMP, 'Key': key}\n    if target:\n        s3.copy_object(Bucket=LAKE, Key=target, CopySource=source)\n        moved += 1\n    else:\n        s3.copy_object(Bucket=LAKE, Key='quarantine/' + key, CopySource=source,\n                       Metadata={'reason': reason}, MetadataDirective='REPLACE')\n        quarantined += 1\n    s3.delete_object(Bucket=DUMP, Key=key)\n\nassert len(files_in) == moved + quarantined" },
          ],
          successLine: { en: 'Seven in, four sorted, three in the dead-letter tray with a slip. The table is clear.', mr: 'सात आल्या, चार sort झाल्या, तीन चिठ्ठीसह dead-letter ट्रेमध्ये. टेबल रिकामं.' },
        },
        {
          kind: 'python',
          prompt: { en: 'The Gremlin overwrote every curated totals file twice: first with "lol", then with a header-only file that looks real. Fix looks_valid(text): the first line must be "date,orders,amount" AND there must be at least one data row. Fix recover(bucket, key): instead of blindly restoring the second newest version, walk the older versions newest first, read each with get_object(..., VersionId=...), and copy the first one that looks valid back on top. Return its VersionId (or None). A hidden lake has two curated files.', mr: 'Gremlin ने प्रत्येक curated totals file दोनदा overwrite केली: आधी "lol" ने, मग खऱ्यासारख्या दिसणाऱ्या फक्त-header file ने. looks_valid(text) दुरुस्त करा: पहिली ओळ "date,orders,amount" हवी आणि किमान एक data row हवी. recover(bucket, key) दुरुस्त करा: दुसरी सर्वात नवी version डोळे झाकून restore करण्याऐवजी जुन्या versions सर्वात नवी आधी अशा पाहा, प्रत्येक get_object(..., VersionId=...) ने वाचा, आणि वैध दिसणारी पहिली version वर copy करा. तिचा VersionId परत द्या (किंवा None). लपवलेल्या lake मध्ये दोन curated files आहेत.' },
          aws: lakeAws({}),
          starter: String.raw`${B_HEAD}${B_LIST}${B_GREMLIN}
def looks_valid(text):
    # TODO: header 'date,orders,amount' AND at least one data row
    return text.startswith('date,orders,amount')

def recover(bucket, key):
    resp = s3.list_object_versions(Bucket=bucket, Prefix=key)
    versions = [v for v in resp.get('Versions', []) if v['Key'] == key]
    versions.sort(key=lambda v: v['LastModified'], reverse=True)
    # TODO: do not trust versions[1] blindly: read each older version and restore the first valid one
    old = versions[1]['VersionId']
    s3.copy_object(Bucket=bucket, Key=key, CopySource={'Bucket': bucket, 'Key': key, 'VersionId': old})
    return old

for obj in list_objects(LAKE, 'curated/'):
    print(f"{obj['Key']}: restored from version {recover(LAKE, obj['Key'])}")
`,
          solution: String.raw`${B_HEAD}${B_LIST}${B_GREMLIN}${B_RECOVER}
for obj in list_objects(LAKE, 'curated/'):
    print(f"{obj['Key']}: restored from version {recover(LAKE, obj['Key'])}")
`,
          output: [`${T21}: restored from version null`],
          checks: [
            { expr: `'18650' in s3_text('chaicart-lake', '${T21}')`, message: { en: 'The totals file should hold the real numbers again (18650), not "lol" or a bare header.', mr: 'totals file मध्ये पुन्हा खरे आकडे (18650) हवेत, "lol" किंवा फक्त header नाही.' } },
            { expr: `s3_versions('chaicart-lake', '${T21}') == 4`, message: { en: 'Expected 4 versions: the original, two Gremlin versions and your restored copy. Never delete history to restore.', mr: '4 versions अपेक्षित: मूळ, Gremlin च्या दोन, आणि तुमची restored copy. restore साठी इतिहास कधीच delete करू नका.' } },
            { expr: "looks_valid('date,orders,amount\\n') is False and looks_valid('date,orders,amount\\n2026-11-21,1,2\\n') is True and looks_valid('lol') is False", message: { en: 'looks_valid needs the header AND at least one data row.', mr: 'looks_valid ला header आणि किमान एक data row दोन्ही हवेत.' } },
          ],
          variants: [
            {
              label: { en: 'Two curated files overwritten', mr: 'दोन curated files overwrite झालेल्या' },
              aws: lakeAws({}, { [T20]: TOTALS_20, [T21]: TOTALS_21 }),
              output: [`${T20}: restored from version null`, `${T21}: restored from version null`],
              checks: [
                { expr: `'17210' in s3_text('chaicart-lake', '${T20}') and '18650' in s3_text('chaicart-lake', '${T21}')`, message: { en: 'Each curated file should get its own original numbers back.', mr: 'प्रत्येक curated file ला आपापले मूळ आकडे परत मिळायला हवेत.' } },
              ],
            },
          ],
          hints: [
            { en: 'lines = text.strip().splitlines(); valid when len(lines) >= 2 and lines[0] == "date,orders,amount". In recover, loop over versions[1:], read s3.get_object(Bucket=bucket, Key=key, VersionId=v["VersionId"])["Body"].read().decode("utf-8"), and stop at the first valid one.', mr: 'lines = text.strip().splitlines(); len(lines) >= 2 आणि lines[0] == "date,orders,amount" असेल तर valid. recover मध्ये versions[1:] वर loop करा, s3.get_object(Bucket=bucket, Key=key, VersionId=v["VersionId"])["Body"].read().decode("utf-8") वाचा, आणि पहिल्या वैध version वर थांबा.' },
            { en: "    for v in versions[1:]:\n        body = s3.get_object(Bucket=bucket, Key=key, VersionId=v['VersionId'])['Body'].read().decode('utf-8')\n        if looks_valid(body):\n            s3.copy_object(Bucket=bucket, Key=key,\n                           CopySource={'Bucket': bucket, 'Key': key, 'VersionId': v['VersionId']})\n            return v['VersionId']\n    return None", mr: "    for v in versions[1:]:\n        body = s3.get_object(Bucket=bucket, Key=key, VersionId=v['VersionId'])['Body'].read().decode('utf-8')\n        if looks_valid(body):\n            s3.copy_object(Bucket=bucket, Key=key,\n                           CopySource={'Bucket': bucket, 'Key': key, 'VersionId': v['VersionId']})\n            return v['VersionId']\n    return None" },
          ],
          successLine: { en: 'The fake header did not fool you. The real totals are back, and both junk versions stay as evidence.', mr: 'खोट्या header ने तुला फसवलं नाही. खरे totals परत आले, आणि दोन्ही कचरा versions पुरावा म्हणून राहिल्या.' },
        },
        {
          kind: 'python',
          prompt: { en: 'The final night: everything in one run. plan, move_all, recover and the Gremlin replay are ready. Write lock_down(bucket): put_public_access_block with all four settings True, then a lifecycle configuration with two rules. "raw-gets-colder" for raw/: STANDARD_IA at 30 days, GLACIER at 90, NoncurrentVersionExpiration after 30 days, AbortIncompleteMultipartUpload after 7. "quarantine-cleanup" for quarantine/: expire after 30 days. Raw receipts never expire (they are the source of truth). The run then moves, reconciles, recovers and prints. Hidden buckets: another night and an empty dump.', mr: 'शेवटची रात्र: सगळं एकाच run मध्ये. plan, move_all, recover आणि Gremlin replay तयार आहेत. lock_down(bucket) लिहा: चारही settings True ठेवून put_public_access_block, मग दोन rules असलेलं lifecycle configuration. raw/ साठी "raw-gets-colder": 30 दिवसांनी STANDARD_IA, 90 ला GLACIER, 30 दिवसांनी NoncurrentVersionExpiration, 7 नंतर AbortIncompleteMultipartUpload. quarantine/ साठी "quarantine-cleanup": 30 दिवसांनी expire. raw पावत्या कधीच expire होत नाहीत (त्या source of truth आहेत). मग run हलवतो, जुळवतो, परत आणतो आणि print करतो. लपवलेले buckets: दुसरी रात्र आणि रिकामा dump.' },
          aws: lakeAws(DUMP_NIGHT1),
          starter: String.raw`${B_HEAD}${B_PLAN}${B_LIST}${B_MOVE}${B_RECOVER}
def lock_down(bucket):
    # TODO: Block Public Access, all four settings True
    # TODO: lifecycle rules 'raw-gets-colder' (raw/) and 'quarantine-cleanup' (quarantine/)
    rules = s3.get_bucket_lifecycle_configuration(Bucket=bucket)['Rules']
    print(f'lake locked: public access blocked, {len(rules)} lifecycle rules')
${B_GREMLIN}${B_FINAL_RUN}`,
          solution: String.raw`${B_HEAD}${B_PLAN}${B_LIST}${B_MOVE}${B_RECOVER}${B_LOCK}${B_GREMLIN}${B_FINAL_RUN}`,
          output: ['lake locked: public access blocked, 2 lifecycle rules', 'files in: 7 | moved: 4 | quarantined: 3', 'restored: 1'],
          checks: [
            { expr: "all(s3_bucket('chaicart-lake')['public_block'].values()) and 'PutPublicAccessBlock chaicart-lake' in api_calls", message: { en: 'lock_down should call put_public_access_block with all four settings True.', mr: 'lock_down ने चारही settings True ठेवून put_public_access_block call करायला हवं.' } },
            { expr: "[storage_class_after('chaicart-lake', 'raw/receipts/dt=2026-11-22/R-1001.csv', d) for d in (10, 45, 100, 2000)] == ['STANDARD', 'STANDARD_IA', 'GLACIER', 'GLACIER']", message: { en: 'Raw receipts: STANDARD, then STANDARD_IA at 30 days, GLACIER at 90, and never expired.', mr: 'raw पावत्या: STANDARD, मग 30 दिवसांनी STANDARD_IA, 90 ला GLACIER, आणि कधीच expire नाहीत.' } },
            { expr: "storage_class_after('chaicart-lake', 'quarantine/gremlin_was_here.txt', 29) == 'STANDARD' and storage_class_after('chaicart-lake', 'quarantine/gremlin_was_here.txt', 31) == 'EXPIRED'", message: { en: 'quarantine/ should expire after 30 days.', mr: 'quarantine/ 30 दिवसांनी expire व्हायला हवा.' } },
            { expr: `storage_class_after('chaicart-lake', '${T21}', 400) == 'STANDARD'`, message: { en: 'curated/ must not be touched by the lifecycle rules.', mr: 'curated/ ला lifecycle rules नी हात लावू नये.' } },
            { expr: "[r for r in s3_bucket('chaicart-lake')['lifecycle'] if r.get('ID') == 'raw-gets-colder'][0].get('NoncurrentVersionExpiration', {}).get('NoncurrentDays') == 30", message: { en: 'raw-gets-colder needs NoncurrentVersionExpiration with NoncurrentDays 30.', mr: 'raw-gets-colder ला NoncurrentDays 30 सह NoncurrentVersionExpiration हवं.' } },
            { expr: `s3_keys('chaicart-dump') == [] and s3_keys('chaicart-lake', 'raw/') == ${pyList(NIGHT1_RAW)} and '18650' in s3_text('chaicart-lake', '${T21}')`, message: { en: 'The full run should empty the dump, fill raw/ and restore the totals.', mr: 'पूर्ण run ने dump रिकामा करावा, raw/ भरावा आणि totals परत आणावेत.' } },
          ],
          variants: [
            {
              label: { en: 'Another night with two curated files', mr: 'दोन curated files असलेली दुसरी रात्र' },
              aws: lakeAws(DUMP_NIGHT2, { [T20]: TOTALS_20, [T21]: TOTALS_21 }),
              output: ['lake locked: public access blocked, 2 lifecycle rules', 'files in: 5 | moved: 3 | quarantined: 2', 'restored: 2'],
              checks: [
                { expr: `s3_keys('chaicart-lake', 'raw/') == ${pyList(NIGHT2_RAW)} and s3_keys('chaicart-lake', 'quarantine/') == ${pyList(NIGHT2_Q)} and storage_class_after('chaicart-lake', 'quarantine/IMG_2201.jpg', 31) == 'EXPIRED'`, message: { en: 'On the hidden night the files or the lifecycle rules are not right.', mr: 'लपवलेल्या रात्री files किंवा lifecycle rules बरोबर नाहीत.' } },
              ],
            },
            {
              label: { en: 'An empty dump bucket', mr: 'रिकामा dump bucket' },
              aws: lakeAws({}),
              output: ['lake locked: public access blocked, 2 lifecycle rules', 'files in: 0 | moved: 0 | quarantined: 0', 'restored: 1'],
              checks: [
                { expr: "all(s3_bucket('chaicart-lake')['public_block'].values()) and len(s3_bucket('chaicart-lake')['lifecycle']) == 2", message: { en: 'Even with nothing to move, the lake must be locked down.', mr: 'हलवायला काहीच नसलं तरी lake बंदोबस्तात हवा.' } },
              ],
            },
          ],
          hints: [
            { en: "Block Public Access: s3.put_public_access_block(Bucket=bucket, PublicAccessBlockConfiguration={'BlockPublicAcls': True, 'IgnorePublicAcls': True, 'BlockPublicPolicy': True, 'RestrictPublicBuckets': True}). Lifecycle: s3.put_bucket_lifecycle_configuration(Bucket=bucket, LifecycleConfiguration={'Rules': [rule1, rule2]}), each rule with ID, Filter {'Prefix': ...}, Status 'Enabled' and its actions.", mr: "Block Public Access: s3.put_public_access_block(Bucket=bucket, PublicAccessBlockConfiguration={'BlockPublicAcls': True, 'IgnorePublicAcls': True, 'BlockPublicPolicy': True, 'RestrictPublicBuckets': True}). Lifecycle: s3.put_bucket_lifecycle_configuration(Bucket=bucket, LifecycleConfiguration={'Rules': [rule1, rule2]}), प्रत्येक rule मध्ये ID, Filter {'Prefix': ...}, Status 'Enabled' आणि त्याच्या actions." },
            { en: "    s3.put_bucket_lifecycle_configuration(Bucket=bucket, LifecycleConfiguration={'Rules': [\n        {'ID': 'raw-gets-colder', 'Filter': {'Prefix': 'raw/'}, 'Status': 'Enabled',\n         'Transitions': [{'Days': 30, 'StorageClass': 'STANDARD_IA'}, {'Days': 90, 'StorageClass': 'GLACIER'}],\n         'NoncurrentVersionExpiration': {'NoncurrentDays': 30},\n         'AbortIncompleteMultipartUpload': {'DaysAfterInitiation': 7}},\n        {'ID': 'quarantine-cleanup', 'Filter': {'Prefix': 'quarantine/'}, 'Status': 'Enabled',\n         'Expiration': {'Days': 30}},\n    ]})", mr: "    s3.put_bucket_lifecycle_configuration(Bucket=bucket, LifecycleConfiguration={'Rules': [\n        {'ID': 'raw-gets-colder', 'Filter': {'Prefix': 'raw/'}, 'Status': 'Enabled',\n         'Transitions': [{'Days': 30, 'StorageClass': 'STANDARD_IA'}, {'Days': 90, 'StorageClass': 'GLACIER'}],\n         'NoncurrentVersionExpiration': {'NoncurrentDays': 30},\n         'AbortIncompleteMultipartUpload': {'DaysAfterInitiation': 7}},\n        {'ID': 'quarantine-cleanup', 'Filter': {'Prefix': 'quarantine/'}, 'Status': 'Enabled',\n         'Expiration': {'Days': 30}},\n    ]})" },
          ],
          successLine: { en: 'Final hit. Seven in, seven accounted for, the totals restored, the lake locked. The Lake of Receipts is clean.', mr: 'शेवटचा घाव. सात आल्या, सातींचा हिशोब, totals परत, lake बंदोबस्तात. पावत्यांचं तळं स्वच्छ झालं.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'You need to "rename" 10,000 receipts in S3. What is the safe way?', mr: 'तुम्हाला S3 मधल्या 10,000 पावत्या "rename" करायच्या आहेत. सुरक्षित मार्ग कोणता?' },
        options: [
          { en: 'Call s3.rename_object for each key', mr: 'प्रत्येक key साठी s3.rename_object call करा' },
          { en: 'Delete each old key, then upload it under the new name', mr: 'प्रत्येक जुनी key delete करा, मग नव्या नावाने upload करा' },
          { en: 'Change the bucket name instead', mr: 'त्याऐवजी bucket चं नाव बदला' },
          { en: 'Copy each object to its new key first, delete the old key only after the copy succeeded, and reconcile the counts at the end', mr: 'आधी प्रत्येक object नव्या key वर copy करा, copy यशस्वी झाल्यावरच जुनी key delete करा, आणि शेवटी आकडे जुळवा' },
        ],
        answer: 3,
        explain: { en: 'S3 has no rename API (and bucket names cannot be changed). Copy-then-delete means a crash leaves a duplicate you can clean up, never a missing receipt. The reconciliation proves nothing was lost.', mr: 'S3 मध्ये rename API नाही (आणि bucket चं नाव बदलता येत नाही). आधी copy मग delete म्हणजे crash झालं तर साफ करता येणारा duplicate राहतो, हरवलेली पावती कधीच नाही. reconciliation काहीच हरवलं नाही हे सिद्ध करतं.' },
      },
      {
        q: { en: 'What does plan() return for these keys (sizes in brackets)?', mr: 'या keys साठी plan() काय परत देतो (कंसात sizes)?' },
        code: `plan('receipt_2026-11-24_R-5.csv', 0)
plan('receipt 2026-11-24 r-6.csv', 80)
plan('receipt_2026-11-24_R-7.csv.tmp', 80)`,
        options: [
          { en: 'Three targets, because all three contain a date', mr: 'तीन targets, कारण तिघांमध्येही तारीख आहे' },
          { en: '(None, "empty file"), ("raw/receipts/dt=2026-11-24/R-6.csv", None), (None, "bad name")', mr: '(None, "empty file"), ("raw/receipts/dt=2026-11-24/R-6.csv", None), (None, "bad name")' },
          { en: '(None, "bad name") for all three', mr: 'तिघांसाठी (None, "bad name")' },
          { en: 'An error on the second key because of the spaces', mr: 'spaces मुळे दुसऱ्या key वर error' },
        ],
        answer: 1,
        explain: { en: 'The first matches but is empty. The second matches thanks to [ _] and re.IGNORECASE, and the id is written in capitals. The third fails fullmatch because of ".tmp" at the end.', mr: 'पहिली जुळते पण रिकामी आहे. दुसरी [ _] आणि re.IGNORECASE मुळे जुळते, आणि id capitals मध्ये लिहिला जातो. तिसरी शेवटच्या ".tmp" मुळे fullmatch मध्ये fail होते.' },
      },
      {
        q: { en: 'The totals file has versions (newest first): a header-only file, "lol", the original. Which version should recover() bring back, and why?', mr: 'totals file च्या versions (सर्वात नवी आधी): फक्त-header file, "lol", मूळ. recover() ने कोणती version परत आणावी, आणि का?' },
        options: [
          { en: 'The original: it is the newest version whose content passes validation (header plus at least one data row)', mr: 'मूळ: ज्याचा मजकूर validation पास करतो (header अधिक किमान एक data row) अशी ती सर्वात नवी version' },
          { en: '"lol", because it is the previous version', mr: '"lol", कारण ती मागची version आहे' },
          { en: 'The header-only file, because it has the right header', mr: 'फक्त-header file, कारण तिला बरोबर header आहे' },
          { en: 'None: delete all versions and ask finance to send the file again', mr: 'कोणतीच नाही: सगळ्या versions delete करा आणि finance ला file पुन्हा पाठवायला सांगा' },
        ],
        answer: 0,
        explain: { en: 'Choosing by position ("the previous one") restores junk. Read each older version and validate the content, then copy the first good one on top so history stays intact.', mr: 'जागेवरून निवडलं ("मागची") तर कचरा परत येतो. प्रत्येक जुनी version वाचा आणि मजकूर तपासा, मग पहिली चांगली वर copy करा म्हणजे इतिहास शाबूत राहतो.' },
      },
      {
        q: { en: 'Why does the run assert files_in == moved + quarantined instead of only printing the numbers?', mr: 'run फक्त आकडे print न करता files_in == moved + quarantined assert का करतो?' },
        options: [
          { en: 'Because print does not work inside a loop', mr: 'कारण loop मध्ये print चालत नाही' },
          { en: 'Assert makes the run faster', mr: 'assert ने run जलद होतो' },
          { en: 'If a file slipped through (a skipped branch, a swallowed error), the run fails loudly instead of silently losing a receipt that finance needs', mr: 'एखादी file निसटली (सोडलेली branch, गिळलेला error) तर run गुपचूप finance ला हवी असलेली पावती गमावण्याऐवजी मोठ्याने fail होतो' },
          { en: 'S3 requires an assert after copy_object', mr: 'copy_object नंतर S3 ला assert लागतो' },
        ],
        answer: 2,
        explain: { en: 'Nobody reads logs at 3 a.m. A failed assertion turns a quiet data loss into an alert, exactly like the post office supervisor who does not let anyone leave until the count matches.', mr: 'रात्री 3 वाजता कोणी logs वाचत नाही. fail झालेला assert शांत data loss चं alert मध्ये रूपांतर करतो, अगदी मोजणी जुळेपर्यंत कोणालाही जाऊ न देणाऱ्या टपाल कार्यालयाच्या supervisor सारखं.' },
      },
    ],
    recap: { line: { en: 'Plan with a pure function, copy then delete, quarantine with a reason, recover the newest valid version, lock the lake with Block Public Access and lifecycle, and assert files in = moved + quarantined.', mr: 'शुद्ध function ने plan करा, आधी copy मग delete, कारणासह quarantine, सर्वात नवी वैध version परत आणा, Block Public Access आणि lifecycle ने lake बंदोबस्तात ठेवा, आणि files in = moved + quarantined assert करा.' }, icon: '🏞️' },
    interview: [
      {
        q: { en: 'How would you organise daily receipt files in an S3 data lake?', mr: 'S3 data lake मध्ये रोजच्या पावत्यांच्या files कशा मांडाल?' },
        a: { en: 'Separate zones by prefix or bucket: raw (exactly what arrived, never edited), clean or curated (validated, often Parquet), and quarantine for files that failed checks. Inside raw I use Hive-style partitions like raw/receipts/dt=2026-11-23/R-1004.csv, so Athena, Glue and Spark can prune by date instead of scanning everything. Keys are deterministic, so re-running a day overwrites the same keys instead of creating duplicates. Each zone gets its own lifecycle rule and IAM permissions: writers of raw cannot touch curated, and dashboards only read curated. At ChaiCart that turned one flat heap into folders finance can query by day. Gotcha: avoid too many tiny files per partition; compact them.', mr: 'prefix किंवा bucket ने zones वेगळे करते: raw (जसं आलं तसं, कधीच न बदललेलं), clean किंवा curated (तपासलेलं, बहुतेक Parquet), आणि checks मध्ये fail झालेल्या files साठी quarantine. raw च्या आत raw/receipts/dt=2026-11-23/R-1004.csv सारखे Hive-style partitions वापरते, म्हणजे Athena, Glue आणि Spark सगळं scan न करता तारखेने prune करू शकतात. keys ठरलेल्या असतात, म्हणून एखादा दिवस पुन्हा चालवला तर duplicates न बनता त्याच keys overwrite होतात. प्रत्येक zone ला स्वतःचा lifecycle rule आणि IAM परवानग्या: raw मध्ये लिहिणारे curated ला हात लावू शकत नाहीत, आणि dashboards फक्त curated वाचतात. ChaiCart मध्ये त्याने एका सपाट ढिगाचे finance दिवसानुसार query करू शकेल असे folders झाले. गोम: एका partition मध्ये खूप लहान files टाळा; त्या compact करा.' },
      },
      {
        q: { en: 'S3 has no rename. How do you move or rename objects safely, and what about large files?', mr: 'S3 मध्ये rename नाही. objects सुरक्षितपणे कसे हलवता किंवा rename करता, आणि मोठ्या files चं काय?' },
        a: { en: 'A move is CopyObject to the new key followed by DeleteObject of the old key, in that order, so a failure leaves a duplicate rather than a loss. I pass CopySource as a dict so keys with spaces and special characters need no manual encoding. A single CopyObject handles up to 5 GB; above that it must be a multipart copy with UploadPartCopy, which boto3\'s managed copy() does automatically. Copies inside one Region have no transfer cost but each copy and delete is a request, so millions of objects cost money and time; for very large migrations S3 Batch Operations is the tool. At the end I reconcile counts, and for critical data compare sizes or checksums.', mr: 'move म्हणजे नव्या key वर CopyObject आणि त्यानंतर जुन्या key चा DeleteObject, याच क्रमाने, म्हणजे बिघाड झाला तर तोटा न होता duplicate राहतो. CopySource मी dict म्हणून देते म्हणजे spaces आणि विशेष अक्षरं असलेल्या keys हाताने encode कराव्या लागत नाहीत. एक CopyObject 5 GB पर्यंत हाताळतो; त्यापेक्षा मोठ्यासाठी UploadPartCopy ने multipart copy लागतो, जो boto3 चा managed copy() आपोआप करतो. एकाच Region मधल्या copies ना transfer खर्च नसतो पण प्रत्येक copy आणि delete ही एक request असते, म्हणून लाखो objects ला पैसे आणि वेळ लागतो; खूप मोठ्या migrations साठी S3 Batch Operations हे साधन. शेवटी आकडे जुळवते, आणि महत्त्वाच्या data साठी sizes किंवा checksums तुलना करते.' },
      },
      {
        q: { en: 'How do you prove a file migration or reorganisation lost nothing?', mr: 'file migration किंवा पुनर्रचनेत काहीच हरवलं नाही हे कसं सिद्ध करता?' },
        a: { en: 'Reconciliation, the same way a tester checks totals. Before the job I list the source (with a paginator, because one list call returns at most 1,000 keys) and record the count and total size. After it, files in must equal files moved plus files quarantined, and I assert that so the job fails loudly. For stronger proof I compare sizes per key, or checksums S3 can store and verify for each object; S3 Inventory reports help for millions of objects. I also check the source is empty only for files that were successfully copied. At ChaiCart the run prints "files in: 7 | moved: 4 | quarantined: 3" and the assert guards it.', mr: 'Reconciliation, tester जसे totals तपासतो तसंच. job आधी source list करते (paginator ने, कारण एक list call जास्तीत जास्त 1,000 keys देतो) आणि count आणि एकूण size नोंदवते. नंतर files in = हलवलेल्या files + quarantine झालेल्या files हवं, आणि ते assert करते म्हणजे job मोठ्याने fail होतो. जास्त पक्क्या पुराव्यासाठी प्रत्येक key ची size तुलना करते, किंवा प्रत्येक object साठी S3 साठवू आणि तपासू शकतो ते checksums; लाखो objects साठी S3 Inventory reports मदत करतात. source मधून फक्त यशस्वीपणे copy झालेल्याच files गेल्या आहेत हेही तपासते. ChaiCart मध्ये run "files in: 7 | moved: 4 | quarantined: 3" print करतो आणि assert त्याचं रक्षण करतो.' },
      },
      {
        q: { en: 'A curated file was overwritten, maybe more than once. How do you restore the right version?', mr: 'एक curated file overwrite झाली, कदाचित एकापेक्षा जास्त वेळा. योग्य version कशी परत आणता?' },
        a: { en: 'With versioning on, I list the versions of that exact key, sorted newest first, and I do not assume the previous one is good. I read each older version with GetObject and a VersionId, validate it (expected header, at least one row, maybe a row count or checksum), and copy the first valid version back on top with CopyObject. Copying keeps the bad versions in history as evidence for the incident report. Then I find the root cause: CloudTrail shows which principal wrote those PutObjects, and I tighten that role\'s permissions. In the ChaiCart case the second junk version even had the correct header, which is exactly why content validation matters.', mr: 'versioning चालू असताना मी त्या नेमक्या key च्या versions सर्वात नवी आधी अशा list करते, आणि मागची चांगलीच असेल असं गृहीत धरत नाही. प्रत्येक जुनी version GetObject आणि VersionId ने वाचते, तपासते (अपेक्षित header, किमान एक row, कदाचित row count किंवा checksum), आणि पहिली वैध version CopyObject ने वर copy करते. copy केल्याने बिघडलेल्या versions incident report साठी पुरावा म्हणून इतिहासात राहतात. मग मूळ कारण शोधते: ते PutObjects कोणत्या principal ने लिहिले ते CloudTrail दाखवतो, आणि त्या role च्या परवानग्या कडक करते. ChaiCart प्रकरणात दुसऱ्या कचरा version ला बरोबर header सुद्धा होता, म्हणूनच मजकुराची तपासणी महत्त्वाची.' },
      },
      {
        q: { en: 'Bad input files arrive. Do you delete them, skip them, or quarantine them?', mr: 'खराब input files येतात. त्या delete करता, सोडून देता, की quarantine करता?' },
        a: { en: 'Quarantine. Deleting destroys evidence, and skipping leaves them mixed with good data where the next run trips on them again. I copy each bad file to a quarantine/ prefix with the reason (as metadata or a tag), remove it from the landing area, and count it in the reconciliation. Someone can then fix it at the source and re-drop it. A lifecycle rule expires quarantine after, say, 30 days so it does not grow forever, and a metric or alert fires when the quarantine count jumps. For ChaiCart, an empty receipt or "31 November" lands in quarantine with "empty file" or "bad date".', mr: 'Quarantine. delete केल्याने पुरावा नष्ट होतो, आणि सोडून दिलं तर त्या चांगल्या data मध्येच मिसळून राहतात आणि पुढचा run पुन्हा त्यांच्यावर अडखळतो. मी प्रत्येक खराब file कारणासह (metadata किंवा tag म्हणून) quarantine/ prefix मध्ये copy करते, landing area मधून काढते, आणि reconciliation मध्ये मोजते. मग कोणी source कडे ती दुरुस्त करून पुन्हा टाकू शकतं. quarantine कायम वाढू नये म्हणून lifecycle rule तो, उदा. 30 दिवसांनी, expire करतो, आणि quarantine चा आकडा अचानक वाढला की metric किंवा alert येतो. ChaiCart मध्ये रिकामी पावती किंवा "31 नोव्हेंबर" "empty file" किंवा "bad date" सह quarantine मध्ये जाते.' },
      },
      {
        q: { en: 'How do you make an S3 reorganisation job safe to run twice?', mr: 'S3 पुनर्रचना job दोनदा चालवला तरी सुरक्षित कसा ठेवता?' },
        a: { en: 'Make every step idempotent. Target keys are computed deterministically from the input, so a second run writes the same keys instead of new duplicates. Copy before delete, so a crash in the middle is repaired by just running again: already-moved files are no longer in the source, and half-moved ones are copied again to the same key. The plan is a pure function, so it gives the same answer every time. Outputs are overwritten, never appended. And the reconciliation runs on every execution, including the empty-bucket case, where the honest answer is 0 | 0 | 0 rather than a crash on a missing "Contents" key.', mr: 'प्रत्येक पायरी idempotent करा. target keys input वरून ठरलेल्या पद्धतीने काढल्या जातात, म्हणून दुसरा run नवे duplicates न बनवता त्याच keys लिहितो. आधी copy मग delete, म्हणजे मध्येच crash झालं तर पुन्हा चालवणं हाच उपाय: आधीच हललेल्या files source मध्ये उरत नाहीत, आणि अर्धवट हललेल्या पुन्हा त्याच key वर copy होतात. plan हा शुद्ध function आहे, म्हणून तो प्रत्येक वेळी तेच उत्तर देतो. outputs overwrite होतात, कधीच append होत नाहीत. आणि reconciliation प्रत्येक वेळी चालतं, रिकाम्या bucket च्या प्रसंगीही, जिथे गायब "Contents" key वर crash होण्याऐवजी प्रामाणिक उत्तर 0 | 0 | 0 असतं.' },
      },
      {
        q: { en: 'This job runs once a night. How would you make files process the moment they land?', mr: 'हा job रात्री एकदा चालतो. files येताच त्यांच्यावर प्रक्रिया व्हावी यासाठी काय कराल?' },
        a: { en: 'Configure an S3 event notification on the landing prefix (s3:ObjectCreated:* with a prefix and suffix filter) that invokes a Lambda function, directly or through SQS for buffering and retries. The Lambda gets the bucket and the URL-encoded key in the event, runs the same plan() logic, and copies the file to its partition or to quarantine, writing to a different prefix or bucket so it never triggers itself. Because notifications are delivered at least once, the handler must be idempotent, which deterministic keys already give us. Failures go to a dead-letter queue or on-failure destination instead of disappearing. That is exactly what the Lambda act builds next.', mr: 'landing prefix वर S3 event notification configure करते (prefix आणि suffix filter सह s3:ObjectCreated:*) जो Lambda function invoke करतो, थेट किंवा buffering आणि retries साठी SQS मार्फत. Lambda ला event मध्ये bucket आणि URL-encoded key मिळते, तो तेच plan() logic चालवतो, आणि file तिच्या partition मध्ये किंवा quarantine मध्ये copy करतो, वेगळ्या prefix किंवा bucket मध्ये लिहून म्हणजे तो स्वतःला कधीच trigger करत नाही. notifications किमान एकदा पोहोचतात, म्हणून handler idempotent हवा, जे ठरलेल्या keys मुळे आधीच मिळतं. failures गायब होण्याऐवजी dead-letter queue किंवा on-failure destination कडे जातात. पुढचा Lambda act नेमकं हेच बनवतो.' },
      },
    ],
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: '>> spaces. empty files. 31 november. a fake header. and you just... sorted it, counted it, and put my junk on a 30-day timer. ⌁⌁', mr: '>> spaces. रिकाम्या files. 31 नोव्हेंबर. खोटा header. आणि तू फक्त... sort केलंस, मोजलंस, आणि माझ्या कचऱ्याला 30 दिवसांचा timer लावलास. ⌁⌁' } },
      { who: 'gremlin', mood: 'smug', text: { en: '>> cute. but you ran it by hand. receipts land all night. by the time you press run tomorrow, i will have had hours. ⌁', mr: '>> गोड. पण तू ते हाताने चालवलंस. पावत्या रात्रभर येतात. उद्या तू run दाबेपर्यंत माझ्याकडे तासन्तास वेळ असेल. ⌁' } },
      { who: 'sam', mood: 'happy', text: { en: 'Finance closed the month on time. They can open any day\'s receipts, the bad files have reasons on them, and yesterday\'s totals are back. Thank you, {name}!', mr: 'finance ने महिना वेळेवर बंद केला. ते कोणत्याही दिवसाच्या पावत्या उघडू शकतात, खराब files वर कारणं लिहिलेली आहेत, आणि कालचे totals परत आले. धन्यवाद, {name}!' } },
      { who: 'rex', mood: 'neutral', text: { en: 'The Gremlin has a point. Why wait for a nightly run? S3 can already announce every new file. What if files processed themselves the moment they land?', mr: 'Gremlin चा मुद्दा बरोबर आहे. रात्रीच्या run ची वाट का पाहायची? S3 आधीच प्रत्येक नव्या file ची बातमी देऊ शकतो. files येताच त्या स्वतःहून process झाल्या तर?' } },
      { who: 'meera', mood: 'happy', text: { en: 'Rank up, {name}: Cloud Data Associate. Next act: AWS Lambda, your Python running in the cloud on every new file, with no server to babysit.', mr: 'नवीन रँक, {name}: Cloud Data Associate. पुढचा act: AWS Lambda, प्रत्येक नव्या file वर cloud मध्ये चालणारा तुझा Python, सांभाळायला कोणताही server नाही.' } },
    ],
  },
]
