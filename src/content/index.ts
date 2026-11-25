import type { Act, Incident, Lesson, Place, T } from './types.ts'
import { foundationLessons, prologueLessons } from './sql1-foundations.ts'
import { intermediateLessons } from './sql2-intermediate.ts'
import { startLessons } from './sql0-start.ts'
import { advancedLessons } from './sql3-advanced.ts'
import { apiStartLessons } from './api0-start.ts'
import { apiBasicsLessons } from './api1-basics.ts'
import { apiRequestLessons } from './api1-requests.ts'
import { apiProLessonsA } from './api2-pro-a.ts'
import { apiProLessonsB } from './api2-pro-b.ts'
import { apiProLessonsC } from './api2-pro-c.ts'
import { apiIncidents } from './api-incidents.ts'
import { selStartLessons } from './sel0-start.ts'
import { selBasicsLessons } from './sel1-basics.ts'
import { selMoreLessons } from './sel1-more.ts'
import { selWaitBossLessons } from './sel1-boss.ts'
import { selProLessonsC } from './sel2-pro-c.ts'
import { selProLessonsA } from './sel2-pro-a.ts'
import { selProLessonsB } from './sel2-pro-b.ts'
import { selIncidents } from './sel-incidents.ts'
import { pwStartLessons } from './pw0-start.ts'
import { pwBasicsLessons } from './pw1-basics.ts'
import { pwMoreLessons } from './pw1-more.ts'
import { pwProLessonsA } from './pw2-pro-a.ts'
import { pwProLessonsB } from './pw2-pro-b.ts'
import { pwIncidents } from './pw-incidents.ts'
import { pfStartLessons } from './pf0-start.ts'
import { pfBasicsLessons } from './pf1-basics.ts'
import { pfMoreLessons } from './pf1-more.ts'
import { pfProLessonsA } from './pf2-pro-a.ts'
import { pfProLessonsB } from './pf2-pro-b.ts'
import { pfIncidents } from './pf-incidents.ts'
import { dataStartLessons } from './de0-start.ts'
import { py1Lessons } from './py1-basics.ts'
import { py2Lessons } from './py2-data.ts'
import { py1MoreLessons } from './py1-more.ts'
import { py2MoreLessons } from './py2-more.ts'
import { s3BasicsLessons } from './s3-basics.ts'
import { s3MoreLessons } from './s3-more.ts'
import { lambdaBasicsLessons } from './lambda-basics.ts'
import { lambdaMoreLessons } from './lambda-more.ts'
import { dataIncidents } from './data-incidents.ts'

export const acts: Act[] = [
  { id: 'prologue', title: { en: 'Prologue: First Day', mr: 'प्रस्तावना: पहिला दिवस' }, client: 'Kestrel HQ', domain: { en: 'QA consulting', mr: 'QA कन्सल्टिंग' }, building: 'hq', rank: 'QA Associate', lessons: prologueLessons, available: true },
  { id: 'sql1', title: { en: 'SQL 1 · Foundations: The Vanishing Orders', mr: 'SQL 1 · पाया: गायब ऑर्डर्स' }, client: 'ShopSprout', domain: { en: 'E-commerce · SQL basics', mr: 'ई-कॉमर्स · SQL मूलभूत' }, building: 'shop', rank: 'Data Detective', level: 'basic', lessons: [...startLessons, ...foundationLessons], available: true },
  { id: 'sql2', title: { en: 'SQL 2 · Intermediate: The Poisoned Feed', mr: 'SQL 2 · मध्यम: विषारी फीड' }, client: 'BazaarHub Feed', domain: { en: 'Marketplace data · data quality', mr: 'मार्केटप्लेस डेटा · डेटा क्वालिटी' }, building: 'warehouse', rank: 'Data Quality Analyst', level: 'intermediate', lessons: intermediateLessons, available: true },
  { id: 'sql3', title: { en: 'SQL 3 · Advanced: The Ledger Audit', mr: 'SQL 3 · प्रगत: लेजर ऑडिट' }, client: 'Ledgerly Bank', domain: { en: 'Banking · advanced SQL', mr: 'बँकिंग · प्रगत SQL' }, building: 'bank', rank: 'SQL Specialist', level: 'advanced', lessons: advancedLessons, available: true },
  { id: 'api1', title: { en: 'API 1 · Foundations: The Silent Kitchen', mr: 'API 1 · पाया: शांत स्वयंपाकघर' }, client: 'TiffinGo', domain: { en: 'Food delivery · REST APIs', mr: 'फूड डिलिव्हरी · REST APIs' }, building: 'delivery', rank: 'API Explorer', level: 'basic', lessons: [...apiStartLessons, ...apiBasicsLessons, ...apiRequestLessons], available: true },
  { id: 'api2', title: { en: 'API 2 · Like a Pro: The Double Charge', mr: 'API 2 · व्यावसायिक: दुहेरी पैसे' }, client: 'TiffinGo Pay', domain: { en: 'Payments · API test automation', mr: 'पेमेंट्स · API टेस्ट ऑटोमेशन' }, building: 'payments', rank: 'API Test Engineer', level: 'intermediate', lessons: [...apiProLessonsA, ...apiProLessonsB.filter((l) => !l.isBoss), ...apiProLessonsC, ...apiProLessonsB.filter((l) => l.isBoss)], available: true },
  { id: 'sel1', title: { en: 'Selenium 1 · Foundations: The Midnight Release', mr: 'Selenium 1 · पाया: मध्यरात्रीचं रिलीज' }, client: 'CareBridge', domain: { en: 'Healthcare · Selenium with Java', mr: 'आरोग्य · Java सह Selenium' }, building: 'clinic', rank: 'Junior SDET', level: 'basic', lessons: [...selStartLessons, ...selBasicsLessons, ...selMoreLessons, ...selWaitBossLessons], available: true },
  { id: 'sel2', title: { en: 'Selenium 2 · Like a Pro: The Flaky Suite', mr: 'Selenium 2 · व्यावसायिक: बेभरवशाचा suite' }, client: 'CareBridge Labs', domain: { en: 'Diagnostics · test frameworks', mr: 'डायग्नॉस्टिक्स · टेस्ट फ्रेमवर्क' }, building: 'lab', rank: 'SDET', level: 'intermediate', lessons: [...selProLessonsA, ...selProLessonsB, ...selProLessonsC], available: true },
  { id: 'pw1', title: { en: 'Playwright 1 · Foundations: Lost Luggage', mr: 'Playwright 1 · पाया: हरवलेलं सामान' }, client: 'SkyHop Airlines', domain: { en: 'Travel · Playwright with TypeScript', mr: 'प्रवास · TypeScript सह Playwright' }, building: 'airline', rank: 'Automation Engineer', level: 'basic', lessons: [...pwStartLessons, ...pwBasicsLessons, ...pwMoreLessons], available: true },
  { id: 'pw2', title: { en: 'Playwright 2 · Like a Pro: The Release Gate', mr: 'Playwright 2 · व्यावसायिक: रिलीजचं दार' }, client: 'SkyHop Ops', domain: { en: 'Airline operations · network, API and CI', mr: 'एअरलाइन ऑपरेशन्स · network, API आणि CI' }, building: 'hangar', rank: 'Senior SDET', level: 'intermediate', lessons: [...pwProLessonsA, ...pwProLessonsB], available: true },
  { id: 'pf1', title: { en: 'Performance 1 · Foundations: The Flash Sale', mr: 'Performance 1 · पाया: फ्लॅश सेल' }, client: 'StageDoor', domain: { en: 'Ticketing · load testing with k6', mr: 'तिकीट विक्री · k6 सह load testing' }, building: 'arena', rank: 'Performance Tester', level: 'basic', lessons: [...pfStartLessons, ...pfBasicsLessons, ...pfMoreLessons], available: true },
  { id: 'pf2', title: { en: 'Performance 2 · Like a Pro: Opening Night', mr: 'Performance 2 · व्यावसायिक: पहिल्या प्रयोगाची रात्र' }, client: 'StageDoor Live', domain: { en: 'Live events · stress, spike and soak tests', mr: 'लाइव्ह इव्हेंट्स · stress, spike आणि soak tests' }, building: 'stage', rank: 'Performance Engineer', level: 'intermediate', lessons: [...pfProLessonsA, ...pfProLessonsB], available: true },
  // ---------- Data World ----------
  { id: 'dprologue', title: { en: 'Prologue: First Day at Kestrel Data', mr: 'प्रस्तावना: Kestrel Data मधला पहिला दिवस' }, client: 'Kestrel Data', domain: { en: 'What data engineers build', mr: 'डेटा इंजिनिअर्स काय बनवतात' }, building: 'pipeline', rank: 'Data Intern', lessons: dataStartLessons, available: true },
  { id: 'py1', title: { en: 'Python 1 · Foundations: The Messy Order Book', mr: 'Python 1 · पाया: गोंधळलेली ऑर्डर वही' }, client: 'ChaiCart', domain: { en: 'Chai delivery · Python basics', mr: 'चहा डिलिव्हरी · Python मूलभूत' }, building: 'chai', rank: 'Python Apprentice', level: 'basic', lessons: [...py1Lessons, ...py1MoreLessons], available: true },
  { id: 'py2', title: { en: 'Python 2 · Real Data: The Mandi Files', mr: 'Python 2 · खरा डेटा: मंडीच्या files' }, client: 'KisanMandi', domain: { en: 'Farm produce market · files, JSON, cleaning', mr: 'शेतमाल बाजार · files, JSON, cleaning' }, building: 'mandi', rank: 'Data Wrangler', level: 'intermediate', lessons: [...py2Lessons, ...py2MoreLessons], available: true },
  { id: 'lake1', title: { en: 'S3 Data Lake: The Lake of Receipts', mr: 'S3 Data Lake: पावत्यांचं तळं' }, client: 'ChaiCart Cloud', domain: { en: 'AWS S3 · buckets, keys, partitions, boto3', mr: 'AWS S3 · buckets, keys, partitions, boto3' }, building: 'lake', rank: 'Cloud Data Associate', level: 'basic', lessons: [...s3BasicsLessons, ...s3MoreLessons], available: true },
  { id: 'lambda1', title: { en: 'Serverless with Lambda: The 2 a.m. File', mr: 'Lambda सह Serverless: रात्री 2 ची file' }, client: 'ChaiCart Cloud', domain: { en: 'AWS Lambda · S3 events, handlers, logs', mr: 'AWS Lambda · S3 events, handlers, logs' }, building: 'lambda', rank: 'Serverless Builder', level: 'intermediate', lessons: [...lambdaBasicsLessons, ...lambdaMoreLessons], available: true },
  { id: 'spark1', title: { en: 'PySpark: A Billion Chai Orders', mr: 'PySpark: अब्जावधी चहा ऑर्डर्स' }, client: 'ChaiCart Analytics', domain: { en: 'PySpark · DataFrames, joins, aggregations, partitions', mr: 'PySpark · DataFrames, joins, aggregations, partitions' }, building: 'spark', rank: 'Big Data Engineer', level: 'intermediate', lessons: [], available: false },
  { id: 'glue1', title: { en: 'Glue ETL: The Nightly Pipeline', mr: 'Glue ETL: रात्रीची pipeline' }, client: 'KisanMandi Cloud', domain: { en: 'AWS Glue · crawlers, catalog, jobs, bookmarks', mr: 'AWS Glue · crawlers, catalog, jobs, bookmarks' }, building: 'glue', rank: 'ETL Engineer', level: 'advanced', lessons: [], available: false },
  { id: 'dwh1', title: { en: 'The Warehouse: One Version of the Truth', mr: 'Warehouse: सत्याची एकच आवृत्ती' }, client: 'KisanMandi HQ', domain: { en: 'Data warehouse · star schema, SCD, incremental loads', mr: 'Data warehouse · star schema, SCD, incremental loads' }, building: 'dwh', rank: 'Data Engineer', level: 'advanced', lessons: [], available: false },
  // ---------- Dev World (later) ----------
  { id: 'dev1', title: { en: 'Development: coming later', mr: 'डेव्हलपमेंट: नंतर येणार' }, client: 'Kestrel Labs', domain: { en: 'Software development', mr: 'सॉफ्टवेअर डेव्हलपमेंट' }, building: 'devhq', rank: 'Developer', lessons: [], available: false },
]

export type WorldId = 'qa' | 'data' | 'dev'
export type TrackId = 'start' | 'sql' | 'api' | 'selenium' | 'playwright' | 'perf' | 'dstart' | 'python' | 'cloud' | 'bigdata' | 'warehouse' | 'devsoon'

/** Separate careers, each with its own map. */
export const worlds: { id: WorldId; title: T; icon: string; heading: T; available: boolean }[] = [
  { id: 'qa', title: { en: 'QA World', mr: 'QA विश्व' }, icon: '🧪', heading: { en: 'Your QA career', mr: 'तुमचा QA करिअर मार्ग' }, available: true },
  { id: 'data', title: { en: 'Data World', mr: 'डेटा विश्व' }, icon: '🛠️', heading: { en: 'Your data engineering career', mr: 'तुमचा डेटा इंजिनिअरिंग करिअर मार्ग' }, available: true },
  { id: 'dev', title: { en: 'Dev World', mr: 'डेव्ह विश्व' }, icon: '💻', heading: { en: 'Your developer career', mr: 'तुमचा डेव्हलपर करिअर मार्ग' }, available: false },
]
const START_TRACK: Record<WorldId, TrackId> = { qa: 'start', data: 'dstart', dev: 'devsoon' }

/** Tracks are independent career paths. After the prologue, SQL and API can be learned in either order. */
export const tracks: { id: TrackId; world: WorldId; title: T; blurb: T; acts: string[]; soon?: boolean }[] = [
  { id: 'start', world: 'qa', title: { en: 'Start here', mr: 'इथून सुरुवात' }, blurb: { en: 'Your first day at Kestrel QA.', mr: 'Kestrel QA मधला तुमचा पहिला दिवस.' }, acts: ['prologue'] },
  { id: 'sql', world: 'qa', title: { en: 'SQL and database testing', mr: 'SQL आणि डेटाबेस टेस्टिंग' }, blurb: { en: 'Ask the database questions and catch bad data.', mr: 'डेटाबेसला प्रश्न विचारा आणि चुकीचा डेटा पकडा.' }, acts: ['sql1', 'sql2', 'sql3'] },
  { id: 'api', world: 'qa', title: { en: 'API testing', mr: 'API टेस्टिंग' }, blurb: { en: 'Talk to servers directly, the way apps do, and test what they answer.', mr: 'ॲप्सप्रमाणे थेट सर्व्हरशी बोला, आणि त्यांची उत्तरं तपासा.' }, acts: ['api1', 'api2'] },
  { id: 'selenium', world: 'qa', title: { en: 'UI automation with Selenium and Java', mr: 'Selenium आणि Java सह UI ऑटोमेशन' }, blurb: { en: 'Write Java that drives a real web page, and catch bugs before release.', mr: 'खरं web page चालवणारा Java code लिहा, आणि रिलीजआधी bugs पकडा.' }, acts: ['sel1', 'sel2'] },
  { id: 'playwright', world: 'qa', title: { en: 'Modern UI automation with Playwright', mr: 'Playwright सह आधुनिक UI ऑटोमेशन' }, blurb: { en: 'Write TypeScript tests that wait by themselves, mock the network and check APIs too.', mr: 'आपोआप वाट पाहणाऱ्या, network mock करणाऱ्या आणि API सुद्धा तपासणाऱ्या TypeScript tests लिहा.' }, acts: ['pw1', 'pw2'] },
  { id: 'perf', world: 'qa', title: { en: 'Performance testing with k6', mr: 'k6 सह परफॉर्मन्स टेस्टिंग' }, blurb: { en: 'Send thousands of virtual users at a server and find where it breaks.', mr: 'server वर हजारो virtual users पाठवा आणि तो कुठे मोडतो ते शोधा.' }, acts: ['pf1', 'pf2'] },
  { id: 'dstart', world: 'data', title: { en: 'Start here', mr: 'इथून सुरुवात' }, blurb: { en: 'Your first day at Kestrel Data: what a data pipeline is.', mr: 'Kestrel Data मधला तुमचा पहिला दिवस: data pipeline म्हणजे काय.' }, acts: ['dprologue'] },
  { id: 'python', world: 'data', title: { en: 'Python for data', mr: 'डेटासाठी Python' }, blurb: { en: 'Real Python, from the first print() to cleaning messy files.', mr: 'खरं Python, पहिल्या print() पासून गोंधळलेल्या files साफ करण्यापर्यंत.' }, acts: ['py1', 'py2'] },
  { id: 'cloud', world: 'data', title: { en: 'AWS for data: S3 and Lambda', mr: 'डेटासाठी AWS: S3 आणि Lambda' }, blurb: { en: 'Store files in a data lake and process them the moment they land.', mr: 'data lake मध्ये files ठेवा आणि त्या येताच त्यांच्यावर प्रक्रिया करा.' }, acts: ['lake1', 'lambda1'] },
  { id: 'bigdata', world: 'data', title: { en: 'Big data with PySpark and Glue', mr: 'PySpark आणि Glue सह big data' }, blurb: { en: 'Transform millions of rows with Spark, and run it every night with AWS Glue.', mr: 'Spark ने लाखो rows बदला, आणि AWS Glue ने ते रोज रात्री चालवा.' }, acts: ['spark1', 'glue1'], soon: true },
  { id: 'warehouse', world: 'data', title: { en: 'Data warehouse', mr: 'Data warehouse' }, blurb: { en: 'Model facts and dimensions so every report tells the same truth.', mr: 'facts आणि dimensions असे मांडा की प्रत्येक रिपोर्ट एकच सत्य सांगेल.' }, acts: ['dwh1'], soon: true },
  { id: 'devsoon', world: 'dev', title: { en: 'Coming later', mr: 'नंतर येणार' }, blurb: { en: 'Software development, in the same story style.', mr: 'सॉफ्टवेअर डेव्हलपमेंट, याच गोष्टीच्या शैलीत.' }, acts: ['dev1'], soon: true },
]

export const allLessons: Lesson[] = acts.flatMap((a) => a.lessons)

export function lessonById(id: string): Lesson | undefined {
  return allLessons.find((l) => l.id === id)
}

export function trackLessons(track: TrackId): Lesson[] {
  const t = tracks.find((x) => x.id === track)!
  return t.acts.flatMap((id) => acts.find((a) => a.id === id)?.lessons ?? [])
}

export function trackOf(lessonId: string): TrackId {
  const act = acts.find((a) => a.lessons.some((l) => l.id === lessonId))
  return tracks.find((t) => act && t.acts.includes(act.id))?.id ?? 'start'
}

export function worldOf(track: TrackId): WorldId {
  return tracks.find((t) => t.id === track)?.world ?? 'qa'
}
export function startTrackOf(world: WorldId): TrackId {
  return START_TRACK[world]
}

/** Lessons unlock in story order within a track. Each track opens once its world's prologue is done. */
export function isUnlocked(id: string, completed: Record<string, unknown>): boolean {
  const track = trackOf(id)
  const list = trackLessons(track)
  const idx = list.findIndex((l) => l.id === id)
  if (idx > 0) return Boolean(completed[list[idx - 1].id])
  const start = START_TRACK[worldOf(track)]
  if (track === start) return true
  return trackLessons(start).every((l) => completed[l.id])
}

/** The client's own location, used as the background for each lesson's problem scene. */
export function placeOf(lessonId: string): Place {
  const act = acts.find((a) => a.lessons.some((l) => l.id === lessonId))
  const map: Record<string, Place> = { hq: 'office', shop: 'shop', warehouse: 'warehouse', bank: 'bank', delivery: 'restaurant', payments: 'office', clinic: 'clinic', lab: 'clinic', airline: 'station', hangar: 'station', arena: 'fair', stage: 'fair', pipeline: 'office', chai: 'kitchen', mandi: 'market', lake: 'warehouse', lambda: 'office', spark: 'warehouse', glue: 'warehouse', dwh: 'warehouse' }
  return map[act?.building ?? 'hq'] ?? 'office'
}

export function actUnlocked(act: Act, completed: Record<string, unknown>): boolean {
  if (!act.available || act.lessons.length === 0) return false
  return isUnlocked(act.lessons[0].id, completed)
}

export const incidents: Incident[] = [
  {
    id: 'tsb-2018',
    title: { en: 'The Bank That Moved House', mr: 'घर बदललेली बँक' },
    year: 'UK · April 2018',
    unlockAfter: 'a1-6',
    headline: 'BANK CUSTOMERS LOCKED OUT AFTER WEEKEND SYSTEM MOVE',
    counterLabel: { en: 'later fined by UK regulators', mr: 'नंतर UK नियामकांनी ठोठावलेला दंड' },
    counterTo: 48.65,
    counterPrefix: '£',
    counterSuffix: 'M',
    beats: [
      { icon: '🏦', time: { en: 'The plan', mr: 'योजना' }, text: { en: "A UK bank, TSB, moved about 5 million customer accounts from its old parent bank's computer system to a brand-new platform.", mr: 'TSB या UK बँकेने सुमारे 50 लाख ग्राहक अकाउंट्स जुन्या पालक बँकेच्या संगणक प्रणालीवरून एका नवीन प्लॅटफॉर्मवर हलवली.' } },
      { icon: '🌙', time: { en: 'Sunday night', mr: 'रविवार रात्र' }, text: { en: 'The switch went live over one weekend: 22 April 2018.', mr: 'एका वीकेंडमध्ये बदल लाइव्ह झाला: 22 एप्रिल 2018.' } },
      { icon: '🔒', time: { en: 'Within hours', mr: 'काही तासांत' }, text: { en: 'Customers were locked out of their accounts. Online, phone and in-branch banking were all disrupted.', mr: 'ग्राहक आपल्या अकाउंट्समध्ये जाऊ शकत नव्हते. ऑनलाइन, फोन आणि शाखेतली बँकिंग सगळीच विस्कळीत झाली.' } },
      { icon: '📉', time: { en: 'Months later', mr: 'महिन्यांनंतर' }, text: { en: 'Problems took months to fix. An investigation found the bank moved to the new platform before it had been properly tested.', mr: 'समस्या सुटायला महिने लागले. चौकशीत आढळलं की नीट टेस्टिंग होण्याआधीच बँक नवीन प्लॅटफॉर्मवर गेली.' } },
      { icon: '⚖️', time: { en: 'December 2022', mr: 'डिसेंबर 2022' }, text: { en: 'UK regulators fined TSB £48.65 million, on top of compensation paid to customers.', mr: 'ग्राहकांना दिलेल्या भरपाईशिवाय UK नियामकांनी TSB ला £48.65 दशलक्ष दंड ठोठावला.' } },
    ],
    lesson: { en: 'A data migration is only safe when someone proves, with queries, that every account arrived with the right balance.', mr: 'प्रत्येक अकाउंट योग्य शिलकीसह पोहोचलं हे कोणीतरी क्वेरीजने सिद्ध केलं, तरच डेटा मायग्रेशन सुरक्षित.' },
    source: { label: 'CNBC: TSB fined £48.65 million over IT migration failures', url: 'https://www.cnbc.com/2022/12/20/british-bank-tsb-fined-48point65-million-over-it-platform-migration-failures.html' },
    rewind: {
      intro: {
        en: 'Rewind time. You are on the migration test team, the night before go-live. You have the old system (legacy_accounts) and the new one (migrated_accounts). Prove it is safe, or stop the launch.',
        mr: 'वेळ मागे घ्या. तुम्ही मायग्रेशन टेस्ट टीममध्ये आहात, गो-लाइव्हच्या आदल्या रात्री. तुमच्याकडे जुनी सिस्टम (legacy_accounts) आणि नवीन (migrated_accounts) आहे. सुरक्षित आहे हे सिद्ध करा, नाहीतर लॉन्च थांबवा.',
      },
      steps: [
        {
          kind: 'sql',
          prompt: { en: 'Find every account_no in legacy_accounts that never arrived in migrated_accounts.', mr: 'legacy_accounts मधले असे सगळे account_no शोधा जे migrated_accounts मध्ये कधीच पोहोचले नाहीत.' },
          expected: 'SELECT l.account_no FROM legacy_accounts l LEFT JOIN migrated_accounts m ON m.account_no = l.account_no WHERE m.account_no IS NULL',
          hints: [
            { en: '"Who never replied?" again: legacy is the guest list, migrated are the cards.', mr: 'पुन्हा "कोणी उत्तर दिलं नाही?": legacy म्हणजे पाहुण्यांची यादी, migrated म्हणजे कार्ड.' },
            { en: 'LEFT JOIN migrated_accounts m ON m.account_no = l.account_no WHERE m.account_no IS NULL', mr: 'LEFT JOIN migrated_accounts m ON m.account_no = l.account_no WHERE m.account_no IS NULL' },
            { en: 'Or: SELECT account_no FROM legacy_accounts EXCEPT SELECT account_no FROM migrated_accounts', mr: 'किंवा: SELECT account_no FROM legacy_accounts EXCEPT SELECT account_no FROM migrated_accounts' },
            { en: 'SELECT l.account_no FROM legacy_accounts l LEFT JOIN migrated_accounts m ON m.account_no = l.account_no WHERE m.account_no IS NULL;', mr: 'SELECT l.account_no FROM legacy_accounts l LEFT JOIN migrated_accounts m ON m.account_no = l.account_no WHERE m.account_no IS NULL;' },
          ],
          successLine: { en: '7 customers would have woken up with no bank account.', mr: '7 ग्राहकांना सकाळी उठल्यावर बँक अकाउंटच नसतं.' },
        },
        {
          kind: 'sql',
          prompt: { en: 'Now find accounts that arrived with the WRONG balance. Show account_no, the old balance and the new balance.', mr: 'आता चुकीच्या शिलकीसह पोहोचलेली अकाउंट्स शोधा. account_no, जुनी शिल्लक आणि नवीन शिल्लक दाखवा.' },
          expected: 'SELECT l.account_no, l.balance, m.balance FROM legacy_accounts l JOIN migrated_accounts m ON m.account_no = l.account_no WHERE l.balance <> m.balance',
          hints: [
            { en: 'This time you want accounts in BOTH tables (INNER JOIN)...', mr: 'या वेळी दोन्ही टेबल्समधली अकाउंट्स हवीत (INNER JOIN)...' },
            { en: '...where the balances are not equal: <>.', mr: '...जिथे शिल्लक समान नाही: <>.' },
            { en: 'SELECT l.account_no, l.balance, m.balance FROM legacy_accounts l JOIN migrated_accounts m ON m.account_no = l.account_no WHERE l.balance __ m.balance', mr: 'SELECT l.account_no, l.balance, m.balance FROM legacy_accounts l JOIN migrated_accounts m ON m.account_no = l.account_no WHERE l.balance __ m.balance' },
            { en: 'SELECT l.account_no, l.balance, m.balance FROM legacy_accounts l JOIN migrated_accounts m ON m.account_no = l.account_no WHERE l.balance <> m.balance;', mr: 'SELECT l.account_no, l.balance, m.balance FROM legacy_accounts l JOIN migrated_accounts m ON m.account_no = l.account_no WHERE l.balance <> m.balance;' },
          ],
          successLine: { en: '5 balances changed in transit. Launch stopped. Millions saved.', mr: '5 शिल्लक वाटेत बदलल्या. लॉन्च थांबवलं. कोट्यवधी वाचले.' },
        },
      ],
    },
  },
  ...apiIncidents,
  ...selIncidents,
  ...pwIncidents,
  ...pfIncidents,
  ...dataIncidents,
]
