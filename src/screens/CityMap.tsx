import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { acts, actUnlocked, incidents, isUnlocked, lessonById, startTrackOf, trackLessons, trackOf, tracks, worldOf, worlds, type TrackId } from '../content/index.ts'
import type { Act } from '../content/types.ts'
import { Gremlin, Portrait } from '../components/Portrait.tsx'
import { TrailPath, useNodeCenters } from '../components/Trail.tsx'
import type { ProgressApi } from '../state/progress.ts'
import { Bi, L } from '../lib/i18n.tsx'
import { sfx } from '../lib/sound.ts'
import { ActTrail } from './ActTrail.tsx'

export const PLOTS: Record<Act['building'], { icon: string }> = {
  hq: { icon: '🏢' },
  shop: { icon: '🛍️' },
  warehouse: { icon: '🏭' },
  bank: { icon: '🏦' },
  delivery: { icon: '🛵' },
  payments: { icon: '💳' },
  clinic: { icon: '🏥' },
  lab: { icon: '🧪' },
  airline: { icon: '✈️' },
  hangar: { icon: '🛫' },
  arena: { icon: '🏟️' },
  stage: { icon: '🎤' },
  pipeline: { icon: '🛠️' },
  chai: { icon: '☕' },
  mandi: { icon: '🧺' },
  lake: { icon: '🪣' },
  lambda: { icon: 'λ' },
  spark: { icon: '✨' },
  glue: { icon: '🧩' },
  dwh: { icon: '🏛️' },
  devhq: { icon: '💻' },
}

const LEVEL = { basic: { en: 'Foundations', mr: 'पाया' }, intermediate: { en: 'Intermediate', mr: 'मध्यम' }, advanced: { en: 'Advanced', mr: 'प्रगत' } } as const

// The open trail survives a trip into a lesson, so finishing a level brings you back to the same trail.
let rememberedAct: string | null = null

export function CityMap({ api, onOpenLesson, onOpenIncident }: { api: ProgressApi; onOpenLesson: (id: string) => void; onOpenIncident: (id: string) => void }) {
  const { progress } = api
  const actWorld = (id: string | null) => (id ? tracks.find((t) => t.acts.includes(id))?.world : undefined)
  const [openAct, setOpenActState] = useState<string | null>(actWorld(rememberedAct) === (progress.world ?? 'qa') ? rememberedAct : null)
  const [archive, setArchive] = useState(false)
  const setOpenAct = (id: string | null) => {
    rememberedAct = id
    setOpenActState(id)
    window.scrollTo({ top: 0 })
  }
  const act = acts.find((a) => a.id === openAct)
  const world = progress.world ?? 'qa'
  const worldInfo = worlds.find((w) => w.id === world)!
  const worldTracks = tracks.filter((t) => t.world === world)
  const worldLessons = worldTracks.flatMap((t) => trackLessons(t.id))
  const doneTotal = worldLessons.filter((l) => progress.completed[l.id]).length

  // "Continue": the next level in the track played most recently.
  const lastInWorld = Object.entries(progress.completed).filter(([id]) => worldOf(trackOf(id)) === world).sort((a, b) => b[1].at - a[1].at)[0]?.[0]
  const lastTrack: TrackId = lastInWorld ? trackOf(lastInWorld) : startTrackOf(world)
  const nextIn = (t: TrackId) => trackLessons(t).find((l) => !progress.completed[l.id] && isUnlocked(l.id, progress.completed))
  const next = nextIn(lastTrack) ?? worldTracks.map((t) => nextIn(t.id)).find(Boolean)
  const nextAct = next ? acts.find((a) => a.lessons.some((l) => l.id === next.id)) : undefined

  if (act) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key={act.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <ActTrail act={act} icon={PLOTS[act.building].icon} api={api} onBack={() => setOpenAct(null)} onOpenLesson={onOpenLesson} onOpenIncident={onOpenIncident} />
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="map-wrap">
      <section className="map-intro">
        <div>
          <div className="eyebrow"><L en="Quest map" mr="क्वेस्ट नकाशा" /></div>
          <h1 className="map-title">
            <span aria-hidden>{worldInfo.icon}</span> {worldInfo.heading.en}
          </h1>
          <p lang="mr" className="bi-mr">{worldInfo.heading.mr}</p>
        </div>
        <div className="map-gremlin">
          <Gremlin size={52} />
          <div className="taunt mono">{world === 'data' ? (doneTotal < 3 ? '>> your pipelines leak. ⌁' : doneTotal < 10 ? '>> i put nulls in your csv. ⌁' : '>> wait till you meet a billion rows. ⌁') : doneTotal < 7 ? '>> your city looks fragile. ⌁' : doneTotal < 20 ? '>> clean data? not for long. ⌁' : doneTotal < 35 ? '>> i live in your APIs now. ⌁' : doneTotal < 55 ? '>> fine. see you in selenium. ⌁' : doneTotal < 70 ? '>> my flights never land. ⌁' : '>> 10am flash sale. bring a bigger server. ⌁'}</div>
        </div>
      </section>

      {next && nextAct && (
        <motion.button
          type="button"
          className="continue-card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -3 }}
          onClick={() => {
            sfx.click()
            setOpenAct(nextAct.id)
          }}
        >
          <span className="cc-avatar" aria-hidden>
            <Portrait who="you" size={54} />
          </span>
          <span className="cc-text">
            <span className="eyebrow">{doneTotal ? <L en="Continue your quest" mr="तुमचा क्वेस्ट पुढे चालू ठेवा" /> : <L en="Start your quest" mr="तुमचा क्वेस्ट सुरू करा" />}</span>
            <span className="cc-title">
              <span className="li-code tabular">{next.code}</span> <L en={next.title.en} mr={next.title.mr} />
            </span>
            <span className="muted small">
              {PLOTS[nextAct.building].icon} {nextAct.client}
            </span>
          </span>
          <span className="cc-go" aria-hidden>▸</span>
        </motion.button>
      )}

      <div className="lanes">
        {worldTracks.map((t, ti) => (
          <Lane key={t.id} trackId={t.id} index={ti} api={api} onOpenAct={setOpenAct} onArchive={() => setArchive(true)} />
        ))}
      </div>

      <AnimatePresence>
        {archive && (
          <motion.aside key="archive" className="drawer dark" initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
            <button type="button" className="btn quiet small close" onClick={() => setArchive(false)} aria-label="Close">
              ✕
            </button>
            <div className="drawer-icon" aria-hidden>🗄️</div>
            <h2>Incident Archive</h2>
            <Bi t={{ en: 'Real software failures. Watch what happened, then rewind time and catch it.', mr: 'खरे सॉफ्टवेअर अपयश. काय घडलं ते पाहा, मग वेळ मागे घेऊन तो पकडा.' }} className="muted" />
            <ul className="lesson-list">
              {incidents.map((inc) => {
                const unlocked = Boolean(progress.completed[inc.unlockAfter])
                return (
                  <li key={inc.id}>
                    <button type="button" className="lesson-item" disabled={!unlocked} onClick={() => onOpenIncident(inc.id)}>
                      <span className="li-code">File</span>
                      <span className="li-title">
                        <Bi t={inc.title} />
                        <span className="muted small">{unlocked ? inc.year : `Unlocks after lesson ${lessonById(inc.unlockAfter)?.code ?? ''}`}</span>
                      </span>
                      <span className="li-state">{progress.incidents[inc.id] ? 'CAUGHT' : unlocked ? 'Open ▸' : 'Locked'}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}

/** One career track: its buildings joined by a trail, with the avatar standing where you are. */
function Lane({ trackId, index, api, onOpenAct, onArchive }: { trackId: TrackId; index: number; api: ProgressApi; onOpenAct: (id: string) => void; onArchive: () => void }) {
  const { progress } = api
  const t = tracks.find((x) => x.id === trackId)!
  const lessons = trackLessons(t.id)
  const done = lessons.filter((l) => progress.completed[l.id]).length
  const laneActs = t.acts.map((id) => acts.find((x) => x.id === id)!)
  const prologueDone = trackLessons(startTrackOf(t.world)).every((l) => progress.completed[l.id])
  const road = useRef<HTMLDivElement>(null)
  const nodeCount = laneActs.length + (t.id === 'start' ? 1 : 0)
  const { pts, size, setNode } = useNodeCenters(road, nodeCount, [progress.marathi])
  // the avatar stands on the first unfinished building of a started track
  const started = done > 0 || (t.id === startTrackOf(t.world) && !prologueDone)
  const hereIdx = laneActs.findIndex((a) => a.lessons.some((l) => !progress.completed[l.id]))
  const finishedActs = laneActs.filter((a) => a.lessons.length > 0 && a.lessons.every((l) => progress.completed[l.id])).length
  const walked = hereIdx === -1 ? laneActs.length - 1 : hereIdx

  return (
    <motion.section className={`lane lane-${t.id} ${t.soon ? 'soon' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <header className="lane-head">
        <div>
          <h2 className="lane-title">
            <L en={t.title.en} mr={t.title.mr} />
          </h2>
          <Bi t={t.blurb} className="muted small" />
        </div>
        {lessons.length > 1 && (
          <div className="track-meter" aria-label={`${done} of ${lessons.length} lessons complete`}>
            <div className="track-bar">
              <motion.span initial={{ width: 0 }} animate={{ width: `${(done / lessons.length) * 100}%` }} transition={{ duration: 0.8 }} />
            </div>
            <span className="tabular">
              <L en={`${done} of ${lessons.length} levels`} mr={`${lessons.length} पैकी ${done} लेव्हल`} />
            </span>
          </div>
        )}
      </header>
      <div className="lane-road" role="list" ref={road}>
        {!t.soon && <TrailPath pts={pts} size={size} done={started ? Math.max(walked, finishedActs) : 0} width={12} />}
        {laneActs.map((a, idx) => {
          const unlocked = actUnlocked(a, progress.completed)
          const finished = a.lessons.length > 0 && a.lessons.every((l) => progress.completed[l.id])
          const count = a.lessons.filter((l) => progress.completed[l.id]).length
          const stars = a.lessons.reduce((s, l) => s + (progress.completed[l.id]?.stars ?? 0), 0)
          const lockText = !a.available ? 'Coming soon' : !prologueDone && t.id !== startTrackOf(t.world) ? 'Finish the prologue to unlock' : 'Finish the previous building to unlock'
          const here = started && idx === hereIdx && unlocked
          return (
            <motion.button
              type="button"
              role="listitem"
              key={a.id}
              ref={setNode(idx)}
              className={`plot ${unlocked ? '' : 'locked'} ${finished ? 'done' : ''} ${here ? 'here' : ''}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 + idx * 0.06 }}
              whileHover={unlocked ? { y: -6, rotate: -0.6 } : { x: [0, -3, 3, 0] }}
              whileTap={unlocked ? { scale: 0.97 } : undefined}
              onClick={() => {
                sfx.click()
                if (unlocked) onOpenAct(a.id)
              }}
              aria-disabled={!unlocked}
              aria-label={`${a.client}. ${unlocked ? `${count} of ${a.lessons.length} levels done. Open the trail.` : lockText}`}
            >
              {here && (
                <motion.span className="plot-avatar" aria-hidden animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>
                  <Portrait who="you" size={40} />
                </motion.span>
              )}
              <span className="plot-icon" aria-hidden>{PLOTS[a.building].icon}</span>
              <span className="plot-name">{a.client}</span>
              <span className="plot-sub">{a.level ? <L en={LEVEL[a.level].en} mr={LEVEL[a.level].mr} /> : a.available ? <L en="Start here" mr="इथून सुरुवात" /> : <L en="Coming soon" mr="लवकरच" />}</span>
              {a.lessons.length > 0 && (
                <span className="plot-pips" aria-hidden>
                  {a.lessons.map((l) => (
                    <i key={l.id} className={progress.completed[l.id] ? 'on' : l.isBoss ? 'boss' : ''} />
                  ))}
                </span>
              )}
              {a.lessons.length > 0 && (
                <span className="plot-progress tabular">
                  {count}/{a.lessons.length}
                  {stars > 0 && <span className="plot-stars"> ★{stars}</span>}
                </span>
              )}
              {finished && <span className="plot-flag">Solved</span>}
              {!unlocked && <span className="plot-lock">🔒 {lockText}</span>}
            </motion.button>
          )
        })}
        {t.id === 'start' && (
          <motion.button type="button" role="listitem" ref={setNode(laneActs.length)} className="plot archive" whileHover={{ y: -6 }} onClick={onArchive}>
            <span className="plot-icon" aria-hidden>🗄️</span>
            <span className="plot-name">Incident Archive</span>
            <span className="plot-sub">
              <L en="Real-world failures" mr="खरी अपयशं" />
            </span>
          </motion.button>
        )}
      </div>
    </motion.section>
  )
}
