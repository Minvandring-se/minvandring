/** Vänner: typerna från databasens funktioner, texterna på sidan Vänner och felmeddelandena. */

import { kontrolleraEpost } from '@/lib/konto'
import { notistid } from '@/lib/notiser'

/** Adressen som vänlänkar pekar på. Samma som länken i inbjudan på Hem. */
export const WEBBADRESS = 'https://www.minvandring.se'

export interface Van {
  user_id: string
  namn: string
  bild_uppdaterad: string | null
  turer_ihop: number
  senaste_tur: string | null
}

export interface Forfragan {
  id: string
  fran_user_id: string
  namn: string
  skapad: string
}

export interface Skickad {
  id: string
  /** Mejladressen, eller namnet för någon man har vandrat med. */
  visas: string
  skapad: string
}

export interface VandratIhop {
  user_id: string
  namn: string
  bild_uppdaterad: string | null
  turer_ihop: number
}

export interface Vanlank {
  kod: string
  giltig_till: string
}

export interface Vanlankinfo {
  namn: string
  egen: boolean
  redan_van: boolean
}

/** Hela adressen till en vänlänk. */
export function vanlankAdress(kod: string): string {
  return `${WEBBADRESS}/van/${kod}`
}

/** "3 turer ihop, senast Kungsleden 2026", eller "Inga turer ihop än". */
export function turerIhopText(turer: number, senaste: string | null): string {
  if (turer <= 0) return 'Inga turer ihop än'
  const antal = turer === 1 ? '1 tur ihop' : `${turer} turer ihop`
  return senaste ? `${antal}, senast ${senaste}` : antal
}

const MANADER = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']

/** "Länken gäller till 3 december." Räknas i svensk tid. */
export function giltigTillText(giltigTill: string): string {
  const [, manad, dag] = new Date(giltigTill).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' }).split('-').map(Number)
  return `Länken gäller till ${dag} ${MANADER[manad - 1]}.`
}

/** Felmeddelande för adressen i Lägg till en vän, eller null när den ser rimlig ut. */
export function kontrolleraVanadress(epost: string): string | null {
  const fel = kontrolleraEpost(epost)
  return fel === 'Fyll i din mejladress.' ? 'Fyll i din väns mejladress.' : fel
}

/** Felet från databasen som text till användaren. */
export function vanfel(meddelande: string | undefined): string {
  if (meddelande?.includes('För många vänförfrågningar')) return 'Du har skickat många förfrågningar i dag. Vänta till i morgon och försök igen.'
  if (meddelande?.includes('För många försök')) return 'Du har provat för många länkar som inte fungerar. Vänta en timme och försök igen.'
  if (meddelande?.includes('ser inte rätt ut')) return 'Mejladressen ser inte rätt ut.'
  if (meddelande?.includes('samma tur')) return 'Ni behöver ha varit med i samma tur.'
  if (meddelande?.includes('egen vänlänk')) return 'Det här är din egen vänlänk. Skicka den till den du vill bli vän med.'
  if (meddelande?.includes('Hittar ingen förfrågan')) return 'Förfrågan finns inte längre.'
  if (meddelande?.includes('måste vara inloggad')) return 'Du är utloggad. Logga in och försök igen.'
  if (meddelande?.includes('Bara ägare och redigerare')) return 'Bara ägare och redigerare kan lägga till vänner i turen.'
  if (meddelande?.includes('Högst 50')) return 'Lägg till högst 50 vänner åt gången.'
  return 'Det gick inte att spara just nu. Kontrollera uppkopplingen och försök igen.'
}

/** "Förfrågan skickad nyss", "för 5 min sedan", "i går" eller "den 24 nov". */
export function skickadText(skapad: string, nu: Date): string {
  const tid = notistid(skapad, nu)
  if (tid === 'nyss' || tid === 'i går') return `Förfrågan skickad ${tid}`
  if (/ (min|tim)$/.test(tid)) return `Förfrågan skickad för ${tid} sedan`
  return `Förfrågan skickad den ${tid}`
}

/** Vännerna som inte redan är med i turen, i samma ordning som förut. */
export function vannerUtanfor<T extends { user_id: string }>(vanner: readonly T[], medIturen: readonly (string | null | undefined)[]): T[] {
  const med = new Set(medIturen)
  return vanner.filter((v) => !med.has(v.user_id))
}

/** Vännerna som var med i en annan tur, för "Samma som Kungsleden 2026". */
export function sammaSom(vanner: readonly { user_id: string }[], deltagare: readonly { user_id?: string | null }[]): Set<string> {
  const med = new Set(deltagare.map((d) => d.user_id))
  return new Set(vanner.filter((v) => med.has(v.user_id)).map((v) => v.user_id))
}

/** Turerna man kan välja under "Samma som": de där minst en vän var med, senast skapad först. */
export function turerMedVanner<T extends { skapad: string; deltagare: readonly { user_id?: string | null }[] }>(
  turer: readonly T[],
  vanner: readonly { user_id: string }[],
): T[] {
  return turer.filter((t) => sammaSom(vanner, t.deltagare).size > 0).toSorted((a, b) => b.skapad.localeCompare(a.skapad))
}

/** "Anna är tillagd i turen." eller "3 vänner är tillagda i turen." */
export function tillagdaText(antal: number, namn?: string): string {
  if (antal <= 0) return 'Ingen ny lades till. De kan redan vara med i turen.'
  if (antal === 1) return `${namn ?? '1 vän'} är tillagd i turen.`
  return `${antal} vänner är tillagda i turen.`
}
