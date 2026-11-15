/**
 * Geometrin för leden mellan startsidans sektioner. Leden går aldrig över text, kort eller knappar.
 *
 * Full variant (breda skärmar): varje bit går i sektionens nedre luft och svänger i en mjuk S-kurva
 * ner över sektionsgränsen, där nästa sektions bit tar vid i sin övre luft. Lägena räknas från
 * innehållets kant, inte i procent.
 *
 * Enkel variant (mindre skärmar): en mjuk kurva tvärs över sidan, helt i sektionens nedre luft.
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

/** Var figurerna står, med fötterna på leden. null när figuren saknas eller inte får plats. */
export interface Figurer {
  ledkryss: Punkt | null
  vagvisare: Punkt | null
  detalj: Punkt | null
}

/** Figurernas storlek i px. x är mitten och y marken. */
const FIGUR = {
  ledkryss: { bredd: 32, hojd: 44 },
  vagvisare: { bredd: 48, hojd: 60 },
  detalj: { bredd: 44, hojd: 36 },
}

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
 * växlar den sida. Första och sista biten räknas fram från ordningen.
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

/**
 * Figuren om den får plats: helt inom sektionen och antingen under innehållet
 * eller helt bredvid det. Annars null, så att den utelämnas.
 */
export function omPlats(m: Matt, punkt: Punkt | null, storlek: { bredd: number; hojd: number }): Punkt | null {
  if (!punkt) return null
  const vanster = punkt.x - storlek.bredd / 2
  const hoger = punkt.x + storlek.bredd / 2
  if (vanster < 0 || hoger > m.bredd || punkt.y > m.hojd || punkt.y - storlek.hojd < 0) return null
  const under = punkt.y - storlek.hojd >= m.botten + 4
  const bredvid = hoger <= m.vanster || vanster >= m.hoger
  return under || bredvid ? punkt : null
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

  const start = { x: startX, y }
  const slut = { x: slutX, y }
  return {
    variant: 'full' as const,
    dBotten: sokvag(kurvor),
    dTopp: toppKurva ? sokvag([toppKurva]) : null,
    start,
    slut,
    detaljPunkt,
    kurvor,
    toppKurva,
    utgang,
    figurer: figurer(m, bit, start, slut, detaljPunkt),
  }
}

function figurer(m: Matt, bit: Stigbit, start: Punkt, slut: Punkt, detalj: Punkt): Figurer {
  return {
    ledkryss: bit.forsta ? omPlats(m, start, FIGUR.ledkryss) : null,
    vagvisare: bit.sista ? omPlats(m, slut, FIGUR.vagvisare) : null,
    detalj: bit.detalj ? omPlats(m, detalj, FIGUR.detalj) : null,
  }
}

/** Avstånd från sektionens kant i den enkla varianten. */
const KANT = 24
/** Minsta luft under innehållet för den enkla varianten. */
const MINSTA_LUFT_ENKEL = 56

/**
 * Enkel variant för mindre skärmar: en mjuk kurva tvärs över sidan, helt i sektionens nedre luft,
 * utan svängar ut i marginalerna. null om luften under innehållet är för liten.
 */
export function beraknaEnkelStig(m: Matt, bit: Stigbit) {
  const luft = m.hojd - m.botten
  if (!Object.values(m).every(Number.isFinite) || luft < MINSTA_LUFT_ENKEL || m.bredd < 160 || m.hoger <= m.vanster) return null

  const vanster = Math.max(KANT, m.vanster + 16)
  const hoger = Math.min(m.bredd - KANT, m.hoger - 16)
  const startX = bit.start === 'vanster' ? vanster : hoger
  let slutX = bit.slut === 'vanster' ? vanster : hoger
  // Samma sida: en kort kurva in mot mitten i stället för en sväng ut i marginalen.
  if (slutX === startX) slutX = startX + (bit.start === 'vanster' ? 1 : -1) * Math.min(160, (hoger - vanster) / 2)
  const y1 = m.botten + 0.3 * luft
  const y2 = m.botten + 0.68 * luft
  const dx = slutX - startX
  const kurva: Kubik = [
    { x: startX, y: y1 },
    { x: startX + 0.45 * dx, y: y1 },
    { x: slutX - 0.45 * dx, y: y2 },
    { x: slutX, y: y2 },
  ]
  const detaljPunkt = punktPaKurva(kurva, begransa(bit.detaljLage, 0.66, 0.15, 0.85))
  const start = kurva[0]
  const slut = kurva[3]
  return {
    variant: 'enkel' as const,
    dBotten: sokvag([kurva]),
    dTopp: null,
    start,
    slut,
    detaljPunkt,
    kurvor: [kurva],
    toppKurva: null,
    utgang: null,
    figurer: figurer(m, bit, start, slut, detaljPunkt),
  }
}

export type Stig = NonNullable<ReturnType<typeof beraknaStig> | ReturnType<typeof beraknaEnkelStig>>

/** Den fulla varianten när den får plats och skärmen är bred, annars den enkla. */
export function valjStig(m: Matt, bit: Stigbit, bred: boolean): Stig | null {
  return (bred ? beraknaStig(m, bit) : null) ?? beraknaEnkelStig(m, bit)
}

/*
 * Hur leden följer scrollen. p är hur många px gränsen mellan sektionen och nästa ligger ovanför
 * fönstrets nederkant. Biten i den nedre luften ritas medan p går från halva luften under
 * nederkanten till 30 % av fönstrets höjd. Fortsättningen i nästa sektions övre luft ritas sedan,
 * till 40 %. Samma intervall används i CSS (animation-range) och i reserven i JavaScript.
 */
const RITAD_NERE = 0.3
const RITAD_UPPE = 0.4

export function ritintervall(luftNere: number, fonsterhojd: number) {
  return {
    nere: [-luftNere / 2, RITAD_NERE * fonsterhojd] as [number, number],
    uppe: [RITAD_NERE * fonsterhojd, RITAD_UPPE * fonsterhojd] as [number, number],
  }
}

/** Hur stor del av biten som är ritad, 0–1. */
export function framsteg(p: number, [fran, till]: [number, number]) {
  return Math.min(1, Math.max(0, (p - fran) / (till - fran)))
}

/**
 * Samma intervall som animation-range för view()-tidslinjer. Den nedre utlösaren är sektionens nedre
 * luft, så att dess cover-läge är p + luften. Den övre utlösaren börjar vid gränsen, så där är det p.
 */
export function cssIntervall(luftNere: number) {
  return {
    nere: `cover ${luftNere / 2}px cover calc(${luftNere}px + ${RITAD_NERE * 100}vh)`,
    uppe: `cover ${RITAD_NERE * 100}vh cover ${RITAD_UPPE * 100}vh`,
  }
}
