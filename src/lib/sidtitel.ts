/** Titeln i webbläsarens flik när sidan inte har en egen. Samma som i index.html. */
export const STANDARDTITEL = 'MinVandring · Planera. Packa. Upplev.'

/** "Mina turer" → "Mina turer · MinVandring". Tom eller saknad text ger standardtiteln. */
export function sidtitel(sida: string | null | undefined): string {
  const text = sida?.trim()
  return text ? `${text} · MinVandring` : STANDARDTITEL
}
