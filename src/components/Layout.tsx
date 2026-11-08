import { Mountain } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'
import { supabase } from '@/lib/supabase'

export function Layout({ children }: { children: ReactNode }) {
  const session = useSession()

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 pb-10">
      <header className="flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Mountain className="size-6" aria-hidden />
          Min Vandring
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
    </div>
  )
}
