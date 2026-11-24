import { Suspense, useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import type { AppKontext } from '@/components/app/appKontext'
import { Bottenmeny } from '@/components/app/Bottenmeny'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Namnbricka } from '@/components/app/Namnbricka'
import { Sidomeny } from '@/components/app/Sidomeny'
import { Felgrans } from '@/components/Felgrans'
import { Logotyp } from '@/components/Logotyp'
import { Sidfot } from '@/components/Sidfot'
import { useDinaTurer } from '@/hooks/useDinaTurer'
import { arProfilbildHamtad, useProfilbilder } from '@/hooks/useProfilbilder'
import { useSession } from '@/hooks/useSession'
import { aktivSida } from '@/lib/meny'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Ramen för de inloggade sidorna. På dator sidomenyn (Sidomeny), som ligger kvar när man scrollar.
 * I mobil ett kompakt sidhuvud, sidfoten längst ner på sidan och bottenmenyn (Bottenmeny) med fem flikar.
 */
export function AppSkal() {
  const session = useSession()
  const { pathname } = useLocation()
  const aktiv = aktivSida(pathname)
  const anvandarId = session?.user.id ?? ''
  const { turer: dinaTurer } = useDinaTurer(anvandarId, pathname)
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
    <div className="min-h-dvh lg:grid lg:grid-cols-[17.5rem_1fr] 3xl:grid-cols-[19.5rem_1fr]">
      {/* Hoppar förbi menyn med tangentbordet. Syns bara när den har fokus. */}
      <a
        href="#innehall"
        className="sr-only z-50 rounded-md bg-card px-4 py-3 font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:outline-2 focus-visible:outline-ring"
      >
        Hoppa till innehållet
      </a>
      <Sidomeny
        aktiv={aktiv}
        turer={dinaTurer}
        oppenTurId={oppenTurId}
        namn={namn}
        epost={session?.user.email ?? ''}
        bild={minBild}
        bildLaddar={bildLaddar}
        profilHamtad={profilHamtad}
      />

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
        {/* På dator centreras innehållet i ytan bredvid sidomenyn, högst 75rem (1200 px) brett. Luften runt växer på stora
            skärmar, och från 1920 px blir texten lite större. Formulär och brödtext har egna, smalare bredder. */}
        <main
          id="innehall"
          tabIndex={-1}
          className="w-full flex-1 px-4 pt-5 pb-8 outline-none sm:px-6 lg:px-10 lg:pt-8 lg:pb-12 2xl:px-14 2xl:pt-10 3xl:px-16 3xl:pt-12 3xl:text-[1.0625rem]"
        >
          <div className="mx-auto w-full max-w-[75rem]">
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
          </div>
        </main>

        <Sidfot className="mx-4 mb-[calc(5rem+env(safe-area-inset-bottom))] lg:hidden" />
      </div>

      <Bottenmeny aktiv={aktiv} />
    </div>
  )
}
