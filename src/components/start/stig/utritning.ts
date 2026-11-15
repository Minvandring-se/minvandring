/**
 * Tidsstyrd utritning av en bit av leden. Biten i den nedre luften och fortsättningen i nästa
 * sektions övre luft ritas som en enda rörelse med ease-in-out, utan knyck i farten där de möts.
 */

/** Väntetid innan en bit börjar ritas, i ms. */
export const VANTAN = 500
/** Hela utritningen, i ms. */
export const RITTID = 1600
const STEG = 24

/** ease-in-out (cubic-bezier(.42, 0, .58, 1)): andel av sträckan vid andel t av tiden. */
export function easeInOut(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  // Kurvans x och y som funktion av parametern s, med x1 = .42 och x2 = .58 (y1 = 0, y2 = 1).
  const x = (s: number) => 3 * (1 - s) ** 2 * s * 0.42 + 3 * (1 - s) * s ** 2 * 0.58 + s ** 3
  const y = (s: number) => 3 * (1 - s) * s ** 2 + s ** 3
  let lag = 0
  let hog = 1
  for (let i = 0; i < 40; i++) {
    const mitt = (lag + hog) / 2
    if (x(mitt) < t) lag = mitt
    else hog = mitt
  }
  return y((lag + hog) / 2)
}

export interface Del {
  varaktighet: number
  /** stroke-dashoffset för en mask med pathLength 1: 1 är dold, 0 är helt ritad. */
  ramar: { offset: number; strokeDashoffset: number }[]
}

/** Del av en utritning: tiden mellan t0 och t1 (andelar av hela tiden) blir en egen animation. */
function del(t0: number, t1: number, fran: number, till: number, total: number): Del {
  const ramar = Array.from({ length: STEG + 1 }, (_, i) => {
    const t = t0 + ((t1 - t0) * i) / STEG
    const andel = (easeInOut(t) - fran) / (till - fran)
    return { offset: i / STEG, strokeDashoffset: 1 - Math.min(1, Math.max(0, andel)) }
  })
  return { varaktighet: (t1 - t0) * total, ramar }
}

/**
 * Nyckelrutor för den nedre biten och, om den finns, fortsättningen uppe i nästa sektion.
 * Längderna styr hur tiden delas, så att linjen går i samma fart över sektionsgränsen.
 */
export function utritning(langdNere: number, langdUppe = 0, total = RITTID): { nere: Del; uppe: Del | null } {
  const andelNere = langdUppe > 0 ? langdNere / (langdNere + langdUppe) : 1
  if (andelNere >= 1) return { nere: del(0, 1, 0, 1, total), uppe: null }
  // Tidpunkten då ease-in-out har nått den nedre bitens andel av sträckan.
  let lag = 0
  let hog = 1
  for (let i = 0; i < 40; i++) {
    const mitt = (lag + hog) / 2
    if (easeInOut(mitt) < andelNere) lag = mitt
    else hog = mitt
  }
  const skarv = (lag + hog) / 2
  return { nere: del(0, skarv, 0, andelNere, total), uppe: del(skarv, 1, andelNere, 1, total) }
}
