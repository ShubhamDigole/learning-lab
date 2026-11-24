import type { ReactNode } from 'react'
import { Backdrop, type Place } from './Backdrop.tsx'

/** An illustrated scene: a related background with the cast and speech bubbles in front of it. */
export function Stage({ place, children, compact = false }: { place: Place; children: ReactNode; compact?: boolean }) {
  return (
    <div className={`stage ${compact ? 'compact' : ''}`} data-place={place}>
      <Backdrop place={place} />
      <div className="stage-content">{children}</div>
    </div>
  )
}
