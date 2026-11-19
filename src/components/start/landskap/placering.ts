/**
 * Var landskapsbilderna står på startsidan. Bilderna skalas alltid lika i bredd och höjd.
 *
 * - Banden: varje mellanrum mellan korten har ett landskap, delat i en vänster- och en högerdel som
 *   står mot panelernas kanter med marken nere vid nästa panel. Mitten, där leden och dess figurer
 *   står, hålls fri. I smala fönster beskärs delarna på insidan och tonar ut där.
 * - Sidomotiven: på breda skärmar står ett motiv i varje ytterkant bredvid varje mellanrum, med
 *   marken i samma höjd som bandet. I smalare fönster finns ingen plats och då visas de inte.
 */
import type { Bild } from '@/components/start/landskap/bilder'

export interface Placering {
  /** Sidan motivet står på. Den avskurna kanten vetter mot panelen och tonas ut där. */
  sida?: 'vanster' | 'hoger'
  bild: Bild
  x: number
  y: number
  bredd: number
  hojd: number
}

export interface Ruta {
  vanster: number
  hoger: number
  topp: number
  botten: number
}

/** Bandet ritas i originalstorlek när panelerna är 1200 px breda, och aldrig mindre än så här. */
const MINSTA_SKALA = 0.6
/** Varje del får som mest ta så här stor del av panelens bredd, så att mitten blir fri. */
const STORSTA_ANDEL = 0.42
/** Marken ligger så här högt över nästa panel. */
const MARK = 6

/** Ett band i ett mellanrum. bredd och hojd är mellanrummet, vanster och hoger panelernas kanter i det. */
export function placeraBand(m: { hojd: number; vanster: number; hoger: number }, band: { vanster: Bild; hoger: Bild }) {
  const panel = m.hoger - m.vanster
  if (!(panel > 0 && m.hojd > 0)) return null
  const skala = Math.min(1, Math.max(MINSTA_SKALA, panel / 1200))
  const synlig = STORSTA_ANDEL * panel
  const del = (bild: Bild, sida: 'vanster' | 'hoger') => {
    const bredd = bild.bredd * skala
    const hojd = Math.min(bild.hojd * skala, m.hojd - MARK)
    const s = hojd / bild.hojd
    const b = bild.bredd * s
    const y = m.hojd - MARK - hojd
    // Vänsterdelen står mot vänsterkanten och högerdelen mot högerkanten. Det som inte får plats beskärs på insidan.
    const x = sida === 'vanster' ? m.vanster : m.hoger - b
    const klipp = sida === 'vanster' ? { vanster: m.vanster, hoger: m.vanster + Math.min(b, synlig) } : { vanster: m.hoger - Math.min(b, synlig), hoger: m.hoger }
    return { bild, x, y, bredd: b, hojd, klipp, beskuren: bredd > synlig + 0.5 }
  }
  return { vanster: del(band.vanster, 'vanster'), hoger: del(band.hoger, 'hoger') }
}

/** Minsta ytterkant för att visa sidomotiven. */
export const MINSTA_KANT = 150
/** Luft till sidans ytterkant. Mot panelen står motiven kant i kant, där de är avskurna och går ihop med bandet. */
const LUFT = 12

/**
 * Sidomotiven bredvid mellanrummen. panelVanster och panelHoger är panelernas kanter, glipor är
 * mellanrummen uppifrån och ner, motiv har ett motiv per mellanrum och sida.
 */
export function placeraSidor(
  sida: { bredd: number; panelVanster: number; panelHoger: number; glipor: Ruta[] },
  motiv: { vanster: readonly Bild[]; hoger: readonly Bild[] },
): Placering[] {
  const ut: Placering[] = []
  const kant = { vanster: sida.panelVanster, hoger: sida.bredd - sida.panelHoger }
  for (const s of ['vanster', 'hoger'] as const) {
    if (kant[s] < MINSTA_KANT) continue
    sida.glipor.forEach((g, i) => {
      const bild = motiv[s][i]
      if (!bild) return
      const skala = Math.min(1, (kant[s] - LUFT) / bild.bredd)
      const bredd = bild.bredd * skala
      const hojd = bild.hojd * skala
      const y = Math.max(0, g.botten - MARK - hojd)
      const x = s === 'vanster' ? sida.panelVanster - bredd : sida.panelHoger
      ut.push({ sida: s, bild, x, y, bredd, hojd })
    })
  }
  return ut
}
