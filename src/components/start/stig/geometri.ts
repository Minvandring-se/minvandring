/**
 * Geometrin för leden mellan startsidans sektioner. Varje bit ligger bara i sektionens
 * nedersta 80 px, mellan den och nästa sektion, och går aldrig över text eller kort.
 * Lägena räknas från innehållets kant, inte i procent av fönstret.
 */

export type Sida = 'vanster' | 'hoger'
export type Detalj = 'talt' | 'eld'

export interface StigVal {
  /** Utelämna för att växla till motsatt sida. */
  slut?: Sida
  /** Buktning i px, 0–12. Standard 10. */
  svang?: number
  detalj?: Detalj
  /** Detaljens läge längs biten, 0,15–0,85, räknat i färdriktningen. */
  detaljLage?: number
}

export interface Stigbit extends StigVal {
  start: Sida
  slut: Sida
  /** Första biten i leden. Får ett ledkryss i början. */
  forsta?: boolean
  /** Sista biten i leden. Får en vägvisare i slutet. */
  sista?: boolean
}

/** Sektionens mått och innehållsbehållarens läge i sektionen, i CSS-pixlar. */
export interface Matt {
  bredd: number
  hojd: number
  vanster: number
  hoger: number
  topp: number
  botten: number
}

export interface Punkt {
  x: number
  y: number
}

export type Kubik = [Punkt, Punkt, Punkt, Punkt]

export const MINSTA_BREDD = 1360
/** Plats för vägvisaren, bukten och luft till ytterkanten. */
const MINSTA_MARGINAL = 96
/** Sektionens padding uppe och nere, med lite tolerans för subpixlar. */
const MINSTA_UTFYLLNAD = 79.5
/** Leden börjar och slutar så här långt utanför innehållets kant. */
const AVSTAND = 48
/** Ledens höjd i sektionen, räknat från nederkanten. */
const FRAN_BOTTEN = 25

function begransa(varde: number | undefined, standard: number, min: number, max: number) {
  return Math.min(max, Math.max(min, varde !== undefined && Number.isFinite(varde) ? varde : standard))
}

/**
 * Kopplar ihop bitarna i ordning. Varje bit börjar där förra slutade och utan eget slut
 * växlar den sida. Första och sista biten markeras från ordningen. Övriga fält, som id, behålls.
 */
export function kopplaStig<T extends StigVal>(delar: readonly T[], start: Sida = 'vanster'): Array<T & Stigbit> {
  let sida = start
  return delar.map((del, i) => {
    const slut = del.slut ?? (sida === 'vanster' ? 'hoger' : 'vanster')
    const bit = { ...del, start: sida, slut, forsta: i === 0, sista: i === delar.length - 1 }
    sida = slut
    return bit
  })
}

export function punktPaKurva(k: Kubik, t: number): Punkt {
  const u = 1 - t
  return {
    x: u ** 3 * k[0].x + 3 * u ** 2 * t * k[1].x + 3 * u * t ** 2 * k[2].x + t ** 3 * k[3].x,
    y: u ** 3 * k[0].y + 3 * u ** 2 * t * k[1].y + 3 * u * t ** 2 * k[2].y + t ** 3 * k[3].y,
  }
}

/** Bitens kurvor och SVG-sökväg, eller null om sektionen inte har plats för leden. */
export function beraknaStig(m: Matt, bit: Stigbit) {
  if (
    !Object.values(m).every(Number.isFinite) ||
    m.bredd < MINSTA_BREDD ||
    m.hojd < 2 * MINSTA_UTFYLLNAD ||
    m.vanster < MINSTA_MARGINAL ||
    m.bredd - m.hoger < MINSTA_MARGINAL ||
    m.hoger <= m.vanster ||
    m.topp < MINSTA_UTFYLLNAD ||
    m.hojd - m.botten < MINSTA_UTFYLLNAD
  ) {
    return null
  }

  const x = (sida: Sida) => (sida === 'vanster' ? m.vanster - AVSTAND : m.hoger + AVSTAND)
  const start = { x: x(bit.start), y: m.hojd - FRAN_BOTTEN }
  const slut = { x: x(bit.slut), y: start.y }
  const dx = slut.x - start.x
  const a = begransa(bit.svang, 10, 0, 12)
  const kurvor: Kubik[] = []

  if (dx === 0) {
    // Samma sida: en liten bukt helt i yttermarginalen.
    const ut = bit.start === 'vanster' ? -18 : 18
    kurvor.push([start, { x: start.x + ut, y: start.y - a }, { x: start.x + ut, y: start.y + a }, slut])
  } else {
    // Fyra olika, grunda bukter. Kontrollpunkterna kan inte lämna mellanrummet.
    const stallen = [0, 0.24, 0.51, 0.76, 1]
    const riktning = [-1, 1, -0.8, 0.65]
    for (let i = 0; i < 4; i++) {
      const fran = start.x + dx * stallen[i]
      const till = start.x + dx * stallen[i + 1]
      const d = till - fran
      kurvor.push([
        { x: fran, y: start.y },
        { x: fran + d * 0.34, y: start.y + a * riktning[i] },
        { x: fran + d * 0.72, y: start.y + a * riktning[i] },
        { x: till, y: start.y },
      ])
    }
  }

  const lage = begransa(bit.detaljLage, 0.66, 0.15, 0.85) * kurvor.length
  const index = Math.min(Math.floor(lage), kurvor.length - 1)
  const detaljPunkt = punktPaKurva(kurvor[index], lage - index)
  const d = `M ${start.x} ${start.y} ` + kurvor.map(([, b, c, e]) => `C ${b.x} ${b.y}, ${c.x} ${c.y}, ${e.x} ${e.y}`).join(' ')
  return { d, start, slut, detaljPunkt, kurvor }
}
