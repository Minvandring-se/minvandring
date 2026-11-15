import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router'

/**
 * Rullar till toppen när man går till en ny sida. Går man bakåt eller framåt får webbläsaren
 * sköta läget själv, och en länk till en del av sidan (#deltagare) rullar dit som vanligt.
 */
export function RullaUpp() {
  const { pathname, hash } = useLocation()
  const typ = useNavigationType()

  useEffect(() => {
    if (typ === 'POP' || hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash, typ])

  return null
}
