/**
 * Geometrin för leden mellan startsidans sektioner. Varje bit går i sektionens nedre luft och
 * svänger i en mjuk S-kurva ner över sektionsgränsen, där nästa sektions bit tar vid i sin övre luft.
 * Leden går aldrig över text eller kort. Lägena räknas från innehållets kant, inte i procent.
 */

export type Sida = 'vanster' | 'hoger'
export type Detalj = 'talt' | 'eld'

export interface StigVal {
  id?: string
  /** Utelämna för att växla till motsatt sida. */
  slut?: Sida
  /** Buktning i px, 0–12. Standard 10. */
  svang?: number
  detalj?: Detalj
  /** Detaljens läge längs den vågiga delen, 0,15–0,85, räknat i färdriktningen. */
  detaljLage?: number
}

export interface Stigbit extends StigVal {
  start: Sida
  slut: Sida
  /** Första biten i leden. Får ett ledkryss och ingen fortsättning uppifrån. */
  forsta?: boolean
  /** Sista biten i leden. Slutar vid en vägvisare i stället för att svänga ner. */
  sista?: boolean
  forraId?: string
  nastaId?: string
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

/** Plats för vägvisaren, bukten och luft till ytterkanten. */
const MINSTA_MARGINAL = 96
/** Sektionens padding uppe och nere, med lite tolerans för subpixlar. */
const MINSTA_UTFYLLNAD = 79.5
/** Leden börjar och slutar så här långt utanför innehållets kant. */
const AVSTAND = 48
/** Sidled för S-kurvan vid sektionsgränsen, och hur brant den korsar gränsen. */
const S_SIDLED = 10
const S_HOJD = 20

function begransa(varde: number | undefined, standard: number, min: number, max: number) {
  return Math.min(max, Math.max(min, varde !== undefined && Number.isFinite(varde) ? varde : standard))
}

/** +1 om leden går åt höger mot den här sidan, annars −1. */
const riktningMot = (sida: Sida) => (sida === 'hoger' ? 1 : -1)

/**
 * Kopplar ihop bitarna i ordning. Varje bit börjar där förra slutade och utan eget slut
 * växlar den sida. Första och sista biten och grannarnas id räknas fram från ordningen.
 */
export function kopplaStig<T extends StigVal>(delar: readonly T[], start: Sida = 'vanster'): Array<T & Stigbit> {
  let sida = start
  return delar.map((del, i) => {
    const slut = del.slut ?? (sida === 'vanster' ? 'hoger' : 'vanster')
    const bit = {
      ...del,
      start: sida,
      slut,
      forsta: i === 0,
      sista: i === delar.length - 1,
      forraId: delar[i - 1]?.id,
      nastaId: delar[i + 1]?.id,
    }
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

const sokvag = (kurvor: Kubik[]) =>
  kurvor.length === 0
    ? ''
    : `M ${kurvor[0][0].x} ${kurvor[0][0].y} ` + kurvor.map(([, b, c, e]) => `C ${b.x} ${b.y}, ${c.x} ${c.y}, ${e.x} ${e.y}`).join(' ')

/** Grunda bukter längs en vågrät linje från x0 till x1. */
function vag(x0: number, x1: number, y: number, a: number, utat: number): Kubik[] {
  const dx = x1 - x0
  if (Math.abs(dx) < 1) {
    // Ingen sträcka: en liten bukt ut i marginalen.
    return [[{ x: x0, y }, { x: x0 + utat * 18, y: y - a }, { x: x0 + utat * 18, y: y + a }, { x: x1, y }]]
  }
  const stallen = Math.abs(dx) > 240 ? [0, 0.24, 0.51, 0.76, 1] : [0, 1]
  const riktning = [-1, 1, -0.8, 0.65]
  const kurvor: Kubik[] = []
  for (let i = 0; i < stallen.length - 1; i++) {
    const fran = x0 + dx * stallen[i]
    const till = x0 + dx * stallen[i + 1]
    const d = till - fran
    kurvor.push([
      { x: fran, y },
      { x: fran + d * 0.34, y: y + a * riktning[i] },
      { x: fran + d * 0.72, y: y + a * riktning[i] },
      { x: till, y },
    ])
  }
  return kurvor
}

/** Bitens kurvor och SVG-sökvägar, eller null om sektionen inte har plats för leden. */
export function beraknaStig(m: Matt, bit: Stigbit) {
  if (
    !Object.values(m).every(Number.isFinite) ||
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
  const startX = x(bit.start)
  const slutX = x(bit.slut)
  const a = begransa(bit.svang, 10, 0, 12)
  // Linjen ligger så högt att tält och brasa (36 px) ryms under innehållet och S-kurvan ner har plats.
  const y = Math.max(m.botten + 52, m.hojd - 56)
  // Färdriktningen mot slutet. Samma sida: riktningen utåt, mot den sidans kant.
  const riktning = slutX !== startX ? Math.sign(slutX - startX) : riktningMot(bit.slut)
  const vandX = slutX - riktning * 36
  const vagRiktning = bit.sista ? Math.sign(slutX - startX) || riktning : Math.sign(vandX - startX) || -riktning

  const kurvor: Kubik[] = []
  let vagStart = startX
  if (!bit.forsta) {
    // Kommer uppifrån, längs marginalen, och viker av längs leden.
    vagStart = startX + vagRiktning * 24
    kurvor.push([{ x: startX, y: y - 24 }, { x: startX, y: y - 10 }, { x: startX + vagRiktning * 10, y }, { x: vagStart, y }])
  }
  const vagor = vag(vagStart, bit.sista ? slutX : vandX, y, a, riktningMot(bit.start))
  kurvor.push(...vagor)

  let utgang: Punkt | null = null
  if (!bit.sista) {
    // S-kurva ner till sektionsgränsen. Korsar gränsen i riktningen (S_SIDLED, S_HOJD).
    const s = riktning * S_SIDLED
    utgang = { x: slutX, y: m.hojd }
    // Första kontrollpunkten fortsätter i vågens riktning, så att det inte blir något knyck.
    const [, , c, e] = vagor[vagor.length - 1]
    const langd = Math.hypot(e.x - c.x, e.y - c.y) || 1
    const fortsatt = { x: e.x + ((e.x - c.x) / langd) * 20, y: e.y + ((e.y - c.y) / langd) * 20 }
    kurvor.push([{ x: vandX, y }, fortsatt, { x: slutX - s, y: m.hojd - S_HOJD }, utgang])
  }

  // Fortsättningen från förra biten, i den övre luften. Möter förra bitens utgång exakt.
  let toppKurva: Kubik | null = null
  if (!bit.forsta) {
    const s = riktningMot(bit.start) * S_SIDLED
    const t = Math.min(56, m.topp - 24)
    toppKurva = [{ x: startX, y: 0 }, { x: startX + s, y: S_HOJD }, { x: startX - s, y: t - S_HOJD }, { x: startX, y: t }]
  }

  const lage = begransa(bit.detaljLage, 0.66, 0.15, 0.85) * vagor.length
  const index = Math.min(Math.floor(lage), vagor.length - 1)
  const detaljPunkt = punktPaKurva(vagor[index], lage - index)

  return {
    dBotten: sokvag(kurvor),
    dTopp: toppKurva ? sokvag([toppKurva]) : null,
    start: { x: startX, y },
    slut: { x: slutX, y },
    detaljPunkt,
    kurvor,
    toppKurva,
    utgang,
  }
}
