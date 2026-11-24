// Matplanen: dagar, energi och vikt per portion och dag, och inköpslistan. Rena funktioner utan databas.
//
// I första versionen äter alla personer i turen en portion av varje rätt i en måltid. Hundar äter egen mat,
// som räknas i vikt.ts (hundmat_per_dag_g).
import { allergenetikett, uppraknade } from './kost'
import type { Ingrediens, Katalogmaltid, Maltid, Maltidsrad, Matprodukt, Ratt, Vara } from './typer'

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

/** Energi som den visas: "1 250 kcal". */
export function formateraKcal(kcal: number): string {
  return `${Math.round(kcal).toLocaleString('sv-SE')} kcal`
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

/** En måltid i planen: dag och måltid. */
export interface Plats {
  dag: Matdag
  maltid: Maltid
}

/**
 * Huvudmåltiderna (frukost, lunch och middag) som saknar en rätt, i ordning: dag för dag med reservdagarna sist,
 * och inom dagen frukost, lunch och middag. Mellanmål är frivilliga och räknas inte. En rad räknas bara på en dag som
 * finns i turen. Samma regel används överallt där saknade måltider visas.
 */
export function saknadeMaltider(dagar: readonly Matdag[], maltider: readonly Pick<Maltidsrad, 'dag' | 'maltid'>[]): Plats[] {
  const har = new Set(maltider.map((m) => `${m.dag}:${m.maltid}`))
  return dagar.flatMap((dag) => HUVUDMALTIDER.filter((maltid) => !har.has(`${dag.dag}:${maltid}`)).map((maltid) => ({ dag, maltid })))
}

export interface Matstatus {
  /** Huvudmåltider i turen: tre per dag, reservdagar inräknade. */
  totalt: number
  /** Huvudmåltider som har minst en rätt. */
  planerade: number
  saknas: number
  /** Den första måltiden som saknas, eller null när planen är klar. */
  forsta: Plats | null
}

/** Hur långt matplanen har kommit, för Mina matplaner och turens flik Mat. */
export function matstatus(dagar: readonly Matdag[], maltider: readonly Pick<Maltidsrad, 'dag' | 'maltid'>[]): Matstatus {
  const saknas = saknadeMaltider(dagar, maltider)
  const totalt = dagar.length * HUVUDMALTIDER.length
  return { totalt, planerade: totalt - saknas.length, saknas: saknas.length, forsta: saknas[0] ?? null }
}

/** Adressen till en måltid på turens flik Mat, till exempel /tur/abc/mat?dag=2&maltid=lunch. */
export function maltidsAdress(turId: string, dag: number, maltid: Maltid): string {
  return `/tur/${turId}/mat?dag=${dag}&maltid=${maltid}`
}

/** Id:t på en måltidsruta på fliken Mat, så att sidan kan skrolla och flytta fokus dit. */
export function maltidsrutaId(dag: number, maltid: Maltid): string {
  return `maltid-${dag}-${maltid}`
}

/**
 * Vad en tur visar om matplanen. En avslutad tur visar bara att planen är klar, aldrig hur många måltider som saknas
 * eller att vandringsdagar saknas, eftersom det inte går att göra något åt längre.
 */
export function matplanstext(status: Matstatus, avslutad: boolean): 'klar' | 'saknas' | 'inga-dagar' | null {
  if (status.totalt === 0) return avslutad ? null : 'inga-dagar'
  if (status.saknas === 0) return 'klar'
  return avslutad ? null : 'saknas'
}

/** "1 måltid saknas" eller "12 måltider saknas". */
export function saknasText(antal: number): string {
  return `${antal} ${antal === 1 ? 'måltid' : 'måltider'} saknas`
}

/** Måltidens namn med liten bokstav, till exempel "lunch". */
export function maltidsord(maltid: Maltid): string {
  return MALTIDER.find((m) => m.nyckel === maltid)!.etikett.toLowerCase()
}

const BESTAMD: Record<Maltid, string> = { frukost: 'frukosten', lunch: 'lunchen', middag: 'middagen', mellanmal: 'mellanmålet' }

/** Var man börjar: "Börja med frukosten fredag 4 december.", eller "dag 2" och "reservdag 1" när datumet saknas. */
export function borjaMed(plats: Plats, datum: string | null): string {
  const nar = !plats.dag.reserv && datum ? datum : plats.dag.namn.toLowerCase()
  return `Börja med ${BESTAMD[plats.maltid]} ${nar}.`
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
  const saknas = saknadeMaltider(
    dagar,
    data.maltider.filter((m) => ratter.has(m.ratt_id)),
  )
  return dagar.map((dag) => {
    const rader = data.maltider.filter((m) => m.dag === dag.dag && ratter.has(m.ratt_id))
    const naring = rader.reduce((s, m) => plus(s, perPortion.get(m.ratt_id)!), NOLL)
    return { dag, naring, saknas: saknas.filter((p) => p.dag.dag === dag.dag).map((p) => p.maltid) }
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
  /** Påsens id i matkatalogen. Bara för påsar. */
  matproduktId?: string
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
    const antal = antalPasar(n, personer, pase.portioner)
    pasar.push({
      typ: 'pase',
      id: ratt.id,
      namn: ratt.namn,
      gram: antal * pase.vikt_torr_g,
      pasar: antal,
      matproduktId: pase.id,
      varifran: 'kopa',
      ansvarig: ratt.ansvarig,
      klart: ratt.klart,
    })
  }

  return [...varor, ...pasar].sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))
}

/** Hela påsar för en rätt som äts ett antal gånger av ett antal personer. */
export function antalPasar(ganger: number, personer: number, portioner: number): number {
  return Math.ceil((ganger * personer) / Math.max(1, portioner))
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

/** En rätt i planen och vem som tar med den. */
export interface Ansvarsratt {
  rattId: string
  namn: string
  typ: 'pase' | 'egen'
  /** Måltiderna rätten ligger i, i ordning. */
  platser: Plats[]
  /** Deltagarna som har ansvar: påsens ansvarig, eller ansvariga för den egna rättens varor. */
  ansvariga: string[]
  /** Något saknar ansvarig: påsen, eller någon av den egna rättens varor. */
  saknarAnsvarig: boolean
  /** Den egna rättens varor utan ansvarig. Det är dem "Jag tar den" sätter. */
  varorUtanAnsvarig: string[]
}

/**
 * Vem som tar med vad: rätterna som ligger i en måltid inom turens dagar, med ansvariga. Samma uppgifter som
 * inköpslistan, så att de två alltid visar samma: en påse har ansvarig på rätten, en egen rätt på varje vara.
 * En egen rätt utan ingredienser har inget att ta med och kommer inte med.
 */
export function vemTarMedVad(data: Pick<Matdata, 'ratter' | 'ingredienser' | 'varor' | 'maltider'>, dagar: readonly Matdag[]): Ansvarsratt[] {
  const ordning = new Map(dagar.map((d, i) => [d.dag, i]))
  const malOrdning = (m: Maltid) => MALTIDER.findIndex((x) => x.nyckel === m)
  const varor = new Map(data.varor.map((v) => [v.id, v]))
  const ut: Ansvarsratt[] = []
  for (const ratt of data.ratter) {
    const platser = rattPlatser(data.maltider, dagar, ratt.id)
    if (platser.length === 0) continue
    if (ratt.matprodukt_id) {
      ut.push({ rattId: ratt.id, namn: ratt.namn, typ: 'pase', platser, ansvariga: ratt.ansvarig ? [ratt.ansvarig] : [], saknarAnsvarig: !ratt.ansvarig, varorUtanAnsvarig: [] })
      continue
    }
    const rattensVaror = [...new Set(data.ingredienser.filter((i) => i.ratt_id === ratt.id).map((i) => i.vara_id))]
      .map((id) => varor.get(id))
      .filter((v): v is Vara => v !== undefined)
    if (rattensVaror.length === 0) continue
    const utan = rattensVaror.filter((v) => !v.ansvarig).map((v) => v.id)
    ut.push({
      rattId: ratt.id,
      namn: ratt.namn,
      typ: 'egen',
      platser,
      ansvariga: [...new Set(rattensVaror.map((v) => v.ansvarig).filter((a): a is string => !!a))],
      saknarAnsvarig: utan.length > 0,
      varorUtanAnsvarig: utan,
    })
  }
  // I den ordning rätterna äts första gången.
  const forst = (r: Ansvarsratt) => ordning.get(r.platser[0].dag.dag)! * 10 + malOrdning(r.platser[0].maltid)
  return ut.sort((a, b) => forst(a) - forst(b) || a.namn.localeCompare(b.namn, 'sv'))
}

/** "Middag dag 1" eller "Lunch reservdag 1". */
export function platsText(p: Plats): string {
  return `${MALTIDER.find((m) => m.nyckel === p.maltid)!.etikett} ${p.dag.namn.toLowerCase()}`
}

/** Måltiderna en rätt ligger i inom turens dagar, i ordning: dag för dag och inom dagen frukost, lunch, middag, mellanmål. */
export function rattPlatser(maltider: readonly Pick<Maltidsrad, 'dag' | 'maltid' | 'ratt_id'>[], dagar: readonly Matdag[], rattId: string): Plats[] {
  const ordning = new Map(dagar.map((d, i) => [d.dag, i]))
  const malOrdning = (m: Maltid) => MALTIDER.findIndex((x) => x.nyckel === m)
  return maltider
    .filter((m) => m.ratt_id === rattId && ordning.has(m.dag))
    .map((m) => ({ dag: dagar[ordning.get(m.dag)!], maltid: m.maltid }))
    .sort((a, b) => ordning.get(a.dag.dag)! - ordning.get(b.dag.dag)! || malOrdning(a.maltid) - malOrdning(b.maltid))
}

/** Frågan när en rätt redan ligger i planen: "Finns redan på lunch dag 1. Lägg till ändå?" null när den inte gör det. */
export function dubblettText(platser: readonly Plats[]): string | null {
  if (platser.length === 0) return null
  const text = platserText(platser)
  return `Finns redan på ${text.charAt(0).toLowerCase()}${text.slice(1)}. Lägg till ändå?`
}

/** Samma måltid flera gånger blir en med antal: lunch dag 1 två gånger blir { lunch dag 1, antal: 2 }. Ordningen behålls. */
export function platserMedAntal(platser: readonly Plats[]): { plats: Plats; antal: number }[] {
  const ut: { plats: Plats; antal: number }[] = []
  for (const p of platser) {
    const finns = ut.find((x) => x.plats.dag.dag === p.dag.dag && x.plats.maltid === p.maltid)
    if (finns) finns.antal++
    else ut.push({ plats: p, antal: 1 })
  }
  return ut
}

/** "Lunch dag 1, mellanmål dag 3 (6 st)": måltiderna med antal när samma rätt ligger flera gånger i samma måltid. */
export function platserText(platser: readonly Plats[]): string {
  return platserMedAntal(platser)
    .map(({ plats, antal }, i) => {
      const text = i === 0 ? platsText(plats) : platsText(plats).toLowerCase()
      return antal > 1 ? `${text} (${antal} st)` : text
    })
    .join(', ')
}

/**
 * Raderna i en måltid med samma rätt flera gånger ihopslagna till en rad med antal, i den ordning rätten kom in
 * första gången. Raderna finns kvar, så att Ta bort kan ta bort en av dem.
 */
export function grupperaMaltid<T extends Pick<Maltidsrad, 'ratt_id'>>(rader: readonly T[]): { rattId: string; rader: T[] }[] {
  const ut: { rattId: string; rader: T[] }[] = []
  for (const r of rader) {
    const finns = ut.find((g) => g.rattId === r.ratt_id)
    if (finns) finns.rader.push(r)
    else ut.push({ rattId: r.ratt_id, rader: [r] })
  }
  return ut
}

/** Gränserna för när en portion verkar orimlig, så att man kontrollerar mängderna. Ingen portion på tur är så stor. */
export const ORIMLIG_PORTION = { kcal: 2000, gram: 1500 } as const

/** Sant när en portion verkar orimlig: mer än 2 000 kcal eller 1,5 kg. Ofta ett skrivfel i gram eller kcal. */
export function orimligPortion(n: Pick<Naring, 'kcal' | 'gram'>): boolean {
  return n.kcal > ORIMLIG_PORTION.kcal || n.gram > ORIMLIG_PORTION.gram
}

export interface Saknade {
  /** Rätter där energin saknas: en vara utan kcal, eller noll kcal. */
  energi: string[]
  /** Rätter där proteinet saknas för någon vara eller påse. */
  protein: string[]
  /** Rätter utan vikt: inga ingredienser med gram. */
  vikt: string[]
}

/**
 * Meningarna om det som saknas, med varje rätt en gång: "Bullens pilsnerkorv saknar energi och protein.
 * Mormors smörgås och Test saknar vikt." Rätter som saknar samma saker står i samma mening.
 */
export function saknasMeningar(s: Saknade): string[] {
  const vad = new Map<string, string[]>()
  for (const [nyckel, ord] of [
    ['vikt', 'vikt'],
    ['energi', 'energi'],
    ['protein', 'protein'],
  ] as const) {
    for (const namn of s[nyckel]) vad.set(namn, [...(vad.get(namn) ?? []), ord])
  }
  const perText = new Map<string, string[]>()
  for (const [namn, saker] of vad) {
    const text = uppraknade(saker)
    perText.set(text, [...(perText.get(text) ?? []), namn])
  }
  return [...perText].map(([text, namn]) => `${uppraknade([...namn].sort((a, b) => a.localeCompare(b, 'sv')))} saknar ${text}.`)
}

/** Vilka rätter i planen (inom turens dagar) som saknar energi, protein eller vikt, i bokstavsordning. */
export function ratterSomSaknar(data: Matdata, dagar: readonly Matdag[]): Saknade {
  const anvanda = new Set(inomTuren(data, dagar).map((m) => m.ratt_id))
  const varor = new Map(data.varor.map((v) => [v.id, v]))
  const ut: Saknade = { energi: [], protein: [], vikt: [] }
  for (const ratt of data.ratter) {
    if (!anvanda.has(ratt.id)) continue
    const portion = rattPerPortion(ratt, data)
    if (ratt.matprodukt_id) {
      const pase = data.pasar.get(ratt.matprodukt_id)
      if (!pase) ut.energi.push(ratt.namn)
      else if (pase.protein_g === null) ut.protein.push(ratt.namn)
      continue
    }
    const rattensVaror = data.ingredienser.filter((i) => i.ratt_id === ratt.id).map((i) => varor.get(i.vara_id))
    if (portion.gram <= 0) ut.vikt.push(ratt.namn)
    if (portion.kcal <= 0 || rattensVaror.some((v) => v?.kcal_per_100g == null)) ut.energi.push(ratt.namn)
    if (rattensVaror.some((v) => v?.protein_per_100g == null)) ut.protein.push(ratt.namn)
  }
  const ordning = (a: string, b: string) => a.localeCompare(b, 'sv')
  return { energi: ut.energi.sort(ordning), protein: ut.protein.sort(ordning), vikt: ut.vikt.sort(ordning) }
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

/** Vilka slags påsar i katalogen som visas först för en måltid i planen. */
export const PASAR_TILL: Record<Maltid, readonly Katalogmaltid[]> = {
  frukost: ['frukost'],
  lunch: ['lunch_middag'],
  middag: ['lunch_middag', 'dessert'],
  mellanmal: ['mellanmal', 'dessert'],
}

/** Namnet på en påse som det visas och som rätten i turen heter: märke och namn. */
export function pasnamn(p: Pick<Matprodukt, 'marke' | 'namn'>): string {
  return `${p.marke} ${p.namn}`
}

export const TILLAGNING: Record<NonNullable<Matprodukt['tillagning_vatten']>, string> = {
  varmt: 'Varmt vatten',
  kallt: 'Kallt vatten',
  varmt_eller_kallt: 'Varmt eller kallt vatten',
  inget: 'Inget vatten',
}

/** Detaljerna om en påse som visas i listan: torkning, tillagning, allergener och spår. */
export function pasdetaljer(p: Matprodukt): string[] {
  const ut: string[] = []
  if (p.torkning) ut.push(p.torkning === 'frystorkad' ? 'Frystorkad' : 'Lufttorkad')
  if (p.tillagning_vatten) {
    const delar = [TILLAGNING[p.tillagning_vatten]]
    if (p.vatten_ml && p.tillagning_vatten !== 'inget') delar.push(`${p.vatten_ml} ml`)
    if (p.tillagning_min) delar.push(`${p.tillagning_min} min`)
    ut.push(delar.join(', '))
  }
  if (p.allergener === null) ut.push('Allergenerna är okända')
  else if (p.allergener.length === 0) ut.push('Ingen av de 14 allergenerna')
  else ut.push(`Innehåller ${uppraknade(p.allergener.map((a) => allergenetikett(a).toLowerCase()))}`)
  if (p.spar?.length) ut.push(`Kan innehålla spår av ${uppraknade(p.spar.map((a) => allergenetikett(a).toLowerCase()))}`)
  return ut
}

/** Ett tal från ett formulärfält. Komma och punkt går båda. Tomt blir null, och det som inte är ett tal NaN. */
export function tolkaTal(text: string): number | null {
  const t = text.trim().replace(/\s/g, '').replace(',', '.')
  if (t === '') return null
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN
}

/** En rad i formuläret för en egen rätt, som den står i fälten. */
export interface Ingrediensfalt {
  vara: string
  gram: string
  kcal: string
  protein: string
}

export interface TolkadIngrediens {
  vara: string
  gram: number
  kcalPer100g: number | null
  proteinPer100g: number | null
}

export type Rattformular = { ok: true; namn: string; rader: TolkadIngrediens[] } | { ok: false; fel: string }

export const MAX_RATTNAMN = 80
/** Samma gräns som receptrader.vara i databasen, så att en egen rätt alltid går att spara som recept. */
export const MAX_VARUNAMN = 80

/** Kontrollerar formuläret för en egen rätt. Helt tomma rader hoppas över. */
export function tolkaRattformular(namn: string, falt: readonly Ingrediensfalt[]): Rattformular {
  const n = namn.trim()
  if (!n) return { ok: false, fel: 'Skriv vad rätten heter.' }
  if (n.length > MAX_RATTNAMN) return { ok: false, fel: `Namnet får vara högst ${MAX_RATTNAMN} tecken.` }
  const rader: TolkadIngrediens[] = []
  const varor = new Set<string>()
  for (const [i, f] of falt.entries()) {
    if (!f.vara.trim() && !f.gram.trim() && !f.kcal.trim() && !f.protein.trim()) continue
    const rad = `Ingrediens ${i + 1}`
    const vara = f.vara.trim()
    if (!vara) return { ok: false, fel: `${rad}: skriv vad ingrediensen heter.` }
    if (vara.length > MAX_VARUNAMN) return { ok: false, fel: `${rad}: namnet får vara högst ${MAX_VARUNAMN} tecken.` }
    if (varor.has(vara.toLowerCase())) return { ok: false, fel: `${vara} står två gånger. Lägg ihop mängden på en rad.` }
    varor.add(vara.toLowerCase())
    const gram = tolkaTal(f.gram)
    if (gram === null || !Number.isInteger(gram) || gram < 1 || gram > 5000)
      return { ok: false, fel: `${rad}: skriv gram per portion som ett heltal mellan 1 och 5000.` }
    const kcal = tolkaTal(f.kcal)
    if (kcal !== null && !(kcal <= 900)) return { ok: false, fel: `${rad}: skriv kcal per 100 g som ett tal mellan 0 och 900.` }
    const protein = tolkaTal(f.protein)
    if (protein !== null && !(protein <= 100)) return { ok: false, fel: `${rad}: skriv protein per 100 g som ett tal mellan 0 och 100.` }
    rader.push({ vara, gram, kcalPer100g: kcal === null ? null : Math.round(kcal), proteinPer100g: protein })
  }
  if (rader.length === 0) return { ok: false, fel: 'Lägg till minst en ingrediens.' }
  return { ok: true, namn: n, rader }
}

/** Ingredienserna som de skickas till spara_egen_ratt och spara_recept i databasen. */
export function ingredienserTillDatabasen(rader: readonly TolkadIngrediens[]): { vara: string; gram: number; kcal: number | null; protein: number | null }[] {
  return rader.map((r) => ({ vara: r.vara.trim(), gram: r.gram, kcal: r.kcalPer100g, protein: r.proteinPer100g }))
}

/** En portion av rätten i formuläret, för att visa medan man skriver. */
export function naringForRader(rader: readonly TolkadIngrediens[]): Naring {
  return rader.reduce<Naring>(
    (s, r) =>
      plus(s, {
        kcal: ((r.kcalPer100g ?? 0) * r.gram) / 100,
        proteinG: ((r.proteinPer100g ?? 0) * r.gram) / 100,
        gram: r.gram,
        ofullstandig: r.kcalPer100g === null || r.proteinPer100g === null,
      }),
    NOLL,
  )
}
