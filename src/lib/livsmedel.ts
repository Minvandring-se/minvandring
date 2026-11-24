// Baslivsmedel från Livsmedelsverkets livsmedelsdatabas (CC BY 4.0), för förslag när man skriver ingredienser.
// Rena funktioner: tillståndet (torr, rå eller tillagad) utifrån namnet, och rangordningen av förslagen.

import type { Livsmedel, Tillstand } from './typer'

export type { Livsmedel, Tillstand }

export const TILLSTAND_ETIKETT: Record<Tillstand, string> = { torr: 'Torr', ra: 'Rå', tillagad: 'Tillagad' }

/** Orden i ett namn, med små bokstäver. "Pasta kokt u. salt" ger pasta, kokt, u, salt. */
function ord(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

const TORR = /^(okokt|okokta|torr|torra|torrt|torkad|torkade|torkat|frystorkad|frystorkade|lufttorkad|lufttorkade|soltorkad|soltorkade)$/
const TILLAGAD = /^(.*kokt|.*kokta|.*stekt|.*stekta|grillad|grillade|grillat|tillagad|tillagade|tillagat|friterad|friterade|ugnsbakad|ugnsbakade|gräddad|gräddade|ångad|ångade|uppvärmd|uppvärmda|mikrad|mikrade)$/
const RA = /^(rå|råa|rått)$/
/** Tillagning i Livsmedelsverkets klassificering (LanguaL G) som betyder att livsmedlet är tillagat. */
const TILLAGAD_FASETT = /kok|stek|grill|ugn|friter|ång|mikro|rost|bak|gräd/i

/**
 * Tillståndet utifrån namnet: "Pasta okokt" och "Linser torkade" är torra, "Pasta kokt u. salt" är tillagad och
 * "Morot rå" är rå. Ord som slutar på pulver eller mjöl (mjölkpulver, vetemjöl) räknas som torra. Säger namnet inget
 * används tillagningen i klassificeringen, om den finns. Annars null, eftersom en gissning kan ge fel vikt.
 */
export function tillstandFranNamn(namn: string, tillagning: string | null = null): Tillstand | null {
  const orden = ord(namn)
  // Torr går först, så att okokt inte räknas som kokt.
  if (orden.some((o) => TORR.test(o) || o.endsWith('pulver') || o.endsWith('mjöl'))) return 'torr'
  if (orden.some((o) => TILLAGAD.test(o))) return 'tillagad'
  if (orden.some((o) => RA.test(o))) return 'ra'
  if (tillagning && TILLAGAD_FASETT.test(tillagning) && !/ej tillämplig|ej tillagad|ingen tillagning/i.test(tillagning)) return 'tillagad'
  return null
}

const TILLSTAND_ORDNING: Record<Tillstand | 'okant', number> = { torr: 0, ra: 1, okant: 2, tillagad: 3 }

/** Sökordet som databasen ska söka på: det längsta ordet, så att träffarna blir få men inget missas. */
export function sokordForDatabasen(sok: string): string | null {
  const orden = ord(sok)
  if (orden.length === 0 || sok.trim().length < 2) return null
  return orden.reduce((a, b) => (b.length > a.length ? b : a))
}

/**
 * De bästa förslagen för det man har skrivit. Alla ord man skrivit måste finnas i namnet. Först namn som börjar med
 * det man skrivit, sedan namn där ett ord börjar med det första sökordet, sedan övriga. Vid lika träff kommer torrt
 * före rått före okänt före tillagat, eftersom man packar torr vikt, och sedan kortare namn.
 */
export function rangordnaLivsmedel<T extends Pick<Livsmedel, 'namn' | 'tillstand'>>(kandidater: readonly T[], sok: string, max = 5): T[] {
  const fras = sok.trim().toLowerCase()
  const sokord = ord(sok)
  if (sokord.length === 0) return []
  const traff = (namn: string): number | null => {
    const lag = namn.toLowerCase()
    if (!sokord.every((s) => lag.includes(s))) return null
    if (lag.startsWith(fras)) return 0
    if (ord(namn).some((o) => o.startsWith(sokord[0]))) return 1
    return 2
  }
  return kandidater
    .flatMap((k) => {
      const t = traff(k.namn)
      return t === null ? [] : [{ k, t }]
    })
    .sort(
      (a, b) =>
        a.t - b.t ||
        TILLSTAND_ORDNING[a.k.tillstand ?? 'okant'] - TILLSTAND_ORDNING[b.k.tillstand ?? 'okant'] ||
        a.k.namn.length - b.k.namn.length ||
        a.k.namn.localeCompare(b.k.namn, 'sv'),
    )
    .slice(0, max)
    .map((x) => x.k)
}

/** Fälten i ingrediensraden som ett förslag fyller i: kcal som heltal och protein med en decimal och komma. */
export function faltFranLivsmedel(l: Pick<Livsmedel, 'kcal_per_100g' | 'protein_per_100g'>): { kcal: string; protein: string } {
  return {
    kcal: l.kcal_per_100g === null ? '' : String(Math.round(l.kcal_per_100g)),
    protein: l.protein_per_100g === null ? '' : String(Math.round(l.protein_per_100g * 10) / 10).replace('.', ','),
  }
}
