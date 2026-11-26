/** Kontroller och felmeddelanden för inloggning, nytt konto och nytt lösenord. */

import { KONTAKT_MEJL } from '@/lib/kontakt'

export const MINSTA_LOSENORD = 8
export const STANDARD_VIDARE = '/hem'

const EPOST = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Felmeddelande för mejladressen, eller null om den ser rimlig ut. */
export function kontrolleraEpost(epost: string): string | null {
  if (!epost.trim()) return 'Fyll i din mejladress.'
  if (!EPOST.test(epost.trim())) return 'Mejladressen ser inte rätt ut.'
  return null
}

/** Felmeddelande för ett nytt lösenord, eller null om det duger. */
export function kontrolleraLosenord(losenord: string): string | null {
  if (!losenord) return 'Fyll i ett lösenord.'
  if (losenord.length < MINSTA_LOSENORD) return `Lösenordet behöver minst ${MINSTA_LOSENORD} tecken.`
  return null
}

/** Felmeddelande för namnet, eller null om det duger. */
export function kontrolleraNamn(namn: string): string | null {
  return namn.trim() ? null : 'Fyll i ditt namn.'
}

/**
 * Sidan man skickas till efter inloggningen. Bara sökvägar inom appen godtas,
 * så att en länk inte kan skicka vidare till en annan webbplats.
 */
export function sakerVidare(vidare: string | null): string {
  if (!vidare || !vidare.startsWith('/') || vidare.startsWith('//') || vidare.startsWith('/\\')) return STANDARD_VIDARE
  return vidare
}

/** Sökväg med ?vidare= kvar, så att man hamnar rätt även efter att ha bytt mellan logga in och skapa konto. */
export function medVidare(sokvag: string, vidare: string): string {
  return vidare === STANDARD_VIDARE ? sokvag : `${sokvag}?vidare=${encodeURIComponent(vidare)}`
}

/** Fel som inte känns igen. Med kontaktadress, så att man kan höra av sig om det fortsätter. */
export const ALLMANT_FEL = KONTAKT_MEJL
  ? `Något gick fel. Försök igen. Om det fortsätter, hör av dig till ${KONTAKT_MEJL}.`
  : 'Något gick fel. Försök igen.'

/** Felet från Supabase Auth som ett begripligt meddelande på svenska. */
export function authFel(fel: { code?: string; status?: number; name?: string } | null): string {
  switch (fel?.code) {
    case 'invalid_credentials':
      return 'Fel mejladress eller lösenord.'
    case 'email_not_confirmed':
      return 'Du behöver bekräfta din mejladress först. Klicka på länken i mejlet vi skickade.'
    case 'user_already_exists':
    case 'email_exists':
      return 'Det finns redan ett konto med den mejladressen. Logga in i stället.'
    case 'weak_password':
      return `Lösenordet är för svagt. Använd minst ${MINSTA_LOSENORD} tecken.`
    case 'same_password':
      return 'Välj ett annat lösenord än det du hade förut.'
    case 'email_address_invalid':
      return 'Mejladressen ser inte rätt ut.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'För många försök. Vänta en stund och försök igen.'
    case 'signup_disabled':
      return 'Det går inte att skapa nya konton just nu.'
  }
  if (fel?.name === 'AuthRetryableFetchError' || fel?.status === 0) {
    return 'Det gick inte att nå servern. Kontrollera uppkopplingen och försök igen.'
  }
  if (fel?.status === 429) return 'För många försök. Vänta en stund och försök igen.'
  return ALLMANT_FEL
}
