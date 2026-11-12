import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Startar illustrationens animation (klasserna mv-* i index.css) första gången den syns i bild.
 * Animationen spelas en gång och stannar i slutläget. Med "minska rörelse" syns slutbilden direkt.
 */
export function Levande({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  // Utan IntersectionObserver spelar den direkt, annars skulle bilden stå tom.
  const [startad, setStartad] = useState(() => !('IntersectionObserver' in window))

  useEffect(() => {
    const el = ref.current
    if (!el || startad) return
    const observer = new IntersectionObserver(
      ([post]) => {
        if (!post.isIntersecting) return
        setStartad(true)
        observer.disconnect()
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [startad])

  return (
    <div ref={ref} className="mv-anim" data-spelar={startad || undefined}>
      {children}
    </div>
  )
}
