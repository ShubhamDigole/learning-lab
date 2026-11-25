import type { Lesson } from './types.ts'

// Lambda act (ChaiCart Cloud), second half: configuration and performance (L1.4) and the boss,
// "The 2 a.m. File" (L1.5): an idempotent, loop-proof, event-driven S3 -> Lambda -> S3 pipeline.
// AWS facts checked (November 2026) against docs.aws.amazon.com: Lambda quotas page (memory 128 to
// 10,240 MB, 1,769 MB = 1 vCPU, timeout now 1,800 s, env vars 4 KB, 5 layers, 50 MB zipped / 250 MB
// unzipped package, 10 GB container image, /tmp 512 MB to 10,240 MB, payload 6 MB sync / 1 MB async,
// 1,000 concurrent executions default, scaling 1,000 environments per 10 s per function), the
// "30-minute timeout for on-demand Event Functions" What's New post (Nov 2026), reserved and
// provisioned concurrency pages (100 units stay unreserved; provisioned not on $LATEST), SnapStart page
// (Python 3.12 and later, published versions only), Lambda pricing page and AWS blogs ($0.20 per million
// requests, $0.0000166667 per GB-second for x86 in the first tier, free tier 1M requests and 400,000
// GB-seconds; INIT phase billed since 1 August 2025), async invocation (2 retries, events kept up to
// 6 hours), recursive loop detection (S3, SQS, SNS, EventBridge; about 16 invocations), S3 event
// notifications (at least once, duplicates possible, object key URL-encoded), HeadObject (403 instead of
// 404 without s3:ListBucket), VPC networking (Hyperplane ENIs, no internet without a NAT gateway).

// ───────────────────────── L1.4 shared data

const RECEIPTS = {
  'receipts/2026-11-24/r-1001.json': '{"amount": 120}',
  'receipts/2026-11-24/r-1002.json': '{"amount": 80}',
  'receipts/2026-11-24/r-1003.json': '{"amount": 45}',
  'receipts/2026-11-23/r-0990.json': '{"amount": 60}',
}

const enc = (k: string) => encodeURIComponent(k).replace(/%2F/g, '/').replace(/%20/g, '+')
/** A real-shaped S3 ObjectCreated event (the key is URL-encoded the way S3 sends it). */
const s3ev = (bucket: string, key: string, etag: string, size = 320) => ({
  Records: [
    {
      eventVersion: '2.1',
      eventSource: 'aws:s3',
      awsRegion: 'ap-south-1',
      eventTime: '2026-11-24T02:00:07.000Z',
      eventName: 'ObjectCreated:Put',
      userIdentity: { principalId: 'AWS:AIDAEXAMPLE' },
      requestParameters: { sourceIPAddress: '10.0.0.1' },
      responseElements: { 'x-amz-request-id': 'C3D13FE58DE4C810' },
      s3: {
        s3SchemaVersion: '1.0',
        configurationId: 'raw-to-lambda',
        bucket: { name: bucket, ownerIdentity: { principalId: 'A3NL1KOZZKExample' }, arn: `arn:aws:s3:::${bucket}` },
        object: { key: enc(key), size, eTag: etag, sequencer: '0A1B2C3D4E5F678901' },
      },
    },
  ],
})

const SHIVAJI_KEY = 'raw/receipts/2026/11/24/Shivajinagar.csv'
const FCROAD_KEY = 'raw/receipts/2026/11/24/FC Road.csv'

const COUNT_SOLUTION = `import os
import boto3

print('init: creating the S3 client')
s3 = boto3.client('s3')
served = 0

def lambda_handler(event, context):
    global served
    served += 1
    bucket = os.environ['RECEIPTS_BUCKET']
    resp = s3.list_objects_v2(Bucket=bucket, Prefix=f"receipts/{event['day']}/")
    count = len(resp.get('Contents', []))
    print(f"day {event['day']}: {count} receipts, call {served} in this environment")
    return {'day': event['day'], 'receipts': count, 'served': served}
`

const SUMMARY_SOLUTION = `import json, os, urllib.parse
import boto3

s3 = boto3.client('s3')

def lambda_handler(event, context):
    record = event['Records'][0]['s3']
    bucket = record['bucket']['name']
    key = urllib.parse.unquote_plus(record['object']['key'])
    text = s3.get_object(Bucket=bucket, Key=key)['Body'].read().decode('utf-8')
    amounts = [int(line.split(',')[1]) for line in text.splitlines()[1:] if line]
    summary = {'source': key, 'receipts': len(amounts), 'total': sum(amounts)}
    out_key = 'summaries/' + key.removeprefix('raw/').replace('.csv', '.json')
    s3.put_object(Bucket=os.environ['OUTPUT_BUCKET'], Key=out_key, Body=json.dumps(summary))
    print(json.dumps({'level': 'INFO', 'msg': 'summary written', 'out_key': out_key, 'total': summary['total']}))
    return summary
`

const COST_HEAD = `PRICE_PER_GB_SECOND = 0.0000166667      # x86, first pricing tier, US East
PRICE_PER_MILLION_REQUESTS = 0.20
`
const COST_RUN = `
for memory_mb, avg_ms in [(512, 800), (1024, 450), (2048, 200)]:
    cost = monthly_cost(3_000_000, avg_ms, memory_mb)
    print(f'{memory_mb} MB, {avg_ms} ms: \${cost:.2f}')
`

// ───────────────────────── L1.5 shared data

const RAW = 'chaicart-raw'
const LAKE = 'chaicart-lake'
const PUNE_KEY = 'raw/orders/2026/11/24/Pune Camp.csv'
const PUNE_CSV = `order_id,item,qty,amount,paid_at
PC-1001,Masala Chai,2,40,2026-11-24 07:05
PC-1002,Cutting Chai,1,15,2026-11-24 07:09
PC-1003,Vada Pav,abc,25,2026-11-24 07:12
PC-1004,Bun Maska,1,,2026-11-24 07:15
,Masala Chai,1,20,2026-11-24 07:20
PC-1002,Cutting Chai,1,15,2026-11-24 07:09
PC-1005,Ginger Chai,3,75,2026-11-24 07:31
PC-1006,Poha,1,-30,2026-11-24 07:40
`
const KB_KEY = 'raw/orders/2026/11/25/Kothrud & Baner.csv'
const KB_CSV = `order_id,item,qty,amount,paid_at
KB-2001,Masala Chai,1,20,2026-11-25 06:55
KB-2002,Misal Pav,2,140,2026-11-25 07:02
KB-2003,Cutting Chai,0,15,2026-11-25 07:10
KB-2004,Poha,1,35,2026-11-25 07:12
`
const BIG_KEY = 'raw/orders/2026/11/24/Hinjewadi Phase 1.csv'
const BIG_ITEMS = ['Masala Chai', 'Cutting Chai', 'Vada Pav', 'Poha']
const BIG_CSV =
  'order_id,item,qty,amount,paid_at\n' +
  Array.from({ length: 40 }, (_, n) => {
    const i = n + 1
    const qty = (i % 4) + 1
    const amount = i % 10 === 0 ? '' : String(qty * 20)
    return `HJ-${3000 + i},${BIG_ITEMS[i % 4]},${qty},${amount},2026-11-24 ${String(6 + Math.floor(i / 6)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`
  }).join('\n') +
  '\nHJ-3001,Cutting Chai,2,40,2026-11-24 06:07\n'
const MANIFEST_KEY = 'raw/orders/2026/11/24/_manifest.json'

const E_PUNE = 'e3b98a4da31a127d4bde6e43033f66ba'
const E_PUNE_V2 = '9f1c2e77b0d34a5f8e6a1b2c3d4e5f60'
const E_KB = '5d41402abc4b2a76b9719d911017c592'
const E_BIG = '7215ee9c7d9dc229d2921a40e899ec5f'

const CLEAN_PUNE = 'clean/orders/dt=2026-11-24/store=pune-camp/orders.csv'
const QUAR_PUNE = 'quarantine/orders/dt=2026-11-24/store=pune-camp/rejects.csv'
const CLEAN_KB = 'clean/orders/dt=2026-11-25/store=kothrud-baner/orders.csv'
const CLEAN_BIG = 'clean/orders/dt=2026-11-24/store=hinjewadi-phase-1/orders.csv'

const ENV = { LAKE_BUCKET: LAKE, RAW_PREFIX: 'raw/orders/' }
const FN = { name: 'clean-orders', timeoutSec: 30, memoryMb: 512, env: ENV }
const RAW_ALL = { [PUNE_KEY]: PUNE_CSV, [KB_KEY]: KB_CSV, [BIG_KEY]: BIG_CSV, [MANIFEST_KEY]: '{"files": 3}' }

const B_HEAD = `import csv, io, json, os, re
import urllib.parse
import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')          # init: created once per execution environment
HEADER = ['order_id', 'item', 'qty', 'amount', 'paid_at']

def log(level, msg, **fields):
    print(json.dumps({'level': level, 'msg': msg, **fields}))
`

const B_PARSE = `
def parse_s3_event(event):
    files = []
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])
        etag = record['s3']['object'].get('eTag', '')
        files.append((bucket, key, etag))
    return files

def plan_keys(key):
    parts = key.split('/')                      # raw/orders/2026/11/24/Pune Camp.csv
    dt = '-'.join(parts[2:5])
    name = parts[-1].rsplit('.', 1)[0]
    store = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    partition = f'dt={dt}/store={store}'
    return {'dt': dt, 'store': store,
            'clean_key': f'clean/orders/{partition}/orders.csv',
            'quarantine_key': f'quarantine/orders/{partition}/rejects.csv'}
`

const B_VALIDATE = `
def check_row(row, seen):
    order_id = (row.get('order_id') or '').strip()
    if not order_id:
        return 'missing order_id'
    try:
        qty = int(row['qty'])
    except (TypeError, ValueError):
        return 'bad qty'
    if qty <= 0:
        return 'bad qty'
    try:
        amount = float(row['amount'])
    except (TypeError, ValueError):
        return 'bad amount'
    if amount <= 0:
        return 'bad amount'
    if order_id in seen:
        return 'duplicate order_id'
    return None

def validate_rows(text):
    good, bad, seen = [], [], set()
    for row in csv.DictReader(io.StringIO(text)):
        reason = check_row(row, seen)
        if reason:
            bad.append(dict(row, reason=reason))
        else:
            seen.add(row['order_id'].strip())
            good.append({'order_id': row['order_id'].strip(), 'item': row['item'].strip(),
                         'qty': int(row['qty']), 'amount': f"{float(row['amount']):.2f}",
                         'paid_at': row['paid_at'].strip()})
    return good, bad
`

const B_TO_CSV = `
def to_csv(rows, fields):
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fields, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()
`

const B_DONE = `
def already_done(lake, clean_key, etag):
    try:
        head = s3.head_object(Bucket=lake, Key=clean_key)
    except ClientError as e:
        if e.response['Error']['Code'] in ('404', 'NoSuchKey'):
            return False
        raise
    return head['Metadata'].get('source-etag') == etag
`

const H1 = `
def lambda_handler(event, context):
    plans = []
    for bucket, key, etag in parse_s3_event(event):
        plan = plan_keys(key)
        log('INFO', 'file received', bucket=bucket, key=key, clean_key=plan['clean_key'])
        plans.append(plan)
    return plans
`

const H2 = `
def lambda_handler(event, context):
    results = []
    for bucket, key, etag in parse_s3_event(event):
        text = s3.get_object(Bucket=bucket, Key=key)['Body'].read().decode('utf-8')
        good, bad = validate_rows(text)
        log('INFO', 'file validated', key=key, good=len(good), quarantined=len(bad))
        results.append({'key': key, 'good': len(good), 'quarantined': len(bad)})
    return results
`

const H3 = `
def lambda_handler(event, context):
    lake = os.environ['LAKE_BUCKET']
    results = []
    for bucket, key, etag in parse_s3_event(event):
        plan = plan_keys(key)
        text = s3.get_object(Bucket=bucket, Key=key)['Body'].read().decode('utf-8')
        good, bad = validate_rows(text)
        s3.put_object(Bucket=lake, Key=plan['quarantine_key'], Body=to_csv(bad, HEADER + ['reason']), ContentType='text/csv')
        s3.put_object(Bucket=lake, Key=plan['clean_key'], Body=to_csv(good, HEADER), ContentType='text/csv',
                      Metadata={'source-etag': etag})
        summary = {'status': 'processed', 'key': key, 'rows': len(good) + len(bad), 'good': len(good),
                   'quarantined': len(bad), 'clean_key': plan['clean_key'], 'request_id': context.aws_request_id}
        log('INFO', 'file processed', **summary)
        results.append(summary)
    return results
`

const H4 = `
def lambda_handler(event, context):
    lake = os.environ['LAKE_BUCKET']
    results = []
    for bucket, key, etag in parse_s3_event(event):
        plan = plan_keys(key)
        if already_done(lake, plan['clean_key'], etag):
            log('INFO', 'skipped: already processed', key=key, etag=etag)
            results.append({'status': 'skipped', 'key': key})
            continue
        text = s3.get_object(Bucket=bucket, Key=key)['Body'].read().decode('utf-8')
        good, bad = validate_rows(text)
        # quarantine first, clean file last: the clean file (with its source-etag) is the "done" marker
        s3.put_object(Bucket=lake, Key=plan['quarantine_key'], Body=to_csv(bad, HEADER + ['reason']), ContentType='text/csv')
        s3.put_object(Bucket=lake, Key=plan['clean_key'], Body=to_csv(good, HEADER), ContentType='text/csv',
                      Metadata={'source-etag': etag})
        summary = {'status': 'processed', 'key': key, 'rows': len(good) + len(bad), 'good': len(good),
                   'quarantined': len(bad), 'clean_key': plan['clean_key'], 'request_id': context.aws_request_id}
        log('INFO', 'file processed', **summary)
        results.append(summary)
    return results
`

const H5 = `
def lambda_handler(event, context):
    lake = os.environ['LAKE_BUCKET']
    raw_prefix = os.environ['RAW_PREFIX']
    results = []
    for bucket, key, etag in parse_s3_event(event):
        if bucket == lake or not key.startswith(raw_prefix) or not key.endswith('.csv'):
            log('WARN', 'ignored: not a raw order file', bucket=bucket, key=key)
            results.append({'status': 'ignored', 'key': key})
            continue
        plan = plan_keys(key)
        if already_done(lake, plan['clean_key'], etag):
            log('INFO', 'skipped: already processed', key=key, etag=etag)
            results.append({'status': 'skipped', 'key': key})
            continue
        text = s3.get_object(Bucket=bucket, Key=key)['Body'].read().decode('utf-8')
        good, bad = validate_rows(text)
        s3.put_object(Bucket=lake, Key=plan['quarantine_key'], Body=to_csv(bad, HEADER + ['reason']), ContentType='text/csv')
        s3.put_object(Bucket=lake, Key=plan['clean_key'], Body=to_csv(good, HEADER), ContentType='text/csv',
                      Metadata={'source-etag': etag})
        summary = {'status': 'processed', 'key': key, 'rows': len(good) + len(bad), 'good': len(good),
                   'quarantined': len(bad), 'clean_key': plan['clean_key'], 'request_id': context.aws_request_id}
        log('INFO', 'file processed', **summary)
        results.append(summary)
    return results
`

const ALL_OK = { expr: "all(i['ok'] for i in lambda_invocations)", message: { en: 'Every Lambda invocation should succeed on this night. Open the Lambda logs tab and read the [ERROR] line.', mr: 'या रात्री प्रत्येक Lambda invocation यशस्वी व्हायला हवं. Lambda logs टॅब उघडा आणि [ERROR] ओळ वाचा.' } }
const STATUSES = "[r['status'] for i in lambda_invocations if i['ok'] for r in i['result']]"
const DENY_CHECKS = [
  { expr: "not lambda_invocations[0]['ok'] and 'AccessDenied' in lambda_invocations[0]['error']['errorMessage']", message: { en: 'With the quarantine write denied, the invocation must FAIL with AccessDenied (so Lambda retries it and then sends it to the on-failure destination). Do not catch and hide the error.', mr: 'quarantine write नाकारलं गेलं की invocation AccessDenied सह FAIL व्हायलाच हवं (म्हणजे Lambda retry करेल आणि मग on-failure destination ला पाठवेल). error पकडून लपवू नका.' } },
  { expr: `s3_keys('${LAKE}', 'clean/') == []`, message: { en: 'A clean file was written even though the quarantine write failed. Write the quarantine file first and the clean file (your "done" marker) last.', mr: 'quarantine write fail झालं तरी clean file लिहिली गेली. आधी quarantine file लिहा आणि clean file (तुमचा "done" marker) शेवटी.' } },
]

export const lambdaMoreLessons: Lesson[] = [
  // ───────────────────────── L1.4 Configuration and performance
  {
    id: 'lm1-4',
    code: 'L1.4',
    level: 'intermediate',
    title: { en: 'Configuration and performance', mr: 'Configuration आणि performance' },
    skill: 'Environment variables and secrets, init code and cold starts, memory and CPU, concurrency, least-privilege roles, cost in GB-seconds, monitoring, versions and aliases',
    realLife: {
      place: 'kitchen',
      title: { en: 'The wedding caterer\'s kitchen', mr: 'लग्नाच्या केटररचं स्वयंपाकघर' },
      story: {
        en: 'Shinde Caterers are cooking for a 600-guest wedding in Satara. At 5 a.m. the head cook lights the big stoves, sets out the masala tins and fills the water drums. That takes a while, but it happens once; after that every batch of poha comes out fast because the stove is already hot. The recipe card on the wall says how much salt and which oil (the cook does not memorise it), and the key to the ghee store stays with the manager, who hands out exactly what is needed. A bigger burner cooks faster but uses more gas. There are only four serving counters, so the manager keeps one counter just for the bride\'s family, whatever happens at the others. And at night he counts the gas cylinders used: burner size times hours.',
        mr: 'शिंदे केटरर्स साताऱ्यातल्या 600 पाहुण्यांच्या लग्नासाठी स्वयंपाक करत आहेत. पहाटे 5 वाजता मुख्य आचारी मोठ्या शेगड्या पेटवतो, मसाल्याचे डबे मांडतो आणि पाण्याचे ड्रम भरतो. याला वेळ लागतो, पण हे एकदाच होतं; त्यानंतर पोह्यांची प्रत्येक घाणी पटकन निघते कारण शेगडी आधीच गरम असते. भिंतीवरचं recipe card सांगतं किती मीठ आणि कोणतं तेल (आचारी ते पाठ करत नाही), आणि तुपाच्या कोठीची किल्ली manager कडे राहते, जो नेमकं लागेल तेवढंच देतो. मोठा बर्नर लवकर शिजवतो पण gas जास्त खातो. वाढपाचे फक्त चार counter आहेत, म्हणून manager एक counter फक्त नवरीच्या घरच्यांसाठी राखून ठेवतो, बाकीच्या counter वर काहीही होवो. आणि रात्री तो वापरलेले gas cylinder मोजतो: बर्नरचा आकार गुणिले तास.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🔥', label: 'Light the stoves once (init, cold start)', mr: 'शेगड्या एकदाच पेटवा (init, cold start)' },
          { icon: '🍲', label: 'Every next batch is fast (warm start)', mr: 'पुढची प्रत्येक घाणी पटकन (warm start)' },
          { icon: '📋', label: 'Recipe card on the wall (env vars)', mr: 'भिंतीवरचं recipe card (env vars)' },
          { icon: '🔑', label: 'Ghee store key with the manager (secrets, least privilege)', mr: 'तुपाच्या कोठीची किल्ली manager कडे (secrets, least privilege)' },
          { icon: '🪑', label: 'One counter reserved (reserved concurrency)', mr: 'एक counter राखीव (reserved concurrency)' },
          { icon: '🧾', label: 'Gas used = burner size x hours (GB-seconds)', mr: 'वापरलेला gas = बर्नरचा आकार x तास (GB-seconds)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Our first Lambda works, but the AWS bill went up, the receipts function was slow every morning, and last month-end the payment webhook started failing with "429 TooManyRequestsException" while the receipts job was busy.', mr: 'आपलं पहिलं Lambda चालतं, पण AWS bill वाढलं, receipts function दर सकाळी हळू होतं, आणि मागच्या महिन्याअखेरीस receipts job busy असताना payment webhook "429 TooManyRequestsException" देऊन fail होऊ लागला.' } },
        { who: 'theo', mood: 'smug', text: { en: 'I fixed the config already. The bucket name is in the code, the database password too, so nobody has to set anything. And I gave the role s3:* on everything, so it never gets AccessDenied.', mr: 'मी config आधीच ठीक केलं. bucket चं नाव code मध्ये आहे, database password सुद्धा, म्हणजे कोणालाच काही set करावं लागत नाही. आणि role ला सगळ्यावर s3:* दिलं, म्हणजे कधीच AccessDenied येत नाही.' } },
        { who: 'rex', mood: 'angry', text: { en: 'That is three incidents waiting to happen. Config goes in environment variables, secrets go in Secrets Manager, and the role gets only what the function needs. Then we tune memory, look at cold starts, protect the webhook with reserved concurrency, and put a number on the cost.', mr: 'म्हणजे होऊ घातलेले तीन incidents. config environment variables मध्ये जातं, secrets Secrets Manager मध्ये, आणि role ला function ला लागेल तेवढंच मिळतं. मग आपण memory tune करू, cold starts पाहू, webhook ला reserved concurrency ने वाचवू, आणि cost चा आकडा काढू.' } },
        { who: 'meera', mood: 'happy', text: { en: 'This is the lesson interviewers love, {name}. Every setting you touch today has a "why" and a number behind it.', mr: 'interviewers ना आवडणारा हाच धडा, {name}. आज तू जी settings बदलशील त्या प्रत्येकामागे एक "का" आणि एक आकडा आहे.' } },
      ],
      problem: { en: 'Hard-coded names and passwords, a role that can do anything, slow cold starts, guessed memory, no limit on how many copies run at once, and nobody knows what a month of Lambda costs.', mr: 'code मध्ये लिहिलेली नावं आणि passwords, काहीही करू शकणारा role, हळू cold starts, अंदाजाने ठरवलेली memory, एकाच वेळी किती copies चालतात यावर मर्यादा नाही, आणि महिन्याभराच्या Lambda चा खर्च कोणालाच माहीत नाही.' },
      solution: { en: 'Read config from os.environ and secrets from Secrets Manager or Parameter Store, create clients once in init code, give the execution role least privilege, size memory by measuring, use reserved concurrency to protect and limit functions, estimate cost from GB-seconds, alarm on CloudWatch metrics, and release through versions and aliases.', mr: 'config os.environ मधून आणि secrets Secrets Manager किंवा Parameter Store मधून वाचा, clients init code मध्ये एकदाच बनवा, execution role ला least privilege द्या, memory मोजून ठरवा, functions ना वाचवायला आणि मर्यादा घालायला reserved concurrency वापरा, cost GB-seconds वरून काढा, CloudWatch metrics वर alarms लावा, आणि versions व aliases मधून release करा.' },
    },
    lesson: [
      {
        en: 'Configuration lives outside the code. Environment variables (os.environ["LAKE_BUCKET"]) hold settings that change between dev and prod; all of them together may be at most 4 KB. Secrets such as database passwords or API keys never go in code or in plain environment variables, because anyone who can read the function configuration can see them. Keep them in AWS Secrets Manager (rotation, audit) or SSM Parameter Store (SecureString), fetch them in init code and cache them. Then the role decides who can read the secret.',
        mr: 'Configuration code च्या बाहेर राहतं. Environment variables (os.environ["LAKE_BUCKET"]) मध्ये dev आणि prod मध्ये बदलणाऱ्या settings असतात; सगळ्या मिळून जास्तीत जास्त 4 KB. database password किंवा API keys सारखी secrets कधीच code मध्ये किंवा साध्या environment variables मध्ये ठेवू नका, कारण function configuration वाचू शकणाऱ्या कोणालाही ती दिसतात. ती AWS Secrets Manager (rotation, audit) किंवा SSM Parameter Store (SecureString) मध्ये ठेवा, init code मध्ये आणा आणि cache करा. मग secret कोण वाचू शकतं ते role ठरवतो.',
      },
      {
        en: 'Code outside the handler is init code: it runs once when Lambda creates a new execution environment (a cold start), and the REPORT log line of that first call shows "Init Duration". Later calls that reuse the environment are warm starts and skip it. So create boto3 clients, load config and open connections at the top of the file. Global variables survive between warm calls, which is great for caches and dangerous for per-request data: never keep one customer\'s data in a global. Since 1 August 2025 the INIT phase is billed too. SnapStart (Java 11+, Python 3.12+, .NET 8+, on published versions) snapshots the initialised environment to cut cold starts; provisioned concurrency keeps environments warm for a fee.',
        mr: 'handler च्या बाहेरचा code म्हणजे init code: Lambda नवं execution environment बनवतं (cold start) तेव्हा तो एकदाच चालतो, आणि त्या पहिल्या call च्या REPORT log ओळीत "Init Duration" दिसतं. नंतरचे, तेच environment वापरणारे calls म्हणजे warm starts, ते init वगळतात. म्हणून boto3 clients, config आणि connections file च्या वरच्या भागात बनवा. global variables warm calls मध्ये टिकतात, cache साठी उत्तम आणि प्रत्येक request च्या data साठी धोकादायक: एका ग्राहकाचा data कधीच global मध्ये ठेवू नका. 1 ऑगस्ट 2025 पासून INIT phase चं सुद्धा बिल लागतं. SnapStart (Java 11+, Python 3.12+, .NET 8+, published versions वर) तयार environment चा snapshot घेऊन cold start कमी करतं; provisioned concurrency पैसे घेऊन environments गरम ठेवतं.',
      },
      {
        en: 'Memory is the one performance knob: 128 MB to 10,240 MB, and CPU grows with it (1,769 MB is about one full vCPU, 10,240 MB about six). More memory can make a CPU-bound job so much faster that it costs the same or less, so measure instead of guessing. The timeout defaults to 3 seconds; the maximum was 15 minutes for years and became 30 minutes (1,800 s) in November 2026. Cost = requests ($0.20 per million) + GB-seconds (memory in GB x seconds run, about $0.0000166667 each for x86 in the first tier; prices differ a little by Region). Packages: 50 MB zipped upload, 250 MB unzipped including up to 5 layers, or a container image up to 10 GB. /tmp is 512 MB to 10,240 MB.',
        mr: 'Memory हा performance चा एकमेव knob: 128 MB ते 10,240 MB, आणि CPU तिच्यासोबत वाढतो (1,769 MB म्हणजे सुमारे एक पूर्ण vCPU, 10,240 MB म्हणजे सुमारे सहा). जास्त memory मुळे CPU-bound काम इतकं वेगवान होऊ शकतं की खर्च तेवढाच किंवा कमी येतो, म्हणून अंदाज न लावता मोजा. timeout चा default 3 सेकंद; कमाल मर्यादा वर्षानुवर्षं 15 मिनिटं होती आणि नोव्हेंबर 2026 मध्ये 30 मिनिटं (1,800 s) झाली. Cost = requests ($0.20 प्रति million) + GB-seconds (memory GB मध्ये x चाललेले सेकंद, x86 साठी पहिल्या tier मध्ये प्रत्येकी सुमारे $0.0000166667; Region प्रमाणे किंमत थोडी बदलते). Packages: 50 MB zipped upload, 5 पर्यंत layers धरून 250 MB unzipped, किंवा 10 GB पर्यंत container image. /tmp 512 MB ते 10,240 MB.',
      },
      {
        en: 'Concurrency is how many copies run at once. An account starts with 1,000 per Region (shared by all functions); when it is used up, synchronous callers get 429 TooManyRequestsException (a throttle), and async events such as S3 notifications wait in Lambda\'s queue and are retried for up to 6 hours. Reserved concurrency guarantees a function its share and also caps it (100 units always stay unreserved); setting it to 0 stops a function. The execution role is what the code is allowed to do: give it only the actions and ARNs it needs, because explicit deny wins and everything not allowed is denied. (This lab simulates a missing permission with a deny list; real IAM combines identity policies on the role with resource policies on buckets.) Watch Invocations, Errors, Throttles, Duration and ConcurrentExecutions in CloudWatch with alarms, and release through versions (immutable snapshots) and aliases (a "prod" pointer, which can split traffic like 90/10). A VPC lets the function reach private databases, but it then has no internet unless you add a NAT gateway; use a VPC endpoint for S3.',
        mr: 'Concurrency म्हणजे एकाच वेळी किती copies चालतात. account ला सुरुवातीला प्रत्येक Region मध्ये 1,000 मिळतात (सगळ्या functions मध्ये वाटलेले); ते संपले की synchronous callers ना 429 TooManyRequestsException (throttle) मिळतो, आणि S3 notifications सारखे async events Lambda च्या queue मध्ये थांबतात आणि 6 तासांपर्यंत retry होतात. Reserved concurrency function ला त्याचा वाटा पक्का करतं आणि त्यावर मर्यादाही घालतं (100 units नेहमी unreserved राहतात); 0 ठेवलं की function थांबतं. Execution role म्हणजे code ला काय करायची परवानगी आहे: त्याला फक्त लागणाऱ्या actions आणि ARNs द्या, कारण explicit deny जिंकतो आणि allow न केलेलं सगळं deny असतं. (हा lab missing permission deny list ने simulate करतो; खरं IAM role वरच्या identity policies आणि buckets वरच्या resource policies एकत्र तपासतं.) CloudWatch मध्ये Invocations, Errors, Throttles, Duration आणि ConcurrentExecutions वर alarms सह लक्ष ठेवा, आणि versions (न बदलणारे snapshots) व aliases ("prod" pointer, जो 90/10 असं traffic वाटू शकतो) मधून release करा. VPC मुळे function private databases पर्यंत पोहोचतं, पण मग NAT gateway जोडल्याशिवाय त्याला internet नसतं; S3 साठी VPC endpoint वापरा.',
      },
    ],
    syntax: {
      template: `import os
import boto3

s3 = boto3.client('s3')            # init code: runs once per execution environment
cache = {}                         # survives warm starts: only for safe, shared data

def lambda_handler(event, context):
    bucket = os.environ['LAKE_BUCKET']             # config from an environment variable
    print(context.memory_limit_in_mb, context.get_remaining_time_in_millis())
    ...

# cost per month = invocations x 0.20 / 1,000,000
#                + invocations x seconds x (memory_mb / 1024) x price_per_gb_second`,
      parts: [
        { code: "s3 = boto3.client('s3')  (top of file)", means: { en: 'init code: created once on a cold start, reused by every warm call (faster and cheaper)', mr: 'init code: cold start ला एकदाच बनतो, प्रत्येक warm call पुन्हा वापरतो (वेगवान आणि स्वस्त)' } },
        { code: "os.environ['LAKE_BUCKET']", means: { en: 'config set on the function, different per stage; KeyError if missing, which is better than a silent default', mr: 'function वर set केलेलं config, प्रत्येक stage साठी वेगळं; नसेल तर KeyError, जे गुपचूप default पेक्षा चांगलं' } },
        { code: 'Init Duration: 205.60 ms', means: { en: 'appears in the REPORT line only on a cold start; it is the time spent running init code', mr: 'फक्त cold start ला REPORT ओळीत दिसतं; init code चालवायला लागलेला वेळ' } },
        { code: 'context.memory_limit_in_mb', means: { en: 'the memory setting; CPU is allocated in proportion to it', mr: 'memory setting; CPU तिच्या प्रमाणात मिळतो' } },
        { code: 'GB-seconds = seconds x memory_mb / 1024', means: { en: 'the unit Lambda bills compute in, plus $0.20 per million requests', mr: 'Lambda ज्या unit मध्ये compute चं बिल करतं, अधिक $0.20 प्रति million requests' } },
        { code: 'reserved concurrency = 50', means: { en: 'at most 50 copies of this function, and 50 kept for it alone', mr: 'या function च्या जास्तीत जास्त 50 copies, आणि 50 फक्त त्याच्यासाठी राखीव' } },
      ],
      example: [
        { code: "print('init: creating the S3 client')", note: { en: 'lighting the stove: shows once, on the cold start', mr: 'शेगडी पेटवणं: फक्त एकदा, cold start ला दिसतं' } },
        { code: "bucket = os.environ['RECEIPTS_BUCKET']", note: { en: 'the recipe card on the wall', mr: 'भिंतीवरचं recipe card' } },
        { code: 'served += 1   # 1, 2, 3 on warm starts', note: { en: 'the stove is still hot: state survives between calls', mr: 'शेगडी अजून गरम: calls मध्ये state टिकतं' } },
        { code: '3,000,000 x 0.8 s x 0.5 GB = 1,200,000 GB-s', note: { en: 'burner size times hours', mr: 'बर्नरचा आकार गुणिले तास' } },
        { code: '1,200,000 x $0.0000166667 + 3 x $0.20 = $20.60', note: { en: 'the month\'s gas bill', mr: 'महिन्याचं gas बिल' } },
      ],
      pitfall: { en: 'Creating the client inside the handler works, so nobody notices: every call pays to build it again. The opposite trap is worse: a global list that you append request data to keeps growing across warm calls and leaks one request\'s data into the next. Globals are for clients and read-only config only.', mr: 'handler च्या आत client बनवलं तरी चालतं, म्हणून कोणाच्याच लक्षात येत नाही: प्रत्येक call ला तो पुन्हा बनवायचा खर्च येतो. उलटा सापळा जास्त वाईट: ज्या global list मध्ये तुम्ही request चा data append करता ती warm calls मध्ये वाढत जाते आणि एका request चा data पुढच्यात जातो. globals फक्त clients आणि वाचण्यापुरत्या config साठी.' },
    },
    practice: {
      intro: { en: 'Five steps in the ChaiCart Cloud account. After each run, open the Lambda logs tab in the AWS console panel under the output: the REPORT lines show Duration, Billed Duration, Memory Size and, on a cold start, Init Duration.', mr: 'ChaiCart Cloud account मध्ये पाच पायऱ्या. प्रत्येक run नंतर output खालच्या AWS console panel मधला Lambda logs टॅब उघडा: REPORT ओळी Duration, Billed Duration, Memory Size आणि cold start ला Init Duration दाखवतात.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'The count-receipts function is called three times in a row (three test events, one per day). Fix Theo\'s version: create the S3 client once in init code (a module-level variable named s3), read the bucket name from the environment variable RECEIPTS_BUCKET (inside the handler, as this lab sets environment variables just before the first call), and keep a module-level counter served that the handler increases by 1 and returns, so you can see warm starts reuse the environment. Hidden runs use a dev bucket with other receipts.', mr: 'count-receipts function सलग तीन वेळा बोलावलं जातं (तीन test events, प्रत्येक दिवसासाठी एक). Theo चं version दुरुस्त करा: S3 client init code मध्ये एकदाच बनवा (s3 नावाचा module-level variable), bucket चं नाव RECEIPTS_BUCKET या environment variable मधून वाचा (handler च्या आत, कारण हा lab पहिल्या call च्या आधी environment variables set करतो), आणि served नावाचा module-level counter ठेवा जो handler 1 ने वाढवतो आणि परत देतो, म्हणजे warm starts environment पुन्हा वापरतात हे दिसेल. लपवलेले runs दुसऱ्या receipts असलेलं dev bucket वापरतात.' },
          aws: {
            buckets: { 'chaicart-receipts': RECEIPTS },
            lambda: { name: 'count-receipts', memoryMb: 256, env: { RECEIPTS_BUCKET: 'chaicart-receipts' }, events: [{ day: '2026-11-24' }, { day: '2026-11-23' }, { day: '2026-11-22' }] },
          },
          starter: `import os
import boto3

def lambda_handler(event, context):
    s3 = boto3.client('s3')          # TODO: create the client once, outside the handler
    bucket = 'chaicart-receipts'     # TODO: read RECEIPTS_BUCKET from os.environ
    served = 1                       # TODO: a module-level counter that grows on warm starts (global)
    resp = s3.list_objects_v2(Bucket=bucket, Prefix=f"receipts/{event['day']}/")
    count = len(resp.get('Contents', []))
    return {'day': event['day'], 'receipts': count, 'served': served}
`,
          solution: COUNT_SOLUTION,
          checks: [
            { expr: "type(s3).__name__ == 'S3Client'", message: { en: 'Create the client in init code, at the top of the file: s3 = boto3.client("s3").', mr: 'client init code मध्ये, file च्या वरच्या भागात बनवा: s3 = boto3.client("s3").' } },
            { expr: "[i['result']['receipts'] for i in lambda_invocations] == [3, 1, 0]", message: { en: 'The three days should have 3, 1 and 0 receipts. Note that "Contents" is missing when a prefix is empty: use resp.get("Contents", []).', mr: 'तीन दिवसांच्या 3, 1 आणि 0 receipts हव्यात. prefix रिकामा असेल तेव्हा "Contents" नसतं: resp.get("Contents", []) वापरा.' } },
            { expr: "[i['result']['served'] for i in lambda_invocations] == [1, 2, 3]", message: { en: 'served should come back as 1, 2, 3: a module-level counter (served = 0 at the top), and "global served" then served += 1 in the handler.', mr: 'served 1, 2, 3 असं परत यायला हवं: module-level counter (वर served = 0), आणि handler मध्ये "global served" मग served += 1.' } },
          ],
          mustUse: [{ pattern: 'os\\.environ', message: { en: 'Read the bucket name with os.environ["RECEIPTS_BUCKET"].', mr: 'bucket चं नाव os.environ["RECEIPTS_BUCKET"] ने वाचा.' } }],
          mustNotUse: [{ pattern: '[\'"]chaicart-receipts[\'"]', message: { en: 'Do not write the bucket name in the code. It comes from the environment variable, so dev and prod can differ.', mr: 'bucket चं नाव code मध्ये लिहू नका. ते environment variable मधून येतं, म्हणजे dev आणि prod वेगळे असू शकतात.' } }],
          variants: [
            {
              label: { en: 'Deployed to dev: RECEIPTS_BUCKET is chaicart-receipts-dev', mr: 'dev वर deploy: RECEIPTS_BUCKET म्हणजे chaicart-receipts-dev' },
              aws: {
                buckets: { 'chaicart-receipts-dev': { 'receipts/2026-11-24/t-1.json': '{}', 'receipts/2026-11-24/t-2.json': '{}' } },
                lambda: { name: 'count-receipts', memoryMb: 256, env: { RECEIPTS_BUCKET: 'chaicart-receipts-dev' }, events: [{ day: '2026-11-24' }, { day: '2026-11-24' }] },
              },
              checks: [{ expr: "[(i['result']['receipts'], i['result']['served']) for i in lambda_invocations] == [(2, 1), (2, 2)]", message: { en: 'On the dev bucket the answers should be 2 receipts twice, with served 1 then 2.', mr: 'dev bucket वर उत्तर दोन्ही वेळा 2 receipts, आणि served 1 मग 2 असं हवं.' } }],
            },
          ],
          hints: [
            { en: 'Move s3 = boto3.client("s3") above the def, and add served = 0 there too. Inside the handler, write global served before changing it.', mr: 's3 = boto3.client("s3") def च्या वर हलवा, आणि तिथेच served = 0 जोडा. handler मध्ये तो बदलण्याआधी global served लिहा.' },
            { en: 'bucket = os.environ["RECEIPTS_BUCKET"] replaces the hard-coded name. Run, then open the Lambda logs: only the first REPORT line has Init Duration.', mr: 'code मधल्या नावाऐवजी bucket = os.environ["RECEIPTS_BUCKET"]. Run करा, मग Lambda logs उघडा: फक्त पहिल्या REPORT ओळीत Init Duration आहे.' },
            { en: "s3 = boto3.client('s3')\nserved = 0\n\ndef lambda_handler(event, context):\n    global served\n    served += 1\n    bucket = os.environ['RECEIPTS_BUCKET']\n    resp = s3.list_objects_v2(Bucket=bucket, Prefix=f\"receipts/{event['day']}/\")\n    count = len(resp.get('Contents', []))\n    return {'day': event['day'], 'receipts': count, 'served': served}", mr: "s3 = boto3.client('s3')\nserved = 0\n\ndef lambda_handler(event, context):\n    global served\n    served += 1\n    bucket = os.environ['RECEIPTS_BUCKET']\n    resp = s3.list_objects_v2(Bucket=bucket, Prefix=f\"receipts/{event['day']}/\")\n    count = len(resp.get('Contents', []))\n    return {'day': event['day'], 'receipts': count, 'served': served}" },
          ],
          successLine: { en: 'One cold start, two warm ones, and the bucket can change without touching the code.', mr: 'एक cold start, दोन warm, आणि code ला हात न लावता bucket बदलू शकतं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Run this function (512 MB, three test events) and open the Lambda logs tab. Read the INIT line, the printed lines and the three REPORT lines. Which statement is true?', mr: 'हे function (512 MB, तीन test events) Run करा आणि Lambda logs टॅब उघडा. INIT ओळ, print झालेल्या ओळी आणि तीन REPORT ओळी वाचा. कोणतं विधान खरं आहे?' },
          pythonSandbox: {
            code: `import boto3

print('init: importing libraries and creating clients')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    print(f"handler: order {event['order']} on {context.memory_limit_in_mb} MB")
    return 'ok'
`,
            aws: { lambda: { name: 'tag-orders', memoryMb: 512, events: [{ order: 1 }, { order: 2 }, { order: 3 }] } },
          },
          options: [
            { en: 'All three REPORT lines show Init Duration, because init code runs before every call', mr: 'तिन्ही REPORT ओळींत Init Duration आहे, कारण init code प्रत्येक call आधी चालतो' },
            { en: 'Memory Size 512 MB means the function used 512 MB on every call', mr: 'Memory Size 512 MB म्हणजे function ने प्रत्येक call ला 512 MB वापरले' },
            { en: 'Only the first call was a cold start: Init Duration appears once, and later calls reused the environment and the client', mr: 'फक्त पहिला call cold start होता: Init Duration एकदाच दिसतं, आणि नंतरच्या calls नी environment आणि client पुन्हा वापरला' },
            { en: 'Init Duration is the time the handler took for order 1', mr: 'Init Duration म्हणजे order 1 साठी handler ला लागलेला वेळ' },
          ],
          correct: [2],
          explain: { en: 'Init code ran once (its print appears once, in the init run), so only the first REPORT has Init Duration. The handler time is Duration; Memory Size is the setting, and Max Memory Used is what was actually used. In real AWS a burst of traffic creates more environments, and each new one has its own cold start.', mr: 'init code एकदाच चालला (त्याचा print एकदाच, init run मध्ये दिसतो), म्हणून फक्त पहिल्या REPORT मध्ये Init Duration आहे. handler चा वेळ म्हणजे Duration; Memory Size म्हणजे setting, आणि Max Memory Used म्हणजे प्रत्यक्ष वापरलेली. खऱ्या AWS मध्ये traffic अचानक वाढलं की जास्त environments बनतात, आणि प्रत्येक नव्याचा स्वतःचा cold start असतो.' },
          hints: [
            { en: 'Count how many REPORT lines contain "Init Duration".', mr: 'किती REPORT ओळींमध्ये "Init Duration" आहे ते मोजा.' },
            { en: 'Compare "Memory Size" with "Max Memory Used" on the same line.', mr: 'एकाच ओळीवरचं "Memory Size" आणि "Max Memory Used" यांची तुलना करा.' },
          ],
          successLine: { en: 'You can read a REPORT line like an on-call engineer now.', mr: 'आता तुम्ही on-call engineer सारखी REPORT ओळ वाचू शकता.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Security tightened the summarise-receipts role to least privilege: it may read raw/ in chaicart-raw and write to the lake, nothing else (no writes to the raw bucket, no deletes). Theo\'s code writes the summary next to the raw file and deletes the raw file, so it now fails with AccessDenied. Do not ask for more permissions. Change the design: write the summary as JSON to the bucket in the environment variable OUTPUT_BUCKET at "summaries/" + the key without "raw/" and with .json instead of .csv, and leave the raw file alone (a lifecycle rule cleans raw/ later). Hidden runs: a key with a space, and a different output bucket.', mr: 'Security ने summarise-receipts role least privilege पर्यंत घट्ट केला: तो chaicart-raw मधलं raw/ वाचू शकतो आणि lake मध्ये लिहू शकतो, बाकी काही नाही (raw bucket मध्ये write नाही, delete नाही). Theo चा code summary raw file शेजारी लिहितो आणि raw file delete करतो, म्हणून तो आता AccessDenied देऊन fail होतो. जास्त permissions मागू नका. design बदला: summary JSON म्हणून OUTPUT_BUCKET environment variable मधल्या bucket मध्ये "summaries/" + "raw/" शिवायची key, .csv ऐवजी .json, अशा key वर लिहा, आणि raw file ला हात लावू नका (lifecycle rule नंतर raw/ साफ करतो). लपवलेले runs: space असलेली key, आणि वेगळं output bucket.' },
          aws: {
            buckets: { [RAW]: { [SHIVAJI_KEY]: 'receipt_id,amount\nR-1,120\nR-2,80\nR-3,45\n' }, [LAKE]: {} },
            deny: ['s3:PutObject@chaicart-raw/*', 's3:DeleteObject*'],
            lambda: { name: 'summarise-receipts', env: { OUTPUT_BUCKET: LAKE }, events: [s3ev(RAW, SHIVAJI_KEY, 'b1946ac92492d2347c6235b4d2611184', 48)] },
          },
          starter: `import json, os, urllib.parse
import boto3

s3 = boto3.client('s3')

def lambda_handler(event, context):
    record = event['Records'][0]['s3']
    bucket = record['bucket']['name']
    key = urllib.parse.unquote_plus(record['object']['key'])
    text = s3.get_object(Bucket=bucket, Key=key)['Body'].read().decode('utf-8')
    amounts = [int(line.split(',')[1]) for line in text.splitlines()[1:] if line]
    summary = {'source': key, 'receipts': len(amounts), 'total': sum(amounts)}
    # TODO: least privilege says: write to os.environ['OUTPUT_BUCKET'] at summaries/..., and never delete raw
    out_key = key.replace('.csv', '-summary.json')
    s3.put_object(Bucket=bucket, Key=out_key, Body=json.dumps(summary))
    s3.delete_object(Bucket=bucket, Key=key)
    return summary
`,
          solution: SUMMARY_SOLUTION,
          checks: [
            ALL_OK,
            { expr: `json.loads(s3_text('${LAKE}', 'summaries/receipts/2026/11/24/Shivajinagar.json')) == {'source': '${SHIVAJI_KEY}', 'receipts': 3, 'total': 245}`, message: { en: 'chaicart-lake should have summaries/receipts/2026/11/24/Shivajinagar.json with receipts 3 and total 245.', mr: 'chaicart-lake मध्ये receipts 3 आणि total 245 असलेली summaries/receipts/2026/11/24/Shivajinagar.json हवी.' } },
            { expr: `s3_exists('${RAW}', '${SHIVAJI_KEY}') and s3_keys('${RAW}') == ['${SHIVAJI_KEY}']`, message: { en: 'The raw bucket must stay exactly as it was: the raw file kept, nothing new written there.', mr: 'raw bucket जसंच्या तसं राहायला हवं: raw file तशीच, तिथे नवं काही लिहिलेलं नाही.' } },
          ],
          mustNotUse: [{ pattern: 'delete_object', message: { en: 'Do not delete the raw file. The role cannot, and the raw zone is your evidence; a lifecycle rule expires it later.', mr: 'raw file delete करू नका. role ला ते करता येत नाही, आणि raw zone हा तुमचा पुरावा आहे; lifecycle rule नंतर तो expire करतो.' } }],
          mustUse: [{ pattern: "os\\.environ\\[?\\.?(get\\()?['\"]OUTPUT_BUCKET", message: { en: 'Read the output bucket from os.environ["OUTPUT_BUCKET"].', mr: 'output bucket os.environ["OUTPUT_BUCKET"] मधून वाचा.' } }],
          variants: [
            {
              label: { en: 'A key with a space, and the dev lake as output', mr: 'space असलेली key, आणि output म्हणून dev lake' },
              aws: {
                buckets: { [RAW]: { [FCROAD_KEY]: 'receipt_id,amount\nR-7,300\nR-8,25\n' }, 'chaicart-lake-dev': {} },
                deny: ['s3:PutObject@chaicart-raw/*', 's3:DeleteObject*'],
                lambda: { name: 'summarise-receipts', env: { OUTPUT_BUCKET: 'chaicart-lake-dev' }, events: [s3ev(RAW, FCROAD_KEY, 'aab3238922bcc25a6f606eb525ffdc56', 34)] },
              },
              checks: [ALL_OK, { expr: "json.loads(s3_text('chaicart-lake-dev', 'summaries/receipts/2026/11/24/FC Road.json'))['total'] == 325", message: { en: 'The dev lake should have summaries/receipts/2026/11/24/FC Road.json with total 325 (decode the key with unquote_plus).', mr: 'dev lake मध्ये total 325 असलेली summaries/receipts/2026/11/24/FC Road.json हवी (key unquote_plus ने decode करा).' } }],
            },
          ],
          hints: [
            { en: 'Read the AccessDenied message in the logs: it names the action and the resource. The fix is a different destination: Bucket=os.environ["OUTPUT_BUCKET"]. Delete the delete_object line.', mr: 'logs मधला AccessDenied message वाचा: तो action आणि resource सांगतो. उपाय म्हणजे वेगळं ठिकाण: Bucket=os.environ["OUTPUT_BUCKET"]. delete_object ची ओळ काढून टाका.' },
            { en: "key.removeprefix('raw/') gives receipts/2026/11/24/Shivajinagar.csv; add 'summaries/' in front and replace '.csv' with '.json'.", mr: "key.removeprefix('raw/') ने receipts/2026/11/24/Shivajinagar.csv मिळतं; पुढे 'summaries/' जोडा आणि '.csv' ऐवजी '.json' करा." },
            { en: "    out_key = 'summaries/' + key.removeprefix('raw/').replace('.csv', '.json')\n    s3.put_object(Bucket=os.environ['OUTPUT_BUCKET'], Key=out_key, Body=json.dumps(summary))\n    return summary", mr: "    out_key = 'summaries/' + key.removeprefix('raw/').replace('.csv', '.json')\n    s3.put_object(Bucket=os.environ['OUTPUT_BUCKET'], Key=out_key, Body=json.dumps(summary))\n    return summary" },
          ],
          successLine: { en: 'Least privilege did more than block a hacker: it stopped a design that would have looped on its own bucket.', mr: 'least privilege ने फक्त hacker ला अडवलं नाही: स्वतःच्याच bucket वर loop झालेलं असतं असं design थांबवलं.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Sam asks: "What will the receipts function cost per month?" Write gb_seconds(invocations, avg_ms, memory_mb) (seconds run x memory in GB, where 1 GB = 1024 MB) and monthly_cost(invocations, avg_ms, memory_mb) = GB-seconds x PRICE_PER_GB_SECOND + invocations / 1,000,000 x PRICE_PER_MILLION_REQUESTS, rounded to 2 decimals (ignore the free tier). The loop prints three memory settings for 3 million calls a month; their durations were measured with each setting.', mr: 'Sam विचारतो: "receipts function ला महिन्याला किती खर्च येईल?" gb_seconds(invocations, avg_ms, memory_mb) लिहा (चाललेले सेकंद x GB मध्ये memory, जिथे 1 GB = 1024 MB) आणि monthly_cost(invocations, avg_ms, memory_mb) = GB-seconds x PRICE_PER_GB_SECOND + invocations / 1,000,000 x PRICE_PER_MILLION_REQUESTS, 2 decimals पर्यंत round (free tier दुर्लक्ष करा). loop महिन्याला 3 million calls साठी तीन memory settings print करतो; प्रत्येक setting सह त्यांचा duration मोजलेला आहे.' },
          starter: `${COST_HEAD}
def gb_seconds(invocations, avg_ms, memory_mb):
    # TODO: seconds run x memory in GB
    return 0

def monthly_cost(invocations, avg_ms, memory_mb):
    # TODO: compute (GB-seconds x price) + requests (per million), rounded to 2 decimals
    return 0
${COST_RUN}`,
          solution: `${COST_HEAD}
def gb_seconds(invocations, avg_ms, memory_mb):
    return invocations * (avg_ms / 1000) * (memory_mb / 1024)

def monthly_cost(invocations, avg_ms, memory_mb):
    compute = gb_seconds(invocations, avg_ms, memory_mb) * PRICE_PER_GB_SECOND
    requests = invocations / 1_000_000 * PRICE_PER_MILLION_REQUESTS
    return round(compute + requests, 2)
${COST_RUN}`,
          output: ['512 MB, 800 ms: $20.60', '1024 MB, 450 ms: $23.10', '2048 MB, 200 ms: $20.60'],
          checks: [
            { expr: 'gb_seconds(1_000_000, 1000, 1024) == 1_000_000', message: { en: 'gb_seconds(1,000,000 calls, 1000 ms, 1024 MB) should be 1,000,000: one second at one GB, a million times.', mr: 'gb_seconds(1,000,000 calls, 1000 ms, 1024 MB) = 1,000,000 हवं: एक GB वर एक सेकंद, दहा लाख वेळा.' } },
            { expr: 'monthly_cost(1_000_000, 100, 128) == 0.41', message: { en: 'monthly_cost(1,000,000, 100 ms, 128 MB) should be 0.41 (12,500 GB-s is about $0.21, plus $0.20 for the requests).', mr: 'monthly_cost(1,000,000, 100 ms, 128 MB) = 0.41 हवं (12,500 GB-s म्हणजे सुमारे $0.21, अधिक requests चे $0.20).' } },
            { expr: 'monthly_cost(0, 500, 1024) == 0', message: { en: 'No calls, no cost: monthly_cost(0, ...) should be 0.', mr: 'calls नाहीत, खर्च नाही: monthly_cost(0, ...) = 0 हवं.' } },
          ],
          hints: [
            { en: 'Convert first: seconds = avg_ms / 1000 and gb = memory_mb / 1024. GB-seconds = invocations x seconds x gb.', mr: 'आधी रूपांतर करा: seconds = avg_ms / 1000 आणि gb = memory_mb / 1024. GB-seconds = invocations x seconds x gb.' },
            { en: 'Requests cost invocations / 1_000_000 * PRICE_PER_MILLION_REQUESTS. Add the two parts and round(..., 2).', mr: 'requests चा खर्च invocations / 1_000_000 * PRICE_PER_MILLION_REQUESTS. दोन्ही भाग जोडा आणि round(..., 2).' },
            { en: '    return invocations * (avg_ms / 1000) * (memory_mb / 1024)\n\n    compute = gb_seconds(invocations, avg_ms, memory_mb) * PRICE_PER_GB_SECOND\n    requests = invocations / 1_000_000 * PRICE_PER_MILLION_REQUESTS\n    return round(compute + requests, 2)', mr: '    return invocations * (avg_ms / 1000) * (memory_mb / 1024)\n\n    compute = gb_seconds(invocations, avg_ms, memory_mb) * PRICE_PER_GB_SECOND\n    requests = invocations / 1_000_000 * PRICE_PER_MILLION_REQUESTS\n    return round(compute + requests, 2)' },
          ],
          successLine: { en: 'Four times the memory, same bill, four times faster. That is why you measure instead of guessing.', mr: 'चौपट memory, तेवढंच बिल, चौपट वेगवान. म्हणूनच अंदाज न लावता मोजायचं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Month-end: Sam bulk-uploads 5,000 old receipt files, and S3 fires 5,000 events within a minute. The receipts function scales up and uses most of the account\'s 1,000 concurrent executions. At the same moment the payment-webhook function (synchronous, customers waiting at the counter) starts returning 429 TooManyRequestsException. What is the best fix?', mr: 'महिनाअखेर: Sam जुन्या 5,000 receipt files एकदम upload करतो, आणि S3 एका मिनिटात 5,000 events पाठवतं. receipts function वाढत जातं आणि account च्या 1,000 concurrent executions मधले बहुतेक वापरतं. त्याच क्षणी payment-webhook function (synchronous, ग्राहक counter वर थांबलेले) 429 TooManyRequestsException देऊ लागतं. सगळ्यात चांगला उपाय कोणता?' },
          options: [
            { en: 'Raise the timeout of the receipts function to 30 minutes', mr: 'receipts function चा timeout 30 मिनिटं करा' },
            { en: 'Give the receipts function 10,240 MB of memory so each copy finishes sooner', mr: 'receipts function ला 10,240 MB memory द्या म्हणजे प्रत्येक copy लवकर संपेल' },
            { en: 'Add provisioned concurrency to the receipts function', mr: 'receipts function ला provisioned concurrency जोडा' },
            { en: 'Set reserved concurrency on both: guarantee the webhook its share, and cap the receipts function (say 50). Its throttled S3 events wait in Lambda\'s async queue and are retried, so none are lost', mr: 'दोघांवर reserved concurrency ठेवा: webhook चा वाटा पक्का करा, आणि receipts function वर मर्यादा घाला (समजा 50). त्याचे throttle झालेले S3 events Lambda च्या async queue मध्ये थांबतात आणि retry होतात, त्यामुळे एकही हरवत नाही' },
          ],
          correct: [3],
          explain: { en: 'Concurrency is shared by every function in the account and Region. Reserved concurrency both protects (the webhook always has its units) and limits (the batch job cannot grab everything). Async events from S3 that get throttled are kept and retried for up to 6 hours, so the batch just takes longer. Timeout and memory do not change how many copies run, and provisioned concurrency only pre-warms environments (it costs money and would make the hog bigger). An SQS queue between S3 and Lambda is another good buffer.', mr: 'Concurrency account आणि Region मधल्या प्रत्येक function मध्ये वाटलेली असते. Reserved concurrency वाचवतं (webhook ला त्याचे units नेहमी मिळतात) आणि मर्यादाही घालतं (batch job सगळं घेऊ शकत नाही). S3 कडून आलेले throttle झालेले async events 6 तासांपर्यंत ठेवले जातात आणि retry होतात, म्हणजे batch ला फक्त जास्त वेळ लागतो. timeout आणि memory मुळे किती copies चालतात ते बदलत नाही, आणि provisioned concurrency फक्त environments आधीच गरम ठेवतं (त्याला पैसे लागतात आणि खाणारा आणखी मोठा होईल). S3 आणि Lambda मध्ये SQS queue हा आणखी एक चांगला buffer.' },
          hints: [
            { en: 'Which setting changes how many copies of a function may run at once?', mr: 'function च्या किती copies एकाच वेळी चालू शकतात ते कोणतं setting बदलतं?' },
            { en: 'Think of the caterer\'s counter kept only for the bride\'s family.', mr: 'फक्त नवरीच्या घरच्यांसाठी राखून ठेवलेला केटररचा counter आठवा.' },
          ],
          successLine: { en: 'The webhook keeps its counter, and the batch job queues politely.', mr: 'webhook चा counter त्याच्याकडेच राहतो, आणि batch job शांतपणे रांगेत थांबतो.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'A function has 1024 MB of memory, runs 500 ms per call, and is called 2 million times a month. How many GB-seconds is that?', mr: 'एका function ला 1024 MB memory आहे, ते प्रत्येक call ला 500 ms चालतं, आणि महिन्याला 2 million वेळा बोलावलं जातं. किती GB-seconds झाले?' },
        options: ['500,000', '2,000,000', '1,000,000', '1,024,000,000'],
        answer: 2,
        explain: { en: '2,000,000 x 0.5 s x 1 GB = 1,000,000 GB-seconds. At about $0.0000166667 each that is about $16.67, plus $0.40 for 2 million requests (before any free tier).', mr: '2,000,000 x 0.5 s x 1 GB = 1,000,000 GB-seconds. प्रत्येकी सुमारे $0.0000166667 ने सुमारे $16.67, अधिक 2 million requests चे $0.40 (free tier आधी).' },
      },
      {
        q: { en: 'Where should a Python Lambda create its boto3 S3 client, and why?', mr: 'Python Lambda ने boto3 S3 client कुठे बनवायला हवा, आणि का?' },
        code: `import boto3
# A: here, at the top of the file
def lambda_handler(event, context):
    # B: here, inside the handler
    ...`,
        options: [
          { en: 'At A: init code runs once per execution environment and warm calls reuse the client', mr: 'A वर: init code प्रत्येक execution environment मध्ये एकदाच चालतो आणि warm calls client पुन्हा वापरतात' },
          { en: 'At B: a client outside the handler is shared between different AWS accounts', mr: 'B वर: handler बाहेरचा client वेगवेगळ्या AWS accounts मध्ये वाटला जातो' },
          { en: 'At B: init code is not billed, so it is wasted', mr: 'B वर: init code चं बिल लागत नाही, म्हणून तो वाया जातो' },
          { en: 'It makes no difference: Lambda runs the whole file before every call', mr: 'काहीच फरक पडत नाही: Lambda प्रत्येक call आधी पूर्ण file चालवतं' },
        ],
        answer: 0,
        explain: { en: 'Code outside the handler runs on a cold start only; every warm call reuses what it built. An environment belongs to one function version, never to other accounts. And since August 2025 the INIT phase is billed like the rest, so keep it lean too.', mr: 'handler बाहेरचा code फक्त cold start ला चालतो; प्रत्येक warm call त्याने बनवलेलं पुन्हा वापरतो. environment एकाच function version चं असतं, इतर accounts चं कधीच नाही. आणि ऑगस्ट 2025 पासून INIT phase चं बिलही बाकीसारखंच लागतं, म्हणून तो सुद्धा हलका ठेवा.' },
      },
      {
        q: { en: 'The function needs a database password. Where should it live?', mr: 'function ला database password लागतो. तो कुठे ठेवायचा?' },
        options: [
          { en: 'In the code, so deployments never forget it', mr: 'code मध्ये, म्हणजे deployment मध्ये तो कधी विसरला जाणार नाही' },
          { en: 'In a plain environment variable, since those are private', mr: 'साध्या environment variable मध्ये, कारण ते खासगी असतात' },
          { en: 'In a file in /tmp', mr: '/tmp मधल्या file मध्ये' },
          { en: 'In Secrets Manager (or a Parameter Store SecureString), read with the role\'s permission and cached in init code', mr: 'Secrets Manager मध्ये (किंवा Parameter Store SecureString), role च्या परवानगीने वाचून init code मध्ये cache केलेला' },
        ],
        answer: 3,
        explain: { en: 'Anyone who can view the function configuration can read its environment variables, and code ends up in Git. Secrets Manager adds access control through IAM, audit and rotation. /tmp is temporary scratch space for one environment.', mr: 'function configuration पाहू शकणारा कोणीही त्याचे environment variables वाचू शकतो, आणि code Git मध्ये जातो. Secrets Manager IAM मधून access control, audit आणि rotation देतो. /tmp म्हणजे एका environment ची तात्पुरती जागा.' },
      },
      {
        q: { en: 'The "prod" alias points to version 7. You publish version 8 and want only 10% of traffic on it for an hour before switching fully. What do you use?', mr: '"prod" alias version 7 कडे निर्देश करतो. तुम्ही version 8 publish करता आणि पूर्ण बदलण्याआधी एक तास फक्त 10% traffic त्यावर हवं. काय वापरता?' },
        options: [
          { en: 'Edit $LATEST in the console', mr: 'console मध्ये $LATEST edit करा' },
          { en: 'A weighted alias: prod stays on version 7 with 10% routed to version 8', mr: 'weighted alias: prod version 7 वर राहतो आणि 10% version 8 कडे जातं' },
          { en: 'Reserved concurrency of 10 on version 8', mr: 'version 8 वर reserved concurrency 10' },
          { en: 'Create a second function and ask callers to pick one', mr: 'दुसरं function बनवा आणि callers ना एक निवडायला सांगा' },
        ],
        answer: 1,
        explain: { en: 'Versions are immutable snapshots; an alias is a named pointer that callers and triggers use, and it can split traffic between two versions. Rolling back means moving the pointer. Reserved concurrency limits copies, it does not route traffic.', mr: 'Versions म्हणजे न बदलणारे snapshots; alias म्हणजे नाव असलेला pointer जो callers आणि triggers वापरतात, आणि तो दोन versions मध्ये traffic वाटू शकतो. rollback म्हणजे pointer परत हलवणं. Reserved concurrency copies ची मर्यादा घालतं, traffic route करत नाही.' },
      },
    ],
    recap: { line: { en: 'Config in env vars, secrets in Secrets Manager, clients in init code, memory buys CPU, reserved concurrency protects and caps, the role gets least privilege, cost = requests + GB-seconds, alarms on Errors and Throttles, release through aliases.', mr: 'config env vars मध्ये, secrets Secrets Manager मध्ये, clients init code मध्ये, memory ने CPU मिळतो, reserved concurrency वाचवतं आणि मर्यादा घालतं, role ला least privilege, cost = requests + GB-seconds, Errors आणि Throttles वर alarms, aliases मधून release.' }, icon: '🎛️' },
    interview: [
      {
        q: { en: 'What is a cold start, and how do you reduce it?', mr: 'cold start म्हणजे काय, आणि तो कसा कमी करता?' },
        a: { en: 'A cold start is the extra time when Lambda has to create a new execution environment: download the code, start the runtime and run the init code outside the handler. It shows as "Init Duration" in the REPORT log line, and it happens on the first call and whenever Lambda scales out. I reduce it by keeping the package small, importing only what I need, and doing heavy setup once in init code so warm calls reuse it. For latency-sensitive Python functions I can turn on SnapStart (Python 3.12 and later, on published versions) or pay for provisioned concurrency. For ChaiCart\'s 2 a.m. file processing a 300 ms cold start does not matter, so I would not pay for either. One gotcha: since August 2025 the INIT phase is billed, so a fat init costs money as well as time.', mr: 'cold start म्हणजे Lambda ला नवं execution environment बनवावं लागतं तेव्हाचा जास्तीचा वेळ: code download करणं, runtime सुरू करणं आणि handler बाहेरचा init code चालवणं. तो REPORT log ओळीत "Init Duration" म्हणून दिसतो, आणि पहिल्या call ला आणि Lambda scale out करतं तेव्हा होतो. मी package लहान ठेवून, लागेल तेवढंच import करून, आणि जड setup init code मध्ये एकदाच करून तो कमी करते, म्हणजे warm calls ते पुन्हा वापरतात. latency ला संवेदनशील Python functions साठी SnapStart (Python 3.12 आणि पुढे, published versions वर) चालू करता येतं किंवा provisioned concurrency साठी पैसे देता येतात. ChaiCart च्या रात्री 2 च्या file processing ला 300 ms चा cold start महत्त्वाचा नाही, म्हणून मी दोन्हीपैकी कशासाठीच पैसे देणार नाही. एक gotcha: ऑगस्ट 2025 पासून INIT phase चं बिल लागतं, म्हणजे जड init वेळेसोबत पैसेही खातो.' },
      },
      {
        q: { en: 'How are Lambda memory and CPU related, and how do you choose the memory size?', mr: 'Lambda ची memory आणि CPU यांचा संबंध काय, आणि memory size कशी निवडता?' },
        a: { en: 'Memory is the only compute setting: from 128 MB to 10,240 MB, and Lambda gives CPU in proportion, about one full vCPU at 1,769 MB and up to six at the top. So a CPU-bound function often gets faster when I add memory even if it does not need the RAM. Because the bill is GB-seconds, a function that runs four times faster with four times the memory costs the same. I measure with a few settings (or AWS Lambda Power Tuning) and pick the cheapest one that meets the latency target. For example, a ChaiCart receipts parser cost $20.60 a month both at 512 MB / 800 ms and at 2048 MB / 200 ms, so the faster one was free speed. The gotcha is network or S3-bound code: extra memory there mostly adds cost.', mr: 'Memory हे एकमेव compute setting: 128 MB ते 10,240 MB, आणि Lambda त्या प्रमाणात CPU देतं, 1,769 MB वर सुमारे एक पूर्ण vCPU आणि सगळ्यात वर सहा पर्यंत. म्हणून CPU-bound function ला RAM ची गरज नसली तरी memory वाढवल्यावर ते अनेकदा वेगवान होतं. बिल GB-seconds मध्ये असल्याने, चौपट memory सह चौपट वेगाने चालणाऱ्या function चा खर्च तेवढाच येतो. मी काही settings वर मोजते (किंवा AWS Lambda Power Tuning) आणि latency चं लक्ष्य पूर्ण करणारी सगळ्यात स्वस्त निवडते. उदा. ChaiCart च्या receipts parser चा खर्च 512 MB / 800 ms आणि 2048 MB / 200 ms दोन्हीवर महिन्याला $20.60 होता, म्हणजे वेग फुकट मिळाला. gotcha म्हणजे network किंवा S3 वर थांबणारा code: तिथे जास्त memory मुख्यतः खर्च वाढवते.' },
      },
      {
        q: { en: 'Reserved vs provisioned concurrency: what is the difference, and what is throttling?', mr: 'Reserved आणि provisioned concurrency यांत फरक काय, आणि throttling म्हणजे काय?' },
        a: { en: 'Concurrency is the number of requests a function handles at the same moment, and by default all functions in a Region share an account quota of 1,000. Reserved concurrency carves out a fixed number for one function: it guarantees that many and also caps it there, and it is free. Provisioned concurrency keeps a number of environments initialised in advance so there is no cold start; it costs money and is set on a version or alias, never on $LATEST. Throttling is what happens when there is no concurrency left: synchronous callers get 429 TooManyRequestsException, while async events such as S3 notifications are queued and retried for up to 6 hours. At ChaiCart I would reserve concurrency for the payment webhook and cap the bulk receipts job. Gotcha: reserved concurrency of 0 stops a function completely, which is also a handy emergency brake.', mr: 'Concurrency म्हणजे function एकाच क्षणी हाताळत असलेल्या requests ची संख्या, आणि default नुसार Region मधले सगळे functions 1,000 चा account quota वाटून घेतात. Reserved concurrency एका function साठी ठरावीक संख्या बाजूला काढतं: तेवढी पक्की करतं आणि तिथेच मर्यादाही घालतं, आणि ते फुकट आहे. Provisioned concurrency काही environments आधीच तयार ठेवतं म्हणजे cold start होत नाही; त्याला पैसे लागतात आणि ते version किंवा alias वर ठेवतात, $LATEST वर कधीच नाही. Throttling म्हणजे concurrency उरलेली नसताना होणारं: synchronous callers ना 429 TooManyRequestsException मिळतो, तर S3 notifications सारखे async events queue होतात आणि 6 तासांपर्यंत retry होतात. ChaiCart मध्ये मी payment webhook साठी concurrency राखीव ठेवेन आणि bulk receipts job वर मर्यादा घालेन. Gotcha: reserved concurrency 0 केलं की function पूर्ण थांबतं, जो emergency brake म्हणूनही उपयोगी.' },
      },
      {
        q: { en: 'Where do you keep configuration and secrets for a Lambda function?', mr: 'Lambda function चं configuration आणि secrets कुठे ठेवता?' },
        a: { en: 'Plain configuration such as bucket names, prefixes and feature flags goes in environment variables, read with os.environ, so the same code runs in dev and prod with different values (the limit is 4 KB in total). Secrets such as database passwords and API keys go in AWS Secrets Manager or SSM Parameter Store as SecureString, because environment variables are visible to anyone who can read the function configuration. The execution role gets permission to read only that one secret, and I fetch it in init code and cache it, or use the AWS Parameters and Secrets Lambda Extension. At ChaiCart the lake bucket name is an environment variable and the payment gateway key is in Secrets Manager with rotation. The gotcha: never print config dictionaries to the logs, because secrets leak into CloudWatch that way.', mr: 'bucket ची नावं, prefixes आणि feature flags सारखं साधं configuration environment variables मध्ये जातं, os.environ ने वाचलेलं, म्हणजे तोच code dev आणि prod मध्ये वेगळ्या values सह चालतो (एकूण मर्यादा 4 KB). database passwords आणि API keys सारखी secrets AWS Secrets Manager मध्ये किंवा SSM Parameter Store मध्ये SecureString म्हणून जातात, कारण function configuration वाचू शकणाऱ्या कोणालाही environment variables दिसतात. execution role ला फक्त ते एकच secret वाचायची परवानगी मिळते, आणि मी ते init code मध्ये आणून cache करते, किंवा AWS Parameters and Secrets Lambda Extension वापरते. ChaiCart मध्ये lake bucket चं नाव environment variable आहे आणि payment gateway ची key rotation सह Secrets Manager मध्ये. gotcha: config dictionaries कधीच logs मध्ये print करू नका, कारण secrets अशीच CloudWatch मध्ये गळतात.' },
      },
      {
        q: { en: 'Your Lambda gets AccessDenied reading an S3 object. What do you check?', mr: 'तुमच्या Lambda ला S3 object वाचताना AccessDenied मिळतो. काय तपासता?' },
        a: { en: 'First I read the full error message: it names the role, the action (s3:GetObject) and the exact resource ARN, and often says whether an identity-based policy or an explicit deny is the reason. Then I check the execution role\'s policy allows that action on arn:aws:s3:::bucket/key-prefix/* (object actions need the /* resource; ListBucket needs the bucket ARN itself). Next the bucket policy, because an explicit Deny anywhere wins, then KMS: with SSE-KMS the role also needs kms:Decrypt on the key. I also check the key itself, since a URL-encoded key that was not decoded, or a missing object without s3:ListBucket, gives 403 instead of 404. At ChaiCart this happened when the role allowed raw/* but the files landed under Raw/. Gotcha: never "fix" it with s3:*; add exactly the missing action and resource.', mr: 'आधी मी पूर्ण error message वाचते: तो role, action (s3:GetObject) आणि नेमका resource ARN सांगतो, आणि अनेकदा कारण identity-based policy आहे की explicit deny तेही सांगतो. मग execution role ची policy arn:aws:s3:::bucket/key-prefix/* वर तो action allow करते का ते पाहते (object actions ना /* resource लागतो; ListBucket ला bucket चा ARN). पुढे bucket policy, कारण कुठेही असलेला explicit Deny जिंकतो, मग KMS: SSE-KMS असेल तर role ला key वर kms:Decrypt सुद्धा लागतो. key सुद्धा तपासते, कारण decode न केलेली URL-encoded key, किंवा s3:ListBucket शिवाय नसलेला object, 404 ऐवजी 403 देतो. ChaiCart मध्ये असं झालं जेव्हा role ने raw/* allow केलं पण files Raw/ खाली आल्या. Gotcha: s3:* देऊन कधीच "fix" करू नका; नेमका हरवलेला action आणि resource जोडा.' },
      },
      {
        q: { en: 'How do you estimate the monthly cost of a Lambda function?', mr: 'Lambda function चा महिन्याचा खर्च कसा अंदाजता?' },
        a: { en: 'Lambda bills two things: requests at $0.20 per million, and compute in GB-seconds, which is memory in GB times the billed duration, at about $0.0000166667 per GB-second for x86 in the first tier (Arm is cheaper, and prices vary slightly by Region). So cost = calls / 1,000,000 x 0.20 + calls x seconds x GB x price. For ChaiCart, 3 million receipts a month at 800 ms and 512 MB is 1.2 million GB-seconds, about $20, plus $0.60 for requests. The free tier covers 1 million requests and 400,000 GB-seconds a month. I take the real average from the Duration metric or the REPORT lines rather than guessing. Gotcha: also count what the function calls (S3 requests, CloudWatch Logs ingestion, NAT gateway data), which can cost more than Lambda itself.', mr: 'Lambda दोन गोष्टींचं बिल करतं: requests $0.20 प्रति million, आणि compute GB-seconds मध्ये, म्हणजे GB मध्ये memory गुणिले billed duration, x86 साठी पहिल्या tier मध्ये सुमारे $0.0000166667 प्रति GB-second (Arm स्वस्त आहे, आणि Region प्रमाणे किंमत थोडी बदलते). म्हणजे cost = calls / 1,000,000 x 0.20 + calls x seconds x GB x price. ChaiCart साठी, महिन्याला 3 million receipts, 800 ms आणि 512 MB वर, म्हणजे 1.2 million GB-seconds, सुमारे $20, अधिक requests चे $0.60. free tier महिन्याला 1 million requests आणि 400,000 GB-seconds देतो. मी अंदाज न लावता Duration metric किंवा REPORT ओळींमधून खरी सरासरी घेते. Gotcha: function जे बोलावतं तेही मोजा (S3 requests, CloudWatch Logs ingestion, NAT gateway data), ज्यांचा खर्च Lambda पेक्षाही जास्त होऊ शकतो.' },
      },
      {
        q: { en: 'What are the main Lambda limits you design around?', mr: 'design करताना Lambda च्या कोणत्या मुख्य मर्यादा लक्षात ठेवता?' },
        a: { en: 'Time: the timeout defaults to 3 seconds and can go up to 30 minutes (it was 15 minutes until November 2026, so many people still quote 900 seconds). Size: memory 128 MB to 10,240 MB, /tmp 512 MB to 10,240 MB, a zip package of 50 MB zipped and 250 MB unzipped with up to 5 layers, or a container image up to 10 GB. Payload: 6 MB for synchronous request and response, 1 MB for asynchronous events. Scale: 1,000 concurrent executions per Region by default, and each function can add 1,000 environments every 10 seconds. These shape the design: ChaiCart\'s daily order files of a few MB are perfect for Lambda, but a 20 GB yearly export would hit memory and time, so it goes to Glue or Spark. Gotcha: never pass file contents in the event; pass the S3 key and read the object.', mr: 'वेळ: timeout चा default 3 सेकंद आणि तो 30 मिनिटांपर्यंत जाऊ शकतो (नोव्हेंबर 2026 पर्यंत तो 15 मिनिटं होता, म्हणून अनेक जण अजूनही 900 सेकंद सांगतात). आकार: memory 128 MB ते 10,240 MB, /tmp 512 MB ते 10,240 MB, zip package 50 MB zipped आणि 5 पर्यंत layers धरून 250 MB unzipped, किंवा 10 GB पर्यंत container image. Payload: synchronous request आणि response साठी 6 MB, asynchronous events साठी 1 MB. Scale: default नुसार प्रत्येक Region मध्ये 1,000 concurrent executions, आणि प्रत्येक function दर 10 सेकंदांना 1,000 environments वाढवू शकतं. यातून design ठरतं: ChaiCart च्या काही MB च्या रोजच्या order files Lambda साठी अगदी योग्य, पण 20 GB चा वार्षिक export memory आणि वेळेवर अडेल, म्हणून तो Glue किंवा Spark कडे जातो. Gotcha: file चा मजकूर event मध्ये कधीच पाठवू नका; S3 key पाठवा आणि object वाचा.' },
      },
      {
        q: { en: 'Should a data Lambda run inside a VPC?', mr: 'data Lambda VPC च्या आत चालवावं का?' },
        a: { en: 'Only if it needs something private in the VPC, such as an RDS database or an internal API. Attached to a VPC, the function sends its traffic through Lambda-managed Hyperplane network interfaces in your subnets and follows your security groups, but it loses internet access unless the private subnet routes to a NAT gateway. For S3 I would add a VPC gateway endpoint so traffic stays private and avoids NAT data charges. ChaiCart\'s S3-to-S3 cleaning function does not need a VPC at all, so I keep it outside; the function that loads results into a private Postgres does go in. Gotcha: putting a function in a public subnet does not give it internet, because it has no public IP.', mr: 'फक्त VPC मधलं काहीतरी private लागत असेल तर, उदा. RDS database किंवा internal API. VPC ला जोडलं की function चं traffic तुमच्या subnets मधल्या Lambda-managed Hyperplane network interfaces मधून जातं आणि तुमचे security groups पाळतं, पण private subnet NAT gateway कडे route होत नाही तोपर्यंत internet जातं. S3 साठी मी VPC gateway endpoint जोडेन म्हणजे traffic private राहील आणि NAT data charges टळतील. ChaiCart च्या S3 ते S3 cleaning function ला VPC ची गरजच नाही, म्हणून ते बाहेर ठेवते; private Postgres मध्ये निकाल load करणारं function मात्र आत जातं. Gotcha: function public subnet मध्ये ठेवलं तरी internet मिळत नाही, कारण त्याला public IP नसतो.' },
      },
    ],
  },

  // ───────────────────────── L1.5 Boss: The 2 a.m. File
  {
    id: 'lm1-5',
    code: 'L1.5',
    level: 'intermediate',
    isBoss: true,
    title: { en: 'Boss: The 2 a.m. File', mr: 'Boss: रात्री 2 ची file' },
    skill: 'An end-to-end event-driven pipeline: decode the event, validate and quarantine rows, write Hive-partitioned output to another bucket, idempotent on duplicates and retries, config from env vars, structured logs, loop-proof',
    realLife: {
      place: 'postoffice',
      title: { en: 'The night mail van at Pune station', mr: 'पुणे स्टेशनवरची रात्रीची mail van' },
      story: {
        en: 'At 2 a.m. the mail van from the trains pulls into the Railway Mail Service office at Pune station. Nobody plans which bags arrive: they arrive, and the night shift starts. Every letter is read, sorted into a bag by date and pin code, and a torn or unreadable letter goes into a separate tray with a slip saying why. If the same registered parcel is scanned twice, the clerk checks the register: already entered, so it is not entered again. The sorted bags go onto a different shelf from the one the van unloads onto, or the sorters would end up sorting their own output all night. If the supervisor\'s stamp is missing, the bag is not sealed half-done; it waits until the stamp comes. At 6 a.m. the supervisor reads one line in the register: received, sorted, set aside.',
        mr: 'रात्री 2 वाजता गाड्यांमधून आलेली mail van पुणे स्टेशनवरच्या Railway Mail Service office मध्ये येते. कोणत्या पिशव्या येतील हे कोणी ठरवत नाही: त्या येतात, आणि रात्रपाळी सुरू होते. प्रत्येक पत्र वाचलं जातं, तारीख आणि pin code प्रमाणे पिशवीत टाकलं जातं, आणि फाटलेलं किंवा न वाचता येणारं पत्र का ते सांगणाऱ्या चिठ्ठीसह वेगळ्या tray मध्ये जातं. तेच registered parcel दोनदा scan झालं तर clerk register तपासतो: आधीच नोंद आहे, म्हणून पुन्हा नोंद होत नाही. sort केलेल्या पिशव्या van जिथे माल उतरवते त्यापेक्षा वेगळ्या फळीवर जातात, नाहीतर sorters रात्रभर स्वतःचंच काम पुन्हा sort करत बसतील. supervisor चा शिक्का नसेल तर पिशवी अर्धवट seal होत नाही; शिक्का येईपर्यंत थांबते. सकाळी 6 वाजता supervisor register मधली एक ओळ वाचतो: आलं, sort झालं, बाजूला ठेवलं.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🚐', label: 'A bag arrives at 2 a.m. (S3 event)', mr: 'रात्री 2 ला पिशवी येते (S3 event)' },
          { icon: '✉️', label: 'Read every letter (validate rows)', mr: 'प्रत्येक पत्र वाचा (rows validate)' },
          { icon: '📮', label: 'Bags by date and pin code (Hive partitions)', mr: 'तारीख आणि pin code प्रमाणे पिशव्या (Hive partitions)' },
          { icon: '🗂️', label: 'Torn letters in a tray, with a slip (quarantine)', mr: 'फाटलेली पत्रं tray मध्ये, चिठ्ठीसह (quarantine)' },
          { icon: '📒', label: 'Already in the register? Skip (idempotent)', mr: 'register मध्ये आधीच आहे? वगळा (idempotent)' },
          { icon: '🗄️', label: 'Output on another shelf (no loops)', mr: 'output दुसऱ्या फळीवर (loop नाही)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Every store uploads its day file to raw/ around 2 a.m. By 6 a.m. I want clean orders in the lake for the morning dashboard, and the bad rows somewhere the store managers can fix them. Last week the dashboard showed Pune Camp twice.', mr: 'प्रत्येक store आपली दिवसाची file रात्री 2 च्या सुमारास raw/ मध्ये upload करतं. सकाळच्या dashboard साठी 6 वाजेपर्यंत मला lake मध्ये साफ orders हव्यात, आणि खराब rows अशा ठिकाणी जिथे store managers त्या दुरुस्त करू शकतील. मागच्या आठवड्यात dashboard ने Pune Camp दोनदा दाखवलं.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> tonight: a file name with spaces and an ampersand. s3 delivering the same event twice. a permission that quietly disappears. a file ten times bigger. and someone pointing a trigger at your own output. sleep well. ⌁', mr: '>> आज रात्री: spaces आणि ampersand असलेलं file चं नाव. s3 तोच event दोनदा देतं. गुपचूप गायब होणारी permission. दहापट मोठी file. आणि तुझ्याच output कडे trigger वळवणारा कोणीतरी. शांत झोप. ⌁' } },
        { who: 'rex', mood: 'neutral', text: { en: 'One function, clean-orders. Decode the event, validate every row, write clean rows to chaicart-lake under clean/orders/dt=.../store=.../, quarantine bad rows with a reason, log one JSON summary. Same event twice must not write twice. A failed write must fail loudly. And it must never trigger itself.', mr: 'एक function, clean-orders. event decode करा, प्रत्येक row validate करा, साफ rows chaicart-lake मध्ये clean/orders/dt=.../store=.../ खाली लिहा, खराब rows कारणासह quarantine करा, एक JSON summary log करा. तोच event दोनदा आला तर दोनदा लिहायचं नाही. fail झालेलं write मोठ्याने fail व्हायला हवं. आणि ते स्वतःला कधीच trigger करू नये.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Every piece is something you already did, {name}: events, unquote_plus, csv, quarantine, retries. Tonight they become one pipeline. Two hints per step, so read the Lambda logs first.', mr: 'प्रत्येक तुकडा तू आधीच केला आहेस, {name}: events, unquote_plus, csv, quarantine, retries. आज रात्री त्यांची एक pipeline बनते. प्रत्येक पायरीला दोन hints, म्हणून आधी Lambda logs वाच.' } },
      ],
      problem: { en: 'Files land at any time with awkward names, S3 delivers events at least once, async invocations are retried, permissions change, files grow, and a careless trigger can make a function feed itself. A naive handler double-counts, loses rows, half-writes outputs or loops.', mr: 'files कधीही, विचित्र नावांसह येतात, S3 events किमान एकदा देतं, async invocations retry होतात, permissions बदलतात, files मोठ्या होतात, आणि बेफिकीर trigger मुळे function स्वतःलाच खाऊ घालू शकतं. साधा handler दुहेरी मोजतो, rows हरवतो, output अर्धवट लिहितो किंवा loop करतो.' },
      solution: { en: 'A small, testable handler: parse_s3_event decodes keys, plan_keys builds Hive-partitioned output keys, validate_rows splits good and bad rows with reasons, the handler writes quarantine first and the clean file last with the source ETag in its metadata, skips work already done, ignores anything outside the raw prefix, reads its config from environment variables and logs one JSON summary per file.', mr: 'छोटा, तपासता येणारा handler: parse_s3_event keys decode करतो, plan_keys Hive-partitioned output keys बनवतो, validate_rows कारणांसह चांगल्या आणि खराब rows वेगळ्या करतो, handler आधी quarantine आणि शेवटी metadata मध्ये source ETag सह clean file लिहितो, आधीच झालेलं काम वगळतो, raw prefix बाहेरचं सगळं दुर्लक्षित करतो, config environment variables मधून वाचतो आणि प्रत्येक file साठी एक JSON summary log करतो.' },
    },
    lesson: [
      {
        en: 'Event-driven means the file is the alarm clock. S3 sends an event with the bucket and a URL-encoded key, so "Pune Camp.csv" arrives as "Pune+Camp.csv" and "&" as "%26"; unquote_plus turns it back. Loop over every record in event["Records"] instead of taking only [0]. Build output keys from the input key in a fixed way: raw/orders/2026/11/24/Pune Camp.csv becomes clean/orders/dt=2026-11-24/store=pune-camp/orders.csv. Those name=value folders are Hive-style partitions: Athena, Glue and Spark read them as columns and skip whole folders when you filter on dt.',
        mr: 'Event-driven म्हणजे file हाच गजर. S3 bucket आणि URL-encoded key सह event पाठवतं, म्हणून "Pune Camp.csv" "Pune+Camp.csv" म्हणून येतं आणि "&" "%26" म्हणून; unquote_plus ते परत मूळ करतो. फक्त [0] न घेता event["Records"] मधल्या प्रत्येक record वर loop करा. output keys input key वरून ठरलेल्या पद्धतीने बनवा: raw/orders/2026/11/24/Pune Camp.csv चं clean/orders/dt=2026-11-24/store=pune-camp/orders.csv होतं. हे name=value folders म्हणजे Hive-style partitions: Athena, Glue आणि Spark त्यांना columns म्हणून वाचतात आणि dt वर filter केलं की पूर्ण folders वगळतात.',
      },
      {
        en: 'Validate every row and give every bad row a reason, in a fixed order: missing order_id, bad qty, bad amount, duplicate order_id. Good rows go to the clean file, bad rows (raw values plus reason) to quarantine/, in another bucket from the raw one. rows read = good + quarantined, always, and one JSON log line per file says so. JSON logs are searchable with CloudWatch Logs Insights and can become metrics and alarms.',
        mr: 'प्रत्येक row validate करा आणि प्रत्येक खराब row ला ठरलेल्या क्रमाने कारण द्या: missing order_id, bad qty, bad amount, duplicate order_id. चांगल्या rows clean file मध्ये, खराब rows (raw values अधिक कारण) quarantine/ मध्ये, raw पेक्षा वेगळ्या bucket मध्ये. वाचलेल्या rows = good + quarantined, नेहमी, आणि प्रत्येक file साठी एक JSON log ओळ ते सांगते. JSON logs CloudWatch Logs Insights ने शोधता येतात आणि त्यांचे metrics आणि alarms बनवता येतात.',
      },
      {
        en: 'S3 notifications are delivered at least once, so a rare duplicate is normal, and a failed async invocation is retried twice. The handler must be idempotent: running it twice on the same input leaves the same result. Here, deterministic output keys mean a rerun overwrites rather than adds, and the clean file carries the source ETag in its metadata: if head_object finds the same ETag, the work is done, so skip it. A new upload has a new ETag and is processed again. At scale teams use a DynamoDB conditional write or the Powertools idempotency utility for the same idea.',
        mr: 'S3 notifications किमान एकदा दिली जातात, म्हणून कधीतरी duplicate येणं सामान्य आहे, आणि fail झालेलं async invocation दोनदा retry होतं. handler idempotent हवा: तोच input दोनदा चालवला तरी निकाल तोच. इथे ठरलेल्या output keys मुळे पुन्हा चालवलं तरी overwrite होतं, भर पडत नाही, आणि clean file च्या metadata मध्ये source ETag असतो: head_object ला तोच ETag सापडला तर काम झालं आहे, म्हणून वगळा. नव्या upload चा ETag नवा असतो आणि ती पुन्हा process होते. मोठ्या प्रमाणावर teams हीच कल्पना DynamoDB conditional write किंवा Powertools idempotency utility ने करतात.',
      },
      {
        en: 'Order your writes so a failure never leaves a lie behind: quarantine first, clean file last, because the clean file is the "done" marker. If a write fails (AccessDenied, throttling), let the exception escape: Lambda marks the invocation failed, retries it, and finally sends it to the on-failure destination or DLQ. A swallowed error is a silent data loss. Finally, never loop: write to another bucket, filter the trigger by prefix and suffix, and still check in code that the event is a raw .csv before doing anything. Lambda\'s recursive loop detection stops S3 loops after about 16 invocations, which is only a safety net; the design itself must prevent loops.',
        mr: 'writes असे क्रमाने लावा की failure नंतर कधीच खोटं मागे राहणार नाही: आधी quarantine, शेवटी clean file, कारण clean file हाच "done" marker. write fail झालं (AccessDenied, throttling) तर exception बाहेर जाऊ द्या: Lambda invocation failed ठरवतं, retry करतं, आणि शेवटी on-failure destination किंवा DLQ ला पाठवतं. गिळलेला error म्हणजे गुपचूप data loss. शेवटी, कधीच loop नको: दुसऱ्या bucket मध्ये लिहा, trigger prefix आणि suffix ने filter करा, आणि तरीही काहीही करण्याआधी code मध्ये event raw .csv चा आहे का ते तपासा. Lambda चं recursive loop detection S3 loops सुमारे 16 invocations नंतर थांबवतं, ते फक्त सुरक्षा जाळं आहे; loops टाळणं design चं काम आहे.',
      },
    ],
    syntax: {
      template: `def lambda_handler(event, context):
    lake = os.environ['LAKE_BUCKET']
    raw_prefix = os.environ['RAW_PREFIX']
    for bucket, key, etag in parse_s3_event(event):        # unquote_plus every key
        if bucket == lake or not key.startswith(raw_prefix) or not key.endswith('.csv'):
            continue                                       # never process our own output
        plan = plan_keys(key)                              # .../dt=2026-11-24/store=pune-camp/...
        if already_done(lake, plan['clean_key'], etag):    # same ETag already written
            continue
        good, bad = validate_rows(read_text(bucket, key))
        put(lake, plan['quarantine_key'], bad)             # first
        put(lake, plan['clean_key'], good, etag)           # last: the "done" marker
        log('INFO', 'file processed', rows=..., good=..., quarantined=...)`,
      parts: [
        { code: "urllib.parse.unquote_plus(record['s3']['object']['key'])", means: { en: 'S3 sends keys URL-encoded: + is a space, %26 is &', mr: 'S3 keys URL-encoded पाठवतं: + म्हणजे space, %26 म्हणजे &' } },
        { code: "f'clean/orders/dt={dt}/store={store}/orders.csv'", means: { en: 'a Hive-style partition: tools read dt and store as columns and prune folders', mr: 'Hive-style partition: tools dt आणि store columns म्हणून वाचतात आणि folders वगळतात' } },
        { code: "Metadata={'source-etag': etag}", means: { en: 'records which input produced this output: the idempotency check', mr: 'हा output कोणत्या input मधून आला त्याची नोंद: idempotency check' } },
        { code: 's3.head_object(...)  # 404 means not done yet', means: { en: 'reads metadata without downloading; needs s3:GetObject (and gives 403 instead of 404 without s3:ListBucket)', mr: 'download न करता metadata वाचतो; s3:GetObject लागतो (आणि s3:ListBucket नसेल तर 404 ऐवजी 403 देतो)' } },
        { code: "bucket == lake or not key.startswith(raw_prefix)", means: { en: 'the loop guard: ignore events from our own output', mr: 'loop guard: आपल्याच output मधून आलेल्या events कडे दुर्लक्ष' } },
        { code: "print(json.dumps({'level': 'INFO', ...}))", means: { en: 'one structured log line per file, easy to search and alarm on', mr: 'प्रत्येक file साठी एक structured log ओळ, शोधायला आणि alarm लावायला सोपी' } },
      ],
      example: [
        { code: "'raw/orders/2026/11/24/Pune+Camp.csv'  ->  'Pune Camp.csv'", note: { en: 'reading the address on the bag', mr: 'पिशवीवरचा पत्ता वाचणं' } },
        { code: "{'order_id': 'PC-1003', 'qty': 'abc', 'reason': 'bad qty'}", note: { en: 'a torn letter in the tray, with its slip', mr: 'फाटलेलं पत्र tray मध्ये, चिठ्ठीसह' } },
        { code: "clean/orders/dt=2026-11-24/store=pune-camp/orders.csv", note: { en: 'the bag for that date and pin code', mr: 'त्या तारखेची आणि pin code ची पिशवी' } },
        { code: "{'status': 'skipped', 'key': 'raw/orders/.../Pune Camp.csv'}", note: { en: 'already in the register, not entered twice', mr: 'register मध्ये आधीच, दोनदा नोंद नाही' } },
        { code: '{"msg": "file processed", "rows": 8, "good": 3, "quarantined": 5}', note: { en: 'the supervisor\'s 6 a.m. line', mr: 'supervisor ची सकाळी 6 ची ओळ' } },
      ],
      pitfall: { en: 'The two classic night-shift bugs: try/except around the writes that prints the error and returns success (the event is never retried and the file silently disappears from the dashboard), and writing the clean file first (if the next write fails, the clean file exists, the idempotency check says "done", and the bad rows are lost forever).', mr: 'रात्रपाळीचे दोन क्लासिक bugs: writes भोवती try/except जो error print करून success परत देतो (event कधीच retry होत नाही आणि file गुपचूप dashboard वरून गायब होते), आणि clean file आधी लिहिणं (पुढचं write fail झालं तर clean file असते, idempotency check "done" म्हणतो, आणि खराब rows कायमच्या हरवतात).' },
    },
    practice: {
      intro: { en: 'Boss fight: five steps, two hints each, every step re-run on hidden nights. The function is clean-orders (512 MB, 30 s timeout) with LAKE_BUCKET=chaicart-lake and RAW_PREFIX=raw/orders/. The lab sends real-shaped S3 events as test events; open the Lambda logs tab after every run.', mr: 'Boss fight: पाच पायऱ्या, प्रत्येकीला दोन hints, प्रत्येक पायरी लपवलेल्या रात्रींवर पुन्हा चालते. function clean-orders आहे (512 MB, 30 s timeout), LAKE_BUCKET=chaicart-lake आणि RAW_PREFIX=raw/orders/ सह. lab खऱ्या आकाराचे S3 events test events म्हणून पाठवतो; प्रत्येक run नंतर Lambda logs टॅब उघडा.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'Route. Write parse_s3_event(event): for every record return (bucket, decoded key, eTag). Write plan_keys(key) for keys like raw/orders/2026/11/24/Pune Camp.csv: dt is "2026-11-24", store is the file name without .csv, lowercased, with every run of non-letters/digits turned into "-" and trimmed ("pune-camp"); return {"dt", "store", "clean_key": "clean/orders/dt=<dt>/store=<store>/orders.csv", "quarantine_key": "quarantine/orders/dt=<dt>/store=<store>/rejects.csv"}. The handler already returns one plan per record.', mr: 'Route. parse_s3_event(event) लिहा: प्रत्येक record साठी (bucket, decode केलेली key, eTag) परत द्या. raw/orders/2026/11/24/Pune Camp.csv सारख्या keys साठी plan_keys(key) लिहा: dt म्हणजे "2026-11-24", store म्हणजे .csv शिवाय file चं नाव, lowercase, अक्षरं/अंक नसलेल्या प्रत्येक गटाचा "-" करून आणि कडा trim करून ("pune-camp"); {"dt", "store", "clean_key": "clean/orders/dt=<dt>/store=<store>/orders.csv", "quarantine_key": "quarantine/orders/dt=<dt>/store=<store>/rejects.csv"} परत द्या. handler आधीच प्रत्येक record साठी एक plan परत देतो.' },
          aws: { buckets: { [RAW]: RAW_ALL }, lambda: { ...FN, events: [s3ev(RAW, PUNE_KEY, E_PUNE)] } },
          starter: `${B_HEAD}
def parse_s3_event(event):
    files = []
    # TODO: for every record: bucket name, key decoded with urllib.parse.unquote_plus, eTag
    return files

def plan_keys(key):
    # TODO: raw/orders/2026/11/24/Pune Camp.csv -> dt '2026-11-24', store 'pune-camp',
    #       clean_key and quarantine_key with dt=.../store=... partitions
    return {}
${H1}`,
          solution: `${B_HEAD}${B_PARSE}${H1}`,
          checks: [
            ALL_OK,
            { expr: `parse_s3_event(s3_event('${RAW}', 'raw/orders/2026/11/24/Pune Camp.csv', 10, 'abc')) == [('${RAW}', 'raw/orders/2026/11/24/Pune Camp.csv', 'abc')]`, message: { en: 'parse_s3_event should return [(bucket, decoded key, eTag)]: "Pune+Camp.csv" must come back as "Pune Camp.csv".', mr: 'parse_s3_event ने [(bucket, decode केलेली key, eTag)] द्यायला हवं: "Pune+Camp.csv" परत "Pune Camp.csv" व्हायला हवं.' } },
            { expr: `plan_keys('${PUNE_KEY}') == {'dt': '2026-11-24', 'store': 'pune-camp', 'clean_key': '${CLEAN_PUNE}', 'quarantine_key': '${QUAR_PUNE}'}`, message: { en: `plan_keys("${PUNE_KEY}") should give dt 2026-11-24, store pune-camp, clean_key ${CLEAN_PUNE} and quarantine_key ${QUAR_PUNE}.`, mr: `plan_keys("${PUNE_KEY}") ने dt 2026-11-24, store pune-camp, clean_key ${CLEAN_PUNE} आणि quarantine_key ${QUAR_PUNE} द्यायला हवं.` } },
            { expr: `lambda_invocations[0]['result'][0]['clean_key'] == '${CLEAN_PUNE}'`, message: { en: 'The handler\'s plan for the real event is wrong. Open the Lambda logs: the "file received" line shows the key it saw.', mr: 'खऱ्या event साठी handler चा plan चुकीचा आहे. Lambda logs उघडा: "file received" ओळ त्याला दिसलेली key दाखवते.' } },
          ],
          variants: [
            {
              label: { en: 'Kothrud & Baner: spaces and an ampersand in the name', mr: 'Kothrud & Baner: नावात spaces आणि ampersand' },
              aws: { buckets: { [RAW]: RAW_ALL }, lambda: { ...FN, events: [s3ev(RAW, KB_KEY, E_KB)] } },
              checks: [ALL_OK, { expr: `lambda_invocations[0]['result'][0]['clean_key'] == '${CLEAN_KB}' and lambda_invocations[0]['result'][0]['dt'] == '2026-11-25'`, message: { en: `"Kothrud+%26+Baner.csv" should become store "kothrud-baner" and ${CLEAN_KB}. Decode with unquote_plus, then replace runs of other characters with one "-".`, mr: `"Kothrud+%26+Baner.csv" चं store "kothrud-baner" आणि ${CLEAN_KB} व्हायला हवं. unquote_plus ने decode करा, मग इतर अक्षरांच्या गटांचा एक "-" करा.` } }],
            },
            {
              label: { en: 'One event with two records', mr: 'दोन records असलेला एक event' },
              aws: { buckets: { [RAW]: RAW_ALL }, lambda: { ...FN, events: [{ Records: [...s3ev(RAW, PUNE_KEY, E_PUNE).Records, ...s3ev(RAW, BIG_KEY, E_BIG).Records] }] } },
              checks: [ALL_OK, { expr: `[p['store'] for p in lambda_invocations[0]['result']] == ['pune-camp', 'hinjewadi-phase-1']`, message: { en: 'An event can carry more than one record. Loop over every item in event["Records"].', mr: 'एका event मध्ये एकापेक्षा जास्त records असू शकतात. event["Records"] मधल्या प्रत्येक item वर loop करा.' } }],
            },
          ],
          hints: [
            { en: 'parse: for record in event["Records"]: bucket = record["s3"]["bucket"]["name"], key = urllib.parse.unquote_plus(record["s3"]["object"]["key"]), etag = record["s3"]["object"].get("eTag", ""). plan: parts = key.split("/"); dt = "-".join(parts[2:5]); name = parts[-1].rsplit(".", 1)[0]; store = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-").', mr: 'parse: for record in event["Records"]: bucket = record["s3"]["bucket"]["name"], key = urllib.parse.unquote_plus(record["s3"]["object"]["key"]), etag = record["s3"]["object"].get("eTag", ""). plan: parts = key.split("/"); dt = "-".join(parts[2:5]); name = parts[-1].rsplit(".", 1)[0]; store = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-").' },
            { en: "    for record in event['Records']:\n        bucket = record['s3']['bucket']['name']\n        key = urllib.parse.unquote_plus(record['s3']['object']['key'])\n        files.append((bucket, key, record['s3']['object'].get('eTag', '')))\n    return files\n\ndef plan_keys(key):\n    parts = key.split('/')\n    dt = '-'.join(parts[2:5])\n    name = parts[-1].rsplit('.', 1)[0]\n    store = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')\n    partition = f'dt={dt}/store={store}'\n    return {'dt': dt, 'store': store, 'clean_key': f'clean/orders/{partition}/orders.csv',\n            'quarantine_key': f'quarantine/orders/{partition}/rejects.csv'}", mr: "    for record in event['Records']:\n        bucket = record['s3']['bucket']['name']\n        key = urllib.parse.unquote_plus(record['s3']['object']['key'])\n        files.append((bucket, key, record['s3']['object'].get('eTag', '')))\n    return files\n\ndef plan_keys(key):\n    parts = key.split('/')\n    dt = '-'.join(parts[2:5])\n    name = parts[-1].rsplit('.', 1)[0]\n    store = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')\n    partition = f'dt={dt}/store={store}'\n    return {'dt': dt, 'store': store, 'clean_key': f'clean/orders/{partition}/orders.csv',\n            'quarantine_key': f'quarantine/orders/{partition}/rejects.csv'}" },
          ],
          successLine: { en: 'HIT! Every bag read correctly, ampersands and all, and every bag has its shelf.', mr: 'HIT! प्रत्येक पिशवी बरोबर वाचली, ampersand सकट, आणि प्रत्येक पिशवीला तिची फळी मिळाली.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Validate. Write validate_rows(text) returning (good, bad). Check each row in this order and keep the first problem: order_id empty is "missing order_id"; qty not a whole number or <= 0 is "bad qty"; amount not a number (empty too) or <= 0 is "bad amount"; an order_id already kept is "duplicate order_id". A good row is {"order_id", "item" (stripped), "qty" (int), "amount" (text with 2 decimals, "40.00"), "paid_at"}. A bad row is the raw row dict plus "reason". Short rows (missing cells come as None) must not crash. The handler reads the object and reports the counts.', mr: 'Validate. validate_rows(text) लिहा जे (good, bad) परत देतं. प्रत्येक row या क्रमाने तपासा आणि पहिली समस्या ठेवा: order_id रिकामा म्हणजे "missing order_id"; qty पूर्ण संख्या नसेल किंवा <= 0 असेल तर "bad qty"; amount संख्या नसेल (रिकामा सुद्धा) किंवा <= 0 असेल तर "bad amount"; आधीच ठेवलेला order_id म्हणजे "duplicate order_id". चांगली row म्हणजे {"order_id", "item" (strip केलेला), "qty" (int), "amount" (2 decimals चा text, "40.00"), "paid_at"}. खराब row म्हणजे raw row dict अधिक "reason". छोट्या rows (नसलेले cells None म्हणून येतात) मुळे crash होऊ नये. handler object वाचून counts सांगतो.' },
          aws: { buckets: { [RAW]: RAW_ALL }, lambda: { ...FN, events: [s3ev(RAW, PUNE_KEY, E_PUNE)] } },
          starter: `${B_HEAD}${B_PARSE}
def validate_rows(text):
    good, bad, seen = [], [], set()
    for row in csv.DictReader(io.StringIO(text)):
        # TODO: find the first reason (missing order_id, bad qty, bad amount, duplicate order_id)
        #       bad: dict(row, reason=reason); good: clean dict, and remember the order_id
        pass
    return good, bad
${H2}`,
          solution: `${B_HEAD}${B_PARSE}${B_VALIDATE}${H2}`,
          checks: [
            ALL_OK,
            { expr: `lambda_invocations[0]['result'] == [{'key': '${PUNE_KEY}', 'good': 3, 'quarantined': 5}]`, message: { en: 'Pune Camp has 8 rows: 3 good and 5 bad.', mr: 'Pune Camp मध्ये 8 rows: 3 चांगल्या आणि 5 खराब.' } },
            { expr: `[b['reason'] for b in validate_rows(s3_text('${RAW}', '${PUNE_KEY}'))[1]] == ['bad qty', 'bad amount', 'missing order_id', 'duplicate order_id', 'bad amount']`, message: { en: 'The reasons for Pune Camp should be, in file order: bad qty, bad amount, missing order_id, duplicate order_id, bad amount.', mr: 'Pune Camp ची कारणं file च्या क्रमाने अशी हवीत: bad qty, bad amount, missing order_id, duplicate order_id, bad amount.' } },
            { expr: `validate_rows(s3_text('${RAW}', '${PUNE_KEY}'))[0][0] == {'order_id': 'PC-1001', 'item': 'Masala Chai', 'qty': 2, 'amount': '40.00', 'paid_at': '2026-11-24 07:05'}`, message: { en: 'The first good row should be {"order_id": "PC-1001", "item": "Masala Chai", "qty": 2, "amount": "40.00", "paid_at": "2026-11-24 07:05"}.', mr: 'पहिली चांगली row {"order_id": "PC-1001", "item": "Masala Chai", "qty": 2, "amount": "40.00", "paid_at": "2026-11-24 07:05"} हवी.' } },
            { expr: "validate_rows('order_id,item,qty,amount,paid_at\\nX-1,Chai,1\\n')[1][0]['reason'] == 'bad amount'", message: { en: 'A short row ("X-1,Chai,1") has amount None: catch TypeError as well as ValueError and call it "bad amount".', mr: 'छोट्या row ("X-1,Chai,1") मध्ये amount None असतो: ValueError सोबत TypeError सुद्धा पकडा आणि त्याला "bad amount" म्हणा.' } },
          ],
          variants: [
            {
              label: { en: 'Hinjewadi Phase 1: a file ten times bigger', mr: 'Hinjewadi Phase 1: दहापट मोठी file' },
              aws: { buckets: { [RAW]: RAW_ALL }, lambda: { ...FN, events: [s3ev(RAW, BIG_KEY, E_BIG, 1700)] } },
              checks: [ALL_OK, { expr: `lambda_invocations[0]['result'] == [{'key': '${BIG_KEY}', 'good': 36, 'quarantined': 5}]`, message: { en: 'Hinjewadi has 41 rows: 36 good, 4 with an empty amount and 1 duplicate order_id.', mr: 'Hinjewadi मध्ये 41 rows: 36 चांगल्या, 4 रिकाम्या amount च्या आणि 1 duplicate order_id.' } }],
            },
            {
              label: { en: 'Kothrud & Baner: a zero quantity', mr: 'Kothrud & Baner: शून्य quantity' },
              aws: { buckets: { [RAW]: RAW_ALL }, lambda: { ...FN, events: [s3ev(RAW, KB_KEY, E_KB)] } },
              checks: [ALL_OK, { expr: `lambda_invocations[0]['result'] == [{'key': '${KB_KEY}', 'good': 3, 'quarantined': 1}]`, message: { en: 'Kothrud & Baner should give 3 good and 1 bad (qty 0 is "bad qty").', mr: 'Kothrud & Baner ने 3 चांगल्या आणि 1 खराब द्यायला हवी (qty 0 म्हणजे "bad qty").' } }],
            },
          ],
          hints: [
            { en: 'Write a helper check_row(row, seen) that returns a reason or None, with early returns: order_id = (row.get("order_id") or "").strip(); then try: qty = int(row["qty"]) except (TypeError, ValueError): return "bad qty"; the same with float(row["amount"]); last, if order_id in seen: return "duplicate order_id".', mr: 'check_row(row, seen) हा helper लिहा जो कारण किंवा None देतो, early returns सह: order_id = (row.get("order_id") or "").strip(); मग try: qty = int(row["qty"]) except (TypeError, ValueError): return "bad qty"; float(row["amount"]) साठी तसंच; शेवटी, if order_id in seen: return "duplicate order_id".' },
            { en: "        reason = check_row(row, seen)\n        if reason:\n            bad.append(dict(row, reason=reason))\n        else:\n            seen.add(row['order_id'].strip())\n            good.append({'order_id': row['order_id'].strip(), 'item': row['item'].strip(),\n                         'qty': int(row['qty']), 'amount': f\"{float(row['amount']):.2f}\",\n                         'paid_at': row['paid_at'].strip()})", mr: "        reason = check_row(row, seen)\n        if reason:\n            bad.append(dict(row, reason=reason))\n        else:\n            seen.add(row['order_id'].strip())\n            good.append({'order_id': row['order_id'].strip(), 'item': row['item'].strip(),\n                         'qty': int(row['qty']), 'amount': f\"{float(row['amount']):.2f}\",\n                         'paid_at': row['paid_at'].strip()})" },
          ],
          successLine: { en: 'HIT! Every letter read, every torn one set aside with a slip. 8 in = 3 + 5.', mr: 'HIT! प्रत्येक पत्र वाचलं, प्रत्येक फाटलेलं चिठ्ठीसह बाजूला. 8 आले = 3 + 5.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Load and log. In the handler: read LAKE_BUCKET from os.environ, read the object, validate, write the quarantine CSV (HEADER + ["reason"]) to quarantine_key and the clean CSV (HEADER) to clean_key in the lake bucket, the clean one with Metadata={"source-etag": etag}. to_csv(rows, fields) is given. Then log one JSON line with log("INFO", "file processed", ...) carrying status "processed", key, rows, good, quarantined, clean_key and request_id (context.aws_request_id), and return the list of summaries. Never touch the raw file. Hidden runs: the staging lake, and the Kothrud key.', mr: 'Load आणि log. handler मध्ये: LAKE_BUCKET os.environ मधून वाचा, object वाचा, validate करा, lake bucket मध्ये quarantine CSV (HEADER + ["reason"]) quarantine_key वर आणि clean CSV (HEADER) clean_key वर लिहा, clean वाली Metadata={"source-etag": etag} सह. to_csv(rows, fields) दिलेलं आहे. मग log("INFO", "file processed", ...) ने एक JSON ओळ log करा ज्यात status "processed", key, rows, good, quarantined, clean_key आणि request_id (context.aws_request_id) असतील, आणि summaries ची list परत द्या. raw file ला कधीच हात लावू नका. लपवलेले runs: staging lake, आणि Kothrud key.' },
          aws: { buckets: { [RAW]: RAW_ALL, [LAKE]: {} }, lambda: { ...FN, events: [s3ev(RAW, PUNE_KEY, E_PUNE)] } },
          starter: `${B_HEAD}${B_PARSE}${B_VALIDATE}${B_TO_CSV}
def lambda_handler(event, context):
    results = []
    for bucket, key, etag in parse_s3_event(event):
        plan = plan_keys(key)
        text = s3.get_object(Bucket=bucket, Key=key)['Body'].read().decode('utf-8')
        good, bad = validate_rows(text)
        # TODO: lake = os.environ['LAKE_BUCKET']
        # TODO: put the quarantine CSV, then the clean CSV with Metadata={'source-etag': etag}
        # TODO: summary dict, log('INFO', 'file processed', **summary), results.append(summary)
    return results
`,
          solution: `${B_HEAD}${B_PARSE}${B_VALIDATE}${B_TO_CSV}${H3}`,
          checks: [
            ALL_OK,
            { expr: `s3_text('${LAKE}', '${CLEAN_PUNE}').splitlines() == ['order_id,item,qty,amount,paid_at', 'PC-1001,Masala Chai,2,40.00,2026-11-24 07:05', 'PC-1002,Cutting Chai,1,15.00,2026-11-24 07:09', 'PC-1005,Ginger Chai,3,75.00,2026-11-24 07:31']`, message: { en: `chaicart-lake/${CLEAN_PUNE} should hold the header and the 3 good rows (amounts like 40.00).`, mr: `chaicart-lake/${CLEAN_PUNE} मध्ये header आणि 3 चांगल्या rows हव्यात (amounts 40.00 सारखे).` } },
            { expr: `s3_text('${LAKE}', '${QUAR_PUNE}').splitlines()[0] == 'order_id,item,qty,amount,paid_at,reason' and len(s3_text('${LAKE}', '${QUAR_PUNE}').splitlines()) == 6`, message: { en: `chaicart-lake/${QUAR_PUNE} should hold the header (with reason) and the 5 bad rows.`, mr: `chaicart-lake/${QUAR_PUNE} मध्ये header (reason सह) आणि 5 खराब rows हव्यात.` } },
            { expr: `s3_bucket('${LAKE}')['objects']['${CLEAN_PUNE}'][-1]['meta'].get('source-etag') == '${E_PUNE}'`, message: { en: 'Put the clean file with Metadata={"source-etag": etag} (the eTag from the event). The next step needs it.', mr: 'clean file Metadata={"source-etag": etag} सह लिहा (event मधला eTag). पुढच्या पायरीला तो लागतो.' } },
            { expr: "any(l.startswith('{') and json.loads(l).get('msg') == 'file processed' and json.loads(l).get('good') == 3 and json.loads(l).get('quarantined') == 5 and json.loads(l).get('rows') == 8 for l in lambda_invocations[0]['logs'])", message: { en: 'Log one JSON line per file with msg "file processed", rows 8, good 3 and quarantined 5 (use the log helper).', mr: 'प्रत्येक file साठी msg "file processed", rows 8, good 3 आणि quarantined 5 असलेली एक JSON ओळ log करा (log helper वापरा).' } },
            { expr: `s3_keys('${RAW}') == sorted(${JSON.stringify(Object.keys(RAW_ALL))})`, message: { en: 'The raw bucket must stay untouched: write only to the lake.', mr: 'raw bucket ला हात लागता कामा नये: फक्त lake मध्ये लिहा.' } },
          ],
          mustUse: [{ pattern: "os\\.environ\\[['\"]LAKE_BUCKET", message: { en: 'Read the lake bucket with os.environ["LAKE_BUCKET"].', mr: 'lake bucket os.environ["LAKE_BUCKET"] ने वाचा.' } }],
          mustNotUse: [{ pattern: "['\"]chaicart-lake['\"]", message: { en: 'Do not write the lake bucket name in the code: it comes from LAKE_BUCKET.', mr: 'lake bucket चं नाव code मध्ये लिहू नका: ते LAKE_BUCKET मधून येतं.' } }],
          variants: [
            {
              label: { en: 'Staging: LAKE_BUCKET is chaicart-lake-staging', mr: 'Staging: LAKE_BUCKET म्हणजे chaicart-lake-staging' },
              aws: { buckets: { [RAW]: RAW_ALL, 'chaicart-lake-staging': {} }, lambda: { ...FN, env: { ...ENV, LAKE_BUCKET: 'chaicart-lake-staging' }, events: [s3ev(RAW, PUNE_KEY, E_PUNE)] } },
              checks: [ALL_OK, { expr: `s3_keys('chaicart-lake-staging') == ['${CLEAN_PUNE}', '${QUAR_PUNE}']`, message: { en: 'With LAKE_BUCKET=chaicart-lake-staging both files must go to the staging lake.', mr: 'LAKE_BUCKET=chaicart-lake-staging असताना दोन्ही files staging lake मध्ये जायला हव्यात.' } }],
            },
            {
              label: { en: 'Kothrud & Baner', mr: 'Kothrud & Baner' },
              aws: { buckets: { [RAW]: RAW_ALL, [LAKE]: {} }, lambda: { ...FN, events: [s3ev(RAW, KB_KEY, E_KB)] } },
              checks: [ALL_OK, { expr: `len(s3_text('${LAKE}', '${CLEAN_KB}').splitlines()) == 4 and lambda_invocations[0]['result'][0]['quarantined'] == 1`, message: { en: `Kothrud & Baner should write ${CLEAN_KB} with 3 good rows and report 1 quarantined.`, mr: `Kothrud & Baner ने 3 चांगल्या rows सह ${CLEAN_KB} लिहायला हवं आणि 1 quarantined सांगायला हवं.` } }],
            },
          ],
          hints: [
            { en: 'lake = os.environ["LAKE_BUCKET"] at the start of the handler. s3.put_object(Bucket=lake, Key=plan["quarantine_key"], Body=to_csv(bad, HEADER + ["reason"])), then the same for the clean file with Body=to_csv(good, HEADER) and Metadata={"source-etag": etag}.', mr: 'handler च्या सुरुवातीला lake = os.environ["LAKE_BUCKET"]. s3.put_object(Bucket=lake, Key=plan["quarantine_key"], Body=to_csv(bad, HEADER + ["reason"])), मग clean file साठी तसंच Body=to_csv(good, HEADER) आणि Metadata={"source-etag": etag} सह.' },
            { en: "        s3.put_object(Bucket=lake, Key=plan['quarantine_key'], Body=to_csv(bad, HEADER + ['reason']))\n        s3.put_object(Bucket=lake, Key=plan['clean_key'], Body=to_csv(good, HEADER), Metadata={'source-etag': etag})\n        summary = {'status': 'processed', 'key': key, 'rows': len(good) + len(bad), 'good': len(good),\n                   'quarantined': len(bad), 'clean_key': plan['clean_key'], 'request_id': context.aws_request_id}\n        log('INFO', 'file processed', **summary)\n        results.append(summary)", mr: "        s3.put_object(Bucket=lake, Key=plan['quarantine_key'], Body=to_csv(bad, HEADER + ['reason']))\n        s3.put_object(Bucket=lake, Key=plan['clean_key'], Body=to_csv(good, HEADER), Metadata={'source-etag': etag})\n        summary = {'status': 'processed', 'key': key, 'rows': len(good) + len(bad), 'good': len(good),\n                   'quarantined': len(bad), 'clean_key': plan['clean_key'], 'request_id': context.aws_request_id}\n        log('INFO', 'file processed', **summary)\n        results.append(summary)" },
          ],
          successLine: { en: 'HIT! Clean bags on the lake shelf, torn letters in the tray, one line in the register.', mr: 'HIT! साफ पिशव्या lake च्या फळीवर, फाटलेली पत्रं tray मध्ये, register मध्ये एक ओळ.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Idempotent and honest. Tonight S3 delivers the Pune Camp event twice, and the lake has versioning on. Write already_done(lake, clean_key, etag): head_object the clean key; a "404" (or NoSuchKey) error means False, any other error is raised; otherwise True when its Metadata "source-etag" equals etag. In the handler, skip with status "skipped" when it is done. Also fix Theo\'s two bugs in the writes: they are in the wrong order and wrapped in a try/except that hides failures. Hidden nights: a corrected re-upload (new ETag, must be processed again) and a missing s3:PutObject permission on quarantine/ (the invocation must fail and no clean file may exist).', mr: 'Idempotent आणि प्रामाणिक. आज रात्री S3 Pune Camp चा event दोनदा देतं, आणि lake वर versioning चालू आहे. already_done(lake, clean_key, etag) लिहा: clean key वर head_object; "404" (किंवा NoSuchKey) error म्हणजे False, इतर कोणताही error raise करा; नाहीतर त्याचा Metadata "source-etag" etag बरोबर असेल तेव्हा True. handler मध्ये काम झालं असेल तर status "skipped" सह वगळा. writes मधले Theo चे दोन bugs सुद्धा दुरुस्त करा: ते चुकीच्या क्रमाने आहेत आणि failures लपवणाऱ्या try/except मध्ये गुंडाळलेले आहेत. लपवलेल्या रात्री: दुरुस्त केलेली पुन्हा upload (नवा ETag, पुन्हा process व्हायलाच हवी) आणि quarantine/ वर हरवलेली s3:PutObject permission (invocation fail व्हायलाच हवं आणि एकही clean file असता कामा नये).' },
          aws: { buckets: { [RAW]: RAW_ALL, [LAKE]: {} }, bucketConfig: { [LAKE]: { versioning: 'Enabled' } }, lambda: { ...FN, events: [s3ev(RAW, PUNE_KEY, E_PUNE), s3ev(RAW, PUNE_KEY, E_PUNE)] } },
          allowLambdaErrors: true,
          starter: `${B_HEAD}${B_PARSE}${B_VALIDATE}${B_TO_CSV}
def already_done(lake, clean_key, etag):
    # TODO: head_object the clean key; '404' means not done; same source-etag means done
    return False

def lambda_handler(event, context):
    lake = os.environ['LAKE_BUCKET']
    results = []
    for bucket, key, etag in parse_s3_event(event):
        plan = plan_keys(key)
        if already_done(lake, plan['clean_key'], etag):
            log('INFO', 'skipped: already processed', key=key, etag=etag)
            results.append({'status': 'skipped', 'key': key})
            continue
        text = s3.get_object(Bucket=bucket, Key=key)['Body'].read().decode('utf-8')
        good, bad = validate_rows(text)
        try:
            s3.put_object(Bucket=lake, Key=plan['clean_key'], Body=to_csv(good, HEADER), ContentType='text/csv',
                          Metadata={'source-etag': etag})
            s3.put_object(Bucket=lake, Key=plan['quarantine_key'], Body=to_csv(bad, HEADER + ['reason']), ContentType='text/csv')
        except ClientError as e:
            log('ERROR', 'write failed', error=str(e))
        summary = {'status': 'processed', 'key': key, 'rows': len(good) + len(bad), 'good': len(good),
                   'quarantined': len(bad), 'clean_key': plan['clean_key'], 'request_id': context.aws_request_id}
        log('INFO', 'file processed', **summary)
        results.append(summary)
    return results
`,
          solution: `${B_HEAD}${B_PARSE}${B_VALIDATE}${B_TO_CSV}${B_DONE}${H4}`,
          checks: [
            ALL_OK,
            { expr: `${STATUSES} == ['processed', 'skipped']`, message: { en: 'The duplicate delivery should be skipped: statuses "processed" then "skipped".', mr: 'दुहेरी delivery वगळली जायला हवी: statuses आधी "processed" मग "skipped".' } },
            { expr: `s3_versions('${LAKE}', '${CLEAN_PUNE}') == 1`, message: { en: 'The duplicate event wrote the clean file again (the lake keeps versions, and there are 2). Skip when the stored source-etag matches.', mr: 'दुहेरी event ने clean file पुन्हा लिहिली (lake versions ठेवतो, आणि ते 2 आहेत). साठवलेला source-etag जुळला की वगळा.' } },
            { expr: `already_done('${LAKE}', 'clean/orders/dt=2026-01-01/store=none/orders.csv', 'x') is False`, message: { en: 'already_done must return False when the clean file does not exist (head_object raises ClientError with code "404").', mr: 'clean file नसेल तेव्हा already_done ने False द्यायला हवं (head_object "404" code सह ClientError देतो).' } },
          ],
          variants: [
            {
              label: { en: 'Pune Camp re-uploads a corrected file (new ETag)', mr: 'Pune Camp दुरुस्त file पुन्हा upload करतं (नवा ETag)' },
              aws: { buckets: { [RAW]: RAW_ALL, [LAKE]: {} }, bucketConfig: { [LAKE]: { versioning: 'Enabled' } }, lambda: { ...FN, events: [s3ev(RAW, PUNE_KEY, E_PUNE), s3ev(RAW, PUNE_KEY, E_PUNE_V2)] } },
              checks: [ALL_OK, { expr: `${STATUSES} == ['processed', 'processed'] and s3_versions('${LAKE}', '${CLEAN_PUNE}') == 2`, message: { en: 'A new upload has a new ETag and must be processed again. Compare the source-etag, do not just check that the file exists.', mr: 'नव्या upload चा ETag नवा असतो आणि ती पुन्हा process व्हायलाच हवी. source-etag तुलना करा, फक्त file आहे का एवढंच तपासू नका.' } }],
            },
            {
              label: { en: 'Missing permission: s3:PutObject denied on quarantine/', mr: 'हरवलेली permission: quarantine/ वर s3:PutObject नाकारलं' },
              aws: { buckets: { [RAW]: RAW_ALL, [LAKE]: {} }, deny: ['s3:PutObject@chaicart-lake/quarantine/*'], lambda: { ...FN, events: [s3ev(RAW, PUNE_KEY, E_PUNE)] } },
              checks: DENY_CHECKS,
            },
          ],
          hints: [
            { en: 'already_done: try: head = s3.head_object(Bucket=lake, Key=clean_key) except ClientError as e: if e.response["Error"]["Code"] in ("404", "NoSuchKey"): return False, else raise. Then return head["Metadata"].get("source-etag") == etag. In the handler, remove the try/except and put the quarantine write before the clean write.', mr: 'already_done: try: head = s3.head_object(Bucket=lake, Key=clean_key) except ClientError as e: if e.response["Error"]["Code"] in ("404", "NoSuchKey"): return False, नाहीतर raise. मग return head["Metadata"].get("source-etag") == etag. handler मध्ये try/except काढा आणि quarantine write clean write च्या आधी ठेवा.' },
            { en: "def already_done(lake, clean_key, etag):\n    try:\n        head = s3.head_object(Bucket=lake, Key=clean_key)\n    except ClientError as e:\n        if e.response['Error']['Code'] in ('404', 'NoSuchKey'):\n            return False\n        raise\n    return head['Metadata'].get('source-etag') == etag\n\n        # in the handler, no try/except:\n        s3.put_object(Bucket=lake, Key=plan['quarantine_key'], Body=to_csv(bad, HEADER + ['reason']), ContentType='text/csv')\n        s3.put_object(Bucket=lake, Key=plan['clean_key'], Body=to_csv(good, HEADER), ContentType='text/csv', Metadata={'source-etag': etag})", mr: "def already_done(lake, clean_key, etag):\n    try:\n        head = s3.head_object(Bucket=lake, Key=clean_key)\n    except ClientError as e:\n        if e.response['Error']['Code'] in ('404', 'NoSuchKey'):\n            return False\n        raise\n    return head['Metadata'].get('source-etag') == etag\n\n        # in the handler, no try/except:\n        s3.put_object(Bucket=lake, Key=plan['quarantine_key'], Body=to_csv(bad, HEADER + ['reason']), ContentType='text/csv')\n        s3.put_object(Bucket=lake, Key=plan['clean_key'], Body=to_csv(good, HEADER), ContentType='text/csv', Metadata={'source-etag': etag})" },
          ],
          successLine: { en: 'HIT! Scanned twice, entered once. And when the stamp is missing, the bag waits instead of lying.', mr: 'HIT! दोनदा scan, एकदाच नोंद. आणि शिक्का नसेल तेव्हा पिशवी खोटं न बोलता थांबते.' },
        },
        {
          kind: 'python',
          prompt: { en: 'The 2 a.m. run. Theo pointed a new trigger for the whole chaicart-lake bucket at clean-orders by mistake, and a manifest file (_manifest.json) also lands in raw/. Add the loop guard at the top of the loop: read RAW_PREFIX from os.environ; if the bucket is the lake, or the key does not start with RAW_PREFIX, or does not end with .csv, log a WARN line "ignored: not a raw order file", add {"status": "ignored", "key": key} and continue. Hidden nights replay everything at once: duplicates, spaces, the big file, the staging lake and the missing permission.', mr: 'रात्री 2 चा run. Theo ने चुकून संपूर्ण chaicart-lake bucket चा नवा trigger clean-orders कडे वळवला, आणि एक manifest file (_manifest.json) सुद्धा raw/ मध्ये येते. loop च्या सुरुवातीला loop guard जोडा: RAW_PREFIX os.environ मधून वाचा; bucket lake असेल, किंवा key RAW_PREFIX ने सुरू होत नसेल, किंवा .csv ने संपत नसेल, तर "ignored: not a raw order file" अशी WARN ओळ log करा, {"status": "ignored", "key": key} जोडा आणि continue. लपवलेल्या रात्री सगळं एकदम पुन्हा खेळतात: duplicates, spaces, मोठी file, staging lake आणि हरवलेली permission.' },
          aws: {
            buckets: { [RAW]: RAW_ALL, [LAKE]: {} },
            bucketConfig: { [LAKE]: { notifyPrefix: '' } },
            lambda: { ...FN, events: [s3ev(RAW, PUNE_KEY, E_PUNE), s3ev(RAW, MANIFEST_KEY, '1f3870be274f6c49b3e31a0c6728957f', 12)] },
          },
          allowLambdaErrors: true,
          starter: `${B_HEAD}${B_PARSE}${B_VALIDATE}${B_TO_CSV}${B_DONE}${H4}`.replace("    lake = os.environ['LAKE_BUCKET']\n", "    lake = os.environ['LAKE_BUCKET']\n    # TODO: raw_prefix = os.environ['RAW_PREFIX'] and a loop guard as the first thing inside the for loop\n"),
          solution: `${B_HEAD}${B_PARSE}${B_VALIDATE}${B_TO_CSV}${B_DONE}${H5}`,
          checks: [
            { expr: "not any(i['source'] == 'loop-detection' for i in lambda_invocations)", message: { en: 'Lambda stopped a recursive loop: the function processed its own output in the lake and kept writing. Ignore events from the lake bucket and anything outside RAW_PREFIX.', mr: 'Lambda ने recursive loop थांबवला: function ने lake मधला स्वतःचाच output process केला आणि लिहीत राहिलं. lake bucket कडून आलेले events आणि RAW_PREFIX बाहेरचं सगळं दुर्लक्षित करा.' } },
            ALL_OK,
            { expr: `${STATUSES} == ['processed', 'ignored', 'ignored', 'ignored']`, message: { en: 'Expected: Pune Camp processed, the manifest ignored, and the two lake events (your own quarantine and clean writes) ignored.', mr: 'अपेक्षित: Pune Camp processed, manifest ignored, आणि lake चे दोन events (तुमचे स्वतःचे quarantine आणि clean writes) ignored.' } },
            { expr: `s3_keys('${LAKE}') == ['${CLEAN_PUNE}', '${QUAR_PUNE}']`, message: { en: 'The lake should contain exactly the Pune Camp clean file and its rejects file, nothing else.', mr: 'lake मध्ये फक्त Pune Camp ची clean file आणि तिची rejects file हवी, बाकी काही नाही.' } },
          ],
          mustUse: [{ pattern: "os\\.environ\\[['\"]RAW_PREFIX", message: { en: 'Read the raw prefix with os.environ["RAW_PREFIX"].', mr: 'raw prefix os.environ["RAW_PREFIX"] ने वाचा.' } }],
          mustNotUse: [{ pattern: "['\"]chaicart-lake['\"]", message: { en: 'Compare with the lake from LAKE_BUCKET, not a hard-coded name.', mr: 'LAKE_BUCKET मधल्या lake शी तुलना करा, code मध्ये लिहिलेल्या नावाशी नाही.' } }],
          variants: [
            {
              label: { en: 'Kothrud twice, Hinjewadi big file, versioned lake, lake trigger on', mr: 'Kothrud दोनदा, Hinjewadi मोठी file, versioned lake, lake trigger चालू' },
              aws: {
                buckets: { [RAW]: RAW_ALL, [LAKE]: {} },
                bucketConfig: { [LAKE]: { versioning: 'Enabled', notifyPrefix: '' } },
                lambda: { ...FN, events: [s3ev(RAW, KB_KEY, E_KB), s3ev(RAW, BIG_KEY, E_BIG, 1700), s3ev(RAW, KB_KEY, E_KB)] },
              },
              checks: [
                { expr: "all(i['ok'] for i in lambda_invocations) and not any(i['source'] == 'loop-detection' for i in lambda_invocations)", message: { en: 'Every invocation should succeed and no loop may start.', mr: 'प्रत्येक invocation यशस्वी हवं आणि एकही loop सुरू होता कामा नये.' } },
                { expr: `${STATUSES}[:3] == ['processed', 'processed', 'skipped'] and s3_versions('${LAKE}', '${CLEAN_KB}') == 1`, message: { en: 'Kothrud, Hinjewadi, then the duplicate Kothrud event skipped (one version of its clean file).', mr: 'Kothrud, Hinjewadi, मग दुहेरी Kothrud event वगळला (त्याच्या clean file चं एकच version).' } },
                { expr: `len(s3_text('${LAKE}', '${CLEAN_BIG}').splitlines()) == 37`, message: { en: 'The Hinjewadi clean file should have the header and 36 good rows.', mr: 'Hinjewadi च्या clean file मध्ये header आणि 36 चांगल्या rows हव्यात.' } },
              ],
            },
            {
              label: { en: 'Staging lake with its own trigger', mr: 'स्वतःच्या trigger सह staging lake' },
              aws: {
                buckets: { [RAW]: RAW_ALL, 'chaicart-lake-staging': {} },
                bucketConfig: { 'chaicart-lake-staging': { notifyPrefix: '' } },
                lambda: { ...FN, env: { ...ENV, LAKE_BUCKET: 'chaicart-lake-staging' }, events: [s3ev(RAW, PUNE_KEY, E_PUNE)] },
              },
              checks: [{ expr: `all(i['ok'] for i in lambda_invocations) and s3_keys('chaicart-lake-staging') == ['${CLEAN_PUNE}', '${QUAR_PUNE}']`, message: { en: 'On staging the guard must use LAKE_BUCKET from the environment: two files, no loop.', mr: 'staging वर guard ने environment मधलं LAKE_BUCKET वापरायला हवं: दोन files, loop नाही.' } }],
            },
            {
              label: { en: 'Missing permission at 2 a.m., lake trigger on', mr: 'रात्री 2 ला हरवलेली permission, lake trigger चालू' },
              aws: { buckets: { [RAW]: RAW_ALL, [LAKE]: {} }, bucketConfig: { [LAKE]: { notifyPrefix: '' } }, deny: ['s3:PutObject@chaicart-lake/quarantine/*'], lambda: { ...FN, events: [s3ev(RAW, PUNE_KEY, E_PUNE)] } },
              checks: DENY_CHECKS,
            },
          ],
          hints: [
            { en: 'raw_prefix = os.environ["RAW_PREFIX"] next to lake. First line inside the for loop: if bucket == lake or not key.startswith(raw_prefix) or not key.endswith(".csv"): log a WARN, append {"status": "ignored", "key": key}, continue.', mr: 'lake शेजारी raw_prefix = os.environ["RAW_PREFIX"]. for loop मधली पहिली ओळ: if bucket == lake or not key.startswith(raw_prefix) or not key.endswith(".csv"): WARN log करा, {"status": "ignored", "key": key} append करा, continue.' },
            { en: "    raw_prefix = os.environ['RAW_PREFIX']\n    results = []\n    for bucket, key, etag in parse_s3_event(event):\n        if bucket == lake or not key.startswith(raw_prefix) or not key.endswith('.csv'):\n            log('WARN', 'ignored: not a raw order file', bucket=bucket, key=key)\n            results.append({'status': 'ignored', 'key': key})\n            continue", mr: "    raw_prefix = os.environ['RAW_PREFIX']\n    results = []\n    for bucket, key, etag in parse_s3_event(event):\n        if bucket == lake or not key.startswith(raw_prefix) or not key.endswith('.csv'):\n            log('WARN', 'ignored: not a raw order file', bucket=bucket, key=key)\n            results.append({'status': 'ignored', 'key': key})\n            continue" },
          ],
          successLine: { en: 'KNOCKOUT! Every bag sorted once, torn letters in the tray, nothing sorted twice, and the sorters never sort their own shelf.', mr: 'KNOCKOUT! प्रत्येक पिशवी एकदाच sort, फाटलेली पत्रं tray मध्ये, काहीही दोनदा नाही, आणि sorters कधीच स्वतःची फळी sort करत नाहीत.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'S3 delivers the same ObjectCreated event twice and both invocations succeed. Which design gives the same lake contents as a single delivery?', mr: 'S3 तोच ObjectCreated event दोनदा देतं आणि दोन्ही invocations यशस्वी होतात. कोणतं design एका delivery सारखाच lake देतं?' },
        options: [
          { en: 'Append the clean rows to one big orders.csv for the day', mr: 'दिवसाच्या एका मोठ्या orders.csv मध्ये साफ rows append करा' },
          { en: 'Name the output with the current timestamp so nothing is ever overwritten', mr: 'output ला सध्याच्या timestamp चं नाव द्या म्हणजे काहीच overwrite होणार नाही' },
          { en: 'Deterministic output keys from the input key, plus a check of the stored source ETag before writing', mr: 'input key वरून ठरलेल्या output keys, अधिक लिहिण्याआधी साठवलेल्या source ETag ची तपासणी' },
          { en: 'Set the function timeout to 30 minutes', mr: 'function चा timeout 30 मिनिटं करा' },
        ],
        answer: 2,
        explain: { en: 'Appending or timestamped names turn a duplicate into duplicated rows. A key derived from the input means a rerun lands on the same object, and the ETag check skips the work entirely. Timeout has nothing to do with duplicates.', mr: 'append किंवा timestamp ची नावं duplicate ला दुहेरी rows बनवतात. input वरून ठरलेल्या key मुळे पुन्हा चालवलं तरी तोच object येतो, आणि ETag check काम पूर्ण वगळतो. timeout चा duplicates शी संबंध नाही.' },
      },
      {
        q: { en: 'What does this code print, given the key in the event is "raw/orders/2026/11/25/Kothrud+%26+Baner.csv"?', mr: 'event मधली key "raw/orders/2026/11/25/Kothrud+%26+Baner.csv" असताना हा code काय print करतो?' },
        code: `import urllib.parse, re
key = urllib.parse.unquote_plus('raw/orders/2026/11/25/Kothrud+%26+Baner.csv')
name = key.split('/')[-1].rsplit('.', 1)[0]
print(re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-'))`,
        options: ['kothrud-baner', 'kothrud+%26+baner', 'kothrud---baner', 'Kothrud & Baner'],
        answer: 0,
        explain: { en: 'unquote_plus turns + into spaces and %26 into &, giving "Kothrud & Baner". Lowercased, the run " & " is one group of non-letters, so it becomes a single "-": kothrud-baner.', mr: 'unquote_plus + चे spaces आणि %26 चा & करतो, म्हणजे "Kothrud & Baner". lowercase केल्यावर " & " हा अक्षर नसलेला एक गट आहे, म्हणून त्याचा एकच "-" होतो: kothrud-baner.' },
      },
      {
        q: { en: 'The quarantine write fails with AccessDenied. What should the handler do?', mr: 'quarantine write AccessDenied देऊन fail होतं. handler ने काय करावं?' },
        options: [
          { en: 'Catch the error, log it and return success so the dashboard is not delayed', mr: 'error पकडा, log करा आणि success परत द्या म्हणजे dashboard उशिरा होणार नाही' },
          { en: 'Write the clean file anyway and skip the rejects', mr: 'तरीही clean file लिहा आणि rejects वगळा' },
          { en: 'Retry in a while True loop until it works', mr: 'चालेपर्यंत while True loop मध्ये retry करा' },
          { en: 'Let the exception escape before the clean file is written, so the invocation fails, is retried, and ends in the on-failure destination for a human to fix the role', mr: 'clean file लिहिण्याआधी exception बाहेर जाऊ द्या, म्हणजे invocation fail होतं, retry होतं, आणि role दुरुस्त करायला माणसासाठी on-failure destination मध्ये जातं' },
        ],
        answer: 3,
        explain: { en: 'A swallowed error loses data silently, a clean file without its rejects lies, and an endless retry burns money until the timeout. Failing loudly uses Lambda\'s own retries and DLQ or on-failure destination, and an alarm on Errors wakes someone.', mr: 'गिळलेला error गुपचूप data गमावतो, rejects शिवायची clean file खोटं सांगते, आणि अखंड retry timeout पर्यंत पैसे जाळतो. मोठ्याने fail होणं Lambda चे स्वतःचे retries आणि DLQ किंवा on-failure destination वापरतं, आणि Errors वरचा alarm कोणालातरी जागं करतो.' },
      },
      {
        q: { en: 'Why write output under clean/orders/dt=2026-11-24/store=pune-camp/ instead of clean/orders/pune-camp-24-11-2026.csv?', mr: 'clean/orders/pune-camp-24-11-2026.csv ऐवजी clean/orders/dt=2026-11-24/store=pune-camp/ खाली output का लिहायचा?' },
        options: [
          { en: 'S3 refuses keys with dashes in them', mr: 'S3 dashes असलेल्या keys नाकारतं' },
          { en: 'Hive-style partitions let Athena, Glue and Spark treat dt and store as columns and read only the folders a query needs', mr: 'Hive-style partitions मुळे Athena, Glue आणि Spark dt आणि store ला columns मानतात आणि query ला लागणारे folders च वाचतात' },
          { en: 'It makes the objects smaller', mr: 'त्यामुळे objects लहान होतात' },
          { en: 'Lambda can only write keys that contain an equals sign', mr: 'Lambda फक्त equals चिन्ह असलेल्या keys लिहू शकतं' },
        ],
        answer: 1,
        explain: { en: 'name=value folders are the convention query engines understand: WHERE dt = \'2026-11-24\' reads one folder instead of the whole lake (partition pruning), which is faster and cheaper. S3 itself does not care about the names.', mr: 'name=value folders ही query engines ना समजणारी पद्धत आहे: WHERE dt = \'2026-11-24\' पूर्ण lake ऐवजी एकच folder वाचतं (partition pruning), जे वेगवान आणि स्वस्त आहे. S3 ला स्वतः नावांनी काही फरक पडत नाही.' },
      },
    ],
    recap: { line: { en: 'Decode every record, plan partitioned keys, validate with reasons, quarantine first and clean last with the source ETag, skip what is done, fail loudly, ignore your own output, log one JSON line. The 2 a.m. file runs itself.', mr: 'प्रत्येक record decode करा, partitioned keys ठरवा, कारणांसह validate करा, आधी quarantine आणि शेवटी source ETag सह clean, झालेलं वगळा, मोठ्याने fail व्हा, स्वतःच्या output कडे दुर्लक्ष करा, एक JSON ओळ log करा. रात्री 2 ची file स्वतःच चालते.' }, icon: '🌙' },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: '>> double delivery: skipped. missing permission: failed loud, nothing half-written. my lake trigger: ignored. who taught you to read logs at 2 a.m.? ⌁⌁', mr: '>> दुहेरी delivery: वगळली. हरवलेली permission: मोठ्याने fail, काहीच अर्धवट लिहिलेलं नाही. माझा lake trigger: दुर्लक्षित. रात्री 2 ला logs वाचायला तुला कोणी शिकवलं? ⌁⌁' } },
      { who: 'gremlin', mood: 'smug', text: { en: '>> fine. next month chaicart sends you one file. a year of orders from every store. forty gigabytes. let us see your little function swallow that. ⌁', mr: '>> ठीक आहे. पुढच्या महिन्यात chaicart तुला एकच file पाठवणार. प्रत्येक store च्या वर्षभराच्या orders. चाळीस gigabytes. बघू तुझं छोटं function ते कसं गिळतं. ⌁' } },
      { who: 'sam', mood: 'happy', text: { en: 'The dashboard was ready at 2:01 a.m., the store managers fixed their rejects before opening, and Pune Camp appears exactly once. Thank you, {name}!', mr: 'dashboard रात्री 2:01 ला तयार होता, store managers नी दुकान उघडण्याआधी आपले rejects दुरुस्त केले, आणि Pune Camp बरोबर एकदाच दिसतं. धन्यवाद, {name}!' } },
      { who: 'rex', mood: 'neutral', text: { en: 'The Gremlin is right about the limits. One Lambda gets at most 10 GB of memory and 30 minutes. For forty gigabytes we split the work across many machines.', mr: 'मर्यादांबद्दल Gremlin बरोबर आहे. एका Lambda ला जास्तीत जास्त 10 GB memory आणि 30 मिनिटं मिळतात. चाळीस gigabytes साठी आपण काम अनेक machines मध्ये वाटतो.' } },
      { who: 'meera', mood: 'happy', text: { en: 'Rank up, {name}: Serverless Builder. Next chapter: PySpark and AWS Glue, where your validate-and-partition logic runs on a whole cluster at once.', mr: 'नवीन रँक, {name}: Serverless Builder. पुढचा अध्याय: PySpark आणि AWS Glue, जिथे तुझं validate-आणि-partition logic एकाच वेळी पूर्ण cluster वर चालतं.' } },
    ],
    interview: [
      {
        q: { en: 'Design an event-driven pipeline for daily order files that land in S3.', mr: 'S3 मध्ये येणाऱ्या रोजच्या order files साठी event-driven pipeline design करा.' },
        a: { en: 'I would use three zones: raw/ in one bucket (exactly what arrived, never changed), and clean/ plus quarantine/ in a lake bucket, both Hive-partitioned by date. An S3 event notification filtered on the raw prefix and .csv suffix triggers a Lambda (or goes through SQS or EventBridge first if I need buffering, fan-out or replay). The function decodes the key, validates every row with a reason, writes rejects first and the clean file last with the source ETag in metadata, and logs one JSON summary. Config comes from environment variables, the role can only read raw/ and write the lake, failures go to an on-failure destination, and alarms watch Errors, Throttles and the DLQ. At ChaiCart this gives a 6 a.m. dashboard with no servers to run. The gotcha I always mention: S3 delivers at least once, so idempotency is part of the design from day one.', mr: 'मी तीन zones वापरेन: एका bucket मध्ये raw/ (जे आलं तेच, कधीच न बदलणारं), आणि lake bucket मध्ये clean/ आणि quarantine/, दोन्ही तारखेनुसार Hive-partitioned. raw prefix आणि .csv suffix ने filter केलेलं S3 event notification Lambda ला trigger करतं (buffering, fan-out किंवा replay लागत असेल तर आधी SQS किंवा EventBridge मधून). function key decode करतं, प्रत्येक row कारणासह validate करतं, आधी rejects आणि शेवटी metadata मध्ये source ETag सह clean file लिहितं, आणि एक JSON summary log करतं. config environment variables मधून येतं, role फक्त raw/ वाचू आणि lake मध्ये लिहू शकतो, failures on-failure destination ला जातात, आणि alarms Errors, Throttles आणि DLQ वर लक्ष ठेवतात. ChaiCart मध्ये यामुळे कोणताही server न चालवता सकाळी 6 चा dashboard मिळतो. मी नेहमी सांगते तो gotcha: S3 किमान एकदा देतं, म्हणून idempotency पहिल्या दिवसापासून design चा भाग आहे.' },
      },
      {
        q: { en: 'A Lambda processed the same file twice. Why can that happen, and how do you fix it?', mr: 'एका Lambda ने तीच file दोनदा process केली. असं का होऊ शकतं, आणि ते कसं दुरुस्त करता?' },
        a: { en: 'Two normal reasons: S3 event notifications are designed for at-least-once delivery, so a rare duplicate event arrives, and asynchronous invocations are retried (twice by default) when the function errors or times out, even if it had already written part of its output. So the fix is to make the handler idempotent rather than hoping it runs once. I derive output keys deterministically from the input key, so a rerun overwrites the same object, and I store the source ETag (or version ID and sequencer) on the output and skip when it matches. For stronger guarantees across many functions I use a DynamoDB conditional put on an idempotency key, or the Powertools idempotency utility. At ChaiCart this stopped Pune Camp appearing twice on the dashboard. Gotcha: checking only "does the output exist" breaks corrected re-uploads; compare the ETag.', mr: 'दोन सामान्य कारणं: S3 event notifications किमान एकदा delivery साठी design केलेली आहेत, म्हणून कधीतरी duplicate event येतो, आणि function error देतं किंवा timeout होतं तेव्हा asynchronous invocations retry होतात (default नुसार दोनदा), जरी त्याने output चा काही भाग आधीच लिहिला असला तरी. म्हणून उपाय म्हणजे ते एकदाच चालेल अशी आशा न करता handler idempotent करणं. मी output keys input key वरून ठरलेल्या पद्धतीने बनवते, म्हणजे पुन्हा चालवलं तरी तोच object overwrite होतो, आणि output वर source ETag (किंवा version ID आणि sequencer) साठवून तो जुळला की वगळते. अनेक functions मध्ये पक्की हमी हवी असेल तर idempotency key वर DynamoDB conditional put, किंवा Powertools idempotency utility वापरते. ChaiCart मध्ये यामुळे Pune Camp dashboard वर दोनदा दिसणं थांबलं. Gotcha: फक्त "output आहे का" तपासलं तर दुरुस्त पुन्हा upload बिघडते; ETag तुलना करा.' },
      },
      {
        q: { en: 'How do you prevent a Lambda from triggering itself in a loop?', mr: 'Lambda स्वतःलाच loop मध्ये trigger करू नये म्हणून काय करता?' },
        a: { en: 'The main rule is to never write output where the trigger listens: output goes to a different bucket, or at least a different prefix that the notification filter does not match. I filter the trigger on prefix and suffix, give the role no write permission on the source prefix, and still guard in code by ignoring events whose bucket or key is not the raw input. Lambda has recursive loop detection for S3, SQS, SNS and EventBridge loops that stops a loop after about 16 invocations and emits the RecursiveInvocationsDropped metric, which I alarm on. At ChaiCart someone once pointed a lake-wide trigger at the cleaning function, and the code guard simply logged "ignored". Gotcha: loops through other services such as DynamoDB are not detected, so the design has to prevent them.', mr: 'मुख्य नियम म्हणजे trigger जिथे ऐकतो तिथे कधीच output लिहायचा नाही: output वेगळ्या bucket मध्ये जातो, किंवा किमान notification filter जुळत नाही अशा वेगळ्या prefix मध्ये. मी trigger prefix आणि suffix ने filter करते, role ला source prefix वर write permission देत नाही, आणि तरीही code मध्ये bucket किंवा key raw input नसलेले events दुर्लक्षित करून guard ठेवते. Lambda कडे S3, SQS, SNS आणि EventBridge loops साठी recursive loop detection आहे जे सुमारे 16 invocations नंतर loop थांबवतं आणि RecursiveInvocationsDropped metric देतं, ज्यावर मी alarm लावते. ChaiCart मध्ये एकदा कोणीतरी संपूर्ण lake चा trigger cleaning function कडे वळवला, आणि code guard ने फक्त "ignored" log केलं. Gotcha: DynamoDB सारख्या इतर services मधून जाणारे loops पकडले जात नाहीत, म्हणून design नेच ते टाळायला हवेत.' },
      },
      {
        q: { en: 'What is Hive-style partitioning and why does it matter for a data lake?', mr: 'Hive-style partitioning म्हणजे काय आणि data lake साठी ते का महत्त्वाचं?' },
        a: { en: 'It is a folder naming convention where each level is column=value, like clean/orders/dt=2026-11-24/store=pune-camp/. Query engines such as Athena, Glue, Spark and Redshift Spectrum read those folder names as columns, so a query with WHERE dt = \'2026-11-24\' only scans that folder. This is partition pruning: less data scanned means faster queries and a smaller Athena bill, since Athena charges by data scanned. I choose partition columns that queries filter on most, usually date, and keep the number of partitions reasonable. At ChaiCart the morning dashboard reads only yesterday\'s dt folder. Gotcha: partitioning on a high-cardinality column like order_id creates millions of tiny files, and every query gets slower.', mr: 'ही folder नावांची पद्धत आहे जिथे प्रत्येक पातळी column=value असते, उदा. clean/orders/dt=2026-11-24/store=pune-camp/. Athena, Glue, Spark आणि Redshift Spectrum सारखी query engines त्या folder नावांना columns म्हणून वाचतात, म्हणून WHERE dt = \'2026-11-24\' असलेली query फक्त तो folder scan करते. यालाच partition pruning म्हणतात: कमी data scan म्हणजे वेगवान queries आणि लहान Athena bill, कारण Athena scan केलेल्या data प्रमाणे पैसे घेतं. queries ज्यावर सगळ्यात जास्त filter करतात असे partition columns मी निवडते, बहुतेक तारीख, आणि partitions ची संख्या मर्यादित ठेवते. ChaiCart मध्ये सकाळचा dashboard फक्त कालचा dt folder वाचतो. Gotcha: order_id सारख्या खूप वेगवेगळ्या values असलेल्या column वर partition केलं तर लाखो छोट्या files बनतात, आणि प्रत्येक query हळू होते.' },
      },
      {
        q: { en: 'How do you handle bad rows in a file pipeline?', mr: 'file pipeline मध्ये खराब rows कशा हाताळता?' },
        a: { en: 'I never let one bad row fail the whole file, and I never drop it silently. Each row is checked in a fixed order and a bad row is written to a quarantine location with its raw values and the first reason, such as "bad qty" or "duplicate order_id". The run reconciles rows read = good + quarantined and logs the counts as structured JSON, so I can chart the quarantine rate and alarm when it jumps. Owners fix rows at the source and re-upload, and idempotency means the corrected file just overwrites the old output. At ChaiCart store managers get their rejects file before opening time. Gotcha: if the bad ratio is extreme, say the whole file has a new column layout, I fail the file instead of quarantining everything, because that signals a contract change that the source team must agree on.', mr: 'एका खराब row मुळे मी कधीच पूर्ण file fail होऊ देत नाही, आणि ती गुपचूप टाकूनही देत नाही. प्रत्येक row ठरलेल्या क्रमाने तपासली जाते आणि खराब row तिच्या raw values आणि पहिल्या कारणासह, उदा. "bad qty" किंवा "duplicate order_id", quarantine जागी लिहिली जाते. run वाचलेल्या rows = good + quarantined असा हिशोब जुळवतो आणि counts structured JSON मध्ये log करतो, म्हणजे quarantine rate चा chart काढता येतो आणि तो उडी मारला की alarm. मालक rows source वर दुरुस्त करून पुन्हा upload करतात, आणि idempotency मुळे दुरुस्त file जुना output फक्त overwrite करते. ChaiCart मध्ये store managers ना दुकान उघडण्याआधी त्यांची rejects file मिळते. Gotcha: खराब प्रमाण टोकाचं असेल, समजा पूर्ण file चा column layout नवा आहे, तर मी सगळं quarantine न करता file fail करते, कारण तो contract बदल आहे आणि source team शी बोलायला हवं.' },
      },
      {
        q: { en: 'When is Lambda the wrong tool for processing a file?', mr: 'file process करायला Lambda कधी चुकीचं साधन आहे?' },
        a: { en: 'When one file is too big or too slow for one invocation: a function gets at most 10,240 MB of memory, 10,240 MB of /tmp and a 30-minute timeout (15 minutes until November 2026). A 40 GB yearly export, heavy joins across many files, or a job that needs many machines at once belongs in AWS Glue, EMR or Spark. Lambda is also not ideal for steady 24/7 heavy load, where containers or Lambda Managed Instances can be cheaper. Lambda shines for many small files arriving at random times, like ChaiCart\'s few-MB daily store files. For something in between I can stream the object line by line instead of reading it all, or split the work with Step Functions or S3 Batch Operations. Gotcha: check the limits with the real biggest file you expect.', mr: 'एक file एका invocation साठी खूप मोठी किंवा खूप हळू असेल तेव्हा: function ला जास्तीत जास्त 10,240 MB memory, 10,240 MB /tmp आणि 30 मिनिटांचा timeout मिळतो (नोव्हेंबर 2026 पर्यंत 15 मिनिटं). 40 GB चा वार्षिक export, अनेक files वरचे जड joins, किंवा एकाच वेळी अनेक machines लागणारं काम AWS Glue, EMR किंवा Spark मध्ये जातं. सतत 24/7 जड load साठीही Lambda आदर्श नाही, तिथे containers किंवा Lambda Managed Instances स्वस्त पडू शकतात. कधीही येणाऱ्या अनेक छोट्या files साठी Lambda चमकतं, जसं ChaiCart च्या काही MB च्या रोजच्या store files. मधल्या आकारासाठी मी पूर्ण object न वाचता ओळ-ओळ stream करू शकते, किंवा Step Functions किंवा S3 Batch Operations ने काम वाटू शकते. Gotcha: मर्यादा अपेक्षित असलेल्या खऱ्या सगळ्यात मोठ्या file ने तपासा.' },
      },
      {
        q: { en: 'head_object on a key that does not exist returns 403 instead of 404. Why?', mr: 'अस्तित्वात नसलेल्या key वर head_object 404 ऐवजी 403 देतो. का?' },
        a: { en: 'Because the caller has s3:GetObject but not s3:ListBucket on that bucket. Without ListBucket, S3 will not reveal whether a key exists, so it answers 403 Forbidden for a missing object instead of 404 Not Found. In an idempotency check that matters: my code treats 404 as "not done yet", so a 403 would crash the function or, worse, be misread. The fix is to grant s3:ListBucket on the bucket ARN (arn:aws:s3:::chaicart-lake, without /*), or handle the case deliberately. I hit exactly this at ChaiCart when the role had been trimmed to object actions only. Gotcha: HeadObject errors have no body, only a status code, so the boto3 error code is the string "404" or "403".', mr: 'कारण caller कडे त्या bucket वर s3:GetObject आहे पण s3:ListBucket नाही. ListBucket शिवाय S3 key आहे की नाही हे उघड करत नाही, म्हणून नसलेल्या object साठी 404 Not Found ऐवजी 403 Forbidden देतं. idempotency check मध्ये हे महत्त्वाचं: माझा code 404 ला "अजून झालं नाही" मानतो, म्हणून 403 function crash करेल किंवा, आणखी वाईट, चुकीचा वाचला जाईल. उपाय म्हणजे bucket ARN वर (arn:aws:s3:::chaicart-lake, /* शिवाय) s3:ListBucket देणं, किंवा ती केस जाणीवपूर्वक हाताळणं. ChaiCart मध्ये role फक्त object actions पर्यंत कापला गेला तेव्हा मला नेमकं हेच लागलं. Gotcha: HeadObject errors ना body नसते, फक्त status code, म्हणून boto3 चा error code "404" किंवा "403" हा string असतो.' },
      },
      {
        q: { en: 'How do you monitor this pipeline so a failure at 2 a.m. is noticed?', mr: 'रात्री 2 चं failure लक्षात यावं म्हणून ही pipeline कशी monitor करता?' },
        a: { en: 'Four layers. Lambda metrics in CloudWatch: alarms on Errors and Throttles above zero, Duration close to the timeout, and for async invocations AsyncEventsDropped and AsyncEventAge. Failed events go to an on-failure destination or DLQ, with an alarm on its depth so nothing waits unseen. Structured JSON logs with counts per file, which I query with CloudWatch Logs Insights and turn into a metric such as quarantined rows per store. And a business check: by 6 a.m. every store should have a clean file for yesterday\'s dt, and a small scheduled check alerts if one is missing. At ChaiCart that last check caught a store whose upload never arrived, which no Lambda error would show. Gotcha: an alarm without an owner and a runbook is just noise.', mr: 'चार थर. CloudWatch मधले Lambda metrics: Errors आणि Throttles शून्याच्या वर, Duration timeout च्या जवळ, आणि async invocations साठी AsyncEventsDropped आणि AsyncEventAge यांवर alarms. fail झालेले events on-failure destination किंवा DLQ मध्ये जातात, त्याच्या depth वर alarm सह, म्हणजे काहीही न दिसता थांबत नाही. प्रत्येक file च्या counts सह structured JSON logs, जे मी CloudWatch Logs Insights ने query करते आणि store प्रमाणे quarantined rows सारख्या metric मध्ये बदलते. आणि business check: सकाळी 6 पर्यंत प्रत्येक store ची कालच्या dt ची clean file असायला हवी, आणि एक छोटा scheduled check एखादी नसेल तर alert देतो. ChaiCart मध्ये त्या शेवटच्या check ने असं store पकडलं ज्याचं upload कधी आलंच नाही, जे कोणत्याही Lambda error मध्ये दिसलं नसतं. Gotcha: मालक आणि runbook नसलेला alarm म्हणजे फक्त आवाज.' },
      },
    ],
  },
]
