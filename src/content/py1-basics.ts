import type { Lesson } from './types.ts'

// Python 1 at ChaiCart: values and variables, lists and loops, decisions with if.

// ── Y1.2 data: one week of daily order counts (a JSON list looks exactly like a Python list)
const WEEK = '[42, 38, 51, 45, 0, 60, 57]'
const WEEK_SHORT = '[30, 41, 0, 29, 55, 36]'
const WEEK_LONG = '[50, 52, 48, 61, 70, 66, 58, 45]'
const LOAD_WEEK = `import json
counts = json.load(open('data/week.json'))   # loads the list from the file (files come in Python 2)
`

// ── Y1.3 data: orders as small lists [order_id, item, qty, price]; null in JSON becomes None in Python
const LOAD_ORDERS = `import json
orders = json.load(open('data/orders.json'))   # a list of orders: [order_id, item, qty, price]
`
const ORDERS_3 = `[
  ["C101", "Masala chai", 2, 15],
  ["C102", "Ginger chai", 0, 20],
  ["C103", "Cutting chai", 3, null],
  ["C104", "Masala chai", 1, 15],
  ["C105", "Elaichi chai", 2, -20],
  ["C106", "Ginger chai", 4, 20]
]`
const ORDERS_3_HIDDEN = `[
  ["D201", "Masala chai", 1, 15],
  ["D202", "Cutting chai", -1, 10],
  ["D203", "Ginger chai", 2, null],
  ["D204", "Elaichi chai", 3, 20],
  ["D205", "Masala chai", 2, 15],
  ["D206", "Ginger chai", 1, null],
  ["D207", "Cutting chai", 5, 10],
  ["D208", "Masala chai", 2, -15]
]`
const ORDERS_3_CLEAN = `[
  ["E301", "Masala chai", 2, 15],
  ["E302", "Ginger chai", 1, 20],
  ["E303", "Cutting chai", 4, 10]
]`
const ORDERS_4 = `[
  ["C101", "Masala chai", 2, 15],
  ["C102", "Ginger chai", 0, 20],
  ["C103", "Cutting chai", 3, null],
  ["C104", "Masala chai", 1, 15],
  ["C105", "Elaichi chai", 2, -20],
  ["C106", "Ginger chai", 4, 20],
  ["C107", "", 2, 15]
]`
const ORDERS_4_HIDDEN = `[
  ["F401", "", 1, 15],
  ["F402", "Ginger chai", 2, 20],
  ["F403", "Masala chai", 0, null],
  ["F404", "Cutting chai", 6, 10],
  ["F405", "Elaichi chai", -3, 20],
  ["F406", "Masala chai", 1, 0],
  ["F407", "Ginger chai", 2, null]
]`

const COND_SANDBOX = `price = None
qty = 0
print(qty == 0)
print(price is None)
print(qty > 0 and price is not None)
print(not qty)`

const DIVIDE_SANDBOX = `cups = 7
riders = 2
print(cups / riders)
print(cups // riders)
print(cups % riders)
print(type(cups / riders))`

export const py1Lessons: Lesson[] = [
  // ───────────────────────── Y1.1 Values and variables
  {
    id: 'py1-1',
    code: 'Y1.1',
    level: 'basic',
    title: { en: 'Values and variables', mr: 'Values आणि variables' },
    skill: 'Numbers, strings, f-strings, type(), int/float/str conversions, arithmetic',
    realLife: {
      place: 'shop',
      title: { en: 'Kaka\'s jars and the bill', mr: 'काकांच्या बरण्या आणि बिल' },
      story: {
        en: 'Meera stops at the kirana shop near her building. Kaka keeps everything in jars with labels: "sugar", "tea leaves", "elaichi". When a jar is empty he refills it; the label stays the same, the contents change. She buys two masala chai packets at ₹15, one ginger chai at ₹20 and a plate of poha at ₹25. The price tags say "Rs 15", but Kaka never types "Rs" into his calculator. He types 15 + 15 + 20 + 25, gets 75, adds GST of 5 percent, and writes the total neatly with two decimals: ₹78.75. "Words on the tag, numbers in the calculator," he says.',
        mr: 'मीरा तिच्या इमारतीजवळच्या किराणा दुकानात थांबते. काका सगळं label लावलेल्या बरण्यांमध्ये ठेवतात: "साखर", "चहापत्ती", "वेलची". बरणी रिकामी झाली की ते पुन्हा भरतात; label तेच राहतं, आतलं बदलतं. ती ₹15 चे दोन masala chai पुडे, ₹20 चा एक ginger chai आणि ₹25 ची एक plate पोहे घेते. किमतीच्या tags वर "Rs 15" लिहिलेलं असतं, पण काका calculator मध्ये कधीच "Rs" टाइप करत नाहीत. ते 15 + 15 + 20 + 25 टाइप करतात, 75 येतात, 5 टक्के GST जोडतात, आणि एकूण रक्कम दोन दशांशांसह नीट लिहितात: ₹78.75. ते म्हणतात, "tag वर शब्द, calculator मध्ये आकडे."',
      },
      scene: {
        type: 'tally',
        unit: '₹',
        items: [
          { icon: '🍵', label: 'Masala chai × 2', mr: 'मसाला चहा × 2', value: 30 },
          { icon: '🫚', label: 'Ginger chai', mr: 'आल्याचा चहा', value: 20 },
          { icon: '🍛', label: 'Poha', mr: 'पोहे', value: 25 },
          { icon: '🧾', label: 'GST 5%', mr: 'GST 5%', value: 3.75 },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'My spreadsheet has a price column like "Rs 15", and the total formula just shows 0. And the bills never show GST the same way twice.', mr: 'माझ्या spreadsheet मध्ये "Rs 15" सारखा price column आहे, आणि total चा formula फक्त 0 दाखवतो. आणि bills वर GST कधीच दोनदा सारखा दिसत नाही.' } },
        { who: 'theo', mood: 'neutral', text: { en: 'Our app sends prices as text too: "15" in quotes. Looks like a number, is not a number.', mr: 'आमचं app सुद्धा prices text म्हणून पाठवतं: quotes मधलं "15". number सारखं दिसतं, पण number नाही.' } },
        { who: 'gremlin', mood: 'smug', text: { en: '"15" times 4 is "15151515". no error, just a very rich chai shop. hehe.', mr: '"15" गुणिले 4 म्हणजे "15151515". error नाही, फक्त एक खूप श्रीमंत चहाचं दुकान. हेहे.' } },
        { who: 'rex', mood: 'happy', text: { en: 'So we learn values first, {name}: numbers, text, the difference between them, and how to print a clean ₹ amount every time.', mr: 'म्हणून आधी values शिकूया, {name}: numbers, text, त्यांच्यातला फरक, आणि प्रत्येक वेळी स्वच्छ ₹ रक्कम कशी print करायची.' } },
      ],
      problem: { en: 'Prices arrive as text, so totals come out as 0, crash, or turn into nonsense like "15151515". GST is calculated and printed differently on every bill.', mr: 'prices text म्हणून येतात, त्यामुळे totals 0 येतात, crash होतात, किंवा "15151515" सारखा मूर्खपणा होतो. प्रत्येक bill वर GST वेगळ्या पद्धतीने काढला आणि print केला जातो.' },
      solution: { en: 'Store values in named variables, convert text to numbers with int() and float(), do the GST maths once in code, and print every amount with one f-string format: ₹, thousands commas and 2 decimals.', mr: 'values नाव असलेल्या variables मध्ये ठेवा, int() आणि float() ने text चं number करा, GST चं गणित code मध्ये एकदाच करा, आणि प्रत्येक रक्कम एकाच f-string format ने print करा: ₹, हजारांचे commas आणि 2 दशांश.' },
    },
    lesson: [
      { en: 'A variable is a label on a jar: price = 15 puts the value 15 in a jar called price. Read = as "store", not "equals". You can refill it any time: cups = cups + 1. Names use lowercase and underscores (cups_sold), cannot start with a digit and cannot have spaces.', mr: 'variable म्हणजे बरणीवरचं label: price = 15 म्हणजे price नावाच्या बरणीत 15 ठेवणं. = चा अर्थ "ठेवा" असा वाचा, "बरोबर" नाही. बरणी कधीही पुन्हा भरता येते: cups = cups + 1. नावं lowercase आणि underscores मध्ये लिहितात (cups_sold), ती अंकाने सुरू होऊ शकत नाहीत आणि त्यात spaces नसतात.' },
      { en: 'Every value has a type. int is a whole number (15), float has a decimal point (12.5), str is text in quotes ("Masala chai"), and bool is True or False. type(x) tells you which. "15" in quotes is text, even though it looks like a number. Data from files, spreadsheets and APIs very often arrives as text.', mr: 'प्रत्येक value चा एक type असतो. int म्हणजे पूर्ण संख्या (15), float मध्ये दशांश असतो (12.5), str म्हणजे quotes मधला text ("Masala chai"), आणि bool म्हणजे True किंवा False. type(x) कोणता ते सांगतो. quotes मधलं "15" हा text आहे, जरी number सारखा दिसला तरी. files, spreadsheets आणि APIs मधून येणारा डेटा बऱ्याचदा text म्हणूनच येतो.' },
      { en: 'Convert before you calculate: int("15") gives 15, float("12.50") gives 12.5, str(60) gives "60". Mixing types fails loudly: "Rs " + 5 is a TypeError, so write "Rs " + str(5). int("12.50") is a ValueError because of the decimal point; use float(). Worse is the quiet mistake: "15" * 4 gives "15151515" with no error at all. Silent wrong numbers are the data engineer\'s worst enemy.', mr: 'गणित करण्याआधी रूपांतर करा: int("15") देतो 15, float("12.50") देतो 12.5, str(60) देतो "60". types मिसळले की मोठ्याने fail होतं: "Rs " + 5 हा TypeError आहे, म्हणून "Rs " + str(5) लिहा. दशांश चिन्हामुळे int("12.50") हा ValueError आहे; float() वापरा. त्याहून वाईट म्हणजे शांत चूक: "15" * 4 कोणत्याही error शिवाय "15151515" देतो. शांतपणे चुकलेले आकडे हे data engineer चे सगळ्यात मोठे शत्रू.' },
      { en: 'Maths: + - * /, // for whole division, % for the remainder. / always gives a float: 10 / 2 is 5.0. GST of 5% is subtotal * 0.05. An f-string puts values inside text: f"Total: ₹{total:,.2f}" adds thousands commas and 2 decimals, so 261082.5 prints as ₹261,082.50. (Python groups by thousands. The Indian lakh style 2,61,082.50 needs extra code, so Kestrel\'s reports use this style.)', mr: 'गणित: + - * /, पूर्ण भागाकारासाठी //, बाकीसाठी %. / नेहमी float देतो: 10 / 2 म्हणजे 5.0. 5% GST म्हणजे subtotal * 0.05. f-string text मध्ये values बसवते: f"Total: ₹{total:,.2f}" हजारांचे commas आणि 2 दशांश जोडते, म्हणून 261082.5 हे ₹261,082.50 असं print होतं. (Python हजारांचे गट करतो. भारतीय लाखांची पद्धत 2,61,082.50 साठी जास्त code लागतो, म्हणून Kestrel चे reports ही पद्धत वापरतात.)' },
    ],
    syntax: {
      template: `item = "Masala chai"        # str: text
price = 15                  # int: whole number
cups = 3
subtotal = price * cups     # 45
gst = subtotal * 0.05       # float: 2.25
print(f"{item}: ₹{subtotal + gst:,.2f}")`,
      parts: [
        { code: 'price = 15', means: { en: 'store 15 in a variable called price (a labelled jar)', mr: 'price नावाच्या variable मध्ये 15 ठेवा (label लावलेली बरणी)' } },
        { code: 'int("15")  float("12.50")  str(60)', means: { en: 'convert text to a whole number, text to a decimal, a number to text', mr: 'text चं पूर्ण संख्येत, text चं दशांश संख्येत, number चं text मध्ये रूपांतर' } },
        { code: 'type(x)', means: { en: 'which kind of value x is: int, float, str, bool', mr: 'x कोणत्या प्रकारची value आहे: int, float, str, bool' } },
        { code: '/  //  %', means: { en: 'divide (always a float), whole division, remainder', mr: 'भागाकार (नेहमी float), पूर्ण भागाकार, बाकी' } },
        { code: 'f"₹{total:,.2f}"', means: { en: 'an f-string: the value inside { }, with thousands commas and 2 decimals', mr: 'f-string: { } मध्ये value, हजारांचे commas आणि 2 दशांश' } },
      ],
      example: [
        { code: 'price_text = "15"', note: { en: 'what the tag (and the app) gives you: text', mr: 'tag (आणि app) तुम्हाला देतो ते: text' } },
        { code: 'price = int(price_text)', note: { en: 'now a real number Kaka can add: 15', mr: 'आता काका बेरीज करू शकतील असा खरा number: 15' } },
        { code: 'bill = price * 2 + 20 + 25', note: { en: 'two masala chai, one ginger chai, one poha: 75', mr: 'दोन masala chai, एक ginger chai, एक पोहे: 75' } },
        { code: 'gst = bill * 0.05', note: { en: '5 percent GST: 3.75 (a float)', mr: '5 टक्के GST: 3.75 (float)' } },
        { code: 'print(f"Total: ₹{bill + gst:,.2f}")', note: { en: 'prints Total: ₹78.75, just like Kaka\'s neat bill', mr: 'Total: ₹78.75 print होतं, काकांच्या नीट bill सारखं' } },
        { code: 'print("Rs " + bill)', note: { en: 'TypeError: can only concatenate str (not "int") to str. Use str(bill) or an f-string.', mr: 'TypeError: can only concatenate str (not "int") to str. str(bill) किंवा f-string वापरा.' } },
      ],
      pitfall: { en: '"15" * 4 does not crash. It repeats the text and gives "15151515". Whenever a number came from a file, a form or an API, convert it with int() or float() before doing maths, and print type(x) when in doubt.', mr: '"15" * 4 crash होत नाही. ते text चार वेळा लिहून "15151515" देतं. number जेव्हा file, form किंवा API मधून आलेला असेल, तेव्हा गणिताआधी int() किंवा float() ने रूपांतर करा, आणि शंका असेल तर type(x) print करा.' },
    },
    practice: {
      intro: { en: 'ChaiCart\'s bills, one variable at a time. Press Run to see the output panel under the editor, then Submit.', mr: 'ChaiCart ची bills, एका वेळी एक variable. editor खालचा output panel पाहायला Run दाबा, मग Submit.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'A customer ordered 4 cups at ₹15. Create subtotal (price times cups), gst (5% of subtotal) and total (subtotal plus gst), then print:\nSubtotal: 60\nGST: 3.0\nTotal: 63.0\nUse the variables; do not type 60 or 63 yourself.', mr: 'एका ग्राहकाने ₹15 चे 4 cups मागवले. subtotal (price गुणिले cups), gst (subtotal चे 5%) आणि total (subtotal अधिक gst) बनवा, मग print करा:\nSubtotal: 60\nGST: 3.0\nTotal: 63.0\nvariables वापरा; 60 किंवा 63 स्वतः लिहू नका.' },
          starter: `price = 15
cups = 4
# make subtotal, gst and total here

`,
          solution: `price = 15
cups = 4
subtotal = price * cups
gst = subtotal * 0.05
total = subtotal + gst
print("Subtotal:", subtotal)
print("GST:", gst)
print("Total:", total)
`,
          output: ['Subtotal: 60', 'GST: 3.0', 'Total: 63.0'],
          checks: [
            { expr: 'subtotal == price * cups', message: { en: 'subtotal should be price * cups.', mr: 'subtotal म्हणजे price * cups हवं.' } },
            { expr: 'abs(gst - subtotal * 0.05) < 0.001', message: { en: 'gst should be 5% of subtotal: subtotal * 0.05.', mr: 'gst म्हणजे subtotal चे 5%: subtotal * 0.05.' } },
            { expr: 'abs(total - (subtotal + gst)) < 0.001', message: { en: 'total should be subtotal + gst.', mr: 'total म्हणजे subtotal + gst हवं.' } },
          ],
          mustNotUse: [{ pattern: '\\b6[03]\\b|\\b3\\.0\\b', message: { en: 'Do not type the answers (60, 63, 3.0). Let Python calculate them from price and cups.', mr: 'उत्तरं (60, 63, 3.0) स्वतः लिहू नका. price आणि cups वरून Python ला काढू द्या.' } }],
          hints: [
            { en: 'Each new variable is one line: name = calculation.', mr: 'प्रत्येक नवा variable म्हणजे एक ओळ: नाव = गणित.' },
            { en: 'subtotal = price * cups. 5% as a decimal is 0.05.', mr: 'subtotal = price * cups. 5% म्हणजे दशांशात 0.05.' },
            { en: 'Print with a comma: print("GST:", gst). Python shows 3.0 because multiplying by 0.05 makes a float.', mr: 'comma ने print करा: print("GST:", gst). 0.05 ने गुणल्यामुळे float बनतो, म्हणून Python 3.0 दाखवतो.' },
            { en: 'subtotal = price * cups\ngst = subtotal * 0.05\ntotal = subtotal + gst\nprint("Subtotal:", subtotal)\nprint("GST:", gst)\nprint("Total:", total)', mr: 'subtotal = price * cups\ngst = subtotal * 0.05\ntotal = subtotal + gst\nprint("Subtotal:", subtotal)\nprint("GST:", gst)\nprint("Total:", total)' },
          ],
          successLine: { en: 'Change price or cups and every line updates. That is why we use variables.', mr: 'price किंवा cups बदला आणि प्रत्येक ओळ बदलते. म्हणूनच variables वापरतात.' },
        },
        {
          kind: 'python',
          prompt: { en: 'The app sent the price as text. Fix the program so it prints:\n<class \'str\'>\n<class \'int\'>\nSubtotal: 60\nRs 60\nConvert price_text with int(), and fix the last line with str().', mr: 'app ने price text म्हणून पाठवली. program असा दुरुस्त करा की तो हे print करेल:\n<class \'str\'>\n<class \'int\'>\nSubtotal: 60\nRs 60\nprice_text चं int() ने रूपांतर करा, आणि शेवटची ओळ str() ने दुरुस्त करा.' },
          starter: `price_text = "15"        # the app sent the price as text
cups = 4
price = price_text       # fix: turn the text into a whole number
subtotal = price * cups
print(type(price_text))
print(type(price))
print("Subtotal:", subtotal)
print("Rs " + subtotal)  # this line will crash once subtotal is a real number
`,
          solution: `price_text = "15"        # the app sent the price as text
cups = 4
price = int(price_text)
subtotal = price * cups
print(type(price_text))
print(type(price))
print("Subtotal:", subtotal)
print("Rs " + str(subtotal))
`,
          output: ["<class 'str'>", "<class 'int'>", 'Subtotal: 60', 'Rs 60'],
          checks: [
            { expr: 'isinstance(price, int) and price == 15', message: { en: 'price should be the whole number 15: price = int(price_text).', mr: 'price ही पूर्ण संख्या 15 हवी: price = int(price_text).' } },
            { expr: 'subtotal == 60', message: { en: 'subtotal should be the number 60, not the text "15151515".', mr: 'subtotal हा number 60 हवा, "15151515" हा text नाही.' } },
          ],
          mustUse: [
            { pattern: 'int\\(', message: { en: 'Use int(...) to turn the text "15" into a number.', mr: 'text "15" चं number करायला int(...) वापरा.' } },
            { pattern: 'str\\(', message: { en: 'Use str(...) on the last line to turn the number back into text.', mr: 'शेवटच्या ओळीत number परत text करायला str(...) वापरा.' } },
          ],
          hints: [
            { en: 'Press Run first. The subtotal comes out as 15151515: text repeated 4 times. No error, just wrong.', mr: 'आधी Run दाबा. subtotal 15151515 येतं: text 4 वेळा लिहिलेला. error नाही, फक्त चूक.' },
            { en: 'Change line 3 to price = int(price_text). Run again: now the last line gives a TypeError.', mr: 'ओळ 3 बदलून price = int(price_text) करा. पुन्हा Run करा: आता शेवटची ओळ TypeError देते.' },
            { en: '"Rs " is text and subtotal is a number. Text can only be joined to text.', mr: '"Rs " हा text आहे आणि subtotal हा number. text फक्त text ला जोडता येतो.' },
            { en: 'price = int(price_text)\nprint("Rs " + str(subtotal))', mr: 'price = int(price_text)\nprint("Rs " + str(subtotal))' },
          ],
          successLine: { en: 'You caught a silent bug and a loud one. The silent one was the dangerous one.', mr: 'तुम्ही एक शांत bug आणि एक मोठ्याने ओरडणारा पकडला. धोकादायक शांत वालाच होता.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Sam\'s spreadsheet gives last month\'s sales as the text "248650.00". Fix the conversion (int() crashes on a decimal point), then print every amount with ₹, thousands commas and 2 decimals using f-strings:\nSales: ₹248,650.00\nGST 5%: ₹12,432.50\nTotal: ₹261,082.50', mr: 'Sam ची spreadsheet गेल्या महिन्याची sales "248650.00" अशा text मध्ये देते. रूपांतर दुरुस्त करा (दशांश चिन्हावर int() crash होतो), मग प्रत्येक रक्कम f-strings वापरून ₹, हजारांचे commas आणि 2 दशांशांसह print करा:\nSales: ₹248,650.00\nGST 5%: ₹12,432.50\nTotal: ₹261,082.50' },
          starter: `sales_text = "248650.00"     # from Sam's spreadsheet: text!
sales = int(sales_text)      # fix: this crashes, the text has a decimal point
gst = sales * 0.05
total = sales + gst
print("Sales:", sales)
print("GST 5%:", gst)
print("Total:", total)
`,
          solution: `sales_text = "248650.00"     # from Sam's spreadsheet: text!
sales = float(sales_text)
gst = sales * 0.05
total = sales + gst
print(f"Sales: ₹{sales:,.2f}")
print(f"GST 5%: ₹{gst:,.2f}")
print(f"Total: ₹{total:,.2f}")
`,
          output: ['Sales: ₹248,650.00', 'GST 5%: ₹12,432.50', 'Total: ₹261,082.50'],
          checks: [
            { expr: 'isinstance(sales, float) and sales == 248650', message: { en: 'sales should be a float made from the text: sales = float(sales_text).', mr: 'sales हा text पासून बनलेला float हवा: sales = float(sales_text).' } },
            { expr: 'abs(total - 261082.5) < 0.01', message: { en: 'total should be sales + gst.', mr: 'total म्हणजे sales + gst हवं.' } },
          ],
          mustUse: [
            { pattern: 'float\\(', message: { en: 'Use float(...) for text with a decimal point.', mr: 'दशांश असलेल्या text साठी float(...) वापरा.' } },
            { pattern: ':,\\.2f', message: { en: 'Format each amount with :,.2f inside the braces, like f"₹{sales:,.2f}".', mr: 'प्रत्येक रक्कम braces मध्ये :,.2f ने format करा, जसं f"₹{sales:,.2f}".' } },
          ],
          mustNotUse: [{ pattern: '261|12432|12,432', message: { en: 'Do not type the totals yourself. Format the variables.', mr: 'totals स्वतः लिहू नका. variables format करा.' } }],
          hints: [
            { en: 'Press Run: ValueError: invalid literal for int() with base 10. int() wants whole numbers only.', mr: 'Run दाबा: ValueError: invalid literal for int() with base 10. int() ला फक्त पूर्ण संख्या हव्या.' },
            { en: 'Use sales = float(sales_text). Then change each print into an f-string: f"Sales: ₹{sales}".', mr: 'sales = float(sales_text) वापरा. मग प्रत्येक print f-string मध्ये बदला: f"Sales: ₹{sales}".' },
            { en: 'Inside the braces, add :,.2f after the name. The comma adds thousands separators and .2f keeps 2 decimals.', mr: 'braces मध्ये नावानंतर :,.2f जोडा. comma हजारांचे विभाजक जोडतो आणि .2f दोन दशांश ठेवतो.' },
            { en: 'sales = float(sales_text)\nprint(f"Sales: ₹{sales:,.2f}")\nprint(f"GST 5%: ₹{gst:,.2f}")\nprint(f"Total: ₹{total:,.2f}")', mr: 'sales = float(sales_text)\nprint(f"Sales: ₹{sales:,.2f}")\nprint(f"GST 5%: ₹{gst:,.2f}")\nprint(f"Total: ₹{total:,.2f}")' },
          ],
          successLine: { en: 'One format for every amount. Sam\'s bills finally look the same every day.', mr: 'प्रत्येक रकमेसाठी एकच format. Sam ची bills अखेर रोज सारखी दिसतात.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Sam has 7 cups of chai and 2 riders. Press Run to see how Python divides. What do 7 // 2 and 7 % 2 give?', mr: 'Sam कडे 7 cups चहा आणि 2 riders आहेत. Python भागाकार कसा करतो ते पाहायला Run दाबा. 7 // 2 आणि 7 % 2 काय देतात?' },
          pythonSandbox: { code: DIVIDE_SANDBOX },
          options: [
            { en: '3.5 and 0', mr: '3.5 आणि 0' },
            { en: '3 and 1: each rider takes 3 cups, 1 cup is left over', mr: '3 आणि 1: प्रत्येक rider 3 cups नेतो, 1 cup उरतो' },
            { en: '4 and 1', mr: '4 आणि 1' },
            { en: '3.5 and 3.5', mr: '3.5 आणि 3.5' },
          ],
          correct: [1],
          explain: { en: '/ gives the exact answer 3.5, always as a float. // gives the whole part (3) and % gives the remainder (1). Useful for "how many full boxes" and "what is left over".', mr: '/ अचूक उत्तर 3.5 देतो, नेहमी float म्हणून. // पूर्ण भाग (3) देतो आणि % बाकी (1) देतो. "किती पूर्ण boxes" आणि "किती उरलं" यासाठी उपयोगी.' },
          hints: [
            { en: 'Press Run and match the lines of output to the lines of code.', mr: 'Run दाबा आणि output च्या ओळी code च्या ओळींशी जुळवा.' },
            { en: 'The second and third lines of output are the ones you need.', mr: 'output च्या दुसऱ्या आणि तिसऱ्या ओळी तुम्हाला हव्यात.' },
          ],
          successLine: { en: 'Three kinds of division, each with its own job.', mr: 'भागाकाराचे तीन प्रकार, प्रत्येकाचं स्वतःचं काम.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: 'price = "15"\nprint(type(price))',
        options: ["<class 'int'>", "<class 'str'>", "<class 'float'>", '15'],
        answer: 1,
        explain: { en: 'The quotes make it text, a str. It looks like a number but Python sees letters.', mr: 'quotes मुळे तो text, म्हणजे str आहे. number सारखा दिसतो पण Python ला ती अक्षरं दिसतात.' },
      },
      {
        q: { en: 'What happens here?', mr: 'इथे काय होतं?' },
        code: 'print("Rs " + 5)',
        options: ['Rs 5', 'Rs5', 'ValueError', 'TypeError: can only concatenate str (not "int") to str'],
        answer: 3,
        explain: { en: 'Text and a number cannot be joined with +. Use "Rs " + str(5) or f"Rs {5}".', mr: 'text आणि number + ने जोडता येत नाहीत. "Rs " + str(5) किंवा f"Rs {5}" वापरा.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: 'total = 1234.5\nprint(f"₹{total:,.2f}")',
        options: ['₹1,234.50', '₹1234.5', '₹1,234.5', '₹1.234,50'],
        answer: 0,
        explain: { en: 'The comma adds a thousands separator and .2f always shows exactly 2 decimals.', mr: 'comma हजारांचा विभाजक जोडतो आणि .2f नेहमी नेमके 2 दशांश दाखवतो.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: 'print(10 / 4)',
        options: ['2', '2.0', '2.5', '3'],
        answer: 2,
        explain: { en: '/ is true division and always gives a float: 2.5. Whole division would be 10 // 4, which is 2.', mr: '/ म्हणजे खरा भागाकार, तो नेहमी float देतो: 2.5. पूर्ण भागाकार म्हणजे 10 // 4, जो 2 देतो.' },
      },
    ],
    recap: { line: { en: 'Variables are labelled jars. Know the type (int, float, str), convert text with int() or float(), and print money with f"₹{x:,.2f}".', mr: 'variables म्हणजे label लावलेल्या बरण्या. type ओळखा (int, float, str), text चं int() किंवा float() ने रूपांतर करा, आणि पैसे f"₹{x:,.2f}" ने print करा.' }, icon: '🫙' },
  },

  // ───────────────────────── Y1.2 Lists and loops
  {
    id: 'py1-2',
    code: 'Y1.2',
    level: 'basic',
    title: { en: 'Lists and loops', mr: 'Lists आणि loops' },
    skill: 'Lists, indexing and slicing, len/sum/min/max, for loops, range, append',
    realLife: {
      place: 'home',
      title: { en: 'The doodhwala\'s card on the kitchen wall', mr: 'स्वयंपाकघरातल्या भिंतीवरचं दूधवाल्याचं card' },
      story: {
        en: 'In Meera\'s kitchen there is a card pinned to the wall. Every morning her mother writes how many litres the doodhwala gave: 2, 2, 3, then 0 on the day he did not come. At the end of the month she does not read the whole card aloud. She asks three questions: how many days, how many litres in total, and which day was the most. Then she makes a second row under the first: the money for each day, litres times ₹60. The first row stays as it is. Some months have 30 days and some have 31, and she never needs a new method for that.',
        mr: 'मीराच्या स्वयंपाकघरात भिंतीवर एक card लावलेलं आहे. रोज सकाळी तिची आई दूधवाल्याने किती लिटर दिलं ते लिहिते: 2, 2, 3, मग तो आला नाही त्या दिवशी 0. महिन्याच्या शेवटी ती पूर्ण card मोठ्याने वाचत नाही. ती तीन प्रश्न विचारते: किती दिवस, एकूण किती लिटर, आणि सगळ्यात जास्त कोणत्या दिवशी. मग ती पहिल्या ओळीखाली दुसरी ओळ बनवते: प्रत्येक दिवसाचे पैसे, लिटर गुणिले ₹60. पहिली ओळ आहे तशीच राहते. काही महिने 30 दिवसांचे असतात, काही 31 चे, आणि त्यासाठी तिला कधीच नवी पद्धत लागत नाही.',
      },
      scene: {
        type: 'tally',
        unit: 'L',
        items: [
          { icon: '🥛', label: 'Day 1', mr: 'दिवस 1', value: 2 },
          { icon: '🥛', label: 'Day 2', mr: 'दिवस 2', value: 2 },
          { icon: '🚫', label: 'Day 3 (no delivery)', mr: 'दिवस 3 (दूध आलं नाही)', value: 0 },
          { icon: '🥛', label: 'Day 4 (guests)', mr: 'दिवस 4 (पाहुणे)', value: 3 },
          { icon: '🥛', label: 'Day 5', mr: 'दिवस 5', value: 2 },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'I write each day\'s order count in the notebook. On Sunday I add the week on a calculator three times and get three different totals.', mr: 'मी रोजच्या orders ची संख्या वहीत लिहितो. रविवारी मी आठवड्याची बेरीज calculator वर तीनदा करतो आणि तीन वेगवेगळे totals येतात.' } },
        { who: 'rex', mood: 'happy', text: { en: 'Put the counts in a list and let Python add them. Total, best day, worst day, average, in four lines.', mr: 'counts एका list मध्ये ठेव आणि बेरीज Python ला करू दे. total, सगळ्यात चांगला दिवस, सगळ्यात वाईट दिवस, सरासरी, चार ओळींत.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'next week i\'m sending 8 days. or 6. good luck to anyone who typed counts[6]. hehe.', mr: 'पुढच्या आठवड्यात मी 8 दिवस पाठवणार. किंवा 6. counts[6] लिहिणाऱ्याला शुभेच्छा. हेहे.' } },
        { who: 'meera', mood: 'happy', text: { en: 'That is a classic edge case, {name}. Write code that works for any length, and the lab will test it on hidden weeks.', mr: 'हा क्लासिक edge case आहे, {name}. कोणत्याही लांबीसाठी चालेल असा code लिही, आणि lab तो लपवलेल्या आठवड्यांवर तपासेल.' } },
      ],
      problem: { en: 'Daily counts live in a notebook and get added by hand, so the weekly totals disagree. Weeks are not always 7 days in the data: a missing day or an extra day breaks any hard-coded sum.', mr: 'रोजचे counts वहीत आहेत आणि हाताने बेरीज होते, म्हणून आठवड्याचे totals जुळत नाहीत. डेटामध्ये आठवडा नेहमी 7 दिवसांचा नसतो: एक दिवस कमी किंवा जास्त असला की hard-code केलेली बेरीज बिघडते.' },
      solution: { en: 'Keep the counts in a Python list. Use len, sum, min and max for the summary, a for loop to walk every day, and append to build new lists. Nothing depends on the week being exactly 7 days.', mr: 'counts एका Python list मध्ये ठेवा. सारांशासाठी len, sum, min आणि max वापरा, प्रत्येक दिवसावरून जायला for loop, आणि नव्या lists बनवायला append. आठवडा नेमका 7 दिवसांचा असण्यावर काहीच अवलंबून नाही.' },
    },
    lesson: [
      { en: 'A list keeps many values in order: counts = [42, 38, 51]. It is the row on the doodh card, or one column of a SQL table. Positions (indexes) start at 0, so counts[0] is the first day and counts[-1] is always the last day, however long the list is. Asking for a position that does not exist is an IndexError.', mr: 'list अनेक values क्रमाने ठेवते: counts = [42, 38, 51]. ती दूधाच्या card वरची ओळ, किंवा SQL table चा एक column. जागा (indexes) 0 पासून सुरू होतात, म्हणून counts[0] म्हणजे पहिला दिवस आणि counts[-1] म्हणजे नेहमी शेवटचा दिवस, list कितीही लांब असो. नसलेली जागा मागितली तर IndexError येतो.' },
      { en: 'A slice takes a piece: counts[0:3] is the first three items (the start is included, the end is not), and counts[-2:] is the last two. len(counts) says how many, and sum, min and max do what their names say, like SUM, MIN and MAX in SQL. The average is sum(counts) / len(counts).', mr: 'slice एक तुकडा घेतो: counts[0:3] म्हणजे पहिल्या तीन items (सुरुवात धरली जाते, शेवट नाही), आणि counts[-2:] म्हणजे शेवटच्या दोन. len(counts) किती आहेत ते सांगतो, आणि sum, min आणि max नावाप्रमाणेच काम करतात, SQL मधल्या SUM, MIN आणि MAX सारखे. सरासरी म्हणजे sum(counts) / len(counts).' },
      { en: 'A for loop runs its indented lines once for every item: for c in counts: gives you each count in turn. range(n) gives 0, 1, ... up to n - 1, so for i in range(len(counts)) walks the positions, and the day number is i + 1.', mr: 'for loop त्याच्या आतल्या (indent केलेल्या) ओळी प्रत्येक item साठी एकदा चालवतो: for c in counts: तुम्हाला एकेक count क्रमाने देतो. range(n) देतो 0, 1, ... n - 1 पर्यंत, म्हणून for i in range(len(counts)) जागांवरून फिरतो, आणि दिवसाचा क्रमांक i + 1.' },
      { en: 'To build a new list, start empty and append inside the loop: revenue = [] then revenue.append(c * 20). Old list in, new list out, the old one untouched: that is a small transform, the T in ETL. Never hard-code "7 days". The lab re-runs your code on hidden weeks with 6 and 8 days.', mr: 'नवी list बनवायला रिकाम्या list ने सुरुवात करा आणि loop मध्ये append करा: revenue = [] मग revenue.append(c * 20). जुनी list आत, नवी list बाहेर, जुनी तशीच: हे एक छोटं transform, ETL मधला T. "7 दिवस" कधीच hard-code करू नका. lab तुमचा code 6 आणि 8 दिवसांच्या लपवलेल्या आठवड्यांवर पुन्हा चालवते.' },
    ],
    syntax: {
      template: `counts = [42, 38, 51, 45, 0, 60, 57]
print(counts[0], counts[-1])                   # 42 57
print(counts[0:3])                             # [42, 38, 51]
print(len(counts), sum(counts), max(counts))   # 7 293 60
revenue = []
for c in counts:
    revenue.append(c * 20)`,
      parts: [
        { code: '[42, 38, 51]', means: { en: 'a list: values in order, inside square brackets', mr: 'list: square brackets मध्ये क्रमाने values' } },
        { code: 'counts[0]  counts[-1]', means: { en: 'the first item and the last item', mr: 'पहिलं item आणि शेवटचं item' } },
        { code: 'counts[0:3]  counts[-2:]', means: { en: 'a slice: positions 0, 1, 2; and the last two', mr: 'slice: जागा 0, 1, 2; आणि शेवटचे दोन' } },
        { code: 'len  sum  min  max', means: { en: 'how many, total, smallest, biggest', mr: 'किती, बेरीज, सगळ्यात लहान, सगळ्यात मोठं' } },
        { code: 'for c in counts:', means: { en: 'run the indented lines once per item, with c holding the current one', mr: 'आतल्या ओळी प्रत्येक item साठी एकदा चालवा, c मध्ये सध्याचं item' } },
        { code: 'range(len(counts))', means: { en: 'the positions 0, 1, 2, ... for any length', mr: 'कोणत्याही लांबीसाठी जागा 0, 1, 2, ...' } },
        { code: 'revenue.append(x)', means: { en: 'add x to the end of the list', mr: 'list च्या शेवटी x जोडा' } },
      ],
      example: [
        { code: 'litres = [2, 2, 0, 3, 2]', note: { en: 'the doodh card: one number per day', mr: 'दूधाचं card: रोज एक आकडा' } },
        { code: 'print(litres[2])', note: { en: '0: the third day (index 2), when he did not come', mr: '0: तिसरा दिवस (index 2), तो आला नाही तेव्हा' } },
        { code: 'print(len(litres), sum(litres), max(litres))', note: { en: '5 9 3: days, total litres, the biggest day', mr: '5 9 3: दिवस, एकूण लिटर, सगळ्यात मोठा दिवस' } },
        { code: 'money = []', note: { en: 'an empty second row on the card', mr: 'card वरची रिकामी दुसरी ओळ' } },
        { code: 'for l in litres:', note: { en: 'go through the days one by one', mr: 'दिवसांवरून एक एक करून जा' } },
        { code: '    money.append(l * 60)', note: { en: '₹60 a litre: money becomes [120, 120, 0, 180, 120]', mr: '₹60 लिटर: money होते [120, 120, 0, 180, 120]' } },
      ],
      pitfall: { en: 'counts[7] on a 7-day list is an IndexError, because positions go from 0 to 6. And never write counts[6] to mean "the last day": next week may have 8 days. Use counts[-1] and len(counts).', mr: '7 दिवसांच्या list वर counts[7] म्हणजे IndexError, कारण जागा 0 ते 6 असतात. आणि "शेवटचा दिवस" म्हणायला कधीच counts[6] लिहू नका: पुढच्या आठवड्यात 8 दिवस असू शकतात. counts[-1] आणि len(counts) वापरा.' },
    },
    practice: {
      intro: { en: 'ChaiCart\'s daily order counts are in data/week.json, shown above the editor. The first two lines of each starter load them into a list called counts (you will learn files properly in Python 2). Your code must work for any number of days: Submit also runs it on hidden weeks.', mr: 'ChaiCart चे रोजचे order counts data/week.json मध्ये आहेत, editor वर दिसतात. प्रत्येक starter च्या पहिल्या दोन ओळी ते counts नावाच्या list मध्ये load करतात (files नीट Python 2 मध्ये शिकाल). तुमचा code कितीही दिवसांसाठी चालायला हवा: Submit तो लपवलेल्या आठवड्यांवरही चालवतो.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'Print the weekly summary for Sam, using len, sum, max and min (the average with 2 decimals):\nDays: 7\nTotal orders: 293\nBest day: 60\nWorst day: 0\nAverage: 41.86', mr: 'len, sum, max आणि min वापरून Sam साठी आठवड्याचा सारांश print करा (सरासरी 2 दशांशांसह):\nDays: 7\nTotal orders: 293\nBest day: 60\nWorst day: 0\nAverage: 41.86' },
          files: { 'data/week.json': WEEK },
          starter: `${LOAD_WEEK}print(counts)
# print the summary here
`,
          solution: `${LOAD_WEEK}print("Days:", len(counts))
print("Total orders:", sum(counts))
print("Best day:", max(counts))
print("Worst day:", min(counts))
print(f"Average: {sum(counts) / len(counts):.2f}")
`,
          output: ['Days: 7', 'Total orders: 293', 'Best day: 60', 'Worst day: 0', 'Average: 41.86'],
          variants: [
            { label: { en: 'A short week: 6 days', mr: 'छोटा आठवडा: 6 दिवस' }, files: { 'data/week.json': WEEK_SHORT }, output: ['Days: 6', 'Total orders: 191', 'Best day: 55', 'Worst day: 0', 'Average: 31.83'] },
            { label: { en: 'A long week: 8 days', mr: 'मोठा आठवडा: 8 दिवस' }, files: { 'data/week.json': WEEK_LONG }, output: ['Days: 8', 'Total orders: 450', 'Best day: 70', 'Worst day: 45', 'Average: 56.25'] },
          ],
          hints: [
            { en: 'Each line is print("Label:", function(counts)).', mr: 'प्रत्येक ओळ म्हणजे print("Label:", function(counts)).' },
            { en: 'len(counts) is the number of days; sum, max and min work the same way.', mr: 'len(counts) म्हणजे दिवसांची संख्या; sum, max आणि min तसेच चालतात.' },
            { en: 'For the average, divide sum by len inside an f-string and add :.2f.', mr: 'सरासरीसाठी f-string मध्ये sum ला len ने भागा आणि :.2f जोडा.' },
            { en: 'print("Days:", len(counts))\nprint("Total orders:", sum(counts))\nprint("Best day:", max(counts))\nprint("Worst day:", min(counts))\nprint(f"Average: {sum(counts) / len(counts):.2f}")', mr: 'print("Days:", len(counts))\nprint("Total orders:", sum(counts))\nprint("Best day:", max(counts))\nprint("Worst day:", min(counts))\nprint(f"Average: {sum(counts) / len(counts):.2f}")' },
          ],
          successLine: { en: 'Same code, three different weeks, all correct. Sam will never add on a calculator again.', mr: 'तोच code, तीन वेगळे आठवडे, सगळे बरोबर. Sam आता कधीच calculator वर बेरीज करणार नाही.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Print the first day, the last day, the first 3 days and the last 2 days, using indexes and slices:\nFirst day: 42\nLast day: 57\nFirst 3 days: [42, 38, 51]\nLast 2 days: [60, 57]', mr: 'indexes आणि slices वापरून पहिला दिवस, शेवटचा दिवस, पहिले 3 दिवस आणि शेवटचे 2 दिवस print करा:\nFirst day: 42\nLast day: 57\nFirst 3 days: [42, 38, 51]\nLast 2 days: [60, 57]' },
          files: { 'data/week.json': WEEK },
          starter: `${LOAD_WEEK}print("First day:", counts[1])
print("Last day:", counts[6])
`,
          solution: `${LOAD_WEEK}print("First day:", counts[0])
print("Last day:", counts[-1])
print("First 3 days:", counts[0:3])
print("Last 2 days:", counts[-2:])
`,
          output: ['First day: 42', 'Last day: 57', 'First 3 days: [42, 38, 51]', 'Last 2 days: [60, 57]'],
          variants: [
            { label: { en: 'A short week: 6 days', mr: 'छोटा आठवडा: 6 दिवस' }, files: { 'data/week.json': WEEK_SHORT }, output: ['First day: 30', 'Last day: 36', 'First 3 days: [30, 41, 0]', 'Last 2 days: [55, 36]'] },
            { label: { en: 'A long week: 8 days', mr: 'मोठा आठवडा: 8 दिवस' }, files: { 'data/week.json': WEEK_LONG }, output: ['First day: 50', 'Last day: 45', 'First 3 days: [50, 52, 48]', 'Last 2 days: [58, 45]'] },
          ],
          hints: [
            { en: 'Press Run. The starter prints 38 as the first day: Python counts from 0, not 1.', mr: 'Run दाबा. starter पहिला दिवस 38 दाखवतो: Python 0 पासून मोजतो, 1 पासून नाही.' },
            { en: 'counts[6] is the last day only when there are exactly 7 days. Negative indexes count from the end.', mr: 'counts[6] हा फक्त नेमके 7 दिवस असतील तेव्हाच शेवटचा दिवस. उणे indexes शेवटापासून मोजतात.' },
            { en: 'A slice [start:end] stops before end. Leave end empty to go to the end of the list.', mr: 'slice [start:end] end च्या आधी थांबतो. list च्या शेवटपर्यंत जायला end रिकामा ठेवा.' },
            { en: 'print("First day:", counts[0])\nprint("Last day:", counts[-1])\nprint("First 3 days:", counts[0:3])\nprint("Last 2 days:", counts[-2:])', mr: 'print("First day:", counts[0])\nprint("Last day:", counts[-1])\nprint("First 3 days:", counts[0:3])\nprint("Last 2 days:", counts[-2:])' },
          ],
          successLine: { en: 'counts[-1] survives any week length. Gremlin\'s 8-day week did nothing.', mr: 'counts[-1] कोणत्याही लांबीच्या आठवड्यात टिकतो. gremlin च्या 8 दिवसांच्या आठवड्याने काहीच बिघडलं नाही.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Print one line per day with a for loop, numbering the days from 1:\nDay 1: 42 orders\nDay 2: 38 orders\n... and so on for every day in the file.', mr: 'for loop ने प्रत्येक दिवसासाठी एक ओळ print करा, दिवसांचे क्रमांक 1 पासून:\nDay 1: 42 orders\nDay 2: 38 orders\n... आणि असंच file मधल्या प्रत्येक दिवसासाठी.' },
          files: { 'data/week.json': WEEK },
          starter: `${LOAD_WEEK}# loop over the positions with range(len(counts))
`,
          solution: `${LOAD_WEEK}for i in range(len(counts)):
    print(f"Day {i + 1}: {counts[i]} orders")
`,
          output: ['Day 1: 42 orders', 'Day 2: 38 orders', 'Day 3: 51 orders', 'Day 4: 45 orders', 'Day 5: 0 orders', 'Day 6: 60 orders', 'Day 7: 57 orders'],
          mustUse: [{ pattern: 'for\\s', message: { en: 'Use a for loop, so it works for any number of days.', mr: 'for loop वापरा, म्हणजे कितीही दिवसांसाठी चालेल.' } }],
          variants: [
            { label: { en: 'A short week: 6 days', mr: 'छोटा आठवडा: 6 दिवस' }, files: { 'data/week.json': WEEK_SHORT }, output: ['Day 1: 30 orders', 'Day 2: 41 orders', 'Day 3: 0 orders', 'Day 4: 29 orders', 'Day 5: 55 orders', 'Day 6: 36 orders'] },
            { label: { en: 'A long week: 8 days', mr: 'मोठा आठवडा: 8 दिवस' }, files: { 'data/week.json': WEEK_LONG }, output: ['Day 1: 50 orders', 'Day 2: 52 orders', 'Day 3: 48 orders', 'Day 4: 61 orders', 'Day 5: 70 orders', 'Day 6: 66 orders', 'Day 7: 58 orders', 'Day 8: 45 orders'] },
          ],
          hints: [
            { en: 'range(len(counts)) gives 0, 1, 2, ... one number per day.', mr: 'range(len(counts)) देतो 0, 1, 2, ... दर दिवसाला एक आकडा.' },
            { en: 'Inside the loop, the day number is i + 1 and the count is counts[i]. Indent the print with 4 spaces.', mr: 'loop च्या आत दिवसाचा क्रमांक i + 1 आणि count म्हणजे counts[i]. print 4 spaces ने indent करा.' },
            { en: 'An f-string can hold both: f"Day {i + 1}: {counts[i]} orders".', mr: 'f-string मध्ये दोन्ही बसतात: f"Day {i + 1}: {counts[i]} orders".' },
            { en: 'for i in range(len(counts)):\n    print(f"Day {i + 1}: {counts[i]} orders")', mr: 'for i in range(len(counts)):\n    print(f"Day {i + 1}: {counts[i]} orders")' },
          ],
          successLine: { en: 'Two lines of code, any number of days.', mr: 'code च्या दोन ओळी, कितीही दिवस.' },
        },
        {
          kind: 'python',
          prompt: { en: 'An average ChaiCart order is worth ₹20. Build a new list called revenue (each day\'s count times 20) with a loop and append, then print the list and the week\'s total:\n[840, 760, 1020, 900, 0, 1200, 1140]\nWeek revenue: ₹5,860', mr: 'ChaiCart ची सरासरी order ₹20 ची असते. loop आणि append वापरून revenue नावाची नवी list बनवा (प्रत्येक दिवसाचा count गुणिले 20), मग ती list आणि आठवड्याचं total print करा:\n[840, 760, 1020, 900, 0, 1200, 1140]\nWeek revenue: ₹5,860' },
          files: { 'data/week.json': WEEK },
          starter: `${LOAD_WEEK}revenue = []
# fill revenue with a for loop and append, then print it and its total
`,
          solution: `${LOAD_WEEK}revenue = []
for c in counts:
    revenue.append(c * 20)
print(revenue)
print(f"Week revenue: ₹{sum(revenue):,}")
`,
          output: ['[840, 760, 1020, 900, 0, 1200, 1140]', 'Week revenue: ₹5,860'],
          checks: [
            { expr: 'revenue == [c * 20 for c in counts]', message: { en: 'revenue should have one value per day: that day\'s count times 20.', mr: 'revenue मध्ये दर दिवसाला एक value हवी: त्या दिवसाचा count गुणिले 20.' } },
            { expr: 'len(counts) == len(revenue)', message: { en: 'revenue must have exactly as many days as counts.', mr: 'revenue मध्ये counts इतकेच दिवस हवेत.' } },
          ],
          mustUse: [{ pattern: '\\.append\\(', message: { en: 'Build the list with revenue.append(...) inside the loop.', mr: 'loop मध्ये revenue.append(...) ने list बनवा.' } }],
          variants: [
            { label: { en: 'A short week: 6 days', mr: 'छोटा आठवडा: 6 दिवस' }, files: { 'data/week.json': WEEK_SHORT }, output: ['[600, 820, 0, 580, 1100, 720]', 'Week revenue: ₹3,820'] },
            { label: { en: 'A long week: 8 days', mr: 'मोठा आठवडा: 8 दिवस' }, files: { 'data/week.json': WEEK_LONG }, output: ['[1000, 1040, 960, 1220, 1400, 1320, 1160, 900]', 'Week revenue: ₹9,000'] },
          ],
          hints: [
            { en: 'Loop over counts with for c in counts: and append one value each time.', mr: 'for c in counts: ने counts वरून loop करा आणि प्रत्येक वेळी एक value append करा.' },
            { en: 'Inside the loop: revenue.append(c * 20). Print after the loop, not inside it (no indent).', mr: 'loop च्या आत: revenue.append(c * 20). print loop नंतर करा, आत नाही (indent नको).' },
            { en: 'For the total, sum(revenue) inside an f-string with :, for the thousands comma.', mr: 'total साठी f-string मध्ये sum(revenue), हजारांच्या comma साठी :, सोबत.' },
            { en: 'for c in counts:\n    revenue.append(c * 20)\nprint(revenue)\nprint(f"Week revenue: ₹{sum(revenue):,}")', mr: 'for c in counts:\n    revenue.append(c * 20)\nprint(revenue)\nprint(f"Week revenue: ₹{sum(revenue):,}")' },
          ],
          successLine: { en: 'Old list in, new list out. Your first transform.', mr: 'जुनी list आत, नवी list बाहेर. तुमचं पहिलं transform.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: 'counts = [12, 18, 9, 30]\nprint(counts[1])',
        options: ['12', '18', '9', 'IndexError'],
        answer: 1,
        explain: { en: 'Indexes start at 0, so counts[1] is the second item: 18.', mr: 'indexes 0 पासून सुरू होतात, म्हणून counts[1] म्हणजे दुसरं item: 18.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: 'counts = [12, 18, 9, 30]\nprint(counts[1:3])',
        options: ['[12, 18, 9]', '[18, 9, 30]', '[12, 18]', '[18, 9]'],
        answer: 3,
        explain: { en: 'A slice includes the start (position 1) and stops before the end (position 3): positions 1 and 2.', mr: 'slice सुरुवात (जागा 1) धरतो आणि शेवटाच्या (जागा 3) आधी थांबतो: जागा 1 आणि 2.' },
      },
      {
        q: { en: 'Which numbers does this loop print?', mr: 'हा loop कोणते आकडे print करतो?' },
        code: 'for i in range(3):\n    print(i)',
        options: ['0, 1, 2', '1, 2, 3', '0, 1, 2, 3', '3'],
        answer: 0,
        explain: { en: 'range(3) starts at 0 and stops before 3. That matches list positions exactly, which is why range(len(x)) works.', mr: 'range(3) 0 पासून सुरू होतो आणि 3 च्या आधी थांबतो. ते list च्या जागांशी अगदी जुळतं, म्हणूनच range(len(x)) चालतं.' },
      },
      {
        q: { en: 'Why should a pipeline use sum(counts) / len(counts) instead of sum(counts) / 7 for the weekly average?', mr: 'आठवड्याच्या सरासरीसाठी pipeline ने sum(counts) / 7 ऐवजी sum(counts) / len(counts) का वापरावं?' },
        options: [
          { en: 'len is faster to type', mr: 'len टाइप करायला जलद आहे' },
          { en: 'Python does not allow dividing by 7', mr: 'Python 7 ने भागू देत नाही' },
          { en: 'The data may have 6 or 8 days; len always matches the real number of rows', mr: 'डेटामध्ये 6 किंवा 8 दिवस असू शकतात; len नेहमी rows च्या खऱ्या संख्येशी जुळतो' },
          { en: 'There is no difference', mr: 'काहीच फरक नाही' },
        ],
        answer: 2,
        explain: { en: 'Real data has missing and extra days. Code that counts what is actually there keeps working when the data changes shape.', mr: 'खऱ्या डेटामध्ये दिवस कमी-जास्त असतात. जे खरंच आहे ते मोजणारा code डेटाचा आकार बदलला तरी चालत राहतो.' },
      },
    ],
    recap: { line: { en: 'A list holds values in order. Index from 0, slice with [start:end], summarise with len/sum/min/max, loop with for, and build new lists with append. Never hard-code the length.', mr: 'list values क्रमाने ठेवते. 0 पासून index, [start:end] ने slice, len/sum/min/max ने सारांश, for ने loop, आणि append ने नव्या lists. लांबी कधीच hard-code करू नका.' }, icon: '🥛' },
  },

  // ───────────────────────── Y1.3 Decisions with if
  {
    id: 'py1-3',
    code: 'Y1.3',
    level: 'basic',
    title: { en: 'Decisions with if', mr: 'if ने निर्णय' },
    skill: 'Comparisons, if/elif/else, and/or/not, None and empty values, flagging bad rows',
    realLife: {
      place: 'bank',
      title: { en: 'The cashier and the cheques', mr: 'cashier आणि cheques' },
      story: {
        en: 'Meera deposits cheques for her mother at the bank. The cashier, Joshi madam, checks each one in the same order. No signature? It goes aside with a note: "not signed". No date? Aside: "no date". Amount zero or less? Aside: "bad amount". Only a cheque that passes every check goes to the counter. She never tears up a bad cheque and she never lets one slip through. At the end of the day her count is simple: cheques passed plus cheques set aside equals cheques received. If it does not add up, she looks again before going home.',
        mr: 'मीरा तिच्या आईसाठी bank मध्ये cheques भरते. cashier जोशी मॅडम प्रत्येक cheque एकाच क्रमाने तपासतात. सही नाही? तो बाजूला, एका नोंदीसह: "सही नाही". तारीख नाही? बाजूला: "तारीख नाही". रक्कम शून्य किंवा कमी? बाजूला: "चुकीची रक्कम". प्रत्येक तपासणी पार करणाराच cheque counter वर जातो. त्या खराब cheque कधीच फाडत नाहीत आणि एकही निसटू देत नाहीत. दिवसाच्या शेवटी त्यांचा हिशोब सोपा असतो: पास झालेले cheques अधिक बाजूला ठेवलेले cheques बरोबर आलेले cheques. जुळलं नाही, तर घरी जाण्याआधी त्या पुन्हा पाहतात.',
      },
      scene: {
        type: 'filter',
        rule: { en: 'Pass only cheques that are signed, dated and above ₹0', mr: 'फक्त सही केलेले, तारीख असलेले आणि ₹0 पेक्षा जास्त रकमेचे cheques पुढे' },
        items: [
          { icon: '✅', label: '₹500, signed, dated', mr: '₹500, सही, तारीख', pass: true },
          { icon: '✍️', label: '₹1,200, not signed', mr: '₹1,200, सही नाही', pass: false },
          { icon: '0️⃣', label: '₹0, signed, dated', mr: '₹0, सही, तारीख', pass: false },
          { icon: '✅', label: '₹2,000, signed, dated', mr: '₹2,000, सही, तारीख', pass: true },
          { icon: '📅', label: '₹750, no date', mr: '₹750, तारीख नाही', pass: false },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'sam', mood: 'worried', text: { en: 'Yesterday\'s total looked fine, but it was wrong. One order had quantity 0, one had no price, and one was a refund typed as -20.', mr: 'कालचं total बरं दिसत होतं, पण चुकीचं होतं. एका order ची quantity 0 होती, एकाला price च नव्हती, आणि एक refund -20 म्हणून लिहिला होता.' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'i hid a row with no price in there. your sum either crashes or lies. pick one. hehe.', mr: 'मी त्यात price नसलेली एक row लपवली. तुमची बेरीज एकतर crash होईल किंवा खोटं बोलेल. निवडा. हेहे.' } },
        { who: 'rex', mood: 'neutral', text: { en: 'Python makes decisions with if. Check every order, keep the good ones, set the bad ones aside with a reason.', mr: 'Python if ने निर्णय घेतो. प्रत्येक order तपास, चांगल्या ठेव, खराब कारणासह बाजूला ठेव.' } },
        { who: 'meera', mood: 'happy', text: { en: 'You already think in test cases, {name}: valid, zero, negative, missing. Now you write them in Python.', mr: 'तू आधीच test cases मध्ये विचार करतेस, {name}: valid, शून्य, उणे, गायब. आता ते Python मध्ये लिहायचे.' } },
      ],
      problem: { en: 'Bad rows slip into the total: zero quantities, missing prices, negative amounts. Some crash the code, and worse, some quietly change the number Sam reports.', mr: 'खराब rows total मध्ये घुसतात: शून्य quantities, गायब prices, उणे रकमा. काही code crash करतात, आणि त्याहून वाईट, काही Sam report करतो तो आकडा गुपचूप बदलतात.' },
      solution: { en: 'Validate each order with if, elif and else. Test missing values with is None, combine rules with and/or/not, count good and bad rows, and make sure they add up to the rows read.', mr: 'प्रत्येक order if, elif आणि else ने तपासा. गायब values is None ने तपासा, नियम and/or/not ने जोडा, चांगल्या आणि खराब rows मोजा, आणि त्यांची बेरीज वाचलेल्या rows इतकी आहे याची खात्री करा.' },
    },
    lesson: [
      { en: 'A comparison answers yes or no: == (equal), != (not equal), <, >, <=, >= give True or False. One = stores a value; two == compares. (In SQL a single = compares, so watch that habit.)', mr: 'comparison हो किंवा नाही असं उत्तर देतं: == (बरोबर), != (बरोबर नाही), <, >, <=, >= हे True किंवा False देतात. एक = value ठेवतो; दोन == तुलना करतात. (SQL मध्ये एकच = तुलना करतो, म्हणून ती सवय सांभाळा.)' },
      { en: 'if runs its indented block only when the condition is True. elif checks another condition when the ones above were False, and else catches everything left. Python checks from the top and runs only the first match, like Joshi madam\'s fixed order. Every if, elif and else line ends with a colon.', mr: 'condition True असेल तेव्हाच if त्याचा आतला block चालवतो. वरच्या conditions False असतील तेव्हा elif दुसरी condition तपासतो, आणि उरलेलं सगळं else पकडतो. Python वरून तपासतो आणि फक्त पहिली जुळणारीच चालवतो, जोशी मॅडमच्या ठरलेल्या क्रमासारखं. प्रत्येक if, elif आणि else ओळ colon ने संपते.' },
      { en: 'and needs both sides True, or needs at least one, not flips True and False. None means "no value at all", like NULL in SQL; test it with is None. In an if, Python treats 0, "" (empty text), [] and None as False, so if not item: catches an empty name. Careful: if not price would also flag a free sample priced 0; when 0 is a real value, use price is None.', mr: 'and ला दोन्ही बाजू True हव्यात, or ला किमान एक, not True आणि False उलटं करतो. None म्हणजे "कोणतीच value नाही", SQL मधल्या NULL सारखं; ते is None ने तपासा. if मध्ये Python 0, "" (रिकामा text), [] आणि None यांना False मानतो, म्हणून if not item: रिकामं नाव पकडतो. सावध: if not price हे 0 किमतीच्या मोफत sample ला पण पकडेल; जेव्हा 0 ही खरी value असेल, तेव्हा price is None वापरा.' },
      { en: 'Check None before comparing: None < 0 is a TypeError. price is not None and price >= 0 is safe, because and stops at the first False. The data engineer\'s pattern: check every row, keep the good, set the bad aside with a reason, never drop rows silently, and reconcile: good plus bad must equal the rows you read.', mr: 'तुलना करण्याआधी None तपासा: None < 0 हा TypeError आहे. price is not None and price >= 0 सुरक्षित आहे, कारण and पहिल्या False वर थांबतो. data engineer ची पद्धत: प्रत्येक row तपासा, चांगल्या ठेवा, खराब कारणासह बाजूला ठेवा, rows कधीच गुपचूप टाकू नका, आणि reconcile करा: चांगल्या अधिक खराब म्हणजे वाचलेल्या rows.' },
    ],
    syntax: {
      template: `for order_id, item, qty, price in orders:
    if price is None:
        print(order_id, "missing price")
    elif qty <= 0:
        print(order_id, "bad quantity")
    else:
        sales = sales + qty * price`,
      parts: [
        { code: 'for order_id, item, qty, price in orders:', means: { en: 'each order is a small list of 4 values; this gives each one a name, like columns', mr: 'प्रत्येक order म्हणजे 4 values ची छोटी list; हे प्रत्येकाला नाव देतं, columns सारखं' } },
        { code: 'if condition:', means: { en: 'run the indented block only when the condition is True', mr: 'condition True असेल तेव्हाच आतला block चालवा' } },
        { code: 'elif other:', means: { en: 'checked only when everything above was False', mr: 'वरचं सगळं False असेल तेव्हाच तपासलं जातं' } },
        { code: 'else:', means: { en: 'everything that matched nothing above', mr: 'वरच्या कशाशीच न जुळलेलं सगळं' } },
        { code: 'x is None', means: { en: 'x has no value at all (NULL in SQL)', mr: 'x ला कोणतीच value नाही (SQL मधलं NULL)' } },
        { code: 'and  or  not', means: { en: 'both, at least one, the opposite', mr: 'दोन्ही, किमान एक, उलटं' } },
      ],
      example: [
        { code: 'if not signed:', note: { en: 'first check: no signature', mr: 'पहिली तपासणी: सही नाही' } },
        { code: '    print("aside: not signed")', note: { en: 'set aside with a reason, never torn up', mr: 'कारणासह बाजूला, कधीच फाडायचं नाही' } },
        { code: 'elif date is None or amount <= 0:', note: { en: 'only checked if it was signed: no date, or zero or negative amount', mr: 'सही असेल तरच तपासलं जातं: तारीख नाही, किंवा शून्य किंवा उणे रक्कम' } },
        { code: '    print("aside: no date or bad amount")', note: { en: 'a missing date is None, like NULL in SQL', mr: 'गायब तारीख म्हणजे None, SQL मधल्या NULL सारखी' } },
        { code: 'else:', note: { en: 'matched nothing above: it passed every check', mr: 'वरच्या कशाशीच जुळलं नाही: प्रत्येक तपासणी पार केली' } },
        { code: '    print("pass to the counter")', note: { en: 'only good cheques reach the counter', mr: 'फक्त चांगले cheques counter वर पोहोचतात' } },
      ],
      pitfall: { en: 'Order matters. if price >= 0 and price is not None crashes on a missing price with TypeError, because the comparison runs first. Write price is not None and price >= 0. And if not price treats a real 0 like a missing value; use is None when you mean missing.', mr: 'क्रम महत्त्वाचा. if price >= 0 and price is not None हे गायब price वर TypeError ने crash होतं, कारण तुलना आधी चालते. price is not None and price >= 0 असं लिहा. आणि if not price खऱ्या 0 ला गायब value सारखं मानतं; गायब म्हणायचं असेल तेव्हा is None वापरा.' },
    },
    practice: {
      intro: { en: 'Time to be Joshi madam for ChaiCart\'s orders. Each order is [order_id, item, qty, price], and null in the JSON file becomes None in Python. Submit also runs your code on hidden order files with different bad rows.', mr: 'आता ChaiCart च्या orders साठी जोशी मॅडम व्हायचं. प्रत्येक order म्हणजे [order_id, item, qty, price], आणि JSON file मधलं null Python मध्ये None होतं. Submit तुमचा code वेगवेगळ्या खराब rows असलेल्या लपवलेल्या order files वरही चालवतो.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'An order came in with no price and quantity 0. Press Run. Which line printed False?', mr: 'price नसलेली आणि quantity 0 असलेली एक order आली. Run दाबा. कोणत्या ओळीने False print केलं?' },
          pythonSandbox: { code: COND_SANDBOX },
          options: ['print(qty == 0)', 'print(price is None)', 'print(qty > 0 and price is not None)', 'print(not qty)'],
          correct: [2],
          explain: { en: 'qty == 0 is True, price is None is True, and not qty is True because 0 counts as False. qty > 0 is False, so the and is False straight away: Python does not even look at the price.', mr: 'qty == 0 True आहे, price is None True आहे, आणि 0 False मानला जातो म्हणून not qty True आहे. qty > 0 False आहे, म्हणून and लगेच False होतं: Python price कडे बघतही नाही.' },
          hints: [
            { en: 'Press Run and match each output line to its code line.', mr: 'Run दाबा आणि output ची प्रत्येक ओळ तिच्या code ओळीशी जुळवा.' },
            { en: 'and needs both sides True. Is qty > 0 True here?', mr: 'and ला दोन्ही बाजू True हव्यात. इथे qty > 0 True आहे का?' },
          ],
          successLine: { en: 'True, True, False, True. You read conditions like Python does.', mr: 'True, True, False, True. Python सारख्या conditions तुम्ही वाचता.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Check one order with if / elif / else, in this order:\n1. price is None → print "C103: missing price"\n2. qty is 0 or less → print "C102: bad quantity"\n3. otherwise → print "C104: OK, ₹45" (qty times price)\nUse the real order_id. For the order in the file, the output is:\nC103: missing price', mr: 'एक order if / elif / else ने तपासा, या क्रमाने:\n1. price None असेल → "C103: missing price" print करा\n2. qty 0 किंवा कमी असेल → "C102: bad quantity" print करा\n3. नाहीतर → "C104: OK, ₹45" print करा (qty गुणिले price)\nखरा order_id वापरा. file मधल्या order साठी output आहे:\nC103: missing price' },
          files: { 'data/order.json': '["C103", "Cutting chai", 3, null]' },
          starter: `import json
order_id, item, qty, price = json.load(open('data/order.json'))   # one order from the file
print(order_id, item, qty, price)
# write the if / elif / else here
`,
          solution: `import json
order_id, item, qty, price = json.load(open('data/order.json'))   # one order from the file
if price is None:
    print(f"{order_id}: missing price")
elif qty <= 0:
    print(f"{order_id}: bad quantity")
else:
    print(f"{order_id}: OK, ₹{qty * price}")
`,
          output: ['C103: missing price'],
          variants: [
            { label: { en: 'An order with quantity 0', mr: 'quantity 0 असलेली order' }, files: { 'data/order.json': '["C102", "Ginger chai", 0, 20]' }, output: ['C102: bad quantity'] },
            { label: { en: 'A good order', mr: 'एक चांगली order' }, files: { 'data/order.json': '["C104", "Masala chai", 3, 15]' }, output: ['C104: OK, ₹45'] },
            { label: { en: 'No price and quantity 0 (the first rule wins)', mr: 'price नाही आणि quantity 0 (पहिला नियम जिंकतो)' }, files: { 'data/order.json': '["C108", "Masala chai", 0, null]' }, output: ['C108: missing price'] },
          ],
          hints: [
            { en: 'Press Run: the order prints as C103 Cutting chai 3 None. None is the missing price.', mr: 'Run दाबा: order C103 Cutting chai 3 None अशी print होते. None म्हणजे गायब price.' },
            { en: 'Start with if price is None: and an indented print. Then elif qty <= 0: and else:.', mr: 'if price is None: आणि त्याखाली indent केलेल्या print ने सुरुवात करा. मग elif qty <= 0: आणि else:.' },
            { en: 'Use f-strings with the real id: f"{order_id}: missing price". Remove the first print line.', mr: 'खऱ्या id सह f-strings वापरा: f"{order_id}: missing price". पहिली print ओळ काढून टाका.' },
            { en: 'if price is None:\n    print(f"{order_id}: missing price")\nelif qty <= 0:\n    print(f"{order_id}: bad quantity")\nelse:\n    print(f"{order_id}: OK, ₹{qty * price}")', mr: 'if price is None:\n    print(f"{order_id}: missing price")\nelif qty <= 0:\n    print(f"{order_id}: bad quantity")\nelse:\n    print(f"{order_id}: OK, ₹{qty * price}")' },
          ],
          successLine: { en: 'Four hidden orders, four right answers. The first matching rule wins.', mr: 'चार लपवलेल्या orders, चार बरोबर उत्तरं. पहिला जुळणारा नियम जिंकतो.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Now check every order in the file. For each bad order print its reason, checking in this order: missing price, then qty 0 or less ("bad quantity"), then price below 0 ("negative price"). Add up qty × price for the good orders only, then print the count and the sales:\nC102: bad quantity\nC103: missing price\nC105: negative price\nGood orders: 3\nSales: ₹125', mr: 'आता file मधली प्रत्येक order तपासा. प्रत्येक खराब order साठी तिचं कारण print करा, या क्रमाने तपासून: missing price, मग qty 0 किंवा कमी ("bad quantity"), मग price 0 पेक्षा कमी ("negative price"). फक्त चांगल्या orders साठी qty × price ची बेरीज करा, मग count आणि sales print करा:\nC102: bad quantity\nC103: missing price\nC105: negative price\nGood orders: 3\nSales: ₹125' },
          files: { 'data/orders.json': ORDERS_3 },
          starter: `${LOAD_ORDERS}good = 0
sales = 0
for order_id, item, qty, price in orders:
    sales = sales + qty * price    # crashes on the missing price, and counts bad rows too
print("Good orders:", good)
print(f"Sales: ₹{sales}")
`,
          solution: `${LOAD_ORDERS}good = 0
sales = 0
for order_id, item, qty, price in orders:
    if price is None:
        print(f"{order_id}: missing price")
    elif qty <= 0:
        print(f"{order_id}: bad quantity")
    elif price < 0:
        print(f"{order_id}: negative price")
    else:
        good = good + 1
        sales = sales + qty * price
print("Good orders:", good)
print(f"Sales: ₹{sales}")
`,
          output: ['C102: bad quantity', 'C103: missing price', 'C105: negative price', 'Good orders: 3', 'Sales: ₹125'],
          variants: [
            { label: { en: 'Hidden day: more bad rows (negative quantity, two missing prices)', mr: 'लपवलेला दिवस: जास्त खराब rows (उणे quantity, दोन गायब prices)' }, files: { 'data/orders.json': ORDERS_3_HIDDEN }, output: ['D202: bad quantity', 'D203: missing price', 'D206: missing price', 'D208: negative price', 'Good orders: 4', 'Sales: ₹155'] },
            { label: { en: 'Hidden day: every order is good', mr: 'लपवलेला दिवस: सगळ्या orders चांगल्या' }, files: { 'data/orders.json': ORDERS_3_CLEAN }, output: ['Good orders: 3', 'Sales: ₹90'] },
          ],
          hints: [
            { en: 'Press Run: TypeError, because qty * None cannot be calculated. That is Gremlin\'s hidden row.', mr: 'Run दाबा: TypeError, कारण qty * None काढता येत नाही. हीच gremlin ची लपवलेली row.' },
            { en: 'Inside the loop, use if price is None:, then elif qty <= 0:, then elif price < 0:, then else:. Indent each block 4 more spaces.', mr: 'loop च्या आत if price is None:, मग elif qty <= 0:, मग elif price < 0:, मग else: वापरा. प्रत्येक block आणखी 4 spaces ने indent करा.' },
            { en: 'Only the else block adds to good and sales. The two final prints stay outside the loop.', mr: 'फक्त else block good आणि sales मध्ये भर घालतो. शेवटच्या दोन print loop च्या बाहेरच राहतात.' },
            { en: 'for order_id, item, qty, price in orders:\n    if price is None:\n        print(f"{order_id}: missing price")\n    elif qty <= 0:\n        print(f"{order_id}: bad quantity")\n    elif price < 0:\n        print(f"{order_id}: negative price")\n    else:\n        good = good + 1\n        sales = sales + qty * price', mr: 'for order_id, item, qty, price in orders:\n    if price is None:\n        print(f"{order_id}: missing price")\n    elif qty <= 0:\n        print(f"{order_id}: bad quantity")\n    elif price < 0:\n        print(f"{order_id}: negative price")\n    else:\n        good = good + 1\n        sales = sales + qty * price' },
          ],
          successLine: { en: 'No crash, no lie. Every bad row named, and the sales count only real orders.', mr: 'crash नाही, खोटं नाही. प्रत्येक खराब row ला नाव मिळालं, आणि sales मध्ये फक्त खऱ्या orders.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Sort every order into two lists of order ids. An order is good only when the item name is not empty, qty is above 0, and price is not None and is 0 or more (a free sample at ₹0 is fine). Everything else goes in bad. Then reconcile:\nGood: [\'C101\', \'C104\', \'C106\']\nBad: [\'C102\', \'C103\', \'C105\', \'C107\']\nChecked 7 of 7\n(the first number is len(good) + len(bad), the second is len(orders))', mr: 'प्रत्येक order order ids च्या दोन lists मध्ये वाटा. item चं नाव रिकामं नसेल, qty 0 पेक्षा जास्त असेल, आणि price None नसून 0 किंवा जास्त असेल तेव्हाच order चांगली (₹0 चा मोफत sample चालतो). बाकी सगळं bad मध्ये. मग reconcile करा:\nGood: [\'C101\', \'C104\', \'C106\']\nBad: [\'C102\', \'C103\', \'C105\', \'C107\']\nChecked 7 of 7\n(पहिला आकडा len(good) + len(bad), दुसरा len(orders))' },
          files: { 'data/orders.json': ORDERS_4 },
          starter: `${LOAD_ORDERS}good = []
bad = []
for order_id, item, qty, price in orders:
    if price >= 0 and price is not None:    # careful: order matters here
        good.append(order_id)
print("Good:", good)
print("Bad:", bad)
`,
          solution: `${LOAD_ORDERS}good = []
bad = []
for order_id, item, qty, price in orders:
    if item and qty > 0 and price is not None and price >= 0:
        good.append(order_id)
    else:
        bad.append(order_id)
print("Good:", good)
print("Bad:", bad)
print("Checked", len(good) + len(bad), "of", len(orders))
`,
          output: ["Good: ['C101', 'C104', 'C106']", "Bad: ['C102', 'C103', 'C105', 'C107']", 'Checked 7 of 7'],
          checks: [
            { expr: 'len(good) + len(bad) == len(orders)', message: { en: 'Every order must land in good or bad: len(good) + len(bad) should equal len(orders).', mr: 'प्रत्येक order good किंवा bad मध्ये जायला हवी: len(good) + len(bad) हे len(orders) इतकं हवं.' } },
          ],
          mustUse: [{ pattern: '\\band\\b', message: { en: 'Combine the rules in one condition with and.', mr: 'नियम एकाच condition मध्ये and ने जोडा.' } }],
          variants: [
            { label: { en: 'Hidden day: empty name first, a free sample, missing prices', mr: 'लपवलेला दिवस: आधी रिकामं नाव, मोफत sample, गायब prices' }, files: { 'data/orders.json': ORDERS_4_HIDDEN }, output: ["Good: ['F402', 'F404', 'F406']", "Bad: ['F401', 'F403', 'F405', 'F407']", 'Checked 7 of 7'] },
            { label: { en: 'Hidden day: every order is good', mr: 'लपवलेला दिवस: सगळ्या orders चांगल्या' }, files: { 'data/orders.json': ORDERS_3_CLEAN }, output: ["Good: ['E301', 'E302', 'E303']", 'Bad: []', 'Checked 3 of 3'] },
          ],
          hints: [
            { en: 'Press Run: TypeError on C103. price >= 0 runs before the None check, and None cannot be compared.', mr: 'Run दाबा: C103 वर TypeError. None तपासण्याआधी price >= 0 चालतो, आणि None ची तुलना करता येत नाही.' },
            { en: 'Swap the order: price is not None and price >= 0. and stops at the first False, so None never reaches the comparison.', mr: 'क्रम बदला: price is not None and price >= 0. and पहिल्या False वर थांबतो, म्हणून None तुलनेपर्यंत पोहोचतच नाही.' },
            { en: 'Add item and qty > 0 at the front (an empty name counts as False), and an else: that appends to bad. Use is None, not "not price", so the ₹0 sample stays good.', mr: 'सुरुवातीला item and qty > 0 जोडा (रिकामं नाव False मानलं जातं), आणि bad मध्ये append करणारा else:. ₹0 चा sample चांगला राहावा म्हणून "not price" नाही, is None वापरा.' },
            { en: '    if item and qty > 0 and price is not None and price >= 0:\n        good.append(order_id)\n    else:\n        bad.append(order_id)\nprint("Good:", good)\nprint("Bad:", bad)\nprint("Checked", len(good) + len(bad), "of", len(orders))', mr: '    if item and qty > 0 and price is not None and price >= 0:\n        good.append(order_id)\n    else:\n        bad.append(order_id)\nprint("Good:", good)\nprint("Bad:", bad)\nprint("Checked", len(good) + len(bad), "of", len(orders))' },
          ],
          successLine: { en: 'Good plus bad equals rows read. Joshi madam would sign off on this.', mr: 'चांगल्या अधिक खराब बरोबर वाचलेल्या rows. जोशी मॅडम यावर सही करतील.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: 'price = None\nprint(price is None)',
        options: ['None', 'True', 'False', 'TypeError'],
        answer: 1,
        explain: { en: 'price holds no value, so price is None is True. That is how you test for a missing value, like IS NULL in SQL.', mr: 'price मध्ये कोणतीच value नाही, म्हणून price is None True आहे. गायब value अशीच तपासतात, SQL मधल्या IS NULL सारखी.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: 'qty = 0\nif qty:\n    print("has cups")\nelse:\n    print("empty")',
        options: ['has cups', '0', 'An error', 'empty'],
        answer: 3,
        explain: { en: 'In an if, 0 counts as False (so do "", [] and None). The else branch runs.', mr: 'if मध्ये 0 False मानला जातो ("", [] आणि None सुद्धा). else branch चालते.' },
      },
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: 'amount = -50\nif amount < 0:\n    print("refund")\nelif amount < 100:\n    print("small")\nelse:\n    print("big")',
        options: ['refund', 'small', 'refund and then small', 'big'],
        answer: 0,
        explain: { en: '-50 is also below 100, but Python runs only the first branch that matches. Once refund prints, the elif and else are skipped.', mr: '-50 हे 100 पेक्षाही कमी आहे, पण Python फक्त पहिली जुळणारी branch चालवतो. refund print झालं की elif आणि else वगळले जातात.' },
      },
      {
        q: { en: 'What is the difference between = and == in Python?', mr: 'Python मध्ये = आणि == यांत काय फरक आहे?' },
        options: [
          { en: 'There is no difference', mr: 'काहीच फरक नाही' },
          { en: '= compares numbers and == compares text', mr: '= numbers ची तुलना करतो आणि == text ची' },
          { en: '= stores a value in a variable; == compares two values and gives True or False', mr: '= variable मध्ये value ठेवतो; == दोन values ची तुलना करून True किंवा False देतो' },
          { en: '== is only allowed inside loops', mr: '== फक्त loops मध्येच चालतो' },
        ],
        answer: 2,
        explain: { en: 'qty = 0 stores; qty == 0 asks. Writing if qty = 0: is a SyntaxError in Python.', mr: 'qty = 0 ठेवतो; qty == 0 विचारतो. if qty = 0: लिहिलं तर Python मध्ये SyntaxError येतो.' },
      },
    ],
    recap: { line: { en: 'if/elif/else decide, the first match wins. Test missing values with is None, check None before comparing, set bad rows aside with a reason, and make good plus bad equal the rows read.', mr: 'if/elif/else निर्णय घेतात, पहिली जुळणारी जिंकते. गायब values is None ने तपासा, तुलनेआधी None तपासा, खराब rows कारणासह बाजूला ठेवा, आणि चांगल्या अधिक खराब म्हणजे वाचलेल्या rows.' }, icon: '🚦' },
  },
]
