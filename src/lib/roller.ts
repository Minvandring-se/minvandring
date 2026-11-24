// Roller i en tur. Samma regler som i databasen (supabase/migrations/20261109000000_roller.sql,
// och 20261123235900_redigerare_andrar_bara_utan_konto.sql för vem som får ändra en deltagare).
// Databasen bestämmer. De här funktionerna styr bara vad appen visar.

export type Roll = 'owner' | 'editor' | 'viewer'

export const ROLLNAMN: Record<Roll, string> = {
  owner: 'Ägare',
  editor: 'Redigerare',
  viewer: 'Läsare',
}

// Bara det som går att göra i appen i dag. Packning läggs till här när den delen är byggd.
export const ROLLBESKRIVNING: Record<Roll, string> = {
  owner: 'Kan ändra turen och matplanen, ändra roller och radera turen',
  editor: 'Kan ändra turen och matplanen och bjuda in andra',
  viewer: 'Kan se allt i turen och ange sina egna kostbehov',
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
  if (kanAndra(min) && deltagare.userId === null && deltagare.roll !== 'owner') return true
  return deltagare.userId === mittUserId
}

/**
 * Får den inloggade ändra deltagarens kostbehov? Samma regel som policyn på kostbehov: bara personen själv,
 * eftersom uppgifterna bygger på personens eget samtycke. Ingen anger kostbehov åt någon annan, inte ens ägaren,
 * och personer utan konto har inga förrän de har gått med.
 */
export function kanAndraKostbehov(d: { typ: 'person' | 'hund'; userId: string | null }, mittUserId: string): boolean {
  return d.typ === 'person' && d.userId !== null && d.userId === mittUserId
}
