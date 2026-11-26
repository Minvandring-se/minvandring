/** Notiserna i klockan uppe till höger. Texten och sidan en notis leder till skrivs av databasen. */

/** Sorterna av notiser. Samma lista som checken på notiser.typ, och ett test kontrollerar att de stämmer överens. */
export const NOTISTYPER = ['gick_med'] as const

export type Notistyp = (typeof NOTISTYPER)[number]

export interface Notis {
  id: string
  typ: Notistyp
  text: string
  lank: string | null
  tur_id: string | null
  last: string | null
  skapad: string
}

/** Hur många notiser klockan hämtar. Äldre syns inte i listan. */
export const ANTAL_I_KLOCKAN = 30

/** Siffran på klockan: tom utan olästa, och 9+ för fler än nio. */
export function olastaSiffra(antal: number): string {
  if (antal <= 0) return ''
  return antal > 9 ? '9+' : String(antal)
}

/** Klockans namn för skärmläsare, med antalet olästa. */
export function klockansNamn(antal: number): string {
  if (antal <= 0) return 'Notiser'
  return antal === 1 ? 'Notiser, 1 oläst' : `Notiser, ${antal} olästa`
}

const MANADER = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

/** Hur länge sedan, kort: nyss, 5 min, 3 tim, i går, eller datumet. Räknas i svensk tid. */
export function notistid(skapad: string, nu: Date): string {
  const tid = new Date(skapad)
  const minuter = Math.floor((nu.getTime() - tid.getTime()) / 60_000)
  if (minuter < 1) return 'nyss'
  if (minuter < 60) return `${minuter} min`
  const dag = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' })
  if (dag(tid) === dag(nu)) return `${Math.floor(minuter / 60)} tim`
  const igar = new Date(nu.getTime() - 24 * 60 * 60_000)
  if (dag(tid) === dag(igar)) return 'i går'
  const [ar, manad, d] = dag(tid).split('-').map(Number)
  const iAr = Number(dag(nu).slice(0, 4)) === ar
  return `${d} ${MANADER[manad - 1]}${iAr ? '' : ` ${ar}`}`
}

/** Är sökvägen en sida inom appen? Allt annat visas utan länk. */
export function arAppLank(lank: string | null): lank is string {
  return !!lank && /^\/[^/\\]/.test(lank)
}
