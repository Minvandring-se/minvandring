// Årstiden för en tur, som väljer bilden på turkortet. Rena funktioner utan databas.

export type Arstid = 'vinter' | 'var' | 'sommar' | 'host'

/**
 * Årstiden efter turens första dag (ÅÅÅÅ-MM-DD): vinter december–mars, vår april–maj, sommar juni–augusti och höst
 * september–november. Utan datum, eller med ett datum som inte går att läsa, blir det sommar.
 */
export function arstidFor(avresa: string | null): Arstid {
  const manad = avresa && /^\d{4}-\d{2}-\d{2}$/.test(avresa) ? Number(avresa.slice(5, 7)) : 0
  if (manad === 12 || (manad >= 1 && manad <= 3)) return 'vinter'
  if (manad === 4 || manad === 5) return 'var'
  if (manad >= 9 && manad <= 11) return 'host'
  return 'sommar'
}

/** Bilden för en årstid i två storlekar, för src och srcset. Filerna ligger i public/illustrationer/. */
export function arstidsbild(arstid: Arstid): { src: string; srcSet: string } {
  const fil = (bredd: number) => `/illustrationer/tur-${arstid}-${bredd}.webp`
  return { src: fil(720), srcSet: `${fil(720)} 720w, ${fil(1440)} 1440w` }
}
