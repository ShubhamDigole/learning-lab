import type { Lesson } from './types.ts'

// S3 Data Lake (ChaiCart Cloud), first half: cloud storage and the first bucket, keys/prefixes/listing,
// and designing a data lake (zones, Hive-style partitions, formats, idempotent writes).
// AWS facts checked against docs.aws.amazon.com and aws.amazon.com (S3 user guide, S3 FAQs, Athena docs) in Nov 2026.

// ───────────────────────── shared data: B1.1 Cloud storage and your first bucket

const PUNE_ORDERS = `order_id,shop,item,qty,amount
1001,Pune-FC,masala chai,2,40
1002,Pune-FC,vada pav,1,25
1003,Pune-FC,cutting chai,3,45
1004,Pune-FC,poha,1,30
1005,Pune-FC,masala chai,1,20
`

const PUNE_ORDERS_DAY2 = `order_id,shop,item,qty,amount
1101,Pune-FC,masala chai,4,80
1102,Pune-FC,thali,2,300
1103,Pune-FC,vada pav,6,150
1104,Pune-FC,cutting chai,2,30
1105,Pune-FC,misal pav,1,70
1106,Pune-FC,poha,3,90
1107,Pune-FC,masala chai,1,20
`

const B1_PUT_STARTER = `import boto3

s3 = boto3.client('s3', region_name='ap-south-1')
BUCKET = 'chaicart-raw'
KEY = 'orders/2026/11/24/pune.csv'

with open('data/pune_orders.csv', encoding='utf-8') as f:
    text = f.read()

# TODO: upload text with ContentType 'text/csv' and Metadata {'source': 'pos-pune'}
s3.put_object(Bucket=BUCKET, Key=KEY, Body=text)
print('uploaded', KEY)

# TODO: head_object: print the size (ContentLength) and the 'source' metadata
# TODO: get_object: read the body back and print how many order rows it has (no header)
`

const B1_PUT_SOLUTION = `import boto3

s3 = boto3.client('s3', region_name='ap-south-1')
BUCKET = 'chaicart-raw'
KEY = 'orders/2026/11/24/pune.csv'

with open('data/pune_orders.csv', encoding='utf-8') as f:
    text = f.read()

s3.put_object(Bucket=BUCKET, Key=KEY, Body=text, ContentType='text/csv', Metadata={'source': 'pos-pune'})
print('uploaded', KEY)

head = s3.head_object(Bucket=BUCKET, Key=KEY)
print('size:', head['ContentLength'], 'bytes')
print('source:', head['Metadata']['source'])

obj = s3.get_object(Bucket=BUCKET, Key=KEY)
body = obj['Body'].read().decode('utf-8')
print('rows:', len(body.splitlines()) - 1)
`

const B1_READ_HELPER = `import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3', region_name='ap-south-1')
BUCKET = 'chaicart-raw'
DAYS = ['2026/11/22', '2026/11/23', '2026/11/24']

def error_code(fn, *args):
    # a small test helper: runs fn and returns the AWS error code it raised (or None)
    try:
        fn(*args)
        return None
    except ClientError as e:
        return e.response['Error']['Code']
`

const B1_READ_STARTER = `${B1_READ_HELPER}
def read_orders(bucket, key):
    # TODO: return None when the key does not exist (NoSuchKey); re-raise every other error
    obj = s3.get_object(Bucket=bucket, Key=key)
    return obj['Body'].read().decode('utf-8')

for day in DAYS:
    text = read_orders(BUCKET, f'orders/{day}/pune.csv')
    if text is None:
        print(f'{day}: missing')
    else:
        print(f'{day}: {len(text.splitlines()) - 1} rows')
`

const B1_READ_SOLUTION = `${B1_READ_HELPER}
def read_orders(bucket, key):
    try:
        obj = s3.get_object(Bucket=bucket, Key=key)
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            return None
        raise
    return obj['Body'].read().decode('utf-8')

for day in DAYS:
    text = read_orders(BUCKET, f'orders/{day}/pune.csv')
    if text is None:
        print(f'{day}: missing')
    else:
        print(f'{day}: {len(text.splitlines()) - 1} rows')
`

// ───────────────────────── shared data: B1.2 Keys, prefixes and listing

const L2_SEED: Record<string, string> = {
  'orders/2026/11/23/nagpur.csv': 'order_id,amount\n2001,60\n2002,35\n',
  'orders/2026/11/23/pune.csv': 'order_id,amount\n1001,40\n',
  'orders/2026/11/24/mumbai.csv': 'order_id,amount\n3001,80\n3002,20\n3003,45\n',
  'orders/2026/11/24/nashik.csv': 'order_id,amount\n4001,30\n',
  'orders/2026/11/24/pune.csv': 'order_id,amount\n1002,25\n1003,50\n',
  'receipts/2026/11/24/r1002.json': '{"order_id": 1002, "amount": 25}',
  'logs/app/2026-11-24.log': 'INFO app started\n',
}

const L2_SEED_EMPTY_DAY: Record<string, string> = {
  'orders/2026/11/23/nagpur.csv': 'order_id,amount\n2001,60\n2002,35\n',
  'orders/2026/11/23/pune.csv': 'order_id,amount\n1001,40\n',
  'receipts/2026/11/24/r1002.json': '{"order_id": 1002, "amount": 25}',
}

const L2_SEED_MORE: Record<string, string> = {
  'orders/2026/11/24/mumbai.csv': 'order_id,amount\n3001,80\n',
  'orders/2026/11/24/nashik.csv': 'order_id,amount\n4001,30\n4002,90\n',
  'orders/2026/11/24/pune.csv': 'order_id,amount\n1002,25\n',
  'orders/2026/11/24/thane.csv': 'order_id,amount\n5001,120\n5002,60\n5003,15\n',
  'orders/2026/11/25/pune.csv': 'order_id,amount\n1010,40\n',
  'refunds/2026/11/24/f1.csv': 'order_id,amount\n3001,80\n',
  'logs/app/2026-11-24.log': 'INFO app started\n',
  'logs/lambda/2026-11-24.log': 'START\n',
}

const receipts = (day: string, n: number): Record<string, string> =>
  Object.fromEntries(Array.from({ length: n }, (_, i) => [`receipts/2026/11/${day}/r${String(i + 1).padStart(5, '0')}.json`, `{"amount": ${20 + (i % 5) * 10}}`]))

const L2_LIST_HEAD = `import boto3

s3 = boto3.client('s3', region_name='ap-south-1')
BUCKET = 'chaicart-raw'
PREFIX = 'orders/2026/11/24/'
`

const L2_FOLDERS_HEAD = `import boto3

s3 = boto3.client('s3', region_name='ap-south-1')
BUCKET = 'chaicart-raw'
`

const L2_PAGE_HEAD = `import boto3

s3 = boto3.client('s3', region_name='ap-south-1')
BUCKET = 'chaicart-receipts'
PREFIX = 'receipts/2026/11/24/'
`

const L2_MOVE_HEAD = `import boto3

s3 = boto3.client('s3', region_name='ap-south-1')
BUCKET = 'chaicart-raw'

def target_key(old_key):
    # 'incoming/Pune Orders.csv' -> 'orders/2026/11/24/pune-orders.csv'
    name = old_key.split('/')[-1].lower().replace(' ', '-')
    return 'orders/2026/11/24/' + name
`

const L2_MOVE_TAIL = `
left = s3.list_objects_v2(Bucket=BUCKET, Prefix='incoming/').get('Contents', [])
print('incoming left:', len(left))
`

// ───────────────────────── shared data: B1.3 Designing a data lake

const IN_PUNE_23 = `order_id,shop,item,qty,amount
1001,Pune-FC,masala chai,2,40
1002,Pune-FC,poha,1,30
`
const IN_PUNE_24 = `order_id,shop,item,qty,amount
1101,Pune-FC,masala chai,2,40
1102,Pune-FC,thali,3,450
`
const IN_NAGPUR_24 = `order_id,shop,item,qty,amount
2101,Nagpur-Sitabuldi,cutting chai,5,75
`
const IN_MUMBAI_1201 = `order_id,shop,item,qty,amount
3201,Mumbai-Andheri,thali,2,300
`
const IN_NASHIK_0105 = `order_id,shop,item,qty,amount
4301,Nashik-Road,misal pav,2,140
`

const LAND_HEAD = `import os
import boto3
from datetime import date

s3 = boto3.client('s3', region_name='ap-south-1')
BUCKET = 'chaicart-lake'
`

const LAND_LOOP = `
landed = 0
for name in sorted(os.listdir('data/incoming')):
    city, day_text = name[:-4].split('_')
    day = date.fromisoformat(day_text)
    key = raw_key('orders', day, city + '.csv')
    s3.upload_file('data/incoming/' + name, BUCKET, key)
    print(key)
    landed += 1
print('landed:', landed)
`

const P = (day: string, city: string) => `raw/orders/year=2026/month=11/day=${day}/${city}.csv`
const LAKE_SEED: Record<string, string> = {
  [P('22', 'pune')]: 'order_id,shop,item,qty,amount\n1001,Pune-FC,masala chai,2,40\n',
  [P('23', 'pune')]: 'order_id,shop,item,qty,amount\n1051,Pune-FC,masala chai,2,40\n1052,Pune-FC,poha,1,50\n',
  [P('23', 'nagpur')]: 'order_id,shop,item,qty,amount\n2051,Nagpur-Sitabuldi,cutting chai,5,75\n',
  [P('24', 'pune')]: 'order_id,shop,item,qty,amount\n1101,Pune-FC,masala chai,2,40\n1102,Pune-FC,thali,3,450\n1103,Pune-FC,vada pav,4,100\n',
  [P('24', 'nagpur')]: 'order_id,shop,item,qty,amount\n2101,Nagpur-Sitabuldi,cutting chai,5,75\n2102,Nagpur-Sitabuldi,poha,2,60\n',
  [P('24', 'mumbai')]: 'order_id,shop,item,qty,amount\n3101,Mumbai-Andheri,thali,2,300\n3102,Mumbai-Andheri,masala chai,6,120\n3103,Mumbai-Andheri,samosa,4,80\n3104,Mumbai-Andheri,misal pav,2,140\n',
}
const LAKE_SEED_NO_24: Record<string, string> = {
  [P('22', 'pune')]: LAKE_SEED[P('22', 'pune')],
  [P('23', 'pune')]: LAKE_SEED[P('23', 'pune')],
  [P('23', 'nagpur')]: LAKE_SEED[P('23', 'nagpur')],
  [P('25', 'pune')]: 'order_id,shop,item,qty,amount\n1201,Pune-FC,thali,1,150\n',
}
const LAKE_SEED_MORE: Record<string, string> = {
  ...LAKE_SEED,
  [P('24', 'thane')]: 'order_id,shop,item,qty,amount\n5101,Thane-West,thali,10,1500\n5102,Thane-West,masala chai,8,160\n',
  'raw/orders/year=2026/month=10/day=24/pune.csv': 'order_id,shop,item,qty,amount\n901,Pune-FC,thali,50,7500\n',
}

const SUM_HEAD = `import csv, io
import boto3
from datetime import date

s3 = boto3.client('s3', region_name='ap-south-1')
BUCKET = 'chaicart-lake'
DAY = date(2026, 11, 24)
`

const CLEAN_HEAD = `import csv, io, uuid
import boto3
from datetime import date

s3 = boto3.client('s3', region_name='ap-south-1')
BUCKET = 'chaicart-lake'
DAY = date(2026, 11, 24)
FIELDS = ['order_id', 'shop', 'item', 'qty', 'amount']

def partition(zone, dataset, day):
    return f'{zone}/{dataset}/year={day.year}/month={day.month:02d}/day={day.day:02d}/'

def read_raw(day):
    rows = []
    pages = s3.get_paginator('list_objects_v2').paginate(Bucket=BUCKET, Prefix=partition('raw', 'orders', day))
    for page in pages:
        for obj in page.get('Contents', []):
            text = s3.get_object(Bucket=BUCKET, Key=obj['Key'])['Body'].read().decode('utf-8')
            rows.extend(csv.DictReader(io.StringIO(text)))
    return rows

def to_csv(rows):
    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=FIELDS, lineterminator=chr(10))
    writer.writeheader()
    writer.writerows(rows)
    return out.getvalue()
`

const CLEAN_TAIL = `
process_day(DAY)
process_day(DAY)   # the scheduler retried the job: the lake must look the same afterwards
`

const RAW_PUNE_3 = 'order_id,shop,item,qty,amount\n1101,Pune-FC,masala chai,2,40\n1102,Pune-FC,thali,3,450\n1103,Pune-FC,vada pav,4,\n'
const RAW_NAGPUR_3 = 'order_id,shop,item,qty,amount\n2101,Nagpur-Sitabuldi,cutting chai,5,75\n2102,Nagpur-Sitabuldi,poha,2,abc\n'
const CLEAN_SEED: Record<string, string> = {
  [P('24', 'pune')]: RAW_PUNE_3,
  [P('24', 'pune-redelivered')]: RAW_PUNE_3,
  [P('24', 'nagpur')]: RAW_NAGPUR_3,
  [P('23', 'pune')]: 'order_id,shop,item,qty,amount\n1051,Pune-FC,masala chai,2,40\n',
}
const CLEAN_SEED_2: Record<string, string> = {
  [P('24', 'mumbai')]: 'order_id,shop,item,qty,amount\n3104,Mumbai-Andheri,misal pav,2,140\n3101,Mumbai-Andheri,thali,2,300\n3101,Mumbai-Andheri,thali,2,300\n3102,Mumbai-Andheri,samosa,4, 80\n',
  [P('24', 'thane')]: 'order_id,shop,item,qty,amount\n5101,Thane-West,thali,10,1500\n5102,Thane-West,masala chai,8,-160\n',
  [P('25', 'pune')]: 'order_id,shop,item,qty,amount\n1201,Pune-FC,thali,1,150\n',
}

const CLEAN_KEY = 'clean/orders/year=2026/month=11/day=24/part-0000.csv'

export const s3BasicsLessons: Lesson[] = [
  // ───────────────────────── B1.1 Cloud storage and your first bucket
  {
    id: 'lk1-1',
    code: 'B1.1',
    level: 'basic',
    title: { en: 'Cloud storage and your first bucket', mr: 'Cloud storage आणि तुमचा पहिला bucket' },
    skill: 'AWS regions and AZs, object vs block vs file storage, buckets/keys/objects/metadata, naming rules, boto3 create_bucket/put_object/get_object/head_object, ClientError codes',
    realLife: {
      place: 'station',
      title: { en: 'The cloakroom at Pune station', mr: 'पुणे स्टेशनवरची cloakroom' },
      story: {
        en: 'Meera has a few hours in Pune before her train to Nagpur, and a heavy bag. She leaves it at the station cloakroom. The attendant does not open the bag or care what is inside. He ties a tag with a unique number on it, writes a small label (owner, weight, date) in his register, and keeps it on a rack. Meera pays only for the hours the bag stays, nothing for an empty rack. When she wants one shirt from the bag, she cannot change it on the rack: she takes the whole bag, and if she repacks it, it goes back as a new deposit. And the cloakroom belongs to Pune station: a bag left in Pune is collected in Pune, not in Nagpur.',
        mr: 'नागपूरच्या ट्रेनआधी मीराकडे पुण्यात काही तास आहेत, आणि एक जड बॅग. ती बॅग स्टेशनच्या cloakroom मध्ये ठेवते. तिथला माणूस बॅग उघडत नाही, आत काय आहे याची त्याला पर्वा नसते. तो एक unique नंबर असलेला tag बांधतो, आपल्या रजिस्टरमध्ये छोटं लेबल लिहितो (मालक, वजन, तारीख), आणि बॅग rack वर ठेवतो. बॅग जितके तास राहते तितकेच पैसे मीरा देते, रिकाम्या rack चे काहीच नाहीत. बॅगमधून एक शर्ट हवा असेल तर तो rack वरच बदलता येत नाही: पूर्ण बॅग घ्यावी लागते, आणि पुन्हा भरली तर ती नवी ठेव म्हणून परत जाते. आणि ही cloakroom पुणे स्टेशनची आहे: पुण्यात ठेवलेली बॅग पुण्यातच मिळते, नागपूरमध्ये नाही.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🧳', label: 'Hand over the whole bag (object)', mr: 'पूर्ण बॅग द्या (object)' },
          { icon: '🏷️', label: 'A unique tag number (key)', mr: 'एक unique tag नंबर (key)' },
          { icon: '📝', label: 'A label: owner, weight, date (metadata)', mr: 'लेबल: मालक, वजन, तारीख (metadata)' },
          { icon: '🚉', label: 'Kept at Pune station only (bucket in a region)', mr: 'फक्त पुणे स्टेशनवर ठेवली (region मधला bucket)' },
          { icon: '💰', label: 'Pay only for what you store', mr: 'जेवढं ठेवलं तेवढेच पैसे' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'ChaiCart now has 40 shops. Every night each shop sends its order file, and they all sit on one office computer. Last week its disk filled up and two days of files were lost.', mr: 'ChaiCart ची आता 40 दुकानं आहेत. रोज रात्री प्रत्येक दुकान आपली order file पाठवतं, आणि त्या सगळ्या ऑफिसच्या एका computer वर पडून असतात. मागच्या आठवड्यात त्याची disk भरली आणि दोन दिवसांच्या files गेल्या.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'I could buy a bigger disk, but then we need backups, and the receipt photos and app logs are coming too.', mr: 'मी मोठी disk घेऊ शकतो, पण मग backups लागतील, आणि receipt चे फोटो आणि app logs पण येणार आहेत.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'one disk. one power cut. one spilled cup of chai. so many ways to say goodbye to your data. hehe.', mr: 'एक disk. एक वीज गेली. एक सांडलेला चहाचा कप. तुमच्या data ला bye म्हणायचे किती मार्ग. हेहे.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'We stop owning disks. The files go to Amazon S3 in the Mumbai region: copies in several data centers, no disk to fill, and we pay for what we store. {name}, you will create our first bucket.', mr: 'आपण disks सांभाळणं बंद करतो. files Mumbai region मधल्या Amazon S3 मध्ये जातात: अनेक data centers मध्ये प्रती, भरणारी disk नाही, आणि जेवढं ठेवू तेवढेच पैसे. {name}, आपला पहिला bucket तू बनवणार.' } },
        { who: 'meera', mood: 'happy', text: { en: 'And as a tester you already ask the right question: what happens when the file is not there? In S3 the answer is an error code, and you will learn to read it.', mr: 'आणि tester म्हणून तू योग्य प्रश्न आधीच विचारतेस: file नसली तर काय? S3 मध्ये त्याचं उत्तर एक error code असतं, आणि तो वाचायला तू शिकणार.' } },
      ],
      problem: { en: 'Order files live on one computer: the disk fills up, there is no second copy, and nobody else can read the files safely. More data (receipts, logs) is on the way.', mr: 'order files एकाच computer वर आहेत: disk भरते, दुसरी प्रत नाही, आणि बाकी कोणी त्या सुरक्षितपणे वाचू शकत नाही. आणखी data (receipts, logs) येतोच आहे.' },
      solution: { en: 'Store every file as an object in an S3 bucket in the Mumbai region (ap-south-1), with a clear key like orders/2026/11/24/pune.csv. Python talks to S3 with boto3: create_bucket, put_object, head_object, get_object, and it reads ClientError codes to tell "missing" from "not allowed".', mr: 'प्रत्येक file Mumbai region (ap-south-1) मधल्या S3 bucket मध्ये object म्हणून ठेवा, orders/2026/11/24/pune.csv सारख्या स्पष्ट key सह. Python boto3 ने S3 शी बोलतो: create_bucket, put_object, head_object, get_object, आणि "नाही" आणि "परवानगी नाही" यातला फरक ओळखायला तो ClientError codes वाचतो.' },
    },
    lesson: [
      { en: 'The cloud means renting computers and storage from a provider like AWS (Amazon Web Services) instead of buying them. You pay as you go: per GB stored per month, per request, per data sent out, with no upfront cost. AWS runs Regions around the world, like ap-south-1 in Mumbai. Each Region has at least three Availability Zones (AZs): separate groups of data centers with their own power, cooling and network, kilometres apart. You pick a Region close to your users and your other services, and where the law allows the data to live. A bucket never moves out of the Region you create it in.', mr: 'cloud म्हणजे computers आणि storage विकत घेण्याऐवजी AWS (Amazon Web Services) सारख्या provider कडून भाड्याने घेणं. pay as you go: दर महिन्याला ठेवलेल्या प्रत्येक GB चे, प्रत्येक request चे, बाहेर पाठवलेल्या data चे पैसे, आधी काहीच गुंतवणूक नाही. AWS जगभर Regions चालवतं, उदा. Mumbai मधला ap-south-1. प्रत्येक Region मध्ये किमान तीन Availability Zones (AZs) असतात: स्वतःची वीज, cooling आणि network असलेले, एकमेकांपासून काही किलोमीटर दूर data centers चे वेगळे गट. users आणि बाकीच्या services जवळ असलेला, आणि कायद्याने data जिथे ठेवता येतो असा Region निवडा. bucket ज्या Region मध्ये बनतो त्यातून तो कधीच हलत नाही.' },
      { en: 'AWS has three kinds of storage. Block storage (Amazon EBS) is a virtual hard disk for one server (EC2 instance) in one AZ; databases love it. File storage (Amazon EFS) is a shared folder (NFS) that many servers mount at once. Object storage (Amazon S3) keeps whole files as objects behind an HTTP API, with no limit on how many objects a bucket holds. You cannot edit the middle of an object; you upload a new version of the whole thing, like repacking the bag. That simple model is why S3 is the home of almost every data lake: cheap, huge, and readable by Athena, Glue, Spark and Lambda.', mr: 'AWS कडे storage चे तीन प्रकार आहेत. Block storage (Amazon EBS) म्हणजे एका AZ मधल्या एका server (EC2 instance) साठी virtual hard disk; databases ना ती आवडते. File storage (Amazon EFS) म्हणजे अनेक servers एकाच वेळी mount करतात असा shared folder (NFS). Object storage (Amazon S3) पूर्ण files objects म्हणून HTTP API मागे ठेवतं, आणि एका bucket मध्ये किती objects असावेत याला मर्यादा नाही. object च्या मधला भाग edit करता येत नाही; पूर्ण object पुन्हा upload करावा लागतो, बॅग पुन्हा भरल्यासारखा. या साध्या model मुळेच जवळजवळ प्रत्येक data lake चं घर S3 आहे: स्वस्त, प्रचंड, आणि Athena, Glue, Spark आणि Lambda वाचू शकतात.' },
      { en: 'A bucket is a container in one Region. An object is the data plus metadata (size, ContentType, ETag, last modified, and your own small Metadata dict, about 2 KB). The key is the object\'s full name, like orders/2026/11/24/pune.csv, up to 1,024 bytes and case sensitive. The namespace is flat: the console draws folders, but "orders/2026/11/24/" is just the start of a key. S3 Standard is designed for 99.999999999% durability (11 nines: the chance of losing an object is tiny, because copies sit in at least three AZs) and 99.99% availability (how often you can reach it). Since December 2020 S3 is strongly consistent: a read or a list right after a successful write already sees it.', mr: 'bucket म्हणजे एका Region मधला container. object म्हणजे data आणि metadata (size, ContentType, ETag, last modified, आणि तुमची स्वतःची छोटी Metadata dict, साधारण 2 KB). key म्हणजे object चं पूर्ण नाव, उदा. orders/2026/11/24/pune.csv, जास्तीत जास्त 1,024 bytes आणि case sensitive. namespace सपाट (flat) आहे: console folders दाखवतं, पण "orders/2026/11/24/" हा फक्त key चा सुरुवातीचा भाग आहे. S3 Standard 99.999999999% durability (11 nines: object हरवण्याची शक्यता अगदी नगण्य, कारण प्रती किमान तीन AZs मध्ये असतात) आणि 99.99% availability (तो किती वेळा उपलब्ध असतो) साठी design केलेलं आहे. December 2020 पासून S3 strongly consistent आहे: यशस्वी write नंतर लगेच केलेला read किंवा list तो बदल पाहतोच.' },
      { en: 'Bucket names are 3 to 63 characters: lowercase letters, numbers, dots and hyphens, starting and ending with a letter or number, never like an IP address, no two dots in a row. They are global: unique across every AWS account in the partition, so "chaicart" is long gone (BucketAlreadyExists), while creating your own bucket again gives BucketAlreadyOwnedByYou. You cannot rename a bucket or change its Region later. An account can create 10,000 general purpose buckets by default. In boto3, a bucket outside us-east-1 needs CreateBucketConfiguration={"LocationConstraint": "ap-south-1"}, and every failure is a ClientError whose e.response["Error"]["Code"] says why. This lab is a simulated AWS account in Mumbai: real API names and error codes, no real bill.', mr: 'bucket ची नावं 3 ते 63 अक्षरांची: lowercase अक्षरं, अंक, dots आणि hyphens, सुरुवात आणि शेवट अक्षर किंवा अंकाने, IP address सारखं नाही, सलग दोन dots नाहीत. ती global असतात: partition मधल्या प्रत्येक AWS account मध्ये unique, म्हणून "chaicart" कधीच गेलं (BucketAlreadyExists), तर स्वतःचाच bucket पुन्हा बनवला तर BucketAlreadyOwnedByYou येतो. bucket चं नाव किंवा Region नंतर बदलता येत नाही. एक account default ने 10,000 general purpose buckets बनवू शकतं. boto3 मध्ये us-east-1 बाहेरच्या bucket ला CreateBucketConfiguration={"LocationConstraint": "ap-south-1"} लागतं, आणि प्रत्येक अपयश म्हणजे ClientError, ज्याचा e.response["Error"]["Code"] कारण सांगतो. हा lab Mumbai मधलं simulated AWS account आहे: खरी API नावं आणि error codes, खरं bill नाही.' },
    ],
    syntax: {
      template: `import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3', region_name='ap-south-1')

s3.create_bucket(Bucket='chaicart-raw-mumbai',
                 CreateBucketConfiguration={'LocationConstraint': 'ap-south-1'})
for b in s3.list_buckets()['Buckets']:
    print(b['Name'])

s3.put_object(Bucket='chaicart-raw', Key='orders/2026/11/24/pune.csv',
              Body=text, ContentType='text/csv', Metadata={'source': 'pos-pune'})
head = s3.head_object(Bucket='chaicart-raw', Key='orders/2026/11/24/pune.csv')
obj = s3.get_object(Bucket='chaicart-raw', Key='orders/2026/11/24/pune.csv')
text = obj['Body'].read().decode('utf-8')

try:
    s3.get_object(Bucket='chaicart-raw', Key='orders/2026/11/30/pune.csv')
except ClientError as e:
    code = e.response['Error']['Code']     # 'NoSuchKey', 'AccessDenied', ...`,
      parts: [
        { code: "boto3.client('s3', region_name='ap-south-1')", means: { en: 'a low-level S3 client; every method is one S3 API call (CreateBucket, PutObject...)', mr: 'low-level S3 client; प्रत्येक method म्हणजे एक S3 API call (CreateBucket, PutObject...)' } },
        { code: "CreateBucketConfiguration={'LocationConstraint': ...}", means: { en: 'the Region the bucket lives in; required everywhere except us-east-1, else IllegalLocationConstraintException', mr: 'bucket कोणत्या Region मध्ये राहतो; us-east-1 सोडून सगळीकडे आवश्यक, नाहीतर IllegalLocationConstraintException' } },
        { code: "put_object(Bucket, Key, Body, ContentType, Metadata)", means: { en: 'store a whole object; the same key again replaces it; returns the ETag', mr: 'पूर्ण object ठेवा; तीच key पुन्हा दिली तर तो बदलतो; ETag परत देतो' } },
        { code: "head_object(...)", means: { en: 'metadata only, no body: ContentLength, ContentType, ETag, Metadata. A missing key gives code "404"', mr: 'फक्त metadata, body नाही: ContentLength, ContentType, ETag, Metadata. key नसेल तर code "404"' } },
        { code: "get_object(...)['Body'].read()", means: { en: 'the object\'s bytes; .decode("utf-8") turns them into text. A missing key gives NoSuchKey', mr: 'object चे bytes; .decode("utf-8") त्यांचा text करतो. key नसेल तर NoSuchKey' } },
        { code: "e.response['Error']['Code']", means: { en: 'the AWS reason for a ClientError: NoSuchKey, NoSuchBucket, AccessDenied, BucketAlreadyExists, InvalidBucketName', mr: 'ClientError चं AWS कारण: NoSuchKey, NoSuchBucket, AccessDenied, BucketAlreadyExists, InvalidBucketName' } },
      ],
      example: [
        { code: "s3.create_bucket(Bucket='chaicart-raw-mumbai', CreateBucketConfiguration={'LocationConstraint': 'ap-south-1'})", note: { en: 'a cloakroom at Mumbai station, not anywhere else', mr: 'Mumbai स्टेशनवरची cloakroom, दुसरीकडे कुठे नाही' } },
        { code: "Key='orders/2026/11/24/pune.csv'", note: { en: 'the tag number: one full name, the "folders" are part of it', mr: 'tag नंबर: एकच पूर्ण नाव, "folders" त्याचाच भाग' } },
        { code: "Metadata={'source': 'pos-pune'}", note: { en: 'the attendant\'s label: small facts about the bag', mr: 'cloakroom वाल्याचं लेबल: बॅगबद्दल छोटी माहिती' } },
        { code: "head['ContentLength']  # 171", note: { en: 'read the label without opening the bag', mr: 'बॅग न उघडता लेबल वाचा' } },
        { code: "obj['Body'].read().decode('utf-8')", note: { en: 'take the whole bag back and open it', mr: 'पूर्ण बॅग परत घ्या आणि उघडा' } },
        { code: "except ClientError as e: e.response['Error']['Code']", note: { en: '"no such tag" and "you may not collect this bag" are different answers', mr: '"असा tag नाही" आणि "ही बॅग तुम्हाला घेता येणार नाही" ही वेगळी उत्तरं' } },
      ],
      pitfall: { en: 'except Exception: return None hides AccessDenied and NoSuchBucket as if the file were just missing, and your pipeline happily reports "0 orders today". Catch ClientError, check the code, handle only the case you expect (NoSuchKey), and raise the rest. And remember head_object reports a missing key as "404", not "NoSuchKey".', mr: 'except Exception: return None हे AccessDenied आणि NoSuchBucket सुद्धा file फक्त नाही असं दाखवून लपवतं, आणि तुमची pipeline आनंदाने "आज 0 orders" सांगते. ClientError पकडा, code तपासा, फक्त अपेक्षित केस (NoSuchKey) हाताळा, आणि बाकी raise करा. आणि लक्षात ठेवा, head_object नसलेली key "404" म्हणून सांगतो, "NoSuchKey" नाही.' },
    },
    practice: {
      intro: { en: 'Your lab has a simulated AWS account in Mumbai (ap-south-1). After every run, the AWS console panel under the output shows the buckets, objects and every API call your code made. Hidden accounts with other buckets and files check your code too.', mr: 'तुमच्या lab मध्ये Mumbai (ap-south-1) मधलं simulated AWS account आहे. प्रत्येक run नंतर output खालचं AWS console panel buckets, objects आणि तुमच्या code ने केलेला प्रत्येक API call दाखवतं. इतर buckets आणि files असलेली लपवलेली accounts सुद्धा तुमचा code तपासतात.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'Create the bucket chaicart-raw-mumbai in the Mumbai region, then list every bucket in the account and print each name, and finally "total: N". Press Run first: the starter forgets the LocationConstraint, so read the error. A hidden account with more buckets checks that you print what list_buckets really returns.', mr: 'Mumbai region मध्ये chaicart-raw-mumbai हा bucket बनवा, मग account मधले सगळे buckets list करून प्रत्येकाचं नाव print करा, आणि शेवटी "total: N". आधी Run दाबा: starter LocationConstraint विसरतो, तो error वाचा. जास्त buckets असलेलं लपवलेलं account तपासतं की list_buckets जे खरंच देतो तेच तुम्ही print करता.' },
          aws: { buckets: { 'chaicart-app-logs': {} } },
          starter: `import boto3

s3 = boto3.client('s3', region_name='ap-south-1')

# TODO: add CreateBucketConfiguration so the bucket is created in Mumbai (ap-south-1)
s3.create_bucket(Bucket='chaicart-raw-mumbai')

# TODO: list every bucket (s3.list_buckets()['Buckets']) and print each 'Name'
# TODO: then print 'total:' and the number of buckets
`,
          solution: `import boto3

s3 = boto3.client('s3', region_name='ap-south-1')

s3.create_bucket(Bucket='chaicart-raw-mumbai', CreateBucketConfiguration={'LocationConstraint': 'ap-south-1'})

buckets = s3.list_buckets()['Buckets']
for b in buckets:
    print(b['Name'])
print('total:', len(buckets))
`,
          output: ['chaicart-app-logs', 'chaicart-raw-mumbai', 'total: 2'],
          checks: [
            { expr: "s3_bucket('chaicart-raw-mumbai') is not None and s3_bucket('chaicart-raw-mumbai')['region'] == 'ap-south-1'", message: { en: 'The bucket chaicart-raw-mumbai should exist in ap-south-1. Pass CreateBucketConfiguration={"LocationConstraint": "ap-south-1"}.', mr: 'chaicart-raw-mumbai हा bucket ap-south-1 मध्ये असायला हवा. CreateBucketConfiguration={"LocationConstraint": "ap-south-1"} द्या.' } },
          ],
          variants: [
            {
              label: { en: 'An account that already has three buckets', mr: 'आधीच तीन buckets असलेलं account' },
              aws: { buckets: { 'chaicart-app-logs': {}, 'chaicart-backups': {}, 'chaicart-receipts': {} } },
              output: ['chaicart-app-logs', 'chaicart-backups', 'chaicart-raw-mumbai', 'chaicart-receipts', 'total: 4'],
            },
          ],
          mustUse: [{ pattern: 'list_buckets\\(', message: { en: 'Get the names from s3.list_buckets(), not from a list you typed.', mr: 'नावं s3.list_buckets() मधून घ्या, स्वतः टाइप केलेल्या list मधून नाही.' } }],
          hints: [
            { en: 'The error IllegalLocationConstraintException means: outside us-east-1, S3 wants to be told the Region in the request body too.', mr: 'IllegalLocationConstraintException म्हणजे: us-east-1 बाहेर S3 ला request च्या body मध्येही Region सांगावा लागतो.' },
            { en: 'create_bucket(Bucket=..., CreateBucketConfiguration={"LocationConstraint": "ap-south-1"}). Then list_buckets() returns a dict; its "Buckets" key is a list of dicts with "Name".', mr: 'create_bucket(Bucket=..., CreateBucketConfiguration={"LocationConstraint": "ap-south-1"}). मग list_buckets() एक dict देतो; त्याची "Buckets" key म्हणजे "Name" असलेल्या dicts ची list.' },
            { en: "s3.create_bucket(Bucket='chaicart-raw-mumbai', CreateBucketConfiguration={'LocationConstraint': 'ap-south-1'})\nbuckets = s3.list_buckets()['Buckets']\nfor b in buckets:\n    print(b['Name'])\nprint('total:', len(buckets))", mr: "s3.create_bucket(Bucket='chaicart-raw-mumbai', CreateBucketConfiguration={'LocationConstraint': 'ap-south-1'})\nbuckets = s3.list_buckets()['Buckets']\nfor b in buckets:\n    print(b['Name'])\nprint('total:', len(buckets))" },
          ],
          successLine: { en: 'ChaiCart\'s first bucket, in Mumbai. Open the AWS console panel: there it is.', mr: 'ChaiCart चा पहिला bucket, Mumbai मध्ये. AWS console panel उघडा: तो तिथे आहे.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Theo tried six bucket names. Press Run and read each error code. Why does "chaicart" fail with BucketAlreadyExists while the second "chaicart-raw-mumbai" fails with BucketAlreadyOwnedByYou?', mr: 'Theo ने सहा bucket नावं वापरून पाहिली. Run दाबा आणि प्रत्येक error code वाचा. "chaicart" BucketAlreadyExists ने का अपयशी होतं, तर दुसरं "chaicart-raw-mumbai" BucketAlreadyOwnedByYou ने?' },
          pythonSandbox: {
            code: `import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3', region_name='ap-south-1')
LOC = {'LocationConstraint': 'ap-south-1'}

names = ['ChaiCart_Raw', 'chaicart', 'chaicart-raw-mumbai', 'chaicart-raw-mumbai', '192.168.1.10', 'cc']
for name in names:
    try:
        s3.create_bucket(Bucket=name, CreateBucketConfiguration=LOC)
        print(f'{name:22} created')
    except ClientError as e:
        print(f'{name:22} {e.response["Error"]["Code"]}')
`,
            aws: { buckets: {} },
          },
          options: [
            { en: 'Bucket names are global across all AWS accounts: "chaicart" belongs to some other account, while BucketAlreadyOwnedByYou means this account already created that bucket, so a setup script can safely treat it as done', mr: 'bucket नावं सगळ्या AWS accounts मध्ये global असतात: "chaicart" दुसऱ्याच कोणत्या account चं आहे, तर BucketAlreadyOwnedByYou म्हणजे या account ने तो bucket आधीच बनवला आहे, म्हणून setup script ते "झालं" म्हणून सुरक्षितपणे मानू शकतो' },
            { en: '"chaicart" is too short, and the second call failed because S3 needs a few minutes between calls', mr: '"chaicart" खूप लहान आहे, आणि दुसरा call अपयशी झाला कारण S3 ला दोन calls मध्ये काही मिनिटं लागतात' },
            { en: 'Both codes mean the same thing; S3 picks one at random', mr: 'दोन्ही codes चा अर्थ एकच; S3 कोणताही एक निवडतो' },
            { en: 'Bucket names are unique only inside one account, so "chaicart" must be a bucket Theo made last year', mr: 'bucket नावं फक्त एका account मध्ये unique असतात, म्हणून "chaicart" Theo ने मागच्या वर्षी बनवलेला bucket असणार' },
          ],
          correct: [0],
          explain: { en: 'General purpose bucket names share one global namespace (per partition), so a short, famous name is taken by someone else: BucketAlreadyExists. BucketAlreadyOwnedByYou only says you already have it. The other three fail InvalidBucketName: capitals and underscore, an IP-address shape, and fewer than 3 characters. Good practice: add something unique such as the account ID or Region, like chaicart-raw-123456789012-ap-south-1. AWS now also offers an account regional namespace (names ending in -an) that only your account can use.', mr: 'general purpose bucket नावांचा एकच global namespace (प्रत्येक partition मध्ये) असतो, म्हणून छोटं, प्रसिद्ध नाव दुसऱ्या कोणीतरी घेतलेलं असतं: BucketAlreadyExists. BucketAlreadyOwnedByYou फक्त सांगतो की तो तुमच्याकडे आधीच आहे. बाकीची तीन InvalidBucketName ने अपयशी: capitals आणि underscore, IP address सारखा आकार, आणि 3 पेक्षा कमी अक्षरं. चांगली सवय: account ID किंवा Region सारखं काहीतरी unique जोडा, उदा. chaicart-raw-123456789012-ap-south-1. AWS आता account regional namespace सुद्धा देतं (-an ने संपणारी नावं), जे फक्त तुमचं account वापरू शकतं.' },
          hints: [
            { en: 'Read the output line by line. Which names never had a chance (InvalidBucketName) and which were valid but taken?', mr: 'output ओळ ओळ वाचा. कोणत्या नावांना संधीच नव्हती (InvalidBucketName) आणि कोणती वैध होती पण घेतलेली होती?' },
            { en: 'The first chaicart-raw-mumbai call printed "created". What changed before the second call?', mr: 'पहिल्या chaicart-raw-mumbai call ने "created" print केलं. दुसऱ्या call आधी काय बदललं?' },
          ],
          successLine: { en: 'Global names, local ownership. Now you can read any CreateBucket error.', mr: 'global नावं, स्वतःची मालकी. आता तुम्ही कोणताही CreateBucket error वाचू शकता.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Upload the Pune order file (data/pune_orders.csv, shown above) to chaicart-raw under the key orders/2026/11/24/pune.csv with ContentType "text/csv" and Metadata {"source": "pos-pune"}. Then, from S3 itself: head_object to print "size: N bytes" and "source: ...", and get_object to read the body back and print "rows: N" (order rows, without the header). A hidden day\'s file checks you read S3 and not your local variable.', mr: 'Pune ची order file (data/pune_orders.csv, वर दिसते) chaicart-raw मध्ये orders/2026/11/24/pune.csv या key खाली upload करा, ContentType "text/csv" आणि Metadata {"source": "pos-pune"} सह. मग S3 मधूनच: head_object ने "size: N bytes" आणि "source: ..." print करा, आणि get_object ने body परत वाचून "rows: N" print करा (header सोडून order rows). दुसऱ्या दिवसाची लपवलेली file तपासते की तुम्ही S3 वाचता, स्वतःचा local variable नाही.' },
          files: { 'data/pune_orders.csv': PUNE_ORDERS },
          aws: { buckets: { 'chaicart-raw': {} } },
          starter: B1_PUT_STARTER,
          solution: B1_PUT_SOLUTION,
          output: ['uploaded orders/2026/11/24/pune.csv', 'size: 171 bytes', 'source: pos-pune', 'rows: 5'],
          checks: [
            { expr: "s3_text('chaicart-raw', 'orders/2026/11/24/pune.csv') == open('data/pune_orders.csv').read()", message: { en: 'The object in S3 should hold exactly the text of data/pune_orders.csv.', mr: 'S3 मधल्या object मध्ये data/pune_orders.csv चा text जसाच्या तसा हवा.' } },
            { expr: "s3_bucket('chaicart-raw')['objects']['orders/2026/11/24/pune.csv'][-1]['ctype'] == 'text/csv'", message: { en: 'Set ContentType="text/csv" so tools (and browsers) know it is a CSV.', mr: 'ContentType="text/csv" द्या, म्हणजे tools (आणि browsers) ना ती CSV आहे हे कळेल.' } },
            { expr: "s3_bucket('chaicart-raw')['objects']['orders/2026/11/24/pune.csv'][-1]['meta'] == {'source': 'pos-pune'}", message: { en: 'The object should carry Metadata={"source": "pos-pune"}.', mr: 'object वर Metadata={"source": "pos-pune"} हवा.' } },
          ],
          variants: [
            {
              label: { en: 'Another day: a bigger Pune file', mr: 'दुसरा दिवस: Pune ची मोठी file' },
              files: { 'data/pune_orders.csv': PUNE_ORDERS_DAY2 },
              output: ['uploaded orders/2026/11/24/pune.csv', 'size: 225 bytes', 'source: pos-pune', 'rows: 7'],
            },
          ],
          mustUse: [
            { pattern: 'head_object\\(', message: { en: 'Read the size and metadata with s3.head_object.', mr: 'size आणि metadata s3.head_object ने वाचा.' } },
            { pattern: 'get_object\\(', message: { en: 'Read the body back with s3.get_object.', mr: 'body s3.get_object ने परत वाचा.' } },
          ],
          hints: [
            { en: 'put_object takes ContentType="text/csv" and Metadata={"source": "pos-pune"} as extra arguments.', mr: 'put_object ला ContentType="text/csv" आणि Metadata={"source": "pos-pune"} हे जास्तीचे arguments देता येतात.' },
            { en: 'head = s3.head_object(Bucket=BUCKET, Key=KEY) gives head["ContentLength"] and head["Metadata"]["source"]. obj = s3.get_object(...) gives obj["Body"].read(), which is bytes: decode it.', mr: 'head = s3.head_object(Bucket=BUCKET, Key=KEY) ने head["ContentLength"] आणि head["Metadata"]["source"] मिळतात. obj = s3.get_object(...) ने obj["Body"].read() मिळतं, ते bytes असतात: decode करा.' },
            { en: 'Rows: the decoded text has one line per row plus the header, so len(body.splitlines()) - 1.', mr: 'Rows: decode केलेल्या text मध्ये प्रत्येक row ची एक ओळ आणि header, म्हणून len(body.splitlines()) - 1.' },
            { en: "s3.put_object(Bucket=BUCKET, Key=KEY, Body=text, ContentType='text/csv', Metadata={'source': 'pos-pune'})\nprint('uploaded', KEY)\nhead = s3.head_object(Bucket=BUCKET, Key=KEY)\nprint('size:', head['ContentLength'], 'bytes')\nprint('source:', head['Metadata']['source'])\nbody = s3.get_object(Bucket=BUCKET, Key=KEY)['Body'].read().decode('utf-8')\nprint('rows:', len(body.splitlines()) - 1)", mr: "s3.put_object(Bucket=BUCKET, Key=KEY, Body=text, ContentType='text/csv', Metadata={'source': 'pos-pune'})\nprint('uploaded', KEY)\nhead = s3.head_object(Bucket=BUCKET, Key=KEY)\nprint('size:', head['ContentLength'], 'bytes')\nprint('source:', head['Metadata']['source'])\nbody = s3.get_object(Bucket=BUCKET, Key=KEY)['Body'].read().decode('utf-8')\nprint('rows:', len(body.splitlines()) - 1)" },
          ],
          successLine: { en: 'Uploaded, labelled, and read back from the cloud. That round trip is every pipeline\'s first test.', mr: 'upload केलं, लेबल लावलं, आणि cloud मधून परत वाचलं. ही फेरी म्हणजे प्रत्येक pipeline ची पहिली test.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Some shops miss a day. Finish read_orders(bucket, key): return the text, return None only when the error code is NoSuchKey, and re-raise every other error (a wrong bucket or a missing permission must not look like "no orders"). The loop then prints each day. The helper error_code(fn, *args) is used by the hidden tests; leave it.', mr: 'काही दुकानं एखादा दिवस चुकवतात. read_orders(bucket, key) पूर्ण करा: text परत द्या, error code NoSuchKey असेल तेव्हाच None द्या, आणि बाकी प्रत्येक error पुन्हा raise करा (चुकीचा bucket किंवा नसलेली परवानगी "orders नाहीत" सारखी दिसता कामा नये). मग loop प्रत्येक दिवस print करतो. error_code(fn, *args) हा helper लपवलेल्या tests वापरतात; तो तसाच ठेवा.' },
          aws: {
            buckets: {
              'chaicart-raw': {
                'orders/2026/11/22/pune.csv': 'order_id,amount\n1001,40\n1002,25\n1003,45\n',
                'orders/2026/11/24/pune.csv': 'order_id,amount\n1101,80\n1102,300\n',
              },
            },
          },
          starter: B1_READ_STARTER,
          solution: B1_READ_SOLUTION,
          output: ['2026/11/22: 3 rows', '2026/11/23: missing', '2026/11/24: 2 rows'],
          checks: [
            { expr: "read_orders('chaicart-raw', 'orders/2030/01/01/pune.csv') is None", message: { en: 'A key that does not exist should give None.', mr: 'अस्तित्वात नसलेल्या key ने None द्यायला हवं.' } },
            { expr: "error_code(read_orders, 'chaicart-archive', 'orders/2026/11/24/pune.csv') == 'NoSuchBucket'", message: { en: 'A bucket that does not exist must not be hidden as None: re-raise errors that are not NoSuchKey (use a bare raise).', mr: 'अस्तित्वात नसलेला bucket None म्हणून लपवू नका: NoSuchKey नसलेले errors पुन्हा raise करा (नुसतं raise).' } },
          ],
          variants: [
            {
              label: { en: 'Another week: the first day missing, one file with only a header', mr: 'दुसरा आठवडा: पहिला दिवस गायब, एका file मध्ये फक्त header' },
              aws: {
                buckets: {
                  'chaicart-raw': {
                    'orders/2026/11/23/pune.csv': 'order_id,amount\n1201,40\n1202,25\n1203,45\n1204,90\n',
                    'orders/2026/11/24/pune.csv': 'order_id,amount\n',
                  },
                },
              },
              output: ['2026/11/22: missing', '2026/11/23: 4 rows', '2026/11/24: 0 rows'],
            },
            {
              label: { en: 'An IAM role that may not read one day', mr: 'एक दिवस वाचायची परवानगी नसलेला IAM role' },
              aws: {
                buckets: { 'chaicart-raw': { 'orders/2026/11/22/pune.csv': 'order_id,amount\n1001,40\n' } },
                deny: ['s3:GetObject@chaicart-raw/orders/2030/*'],
              },
              output: ['2026/11/22: 1 rows', '2026/11/23: missing', '2026/11/24: missing'],
              checks: [
                { expr: "error_code(read_orders, 'chaicart-raw', 'orders/2030/01/01/pune.csv') == 'AccessDenied'", message: { en: 'AccessDenied was swallowed and returned as None. Only NoSuchKey means "missing"; raise the rest.', mr: 'AccessDenied गिळलं गेलं आणि None म्हणून परत आलं. फक्त NoSuchKey म्हणजे "गायब"; बाकी raise करा.' } },
              ],
            },
          ],
          mustUse: [{ pattern: 'except\\s+ClientError', message: { en: 'Catch botocore\'s ClientError (not a bare except) and check its code.', mr: 'botocore चा ClientError पकडा (नुसता except नाही) आणि त्याचा code तपासा.' } }],
          hints: [
            { en: 'Press Run: the starter crashes on 2026/11/23 with NoSuchKey. Wrap the get_object call in try/except ClientError as e.', mr: 'Run दाबा: starter 2026/11/23 ला NoSuchKey ने crash होतो. get_object call try/except ClientError as e मध्ये गुंडाळा.' },
            { en: 'Inside except: if e.response["Error"]["Code"] == "NoSuchKey": return None. Otherwise write just raise, which re-throws the same error.', mr: 'except च्या आत: if e.response["Error"]["Code"] == "NoSuchKey": return None. नाहीतर फक्त raise लिहा, तो तोच error पुन्हा फेकतो.' },
            { en: "    try:\n        obj = s3.get_object(Bucket=bucket, Key=key)\n    except ClientError as e:\n        if e.response['Error']['Code'] == 'NoSuchKey':\n            return None\n        raise\n    return obj['Body'].read().decode('utf-8')", mr: "    try:\n        obj = s3.get_object(Bucket=bucket, Key=key)\n    except ClientError as e:\n        if e.response['Error']['Code'] == 'NoSuchKey':\n            return None\n        raise\n    return obj['Body'].read().decode('utf-8')" },
          ],
          successLine: { en: 'Missing is handled, everything else is loud. That is how a tester writes cloud code.', mr: 'गायब file हाताळली, बाकी सगळं मोठ्याने सांगितलं. tester असा cloud code लिहितो.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'The key does not exist. What does this print?', mr: 'ही key अस्तित्वात नाही. हे काय print करतं?' },
        code: "try:\n    s3.head_object(Bucket='chaicart-raw', Key='orders/2026/11/30/pune.csv')\nexcept ClientError as e:\n    print(e.response['Error']['Code'])",
        options: ['NoSuchKey', 'NoSuchBucket', '404', 'AccessDenied'],
        answer: 2,
        explain: { en: 'HEAD responses have no body, so there is no XML error code to read: boto3 reports the HTTP status, "404". get_object on the same key would say NoSuchKey. (If the caller lacked s3:ListBucket, S3 would answer 403 instead, to avoid revealing whether the key exists.)', mr: 'HEAD response ला body नसते, म्हणून वाचायला XML error code नसतो: boto3 HTTP status सांगतो, "404". त्याच key वर get_object ने NoSuchKey येईल. (caller कडे s3:ListBucket नसेल तर key आहे की नाही हे उघड न करण्यासाठी S3 त्याऐवजी 403 देतो.)' },
      },
      {
        q: { en: 'ChaiCart wants to keep years of daily order files that Athena and Lambda will read, and many tools must read them at the same time. Which storage fits?', mr: 'ChaiCart ला वर्षानुवर्षांच्या रोजच्या order files ठेवायच्या आहेत, ज्या Athena आणि Lambda वाचतील, आणि अनेक tools एकाच वेळी वाचतील. कोणतं storage योग्य?' },
        options: [
          { en: 'Amazon S3 (object storage): unlimited objects, very high durability, read over an API by any service', mr: 'Amazon S3 (object storage): अमर्यादित objects, खूप जास्त durability, कोणतीही service API ने वाचू शकते' },
          { en: 'An EBS volume attached to one EC2 server', mr: 'एका EC2 server ला जोडलेला EBS volume' },
          { en: 'The laptop\'s disk with a weekly pen-drive backup', mr: 'laptop ची disk आणि दर आठवड्याला pen-drive backup' },
          { en: 'An EFS file system, because S3 cannot store CSV files', mr: 'EFS file system, कारण S3 मध्ये CSV files ठेवता येत नाहीत' },
        ],
        answer: 0,
        explain: { en: 'EBS is a block disk for one instance in one AZ (only io1/io2 Multi-Attach can share it). EFS is a shared file system for servers that need POSIX folders. For a data lake read by Athena, Glue and Lambda, S3 is the standard: any file type, pay per GB, 11 nines durability.', mr: 'EBS म्हणजे एका AZ मधल्या एका instance साठी block disk (फक्त io1/io2 Multi-Attach ती share करू शकतं). EFS म्हणजे POSIX folders लागणाऱ्या servers साठी shared file system. Athena, Glue आणि Lambda वाचणाऱ्या data lake साठी S3 हेच standard: कोणताही file प्रकार, प्रति GB पैसे, 11 nines durability.' },
      },
      {
        q: { en: 'Which bucket name is valid?', mr: 'कोणतं bucket नाव वैध आहे?' },
        options: ['ChaiCart-Raw', 'chaicart_raw_2026', 'chaicart..raw', 'chaicart-raw-ap-south-1-2026'],
        answer: 3,
        explain: { en: 'Only lowercase letters, numbers, dots and hyphens; start and end with a letter or number; no two adjacent dots; 3 to 63 characters. Capitals and underscores are invalid, and so is "..".', mr: 'फक्त lowercase अक्षरं, अंक, dots आणि hyphens; सुरुवात आणि शेवट अक्षर किंवा अंकाने; सलग दोन dots नाहीत; 3 ते 63 अक्षरं. capitals आणि underscores अवैध, आणि ".." सुद्धा.' },
      },
      {
        q: { en: 'S3 Standard is designed for 99.999999999% durability and 99.99% availability. What does the durability number promise?', mr: 'S3 Standard 99.999999999% durability आणि 99.99% availability साठी design केलेलं आहे. durability चा आकडा कशाचं वचन देतो?' },
        options: [
          { en: 'That every request succeeds in under 100 ms', mr: 'की प्रत्येक request 100 ms च्या आत यशस्वी होईल' },
          { en: 'That a stored object is extremely unlikely to be lost, because S3 keeps redundant copies across at least three AZs and repairs lost copies', mr: 'की ठेवलेला object हरवण्याची शक्यता अत्यंत कमी आहे, कारण S3 किमान तीन AZs मध्ये जास्तीच्या प्रती ठेवतो आणि हरवलेल्या प्रती दुरुस्त करतो' },
          { en: 'That you can always reach the bucket, even during an outage', mr: 'की outage मध्येसुद्धा bucket कायम उपलब्ध असेल' },
          { en: 'That deleted objects can always be recovered', mr: 'की delete केलेले objects कायम परत मिळतील' },
        ],
        answer: 1,
        explain: { en: 'Durability is about not losing data; availability is about being able to reach it right now. A deliberate delete is not a durability event: protecting against mistakes is the job of versioning (coming in B1.5).', mr: 'durability म्हणजे data न हरवणं; availability म्हणजे तो आत्ता मिळू शकणं. जाणूनबुजून केलेला delete हा durability चा प्रश्न नाही: चुकांपासून संरक्षण हे versioning चं काम (B1.5 मध्ये येईल).' },
      },
    ],
    recap: { line: { en: 'Region + bucket + key = one object. create_bucket needs a LocationConstraint, names are global, and ClientError codes tell missing (NoSuchKey, 404) from forbidden (AccessDenied).', mr: 'Region + bucket + key = एक object. create_bucket ला LocationConstraint लागतो, नावं global असतात, आणि ClientError codes गायब (NoSuchKey, 404) आणि मनाई (AccessDenied) यातला फरक सांगतात.' }, icon: '🪣' },
    interview: [
      {
        q: { en: 'What is Amazon S3, and when would you choose it over EBS or EFS?', mr: 'Amazon S3 म्हणजे काय, आणि EBS किंवा EFS ऐवजी तुम्ही ते केव्हा निवडाल?' },
        a: { en: 'S3 is AWS\'s object storage: you store whole files as objects in buckets and reach them over an HTTP API, with no limit on the number of objects. EBS is block storage, a virtual disk attached to one EC2 instance in one AZ, good for databases and boot volumes. EFS is a managed NFS file system that many servers mount at the same time. For a data lake I choose S3, because Athena, Glue, Spark and Lambda all read it directly, it is cheap per GB, and it is designed for 11 nines of durability. At ChaiCart the daily order files from 40 shops go to S3; a Postgres server would sit on EBS. The gotcha: S3 objects cannot be edited in place, so it is not a disk for a database.', mr: 'S3 हे AWS चं object storage आहे: पूर्ण files objects म्हणून buckets मध्ये ठेवायच्या आणि HTTP API ने वापरायच्या, objects च्या संख्येला मर्यादा नाही. EBS हे block storage, म्हणजे एका AZ मधल्या एका EC2 instance ला जोडलेली virtual disk, databases आणि boot volumes साठी चांगली. EFS ही managed NFS file system, जी अनेक servers एकाच वेळी mount करतात. data lake साठी मी S3 निवडेन, कारण Athena, Glue, Spark आणि Lambda थेट ते वाचतात, प्रति GB स्वस्त आहे, आणि 11 nines durability साठी design केलेलं आहे. ChaiCart मध्ये 40 दुकानांच्या रोजच्या order files S3 मध्ये जातात; Postgres server EBS वर असेल. गोम: S3 objects जागेवर edit करता येत नाहीत, म्हणून database साठी ती disk नाही.' },
      },
      {
        q: { en: 'What is the difference between durability and availability in S3?', mr: 'S3 मध्ये durability आणि availability यात फरक काय?' },
        a: { en: 'Durability is the chance your data survives; availability is the chance you can reach it at a given moment. S3 Standard is designed for 99.999999999% durability and 99.99% availability, with a 99.9% availability SLA. Durability comes from storing objects redundantly across at least three Availability Zones and repairing lost copies with checksums. So during a rare outage an order file might be briefly unreachable, but it is not lost. One Zone-IA keeps data in a single AZ, so losing that AZ can lose the data. And durability does not protect against my own delete: that needs versioning or backups.', mr: 'durability म्हणजे data टिकण्याची शक्यता; availability म्हणजे एखाद्या क्षणी तो मिळण्याची शक्यता. S3 Standard 99.999999999% durability आणि 99.99% availability साठी design केलेलं आहे, आणि त्याचा availability SLA 99.9% आहे. durability येते objects किमान तीन Availability Zones मध्ये जास्तीच्या प्रतींसह ठेवल्याने आणि checksums ने हरवलेल्या प्रती दुरुस्त केल्याने. म्हणून क्वचित outage मध्ये order file थोडा वेळ मिळणार नाही, पण ती हरवत नाही. One Zone-IA एकाच AZ मध्ये data ठेवतं, म्हणून तो AZ गेला तर data जाऊ शकतो. आणि durability माझ्या स्वतःच्या delete पासून वाचवत नाही: त्यासाठी versioning किंवा backups लागतात.' },
      },
      {
        q: { en: 'What are the S3 bucket naming rules, and why must names be globally unique?', mr: 'S3 bucket नावांचे नियम कोणते, आणि नावं globally unique का असावी लागतात?' },
        a: { en: 'A general purpose bucket name is 3 to 63 characters of lowercase letters, numbers, dots and hyphens, starts and ends with a letter or number, has no two adjacent dots, and is not formatted like an IP address; a few prefixes and suffixes like xn-- and -s3alias are reserved. Names live in one shared namespace across all accounts in a partition, because the bucket name is part of the URL, like chaicart-raw.s3.ap-south-1.amazonaws.com. That is why "chaicart" returns BucketAlreadyExists. I add something unique, such as the account ID and Region, and avoid dots because they cause TLS and Transfer Acceleration problems. You cannot rename a bucket or move its Region, and once a bucket is deleted another account may take the name, so AWS advises emptying it rather than deleting it. Newer: an account regional namespace with names ending in -an that only your account can create.', mr: 'general purpose bucket चं नाव 3 ते 63 अक्षरांचं, lowercase अक्षरं, अंक, dots आणि hyphens, सुरुवात आणि शेवट अक्षर किंवा अंकाने, सलग दोन dots नाहीत, आणि IP address सारखं नाही; xn-- आणि -s3alias सारखे काही prefixes आणि suffixes राखीव आहेत. partition मधल्या सगळ्या accounts चा एकच namespace असतो, कारण bucket चं नाव URL चा भाग असतं, उदा. chaicart-raw.s3.ap-south-1.amazonaws.com. म्हणूनच "chaicart" ला BucketAlreadyExists येतं. मी account ID आणि Region सारखं unique काहीतरी जोडते, आणि dots टाळते कारण त्यांनी TLS आणि Transfer Acceleration चे प्रश्न येतात. bucket चं नाव बदलता येत नाही आणि Region हलवता येत नाही, आणि bucket delete केल्यावर दुसरं account ते नाव घेऊ शकतं, म्हणून AWS तो delete करण्याऐवजी रिकामा करायचा सल्ला देतं. नवीन: -an ने संपणारं account regional namespace, ज्यात फक्त तुमचं account bucket बनवू शकतं.' },
      },
      {
        q: { en: 'How do you choose the Region for a bucket?', mr: 'bucket साठी Region कसा निवडता?' },
        a: { en: 'I choose it once and carefully, because a bucket can never change Region. First, latency and data transfer: keep the bucket next to the compute that reads it, like Lambda and Athena in the same Region, since cross-Region traffic is slower and costs extra. Second, data residency and compliance: Indian customer data may need to stay in India, so ap-south-1 Mumbai (or ap-south-2 Hyderabad). Third, price and service availability differ a little between Regions. For ChaiCart everything runs in ap-south-1. In boto3, any Region except us-east-1 needs CreateBucketConfiguration with the LocationConstraint, otherwise you get IllegalLocationConstraintException.', mr: 'मी तो एकदाच आणि काळजीपूर्वक निवडते, कारण bucket चा Region कधीच बदलता येत नाही. पहिलं, latency आणि data transfer: bucket त्याला वाचणाऱ्या compute जवळ ठेवा, उदा. Lambda आणि Athena त्याच Region मध्ये, कारण cross-Region traffic हळू आणि जास्त खर्चाचा असतो. दुसरं, data residency आणि compliance: भारतीय ग्राहकांचा data भारतातच ठेवावा लागू शकतो, म्हणून ap-south-1 Mumbai (किंवा ap-south-2 Hyderabad). तिसरं, Regions मध्ये किंमत आणि services थोड्या वेगळ्या असतात. ChaiCart चं सगळं ap-south-1 मध्ये चालतं. boto3 मध्ये us-east-1 सोडून कोणत्याही Region ला LocationConstraint सह CreateBucketConfiguration लागतं, नाहीतर IllegalLocationConstraintException येतो.' },
      },
      {
        q: { en: 'Is S3 strongly consistent? Why does it matter for a pipeline?', mr: 'S3 strongly consistent आहे का? pipeline साठी ते का महत्त्वाचं?' },
        a: { en: 'Yes. Since December 2020 S3 gives strong read-after-write consistency for PUTs and DELETEs of objects in all Regions, and LIST results reflect the change immediately, at no extra cost. So if my ingestion job writes orders/2026/11/24/pune.csv and the next step lists that prefix, the new file is there, and an overwrite is never read as the old version afterwards. Before 2020, pipelines needed workarounds for listings that lagged behind. One thing it does not give you is locking: two writers to the same key still race, and the last write wins. For "create only if absent" S3 now supports conditional writes with If-None-Match, which fail with 412 Precondition Failed if the key exists.', mr: 'हो. December 2020 पासून S3 सगळ्या Regions मध्ये objects च्या PUT आणि DELETE साठी strong read-after-write consistency देतं, आणि LIST results मध्ये बदल लगेच दिसतो, जास्तीचा खर्च नाही. म्हणून माझ्या ingestion job ने orders/2026/11/24/pune.csv लिहिली आणि पुढच्या पायरीने तो prefix list केला, तर नवी file तिथे असते, आणि overwrite नंतर जुनी version कधीच वाचली जात नाही. 2020 आधी मागे पडणाऱ्या listings साठी pipelines ना workarounds लागायचे. एक गोष्ट ते देत नाही, ती म्हणजे locking: एकाच key वर दोन writers अजूनही शर्यत करतात, आणि शेवटचा write जिंकतो. "नसेल तरच बनव" साठी S3 आता If-None-Match सह conditional writes देतं, key असेल तर ते 412 Precondition Failed ने अपयशी होतात.' },
      },
      {
        q: { en: 'What are the size limits for S3 objects and uploads?', mr: 'S3 objects आणि uploads च्या size मर्यादा काय?' },
        a: { en: 'A single object can now be up to 50 TB (the limit was raised from 5 TB in December 2025). One PUT request uploads at most 5 GB, so bigger files need multipart upload: up to 10,000 parts, each 5 MiB to 5 GiB except the last, uploaded in parallel and retried part by part. AWS suggests considering multipart from about 100 MB. CopyObject copies up to 5 GB in one atomic call; larger copies use UploadPartCopy. In Python, upload_file and download_file switch to multipart automatically above a threshold you can tune with TransferConfig. ChaiCart\'s order CSVs are kilobytes, so put_object is fine, but a year of app logs exported in one file would need multipart.', mr: 'एक object आता 50 TB पर्यंत असू शकतो (December 2025 मध्ये मर्यादा 5 TB वरून वाढली). एक PUT request जास्तीत जास्त 5 GB upload करतो, म्हणून मोठ्या files ना multipart upload लागतं: 10,000 parts पर्यंत, शेवटचा सोडून प्रत्येक 5 MiB ते 5 GiB, parallel upload होतात आणि प्रत्येक part वेगळा retry होतो. AWS साधारण 100 MB पासून multipart चा विचार करायला सांगतं. CopyObject एका atomic call मध्ये 5 GB पर्यंत copy करतो; त्यापेक्षा मोठ्यासाठी UploadPartCopy. Python मध्ये upload_file आणि download_file एका threshold नंतर आपोआप multipart वापरतात, तो TransferConfig ने बदलता येतो. ChaiCart च्या order CSVs काही KB च्या आहेत, म्हणून put_object पुरे, पण वर्षभराचे app logs एकाच file मध्ये export केले तर multipart लागेल.' },
      },
      {
        q: { en: 'Your code reads a key that you believe is missing, but it gets AccessDenied (403) instead of NoSuchKey. Why?', mr: 'तुम्हाला वाटतं ती key नाही, पण तुमच्या code ला NoSuchKey ऐवजी AccessDenied (403) मिळतो. का?' },
        a: { en: 'If the caller lacks s3:ListBucket on the bucket, S3 answers 403 Access Denied for a missing key instead of 404, so it does not reveal which keys exist. So first I check whether the object really exists, then the permissions: the IAM role needs s3:GetObject on arn:aws:s3:::bucket/* and, to see 404s, s3:ListBucket on arn:aws:s3:::bucket itself (the bucket ARN, not /*). Then I look for an explicit Deny in the bucket policy or an SCP, because an explicit deny always wins, and for KMS key permissions if the object uses SSE-KMS. At ChaiCart, a Lambda role with GetObject but no ListBucket made missing days look like permission errors until we added ListBucket. In the lab, a deny list simulates missing IAM permissions; real IAM evaluates identity and resource policies together.', mr: 'caller कडे bucket वर s3:ListBucket नसेल तर S3 नसलेल्या key साठी 404 ऐवजी 403 Access Denied देतं, म्हणजे कोणत्या keys आहेत हे उघड होत नाही. म्हणून आधी मी object खरंच आहे का ते तपासते, मग परवानग्या: IAM role ला arn:aws:s3:::bucket/* वर s3:GetObject लागतो आणि 404 दिसण्यासाठी arn:aws:s3:::bucket वरच s3:ListBucket (bucket ARN, /* नाही). मग bucket policy किंवा SCP मध्ये explicit Deny आहे का ते पाहते, कारण explicit deny नेहमी जिंकतो, आणि object SSE-KMS वापरत असेल तर KMS key च्या परवानग्या. ChaiCart मध्ये GetObject असलेल्या पण ListBucket नसलेल्या Lambda role मुळे गायब दिवस permission errors सारखे दिसत होते, ListBucket जोडेपर्यंत. lab मध्ये deny list नसलेल्या IAM परवानग्यांचं simulation करते; खरा IAM identity आणि resource policies एकत्र तपासतो.' },
      },
      {
        q: { en: 'How do you handle errors from boto3 S3 calls?', mr: 'boto3 S3 calls मधले errors कसे हाताळता?' },
        a: { en: 'Service errors arrive as botocore.exceptions.ClientError, and I branch on e.response["Error"]["Code"], never on the message text. I handle only the codes I expect, for example NoSuchKey means "this shop sent no file today", and re-raise everything else, so AccessDenied or NoSuchBucket fail loudly instead of becoming zero orders. head_object is special: a HEAD has no body, so a missing key shows up as code "404". Wrong arguments raise ParamValidationError before any request is sent. boto3 also retries throttling and 5xx errors on its own, so my code should not wrap every call in a blind retry loop. A bare except Exception that returns None is the classic bug: the pipeline reports a quiet, wrong success.', mr: 'service errors botocore.exceptions.ClientError म्हणून येतात, आणि मी e.response["Error"]["Code"] वर निर्णय घेते, message text वर कधीच नाही. मी फक्त अपेक्षित codes हाताळते, उदा. NoSuchKey म्हणजे "या दुकानाने आज file पाठवली नाही", आणि बाकी सगळं पुन्हा raise करते, म्हणजे AccessDenied किंवा NoSuchBucket शून्य orders बनण्याऐवजी मोठ्याने अपयशी होतात. head_object वेगळा आहे: HEAD ला body नसते, म्हणून नसलेली key code "404" म्हणून दिसते. चुकीचे arguments कोणतीही request जाण्याआधीच ParamValidationError देतात. boto3 throttling आणि 5xx errors स्वतःच retry करतो, म्हणून माझ्या code ने प्रत्येक call भोवती आंधळा retry loop लावू नये. None परत देणारा नुसता except Exception हा classic bug आहे: pipeline शांत, चुकीचं यश सांगते.' },
      },
    ],
  },

  // ───────────────────────── B1.2 Keys, prefixes and listing
  {
    id: 'lk1-2',
    code: 'B1.2',
    level: 'basic',
    title: { en: 'Keys, prefixes and listing', mr: 'Keys, prefixes आणि listing' },
    skill: 'prefixes as folders, list_objects_v2 with Prefix/Delimiter/CommonPrefixes, the 1,000-key page and paginators, missing Contents, StartAfter, copy + delete as rename, upload_file/download_file, resource vs client API, request rates per prefix',
    realLife: {
      place: 'postoffice',
      title: { en: 'One giant sorting bin at the head post office', mr: 'मुख्य पोस्ट ऑफिसमधला एक प्रचंड sorting bin' },
      story: {
        en: 'At the Pune head post office, Meera watches a new sorting system. There are no shelves and no rooms. Every letter lies in one giant bin, and its full address is written on it like a path: Maharashtra/Pune/Kothrud/Joshi. When the Kothrud postman asks for "everything starting with Maharashtra/Pune/Kothrud/", the machine hands him exactly those letters. When the supervisor asks "which areas of Pune have mail today?", it reads the addresses up to the next slash and answers Aundh, Hadapsar, Kothrud, without carrying a single letter. Bundles go out 1,000 letters at a time, with a slip saying "more to come". And a letter cannot be readdressed: to send it elsewhere, the clerk writes a fresh copy with the new address and then throws the old one away.',
        mr: 'पुण्याच्या मुख्य पोस्ट ऑफिसमध्ये मीरा एक नवी sorting पद्धत पाहते. तिथे कपाटं नाहीत, खोल्या नाहीत. प्रत्येक पत्र एकाच प्रचंड bin मध्ये असतं, आणि त्याचा पूर्ण पत्ता path सारखा लिहिलेला असतो: Maharashtra/Pune/Kothrud/Joshi. कोथरूडचा पोस्टमन "Maharashtra/Pune/Kothrud/ ने सुरू होणारं सगळं" मागतो, तेव्हा machine त्याला नेमकी तीच पत्रं देतं. supervisor विचारतो "आज पुण्याच्या कोणत्या भागांसाठी पत्रं आहेत?", तेव्हा ते पुढच्या slash पर्यंत पत्ते वाचतं आणि एकही पत्र न उचलता सांगतं: औंध, हडपसर, कोथरूड. गठ्ठे एका वेळी 1,000 पत्रांचे जातात, सोबत "अजून आहेत" अशी चिठ्ठी. आणि पत्राचा पत्ता बदलता येत नाही: ते दुसरीकडे पाठवायचं तर clerk नव्या पत्त्याने नवी प्रत लिहितो आणि मग जुनं फेकून देतो.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Address starts with Maharashtra/Pune/', mr: 'पत्ता Maharashtra/Pune/ ने सुरू होतो' },
        items: [
          { icon: '✉️', label: 'Maharashtra/Pune/Kothrud/Joshi', pass: true },
          { icon: '✉️', label: 'Maharashtra/Nagpur/Sitabuldi/Khan', pass: false },
          { icon: '✉️', label: 'Maharashtra/Pune/Aundh/Shaikh', pass: true },
          { icon: '✉️', label: 'Gujarat/Surat/Adajan/Patel', pass: false },
          { icon: '✉️', label: 'Maharashtra/Pune/Hadapsar/Kale', pass: true },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'The finance team asked how many receipts came in yesterday. Theo\'s script said 1,000. The shops say we had more than 1,200.', mr: 'finance team ने विचारलं काल किती receipts आल्या. Theo च्या script ने 1,000 सांगितल्या. दुकानं म्हणतात 1,200 पेक्षा जास्त होत्या.' } },
        { who: 'theo', mood: 'surprised', text: { en: 'I called list_objects_v2 once and counted. Exactly 1,000 every busy day... that is suspicious, isn\'t it?', mr: 'मी list_objects_v2 एकदाच call करून मोजलं. प्रत्येक गर्दीच्या दिवशी नेमक्या 1,000... हे संशयास्पद आहे ना?' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'page one of many. nobody reads page two. i hide everything on page two. hehe.', mr: 'अनेक पानांपैकी पहिलं पान. दुसरं पान कोणीच वाचत नाही. मी सगळं दुसऱ्या पानावर लपवतो. हेहे.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'S3 hands out at most 1,000 keys per call. We page through with a paginator, we list by prefix, and we never pretend there are real folders. {name}, let us fix the count.', mr: 'S3 एका call मध्ये जास्तीत जास्त 1,000 keys देतं. आपण paginator ने पानं उलटतो, prefix ने list करतो, आणि खरे folders असल्याचं नाटक कधीच करत नाही. {name}, चल count दुरुस्त करू.' } },
        { who: 'meera', mood: 'happy', text: { en: 'A round number like 1,000 is a tester\'s favourite smell. You caught it before finance did.', mr: '1,000 सारखा गोल आकडा म्हणजे tester चा आवडता वास. finance च्या आधी तू तो पकडलास.' } },
      ],
      problem: { en: 'One list call returns at most 1,000 keys, so busy days are undercounted. Scripts also crash on empty days (no "Contents" key), treat "folders" as real, and try to rename files that S3 cannot rename.', mr: 'एक list call जास्तीत जास्त 1,000 keys देतो, म्हणून गर्दीचे दिवस कमी मोजले जातात. scripts रिकाम्या दिवशी crash होतात ("Contents" key नसते), "folders" खरे मानतात, आणि S3 ज्यांचं नाव बदलू शकत नाही अशा files rename करायचा प्रयत्न करतात.' },
      solution: { en: 'List by Prefix, use Delimiter="/" to see the next level as CommonPrefixes, read resp.get("Contents", []), page with get_paginator("list_objects_v2"), move files with copy_object + delete_object, and spread busy writes across prefixes.', mr: 'Prefix ने list करा, पुढची पातळी CommonPrefixes म्हणून पाहायला Delimiter="/" वापरा, resp.get("Contents", []) वाचा, get_paginator("list_objects_v2") ने पानं उलटा, files copy_object + delete_object ने हलवा, आणि गर्दीचे writes अनेक prefixes मध्ये पसरवा.' },
    },
    lesson: [
      { en: 'S3 has no folders. orders/2026/11/24/pune.csv is one key, and "orders/2026/11/24/" is just its prefix, the leading characters. The console draws folders by splitting keys at "/", and "Create folder" only makes an empty object whose key ends in "/". list_objects_v2(Bucket, Prefix="orders/2026/11/24/") returns every key that starts with those characters, in UTF-8 binary order (so "Pune" sorts before "nashik": capitals first). End the prefix with "/": "orders/2026/11/2" would also match day 20 to 29.', mr: 'S3 मध्ये folders नसतात. orders/2026/11/24/pune.csv ही एक key आहे, आणि "orders/2026/11/24/" हा फक्त तिचा prefix, म्हणजे सुरुवातीची अक्षरं. console keys "/" वर तोडून folders काढून दाखवतं, आणि "Create folder" फक्त "/" ने संपणारी key असलेला रिकामा object बनवतं. list_objects_v2(Bucket, Prefix="orders/2026/11/24/") त्या अक्षरांनी सुरू होणारी प्रत्येक key देतो, UTF-8 binary क्रमाने (म्हणून "Pune" "nashik" च्या आधी: capitals आधी). prefix "/" ने संपवा: "orders/2026/11/2" दिवस 20 ते 29 सुद्धा पकडेल.' },
      { en: 'Add Delimiter="/" and S3 rolls up everything after the next "/" into CommonPrefixes, like the supervisor\'s list of areas: list with Prefix="orders/2026/11/" and you get "orders/2026/11/23/", "orders/2026/11/24/" without reading their files. Each call returns at most 1,000 entries (keys plus common prefixes). If IsTruncated is True, the response has a NextContinuationToken to send as ContinuationToken; a paginator does that loop for you. StartAfter="some/key" starts the listing after that key. And when nothing matches, the response has no "Contents" key at all, so resp["Contents"] raises KeyError: always write resp.get("Contents", []).', mr: 'Delimiter="/" जोडला की S3 पुढच्या "/" नंतरचं सगळं CommonPrefixes मध्ये गुंडाळतं, supervisor च्या भागांच्या यादीसारखं: Prefix="orders/2026/11/" ने list केलं तर "orders/2026/11/23/", "orders/2026/11/24/" मिळतात, त्यांच्या files न वाचता. प्रत्येक call जास्तीत जास्त 1,000 entries देतो (keys आणि common prefixes मिळून). IsTruncated True असेल तर response मध्ये NextContinuationToken असतो, तो ContinuationToken म्हणून पाठवायचा; paginator हा loop तुमच्यासाठी करतो. StartAfter="some/key" त्या key नंतरपासून listing सुरू करतो. आणि काहीच जुळलं नाही तर response मध्ये "Contents" key च नसते, म्हणून resp["Contents"] KeyError देतो: नेहमी resp.get("Contents", []) लिहा.' },
      { en: 'There is no rename in a general purpose bucket. To "move" a file you copy_object to the new key and then delete_object the old one (RenameObject exists only for S3 Express One Zone directory buckets). CopyObject handles up to 5 GB in one call; bigger objects need a multipart copy. DeleteObjects removes up to 1,000 keys per request. For local files, upload_file and download_file are managed transfers that switch to multipart for big files. boto3 also has a resource API (boto3.resource("s3"), bucket.objects.filter(Prefix=...)) that pages for you; it is friendly, but AWS adds no new features to it, so the client is the safer default.', mr: 'general purpose bucket मध्ये rename नाही. file "हलवायची" तर नव्या key वर copy_object करा आणि मग जुनी delete_object करा (RenameObject फक्त S3 Express One Zone directory buckets साठी आहे). CopyObject एका call मध्ये 5 GB पर्यंत हाताळतो; त्यापेक्षा मोठ्या objects ना multipart copy लागते. DeleteObjects एका request मध्ये 1,000 keys पर्यंत काढतो. local files साठी upload_file आणि download_file हे managed transfers आहेत, मोठ्या files साठी ते multipart वापरतात. boto3 मध्ये resource API पण आहे (boto3.resource("s3"), bucket.objects.filter(Prefix=...)), तो पानं स्वतः उलटतो; तो सोयीचा आहे, पण AWS त्यात नवीन features जोडत नाही, म्हणून client हाच सुरक्षित default.' },
      { en: 'Prefixes also decide speed. S3 supports at least 3,500 PUT/COPY/POST/DELETE and 11,000 GET/HEAD requests per second per partitioned prefix, and scales up gradually as traffic grows; while it scales you may see 503 Slow Down errors. A "/" in the key does not by itself add capacity: what helps is spreading requests across many prefixes, for example receipts/shop=017/... instead of every shop writing into one receipts/today/ prefix, or a short hash at the start of the key. For ChaiCart\'s 40 shops this is far away, but interviewers love it.', mr: 'prefixes वेगही ठरवतात. S3 प्रत्येक partitioned prefix साठी दर सेकंदाला किमान 3,500 PUT/COPY/POST/DELETE आणि 11,000 GET/HEAD requests देतं, आणि traffic वाढेल तसं हळूहळू scale होतं; scale होत असताना 503 Slow Down errors दिसू शकतात. key मधला "/" स्वतःहून क्षमता वाढवत नाही: मदत होते ती requests अनेक prefixes मध्ये पसरवल्याने, उदा. प्रत्येक दुकानाने एकाच receipts/today/ prefix मध्ये लिहिण्याऐवजी receipts/shop=017/..., किंवा key च्या सुरुवातीला छोटा hash. ChaiCart च्या 40 दुकानांसाठी हे अजून दूर आहे, पण interviewers ना हा प्रश्न खूप आवडतो.' },
    ],
    syntax: {
      template: `resp = s3.list_objects_v2(Bucket='chaicart-raw', Prefix='orders/2026/11/24/')
for obj in resp.get('Contents', []):          # absent when nothing matches
    print(obj['Key'], obj['Size'])

resp = s3.list_objects_v2(Bucket='chaicart-raw', Prefix='orders/2026/11/', Delimiter='/')
days = [p['Prefix'] for p in resp.get('CommonPrefixes', [])]

paginator = s3.get_paginator('list_objects_v2')
for page in paginator.paginate(Bucket='chaicart-receipts', Prefix='receipts/2026/11/24/'):
    for obj in page.get('Contents', []):
        ...

s3.copy_object(Bucket='chaicart-raw', Key=new_key,
               CopySource={'Bucket': 'chaicart-raw', 'Key': old_key})
s3.delete_object(Bucket='chaicart-raw', Key=old_key)

s3.download_file('chaicart-raw', 'orders/2026/11/24/pune.csv', 'local/pune.csv')
s3.upload_file('out/summary.csv', 'chaicart-raw', 'reports/2026/11/24/summary.csv')`,
      parts: [
        { code: "Prefix='orders/2026/11/24/'", means: { en: 'only keys that start with these characters; end it with "/" to stay inside one "folder"', mr: 'फक्त या अक्षरांनी सुरू होणाऱ्या keys; एकाच "folder" मध्ये राहायला शेवटी "/" ठेवा' } },
        { code: "resp.get('Contents', [])", means: { en: 'the listed objects (Key, Size, LastModified, ETag, StorageClass); the key is missing when nothing matched', mr: 'list झालेले objects (Key, Size, LastModified, ETag, StorageClass); काही जुळलं नाही तर ही key नसते' } },
        { code: "Delimiter='/'  ->  CommonPrefixes", means: { en: 'roll up the next level into "folder" names instead of listing every file below', mr: 'खालची प्रत्येक file list करण्याऐवजी पुढची पातळी "folder" नावांमध्ये गुंडाळा' } },
        { code: "get_paginator('list_objects_v2').paginate(...)", means: { en: 'repeats the call with ContinuationToken until IsTruncated is False; each page holds up to 1,000 entries', mr: 'IsTruncated False होईपर्यंत ContinuationToken सह call पुन्हा करतो; प्रत्येक पानात 1,000 पर्यंत entries' } },
        { code: "StartAfter='orders/2026/11/24/m'", means: { en: 'begin the listing after this key (keys are sorted in UTF-8 binary order)', mr: 'या key नंतरपासून listing सुरू करा (keys UTF-8 binary क्रमाने sorted असतात)' } },
        { code: "copy_object(...) + delete_object(...)", means: { en: 'the only "rename" in a general purpose bucket: two calls, not atomic', mr: 'general purpose bucket मधला एकमेव "rename": दोन calls, atomic नाही' } },
      ],
      example: [
        { code: "Prefix='orders/2026/11/24/'", note: { en: 'the Kothrud postman: only letters whose address starts like this', mr: 'कोथरूडचा पोस्टमन: ज्यांचा पत्ता असा सुरू होतो तीच पत्रं' } },
        { code: "Delimiter='/'  # CommonPrefixes: 23/, 24/", note: { en: 'the supervisor\'s list of areas, without carrying any letters', mr: 'supervisor ची भागांची यादी, एकही पत्र न उचलता' } },
        { code: "for page in paginator.paginate(...)", note: { en: 'keep taking bundles while the slip says "more to come"', mr: 'चिठ्ठीवर "अजून आहेत" असेपर्यंत गठ्ठे घेत राहा' } },
        { code: "resp.get('Contents', [])", note: { en: 'a day with no mail is an empty list, not a crash', mr: 'पत्र नसलेला दिवस म्हणजे रिकामी list, crash नाही' } },
        { code: "copy_object(...); delete_object(...)", note: { en: 'write a fresh copy with the new address, then throw the old one away', mr: 'नव्या पत्त्याची नवी प्रत लिहा, मग जुनं फेकून द्या' } },
      ],
      pitfall: { en: 'A single list_objects_v2 call silently stops at 1,000 keys: no error, just a wrong count. Use a paginator (or loop on IsTruncated/NextContinuationToken) whenever a prefix can grow. And when you move files, copy first and delete only after the copy succeeded; delete first and a crash in between loses the file.', mr: 'एकच list_objects_v2 call 1,000 keys वर गुपचूप थांबतो: error नाही, फक्त चुकीचा count. prefix वाढू शकत असेल तेव्हा नेहमी paginator वापरा (किंवा IsTruncated/NextContinuationToken वर loop). आणि files हलवताना आधी copy करा आणि copy यशस्वी झाल्यावरच delete करा; आधी delete केलं आणि मध्येच crash झालं तर file हरवते.' },
    },
    practice: {
      intro: { en: 'The bucket chaicart-raw holds orders, receipts and logs. List it like a data engineer: by prefix, by level, page by page, and move files the S3 way. Hidden buckets include an empty day and more than 2,000 receipts.', mr: 'chaicart-raw bucket मध्ये orders, receipts आणि logs आहेत. data engineer सारखं list करा: prefix ने, पातळीने, पान पान, आणि files S3 च्या पद्धतीने हलवा. लपवलेल्या buckets मध्ये एक रिकामा दिवस आणि 2,000 पेक्षा जास्त receipts आहेत.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'List the orders of 2026-11-24 (PREFIX). For each object print its key and size, then "files: N, bytes: N". A hidden bucket has no files for that day at all, so remember what S3 leaves out of the response when nothing matches.', mr: '2026-11-24 च्या orders list करा (PREFIX). प्रत्येक object ची key आणि size print करा, मग "files: N, bytes: N". एका लपवलेल्या bucket मध्ये त्या दिवसाची एकही file नाही, म्हणून काहीच जुळलं नाही तर S3 response मधून काय वगळतं ते लक्षात ठेवा.' },
          aws: { buckets: { 'chaicart-raw': L2_SEED } },
          starter: `${L2_LIST_HEAD}
resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=PREFIX)
files = 0
total = 0
# TODO: loop over the listed objects: print obj['Key'] and obj['Size'], count files, add up sizes
print(f'files: {files}, bytes: {total}')
`,
          solution: `${L2_LIST_HEAD}
resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=PREFIX)
files = 0
total = 0
for obj in resp.get('Contents', []):
    print(obj['Key'], obj['Size'])
    files += 1
    total += obj['Size']
print(f'files: {files}, bytes: {total}')
`,
          output: ['orders/2026/11/24/mumbai.csv 40', 'orders/2026/11/24/nashik.csv 24', 'orders/2026/11/24/pune.csv 32', 'files: 3, bytes: 96'],
          variants: [
            {
              label: { en: 'A day when no shop uploaded anything', mr: 'एकाही दुकानाने काहीच upload न केलेला दिवस' },
              aws: { buckets: { 'chaicart-raw': L2_SEED_EMPTY_DAY } },
              output: ['files: 0, bytes: 0'],
            },
            {
              label: { en: 'A busier day with a new Thane shop', mr: 'नव्या ठाणे दुकानासह जास्त गर्दीचा दिवस' },
              aws: { buckets: { 'chaicart-raw': L2_SEED_MORE } },
              output: ['orders/2026/11/24/mumbai.csv 24', 'orders/2026/11/24/nashik.csv 32', 'orders/2026/11/24/pune.csv 24', 'orders/2026/11/24/thane.csv 41', 'files: 4, bytes: 121'],
            },
          ],
          mustUse: [{ pattern: "\\.get\\(\\s*['\"]Contents['\"]", message: { en: 'Read the objects with resp.get("Contents", []): the key is missing when no object matches.', mr: 'objects resp.get("Contents", []) ने वाचा: एकही object जुळला नाही तर ही key नसते.' } }],
          hints: [
            { en: 'resp is a dict. Print it once to see its shape: the objects are a list under "Contents", each a dict with "Key" and "Size".', mr: 'resp ही dict आहे. तिचा आकार पाहायला एकदा print करा: objects "Contents" खाली list म्हणून असतात, प्रत्येक "Key" आणि "Size" असलेली dict.' },
            { en: 'On the empty day "Contents" is not in the response at all, so resp["Contents"] is a KeyError. resp.get("Contents", []) gives an empty list instead.', mr: 'रिकाम्या दिवशी response मध्ये "Contents" नसतेच, म्हणून resp["Contents"] म्हणजे KeyError. resp.get("Contents", []) त्याऐवजी रिकामी list देतो.' },
            { en: "for obj in resp.get('Contents', []):\n    print(obj['Key'], obj['Size'])\n    files += 1\n    total += obj['Size']", mr: "for obj in resp.get('Contents', []):\n    print(obj['Key'], obj['Size'])\n    files += 1\n    total += obj['Size']" },
          ],
          successLine: { en: 'Three files today, zero on a quiet day, and no KeyError either way.', mr: 'आज तीन files, शांत दिवशी शून्य, आणि दोन्ही वेळा KeyError नाही.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Write folders(prefix): it returns the "sub-folders" right below prefix as a list of strings, using Delimiter="/" and CommonPrefixes. The program prints the top level and the days of November 2026. Hidden tests call folders with other prefixes (a prefix with only files below it must give []).', mr: 'folders(prefix) लिहा: तो prefix च्या लगेच खालचे "sub-folders" strings ची list म्हणून देतो, Delimiter="/" आणि CommonPrefixes वापरून. program सगळ्यात वरची पातळी आणि November 2026 चे दिवस print करतो. लपवलेल्या tests folders ला इतर prefixes देतात (ज्याच्या खाली फक्त files आहेत अशा prefix ने [] द्यायला हवं).' },
          aws: { buckets: { 'chaicart-raw': L2_SEED } },
          starter: `${L2_FOLDERS_HEAD}
def folders(prefix):
    # TODO: list_objects_v2 with Prefix=prefix and Delimiter='/'
    #       return [p['Prefix'] for each entry in CommonPrefixes] (careful: it may be missing)
    return []

print(folders(''))
print(folders('orders/2026/11/'))
`,
          solution: `${L2_FOLDERS_HEAD}
def folders(prefix):
    resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix, Delimiter='/')
    return [p['Prefix'] for p in resp.get('CommonPrefixes', [])]

print(folders(''))
print(folders('orders/2026/11/'))
`,
          output: ["['logs/', 'orders/', 'receipts/']", "['orders/2026/11/23/', 'orders/2026/11/24/']"],
          checks: [
            { expr: "folders('logs/') == ['logs/app/']", message: { en: 'folders("logs/") should give ["logs/app/"].', mr: 'folders("logs/") ने ["logs/app/"] द्यायला हवं.' } },
            { expr: "folders('orders/2026/11/24/') == []", message: { en: 'A prefix with only files below it has no CommonPrefixes: return [] (use .get("CommonPrefixes", [])).', mr: 'ज्या prefix खाली फक्त files आहेत त्याला CommonPrefixes नसतात: [] परत द्या (.get("CommonPrefixes", []) वापरा).' } },
          ],
          variants: [
            {
              label: { en: 'Another month: refunds arrive and a new day starts', mr: 'दुसरा महिना: refunds येतात आणि नवा दिवस सुरू होतो' },
              aws: { buckets: { 'chaicart-raw': L2_SEED_MORE } },
              output: ["['logs/', 'orders/', 'refunds/']", "['orders/2026/11/24/', 'orders/2026/11/25/']"],
              checks: [
                { expr: "folders('logs/') == ['logs/app/', 'logs/lambda/']", message: { en: 'On the hidden bucket, folders("logs/") should give ["logs/app/", "logs/lambda/"].', mr: 'लपवलेल्या bucket वर folders("logs/") ने ["logs/app/", "logs/lambda/"] द्यायला हवं.' } },
              ],
            },
          ],
          mustUse: [{ pattern: 'Delimiter', message: { en: 'Pass Delimiter="/" so S3 rolls the next level up into CommonPrefixes.', mr: 'Delimiter="/" द्या, म्हणजे S3 पुढची पातळी CommonPrefixes मध्ये गुंडाळेल.' } }],
          hints: [
            { en: 'With a Delimiter, S3 puts the "folders" in resp["CommonPrefixes"], a list of dicts like {"Prefix": "orders/"}.', mr: 'Delimiter दिला की S3 "folders" resp["CommonPrefixes"] मध्ये ठेवतं, {"Prefix": "orders/"} सारख्या dicts ची list.' },
            { en: 'Like Contents, CommonPrefixes is missing when there are none. Use resp.get("CommonPrefixes", []).', mr: 'Contents सारखंच, CommonPrefixes नसतील तर ती key नसते. resp.get("CommonPrefixes", []) वापरा.' },
            { en: "    resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix, Delimiter='/')\n    return [p['Prefix'] for p in resp.get('CommonPrefixes', [])]", mr: "    resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix, Delimiter='/')\n    return [p['Prefix'] for p in resp.get('CommonPrefixes', [])]" },
          ],
          successLine: { en: 'You can walk the "folder" tree without downloading a single file.', mr: 'एकही file download न करता तुम्ही "folder" tree मध्ये फिरू शकता.' },
        },
        {
          kind: 'python',
          prompt: { en: 'The finance question: how many receipts arrived on 2026-11-24? Press Run: the starter makes one list call and says 1000. Count them all with get_paginator("list_objects_v2"), and count the pages too. Print "receipts on 2026-11-24: N in P pages". A hidden bucket has more than 2,000 receipts.', mr: 'finance चा प्रश्न: 2026-11-24 ला किती receipts आल्या? Run दाबा: starter एकच list call करतो आणि 1000 सांगतो. get_paginator("list_objects_v2") ने सगळ्या मोजा, आणि पानंही मोजा. "receipts on 2026-11-24: N in P pages" print करा. एका लपवलेल्या bucket मध्ये 2,000 पेक्षा जास्त receipts आहेत.' },
          aws: { buckets: { 'chaicart-receipts': { ...receipts('23', 300), ...receipts('24', 1250) } } },
          starter: `${L2_PAGE_HEAD}
resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=PREFIX)
count = len(resp.get('Contents', []))
pages = 1
# TODO: use s3.get_paginator('list_objects_v2') and add up every page
print(f'receipts on 2026-11-24: {count} in {pages} pages')
`,
          solution: `${L2_PAGE_HEAD}
count = 0
pages = 0
paginator = s3.get_paginator('list_objects_v2')
for page in paginator.paginate(Bucket=BUCKET, Prefix=PREFIX):
    pages += 1
    count += len(page.get('Contents', []))
print(f'receipts on 2026-11-24: {count} in {pages} pages')
`,
          output: ['receipts on 2026-11-24: 1250 in 2 pages'],
          checks: [
            { expr: "len([c for c in api_calls if c.startswith('ListObjectsV2')]) >= 2", message: { en: 'One ListObjectsV2 call can never return more than 1,000 keys. Page through them.', mr: 'एक ListObjectsV2 call कधीच 1,000 पेक्षा जास्त keys देत नाही. पानं उलटा.' } },
          ],
          variants: [
            {
              label: { en: 'Diwali week: 2,003 receipts in one day', mr: 'दिवाळीचा आठवडा: एका दिवसात 2,003 receipts' },
              aws: { buckets: { 'chaicart-receipts': { ...receipts('23', 10), ...receipts('24', 2003) } } },
              output: ['receipts on 2026-11-24: 2003 in 3 pages'],
            },
          ],
          mustUse: [{ pattern: 'get_paginator|ContinuationToken', message: { en: 'Use a paginator (or a loop on NextContinuationToken) to read every page.', mr: 'प्रत्येक पान वाचायला paginator वापरा (किंवा NextContinuationToken वर loop).' } }],
          hints: [
            { en: 'Look at the starter\'s resp: IsTruncated is True and there is a NextContinuationToken. That is S3 saying "more to come".', mr: 'starter चा resp पाहा: IsTruncated True आहे आणि NextContinuationToken आहे. म्हणजे S3 सांगतंय "अजून आहेत".' },
            { en: 'paginator = s3.get_paginator("list_objects_v2"); for page in paginator.paginate(Bucket=BUCKET, Prefix=PREFIX): each page is one response dict. Add 1 to pages and len(page.get("Contents", [])) to count.', mr: 'paginator = s3.get_paginator("list_objects_v2"); for page in paginator.paginate(Bucket=BUCKET, Prefix=PREFIX): प्रत्येक page म्हणजे एक response dict. pages मध्ये 1 आणि count मध्ये len(page.get("Contents", [])) वाढवा.' },
            { en: "count = 0\npages = 0\nfor page in s3.get_paginator('list_objects_v2').paginate(Bucket=BUCKET, Prefix=PREFIX):\n    pages += 1\n    count += len(page.get('Contents', []))", mr: "count = 0\npages = 0\nfor page in s3.get_paginator('list_objects_v2').paginate(Bucket=BUCKET, Prefix=PREFIX):\n    pages += 1\n    count += len(page.get('Contents', []))" },
          ],
          successLine: { en: '1,250, not 1,000. Finance gets the real number, and the Gremlin\'s page two is read.', mr: '1,000 नाही, 1,250. finance ला खरा आकडा मिळतो, आणि Gremlin चं दुसरं पान वाचलं गेलं.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Shops drop files into incoming/ with messy names like "Pune Orders.csv". target_key(old_key) gives the clean new key. Move every file: copy_object to the new key, then delete_object the old one (copy first, delete second). The program prints each move and then how many files are left in incoming/ (it must be 0). Hidden files test other names.', mr: 'दुकानं "Pune Orders.csv" सारख्या गोंधळलेल्या नावांनी files incoming/ मध्ये टाकतात. target_key(old_key) नवी साफ key देतो. प्रत्येक file हलवा: नव्या key वर copy_object, मग जुन्या key वर delete_object (आधी copy, नंतर delete). program प्रत्येक हलवणं print करतो आणि मग incoming/ मध्ये किती files उरल्या ते (ते 0 हवं). लपवलेल्या files इतर नावं तपासतात.' },
          aws: {
            buckets: {
              'chaicart-raw': {
                'incoming/Pune Orders.csv': 'order_id,amount\n1004,30\n1005,20\n',
                'incoming/NAGPUR orders.csv': 'order_id,amount\n2003,55\n',
                'orders/2026/11/24/mumbai.csv': 'order_id,amount\n3001,80\n',
              },
            },
          },
          starter: `${L2_MOVE_HEAD}
resp = s3.list_objects_v2(Bucket=BUCKET, Prefix='incoming/')
for obj in resp.get('Contents', []):
    old = obj['Key']
    new = target_key(old)
    # TODO: S3 has no rename. Copy old -> new with copy_object, then delete old with delete_object
    print('moved', old, '->', new)
${L2_MOVE_TAIL}`,
          solution: `${L2_MOVE_HEAD}
resp = s3.list_objects_v2(Bucket=BUCKET, Prefix='incoming/')
for obj in resp.get('Contents', []):
    old = obj['Key']
    new = target_key(old)
    s3.copy_object(Bucket=BUCKET, Key=new, CopySource={'Bucket': BUCKET, 'Key': old})
    s3.delete_object(Bucket=BUCKET, Key=old)
    print('moved', old, '->', new)
${L2_MOVE_TAIL}`,
          output: ['moved incoming/NAGPUR orders.csv -> orders/2026/11/24/nagpur-orders.csv', 'moved incoming/Pune Orders.csv -> orders/2026/11/24/pune-orders.csv', 'incoming left: 0'],
          checks: [
            { expr: "s3_text('chaicart-raw', 'orders/2026/11/24/pune-orders.csv').splitlines() == ['order_id,amount', '1004,30', '1005,20']", message: { en: 'orders/2026/11/24/pune-orders.csv should hold exactly what "incoming/Pune Orders.csv" held. Copy with CopySource={"Bucket": BUCKET, "Key": old}.', mr: 'orders/2026/11/24/pune-orders.csv मध्ये "incoming/Pune Orders.csv" मध्ये होतं तेच हवं. CopySource={"Bucket": BUCKET, "Key": old} ने copy करा.' } },
            { expr: "s3_keys('chaicart-raw', 'orders/') == ['orders/2026/11/24/mumbai.csv', 'orders/2026/11/24/nagpur-orders.csv', 'orders/2026/11/24/pune-orders.csv']", message: { en: 'After the move, orders/2026/11/24/ should hold mumbai.csv, nagpur-orders.csv and pune-orders.csv.', mr: 'हलवल्यानंतर orders/2026/11/24/ मध्ये mumbai.csv, nagpur-orders.csv आणि pune-orders.csv हव्यात.' } },
          ],
          variants: [
            {
              label: { en: 'Another night: three files, one with a number in its name', mr: 'दुसरी रात्र: तीन files, एकीच्या नावात आकडा' },
              aws: {
                buckets: {
                  'chaicart-raw': {
                    'incoming/Pune Orders.csv': 'order_id,amount\n1006,90\n',
                    'incoming/Thane Orders 2.csv': 'order_id,amount\n5004,60\n5005,35\n',
                    'incoming/nashik.csv': 'order_id,amount\n4002,40\n',
                  },
                },
              },
              output: ['moved incoming/Pune Orders.csv -> orders/2026/11/24/pune-orders.csv', 'moved incoming/Thane Orders 2.csv -> orders/2026/11/24/thane-orders-2.csv', 'moved incoming/nashik.csv -> orders/2026/11/24/nashik.csv', 'incoming left: 0'],
              checks: [
                { expr: "s3_text('chaicart-raw', 'orders/2026/11/24/thane-orders-2.csv').splitlines() == ['order_id,amount', '5004,60', '5005,35']", message: { en: 'The Thane file lost its content on the way. Copy before you delete.', mr: 'ठाण्याच्या file चा मजकूर वाटेत हरवला. delete करण्याआधी copy करा.' } },
              ],
            },
          ],
          mustUse: [
            { pattern: 'copy_object\\(', message: { en: 'Copy each file with s3.copy_object.', mr: 'प्रत्येक file s3.copy_object ने copy करा.' } },
            { pattern: 'delete_object\\(', message: { en: 'Then remove the old key with s3.delete_object.', mr: 'मग जुनी key s3.delete_object ने काढा.' } },
          ],
          hints: [
            { en: 'copy_object needs the destination (Bucket, Key) and the source as CopySource={"Bucket": ..., "Key": ...}. A dict is safest when keys contain spaces.', mr: 'copy_object ला destination (Bucket, Key) आणि source CopySource={"Bucket": ..., "Key": ...} म्हणून लागतो. keys मध्ये spaces असतील तर dict सगळ्यात सुरक्षित.' },
            { en: 'Order matters: copy first, delete second. If the copy fails, the original is still there.', mr: 'क्रम महत्त्वाचा: आधी copy, नंतर delete. copy अपयशी झाला तरी मूळ file तिथेच राहते.' },
            { en: "    s3.copy_object(Bucket=BUCKET, Key=new, CopySource={'Bucket': BUCKET, 'Key': old})\n    s3.delete_object(Bucket=BUCKET, Key=old)", mr: "    s3.copy_object(Bucket=BUCKET, Key=new, CopySource={'Bucket': BUCKET, 'Key': old})\n    s3.delete_object(Bucket=BUCKET, Key=old)" },
          ],
          successLine: { en: 'Clean names, nothing lost, incoming/ empty. That is an S3 "rename".', mr: 'साफ नावं, काहीच हरवलं नाही, incoming/ रिकामं. हाच S3 चा "rename".' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Theo prefers the resource API. Press Run: this code downloads the day\'s files, counts rows and uploads a summary, without one list_objects_v2 call in sight. Which statement about it is true?', mr: 'Theo ला resource API आवडतो. Run दाबा: हा code त्या दिवसाच्या files download करतो, rows मोजतो आणि summary upload करतो, एकही list_objects_v2 call न दिसता. त्याबद्दल कोणतं विधान खरं आहे?' },
          pythonSandbox: {
            code: `import os
import boto3

s3 = boto3.resource('s3', region_name='ap-south-1')
bucket = s3.Bucket('chaicart-raw')

os.makedirs('downloads', exist_ok=True)
rows = 0
for obj in bucket.objects.filter(Prefix='orders/2026/11/24/'):
    local = 'downloads/' + obj.key.split('/')[-1]
    bucket.download_file(obj.key, local)
    with open(local, encoding='utf-8') as f:
        rows += len(f.read().splitlines()) - 1
    print('downloaded', obj.key, obj.size, 'bytes')

with open('downloads/summary.txt', 'w', encoding='utf-8') as f:
    f.write(f'rows={rows}')
bucket.upload_file('downloads/summary.txt', 'reports/2026/11/24/summary.txt')
print('rows:', rows)
`,
            aws: { buckets: { 'chaicart-raw': L2_SEED } },
          },
          options: [
            { en: 'The resource API talks to a different storage service, so it has no 1,000-key limit at all', mr: 'resource API वेगळ्याच storage service शी बोलतो, म्हणून त्याला 1,000-key मर्यादाच नाही' },
            { en: 'It is an object-style wrapper over the same S3 calls: objects.filter() pages through ListObjectsV2 for you (see the API calls list), and download_file/upload_file are managed transfers. AWS adds no new features to the resource API, so new features need the client (s3.meta.client)', mr: 'हा त्याच S3 calls वरचा object-style wrapper आहे: objects.filter() तुमच्यासाठी ListObjectsV2 ची पानं उलटतो (API calls list पाहा), आणि download_file/upload_file हे managed transfers आहेत. AWS resource API मध्ये नवीन features जोडत नाही, म्हणून नवीन features साठी client लागतो (s3.meta.client)' },
            { en: 'objects.filter() reads only the first 1,000 objects and silently stops', mr: 'objects.filter() फक्त पहिले 1,000 objects वाचतो आणि गुपचूप थांबतो' },
            { en: 'download_file downloads the whole bucket into the downloads folder', mr: 'download_file पूर्ण bucket downloads folder मध्ये download करतो' },
          ],
          correct: [1],
          explain: { en: 'Open the API calls list in the AWS console panel: ListObjectsV2, GetObject for each download, PutObject for the summary. The resource API hides the paging and gives you objects with .key and .size, which is pleasant. But the boto3 team has said it will not add new features to resources, so production code usually uses the client, and you can always reach it through s3.meta.client.', mr: 'AWS console panel मधली API calls list उघडा: ListObjectsV2, प्रत्येक download साठी GetObject, summary साठी PutObject. resource API paging लपवतो आणि .key आणि .size असलेले objects देतो, हे सोयीचं आहे. पण boto3 team ने सांगितलं आहे की ते resources मध्ये नवीन features जोडणार नाहीत, म्हणून production code बहुतेक client वापरतो, आणि तो s3.meta.client ने कधीही मिळतो.' },
          hints: [
            { en: 'Scroll to the API calls under the output. Which S3 operations ran?', mr: 'output खालचे API calls पाहा. कोणती S3 operations चालली?' },
            { en: 'A wrapper still makes the same requests underneath. Who decides which features a wrapper gets?', mr: 'wrapper खाली त्याच requests करतो. wrapper ला कोणते features मिळतील ते कोण ठरवतं?' },
          ],
          successLine: { en: 'Same S3 underneath, friendlier on top. You know when to drop down to the client.', mr: 'खाली तेच S3, वर जास्त सोयीचं. client कडे केव्हा उतरायचं ते तुम्हाला माहीत आहे.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'The bucket holds orders/2026/11/23/a.csv, orders/2026/11/24/b.csv, orders/2026/11/24/c.csv and orders/readme.txt. What does this print?', mr: 'bucket मध्ये orders/2026/11/23/a.csv, orders/2026/11/24/b.csv, orders/2026/11/24/c.csv आणि orders/readme.txt आहेत. हे काय print करतं?' },
        code: "resp = s3.list_objects_v2(Bucket='chaicart-raw', Prefix='orders/2026/11/', Delimiter='/')\nprint([p['Prefix'] for p in resp.get('CommonPrefixes', [])])",
        options: [
          "['orders/2026/11/23/a.csv', 'orders/2026/11/24/b.csv', 'orders/2026/11/24/c.csv']",
          "['orders/2026/11/23/', 'orders/2026/11/24/']",
          "['orders/2026/11/23/', 'orders/2026/11/24/', 'orders/readme.txt']",
          '[]',
        ],
        answer: 1,
        explain: { en: 'With Delimiter="/", every key below Prefix is rolled up at the next "/": the two day prefixes, each counted once. orders/readme.txt does not start with orders/2026/11/, so it is not listed at all.', mr: 'Delimiter="/" दिल्यावर Prefix खालची प्रत्येक key पुढच्या "/" वर गुंडाळली जाते: दोन दिवसांचे prefixes, प्रत्येक एकदाच. orders/readme.txt orders/2026/11/ ने सुरू होत नाही, म्हणून ती list होतच नाही.' },
      },
      {
        q: { en: 'How do you rename orders/tmp.csv to orders/2026/11/24/pune.csv in a general purpose bucket?', mr: 'general purpose bucket मध्ये orders/tmp.csv चं नाव orders/2026/11/24/pune.csv कसं कराल?' },
        options: [
          { en: 's3.rename_object(...), which is atomic for any size', mr: 's3.rename_object(...), जो कोणत्याही size साठी atomic आहे' },
          { en: 'Change the key in the object\'s metadata', mr: 'object च्या metadata मधली key बदला' },
          { en: 'Create a folder called 2026/11/24 and drag the file into it', mr: '2026/11/24 नावाचा folder बनवा आणि file त्यात ओढा' },
          { en: 'copy_object to the new key, then delete_object the old key', mr: 'नव्या key वर copy_object, मग जुन्या key वर delete_object' },
        ],
        answer: 3,
        explain: { en: 'Keys are names, not locations, and general purpose buckets have no rename. Copy (up to 5 GB in one call, multipart copy above that) and then delete. RenameObject exists only for S3 Express One Zone directory buckets.', mr: 'keys म्हणजे नावं, जागा नाहीत, आणि general purpose buckets मध्ये rename नाही. copy करा (एका call मध्ये 5 GB पर्यंत, त्यावर multipart copy) आणि मग delete. RenameObject फक्त S3 Express One Zone directory buckets साठी आहे.' },
      },
      {
        q: { en: 'What request rate does S3 support per partitioned prefix?', mr: 'S3 प्रत्येक partitioned prefix साठी किती request rate देतं?' },
        options: [
          { en: 'At least 3,500 PUT/COPY/POST/DELETE and 11,000 GET/HEAD per second, scaling up gradually (503 Slow Down while it scales)', mr: 'दर सेकंदाला किमान 3,500 PUT/COPY/POST/DELETE आणि 11,000 GET/HEAD, हळूहळू scale होतं (scale होताना 503 Slow Down)' },
          { en: '100 requests per second per bucket, fixed', mr: 'प्रत्येक bucket ला दर सेकंदाला 100 requests, निश्चित' },
          { en: 'Unlimited from the first second, so key design never matters', mr: 'पहिल्या सेकंदापासून अमर्यादित, म्हणून key design कधीच महत्त्वाचं नाही' },
          { en: '1,000 requests per second, because a list returns 1,000 keys', mr: 'दर सेकंदाला 1,000 requests, कारण list 1,000 keys देतो' },
        ],
        answer: 0,
        explain: { en: 'The limits apply per partitioned prefix, and S3 adds partitions as traffic grows. A sudden spike on a new prefix can see 503 Slow Down until it scales, so very busy writers spread keys across many prefixes. The 1,000 is the list page size, a different thing.', mr: 'मर्यादा प्रत्येक partitioned prefix ला लागू होतात, आणि traffic वाढेल तसे S3 partitions जोडतं. नव्या prefix वर अचानक गर्दी आली तर scale होईपर्यंत 503 Slow Down दिसू शकतो, म्हणून खूप गर्दीचे writers keys अनेक prefixes मध्ये पसरवतात. 1,000 हा list च्या पानाचा size आहे, ती वेगळी गोष्ट.' },
      },
      {
        q: { en: 'No object starts with this prefix. What happens?', mr: 'या prefix ने एकही object सुरू होत नाही. काय होतं?' },
        code: "resp = s3.list_objects_v2(Bucket='chaicart-raw', Prefix='orders/2026/11/30/')\nprint(len(resp['Contents']))",
        options: ['0', 'None', "KeyError: 'Contents'", 'NoSuchKey'],
        answer: 2,
        explain: { en: 'An empty listing is not an error, and it is not an empty list either: the "Contents" key is simply absent. resp["Contents"] raises KeyError. resp.get("Contents", []) gives 0.', mr: 'रिकामी listing म्हणजे error नाही, आणि रिकामी list पण नाही: "Contents" key च नसते. resp["Contents"] KeyError देतो. resp.get("Contents", []) ने 0 मिळतो.' },
      },
    ],
    recap: { line: { en: 'Folders are prefixes. Prefix filters, Delimiter rolls up to CommonPrefixes, a page holds 1,000 so use a paginator, "Contents" may be missing, and rename means copy then delete.', mr: 'folders म्हणजे prefixes. Prefix गाळतो, Delimiter CommonPrefixes मध्ये गुंडाळतो, एका पानात 1,000 म्हणून paginator वापरा, "Contents" नसू शकते, आणि rename म्हणजे आधी copy मग delete.' }, icon: '🔍' },
    interview: [
      {
        q: { en: 'Does S3 have folders?', mr: 'S3 मध्ये folders असतात का?' },
        a: { en: 'No. S3 has a flat namespace: a bucket holds keys, and orders/2026/11/24/pune.csv is a single key. The console shows folders by splitting keys on "/", and "Create folder" just makes a zero-byte object whose key ends in "/". The API gives you folder-like behaviour through Prefix (keys starting with some characters) and Delimiter (roll the next level up into CommonPrefixes). So "moving a folder" means copying and deleting every object under the prefix. And a "folder" disappears on its own when its last object is deleted, unless someone created that zero-byte marker object.', mr: 'नाही. S3 चा namespace सपाट आहे: bucket मध्ये keys असतात, आणि orders/2026/11/24/pune.csv ही एकच key आहे. console keys "/" वर तोडून folders दाखवतं, आणि "Create folder" फक्त "/" ने संपणारी key असलेला zero-byte object बनवतं. API folder सारखं वागणं Prefix (काही अक्षरांनी सुरू होणाऱ्या keys) आणि Delimiter (पुढची पातळी CommonPrefixes मध्ये गुंडाळणं) ने देतो. म्हणून "folder हलवणं" म्हणजे त्या prefix खालचा प्रत्येक object copy आणि delete करणं. आणि शेवटचा object delete झाला की "folder" आपोआप गायब होतो, कोणी तो zero-byte marker object बनवला नसेल तर.' },
      },
      {
        q: { en: 'How do you list more than 1,000 objects with boto3?', mr: 'boto3 ने 1,000 पेक्षा जास्त objects कसे list करता?' },
        a: { en: 'ListObjectsV2 returns at most 1,000 entries per call, and it does not raise an error when there are more: it sets IsTruncated to True and returns a NextContinuationToken. I use s3.get_paginator("list_objects_v2").paginate(Bucket=..., Prefix=...), which keeps calling with ContinuationToken until the listing ends, and inside each page I read page.get("Contents", []). At ChaiCart a script that called list once reported exactly 1,000 receipts every busy day, which was the giveaway. For buckets with hundreds of millions of objects, listing is slow and costs requests, so I list only the partition prefix I need, or use S3 Inventory reports instead of a full listing.', mr: 'ListObjectsV2 एका call मध्ये जास्तीत जास्त 1,000 entries देतो, आणि जास्त असतील तर error देत नाही: तो IsTruncated True करतो आणि NextContinuationToken देतो. मी s3.get_paginator("list_objects_v2").paginate(Bucket=..., Prefix=...) वापरते, जो listing संपेपर्यंत ContinuationToken सह call करत राहतो, आणि प्रत्येक page मध्ये page.get("Contents", []) वाचते. ChaiCart मध्ये एकदाच list call करणारी script प्रत्येक गर्दीच्या दिवशी नेमक्या 1,000 receipts सांगायची, तीच खूण होती. कोट्यवधी objects असलेल्या buckets मध्ये listing हळू असतं आणि requests चा खर्च होतो, म्हणून मी फक्त हवा असलेला partition prefix list करते, किंवा पूर्ण listing ऐवजी S3 Inventory reports वापरते.' },
      },
      {
        q: { en: 'What do Prefix and Delimiter do in list_objects_v2?', mr: 'list_objects_v2 मध्ये Prefix आणि Delimiter काय करतात?' },
        a: { en: 'Prefix filters: only keys that begin with those characters come back. Delimiter groups: everything between the prefix and the next delimiter is rolled into one CommonPrefixes entry instead of listing each key. With Prefix="orders/2026/11/" and Delimiter="/" I get orders/2026/11/23/ and orders/2026/11/24/, which is how I find which days have data without reading files. Each rolled-up prefix counts as one entry toward the 1,000 per page. Two gotchas: end the prefix with "/" or "orders/2026/11/2" also matches days 20 to 29, and CommonPrefixes, like Contents, is absent when empty.', mr: 'Prefix गाळतो: फक्त त्या अक्षरांनी सुरू होणाऱ्या keys परत येतात. Delimiter गट करतो: prefix आणि पुढच्या delimiter मधलं सगळं प्रत्येक key list करण्याऐवजी एका CommonPrefixes entry मध्ये गुंडाळलं जातं. Prefix="orders/2026/11/" आणि Delimiter="/" ने मला orders/2026/11/23/ आणि orders/2026/11/24/ मिळतात, अशा प्रकारे files न वाचता कोणत्या दिवसांचा data आहे ते मी शोधते. प्रत्येक गुंडाळलेला prefix पानाच्या 1,000 मध्ये एक entry म्हणून मोजला जातो. दोन गोमी: prefix "/" ने संपवा, नाहीतर "orders/2026/11/2" दिवस 20 ते 29 सुद्धा पकडतो, आणि Contents सारखंच CommonPrefixes रिकामं असेल तर नसतं.' },
      },
      {
        q: { en: 'How do you rename or move an object in S3?', mr: 'S3 मध्ये object चं नाव कसं बदलता किंवा तो कसा हलवता?' },
        a: { en: 'General purpose buckets have no rename, so I copy_object to the new key and then delete_object the old one, always in that order. It is two requests and not atomic, so the job must be safe to rerun: if it crashes after the copy, running it again just copies over the same target and finishes the delete. CopyObject handles up to 5 GB in one call; bigger objects need a multipart copy (UploadPartCopy), which upload tools do for you. Moving a whole prefix means doing this per object, and you pay for the requests. The only native rename is RenameObject, and it works only in S3 Express One Zone directory buckets.', mr: 'general purpose buckets मध्ये rename नाही, म्हणून मी नव्या key वर copy_object करते आणि मग जुन्या key वर delete_object, नेहमी याच क्रमाने. या दोन requests आहेत आणि atomic नाहीत, म्हणून job पुन्हा चालवायला सुरक्षित हवा: copy नंतर crash झाला तर पुन्हा चालवल्यावर तो त्याच target वर copy करतो आणि delete पूर्ण करतो. CopyObject एका call मध्ये 5 GB पर्यंत हाताळतो; मोठ्या objects ना multipart copy (UploadPartCopy) लागते, upload tools ते तुमच्यासाठी करतात. पूर्ण prefix हलवणं म्हणजे प्रत्येक object साठी हेच करणं, आणि requests चे पैसे लागतात. एकमेव native rename म्हणजे RenameObject, आणि तो फक्त S3 Express One Zone directory buckets मध्ये चालतो.' },
      },
      {
        q: { en: 'What are the S3 request rate limits, and how do key names affect performance?', mr: 'S3 request rate मर्यादा काय आहेत, आणि key नावांचा performance वर काय परिणाम होतो?' },
        a: { en: 'S3 supports at least 3,500 PUT/COPY/POST/DELETE and 11,000 GET/HEAD requests per second per partitioned prefix, and adds partitions gradually as traffic on a prefix grows. While it scales, clients can get 503 Slow Down, which the SDK retries with backoff. The "/" is not special: what matters is spreading requests across many distinct prefixes, for example receipts/shop=017/2026/11/24/... or a short hash at the start of the key, instead of every writer hammering one receipts/today/ prefix. For ChaiCart\'s current volume one prefix per day is fine; the design matters when you reach thousands of requests per second, such as a festival-day spike from every shop.', mr: 'S3 प्रत्येक partitioned prefix साठी दर सेकंदाला किमान 3,500 PUT/COPY/POST/DELETE आणि 11,000 GET/HEAD requests देतं, आणि prefix वरचं traffic वाढेल तसे हळूहळू partitions जोडतं. scale होत असताना clients ना 503 Slow Down मिळू शकतो, SDK तो backoff सह retry करतो. "/" विशेष नाही: महत्त्वाचं म्हणजे requests अनेक वेगवेगळ्या prefixes मध्ये पसरवणं, उदा. receipts/shop=017/2026/11/24/... किंवा key च्या सुरुवातीला छोटा hash, प्रत्येक writer एकाच receipts/today/ prefix वर तुटून पडण्याऐवजी. ChaiCart च्या आजच्या volume साठी दिवसाला एक prefix पुरेसा आहे; design महत्त्वाचं होतं जेव्हा दर सेकंदाला हजारो requests येतात, उदा. सणाच्या दिवशी प्रत्येक दुकानाकडून आलेली गर्दी.' },
      },
      {
        q: { en: 'boto3 client or resource: which do you use for S3?', mr: 'S3 साठी boto3 client की resource: तुम्ही कोणता वापरता?' },
        a: { en: 'The client is a one-to-one mapping of the S3 API: list_objects_v2, put_object, copy_object, returning plain dicts. The resource API is an object-oriented layer on top: s3.Bucket("chaicart-raw").objects.filter(Prefix=...) yields objects with .key and .size and pages for you. I default to the client, because the boto3 team has said it will not add new features to resources, so newer S3 features appear only on the client. If I am already holding a resource, s3.meta.client gives me the client. Either way, paginators, error handling with ClientError and the 1,000-per-page rule are the same underneath.', mr: 'client म्हणजे S3 API चं एकास एक रूप: list_objects_v2, put_object, copy_object, साध्या dicts परत देतात. resource API त्यावरचा object-oriented थर आहे: s3.Bucket("chaicart-raw").objects.filter(Prefix=...) .key आणि .size असलेले objects देतो आणि पानं स्वतः उलटतो. मी default ने client वापरते, कारण boto3 team ने सांगितलं आहे की ते resources मध्ये नवीन features जोडणार नाहीत, म्हणून S3 चे नवीन features फक्त client वर येतात. माझ्याकडे आधीच resource असेल तर s3.meta.client ने client मिळतो. कोणताही वापरला तरी खाली paginators, ClientError ने error handling आणि दर पानाला 1,000 चा नियम सारखेच.' },
      },
      {
        q: { en: 'What is the difference between put_object and upload_file?', mr: 'put_object आणि upload_file मध्ये फरक काय?' },
        a: { en: 'put_object is one PutObject API call with the body in memory, limited to 5 GB, and it gives full control over arguments like ContentType, Metadata and conditional headers. upload_file (and upload_fileobj) is a managed transfer from the S3 transfer manager: it reads a local file, switches to multipart upload above a configurable threshold (TransferConfig), uploads parts in parallel and retries failed parts. Extra settings go in ExtraArgs, like ExtraArgs={"ContentType": "text/csv"}. download_file is the mirror image for reading. For ChaiCart\'s small order CSVs either works; for a multi-GB export I use upload_file.', mr: 'put_object म्हणजे memory मधल्या body सह एकच PutObject API call, 5 GB पर्यंत मर्यादित, आणि ContentType, Metadata आणि conditional headers सारख्या arguments वर पूर्ण नियंत्रण देतो. upload_file (आणि upload_fileobj) म्हणजे S3 transfer manager चा managed transfer: तो local file वाचतो, ठरवता येणाऱ्या threshold (TransferConfig) नंतर multipart upload वापरतो, parts parallel upload करतो आणि अपयशी parts retry करतो. जास्तीच्या settings ExtraArgs मध्ये जातात, उदा. ExtraArgs={"ContentType": "text/csv"}. download_file हे वाचण्यासाठी त्याचंच उलटं रूप. ChaiCart च्या छोट्या order CSVs साठी दोन्ही चालतात; अनेक GB च्या export साठी मी upload_file वापरते.' },
      },
    ],
  },

  // ───────────────────────── B1.3 Designing a data lake
  {
    id: 'lk1-3',
    code: 'B1.3',
    level: 'intermediate',
    title: { en: 'Designing a data lake', mr: 'Data lake ची रचना' },
    skill: 'raw/clean/curated zones, Hive-style partitions and partition pruning, CSV vs JSON vs Parquet, the small-files problem, naming conventions, immutable raw data, idempotent writes, strong consistency',
    realLife: {
      place: 'kitchen',
      title: { en: 'The central kitchen of a thali chain', mr: 'थाळी chain चं central kitchen' },
      story: {
        en: 'Meera visits the central kitchen that supplies twelve thali restaurants in Pune. Vegetables arrive in crates, and every crate is stored exactly as it came, with a date and supplier label; nobody washes vegetables inside the crate. In the next room, cooks wash and chop them into steel containers, throwing away the rotten ones and making sure the same crate is never chopped twice. In the last room, the containers become finished thalis for each restaurant. The cold store has one shelf per day, so when the chef wants Tuesday\'s paneer she walks straight to the Tuesday shelf instead of opening every box. And if the head cook finds the salt was wrong in yesterday\'s curry, she cooks it again from the untouched crates: same vegetables in, same curry out.',
        mr: 'पुण्यातल्या बारा थाळी restaurants ना पुरवठा करणाऱ्या central kitchen ला मीरा भेट देते. भाज्या crates मध्ये येतात, आणि प्रत्येक crate जसा आला तसाच तारीख आणि supplier च्या लेबलसह ठेवला जातो; crate च्या आत कोणीही भाज्या धुत नाही. पुढच्या खोलीत आचारी त्या धुऊन चिरून steel डब्यांमध्ये भरतात, खराब भाज्या फेकतात आणि तोच crate दोनदा चिरला जाणार नाही याची काळजी घेतात. शेवटच्या खोलीत त्या डब्यांच्या प्रत्येक restaurant साठी तयार थाळ्या होतात. cold store मध्ये दिवसाला एक कप्पा असतो, म्हणून chef ला मंगळवारचं पनीर हवं असेल तर ती प्रत्येक डबा उघडण्याऐवजी थेट मंगळवारच्या कप्प्याकडे जाते. आणि कालच्या भाजीत मीठ चुकलं असं मुख्य आचाऱ्याला कळलं, तर ती न उघडलेल्या crates मधून पुन्हा शिजवते: त्याच भाज्या आत, तीच भाजी बाहेर.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📦', label: 'Crates kept as they arrived (raw, bronze)', mr: 'crates आले तसेच ठेवले (raw, bronze)' },
          { icon: '🔪', label: 'Washed, chopped, no double chopping (clean, silver)', mr: 'धुतले, चिरले, दोनदा नाही (clean, silver)' },
          { icon: '🍛', label: 'Finished thalis per restaurant (curated, gold)', mr: 'प्रत्येक restaurant साठी तयार थाळ्या (curated, gold)' },
          { icon: '🗓️', label: 'One shelf per day: go straight to Tuesday', mr: 'दिवसाला एक कप्पा: थेट मंगळवारकडे' },
          { icon: '🔁', label: 'Recook from untouched crates, same result', mr: 'न उघडलेल्या crates मधून पुन्हा शिजवा, तोच परिणाम' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'angry', text: { en: 'Yesterday\'s sales report showed double the money for Pune. The finance head almost announced a bonus.', mr: 'कालच्या sales report मध्ये पुण्याचे पैसे दुप्पट दिसले. finance head ने जवळजवळ bonus जाहीर केला होता.' } },
        { who: 'theo', mood: 'worried', text: { en: 'The job failed halfway and the scheduler retried it. Each run wrote a new file with a timestamp in its name, so the report read both.', mr: 'job अर्ध्यात अपयशी झाला आणि scheduler ने तो पुन्हा चालवला. प्रत्येक run ने नावात timestamp असलेली नवी file लिहिली, म्हणून report ने दोन्ही वाचल्या.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'and your analysts scan every file of every day to find one tuesday. i love your athena bill. hehe.', mr: 'आणि तुमचे analysts एक मंगळवार शोधायला प्रत्येक दिवसाची प्रत्येक file scan करतात. मला तुमचं athena bill खूप आवडतं. हेहे.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Time for a real lake design. Raw stays untouched, clean and curated zones on top, partitions by date so queries read one day, and every job writes to a key that is the same on every rerun.', mr: 'आता खरी lake रचना. raw जसाच्या तसा, त्यावर clean आणि curated zones, तारखेनुसार partitions म्हणजे queries एकच दिवस वाचतील, आणि प्रत्येक job अशा key वर लिहितो जी प्रत्येक rerun ला सारखीच असते.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Run it twice, get the same answer. You have tested that for years, {name}. Now you build it in.', mr: 'दोनदा चालवा, तेच उत्तर मिळवा. हे तू वर्षानुवर्षं test केलंस, {name}. आता तू ते आतच बांधणार.' } },
      ],
      problem: { en: 'Files are dumped anywhere, queries scan every day to answer one, a retried job duplicates data, and raw files get edited so nothing can be rebuilt.', mr: 'files कुठेही टाकल्या जातात, एका दिवसाचं उत्तर देण्यासाठी queries प्रत्येक दिवस scan करतात, पुन्हा चाललेला job data दुप्पट करतो, आणि raw files बदलल्या जातात म्हणून काहीच पुन्हा बनवता येत नाही.' },
      solution: { en: 'Zones (raw, clean, curated), Hive-style date partitions (year=2026/month=11/day=24) that Athena, Glue and Spark prune, columnar Parquet with compression for analytics, few large files instead of many tiny ones, immutable raw data, and idempotent jobs that write deterministic keys.', mr: 'Zones (raw, clean, curated), Athena, Glue आणि Spark ज्यांची छाटणी (pruning) करतात असे Hive-style तारखेचे partitions (year=2026/month=11/day=24), analytics साठी compression सह columnar Parquet, अनेक छोट्या files ऐवजी थोड्या मोठ्या files, न बदलणारा raw data, आणि deterministic keys लिहिणारे idempotent jobs.' },
    },
    lesson: [
      { en: 'A data lake keeps all data as files in S3, in zones. Raw (bronze) holds files exactly as received, never edited: it is the single source of truth you can always rebuild from. Clean (silver) holds validated, de-duplicated, typed data. Curated (gold) holds business-ready tables such as daily sales per shop. Each zone is its own prefix or bucket, with its own permissions: the ingestion job may write raw, analysts may only read curated. Table definitions live in a catalog (the AWS Glue Data Catalog) so Athena can query the files with SQL.', mr: 'data lake सगळा data S3 मध्ये files म्हणून, zones मध्ये ठेवतो. Raw (bronze) मध्ये files जशा आल्या तशाच, कधीही न बदललेल्या: हा single source of truth, ज्यावरून कधीही पुन्हा बनवता येतं. Clean (silver) मध्ये तपासलेला, duplicates काढलेला, योग्य types असलेला data. Curated (gold) मध्ये business साठी तयार tables, उदा. प्रत्येक दुकानाची रोजची विक्री. प्रत्येक zone चा स्वतःचा prefix किंवा bucket असतो, स्वतःच्या परवानग्यांसह: ingestion job raw मध्ये लिहू शकतो, analysts फक्त curated वाचू शकतात. table definitions catalog मध्ये (AWS Glue Data Catalog) असतात, म्हणजे Athena त्या files वर SQL चालवू शकतो.' },
      { en: 'Partition by what queries filter on, usually the date: raw/orders/year=2026/month=11/day=24/pune.csv. This Hive-style key=value layout tells Athena, Glue and Spark that year, month and day are columns, so WHERE year=\'2026\' AND month=\'11\' AND day=\'24\' reads only that prefix and skips the rest: partition pruning. MSCK REPAIR TABLE discovers only Hive-style partitions (other layouts need ALTER TABLE ADD PARTITION or partition projection). Zero-pad months and days (month=01) so text sorting matches dates. Do not partition by something with huge cardinality like order_id: you get millions of tiny prefixes.', mr: 'queries ज्यावर filter करतात त्यानुसार partition करा, बहुतेक तारीख: raw/orders/year=2026/month=11/day=24/pune.csv. ही Hive-style key=value मांडणी Athena, Glue आणि Spark ला सांगते की year, month आणि day हे columns आहेत, म्हणून WHERE year=\'2026\' AND month=\'11\' AND day=\'24\' फक्त तोच prefix वाचतो आणि बाकी सोडतो: partition pruning. MSCK REPAIR TABLE फक्त Hive-style partitions शोधतो (इतर मांडणीसाठी ALTER TABLE ADD PARTITION किंवा partition projection लागतं). महिने आणि दिवस शून्याने भरा (month=01), म्हणजे text sorting तारखांशी जुळेल. order_id सारख्या खूप जास्त वेगवेगळ्या values असलेल्या गोष्टीवर partition करू नका: लाखो छोटे prefixes होतात.' },
      { en: 'Formats: CSV is readable but has no types and an engine must read every byte of every row; JSON is flexible but verbose. Parquet is columnar: each column is stored together, typed and compressed, with statistics, so SELECT city, SUM(amount) reads two columns and skips the rest. Athena bills $5 per TB scanned (10 MB minimum per query), and AWS says compressing, partitioning and converting to columnar formats saves 30% to 90%. The small-files problem: thousands of tiny files mean thousands of requests and slow planning, so aim for files around 128 MB or more and compact small ones. (This lab has no pyarrow, so we practise with CSV; real pipelines write Parquet with pyarrow, Spark or Glue.)', mr: 'Formats: CSV वाचायला सोपी पण types नाहीत आणि engine ला प्रत्येक row चा प्रत्येक byte वाचावा लागतो; JSON लवचिक पण पसरट. Parquet columnar आहे: प्रत्येक column एकत्र, type सह आणि compressed ठेवला जातो, statistics सह, म्हणून SELECT city, SUM(amount) दोनच columns वाचतो आणि बाकी सोडतो. Athena scan केलेल्या प्रत्येक TB ला $5 घेतो (प्रत्येक query ला किमान 10 MB), आणि AWS म्हणतं compression, partitioning आणि columnar formats मध्ये रूपांतर यांनी 30% ते 90% बचत होते. small-files problem: हजारो छोट्या files म्हणजे हजारो requests आणि हळू planning, म्हणून साधारण 128 MB किंवा जास्तच्या files ठेवा आणि छोट्या files एकत्र (compact) करा. (या lab मध्ये pyarrow नाही, म्हणून आपण CSV ने सराव करतो; खऱ्या pipelines pyarrow, Spark किंवा Glue ने Parquet लिहितात.)' },
      { en: 'Raw is immutable: jobs only read it, so after a bug fix you can reprocess any day. Every job must be idempotent: same input, same output, however often it runs. The trick is a deterministic key: the clean file for 24 November is always clean/orders/year=2026/month=11/day=24/part-0000.csv, so a retry overwrites it instead of adding a second copy, never a uuid or timestamp in the name. S3\'s strong read-after-write consistency means the next step sees the new file immediately. Naming conventions keep it all readable: lowercase, hyphens, no spaces, stable dataset names, ISO dates.', mr: 'raw बदलत नाही: jobs तो फक्त वाचतात, म्हणून bug दुरुस्त केल्यावर कोणताही दिवस पुन्हा process करता येतो. प्रत्येक job idempotent हवा: कितीही वेळा चालला तरी तेच input, तेच output. युक्ती म्हणजे deterministic key: 24 November ची clean file नेहमी clean/orders/year=2026/month=11/day=24/part-0000.csv असते, म्हणून retry दुसरी प्रत जोडण्याऐवजी तीच overwrite करतो, नावात uuid किंवा timestamp कधीच नाही. S3 च्या strong read-after-write consistency मुळे पुढच्या पायरीला नवी file लगेच दिसते. naming conventions सगळं वाचायला सोपं ठेवतात: lowercase, hyphens, spaces नाहीत, स्थिर dataset नावं, ISO तारखा.' },
    ],
    syntax: {
      template: `def partition(zone, dataset, day):
    return f'{zone}/{dataset}/year={day.year}/month={day.month:02d}/day={day.day:02d}/'

raw_key = partition('raw', 'orders', day) + 'pune.csv'
s3.upload_file('data/incoming/pune_2026-11-24.csv', 'chaicart-lake', raw_key)

pages = s3.get_paginator('list_objects_v2').paginate(
    Bucket='chaicart-lake', Prefix=partition('raw', 'orders', day))   # one partition only

clean_key = partition('clean', 'orders', day) + 'part-0000.csv'      # same key every run
s3.put_object(Bucket='chaicart-lake', Key=clean_key, Body=csv_text, ContentType='text/csv')

-- Athena (SQL) later reads only one partition:
-- SELECT shop, SUM(amount) FROM clean_orders
-- WHERE year = '2026' AND month = '11' AND day = '24' GROUP BY shop`,
      parts: [
        { code: "raw/ clean/ curated/", means: { en: 'zones (bronze, silver, gold): received as-is, validated, business-ready', mr: 'zones (bronze, silver, gold): आले तसे, तपासलेले, business साठी तयार' } },
        { code: "year=2026/month=11/day=24/", means: { en: 'Hive-style partitions: key=value folders that query engines read as columns and prune', mr: 'Hive-style partitions: key=value folders, query engines त्यांना columns म्हणून वाचतात आणि छाटतात' } },
        { code: "{day.month:02d}", means: { en: 'zero-padded, so month=01 sorts before month=11', mr: 'शून्याने भरलेलं, म्हणून month=01 हा month=11 च्या आधी sort होतो' } },
        { code: "Prefix=partition('raw', 'orders', day)", means: { en: 'list one partition instead of the whole dataset (pruning in your own code)', mr: 'पूर्ण dataset ऐवजी एकच partition list करा (तुमच्या स्वतःच्या code मधलं pruning)' } },
        { code: "'part-0000.csv'", means: { en: 'a deterministic name: a rerun overwrites, it never adds a duplicate', mr: 'deterministic नाव: rerun overwrite करतो, duplicate कधीच जोडत नाही' } },
      ],
      example: [
        { code: "raw/orders/year=2026/month=11/day=24/pune.csv", note: { en: 'the crate, on Tuesday\'s shelf, exactly as it arrived', mr: 'crate, मंगळवारच्या कप्प्यात, जसा आला तसाच' } },
        { code: "clean/orders/year=2026/month=11/day=24/part-0000.csv", note: { en: 'the chopped vegetables: checked, no double chopping', mr: 'चिरलेल्या भाज्या: तपासलेल्या, दोनदा चिरलेल्या नाहीत' } },
        { code: "curated/daily_sales/year=2026/month=11/day=24/part-0000.csv", note: { en: 'the finished thali for the finance team', mr: 'finance team साठी तयार थाळी' } },
        { code: "WHERE year='2026' AND month='11' AND day='24'", note: { en: 'the chef walks straight to one shelf', mr: 'chef थेट एकाच कप्प्याकडे जाते' } },
        { code: "process_day(day); process_day(day)  # same lake", note: { en: 'recook from the same crates, same curry', mr: 'त्याच crates मधून पुन्हा शिजवा, तीच भाजी' } },
      ],
      pitfall: { en: 'raw/orders/2026-11-24/pune.csv looks tidy but is not Hive-style, so MSCK REPAIR TABLE will not find its partitions. And a key like clean/.../run-1732420800.csv or a uuid4() name makes every retry add a copy: totals double without any error. Put the partition in the key as key=value, and make output names depend only on the input (the day), never on the clock.', mr: 'raw/orders/2026-11-24/pune.csv नीट दिसतं पण Hive-style नाही, म्हणून MSCK REPAIR TABLE ला त्याचे partitions सापडणार नाहीत. आणि clean/.../run-1732420800.csv सारखी key किंवा uuid4() नाव प्रत्येक retry ला एक प्रत जोडतं: कोणताही error न येता बेरजा दुप्पट होतात. partition key मध्ये key=value म्हणून ठेवा, आणि output नावं फक्त input (दिवस) वर अवलंबून ठेवा, घड्याळावर कधीच नाही.' },
    },
    practice: {
      intro: { en: 'Build ChaiCart\'s lake in the bucket chaicart-lake: land files into Hive-style partitions, read one partition only, and write a clean zone that survives retries. Hidden data brings new months, a new year, a missing day and a file delivered twice.', mr: 'chaicart-lake bucket मध्ये ChaiCart चा lake बांधा: files Hive-style partitions मध्ये उतरवा, फक्त एकच partition वाचा, आणि retries मध्ये टिकणारा clean zone लिहा. लपवलेल्या data मध्ये नवे महिने, नवं वर्ष, गायब दिवस आणि दोनदा आलेली file आहे.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'Shops upload files named city_YYYY-MM-DD.csv (see data/incoming above). Fix raw_key(dataset, day, filename) so it returns a Hive-style key: raw/orders/year=2026/month=11/day=24/pune.csv, with month and day zero-padded. Then, inside the loop, upload each local file to that key with s3.upload_file. Hidden files come from December and from 2027.', mr: 'दुकानं city_YYYY-MM-DD.csv नावाच्या files upload करतात (वर data/incoming पाहा). raw_key(dataset, day, filename) दुरुस्त करा, म्हणजे तो Hive-style key देईल: raw/orders/year=2026/month=11/day=24/pune.csv, month आणि day शून्याने भरलेले. मग loop च्या आत प्रत्येक local file त्या key वर s3.upload_file ने upload करा. लपवलेल्या files December आणि 2027 मधल्या आहेत.' },
          files: { 'data/incoming/pune_2026-11-23.csv': IN_PUNE_23, 'data/incoming/pune_2026-11-24.csv': IN_PUNE_24, 'data/incoming/nagpur_2026-11-24.csv': IN_NAGPUR_24 },
          aws: { buckets: { 'chaicart-lake': {} } },
          starter: `${LAND_HEAD}
def raw_key(dataset, day, filename):
    # TODO: Hive-style: raw/<dataset>/year=YYYY/month=MM/day=DD/<filename> (MM and DD zero-padded)
    return f'raw/{dataset}/{day.isoformat()}/{filename}'

landed = 0
for name in sorted(os.listdir('data/incoming')):
    city, day_text = name[:-4].split('_')
    day = date.fromisoformat(day_text)
    key = raw_key('orders', day, city + '.csv')
    # TODO: upload 'data/incoming/' + name to BUCKET under key (s3.upload_file)
    print(key)
    landed += 1
print('landed:', landed)
`,
          solution: `${LAND_HEAD}
def raw_key(dataset, day, filename):
    return f'raw/{dataset}/year={day.year}/month={day.month:02d}/day={day.day:02d}/{filename}'
${LAND_LOOP}`,
          output: ['raw/orders/year=2026/month=11/day=24/nagpur.csv', 'raw/orders/year=2026/month=11/day=23/pune.csv', 'raw/orders/year=2026/month=11/day=24/pune.csv', 'landed: 3'],
          checks: [
            { expr: "raw_key('receipts', date(2027, 1, 5), 'r1.json') == 'raw/receipts/year=2027/month=01/day=05/r1.json'", message: { en: 'raw_key("receipts", date(2027, 1, 5), "r1.json") should be raw/receipts/year=2027/month=01/day=05/r1.json. Zero-pad month and day with :02d.', mr: 'raw_key("receipts", date(2027, 1, 5), "r1.json") म्हणजे raw/receipts/year=2027/month=01/day=05/r1.json हवं. month आणि day :02d ने शून्याने भरा.' } },
            { expr: "s3_keys('chaicart-lake') == ['raw/orders/year=2026/month=11/day=23/pune.csv', 'raw/orders/year=2026/month=11/day=24/nagpur.csv', 'raw/orders/year=2026/month=11/day=24/pune.csv']", message: { en: 'The lake should hold exactly the three files at their Hive-style keys. Did you upload inside the loop?', mr: 'lake मध्ये नेमक्या तीन files त्यांच्या Hive-style keys वर हव्यात. loop च्या आत upload केलं का?' } },
            { expr: "s3_text('chaicart-lake', 'raw/orders/year=2026/month=11/day=24/pune.csv') == open('data/incoming/pune_2026-11-24.csv').read()", message: { en: 'Raw files must be stored exactly as received. Upload the local file unchanged.', mr: 'raw files जशा आल्या तशाच ठेवायला हव्यात. local file न बदलता upload करा.' } },
          ],
          variants: [
            {
              label: { en: 'New files from December and from January 2027', mr: 'December आणि January 2027 मधल्या नव्या files' },
              files: { 'data/incoming/mumbai_2026-12-01.csv': IN_MUMBAI_1201, 'data/incoming/nashik_2027-01-05.csv': IN_NASHIK_0105 },
              output: ['raw/orders/year=2026/month=12/day=01/mumbai.csv', 'raw/orders/year=2026/month=11/day=24/nagpur.csv', 'raw/orders/year=2027/month=01/day=05/nashik.csv', 'raw/orders/year=2026/month=11/day=23/pune.csv', 'raw/orders/year=2026/month=11/day=24/pune.csv', 'landed: 5'],
              checks: [
                { expr: "s3_text('chaicart-lake', 'raw/orders/year=2027/month=01/day=05/nashik.csv') == open('data/incoming/nashik_2027-01-05.csv').read()", message: { en: 'The January 2027 file should land at raw/orders/year=2027/month=01/day=05/nashik.csv.', mr: 'January 2027 ची file raw/orders/year=2027/month=01/day=05/nashik.csv वर यायला हवी.' } },
              ],
            },
          ],
          mustUse: [{ pattern: 'upload_file\\(', message: { en: 'Upload each local file with s3.upload_file(path, BUCKET, key).', mr: 'प्रत्येक local file s3.upload_file(path, BUCKET, key) ने upload करा.' } }],
          hints: [
            { en: 'A date has .year, .month and .day. In an f-string, {day.month:02d} writes 1 as 01.', mr: 'date कडे .year, .month आणि .day असतात. f-string मध्ये {day.month:02d} 1 ला 01 लिहितो.' },
            { en: 's3.upload_file takes (local_path, bucket, key): s3.upload_file("data/incoming/" + name, BUCKET, key).', mr: 's3.upload_file ला (local_path, bucket, key) लागतं: s3.upload_file("data/incoming/" + name, BUCKET, key).' },
            { en: "    return f'raw/{dataset}/year={day.year}/month={day.month:02d}/day={day.day:02d}/{filename}'\n...\n    s3.upload_file('data/incoming/' + name, BUCKET, key)", mr: "    return f'raw/{dataset}/year={day.year}/month={day.month:02d}/day={day.day:02d}/{filename}'\n...\n    s3.upload_file('data/incoming/' + name, BUCKET, key)" },
          ],
          successLine: { en: 'Every crate on the right shelf. Athena will be able to find each day by itself.', mr: 'प्रत्येक crate योग्य कप्प्यात. Athena ला प्रत्येक दिवस आपोआप सापडेल.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Finance wants one day. Write partition_prefix(dataset, day) (raw/orders/year=2026/month=11/day=24/) and summarize(day): page through only that partition, read each CSV, and return (files, orders, amount) with amount as the sum of the amount column. Read no other day: the hidden test checks every GetObject call. Hidden lakes have a missing day, a new shop, and the same day number in another month.', mr: 'finance ला एकच दिवस हवा. partition_prefix(dataset, day) (raw/orders/year=2026/month=11/day=24/) आणि summarize(day) लिहा: फक्त त्याच partition ची पानं उलटा, प्रत्येक CSV वाचा, आणि (files, orders, amount) परत द्या, amount म्हणजे amount column ची बेरीज. दुसरा कोणताही दिवस वाचू नका: लपवलेली test प्रत्येक GetObject call तपासते. लपवलेल्या lakes मध्ये गायब दिवस, नवं दुकान, आणि दुसऱ्या महिन्यात तोच दिवस-क्रमांक आहे.' },
          aws: { buckets: { 'chaicart-lake': LAKE_SEED } },
          starter: `${SUM_HEAD}
def partition_prefix(dataset, day):
    # TODO: 'raw/orders/year=2026/month=11/day=24/' for ('orders', date(2026, 11, 24))
    return f'raw/{dataset}/'

def summarize(day):
    files, orders, amount = 0, 0, 0
    # TODO: page through the objects under partition_prefix('orders', day)
    #       (use page.get('Contents', []): an empty partition has no 'Contents')
    #       for each file: read it with get_object, count its rows, add up the amount column
    return files, orders, amount

files, orders, amount = summarize(DAY)
print(f'{DAY}: {files} files, {orders} orders, Rs {amount:,}')
`,
          solution: `${SUM_HEAD}
def partition_prefix(dataset, day):
    return f'raw/{dataset}/year={day.year}/month={day.month:02d}/day={day.day:02d}/'

def summarize(day):
    files, orders, amount = 0, 0, 0
    pages = s3.get_paginator('list_objects_v2').paginate(Bucket=BUCKET, Prefix=partition_prefix('orders', day))
    for page in pages:
        for obj in page.get('Contents', []):
            text = s3.get_object(Bucket=BUCKET, Key=obj['Key'])['Body'].read().decode('utf-8')
            files += 1
            for row in csv.DictReader(io.StringIO(text)):
                orders += 1
                amount += int(row['amount'])
    return files, orders, amount

files, orders, amount = summarize(DAY)
print(f'{DAY}: {files} files, {orders} orders, Rs {amount:,}')
`,
          output: ['2026-11-24: 3 files, 9 orders, Rs 1,365'],
          checks: [
            { expr: "all('/month=11/day=24/' in c for c in api_calls if c.startswith('GetObject'))", message: { en: 'Your code read files outside the 2026-11-24 partition. List with Prefix=partition_prefix("orders", day) so only that day is read (that is partition pruning).', mr: 'तुमच्या code ने 2026-11-24 partition बाहेरच्या files वाचल्या. Prefix=partition_prefix("orders", day) ने list करा म्हणजे फक्त तोच दिवस वाचला जाईल (हेच partition pruning).' } },
            { expr: "partition_prefix('orders', date(2026, 1, 5)) == 'raw/orders/year=2026/month=01/day=05/'", message: { en: 'partition_prefix("orders", date(2026, 1, 5)) should be raw/orders/year=2026/month=01/day=05/ (zero-padded, ending in /).', mr: 'partition_prefix("orders", date(2026, 1, 5)) म्हणजे raw/orders/year=2026/month=01/day=05/ हवं (शून्याने भरलेलं, शेवटी /).' } },
            { expr: "summarize(date(2026, 11, 23)) == (2, 3, 165)", message: { en: 'summarize(date(2026, 11, 23)) should return (2, 3, 165): 2 files, 3 orders, Rs 165.', mr: 'summarize(date(2026, 11, 23)) ने (2, 3, 165) द्यायला हवं: 2 files, 3 orders, Rs 165.' } },
          ],
          variants: [
            {
              label: { en: 'No shop uploaded on the 24th', mr: '24 तारखेला एकाही दुकानाने upload केलं नाही' },
              aws: { buckets: { 'chaicart-lake': LAKE_SEED_NO_24 } },
              output: ['2026-11-24: 0 files, 0 orders, Rs 0'],
              checks: [
                { expr: "summarize(date(2026, 11, 25)) == (1, 1, 150)", message: { en: 'summarize(date(2026, 11, 25)) should return (1, 1, 150) on the hidden lake.', mr: 'लपवलेल्या lake वर summarize(date(2026, 11, 25)) ने (1, 1, 150) द्यायला हवं.' } },
              ],
            },
            {
              label: { en: 'A new Thane shop, and 24 October in the same lake', mr: 'नवं ठाणे दुकान, आणि त्याच lake मध्ये 24 October' },
              aws: { buckets: { 'chaicart-lake': LAKE_SEED_MORE } },
              output: ['2026-11-24: 4 files, 11 orders, Rs 3,025'],
              checks: [
                { expr: "all('/month=11/day=24/' in c for c in api_calls if c.startswith('GetObject'))", message: { en: 'A file from another month was read. The prefix must include year and month, not only day=24.', mr: 'दुसऱ्या महिन्यातली file वाचली गेली. prefix मध्ये फक्त day=24 नाही, year आणि month पण हवेत.' } },
              ],
            },
          ],
          mustUse: [{ pattern: 'Prefix', message: { en: 'List with a Prefix so only one partition is read.', mr: 'Prefix ने list करा म्हणजे एकच partition वाचला जाईल.' } }],
          hints: [
            { en: 'partition_prefix is the same f-string as raw_key in the last step, without the filename and ending in "/".', mr: 'partition_prefix म्हणजे मागच्या पायरीतल्या raw_key सारखंच f-string, filename शिवाय आणि शेवटी "/".' },
            { en: 'Loop: for page in s3.get_paginator("list_objects_v2").paginate(Bucket=BUCKET, Prefix=...): for obj in page.get("Contents", []): read the text with get_object and decode it.', mr: 'Loop: for page in s3.get_paginator("list_objects_v2").paginate(Bucket=BUCKET, Prefix=...): for obj in page.get("Contents", []): get_object ने text वाचा आणि decode करा.' },
            { en: 'csv.DictReader(io.StringIO(text)) gives one dict per row: orders += 1 and amount += int(row["amount"]).', mr: 'csv.DictReader(io.StringIO(text)) प्रत्येक row साठी एक dict देतो: orders += 1 आणि amount += int(row["amount"]).' },
            { en: "    for page in s3.get_paginator('list_objects_v2').paginate(Bucket=BUCKET, Prefix=partition_prefix('orders', day)):\n        for obj in page.get('Contents', []):\n            text = s3.get_object(Bucket=BUCKET, Key=obj['Key'])['Body'].read().decode('utf-8')\n            files += 1\n            for row in csv.DictReader(io.StringIO(text)):\n                orders += 1\n                amount += int(row['amount'])", mr: "    for page in s3.get_paginator('list_objects_v2').paginate(Bucket=BUCKET, Prefix=partition_prefix('orders', day)):\n        for obj in page.get('Contents', []):\n            text = s3.get_object(Bucket=BUCKET, Key=obj['Key'])['Body'].read().decode('utf-8')\n            files += 1\n            for row in csv.DictReader(io.StringIO(text)):\n                orders += 1\n                amount += int(row['amount'])" },
          ],
          successLine: { en: 'One shelf opened, the rest untouched. Athena does exactly this with WHERE year, month, day.', mr: 'एकच कप्पा उघडला, बाकी हात न लावता. Athena WHERE year, month, day ने नेमकं हेच करतो.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Write the clean zone for one day, and make it idempotent. In process_day: skip rows whose amount is not a whole number after strip() (empty, "abc", "-160"), write the stripped amount, skip an order_id you already kept (a shop file was delivered twice), then write ONE file to a deterministic key: clean/orders/year=2026/month=11/day=24/part-0000.csv. The program runs process_day twice, like a scheduler retry: the lake must end up with one clean file, not two. Raw stays untouched.', mr: 'एका दिवसाचा clean zone लिहा, आणि तो idempotent करा. process_day मध्ये: strip() नंतर amount पूर्ण संख्या नसलेल्या rows सोडा (रिकामं, "abc", "-160"), strip केलेला amount लिहा, आधीच ठेवलेला order_id सोडा (एका दुकानाची file दोनदा आली), मग deterministic key वर एकच file लिहा: clean/orders/year=2026/month=11/day=24/part-0000.csv. program process_day दोनदा चालवतो, scheduler च्या retry सारखा: lake मध्ये शेवटी एकच clean file हवी, दोन नाहीत. raw जसाच्या तसा राहतो.' },
          aws: { buckets: { 'chaicart-lake': CLEAN_SEED } },
          starter: `${CLEAN_HEAD}
def process_day(day):
    good, seen = [], set()
    for row in read_raw(day):
        # TODO: skip the row if row['amount'].strip() is not a whole number (use .isdigit())
        # TODO: skip the row if its order_id was already kept; otherwise remember it
        good.append(row)
    good.sort(key=lambda r: int(r['order_id']))
    # TODO: a deterministic key, the same on every run: partition('clean', 'orders', day) + 'part-0000.csv'
    key = partition('clean', 'orders', day) + uuid.uuid4().hex + '.csv'
    s3.put_object(Bucket=BUCKET, Key=key, Body=to_csv(good), ContentType='text/csv')
    print(f'clean rows: {len(good)} -> {key}')
    return key
${CLEAN_TAIL}`,
          solution: `${CLEAN_HEAD}
def process_day(day):
    good, seen = [], set()
    for row in read_raw(day):
        amount = row['amount'].strip()
        if not amount.isdigit():
            continue
        if row['order_id'] in seen:
            continue
        seen.add(row['order_id'])
        row['amount'] = amount
        good.append(row)
    good.sort(key=lambda r: int(r['order_id']))
    key = partition('clean', 'orders', day) + 'part-0000.csv'
    s3.put_object(Bucket=BUCKET, Key=key, Body=to_csv(good), ContentType='text/csv')
    print(f'clean rows: {len(good)} -> {key}')
    return key
${CLEAN_TAIL}`,
          output: [`clean rows: 3 -> ${CLEAN_KEY}`, `clean rows: 3 -> ${CLEAN_KEY}`],
          checks: [
            { expr: `s3_keys('chaicart-lake', 'clean/') == ['${CLEAN_KEY}']`, message: { en: `After two runs the clean zone should hold exactly one file: ${CLEAN_KEY}. A uuid or timestamp in the key adds a copy on every retry.`, mr: `दोन runs नंतर clean zone मध्ये नेमकी एकच file हवी: ${CLEAN_KEY}. key मधला uuid किंवा timestamp प्रत्येक retry ला एक प्रत जोडतो.` } },
            { expr: `s3_text('chaicart-lake', '${CLEAN_KEY}').splitlines() == ['order_id,shop,item,qty,amount', '1101,Pune-FC,masala chai,2,40', '1102,Pune-FC,thali,3,450', '2101,Nagpur-Sitabuldi,cutting chai,5,75']`, message: { en: 'The clean file should keep 1101, 1102 and 2101 only: 1103 (empty amount) and 2102 ("abc") are dropped, and the redelivered Pune file adds nothing.', mr: 'clean file मध्ये फक्त 1101, 1102 आणि 2101 हवेत: 1103 (रिकामा amount) आणि 2102 ("abc") वगळले, आणि पुन्हा आलेली Pune file काहीच जोडत नाही.' } },
            { expr: "s3_text('chaicart-lake', 'raw/orders/year=2026/month=11/day=24/pune.csv').splitlines()[3] == '1103,Pune-FC,vada pav,4,' and len(s3_keys('chaicart-lake', 'raw/')) == 4", message: { en: 'Raw changed! Jobs only read the raw zone; they never edit or delete it.', mr: 'raw बदलला! jobs raw zone फक्त वाचतात; तो कधीच बदलत किंवा काढत नाहीत.' } },
          ],
          variants: [
            {
              label: { en: 'Another lake: a repeated order inside one file, a spaced amount, a negative amount', mr: 'दुसरा lake: एकाच file मध्ये पुन्हा आलेली order, space असलेला amount, negative amount' },
              aws: { buckets: { 'chaicart-lake': CLEAN_SEED_2 } },
              output: [`clean rows: 4 -> ${CLEAN_KEY}`, `clean rows: 4 -> ${CLEAN_KEY}`],
              checks: [
                { expr: `s3_keys('chaicart-lake', 'clean/') == ['${CLEAN_KEY}']`, message: { en: 'On the hidden lake the clean zone again needs exactly one file after two runs.', mr: 'लपवलेल्या lake वरही दोन runs नंतर clean zone मध्ये नेमकी एकच file हवी.' } },
                { expr: `s3_text('chaicart-lake', '${CLEAN_KEY}').splitlines() == ['order_id,shop,item,qty,amount', '3101,Mumbai-Andheri,thali,2,300', '3102,Mumbai-Andheri,samosa,4,80', '3104,Mumbai-Andheri,misal pav,2,140', '5101,Thane-West,thali,10,1500']`, message: { en: 'Hidden lake: 3101 appears twice (keep one), " 80" must be written as 80, and -160 is not a valid amount.', mr: 'लपवलेला lake: 3101 दोनदा आहे (एकच ठेवा), " 80" हा 80 म्हणून लिहायला हवा, आणि -160 वैध amount नाही.' } },
              ],
            },
          ],
          mustNotUse: [{ pattern: 'uuid4|time\\.time\\(|datetime\\.now|\\.now\\(', message: { en: 'No uuid or clock in the output key: the same day must always produce the same key.', mr: 'output key मध्ये uuid किंवा घड्याळ नको: एकाच दिवसाने नेहमी तीच key तयार व्हायला हवी.' } }],
          hints: [
            { en: 'Press Run on the starter and open the AWS console panel: two different clean files for the same day. That is the doubled report.', mr: 'starter वर Run दाबा आणि AWS console panel उघडा: एकाच दिवसाच्या दोन वेगळ्या clean files. हाच दुप्पट report.' },
            { en: 'amount = row["amount"].strip(); if not amount.isdigit(): continue. "-160".isdigit() is False, "80".isdigit() is True. Then if row["order_id"] in seen: continue, else seen.add(...).', mr: 'amount = row["amount"].strip(); if not amount.isdigit(): continue. "-160".isdigit() False आहे, "80".isdigit() True. मग if row["order_id"] in seen: continue, नाहीतर seen.add(...).' },
            { en: 'The key must depend only on the day: partition("clean", "orders", day) + "part-0000.csv". The second run then overwrites the same object.', mr: 'key फक्त दिवसावर अवलंबून हवी: partition("clean", "orders", day) + "part-0000.csv". मग दुसरा run तोच object overwrite करतो.' },
            { en: "        amount = row['amount'].strip()\n        if not amount.isdigit():\n            continue\n        if row['order_id'] in seen:\n            continue\n        seen.add(row['order_id'])\n        row['amount'] = amount\n        good.append(row)\n    ...\n    key = partition('clean', 'orders', day) + 'part-0000.csv'", mr: "        amount = row['amount'].strip()\n        if not amount.isdigit():\n            continue\n        if row['order_id'] in seen:\n            continue\n        seen.add(row['order_id'])\n        row['amount'] = amount\n        good.append(row)\n    ...\n    key = partition('clean', 'orders', day) + 'part-0000.csv'" },
          ],
          successLine: { en: 'Run it once, run it five times: one clean file, the same numbers. Finance can sleep.', mr: 'एकदा चालवा, पाच वेळा चालवा: एकच clean file, तेच आकडे. finance शांत झोपू शकतो.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Analysts run SELECT city, SUM(amount) FROM orders GROUP BY city on a table with 8 columns. Press Run: the code stores the same 3,000 orders as a row file (CSV) and column by column (the idea behind Parquet), and prints how many bytes the query needs in each. Why does a columnar format like Parquet make this query cheaper in Athena?', mr: 'analysts 8 columns असलेल्या table वर SELECT city, SUM(amount) FROM orders GROUP BY city चालवतात. Run दाबा: code त्याच 3,000 orders एकदा row file (CSV) म्हणून आणि एकदा column नुसार (Parquet मागची कल्पना) ठेवतो, आणि query ला प्रत्येकात किती bytes लागतात ते print करतो. Parquet सारखा columnar format Athena मध्ये ही query स्वस्त का करतो?' },
          pythonSandbox: {
            code: `import csv, io, json

header = ['order_id', 'shop', 'city', 'item', 'qty', 'amount', 'payment', 'customer_phone']
shops = [('Pune-FC', 'Pune'), ('Nagpur-Sitabuldi', 'Nagpur'), ('Mumbai-Andheri', 'Mumbai')]
items = [('masala chai', 20), ('vada pav', 25), ('thali', 150), ('poha', 30)]
rows = []
for i in range(3000):
    shop, city = shops[i % 3]
    item, price = items[i % 4]
    qty = 1 + i % 3
    rows.append({'order_id': 100000 + i, 'shop': shop, 'city': city, 'item': item, 'qty': qty,
                 'amount': price * qty, 'payment': 'UPI' if i % 2 else 'cash', 'customer_phone': f'98{i:08d}'})

buf = io.StringIO()
writer = csv.DictWriter(buf, fieldnames=header)
writer.writeheader()
writer.writerows(rows)
row_bytes = len(buf.getvalue())

columns = {name: [r[name] for r in rows] for name in header}
needed = len(json.dumps(columns['city'])) + len(json.dumps(columns['amount']))

print('query: SELECT city, SUM(amount) FROM orders GROUP BY city')
print('row file (CSV), bytes read :', f'{row_bytes:,}')
print('two columns only, bytes read:', f'{needed:,}')
print('distinct cities in 3,000 rows:', len(set(columns['city'])))
`,
          },
          options: [
            { en: 'Parquet files are always smaller because they drop rows that look like duplicates', mr: 'Parquet files नेहमी लहान असतात कारण duplicate सारख्या दिसणाऱ्या rows त्या काढून टाकतात' },
            { en: 'Athena charges per query, not per byte, so the format only changes speed', mr: 'Athena प्रत्येक query चे पैसे घेतो, byte चे नाही, म्हणून format फक्त वेग बदलतो' },
            { en: 'CSV cannot be queried by Athena at all', mr: 'Athena CSV वर query करूच शकत नाही' },
            { en: 'Columns are stored together, so the engine reads only city and amount and skips the other six; repeated values like 3 cities compress very well; and Athena bills per byte scanned ($5 per TB)', mr: 'columns एकत्र ठेवलेले असतात, म्हणून engine फक्त city आणि amount वाचतो आणि बाकी सहा सोडतो; 3 शहरांसारख्या पुन्हा पुन्हा येणाऱ्या values खूप छान compress होतात; आणि Athena scan केलेल्या प्रत्येक byte चे पैसे घेतो (प्रति TB $5)' },
          ],
          correct: [3],
          explain: { en: 'In a row file every byte of every row must be read to get two fields. A columnar file reads just the needed columns, and real Parquet also compresses each column (3 distinct cities in 3,000 rows shrink to almost nothing) and keeps min/max statistics so whole blocks can be skipped. Since Athena bills by data scanned, less scanned means a smaller bill and a faster query; add date partitions and it reads one day of two columns. Athena can query CSV and JSON too, just less efficiently.', mr: 'row file मध्ये दोन fields मिळवायला प्रत्येक row चा प्रत्येक byte वाचावा लागतो. columnar file फक्त हवे ते columns वाचते, आणि खरं Parquet प्रत्येक column compress पण करतं (3,000 rows मधली 3 वेगळी शहरं जवळजवळ शून्य जागा घेतात) आणि min/max statistics ठेवतं, म्हणजे पूर्ण blocks सोडता येतात. Athena scan केलेल्या data नुसार पैसे घेतो, म्हणून कमी scan म्हणजे कमी bill आणि वेगवान query; त्यात तारखेचे partitions जोडले तर तो दोन columns चा एकच दिवस वाचतो. Athena CSV आणि JSON वरही query करू शकतो, फक्त कमी कार्यक्षमतेने.' },
          hints: [
            { en: 'Compare the two byte counts. The query needs only 2 of 8 columns.', mr: 'दोन्ही byte आकडे तुलना करा. query ला 8 पैकी फक्त 2 columns लागतात.' },
            { en: 'Look at the last line: very few distinct values in a column is exactly what compression loves.', mr: 'शेवटची ओळ पाहा: column मध्ये खूप कमी वेगळ्या values असणं हेच compression ला सगळ्यात आवडतं.' },
          ],
          successLine: { en: 'Partition by date, store as Parquet: the Gremlin\'s favourite Athena bill shrinks.', mr: 'तारखेनुसार partition, Parquet म्हणून साठवा: Gremlin चं आवडतं Athena bill आकसतं.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Which key layout lets Athena prune partitions by date and lets MSCK REPAIR TABLE discover them?', mr: 'कोणती key मांडणी Athena ला तारखेनुसार partitions छाटू देते आणि MSCK REPAIR TABLE ला ते शोधू देते?' },
        options: [
          'raw/orders/pune-24-11-2026.csv',
          'raw/orders/2026-11-24/pune.csv',
          'raw/pune/orders_20261124_final_v2.csv',
          'raw/orders/year=2026/month=11/day=24/pune.csv',
        ],
        answer: 3,
        explain: { en: 'Hive-style key=value folders become partition columns, so a WHERE on year, month and day reads one prefix. MSCK REPAIR TABLE only discovers Hive-style partitions; other layouts need ALTER TABLE ADD PARTITION or partition projection.', mr: 'Hive-style key=value folders partition columns बनतात, म्हणून year, month आणि day वरचा WHERE एकच prefix वाचतो. MSCK REPAIR TABLE फक्त Hive-style partitions शोधतो; इतर मांडणीसाठी ALTER TABLE ADD PARTITION किंवा partition projection लागतं.' },
      },
      {
        q: { en: 'A 40-column orders table is queried with SELECT city, SUM(amount). Why is Parquet cheaper than CSV in Athena?', mr: '40 columns असलेल्या orders table वर SELECT city, SUM(amount) चालवली जाते. Athena मध्ये CSV पेक्षा Parquet स्वस्त का?' },
        options: [
          { en: 'Parquet files are encrypted, and encrypted data is billed at a lower rate', mr: 'Parquet files encrypted असतात, आणि encrypted data चा दर कमी असतो' },
          { en: 'Parquet is columnar and compressed, so Athena reads only the city and amount columns, and Athena bills by data scanned', mr: 'Parquet columnar आणि compressed आहे, म्हणून Athena फक्त city आणि amount columns वाचतो, आणि Athena scan केलेल्या data नुसार पैसे घेतो' },
          { en: 'Parquet is stored outside S3, where storage is free', mr: 'Parquet S3 बाहेर ठेवलं जातं, जिथे storage फुकट आहे' },
          { en: 'CSV queries are always run twice', mr: 'CSV queries नेहमी दोनदा चालतात' },
        ],
        answer: 1,
        explain: { en: 'Athena charges per byte scanned ($5 per TB, 10 MB minimum). Columnar storage plus compression means it scans a small fraction of the data; AWS cites 30% to 90% savings from compressing, partitioning and converting to columnar formats.', mr: 'Athena scan केलेल्या प्रत्येक byte चे पैसे घेतो (प्रति TB $5, किमान 10 MB). columnar storage आणि compression मुळे तो data चा छोटासा भागच scan करतो; compression, partitioning आणि columnar formats मध्ये रूपांतर यांनी 30% ते 90% बचत होते असं AWS सांगतं.' },
      },
      {
        q: { en: 'A daily job was retried after a timeout, and the sales total for that day doubled. What is the best fix?', mr: 'timeout नंतर रोजचा job पुन्हा चालवला गेला, आणि त्या दिवसाची विक्रीची बेरीज दुप्पट झाली. सगळ्यात चांगला उपाय कोणता?' },
        options: [
          { en: 'Turn off retries in the scheduler', mr: 'scheduler मधले retries बंद करा' },
          { en: 'Add the current timestamp to each output file name so files never clash', mr: 'प्रत्येक output file च्या नावात सध्याचा timestamp जोडा म्हणजे files कधीच भिडणार नाहीत' },
          { en: 'Make the job idempotent: write each day to a deterministic key (or overwrite the whole partition), so a rerun replaces the output instead of adding to it', mr: 'job idempotent करा: प्रत्येक दिवस deterministic key वर लिहा (किंवा पूर्ण partition overwrite करा), म्हणजे rerun output मध्ये भर घालण्याऐवजी तो बदलतो' },
          { en: 'Ask analysts to divide that day\'s total by two', mr: 'analysts ना त्या दिवसाची बेरीज दोनने भागायला सांगा' },
        ],
        answer: 2,
        explain: { en: 'Retries are normal and good; the output must tolerate them. A timestamp in the name is exactly what caused the duplicate. Same input, same key, same result. For "write once" outputs S3 also supports conditional writes (If-None-Match), which refuse to overwrite an existing key.', mr: 'retries सामान्य आणि चांगले असतात; output ने ते सहन करायला हवेत. नावातला timestamp हेच duplicate चं कारण होतं. तेच input, तीच key, तोच परिणाम. "एकदाच लिहा" outputs साठी S3 conditional writes (If-None-Match) पण देतं, जे आधीची key overwrite करायला नकार देतात.' },
      },
      {
        q: { en: 'The app writes one 2 KB JSON file per order: 50,000 files a day. Athena queries on it are slow. What do you do?', mr: 'app प्रत्येक order ची एक 2 KB JSON file लिहितं: दिवसाला 50,000 files. त्यावरच्या Athena queries हळू आहेत. तुम्ही काय कराल?' },
        options: [
          { en: 'Compact the small files into a few larger files per partition (aim for around 128 MB or more), ideally as Parquet, with a scheduled job or a CTAS query', mr: 'छोट्या files प्रत्येक partition मध्ये थोड्या मोठ्या files मध्ये एकत्र करा (साधारण 128 MB किंवा जास्त), शक्यतो Parquet म्हणून, scheduled job किंवा CTAS query ने' },
          { en: 'Partition by order_id so each file gets its own partition', mr: 'order_id नुसार partition करा म्हणजे प्रत्येक file ला स्वतःचा partition मिळेल' },
          { en: 'Split each file into even smaller files', mr: 'प्रत्येक file आणखी छोट्या files मध्ये तोडा' },
          { en: 'Nothing: file count never affects S3 or Athena', mr: 'काहीच नाही: files ची संख्या S3 किंवा Athena वर कधीच परिणाम करत नाही' },
        ],
        answer: 0,
        explain: { en: 'Each file costs a request and planning overhead, so many tiny files slow queries and can even hit S3 request limits ("reduce your request rate"). Fewer, larger, splittable files fix it. Partitioning by order_id is over-partitioning and makes it far worse.', mr: 'प्रत्येक file साठी एक request आणि planning चा खर्च लागतो, म्हणून अनेक छोट्या files queries हळू करतात आणि S3 request मर्यादाही गाठू शकतात ("reduce your request rate"). थोड्या, मोठ्या, splittable files हा उपाय. order_id नुसार partition म्हणजे over-partitioning, त्याने परिस्थिती आणखी बिघडते.' },
      },
    ],
    recap: { line: { en: 'Raw stays raw, clean and curated sit on top. Partition as year=/month=/day= so engines prune, prefer Parquet over CSV, compact small files, and write deterministic keys so every rerun gives the same lake.', mr: 'raw जसाच्या तसा, त्यावर clean आणि curated. engines छाटू शकतील असे year=/month=/day= partitions, CSV पेक्षा Parquet, छोट्या files एकत्र, आणि deterministic keys म्हणजे प्रत्येक rerun ला तोच lake.' }, icon: '🗺️' },
    interview: [
      {
        q: { en: 'How would you design an S3 data lake for ChaiCart\'s daily sales files?', mr: 'ChaiCart च्या रोजच्या sales files साठी तुम्ही S3 data lake ची रचना कशी कराल?' },
        a: { en: 'I would use three zones. Raw (bronze) keeps every shop file exactly as received under raw/orders/year=YYYY/month=MM/day=DD/, never edited, with versioning on. A daily job validates, de-duplicates and types the data into clean (silver) as Parquet, partitioned the same way, and builds curated (gold) tables such as daily_sales per shop for finance. Tables are registered in the Glue Data Catalog so Athena can query them, and IAM keeps writers and readers apart: ingestion writes raw, analysts read curated. Every job is idempotent, writing deterministic keys per partition, so a retry or a backfill gives the same result. Later, lifecycle rules can move old raw files to cheaper storage classes.', mr: 'मी तीन zones वापरेन. Raw (bronze) मध्ये प्रत्येक दुकानाची file जशी आली तशीच raw/orders/year=YYYY/month=MM/day=DD/ खाली, कधीही न बदलता, versioning चालू ठेवून. रोजचा job data तपासतो, duplicates काढतो आणि योग्य types देऊन clean (silver) मध्ये Parquet म्हणून लिहितो, त्याच पद्धतीने partition करून, आणि finance साठी प्रत्येक दुकानाचा daily_sales सारखे curated (gold) tables बनवतो. Tables Glue Data Catalog मध्ये नोंदवले जातात म्हणजे Athena त्यांच्यावर query करू शकतो, आणि IAM लिहिणारे आणि वाचणारे वेगळे ठेवतो: ingestion raw मध्ये लिहितो, analysts curated वाचतात. प्रत्येक job idempotent असतो, प्रत्येक partition साठी deterministic keys लिहितो, म्हणून retry किंवा backfill ने तोच परिणाम येतो. नंतर lifecycle rules जुन्या raw files स्वस्त storage classes मध्ये हलवू शकतात.' },
      },
      {
        q: { en: 'What is partition pruning, and why use Hive-style partitions?', mr: 'partition pruning म्हणजे काय, आणि Hive-style partitions का वापरायचे?' },
        a: { en: 'Partition pruning means the query engine skips whole partitions that cannot match the WHERE clause, so it lists and reads far less data. With Hive-style keys like year=2026/month=11/day=24, Athena, Glue and Spark treat year, month and day as columns, so WHERE year=\'2026\' AND month=\'11\' AND day=\'24\' reads one prefix out of hundreds. MSCK REPAIR TABLE can discover Hive-style partitions automatically; non-Hive layouts need ALTER TABLE ADD PARTITION, and for many partitions partition projection avoids catalog lookups entirely. In Athena, fewer bytes scanned is also a smaller bill. The gotcha: the query must filter on the partition columns, otherwise it still scans everything.', mr: 'partition pruning म्हणजे WHERE clause शी जुळूच शकत नाहीत असे पूर्ण partitions query engine सोडून देतो, म्हणून तो खूप कमी data list करतो आणि वाचतो. year=2026/month=11/day=24 सारख्या Hive-style keys सह Athena, Glue आणि Spark year, month आणि day ला columns मानतात, म्हणून WHERE year=\'2026\' AND month=\'11\' AND day=\'24\' शेकडो पैकी एकच prefix वाचतो. MSCK REPAIR TABLE Hive-style partitions आपोआप शोधू शकतो; non-Hive मांडणीसाठी ALTER TABLE ADD PARTITION लागतं, आणि खूप partitions असतील तर partition projection catalog lookups पूर्णपणे टाळतं. Athena मध्ये कमी bytes scan म्हणजे कमी bill सुद्धा. गोम: query ने partition columns वर filter करायलाच हवा, नाहीतर ती तरीही सगळं scan करते.' },
      },
      {
        q: { en: 'CSV vs JSON vs Parquet: which do you use where?', mr: 'CSV vs JSON vs Parquet: कुठे कोणता वापरता?' },
        a: { en: 'I keep whatever the source sends in raw, often CSV or JSON, because raw must be an exact copy. CSV is simple but untyped, and the engine reads every byte of every row; gzip-compressed CSV is also not splittable, so one big file is processed by one worker. JSON handles nested data but is verbose. For clean and curated I write Parquet: columnar, typed, compressed per column, with statistics, and always splittable, so SELECT city, SUM(amount) reads two columns and skips blocks. Athena bills $5 per TB scanned, and AWS cites 30% to 90% savings from compressing, partitioning and converting to columnar formats. CSV still wins for small files that humans open, like a report emailed to Sam.', mr: 'source जे पाठवतो ते मी raw मध्ये जसंच्या तसं ठेवते, बहुतेक CSV किंवा JSON, कारण raw ही अचूक प्रत हवी. CSV साधी पण types नसलेली, आणि engine प्रत्येक row चा प्रत्येक byte वाचतो; gzip केलेली CSV splittable पण नसते, म्हणून एक मोठी file एकच worker process करतो. JSON nested data हाताळतो पण पसरट असतो. clean आणि curated साठी मी Parquet लिहिते: columnar, typed, प्रत्येक column compressed, statistics सह, आणि नेहमी splittable, म्हणून SELECT city, SUM(amount) दोनच columns वाचतो आणि blocks सोडतो. Athena प्रति TB scan ला $5 घेतो, आणि compression, partitioning आणि columnar formats मध्ये रूपांतराने 30% ते 90% बचत होते असं AWS सांगतं. माणसं उघडतात अशा छोट्या files साठी, उदा. Sam ला email केलेला report, CSV अजूनही योग्य.' },
      },
      {
        q: { en: 'What is the small-files problem, and how do you fix it?', mr: 'small-files problem म्हणजे काय, आणि तो कसा सोडवता?' },
        a: { en: 'Engines like Athena and Spark pay a fixed cost per file: a request to S3, metadata, opening the file. Millions of kilobyte files make queries slow, increase request costs, and can even trigger S3 throttling ("reduce your request rate"). It usually comes from streaming or per-event writes, or from over-partitioning, such as partitioning by hour or by shop when each partition holds a few KB. The fix is compaction: a scheduled Glue or Spark job, or an Athena CTAS query, rewrites each partition into a few larger Parquet files, aiming for around 128 MB or more. Then I also fix the cause, by buffering writes or choosing a coarser partition key. At ChaiCart, per-order receipt JSONs get compacted into one Parquet file per day.', mr: 'Athena आणि Spark सारखे engines प्रत्येक file साठी एक ठराविक खर्च भरतात: S3 ला request, metadata, file उघडणं. लाखो KB च्या files queries हळू करतात, requests चा खर्च वाढवतात, आणि S3 throttling ("reduce your request rate") सुद्धा आणू शकतात. हे बहुतेक streaming किंवा प्रत्येक event वर write केल्याने येतं, किंवा over-partitioning मुळे, उदा. प्रत्येक partition मध्ये काही KB असताना तासानुसार किंवा दुकानानुसार partition. उपाय compaction: scheduled Glue किंवा Spark job, किंवा Athena CTAS query, प्रत्येक partition थोड्या मोठ्या Parquet files मध्ये पुन्हा लिहितो, साधारण 128 MB किंवा जास्त. मग मी कारणही दुरुस्त करते, writes buffer करून किंवा जाड partition key निवडून. ChaiCart मध्ये प्रत्येक order च्या receipt JSONs दिवसाला एका Parquet file मध्ये compact होतात.' },
      },
      {
        q: { en: 'How do you choose partition keys?', mr: 'partition keys कशा निवडता?' },
        a: { en: 'I partition by the columns most queries filter on, which for sales data is almost always the date, written as year=/month=/day= with zero padding. The partition should be big enough to hold reasonably sized files: if a day holds only a few MB, monthly partitions may be better. I avoid high-cardinality keys like order_id or customer_phone, which create millions of tiny partitions and the small-files problem. A second level such as city=pune helps only if queries really filter by city and each partition stays large. And partitions are part of the key, so changing the scheme later means rewriting data: I decide it with the analysts up front.', mr: 'बहुतेक queries ज्या columns वर filter करतात त्यानुसार मी partition करते, sales data साठी जवळजवळ नेहमी तारीख, शून्याने भरलेलं year=/month=/day= म्हणून. partition इतका मोठा हवा की त्यात योग्य आकाराच्या files बसतील: एका दिवसात फक्त काही MB असतील तर महिन्याचे partitions चांगले. order_id किंवा customer_phone सारख्या high-cardinality keys मी टाळते, त्या लाखो छोटे partitions आणि small-files problem तयार करतात. city=pune सारखी दुसरी पातळी तेव्हाच उपयोगी जेव्हा queries खरंच city वर filter करतात आणि प्रत्येक partition मोठा राहतो. आणि partitions key चा भाग असतात, म्हणून नंतर रचना बदलणं म्हणजे data पुन्हा लिहिणं: मी ते analysts सोबत आधीच ठरवते.' },
      },
      {
        q: { en: 'A pipeline was rerun and the totals doubled. Why, and how do you make it idempotent?', mr: 'pipeline पुन्हा चालवली आणि बेरजा दुप्पट झाल्या. का, आणि ती idempotent कशी करता?' },
        a: { en: 'Each run wrote its output under a new name, a timestamp or uuid, so the second run added a copy next to the first and the reader summed both. Idempotent means running the job once or five times leaves the same result. I make output keys deterministic from the input, for example clean/orders/year=2026/month=11/day=24/part-0000.csv, or I write the whole partition to a staging prefix and then replace the old partition. Inside the data I de-duplicate on a business key like order_id, because sources redeliver files. For outputs that must be written only once, S3 conditional writes with If-None-Match fail with 412 if the key already exists. That is exactly the bug ChaiCart had when the scheduler retried a timed-out job.', mr: 'प्रत्येक run ने आपलं output नव्या नावाने लिहिलं, timestamp किंवा uuid, म्हणून दुसऱ्या run ने पहिल्याशेजारी एक प्रत जोडली आणि वाचणाऱ्याने दोन्हींची बेरीज केली. idempotent म्हणजे job एकदा किंवा पाच वेळा चालवला तरी तोच परिणाम. मी output keys input वरून deterministic करते, उदा. clean/orders/year=2026/month=11/day=24/part-0000.csv, किंवा पूर्ण partition staging prefix मध्ये लिहून मग जुना partition बदलते. data च्या आत मी order_id सारख्या business key वर de-duplicate करते, कारण sources files पुन्हा पाठवतात. फक्त एकदाच लिहायच्या outputs साठी If-None-Match सह S3 conditional writes key आधीच असेल तर 412 ने अपयशी होतात. scheduler ने timeout झालेला job पुन्हा चालवला तेव्हा ChaiCart मध्ये नेमका हाच bug आला.' },
      },
      {
        q: { en: 'Why keep the raw zone immutable?', mr: 'raw zone न बदलणारा का ठेवायचा?' },
        a: { en: 'Raw is the single source of truth: the exact bytes the source sent. If a cleaning rule had a bug, say it dropped valid UPI orders, I fix the code and reprocess the affected days from raw, and every downstream table can be rebuilt. If raw had been edited in place, that history would be gone. It also helps audits and debugging, because I can show what a shop really sent on a given day. In practice, jobs get read-only access to raw, versioning protects against accidental overwrites and deletes, and lifecycle rules move old raw data to cheaper storage instead of deleting it. Anything derived goes to clean or curated, never back into raw.', mr: 'raw हा single source of truth आहे: source ने पाठवलेले नेमके bytes. एखाद्या cleaning rule मध्ये bug असेल, समजा त्याने वैध UPI orders वगळल्या, तर मी code दुरुस्त करते आणि बिघडलेले दिवस raw मधून पुन्हा process करते, आणि खालचा प्रत्येक table पुन्हा बनवता येतो. raw जागेवरच बदलला असता तर तो इतिहास गेला असता. audits आणि debugging मध्येही मदत होते, कारण एखाद्या दिवशी दुकानाने खरंच काय पाठवलं ते मी दाखवू शकते. प्रत्यक्षात jobs ना raw वर फक्त read access असतो, versioning चुकून झालेल्या overwrite आणि delete पासून वाचवतं, आणि lifecycle rules जुना raw data delete करण्याऐवजी स्वस्त storage मध्ये हलवतात. तयार केलेलं सगळं clean किंवा curated मध्ये जातं, raw मध्ये परत कधीच नाही.' },
      },
      {
        q: { en: 'How does S3\'s strong consistency affect data lake pipelines?', mr: 'S3 च्या strong consistency चा data lake pipelines वर काय परिणाम होतो?' },
        a: { en: 'Since December 2020, S3 gives strong read-after-write consistency for PUT and DELETE, and listings reflect writes immediately, in all Regions at no extra cost. So when the ingestion step writes a file and the next step lists the partition, the file is there, and an overwritten object is never read in its old version afterwards. Older pipelines had to work around listings that lagged behind writes; that is no longer needed. What it does not solve is concurrency: two jobs writing the same key still race and the last write wins, so I avoid concurrent writers to one partition or use conditional writes. It also does not replace a table format\'s transactions: readers can still see a partition half-rewritten while a job replaces many files.', mr: 'December 2020 पासून S3 PUT आणि DELETE साठी strong read-after-write consistency देतं, आणि listings मध्ये writes लगेच दिसतात, सगळ्या Regions मध्ये, जास्तीचा खर्च नाही. म्हणून ingestion पायरीने file लिहिली आणि पुढच्या पायरीने partition list केला, तर file तिथे असते, आणि overwrite झालेला object नंतर जुन्या रूपात कधीच वाचला जात नाही. जुन्या pipelines ना writes च्या मागे पडणाऱ्या listings साठी workarounds करावे लागायचे; आता त्याची गरज नाही. ते concurrency सोडवत नाही: एकाच key वर लिहिणारे दोन jobs अजूनही शर्यत करतात आणि शेवटचा write जिंकतो, म्हणून मी एका partition वर एकाच वेळी दोन writers टाळते किंवा conditional writes वापरते. ते table format च्या transactions ची जागाही घेत नाही: job अनेक files बदलत असताना readers ना अर्धवट बदललेला partition दिसू शकतो.' },
      },
    ],
  },
]
