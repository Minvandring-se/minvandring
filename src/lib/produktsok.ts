// Sökningen i produktkatalogen: vilka ord som söks, filtret till databasen, ordningen på träffarna
// och hur en träff blir en sak i förrådet. Rena funktioner utan databas.
import { KATEGORIER, MAX_NAMN, arKategori, forvaldTyp, kategoriForUnder, type Forval, type SakVarden, type UnderkategoriNyckel } from './forrad'
import type { Produkt } from './typer'

/** Kortaste söktexten som ger en sökning. */
export const MIN_SOKLANGD = 2
const MAX_ORD = 5

/**
 * Orden i söktexten, med små bokstäver. Allt som inte är bokstäver eller siffror delar upp texten,
 * så "X-Mid 1" blir x, mid och 1. Då kan inget i texten ändra filtret till databasen.
 */
export function sokord(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, MAX_ORD)
}

/** Räcker texten för att söka? */
export function gArAttSoka(text: string): boolean {
  return sokord(text).join('').length >= MIN_SOKLANGD
}

/** Underkategorier vars namn, eller huvudkategorins namn, innehåller ordet. "tält" ger tält, och "sova" ger sovsäck och liggunderlag. */
function underkategorierFor(ord: string): string[] {
  if (ord.length < 3) return []
  return KATEGORIER.flatMap((k) =>
    k.etikett.toLowerCase().includes(ord) ? k.under.map((u) => u.nyckel) : k.under.filter((u) => u.etikett.toLowerCase().includes(ord)).map((u) => u.nyckel),
  )
}

/**
 * Filtret för ett sökord, i PostgREST:s or-format: ordet ska finnas i märket eller modellen,
 * eller vara namnet på produktens kategori. Varje ord i söktexten ger ett eget filter, och alla ska stämma.
 */
export function sokfilter(ord: string): string {
  const delar = [`marke.ilike.%${ord}%`, `modell.ilike.%${ord}%`]
  const under = underkategorierFor(ord)
  if (under.length) delar.push(`underkategori.in.(${under.join(',')})`)
  return delar.join(',')
}

/** "Hilleberg Akto". Versionen visas för sig i träfflistan. */
export function produktnamn(p: Pick<Produkt, 'marke' | 'modell'>): string {
  return `${p.marke} ${p.modell}`
}

/** 0 = namnet börjar med söktexten, 1 = alla ord börjar ett ord i namnet, 2 = övriga träffar. */
function rang(p: Produkt, text: string, ord: string[]): number {
  const namn = produktnamn(p).toLowerCase()
  const sokt = text.trim().toLowerCase()
  if (sokt && (namn.startsWith(sokt) || p.modell.toLowerCase().startsWith(sokt))) return 0
  const namnord = sokord(namn)
  return ord.length > 0 && ord.every((o) => namnord.some((n) => n.startsWith(o))) ? 1 : 2
}

/** Träffarna i den ordning de visas: bäst träff först, sedan i bokstavsordning på namn och version. */
export function sorteraTraffar<P extends Produkt>(produkter: P[], text: string): P[] {
  const ord = sokord(text)
  return [...produkter].sort(
    (a, b) =>
      rang(a, text, ord) - rang(b, text, ord) ||
      produktnamn(a).localeCompare(produktnamn(b), 'sv', { numeric: true }) ||
      (a.version ?? '').localeCompare(b.version ?? '', 'sv', { numeric: true }),
  )
}

/** Saken som läggs i förrådet när man väljer en produkt. Uppgifterna kopieras, så att man kan ändra sin egen sak. */
export function sakFranProdukt(p: Produkt): SakVarden & { produkt_id: string } {
  return {
    produkt_id: p.id,
    namn: produktnamn(p).slice(0, MAX_NAMN),
    kategori: p.kategori,
    underkategori: p.underkategori,
    typ: forvaldTyp(p.kategori, p.underkategori),
    antal: 1,
    vikt_g: p.packvikt_g,
    notering: null,
  }
}

/**
 * Förvalen i formuläret när en produkt läggs i förrådet från katalogen. Samma uppgifter som när man väljer
 * produkten i Lägg till utrustning, men antal och anteckning går att ändra innan man sparar.
 */
export function forvalFranProdukt(p: Produkt): Forval {
  const sak = sakFranProdukt(p)
  return {
    namn: sak.namn,
    kategori: arKategori(sak.kategori) ? sak.kategori : undefined,
    underkategori: kategoriForUnder(p.underkategori) ? (p.underkategori as UnderkategoriNyckel) : undefined,
    vikt_g: sak.vikt_g,
    produkt_id: sak.produkt_id,
  }
}

/** En modell i träfflistan: alla produkter med samma märke och modell, till exempel en sovsäck i tre längder. */
export interface Modell<P extends Produkt = Produkt> {
  /** Märke och modell med små bokstäver. Unik i listan. */
  nyckel: string
  marke: string
  modell: string
  /** Varianterna (storlekarna), lättast först. Alltid minst en. */
  varianter: P[]
}

/**
 * Slår ihop produkter med samma märke och modell till en rad. Modellerna står i den ordning de först
 * förekommer, så sorteringen av träffarna behålls. Varianterna sorteras på vikt och sedan på version.
 */
export function grupperaModeller<P extends Produkt>(produkter: P[]): Modell<P>[] {
  const modeller = new Map<string, Modell<P>>()
  for (const p of produkter) {
    const nyckel = `${p.marke.trim().toLowerCase()}|${p.modell.trim().toLowerCase()}`
    const m = modeller.get(nyckel)
    if (m) m.varianter.push(p)
    else modeller.set(nyckel, { nyckel, marke: p.marke, modell: p.modell, varianter: [p] })
  }
  for (const m of modeller.values()) {
    m.varianter.sort((a, b) => a.packvikt_g - b.packvikt_g || (a.version ?? '').localeCompare(b.version ?? '', 'sv', { numeric: true }))
  }
  return [...modeller.values()]
}

export interface Marke {
  marke: string
  /** Antal modeller, alltså lika många rader som listan visar för märket. */
  antal: number
}

/** Märkena bland modellerna i bokstavsordning, med antal modeller. */
export function markenMedAntal(modeller: Modell[]): Marke[] {
  const antal = new Map<string, number>()
  for (const m of modeller) antal.set(m.marke, (antal.get(m.marke) ?? 0) + 1)
  return [...antal].map(([marke, n]) => ({ marke, antal: n })).sort((a, b) => a.marke.localeCompare(b.marke, 'sv'))
}

/**
 * Texten när katalogen inte har några träffar. Med söktext är det sökningen som inte matchar, annars är
 * kategorin eller underkategorin tom.
 */
export function ingaTraffarText(val: { harText: boolean; kategori: string; underkategori: string }): string {
  if (val.harText) return 'Inga produkter matchar din sökning.'
  if (val.underkategori) return 'Inga produkter i katalogen i den här underkategorin än.'
  if (val.kategori) return 'Inga produkter i katalogen i den här kategorin än.'
  return 'Inga produkter matchar din sökning.'
}

/** "1 produkt" eller "42 produkter", för raden ovanför träfflistan. */
export function antalText(antal: number): string {
  return antal === 1 ? '1 produkt' : `${antal} produkter`
}
