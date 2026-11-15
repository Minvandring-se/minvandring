import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { Kontaktlank } from '@/components/Kontaktlank'
import { Logotyp } from '@/components/Logotyp'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'
import { KONTAKT_MEJL } from '@/lib/kontakt'
import { supabase } from '@/lib/supabase'

export function Layout({ children }: { children: ReactNode }) {
  const session = useSession()
  const { pathname } = useLocation()

  // Startsidan har en egen meny och bilder i full bredd.
  if (pathname === '/') return children

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 pb-10">
      <header className="flex items-center justify-between py-4">
        <Link to="/" className="flex min-h-11 items-center">
          <Logotyp />
        </Link>
        {session && (
          <div className="flex items-center gap-2">
            <Link to="/turer" className="flex h-11 items-center px-2 text-sm font-medium hover:underline">
              Mina turer
            </Link>
            <Link to="/profil" className="flex h-11 items-center px-2 text-sm font-medium hover:underline">
              Profil
            </Link>
            <Button variant="ghost" size="sm" className="h-11" onClick={() => supabase?.auth.signOut()}>
              Logga ut
            </Button>
          </div>
        )}
      </header>
      {!supabase && (
        <div className="mb-4 rounded-md bg-accent-soft p-4 text-sm">
          Supabase är inte kopplat än. Kopiera <code>.env.example</code> till <code>.env.local</code> och fyll i nycklarna.
        </div>
      )}
      <main className="flex-1">{children}</main>
      <Sidfot />
    </div>
  )
}

const sidfotslank =
  'inline-flex min-h-11 items-center rounded-sm underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Liten sidfot på alla sidor utom startsidan: kontakt, adressen i klartext och integritetspolicyn. */
function Sidfot() {
  return (
    <footer className="mt-12 border-t border-border pt-2 text-sm text-muted-foreground">
      <ul className="flex flex-wrap items-center justify-center gap-x-5">
        {KONTAKT_MEJL && (
          <>
            <li>
              <Kontaktlank className={sidfotslank}>Kontakt och feedback</Kontaktlank>
            </li>
            {/* I klartext, så att adressen går att kopiera även utan mejlprogram. */}
            <li className="inline-flex min-h-11 items-center select-all">{KONTAKT_MEJL}</li>
          </>
        )}
        <li>
          <Link to="/integritet" className={sidfotslank}>
            Integritetspolicy
          </Link>
        </li>
      </ul>
    </footer>
  )
}
