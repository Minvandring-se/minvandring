// Delsidorna i en tur och deras adresser: /tur/:id (Översikt) och /tur/:id/<del> för de andra flikarna.
// Alla flikar visas. De som inte är byggda än visar en sida med etiketten "Kommer snart" och vad delen blir.

export type Turdel = 'oversikt' | 'etapper' | 'karta' | 'packning' | 'mat' | 'gruppen' | 'kostnader' | 'sakerhet' | 'anteckningar'

export interface TurdelInfo {
  del: Turdel
  namn: string
  /** Delen av adressen efter turens id. Tom för översikten. Utan å, ä och ö. */
  sokvag: string
  /** false tills delen är byggd. Då visar fliken en sida med "Kommer snart". */
  byggd: boolean
  /** En mening om vad delen blir, för sidan med "Kommer snart". */
  blir: string
}

export const TURDELAR: readonly TurdelInfo[] = [
  { del: 'oversikt', namn: 'Översikt', sokvag: '', byggd: true, blir: '' },
  { del: 'etapper', namn: 'Etapper', sokvag: 'etapper', byggd: true, blir: 'Dagsetapperna längs leden med sträcka och var ni sover varje natt.' },
  { del: 'karta', namn: 'Karta', sokvag: 'karta', byggd: false, blir: 'Leden på en karta med höjdprofil, stugor och vatten, från en GPX-fil.' },
  {
    del: 'packning',
    namn: 'Packning',
    sokvag: 'packning',
    byggd: true,
    blir: 'Gruppens packlista: vem som bär vad, vikten per ryggsäck och bockar för det som är packat.',
  },
  { del: 'mat', namn: 'Mat', sokvag: 'mat', byggd: true, blir: 'Matplanen dag för dag och en inköpslista som går att bocka av.' },
  { del: 'gruppen', namn: 'Gruppen', sokvag: 'gruppen', byggd: false, blir: 'Att göra i gruppen, omröstningar och det senaste som hänt i turen.' },
  { del: 'kostnader', namn: 'Kostnader', sokvag: 'kostnader', byggd: false, blir: 'Delade kostnader och vem som ska betala vem när turen är slut.' },
  { del: 'sakerhet', namn: 'Säkerhet', sokvag: 'sakerhet', byggd: false, blir: 'En färdplan till någon hemma med kontaktperson, hemkomst och nödinformation.' },
  { del: 'anteckningar', namn: 'Anteckningar', sokvag: 'anteckningar', byggd: true, blir: 'Anteckningar under och efter turen, och det ni vill komma ihåg till nästa tur.' },
]

/** Informationen om en del. */
export function turdel(del: Turdel): TurdelInfo {
  return TURDELAR.find((d) => d.del === del)!
}

/** Adressen till en del av turen. */
export function turdelAdress(turId: string, del: Turdel): string {
  const { sokvag } = turdel(del)
  return sokvag ? `/tur/${turId}/${sokvag}` : `/tur/${turId}`
}

/**
 * Vilken del av turen en adress visar, för fliken som markeras och sidans titel. Okända adresser under turen
 * räknas som översikten, och gamla adresser (packa, rutt) som sina nya flikar, precis som sidan som visas.
 */
export function aktivTurdel(pathname: string): Turdel {
  return delFranSokvag(/^\/tur\/[^/]+\/([^/]+)/.exec(pathname)?.[1])
}

/** Den del som en okänd delsökväg ska visa. Gamla adresser (packa, rutt) leder till sina nya flikar. */
export function delFranSokvag(sokvag: string | undefined): Turdel {
  if (sokvag === 'packa') return 'packning'
  if (sokvag === 'rutt') return 'etapper'
  return TURDELAR.find((d) => d.sokvag !== '' && d.sokvag === sokvag)?.del ?? 'oversikt'
}
