// Skafferiet: påsar man har hemma, med bäst-före-datum, och favoriter. Rena funktioner utan databas.
//
// En påse vars bäst-före-datum har passerat räknas inte som att man har den hemma, men visas märkt.
// En påse vars datum passerar inom en månad räknas, och märks.
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
