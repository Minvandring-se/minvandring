import { useEffect, useId, useRef, useState } from 'react'
import { animera } from '@/components/start/stig/animationsko'
import { beraknaStig, type Matt, type Stigbit } from '@/components/start/stig/geometri'
import { Naturdetalj } from '@/components/start/stig/Naturdetalj'
import { useStigKo } from '@/components/start/stig/stigKo'
import { Ledkryss, Vagvisare } from '@/components/start/stig/Vagvisare'

interface Props {
  /** Unikt och stabilt inom startsidan. Används för att minnas vad som redan spelats. */
  id: string
  bit: Stigbit
}

const nycklar: Array<keyof Matt> = ['bredd', 'hojd', 'vanster', 'hoger', 'topp', 'botten']

function useMinskadRorelse() {
  const [minskad, setMinskad] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const uppdatera = () => setMinskad(media.matches)
    uppdatera()
    media.addEventListener('change', uppdatera)
    return () => media.removeEventListener('change', uppdatera)
  }, [])
  return minskad
}

/**
 * En bit av leden i sektionens nedre padding, mellan sektionen och nästa. Dekorativ.
 * Läggs först i en sektion med relative, isolate och 80 px padding uppe och nere. Innehållet ligger
 * i en behållare med data-stiginnehall och samma bredd i alla sektioner. Biten ritas fram en gång
 * när mellanrummet syns. Vid minskad rörelse visas allt stilla.
 */
export function Stigavsnitt({ id, bit }: Props) {
  const ko = useStigKo()
  const minskad = useMinskadRorelse()
  const lagerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const maskRef = useRef<SVGPathElement>(null)
  const detaljRef = useRef<SVGGElement>(null)
  const flammaRef = useRef<SVGPathElement>(null)
  const glodRef = useRef<SVGEllipseElement>(null)
  const [matt, setMatt] = useState<Matt | null>(null)
  const maskId = `stigmask-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

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

  const stig = matt && beraknaStig(matt, bit)
  const d = stig?.d
  const typ = bit.detalj
  const detaljX = stig?.detaljPunkt.x
  const detaljY = stig?.detaljPunkt.y

  // Spela scenen en gång när mellanrummet syns. Avbryts om det lämnar skärmen eller fliken döljs.
  useEffect(() => {
    const mask = maskRef.current
    const trigger = triggerRef.current
    const detalj = detaljRef.current
    const flamma = flammaRef.current
    const glod = glodRef.current
    if (!d || !mask || !trigger) return

    /** Sluttillståndet. Statiskt (minskad rörelse) visar tältet och full eld. */
    function stilla(statiskt = false) {
      if (!mask) return
      mask.style.visibility = 'visible'
      mask.style.strokeDashoffset = '0'
      if (detalj) {
        detalj.style.transform = 'none'
        detalj.style.opacity = typ === 'talt' && !statiskt ? '0' : '1'
      }
      if (flamma) {
        flamma.style.transform = 'none'
        flamma.style.opacity = statiskt ? '1' : '0.3'
      }
      if (glod) glod.style.opacity = statiskt ? '0.5' : '0.15'
    }

    const langd = mask.getTotalLength()
    mask.style.strokeDasharray = `${langd} ${langd}`
    const statiskt = minskad || typeof IntersectionObserver === 'undefined' || typeof mask.animate !== 'function'
    if (statiskt || ko.harSpelat(id)) {
      stilla(statiskt)
      if (statiskt) ko.markeraSpelad(id)
      return
    }

    mask.style.strokeDashoffset = String(langd)
    mask.style.visibility = 'visible'
    if (detalj) detalj.style.opacity = '0'
    let synlig = false
    let avbryt: (() => void) | null = null
    // Falskt när effekten har städats, till exempel när minskad rörelse slås på mitt i en scen.
    // Då har nästa körning redan satt rätt läge och den avbrutna scenen får inte skriva över det.
    let aktuell = true

    function startaOmSynlig() {
      if (!synlig || document.hidden || avbryt || ko.harSpelat(id)) return
      avbryt = ko.laggTill(async (signal) => {
        if (signal.aborted || ko.harSpelat(id) || !mask) return
        ko.markeraSpelad(id)
        const scen = new AbortController()
        const avbrytScen = () => scen.abort()
        signal.addEventListener('abort', avbrytScen, { once: true })
        try {
          await animera(mask, [{ strokeDashoffset: String(langd) }, { strokeDashoffset: '0' }], { duration: 1400, easing: 'cubic-bezier(.2,.6,.3,1)' }, scen.signal)
          mask.style.strokeDashoffset = '0'

          if (typ === 'talt' && detalj) {
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

          if (typ === 'eld' && detalj && flamma) {
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

    const observer = new IntersectionObserver(
      (poster) => {
        synlig = poster.some((p) => p.isIntersecting && p.intersectionRatio >= 0.2)
        if (synlig) startaOmSynlig()
        else pausa()
      },
      { threshold: [0, 0.2], rootMargin: '0px 0px -24px 0px' },
    )
    observer.observe(trigger)
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
  }, [d, id, ko, minskad, typ, detaljX, detaljY])

  return (
    <div ref={lagerRef} aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div ref={triggerRef} className="absolute inset-x-0 bottom-0 h-20" />
      {matt && stig && (
        // Samma mått som viewBox, så att leden och strecken aldrig dras ut.
        <svg
          width={matt.bredd}
          height={matt.hojd}
          viewBox={`0 0 ${matt.bredd} ${matt.hojd}`}
          focusable="false"
          className="absolute top-0 left-0 block max-w-none"
        >
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={matt.bredd} height={matt.hojd} style={{ maskType: 'alpha' }}>
              {/* Masken avtäcker den streckade linjen. Själva strecken flyttas inte. */}
              <path ref={maskRef} d={stig.d} fill="none" stroke="white" strokeWidth={5} strokeLinecap="round" style={{ visibility: 'hidden' }} />
            </mask>
          </defs>
          <path
            d={stig.d}
            fill="none"
            strokeWidth={2}
            strokeDasharray="7 9"
            strokeLinecap="round"
            className="stroke-foreground/30"
            mask={`url(#${maskId})`}
          />
          {bit.forsta && <Ledkryss x={stig.start.x} y={stig.start.y} />}
          {bit.sista && <Vagvisare x={stig.slut.x} y={stig.slut.y} />}
          {typ && <Naturdetalj typ={typ} punkt={stig.detaljPunkt} detaljRef={detaljRef} flammaRef={flammaRef} glodRef={glodRef} />}
        </svg>
      )}
    </div>
  )
}
