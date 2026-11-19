// Egenskaper som bara finns i en viss underkategori i produktkatalogen, till exempel golvyta för tält.
// De sparas i produkter.egenskaper (jsonb). Här står vilka som finns och hur de kontrolleras.
import type { UnderkategoriNyckel } from './forrad'

interface Grund {
  nyckel: string
  etikett: string
  /** Behövs för att kunna jämföra produkter. Saknas den varnar valideringen, men stoppar inte. */
  forJamforelse?: boolean
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
  { nyckel: 'personer', etikett: 'Antal personer', sort: 'heltal', min: 1, max: 12, forJamforelse: true },
  { nyckel: 'sasong', etikett: 'Säsonger', sort: 'heltal', min: 1, max: 4, forJamforelse: true },
  { nyckel: 'konstruktion', etikett: 'Konstruktion', sort: 'val', val: KONSTRUKTIONER, forJamforelse: true },
  { nyckel: 'fristaende', etikett: 'Fristående', sort: 'val', val: FRISTAENDE, forJamforelse: true },
  { nyckel: 'kraver_stavar', etikett: 'Kräver vandringsstavar', sort: 'janej', forJamforelse: true },
  { nyckel: 'golvyta_m2', etikett: 'Golvyta', sort: 'decimal', min: 0.5, max: 30, enhet: 'm²', forJamforelse: true },
  { nyckel: 'absidyta_m2', etikett: 'Absidyta', sort: 'decimal', min: 0, max: 20, enhet: 'm²', forJamforelse: true },
  { nyckel: 'ingangar', etikett: 'Ingångar', sort: 'heltal', min: 1, max: 4 },
  { nyckel: 'absider', etikett: 'Absider', sort: 'heltal', min: 0, max: 4, forJamforelse: true },
  { nyckel: 'innerhojd_cm', etikett: 'Innerhöjd', sort: 'heltal', min: 40, max: 250, enhet: 'cm' },
  { nyckel: 'langd_cm', etikett: 'Längd', sort: 'heltal', min: 150, max: 400, enhet: 'cm' },
  { nyckel: 'yttertalt_forst', etikett: 'Yttertältet reses först', sort: 'janej' },
  { nyckel: 'material_typ', etikett: 'Material', sort: 'val', val: MATERIALTYPER, forJamforelse: true },
  { nyckel: 'material_beskrivning', etikett: 'Materialbeskrivning', sort: 'text' },
  { nyckel: 'vattenpelare_duk_mm', etikett: 'Vattenpelare duk', sort: 'heltal', min: 500, max: 30_000, enhet: 'mm', forJamforelse: true },
  { nyckel: 'vattenpelare_golv_mm', etikett: 'Vattenpelare golv', sort: 'heltal', min: 500, max: 30_000, enhet: 'mm', forJamforelse: true },
  // Fri text, till exempel "45 x 15".
  { nyckel: 'packmatt_cm', etikett: 'Packmått (cm)', sort: 'text' },
]

/**
 * Underkategorierna som har egna egenskaper. Övriga har inga än.
 * Nyckeln är underkategorin, inte huvudkategorin: en tarp eller en hängmatta har inte tältets egenskaper.
 */
export const EGENSKAPER: Partial<Record<UnderkategoriNyckel, Egenskap[]>> = { talt: TALT }

export function egenskaperFor(underkategori: string): Egenskap[] {
  return Object.hasOwn(EGENSKAPER, underkategori) ? (EGENSKAPER[underkategori as UnderkategoriNyckel] ?? []) : []
}

export interface Validering {
  /** Värden som är fel och måste rättas. */
  fel: string[]
  /** Sådant som saknas för jämförelser. Produkten går att spara ändå. */
  varningar: string[]
}

function saknas(varde: unknown): boolean {
  return varde === undefined || varde === null || varde === ''
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
 * Fel värden och okända nycklar blir fel. En egenskap som behövs för jämförelser men saknas blir en varning.
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
  return { fel, varningar }
}
