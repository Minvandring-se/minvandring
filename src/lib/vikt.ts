// Viktberäkningar för packlistan och maten. Rena funktioner utan databas, så att de går att testa.
// Logiken kommer från kalkylarket "Äventyrsresor vandring sommar – Pro".

export type Typ = 'ryggsack' | 'kropp' | 'forbrukas'

export interface Deltagare {
  id: string
  typ: 'person' | 'hund'
  /** Andel av maten (0–1). null = dela resten lika mellan personerna. */
  matandel: number | null
  /** Bara hundar: egen mat per dag i gram. */
  hundmatPerDagG?: number | null
}

export interface Packrad {
  antal: number
  viktG: number | null
  typ: Typ
  med: boolean
  /** Deltagaren som bär saken. Ignoreras när alla = true. */
  barsAv: string | null
  /** Varje person har en egen (t.ex. sovsäck). Gäller inte hundar. */
  alla: boolean
}

export interface Vikter {
  /** Utrustning i ryggsäcken (gram). */
  bas: number
  /** Förbrukningsvaror från packlistan (gram). Mat och bränsle räknas separat. */
  forbrukas: number
  /** Bärs på kroppen och ingår inte i ryggsäcken (gram). */
  kropp: number
}

/** Radens vikt per bärare i gram. Saknas antal räknas det som 1, saknas vikt som 0. */
export function radvikt(rad: Packrad): number {
  if (!rad.med) return 0
  const antal = Number.isFinite(rad.antal) ? rad.antal : 1
  return antal * (rad.viktG ?? 0)
}

/** Bär deltagaren den här raden? */
export function barRaden(rad: Packrad, d: Deltagare): boolean {
  if (!rad.med) return false
  if (rad.alla) return d.typ === 'person'
  return rad.barsAv === d.id
}

/** Vikten från packlistan per deltagare, uppdelad på ryggsäck, förbrukning och kropp. */
export function packvikter(rader: Packrad[], deltagare: Deltagare[]): Map<string, Vikter> {
  const ut = new Map<string, Vikter>()
  for (const d of deltagare) {
    const v: Vikter = { bas: 0, forbrukas: 0, kropp: 0 }
    for (const rad of rader) {
      if (!barRaden(rad, d)) continue
      const g = radvikt(rad)
      if (rad.typ === 'ryggsack') v.bas += g
      else if (rad.typ === 'forbrukas') v.forbrukas += g
      else v.kropp += g
    }
    ut.set(d.id, v)
  }
  return ut
}

/**
 * Hur stor andel av människornas mat varje deltagare bär.
 * Personer med en egen andel får den. Resten delas lika mellan personerna utan egen andel. Hundar får 0.
 */
export function matandelar(deltagare: Deltagare[]): Map<string, number> {
  const personer = deltagare.filter((d) => d.typ === 'person')
  const satta = personer.filter((d) => d.matandel != null)
  const summaSatta = satta.reduce((s, d) => s + (d.matandel ?? 0), 0)
  const utan = personer.length - satta.length
  const rest = Math.max(0, 1 - summaSatta)
  const ut = new Map<string, number>()
  for (const d of deltagare) {
    if (d.typ === 'hund') ut.set(d.id, 0)
    else if (d.matandel != null) ut.set(d.id, d.matandel)
    else ut.set(d.id, utan > 0 ? rest / utan : 0)
  }
  return ut
}

/**
 * Matvikt i gram per deltagare vid start.
 * @param manniskomatG all mat till personerna (recept + extra), utan hundmat
 * @param dagarInklReserv vandringsdagar + reservdagar, för hundmaten
 */
export function matvikter(manniskomatG: number, deltagare: Deltagare[], dagarInklReserv: number): Map<string, number> {
  const andelar = matandelar(deltagare)
  const ut = new Map<string, number>()
  for (const d of deltagare) {
    const egen = d.typ === 'hund' ? (d.hundmatPerDagG ?? 0) * dagarInklReserv : 0
    ut.set(d.id, manniskomatG * (andelar.get(d.id) ?? 0) + egen)
  }
  return ut
}
