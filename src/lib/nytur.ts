// Ny tur: det man fyller i innan turen skapas. Allt annat ställs in i turen efteråt.
import { dagarMellan } from './datum'

export const MAX_TURNAMN = 80
/** Samma gräns som turer.dagar i databasen. */
export const MAX_DAGAR = 30

/** Raden som skapas i turer. dagar finns bara när båda datumen finns, annars gäller databasens standard. */
export interface NyTurRad {
  namn: string
  avresa: string | null
  hemkomst: string | null
  dagar?: number
}

export type NyTurTolkning = { ok: true; rad: NyTurRad } | { ok: false; falt: 'namn' | 'datum'; fel: string }

/** Kontrollerar namnet och datumen (ÅÅÅÅ-MM-DD eller tomma). Båda datumen är frivilliga. */
export function tolkaNyTur(namn: string, avresa: string, hemkomst: string): NyTurTolkning {
  const t = namn.trim()
  if (!t) return { ok: false, falt: 'namn', fel: 'Skriv vad turen heter.' }
  if (t.length > MAX_TURNAMN) return { ok: false, falt: 'namn', fel: `Namnet får vara högst ${MAX_TURNAMN} tecken.` }
  const fran = avresa || null
  const till = hemkomst || null
  const dagar = fran && till ? dagarMellan(fran, till) : null
  if (fran && till && dagar === null) return { ok: false, falt: 'datum', fel: 'Hemkomsten kan inte vara före avresan.' }
  if (dagar !== null && dagar > MAX_DAGAR) return { ok: false, falt: 'datum', fel: `En tur kan vara högst ${MAX_DAGAR} dagar.` }
  return { ok: true, rad: { namn: t, avresa: fran, hemkomst: till, ...(dagar !== null && { dagar }) } }
}
