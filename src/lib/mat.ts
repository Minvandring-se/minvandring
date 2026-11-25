// Matplanen: dagar, energi och vikt per portion och dag, och inköpslistan. Rena funktioner utan databas.
//
// Varje person äter en portion av varje rad hen äter (maltid_atare, inga rader betyder alla). Hundar äter egen mat,
// som räknas i vikt.ts (hundmat_per_dag_g).
import { allergenetikett, uppraknade } from './kost'
import { formateraVikt } from './forrad'
import { arEnhet, type Enhet } from './handla'
import type { Ingrediens, Katalogmaltid, Maltid, Maltidsrad, Matatare, Matprodukt, Ratt, Vara } from './typer'

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

/** En portion i listorna: "423 kcal per portion, 120 g", eller att energin saknas i stället för 0 kcal. */
export function portionText(n: Pick<Naring, 'kcal' | 'gram'>): string {
  if (n.kcal > 0) return `${formateraKcal(n.kcal)} per portion, ${formateraVikt(n.gram)}`
  return n.gram > 0 ? `Energi saknas, ${formateraVikt(n.gram)}` : 'Energi och vikt saknas'
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

export type Pase = Pick<Matprodukt, 'id' | 'vikt_torr_g' | 'portioner' | 'kcal' | 'protein_g'> & Partial<Pick<Matprodukt, 'marke' | 'namn'>>

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
  /** Vem som äter raderna. Saknas eller tom: alla äter allt. */
  atare?: readonly Matatare[]
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
    // Utan vikt går energin inte att räkna, och summan blir ofullständig.
    const g = ing.gram_per_portion ?? 0
    summa = plus(summa, {
      kcal: ((vara?.kcal_per_100g ?? 0) * g) / 100,
      proteinG: ((vara?.protein_per_100g ?? 0) * g) / 100,
      gram: g,
      ofullstandig: ing.gram_per_portion === null || vara?.kcal_per_100g == null || vara?.protein_per_100g == null,
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
  /** Varje persons energi, protein och vikt den dagen: en portion av varje rad personen äter. */
  perPerson: Map<string, Naring>
  /** Snittet för personerna. */
  naring: Naring
  /** Huvudmåltider utan någon rätt. */
  saknas: Maltid[]
}

/** Nyckeln när turen saknar personer: då räknas dagen som för en person som äter allt. */
const ALLA = ''

/**
 * Energi, protein och vikt per person för varje dag, efter vem som äter raderna (maltid_atare), och vilka
 * huvudmåltider som saknas. En rad utan ätare äts av alla.
 */
export function dagssummor(data: Matdata, dagar: readonly Matdag[], personer: readonly string[]): Dagssumma[] {
  const folk = personer.length > 0 ? personer : [ALLA]
  const ratter = new Map(data.ratter.map((r) => [r.id, r]))
  const perPortion = new Map(data.ratter.map((r) => [r.id, rattPerPortion(r, data)]))
  const saknas = saknadeMaltider(
    dagar,
    data.maltider.filter((m) => ratter.has(m.ratt_id)),
  )
  return dagar.map((dag) => {
    const perPerson = new Map(folk.map((p) => [p, NOLL]))
    for (const m of data.maltider) {
      if (m.dag !== dag.dag || !ratter.has(m.ratt_id)) continue
      for (const p of atareFor(m.id, data.atare, folk)) {
        const forut = perPerson.get(p)
        if (forut) perPerson.set(p, plus(forut, perPortion.get(m.ratt_id)!))
      }
    }
    return { dag, perPerson, naring: snitt([...perPerson.values()]), saknas: saknas.filter((p) => p.dag.dag === dag.dag).map((p) => p.maltid) }
  })
}

function snitt(lista: readonly Naring[]): Naring {
  if (lista.length === 0) return NOLL
  const summa = lista.reduce((s, n) => plus(s, n), NOLL)
  return { kcal: summa.kcal / lista.length, proteinG: summa.proteinG / lista.length, gram: summa.gram / lista.length, ofullstandig: summa.ofullstandig }
}

/**
 * Ett värde, eller ett spann när det lägsta och högsta skiljer sig som de visas: "700 kcal", "423–700 kcal" eller
 * "640 g–1,2 kg". Enheten skrivs en gång när båda har samma.
 */
function spann(varden: readonly number[], text: (n: number) => string): string {
  const min = text(Math.min(...varden))
  const max = text(Math.max(...varden))
  if (min === max) return max
  const enhet = (t: string) => t.slice(t.lastIndexOf(' '))
  return enhet(min) === enhet(max) ? `${min.slice(0, min.lastIndexOf(' '))}–${max}` : `${min}–${max}`
}

/**
 * Dagens rad under rubriken: "1 250 kcal och 1,1 kg per person", eller ett spann när personerna äter olika mycket:
 * "423–700 kcal och 120–150 g per person". null en dag utan mat.
 */
export function dagensText(summa: Pick<Dagssumma, 'perPerson'>): string | null {
  const varden = [...summa.perPerson.values()]
  if (!varden.some((n) => n.gram > 0)) return null
  return `${spann(
    varden.map((n) => n.kcal),
    formateraKcal,
  )} och ${spann(
    varden.map((n) => n.gram),
    formateraVikt,
  )} per person`
}

/** Hela påsar för en rätt som äts ett antal gånger av ett antal personer. */
export function antalPasar(ganger: number, personer: number, portioner: number): number {
  return Math.ceil((ganger * personer) / Math.max(1, portioner))
}

/** De som äter en rad i matplanen: raderna i maltid_atare, eller alla personer när det inte finns några. */
export function atareFor(maltidId: string, atare: readonly Matatare[] | undefined, personer: readonly string[]): string[] {
  const egna = (atare ?? []).filter((a) => a.maltid_id === maltidId).map((a) => a.deltagare_id)
  return egna.length > 0 ? egna : [...personer]
}

/** En rätt som samma deltagare bär, eller som ingen bär, med måltiderna i ordning. */
export interface Barrad {
  /** Rättens id och bäraren, så att samma rätt med två bärare blir två rader. */
  nyckel: string
  rattId: string
  namn: string
  typ: 'pase' | 'egen'
  barsAv: string | null
  /** Raderna i maltider, i samma ordning som platserna. */
  maltidIds: string[]
  platser: Plats[]
}

/**
 * Vem bär vad: varje rad i matplanen inom turens dagar, ihopslagen per rätt och bärare. En egen rätt utan
 * ingredienser har inget att bära och kommer inte med. Ordningen är den ordning rätterna äts första gången.
 */
export function vemBarVad(data: Pick<Matdata, 'ratter' | 'ingredienser' | 'maltider'>, dagar: readonly Matdag[]): Barrad[] {
  const ordning = new Map(dagar.map((d, i) => [d.dag, i]))
  const malOrdning = (m: Maltid) => MALTIDER.findIndex((x) => x.nyckel === m)
  const ratter = new Map(data.ratter.map((r) => [r.id, r]))
  const rader = data.maltider
    .filter((m) => ordning.has(m.dag))
    .sort((a, b) => ordning.get(a.dag)! - ordning.get(b.dag)! || malOrdning(a.maltid) - malOrdning(b.maltid))
  const ut = new Map<string, Barrad>()
  for (const m of rader) {
    const ratt = ratter.get(m.ratt_id)
    if (!ratt) continue
    const barsAv = m.bars_av ?? null
    const nyckel = `${ratt.id}:${barsAv ?? ''}`
    const rad = ut.get(nyckel) ?? { nyckel, rattId: ratt.id, namn: ratt.namn, typ: ratt.matprodukt_id ? 'pase' : 'egen', barsAv, maltidIds: [], platser: [] }
    rad.maltidIds.push(m.id)
    rad.platser.push({ dag: dagar[ordning.get(m.dag)!], maltid: m.maltid })
    ut.set(nyckel, rad)
  }
  return [...ut.values()]
}

/**
 * Huvudmåltiderna varje person saknar: frukost, lunch och middag där ingen rad är till personen. En rad utan ätare
 * är till alla. Personer utan något som saknas kommer inte med.
 */
export function saknasPerPerson(data: Pick<Matdata, 'maltider' | 'atare'>, dagar: readonly Matdag[], personer: readonly string[]): Map<string, Plats[]> {
  const har = new Set<string>()
  for (const m of data.maltider) for (const p of atareFor(m.id, data.atare, personer)) har.add(`${p}:${m.dag}:${m.maltid}`)
  const ut = new Map<string, Plats[]>()
  for (const p of personer) {
    const saknas = dagar.flatMap((dag) => HUVUDMALTIDER.filter((maltid) => !har.has(`${p}:${dag.dag}:${maltid}`)).map((maltid) => ({ dag, maltid })))
    if (saknas.length > 0) ut.set(p, saknas)
  }
  return ut
}

/** Portionerna en deltagare bär av en rätt inom turens dagar: antalet som äter, för varje rad hen bär. */
export function portionerSomBars(data: Pick<Matdata, 'maltider' | 'atare'>, dagar: readonly Matdag[], personer: readonly string[], barare: string, rattId: string): number {
  const finns = new Set(dagar.map((d) => d.dag))
  return data.maltider
    .filter((m) => m.bars_av === barare && m.ratt_id === rattId && finns.has(m.dag))
    .reduce((s, m) => s + atareFor(m.id, data.atare, personer).length, 0)
}

/**
 * Fördelar raderna som ingen bär så att vikten blir så jämn som möjligt: den tyngsta raden först, till den som bär
 * minst just då. Vid lika vikt går raden till den som står först. Svarar med bäraren för varje rad.
 */
export function fordela(rader: readonly { id: string; gram: number }[], personer: readonly string[], redan: ReadonlyMap<string, number>): Map<string, string> {
  const ut = new Map<string, string>()
  if (personer.length === 0) return ut
  const last = new Map(personer.map((p) => [p, redan.get(p) ?? 0]))
  for (const r of [...rader].sort((a, b) => b.gram - a.gram)) {
    const minst = personer.reduce((a, b) => (last.get(b)! < last.get(a)! ? b : a))
    ut.set(r.id, minst)
    last.set(minst, last.get(minst)! + r.gram)
  }
  return ut
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
export function grupperaMaltid<T extends Pick<Maltidsrad, 'ratt_id' | 'bars_av'>>(rader: readonly T[], extra: (r: T) => string = () => ''): { rattId: string; rader: T[] }[] {
  const ut: { rattId: string; nyckel: string; rader: T[] }[] = []
  for (const r of rader) {
    // Samma rätt med olika bärare eller olika ätare blir egna rader.
    const nyckel = `${r.ratt_id}:${r.bars_av ?? ''}:${extra(r)}`
    const finns = ut.find((g) => g.nyckel === nyckel)
    if (finns) finns.rader.push(r)
    else ut.push({ rattId: r.ratt_id, nyckel, rader: [r] })
  }
  return ut.map(({ rattId, rader }) => ({ rattId, rader }))
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
    const rattens = data.ingredienser.filter((i) => i.ratt_id === ratt.id)
    const rattensVaror = rattens.map((i) => varor.get(i.vara_id))
    if (portion.gram <= 0 || rattens.some((i) => i.gram_per_portion === null)) ut.vikt.push(ratt.namn)
    if (portion.kcal <= 0 || rattensVaror.some((v) => v?.kcal_per_100g == null)) ut.energi.push(ratt.namn)
    if (rattensVaror.some((v) => v?.protein_per_100g == null)) ut.protein.push(ratt.namn)
  }
  const ordning = (a: string, b: string) => a.localeCompare(b, 'sv')
  return { energi: ut.energi.sort(ordning), protein: ut.protein.sort(ordning), vikt: ut.vikt.sort(ordning) }
}

export interface Matsummering {
  /** Snittet per person och dag, för dagar som har någon mat. */
  snittKcal: number
  /**
   * Den person och dag som får minst energi, bland dagar med mat. olika är sant när personerna den dagen äter olika
   * mycket, så att det är värt att visa vem. null utan mat.
   */
  lagsta: { kcal: number; person: string; dag: Matdag; olika: boolean } | null
  snittProteinG: number
  saknadeMaltider: number
  ofullstandig: boolean
}

/** Översikten i matplanen. Snittet och den lägsta dagen räknas per person, efter vem som äter raderna. */
export function matsummering(summor: readonly Dagssumma[]): Matsummering {
  const medMat = summor.filter((s) => [...s.perPerson.values()].some((n) => n.gram > 0))
  const varden = medMat.flatMap((s) => [...s.perPerson.values()])
  const medel = (f: (n: Naring) => number) => (varden.length ? varden.reduce((t, n) => t + f(n), 0) / varden.length : 0)
  let lagsta: Matsummering['lagsta'] = null
  for (const s of medMat) {
    const kcal = [...s.perPerson.values()].map((n) => Math.round(n.kcal))
    const olika = Math.min(...kcal) < Math.max(...kcal)
    for (const [person, n] of s.perPerson) if (!lagsta || n.kcal < lagsta.kcal) lagsta = { kcal: n.kcal, person, dag: s.dag, olika }
  }
  return {
    snittKcal: medel((n) => n.kcal),
    lagsta,
    snittProteinG: medel((n) => n.proteinG),
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

/**
 * Passar påsen det man har skrivit? Varje ord måste finnas i märket, namnet eller ett av de andra namnen, utan hänsyn
 * till stora och små bokstäver. "viltgryta" hittar Real Turmat Reindeer Stew, som också heter Viltgryta.
 */
export function paseMatchar(p: Pick<Matprodukt, 'marke' | 'namn'> & { andra_namn?: readonly string[] }, sok: string): boolean {
  const ord = sok.toLowerCase().split(/\s+/).filter(Boolean)
  const text = [pasnamn(p), ...(p.andra_namn ?? [])].join(' ').toLowerCase()
  return ord.every((o) => text.includes(o))
}

/** Det andra namnet som visas under påsens namn, till exempel "Viltgryta". null när påsen inte har något. */
export function forstaAndraNamn(p: { andra_namn?: readonly string[] }): string | null {
  return p.andra_namn?.[0] ?? null
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
  mangd: string
  /** En av ENHETER i handla.ts. */
  enhet: string
  /** Vikten per portion, för energin. Används inte för g och kg, där mängden är vikten. */
  gram: string
  kcal: string
  protein: string
}

export interface TolkadIngrediens {
  vara: string
  /** Mängd och enhet per portion. Tomma för det som bara ska med, till exempel salt. */
  mangd: number | null
  enhet: Enhet | null
  /** Vikten per portion. Räknas ut för g och kg, och är frivillig för övriga enheter. */
  gram: number | null
  kcalPer100g: number | null
  proteinPer100g: number | null
}

/** Vikten för en mängd i g eller kg. null för övriga enheter, där vikten skrivs för sig. */
export function gramFor(mangd: number | null, enhet: Enhet | null): number | null {
  if (mangd === null || enhet === null) return null
  if (enhet === 'g') return Math.round(mangd)
  if (enhet === 'kg') return Math.round(mangd * 1000)
  return null
}

export type Rattformular = { ok: true; namn: string; rader: TolkadIngrediens[] } | { ok: false; fel: string }

export const MAX_RATTNAMN = 80
/** Samma gräns som receptrader.vara i databasen, så att en egen rätt alltid går att spara som recept. */
export const MAX_VARUNAMN = 80

/** Kontrollerar formuläret för en egen rätt. Helt tomma rader hoppas över, och en rätt får sakna ingredienser. */
export function tolkaRattformular(namn: string, falt: readonly Ingrediensfalt[]): Rattformular {
  const n = namn.trim()
  if (!n) return { ok: false, fel: 'Skriv vad rätten heter.' }
  if (n.length > MAX_RATTNAMN) return { ok: false, fel: `Namnet får vara högst ${MAX_RATTNAMN} tecken.` }
  const rader: TolkadIngrediens[] = []
  const varor = new Set<string>()
  for (const [i, f] of falt.entries()) {
    if (!f.vara.trim() && !f.mangd.trim() && !f.gram.trim() && !f.kcal.trim() && !f.protein.trim()) continue
    const rad = `Ingrediens ${i + 1}`
    const vara = f.vara.trim()
    if (!vara) return { ok: false, fel: `${rad}: skriv vad ingrediensen heter.` }
    if (vara.length > MAX_VARUNAMN) return { ok: false, fel: `${rad}: namnet får vara högst ${MAX_VARUNAMN} tecken.` }
    if (varor.has(vara.toLowerCase())) return { ok: false, fel: `${vara} står två gånger. Lägg ihop mängden på en rad.` }
    varor.add(vara.toLowerCase())
    const tal = tolkaTal(f.mangd)
    if (tal !== null && !(tal > 0 && tal <= 10000)) return { ok: false, fel: `${rad}: skriv mängden som ett tal mellan 0,01 och 10 000.` }
    // Mängden sparas med två decimaler, så vikten räknas från den avrundade mängden.
    const mangd = tal === null ? null : Math.round(tal * 100) / 100
    if (mangd === 0) return { ok: false, fel: `${rad}: mängden är för liten.` }
    const enhet = mangd === null ? null : arEnhet(f.enhet) ? f.enhet : null
    if (mangd !== null && enhet === null) return { ok: false, fel: `${rad}: välj en enhet.` }
    const skriven = enhet === 'g' || enhet === 'kg' ? null : tolkaTal(f.gram)
    if (skriven !== null && !(Number.isInteger(skriven) && skriven >= 1 && skriven <= 5000))
      return { ok: false, fel: `${rad}: skriv vikten som ett heltal mellan 1 och 5000 gram.` }
    const gram = gramFor(mangd, enhet) ?? skriven
    if (gram !== null && (gram < 1 || gram > 5000)) return { ok: false, fel: `${rad}: mängden ska vara mellan 1 g och 5 kg per portion.` }
    const kcal = tolkaTal(f.kcal)
    if (kcal !== null && !(kcal <= 900)) return { ok: false, fel: `${rad}: skriv kcal per 100 g som ett tal mellan 0 och 900.` }
    const protein = tolkaTal(f.protein)
    if (protein !== null && !(protein <= 100)) return { ok: false, fel: `${rad}: skriv protein per 100 g som ett tal mellan 0 och 100.` }
    rader.push({ vara, mangd, enhet, gram, kcalPer100g: kcal === null ? null : Math.round(kcal), proteinPer100g: protein })
  }
  return { ok: true, namn: n, rader }
}

/** Ingredienserna som de skickas till spara_egen_ratt och spara_recept i databasen. */
export function ingredienserTillDatabasen(
  rader: readonly TolkadIngrediens[],
): { vara: string; mangd: number | null; enhet: Enhet | null; gram: number | null; kcal: number | null; protein: number | null }[] {
  return rader.map((r) => ({ vara: r.vara.trim(), mangd: r.mangd, enhet: r.enhet, gram: r.gram, kcal: r.kcalPer100g, protein: r.proteinPer100g }))
}

/** En portion av rätten i formuläret, för att visa medan man skriver. */
export function naringForRader(rader: readonly TolkadIngrediens[]): Naring {
  return rader.reduce<Naring>(
    (s, r) =>
      plus(s, {
        kcal: ((r.kcalPer100g ?? 0) * (r.gram ?? 0)) / 100,
        proteinG: ((r.proteinPer100g ?? 0) * (r.gram ?? 0)) / 100,
        gram: r.gram ?? 0,
        ofullstandig: r.gram === null || r.kcalPer100g === null || r.proteinPer100g === null,
      }),
    NOLL,
  )
}
