import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Spelar illustrationens animation (klasserna mv-* i index.css) bara medan den syns i bild.
 * Med "minska rörelse" finns ingen animation och slutbilden syns.
 */
export function Levande({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  // Utan IntersectionObserver spelar den alltid, annars skulle bilden stå tom.
  const [syns, setSyns] = useState(() => !('IntersectionObserver' in window))

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([post]) => setSyns(post.isIntersecting), { threshold: 0.4 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="mv-anim" data-spelar={syns || undefined}>
      {children}
    </div>
  )
}
