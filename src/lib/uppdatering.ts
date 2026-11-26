// Appen uppdaterar sig själv. Service workern (vite-plugin-pwa, autoUpdate) tar en ny version i bruk direkt när den
// har installerats, och den nya versionen syns nästa gång sidan laddas. Här söker appen efter en ny version när den
// startar, när man kommer tillbaka till fliken och en gång i timmen. Sidan laddas aldrig om mitt i något, så det man
// skriver finns kvar.
//
// Ett undantag: står en gammal version öppen och man går till en sida vars fil inte längre finns (den hör till den
// gamla versionen), laddas sidan om en gång till den nya versionen i stället för att visa felsidan. Det sker när man
// byter sida, inte när man skriver.

/** Hur ofta appen söker efter en ny version medan den står öppen. */
export const SOK_VAR_MS = 60 * 60 * 1000

/** Inom den här tiden efter en omladdning laddas sidan inte om igen, så att den aldrig hamnar i en slinga. */
export const SPARR_MS = 30 * 1000

const NYCKEL = 'minvandring-omladdad'

/** Om sidan får laddas om för att en fil saknas: inte om den redan laddades om nyss. */
export function farLaddaOm(senast: string | null, nu: number): boolean {
  const tid = senast === null ? NaN : Number(senast)
  return !Number.isFinite(tid) || nu - tid > SPARR_MS || nu < tid
}

/** Det i webbläsaren som behövs, så att funktionen går att testa utan webbläsare. */
export interface Webblasare {
  serviceWorker: Pick<ServiceWorkerContainer, 'register'> | undefined
  addEventListener: (typ: 'vite:preloadError' | 'visibilitychange', lyssnare: (e: Event) => void) => void
  synlig: () => boolean
  sessionStorage: Pick<Storage, 'getItem' | 'setItem'>
  laddaOm: () => void
  setInterval: (f: () => void, ms: number) => unknown
  nu: () => number
}

/** Registrerar service workern och söker efter nya versioner. Anropas en gång när appen startar, bara i produktion. */
export async function startaUppdateringar(w: Webblasare): Promise<void> {
  w.addEventListener('vite:preloadError', (e) => {
    if (!farLaddaOm(w.sessionStorage.getItem(NYCKEL), w.nu())) return
    e.preventDefault()
    w.sessionStorage.setItem(NYCKEL, String(w.nu()))
    w.laddaOm()
  })
  if (!w.serviceWorker) return
  const registrering = await w.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => null)
  if (!registrering) return
  const sok = () => void registrering.update().catch(() => {})
  w.addEventListener('visibilitychange', () => {
    if (w.synlig()) sok()
  })
  w.setInterval(sok, SOK_VAR_MS)
}

/** Webbläsarens riktiga delar. */
export function webblasaren(): Webblasare {
  return {
    serviceWorker: 'serviceWorker' in navigator ? navigator.serviceWorker : undefined,
    addEventListener: (typ, lyssnare) => (typ === 'visibilitychange' ? document : window).addEventListener(typ, lyssnare),
    synlig: () => document.visibilityState === 'visible',
    sessionStorage: window.sessionStorage,
    laddaOm: () => window.location.reload(),
    setInterval: (f, ms) => window.setInterval(f, ms),
    nu: () => Date.now(),
  }
}
