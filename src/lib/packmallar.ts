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
  if (!namn) return { fel: 'Skriv ett namn på mallen.' }
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
