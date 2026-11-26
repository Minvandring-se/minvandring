/** Grupper: egna etiketter för vänner man brukar vandra med, till exempel Fjällgänget. Bara ägaren ser dem. */

import { uppraknade } from '@/lib/kost'

export const GRUPPNAMN_MAX = 40

export interface Grupp {
  id: string
  namn: string
  /** Vännernas user_id. */
  medlemmar: string[]
}

/** Felmeddelande för gruppens namn, eller null när det duger. Namnet får bara finnas en gång, oavsett stora och små bokstäver. */
export function kontrolleraGruppnamn(namn: string, grupper: readonly Grupp[], egetId: string | null): string | null {
  const rent = namn.trim()
  if (!rent) return 'Ge gruppen ett namn.'
  if (rent.length > GRUPPNAMN_MAX) return `Namnet får vara högst ${GRUPPNAMN_MAX} tecken.`
  if (grupper.some((g) => g.id !== egetId && g.namn.trim().toLowerCase() === rent.toLowerCase())) return 'Du har redan en grupp med det namnet.'
  return null
}

/** Namnen på gruppens medlemmar som fortfarande är vänner, i vännernas ordning. */
export function medlemsnamn(grupp: Grupp, vanner: readonly { user_id: string; namn: string }[]): string[] {
  const med = new Set(grupp.medlemmar)
  return vanner.filter((v) => med.has(v.user_id)).map((v) => v.namn)
}

/** "Anna, Erik och Padde", eller "Inga vänner i gruppen än". */
export function medlemsText(grupp: Grupp, vanner: readonly { user_id: string; namn: string }[]): string {
  const namn = medlemsnamn(grupp, vanner)
  return namn.length ? uppraknade(namn) : 'Inga vänner i gruppen än'
}

/** Gruppens medlemmar bland de valbara vännerna, till exempel de som inte redan är med i turen. */
export function valjGrupp(grupp: Grupp, valbara: readonly { user_id: string }[]): Set<string> {
  const med = new Set(grupp.medlemmar)
  return new Set(valbara.filter((v) => med.has(v.user_id)).map((v) => v.user_id))
}

/** Felet från databasen som text till användaren. */
export function gruppfel(meddelande: string | undefined): string {
  if (meddelande?.includes('grupper_unikt_namn') || meddelande?.includes('duplicate')) return 'Du har redan en grupp med det namnet.'
  if (meddelande?.includes('högst 50')) return 'En grupp kan ha högst 50 vänner.'
  if (meddelande?.includes('Hittar ingen grupp')) return 'Gruppen finns inte längre.'
  return 'Det gick inte att spara gruppen. Kontrollera uppkopplingen och försök igen.'
}
