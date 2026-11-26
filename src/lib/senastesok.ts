// De senaste sökningarna i matkatalogen, som snabbval. Sparas bara i webbläsaren (localStorage), aldrig i databasen.

export const SENASTE_NYCKEL = 'minvandring.matkatalog.senaste'
const MAX = 3
const MIN_LANGD = 2
const MAX_LANGD = 40

/** Lägger sökningen först. Samma sökning med andra stora och små bokstäver räknas en gång. Högst tre. */
export function laggTillSokning(senaste: readonly string[], sok: string): string[] {
  const text = sok.trim().replace(/\s+/g, ' ').slice(0, MAX_LANGD)
  if (text.length < MIN_LANGD) return [...senaste]
  return [text, ...senaste.filter((s) => s.toLowerCase() !== text.toLowerCase())].slice(0, MAX)
}

/** Läser listan ur det som sparats. Allt som inte är en lista med texter blir en tom lista. */
export function tolkaSenaste(sparat: string | null): string[] {
  if (!sparat) return []
  try {
    const varde: unknown = JSON.parse(sparat)
    if (!Array.isArray(varde)) return []
    return varde.filter((s): s is string => typeof s === 'string' && s.trim().length >= MIN_LANGD).map((s) => s.slice(0, MAX_LANGD)).slice(0, MAX)
  } catch {
    return []
  }
}
