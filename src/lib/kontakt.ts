/**
 * Adress för kontakt och feedback. Enda stället där adressen står.
 * Används av länkarna på startsidan och på integritetssidan. Sätts den till null visas
 * "Kontakt" och "synpunkter" som vanlig text i stället för länkar.
 */
export const KONTAKT_MEJL: string | null = 'minvandring.se@gmail.com'

/** mailto-länk med ämnesrad, eller null när adressen saknas. */
export const KONTAKT_LANK = KONTAKT_MEJL ? `mailto:${KONTAKT_MEJL}?subject=${encodeURIComponent('Synpunkter på MinVandring')}` : null
