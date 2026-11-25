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
  /** Bara när alla = true: vikten på var och ens egen modell, per deltagare. Saknas den gäller radens vikt. */
  egenVikt?: ReadonlyMap<string, number | null>
  /** Kategorin i förrådet, till exempel talt eller kok. Behövs bara för vikten per kategori. */
  kategori?: string
}

export interface Vikter {
  /** Utrustning i ryggsäcken (gram). */
  bas: number
  /** Förbrukningsvaror från packlistan (gram). Mat och bränsle räknas separat. */
  forbrukas: number
  /** Bärs på kroppen och ingår inte i ryggsäcken (gram). */
  kropp: number
}

/**
 * Radens vikt per bärare i gram. Saknas antal räknas det som 1, saknas vikt som 0. På en rad som alla ska ha gäller
 * deltagarens egen vikt när den finns.
 */
export function radvikt(rad: Packrad, deltagareId?: string): number {
  if (!rad.med) return 0
  const antal = Number.isFinite(rad.antal) ? rad.antal : 1
  const egen = rad.alla && deltagareId ? rad.egenVikt?.get(deltagareId) : null
  return antal * (egen ?? rad.viktG ?? 0)
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
      const g = radvikt(rad, d.id)
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

export interface Startvikt extends Vikter {
  /** Maten deltagaren bär vid start (gram). */
  mat: number
  /** Det som bärs i ryggsäcken vid start: basvikt, förbrukning och mat (gram). Det man har på sig räknas inte. */
  start: number
}

/** Startvikten per deltagare: packlistans vikter plus maten. */
export function startvikter(rader: Packrad[], deltagare: Deltagare[], mat: ReadonlyMap<string, number>): Map<string, Startvikt> {
  const pack = packvikter(rader, deltagare)
  const ut = new Map<string, Startvikt>()
  for (const d of deltagare) {
    const v = pack.get(d.id)!
    const m = mat.get(d.id) ?? 0
    ut.set(d.id, { ...v, mat: m, start: v.bas + v.forbrukas + m })
  }
  return ut
}


export interface Kategorivikt {
  kategori: string
  /** Gram. */
  vikt: number
}

/**
 * Basvikten per kategori för en deltagare, tyngst först. Bara det som bärs i ryggsäcken räknas, alltså inte
 * förbrukning eller det man har på sig. Kategorier som väger 0 g tas inte med.
 */
export function basPerKategori(rader: readonly Packrad[], d: Deltagare): Kategorivikt[] {
  const summa = new Map<string, number>()
  for (const rad of rader) {
    if (rad.typ !== 'ryggsack' || !barRaden(rad, d)) continue
    const k = rad.kategori ?? 'ovrigt'
    summa.set(k, (summa.get(k) ?? 0) + radvikt(rad, d.id))
  }
  return [...summa]
    .filter(([, vikt]) => vikt > 0)
    .map(([kategori, vikt]) => ({ kategori, vikt }))
    .sort((a, b) => b.vikt - a.vikt || a.kategori.localeCompare(b.kategori, 'sv'))
}
