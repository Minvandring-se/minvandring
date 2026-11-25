import type { Enhet } from './handla'
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
  /** Brännaren eller det kompletta köket ett kokkärl eller bränsle hör till i ens kök, när listan hämtas med det. */
  kok_id?: string | null
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
  /** Egenskaperna för underkategorin. Hämtas när sökningen behöver dem, till exempel storleken vikten gäller. */
  egenskaper?: Record<string, unknown>
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

export type Boende = 'stuga' | 'talt' | 'annat'

/** En dag i turen, som den står i etapper. */
export interface Etapp {
  id: string
  tur_id: string
  dag: number
  fran: string | null
  till: string | null
  /** Kilometer med en decimal. Supabase skickar numeric som text eller tal, så det tolkas med kmFran. */
  km: number | string | null
  /** Var man sover efter dagens etapp. */
  natt: string | null
  boende: Boende | null
  bokad: boolean
  notering: string | null
}

export interface DeltagareRad {
  id: string
  namn: string
  typ: 'person' | 'hund'
  roll: Roll
  user_id: string | null
}

/** En rad i turens packlista, som den står i packrader. */
export interface PackradRad {
  id: string
  tur_id: string
  namn: string
  /** Förrådets kategorinyckel, till exempel sova. */
  kategori: string
  underkategori: string | null
  /** Produkten i katalogen raden kom från. */
  produkt_id: string | null
  antal: number
  vikt_g: number | null
  typ: Typ
  /** Deltagaren som bär raden. Tomt när alla = true. */
  bars_av: string | null
  /** Varje person har en egen, till exempel sovsäck. */
  alla: boolean
  /** En person bär raden åt gruppen. */
  gemensam: boolean
  /** Svaret att alla rader av samma sort behövs, så att appen inte frågar igen. */
  dubblett_ok: boolean
  med: boolean
  notering: string | null
  sortering: number
}

/** En deltagares bock på en packrad och, på rader som alla ska ha, hens egen modell. */
export interface PackstatusRad {
  packrad_id: string
  deltagare_id: string
  tur_id: string
  packad: boolean
  namn: string | null
  vikt_g: number | null
  produkt_id: string | null
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
  /** Andra namn på påsen, till exempel det svenska. Bara för sökningen. Det första visas under namnet. */
  andra_namn: string[]
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

/** Kategorierna i varukatalogen. Nycklarna står också i migreringen varukatalog. */
export type Varukategori = 'brod' | 'frukost' | 'ost_mejeri' | 'korv_chark' | 'snabbmat' | 'tuber_smaksattning' | 'mellanmal' | 'drycker' | 'glutenfritt'

/** En märkesvara i varukatalogen, med näring per 100 g. Tomma kostval och allergener betyder okänt. */
export interface Varukatalogvara {
  id: string
  marke: string
  namn: string
  kategori: Varukategori
  forpackning_g: number
  portion_g: number | null
  kcal_per_100g: number
  protein_per_100g: number | null
  fett_per_100g: number | null
  kolhydrater_per_100g: number | null
  fiber_per_100g: number | null
  socker_per_100g: number | null
  salt_per_100g: number | null
  vatten_ml: number | null
  tillagning: string | null
  vegetarisk: boolean | null
  vegansk: boolean | null
  glutenfri: boolean | null
  laktosfri: boolean | null
  allergener: Allergen[] | null
  /** Kan innehålla spår av. */
  spar: Allergen[] | null
  haller_utan_kyl: boolean | null
  ean: string | null
  pris_sek_ca: number | null
  pris_kalla: string | null
  kalla: string
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
  /** Mängd och enhet som receptet skrevs med, till exempel 2 dl. Tomt för det som bara ska med, som salt. */
  mangd: number | null
  enhet: Enhet | null
  /** Vikten som energin räknas med. Räknas ut för g och kg, frivillig för andra enheter. */
  gram_per_portion: number | null
  kcal_per_100g: number | null
  protein_per_100g: number | null
  sortering: number
  /** Varan i varukatalogen som raden valdes från. */
  varukatalog_id?: string | null
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
  /** Butiksavdelningen. Tom: appen gissar utifrån namnet (avdelningFor i handla.ts). */
  avdelning?: string | null
  /** Varan i varukatalogen som den valdes från. Då är allergenerna och kostvalen kända. */
  varukatalog_id?: string | null
}

export interface Ingrediens {
  id: string
  ratt_id: string
  vara_id: string
  /** Mängd och enhet som rätten skrevs med. Tomt för det som bara ska med, som salt. */
  mangd: number | null
  enhet: Enhet | null
  /** Vikten som energin räknas med. Räknas ut för g och kg, frivillig för andra enheter. */
  gram_per_portion: number | null
}

/** En bock i inköpslistan: deltagaren har köpt varan eller påsen (en rätt ur matkatalogen). */
export interface InkopKlart {
  deltagare_id: string
  vara_id: string | null
  ratt_id: string | null
}

/** En rätt i en måltid en viss dag. En måltid kan ha flera rätter. */
export interface Maltidsrad {
  id: string
  dag: number
  maltid: Maltid
  ratt_id: string
  sortering: number
  /** Deltagaren som bär raden. Tomt när ingen gör det. */
  bars_av?: string | null
}

/** En som äter en rad i matplanen, som raden ser ut i maltid_atare. Inga rader för en måltid betyder att alla äter. */
export interface Matatare {
  maltid_id: string
  deltagare_id: string
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
  /** EU:s 14 allergener för enkla råvaror. null: okänt. Tom: ingen av dem. */
  allergener: Allergen[] | null
}
