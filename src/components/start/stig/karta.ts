/**
 * Kartbakgrunden i ett mellanrum mellan startsidans paneler: en ljus topografisk karta med höjdkurvor
 * och vatten, 1200 × 160 px. Den fyller mellanrummet i panelernas bredd, under leden.
 *
 * Bilden behåller sina proportioner och täcker ytan (som object-fit: cover). Kartmönstret är jämnt, så
 * det som beskärs i kanterna, mest i smala fönster, saknas inte. Kanterna tonar ut mot sidans bakgrund.
 */
import type { Matt } from '@/components/start/stig/geometri'

export type Karta = 'skog' | 'sjo' | 'hostbjorkar' | 'fjall'

export const KARTBILD = { bredd: 1200, hojd: 160 }

export const kartSrc = (k: Karta) => `/karta/${k}.webp`

/** Ytan kartan fyller och hur mycket som tonas ut vid kanterna, i px. */
export interface Kartyta {
  x: number
  y: number
  bredd: number
  hojd: number
  /** Utoning vid vänster och höger kant. */
  sidtoning: number
  /** Utoning vid över- och underkant, mot panelerna. */
  hojdtoning: number
  /** Skalan bilden visas i. Samma i båda led. */
  skala: number
}

export function placeraKarta(m: Pick<Matt, 'hojd' | 'vanster' | 'hoger'>): Kartyta | null {
  const bredd = m.hoger - m.vanster
  if (!(bredd > 0 && m.hojd > 0)) return null
  return {
    x: m.vanster,
    y: 0,
    bredd,
    hojd: m.hojd,
    sidtoning: Math.min(64, bredd * 0.08),
    hojdtoning: Math.min(16, m.hojd * 0.12),
    skala: Math.max(bredd / KARTBILD.bredd, m.hojd / KARTBILD.hojd),
  }
}
