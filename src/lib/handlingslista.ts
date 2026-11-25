// Handlingslistan: det som ska köpas, per vara och person. Var och en köper det hen bär (maltider.bars_av).
// Rena funktioner utan databas.
import { arAvdelning, AVDELNINGAR, avdelningFor, type Avdelning, type Enhet } from './handla'
import { uppraknade } from './kost'
import { antalPasar, atareFor, type Matdag, type Matdata } from './mat'
import type { InkopKlart } from './typer'
import { matvikter, type Deltagare } from './vikt'

// ─── Mängder ─────────────────────────────────────────────────────────────────

export interface Mangd {
  mangd: number
  enhet: Enhet
}

/** Ett tal som det skrivs i appen: högst två decimaler, med komma. */
function tal(n: number): string {
  return String(Math.round(n * 100) / 100).replace('.', ',')
}

/**
 * Mängderna för en vara ihopslagna. Vikt räknas om mellan g och kg och volym mellan ml, dl och l. Msk, tsk, krm
 * och st lämnas som de är, eftersom de inte går att räkna om utan att veta vad det är. Till exempel "1,2 kg",
 * "6 dl och 2 msk" eller "4 st".
 */
export function summeraMangder(lista: readonly Mangd[]): string {
  let gram = 0
  let ml = 0
  const ovriga = new Map<Enhet, number>()
  for (const { mangd, enhet } of lista) {
    if (enhet === 'g') gram += mangd
    else if (enhet === 'kg') gram += mangd * 1000
    else if (enhet === 'ml') ml += mangd
    else if (enhet === 'dl') ml += mangd * 100
    else ovriga.set(enhet, (ovriga.get(enhet) ?? 0) + mangd)
  }
  const delar: string[] = []
  // Mängden avrundas innan enheten väljs, så att 999,6 g blir 1 kg och inte 1000 g. Det som är mindre än det som går
  // att visa blir den minsta mängden, aldrig 0.
  if (gram > 0) {
    const g = Math.round(gram)
    delar.push(g >= 1000 ? `${tal(gram / 1000)} kg` : `${Math.max(1, g)} g`)
  }
  if (ml > 0) {
    const m = Math.round(ml * 100) / 100
    delar.push(m >= 1000 ? `${tal(m / 1000)} l` : m >= 100 ? `${tal(m / 100)} dl` : `${tal(Math.max(0.01, m))} ml`)
  }
  for (const enhet of ['st', 'msk', 'tsk', 'krm'] as const) {
    const n = ovriga.get(enhet)
    if (n) delar.push(`${tal(Math.max(0.01, n))} ${enhet}`)
  }
  return uppraknade(delar)
}

// ─── Raderna ─────────────────────────────────────────────────────────────────

/** En rad i handlingslistan: en vara eller en påse som en person köper, eller som ingen köper än. */
export interface Handlarad {
  /** Köparen, typen och varans eller rättens id. Unik i listan. */
  nyckel: string
  typ: 'vara' | 'pase'
  /** Varans id, eller rättens id för en påse. Det är dem bockarna i inkop_klart pekar på. */
  id: string
  namn: string
  /** Deltagaren som köper, eller null när ingen bär rätterna än. */
  kopare: string | null
  avdelning: Avdelning
  /** Avdelningen är vald för varan. Annars är den gissad utifrån namnet. */
  avdelningVald: boolean
  /** Mängden som den visas, till exempel "6 dl och 2 msk" eller "3 påsar". Tom när ingen mängd är angiven. */
  mangd: string
  /** Vikten i gram, när den är känd. */
  gram: number
  /** Antal påsar. Bara för påsar. */
  pasar?: number
  /** Påsens id i matkatalogen. Bara för påsar, för det man har hemma. */
  matproduktId?: string
  /** Påsens märke och namn, så att listan kan visa dem på två rader. Bara för påsar. */
  pase?: { marke: string; namn: string }
  /** Varan tas hemifrån i stället för att köpas. */
  hemifran: boolean
  /** Köparen har bockat av den, och mängden är densamma som då. Aldrig för det som ingen köper. */
  klart: boolean
  /** Mängden när raden bockades av, när den har ändrats sedan dess. Då är raden inte avbockad. */
  andradFran: string | null
}

interface Samling {
  typ: 'vara' | 'pase'
  id: string
  kopare: string | null
  mangder: Mangd[]
  gram: number
  portioner: number
}

/**
 * Handlingslistan för turen. Varje rad i matplanen inom turens dagar köps av den som bär den, i så många portioner
 * som det är personer som äter den. Samma vara hos samma köpare blir en rad, med mängderna ihopslagna. Det som ingen
 * bär hamnar hos ingen (köpare null). Extra mängd på en vara (till exempel kaffe) köps av varans ansvariga.
 */
export function handlingslista(data: Matdata & { klart: readonly InkopKlart[] }, dagar: readonly Matdag[], personer: readonly string[]): Handlarad[] {
  const finns = new Set(dagar.map((d) => d.dag))
  const ratter = new Map(data.ratter.map((r) => [r.id, r]))
  const varor = new Map(data.varor.map((v) => [v.id, v]))
  const samlingar = new Map<string, Samling>()
  const samling = (typ: Samling['typ'], id: string, kopare: string | null) => {
    const nyckel = `${kopare ?? ''}:${typ}:${id}`
    const s = samlingar.get(nyckel) ?? { typ, id, kopare, mangder: [], gram: 0, portioner: 0 }
    samlingar.set(nyckel, s)
    return s
  }

  for (const m of data.maltider) {
    const ratt = ratter.get(m.ratt_id)
    if (!ratt || !finns.has(m.dag)) continue
    const n = atareFor(m.id, data.atare, personer).length
    if (n === 0) continue
    const kopare = m.bars_av ?? null
    if (ratt.matprodukt_id) {
      samling('pase', ratt.id, kopare).portioner += n
      continue
    }
    for (const ing of data.ingredienser) {
      if (ing.ratt_id !== ratt.id || !varor.has(ing.vara_id)) continue
      const s = samling('vara', ing.vara_id, kopare)
      if (ing.mangd !== null && ing.enhet !== null) s.mangder.push({ mangd: ing.mangd * n, enhet: ing.enhet })
      else if (ing.gram_per_portion !== null) s.mangder.push({ mangd: ing.gram_per_portion * n, enhet: 'g' })
      s.gram += (ing.gram_per_portion ?? 0) * n
    }
  }
  for (const v of data.varor) {
    if (v.extra_g <= 0) continue
    const s = samling('vara', v.id, v.ansvarig && personer.includes(v.ansvarig) ? v.ansvarig : null)
    s.mangder.push({ mangd: v.extra_g, enhet: 'g' })
    s.gram += v.extra_g
  }

  // Bockarna med mängden som bockades av. En bock utan sparad mängd (från före migreringen inkop_klart_mangd) gäller
  // vilken mängd som helst.
  const klart = new Map(data.klart.map((k) => [`${k.deltagare_id}:${k.vara_id ? 'vara' : 'pase'}:${k.vara_id ?? k.ratt_id}`, k.mangd ?? null]))
  const ut: Handlarad[] = []
  for (const [nyckel, s] of samlingar) {
    const bock = s.kopare !== null && klart.has(nyckel) ? { mangd: klart.get(nyckel) ?? null } : null
    /** Avbockad när mängden är densamma som när raden bockades av. Annars mängden då. */
    const status = (mangd: string) => ({
      klart: bock !== null && (bock.mangd === null || bock.mangd === mangd),
      andradFran: bock !== null && bock.mangd !== null && bock.mangd !== mangd ? bock.mangd : null,
    })
    if (s.typ === 'pase') {
      const ratt = ratter.get(s.id)!
      const pase = ratt.matprodukt_id ? data.pasar.get(ratt.matprodukt_id) : undefined
      if (!pase) continue
      const pasar = antalPasar(s.portioner, 1, pase.portioner)
      const mangd = pasar === 1 ? '1 påse' : `${pasar} påsar`
      ut.push({
        nyckel,
        typ: 'pase',
        id: s.id,
        namn: ratt.namn,
        kopare: s.kopare,
        avdelning: 'friluft',
        avdelningVald: false,
        mangd,
        gram: pasar * pase.vikt_torr_g,
        pasar,
        matproduktId: pase.id,
        pase: pase.marke && pase.namn ? { marke: pase.marke, namn: pase.namn } : undefined,
        hemifran: false,
        ...status(mangd),
      })
      continue
    }
    const vara = varor.get(s.id)!
    const mangd = summeraMangder(s.mangder)
    ut.push({
      nyckel,
      typ: 'vara',
      id: s.id,
      namn: vara.namn,
      kopare: s.kopare,
      avdelning: avdelningFor(vara.namn, vara.avdelning),
      avdelningVald: !!vara.avdelning && arAvdelning(vara.avdelning),
      mangd,
      gram: s.gram,
      hemifran: vara.varifran === 'hemifran',
      ...status(mangd),
    })
  }
  return ut
}

export interface Handlagrupp {
  /** Deltagaren, eller null för det som ingen köper än. */
  kopare: string | null
  avdelningar: { avdelning: Avdelning; rader: Handlarad[] }[]
}

/**
 * Raderna grupperade per köpare i deltagarnas ordning, med det som ingen köper sist, och inom köparen per avdelning
 * i butikens ordning och varorna i bokstavsordning. En köpare som inte längre är med i turen hamnar före ingen.
 */
export function handlagrupper(rader: readonly Handlarad[], ordning: readonly string[]): Handlagrupp[] {
  const kopare = [...ordning]
  for (const r of rader) if (r.kopare !== null && !kopare.includes(r.kopare)) kopare.push(r.kopare)
  return [...kopare, null]
    .map((k) => {
      const egna = rader.filter((r) => r.kopare === k)
      const avdelningar = AVDELNINGAR.map(({ nyckel }) => ({
        avdelning: nyckel as Avdelning,
        rader: egna.filter((r) => r.avdelning === nyckel).sort((a, b) => a.namn.localeCompare(b.namn, 'sv')),
      })).filter((a) => a.rader.length > 0)
      return { kopare: k, avdelningar }
    })
    .filter((g) => g.avdelningar.length > 0)
}

// ─── Matvikten ───────────────────────────────────────────────────────────────

export interface Matvikt {
  /** Det varje deltagare bär, i gram. Samma som det hen köper: hela påsar och varornas vikt. */
  perBarare: Map<string, number>
  /** Det som ingen bär än, i gram. */
  inteFordelat: number
  /** All mat till personerna, i gram. Hundarnas egen mat räknas inte. */
  totalt: number
}

/**
 * Matvikten per bärare, räknad på samma sätt som handlingslistan: var och en bär det hen köper, i hela påsar och
 * i så många portioner som det är personer som äter. Det som ingen bär står för sig. Varor utan vikt väger noll.
 */
export function matviktPerBarare(data: Matdata, dagar: readonly Matdag[], personer: readonly string[]): Matvikt {
  const perBarare = new Map<string, number>()
  let inteFordelat = 0
  for (const r of handlingslista({ ...data, klart: [] }, dagar, personer)) {
    if (r.gram <= 0) continue
    if (r.kopare === null) inteFordelat += r.gram
    else perBarare.set(r.kopare, (perBarare.get(r.kopare) ?? 0) + r.gram)
  }
  const buret = [...perBarare.values()].reduce((s, g) => s + g, 0)
  return { perBarare, inteFordelat, totalt: buret + inteFordelat }
}

/**
 * Matvikten varje deltagare bär vid start, för startvikten i packlistan: det hen bär enligt matplanen, plus en andel
 * av det som ingen bär ännu, efter deltagarnas matandelar. Hundarnas egen mat räknas som i matvikter.
 */
export function matviktPerDeltagare(data: Matdata, matdeltagare: Deltagare[], dagar: readonly Matdag[]): Map<string, number> {
  const personIds = matdeltagare.filter((d) => d.typ === 'person').map((d) => d.id)
  const { perBarare, inteFordelat } = matviktPerBarare(data, dagar, personIds)
  const rest = matvikter(inteFordelat, matdeltagare, dagar.length)
  return new Map(matdeltagare.map((d) => [d.id, (perBarare.get(d.id) ?? 0) + (rest.get(d.id) ?? 0)]))
}
