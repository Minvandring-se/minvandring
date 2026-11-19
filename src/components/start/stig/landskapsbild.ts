/**
 * Landskapsbilden i ett mellanrum mellan startsidans paneler. Bilderna är 1200 × 160 px med motiven
 * ute vid sidorna och marken nertill, och ligger under leden.
 *
 * Bilden har alltid sina proportioner. Den visas i panelernas bredd med marken nere vid nästa panel.
 * I smala fönster skulle den bli för låg, så där visas vänster och höger halva större och det mesta av
 * den tomma mitten faller bort. Halvorna tonar då ut mot mitten.
 */
import type { Matt } from '@/components/start/stig/geometri'

export type Landskap = 'skog' | 'sjo' | 'hostbjorkar' | 'fjall'

export const BILD = { bredd: 1200, hojd: 160 }
/** Minsta skala, så att landskapet syns även i mobil. */
export const MINSTA_SKALA = 0.45

export const landskapSrc = (l: Landskap) => `/landskap/${l}.webp`

/** En halva: var den står i mellanrummet och vilken del av bilden den visar (viewBox i bildens px). */
export interface Halva {
  x: number
  y: number
  bredd: number
  hojd: number
  viewBox: string
}

export function placeraLandskap(m: Pick<Matt, 'hojd' | 'vanster' | 'hoger'>): { vanster: Halva; hoger: Halva; beskuren: boolean } | null {
  const panel = m.hoger - m.vanster
  if (!(panel > 0 && m.hojd > 0)) return null
  // Inte högre än mellanrummet, och aldrig större än originalet.
  const skala = Math.min(1, m.hojd / BILD.hojd, Math.max(panel / BILD.bredd, MINSTA_SKALA))
  const hojd = BILD.hojd * skala
  const halv = panel / 2
  // Så mycket av bilden varje halva visar, i bildens px. Mer än halva bilden går inte.
  const visad = Math.min(BILD.bredd / 2, halv / skala)
  const bredd = visad * skala
  const y = m.hojd - hojd
  return {
    vanster: { x: m.vanster, y, bredd, hojd, viewBox: `0 0 ${visad} ${BILD.hojd}` },
    hoger: { x: m.hoger - bredd, y, bredd, hojd, viewBox: `${BILD.bredd - visad} 0 ${visad} ${BILD.hojd}` },
    beskuren: visad < BILD.bredd / 2 - 0.5,
  }
}
