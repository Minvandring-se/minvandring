import { useEffect, useRef, useState, type CSSProperties } from 'react'

type Del = 'start' | 'packning' | 'tanken' | 'fragor'

/**
 * Var stigen går i varje sektion, i procent av sektionens bredd och höjd (x y-par).
 * Varje del börjar där förra slutade, så stigen hänger ihop över sektionerna.
 * Stigen går i marginalerna och korsar sidan i luften längst ner i varje sektion.
 */
const stigar: Record<Del, string> = {
  start: 'M 4 7 C 2.8 30 5.6 58 4 84 C 3.2 93 20 95 50 95.5 S 92.5 96.5 93 100',
  packning: 'M 93 0 C 96 25 93.5 55 95.5 80 C 96.8 92 80 95 50 95.5 S 6.5 96.5 6 100',
  tanken: 'M 6 0 C 3 28 5.5 60 4 82 C 3 93 20 95.5 50 95.5 S 93.5 96.5 94 100',
  fragor: 'M 94 0 C 96.5 18 94 38 89 60',
}

/** Vägvisare i början och slutet av stigen, i procent. */
const skyltar: Partial<Record<Del, { x: number; y: number }>> = {
  start: { x: 4, y: 7 },
  fragor: { x: 89, y: 60 },
}

/** Gör om procent till pixlar. Alla kommandon i stigarna består av x y-par. */
function tillPixlar(d: string, bredd: number, hojd: number) {
  let i = 0
  return d.replace(/-?\d+(\.\d+)?/g, (tal) => ((Number(tal) * (i++ % 2 === 0 ? bredd : hojd)) / 100).toFixed(1))
}

function useStorlek() {
  const ref = useRef<HTMLDivElement>(null)
  const [storlek, setStorlek] = useState({ bredd: 0, hojd: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([post]) => {
      setStorlek({ bredd: post.contentRect.width, hojd: post.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, storlek] as const
}

/**
 * En streckad stig bakom startsidans sektioner, som en led genom sidan. Dekorativ.
 * Läggs först i en sektion med klasserna relative och isolate. Syns först från 1360 px.
 * Vid 1280 px är marginalerna för smala och stigen hamnar bakom korten. I mobilen är bakgrunden ren.
 */
export function Stigavsnitt({ del }: { del: Del }) {
  const [ref, { bredd, hojd }] = useStorlek()
  const skylt = skyltar[del]

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden min-[1360px]:block">
      {bredd > 0 && (
        <svg width={bredd} height={hojd} className="absolute inset-0 overflow-visible" focusable="false">
          <path
            d={tillPixlar(stigar[del], bredd, hojd)}
            fill="none"
            className="stroke-foreground/30"
            strokeWidth="2"
            strokeDasharray="7 9"
            strokeLinecap="round"
          />
        </svg>
      )}
      {skylt && (
        <Vagvisare className="absolute h-15 w-12 -translate-x-1/2 -translate-y-full" style={{ left: `${skylt.x}%`, top: `${skylt.y}%` }} />
      )}
    </div>
  )
}

/** Liten vägvisare med två skyltar och grästuvor. Nederkanten står på stigen. */
function Vagvisare({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 48 60" className={className} style={style} focusable="false">
      <ellipse cx="24" cy="58" rx="13" ry="2" className="fill-foreground/10" />
      <g className="fill-none stroke-illustration" strokeWidth="2" strokeLinecap="round">
        <path d="M11 58 L9 52 M14 58 V50 M17 58 L19 53" />
        <path d="M31 58 L29 53 M34 58 V51 M37 58 L39 53" />
      </g>
      <g className="stroke-foreground" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        <path d="M24 8 V58" className="fill-none" strokeWidth="2.5" />
        <path d="M9 9 H35 L40 14 L35 19 H9 Z" className="fill-accent" />
        <path d="M39 24 H14 L9 29 L14 34 H39 Z" className="fill-accent" />
      </g>
    </svg>
  )
}
