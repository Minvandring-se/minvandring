// Det appen får veta om en inbjudningslänk innan man går med, och vad som ska hända sedan.

export interface Inbjudan {
  turId: string
  turnamn: string
  redanMed: boolean
  /** Personer utan konto i turen. Den som går med kan vara en av dem. */
  personer: { id: string; namn: string }[]
}

const arText = (v: unknown): v is string => typeof v === 'string' && v.length > 0

/** Tolkar svaret från databasfunktionen inbjudan. null om koden är fel eller svaret inte ser ut som väntat. */
export function tolkaInbjudan(svar: unknown): Inbjudan | null {
  if (typeof svar !== 'object' || svar === null) return null
  const { tur_id, namn, redan_med, personer } = svar as Record<string, unknown>
  if (!arText(tur_id)) return null
  const lista = Array.isArray(personer) ? personer : []
  return {
    turId: tur_id,
    turnamn: arText(namn) ? namn : 'turen',
    redanMed: redan_med === true,
    personer: lista.flatMap((p: unknown) => {
      if (typeof p !== 'object' || p === null) return []
      const { id, namn: personnamn } = p as Record<string, unknown>
      return arText(id) && arText(personnamn) ? [{ id, namn: personnamn }] : []
    }),
  }
}

export type Steg = 'oppna' | 'ga-med' | 'fraga'

/**
 * Vad som händer efter att länken har kontrollerats: öppna turen om man redan är med,
 * gå med direkt om det inte finns någon att vara, annars fråga "Är du någon av de här?".
 */
export function nastaSteg(inbjudan: Inbjudan): Steg {
  if (inbjudan.redanMed) return 'oppna'
  return inbjudan.personer.length === 0 ? 'ga-med' : 'fraga'
}
