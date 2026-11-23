/**
 * Ett kök i katalogen är antingen bara en brännare eller ett kit där kokkärl ingår.
 * Det avgörs av kokkarl_l: fältet fylls i när kokkärl ingår och lämnas tomt för en ren brännare.
 * Vikterna går bara att jämföra inom samma grupp.
 */
export type Kokgrupp = 'bara_brannare' | 'med_kokkarl'

export const KOKGRUPPER: { nyckel: Kokgrupp; etikett: string }[] = [
  { nyckel: 'bara_brannare', etikett: 'Bara brännare' },
  { nyckel: 'med_kokkarl', etikett: 'Med kokkärl' },
]

/** Underkategorin där köken ligger. Etiketten och filtret gäller bara den. */
export const KOK_UNDERKATEGORI = 'brannare'

export function arKokgrupp(varde: string): varde is Kokgrupp {
  return KOKGRUPPER.some((g) => g.nyckel === varde)
}

type Egenskaper = Record<string, unknown> | null | undefined

function kokkarlLiter(egenskaper: Egenskaper): number | null {
  const v = egenskaper?.kokkarl_l
  return typeof v === 'number' && v > 0 ? v : null
}

/** Gruppen för en produkt i underkategorin brannare. */
export function kokgrupp(egenskaper: Egenskaper): Kokgrupp {
  return kokkarlLiter(egenskaper) === null ? 'bara_brannare' : 'med_kokkarl'
}

/** Etikett att visa på ett kök, till exempel "Med kokkärl 1,3 l" eller "Bara brännare". */
export function kokkarlEtikett(egenskaper: Egenskaper): string {
  const liter = kokkarlLiter(egenskaper)
  if (liter === null) return 'Bara brännare'
  return `Med kokkärl ${liter.toLocaleString('sv-SE', { maximumFractionDigits: 2 })} l`
}

/** Etiketten för en produkt i katalogen, eller null för allt som inte är ett kök. */
export function kokEtikettFor(p: { underkategori: string; egenskaper?: Egenskaper }): string | null {
  return p.underkategori === KOK_UNDERKATEGORI ? kokkarlEtikett(p.egenskaper) : null
}

/**
 * Behåller bara köken i den valda gruppen. Produkter i andra underkategorier filtreras inte bort,
 * och utan vald grupp blir listan som den var.
 */
export function filtreraKokgrupp<P extends { underkategori: string; egenskaper?: Egenskaper }>(produkter: P[], grupp: Kokgrupp | ''): P[] {
  if (!grupp) return produkter
  return produkter.filter((p) => p.underkategori !== KOK_UNDERKATEGORI || kokgrupp(p.egenskaper) === grupp)
}

/** Brännare som tar vanliga kastruller: de står fritt eller sitter på patronen och har öppna pannstöd. */
const OPPNA_TYPER = new Set(['toppmonterat', 'slangkok', 'annat'])

/**
 * Passar kokkärlet på brännaren? Har brännaren ett kokkärlssystem passar bara kokkärl i samma system. Har den inget
 * passar vanliga kokkärl (utan system) på öppna brännare, men inte på systemkök och stormkök, som är byggda för sina
 * egna kastruller. Ett kokkärl i ett system passar bara brännare i samma system.
 */
export function passarIhop(brannare: Egenskaper, kokkarl: Egenskaper): boolean {
  const brannarsystem = brannare?.system
  const kokkarlsystem = kokkarl?.system
  if (typeof brannarsystem === 'string' && brannarsystem) return kokkarlsystem === brannarsystem
  if (typeof kokkarlsystem === 'string' && kokkarlsystem) return false
  return typeof brannare?.typ === 'string' && OPPNA_TYPER.has(brannare.typ)
}
