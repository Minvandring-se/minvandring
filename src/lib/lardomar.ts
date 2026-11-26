// Kom ihåg till nästa vandring: personliga lärdomar, sorterade efter ämne.
// Ämnena står också i checken på lardomar.amne i databasen, och ett test kontrollerar att de stämmer överens.

export const AMNEN = [
  { nyckel: 'packning', etikett: 'Packning' },
  { nyckel: 'mat', etikett: 'Mat och kök' },
  { nyckel: 'sova', etikett: 'Sova' },
  { nyckel: 'klader', etikett: 'Kläder' },
  { nyckel: 'leden', etikett: 'Leden' },
  { nyckel: 'ovrigt', etikett: 'Övrigt' },
] as const

export type Amne = (typeof AMNEN)[number]['nyckel']

export const MAX_LARDOM = 300

/** En lärdom, som raden ser ut i lardomar. */
export interface Lardom {
  id: string
  tur_id: string | null
  /** Turens namn när lärdomen skrevs. */
  tur_namn: string | null
  amne: Amne
  text: string
  skapad: string
}

export function arAmne(varde: string): varde is Amne {
  return AMNEN.some((a) => a.nyckel === varde)
}

export function amnesEtikett(amne: string): string {
  return AMNEN.find((a) => a.nyckel === amne)?.etikett ?? 'Övrigt'
}

/** Texten som den sparas, eller ett fel som går att visa. */
export function tolkaLardom(text: string): { text: string } | { fel: string } {
  const t = text.trim()
  if (!t) return { fel: 'Skriv vad du vill komma ihåg.' }
  if (t.length > MAX_LARDOM) return { fel: `Lärdomen får vara högst ${MAX_LARDOM} tecken. Korta ner den.` }
  return { text: t }
}

/** Lärdomarna per ämne i ämnenas ordning, nyast först inom ämnet. Ämnen utan lärdomar tas inte med. */
export function perAmne(lardomar: readonly Lardom[]): { amne: Amne; etikett: string; lardomar: Lardom[] }[] {
  return AMNEN.map((a) => ({
    amne: a.nyckel,
    etikett: a.etikett,
    lardomar: lardomar.filter((l) => l.amne === a.nyckel).sort((x, y) => y.skapad.localeCompare(x.skapad)),
  })).filter((g) => g.lardomar.length > 0)
}

/** Lärdomarna från turen och från andra turer, var för sig. */
export function delaUpp(lardomar: readonly Lardom[], turId: string): { harifran: Lardom[]; tidigare: Lardom[] } {
  return {
    harifran: lardomar.filter((l) => l.tur_id === turId),
    tidigare: lardomar.filter((l) => l.tur_id !== turId),
  }
}

/** Varifrån en lärdom kom, till exempel "Från Kungsleden 2026". null om den inte hör till någon tur. */
export function franText(l: Pick<Lardom, 'tur_namn'>): string | null {
  return l.tur_namn ? `Från ${l.tur_namn}` : null
}
