// Egna påminnelser: en text och ett datum, bara för en själv. På morgonen den dagen blir påminnelsen en notis
// (det dagliga jobbet i migreringen paminnelser). Rena funktioner för kontrollen och ordningen.

/** Samma gräns som paminnelser.text i databasen. */
export const PAMINNELSE_MAX = 200

export interface Paminnelse {
  id: string
  tur_id: string | null
  text: string
  datum: string
  klar: boolean
  skickad: string | null
}

export type Paminnelsetolkning = { ok: true; text: string; datum: string } | { ok: false; fel: string }

/** Kontrollerar texten och datumet (ÅÅÅÅ-MM-DD). Ett datum före i dag går inte, eftersom påminnelsen aldrig skulle komma. */
export function tolkaPaminnelse(text: string, datum: string, idag: string): Paminnelsetolkning {
  const t = text.trim()
  if (!t) return { ok: false, fel: 'Skriv vad du vill bli påmind om.' }
  if (t.length > PAMINNELSE_MAX) return { ok: false, fel: `Påminnelsen får vara högst ${PAMINNELSE_MAX} tecken.` }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) return { ok: false, fel: 'Välj en dag.' }
  if (datum < idag) return { ok: false, fel: 'Välj i dag eller en dag framåt.' }
  return { ok: true, text: t, datum }
}

/** De som inte är klara först, närmast datum först. De klara sist. */
export function sorteraPaminnelser(p: readonly Paminnelse[]): Paminnelse[] {
  return [...p].sort((a, b) => Number(a.klar) - Number(b.klar) || a.datum.localeCompare(b.datum) || a.text.localeCompare(b.text, 'sv'))
}
