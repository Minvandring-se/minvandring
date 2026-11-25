// Skafferiet: påsar man har hemma, med bäst-före-datum, och favoriter. Rena funktioner utan databas.
//
// En påse vars bäst-före-datum har passerat räknas inte som att man har den hemma, men visas märkt.
// En påse vars datum passerar inom en månad räknas, och märks.
import { antalPasar } from './mat'
import { lage } from './turlista'
import type { Skafferirad } from './typer'

export type Bastfore = 'passerat' | 'snart' | 'ok'

/** Datumet en månad efter ett datum (ÅÅÅÅ-MM-DD). 31 januari blir sista februari. */
export function enManadEfter(datum: string): string {
  const [ar, manad, dag] = datum.split('-').map(Number)
  const sista = new Date(Date.UTC(ar, manad + 1, 0)).getUTCDate()
  const d = new Date(Date.UTC(ar, manad, Math.min(dag, sista)))
  return d.toISOString().slice(0, 10)
}

/** Har bäst-före passerat, passerar det inom en månad, eller är det långt kvar? null utan datum. */
export function bastForeStatus(bastFore: string | null, idag: string): Bastfore | null {
  if (!bastFore) return null
  if (bastFore < idag) return 'passerat'
  if (bastFore <= enManadEfter(idag)) return 'snart'
  return 'ok'
}

/** Datumet som det visas: "12 mars 2027". */
export function formateraDatum(datum: string): string {
  const [ar, manad, dag] = datum.split('-').map(Number)
  return new Date(Date.UTC(ar, manad - 1, dag)).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Hur många av varje påse man har hemma, med påsens id som nyckel. Påsar vars datum har passerat räknas inte. */
export function hemma(rader: readonly Skafferirad[], idag: string): Map<string, number> {
  return new Map(rader.filter((r) => bastForeStatus(r.bast_fore, idag) !== 'passerat').map((r) => [r.matprodukt_id, r.antal]))
}

/** Texten i inköpslistan för en påse man själv ansvarar för. null när man inte har någon hemma. */
export function kopText(pasar: number, iSkafferiet: number): string | null {
  if (iSkafferiet <= 0) return null
  if (iSkafferiet >= pasar) return pasar === 1 ? 'Du har den hemma' : `Du har alla ${pasar} hemma`
  return `Köp ${pasar - iSkafferiet} (du har ${iSkafferiet} hemma)`
}

/** Favoriter och påsar man har hemma först, annars samma ordning som förut. */
export function skafferietForst<T extends { id: string }>(pasar: readonly T[], favoriter: ReadonlySet<string>, iSkafferiet: ReadonlyMap<string, number>): T[] {
  const forst = (p: T) => favoriter.has(p.id) || (iSkafferiet.get(p.id) ?? 0) > 0
  return [...pasar.filter(forst), ...pasar.filter((p) => !forst(p))]
}

/** Skafferiet i den ordning det visas: det som går ut först överst, påsar utan datum sist, sedan efter namn. */
export function sorteraSkafferi<T extends Pick<Skafferirad, 'bast_fore'>>(rader: readonly T[], namn: (r: T) => string): T[] {
  return [...rader].sort((a, b) => {
    if (a.bast_fore !== b.bast_fore) {
      if (a.bast_fore === null) return 1
      if (b.bast_fore === null) return -1
      return a.bast_fore < b.bast_fore ? -1 : 1
    }
    return namn(a).localeCompare(namn(b), 'sv')
  })
}

export const MAX_ANTAL = 999

/** En tur man är med i, så som bokningen behöver den. */
export interface Bokningstur {
  id: string
  avresa: string | null
  hemkomst: string | null
  dagar: number | null
  skapad: string
}

/**
 * Turerna som får ta påsar ur skafferiet före en tur: andra kommande eller pågående turer som börjar tidigare.
 * Turer utan datum kommer efter turer med datum, och bland dem den som skapades först. Avslutade turer räknas inte.
 */
export function turerFore(turer: readonly Bokningstur[], turId: string, idag: string): Set<string> {
  const aktiva = turer.filter((t) => t.id === turId || lage(t, idag) !== 'tidigare')
  const sorterade = [...aktiva].sort((a, b) => {
    if (a.avresa !== b.avresa) {
      if (a.avresa === null) return 1
      if (b.avresa === null) return -1
      return a.avresa < b.avresa ? -1 : 1
    }
    return a.skapad < b.skapad ? -1 : a.skapad > b.skapad ? 1 : 0
  })
  const plats = sorterade.findIndex((t) => t.id === turId)
  return new Set(sorterade.slice(0, Math.max(0, plats)).map((t) => t.id))
}

/** En påse man själv ansvarar för i en tur: hur många påsar turen behöver. */
export interface Bokning {
  turId: string
  matproduktId: string
  pasar: number
}

/**
 * Hur många av varje påse hemma som redan går till turer före den här. Bokningen sparas inte: den räknas ut från
 * påsarna man ansvarar för i de turerna, så att den följer med när man byter ansvarig eller tar bort en måltid.
 */
export function bokade(bokningar: readonly Bokning[], fore: ReadonlySet<string>): Map<string, number> {
  const ut = new Map<string, number>()
  for (const b of bokningar) if (fore.has(b.turId) && b.pasar > 0) ut.set(b.matproduktId, (ut.get(b.matproduktId) ?? 0) + b.pasar)
  return ut
}

/** Det man har hemma minus det som går till turer före den här. Påsar utan något ledigt kommer inte med. */
export function ledigaHemma(iSkafferiet: ReadonlyMap<string, number>, bokat: ReadonlyMap<string, number>): Map<string, number> {
  const ut = new Map<string, number>()
  for (const [id, antal] of iSkafferiet) {
    const ledigt = antal - (bokat.get(id) ?? 0)
    if (ledigt > 0) ut.set(id, ledigt)
  }
  return ut
}

/** Texten när påsar hemma går till en tur före den här. null när inga gör det. */
export function bokadText(antal: number): string | null {
  if (antal <= 0) return null
  return antal === 1 ? 'En påse hemma är bokad till en tur som börjar före den här.' : `${antal} påsar hemma är bokade till en tur som börjar före den här.`
}

/**
 * Påsarna man har använt senast, högst ett visst antal och varje påse en gång: först den här turens påsar, sedan
 * påsarna i ens andra turer, den senast skapade turen först.
 */
export function senastAnvanda(
  ratter: readonly { turId: string; matproduktId: string }[],
  turer: readonly Pick<Bokningstur, 'id' | 'skapad'>[],
  turId: string,
  max = 6,
): string[] {
  const skapad = new Map(turer.map((t) => [t.id, t.skapad]))
  const vikt = (id: string) => (id === turId ? '￿' : (skapad.get(id) ?? ''))
  const sorterade = [...ratter].sort((a, b) => (vikt(a.turId) < vikt(b.turId) ? 1 : vikt(a.turId) > vikt(b.turId) ? -1 : 0))
  return [...new Set(sorterade.map((r) => r.matproduktId))].slice(0, max)
}

/** En rad i en annan tur som man själv bär: påsen och hur många portioner raden är (de som äter den). */
export interface BurenRad {
  turId: string
  matproduktId: string
  portioner: number
}

/**
 * Påsarna man bär i andra turer, per tur och påse: portionerna i alla rader man bär, delat med portioner per påse
 * och avrundat uppåt till hela påsar. Bygger på maltider.bars_av, så det är den som bär påsen som har den hemma.
 */
export function bokningarFranRader(rader: readonly BurenRad[], portionerPerPase: ReadonlyMap<string, number>): Bokning[] {
  const summa = new Map<string, BurenRad>()
  for (const r of rader) {
    const nyckel = `${r.turId}:${r.matproduktId}`
    const finns = summa.get(nyckel)
    summa.set(nyckel, { ...r, portioner: (finns?.portioner ?? 0) + r.portioner })
  }
  return [...summa.values()].map((r) => ({ turId: r.turId, matproduktId: r.matproduktId, pasar: antalPasar(r.portioner, 1, portionerPerPase.get(r.matproduktId) ?? 1) }))
}

/**
 * Ska man själv bära en ny rad med en påse man har hemma? Ja när raden ryms i påsarna hemma, eller när minst en påse
 * hemma inte redan går till raderna man bär i turen (resten köps). ledigt är påsarna hemma som är kvar vid turens
 * början, utan dem som går till tidigare turer.
 */
export function taPaseSjalv(ledigt: number, portionerRedan: number, nyaPortioner: number, portionerPerPase: number): boolean {
  if (ledigt <= 0) return false
  return antalPasar(portionerRedan + nyaPortioner, 1, portionerPerPase) <= ledigt || ledigt > antalPasar(portionerRedan, 1, portionerPerPase)
}

// ─── Lägga i skafferiet och bäst före som månad och år ─────────────────────────

export const MANADER = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'] as const

/** Så många år framåt man kan välja för bäst före, räknat från i år. */
export const AR_FRAMAT = 15

/** Åren man kan välja för bäst före: från i år till och med 15 år framåt. */
export function tillatnaAr(idag: string): number[] {
  const ar = Number(idag.slice(0, 4))
  return Array.from({ length: AR_FRAMAT + 1 }, (_, i) => ar + i)
}

/** Sista dagen i en månad som ÅÅÅÅ-MM-DD. Månaden räknas från 1. */
export function sistaDagIManaden(ar: number, manad: number): string {
  const dag = new Date(Date.UTC(ar, manad, 0)).getUTCDate()
  return `${ar}-${String(manad).padStart(2, '0')}-${String(dag).padStart(2, '0')}`
}

/** Bäst före som det visas: "mars 2027". */
export function manadOchAr(datum: string): string {
  const [ar, manad] = datum.split('-').map(Number)
  return `${MANADER[manad - 1]} ${ar}`
}

/** Månad och år ur ett datum, för väljarna. Tomma strängar när datumet saknas. */
export function valFranDatum(datum: string | null): { manad: string; ar: string } {
  if (!datum) return { manad: '', ar: '' }
  const [ar, manad] = datum.split('-')
  return { manad: String(Number(manad)), ar }
}

export type Bastforeval = { ok: true; datum: string | null } | { ok: false; fel: string }

/**
 * Bäst före ur väljarna för månad och år. Båda tomma: inget datum. Dagen blir den sista i månaden. Bara år från i år
 * till och med 15 år framåt går att spara.
 */
export function tolkaBastFore(manad: string, ar: string, idag: string): Bastforeval {
  if (manad === '' && ar === '') return { ok: true, datum: null }
  if (manad === '' || ar === '') return { ok: false, fel: 'Välj både månad och år, eller ingen av dem.' }
  const m = Number(manad)
  const a = Number(ar)
  const ar0 = tillatnaAr(idag)
  if (!/^\d{1,2}$/.test(manad) || m < 1 || m > 12) return { ok: false, fel: 'Välj en månad.' }
  if (!/^\d{4}$/.test(ar) || !ar0.includes(a)) return { ok: false, fel: `Välj ett år mellan ${ar0[0]} och ${ar0.at(-1)}.` }
  return { ok: true, datum: sistaDagIManaden(a, m) }
}

/** Antalet efter att några påsar lagts till: minst 1 och högst MAX_ANTAL. */
export function nyttAntal(hemma: number, tillagt: number): number {
  return Math.min(MAX_ANTAL, Math.max(1, hemma + tillagt))
}

/** Det tidigaste av två bäst före-datum. Saknas det ena gäller det andra. */
export function tidigasteDatum(a: string | null, b: string | null): string | null {
  if (!a) return b
  if (!b) return a
  return a < b ? a : b
}

/** Den korta bekräftelsen efter att påsar lagts i skafferiet: "Nu har du 3 hemma, bäst före mars 2027." */
export function skafferibesked(antal: number, bastFore: string | null): string {
  return `Nu har du ${antal} hemma${bastFore ? `, bäst före ${manadOchAr(bastFore)}` : ''}.`
}

/** Datumet som bäst före jämförs med för en tur: turens första dag, eller i dag när turen saknar datum. */
export function jamforDatum(avresa: string | null, idag: string): string {
  return avresa ?? idag
}

/** Går påsen ut före turen? Aldrig för en påse utan bäst före. */
export function garUtFore(bastFore: string | null, datum: string): boolean {
  return bastFore !== null && bastFore < datum
}

export type Skafferistatus = 'gatt_ut' | 'snart'

/** Månaderna innan bäst före som räknas som snart. */
export const SNART_MANADER = 3

/** Har bäst före passerat, eller går det ut inom tre månader? null annars och utan datum. */
export function skafferistatus(bastFore: string | null, idag: string): Skafferistatus | null {
  if (!bastFore) return null
  if (bastFore < idag) return 'gatt_ut'
  const [ar, manad, dag] = idag.split('-').map(Number)
  const sista = new Date(Date.UTC(ar, manad - 1 + SNART_MANADER + 1, 0)).getUTCDate()
  const grans = new Date(Date.UTC(ar, manad - 1 + SNART_MANADER, Math.min(dag, sista))).toISOString().slice(0, 10)
  return bastFore <= grans ? 'snart' : null
}

export const SKAFFERISTATUS_TEXT: Record<Skafferistatus, string> = { gatt_ut: 'Gått ut', snart: 'Går ut snart' }
