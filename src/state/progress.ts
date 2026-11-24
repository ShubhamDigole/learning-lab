import { useCallback, useEffect, useState } from 'react'

export interface SkillState {
  state: 'seen' | 'practiced' | 'mastered'
  /** days until next review */
  interval: number
  due: number
}

export interface Progress {
  playerName: string
  seenIntro: boolean
  completed: Record<string, { stars: number; at: number }>
  skills: Record<string, SkillState>
  incidents: Record<string, boolean>
  muted: boolean
  /** show Marathi under English */
  marathi: boolean
}

const KEY = 'qa-quest-v2'
const DAY = 24 * 60 * 60 * 1000
const LADDER = [1, 3, 7, 21]

const empty: Progress = { playerName: '', seenIntro: false, completed: {}, skills: {}, incidents: {}, muted: false, marathi: true }

function load(): Progress {
  try {
    // carry over progress saved by the first version of the game
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem('qa-quest-v1')
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

export function useProgress() {
  const [p, setP] = useState<Progress>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(p))
    } catch {
      /* storage blocked: progress lives for this session only */
    }
  }, [p])

  const update = useCallback((fn: (p: Progress) => Progress) => setP((prev) => fn(prev)), [])

  return {
    progress: p,
    setName: (playerName: string) => update((p) => ({ ...p, playerName, seenIntro: true })),
    toggleMute: () => update((p) => ({ ...p, muted: !p.muted })),
    toggleMarathi: () => update((p) => ({ ...p, marathi: !p.marathi })),
    markSeen: (skill: string) =>
      update((p) => (p.skills[skill] ? p : { ...p, skills: { ...p.skills, [skill]: { state: 'seen', interval: 0, due: 0 } } })),
    completeLesson: (id: string, skill: string, stars: number) =>
      update((p) => {
        const prevStars = p.completed[id]?.stars ?? 0
        const s = p.skills[skill]
        const skillState: SkillState =
          s && s.state !== 'seen' ? s : { state: 'practiced', interval: LADDER[0], due: Date.now() + LADDER[0] * DAY }
        return {
          ...p,
          completed: { ...p.completed, [id]: { stars: Math.max(prevStars, stars), at: Date.now() } },
          skills: { ...p.skills, [skill]: skillState },
        }
      }),
    reviewSkill: (skill: string, correct: boolean) =>
      update((p) => {
        const s = p.skills[skill]
        if (!s) return p
        const step = correct ? LADDER.findIndex((d) => d > s.interval) : 0
        const interval = correct ? LADDER[step === -1 ? LADDER.length - 1 : step] : LADDER[0]
        const state: SkillState['state'] = correct && s.interval >= 1 ? 'mastered' : 'practiced'
        return { ...p, skills: { ...p.skills, [skill]: { state, interval, due: Date.now() + interval * DAY } } }
      }),
    catchIncident: (id: string) => update((p) => ({ ...p, incidents: { ...p.incidents, [id]: true } })),
    reset: () => setP(empty),
  }
}

export type ProgressApi = ReturnType<typeof useProgress>
