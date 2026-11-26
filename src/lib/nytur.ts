// Ny tur: det man fyller i innan turen skapas. Allt annat ställs in i turen efteråt.
import { dagarMellan } from './datum'

export const MAX_TURNAMN = 80
/** Samma gräns som turer.dagar i databasen. */
export const MAX_DAGAR = 30

/** Raden som skapas i turer. dagar finns bara när båda datumen eller antalet dagar finns, annars gäller databasens standard. */
export interface NyTurRad {
  namn: string
  avresa: string | null
  hemkomst: string | null
  dagar?: number
}

/** När: datum från och till, eller bara antalet vandringsdagar. Allt är frivilligt. */
export type Nar = { lage: 'datum'; avresa: string; hemkomst: string } | { lage: 'dagar'; dagar: string }

export type NyTurTolkning = { ok: true; rad: NyTurRad } | { ok: false; falt: 'namn' | 'datum' | 'dagar'; fel: string }

/**
 * Kontrollerar namnet och När. Med datum (ÅÅÅÅ-MM-DD eller tomma) räknas vandringsdagarna från datumen när båda finns.
 * Med antal dagar skapas turen utan datum, med 1–30 dagar eller utan dagar när fältet är tomt.
 */
export function tolkaNyTur(namn: string, nar: Nar): NyTurTolkning {
  const t = namn.trim()
  if (!t) return { ok: false, falt: 'namn', fel: 'Skriv vad turen heter.' }
  if (t.length > MAX_TURNAMN) return { ok: false, falt: 'namn', fel: `Namnet får vara högst ${MAX_TURNAMN} tecken.` }
  if (nar.lage === 'dagar') {
    const d = nar.dagar.trim()
    if (!d) return { ok: true, rad: { namn: t, avresa: null, hemkomst: null } }
    const dagar = /^\d+$/.test(d) ? Number(d) : NaN
    if (!(dagar >= 1 && dagar <= MAX_DAGAR)) return { ok: false, falt: 'dagar', fel: `Ange 1 till ${MAX_DAGAR} vandringsdagar.` }
    return { ok: true, rad: { namn: t, avresa: null, hemkomst: null, dagar } }
  }
  const { avresa, hemkomst } = nar
  const fran = avresa || null
  const till = hemkomst || null
  const dagar = fran && till ? dagarMellan(fran, till) : null
  if (fran && till && dagar === null) return { ok: false, falt: 'datum', fel: 'Hemkomsten kan inte vara före avresan.' }
  if (dagar !== null && dagar > MAX_DAGAR) return { ok: false, falt: 'datum', fel: `En tur kan vara högst ${MAX_DAGAR} dagar.` }
  return { ok: true, rad: { namn: t, avresa: fran, hemkomst: till, ...(dagar !== null && { dagar }) } }
}
