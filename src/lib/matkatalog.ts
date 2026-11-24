// Matkatalogen: filter och sortering som står i adressen, sökning bland påsarna och det som visas på korten
// och i panelen. Rena funktioner utan databas.
import { ALLERGENER, allergenetikett, arAllergen, KOSTVAL, passarFilter, uppraknade, type Allergen, type Kostval } from './kost'
import { kcalPer100g, pasnamn } from './mat'
import type { Katalogmaltid, Matprodukt } from './typer'

export const KATALOGMALTIDER: readonly { nyckel: Katalogmaltid; etikett: string }[] = [
  { nyckel: 'frukost', etikett: 'Frukost' },
  { nyckel: 'lunch_middag', etikett: 'Lunch och middag' },
  { nyckel: 'dessert', etikett: 'Dessert' },
  { nyckel: 'mellanmal', etikett: 'Mellanmål' },
]

export const SORTERINGAR = [
  { nyckel: 'energi', etikett: 'Mest energi per 100 g' },
  { nyckel: 'kcal', etikett: 'Mest kcal' },
  { nyckel: 'pris', etikett: 'Lägst pris' },
  { nyckel: 'vikt', etikett: 'Lägst vikt' },
] as const

export type Sortering = (typeof SORTERINGAR)[number]['nyckel']

/** Filtret och sorteringen i katalogen. Står i adressen, så att de finns kvar efter bakåt och går att länka till. */
export interface Katalogfilter {
  maltid: Katalogmaltid | ''
  marke: string
  val: Kostval[]
  utan: Allergen[]
  sortering: Sortering
}

export const TOMT_KATALOGFILTER: Katalogfilter = { maltid: '', marke: '', val: [], utan: [], sortering: 'energi' }

const MAX_MARKE = 80

function lista(text: string | null): string[] {
  return text ? text.split(',').filter(Boolean) : []
}

/** Läser filtret ur adressen. Okända värden hoppas över. */
export function filterFranAdress(p: URLSearchParams): Katalogfilter {
  const maltid = p.get('maltid') ?? ''
  const sortering = p.get('sortering') ?? ''
  const kost = new Set(lista(p.get('kost')))
  const utan = new Set(lista(p.get('utan')))
  return {
    maltid: KATALOGMALTIDER.some((m) => m.nyckel === maltid) ? (maltid as Katalogmaltid) : '',
    marke: (p.get('marke') ?? '').trim().slice(0, MAX_MARKE),
    // I samma ordning som knapparna, så att adressen blir densamma oavsett i vilken ordning man trycker.
    val: KOSTVAL.map((k) => k.nyckel).filter((k) => kost.has(k)),
    utan: ALLERGENER.map((a) => a.nyckel).filter((a) => utan.has(a) && arAllergen(a)),
    sortering: SORTERINGAR.some((s) => s.nyckel === sortering) ? (sortering as Sortering) : 'energi',
  }
}

/** Skriver filtret i adressen. Andra delar av adressen, till exempel den öppna påsen, följer med. Tomt och förval skrivs inte. */
export function filterTillAdress(f: Katalogfilter, forut: URLSearchParams): URLSearchParams {
  const p = new URLSearchParams(forut)
  const satt = (nyckel: string, varde: string) => (varde ? p.set(nyckel, varde) : p.delete(nyckel))
  satt('maltid', f.maltid)
  satt('marke', f.marke.trim().slice(0, MAX_MARKE))
  satt('kost', f.val.join(','))
  satt('utan', f.utan.join(','))
  satt('sortering', f.sortering === 'energi' ? '' : f.sortering)
  return p
}

/** Märkena i katalogen, i bokstavsordning, för listan att välja i. */
export function marken(katalog: readonly Pick<Matprodukt, 'marke'>[]): string[] {
  return [...new Set(katalog.map((p) => p.marke))].sort((a, b) => a.localeCompare(b, 'sv'))
}

/** Ett värde att sortera på där det som saknas hamnar sist, oavsett riktning. */
function jamfor(a: number | null, b: number | null, stigande: boolean): number {
  if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1
  return stigande ? a - b : b - a
}

const SORTERA: Record<Sortering, (a: Matprodukt, b: Matprodukt) => number> = {
  energi: (a, b) => jamfor(kcalPer100g(a.kcal, a.vikt_torr_g), kcalPer100g(b.kcal, b.vikt_torr_g), false),
  kcal: (a, b) => b.kcal - a.kcal,
  pris: (a, b) => jamfor(a.pris_sek_ca, b.pris_sek_ca, true),
  vikt: (a, b) => a.vikt_torr_g - b.vikt_torr_g,
}

/** Påsarna som passar sökningen och filtret, sorterade. Varje ord i sökningen måste finnas i märke och namn. */
export function sokPasar(katalog: readonly Matprodukt[], sok: string, f: Katalogfilter): Matprodukt[] {
  const ord = sok.toLowerCase().split(/\s+/).filter(Boolean)
  // Ett märke som inte finns i katalogen, till exempel från en gammal länk, filtrerar inte. Väljaren visar då Alla märken.
  const onskat = f.marke.toLowerCase()
  const marke = katalog.some((p) => p.marke.toLowerCase() === onskat) ? onskat : ''
  return katalog
    .filter((p) => {
      if (f.maltid && p.maltid !== f.maltid) return false
      if (marke && p.marke.toLowerCase() !== marke) return false
      if (!passarFilter(p, { val: f.val, utan: f.utan })) return false
      const namn = pasnamn(p).toLowerCase()
      return ord.every((o) => namn.includes(o))
    })
    .sort((a, b) => SORTERA[f.sortering](a, b) || pasnamn(a).localeCompare(pasnamn(b), 'sv'))
}

/** Påsen som får brickan "Mest energi": högst kcal per 100 g bland träffarna, när det finns minst tre. Vid lika den första. */
export function mestEnergi(traffar: readonly Matprodukt[]): string | null {
  if (traffar.length < 3) return null
  let basta: { id: string; per100: number } | null = null
  for (const p of traffar) {
    const per100 = kcalPer100g(p.kcal, p.vikt_torr_g)
    if (per100 !== null && (basta === null || per100 > basta.per100)) basta = { id: p.id, per100 }
  }
  return basta?.id ?? null
}

/** Kostetiketterna på kortet, bara det som är känt och sant. Vegansk räcker, eftersom den också är vegetarisk. */
export function kostetiketter(p: Pick<Matprodukt, Kostval>): string[] {
  return KOSTVAL.filter((k) => p[k.nyckel] === true && !(k.nyckel === 'vegetarisk' && p.vegansk === true)).map((k) => k.etikett)
}

const tal = (n: number, decimaler: number) => n.toLocaleString('sv-SE', { maximumFractionDigits: decimaler })

export interface Naringsrad {
  etikett: string
  perPase: string
  per100g: string
}

/** Näringen per påse och per 100 g, för tabellen i panelen. Det som saknas står som ett streck. */
export function naringstabell(p: Matprodukt): Naringsrad[] {
  const per100 = (v: number) => (v * 100) / p.vikt_torr_g
  const gram = (v: number | null) => ({ perPase: v === null ? '–' : `${tal(v, 1)} g`, per100g: v === null ? '–' : `${tal(per100(v), 1)} g` })
  return [
    { etikett: 'Energi', perPase: `${tal(p.kcal, 0)} kcal`, per100g: `${tal(per100(p.kcal), 0)} kcal` },
    { etikett: 'Protein', ...gram(p.protein_g) },
    { etikett: 'Fett', ...gram(p.fett_g) },
    { etikett: 'Kolhydrater', ...gram(p.kolhydrater_g) },
  ]
}

/** Allergenerna som de står i panelen. */
export function allergentext(p: Pick<Matprodukt, 'allergener'>): string {
  if (p.allergener === null) return 'Okänt'
  if (p.allergener.length === 0) return 'Ingen av de 14 allergenerna'
  return uppraknade(p.allergener.map((a, i) => (i === 0 ? allergenetikett(a) : allergenetikett(a).toLowerCase())))
}

/** Spåren som de står i panelen. null när inga spår är angivna. */
export function spartext(p: Pick<Matprodukt, 'spar'>): string | null {
  if (!p.spar?.length) return null
  return uppraknade(p.spar.map((a, i) => (i === 0 ? allergenetikett(a) : allergenetikett(a).toLowerCase())))
}

/** Priset som det visas: "Cirka 129 kr". null när priset saknas. */
export function pristext(p: Pick<Matprodukt, 'pris_sek_ca'>): string | null {
  return p.pris_sek_ca === null ? null : `Cirka ${tal(p.pris_sek_ca, 0)} kr`
}
