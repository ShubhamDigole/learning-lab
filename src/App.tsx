import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { useEffect, useState } from 'react'
import { acts, incidents, lessonById } from './content/index.ts'
import { getDb } from './db/engine.ts'
import { LangContext } from './lib/i18n.tsx'
import { setMuted } from './lib/sound.ts'
import { useProgress } from './state/progress.ts'
import { CityMap } from './screens/CityMap.tsx'
import { IncidentReplay } from './screens/IncidentReplay.tsx'
import { Intro } from './screens/Intro.tsx'
import { Journal } from './screens/Journal.tsx'
import { LessonPlayer } from './screens/LessonPlayer.tsx'
import { dueSkills, Standup } from './screens/Standup.tsx'

type Screen = { name: 'intro' } | { name: 'map' } | { name: 'lesson'; id: string } | { name: 'journal' } | { name: 'standup' } | { name: 'incident'; id: string }

export default function App() {
  const api = useProgress()
  const { progress } = api
  const [screen, setScreen] = useState<Screen>(progress.seenIntro ? { name: 'map' } : { name: 'intro' })

  useEffect(() => {
    getDb() // warm up the in-browser Postgres while the story plays
  }, [])
  useEffect(() => setMuted(progress.muted), [progress.muted])
  useEffect(() => {
    document.documentElement.lang = 'en'
  }, [])

  const toMap = () => setScreen({ name: 'map' })
  const stars = Object.values(progress.completed).reduce((s, c) => s + c.stars, 0)
  const rank = [...acts].reverse().find((a) => a.lessons.length > 0 && a.lessons.every((l) => progress.completed[l.id]))?.rank ?? 'New Hire'
  const due = dueSkills(api).length

  return (
    <MotionConfig reducedMotion="user">
      <LangContext.Provider value={{ marathi: progress.marathi, name: progress.playerName }}>
        <div className="app">
          {screen.name !== 'intro' && (
            <header className="topbar">
              <button type="button" className="brand" onClick={toMap}>
                QA <mark>Quest</mark>
              </button>
              <div className="who">
                <span className="who-name">{progress.playerName}</span>
                <span className="rank">{rank}</span>
              </div>
              <div className="top-actions">
                <span className="star-count tabular" aria-label={`${stars} stars`}>★ {stars}</span>
                <button type="button" className={`btn small ${due ? 'due' : 'quiet'}`} onClick={() => setScreen({ name: 'standup' })}>
                  Standup{due ? ` (${due} due)` : ''}
                </button>
                <button type="button" className="btn small quiet" onClick={() => setScreen({ name: 'journal' })}>
                  Journal
                </button>
                <button type="button" className={`btn small ${progress.marathi ? 'toggle-on' : 'quiet'}`} onClick={api.toggleMarathi} aria-pressed={progress.marathi} title="Show Marathi under English">
                  मराठी
                </button>
                <button type="button" className="btn small quiet" onClick={api.toggleMute} aria-pressed={!progress.muted} aria-label="Sound">
                  {progress.muted ? 'Sound off' : 'Sound on'}
                </button>
              </div>
            </header>
          )}

          <AnimatePresence mode="wait">
            <motion.main key={screen.name + ('id' in screen ? screen.id : '')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {screen.name === 'intro' && (
                <Intro
                  initialName={progress.playerName}
                  marathi={progress.marathi}
                  onStart={(n) => {
                    api.setName(n)
                    toMap()
                  }}
                />
              )}
              {screen.name === 'map' && <CityMap api={api} onOpenLesson={(id) => setScreen({ name: 'lesson', id })} onOpenIncident={(id) => setScreen({ name: 'incident', id })} />}
              {screen.name === 'lesson' && <LessonPlayer key={screen.id} lesson={lessonById(screen.id)!} api={api} onExit={toMap} />}
              {screen.name === 'journal' && <Journal api={api} onExit={toMap} />}
              {screen.name === 'standup' && <Standup api={api} onExit={toMap} />}
              {screen.name === 'incident' && <IncidentReplay incident={incidents.find((i) => i.id === screen.id)!} onCaught={() => api.catchIncident(screen.id)} onExit={toMap} />}
            </motion.main>
          </AnimatePresence>
        </div>
      </LangContext.Provider>
    </MotionConfig>
  )
}
