import type { Roll } from './roller'
import type { Typ } from './vikt'

/** En sak i Mitt förråd, som raden ser ut i forradssaker. */
export interface Forradssak {
  id: string
  /** Produkten i katalogen som saken valdes från, om den inte är inskriven för hand. */
  produkt_id: string | null
  namn: string
  kategori: string
  /** Frivillig. Hör alltid till kategorin. */
  underkategori: string | null
  antal: number
  vikt_g: number | null
  typ: Typ
  notering: string | null
  /** Produkten saken kommer från, när listan hämtas med den. Saknas för saker man har skrivit in själv. */
  produkter?: ForradsProdukt | null
}

/** Det som förrådet visar om produkten en sak kommer från. */
export interface ForradsProdukt {
  id: string
  marke: string
  modell: string
  /** Katalogens vikt. Jämförs med sakens egen vikt. */
  packvikt_g: number | null
  kontrollerad: string | null
  version: string | null
  underkategori: string
  minvikt_g: number | null
  /** Tillverkarens sida. */
  kalla: string
  egenskaper: Record<string, unknown>
}

/** En produkt i katalogen, med det som sökningen visar. */
export interface Produkt {
  id: string
  marke: string
  modell: string
  version: string | null
  kategori: string
  underkategori: string
  packvikt_g: number
  /** Dagen produkten kontrollerades mot tillverkarens uppgifter. null = inte granskad än. */
  kontrollerad: string | null
}

export interface Tur {
  id: string
  namn: string
  destination: string | null
  startpunkt: string | null
  avresa: string | null
  hemkomst: string | null
  /** Antal vandringsdagar. null tills någon har angett det. */
  dagar: number | null
  reservdagar: number
}

export interface DeltagareRad {
  id: string
  namn: string
  typ: 'person' | 'hund'
  roll: Roll
  user_id: string | null
}
