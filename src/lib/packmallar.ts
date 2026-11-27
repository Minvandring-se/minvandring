// Packlistor: egna mallar som sparas på kontot och läggs i en tur. Rena funktioner utan databas.
import { KATEGORIER } from './forrad'
import type { Typ } from './vikt'

export interface Packmallrad {
  id: string
  namn: string
  kategori: string
  underkategori: string | null
  antal: number
  vikt_g: number | null
  typ: Typ
  /** Varje person har en egen, till exempel sovsäck. */
  alla: boolean
  /** Något gruppen behöver, som en person bär åt alla. */
  gemensam: boolean
  /** Min egen modell på en rad som alla ska ha, till exempel min sovsäck. */
  egen_namn: string | null
  egen_vikt_g: number | null
  sortering: number
}

/** Det som visas för raden: min egen modell när jag har valt en. */
export function visatNamn(r: Packmallrad): string {
  return r.egen_namn ?? r.namn
}

/** Vikten för en sak: min egen modells vikt när jag har valt en. */
export function visadVikt(r: Packmallrad): number | null {
  return r.egen_namn !== null ? r.egen_vikt_g : r.vikt_g
}

export interface Packmall {
  id: string
  namn: string
  /** Turen mallen sparades från. Står kvar när turen tas bort. */
  fran_tur_namn: string | null
  skapad: string
  packmallrader: Packmallrad[]
}

export const MALLNAMN_MAX = 80

/** Namnet på en mall, utan mellanslag i början och slutet, eller felet att visa. */
export function tolkaMallnamn(text: string): { namn: string } | { fel: string } {
  const namn = text.trim()
  if (!namn) return { fel: 'Skriv ett namn på packlistan.' }
  if (namn.length > MALLNAMN_MAX) return { fel: `Namnet får vara högst ${MALLNAMN_MAX} tecken.` }
  return { namn }
}

/** Ett namn som inte redan finns bland ens mallar, oavsett stora och små bokstäver. */
export function ledigtMallnamn(onskat: string, finns: readonly string[]): string {
  const upptagna = new Set(finns.map((n) => n.toLowerCase()))
  if (!upptagna.has(onskat.toLowerCase())) return onskat
  for (let i = 2; ; i++) {
    const forslag = `${onskat.slice(0, MALLNAMN_MAX - 4)} (${i})`
    if (!upptagna.has(forslag.toLowerCase())) return forslag
  }
}

export interface Mallsammanfattning {
  /** Antalet saker, där en rad med antal 2 räknas som två. */
  saker: number
  /** Det man bär själv i ryggsäcken: ens egna saker och det alla ska ha. Gemensamma saker räknas inte. */
  basvikt_g: number
  /** Det gemensamma i ryggsäckarna, som delas på gruppen. */
  gemensamt_g: number
  /** Rader utan vikt. */
  utanVikt: number
}

export function sammanfatta(rader: readonly Packmallrad[]): Mallsammanfattning {
  let saker = 0
  let basvikt_g = 0
  let gemensamt_g = 0
  let utanVikt = 0
  for (const r of rader) {
    saker += r.antal
    const vikt = visadVikt(r)
    if (vikt === null) utanVikt++
    if (r.typ !== 'ryggsack' || vikt === null) continue
    if (r.gemensam) gemensamt_g += vikt * r.antal
    else basvikt_g += vikt * r.antal
  }
  return { saker, basvikt_g, gemensamt_g, utanVikt }
}

export interface Mallkategori {
  nyckel: string
  etikett: string
  rader: Packmallrad[]
}

/** Raderna per kategori, i förrådets ordning och i mallens ordning. Tomma kategorier tas inte med. */
export function mallPerKategori(rader: readonly Packmallrad[]): Mallkategori[] {
  return KATEGORIER.flatMap((k) => {
    const i = rader.filter((r) => r.kategori === k.nyckel).sort((a, b) => a.sortering - b.sortering)
    return i.length ? [{ nyckel: k.nyckel, etikett: k.etikett, rader: i }] : []
  })
}

/** "2 saker", "1 sak". */
export function sakerText(n: number): string {
  return n === 1 ? '1 sak' : `${n} saker`
}

// ─── Mallens egen sida ────────────────────────────────────────────────────────

/** Vem som tar med raden i mallen. "jag" är den som äger mallen. */
export type Mallvem = 'jag' | 'gemensam' | 'alla'

export function mallvem(r: Pick<Packmallrad, 'alla' | 'gemensam'>): Mallvem {
  return r.alla ? 'alla' : r.gemensam ? 'gemensam' : 'jag'
}

export const MALLVEM_TEXT: Record<Mallvem, string> = { jag: 'Du', gemensam: 'Gemensam, en person bär den', alla: 'Alla har var sin' }

/** Kolumnerna för vem: en rad som slutar vara "alla" tappar också den egna modellen, som bara finns på sådana rader. */
export function vemKolumner(vem: Mallvem): Pick<Packmallrad, 'alla' | 'gemensam'> & Partial<Pick<Packmallrad, 'egen_namn' | 'egen_vikt_g'>> & { egen_produkt_id?: null } {
  if (vem === 'alla') return { alla: true, gemensam: false }
  return { alla: false, gemensam: vem === 'gemensam', egen_namn: null, egen_vikt_g: null, egen_produkt_id: null }
}

export interface Mallvikter {
  /** Det ägaren bär i ryggsäcken: egna saker och det alla ska ha. */
  bas_g: number
  /** Det gemensamma i ryggsäckarna, som delas på gruppen. */
  gemensamt_g: number
  forbrukas_g: number
  kropp_g: number
  /** Basvikten per kategori, tyngst först, utan kategorier som väger 0 g. */
  perKategori: { kategori: string; vikt: number }[]
}

/** Mallens vikter, med ens egen modell där den finns. Rader utan vikt räknas som 0 g. */
export function mallvikter(rader: readonly Packmallrad[]): Mallvikter {
  let bas_g = 0
  let gemensamt_g = 0
  let forbrukas_g = 0
  let kropp_g = 0
  const kategori = new Map<string, number>()
  for (const r of rader) {
    const g = (visadVikt(r) ?? 0) * r.antal
    if (r.typ === 'forbrukas') forbrukas_g += g
    else if (r.typ === 'kropp') kropp_g += g
    else if (r.gemensam) gemensamt_g += g
    else {
      bas_g += g
      kategori.set(r.kategori, (kategori.get(r.kategori) ?? 0) + g)
    }
  }
  const perKategori = [...kategori]
    .filter(([, v]) => v > 0)
    .map(([k, vikt]) => ({ kategori: k, vikt }))
    .sort((a, b) => b.vikt - a.vikt || a.kategori.localeCompare(b.kategori, 'sv'))
  return { bas_g, gemensamt_g, forbrukas_g, kropp_g, perKategori }
}

/** En ny rad i en mall, som den skickas till packmallrader. */
export interface NyMallrad {
  mall_id: string
  namn: string
  kategori: string
  underkategori: string | null
  produkt_id: string | null
  antal: number
  vikt_g: number | null
  typ: Typ
  alla: boolean
  gemensam: boolean
  sortering: number
}

/** En sak att lägga i en mall, ur förrådet, från formuläret eller ur en startmall. */
export function nyMallrad(
  mallId: string,
  sak: { namn: string; kategori: string; underkategori: string | null; produkt_id?: string | null; antal: number; vikt_g: number | null; typ: Typ },
  vem: Mallvem,
  sortering: number,
): NyMallrad {
  return {
    mall_id: mallId,
    namn: sak.namn.slice(0, 120),
    kategori: sak.kategori,
    underkategori: sak.underkategori,
    produkt_id: sak.produkt_id ?? null,
    antal: Math.min(Math.max(sak.antal, 1), 999),
    vikt_g: sak.vikt_g,
    typ: sak.typ,
    alla: vem === 'alla',
    gemensam: vem === 'gemensam',
    sortering: Math.min(sortering, 10000),
  }
}

/** Den sortering nästa rad får, sist i mallen. */
export function nastaSortering(rader: readonly Pick<Packmallrad, 'sortering'>[]): number {
  return Math.min(10000, Math.max(0, ...rader.map((r) => r.sortering)) + 1)
}
