import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { CharacterId, DialogueLine } from '../content/types.ts'
import { CHARACTERS, Portrait } from './Portrait.tsx'
import { Stage } from './Stage.tsx'
import type { Place } from './Backdrop.tsx'
import { fill, L, useLang } from '../lib/i18n.tsx'
import { sfx } from '../lib/sound.ts'

function nameOf(who: CharacterId) {
  if (who === 'gremlin') return { name: 'The Gremlin', role: 'chaos script' }
  if (who === 'narrator') return { name: '', role: '' }
  return CHARACTERS[who]
}

/**
 * A scene played on an illustrated background. Everyone in the conversation stands on stage;
 * the speaker steps forward and talks while the English line types out, then the Marathi fades in.
 */
export function Dialogue({ lines, onDone, place = 'office' }: { lines: DialogueLine[]; onDone: () => void; place?: Place }) {
  const { marathi, name } = useLang()
  const [idx, setIdx] = useState(0)
  const [chars, setChars] = useState(0)
  const line = lines[idx]
  const full = fill(line?.text.en ?? '', name)
  const typing = chars < full.length
  const last = idx === lines.length - 1
  const cast = useMemo(() => [...new Set(lines.map((l) => l.who).filter((w) => w !== 'narrator'))], [lines])

  useEffect(() => {
    setChars(0)
    if (line?.who === 'gremlin') sfx.glitch()
  }, [idx, line?.who])

  useEffect(() => {
    if (!typing) return
    const t = setTimeout(() => setChars((c) => Math.min(full.length, c + 2)), 16)
    return () => clearTimeout(t)
  }, [chars, typing, full.length])

  useEffect(() => {
    if (last && !typing) onDone()
  }, [last, typing, onDone])

  if (!line) return null

  const advance = () => {
    if (typing) setChars(full.length)
    else if (!last) {
      sfx.click()
      setIdx((i) => i + 1)
    }
  }
  const skip = () => {
    setIdx(lines.length - 1)
    setChars(Number.MAX_SAFE_INTEGER)
  }

  const speaker = nameOf(line.who)
  const isGremlin = line.who === 'gremlin'
  const isNarrator = line.who === 'narrator'
  const speakerIndex = Math.max(0, (cast as CharacterId[]).indexOf(line.who))

  return (
    <div className="dialogue">
      <Stage place={place}>
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            className={`speech ${isGremlin ? 'speech-gremlin' : ''} ${isNarrator ? 'speech-narrator' : ''}`}
            style={{ ['--tail-x' as string]: `${48 + speakerIndex * 132}px` }}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            onClick={advance}
          >
            {speaker.name && (
              <div className="speaker">
                {speaker.name} <span className="role">{speaker.role}</span>
              </div>
            )}
            <p lang="en" className={isGremlin ? 'mono' : ''}>
              {full.slice(0, chars)}
              {typing && <span className="caret" aria-hidden>▍</span>}
            </p>
            {marathi && !typing && (
              <motion.p lang="mr" className={`bi-mr ${isGremlin ? 'mono' : ''}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                {fill(line.text.mr, name)}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="cast" aria-hidden>
          {cast.map((who) => {
            const speaking = who === line.who
            const n = nameOf(who)
            return (
              <motion.div key={who} className={`actor ${speaking ? 'speaking' : ''}`} animate={{ y: speaking ? -6 : 0, opacity: speaking ? 1 : 0.55, scale: speaking ? 1 : 0.9 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
                <Portrait who={who} mood={speaking ? line.mood : 'neutral'} size={124} framed={false} talking={speaking && typing} />
                <span className="actor-name">{who === 'gremlin' ? 'Gremlin' : n.name.split(' ')[0]}</span>
              </motion.div>
            )
          })}
        </div>
      </Stage>

      <div className="dialogue-controls">
        <span className="dots" aria-label={`Line ${idx + 1} of ${lines.length}`}>
          {lines.map((_, i) => (
            <i key={i} className={i <= idx ? 'on' : ''} />
          ))}
        </span>
        <div className="dialogue-buttons">
          {!(last && !typing) && lines.length > 1 && (
            <button type="button" className="btn quiet small" onClick={skip}>
              <L en="Skip" mr="वगळा" />
            </button>
          )}
          {last && !typing ? (
            <span className="tap done">
              <L en="Scene finished" mr="प्रसंग संपला" />
            </span>
          ) : (
            <button type="button" className="btn primary" onClick={advance}>
              {typing ? <L en="Show all" mr="पूर्ण दाखवा" /> : <L en="Continue" mr="पुढे चला" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
