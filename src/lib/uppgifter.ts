// Att göra i turen: uppgifter som gruppen ska fixa före avfärd. Rena funktioner utan databas.

export interface Uppgift {
  id: string
  tur_id: string
  text: string
  /** Deltagaren som gör det. Tomt betyder att ingen har tagit den. */
  ansvarig: string | null
  /** Datumet uppgiften ska vara klar, som ÅÅÅÅ-MM-DD. */
  klart_till: string | null
  klar: boolean
  sortering: number
}

export const UPPGIFT_MAX = 200

/** Det gruppen ofta behöver fixa före en tur. Ett tryck lägger till uppgiften utan ansvarig. */
export const FORSLAG_UPPGIFTER: readonly string[] = ['Boka stugor', 'Köp gas', 'Boka resan dit och hem', 'Lämna en färdplan hemma']

/** Texten utan mellanslag i början och slutet, eller felet att visa. */
export function tolkaUppgift(text: string): { text: string } | { fel: string } {
  const t = text.trim()
  if (!t) return { fel: 'Skriv vad som ska göras.' }
  if (t.length > UPPGIFT_MAX) return { fel: `Uppgiften får vara högst ${UPPGIFT_MAX} tecken.` }
  return { text: t }
}

/** Förslagen som listan inte redan har, oavsett stora och små bokstäver. */
export function forslagSomSaknas(uppgifter: readonly Pick<Uppgift, 'text'>[]): string[] {
  const finns = new Set(uppgifter.map((u) => u.text.toLowerCase()))
  return FORSLAG_UPPGIFTER.filter((f) => !finns.has(f.toLowerCase()))
}

/** Det som är kvar först, efter datum (utan datum sist) och ordning. Det klara sist. */
export function sorteraUppgifter<T extends Pick<Uppgift, 'klar' | 'klart_till' | 'sortering'>>(uppgifter: readonly T[]): T[] {
  return [...uppgifter].sort(
    (a, b) =>
      Number(a.klar) - Number(b.klar) ||
      (a.klart_till ?? '9999-12-31').localeCompare(b.klart_till ?? '9999-12-31') ||
      a.sortering - b.sortering,
  )
}

const MANADER = ['jan', 'feb', 'mars', 'apr', 'maj', 'juni', 'juli', 'aug', 'sep', 'okt', 'nov', 'dec']

function dagar(fran: string, till: string): number {
  return Math.round((Date.parse(`${till}T00:00:00Z`) - Date.parse(`${fran}T00:00:00Z`)) / 86_400_000)
}

/**
 * När uppgiften ska vara klar, som text: "Senast 1 aug", "Senast i dag" eller "Försenad, 3 aug". bradskar är sant när
 * den inte är klar och datumet är inom en vecka eller har passerat.
 */
export function narText(u: Pick<Uppgift, 'klar' | 'klart_till'>, idag: string): { text: string; bradskar: boolean } | null {
  if (u.klar) return { text: 'Klar', bradskar: false }
  if (!u.klart_till) return null
  const [, m, d] = u.klart_till.split('-').map(Number)
  const datum = `${d} ${MANADER[m - 1]}`
  const kvar = dagar(idag, u.klart_till)
  if (kvar < 0) return { text: `Försenad, ${datum}`, bradskar: true }
  if (kvar === 0) return { text: 'Senast i dag', bradskar: true }
  return { text: `Senast ${datum}`, bradskar: kvar <= 7 }
}

/** Mina uppgifter som inte är klara, för Hem. */
export function minaKvar(uppgifter: readonly Pick<Uppgift, 'ansvarig' | 'klar'>[], mittId: string | null): number {
  return mittId ? uppgifter.filter((u) => u.ansvarig === mittId && !u.klar).length : 0
}
