import type { Roll } from './roller'

export interface Tur {
  id: string
  namn: string
  destination: string | null
  startpunkt: string | null
  avresa: string | null
  hemkomst: string | null
  dagar: number
  reservdagar: number
  inbjudningskod: string
}

export interface DeltagareRad {
  id: string
  namn: string
  typ: 'person' | 'hund'
  roll: Roll
  user_id: string | null
}
