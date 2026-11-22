import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { Logotyp } from '@/components/Logotyp'
import { Sidfot } from '@/components/Sidfot'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'
import { arAppsida } from '@/lib/navigering'
import { supabase } from '@/lib/supabase'

export function Layout({ children }: { children: ReactNode }) {
  const session = useSession()
  const { pathname } = useLocation()

  // Startsidan har en egen meny och bilder i full bredd. De inloggade sidorna har en egen ram (AppSkal).
  if (pathname === '/' || arAppsida(pathname)) return children

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-x-2 py-4">
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
            <Button variant="ghost" className="px-3" onClick={() => supabase?.auth.signOut()}>
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
      <Sidfot className="mt-12" />
    </div>
  )
}

