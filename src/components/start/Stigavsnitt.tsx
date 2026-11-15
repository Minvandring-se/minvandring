import { useEffect, useRef, useState } from 'react'
import { skapaStig, type Stigbit, type Stigmal } from '@/components/start/stiggeometri'
import { Vagvisare } from '@/components/start/Vagvisare'

const nycklar: Array<keyof Stigmal> = ['bredd', 'hojd', 'innehallVanster', 'innehallHoger', 'innehallTopp', 'innehallBotten']

/**
 * En streckad stig genom startsidans sektioner, som en led genom sidan. Dekorativ.
 * Läggs först i en sektion med relative, isolate och 80 px padding uppe och nere. Sektionens innehåll
 * ligger i en behållare med data-stiginnehall och samma bredd i alla sektioner. Stigen mäter behållaren
 * och går 48 px utanför den, så den hamnar aldrig bakom text eller kort. Syns först från 1360 px
 * fönsterbredd, och bara om marginalen bredvid innehållet räcker.
 */
export function Stigavsnitt({ bit }: { bit: Stigbit }) {
  const lagerRef = useRef<HTMLDivElement>(null)
  const [mal, setMal] = useState<Stigmal | null>(null)

  useEffect(() => {
    const lager = lagerRef.current
    const sektion = lager?.parentElement
    const innehall = sektion?.querySelector<HTMLElement>('[data-stiginnehall]')
    if (!lager || !sektion || !innehall) return

    let ram = 0
    const mat = () => {
      const yta = lager.getBoundingClientRect()
      const ruta = innehall.getBoundingClientRect()
      const nytt: Stigmal = {
        bredd: yta.width,
        hojd: yta.height,
        innehallVanster: ruta.left - yta.left,
        innehallHoger: ruta.right - yta.left,
        innehallTopp: ruta.top - yta.top,
        innehallBotten: ruta.bottom - yta.top,
      }
      setMal((forra) => (forra && nycklar.every((n) => forra[n] === nytt[n]) ? forra : nytt))
    }
    // En mätning per bildruta även om flera element ändras samtidigt, till exempel när en fråga öppnas.
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

  const stig = mal && skapaStig(mal, bit)

  return (
    <div ref={lagerRef} aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden min-[1360px]:block">
      {mal && stig && (
        // Samma mått som viewBox, så att stigen och strecken aldrig dras ut.
        <svg
          width={mal.bredd}
          height={mal.hojd}
          viewBox={`0 0 ${mal.bredd} ${mal.hojd}`}
          focusable="false"
          className="absolute top-0 left-0 block max-w-none"
        >
          <path
            d={stig.d}
            fill="none"
            strokeWidth={2}
            strokeDasharray="7 9"
            strokeLinecap="round"
            className="stroke-foreground/30"
          />
          {bit.forsta && <Vagvisare x={stig.startX} y={8} />}
          {bit.sista && <Vagvisare x={stig.slutX} y={mal.hojd - 68} />}
        </svg>
      )}
    </div>
  )
}
