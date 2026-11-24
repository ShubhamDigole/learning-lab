import { useLayoutEffect, useRef, useState, type RefObject } from 'react'

export interface Pt {
  x: number
  y: number
}

/** Measures the centre of each node (relative to the container) and keeps it current on resize. */
export function useNodeCenters(container: RefObject<HTMLElement>, count: number, deps: unknown[] = []) {
  const nodes = useRef<(HTMLElement | null)[]>([])
  const [pts, setPts] = useState<Pt[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = container.current
    if (!el) return
    const measure = () => {
      const box = el.getBoundingClientRect()
      setSize({ w: box.width, h: box.height })
      setPts(
        nodes.current.slice(0, count).flatMap((n) => {
          if (!n) return []
          const r = n.getBoundingClientRect()
          return [{ x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 }]
        }),
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    nodes.current.forEach((n) => n && ro.observe(n))
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, ...deps])
  const setNode = (i: number) => (n: HTMLElement | null) => {
    nodes.current[i] = n
  }
  return { pts, size, setNode }
}

/** A smooth curve through the points (Catmull-Rom turned into cubic Béziers). */
export function smoothPath(p: Pt[]): string {
  if (p.length === 0) return ''
  if (p.length === 1) return `M${p[0].x},${p[0].y}`
  let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i]
    const b = p[i]
    const c = p[i + 1]
    const e = p[i + 2] ?? c
    const c1 = { x: b.x + (c.x - a.x) / 6, y: b.y + (c.y - a.y) / 6 }
    const c2 = { x: c.x - (e.x - b.x) / 6, y: c.y - (e.y - b.y) / 6 }
    d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`
  }
  return d
}

/**
 * The trail drawn behind the nodes: a soft road, a dashed line for the way ahead, and a bright line
 * over the part already walked (`done` = how many nodes have been reached).
 */
export function TrailPath({ pts, size, done, tone = 'var(--marker)', width = 14 }: { pts: Pt[]; size: { w: number; h: number }; done: number; tone?: string; width?: number }) {
  if (pts.length < 2 || !size.w) return null
  const all = smoothPath(pts)
  const walked = smoothPath(pts.slice(0, Math.max(1, Math.min(done + 1, pts.length))))
  return (
    <svg className="trail-svg" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden>
      <path d={all} fill="none" stroke="var(--trail-road)" strokeWidth={width + 10} strokeLinecap="round" strokeLinejoin="round" />
      <path d={all} fill="none" stroke="var(--trail-edge)" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <path d={all} fill="none" stroke="var(--trail-dash)" strokeWidth={2.5} strokeDasharray="2 12" strokeLinecap="round" />
      {done > 0 && <path key={walked} className="trail-walk" d={walked} pathLength={1} fill="none" stroke={tone} strokeWidth={width - 4} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}
