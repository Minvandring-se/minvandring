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

export const BASTFORE_TEXT: Record<Exclude<Bastfore, 'ok'>, string> = {
  passerat: 'Bäst före har passerat',
  snart: 'Bäst före inom en månad',
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
