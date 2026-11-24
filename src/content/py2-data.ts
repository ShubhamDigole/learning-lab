import type { Lesson } from './types.ts'

// Python 2 · Real Data (KisanMandi), part 1: files and CSV, JSON from APIs, errors and bad rows.
// Every market sends its daily price file a little differently. Prices are in ₹ per quintal (100 kg).

// ───────────── Y2.1 data
const PUNE_CSV = `date,market,commodity,modal_price
2026-11-20,"Pune, Gultekdi",Onion,2100
2026-11-20,"Pune, Gultekdi",Tomato,1400
2026-11-20,"Pune, Gultekdi",Potato,1850
2026-11-20,Pune Moshi,Onion,2050
2026-11-20,Pune Moshi,Garlic,9500
`
const NASHIK_CSV = `date,market,commodity,modal_price
2026-11-20,Nashik,Onion,2200
2026-11-20,Nashik,Tomato,1300
2026-11-20,Nashik,Grapes,6500
2026-11-20,"Nashik, Pimpalgaon",Onion,2250
2026-11-20,"Nashik, Pimpalgaon",Tomato,1250
2026-11-20,Nashik,Potato,1900
`
const LASALGAON_CSV = `date,market,commodity,min_price,max_price,modal_price
2026-11-20,Lasalgaon,Onion,1500,2600,2150
2026-11-20,Lasalgaon,Potato,1400,2000,1800
2026-11-20,"Lasalgaon, Niphad",Onion,1600,2500,2100
2026-11-20,"Lasalgaon, Vinchur",Onion,1450,2550,2000
2026-11-20,Lasalgaon,Tomato,800,1600,1200
`
const AKOLA_CSV = `date,market,commodity,modal_price
2026-11-20,Akola,Onion,1950
2026-11-20,Akola,Soybean,4300
2026-11-20,Akola,Cotton,7100
`
const NAGPUR_CSV = `date,market,commodity,modal_price
2026-11-20,Nagpur,Onion,2000
2026-11-20,Nagpur,Orange,3500
2026-11-20,"Nagpur, Kalamna",Potato,1700
2026-11-20,Nagpur,Tomato,1450
`

// ───────────── Y2.2 data
const API_PRICES_JSON = `{
  "source": "mandi-board-api",
  "date": "2026-11-20",
  "unit": "INR/quintal",
  "records": [
    {"market": "Pune", "commodity": "Onion", "modal_price": 2100},
    {"market": "Nashik", "commodity": "Onion", "modal_price": 2200},
    {"market": "Lasalgaon", "commodity": "Onion", "modal_price": 2150},
    {"market": "Nagpur", "commodity": "Tomato", "modal_price": 1450}
  ]
}
`
const MARKETS_JSON = `{
  "date": "2026-11-20",
  "markets": [
    {"name": "Pune", "name_mr": "पुणे", "prices": [
      {"commodity": "Onion", "modal": 2100},
      {"commodity": "Tomato", "modal": 1400}
    ]},
    {"name": "Nashik", "name_mr": "नाशिक", "prices": [
      {"commodity": "Onion", "modal": 2200}
    ]},
    {"name": "Nagpur", "name_mr": "नागपूर", "prices": [
      {"commodity": "Orange", "modal": 3500},
      {"commodity": "Onion", "modal": 2000}
    ]}
  ]
}
`
const MARKETS_JSON_B = `{
  "date": "2026-11-21",
  "markets": [
    {"name": "Kolhapur", "name_mr": "कोल्हापूर", "prices": [
      {"commodity": "Onion", "modal": 2300},
      {"commodity": "Jaggery", "modal": 4100}
    ]},
    {"name": "Satara", "name_mr": "सातारा", "prices": []},
    {"name": "Sangli", "name_mr": "सांगली", "prices": [
      {"commodity": "Turmeric", "modal": 14500}
    ]},
    {"name": "Lasalgaon", "name_mr": "लासलगाव", "prices": [
      {"commodity": "Onion", "modal": 2150},
      {"commodity": "Potato", "modal": 1800},
      {"commodity": "Garlic", "modal": 9200}
    ]}
  ]
}
`

// ───────────── Y2.3 data
const NAGPUR_BAD_CSV = `date,market,commodity,modal_price
2026-11-20,Nagpur,Onion,2000
2026-11-20,Kalamna,Onion,21OO
2026-11-20,Kamptee,Onion,1950
2026-11-20,Hingna,Onion,
2026-11-20,Umred,Onion,2050
2026-11-20,Saoner,Onion,NA
2026-11-20,Ramtek,Onion,1900
2026-11-20,Katol,Onion,2100
`
const API_RECORDS_JSON = `[
  {"market": "Pune", "commodity": "Onion", "modal_price": "2100"},
  {"market": "Nashik", "commodity": "Onion"},
  {"market": "Lasalgaon", "commodity": "Onion", "modal_price": "21OO"},
  {"market": "Nagpur", "commodity": "Onion", "modal_price": "2000"},
  {"market": "Akola", "commodity": "Onion", "modal_price": "N/A"},
  {"market": "Solapur", "commodity": "Onion", "modal_price": "1980"}
]
`
const NASHIK_BAD_CSV = `date,market,commodity,modal_price
2026-11-20,Nashik,Onion,2200
2026-11-20,Nashik,Tomato,13OO
2026-11-20,Pimpalgaon,Onion,2250
2026-11-20,Nashik,Potato,
2026-11-20,Lasalgaon,Onion,2150
2026-11-20,Yeola,Onion,two thousand
2026-11-20,Nashik,Grapes,6500
`
const PUNE_SMALL_CSV = `date,market,commodity,modal_price
2026-11-20,Pune,Onion,2100
2026-11-20,Pune,Tomato,1400
2026-11-20,Pune,Potato,1850
`
const SOLAPUR_NOCOL_CSV = `date,market,commodity,price
2026-11-20,Solapur,Onion,1980
2026-11-20,Solapur,Pomegranate,8200
`

const LOADER_STARTER = `import csv

def load_prices(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        # TODO: if 'modal_price' is not in reader.fieldnames,
        #       raise a ValueError: "<path> is missing column modal_price"
        return [int(row['modal_price']) for row in reader]

try:
    for path in ['data/pune.csv', 'data/solapur.csv']:
        prices = load_prices(path)
        print(path, prices)
except ValueError as e:
    print('Pipeline stopped:', e)
finally:
    print('Run finished')
`
const LOADER_SOLUTION = `import csv

def load_prices(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        if 'modal_price' not in reader.fieldnames:
            raise ValueError(f'{path} is missing column modal_price')
        return [int(row['modal_price']) for row in reader]

try:
    for path in ['data/pune.csv', 'data/solapur.csv']:
        prices = load_prices(path)
        print(path, prices)
except ValueError as e:
    print('Pipeline stopped:', e)
finally:
    print('Run finished')
`

export const py2Lessons: Lesson[] = [
  // ───────────────────────── Y2.1 Files and CSV
  {
    id: 'py2-1',
    code: 'Y2.1',
    level: 'intermediate',
    title: { en: 'Files and CSV', mr: 'Files आणि CSV' },
    skill: 'Read and write CSV files with open(), with and the csv module',
    realLife: {
      place: 'market',
      title: { en: 'Dattu kaka\'s evening register', mr: 'दत्तू काकांची संध्याकाळची वही' },
      story: {
        en: 'My uncle is a commission agent at the Lasalgaon onion market. Every evening his munim, Dattu kaka, opens the big register. The first line of each page holds the column names: date, farmer, village, quintals, rate. Every line below is one lot. He reads it line by line, copies the onion lots into a neat fair copy for the bank, and closes the register so the pages do not fly off in the wind. One evening his new helper copied the lines by cutting at every comma. A village was written "Niphad, Nashik", so the village spilled into the next column, every value after it slid one place, and the bank slip showed no rate at all. Dattu kaka laughed. In his register, a name with a comma inside is written in quotes, and you read it as one piece.',
        mr: 'माझे काका लासलगावच्या कांदा बाजारात आडते आहेत. रोज संध्याकाळी त्यांचे मुनीम, दत्तू काका, मोठी वही उघडतात. प्रत्येक पानाच्या पहिल्या ओळीत columns ची नावं असतात: तारीख, शेतकरी, गाव, क्विंटल, भाव. खालची प्रत्येक ओळ म्हणजे एक लॉट. ते ओळ ओळ वाचतात, कांद्याचे लॉट bank साठी एका स्वच्छ फेअर कॉपीत उतरवतात, आणि वाऱ्याने पानं उडू नयेत म्हणून वही बंद करतात. एका संध्याकाळी त्यांच्या नव्या मदतनीसाने प्रत्येक comma वर ओळ तोडून नक्कल केली. एका गावाचं नाव "Niphad, Nashik" असं लिहिलं होतं, त्यामुळे गाव पुढच्या column मध्ये सांडलं, त्यानंतरची प्रत्येक value एक जागा सरकली, आणि bank च्या स्लिपवर भावच दिसला नाही. दत्तू काका हसले. त्यांच्या वहीत आत comma असलेलं नाव quotes मध्ये लिहितात, आणि ते एकच तुकडा म्हणून वाचायचं.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '📖', label: 'Open the register (open)', mr: 'वही उघडा (open)' },
          { icon: '🏷️', label: 'Read the column names (header)', mr: 'columns ची नावं वाचा (header)' },
          { icon: '📝', label: 'One lot per line (for row in reader)', mr: 'एका ओळीत एक लॉट (for row in reader)' },
          { icon: '✍️', label: 'Copy into the fair copy (writerow)', mr: 'फेअर कॉपीत उतरवा (writerow)' },
          { icon: '📕', label: 'Close the register (with does it)', mr: 'वही बंद करा (with हे करतो)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Welcome to KisanMandi. Yesterday our app showed a blank onion price for Pune, and farmers sold at whatever the trader said. We collect files from 40 mandis every evening.', mr: 'KisanMandi मध्ये स्वागत. काल आपल्या app ने पुण्याचा कांद्याचा भाव रिकामा दाखवला, आणि शेतकऱ्यांनी व्यापारी सांगेल त्या भावात माल विकला. आपण रोज संध्याकाळी 40 मंड्यांकडून files गोळा करतो.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'Each mandi sends a CSV. My script does line.split(\',\'). Then Pune started writing its market as "Pune, Gultekdi", in quotes.', mr: 'प्रत्येक मंडी एक CSV पाठवते. माझी script line.split(\',\') करते. मग पुण्याने आपल्या market चं नाव quotes मध्ये "Pune, Gultekdi" असं लिहायला सुरुवात केली.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> one little comma inside quotes and all your columns slide over. i did not even touch it this time. ⌁', mr: '>> quotes मधला एक छोटासा comma आणि तुमचे सगळे columns सरकतात. या वेळी मी हात पण लावला नाही. ⌁' } },
        { who: 'rex', mood: 'happy', text: { en: '{name}, Python has a csv module that understands quotes. We read every file properly and write one clean output file the app can trust.', mr: '{name}, Python मध्ये csv module आहे, त्याला quotes समजतात. आपण प्रत्येक file नीट वाचू आणि app ला भरवसा ठेवता येईल अशी एक स्वच्छ output file लिहू.' } },
        { who: 'meera', mood: 'happy', text: { en: 'Same as Dattu kaka\'s register: read the header, then one row at a time. You already know rows and columns from SQL.', mr: 'दत्तू काकांच्या वहीसारखंच: आधी header वाचायचा, मग एका वेळी एक row. rows आणि columns तुला SQL मधून आधीच माहीत आहेत.' } },
      ],
      problem: { en: 'Every mandi sends a CSV file. The old script splits each line on commas, so a quoted market name like "Pune, Gultekdi" breaks the columns and the price goes missing. There is no clean, fixed output file for the app to read.', mr: 'प्रत्येक मंडी एक CSV file पाठवते. जुनी script प्रत्येक ओळ comma वर तोडते, त्यामुळे "Pune, Gultekdi" सारखं quotes मधलं market चं नाव columns बिघडवतं आणि भाव गायब होतो. app ने वाचावी अशी स्वच्छ, ठरलेल्या format ची output file नाहीच.' },
      solution: { en: 'Open files with with open(), read them with the csv module (DictReader gives each row as a dict with column names), turn prices into numbers with int(), and write one clean output file with DictWriter. Count rows in and rows out so the numbers reconcile.', mr: 'with open() ने files उघडा, csv module ने वाचा (DictReader प्रत्येक row column च्या नावांसह dict म्हणून देतो), int() ने भाव numbers मध्ये बदला, आणि DictWriter ने एक स्वच्छ output file लिहा. आत आलेल्या आणि बाहेर गेलेल्या rows मोजा, म्हणजे आकडे जुळतात.' },
    },
    lesson: [
      { en: 'A file is just text saved on disk. open(\'data/pune.csv\') opens it and gives you a file object. Write it as with open(...) as f: and Python closes the file for you when the block ends, even if an error happens in the middle. The path starts from your working folder: data/pune.csv means "the file pune.csv inside the folder data".', mr: 'file म्हणजे disk वर साठवलेला साधा text. open(\'data/pune.csv\') ती file उघडतो आणि एक file object देतो. with open(...) as f: असं लिहिलं की block संपल्यावर Python स्वतः file बंद करतो, मधेच error आला तरी. path तुमच्या working folder पासून सुरू होतो: data/pune.csv म्हणजे "data folder मधली pune.csv file".' },
      { en: 'Inside the with block, f.read() gives the whole file as one string, and for line in f: gives one line at a time (each ends with a newline, so use .strip()). A CSV file is lines of values with commas between them, and the first line is usually the header: the column names. You could split each line on \',\', until a value holds a comma, like "Pune, Gultekdi" in quotes. split cuts it in two and every column after it slides over.', mr: 'with block च्या आत f.read() पूर्ण file एक string म्हणून देतो, आणि for line in f: एका वेळी एक ओळ देतो (प्रत्येक ओळीच्या शेवटी newline असते, म्हणून .strip() वापरा). CSV file म्हणजे commas ने वेगळ्या केलेल्या values च्या ओळी, आणि पहिली ओळ बहुतेक header असते: columns ची नावं. प्रत्येक ओळ \',\' वर split करता येईल, जोपर्यंत एखाद्या value मध्ये comma नसतो. "Pune, Gultekdi" सारखं quotes मधलं नाव आलं की split त्याचे दोन तुकडे करतो आणि त्यानंतरचे सगळे columns सरकतात.' },
      { en: 'The csv module knows the rules, quotes included. csv.reader(f) gives each line as a list, and next(reader) takes the header off first. csv.DictReader(f) reads the header for you and gives each row as a dict: row[\'modal_price\']. That is a SQL row with column names. Every value arrives as a string, so convert numbers with int() or float() before any maths.', mr: 'csv module ला नियम माहीत आहेत, quotes सकट. csv.reader(f) प्रत्येक ओळ list म्हणून देतो, आणि next(reader) आधी header बाजूला काढतो. csv.DictReader(f) तुमच्यासाठी header वाचतो आणि प्रत्येक row dict म्हणून देतो: row[\'modal_price\']. म्हणजे column च्या नावांसह SQL ची row. प्रत्येक value string म्हणूनच येते, म्हणून गणित करण्याआधी int() किंवा float() ने number मध्ये बदला.' },
      { en: 'Writing goes the other way. Open with \'w\' (starts the file fresh; \'a\' adds to the end) and newline=\'\', then use csv.writer(f).writerow([...]), or csv.DictWriter(f, fieldnames=[...]) with writeheader() once and writerow(row) per row. It adds quotes wherever a value needs them. os.makedirs(\'out\', exist_ok=True) creates the output folder. pandas.read_csv comes later in your journey; this is what it does underneath. And the data engineer\'s habit: rows in should match rows out, so print the counts.', mr: 'लिहिणं उलट दिशेने. \'w\' (file नव्याने सुरू करतो; \'a\' शेवटी भर घालतो) आणि newline=\'\' ने उघडा, मग csv.writer(f).writerow([...]) वापरा, किंवा csv.DictWriter(f, fieldnames=[...]) सोबत एकदा writeheader() आणि प्रत्येक row साठी writerow(row). जिथे गरज असेल तिथे तो स्वतः quotes घालतो. os.makedirs(\'out\', exist_ok=True) output folder बनवतो. pandas.read_csv तुमच्या प्रवासात पुढे येईल; तो आत हेच करतो. आणि data engineer ची सवय: आत आलेल्या rows आणि बाहेर गेलेल्या rows जुळायला हव्यात, म्हणून counts print करा.' },
    ],
    syntax: {
      template: `import csv

with open('data/pune.csv', newline='', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        price = int(row['modal_price'])

with open('out/clean.csv', 'w', newline='') as out:
    writer = csv.DictWriter(out, fieldnames=['market', 'price'])
    writer.writeheader()
    writer.writerow({'market': 'Pune', 'price': 2100})`,
      parts: [
        { code: "with open(path, newline='') as f:", means: { en: 'open the file; with closes it again when the block ends', mr: 'file उघडा; block संपल्यावर with ती पुन्हा बंद करतो' } },
        { code: 'csv.DictReader(f)', means: { en: 'reads the header line, then gives each row as a dict keyed by column name', mr: 'header ची ओळ वाचतो, मग प्रत्येक row column च्या नावाच्या keys असलेली dict म्हणून देतो' } },
        { code: "int(row['modal_price'])", means: { en: 'CSV values are always strings; convert before maths', mr: 'CSV मधल्या values नेहमी strings असतात; गणिताआधी रूपांतर करा' } },
        { code: "open(path, 'w', newline='')", means: { en: 'write mode: starts the file fresh (use \'a\' to add to the end)', mr: 'write mode: file नव्याने सुरू करतो (शेवटी भर घालायला \'a\')' } },
        { code: 'csv.DictWriter(out, fieldnames=[...])', means: { en: 'writes dicts as rows in this column order; writeheader() once, writerow() per row', mr: 'या column क्रमाने dicts rows म्हणून लिहितो; writeheader() एकदा, writerow() प्रत्येक row साठी' } },
      ],
      example: [
        { code: "with open('data/lasalgaon.csv', newline='') as f:", note: { en: 'Dattu kaka opens the register; with closes it when he is done', mr: 'दत्तू काका वही उघडतात; काम झालं की with ती बंद करतो' } },
        { code: '    reader = csv.DictReader(f)', note: { en: 'the first line, the column names, is read for you', mr: 'पहिली ओळ, म्हणजे columns ची नावं, तुमच्यासाठी वाचली जाते' } },
        { code: '    for row in reader:', note: { en: 'one lot per line', mr: 'एका ओळीत एक लॉट' } },
        { code: "        price = int(row['modal_price'])", note: { en: 'the text \'2150\' becomes the number 2150', mr: '\'2150\' हा text 2150 हा number होतो' } },
        { code: "        print(row['market'], price)", note: { en: '"Lasalgaon, Niphad" stays one piece: the quotes are understood', mr: '"Lasalgaon, Niphad" एकच तुकडा राहतो: quotes समजतात' } },
      ],
      pitfall: { en: 'CSV values are strings. \'2100\' + 100 is a TypeError, and \'2100\' > \'900\' is False because text compares letter by letter. Opening an existing file with \'w\' wipes it. And write with newline=\'\', or some tools show an empty line between rows.', mr: 'CSV मधल्या values strings असतात. \'2100\' + 100 म्हणजे TypeError, आणि \'2100\' > \'900\' हे False येतं कारण text अक्षर अक्षराने तुलना होतो. आधीपासून असलेली file \'w\' ने उघडली की ती पुसली जाते. आणि लिहिताना newline=\'\' द्या, नाहीतर काही tools मध्ये rows मध्ये एक रिकामी ओळ दिसते.' },
    },
    practice: {
      intro: { en: 'The market files are shown above the editor as small tables. Press Run to try your code, read the output under the editor, then press Submit. Submit also runs your code on hidden market files.', mr: 'मंडीच्या files editor वर छोट्या tables सारख्या दिसतात. code चालवून पाहायला Run दाबा, editor खालचं output वाचा, मग Submit दाबा. Submit तुमचा code लपवलेल्या मंडी files वरही चालवतो.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'This is roughly Theo\'s old script. It reads data/pune.csv and splits the first data line on commas. The header says modal_price is the 4th column (index 3). Press Run. What does the last line print?', mr: 'ही साधारण Theo ची जुनी script आहे. ती data/pune.csv वाचते आणि पहिली data ओळ commas वर split करते. header नुसार modal_price हा 4था column (index 3) आहे. Run दाबा. शेवटची ओळ काय print करते?' },
          pythonSandbox: {
            code: `with open('data/pune.csv') as f:
    lines = f.read().splitlines()

print(lines[0])
parts = lines[1].split(',')
print(parts)
print('modal_price column:', parts[3])`,
            files: { 'data/pune.csv': PUNE_CSV },
          },
          options: [
            'modal_price column: 2100',
            'modal_price column: Onion',
            'modal_price column:  Gultekdi"',
            { en: 'An IndexError', mr: 'IndexError' },
          ],
          correct: [1],
          explain: { en: 'split(\',\') cut "Pune, Gultekdi" into \'"Pune\' and \' Gultekdi"\', so the line has 5 pieces and index 3 is \'Onion\'. The price slid to index 4. That is exactly the blank price farmers saw.', mr: 'split(\',\') ने "Pune, Gultekdi" चे \'"Pune\' आणि \' Gultekdi"\' असे दोन तुकडे केले, त्यामुळे ओळीत 5 तुकडे झाले आणि index 3 वर \'Onion\' आलं. भाव index 4 वर सरकला. शेतकऱ्यांना दिसलेला रिकामा भाव हाच.' },
          hints: [
            { en: 'Look at the second printed line: count the pieces in the list.', mr: 'print झालेली दुसरी ओळ पाहा: list मधले तुकडे मोजा.' },
            { en: 'The market name was cut in two. Count again from index 0.', mr: 'market चं नाव दोन तुकड्यांत तुटलं. index 0 पासून पुन्हा मोजा.' },
          ],
          successLine: { en: 'You found the bug the way a tester does: run it and look at the real values.', mr: 'tester सारखा bug शोधलात: चालवून खऱ्या values पाहिल्या.' },
        },
        {
          kind: 'python',
          prompt: { en: 'This code counts the rows in data/nashik.csv but says 7, because it counts the header as a row too. The header is not a market row. Use csv.reader with next(reader) to take the header off first, keep it in a variable header, put the remaining rows in rows, then print header and the line Rows: <count>.', mr: 'हा code data/nashik.csv मधल्या rows मोजतो पण 7 सांगतो, आणि header सुद्धा एक row म्हणून मोजतो. header म्हणजे मंडीची row नाही. csv.reader आणि next(reader) वापरून आधी header बाजूला काढा, तो header variable मध्ये ठेवा, उरलेल्या rows rows मध्ये ठेवा, मग header आणि Rows: <count> ही ओळ print करा.' },
          files: { 'data/nashik.csv': NASHIK_CSV },
          starter: `import csv

with open('data/nashik.csv', newline='') as f:
    reader = csv.reader(f)
    rows = list(reader)

print(rows[0])
print('Rows:', len(rows))
`,
          solution: `import csv

with open('data/nashik.csv', newline='') as f:
    reader = csv.reader(f)
    header = next(reader)
    rows = list(reader)

print(header)
print('Rows:', len(rows))
`,
          output: ["['date', 'market', 'commodity', 'modal_price']", 'Rows: 6'],
          checks: [
            { expr: `header == ['date', 'market', 'commodity', 'modal_price']`, message: { en: 'header should be the first line as a list of column names.', mr: 'header म्हणजे पहिली ओळ, columns च्या नावांची list असायला हवी.' } },
            { expr: `len(rows) == 6 and rows[3][1] == 'Nashik, Pimpalgaon'`, message: { en: 'rows should hold only the 6 market rows, with "Nashik, Pimpalgaon" kept as one value.', mr: 'rows मध्ये फक्त मंडीच्या 6 rows हव्यात, आणि "Nashik, Pimpalgaon" एकच value राहायला हवी.' } },
          ],
          variants: [
            {
              label: { en: 'Nashik sends extra min and max price columns', mr: 'नाशिक min आणि max भावाचे जास्तीचे columns पाठवतं' },
              files: { 'data/nashik.csv': `date,market,commodity,min_price,max_price,modal_price
2026-11-21,Nashik,Onion,1700,2600,2200
2026-11-21,"Nashik, Devla",Onion,1650,2550,2150
2026-11-21,Nashik,Tomato,900,1700,1300
` },
              output: ["['date', 'market', 'commodity', 'min_price', 'max_price', 'modal_price']", 'Rows: 3'],
              checks: [
                { expr: `len(header) == 6 and len(rows) == 3`, message: { en: 'With a different header, header and rows must still be split correctly.', mr: 'header वेगळा असला तरी header आणि rows बरोबर वेगळ्या व्हायला हव्यात.' } },
              ],
            },
            {
              label: { en: 'A holiday: the file has only the header', mr: 'सुट्टी: file मध्ये फक्त header आहे' },
              files: { 'data/nashik.csv': `date,market,commodity,modal_price
` },
              output: ["['date', 'market', 'commodity', 'modal_price']", 'Rows: 0'],
              checks: [
                { expr: `rows == []`, message: { en: 'A file with only a header has zero market rows.', mr: 'फक्त header असलेल्या file मध्ये मंडीच्या rows शून्य.' } },
              ],
            },
          ],
          mustUse: [
            { pattern: 'csv\\.reader', message: { en: 'Read the file with csv.reader.', mr: 'file csv.reader ने वाचा.' } },
            { pattern: 'next\\(', message: { en: 'Take the header off with next(reader).', mr: 'header next(reader) ने बाजूला काढा.' } },
          ],
          hints: [
            { en: 'A reader hands out lines one by one. The first line it hands out is the header.', mr: 'reader एकेक ओळ देतो. तो देत असलेली पहिली ओळ म्हणजे header.' },
            { en: 'Call next(reader) once before list(reader). Whatever next returns is the header; list(reader) then gets only the rest.', mr: 'list(reader) च्या आधी एकदा next(reader) बोलवा. next जे देतो तो header; मग list(reader) ला फक्त उरलेल्या ओळी मिळतात.' },
            { en: "    header = next(reader)\n    rows = list(reader)\n...\nprint(header)", mr: "    header = next(reader)\n    rows = list(reader)\n...\nprint(header)" },
          ],
          successLine: { en: 'Header off, six real rows. Even the empty holiday file works.', mr: 'header बाजूला, सहा खऱ्या rows. सुट्टीची रिकामी file सुद्धा चालते.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Read data/lasalgaon.csv with csv.DictReader. For every Onion row, print market: price (like Lasalgaon: 2150) and add the modal_price, as a number, to the list onion_prices. After the loop, print Onion rows: <count> and Highest: <max>.', mr: 'data/lasalgaon.csv csv.DictReader ने वाचा. प्रत्येक Onion row साठी market: price (उदा. Lasalgaon: 2150) print करा आणि modal_price number म्हणून onion_prices list मध्ये घाला. loop नंतर Onion rows: <count> आणि Highest: <max> print करा.' },
          files: { 'data/lasalgaon.csv': LASALGAON_CSV },
          starter: `import csv

onion_prices = []
with open('data/lasalgaon.csv', newline='') as f:
    for row in csv.DictReader(f):
        # TODO: keep only Onion rows
        # print "market: price" and add the price (a number) to onion_prices
        pass

print('Onion rows:', len(onion_prices))
print('Highest:', max(onion_prices))
`,
          solution: `import csv

onion_prices = []
with open('data/lasalgaon.csv', newline='') as f:
    for row in csv.DictReader(f):
        if row['commodity'] == 'Onion':
            price = int(row['modal_price'])
            onion_prices.append(price)
            print(f"{row['market']}: {price}")

print('Onion rows:', len(onion_prices))
print('Highest:', max(onion_prices))
`,
          output: ['Lasalgaon: 2150', 'Lasalgaon, Niphad: 2100', 'Lasalgaon, Vinchur: 2000', 'Onion rows: 3', 'Highest: 2150'],
          checks: [
            { expr: `onion_prices == [2150, 2100, 2000]`, message: { en: 'onion_prices should hold the three onion modal prices as numbers (int), in file order.', mr: 'onion_prices मध्ये कांद्याचे तीन modal भाव numbers (int) म्हणून, file च्या क्रमाने हवेत.' } },
          ],
          variants: [
            {
              label: { en: 'Next day: four onion rows, garlic and potato mixed in', mr: 'दुसरा दिवस: कांद्याच्या चार rows, मधे लसूण आणि बटाटा' },
              files: { 'data/lasalgaon.csv': `date,market,commodity,min_price,max_price,modal_price
2026-11-21,"Lasalgaon, Vinchur",Onion,1500,2500,1975
2026-11-21,Lasalgaon,Garlic,7000,11000,9400
2026-11-21,Lasalgaon,Onion,1550,2650,2210
2026-11-21,"Lasalgaon, Niphad",Onion,1600,2450,2080
2026-11-21,"Lasalgaon, Niphad",Potato,1300,1900,1650
2026-11-21,Lasalgaon,Onion,1700,2700,2300
` },
              output: ['Lasalgaon, Vinchur: 1975', 'Lasalgaon: 2210', 'Lasalgaon, Niphad: 2080', 'Lasalgaon: 2300', 'Onion rows: 4', 'Highest: 2300'],
              checks: [
                { expr: `onion_prices == [1975, 2210, 2080, 2300]`, message: { en: 'onion_prices must come from the file, as numbers.', mr: 'onion_prices file मधूनच, numbers म्हणून यायला हवेत.' } },
              ],
            },
            {
              label: { en: 'A slow day: only one onion lot', mr: 'मंद दिवस: कांद्याचा फक्त एक लॉट' },
              files: { 'data/lasalgaon.csv': `date,market,commodity,min_price,max_price,modal_price
2026-11-22,Lasalgaon,Tomato,700,1500,1100
2026-11-22,"Lasalgaon, Vinchur",Onion,1400,2400,1890
` },
              output: ['Lasalgaon, Vinchur: 1890', 'Onion rows: 1', 'Highest: 1890'],
              checks: [
                { expr: `onion_prices == [1890]`, message: { en: 'Only the one onion row belongs in onion_prices.', mr: 'onion_prices मध्ये फक्त कांद्याची ती एक row हवी.' } },
              ],
            },
          ],
          mustUse: [
            { pattern: 'csv\\.DictReader', message: { en: 'Use csv.DictReader so you can write row[\'commodity\'].', mr: 'row[\'commodity\'] लिहिता यावं म्हणून csv.DictReader वापरा.' } },
          ],
          mustNotUse: [
            { pattern: "split\\(\\s*['\"],['\"]\\s*\\)", message: { en: 'No split(\',\') here: it breaks "Lasalgaon, Niphad". Let csv do the reading.', mr: 'इथे split(\',\') नको: त्याने "Lasalgaon, Niphad" तुटतं. वाचण्याचं काम csv ला करू द्या.' } },
          ],
          hints: [
            { en: 'Inside the loop, row is a dict like {\'market\': \'Lasalgaon\', \'commodity\': \'Onion\', ..., \'modal_price\': \'2150\'}.', mr: 'loop च्या आत row ही {\'market\': \'Lasalgaon\', \'commodity\': \'Onion\', ..., \'modal_price\': \'2150\'} अशी dict आहे.' },
            { en: 'Check row[\'commodity\'] == \'Onion\'. Then turn row[\'modal_price\'] into a number with int() before you append it, or max() compares text.', mr: 'row[\'commodity\'] == \'Onion\' तपासा. मग append करण्याआधी row[\'modal_price\'] int() ने number करा, नाहीतर max() text ची तुलना करेल.' },
            { en: "        if row['commodity'] == 'Onion':\n            price = int(row['modal_price'])\n            onion_prices.append(price)\n            print(f\"{row['market']}: {price}\")", mr: "        if row['commodity'] == 'Onion':\n            price = int(row['modal_price'])\n            onion_prices.append(price)\n            print(f\"{row['market']}: {price}\")" },
          ],
          successLine: { en: 'Quoted names stay whole, prices are real numbers. Every hidden day passed.', mr: 'quotes मधली नावं अख्खी, भाव खरे numbers. लपवलेले सगळे दिवस pass.' },
        },
        {
          kind: 'python',
          prompt: { en: 'The farmer app shows ₹ per kg, and 1 quintal is 100 kg. Read data/pune.csv and write out/pune_kg.csv with the columns market, commodity, price_per_kg, where price_per_kg is modal_price / 100. Use csv.DictWriter: write the header once, then one row per input row. The print at the end is already there.', mr: 'शेतकऱ्यांचं app ₹ प्रति किलो दाखवतं, आणि 1 क्विंटल म्हणजे 100 किलो. data/pune.csv वाचा आणि out/pune_kg.csv लिहा, ज्यात market, commodity, price_per_kg हे columns असतील, आणि price_per_kg म्हणजे modal_price / 100. csv.DictWriter वापरा: header एकदा लिहा, मग प्रत्येक input row साठी एक row. शेवटचा print आधीच दिलेला आहे.' },
          files: { 'data/pune.csv': PUNE_CSV },
          starter: `import csv
import os

os.makedirs('out', exist_ok=True)
count = 0
with open('data/pune.csv', newline='') as f, open('out/pune_kg.csv', 'w', newline='') as out:
    writer = csv.DictWriter(out, fieldnames=['market', 'commodity', 'price_per_kg'])
    # TODO: write the header line once
    for row in csv.DictReader(f):
        # TODO: write one row: market, commodity, and modal_price / 100
        count += 1

print(f'Wrote {count} rows to out/pune_kg.csv')
`,
          solution: `import csv
import os

os.makedirs('out', exist_ok=True)
count = 0
with open('data/pune.csv', newline='') as f, open('out/pune_kg.csv', 'w', newline='') as out:
    writer = csv.DictWriter(out, fieldnames=['market', 'commodity', 'price_per_kg'])
    writer.writeheader()
    for row in csv.DictReader(f):
        writer.writerow({'market': row['market'], 'commodity': row['commodity'], 'price_per_kg': int(row['modal_price']) / 100})
        count += 1

print(f'Wrote {count} rows to out/pune_kg.csv')
`,
          output: ['Wrote 5 rows to out/pune_kg.csv'],
          checks: [
            { expr: `open('out/pune_kg.csv').read().splitlines()[0] == 'market,commodity,price_per_kg'`, message: { en: 'The first line of out/pune_kg.csv should be the header market,commodity,price_per_kg. Did you call writer.writeheader()?', mr: 'out/pune_kg.csv ची पहिली ओळ market,commodity,price_per_kg हा header असायला हवी. writer.writeheader() बोलवलं का?' } },
            { expr: `len(open('out/pune_kg.csv').read().splitlines()) == 6`, message: { en: 'The file should have the header plus 5 rows: rows in must match rows out.', mr: 'file मध्ये header आणि 5 rows हव्यात: आत आलेल्या rows बाहेर गेलेल्या rows शी जुळायला हव्यात.' } },
            { expr: `open('out/pune_kg.csv').read().splitlines() == ['market,commodity,price_per_kg', '"Pune, Gultekdi",Onion,21.0', '"Pune, Gultekdi",Tomato,14.0', '"Pune, Gultekdi",Potato,18.5', 'Pune Moshi,Onion,20.5', 'Pune Moshi,Garlic,95.0']`, message: { en: 'Some values are off. price_per_kg is int(modal_price) / 100, so 2100 becomes 21.0.', mr: 'काही values चुकल्या आहेत. price_per_kg = int(modal_price) / 100, म्हणजे 2100 चे 21.0.' } },
          ],
          variants: [
            {
              label: { en: 'Next day: three rows, with paise in the result', mr: 'दुसरा दिवस: तीन rows, उत्तरात पैसे' },
              files: { 'data/pune.csv': `date,market,commodity,modal_price
2026-11-21,"Pune, Gultekdi",Onion,2240
2026-11-21,"Pune, Gultekdi",Cabbage,800
2026-11-21,Pune Manjri,Tomato,1525
` },
              output: ['Wrote 3 rows to out/pune_kg.csv'],
              checks: [
                { expr: `open('out/pune_kg.csv').read().splitlines() == ['market,commodity,price_per_kg', '"Pune, Gultekdi",Onion,22.4', '"Pune, Gultekdi",Cabbage,8.0', 'Pune Manjri,Tomato,15.25']`, message: { en: 'The output file must be built from the input file, row by row.', mr: 'output file input file वरूनच, row by row बनायला हवी.' } },
              ],
            },
          ],
          mustUse: [
            { pattern: 'DictWriter', message: { en: 'Write the file with csv.DictWriter.', mr: 'file csv.DictWriter ने लिहा.' } },
            { pattern: 'writeheader\\(', message: { en: 'Write the header with writer.writeheader().', mr: 'header writer.writeheader() ने लिहा.' } },
          ],
          hints: [
            { en: 'writer.writeheader() writes the fieldnames as the first line. Call it once, before the loop.', mr: 'writer.writeheader() fieldnames पहिली ओळ म्हणून लिहितो. loop च्या आधी एकदाच बोलवा.' },
            { en: 'writer.writerow() takes a dict with the same keys as fieldnames. Build it from row: row[\'market\'], row[\'commodity\'] and int(row[\'modal_price\']) / 100.', mr: 'writer.writerow() ला fieldnames च्याच keys असलेली dict लागते. ती row वरून बनवा: row[\'market\'], row[\'commodity\'] आणि int(row[\'modal_price\']) / 100.' },
            { en: "    writer.writeheader()\n    for row in csv.DictReader(f):\n        writer.writerow({'market': row['market'], 'commodity': row['commodity'], 'price_per_kg': int(row['modal_price']) / 100})\n        count += 1", mr: "    writer.writeheader()\n    for row in csv.DictReader(f):\n        writer.writerow({'market': row['market'], 'commodity': row['commodity'], 'price_per_kg': int(row['modal_price']) / 100})\n        count += 1" },
          ],
          successLine: { en: 'Look at the file: csv put the quotes back around "Pune, Gultekdi" on its own.', mr: 'file पाहा: "Pune, Gultekdi" भोवती csv ने स्वतःच quotes परत घातले.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Every evening the data folder fills with market files. This code joins them all into out/all_markets.csv, but it copies every file\'s header too, so the column names show up in the middle as if they were a market. Fix it: write the header once at the top, skip each input file\'s header with next(reader), and count only real rows. Files and Rows are printed at the end.', mr: 'रोज संध्याकाळी data folder मंडीच्या files ने भरतो. हा code त्या सगळ्या out/all_markets.csv मध्ये जोडतो, पण प्रत्येक file चा header सुद्धा उतरवतो, त्यामुळे columns ची नावं मधेच एखाद्या मंडीसारखी दिसतात. दुरुस्त करा: header वर एकदाच लिहा, प्रत्येक input file चा header next(reader) ने वगळा, आणि फक्त खऱ्या rows मोजा. शेवटी Files आणि Rows print होतात.' },
          files: { 'data/akola.csv': AKOLA_CSV, 'data/nagpur.csv': NAGPUR_CSV },
          starter: `import csv
import os

os.makedirs('out', exist_ok=True)
files = sorted(name for name in os.listdir('data') if name.endswith('.csv'))

with open('out/all_markets.csv', 'w', newline='') as out:
    writer = csv.writer(out)
    total = 0
    for name in files:
        with open('data/' + name, newline='') as f:
            for row in csv.reader(f):
                writer.writerow(row)
                total += 1

print('Files:', len(files))
print('Rows:', total)
`,
          solution: `import csv
import os

os.makedirs('out', exist_ok=True)
files = sorted(name for name in os.listdir('data') if name.endswith('.csv'))

with open('out/all_markets.csv', 'w', newline='') as out:
    writer = csv.writer(out)
    writer.writerow(['date', 'market', 'commodity', 'modal_price'])
    total = 0
    for name in files:
        with open('data/' + name, newline='') as f:
            reader = csv.reader(f)
            next(reader)
            for row in reader:
                writer.writerow(row)
                total += 1

print('Files:', len(files))
print('Rows:', total)
`,
          output: ['Files: 2', 'Rows: 7'],
          checks: [
            { expr: `open('out/all_markets.csv').read().splitlines()[0] == 'date,market,commodity,modal_price'`, message: { en: 'The first line of out/all_markets.csv should be the header.', mr: 'out/all_markets.csv ची पहिली ओळ header असायला हवी.' } },
            { expr: `open('out/all_markets.csv').read().count('modal_price') == 1`, message: { en: 'The header appears more than once. Write it once, and skip the header of each input file.', mr: 'header एकापेक्षा जास्त वेळा आला आहे. तो एकदाच लिहा, आणि प्रत्येक input file चा header वगळा.' } },
            { expr: `open('out/all_markets.csv').read().splitlines() == ['date,market,commodity,modal_price', '2026-11-20,Akola,Onion,1950', '2026-11-20,Akola,Soybean,4300', '2026-11-20,Akola,Cotton,7100', '2026-11-20,Nagpur,Onion,2000', '2026-11-20,Nagpur,Orange,3500', '2026-11-20,"Nagpur, Kalamna",Potato,1700', '2026-11-20,Nagpur,Tomato,1450']`, message: { en: 'The output should be the header and then every row of akola.csv and nagpur.csv, in that order.', mr: 'output मध्ये header आणि मग akola.csv आणि nagpur.csv च्या सगळ्या rows, याच क्रमाने हव्यात.' } },
          ],
          variants: [
            {
              label: { en: 'A new market joins: amravati.csv arrives too', mr: 'नवी मंडी जोडली: amravati.csv सुद्धा आली' },
              files: { 'data/amravati.csv': `date,market,commodity,modal_price
2026-11-20,Amravati,Onion,2025
2026-11-20,Amravati,Soybean,4350
` },
              output: ['Files: 3', 'Rows: 9'],
              checks: [
                { expr: `open('out/all_markets.csv').read().count('modal_price') == 1 and len(open('out/all_markets.csv').read().splitlines()) == 10`, message: { en: 'With three files: one header and 9 rows.', mr: 'तीन files असताना: एक header आणि 9 rows.' } },
                { expr: `open('out/all_markets.csv').read().splitlines()[4] == '2026-11-20,Amravati,Onion,2025'`, message: { en: 'Files go in name order: akola, amravati, nagpur.', mr: 'files नावाच्या क्रमाने: akola, amravati, nagpur.' } },
              ],
            },
            {
              label: { en: 'Nagpur sends just one row', mr: 'नागपूर फक्त एक row पाठवतं' },
              files: { 'data/nagpur.csv': `date,market,commodity,modal_price
2026-11-21,"Nagpur, Kalamna",Orange,3600
` },
              output: ['Files: 2', 'Rows: 4'],
              checks: [
                { expr: `open('out/all_markets.csv').read().splitlines()[-1] == '2026-11-21,"Nagpur, Kalamna",Orange,3600' and len(open('out/all_markets.csv').read().splitlines()) == 5`, message: { en: 'One header, 3 Akola rows and the single Nagpur row.', mr: 'एक header, अकोल्याच्या 3 rows आणि नागपूरची एक row.' } },
              ],
            },
          ],
          mustUse: [
            { pattern: 'next\\(', message: { en: 'Skip each file\'s header with next(reader).', mr: 'प्रत्येक file चा header next(reader) ने वगळा.' } },
          ],
          hints: [
            { en: 'Two changes. First: write the header row once, right after you create the writer, before the loop over files.', mr: 'दोन बदल. पहिला: writer बनवल्यावर लगेच, files च्या loop आधी, header ची row एकदा लिहा.' },
            { en: 'Second: inside the loop, keep the reader in a variable and call next(reader) once before the inner for loop. That throws away that file\'s header.', mr: 'दुसरा: loop च्या आत reader एका variable मध्ये ठेवा आणि आतल्या for loop आधी एकदा next(reader) बोलवा. त्याने त्या file चा header फेकला जातो.' },
            { en: "    writer.writerow(['date', 'market', 'commodity', 'modal_price'])\n...\n            reader = csv.reader(f)\n            next(reader)\n            for row in reader:", mr: "    writer.writerow(['date', 'market', 'commodity', 'modal_price'])\n...\n            reader = csv.reader(f)\n            next(reader)\n            for row in reader:" },
          ],
          successLine: { en: 'A new market file dropped in and your code picked it up without a single change. That is a pipeline.', mr: 'नव्या मंडीची file आली आणि तुमच्या code ने एकही बदल न करता ती उचलली. pipeline म्हणतात ते हेच.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: `line = '2026-11-20,"Pune, Gultekdi",Onion,2100'
print(len(line.split(',')))`,
        options: ['4', '3', '5', { en: 'An error', mr: 'error' }],
        answer: 2,
        explain: { en: 'There are 4 commas, one of them inside the quoted name, so split gives 5 pieces. csv.reader would give the correct 4 values.', mr: '4 commas आहेत, त्यातला एक quotes मधल्या नावात, म्हणून split 5 तुकडे देतो. csv.reader बरोबर 4 values देईल.' },
      },
      {
        q: { en: 'Why write with open(\'data/pune.csv\') as f: instead of f = open(\'data/pune.csv\')?', mr: 'f = open(\'data/pune.csv\') ऐवजी with open(\'data/pune.csv\') as f: का लिहायचं?' },
        options: [
          { en: 'with closes the file automatically when the block ends, even if an error happens inside', mr: 'block संपल्यावर with file आपोआप बंद करतो, आत error आला तरी' },
          { en: 'with reads the file faster', mr: 'with file जास्त वेगाने वाचतो' },
          { en: 'with turns every value into a number', mr: 'with प्रत्येक value number मध्ये बदलतो' },
          { en: 'Without with, Python cannot open CSV files', mr: 'with शिवाय Python CSV files उघडू शकत नाही' },
        ],
        answer: 0,
        explain: { en: 'with is about cleanup. The file is closed (and written data is saved) as soon as the block ends, crash or no crash.', mr: 'with म्हणजे आवराआवर. block संपताच file बंद होते (आणि लिहिलेला data save होतो), crash झाला किंवा नाही झाला तरी.' },
      },
      {
        q: { en: 'data/pune.csv has a row Onion,2100 under the header commodity,modal_price. What happens?', mr: 'data/pune.csv मध्ये commodity,modal_price या header खाली Onion,2100 ही row आहे. काय होतं?' },
        code: `import csv
with open('data/pune.csv', newline='') as f:
    row = next(csv.DictReader(f))
print(row['modal_price'] + 100)`,
        options: ['2200', '2100100', { en: 'KeyError: \'modal_price\'', mr: 'KeyError: \'modal_price\'' }, { en: 'TypeError: can only concatenate str (not "int") to str', mr: 'TypeError: can only concatenate str (not "int") to str' }],
        answer: 3,
        explain: { en: 'DictReader gives every value as a string, and Python will not add a string and a number. int(row[\'modal_price\']) + 100 gives 2200.', mr: 'DictReader प्रत्येक value string म्हणून देतो, आणि Python string आणि number ची बेरीज करत नाही. int(row[\'modal_price\']) + 100 केलं की 2200 येतं.' },
      },
      {
        q: { en: 'out/report.csv already has yesterday\'s rows. Your code opens it with open(\'out/report.csv\', \'w\', newline=\'\') and writes today\'s rows. What is in the file afterwards?', mr: 'out/report.csv मध्ये कालच्या rows आधीच आहेत. तुमचा code ती open(\'out/report.csv\', \'w\', newline=\'\') ने उघडून आजच्या rows लिहितो. नंतर file मध्ये काय असतं?' },
        options: [
          { en: 'Yesterday\'s rows, then today\'s rows', mr: 'कालच्या rows, मग आजच्या rows' },
          { en: 'Only today\'s rows: \'w\' empties the file first (\'a\' would add to the end)', mr: 'फक्त आजच्या rows: \'w\' आधी file रिकामी करतो (\'a\' शेवटी भर घालतो)' },
          { en: 'Only yesterday\'s rows: Python refuses to change an existing file', mr: 'फक्त कालच्या rows: Python आधीपासून असलेली file बदलत नाही' },
          { en: 'An error, because the file already exists', mr: 'error, कारण file आधीच आहे' },
        ],
        answer: 1,
        explain: { en: '\'w\' starts the file fresh. That is usually what a daily output wants, and it is exactly why you never open an input file with \'w\' by mistake.', mr: '\'w\' file नव्याने सुरू करतो. रोजच्या output साठी बहुतेक हेच हवं असतं, आणि म्हणूनच input file चुकूनही \'w\' ने उघडायची नाही.' },
      },
    ],
    recap: { line: { en: 'with open() and the csv module: read the header, one row at a time, convert numbers, write one clean file.', mr: 'with open() आणि csv module: header वाचा, एका वेळी एक row, numbers बदला, एक स्वच्छ file लिहा.' }, icon: '📂' },
  },

  // ───────────────────────── Y2.2 JSON: data from APIs
  {
    id: 'py2-2',
    code: 'Y2.2',
    level: 'intermediate',
    title: { en: 'JSON: data from APIs', mr: 'JSON: APIs कडून येणारा data' },
    skill: 'Read, flatten and write JSON with the json module',
    realLife: {
      place: 'station',
      title: { en: 'The dabbawala\'s tiffin', mr: 'डबेवाल्याचा डबा' },
      story: {
        en: 'Every morning Aai packs Baba\'s tiffin for the dabbawala at the station. The cloth bag has a code painted on the lid. Inside sits a three-tier steel tiffin: chapatis on top, bhaji and dal in two small bowls in the middle, rice at the bottom. To tell someone where the dal is, you say: the bag, then the tiffin, then the middle tier, then the second bowl. Boxes inside boxes, each with its place. At lunch Baba lays everything out flat on one plate, side by side, so he can see it all at once. And Aai\'s little note on top is written in Marathi. The dabbawala reads it in Marathi too, no strange codes.',
        mr: 'रोज सकाळी आई स्टेशनवरच्या डबेवाल्यासाठी बाबांचा डबा भरते. कापडी पिशवीच्या झाकणावर एक code रंगवलेला असतो. आत तीन खणांचा स्टीलचा डबा: वर पोळ्या, मधल्या खणात दोन छोट्या वाट्यांत भाजी आणि वरण, खाली भात. वरण कुठे आहे ते सांगायचं तर असं सांगायचं: पिशवी, मग डबा, मग मधला खण, मग दुसरी वाटी. डब्यात डबे, प्रत्येकाची आपली जागा. जेवताना बाबा सगळं एका ताटात शेजारी शेजारी पसरून ठेवतात, म्हणजे सगळं एका नजरेत दिसतं. आणि आईची वरची छोटी चिठ्ठी मराठीत लिहिलेली असते. डबेवालाही ती मराठीतच वाचतो, कोणतेही विचित्र codes नाहीत.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '👜', label: 'Open the bag (json.load)', mr: 'पिशवी उघडा (json.load)' },
          { icon: '🏷️', label: 'Find a box by its name (data[\'markets\'])', mr: 'नावावरून डबा शोधा (data[\'markets\'])' },
          { icon: '🍱', label: 'One tier deeper (m[\'prices\'][0])', mr: 'एक खण आत (m[\'prices\'][0])' },
          { icon: '🍽️', label: 'Lay it all flat on a plate (rows)', mr: 'सगळं ताटात पसरा (rows)' },
          { icon: '✉️', label: 'Pack it again, Marathi note intact (json.dump)', mr: 'पुन्हा भरा, मराठी चिठ्ठी जशीच्या तशी (json.dump)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'neutral', text: { en: 'Good news: the state market board now has a price API. No more 40 CSV files, just one call.', mr: 'चांगली बातमी: राज्य बाजार मंडळाचा आता price API आहे. आता 40 CSV files नकोत, फक्त एक call.' } },
        { who: 'theo', mood: 'worried', text: { en: 'I saved today\'s response as data/markets.json. It is markets inside a list, prices inside each market. And when I write it back out, the Marathi names turn into \\u0928 gibberish.', mr: 'आजचा response मी data/markets.json म्हणून save केला. list मध्ये markets, प्रत्येक market मध्ये prices. आणि मी तो परत लिहिला की मराठी नावं \\u0928 सारख्या गोंधळात बदलतात.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> boxes inside boxes inside boxes. reach for the wrong level and you get a KeyError. or worse, nothing. ⌁', mr: '>> डब्यात डबे, त्यात आणखी डबे. चुकीच्या पातळीवर हात घातला की KeyError. किंवा त्याहून वाईट, काहीच नाही. ⌁' } },
        { who: 'meera', mood: 'happy', text: { en: '{name}, you have read hundreds of JSON responses in Postman. pm.response.json() turned the text into an object. In Python, json.load does the same.', mr: '{name}, तू Postman मध्ये शेकडो JSON responses वाचले आहेस. pm.response.json() text चं object करायचं. Python मध्ये json.load तेच करतो.' } },
        { who: 'rex', mood: 'happy', text: { en: 'Load it, walk down the levels, flatten it into rows like a table, and write clean JSON with the Marathi kept as Marathi.', mr: 'तो load करा, पातळ्या उतरत जा, table सारख्या rows मध्ये सपाट करा, आणि मराठी मराठीच ठेवून स्वच्छ JSON लिहा.' } },
      ],
      problem: { en: 'The price API sends nested JSON: a list of markets, each with its own list of prices. Reports and the app need flat rows (one per market and commodity), and Theo\'s output file shows Marathi market names as \\u escape codes.', mr: 'price API nested JSON पाठवतो: markets ची list, प्रत्येकाची prices ची स्वतःची list. reports आणि app ला सपाट rows लागतात (प्रत्येक market आणि commodity साठी एक), आणि Theo च्या output file मध्ये मराठी market ची नावं \\u escape codes म्हणून दिसतात.' },
      solution: { en: 'json.load turns the file into Python dicts and lists. Two nested loops walk markets and prices and build one flat dict per price. json.dump with ensure_ascii=False and indent=2 writes a readable file with Marathi intact.', mr: 'json.load file चं Python dicts आणि lists मध्ये रूपांतर करतो. दोन nested loops markets आणि prices मधून फिरून प्रत्येक price साठी एक सपाट dict बनवतात. ensure_ascii=False आणि indent=2 सह json.dump मराठी जसंच्या तसं ठेवून वाचायला सोपी file लिहितो.' },
    },
    lesson: [
      { en: 'JSON is the text format almost every API speaks, the same one you checked in Postman. It maps straight onto Python: an object {} becomes a dict, an array [] becomes a list, strings stay strings, numbers become int or float, true and false become True and False, and null becomes None.', mr: 'JSON हा जवळजवळ प्रत्येक API बोलतो तो text format आहे, Postman मध्ये तपासलास तोच. तो थेट Python मध्ये बसतो: object {} म्हणजे dict, array [] म्हणजे list, strings strings च राहतात, numbers int किंवा float होतात, true आणि false म्हणजे True आणि False, आणि null म्हणजे None.' },
      { en: 'Four functions, two pairs. json.load(f) reads from an open file and json.loads(text) reads from a string (the s is for string). json.dump(obj, f) writes to a file and json.dumps(obj) gives you a string. Unlike CSV, JSON keeps numbers as numbers, so no int() is needed for a price that came as 2100.', mr: 'चार functions, दोन जोड्या. json.load(f) उघडलेल्या file मधून वाचतो आणि json.loads(text) string मधून वाचतो (s म्हणजे string). json.dump(obj, f) file मध्ये लिहितो आणि json.dumps(obj) string देतो. CSV च्या उलट, JSON numbers ना numbers च ठेवतो, म्हणून 2100 असा आलेल्या भावाला int() लागत नाही.' },
      { en: 'API data is nested: boxes inside boxes. Walk down one level at a time: data[\'markets\'] is a list, data[\'markets\'][0] is the first market (a dict), data[\'markets\'][0][\'prices\'][0][\'modal\'] is a number. To flatten it, loop over markets, then over each market\'s prices, and build one flat dict per price. A list of flat dicts is a table: ready for CSV, for SQL, and later for Spark.', mr: 'API चा data nested असतो: डब्यात डबे. एका वेळी एक पातळी उतरा: data[\'markets\'] ही list आहे, data[\'markets\'][0] म्हणजे पहिलं market (dict), data[\'markets\'][0][\'prices\'][0][\'modal\'] हा number आहे. सपाट करायला markets वर loop करा, मग प्रत्येक market च्या prices वर, आणि प्रत्येक price साठी एक सपाट dict बनवा. सपाट dicts ची list म्हणजे table: CSV साठी, SQL साठी, आणि पुढे Spark साठी तयार.' },
      { en: 'When you write JSON, json.dumps escapes every non-English letter by default, so पुणे comes out as \\u092a\\u0941\\u0923\\u0947. Pass ensure_ascii=False to keep Marathi readable (and open the file with encoding=\'utf-8\'). indent=2 puts each item on its own line, so a person can read and diff the file.', mr: 'JSON लिहिताना json.dumps default ने प्रत्येक इंग्रजी नसलेलं अक्षर escape करतो, त्यामुळे पुणे हे \\u092a\\u0941\\u0923\\u0947 असं बाहेर येतं. मराठी वाचता यावं म्हणून ensure_ascii=False द्या (आणि file encoding=\'utf-8\' ने उघडा). indent=2 प्रत्येक item वेगळ्या ओळीवर ठेवतो, म्हणजे माणसाला file वाचता आणि तुलना करता येते.' },
    ],
    syntax: {
      template: `import json

with open('data/markets.json', encoding='utf-8') as f:
    data = json.load(f)

for m in data['markets']:
    for p in m['prices']:
        print(m['name'], p['commodity'], p['modal'])

with open('out/prices.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)`,
      parts: [
        { code: 'json.load(f) / json.loads(text)', means: { en: 'JSON from a file / from a string, into dicts and lists', mr: 'file मधून / string मधून JSON, dicts आणि lists मध्ये' } },
        { code: "data['markets'][0]['prices']", means: { en: 'walk down the levels: key, index, key', mr: 'पातळ्या उतरा: key, index, key' } },
        { code: 'for m in ...: for p in ...:', means: { en: 'two nested loops flatten a list inside a list into rows', mr: 'दोन nested loops list मधली list rows मध्ये सपाट करतात' } },
        { code: 'json.dump(obj, f) / json.dumps(obj)', means: { en: 'Python into JSON: into a file / into a string', mr: 'Python चं JSON: file मध्ये / string मध्ये' } },
        { code: 'ensure_ascii=False, indent=2', means: { en: 'keep Marathi as Marathi, one item per line', mr: 'मराठी मराठीच ठेवा, एका ओळीत एक item' } },
      ],
      example: [
        { code: "data = json.load(f)", note: { en: 'open the dabbawala\'s bag: the whole response becomes a dict', mr: 'डबेवाल्याची पिशवी उघडा: पूर्ण response एक dict होतो' } },
        { code: "first = data['markets'][0]", note: { en: 'the first tiffin in the bag: Pune', mr: 'पिशवीतला पहिला डबा: पुणे' } },
        { code: "print(first['prices'][1]['modal'])", note: { en: 'middle tier, second bowl: 1400, already a number', mr: 'मधला खण, दुसरी वाटी: 1400, आधीच number' } },
        { code: "rows.append({'market': m['name'], 'commodity': p['commodity']})", note: { en: 'lay everything flat on one plate', mr: 'सगळं एका ताटात सपाट पसरा' } },
        { code: "json.dumps({'market': 'पुणे'}, ensure_ascii=False)", note: { en: 'Aai\'s note stays in Marathi: {"market": "पुणे"}', mr: 'आईची चिठ्ठी मराठीतच राहते: {"market": "पुणे"}' } },
      ],
      pitfall: { en: 'json.loads(\'data/markets.json\') does not open the file. It tries to read the path itself as JSON and fails with JSONDecodeError. Files go to json.load(f), strings to json.loads(text). And JSON needs double quotes: {\'a\': 1} is a Python dict, not valid JSON.', mr: 'json.loads(\'data/markets.json\') file उघडत नाही. तो path लाच JSON म्हणून वाचायचा प्रयत्न करतो आणि JSONDecodeError ने fail होतो. files json.load(f) ला, strings json.loads(text) ला. आणि JSON ला double quotes लागतात: {\'a\': 1} ही Python dict आहे, valid JSON नाही.' },
    },
    practice: {
      intro: { en: 'The saved API responses are shown above the editor. Run, read the output, then Submit. Hidden responses from other days will test your code too.', mr: 'save केलेले API responses editor वर दिसतात. Run करा, output वाचा, मग Submit. दुसऱ्या दिवसांचे लपवलेले responses सुद्धा तुमचा code तपासतील.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'This code reads a tiny JSON string the way the API sends it. Press Run. What does the second printed line show?', mr: 'हा code API पाठवतो तशी एक छोटी JSON string वाचतो. Run दाबा. print झालेली दुसरी ओळ काय दाखवते?' },
          pythonSandbox: {
            code: `import json

text = '{"market": "Pune", "open": true, "note": null, "prices": [2100, 1400]}'
data = json.loads(text)
print(type(data))
print(data['open'], data['note'])
print(data['prices'][0] + 100)`,
          },
          options: ['true null', 'True None', '"true" "null"', { en: 'A KeyError', mr: 'KeyError' }],
          correct: [1],
          explain: { en: 'json.loads turned the JSON into Python: true became True and null became None. The prices list holds real numbers, so 2100 + 100 printed 2200.', mr: 'json.loads ने JSON चं Python केलं: true चं True आणि null चं None झालं. prices list मध्ये खरे numbers आहेत, म्हणून 2100 + 100 ने 2200 print झालं.' },
          hints: [
            { en: 'The first line says <class \'dict\'>: it is a real Python dict now.', mr: 'पहिली ओळ <class \'dict\'> सांगते: आता ती खरी Python dict आहे.' },
            { en: 'Python writes its booleans with a capital letter and has its own word for "nothing".', mr: 'Python आपले booleans capital अक्षराने लिहितो आणि "काहीच नाही" साठी त्याचा स्वतःचा शब्द आहे.' },
          ],
          successLine: { en: 'Same JSON you saw in Postman, now as Python values.', mr: 'Postman मध्ये पाहिलास तोच JSON, आता Python values म्हणून.' },
        },
        {
          kind: 'python',
          prompt: { en: 'This code crashes with JSONDecodeError. data/api_prices.json is a file, so it needs json.load on an open file. Fix it, then print every record as market commodity modal_price (like Pune Onion 2100), one per line, under the Date and Records lines.', mr: 'हा code JSONDecodeError ने crash होतो. data/api_prices.json ही file आहे, म्हणून उघडलेल्या file वर json.load लागतो. ते दुरुस्त करा, मग Date आणि Records ओळींखाली प्रत्येक record market commodity modal_price (उदा. Pune Onion 2100) असा, एका ओळीत एक, print करा.' },
          files: { 'data/api_prices.json': API_PRICES_JSON },
          starter: `import json

data = json.loads('data/api_prices.json')

records = data['records']
print('Date:', data['date'])
print('Records:', len(records))
# TODO: print market, commodity and modal_price for every record
`,
          solution: `import json

with open('data/api_prices.json', encoding='utf-8') as f:
    data = json.load(f)

records = data['records']
print('Date:', data['date'])
print('Records:', len(records))
for r in records:
    print(r['market'], r['commodity'], r['modal_price'])
`,
          output: ['Date: 2026-11-20', 'Records: 4', 'Pune Onion 2100', 'Nashik Onion 2200', 'Lasalgaon Onion 2150', 'Nagpur Tomato 1450'],
          variants: [
            {
              label: { en: 'Another day\'s response with only two records', mr: 'दुसऱ्या दिवसाचा response, फक्त दोन records' },
              files: { 'data/api_prices.json': `{"source": "mandi-board-api", "date": "2026-11-21", "unit": "INR/quintal", "records": [
  {"market": "Solapur", "commodity": "Onion", "modal_price": 1900},
  {"market": "Kolhapur", "commodity": "Potato", "modal_price": 1750}
]}
` },
              output: ['Date: 2026-11-21', 'Records: 2', 'Solapur Onion 1900', 'Kolhapur Potato 1750'],
            },
          ],
          mustUse: [
            { pattern: 'json\\.load\\(', message: { en: 'Read the file with json.load(f).', mr: 'file json.load(f) ने वाचा.' } },
          ],
          hints: [
            { en: 'json.loads wants JSON text. You gave it the text data/api_prices.json, which is a path, not JSON.', mr: 'json.loads ला JSON text हवा. तुम्ही त्याला data/api_prices.json हा text दिला, जो path आहे, JSON नाही.' },
            { en: 'Open the file with with open(..., encoding=\'utf-8\') as f: and call json.load(f). Then loop over records.', mr: 'with open(..., encoding=\'utf-8\') as f: ने file उघडा आणि json.load(f) बोलवा. मग records वर loop करा.' },
            { en: "with open('data/api_prices.json', encoding='utf-8') as f:\n    data = json.load(f)\n...\nfor r in records:\n    print(r['market'], r['commodity'], r['modal_price'])", mr: "with open('data/api_prices.json', encoding='utf-8') as f:\n    data = json.load(f)\n...\nfor r in records:\n    print(r['market'], r['commodity'], r['modal_price'])" },
          ],
          successLine: { en: 'load for files, loads for strings. You will not mix them up again.', mr: 'files साठी load, strings साठी loads. आता गल्लत होणार नाही.' },
        },
        {
          kind: 'python',
          prompt: { en: 'data/markets.json is nested: markets, and inside each market a list of prices. Flatten it into rows: a list with one dict per price, with the keys date, market, commodity, modal_price (take market from name and modal_price from modal). Print Flat rows: <count>.', mr: 'data/markets.json nested आहे: markets, आणि प्रत्येक market मध्ये prices ची list. त्याला rows मध्ये सपाट करा: प्रत्येक price साठी एक dict असलेली list, ज्यात date, market, commodity, modal_price या keys असतील (market हे name मधून आणि modal_price हे modal मधून). Flat rows: <count> print करा.' },
          files: { 'data/markets.json': MARKETS_JSON },
          starter: `import json

with open('data/markets.json', encoding='utf-8') as f:
    data = json.load(f)

rows = []
for m in data['markets']:
    # TODO: loop over m['prices'] and add one flat dict per price
    rows.append({'date': data['date'], 'market': m['name']})

print('Flat rows:', len(rows))
`,
          solution: `import json

with open('data/markets.json', encoding='utf-8') as f:
    data = json.load(f)

rows = []
for m in data['markets']:
    for p in m['prices']:
        rows.append({'date': data['date'], 'market': m['name'], 'commodity': p['commodity'], 'modal_price': p['modal']})

print('Flat rows:', len(rows))
`,
          output: ['Flat rows: 5'],
          checks: [
            { expr: `rows[0] == {'date': '2026-11-20', 'market': 'Pune', 'commodity': 'Onion', 'modal_price': 2100}`, message: { en: 'rows[0] should be {\'date\': \'2026-11-20\', \'market\': \'Pune\', \'commodity\': \'Onion\', \'modal_price\': 2100}.', mr: 'rows[0] म्हणजे {\'date\': \'2026-11-20\', \'market\': \'Pune\', \'commodity\': \'Onion\', \'modal_price\': 2100} असायला हवं.' } },
            { expr: `[(r['market'], r['commodity'], r['modal_price']) for r in rows] == [('Pune', 'Onion', 2100), ('Pune', 'Tomato', 1400), ('Nashik', 'Onion', 2200), ('Nagpur', 'Orange', 3500), ('Nagpur', 'Onion', 2000)]`, message: { en: 'There should be one row per price, in the order of the file.', mr: 'प्रत्येक price साठी एक row हवी, file च्या क्रमाने.' } },
          ],
          variants: [
            {
              label: { en: 'Next day: Satara sent an empty price list, Lasalgaon sent three', mr: 'दुसरा दिवस: साताऱ्याने रिकामी prices list पाठवली, लासलगावने तीन' },
              files: { 'data/markets.json': MARKETS_JSON_B },
              output: ['Flat rows: 6'],
              checks: [
                { expr: `rows[0] == {'date': '2026-11-21', 'market': 'Kolhapur', 'commodity': 'Onion', 'modal_price': 2300}`, message: { en: 'The date must come from the file, not be typed in.', mr: 'date file मधूनच यायला हवी, हाताने लिहिलेली नको.' } },
                { expr: `[r['market'] for r in rows] == ['Kolhapur', 'Kolhapur', 'Sangli', 'Lasalgaon', 'Lasalgaon', 'Lasalgaon']`, message: { en: 'A market with no prices adds no rows; Lasalgaon adds three.', mr: 'prices नसलेलं market एकही row जोडत नाही; लासलगाव तीन जोडतं.' } },
              ],
            },
          ],
          hints: [
            { en: 'You need a loop inside the loop: for p in m[\'prices\']:. The append moves inside that inner loop.', mr: 'loop च्या आत loop लागेल: for p in m[\'prices\']:. append त्या आतल्या loop मध्ये जातो.' },
            { en: 'Each flat dict mixes three levels: data[\'date\'] from the top, m[\'name\'] from the market, p[\'commodity\'] and p[\'modal\'] from the price.', mr: 'प्रत्येक सपाट dict तीन पातळ्या एकत्र करते: वरून data[\'date\'], market मधून m[\'name\'], price मधून p[\'commodity\'] आणि p[\'modal\'].' },
            { en: "for m in data['markets']:\n    for p in m['prices']:\n        rows.append({'date': data['date'], 'market': m['name'], 'commodity': p['commodity'], 'modal_price': p['modal']})", mr: "for m in data['markets']:\n    for p in m['prices']:\n        rows.append({'date': data['date'], 'market': m['name'], 'commodity': p['commodity'], 'modal_price': p['modal']})" },
          ],
          successLine: { en: 'Boxes inside boxes, laid flat on one plate. That list of dicts is a table now.', mr: 'डब्यातले डबे एका ताटात सपाट. dicts ची ती list आता table आहे.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'This is Theo\'s problem in two lines. Press Run and compare the two printed lines. Why does the first one look like that?', mr: 'हा Theo चा प्रश्न दोन ओळींत. Run दाबा आणि print झालेल्या दोन ओळींची तुलना करा. पहिली ओळ तशी का दिसते?' },
          pythonSandbox: {
            code: `import json

row = {'market': 'पुणे', 'modal_price': 2100}
print(json.dumps(row))
print(json.dumps(row, ensure_ascii=False))`,
          },
          options: [
            { en: 'The file is corrupted and the Gremlin changed the letters', mr: 'file बिघडली आहे आणि Gremlin ने अक्षरं बदलली' },
            { en: 'Python cannot store Marathi text in a dict', mr: 'Python dict मध्ये मराठी text ठेवू शकत नाही' },
            { en: 'json.dumps escapes non-English letters by default; ensure_ascii=False keeps them as they are', mr: 'json.dumps default ने इंग्रजी नसलेली अक्षरं escape करतो; ensure_ascii=False ती जशीच्या तशी ठेवतो' },
            { en: 'The modal_price is too large for JSON', mr: 'modal_price JSON साठी खूप मोठा आहे' },
          ],
          correct: [2],
          explain: { en: 'Both lines hold the same data; a JSON reader turns the codes back into पुणे. But people read these files too, and ensure_ascii=False keeps them readable.', mr: 'दोन्ही ओळींमध्ये तोच data आहे; JSON वाचणारा ते codes परत पुणे मध्ये बदलतो. पण या files माणसंही वाचतात, आणि ensure_ascii=False त्या वाचण्याजोग्या ठेवतो.' },
          hints: [
            { en: 'The only difference between the two lines of code is one argument.', mr: 'code च्या दोन ओळींत फरक फक्त एका argument चा आहे.' },
            { en: 'ASCII means plain English letters and digits. What does "ensure ASCII" do to everything else?', mr: 'ASCII म्हणजे साधी इंग्रजी अक्षरं आणि अंक. "ensure ASCII" बाकीच्या सगळ्यांचं काय करतो?' },
          ],
          successLine: { en: 'Same data, two looks. Now you know which switch Theo needs.', mr: 'तोच data, दोन रूपं. Theo ला कोणता switch हवा ते आता तुम्हाला माहीत आहे.' },
        },
        {
          kind: 'python',
          prompt: { en: 'The Marathi version of the app wants out/onion_mr.json: a list with one dict per Onion price, with the keys market (the Marathi name, name_mr) and modal_price. Write it with json.dump using ensure_ascii=False and indent=2, so पुणे stays पुणे. The final print is already there.', mr: 'app च्या मराठी आवृत्तीला out/onion_mr.json हवी: प्रत्येक Onion price साठी एक dict असलेली list, ज्यात market (मराठी नाव, name_mr) आणि modal_price या keys असतील. ती json.dump ने ensure_ascii=False आणि indent=2 वापरून लिहा, म्हणजे पुणे हे पुणे च राहील. शेवटचा print आधीच दिलेला आहे.' },
          files: { 'data/markets.json': MARKETS_JSON },
          starter: `import json
import os

with open('data/markets.json', encoding='utf-8') as f:
    data = json.load(f)

onion = []
for m in data['markets']:
    for p in m['prices']:
        # TODO: for Onion prices, add {'market': <Marathi name>, 'modal_price': <modal>}
        pass

os.makedirs('out', exist_ok=True)
with open('out/onion_mr.json', 'w', encoding='utf-8') as f:
    json.dump(onion, f)

print(f'Saved {len(onion)} onion prices')
`,
          solution: `import json
import os

with open('data/markets.json', encoding='utf-8') as f:
    data = json.load(f)

onion = []
for m in data['markets']:
    for p in m['prices']:
        if p['commodity'] == 'Onion':
            onion.append({'market': m['name_mr'], 'modal_price': p['modal']})

os.makedirs('out', exist_ok=True)
with open('out/onion_mr.json', 'w', encoding='utf-8') as f:
    json.dump(onion, f, ensure_ascii=False, indent=2)

print(f'Saved {len(onion)} onion prices')
`,
          output: ['Saved 3 onion prices'],
          checks: [
            { expr: `json.load(open('out/onion_mr.json', encoding='utf-8')) == [{'market': 'पुणे', 'modal_price': 2100}, {'market': 'नाशिक', 'modal_price': 2200}, {'market': 'नागपूर', 'modal_price': 2000}]`, message: { en: 'out/onion_mr.json should hold the three onion prices with Marathi market names (name_mr), in file order.', mr: 'out/onion_mr.json मध्ये कांद्याचे तीन भाव मराठी market नावांसह (name_mr), file च्या क्रमाने हवेत.' } },
            { expr: `'पुणे' in open('out/onion_mr.json', encoding='utf-8').read()`, message: { en: 'The file shows \\u codes instead of पुणे. Pass ensure_ascii=False to json.dump.', mr: 'file मध्ये पुणे ऐवजी \\u codes दिसतात. json.dump ला ensure_ascii=False द्या.' } },
            { expr: `open('out/onion_mr.json', encoding='utf-8').read().startswith('[' + chr(10) + '  {')`, message: { en: 'The file is all on one line. Pass indent=2 to json.dump.', mr: 'पूर्ण file एकाच ओळीत आहे. json.dump ला indent=2 द्या.' } },
          ],
          variants: [
            {
              label: { en: 'Next day: new markets, one with no prices at all', mr: 'दुसरा दिवस: नवी markets, एकाकडे एकही भाव नाही' },
              files: { 'data/markets.json': MARKETS_JSON_B },
              output: ['Saved 2 onion prices'],
              checks: [
                { expr: `json.load(open('out/onion_mr.json', encoding='utf-8')) == [{'market': 'कोल्हापूर', 'modal_price': 2300}, {'market': 'लासलगाव', 'modal_price': 2150}]`, message: { en: 'The onion list must be built from the file of the day.', mr: 'कांद्याची list त्या दिवसाच्या file वरूनच बनायला हवी.' } },
              ],
            },
          ],
          mustUse: [
            { pattern: 'ensure_ascii\\s*=\\s*False', message: { en: 'Use ensure_ascii=False so Marathi stays readable.', mr: 'मराठी वाचता यावं म्हणून ensure_ascii=False वापरा.' } },
          ],
          hints: [
            { en: 'Inside the inner loop, keep only prices where p[\'commodity\'] == \'Onion\'. The Marathi name is m[\'name_mr\'].', mr: 'आतल्या loop मध्ये फक्त p[\'commodity\'] == \'Onion\' असलेले भाव ठेवा. मराठी नाव m[\'name_mr\'] मध्ये आहे.' },
            { en: 'json.dump takes extra arguments after the file: json.dump(onion, f, ensure_ascii=False, indent=2).', mr: 'json.dump ला file नंतर जास्तीचे arguments देता येतात: json.dump(onion, f, ensure_ascii=False, indent=2).' },
            { en: "        if p['commodity'] == 'Onion':\n            onion.append({'market': m['name_mr'], 'modal_price': p['modal']})\n...\n    json.dump(onion, f, ensure_ascii=False, indent=2)", mr: "        if p['commodity'] == 'Onion':\n            onion.append({'market': m['name_mr'], 'modal_price': p['modal']})\n...\n    json.dump(onion, f, ensure_ascii=False, indent=2)" },
          ],
          successLine: { en: 'पुणे, नाशिक, नागपूर, readable by people and by machines. The Marathi app is happy.', mr: 'पुणे, नाशिक, नागपूर, माणसांना आणि machines ना दोघांना वाचता येणारं. मराठी app खूश.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'An API response has "arrival": null. After json.loads, what is the value in Python?', mr: 'एका API response मध्ये "arrival": null आहे. json.loads नंतर Python मध्ये value काय असते?' },
        options: [
          { en: 'The string \'null\'', mr: '\'null\' ही string' },
          'None',
          '0',
          'False',
        ],
        answer: 1,
        explain: { en: 'JSON null becomes Python None. A data engineer checks for it with if value is None, before doing maths on it.', mr: 'JSON चा null म्हणजे Python चा None. data engineer त्यावर गणित करण्याआधी if value is None ने तपासतो.' },
      },
      {
        q: { en: 'What is the difference between json.load and json.loads?', mr: 'json.load आणि json.loads मध्ये फरक काय?' },
        options: [
          { en: 'load is for small files, loads is for large files', mr: 'load छोट्या files साठी, loads मोठ्या files साठी' },
          { en: 'loads also writes the data back to disk', mr: 'loads data परत disk वर सुद्धा लिहितो' },
          { en: 'There is none, they are two names for the same function', mr: 'काहीच नाही, एकाच function ची दोन नावं' },
          { en: 'load reads from an open file, loads reads from a string', mr: 'load उघडलेल्या file मधून वाचतो, loads string मधून वाचतो' },
        ],
        answer: 3,
        explain: { en: 'The s means string. The same pair exists for writing: dump to a file, dumps to a string.', mr: 's म्हणजे string. लिहिण्यासाठीही अशीच जोडी आहे: file मध्ये dump, string मध्ये dumps.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: `import json
text = '{"markets": [{"name": "Pune", "prices": [{"modal": 2100}, {"modal": 1400}]}]}'
data = json.loads(text)
print(data['markets'][0]['prices'][1]['modal'])`,
        options: ['1400', '2100', { en: 'KeyError: \'prices\'', mr: 'KeyError: \'prices\'' }, "{'modal': 1400}"],
        answer: 0,
        explain: { en: 'markets is a list, [0] is the Pune dict, [\'prices\'] is a list, [1] is its second item, [\'modal\'] is 1400. One step per level.', mr: 'markets ही list, [0] म्हणजे पुण्याची dict, [\'prices\'] ही list, [1] म्हणजे तिचा दुसरा item, [\'modal\'] म्हणजे 1400. प्रत्येक पातळीला एक पायरी.' },
      },
      {
        q: { en: 'Why pass ensure_ascii=False to json.dump when writing market names like नाशिक?', mr: 'नाशिक सारखी market ची नावं लिहिताना json.dump ला ensure_ascii=False का द्यायचं?' },
        options: [
          { en: 'Without it, json.dump crashes on Marathi text', mr: 'त्याशिवाय json.dump मराठी text वर crash होतो' },
          { en: 'It makes the file smaller by removing Marathi', mr: 'तो मराठी काढून file लहान करतो' },
          { en: 'So the file keeps नाशिक readable instead of \\u escape codes', mr: 'म्हणजे file मध्ये \\u escape codes ऐवजी नाशिक वाचण्याजोगं राहतं' },
          { en: 'It sorts the keys alphabetically', mr: 'तो keys अक्षरक्रमाने लावतो' },
        ],
        answer: 2,
        explain: { en: 'By default every non-ASCII letter is escaped. The data is still correct either way, but ensure_ascii=False keeps the file readable for people (open it with encoding=\'utf-8\').', mr: 'default ने प्रत्येक non-ASCII अक्षर escape होतं. दोन्हीकडे data बरोबरच असतो, पण ensure_ascii=False file माणसांना वाचण्याजोगी ठेवतो (ती encoding=\'utf-8\' ने उघडा).' },
      },
    ],
    recap: { line: { en: 'json.load and json.dump: walk down the levels, flatten nested data into rows, and keep Marathi as Marathi.', mr: 'json.load आणि json.dump: पातळ्या उतरा, nested data rows मध्ये सपाट करा, आणि मराठी मराठीच ठेवा.' }, icon: '🍱' },
  },

  // ───────────────────────── Y2.3 Errors and bad rows
  {
    id: 'py2-3',
    code: 'Y2.3',
    level: 'intermediate',
    title: { en: 'Errors and bad rows', mr: 'Errors आणि खराब rows' },
    skill: 'try/except/else/finally, quarantining bad rows, and raising clear errors',
    realLife: {
      place: 'postoffice',
      title: { en: 'Sonal\'s return tray', mr: 'सोनलचा परतीचा ट्रे' },
      story: {
        en: 'My cousin Sonal sorts the morning mail at the Pune head post office. Thousands of letters, and every day a few are bad: one has no PIN code, one has a PIN with the letter O instead of a zero, one is soaked in rain. Sonal does not shut the post office over one bad letter. She drops it into the return tray with a slip saying why, and the rest go out on time. At the end of the shift she checks: letters in equals letters sent plus letters returned, or someone asks where the missing ones went. But one day a whole bag arrives where the forms have no address box at all. That is no longer one bad letter. She stops the line and calls the supervisor.',
        mr: 'माझी चुलत बहीण सोनल पुण्याच्या मुख्य post office मध्ये सकाळची टपाल वर्गवारी करते. हजारो पत्रं, आणि रोज काही खराब: एकावर PIN code नाही, एकाच्या PIN मध्ये शून्याऐवजी O हे अक्षर, एक पावसात भिजलेलं. एका खराब पत्रासाठी सोनल post office बंद करत नाही. ती ते परतीच्या ट्रेमध्ये, कारण लिहिलेल्या चिठ्ठीसह टाकते, आणि बाकीची पत्रं वेळेवर जातात. पाळी संपताना ती तपासते: आलेली पत्रं = पाठवलेली + परत केलेली, नाहीतर कोणीतरी विचारेल की उरलेली कुठे गेली. पण एके दिवशी एक अख्खी पिशवी येते जिच्या forms वर पत्त्याची जागाच नाही. आता हे एक खराब पत्र नाही. ती line थांबवते आणि supervisor ला बोलावते.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'A good address goes out. A bad one goes to the return tray with a slip saying why.', mr: 'चांगला पत्ता असलेलं पत्र पुढे जातं. खराब पत्र कारणाच्या चिठ्ठीसह परतीच्या ट्रेमध्ये.' },
        items: [
          { icon: '✉️', label: '411001 Pune', mr: '411001 पुणे', pass: true },
          { icon: '✉️', label: '41100O (letter O)', mr: '41100O (O अक्षर)', pass: false },
          { icon: '✉️', label: '411038 Kothrud', mr: '411038 कोथरूड', pass: true },
          { icon: '✉️', label: 'No PIN code', mr: 'PIN code नाही', pass: false },
          { icon: '✉️', label: '422001 Nashik', mr: '422001 नाशिक', pass: true },
          { icon: '💧', label: 'Soaked, unreadable', mr: 'भिजलेलं, वाचता येत नाही', pass: false },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'angry', text: { en: 'At 6 this morning not one price reached the app. Not Pune, not Nashik, nothing. Farmers were already on the road to the mandi.', mr: 'आज सकाळी 6 वाजता एकही भाव app पर्यंत पोहोचला नाही. ना पुणे, ना नाशिक, काहीच नाही. शेतकरी तर मंडीच्या रस्त्याला लागले होते.' } },
        { who: 'theo', mood: 'worried', text: { en: 'The job crashed on row 3 of the Nagpur file: ValueError, invalid literal for int(): \'21OO\'. One row, and all 40 markets were lost.', mr: 'Nagpur file च्या row 3 वर job crash झाला: ValueError, invalid literal for int(): \'21OO\'. एक row, आणि सगळ्या 40 मंड्या गेल्या.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> two letter O\'s where the zeros go. one tiny row, and your whole morning falls over. i love dominoes. ⌁', mr: '>> शून्यांच्या जागी दोन O. एक छोटीशी row, आणि तुमची अख्खी सकाळ कोसळते. मला dominoes फार आवडतात. ⌁' } },
        { who: 'rex', mood: 'neutral', text: { en: '{name}, one bad row must not stop ten thousand good ones. Catch it, count it, and put it in a quarantine file with the reason. But if a whole column is missing, stop loudly.', mr: '{name}, एका खराब row मुळे दहा हजार चांगल्या rows थांबता कामा नयेत. ती पकडा, मोजा, आणि कारणासह quarantine file मध्ये ठेवा. पण अख्खा column च नसेल, तर मोठ्याने थांबा.' } },
        { who: 'meera', mood: 'happy', text: { en: 'You are a tester. You already think in bad inputs. Now your code gets to handle them like Sonal does.', mr: 'तू tester आहेस. खराब inputs चा विचार तू आधीच करतेस. आता तुझा code सोनलसारखा ते हाताळेल.' } },
      ],
      problem: { en: 'One bad value (\'21OO\', \'NA\', an empty cell) raises an error, the whole job stops, and no market gets its prices. Nobody knows how many rows were bad or which ones.', mr: 'एक खराब value (\'21OO\', \'NA\', रिकामा cell) error आणते, पूर्ण job थांबतो, आणि कोणत्याच मंडीचे भाव जात नाहीत. किती rows खराब होत्या किंवा कोणत्या, हे कोणालाच माहीत नसतं.' },
      solution: { en: 'Wrap the risky step in try/except for the exact error types, skip and count bad rows, write them to a rejects file with the line number and reason, and check that good plus rejected equals rows in. For problems that make the whole file useless, like a missing column, raise an error with a clear message and stop.', mr: 'धोकादायक पायरी नेमक्या error types साठी try/except मध्ये ठेवा, खराब rows वगळा आणि मोजा, त्या ओळ क्रमांक आणि कारणासह rejects file मध्ये लिहा, आणि चांगल्या + नाकारलेल्या = आलेल्या rows हे तपासा. पूर्ण file निरुपयोगी करणाऱ्या समस्यांसाठी, जसा column च नसणं, स्पष्ट message सह error raise करा आणि थांबा.' },
    },
    lesson: [
      { en: 'When Python meets something it cannot do, it raises an exception: int(\'21OO\') raises ValueError, row[\'price\'] on a dict without that key raises KeyError, open(\'data/sangli.csv\') on a missing file raises FileNotFoundError. If nobody catches it, the program stops right there, and every row after it is lost.', mr: 'Python ला एखादी गोष्ट करता आली नाही की तो exception raise करतो: int(\'21OO\') ValueError आणतो, ती key नसलेल्या dict वर row[\'price\'] KeyError आणतो, नसलेल्या file वर open(\'data/sangli.csv\') FileNotFoundError आणतो. कोणी तो पकडला नाही तर program तिथेच थांबतो, आणि त्यानंतरची प्रत्येक row गमावली जाते.' },
      { en: 'try: holds the risky line. except ValueError: runs only if that exact error happened. else: runs only if nothing went wrong, which is the right place to keep the good row. finally: runs every time, error or not, for things like "log that this file was checked". Catch the narrow types you expect. A bare except: also swallows your own typos (NameError), and as a tester you know a hidden bug is the worst kind.', mr: 'try: मध्ये धोकादायक ओळ असते. except ValueError: फक्त तोच error आला तरच चालतो. else: काहीच चुकलं नाही तरच चालतो, चांगली row ठेवायची हीच योग्य जागा. finally: प्रत्येक वेळी चालतो, error असो वा नसो, "ही file तपासली" असा log लिहिण्यासारख्या कामांसाठी. अपेक्षित असलेले नेमके types पकडा. नुसता except: तुमच्या स्वतःच्या typos (NameError) सुद्धा गिळतो, आणि tester म्हणून तुला माहीत आहे की लपलेला bug सगळ्यात वाईट.' },
      { en: 'The data engineer\'s pattern for bad rows: skip, count, quarantine. Do not let the row vanish silently. Write it to a rejects file with its line number, the raw value and a reason, so someone can fix it at the source. Then reconcile: rows in = good + rejected. If those numbers do not match, rows are leaking somewhere.', mr: 'खराब rows साठी data engineer ची पद्धत: वगळा, मोजा, quarantine करा. row गुपचूप गायब होऊ देऊ नका. ती तिचा ओळ क्रमांक, मूळ value आणि कारणासह rejects file मध्ये लिहा, म्हणजे कोणीतरी ती मुळाशी दुरुस्त करू शकेल. मग जुळवा: आलेल्या rows = चांगल्या + नाकारलेल्या. हे आकडे जुळले नाहीत तर कुठेतरी rows गळत आहेत.' },
      { en: 'Some problems are not one bad row. If the modal_price column is missing, every row is bad, and "skipping" them would publish an empty price list as if all is fine. That is Sonal\'s bag with no address box. raise ValueError(\'data/solapur.csv is missing column modal_price\') stops the pipeline with a message that says exactly what to fix. Fail loudly on broken files, forgive single bad rows.', mr: 'काही समस्या म्हणजे एक खराब row नसते. modal_price column च नसेल तर प्रत्येक row खराब, आणि त्या "वगळल्या" तर सगळं ठीक असल्यासारखी रिकामी भावयादी प्रसिद्ध होईल. ही म्हणजे पत्त्याची जागाच नसलेली सोनलची पिशवी. raise ValueError(\'data/solapur.csv is missing column modal_price\') नेमकं काय दुरुस्त करायचं ते सांगणाऱ्या message सह pipeline थांबवतो. तुटलेल्या files वर मोठ्याने fail व्हा, एकट्या खराब rows ना माफ करा.' },
    ],
    syntax: {
      template: `try:
    price = int(row['modal_price'])
except ValueError:
    rejects.append({'line': n, 'reason': 'not a number'})
except KeyError:
    rejects.append({'line': n, 'reason': 'missing modal_price'})
else:
    clean.append(price)
finally:
    checked += 1

if 'modal_price' not in reader.fieldnames:
    raise ValueError(f'{path} is missing column modal_price')`,
      parts: [
        { code: 'try:', means: { en: 'the risky line goes here', mr: 'धोकादायक ओळ इथे' } },
        { code: 'except ValueError:', means: { en: 'runs only for that error type; you can have several except blocks', mr: 'फक्त त्या error type साठी चालतो; अनेक except blocks असू शकतात' } },
        { code: 'else:', means: { en: 'runs only when try had no error: keep the good row here', mr: 'try मध्ये error आला नाही तरच चालतो: चांगली row इथे ठेवा' } },
        { code: 'finally:', means: { en: 'runs every time, error or not', mr: 'प्रत्येक वेळी चालतो, error असो वा नसो' } },
        { code: "raise ValueError('...')", means: { en: 'stop on purpose, with a message that says what to fix', mr: 'मुद्दाम थांबा, काय दुरुस्त करायचं ते सांगणाऱ्या message सह' } },
      ],
      example: [
        { code: 'for n, row in enumerate(reader, start=2):', note: { en: 'line numbers as the file shows them (line 1 is the header): the slip on each returned letter', mr: 'file दाखवते तसे ओळ क्रमांक (ओळ 1 म्हणजे header): परत केलेल्या प्रत्येक पत्रावरची चिठ्ठी' } },
        { code: '    try:', note: { en: 'this letter might be a bad one', mr: 'हे पत्र खराब असू शकतं' } },
        { code: "        price = int(row['modal_price'])", note: { en: 'read the PIN code; it might have a letter O in it', mr: 'PIN code वाचा; त्यात O अक्षर असू शकतं' } },
        { code: '    except ValueError:', note: { en: 'only this kind of problem goes to the tray', mr: 'फक्त या प्रकारची अडचण ट्रेमध्ये जाते' } },
        { code: "        rejects.append({'line': n, 'reason': 'not a number'})", note: { en: 'into the return tray, with the reason written on the slip', mr: 'चिठ्ठीवर कारण लिहून परतीच्या ट्रेमध्ये' } },
        { code: 'print(total == len(clean) + len(rejects))', note: { en: 'end of shift: letters in = sent + returned', mr: 'पाळी संपताना: आलेली पत्रं = पाठवलेली + परत केलेली' } },
      ],
      pitfall: { en: 'except: pass is the most dangerous line in a pipeline: the row disappears, nothing is counted, and the job looks green. Always count or quarantine what you skip. And keep try small: only the line that can fail, so a real bug elsewhere still shows up.', mr: 'except: pass ही pipeline मधली सगळ्यात धोकादायक ओळ: row गायब होते, काहीच मोजलं जात नाही, आणि job हिरवा दिसतो. जे वगळता ते नेहमी मोजा किंवा quarantine करा. आणि try छोटा ठेवा: फक्त fail होऊ शकणारी ओळ, म्हणजे दुसरीकडचा खरा bug तरीही दिसेल.' },
    },
    practice: {
      intro: { en: 'The Gremlin has been busy with the market files. Run your code, read the traceback or the output, then Submit. Hidden files carry different kinds of bad rows.', mr: 'Gremlin ने मंडीच्या files मध्ये बराच उद्योग केला आहे. code Run करा, traceback किंवा output वाचा, मग Submit. लपवलेल्या files मध्ये वेगवेगळ्या प्रकारच्या खराब rows आहेत.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'This is the morning job in miniature. Press Run and read the output and the error. What happened?', mr: 'हा सकाळचा job छोट्या स्वरूपात. Run दाबा आणि output आणि error वाचा. काय झालं?' },
          pythonSandbox: {
            code: `prices = ['2100', '1850', '21OO', '1990']
total = 0
for p in prices:
    total += int(p)
    print('added', p)
print('Total:', total)`,
          },
          options: [
            { en: 'It skipped \'21OO\' and printed Total: 5940', mr: 'त्याने \'21OO\' वगळलं आणि Total: 5940 print केलं' },
            { en: 'It treated \'21OO\' as 2100 and printed Total: 8040', mr: 'त्याने \'21OO\' ला 2100 मानलं आणि Total: 8040 print केलं' },
            { en: 'It added 2100 and 1850, then stopped with ValueError on \'21OO\'; 1990 and the total were never reached', mr: 'त्याने 2100 आणि 1850 जोडले, मग \'21OO\' वर ValueError ने थांबला; 1990 आणि total पर्यंत पोहोचलाच नाही' },
            { en: 'It printed nothing at all', mr: 'त्याने काहीच print केलं नाही' },
          ],
          correct: [2],
          explain: { en: 'An uncaught error stops the program at that line. Two rows were done, the bad one crashed it, and the good row after it was lost too. That is exactly why no market got its prices this morning.', mr: 'न पकडलेला error program ला त्याच ओळीवर थांबवतो. दोन rows झाल्या, खराब row ने crash केलं, आणि तिच्या नंतरची चांगली row सुद्धा गेली. आज सकाळी कोणत्याच मंडीला भाव न मिळण्याचं कारण नेमकं हेच.' },
          hints: [
            { en: 'Count the "added" lines in the output.', mr: 'output मधल्या "added" ओळी मोजा.' },
            { en: 'The traceback names the line and the value. Did "Total:" ever print?', mr: 'traceback ओळ आणि value सांगतो. "Total:" कधी print झालं का?' },
          ],
          successLine: { en: 'One bad row, everything after it lost. Now let\'s stop the dominoes.', mr: 'एक खराब row, तिच्या नंतरचं सगळं गेलं. आता dominoes थांबवू.' },
        },
        {
          kind: 'python',
          prompt: { en: 'This code crashes on the Nagpur file. Wrap the int() in try/except ValueError: count bad rows in bad_count, and only add good rows to good_count and total (an else: block is perfect for that). Then print Good rows, Bad rows and Average onion price (no decimals, the f-string is ready).', mr: 'हा code Nagpur file वर crash होतो. int() ला try/except ValueError मध्ये ठेवा: खराब rows bad_count मध्ये मोजा, आणि फक्त चांगल्या rows good_count आणि total मध्ये घाला (त्यासाठी else: block अगदी योग्य). मग Good rows, Bad rows आणि Average onion price print करा (दशांश नको, f-string तयार आहे).' },
          files: { 'data/nagpur.csv': NAGPUR_BAD_CSV },
          starter: `import csv

good_count = 0
bad_count = 0
total = 0
with open('data/nagpur.csv', newline='') as f:
    for row in csv.DictReader(f):
        price = int(row['modal_price'])
        good_count += 1
        total += price

print('Good rows:', good_count)
print('Bad rows:', bad_count)
print(f'Average onion price: {total / good_count:.0f}')
`,
          solution: `import csv

good_count = 0
bad_count = 0
total = 0
with open('data/nagpur.csv', newline='') as f:
    for row in csv.DictReader(f):
        try:
            price = int(row['modal_price'])
        except ValueError:
            bad_count += 1
        else:
            good_count += 1
            total += price

print('Good rows:', good_count)
print('Bad rows:', bad_count)
print(f'Average onion price: {total / good_count:.0f}')
`,
          output: ['Good rows: 5', 'Bad rows: 3', 'Average onion price: 2000'],
          checks: [
            { expr: `good_count == 5 and bad_count == 3 and total == 10000`, message: { en: 'Expected 5 good rows (total 10000) and 3 bad ones: \'21OO\', an empty cell and \'NA\'.', mr: '5 चांगल्या rows (total 10000) आणि 3 खराब अपेक्षित: \'21OO\', रिकामा cell आणि \'NA\'.' } },
          ],
          variants: [
            {
              label: { en: 'Different damage: \'₹2100\', \'2,100\' and \'-\'', mr: 'वेगळी नासधूस: \'₹2100\', \'2,100\' आणि \'-\'' },
              files: { 'data/nagpur.csv': `date,market,commodity,modal_price
2026-11-21,Nagpur,Onion,2200
2026-11-21,Kalamna,Onion,₹2100
2026-11-21,Kamptee,Onion,2250
2026-11-21,Hingna,Onion,"2,100"
2026-11-21,Umred,Onion,2300
2026-11-21,Saoner,Onion,-
2026-11-21,Ramtek,Onion,2150
` },
              output: ['Good rows: 4', 'Bad rows: 3', 'Average onion price: 2225'],
              checks: [
                { expr: `good_count == 4 and bad_count == 3`, message: { en: 'Any value int() cannot read must be counted as bad.', mr: 'int() ला वाचता न येणारी कोणतीही value खराब म्हणून मोजायला हवी.' } },
              ],
            },
            {
              label: { en: 'A clean day: no bad rows at all', mr: 'स्वच्छ दिवस: एकही खराब row नाही' },
              files: { 'data/nagpur.csv': `date,market,commodity,modal_price
2026-11-22,Nagpur,Onion,1800
2026-11-22,Kalamna,Onion,1900
2026-11-22,Katol,Onion,2000
` },
              output: ['Good rows: 3', 'Bad rows: 0', 'Average onion price: 1900'],
              checks: [
                { expr: `good_count == 3 and bad_count == 0`, message: { en: 'On a clean file every row is good.', mr: 'स्वच्छ file मध्ये प्रत्येक row चांगली.' } },
              ],
            },
          ],
          mustUse: [
            { pattern: 'try\\s*:', message: { en: 'Put the int() inside a try: block.', mr: 'int() ला try: block मध्ये ठेवा.' } },
            { pattern: 'except\\s+ValueError', message: { en: 'Catch exactly ValueError: that is the error int() raises on bad text.', mr: 'नेमका ValueError पकडा: खराब text वर int() तोच आणतो.' } },
          ],
          mustNotUse: [
            { pattern: 'except\\s*:', message: { en: 'A bare except: catches everything, even your own typos. Name the error: except ValueError:', mr: 'नुसता except: सगळंच पकडतो, तुमचे स्वतःचे typos सुद्धा. error चं नाव द्या: except ValueError:' } },
          ],
          hints: [
            { en: 'Only the int() line can fail. Put just that line under try:.', mr: 'फक्त int() ची ओळ fail होऊ शकते. फक्त तीच ओळ try: खाली ठेवा.' },
            { en: 'except ValueError: adds 1 to bad_count. else: (same indent as try) adds to good_count and total.', mr: 'except ValueError: bad_count मध्ये 1 घालतो. else: (try इतकाच indent) good_count आणि total मध्ये घालतो.' },
            { en: "        try:\n            price = int(row['modal_price'])\n        except ValueError:\n            bad_count += 1\n        else:\n            good_count += 1\n            total += price", mr: "        try:\n            price = int(row['modal_price'])\n        except ValueError:\n            bad_count += 1\n        else:\n            good_count += 1\n            total += price" },
          ],
          successLine: { en: 'Three bad rows counted, five good ones published. The morning survives.', mr: 'तीन खराब rows मोजल्या, पाच चांगल्या प्रसिद्ध. सकाळ वाचली.' },
        },
        {
          kind: 'python',
          prompt: { en: 'The API sometimes leaves modal_price out completely, which is a KeyError. This code only handles ValueError, so it crashes on Nashik. Add except KeyError that records the reason missing modal_price, and move the good-record append into an else: block. clean gets {\'market\', \'price\'} dicts, rejects gets {\'market\', \'reason\'} dicts.', mr: 'API कधी कधी modal_price पूर्णच वगळतो, म्हणजे KeyError. हा code फक्त ValueError हाताळतो, म्हणून Nashik वर crash होतो. missing modal_price हे कारण नोंदवणारा except KeyError जोडा, आणि चांगल्या record चा append else: block मध्ये न्या. clean मध्ये {\'market\', \'price\'} dicts, rejects मध्ये {\'market\', \'reason\'} dicts.' },
          files: { 'data/api_prices.json': API_RECORDS_JSON },
          starter: `import json

with open('data/api_prices.json', encoding='utf-8') as f:
    records = json.load(f)

clean = []
rejects = []
for rec in records:
    try:
        price = int(rec['modal_price'])
    except ValueError:
        rejects.append({'market': rec['market'], 'reason': 'bad price'})
    # TODO: except KeyError -> reason 'missing modal_price'
    # TODO: else -> clean.append({'market': ..., 'price': price})

print('Clean:', len(clean), 'Rejected:', len(rejects))
`,
          solution: `import json

with open('data/api_prices.json', encoding='utf-8') as f:
    records = json.load(f)

clean = []
rejects = []
for rec in records:
    try:
        price = int(rec['modal_price'])
    except ValueError:
        rejects.append({'market': rec['market'], 'reason': 'bad price'})
    except KeyError:
        rejects.append({'market': rec['market'], 'reason': 'missing modal_price'})
    else:
        clean.append({'market': rec['market'], 'price': price})

print('Clean:', len(clean), 'Rejected:', len(rejects))
`,
          output: ['Clean: 3 Rejected: 3'],
          checks: [
            { expr: `clean == [{'market': 'Pune', 'price': 2100}, {'market': 'Nagpur', 'price': 2000}, {'market': 'Solapur', 'price': 1980}]`, message: { en: 'clean should hold Pune, Nagpur and Solapur with their prices as numbers.', mr: 'clean मध्ये Pune, Nagpur आणि Solapur त्यांच्या भावांसह numbers म्हणून हवेत.' } },
            { expr: `rejects == [{'market': 'Nashik', 'reason': 'missing modal_price'}, {'market': 'Lasalgaon', 'reason': 'bad price'}, {'market': 'Akola', 'reason': 'bad price'}]`, message: { en: 'rejects should list Nashik (missing modal_price), Lasalgaon and Akola (bad price), in that order.', mr: 'rejects मध्ये Nashik (missing modal_price), Lasalgaon आणि Akola (bad price), याच क्रमाने हवेत.' } },
          ],
          variants: [
            {
              label: { en: 'Another response: an empty price, a missing key, and a key with the wrong name', mr: 'दुसरा response: रिकामा भाव, नसलेली key, आणि चुकीच्या नावाची key' },
              files: { 'data/api_prices.json': `[
  {"market": "Satara", "commodity": "Onion", "modal_price": "2050"},
  {"market": "Sangli", "commodity": "Onion", "modal_price": ""},
  {"market": "Karad", "commodity": "Onion"},
  {"market": "Wai", "commodity": "Onion", "price": "2000"},
  {"market": "Phaltan", "commodity": "Onion", "modal_price": "1990"}
]
` },
              output: ['Clean: 2 Rejected: 3'],
              checks: [
                { expr: `clean == [{'market': 'Satara', 'price': 2050}, {'market': 'Phaltan', 'price': 1990}]`, message: { en: 'Only Satara and Phaltan are clean in this response.', mr: 'या response मध्ये फक्त Satara आणि Phaltan स्वच्छ आहेत.' } },
                { expr: `rejects == [{'market': 'Sangli', 'reason': 'bad price'}, {'market': 'Karad', 'reason': 'missing modal_price'}, {'market': 'Wai', 'reason': 'missing modal_price'}]`, message: { en: 'An empty string is a bad price; a missing or misnamed key is missing modal_price.', mr: 'रिकामी string म्हणजे bad price; नसलेली किंवा चुकीच्या नावाची key म्हणजे missing modal_price.' } },
              ],
            },
          ],
          mustUse: [
            { pattern: 'except\\s+KeyError', message: { en: 'Add an except KeyError: block.', mr: 'except KeyError: block जोडा.' } },
            { pattern: 'else\\s*:', message: { en: 'Keep the good record in an else: block.', mr: 'चांगला record else: block मध्ये ठेवा.' } },
          ],
          hints: [
            { en: 'A try can have several except blocks, one per error type. Python runs the first one that matches.', mr: 'एका try ला अनेक except blocks असू शकतात, प्रत्येक error type साठी एक. जो पहिला जुळतो तो Python चालवतो.' },
            { en: 'After the except blocks, add else: at the same indent as try:. It runs only when int() worked, so price exists there.', mr: 'except blocks नंतर try: इतक्याच indent ला else: लिहा. तो int() चाललं तरच चालतो, म्हणून तिथे price असतो.' },
            { en: "    except KeyError:\n        rejects.append({'market': rec['market'], 'reason': 'missing modal_price'})\n    else:\n        clean.append({'market': rec['market'], 'price': price})", mr: "    except KeyError:\n        rejects.append({'market': rec['market'], 'reason': 'missing modal_price'})\n    else:\n        clean.append({'market': rec['market'], 'price': price})" },
          ],
          successLine: { en: 'Every reject comes with a reason. Someone can now call Nashik and ask for the missing field.', mr: 'प्रत्येक reject सोबत कारण. आता कोणीतरी Nashik ला फोन करून नसलेलं field मागू शकतं.' },
        },
        {
          kind: 'python',
          prompt: { en: 'This code silently drops bad rows with except ValueError: pass. Quarantine them instead: also write out/rejects.csv with the header line,market,modal_price,reason and one row per bad input row (line is the file line number, starting at 2 after the header; reason is not a number). Count them in bad, so the last line reconciles In with Good plus Rejected.', mr: 'हा code except ValueError: pass ने खराब rows गुपचूप टाकून देतो. त्याऐवजी त्या quarantine करा: out/rejects.csv सुद्धा लिहा, ज्यात line,market,modal_price,reason हा header आणि प्रत्येक खराब input row साठी एक row असेल (line म्हणजे file मधला ओळ क्रमांक, header नंतर 2 पासून; reason म्हणजे not a number). त्या bad मध्ये मोजा, म्हणजे शेवटची ओळ In = Good + Rejected हे जुळवेल.' },
          files: { 'data/nashik.csv': NASHIK_BAD_CSV },
          starter: `import csv
import os

os.makedirs('out', exist_ok=True)
total = good = bad = 0
with open('data/nashik.csv', newline='') as f:
    reader = csv.DictReader(f)
    with open('out/clean.csv', 'w', newline='') as c:
        clean_w = csv.DictWriter(c, fieldnames=reader.fieldnames)
        clean_w.writeheader()
        for line_no, row in enumerate(reader, start=2):
            total += 1
            try:
                int(row['modal_price'])
            except ValueError:
                pass  # the bad row just disappears...
            else:
                good += 1
                clean_w.writerow(row)

print('In:', total, 'Good:', good, 'Rejected:', bad)
`,
          solution: `import csv
import os

os.makedirs('out', exist_ok=True)
total = good = bad = 0
with open('data/nashik.csv', newline='') as f:
    reader = csv.DictReader(f)
    with open('out/clean.csv', 'w', newline='') as c, open('out/rejects.csv', 'w', newline='') as r:
        clean_w = csv.DictWriter(c, fieldnames=reader.fieldnames)
        clean_w.writeheader()
        reject_w = csv.writer(r)
        reject_w.writerow(['line', 'market', 'modal_price', 'reason'])
        for line_no, row in enumerate(reader, start=2):
            total += 1
            try:
                int(row['modal_price'])
            except ValueError:
                bad += 1
                reject_w.writerow([line_no, row['market'], row['modal_price'], 'not a number'])
            else:
                good += 1
                clean_w.writerow(row)

print('In:', total, 'Good:', good, 'Rejected:', bad)
`,
          output: ['In: 7 Good: 4 Rejected: 3'],
          checks: [
            { expr: `open('out/rejects.csv').read().splitlines() == ['line,market,modal_price,reason', '3,Nashik,13OO,not a number', '5,Nashik,,not a number', '7,Yeola,two thousand,not a number']`, message: { en: 'out/rejects.csv should have the header line,market,modal_price,reason and the three bad rows from file lines 3, 5 and 7.', mr: 'out/rejects.csv मध्ये line,market,modal_price,reason हा header आणि file च्या 3, 5 आणि 7 ओळींवरच्या तीन खराब rows हव्यात.' } },
            { expr: `len(open('out/clean.csv').read().splitlines()) == 5`, message: { en: 'out/clean.csv should still have the header and the 4 good rows.', mr: 'out/clean.csv मध्ये अजूनही header आणि 4 चांगल्या rows हव्यात.' } },
          ],
          variants: [
            {
              label: { en: 'Bad rows at the very start and the very end', mr: 'अगदी सुरुवातीला आणि अगदी शेवटी खराब rows' },
              files: { 'data/nashik.csv': `date,market,commodity,modal_price
2026-11-21,Nashik,Onion,N/A
2026-11-21,Pimpalgaon,Onion,2300
2026-11-21,Lasalgaon,Onion,2210
2026-11-21,Sinnar,Onion,2190
2026-11-21,Yeola,Onion,22OO
` },
              output: ['In: 5 Good: 3 Rejected: 2'],
              checks: [
                { expr: `open('out/rejects.csv').read().splitlines() == ['line,market,modal_price,reason', '2,Nashik,N/A,not a number', '6,Yeola,22OO,not a number']`, message: { en: 'The first data row is file line 2, so a bad first row is line 2.', mr: 'पहिली data row म्हणजे file ची ओळ 2, म्हणून खराब पहिली row म्हणजे ओळ 2.' } },
                { expr: `len(open('out/clean.csv').read().splitlines()) == 4`, message: { en: 'Header plus 3 good rows in out/clean.csv.', mr: 'out/clean.csv मध्ये header आणि 3 चांगल्या rows.' } },
              ],
            },
            {
              label: { en: 'A clean file: the rejects file still gets its header', mr: 'स्वच्छ file: rejects file ला तरीही header मिळतो' },
              files: { 'data/nashik.csv': `date,market,commodity,modal_price
2026-11-22,Nashik,Onion,2100
2026-11-22,Sinnar,Onion,2050
` },
              output: ['In: 2 Good: 2 Rejected: 0'],
              checks: [
                { expr: `open('out/rejects.csv').read().splitlines() == ['line,market,modal_price,reason']`, message: { en: 'With no bad rows, out/rejects.csv should hold only its header, so the next system sees an empty quarantine, not a missing file.', mr: 'खराब rows नसताना out/rejects.csv मध्ये फक्त header हवा, म्हणजे पुढच्या system ला file गायब नाही तर रिकामी quarantine दिसते.' } },
              ],
            },
          ],
          mustNotUse: [
            { pattern: 'except\\s+ValueError\\s*:\\s*pass', message: { en: 'except ValueError: pass is still there. Count and quarantine the row instead.', mr: 'except ValueError: pass अजून तिथेच आहे. त्याऐवजी row मोजा आणि quarantine करा.' } },
          ],
          hints: [
            { en: 'Open a second output file next to clean.csv: open(\'out/rejects.csv\', \'w\', newline=\'\'), make a csv.writer for it and write the header row right away.', mr: 'clean.csv च्या शेजारी दुसरी output file उघडा: open(\'out/rejects.csv\', \'w\', newline=\'\'), तिच्यासाठी csv.writer बनवा आणि लगेच header row लिहा.' },
            { en: 'In except ValueError:, replace pass with bad += 1 and a writerow with [line_no, row[\'market\'], row[\'modal_price\'], \'not a number\'].', mr: 'except ValueError: मध्ये pass ऐवजी bad += 1 आणि [line_no, row[\'market\'], row[\'modal_price\'], \'not a number\'] असा writerow लिहा.' },
            { en: "    with open('out/clean.csv', 'w', newline='') as c, open('out/rejects.csv', 'w', newline='') as r:\n        ...\n        reject_w = csv.writer(r)\n        reject_w.writerow(['line', 'market', 'modal_price', 'reason'])\n        ...\n            except ValueError:\n                bad += 1\n                reject_w.writerow([line_no, row['market'], row['modal_price'], 'not a number'])", mr: "    with open('out/clean.csv', 'w', newline='') as c, open('out/rejects.csv', 'w', newline='') as r:\n        ...\n        reject_w = csv.writer(r)\n        reject_w.writerow(['line', 'market', 'modal_price', 'reason'])\n        ...\n            except ValueError:\n                bad += 1\n                reject_w.writerow([line_no, row['market'], row['modal_price'], 'not a number'])" },
          ],
          successLine: { en: '7 in, 4 good, 3 quarantined with line numbers. The numbers reconcile, and nothing vanished.', mr: '7 आल्या, 4 चांगल्या, 3 ओळ क्रमांकांसह quarantine. आकडे जुळतात, आणि काहीच गायब झालं नाही.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Solapur sent a file whose price column is called price instead of modal_price. That is not one bad row: every row is unusable. In load_prices, check reader.fieldnames, and if modal_price is missing, raise ValueError with the message <path> is missing column modal_price. The rest of the pipeline (try, except, finally) is already written. Run the starter first and notice that finally still printed before the crash.', mr: 'सोलापूरने अशी file पाठवली जिच्या भावाच्या column चं नाव modal_price ऐवजी price आहे. ही एक खराब row नाही: प्रत्येक row निरुपयोगी आहे. load_prices मध्ये reader.fieldnames तपासा, आणि modal_price नसेल तर <path> is missing column modal_price या message सह ValueError raise करा. बाकीची pipeline (try, except, finally) आधीच लिहिलेली आहे. आधी starter Run करा आणि पाहा की crash आधी finally ने तरीही print केलं.' },
          files: { 'data/pune.csv': PUNE_SMALL_CSV, 'data/solapur.csv': SOLAPUR_NOCOL_CSV },
          starter: LOADER_STARTER,
          solution: LOADER_SOLUTION,
          output: ['data/pune.csv [2100, 1400, 1850]', 'Pipeline stopped: data/solapur.csv is missing column modal_price', 'Run finished'],
          checks: [
            { expr: `callable(load_prices) and load_prices('data/pune.csv') == [2100, 1400, 1850]`, message: { en: 'load_prices(\'data/pune.csv\') should still return [2100, 1400, 1850].', mr: 'load_prices(\'data/pune.csv\') ने अजूनही [2100, 1400, 1850] परत करायला हवं.' } },
          ],
          variants: [
            {
              label: { en: 'Another day: new Pune prices, and Solapur calls the column Modal Price', mr: 'दुसरा दिवस: पुण्याचे नवे भाव, आणि सोलापूर column ला Modal Price म्हणतं' },
              files: {
                'data/pune.csv': `date,market,commodity,modal_price
2026-11-21,Pune,Onion,2240
2026-11-21,Pune,Garlic,9100
`,
                'data/solapur.csv': `date,market,commodity,Modal Price
2026-11-21,Solapur,Onion,1900
`,
              },
              output: ['data/pune.csv [2240, 9100]', 'Pipeline stopped: data/solapur.csv is missing column modal_price', 'Run finished'],
              checks: [
                { expr: `load_prices('data/pune.csv') == [2240, 9100]`, message: { en: 'load_prices must read the prices from the file it is given.', mr: 'load_prices ने दिलेल्या file मधूनच भाव वाचायला हवेत.' } },
              ],
            },
          ],
          mustUse: [
            { pattern: 'raise\\s+ValueError', message: { en: 'Stop the pipeline with raise ValueError(...).', mr: 'raise ValueError(...) ने pipeline थांबवा.' } },
            { pattern: 'fieldnames', message: { en: 'Check the columns with reader.fieldnames.', mr: 'columns reader.fieldnames ने तपासा.' } },
          ],
          hints: [
            { en: 'reader.fieldnames is the header as a list, like [\'date\', \'market\', \'commodity\', \'price\']. Use not in to test it.', mr: 'reader.fieldnames म्हणजे header ची list, उदा. [\'date\', \'market\', \'commodity\', \'price\']. not in ने तपासा.' },
            { en: 'Put the check before the return line, and build the message with an f-string so it names the file: f\'{path} is missing column modal_price\'.', mr: 'तपासणी return च्या ओळीआधी ठेवा, आणि message f-string ने बनवा म्हणजे त्यात file चं नाव येईल: f\'{path} is missing column modal_price\'.' },
            { en: "        if 'modal_price' not in reader.fieldnames:\n            raise ValueError(f'{path} is missing column modal_price')", mr: "        if 'modal_price' not in reader.fieldnames:\n            raise ValueError(f'{path} is missing column modal_price')" },
          ],
          successLine: { en: 'Forgive a bad row, stop on a broken file, and say exactly why. The Gremlin hates a loud, clear error.', mr: 'खराब row ला माफ करा, तुटलेल्या file वर थांबा, आणि नेमकं का ते सांगा. मोठा, स्पष्ट error Gremlin ला अजिबात आवडत नाही.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Only data/pune.csv exists. What are the last two lines this prints?', mr: 'फक्त data/pune.csv आहे. हे शेवटच्या दोन ओळी काय print करतं?' },
        code: `for path in ['data/pune.csv', 'data/sangli.csv']:
    try:
        f = open(path)
    except FileNotFoundError:
        print('missing', path)
    else:
        print('opened', path)
        f.close()
    finally:
        print('checked', path)`,
        options: [
          { en: 'opened data/sangli.csv, then checked data/sangli.csv', mr: 'opened data/sangli.csv, मग checked data/sangli.csv' },
          { en: 'checked data/pune.csv, then missing data/sangli.csv (finally is skipped after an error)', mr: 'checked data/pune.csv, मग missing data/sangli.csv (error नंतर finally वगळला जातो)' },
          { en: 'A FileNotFoundError traceback', mr: 'FileNotFoundError चा traceback' },
          { en: 'missing data/sangli.csv, then checked data/sangli.csv', mr: 'missing data/sangli.csv, मग checked data/sangli.csv' },
        ],
        answer: 3,
        explain: { en: 'The error is caught, so except prints "missing", else is skipped (there was an error), and finally runs every time, so "checked" comes last.', mr: 'error पकडला जातो, म्हणून except "missing" print करतो, else वगळला जातो (error आला होता), आणि finally प्रत्येक वेळी चालतो, म्हणून "checked" शेवटी येतं.' },
      },
      {
        q: { en: 'Why is except ValueError: better than a bare except: around int(row[\'modal_price\'])?', mr: 'int(row[\'modal_price\']) भोवती नुसत्या except: पेक्षा except ValueError: चांगला का?' },
        options: [
          { en: 'It runs faster', mr: 'तो जास्त वेगाने चालतो' },
          { en: 'A bare except also hides real bugs, like a typo that raises NameError, so the job looks green while it is broken', mr: 'नुसता except खरे bugs सुद्धा लपवतो, जसा NameError आणणारा typo, त्यामुळे job तुटलेला असूनही हिरवा दिसतो' },
          { en: 'A bare except is not valid Python', mr: 'नुसता except valid Python नाही' },
          { en: 'ValueError also fixes the bad value automatically', mr: 'ValueError खराब value आपोआप दुरुस्त सुद्धा करतो' },
        ],
        answer: 1,
        explain: { en: 'Catch what you expect and let everything else crash loudly. A tester knows: a hidden failure is worse than a visible one.', mr: 'जे अपेक्षित आहे तेच पकडा आणि बाकी सगळं मोठ्याने crash होऊ द्या. tester ला माहीत असतं: लपलेलं failure दिसणाऱ्यापेक्षा वाईट.' },
      },
      {
        q: { en: 'A market file arrives without the modal_price column at all. What should the pipeline do?', mr: 'एका मंडीची file modal_price column शिवायच येते. pipeline ने काय करावं?' },
        options: [
          { en: 'Skip every row as a bad row and publish an empty price list', mr: 'प्रत्येक row खराब म्हणून वगळावी आणि रिकामी भावयादी प्रसिद्ध करावी' },
          { en: 'Use 0 as the price for every row', mr: 'प्रत्येक row साठी भाव 0 वापरावा' },
          { en: 'Raise an error with a clear message naming the file and the missing column, and stop', mr: 'file आणि नसलेल्या column चं नाव सांगणाऱ्या स्पष्ट message सह error raise करून थांबावं' },
          { en: 'Guess the column from its position', mr: 'जागेवरून column चा अंदाज लावावा' },
        ],
        answer: 2,
        explain: { en: 'A missing column breaks the whole file, so fail loudly with a message that says what to fix. Skipping single bad rows is right; skipping a whole broken file silently is not.', mr: 'column नसणं पूर्ण file तोडतं, म्हणून काय दुरुस्त करायचं ते सांगणाऱ्या message सह मोठ्याने fail व्हा. एकट्या खराब rows वगळणं बरोबर; अख्खी तुटलेली file गुपचूप वगळणं चूक.' },
      },
      {
        q: { en: 'A run reports: 1000 rows in, 960 written to clean.csv, 25 written to rejects.csv. What does this tell you?', mr: 'एक run सांगतो: 1000 rows आल्या, 960 clean.csv मध्ये लिहिल्या, 25 rejects.csv मध्ये लिहिल्या. यावरून काय कळतं?' },
        options: [
          { en: '15 rows leaked somewhere without being counted. Find out where before trusting the output', mr: '15 rows न मोजता कुठेतरी गळल्या. output वर विश्वास ठेवण्याआधी कुठे ते शोधा' },
          { en: 'Everything is fine: most rows are clean', mr: 'सगळं ठीक आहे: बहुतेक rows स्वच्छ आहेत' },
          { en: 'The rejects file is too big', mr: 'rejects file खूप मोठी आहे' },
          { en: 'The clean file has duplicates', mr: 'clean file मध्ये duplicates आहेत' },
        ],
        answer: 0,
        explain: { en: '960 + 25 = 985, not 1000. Rows in must equal good plus rejected. A gap like this usually means an except: pass is hiding somewhere.', mr: '960 + 25 = 985, 1000 नाही. आलेल्या rows = चांगल्या + नाकारलेल्या हवं. असा फरक म्हणजे बहुतेक कुठेतरी except: pass लपलेला असतो.' },
      },
    ],
    recap: { line: { en: 'try/except for the exact error, quarantine bad rows with a reason, reconcile the counts, and raise loudly when a whole file is broken.', mr: 'नेमक्या error साठी try/except, खराब rows कारणासह quarantine, counts जुळवा, आणि अख्खी file तुटलेली असेल तर मोठ्याने raise करा.' }, icon: '🧯' },
  },
]
