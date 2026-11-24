import type { Allergen } from './kost'
import type { Roll } from './roller'
import type { Typ } from './vikt'

/** Var uppgifterna om en produkt kommer från: tillverkarens sida, eller butikens när tillverkaren saknar vikt. */
export type KallaTyp = 'tillverkare' | 'butik'

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
  /** När saken lades till, när listan hämtas med det. Används för sorteringen Senast tillagd. */
  skapad?: string
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
  /** Dagen en grundare stickprovskontrollerade genomgången produkten ingick i. */
  kontrollerad: string | null
  /** Dagen vikten jämfördes med tillverkarens sida. */
  granskad: string | null
  kalla_typ: KallaTyp
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
  /** Dagen en grundare stickprovskontrollerade genomgången produkten ingick i. */
  kontrollerad: string | null
  /** Dagen vikten jämfördes med tillverkarens sida. */
  granskad: string | null
  kalla_typ: KallaTyp
}

/** En produkt i Utrustningskatalogen, med det som visas när kortet fälls ut. */
export interface Katalogprodukt extends Produkt {
  minvikt_g: number | null
  pris_sek_ca: number | null
  /** Tillverkarens sida, eller butikens när kalla_typ är butik. */
  kalla: string
  egenskaper: Record<string, unknown>
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

/** Måltiderna i matplanen, som de står i maltider.maltid. */
export type Maltid = 'frukost' | 'lunch' | 'middag' | 'mellanmal'

/** Vilken måltid en påse i matkatalogen är gjord för. */
export type Katalogmaltid = 'frukost' | 'lunch_middag' | 'dessert' | 'mellanmal'

/** En påse i matkatalogen. Näringen gäller hela påsen. Tomma kostval och allergener betyder okänt. */
export interface Matprodukt {
  id: string
  marke: string
  namn: string
  maltid: Katalogmaltid
  torkning: 'frystorkad' | 'lufttorkad' | null
  vikt_torr_g: number
  portioner: number
  kcal: number
  protein_g: number | null
  fett_g: number | null
  kolhydrater_g: number | null
  vatten_ml: number | null
  tillagning_vatten: 'varmt' | 'kallt' | 'varmt_eller_kallt' | 'inget' | null
  tillagning_min: number | null
  vegetarisk: boolean | null
  vegansk: boolean | null
  glutenfri: boolean | null
  laktosfri: boolean | null
  allergener: Allergen[] | null
  /** Kan innehålla spår av. */
  spar: Allergen[] | null
  pris_sek_ca: number | null
  /** Butikens produktsida när priset kommer från en butik. */
  pris_kalla: string | null
  kalla: string
  kontrollerad: string | null
}

/** En påse man har hemma, i ens eget skafferi. bast_fore är ÅÅÅÅ-MM-DD. */
export interface Skafferirad {
  id: string
  matprodukt_id: string
  antal: number
  bast_fore: string | null
}

/** En ingrediens i ett eget recept. Gram per portion, kcal och protein per 100 g. */
export interface Receptrad {
  id: string
  recept_id: string
  vara: string
  gram_per_portion: number
  kcal_per_100g: number | null
  protein_per_100g: number | null
  sortering: number
}

/** Ett eget recept på kontot. Kopieras till turens rätter när det läggs i en tur. */
export interface Recept {
  id: string
  namn: string
  rader: Receptrad[]
}

/** En rätt i turen: en egen rätt med ingredienser, eller en påse ur katalogen (matprodukt_id). */
export interface Ratt {
  id: string
  namn: string
  matprodukt_id: string | null
  /** Bara för påsar. Egna rätter har ansvarig och klart på varorna. */
  ansvarig: string | null
  klart: boolean
}

/** En vara i turen. Ingår i egna rätter och står i inköpslistan. */
export interface Vara {
  id: string
  namn: string
  kcal_per_100g: number | null
  protein_per_100g: number | null
  /** Mängd utöver recepten, till exempel kaffe. */
  extra_g: number
  varifran: 'kopa' | 'hemifran' | null
  ansvarig: string | null
  klart: boolean
}

export interface Ingrediens {
  id: string
  ratt_id: string
  vara_id: string
  gram_per_portion: number
}

/** En rätt i en måltid en viss dag. En måltid kan ha flera rätter. */
export interface Maltidsrad {
  id: string
  dag: number
  maltid: Maltid
  ratt_id: string
  sortering: number
}

/** En deltagares kostbehov, som raden ser ut i kostbehov. */
export interface Kostbehov {
  deltagare_id: string
  vegetarisk: boolean
  vegansk: boolean
  glutenfri: boolean
  laktosfri: boolean
  utan: Allergen[]
  /** När personen samtyckte till att uppgifterna sparas och visas för deltagarna i turen. */
  samtycke_tid: string
}

/** Om livsmedlet är torrt, rått eller tillagat. Vandrare packar torr vikt, så det ska synas i förslagen. */
export type Tillstand = 'torr' | 'ra' | 'tillagad'

/** Ett livsmedel som det ligger i tabellen livsmedel. Värdena gäller 100 g, och null betyder att värdet saknas. */
export interface Livsmedel {
  nummer: number
  namn: string
  grupp: string | null
  tillstand: Tillstand | null
  kcal_per_100g: number | null
  protein_per_100g: number | null
  fett_per_100g: number | null
  kolhydrater_per_100g: number | null
  fiber_per_100g: number | null
  sockerarter_per_100g: number | null
  salt_per_100g: number | null
  vatten_per_100g: number | null
  /** Datumet för livsmedlets version hos Livsmedelsverket (ÅÅÅÅ-MM-DD). */
  version: string | null
}
