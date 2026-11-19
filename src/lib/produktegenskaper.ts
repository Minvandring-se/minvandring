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
  /** Sparas i katalogen men visas inte när en sak fälls ut i förrådet. */
  dold?: boolean
  /** Ett tillägg efter värdet när det visas, som beror på produktens övriga egenskaper. */
  tillagg?: (egenskaper: Record<string, unknown>) => string | null
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
  { nyckel: 'personer', etikett: 'Personer', sort: 'heltal', min: 1, max: 20, forJamforelse: true },
  { nyckel: 'sasong', etikett: 'Säsonger', sort: 'heltal', min: 1, max: 4, forJamforelse: true },
  { nyckel: 'konstruktion', etikett: 'Konstruktion', sort: 'val', val: KONSTRUKTIONER, forJamforelse: true },
  { nyckel: 'fristaende', etikett: 'Fristående', sort: 'val', val: FRISTAENDE, forJamforelse: true },
  { nyckel: 'kraver_stavar', etikett: 'Kräver vandringsstavar', sort: 'janej', forJamforelse: true },
  { nyckel: 'golvyta_m2', etikett: 'Golvyta', sort: 'decimal', min: 0.5, max: 30, enhet: 'm²', forJamforelse: true },
  { nyckel: 'absidyta_m2', etikett: 'Absidyta', sort: 'decimal', min: 0, max: 20, enhet: 'm²', forJamforelse: true },
  { nyckel: 'ingangar', etikett: 'Ingångar', sort: 'heltal', min: 1, max: 4 },
  { nyckel: 'absider', etikett: 'Absider', sort: 'heltal', min: 0, max: 4, forJamforelse: true },
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
  { nyckel: 'personer', etikett: 'Personer', sort: 'heltal', min: 1, max: 20 },
  { nyckel: 'langd_cm', etikett: 'Längd', sort: 'heltal', min: 100, max: 1000, enhet: 'cm' },
  { nyckel: 'material_typ', etikett: 'Material', sort: 'val', val: MATERIALTYPER },
  { nyckel: 'material_beskrivning', etikett: 'Materialbeskrivning', sort: 'text' },
  { nyckel: 'vattenpelare_duk_mm', etikett: 'Vattenpelare duk', sort: 'heltal', min: 500, max: 30_000, enhet: 'mm' },
]

/** Temperaturer som tillverkaren anger utan att ha testat enligt ISO 23537 går inte att jämföra rakt av. */
function ejIsoTestad(egenskaper: Record<string, unknown>): string | null {
  return egenskaper.temperaturstandard === 'ej_angiven' ? 'ej ISO-testad' : null
}

/**
 * Sovsäckar och quilts. Fem egenskaper behövs för jämförelser. I förrådet visas temperaturerna,
 * fyllningen, formen och längden. Resten sparas men är dolt.
 */
const SOVSACK: Egenskap[] = [
  { nyckel: 'komfort_temp_c', etikett: 'Komforttemperatur', sort: 'heltal', min: -40, max: 25, enhet: '°C', forJamforelse: true, tillagg: ejIsoTestad },
  { nyckel: 'limit_temp_c', etikett: 'Limittemperatur', sort: 'heltal', min: -50, max: 20, enhet: '°C', forJamforelse: true, tillagg: ejIsoTestad },
  { nyckel: 'extrem_temp_c', etikett: 'Extremtemperatur', sort: 'heltal', min: -70, max: 15, enhet: '°C', dold: true },
  { nyckel: 'temperaturstandard', etikett: 'Temperaturstandard', sort: 'val', val: ['iso', 'ej_angiven'], dold: true },
  { nyckel: 'fyllning', etikett: 'Fyllning', sort: 'val', val: ['dun', 'syntet', 'blandning'], forJamforelse: true },
  { nyckel: 'fillpower_cuin', etikett: 'Fillpower', sort: 'heltal', min: 400, max: 1000, enhet: 'cuin' },
  { nyckel: 'fyllnadsvikt_g', etikett: 'Fyllnadsvikt', sort: 'heltal', min: 50, max: 3000, enhet: 'g', dold: true },
  { nyckel: 'form', etikett: 'Form', sort: 'val', val: ['mumie', 'rektangular', 'quilt', 'annat'], forJamforelse: true },
  { nyckel: 'max_langd_cm', etikett: 'Max längd', sort: 'heltal', min: 140, max: 230, enhet: 'cm', forJamforelse: true },
  { nyckel: 'dragkedja', etikett: 'Dragkedja', sort: 'val', val: ['vanster', 'hoger', 'ingen'], dold: true },
  { nyckel: 'material_beskrivning', etikett: 'Materialbeskrivning', sort: 'text', dold: true },
  { nyckel: 'packmatt_cm', etikett: 'Packmått (cm)', sort: 'text', dold: true },
]

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
}

const REGLER: Partial<Record<UnderkategoriNyckel, (egenskaper: Record<string, unknown>) => string[]>> = {
  sovsack: sovsacksregler,
  quilt: sovsacksregler,
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
}

/**
 * Egenskaperna som ska visas för en produkt, i den ordning de står för underkategorin.
 * Bara de som har ett värde tas med, så ett tält visar personer och säsonger medan en sovsäck visar temperaturer och fyllning.
 */
export function visaEgenskaper(underkategori: string, egenskaper: Record<string, unknown> | null | undefined): Egenskapsrad[] {
  if (!egenskaper) return []
  return egenskaperFor(underkategori).flatMap((e) => {
    if (e.dold) return []
    const varde = visaVarde(e, egenskaper[e.nyckel])
    if (varde === null) return []
    const tillagg = e.tillagg?.(egenskaper)
    return [{ nyckel: e.nyckel, etikett: e.etikett, varde: tillagg ? `${varde} (${tillagg})` : varde }]
  })
}
