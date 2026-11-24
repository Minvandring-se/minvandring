// Hur mycket gas turen behöver och vilka patroner som räcker. Rena funktioner utan databas.

/**
 * Primus riktlinje för en person med eget kök: gas för en dag, en helg och en vecka, på sommaren och på vintern då man
 * också smälter snö. Källan står i tipsen.
 */
export const PRIMUS_G = {
  sommar: { dag: 100, helg: 230, vecka: 460 },
  vinter: { dag: 230, helg: 450, vecka: 680 },
} as const

export type Arstid = keyof typeof PRIMUS_G

/**
 * Gas för en person i gram: Primus siffra för en dag, minst helgens siffra från två dagar, och veckans siffra fördelad
 * per dag när turen är längre. En vecka blir då exakt Primus veckosiffra.
 */
export function gasPerPerson(dagar: number, arstid: Arstid): number {
  const { dag, helg, vecka } = PRIMUS_G[arstid]
  const d = Math.round(dagar)
  if (!(d > 0)) return 0
  if (d === 1) return dag
  return Math.max(helg, (vecka / 7) * d)
}

/** De vanliga storlekarna på skruvpatroner (EN 417), i gram gas. */
export const PATRONSTORLEKAR_G = [100, 230, 450] as const

/** Fler patroner än så föreslås inte. */
const MAX_PATRONER = 8

/**
 * Gasen turen behöver i gram, avrundat uppåt till jämna 10 g: Primus siffra per person gånger antalet personer.
 * Varje person räknas med eget kök, så ett delat kök drar mindre. 0 när något saknas.
 */
export function gasbehov(personer: number, dagar: number, arstid: Arstid = 'sommar'): number {
  if (!(personer > 0) || !(dagar > 0)) return 0
  const gram = Math.round(personer) * gasPerPerson(dagar, arstid)
  return Math.ceil(gram / 10 - 1e-9) * 10
}

/**
 * Patronerna som räcker till behovet: så få som möjligt, eftersom varje tom patron också ska bäras, och bland dem
 * den kombination som har minst gas över.
 * Störst först, till exempel [450, 230]. Tom lista när inget behövs, null när det skulle krävas fler än åtta patroner.
 */
export function patronforslag(behovG: number, storlekar: readonly number[] = PATRONSTORLEKAR_G): number[] | null {
  if (!(behovG > 0)) return []
  const sorterade = [...new Set(storlekar.filter((s) => s > 0))].sort((a, b) => b - a)
  let basta: number[] | null = null
  let bastaAntal = Infinity
  let bastaOver = Infinity

  function prova(index: number, valda: number[], summa: number) {
    if (summa >= behovG) {
      const over = summa - behovG
      if (valda.length < bastaAntal || (valda.length === bastaAntal && over < bastaOver)) {
        basta = [...valda]
        bastaAntal = valda.length
        bastaOver = over
      }
      return
    }
    if (valda.length === MAX_PATRONER || index === sorterade.length) return
    // Fler av samma storlek, eller gå vidare till nästa mindre.
    prova(index, [...valda, sorterade[index]], summa + sorterade[index])
    prova(index + 1, valda, summa)
  }

  prova(0, [], 0)
  return basta
}

/** Patronerna som text, till exempel "2 × 230 g" eller "450 g + 100 g". */
export function formateraPatroner(patroner: readonly number[]): string {
  const antal = new Map<number, number>()
  for (const p of patroner) antal.set(p, (antal.get(p) ?? 0) + 1)
  return [...antal.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([storlek, n]) => (n === 1 ? `${storlek} g` : `${n} × ${storlek} g`))
    .join(' + ')
}
