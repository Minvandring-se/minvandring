// Färgen för varje deltagare i matplanen. Färgerna står i src/index.css (--color-person-a till -h).

const BOKSTAVER = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

/**
 * En färg per deltagare i den ordning deltagarna står i turen. Efter åtta börjar färgerna om. Färgen är en
 * CSS-variabel, så att den följer ljust och mörkt läge.
 */
export function personfarger(deltagare: readonly string[]): Map<string, string> {
  return new Map(deltagare.map((id, i) => [id, `var(--color-person-${BOKSTAVER[i % BOKSTAVER.length]})`]))
}
