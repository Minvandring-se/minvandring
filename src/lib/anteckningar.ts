// Anteckningar i en tur. Var och en skriver egna. En delad anteckning syns för alla i turen, en privat bara för
// den som skrev den. Behörigheten garanteras av RLS på anteckningar. Funktionerna här styr bara vad som visas.
import type { Roll } from './roller'

export const MAX_ANTECKNING = 2000

/** En anteckning, som raden ser ut i anteckningar. */
export interface Anteckning {
  id: string
  tur_id: string
  user_id: string
  text: string
  privat: boolean
  skapad: string
  andrad: string
}

/** Texten som den sparas, eller ett fel som går att visa. */
export function tolkaAnteckning(text: string): { text: string } | { fel: string } {
  const t = text.trim()
  if (!t) return { fel: 'Skriv något i anteckningen.' }
  if (t.length > MAX_ANTECKNING) return { fel: 'Anteckningen får vara högst 2\u00a0000 tecken. Korta ner den.' }
  return { text: t }
}

/** Nyast först. */
export function sorteraAnteckningar(anteckningar: readonly Anteckning[]): Anteckning[] {
  return [...anteckningar].sort((a, b) => b.skapad.localeCompare(a.skapad))
}

/** Man ändrar bara sina egna. */
export function kanAndraAnteckning(a: Pick<Anteckning, 'user_id'>, mittUserId: string): boolean {
  return a.user_id === mittUserId
}

/** Man tar bort sina egna, och ägaren tar bort andras delade. */
export function kanTaBortAnteckning(a: Pick<Anteckning, 'user_id' | 'privat'>, mittUserId: string, minRoll: Roll | null): boolean {
  return a.user_id === mittUserId || (minRoll === 'owner' && !a.privat)
}

/** Ett datum som "26 nov 2026", och "ändrad" när anteckningen har ändrats mer än en minut efter att den skrevs. */
export function anteckningsdatum(a: Pick<Anteckning, 'skapad' | 'andrad'>): string {
  const datum = new Date(a.skapad).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')
  const andrad = new Date(a.andrad).getTime() - new Date(a.skapad).getTime() > 60_000
  return andrad ? `${datum}, ändrad` : datum
}

/** Vem som skrev anteckningen: "Du", deltagarens namn eller "En tidigare deltagare". */
export function skribent(a: Pick<Anteckning, 'user_id'>, deltagare: readonly { user_id: string | null; namn: string }[], mittUserId: string): string {
  if (a.user_id === mittUserId) return 'Du'
  return deltagare.find((d) => d.user_id === a.user_id)?.namn || 'En tidigare deltagare'
}
