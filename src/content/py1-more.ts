import type { Lesson } from './types.ts'

// Python 1 (ChaiCart), second half: dictionaries, functions you can trust, and the boss "The Messy Order Book".

// ───────── Y1.4 data: Sam's order book as a tiny CSV (read with ready-made lines, the csv module comes in Python 2)
const ORDERS = `order_id,customer,item,qty,price
C101,Ravi,Masala Chai,2,30
C102,Priya,Cutting Chai,3,15
C103,Anita,Masala Chai,1,30
C104,Rohan,Bun Maska,2,40
C105,Sneha,Cutting Chai,2,15
C106,Kabir,Masala Chai,4,30
C107,Meena,Ginger Chai,1,35`

const ORDERS_SAT = `order_id,customer,item,qty,price
C201,Om,Elaichi Chai,2,25
C202,Ravi,Masala Chai,5,30
C203,Isha,Elaichi Chai,1,25
C204,Priya,Masala Chai,1,30
C205,Dev,Poha,3,40`

const ORDERS_QUIET = `order_id,customer,item,qty,price
C301,Sam,Cutting Chai,1,15
C302,Theo,Cutting Chai,2,15`

const READER = `# Ready-made lines: read the order book into a list of dicts.
# (Python 2 teaches files properly. For now, just use orders.)
orders = []
for line in open('data/orders.csv').read().splitlines()[1:]:
    order_id, customer, item, qty, price = line.split(',')
    orders.append({'id': order_id, 'customer': customer, 'item': item, 'qty': int(qty), 'price': int(price)})
`

const SAT = { en: 'Saturday rush: new items, different orders', mr: 'शनिवारची गर्दी: नवे पदार्थ, वेगळ्या ऑर्डर्स' }
const QUIET = { en: 'A quiet Monday: only two small orders', mr: 'शांत सोमवार: फक्त दोन छोट्या ऑर्डर्स' }

// ───────── Y1.6 boss data: the messy order book, with the Gremlin's bad rows
const MESSY = `order_id,customer,item,qty,price
C201,Ravi,Masala Chai,2,30
C202,priya , cutting chai,1,15
C203,Anita,Masala Chai,,30
C204,Rohan,Ginger Chai,3,forty
C205,Sneha,Bun Maska,2,₹40
C202,priya , cutting chai,1,15
C206,Kabir,Cutting Chai,0,15
C207,Meena,  masala   chai ,1,30
C208,Ravi,Bun Maska,1,40
C209,Om,Ginger Chai,2,35`

const SUNDAY = `order_id,customer,item,qty,price
D301,Isha,Elaichi Chai,2,25
D302,Dev, poha ,1,₹40

D303,Om,,2,30
D304,Isha,Elaichi Chai,two,25
D305,Kabir,Masala Chai,3,30
D301,Isha,Elaichi Chai,2,25
D306,Neha,masala chai,1,0

`

const CLEAN_DAY = `order_id,customer,item,qty,price
E401,Sam,Cutting Chai,4,15
E402,Theo,Cutting Chai,2,15
E403,Rex,Bun Maska,1,40`

const GREMLIN_DAY = `order_id,customer,item,qty,price
F501,gremlin,Masala Chai,,30
F502,gremlin,Masala Chai,1,free
F503,gremlin,,1,30`

const SUN = { en: 'Sunday: blank lines, a missing item, "two" as qty, a duplicate, price 0', mr: 'रविवार: रिकाम्या ओळी, item गायब, qty "two", duplicate, price 0' }
const CLEAN = { en: 'A clean day: nothing to skip', mr: 'स्वच्छ दिवस: काहीच skip करायचं नाही' }
const GREM = { en: 'The Gremlin\'s day: every row is bad', mr: 'Gremlin चा दिवस: प्रत्येक row खराब' }

const READ_ROWS = `def read_rows(path):
    """Read a small CSV with plain string split. Returns a list of dicts (all values are text)."""
    lines = open(path).read().splitlines()
    header = lines[0].split(',')
    rows = []
    for line in lines[1:]:
        if line.strip() == '':
            continue
        parts = line.split(',')
        row = {}
        for i in range(len(header)):
            row[header[i]] = parts[i]
        rows.append(row)
    return rows
`

const HELPERS = `def clean_name(raw):
    """'  priya ' -> 'Priya'."""
    return raw.strip().title()

def parse_amount(text, default=None):
    """'₹40' -> 40, '1,250' -> 1250. Blank or text -> default."""
    text = text.replace('₹', '').replace(',', '').strip()
    if not text.isdigit():
        return default
    return int(text)
`

const CLEAN_ORDER = `def clean_item(raw):
    """'  masala   chai ' -> 'Masala Chai' (extra spaces squeezed)."""
    return ' '.join(raw.split()).title()

def clean_order(row):
    """One raw row (all text) -> one clean order dict."""
    return {
        'order_id': row['order_id'].strip(),
        'customer': clean_name(row['customer']),
        'item': clean_item(row['item']),
        'qty': parse_amount(row['qty']),
        'price': parse_amount(row['price']),
    }
`

const FIND_PROBLEM = `def find_problem(order, seen_ids):
    """Return why an order is bad, or None when it is fine."""
    if order['order_id'] in seen_ids:
        return 'duplicate id'
    if order['item'] == '':
        return 'missing item'
    if order['qty'] is None or order['qty'] <= 0:
        return 'bad qty'
    if order['price'] is None or order['price'] <= 0:
        return 'bad price'
    return None
`

const SPLIT_LOOP = `rows = read_rows('data/orders.csv')
good_orders = []
seen_ids = []
skipped = 0
reasons = {}
for row in rows:
    order = clean_order(row)
    reason = find_problem(order, seen_ids)
    if reason is None:
        good_orders.append(order)
        seen_ids.append(order['order_id'])
    else:
        skipped = skipped + 1
        reasons[reason] = reasons.get(reason, 0) + 1
`

const GOOD_ORDER = "{'order_id': 'C201', 'customer': 'Ravi', 'item': 'Masala Chai', 'qty': 2, 'price': 30}"

export const py1MoreLessons: Lesson[] = [
  // ───────────────────────── Y1.4 Dictionaries
  {
    id: 'py1-4',
    code: 'Y1.4',
    level: 'basic',
    title: { en: 'Dictionaries: records and counts', mr: 'Dictionaries: नोंदी आणि मोजणी' },
    skill: 'dict records, .get, list of dicts, counting and totals per key',
    realLife: {
      place: 'fair',
      title: { en: 'The Ganpati prasad slips', mr: 'गणपतीच्या प्रसादाच्या चिठ्ठ्या' },
      story: {
        en: 'At Meera\'s society Ganpati, every flat sends a slip for prasad: "Flat B-12, modak, 3". Each slip is one small record with labels: flat, sweet, count. On the last evening, Meera\'s cousin Tanvi has a pile of 60 slips and one question from the committee: how many of each sweet? She does not reread the pile once per sweet. She draws three boxes on a page, modak, laddoo, pedha, and goes through the slips once. Each slip adds its count to its own box. If a box does not exist yet, she starts it at zero. One pass, three totals, and they add up to the pile.',
        mr: 'मीराच्या सोसायटीच्या गणपतीत प्रत्येक flat प्रसादासाठी एक चिठ्ठी पाठवतो: "Flat B-12, मोदक, 3". प्रत्येक चिठ्ठी म्हणजे लेबल असलेली एक छोटी नोंद: flat, गोड पदार्थ, संख्या. शेवटच्या संध्याकाळी मीराची चुलत बहीण तन्वीकडे 60 चिठ्ठ्यांचा ढीग असतो आणि समितीचा एकच प्रश्न: प्रत्येक पदार्थ किती? ती प्रत्येक पदार्थासाठी ढीग पुन्हा पुन्हा वाचत नाही. ती पानावर तीन खोकी काढते, मोदक, लाडू, पेढा, आणि चिठ्ठ्या एकदाच पाहते. प्रत्येक चिठ्ठी आपली संख्या आपल्या खोक्यात टाकते. खोकं अजून नसेल तर ती ते शून्यापासून सुरू करते. एकच फेरी, तीन बेरजा, आणि त्या ढिगाशी जुळतात.',
      },
      scene: {
        type: 'group',
        groups: [
          { icon: '🥟', label: 'Modak', mr: 'मोदक' },
          { icon: '🟠', label: 'Laddoo', mr: 'लाडू' },
          { icon: '🟤', label: 'Pedha', mr: 'पेढा' },
        ],
        items: [0, 1, 0, 2, 0, 1, 2, 0, 1].map((group) => ({ icon: '🧾', group })),
        note: { en: 'One pass over the slips; each slip adds to its own box (a dict of counts)', mr: 'चिठ्ठ्यांवर एकच फेरी; प्रत्येक चिठ्ठी आपल्या खोक्यात भर घालते (counts ची dict)' },
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Simple question: how many masala chai did we sell yesterday? I counted three times and got 41, 44 and 39.', mr: 'साधा प्रश्न: काल आपण किती मसाला चहा विकले? मी तीनदा मोजले आणि 41, 44 आणि 39 आले.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'Each line in the notebook is a record: id, customer, item, qty, price. In code we keep it as a dictionary, with a name for every field.', mr: 'वहीतली प्रत्येक ओळ म्हणजे एक record: id, customer, item, qty, price. code मध्ये आपण ती dictionary म्हणून ठेवतो, प्रत्येक field ला नाव देऊन.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> counting by hand. my favourite. one skipped line and nobody ever knows. ⌁', mr: '>> हाताने मोजणी. माझी आवडती. एक ओळ सुटली तरी कोणालाच कधी कळत नाही. ⌁' } },
        { who: 'rex', mood: 'happy', text: { en: 'A list of dicts is a table, {name}, one dict per row. And a dict of counts is your GROUP BY. One pass, every total.', mr: 'dicts ची list म्हणजे table, {name}, प्रत्येक row साठी एक dict. आणि counts ची dict म्हणजे तुझं GROUP BY. एकच फेरी, सगळ्या बेरजा.' } },
      ],
      problem: { en: 'ChaiCart counts sales by rereading the notebook once per item, by hand. Every count comes out different, and nobody can say which one is right.', mr: 'ChaiCart प्रत्येक पदार्थासाठी वही हाताने पुन्हा वाचून विक्री मोजतं. प्रत्येक वेळी वेगळा आकडा येतो, आणि कोणता बरोबर ते कोणीच सांगू शकत नाही.' },
      solution: { en: 'Store each order as a dict, keep all orders in a list, and count with a dict in one loop: counts[item] = counts.get(item, 0) + qty. The totals always add up to the orders.', mr: 'प्रत्येक ऑर्डर dict म्हणून ठेवा, सगळ्या ऑर्डर्स एका list मध्ये, आणि एकाच loop मध्ये dict ने मोजा: counts[item] = counts.get(item, 0) + qty. बेरजा नेहमी ऑर्डर्सशी जुळतात.' },
    },
    lesson: [
      { en: 'A dictionary (dict) stores values under names called keys: order = {\'item\': \'Masala Chai\', \'qty\': 2}. You read a value with its key, order[\'qty\'], and change or add one the same way: order[\'qty\'] = 3. It is one row with column names, like the prasad slip with its labels.', mr: 'dictionary (dict) values ना keys नावाच्या नावांखाली ठेवते: order = {\'item\': \'Masala Chai\', \'qty\': 2}. value त्याच्या key ने वाचतात, order[\'qty\'], आणि त्याच पद्धतीने बदलतात किंवा नवी जोडतात: order[\'qty\'] = 3. column च्या नावांसह ही एक row आहे, लेबल असलेल्या प्रसादाच्या चिठ्ठीसारखी.' },
      { en: 'Asking for a key that is not there gives a KeyError and the program stops. Real data has gaps, so use order.get(\'note\', \'\'): it gives the value if the key exists and your default if it does not. \'note\' in order tells you True or False. order.keys(), order.values() and order.items() give the keys, the values, and both together for a for loop.', mr: 'नसलेली key मागितली की KeyError येतो आणि program थांबतो. खऱ्या data मध्ये गॅप्स असतात, म्हणून order.get(\'note\', \'\') वापरा: key असेल तर value देतो, नसेल तर तुमचा default. \'note\' in order हे True किंवा False सांगतं. order.keys(), order.values() आणि order.items() for loop साठी keys, values आणि दोन्ही एकत्र देतात.' },
      { en: 'A list of dicts is a table: each dict is one row, each key a column. for o in orders: if o[\'qty\'] >= 3: ... is your SELECT ... WHERE qty >= 3, written by hand. This is exactly what pandas does underneath; pandas comes later, here you learn the engine.', mr: 'dicts ची list म्हणजे table: प्रत्येक dict एक row, प्रत्येक key एक column. for o in orders: if o[\'qty\'] >= 3: ... हे तुमचं SELECT ... WHERE qty >= 3, हाताने लिहिलेलं. pandas आतून नेमकं हेच करतो; pandas नंतर येईल, इथे तुम्ही आतलं engine शिकता.' },
      { en: 'Counting with a dict: start with counts = {}, and for every row do counts[item] = counts.get(item, 0) + qty. The first time an item appears, .get gives 0; after that it gives the running total. That is GROUP BY item with SUM(qty). Add qty * price instead and you get revenue per item. The data engineer\'s habit: check that the totals add up to the whole.', mr: 'dict ने मोजणी: counts = {} ने सुरुवात करा, आणि प्रत्येक row साठी counts[item] = counts.get(item, 0) + qty. एखादा item पहिल्यांदा आला की .get 0 देतो; नंतर चालू बेरीज देतो. हे म्हणजे GROUP BY item सह SUM(qty). qty * price जोडलं तर प्रत्येक item ची कमाई मिळते. data engineer ची सवय: बेरजा एकूण आकड्याशी जुळतात का ते तपासा.' },
    ],
    syntax: {
      template: `order = {'id': 'C101', 'item': 'Masala Chai', 'qty': 2, 'price': 30}
print(order['item'])               # read by key
order['qty'] = 3                   # change (or add) a key
print(order.get('note', 'none'))   # safe read with a default

counts = {}
for o in orders:                   # orders: a list of dicts (rows)
    counts[o['item']] = counts.get(o['item'], 0) + o['qty']
for item, cups in counts.items():
    print(f"{item}: {cups}")`,
      parts: [
        { code: "{'key': value, ...}", means: { en: 'a dict: values stored under names (keys)', mr: 'dict: नावांखाली (keys) ठेवलेल्या values' } },
        { code: "order['qty']", means: { en: 'the value for that key; KeyError if the key is missing', mr: 'त्या key ची value; key नसेल तर KeyError' } },
        { code: "order.get('note', 'none')", means: { en: 'the value, or the default when the key is missing (no crash)', mr: 'value, किंवा key नसेल तर default (crash नाही)' } },
        { code: 'counts.get(k, 0) + 1', means: { en: 'the counting trick: start at 0 the first time, then keep adding', mr: 'मोजणीची युक्ती: पहिल्यांदा 0 पासून, मग भर घालत राहा' } },
        { code: 'for k, v in d.items():', means: { en: 'loop over every key and its value together', mr: 'प्रत्येक key आणि तिची value एकत्र loop करा' } },
      ],
      example: [
        { code: "slip = {'flat': 'B-12', 'sweet': 'modak', 'count': 3}", note: { en: 'one prasad slip as a record', mr: 'एक प्रसादाची चिठ्ठी, एक record म्हणून' } },
        { code: "print(slip['sweet'])", note: { en: 'prints modak', mr: 'modak print करतो' } },
        { code: "print(slip.get('note', 'no note'))", note: { en: 'the slip has no note, so it prints the default: no note', mr: 'चिठ्ठीवर note नाही, म्हणून default print होतं: no note' } },
        { code: 'boxes = {}', note: { en: 'Tanvi\'s empty page, before she draws any box', mr: 'तन्वीचं रिकामं पान, एकही खोकं काढण्याआधी' } },
        { code: "boxes[slip['sweet']] = boxes.get(slip['sweet'], 0) + slip['count']", note: { en: 'a new box starts at 0, then gets this slip\'s count: {\'modak\': 3}', mr: 'नवं खोकं 0 पासून सुरू होतं, मग या चिठ्ठीची संख्या मिळते: {\'modak\': 3}' } },
      ],
      pitfall: { en: 'counts[item] = counts[item] + qty crashes with a KeyError the first time an item appears, because the box does not exist yet. Use counts.get(item, 0). And keys are exact: \'Masala Chai\' and \'masala chai \' are two different boxes (cleaning comes in Y1.5).', mr: 'counts[item] = counts[item] + qty हे item पहिल्यांदा येतो तेव्हा KeyError ने crash होतं, कारण खोकं अजून अस्तित्वातच नाही. counts.get(item, 0) वापरा. आणि keys अगदी अचूक असतात: \'Masala Chai\' आणि \'masala chai \' ही दोन वेगळी खोकी आहेत (cleaning Y1.5 मध्ये).' },
    },
    practice: {
      intro: { en: 'Sam\'s notebook, one dict at a time. Data files appear above the editor. Press Run to try, Submit to check. Your code is also run on hidden days with different orders, so let the data decide the answer.', mr: 'Sam ची वही, एका वेळी एक dict. data files editor वर दिसतात. पाहायला Run, तपासायला Submit. तुमचा code वेगळ्या ऑर्डर्स असलेल्या लपवलेल्या दिवसांवरही चालवला जातो, म्हणून उत्तर data ला ठरवू द्या.' },
      steps: [
        {
          kind: 'python',
          prompt: {
            en: 'Sam\'s notebook line says: C104, Priya, Masala Chai, 2 cups, ₹30 each. Add the keys \'item\', \'qty\' and \'price\' to the order dict so the print line works (press Run first and read the KeyError). Then Priya calls back for one more cup: change order[\'qty\'] to 3 and print the same line again.',
            mr: 'Sam च्या वहीत ओळ आहे: C104, Priya, Masala Chai, 2 कप, प्रत्येकी ₹30. order dict मध्ये \'item\', \'qty\' आणि \'price\' या keys जोडा म्हणजे print ची ओळ चालेल (आधी Run दाबा आणि KeyError वाचा). मग प्रियाचा पुन्हा फोन येतो, अजून एक कप हवा: order[\'qty\'] 3 करा आणि तीच ओळ पुन्हा print करा.',
          },
          starter: `# Sam's notebook line: C104, Priya, Masala Chai, 2 cups, ₹30 each
order = {'id': 'C104', 'customer': 'Priya'}
# TODO: add the keys 'item', 'qty' and 'price' to the dict above

print(f"{order['customer']}: {order['qty']} x {order['item']} = ₹{order['qty'] * order['price']}")
# TODO: Priya wants one more cup. Change qty to 3, then print the same line again.
`,
          solution: `order = {'id': 'C104', 'customer': 'Priya', 'item': 'Masala Chai', 'qty': 2, 'price': 30}

print(f"{order['customer']}: {order['qty']} x {order['item']} = ₹{order['qty'] * order['price']}")
order['qty'] = 3
print(f"{order['customer']}: {order['qty']} x {order['item']} = ₹{order['qty'] * order['price']}")
`,
          output: ['Priya: 2 x Masala Chai = ₹60', 'Priya: 3 x Masala Chai = ₹90'],
          checks: [
            { expr: "set(order) == {'id', 'customer', 'item', 'qty', 'price'}", message: { en: 'The order dict should have exactly these keys: id, customer, item, qty, price.', mr: 'order dict मध्ये नेमक्या याच keys हव्यात: id, customer, item, qty, price.' } },
            { expr: "order['qty'] == 3 and order['price'] == 30", message: { en: 'At the end, order[\'qty\'] should be 3 (Priya\'s extra cup) and the price still 30.', mr: 'शेवटी order[\'qty\'] 3 हवी (प्रियाचा जास्तीचा कप) आणि price अजूनही 30.' } },
          ],
          mustUse: [{ pattern: "order\\[\\s*['\"]qty['\"]\\s*\\]\\s*=[^=]", message: { en: 'Change the quantity inside the dict with order[\'qty\'] = 3.', mr: 'dict मधली quantity order[\'qty\'] = 3 ने बदला.' } }],
          mustNotUse: [{ pattern: "print\\(\\s*f?['\"]Priya", message: { en: 'Do not type the answer into print. Let the f-string read the values from the dict.', mr: 'उत्तर print मध्ये टाइप करू नका. f-string ला dict मधून values वाचू द्या.' } }],
          hints: [
            { en: 'A dict is written as {\'key\': value, ...}. Text values need quotes, numbers do not.', mr: 'dict असं लिहितात: {\'key\': value, ...}. text values ना quotes लागतात, numbers ना नाही.' },
            { en: "order = {'id': 'C104', 'customer': 'Priya', 'item': 'Masala Chai', 'qty': 2, 'price': 30}", mr: "order = {'id': 'C104', 'customer': 'Priya', 'item': 'Masala Chai', 'qty': 2, 'price': 30}" },
            { en: 'After the first print, add order[\'qty\'] = 3 and then copy the same print line below it.', mr: 'पहिल्या print नंतर order[\'qty\'] = 3 लिहा आणि मग तीच print ची ओळ खाली पुन्हा लिहा.' },
          ],
          successLine: { en: 'One order, one dict. Change a field and every line that reads it follows.', mr: 'एक ऑर्डर, एक dict. एक field बदला आणि ती वाचणारी प्रत्येक ओळ सोबत बदलते.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Some orders in the notebook have a note ("less sugar"), most do not. Press Run on this code and read the output panel. What happens?', mr: 'वहीतल्या काही ऑर्डर्सवर note असते ("साखर कमी"), बहुतेकांवर नसते. हा code Run करा आणि output panel वाचा. काय होतं?' },
          pythonSandbox: {
            code: `order = {'id': 'C104', 'customer': 'Priya', 'item': 'Masala Chai', 'qty': 2}
print(order.get('note', 'no note'))
print(order.get('qty', 0))
print(order['note'])`,
          },
          options: [
            { en: 'It prints "no note" and 2, then stops with KeyError: \'note\' on the last line', mr: '"no note" आणि 2 print करतो, मग शेवटच्या ओळीवर KeyError: \'note\' ने थांबतो' },
            { en: 'It prints None, 2 and None', mr: 'None, 2 आणि None print करतो' },
            { en: 'It prints "no note", 0 and then a KeyError', mr: '"no note", 0 आणि मग KeyError' },
            { en: 'It stops with a KeyError on the very first print', mr: 'पहिल्याच print वर KeyError ने थांबतो' },
          ],
          correct: [0],
          explain: { en: '.get returns the default only when the key is missing: \'note\' is missing (no note), \'qty\' exists (2, the default 0 is ignored). The square brackets on a missing key raise KeyError. When a field may be absent in real data, read it with .get.', mr: '.get फक्त key नसेल तेव्हाच default देतो: \'note\' नाही (no note), \'qty\' आहे (2, default 0 दुर्लक्षित). नसलेल्या key वर चौकोनी कंस KeyError देतो. खऱ्या data मध्ये field नसू शकत असेल तर ती .get ने वाचा.' },
          hints: [
            { en: 'Look at which keys the dict really has. Is there a \'note\'? Is there a \'qty\'?', mr: 'dict मध्ये खरोखर कोणत्या keys आहेत ते पाहा. \'note\' आहे का? \'qty\' आहे का?' },
            { en: 'The default in .get is used only when the key is missing. The last line has no default at all.', mr: '.get मधला default फक्त key नसेल तेव्हाच वापरला जातो. शेवटच्या ओळीत default नाहीच.' },
          ],
          successLine: { en: 'Brackets when the key must be there, .get when it may be missing.', mr: 'key असायलाच हवी तेव्हा कंस, नसू शकते तेव्हा .get.' },
        },
        {
          kind: 'python',
          prompt: {
            en: 'The ready-made lines turn data/orders.csv into orders, a list of dicts (one per row, like SQL rows). The delivery boy needs the big orders, with qty 3 or more. Put their ids in the list big, in notebook order, and print each one like: C102 Priya: 3 x Cutting Chai. The last line already prints the count.',
            mr: 'तयार ओळी data/orders.csv ला orders मध्ये बदलतात, dicts ची list (प्रत्येक row साठी एक, SQL rows सारखी). डिलिव्हरी करणाऱ्या मुलाला मोठ्या ऑर्डर्स हव्यात, qty 3 किंवा जास्त. त्यांचे ids list big मध्ये वहीच्या क्रमाने टाका, आणि प्रत्येक अशी print करा: C102 Priya: 3 x Cutting Chai. शेवटची ओळ count आधीच print करते.',
          },
          files: { 'data/orders.csv': ORDERS },
          starter: `${READER}
# TODO: like SELECT id FROM orders WHERE qty >= 3
#       append each big order's id to big, and print: C102 Priya: 3 x Cutting Chai
big = []

print(f"Big orders: {len(big)}")
`,
          solution: `${READER}
big = []
for o in orders:
    if o['qty'] >= 3:
        big.append(o['id'])
        print(f"{o['id']} {o['customer']}: {o['qty']} x {o['item']}")

print(f"Big orders: {len(big)}")
`,
          output: ['C102 Priya: 3 x Cutting Chai', 'C106 Kabir: 4 x Masala Chai', 'Big orders: 2'],
          checks: [{ expr: "big == ['C102', 'C106']", message: { en: 'big should hold the ids of the orders with qty 3 or more, in notebook order.', mr: 'big मध्ये qty 3 किंवा जास्त असलेल्या ऑर्डर्सचे ids, वहीच्या क्रमाने, हवेत.' } }],
          variants: [
            { label: SAT, files: { 'data/orders.csv': ORDERS_SAT }, output: ['C202 Ravi: 5 x Masala Chai', 'C205 Dev: 3 x Poha', 'Big orders: 2'], checks: [{ expr: "big == ['C202', 'C205']", message: { en: 'On Saturday, big should be [\'C202\', \'C205\'].', mr: 'शनिवारी big [\'C202\', \'C205\'] हवी.' } }] },
            { label: QUIET, files: { 'data/orders.csv': ORDERS_QUIET }, output: ['Big orders: 0'], checks: [{ expr: 'big == []', message: { en: 'On a quiet day with no big orders, big should stay empty.', mr: 'मोठी ऑर्डर नसलेल्या शांत दिवशी big रिकामी राहायला हवी.' } }] },
          ],
          hints: [
            { en: 'Loop over the rows with for o in orders:, then each o is a dict. o[\'qty\'] is already a number.', mr: 'for o in orders: ने rows वर loop करा, मग प्रत्येक o एक dict आहे. o[\'qty\'] आधीच number आहे.' },
            { en: 'Inside the loop: if o[\'qty\'] >= 3: then big.append(o[\'id\']) and the print.', mr: 'loop च्या आत: if o[\'qty\'] >= 3: मग big.append(o[\'id\']) आणि print.' },
            { en: "for o in orders:\n    if o['qty'] >= 3:\n        big.append(o['id'])\n        print(f\"{o['id']} {o['customer']}: {o['qty']} x {o['item']}\")", mr: "for o in orders:\n    if o['qty'] >= 3:\n        big.append(o['id'])\n        print(f\"{o['id']} {o['customer']}: {o['qty']} x {o['item']}\")" },
          ],
          successLine: { en: 'A WHERE clause, by hand. And on a day with no big orders, your list is honestly empty.', mr: 'हाताने लिहिलेलं WHERE. आणि मोठी ऑर्डर नसलेल्या दिवशी तुमची list प्रामाणिकपणे रिकामी.' },
        },
        {
          kind: 'python',
          prompt: {
            en: 'Now Sam\'s real question: how many of each item were sold? Fill the dict sold so that sold[item] is the total qty for that item (like SELECT item, SUM(qty) ... GROUP BY item). Use .get with a default of 0. The loop at the bottom prints it.',
            mr: 'आता Sam चा खरा प्रश्न: प्रत्येक item किती विकला गेला? dict sold असं भरा की sold[item] म्हणजे त्या item ची एकूण qty (SELECT item, SUM(qty) ... GROUP BY item सारखं). 0 default ठेवून .get वापरा. खालचा loop ते print करतो.',
          },
          files: { 'data/orders.csv': ORDERS },
          starter: `${READER}
sold = {}
# TODO: for each order, add its qty to sold[item] (start from 0 with .get)

for item, qty in sold.items():
    print(f"{item}: {qty}")
`,
          solution: `${READER}
sold = {}
for o in orders:
    sold[o['item']] = sold.get(o['item'], 0) + o['qty']

for item, qty in sold.items():
    print(f"{item}: {qty}")
`,
          output: ['Masala Chai: 7', 'Cutting Chai: 5', 'Bun Maska: 2', 'Ginger Chai: 1'],
          checks: [{ expr: "sold == {'Masala Chai': 7, 'Cutting Chai': 5, 'Bun Maska': 2, 'Ginger Chai': 1}", message: { en: 'sold should map each item to its total qty, for example \'Masala Chai\': 7.', mr: 'sold मध्ये प्रत्येक item समोर त्याची एकूण qty हवी, उदा. \'Masala Chai\': 7.' } }],
          mustUse: [{ pattern: '\\.get\\(', message: { en: 'Use sold.get(item, 0) so a new item starts at 0.', mr: 'नवा item 0 पासून सुरू व्हावा म्हणून sold.get(item, 0) वापरा.' } }],
          variants: [
            { label: SAT, files: { 'data/orders.csv': ORDERS_SAT }, output: ['Elaichi Chai: 3', 'Masala Chai: 6', 'Poha: 3'], checks: [{ expr: "sold == {'Elaichi Chai': 3, 'Masala Chai': 6, 'Poha': 3}", message: { en: 'On Saturday, sold should be Elaichi Chai 3, Masala Chai 6, Poha 3.', mr: 'शनिवारी sold: Elaichi Chai 3, Masala Chai 6, Poha 3 हवं.' } }] },
            { label: QUIET, files: { 'data/orders.csv': ORDERS_QUIET }, output: ['Cutting Chai: 3'], checks: [{ expr: "sold == {'Cutting Chai': 3}", message: { en: 'On the quiet day, sold should be {\'Cutting Chai\': 3}.', mr: 'शांत दिवशी sold {\'Cutting Chai\': 3} हवं.' } }] },
          ],
          hints: [
            { en: 'One loop over orders. For each o, the key is o[\'item\'] and the amount to add is o[\'qty\'].', mr: 'orders वर एकच loop. प्रत्येक o साठी key म्हणजे o[\'item\'] आणि जोडायची संख्या o[\'qty\'].' },
            { en: 'sold.get(o[\'item\'], 0) gives the total so far (0 the first time). Add o[\'qty\'] and store it back in sold[o[\'item\']].', mr: 'sold.get(o[\'item\'], 0) आतापर्यंतची बेरीज देतो (पहिल्यांदा 0). त्यात o[\'qty\'] जोडा आणि sold[o[\'item\']] मध्ये परत ठेवा.' },
            { en: "for o in orders:\n    sold[o['item']] = sold.get(o['item'], 0) + o['qty']", mr: "for o in orders:\n    sold[o['item']] = sold.get(o['item'], 0) + o['qty']" },
          ],
          successLine: { en: 'GROUP BY in four lines. One pass, every item, no recounting.', mr: 'चार ओळींत GROUP BY. एकच फेरी, प्रत्येक item, पुन्हा मोजणी नाही.' },
        },
        {
          kind: 'python',
          prompt: {
            en: 'Money now. Fill revenue so that revenue[item] is the sum of qty * price for that item, and add every order\'s money to total. The last line checks that the parts add up to the whole: it must print Matches: True.',
            mr: 'आता पैसे. revenue असं भरा की revenue[item] म्हणजे त्या item च्या qty * price ची बेरीज, आणि प्रत्येक ऑर्डरचे पैसे total मध्ये जोडा. शेवटची ओळ तुकडे एकूण आकड्याशी जुळतात का ते तपासते: तिने Matches: True print करायला हवं.',
          },
          files: { 'data/orders.csv': ORDERS },
          starter: `${READER}
revenue = {}
total = 0
# TODO: for each order, add qty * price to revenue[item] and to total

for item, amount in revenue.items():
    print(f"{item}: ₹{amount}")
print(f"Total: ₹{total}")
print(f"Matches: {total == sum(revenue.values())}")
`,
          solution: `${READER}
revenue = {}
total = 0
for o in orders:
    money = o['qty'] * o['price']
    revenue[o['item']] = revenue.get(o['item'], 0) + money
    total = total + money

for item, amount in revenue.items():
    print(f"{item}: ₹{amount}")
print(f"Total: ₹{total}")
print(f"Matches: {total == sum(revenue.values())}")
`,
          output: ['Masala Chai: ₹210', 'Cutting Chai: ₹75', 'Bun Maska: ₹80', 'Ginger Chai: ₹35', 'Total: ₹400', 'Matches: True'],
          checks: [
            { expr: "revenue == {'Masala Chai': 210, 'Cutting Chai': 75, 'Bun Maska': 80, 'Ginger Chai': 35}", message: { en: 'revenue should map each item to its money, for example \'Masala Chai\': 210 (7 cups x ₹30).', mr: 'revenue मध्ये प्रत्येक item समोर त्याचे पैसे हवेत, उदा. \'Masala Chai\': 210 (7 कप x ₹30).' } },
            { expr: 'total == 400', message: { en: 'total should be ₹400, the money from every order.', mr: 'total ₹400 हवं, प्रत्येक ऑर्डरचे पैसे.' } },
          ],
          variants: [
            { label: SAT, files: { 'data/orders.csv': ORDERS_SAT }, output: ['Elaichi Chai: ₹75', 'Masala Chai: ₹180', 'Poha: ₹120', 'Total: ₹375', 'Matches: True'], checks: [{ expr: "revenue == {'Elaichi Chai': 75, 'Masala Chai': 180, 'Poha': 120} and total == 375", message: { en: 'On Saturday: Elaichi Chai ₹75, Masala Chai ₹180, Poha ₹120, total ₹375.', mr: 'शनिवारी: Elaichi Chai ₹75, Masala Chai ₹180, Poha ₹120, total ₹375.' } }] },
            { label: QUIET, files: { 'data/orders.csv': ORDERS_QUIET }, output: ['Cutting Chai: ₹45', 'Total: ₹45', 'Matches: True'], checks: [{ expr: "revenue == {'Cutting Chai': 45} and total == 45", message: { en: 'On the quiet day: Cutting Chai ₹45, total ₹45.', mr: 'शांत दिवशी: Cutting Chai ₹45, total ₹45.' } }] },
          ],
          hints: [
            { en: 'Same counting trick as before, but add the money: money = o[\'qty\'] * o[\'price\'].', mr: 'आधीचीच मोजणीची युक्ती, पण पैसे जोडा: money = o[\'qty\'] * o[\'price\'].' },
            { en: 'Inside the loop: revenue[o[\'item\']] = revenue.get(o[\'item\'], 0) + money, and total = total + money.', mr: 'loop च्या आत: revenue[o[\'item\']] = revenue.get(o[\'item\'], 0) + money, आणि total = total + money.' },
            { en: "for o in orders:\n    money = o['qty'] * o['price']\n    revenue[o['item']] = revenue.get(o['item'], 0) + money\n    total = total + money", mr: "for o in orders:\n    money = o['qty'] * o['price']\n    revenue[o['item']] = revenue.get(o['item'], 0) + money\n    total = total + money" },
          ],
          successLine: { en: 'Revenue per item, a grand total, and proof that they reconcile. Sam can finally trust a number.', mr: 'प्रत्येक item ची कमाई, एकूण बेरीज, आणि त्या जुळतात याचा पुरावा. Sam ला शेवटी एका आकड्यावर विश्वास ठेवता येतो.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: "order = {'item': 'Masala Chai', 'qty': 2}\norder['qty'] = order['qty'] + 1\nprint(order)",
        options: [
          "{'item': 'Masala Chai', 'qty': 2}",
          "{'item': 'Masala Chai', 'qty': 3}",
          "KeyError: 'qty'",
          "{'item': 'Masala Chai', 'qty': 21}",
        ],
        answer: 1,
        explain: { en: 'order[\'qty\'] is 2, plus 1 is 3, stored back under the same key. Print shows the whole dict.', mr: 'order[\'qty\'] 2 आहे, अधिक 1 म्हणजे 3, त्याच key खाली परत ठेवलं. print पूर्ण dict दाखवतो.' },
      },
      {
        q: { en: 'Some orders have a \'note\' key and some do not. Which line reads it without ever crashing?', mr: 'काही ऑर्डर्सना \'note\' key आहे, काहींना नाही. कोणती ओळ ती कधीच crash न होता वाचते?' },
        options: ["order['note']", 'order.note', "order.get('note', '')", 'order[note]'],
        answer: 2,
        explain: { en: '.get returns the default \'\' when the key is missing. Brackets raise KeyError, order.note is not how dicts work, and order[note] looks for a variable called note.', mr: 'key नसेल तेव्हा .get default \'\' देतो. कंस KeyError देतात, order.note ही dict ची पद्धत नाही, आणि order[note] note नावाचा variable शोधतो.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: "counts = {}\nfor item in ['Poha', 'Chai', 'Chai']:\n    counts[item] = counts.get(item, 0) + 1\nprint(counts)",
        options: ["{'Chai': 3}", "['Poha', 'Chai']", "KeyError: 'Poha'", "{'Poha': 1, 'Chai': 2}"],
        answer: 3,
        explain: { en: 'Poha starts at 0 and becomes 1; Chai becomes 1, then 2. A dict keeps the order in which keys were first added.', mr: 'Poha 0 पासून 1 होतो; Chai 1, मग 2. dict keys पहिल्यांदा जोडल्या त्याच क्रमाने ठेवते.' },
      },
      {
        q: { en: 'orders is a list of order dicts. Which SQL does this loop match?', mr: 'orders ही order dicts ची list आहे. हा loop कोणत्या SQL सारखा आहे?' },
        code: "sold = {}\nfor o in orders:\n    sold[o['item']] = sold.get(o['item'], 0) + o['qty']",
        options: [
          'SELECT item, SUM(qty) FROM orders GROUP BY item',
          'SELECT item, qty FROM orders ORDER BY item',
          'SELECT COUNT(*) FROM orders',
          'SELECT DISTINCT item FROM orders',
        ],
        answer: 0,
        explain: { en: 'One bucket per item, adding qty into it: that is GROUP BY item with SUM(qty). Adding 1 instead of qty would be COUNT(*).', mr: 'प्रत्येक item साठी एक खोकं, त्यात qty जोडणं: हे GROUP BY item सह SUM(qty). qty ऐवजी 1 जोडलं तर ते COUNT(*) झालं असतं.' },
      },
    ],
    recap: { line: { en: 'A dict is one record, a list of dicts is a table, and counts[k] = counts.get(k, 0) + n is GROUP BY in one pass.', mr: 'dict म्हणजे एक record, dicts ची list म्हणजे table, आणि counts[k] = counts.get(k, 0) + n म्हणजे एका फेरीत GROUP BY.' }, icon: '🗂️' },
  },

  // ───────────────────────── Y1.5 Functions
  {
    id: 'py1-5',
    code: 'Y1.5',
    level: 'basic',
    title: { en: 'Functions you can trust', mr: 'विश्वास ठेवता येतील अशी functions' },
    skill: 'def, parameters, return vs print, defaults, docstrings, assert tests',
    realLife: {
      place: 'kitchen',
      title: { en: 'Aaji\'s chai, the same every time', mr: 'आजींचा चहा, दर वेळी तसाच' },
      story: {
        en: 'Meera\'s aaji makes chai for anyone who walks in. You hand her the inputs: how many cups, and how much sugar. If you say nothing about sugar, she makes it "normal", her default. She follows the same recipe every time, so the chai tastes the same for the milkman and for the mayor. And she hands you a cup. If she only shouted "chai is ready!" from the kitchen, you would still have nothing in your hand to drink or to serve. Before guests arrive, she tastes one spoon from the pan. One sip catches the day she forgot the sugar.',
        mr: 'मीराच्या आजी घरी येणाऱ्या प्रत्येकासाठी चहा करतात. तुम्ही त्यांना inputs देता: किती कप, आणि साखर किती. साखरेबद्दल काहीच म्हटलं नाही तर त्या "नेहमीसारखी" घालतात, तो त्यांचा default. त्या दर वेळी तीच कृती वापरतात, म्हणून दूधवाल्यासाठी आणि महापौरांसाठी चहाची चव सारखीच. आणि त्या तुमच्या हातात कप देतात. त्यांनी स्वयंपाकघरातून फक्त "चहा झाला!" असं ओरडलं असतं, तर तुमच्या हातात प्यायला किंवा द्यायला काहीच नसतं. पाहुणे येण्याआधी त्या पातेल्यातून एक चमचा चाखतात. एका घोटात साखर विसरलेला दिवस पकडला जातो.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🥛', label: 'Inputs: cups, sugar (parameters)', mr: 'inputs: कप, साखर (parameters)' },
          { icon: '📜', label: 'Same recipe every time (def)', mr: 'दर वेळी तीच कृती (def)' },
          { icon: '🍵', label: 'A cup in your hand (return)', mr: 'हातात कप (return)' },
          { icon: '🥄', label: 'Taste one spoon first (assert)', mr: 'आधी एक चमचा चाखा (assert)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Our customer list says we have "ravi", " Ravi " and "RAVI". That is one man who orders a lot of chai, and the app thinks he is three people.', mr: 'आपल्या customer list मध्ये "ravi", " Ravi " आणि "RAVI" आहेत. खूप चहा मागवणारा तो एकच माणूस आहे, आणि app ला वाटतं ते तीन लोक आहेत.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'The name cleaning code is copy-pasted in six places. I fixed one last week and forgot the other five.', mr: 'नाव साफ करण्याचा code सहा ठिकाणी copy-paste केलेला आहे. मागच्या आठवड्यात मी एक दुरुस्त केला आणि बाकीचे पाच विसरलो.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> copy paste is my best friend. one fix, five forgets. ⌁', mr: '>> copy paste माझा जिवलग मित्र. एक fix, पाच विसरलेले. ⌁' } },
        { who: 'rex', mood: 'happy', text: { en: 'Write it once as a function, {name}, and call it everywhere. Fix it in one place and every caller gets the fix.', mr: 'ते एकदाच function म्हणून लिही, {name}, आणि सगळीकडे call कर. एका ठिकाणी दुरुस्त कर आणि प्रत्येक caller ला ती दुरुस्ती मिळते.' } },
        { who: 'meera', mood: 'happy', text: { en: 'And this part is pure QA: before anyone uses your function, you test it with edge cases. Spaces, capitals, empty text, ₹ signs.', mr: 'आणि हा भाग शुद्ध QA आहे: कोणी तुझं function वापरण्याआधी तू ते edge cases ने तपासतेस. spaces, capital अक्षरं, रिकामा text, ₹ ची खूण.' } },
      ],
      problem: { en: 'The same cleaning steps are copy-pasted all over ChaiCart\'s scripts, slightly different each time. One customer becomes three, amounts like "₹1,250" crash the totals, and a fix in one place never reaches the others.', mr: 'तेच cleaning code ChaiCart च्या scripts मध्ये सगळीकडे copy-paste आहे, दर वेळी थोडं वेगळं. एक customer तीन होतो, "₹1,250" सारख्या amounts मुळे बेरजा crash होतात, आणि एका ठिकाणची दुरुस्ती इतरांपर्यंत कधीच पोहोचत नाही.' },
      solution: { en: 'Small functions with clear names (clean_name, parse_amount) that return their result, have a docstring, use sensible defaults, and are tested with assert on the nasty cases before anyone relies on them.', mr: 'स्पष्ट नावांची छोटी functions (clean_name, parse_amount), जी आपला निकाल return करतात, ज्यांना docstring आहे, योग्य defaults आहेत, आणि कोणी त्यांच्यावर अवलंबून राहण्याआधी जी त्रासदायक cases वर assert ने तपासली जातात.' },
    },
    lesson: [
      { en: 'def clean_name(raw): starts a function. raw is a parameter, a name for whatever value the caller passes in. The indented lines are the recipe. clean_name(\'  ravi \') calls it, and you can call it a thousand times. One recipe, one place to fix.', mr: 'def clean_name(raw): ने function सुरू होतं. raw हा parameter आहे, caller जी value देईल तिचं नाव. indent केलेल्या ओळी म्हणजे कृती. clean_name(\'  ravi \') ते call करतं, आणि तुम्ही ते हजार वेळा call करू शकता. एक कृती, दुरुस्तीसाठी एकच जागा.' },
      { en: 'return hands a value back to the caller, like aaji handing you the cup: name = clean_name(raw), total = order_total(2, 30) + 40. print only shows text on the screen; the caller gets None. A function that prints instead of returning is the classic bug: None + 40 gives a TypeError.', mr: 'return caller ला value परत देतं, आजींनी हातात कप दिल्यासारखं: name = clean_name(raw), total = order_total(2, 30) + 40. print फक्त screen वर text दाखवतं; caller ला None मिळतं. return ऐवजी print करणारं function हा जुनाट bug आहे: None + 40 ने TypeError येतो.' },
      { en: 'A default argument makes a parameter optional: def parse_amount(text, default=0). Call parse_amount(\'\') and you get 0; call parse_amount(\'\', default=None) and you get None. The first line inside, in triple quotes, is the docstring: one sentence on what goes in and what comes out. Future you will thank you.', mr: 'default argument मुळे parameter ऐच्छिक होतो: def parse_amount(text, default=0). parse_amount(\'\') call केलं तर 0 मिळतो; parse_amount(\'\', default=None) केलं तर None. आतली पहिली ओळ, triple quotes मध्ये, म्हणजे docstring: आत काय जातं आणि बाहेर काय येतं हे एका वाक्यात. पुढे तुम्हीच स्वतःचे आभार मानाल.' },
      { en: 'assert clean_name(\'  ravi  \') == \'Ravi\' is a one-line test. When it is true, nothing happens. When it is false, the program stops with AssertionError on that line. This is your QA superpower in code: boundaries (0, 1, 20, 21), empty text, extra spaces, capitals, symbols. Real test tools like pytest are built on this same assert.', mr: 'assert clean_name(\'  ravi  \') == \'Ravi\' ही एका ओळीची test आहे. ते खरं असेल तर काहीच होत नाही. खोटं असेल तर program त्याच ओळीवर AssertionError ने थांबतो. code मधली ही तुमची QA ताकद: boundaries (0, 1, 20, 21), रिकामा text, जास्तीचे spaces, capital अक्षरं, चिन्हं. pytest सारखी खरी test tools याच assert वर बांधलेली आहेत.' },
    ],
    syntax: {
      template: `def clean_name(raw):
    """Trim spaces and fix capitals: '  ravi  ' -> 'Ravi'."""
    return raw.strip().title()

def parse_amount(text, default=0):
    """'₹1,250' -> 1250. Text that is not a number -> default."""
    text = text.replace('₹', '').replace(',', '').strip()
    if not text.isdigit():
        return default
    return int(text)

assert clean_name('  ravi  ') == 'Ravi'
assert parse_amount('₹1,250') == 1250
assert parse_amount('') == 0`,
      parts: [
        { code: 'def name(param):', means: { en: 'define a function; the indented block is its recipe', mr: 'function define करा; indent केलेला block म्हणजे त्याची कृती' } },
        { code: '"""..."""', means: { en: 'docstring: one line on what goes in and what comes out', mr: 'docstring: आत काय जातं आणि बाहेर काय येतं, एका ओळीत' } },
        { code: 'return value', means: { en: 'hand the result back to the caller (print only shows it)', mr: 'निकाल caller ला परत द्या (print फक्त दाखवतो)' } },
        { code: 'default=0', means: { en: 'an optional parameter with a value used when the caller says nothing', mr: 'ऐच्छिक parameter; caller काहीच बोलला नाही तर ही value वापरली जाते' } },
        { code: 'assert expr == expected', means: { en: 'a test: silent when true, AssertionError when false', mr: 'test: खरं असेल तर शांत, खोटं असेल तर AssertionError' } },
      ],
      example: [
        { code: "def make_chai(cups, sugar='normal'):", note: { en: 'aaji\'s recipe: cups is required, sugar defaults to normal', mr: 'आजींची कृती: cups आवश्यक, sugar चा default normal' } },
        { code: "    return f\"{cups} cups, {sugar} sugar\"", note: { en: 'hand the cup back instead of shouting', mr: 'ओरडण्याऐवजी हातात कप द्या' } },
        { code: 'order = make_chai(3)', note: { en: 'the result lands in a variable: \'3 cups, normal sugar\'', mr: 'निकाल variable मध्ये येतो: \'3 cups, normal sugar\'' } },
        { code: "print(make_chai(2, sugar='less'))", note: { en: 'override the default: 2 cups, less sugar', mr: 'default बदला: 2 cups, less sugar' } },
        { code: "assert make_chai(1) == '1 cups, normal sugar'", note: { en: 'taste one spoon before the guests come: silent means it passed', mr: 'पाहुणे येण्याआधी एक चमचा चाखा: शांत म्हणजे pass' } },
      ],
      pitfall: { en: 'A function without return gives back None. Your code may print the right number on screen and still hand None to the next line, which then crashes far away from the real bug. If a value must be used later, return it.', mr: 'return नसलेलं function None परत देतं. तुमचा code screen वर योग्य आकडा print करेल आणि तरी पुढच्या ओळीला None देईल, जी मग खऱ्या bug पासून दूर कुठेतरी crash होते. value नंतर वापरायची असेल तर ती return करा.' },
    },
    practice: {
      intro: { en: 'Build ChaiCart\'s toolbox of small, trusted functions. Besides your printed output, Submit also calls your functions with tricky inputs, the way a tester would.', mr: 'ChaiCart साठी छोट्या, भरवशाच्या functions चा toolbox बनवा. print केलेल्या output शिवाय Submit तुमची functions अवघड inputs देऊन call करतं, tester करेल तसं.' },
      steps: [
        {
          kind: 'python',
          prompt: {
            en: 'Theo\'s order_total prints the money instead of returning it. Press Run: you see 60 and 40, then a TypeError, because each call gave back None. Fix the function so it returns qty * price and prints nothing itself. The output must be exactly: Day total: ₹100',
            mr: 'Theo चं order_total पैसे return करण्याऐवजी print करतं. Run दाबा: 60 आणि 40 दिसतात, मग TypeError, कारण प्रत्येक call ने None परत दिलं. function असं दुरुस्त करा की ते qty * price return करेल आणि स्वतः काहीच print करणार नाही. output नेमकं असं हवं: Day total: ₹100',
          },
          starter: `def order_total(qty, price):
    """Money for one order line: qty cups at price rupees each."""
    print(qty * price)

day_total = order_total(2, 30) + order_total(1, 40)
print(f"Day total: ₹{day_total}")
`,
          solution: `def order_total(qty, price):
    """Money for one order line: qty cups at price rupees each."""
    return qty * price

day_total = order_total(2, 30) + order_total(1, 40)
print(f"Day total: ₹{day_total}")
`,
          output: ['Day total: ₹100'],
          checks: [
            { expr: 'order_total(3, 15) == 45', message: { en: 'order_total(3, 15) should return 45.', mr: 'order_total(3, 15) ने 45 return करायला हवं.' } },
            { expr: 'order_total(0, 30) == 0', message: { en: 'order_total(0, 30) should return 0.', mr: 'order_total(0, 30) ने 0 return करायला हवं.' } },
          ],
          mustUse: [{ pattern: 'return\\s+\\S', message: { en: 'The function should return the money with return.', mr: 'function ने पैसे return ने परत द्यायला हवेत.' } }],
          hints: [
            { en: 'Read the error: unsupported operand type(s) for +: \'NoneType\' and \'NoneType\'. Both calls gave back None.', mr: 'error वाचा: unsupported operand type(s) for +: \'NoneType\' and \'NoneType\'. दोन्ही calls नी None परत दिलं.' },
            { en: 'Change the word print inside the function to return (and drop the brackets if you like).', mr: 'function मधला print शब्द return ने बदला (हवं तर कंस काढा).' },
            { en: '    return qty * price', mr: '    return qty * price' },
          ],
          successLine: { en: 'The cup is in your hand now. Values that are returned can be added, stored and tested.', mr: 'आता कप हातात आहे. return झालेल्या values जोडता, साठवता आणि तपासता येतात.' },
        },
        {
          kind: 'python',
          prompt: {
            en: 'Write clean_name(raw): remove spaces at both ends and give each word a capital first letter. Replace the TODO docstring with one line that says what it does. Submit also calls it with an empty string and with \'  sNEHA \', so think about those too.',
            mr: 'clean_name(raw) लिहा: दोन्ही टोकांचे spaces काढा आणि प्रत्येक शब्दाचं पहिलं अक्षर capital करा. TODO docstring ऐवजी ते काय करतं ते सांगणारी एक ओळ लिहा. Submit ते रिकामा string आणि \'  sNEHA \' देऊनही call करतं, म्हणून त्यांचाही विचार करा.',
          },
          starter: `def clean_name(raw):
    """TODO: write what this function does."""
    return raw

print(clean_name('  ravi  '))
print(clean_name('PRIYA'))
print(clean_name('anita deshmukh '))
`,
          solution: `def clean_name(raw):
    """Trim spaces and fix capitals: '  ravi  ' -> 'Ravi'."""
    return raw.strip().title()

print(clean_name('  ravi  '))
print(clean_name('PRIYA'))
print(clean_name('anita deshmukh '))
`,
          output: ['Ravi', 'Priya', 'Anita Deshmukh'],
          checks: [
            { expr: "clean_name('  sNEHA ') == 'Sneha'", message: { en: "clean_name('  sNEHA ') should return 'Sneha'.", mr: "clean_name('  sNEHA ') ने 'Sneha' return करायला हवं." } },
            { expr: "clean_name('') == ''", message: { en: "clean_name('') should return '' (empty in, empty out, no crash).", mr: "clean_name('') ने '' return करायला हवं (रिकामं आत, रिकामं बाहेर, crash नाही)." } },
            { expr: "bool(clean_name.__doc__) and 'TODO' not in clean_name.__doc__", message: { en: 'Replace the TODO docstring with one line that says what clean_name does.', mr: 'TODO docstring ऐवजी clean_name काय करतं ते सांगणारी एक ओळ लिहा.' } },
          ],
          hints: [
            { en: '.strip() removes spaces at both ends. .title() makes the first letter of each word capital and the rest small.', mr: '.strip() दोन्ही टोकांचे spaces काढतो. .title() प्रत्येक शब्दाचं पहिलं अक्षर capital आणि बाकी small करतो.' },
            { en: 'You can chain them: raw.strip().title(). And write the docstring like: """Trim spaces and fix capitals."""', mr: 'ते जोडून लिहिता येतात: raw.strip().title(). आणि docstring असं लिहा: """Trim spaces and fix capitals."""' },
            { en: "def clean_name(raw):\n    \"\"\"Trim spaces and fix capitals: '  ravi  ' -> 'Ravi'.\"\"\"\n    return raw.strip().title()", mr: "def clean_name(raw):\n    \"\"\"Trim spaces and fix capitals: '  ravi  ' -> 'Ravi'.\"\"\"\n    return raw.strip().title()" },
          ],
          successLine: { en: 'Ravi is one man again. Six copy-pastes can now become one call.', mr: 'रवी पुन्हा एकच माणूस झाला. सहा copy-paste आता एका call मध्ये बदलू शकतात.' },
        },
        {
          kind: 'python',
          prompt: {
            en: 'Amounts in the notebook look like \'₹1,250\', \' 45 \', \'\' and even \'free\'. Finish parse_amount(text, default=0): remove ₹ and commas, strip spaces, and return the number as an int. If what is left is not all digits (text.isdigit() is False), return default instead of crashing.',
            mr: 'वहीतल्या amounts \'₹1,250\', \' 45 \', \'\' आणि अगदी \'free\' अशा दिसतात. parse_amount(text, default=0) पूर्ण करा: ₹ आणि commas काढा, spaces strip करा, आणि number int म्हणून return करा. उरलेलं सगळं digits नसेल (text.isdigit() False असेल), तर crash होण्याऐवजी default return करा.',
          },
          starter: `def parse_amount(text, default=0):
    """'₹1,250' -> 1250. Text that is not a number -> default."""
    # TODO: remove ₹ and commas, strip spaces, return default if not digits
    return int(text)

print(parse_amount('₹1,250'))
print(parse_amount(' 45 '))
print(parse_amount(''))
print(parse_amount('free', default=None))
`,
          solution: `def parse_amount(text, default=0):
    """'₹1,250' -> 1250. Text that is not a number -> default."""
    text = text.replace('₹', '').replace(',', '').strip()
    if not text.isdigit():
        return default
    return int(text)

print(parse_amount('₹1,250'))
print(parse_amount(' 45 '))
print(parse_amount(''))
print(parse_amount('free', default=None))
`,
          output: ['1250', '45', '0', 'None'],
          checks: [
            { expr: "parse_amount('₹ 2,000') == 2000", message: { en: "parse_amount('₹ 2,000') should return 2000 (a space after ₹ too).", mr: "parse_amount('₹ 2,000') ने 2000 return करायला हवं (₹ नंतर space असला तरी)." } },
            { expr: "parse_amount('forty') == 0", message: { en: "parse_amount('forty') should return the default 0.", mr: "parse_amount('forty') ने default 0 return करायला हवं." } },
            { expr: "parse_amount('', default=-1) == -1", message: { en: "parse_amount('', default=-1) should return -1: use the default parameter, not a fixed 0.", mr: "parse_amount('', default=-1) ने -1 return करायला हवं: fixed 0 नको, default parameter वापरा." } },
            { expr: "type(parse_amount('₹30')) is int and parse_amount('₹30') == 30", message: { en: "parse_amount('₹30') should return the int 30, not the text '30'.", mr: "parse_amount('₹30') ने int 30 return करायला हवा, text '30' नाही." } },
          ],
          hints: [
            { en: "text.replace('₹', '') removes the rupee sign. Chain another .replace(',', '') and a .strip().", mr: "text.replace('₹', '') रुपयाची खूण काढतो. त्याला अजून एक .replace(',', '') आणि .strip() जोडा." },
            { en: 'Then: if not text.isdigit(): return default. Only after that, return int(text).', mr: 'मग: if not text.isdigit(): return default. त्यानंतरच return int(text).' },
            { en: "    text = text.replace('₹', '').replace(',', '').strip()\n    if not text.isdigit():\n        return default\n    return int(text)", mr: "    text = text.replace('₹', '').replace(',', '').strip()\n    if not text.isdigit():\n        return default\n    return int(text)" },
          ],
          successLine: { en: 'Rupee signs, commas, blanks and words: one function survives them all, and the caller picks the default.', mr: 'रुपयाची खूण, commas, रिकामे आणि शब्द: एक function सगळ्यांना पुरून उरतं, आणि default caller ठरवतो.' },
        },
        {
          kind: 'python',
          prompt: {
            en: 'Sam\'s nephew wrote is_valid_qty. The rule: an order line must have 1 to 20 cups, both included. Test it like a tester: add asserts for the boundaries 0, 1, 20 and 21 (at least 5 asserts in total). Press Run: an AssertionError means your test caught a bug. Then fix the function until all asserts pass and it prints All checks passed.',
            mr: 'Sam च्या पुतण्याने is_valid_qty लिहिलं. नियम: order line मध्ये 1 ते 20 कप हवेत, दोन्ही धरून. tester सारखं तपासा: boundaries 0, 1, 20 आणि 21 साठी asserts जोडा (एकूण किमान 5 asserts). Run दाबा: AssertionError म्हणजे तुमच्या test ने bug पकडला. मग सगळे asserts pass होईपर्यंत function दुरुस्त करा आणि ते All checks passed print करेल.',
          },
          starter: `def is_valid_qty(qty):
    """A ChaiCart order line must have 1 to 20 cups (both included)."""
    return qty >= 0 and qty < 20

assert is_valid_qty(5) == True
# TODO: add asserts for the edges: 0, 1, 20 and 21
# Run it: an AssertionError means you caught a bug. Then fix the function.

print('All checks passed')
`,
          solution: `def is_valid_qty(qty):
    """A ChaiCart order line must have 1 to 20 cups (both included)."""
    return 1 <= qty <= 20

assert is_valid_qty(5) == True
assert is_valid_qty(0) == False
assert is_valid_qty(1) == True
assert is_valid_qty(20) == True
assert is_valid_qty(21) == False

print('All checks passed')
`,
          output: ['All checks passed'],
          checks: [
            { expr: 'is_valid_qty(0) is False', message: { en: 'is_valid_qty(0) should be False: zero cups is not an order.', mr: 'is_valid_qty(0) False हवं: शून्य कप म्हणजे ऑर्डर नाही.' } },
            { expr: 'is_valid_qty(20) is True', message: { en: 'is_valid_qty(20) should be True: 20 is included.', mr: 'is_valid_qty(20) True हवं: 20 धरलेलं आहे.' } },
            { expr: 'is_valid_qty(1) is True and is_valid_qty(21) is False and is_valid_qty(-3) is False', message: { en: 'is_valid_qty should be True for 1 and False for 21 and -3.', mr: 'is_valid_qty 1 साठी True आणि 21 व -3 साठी False हवं.' } },
          ],
          mustUse: [{ pattern: '(\\bassert\\b[\\s\\S]*){5}', message: { en: 'Write at least 5 asserts: the one given plus 0, 1, 20 and 21.', mr: 'किमान 5 asserts लिहा: दिलेला एक आणि 0, 1, 20 व 21.' } }],
          hints: [
            { en: 'Boundary values, your old friend from manual testing: the last bad value, the first good one, the last good one, the first bad one. assert is_valid_qty(0) == False is the first.', mr: 'boundary values, manual testing मधला तुमचा जुना मित्र: शेवटची चुकीची value, पहिली योग्य, शेवटची योग्य, पहिली चुकीची. assert is_valid_qty(0) == False हा पहिला.' },
            { en: 'Two asserts fail: 0 is let in and 20 is kept out. qty >= 0 should start at 1, and qty < 20 should include 20.', mr: 'दोन asserts fail होतात: 0 आत येतो आणि 20 बाहेर राहतो. qty >= 0 हे 1 पासून सुरू व्हायला हवं, आणि qty < 20 मध्ये 20 धरायला हवं.' },
            { en: "    return 1 <= qty <= 20\n\nassert is_valid_qty(0) == False\nassert is_valid_qty(1) == True\nassert is_valid_qty(20) == True\nassert is_valid_qty(21) == False", mr: "    return 1 <= qty <= 20\n\nassert is_valid_qty(0) == False\nassert is_valid_qty(1) == True\nassert is_valid_qty(20) == True\nassert is_valid_qty(21) == False" },
          ],
          successLine: { en: 'Two off-by-one bugs, caught by four tiny tests at the edges. That is QA thinking, now living in code.', mr: 'चार छोट्या टोकावरच्या tests नी दोन off-by-one bugs पकडले. हेच QA चं विचार करणं, आता code मध्ये.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: 'def add_gst(amount):\n    amount * 1.05\n\nprint(add_gst(100))',
        options: ['105.0', '105', 'None', 'TypeError'],
        answer: 2,
        explain: { en: 'The function calculates 105.0 and throws it away. There is no return, so it gives back None, and print shows None.', mr: 'function 105.0 काढतं आणि फेकून देतं. return नाही, म्हणून ते None परत देतं, आणि print None दाखवतो.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: "def greet(name, city='Pune'):\n    return f\"{name} from {city}\"\n\nprint(greet('Ravi'))",
        options: ['Ravi from Pune', 'Ravi from city', "TypeError: greet() missing 1 required positional argument: 'city'", 'None'],
        answer: 0,
        explain: { en: 'city has a default, so it may be left out. The f-string fills in Pune.', mr: 'city ला default आहे, म्हणून तो सोडता येतो. f-string मध्ये Pune भरलं जातं.' },
      },
      {
        q: { en: 'parse_amount works correctly. What does this line print when it runs?', mr: 'parse_amount बरोबर चालतं. ही ओळ चालल्यावर काय print होतं?' },
        code: "assert parse_amount('₹30') == 30",
        options: ['True', 'Test passed', 'AssertionError', { en: 'Nothing: a passing assert is silent', mr: 'काहीच नाही: pass होणारा assert शांत असतो' }],
        answer: 3,
        explain: { en: 'assert only speaks up when the check is false. A true check prints nothing and the program carries on.', mr: 'check खोटा असेल तेव्हाच assert बोलतो. खरा check काहीच print करत नाही आणि program पुढे चालतो.' },
      },
      {
        q: { en: 'Which set of inputs tests clean_name best?', mr: 'clean_name ला कोणते inputs सगळ्यात चांगले तपासतात?' },
        options: [
          "'Ravi', 'Priya', 'Anita'",
          "'  ravi  ', 'PRIYA', '', 'anita deshmukh '",
          "'Ravi' ten times",
          "Only names from today's orders",
        ],
        answer: 1,
        explain: { en: 'Good tests cover the edges: extra spaces, all capitals, empty text, two words with a trailing space. Clean names alone prove almost nothing.', mr: 'चांगल्या tests टोकाच्या cases तपासतात: जास्तीचे spaces, सगळी capital अक्षरं, रिकामा text, शेवटी space असलेले दोन शब्द. फक्त स्वच्छ नावं जवळजवळ काहीच सिद्ध करत नाहीत.' },
      },
    ],
    recap: { line: { en: 'def a small function, give it a docstring, return the result (do not just print it), use defaults, and prove it with asserts on the edges.', mr: 'छोटं function def करा, docstring द्या, निकाल return करा (फक्त print नको), defaults वापरा, आणि टोकाच्या cases वर asserts ने ते सिद्ध करा.' }, icon: '🧪' },
  },

  // ───────────────────────── Y1.6 BOSS: The Messy Order Book
  {
    id: 'py1-6',
    code: 'Y1.6',
    level: 'basic',
    isBoss: true,
    title: { en: 'Boss: The Messy Order Book', mr: 'बॉस: गोंधळलेली ऑर्डर वही' },
    skill: 'Clean, validate and total a messy order book',
    realLife: {
      place: 'shop',
      title: { en: 'Mama\'s night-time hisaab', mr: 'मामांचा रात्रीचा हिशोब' },
      story: {
        en: 'Meera\'s mama runs a sweet shop on Laxmi Road. At 10 pm, after the shutter comes down, he goes through the day\'s bill book. A torn bill with no quantity goes in a separate pile. A bill that says "pedha, ₹ smudge" goes there too. A bill written twice by the new boy is caught because the bill number repeats. He counts the rejected pile as well, because the good bills plus the rejected ones must equal the bills in the book. Only then does he write the totals per sweet in his khata. If the numbers do not reconcile, he does not sleep.',
        mr: 'मीराच्या मामांचं लक्ष्मी रोडवर मिठाईचं दुकान आहे. रात्री 10 वाजता shutter खाली आल्यावर ते दिवसभराचं बिल बुक तपासतात. quantity नसलेलं फाटकं बिल वेगळ्या ढिगात जातं. "पेढा, ₹ पुसलेलं" असं बिलही तिथेच. नव्या मुलाने दोनदा लिहिलेलं बिल पकडलं जातं कारण बिल नंबर पुन्हा येतो. नाकारलेला ढीगही ते मोजतात, कारण चांगली बिलं आणि नाकारलेली मिळून बुकमधल्या बिलांइतकी व्हायला हवीत. त्यानंतरच ते प्रत्येक मिठाईची बेरीज खात्यात लिहितात. आकडे जुळले नाहीत तर त्यांना झोप येत नाही.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Keep only bills that make sense; count the rest', mr: 'फक्त अर्थपूर्ण बिलं ठेवा; बाकीची मोजा' },
        items: [
          { icon: '🧾', label: 'Kaju katli, 2, ₹40', mr: 'काजू कतली, 2, ₹40', pass: true },
          { icon: '📄', label: 'No quantity', mr: 'quantity नाही', pass: false },
          { icon: '🧾', label: 'Pedha, 1, ₹30', mr: 'पेढा, 1, ₹30', pass: true },
          { icon: '🖍️', label: 'Price smudged', mr: 'किंमत पुसलेली', pass: false },
          { icon: '👯', label: 'Same bill number twice', mr: 'तोच बिल नंबर दोनदा', pass: false },
          { icon: '🧾', label: 'Jalebi, 3, ₹20', mr: 'जिलेबी, 3, ₹20', pass: true },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Investors visit tomorrow. They want yesterday\'s revenue per item, and it has to match the cash box. My notebook says three different things.', mr: 'उद्या investors येणार आहेत. त्यांना कालची प्रत्येक item ची कमाई हवी आहे, आणि ती गल्ल्याशी जुळायला हवी. माझी वही तीन वेगवेगळ्या गोष्टी सांगते.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'I typed yesterday\'s page into data/orders.csv, exactly as written. Blanks, typos, everything.', mr: 'मी कालचं पान data/orders.csv मध्ये जसंच्या तसं टाइप केलं. रिकाम्या जागा, typos, सगळं.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '>> i left gifts in the book. a blank qty, "forty" for a price, an order written twice, a zero, spaces everywhere. one crash and the investors see red. ⌁', mr: '>> वहीत मी भेटी ठेवल्यात. रिकामी qty, किंमतीच्या जागी "forty", दोनदा लिहिलेली ऑर्डर, एक शून्य, सगळीकडे spaces. एक crash आणि investors ना लाल दिसेल. ⌁' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Functions, dicts, loops, ifs: everything you learned at ChaiCart. Clean every row, skip the bad ones with a reason, never crash, and make the numbers reconcile.', mr: 'functions, dicts, loops, ifs: ChaiCart मध्ये शिकलेलं सगळं. प्रत्येक row साफ कर, खराब rows कारणासह skip कर, कधीच crash होऊ नकोस, आणि आकडे जुळव.' } },
        { who: 'meera', mood: 'worried', text: { en: 'Boss rules, {name}: only 2 hints per step. And your code runs on hidden days too: a clean day, a Sunday full of blanks, and one day the Gremlin wrote alone.', mr: 'बॉसचे नियम, {name}: प्रत्येक स्टेपला फक्त 2 हिंट्स. आणि तुझा code लपवलेल्या दिवसांवरही चालतो: एक स्वच्छ दिवस, रिकाम्या जागांनी भरलेला रविवार, आणि Gremlin ने एकट्याने लिहिलेला एक दिवस.' } },
      ],
      problem: { en: 'ChaiCart\'s order book is full of bad rows: missing quantities, words where prices should be, zeros, repeated order ids and messy spacing. Totals done by hand never match, and a script that crashes on the first bad row is no better.', mr: 'ChaiCart ची ऑर्डर वही खराब rows नी भरलेली आहे: गायब quantities, किंमतीच्या जागी शब्द, शून्य, पुन्हा आलेले order ids आणि गोंधळलेले spaces. हाताने केलेल्या बेरजा कधीच जुळत नाहीत, आणि पहिल्याच खराब row वर crash होणारी script काही चांगली नाही.' },
      solution: { en: 'A small pipeline of trusted functions: read the rows, clean each one, find what is wrong with it, skip and count the bad ones by reason, then total the revenue per item and print a daily report where good + skipped = rows read.', mr: 'भरवशाच्या functions ची छोटी pipeline: rows वाचा, प्रत्येक साफ करा, त्यात काय चूक आहे ते शोधा, खराब rows कारणानुसार skip करून मोजा, मग प्रत्येक item ची कमाई काढा आणि daily report print करा जिथे good + skipped = वाचलेल्या rows.' },
    },
    lesson: [
      { en: 'Real data engineering is a pipeline of small steps: read, clean, validate, aggregate, report. Each step is one function you can test on its own. When the report looks wrong, you can test each step and find which one broke.', mr: 'खरं data engineering म्हणजे छोट्या पायऱ्यांची pipeline: read, clean, validate, aggregate, report. प्रत्येक पायरी एक function, जी स्वतंत्रपणे तपासता येते. report चुकीचा दिसला की प्रत्येक पायरी तपासून कोणती तुटली ते शोधता येतं.' },
      { en: 'Cleaning fixes what can be fixed: \'  masala   chai \' becomes \'Masala Chai\', \'priya \' becomes \'Priya\', \'₹40\' becomes 40. Validating decides what cannot be fixed: a blank qty, \'forty\' as a price, a zero, an id you already accepted. Never guess a missing number. Skip the row and say why.', mr: 'cleaning जे दुरुस्त होऊ शकतं ते दुरुस्त करतं: \'  masala   chai \' चं \'Masala Chai\', \'priya \' चं \'Priya\', \'₹40\' चं 40. validation ठरवतं काय दुरुस्त होऊ शकत नाही: रिकामी qty, किंमत म्हणून \'forty\', शून्य, आधीच स्वीकारलेला id. गायब आकड्याचा कधीच अंदाज लावू नका. row skip करा आणि कारण सांगा.' },
      { en: 'Skipped rows are counted, never silently dropped. A reasons dict (\'bad qty\': 2, \'duplicate id\': 1) tells Sam what to fix in the notebook. And the check every data engineer does: good + skipped must equal the rows read. If it does not, a row fell through a crack.', mr: 'skip केलेल्या rows मोजल्या जातात, गुपचूप टाकल्या जात नाहीत. reasons dict (\'bad qty\': 2, \'duplicate id\': 1) Sam ला वहीत काय दुरुस्त करायचं ते सांगते. आणि प्रत्येक data engineer करतो तो check: good + skipped हे वाचलेल्या rows इतकंच हवं. नसेल तर एखादी row फटीतून निसटली.' },
      { en: 'Your code must survive any day: a clean day with nothing to skip, a day full of blanks, and a day where every row is bad and revenue is just {} and ₹0. No crash, no hard-coded numbers. The csv module comes in Python 2; today a plain split(\',\') is enough for this tiny file.', mr: 'तुमचा code कोणत्याही दिवशी टिकायला हवा: काहीच skip न करायचा स्वच्छ दिवस, रिकाम्या जागांनी भरलेला दिवस, आणि प्रत्येक row खराब असलेला दिवस जिथे revenue फक्त {} आणि ₹0. crash नाही, hard-coded आकडे नाहीत. csv module Python 2 मध्ये येईल; या छोट्या file साठी आज साधा split(\',\') पुरेसा आहे.' },
    ],
    syntax: {
      template: `rows = read_rows('data/orders.csv')        # raw text rows
good_orders, seen_ids, skipped, reasons = [], [], 0, {}
for row in rows:
    order = clean_order(row)                  # fix what can be fixed
    reason = find_problem(order, seen_ids)    # None when the order is fine
    if reason is None:
        good_orders.append(order)
        seen_ids.append(order['order_id'])
    else:
        skipped = skipped + 1
        reasons[reason] = reasons.get(reason, 0) + 1
assert len(good_orders) + skipped == len(rows)   # reconcile`,
      parts: [
        { code: 'read_rows(path)', means: { en: 'text file to a list of dicts, all values still text', mr: 'text file ची dicts ची list, सगळ्या values अजून text' } },
        { code: 'clean_order(row)', means: { en: 'strip, fix capitals, squeeze spaces, turn numbers into int or None', mr: 'strip, capitals दुरुस्त, spaces कमी, numbers ना int किंवा None' } },
        { code: 'find_problem(order, seen_ids)', means: { en: 'the reason an order is bad, or None', mr: 'ऑर्डर खराब असण्याचं कारण, किंवा None' } },
        { code: 'x is None', means: { en: 'checks for the "no value" marker None (use is, not ==)', mr: '"value नाही" ची खूण None तपासतो (== नव्हे, is वापरा)' } },
        { code: 'len(good) + skipped == len(rows)', means: { en: 'the reconcile check: no row lost', mr: 'जुळवणीचा check: एकही row हरवली नाही' } },
      ],
      example: [
        { code: "' '.join('  masala   chai '.split())", note: { en: 'split() with no argument splits on any run of spaces: \'masala chai\'', mr: 'argument नसलेला split() कितीही spaces वर तोडतो: \'masala chai\'' } },
        { code: "'forty'.isdigit()", note: { en: 'False: the smudged price goes to the rejected pile', mr: 'False: पुसलेली किंमत नाकारलेल्या ढिगात जाते' } },
        { code: "'C202' in seen_ids", note: { en: 'True the second time: the bill written twice by the new boy', mr: 'दुसऱ्यांदा True: नव्या मुलाने दोनदा लिहिलेलं बिल' } },
        { code: "reasons['bad qty'] = reasons.get('bad qty', 0) + 1", note: { en: 'count the rejected pile, by reason', mr: 'नाकारलेला ढीग कारणानुसार मोजा' } },
        { code: 'for item in sorted(revenue):', note: { en: 'items A to Z, the same order every day, like mama\'s khata', mr: 'items A ते Z, दररोज त्याच क्रमाने, मामांच्या खात्यासारखं' } },
      ],
      pitfall: { en: 'Do not add an id to seen_ids before you know the order is good, or a bad first copy can block a good second one. And never fix a bad number by guessing (a blank qty is not 1). Skip it, count it, report it.', mr: 'ऑर्डर चांगली आहे हे कळण्याआधी id seen_ids मध्ये टाकू नका, नाहीतर खराब पहिली प्रत चांगल्या दुसऱ्या प्रतीला अडवू शकते. आणि खराब आकडा अंदाजाने कधीच दुरुस्त करू नका (रिकामी qty म्हणजे 1 नाही). skip करा, मोजा, report करा.' },
    },
    practice: {
      intro: { en: 'Five steps, one pipeline. Each step gives you the finished functions from the step before. Your code also runs on hidden days, so let the data decide every number. Only 2 hints per step.', mr: 'पाच steps, एक pipeline. प्रत्येक step मध्ये आधीच्या step ची पूर्ण functions दिलेली असतात. तुमचा code लपवलेल्या दिवसांवरही चालतो, म्हणून प्रत्येक आकडा data ला ठरवू द्या. प्रत्येक step ला फक्त 2 हिंट्स.' },
      steps: [
        {
          kind: 'python',
          prompt: {
            en: 'Step 1, read. Finish read_rows(path): for every line after the header, skip blank lines, split it on commas, and build a dict that pairs each header name with its value (keep the values as raw text, no cleaning yet). Return the list. Use plain split, the csv module comes later. Hidden days have blank lines in the middle and at the end.',
            mr: 'Step 1, वाचा. read_rows(path) पूर्ण करा: header नंतरच्या प्रत्येक ओळीसाठी, रिकाम्या ओळी skip करा, ओळ commas वर split करा, आणि प्रत्येक header नावाला त्याची value जोडणारी dict बनवा (values कच्चा text म्हणूनच ठेवा, अजून cleaning नाही). list return करा. साधा split वापरा, csv module नंतर येईल. लपवलेल्या दिवसांत मधे आणि शेवटी रिकाम्या ओळी आहेत.',
          },
          files: { 'data/orders.csv': MESSY },
          starter: `def read_rows(path):
    """Read a small CSV with plain string split. Returns a list of dicts (all values are text)."""
    lines = open(path).read().splitlines()
    header = lines[0].split(',')
    rows = []
    # TODO: for every line after the header:
    #   skip blank lines, split on commas,
    #   pair each header name with its value in a dict, and append it to rows
    return rows

rows = read_rows('data/orders.csv')
print(f"Rows read: {len(rows)}")
`,
          solution: `${READ_ROWS}
rows = read_rows('data/orders.csv')
print(f"Rows read: {len(rows)}")
`,
          output: ['Rows read: 10'],
          checks: [
            { expr: "rows[0] == {'order_id': 'C201', 'customer': 'Ravi', 'item': 'Masala Chai', 'qty': '2', 'price': '30'}", message: { en: "rows[0] should be {'order_id': 'C201', 'customer': 'Ravi', 'item': 'Masala Chai', 'qty': '2', 'price': '30'}, keys from the header and values as text.", mr: "rows[0] असं हवं: {'order_id': 'C201', 'customer': 'Ravi', 'item': 'Masala Chai', 'qty': '2', 'price': '30'}, keys header मधून आणि values text म्हणून." } },
            { expr: "rows[2]['qty'] == '' and rows[7]['item'] == '  masala   chai '", message: { en: 'Keep the raw text exactly as written: the blank qty stays \'\' and the spaces in \'  masala   chai \' stay. Cleaning is the next step.', mr: 'कच्चा text जसाच्या तसा ठेवा: रिकामी qty \'\' राहते आणि \'  masala   chai \' मधले spaces राहतात. cleaning पुढच्या step मध्ये.' } },
          ],
          mustUse: [
            { pattern: 'def\\s+read_rows\\s*\\(', message: { en: 'Keep the function read_rows(path).', mr: 'read_rows(path) हे function ठेवा.' } },
            { pattern: "\\.split\\(\\s*['\"],['\"]\\s*\\)", message: { en: "Split each line with .split(',').", mr: "प्रत्येक ओळ .split(',') ने तोडा." } },
          ],
          mustNotUse: [{ pattern: 'import\\s+csv', message: { en: 'Not the csv module yet (that is Python 2). Use plain split.', mr: 'अजून csv module नको (ते Python 2 मध्ये). साधा split वापरा.' } }],
          variants: [
            { label: SUN, files: { 'data/orders.csv': SUNDAY }, output: ['Rows read: 7'], checks: [{ expr: "len(rows) == 7 and rows[2]['item'] == ''", message: { en: 'On Sunday there are 7 real rows; the blank lines must be skipped.', mr: 'रविवारी 7 खऱ्या rows आहेत; रिकाम्या ओळी skip व्हायला हव्यात.' } }] },
            { label: CLEAN, files: { 'data/orders.csv': CLEAN_DAY }, output: ['Rows read: 3'], checks: [{ expr: "rows[2]['customer'] == 'Rex'", message: { en: 'On the clean day, the third row should belong to Rex.', mr: 'स्वच्छ दिवशी तिसरी row Rex ची हवी.' } }] },
            { label: GREM, files: { 'data/orders.csv': GREMLIN_DAY }, output: ['Rows read: 3'], checks: [{ expr: "rows[1]['price'] == 'free'", message: { en: 'On the Gremlin\'s day, read every row as text, even the price \'free\'.', mr: 'Gremlin च्या दिवशी प्रत्येक row text म्हणून वाचा, \'free\' किंमतसुद्धा.' } }] },
          ],
          hints: [
            { en: "Loop: for line in lines[1:]: and first skip blanks with if line.strip() == '': continue. Then parts = line.split(','). Build row = {} and fill row[header[i]] = parts[i] for i in range(len(header)), then rows.append(row).", mr: "loop: for line in lines[1:]: आणि आधी if line.strip() == '': continue ने रिकाम्या ओळी skip करा. मग parts = line.split(','). row = {} बनवा आणि range(len(header)) मधल्या प्रत्येक i साठी row[header[i]] = parts[i] भरा, मग rows.append(row)." },
            { en: "    for line in lines[1:]:\n        if line.strip() == '':\n            continue\n        parts = line.split(',')\n        row = {}\n        for i in range(len(header)):\n            row[header[i]] = parts[i]\n        rows.append(row)", mr: "    for line in lines[1:]:\n        if line.strip() == '':\n            continue\n        parts = line.split(',')\n        row = {}\n        for i in range(len(header)):\n            row[header[i]] = parts[i]\n        rows.append(row)" },
            { en: 'A shorter way to pair them: row = dict(zip(header, parts)).', mr: 'जोडी लावायचा छोटा मार्ग: row = dict(zip(header, parts)).' },
          ],
          successLine: { en: 'Hit! Every row is in, exactly as Sam wrote it, and the blank lines did not sneak in as fake orders.', mr: 'Hit! प्रत्येक row आत आली, Sam ने लिहिली तशीच, आणि रिकाम्या ओळी खोट्या ऑर्डर्स बनून घुसल्या नाहीत.' },
        },
        {
          kind: 'python',
          prompt: {
            en: 'Step 2, clean. clean_name and parse_amount (with default=None) are ready from Y1.5. Write clean_item(raw), which squeezes extra spaces and fixes capitals (\'  masala   chai \' -> \'Masala Chai\'), and clean_order(row), which returns a new dict with the same five keys: order_id stripped, customer through clean_name, item through clean_item, qty and price through parse_amount (so bad numbers become None).',
            mr: 'Step 2, साफ करा. clean_name आणि parse_amount (default=None सह) Y1.5 मधून तयार आहेत. clean_item(raw) लिहा, जे जास्तीचे spaces कमी करून capitals दुरुस्त करतं (\'  masala   chai \' -> \'Masala Chai\'), आणि clean_order(row), जे त्याच पाच keys असलेली नवी dict return करतं: order_id strip करून, customer clean_name मधून, item clean_item मधून, qty आणि price parse_amount मधून (म्हणजे खराब numbers None होतात).',
          },
          files: { 'data/orders.csv': MESSY },
          starter: `${READ_ROWS}
${HELPERS}
def clean_item(raw):
    """'  masala   chai ' -> 'Masala Chai' (extra spaces squeezed)."""
    # TODO
    return raw

def clean_order(row):
    """One raw row (all text) -> one clean order dict."""
    # TODO: return a NEW dict with the keys order_id, customer, item, qty, price
    return row

rows = read_rows('data/orders.csv')
print(clean_order(rows[7]))
print(clean_order(rows[3]))
`,
          solution: `${READ_ROWS}
${HELPERS}
${CLEAN_ORDER}
rows = read_rows('data/orders.csv')
print(clean_order(rows[7]))
print(clean_order(rows[3]))
`,
          output: [
            "{'order_id': 'C207', 'customer': 'Meena', 'item': 'Masala Chai', 'qty': 1, 'price': 30}",
            "{'order_id': 'C204', 'customer': 'Rohan', 'item': 'Ginger Chai', 'qty': 3, 'price': None}",
          ],
          checks: [
            { expr: "clean_item('  masala   chai ') == 'Masala Chai' and clean_item(' poha ') == 'Poha' and clean_item('') == ''", message: { en: "clean_item should give 'Masala Chai' for '  masala   chai ', 'Poha' for ' poha ', and '' for ''.", mr: "clean_item ने '  masala   chai ' साठी 'Masala Chai', ' poha ' साठी 'Poha', आणि '' साठी '' द्यायला हवं." } },
            { expr: "clean_order({'order_id': ' C202', 'customer': 'priya ', 'item': ' cutting chai', 'qty': '1', 'price': '₹15'}) == {'order_id': 'C202', 'customer': 'Priya', 'item': 'Cutting Chai', 'qty': 1, 'price': 15}", message: { en: "clean_order should strip the id, clean the name and item, and turn '1' and '₹15' into 1 and 15.", mr: "clean_order ने id strip करायला हवा, नाव आणि item साफ करायला हवेत, आणि '1' व '₹15' चे 1 आणि 15 करायला हवेत." } },
            { expr: "clean_order({'order_id': 'X1', 'customer': 'Om', 'item': 'Poha', 'qty': '', 'price': 'free'})['qty'] is None and clean_order({'order_id': 'X1', 'customer': 'Om', 'item': 'Poha', 'qty': '', 'price': 'free'})['price'] is None", message: { en: "A blank qty and the price 'free' should both become None. Never guess a number.", mr: "रिकामी qty आणि 'free' किंमत दोन्ही None व्हायला हव्यात. आकड्याचा अंदाज कधीच लावू नका." } },
          ],
          hints: [
            { en: "raw.split() with no argument splits on any run of spaces and drops the ends; ' '.join(...) glues the words back with single spaces; then .title(). For clean_order, return { 'order_id': row['order_id'].strip(), 'customer': clean_name(row['customer']), ... }.", mr: "argument नसलेला raw.split() कितीही spaces वर तोडतो आणि टोकं काढतो; ' '.join(...) शब्द एका space ने परत जोडतो; मग .title(). clean_order साठी return { 'order_id': row['order_id'].strip(), 'customer': clean_name(row['customer']), ... }." },
            { en: "def clean_item(raw):\n    return ' '.join(raw.split()).title()\n\ndef clean_order(row):\n    return {\n        'order_id': row['order_id'].strip(),\n        'customer': clean_name(row['customer']),\n        'item': clean_item(row['item']),\n        'qty': parse_amount(row['qty']),\n        'price': parse_amount(row['price']),\n    }", mr: "def clean_item(raw):\n    return ' '.join(raw.split()).title()\n\ndef clean_order(row):\n    return {\n        'order_id': row['order_id'].strip(),\n        'customer': clean_name(row['customer']),\n        'item': clean_item(row['item']),\n        'qty': parse_amount(row['qty']),\n        'price': parse_amount(row['price']),\n    }" },
            { en: 'Check the printed dicts: C207 should be clean, and C204 should have price None (it said "forty").', mr: 'print झालेल्या dicts तपासा: C207 स्वच्छ हवी, आणि C204 ची price None हवी (तिथे "forty" होतं).' },
          ],
          successLine: { en: 'Hit! Spaces squeezed, names fixed, and "forty" honestly marked as None instead of a guess.', mr: 'Hit! spaces कमी, नावं दुरुस्त, आणि "forty" अंदाजाऐवजी प्रामाणिकपणे None.' },
        },
        {
          kind: 'python',
          prompt: {
            en: 'Step 3, validate. Write find_problem(order, seen_ids). Check in this order and return the first reason that applies: \'duplicate id\' if the order_id is already in seen_ids, \'missing item\' if item is \'\', \'bad qty\' if qty is None or 0 or less, \'bad price\' if price is None or 0 or less. Return None when the order is fine. (Here the loop passes an empty seen list; the real one comes next.)',
            mr: 'Step 3, तपासा. find_problem(order, seen_ids) लिहा. याच क्रमाने तपासा आणि लागू होणारं पहिलं कारण return करा: order_id आधीच seen_ids मध्ये असेल तर \'duplicate id\', item \'\' असेल तर \'missing item\', qty None किंवा 0 किंवा कमी असेल तर \'bad qty\', price None किंवा 0 किंवा कमी असेल तर \'bad price\'. ऑर्डर ठीक असेल तर None return करा. (इथे loop रिकामी seen list देतो; खरी पुढच्या step मध्ये.)',
          },
          files: { 'data/orders.csv': MESSY },
          starter: `${READ_ROWS}
${HELPERS}
${CLEAN_ORDER}
def find_problem(order, seen_ids):
    """Return why an order is bad, or None when it is fine."""
    # TODO: check in this order: duplicate id, missing item, bad qty, bad price
    return None

rows = read_rows('data/orders.csv')
for row in rows:
    order = clean_order(row)
    reason = find_problem(order, [])
    if reason is not None:
        print(f"{order['order_id']}: {reason}")
`,
          solution: `${READ_ROWS}
${HELPERS}
${CLEAN_ORDER}
${FIND_PROBLEM}
rows = read_rows('data/orders.csv')
for row in rows:
    order = clean_order(row)
    reason = find_problem(order, [])
    if reason is not None:
        print(f"{order['order_id']}: {reason}")
`,
          output: ['C203: bad qty', 'C204: bad price', 'C206: bad qty'],
          checks: [
            { expr: `find_problem(${GOOD_ORDER}, []) is None`, message: { en: 'A good order should give None.', mr: 'चांगल्या ऑर्डरला None मिळायला हवं.' } },
            { expr: `find_problem(${GOOD_ORDER}, ['C199', 'C201']) == 'duplicate id'`, message: { en: "An order whose id is already in seen_ids should give 'duplicate id'.", mr: "ज्या ऑर्डरचा id आधीच seen_ids मध्ये आहे तिला 'duplicate id' मिळायला हवं." } },
            { expr: `find_problem({**${GOOD_ORDER}, 'item': ''}, []) == 'missing item'`, message: { en: "An empty item should give 'missing item'.", mr: "रिकाम्या item ला 'missing item' मिळायला हवं." } },
            { expr: `find_problem({**${GOOD_ORDER}, 'qty': None}, []) == 'bad qty' and find_problem({**${GOOD_ORDER}, 'qty': 0}, []) == 'bad qty'`, message: { en: "qty None and qty 0 should both give 'bad qty'.", mr: "qty None आणि qty 0 दोन्हींना 'bad qty' मिळायला हवं." } },
            { expr: `find_problem({**${GOOD_ORDER}, 'price': None}, []) == 'bad price' and find_problem({**${GOOD_ORDER}, 'price': 0}, []) == 'bad price'`, message: { en: "price None and price 0 should both give 'bad price'.", mr: "price None आणि price 0 दोन्हींना 'bad price' मिळायला हवं." } },
            { expr: `find_problem({**${GOOD_ORDER}, 'item': '', 'qty': None}, ['C201']) == 'duplicate id'`, message: { en: 'When several things are wrong, return the first reason in the given order (duplicate id comes first).', mr: 'अनेक गोष्टी चुकीच्या असतील तर दिलेल्या क्रमातलं पहिलं कारण return करा (duplicate id आधी).' } },
          ],
          hints: [
            { en: "One if per rule, each returning straight away: if order['order_id'] in seen_ids: return 'duplicate id'. For the numbers: if order['qty'] is None or order['qty'] <= 0: return 'bad qty'. Check None first, because None <= 0 is a TypeError. End with return None.", mr: "प्रत्येक नियमासाठी एक if, लगेच return करणारा: if order['order_id'] in seen_ids: return 'duplicate id'. आकड्यांसाठी: if order['qty'] is None or order['qty'] <= 0: return 'bad qty'. आधी None तपासा, कारण None <= 0 हा TypeError आहे. शेवटी return None." },
            { en: "    if order['order_id'] in seen_ids:\n        return 'duplicate id'\n    if order['item'] == '':\n        return 'missing item'\n    if order['qty'] is None or order['qty'] <= 0:\n        return 'bad qty'\n    if order['price'] is None or order['price'] <= 0:\n        return 'bad price'\n    return None", mr: "    if order['order_id'] in seen_ids:\n        return 'duplicate id'\n    if order['item'] == '':\n        return 'missing item'\n    if order['qty'] is None or order['qty'] <= 0:\n        return 'bad qty'\n    if order['price'] is None or order['price'] <= 0:\n        return 'bad price'\n    return None" },
            { en: 'The output should list C203 (blank qty), C204 (forty) and C206 (zero).', mr: 'output मध्ये C203 (रिकामी qty), C204 (forty) आणि C206 (शून्य) दिसायला हवेत.' },
          ],
          successLine: { en: 'Hit! Every bad row now comes with a reason, and the order of the rules is fixed and testable.', mr: 'Hit! आता प्रत्येक खराब row कारणासह येते, आणि नियमांचा क्रम ठरलेला आणि तपासता येणारा आहे.' },
        },
        {
          kind: 'python',
          prompt: {
            en: 'Step 4, split the day. For every row: clean it, then ask find_problem(order, seen_ids). If the reason is None, append the order to good_orders and its id to seen_ids. Otherwise add 1 to skipped and count the reason in the reasons dict. The print lines are ready. Hidden days include a clean day (nothing skipped) and the Gremlin\'s day (nothing good).',
            mr: 'Step 4, दिवसाची विभागणी. प्रत्येक row साठी: ती साफ करा, मग find_problem(order, seen_ids) विचारा. कारण None असेल तर ऑर्डर good_orders मध्ये आणि तिचा id seen_ids मध्ये append करा. नाहीतर skipped मध्ये 1 जोडा आणि कारण reasons dict मध्ये मोजा. print च्या ओळी तयार आहेत. लपवलेल्या दिवसांत एक स्वच्छ दिवस (काहीच skip नाही) आणि Gremlin चा दिवस (काहीच चांगलं नाही) आहे.',
          },
          files: { 'data/orders.csv': MESSY },
          starter: `${READ_ROWS}
${HELPERS}
${CLEAN_ORDER}
${FIND_PROBLEM}
rows = read_rows('data/orders.csv')
good_orders = []
seen_ids = []
skipped = 0
reasons = {}
# TODO: for each row: clean it, then find_problem(order, seen_ids)
#   good -> append to good_orders, remember its id in seen_ids
#   bad  -> skipped + 1, and count the reason in reasons

print(f"Read {len(rows)}: {len(good_orders)} good, {skipped} skipped")
for reason, n in reasons.items():
    print(f"- {reason}: {n}")
`,
          solution: `${READ_ROWS}
${HELPERS}
${CLEAN_ORDER}
${FIND_PROBLEM}
${SPLIT_LOOP}
print(f"Read {len(rows)}: {len(good_orders)} good, {skipped} skipped")
for reason, n in reasons.items():
    print(f"- {reason}: {n}")
`,
          output: ['Read 10: 6 good, 4 skipped', '- bad qty: 2', '- bad price: 1', '- duplicate id: 1'],
          checks: [
            { expr: 'len(good_orders) == 6 and skipped == 4', message: { en: 'This day should give 6 good orders and 4 skipped.', mr: 'या दिवशी 6 चांगल्या ऑर्डर्स आणि 4 skipped हव्यात.' } },
            { expr: 'len(good_orders) + skipped == len(rows)', message: { en: 'good + skipped must equal the rows read. A row was lost or counted twice.', mr: 'good + skipped हे वाचलेल्या rows इतकं हवं. एखादी row हरवली किंवा दोनदा मोजली गेली.' } },
            { expr: "[o['order_id'] for o in good_orders] == ['C201', 'C202', 'C205', 'C207', 'C208', 'C209'] and good_orders[1]['item'] == 'Cutting Chai'", message: { en: 'good_orders should hold the cleaned orders C201, C202, C205, C207, C208, C209 (the first C202 stays, its copy is skipped).', mr: 'good_orders मध्ये साफ केलेल्या C201, C202, C205, C207, C208, C209 हव्यात (पहिली C202 राहते, तिची प्रत skip होते).' } },
            { expr: "reasons == {'bad qty': 2, 'bad price': 1, 'duplicate id': 1}", message: { en: "reasons should be {'bad qty': 2, 'bad price': 1, 'duplicate id': 1}.", mr: "reasons असं हवं: {'bad qty': 2, 'bad price': 1, 'duplicate id': 1}." } },
          ],
          variants: [
            {
              label: SUN,
              files: { 'data/orders.csv': SUNDAY },
              output: ['Read 7: 3 good, 4 skipped', '- missing item: 1', '- bad qty: 1', '- duplicate id: 1', '- bad price: 1'],
              checks: [{ expr: "len(good_orders) == 3 and skipped == 4 and reasons == {'missing item': 1, 'bad qty': 1, 'duplicate id': 1, 'bad price': 1}", message: { en: 'On Sunday: 3 good, 4 skipped, one of each reason.', mr: 'रविवारी: 3 चांगल्या, 4 skipped, प्रत्येक कारण एकदा.' } }],
            },
            {
              label: CLEAN,
              files: { 'data/orders.csv': CLEAN_DAY },
              output: ['Read 3: 3 good, 0 skipped'],
              checks: [{ expr: 'len(good_orders) == 3 and skipped == 0 and reasons == {}', message: { en: 'On the clean day nothing should be skipped and reasons should stay empty.', mr: 'स्वच्छ दिवशी काहीच skip होऊ नये आणि reasons रिकामी राहायला हवी.' } }],
            },
            {
              label: GREM,
              files: { 'data/orders.csv': GREMLIN_DAY },
              output: ['Read 3: 0 good, 3 skipped', '- bad qty: 1', '- bad price: 1', '- missing item: 1'],
              checks: [{ expr: "good_orders == [] and skipped == 3 and reasons == {'bad qty': 1, 'bad price': 1, 'missing item': 1}", message: { en: 'On the Gremlin\'s day every row is skipped: 0 good, 3 skipped.', mr: 'Gremlin च्या दिवशी प्रत्येक row skip होते: 0 चांगल्या, 3 skipped.' } }],
            },
          ],
          hints: [
            { en: "for row in rows: order = clean_order(row); reason = find_problem(order, seen_ids). Then if reason is None: two appends (good_orders and seen_ids with order['order_id']). else: skipped = skipped + 1 and reasons[reason] = reasons.get(reason, 0) + 1.", mr: "for row in rows: order = clean_order(row); reason = find_problem(order, seen_ids). मग if reason is None: दोन appends (good_orders आणि order['order_id'] सह seen_ids). else: skipped = skipped + 1 आणि reasons[reason] = reasons.get(reason, 0) + 1." },
            { en: "for row in rows:\n    order = clean_order(row)\n    reason = find_problem(order, seen_ids)\n    if reason is None:\n        good_orders.append(order)\n        seen_ids.append(order['order_id'])\n    else:\n        skipped = skipped + 1\n        reasons[reason] = reasons.get(reason, 0) + 1", mr: "for row in rows:\n    order = clean_order(row)\n    reason = find_problem(order, seen_ids)\n    if reason is None:\n        good_orders.append(order)\n        seen_ids.append(order['order_id'])\n    else:\n        skipped = skipped + 1\n        reasons[reason] = reasons.get(reason, 0) + 1" },
            { en: 'Add the id to seen_ids only for good orders, after the check.', mr: 'id फक्त चांगल्या ऑर्डर्ससाठी, check नंतर, seen_ids मध्ये टाका.' },
          ],
          successLine: { en: 'Hit! Good plus skipped equals the book, on every day, even the one the Gremlin wrote alone.', mr: 'Hit! good अधिक skipped म्हणजे पूर्ण वही, प्रत्येक दिवशी, Gremlin ने एकट्याने लिहिलेल्या दिवशीसुद्धा.' },
        },
        {
          kind: 'python',
          prompt: {
            en: 'Step 5, the report for the investors. Write revenue_by_item(orders): a dict of qty * price per item. Set total from it. Then print the report: the title, the order counts (ready), one line per item sorted A to Z like Bun Maska: ₹120 (use sorted(revenue)), and Total revenue: ₹295. On the Gremlin\'s day revenue is {} and the total is ₹0, with no crash.',
            mr: 'Step 5, investors साठी report. revenue_by_item(orders) लिहा: प्रत्येक item साठी qty * price ची dict. त्यावरून total काढा. मग report print करा: title, ऑर्डर्सची संख्या (तयार), A ते Z क्रमाने प्रत्येक item ची एक ओळ, उदा. Bun Maska: ₹120 (sorted(revenue) वापरा), आणि Total revenue: ₹295. Gremlin च्या दिवशी revenue {} आणि total ₹0, crash न होता.',
          },
          files: { 'data/orders.csv': MESSY },
          starter: `${READ_ROWS}
${HELPERS}
${CLEAN_ORDER}
${FIND_PROBLEM}
${SPLIT_LOOP}
def revenue_by_item(orders):
    """Money (qty x price) per item, as a dict."""
    # TODO
    return {}

revenue = revenue_by_item(good_orders)
total = 0  # TODO: the day's total, from revenue

print('ChaiCart daily report')
print(f"Orders: {len(good_orders)} good, {skipped} skipped")
# TODO: one line per item, A to Z, like: Bun Maska: ₹120
print(f"Total revenue: ₹{total}")
`,
          solution: `${READ_ROWS}
${HELPERS}
${CLEAN_ORDER}
${FIND_PROBLEM}
${SPLIT_LOOP}
def revenue_by_item(orders):
    """Money (qty x price) per item, as a dict."""
    revenue = {}
    for o in orders:
        revenue[o['item']] = revenue.get(o['item'], 0) + o['qty'] * o['price']
    return revenue

revenue = revenue_by_item(good_orders)
total = sum(revenue.values())

print('ChaiCart daily report')
print(f"Orders: {len(good_orders)} good, {skipped} skipped")
for item in sorted(revenue):
    print(f"{item}: ₹{revenue[item]}")
print(f"Total revenue: ₹{total}")
`,
          output: ['ChaiCart daily report', 'Orders: 6 good, 4 skipped', 'Bun Maska: ₹120', 'Cutting Chai: ₹15', 'Ginger Chai: ₹70', 'Masala Chai: ₹90', 'Total revenue: ₹295'],
          checks: [
            { expr: "revenue_by_item([]) == {}", message: { en: 'revenue_by_item([]) should return {} (a day with no good orders).', mr: 'revenue_by_item([]) ने {} return करायला हवं (एकही चांगली ऑर्डर नसलेला दिवस).' } },
            { expr: "revenue_by_item([{'item': 'Poha', 'qty': 2, 'price': 40}, {'item': 'Poha', 'qty': 1, 'price': 40}]) == {'Poha': 120}", message: { en: "Two Poha orders (2 x ₹40 and 1 x ₹40) should give {'Poha': 120}.", mr: "दोन Poha ऑर्डर्स (2 x ₹40 आणि 1 x ₹40) ने {'Poha': 120} मिळायला हवं." } },
            { expr: "total == sum(o['qty'] * o['price'] for o in good_orders) == 295", message: { en: 'total should be ₹295 and match the money from every good order.', mr: 'total ₹295 हवं आणि प्रत्येक चांगल्या ऑर्डरच्या पैशांशी जुळायला हवं.' } },
          ],
          mustUse: [{ pattern: 'def\\s+revenue_by_item\\s*\\(', message: { en: 'Keep the function revenue_by_item(orders).', mr: 'revenue_by_item(orders) हे function ठेवा.' } }],
          variants: [
            {
              label: SUN,
              files: { 'data/orders.csv': SUNDAY },
              output: ['ChaiCart daily report', 'Orders: 3 good, 4 skipped', 'Elaichi Chai: ₹50', 'Masala Chai: ₹90', 'Poha: ₹40', 'Total revenue: ₹180'],
              checks: [{ expr: "revenue == {'Elaichi Chai': 50, 'Masala Chai': 90, 'Poha': 40} and total == 180", message: { en: 'On Sunday: Elaichi Chai ₹50, Masala Chai ₹90, Poha ₹40, total ₹180.', mr: 'रविवारी: Elaichi Chai ₹50, Masala Chai ₹90, Poha ₹40, total ₹180.' } }],
            },
            {
              label: CLEAN,
              files: { 'data/orders.csv': CLEAN_DAY },
              output: ['ChaiCart daily report', 'Orders: 3 good, 0 skipped', 'Bun Maska: ₹40', 'Cutting Chai: ₹90', 'Total revenue: ₹130'],
              checks: [{ expr: "revenue == {'Cutting Chai': 90, 'Bun Maska': 40} and total == 130", message: { en: 'On the clean day: Bun Maska ₹40, Cutting Chai ₹90, total ₹130.', mr: 'स्वच्छ दिवशी: Bun Maska ₹40, Cutting Chai ₹90, total ₹130.' } }],
            },
            {
              label: GREM,
              files: { 'data/orders.csv': GREMLIN_DAY },
              output: ['ChaiCart daily report', 'Orders: 0 good, 3 skipped', 'Total revenue: ₹0'],
              checks: [{ expr: 'revenue == {} and total == 0', message: { en: 'On the Gremlin\'s day revenue should be {} and total 0, with no crash.', mr: 'Gremlin च्या दिवशी revenue {} आणि total 0 हवं, crash न होता.' } }],
            },
          ],
          hints: [
            { en: "Inside revenue_by_item: start revenue = {}, loop over orders, add o['qty'] * o['price'] with the .get counting trick, return revenue. Then total = sum(revenue.values()), and for item in sorted(revenue): print(f\"{item}: ₹{revenue[item]}\").", mr: "revenue_by_item च्या आत: revenue = {} ने सुरुवात, orders वर loop, .get च्या मोजणी युक्तीने o['qty'] * o['price'] जोडा, revenue return करा. मग total = sum(revenue.values()), आणि for item in sorted(revenue): print(f\"{item}: ₹{revenue[item]}\")." },
            { en: "def revenue_by_item(orders):\n    revenue = {}\n    for o in orders:\n        revenue[o['item']] = revenue.get(o['item'], 0) + o['qty'] * o['price']\n    return revenue\n\nrevenue = revenue_by_item(good_orders)\ntotal = sum(revenue.values())\n...\nfor item in sorted(revenue):\n    print(f\"{item}: ₹{revenue[item]}\")", mr: "def revenue_by_item(orders):\n    revenue = {}\n    for o in orders:\n        revenue[o['item']] = revenue.get(o['item'], 0) + o['qty'] * o['price']\n    return revenue\n\nrevenue = revenue_by_item(good_orders)\ntotal = sum(revenue.values())\n...\nfor item in sorted(revenue):\n    print(f\"{item}: ₹{revenue[item]}\")" },
            { en: 'The item lines go between the Orders line and the Total line.', mr: 'items च्या ओळी Orders ओळ आणि Total ओळ यांच्यामध्ये येतात.' },
          ],
          successLine: { en: 'Boss down! A daily report that survives any day the Gremlin can write, and every rupee is accounted for.', mr: 'बॉस हरला! Gremlin लिहू शकेल अशा कोणत्याही दिवशी टिकणारा daily report, आणि प्रत्येक रुपयाचा हिशोब लागलेला.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'Why does the report count skipped rows instead of quietly dropping them?', mr: 'report खराब rows गुपचूप टाकण्याऐवजी skipped rows का मोजतो?' },
        options: [
          { en: 'It makes the program run faster', mr: 'त्यामुळे program जलद चालतो' },
          { en: 'Python requires a counter in every loop', mr: 'Python ला प्रत्येक loop मध्ये counter लागतो' },
          { en: 'Skipped rows are added to the revenue later', mr: 'skipped rows नंतर revenue मध्ये जोडल्या जातात' },
          { en: 'So good + skipped can be checked against the rows read, and Sam knows what to fix', mr: 'म्हणजे good + skipped वाचलेल्या rows शी तपासता येतं, आणि Sam ला काय दुरुस्त करायचं ते कळतं' },
        ],
        answer: 3,
        explain: { en: 'Counting the rejects lets you reconcile: if good + skipped is not the number of rows, a row was lost. The reasons tell the business what to fix at the source.', mr: 'नाकारलेल्या मोजल्याने जुळवणी करता येते: good + skipped हे rows इतकं नसेल तर एखादी row हरवली. reasons business ला मुळात काय दुरुस्त करायचं ते सांगतात.' },
      },
      {
        q: { en: 'What does this return?', mr: 'हे काय return करतं?' },
        code: "' '.join('  masala   chai '.split()).title()",
        options: ["'  Masala   Chai '", "'Masala Chai'", "'masala chai'", "['Masala', 'Chai']"],
        answer: 1,
        explain: { en: 'split() with no argument drops the ends and splits on any run of spaces: [\'masala\', \'chai\']. join glues them with one space, and title fixes the capitals.', mr: 'argument नसलेला split() टोकं काढतो आणि कितीही spaces वर तोडतो: [\'masala\', \'chai\']. join त्यांना एका space ने जोडतो, आणि title capitals दुरुस्त करतो.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: "seen = []\nfor oid in ['C1', 'C2', 'C1', 'C3', 'C2']:\n    if oid in seen:\n        print('duplicate', oid)\n    else:\n        seen.append(oid)\nprint(len(seen))",
        options: [
          { en: 'duplicate C1, duplicate C2, then 3', mr: 'duplicate C1, duplicate C2, मग 3' },
          { en: 'duplicate C1, then 5', mr: 'duplicate C1, मग 5' },
          { en: 'Only 3', mr: 'फक्त 3' },
          { en: 'duplicate C2, then 4', mr: 'duplicate C2, मग 4' },
        ],
        answer: 0,
        explain: { en: 'C1 and C2 are remembered the first time and reported the second time. Only the three unique ids end up in seen.', mr: 'C1 आणि C2 पहिल्यांदा लक्षात ठेवले जातात आणि दुसऱ्यांदा report होतात. seen मध्ये फक्त तीन unique ids उरतात.' },
      },
      {
        q: { en: 'On the Gremlin\'s day there are no good orders. Which line crashes?', mr: 'Gremlin च्या दिवशी एकही चांगली ऑर्डर नाही. कोणती ओळ crash होते?' },
        options: [
          'total = sum(revenue.values())',
          'for item in sorted(revenue):',
          'average = total / len(good_orders)',
          "print(f\"Orders: {len(good_orders)} good\")",
        ],
        answer: 2,
        explain: { en: 'len(good_orders) is 0, so the division raises ZeroDivisionError. Summing or looping over an empty dict is fine. Check for zero before you divide.', mr: 'len(good_orders) 0 आहे, म्हणून भागाकाराने ZeroDivisionError येतो. रिकाम्या dict ची बेरीज किंवा त्यावर loop चालतो. भागण्याआधी शून्य तपासा.' },
      },
    ],
    recap: { line: { en: 'Read, clean, validate, count the rejects, aggregate, report: a pipeline of small functions where good + skipped always equals the book.', mr: 'वाचा, साफ करा, तपासा, नाकारलेल्या मोजा, बेरीज करा, report करा: छोट्या functions ची pipeline जिथे good + skipped नेहमी पूर्ण वहीइतकं.' }, icon: '📒' },
    outro: [
      { who: 'gremlin', mood: 'angry', text: { en: '>> no crash?? not even on my day? i wrote every row myself. ⌁⌁', mr: '>> crash नाही?? माझ्या दिवशीसुद्धा नाही? प्रत्येक row मी स्वतः लिहिली होती. ⌁⌁' } },
      { who: 'gremlin', mood: 'smug', text: { en: '>> fine. a notebook is small. wait till you meet a whole mandi of files. JSON with holes in it. hehe. ⌁', mr: '>> ठीक आहे. वही छोटी असते. files नी भरलेली अख्खी मंडी भेटू दे. भोकं असलेला JSON. हेहे. ⌁' } },
      { who: 'sam', mood: 'happy', text: { en: '₹295, and it matches the cash box to the rupee. And I finally know which pages of my notebook to fix. Thank you, {name}!', mr: '₹295, आणि गल्ल्याशी रुपयान् रुपया जुळतं. आणि आता मला कळलं वहीची कोणती पानं दुरुस्त करायची. धन्यवाद, {name}!' } },
      { who: 'rex', mood: 'happy', text: { en: 'Functions you tested, data you did not trust, numbers that reconcile. That is how a data engineer thinks.', mr: 'तपासलेली functions, ज्यावर विश्वास ठेवला नाही असा data, आणि जुळणारे आकडे. data engineer असाच विचार करतो.' } },
      { who: 'meera', mood: 'happy', text: { en: 'Rank up, {name}: Python Apprentice. Next stop, KisanMandi: real files, JSON and a lot more mess.', mr: 'नवीन रँक, {name}: Python Apprentice. पुढचा थांबा KisanMandi: खऱ्या files, JSON आणि आणखी खूप गोंधळ.' } },
    ],
  },
]
