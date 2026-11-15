/**
 * Geometrin för den streckade stigen på startsidan. Stigens läge räknas från innehållets kant,
 * inte i procent av bredden, så att den alltid går i marginalen och aldrig bakom text eller kort.
 */

export type Stigsida = 'vanster' | 'hoger'

export interface Stigbit {
  start: Stigsida
  slut: Stigsida
  /** Utåtriktad sväng i CSS-pixlar. Standard 18, begränsad till 0–24 och till den lediga marginalen. */
  svang?: number
  /** Första biten i leden. Får en vägvisare i början. */
  forsta?: boolean
  /** Sista biten i leden. Får en vägvisare i slutet. */
  sista?: boolean
}

/** Sektionens mått och innehållsbehållarens läge i sektionen, i CSS-pixlar. */
export interface Stigmal {
  bredd: number
  hojd: number
  innehallVanster: number
  innehallHoger: number
  innehallTopp: number
  innehallBotten: number
}

/**
 * Plats för en 48 px vägvisare, svängen och luft till ytterkanten. Med innehåll på 1152 px
 * kräver det en sektion på minst 1344 px. Under 1360 px fönsterbredd döljs stigen med CSS.
 */
const MINSTA_MARGINAL = 96
/** Sektionens padding uppe och nere. Lite tolerans för avrundning av subpixlar. */
const MINSTA_UTFYLLNAD = 79.5
/** Stigen går så här långt utanför innehållets kant. */
const AVSTAND = 48

/**
 * Kopplar ihop bitarna i ordning. Varje bit börjar där förra slutade,
 * och första och sista biten markeras. Lägg till eller ta bort bitar fritt.
 */
export function kopplaStig<T extends { slut: Stigsida; svang?: number }>(
  delar: readonly T[],
  start: Stigsida = 'vanster',
): Array<T & Stigbit> {
  let sida = start
  return delar.map((del, i) => {
    const bit = { ...del, start: sida, forsta: i === 0, sista: i === delar.length - 1 }
    sida = del.slut
    return bit
  })
}

/** SVG-sökvägen för en bit, eller null om sektionen inte har plats för stigen. */
export function skapaStig(mal: Stigmal, bit: Stigbit) {
  const { bredd, hojd, innehallVanster, innehallHoger, innehallTopp, innehallBotten } = mal

  if (
    !Object.values(mal).every(Number.isFinite) ||
    hojd < 2 * MINSTA_UTFYLLNAD ||
    innehallVanster < MINSTA_MARGINAL ||
    bredd - innehallHoger < MINSTA_MARGINAL ||
    innehallHoger <= innehallVanster ||
    innehallTopp < MINSTA_UTFYLLNAD ||
    hojd - innehallBotten < MINSTA_UTFYLLNAD
  ) {
    return null
  }

  const x = (sida: Stigsida) => (sida === 'vanster' ? innehallVanster - AVSTAND : innehallHoger + AVSTAND)
  const startX = x(bit.start)
  const slutX = x(bit.slut)
  const startY = bit.forsta ? 68 : 0
  const slutY = bit.sista ? hojd - 8 : hojd
  // Hela korsningen ligger i nedre utfyllnaden, minst 16 px under innehållet.
  const korsningY = hojd - 64
  const langd = korsningY - startY
  const friSvang = bit.start === 'vanster' ? startX - 24 : bredd - 24 - startX
  const onskadSvang = Number.isFinite(bit.svang) ? (bit.svang ?? 18) : 18
  const svang = Math.max(0, Math.min(onskadSvang, 24, friSvang))
  const ytterX = startX + (bit.start === 'vanster' ? -svang : svang)

  // Kontrollpunkterna ligger alltid utanför innehållet. Lodräta tangenter vid
  // sektionsgränsen gör att bitarna möts utan knyck.
  const d = [
    `M ${startX} ${startY}`,
    `C ${startX} ${startY + langd * 0.18}, ${ytterX} ${startY + langd * 0.32}, ${ytterX} ${startY + langd * 0.5}`,
    `C ${ytterX} ${startY + langd * 0.68}, ${startX} ${startY + langd * 0.82}, ${startX} ${korsningY}`,
    bit.start === bit.slut
      ? `L ${slutX} ${slutY}`
      : `C ${startX} ${hojd - 32}, ${slutX} ${hojd - 64}, ${slutX} ${hojd - 16} L ${slutX} ${slutY}`,
  ].join(' ')

  return { d, startX, slutX, startY, slutY }
}
