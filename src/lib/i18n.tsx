import { createContext, useContext, type ElementType, type ReactNode } from 'react'
import type { Text } from '../content/types.ts'

export interface LangPrefs {
  marathi: boolean
  name: string
}

export const LangContext = createContext<LangPrefs>({ marathi: true, name: '' })

export function useLang() {
  return useContext(LangContext)
}

export function fill(text: string, name: string) {
  return text.replaceAll('{name}', name || 'detective')
}

export function en(t: Text, name = ''): string {
  return fill(typeof t === 'string' ? t : t.en, name)
}

/**
 * Bilingual text: English on top, Marathi underneath in a Devanagari face.
 * Plain strings (code, product names) render once.
 */
export function Bi({ t, as: As = 'div', className = '', children }: { t: Text; as?: ElementType; className?: string; children?: ReactNode }) {
  const { marathi, name } = useLang()
  if (typeof t === 'string') return <As className={className}>{fill(t, name)}{children}</As>
  return (
    <As className={`bi ${className}`}>
      <span lang="en" className="bi-en">
        {fill(t.en, name)}
      </span>
      {marathi && t.mr && (
        <span lang="mr" className="bi-mr">
          {fill(t.mr, name)}
        </span>
      )}
      {children}
    </As>
  )
}

/** Short inline label: English, then Marathi in a lighter Devanagari face (no separator glyph). */
export function L({ en: e, mr }: { en: string; mr: string }) {
  const { marathi } = useLang()
  return (
    <span className="l">
      <span lang="en">{e}</span>
      {marathi && (
        <span lang="mr" className="l-mr">
          {mr}
        </span>
      )}
    </span>
  )
}
