import { Bell } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import type { Notiser } from '@/hooks/useNotiser'
import { arAppLank, klockansNamn, notistid, olastaSiffra, type Notis } from '@/lib/notiser'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Notisklockan uppe till höger. Siffran visar olästa notiser. Klockan öppnar en lista med de senaste, och när den
 * öppnas markeras alla som lästa. De som var olästa behåller sin prick tills listan stängs.
 * Listan stängs med Escape, med ett tryck utanför och när man går till en annan sida.
 */
export function Notisklocka({ notiser, olasta, markeraLasta }: Notiser) {
  const id = useId()
  const [oppen, setOppen] = useState(false)
  const [nya, setNya] = useState<ReadonlySet<string>>(new Set())
  // Tiden när listan öppnades, för "5 min" och "i går".
  const [nu, setNu] = useState(() => new Date())
  const ram = useRef<HTMLDivElement>(null)
  const knapp = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()
  const [forraSida, setForraSida] = useState(pathname)
  if (pathname !== forraSida) {
    setForraSida(pathname)
    setOppen(false)
  }

  useEffect(() => {
    if (!oppen) return
    const utanfor = (e: PointerEvent) => {
      if (ram.current && !ram.current.contains(e.target as Node)) setOppen(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOppen(false)
      knapp.current?.focus()
    }
    document.addEventListener('pointerdown', utanfor)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', utanfor)
      document.removeEventListener('keydown', escape)
    }
  }, [oppen])

  function vaxla() {
    if (oppen) return setOppen(false)
    setNya(new Set(Array.isArray(notiser) ? notiser.filter((n) => !n.last).map((n) => n.id) : []))
    setNu(new Date())
    setOppen(true)
    if (olasta > 0) void markeraLasta()
  }

  const siffra = olastaSiffra(olasta)
  return (
    <div ref={ram} className="lg:relative">
      <button
        ref={knapp}
        type="button"
        aria-label={klockansNamn(olasta)}
        aria-expanded={oppen}
        aria-controls={`${id}-lista`}
        onClick={vaxla}
        className={cn('relative flex size-11 items-center justify-center rounded-full text-foreground hover:bg-muted', fokus)}
      >
        <Bell className="size-6" aria-hidden />
        {siffra && (
          <span
            aria-hidden
            className="absolute top-1 right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[0.6875rem] leading-none font-semibold text-background tabular-nums"
          >
            {siffra}
          </span>
        )}
      </button>

      {/* I mobil hela bredden under sidhuvudet, på dator en ruta under klockan. */}
      <section
        id={`${id}-lista`}
        hidden={!oppen}
        aria-labelledby={`${id}-rubrik`}
        className="fixed inset-x-2 top-16 z-40 max-h-[calc(100dvh-10rem)] overflow-y-auto rounded-[1.375rem] border border-border bg-card p-2 shadow-[var(--shadow-lyft)] lg:absolute lg:inset-x-auto lg:top-full lg:right-0 lg:mt-2 lg:max-h-[70dvh] lg:w-96"
      >
        <h2 id={`${id}-rubrik`} className="px-3 pt-2 pb-1 text-lg">
          Notiser
        </h2>
        {oppen && <Lista notiser={notiser} nya={nya} nu={nu} stang={() => setOppen(false)} />}
      </section>
    </div>
  )
}

function Lista({ notiser, nya, nu, stang }: { notiser: Notiser['notiser']; nya: ReadonlySet<string>; nu: Date; stang: () => void }) {
  if (notiser === null) return <p className="px-3 py-3 text-sm text-muted-foreground">Hämtar notiserna …</p>
  if (notiser === 'fel')
    return <p className="px-3 py-3 text-sm text-destructive">Det gick inte att hämta notiserna. Kontrollera uppkopplingen och försök igen.</p>
  if (notiser.length === 0)
    return (
      <p className="px-3 py-3 text-sm text-muted-foreground">Inga notiser än. Här ser du till exempel när någon går med i en av dina turer.</p>
    )
  return (
    <ul className="space-y-0.5">
      {notiser.map((n) => (
        <li key={n.id}>
          <Rad notis={n} ny={nya.has(n.id)} nu={nu} stang={stang} />
        </li>
      ))}
    </ul>
  )
}

function Rad({ notis, ny, nu, stang }: { notis: Notis; ny: boolean; nu: Date; stang: () => void }) {
  const innehall = (
    <>
      <span aria-hidden className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', ny ? 'bg-accent' : 'bg-transparent')} />
      <span className="min-w-0 flex-1">
        <span className={cn('block break-words', ny && 'font-semibold')}>
          {ny && <span className="sr-only">Ny: </span>}
          {notis.text}
        </span>
        <span className="block text-sm text-muted-foreground">{notistid(notis.skapad, nu)}</span>
      </span>
    </>
  )
  const klass = 'flex min-h-14 gap-3 rounded-lg px-3 py-2.5'
  return arAppLank(notis.lank) ? (
    <Link to={notis.lank} onClick={stang} className={cn(klass, 'hover:bg-muted', fokus)}>
      {innehall}
    </Link>
  ) : (
    <div className={klass}>{innehall}</div>
  )
}
