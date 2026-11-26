// MinVandrings recept i appen: kost och allergener räknade från ingredienserna, kopian till en tur eller till ens
// egna recept, och det som visas. Rena funktioner utan databas.
import { ALLERGENER, KOSTVAL, type Allergen, type Kostinfo, type Kostval } from './kost'
import { kostForLivsmedel } from './livsmedelsgrupper'
import type { Enhet } from './handla'
import { gramFor, MAX_VARUNAMN, type TolkadIngrediens } from './mat'
import type { Livsmedel, Receptkatalogingrediens, Receptkatalogrecept, Receptkatalogsteg, Varukatalogvara } from './typer'
import { kostinfoForVara } from './varukatalog'

export const RECEPTMALTID_ETIKETT: Record<Receptkatalogrecept['maltid'], string> = {
  frukost: 'Frukost',
  lunch: 'Lunch',
  middag: 'Middag',
  mellanmal: 'Mellanmål',
  dryck: 'Dryck',
}

/** En ingrediens med livsmedlet eller märkesvaran den är kopplad till, som databasen lämnar den. */
export type Katalogingrediens = Omit<Receptkatalogingrediens, 'recept_id'> & {
  livsmedel: Pick<Livsmedel, 'namn' | 'grupp' | 'allergener' | 'kcal_per_100g' | 'protein_per_100g'> | null
  varukatalog: Pick<Varukatalogvara, 'vegetarisk' | 'vegansk' | 'glutenfri' | 'laktosfri' | 'allergener' | 'spar' | 'kcal_per_100g' | 'protein_per_100g'> | null
}

/** Ett recept i katalogen med ingredienser och steg. */
export type Katalogrecept = Receptkatalogrecept & {
  ingredienser: Katalogingrediens[]
  steg: Omit<Receptkatalogsteg, 'recept_id'>[]
}

/** Det som är känt om en ingrediens. null när den saknar koppling, och då är den okänd. */
export function kostForIngrediens(i: Pick<Katalogingrediens, 'livsmedel' | 'varukatalog'>): Kostinfo | null {
  if (i.varukatalog) return kostinfoForVara(i.varukatalog)
  if (i.livsmedel) return { ...kostForLivsmedel(i.livsmedel.namn, i.livsmedel.grupp, i.livsmedel.allergener), allergener: i.livsmedel.allergener }
  return null
}

/** Ingredienserna som räknas för kost och allergener. Vatten på plats räknas inte. */
export function kostdelar(recept: Pick<Katalogrecept, 'ingredienser'>): (Kostinfo | null)[] {
  return recept.ingredienser.filter((i) => i.packas !== 'pa_plats').map(kostForIngrediens)
}

/**
 * Kost och allergener för hela receptet. Allergenerna är kända bara när alla ingredienser är kända. Ett kostval är
 * nej när någon ingrediens säger nej, ja när alla säger ja, och annars okänt. Okänt räknas aldrig som att receptet passar.
 */
export function kostForRecept(delar: readonly (Kostinfo | null)[]): Kostinfo {
  const val = (k: Kostval): boolean | null => (delar.some((d) => d?.[k] === false) ? false : delar.length > 0 && delar.every((d) => d?.[k] === true) ? true : null)
  const kanda = delar.every((d) => d !== null && d.allergener !== null)
  const alla = new Set<Allergen>(delar.flatMap((d) => d?.allergener ?? []))
  return {
    vegetarisk: val('vegetarisk'),
    vegansk: val('vegansk'),
    glutenfri: val('glutenfri'),
    laktosfri: val('laktosfri'),
    allergener: kanda ? ALLERGENER.map((a) => a.nyckel).filter((a) => alla.has(a)) : null,
    spar: kanda ? [...new Set(delar.flatMap((d) => d?.spar ?? []))] : null,
  }
}

/** Allergenerna som det kända receptet innehåller, och om några ingredienser är okända. */
export function allergenrad(recept: Pick<Katalogrecept, 'ingredienser'>): { innehaller: Allergen[]; okanda: number } {
  const delar = kostdelar(recept)
  const innehaller = ALLERGENER.map((a) => a.nyckel).filter((a) => delar.some((d) => d?.allergener?.includes(a)))
  return { innehaller, okanda: delar.filter((d) => d === null || d.allergener === null).length }
}

/** Kostbrickorna för ett recept, bara det som är känt och sant. Vegansk räcker, eftersom den också är vegetarisk. */
export function receptbrickor(k: Kostinfo): string[] {
  return KOSTVAL.filter((v) => k[v.nyckel] === true && !(v.nyckel === 'vegetarisk' && k.vegansk === true)).map((v) => v.etikett)
}

const tal = (n: number) => n.toLocaleString('sv-SE', { maximumFractionDigits: 2 })

/** Mängden som den visas: "6 msk", "1,5 dl". Tom när mängden saknas. */
export function mangdtext(i: Pick<Receptkatalogingrediens, 'mangd' | 'enhet'>): string {
  return i.mangd === null || i.enhet === null ? '' : `${tal(i.mangd)} ${i.enhet}`
}

/** Tiden för ett steg: "5 min" eller "5–10 min". Tom utan tid. */
export function tidtext(tid: string | null): string {
  return tid ? `${tid} min` : ''
}

/** Stegen delade på hemma och på turen, i ordning. */
export function stegPerPlats(steg: Katalogrecept['steg']): { hemma: Katalogrecept['steg']; turen: Katalogrecept['steg'] } {
  const sorterade = [...steg].sort((a, b) => a.steg_nr - b.steg_nr)
  return { hemma: sorterade.filter((s) => s.var === 'hemma'), turen: sorterade.filter((s) => s.var === 'turen') }
}

/**
 * Receptet som ingredienser per portion, för att kopiera det till en tur eller till ens egna recept.
 * - Vatten på plats kommer inte med, eftersom det varken köps eller bärs.
 * - Mängden delas med portionerna och avrundas till två decimaler. En mängd i g som blir under 1 g per portion (till
 *   exempel en kryddning) kopieras utan mängd, eftersom vikten per portion måste vara minst 1 g.
 * - Kcal och protein per 100 g kommer från det kopplade livsmedlet eller märkesvaran.
 */
export function receptPerPortion(recept: Pick<Katalogrecept, 'portioner' | 'ingredienser'>): TolkadIngrediens[] {
  return [...recept.ingredienser]
    .filter((i) => i.packas !== 'pa_plats')
    .sort((a, b) => a.ordning - b.ordning)
    .map((i) => {
      const per = i.mangd === null ? null : Math.round((i.mangd / recept.portioner) * 100) / 100
      const forLite = per !== null && ((i.enhet === 'g' && per < 1) || (i.enhet === 'kg' && per < 0.001) || per < 0.01)
      const mangd = forLite ? null : per
      const enhet = forLite ? null : i.enhet
      const kalla = i.varukatalog ?? i.livsmedel
      const kcal = kalla?.kcal_per_100g ?? null
      return {
        vara: i.ingrediens.slice(0, MAX_VARUNAMN),
        mangd,
        enhet,
        gram: gramFor(mangd, enhet),
        kcalPer100g: kcal === null ? null : Math.min(900, Math.round(kcal)),
        proteinPer100g: kalla?.protein_per_100g ?? null,
        ...(i.varukatalog_id ? { varukatalogId: i.varukatalog_id } : {}),
      }
    })
}

/** Antal personer som receptet kan räknas om till. */
export const MIN_PERSONER = 1
export const MAX_PERSONER = 12

/** Hur mängden avrundas per enhet: närmaste steg, och aldrig ner till noll. */
const STEG: Record<Enhet, number> = { g: 1, kg: 0.01, ml: 5, dl: 0.1, msk: 0.1, tsk: 0.5, krm: 0.5, st: 0.5 }

/** En mängd räknad om och avrundad läsbart: 1,5 dl i stället för 1,4583 dl, och tsk, krm och st till närmaste halva. */
export function avrundaMangd(mangd: number, enhet: Enhet): number {
  const steg = STEG[enhet]
  const avrundad = Math.round(mangd / steg) * steg
  return Math.max(steg, Math.round(avrundad * 100) / 100)
}

/**
 * Ingredienserna räknade om från receptets portioner till ett antal personer, även vatten på plats. För receptets
 * eget antal visas mängderna som de står. Gram räknas om utan avrundning, eftersom de bara används för kcal.
 */
export function skalaRecept<T extends Pick<Receptkatalogingrediens, 'mangd' | 'enhet' | 'gram'>>(ingredienser: readonly T[], portioner: number, personer: number): T[] {
  if (personer === portioner) return [...ingredienser]
  const faktor = personer / portioner
  return ingredienser.map((i) => ({
    ...i,
    mangd: i.mangd === null || i.enhet === null ? i.mangd : avrundaMangd(i.mangd * faktor, i.enhet),
    gram: i.gram === null ? null : i.gram * faktor,
  }))
}

/** Hur stor del av receptets vikt som måste ha känd kcal för att kcal ska visas. */
export const KCAL_TACKNING = 0.8
/** Kryddor i tsk och krm väger så lite att de räknas som 0 g när vikten saknas. */
const SMA_ENHETER: readonly (Enhet | null)[] = ['tsk', 'krm']

/** Vikten i gram för en ingrediens: gram-kolumnen, eller mängden när enheten är g eller kg. null när den är okänd. */
export function viktFor(i: Pick<Receptkatalogingrediens, 'mangd' | 'enhet' | 'gram'>): number | null {
  if (i.gram !== null) return i.gram
  if (i.enhet === 'g') return i.mangd
  if (i.enhet === 'kg') return i.mangd === null ? null : i.mangd * 1000
  return null
}

/**
 * Ungefär hur många kcal en portion ger, avrundat till närmaste 10. Räknas från ingrediensernas vikt och kcal per
 * 100 g i det kopplade livsmedlet eller märkesvaran. Vatten på plats räknas inte.
 * - Receptets vikt är summan av vikterna. Saknas vikten för en ingrediens är receptets vikt okänd, utom för kryddor i
 *   tsk och krm, som räknas som 0 g.
 * - null när vikten är okänd, eller när ingredienser med både vikt och kcal är mindre än 80 % av vikten.
 */
export function kcalPerPortion(recept: Pick<Katalogrecept, 'portioner' | 'ingredienser'>): number | null {
  let vikt = 0
  let kandVikt = 0
  let kcal = 0
  for (const i of recept.ingredienser) {
    if (i.packas === 'pa_plats') continue
    const g = viktFor(i) ?? (SMA_ENHETER.includes(i.enhet) ? 0 : null)
    if (g === null) return null
    vikt += g
    const per100 = (i.varukatalog ?? i.livsmedel)?.kcal_per_100g ?? null
    if (per100 === null) continue
    kandVikt += g
    kcal += (g * per100) / 100
  }
  if (vikt <= 0 || kandVikt / vikt < KCAL_TACKNING) return null
  return Math.round(kcal / recept.portioner / 10) * 10
}

/** Adressen till ett recept i katalogen, till exempel /matplanering/recept/aprikosgrot. */
export const receptadress = (id: string, turId?: string) => `/matplanering/recept/${id}${turId ? `?tur=${turId}` : ''}`
