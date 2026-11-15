import { useEffect, useId, useRef, useState } from 'react'
import { animera, vanta } from '@/components/start/stig/animationsko'
import { valjStig, type Matt, type Stigbit } from '@/components/start/stig/geometri'
import { Naturdetalj } from '@/components/start/stig/Naturdetalj'
import { useStigKo } from '@/components/start/stig/stigKo'
import { utritning, VANTAN } from '@/components/start/stig/utritning'
import { Ledkryss, Vagvisare } from '@/components/start/stig/Vagvisare'

interface Props {
  /** Unikt och stabilt inom startsidan. Används för att minnas vad som redan ritats. */
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

/**
 * En bit av leden i luften mellan sektionen och nästa. Dekorativ.
 * Läggs först i en sektion med relative och isolate. Innehållet ligger i en behållare med
 * data-stiginnehall och samma bredd i alla sektioner. Från 1360 px, när marginalen räcker, visas den
 * fulla varianten som svänger ner mot nästa sektion. Annars en enkel kurva i den nedre luften.
 *
 * När mellanrummet nått en tredjedel upp på skärmen ritas biten fram, en gång per sidbesök, efter
 * en kort väntan och i tur och ordning med de andra bitarna. Scrollar man förbi innan dess visas den
 * färdig. Tältet och brasan spelas när leden nått fram. Vid minskad rörelse visas allt stilla.
 */
export function Stigavsnitt({ id, bit }: Props) {
  const ko = useStigKo()
  const minskad = useMedia('(prefers-reduced-motion: reduce)')
  const bred = useMedia('(min-width: 1360px)')
  const lagerRef = useRef<HTMLDivElement>(null)
  const nereRef = useRef<HTMLDivElement>(null)
  const maskNereRef = useRef<SVGPathElement>(null)
  const maskUppeRef = useRef<SVGPathElement>(null)
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

  const stig = matt && valjStig(matt, bit, bred)
  const dNere = stig?.dBotten
  const dUppe = stig?.dTopp
  const { forraId, nastaId } = bit
  const typ = bit.detalj
  const detaljX = stig?.figurer.detalj?.x
  const detaljY = stig?.figurer.detalj?.y

  // Fortsättningen i den övre luften hör till biten ovanför. Den syns när den biten har ritats
  // och ritas fram av den bitens scen, i samma rörelse som biten.
  useEffect(() => {
    const mask = maskUppeRef.current
    if (!dUppe || !mask) return
    const visa = () => {
      mask.style.strokeDashoffset = '0'
    }
    if (minskad || (forraId && ko.harSpelat(forraId))) visa()
    else mask.style.strokeDashoffset = '1'
    return ko.registreraTopp(id, {
      langd: mask.getTotalLength(),
      async rita(ramar, varaktighet, signal) {
        await animera(mask, ramar, { duration: varaktighet }, signal)
        visa()
      },
      stilla: visa,
    })
  }, [dUppe, forraId, id, ko, minskad])

  // Rita fram biten en gång när mellanrummet nått en tredjedel upp, och spela sedan tältet eller brasan.
  useEffect(() => {
    const nere = nereRef.current
    const mask = maskNereRef.current
    const detalj = detaljRef.current
    const flamma = flammaRef.current
    const glod = glodRef.current
    if (!dNere || !nere || !mask) return

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
      ko.topp(nastaId)?.stilla()
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
    const forbi = () => nere.getBoundingClientRect().bottom <= 0

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
          const topp = ko.topp(nastaId)
          const { nere: delNere, uppe: delUppe } = utritning(mask.getTotalLength(), topp?.langd)
          await animera(mask, delNere.ramar, { duration: delNere.varaktighet }, scen.signal)
          mask.style.strokeDashoffset = '0'
          if (topp && delUppe) await topp.rita(delUppe.ramar, delUppe.varaktighet, scen.signal)

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
          // under väntan och mellanrummet ligger kvar nedanför skärmen förblir den oritad.
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

    // Startar när mellanrummet nått en tredjedel upp på skärmen.
    const start = new IntersectionObserver(
      (poster) => {
        iLage = poster.some((p) => p.isIntersecting)
        if (iLage) starta()
      },
      { rootMargin: '0px 0px -33% 0px' },
    )
    // Lämnar mellanrummet skärmen helt avbryts biten. Har den ritats färdigställs den direkt.
    const utanfor = new IntersectionObserver((poster) => {
      if (!poster.some((p) => p.isIntersecting)) pausa()
    })
    // Området ovanför skärmen. Hamnar mellanrummet där har man scrollat förbi, även med ett hopp
    // som aldrig visade det, och då visas biten färdig.
    const ovanfor = new IntersectionObserver(
      (poster) => {
        if (!poster.some((p) => p.isIntersecting && p.intersectionRatio >= 1)) return
        pausa()
        if (!ko.harSpelat(id)) fardig()
      },
      // root: document, så att marginalen gäller sidans eget fönster, även i en ram.
      { root: document, rootMargin: '100000px 0px -100% 0px', threshold: 1 },
    )
    start.observe(nere)
    utanfor.observe(nere)
    ovanfor.observe(nere)
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
  }, [dNere, id, ko, minskad, nastaId, typ, detaljX, detaljY])

  return (
    <div ref={lagerRef} aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {matt && stig && (
        <>
          <div ref={nereRef} className="absolute inset-x-0 bottom-0" style={{ height: matt.hojd - matt.botten }} />
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
