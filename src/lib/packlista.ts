// Packlistan i en tur: det gruppen behöver gemensamt, vem som tar med vad och dubbletter. Rena funktioner utan databas.
import type { PackradRad } from './typer'
import type { Typ } from './vikt'

/**
 * Sorter där en grupp oftast klarar sig med en: två rader av samma sort ger frågan om båda behövs.
 * Nyckeln är underkategorin i förrådet. Brännare och kompletta kök räknas som samma sort.
 */
const SORTER: Record<string, { sort: string; etikett: string }> = {
  talt: { sort: 'talt', etikett: 'tält' },
  tarp: { sort: 'tarp', etikett: 'tarp' },
  brannare: { sort: 'kok', etikett: 'kök' },
  komplett_kok: { sort: 'kok', etikett: 'kök' },
  filter: { sort: 'filter', etikett: 'vattenfilter' },
  forband: { sort: 'forband', etikett: 'förbandslåda' },
  karta: { sort: 'karta', etikett: 'karta och kompass' },
  lagning: { sort: 'lagning', etikett: 'lagningssats' },
  yxa: { sort: 'yxa', etikett: 'yxa eller såg' },
  snospade: { sort: 'snospade', etikett: 'snöspade' },
}

export interface Dubblett {
  sort: string
  /** Sorten i löptext, till exempel "kök". */
  etikett: string
  rader: PackradRad[]
}

/**
 * Sorter som flera i gruppen tar med, där en oftast räcker. Gäller rader som ska med och som inte är något alla ska ha.
 * En sort visas så länge någon av raderna inte har svaret att alla behövs (dubblett_ok).
 */
export function dubbletter(rader: readonly PackradRad[]): Dubblett[] {
  const grupper = new Map<string, Dubblett>()
  for (const r of rader) {
    const s = r.underkategori ? SORTER[r.underkategori] : undefined
    if (!s || !r.med || r.alla) continue
    const g = grupper.get(s.sort) ?? { sort: s.sort, etikett: s.etikett, rader: [] }
    g.rader.push(r)
    grupper.set(s.sort, g)
  }
  return [...grupper.values()].filter((g) => {
    const antal = g.rader.reduce((n, r) => n + Math.max(1, r.antal), 0)
    return antal >= 2 && g.rader.some((r) => !r.dubblett_ok)
  })
}

export interface Forslag {
  namn: string
  kategori: string
  underkategori: string
  typ: Typ
}

/** Det en grupp brukar behöva gemensamt. Det man väljer blir gemensamma rader utan bärare. */
export const FORSLAG_GEMENSAMT: readonly Forslag[] = [
  { namn: 'Tält', kategori: 'talt', underkategori: 'talt', typ: 'ryggsack' },
  { namn: 'Kök', kategori: 'kok', underkategori: 'brannare', typ: 'ryggsack' },
  { namn: 'Gas', kategori: 'kok', underkategori: 'bransle', typ: 'forbrukas' },
  { namn: 'Vattenrening', kategori: 'vatten', underkategori: 'filter', typ: 'ryggsack' },
  { namn: 'Förbandslåda', kategori: 'medicin', underkategori: 'forband', typ: 'ryggsack' },
  { namn: 'Karta och kompass', kategori: 'sakerhet', underkategori: 'karta', typ: 'ryggsack' },
  { namn: 'Lagningssats', kategori: 'verktyg', underkategori: 'lagning', typ: 'ryggsack' },
]

/** Förslagen som turen inte redan har en rad för, med samma underkategori (kök räknas som kök oavsett sort). */
export function forslagSomSaknas(rader: readonly PackradRad[]): Forslag[] {
  const finns = new Set(rader.filter((r) => r.med && r.underkategori).map((r) => sortFor(r.underkategori!)))
  return FORSLAG_GEMENSAMT.filter((f) => !finns.has(sortFor(f.underkategori)))
}

function sortFor(underkategori: string): string {
  return SORTER[underkategori]?.sort ?? underkategori
}

/** Gemensamma rader som ska med men som ingen tar med ännu. */
export function utanBarare(rader: readonly PackradRad[]): PackradRad[] {
  return rader.filter((r) => r.gemensam && r.med && !r.bars_av)
}
