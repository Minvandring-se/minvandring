// Roller i en tur. Samma regler som i databasen (supabase/migrations/20261109000000_roller.sql).
// Databasen bestämmer. De här funktionerna styr bara vad appen visar.

export type Roll = 'owner' | 'editor' | 'viewer'

export const ROLLNAMN: Record<Roll, string> = {
  owner: 'Ägare',
  editor: 'Redigerare',
  viewer: 'Läsare',
}

// Bara det som går att göra i appen i dag. Packning och mat läggs till här när de delarna är byggda.
export const ROLLBESKRIVNING: Record<Roll, string> = {
  owner: 'Kan ändra allt, ändra roller och radera turen',
  editor: 'Kan ändra turen och bjuda in andra',
  viewer: 'Ser allt i turen',
}

export function kanAndra(roll: Roll | null | undefined): boolean {
  return roll === 'owner' || roll === 'editor'
}

export function arAgare(roll: Roll | null | undefined): boolean {
  return roll === 'owner'
}

interface DeltagareRoll {
  id: string
  roll: Roll
  userId: string | null
}

/** Får den inloggade ta bort deltagaren? Ägare tar bort vem som helst, redigerare hundar och platshållare, alla kan lämna själva. */
export function kanTaBort(min: Roll | null, deltagare: DeltagareRoll, mittUserId: string, alla: DeltagareRoll[]): boolean {
  if (deltagare.roll === 'owner' && alla.filter((d) => d.roll === 'owner').length <= 1) return false
  if (arAgare(min)) return true
  if (kanAndra(min) && deltagare.userId === null) return true
  return deltagare.userId === mittUserId
}
