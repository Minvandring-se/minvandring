/**
 * Ett kök i katalogen är antingen bara en brännare eller ett kit där kokkärl ingår.
 * Det avgörs av kokkarl_l: fältet fylls i när kokkärl ingår och lämnas tomt för en ren brännare.
 * Vikterna går bara att jämföra inom samma grupp.
 */
export type Kokgrupp = 'bara_brannare' | 'med_kokkarl'

export const KOKGRUPPER: { varde: Kokgrupp; etikett: string }[] = [
  { varde: 'bara_brannare', etikett: 'Bara brännare' },
  { varde: 'med_kokkarl', etikett: 'Med kokkärl' },
]

function kokkarlLiter(egenskaper: Record<string, unknown> | null | undefined): number | null {
  const v = egenskaper?.kokkarl_l
  return typeof v === 'number' && v > 0 ? v : null
}

/** Gruppen för en produkt i underkategorin brannare. */
export function kokgrupp(egenskaper: Record<string, unknown> | null | undefined): Kokgrupp {
  return kokkarlLiter(egenskaper) === null ? 'bara_brannare' : 'med_kokkarl'
}

/** Etikett att visa på ett kök, till exempel "Med kokkärl 1,3 l" eller "Bara brännare". */
export function kokkarlEtikett(egenskaper: Record<string, unknown> | null | undefined): string {
  const liter = kokkarlLiter(egenskaper)
  if (liter === null) return 'Bara brännare'
  return `Med kokkärl ${liter.toLocaleString('sv-SE', { maximumFractionDigits: 2 })} l`
}
