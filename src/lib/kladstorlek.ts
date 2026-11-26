// Storleken på ett klädesplagg i förrådet och hur den förhåller sig till storleken tillverkarens vikt gäller.
// Vikten per storlek anges nästan aldrig, så appen visar bara om vikten gäller ens storlek eller en annan.

export const BOKSTAVSSTORLEKAR = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const
export const MAX_STORLEK = 12

/** Modellnamnet utan M eller W sist, som Fjällräven och Tierra skriver herr och dam: "Keb Fleece Hoodie M" blir "Keb Fleece Hoodie". */
export function utanKon(modell: string): string {
  return modell.trim().replace(/\s+[MW]$/, '')
}

/** "Herr", "Dam" eller "Unisex" ur katalogens egenskaper, eller null. */
export function konEtikett(egenskaper: Record<string, unknown> | null | undefined): string | null {
  const kon = egenskaper?.kon
  return typeof kon === 'string' && kon ? kon[0].toUpperCase() + kon.slice(1) : null
}

/** Storleken vikten gäller, ur katalogens egenskaper, eller null när tillverkaren inte anger den. */
export function viktstorlek(egenskaper: Record<string, unknown> | null | undefined): string | null {
  const s = egenskaper?.viktstorlek
  return typeof s === 'string' && s.trim() ? s.trim() : null
}

function steg(fran: number, till: number, efter = ''): string[] {
  const ut: string[] = []
  for (let n = fran; n <= till; n += 2) ut.push(`${n}${efter}`)
  return ut
}

/**
 * Storlekarna man väljer bland, efter hur tillverkaren skriver storleken för vikten: byxstorlek (48),
 * brittisk damstorlek (10 (UK)) eller bokstäver. Utan uppgift blir det bokstäver.
 */
export function storlekarFor(viktstorlekVarde: string | null, kon: string | null): string[] {
  if (viktstorlekVarde && /^\d+$/.test(viktstorlekVarde)) {
    if (kon === 'Herr') return steg(44, 60)
    if (kon === 'Dam') return steg(32, 48)
    return steg(32, 60)
  }
  if (viktstorlekVarde && /\(UK\)$/.test(viktstorlekVarde)) return steg(4, 22, ' (UK)')
  return [...BOKSTAVSSTORLEKAR]
}

export type Viktlage = { lage: 'samma' } | { lage: 'annan'; viktstorlek: string } | { lage: 'okand' }

/** Gäller vikten den valda storleken, en annan storlek, eller anger tillverkaren ingen storlek? */
export function viktlage(viktstorlekVarde: string | null, vald: string | null): Viktlage {
  if (!viktstorlekVarde) return { lage: 'okand' }
  if (vald && vald.trim().toLowerCase() === viktstorlekVarde.toLowerCase()) return { lage: 'samma' }
  return { lage: 'annan', viktstorlek: viktstorlekVarde }
}

/** Texten bredvid vikten när man väljer storlek. */
export function viktlageText(l: Viktlage): string {
  if (l.lage === 'samma') return 'Vikten gäller din storlek.'
  if (l.lage === 'annan') return `Vikten gäller storlek ${l.viktstorlek}. Din storlek kan väga lite mer eller mindre.`
  return 'Tillverkaren anger inte vilken storlek vikten gäller.'
}

/** Raden i förrådet: "Herr, storlek L · vikten gäller M". null när varken kön eller storlek finns. */
export function forradsStorlekText(kon: string | null, storlek: string | null, viktstorlekVarde: string | null): string | null {
  const vem = [kon, storlek ? `storlek ${storlek}` : null].filter(Boolean).join(', ')
  if (!vem && !viktstorlekVarde) return kon
  const l = viktlage(viktstorlekVarde, storlek)
  const om = !storlek
    ? viktstorlekVarde
      ? `vikt i storlek ${viktstorlekVarde}`
      : 'storleken för vikten anges inte'
    : l.lage === 'samma'
      ? 'vikten gäller din storlek'
      : l.lage === 'annan'
        ? `vikten gäller ${l.viktstorlek}`
        : 'storleken för vikten anges inte'
  const text = [vem, om].filter(Boolean).join(' · ')
  return text[0].toUpperCase() + text.slice(1)
}

/** Hjälptexten under ett storleksval: om vikten gäller den valda storleken, eller vilken storlek den gäller när inget är valt. */
export function storlekHjalp(viktstorlekVarde: string | null, vald: string | null): string {
  if (!vald && viktstorlekVarde) return `Vikten gäller storlek ${viktstorlekVarde}.`
  return viktlageText(viktlage(viktstorlekVarde, vald))
}
