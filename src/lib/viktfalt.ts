// Tolkar det man skriver i ett viktfält: gram eller kilo, med eller utan enhet. Ren funktion utan databas.

/** Största vikt som går att spara för en sak, i gram. */
export const MAX_VIKT_G = 100_000

export const VIKTFEL = 'Skriv vikten i gram eller kilo, till exempel 1250 eller 1,25 kg.'

export type Viktsvar = { ok: true; g: number | null } | { ok: false; fel: string }

/**
 * Gör om text till gram. "1200", "1200 g", "1,2 kg", "1.2 kg", "1,2kg" och "0,85 kg" går bra.
 * Siffror utan enhet är gram. Tomt fält ger null, eftersom vikten får saknas.
 * Decimaler utan enhet ("1,2") godtas inte, eftersom det inte går att veta om det är gram eller kilo.
 */
export function tolkaVikt(text: string): Viktsvar {
  // Mellanslag mellan siffror är tusentalsavgränsare: "1 200 g".
  const t = text.trim().toLowerCase().replace(/(\d)\s+(?=\d)/g, '$1')
  if (!t) return { ok: true, g: null }
  const m = /^(\d+)(?:[.,](\d+))?\s*(kg|g|gram|kilo)?$/.exec(t)
  if (!m) return { ok: false, fel: VIKTFEL }
  const [, hela, decimaler, enhet] = m
  const kilo = enhet === 'kg' || enhet === 'kilo'
  if (decimaler !== undefined && !kilo) return { ok: false, fel: 'Skriv hela gram, eller lägg till kg efter talet, till exempel 1,2 kg.' }
  const tal = Number(`${hela}.${decimaler ?? '0'}`)
  const g = kilo ? Math.round(tal * 1000) : tal
  if (g > MAX_VIKT_G) return { ok: false, fel: `Vikten får vara högst ${MAX_VIKT_G / 1000} kg.` }
  return { ok: true, g }
}

/** Gram med mellanslag som tusentalsavgränsare: "1 200 g". Mellanslaget är hårt, så att talet inte radbryts. */
export function gramText(g: number): string {
  return `${String(g).replace(/\B(?=(\d{3})+$)/g, ' ')} g`
}

/**
 * Tolkningen som visas under fältet medan man skriver: "= 1 200 g". null när fältet är tomt eller ogiltigt.
 */
export function visaTolkning(text: string): string | null {
  const svar = tolkaVikt(text)
  if (!svar.ok || svar.g === null) return null
  return `= ${gramText(svar.g)}`
}
