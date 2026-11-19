// Sök, sortering och filtrering i Mitt förråd, och hur valen sparas i adressen. Rena funktioner utan databas.
import { KATEGORIER, arKategori, kategoriFor, type KategoriNyckel } from './forrad'
import type { Forradssak } from './typer'

const ORDNING: readonly string[] = KATEGORIER.map((k) => k.nyckel)

/** Så många saker ska förrådet ha innan sök och sortering visas. Med färre syns allt ändå. */
export const MIN_FOR_VERKTYG = 8

export const SORTERINGAR = [
  { varde: 'kategori', etikett: 'Kategori' },
  { varde: 'tyngst', etikett: 'Tyngst först' },
  { varde: 'lattast', etikett: 'Lättast först' },
  { varde: 'namn', etikett: 'Namn' },
  { varde: 'senast', etikett: 'Senast tillagd' },
] as const

export type Sortering = (typeof SORTERINGAR)[number]['varde']

export interface Listval {
  sok: string
  /** 'kategori' är förvalet: sakerna visas grupperade per kategori, som utan verktygen. */
  sortering: Sortering
  /** Tom text betyder alla kategorier. */
  kategori: KategoriNyckel | ''
}

export const FORVALDA_VAL: Listval = { sok: '', sortering: 'kategori', kategori: '' }

function arSortering(varde: unknown): varde is Sortering {
  return SORTERINGAR.some((s) => s.varde === varde)
}

/** Läser valen ur adressens frågedel (?q=…&sortera=…&kategori=…). Okända värden blir förvalen. */
export function valFranAdress(parametrar: URLSearchParams): Listval {
  const sortering = parametrar.get('sortera')
  const kategori = parametrar.get('kategori')
  return {
    sok: (parametrar.get('q') ?? '').slice(0, 80),
    sortering: arSortering(sortering) ? sortering : 'kategori',
    kategori: arKategori(kategori) ? kategori : '',
  }
}

/** Valen som frågedel i adressen. Bara det som skiljer sig från förvalen tas med, så att adressen är ren i grundläget. */
export function adressFranVal(val: Listval): Record<string, string> {
  const ut: Record<string, string> = {}
  if (val.sok.trim()) ut.q = val.sok
  if (val.sortering !== 'kategori') ut.sortera = val.sortering
  if (val.kategori) ut.kategori = val.kategori
  return ut
}

/** Är något val gjort som gör att inte hela förrådet visas i grundordningen? */
export function harVal(val: Listval): boolean {
  return Object.keys(adressFranVal(val)).length > 0
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

/** Sakerna som ska visas med valen: de i vald kategori som matchar söktexten. */
export function filtrera(saker: readonly Forradssak[], val: Pick<Listval, 'sok' | 'kategori'>): Forradssak[] {
  return saker.filter((s) => (!val.kategori || kategoriFor(s.kategori).nyckel === val.kategori) && matcharSok(s, val.sok))
}

/** Sakens vikt i listan: antal gånger vikt per styck. null när vikten saknas. */
function radvikt(sak: Forradssak): number | null {
  return sak.vikt_g === null ? null : sak.antal * sak.vikt_g
}

const efterNamn = (a: Forradssak, b: Forradssak) => a.namn.localeCompare(b.namn, 'sv', { numeric: true })

/**
 * Sakerna i en enda lista, i vald ordning. Saker utan vikt hamnar sist både för tyngst och lättast,
 * och saker utan datum sist för senast tillagd. Lika värden sorteras på namn.
 * Sorteringen 'kategori' hanteras av summeraForrad, och ger här samma ordning som namn.
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
  if (sortering === 'senast') {
    return lista.sort((a, b) => (b.skapad ?? '').localeCompare(a.skapad ?? '') || efterNamn(a, b))
  }
  return lista.sort(efterNamn)
}

/** Kategorierna som finns i förrådet, i den ordning de visas. För valet "bara en kategori". */
export function kategorierIForradet(saker: readonly Forradssak[]): { nyckel: KategoriNyckel; etikett: string }[] {
  const finns = new Set(saker.map((s) => kategoriFor(s.kategori).nyckel))
  return [...finns]
    .filter(arKategori)
    .map((nyckel) => ({ nyckel, etikett: kategoriFor(nyckel).etikett }))
    .sort((a, b) => ORDNING.indexOf(a.nyckel) - ORDNING.indexOf(b.nyckel))
}
