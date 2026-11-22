import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * En modal dialog mitt på skärmen, byggd på <dialog> och showModal(): rätt roll, fokus stannar i dialogen,
 * Esc och tryck utanför stänger, och fokus går tillbaka dit det var när dialogen öppnades.
 * Dialogen visas när den renderas och stängs genom att onStang anropas, så föräldern bestämmer om den finns.
 */
export function Dialog({ etikett, onStang, children, className }: { etikett: string; onStang: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  // Det som hade fokus när dialogen öppnades, så att fokus kan gå tillbaka dit. Sparas vid första renderingen,
  // innan fokus har flyttats in i dialogen.
  const [tidigare] = useState(() => (document.activeElement instanceof HTMLElement ? document.activeElement : null))
  const tidigareFokus = useRef(tidigare)
  const borjadeUtanfor = useRef(false)
  const senaste = useRef(onStang)
  // Falskt när dialogen tas bort. Då ska stängningen i städningen inte anropa onStang igen.
  const monterad = useRef(false)
  useEffect(() => {
    senaste.current = onStang
  })
  const stang = useRef(() => {
    if (monterad.current) senaste.current()
  })

  useEffect(() => {
    const d = ref.current
    if (!d) return
    monterad.current = true
    const forut = tidigareFokus.current
    if (!d.open) d.showModal()
    // Fältet som ska ha fokus när dialogen öppnas. Annars väljer webbläsaren det första som går att fokusera.
    d.querySelector<HTMLElement>('[data-autofokus]')?.focus()
    document.documentElement.style.overflow = 'hidden'
    // Dialogen stängs inte här: när den tas bort ur sidan försvinner den ändå, och i StrictMode monteras den på nytt.
    return () => {
      monterad.current = false
      document.documentElement.style.overflow = ''
      // Finns det som hade fokus inte kvar (till exempel en tom ruta som nu har en sak) går fokus till innehållet.
      if (forut?.isConnected) forut.focus()
      else document.getElementById('innehall')?.focus()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-label={etikett}
      onCancel={(e) => {
        e.preventDefault()
        stang.current()
      }}
      // Webbläsaren kan stänga dialogen själv. Då ska föräldern också veta det.
      onClose={() => {
        if (!ref.current?.open) stang.current()
      }}
      onMouseDown={(e) => {
        borjadeUtanfor.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        // Ett tryck på slöjan runt innehållet. Innehållet fyller dialogen, så target är dialogen bara utanför.
        // Trycket ska också ha börjat utanför, så att en markering i sökfältet som släpps utanför inte stänger.
        if (e.target === e.currentTarget && borjadeUtanfor.current) stang.current()
      }}
      className={cn(
        'm-auto max-h-[calc(100dvh-2rem)] w-[min(100%-2rem,52rem)] max-w-none overflow-y-auto overscroll-contain rounded-lg border-0 bg-transparent p-0 text-foreground backdrop:bg-sloja',
        className,
      )}
    >
      {children}
    </dialog>
  )
}
