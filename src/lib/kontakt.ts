/**
 * Adress för kontakt och feedback. Enda stället där adressen står.
 * null tills vi har en riktig adress. Då visas "Kontakt" och "synpunkter" som vanlig text och adressen som "...".
 * Sätt in adressen här, till exempel 'hej@minvandring.se', så blir de länkar igen på startsidan och integritetssidan.
 */
export const KONTAKT_MEJL = null as string | null

/** mailto-länk med ämnesrad, eller null när adressen saknas. */
export const KONTAKT_LANK = KONTAKT_MEJL ? `mailto:${KONTAKT_MEJL}?subject=${encodeURIComponent('Synpunkter på MinVandring')}` : null
