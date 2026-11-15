import type { TurMedDeltagare } from '@/components/app/TurKort'

/**
 * Den senast hämtade listan i Mina turer, per användare. Visas direkt när man kommer tillbaka till listan,
 * så att sidan har sitt innehåll och rullningsläget går att återställa. Listan hämtas ändå om i bakgrunden.
 */
let senaste: { anvandarId: string; turer: TurMedDeltagare[] } | null = null

export function minnsTurlistan(anvandarId: string, turer: TurMedDeltagare[]) {
  senaste = { anvandarId, turer }
}

export function mindTurlista(anvandarId: string): TurMedDeltagare[] | null {
  return senaste?.anvandarId === anvandarId ? senaste.turer : null
}

/** Glömmer listan när en tur har skapats, raderats eller lämnats, så att en gammal lista inte visas. */
export function glomTurlistan() {
  senaste = null
}
