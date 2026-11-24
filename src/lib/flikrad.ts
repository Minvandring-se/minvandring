// Flikraden i mobil går att svepa i sidled. Den aktiva fliken ska alltid synas när sidan öppnas.

/** Luft mellan fliken och radens kant när raden skrollas fram till den. */
const LUFT = 16

/**
 * Hur långt raden ska vara skrollad för att den aktiva fliken ska synas helt. Samma värde som förut när den redan syns.
 * vanster och hoger är flikens kanter i radens innehåll, skroll och bredd radens nuvarande skroll och synliga bredd.
 */
export function skrollForAktivFlik({ vanster, hoger, skroll, bredd }: { vanster: number; hoger: number; skroll: number; bredd: number }): number {
  if (vanster < skroll) return Math.max(0, vanster - LUFT)
  if (hoger > skroll + bredd) return hoger - bredd + LUFT
  return skroll
}
