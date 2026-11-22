import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'
import { bladIState } from '@/lib/meny'
import { rullmal } from '@/lib/rullning'

/** Rullningsläget för varje sida i historiken, så att bakåt hamnar där man var. Lever så länge fliken är öppen. */
const lagen = new Map<string, number>()

/** Turens id om sökvägen är en tur eller en av dess delsidor. Flikbyten inom samma tur ska inte rulla sidan. */
const turId = (sokvag: string) => /^\/tur\/([^/]+)/.exec(sokvag)?.[1]

/**
 * Sköter rullningsläget vid sidbyte. En ny sida visas från toppen, och går man bakåt eller framåt
 * hamnar man där man var. Webbläsarens egen återställning räcker inte, eftersom innehållet hämtas efter sidbytet.
 */
export function RullaUpp() {
  const { key, pathname, hash, state } = useLocation()
  const typ = useNavigationType()
  const aktuell = useRef(key)
  const forraSokvag = useRef(pathname)
  const forraBlad = useRef(false)

  useEffect(() => {
    history.scrollRestoration = 'manual'
    const spara = () => lagen.set(aktuell.current, window.scrollY)
    window.addEventListener('scroll', spara, { passive: true })
    return () => window.removeEventListener('scroll', spara)
  }, [])

  // I layoutfasen, innan webbläsaren hinner rulla om den nya sidan och skriva över det sparade läget.
  useLayoutEffect(() => {
    // Samma sida: ett flikbyte inom samma tur, eller ett blad i mobilmenyn som öppnas eller stängs på samma adress.
    const blad = bladIState(state) !== null
    const bladByte = pathname === forraSokvag.current && (blad || forraBlad.current)
    const sammaTur = turId(pathname) !== undefined && turId(pathname) === turId(forraSokvag.current)
    aktuell.current = key
    forraSokvag.current = pathname
    forraBlad.current = blad
    if (bladByte) return

    const mal = rullmal(typ, hash !== '', lagen.get(key), sammaTur)
    if (mal === null) return
    window.scrollTo({ top: mal, left: 0, behavior: 'instant' })
    if (mal === 0) return

    // Sidan kan vara för kort tills innehållet har hämtats. Försök en stund till, men ge upp om man själv rullar.
    let forsok = 0
    const avbryt = () => clearInterval(timer)
    const timer = setInterval(() => {
      if (Math.abs(window.scrollY - mal) < 2 || ++forsok > 30) return avbryt()
      window.scrollTo({ top: mal, left: 0, behavior: 'instant' })
    }, 50)
    window.addEventListener('wheel', avbryt, { once: true, passive: true })
    window.addEventListener('touchstart', avbryt, { once: true, passive: true })
    return () => {
      avbryt()
      window.removeEventListener('wheel', avbryt)
      window.removeEventListener('touchstart', avbryt)
    }
  }, [key, pathname, hash, state, typ])

  return null
}
