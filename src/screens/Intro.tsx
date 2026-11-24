import { motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import { Dialogue } from '../components/Dialogue.tsx'
import type { DialogueLine } from '../content/types.ts'
import { LangContext, L } from '../lib/i18n.tsx'

const OPENING: DialogueLine[] = [
  { who: 'narrator', text: { en: 'Monday, 9:02 a.m. Kestrel Assurance, a software quality consultancy, 14th floor.', mr: 'सोमवार, सकाळी 9:02. केस्ट्रेल ॲश्युरन्स, एक सॉफ्टवेअर क्वालिटी कन्सल्टन्सी, 14 वा मजला.' } },
  { who: 'meera', mood: 'happy', text: { en: "There you are, {name}! I'm Meera, QA lead. Welcome to the team.", mr: 'आलीस {name}! मी मीरा, QA लीड. टीममध्ये स्वागत.' } },
  { who: 'meera', mood: 'neutral', text: { en: "You've been a manual tester for years. You already have the hardest skill: knowing where things break.", mr: 'तू वर्षानुवर्षे मॅन्युअल टेस्टर आहेस. सर्वात कठीण कौशल्य तुझ्याकडे आधीच आहे: गोष्टी कुठे बिघडतात हे ओळखणं.' } },
  { who: 'meera', mood: 'worried', text: { en: "But our clients' systems now break faster than anyone can click through them.", mr: 'पण आता आपल्या क्लायंट्सच्या सिस्टम्स कोणी क्लिक करून तपासेल त्यापेक्षा वेगाने बिघडतात.' } },
  { who: 'gremlin', mood: 'smug', text: { en: '>> hello, new tester. i am in their databases. you cannot click fast enough. ⌁', mr: '>> नमस्कार, नवीन टेस्टर. मी त्यांच्या डेटाबेसमध्ये आहे. तू इतक्या वेगाने क्लिक करू शकणार नाहीस. ⌁' } },
  { who: 'meera', mood: 'angry', text: { en: 'That. Someone left a chaos script behind when they quit. We call it the Gremlin.', mr: 'हेच ते. कोणीतरी नोकरी सोडताना एक गोंधळ घालणारी स्क्रिप्ट मागे सोडली. आम्ही तिला ग्रेमलिन म्हणतो.' } },
  { who: 'meera', mood: 'happy', text: { en: "So you won't click faster. You'll ask the data directly, with SQL. One case at a time.", mr: 'म्हणून तू वेगाने क्लिक करणार नाहीस. तू SQL ने थेट डेटालाच विचारशील. एका वेळी एक केस.' } },
  { who: 'meera', mood: 'neutral', text: { en: 'Every lesson starts with real life, then the problem, the lesson, the syntax, practice and an exam. In English and Marathi.', mr: 'प्रत्येक धडा रोजच्या जीवनातल्या उदाहरणाने सुरू होतो, मग समस्या, धडा, रचना, सराव आणि परीक्षा. इंग्रजी आणि मराठीत.' } },
]

export function Intro({ initialName, marathi, onStart }: { initialName: string; marathi: boolean; onStart: (name: string) => void }) {
  const [name, setName] = useState(initialName)
  const [stage, setStage] = useState<'title' | 'story'>('title')
  const [done, setDone] = useState(false)
  const onDone = useCallback(() => setDone(true), [])

  if (stage === 'story')
    return (
      <LangContext.Provider value={{ marathi, name }}>
        <div className="intro story">
          <Dialogue lines={OPENING} onDone={onDone} />
          {done && (
            <motion.button type="button" className="btn primary big" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={() => onStart(name)}>
              <L en="Open the case map" mr="केस नकाशा उघडा" />
            </motion.button>
          )}
        </div>
      </LangContext.Provider>
    )

  return (
    <div className="intro">
      <div className="intro-card">
        <div className="eyebrow"><L en="A detective game for testers" mr="टेस्टर्ससाठी गुप्तहेर खेळ" /></div>
        <motion.h1 className="title" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          QA <mark>Quest</mark>
        </motion.h1>
        <p className="tagline">From manual tester to SQL and API detective, one case at a time.</p>
        <p className="tagline bi-mr" lang="mr">
          मॅन्युअल टेस्टर ते SQL आणि API गुप्तहेर, एका वेळी एक केस.
        </p>
        <motion.div className="intro-sample" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} aria-hidden>
          <code>
            <span className="tok-kw">SELECT</span> o.id <span className="tok-kw">FROM</span> orders o <span className="tok-kw">LEFT JOIN</span> shipments s <span className="tok-kw">ON</span> s.order_id = o.id <span className="tok-kw">WHERE</span> s.id <span className="tok-kw">IS NULL</span>;
          </code>
          <span className="intro-sample-result tabular">41 rows: the missing orders</span>
        </motion.div>
        <form
          className="name-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) setStage('story')
          }}
        >
          <label htmlFor="pname">
            What should the team call you? <span lang="mr" className="bi-mr">टीमने तुम्हाला काय म्हणावं?</span>
          </label>
          <div className="row">
            <input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={24} autoFocus autoComplete="given-name" />
            <button type="submit" className="btn primary" disabled={!name.trim()}>
              Start my first day ▸
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
