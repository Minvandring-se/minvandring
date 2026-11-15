import { useEffect, useId, useRef, useState } from 'react'
import { animera } from '@/components/start/stig/animationsko'
import { cssIntervall, framsteg, ritintervall, valjStig, type Matt, type Stigbit } from '@/components/start/stig/geometri'
import { Naturdetalj } from '@/components/start/stig/Naturdetalj'
import { useStigKo } from '@/components/start/stig/stigKo'
import { Ledkryss, Vagvisare } from '@/components/start/stig/Vagvisare'

interface Props {
  /** Unikt och stabilt inom startsidan. Används för att minnas vad som redan spelats och för tidslinjernas namn. */
  id: string
  bit: Stigbit
}

const nycklar: Array<keyof Matt> = ['bredd', 'hojd', 'vanster', 'hoger', 'topp', 'botten']

function useMedia(fraga: string) {
  const [traff, setTraff] = useState(() => window.matchMedia(fraga).matches)
  useEffect(() => {
    const media = window.matchMedia(fraga)
    const uppdatera = () => setTraff(media.matches)
    uppdatera()
    media.addEventListener('change', uppdatera)
    return () => media.removeEventListener('change', uppdatera)
  }, [fraga])
  return traff
}

/** Om webbläsaren kan styra animationer med scrollen (CSS scroll-driven animations). */
const stodjerScrollTidslinje = () => typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')

const scrollEgenskaper = ['animation-name', 'animation-duration', 'animation-timing-function', 'animation-fill-mode', 'animation-timeline', 'animation-range']

/** Sätter en animation som följer en view()-tidslinje. Longhands, så att inget nollställs av en shorthand. */
function satsScrollAnimation(mask: SVGPathElement, tidslinje: string, intervall: string) {
  const varden = ['stig-rita', 'auto', 'linear', 'both', tidslinje, intervall]
  scrollEgenskaper.forEach((egenskap, i) => mask.style.setProperty(egenskap, varden[i]))
}

function rensaScrollAnimation(mask: SVGPathElement) {
  for (const egenskap of scrollEgenskaper) mask.style.removeProperty(egenskap)
}

/**
 * En bit av leden i luften mellan sektionen och nästa. Dekorativ.
 * Läggs först i en sektion med relative och isolate. Innehållet ligger i en behållare med
 * data-stiginnehall och samma bredd i alla sektioner. Från 1360 px, när marginalen räcker, visas den
 * fulla varianten som svänger ner mot nästa sektion. Annars en enkel kurva i den nedre luften.
 * Leden ritas fram i takt med scrollen och dras tillbaka när man scrollar upp. Tältet och brasan
 * spelas en gång per sidbesök. Vid minskad rörelse visas allt stilla.
 */
export function Stigavsnitt({ id, bit }: Props) {
  const ko = useStigKo()
  const minskad = useMedia('(prefers-reduced-motion: reduce)')
  const bred = useMedia('(min-width: 1360px)')
  const lagerRef = useRef<HTMLDivElement>(null)
  const nereRef = useRef<HTMLDivElement>(null)
  const uppeRef = useRef<HTMLDivElement>(null)
  const maskNereRef = useRef<SVGPathElement>(null)
  const maskUppeRef = useRef<SVGPathElement>(null)
  const detaljRef = useRef<SVGGElement>(null)
  const flammaRef = useRef<SVGPathElement>(null)
  const glodRef = useRef<SVGEllipseElement>(null)
  const [matt, setMatt] = useState<Matt | null>(null)
  const maskId = `stigmask-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const tidslinje = `--stig-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`

  // Mät sektionen och innehållet. Följer med när en fråga öppnas, en bild laddas eller fönstret ändras.
  useEffect(() => {
    const lager = lagerRef.current
    const sektion = lager?.parentElement
    const innehall = sektion?.querySelector<HTMLElement>('[data-stiginnehall]')
    if (!lager || !sektion || !innehall || typeof ResizeObserver === 'undefined') return

    let ram = 0
    const mat = () => {
      const a = lager.getBoundingClientRect()
      const b = innehall.getBoundingClientRect()
      const nytt: Matt = {
        bredd: a.width,
        hojd: a.height,
        vanster: b.left - a.left,
        hoger: b.right - a.left,
        topp: b.top - a.top,
        botten: b.bottom - a.top,
      }
      setMatt((forra) => (forra && nycklar.every((n) => forra[n] === nytt[n]) ? forra : nytt))
    }
    const schemalagg = () => {
      cancelAnimationFrame(ram)
      ram = requestAnimationFrame(mat)
    }
    const observer = new ResizeObserver(schemalagg)
    observer.observe(lager)
    observer.observe(sektion)
    observer.observe(innehall)
    window.addEventListener('resize', schemalagg)
    schemalagg()

    return () => {
      cancelAnimationFrame(ram)
      observer.disconnect()
      window.removeEventListener('resize', schemalagg)
    }
  }, [])

  const stig = matt && valjStig(matt, bit, bred)
  const dNere = stig?.dBotten
  const dUppe = stig?.dTopp
  const luftNere = matt ? matt.hojd - matt.botten : 0

  // Rita fram leden i takt med scrollen. CSS där det stöds, annars en passiv scroll-lyssnare.
  useEffect(() => {
    const lager = lagerRef.current
    const nere = nereRef.current
    const uppe = uppeRef.current
    const maskNere = maskNereRef.current
    const maskUppe = maskUppeRef.current
    if (!dNere || !lager || !nere || !maskNere) return
    const masker = maskUppe ? [maskNere, maskUppe] : [maskNere]

    if (minskad) {
      for (const mask of masker) {
        rensaScrollAnimation(mask)
        mask.style.strokeDashoffset = '0'
      }
      return
    }

    if (stodjerScrollTidslinje()) {
      const intervall = cssIntervall(luftNere)
      lager.style.setProperty('timeline-scope', `${tidslinje}-nere, ${tidslinje}-uppe`)
      nere.style.setProperty('view-timeline-name', `${tidslinje}-nere`)
      satsScrollAnimation(maskNere, `${tidslinje}-nere`, intervall.nere)
      if (uppe && maskUppe) {
        uppe.style.setProperty('view-timeline-name', `${tidslinje}-uppe`)
        satsScrollAnimation(maskUppe, `${tidslinje}-uppe`, intervall.uppe)
      }
      return () => {
        lager.style.removeProperty('timeline-scope')
        nere.style.removeProperty('view-timeline-name')
        uppe?.style.removeProperty('view-timeline-name')
        for (const mask of masker) rensaScrollAnimation(mask)
      }
    }

    // Reserv: läs lägena och skriv framsteget högst en gång per bildruta medan man scrollar.
    let ram = 0
    const uppdatera = () => {
      ram = 0
      const fonster = window.innerHeight
      const intervall = ritintervall(luftNere, fonster)
      const pNere = fonster - nere.getBoundingClientRect().bottom
      const pUppe = uppe ? fonster - uppe.getBoundingClientRect().top : 0
      maskNere.style.strokeDashoffset = String(1 - framsteg(pNere, intervall.nere))
      if (maskUppe) maskUppe.style.strokeDashoffset = String(1 - framsteg(pUppe, intervall.uppe))
    }
    const schemalagg = () => {
      if (!ram) ram = requestAnimationFrame(uppdatera)
    }
    window.addEventListener('scroll', schemalagg, { passive: true })
    window.addEventListener('resize', schemalagg)
    uppdatera()
    return () => {
      cancelAnimationFrame(ram)
      window.removeEventListener('scroll', schemalagg)
      window.removeEventListener('resize', schemalagg)
    }
  }, [dNere, dUppe, luftNere, minskad, tidslinje])

  const typ = bit.detalj
  const detaljX = stig?.figurer.detalj?.x
  const detaljY = stig?.figurer.detalj?.y

  // Tältet och brasan spelas en gång när leden ritats fram dit. Avbryts om de lämnar skärmen eller fliken döljs.
  useEffect(() => {
    const nere = nereRef.current
    const detalj = detaljRef.current
    const flamma = flammaRef.current
    const glod = glodRef.current
    if (!typ || detaljX === undefined || !nere || !detalj) return

    /** Sluttillståndet. Statiskt (minskad rörelse) visar tältet och full eld. */
    function stilla(statiskt = false) {
      if (!detalj) return
      detalj.style.transform = 'none'
      detalj.style.opacity = typ === 'talt' && !statiskt ? '0' : '1'
      if (flamma) {
        flamma.style.transform = 'none'
        flamma.style.opacity = statiskt ? '1' : '0.3'
      }
      if (glod) glod.style.opacity = statiskt ? '0.5' : '0.15'
    }

    const statiskt = minskad || typeof IntersectionObserver === 'undefined' || typeof detalj.animate !== 'function'
    if (statiskt || ko.harSpelat(id)) {
      stilla(statiskt)
      if (statiskt) ko.markeraSpelad(id)
      return
    }

    detalj.style.opacity = '0'
    let synlig = false
    let avbryt: (() => void) | null = null
    // Falskt när effekten har städats, till exempel när minskad rörelse slås på mitt i en scen.
    // Då har nästa körning redan satt rätt läge och den avbrutna scenen får inte skriva över det.
    let aktuell = true

    function startaOmSynlig() {
      if (!synlig || document.hidden || avbryt || ko.harSpelat(id)) return
      avbryt = ko.laggTill(async (signal) => {
        if (signal.aborted || ko.harSpelat(id) || !detalj) return
        ko.markeraSpelad(id)
        const scen = new AbortController()
        const avbrytScen = () => scen.abort()
        signal.addEventListener('abort', avbrytScen, { once: true })
        try {
          if (typ === 'talt') {
            await animera(
              detalj,
              [
                { opacity: 0, transform: 'translateY(4px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              { duration: 650, easing: 'ease-out' },
              scen.signal,
            )
            await animera(detalj, [{ opacity: 1 }, { opacity: 1 }], { duration: 1100 }, scen.signal)
            await animera(detalj, [{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'ease-in-out' }, scen.signal)
          }

          if (typ === 'eld' && flamma) {
            await animera(detalj, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' }, scen.signal)
            // Tre sekunder, ingen loop och inga gnistor.
            await animera(
              flamma,
              [
                { opacity: 0.85, transform: 'scale(1)' },
                { opacity: 1, transform: 'scale(1.02,1.05)' },
                { opacity: 0.82, transform: 'scale(.99,.97)' },
                { opacity: 0.96, transform: 'scale(1.01,1.03)' },
                { opacity: 0.85, transform: 'scale(1)' },
              ],
              { duration: 3000, easing: 'ease-in-out' },
              scen.signal,
            )
            await animera(flamma, [{ opacity: 0.85 }, { opacity: 0.3 }], { duration: 650, easing: 'ease-out' }, scen.signal)
          }
        } catch (fel) {
          if (!scen.signal.aborted) throw fel
        } finally {
          // Sätt sluttillståndet innan animationerna med fill forwards tas bort.
          if (aktuell) stilla()
          scen.abort()
          signal.removeEventListener('abort', avbrytScen)
        }
      })
    }

    function pausa() {
      avbryt?.()
      avbryt = null
    }

    // Startar när mellanrummet nått upp till 70 % av fönstret. Då är leden i stort sett utritad.
    const observer = new IntersectionObserver(
      (poster) => {
        synlig = poster.some((p) => p.isIntersecting)
        if (synlig) startaOmSynlig()
        else pausa()
      },
      { rootMargin: '0px 0px -30% 0px' },
    )
    observer.observe(nere)
    const synlighet = () => {
      if (document.hidden) pausa()
      else startaOmSynlig()
    }
    document.addEventListener('visibilitychange', synlighet)

    return () => {
      aktuell = false
      observer.disconnect()
      document.removeEventListener('visibilitychange', synlighet)
      pausa()
    }
  }, [id, ko, minskad, typ, detaljX, detaljY])

  return (
    // overflow-clip, inte overflow-hidden: hidden gör lagret till en scrollbehållare och då skulle
    // view()-tidslinjerna följa lagret i stället för sidan.
    <div ref={lagerRef} aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-clip">
      {matt && stig && (
        <>
          <div ref={nereRef} className="absolute inset-x-0 bottom-0" style={{ height: luftNere }} />
          {stig.dTopp && <div ref={uppeRef} className="absolute inset-x-0 top-0" style={{ height: matt.topp }} />}
          {/* Samma mått som viewBox, så att leden och strecken aldrig dras ut. */}
          <svg
            width={matt.bredd}
            height={matt.hojd}
            viewBox={`0 0 ${matt.bredd} ${matt.hojd}`}
            focusable="false"
            className="absolute top-0 left-0 block max-w-none"
          >
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={matt.bredd} height={matt.hojd} style={{ maskType: 'alpha' }}>
                {/* Masken avtäcker den streckade linjen. Med pathLength 1 betyder 0–1 hur stor del som syns. */}
                <path
                  ref={maskNereRef}
                  d={stig.dBotten}
                  pathLength={1}
                  strokeDasharray="1 1"
                  fill="none"
                  stroke="white"
                  strokeWidth={5}
                  style={{ strokeDashoffset: minskad ? 0 : 1 }}
                />
                {stig.dTopp && (
                  <path
                    ref={maskUppeRef}
                    d={stig.dTopp}
                    pathLength={1}
                    strokeDasharray="1 1"
                    fill="none"
                    stroke="white"
                    strokeWidth={5}
                    style={{ strokeDashoffset: minskad ? 0 : 1 }}
                  />
                )}
              </mask>
            </defs>
            <path
              d={stig.dTopp ? `${stig.dTopp} ${stig.dBotten}` : stig.dBotten}
              fill="none"
              strokeWidth={2}
              strokeDasharray="7 9"
              strokeLinecap="round"
              className="stroke-foreground/30"
              mask={`url(#${maskId})`}
            />
            {stig.figurer.ledkryss && <Ledkryss x={stig.figurer.ledkryss.x} y={stig.figurer.ledkryss.y} />}
            {stig.figurer.vagvisare && <Vagvisare x={stig.figurer.vagvisare.x} y={stig.figurer.vagvisare.y} />}
            {typ && stig.figurer.detalj && (
              <Naturdetalj typ={typ} punkt={stig.figurer.detalj} detaljRef={detaljRef} flammaRef={flammaRef} glodRef={glodRef} />
            )}
          </svg>
        </>
      )}
    </div>
  )
}
