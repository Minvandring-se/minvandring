import { useEffect, useRef, useState } from 'react'
import { planeraResa, type Figur, type Placerad, type Ruta, type Underlag } from '@/components/start/resa/resa'

/**
 * Figurerna ritas i en ruta på 100 × 100 med marken på y = 100 och skalas till sin storlek.
 * Linjerna behåller sin tjocklek när rutan skalas.
 */
const ritningar: Record<Figur, { d: string; klass: string }[]> = {
  gran: [
    { d: 'M50 92 V100', klass: 'fill-none stroke-foreground/20' },
    { d: 'M50 0 L29 45 H40 L17 92 H83 L60 45 H71 Z', klass: 'fill-illustration/20 stroke-foreground/15' },
  ],
  bjork: [
    { d: 'M50 100 C49 84 51 66 50 50', klass: 'fill-none stroke-foreground/30' },
    { d: 'M48 90 H51 M49 78 H52 M48 66 H51', klass: 'fill-none stroke-foreground/35' },
    { d: 'M50 2 C64 4 74 20 72 36 C75 52 64 66 50 66 C36 66 25 52 28 36 C26 20 36 4 50 2 Z', klass: 'fill-illustration/15 stroke-foreground/10' },
  ],
  fjallbjork: [
    { d: 'M50 100 C45 88 56 78 50 64 M51 78 C58 74 62 68 66 60', klass: 'fill-none stroke-foreground/30' },
    { d: 'M44 24 C58 16 72 26 70 40 C74 54 60 64 48 62 C34 66 22 54 26 42 C22 30 32 26 44 24 Z', klass: 'fill-accent/30 stroke-foreground/10' },
    { d: 'M66 46 C76 44 84 52 80 60 C76 66 66 64 64 58 Z', klass: 'fill-accent-strong/20 stroke-foreground/10' },
  ],
  ljung: [{ d: 'M3 100 C12 64 24 64 30 100 C38 54 54 56 58 100 C66 66 82 64 97 100 Z', klass: 'fill-trail-marker/20 stroke-none' }],
  sten: [{ d: 'M6 100 C4 68 30 48 52 52 C76 54 97 74 94 100 Z', klass: 'fill-muted stroke-foreground/15' }],
  stenrose: [
    { d: 'M4 100 C4 82 26 75 50 77 C74 75 96 82 96 100 Z', klass: 'fill-muted stroke-foreground/20' },
    { d: 'M18 77 C16 60 34 52 52 54 C70 54 84 62 82 77 Z', klass: 'fill-muted stroke-foreground/20' },
    { d: 'M33 55 C32 38 46 31 55 33 C66 35 69 46 67 55 Z', klass: 'fill-muted stroke-foreground/20' },
  ],
  kulle: [{ d: 'M0 100 C18 44 42 22 60 30 C76 38 88 70 100 100 Z', klass: 'fill-primary-soft/60 stroke-foreground/10' }],
  fjall: [
    { d: 'M0 100 L28 26 L40 42 L58 0 L80 48 L100 100 Z', klass: 'fill-primary-soft/60 stroke-foreground/15' },
    { d: 'M40 42 L46 100', klass: 'fill-none stroke-foreground/10' },
  ],
  sjo: [
    { d: 'M2 70 C6 40 30 30 56 32 C82 34 98 52 96 72 C92 96 16 100 2 70 Z', klass: 'fill-sjo/70 stroke-foreground/15' },
    { d: 'M22 60 q4 -4 8 0 q4 4 8 0 M54 76 q4 -4 8 0', klass: 'fill-none stroke-foreground/20' },
    { d: 'M88 60 L86 30 M92 62 L93 38 M84 62 L80 42', klass: 'fill-none stroke-foreground/25' },
  ],
  mark: [{ d: 'M0 100 C14 30 86 30 100 100 Z', klass: 'fill-primary-soft/50 stroke-none' }],
}

/** Snöfältet på fjällets högsta topp, i samma ruta som fjället. */
const SNO = 'M48 22 L58 0 L68 24 L62 20 L58 28 L53 19 Z'

function Figurbild({ f }: { f: Placerad }) {
  // Varannan figur speglas, så att samma form inte upprepas.
  const spegel = f.variant < 0.5 && f.typ !== 'sjo'
  const sx = (spegel ? -1 : 1) * (f.bredd / 100)
  const sy = f.hojd / 100
  const tx = spegel ? f.x + f.bredd / 2 : f.x - f.bredd / 2
  return (
    <g transform={`translate(${tx} ${f.y - f.hojd}) scale(${sx} ${sy})`}>
      {ritningar[f.typ].map((r, i) => (
        <path key={i} d={r.d} className={r.klass} vectorEffect="non-scaling-stroke" />
      ))}
      {f.typ === 'fjall' && f.sno && <path d={SNO} className="fill-card stroke-foreground/10" vectorEffect="non-scaling-stroke" />}
    </g>
  )
}

const relativt = (r: DOMRect, rot: DOMRect): Ruta => ({ vanster: r.left - rot.left, hoger: r.right - rot.left, topp: r.top - rot.top, botten: r.bottom - rot.top })

/** Läser av panelerna och luften mellan dem i föräldern. Luften är märkt med data-glipa eller data-luft. */
function matUnderlag(rot: HTMLElement, lager: HTMLElement): Underlag {
  const r = rot.getBoundingClientRect()
  const hinder: Ruta[] = []
  const luft: Ruta[] = []
  for (const barn of Array.from(rot.children) as HTMLElement[]) {
    if (barn === lager) continue
    const ruta = relativt(barn.getBoundingClientRect(), r)
    if (barn.dataset.glipa !== undefined) luft.push(ruta)
    else if (barn.dataset.luft === undefined) hinder.push(ruta)
  }
  // Luften mellan sektionerna har panelernas bredd, så att figurerna hamnar längst ut vid panelernas kanter.
  const vanster = Math.min(...hinder.map((h) => h.vanster))
  const hoger = Math.max(...hinder.map((h) => h.hoger))
  const glipor = hinder.length ? luft.map((g) => ({ ...g, vanster, hoger })) : []
  return { bredd: r.width, hojd: r.height, hinder, glipor }
}

/**
 * Landskapet bakom startsidans paneler: granskog som tunnas ut, en sjö, fjällbjörkar i höstfärger,
 * kalfjäll och till sist fjäll med snö. Läggs först i behållaren med panelerna, som behöver
 * relative och isolate. Dekorativt och stilla.
 */
export function Landskapsresa() {
  const lagerRef = useRef<HTMLDivElement>(null)
  const [figurer, setFigurer] = useState<{ bredd: number; hojd: number; lista: Placerad[] } | null>(null)

  useEffect(() => {
    const lager = lagerRef.current
    const rot = lager?.parentElement
    if (!lager || !rot || typeof ResizeObserver === 'undefined') return
    let ram = 0
    let forra = ''
    const mat = () => {
      const u = matUnderlag(rot, lager)
      // Rita bara om när måtten ändrats på riktigt.
      const nyckel = JSON.stringify([Math.round(u.bredd), Math.round(u.hojd), u.hinder.map((h) => Math.round(h.topp)), u.glipor.map((g) => Math.round(g.topp))])
      if (nyckel === forra) return
      forra = nyckel
      setFigurer({ bredd: u.bredd, hojd: u.hojd, lista: planeraResa(u) })
    }
    const schemalagg = () => {
      cancelAnimationFrame(ram)
      ram = requestAnimationFrame(mat)
    }
    const observer = new ResizeObserver(schemalagg)
    observer.observe(rot)
    for (const barn of Array.from(rot.children)) if (barn !== lager) observer.observe(barn)
    schemalagg()
    return () => {
      cancelAnimationFrame(ram)
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={lagerRef} aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {figurer && (
        <svg width={figurer.bredd} height={figurer.hojd} viewBox={`0 0 ${figurer.bredd} ${figurer.hojd}`} focusable="false" className="block" strokeWidth={1} strokeLinejoin="round" strokeLinecap="round">
          {figurer.lista.map((f, i) => (
            <Figurbild key={i} f={f} />
          ))}
        </svg>
      )}
    </div>
  )
}
