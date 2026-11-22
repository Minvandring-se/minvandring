// Ljust och mörkt läge. Valet sparas per enhet i localStorage och gäller tills man ändrar det under Utseende på Profil.
// Samma nyckel och samma logik finns i ett litet skript i index.html, som sätter läget innan React startar så att sidan inte blinkar.

export type Temaval = 'ljus' | 'mork' | 'system'
export type Lage = 'ljus' | 'mork'

export const TEMA_NYCKEL = 'minvandring-tema'
export const TEMAVAL: readonly Temaval[] = ['ljus', 'mork', 'system']

/** Webbläsarens färg runt sidan (theme-color), samma som bakgrunden i varje läge. */
export const TEMAFARG: Record<Lage, string> = { ljus: '#eef0eb', mork: '#0e1512' }

/** Ett sparat värde som ett giltigt val. Saknat, okänt eller trasigt värde blir "system". */
export function tolkaTemaval(varde: unknown): Temaval {
  return TEMAVAL.includes(varde as Temaval) ? (varde as Temaval) : 'system'
}

/** Läser valet. Går lagringen inte att nå (privat läge, blockerad) gäller "system". */
export function lasTemaval(lagring: Pick<Storage, 'getItem'> | null | undefined): Temaval {
  try {
    return tolkaTemaval(lagring?.getItem(TEMA_NYCKEL))
  } catch {
    return 'system'
  }
}

/** Sparar valet. "system" sparas som att inget val finns. Returnerar false om det inte gick att spara. */
export function sparaTemaval(lagring: Pick<Storage, 'setItem' | 'removeItem'> | null | undefined, val: Temaval): boolean {
  if (!lagring) return false
  try {
    if (val === 'system') lagring.removeItem(TEMA_NYCKEL)
    else lagring.setItem(TEMA_NYCKEL, val)
    return true
  } catch {
    return false
  }
}

/** Läget som gäller: det valda, eller enhetens när valet är "system". */
export function aktivtLage(val: Temaval, enhetenArMork: boolean): Lage {
  if (val === 'system') return enhetenArMork ? 'mork' : 'ljus'
  return val
}

/** Värdet för data-tema på html. null betyder att attributet tas bort och CSS följer enheten. */
export function temaAttribut(val: Temaval): Lage | null {
  return val === 'system' ? null : val
}
