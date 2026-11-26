// Egna rätter hemma och favoritrecept i skafferiet. Rena funktioner utan databas.
//
// En rätt hemma är en rätt man har lagat, till exempel 5 portioner torkad korvstroganoff. Den har portioner i stället
// för påsar, och samma bäst före som en påse: ett datum som har passerat räknas inte som att man har rätten hemma.
import { bastForeStatus, MAX_ANTAL, sorteraSkafferi } from './skafferi'
import type { Receptkoppling, Skafferiratt } from './typer'

/** Samma gräns som i databasen och för en egen rätt i turen. */
export const MAX_RATTNAMN = 80

/** Felet för namnet på en rätt hemma, eller null när det går att spara. */
export function rattnamnFel(namn: string): string | null {
  const t = namn.trim()
  if (!t) return 'Skriv vad rätten heter.'
  if (t.length > MAX_RATTNAMN) return `Namnet får vara högst ${MAX_RATTNAMN} tecken.`
  return null
}

/** "1 portion" eller "5 portioner". */
export function portionertext(portioner: number): string {
  return portioner === 1 ? '1 portion' : `${portioner} portioner`
}

/** Rätten hemma med samma namn, oavsett stora och små bokstäver och mellanslag runt om. Namnet är unikt per person. */
export function rattMedNamn<T extends Pick<Skafferiratt, 'namn'>>(ratter: readonly T[], namn: string): T | undefined {
  const t = namn.trim().toLowerCase()
  return ratter.find((r) => r.namn.toLowerCase() === t)
}

/** Rätterna i den ordning de visas: det som går ut först överst, rätter utan datum sist, sedan efter namn. */
export function sorteraRatter<T extends Pick<Skafferiratt, 'namn' | 'bast_fore'>>(ratter: readonly T[]): T[] {
  return sorteraSkafferi(ratter, (r) => r.namn)
}

/** Rätterna man har hemma vid datumet: utan dem vars bäst före har passerat. */
export function ratterHemma<T extends Pick<Skafferiratt, 'namn' | 'bast_fore'>>(ratter: readonly T[], datum: string): T[] {
  return sorteraRatter(ratter.filter((r) => bastForeStatus(r.bast_fore, datum) !== 'passerat'))
}

/** Portionerna efter att några lagts till: minst 1 och högst 999. */
export function nyaPortioner(hemma: number, tillagt: number): number {
  return Math.min(MAX_ANTAL, Math.max(1, hemma + tillagt))
}

/** Kopplingen på en rad som receptets nyckel ("eget:<id>" eller "katalog:<id>"), som i en lista att välja i. */
export function kopplingsnyckel(r: Pick<Skafferiratt, 'recept_id' | 'receptkatalog_id'>): string {
  if (r.recept_id) return `eget:${r.recept_id}`
  if (r.receptkatalog_id) return `katalog:${r.receptkatalog_id}`
  return ''
}

/** Nyckeln tillbaka till en koppling. Tom eller okänd nyckel betyder inget recept. */
export function tolkaKoppling(nyckel: string): Receptkoppling | null {
  const [typ, ...resten] = nyckel.split(':')
  const id = resten.join(':')
  if (!id) return null
  if (typ === 'eget') return { recept_id: id }
  if (typ === 'katalog') return { receptkatalog_id: id }
  return null
}

/** Ens favoritrecept: egna recept och MinVandrings recept, var för sig. */
export interface Receptfavoriter {
  egna: ReadonlySet<string>
  katalog: ReadonlySet<string>
}

export const INGA_RECEPTFAVORITER: Receptfavoriter = { egna: new Set(), katalog: new Set() }

/** Om receptet har en stjärna. */
export function arReceptfavorit(favoriter: Receptfavoriter, koppling: Receptkoppling): boolean {
  return 'recept_id' in koppling ? favoriter.egna.has(koppling.recept_id) : favoriter.katalog.has(koppling.receptkatalog_id)
}

/**
 * Namnet på en rätt som läggs i turen från skafferiet. Har turen redan en egen rätt med namnet och utan ingredienser
 * används den. Har den ingredienser får rätten hemma ett nytt namn ("Gryta (2)"), så att inget hamnar i inköpslistan.
 */
export function rattForHemma(
  namn: string,
  turensRatter: readonly { id: string; namn: string; matprodukt_id: string | null }[],
  harIngredienser: (rattId: string) => boolean,
): { typ: 'befintlig'; rattId: string } | { typ: 'ny'; namn: string } {
  const egna = turensRatter.filter((r) => !r.matprodukt_id)
  const t = namn.trim().toLowerCase()
  const samma = egna.find((r) => r.namn.toLowerCase() === t)
  if (samma && !harIngredienser(samma.id)) return { typ: 'befintlig', rattId: samma.id }
  if (!samma) return { typ: 'ny', namn: namn.trim() }
  const upptagna = new Set(egna.map((r) => r.namn.toLowerCase()))
  for (let i = 2; ; i++) {
    const kandidat = `${namn.trim()} (${i})`
    const ledig = egna.find((r) => r.namn.toLowerCase() === kandidat.toLowerCase())
    if (ledig && !harIngredienser(ledig.id)) return { typ: 'befintlig', rattId: ledig.id }
    if (!upptagna.has(kandidat.toLowerCase())) return { typ: 'ny', namn: kandidat }
  }
}
