import type { Lesson } from './types.ts'

// Python 2 (KisanMandi), second half: cleaning messy mandi files, grouping and summarising,
// and the boss: a small ETL pipeline that survives the Gremlin's worst night.

// ───────────────────────── shared data: Y2.4 Cleaning data

const NASHIK_RAW = `market,commodity,date,price
Nashik,Onion ,05/11/2026,2400
nashik,ONION,2026-11-05,2400
Nashik,kanda,06/11/2026,2550
Nashik, Tomato,5-Nov-2026,1600
NASHIK,tomato,06/11/2026,
Nashik,Batata,2026-11-05,1900
Nashik,potato ,6-Nov-2026,1950
Nashik,Onion,07/11/2026, 2480
`

const NASHIK_RAW_DAY2 = `market,commodity,date,price
Nashik,TAMATAR,08/11/2026,1680
Nashik,kanda ,2026-11-08,2500
nashik,Onion,8-Nov-2026,2500
Nashik,potato,08/11/2026,
Nashik,Tomato ,2026-11-08,1680
Nashik,Batata,09/11/2026,
NASHIK,onion,09/11/2026,2520
`

const CLEAN_HELPERS = `import csv, os
from datetime import datetime

ALIASES = {'kanda': 'onion', 'tamatar': 'tomato', 'batata': 'potato'}
FORMATS = ['%Y-%m-%d', '%d/%m/%Y', '%d-%b-%Y']

def clean_name(text):
    name = text.strip().lower()
    return ALIASES.get(name, name)

def to_iso(text):
    for fmt in FORMATS:
        try:
            return datetime.strptime(text.strip(), fmt).date().isoformat()
        except ValueError:
            pass
    return None
`

const CLEAN_ROW = `
def clean_row(row):
    price = row['price'].strip()
    if price == '':
        price = None
    else:
        price = int(price)
    return {
        'market': row['market'].strip().title(),
        'commodity': clean_name(row['commodity']),
        'date': to_iso(row['date']),
        'price': price,
    }
`

// ───────────────────────── shared data: Y2.5 Grouping and summarising

const PRICES = `market,commodity,date,price
Pune,onion,2026-11-05,2300
Pune,tomato,2026-11-05,1500
Pune,potato,2026-11-05,1800
Nashik,onion,2026-11-05,2400
Nashik,tomato,2026-11-05,1650
Lasalgaon,onion,2026-11-05,2550
Lasalgaon,onion,2026-11-06,2610
Nashik,onion,2026-11-06,2450
Pune,onion,2026-11-06,2280
Nagpur,potato,2026-11-05,1700
Nagpur,onion,2026-11-05,2350
Nashik,tomato,2026-11-06,1700
Nagpur,tomato,2026-11-06,
`

const PRICES_DAY2 = `market,commodity,date,price
Solapur,onion,2026-11-07,2500
Pune,onion,2026-11-07,2320
Pune,potato,2026-11-07,1820
Solapur,potato,2026-11-07,
Nashik,onion,2026-11-07,2460
Nashik,tomato,2026-11-07,1720
Solapur,onion,2026-11-08,2700
Pune,tomato,2026-11-07,1480
Nashik,potato,2026-11-07,1900
Pune,potato,2026-11-08,1840
Nagpur,potato,2026-11-07,1690
`

const READ_PRICES = `import csv
from collections import Counter, defaultdict

with open('data/prices.csv', newline='', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))
`

// ───────────────────────── shared data: Y2.6 Boss, The Mandi Files

const B_PUNE = `market,commodity,date,price
Pune,Onion,05/11/2026,2300
Pune,TOMATO ,05/11/2026,1500
Pune,batata,05/11/2026,1800
Pune,onion,2026-11-05,2300
Pune,Garlic,05/11/2026,9000
Pune,tomato,31/11/2026,1550
`
const B_NASHIK = `market,commodity,date,price
Nashik,kanda,2026-11-05,2400
Nashik,Tomato,2026-11-05,
Nashik,potato,2026-11-05,-1900
Nashik, Onion,5-Nov-2026,2400
nashik,tamatar,2026-11-05,1650
`
const B_LASALGAON = `[
  {"mandi": "Lasalgaon", "crop": "Kanda", "day": "05-Nov-2026", "rate": "₹2,550"},
  {"mandi": "Lasalgaon", "crop": "potato", "day": "05/11/2026", "rate": "1,950"},
  {"mandi": "Lasalgaon", "crop": "tomato", "day": "2026-11-05", "rate": "abc"}
]
`
const B_NAGPUR = `market,commodity,date,price
Nagpur,Onion,05/11/2026,2350
Nagpur,aloo,05/11/2026,1700
Nagpur,tomato,05-Nov-2026,0
Nagpur,Tomato,2026-11-05,1580
`
const B_SOLAPUR_OK = `[
  {"mandi": "Solapur", "crop": "onion", "day": "05-Nov-2026", "rate": "2,380"},
  {"mandi": "Solapur", "crop": "Batata", "day": "05/11/2026", "rate": "1,760"}
]
`
const B_SOLAPUR_BROKEN = `[
  {"mandi": "Solapur", "crop": "onion", "day": "05-Nov-2026", "ra`
const B_DAY2 = {
  'data/in/pune.csv': `market,commodity,date,price
Pune,onion,06/11/2026,2280
Pune,Tamatar,06/11/2026,1520
Pune,POTATO,6-Nov-2026,
Pune,Brinjal,06/11/2026,2100
`,
  'data/in/nashik.csv': `market,commodity,date,price
Nashik,Onion ,2026-11-06,2450
Nashik,tomato,06.11.2026,1700
Nashik,kanda,06/11/2026,2450
`,
  'data/in/lasalgaon.json': `[
  {"mandi": "Lasalgaon", "crop": "onion", "day": "06-Nov-2026", "rate": "2,610"},
  {"mandi": "Lasalgaon", "crop": "aloo", "day": "06/11/2026", "rate": "₹1,980"},
  {"mandi": "lasalgaon", "crop": "Kanda", "day": "2026-11-06", "rate": 2610}
]
`,
}
const B_GREM_NASHIK = `market,commodity,date,price
Nashik,kanda,2026-11-05,2400
Nashik,Tomato,2026-11-05,1650
#### gremlin was here ####
Nashik,potato,2026-1
`
const B_GREM_LASALGAON = `[
  {"mandi": "Lasalgaon", "crop": "Kanda", "day": "05-Nov-2026", "rate": "₹2,550"},
  {"mandi": "Lasalgaon", "crop": "potato", "day": "05/11/2026"},
  {"mandi": "Lasalgaon", "crop": "tomato", "day": "2026-11-05", "rate": "abc"}
]
`

const B_FILES = { 'data/in/pune.csv': B_PUNE, 'data/in/nashik.csv': B_NASHIK, 'data/in/lasalgaon.json': B_LASALGAON }
const B_GREM_FILES = { 'data/in/pune.csv': B_PUNE, 'data/in/nashik.csv': B_GREM_NASHIK, 'data/in/lasalgaon.json': B_GREM_LASALGAON, 'data/in/solapur.json': B_SOLAPUR_BROKEN }

const B_HEAD = `import csv, json, os
from pathlib import Path
from datetime import datetime
from collections import Counter

ALIASES = {'kanda': 'onion', 'tamatar': 'tomato', 'batata': 'potato', 'aloo': 'potato'}
KNOWN = {'onion', 'tomato', 'potato'}
FORMATS = ['%Y-%m-%d', '%d/%m/%Y', '%d-%b-%Y']
`

const B_EXTRACT = `
def extract(folder):
    rows = []
    for path in sorted(Path(folder).glob('*.csv')):
        with open(path, newline='', encoding='utf-8') as f:
            for r in csv.DictReader(f):
                rows.append({'source': path.name, 'market': r['market'], 'commodity': r['commodity'],
                             'date': r['date'], 'price': r['price']})
    for path in sorted(Path(folder).glob('*.json')):
        with open(path, encoding='utf-8') as f:
            for item in json.load(f):
                rows.append({'source': path.name, 'market': item['mandi'], 'commodity': item['crop'],
                             'date': item['day'], 'price': item['rate']})
    return rows
`

const B_TO_ISO = `
def to_iso(text):
    for fmt in FORMATS:
        try:
            return datetime.strptime(text.strip(), fmt).date().isoformat()
        except ValueError:
            pass
    return None
`

const B_CLEAN_ROW = `
def clean_row(row):
    name = row['commodity'].strip().lower()
    commodity = ALIASES.get(name, name)
    if commodity not in KNOWN:
        return None, 'unknown commodity'
    date = to_iso(row['date'])
    if date is None:
        return None, 'bad date'
    text = str(row['price']).replace('₹', '').replace(',', '').strip()
    if text == '':
        return None, 'missing price'
    try:
        price = int(text)
    except ValueError:
        return None, 'bad price'
    if price <= 0:
        return None, 'bad price'
    market = row['market'].strip().title()
    return {'date': date, 'market': market, 'commodity': commodity, 'price': price}, None
`

const B_TRANSFORM = `
def transform(rows):
    good, rejects, seen = [], [], set()
    for row in rows:
        clean, reason = clean_row(row)
        if reason is None:
            key = (clean['date'], clean['market'], clean['commodity'])
            if key in seen:
                reason = 'duplicate'
            else:
                seen.add(key)
                good.append(clean)
        if reason is not None:
            bad = dict(row)
            bad['reason'] = reason
            rejects.append(bad)
    return good, rejects
`

const B_VALIDATE = `
def validate(read_count, good, rejects):
    assert read_count == len(good) + len(rejects), f'read {read_count} rows but good + rejected = {len(good) + len(rejects)}'
    assert all(r['price'] > 0 for r in good), 'a good row has a price of 0 or less'
`

const B_LOAD = `
def load(good, rejects):
    os.makedirs('out', exist_ok=True)
    good = sorted(good, key=lambda r: (r['date'], r['market'], r['commodity']))
    with open('out/daily_prices.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['date', 'market', 'commodity', 'price'])
        writer.writeheader()
        writer.writerows(good)
    with open('out/rejects.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['source', 'market', 'commodity', 'date', 'price', 'reason'])
        writer.writeheader()
        writer.writerows(rejects)
`

const B_SUMMARY = `
def summary(rows, good, rejects):
    print(f'read: {len(rows)} | good: {len(good)} | rejected: {len(rejects)}')
    for reason, n in sorted(Counter(r['reason'] for r in rejects).items()):
        print(f'- {reason}: {n}')
`

const B_RUN = `
rows = extract('data/in')
good, rejects = transform(rows)
validate(len(rows), good, rejects)
load(good, rejects)
summary(rows, good, rejects)
`

// the hardened versions for the Gremlin's night (step 5)
const B_EXTRACT_SAFE = `
def extract(folder):
    rows = []
    for path in sorted(Path(folder).glob('*.csv')):
        with open(path, newline='', encoding='utf-8') as f:
            for r in csv.DictReader(f):
                rows.append({'source': path.name, 'market': r['market'], 'commodity': r['commodity'],
                             'date': r['date'], 'price': r['price']})
    for path in sorted(Path(folder).glob('*.json')):
        try:
            with open(path, encoding='utf-8') as f:
                items = json.load(f)
        except json.JSONDecodeError:
            print('bad file:', path.name)
            continue
        for item in items:
            rows.append({'source': path.name, 'market': item.get('mandi'), 'commodity': item.get('crop'),
                         'date': item.get('day'), 'price': item.get('rate')})
    return rows
`

const B_TO_ISO_SAFE = `
def to_iso(text):
    for fmt in FORMATS:
        try:
            return datetime.strptime((text or '').strip(), fmt).date().isoformat()
        except ValueError:
            pass
    return None
`

const B_CLEAN_ROW_SAFE = `
def clean_row(row):
    name = (row['commodity'] or '').strip().lower()
    commodity = ALIASES.get(name, name)
    if commodity not in KNOWN:
        return None, 'unknown commodity'
    date = to_iso(row['date'])
    if date is None:
        return None, 'bad date'
    if row['price'] is None or str(row['price']).strip() == '':
        return None, 'missing price'
    text = str(row['price']).replace('₹', '').replace(',', '').strip()
    try:
        price = int(text)
    except ValueError:
        return None, 'bad price'
    if price <= 0:
        return None, 'bad price'
    market = (row['market'] or '').strip().title()
    return {'date': date, 'market': market, 'commodity': commodity, 'price': price}, None
`

const B_STEP2_RUN = `
rows = extract('data/in')
good, rejects = [], []
for row in rows:
    clean, reason = clean_row(row)
    if reason is None:
        good.append(clean)
    else:
        bad = dict(row)
        bad['reason'] = reason
        rejects.append(bad)
print('good:', len(good), '| rejected:', len(rejects))
print(sorted(Counter(r['reason'] for r in rejects).items()))
`

const B_STEP3_RUN = `
rows = extract('data/in')
good, rejects = transform(rows)
validate(len(rows), good, rejects)
print('read:', len(rows), '| good:', len(good), '| rejected:', len(rejects))
`

const RAISES = "__import__('unittest').TestCase().assertRaises(AssertionError, validate, "

const DAILY_BASE = [
  'date,market,commodity,price',
  '2026-11-05,Lasalgaon,onion,2550',
  '2026-11-05,Lasalgaon,potato,1950',
  '2026-11-05,Nashik,onion,2400',
  '2026-11-05,Nashik,tomato,1650',
  '2026-11-05,Pune,onion,2300',
  '2026-11-05,Pune,potato,1800',
  '2026-11-05,Pune,tomato,1500',
]
const pyList = (xs: string[]) => '[' + xs.map((x) => `'${x}'`).join(', ') + ']'
const DAILY = "open('out/daily_prices.csv', encoding='utf-8').read().splitlines()"
const REJECTS = "open('out/rejects.csv', encoding='utf-8').read().splitlines()"

export const py2MoreLessons: Lesson[] = [
  // ───────────────────────── Y2.4 Cleaning data
  {
    id: 'py2-4',
    code: 'Y2.4',
    level: 'intermediate',
    title: { en: 'Cleaning data', mr: 'डेटा साफ करणं' },
    skill: 'strip/lower/title, alias maps, strptime to ISO dates, None for missing, dedupe with a set of keys',
    realLife: {
      place: 'wedding',
      title: { en: 'One guest list from three notebooks', mr: 'तीन वह्यांमधून एक पाहुण्यांची यादी' },
      story: {
        en: 'Meera\'s cousin is getting married, and three relatives each wrote a guest list. Mama wrote "SUNIL PATIL", Mavshi wrote "sunil patil " with a stray space, and Kaka wrote "Sunilrao Patil". One list says the haldi is on 05/12, another says 5 Dec, the third says 2026-12-05. Two phone numbers are blank, and nobody knows if that means "no phone" or "forgot to ask". Meera\'s aunt does not scribble over the three notebooks. She keeps them safe in a drawer, and on a fresh sheet she writes each name one tidy way, uses one date style, leaves a clear gap for unknown numbers, and crosses out guests who appear twice. Only then does she count how many laddoos to order.',
        mr: 'मीराच्या चुलत बहिणीचं लग्न आहे, आणि तीन नातेवाइकांनी आपापली पाहुण्यांची यादी लिहिली. मामांनी लिहिलं "SUNIL PATIL", मावशीने लिहिलं "sunil patil " आणि शेवटी एक जास्तीची space, आणि काकांनी लिहिलं "Sunilrao Patil". एका यादीत हळद 05/12 ला आहे, दुसरीत 5 Dec, तिसरीत 2026-12-05. दोन फोन नंबर रिकामे आहेत, आणि त्याचा अर्थ "फोन नाही" की "विचारायचं राहिलं" हे कोणालाच माहीत नाही. मीराची मावशी त्या तीन वह्यांवर खाडाखोड करत नाही. त्या ती ड्रॉवरमध्ये जपून ठेवते, आणि एका नव्या कागदावर प्रत्येक नाव एकाच नीट पद्धतीने लिहिते, तारखेची एकच पद्धत वापरते, माहीत नसलेल्या नंबरसाठी स्पष्ट जागा सोडते, आणि दोनदा आलेले पाहुणे खोडते. त्यानंतरच ती किती लाडू मागवायचे ते मोजते.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📓', label: 'Three messy lists arrive', mr: 'तीन गोंधळलेल्या याद्या येतात' },
          { icon: '✂️', label: 'Trim spaces, one way to write a name', mr: 'spaces काढा, नाव लिहायची एकच पद्धत' },
          { icon: '📅', label: 'One date style for every date', mr: 'सगळ्या तारखांसाठी एकच पद्धत' },
          { icon: '❔', label: 'Unknown stays unknown (not zero)', mr: 'माहीत नाही ते माहीत नाहीच (शून्य नाही)' },
          { icon: '🧹', label: 'Cross out repeats, keep the notebooks safe', mr: 'दोनदा आलेले खोडा, वह्या जपून ठेवा' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'A farmer in Niphad called us angry. Our app shows three crops called "onion", "ONION" and "kanda", each with a different price. And one tomato price is ₹0.', mr: 'निफाडच्या एका शेतकऱ्याचा रागाने फोन आला. आपलं app "onion", "ONION" आणि "kanda" अशी तीन वेगवेगळी पिकं दाखवतं, प्रत्येकाचा भाव वेगळा. आणि एका टोमॅटोचा भाव ₹0 आहे.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'Every mandi clerk types his own way. Dates come as 05/11/2026, 2026-11-05 and 5-Nov-2026. An empty price cell became 0 somewhere in our code.', mr: 'प्रत्येक मंडीचा clerk आपल्या पद्धतीने टाइप करतो. तारखा 05/11/2026, 2026-11-05 आणि 5-Nov-2026 अशा येतात. आपल्या code मध्ये कुठेतरी रिकाम्या price cell चं 0 झालं.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'one space after "Onion ". that is all it takes. your GROUP BY sees two onions and nobody notices. hehe.', mr: '"Onion " नंतर एक space. एवढंच पुरे. तुमचा GROUP BY दोन onions पाहतो आणि कोणाच्या लक्षातही येत नाही. हेहे.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Before anything is summed, we clean. One tidy spelling, one date format, honest blanks, no repeats. And nobody edits the raw file, {name}. Ever.', mr: 'काहीही बेरीज करण्याआधी आपण साफ करतो. एकच नीट स्पेलिंग, तारखेचं एकच format, प्रामाणिक रिकाम्या जागा, पुनरावृत्ती नाही. आणि raw file कोणीही बदलत नाही, {name}. कधीच नाही.' } },
        { who: 'meera', mood: 'happy', text: { en: 'You spent years spotting "almost the same" values as a tester. Now you write the code that makes them exactly the same.', mr: 'tester म्हणून तू वर्षानुवर्षं "जवळजवळ सारख्या" values पकडल्यास. आता त्या अगदी सारख्या करणारा code तू लिहिणार.' } },
      ],
      problem: { en: 'The same onion arrives with different spellings, spaces and capitals, dates come in three formats, blanks turn into 0, and repeated rows count twice. Every total built on this data is wrong.', mr: 'तोच कांदा वेगवेगळ्या स्पेलिंग, spaces आणि capitals सह येतो, तारखा तीन formats मध्ये येतात, रिकाम्या जागांचं 0 होतं, आणि पुन्हा आलेल्या rows दोनदा मोजल्या जातात. या data वर केलेली प्रत्येक बेरीज चुकीची.' },
      solution: { en: 'A cleaning step in Python: strip and lower every name and map local names with a dict, parse every date with datetime.strptime and write it as ISO (YYYY-MM-DD), keep blanks as None, drop repeats with a set of keys, and write the clean rows to a new file while the raw file stays untouched.', mr: 'Python मध्ये एक cleaning पायरी: प्रत्येक नाव strip आणि lower करा आणि स्थानिक नावं dict ने जोडा, प्रत्येक तारीख datetime.strptime ने वाचून ISO (YYYY-MM-DD) मध्ये लिहा, रिकाम्या जागा None म्हणून ठेवा, set of keys ने पुनरावृत्ती काढा, आणि साफ rows नव्या file मध्ये लिहा. raw file जशीच्या तशी राहते.' },
    },
    lesson: [
      { en: 'Text from files is never as clean as it looks. strip() removes spaces (and tabs and newlines) at both ends, lower() makes everything small letters, and title() writes "nashik" as "Nashik". They return a new string, so you chain them: " ONION ".strip().lower() gives "onion". Compare and group only after this step.', mr: 'files मधला text दिसतो तितका स्वच्छ कधीच नसतो. strip() दोन्ही टोकांच्या spaces (आणि tabs, newlines) काढतो, lower() सगळी अक्षरं small करतो, आणि title() "nashik" ला "Nashik" लिहितो. हे नवीन string परत देतात, म्हणून त्यांची साखळी करता येते: " ONION ".strip().lower() म्हणजे "onion". तुलना आणि grouping या पायरीनंतरच.' },
      { en: 'Local names need a map. A dict like ALIASES = {"kanda": "onion", "batata": "potato"} turns them into one official name: ALIASES.get(name, name) returns the mapped name, or the name itself when it is not in the map. Dates are the same story: datetime.strptime(text, "%d/%m/%Y") reads one format and fails with ValueError on others, so you try a short list of formats and write the winner as ISO with .date().isoformat(), like 2026-11-05. ISO dates sort correctly as plain text, and every database understands them.', mr: 'स्थानिक नावांसाठी map लागतो. ALIASES = {"kanda": "onion", "batata": "potato"} सारखी dict त्यांना एक अधिकृत नाव देते: ALIASES.get(name, name) map मधलं नाव देतो, आणि नाव map मध्ये नसेल तर तेच नाव परत देतो. तारखांचंही तसंच: datetime.strptime(text, "%d/%m/%Y") एकच format वाचतो आणि बाकीच्यांवर ValueError देतो, म्हणून formats ची छोटी यादी एकेक करून वापरून पाहायची आणि जो जुळेल तो .date().isoformat() ने ISO मध्ये लिहायचा, उदा. 2026-11-05. ISO तारखा साध्या text सारख्याही बरोबर sort होतात, आणि प्रत्येक database त्या समजतो.' },
      { en: 'Missing is not zero. csv gives an empty cell as "" (empty string). Turn it into None, which means "we do not know". 0 means "it was free", and an average with fake zeros drags every price down. Python\'s None is SQL\'s NULL: AVG() skips NULLs, and your code should skip None the same way.', mr: 'गायब म्हणजे शून्य नव्हे. csv रिकामा cell "" (रिकामा string) म्हणून देतो. त्याचं None करा, म्हणजे "आपल्याला माहीत नाही". 0 म्हणजे "फुकट मिळालं", आणि खोट्या शून्यांसह काढलेली सरासरी प्रत्येक भाव खाली ओढते. Python चं None म्हणजे SQL चं NULL: AVG() NULL सोडून देतो, आणि तुमच्या code ने None तसंच सोडायला हवं.' },
      { en: 'Repeats: build a key that says what makes a row unique, like (market, commodity, date), and keep a set of keys already seen. If the key is in the set, skip the row. Do it after cleaning, because "Onion " on 05/11/2026 and "onion" on 2026-11-05 only look the same once cleaned. And never write back to the raw file: read from data/raw, write to out. If your cleaning has a bug, the original is still there to run again. pandas comes later; here you learn what it does underneath.', mr: 'पुनरावृत्ती: row कशामुळे unique ठरते ते सांगणारी key बनवा, उदा. (market, commodity, date), आणि आधी पाहिलेल्या keys चा set ठेवा. key set मध्ये असेल तर row सोडून द्या. हे cleaning नंतर करा, कारण 05/11/2026 चा "Onion " आणि 2026-11-05 चा "onion" साफ केल्यावरच सारखे दिसतात. आणि raw file मध्ये कधीही परत लिहू नका: data/raw मधून वाचा, out मध्ये लिहा. cleaning मध्ये bug असला तरी मूळ file पुन्हा चालवायला शिल्लक राहते. pandas नंतर येईल; इथे तो आतून काय करतो ते तुम्ही शिकता.' },
    ],
    syntax: {
      template: `from datetime import datetime

ALIASES = {'kanda': 'onion', 'batata': 'potato'}
FORMATS = ['%Y-%m-%d', '%d/%m/%Y', '%d-%b-%Y']

def clean_name(text):
    name = text.strip().lower()
    return ALIASES.get(name, name)

def to_iso(text):
    for fmt in FORMATS:
        try:
            return datetime.strptime(text.strip(), fmt).date().isoformat()
        except ValueError:
            pass
    return None

seen = set()
key = (market, commodity, date)
if key not in seen:
    seen.add(key)`,
      parts: [
        { code: "text.strip().lower()", means: { en: 'cut spaces at both ends, then small letters: " ONION " becomes "onion"', mr: 'दोन्ही टोकांच्या spaces कापा, मग small अक्षरं: " ONION " चं "onion"' } },
        { code: "ALIASES.get(name, name)", means: { en: 'the official name if the map has one, else the name as it is', mr: 'map मध्ये असेल तर अधिकृत नाव, नाहीतर नाव जसं आहे तसं' } },
        { code: "datetime.strptime(text, '%d/%m/%Y')", means: { en: 'read text as a date in this exact format (%d day, %m month number, %b short month like Nov, %Y year); ValueError if it does not fit', mr: 'text या नेमक्या format मधली तारीख म्हणून वाचा (%d दिवस, %m महिन्याचा नंबर, %b Nov सारखा छोटा महिना, %Y वर्ष); बसत नसेल तर ValueError' } },
        { code: ".date().isoformat()", means: { en: 'write it back as ISO text: 2026-11-05', mr: 'ती परत ISO text म्हणून लिहा: 2026-11-05' } },
        { code: "seen = set()  /  key in seen", means: { en: 'remember keys already kept; checking a set is instant even with a million keys', mr: 'आधी ठेवलेल्या keys लक्षात ठेवा; दहा लाख keys असल्या तरी set मध्ये तपासणं क्षणात होतं' } },
      ],
      example: [
        { code: "clean_name(' Kanda ')            # 'onion'", note: { en: 'the clerk\'s local name and stray spaces, both fixed', mr: 'clerk चं स्थानिक नाव आणि जास्तीच्या spaces, दोन्ही दुरुस्त' } },
        { code: "'nashik'.strip().title()          # 'Nashik'", note: { en: 'market names in one tidy style, like the aunt\'s fresh sheet', mr: 'बाजारांची नावं एकाच नीट पद्धतीने, मावशीच्या नव्या कागदासारखी' } },
        { code: "to_iso('5-Nov-2026')              # '2026-11-05'", note: { en: 'three date styles in, one ISO date out', mr: 'तीन पद्धतीच्या तारखा आत, एक ISO तारीख बाहेर' } },
        { code: "price = None if text == '' else int(text)", note: { en: 'a blank price stays "unknown", never 0', mr: 'रिकामा भाव "माहीत नाही" राहतो, कधीच 0 नाही' } },
        { code: "key = ('Nashik', 'onion', '2026-11-05')", note: { en: 'what makes a row unique; the second copy of this key is a repeat guest', mr: 'row कशामुळे unique ते; या key ची दुसरी प्रत म्हणजे दोनदा आलेला पाहुणा' } },
        { code: "open('out/nashik_clean.csv', 'w')  # never data/raw", note: { en: 'write a fresh sheet; the notebooks stay in the drawer', mr: 'नवा कागद लिहा; वह्या ड्रॉवरमध्येच राहतात' } },
      ],
      pitfall: { en: 'int("") is a ValueError, and the quick "fix" int(text or 0) silently invents a free crop. Keep blanks as None. Also, dedupe on raw text and you will miss repeats that differ only in spaces or date style: clean first, then build the key.', mr: 'int("") म्हणजे ValueError, आणि झटपट "उपाय" int(text or 0) गुपचूप फुकट पीक तयार करतो. रिकाम्या जागा None म्हणून ठेवा. आणि raw text वर dedupe केलं तर फक्त spaces किंवा तारखेच्या पद्धतीत वेगळ्या असलेल्या पुनरावृत्ती सुटतील: आधी साफ करा, मग key बनवा.' },
    },
    practice: {
      intro: { en: 'Clean the Nashik mandi file piece by piece: names, dates, blanks, repeats. Each step runs your code again on a hidden messy file, so write rules, not answers.', mr: 'नाशिक मंडीची file तुकड्या तुकड्याने साफ करा: नावं, तारखा, रिकाम्या जागा, पुनरावृत्ती. प्रत्येक पायरी तुमचा code एका लपवलेल्या गोंधळलेल्या file वर पुन्हा चालवते, म्हणून उत्तरं नाही, नियम लिहा.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'Finish clean_name(text): strip the spaces, make it lowercase, then turn local names into the official one with ALIASES (use .get so unknown names pass through cleaned). Press Run, then Submit. Hidden tests call clean_name with other messy names too.', mr: 'clean_name(text) पूर्ण करा: spaces काढा, lowercase करा, मग ALIASES वापरून स्थानिक नावांचं अधिकृत नाव करा (.get वापरा म्हणजे अनोळखी नावं साफ होऊन तशीच पुढे जातील). Run दाबा, मग Submit. लपवलेल्या tests इतर गोंधळलेली नावं देऊनही clean_name तपासतात.' },
          starter: `# The same crop arrives spelled many ways. Make them all match.
ALIASES = {'kanda': 'onion', 'tamatar': 'tomato', 'batata': 'potato'}

raw_names = ['Onion ', 'ONION', ' tomato', 'kanda', 'Batata', 'Potato', ' Tamatar ']

def clean_name(text):
    # TODO: strip spaces, make it lowercase, then map local names with ALIASES
    return text

cleaned = []
for n in raw_names:
    cleaned.append(clean_name(n))
print(cleaned)
`,
          solution: `ALIASES = {'kanda': 'onion', 'tamatar': 'tomato', 'batata': 'potato'}

raw_names = ['Onion ', 'ONION', ' tomato', 'kanda', 'Batata', 'Potato', ' Tamatar ']

def clean_name(text):
    name = text.strip().lower()
    return ALIASES.get(name, name)

cleaned = []
for n in raw_names:
    cleaned.append(clean_name(n))
print(cleaned)
`,
          output: ["['onion', 'onion', 'tomato', 'onion', 'potato', 'potato', 'tomato']"],
          checks: [
            { expr: "clean_name('  KANDA ') == 'onion'", message: { en: 'clean_name("  KANDA ") should give "onion". Clean first (strip, lower), then look it up in ALIASES.', mr: 'clean_name("  KANDA ") ने "onion" द्यायला हवं. आधी साफ करा (strip, lower), मग ALIASES मध्ये शोधा.' } },
            { expr: "clean_name(' Garlic') == 'garlic'", message: { en: 'A name that is not in ALIASES should still come back cleaned: " Garlic" gives "garlic". Use ALIASES.get(name, name).', mr: 'ALIASES मध्ये नसलेलं नावही साफ होऊन परत यायला हवं: " Garlic" चं "garlic". ALIASES.get(name, name) वापरा.' } },
            { expr: "clean_name('BATATA') == 'potato'", message: { en: 'clean_name("BATATA") should give "potato".', mr: 'clean_name("BATATA") ने "potato" द्यायला हवं.' } },
          ],
          mustUse: [{ pattern: '\\.get\\(', message: { en: 'Use ALIASES.get(name, name) so names that are not in the map still work.', mr: 'ALIASES.get(name, name) वापरा, म्हणजे map मध्ये नसलेली नावंही चालतील.' } }],
          hints: [
            { en: 'Order matters: clean the text first, then look it up. " Tamatar " with its spaces finds nothing in ALIASES; "tamatar" finds "tomato".', mr: 'क्रम महत्त्वाचा: आधी text साफ करा, मग शोधा. " Tamatar " ही ALIASES मधली key नाही, पण "tamatar" आहे.' },
            { en: 'name = text.strip().lower() gives the cleaned name. ALIASES.get(name, name) returns the official name, or name itself when there is no match.', mr: 'name = text.strip().lower() ने साफ नाव मिळतं. ALIASES.get(name, name) अधिकृत नाव देतो, किंवा जुळलं नाही तर name च परत देतो.' },
            { en: "    name = text.strip().lower()\n    return ALIASES.get(name, name)", mr: "    name = text.strip().lower()\n    return ALIASES.get(name, name)" },
          ],
          successLine: { en: 'Seven spellings, three crops. The Gremlin\'s stray space is gone.', mr: 'सात स्पेलिंग, तीन पिकं. Gremlin ची जास्तीची space गेली.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Mandis send dates in three styles. Finish to_iso(text): try each format in FORMATS with datetime.strptime; the first one that works returns the date as ISO text (.date().isoformat()). If no format fits (like 31/11/2026, a day that does not exist), return None. Hidden tests try more dates.', mr: 'मंड्या तारखा तीन पद्धतींनी पाठवतात. to_iso(text) पूर्ण करा: FORMATS मधला प्रत्येक format datetime.strptime ने वापरून पाहा; जो पहिला चालेल तो तारीख ISO text म्हणून (.date().isoformat()) परत देतो. कोणताच format बसत नसेल (उदा. 31/11/2026, असा दिवसच नाही) तर None परत द्या. लपवलेल्या tests आणखी तारखा तपासतात.' },
          starter: `from datetime import datetime

FORMATS = ['%Y-%m-%d', '%d/%m/%Y', '%d-%b-%Y']
raw_dates = ['2026-11-05', '05/11/2026', '5-Nov-2026', ' 06/11/2026 ', '31/11/2026']

def to_iso(text):
    # TODO: for each fmt in FORMATS, try datetime.strptime(text.strip(), fmt)
    #       return the ISO date text; if a format fails (ValueError), try the next one
    return None

for d in raw_dates:
    print(f"'{d}' -> {to_iso(d)}")
`,
          solution: `from datetime import datetime

FORMATS = ['%Y-%m-%d', '%d/%m/%Y', '%d-%b-%Y']
raw_dates = ['2026-11-05', '05/11/2026', '5-Nov-2026', ' 06/11/2026 ', '31/11/2026']

def to_iso(text):
    for fmt in FORMATS:
        try:
            return datetime.strptime(text.strip(), fmt).date().isoformat()
        except ValueError:
            pass
    return None

for d in raw_dates:
    print(f"'{d}' -> {to_iso(d)}")
`,
          output: ["'2026-11-05' -> 2026-11-05", "'05/11/2026' -> 2026-11-05", "'5-Nov-2026' -> 2026-11-05", "' 06/11/2026 ' -> 2026-11-06", "'31/11/2026' -> None"],
          checks: [
            { expr: "to_iso('07-Nov-2026') == '2026-11-07'", message: { en: 'to_iso("07-Nov-2026") should give "2026-11-07".', mr: 'to_iso("07-Nov-2026") ने "2026-11-07" द्यायला हवं.' } },
            { expr: "to_iso('2026/11/05') is None", message: { en: 'A date in a style that is not in FORMATS (2026/11/05) should give None, not crash.', mr: 'FORMATS मध्ये नसलेल्या पद्धतीची तारीख (2026/11/05) None द्यायला हवी, crash नाही.' } },
            { expr: "to_iso('') is None", message: { en: 'An empty date should give None.', mr: 'रिकामी तारीख None द्यायला हवी.' } },
          ],
          mustUse: [{ pattern: 'strptime', message: { en: 'Parse with datetime.strptime, so 31/11/2026 is caught as an impossible date.', mr: 'datetime.strptime ने वाचा, म्हणजे 31/11/2026 अशक्य तारीख म्हणून पकडली जाईल.' } }],
          hints: [
            { en: 'You need a loop over FORMATS with try/except ValueError inside it (you met try/except in Y2.3). A return inside the try ends the function as soon as one format works.', mr: 'FORMATS वर loop लागेल आणि त्याच्या आत try/except ValueError (try/except तुम्ही Y2.3 मध्ये पाहिलं). try च्या आतला return एक format चालताच function संपवतो.' },
            { en: 'datetime.strptime(text.strip(), fmt) gives a datetime; .date().isoformat() turns it into "2026-11-05". After the loop, nothing worked, so return None.', mr: 'datetime.strptime(text.strip(), fmt) एक datetime देतो; .date().isoformat() त्याचं "2026-11-05" करतो. loop नंतर काहीच चाललं नाही, म्हणून return None.' },
            { en: "    for fmt in FORMATS:\n        try:\n            return datetime.strptime(text.strip(), fmt).date().isoformat()\n        except ValueError:\n            pass\n    return None", mr: "    for fmt in FORMATS:\n        try:\n            return datetime.strptime(text.strip(), fmt).date().isoformat()\n        except ValueError:\n            pass\n    return None" },
          ],
          successLine: { en: 'One date language for every mandi. And 31 November was caught, not guessed.', mr: 'प्रत्येक मंडीसाठी तारखेची एकच भाषा. आणि 31 नोव्हेंबर पकडला, अंदाज नाही लावला.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Nashik did not send a tomato price today, so its cell is empty. Press Run: the code reads the file twice, once turning the blank into 0 and once into None. Which average should the KisanMandi app show farmers?', mr: 'नाशिकने आज टोमॅटोचा भाव पाठवला नाही, म्हणून त्याचा cell रिकामा आहे. Run दाबा: code file दोनदा वाचतो, एकदा रिकाम्या जागेचं 0 करून आणि एकदा None करून. KisanMandi app ने शेतकऱ्यांना कोणती सरासरी दाखवावी?' },
          pythonSandbox: {
            code: `import csv

with_zero = []
with_none = []
with open('data/tomato.csv', newline='', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        text = row['price'].strip()
        with_zero.append(int(text) if text else 0)
        with_none.append(int(text) if text else None)

print('blank as 0   :', with_zero, 'avg', sum(with_zero) / len(with_zero))

known = []
for p in with_none:
    if p is not None:
        known.append(p)
print('blank as None:', with_none, 'avg', sum(known) / len(known))
`,
            files: { 'data/tomato.csv': 'market,price\nPune,1600\nNashik,\nNagpur,1500\nLasalgaon,1700\n' },
          },
          options: [
            { en: '1200.0, because every market must be counted', mr: '1200.0, कारण प्रत्येक बाजार मोजलाच पाहिजे' },
            { en: '1600.0: the blank means "unknown", so it is kept as None and left out of the average (and Nashik can be flagged as missing)', mr: '1600.0: रिकामी जागा म्हणजे "माहीत नाही", म्हणून ती None ठेवून सरासरीतून वगळली जाते (आणि नाशिक गायब म्हणून flag करता येतं)' },
            { en: '0, because one market is missing so the whole day is invalid', mr: '0, कारण एक बाजार गायब आहे म्हणून पूर्ण दिवसच अवैध' },
            { en: 'The code crashes, so there is no average', mr: 'code crash होतो, म्हणून सरासरीच नाही' },
          ],
          correct: [1],
          explain: { en: 'Turning the blank into 0 pretends Nashik sold tomatoes for free, and the average falls from 1600 to 1200. A farmer reading 1200 sells too cheap. None means "unknown": skip it, exactly like SQL AVG() skips NULL, and report the gap.', mr: 'रिकाम्या जागेचं 0 करणं म्हणजे नाशिकने टोमॅटो फुकट विकले असं भासवणं, आणि सरासरी 1600 वरून 1200 वर येते. 1200 वाचणारा शेतकरी स्वस्तात विकतो. None म्हणजे "माहीत नाही": SQL AVG() जसं NULL सोडतो तसंच ते सोडा, आणि ती उणीव report करा.' },
          hints: [
            { en: 'Compare the two printed averages. Which one would a farmer trust?', mr: 'print झालेल्या दोन सरासऱ्या तुलना करा. शेतकरी कोणत्या सरासरीवर विश्वास ठेवेल?' },
            { en: 'In SQL, AVG(price) ignores NULL rows. None is Python\'s NULL.', mr: 'SQL मध्ये AVG(price) NULL rows दुर्लक्षित करतो. None म्हणजे Python चं NULL.' },
          ],
          successLine: { en: 'Unknown stays unknown. That one rule saves a lot of wrong prices.', mr: 'माहीत नाही ते माहीत नाहीच. या एका नियमाने बरेच चुकीचे भाव वाचतात.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Now the real file, data/raw/nashik.csv (look at the table above the editor). clean_name and to_iso are ready. For every row, build a clean dict with market (stripped, Title case), commodity (clean_name), date (to_iso) and price (int, or None when the cell is blank), and append it to clean_rows. Count the missing prices. Do not change the raw file. A hidden file from another day checks your rules.', mr: 'आता खरी file, data/raw/nashik.csv (editor वरचा table पाहा). clean_name आणि to_iso तयार आहेत. प्रत्येक row साठी एक साफ dict बनवा: market (strip, Title case), commodity (clean_name), date (to_iso) आणि price (int, किंवा cell रिकामा असेल तर None), आणि तो clean_rows मध्ये append करा. गायब भाव मोजा. raw file बदलू नका. दुसऱ्या दिवसाची लपवलेली file तुमचे नियम तपासते.' },
          files: { 'data/raw/nashik.csv': NASHIK_RAW },
          starter: `${CLEAN_HELPERS}
clean_rows = []
with open('data/raw/nashik.csv', newline='', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        # TODO: build a clean dict: market (strip + title), commodity (clean_name),
        #       date (to_iso), price (int, or None when the cell is empty)
        clean_rows.append(row)

missing = 0
# TODO: count the rows whose price is None

print('rows:', len(clean_rows))
print('missing prices:', missing)
`,
          solution: `${CLEAN_HELPERS}
clean_rows = []
with open('data/raw/nashik.csv', newline='', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        price = row['price'].strip()
        if price == '':
            price = None
        else:
            price = int(price)
        clean_rows.append({
            'market': row['market'].strip().title(),
            'commodity': clean_name(row['commodity']),
            'date': to_iso(row['date']),
            'price': price,
        })

missing = 0
for r in clean_rows:
    if r['price'] is None:
        missing += 1

print('rows:', len(clean_rows))
print('missing prices:', missing)
`,
          output: ['rows: 8', 'missing prices: 1'],
          checks: [
            { expr: "clean_rows[0] == {'market': 'Nashik', 'commodity': 'onion', 'date': '2026-11-05', 'price': 2400}", message: { en: 'The first row should become {"market": "Nashik", "commodity": "onion", "date": "2026-11-05", "price": 2400}. Check each field, and that price is an int.', mr: 'पहिली row {"market": "Nashik", "commodity": "onion", "date": "2026-11-05", "price": 2400} व्हायला हवी. प्रत्येक field तपासा, आणि price int आहे का ते.' } },
            { expr: "clean_rows[4]['price'] is None and clean_rows[4]['market'] == 'Nashik'", message: { en: 'Row 5 (NASHIK, tomato, blank price) should have market "Nashik" and price None, not 0 and not "".', mr: 'row 5 (NASHIK, tomato, रिकामा भाव) मध्ये market "Nashik" आणि price None हवा, 0 नाही आणि "" नाही.' } },
            { expr: "clean_rows[7]['price'] == 2480", message: { en: 'The last price is " 2480" with a space. int() of the stripped text gives 2480.', mr: 'शेवटचा भाव " 2480" आहे, space सकट. strip केलेल्या text चा int() म्हणजे 2480.' } },
            { expr: "open('data/raw/nashik.csv').read().splitlines()[1] == 'Nashik,Onion ,05/11/2026,2400'", message: { en: 'The raw file changed! Only read data/raw; write clean data somewhere else.', mr: 'raw file बदलली! data/raw फक्त वाचा; साफ data दुसरीकडे लिहा.' } },
          ],
          variants: [
            {
              label: { en: 'Another day: TAMATAR, kanda with a space, two blank prices', mr: 'दुसरा दिवस: TAMATAR, space सह kanda, दोन रिकामे भाव' },
              files: { 'data/raw/nashik.csv': NASHIK_RAW_DAY2 },
              output: ['rows: 7', 'missing prices: 2'],
              checks: [
                { expr: "clean_rows[0] == {'market': 'Nashik', 'commodity': 'tomato', 'date': '2026-11-08', 'price': 1680}", message: { en: 'On the hidden day, "TAMATAR" on 08/11/2026 should become tomato, 2026-11-08, 1680.', mr: 'लपवलेल्या दिवशी, 08/11/2026 चा "TAMATAR" tomato, 2026-11-08, 1680 व्हायला हवा.' } },
                { expr: "[r['commodity'] for r in clean_rows] == ['tomato', 'onion', 'onion', 'potato', 'tomato', 'potato', 'onion']", message: { en: 'Some commodity names were not cleaned on the hidden day. Use clean_name for every row.', mr: 'लपवलेल्या दिवशी काही commodity नावं साफ झाली नाहीत. प्रत्येक row साठी clean_name वापरा.' } },
              ],
            },
          ],
          hints: [
            { en: 'Inside the loop, row is a dict of raw text, like {"market": "nashik", "commodity": "ONION", ...}. Build a new dict from it; do not change the file.', mr: 'loop च्या आत row ही raw text ची dict आहे, उदा. {"market": "nashik", "commodity": "ONION", ...}. तिच्यावरून नवी dict बनवा; file बदलू नका.' },
            { en: 'For price: text = row["price"].strip(); if it is "" use None, else int(text). For market: row["market"].strip().title().', mr: 'price साठी: text = row["price"].strip(); ते "" असेल तर None, नाहीतर int(text). market साठी: row["market"].strip().title().' },
            { en: 'Then count: loop over clean_rows and add 1 when r["price"] is None.', mr: 'मग मोजा: clean_rows वर loop करा आणि r["price"] is None असेल तेव्हा 1 वाढवा.' },
            { en: "        price = row['price'].strip()\n        price = int(price) if price else None\n        clean_rows.append({'market': row['market'].strip().title(), 'commodity': clean_name(row['commodity']), 'date': to_iso(row['date']), 'price': price})", mr: "        price = row['price'].strip()\n        price = int(price) if price else None\n        clean_rows.append({'market': row['market'].strip().title(), 'commodity': clean_name(row['commodity']), 'date': to_iso(row['date']), 'price': price})" },
          ],
          successLine: { en: 'Eight rows in one tidy shape, one honest blank, and the raw file untouched.', mr: 'आठ rows एकाच नीट आकारात, एक प्रामाणिक रिकामी जागा, आणि raw file जशीच्या तशी.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Two rows are the same onion price written two ways. clean_row(row) is ready (your work from the last step). Keep a set of keys (market, commodity, date): skip a row whose key you have already seen and count it as a duplicate. Then write the kept rows to out/nashik_clean.csv with csv.DictWriter (header market,commodity,date,price). A blank price is written as an empty cell.', mr: 'दोन rows म्हणजे एकच कांद्याचा भाव, दोन पद्धतींनी लिहिलेला. clean_row(row) तयार आहे (मागच्या पायरीतलं तुमचं काम). keys (market, commodity, date) चा set ठेवा: आधी पाहिलेली key असलेली row सोडा आणि duplicate म्हणून मोजा. मग ठेवलेल्या rows csv.DictWriter ने out/nashik_clean.csv मध्ये लिहा (header market,commodity,date,price). रिकामा भाव रिकामा cell म्हणून लिहिला जातो.' },
          files: { 'data/raw/nashik.csv': NASHIK_RAW },
          starter: `${CLEAN_HELPERS}${CLEAN_ROW}
seen = set()
kept = []
duplicates = 0
with open('data/raw/nashik.csv', newline='', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        clean = clean_row(row)
        # TODO: key = (market, commodity, date) from the CLEAN row
        #       if the key is in seen: count a duplicate and skip the row
        #       otherwise: remember the key and keep the row
        kept.append(clean)

os.makedirs('out', exist_ok=True)
# TODO: write kept to out/nashik_clean.csv with csv.DictWriter

print('kept:', len(kept), '| duplicates:', duplicates)
`,
          solution: `${CLEAN_HELPERS}${CLEAN_ROW}
seen = set()
kept = []
duplicates = 0
with open('data/raw/nashik.csv', newline='', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        clean = clean_row(row)
        key = (clean['market'], clean['commodity'], clean['date'])
        if key in seen:
            duplicates += 1
            continue
        seen.add(key)
        kept.append(clean)

os.makedirs('out', exist_ok=True)
with open('out/nashik_clean.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['market', 'commodity', 'date', 'price'])
    writer.writeheader()
    writer.writerows(kept)

print('kept:', len(kept), '| duplicates:', duplicates)
`,
          output: ['kept: 7 | duplicates: 1'],
          checks: [
            { expr: "open('out/nashik_clean.csv').read().splitlines() == ['market,commodity,date,price', 'Nashik,onion,2026-11-05,2400', 'Nashik,onion,2026-11-06,2550', 'Nashik,tomato,2026-11-05,1600', 'Nashik,tomato,2026-11-06,', 'Nashik,potato,2026-11-05,1900', 'Nashik,potato,2026-11-06,1950', 'Nashik,onion,2026-11-07,2480']", message: { en: 'out/nashik_clean.csv should have the header market,commodity,date,price and the 7 kept rows in file order (the blank tomato price as an empty cell).', mr: 'out/nashik_clean.csv मध्ये market,commodity,date,price हा header आणि ठेवलेल्या 7 rows file च्या क्रमाने हव्यात (टोमॅटोचा रिकामा भाव रिकामा cell म्हणून).' } },
            { expr: "len(seen) == 7", message: { en: 'seen should hold one key per kept row (7).', mr: 'seen मध्ये ठेवलेल्या प्रत्येक row ची एक key हवी (7).' } },
            { expr: "open('data/raw/nashik.csv').read().count(chr(10)) == 9", message: { en: 'The raw file changed! Write only to out/.', mr: 'raw file बदलली! फक्त out/ मध्ये लिहा.' } },
          ],
          variants: [
            {
              label: { en: 'Another day: two repeats hidden behind different spellings and date styles', mr: 'दुसरा दिवस: वेगळ्या स्पेलिंग आणि तारखेच्या पद्धतीमागे लपलेल्या दोन पुनरावृत्ती' },
              files: { 'data/raw/nashik.csv': NASHIK_RAW_DAY2 },
              output: ['kept: 5 | duplicates: 2'],
              checks: [
                { expr: "open('out/nashik_clean.csv').read().splitlines() == ['market,commodity,date,price', 'Nashik,tomato,2026-11-08,1680', 'Nashik,onion,2026-11-08,2500', 'Nashik,potato,2026-11-08,', 'Nashik,potato,2026-11-09,', 'Nashik,onion,2026-11-09,2520']", message: { en: 'On the hidden day the clean file is wrong. Build the key from the cleaned row, so "kanda " and "Onion" on the same day count as one.', mr: 'लपवलेल्या दिवशी साफ file चुकीची आहे. key साफ केलेल्या row वरून बनवा, म्हणजे एकाच दिवसाचे "kanda " आणि "Onion" एकच मोजले जातील.' } },
              ],
            },
          ],
          mustUse: [
            { pattern: 'DictWriter', message: { en: 'Write the file with csv.DictWriter.', mr: 'file csv.DictWriter ने लिहा.' } },
            { pattern: '\\bin seen\\b', message: { en: 'Check the key with "key in seen".', mr: 'key "key in seen" ने तपासा.' } },
          ],
          hints: [
            { en: 'The key must come from clean, not row: (clean["market"], clean["commodity"], clean["date"]). Raw text would see "Onion " and "ONION" as different.', mr: 'key clean वरून यायला हवी, row वरून नाही: (clean["market"], clean["commodity"], clean["date"]). raw text ला "Onion " आणि "ONION" वेगळे दिसतील.' },
            { en: 'if key in seen: duplicates += 1 and continue (skip). Else seen.add(key) and kept.append(clean). For the file: csv.DictWriter(f, fieldnames=[...]), then writeheader() and writerows(kept). None is written as an empty cell.', mr: 'if key in seen: duplicates += 1 आणि continue (सोडा). नाहीतर seen.add(key) आणि kept.append(clean). file साठी: csv.DictWriter(f, fieldnames=[...]), मग writeheader() आणि writerows(kept). None रिकामा cell म्हणून लिहिला जातो.' },
            { en: "        key = (clean['market'], clean['commodity'], clean['date'])\n        if key in seen:\n            duplicates += 1\n            continue\n        seen.add(key)\n        kept.append(clean)\n\nwith open('out/nashik_clean.csv', 'w', newline='', encoding='utf-8') as f:\n    writer = csv.DictWriter(f, fieldnames=['market', 'commodity', 'date', 'price'])\n    writer.writeheader()\n    writer.writerows(kept)", mr: "        key = (clean['market'], clean['commodity'], clean['date'])\n        if key in seen:\n            duplicates += 1\n            continue\n        seen.add(key)\n        kept.append(clean)\n\nwith open('out/nashik_clean.csv', 'w', newline='', encoding='utf-8') as f:\n    writer = csv.DictWriter(f, fieldnames=['market', 'commodity', 'date', 'price'])\n    writer.writeheader()\n    writer.writerows(kept)" },
          ],
          successLine: { en: 'A clean Nashik file, every repeat caught, and the raw notebook still in the drawer.', mr: 'साफ नाशिक file, प्रत्येक पुनरावृत्ती पकडली, आणि raw वही अजूनही ड्रॉवरमध्ये.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: "name = '  ONION '\nprint(name.strip().title())",
        options: ["'  ONION '", 'ONION', 'Onion', 'onion'],
        answer: 2,
        explain: { en: 'strip() removes the spaces at both ends, and title() makes the first letter capital and the rest small: Onion.', mr: 'strip() दोन्ही टोकांच्या spaces काढतो, आणि title() पहिलं अक्षर capital आणि बाकीची small करतो: Onion.' },
      },
      {
        q: { en: 'A mandi file has an empty price cell for Nagpur potato. What should your cleaning code store?', mr: 'एका मंडी file मध्ये नागपूरच्या बटाट्याचा price cell रिकामा आहे. तुमच्या cleaning code ने काय साठवावं?' },
        options: [
          { en: 'None, so it is treated as unknown and skipped by averages (like NULL in SQL)', mr: 'None, म्हणजे ते "माहीत नाही" मानलं जाईल आणि सरासरीत वगळलं जाईल (SQL मधल्या NULL सारखं)' },
          { en: '0, because a number is easier to add up', mr: '0, कारण number ची बेरीज सोपी' },
          { en: 'Yesterday\'s price, without telling anyone', mr: 'कालचा भाव, कोणाला न सांगता' },
          { en: 'Delete the whole file and wait for tomorrow', mr: 'पूर्ण file काढून टाका आणि उद्याची वाट पाहा' },
        ],
        answer: 0,
        explain: { en: 'A blank means "we do not know". 0 pulls every average down and tells farmers a crop was free. Inventing a value hides the problem. None keeps the truth and can be reported.', mr: 'रिकामी जागा म्हणजे "आपल्याला माहीत नाही". 0 प्रत्येक सरासरी खाली ओढतो आणि शेतकऱ्यांना पीक फुकट होतं असं सांगतो. value रचली तर समस्या लपते. None सत्य जपतो आणि report करता येतो.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: "from datetime import datetime\nd = datetime.strptime('07/11/2026', '%d/%m/%Y')\nprint(d.date().isoformat())",
        options: ['07/11/2026', '2026-07-11', 'ValueError', '2026-11-07'],
        answer: 3,
        explain: { en: '%d/%m/%Y reads 07 as the day and 11 as the month. isoformat() writes year-month-day: 2026-11-07.', mr: '%d/%m/%Y 07 दिवस आणि 11 महिना म्हणून वाचतो. isoformat() वर्ष-महिना-दिवस लिहितो: 2026-11-07.' },
      },
      {
        q: { en: 'Why must you build the duplicate key after cleaning, and not from the raw text?', mr: 'duplicate key raw text वरून नाही तर cleaning नंतरच का बनवायची?' },
        options: [
          { en: 'Because sets cannot hold raw text', mr: 'कारण set मध्ये raw text ठेवता येत नाही' },
          { en: 'Because "Onion " on 05/11/2026 and "onion" on 2026-11-05 are the same row, but their raw keys look different', mr: 'कारण 05/11/2026 चा "Onion " आणि 2026-11-05 चा "onion" ही एकच row आहे, पण त्यांच्या raw keys वेगळ्या दिसतात' },
          { en: 'Because cleaning deletes duplicates on its own', mr: 'कारण cleaning स्वतःहून duplicates काढून टाकतं' },
          { en: 'It does not matter; both find the same repeats', mr: 'काही फरक पडत नाही; दोन्ही त्याच पुनरावृत्ती शोधतात' },
        ],
        answer: 1,
        explain: { en: 'Repeats from different clerks differ in spaces, capitals and date style. Only after cleaning do they share one key, so the set can catch them.', mr: 'वेगवेगळ्या clerks कडून आलेल्या पुनरावृत्ती spaces, capitals आणि तारखेच्या पद्धतीत वेगळ्या असतात. cleaning नंतरच त्यांची key एक होते, आणि set त्यांना पकडू शकतो.' },
      },
    ],
    recap: { line: { en: 'strip + lower + alias map for names, strptime to ISO for dates, None for blanks, a set of clean keys for repeats. Raw stays raw.', mr: 'नावांसाठी strip + lower + alias map, तारखांसाठी strptime ते ISO, रिकाम्या जागांसाठी None, पुनरावृत्तीसाठी साफ keys चा set. raw जसाच्या तसा.' }, icon: '🧽' },
  },

  // ───────────────────────── Y2.5 Grouping and summarising
  {
    id: 'py2-5',
    code: 'Y2.5',
    level: 'intermediate',
    title: { en: 'Grouping and summarising', mr: 'Grouping आणि सारांश' },
    skill: 'Counter, defaultdict(list), avg/min/max per group, sorted(key=, reverse=), top-N, comprehensions, rounding money',
    realLife: {
      place: 'fair',
      title: { en: 'The Ganpati mandal treasurer\'s night', mr: 'गणपती मंडळाच्या खजिनदाराची रात्र' },
      story: {
        en: 'After the Ganpati festival, the society treasurer, Joshi kaka, has a shoebox full of donation receipts. The committee wants three answers: how many receipts came from each wing, the total and average from each wing, and the three wings that gave the most. He does not add the whole box again for every question. He makes one pile per wing (A, B, C, D), counts each pile, adds each pile, and then lines the piles up from biggest to smallest. A receipt with no amount written on it goes to the side; it is not counted as ₹0. Notice-board figures are rounded to whole rupees, but the register keeps the exact paise.',
        mr: 'गणपती उत्सवानंतर सोसायटीचे खजिनदार जोशी काका यांच्याकडे देणगीच्या पावत्यांनी भरलेला एक बूट-खोका आहे. कमिटीला तीन उत्तरं हवीत: प्रत्येक wing मधून किती पावत्या आल्या, प्रत्येक wing ची एकूण आणि सरासरी रक्कम, आणि सगळ्यात जास्त देणाऱ्या तीन wings. प्रत्येक प्रश्नासाठी ते पूर्ण खोका पुन्हा पुन्हा मोजत नाहीत. ते प्रत्येक wing चा एक ढीग करतात (A, B, C, D), प्रत्येक ढीग मोजतात, प्रत्येक ढिगाची बेरीज करतात, आणि मग ढीग मोठ्यापासून लहानापर्यंत रांगेत लावतात. रक्कम न लिहिलेली पावती बाजूला जाते; ती ₹0 म्हणून मोजली जात नाही. सूचना फलकावरचे आकडे पूर्ण रुपयांत असतात, पण register मध्ये नेमके पैसे राहतात.',
      },
      scene: {
        type: 'group',
        groups: [
          { icon: '🏢', label: 'A wing', mr: 'A wing' },
          { icon: '🏬', label: 'B wing', mr: 'B wing' },
          { icon: '🏠', label: 'C wing', mr: 'C wing' },
        ],
        items: [
          { icon: '🧾', group: 0 },
          { icon: '🧾', group: 2 },
          { icon: '🧾', group: 1 },
          { icon: '🧾', group: 0 },
          { icon: '🧾', group: 2 },
          { icon: '🧾', group: 0 },
          { icon: '🧾', group: 1 },
        ],
        note: { en: 'One pile per wing, then count, add and rank the piles. That is GROUP BY.', mr: 'प्रत्येक wing चा एक ढीग, मग ढीग मोजा, बेरीज करा आणि क्रम लावा. हाच GROUP BY.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'neutral', text: { en: 'The data is clean now, thank you. But a farmer does not want 400 rows. He wants one line: today\'s average onion price at each mandi, and where to take his truck.', mr: 'data आता साफ आहे, धन्यवाद. पण शेतकऱ्याला 400 rows नकोत. त्याला एक ओळ हवी: प्रत्येक मंडीतला आजचा कांद्याचा सरासरी भाव, आणि ट्रक कुठे न्यायचा.' } },
        { who: 'theo', mood: 'worried', text: { en: 'Right now an intern copies the file into Excel at 6 a.m. and builds a pivot table by hand. When she is on leave, the app shows yesterday.', mr: 'सध्या एक intern सकाळी 6 वाजता file Excel मध्ये copy करून हाताने pivot table बनवते. ती रजेवर असली की app कालचे भाव दाखवतं.' } },
        { who: 'rex', mood: 'happy', text: { en: 'You already know this as SQL, {name}: GROUP BY commodity, market with AVG, MIN, MAX, then ORDER BY ... DESC LIMIT 3. In Python you build the groups yourself, with Counter and defaultdict.', mr: 'तुला हे SQL म्हणून आधीच येतं, {name}: GROUP BY commodity, market सोबत AVG, MIN, MAX, मग ORDER BY ... DESC LIMIT 3. Python मध्ये groups तू स्वतः बनवतेस, Counter आणि defaultdict ने.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'averages are my favourite. one blank turned into 0, and the whole mandi looks cheap. nobody reads the rows behind an average.', mr: 'सरासरी मला सगळ्यात आवडते. एका रिकाम्या जागेचं 0 केलं की पूर्ण मंडी स्वस्त दिसते. सरासरीमागच्या rows कोणीच वाचत नाही.' } },
      ],
      problem: { en: 'Clean rows are still too many to read. The daily summary (count, average, min and max per crop and mandi, and the best mandis) is built by hand, late, and easy to get wrong.', mr: 'साफ rows सुद्धा वाचायला खूप जास्त आहेत. रोजचा सारांश (प्रत्येक पीक आणि मंडीसाठी count, सरासरी, min आणि max, आणि सगळ्यात चांगल्या मंड्या) हाताने, उशिरा आणि चुका होत बनतो.' },
      solution: { en: 'A Python summary step: Counter for counts, defaultdict(list) to collect prices per (commodity, market), a dict comprehension for avg/min/max, sorted(..., key=..., reverse=True)[:n] for the top mandis, and money rounded only at the end.', mr: 'Python ची एक summary पायरी: counts साठी Counter, (commodity, market) प्रमाणे भाव गोळा करायला defaultdict(list), avg/min/max साठी dict comprehension, सगळ्यात चांगल्या मंड्यांसाठी sorted(..., key=..., reverse=True)[:n], आणि पैसे फक्त शेवटी round.' },
    },
    lesson: [
      { en: 'Counting is so common that Python has a tool for it: collections.Counter. Counter(row["commodity"] for row in rows) counts every crop in one line, and .most_common(2) gives the top two as (name, count) pairs. That is SELECT commodity, COUNT(*) ... GROUP BY commodity ORDER BY 2 DESC LIMIT 2.', mr: 'मोजणं इतकं नेहमीचं आहे की Python मध्ये त्यासाठी tool आहे: collections.Counter. Counter(row["commodity"] for row in rows) एका ओळीत प्रत्येक पीक मोजतो, आणि .most_common(2) पहिले दोन (name, count) जोड्यांमध्ये देतो. म्हणजे SELECT commodity, COUNT(*) ... GROUP BY commodity ORDER BY 2 DESC LIMIT 2.' },
      { en: 'For sums and averages you first collect each group\'s values: groups = defaultdict(list), then groups[key].append(price). A normal dict would raise KeyError the first time it sees a key; defaultdict quietly starts an empty list. The key can be a tuple, ("onion", "Nashik"), which is GROUP BY commodity, market. Then each group gives sum(p) / len(p), min(p) and max(p): Joshi kaka\'s piles.', mr: 'बेरीज आणि सरासरीसाठी आधी प्रत्येक group च्या values गोळा करायच्या: groups = defaultdict(list), मग groups[key].append(price). साधी dict नवी key पहिल्यांदा पाहताच KeyError देईल; defaultdict शांतपणे रिकामी list सुरू करते. key tuple असू शकते, ("onion", "Nashik"), म्हणजे GROUP BY commodity, market. मग प्रत्येक group मधून sum(p) / len(p), min(p) आणि max(p) मिळतात: जोशी काकांचे ढीग.' },
      { en: 'Comprehensions write a loop in one line. [r for r in rows if r["price"]] is WHERE price IS NOT NULL. {k: max(v) for k, v in groups.items()} builds a whole dict. sorted(pairs, key=lambda kv: kv[1], reverse=True)[:3] sorts by the second item, biggest first, and keeps three: ORDER BY avg DESC LIMIT 3. Careful: sorted(a_dict) sorts only the keys, alphabetically.', mr: 'Comprehensions एक loop एका ओळीत लिहितात. [r for r in rows if r["price"]] म्हणजे WHERE price IS NOT NULL. {k: max(v) for k, v in groups.items()} पूर्ण dict बनवतो. sorted(pairs, key=lambda kv: kv[1], reverse=True)[:3] दुसऱ्या item प्रमाणे, मोठ्यापासून sort करतो आणि तीन ठेवतो: ORDER BY avg DESC LIMIT 3. लक्ष द्या: sorted(a_dict) फक्त keys sort करतो, अक्षरक्रमाने.' },
      { en: 'Money: compute with full precision and round only when you show or save the result, with round(avg, 2) or f"{avg:.2f}". Round in the middle and small errors add up across thousands of rows. Floats are not exact (round(2.675, 2) gives 2.67), so a real ledger uses decimal.Decimal; for a ₹ per quintal average, round at the end is enough. pandas groupby does all this for you later; now you know what is underneath.', mr: 'पैसे: पूर्ण अचूकतेने हिशोब करा आणि निकाल दाखवताना किंवा save करतानाच round करा, round(avg, 2) किंवा f"{avg:.2f}" ने. मधेच round केलं तर हजारो rows मध्ये छोट्या चुका साठत जातात. floats अचूक नसतात (round(2.675, 2) म्हणजे 2.67), म्हणून खऱ्या हिशोबवहीत decimal.Decimal वापरतात; ₹ प्रति क्विंटल सरासरीसाठी शेवटी round करणं पुरेसं आहे. नंतर pandas groupby हे सगळं तुमच्यासाठी करेल; आता आत काय आहे ते तुम्हाला माहीत आहे.' },
    ],
    syntax: {
      template: `from collections import Counter, defaultdict

counts = Counter(r['commodity'] for r in rows)
counts.most_common(2)

groups = defaultdict(list)
for r in rows:
    if r['price']:
        groups[(r['commodity'], r['market'])].append(int(r['price']))

avg = {key: round(sum(p) / len(p), 2) for key, p in groups.items()}
top3 = sorted(avg.items(), key=lambda kv: kv[1], reverse=True)[:3]`,
      parts: [
        { code: 'Counter(... for r in rows)', means: { en: 'count each value; like COUNT(*) GROUP BY', mr: 'प्रत्येक value मोजा; COUNT(*) GROUP BY सारखं' } },
        { code: 'defaultdict(list)', means: { en: 'a dict where a new key starts as an empty list, so append never hits KeyError', mr: 'अशी dict जिथे नवी key रिकाम्या list ने सुरू होते, म्हणून append ला KeyError येत नाही' } },
        { code: "groups[(commodity, market)]", means: { en: 'a tuple key: one group per crop and mandi (GROUP BY commodity, market)', mr: 'tuple key: प्रत्येक पीक आणि मंडीचा एक group (GROUP BY commodity, market)' } },
        { code: '{key: ... for key, p in groups.items()}', means: { en: 'a dict comprehension: one result per group', mr: 'dict comprehension: प्रत्येक group चा एक निकाल' } },
        { code: 'sorted(..., key=lambda kv: kv[1], reverse=True)[:3]', means: { en: 'sort by the value, biggest first, keep 3 (ORDER BY ... DESC LIMIT 3)', mr: 'value प्रमाणे sort, मोठ्यापासून, 3 ठेवा (ORDER BY ... DESC LIMIT 3)' } },
      ],
      example: [
        { code: "Counter(r['market'] for r in rows).most_common(1)   # [('Pune', 4)]", note: { en: 'which wing gave the most receipts', mr: 'कोणत्या wing मधून सगळ्यात जास्त पावत्या' } },
        { code: "groups[('onion', 'Lasalgaon')]                    # [2550, 2610]", note: { en: 'one pile: all Lasalgaon onion prices', mr: 'एक ढीग: लासलगावचे सगळे कांद्याचे भाव' } },
        { code: "[r for r in rows if r['price']]", note: { en: 'receipts with no amount go to the side (WHERE price IS NOT NULL)', mr: 'रक्कम नसलेल्या पावत्या बाजूला (WHERE price IS NOT NULL)' } },
        { code: "round(sum(p) / len(p), 2)                         # 2580.0", note: { en: 'exact while adding, rounded for the notice board', mr: 'बेरीज करताना अचूक, सूचना फलकासाठी round' } },
        { code: "sorted(avg.items(), key=lambda kv: kv[1], reverse=True)[:2]", note: { en: 'line the piles up, biggest first, keep the top two', mr: 'ढीग रांगेत लावा, मोठा आधी, पहिले दोन ठेवा' } },
      ],
      pitfall: { en: 'max(avg) and sorted(avg) look at the dict keys, so they rank crop names alphabetically, not prices. Rank by value with key=lambda kv: kv[1]. And skip blank prices before you average; int("") crashes, and 0 lies.', mr: 'max(avg) आणि sorted(avg) dict च्या keys पाहतात, म्हणून ते भाव नाही, पिकांची नावं अक्षरक्रमाने लावतात. value प्रमाणे क्रमासाठी key=lambda kv: kv[1] वापरा. आणि सरासरीआधी रिकामे भाव वगळा; int("") crash होतो, आणि 0 खोटं बोलतो.' },
    },
    practice: {
      intro: { en: 'data/prices.csv holds clean prices from four mandis (one blank). Build the morning summary the intern used to make by hand. Every step also runs on a hidden day with a new mandi.', mr: 'data/prices.csv मध्ये चार मंड्यांचे साफ भाव आहेत (एक रिकामा). intern हाताने बनवायची तो सकाळचा सारांश बनवा. प्रत्येक पायरी नव्या मंडीसह लपवलेल्या दिवशीही चालते.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'How many price rows came in for each crop? Build counts, a Counter of the commodity column (every row counts, even a blank price: it was still sent). Then print counts.most_common(). Rows are already loaded for you.', mr: 'प्रत्येक पिकासाठी किती price rows आल्या? counts बनवा, commodity column चा Counter (प्रत्येक row मोजायची, रिकामा भाव असला तरी: ती पाठवली तर गेली). मग counts.most_common() print करा. rows तुमच्यासाठी आधीच load केल्या आहेत.' },
          files: { 'data/prices.csv': PRICES },
          starter: `${READ_PRICES}
counts = Counter()
# TODO: count every row's commodity

print('rows:', len(rows))
print(counts.most_common())
`,
          solution: `${READ_PRICES}
counts = Counter(row['commodity'] for row in rows)

print('rows:', len(rows))
print(counts.most_common())
`,
          output: ['rows: 13', "[('onion', 7), ('tomato', 4), ('potato', 2)]"],
          checks: [{ expr: "isinstance(counts, Counter) and counts['tomato'] == 4", message: { en: 'counts should be a Counter with tomato = 4 (the blank Nagpur row was still sent).', mr: 'counts हा Counter हवा आणि त्यात tomato = 4 (नागपूरची रिकामी row सुद्धा पाठवली गेली होती).' } }],
          variants: [
            {
              label: { en: 'Hidden day: Solapur joins, potato is the busiest', mr: 'लपवलेला दिवस: सोलापूर येतं, बटाटा सगळ्यात जास्त' },
              files: { 'data/prices.csv': PRICES_DAY2 },
              output: ['rows: 11', "[('potato', 5), ('onion', 4), ('tomato', 2)]"],
              checks: [{ expr: "counts['potato'] == 5", message: { en: 'On the hidden day potato should be counted 5 times.', mr: 'लपवलेल्या दिवशी potato 5 वेळा मोजला जायला हवा.' } }],
            },
          ],
          hints: [
            { en: 'A Counter is a dict that starts every key at 0. Either loop and do counts[row["commodity"]] += 1, or give Counter all the values at once.', mr: 'Counter ही अशी dict आहे जिथे प्रत्येक key 0 पासून सुरू होते. एकतर loop करून counts[row["commodity"]] += 1 करा, किंवा Counter ला सगळ्या values एकदम द्या.' },
            { en: 'Counter(row["commodity"] for row in rows) counts the whole column in one line.', mr: 'Counter(row["commodity"] for row in rows) पूर्ण column एका ओळीत मोजतो.' },
            { en: "counts = Counter(row['commodity'] for row in rows)", mr: "counts = Counter(row['commodity'] for row in rows)" },
          ],
          successLine: { en: 'SELECT commodity, COUNT(*) ... GROUP BY, in one line of Python.', mr: 'SELECT commodity, COUNT(*) ... GROUP BY, Python च्या एका ओळीत.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Press Run first: it crashes. Read the error, then fix it. Collect prices per commodity in groups (a defaultdict(list)), skipping rows with a blank price, and print one line per crop with avg (2 decimals), min, max and how many prices were used. The print line is written for you.', mr: 'आधी Run दाबा: तो crash होतो. error वाचा, मग दुरुस्त करा. प्रत्येक commodity चे भाव groups मध्ये (एक defaultdict(list)) गोळा करा, रिकामा भाव असलेल्या rows वगळून, आणि प्रत्येक पिकासाठी avg (2 decimals), min, max आणि किती भाव वापरले ते एका ओळीत print करा. print ची ओळ तुमच्यासाठी लिहिलेली आहे.' },
          files: { 'data/prices.csv': PRICES },
          starter: `${READ_PRICES}
groups = defaultdict(list)
for row in rows:
    groups[row['commodity']].append(int(row['price']))

for commodity in sorted(groups):
    prices = groups[commodity]
    print(f"{commodity}: avg {sum(prices) / len(prices):.2f} | min {min(prices)} | max {max(prices)} | {len(prices)} prices")
`,
          solution: `${READ_PRICES}
groups = defaultdict(list)
for row in rows:
    if row['price'] == '':
        continue
    groups[row['commodity']].append(int(row['price']))

for commodity in sorted(groups):
    prices = groups[commodity]
    print(f"{commodity}: avg {sum(prices) / len(prices):.2f} | min {min(prices)} | max {max(prices)} | {len(prices)} prices")
`,
          output: ['onion: avg 2420.00 | min 2280 | max 2610 | 7 prices', 'potato: avg 1750.00 | min 1700 | max 1800 | 2 prices', 'tomato: avg 1616.67 | min 1500 | max 1700 | 3 prices'],
          checks: [{ expr: "groups['tomato'] == [1500, 1650, 1700]", message: { en: 'groups["tomato"] should be [1500, 1650, 1700]: the blank Nagpur price is skipped, not added as 0.', mr: 'groups["tomato"] म्हणजे [1500, 1650, 1700] हवं: नागपूरचा रिकामा भाव वगळायचा, 0 म्हणून जोडायचा नाही.' } }],
          mustNotUse: [{ pattern: 'or\\s+0\\b|else\\s+0\\b', message: { en: 'Do not turn the blank into 0. Skip that row instead.', mr: 'रिकाम्या जागेचं 0 करू नका. ती row वगळा.' } }],
          variants: [
            {
              label: { en: 'Hidden day: Solapur with a blank potato price', mr: 'लपवलेला दिवस: सोलापूर, बटाट्याचा भाव रिकामा' },
              files: { 'data/prices.csv': PRICES_DAY2 },
              output: ['onion: avg 2495.00 | min 2320 | max 2700 | 4 prices', 'potato: avg 1812.50 | min 1690 | max 1900 | 4 prices', 'tomato: avg 1600.00 | min 1480 | max 1720 | 2 prices'],
              checks: [{ expr: "len(groups['potato']) == 4", message: { en: 'On the hidden day potato should have 4 prices (the blank one skipped).', mr: 'लपवलेल्या दिवशी potato चे 4 भाव हवेत (रिकामा वगळून).' } }],
            },
          ],
          hints: [
            { en: 'The error is ValueError: invalid literal for int() with base 10: \'\'. One row has an empty price, and int("") cannot work.', mr: 'error आहे ValueError: invalid literal for int() with base 10: \'\'. एका row चा भाव रिकामा आहे, आणि int("") चालू शकत नाही.' },
            { en: 'Before the append, check the price: if row["price"] == "" then continue (skip to the next row). Do not use 0; that would pull the tomato average down.', mr: 'append आधी भाव तपासा: if row["price"] == "" तर continue (पुढच्या row वर जा). 0 वापरू नका; त्याने टोमॅटोची सरासरी खाली येईल.' },
            { en: "for row in rows:\n    if row['price'] == '':\n        continue\n    groups[row['commodity']].append(int(row['price']))", mr: "for row in rows:\n    if row['price'] == '':\n        continue\n    groups[row['commodity']].append(int(row['price']))" },
          ],
          successLine: { en: 'Average, min and max per crop, with the blank honestly left out.', mr: 'प्रत्येक पिकाची सरासरी, min आणि max, रिकामी जागा प्रामाणिकपणे वगळून.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Sam wants the top 2 crops by average price. Press Run and read the four printed lines. Which line answers his question?', mr: 'Sam ला सरासरी भावाप्रमाणे पहिली 2 पिकं हवीत. Run दाबा आणि print झालेल्या चार ओळी वाचा. कोणती ओळ त्याच्या प्रश्नाचं उत्तर देते?' },
          pythonSandbox: {
            code: `avg = {'onion': 2420.0, 'potato': 1750.0, 'tomato': 1616.67}

print('line 1:', sorted(avg))
print('line 2:', max(avg))
print('line 3:', sorted(avg.items(), key=lambda kv: kv[1], reverse=True)[:2])
print('line 4:', sorted(avg.values())[:2])
`,
          },
          options: [
            { en: 'Line 1: sorted(avg)', mr: 'Line 1: sorted(avg)' },
            { en: 'Line 2: max(avg)', mr: 'Line 2: max(avg)' },
            { en: 'Line 3: sorted(avg.items(), key=lambda kv: kv[1], reverse=True)[:2]', mr: 'Line 3: sorted(avg.items(), key=lambda kv: kv[1], reverse=True)[:2]' },
            { en: 'Line 4: sorted(avg.values())[:2]', mr: 'Line 4: sorted(avg.values())[:2]' },
          ],
          correct: [2],
          explain: { en: 'sorted(avg) and max(avg) look only at the keys, so they go by alphabet (max(avg) is "tomato", the cheapest crop!). Line 4 has prices but lost the names, and sorts smallest first. Line 3 sorts the (name, price) pairs by price, biggest first, and keeps two: [(\'onion\', 2420.0), (\'potato\', 1750.0)].', mr: 'sorted(avg) आणि max(avg) फक्त keys पाहतात, म्हणून ते अक्षरक्रमाने जातात (max(avg) म्हणजे "tomato", सगळ्यात स्वस्त पीक!). Line 4 मध्ये भाव आहेत पण नावं हरवली, आणि ते लहानापासून sort करतं. Line 3 (name, price) जोड्या भावाप्रमाणे, मोठ्यापासून sort करून दोन ठेवतं: [(\'onion\', 2420.0), (\'potato\', 1750.0)].' },
          hints: [
            { en: 'The answer needs both the crop name and its price, with the highest price first.', mr: 'उत्तरात पिकाचं नाव आणि भाव दोन्ही हवेत, सगळ्यात जास्त भाव आधी.' },
            { en: 'Look at what line 2 printed. Is tomato really the most expensive crop?', mr: 'line 2 ने काय print केलं ते पाहा. टोमॅटो खरंच सगळ्यात महाग पीक आहे का?' },
          ],
          successLine: { en: 'Sort by the value, not the key. That trap catches seniors too.', mr: 'key नाही, value प्रमाणे sort करा. या सापळ्यात seniors सुद्धा अडकतात.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Now GROUP BY commodity, market. groups already collects prices per (commodity, market). Build summary with a dict comprehension: each key maps to {"avg": average rounded to 2 decimals, "min": ..., "max": ...}. The print loop is ready.', mr: 'आता GROUP BY commodity, market. groups आधीच (commodity, market) प्रमाणे भाव गोळा करतो. dict comprehension ने summary बनवा: प्रत्येक key साठी {"avg": 2 decimals पर्यंत round केलेली सरासरी, "min": ..., "max": ...}. print loop तयार आहे.' },
          files: { 'data/prices.csv': PRICES },
          starter: `${READ_PRICES}
groups = defaultdict(list)
for row in rows:
    if row['price']:
        groups[(row['commodity'], row['market'])].append(int(row['price']))

summary = {}
# TODO: summary = {key: {'avg': ..., 'min': ..., 'max': ...} for key, p in groups.items()}

for (commodity, market), s in sorted(summary.items()):
    print(commodity, market, s['avg'], s['min'], s['max'])
`,
          solution: `${READ_PRICES}
groups = defaultdict(list)
for row in rows:
    if row['price']:
        groups[(row['commodity'], row['market'])].append(int(row['price']))

summary = {key: {'avg': round(sum(p) / len(p), 2), 'min': min(p), 'max': max(p)} for key, p in groups.items()}

for (commodity, market), s in sorted(summary.items()):
    print(commodity, market, s['avg'], s['min'], s['max'])
`,
          output: ['onion Lasalgaon 2580.0 2550 2610', 'onion Nagpur 2350.0 2350 2350', 'onion Nashik 2425.0 2400 2450', 'onion Pune 2290.0 2280 2300', 'potato Nagpur 1700.0 1700 1700', 'potato Pune 1800.0 1800 1800', 'tomato Nashik 1675.0 1650 1700', 'tomato Pune 1500.0 1500 1500'],
          checks: [
            { expr: "summary[('onion', 'Lasalgaon')] == {'avg': 2580.0, 'min': 2550, 'max': 2610}", message: { en: 'summary[("onion", "Lasalgaon")] should be {"avg": 2580.0, "min": 2550, "max": 2610}.', mr: 'summary[("onion", "Lasalgaon")] म्हणजे {"avg": 2580.0, "min": 2550, "max": 2610} हवं.' } },
            { expr: "len(summary) == 8", message: { en: 'There are 8 (commodity, market) groups with at least one price.', mr: 'किमान एक भाव असलेले 8 (commodity, market) groups आहेत.' } },
          ],
          mustUse: [{ pattern: 'summary\\s*=\\s*\\{\\s*[\\w(]', message: { en: 'Build summary with a dict comprehension: summary = {key: ... for key, p in groups.items()}.', mr: 'summary dict comprehension ने बनवा: summary = {key: ... for key, p in groups.items()}.' } }],
          variants: [
            {
              label: { en: 'Hidden day: Solapur onion has two prices', mr: 'लपवलेला दिवस: सोलापूरच्या कांद्याचे दोन भाव' },
              files: { 'data/prices.csv': PRICES_DAY2 },
              output: ['onion Nashik 2460.0 2460 2460', 'onion Pune 2320.0 2320 2320', 'onion Solapur 2600.0 2500 2700', 'potato Nagpur 1690.0 1690 1690', 'potato Nashik 1900.0 1900 1900', 'potato Pune 1830.0 1820 1840', 'tomato Nashik 1720.0 1720 1720', 'tomato Pune 1480.0 1480 1480'],
              checks: [{ expr: "summary[('onion', 'Solapur')] == {'avg': 2600.0, 'min': 2500, 'max': 2700}", message: { en: 'On the hidden day, Solapur onion should be avg 2600.0, min 2500, max 2700.', mr: 'लपवलेल्या दिवशी सोलापूरचा कांदा avg 2600.0, min 2500, max 2700 हवा.' } }],
            },
          ],
          hints: [
            { en: 'groups.items() gives pairs like (("onion", "Pune"), [2300, 2280]). In the comprehension, call them key and p.', mr: 'groups.items() अशा जोड्या देतो: (("onion", "Pune"), [2300, 2280]). comprehension मध्ये त्यांना key आणि p म्हणा.' },
            { en: 'For each p the value is a small dict: {"avg": round(sum(p) / len(p), 2), "min": min(p), "max": max(p)}.', mr: 'प्रत्येक p साठी value ही एक छोटी dict: {"avg": round(sum(p) / len(p), 2), "min": min(p), "max": max(p)}.' },
            { en: "summary = {key: {'avg': round(sum(p) / len(p), 2), 'min': min(p), 'max': max(p)} for key, p in groups.items()}", mr: "summary = {key: {'avg': round(sum(p) / len(p), 2), 'min': min(p), 'max': max(p)} for key, p in groups.items()}" },
          ],
          successLine: { en: 'A full GROUP BY commodity, market with AVG, MIN and MAX, in one comprehension.', mr: 'AVG, MIN आणि MAX सह पूर्ण GROUP BY commodity, market, एका comprehension मध्ये.' },
        },
        {
          kind: 'python',
          prompt: { en: 'The farmer\'s question: where should I take my truck? Write top_markets(rows, commodity, n): average the prices of that commodity per market (skip blanks), round to 2 decimals, and return the n best as (market, avg) pairs, highest first. Use sorted with key= and reverse=True. Hidden tests call it with other crops and sizes.', mr: 'शेतकऱ्याचा प्रश्न: ट्रक कुठे नेऊ? top_markets(rows, commodity, n) लिहा: त्या commodity चे भाव market प्रमाणे सरासरी करा (रिकामे वगळून), 2 decimals पर्यंत round करा, आणि सगळ्यात चांगले n बाजार (market, avg) जोड्या म्हणून, सगळ्यात जास्त आधी, परत द्या. key= आणि reverse=True सह sorted वापरा. लपवलेल्या tests इतर पिकं आणि आकडे देऊन ते तपासतात.' },
          files: { 'data/prices.csv': PRICES },
          starter: `${READ_PRICES}
def top_markets(rows, commodity, n):
    prices = defaultdict(list)
    for row in rows:
        if row['commodity'] == commodity and row['price']:
            prices[row['market']].append(int(row['price']))
    # TODO: averages = [(market, rounded average) for each market]
    # TODO: return them sorted by average, highest first, only the first n
    return []

print('onion top 2:', top_markets(rows, 'onion', 2))
print('potato top 1:', top_markets(rows, 'potato', 1))
`,
          solution: `${READ_PRICES}
def top_markets(rows, commodity, n):
    prices = defaultdict(list)
    for row in rows:
        if row['commodity'] == commodity and row['price']:
            prices[row['market']].append(int(row['price']))
    averages = [(market, round(sum(p) / len(p), 2)) for market, p in prices.items()]
    return sorted(averages, key=lambda pair: pair[1], reverse=True)[:n]

print('onion top 2:', top_markets(rows, 'onion', 2))
print('potato top 1:', top_markets(rows, 'potato', 1))
`,
          output: ["onion top 2: [('Lasalgaon', 2580.0), ('Nashik', 2425.0)]", "potato top 1: [('Pune', 1800.0)]"],
          checks: [
            { expr: "top_markets(rows, 'tomato', 5) == [('Nashik', 1675.0), ('Pune', 1500.0)]", message: { en: 'top_markets(rows, "tomato", 5) should give [("Nashik", 1675.0), ("Pune", 1500.0)]: only markets that have a price, even if n is bigger.', mr: 'top_markets(rows, "tomato", 5) ने [("Nashik", 1675.0), ("Pune", 1500.0)] द्यायला हवं: n मोठा असला तरी फक्त भाव असलेले बाजार.' } },
            { expr: "[m for m, a in top_markets(rows, 'onion', 4)] == ['Lasalgaon', 'Nashik', 'Nagpur', 'Pune']", message: { en: 'All four onion markets should come back highest first: Lasalgaon, Nashik, Nagpur, Pune.', mr: 'कांद्याचे चारही बाजार सगळ्यात जास्त आधी यायला हवेत: Lasalgaon, Nashik, Nagpur, Pune.' } },
          ],
          mustUse: [{ pattern: 'reverse\\s*=\\s*True', message: { en: 'Sort with reverse=True so the best price comes first.', mr: 'reverse=True ने sort करा, म्हणजे सगळ्यात चांगला भाव आधी येईल.' } }],
          variants: [
            {
              label: { en: 'Hidden day: Solapur pays the most for onion', mr: 'लपवलेला दिवस: कांद्याला सोलापूर सगळ्यात जास्त देतं' },
              files: { 'data/prices.csv': PRICES_DAY2 },
              output: ["onion top 2: [('Solapur', 2600.0), ('Nashik', 2460.0)]", "potato top 1: [('Nashik', 1900.0)]"],
              checks: [{ expr: "top_markets(rows, 'potato', 3) == [('Nashik', 1900.0), ('Pune', 1830.0), ('Nagpur', 1690.0)]", message: { en: 'On the hidden day, the potato top 3 should be Nashik 1900.0, Pune 1830.0, Nagpur 1690.0 (Solapur only sent a blank).', mr: 'लपवलेल्या दिवशी बटाट्याचे पहिले 3: Nashik 1900.0, Pune 1830.0, Nagpur 1690.0 (सोलापूरने फक्त रिकामा भाव पाठवला).' } }],
            },
          ],
          hints: [
            { en: 'Two lines are missing. First a list comprehension over prices.items() that makes (market, average) pairs. Then sorted(...) on that list.', mr: 'दोन ओळी राहिल्या आहेत. आधी prices.items() वर list comprehension जी (market, average) जोड्या बनवते. मग त्या list वर sorted(...).' },
            { en: 'averages = [(market, round(sum(p) / len(p), 2)) for market, p in prices.items()]. Then sort by the second item: key=lambda pair: pair[1], reverse=True, and slice [:n].', mr: 'averages = [(market, round(sum(p) / len(p), 2)) for market, p in prices.items()]. मग दुसऱ्या item प्रमाणे sort: key=lambda pair: pair[1], reverse=True, आणि [:n] ने कापा.' },
            { en: "    averages = [(market, round(sum(p) / len(p), 2)) for market, p in prices.items()]\n    return sorted(averages, key=lambda pair: pair[1], reverse=True)[:n]", mr: "    averages = [(market, round(sum(p) / len(p), 2)) for market, p in prices.items()]\n    return sorted(averages, key=lambda pair: pair[1], reverse=True)[:n]" },
          ],
          successLine: { en: 'ORDER BY avg DESC LIMIT n, as a function the app can call every morning.', mr: 'ORDER BY avg DESC LIMIT n, रोज सकाळी app बोलावू शकेल असं function.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: "from collections import Counter\nc = Counter(['onion', 'potato', 'onion', 'tomato', 'onion', 'potato'])\nprint(c.most_common(2))",
        options: ["[('onion', 3)]", "[('onion', 3), ('potato', 2)]", "{'onion': 3, 'potato': 2}", "['onion', 'potato']"],
        answer: 1,
        explain: { en: 'most_common(2) returns a list of the two most frequent (value, count) pairs, biggest first.', mr: 'most_common(2) सगळ्यात जास्त वेळा आलेल्या दोन (value, count) जोड्यांची list देतो, मोठी आधी.' },
      },
      {
        q: { en: 'Your code collects prices with groups[(commodity, market)].append(price) and then averages each group. Which SQL does the same job?', mr: 'तुमचा code groups[(commodity, market)].append(price) ने भाव गोळा करतो आणि मग प्रत्येक group ची सरासरी काढतो. कोणता SQL हेच काम करतो?' },
        options: [
          'SELECT AVG(price) FROM prices',
          'SELECT commodity, market, price FROM prices ORDER BY market',
          'SELECT DISTINCT commodity, market FROM prices',
          'SELECT commodity, market, AVG(price) FROM prices GROUP BY commodity, market',
        ],
        answer: 3,
        explain: { en: 'The tuple key (commodity, market) is the GROUP BY list, and the average per group is AVG(price). The first option averages everything into one number.', mr: 'tuple key (commodity, market) म्हणजे GROUP BY ची यादी, आणि प्रत्येक group ची सरासरी म्हणजे AVG(price). पहिला पर्याय सगळ्याची एकच सरासरी काढतो.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: "avg = {'Pune': 2290.0, 'Lasalgaon': 2580.0, 'Nashik': 2425.0}\nbest = sorted(avg.items(), key=lambda kv: kv[1], reverse=True)[:2]\nprint(best)",
        options: ["[('Lasalgaon', 2580.0), ('Nashik', 2425.0)]", "[('Pune', 2290.0), ('Nashik', 2425.0)]", "['Lasalgaon', 'Nashik']", "[('Lasalgaon', 2580.0), ('Pune', 2290.0)]"],
        answer: 0,
        explain: { en: 'key=lambda kv: kv[1] sorts the pairs by price, reverse=True puts the highest first, and [:2] keeps two. The names stay with their prices.', mr: 'key=lambda kv: kv[1] जोड्या भावाप्रमाणे sort करतो, reverse=True सगळ्यात जास्त आधी ठेवतो, आणि [:2] दोन ठेवतो. नावं त्यांच्या भावांसोबत राहतात.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: "groups = {'onion': [2300, 2400, 2550], 'tomato': [1500, 1650]}\navg = {k: round(sum(v) / len(v), 2) for k, v in groups.items()}\nprint(avg)",
        options: ["{'onion': 7250, 'tomato': 3150}", '[2416.67, 1575.0]', "{'onion': 2416.67, 'tomato': 1575.0}", "{'onion': 2416.6666666666665, 'tomato': 1575}"],
        answer: 2,
        explain: { en: 'The dict comprehension makes one entry per crop: 7250 / 3 rounded to 2416.67, and 3150 / 2 = 1575.0 (division always gives a float).', mr: 'dict comprehension प्रत्येक पिकासाठी एक entry बनवतो: 7250 / 3 round करून 2416.67, आणि 3150 / 2 = 1575.0 (भागाकार नेहमी float देतो).' },
      },
    ],
    recap: { line: { en: 'Counter counts, defaultdict(list) makes the piles, a comprehension summarises each pile, sorted(key=, reverse=True)[:n] ranks them. GROUP BY, by hand.', mr: 'Counter मोजतो, defaultdict(list) ढीग बनवतो, comprehension प्रत्येक ढिगाचा सारांश काढतो, sorted(key=, reverse=True)[:n] क्रम लावतो. हाताने केलेला GROUP BY.' }, icon: '📊' },
  },

  // ───────────────────────── Y2.6 Boss: The Mandi Files
  {
    id: 'py2-6',
    code: 'Y2.6',
    level: 'intermediate',
    isBoss: true,
    title: { en: 'Boss: The Mandi Files', mr: 'Boss: मंडीच्या files' },
    skill: 'A mini ETL pipeline: extract, transform, quarantine, dedupe, validate, load, run summary',
    realLife: {
      place: 'market',
      title: { en: 'Dawn at the Lasalgaon onion yard', mr: 'लासलगावच्या कांदा यार्डात पहाट' },
      story: {
        en: 'Lasalgaon, 5 a.m. Tractors and trucks roll in from a dozen villages, every one loaded differently: gunny sacks, crates, loose heaps. At the gate each load is written down. In the yard, graders sort the onions by size and set aside rotten or wet sacks, each with a slip saying why, so the farmer can see what happened. Before the auction board goes up, the weighbridge clerk checks one rule: weight in = weight sold + weight set aside. If even one sack is missing from that sum, nobody leaves until it is found. Only then are the day\'s rates written on the board for the whole district to read.',
        mr: 'लासलगाव, पहाटे 5 वाजता. डझनभर गावांमधून ट्रॅक्टर आणि ट्रक येतात, प्रत्येकात माल वेगळ्या प्रकारे भरलेला: गोणी, crates, सुटे ढीग. गेटवर प्रत्येक गाडीची नोंद होते. यार्डात graders कांदे आकाराप्रमाणे वेगळे करतात आणि सडलेल्या किंवा ओल्या गोणी बाजूला ठेवतात, प्रत्येकीवर का ते सांगणारी चिठ्ठी, म्हणजे शेतकऱ्याला काय झालं ते दिसतं. लिलावाचा फलक लागण्याआधी वजनकाट्यावरचा clerk एक नियम तपासतो: आलेलं वजन = विकलेलं वजन + बाजूला ठेवलेलं वजन. त्या बेरजेतून एक गोणी जरी गायब असली तरी ती सापडेपर्यंत कोणीही जात नाही. त्यानंतरच दिवसाचे भाव संपूर्ण जिल्ह्याने वाचण्यासाठी फलकावर लिहिले जातात.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🚚', label: 'Loads arrive from every village (extract)', mr: 'प्रत्येक गावातून माल येतो (extract)' },
          { icon: '🧅', label: 'Sort and grade (transform)', mr: 'वर्गीकरण आणि grading (transform)' },
          { icon: '🏷️', label: 'Bad sacks aside, with a slip (quarantine)', mr: 'खराब गोणी बाजूला, चिठ्ठीसह (quarantine)' },
          { icon: '⚖️', label: 'In = sold + set aside (validate)', mr: 'आलेलं = विकलेलं + बाजूला ठेवलेलं (validate)' },
          { icon: '📋', label: 'Rates on the board (load)', mr: 'भाव फलकावर (load)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'This morning our app showed potato in Nashik at minus ₹1,900 a quintal. Farmers are sharing screenshots on WhatsApp. I need the daily prices file to be right, every single day.', mr: 'आज सकाळी आपल्या app ने नाशिकमध्ये बटाटा उणे ₹1,900 प्रति क्विंटल दाखवला. शेतकरी WhatsApp वर screenshots पाठवत आहेत. मला daily prices file रोज, प्रत्येक दिवशी बरोबर हवी.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'tonight you get everything at once. a json from lasalgaon with rupee signs and commas. a csv i chewed in half. a mandi that sends its file twice. and a new market you have never seen. enjoy. ⌁', mr: 'आज रात्री तुला सगळं एकदम मिळणार. rupee चिन्ह आणि commas असलेली लासलगावची json. मी अर्धी चावलेली csv. आपली file दोनदा पाठवणारी मंडी. आणि तू कधीच न पाहिलेला नवा बाजार. मजा कर. ⌁' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Then we build a real pipeline. Extract every file, transform and quarantine the bad rows with a reason, validate that every row is accounted for, load two clean files, and print a run summary. If the numbers do not reconcile, the run stops.', mr: 'मग आपण खरी pipeline बनवू. प्रत्येक file extract करा, transform करा आणि खराब rows कारणासह quarantine करा, प्रत्येक row चा हिशोब लागतो ते validate करा, दोन साफ files load करा, आणि run summary print करा. आकडे जुळले नाहीत तर run थांबतो.' } },
        { who: 'meera', mood: 'happy', text: { en: 'You have built every piece already, {name}: csv, JSON, try/except, cleaning, grouping. Tonight you connect them. Two hints per step, so read the error messages like a tester.', mr: 'प्रत्येक तुकडा तू आधीच बनवला आहेस, {name}: csv, JSON, try/except, cleaning, grouping. आज रात्री ते जोडायचे. प्रत्येक पायरीला दोन hints, म्हणून error messages tester सारखे वाच.' } },
      ],
      problem: { en: 'Prices arrive as CSV and JSON files from many mandis, each messy in its own way, and the Gremlin corrupts some of them. One bad row reaches the app and farmers see a negative price; a silently dropped row means a mandi disappears.', mr: 'भाव अनेक मंड्यांकडून CSV आणि JSON files म्हणून येतात, प्रत्येक आपापल्या पद्धतीने गोंधळलेली, आणि Gremlin त्यातल्या काही खराब करतो. एक खराब row app पर्यंत पोहोचली की शेतकऱ्यांना उणे भाव दिसतो; एखादी row गुपचूप गळली की एक मंडीच गायब होते.' },
      solution: { en: 'A small ETL pipeline made of functions: extract() reads every file in the folder, transform() cleans, dedupes and quarantines bad rows with a reason, validate() asserts read = good + rejected and no price at or below zero, load() writes out/daily_prices.csv and out/rejects.csv, and a summary shows what happened.', mr: 'functions ने बनलेली छोटी ETL pipeline: extract() folder मधली प्रत्येक file वाचतो, transform() साफ करतो, dedupe करतो आणि खराब rows कारणासह quarantine करतो, validate() read = good + rejected आणि शून्य किंवा त्याखाली एकही भाव नाही हे assert करतो, load() out/daily_prices.csv आणि out/rejects.csv लिहितो, आणि summary काय झालं ते दाखवते.' },
    },
    lesson: [
      { en: 'ETL means Extract, Transform, Load. Extract reads the sources as they are (here: every .csv and .json in data/in) into one list of rows with the same keys. Transform cleans and checks them. Load writes the result where other systems read it. Keeping each stage in its own function means you can test each one alone, and when something breaks you know which stage to open.', mr: 'ETL म्हणजे Extract, Transform, Load. Extract sources जसे आहेत तसे वाचतो (इथे: data/in मधली प्रत्येक .csv आणि .json) आणि त्यांना सारख्या keys असलेल्या rows च्या एका list मध्ये आणतो. Transform त्या साफ करतो आणि तपासतो. Load निकाल अशा ठिकाणी लिहितो जिथून इतर systems तो वाचतात. प्रत्येक stage वेगळ्या function मध्ये ठेवली की प्रत्येक वेगळी तपासता येते, आणि काही बिघडलं की कोणती stage उघडायची ते कळतं.' },
      { en: 'Never let a bad row crash the run, and never drop it silently. Quarantine it: copy the raw row, add a reason ("unknown commodity", "bad date", "missing price", "bad price", "duplicate"), and write it to a rejects file. Someone can then fix it at the source. Check in a fixed order and keep the first reason, so the same input always gives the same answer.', mr: 'खराब row मुळे run कधीही crash होऊ देऊ नका, आणि ती गुपचूप टाकूनही देऊ नका. तिला quarantine करा: raw row copy करा, कारण जोडा ("unknown commodity", "bad date", "missing price", "bad price", "duplicate"), आणि ती rejects file मध्ये लिहा. मग कोणीतरी ती source वर दुरुस्त करू शकतं. ठरलेल्या क्रमाने तपासा आणि पहिलं कारण ठेवा, म्हणजे तोच input नेहमी तेच उत्तर देईल.' },
      { en: 'Validate before you load, like the weighbridge clerk: rows read = good + rejected. If they do not match, a row vanished somewhere and the numbers cannot be trusted, so assert stops the run before a wrong file reaches farmers. Add business rules too: no price at or below zero. This is your QA brain inside the pipeline.', mr: 'load करण्याआधी validate करा, वजनकाट्यावरच्या clerk सारखं: वाचलेल्या rows = good + rejected. जुळल्या नाहीत तर कुठेतरी एक row गायब झाली आणि आकड्यांवर विश्वास ठेवता येत नाही, म्हणून चुकीची file शेतकऱ्यांपर्यंत पोहोचण्याआधी assert run थांबवतो. business rules सुद्धा जोडा: शून्य किंवा त्याखाली भाव नाही. हा pipeline मधला तुमचा QA मेंदू.' },
      { en: 'Load so that a re-run is safe: write fresh files with "w" (never append), sorted in a fixed order, so running the same day twice gives exactly the same output. Then print a short run summary (read, good, rejected, rejects by reason). The on-call engineer reads that line first at 6 a.m. Real pipelines on AWS Glue or Spark follow these same stages, only bigger.', mr: 'असं load करा की पुन्हा चालवणं सुरक्षित असेल: नव्या files "w" ने लिहा (कधीही append नाही), ठरलेल्या क्रमाने sort करून, म्हणजे तोच दिवस दोनदा चालवला तरी output अगदी तेच येईल. मग छोटी run summary print करा (read, good, rejected, कारणाप्रमाणे rejects). सकाळी 6 वाजता on-call engineer आधी तीच ओळ वाचतो. AWS Glue किंवा Spark वरच्या खऱ्या pipelines याच stages पाळतात, फक्त मोठ्या प्रमाणावर.' },
    ],
    syntax: {
      template: `def extract(folder):        # every file -> one list of raw rows
    ...
def clean_row(row):         # -> (clean_dict, None) or (None, reason)
    ...
def transform(rows):        # -> good, rejects (dedupe, reasons)
    ...
def validate(read_count, good, rejects):
    assert read_count == len(good) + len(rejects)
    assert all(r['price'] > 0 for r in good)

def load(good, rejects):    # write out/daily_prices.csv and out/rejects.csv
    ...

rows = extract('data/in')
good, rejects = transform(rows)
validate(len(rows), good, rejects)
load(good, rejects)`,
      parts: [
        { code: "sorted(Path(folder).glob('*.csv'))", means: { en: 'every CSV in the folder, in a fixed order; a new mandi file is picked up with no code change', mr: 'folder मधली प्रत्येक CSV, ठरलेल्या क्रमाने; नव्या मंडीची file code न बदलता उचलली जाते' } },
        { code: 'return None, reason', means: { en: 'a bad row is not an error: it comes back with the reason it failed', mr: 'खराब row म्हणजे error नाही: ती fail होण्याच्या कारणासह परत येते' } },
        { code: "bad = dict(row); bad['reason'] = reason", means: { en: 'quarantine keeps the raw values exactly as they arrived, plus why', mr: 'quarantine raw values जशा आल्या तशाच ठेवतो, आणि का ते' } },
        { code: 'assert read_count == len(good) + len(rejects)', means: { en: 'reconcile: every row read is either good or rejected; otherwise stop', mr: 'हिशोब जुळवा: वाचलेली प्रत्येक row एकतर good किंवा rejected; नाहीतर थांबा' } },
        { code: "open('out/daily_prices.csv', 'w', newline='')", means: { en: 'write a fresh file every run, so a re-run gives the same result', mr: 'प्रत्येक run ला नवी file लिहा, म्हणजे पुन्हा चालवलं तरी तोच निकाल' } },
      ],
      example: [
        { code: "extract('data/in')            # 14 raw rows from 3 files", note: { en: 'every load written down at the gate', mr: 'गेटवर प्रत्येक गाडीची नोंद' } },
        { code: "clean_row({... 'rate': '₹2,550'})  # price 2550", note: { en: 'rupee sign and comma stripped before int()', mr: 'int() आधी rupee चिन्ह आणि comma काढले' } },
        { code: "{'price': '-1900', 'reason': 'bad price'}", note: { en: 'a rotten sack set aside, with its slip', mr: 'सडलेली गोणी बाजूला, चिठ्ठीसह' } },
        { code: "validate(14, good, rejects)    # 14 == 7 + 7", note: { en: 'weight in = sold + set aside', mr: 'आलेलं वजन = विकलेलं + बाजूला ठेवलेलं' } },
        { code: "read: 14 | good: 7 | rejected: 7", note: { en: 'the run summary: the rate board for engineers', mr: 'run summary: engineers साठी भावांचा फलक' } },
      ],
      pitfall: { en: 'The classic pipeline bug is a row that disappears: a "continue" that skips a duplicate without recording it, or an except that swallows an error. Then the run is green and a mandi is missing. Every row must land in exactly one pile, and validate() must prove it.', mr: 'pipeline चा क्लासिक bug म्हणजे गायब होणारी row: duplicate नोंद न करता सोडणारा "continue", किंवा error गिळणारा except. मग run हिरवा असतो आणि एक मंडी गायब असते. प्रत्येक row बरोबर एकाच ढिगात पडायला हवी, आणि validate() ने ते सिद्ध करायला हवं.' },
    },
    practice: {
      intro: { en: 'Boss fight: five steps, two hints each, and every step re-runs on hidden nights (a new market, a corrupted file, a mandi that sends twice). The files are above the editor: data/in/pune.csv, data/in/nashik.csv and data/in/lasalgaon.json.', mr: 'Boss fight: पाच पायऱ्या, प्रत्येकीला दोन hints, आणि प्रत्येक पायरी लपवलेल्या रात्रींवर पुन्हा चालते (नवा बाजार, खराब file, दोनदा पाठवणारी मंडी). files editor वर आहेत: data/in/pune.csv, data/in/nashik.csv आणि data/in/lasalgaon.json.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'Extract. Write extract(folder): read every .csv in the folder (sorted) with csv.DictReader, then every .json (sorted) with json.load. Return one list of raw rows, each {"source": file name, "market", "commodity", "date", "price"}. The JSON uses other keys: mandi, crop, day, rate. Do not clean anything yet, and do not write file names in your code: tomorrow a new mandi may send a file.', mr: 'Extract. extract(folder) लिहा: folder मधली प्रत्येक .csv (sorted) csv.DictReader ने वाचा, मग प्रत्येक .json (sorted) json.load ने. raw rows ची एक list परत द्या, प्रत्येक {"source": file चं नाव, "market", "commodity", "date", "price"}. JSON वेगळ्या keys वापरते: mandi, crop, day, rate. अजून काहीही साफ करू नका, आणि code मध्ये file ची नावं लिहू नका: उद्या नवी मंडी file पाठवू शकते.' },
          files: B_FILES,
          starter: `${B_HEAD}
def extract(folder):
    rows = []
    # TODO 1: for every .csv in folder (sorted): csv.DictReader, one row dict per line
    # TODO 2: for every .json in folder (sorted): json.load, rename mandi/crop/day/rate
    # each row: {'source': file name, 'market': ..., 'commodity': ..., 'date': ..., 'price': ...}
    return rows

rows = extract('data/in')
print(f"extracted {len(rows)} rows from {len({r['source'] for r in rows})} files")
`,
          solution: `${B_HEAD}${B_EXTRACT}
rows = extract('data/in')
print(f"extracted {len(rows)} rows from {len({r['source'] for r in rows})} files")
`,
          output: ['extracted 14 rows from 3 files'],
          checks: [
            { expr: "all(set(r) == {'source', 'market', 'commodity', 'date', 'price'} for r in rows)", message: { en: 'Every row needs exactly the keys source, market, commodity, date and price (JSON rows too: mandi becomes market, crop commodity, day date, rate price).', mr: 'प्रत्येक row मध्ये नेमक्या source, market, commodity, date आणि price या keys हव्यात (JSON rows मध्येही: mandi चं market, crop चं commodity, day चं date, rate चं price).' } },
            { expr: "sorted({r['source'] for r in rows}) == ['lasalgaon.json', 'nashik.csv', 'pune.csv']", message: { en: 'source should be the file name only, like "pune.csv" (path.name), for all three files.', mr: 'source म्हणजे फक्त file चं नाव, उदा. "pune.csv" (path.name), तिन्ही files साठी.' } },
            { expr: "any(r['price'] == '₹2,550' for r in rows) and any(r['commodity'] == 'TOMATO ' for r in rows)", message: { en: 'Extract must keep raw values exactly as they arrived ("₹2,550", "TOMATO "). Cleaning comes in the next step.', mr: 'Extract ने raw values जशा आल्या तशाच ठेवायला हव्यात ("₹2,550", "TOMATO "). cleaning पुढच्या पायरीत.' } },
          ],
          mustUse: [{ pattern: 'glob|listdir|scandir', message: { en: 'Find the files with Path(folder).glob("*.csv") (or os.listdir), so new mandi files are picked up.', mr: 'files Path(folder).glob("*.csv") ने (किंवा os.listdir ने) शोधा, म्हणजे नव्या मंडीच्या files उचलल्या जातील.' } }],
          mustNotUse: [{ pattern: '(pune|nashik|lasalgaon)\\.(csv|json)', message: { en: 'Do not write file names in the code. Loop over whatever files are in the folder.', mr: 'code मध्ये file ची नावं लिहू नका. folder मध्ये ज्या files असतील त्यांच्यावर loop करा.' } }],
          variants: [
            {
              label: { en: 'A new market sends a file: nagpur.csv', mr: 'नवा बाजार file पाठवतो: nagpur.csv' },
              files: { 'data/in/nagpur.csv': B_NAGPUR },
              output: ['extracted 18 rows from 4 files'],
              checks: [{ expr: "sum(r['source'] == 'nagpur.csv' for r in rows) == 4", message: { en: 'The 4 rows of the new nagpur.csv were not extracted.', mr: 'नव्या nagpur.csv च्या 4 rows extract झाल्या नाहीत.' } }],
            },
            {
              label: { en: 'A second JSON file: solapur.json', mr: 'दुसरी JSON file: solapur.json' },
              files: { 'data/in/solapur.json': B_SOLAPUR_OK },
              output: ['extracted 16 rows from 4 files'],
              checks: [{ expr: "[r['market'] for r in rows if r['source'] == 'solapur.json'] == ['Solapur', 'Solapur']", message: { en: 'The rows from solapur.json are missing or not renamed (mandi should become market).', mr: 'solapur.json च्या rows गायब आहेत किंवा rename झाल्या नाहीत (mandi चं market व्हायला हवं).' } }],
            },
          ],
          hints: [
            { en: 'from pathlib import Path is already there. for path in sorted(Path(folder).glob("*.csv")): open(path, newline="", encoding="utf-8"), then for r in csv.DictReader(f): rows.append({"source": path.name, "market": r["market"], ...}). Do the same loop with "*.json", but use json.load(f) to get a list of dicts and read item["mandi"], item["crop"], item["day"], item["rate"].', mr: 'from pathlib import Path आधीच आहे. for path in sorted(Path(folder).glob("*.csv")): open(path, newline="", encoding="utf-8"), मग for r in csv.DictReader(f): rows.append({"source": path.name, "market": r["market"], ...}). "*.json" साठी तसाच loop, पण json.load(f) ने dicts ची list मिळवा आणि item["mandi"], item["crop"], item["day"], item["rate"] वाचा.' },
            { en: "    for path in sorted(Path(folder).glob('*.csv')):\n        with open(path, newline='', encoding='utf-8') as f:\n            for r in csv.DictReader(f):\n                rows.append({'source': path.name, 'market': r['market'], 'commodity': r['commodity'], 'date': r['date'], 'price': r['price']})\n    for path in sorted(Path(folder).glob('*.json')):\n        with open(path, encoding='utf-8') as f:\n            for item in json.load(f):\n                rows.append({'source': path.name, 'market': item['mandi'], 'commodity': item['crop'], 'date': item['day'], 'price': item['rate']})", mr: "    for path in sorted(Path(folder).glob('*.csv')):\n        with open(path, newline='', encoding='utf-8') as f:\n            for r in csv.DictReader(f):\n                rows.append({'source': path.name, 'market': r['market'], 'commodity': r['commodity'], 'date': r['date'], 'price': r['price']})\n    for path in sorted(Path(folder).glob('*.json')):\n        with open(path, encoding='utf-8') as f:\n            for item in json.load(f):\n                rows.append({'source': path.name, 'market': item['mandi'], 'commodity': item['crop'], 'date': item['day'], 'price': item['rate']})" },
            { en: 'Check the keys: every row must have source, market, commodity, date, price and nothing else.', mr: 'keys तपासा: प्रत्येक row मध्ये source, market, commodity, date, price आणि यापेक्षा जास्त काही नको.' },
          ],
          successLine: { en: 'HIT! Every load written down at the gate, whatever village it came from.', mr: 'HIT! प्रत्येक गाडीची गेटवर नोंद, ती कोणत्याही गावातून आली असो.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Transform, part 1. Write clean_row(row). It returns (clean_dict, None) for a good row, or (None, reason) for a bad one. Check in this order and stop at the first problem: commodity (strip, lower, ALIASES; must be in KNOWN, else "unknown commodity"), date (to_iso; None means "bad date"), price (remove ₹, commas and spaces; empty is "missing price"; not a whole number, or 0 or less, is "bad price"). A good row is {"date", "market" (strip + title), "commodity", "price" (int)}. JSON prices may already be numbers.', mr: 'Transform, भाग 1. clean_row(row) लिहा. ते चांगल्या row साठी (clean_dict, None) देतं, किंवा खराब row साठी (None, reason). या क्रमाने तपासा आणि पहिल्या समस्येवर थांबा: commodity (strip, lower, ALIASES; KNOWN मध्ये असायलाच हवी, नाहीतर "unknown commodity"), date (to_iso; None म्हणजे "bad date"), price (₹, commas आणि spaces काढा; रिकामा म्हणजे "missing price"; पूर्ण संख्या नसेल, किंवा 0 किंवा कमी असेल तर "bad price"). चांगली row म्हणजे {"date", "market" (strip + title), "commodity", "price" (int)}. JSON मधले भाव आधीच numbers असू शकतात.' },
          files: B_FILES,
          starter: `${B_HEAD}${B_EXTRACT}${B_TO_ISO}
def clean_row(row):
    """Return (clean_dict, None) for a good row, or (None, reason) for a bad one.
    Check in this order: commodity, date, price."""
    # TODO
    return None, 'not written yet'
${B_STEP2_RUN}`,
          solution: `${B_HEAD}${B_EXTRACT}${B_TO_ISO}${B_CLEAN_ROW}${B_STEP2_RUN}`,
          output: ['good: 9 | rejected: 5', "[('bad date', 1), ('bad price', 2), ('missing price', 1), ('unknown commodity', 1)]"],
          checks: [
            { expr: "clean_row({'source': 'x', 'market': ' pune ', 'commodity': 'KANDA ', 'date': '5-Nov-2026', 'price': '₹2,300'}) == ({'date': '2026-11-05', 'market': 'Pune', 'commodity': 'onion', 'price': 2300}, None)", message: { en: 'clean_row on {market " pune ", commodity "KANDA ", date "5-Nov-2026", price "₹2,300"} should return ({"date": "2026-11-05", "market": "Pune", "commodity": "onion", "price": 2300}, None).', mr: '{market " pune ", commodity "KANDA ", date "5-Nov-2026", price "₹2,300"} वर clean_row ने ({"date": "2026-11-05", "market": "Pune", "commodity": "onion", "price": 2300}, None) द्यायला हवं.' } },
            { expr: "clean_row({'source': 'x', 'market': 'Pune', 'commodity': 'onion', 'date': '2026-11-05', 'price': 2400})[0]['price'] == 2400", message: { en: 'A JSON price can already be a number (2400). Turn it into text with str() before removing ₹ and commas.', mr: 'JSON मधला भाव आधीच number (2400) असू शकतो. ₹ आणि commas काढण्याआधी str() ने त्याचा text करा.' } },
            { expr: "clean_row({'source': 'x', 'market': 'Pune', 'commodity': 'onion', 'date': '2026-11-05', 'price': '0'}) == (None, 'bad price')", message: { en: 'A price of 0 should give (None, "bad price").', mr: '0 भावाने (None, "bad price") द्यायला हवं.' } },
            { expr: "clean_row({'source': 'x', 'market': 'Pune', 'commodity': 'Garlic', 'date': '99/99/2026', 'price': ''}) == (None, 'unknown commodity')", message: { en: 'Order matters: a row with a bad commodity, bad date and no price is "unknown commodity" (the first check).', mr: 'क्रम महत्त्वाचा: commodity, तारीख दोन्ही खराब आणि भाव नसलेली row म्हणजे "unknown commodity" (पहिली तपासणी).' } },
          ],
          variants: [
            {
              label: { en: 'Next night: brinjal, a dotted date, a number price in JSON', mr: 'पुढची रात्र: वांगी, ठिपक्यांची तारीख, JSON मध्ये number भाव' },
              files: B_DAY2,
              output: ['good: 7 | rejected: 3', "[('bad date', 1), ('missing price', 1), ('unknown commodity', 1)]"],
              checks: [{ expr: "{'date': '2026-11-06', 'market': 'Lasalgaon', 'commodity': 'onion', 'price': 2610} in good and len([g for g in good if g['market'] == 'Lasalgaon']) == 3", message: { en: 'On the hidden night, the Lasalgaon rows (one market name in lowercase, one price given as the number 2610) were not all cleaned.', mr: 'लपवलेल्या रात्री लासलगावच्या सगळ्या rows साफ झाल्या नाहीत (एका market चं नाव lowercase मध्ये, एक भाव 2610 हा number).' } }],
            },
          ],
          hints: [
            { en: 'Use early returns, one per check: name = row["commodity"].strip().lower(); commodity = ALIASES.get(name, name); if commodity not in KNOWN: return None, "unknown commodity". Then date = to_iso(row["date"]) and if it is None return None, "bad date". For price: text = str(row["price"]).replace("₹", "").replace(",", "").strip(); "" is missing; int(text) inside try/except ValueError is bad price; then price <= 0 is bad price too.', mr: 'प्रत्येक तपासणीसाठी एक early return वापरा: name = row["commodity"].strip().lower(); commodity = ALIASES.get(name, name); if commodity not in KNOWN: return None, "unknown commodity". मग date = to_iso(row["date"]) आणि ते None असेल तर return None, "bad date". price साठी: text = str(row["price"]).replace("₹", "").replace(",", "").strip(); "" म्हणजे missing; try/except ValueError मध्ये int(text) म्हणजे bad price; मग price <= 0 सुद्धा bad price.' },
            { en: "    name = row['commodity'].strip().lower()\n    commodity = ALIASES.get(name, name)\n    if commodity not in KNOWN:\n        return None, 'unknown commodity'\n    date = to_iso(row['date'])\n    if date is None:\n        return None, 'bad date'\n    text = str(row['price']).replace('₹', '').replace(',', '').strip()\n    if text == '':\n        return None, 'missing price'\n    try:\n        price = int(text)\n    except ValueError:\n        return None, 'bad price'\n    if price <= 0:\n        return None, 'bad price'\n    return {'date': date, 'market': row['market'].strip().title(), 'commodity': commodity, 'price': price}, None", mr: "    name = row['commodity'].strip().lower()\n    commodity = ALIASES.get(name, name)\n    if commodity not in KNOWN:\n        return None, 'unknown commodity'\n    date = to_iso(row['date'])\n    if date is None:\n        return None, 'bad date'\n    text = str(row['price']).replace('₹', '').replace(',', '').strip()\n    if text == '':\n        return None, 'missing price'\n    try:\n        price = int(text)\n    except ValueError:\n        return None, 'bad price'\n    if price <= 0:\n        return None, 'bad price'\n    return {'date': date, 'market': row['market'].strip().title(), 'commodity': commodity, 'price': price}, None" },
            { en: 'The dict keys of a good row are date, market, commodity, price, in any order.', mr: 'चांगल्या row च्या dict keys: date, market, commodity, price, कोणत्याही क्रमाने.' },
          ],
          successLine: { en: 'HIT! Minus ₹1,900 will never reach a farmer again. It goes to quarantine with a slip.', mr: 'HIT! उणे ₹1,900 आता कधीच शेतकऱ्यापर्यंत पोहोचणार नाही. तो चिठ्ठीसह quarantine मध्ये जातो.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Transform, part 2, and validate. In transform, a good row whose (date, market, commodity) was already kept becomes a reject with reason "duplicate" (keep the first one). Then write validate(read_count, good, rejects) with two asserts: read_count == len(good) + len(rejects), and every good price > 0. Hidden checks feed validate wrong numbers and expect it to stop the run.', mr: 'Transform, भाग 2, आणि validate. transform मध्ये, ज्या चांगल्या row ची (date, market, commodity) आधीच ठेवली आहे ती "duplicate" कारणासह reject होते (पहिली ठेवा). मग validate(read_count, good, rejects) दोन asserts सह लिहा: read_count == len(good) + len(rejects), आणि प्रत्येक good भाव > 0. लपवलेले checks validate ला चुकीचे आकडे देतात आणि त्याने run थांबवावा अशी अपेक्षा करतात.' },
          files: B_FILES,
          starter: `${B_HEAD}${B_EXTRACT}${B_TO_ISO}${B_CLEAN_ROW}
def transform(rows):
    good, rejects = [], []
    for row in rows:
        clean, reason = clean_row(row)
        # TODO: if this clean row's (date, market, commodity) was already kept,
        #       it is a reject with reason 'duplicate'
        if reason is None:
            good.append(clean)
        else:
            bad = dict(row)
            bad['reason'] = reason
            rejects.append(bad)
    return good, rejects

def validate(read_count, good, rejects):
    # TODO: assert the counts reconcile, and that no good price is 0 or less
    pass
${B_STEP3_RUN}`,
          solution: `${B_HEAD}${B_EXTRACT}${B_TO_ISO}${B_CLEAN_ROW}${B_TRANSFORM}${B_VALIDATE}${B_STEP3_RUN}`,
          output: ['read: 14 | good: 7 | rejected: 7'],
          checks: [
            { expr: "sum(r['reason'] == 'duplicate' for r in rejects) == 2", message: { en: 'There are 2 duplicates (Pune onion twice, Nashik onion twice). Each should be a reject with reason "duplicate".', mr: '2 duplicates आहेत (पुण्याचा कांदा दोनदा, नाशिकचा कांदा दोनदा). प्रत्येक "duplicate" कारणासह reject व्हायला हवा.' } },
            { expr: `${RAISES}len(rows) + 1, good, rejects) is None`, message: { en: 'validate must raise AssertionError when read_count is not len(good) + len(rejects). Use assert.', mr: 'read_count हा len(good) + len(rejects) नसेल तेव्हा validate ने AssertionError द्यायला हवा. assert वापरा.' } },
            { expr: `${RAISES}len(rows), good[1:] + [dict(good[0], price=-5)], rejects) is None`, message: { en: 'validate must raise AssertionError when a good row has a price of 0 or less.', mr: 'चांगल्या row चा भाव 0 किंवा कमी असेल तेव्हा validate ने AssertionError द्यायला हवा.' } },
            { expr: "validate(len(rows), good, rejects) is None", message: { en: 'validate should pass quietly on correct data.', mr: 'बरोबर data वर validate शांतपणे pass व्हायला हवा.' } },
          ],
          mustUse: [{ pattern: '\\bassert\\b', message: { en: 'Use assert in validate.', mr: 'validate मध्ये assert वापरा.' } }],
          variants: [
            {
              label: { en: 'Pune sends its whole file twice', mr: 'पुणे आपली पूर्ण file दोनदा पाठवतं' },
              files: { 'data/in/pune_resend.csv': B_PUNE },
              output: ['read: 20 | good: 7 | rejected: 13'],
              checks: [{ expr: "sum(r['reason'] == 'duplicate' for r in rejects) == 6", message: { en: 'With the re-sent Pune file there should be 6 duplicates.', mr: 'पुन्हा पाठवलेल्या पुणे file सह 6 duplicates हवेत.' } }],
            },
            {
              label: { en: 'Next night: duplicates in JSON and in Nashik', mr: 'पुढची रात्र: JSON आणि नाशिकमध्ये duplicates' },
              files: B_DAY2,
              output: ['read: 10 | good: 5 | rejected: 5'],
            },
          ],
          hints: [
            { en: 'Add seen = set() next to good and rejects. Only for a row with reason None: key = (clean["date"], clean["market"], clean["commodity"]); if key in seen, set reason = "duplicate"; else seen.add(key) and good.append(clean). Then any row that still has a reason goes to rejects. Do not "continue" past a duplicate without recording it, or validate will catch you.', mr: 'good आणि rejects शेजारी seen = set() जोडा. फक्त reason None असलेल्या row साठी: key = (clean["date"], clean["market"], clean["commodity"]); key in seen असेल तर reason = "duplicate"; नाहीतर seen.add(key) आणि good.append(clean). मग ज्या row ला अजूनही reason आहे ती rejects मध्ये. duplicate ची नोंद न करता "continue" करू नका, नाहीतर validate तुम्हाला पकडेल.' },
            { en: "        if reason is None:\n            key = (clean['date'], clean['market'], clean['commodity'])\n            if key in seen:\n                reason = 'duplicate'\n            else:\n                seen.add(key)\n                good.append(clean)\n        if reason is not None:\n            bad = dict(row)\n            bad['reason'] = reason\n            rejects.append(bad)\n\ndef validate(read_count, good, rejects):\n    assert read_count == len(good) + len(rejects), 'rows went missing'\n    assert all(r['price'] > 0 for r in good), 'price 0 or less'", mr: "        if reason is None:\n            key = (clean['date'], clean['market'], clean['commodity'])\n            if key in seen:\n                reason = 'duplicate'\n            else:\n                seen.add(key)\n                good.append(clean)\n        if reason is not None:\n            bad = dict(row)\n            bad['reason'] = reason\n            rejects.append(bad)\n\ndef validate(read_count, good, rejects):\n    assert read_count == len(good) + len(rejects), 'rows went missing'\n    assert all(r['price'] > 0 for r in good), 'price 0 or less'" },
            { en: 'The key uses the cleaned values, so "Onion" on 05/11/2026 and "onion" on 2026-11-05 match.', mr: 'key साफ values वापरते, म्हणून 05/11/2026 चा "Onion" आणि 2026-11-05 चा "onion" जुळतात.' },
          ],
          successLine: { en: 'HIT! 14 in, 7 good, 7 set aside. The weighbridge balances.', mr: 'HIT! 14 आत, 7 चांगल्या, 7 बाजूला. वजनकाटा जुळला.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Load and report. Write load(good, rejects): create the out folder, write out/daily_prices.csv (columns date,market,commodity,price, rows sorted by date, then market, then commodity) and out/rejects.csv (columns source,market,commodity,date,price,reason, raw values, in the order they were rejected). Then write summary(rows, good, rejects): print "read: N | good: N | rejected: N", then one line "- reason: count" per reason, reasons in alphabetical order.', mr: 'Load आणि report. load(good, rejects) लिहा: out folder बनवा, out/daily_prices.csv लिहा (columns date,market,commodity,price, rows आधी date, मग market, मग commodity प्रमाणे sorted) आणि out/rejects.csv लिहा (columns source,market,commodity,date,price,reason, raw values, reject झाल्या त्या क्रमाने). मग summary(rows, good, rejects) लिहा: "read: N | good: N | rejected: N" print करा, मग प्रत्येक कारणासाठी "- reason: count" अशी एक ओळ, कारणं अक्षरक्रमाने.' },
          files: B_FILES,
          starter: `${B_HEAD}${B_EXTRACT}${B_TO_ISO}${B_CLEAN_ROW}${B_TRANSFORM}${B_VALIDATE}
def load(good, rejects):
    os.makedirs('out', exist_ok=True)
    # TODO: out/daily_prices.csv  (date,market,commodity,price), sorted by date, market, commodity
    # TODO: out/rejects.csv       (source,market,commodity,date,price,reason)
    pass

def summary(rows, good, rejects):
    # TODO: read: N | good: N | rejected: N   then   - reason: count   (alphabetical)
    pass
${B_RUN}`,
          solution: `${B_HEAD}${B_EXTRACT}${B_TO_ISO}${B_CLEAN_ROW}${B_TRANSFORM}${B_VALIDATE}${B_LOAD}${B_SUMMARY}${B_RUN}`,
          output: ['read: 14 | good: 7 | rejected: 7', '- bad date: 1', '- bad price: 2', '- duplicate: 2', '- missing price: 1', '- unknown commodity: 1'],
          checks: [
            { expr: `${DAILY} == ${pyList(DAILY_BASE)}`, message: { en: 'out/daily_prices.csv should have the header date,market,commodity,price and the 7 good rows sorted by date, market, commodity (Lasalgaon first, Pune last).', mr: 'out/daily_prices.csv मध्ये date,market,commodity,price हा header आणि 7 चांगल्या rows date, market, commodity प्रमाणे sorted हव्यात (Lasalgaon आधी, Pune शेवटी).' } },
            { expr: `${REJECTS}[0] == 'source,market,commodity,date,price,reason' and len(${REJECTS}) == 8`, message: { en: 'out/rejects.csv should have the header source,market,commodity,date,price,reason and 7 rejected rows.', mr: 'out/rejects.csv मध्ये source,market,commodity,date,price,reason हा header आणि 7 rejected rows हव्यात.' } },
            { expr: `'nashik.csv,Nashik,potato,2026-11-05,-1900,bad price' in ${REJECTS} and 'lasalgaon.json,Lasalgaon,tomato,2026-11-05,abc,bad price' in ${REJECTS}`, message: { en: 'Rejects must keep the raw values as they arrived, like "nashik.csv,Nashik,potato,2026-11-05,-1900,bad price".', mr: 'Rejects मध्ये raw values जशा आल्या तशाच हव्यात, उदा. "nashik.csv,Nashik,potato,2026-11-05,-1900,bad price".' } },
          ],
          mustUse: [{ pattern: 'DictWriter', message: { en: 'Write both files with csv.DictWriter.', mr: 'दोन्ही files csv.DictWriter ने लिहा.' } }],
          variants: [
            {
              label: { en: 'A new market joins: Nagpur, with a ₹0 tomato', mr: 'नवा बाजार येतो: नागपूर, ₹0 चा टोमॅटो' },
              files: { 'data/in/nagpur.csv': B_NAGPUR },
              output: ['read: 18 | good: 10 | rejected: 8', '- bad date: 1', '- bad price: 3', '- duplicate: 2', '- missing price: 1', '- unknown commodity: 1'],
              checks: [
                { expr: `len(${DAILY}) == 11 and '2026-11-05,Nagpur,tomato,1580' in ${DAILY} and ${DAILY}[1:] == sorted(${DAILY}[1:])`, message: { en: 'With Nagpur, daily_prices.csv should hold 10 sorted rows, including 2026-11-05,Nagpur,tomato,1580.', mr: 'नागपूरसह daily_prices.csv मध्ये 10 sorted rows हव्यात, 2026-11-05,Nagpur,tomato,1580 सह.' } },
                { expr: `'nagpur.csv,Nagpur,tomato,05-Nov-2026,0,bad price' in ${REJECTS}`, message: { en: 'The ₹0 Nagpur tomato should be in rejects.csv as bad price.', mr: 'नागपूरचा ₹0 टोमॅटो rejects.csv मध्ये bad price म्हणून हवा.' } },
              ],
            },
            {
              label: { en: 'Next night: a clean night with no bad price', mr: 'पुढची रात्र: एकही bad price नसलेली रात्र' },
              files: B_DAY2,
              output: ['read: 10 | good: 5 | rejected: 5', '- bad date: 1', '- duplicate: 2', '- missing price: 1', '- unknown commodity: 1'],
              checks: [{ expr: `${DAILY}[1] == '2026-11-06,Lasalgaon,onion,2610' and len(${DAILY}) == 6`, message: { en: 'On the hidden night daily_prices.csv should start with 2026-11-06,Lasalgaon,onion,2610 and hold 5 rows.', mr: 'लपवलेल्या रात्री daily_prices.csv 2026-11-06,Lasalgaon,onion,2610 ने सुरू व्हायला हवी आणि त्यात 5 rows हव्यात.' } }],
            },
          ],
          hints: [
            { en: 'Sort first: sorted(good, key=lambda r: (r["date"], r["market"], r["commodity"])). Write each file with open(path, "w", newline="", encoding="utf-8") and csv.DictWriter(f, fieldnames=[...]), then writeheader() and writerows(...). Reject rows already have exactly the six keys. For the summary, Counter(r["reason"] for r in rejects), and loop over sorted(counter.items()).', mr: 'आधी sort: sorted(good, key=lambda r: (r["date"], r["market"], r["commodity"])). प्रत्येक file open(path, "w", newline="", encoding="utf-8") आणि csv.DictWriter(f, fieldnames=[...]) ने लिहा, मग writeheader() आणि writerows(...). reject rows मध्ये आधीच नेमक्या सहा keys आहेत. summary साठी Counter(r["reason"] for r in rejects), आणि sorted(counter.items()) वर loop.' },
            { en: "    good = sorted(good, key=lambda r: (r['date'], r['market'], r['commodity']))\n    with open('out/daily_prices.csv', 'w', newline='', encoding='utf-8') as f:\n        writer = csv.DictWriter(f, fieldnames=['date', 'market', 'commodity', 'price'])\n        writer.writeheader()\n        writer.writerows(good)\n    with open('out/rejects.csv', 'w', newline='', encoding='utf-8') as f:\n        writer = csv.DictWriter(f, fieldnames=['source', 'market', 'commodity', 'date', 'price', 'reason'])\n        writer.writeheader()\n        writer.writerows(rejects)\n\ndef summary(rows, good, rejects):\n    print(f'read: {len(rows)} | good: {len(good)} | rejected: {len(rejects)}')\n    for reason, n in sorted(Counter(r['reason'] for r in rejects).items()):\n        print(f'- {reason}: {n}')", mr: "    good = sorted(good, key=lambda r: (r['date'], r['market'], r['commodity']))\n    with open('out/daily_prices.csv', 'w', newline='', encoding='utf-8') as f:\n        writer = csv.DictWriter(f, fieldnames=['date', 'market', 'commodity', 'price'])\n        writer.writeheader()\n        writer.writerows(good)\n    with open('out/rejects.csv', 'w', newline='', encoding='utf-8') as f:\n        writer = csv.DictWriter(f, fieldnames=['source', 'market', 'commodity', 'date', 'price', 'reason'])\n        writer.writeheader()\n        writer.writerows(rejects)\n\ndef summary(rows, good, rejects):\n    print(f'read: {len(rows)} | good: {len(good)} | rejected: {len(rejects)}')\n    for reason, n in sorted(Counter(r['reason'] for r in rejects).items()):\n        print(f'- {reason}: {n}')" },
            { en: 'The summary prints one line per reason that actually happened, so a night with no bad price has no "bad price" line.', mr: 'summary प्रत्यक्ष घडलेल्या प्रत्येक कारणासाठी एक ओळ print करते, म्हणून bad price नसलेल्या रात्री "bad price" ची ओळ नसते.' },
          ],
          successLine: { en: 'HIT! The rate board is up, and the rejects file tells each mandi exactly what to fix.', mr: 'HIT! भावांचा फलक लागला, आणि rejects file प्रत्येक मंडीला नेमकं काय दुरुस्त करायचं ते सांगते.' },
        },
        {
          kind: 'python',
          prompt: { en: 'The Gremlin\'s night. The full pipeline is here, but Run it: it crashes. Tonight nashik.csv was chewed (a garbage line and a row cut in half, so some fields are None), a Lasalgaon item has no "rate" key at all, and solapur.json is cut off mid-file. Harden the code: a missing field is never a crash (a missing price is "missing price"), and a JSON file that cannot be read is skipped with the line "bad file: <name>" while the run carries on. Every row read must still reconcile.', mr: 'Gremlin ची रात्र. पूर्ण pipeline इथे आहे, पण Run करा: ती crash होते. आज रात्री nashik.csv चावली गेली (एक कचरा ओळ आणि अर्धी कापलेली एक row, म्हणून काही fields None आहेत), लासलगावच्या एका item मध्ये "rate" key च नाही, आणि solapur.json file मधेच तुटली आहे. code मजबूत करा: गायब field मुळे कधीही crash नाही (गायब भाव म्हणजे "missing price"), आणि वाचता न येणारी JSON file "bad file: <name>" ही ओळ print करून सोडून द्यायची आणि run पुढे चालू ठेवायचा. वाचलेल्या प्रत्येक row चा हिशोब तरीही जुळायला हवा.' },
          files: B_GREM_FILES,
          starter: `${B_HEAD}${B_EXTRACT}${B_TO_ISO}${B_CLEAN_ROW}${B_TRANSFORM}${B_VALIDATE}${B_LOAD}${B_SUMMARY}${B_RUN}`,
          solution: `${B_HEAD}${B_EXTRACT_SAFE}${B_TO_ISO_SAFE}${B_CLEAN_ROW_SAFE}${B_TRANSFORM}${B_VALIDATE}${B_LOAD}${B_SUMMARY}${B_RUN}`,
          output: ['bad file: solapur.json', 'read: 13 | good: 6 | rejected: 7', '- bad date: 2', '- bad price: 1', '- duplicate: 1', '- missing price: 1', '- unknown commodity: 2'],
          checks: [
            { expr: `'lasalgaon.json,Lasalgaon,potato,05/11/2026,,missing price' in ${REJECTS}`, message: { en: 'The Lasalgaon potato with no "rate" key should be in rejects.csv with reason "missing price" (not "bad price"). None is missing, not a bad number.', mr: '"rate" key नसलेला लासलगावचा बटाटा rejects.csv मध्ये "missing price" कारणासह हवा ("bad price" नाही). None म्हणजे गायब, खराब number नाही.' } },
            { expr: `any('gremlin was here' in line and line.endswith('unknown commodity') for line in ${REJECTS})`, message: { en: 'The garbage line "#### gremlin was here ####" should be quarantined as "unknown commodity", not crash the run.', mr: '"#### gremlin was here ####" ही कचरा ओळ "unknown commodity" म्हणून quarantine व्हायला हवी, run crash नाही.' } },
            { expr: `len(${DAILY}) == 7 and '2026-11-05,Lasalgaon,onion,2550' in ${DAILY}`, message: { en: 'daily_prices.csv should still hold the 6 good rows, including Lasalgaon onion at 2550.', mr: 'daily_prices.csv मध्ये अजूनही 6 चांगल्या rows हव्यात, लासलगावचा कांदा 2550 सह.' } },
          ],
          mustUse: [{ pattern: 'JSONDecodeError|ValueError|except\\s*:|except\\s+Exception', message: { en: 'Catch the error from json.load (json.JSONDecodeError) so one broken file does not stop the whole night.', mr: 'json.load चा error (json.JSONDecodeError) पकडा, म्हणजे एका तुटलेल्या file मुळे पूर्ण रात्र थांबणार नाही.' } }],
          variants: [
            {
              label: { en: 'Same night, and Nagpur joins too', mr: 'तीच रात्र, आणि नागपूरही येतं' },
              files: { 'data/in/nagpur.csv': B_NAGPUR },
              output: ['bad file: solapur.json', 'read: 17 | good: 9 | rejected: 8', '- bad date: 2', '- bad price: 2', '- duplicate: 1', '- missing price: 1', '- unknown commodity: 2'],
              checks: [{ expr: `'2026-11-05,Nagpur,onion,2350' in ${DAILY}`, message: { en: 'The new Nagpur rows should reach daily_prices.csv.', mr: 'नागपूरच्या नव्या rows daily_prices.csv पर्यंत पोहोचायला हव्यात.' } }],
            },
            {
              label: { en: 'Same night, and Pune sends its file twice', mr: 'तीच रात्र, आणि पुणे file दोनदा पाठवतं' },
              files: { 'data/in/pune_resend.csv': B_PUNE },
              output: ['bad file: solapur.json', 'read: 19 | good: 6 | rejected: 13', '- bad date: 3', '- bad price: 1', '- duplicate: 5', '- missing price: 1', '- unknown commodity: 3'],
            },
            {
              label: { en: 'A calm night: every file is fine', mr: 'शांत रात्र: प्रत्येक file ठीक' },
              files: { 'data/in/nashik.csv': B_NASHIK, 'data/in/lasalgaon.json': B_LASALGAON, 'data/in/solapur.json': B_SOLAPUR_OK },
              output: ['read: 16 | good: 9 | rejected: 7', '- bad date: 1', '- bad price: 2', '- duplicate: 2', '- missing price: 1', '- unknown commodity: 1'],
              checks: [{ expr: `'2026-11-05,Solapur,potato,1760' in ${DAILY}`, message: { en: 'On a calm night solapur.json is fine and its rows (Solapur potato 1760) must be loaded.', mr: 'शांत रात्री solapur.json ठीक आहे आणि तिच्या rows (सोलापूरचा बटाटा 1760) load व्हायलाच हव्यात.' } }],
            },
          ],
          hints: [
            { en: 'Three weak spots. In extract, use item.get("rate") (and .get for the other JSON keys), and put json.load(f) inside try/except json.JSONDecodeError: print("bad file:", path.name) and continue. A short CSV row gives None for its missing fields, so in clean_row and to_iso use (value or "") before .strip(). For the price, check "row[\'price\'] is None or str(row[\'price\']).strip() == \'\'" first, so None becomes "missing price".', mr: 'तीन कमकुवत जागा. extract मध्ये item.get("rate") वापरा (आणि JSON च्या इतर keys साठीही .get), आणि json.load(f) try/except json.JSONDecodeError मध्ये ठेवा: print("bad file:", path.name) आणि continue. छोटी CSV row गायब fields साठी None देते, म्हणून clean_row आणि to_iso मध्ये .strip() आधी (value or "") वापरा. price साठी आधी "row[\'price\'] is None or str(row[\'price\']).strip() == \'\'" तपासा, म्हणजे None चं "missing price" होईल.' },
            { en: "    for path in sorted(Path(folder).glob('*.json')):\n        try:\n            with open(path, encoding='utf-8') as f:\n                items = json.load(f)\n        except json.JSONDecodeError:\n            print('bad file:', path.name)\n            continue\n        for item in items:\n            rows.append({'source': path.name, 'market': item.get('mandi'), 'commodity': item.get('crop'), 'date': item.get('day'), 'price': item.get('rate')})\n\n# to_iso:     datetime.strptime((text or '').strip(), fmt)\n# clean_row:  name = (row['commodity'] or '').strip().lower()\n#             if row['price'] is None or str(row['price']).strip() == '':\n#                 return None, 'missing price'\n#             market = (row['market'] or '').strip().title()", mr: "    for path in sorted(Path(folder).glob('*.json')):\n        try:\n            with open(path, encoding='utf-8') as f:\n                items = json.load(f)\n        except json.JSONDecodeError:\n            print('bad file:', path.name)\n            continue\n        for item in items:\n            rows.append({'source': path.name, 'market': item.get('mandi'), 'commodity': item.get('crop'), 'date': item.get('day'), 'price': item.get('rate')})\n\n# to_iso:     datetime.strptime((text or '').strip(), fmt)\n# clean_row:  name = (row['commodity'] or '').strip().lower()\n#             if row['price'] is None or str(row['price']).strip() == '':\n#                 return None, 'missing price'\n#             market = (row['market'] or '').strip().title()" },
            { en: 'Fix one traceback at a time: run, read the last line of the error and the line number, fix that spot, run again.', mr: 'एका वेळी एक traceback दुरुस्त करा: run करा, error ची शेवटची ओळ आणि line number वाचा, ती जागा दुरुस्त करा, पुन्हा run करा.' },
          ],
          successLine: { en: 'FINAL HIT! Chewed files, missing keys, a broken JSON, a new market, a double send: every row accounted for.', mr: 'FINAL HIT! चावलेल्या files, गायब keys, तुटलेली JSON, नवा बाजार, दुहेरी पाठवणी: प्रत्येक row चा हिशोब लागला.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'In your pipeline, what is each stage of ETL?', mr: 'तुमच्या pipeline मध्ये ETL ची प्रत्येक stage काय आहे?' },
        options: [
          { en: 'Extract deletes bad files, Transform emails the mandis, Load sends WhatsApp messages', mr: 'Extract खराब files काढून टाकतो, Transform मंड्यांना email करतो, Load WhatsApp messages पाठवतो' },
          { en: 'Extract cleans the names, Transform reads the files, Load counts the rows', mr: 'Extract नावं साफ करतो, Transform files वाचतो, Load rows मोजतो' },
          { en: 'Extract, Transform and Load are three names for the same step', mr: 'Extract, Transform आणि Load ही एकाच पायरीची तीन नावं' },
          { en: 'Extract reads every source file as it is, Transform cleans, checks and quarantines, Load writes the output files others read', mr: 'Extract प्रत्येक source file जशी आहे तशी वाचतो, Transform साफ करतो, तपासतो आणि quarantine करतो, Load इतर वाचतात त्या output files लिहितो' },
        ],
        answer: 3,
        explain: { en: 'Extract keeps raw values untouched, Transform does all the cleaning and checking, and Load writes daily_prices.csv and rejects.csv for the app and for people.', mr: 'Extract raw values जशाच्या तशा ठेवतो, Transform सगळं cleaning आणि तपासणी करतो, आणि Load app साठी आणि लोकांसाठी daily_prices.csv आणि rejects.csv लिहितो.' },
      },
      {
        q: { en: 'A run prints "read: 120 | good: 104 | rejected: 15". What should happen?', mr: 'एक run "read: 120 | good: 104 | rejected: 15" print करतो. काय व्हायला हवं?' },
        options: [
          { en: 'Nothing, 104 good rows is a fine result', mr: 'काही नाही, 104 चांगल्या rows हा चांगला निकाल आहे' },
          { en: 'validate should stop the run: one row vanished (104 + 15 = 119), so the output cannot be trusted until someone finds it', mr: 'validate ने run थांबवायला हवा: एक row गायब झाली (104 + 15 = 119), म्हणून ती सापडेपर्यंत output वर विश्वास ठेवता येत नाही' },
          { en: 'Add one fake row to the good file so the numbers match', mr: 'आकडे जुळावेत म्हणून good file मध्ये एक खोटी row जोडा' },
          { en: 'Delete rejects.csv so nobody sees the difference', mr: 'फरक कोणाला दिसू नये म्हणून rejects.csv काढून टाका' },
        ],
        answer: 1,
        explain: { en: 'read = good + rejected is the weighbridge rule. A missing row usually means a silent continue or a swallowed error, and the missing row could be a whole mandi.', mr: 'read = good + rejected हा वजनकाट्याचा नियम. गायब row चा अर्थ बहुधा गुपचूप continue किंवा गिळलेला error, आणि ती गायब row म्हणजे पूर्ण मंडीही असू शकते.' },
      },
      {
        q: { en: 'Why does rejects.csv keep the raw values plus a reason, instead of just a count of bad rows?', mr: 'rejects.csv फक्त खराब rows ची संख्या न ठेवता raw values आणि कारण का ठेवते?' },
        options: [
          { en: 'So a person can see exactly what arrived and why it failed, fix it at the source mandi, and re-run', mr: 'म्हणजे नेमकं काय आलं आणि ते का fail झालं ते माणसाला दिसेल, तो source मंडीकडे दुरुस्त करेल, आणि पुन्हा run करेल' },
          { en: 'Because CSV files cannot store numbers', mr: 'कारण CSV files मध्ये numbers साठवता येत नाहीत' },
          { en: 'So the app can show the rejected prices to farmers', mr: 'म्हणजे app नाकारलेले भाव शेतकऱ्यांना दाखवू शकेल' },
          { en: 'It makes the pipeline run faster', mr: 'त्याने pipeline जलद चालते' },
        ],
        answer: 0,
        explain: { en: 'Quarantine is evidence, like a good bug report: the exact input, and why it was refused. Cleaned values would hide what the mandi really sent.', mr: 'Quarantine म्हणजे पुरावा, चांगल्या bug report सारखा: नेमका input, आणि तो का नाकारला. साफ केलेल्या values ने मंडीने खरं काय पाठवलं ते लपलं असतं.' },
      },
      {
        q: { en: 'The Pune clerk sends the same file twice, and the pipeline is run again later that night. What keeps out/daily_prices.csv correct?', mr: 'पुण्याचा clerk तीच file दोनदा पाठवतो, आणि त्या रात्री नंतर pipeline पुन्हा चालवली जाते. out/daily_prices.csv बरोबर कशामुळे राहते?' },
        options: [
          { en: 'Opening the output with "a" so every run adds its rows', mr: 'output "a" ने उघडणं, म्हणजे प्रत्येक run आपल्या rows जोडतो' },
          { en: 'Hoping the clerk only sends once next time', mr: 'पुढच्या वेळी clerk एकदाच पाठवेल अशी आशा' },
          { en: 'Dedupe on (date, market, commodity) and writing a fresh, sorted file with "w" on every run', mr: '(date, market, commodity) वर dedupe आणि प्रत्येक run ला "w" ने नवी, sorted file लिहिणं' },
          { en: 'Sorting the rows by price', mr: 'rows भावाप्रमाणे sort करणं' },
        ],
        answer: 2,
        explain: { en: 'Dedupe turns the second copy into "duplicate" rejects, and "w" plus a fixed sort means running the same night twice gives the same file. Appending would double every price.', mr: 'Dedupe दुसऱ्या प्रतीचं "duplicate" rejects मध्ये रूपांतर करतं, आणि "w" अधिक ठरलेला sort म्हणजे तीच रात्र दोनदा चालवली तरी तीच file येते. append केलं तर प्रत्येक भाव दुप्पट येईल.' },
      },
    ],
    recap: { line: { en: 'Extract every file, transform with reasons, dedupe, validate read = good + rejected, load fresh files, print the summary. No row crashes the run, no row disappears.', mr: 'प्रत्येक file extract करा, कारणांसह transform करा, dedupe करा, read = good + rejected validate करा, नव्या files load करा, summary print करा. कोणतीही row run crash करत नाही, कोणतीही row गायब होत नाही.' }, icon: '🧅' },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: '>> a chewed csv. a broken json. a double send. and your pipeline just... wrote it all down with a reason. ⌁⌁', mr: '>> चावलेली csv. तुटलेली json. दुहेरी पाठवणी. आणि तुझ्या pipeline ने फक्त... सगळं कारणासह लिहून ठेवलं. ⌁⌁' } },
      { who: 'gremlin', mood: 'smug', text: { en: '>> fine. three files is cute. wait until there are three hundred mandis and millions of rows a day. your laptop will cry. ⌁', mr: '>> ठीक आहे. तीन files गोंडस आहेत. तीनशे मंड्या आणि रोज लाखो rows येऊ दे. तुझा laptop रडेल. ⌁' } },
      { who: 'sam', mood: 'happy', text: { en: 'Not one negative price this morning, and Nashik already fixed the rows from the rejects file. Farmers are trusting the app again. Thank you, {name}!', mr: 'आज सकाळी एकही उणे भाव नाही, आणि नाशिकने rejects file मधल्या rows आधीच दुरुस्त केल्या. शेतकरी पुन्हा app वर विश्वास ठेवत आहेत. धन्यवाद, {name}!' } },
      { who: 'rex', mood: 'neutral', text: { en: 'The Gremlin is right about one thing. KisanMandi wants every mandi in Maharashtra, every day. Files will land at 2 a.m. and nobody will be awake to press Run.', mr: 'एका गोष्टीत Gremlin बरोबर आहे. KisanMandi ला महाराष्ट्रातली प्रत्येक मंडी हवी, रोज. files रात्री 2 वाजता येतील आणि Run दाबायला कोणी जागं नसेल.' } },
      { who: 'meera', mood: 'happy', text: { en: 'Rank up, {name}: Data Wrangler. Next stop, the cloud: an S3 data lake to keep every file safe, and Lambda to run your code the moment a file lands.', mr: 'नवीन रँक, {name}: Data Wrangler. पुढचा थांबा cloud: प्रत्येक file सुरक्षित ठेवायला S3 data lake, आणि file येताच तुमचा code चालवायला Lambda.' } },
    ],
  },
]
