// Delsidorna i en tur och deras adresser: /tur/:id (Översikt), /tur/:id/packa, /tur/:id/mat och /tur/:id/rutt.

export type Turdel = 'oversikt' | 'packa' | 'mat' | 'rutt'

export interface TurdelInfo {
  del: Turdel
  namn: string
  /** Delen av adressen efter turens id. Tom för översikten. */
  sokvag: string
  /** false tills delen är byggd. Då visas den nedtonad och sidan säger "Kommer snart". */
  byggd: boolean
}

export const TURDELAR: readonly TurdelInfo[] = [
  { del: 'oversikt', namn: 'Översikt', sokvag: '', byggd: true },
  { del: 'packa', namn: 'Packa', sokvag: 'packa', byggd: false },
  { del: 'mat', namn: 'Mat', sokvag: 'mat', byggd: false },
  { del: 'rutt', namn: 'Rutt', sokvag: 'rutt', byggd: false },
]

/** Adressen till en del av turen. */
export function turdelAdress(turId: string, del: Turdel): string {
  const { sokvag } = TURDELAR.find((d) => d.del === del)!
  return sokvag ? `/tur/${turId}/${sokvag}` : `/tur/${turId}`
}

/** Vilken del av turen en adress visar. Okända adresser under turen räknas som översikten. */
export function aktivTurdel(pathname: string): Turdel {
  const sista = /^\/tur\/[^/]+\/([^/]+)/.exec(pathname)?.[1]
  return TURDELAR.find((d) => d.sokvag !== '' && d.sokvag === sista)?.del ?? 'oversikt'
}
