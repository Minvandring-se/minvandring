import { useCallback, useEffect, useState } from 'react'
import { TEMAFARG, aktivtLage, lasTemaval, sparaTemaval, temaAttribut, type Lage, type Temaval } from '@/lib/tema'

const MORK_ENHET = '(prefers-color-scheme: dark)'

function lagring(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Sätter data-tema på html och webbläsarens färg runt sidan. Samma sak som skriptet i index.html gör vid start. */
export function tillampaTema(val: Temaval) {
  const html = document.documentElement
  const attribut = temaAttribut(val)
  if (attribut) html.setAttribute('data-tema', attribut)
  else html.removeAttribute('data-tema')
  // Varje meta theme-color har en media för ljust eller mörkt. Ett val skriver över båda, "system" låter media bestämma.
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const egen: Lage = meta.media.includes('dark') ? 'mork' : 'ljus'
    meta.content = TEMAFARG[attribut ?? egen]
  }
}

/**
 * Valet av ljust, mörkt eller som enheten, och läget som gäller just nu.
 * Valet sparas på enheten. Med "system" följer läget enheten, även när den byter medan sidan är öppen.
 */
export function useTema() {
  const [val, setVal] = useState<Temaval>(() => lasTemaval(lagring()))
  const [enhetenArMork, setEnhetenArMork] = useState(() => window.matchMedia?.(MORK_ENHET).matches ?? false)

  useEffect(() => {
    const media = window.matchMedia?.(MORK_ENHET)
    if (!media) return
    const andrad = (e: MediaQueryListEvent) => setEnhetenArMork(e.matches)
    media.addEventListener('change', andrad)
    return () => media.removeEventListener('change', andrad)
  }, [])

  const valj = useCallback((nytt: Temaval) => {
    sparaTemaval(lagring(), nytt)
    tillampaTema(nytt)
    setVal(nytt)
  }, [])

  return { val, valj, lage: aktivtLage(val, enhetenArMork) }
}
