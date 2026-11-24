// Sök, sortering och filtrering i Mitt förråd, och hur valen sparas i adressen. Rena funktioner utan databas.
import { KATEGORIER, arKategori, kategoriFor, underkategoriFor, underkategorierFor, type Filterval, type KategoriNyckel } from './forrad'
import type { Forradssak } from './typer'

const ORDNING: readonly string[] = KATEGORIER.map((k) => k.nyckel)

/** Sakerna visas alltid grupperade per kategori. Sorteringen gäller inom varje kategori. */
export const SORTERINGAR = [
  { varde: 'tyngst', etikett: 'Tyngst först' },
  { varde: 'lattast', etikett: 'Lättast först' },
  { varde: 'namn', etikett: 'Namn' },
] as const

export type Sortering = (typeof SORTERINGAR)[number]['varde']

export type Vy = 'lista' | 'rutnat'

export interface Listval {
  sok: string
  sortering: Sortering
  /** Tom text betyder alla kategorier. */
  kategori: KategoriNyckel | ''
  /** Tom text betyder alla underkategorier. Annars en underkategori i den valda kategorin. */
  underkategori: string
  vy: Vy
}

export const FORVALDA_VAL: Listval = { sok: '', sortering: 'tyngst', kategori: '', underkategori: '', vy: 'lista' }

/** Valen som begränsar vilka saker som visas. Underkategorin kan utelämnas och betyder då alla. */
type Filter = Pick<Listval, 'sok' | 'kategori'> & { underkategori?: string }

function arSortering(varde: unknown): varde is Sortering {
  return SORTERINGAR.some((s) => s.varde === varde)
}

/**
 * Läser valen ur adressens frågedel (?q=…&sortera=…&kategori=…&under=…&vy=…). Okända värden blir förvalen, och en
 * underkategori som inte hör till den valda kategorin blir alla.
 */
export function valFranAdress(parametrar: URLSearchParams): Listval {
  const sortering = parametrar.get('sortera')
  const grund: Listval = {
    ...FORVALDA_VAL,
    sok: (parametrar.get('q') ?? '').slice(0, 80),
    sortering: arSortering(sortering) ? sortering : FORVALDA_VAL.sortering,
    vy: parametrar.get('vy') === 'rutnat' ? 'rutnat' : 'lista',
  }
  return valjKategori(grund, parametrar.get('kategori') ?? '', parametrar.get('under') ?? '')
}

/** Valen som frågedel i adressen. Bara det som skiljer sig från förvalen tas med, så att adressen är ren i grundläget. */
export function adressFranVal(val: Listval): Record<string, string> {
  const ut: Record<string, string> = {}
  if (val.sok.trim()) ut.q = val.sok
  if (val.sortering !== FORVALDA_VAL.sortering) ut.sortera = val.sortering
  if (val.kategori) ut.kategori = val.kategori
  if (val.kategori && val.underkategori) ut.under = val.underkategori
  if (val.vy !== FORVALDA_VAL.vy) ut.vy = val.vy
  return ut
}

/** Adressen till Mitt förråd filtrerat på en kategori och underkategori, till exempel /forrad?kategori=sova&under=sovsack. */
export function forradsadress(kategori: string, underkategori: string): string {
  const fraga = new URLSearchParams(adressFranVal(valjKategori(FORVALDA_VAL, kategori, underkategori))).toString()
  return fraga ? `/forrad?${fraga}` : '/forrad'
}

/**
 * Valen efter att kategori eller underkategori har valts. En okänd kategori blir alla, och en underkategori som
 * inte hör till kategorin blir alla. Byts kategorin går underkategorin alltså tillbaka till alla.
 */
export function valjKategori(val: Listval, kategori: string, underkategori: string): Listval {
  const ny = arKategori(kategori) ? kategori : ''
  return { ...val, kategori: ny, underkategori: ny && underkategoriFor(ny, underkategori) ? underkategori : '' }
}

/** Visas inte hela förrådet? Sök, kategori och underkategori döljer saker. Sortering och vy gör det inte. */
export function harFilter(val: Filter): boolean {
  return val.sok.trim() !== '' || val.kategori !== '' || !!val.underkategori
}

/** Valen utan sök, kategori och underkategori, för knappen Visa alla. Sortering och vy är kvar. */
export function utanFilter(val: Listval): Listval {
  return { ...val, sok: '', kategori: '', underkategori: '' }
}

/**
 * Finns saken i förrådet men döljs av sök eller filter? Falskt så länge saken inte finns i listan än, till exempel
 * medan förrådet hämtas om efter att den sparades.
 */
export function doljsAvFiltret(sakId: string, alla: readonly Forradssak[], visade: readonly Forradssak[]): boolean {
  return alla.some((s) => s.id === sakId) && !visade.some((s) => s.id === sakId)
}

/** Texten som söks igenom för en sak: namn, märke, version och anteckning. */
function soktext(sak: Forradssak): string {
  return [sak.namn, sak.produkter?.marke, sak.produkter?.version, sak.notering].filter(Boolean).join(' ').toLowerCase()
}

/** Matchar saken söktexten? Varje ord ska finnas någonstans i namn, märke, version eller anteckning. */
export function matcharSok(sak: Forradssak, sok: string): boolean {
  const ord = sok.toLowerCase().split(/\s+/).filter(Boolean)
  const text = soktext(sak)
  return ord.every((o) => text.includes(o))
}

/**
 * Sakerna som ska visas med valen: de i vald kategori och underkategori som matchar söktexten.
 * Saker utan underkategori syns bara när alla underkategorier visas.
 */
export function filtrera(saker: readonly Forradssak[], val: Filter): Forradssak[] {
  return saker.filter(
    (s) =>
      (!val.kategori || kategoriFor(s.kategori).nyckel === val.kategori) &&
      (!val.underkategori || s.underkategori === val.underkategori) &&
      matcharSok(s, val.sok),
  )
}

/** Sakens vikt i listan: antal gånger vikt per styck. null när vikten saknas. */
function radvikt(sak: Forradssak): number | null {
  return sak.vikt_g === null ? null : sak.antal * sak.vikt_g
}

const efterNamn = (a: Forradssak, b: Forradssak) => a.namn.localeCompare(b.namn, 'sv', { numeric: true })

/**
 * Sakerna i vald ordning. Saker utan vikt hamnar sist både för tyngst och lättast. Lika värden sorteras på namn.
 */
export function sortera(saker: readonly Forradssak[], sortering: Sortering): Forradssak[] {
  const lista = [...saker]
  if (sortering === 'tyngst' || sortering === 'lattast') {
    const riktning = sortering === 'tyngst' ? -1 : 1
    return lista.sort((a, b) => {
      const va = radvikt(a)
      const vb = radvikt(b)
      if (va === null || vb === null) return (va === null ? 1 : 0) - (vb === null ? 1 : 0) || efterNamn(a, b)
      return riktning * (va - vb) || efterNamn(a, b)
    })
  }
  return lista.sort(efterNamn)
}

/** Antal saker per kategori i förrådet, för kategorivalet ("Sova 2"). Tre flaskor räknas som en rad. */
export function antalPerKategori(saker: readonly Forradssak[]): Record<string, number> {
  const ut: Record<string, number> = {}
  for (const s of saker) {
    const nyckel = kategoriFor(s.kategori).nyckel
    ut[nyckel] = (ut[nyckel] ?? 0) + 1
  }
  return ut
}

/** Kategorierna som finns i förrådet, i den ordning de visas. För valet "bara en kategori". */
export function kategorierIForradet(saker: readonly Forradssak[]): { nyckel: KategoriNyckel; etikett: string }[] {
  const finns = new Set(saker.map((s) => kategoriFor(s.kategori).nyckel))
  return [...finns]
    .filter(arKategori)
    .map((nyckel) => ({ nyckel, etikett: kategoriFor(nyckel).etikett }))
    .sort((a, b) => ORDNING.indexOf(a.nyckel) - ORDNING.indexOf(b.nyckel))
}

/**
 * Alternativen i kategorilistan: kategorierna som har saker, med antal. Den valda kategorin är alltid med, med (0)
 * om den saknar saker, så att listan aldrig visar ett val som inte finns bland alternativen.
 */
export function kategorivalIForradet(saker: readonly Forradssak[], vald: KategoriNyckel | ''): Filterval[] {
  const antal = antalPerKategori(saker)
  const finns = kategorierIForradet(saker)
  const lista = vald && !finns.some((k) => k.nyckel === vald) ? [...finns, { nyckel: vald, etikett: kategoriFor(vald).etikett }] : finns
  return lista
    .sort((a, b) => ORDNING.indexOf(a.nyckel) - ORDNING.indexOf(b.nyckel))
    .map((k) => ({ nyckel: k.nyckel, etikett: k.etikett, antal: antal[k.nyckel] ?? 0 }))
}

/** Antal saker per underkategori i en huvudkategori. Saker utan underkategori, eller med en som inte hör dit, räknas inte. */
export function antalPerUnderkategori(saker: readonly Forradssak[], kategori: string): Record<string, number> {
  const ut: Record<string, number> = {}
  for (const s of saker) {
    if (kategoriFor(s.kategori).nyckel !== kategori || !underkategoriFor(kategori, s.underkategori)) continue
    const nyckel = s.underkategori as string
    ut[nyckel] = (ut[nyckel] ?? 0) + 1
  }
  return ut
}

/**
 * Alternativen i underkategorilistan: den valda kategorins underkategorier som har saker, i samma ordning som i
 * KATEGORIER och med antal. Den valda underkategorin är alltid med, med (0) om den saknar saker.
 */
export function underkategorivalIForradet(saker: readonly Forradssak[], kategori: KategoriNyckel | '', vald: string): Filterval[] {
  const antal = antalPerUnderkategori(saker, kategori)
  return underkategorierFor(kategori)
    .filter((u) => antal[u.nyckel] || u.nyckel === vald)
    .map((u) => ({ nyckel: u.nyckel, etikett: u.etikett, antal: antal[u.nyckel] ?? 0 }))
}
