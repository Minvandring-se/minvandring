import { useEffect, useRef, useState } from 'react'
import { SIDOR } from '@/components/start/landskap/bilder'
import { placeraSidor, type Placering, type Ruta } from '@/components/start/landskap/placering'

/**
 * Små landskap i ytterkanterna bredvid mellanrummen mellan korten: skog, sjö, höstbjörkar och fjäll.
 * Bara på breda skärmar, där kanterna har plats. Läggs först i behållaren med panelerna, som behöver
 * relative och isolate. Mellanrummen hittas med data-glipa. Dekorativt och stilla.
 */
export function Sidoremsor() {
  const lagerRef = useRef<HTMLDivElement>(null)
  const [motiv, setMotiv] = useState<Placering[]>([])

  useEffect(() => {
    const lager = lagerRef.current
    const rot = lager?.parentElement
    if (!lager || !rot || typeof ResizeObserver === 'undefined') return
    let ram = 0
    const mat = () => {
      const r = rot.getBoundingClientRect()
      const barn = Array.from(rot.children).filter((b): b is HTMLElement => b !== lager && b instanceof HTMLElement)
      const rutor = (lista: HTMLElement[]): Ruta[] =>
        lista.map((b) => {
          const x = b.getBoundingClientRect()
          return { vanster: x.left - r.left, hoger: x.right - r.left, topp: x.top - r.top, botten: x.bottom - r.top }
        })
      const paneler = rutor(barn.filter((b) => b.dataset.glipa === undefined && b.dataset.luft === undefined))
      const glipor = rutor(barn.filter((b) => b.dataset.glipa !== undefined))
      if (!paneler.length) return setMotiv([])
      setMotiv(
        placeraSidor(
          { bredd: r.width, panelVanster: Math.min(...paneler.map((p) => p.vanster)), panelHoger: Math.max(...paneler.map((p) => p.hoger)), glipor },
          SIDOR,
        ),
      )
    }
    const schemalagg = () => {
      cancelAnimationFrame(ram)
      ram = requestAnimationFrame(mat)
    }
    const observer = new ResizeObserver(schemalagg)
    observer.observe(rot)
    for (const b of Array.from(rot.children)) if (b !== lager) observer.observe(b)
    schemalagg()
    return () => {
      cancelAnimationFrame(ram)
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={lagerRef} aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {motiv.map((m) => (
        <img
          key={m.bild.src}
          src={m.bild.src}
          alt=""
          width={Math.round(m.bredd)}
          height={Math.round(m.hojd)}
          loading="lazy"
          decoding="async"
          className="absolute max-w-none"
          style={{
            left: m.x,
            top: m.y,
            width: m.bredd,
            height: m.hojd,
            // Motiven är avskurna mot panelen. Där tonar de ut, så att kanten inte syns i mellanrummet.
            maskImage: `linear-gradient(to ${m.sida === 'vanster' ? 'right' : 'left'}, black 55%, transparent)`,
          }}
        />
      ))}
    </div>
  )
}
