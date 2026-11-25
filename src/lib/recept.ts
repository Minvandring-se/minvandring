// Egna recept: rätter som sparas på kontot och kopieras till en tur. Rena funktioner utan databas.
//
// När ett recept läggs i en tur kopieras det till turens rätter, så att en senare ändring i receptet inte ändrar
// turen. Två rätter i en tur får inte heta likadant. Finns en egen rätt med receptets namn och exakt samma
// ingredienser och mängder används den. Annars kopieras receptet med ett nytt namn: "Gryta (2)", "Gryta (3)".
import { MAX_RATTNAMN, type Ingrediensfalt, type TolkadIngrediens } from './mat'
import type { Ingrediens, Ratt, Recept, Vara } from './typer'

/** Receptets ingredienser som formuläret och kopieringen använder dem, i receptets ordning. */
export function receptTillRader(r: Recept): TolkadIngrediens[] {
  return [...r.rader]
    .sort((a, b) => a.sortering - b.sortering)
    .map((x) => ({ vara: x.vara, mangd: x.mangd, enhet: x.enhet, gram: x.gram_per_portion, kcalPer100g: x.kcal_per_100g, proteinPer100g: x.protein_per_100g }))
}

/** En egen rätt i en tur som ingrediensrader, med varornas kcal och protein. Ingredienser utan vara hoppas över. */
export function rattTillRader(rattId: string, ingredienser: readonly Ingrediens[], varor: readonly Vara[]): TolkadIngrediens[] {
  return ingredienser
    .filter((i) => i.ratt_id === rattId)
    .flatMap((i) => {
      const v = varor.find((x) => x.id === i.vara_id)
      return v ? [{ vara: v.namn, mangd: i.mangd, enhet: i.enhet, gram: i.gram_per_portion, kcalPer100g: v.kcal_per_100g, proteinPer100g: v.protein_per_100g }] : []
    })
}

const medKomma = (tal: number | null) => tal?.toString().replace('.', ',') ?? ''

/** Raderna som fält i formuläret. Decimaler skrivs med komma. Vikten står bara för andra enheter än g och kg. */
export function raderTillFalt(rader: readonly TolkadIngrediens[]): Ingrediensfalt[] {
  return rader.map((r) => ({
    vara: r.vara,
    mangd: medKomma(r.mangd),
    enhet: r.enhet ?? 'g',
    gram: r.enhet === 'g' || r.enhet === 'kg' ? '' : medKomma(r.gram),
    kcal: r.kcalPer100g?.toString() ?? '',
    protein: r.proteinPer100g?.toString().replace('.', ',') ?? '',
  }))
}

const nyckel = (text: string) => text.trim().toLowerCase()

/** Mängden som en jämförbar text: mängd, enhet och vikt. */
const mangdnyckel = (r: TolkadIngrediens) => `${r.mangd ?? ''}|${r.enhet ?? ''}|${r.gram ?? ''}`

/**
 * Samma ingredienser och mängder, oavsett ordning och stora och små bokstäver. Mängd, enhet och vikt jämförs,
 * så "Mjölk 2 dl" och "Mjölk 3 dl" är olika även när ingen av dem har en vikt. Kcal och protein jämförs inte.
 */
export function sammaIngredienser(a: readonly TolkadIngrediens[], b: readonly TolkadIngrediens[]): boolean {
  if (a.length !== b.length) return false
  const mangder = new Map(a.map((r) => [nyckel(r.vara), mangdnyckel(r)]))
  if (mangder.size !== a.length) return false
  return b.every((r) => mangder.get(nyckel(r.vara)) === mangdnyckel(r))
}

/** Ett namn som inte är upptaget i turen: namnet självt, annars "Namn (2)", "Namn (3)" och så vidare. */
export function ledigtNamn(namn: string, upptagna: readonly string[]): string {
  const tagna = new Set(upptagna.map(nyckel))
  if (!tagna.has(nyckel(namn))) return namn
  for (let n = 2; ; n++) {
    const tillagg = ` (${n})`
    const kandidat = `${namn.slice(0, MAX_RATTNAMN - tillagg.length).trimEnd()}${tillagg}`
    if (!tagna.has(nyckel(kandidat))) return kandidat
  }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Vad som händer när ett recept läggs i en tur. */
export type Receptval =
  /** Turen har ingen rätt med namnet. Receptet kopieras med sitt namn. */
  | { typ: 'kopiera'; namn: string }
  /** Turen har en egen rätt med namnet och samma ingredienser. Den läggs i måltiden. */
  | { typ: 'befintlig'; rattId: string; namn: string }
  /** Turen har en annan rätt med namnet. Receptet kopieras med ett nytt namn. */
  | { typ: 'nytt_namn'; namn: string }

/**
 * Avgör hur ett recept läggs i en tur. En egen rätt med receptets namn, eller med ett av namnen som en tidigare
 * kopia fick ("Gryta (2)"), och exakt samma ingredienser och mängder används. Påsar ur katalogen används aldrig,
 * men deras namn är upptagna.
 */
export function valForRecept(
  namn: string,
  rader: readonly TolkadIngrediens[],
  ratter: readonly Ratt[],
  ingredienser: readonly Ingrediens[],
  varor: readonly Vara[],
): Receptval {
  const upptagna = ratter.map((r) => r.namn)
  if (!upptagna.some((n) => nyckel(n) === nyckel(namn))) return { typ: 'kopiera', namn }
  const kopia = new RegExp(`^${escapeRegExp(nyckel(namn))} \\(\\d+\\)$`)
  const kandidater = ratter.filter((r) => !r.matprodukt_id && (nyckel(r.namn) === nyckel(namn) || kopia.test(nyckel(r.namn))))
  const samma = kandidater.find((r) => sammaIngredienser(rattTillRader(r.id, ingredienser, varor), rader))
  if (samma) return { typ: 'befintlig', rattId: samma.id, namn: samma.namn }
  return { typ: 'nytt_namn', namn: ledigtNamn(namn, upptagna) }
}

/** Den korta texten om vad som hände. null när receptet kopierades med sitt eget namn. */
export function receptbesked(val: Receptval, receptnamn: string): string | null {
  if (val.typ === 'befintlig') return `${val.namn} fanns redan i turen med samma ingredienser, så den lades i måltiden.`
  if (val.typ === 'nytt_namn') return `Turen har redan en annan rätt som heter ${receptnamn}. Receptet lades till som ${val.namn}.`
  return null
}

/** Ens recept med samma namn, oavsett stora och små bokstäver. Det uppdateras i stället för att ett nytt skapas. */
export function receptMedNamn<T extends Pick<Recept, 'namn'>>(recept: readonly T[], namn: string): T | undefined {
  return recept.find((r) => nyckel(r.namn) === nyckel(namn))
}
