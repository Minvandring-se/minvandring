// Mitt förråd: kategorierna, summeringarna och valideringen av en sak. Rena funktioner utan databas.
import {
  Backpack,
  BedDouble,
  BriefcaseMedical,
  Compass,
  CookingPot,
  Droplets,
  Flashlight,
  Footprints,
  Package,
  Shirt,
  Snowflake,
  SprayCan,
  Tent,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { granskning } from './granskning'
import { visaEgenskaper } from './produktegenskaper'
import type { Forradssak } from './typer'
import { tolkaVikt } from './viktfalt'
import type { Typ } from './vikt'

export interface Underkategori {
  /** Det som sparas i databasen. Unik bland alla underkategorier, så den hör till exakt en huvudkategori. */
  nyckel: string
  etikett: string
  /** Bara när underkategorin har en annan förvald typ än sin huvudkategori. */
  typ?: Typ
}

export interface Kategori {
  /** Det som sparas i databasen. Samma nycklar finns i tabellerna kategorier och underkategorier. */
  nyckel: string
  etikett: string
  ikon: LucideIcon
  /** Typen en ny sak i kategorin får, tills man väljer en annan. */
  typ: Typ
  under: readonly Underkategori[]
}

/** Huvudkategorierna med sina underkategorier, i den ordning de visas. */
export const KATEGORIER = [
  {
    nyckel: 'packning',
    etikett: 'Ryggsäck och packning',
    ikon: Backpack,
    typ: 'ryggsack',
    under: [
      { nyckel: 'ryggsack', etikett: 'Ryggsäck' },
      { nyckel: 'dagsryggsack', etikett: 'Dagsryggsäck' },
      { nyckel: 'packpasar', etikett: 'Packpåsar och organisering' },
      { nyckel: 'regnskydd', etikett: 'Regnskydd och innersäck' },
      { nyckel: 'ryggsackstillbehor', etikett: 'Tillbehör' },
    ],
  },
  {
    nyckel: 'talt',
    etikett: 'Tält och vindskydd',
    ikon: Tent,
    typ: 'ryggsack',
    under: [
      { nyckel: 'talt', etikett: 'Tält' },
      { nyckel: 'tarp', etikett: 'Tarp' },
      { nyckel: 'vindsack', etikett: 'Vindsäck och bivacksäck' },
      { nyckel: 'hangmatta', etikett: 'Hängmatta' },
      { nyckel: 'talttillbehor', etikett: 'Tältpinnar, stänger och tillbehör' },
    ],
  },
  {
    nyckel: 'sova',
    etikett: 'Sova',
    ikon: BedDouble,
    typ: 'ryggsack',
    under: [
      { nyckel: 'sovsack', etikett: 'Sovsäck' },
      { nyckel: 'quilt', etikett: 'Quilt' },
      { nyckel: 'liggunderlag', etikett: 'Liggunderlag' },
      { nyckel: 'kudde', etikett: 'Kudde' },
      { nyckel: 'lakan', etikett: 'Lakan (liner)' },
      { nyckel: 'sittunderlag', etikett: 'Sittunderlag och stol' },
      { nyckel: 'pump', etikett: 'Pump och pumpsäck' },
    ],
  },
  {
    nyckel: 'kok',
    etikett: 'Kök',
    ikon: CookingPot,
    typ: 'ryggsack',
    under: [
      { nyckel: 'komplett_kok', etikett: 'Kompletta kök' },
      { nyckel: 'brannare', etikett: 'Brännare' },
      { nyckel: 'bransle', etikett: 'Bränsle', typ: 'forbrukas' },
      { nyckel: 'kastrull', etikett: 'Kokkärl och stekpannor' },
      { nyckel: 'kasa', etikett: 'Kåsa och mugg' },
      { nyckel: 'bestick', etikett: 'Bestick' },
      { nyckel: 'kaffe', etikett: 'Kaffe och te' },
      { nyckel: 'disk', etikett: 'Disk' },
      { nyckel: 'matforvaring', etikett: 'Matförvaring' },
    ],
  },
  {
    nyckel: 'vatten',
    etikett: 'Vatten',
    ikon: Droplets,
    typ: 'ryggsack',
    under: [
      { nyckel: 'flaska', etikett: 'Flaska' },
      { nyckel: 'dricksystem', etikett: 'Vattensäck och dricksystem' },
      { nyckel: 'filter', etikett: 'Filter' },
      { nyckel: 'rening', etikett: 'Reningstabletter', typ: 'forbrukas' },
      { nyckel: 'vattendunk', etikett: 'Vattendunk och behållare' },
    ],
  },
  {
    nyckel: 'klader',
    etikett: 'Kläder',
    ikon: Shirt,
    typ: 'ryggsack',
    under: [
      { nyckel: 'understall', etikett: 'Underställ' },
      { nyckel: 'mellanlager', etikett: 'Mellanlager och fleece' },
      { nyckel: 'isolering', etikett: 'Dun- och syntetjacka' },
      { nyckel: 'vindklader', etikett: 'Vindkläder' },
      { nyckel: 'regnklader', etikett: 'Regnkläder' },
      { nyckel: 'byxor', etikett: 'Byxor och shorts' },
      { nyckel: 'trojor', etikett: 'Tröjor och t-shirts' },
      { nyckel: 'underklader', etikett: 'Underkläder' },
      { nyckel: 'strumpor', etikett: 'Strumpor' },
      { nyckel: 'huvudbonad', etikett: 'Mössa och keps' },
      { nyckel: 'handskar', etikett: 'Handskar och vantar' },
      { nyckel: 'myggklader', etikett: 'Myggnät och myggkläder' },
      { nyckel: 'solglasogon', etikett: 'Solglasögon', typ: 'kropp' },
    ],
  },
  {
    nyckel: 'skor',
    etikett: 'Skor',
    ikon: Footprints,
    typ: 'kropp',
    under: [
      { nyckel: 'kangor', etikett: 'Kängor och vandringsskor', typ: 'kropp' },
      { nyckel: 'lagerskor', etikett: 'Lägerskor och sandaler', typ: 'ryggsack' },
      { nyckel: 'damasker', etikett: 'Damasker', typ: 'ryggsack' },
      { nyckel: 'broddar', etikett: 'Broddar', typ: 'ryggsack' },
    ],
  },
  {
    nyckel: 'prylar',
    etikett: 'Prylar och elektronik',
    ikon: Flashlight,
    typ: 'ryggsack',
    under: [
      { nyckel: 'pannlampa', etikett: 'Pannlampa och belysning' },
      { nyckel: 'powerbank', etikett: 'Powerbank och batterier' },
      { nyckel: 'laddning', etikett: 'Laddare och kablar' },
      { nyckel: 'solpanel', etikett: 'Solpanel' },
      { nyckel: 'kommunikation', etikett: 'GPS, nödsändare och satellit' },
      { nyckel: 'klocka', etikett: 'Klocka' },
      { nyckel: 'ljud', etikett: 'Hörlurar och högtalare' },
      { nyckel: 'kamera', etikett: 'Kamera och tillbehör' },
    ],
  },
  {
    nyckel: 'sakerhet',
    etikett: 'Säkerhet och navigation',
    ikon: Compass,
    typ: 'ryggsack',
    under: [
      { nyckel: 'karta', etikett: 'Karta och kompass' },
      { nyckel: 'eld', etikett: 'Eld och tändare' },
      { nyckel: 'nodutrustning', etikett: 'Nödutrustning (visselpipa, räddningsfilt)' },
    ],
  },
  {
    nyckel: 'verktyg',
    etikett: 'Verktyg',
    ikon: Wrench,
    typ: 'ryggsack',
    under: [
      { nyckel: 'kniv', etikett: 'Kniv och multiverktyg' },
      { nyckel: 'stavar', etikett: 'Vandringsstavar' },
      { nyckel: 'lagning', etikett: 'Lagning' },
      { nyckel: 'yxa', etikett: 'Yxa och såg' },
    ],
  },
  {
    nyckel: 'medicin',
    etikett: 'Första hjälpen och medicin',
    ikon: BriefcaseMedical,
    typ: 'ryggsack',
    under: [
      { nyckel: 'forband', etikett: 'Förbandslåda och förband' },
      { nyckel: 'skavsar', etikett: 'Skavsår', typ: 'forbrukas' },
      { nyckel: 'mediciner', etikett: 'Mediciner', typ: 'forbrukas' },
      { nyckel: 'salvor', etikett: 'Salvor och krämer' },
    ],
  },
  {
    nyckel: 'vinter',
    etikett: 'Vinter',
    ikon: Snowflake,
    typ: 'ryggsack',
    under: [
      { nyckel: 'skidor', etikett: 'Skidor och stighudar' },
      { nyckel: 'pulka', etikett: 'Pulka och dragsele' },
      { nyckel: 'snoskor', etikett: 'Snöskor' },
      { nyckel: 'snospade', etikett: 'Snöspade och snösåg' },
      { nyckel: 'lavin', etikett: 'Lavinutrustning' },
    ],
  },
  {
    nyckel: 'hygien',
    etikett: 'Hygien',
    ikon: SprayCan,
    typ: 'ryggsack',
    under: [
      { nyckel: 'toalett', etikett: 'Toalett och tandvård' },
      { nyckel: 'tvatt', etikett: 'Tvål och tvätt' },
      { nyckel: 'personlig', etikett: 'Personlig vård' },
      { nyckel: 'sol_mygg', etikett: 'Solkräm och myggmedel', typ: 'forbrukas' },
    ],
  },
  {
    nyckel: 'ovrigt',
    etikett: 'Övrigt',
    ikon: Package,
    typ: 'ryggsack',
    under: [
      { nyckel: 'fiske', etikett: 'Fiske' },
      { nyckel: 'bocker', etikett: 'Böcker och spel' },
      { nyckel: 'ovrigt', etikett: 'Övrigt' },
    ],
  },
] as const satisfies readonly Kategori[]

export type KategoriNyckel = (typeof KATEGORIER)[number]['nyckel']
export type UnderkategoriNyckel = (typeof KATEGORIER)[number]['under'][number]['nyckel']

/** Samma lista utan de exakta nyckeltyperna, för uppslag med vanlig text. */
const ALLA: readonly Kategori[] = KATEGORIER

export const TYPNAMN: Record<Typ, string> = {
  ryggsack: 'I ryggsäcken',
  kropp: 'På kroppen',
  forbrukas: 'Förbrukas',
}

/**
 * De två kryssrutorna som bestämmer typen i formuläret. Ingen ikryssad betyder att saken ligger i ryggsäcken.
 * De utesluter varandra, eftersom en sak bara har en typ.
 */
export const TYPVAL = [
  { typ: 'forbrukas', etikett: 'Går åt under turen', hjalp: 'Räknas inte in i basvikten' },
  { typ: 'kropp', etikett: 'Jag har den på mig', hjalp: 'Räknas inte in i ryggsäcken' },
] as const satisfies readonly { typ: Exclude<Typ, 'ryggsack'>; etikett: string; hjalp: string }[]

/** Typen efter att en av kryssrutorna har kryssats i eller ur. Kryssas den ena i avmarkeras den andra. */
export function typEfterVal(val: Exclude<Typ, 'ryggsack'>, ikryssad: boolean): Typ {
  return ikryssad ? val : 'ryggsack'
}

export function arKategori(varde: unknown): varde is KategoriNyckel {
  return ALLA.some((k) => k.nyckel === varde)
}

/** Kategorin för en nyckel. En okänd nyckel räknas som Övrigt, så att saken ändå syns. */
export function kategoriFor(nyckel: string): Kategori {
  return ALLA.find((k) => k.nyckel === nyckel) ?? ALLA[ALLA.length - 1]
}

/** Underkategorin i en huvudkategori, eller null om den inte finns där. */
export function underkategoriFor(kategori: string, underkategori: string | null): Underkategori | null {
  if (!underkategori) return null
  return ALLA.find((k) => k.nyckel === kategori)?.under.find((u) => u.nyckel === underkategori) ?? null
}

/** Huvudkategorin som en underkategori hör till, eller null om underkategorin inte finns. */
export function kategoriForUnder(underkategori: string): Kategori | null {
  return ALLA.find((k) => k.under.some((u) => u.nyckel === underkategori)) ?? null
}

/** Underkategorierna i en huvudkategori, i samma ordning som i KATEGORIER. Ingen eller en okänd kategori ger en tom lista. */
export function underkategorierFor(kategori: string): readonly Underkategori[] {
  return ALLA.find((k) => k.nyckel === kategori)?.under ?? []
}

/** Ett alternativ i kategorifiltret. Antalet visas inom parentes när det finns. */
export interface Filterval {
  nyckel: string
  etikett: string
  antal?: number
}

/** Typen en ny sak får: underkategorins förval om det finns ett, annars huvudkategorins. */
export function forvaldTyp(kategori: string, underkategori: string | null = null): Typ {
  return underkategoriFor(kategori, underkategori)?.typ ?? kategoriFor(kategori).typ
}

/** Vikt i gram, eller i kilo från 1000 g: "850 g", "1 kg", "1,25 kg". */
export function formateraVikt(g: number): string {
  if (g < 1000) return `${Math.round(g)} g`
  const kg = (g / 1000).toFixed(2).replace(/\.?0+$/, '')
  return `${kg.replace('.', ',')} kg`
}

export interface Kategorigrupp {
  kategori: Kategori
  /** Sakerna i kategorin, i bokstavsordning. */
  saker: Forradssak[]
  /** Antal saker, där tre flaskor räknas som tre. */
  antal: number
  viktG: number
  /** Antal rader som saknar vikt och därför inte är med i summan. */
  utanVikt: number
}

export interface Forradssumma {
  /** Huvudkategorier som har saker, i KATEGORIER-ordning. */
  grupper: Kategorigrupp[]
  antal: number
  viktG: number
  utanVikt: number
}

/** Grupperar förrådet per huvudkategori och summerar antal och vikt. Saker utan vikt räknas som 0 g. */
export function summeraForrad(saker: Forradssak[]): Forradssumma {
  const grupper: Kategorigrupp[] = []
  for (const kategori of ALLA) {
    const egna = saker
      .filter((s) => kategoriFor(s.kategori).nyckel === kategori.nyckel)
      .sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))
    if (egna.length === 0) continue
    grupper.push({
      kategori,
      saker: egna,
      antal: egna.reduce((s, x) => s + x.antal, 0),
      viktG: egna.reduce((s, x) => s + x.antal * (x.vikt_g ?? 0), 0),
      utanVikt: egna.filter((x) => x.vikt_g === null).length,
    })
  }
  return {
    grupper,
    antal: grupper.reduce((s, g) => s + g.antal, 0),
    viktG: grupper.reduce((s, g) => s + g.viktG, 0),
    utanVikt: grupper.reduce((s, g) => s + g.utanVikt, 0),
  }
}

/** Det som står i formuläret, som text. Tom kategori betyder att ingen är vald än, tom underkategori att den hoppas över. */
export interface SakFalt {
  namn: string
  kategori: string
  underkategori: string
  typ: string
  antal: string
  vikt: string
  notering: string
}

/** Det som sparas i forradssaker. */
export type SakVarden = Pick<Forradssak, 'namn' | 'kategori' | 'underkategori' | 'typ' | 'antal' | 'vikt_g' | 'notering'>

export const MAX_NAMN = 80
export const MAX_NOTERING = 300
export const MAX_ANTAL = 99
export { MAX_VIKT_G } from './viktfalt'

const HELTAL = /^\d+$/

/** Kontrollerar formuläret och gör om det till det som sparas. Underkategorin och vikten får vara tomma. Ett ogiltigt värde sparas aldrig. */
export function tolkaSak(falt: SakFalt): { ok: true; varden: SakVarden } | { ok: false; fel: string } {
  const namn = falt.namn.trim()
  if (!namn) return { ok: false, fel: 'Skriv vad saken heter.' }
  if (namn.length > MAX_NAMN) return { ok: false, fel: `Namnet får vara högst ${MAX_NAMN} tecken.` }
  if (!arKategori(falt.kategori)) return { ok: false, fel: 'Välj en kategori.' }
  const underkategori = falt.underkategori || null
  if (underkategori && !underkategoriFor(falt.kategori, underkategori)) return { ok: false, fel: 'Underkategorin hör inte till den valda kategorin.' }
  if (!Object.hasOwn(TYPNAMN, falt.typ)) return { ok: false, fel: 'Välj var saken bärs.' }

  const antalText = falt.antal.trim()
  const antal = HELTAL.test(antalText) ? Number(antalText) : NaN
  if (!(antal >= 1 && antal <= MAX_ANTAL)) return { ok: false, fel: `Antal ska vara ett heltal mellan 1 och ${MAX_ANTAL}.` }

  // Vikten får skrivas i gram eller kilo: "1250", "1250 g" eller "1,25 kg".
  const vikt = tolkaVikt(falt.vikt)
  if (!vikt.ok) return { ok: false, fel: vikt.fel }
  const vikt_g = vikt.g

  const notering = falt.notering.trim()
  if (notering.length > MAX_NOTERING) return { ok: false, fel: `Anteckningen får vara högst ${MAX_NOTERING} tecken.` }

  return {
    ok: true,
    varden: { namn, kategori: falt.kategori, underkategori, typ: falt.typ as Typ, antal, vikt_g, notering: notering || null },
  }
}

/** Det som kan vara ifyllt i förväg i formuläret för en ny sak. */
export interface Forval {
  namn?: string
  kategori?: KategoriNyckel
  underkategori?: UnderkategoriNyckel
  /** Vikten per styck, när saken kommer från en produkt i katalogen. */
  vikt_g?: number | null
  /** Produkten saken kommer från. Sparas med saken, så att den kopplas till katalogen. */
  produkt_id?: string
}

/** Formulärets startvärden: en befintlig sak, eller en ny med eventuellt förvalt namn, kategori, underkategori och vikt. */
export function faltFran(sak?: Forradssak, forval?: Forval): SakFalt {
  if (!sak) {
    const kategori = forval?.kategori ?? ''
    const underkategori = forval?.underkategori ?? ''
    const namn = (forval?.namn ?? '').trim().slice(0, MAX_NAMN)
    const vikt = forval?.vikt_g == null ? '' : String(forval.vikt_g)
    return { namn, kategori, underkategori, typ: forvaldTyp(kategori, underkategori), antal: '1', vikt, notering: '' }
  }
  return {
    namn: sak.namn,
    kategori: kategoriFor(sak.kategori).nyckel,
    underkategori: underkategoriFor(sak.kategori, sak.underkategori)?.nyckel ?? '',
    typ: sak.typ,
    antal: String(sak.antal),
    vikt: sak.vikt_g === null ? '' : String(sak.vikt_g),
    notering: sak.notering ?? '',
  }
}

/** Formuläret efter att en huvudkategori har valts: underkategorin nollställs och typen följer kategorin. */
export function medKategori(falt: SakFalt, kategori: string): SakFalt {
  return { ...falt, kategori, underkategori: '', typ: forvaldTyp(kategori) }
}

/** Formuläret efter att en underkategori har valts eller valts bort (tom text). Typen följer valet. */
export function medUnderkategori(falt: SakFalt, underkategori: string): SakFalt {
  return { ...falt, underkategori, typ: forvaldTyp(falt.kategori, underkategori) }
}

/**
 * Jämför sakens vikt med katalogens. egen är sann när saken kommer från katalogen och användaren har
 * en annan vikt än den som står där, till exempel efter att ha vägt sitt eget tält.
 * Saker man har skrivit in själv, och produkter utan vikt i katalogen, har aldrig en egen vikt.
 */
export function viktjamforelse(sak: Forradssak): { egen: boolean; katalogG: number | null } {
  const katalogG = sak.produkt_id && sak.produkter ? (sak.produkter.packvikt_g ?? null) : null
  return { egen: katalogG !== null && sak.vikt_g !== katalogG, katalogG }
}

export interface Detaljrad {
  etikett: string
  varde: string
}

export interface Sakdetaljer {
  /** Det som gäller alla saker: kategori, vikt, antal och hur saken räknas. */
  grund: Detaljrad[]
  /** De viktigaste egenskaperna för underkategorin. Tomt för saker man har skrivit in själv. */
  viktiga: Detaljrad[]
  /** Övriga uppgifter från katalogen, som visas under "Visa alla specifikationer". */
  ovriga: Detaljrad[]
}

/**
 * Det som visas när en sak fälls ut. Egenskaperna kommer från katalogen och beror på underkategorin,
 * så ett tält och en sovsäck visar olika saker.
 */
export function sakdetaljer(sak: Forradssak): Sakdetaljer {
  const kategori = kategoriFor(sak.kategori)
  const under = underkategoriFor(sak.kategori, sak.underkategori)
  const { egen, katalogG } = viktjamforelse(sak)
  const vikt = sak.vikt_g === null ? 'Ingen vikt' : formateraVikt(sak.vikt_g)

  const grund: Detaljrad[] = [
    { etikett: 'Kategori', varde: under && under.etikett !== kategori.etikett ? `${kategori.etikett}, ${under.etikett}` : kategori.etikett },
    { etikett: 'Vikt per styck', varde: egen && sak.vikt_g !== null ? `${vikt} (egen vikt)` : vikt },
  ]
  if (egen && katalogG !== null) grund.push({ etikett: 'Katalogens vikt', varde: formateraVikt(katalogG) })
  grund.push({ etikett: 'Antal', varde: String(sak.antal) }, { etikett: 'Räknas som', varde: TYPNAMN[sak.typ] })

  const p = sak.produkter
  if (!p) return { grund, viktiga: [], ovriga: [] }
  const egenskaper = egenskapsdelar(p)
  const ovriga: Detaljrad[] = []
  if (p.version) ovriga.push({ etikett: 'Version', varde: p.version })
  if (p.minvikt_g) ovriga.push({ etikett: 'Minsta vikt', varde: formateraVikt(p.minvikt_g) })
  ovriga.push(...egenskaper.ovriga)
  return { grund, viktiga: egenskaper.viktiga, ovriga }
}

/**
 * Katalogens egenskaper för en produkt, delade i de viktigaste för underkategorin (som visas direkt) och de övriga
 * (under "Visa alla specifikationer"). Gemensamt för Mitt förråd och Utrustningskatalogen.
 */
export function egenskapsdelar(p: { underkategori: string; egenskaper: Record<string, unknown> | null | undefined }): { viktiga: Detaljrad[]; ovriga: Detaljrad[] } {
  const egenskaper = visaEgenskaper(p.underkategori, p.egenskaper)
  return { viktiga: egenskaper.filter((e) => e.viktig), ovriga: egenskaper.filter((e) => !e.viktig) }
}

export interface Produktdetaljer {
  /** Vikten, minsta vikten och det ungefärliga priset, det som finns. */
  grund: Detaljrad[]
  viktiga: Detaljrad[]
  ovriga: Detaljrad[]
}

/** Pris i hela kronor med mellanrum mellan tusentalen: "1 299 kr". */
function formateraPris(kr: number): string {
  return `${kr.toLocaleString('sv-SE')} kr`
}

/**
 * Det som visas när ett kort i Utrustningskatalogen fälls ut: vikt, minsta vikt och ungefärligt pris när de finns,
 * och egenskaperna delade som i Mitt förråd.
 */
export function produktdetaljer(p: {
  packvikt_g: number
  minvikt_g: number | null
  pris_sek_ca: number | null
  underkategori: string
  egenskaper: Record<string, unknown> | null | undefined
}): Produktdetaljer {
  const grund: Detaljrad[] = [{ etikett: 'Vikt', varde: formateraVikt(p.packvikt_g) }]
  if (p.minvikt_g) grund.push({ etikett: 'Minsta vikt', varde: formateraVikt(p.minvikt_g) })
  if (p.pris_sek_ca) grund.push({ etikett: 'Ungefärligt pris', varde: formateraPris(p.pris_sek_ca) })
  return { grund, ...egenskapsdelar(p) }
}

/**
 * Raden under rubriken Mitt förråd: hur många saker som finns, och hur många som saknar vikt när det är minst en.
 * Delarna är skilda åt så att den andra kan få en markering framför sig.
 */
export function forradsrad(summa: Pick<Forradssumma, 'antal' | 'utanVikt'>): { saker: string; saknarVikt: string | null } {
  return {
    saker: summa.antal === 1 ? '1 sak i förrådet' : `${summa.antal} saker i förrådet`,
    saknarVikt: summa.utanVikt > 0 ? `${summa.utanVikt} saknar vikt` : null,
  }
}

/**
 * Största vinsten: den sak som väger mest (antal gånger vikt). Där finns mest att vinna för den som vill gå lättare.
 * null när ingen sak har vikt.
 */
export function storstaVinsten(saker: readonly Forradssak[]): { id: string; namn: string; viktG: number; kategori: string } | null {
  let basta: { id: string; namn: string; viktG: number; kategori: string } | null = null
  for (const s of saker) {
    if (s.vikt_g === null || s.vikt_g <= 0) continue
    const viktG = s.antal * s.vikt_g
    if (!basta || viktG > basta.viktG) basta = { id: s.id, namn: s.namn, viktG, kategori: kategoriFor(s.kategori).etikett }
  }
  return basta
}

/**
 * Hur många saker som har katalogens vikt och där vikten är granskad mot tillverkaren (granskad eller stickprovskontrollerad).
 * Saker med egen vikt räknas inte, eftersom det då är användarens vikt som gäller.
 */
export function antalGranskade(saker: readonly Forradssak[]): number {
  return saker.filter((s) => s.produkter && !viktjamforelse(s).egen && granskning(s.produkter).niva !== 'ingen').length
}

/**
 * De fyra tyngsta sakerna i en packning: ryggsäck, tält eller tarp, sovsäck (eller quilt) och liggunderlag.
 * Underkategorierna i varje grupp räknas som samma sorts sak, och den första är den som väljs när man lägger till en.
 * saknas och hjalp är texterna i Mitt förråd när gruppen saknar en sak.
 */
const TUNGA = [
  { grupp: 'ryggsack', under: ['ryggsack'], kategori: 'packning', saknas: 'Du har ingen ryggsäck än', hjalp: 'Lägg till den du bär på flerdagsturer.' },
  { grupp: 'talt', under: ['talt', 'tarp'], kategori: 'talt', saknas: 'Du har inget tält eller tarp än', hjalp: 'Lägg till det du sover under på flerdagsturer.' },
  { grupp: 'sovsack', under: ['sovsack', 'quilt'], kategori: 'sova', saknas: 'Du har ingen sovsäck än', hjalp: 'Lägg till din, så räknas den med i vikten.' },
  { grupp: 'liggunderlag', under: ['liggunderlag'], kategori: 'sova', saknas: 'Du har inget liggunderlag än', hjalp: 'Sök i katalogen eller skriv in det själv.' },
] as const satisfies readonly { grupp: string; under: readonly UnderkategoriNyckel[]; kategori: KategoriNyckel; saknas: string; hjalp: string }[]

export type TungGrupp = (typeof TUNGA)[number]['grupp']

/** En av de fyra tunga som saknas helt i förrådet, med det som visas i den tomma rutan. */
export interface SaknadGrundsak {
  grupp: TungGrupp
  kategori: KategoriNyckel
  /** Underkategorin som väljs när man lägger till, till exempel tält för gruppen tält eller tarp. */
  underkategori: UnderkategoriNyckel
  /** "Du har ingen sovsäck än". */
  rubrik: string
  hjalp: string
}

/**
 * De av de fyra tunga som saknas helt: ingen sak alls i gruppen, med eller utan vikt. I samma ordning som KATEGORIER
 * (ryggsäck, tält eller tarp, sovsäck, liggunderlag). En dagsryggsäck räknas inte som ryggsäck. Ett tomt förråd saknar alla fyra.
 */
export function saknadeGrundsaker(saker: readonly Forradssak[]): SaknadGrundsak[] {
  return TUNGA.filter((t) => {
    const under: readonly string[] = t.under
    return !saker.some((s) => s.underkategori !== null && under.includes(s.underkategori))
  }).map((t) => ({ grupp: t.grupp, kategori: t.kategori, underkategori: t.under[0], rubrik: t.saknas, hjalp: t.hjalp }))
}

/** En kategori i förrådets lista: dess saker (eller null när den inte har några) och grundsakerna som saknas där. */
export interface Listdel {
  kategori: Kategori
  grupp: Kategorigrupp | null
  saknade: SaknadGrundsak[]
}

/**
 * Kategorierna i förrådets lista i samma ordning som KATEGORIER: de som har saker, och de där en grundsak saknas
 * även om kategorin saknar saker.
 */
export function listdelar(grupper: readonly Kategorigrupp[], saknade: readonly SaknadGrundsak[]): Listdel[] {
  return ALLA.flatMap((kategori) => {
    const grupp = grupper.find((g) => g.kategori.nyckel === kategori.nyckel) ?? null
    const iKategorin = saknade.filter((s) => s.kategori === kategori.nyckel)
    return grupp || iKategorin.length > 0 ? [{ kategori, grupp, saknade: iKategorin }] : []
  })
}

/** Kategorierna under Fyll på fler kategorier, i den ordning knapparna står. */
const FLER_KATEGORIER = ['kok', 'vatten', 'klader', 'prylar', 'medicin'] as const satisfies readonly KategoriNyckel[]

/** De kategorier under Fyll på fler kategorier som saknar saker, med etiketten som står på knappen. */
export function flerKategorier(saker: readonly Forradssak[]): { nyckel: KategoriNyckel; etikett: string }[] {
  const finns = new Set(saker.map((s) => kategoriFor(s.kategori).nyckel))
  return FLER_KATEGORIER.filter((k) => !finns.has(k)).map((nyckel) => ({ nyckel, etikett: kategoriFor(nyckel).etikett }))
}
