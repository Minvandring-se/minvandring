// Packlistan i en tur: det gruppen behöver gemensamt, vem som tar med vad och dubbletter. Rena funktioner utan databas.
import { formateraPatroner, gasbehov, patronforslag } from './bransle'
import { KATEGORIER, type SakVarden } from './forrad'
import type { Forradssak, PackradRad, PackstatusRad } from './typer'
import type { Packrad, Typ } from './vikt'

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
  /** En rad under förslaget, till exempel varför gasen räcker. */
  hjalp?: string
}

/** Det en grupp brukar behöva gemensamt. Det man väljer blir gemensamma rader utan bärare. */
export const FORSLAG_GEMENSAMT: readonly Forslag[] = [
  { namn: 'Tält', kategori: 'talt', underkategori: 'talt', typ: 'ryggsack' },
  { namn: 'Kök', kategori: 'kok', underkategori: 'brannare', typ: 'ryggsack' },
  { namn: 'Gas', kategori: 'kok', underkategori: 'bransle', typ: 'forbrukas' },
  { namn: 'Vattenfilter', kategori: 'vatten', underkategori: 'filter', typ: 'ryggsack' },
  { namn: 'Förbandslåda', kategori: 'medicin', underkategori: 'forband', typ: 'ryggsack' },
  { namn: 'Karta och kompass', kategori: 'sakerhet', underkategori: 'karta', typ: 'ryggsack' },
  { namn: 'Lagningssats', kategori: 'verktyg', underkategori: 'lagning', typ: 'ryggsack' },
]

/** Förslagen som turen inte redan har en rad för, med samma underkategori (kök räknas som kök oavsett sort). */
export function forslagSomSaknas(rader: readonly PackradRad[]): Forslag[] {
  const finns = new Set(rader.filter((r) => r.med && r.underkategori).map((r) => sortFor(r.underkategori!)))
  return FORSLAG_GEMENSAMT.filter((f) => !finns.has(sortFor(f.underkategori)))
}

/**
 * Gasförslaget med patronerna som räcker till turen på sommaren enligt Primus, till exempel "Gas, 2 × 230 g".
 * Samma räkning som Gas till köket i matplanen. Utan personer eller dagar, eller med fler än åtta patroner, står
 * förslaget kvar som Gas.
 */
export function medGas(forslag: readonly Forslag[], personer: number, dagar: number): Forslag[] {
  const patroner = patronforslag(gasbehov(personer, dagar))
  if (!patroner || patroner.length === 0) return [...forslag]
  const namn = `Gas, ${formateraPatroner(patroner)}`
  const hjalp = 'Räcker på sommaren enligt Primus. Med snösmältning behövs mer, se Gas till köket i matplanen.'
  return forslag.map((f) => (f.underkategori === 'bransle' ? { ...f, namn, hjalp } : f))
}

function sortFor(underkategori: string): string {
  return SORTER[underkategori]?.sort ?? underkategori
}

/** Gemensamma rader som ska med men som ingen tar med ännu. */
export function utanBarare(rader: readonly PackradRad[]): PackradRad[] {
  return rader.filter((r) => r.gemensam && r.med && !r.bars_av)
}

// ─── Listan ───────────────────────────────────────────────────────────────────

export type Packfilter = 'min' | 'alla' | 'gemensamt'

/**
 * Raderna i ett filter. Min packning är det jag bär och det alla ska ha. Gemensamt är det som bärs åt gruppen.
 * Utan mitt deltagar-id (den inloggade är inte med i turen) är Min packning tom.
 */
export function filtrera(rader: readonly PackradRad[], filter: Packfilter, mittId: string | null): PackradRad[] {
  if (filter === 'gemensamt') return rader.filter((r) => r.gemensam)
  if (filter === 'min') return rader.filter((r) => mittId !== null && (r.alla || r.bars_av === mittId))
  return [...rader]
}

export interface Packkategori {
  nyckel: string
  etikett: string
  rader: PackradRad[]
}

/** Raderna per kategori, i förrådets ordning, och i varje kategori efter sortering och namn. Tomma kategorier tas inte med. */
export function perKategori(rader: readonly PackradRad[]): Packkategori[] {
  return KATEGORIER.flatMap((k) => {
    const i = rader
      .filter((r) => r.kategori === k.nyckel)
      .sort((a, b) => a.sortering - b.sortering || a.namn.localeCompare(b.namn, 'sv'))
    return i.length ? [{ nyckel: k.nyckel, etikett: k.etikett, rader: i }] : []
  })
}

/** Bockarna med packrad och deltagare som nyckel. */
export function statusKarta(status: readonly PackstatusRad[]): Map<string, PackstatusRad> {
  return new Map(status.map((s) => [statusnyckel(s.packrad_id, s.deltagare_id), s]))
}

export function statusnyckel(packradId: string, deltagareId: string): string {
  return `${packradId}:${deltagareId}`
}

/** De som ska bocka av raden: alla personer på en rad som alla ska ha, annars den som bär den. */
export function somPackar(rad: PackradRad, deltagare: readonly { id: string; typ: 'person' | 'hund' }[]): string[] {
  if (rad.alla) return deltagare.filter((d) => d.typ === 'person').map((d) => d.id)
  return rad.bars_av ? [rad.bars_av] : []
}

/** Hur mycket av det deltagaren ska packa som är packat. */
export function packat(
  rader: readonly PackradRad[],
  status: ReadonlyMap<string, PackstatusRad>,
  deltagare: { id: string; typ: 'person' | 'hund' },
): { packat: number; totalt: number } {
  const mina = rader.filter((r) => r.med && somPackar(r, [deltagare]).includes(deltagare.id))
  return { packat: mina.filter((r) => status.get(statusnyckel(r.id, deltagare.id))?.packad).length, totalt: mina.length }
}

/** Raderna som viktberäkningen vill ha dem, med var och ens egen vikt på rader som alla ska ha. */
export function viktrader(rader: readonly PackradRad[], status: readonly PackstatusRad[]): Packrad[] {
  return rader.map((r) => ({
    antal: r.antal,
    viktG: r.vikt_g,
    typ: r.typ,
    med: r.med,
    barsAv: r.bars_av,
    alla: r.alla,
    egenVikt: r.alla
      ? new Map(status.filter((s) => s.packrad_id === r.id && s.vikt_g !== null).map((s) => [s.deltagare_id, s.vikt_g]))
      : undefined,
  }))
}

// ─── Nya rader ────────────────────────────────────────────────────────────────

/** Det som sparas när en rad läggs till. Resten av kolumnerna har standardvärden i databasen. */
export type NyPackrad = Pick<
  PackradRad,
  'tur_id' | 'namn' | 'kategori' | 'underkategori' | 'produkt_id' | 'antal' | 'vikt_g' | 'typ' | 'bars_av' | 'alla' | 'gemensam' | 'notering'
>

export type Bars = { som: 'jag'; id: string } | { som: 'gemensam'; id: string | null } | { som: 'alla' }

function barsKolumner(bars: Bars): Pick<NyPackrad, 'bars_av' | 'alla' | 'gemensam'> {
  if (bars.som === 'alla') return { bars_av: null, alla: true, gemensam: false }
  return { bars_av: bars.id, alla: false, gemensam: bars.som === 'gemensam' }
}

/** En sak ur förrådet som en rad i turen. Namn och vikt kopieras, eftersom förrådet är privat. */
export function packradFranSak(sak: Forradssak, turId: string, bars: Bars): NyPackrad {
  return {
    tur_id: turId,
    namn: sak.namn,
    kategori: sak.kategori,
    underkategori: sak.underkategori,
    produkt_id: sak.produkt_id,
    antal: sak.antal,
    vikt_g: sak.vikt_g,
    typ: sak.typ,
    notering: null,
    ...barsKolumner(bars),
  }
}

/** En sak man skriver in själv, från samma formulär som i förrådet. */
export function packradFranVarden(v: SakVarden, turId: string, bars: Bars): NyPackrad {
  return { tur_id: turId, produkt_id: null, ...v, ...barsKolumner(bars) }
}

/** Ett förslag på det gruppen behöver, som en gemensam rad som ingen bär ännu. */
export function packradFranForslag(f: Forslag, turId: string): NyPackrad {
  return {
    tur_id: turId,
    namn: f.namn,
    kategori: f.kategori,
    underkategori: f.underkategori,
    produkt_id: null,
    antal: 1,
    vikt_g: null,
    typ: f.typ,
    notering: null,
    ...barsKolumner({ som: 'gemensam', id: null }),
  }
}

/** Ens egen modell på en rad som alla ska ha, ur förrådet. */
export function egenModell(sak: Forradssak, rad: PackradRad, deltagareId: string): Pick<PackstatusRad, 'packrad_id' | 'deltagare_id' | 'tur_id' | 'namn' | 'vikt_g' | 'produkt_id'> {
  return { packrad_id: rad.id, deltagare_id: deltagareId, tur_id: rad.tur_id, namn: sak.namn, vikt_g: sak.vikt_g, produkt_id: sak.produkt_id }
}

/** Förrådets saker som passar en rad som alla ska ha: samma underkategori först, sedan samma kategori. */
export function passarRaden(saker: readonly Forradssak[], rad: PackradRad): Forradssak[] {
  const ordning = (s: Forradssak) => (rad.underkategori && s.underkategori === rad.underkategori ? 0 : 1)
  return saker
    .filter((s) => s.kategori === rad.kategori)
    .sort((a, b) => ordning(a) - ordning(b) || a.namn.localeCompare(b.namn, 'sv'))
}


const ANTALORD = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio']

/** Hur många av sorten som finns i listan. */
export function dubblettAntal(d: Dubblett): number {
  return d.rader.reduce((n, r) => n + Math.max(1, r.antal), 0)
}

/** Svaret på frågan om en dubblett: "Ja, båda behövs" när de är två, annars "Ja, alla behövs". */
export function dubblettSvar(d: Dubblett): string {
  return dubblettAntal(d) === 2 ? 'Ja, båda behövs' : 'Ja, alla behövs'
}

/**
 * Frågan om en dubblett, till exempel "Kök: Anna och Oscar tar med ett var. Behövs båda?". Rader som ingen tar med
 * ännu sägs för sig.
 */
export function dubblettText(d: Dubblett, namn: ReadonlyMap<string, string>): string {
  const sort = d.etikett.charAt(0).toUpperCase() + d.etikett.slice(1)
  const antal = dubblettAntal(d)
  const fraga = antal === 2 ? 'Behövs båda?' : `Behövs alla ${ANTALORD[antal] ?? antal}?`
  const barare = [...new Set(d.rader.flatMap((r) => (r.bars_av ? [namn.get(r.bars_av) ?? 'Någon'] : [])))]
  const utan = d.rader.filter((r) => !r.bars_av).reduce((n, r) => n + Math.max(1, r.antal), 0)
  const resten = utan === 0 ? '' : `, och ${utan === 1 ? 'en till' : `${ANTALORD[utan] ?? utan} till`} har ingen tagit på sig`

  if (barare.length === 0) return `${sort}: ${antal} i listan, som ingen tar med ännu. ${fraga}`
  if (barare.length === 1) {
    if (utan === 0) return `${sort}: ${antal} i listan, och ${barare[0]} tar med dem. ${fraga}`
    return `${sort}: ${barare[0]} tar med en${resten}. ${fraga}`
  }
  const lista = `${barare.slice(0, -1).join(', ')} och ${barare.at(-1)}`
  return `${sort}: ${lista} tar med en var${resten}. ${fraga}`
}
