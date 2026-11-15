import { Backpack, LogOut, Map as Karta, Plus, UserRound, type LucideIcon } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import type { AppKontext } from '@/components/app/appKontext'
import { Namnbricka } from '@/components/app/Namnbricka'
import { Logotyp } from '@/components/Logotyp'
import { Sidfot } from '@/components/Sidfot'
import { useSession } from '@/hooks/useSession'
import { aktivDel, type Del } from '@/lib/navigering'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const DELAR: { del: Del; till: string; namn: string; kortNamn: string; ikon: LucideIcon }[] = [
  { del: 'turer', till: '/turer', namn: 'Mina turer', kortNamn: 'Mina turer', ikon: Karta },
  { del: 'forrad', till: '/forrad', namn: 'Ditt förråd', kortNamn: 'Förråd', ikon: Backpack },
  { del: 'profil', till: '/profil', namn: 'Profil', kortNamn: 'Profil', ikon: UserRound },
]

/**
 * Ramen för de inloggade sidorna. På dator en sidomeny med Ny tur, de tre delarna, Logga ut och sidfoten.
 * I mobil ett kompakt sidhuvud, sidfoten längst ner på sidan och en bottennavigation för samma tre delar.
 */
export function AppSkal() {
  const session = useSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const aktiv = aktivDel(pathname)
  const anvandarId = session?.user.id ?? ''
  const [namn, setNamn] = useState('')

  useEffect(() => {
    if (!supabase || !anvandarId) return
    supabase
      .from('profiler')
      .select('namn')
      .eq('id', anvandarId)
      .maybeSingle()
      .then(({ data }) => setNamn(data?.namn?.trim() ?? ''))
  }, [anvandarId])

  async function loggaUt() {
    await supabase?.auth.signOut()
    navigate('/', { replace: true })
  }

  const kontext: AppKontext = { anvandarId, epost: session?.user.email ?? '', namn, setNamn }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_1fr]">
      {/* Sidomenyn på dator */}
      <aside className="hidden border-r border-border bg-card lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto">
        <div className="flex flex-1 flex-col gap-6 p-5">
          <Link to="/turer" className="flex min-h-11 items-center rounded-md px-1">
            <Logotyp className="text-xl" />
          </Link>
          <Link
            to="/turer?ny=1"
            className="flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Plus className="size-5" aria-hidden />
            Ny tur
          </Link>
          <nav aria-label="Huvudmeny">
            <ul className="space-y-1">
              {DELAR.map(({ del, till, namn: text, ikon: Ikon }) => (
                <li key={del}>
                  <Link
                    to={till}
                    aria-current={aktiv === del ? 'page' : undefined}
                    className={cn(
                      'flex min-h-12 items-center gap-3 rounded-md px-3 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      aktiv === del ? 'bg-primary-soft text-primary' : 'text-foreground hover:bg-muted',
                    )}
                  >
                    <Ikon className="size-5" aria-hidden />
                    {text}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="space-y-3 border-t border-border p-5">
          <Link to="/profil" className="flex min-h-11 items-center gap-3 rounded-md px-1 hover:bg-muted">
            <Namnbricka namn={namn || session?.user.email || '?'} />
            <span className="min-w-0 truncate font-medium">{namn || 'Din profil'}</span>
          </Link>
          <button
            type="button"
            onClick={loggaUt}
            className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <LogOut className="size-4" aria-hidden />
            Logga ut
          </button>
          <Sidfot variant="meny" className="border-t border-border pt-2 text-xs" />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        {/* Kompakt sidhuvud i mobil */}
        <header className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-2 backdrop-blur lg:hidden">
          <Link to="/turer" className="flex min-h-11 items-center">
            <Logotyp />
          </Link>
          <Link to="/profil" aria-label="Din profil" className="flex size-11 items-center justify-center rounded-full">
            <Namnbricka namn={namn || session?.user.email || '?'} />
          </Link>
        </header>

        {!supabase && (
          <div className="m-4 rounded-md bg-accent-soft p-4 text-sm">
            Supabase är inte kopplat än. Kopiera <code>.env.example</code> till <code>.env.local</code> och fyll i nycklarna.
          </div>
        )}

        {/* Luft under innehållet i mobil, så att inget hamnar bakom bottennavigationen. */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-8 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
          <Suspense
            fallback={
              <p role="status" className="text-muted-foreground">
                Hämtar sidan …
              </p>
            }
          >
            <Outlet context={kontext} />
          </Suspense>
        </main>

        <Sidfot className="mx-4 mb-[calc(5rem+env(safe-area-inset-bottom))] lg:hidden" />
      </div>

      {/* Bottennavigation i mobil */}
      <nav
        aria-label="Huvudmeny"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {DELAR.map(({ del, till, kortNamn, ikon: Ikon }) => (
            <li key={del}>
              <Link
                to={till}
                aria-current={aktiv === del ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                  aktiv === del ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Ikon className="size-6" aria-hidden strokeWidth={aktiv === del ? 2.25 : 1.75} />
                {kortNamn}
                {aktiv === del && <span aria-hidden className="absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-primary" />}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
