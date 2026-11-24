import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { Logotyp } from '@/components/Logotyp'
import { Sidfot } from '@/components/Sidfot'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'
import { arAppsida } from '@/lib/navigering'
import { supabase } from '@/lib/supabase'
import { cn, menyBredd } from '@/lib/utils'

export function Layout({ children }: { children: ReactNode }) {
  const session = useSession()
  const { pathname } = useLocation()

  // Startsidan har en egen meny och bilder i full bredd. De inloggade sidorna har en egen ram (AppSkal).
  if (pathname === '/' || arAppsida(pathname)) return children

  return (
    // Menyn har samma bredd som på startsidan. Innehållet behåller en smal kolumn, så att formulär och text är lätta att läsa.
    <div className="flex min-h-dvh flex-col pb-10">
      {/* I mobil samma marginal som innehållet, så att logotypen står i linje med det. */}
      <header className={cn(menyBredd, 'flex flex-wrap items-center justify-between gap-x-2 px-4 py-4 sm:px-[clamp(1.5rem,4vw,4rem)]')}>
        <Link to="/" className="flex min-h-11 items-center">
          <Logotyp className="min-[1920px]:text-xl" />
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
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4">
        {!supabase && (
          <div className="mb-4 rounded-md bg-accent-soft p-4 text-sm">
            Supabase är inte kopplat än. Kopiera <code>.env.example</code> till <code>.env.local</code> och fyll i nycklarna.
          </div>
        )}
        <main className="flex-1">{children}</main>
        <Sidfot className="mt-12" />
      </div>
    </div>
  )
}

