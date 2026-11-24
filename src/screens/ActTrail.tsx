import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { incidents, isUnlocked } from '../content/index.ts'
import type { Act, Lesson } from '../content/types.ts'
import { Gremlin, Portrait } from '../components/Portrait.tsx'
import { Confetti } from '../components/Celebrate.tsx'
import { TrailPath, useNodeCenters } from '../components/Trail.tsx'
import type { ProgressApi } from '../state/progress.ts'
import { Bi, L } from '../lib/i18n.tsx'
import { sfx } from '../lib/sound.ts'

// Where the avatar stood the last time each trail was shown, so it can walk to the next level.
const lastSeen: Record<string, number> = {}
// The trail shape: how far each level sits from the centre line (as a share of --shift).
const ZIG = [0, 0.6, 1, 0.6, 0, -0.6, -1, -0.6]

const LEVEL = { basic: { en: 'Foundations', mr: 'पाया' }, intermediate: { en: 'Intermediate', mr: 'मध्यम' }, advanced: { en: 'Advanced', mr: 'प्रगत' } } as const

export function ActTrail({ act, icon, api, onBack, onOpenLesson, onOpenIncident }: { act: Act; icon: string; api: ProgressApi; onBack: () => void; onOpenLesson: (id: string) => void; onOpenIncident: (id: string) => void }) {
  const { progress } = api
  const lessons = act.lessons
  const done = lessons.filter((l) => progress.completed[l.id]).length
  const allDone = done === lessons.length
  const current = allDone ? lessons.length : lessons.findIndex((l) => !progress.completed[l.id])
  const stars = lessons.reduce((s, l) => s + (progress.completed[l.id]?.stars ?? 0), 0)
  const [avatarAt, setAvatarAt] = useState(lastSeen[act.id] ?? current)
  const [open, setOpen] = useState<number | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const { pts, size, setNode } = useNodeCenters(wrap, lessons.length + 1, [open])
  const justFinished = allDone && (lastSeen[act.id] ?? lessons.length) < lessons.length

  useEffect(() => {
    if (avatarAt !== current) {
      const t = setTimeout(() => {
        setAvatarAt(current)
        sfx.chime()
      }, 650)
      return () => clearTimeout(t)
    }
  }, [avatarAt, current])
  useEffect(() => {
    lastSeen[act.id] = current
  }, [act.id, current])
  useEffect(() => {
    const t = setTimeout(() => wrap.current?.querySelector('.tnode-row.is-current')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 350)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (open !== null ? setOpen(null) : onBack())
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onBack])

  const pick = (i: number) => {
    sfx.click()
    setOpen(open === i ? null : i)
  }

  return (
    <div className={`act-trail b-${act.building}`}>
      <header className="trail-head">
        <button type="button" className="btn quiet small" onClick={onBack}>
          ← <L en="City map" mr="शहराचा नकाशा" />
        </button>
        <div className="trail-title">
          <span className="trail-icon" aria-hidden>{icon}</span>
          <div>
            <div className="eyebrow">{act.client}</div>
            <Bi t={act.title} as="h1" />
            <Bi t={act.domain} className="muted small" />
          </div>
        </div>
        <div className="trail-stats">
          <div className="track-meter" aria-label={`${done} of ${lessons.length} levels complete`}>
            <div className="track-bar">
              <motion.span initial={{ width: 0 }} animate={{ width: `${(done / lessons.length) * 100}%` }} transition={{ duration: 0.8 }} />
            </div>
            <span className="tabular">
              <L en={`${done} of ${lessons.length} levels`} mr={`${lessons.length} पैकी ${done} लेव्हल`} /> · ★ {stars}/{lessons.length * 3}
            </span>
          </div>
        </div>
      </header>

      <LayoutGroup>
        <div className="trail-map" ref={wrap}>
          <TrailPath pts={pts} size={size} done={Math.min(avatarAt, lessons.length)} />
          <div className="trail-start" aria-hidden>
            <span>🚩</span>
            <L en="Start" mr="सुरुवात" />
          </div>
          <ol className="tnodes">
            {lessons.map((l, i) => {
              const files = incidents.filter((x) => x.unlockAfter === l.id)
              return (
                <TrailNode
                  key={l.id}
                  lesson={l}
                  index={i}
                  zig={ZIG[i % ZIG.length]}
                  state={progress.completed[l.id] ? 'done' : isUnlocked(l.id, progress.completed) ? 'open' : 'locked'}
                  starsWon={progress.completed[l.id]?.stars ?? 0}
                  isCurrent={i === current}
                  hasAvatar={i === avatarAt}
                  prev={lessons[i - 1]}
                  isOpen={open === i}
                  nodeRef={setNode(i)}
                  onPick={() => pick(i)}
                  onStart={() => onOpenLesson(l.id)}
                  files={files.map((f) => ({ id: f.id, title: f.title, year: f.year, unlocked: Boolean(progress.completed[f.unlockAfter]), caught: Boolean(progress.incidents[f.id]) }))}
                  onOpenIncident={onOpenIncident}
                />
              )
            })}
            <li className={`tnode-row trophy-row ${allDone ? 'is-current' : ''}`} style={{ ['--k' as string]: ZIG[lessons.length % ZIG.length] }}>
              <motion.div
                ref={setNode(lessons.length)}
                className={`tnode trophy ${allDone ? 'won' : ''}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 * lessons.length }}
              >
                <span aria-hidden>🏆</span>
                {avatarAt === lessons.length && <Avatar />}
              </motion.div>
              <div className="tnode-label">
                <strong>{act.rank}</strong>
                <span className="muted small">{allDone ? <L en="Rank earned" mr="पद मिळालं" /> : <L en="Finish every level to earn this rank" mr="हे पद मिळवण्यासाठी सगळ्या लेव्हल पूर्ण करा" />}</span>
              </div>
              {justFinished && <Confetti count={30} />}
            </li>
          </ol>
        </div>
      </LayoutGroup>
    </div>
  )
}

function Avatar() {
  return (
    <motion.span layoutId="trail-avatar" className="trail-avatar" transition={{ type: 'spring', stiffness: 120, damping: 16 }} aria-hidden>
      <motion.span className="avatar-bob" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>
        <Portrait who="you" size={42} />
      </motion.span>
    </motion.span>
  )
}

interface FileNode {
  id: string
  title: { en: string; mr: string }
  year: string
  unlocked: boolean
  caught: boolean
}

function TrailNode({
  lesson: l,
  index,
  zig,
  state,
  starsWon,
  isCurrent,
  hasAvatar,
  prev,
  isOpen,
  nodeRef,
  onPick,
  onStart,
  files,
  onOpenIncident,
}: {
  lesson: Lesson
  index: number
  zig: number
  state: 'done' | 'open' | 'locked'
  starsWon: number
  isCurrent: boolean
  hasAvatar: boolean
  prev?: Lesson
  isOpen: boolean
  nodeRef: (n: HTMLElement | null) => void
  onPick: () => void
  onStart: () => void
  files: FileNode[]
  onOpenIncident: (id: string) => void
}) {
  const boss = Boolean(l.isBoss)
  const cardId = `card-${l.id}`
  return (
    <li className={`tnode-row ${isCurrent ? 'is-current' : ''} ${zig > 0 ? 'right' : zig < 0 ? 'left' : 'mid'}`} style={{ ['--k' as string]: zig }}>
      <motion.button
        ref={nodeRef as (n: HTMLButtonElement | null) => void}
        type="button"
        className={`tnode ${state} ${boss ? 'boss' : ''} ${isCurrent ? 'current' : ''}`}
        onClick={onPick}
        aria-expanded={isOpen}
        aria-controls={cardId}
        aria-label={`${l.code} ${l.title.en}${state === 'done' ? `, done, ${starsWon} stars` : state === 'locked' ? ', locked' : ', ready'}`}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05 * index, type: 'spring', stiffness: 260, damping: 18 }}
        whileHover={state !== 'locked' ? { scale: 1.08, y: -3 } : { rotate: [0, -4, 4, 0] }}
        whileTap={{ scale: 0.94 }}
      >
        {isCurrent && <span className="tnode-pulse" aria-hidden />}
        <span className="tnode-face" aria-hidden>
          {boss && state !== 'done' ? <Gremlin size={56} framed={false} mood={state === 'locked' ? 'smug' : 'angry'} /> : state === 'locked' ? '🔒' : l.recap.icon}
        </span>
        <span className="tnode-code tabular">{l.code}</span>
        {hasAvatar && <Avatar />}
        {isCurrent && !hasAvatar && null}
      </motion.button>
      <div className="tnode-label">
        <span className="tnode-title">
          <L en={l.title.en} mr={l.title.mr} />
        </span>
        {state === 'done' ? (
          <span className="tnode-stars" aria-hidden>
            {'★'.repeat(starsWon)}
            <span className="dim">{'★'.repeat(3 - starsWon)}</span>
          </span>
        ) : boss ? (
          <span className="tnode-tag boss-tag">
            <L en="Boss level" mr="बॉस लेव्हल" />
          </span>
        ) : isCurrent ? (
          <span className="tnode-tag go-tag">
            <L en="You are here" mr="तुम्ही इथे आहात" />
          </span>
        ) : null}
      </div>

      {files.map((f) => (
        <motion.button
          key={f.id}
          type="button"
          className={`tfile ${f.unlocked ? '' : 'locked'} ${f.caught ? 'caught' : ''}`}
          onClick={() => f.unlocked && onOpenIncident(f.id)}
          disabled={!f.unlocked}
          whileHover={f.unlocked ? { scale: 1.06, rotate: -2 } : undefined}
          title={f.unlocked ? f.title.en : `Unlocks after ${l.code}`}
        >
          <span aria-hidden>{f.caught ? '✅' : f.unlocked ? '🗂️' : '🔒'}</span>
          <span className="tfile-text">
            <strong>
              <L en="Incident file" mr="घटना फाइल" />
            </strong>
            <span className="small">{f.unlocked ? f.title.en : `After ${l.code}`}</span>
          </span>
        </motion.button>
      ))}

      <AnimatePresence>
        {isOpen && (
          <motion.div id={cardId} className={`tcard ${state}`} initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.18 }}>
            <div className="tcard-top">
              <span className="li-code tabular">{l.code}</span>
              <span className="tcard-level">
                <L en={LEVEL[l.level].en} mr={LEVEL[l.level].mr} />
              </span>
              {boss && (
                <span className="tnode-tag boss-tag">
                  <L en="Boss" mr="बॉस" />
                </span>
              )}
            </div>
            <Bi t={l.title} as="h3" />
            <p className="tcard-story">
              <span aria-hidden>{l.recap.icon}</span> <L en={l.realLife.title.en} mr={l.realLife.title.mr} />
            </p>
            <p className="muted small">
              <L en={`Skill: ${l.skill} · ${l.practice.steps.length} practice tasks · ${l.exam.length} exam questions`} mr={`कौशल्य: ${l.skill} · ${l.practice.steps.length} सराव कामं · ${l.exam.length} परीक्षा प्रश्न`} />
            </p>
            {state === 'locked' ? (
              <p className="tcard-lock">
                🔒 <L en={prev ? `Finish ${prev.code} first.` : 'Finish the prologue first.'} mr={prev ? `आधी ${prev.code} पूर्ण करा.` : 'आधी प्रस्तावना पूर्ण करा.'} />
              </p>
            ) : (
              <button type="button" className="btn primary" onClick={onStart}>
                {state === 'done' ? <L en="Play again" mr="पुन्हा खेळा" /> : boss ? <L en="Fight the boss ▸" mr="बॉसशी लढा ▸" /> : <L en="Start level ▸" mr="लेव्हल सुरू करा ▸" />}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}
