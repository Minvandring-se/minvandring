// Matplanen: dagar, energi och vikt per portion och dag, och inköpslistan. Rena funktioner utan databas.
//
// I första versionen äter alla personer i turen en portion av varje rätt i en måltid. Hundar äter egen mat,
// som räknas i vikt.ts (hundmat_per_dag_g).
import type { Ingrediens, Maltid, Maltidsrad, Matprodukt, Ratt, Vara } from './typer'

export const MALTIDER: readonly { nyckel: Maltid; etikett: string }[] = [
  { nyckel: 'frukost', etikett: 'Frukost' },
  { nyckel: 'lunch', etikett: 'Lunch' },
  { nyckel: 'middag', etikett: 'Middag' },
  { nyckel: 'mellanmal', etikett: 'Mellanmål' },
]

/** Måltiderna som räknas som saknade när de är tomma. Mellanmål är frivilliga. */
export const HUVUDMALTIDER: readonly Maltid[] = ['frukost', 'lunch', 'middag']

export interface Matdag {
  dag: number
  reserv: boolean
  /** "Dag 3" eller "Reservdag 1". */
  namn: string
}

/** Turens dagar: vandringsdagarna och sedan reservdagarna. Tom lista tills antalet dagar är angivet. */
export function matdagar(dagar: number | null, reservdagar: number): Matdag[] {
  if (!dagar || dagar < 1) return []
  const ut: Matdag[] = []
  for (let d = 1; d <= dagar; d++) ut.push({ dag: d, reserv: false, namn: `Dag ${d}` })
  for (let r = 1; r <= Math.max(0, reservdagar); r++) ut.push({ dag: dagar + r, reserv: true, namn: `Reservdag ${r}` })
  return ut
}

/** Kcal per 100 g, avrundat till heltal. null när vikten saknas. */
export function kcalPer100g(kcal: number, gram: number): number | null {
  if (!(gram > 0)) return null
  return Math.round((kcal * 100) / gram)
}

/** Energi, protein och vikt. ofullstandig när en ingrediens saknar kcal eller protein, så att summan är för låg. */
export interface Naring {
  kcal: number
  proteinG: number
  gram: number
  ofullstandig: boolean
}

const NOLL: Naring = { kcal: 0, proteinG: 0, gram: 0, ofullstandig: false }

function plus(a: Naring, b: Naring, ganger = 1): Naring {
  return {
    kcal: a.kcal + b.kcal * ganger,
    proteinG: a.proteinG + b.proteinG * ganger,
    gram: a.gram + b.gram * ganger,
    ofullstandig: a.ofullstandig || b.ofullstandig,
  }
}

export type Pase = Pick<Matprodukt, 'id' | 'vikt_torr_g' | 'portioner' | 'kcal' | 'protein_g'>

/** En portion ur en påse. */
export function pasePerPortion(p: Pase): Naring {
  const portioner = Math.max(1, p.portioner)
  return {
    kcal: p.kcal / portioner,
    proteinG: (p.protein_g ?? 0) / portioner,
    gram: p.vikt_torr_g / portioner,
    ofullstandig: p.protein_g === null,
  }
}

/** Allt som behövs för att räkna på en matplan. */
export interface Matdata {
  ratter: readonly Ratt[]
  ingredienser: readonly Ingrediens[]
  varor: readonly Vara[]
  /** Påsarna som rätterna pekar på, med id som nyckel. */
  pasar: ReadonlyMap<string, Pase>
  maltider: readonly Maltidsrad[]
}

/** En portion av en rätt: påsens värden, eller summan av ingredienserna. */
export function rattPerPortion(ratt: Ratt, data: Matdata): Naring {
  if (ratt.matprodukt_id) {
    const pase = data.pasar.get(ratt.matprodukt_id)
    return pase ? pasePerPortion(pase) : { ...NOLL, ofullstandig: true }
  }
  const varor = new Map(data.varor.map((v) => [v.id, v]))
  let summa = NOLL
  for (const ing of data.ingredienser) {
    if (ing.ratt_id !== ratt.id) continue
    const vara = varor.get(ing.vara_id)
    const g = ing.gram_per_portion
    summa = plus(summa, {
      kcal: ((vara?.kcal_per_100g ?? 0) * g) / 100,
      proteinG: ((vara?.protein_per_100g ?? 0) * g) / 100,
      gram: g,
      ofullstandig: vara?.kcal_per_100g == null || vara?.protein_per_100g == null,
    })
  }
  return summa
}

/** Måltiderna som ligger inom turens dagar. Rader på dagar som har tagits bort räknas inte. */
function inomTuren(data: Matdata, dagar: readonly Matdag[]): Maltidsrad[] {
  const finns = new Set(dagar.map((d) => d.dag))
  return data.maltider.filter((m) => finns.has(m.dag))
}

export interface Dagssumma {
  dag: Matdag
  /** Per person. */
  naring: Naring
  /** Huvudmåltider utan någon rätt. */
  saknas: Maltid[]
}

/** Energi, protein och vikt per person för varje dag, och vilka huvudmåltider som saknas. */
export function dagssummor(data: Matdata, dagar: readonly Matdag[]): Dagssumma[] {
  const ratter = new Map(data.ratter.map((r) => [r.id, r]))
  const perPortion = new Map(data.ratter.map((r) => [r.id, rattPerPortion(r, data)]))
  return dagar.map((dag) => {
    const rader = data.maltider.filter((m) => m.dag === dag.dag && ratter.has(m.ratt_id))
    const naring = rader.reduce((s, m) => plus(s, perPortion.get(m.ratt_id)!), NOLL)
    const saknas = HUVUDMALTIDER.filter((maltid) => !rader.some((m) => m.maltid === maltid))
    return { dag, naring, saknas }
  })
}

export interface Inkopsrad {
  typ: 'vara' | 'pase'
  /** Varans id, eller rättens id för en påse. Det är där ansvarig och klart sparas. */
  id: string
  namn: string
  /** Total vikt i gram. För påsar hela påsar. */
  gram: number
  /** Antal påsar. Bara för påsar. */
  pasar?: number
  varifran: 'kopa' | 'hemifran'
  ansvarig: string | null
  klart: boolean
}

/**
 * Det som ska köpas eller tas med för hela turen.
 * Varor: receptmängden gånger antalet personer, för varje gång rätten äts, plus extra_g.
 * Påsar: portionerna delat med portioner per påse, avrundat uppåt till hela påsar.
 * Varor som inte används och inte har någon extra mängd kommer inte med.
 */
export function inkopslista(data: Matdata, dagar: readonly Matdag[], personer: number): Inkopsrad[] {
  const ganger = new Map<string, number>()
  for (const m of inomTuren(data, dagar)) ganger.set(m.ratt_id, (ganger.get(m.ratt_id) ?? 0) + 1)

  const gramPerVara = new Map<string, number>()
  for (const ing of data.ingredienser) {
    const n = ganger.get(ing.ratt_id) ?? 0
    if (n === 0) continue
    gramPerVara.set(ing.vara_id, (gramPerVara.get(ing.vara_id) ?? 0) + ing.gram_per_portion * n * personer)
  }

  const varor: Inkopsrad[] = data.varor
    .map((v) => ({
      typ: 'vara' as const,
      id: v.id,
      namn: v.namn,
      gram: (gramPerVara.get(v.id) ?? 0) + Math.max(0, v.extra_g),
      varifran: v.varifran ?? 'kopa',
      ansvarig: v.ansvarig,
      klart: v.klart,
    }))
    .filter((r) => r.gram > 0)

  const pasar: Inkopsrad[] = []
  for (const ratt of data.ratter) {
    const n = ganger.get(ratt.id) ?? 0
    const pase = ratt.matprodukt_id ? data.pasar.get(ratt.matprodukt_id) : undefined
    if (!pase || n === 0 || personer === 0) continue
    const antal = Math.ceil((n * personer) / Math.max(1, pase.portioner))
    pasar.push({
      typ: 'pase',
      id: ratt.id,
      namn: ratt.namn,
      gram: antal * pase.vikt_torr_g,
      pasar: antal,
      varifran: 'kopa',
      ansvarig: ratt.ansvarig,
      klart: ratt.klart,
    })
  }

  return [...varor, ...pasar].sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))
}

export interface Inkopsgrupp {
  /** Deltagarens id, eller null för det som ingen ansvarar för. */
  ansvarig: string | null
  rader: Inkopsrad[]
}

/** Det som ska köpas, grupperat per ansvarig med det som ingen ansvarar för först, och det som tas hemifrån för sig. */
export function inkopsgrupper(rader: readonly Inkopsrad[], ordning: readonly string[]): { attKopa: Inkopsgrupp[]; hemifran: Inkopsrad[] } {
  const kopa = rader.filter((r) => r.varifran === 'kopa')
  const ansvariga = [null, ...ordning] as (string | null)[]
  // Den som inte längre finns bland deltagarna hamnar sist, så att ingen rad försvinner.
  for (const r of kopa) if (!ansvariga.includes(r.ansvarig)) ansvariga.push(r.ansvarig)
  const attKopa = ansvariga
    .map((ansvarig) => ({ ansvarig, rader: kopa.filter((r) => r.ansvarig === ansvarig) }))
    .filter((g) => g.rader.length > 0)
  return { attKopa, hemifran: rader.filter((r) => r.varifran === 'hemifran') }
}

/** All mat till personerna i gram, för vikten per person i vikt.ts (matvikter). */
export function matviktTotalt(rader: readonly Inkopsrad[]): number {
  return rader.reduce((s, r) => s + r.gram, 0)
}

export interface Matsummering {
  /** Snittet per person och dag, för dagar som har någon mat. */
  snittKcal: number
  /** Den dag med minst energi per person, bland alla dagar. */
  lagstaKcal: number
  snittProteinG: number
  saknadeMaltider: number
  ofullstandig: boolean
}

/** Översikten överst i matplanen. */
export function matsummering(summor: readonly Dagssumma[]): Matsummering {
  const medMat = summor.filter((s) => s.naring.gram > 0)
  const snitt = (f: (s: Dagssumma) => number) => (medMat.length ? medMat.reduce((t, s) => t + f(s), 0) / medMat.length : 0)
  return {
    snittKcal: snitt((s) => s.naring.kcal),
    lagstaKcal: summor.length ? Math.min(...summor.map((s) => s.naring.kcal)) : 0,
    snittProteinG: snitt((s) => s.naring.proteinG),
    saknadeMaltider: summor.reduce((t, s) => t + s.saknas.length, 0),
    ofullstandig: summor.some((s) => s.naring.ofullstandig),
  }
}
