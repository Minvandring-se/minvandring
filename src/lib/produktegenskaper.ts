// Egenskaper som bara finns i en viss underkategori i produktkatalogen, till exempel golvyta för tält.
// De sparas i produkter.egenskaper (jsonb). Här står vilka som finns och hur de kontrolleras.
import type { UnderkategoriNyckel } from './forrad'

function saknas(varde: unknown): boolean {
  return varde === undefined || varde === null || varde === ''
}

interface Grund {
  nyckel: string
  etikett: string
  /** Behövs för att kunna jämföra produkter. Saknas den varnar valideringen, men stoppar inte. */
  forJamforelse?: boolean
  /** Visas direkt när en sak fälls ut i förrådet. Övriga ligger under "Visa alla specifikationer". */
  viktig?: boolean
  /** Ett tillägg efter värdet när det visas, som beror på produktens övriga egenskaper. */
  tillagg?: (egenskaper: Record<string, unknown>) => string | null
  /** Visar egenskapen ihop med en annan, till exempel längd och bredd på en rad. null = visa som vanligt. */
  visaIhop?: (egenskaper: Record<string, unknown>) => { etikett: string; varde: string } | null
  /** Egenskapen visas inte för sig när den här andra egenskapen har ett värde, eftersom den då visas ihop med den. */
  ingarI?: string
}

export type Egenskap = Grund &
  (
    | { sort: 'heltal' | 'decimal'; min: number; max: number; enhet?: string }
    | { sort: 'janej' }
    | { sort: 'text' }
    | { sort: 'val'; val: readonly string[] }
  )

/** Tältets konstruktion. "stavtalt" reses med vandringsstavar, "annat" är det som inte passar in. */
export const KONSTRUKTIONER = ['tunnel', 'kupol', 'geodetiskt', 'pyramid', 'stavtalt', 'annat'] as const

/** Står tältet utan markpinnar? "halvt" är halvfristående: innertältet står självt, men absiden måste pinnas. */
export const FRISTAENDE = ['ja', 'halvt', 'nej'] as const

/** Dukens material i grova drag, för jämförelser. Den exakta beskrivningen står i material_beskrivning. */
export const MATERIALTYPER = ['polyester', 'nylon', 'silnylon', 'silpoly', 'dcf', 'kerlon', 'bomull', 'annat'] as const

const TALT: Egenskap[] = [
  // De största kåtorna rymmer femton personer.
  { nyckel: 'personer', etikett: 'Personer', sort: 'heltal', min: 1, max: 20, forJamforelse: true, viktig: true },
  { nyckel: 'sasong', etikett: 'Säsonger', sort: 'heltal', min: 1, max: 4, forJamforelse: true, viktig: true },
  { nyckel: 'konstruktion', etikett: 'Konstruktion', sort: 'val', val: KONSTRUKTIONER, forJamforelse: true, viktig: true },
  { nyckel: 'fristaende', etikett: 'Fristående', sort: 'val', val: FRISTAENDE, forJamforelse: true, viktig: true },
  { nyckel: 'kraver_stavar', etikett: 'Kräver vandringsstavar', sort: 'janej', forJamforelse: true },
  { nyckel: 'golvyta_m2', etikett: 'Golvyta', sort: 'decimal', min: 0.5, max: 30, enhet: 'm²', forJamforelse: true, viktig: true },
  { nyckel: 'absidyta_m2', etikett: 'Absidyta', sort: 'decimal', min: 0, max: 20, enhet: 'm²', forJamforelse: true },
  { nyckel: 'ingangar', etikett: 'Ingångar', sort: 'heltal', min: 1, max: 4 },
  { nyckel: 'absider', etikett: 'Absider', sort: 'heltal', min: 0, max: 4, forJamforelse: true, viktig: true },
  { nyckel: 'innerhojd_cm', etikett: 'Innerhöjd', sort: 'heltal', min: 40, max: 250, enhet: 'cm' },
  // Stora tält för sex personer är över fyra meter.
  { nyckel: 'langd_cm', etikett: 'Längd', sort: 'heltal', min: 150, max: 600, enhet: 'cm' },
  { nyckel: 'yttertalt_forst', etikett: 'Yttertältet reses först', sort: 'janej' },
  { nyckel: 'material_typ', etikett: 'Material', sort: 'val', val: MATERIALTYPER, forJamforelse: true },
  { nyckel: 'material_beskrivning', etikett: 'Materialbeskrivning', sort: 'text' },
  { nyckel: 'vattenpelare_duk_mm', etikett: 'Vattenpelare duk', sort: 'heltal', min: 500, max: 30_000, enhet: 'mm', forJamforelse: true },
  { nyckel: 'vattenpelare_golv_mm', etikett: 'Vattenpelare golv', sort: 'heltal', min: 500, max: 30_000, enhet: 'mm', forJamforelse: true },
  // Fri text, till exempel "45 x 15".
  { nyckel: 'packmatt_cm', etikett: 'Packmått (cm)', sort: 'text' },
]

/** Tarp och vindsäck: några få egenskaper, alla frivilliga. Tältens krav gäller bara underkategorin talt. */
const SKYDD: Egenskap[] = [
  { nyckel: 'personer', etikett: 'Personer', sort: 'heltal', min: 1, max: 20, viktig: true },
  { nyckel: 'langd_cm', etikett: 'Längd', sort: 'heltal', min: 100, max: 1000, enhet: 'cm', viktig: true },
  { nyckel: 'material_typ', etikett: 'Material', sort: 'val', val: MATERIALTYPER, viktig: true },
  { nyckel: 'material_beskrivning', etikett: 'Materialbeskrivning', sort: 'text' },
  { nyckel: 'vattenpelare_duk_mm', etikett: 'Vattenpelare duk', sort: 'heltal', min: 500, max: 30_000, enhet: 'mm' },
]

/** Temperaturer som tillverkaren anger utan att ha testat enligt ISO 23537 går inte att jämföra rakt av. */
function ejIsoTestad(egenskaper: Record<string, unknown>): string | null {
  return egenskaper.temperaturstandard === 'ej_angiven' ? 'ej ISO-testad' : null
}

/**
 * Sovsäckar och quilts. Fem egenskaper behövs för jämförelser, och samma fem visas först i förrådet.
 */
const SOVSACK: Egenskap[] = [
  { nyckel: 'komfort_temp_c', etikett: 'Komforttemperatur', sort: 'heltal', min: -40, max: 25, enhet: '°C', forJamforelse: true, tillagg: ejIsoTestad, viktig: true },
  { nyckel: 'limit_temp_c', etikett: 'Limittemperatur', sort: 'heltal', min: -50, max: 20, enhet: '°C', forJamforelse: true, tillagg: ejIsoTestad, viktig: true },
  { nyckel: 'extrem_temp_c', etikett: 'Extremtemperatur', sort: 'heltal', min: -70, max: 15, enhet: '°C' },
  { nyckel: 'temperaturstandard', etikett: 'Temperaturstandard', sort: 'val', val: ['iso', 'ej_angiven'] },
  { nyckel: 'fyllning', etikett: 'Fyllning', sort: 'val', val: ['dun', 'syntet', 'blandning'], forJamforelse: true, viktig: true },
  { nyckel: 'fillpower_cuin', etikett: 'Fillpower', sort: 'heltal', min: 400, max: 1000, enhet: 'cuin' },
  { nyckel: 'fyllnadsvikt_g', etikett: 'Fyllnadsvikt', sort: 'heltal', min: 50, max: 3000, enhet: 'g' },
  { nyckel: 'form', etikett: 'Form', sort: 'val', val: ['mumie', 'rektangular', 'quilt', 'annat'], forJamforelse: true, viktig: true },
  { nyckel: 'max_langd_cm', etikett: 'Max längd', sort: 'heltal', min: 140, max: 230, enhet: 'cm', forJamforelse: true, viktig: true },
  { nyckel: 'dragkedja', etikett: 'Dragkedja', sort: 'val', val: ['vanster', 'hoger', 'ingen'] },
  { nyckel: 'material_beskrivning', etikett: 'Materialbeskrivning', sort: 'text' },
  { nyckel: 'packmatt_cm', etikett: 'Packmått (cm)', sort: 'text' },
]

/** R-värden som inte är mätta enligt ASTM F3340 går inte att jämföra rakt av. */
function ejAstmTestat(egenskaper: Record<string, unknown>): string | null {
  return egenskaper.r_varde_standard === 'ej_angiven' ? 'ej ASTM-testat' : null
}

/** Längd och bredd på en rad: "183 x 51 cm". */
function langdOchBredd(e: Record<string, unknown>): { etikett: string; varde: string } | null {
  return typeof e.langd_cm === 'number' && typeof e.bredd_cm === 'number' ? { etikett: 'Längd x bredd', varde: `${e.langd_cm} x ${e.bredd_cm} cm` } : null
}

/** Liggunderlag. Typ, R-värde, mått och tjocklek behövs för jämförelser och visas först i förrådet. */
const LIGGUNDERLAG: Egenskap[] = [
  { nyckel: 'typ', etikett: 'Typ', sort: 'val', val: ['luft', 'sjalvuppblasande', 'skum', 'annat'], forJamforelse: true, viktig: true },
  { nyckel: 'r_varde', etikett: 'R-värde', sort: 'decimal', min: 0.1, max: 12, forJamforelse: true, viktig: true, tillagg: ejAstmTestat },
  { nyckel: 'r_varde_standard', etikett: 'Standard för R-värde', sort: 'val', val: ['astm', 'ej_angiven'] },
  { nyckel: 'langd_cm', etikett: 'Längd', sort: 'heltal', min: 100, max: 230, enhet: 'cm', forJamforelse: true, viktig: true, visaIhop: langdOchBredd },
  { nyckel: 'bredd_cm', etikett: 'Bredd', sort: 'heltal', min: 30, max: 150, enhet: 'cm', forJamforelse: true, viktig: true, ingarI: 'langd_cm' },
  { nyckel: 'tjocklek_cm', etikett: 'Tjocklek', sort: 'decimal', min: 0.2, max: 20, enhet: 'cm', forJamforelse: true, viktig: true },
  { nyckel: 'form', etikett: 'Form', sort: 'val', val: ['rektangular', 'mumie', 'annat'] },
  { nyckel: 'ventil', etikett: 'Ventil', sort: 'val', val: ['platt', 'traditionell', 'ingen', 'annat'] },
  { nyckel: 'pumpsack_ingar', etikett: 'Pumpsäck ingår', sort: 'janej' },
  { nyckel: 'material_beskrivning', etikett: 'Materialbeskrivning', sort: 'text' },
  { nyckel: 'packmatt_cm', etikett: 'Packmått (cm)', sort: 'text' },
]

/** Rygglängden som ett spann, "42–58 cm", eller bara det ena värdet när det andra saknas. */
function rygglangd(e: Record<string, unknown>): { etikett: string; varde: string } | null {
  const min = typeof e.torso_min_cm === 'number' ? e.torso_min_cm : null
  const max = typeof e.torso_max_cm === 'number' ? e.torso_max_cm : null
  if (min === null && max === null) return null
  const varde = min !== null && max !== null && min !== max ? `${min}\u2013${max} cm` : `${min ?? max} cm`
  return { etikett: 'Rygglängd', varde }
}

/** Ryggsäckar och dagsryggsäckar. Volym, passform, rygglängd och ram behövs för jämförelser. */
const RYGGSACK: Egenskap[] = [
  { nyckel: 'volym_l', etikett: 'Volym', sort: 'decimal', min: 1, max: 150, enhet: 'l', forJamforelse: true, viktig: true },
  { nyckel: 'passform', etikett: 'Passform', sort: 'val', val: ['dam', 'herr', 'unisex'], forJamforelse: true, viktig: true },
  { nyckel: 'torso_min_cm', etikett: 'Rygglängd från', sort: 'heltal', min: 25, max: 75, enhet: 'cm', forJamforelse: true, viktig: true, visaIhop: rygglangd },
  // Visas ihop med den minsta rygglängden när den finns, annars för sig som Rygglängd.
  { nyckel: 'torso_max_cm', etikett: 'Rygglängd till', sort: 'heltal', min: 25, max: 75, enhet: 'cm', forJamforelse: true, viktig: true, ingarI: 'torso_min_cm', visaIhop: rygglangd },
  { nyckel: 'justerbar_rygg', etikett: 'Justerbar rygg', sort: 'janej' },
  { nyckel: 'ram', etikett: 'Ram', sort: 'val', val: ['intern', 'ingen', 'extern', 'annat'], forJamforelse: true, viktig: true },
  { nyckel: 'max_last_kg', etikett: 'Maxlast', sort: 'decimal', min: 1, max: 60, enhet: 'kg', viktig: true },
  { nyckel: 'hoftbalte', etikett: 'Höftbälte', sort: 'val', val: ['fast', 'avtagbart', 'enkelt', 'inget'] },
  { nyckel: 'atkomst', etikett: 'Åtkomst', sort: 'val', val: ['topp', 'topp_och_front', 'topp_och_sida', 'front', 'annat'] },
  { nyckel: 'regnskydd_ingar', etikett: 'Regnskydd ingår', sort: 'janej' },
  { nyckel: 'material_beskrivning', etikett: 'Materialbeskrivning', sort: 'text' },
]

/** Köket i grova drag. Ett systemkök har brännare och kokkärl som sitter ihop, ett stormkök har vindskydd och kastruller i ett set. */
export const KOKTYPER = ['toppmonterat', 'slangkok', 'systemkok', 'stormkok', 'annat'] as const

export const BRANSLEN = ['gas', 'sprit', 'multibransle', 'ved', 'fast_bransle', 'annat'] as const

/**
 * Kokkärlssystem: brännare och kokkärl som bara passar ihop med varandra, till exempel Jetboils kastruller med
 * värmeväxlare. Samma system på en brännare och ett kokkärl betyder att de passar. Anges bara när tillverkaren
 * själv säger vad som är kompatibelt. Ett nytt system läggs till här och i VALNAMN.
 */
export const KOKSYSTEM = ['jetboil_fluxring', 'msr_windburner', 'msr_reactor', 'primus_lite', 'primus_primetech', 'trangia_25', 'trangia_27', 'trangia_28'] as const

export const KOKKARLSTYPER = ['kastrull', 'kittel', 'stekpanna', 'kokset', 'annat'] as const

export const KOKKARLSMATERIAL = ['aluminium', 'hardanodiserad_aluminium', 'titan', 'rostfritt_stal', 'annat'] as const

/**
 * Kök och brännare. packvikt_g är hela förpackningen utan bränsle. Koktiden gäller 1 liter: anger tillverkaren
 * bara 0,5 liter står den tiden i kommentaren, eftersom den inte går att räkna om rakt av.
 */
const BRANNARE: Egenskap[] = [
  { nyckel: 'typ', etikett: 'Typ', sort: 'val', val: KOKTYPER, forJamforelse: true, viktig: true },
  { nyckel: 'bransle', etikett: 'Bränsle', sort: 'val', val: BRANSLEN, forJamforelse: true, viktig: true },
  { nyckel: 'personer', etikett: 'Personer', sort: 'heltal', min: 1, max: 8, forJamforelse: true, viktig: true },
  { nyckel: 'effekt_w', etikett: 'Effekt', sort: 'heltal', min: 500, max: 5000, enhet: 'W', forJamforelse: true },
  { nyckel: 'koktid_1l_min', etikett: 'Koktid 1 l', sort: 'decimal', min: 1, max: 20, enhet: 'min', forJamforelse: true, viktig: true },
  { nyckel: 'forbrukning_g_h', etikett: 'Förbrukning', sort: 'heltal', min: 20, max: 500, enhet: 'g/h' },
  { nyckel: 'regulator', etikett: 'Tryckregulator', sort: 'janej' },
  { nyckel: 'kokkarl_l', etikett: 'Kokkärl', sort: 'decimal', min: 0.3, max: 5, enhet: 'l', viktig: true },
  { nyckel: 'tandare', etikett: 'Inbyggd tändare', sort: 'janej' },
  // Fri text, till exempel "EN 417" eller "EN 417 och bränsleflaska".
  { nyckel: 'patronfaste', etikett: 'Patronfäste', sort: 'text' },
  { nyckel: 'packmatt_cm', etikett: 'Packmått (cm)', sort: 'text' },
  { nyckel: 'system', etikett: 'Kokkärlssystem', sort: 'val', val: KOKSYSTEM },
]

/**
 * Lösa kokkärl: kastruller, kittlar, stekpannor och kokset utan brännare. packvikt_g är allt som ingår.
 * system anges bara för kokkärl som är gjorda för ett visst kök, till exempel med värmeväxlare för Jetboil.
 */
const KASTRULL: Egenskap[] = [
  { nyckel: 'typ', etikett: 'Typ', sort: 'val', val: KOKKARLSTYPER, forJamforelse: true, viktig: true },
  { nyckel: 'volym_l', etikett: 'Volym', sort: 'decimal', min: 0.2, max: 6, enhet: 'l', forJamforelse: true, viktig: true },
  { nyckel: 'material', etikett: 'Material', sort: 'val', val: KOKKARLSMATERIAL, forJamforelse: true, viktig: true },
  { nyckel: 'system', etikett: 'Kokkärlssystem', sort: 'val', val: KOKSYSTEM, viktig: true },
  { nyckel: 'varmevaxlare', etikett: 'Värmeväxlare', sort: 'janej' },
  { nyckel: 'lock', etikett: 'Lock ingår', sort: 'janej' },
  { nyckel: 'antal_delar', etikett: 'Antal delar', sort: 'heltal', min: 1, max: 12 },
  { nyckel: 'packmatt_cm', etikett: 'Packmått (cm)', sort: 'text' },
  // Tillverkaren säger att kokkärlet bara fungerar med sitt eget kök, till exempel MSR:s Reactor-kastruller.
  { nyckel: 'bara_system', etikett: 'Bara för sitt kök', sort: 'janej' },
]

/** Ett kokkärl som bara fungerar med sitt eget kök måste ha ett kokkärlssystem. */
function kastrullregler(e: Record<string, unknown>): string[] {
  return e.bara_system === true && saknas(e.system) ? ['bara_system: kräver att system anges'] : []
}

/** Tändare och regulator finns bara på kök som går på gas, och ett stormkök eller systemkök har alltid kastruller. */
function brannarregler(e: Record<string, unknown>): string[] {
  const fel: string[] = []
  // Ett okänt bränsle ger redan ett fel för bransle, så reglerna gäller bara kända bränslen.
  const utanGas = e.bransle === 'sprit' || e.bransle === 'ved' || e.bransle === 'fast_bransle'
  if (utanGas) {
    if (e.regulator === true) fel.push('regulator: anges bara när bransle är gas eller multibransle')
    if (e.tandare === true) fel.push('tandare: anges bara när bransle är gas eller multibransle')
  }
  if ((e.typ === 'stormkok' || e.typ === 'systemkok') && saknas(e.kokkarl_l)) fel.push(`kokkarl_l: ska anges när typ är ${e.typ}`)
  return fel
}

/** Den minsta rygglängden kan inte vara större än den största. */
function ryggsacksregler(e: Record<string, unknown>): string[] {
  return typeof e.torso_min_cm === 'number' && typeof e.torso_max_cm === 'number' && e.torso_min_cm > e.torso_max_cm
    ? ['torso_min_cm: får inte vara större än torso_max_cm']
    : []
}

/** Ett underlag av skum har ingen ventil. */
function liggunderlagsregler(e: Record<string, unknown>): string[] {
  return e.typ === 'skum' && !saknas(e.ventil) && e.ventil !== 'ingen' ? ['ventil: ska vara ingen när typ är skum'] : []
}

/** Regler som gäller flera egenskaper på en gång. Ett brott mot en regel är ett fel och stoppar raden. */
function sovsacksregler(e: Record<string, unknown>): string[] {
  const fel: string[] = []
  const tal = (nyckel: string) => (typeof e[nyckel] === 'number' ? (e[nyckel] as number) : null)
  const komfort = tal('komfort_temp_c')
  const limit = tal('limit_temp_c')
  const extrem = tal('extrem_temp_c')
  if (komfort !== null && limit !== null && limit > komfort) fel.push('limit_temp_c: får inte vara högre än komfort_temp_c')
  if (limit !== null && extrem !== null && extrem > limit) fel.push('extrem_temp_c: får inte vara högre än limit_temp_c')
  if (!saknas(e.fillpower_cuin) && e.fyllning !== 'dun' && e.fyllning !== 'blandning') fel.push('fillpower_cuin: anges bara när fyllning är dun eller blandning')
  return fel
}

/**
 * Underkategorierna som har egna egenskaper. Övriga har inga än.
 * Nyckeln är underkategorin, inte huvudkategorin: en tarp eller en hängmatta har inte tältets egenskaper.
 */
export const EGENSKAPER: Partial<Record<UnderkategoriNyckel, Egenskap[]>> = {
  talt: TALT,
  tarp: SKYDD,
  vindsack: SKYDD,
  sovsack: SOVSACK,
  quilt: SOVSACK,
  liggunderlag: LIGGUNDERLAG,
  ryggsack: RYGGSACK,
  dagsryggsack: RYGGSACK,
  brannare: BRANNARE,
  kastrull: KASTRULL,
}

const REGLER: Partial<Record<UnderkategoriNyckel, (egenskaper: Record<string, unknown>) => string[]>> = {
  sovsack: sovsacksregler,
  quilt: sovsacksregler,
  liggunderlag: liggunderlagsregler,
  ryggsack: ryggsacksregler,
  dagsryggsack: ryggsacksregler,
  brannare: brannarregler,
  kastrull: kastrullregler,
}

/** Alla nycklar som finns som egenskap i någon underkategori. */
export const ALLA_EGENSKAPSNYCKLAR: ReadonlySet<string> = new Set(
  Object.values(EGENSKAPER).flatMap((lista) => lista.map((e) => e.nyckel)),
)

export type Egenskapsvarde = string | number | boolean

/**
 * Gör om text, till exempel en cell i en CSV, till egenskapens värde.
 * Tal får ha punkt eller komma som decimaltecken och ett minustecken först, och val och ja/nej får skrivas
 * med stora bokstäver ("DCF").
 */
export function tolkaEgenskap(e: Egenskap, text: string): { varde: Egenskapsvarde } | { fel: string } {
  // Ett typografiskt minus (−) räknas som ett vanligt.
  const t = text.trim().replace('\u2212', '-')
  switch (e.sort) {
    case 'heltal':
      return /^-?\d+$/.test(t) ? { varde: Number(t) } : { fel: 'ska vara ett heltal' }
    case 'decimal':
      return /^-?\d+([.,]\d+)?$/.test(t) ? { varde: Number(t.replace(',', '.')) } : { fel: 'ska vara ett tal' }
    case 'janej': {
      const v = t.toLowerCase()
      return v === 'ja' ? { varde: true } : v === 'nej' ? { varde: false } : { fel: 'ska vara ja eller nej' }
    }
    case 'val': {
      const v = t.toLowerCase()
      return e.val.includes(v) ? { varde: v } : { fel: `ska vara något av: ${e.val.join(', ')}` }
    }
    case 'text':
      return { varde: t }
  }
}

export function egenskaperFor(underkategori: string): Egenskap[] {
  return Object.hasOwn(EGENSKAPER, underkategori) ? (EGENSKAPER[underkategori as UnderkategoriNyckel] ?? []) : []
}

export interface Validering {
  /** Värden som är fel och måste rättas. */
  fel: string[]
  /** Sådant som saknas för jämförelser. Produkten går att spara ändå. */
  varningar: string[]
}

/** Vad som är fel med värdet, eller null om det stämmer. */
function felIVarde(e: Egenskap, varde: unknown): string | null {
  switch (e.sort) {
    case 'heltal':
    case 'decimal': {
      if (typeof varde !== 'number' || !Number.isFinite(varde)) return 'ska vara ett tal'
      if (e.sort === 'heltal' && !Number.isInteger(varde)) return 'ska vara ett heltal'
      if (varde < e.min || varde > e.max) return `ska vara mellan ${e.min} och ${e.max}`
      return null
    }
    case 'janej':
      return typeof varde === 'boolean' ? null : 'ska vara ja eller nej'
    case 'text':
      return typeof varde === 'string' && varde.trim() ? null : 'ska vara text'
    case 'val':
      return typeof varde === 'string' && e.val.includes(varde) ? null : `ska vara något av: ${e.val.join(', ')}`
  }
}

/**
 * Kontrollerar egenskaperna för en produkt i en underkategori.
 * Fel värden, okända nycklar och brott mot underkategorins regler blir fel.
 * En egenskap som behövs för jämförelser men saknas blir en varning.
 */
export function valideraEgenskaper(underkategori: string, egenskaper: Record<string, unknown>): Validering {
  const definitioner = egenskaperFor(underkategori)
  const fel: string[] = []
  const varningar: string[] = []

  for (const nyckel of Object.keys(egenskaper)) {
    if (!definitioner.some((e) => e.nyckel === nyckel)) fel.push(`${nyckel}: okänd egenskap för underkategorin`)
  }
  for (const e of definitioner) {
    const varde = egenskaper[e.nyckel]
    if (saknas(varde)) {
      if (e.forJamforelse) varningar.push(`${e.nyckel}: saknas, behövs för jämförelser`)
      continue
    }
    const problem = felIVarde(e, varde)
    if (problem) fel.push(`${e.nyckel}: ${problem}`)
  }
  const regler = Object.hasOwn(REGLER, underkategori) ? REGLER[underkategori as UnderkategoriNyckel] : undefined
  if (regler) fel.push(...regler(egenskaper))
  return { fel, varningar }
}

/** Hur värdena i ett val visas. Det som inte står här visas med stor första bokstav. */
const VALNAMN: Record<string, string> = {
  geodetiskt: 'Geodetiskt',
  stavtalt: 'Stavtält',
  halvt: 'Halvt',
  dcf: 'DCF',
  rektangular: 'Rektangulär',
  vanster: 'Vänster',
  hoger: 'Höger',
  iso: 'ISO',
  ej_angiven: 'Inte angiven',
  sjalvuppblasande: 'Självuppblåsande',
  astm: 'ASTM',
  topp_och_front: 'Topp och front',
  topp_och_sida: 'Topp och sida',
  slangkok: 'Slangkök',
  systemkok: 'Systemkök',
  stormkok: 'Stormkök',
  multibransle: 'Multibränsle',
  fast_bransle: 'Fast bränsle',
  jetboil_fluxring: 'Jetboil FluxRing',
  msr_windburner: 'MSR WindBurner',
  msr_reactor: 'MSR Reactor',
  primus_lite: 'Primus Lite',
  primus_primetech: 'Primus PrimeTech',
  trangia_25: 'Trangia 25',
  trangia_27: 'Trangia 27',
  trangia_28: 'Trangia 28 (Mini)',
  hardanodiserad_aluminium: 'Hårdanodiserad aluminium',
  rostfritt_stal: 'Rostfritt stål',
}

/** Tal med decimalkomma och ett riktigt minustecken. */
function visaTal(varde: number): string {
  return String(varde).replace('.', ',').replace('-', '\u2212')
}

/** Värdet som text, till exempel "2,6 m²", "Ja" eller "Tunnel". null om värdet inte går att visa. */
function visaVarde(e: Egenskap, varde: unknown): string | null {
  switch (e.sort) {
    case 'heltal':
    case 'decimal':
      return typeof varde === 'number' ? `${visaTal(varde)}${e.enhet ? ` ${e.enhet}` : ''}` : null
    case 'janej':
      return typeof varde === 'boolean' ? (varde ? 'Ja' : 'Nej') : null
    case 'val':
      return typeof varde === 'string' && varde ? (VALNAMN[varde] ?? varde[0].toUpperCase() + varde.slice(1)) : null
    case 'text':
      return typeof varde === 'string' && varde.trim() ? varde.trim() : null
  }
}

export interface Egenskapsrad {
  nyckel: string
  etikett: string
  varde: string
  /** Hör till de viktigaste för underkategorin och visas utan att man fäller ut alla specifikationer. */
  viktig: boolean
}

/**
 * Egenskaperna som ska visas för en produkt, i den ordning de står för underkategorin.
 * Bara de som har ett värde tas med, så ett tält visar personer och säsonger medan en sovsäck visar temperaturer och fyllning.
 */
export function visaEgenskaper(underkategori: string, egenskaper: Record<string, unknown> | null | undefined): Egenskapsrad[] {
  if (!egenskaper) return []
  return egenskaperFor(underkategori).flatMap((e) => {
    const viktig = e.viktig === true
    // En egenskap utan eget värde visas aldrig, inte heller ihop med en annan.
    if (saknas(egenskaper[e.nyckel])) return []
    if (e.ingarI && !saknas(egenskaper[e.ingarI])) return []
    const ihop = e.visaIhop?.(egenskaper)
    if (ihop) return [{ nyckel: e.nyckel, etikett: ihop.etikett, varde: ihop.varde, viktig }]
    const varde = visaVarde(e, egenskaper[e.nyckel])
    if (varde === null) return []
    const tillagg = e.tillagg?.(egenskaper)
    return [{ nyckel: e.nyckel, etikett: e.etikett, varde: tillagg ? `${varde} (${tillagg})` : varde, viktig }]
  })
}
