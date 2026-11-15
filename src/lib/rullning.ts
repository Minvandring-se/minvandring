// Var sidan ska rullas när man byter sida.

export type Navigering = 'PUSH' | 'REPLACE' | 'POP'

/**
 * Rullningsläget efter ett sidbyte, eller null för att låta sidan vara.
 * Ny sida: högst upp. Bakåt och framåt (POP): dit man var senast. En länk till en del av sidan (#deltagare)
 * och byte av flik inne i en tur (REPLACE på samma sida) rör inte läget.
 */
export function rullmal(typ: Navigering, harHash: boolean, sparat: number | undefined, sammaSida = false): number | null {
  if (typ === 'POP') return sparat ?? 0
  if (harHash || sammaSida) return null
  return 0
}
