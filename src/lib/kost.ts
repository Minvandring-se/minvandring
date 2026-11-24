// Kost och allergener för matplanen. Nycklarna är samma som i domänen public.allergenlista i databasen,
// och ett test i supabase/rls.test.ts kontrollerar att de stämmer överens.
//
// Okänt räknas aldrig som att en påse passar. Spår ("kan innehålla spår av") räknas inte som att påsen
// innehåller allergenen, men visas i detaljerna.

/** EU:s 14 allergener, i den ordning de visas. */
export const ALLERGENER = [
  { nyckel: 'gluten', etikett: 'Gluten' },
  { nyckel: 'kraftdjur', etikett: 'Kräftdjur' },
  { nyckel: 'agg', etikett: 'Ägg' },
  { nyckel: 'fisk', etikett: 'Fisk' },
  { nyckel: 'jordnotter', etikett: 'Jordnötter' },
  { nyckel: 'soja', etikett: 'Soja' },
  { nyckel: 'mjolk', etikett: 'Mjölk' },
  { nyckel: 'notter', etikett: 'Nötter' },
  { nyckel: 'selleri', etikett: 'Selleri' },
  { nyckel: 'senap', etikett: 'Senap' },
  { nyckel: 'sesam', etikett: 'Sesam' },
  { nyckel: 'svaveldioxid', etikett: 'Svaveldioxid' },
  { nyckel: 'lupin', etikett: 'Lupin' },
  { nyckel: 'blotdjur', etikett: 'Blötdjur' },
] as const

export type Allergen = (typeof ALLERGENER)[number]['nyckel']

/** Kostvalen som både påsar och deltagare har. */
export const KOSTVAL = [
  { nyckel: 'vegetarisk', etikett: 'Vegetarisk' },
  { nyckel: 'vegansk', etikett: 'Vegansk' },
  { nyckel: 'glutenfri', etikett: 'Glutenfri' },
  { nyckel: 'laktosfri', etikett: 'Laktosfri' },
] as const

export type Kostval = (typeof KOSTVAL)[number]['nyckel']

const ALLERGENNYCKLAR = new Set<string>(ALLERGENER.map((a) => a.nyckel))

export function arAllergen(nyckel: string): nyckel is Allergen {
  return ALLERGENNYCKLAR.has(nyckel)
}

export function allergenetikett(nyckel: Allergen): string {
  return ALLERGENER.find((a) => a.nyckel === nyckel)!.etikett
}

export function kostvalsetikett(nyckel: Kostval): string {
  return KOSTVAL.find((k) => k.nyckel === nyckel)!.etikett
}

/** Det som är känt om en påse. null betyder okänt. */
export interface Kostinfo {
  vegetarisk: boolean | null
  vegansk: boolean | null
  glutenfri: boolean | null
  laktosfri: boolean | null
  allergener: readonly Allergen[] | null
}

/** Det man filtrerar på: kostval som måste stämma och allergener som påsen ska vara utan. */
export interface Kostfilter {
  val: readonly Kostval[]
  utan: readonly Allergen[]
}

export const TOMT_FILTER: Kostfilter = { val: [], utan: [] }

/** En deltagares kostbehov, med namnet som visas i varningarna. */
export interface Behov {
  namn: string
  vegetarisk: boolean
  vegansk: boolean
  glutenfri: boolean
  laktosfri: boolean
  utan: readonly Allergen[]
}

/** Passar påsen filtret? Ett kostval måste vara känt och sant, och allergenerna måste vara kända. */
export function passarFilter(p: Kostinfo, filter: Kostfilter): boolean {
  if (filter.val.some((val) => p[val] !== true)) return false
  if (filter.utan.length === 0) return true
  if (p.allergener === null) return false
  return filter.utan.every((a) => !p.allergener!.includes(a))
}

/** Filtret som passar alla i gruppen: alla kostval och allergener som någon har. */
export function filterForGruppen(behov: readonly Behov[]): Kostfilter {
  const val = KOSTVAL.map((k) => k.nyckel).filter((k) => behov.some((b) => b[k]))
  const utan = ALLERGENER.map((a) => a.nyckel).filter((a) => behov.some((b) => b.utan.includes(a)))
  return { val, utan }
}

/** Ett skäl till att en påse inte passar, eller att det inte går att veta. */
export type Skal =
  | { typ: 'innehaller'; allergen: Allergen }
  | { typ: 'inte'; val: Kostval }
  | { typ: 'okand_allergen'; allergen: Allergen }
  | { typ: 'okant_val'; val: Kostval }

/** Varför påsen inte passar en person. Tom lista när den passar. */
export function skalForPerson(p: Kostinfo, b: Behov): Skal[] {
  const skal: Skal[] = []
  for (const { nyckel } of KOSTVAL) {
    if (!b[nyckel]) continue
    if (p[nyckel] === false) skal.push({ typ: 'inte', val: nyckel })
    else if (p[nyckel] === null) skal.push({ typ: 'okant_val', val: nyckel })
  }
  for (const allergen of b.utan) {
    if (p.allergener === null) skal.push({ typ: 'okand_allergen', allergen })
    else if (p.allergener.includes(allergen)) skal.push({ typ: 'innehaller', allergen })
  }
  // Är påsen inte glutenfri, eller okänd, för den som vill ha glutenfritt säger gluten samma sak en gång till.
  const glutenfri = skal.some((s) => (s.typ === 'inte' || s.typ === 'okant_val') && s.val === 'glutenfri')
  return glutenfri ? skal.filter((s) => !((s.typ === 'innehaller' || s.typ === 'okand_allergen') && s.allergen === 'gluten')) : skal
}

export interface Varning {
  text: string
  /** true när det bara är okänt om påsen passar. Visas dämpat i stället för som en varning. */
  okand: boolean
}

function skaltext(s: Skal): string {
  switch (s.typ) {
    case 'innehaller':
      return `Innehåller ${allergenetikett(s.allergen).toLowerCase()}`
    case 'inte':
      return `Inte ${kostvalsetikett(s.val).toLowerCase()}`
    case 'okand_allergen':
      return `Okänt om den innehåller ${allergenetikett(s.allergen).toLowerCase()}`
    case 'okant_val':
      return `Okänt om den är ${kostvalsetikett(s.val).toLowerCase()}`
  }
}

/** "Lisa", "Lisa och Erik", "Lisa, Erik och Anna". */
export function uppraknade(namn: readonly string[]): string {
  if (namn.length <= 1) return namn.join('')
  return `${namn.slice(0, -1).join(', ')} och ${namn.at(-1)}`
}

/**
 * Varningarna för en påse i gruppen, en per skäl, till exempel "Innehåller gluten, passar inte Lisa".
 * Kända skäl kommer först. Ett okänt skäl blir till exempel "Okänt om den är glutenfri, gäller Lisa".
 */
export function varningar(p: Kostinfo, behov: readonly Behov[]): Varning[] {
  const perSkal = new Map<string, { okand: boolean; namn: string[] }>()
  for (const b of behov) {
    for (const s of skalForPerson(p, b)) {
      const text = skaltext(s)
      const rad = perSkal.get(text) ?? { okand: s.typ === 'okand_allergen' || s.typ === 'okant_val', namn: [] }
      if (!rad.namn.includes(b.namn)) rad.namn.push(b.namn)
      perSkal.set(text, rad)
    }
  }
  const ut = [...perSkal].map(([text, { okand, namn }]) => ({
    text: `${text}, ${okand ? 'gäller' : 'passar inte'} ${uppraknade(namn)}`,
    okand,
  }))
  return [...ut.filter((v) => !v.okand), ...ut.filter((v) => v.okand)]
}

/** En persons kostbehov på en rad: "Vegetarisk, glutenfri, tål inte nötter och sesam". Tom text när inget är angivet. */
export function behovstext(b: Omit<Behov, 'namn'>): string {
  const val = KOSTVAL.filter((k) => b[k.nyckel]).map((k) => k.etikett.toLowerCase())
  // Vegansk innebär vegetarisk, så det räcker att skriva vegansk.
  const visade = b.vegansk ? val.filter((v) => v !== 'vegetarisk') : val
  const delar = [...visade]
  // Glutenfri säger redan att personen inte tål gluten, så det skrivs inte två gånger. Laktosfri och mjölk är olika
  // saker (laktos och mjölkprotein) och skrivs båda.
  const utan = ALLERGENER.filter((a) => b.utan.includes(a.nyckel) && !(a.nyckel === 'gluten' && b.glutenfri)).map((a) => a.etikett.toLowerCase())
  if (utan.length) delar.push(`tål inte ${uppraknade(utan)}`)
  const text = delar.join(', ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Texten vid kryssrutan för samtycke. Kostbehov sparas bara när den är ikryssad. */
export const SAMTYCKE = 'Jag samtycker till att mina kostbehov och allergier sparas och visas för deltagarna i den här turen.'

/**
 * Vad en person har sagt om sina kostbehov i turen. Ingen rad betyder att personen inte har svarat, och en rad
 * utan val betyder att personen har sagt att den inte har några kostbehov.
 */
export type Kostsvar = { lage: 'behov'; text: string } | { lage: 'inga' } | { lage: 'inte-svarat' } | { lage: 'utan-konto' }

export function kostsvar(person: { user_id: string | null }, rad: Omit<Behov, 'namn'> | undefined): Kostsvar {
  if (rad) {
    const text = behovstext(rad)
    return text ? { lage: 'behov', text } : { lage: 'inga' }
  }
  return person.user_id === null ? { lage: 'utan-konto' } : { lage: 'inte-svarat' }
}

/** Texten för ett svar: kostbehoven, "Inga kostbehov" eller att uppgifterna saknas. */
export function kostsvarText(svar: Kostsvar): string {
  if (svar.lage === 'behov') return svar.text
  if (svar.lage === 'inga') return 'Inga kostbehov'
  if (svar.lage === 'inte-svarat') return 'Har inte angett något än'
  return 'Kan fylla i själv när hen har gått med'
}

/** Filtret i ord, till exempel "Glutenfri, utan sesam". null utan filter. */
export function filterText(f: Kostfilter): string | null {
  const delar = [
    ...KOSTVAL.filter((k) => f.val.includes(k.nyckel)).map((k) => k.etikett.toLowerCase()),
    // Glutenfri säger redan utan gluten.
    ...ALLERGENER.filter((a) => f.utan.includes(a.nyckel) && !(a.nyckel === 'gluten' && f.val.includes('glutenfri'))).map((a) => `utan ${a.etikett.toLowerCase()}`),
  ]
  if (delar.length === 0) return null
  const text = delar.join(', ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
