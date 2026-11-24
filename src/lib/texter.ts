// Texter som ska vara likadana överallt i appen. Reglerna står i docs/design/riktning.md under Ord.

/** Felet när något inte gick att hämta: "Det gick inte att hämta dina turer. Kontrollera uppkopplingen och försök igen." */
export function laddfelText(vad: string): string {
  return `Det gick inte att hämta ${vad}. Kontrollera uppkopplingen och försök igen.`
}
