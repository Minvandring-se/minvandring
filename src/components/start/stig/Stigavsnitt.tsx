import { useEffect, useId, useRef, useState } from 'react'
import { animera, vanta } from '@/components/start/stig/animationsko'
import { beraknaStig, type Matt, type Stigbit } from '@/components/start/stig/geometri'
import { Naturdetalj } from '@/components/start/stig/Naturdetalj'
import { useStigKo } from '@/components/start/stig/stigKo'
import { Ledkryss, Vagvisare } from '@/components/start/stig/Vagvisare'

/** Paus innan en bit börjar ritas, i ms. */
const VANTAN = 200
/** Hur länge utritningen tar, i ms. */
const RITTID = 1600

/**
 * Höjden på luften mellan panelerna. Rymmer vägvisaren (60 px) med 24 px fritt över och under,
 * på den del av leden som går tvärs över.
 */
const MELLANRUM = 'h-36 lg:h-40'

interface Props {
  /** Unikt och stabilt inom startsidan. Ger bitens form och används för att minnas vad som ritats. */
  id: string
  bit: Stigbit
}

const nycklar: Array<keyof Matt> = ['bredd', 'hojd', 'vanster', 'hoger']

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

/** Luft utan led, till exempel mellan hero och första panelen. */
export function Mellanrum() {
  return <div aria-hidden className="h-12 lg:h-16" />
}

/**
 * Luften mellan två paneler, med en bit av leden. Dekorativ. Läggs mellan panelerna, inuti samma
 * behållare med sidmarginal, så att den inre ytan med max-w-6xl får samma bredd som panelerna.
 *
 * När mellanrummet har kommit in ungefär 20 % nerifrån ritas biten fram, en gång per sidbesök, efter
 * en kort paus och i tur och ordning med de andra. Scrollar man förbi innan dess visas den färdig.
 * Tältet och brasan spelas när leden nått fram. Vid minskad rörelse visas allt stilla.
 */
export function Stigavsnitt({ id, bit }: Props) {
  const ko = useStigKo()
  const minskad = useMinskadRorelse()
  const rotRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const maskRef = useRef<SVGPathElement>(null)
  const detaljRef = useRef<SVGGElement>(null)
  const flammaRef = useRef<SVGPathElement>(null)
  const glodRef = useRef<SVGEllipseElement>(null)
  const [matt, setMatt] = useState<Matt | null>(null)
  const maskId = `stigmask-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  // Mät mellanrummet och var panelerna börjar och slutar i det.
  useEffect(() => {
    const rot = rotRef.current
    const panel = panelRef.current
    if (!rot || !panel || typeof ResizeObserver === 'undefined') return

    let ram = 0
    const mat = () => {
      const a = rot.getBoundingClientRect()
      const b = panel.getBoundingClientRect()
      const nytt: Matt = { bredd: a.width, hojd: a.height, vanster: b.left - a.left, hoger: b.right - a.left }
      setMatt((forra) => (forra && nycklar.every((n) => forra[n] === nytt[n]) ? forra : nytt))
    }
    const schemalagg = () => {
      cancelAnimationFrame(ram)
      ram = requestAnimationFrame(mat)
    }
    const observer = new ResizeObserver(schemalagg)
    observer.observe(rot)
    observer.observe(panel)
    schemalagg()

    return () => {
      cancelAnimationFrame(ram)
      observer.disconnect()
    }
  }, [])

  const stig = matt && beraknaStig(matt, bit, id)
  const d = stig?.d
  const typ = bit.detalj
  const detaljX = stig?.figurer.detalj?.x
  const detaljY = stig?.figurer.detalj?.y

  // Rita fram biten en gång och spela sedan tältet eller brasan.
  useEffect(() => {
    const rot = rotRef.current
    const mask = maskRef.current
    const detalj = detaljRef.current
    const flamma = flammaRef.current
    const glod = glodRef.current
    if (!d || !rot || !mask) return

    /** Sluttillståndet. Statiskt (minskad rörelse) visar tältet och full eld. */
    function stilla(statiskt = false) {
      if (!mask) return
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

    const statiskt = minskad || typeof IntersectionObserver === 'undefined' || typeof mask.animate !== 'function'
    if (statiskt || ko.harSpelat(id)) {
      stilla(statiskt)
      if (statiskt) ko.markeraSpelad(id)
      return
    }

    mask.style.strokeDashoffset = '1'
    if (detalj) detalj.style.opacity = '0'
    let avbryt: (() => void) | null = null
    let iLage = false
    // Falskt när effekten har städats, till exempel när minskad rörelse slås på mitt i en scen.
    // Då har nästa körning redan satt rätt läge och den avbrutna scenen får inte skriva över det.
    let aktuell = true
    /** Mellanrummet har passerat ovanför skärmen. */
    const forbi = () => rot.getBoundingClientRect().bottom <= 0

    /** Visar biten färdig. Används när man scrollat förbi, så att den aldrig hoppar fram synligt. */
    function fardig() {
      ko.markeraSpelad(id)
      stilla()
    }

    function starta() {
      if (document.hidden || avbryt || ko.harSpelat(id)) return
      avbryt = ko.laggTill(async (signal) => {
        if (signal.aborted || ko.harSpelat(id) || !mask) return
        const scen = new AbortController()
        const avbrytScen = () => scen.abort()
        signal.addEventListener('abort', avbrytScen, { once: true })
        let ritar = false
        try {
          await vanta(VANTAN, scen.signal)
          ko.markeraSpelad(id)
          ritar = true
          await animera(mask, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: RITTID, easing: 'ease-in-out' }, scen.signal)
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
          // Sätt sluttillståndet innan animationerna med fill forwards tas bort. Avbröts den redan
          // under pausen och mellanrummet ligger kvar nedanför skärmen förblir den oritad.
          if (aktuell && (ritar || forbi())) fardig()
          scen.abort()
          signal.removeEventListener('abort', avbrytScen)
        }
      })
    }

    function pausa() {
      avbryt?.()
      avbryt = null
    }

    // Startar när mellanrummet har kommit in ungefär 20 % nerifrån på skärmen.
    const start = new IntersectionObserver(
      (poster) => {
        iLage = poster.some((p) => p.isIntersecting)
        if (iLage) starta()
      },
      { rootMargin: '0px 0px -20% 0px' },
    )
    // Lämnar mellanrummet skärmen helt avbryts biten. Har den börjat ritas färdigställs den direkt.
    const utanfor = new IntersectionObserver((poster) => {
      if (!poster.some((p) => p.isIntersecting)) pausa()
    })
    // Området ovanför skärmen. Hamnar mellanrummet där har man scrollat förbi, även med ett hopp
    // som aldrig visade det, och då visas biten färdig. root: document, så att marginalen gäller
    // sidans eget fönster, även i en ram.
    const ovanfor = new IntersectionObserver(
      (poster) => {
        if (!poster.some((p) => p.isIntersecting && p.intersectionRatio >= 1)) return
        pausa()
        if (!ko.harSpelat(id)) fardig()
      },
      { root: document, rootMargin: '100000px 0px -100% 0px', threshold: 1 },
    )
    start.observe(rot)
    utanfor.observe(rot)
    ovanfor.observe(rot)
    const synlighet = () => {
      if (document.hidden) pausa()
      else if (iLage) starta()
    }
    document.addEventListener('visibilitychange', synlighet)

    return () => {
      aktuell = false
      start.disconnect()
      utanfor.disconnect()
      ovanfor.disconnect()
      document.removeEventListener('visibilitychange', synlighet)
      pausa()
    }
  }, [d, id, ko, minskad, typ, detaljX, detaljY])

  return (
    <div ref={rotRef} aria-hidden className={`pointer-events-none relative ${MELLANRUM}`}>
      {/* Samma bredd som panelerna, för att mäta var de börjar och slutar. */}
      <div ref={panelRef} className="mx-auto h-full max-w-6xl" />
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
              {/* Masken avtäcker den streckade linjen. Med pathLength 1 betyder 0–1 hur stor del som syns. */}
              <path
                ref={maskRef}
                d={stig.d}
                pathLength={1}
                strokeDasharray="1 1"
                fill="none"
                stroke="white"
                strokeWidth={5}
                style={{ strokeDashoffset: minskad ? 0 : 1 }}
              />
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
          {stig.figurer.ledkryss && <Ledkryss x={stig.figurer.ledkryss.x} y={stig.figurer.ledkryss.y} />}
          {stig.figurer.vagvisare && <Vagvisare x={stig.figurer.vagvisare.x} y={stig.figurer.vagvisare.y} />}
          {typ && stig.figurer.detalj && (
            <Naturdetalj typ={typ} punkt={stig.figurer.detalj} detaljRef={detaljRef} flammaRef={flammaRef} glodRef={glodRef} />
          )}
        </svg>
      )}
    </div>
  )
}
