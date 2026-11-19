/**
 * Adress för kontakt och feedback. Enda stället där adressen står.
 * Används av länkarna på startsidan och på integritetssidan. Sätts den till null visas
 * "Kontakt" och "synpunkter" som vanlig text i stället för länkar.
 */
export const KONTAKT_MEJL: string | null = 'minvandring.se@gmail.com'

/** mailto-länk med ämnesrad, eller null när adressen saknas. */
export const KONTAKT_LANK = KONTAKT_MEJL ? `mailto:${KONTAKT_MEJL}?subject=${encodeURIComponent('Synpunkter på MinVandring')}` : null

/**
 * mailto-länk för att rapportera en felaktig uppgift i produktkatalogen, eller null när adressen saknas.
 * Ämnet säger vilken produkt det gäller, och produktens id står i texten så att vi hittar raden.
 */
export function felrapportLank(produkt: { id: string; marke: string; modell: string; version: string | null }): string | null {
  if (!KONTAKT_MEJL) return null
  const namn = [produkt.marke, produkt.modell, produkt.version].filter(Boolean).join(' ')
  const amne = `Fel i katalogen: ${namn}`
  const text = `Vad är fel?\n\n\n\nProdukt: ${namn}\nId: ${produkt.id}`
  return `mailto:${KONTAKT_MEJL}?subject=${encodeURIComponent(amne)}&body=${encodeURIComponent(text)}`
}
