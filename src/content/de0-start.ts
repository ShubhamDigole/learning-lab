import type { Lesson } from './types.ts'

// Data World prologue: what a data engineer does, then a first Python program.

const ORDERS_CSV = `order_id,item,qty,price
C101,Masala chai,2,15
C102,Ginger chai,1,20
C103,Cutting chai,3,10
C104,Elaichi chai,2,20
C105,Masala chai,4,15`

const MINI_PIPELINE = `# A tiny pipeline: extract, transform, load.
import csv
rows = list(csv.DictReader(open('data/orders.csv')))   # extract: read the raw file
total = 0
for row in rows:                                        # transform: text to numbers
    total = total + int(row['qty']) * int(row['price'])
print('Rows read:', len(rows))
print('Total sales Rs', total)                          # load: here we just print it`

const INDENT_CODE = `print("Orders today: 42")
    print("Cups of chai: 126")`

export const dataStartLessons: Lesson[] = [
  // ───────────────────────── D0.1 What a data engineer does
  {
    id: 'de0-1',
    code: 'D0.1',
    level: 'basic',
    title: { en: 'What a data engineer does', mr: 'डेटा इंजिनिअर काय करतो' },
    skill: 'Data pipelines, batch vs streaming, ETL vs ELT, and the roles around data',
    syntaxPlain: true,
    realLife: {
      place: 'warehouse',
      title: { en: 'How milk reaches your door', mr: 'दूध तुमच्या दारापर्यंत कसं पोहोचतं' },
      story: {
        en: 'Meera grew up near Kolhapur. Every morning and evening, farmers from twenty villages bring milk cans to the collection centre. A man with a lactometer tests every can for fat and water before it goes in. The milk is chilled in one huge steel tank, just as it came. A truck takes it to the dairy plant, where it is cleaned, packed into pouches and turned into curd and ghee. The cold store keeps everything sorted on labelled racks, and the shop near your house gets exactly what it ordered. The shopkeeper\'s board shows what sold today. Milk moves twice a day, in big batches. Tap water is different: it flows all the time. "That man with the lactometer," Meera says, "is the most important person in the whole chain. One can with water in it, and the whole tank is spoiled."',
        mr: 'मीरा कोल्हापूरजवळ लहानाची मोठी झाली. रोज सकाळी आणि संध्याकाळी वीस गावांचे शेतकरी दुधाचे कॅन संकलन केंद्रावर आणतात. lactometer घेतलेला एक माणूस प्रत्येक कॅन आत जाण्याआधी fat आणि पाण्यासाठी तपासतो. दूध जसं आलं तसंच एका मोठ्या steel टाकीत थंड केलं जातं. truck ते dairy plant ला नेतो, तिथे ते स्वच्छ होतं, पिशव्यांमध्ये भरलं जातं, आणि त्याचं दही आणि तूप बनतं. cold store मध्ये सगळं label लावलेल्या racks वर नीट लावलेलं असतं, आणि तुमच्या घराजवळच्या दुकानाला जेवढं मागवलं तेवढंच मिळतं. आज काय विकलं ते दुकानदाराचा board दाखवतो. दूध दिवसातून दोनदा, मोठ्या खेपांमध्ये जातं. नळाचं पाणी वेगळं: ते सतत वाहत असतं. मीरा म्हणते, "तो lactometer वाला माणूस या साखळीतला सगळ्यात महत्त्वाचा माणूस आहे. पाणी मिसळलेला एक कॅन, आणि पूर्ण टाकी खराब."',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🐄', label: 'Villages bring milk (sources)', mr: 'गावं दूध आणतात (sources)' },
          { icon: '🧪', label: 'Lactometer test (data quality)', mr: 'lactometer तपासणी (data quality)' },
          { icon: '🛢️', label: 'One big raw tank (data lake)', mr: 'एक मोठी कच्ची टाकी (data lake)' },
          { icon: '🏭', label: 'Plant packs and makes curd (transform)', mr: 'plant पॅक करतो, दही बनवतो (transform)' },
          { icon: '🧊', label: 'Sorted cold store (warehouse)', mr: 'नीट लावलेलं cold store (warehouse)' },
          { icon: '📋', label: 'Shop board: sold today (dashboard)', mr: 'दुकानाचा board: आज काय विकलं (dashboard)' },
        ],
      },
    },
    solves: {
      dialogue: [
        { who: 'rex', mood: 'happy', text: { en: 'Welcome to Kestrel Data, {name}. I\'m Rex. We build the pipes that carry data from where it is born to where people use it.', mr: 'Kestrel Data मध्ये स्वागत, {name}. मी Rex. डेटा जिथे जन्मतो तिथून लोक जिथे वापरतात तिथपर्यंत तो पोहोचवणारे पाईप आम्ही बनवतो.' } },
        { who: 'sam', mood: 'worried', text: { en: 'I\'m Sam from ChaiCart. We deliver chai across Pune. My notebook says 412 orders last week, the payment app says 398, and my spreadsheet says 430. Which one is true?', mr: 'मी ChaiCart चा Sam. आम्ही पुण्यात चहा डिलिव्हर करतो. माझी वही म्हणते गेल्या आठवड्यात 412 orders, payment app म्हणतं 398, आणि माझी spreadsheet म्हणते 430. खरं कोणतं?' } },
        { who: 'gremlin', mood: 'smug', text: { en: 'three numbers, zero truth. i love a business that runs on vibes. hehe.', mr: 'तीन आकडे, सत्य शून्य. अंदाजावर चालणारा business मला फार आवडतो. हेहे.' } },
        { who: 'meera', mood: 'happy', text: { en: 'This is why you are here. A tester never trusts a number until it reconciles. That habit is half of data engineering.', mr: 'म्हणूनच तू इथे आहेस. आकडे जुळेपर्यंत tester त्यांच्यावर विश्वास ठेवत नाही. ही सवय म्हणजे अर्धं data engineering.' } },
      ],
      problem: { en: 'ChaiCart\'s data lives in three places that never agree: the order app, the payment gateway and Sam\'s spreadsheets. Every report is a guess, and nobody knows which number to trust.', mr: 'ChaiCart चा डेटा तीन ठिकाणी आहे आणि ती कधीच जुळत नाहीत: order app, payment gateway आणि Sam च्या spreadsheets. प्रत्येक report म्हणजे अंदाज, आणि कोणत्या आकड्यावर विश्वास ठेवायचा ते कोणालाच माहीत नाही.' },
      solution: { en: 'A data pipeline: copy the raw data from every source into one data lake, clean and join it with code, load tidy tables into a warehouse, and put one dashboard on top. Quality checks at every step make sure the numbers reconcile.', mr: 'एक data pipeline: प्रत्येक source मधला कच्चा डेटा एका data lake मध्ये आणा, code ने तो साफ करा आणि जोडा, नीटनेटक्या tables warehouse मध्ये ठेवा, आणि वर एक dashboard. प्रत्येक पायरीवरचे quality checks आकडे जुळतात याची खात्री करतात.' },
    },
    lesson: [
      { en: 'A data pipeline moves data in stages. Sources are where data is born: the ChaiCart app, the payment gateway, Sam\'s spreadsheets. A data lake is a big, cheap store where raw files land exactly as they came (at Kestrel that is Amazon S3). Transformation cleans, joins and totals the data with code (Python today, Spark and AWS Glue later). The warehouse holds tidy tables ready for SQL, and dashboards show the result to people like Sam.', mr: 'data pipeline डेटा टप्प्याटप्प्याने पुढे नेते. sources म्हणजे डेटा जिथे जन्मतो: ChaiCart app, payment gateway, Sam च्या spreadsheets. data lake म्हणजे मोठं, स्वस्त भांडार, जिथे कच्च्या files जशा आल्या तशाच येऊन पडतात (Kestrel मध्ये ते Amazon S3). transformation म्हणजे code ने डेटा साफ करणं, जोडणं आणि बेरीज करणं (आज Python, नंतर Spark आणि AWS Glue). warehouse मध्ये SQL साठी तयार नीटनेटक्या tables असतात, आणि dashboards तो निकाल Sam सारख्या लोकांना दाखवतात.' },
      { en: 'Batch means data moves in chunks on a schedule, like milk twice a day: "every night at 2 am, process yesterday\'s orders". Streaming means data flows all the time, like tap water: each payment is checked within seconds. Most reports are batch. Fraud alerts and live delivery maps need streaming.', mr: 'batch म्हणजे डेटा ठरलेल्या वेळी खेपांमध्ये जातो, दिवसातून दोनदा जाणाऱ्या दुधासारखा: "रोज रात्री 2 वाजता कालच्या orders process करा". streaming म्हणजे डेटा सतत वाहतो, नळाच्या पाण्यासारखा: प्रत्येक payment काही सेकंदांत तपासलं जातं. बहुतेक reports batch असतात. fraud alerts आणि live delivery maps ला streaming लागतं.' },
      { en: 'ETL is Extract, Transform, Load: clean the data first, then load it into the warehouse. ELT is Extract, Load, Transform: load the raw data first, then clean it inside the warehouse with SQL. Modern cloud teams often use ELT because storage is cheap and the raw copy is always there if a cleaning rule was wrong.', mr: 'ETL म्हणजे Extract, Transform, Load: आधी डेटा साफ करा, मग warehouse मध्ये load करा. ELT म्हणजे Extract, Load, Transform: आधी कच्चा डेटा load करा, मग warehouse मध्येच SQL ने तो साफ करा. आजच्या cloud teams बऱ्याचदा ELT वापरतात, कारण storage स्वस्त आहे आणि cleaning चा एखादा नियम चुकला तरी कच्ची प्रत नेहमी असते.' },
      { en: 'Three roles share the data. The data engineer builds and runs the pipeline, the roads. The data analyst drives on those roads: asks business questions with SQL and charts. The data scientist builds models that predict, like "how many orders will come on Diwali?". Bad data breaks all three, so a data engineer tests like a QA: counts match the source, no duplicates, no missing prices, no negative amounts. Your tester\'s eye is a superpower here.', mr: 'डेटा तीन भूमिका मिळून वापरतात. data engineer pipeline बनवतो आणि चालवतो, म्हणजे रस्ते. data analyst त्या रस्त्यांवरून गाडी चालवतो: SQL आणि charts ने business चे प्रश्न सोडवतो. data scientist अंदाज बांधणारे models बनवतो, जसं "दिवाळीला किती orders येतील?". खराब डेटा तिघांनाही बिघडवतो, म्हणून data engineer QA सारखं तपासतो: source शी count जुळतो, duplicates नाहीत, किंमत गायब नाही, उणे रक्कम नाही. तुझी tester ची नजर इथे superpower आहे.' },
    ],
    syntax: {
      template: '📱 Sources     app orders, payment gateway, Sam\'s spreadsheets\n   │  extract\n🪣 Data lake   raw files, kept as they came (Amazon S3)\n   │  transform\n⚙️ Transform   clean, join, total (Python, Spark, AWS Glue)\n   │  load\n🏛️ Warehouse   tidy tables, ready for SQL\n   │\n📊 Dashboard   "orders today" for Sam',
      parts: [
        { code: 'Sources', means: { en: 'where data is born: apps, payment gateways, spreadsheets', mr: 'डेटा जिथे जन्मतो: apps, payment gateways, spreadsheets' } },
        { code: 'Data lake (S3)', means: { en: 'cheap storage for raw files, untouched, so you can always start again', mr: 'कच्च्या files साठी स्वस्त storage, न बदलता, म्हणजे पुन्हा सुरुवात कधीही करता येते' } },
        { code: 'Transform', means: { en: 'code that cleans, fixes types, removes duplicates, joins and totals', mr: 'साफ करणारा, types दुरुस्त करणारा, duplicates काढणारा, जोडणारा आणि बेरीज करणारा code' } },
        { code: 'Warehouse', means: { en: 'tidy tables built for fast SQL questions', mr: 'जलद SQL प्रश्नांसाठी बनवलेल्या नीटनेटक्या tables' } },
        { code: 'Dashboard', means: { en: 'the charts people read every morning', mr: 'लोक रोज सकाळी वाचतात ते charts' } },
        { code: 'Batch / Streaming', means: { en: 'on a schedule in chunks, or all the time as it happens', mr: 'ठरलेल्या वेळी खेपांमध्ये, किंवा घडतं तसं सतत' } },
      ],
      example: [
        { code: 'Villages and milk cans  = sources', note: { en: 'ChaiCart app, payment gateway, Sam\'s sheets', mr: 'ChaiCart app, payment gateway, Sam च्या sheets' } },
        { code: 'Lactometer test         = data quality check', note: { en: 'stop bad rows before they spoil the tank', mr: 'खराब rows टाकी खराब करण्याआधीच थांबवा' } },
        { code: 'Big raw tank            = data lake on S3', note: { en: 'everything lands here first, as it came', mr: 'सगळं आधी इथे, जसं आलं तसं' } },
        { code: 'Dairy plant             = transform', note: { en: 'Python today, Spark and Glue later', mr: 'आज Python, नंतर Spark आणि Glue' } },
        { code: 'Cold store racks        = warehouse', note: { en: 'sorted and labelled, ready to pick', mr: 'लावलेलं आणि label केलेलं, उचलायला तयार' } },
        { code: 'Shop board              = dashboard', note: { en: 'Sam reads "orders today" here', mr: 'Sam इथे "आजच्या orders" वाचतो' } },
      ],
      pitfall: { en: 'A pipeline that runs without errors can still be wrong. A pretty dashboard on top of duplicate rows just shows wrong numbers beautifully. Check the data, not only the code.', mr: 'error शिवाय चालणारी pipeline सुद्धा चुकीची असू शकते. duplicate rows वरचा सुंदर dashboard म्हणजे चुकीचे आकडे सुंदरपणे दाखवणं. फक्त code नाही, डेटा तपासा.' },
    },
    practice: {
      intro: { en: 'No writing yet. Run a tiny pipeline, then match ideas to ChaiCart\'s world. For the first step, press Run and read the output panel under the editor.', mr: 'अजून लिहायचं नाही. एक छोटी pipeline चालवा, मग कल्पना ChaiCart च्या जगाशी जोडा. पहिल्या step साठी Run दाबा आणि editor खालचा output panel वाचा.' },
      steps: [
        {
          kind: 'choice',
          prompt: { en: 'Here is a whole pipeline in a few lines of Python. It reads ChaiCart\'s orders file (shown above the editor), turns text into numbers, and prints the total. Press Run. What total sales did it print?', mr: 'ही Python च्या काही ओळींमधली पूर्ण pipeline आहे. ती ChaiCart ची orders file (editor वर दिसते) वाचते, text चं numbers मध्ये रूपांतर करते, आणि एकूण print करते. Run दाबा. एकूण sales किती print झाली?' },
          pythonSandbox: { code: MINI_PIPELINE, files: { 'data/orders.csv': ORDERS_CSV } },
          options: ['Total sales Rs 180', 'Total sales Rs 12', 'Total sales Rs 80', { en: 'It stopped with an error', mr: 'ते error देऊन थांबलं' }],
          correct: [0],
          explain: { en: 'Each row is qty times price: 30 + 20 + 30 + 40 + 60 = 180. Extract (read the file), transform (text to numbers, multiply, add), load (print). Real pipelines do the same, with more rows and more checks.', mr: 'प्रत्येक row म्हणजे qty गुणिले price: 30 + 20 + 30 + 40 + 60 = 180. extract (file वाचा), transform (text ते numbers, गुणाकार, बेरीज), load (print). खऱ्या pipelines हेच करतात, जास्त rows आणि जास्त checks सोबत.' },
          hints: [
            { en: 'Press Run and look at the output panel under the editor.', mr: 'Run दाबा आणि editor खालचा output panel पाहा.' },
            { en: '12 is the number of cups (2+1+3+2+4). The code multiplies qty by price.', mr: '12 म्हणजे cups ची संख्या (2+1+3+2+4). code qty ला price ने गुणतो.' },
          ],
          successLine: { en: 'Your first pipeline run: five rows in, one trusted number out.', mr: 'तुमचा पहिला pipeline run: पाच rows आत, एक विश्वासार्ह आकडा बाहेर.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Every night the payment gateway sends a raw file of the day\'s payments. Rex wants it saved exactly as it came, never edited, so the team can re-run a cleaning step if a rule was wrong. Where does it go first?', mr: 'रोज रात्री payment gateway दिवसभराच्या payments ची एक कच्ची file पाठवतो. Rex ला ती जशी आली तशीच, कधीही न बदलता जपायची आहे, म्हणजे cleaning चा नियम चुकला तर team ती पायरी पुन्हा चालवू शकेल. ती आधी कुठे जाते?' },
          options: [
            { en: 'Straight onto Sam\'s dashboard', mr: 'थेट Sam च्या dashboard वर' },
            { en: 'Into the data lake on Amazon S3', mr: 'Amazon S3 वरच्या data lake मध्ये' },
            { en: 'Into Sam\'s notebook, copied by hand', mr: 'Sam च्या वहीत, हाताने उतरवून' },
            { en: 'Nowhere: delete it after reading', mr: 'कुठेच नाही: वाचून delete करायची' },
          ],
          correct: [1],
          explain: { en: 'The data lake is the big raw tank. Files land there untouched, cheaply, and stay there. Every later step reads from it, so a mistake downstream can always be fixed by re-running from the raw copy.', mr: 'data lake म्हणजे मोठी कच्ची टाकी. files तिथे न बदलता, स्वस्तात येऊन पडतात आणि तिथेच राहतात. पुढची प्रत्येक पायरी तिथून वाचते, म्हणून पुढे झालेली चूक कच्च्या प्रतीवरून पुन्हा चालवून नेहमी दुरुस्त करता येते.' },
          hints: [
            { en: 'In the milk story, where does milk go before the plant touches it?', mr: 'दुधाच्या गोष्टीत plant हात लावण्याआधी दूध कुठे जातं?' },
            { en: 'Raw, untouched, cheap storage has a name in this lesson. S3 is Amazon\'s version.', mr: 'कच्च्या, न बदललेल्या, स्वस्त storage ला या lesson मध्ये एक नाव आहे. S3 ही Amazon ची आवृत्ती.' },
          ],
          successLine: { en: 'Raw first, always. The lake is your safety net.', mr: 'आधी कच्चा, नेहमी. lake म्हणजे तुमचं safety net.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Which ChaiCart need really calls for streaming instead of a nightly batch?', mr: 'ChaiCart ची कोणती गरज रात्रीच्या batch ऐवजी खरंच streaming मागते?' },
          options: [
            { en: 'A monthly report of chai sold per area', mr: 'प्रत्येक भागात विकलेल्या चहाचा मासिक report' },
            { en: 'Last year\'s sales for the tax filing', mr: 'tax filing साठी गेल्या वर्षीची sales' },
            { en: 'Blocking a suspicious UPI payment within seconds, before the rider leaves', mr: 'rider निघण्याआधी, काही सेकंदांत संशयास्पद UPI payment थांबवणं' },
            { en: 'A weekly email to Sam with the top 5 items', mr: 'top 5 items चा Sam ला जाणारा साप्ताहिक email' },
          ],
          correct: [2],
          explain: { en: 'Only the fraud check cannot wait until 2 am. Monthly, yearly and weekly reports are happy with batch, which is simpler and cheaper.', mr: 'फक्त fraud check रात्री 2 पर्यंत थांबू शकत नाही. मासिक, वार्षिक आणि साप्ताहिक reports साठी batch पुरेसं आहे, आणि ते सोपं आणि स्वस्त आहे.' },
          hints: [
            { en: 'Streaming is tap water: it matters when seconds count.', mr: 'streaming म्हणजे नळाचं पाणी: जेव्हा सेकंद महत्त्वाचे असतात तेव्हा ते लागतं.' },
            { en: 'Three of these can happily wait until tomorrow morning. Which one cannot?', mr: 'यातल्या तीन गोष्टी उद्या सकाळपर्यंत आरामात थांबू शकतात. कोणती नाही?' },
          ],
          successLine: { en: 'Batch by default, streaming when seconds matter.', mr: 'सहसा batch, सेकंद महत्त्वाचे असतील तेव्हा streaming.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'Sam asks: "Which chai sold the most in Kothrud last month?" Who usually answers this, with a SQL query and a chart, once the pipeline is in place?', mr: 'Sam विचारतो: "गेल्या महिन्यात कोथरूडमध्ये कोणता चहा सगळ्यात जास्त विकला?" pipeline तयार झाल्यावर SQL query आणि chart ने याचं उत्तर सहसा कोण देतं?' },
          options: [
            { en: 'The data engineer, by rebuilding the pipeline', mr: 'data engineer, pipeline पुन्हा बांधून' },
            { en: 'The data scientist, by training a model', mr: 'data scientist, model train करून' },
            { en: 'The payment gateway', mr: 'payment gateway' },
            { en: 'The data analyst', mr: 'data analyst' },
          ],
          correct: [3],
          explain: { en: 'A question about what already happened, answered with SQL and a chart, is analyst work. The engineer built the roads that make the answer quick and correct. The scientist predicts the future, like next month\'s orders.', mr: 'आधीच घडलेल्या गोष्टीबद्दलचा प्रश्न, SQL आणि chart ने सोडवलेला, हे analyst चं काम. engineer ने ते रस्ते बांधले ज्यामुळे उत्तर जलद आणि बरोबर मिळतं. scientist भविष्याचा अंदाज बांधतो, जसं पुढच्या महिन्याच्या orders.' },
          hints: [
            { en: 'Builds the roads, drives on the roads, predicts the traffic. Which one is this?', mr: 'रस्ते बांधतो, रस्त्यावरून गाडी चालवतो, traffic चा अंदाज बांधतो. हे कोणतं?' },
            { en: 'It is a question about the past, answered with SQL. No prediction needed.', mr: 'हा भूतकाळाबद्दलचा प्रश्न आहे, SQL ने सोडवायचा. अंदाजाची गरज नाही.' },
          ],
          successLine: { en: 'Engineer builds, analyst asks, scientist predicts.', mr: 'engineer बांधतो, analyst विचारतो, scientist अंदाज बांधतो.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'You are adding quality checks to ChaiCart\'s nightly pipeline. Which TWO are real data quality checks?', mr: 'तुम्ही ChaiCart च्या रात्रीच्या pipeline मध्ये quality checks जोडताय. यातले कोणते दोन खरे data quality checks आहेत?' },
          options: [
            { en: 'The number of orders loaded equals the number of orders in the source file', mr: 'load झालेल्या orders ची संख्या source file मधल्या orders च्या संख्येइतकीच आहे' },
            { en: 'No order has a negative amount or a missing price', mr: 'कोणत्याही order ची रक्कम उणे नाही किंवा price गायब नाही' },
            { en: 'The dashboard uses Sam\'s favourite colours', mr: 'dashboard मध्ये Sam चे आवडते रंग आहेत' },
            { en: 'Rows that disagree are quietly deleted so the totals look neat', mr: 'न जुळणाऱ्या rows गुपचूप delete करायच्या, म्हणजे totals नीट दिसतात' },
          ],
          correct: [0, 1],
          explain: { en: 'Counts that reconcile and values that make sense are the lactometer test of data. Quietly deleting rows hides the problem; a good pipeline puts bad rows aside and reports them.', mr: 'जुळणारे counts आणि अर्थपूर्ण values म्हणजे डेटाची lactometer तपासणी. rows गुपचूप delete करणं म्हणजे समस्या लपवणं; चांगली pipeline खराब rows बाजूला ठेवते आणि त्यांचा report देते.' },
          hints: [
            { en: 'Think like a tester: what would make Sam\'s three numbers disagree?', mr: 'tester सारखा विचार करा: Sam चे तीन आकडे कशामुळे जुळणार नाहीत?' },
            { en: 'One option looks tidy but hides bugs. Colours are not data quality.', mr: 'एक पर्याय नीटनेटका दिसतो पण bugs लपवतो. रंग म्हणजे data quality नाही.' },
          ],
          successLine: { en: 'That is your QA eye at work on data. Rex is impressed.', mr: 'हीच डेटावर काम करणारी तुमची QA नजर. Rex खूश आहे.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What is the usual order of stages in a data pipeline?', mr: 'data pipeline मधल्या टप्प्यांचा नेहमीचा क्रम कोणता?' },
        options: [
          { en: 'Dashboard, warehouse, sources, data lake', mr: 'dashboard, warehouse, sources, data lake' },
          { en: 'Warehouse, sources, dashboard, transform', mr: 'warehouse, sources, dashboard, transform' },
          { en: 'Sources, data lake, transform, warehouse, dashboard', mr: 'sources, data lake, transform, warehouse, dashboard' },
          { en: 'Transform, dashboard, data lake, sources', mr: 'transform, dashboard, data lake, sources' },
        ],
        answer: 2,
        explain: { en: 'Data is born in sources, lands raw in the lake, gets cleaned in transform, sits tidy in the warehouse, and is shown on dashboards. Villages, tank, plant, cold store, shop board.', mr: 'डेटा sources मध्ये जन्मतो, कच्चा lake मध्ये येतो, transform मध्ये साफ होतो, warehouse मध्ये नीट बसतो, आणि dashboards वर दिसतो. गावं, टाकी, plant, cold store, दुकानाचा board.' },
      },
      {
        q: { en: 'What does ELT mean?', mr: 'ELT म्हणजे काय?' },
        options: [
          { en: 'Load the raw data into the warehouse first, then transform it there (often with SQL)', mr: 'आधी कच्चा डेटा warehouse मध्ये load करायचा, मग तिथेच transform करायचा (बऱ्याचदा SQL ने)' },
          { en: 'Clean the data on a laptop and email it', mr: 'laptop वर डेटा साफ करून email करायचा' },
          { en: 'Only load data, never transform it', mr: 'फक्त डेटा load करायचा, कधीच transform नाही' },
          { en: 'A kind of dashboard chart', mr: 'dashboard chart चा एक प्रकार' },
        ],
        answer: 0,
        explain: { en: 'Extract, Load, Transform. ETL cleans before loading; ELT loads first and cleans inside the warehouse, keeping the raw copy handy.', mr: 'Extract, Load, Transform. ETL load करण्याआधी साफ करतं; ELT आधी load करतं आणि warehouse मध्येच साफ करतं, कच्ची प्रत हाताशी ठेवून.' },
      },
      {
        q: { en: 'ChaiCart wants to predict how many orders will come during the Ganpati festival. Whose job is that mainly?', mr: 'गणपती उत्सवात किती orders येतील याचा अंदाज ChaiCart ला हवा आहे. हे मुख्यतः कोणाचं काम?' },
        options: [
          { en: 'The data engineer', mr: 'data engineer' },
          { en: 'The rider', mr: 'rider' },
          { en: 'The payment gateway', mr: 'payment gateway' },
          { en: 'The data scientist', mr: 'data scientist' },
        ],
        answer: 3,
        explain: { en: 'Predicting the future with models is data science. The engineer makes sure the history the model learns from is clean and complete.', mr: 'models ने भविष्याचा अंदाज बांधणं म्हणजे data science. model ज्या इतिहासातून शिकतो तो स्वच्छ आणि पूर्ण आहे याची खात्री engineer करतो.' },
      },
      {
        q: { en: 'The notebook says 412 orders and the payment app says 398. What does a data engineer do first?', mr: 'वही म्हणते 412 orders आणि payment app म्हणतं 398. data engineer आधी काय करतो?' },
        options: [
          { en: 'Report the bigger number, it looks better', mr: 'मोठा आकडा report करायचा, तो छान दिसतो' },
          { en: 'Compare the two order by order to find which 14 differ and why', mr: 'दोन्ही order by order जुळवून कोणत्या 14 वेगळ्या आहेत आणि का ते शोधायचं' },
          { en: 'Take the average, 405', mr: 'सरासरी घ्यायची, 405' },
          { en: 'Delete the notebook', mr: 'वही delete करायची' },
        ],
        answer: 1,
        explain: { en: 'Reconcile: match the records one by one. Maybe 14 orders were cash, cancelled or typed twice. The difference tells you the story, just like a failing test.', mr: 'reconcile करा: records एक एक जुळवा. कदाचित 14 orders cash होत्या, cancel झाल्या किंवा दोनदा लिहिल्या गेल्या. फरकच खरी गोष्ट सांगतो, fail होणाऱ्या test सारखा.' },
      },
    ],
    recap: { line: { en: 'A data engineer builds pipelines: sources, data lake, transform, warehouse, dashboard. Batch or streaming, ETL or ELT, and quality checks everywhere.', mr: 'data engineer pipelines बांधतो: sources, data lake, transform, warehouse, dashboard. batch किंवा streaming, ETL किंवा ELT, आणि सगळीकडे quality checks.' }, icon: '🛢️' },
  },

  // ───────────────────────── D0.2 Your first Python program
  {
    id: 'de0-2',
    code: 'D0.2',
    level: 'basic',
    title: { en: 'Your first Python program', mr: 'तुमचा पहिला Python program' },
    skill: 'print(), comments, running code, reading NameError and SyntaxError, Python vs Java/TypeScript',
    realLife: {
      place: 'kitchen',
      title: { en: 'Aaji\'s recipe card for the new cook', mr: 'नव्या स्वयंपाकीणीसाठी आजींचं recipe card' },
      story: {
        en: 'Meera\'s family has a new cook, Shanta tai. Aaji writes the kanda poha recipe on a card for her. Shanta tai follows it exactly, line by line, from the top. She does not skip ahead and she does not guess. Aaji also scribbles notes in the margin, like "Meera likes extra lemon". Those are for the family; Shanta tai cooks only from the numbered lines. One morning line 3 is smudged with oil. Shanta tai does not invent an ingredient. She stops and says, "Aaji, line 3, I cannot read this word." Aaji fixes that one word and breakfast continues.',
        mr: 'मीराच्या घरी नवीन स्वयंपाकीण आल्या आहेत, शांता ताई. आजी त्यांच्यासाठी कांदे पोह्यांची कृती एका card वर लिहितात. शांता ताई ती अगदी तंतोतंत, वरून, ओळ ओळ पाळतात. त्या पुढे उडी मारत नाहीत आणि अंदाज लावत नाहीत. आजी बाजूला समासात काही नोंदीही लिहितात, जसं "मीराला लिंबू जास्त आवडतं". त्या घरच्यांसाठी; शांता ताई फक्त क्रमांक असलेल्या ओळींवरून स्वयंपाक करतात. एका सकाळी ओळ 3 वर तेलाचा डाग पडतो. शांता ताई एखादा पदार्थ मनाने घालत नाहीत. त्या थांबतात आणि म्हणतात, "आजी, ओळ 3, हा शब्द वाचता येत नाही." आजी तो एक शब्द दुरुस्त करतात आणि नाश्ता पुढे सुरू होतो.',
      },
      scene: {
        type: 'steps',
        steps: [
          { icon: '🧅', label: 'Line 1: chop onions', mr: 'ओळ 1: कांदा चिरा' },
          { icon: '🍳', label: 'Line 2: heat oil, add mustard seeds', mr: 'ओळ 2: तेल तापवा, मोहरी घाला' },
          { icon: '❓', label: 'Line 3: add ...smudged...', mr: 'ओळ 3: घाला ...डाग...' },
          { icon: '🍋', label: 'Line 4: add poha and lemon', mr: 'ओळ 4: पोहे आणि लिंबू घाला' },
        ],
        breakAt: 2,
        breakNote: { en: 'The cook stops at line 3 and says exactly what is wrong. That is a Python error message.', mr: 'स्वयंपाकीण ओळ 3 वर थांबते आणि नेमकं काय चुकलं ते सांगते. हाच Python चा error message.' },
      },
    },
    solves: {
      dialogue: [
        { who: 'rex', mood: 'happy', text: { en: 'At Kestrel we write pipelines in Python. Today you write your first lines. Sam wants a little daily report printed for him.', mr: 'Kestrel मध्ये आम्ही pipelines Python मध्ये लिहितो. आज तू तुझ्या पहिल्या ओळी लिहिणार. Sam ला रोजचा एक छोटा report print झालेला हवा आहे.' } },
        { who: 'you', mood: 'worried', text: { en: 'In Java I needed a class, public static void main and semicolons just to print one line. Is Python like that?', mr: 'Java मध्ये फक्त एक ओळ print करायला मला class, public static void main आणि semicolons लागायचे. Python तसंच आहे का?' } },
        { who: 'theo', mood: 'happy', text: { en: 'One line: print("Hello"). No class, no main, no semicolon, no types. Python reads your file from top to bottom.', mr: 'एक ओळ: print("Hello"). class नाही, main नाही, semicolon नाही, types नाहीत. Python तुमची file वरून खाली वाचतो.' } },
        { who: 'meera', mood: 'happy', text: { en: 'And when it breaks, it tells you the line and the reason, like a good bug report. You already know how to read those.', mr: 'आणि बिघडलं की तो ओळ आणि कारण सांगतो, चांगल्या bug report सारखं. ते वाचायला तुला आधीच येतं.' } },
      ],
      problem: { en: 'Sam wants a simple printed summary every day, and the new data engineer has never run Python. Java habits like semicolons and braces will trip her up.', mr: 'Sam ला रोज एक साधा print केलेला सारांश हवा आहे, आणि नव्या data engineer ने कधीच Python चालवलेलं नाही. semicolons आणि braces सारख्या Java च्या सवयी अडथळा आणतील.' },
      solution: { en: 'Learn the smallest Python program: print() lines, # comments, numbers and text, and how to read an error message from its last line. Then the language gets out of the way and the data gets the attention.', mr: 'सगळ्यात छोटा Python program शिका: print() च्या ओळी, # comments, numbers आणि text, आणि error message त्याच्या शेवटच्या ओळीपासून कसा वाचायचा. मग भाषा अडथळा राहत नाही आणि लक्ष डेटावर राहतं.' },
    },
    lesson: [
      { en: 'A Python program is a list of lines that run from top to bottom, like the recipe card. print() shows something in the output panel. Text goes inside quotes: print("Namaste"). Numbers do not need quotes, and Python does the maths: print(42 * 3) shows 126. Commas print several things with a space between them: print("Orders:", 42) shows Orders: 42.', mr: 'Python program म्हणजे वरून खाली चालणाऱ्या ओळींची यादी, recipe card सारखी. print() output panel मध्ये काहीतरी दाखवतं. text quotes मध्ये लिहायचा: print("Namaste"). numbers ना quotes लागत नाहीत, आणि गणित Python करतो: print(42 * 3) 126 दाखवतं. comma ने अनेक गोष्टी मध्ये एक space ठेवून print होतात: print("Orders:", 42) दाखवतं Orders: 42.' },
      { en: 'A line that starts with # is a comment. Python skips it; it is a note for the humans who read the code later, like Aaji\'s margin notes. Good comments say why, not what.', mr: '# ने सुरू होणारी ओळ म्हणजे comment. Python ती वगळतो; ती नंतर code वाचणाऱ्या माणसांसाठीची नोंद असते, आजींच्या समासातल्या नोंदींसारखी. चांगले comments "काय" नाही, "का" सांगतात.' },
      { en: 'When Python cannot go on, it stops and prints an error. Read it from the bottom: the last line names the error and the reason, and the line above it says which line of main.py. NameError means a name Python does not know: a typo like Print, or text you forgot to put in quotes. SyntaxError means Python could not even read the line: a missing quote, bracket or colon. Nothing after the broken line runs.', mr: 'Python पुढे जाऊ शकत नाही तेव्हा तो थांबतो आणि error print करतो. तो खालून वाचा: शेवटची ओळ error चं नाव आणि कारण सांगते, आणि त्यावरची ओळ main.py ची कोणती ओळ ते सांगते. NameError म्हणजे Python ला माहीत नसलेलं नाव: Print सारखी typo, किंवा quotes मध्ये लिहायचा राहिलेला text. SyntaxError म्हणजे Python ला ती ओळ वाचताच आली नाही: quote, bracket किंवा colon राहिला. बिघडलेल्या ओळीनंतरचं काहीच चालत नाही.' },
      { en: 'Compared with the Java and TypeScript you have read: no semicolons at the end, no curly braces, no types written before names, and no class or main method. Indentation (the spaces at the start of a line) is part of the language: Python uses it instead of braces, so a stray space at the start of a line is an error. print is Python\'s System.out.println and console.log.', mr: 'तू वाचलेल्या Java आणि TypeScript च्या तुलनेत: शेवटी semicolons नाहीत, curly braces नाहीत, नावांआधी types लिहायचे नाहीत, आणि class किंवा main method नाही. indentation (ओळीच्या सुरुवातीच्या spaces) भाषेचाच भाग आहे: Python braces ऐवजी ते वापरतो, म्हणून ओळीच्या सुरुवातीला उगाच आलेली space म्हणजे error. print म्हणजे Python चं System.out.println आणि console.log.' },
    ],
    syntax: {
      template: `# A comment: a note for humans, Python skips it
print("Namaste, ChaiCart!")
print("Orders today:", 42)
print("Cups of chai:", 42 * 3)`,
      parts: [
        { code: '# ...', means: { en: 'a comment, like // in Java and TypeScript', mr: 'comment, Java आणि TypeScript मधल्या // सारखी' } },
        { code: 'print(...)', means: { en: 'show something on its own line in the output panel', mr: 'output panel मध्ये स्वतःच्या ओळीत काहीतरी दाखवा' } },
        { code: '"Namaste, ChaiCart!"', means: { en: 'text (a string) goes inside quotes, "double" or \'single\'', mr: 'text (string) quotes मध्ये, "double" किंवा \'single\'' } },
        { code: '"Orders today:", 42', means: { en: 'a comma prints both, with one space between', mr: 'comma दोन्ही print करतो, मध्ये एक space ठेवून' } },
        { code: '42 * 3', means: { en: 'numbers without quotes; Python works out 126 before printing', mr: 'quotes शिवाय numbers; print करण्याआधी Python 126 काढतो' } },
      ],
      example: [
        { code: '# Daily report for Sam', note: { en: 'a margin note: Python skips it', mr: 'समासातली नोंद: Python ती वगळतो' } },
        { code: 'print("ChaiCart daily report")', note: { en: 'Java: System.out.println("...");  TypeScript: console.log("...");', mr: 'Java: System.out.println("...");  TypeScript: console.log("...");' } },
        { code: 'print("Orders today:", 42)', note: { en: 'prints Orders today: 42', mr: 'Orders today: 42 print होतं' } },
        { code: 'print("Cups of chai:", 42 * 3)', note: { en: 'Python does the maths: Cups of chai: 126', mr: 'गणित Python करतो: Cups of chai: 126' } },
        { code: 'Print("Done")', note: { en: 'NameError: name \'Print\' is not defined. Capital P is a different name.', mr: 'NameError: name \'Print\' is not defined. capital P म्हणजे वेगळं नाव.' } },
      ],
      pitfall: { en: 'Quotes copied from WhatsApp or Word are often curly (“like this”). Python only understands straight quotes (") and reports a SyntaxError. Also, Python cares about capitals: print works, Print does not.', mr: 'WhatsApp किंवा Word मधून copy केलेले quotes बऱ्याचदा वाकडे (“असे”) असतात. Python ला फक्त सरळ quotes (") समजतात, नाहीतर तो SyntaxError देतो. आणि Python capital अक्षरं वेगळी मानतो: print चालतं, Print नाही.' },
    },
    practice: {
      intro: { en: 'Your first real Python. Type in the editor, press Run to see the output panel under the editor, and press Submit when it looks right. Errors are friends here: read the last line.', mr: 'तुमचं पहिलं खरं Python. editor मध्ये लिहा, editor खालचा output panel पाहायला Run दाबा, आणि बरोबर दिसलं की Submit दाबा. इथे errors मित्र आहेत: शेवटची ओळ वाचा.' },
      steps: [
        {
          kind: 'python',
          prompt: { en: 'Change the program so it prints exactly these two lines:\nNamaste, ChaiCart!\nMy first Python program', mr: 'program असा बदला की तो नेमक्या या दोन ओळी print करेल:\nNamaste, ChaiCart!\nMy first Python program' },
          starter: `# Lines that start with # are comments. Python skips them.
print("Hello, world")
`,
          solution: `# My first program for ChaiCart
print("Namaste, ChaiCart!")
print("My first Python program")
`,
          output: ['Namaste, ChaiCart!', 'My first Python program'],
          hints: [
            { en: 'Press Run first to see what the starter prints.', mr: 'starter काय print करतो ते पाहायला आधी Run दाबा.' },
            { en: 'Each print() makes one line. You need two print() lines.', mr: 'प्रत्येक print() एक ओळ बनवतो. तुम्हाला दोन print() ओळी हव्यात.' },
            { en: 'Copy the text exactly, including the comma and the exclamation mark, inside straight quotes.', mr: 'text अगदी तसाच, comma आणि उद्गारचिन्हासकट, सरळ quotes मध्ये लिहा.' },
            { en: 'print("Namaste, ChaiCart!")\nprint("My first Python program")', mr: 'print("Namaste, ChaiCart!")\nprint("My first Python program")' },
          ],
          successLine: { en: 'Hello, Python. No class, no main, no semicolon.', mr: 'नमस्कार, Python. class नाही, main नाही, semicolon नाही.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Sam says each order has 3 cups of chai on average, and there were 42 orders today. Print these two lines, and let Python do the multiplication (do not type 126 yourself):\nOrders today: 42\nCups of chai: 126', mr: 'Sam म्हणतो प्रत्येक order मध्ये सरासरी 3 cups चहा असतो, आणि आज 42 orders आल्या. या दोन ओळी print करा, आणि गुणाकार Python ला करू द्या (126 स्वतः लिहू नका):\nOrders today: 42\nCups of chai: 126' },
          starter: `# 42 orders today, about 3 cups per order.
print("Orders today:", 42)
# Print the cups line below. Let Python multiply.
`,
          solution: `# 42 orders today, about 3 cups per order.
print("Orders today:", 42)
print("Cups of chai:", 42 * 3)
`,
          output: ['Orders today: 42', 'Cups of chai: 126'],
          mustNotUse: [{ pattern: '126', message: { en: 'Do not type 126 yourself. Write 42 * 3 and let Python work it out.', mr: '126 स्वतः लिहू नका. 42 * 3 लिहा आणि Python ला काढू द्या.' } }],
          hints: [
            { en: 'The first line is already done. Look at how it uses a comma between the text and the number.', mr: 'पहिली ओळ झालेली आहे. ती text आणि number मध्ये comma कसा वापरते ते पाहा.' },
            { en: 'In Python, * means multiply. The comma adds the space for you, so do not end the text with a space.', mr: 'Python मध्ये * म्हणजे गुणाकार. comma तुमच्यासाठी space टाकतो, म्हणून text च्या शेवटी space ठेवू नका.' },
            { en: 'print("Cups of chai:", 42 * 3)', mr: 'print("Cups of chai:", 42 * 3)' },
          ],
          successLine: { en: 'Python did the maths. Next time the number changes, the code still works.', mr: 'गणित Python ने केलं. पुढच्या वेळी आकडा बदलला तरी code चालेल.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Theo wrote this, and it crashes. Press Run and read the last line of the error under the editor. Fix both problems so the program prints:\nReport for: ChaiCart\nReport done', mr: 'Theo ने हे लिहिलं, आणि ते crash होतं. Run दाबा आणि editor खालच्या error ची शेवटची ओळ वाचा. दोन्ही चुका दुरुस्त करा म्हणजे program हे print करेल:\nReport for: ChaiCart\nReport done' },
          starter: `# Press Run first and read the error.
print("Report for:", ChaiCart)
Print("Report done")
`,
          solution: `# ChaiCart is text, so it needs quotes. print is lowercase.
print("Report for:", "ChaiCart")
print("Report done")
`,
          output: ['Report for: ChaiCart', 'Report done'],
          hints: [
            { en: 'The error says NameError: name \'ChaiCart\' is not defined. Without quotes, Python thinks ChaiCart is a name it should know.', mr: 'error म्हणतो NameError: name \'ChaiCart\' is not defined. quotes शिवाय Python ला वाटतं ChaiCart हे त्याला माहीत असायला हवं असं नाव आहे.' },
            { en: 'Put ChaiCart inside quotes. Then press Run again: a second NameError appears on line 3.', mr: 'ChaiCart quotes मध्ये ठेवा. मग पुन्हा Run दाबा: ओळ 3 वर दुसरा NameError येतो.' },
            { en: 'Python cares about capitals. The function is print, all lowercase.', mr: 'Python capital अक्षरं वेगळी मानतो. function चं नाव print आहे, सगळं lowercase.' },
            { en: 'print("Report for:", "ChaiCart")\nprint("Report done")', mr: 'print("Report for:", "ChaiCart")\nprint("Report done")' },
          ],
          successLine: { en: 'Two NameErrors read and fixed. That is exactly how bug triage feels in Python.', mr: 'दोन NameErrors वाचले आणि दुरुस्त केले. Python मधलं bug triage नेमकं असंच वाटतं.' },
        },
        {
          kind: 'python',
          prompt: { en: 'Rex pasted this from an old Java note. Make it real Python that prints:\nKestrel Data\nWelcome, new data engineer\nUse print, and no semicolons.', mr: 'Rex ने हे एका जुन्या Java नोंदीतून paste केलं. ते खरं Python करा जे हे print करेल:\nKestrel Data\nWelcome, new data engineer\nprint वापरा, आणि semicolons नकोत.' },
          starter: `# Rex copied this from an old Java note. Make it real Python.
print("Kestrel Data"
System.out.println("Welcome, new data engineer");
`,
          solution: `# Real Python: print, closed brackets, no semicolons.
print("Kestrel Data")
print("Welcome, new data engineer")
`,
          output: ['Kestrel Data', 'Welcome, new data engineer'],
          mustNotUse: [
            { pattern: 'System\\.out', message: { en: 'System.out.println is Java. In Python it is just print(...).', mr: 'System.out.println हे Java आहे. Python मध्ये फक्त print(...).' } },
            { pattern: ';', message: { en: 'Python lines do not need a semicolon at the end. Remove it.', mr: 'Python च्या ओळींना शेवटी semicolon लागत नाही. तो काढून टाका.' } },
          ],
          hints: [
            { en: 'Press Run. The SyntaxError says \'(\' was never closed. Which line opens a bracket and never closes it?', mr: 'Run दाबा. SyntaxError म्हणतो \'(\' was never closed. कोणती ओळ bracket उघडते आणि बंदच करत नाही?' },
            { en: 'Add the missing ) at the end of line 2. Then fix line 3: Java\'s System.out.println becomes Python\'s print.', mr: 'ओळ 2 च्या शेवटी राहिलेला ) जोडा. मग ओळ 3 दुरुस्त करा: Java चं System.out.println म्हणजे Python चं print.' },
            { en: 'Delete the semicolon at the end of the last line.', mr: 'शेवटच्या ओळीच्या शेवटचा semicolon काढून टाका.' },
            { en: 'print("Kestrel Data")\nprint("Welcome, new data engineer")', mr: 'print("Kestrel Data")\nprint("Welcome, new data engineer")' },
          ],
          successLine: { en: 'Java habits unlearned. Python likes it short.', mr: 'Java च्या सवयी सुटल्या. Python ला छोटं आवडतं.' },
        },
        {
          kind: 'choice',
          prompt: { en: 'This program has a space problem you cannot see easily. Press Run. What happens?', mr: 'या program मध्ये सहज न दिसणारी space ची चूक आहे. Run दाबा. काय होतं?' },
          pythonSandbox: { code: INDENT_CODE },
          options: [
            { en: 'It prints both lines', mr: 'दोन्ही ओळी print होतात' },
            { en: 'It prints only the first line, then stops quietly', mr: 'फक्त पहिली ओळ print होते, मग शांतपणे थांबतं' },
            'NameError: name \'print\' is not defined',
            'IndentationError: unexpected indent',
          ],
          correct: [3],
          explain: { en: 'Line 2 starts with spaces for no reason. In Python, indentation means "this line belongs inside the block above", and there is no block here, so Python refuses to run anything at all. Not even line 1 prints, because Python reads the whole file before running it.', mr: 'ओळ 2 विनाकारण spaces ने सुरू होते. Python मध्ये indentation म्हणजे "ही ओळ वरच्या block च्या आत आहे", आणि इथे कोणताच block नाही, म्हणून Python काहीच चालवत नाही. ओळ 1 सुद्धा print होत नाही, कारण Python चालवण्याआधी पूर्ण file वाचतो.' },
          hints: [
            { en: 'Press Run and read the last line of the error.', mr: 'Run दाबा आणि error ची शेवटची ओळ वाचा.' },
            { en: 'Look at the start of line 2. In Java extra spaces are harmless. In Python they mean something.', mr: 'ओळ 2 ची सुरुवात पाहा. Java मध्ये जास्तीच्या spaces ने काही फरक पडत नाही. Python मध्ये त्यांना अर्थ असतो.' },
          ],
          successLine: { en: 'Spaces at the start of a line matter in Python. You will use that on purpose in loops and ifs.', mr: 'Python मध्ये ओळीच्या सुरुवातीच्या spaces महत्त्वाच्या. loops आणि ifs मध्ये तुम्ही त्या मुद्दाम वापराल.' },
        },
      ],
    },
    exam: [
      {
        q: { en: 'What does this print?', mr: 'हे काय print करतं?' },
        code: 'print("Cups:", 4 * 5)',
        options: ['Cups: 4 * 5', 'Cups:20', 'Cups: 20', '"Cups:", 20'],
        answer: 2,
        explain: { en: 'Python works out 4 * 5 = 20 first, and the comma puts one space between the two things.', mr: 'Python आधी 4 * 5 = 20 काढतो, आणि comma दोन गोष्टींमध्ये एक space ठेवतो.' },
      },
      {
        q: { en: 'Which error does this line give?', mr: 'ही ओळ कोणता error देते?' },
        code: 'print(Masala)',
        options: ['NameError', 'ZeroDivisionError', 'It prints Masala', 'IndexError'],
        answer: 0,
        explain: { en: 'Without quotes, Masala is a name, and nothing called Masala exists yet. Write print("Masala") to print the text.', mr: 'quotes शिवाय Masala हे एक नाव आहे, आणि Masala नावाचं काहीच अजून अस्तित्वात नाही. text print करायला print("Masala") लिहा.' },
      },
      {
        q: { en: 'How does Python know which lines belong inside a block (where Java uses { })?', mr: 'block च्या आत कोणत्या ओळी आहेत हे Python ला कसं कळतं (जिथे Java { } वापरतो)?' },
        options: [
          { en: 'From semicolons at the end of each line', mr: 'प्रत्येक ओळीच्या शेवटच्या semicolons वरून' },
          { en: 'From the types written before each name', mr: 'प्रत्येक नावाआधी लिहिलेल्या types वरून' },
          { en: 'It does not care, every line is the same', mr: 'त्याला फरक पडत नाही, प्रत्येक ओळ सारखीच' },
          { en: 'From the indentation: the spaces at the start of the lines', mr: 'indentation वरून: ओळींच्या सुरुवातीच्या spaces' },
        ],
        answer: 3,
        explain: { en: 'Indentation is part of Python\'s grammar. Lines indented the same amount under an if or for belong to it. That is why a stray space is an IndentationError.', mr: 'indentation हा Python च्या व्याकरणाचा भाग आहे. if किंवा for खाली सारख्याच indent असलेल्या ओळी त्याच्या असतात. म्हणूनच उगाच आलेली space म्हणजे IndentationError.' },
      },
      {
        q: { en: 'An error ends with: SyntaxError: \'(\' was never closed. What is the most likely fix?', mr: 'एक error असा संपतो: SyntaxError: \'(\' was never closed. सगळ्यात शक्य दुरुस्ती कोणती?' },
        options: [
          { en: 'Install a new version of Python', mr: 'Python ची नवी version install करायची' },
          { en: 'Add the missing closing bracket ) on that line', mr: 'त्या ओळीवर राहिलेला बंद bracket ) जोडायचा' },
          { en: 'Add a semicolon at the end', mr: 'शेवटी semicolon जोडायचा' },
          { en: 'Change print to Print', mr: 'print चं Print करायचं' },
        ],
        answer: 1,
        explain: { en: 'Read the last line: it names the problem exactly. A bracket was opened and not closed. Python points at the line, you add the ).', mr: 'शेवटची ओळ वाचा: ती समस्या नेमकी सांगते. एक bracket उघडला आणि बंद केला नाही. Python ओळ दाखवतो, तुम्ही ) जोडता.' },
      },
    ],
    recap: { line: { en: 'print() shows output, # starts a comment, text needs quotes, and errors are read from the last line. No semicolons, no braces, indentation matters.', mr: 'print() output दाखवतं, # ने comment सुरू होते, text ला quotes लागतात, आणि errors शेवटच्या ओळीपासून वाचायचे. semicolons नाहीत, braces नाहीत, indentation महत्त्वाचं.' }, icon: '🐍' },
  },
]
