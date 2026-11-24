// Tiny Web Audio sound kit: no audio files needed.
let ctx: AudioContext | null = null
let muted = false

export function setMuted(m: boolean) {
  muted = m
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12) {
  if (muted) return
  try {
    ctx ??= new AudioContext()
    const t = ctx.currentTime + start
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  } catch {
    /* audio unavailable */
  }
}

export const sfx = {
  click: () => tone(660, 0, 0.06, 'triangle', 0.05),
  chime: () => {
    tone(784, 0, 0.35)
    tone(988, 0.08, 0.35)
    tone(1319, 0.16, 0.5)
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
