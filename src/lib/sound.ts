// Tiny Web Audio sound kit: no audio files needed. Effects are short synth phrases; the background
// music is a soft generated loop (pad chords, a gentle bass and a pentatonic melody) at low volume.
let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false
let musicOn = true

function ac() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 1
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, dest?: AudioNode) {
  if (muted) return
  try {
    const c = ac()
    const t = c.currentTime + start
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g).connect(dest ?? master!)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  } catch {
    /* audio unavailable */
  }
}

const N = (semi: number) => 440 * Math.pow(2, (semi - 9) / 12) // semitones from C4

export const sfx = {
  click: () => tone(660, 0, 0.06, 'triangle', 0.05),
  chime: () => {
    tone(784, 0, 0.35)
    tone(988, 0.08, 0.35)
    tone(1319, 0.16, 0.5)
  },
  /** a right answer: bright rising arpeggio with a sparkle on top */
  success: () => {
    ;[0, 4, 7, 12].forEach((s, i) => tone(N(s + 12), i * 0.07, 0.4, 'triangle', 0.09))
    tone(N(31), 0.3, 0.6, 'sine', 0.05)
    tone(N(24), 0.3, 0.7, 'sine', 0.06)
  },
  /** a wrong answer: soft two-note "uh-oh", not harsh */
  wrong: () => {
    tone(N(7), 0, 0.18, 'triangle', 0.08)
    tone(N(1), 0.16, 0.32, 'triangle', 0.08)
    tone(N(-11), 0.16, 0.3, 'sine', 0.06)
  },
  /** a level or exam passed: short fanfare */
  fanfare: () => {
    const seq = [0, 4, 7, 12, 7, 12, 16]
    seq.forEach((s, i) => tone(N(s + 12), i * 0.11, i === seq.length - 1 ? 0.9 : 0.22, 'square', 0.045))
    ;[0, 4, 7].forEach((s) => tone(N(s), 0.66, 1.1, 'triangle', 0.06))
  },
  thud: () => {
    tone(90, 0, 0.25, 'square', 0.1)
    tone(60, 0.02, 0.3, 'sine', 0.15)
  },
  buzz: () => tone(160, 0, 0.18, 'sawtooth', 0.05),
  glitch: () => {
    for (let i = 0; i < 5; i++) tone(200 + Math.random() * 900, i * 0.04, 0.05, 'square', 0.04)
  },
  rewind: () => {
    for (let i = 0; i < 8; i++) tone(1200 - i * 120, i * 0.05, 0.06, 'sawtooth', 0.03)
  },
}

// ---------- background music ----------
let musicGain: GainNode | null = null
let musicTimer: ReturnType<typeof setInterval> | null = null
let nextBar = 0
let bar = 0
// I - vi - IV - V in C, a calm loop; melody notes from the pentatonic scale
const CHORDS = [
  [0, 4, 7],
  [-3, 0, 4],
  [-7, -3, 0],
  [-5, -1, 2],
]
const MELODY = [12, 14, 16, 19, 21, 24]
const BAR = 2.4 // seconds per bar (~100 bpm)

function scheduleBar(t: number, i: number) {
  if (!musicGain || !ctx) return
  const chord = CHORDS[i % CHORDS.length]
  const play = (freq: number, at: number, dur: number, type: OscillatorType, gain: number) => {
    const osc = ctx!.createOscillator()
    const g = ctx!.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, at)
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(gain, at + Math.min(0.4, dur / 3))
    g.gain.linearRampToValueAtTime(0, at + dur)
    osc.connect(g).connect(musicGain!)
    osc.start(at)
    osc.stop(at + dur + 0.05)
  }
  chord.forEach((s) => play(N(s), t, BAR, 'sine', 0.05)) // pad
  play(N(chord[0] - 12), t, BAR * 0.5, 'triangle', 0.06) // bass
  play(N(chord[0] - 12), t + BAR * 0.5, BAR * 0.5, 'triangle', 0.05)
  // a sparse melody: 2 or 3 notes a bar, chosen by a simple pattern so it never repeats exactly
  const steps = [0, 0.75, 1.5]
  steps.forEach((st, k) => {
    if ((i + k) % 3 === 2) return
    const note = MELODY[(i * 2 + k * 3) % MELODY.length]
    play(N(note), t + st, 0.7, 'triangle', 0.03)
  })
}

function startMusic() {
  if (musicTimer || muted || !musicOn) return
  try {
    const c = ac()
    musicGain = c.createGain()
    musicGain.gain.value = 0
    musicGain.gain.linearRampToValueAtTime(0.55, c.currentTime + 2)
    musicGain.connect(master!)
    nextBar = c.currentTime + 0.2
    bar = 0
    const tick = () => {
      if (!ctx) return
      while (nextBar < ctx.currentTime + 1.2) {
        scheduleBar(nextBar, bar++)
        nextBar += BAR
      }
    }
    tick()
    musicTimer = setInterval(tick, 400)
  } catch {
    /* audio unavailable */
  }
}
function stopMusic() {
  if (musicTimer) clearInterval(musicTimer)
  musicTimer = null
  if (musicGain && ctx) {
    const g = musicGain
    g.gain.cancelScheduledValues(ctx.currentTime)
    g.gain.setValueAtTime(g.gain.value, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6)
    setTimeout(() => g.disconnect(), 800)
  }
  musicGain = null
}

/** Browsers only allow sound after the first tap or key press, so music starts then. */
let armed = false
function arm() {
  if (armed || typeof window === 'undefined') return
  armed = true
  const go = () => {
    window.removeEventListener('pointerdown', go)
    window.removeEventListener('keydown', go)
    if (!muted && musicOn) startMusic()
  }
  window.addEventListener('pointerdown', go)
  window.addEventListener('keydown', go)
}

export function setMuted(m: boolean) {
  muted = m
  if (m) stopMusic()
  else if (musicOn && ctx) startMusic()
  arm()
}
export function setMusic(on: boolean) {
  musicOn = on
  if (!on) stopMusic()
  else if (!muted && ctx) startMusic()
  arm()
}
