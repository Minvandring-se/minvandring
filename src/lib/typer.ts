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
