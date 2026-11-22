// Räkning för stapeln (Framsteg), ringen (Matare) och turens tecknade bildruta (Turbild).

/** Andelen av ett mål, mellan 0 och 1. Ogiltiga värden och mål på noll eller mindre ger 0. */
export function andel(varde: number, mal = 1): number {
  if (!Number.isFinite(varde) || !Number.isFinite(mal) || mal <= 0) return 0
  return Math.min(1, Math.max(0, varde / mal))
}

/** Andelen som hela procent, till exempel ger 0,643 talet 64. */
export function procent(a: number): number {
  return Math.round(andel(a) * 100)
}

/** Ringens omkrets och hur mycket av den som ska fyllas, för stroke-dasharray. */
export function ringBage(a: number, radie: number): { omkrets: number; fylld: number } {
  const omkrets = 2 * Math.PI * radie
  return { omkrets, fylld: omkrets * andel(a) }
}

/** Ett tal mellan 0 och 1 som alltid blir samma för samma text. Används för att variera bildrutan per tur. */
export function fro(text: string): number {
  let h = 2166136261
  for (const tecken of text) {
    h ^= tecken.codePointAt(0)!
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

/** Bildrutans variation för en tur: var solen står och hur höga topparna är. Samma tur får alltid samma bild. */
export function turbildForm(turId: string): { solX: number; solY: number; topp1: number; topp2: number; spegla: boolean } {
  const a = fro(turId)
  const b = fro(`${turId}:b`)
  const c = fro(`${turId}:c`)
  return {
    solX: Math.round(380 + a * 140),
    solY: Math.round(80 + b * 50),
    topp1: Math.round(110 + b * 50),
    topp2: Math.round(140 + c * 50),
    spegla: c > 0.5,
  }
}
