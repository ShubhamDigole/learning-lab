import type { Lesson } from './types.ts'

// Lambda 1 (ChaiCart Cloud), first half: serverless and the handler, S3 events that trigger Lambda,
// and errors, retries and idempotency. Later lessons (lambda-more.ts) cover configuration and the boss.
// AWS facts checked against docs.aws.amazon.com and aws.amazon.com in November 2026.

// ───────────────────────── shared helpers

/** S3 URL-encodes the object key in event notifications (a space becomes +). */
const enc = (k: string) => encodeURIComponent(k).replace(/%20/g, '+').replace(/%2F/g, '/')

/** A real-shaped S3 "ObjectCreated:Put" event, like the console's s3-put test template. */
const s3ev = (bucket: string, key: string, size = 120) => ({
  Records: [
    {
      eventVersion: '2.1',
      eventSource: 'aws:s3',
      awsRegion: 'ap-south-1',
      eventTime: '2026-11-24T02:00:05.000Z',
      eventName: 'ObjectCreated:Put',
      userIdentity: { principalId: 'AWS:AIDAPARTNER' },
      requestParameters: { sourceIPAddress: '10.0.0.1' },
      responseElements: { 'x-amz-request-id': 'C3D13FE58DE4C810' },
      s3: {
        s3SchemaVersion: '1.0',
        configurationId: 'on-new-file',
        bucket: { name: bucket, ownerIdentity: { principalId: 'A3NL1KOZZKExample' }, arn: 'arn:aws:s3:::' + bucket },
        object: { key: enc(key), size, eTag: '9b2cf535f27731c974343645a3985328', sequencer: '0A1B2C3D4E5F678901' },
      },
    },
  ],
})

const ORDERS_A = `order_id,shop,amount
1001,Sharma Stores,120
1002,Joshi Mart,60
1003,Sharma Stores,80
1004,Kulkarni Kirana,45
1005,Joshi Mart,95
`
const SUMMARY_A = 'shop,orders,amount\\nJoshi Mart,2,155\\nKulkarni Kirana,1,45\\nSharma Stores,2,200\\n'

const ORDERS_B = `order_id,shop,amount
2001,Patil Traders,300
2002,Sharma Stores,150
2003,Patil Traders,50
`
const SUMMARY_B = 'shop,orders,amount\\nPatil Traders,2,350\\nSharma Stores,1,150\\n'

const ORDERS_BAD = `order_id,shop,amount
1001,Sharma Stores,120
1002,Joshi Mart,abc
1003,Sharma Stores,80
1004,Kulkarni Kirana,
1005,Joshi Mart,95
`
const ORDERS_BAD2 = `order_id,shop,amount
3001,Deshmukh Dairy,-40
3002,Gupta General,210
3003,Deshmukh Dairy,12.5
3004,Gupta General,90
`

const SUMMARISE = `
def summarise(text):
    counts, totals = {}, {}
    for row in csv.DictReader(io.StringIO(text)):
        shop = row['shop']
        counts[shop] = counts.get(shop, 0) + 1
        totals[shop] = totals.get(shop, 0) + int(row['amount'])
    lines = ['shop,orders,amount']
    for shop in sorted(totals):
        lines.append(f'{shop},{counts[shop]},{totals[shop]}')
    return '\\n'.join(lines) + '\\n'
`

const RAW_KEY = 'incoming/2026/11/24/orders 24 Nov.csv'
const DLQ = 'arn:aws:sqs:ap-south-1:123456789012:process-orders-dlq'
const J = "__import__('json').loads"

// ───────────────────────── L1.1 code

const L1_SANDBOX_WARM = `calls = 0
print('init: code outside the handler runs once, on the cold start')

def lambda_handler(event, context):
    global calls
    calls += 1
    print('handling', event['partner'], '| call number', calls)
    return {'partner': event['partner'], 'calls': calls}
`

const L1_INVOKE_HANDLER = `import json
import boto3

def lambda_handler(event, context):
    amounts = event['orders']
    return {'partner': event['partner'], 'orders': len(amounts), 'total': sum(amounts)}

# ---- Theo's scheduler script (in real life a separate program calls the function) ----
lam = boto3.client('lambda')
payload = {'partner': 'Sharma Stores', 'orders': [120, 80, 45]}
`

// ───────────────────────── L1.2 code

const L2_HEAD = `import csv
import io
import urllib.parse
import boto3

s3 = boto3.client('s3')
${SUMMARISE}`

const L2_LOOP_SANDBOX = `import urllib.parse
import boto3

s3 = boto3.client('s3')

def lambda_handler(event, context):
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    text = s3.get_object(Bucket='chaicart-raw', Key=key)['Body'].read().decode('utf-8')
    out_key = 'incoming/clean-' + key.split('/')[-1]
    s3.put_object(Bucket='chaicart-raw', Key=out_key, Body=text)
    print('wrote', out_key)

# ---- the partner's 2 a.m. upload ----
s3.put_object(Bucket='chaicart-raw', Key='incoming/orders.csv', Body='order_id,shop,amount\\n1001,Sharma Stores,120\\n')
`

const L2_FIX_HEAD = `import csv
import io
import json
import urllib.parse
import boto3

s3 = boto3.client('s3')

def lambda_handler(event, context):
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    text = s3.get_object(Bucket='chaicart-raw', Key=key)['Body'].read().decode('utf-8')
    rows = list(csv.DictReader(io.StringIO(text)))
    name = key.split('/')[-1]
`
const L2_FIX_TAIL = `    s3.put_object(Bucket='chaicart-raw', Key=out_key, Body=json.dumps(rows))
    print('wrote', out_key)
    return {'rows': len(rows), 'out': out_key}

# ---- the partner's 2 a.m. upload (do not change) ----
s3.put_object(Bucket='chaicart-raw', Key='incoming/orders 24 Nov.csv',
              Body='order_id,shop,amount\\n1001,Sharma Stores,120\\n1002,Joshi Mart,60\\n')
`

// ───────────────────────── L1.3 code

const L3_RETRY_SANDBOX = `import csv
import io
import urllib.parse
import boto3

s3 = boto3.client('s3')

def lambda_handler(event, context):
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    text = s3.get_object(Bucket='chaicart-raw', Key=key)['Body'].read().decode('utf-8')
    total = 0
    for row in csv.DictReader(io.StringIO(text)):
        total += int(row['amount'])
    print('total', total)
    return {'total': total}

# ---- the partner's 2 a.m. upload: one amount is "abc" ----
s3.put_object(Bucket='chaicart-raw', Key='incoming/orders 24 Nov.csv',
              Body='order_id,shop,amount\\n1001,Sharma Stores,120\\n1002,Joshi Mart,abc\\n')
`

const L3_PARTIAL_HEAD = `import csv
import io
import urllib.parse
import boto3

s3 = boto3.client('s3')
${SUMMARISE}
def to_csv(header, rows):
    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=header, lineterminator='\\n')
    writer.writeheader()
    writer.writerows(rows)
    return out.getvalue()

def lambda_handler(event, context):
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    name = key.split('/')[-1]
    text = s3.get_object(Bucket='chaicart-raw', Key=key)['Body'].read().decode('utf-8')
    good, rejects = [], []
`
const L3_PARTIAL_TAIL = `    s3.put_object(Bucket='chaicart-clean', Key='summary/' + name, Body=summarise(to_csv(['order_id', 'shop', 'amount'], good)))
    if rejects:
        s3.put_object(Bucket='chaicart-clean', Key='rejects/' + name, Body=to_csv(['order_id', 'shop', 'amount', 'reason'], rejects))
    print('good', len(good), 'rejected', len(rejects))
    return {'good': len(good), 'rejected': len(rejects)}
`

const L3_IDEM_HEAD = `import csv
import io
import uuid
import urllib.parse
import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
${SUMMARISE}`

const L3_TIME_HEAD = `import json
import time
import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
BUCKET = 'chaicart-clean'

def send_report(shop):
    time.sleep(0.8)            # the WhatsApp API takes up to 0.8 s per shop
    print('sent report to', shop)

def load_done(date):
    try:
        body = s3.get_object(Bucket=BUCKET, Key=f'progress/{date}.json')['Body'].read()
        return json.loads(body)
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            return []
        raise

def save_done(date, done):
    s3.put_object(Bucket=BUCKET, Key=f'progress/{date}.json', Body=json.dumps(done))

def lambda_handler(event, context):
    date = event['date']
    done = load_done(date)
    for shop in event['shops']:
`
const L3_TIME_TAIL = `        send_report(shop)
        done.append(shop)
    save_done(date, done)
    return {'done': len(done), 'left': len(event['shops']) - len(done)}
`
const SHOPS6 = ['Sharma Stores', 'Joshi Mart', 'Kulkarni Kirana', 'Patil Traders', 'Deshmukh Dairy', 'Gupta General']
const SHOPS7 = ['Shinde Sweets', 'Pawar Provisions', 'More Medical', 'Jadhav Juice', 'Kale Kirana', 'Naik Novelty', 'Bhosale Bakery']

const L3_DLQ_HEAD = `import csv
import io
import json
import urllib.parse
import boto3

s3 = boto3.client('s3')
${SUMMARISE}
def log(level, context, key, **extra):
    print(json.dumps({'level': level, 'request_id': context.aws_request_id, 'key': key, **extra}))

def lambda_handler(event, context):
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    try:
        text = s3.get_object(Bucket='chaicart-raw', Key=key)['Body'].read().decode('utf-8')
        s3.put_object(Bucket='chaicart-clean', Key='summary/' + key.split('/', 1)[1], Body=summarise(text))
        log('INFO', context, key, message='summary written')
        return {'ok': True}
    except Exception as e:
`
const L3_DLQ_TAIL = `
# ---- the partners' 2 a.m. uploads (do not change) ----
s3.put_object(Bucket='chaicart-raw', Key='incoming/sharma/orders 24 Nov.csv', Body=open('data/sharma.csv').read())
s3.put_object(Bucket='chaicart-raw', Key='incoming/kulkarni/orders 24 Nov.csv', Body=open('data/kulkarni.csv').read())
`

export const lambdaBasicsLessons: Lesson[] = [
  // ───────────────────────── L1.1 Serverless and your first Lambda
  {
    id: 'lm1-1',
    code: 'L1.1',
    level: 'intermediate',
    title: { en: 'Serverless and your first Lambda', mr: 'Serverless आणि तुमचं पहिलं Lambda' },
    skill: 'serverless model, Lambda vs EC2 vs Fargate, lambda_handler(event, context), sync vs async invoke, CloudWatch START/END/REPORT, limits',
    realLife: {
      place: 'kitchen',
      title: { en: 'Cooks on call for the Diwali orders', mr: 'दिवाळीच्या orders साठी बोलावल्यावर येणारे आचारी' },
      story: {
        en: 'Meera\'s aunt runs a small catering business from her kitchen in Kothrud. In Diwali week the orders explode, and in February almost nobody orders. She does not keep ten cooks on salary all year. She calls an agency: a cook arrives only when an order slip comes in, cooks that order, and leaves. She pays for the minutes of cooking, and the agency handles the cook\'s stove, gas and uniform. On a busy evening the agency simply sends more cooks, one per order. The first cook of the morning needs a few minutes to set up the station; after that, the next order starts at once. Every cook notes in the register when he started, when he finished and how much gas he used. There is one rule: a cook from the agency stays at most half an hour per order. For a wedding feast that simmers for eight hours, she hires a full-time cook.',
        mr: 'मीराची मावशी कोथरूडमधल्या तिच्या स्वयंपाकघरातून छोटा catering व्यवसाय चालवते. दिवाळीच्या आठवड्यात orders चा पूर येतो, आणि फेब्रुवारीत जवळजवळ कोणीच order देत नाही. ती वर्षभर दहा आचारी पगारावर ठेवत नाही. ती एका agency ला फोन करते: order ची चिठ्ठी आली की एक आचारी येतो, ती order बनवतो आणि निघून जातो. ती फक्त स्वयंपाकाच्या मिनिटांचे पैसे देते, आणि आचाऱ्याची शेगडी, गॅस, गणवेश agency बघते. गर्दीच्या संध्याकाळी agency सरळ जास्त आचारी पाठवते, एका order ला एक. सकाळच्या पहिल्या आचाऱ्याला जागा तयार करायला काही मिनिटं लागतात; त्यानंतरची order लगेच सुरू होते. प्रत्येक आचारी वहीत लिहितो: कधी सुरू केलं, कधी संपवलं, किती गॅस लागला. एकच नियम: agency चा आचारी एका order साठी जास्तीत जास्त अर्धा तास थांबतो. आठ तास मंद आचेवर शिजणाऱ्या लग्नाच्या जेवणासाठी ती पूर्णवेळ आचारी ठेवते.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🧾', label: 'An order slip arrives (the event)', mr: 'order ची चिठ्ठी येते (event)' },
          { icon: '🧑‍🍳', label: 'A cook is called; the first one sets up (cold start)', mr: 'आचारी बोलावला जातो; पहिला जागा लावतो (cold start)' },
          { icon: '🍲', label: 'He cooks this one order (the handler)', mr: 'तो ही एकच order बनवतो (handler)' },
          { icon: '📒', label: 'He notes start, end and gas used (logs)', mr: 'तो सुरुवात, शेवट, गॅस वहीत लिहितो (logs)' },
          { icon: '💤', label: 'No orders, no cooks, no bill (scale to zero)', mr: 'orders नाहीत, आचारी नाहीत, बिल नाही (scale to zero)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'The partner chain sends our daily order file at 2 a.m. Every morning at 6, Theo wakes up and runs a script by hand. Last Sunday he overslept and twelve shops opened without a stock plan.', mr: 'partner chain आपली रोजची order file रात्री 2 वाजता पाठवते. रोज सकाळी 6 ला Theo उठून हाताने एक script चालवतो. मागच्या रविवारी त्याला जाग आली नाही आणि बारा दुकानं stock plan शिवाय उघडली.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'And the script lives on an EC2 server that runs 24 hours a day, for a job that takes 40 seconds. I also patch that server every month.', mr: 'आणि ती script एका EC2 server वर आहे जो दिवसाचे 24 तास चालतो, 40 सेकंदांच्या कामासाठी. वरून त्या server ला दर महिन्याला patch मीच करतो.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'a server nobody patches and a human who oversleeps. my two favourite things.', mr: 'कोणी patch न करणारा server आणि झोपणारा माणूस. माझ्या दोन आवडत्या गोष्टी.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'This is the textbook Lambda job. The code runs when an event happens, we pay for the milliseconds it runs, and there is no server for us to patch.', mr: 'हे Lambda चं अगदी पुस्तकातलं काम आहे. event झाला की code चालतो, जितके milliseconds चालतो तितकेच पैसे, आणि patch करायला आपला कोणताही server नाही.' } },
        { who: 'meera', mood: 'happy', text: { en: '{name}, before we connect it to S3, you write your first handler, call it two ways, and learn to read its logs like a test report.', mr: '{name}, S3 ला जोडण्याआधी तू तुझा पहिला handler लिही, तो दोन प्रकारे call कर, आणि त्याचे logs test report सारखे वाचायला शिक.' } },
      ],
      problem: { en: 'A 40-second daily job needs a person awake at 6 a.m. and a server running and patched all day. When the person is late, the business is late.', mr: '40 सेकंदांच्या रोजच्या कामासाठी सकाळी 6 ला जागा माणूस आणि दिवसभर चालणारा, patch केलेला server लागतो. माणूस उशिरा, तर व्यवसाय उशिरा.' },
      solution: { en: 'An AWS Lambda function: a Python handler that AWS runs only when an event arrives, scales automatically, bills per request and per millisecond of memory used, and writes every run to CloudWatch Logs.', mr: 'एक AWS Lambda function: एक Python handler जो event आल्यावरच AWS चालवतं, जो आपोआप scale होतो, ज्याचं बिल प्रत्येक request आणि वापरलेल्या memory च्या प्रत्येक millisecond प्रमाणे येतं, आणि ज्याचा प्रत्येक run CloudWatch Logs मध्ये लिहिला जातो.' },
    },
    lesson: [
      { en: 'Serverless does not mean there are no servers. It means the servers are AWS\'s job: the operating system, patching, capacity and scaling. You upload code and choose two main settings, memory and timeout. Lambda runs the code when an event arrives. If 50 events arrive together, Lambda starts more copies in parallel (each execution environment handles one request at a time), and when nothing happens it scales to zero and costs nothing. You pay per request plus duration in GB-seconds: memory in GB multiplied by run time, billed per millisecond. 512 MB for 2 seconds is 0.5 × 2 = 1 GB-second. The free tier covers 1 million requests and 400,000 GB-seconds every month. AWS docs now call this classic kind an "Event Function", but the API and boto3 still say function.', mr: 'Serverless म्हणजे servers नाहीत असं नाही. म्हणजे servers चं काम AWS चं: operating system, patching, capacity आणि scaling. तुम्ही code upload करता आणि दोन मुख्य settings निवडता: memory आणि timeout. event आला की Lambda code चालवतं. 50 events एकदम आले तर Lambda समांतर जास्त copies सुरू करतं (प्रत्येक execution environment एका वेळी एकच request हाताळतं), आणि काहीच घडत नसेल तर ते शून्यावर येतं आणि खर्च शून्य. पैसे प्रत्येक request चे आणि GB-seconds मधल्या duration चे: GB मधली memory गुणिले चालण्याचा वेळ, बिल प्रत्येक millisecond चं. 512 MB, 2 सेकंद म्हणजे 0.5 × 2 = 1 GB-second. free tier मध्ये दर महिन्याला 1 million requests आणि 400,000 GB-seconds फुकट. AWS docs आता या मूळ प्रकाराला "Event Function" म्हणतात, पण API आणि boto3 अजूनही function च म्हणतात.' },
      { en: 'Lambda is one of three ways to run code. EC2 rents you a whole virtual machine: you manage the OS, it bills every second it is on (even idle), and it suits steady, long-running work or special software. Containers on ECS with Fargate run your Docker image without you managing servers, and suit long services or jobs that outgrow Lambda. Lambda suits short, event-driven, spiky work like "a file landed, process it". Do not use Lambda when one run needs more than 30 minutes (the maximum timeout: it was 15 minutes until AWS doubled it in November 2026, so many interviewers still say 15), when you need more than 10,240 MB of memory or a GPU, when load is high and steady all day (a server is often cheaper), or for big data jobs over many gigabytes (Glue, EMR or Spark, coming later in this world).', mr: 'code चालवायच्या तीन पद्धतींपैकी Lambda एक. EC2 म्हणजे पूर्ण virtual machine भाड्याने: OS तुम्ही सांभाळता, तो चालू असेपर्यंत प्रत्येक सेकंदाचं बिल (रिकामा बसला तरी), आणि तो स्थिर, दीर्घ कामासाठी किंवा खास software साठी योग्य. ECS वरचे Fargate containers तुमची Docker image servers न सांभाळता चालवतात, लांब services किंवा Lambda ला न झेपणाऱ्या jobs साठी योग्य. Lambda लहान, event-driven, अचानक वाढणाऱ्या कामासाठी, उदा. "file आली, process कर". Lambda वापरू नका जेव्हा एका run ला 30 मिनिटांपेक्षा जास्त लागतात (कमाल timeout: नोव्हेंबर 2026 मध्ये AWS ने दुप्पट करेपर्यंत तो 15 मिनिटं होता, म्हणून बरेच interviewers अजून 15 म्हणतात), जेव्हा 10,240 MB पेक्षा जास्त memory किंवा GPU लागतो, जेव्हा load दिवसभर जास्त आणि स्थिर असतो (server बहुतेक स्वस्त पडतो), किंवा अनेक gigabytes च्या big data jobs साठी (Glue, EMR किंवा Spark, याच world मध्ये पुढे).' },
      { en: 'Your code is a handler: def lambda_handler(event, context). The event is plain JSON that Lambda turns into a Python dict; its shape depends on who called (S3, API Gateway, a test event you typed). The context describes this run: context.aws_request_id, context.function_name, context.memory_limit_in_mb and context.get_remaining_time_in_millis(). Whatever you return must be JSON-serialisable. Code outside the handler runs once per execution environment, during init (the cold start); warm runs reuse it. That is the place for boto3 clients, never for per-request data.', mr: 'तुमचा code म्हणजे एक handler: def lambda_handler(event, context). event म्हणजे साधा JSON, जो Lambda Python dict मध्ये बदलतं; त्याचा आकार कोणी call केलं त्यावर ठरतो (S3, API Gateway, तुम्ही टाइप केलेला test event). context या run चं वर्णन करतो: context.aws_request_id, context.function_name, context.memory_limit_in_mb आणि context.get_remaining_time_in_millis(). तुम्ही जे return कराल ते JSON मध्ये बदलता यायला हवं. handler बाहेरचा code प्रत्येक execution environment मध्ये एकदाच, init मध्ये (cold start) चालतो; warm runs तोच पुन्हा वापरतात. boto3 clients साठी हीच जागा, per-request data साठी कधीच नाही.' },
      { en: 'There are two ways to invoke. Synchronous (InvocationType="RequestResponse"): the caller waits and gets the return value, or the error; StatusCode is 200, and a crash adds FunctionError to the response. Payloads can be 6 MB each way. Asynchronous ("Event"): Lambda puts the event in its own queue and answers 202 at once; the payload limit is 1 MB, and on errors Lambda retries for you. S3 and SNS invoke Lambda asynchronously. Every print goes to CloudWatch Logs, log group /aws/lambda/<function-name>. Each run writes START RequestId, your prints, END, and a REPORT line: Duration (handler time), Billed Duration (rounded up to the next millisecond; since August 2025 a cold start\'s Init Duration is added to it), Memory Size (configured), Max Memory Used (the peak) and Init Duration (cold starts only). In the lab the console panel shows these logs; the lab leaves Init out of Billed Duration, and its IAM is a simple deny list.', mr: 'invoke करायच्या दोन पद्धती. Synchronous (InvocationType="RequestResponse"): caller थांबतो आणि त्याला return value किंवा error मिळतो; StatusCode 200 असतो, आणि crash झाला तर response मध्ये FunctionError येतो. payload दोन्ही बाजूंनी 6 MB पर्यंत. Asynchronous ("Event"): Lambda event स्वतःच्या queue मध्ये ठेवतं आणि लगेच 202 देतं; payload ची मर्यादा 1 MB, आणि errors आले तर Lambda स्वतः retry करतं. S3 आणि SNS Lambda ला asynchronously invoke करतात. प्रत्येक print CloudWatch Logs मध्ये जातो, log group /aws/lambda/<function-name>. प्रत्येक run START RequestId, तुमचे prints, END, आणि एक REPORT ओळ लिहितो: Duration (handler चा वेळ), Billed Duration (पुढच्या millisecond पर्यंत वर; ऑगस्ट 2025 पासून cold start चा Init Duration त्यात जोडला जातो), Memory Size (ठरवलेली), Max Memory Used (सर्वाधिक वापर) आणि Init Duration (फक्त cold start ला). lab मध्ये console panel हे logs दाखवतो; lab Billed Duration मध्ये Init जोडत नाही, आणि त्याचं IAM म्हणजे एक साधी deny list आहे.' },
    ],
    syntax: {
      template: `import json
import boto3

s3 = boto3.client('s3')            # init: runs once per cold start

def lambda_handler(event, context):
    print('request', context.aws_request_id)      # goes to CloudWatch Logs
    partner = event.get('partner', 'unknown')
    return {'partner': partner, 'ok': True}       # must be JSON-serialisable

# calling the function from another program
lam = boto3.client('lambda')
resp = lam.invoke(FunctionName='daily-orders',
                  InvocationType='RequestResponse',   # or 'Event'
                  Payload=json.dumps({'partner': 'Sharma Stores'}))
result = json.loads(resp['Payload'].read())`,
      parts: [
        { code: 'def lambda_handler(event, context):', means: { en: 'the entry point Lambda calls on every invocation; the name is configurable (handler setting lambda_function.lambda_handler)', mr: 'प्रत्येक invocation ला Lambda जो entry point call करतं; नाव बदलता येतं (handler setting lambda_function.lambda_handler)' } },
        { code: 'event', means: { en: 'the input as a Python dict, parsed from JSON; its shape depends on the caller', mr: 'input, JSON मधून बनलेली Python dict; आकार caller वर ठरतो' } },
        { code: 'context', means: { en: 'facts about this run: aws_request_id, function_name, memory_limit_in_mb, get_remaining_time_in_millis()', mr: 'या run ची माहिती: aws_request_id, function_name, memory_limit_in_mb, get_remaining_time_in_millis()' } },
        { code: "InvocationType='RequestResponse'", means: { en: 'synchronous: wait for the answer (StatusCode 200, FunctionError on a crash), 6 MB payload', mr: 'synchronous: उत्तराची वाट पाहा (StatusCode 200, crash झाल्यास FunctionError), 6 MB payload' } },
        { code: "InvocationType='Event'", means: { en: 'asynchronous: Lambda queues it and answers 202 with an empty Payload; 1 MB payload; retries on errors', mr: 'asynchronous: Lambda queue मध्ये ठेवतं आणि रिकाम्या Payload सह 202 देतं; 1 MB payload; errors वर retry' } },
        { code: "json.loads(resp['Payload'].read())", means: { en: 'the Payload is a stream: read it, then parse the JSON your handler returned', mr: 'Payload हा stream आहे: तो वाचा, मग handler ने return केलेला JSON parse करा' } },
      ],
      example: [
        { code: "s3 = boto3.client('s3')  # outside the handler", note: { en: 'set up once when the cook arrives, reused for every warm order', mr: 'आचारी आल्यावर एकदाच तयारी, प्रत्येक warm order साठी पुन्हा वापर' } },
        { code: "event = {'partner': 'Sharma Stores', 'orders': [120, 80, 45]}", note: { en: 'the order slip: just JSON, no magic', mr: 'order ची चिठ्ठी: फक्त JSON, कोणतीही जादू नाही' } },
        { code: "return {'partner': 'Sharma Stores', 'total': 245}", note: { en: 'the answer a synchronous caller receives', mr: 'synchronous caller ला मिळणारं उत्तर' } },
        { code: 'REPORT Duration: 41.20 ms  Billed Duration: 42 ms  Memory Size: 128 MB  Max Memory Used: 38 MB', note: { en: 'the register line: time, billed time, gas bought and gas used', mr: 'वहीतली नोंद: वेळ, बिलाचा वेळ, घेतलेला आणि वापरलेला गॅस' } },
        { code: 'Init Duration: 186.40 ms', note: { en: 'only on a cold start, the morning set-up', mr: 'फक्त cold start ला, सकाळची जागा लावणी' } },
      ],
      pitfall: { en: 'Two classic slips. With InvocationType="Event" the response is 202 with an empty Payload, so code that waits for a result from an async call gets nothing. And real Lambda turns your return value into JSON: returning a set or a datetime fails with Runtime.MarshalError, so return lists, numbers and strings (the lab is more forgiving here, real AWS is not).', mr: 'दोन नेहमीच्या चुका. InvocationType="Event" ला response 202 आणि रिकामा Payload असतो, म्हणून async call कडून result ची वाट पाहणाऱ्या code ला काहीच मिळत नाही. आणि खरं Lambda तुमची return value JSON मध्ये बदलतं: set किंवा datetime return केलं तर Runtime.MarshalError येतो, म्हणून lists, numbers आणि strings return करा (lab इथे थोडा माफ करतो, खरं AWS नाही).' },
    },
    practice: {
      intro: { en: 'Your first Lambda for ChaiCart. The lab runs your file (that is the init), then invokes your handler with test events. Open the Lambda tab in the AWS console panel under the output after each run to read START, END and REPORT.', mr: 'ChaiCart साठी तुमचं पहिलं Lambda. lab आधी तुमची file चालवतो (तेच init), मग test events देऊन तुमचा handler invoke करतो. प्रत्येक run नंतर output खालच्या AWS console panel मधला Lambda टॅब उघडा आणि START, END आणि REPORT वाचा.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'The partner\'s scheduler sends events like {"partner": "Sharma Stores", "orders": [120, 80, 45]}. Finish lambda_handler(event, context): print "partner file from <partner>" (it lands in the logs), and return {"partner": ..., "orders": how many amounts, "total": their sum}. The lab invokes it with two test events, and hidden events check it again (one has no orders at all).', mr: 'partner चा scheduler {"partner": "Sharma Stores", "orders": [120, 80, 45]} असे events पाठवतो. lambda_handler(event, context) पूर्ण करा: "partner file from <partner>" print करा (ते logs मध्ये जातं), आणि {"partner": ..., "orders": किती amounts, "total": त्यांची बेरीज} return करा. lab दोन test events देऊन तो invoke करतो, आणि लपवलेले events पुन्हा तपासतात (एकात orders च नाहीत).' },
          starter: `def lambda_handler(event, context):
    # TODO: print 'partner file from', then the partner name
    # TODO: return {'partner': ..., 'orders': how many amounts, 'total': their sum}
    return None
`,
          solution: `def lambda_handler(event, context):
    print('partner file from', event['partner'])
    amounts = event['orders']
    return {'partner': event['partner'], 'orders': len(amounts), 'total': sum(amounts)}
`,
          aws: { lambda: { name: 'daily-orders', events: [{ partner: 'Sharma Stores', orders: [120, 80, 45] }, { partner: 'Joshi Mart', orders: [60] }] } },
          checks: [
            { expr: "[i['result'] for i in lambda_invocations] == [{'partner': 'Sharma Stores', 'orders': 3, 'total': 245}, {'partner': 'Joshi Mart', 'orders': 1, 'total': 60}]", message: { en: 'The handler should return {"partner": "Sharma Stores", "orders": 3, "total": 245} for the first event and {"partner": "Joshi Mart", "orders": 1, "total": 60} for the second. Open the Lambda tab to see what it returned.', mr: 'handler ने पहिल्या event साठी {"partner": "Sharma Stores", "orders": 3, "total": 245} आणि दुसऱ्यासाठी {"partner": "Joshi Mart", "orders": 1, "total": 60} return करायला हवं. काय return झालं ते Lambda टॅबमध्ये पाहा.' } },
            { expr: "any('partner file from Sharma Stores' in line for line in lambda_invocations[0]['logs'])", message: { en: 'The first invocation\'s logs should contain "partner file from Sharma Stores". Use print inside the handler.', mr: 'पहिल्या invocation च्या logs मध्ये "partner file from Sharma Stores" हवं. handler च्या आत print वापरा.' } },
          ],
          variants: [
            {
              label: { en: 'Other partners, and a day with no orders', mr: 'दुसरे partners, आणि एकही order नसलेला दिवस' },
              aws: { lambda: { name: 'daily-orders', events: [{ partner: 'Kulkarni Kirana', orders: [] }, { partner: 'Patil Traders', orders: [10, 20, 30, 40] }] } },
              checks: [
                { expr: "[i['result'] for i in lambda_invocations] == [{'partner': 'Kulkarni Kirana', 'orders': 0, 'total': 0}, {'partner': 'Patil Traders', 'orders': 4, 'total': 100}]", message: { en: 'On hidden events the results are wrong. Read the partner and the amounts from the event; an empty list gives 0 orders and total 0.', mr: 'लपवलेल्या events वर results चुकले. partner आणि amounts event मधूनच वाचा; रिकामी list म्हणजे 0 orders आणि total 0.' } },
              ],
            },
          ],
          mustUse: [{ pattern: 'def lambda_handler\\(event, context\\)', message: { en: 'Keep the handler signature def lambda_handler(event, context).', mr: 'handler ची signature def lambda_handler(event, context) तशीच ठेवा.' } }],
          mustNotUse: [{ pattern: '245', message: { en: 'Do not hard-code the total. Compute it from the event.', mr: 'total hard-code करू नका. event मधून काढा.' } }],
          hints: [
            { en: 'The event is a normal dict: event["partner"] is the name, event["orders"] is a list of numbers.', mr: 'event ही साधी dict आहे: event["partner"] म्हणजे नाव, event["orders"] म्हणजे numbers ची list.' },
            { en: 'len(list) counts the amounts and sum(list) adds them. Return a dict with exactly the three keys partner, orders, total.', mr: 'len(list) amounts मोजतो आणि sum(list) बेरीज करतो. partner, orders, total याच तीन keys असलेली dict return करा.' },
            { en: "    print('partner file from', event['partner'])\n    amounts = event['orders']\n    return {'partner': event['partner'], 'orders': len(amounts), 'total': sum(amounts)}", mr: "    print('partner file from', event['partner'])\n    amounts = event['orders']\n    return {'partner': event['partner'], 'orders': len(amounts), 'total': sum(amounts)}" },
          ],
          successLine: { en: 'Your first Lambda answered two partners. No server, no alarm clock.', mr: 'तुमच्या पहिल्या Lambda ने दोन partners ना उत्तर दिलं. server नाही, गजर नाही.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Press Run. The file prints one init line, then the lab invokes the handler three times. Open the Lambda tab: only the first REPORT line has "Init Duration", and the third call returns calls = 3. What does this tell you?', mr: 'Run दाबा. file एक init ओळ print करते, मग lab handler तीनदा invoke करतो. Lambda टॅब उघडा: फक्त पहिल्या REPORT ओळीत "Init Duration" आहे, आणि तिसरा call calls = 3 देतो. यावरून काय कळतं?' },
          pythonSandbox: { code: L1_SANDBOX_WARM, aws: { lambda: { name: 'daily-orders', events: [{ partner: 'Sharma Stores' }, { partner: 'Joshi Mart' }, { partner: 'Patil Traders' }] } } },
          options: [
            { en: 'Lambda ran the whole file three times; Init Duration is missing later because the logs were cut', mr: 'Lambda ने पूर्ण file तीनदा चालवली; नंतर Init Duration दिसत नाही कारण logs कापले गेले' },
            { en: 'The first call was a cold start: code outside the handler ran once. The next calls reused the same warm environment, so globals like calls (and boto3 clients) survived between them', mr: 'पहिला call cold start होता: handler बाहेरचा code एकदाच चालला. पुढच्या calls ने तेच warm environment पुन्हा वापरलं, म्हणून calls सारखे globals (आणि boto3 clients) त्यांच्यात टिकले' },
            { en: 'Each call ran on a new server, and Lambda copies global variables between servers', mr: 'प्रत्येक call नव्या server वर चालला, आणि Lambda globals एका server वरून दुसऱ्यावर copy करतं' },
            { en: 'Init Duration is charged only once per day, so the counter is a billing counter', mr: 'Init Duration दिवसातून एकदाच लागतो, म्हणून counter हा बिलाचा counter आहे' },
          ],
          correct: [1],
          explain: { en: 'Init (module code) runs once per execution environment: that is the cold start and the Init Duration. Warm invocations reuse the environment, so globals persist. Use that for clients and caches, but never trust it for per-request state: a new environment can start any time, and under load many run in parallel, each with its own counter.', mr: 'Init (module चा code) प्रत्येक execution environment मध्ये एकदाच चालतो: तोच cold start आणि Init Duration. warm invocations तेच environment वापरतात, म्हणून globals टिकतात. clients आणि cache साठी याचा वापर करा, पण per-request state साठी कधीच विश्वास ठेवू नका: नवं environment कधीही सुरू होऊ शकतं, आणि load वाढला की अनेक समांतर चालतात, प्रत्येकाचा counter वेगळा.' },
          hints: [
            { en: 'Count how many times the init line was printed, and compare with how many invocations ran.', mr: 'init ओळ किती वेळा print झाली ते मोजा, आणि किती invocations झाले त्याच्याशी तुलना करा.' },
            { en: 'The cook sets up his station once in the morning; the next orders use the same station.', mr: 'आचारी सकाळी एकदाच जागा लावतो; पुढच्या orders तीच जागा वापरतात.' },
          ],
          successLine: { en: 'Cold once, warm after. That is why boto3 clients live outside the handler.', mr: 'एकदा cold, नंतर warm. म्हणूनच boto3 clients handler बाहेर राहतात.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Theo\'s scheduler script now calls your function instead of running the job itself. (In real life it is a separate program; here both live in one file.) First call "daily-orders" synchronously with payload: print "sync status: <StatusCode>", then read the Payload with json.loads(resp["Payload"].read()) and print "total: <total>". Then send the same payload asynchronously (InvocationType="Event") and print "async status: <StatusCode>".', mr: 'Theo ची scheduler script आता स्वतः काम करण्याऐवजी तुमचं function call करते. (खऱ्या आयुष्यात तो वेगळा program असतो; इथे दोन्ही एकाच file मध्ये.) आधी "daily-orders" ला payload सह synchronously call करा: "sync status: <StatusCode>" print करा, मग json.loads(resp["Payload"].read()) ने Payload वाचा आणि "total: <total>" print करा. मग तोच payload asynchronously (InvocationType="Event") पाठवा आणि "async status: <StatusCode>" print करा.' },
          starter: `${L1_INVOKE_HANDLER}
# TODO 1: lam.invoke(...) with InvocationType='RequestResponse' and Payload=json.dumps(payload)
#         print('sync status:', ...) then read the Payload and print('total:', ...)
# TODO 2: invoke again with InvocationType='Event' and print('async status:', ...)
`,
          solution: `${L1_INVOKE_HANDLER}
resp = lam.invoke(FunctionName='daily-orders', InvocationType='RequestResponse', Payload=json.dumps(payload))
print('sync status:', resp['StatusCode'])
result = json.loads(resp['Payload'].read())
print('total:', result['total'])

resp = lam.invoke(FunctionName='daily-orders', InvocationType='Event', Payload=json.dumps(payload))
print('async status:', resp['StatusCode'])
`,
          aws: { lambda: { name: 'daily-orders' } },
          output: ['sync status: 200', 'total: 245', 'async status: 202'],
          checks: [
            { expr: "[i['source'] for i in lambda_invocations] == ['invoke', 'async']", message: { en: 'There should be one synchronous invocation (during your script) and one asynchronous one (Lambda runs it from its queue afterwards). Check the InvocationType of each call.', mr: 'एक synchronous invocation (तुमच्या script दरम्यान) आणि एक asynchronous (Lambda नंतर queue मधून चालवतं) हवं. प्रत्येक call चा InvocationType तपासा.' } },
            { expr: "lambda_invocations[1]['result'] == {'partner': 'Sharma Stores', 'orders': 3, 'total': 245}", message: { en: 'The async invocation should run the handler with the same payload.', mr: 'async invocation ने तोच payload देऊन handler चालवायला हवा.' } },
          ],
          mustUse: [{ pattern: "json\\.loads\\(", message: { en: 'Read the result with json.loads(resp["Payload"].read()).', mr: 'result json.loads(resp["Payload"].read()) ने वाचा.' } }],
          mustNotUse: [{ pattern: "print\\(\\s*['\"]total: 245", message: { en: 'Print the total from the response, not a typed number.', mr: 'total response मधून print करा, टाइप केलेला number नाही.' } }],
          hints: [
            { en: "lam.invoke(FunctionName='daily-orders', InvocationType='RequestResponse', Payload=json.dumps(payload)) returns a dict with 'StatusCode' and 'Payload'.", mr: "lam.invoke(FunctionName='daily-orders', InvocationType='RequestResponse', Payload=json.dumps(payload)) 'StatusCode' आणि 'Payload' असलेली dict देतो." },
            { en: 'Payload is a stream like a file: resp["Payload"].read() gives bytes, json.loads turns them into the dict your handler returned.', mr: 'Payload हा file सारखा stream आहे: resp["Payload"].read() bytes देतो, json.loads त्यांची handler ने return केलेली dict बनवतो.' },
            { en: 'For the async call only change InvocationType to "Event". Its Payload is empty: Lambda only promises it queued the event.', mr: 'async call साठी फक्त InvocationType "Event" करा. त्याचा Payload रिकामा असतो: Lambda फक्त event queue केल्याचं सांगतं.' },
            { en: "resp = lam.invoke(FunctionName='daily-orders', InvocationType='RequestResponse', Payload=json.dumps(payload))\nprint('sync status:', resp['StatusCode'])\nprint('total:', json.loads(resp['Payload'].read())['total'])\nresp = lam.invoke(FunctionName='daily-orders', InvocationType='Event', Payload=json.dumps(payload))\nprint('async status:', resp['StatusCode'])", mr: "resp = lam.invoke(FunctionName='daily-orders', InvocationType='RequestResponse', Payload=json.dumps(payload))\nprint('sync status:', resp['StatusCode'])\nprint('total:', json.loads(resp['Payload'].read())['total'])\nresp = lam.invoke(FunctionName='daily-orders', InvocationType='Event', Payload=json.dumps(payload))\nprint('async status:', resp['StatusCode'])" },
          ],
          successLine: { en: '200 with an answer, 202 with a promise. You can now explain sync and async with your own logs.', mr: 'उत्तरासह 200, वचनासह 202. आता तुम्ही स्वतःच्या logs सह sync आणि async समजावू शकता.' },
        },
        {
          kind: 'python',
          prompt: { en: 'At 2 a.m. nobody is watching, so logs must be searchable. Make the handler print ONE JSON line (json.dumps) with request_id (context.aws_request_id), function (context.function_name), memory_mb (context.memory_limit_in_mb) and partner (from the event). Return {"ok": True, "request_id": the same id}. A hidden run uses another function name and memory size.', mr: 'रात्री 2 वाजता कोणी पाहत नसतं, म्हणून logs शोधता यायला हवेत. handler ने एकच JSON ओळ (json.dumps) print करावी: request_id (context.aws_request_id), function (context.function_name), memory_mb (context.memory_limit_in_mb) आणि partner (event मधून). {"ok": True, "request_id": तोच id} return करा. एक लपवलेला run दुसरं function नाव आणि memory size वापरतो.' },
          starter: `import json

def lambda_handler(event, context):
    print('handling a file')      # TODO: one JSON line with request_id, function, memory_mb, partner
    return {'ok': True}           # TODO: add request_id
`,
          solution: `import json

def lambda_handler(event, context):
    print(json.dumps({'request_id': context.aws_request_id, 'function': context.function_name,
                      'memory_mb': context.memory_limit_in_mb, 'partner': event['partner']}))
    return {'ok': True, 'request_id': context.aws_request_id}
`,
          aws: { lambda: { name: 'daily-orders', memoryMb: 256, events: [{ partner: 'Sharma Stores' }, { partner: 'Joshi Mart' }] } },
          checks: [
            { expr: `all(any(l.startswith('{') and ${J}(l) == {'request_id': i['requestId'], 'function': 'daily-orders', 'memory_mb': 256, 'partner': i['event']['partner']} for l in i['logs']) for i in lambda_invocations)`, message: { en: 'Each invocation\'s logs need one JSON line exactly like {"request_id": ..., "function": "daily-orders", "memory_mb": 256, "partner": ...}. Read the values from context and event.', mr: 'प्रत्येक invocation च्या logs मध्ये {"request_id": ..., "function": "daily-orders", "memory_mb": 256, "partner": ...} अशीच एक JSON ओळ हवी. values context आणि event मधून वाचा.' } },
            { expr: "all(i['result'] == {'ok': True, 'request_id': i['requestId']} for i in lambda_invocations)", message: { en: 'Return {"ok": True, "request_id": context.aws_request_id}.', mr: '{"ok": True, "request_id": context.aws_request_id} return करा.' } },
          ],
          variants: [
            {
              label: { en: 'Another function: orders-fn with 1024 MB', mr: 'दुसरं function: 1024 MB सह orders-fn' },
              aws: { lambda: { name: 'orders-fn', memoryMb: 1024, events: [{ partner: 'Patil Traders' }] } },
              checks: [
                { expr: `all(any(l.startswith('{') and ${J}(l) == {'request_id': i['requestId'], 'function': 'orders-fn', 'memory_mb': 1024, 'partner': 'Patil Traders'} for l in i['logs']) for i in lambda_invocations)`, message: { en: 'On the hidden function the JSON line is wrong. Do not type the name or memory: read context.function_name and context.memory_limit_in_mb.', mr: 'लपवलेल्या function वर JSON ओळ चुकली. नाव किंवा memory टाइप करू नका: context.function_name आणि context.memory_limit_in_mb वाचा.' } },
              ],
            },
          ],
          mustUse: [{ pattern: 'json\\.dumps\\(', message: { en: 'Print the log line with json.dumps so CloudWatch can query its fields.', mr: 'log ओळ json.dumps ने print करा म्हणजे CloudWatch त्याचे fields query करू शकेल.' } }],
          hints: [
            { en: 'context is an object: use dots, like context.aws_request_id, not context["aws_request_id"].', mr: 'context हा object आहे: dots वापरा, उदा. context.aws_request_id, context["aws_request_id"] नाही.' },
            { en: 'Build one dict with the four keys and print(json.dumps(that_dict)). One line per event makes CloudWatch Logs Insights queries easy.', mr: 'चार keys ची एक dict बनवा आणि print(json.dumps(ती_dict)) करा. प्रत्येक event ला एक ओळ असली की CloudWatch Logs Insights queries सोप्या होतात.' },
            { en: "    print(json.dumps({'request_id': context.aws_request_id, 'function': context.function_name, 'memory_mb': context.memory_limit_in_mb, 'partner': event['partner']}))\n    return {'ok': True, 'request_id': context.aws_request_id}", mr: "    print(json.dumps({'request_id': context.aws_request_id, 'function': context.function_name, 'memory_mb': context.memory_limit_in_mb, 'partner': event['partner']}))\n    return {'ok': True, 'request_id': context.aws_request_id}" },
          ],
          successLine: { en: 'Every line now says which run, which function and which partner. Future-you at 6 a.m. says thanks.', mr: 'आता प्रत्येक ओळ सांगते कोणता run, कोणतं function आणि कोणता partner. सकाळी 6 चे भविष्यातले तुम्ही आभार मानतील.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'A function has 512 MB of memory, runs 2 seconds per call, and is invoked 1,000 times. How many GB-seconds of duration is that?', mr: 'एका function ला 512 MB memory आहे, प्रत्येक call 2 सेकंद चालतो, आणि तो 1,000 वेळा invoke होतो. duration किती GB-seconds?' },
        options: ['1,024,000', '2,000', '1,000', '512'],
        answer: 2,
        explain: { en: '512 MB is 0.5 GB. 0.5 GB × 2 s = 1 GB-second per call, × 1,000 calls = 1,000 GB-seconds. You also pay for the 1,000 requests.', mr: '512 MB म्हणजे 0.5 GB. 0.5 GB × 2 s = एका call ला 1 GB-second, × 1,000 calls = 1,000 GB-seconds. शिवाय 1,000 requests चे पैसे वेगळे.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: "resp = boto3.client('lambda').invoke(\n    FunctionName='daily-orders',\n    InvocationType='Event',\n    Payload=json.dumps({'partner': 'Joshi Mart'}))\nprint(resp['StatusCode'])",
        options: ['202', '200', 'The handler\'s return value', '500'],
        answer: 0,
        explain: { en: 'An asynchronous ("Event") invoke only puts the event in Lambda\'s queue. Lambda answers 202 Accepted at once with an empty Payload; the handler runs later.', mr: 'asynchronous ("Event") invoke फक्त event Lambda च्या queue मध्ये ठेवतो. Lambda लगेच रिकाम्या Payload सह 202 Accepted देतं; handler नंतर चालतो.' },
      },
      {
        q: { en: 'Which job is the poorest fit for Lambda?', mr: 'कोणतं काम Lambda साठी सगळ्यात कमी योग्य आहे?' },
        options: [
          { en: 'Resize a receipt photo each time one is uploaded', mr: 'प्रत्येक वेळी upload झाल्यावर पावतीचा photo resize करणं' },
          { en: 'Summarise a 2 MB order file when it lands at 2 a.m.', mr: 'रात्री 2 वाजता आलेल्या 2 MB order file चा सारांश काढणं' },
          { en: 'Send a WhatsApp message when a payment fails', mr: 'payment अयशस्वी झाल्यावर WhatsApp संदेश पाठवणं' },
          { en: 'A 3-hour job that joins 40 GB of yearly sales on one machine', mr: 'एका machine वर 40 GB वार्षिक विक्री जोडणारं 3 तासांचं काम' },
        ],
        answer: 3,
        explain: { en: 'One Lambda run can last at most 30 minutes and use at most 10,240 MB of memory. A 3-hour, 40 GB job belongs on Fargate, EC2 or a big data engine like Glue or EMR. The other three are short and event-driven.', mr: 'एक Lambda run जास्तीत जास्त 30 मिनिटं चालू शकतो आणि जास्तीत जास्त 10,240 MB memory वापरू शकतो. 3 तासांचं, 40 GB चं काम Fargate, EC2 किंवा Glue, EMR सारख्या big data engine वर हवं. बाकी तिन्ही लहान आणि event-driven आहेत.' },
      },
      {
        q: { en: 'A REPORT line ends with "Init Duration: 210.40 ms". What does that mean?', mr: 'एक REPORT ओळ "Init Duration: 210.40 ms" ने संपते. त्याचा अर्थ काय?' },
        options: [
          { en: 'The handler took 210 ms longer than its timeout', mr: 'handler ला timeout पेक्षा 210 ms जास्त लागले' },
          { en: 'This was a cold start: a new execution environment was created and the code outside the handler ran first', mr: 'हा cold start होता: नवं execution environment तयार झालं आणि handler बाहेरचा code आधी चालला' },
          { en: 'The function was retried after an error', mr: 'error नंतर function retry झालं' },
          { en: 'CloudWatch took 210 ms to store the logs', mr: 'CloudWatch ला logs साठवायला 210 ms लागले' },
        ],
        answer: 1,
        explain: { en: 'Init Duration appears only on cold starts. It is the time to start the runtime and run your module-level code (imports, boto3 clients). Warm invocations skip it.', mr: 'Init Duration फक्त cold start ला दिसतो. runtime सुरू करायला आणि module-level code (imports, boto3 clients) चालवायला लागलेला हा वेळ. warm invocations मध्ये तो नसतो.' },
      },
    ],
    recap: { line: { en: 'Serverless = AWS runs the servers; you write lambda_handler(event, context), pay per request and GB-second, and read START, END and REPORT in CloudWatch. Sync waits (200), async queues (202).', mr: 'Serverless = servers AWS चालवतं; तुम्ही lambda_handler(event, context) लिहिता, प्रत्येक request आणि GB-second चे पैसे देता, आणि CloudWatch मध्ये START, END आणि REPORT वाचता. Sync वाट पाहतो (200), async queue करतो (202).' }, icon: '⚡' },
    interview: [
      {
        q: { en: 'What is serverless? Does it mean there are no servers?', mr: 'serverless म्हणजे काय? म्हणजे servers नसतात का?' },
        a: { en: 'Serverless means I do not manage servers: AWS handles the operating system, patching, capacity and scaling, and I only deploy code and configuration. The servers still exist, they are just AWS\'s responsibility. The model has three traits: it scales automatically with events, it scales to zero when idle, and I pay per use (for Lambda, per request and per GB-second of duration billed in 1 ms steps). At ChaiCart we replaced an EC2 server that ran 24 hours for a 40-second daily job with a Lambda triggered by the partner\'s file. The gotcha is that serverless still needs engineering: limits like the 30-minute timeout, cold starts, and IAM permissions are now my design problems.', mr: 'Serverless म्हणजे मी servers सांभाळत नाही: operating system, patching, capacity आणि scaling AWS बघतं, आणि मी फक्त code आणि configuration deploy करते. servers असतातच, फक्त त्यांची जबाबदारी AWS ची. या model चे तीन गुण: events प्रमाणे आपोआप scale होतं, काम नसताना शून्यावर येतं, आणि वापराइतकेच पैसे (Lambda साठी प्रत्येक request आणि 1 ms च्या टप्प्यांत मोजलेल्या GB-second duration चे). ChaiCart मध्ये 40 सेकंदांच्या रोजच्या कामासाठी 24 तास चालणारा EC2 server काढून आम्ही partner च्या file वर चालणारं Lambda लावलं. गोम अशी की serverless लाही engineering लागतं: 30 मिनिटांचा timeout, cold starts आणि IAM permissions आता माझे design प्रश्न असतात.' },
      },
      {
        q: { en: 'Lambda vs EC2 vs containers on Fargate: when do you choose which?', mr: 'Lambda vs EC2 vs Fargate वरचे containers: कोणतं कधी निवडता?' },
        a: { en: 'I choose Lambda for short, event-driven, spiky work, EC2 for steady long-running workloads or special OS needs, and Fargate when I want containers without managing servers. Lambda runs at most 30 minutes per invocation (15 until November 2026) with up to 10,240 MB of memory, and bills only while running, so it is ideal for "a file landed, process it". EC2 bills every second it is on, even idle, but it is often cheaper for constant high load and gives full control. Fargate runs a Docker image for hours, suits services and batch jobs that outgrow Lambda, and still hides the servers. For ChaiCart\'s 2 a.m. file I pick Lambda; for a nightly 3-hour reconciliation over 40 GB I would pick Fargate or a Spark engine like Glue. The gotcha is cost at scale: a function busy all day can cost more than a right-sized server.', mr: 'लहान, event-driven, अचानक वाढणाऱ्या कामासाठी मी Lambda निवडते, स्थिर दीर्घ कामासाठी किंवा खास OS गरजांसाठी EC2, आणि servers न सांभाळता containers हवे असतील तर Fargate. Lambda एका invocation ला जास्तीत जास्त 30 मिनिटं (नोव्हेंबर 2026 पर्यंत 15) आणि 10,240 MB पर्यंत memory देतं, आणि फक्त चालतानाचं बिल, म्हणून "file आली, process कर" साठी उत्तम. EC2 चालू असेपर्यंत प्रत्येक सेकंदाचं बिल लावतो, रिकामा असला तरी, पण सतत जास्त load ला बहुतेक स्वस्त पडतो आणि पूर्ण control देतो. Fargate तासन्तास Docker image चालवतो, Lambda ला न झेपणाऱ्या services आणि batch jobs साठी योग्य, आणि servers लपवूनच ठेवतो. ChaiCart च्या रात्री 2 च्या file साठी मी Lambda घेईन; 40 GB वरच्या रात्रीच्या 3 तासांच्या reconciliation साठी Fargate किंवा Glue सारखं Spark engine. गोम म्हणजे मोठ्या प्रमाणावरचा खर्च: दिवसभर busy असलेलं function योग्य आकाराच्या server पेक्षा महाग पडू शकतं.' },
      },
      {
        q: { en: 'Explain the Lambda handler signature in Python.', mr: 'Python मधली Lambda handler signature समजावा.' },
        a: { en: 'The handler is def lambda_handler(event, context), and Lambda calls it once per invocation. The event is the input JSON parsed into a dict; its shape depends on the source, for example an S3 event has Records with the bucket name and the URL-encoded key. The context gives runtime facts: aws_request_id for tracing, function_name, memory_limit_in_mb, and get_remaining_time_in_millis() to avoid timeouts. The return value must be JSON-serialisable; a synchronous caller receives it, and for async invocations it is discarded unless I configure an on-success destination. Code outside the handler runs once per execution environment at init, so I create boto3 clients there and reuse them on warm calls. The gotcha is keeping per-request data in globals: warm reuse makes it leak into the next invocation.', mr: 'handler म्हणजे def lambda_handler(event, context), आणि Lambda प्रत्येक invocation ला तो एकदा call करतं. event म्हणजे dict मध्ये बदललेला input JSON; त्याचा आकार source वर ठरतो, उदा. S3 event मध्ये Records असतात, त्यात bucket चं नाव आणि URL-encoded key. context runtime ची माहिती देतो: tracing साठी aws_request_id, function_name, memory_limit_in_mb, आणि timeout टाळायला get_remaining_time_in_millis(). return value JSON मध्ये बदलता यायला हवी; synchronous caller ला ती मिळते, आणि async invocations मध्ये on-success destination लावलं नसेल तर ती टाकून दिली जाते. handler बाहेरचा code प्रत्येक execution environment मध्ये init ला एकदाच चालतो, म्हणून मी boto3 clients तिथे बनवते आणि warm calls वर पुन्हा वापरते. गोम म्हणजे per-request data globals मध्ये ठेवणं: warm reuse मुळे तो पुढच्या invocation मध्ये गळतो.' },
      },
      {
        q: { en: 'What is the difference between synchronous and asynchronous invocation?', mr: 'synchronous आणि asynchronous invocation मध्ये फरक काय?' },
        a: { en: 'In a synchronous invocation the caller waits for the result; in an asynchronous one Lambda queues the event and returns immediately. Sync uses InvocationType RequestResponse, returns StatusCode 200 with the function\'s result, or FunctionError plus the error details, and Lambda does not retry: the caller decides. Async uses InvocationType Event, returns 202, retries function errors twice by default, and can send failures to a dead-letter queue or an on-failure destination. Payload limits differ too: 6 MB each way for sync, 1 MB for async. API Gateway and the console test button call synchronously; S3, SNS and EventBridge call asynchronously, so ChaiCart\'s file trigger is async. The gotcha is retries: async means the same event can run more than once, so the handler must be idempotent.', mr: 'synchronous invocation मध्ये caller result ची वाट पाहतो; asynchronous मध्ये Lambda event queue करतं आणि लगेच परत येतं. Sync म्हणजे InvocationType RequestResponse, function च्या result सह StatusCode 200, किंवा FunctionError आणि error ची माहिती, आणि Lambda retry करत नाही: caller ठरवतो. Async म्हणजे InvocationType Event, 202 परत, function errors वर default दोन retries, आणि failures dead-letter queue किंवा on-failure destination ला पाठवता येतात. payload मर्यादाही वेगळ्या: sync ला दोन्ही बाजूंनी 6 MB, async ला 1 MB. API Gateway आणि console चं test बटण synchronously call करतात; S3, SNS आणि EventBridge asynchronously, म्हणून ChaiCart चा file trigger async आहे. गोम म्हणजे retries: async म्हणजे एकच event एकापेक्षा जास्त वेळा चालू शकतो, म्हणून handler idempotent हवा.' },
      },
      {
        q: { en: 'What are the main Lambda limits you keep in mind?', mr: 'Lambda च्या कोणत्या मुख्य मर्यादा तुम्ही लक्षात ठेवता?' },
        a: { en: 'The ones that shape design: timeout up to 30 minutes (raised from 15 in November 2026, default 3 seconds), memory from 128 MB to 10,240 MB with CPU growing in proportion (about one vCPU at 1,769 MB), and /tmp storage from 512 MB to 10,240 MB. Payloads are 6 MB each way for synchronous calls and 1 MB for asynchronous ones. A zip package is 50 MB zipped for direct upload and 250 MB unzipped including layers, or 10 GB as a container image, with at most 5 layers and 4 KB of environment variables. Concurrency defaults to 1,000 per Region (new accounts can start lower), and each function can add up to 1,000 execution environments every 10 seconds. For ChaiCart\'s daily file these are comfortable, but a 4 GB file would make me check memory, /tmp and timeout. The gotcha: interviewers may quote the old 15-minute limit, so I mention that it changed.', mr: 'design ठरवणाऱ्या मर्यादा: timeout 30 मिनिटांपर्यंत (नोव्हेंबर 2026 मध्ये 15 वरून वाढला, default 3 सेकंद), memory 128 MB ते 10,240 MB आणि त्याच प्रमाणात वाढणारा CPU (1,769 MB ला साधारण एक vCPU), आणि /tmp storage 512 MB ते 10,240 MB. payload synchronous calls ला दोन्ही बाजूंनी 6 MB आणि asynchronous ला 1 MB. zip package थेट upload साठी zipped 50 MB आणि layers सकट unzipped 250 MB, किंवा container image म्हणून 10 GB, जास्तीत जास्त 5 layers आणि 4 KB environment variables. concurrency चा default प्रत्येक Region मध्ये 1,000 (नवीन accounts कमी पासून सुरू होऊ शकतात), आणि प्रत्येक function दर 10 सेकंदांत 1,000 पर्यंत execution environments वाढवू शकतं. ChaiCart च्या रोजच्या file साठी या आरामात पुरतात, पण 4 GB च्या file साठी मी memory, /tmp आणि timeout तपासेन. गोम: interviewers जुनी 15 मिनिटांची मर्यादा सांगू शकतात, म्हणून ती बदलली हे मी सांगते.' },
      },
      {
        q: { en: 'How is Lambda priced, and when can it become more expensive than a server?', mr: 'Lambda ची किंमत कशी ठरते, आणि ते server पेक्षा महाग कधी होऊ शकतं?' },
        a: { en: 'Lambda charges per request plus duration in GB-seconds, billed per millisecond, with a monthly free tier of 1 million requests and 400,000 GB-seconds. Duration is memory times time, so 512 MB for 2 seconds is 1 GB-second; since August 2025 the init phase of cold starts is billed too. Raising memory raises the price per millisecond but also adds CPU, so a function can finish faster and cost the same or less. ChaiCart\'s one daily run of under a minute is practically free compared with a server running all month. It gets expensive when a function is busy around the clock at high concurrency, or when it waits idle on slow APIs, because waiting time is billed too. Then I compare with Fargate or EC2, or with Compute Savings Plans, which also cover Lambda.', mr: 'Lambda प्रत्येक request चे आणि GB-seconds मधल्या duration चे पैसे घेतं, बिल प्रत्येक millisecond चं, आणि दर महिन्याला 1 million requests आणि 400,000 GB-seconds चा free tier. duration म्हणजे memory गुणिले वेळ, म्हणजे 512 MB, 2 सेकंद = 1 GB-second; ऑगस्ट 2025 पासून cold start चा init phase सुद्धा बिलात येतो. memory वाढवली की प्रत्येक millisecond ची किंमत वाढते पण CPU ही वाढतो, म्हणून function लवकर संपून खर्च तेवढाच किंवा कमी येऊ शकतो. ChaiCart चा एका मिनिटाहून कमी असलेला रोजचा एक run महिनाभर चालणाऱ्या server च्या तुलनेत जवळजवळ फुकट आहे. महाग तेव्हा होतं जेव्हा function दिवसरात्र जास्त concurrency ने busy असतं, किंवा हळू APIs ची वाट पाहत बसतं, कारण वाट पाहण्याचा वेळही बिलात येतो. मग मी Fargate किंवा EC2 शी, किंवा Lambda लाही लागू होणाऱ्या Compute Savings Plans शी तुलना करते.' },
      },
      {
        q: { en: 'How do you read a Lambda REPORT log line?', mr: 'Lambda ची REPORT log ओळ कशी वाचता?' },
        a: { en: 'The REPORT line is the per-invocation summary Lambda writes after END, and I read it like a test report. Duration is how long the handler ran, Billed Duration is what I pay for (rounded up to the millisecond, and including Init Duration on cold starts since August 2025), Memory Size is what I configured, and Max Memory Used is the peak. Init Duration appears only on cold starts. If Max Memory Used is close to Memory Size, I risk out-of-memory errors; if it is far below and Duration is long and CPU-bound, more memory may make it faster. I match the RequestId with my own logs, which is why ChaiCart\'s handler logs the aws_request_id in every JSON line. The gotcha: a timeout shows Duration equal to the timeout plus a "Task timed out" line, not a Python traceback.', mr: 'REPORT ओळ म्हणजे END नंतर Lambda ने लिहिलेला प्रत्येक invocation चा सारांश, आणि मी तो test report सारखा वाचते. Duration म्हणजे handler किती वेळ चालला, Billed Duration म्हणजे ज्याचे पैसे लागतात (millisecond पर्यंत वर, आणि ऑगस्ट 2025 पासून cold start ला Init Duration सकट), Memory Size म्हणजे मी ठरवलेली, आणि Max Memory Used म्हणजे सर्वाधिक वापर. Init Duration फक्त cold start ला दिसतो. Max Memory Used Memory Size च्या जवळ असेल तर out-of-memory चा धोका; खूप कमी असेल आणि Duration जास्त, CPU-bound असेल तर जास्त memory ने ते वेगवान होऊ शकतं. RequestId मी माझ्या logs शी जुळवते, म्हणूनच ChaiCart चा handler प्रत्येक JSON ओळीत aws_request_id लिहितो. गोम: timeout झाला तर Duration timeout इतकाच दिसतो आणि "Task timed out" ओळ येते, Python traceback नाही.' },
      },
    ],
  },

  // ───────────────────────── L1.2 S3 events trigger Lambda
  {
    id: 'lm1-2',
    code: 'L1.2',
    level: 'intermediate',
    title: { en: 'S3 events trigger Lambda', mr: 'S3 events Lambda ला trigger करतात' },
    skill: 'S3 event notifications (event types, prefix/suffix), Records shape, unquote_plus keys, read-transform-write to another prefix/bucket, recursive loops, S3→Lambda vs SQS vs EventBridge, at-least-once',
    realLife: {
      place: 'postoffice',
      title: { en: 'The bell on the incoming tray', mr: 'आवक ट्रेवरची घंटा' },
      story: {
        en: 'At the Shivajinagar post office, the sorting clerk Pawar kaka has a bell fixed to the "incoming" tray. The moment a parcel drops in, the bell rings, and he reads the slip tied to it: which counter, which parcel. Some slips are written in the old postal shorthand, where a space is written as a "+", so "Sharma+Stores" really means "Sharma Stores"; read it literally and he searches the shelves for a name that does not exist. He opens the parcel, repacks it, and puts it in the "outgoing" tray. Once, a new clerk put the repacked parcel back into "incoming". The bell rang, he repacked it again, put it back, and the bell rang again, all afternoon, until the postmaster pulled the bell wire. Pawar kaka also knows the bell sometimes rings twice for one parcel, so he checks the parcel number before repacking.',
        mr: 'शिवाजीनगर पोस्ट ऑफिसमध्ये sorting करणाऱ्या पवार काकांनी "आवक" ट्रेला एक घंटा लावली आहे. पार्सल आत पडताच घंटा वाजते, आणि ते त्याला बांधलेली चिठ्ठी वाचतात: कोणता counter, कोणतं पार्सल. काही चिठ्ठ्या जुन्या postal लघुलिपीत असतात, जिथे space ऐवजी "+" लिहितात, म्हणजे "Sharma+Stores" चा खरा अर्थ "Sharma Stores"; जसंच्या तसं वाचलं तर ते नसलेलं नाव कपाटात शोधत बसतात. ते पार्सल उघडतात, पुन्हा बांधतात, आणि "जावक" ट्रेत ठेवतात. एकदा एका नव्या clerk ने पुन्हा बांधलेलं पार्सल परत "आवक" मध्ये ठेवलं. घंटा वाजली, त्याने ते पुन्हा बांधलं, परत ठेवलं, पुन्हा घंटा, अख्खी दुपार, शेवटी पोस्टमास्तरांनी घंटेची तार ओढली. पवार काकांना हेही माहीत आहे की एका पार्सलसाठी कधी कधी घंटा दोनदा वाजते, म्हणून पुन्हा बांधण्याआधी ते पार्सलचा नंबर तपासतात.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📦', label: 'A parcel lands in incoming/', mr: 'पार्सल incoming/ मध्ये पडतं' },
          { icon: '🔔', label: 'The bell rings (S3 event)', mr: 'घंटा वाजते (S3 event)' },
          { icon: '🏷️', label: 'Read the slip: bucket and key', mr: 'चिठ्ठी वाचा: bucket आणि key' },
          { icon: '🔍', label: 'Decode it: + means a space', mr: 'उलगडा: + म्हणजे space' },
          { icon: '📤', label: 'Repack into a different tray', mr: 'पुन्हा बांधून दुसऱ्या ट्रेत' },
        ],
        breakAt: 4,
        breakNote: { en: 'Put it back into incoming/ and the bell rings forever: a recursive loop.', mr: 'परत incoming/ मध्ये ठेवलं तर घंटा कायम वाजते: recursive loop.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'theo', mood: 'neutral', text: { en: 'The partner uploads to chaicart-raw under incoming/. I want the shop summary in chaicart-clean the moment the file lands, not at 6 a.m.', mr: 'partner chaicart-raw मध्ये incoming/ खाली upload करतो. file येताच दुकानांचा सारांश chaicart-clean मध्ये हवा, सकाळी 6 ला नाही.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'An S3 event notification on prefix incoming/ and suffix .csv, pointing at our Lambda. S3 calls the function with the bucket and key of each new file.', mr: 'prefix incoming/ आणि suffix .csv वर S3 event notification, आपल्या Lambda कडे. प्रत्येक नव्या file चा bucket आणि key देऊन S3 function call करतं.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'i told the partner to name today\'s file "orders 24 Nov.csv". with spaces. watch your get_object cry NoSuchKey.', mr: 'मी partner ला आजच्या file चं नाव "orders 24 Nov.csv" ठेवायला सांगितलं. spaces सकट. आता तुमचा get_object NoSuchKey म्हणून रडताना पाहा.' } },
        { who: 'sam', mood: 'worried', text: { en: 'And last month a test function wrote its output into the same folder. The bill that day scared me.', mr: 'आणि मागच्या महिन्यात एका test function ने त्याचं output त्याच folder मध्ये लिहिलं. त्या दिवसाच्या बिलाने मला घाम फुटला.' } },
        { who: 'meera', mood: 'happy', text: { en: '{name}, three rules today: read the real event shape, decode the key, and never write back where the bell is.', mr: '{name}, आज तीन नियम: event चा खरा आकार वाचा, key decode करा, आणि घंटा जिथे आहे तिथे कधीच परत लिहू नका.' } },
      ],
      problem: { en: 'Files land at random hours, file names contain spaces and symbols, and a careless output location can make a function trigger itself again and again.', mr: 'files कधीही येतात, file नावांत spaces आणि चिन्हं असतात, आणि output ची चुकीची जागा function ला पुन्हा पुन्हा स्वतःलाच trigger करायला लावू शकते.' },
      solution: { en: 'An S3 event notification (ObjectCreated, prefix incoming/, suffix .csv) invokes the Lambda; the handler loops over Records, decodes each key with urllib.parse.unquote_plus, reads the object, and writes the result to another bucket or prefix the trigger does not watch. For bursts or many consumers, S3 sends to SQS or EventBridge first.', mr: 'S3 event notification (ObjectCreated, prefix incoming/, suffix .csv) Lambda invoke करतो; handler Records वर loop करतो, प्रत्येक key urllib.parse.unquote_plus ने decode करतो, object वाचतो, आणि result trigger न पाहणाऱ्या दुसऱ्या bucket किंवा prefix मध्ये लिहितो. burst किंवा अनेक consumers असतील तर S3 आधी SQS किंवा EventBridge ला पाठवतं.' },
    },
    lesson: [
      { en: 'An event notification is part of the bucket\'s configuration. It names the event types (s3:ObjectCreated:* or just :Put, :Post, :Copy, :CompleteMultipartUpload; s3:ObjectRemoved:*; also restore, replication, lifecycle and tagging events), an optional key filter (a prefix like incoming/ and a suffix like .csv; no wildcards, and two rules for the same event type cannot have overlapping prefixes or suffixes), and a destination: a Lambda function, a standard SQS queue (FIFO queues are not supported directly), an SNS topic, or EventBridge. S3 invokes Lambda asynchronously, and it needs permission to do so: a resource-based policy on the function that lets s3.amazonaws.com call lambda:InvokeFunction (the console adds it). Separately, the function\'s execution role needs s3:GetObject to read the file. Delivery is at least once, usually within seconds, sometimes a minute or longer, and not guaranteed in order.', mr: 'event notification हा bucket च्या configuration चा भाग आहे. त्यात event types (s3:ObjectCreated:* किंवा फक्त :Put, :Post, :Copy, :CompleteMultipartUpload; s3:ObjectRemoved:*; शिवाय restore, replication, lifecycle आणि tagging events), एक optional key filter (incoming/ सारखा prefix आणि .csv सारखा suffix; wildcards नाहीत, आणि एकाच event type साठी दोन rules चे prefixes किंवा suffixes overlap होऊ शकत नाहीत), आणि destination: Lambda function, standard SQS queue (FIFO queues थेट चालत नाहीत), SNS topic, किंवा EventBridge. S3 Lambda ला asynchronously invoke करतं, आणि त्यासाठी परवानगी लागते: function वरची resource-based policy जी s3.amazonaws.com ला lambda:InvokeFunction करू देते (console ती जोडतो). त्याशिवाय, file वाचायला function च्या execution role ला s3:GetObject लागतं. delivery किमान एकदा (at least once) होते, बहुतेक काही सेकंदांत, कधी एक मिनिट किंवा जास्त, आणि क्रमाची खात्री नाही.' },
      { en: 'The event is JSON with a Records list. For each record: record["s3"]["bucket"]["name"] is the bucket, record["s3"]["object"]["key"] the key, plus size, eTag and (with versioning) versionId. Always loop over Records instead of taking [0] blindly. The key is URL-encoded: "orders 24 Nov.csv" arrives as "orders+24+Nov.csv", "&" as "%26". Pass it straight to get_object and S3 answers NoSuchKey for a file that is right there. The fix is one line: key = urllib.parse.unquote_plus(raw_key). unquote_plus (not unquote) is the one that turns + back into a space.', mr: 'event म्हणजे Records list असलेला JSON. प्रत्येक record साठी: record["s3"]["bucket"]["name"] म्हणजे bucket, record["s3"]["object"]["key"] म्हणजे key, शिवाय size, eTag आणि (versioning असेल तर) versionId. [0] डोळे झाकून घेण्याऐवजी नेहमी Records वर loop करा. key URL-encoded असते: "orders 24 Nov.csv" येते "orders+24+Nov.csv" म्हणून, "&" येतं "%26" म्हणून. ती थेट get_object ला दिली तर समोर असलेल्या file साठी S3 NoSuchKey देतं. उपाय एका ओळीचा: key = urllib.parse.unquote_plus(raw_key). + परत space मध्ये बदलणारा unquote_plus आहे (unquote नाही).' },
      { en: 'The usual handler reads the object (get_object(...)["Body"].read().decode("utf-8")), transforms it with the csv module, and writes the result somewhere the trigger does not watch: another bucket like chaicart-clean, or a prefix like processed/ when the trigger only covers incoming/. If the function writes into the prefix that triggers it, every output is a new upload that invokes the function again: a recursive loop that burns money and concurrency. AWS recursive loop detection (for loops through S3, SQS, SNS, EventBridge custom buses and Lambda itself) stops the chain after about 16 invocations and notifies you, and the lab does the same. Treat it as an airbag and design the loop away: AWS\'s own docs say use two buckets, or a trigger prefix only for incoming files.', mr: 'नेहमीचा handler object वाचतो (get_object(...)["Body"].read().decode("utf-8")), csv module ने त्याचं रूपांतर करतो, आणि result trigger न पाहणाऱ्या जागी लिहितो: chaicart-clean सारखा दुसरा bucket, किंवा trigger फक्त incoming/ वर असेल तर processed/ सारखा prefix. function ज्या prefix मुळे trigger होतं तिथेच लिहिलं, तर प्रत्येक output हा नवा upload ठरतो जो function पुन्हा invoke करतो: पैसे आणि concurrency जाळणारा recursive loop. AWS recursive loop detection (S3, SQS, SNS, EventBridge custom buses आणि Lambda मधून जाणाऱ्या loops साठी) साधारण 16 invocations नंतर साखळी थांबवतं आणि कळवतं, आणि lab पण तसंच करतो. याला airbag समजा आणि loop design मधूनच टाळा: AWS चे docs सांगतात, दोन buckets वापरा, किंवा trigger prefix फक्त येणाऱ्या files साठी ठेवा.' },
      { en: 'Three ways to wire it. S3 → Lambda directly: simplest, one consumer, async retries. S3 → SQS → Lambda: the queue absorbs bursts (5,000 files at once), Lambda reads in batches, you can cap the function\'s concurrency on the event source mapping to protect a database, messages can wait up to 14 days, and after maxReceiveCount failures they move to a dead-letter queue (set the queue\'s visibility timeout to at least 6 times the function timeout). S3 → EventBridge: turn EventBridge on for the bucket and every event goes to the bus, where rules filter on more fields (size, key patterns) and send one event to many targets (Step Functions, several Lambdas, SQS FIFO), with archive and replay. Whatever the pipe, delivery is at least once, so the handler must cope with duplicates (next lesson).', mr: 'जोडायच्या तीन पद्धती. S3 → Lambda थेट: सगळ्यात सोपं, एक consumer, async retries. S3 → SQS → Lambda: queue burst शोषून घेते (एकदम 5,000 files), Lambda batches मध्ये वाचतं, database वाचवायला event source mapping वर function ची concurrency मर्यादित करता येते, messages 14 दिवसांपर्यंत थांबू शकतात, आणि maxReceiveCount वेळा अपयशी झाल्यावर ते dead-letter queue मध्ये जातात (queue चा visibility timeout function timeout च्या किमान 6 पट ठेवा). S3 → EventBridge: bucket साठी EventBridge चालू करा आणि प्रत्येक event bus वर जातो, जिथे rules जास्त fields वर filter करतात (size, key patterns) आणि एकच event अनेक targets ना पाठवतात (Step Functions, अनेक Lambdas, SQS FIFO), archive आणि replay सकट. पाईप कोणताही असो, delivery किमान एकदा, म्हणून handler ने duplicates सांभाळायला हवेत (पुढचा धडा).' },
    ],
    syntax: {
      template: `import csv, io, urllib.parse
import boto3

s3 = boto3.client('s3')

def lambda_handler(event, context):
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])
        text = s3.get_object(Bucket=bucket, Key=key)['Body'].read().decode('utf-8')
        rows = list(csv.DictReader(io.StringIO(text)))
        out_key = 'summary/' + key.split('/')[-1]
        s3.put_object(Bucket='chaicart-clean', Key=out_key, Body=make_summary(rows))
    return {'files': len(event['Records'])}`,
      parts: [
        { code: "event['Records']", means: { en: 'the list of S3 records in this event; loop over it', mr: 'या event मधल्या S3 records ची list; तिच्यावर loop करा' } },
        { code: "record['s3']['bucket']['name']", means: { en: 'the bucket where the object landed', mr: 'ज्या bucket मध्ये object आला तो' } },
        { code: "urllib.parse.unquote_plus(record['s3']['object']['key'])", means: { en: 'the real key: + becomes a space, %26 becomes &', mr: 'खरी key: + चा space, %26 चं &' } },
        { code: "s3.get_object(...)['Body'].read().decode('utf-8')", means: { en: 'download the object and turn the bytes into text', mr: 'object download करा आणि bytes चा text करा' } },
        { code: 'csv.DictReader(io.StringIO(text))', means: { en: 'read CSV text that lives in memory, like a file', mr: 'memory मधला CSV text file सारखा वाचा' } },
        { code: "Bucket='chaicart-clean'", means: { en: 'write somewhere the trigger does not watch, or you build a loop', mr: 'trigger न पाहणाऱ्या जागी लिहा, नाहीतर loop तयार होतो' } },
      ],
      example: [
        { code: "'key': 'incoming/2026/11/24/orders+24+Nov.csv'", note: { en: 'the slip in postal shorthand, as S3 sends it', mr: 'postal लघुलिपीतली चिठ्ठी, S3 पाठवतं तशी' } },
        { code: "unquote_plus(...)  # 'incoming/2026/11/24/orders 24 Nov.csv'", note: { en: 'decoded: now get_object finds the parcel', mr: 'उलगडली: आता get_object ला पार्सल सापडतं' } },
        { code: "Filter: prefix 'incoming/', suffix '.csv'", note: { en: 'the bell rings only for CSV files in the incoming tray', mr: 'घंटा फक्त आवक ट्रेतल्या CSV files साठी वाजते' } },
        { code: "put_object(Bucket='chaicart-clean', Key='summary/orders 24 Nov.csv', ...)", note: { en: 'the repacked parcel goes to a different tray', mr: 'पुन्हा बांधलेलं पार्सल दुसऱ्या ट्रेत जातं' } },
        { code: "put_object(Bucket='chaicart-raw', Key='incoming/clean.csv', ...)  # never", note: { en: 'back into incoming: the bell rings forever', mr: 'परत आवक मध्ये: घंटा कायम वाजते' } },
      ],
      pitfall: { en: 'Two classics: using the raw key from the event (NoSuchKey on any file with a space or symbol), and writing output under the trigger prefix and suffix (a recursive loop). Changing only the extension, like writing incoming/x.json under a .csv filter, is fragile: the day someone removes the suffix filter, the loop is back. Use a separate prefix or bucket.', mr: 'दोन नेहमीच्या चुका: event मधली raw key वापरणं (space किंवा चिन्ह असलेल्या कोणत्याही file वर NoSuchKey), आणि output trigger च्या prefix आणि suffix खाली लिहिणं (recursive loop). फक्त extension बदलणं, उदा. .csv filter खाली incoming/x.json लिहिणं, नाजूक आहे: ज्या दिवशी कोणी suffix filter काढेल, loop परत येईल. वेगळा prefix किंवा bucket वापरा.' },
    },
    practice: {
      intro: { en: 'Wire ChaiCart\'s 2 a.m. file to Lambda. The lab sends real-shaped S3 events (like the console\'s s3-put test template), and hidden runs use other buckets, other days and keys full of spaces.', mr: 'ChaiCart ची रात्री 2 ची file Lambda ला जोडा. lab खऱ्या आकाराचे S3 events पाठवतो (console च्या s3-put test template सारखे), आणि लपवलेले runs दुसरे buckets, दुसरे दिवस आणि spaces भरलेल्या keys वापरतात.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'Read the slip. Finish lambda_handler so it returns {"bucket": ..., "key": ..., "size": ...} for the first record, with the key decoded by urllib.parse.unquote_plus. The lab sends two S3 events; the second file is "orders 24 Nov.csv". Open the Lambda tab to see the raw event key with + signs.', mr: 'चिठ्ठी वाचा. lambda_handler असा पूर्ण करा की तो पहिल्या record साठी {"bucket": ..., "key": ..., "size": ...} return करेल, key urllib.parse.unquote_plus ने decode करून. lab दोन S3 events पाठवतो; दुसरी file "orders 24 Nov.csv" आहे. + चिन्हांसह raw event key पाहायला Lambda टॅब उघडा.' },
          starter: `import urllib.parse

def lambda_handler(event, context):
    record = event['Records'][0]
    bucket = record['s3']['bucket']['name']
    key = record['s3']['object']['key']          # TODO: decode it
    size = 0                                     # TODO: the size from the event
    return {'bucket': bucket, 'key': key, 'size': size}
`,
          solution: `import urllib.parse

def lambda_handler(event, context):
    record = event['Records'][0]
    bucket = record['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(record['s3']['object']['key'])
    size = record['s3']['object']['size']
    return {'bucket': bucket, 'key': key, 'size': size}
`,
          aws: { lambda: { name: 'process-orders', events: [s3ev('chaicart-raw', 'incoming/2026/11/24/orders.csv', 120), s3ev('chaicart-raw', RAW_KEY, 98)] } },
          checks: [
            { expr: "[i['result'] for i in lambda_invocations] == [{'bucket': 'chaicart-raw', 'key': 'incoming/2026/11/24/orders.csv', 'size': 120}, {'bucket': 'chaicart-raw', 'key': 'incoming/2026/11/24/orders 24 Nov.csv', 'size': 98}]", message: { en: 'The second result should have the key "incoming/2026/11/24/orders 24 Nov.csv" (with spaces, not +) and size 98. Decode with urllib.parse.unquote_plus and read size from the event.', mr: 'दुसऱ्या result मध्ये key "incoming/2026/11/24/orders 24 Nov.csv" (spaces सह, + नाही) आणि size 98 हवा. urllib.parse.unquote_plus ने decode करा आणि size event मधून वाचा.' } },
          ],
          variants: [
            {
              label: { en: 'Another bucket, and a key with & and brackets', mr: 'दुसरा bucket, आणि & व कंस असलेली key' },
              aws: { lambda: { name: 'process-orders', events: [s3ev('chaicart-partner-drop', 'incoming/Sharma & Sons/day 2 (late).csv', 340)] } },
              checks: [
                { expr: "[i['result'] for i in lambda_invocations] == [{'bucket': 'chaicart-partner-drop', 'key': 'incoming/Sharma & Sons/day 2 (late).csv', 'size': 340}]", message: { en: 'On the hidden event the key or bucket is wrong. Read the bucket from the event, and unquote_plus turns %26 into & as well.', mr: 'लपवलेल्या event वर key किंवा bucket चुकला. bucket event मधून वाचा, आणि unquote_plus %26 चं & सुद्धा करतो.' } },
              ],
            },
          ],
          mustUse: [{ pattern: 'unquote_plus', message: { en: 'Decode the key with urllib.parse.unquote_plus.', mr: 'key urllib.parse.unquote_plus ने decode करा.' } }],
          hints: [
            { en: 'Look at the raw key in the Lambda tab: orders+24+Nov.csv. S3 URL-encodes keys in events.', mr: 'Lambda टॅबमध्ये raw key पाहा: orders+24+Nov.csv. S3 events मध्ये keys URL-encode करतं.' },
            { en: 'urllib.parse.unquote_plus(text) turns + into a space and %26 into &. The size sits next to the key: record["s3"]["object"]["size"].', mr: 'urllib.parse.unquote_plus(text) + चा space आणि %26 चं & करतो. size key च्या शेजारी आहे: record["s3"]["object"]["size"].' },
            { en: "    key = urllib.parse.unquote_plus(record['s3']['object']['key'])\n    size = record['s3']['object']['size']", mr: "    key = urllib.parse.unquote_plus(record['s3']['object']['key'])\n    size = record['s3']['object']['size']" },
          ],
          successLine: { en: 'The Gremlin\'s spaces are decoded. The slip reads right.', mr: 'Gremlin च्या spaces उलगडल्या. चिठ्ठी आता बरोबर वाचली जाते.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Now the full job. For every record: decode the key, read the CSV from S3, and write summarise(text) to bucket chaicart-clean under "summary/" + the file name (the part after the last /). Return {"files": number of records}. Do not touch chaicart-raw. The starter has the classic bug: press Run and read the NoSuchKey in the Lambda tab first. A hidden run sends two files in one event.', mr: 'आता पूर्ण काम. प्रत्येक record साठी: key decode करा, S3 मधून CSV वाचा, आणि summarise(text) bucket chaicart-clean मध्ये "summary/" + file नाव (शेवटच्या / नंतरचा भाग) खाली लिहा. {"files": records ची संख्या} return करा. chaicart-raw ला हात लावू नका. starter मध्ये तोच प्रसिद्ध bug आहे: आधी Run दाबा आणि Lambda टॅबमधला NoSuchKey वाचा. एक लपवलेला run एकाच event मध्ये दोन files पाठवतो.' },
          starter: `${L2_HEAD}
def lambda_handler(event, context):
    record = event['Records'][0]                 # TODO: loop over every record
    bucket = record['s3']['bucket']['name']
    key = record['s3']['object']['key']          # TODO: decode it
    text = s3.get_object(Bucket=bucket, Key=key)['Body'].read().decode('utf-8')
    # TODO: put summarise(text) into chaicart-clean at 'summary/' + file name
    return {'files': 0}
`,
          solution: `${L2_HEAD}
def lambda_handler(event, context):
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])
        text = s3.get_object(Bucket=bucket, Key=key)['Body'].read().decode('utf-8')
        out_key = 'summary/' + key.split('/')[-1]
        s3.put_object(Bucket='chaicart-clean', Key=out_key, Body=summarise(text), ContentType='text/csv')
        print('wrote', out_key)
    return {'files': len(event['Records'])}
`,
          aws: {
            buckets: { 'chaicart-raw': { [RAW_KEY]: ORDERS_A }, 'chaicart-clean': {} },
            bucketConfig: { 'chaicart-raw': { notifyPrefix: 'incoming/', notifySuffix: '.csv' } },
            lambda: { name: 'process-orders', events: [s3ev('chaicart-raw', RAW_KEY, ORDERS_A.length)] },
          },
          checks: [
            { expr: `s3_text('chaicart-clean', 'summary/orders 24 Nov.csv') == '${SUMMARY_A}'`, message: { en: 'chaicart-clean should have summary/orders 24 Nov.csv with the summary (header shop,orders,amount and one line per shop). Check the bucket, the key and that you used summarise(text).', mr: 'chaicart-clean मध्ये summary/orders 24 Nov.csv आणि त्यात सारांश हवा (header shop,orders,amount आणि प्रत्येक दुकानाची एक ओळ). bucket, key आणि summarise(text) वापरलं का ते तपासा.' } },
            { expr: `s3_keys('chaicart-raw') == ['${RAW_KEY}']`, message: { en: 'chaicart-raw changed. Only read from it; write to chaicart-clean.', mr: 'chaicart-raw बदलला. त्यातून फक्त वाचा; chaicart-clean मध्ये लिहा.' } },
            { expr: "lambda_invocations[0]['result'] == {'files': 1}", message: { en: 'Return {"files": len(event["Records"])}.', mr: '{"files": len(event["Records"])} return करा.' } },
          ],
          variants: [
            {
              label: { en: 'Next day: two files in one event, one with spaces', mr: 'पुढचा दिवस: एका event मध्ये दोन files, एकात spaces' },
              aws: {
                buckets: { 'chaicart-raw': { 'incoming/2026/11/25/orders.csv': ORDERS_B, 'incoming/2026/11/25/late orders.csv': ORDERS_A }, 'chaicart-clean': {} },
                bucketConfig: { 'chaicart-raw': { notifyPrefix: 'incoming/', notifySuffix: '.csv' } },
                lambda: { name: 'process-orders', events: [{ Records: [...s3ev('chaicart-raw', 'incoming/2026/11/25/orders.csv', ORDERS_B.length).Records, ...s3ev('chaicart-raw', 'incoming/2026/11/25/late orders.csv', ORDERS_A.length).Records] }] },
              },
              checks: [
                { expr: `s3_text('chaicart-clean', 'summary/orders.csv') == '${SUMMARY_B}' and s3_text('chaicart-clean', 'summary/late orders.csv') == '${SUMMARY_A}'`, message: { en: 'With two records in one event, both summaries must be written. Loop over event["Records"] instead of taking only [0].', mr: 'एका event मध्ये दोन records असतील तर दोन्ही सारांश लिहायला हवेत. फक्त [0] न घेता event["Records"] वर loop करा.' } },
                { expr: "lambda_invocations[0]['result'] == {'files': 2}", message: { en: 'Two records should return {"files": 2}.', mr: 'दोन records साठी {"files": 2} return व्हायला हवं.' } },
              ],
            },
          ],
          mustUse: [
            { pattern: 'for\\s+\\w+\\s+in\\s+event\\[.Records.\\]', message: { en: 'Loop over event["Records"].', mr: 'event["Records"] वर loop करा.' } },
            { pattern: 'unquote_plus', message: { en: 'Decode each key with urllib.parse.unquote_plus.', mr: 'प्रत्येक key urllib.parse.unquote_plus ने decode करा.' } },
          ],
          hints: [
            { en: 'The NoSuchKey happens because the key still has + signs. Decode first, then call get_object.', mr: 'NoSuchKey येतो कारण key मध्ये अजून + चिन्हं आहेत. आधी decode, मग get_object.' },
            { en: 'for record in event["Records"]: ... and inside, key.split("/")[-1] gives the file name. put_object(Bucket="chaicart-clean", Key="summary/" + name, Body=summarise(text)).', mr: 'for record in event["Records"]: ... आणि आत key.split("/")[-1] file नाव देतो. put_object(Bucket="chaicart-clean", Key="summary/" + name, Body=summarise(text)).' },
            { en: "    for record in event['Records']:\n        bucket = record['s3']['bucket']['name']\n        key = urllib.parse.unquote_plus(record['s3']['object']['key'])\n        text = s3.get_object(Bucket=bucket, Key=key)['Body'].read().decode('utf-8')\n        s3.put_object(Bucket='chaicart-clean', Key='summary/' + key.split('/')[-1], Body=summarise(text))\n    return {'files': len(event['Records'])}", mr: "    for record in event['Records']:\n        bucket = record['s3']['bucket']['name']\n        key = urllib.parse.unquote_plus(record['s3']['object']['key'])\n        text = s3.get_object(Bucket=bucket, Key=key)['Body'].read().decode('utf-8')\n        s3.put_object(Bucket='chaicart-clean', Key='summary/' + key.split('/')[-1], Body=summarise(text))\n    return {'files': len(event['Records'])}" },
          ],
          successLine: { en: 'The file lands, the summary appears. Nobody set an alarm.', mr: 'file येते, सारांश तयार. कोणीही गजर लावला नाही.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'A new teammate wrote this function. Press Run: the file uploads one CSV into incoming/, which triggers the function. Open the Lambda tab and count the invocations. What happened?', mr: 'एका नव्या सहकाऱ्याने हे function लिहिलं. Run दाबा: file incoming/ मध्ये एक CSV upload करते, जी function ला trigger करते. Lambda टॅब उघडा आणि invocations मोजा. काय झालं?' },
          pythonSandbox: {
            code: L2_LOOP_SANDBOX,
            aws: { buckets: { 'chaicart-raw': {} }, bucketConfig: { 'chaicart-raw': { notifyPrefix: 'incoming/', notifySuffix: '.csv' } }, lambda: { name: 'process-orders' } },
          },
          options: [
            { en: 'The function ran once and wrote one clean file', mr: 'function एकदा चाललं आणि एक clean file लिहिली' },
            { en: 'Each file it wrote under incoming/ ending in .csv was a new upload that triggered it again; the chain was stopped after 16 invocations as a recursive loop', mr: 'त्याने incoming/ खाली लिहिलेली .csv ने संपणारी प्रत्येक file नवा upload ठरली आणि तिने ते पुन्हा trigger केलं; 16 invocations नंतर recursive loop म्हणून साखळी थांबवली गेली' },
            { en: 'S3 retried the event because the function was too slow', mr: 'function खूप हळू होतं म्हणून S3 ने event retry केला' },
            { en: 'The partner uploaded 16 files at once', mr: 'partner ने एकदम 16 files upload केल्या' },
          ],
          correct: [1],
          explain: { en: 'The output "incoming/clean-orders.csv" matches the trigger (prefix incoming/, suffix .csv), so it fires again, writing "incoming/clean-clean-orders.csv", and so on. AWS loop detection stops such chains after about 16 invocations, but the real fix is design: write to another bucket or a prefix outside the filter.', mr: 'output "incoming/clean-orders.csv" trigger शी जुळतो (prefix incoming/, suffix .csv), म्हणून ते पुन्हा चालतं, "incoming/clean-clean-orders.csv" लिहितं, आणि असंच पुढे. AWS loop detection अशा साखळ्या साधारण 16 invocations नंतर थांबवतं, पण खरा उपाय design चा: दुसऱ्या bucket मध्ये किंवा filter बाहेरच्या prefix मध्ये लिहा.' },
          hints: [
            { en: 'Look at the keys the function wrote, one per invocation. Does each one match prefix incoming/ and suffix .csv?', mr: 'function ने प्रत्येक invocation ला लिहिलेल्या keys पाहा. प्रत्येक key prefix incoming/ आणि suffix .csv शी जुळते का?' },
            { en: 'The last entry in the Lambda tab is not an invocation: it is loop detection.', mr: 'Lambda टॅबमधली शेवटची नोंद invocation नाही: ते loop detection आहे.' },
          ],
          successLine: { en: 'You saw a recursive loop with your own eyes. You will not build one.', mr: 'तुम्ही recursive loop स्वतःच्या डोळ्यांनी पाहिला. आता तुम्ही तो बनवणार नाही.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Fix the loop. This function turns the CSV into JSON, but writes it back under incoming/. Write it to "processed/" + the file name with .csv replaced by .json, in the same bucket (the trigger only watches incoming/). The partner upload at the bottom stays. A hidden run uses a trigger with no suffix filter, so a trick like "incoming/x.json" will loop there.', mr: 'loop दुरुस्त करा. हे function CSV चा JSON बनवतं, पण तो परत incoming/ खाली लिहितं. तो त्याच bucket मध्ये "processed/" + file नाव (.csv ऐवजी .json) इथे लिहा (trigger फक्त incoming/ पाहतो). खालचा partner upload तसाच राहील. एक लपवलेला run suffix filter नसलेला trigger वापरतो, म्हणून "incoming/x.json" सारखी युक्ती तिथे loop करेल.' },
          starter: `${L2_FIX_HEAD}    out_key = 'incoming/' + name.replace('.csv', '-clean.csv')     # TODO: write outside the trigger
${L2_FIX_TAIL}`,
          solution: `${L2_FIX_HEAD}    out_key = 'processed/' + name.replace('.csv', '.json')
${L2_FIX_TAIL}`,
          aws: { buckets: { 'chaicart-raw': {} }, bucketConfig: { 'chaicart-raw': { notifyPrefix: 'incoming/', notifySuffix: '.csv' } }, lambda: { name: 'process-orders' } },
          checks: [
            { expr: "s3_keys('chaicart-raw', 'processed/') == ['processed/orders 24 Nov.json']", message: { en: 'chaicart-raw should contain processed/orders 24 Nov.json.', mr: 'chaicart-raw मध्ये processed/orders 24 Nov.json हवी.' } },
            { expr: `len(${J}(s3_text('chaicart-raw', 'processed/orders 24 Nov.json'))) == 2`, message: { en: 'The JSON file should hold the 2 order rows.', mr: 'JSON file मध्ये 2 order rows हव्यात.' } },
            { expr: 'len(lambda_invocations) == 1', message: { en: 'The function should run exactly once for one upload.', mr: 'एका upload साठी function एकदाच चालायला हवं.' } },
          ],
          variants: [
            {
              label: { en: 'Trigger on incoming/ with no suffix filter', mr: 'incoming/ वरचा trigger, suffix filter शिवाय' },
              aws: { buckets: { 'chaicart-raw': {} }, bucketConfig: { 'chaicart-raw': { notifyPrefix: 'incoming/' } }, lambda: { name: 'process-orders' } },
              checks: [
                { expr: "len(lambda_invocations) == 1 and s3_keys('chaicart-raw', 'processed/') == ['processed/orders 24 Nov.json']", message: { en: 'With no suffix filter, any file written under incoming/ triggers the function again. Write under processed/.', mr: 'suffix filter नसेल तर incoming/ खाली लिहिलेली कोणतीही file function पुन्हा trigger करते. processed/ खाली लिहा.' } },
              ],
            },
          ],
          mustNotUse: [{ pattern: "out_key\\s*=\\s*['\"]incoming/", message: { en: 'Do not write output under incoming/: that prefix triggers the function.', mr: 'output incoming/ खाली लिहू नका: तो prefix function trigger करतो.' } }],
          hints: [
            { en: 'The only line to change is out_key. It must not start with incoming/.', mr: 'फक्त out_key ची ओळ बदलायची. ती incoming/ ने सुरू होता कामा नये.' },
            { en: "name.replace('.csv', '.json') changes the extension; put 'processed/' in front.", mr: "name.replace('.csv', '.json') extension बदलतो; पुढे 'processed/' लावा." },
            { en: "    out_key = 'processed/' + name.replace('.csv', '.json')", mr: "    out_key = 'processed/' + name.replace('.csv', '.json')" },
          ],
          successLine: { en: 'One upload, one invocation, one output. The bell rings once.', mr: 'एक upload, एक invocation, एक output. घंटा एकदाच वाजते.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Sam signs a big partner: at 2 a.m. it uploads about 3,000 small files in one burst, and each file must be written to a reporting database that allows only 10 connections. Which design fits best?', mr: 'Sam ने एक मोठा partner मिळवला: रात्री 2 वाजता तो एकदम साधारण 3,000 लहान files upload करतो, आणि प्रत्येक file एका reporting database मध्ये लिहायची आहे जो फक्त 10 connections देतो. कोणतं design सगळ्यात योग्य?' },
          options: [
            { en: 'S3 → Lambda directly, and hope the database survives', mr: 'S3 → Lambda थेट, आणि database टिकेल अशी आशा' },
            { en: 'S3 → SQS → Lambda: the queue absorbs the burst, Lambda reads in batches with maximum concurrency capped to protect the database, and failed messages go to a dead-letter queue after maxReceiveCount', mr: 'S3 → SQS → Lambda: queue burst शोषून घेते, database वाचवायला maximum concurrency मर्यादित ठेवून Lambda batches मध्ये वाचतं, आणि अयशस्वी messages maxReceiveCount नंतर dead-letter queue मध्ये जातात' },
            { en: 'A cron job on a laptop that checks the bucket every hour', mr: 'दर तासाला bucket तपासणारा laptop वरचा cron job' },
            { en: 'Ask the partner to upload one file per minute', mr: 'partner ला दर मिनिटाला एक file upload करायला सांगा' },
          ],
          correct: [1],
          explain: { en: 'Direct S3 → Lambda would start hundreds of parallel functions and flood a 10-connection database. SQS buffers the events (for up to 14 days), the event source mapping\'s maximum concurrency limits parallel functions, batching cuts invocations, and a redrive policy moves poison messages to a DLQ. EventBridge is the pick when one event must reach many targets or needs richer filtering.', mr: 'थेट S3 → Lambda शेकडो समांतर functions सुरू करेल आणि 10 connections च्या database ला बुडवेल. SQS events साठवून ठेवते (14 दिवसांपर्यंत), event source mapping ची maximum concurrency समांतर functions मर्यादित करते, batching मुळे invocations कमी होतात, आणि redrive policy बिघडलेले messages DLQ मध्ये हलवते. एक event अनेक targets पर्यंत पोहोचवायचा असेल किंवा जास्त filtering हवं असेल तर EventBridge.' },
          hints: [
            { en: 'The risk is too many functions at the same time, not too few.', mr: 'धोका एकाच वेळी खूप जास्त functions चा आहे, कमी नाही.' },
            { en: 'Which service is built to hold work and hand it out at a controlled pace?', mr: 'काम धरून ठेवून ठराविक वेगाने वाटणारी service कोणती?' },
          ],
          successLine: { en: 'A queue between the burst and the database. That is the answer interviewers want to hear.', mr: 'burst आणि database मध्ये एक queue. interviewers ना हेच उत्तर ऐकायचं असतं.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: "import urllib.parse\nprint(urllib.parse.unquote_plus('incoming/Joshi+%26+Sons/orders+24+Nov.csv'))",
        options: ['incoming/Joshi+%26+Sons/orders+24+Nov.csv', 'incoming/Joshi %26 Sons/orders 24 Nov.csv', 'incoming/Joshi+&+Sons/orders+24+Nov.csv', 'incoming/Joshi & Sons/orders 24 Nov.csv'],
        answer: 3,
        explain: { en: 'unquote_plus turns + into a space and %26 into &. Plain unquote would decode %26 but leave the + signs.', mr: 'unquote_plus + चा space आणि %26 चं & करतो. साधा unquote %26 decode करेल पण + चिन्हं तशीच ठेवेल.' },
      },
      {
        q: { en: 'The trigger is prefix incoming/, suffix .csv. Where is it safe for the function to write its output?', mr: 'trigger prefix incoming/, suffix .csv आहे. function ने output कुठे लिहिणं सुरक्षित?' },
        options: [
          { en: 'processed/orders.csv in the same bucket, or any key in another bucket', mr: 'त्याच bucket मध्ये processed/orders.csv, किंवा दुसऱ्या bucket मध्ये कोणतीही key' },
          { en: 'incoming/orders-clean.csv', mr: 'incoming/orders-clean.csv' },
          { en: 'incoming/2026/11/24/summary.csv', mr: 'incoming/2026/11/24/summary.csv' },
          { en: 'Anywhere: S3 never triggers on files written by Lambda', mr: 'कुठेही: Lambda ने लिहिलेल्या files वर S3 कधीच trigger करत नाही' },
        ],
        answer: 0,
        explain: { en: 'Any key under incoming/ ending in .csv fires the trigger again, including writes from your own function. A different prefix or another bucket breaks the loop.', mr: 'incoming/ खालची .csv ने संपणारी कोणतीही key trigger पुन्हा चालवते, तुमच्याच function ने लिहिलेलीसुद्धा. वेगळा prefix किंवा दुसरा bucket loop तोडतो.' },
      },
      {
        q: { en: 'AWS says S3 event notifications are delivered "at least once". What must your handler assume?', mr: 'AWS म्हणतं S3 event notifications "at least once" पोहोचतात. तुमच्या handler ने काय गृहीत धरावं?' },
        options: [
          { en: 'Every file triggers exactly one invocation, in upload order', mr: 'प्रत्येक file नेमका एक invocation करते, upload च्या क्रमाने' },
          { en: 'Some files never trigger at all, so poll the bucket every minute', mr: 'काही files कधीच trigger करत नाहीत, म्हणून दर मिनिटाला bucket तपासा' },
          { en: 'The same file can arrive more than once and events can arrive out of order, so processing must be safe to repeat', mr: 'एकच file एकापेक्षा जास्त वेळा येऊ शकते आणि events क्रम सोडून येऊ शकतात, म्हणून processing पुन्हा केलं तरी सुरक्षित हवं' },
          { en: 'Events arrive within 1 millisecond', mr: 'events 1 millisecond मध्ये येतात' },
        ],
        answer: 2,
        explain: { en: 'At least once means duplicates are possible, and S3 does not guarantee order (the sequencer only orders events for the same key). Delivery usually takes seconds, sometimes a minute or more. The handler must be idempotent.', mr: 'at least once म्हणजे duplicates शक्य आहेत, आणि S3 क्रमाची खात्री देत नाही (sequencer फक्त एकाच key चे events क्रमाने लावतो). delivery ला बहुतेक काही सेकंद, कधी एक मिनिट किंवा जास्त लागतात. handler idempotent हवा.' },
      },
      {
        q: { en: 'One upload must start three things: the summary Lambda, a fraud-check Step Functions workflow, and an archive queue, each with its own filter on object size. Which wiring fits?', mr: 'एका upload ने तीन गोष्टी सुरू व्हायला हव्यात: सारांश Lambda, fraud-check Step Functions workflow, आणि एक archive queue, प्रत्येकाचा object size वर स्वतःचा filter. कोणती जोडणी योग्य?' },
        options: [
          { en: 'Three S3 notification rules with the same prefix and suffix', mr: 'एकच prefix आणि suffix असलेले तीन S3 notification rules' },
          { en: 'S3 → EventBridge, with one rule per target filtering on size', mr: 'S3 → EventBridge, प्रत्येक target साठी size वर filter करणारा एक rule' },
          { en: 'S3 → Lambda, and the Lambda copies the file three times', mr: 'S3 → Lambda, आणि Lambda file तीनदा copy करतं' },
          { en: 'Nothing can do this', mr: 'हे कशानेच होत नाही' },
        ],
        answer: 1,
        explain: { en: 'Notification rules for the same event type cannot overlap, and they cannot filter on size. EventBridge receives every event from the bucket, and its rules filter on fields like size and send one event to many targets.', mr: 'एकाच event type चे notification rules overlap होऊ शकत नाहीत, आणि ते size वर filter करू शकत नाहीत. EventBridge ला bucket चा प्रत्येक event मिळतो, आणि त्याचे rules size सारख्या fields वर filter करून एक event अनेक targets ना पाठवतात.' },
      },
    ],
    recap: { line: { en: 'S3 event → Lambda: loop over Records, unquote_plus the key, read, transform, write to another bucket or prefix. SQS for bursts, EventBridge for many targets, and always expect duplicates.', mr: 'S3 event → Lambda: Records वर loop, key चं unquote_plus, वाचा, बदला, दुसऱ्या bucket किंवा prefix मध्ये लिहा. burst साठी SQS, अनेक targets साठी EventBridge, आणि duplicates नेहमी अपेक्षित.' }, icon: '📬' },
    interview: [
      {
        q: { en: 'How do you trigger a Lambda function when a file lands in S3?', mr: 'S3 मध्ये file आल्यावर Lambda function कसं trigger करता?' },
        a: { en: 'I add an event notification to the bucket for s3:ObjectCreated events, with a prefix and suffix filter, and the Lambda function as the destination. S3 then invokes the function asynchronously with an event containing the bucket and the URL-encoded key. Two permissions are needed: a resource-based policy on the function allowing s3.amazonaws.com to call lambda:InvokeFunction (the console adds it; in infrastructure as code I add it myself), and an execution role that allows s3:GetObject on the input prefix and s3:PutObject on the output location. At ChaiCart the trigger is prefix incoming/ and suffix .csv on chaicart-raw, and output goes to chaicart-clean. The gotcha is the filter: without it, every object in the bucket, including our own outputs, would invoke the function.', mr: 'मी bucket वर s3:ObjectCreated events साठी event notification जोडते, prefix आणि suffix filter सह, आणि destination म्हणून Lambda function. मग S3 bucket आणि URL-encoded key असलेल्या event सह function asynchronously invoke करतं. दोन permissions लागतात: function वरची resource-based policy जी s3.amazonaws.com ला lambda:InvokeFunction करू देते (console ती जोडतो; infrastructure as code मध्ये मी स्वतः जोडते), आणि execution role जो input prefix वर s3:GetObject आणि output च्या जागी s3:PutObject देतो. ChaiCart मध्ये chaicart-raw वर trigger prefix incoming/ आणि suffix .csv आहे, आणि output chaicart-clean मध्ये जातं. गोम म्हणजे filter: तो नसेल तर bucket मधला प्रत्येक object, आपले outputs सुद्धा, function invoke करेल.' },
      },
      {
        q: { en: 'What does an S3 event look like, and what is the classic bug?', mr: 'S3 event कसा दिसतो, आणि प्रसिद्ध bug कोणता?' },
        a: { en: 'It is JSON with a Records list; each record has s3.bucket.name, s3.object.key, size, eTag, a sequencer, and versionId when versioning is on, plus eventName and eventTime. The classic bug is that the key is URL-encoded: a space becomes + and special characters become %XX. If you pass it straight to get_object, a file named "orders 24 Nov.csv" gives NoSuchKey although it exists. The fix is urllib.parse.unquote_plus on the key, which ChaiCart\'s handler does before every S3 call. Another gotcha is assuming Records has one item: I always loop over Records.', mr: 'तो Records list असलेला JSON असतो; प्रत्येक record मध्ये s3.bucket.name, s3.object.key, size, eTag, sequencer, आणि versioning असेल तर versionId, शिवाय eventName आणि eventTime. प्रसिद्ध bug म्हणजे key URL-encoded असते: space चा + होतो आणि खास चिन्हांचे %XX. ती थेट get_object ला दिली तर "orders 24 Nov.csv" नावाची file अस्तित्वात असूनही NoSuchKey येतो. उपाय म्हणजे key वर urllib.parse.unquote_plus, जो ChaiCart चा handler प्रत्येक S3 call आधी करतो. दुसरी गोम म्हणजे Records मध्ये एकच item आहे असं गृहीत धरणं: मी नेहमी Records वर loop करते.' },
      },
      {
        q: { en: 'S3 → Lambda vs S3 → SQS → Lambda vs S3 → EventBridge: when do you use which?', mr: 'S3 → Lambda vs S3 → SQS → Lambda vs S3 → EventBridge: कोणतं कधी?' },
        a: { en: 'Direct S3 → Lambda for simple, moderate traffic with one consumer; SQS in between when I need buffering and control; EventBridge when one event must reach many targets or needs richer filtering. Direct has the fewest moving parts and gives async retries. With SQS, bursts wait in the queue, Lambda processes batches, I can cap maximum concurrency to protect a database, failures go to a DLQ after maxReceiveCount, and I can use partial batch responses; I set the visibility timeout to at least six times the function timeout. EventBridge receives all bucket events once enabled, filters on fields like size or key patterns, fans out to Step Functions, several functions or an SQS FIFO queue, and supports archive and replay. For ChaiCart\'s one daily file, direct is enough; for a partner dropping thousands of files I would put SQS in between. The common gotcha: all three are at-least-once, so the handler must be idempotent anyway.', mr: 'एक consumer आणि मध्यम traffic असेल तर थेट S3 → Lambda; buffering आणि control हवा असेल तर मध्ये SQS; एक event अनेक targets पर्यंत पोहोचवायचा असेल किंवा जास्त filtering हवं असेल तर EventBridge. थेट जोडणीत सगळ्यात कमी भाग असतात आणि async retries मिळतात. SQS सह burst queue मध्ये थांबतो, Lambda batches process करतं, database वाचवायला maximum concurrency मर्यादित करता येते, अपयश maxReceiveCount नंतर DLQ मध्ये जातं, आणि partial batch responses वापरता येतात; visibility timeout मी function timeout च्या किमान सहा पट ठेवते. EventBridge चालू केल्यावर bucket चे सगळे events घेतो, size किंवा key patterns सारख्या fields वर filter करतो, Step Functions, अनेक functions किंवा SQS FIFO queue कडे fan out करतो, आणि archive आणि replay देतो. ChaiCart च्या रोजच्या एका file साठी थेट जोडणी पुरे; हजारो files टाकणाऱ्या partner साठी मी मध्ये SQS ठेवेन. सामान्य गोम: तिन्ही at-least-once आहेत, म्हणून handler तरीही idempotent हवा.' },
      },
      {
        q: { en: 'How do you avoid a recursive invocation loop with S3 and Lambda?', mr: 'S3 आणि Lambda सह recursive invocation loop कसा टाळता?' },
        a: { en: 'I never let the function write into the location that triggers it. The cleanest design is two buckets, raw and clean; the alternative is a trigger prefix only for incoming files, like incoming/, with output under processed/. A suffix trick, such as writing .json under a .csv filter, is fragile because someone may later widen the filter. AWS recursive loop detection does stop loops through S3, SQS, SNS, EventBridge custom buses and Lambda after about 16 invocations in one chain, and notifies you, but it is a safety net, and loops through other services like DynamoDB are not detected. I also add CloudWatch alarms on invocations and concurrency, and a billing alarm. At ChaiCart a test function once looped and Sam saw it on the bill, which is why raw and clean data live in separate buckets.', mr: 'function ला trigger करणाऱ्या जागीच लिहू मी कधीच देत नाही. सगळ्यात स्वच्छ design म्हणजे दोन buckets, raw आणि clean; दुसरा पर्याय म्हणजे फक्त येणाऱ्या files साठी trigger prefix, उदा. incoming/, आणि output processed/ खाली. suffix ची युक्ती, उदा. .csv filter खाली .json लिहिणं, नाजूक आहे कारण नंतर कोणी filter रुंद करू शकतो. AWS recursive loop detection S3, SQS, SNS, EventBridge custom buses आणि Lambda मधून जाणारे loops एका साखळीत साधारण 16 invocations नंतर थांबवतं आणि कळवतं, पण ते फक्त सुरक्षा जाळं आहे, आणि DynamoDB सारख्या इतर services मधून जाणारे loops पकडले जात नाहीत. शिवाय मी invocations आणि concurrency वर CloudWatch alarms आणि billing alarm लावते. ChaiCart मध्ये एकदा एक test function loop मध्ये गेलं आणि Sam ला ते बिलात दिसलं, म्हणूनच raw आणि clean data वेगळ्या buckets मध्ये आहे.' },
      },
      {
        q: { en: 'Your Lambda gets NoSuchKey or AccessDenied reading the object from the event. What do you check?', mr: 'event मधला object वाचताना तुमच्या Lambda ला NoSuchKey किंवा AccessDenied मिळतो. तुम्ही काय तपासता?' },
        a: { en: 'For NoSuchKey I first check that I decoded the key with unquote_plus, because spaces and symbols are the usual cause; then that I use the bucket from the event, and whether the object was deleted or overwritten before the function ran. For AccessDenied I check the execution role: does it allow s3:GetObject on arn:aws:s3:::bucket/prefix/* (object actions need the /* resource, ListBucket needs the bucket ARN)? Then the bucket policy for an explicit Deny, which always wins, and KMS: an SSE-KMS object also needs kms:Decrypt on the key. One more gotcha: without s3:ListBucket, a missing object returns AccessDenied instead of NoSuchKey. In the lab, IAM is simplified to a deny list, but real IAM evaluates identity policies, resource policies and explicit denies together. At ChaiCart the error message names the role and the action, so I read it before changing anything.', mr: 'NoSuchKey साठी मी आधी तपासते की key unquote_plus ने decode केली का, कारण spaces आणि चिन्हं हेच नेहमीचं कारण; मग bucket event मधूनच घेतला का, आणि function चालण्याआधी object delete किंवा overwrite झाला का. AccessDenied साठी execution role तपासते: तो arn:aws:s3:::bucket/prefix/* वर s3:GetObject देतो का (object actions ना /* resource लागतो, ListBucket ला bucket ARN)? मग bucket policy मधला explicit Deny, जो नेहमी जिंकतो, आणि KMS: SSE-KMS object साठी key वर kms:Decrypt सुद्धा लागतं. आणखी एक गोम: s3:ListBucket नसेल तर नसलेल्या object साठी NoSuchKey ऐवजी AccessDenied येतो. lab मध्ये IAM एका deny list इतकं सोपं केलं आहे, पण खरं IAM identity policies, resource policies आणि explicit denies एकत्र तपासतं. ChaiCart मध्ये error message role आणि action चं नाव सांगतो, म्हणून काहीही बदलण्याआधी मी तो वाचते.' },
      },
      {
        q: { en: 'A partner uploads a 4 GB file. Can your S3-triggered Lambda process it?', mr: 'partner 4 GB ची file upload करतो. तुमचं S3-triggered Lambda ती process करू शकेल का?' },
        a: { en: 'Possibly, but not by reading it all into memory. I would stream it: get_object returns a streaming body, so I can iterate over lines or read byte ranges and keep memory flat; or download it to /tmp, which can be configured up to 10,240 MB. Then I check time: the function must finish within its timeout, at most 30 minutes now, and throughput depends on memory because CPU and network scale with it. If the work is heavy, like joins or aggregations across many such files, I would hand it to Glue, EMR or a Fargate task, with Lambda only starting the job. For ChaiCart\'s normal 2 MB file none of this matters, which is exactly why I ask about file sizes early. The gotcha is that a timeout halfway through gets retried, so partial output must be safe to redo.', mr: 'कदाचित, पण पूर्ण memory मध्ये वाचून नाही. मी ती stream करेन: get_object streaming body देतो, म्हणून ओळीओळीने वाचता येतं किंवा byte ranges वाचता येतात आणि memory स्थिर राहते; किंवा ती /tmp मध्ये download करेन, जो 10,240 MB पर्यंत वाढवता येतो. मग वेळ तपासते: function timeout मध्ये संपायला हवं, आता जास्तीत जास्त 30 मिनिटं, आणि वेग memory वर अवलंबून कारण CPU आणि network त्यासोबत वाढतात. काम जड असेल, उदा. अनेक अशा files वर joins किंवा aggregations, तर मी ते Glue, EMR किंवा Fargate task कडे देईन, आणि Lambda फक्त job सुरू करेल. ChaiCart च्या नेहमीच्या 2 MB file साठी यातलं काही लागत नाही, आणि म्हणूनच मी file sizes सुरुवातीलाच विचारते. गोम म्हणजे अर्ध्यात timeout झाला तर retry होतो, म्हणून अर्धवट output पुन्हा करता येईल असा हवा.' },
      },
      {
        q: { en: 'How do you test an S3-triggered Lambda without uploading real files every time?', mr: 'प्रत्येक वेळी खऱ्या files upload न करता S3-triggered Lambda कसं test करता?' },
        a: { en: 'Because the event is just JSON, I test the handler with saved test events. The Lambda console has an s3-put template, and the AWS SAM CLI can generate one with sam local generate-event s3 put, which I edit to use a key with spaces and symbols. In unit tests I call lambda_handler(event, fake_context) directly with those dicts, and mock S3 or use a test bucket. Then one end-to-end test in a dev account uploads a real file and checks the output object and the logs. For ChaiCart our test events include "orders 24 Nov.csv", an empty file and a duplicate delivery, the same kinds of hidden data this lab uses. The gotcha is testing only with a clean key like orders.csv, which hides the URL-encoding bug until production.', mr: 'event फक्त JSON असल्याने मी जतन केलेल्या test events ने handler test करते. Lambda console मध्ये s3-put template आहे, आणि AWS SAM CLI sam local generate-event s3 put ने तो बनवू शकतो, जो मी spaces आणि चिन्हं असलेली key वापरायला बदलते. unit tests मध्ये त्या dicts सह मी lambda_handler(event, fake_context) थेट call करते, आणि S3 mock करते किंवा test bucket वापरते. मग dev account मध्ये एक end-to-end test खरी file upload करून output object आणि logs तपासते. ChaiCart च्या test events मध्ये "orders 24 Nov.csv", रिकामी file आणि duplicate delivery आहे, हा lab वापरतो त्याच प्रकारचा लपवलेला data. गोम म्हणजे फक्त orders.csv सारख्या स्वच्छ key ने test करणं, जे URL-encoding bug production पर्यंत लपवतं.' },
      },
    ],
  },

  // ───────────────────────── L1.3 Errors, retries and idempotency
  {
    id: 'lm1-3',
    code: 'L1.3',
    level: 'intermediate',
    title: { en: 'Errors, retries and idempotency', mr: 'Errors, retries आणि idempotency' },
    skill: 'async retries (2 by default), maximum event age, DLQ vs on-failure destinations, sync errors, at-least-once duplicates, idempotent handlers (deterministic keys, head_object, conditional writes), timeouts and get_remaining_time_in_millis, partial failures, structured logs',
    realLife: {
      place: 'restaurant',
      title: { en: 'The order board in a busy kitchen', mr: 'गर्दीच्या स्वयंपाकघरातला order board' },
      story: {
        en: 'Meera\'s friend runs a misal place in Sadashiv Peth that takes orders from two delivery apps. When the kitchen tablet does not confirm an order fast enough, the app sends the same order again, sometimes twice. So the head cook keeps a board: before cooking, he checks if order number #4521 is already on it. If it is, he does not cook a second plate; the customer is not charged twice and no plate goes to waste. When the gas runs out mid-order, the app retries a couple of minutes later. If it still fails after the last try, the slip does not go in the dustbin: it goes to the manager\'s red tray, so someone calls the customer in the morning. And when one plate on a big order is burnt, he sends the other nine and notes the burnt one separately, instead of cancelling the whole order.',
        mr: 'मीराच्या मैत्रिणीचं सदाशिव पेठेत मिसळचं दुकान आहे, आणि ते दोन delivery apps वरून orders घेतं. स्वयंपाकघरातल्या tablet ने order पटकन confirm केली नाही तर app तीच order पुन्हा पाठवतं, कधी दोनदा. म्हणून मुख्य आचारी एक board ठेवतो: बनवण्याआधी तो पाहतो की order नंबर #4521 आधीच board वर आहे का. असेल तर तो दुसरी प्लेट बनवत नाही; ग्राहकाकडून दोनदा पैसे जात नाहीत आणि प्लेट वाया जात नाही. order च्या मध्येच गॅस संपला तर app काही मिनिटांनी पुन्हा प्रयत्न करतं. शेवटच्या प्रयत्नानंतरही जमलं नाही तर चिठ्ठी कचऱ्यात जात नाही: ती manager च्या लाल ट्रेत जाते, म्हणजे सकाळी कोणीतरी ग्राहकाला फोन करतं. आणि मोठ्या order मधली एक प्लेट करपली तर तो पूर्ण order रद्द न करता बाकीच्या नऊ पाठवतो आणि करपलेलीची वेगळी नोंद करतो.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Cook only order numbers that are not already on the board', mr: 'board वर आधीच नसलेल्या order नंबरचीच प्लेट बनवा' },
        items: [
          { icon: '🧾', label: '#4521 misal', mr: '#4521 मिसळ', pass: true },
          { icon: '🧾', label: '#4522 poha', mr: '#4522 पोहे', pass: true },
          { icon: '🔁', label: '#4521 again (app retry)', mr: '#4521 पुन्हा (app retry)', pass: false },
          { icon: '🧾', label: '#4523 vada pav', mr: '#4523 वडापाव', pass: true },
          { icon: '🔁', label: '#4522 again', mr: '#4522 पुन्हा', pass: false },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'angry', text: { en: 'Tuesday\'s dashboard showed Sharma Stores selling double. I almost sent them a bonus for sales that never happened.', mr: 'मंगळवारच्या dashboard वर Sharma Stores ची विक्री दुप्पट दिसली. कधीच न झालेल्या विक्रीसाठी मी त्यांना बोनस पाठवणार होतो.' } },
        { who: 'theo', mood: 'worried', text: { en: 'The logs show the function ran twice for the same file. The first run timed out after writing its output, then Lambda retried and wrote a second copy with a new random name.', mr: 'logs दाखवतात की एकाच file साठी function दोनदा चाललं. पहिला run output लिहिल्यानंतर timeout झाला, मग Lambda ने retry केला आणि नव्या random नावाने दुसरी copy लिहिली.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'and when a file fails three times, it simply vanishes. no error on any dashboard. my favourite magic trick.', mr: 'आणि एखादी file तीनदा अयशस्वी झाली की ती सरळ गायब होते. कोणत्याही dashboard वर error नाही. माझी आवडती जादू.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Async invocations retry, and S3 delivers at least once. So the same file will arrive twice one day. The handler must give the same result whether it runs once or three times, and failures must land somewhere we can see.', mr: 'async invocations retry होतात, आणि S3 किमान एकदा delivery करतं. म्हणजे एक दिवस तीच file दोनदा येणारच. handler एकदा चालो की तीनदा, result तोच यायला हवा, आणि failures आपल्याला दिसतील अशा जागी जायला हवेत.' } },
        { who: 'meera', mood: 'happy', text: { en: '{name}, testers know this as "safe to retry". Today you build it: idempotent outputs, clean timeouts, quarantined bad rows, and a dead-letter queue for the rest.', mr: '{name}, testers याला "retry केलं तरी सुरक्षित" म्हणतात. आज तू ते बनवणार: idempotent outputs, नीट timeouts, बाजूला काढलेल्या वाईट rows, आणि बाकीच्यांसाठी dead-letter queue.' } },
      ],
      problem: { en: 'Retries and at-least-once delivery run the same file twice, which doubles totals; a timeout leaves half-done work; one bad row crashes the whole file; and events that fail every retry disappear without a trace.', mr: 'retries आणि at-least-once delivery मुळे एकच file दोनदा चालते आणि totals दुप्पट होतात; timeout अर्धवट काम सोडतो; एक वाईट row पूर्ण file crash करते; आणि प्रत्येक retry मध्ये अयशस्वी झालेले events कोणताही माग न ठेवता गायब होतात.' },
      solution: { en: 'An idempotent handler (deterministic output keys plus a check that the output already exists), get_remaining_time_in_millis() to stop cleanly before the timeout, bad rows sent to a rejects file instead of crashing, real errors raised so Lambda retries them and finally sends them to an on-failure destination, and one JSON log line per event so CloudWatch can find the failures.', mr: 'idempotent handler (ठरलेल्या output keys आणि output आधीच आहे का याची तपासणी), timeout आधी नीट थांबायला get_remaining_time_in_millis(), crash ऐवजी वाईट rows rejects file मध्ये, खरे errors raise करायचे म्हणजे Lambda त्यांना retry करून शेवटी on-failure destination ला पाठवेल, आणि CloudWatch ला failures सापडावेत म्हणून प्रत्येक event साठी एक JSON log ओळ.' },
    },
    lesson: [
      { en: 'What happens after an error depends on how the function was invoked. Synchronous: Lambda returns the error to the caller (the response has FunctionError and a payload with errorType, errorMessage and stackTrace) and does not retry; the caller decides. Asynchronous (S3, SNS, EventBridge, InvocationType="Event"): Lambda keeps the event in its queue and, after a function error (an exception or a timeout), tries two more times, waiting one minute and then two minutes. You can set retries from 0 to 2. Throttles and system errors are retried for up to 6 hours; the maximum event age can be set from 60 seconds to 6 hours. After that the event is discarded, unless you configured a dead-letter queue (SQS or SNS, it receives the original event) or, better, an on-failure destination (SQS, SNS, S3, another Lambda or EventBridge, it receives the event plus the error details). The lab runs the retries back to back without the waits.', mr: 'error नंतर काय होतं ते function कसं invoke झालं त्यावर ठरतं. Synchronous: Lambda error caller ला परत देतं (response मध्ये FunctionError आणि errorType, errorMessage आणि stackTrace असलेला payload) आणि retry करत नाही; caller ठरवतो. Asynchronous (S3, SNS, EventBridge, InvocationType="Event"): Lambda event आपल्या queue मध्ये ठेवतं आणि function error नंतर (exception किंवा timeout) आणखी दोनदा प्रयत्न करतं, आधी एक मिनिट आणि मग दोन मिनिटं थांबून. retries 0 ते 2 ठरवता येतात. throttles आणि system errors 6 तासांपर्यंत retry होतात; maximum event age 60 सेकंद ते 6 तास ठेवता येतो. त्यानंतर event टाकून दिला जातो, जोपर्यंत तुम्ही dead-letter queue (SQS किंवा SNS, त्याला मूळ event मिळतो) किंवा, अधिक चांगलं, on-failure destination (SQS, SNS, S3, दुसरं Lambda किंवा EventBridge, त्याला event आणि error ची माहिती मिळते) लावलेलं नसतं. lab हे retries न थांबता लगेच एकामागून एक चालवतो.' },
      { en: 'So the same file can be processed twice: a retry after the function already wrote part of its output, S3\'s at-least-once delivery, Lambda\'s own queue occasionally delivering a duplicate even without an error, or a partner simply uploading the file again. The cure is idempotency: running the handler twice gives the same result as running it once. Derive the output key from the input (summary/orders 24 Nov.csv, never a uuid or a timestamp), so a rerun overwrites the same object with the same content; check whether the output already exists (head_object) and skip; never append to running totals. For stronger guarantees, record a processed marker, such as bucket + key + eTag, in DynamoDB with a conditional write (attribute_not_exists): the first writer wins and every duplicate fails the condition. Powertools for AWS Lambda has an idempotency utility built on exactly that.', mr: 'म्हणून एकच file दोनदा process होऊ शकते: function ने output चा भाग आधीच लिहिल्यावर झालेला retry, S3 ची at-least-once delivery, error नसतानाही Lambda च्या स्वतःच्या queue ने कधीतरी दिलेला duplicate, किंवा partner ने सरळ file पुन्हा upload करणं. यावर उपाय idempotency: handler दोनदा चालवला तरी result एकदा चालवल्यासारखाच. output key input वरून ठरवा (summary/orders 24 Nov.csv, uuid किंवा timestamp कधीच नाही), म्हणजे पुन्हा चालवल्यावर तोच object त्याच content ने overwrite होतो; output आधीच आहे का ते तपासा (head_object) आणि सोडून द्या; चालू totals मध्ये कधीच भर घालू नका. जास्त पक्क्या खात्रीसाठी, processed ची खूण, उदा. bucket + key + eTag, DynamoDB मध्ये conditional write (attribute_not_exists) ने नोंदवा: पहिला लिहिणारा जिंकतो आणि प्रत्येक duplicate condition मध्ये अपयशी होतो. Powertools for AWS Lambda मध्ये नेमकं यावरच बांधलेली idempotency utility आहे.' },
      { en: 'Timeouts are errors too. The default is 3 seconds and the maximum 30 minutes; a timeout kills the run mid-work ("Task timed out after 3.00 seconds"), and the async retry starts again on half-done work. When work comes in pieces, ask context.get_remaining_time_in_millis() before each piece; if too little is left, save progress and stop cleanly instead of being killed. Partial failures need judgement: a file with 2 bad rows out of 50 should not crash, so write the good rows and send the bad ones to a rejects file with a reason. Raise only for problems a retry can fix or a human must see: a missing permission, a throttled API, an unreadable file. Swallowing those with a bare except hides them: no retry, no dead-letter queue, no alarm.', mr: 'timeouts सुद्धा errors च. default 3 सेकंद आणि कमाल 30 मिनिटं; timeout काम अर्ध्यात असताना run मारून टाकतो ("Task timed out after 3.00 seconds"), आणि async retry अर्धवट कामावर पुन्हा सुरू होतो. काम तुकड्यांमध्ये असेल तर प्रत्येक तुकड्याआधी context.get_remaining_time_in_millis() विचारा; फार कमी वेळ उरला असेल तर progress जतन करून नीट थांबा, मारलं जाण्याआधी. partial failures मध्ये विवेक लागतो: 50 पैकी 2 वाईट rows असलेली file crash होता कामा नये, म्हणून चांगल्या rows लिहा आणि वाईट rows कारणासह rejects file मध्ये पाठवा. raise फक्त अशा समस्यांसाठी करा ज्या retry ने सुटू शकतात किंवा माणसाने पाहायलाच हव्यात: नसलेली permission, throttle झालेला API, वाचता न येणारी file. असे errors मोकळ्या except ने गिळले तर ते लपतात: retry नाही, dead-letter queue नाही, alarm नाही.' },
      { en: 'Finally, make failures findable. Print one JSON line per event with level, request_id, key and error: CloudWatch Logs Insights can then run a query like fields @timestamp, key, error | filter level = "ERROR". (Lambda can also write its own logs as JSON if you set its log format.) Watch the Errors and Throttles metrics, and for async functions AsyncEventsDropped and the depth of your dead-letter queue, with alarms on them. In the lab, open the Lambda tab: each attempt shows its number, its logs, and at the end whether the event went to the on-failure destination or was dropped.', mr: 'शेवटी, failures शोधता येतील असे ठेवा. प्रत्येक event साठी level, request_id, key आणि error असलेली एक JSON ओळ print करा: मग CloudWatch Logs Insights fields @timestamp, key, error | filter level = "ERROR" सारखी query चालवू शकतो. (log format ठरवला तर Lambda स्वतःचे logs सुद्धा JSON मध्ये लिहू शकतं.) Errors आणि Throttles metrics वर, आणि async functions साठी AsyncEventsDropped आणि dead-letter queue च्या लांबीवर लक्ष ठेवा, त्यांच्यावर alarms लावा. lab मध्ये Lambda टॅब उघडा: प्रत्येक attempt त्याचा नंबर, त्याचे logs, आणि शेवटी event on-failure destination ला गेला की टाकून दिला ते दाखवतो.' },
    ],
    syntax: {
      template: `import json, urllib.parse
import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')

def already_done(bucket, key):
    try:
        s3.head_object(Bucket=bucket, Key=key)
        return True
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            return False
        raise                                       # AccessDenied etc: let it fail

def lambda_handler(event, context):
    for record in event['Records']:
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])
        out_key = 'summary/' + key.split('/')[-1]   # same input -> same output key
        if already_done('chaicart-clean', out_key):
            continue                                # a duplicate delivery
        if context.get_remaining_time_in_millis() < 10000:
            raise TimeoutError('too little time left, let the retry do it')
        try:
            process(key, out_key)
        except Exception as e:
            print(json.dumps({'level': 'ERROR', 'request_id': context.aws_request_id,
                              'key': key, 'error': str(e)}))
            raise                                   # retries, then the on-failure destination`,
      parts: [
        { code: "out_key = 'summary/' + key.split('/')[-1]", means: { en: 'a deterministic output key: a rerun overwrites the same object instead of adding a copy', mr: 'ठरलेली output key: पुन्हा चालवल्यावर नवी copy न बनता तोच object overwrite होतो' } },
        { code: 's3.head_object(...)  /  Code == "404"', means: { en: 'does the output already exist? head_object raises a ClientError with code 404 when it does not', mr: 'output आधीच आहे का? नसेल तर head_object code 404 असलेला ClientError देतो' } },
        { code: 'context.get_remaining_time_in_millis()', means: { en: 'milliseconds left before the timeout; check it before each slow piece of work', mr: 'timeout ला किती milliseconds उरले; प्रत्येक हळू कामाच्या तुकड्याआधी तपासा' } },
        { code: 'raise', means: { en: 'tell Lambda this event failed: async invocations are retried, then sent to the DLQ or on-failure destination', mr: 'हा event अयशस्वी झाला असं Lambda ला सांगा: async invocations retry होतात, मग DLQ किंवा on-failure destination ला जातात' } },
        { code: "print(json.dumps({'level': 'ERROR', ...}))", means: { en: 'one structured log line per event, easy to filter in CloudWatch Logs Insights', mr: 'प्रत्येक event साठी एक structured log ओळ, CloudWatch Logs Insights मध्ये filter करायला सोपी' } },
      ],
      example: [
        { code: "Key='summary/orders 24 Nov.csv'", note: { en: 'the order number on the board: the same file always maps to the same plate', mr: 'board वरचा order नंबर: एकच file नेहमी एकाच प्लेटशी जोडलेली' } },
        { code: "Key=f'summary/{uuid.uuid4()}.csv'  # never", note: { en: 'a new plate for every repeat: double sales on the dashboard', mr: 'प्रत्येक पुनरावृत्तीला नवी प्लेट: dashboard वर दुप्पट विक्री' } },
        { code: "rejects.append({**row, 'reason': 'bad amount'})", note: { en: 'the burnt plate is noted separately; the other nine go out', mr: 'करपलेल्या प्लेटची वेगळी नोंद; बाकीच्या नऊ बाहेर जातात' } },
        { code: 'retries: 2, then on-failure destination', note: { en: 'the app tries again, then the slip goes to the manager\'s red tray', mr: 'app पुन्हा प्रयत्न करतं, मग चिठ्ठी manager च्या लाल ट्रेत' } },
        { code: "{'level': 'ERROR', 'key': 'incoming/kulkarni/orders 24 Nov.csv', 'error': 'AccessDenied'}", note: { en: 'a note the morning shift can find in seconds', mr: 'सकाळच्या shift ला काही सेकंदांत सापडणारी नोंद' } },
      ],
      pitfall: { en: 'The two opposite mistakes: except Exception: pass (the failure disappears, no retry, nothing in the dead-letter queue) and raising on every bad row (one typo in a 5,000-row file blocks the whole file three times and then drops it). Quarantine bad data, raise on real failures. And remember a timeout is not an exception your code can catch: check the remaining time before it happens.', mr: 'दोन उलट चुका: except Exception: pass (failure गायब, retry नाही, dead-letter queue मध्ये काही नाही) आणि प्रत्येक वाईट row वर raise (5,000 rows च्या file मधली एक typo पूर्ण file तीनदा अडवते आणि मग टाकून देते). वाईट data बाजूला काढा, खऱ्या failures वर raise करा. आणि लक्षात ठेवा, timeout हा तुमचा code पकडू शकेल असा exception नाही: तो येण्याआधीच उरलेला वेळ तपासा.' },
    },
    practice: {
      intro: { en: 'Make ChaiCart\'s function safe for the real world: retries, duplicates, timeouts and bad data. Some steps fail on purpose; read the attempts in the Lambda tab. Hidden runs replay the same code with duplicate deliveries, other files and a fixed IAM role.', mr: 'ChaiCart चं function खऱ्या जगासाठी सुरक्षित करा: retries, duplicates, timeouts आणि वाईट data. काही steps मुद्दाम अयशस्वी होतात; Lambda टॅबमध्ये attempts वाचा. लपवलेले runs तोच code duplicate deliveries, दुसऱ्या files आणि दुरुस्त IAM role सह पुन्हा चालवतात.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'Press Run. The partner uploads a file where one amount is "abc", which triggers the function through S3 (an asynchronous invocation, with no dead-letter queue configured). Open the Lambda tab. How many times did the handler run for this one file, and what happened to the event at the end?', mr: 'Run दाबा. partner अशी file upload करतो जिच्यात एक amount "abc" आहे, जी S3 द्वारे function trigger करते (asynchronous invocation, dead-letter queue लावलेली नाही). Lambda टॅब उघडा. या एका file साठी handler किती वेळा चालला, आणि शेवटी event चं काय झालं?' },
          pythonSandbox: {
            code: L3_RETRY_SANDBOX,
            aws: { buckets: { 'chaicart-raw': {} }, bucketConfig: { 'chaicart-raw': { notifyPrefix: 'incoming/', notifySuffix: '.csv' } }, lambda: { name: 'process-orders' } },
          },
          options: [
            { en: 'Once; Lambda never retries', mr: 'एकदा; Lambda कधीच retry करत नाही' },
            { en: 'Three times (the first attempt plus 2 retries), then the event was dropped because no dead-letter queue or on-failure destination was set', mr: 'तीनदा (पहिला प्रयत्न आणि 2 retries), मग dead-letter queue किंवा on-failure destination नसल्याने event टाकून दिला गेला' },
            { en: 'Forever, until someone fixes the file', mr: 'कायम, कोणी file दुरुस्त करेपर्यंत' },
            { en: 'Three times, and then S3 deleted the file', mr: 'तीनदा, आणि मग S3 ने file delete केली' },
          ],
          correct: [1],
          explain: { en: 'For asynchronous invocations Lambda retries a function error twice by default (in AWS with 1 and 2 minute waits), so three attempts in total. Then the event is discarded unless a DLQ or on-failure destination exists. The file itself stays in S3; only the event is lost, which is why nobody noticed. Retrying also did not help: bad data fails the same way every time.', mr: 'asynchronous invocations मध्ये Lambda function error default दोनदा retry करतं (AWS मध्ये 1 आणि 2 मिनिटं थांबून), म्हणजे एकूण तीन प्रयत्न. मग DLQ किंवा on-failure destination नसेल तर event टाकून दिला जातो. file स्वतः S3 मध्येच राहते; फक्त event हरवतो, म्हणूनच कोणाच्या लक्षात आलं नाही. आणि retry ने काही फायदा झाला नाही: वाईट data प्रत्येक वेळी तसाच अयशस्वी होतो.' },
          hints: [
            { en: 'Count the attempts listed for the S3 invocation, and read the last log line of the last attempt.', mr: 'S3 invocation साठी दाखवलेले attempts मोजा, आणि शेवटच्या attempt ची शेवटची log ओळ वाचा.' },
            { en: 'Default async retries: 2. 1 + 2 = ?', mr: 'default async retries: 2. 1 + 2 = ?' },
          ],
          successLine: { en: 'Three tries, then silence. That silence is what the rest of this lesson fixes.', mr: 'तीन प्रयत्न, मग शांतता. उरलेला धडा हीच शांतता दूर करतो.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Do not let one bad row sink the file. For each row: an empty amount is "missing amount"; an amount that is not a whole number above 0 is "bad amount" (int() fails, or it is 0 or less). Put bad rows in rejects with a "reason" key, good rows in good. The rest is ready: it writes summary/<name> from the good rows, and rejects/<name> only when there are rejects. Hidden files: one fully clean (no rejects file), one with -40 and 12.5.', mr: 'एका वाईट row मुळे file बुडू देऊ नका. प्रत्येक row साठी: रिकामा amount म्हणजे "missing amount"; 0 पेक्षा मोठी पूर्ण संख्या नसलेला amount म्हणजे "bad amount" (int() अयशस्वी होतो, किंवा तो 0 किंवा कमी आहे). वाईट rows "reason" key सह rejects मध्ये, चांगल्या rows good मध्ये. बाकी तयार आहे: ते good rows वरून summary/<name> लिहितं, आणि rejects असतील तरच rejects/<name>. लपवलेल्या files: एक पूर्ण स्वच्छ (rejects file नाही), एकात -40 आणि 12.5.' },
          starter: `${L3_PARTIAL_HEAD}    for row in csv.DictReader(io.StringIO(text)):
        # TODO: empty amount -> reason 'missing amount'
        #       not a whole number above 0 -> reason 'bad amount'
        #       bad rows: rejects.append({**row, 'reason': reason}); good rows: good.append(row)
        good.append(row)
${L3_PARTIAL_TAIL}`,
          solution: `${L3_PARTIAL_HEAD}    for row in csv.DictReader(io.StringIO(text)):
        amount = row['amount'].strip()
        reason = None
        if amount == '':
            reason = 'missing amount'
        else:
            try:
                if int(amount) <= 0:
                    reason = 'bad amount'
            except ValueError:
                reason = 'bad amount'
        if reason:
            rejects.append({**row, 'reason': reason})
        else:
            good.append(row)
${L3_PARTIAL_TAIL}`,
          aws: {
            buckets: { 'chaicart-raw': { [RAW_KEY]: ORDERS_BAD }, 'chaicart-clean': {} },
            lambda: { name: 'process-orders', events: [s3ev('chaicart-raw', RAW_KEY, ORDERS_BAD.length)] },
          },
          checks: [
            { expr: "s3_text('chaicart-clean', 'summary/orders 24 Nov.csv') == 'shop,orders,amount\\nJoshi Mart,1,95\\nSharma Stores,2,200\\n'", message: { en: 'The summary should be built from the 3 good rows only: Joshi Mart 1 order 95, Sharma Stores 2 orders 200.', mr: 'सारांश फक्त 3 चांगल्या rows वरून हवा: Joshi Mart 1 order 95, Sharma Stores 2 orders 200.' } },
            { expr: "s3_text('chaicart-clean', 'rejects/orders 24 Nov.csv') == 'order_id,shop,amount,reason\\n1002,Joshi Mart,abc,bad amount\\n1004,Kulkarni Kirana,,missing amount\\n'", message: { en: 'rejects/orders 24 Nov.csv should list 1002 (bad amount) and 1004 (missing amount) with a reason column.', mr: 'rejects/orders 24 Nov.csv मध्ये 1002 (bad amount) आणि 1004 (missing amount) reason column सह हवे.' } },
            { expr: "lambda_invocations[0]['result'] == {'good': 3, 'rejected': 2}", message: { en: 'The handler should return {"good": 3, "rejected": 2}.', mr: 'handler ने {"good": 3, "rejected": 2} return करायला हवं.' } },
          ],
          variants: [
            {
              label: { en: 'A fully clean file: no rejects file at all', mr: 'पूर्ण स्वच्छ file: rejects file नकोच' },
              aws: { buckets: { 'chaicart-raw': { [RAW_KEY]: ORDERS_A }, 'chaicart-clean': {} }, lambda: { name: 'process-orders', events: [s3ev('chaicart-raw', RAW_KEY, ORDERS_A.length)] } },
              checks: [
                { expr: `s3_text('chaicart-clean', 'summary/orders 24 Nov.csv') == '${SUMMARY_A}' and not s3_exists('chaicart-clean', 'rejects/orders 24 Nov.csv') and lambda_invocations[0]['result'] == {'good': 5, 'rejected': 0}`, message: { en: 'On a clean file all 5 rows are good and no rejects file is written.', mr: 'स्वच्छ file वर सगळ्या 5 rows चांगल्या आणि rejects file लिहिली जात नाही.' } },
              ],
            },
            {
              label: { en: 'Another day: a negative amount and a decimal', mr: 'दुसरा दिवस: ऋण amount आणि दशांश' },
              aws: { buckets: { 'chaicart-raw': { 'incoming/2026/11/25/orders.csv': ORDERS_BAD2 }, 'chaicart-clean': {} }, lambda: { name: 'process-orders', events: [s3ev('chaicart-raw', 'incoming/2026/11/25/orders.csv', ORDERS_BAD2.length)] } },
              checks: [
                { expr: "s3_text('chaicart-clean', 'summary/orders.csv') == 'shop,orders,amount\\nGupta General,2,300\\n' and s3_text('chaicart-clean', 'rejects/orders.csv') == 'order_id,shop,amount,reason\\n3001,Deshmukh Dairy,-40,bad amount\\n3003,Deshmukh Dairy,12.5,bad amount\\n'", message: { en: 'On the hidden day, -40 (not above 0) and 12.5 (not a whole number) must both be "bad amount".', mr: 'लपवलेल्या दिवशी -40 (0 पेक्षा मोठा नाही) आणि 12.5 (पूर्ण संख्या नाही) दोन्ही "bad amount" हवेत.' } },
              ],
            },
          ],
          mustUse: [{ pattern: 'except\\s+ValueError', message: { en: 'Catch the ValueError from int() for that row only.', mr: 'त्या row पुरताच int() चा ValueError पकडा.' } }],
          hints: [
            { en: 'Decide a reason per row: start with reason = None, set it when the amount is empty or bad, then append the row to the right list.', mr: 'प्रत्येक row साठी reason ठरवा: reason = None ने सुरुवात करा, amount रिकामा किंवा वाईट असेल तर तो ठरवा, मग row योग्य list मध्ये append करा.' },
            { en: 'int("abc") and int("12.5") raise ValueError; wrap only int(amount) in try/except ValueError. Then check <= 0.', mr: 'int("abc") आणि int("12.5") ValueError देतात; फक्त int(amount) try/except ValueError मध्ये ठेवा. मग <= 0 तपासा.' },
            { en: "        amount = row['amount'].strip()\n        reason = None\n        if amount == '':\n            reason = 'missing amount'\n        else:\n            try:\n                if int(amount) <= 0:\n                    reason = 'bad amount'\n            except ValueError:\n                reason = 'bad amount'\n        if reason:\n            rejects.append({**row, 'reason': reason})\n        else:\n            good.append(row)", mr: "        amount = row['amount'].strip()\n        reason = None\n        if amount == '':\n            reason = 'missing amount'\n        else:\n            try:\n                if int(amount) <= 0:\n                    reason = 'bad amount'\n            except ValueError:\n                reason = 'bad amount'\n        if reason:\n            rejects.append({**row, 'reason': reason})\n        else:\n            good.append(row)" },
          ],
          successLine: { en: 'Three good rows shipped, two bad rows explained, zero retries wasted.', mr: 'तीन चांगल्या rows पुढे, दोन वाईट rows चं स्पष्टीकरण, एकही retry वाया नाही.' },
        },
        {
          kind: 'python',
          prompt: { en: 'S3 delivered the same event twice (at least once!). The starter writes each run to a random uuid key, so the dashboard counts the file twice. Make it idempotent: the output key is "summary/" + file name; write already_done(bucket, key) with head_object (True if it exists, False on a ClientError with code "404"); skip records whose output exists. Return {"written": n, "skipped": m}. chaicart-clean has versioning on, so a needless rewrite is visible too.', mr: 'S3 ने तोच event दोनदा दिला (at least once!). starter प्रत्येक run random uuid key वर लिहितो, म्हणून dashboard file दोनदा मोजतो. ते idempotent करा: output key "summary/" + file नाव; head_object वापरून already_done(bucket, key) लिहा (असेल तर True, code "404" असलेल्या ClientError वर False); ज्यांचा output आधीच आहे ते records सोडा. {"written": n, "skipped": m} return करा. chaicart-clean वर versioning चालू आहे, म्हणून विनाकारण पुन्हा लिहिलेलंही दिसतं.' },
          starter: `${L3_IDEM_HEAD}
def already_done(bucket, key):
    # TODO: head_object; return True if it exists, False on a ClientError with code '404'
    return False

def lambda_handler(event, context):
    written, skipped = 0, 0
    for record in event['Records']:
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])
        out_key = 'summary/' + str(uuid.uuid4()) + '.csv'      # TODO: deterministic key
        # TODO: if already_done('chaicart-clean', out_key): count it as skipped and continue
        text = s3.get_object(Bucket=record['s3']['bucket']['name'], Key=key)['Body'].read().decode('utf-8')
        s3.put_object(Bucket='chaicart-clean', Key=out_key, Body=summarise(text))
        written += 1
    return {'written': written, 'skipped': skipped}
`,
          solution: `${L3_IDEM_HEAD}
def already_done(bucket, key):
    try:
        s3.head_object(Bucket=bucket, Key=key)
        return True
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            return False
        raise

def lambda_handler(event, context):
    written, skipped = 0, 0
    for record in event['Records']:
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])
        out_key = 'summary/' + key.split('/')[-1]
        if already_done('chaicart-clean', out_key):
            print('skip duplicate', key)
            skipped += 1
            continue
        text = s3.get_object(Bucket=record['s3']['bucket']['name'], Key=key)['Body'].read().decode('utf-8')
        s3.put_object(Bucket='chaicart-clean', Key=out_key, Body=summarise(text))
        written += 1
    return {'written': written, 'skipped': skipped}
`,
          aws: {
            buckets: { 'chaicart-raw': { [RAW_KEY]: ORDERS_A }, 'chaicart-clean': {} },
            bucketConfig: { 'chaicart-clean': { versioning: 'Enabled' } },
            lambda: { name: 'process-orders', events: [s3ev('chaicart-raw', RAW_KEY, ORDERS_A.length), s3ev('chaicart-raw', RAW_KEY, ORDERS_A.length)] },
          },
          checks: [
            { expr: "s3_keys('chaicart-clean', 'summary/') == ['summary/orders 24 Nov.csv']", message: { en: 'chaicart-clean should hold exactly one summary: summary/orders 24 Nov.csv. Build the key from the file name, not from uuid.', mr: 'chaicart-clean मध्ये नेमका एकच सारांश हवा: summary/orders 24 Nov.csv. key uuid वरून नाही, file नावावरून बनवा.' } },
            { expr: "s3_versions('chaicart-clean', 'summary/orders 24 Nov.csv') == 1", message: { en: 'The duplicate delivery rewrote the summary (2 versions). Check already_done before writing and skip.', mr: 'duplicate delivery ने सारांश पुन्हा लिहिला (2 versions). लिहिण्याआधी already_done तपासा आणि सोडा.' } },
            { expr: "[i['result'] for i in lambda_invocations] == [{'written': 1, 'skipped': 0}, {'written': 0, 'skipped': 1}]", message: { en: 'The first delivery should return {"written": 1, "skipped": 0} and the duplicate {"written": 0, "skipped": 1}.', mr: 'पहिल्या delivery ने {"written": 1, "skipped": 0} आणि duplicate ने {"written": 0, "skipped": 1} return करायला हवं.' } },
            { expr: "already_done('chaicart-clean', 'summary/nothing-here.csv') is False", message: { en: 'already_done should return False for a key that does not exist (head_object raises a ClientError with code "404").', mr: 'नसलेल्या key साठी already_done ने False द्यायला हवं (head_object code "404" असलेला ClientError देतो).' } },
          ],
          variants: [
            {
              label: { en: 'Two files, and the first one delivered again later', mr: 'दोन files, आणि पहिली नंतर पुन्हा आलेली' },
              aws: {
                buckets: { 'chaicart-raw': { [RAW_KEY]: ORDERS_A, 'incoming/2026/11/25/orders.csv': ORDERS_B }, 'chaicart-clean': {} },
                bucketConfig: { 'chaicart-clean': { versioning: 'Enabled' } },
                lambda: { name: 'process-orders', events: [s3ev('chaicart-raw', RAW_KEY, ORDERS_A.length), s3ev('chaicart-raw', 'incoming/2026/11/25/orders.csv', ORDERS_B.length), s3ev('chaicart-raw', RAW_KEY, ORDERS_A.length)] },
              },
              checks: [
                { expr: `s3_keys('chaicart-clean', 'summary/') == ['summary/orders 24 Nov.csv', 'summary/orders.csv'] and s3_text('chaicart-clean', 'summary/orders.csv') == '${SUMMARY_B}' and [i['result'] for i in lambda_invocations] == [{'written': 1, 'skipped': 0}, {'written': 1, 'skipped': 0}, {'written': 0, 'skipped': 1}]`, message: { en: 'With files A, B and A again, you should write A and B once each and skip the repeat.', mr: 'A, B आणि पुन्हा A अशा files असतील तर A आणि B एकदाच लिहा आणि पुनरावृत्ती सोडा.' } },
              ],
            },
          ],
          mustUse: [{ pattern: 'head_object', message: { en: 'Check whether the output exists with s3.head_object.', mr: 'output आहे का ते s3.head_object ने तपासा.' } }],
          mustNotUse: [{ pattern: 'uuid\\.uuid4\\(', message: { en: 'A random key makes every retry a new file. Derive the key from the input file name.', mr: 'random key मुळे प्रत्येक retry नवी file बनते. key input file नावावरून ठरवा.' } }],
          hints: [
            { en: 'Same input, same output key: out_key = "summary/" + key.split("/")[-1]. Then a rerun can be detected, and even an overwrite would write identical content.', mr: 'एकच input, एकच output key: out_key = "summary/" + key.split("/")[-1]. मग पुन्हा चाललेला run ओळखता येतो, आणि overwrite झालं तरी content तेच राहतं.' },
            { en: 'already_done: try s3.head_object(Bucket=bucket, Key=key) and return True; except ClientError as e: if e.response["Error"]["Code"] == "404" return False, else raise (an AccessDenied must not look like "not done").', mr: 'already_done: try मध्ये s3.head_object(Bucket=bucket, Key=key) आणि return True; except ClientError as e: e.response["Error"]["Code"] == "404" असेल तर return False, नाहीतर raise (AccessDenied "झालं नाही" सारखं दिसता कामा नये).' },
            { en: "def already_done(bucket, key):\n    try:\n        s3.head_object(Bucket=bucket, Key=key)\n        return True\n    except ClientError as e:\n        if e.response['Error']['Code'] == '404':\n            return False\n        raise\n\n        out_key = 'summary/' + key.split('/')[-1]\n        if already_done('chaicart-clean', out_key):\n            skipped += 1\n            continue", mr: "def already_done(bucket, key):\n    try:\n        s3.head_object(Bucket=bucket, Key=key)\n        return True\n    except ClientError as e:\n        if e.response['Error']['Code'] == '404':\n            return False\n        raise\n\n        out_key = 'summary/' + key.split('/')[-1]\n        if already_done('chaicart-clean', out_key):\n            skipped += 1\n            continue" },
          ],
          successLine: { en: 'Delivered twice, counted once. Sam\'s dashboard is honest again.', mr: 'दोनदा आलं, एकदाच मोजलं. Sam चा dashboard पुन्हा प्रामाणिक.' },
        },
        {
          kind: 'python',
          prompt: { en: 'After the summary, the function sends each shop its daily report on WhatsApp, and each call can take 0.8 s. With a 3-second timeout, six shops do not fit in one run: the starter times out (press Run and read the "Task timed out" line). Fix the loop: skip shops already in done, and before each send, if context.get_remaining_time_in_millis() is below 1000, stop (break). Progress is saved to S3, so the next invocation (the lab sends the event twice) finishes the rest. Every shop must get exactly one report.', mr: 'सारांशानंतर function प्रत्येक दुकानाला WhatsApp वर रोजचा report पाठवतं, आणि प्रत्येक call ला 0.8 s लागू शकतात. 3 सेकंदांच्या timeout मध्ये सहा दुकानं एका run मध्ये बसत नाहीत: starter timeout होतो (Run दाबा आणि "Task timed out" ओळ वाचा). loop दुरुस्त करा: done मध्ये आधीच असलेली दुकानं सोडा, आणि प्रत्येक send आधी context.get_remaining_time_in_millis() 1000 पेक्षा कमी असेल तर थांबा (break). progress S3 मध्ये जतन होतो, म्हणून पुढचं invocation (lab event दोनदा पाठवतो) उरलेलं काम पूर्ण करतं. प्रत्येक दुकानाला नेमका एकच report मिळायला हवा.' },
          starter: `${L3_TIME_HEAD}        # TODO: skip shops already in done
        # TODO: if less than 1000 ms are left, stop the loop
${L3_TIME_TAIL}`,
          solution: `${L3_TIME_HEAD}        if shop in done:
            continue
        if context.get_remaining_time_in_millis() < 1000:
            print('stopping early, time left:', context.get_remaining_time_in_millis(), 'ms')
            break
${L3_TIME_TAIL}`,
          aws: { buckets: { 'chaicart-clean': {} }, lambda: { name: 'send-reports', timeoutSec: 3, events: [{ date: '2026-11-24', shops: SHOPS6 }, { date: '2026-11-24', shops: SHOPS6 }] } },
          checks: [
            { expr: "[i['result'] for i in lambda_invocations] == [{'done': 3, 'left': 3}, {'done': 6, 'left': 0}]", message: { en: 'The first run should stop after 3 shops ({"done": 3, "left": 3}) and the second should finish ({"done": 6, "left": 0}).', mr: 'पहिला run 3 दुकानांनंतर थांबायला हवा ({"done": 3, "left": 3}) आणि दुसऱ्याने काम पूर्ण करायला हवं ({"done": 6, "left": 0}).' } },
            { expr: `all(sum(l == 'sent report to ' + s for i in lambda_invocations for l in i['logs']) == 1 for s in ${JSON.stringify(SHOPS6)})`, message: { en: 'Every shop must get exactly one report across both runs. Skip shops that are already in done.', mr: 'दोन्ही runs मिळून प्रत्येक दुकानाला नेमका एक report हवा. done मध्ये असलेली दुकानं सोडा.' } },
          ],
          variants: [
            {
              label: { en: 'Seven shops and a 4-second timeout', mr: 'सात दुकानं आणि 4 सेकंदांचा timeout' },
              aws: { buckets: { 'chaicart-clean': {} }, lambda: { name: 'send-reports', timeoutSec: 4, events: [{ date: '2026-11-25', shops: SHOPS7 }, { date: '2026-11-25', shops: SHOPS7 }] } },
              checks: [
                { expr: "[i['result'] for i in lambda_invocations] == [{'done': 4, 'left': 3}, {'done': 7, 'left': 0}]", message: { en: 'With 4 seconds the first run fits 4 shops, the second the other 3. Use the remaining time, not a fixed count.', mr: '4 सेकंदांत पहिल्या run मध्ये 4 दुकानं बसतात, दुसऱ्यात उरलेली 3. ठरलेली संख्या नाही, उरलेला वेळ वापरा.' } },
                { expr: `all(sum(l == 'sent report to ' + s for i in lambda_invocations for l in i['logs']) == 1 for s in ${JSON.stringify(SHOPS7)})`, message: { en: 'On the hidden run a shop got zero or two reports.', mr: 'लपवलेल्या run मध्ये एका दुकानाला शून्य किंवा दोन reports गेले.' } },
              ],
            },
          ],
          mustUse: [{ pattern: 'get_remaining_time_in_millis\\(\\)', message: { en: 'Use context.get_remaining_time_in_millis() to decide when to stop.', mr: 'केव्हा थांबायचं ते context.get_remaining_time_in_millis() ने ठरवा.' } }],
          mustNotUse: [{ pattern: '\\[:\\s*3\\s*\\]|== 3\\b', message: { en: 'Do not hard-code 3 shops per run. Use the remaining time.', mr: 'एका run मध्ये 3 दुकानं hard-code करू नका. उरलेला वेळ वापरा.' } }],
          hints: [
            { en: 'A timeout cannot be caught with try/except: Lambda kills the run. So check the clock before each slow call.', mr: 'timeout try/except ने पकडता येत नाही: Lambda run मारून टाकतं. म्हणून प्रत्येक हळू call आधी घड्याळ तपासा.' },
            { en: 'Inside the loop, first: if shop in done: continue. Then: if context.get_remaining_time_in_millis() < 1000: break. After the loop, save_done keeps the progress for the next run.', mr: 'loop च्या आत आधी: if shop in done: continue. मग: if context.get_remaining_time_in_millis() < 1000: break. loop नंतर save_done पुढच्या run साठी progress जपतो.' },
            { en: "        if shop in done:\n            continue\n        if context.get_remaining_time_in_millis() < 1000:\n            break", mr: "        if shop in done:\n            continue\n        if context.get_remaining_time_in_millis() < 1000:\n            break" },
          ],
          successLine: { en: 'No more "Task timed out". The work stops cleanly and resumes exactly where it left off.', mr: 'आता "Task timed out" नाही. काम नीट थांबतं आणि नेमकं तिथूनच पुढे सुरू होतं.' },
        },
        {
          kind: 'python',
          prompt: { en: 'A new partner, Kulkarni, uploads under incoming/kulkarni/, but the function\'s role cannot read that prefix yet (AccessDenied). The starter catches the error, prints "oops" and returns normally, so Lambda thinks it worked: no retry, nothing in the on-failure destination. Fix the except block: log ONE JSON line with log("ERROR", context, key, error=...) where error contains the error text, then raise again. Expected: 3 failed attempts, then the event lands in the on-failure destination. A hidden run has the role fixed: nothing should fail.', mr: 'Kulkarni नावाचा नवा partner incoming/kulkarni/ खाली upload करतो, पण function च्या role ला तो prefix अजून वाचता येत नाही (AccessDenied). starter error पकडतो, "oops" print करतो आणि नेहमीसारखा return करतो, म्हणून Lambda ला वाटतं काम झालं: retry नाही, on-failure destination मध्ये काही नाही. except block दुरुस्त करा: log("ERROR", context, key, error=...) ने एकच JSON ओळ लिहा, error मध्ये error चा text हवा, मग पुन्हा raise करा. अपेक्षित: 3 अयशस्वी attempts, मग event on-failure destination मध्ये. एका लपवलेल्या run मध्ये role दुरुस्त आहे: काहीच अयशस्वी होता कामा नये.' },
          starter: `${L3_DLQ_HEAD}        print('oops', e)              # TODO: log one ERROR JSON line, then raise
        return {'ok': False}
${L3_DLQ_TAIL}`,
          solution: `${L3_DLQ_HEAD}        log('ERROR', context, key, error=f'{type(e).__name__}: {e}')
        raise
${L3_DLQ_TAIL}`,
          files: { 'data/sharma.csv': ORDERS_A, 'data/kulkarni.csv': ORDERS_B },
          allowLambdaErrors: true,
          aws: {
            buckets: { 'chaicart-raw': {}, 'chaicart-clean': {} },
            bucketConfig: { 'chaicart-raw': { notifyPrefix: 'incoming/', notifySuffix: '.csv' } },
            deny: ['s3:GetObject@chaicart-raw/incoming/kulkarni/*'],
            lambda: { name: 'process-orders', onFailure: DLQ },
          },
          checks: [
            { expr: "len(dlq_events) == 1 and dlq_events[0]['Records'][0]['s3']['object']['key'] == 'incoming/kulkarni/orders+24+Nov.csv'", message: { en: 'The Kulkarni event should end up in the on-failure destination (dlq_events). That only happens if the handler raises, so Lambda sees a failure.', mr: 'Kulkarni चा event on-failure destination मध्ये (dlq_events) पोहोचायला हवा. ते फक्त handler ने raise केलं तरच होतं, म्हणजे Lambda ला failure दिसतं.' } },
            { expr: "[i['attempt'] for i in lambda_invocations if not i['ok']] == [1, 2, 3]", message: { en: 'There should be 3 failed attempts for the Kulkarni file (1 + 2 retries).', mr: 'Kulkarni file साठी 3 अयशस्वी attempts हवेत (1 + 2 retries).' } },
            { expr: `all(any(l.startswith('{') and ${J}(l).get('level') == 'ERROR' and ${J}(l).get('key') == 'incoming/kulkarni/orders 24 Nov.csv' and ${J}(l).get('request_id') == i['requestId'] and 'AccessDenied' in str(${J}(l).get('error')) for l in i['logs']) for i in lambda_invocations if not i['ok'])`, message: { en: 'Each failed attempt needs one JSON log line with level "ERROR", the decoded key, the request_id and the error text (it contains AccessDenied). Use the log() helper.', mr: 'प्रत्येक अयशस्वी attempt मध्ये level "ERROR", decode केलेली key, request_id आणि error चा text (त्यात AccessDenied असतं) असलेली एक JSON log ओळ हवी. log() helper वापरा.' } },
            { expr: `s3_text('chaicart-clean', 'summary/sharma/orders 24 Nov.csv') == '${SUMMARY_A}'`, message: { en: 'The Sharma file has no problem; its summary should still be written.', mr: 'Sharma file मध्ये काही अडचण नाही; तिचा सारांश लिहिला जायलाच हवा.' } },
          ],
          variants: [
            {
              label: { en: 'The IAM role is fixed: both partners succeed', mr: 'IAM role दुरुस्त: दोन्ही partners यशस्वी' },
              aws: {
                buckets: { 'chaicart-raw': {}, 'chaicart-clean': {} },
                bucketConfig: { 'chaicart-raw': { notifyPrefix: 'incoming/', notifySuffix: '.csv' } },
                lambda: { name: 'process-orders', onFailure: DLQ },
              },
              checks: [
                { expr: `dlq_events == [] and all(i['ok'] for i in lambda_invocations) and len(lambda_invocations) == 2 and s3_text('chaicart-clean', 'summary/kulkarni/orders 24 Nov.csv') == '${SUMMARY_B}'`, message: { en: 'With the permission fixed, both files should succeed on the first attempt and nothing should reach the destination.', mr: 'permission दुरुस्त झाल्यावर दोन्ही files पहिल्याच attempt मध्ये यशस्वी व्हायला हव्यात आणि destination मध्ये काहीच जाता कामा नये.' } },
              ],
            },
          ],
          mustUse: [{ pattern: '\\n\\s+raise\\s*\\n', message: { en: 'Re-raise the error with a bare raise after logging it, so Lambda retries and then uses the on-failure destination.', mr: 'log केल्यानंतर नुसतं raise लिहून error पुन्हा raise करा, म्हणजे Lambda retry करेल आणि मग on-failure destination वापरेल.' } }],
          hints: [
            { en: 'Returning normally from except tells Lambda "success". Only an exception that leaves the handler counts as a failure.', mr: 'except मधून नेहमीसारखं return केलं म्हणजे Lambda ला "यश" सांगितलं. handler मधून बाहेर पडणारा exception च failure मानला जातो.' },
            { en: 'log("ERROR", context, key, error=f"{type(e).__name__}: {e}") prints the JSON line. A bare raise inside except re-raises the same error with its traceback.', mr: 'log("ERROR", context, key, error=f"{type(e).__name__}: {e}") JSON ओळ print करतो. except च्या आत नुसतं raise तोच error त्याच्या traceback सह पुन्हा raise करतो.' },
            { en: "        log('ERROR', context, key, error=f'{type(e).__name__}: {e}')\n        raise", mr: "        log('ERROR', context, key, error=f'{type(e).__name__}: {e}')\n        raise" },
          ],
          successLine: { en: 'The failure is loud, searchable and parked safely. Fix the role, replay the event, done.', mr: 'failure आता ठळक, शोधता येणारं आणि सुरक्षित ठेवलेलं. role दुरुस्त करा, event replay करा, झालं.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'An S3-triggered function throws an exception on every attempt. Default settings, no DLQ or destination. What happens?', mr: 'S3-triggered function प्रत्येक attempt मध्ये exception देतं. default settings, DLQ किंवा destination नाही. काय होतं?' },
        options: [
          { en: 'S3 keeps retrying for 14 days', mr: 'S3 14 दिवस retry करत राहतं' },
          { en: 'Lambda runs it 3 times in total (2 retries), then discards the event', mr: 'Lambda ते एकूण 3 वेळा चालवतं (2 retries), मग event टाकून देतं' },
          { en: 'Lambda runs it once and emails the account owner', mr: 'Lambda ते एकदा चालवतं आणि account owner ला email करतं' },
          { en: 'The file is moved to a failed/ prefix automatically', mr: 'file आपोआप failed/ prefix मध्ये हलवली जाते' },
        ],
        answer: 1,
        explain: { en: 'S3 invokes asynchronously. Lambda retries function errors twice by default (waiting 1 and then 2 minutes), then discards the event unless a dead-letter queue or on-failure destination is configured. The object stays in S3, but the event is gone.', mr: 'S3 asynchronously invoke करतं. Lambda function errors default दोनदा retry करतं (आधी 1 आणि मग 2 मिनिटं थांबून), मग dead-letter queue किंवा on-failure destination नसेल तर event टाकून देतं. object S3 मध्येच राहतो, पण event गेला.' },
      },
      {
        q: { en: 'Which output key keeps the handler idempotent when the same file is delivered twice?', mr: 'एकच file दोनदा आली तरी handler idempotent ठेवणारी output key कोणती?' },
        options: [
          { en: "f'summary/{uuid.uuid4()}.csv'", mr: "f'summary/{uuid.uuid4()}.csv'" },
          { en: "f'summary/{time.time()}.csv'", mr: "f'summary/{time.time()}.csv'" },
          { en: "Append the new rows to 'summary/all.csv'", mr: "नव्या rows 'summary/all.csv' मध्ये जोडत जा" },
          { en: "'summary/' + the input file name", mr: "'summary/' + input file चं नाव" },
        ],
        answer: 3,
        explain: { en: 'A key derived from the input maps every delivery of the same file to the same object, so a rerun overwrites it with identical content (or is skipped after a head_object check). uuid and timestamps create a new file per retry, and appending double counts.', mr: 'input वरून ठरलेली key एकाच file च्या प्रत्येक delivery ला त्याच object शी जोडते, म्हणून पुन्हा चालल्यावर तो तसाच content ने overwrite होतो (किंवा head_object तपासणीनंतर सोडला जातो). uuid आणि timestamps प्रत्येक retry ला नवी file बनवतात, आणि जोडत गेलं की दुप्पट मोजणी होते.' },
      },
      {
        q: { en: 'Theo calls a function synchronously and it raises ValueError. What does his invoke() call get back?', mr: 'Theo एक function synchronously call करतो आणि ते ValueError raise करतं. त्याच्या invoke() call ला काय मिळतं?' },
        options: [
          { en: 'StatusCode 200 with FunctionError "Unhandled", and a Payload holding errorType, errorMessage and stackTrace; Lambda does not retry', mr: 'StatusCode 200, FunctionError "Unhandled", आणि errorType, errorMessage आणि stackTrace असलेला Payload; Lambda retry करत नाही' },
          { en: 'StatusCode 202 and Lambda retries twice', mr: 'StatusCode 202 आणि Lambda दोनदा retry करतं' },
          { en: 'Nothing: sync errors go only to the DLQ', mr: 'काहीच नाही: sync errors फक्त DLQ मध्ये जातात' },
          { en: 'A Python ValueError raised inside Theo\'s own program', mr: 'Theo च्या स्वतःच्या program मध्ये raise झालेला Python ValueError' },
        ],
        answer: 0,
        explain: { en: 'The Invoke API call itself succeeds (200); the function error is reported in FunctionError and the Payload. Retries for synchronous calls are the caller\'s job, and DLQs and destinations apply only to asynchronous invocations.', mr: 'Invoke API call स्वतः यशस्वी होतो (200); function चा error FunctionError आणि Payload मध्ये कळवला जातो. synchronous calls चे retries caller चं काम, आणि DLQ व destinations फक्त asynchronous invocations ना लागू होतात.' },
      },
      {
        q: { en: 'Why do teams usually prefer an on-failure destination over a dead-letter queue for async Lambda failures?', mr: 'async Lambda failures साठी teams बहुतेक dead-letter queue पेक्षा on-failure destination का पसंत करतात?' },
        options: [
          { en: 'Destinations make the function run faster', mr: 'destinations मुळे function वेगाने चालतं' },
          { en: 'A DLQ cannot be an SQS queue', mr: 'DLQ म्हणजे SQS queue असू शकत नाही' },
          { en: 'The destination record includes the error details (like the stack trace and response), and more target types are supported: SQS, SNS, S3, Lambda and EventBridge', mr: 'destination record मध्ये error ची माहिती (stack trace आणि response सारखी) असते, आणि जास्त target types चालतात: SQS, SNS, S3, Lambda आणि EventBridge' },
          { en: 'Destinations retry forever', mr: 'destinations कायम retry करतात' },
        ],
        answer: 2,
        explain: { en: 'A DLQ (SQS or SNS) receives only the original event. An on-failure destination receives an invocation record with the event and details of the failure, and can target SQS, SNS, S3, another function or EventBridge. You can use both together.', mr: 'DLQ (SQS किंवा SNS) ला फक्त मूळ event मिळतो. on-failure destination ला event आणि failure ची माहिती असलेला invocation record मिळतो, आणि तो SQS, SNS, S3, दुसरं function किंवा EventBridge कडे जाऊ शकतो. दोन्ही एकत्र वापरता येतात.' },
      },
    ],
    recap: { line: { en: 'Async failures retry twice, then go to a DLQ or on-failure destination, or vanish. Expect every file twice: deterministic keys, check before writing, quarantine bad rows, watch the remaining time, and raise real errors loudly in JSON logs.', mr: 'async failures दोनदा retry होतात, मग DLQ किंवा on-failure destination मध्ये जातात, नाहीतर गायब. प्रत्येक file दोनदा येईल असं धरा: ठरलेल्या keys, लिहिण्याआधी तपासणी, वाईट rows बाजूला, उरलेल्या वेळावर लक्ष, आणि खरे errors JSON logs मध्ये ठळकपणे raise करा.' }, icon: '🔁' },
    interview: [
      {
        q: { en: 'A Lambda processes the same file twice. Why does that happen and how do you fix it?', mr: 'एक Lambda एकच file दोनदा process करतं. असं का होतं आणि ते कसं दुरुस्त करता?' },
        a: { en: 'It happens because the pipeline is at-least-once by design, so the fix is an idempotent handler that expects duplicates. The causes are async retries after a partial run (for example a timeout after the output was written), S3 event notifications delivered more than once, Lambda\'s internal queue occasionally delivering a duplicate, or the partner re-uploading. To fix it I derive the output key from the input, so a rerun overwrites the same object with the same content; I check head_object and skip if the output exists; and for side effects like payments or messages I store a marker (bucket, key and eTag) in DynamoDB with a conditional write using attribute_not_exists, so only the first attempt proceeds. At ChaiCart the double sales on the dashboard came from a uuid in the output key; switching to summary/<file name> plus a head_object check fixed it. The gotcha: checking and writing are two steps, so for strict cases the conditional write is the real lock.', mr: 'हे होतं कारण pipeline रचनेतूनच at-least-once आहे, म्हणून उपाय म्हणजे duplicates अपेक्षित धरणारा idempotent handler. कारणं: अर्धवट run नंतरचे async retries (उदा. output लिहून झाल्यावर timeout), एकापेक्षा जास्त वेळा पोहोचलेले S3 event notifications, Lambda च्या आतल्या queue ने कधीतरी दिलेला duplicate, किंवा partner ने पुन्हा upload करणं. दुरुस्तीसाठी मी output key input वरून ठरवते, म्हणजे पुन्हा चालल्यावर तोच object तसाच content ने overwrite होतो; head_object तपासते आणि output असेल तर सोडते; आणि payments किंवा messages सारख्या side effects साठी DynamoDB मध्ये attribute_not_exists वापरून conditional write ने खूण (bucket, key आणि eTag) ठेवते, म्हणजे फक्त पहिला attempt पुढे जातो. ChaiCart मध्ये dashboard वरची दुप्पट विक्री output key मधल्या uuid मुळे होती; summary/<file नाव> आणि head_object तपासणीने ती सुटली. गोम: तपासणं आणि लिहिणं या दोन पायऱ्या आहेत, म्हणून कडक प्रसंगी conditional write हेच खरं कुलूप.' },
      },
      {
        q: { en: 'What exactly happens when an asynchronous Lambda invocation fails?', mr: 'asynchronous Lambda invocation अयशस्वी झाल्यावर नेमकं काय होतं?' },
        a: { en: 'Lambda retries function errors twice by default, then discards the event unless a dead-letter queue or on-failure destination is configured. The waits are one minute before the first retry and two minutes before the second, and I can set retry attempts from 0 to 2. Throttles and system errors are handled differently: Lambda keeps retrying with backoff for up to 6 hours, and the maximum event age can be lowered to as little as 60 seconds. Even without errors, the same event may arrive more than once. At ChaiCart our S3-triggered function has an on-failure destination, a CloudWatch alarm on its depth, and an alarm on the AsyncEventsDropped metric. The gotcha is bad data: retrying a malformed file three times wastes time, so I quarantine bad rows and only raise for failures a retry or a human can fix.', mr: 'Lambda function errors default दोनदा retry करतं, मग dead-letter queue किंवा on-failure destination नसेल तर event टाकून देतं. पहिल्या retry आधी एक मिनिट आणि दुसऱ्या आधी दोन मिनिटं थांबतं, आणि retry attempts 0 ते 2 ठरवता येतात. throttles आणि system errors वेगळ्या पद्धतीने हाताळले जातात: Lambda backoff सह 6 तासांपर्यंत retry करत राहतं, आणि maximum event age 60 सेकंदांपर्यंत कमी करता येतो. errors नसतानाही तोच event एकापेक्षा जास्त वेळा येऊ शकतो. ChaiCart मध्ये आमच्या S3-triggered function ला on-failure destination आहे, त्याच्या लांबीवर CloudWatch alarm आहे, आणि AsyncEventsDropped metric वर alarm आहे. गोम म्हणजे वाईट data: बिघडलेली file तीनदा retry करणं म्हणजे वेळ वाया, म्हणून मी वाईट rows बाजूला काढते आणि retry किंवा माणूस सोडवू शकेल अशाच failures वर raise करते.' },
      },
      {
        q: { en: 'Dead-letter queue vs on-failure destination: what is the difference?', mr: 'dead-letter queue vs on-failure destination: फरक काय?' },
        a: { en: 'Both catch async events that failed all attempts, but a destination carries more information and supports more targets. A DLQ is an SQS queue or SNS topic and receives only the original event. An on-failure destination receives an invocation record with the event plus details such as the error and the response, and it can be SQS, SNS, an S3 bucket, another Lambda or EventBridge; there are also on-success destinations. For ChaiCart I prefer an on-failure destination to SQS, so a replay script can read the failed S3 events and re-invoke after we fix the cause, like a missing IAM permission. Both apply only to asynchronous invocations; for SQS-triggered functions the DLQ is configured on the source queue with a redrive policy. The gotcha: never point the destination at something that triggers the same function, or you build a new loop.', mr: 'दोन्ही सगळे attempts अयशस्वी झालेले async events पकडतात, पण destination जास्त माहिती नेतं आणि जास्त targets चालतात. DLQ म्हणजे SQS queue किंवा SNS topic आणि त्याला फक्त मूळ event मिळतो. on-failure destination ला event आणि error व response सारखी माहिती असलेला invocation record मिळतो, आणि ते SQS, SNS, S3 bucket, दुसरं Lambda किंवा EventBridge असू शकतं; on-success destinations सुद्धा असतात. ChaiCart साठी मी SQS कडे जाणारं on-failure destination पसंत करते, म्हणजे कारण दुरुस्त केल्यावर (उदा. नसलेली IAM permission) replay script अयशस्वी S3 events वाचून पुन्हा invoke करू शकते. दोन्ही फक्त asynchronous invocations ना लागू; SQS-triggered functions साठी DLQ source queue वर redrive policy ने लावतात. गोम: destination कधीच त्याच function ला trigger करणाऱ्या गोष्टीकडे लावू नका, नाहीतर नवा loop तयार होतो.' },
      },
      {
        q: { en: 'What is idempotency, and how do you implement it in a Lambda function?', mr: 'idempotency म्हणजे काय, आणि Lambda function मध्ये ती कशी लागू करता?' },
        a: { en: 'An operation is idempotent when doing it twice has the same effect as doing it once, which is what at-least-once systems need. In a file pipeline the simplest tool is a deterministic output: same input key, same output key, same content, so overwriting is harmless. Next is a pre-check, such as head_object on the output, which turns duplicates into cheap skips. For side effects that cannot be undone, like sending a WhatsApp message or charging money, I record an idempotency key, for example the S3 key plus eTag or the API request ID, in DynamoDB with a conditional write, so the second attempt fails the condition and stops; Powertools for AWS Lambda packages this pattern with expiry for the records. At ChaiCart the summary uses a deterministic key, and the WhatsApp reports keep a progress list so each shop gets exactly one message. The gotcha is counters: "total += amount" is never idempotent, so I recompute totals from source data instead.', mr: 'एखादी क्रिया दोनदा केली तरी परिणाम एकदा केल्यासारखाच असेल तर ती idempotent, आणि at-least-once systems ना नेमकं हेच हवं. file pipeline मध्ये सगळ्यात सोपं साधन म्हणजे ठरलेलं output: तीच input key, तीच output key, तोच content, म्हणून overwrite निरुपद्रवी. पुढे pre-check, उदा. output वर head_object, जो duplicates ना स्वस्तात सोडून देतो. परत न घेता येणाऱ्या side effects साठी, उदा. WhatsApp संदेश पाठवणं किंवा पैसे घेणं, मी idempotency key, उदा. S3 key आणि eTag किंवा API request ID, DynamoDB मध्ये conditional write ने नोंदवते, म्हणजे दुसरा attempt condition मध्ये अयशस्वी होऊन थांबतो; Powertools for AWS Lambda हाच pattern records च्या expiry सह देतं. ChaiCart मध्ये सारांश ठरलेली key वापरतो, आणि WhatsApp reports एक progress list ठेवतात म्हणजे प्रत्येक दुकानाला नेमका एक संदेश जातो. गोम म्हणजे counters: "total += amount" कधीच idempotent नसतो, म्हणून मी totals source data वरून पुन्हा मोजते.' },
      },
      {
        q: { en: 'Your Lambda times out on some days. How do you approach it?', mr: 'तुमचं Lambda काही दिवशी timeout होतं. तुम्ही काय करता?' },
        a: { en: 'First I find out where the time goes, then decide between making it faster, raising the timeout, or splitting the work. The REPORT line and my JSON logs show Duration and which step was slow; often it is a slow external API, a large file, or a cold start in a VPC. If the work is CPU-bound, more memory also brings more CPU and can shorten it; if it is waiting on APIs, I add client timeouts and retries with backoff. The timeout can go up to 30 minutes, but for work in pieces I check context.get_remaining_time_in_millis() before each piece, save progress and stop cleanly, letting the next invocation continue, or I fan the work out through SQS or Step Functions. At ChaiCart the WhatsApp reports were the slow part, so the function now stops with a one-second margin and resumes from a progress file. The gotcha: a timeout is a function error, so async invocations retry it, and any half-done work must be safe to repeat.', mr: 'आधी वेळ कुठे जातो ते शोधते, मग ठरवते: वेगवान करायचं, timeout वाढवायचा, की काम विभागायचं. REPORT ओळ आणि माझे JSON logs Duration आणि कोणती पायरी हळू होती ते दाखवतात; बहुतेक वेळा हळू बाहेरचा API, मोठी file, किंवा VPC मधला cold start. काम CPU-bound असेल तर जास्त memory सोबत जास्त CPU येतो आणि वेळ कमी होऊ शकतो; APIs ची वाट पाहत असेल तर client timeouts आणि backoff सह retries लावते. timeout 30 मिनिटांपर्यंत वाढवता येतो, पण तुकड्यांतल्या कामासाठी मी प्रत्येक तुकड्याआधी context.get_remaining_time_in_millis() तपासते, progress जतन करून नीट थांबते आणि पुढच्या invocation ला काम पुढे नेऊ देते, किंवा SQS किंवा Step Functions ने काम वाटून देते. ChaiCart मध्ये WhatsApp reports हा हळू भाग होता, म्हणून function आता एका सेकंदाच्या margin ने थांबतं आणि progress file वरून पुढे सुरू होतं. गोम: timeout हा function error आहे, म्हणून async invocations तो retry करतात, आणि अर्धवट काम पुन्हा केलं तरी सुरक्षित हवं.' },
      },
      {
        q: { en: 'How do you find out why a Lambda failed at 2 a.m.?', mr: 'रात्री 2 वाजता Lambda का अयशस्वी झालं ते कसं शोधता?' },
        a: { en: 'I start from metrics and alarms, then go to logs by request ID. The Errors, Throttles and Duration metrics tell me what kind of failure and when; for async functions AsyncEventsDropped and the depth of the on-failure queue tell me whether events were lost or parked. Then I open the log group /aws/lambda/<function-name> in CloudWatch Logs Insights; because our handler writes one JSON line per event, a query like fields @timestamp, key, error | filter level = "ERROR" lists the failed files with their request IDs. The REPORT line for that request shows Duration and Max Memory Used, which separates timeouts and out-of-memory errors from code errors, and the error text names the cause, for example AccessDenied with the role and action. At ChaiCart this is how we found the Kulkarni prefix missing from the role in minutes. The gotcha: CloudWatch log groups keep logs forever by default, so I set a retention period to control cost.', mr: 'मी metrics आणि alarms पासून सुरुवात करते, मग request ID ने logs कडे जाते. Errors, Throttles आणि Duration metrics कोणत्या प्रकारचं failure आणि केव्हा ते सांगतात; async functions साठी AsyncEventsDropped आणि on-failure queue ची लांबी events हरवले की बाजूला ठेवले ते सांगतात. मग CloudWatch Logs Insights मध्ये /aws/lambda/<function-name> log group उघडते; आमचा handler प्रत्येक event साठी एक JSON ओळ लिहितो, म्हणून fields @timestamp, key, error | filter level = "ERROR" सारखी query अयशस्वी files त्यांच्या request IDs सह दाखवते. त्या request ची REPORT ओळ Duration आणि Max Memory Used दाखवते, ज्यामुळे timeouts आणि out-of-memory errors code errors पासून वेगळे होतात, आणि error चा text कारण सांगतो, उदा. role आणि action सह AccessDenied. ChaiCart मध्ये role मध्ये Kulkarni prefix नसल्याचं आम्हाला असंच काही मिनिटांत सापडलं. गोम: CloudWatch log groups default ने logs कायम ठेवतात, म्हणून खर्च नियंत्रणात ठेवायला मी retention period ठरवते.' },
      },
      {
        q: { en: 'Should a Lambda handler catch all exceptions?', mr: 'Lambda handler ने सगळे exceptions पकडावेत का?' },
        a: { en: 'No. It should catch what it can handle and let real failures escape, because an exception leaving the handler is how Lambda knows to retry and to use the DLQ or destination. Expected data problems, like a non-numeric amount in one row, I handle inside the loop: the row goes to a rejects file with a reason and the rest of the file is processed. Infrastructure problems, like AccessDenied, throttling or a dependency being down, I log as structured JSON with the request ID and key, then re-raise with a bare raise so the traceback is kept. If I wrapped everything in except Exception and returned normally, Lambda would record a success: no retry, nothing parked, and no Errors metric to alarm on. That is exactly the silent loss the Gremlin enjoyed at ChaiCart before we fixed it. For SQS batches, the equivalent is reporting batchItemFailures so only the failed messages return to the queue.', mr: 'नाही. जे हाताळता येतं ते पकडावं आणि खऱ्या failures बाहेर जाऊ द्याव्यात, कारण handler मधून बाहेर पडणाऱ्या exception वरूनच Lambda ला retry करायचं आणि DLQ किंवा destination वापरायचं कळतं. अपेक्षित data समस्या, उदा. एका row मधला संख्या नसलेला amount, मी loop च्या आतच हाताळते: ती row कारणासह rejects file मध्ये जाते आणि उरलेली file process होते. infrastructure समस्या, उदा. AccessDenied, throttling किंवा बंद पडलेली dependency, मी request ID आणि key सह structured JSON मध्ये log करते, मग नुसतं raise करून पुन्हा raise करते म्हणजे traceback राहतो. सगळं except Exception मध्ये गुंडाळून नेहमीसारखं return केलं तर Lambda यश नोंदवेल: retry नाही, काही बाजूला ठेवलेलं नाही, आणि alarm लावायला Errors metric नाही. ChaiCart मध्ये आम्ही दुरुस्त करण्याआधी Gremlin ला आवडणारं हेच गुपचूप नुकसान होतं. SQS batches साठी याचं समतुल्य म्हणजे batchItemFailures कळवणं, म्हणजे फक्त अयशस्वी messages queue मध्ये परत जातात.' },
      },
      {
        q: { en: 'An SQS-triggered Lambda gets a batch of 10 messages and one is bad. What happens and how do you handle it?', mr: 'SQS-triggered Lambda ला 10 messages चा batch मिळतो आणि त्यातला एक वाईट आहे. काय होतं आणि ते कसं हाताळता?' },
        a: { en: 'By default, if the function raises, the whole batch counts as failed, so all 10 messages become visible again and the 9 good ones are processed twice. The fix is partial batch responses: I enable ReportBatchItemFailures on the event source mapping and return {"batchItemFailures": [{"itemIdentifier": message_id}]} for only the failed messages. The bad message keeps coming back until it exceeds the queue\'s maxReceiveCount, which AWS recommends setting to at least 5, and then the redrive policy moves it to the dead-letter queue. I also set the queue\'s visibility timeout to at least six times the function timeout, so messages do not reappear while a batch is still running. If ChaiCart moves to S3 → SQS → Lambda for the big partner, this is how one corrupt file will not block the other 2,999. The gotcha: returning an empty list or None marks the whole batch as a success, so the function must really list the failed IDs, and it must still be idempotent.', mr: 'default मध्ये function ने raise केलं तर पूर्ण batch अयशस्वी मानला जातो, म्हणून सगळे 10 messages पुन्हा दिसू लागतात आणि 9 चांगले दोनदा process होतात. उपाय partial batch responses: event source mapping वर ReportBatchItemFailures चालू करते आणि फक्त अयशस्वी messages साठी {"batchItemFailures": [{"itemIdentifier": message_id}]} return करते. वाईट message queue च्या maxReceiveCount पलीकडे जाईपर्यंत परत येत राहतो, जो AWS किमान 5 ठेवायला सांगतं, आणि मग redrive policy त्याला dead-letter queue मध्ये हलवते. queue चा visibility timeout मी function timeout च्या किमान सहा पट ठेवते, म्हणजे batch चालू असताना messages पुन्हा दिसत नाहीत. मोठ्या partner साठी ChaiCart S3 → SQS → Lambda वर गेलं, तर एक बिघडलेली file उरलेल्या 2,999 ना अशीच अडवणार नाही. गोम: रिकामी list किंवा None return केलं तर पूर्ण batch यशस्वी मानला जातो, म्हणून function ने अयशस्वी IDs खरोखर कळवायला हवेत, आणि ते तरीही idempotent हवं.' },
      },
    ],
  },
]
