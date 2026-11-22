import { Backpack, Map as Karta, UserRound, type LucideIcon } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import type { AppKontext } from '@/components/app/appKontext'
import { DinaTurer } from '@/components/app/DinaTurer'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Namnbricka } from '@/components/app/Namnbricka'
import { Felgrans } from '@/components/Felgrans'
import { Logotyp } from '@/components/Logotyp'
import { Sidfot } from '@/components/Sidfot'
import { useDinaTurer } from '@/hooks/useDinaTurer'
import { arProfilbildHamtad, useProfilbilder } from '@/hooks/useProfilbilder'
import { useSession } from '@/hooks/useSession'
import { aktivDel, type Del } from '@/lib/navigering'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

/** Delarna i menyn. Bottennavigationen i mobil har alla tre. Sidomenyn på dator har Profil som användaren längst ner. */
const DELAR: { del: Del; till: string; namn: string; ikon: LucideIcon }[] = [
  { del: 'turer', till: '/turer', namn: 'Mina turer', ikon: Karta },
  { del: 'forrad', till: '/forrad', namn: 'Mitt förråd', ikon: Backpack },
  { del: 'profil', till: '/profil', namn: 'Profil', ikon: UserRound },
]

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Ramen för de inloggade sidorna. På dator en sidomeny som ligger kvar när man scrollar: logotypen, Mina turer,
 * Mitt förråd, listan Dina turer med dagar kvar och användaren längst ner med länk till Profil.
 * I mobil ett kompakt sidhuvud, sidfoten längst ner på sidan och en bottennavigation för de tre delarna.
 */
export function AppSkal() {
  const session = useSession()
  const { pathname } = useLocation()
  const aktiv = aktivDel(pathname)
  const anvandarId = session?.user.id ?? ''
  const dinaTurer = useDinaTurer(anvandarId, pathname)
  const oppenTurId = /^\/tur\/([^/]+)/.exec(pathname)?.[1] ?? null
  const [namn, setNamn] = useState('')
  const [bildUppdaterad, setBildUppdaterad] = useState<string | null>(null)
  const [profilHamtad, setProfilHamtad] = useState(false)
  const minBild = useProfilbilder(bildUppdaterad ? [anvandarId] : [], bildUppdaterad)[anvandarId]
  // Platshållare tills vi vet om det finns en bild, och tills bilden i så fall har hämtats.
  const bildLaddar = !profilHamtad || (!!bildUppdaterad && !minBild && !arProfilbildHamtad(anvandarId))

  useEffect(() => {
    if (!supabase || !anvandarId) return
    supabase
      .from('profiler')
      .select('namn, bild_uppdaterad')
      .eq('id', anvandarId)
      .maybeSingle()
      .then(({ data }) => {
        setNamn(data?.namn?.trim() ?? '')
        setBildUppdaterad((data?.bild_uppdaterad as string | null | undefined) ?? null)
        setProfilHamtad(true)
      })
  }, [anvandarId])

  const kontext: AppKontext = { anvandarId, epost: session?.user.email ?? '', namn, profilHamtad, setNamn, bildUppdaterad, setBildUppdaterad }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Sidomenyn på dator. Ligger kvar när man scrollar. */}
      <aside className="hidden border-r border-border bg-card lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto">
        <div className="flex flex-1 flex-col gap-7 px-4 pt-6 pb-4">
          <Link to="/turer" className={cn('flex min-h-11 items-center rounded-md px-2', fokus)}>
            <Logotyp className="text-xl" />
          </Link>
          <nav aria-label="Huvudmeny">
            <ul className="space-y-1">
              {DELAR.filter((d) => d.del !== 'profil').map(({ del, till, namn: text, ikon: Ikon }) => (
                <li key={del}>
                  <Link
                    to={till}
                    aria-current={aktiv === del ? 'page' : undefined}
                    className={cn(
                      'relative flex min-h-11 items-center gap-3 rounded-md px-3 font-medium transition-colors',
                      fokus,
                      aktiv === del ? 'bg-primary-soft text-primary' : 'text-foreground hover:bg-muted',
                    )}
                  >
                    {/* Aktiv sida: grön text, fetare ikon och en kort rostfärgad markering, som en målad ledmarkering. */}
                    {aktiv === del && <span aria-hidden className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent" />}
                    <Ikon className="size-5" aria-hidden strokeWidth={aktiv === del ? 2.25 : 1.75} />
                    {text}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <DinaTurer turer={dinaTurer} oppenTurId={oppenTurId} />
        </div>

        <div className="space-y-2 border-t border-border px-4 pt-3 pb-4">
          {/* Användaren leder till Profil, där Utseende och Logga ut finns. */}
          <Link
            to="/profil"
            aria-current={aktiv === 'profil' ? 'page' : undefined}
            className={cn(
              'flex min-h-12 items-center gap-3 rounded-md px-2 transition-colors',
              fokus,
              aktiv === 'profil' ? 'bg-primary-soft text-primary' : 'hover:bg-muted',
            )}
          >
            <Namnbricka namn={namn || session?.user.email || '?'} bild={minBild} laddar={bildLaddar} />
            {profilHamtad ? (
              <span className="min-w-0 flex-1 truncate font-medium">{namn || 'Din profil'}</span>
            ) : (
              <>
                <Skelett className="h-4 w-24" />
                <span className="sr-only">Din profil</span>
              </>
            )}
          </Link>
          <Sidfot variant="meny" className="px-2 text-xs" />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        {/* Kompakt sidhuvud i mobil */}
        <header className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-2 backdrop-blur lg:hidden">
          <Link to="/turer" className={cn('flex min-h-11 items-center rounded-md', fokus)}>
            <Logotyp />
          </Link>
          <Link to="/profil" aria-label="Din profil" className={cn('flex size-11 items-center justify-center rounded-full', fokus)}>
            <Namnbricka namn={namn || session?.user.email || '?'} bild={minBild} laddar={bildLaddar} />
          </Link>
        </header>

        {!supabase && (
          <div className="m-4 rounded-md bg-accent-soft p-4 text-sm">
            Supabase är inte kopplat än. Kopiera <code>.env.example</code> till <code>.env.local</code> och fyll i nycklarna.
          </div>
        )}

        {/* Luft under innehållet i mobil, så att inget hamnar bakom bottennavigationen. */}
        {/* På dator fyller innehållet bredden bredvid sidomenyn, upp till 80rem på mycket breda skärmar. */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-8 sm:px-6 lg:px-10 lg:pt-8 lg:pb-12">
          <Felgrans aterstall={pathname}>
          <Suspense
            fallback={
              <Laddar text="Hämtar sidan">
                <Skelett className="h-9 w-48" />
                <Skelett className="h-5 w-64 max-w-full" />
              </Laddar>
            }
          >
            <Outlet context={kontext} />
          </Suspense>
          </Felgrans>
        </main>

        <Sidfot className="mx-4 mb-[calc(5rem+env(safe-area-inset-bottom))] lg:hidden" />
      </div>

      {/* Bottennavigation i mobil */}
      <nav
        aria-label="Huvudmeny"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {DELAR.map(({ del, till, namn: text, ikon: Ikon }) => (
            <li key={del}>
              <Link
                to={till}
                aria-current={aktiv === del ? 'page' : undefined}
                className={cn(
                  'flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                  aktiv === del ? 'font-semibold text-primary' : 'font-medium text-muted-foreground',
                )}
              >
                <Ikon className="size-6" aria-hidden strokeWidth={aktiv === del ? 2.25 : 1.75} />
                <span>{text}</span>
                {/* Aktiv sida: fet text, fetare ikon och ett kort rostfärgat streck under, som en målad ledmarkering. */}
                <span aria-hidden className={cn('h-[3px] w-[18px] rounded-full', aktiv === del ? 'bg-accent' : 'bg-transparent')} />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
