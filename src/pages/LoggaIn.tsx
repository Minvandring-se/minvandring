import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSession } from '@/hooks/useSession'
import { supabase } from '@/lib/supabase'

/** Inloggning med en länk i mejlet. Inga lösenord. */
export function LoggaIn() {
  const session = useSession()
  const [params] = useSearchParams()
  const vidare = params.get('vidare') ?? '/turer'
  const [epost, setEpost] = useState('')
  const [status, setStatus] = useState<'redo' | 'skickar' | 'skickat' | 'fel'>('redo')

  if (session) return <Navigate to={vidare} replace />

  async function skicka(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setStatus('skickar')
    const { error } = await supabase.auth.signInWithOtp({
      email: epost.trim(),
      options: { emailRedirectTo: `${window.location.origin}${vidare}` },
    })
    setStatus(error ? 'fel' : 'skickat')
  }

  return (
    <Card className="mx-auto mt-10 max-w-md space-y-4">
      <h1 className="text-2xl">Logga in</h1>
      {status === 'skickat' ? (
        <p>Kolla din mejl. Vi har skickat en länk till {epost}. Klicka på den så är du inloggad.</p>
      ) : (
        <form onSubmit={skicka} className="space-y-3">
          <p className="text-muted-foreground">Skriv din mejladress så skickar vi en inloggningslänk. Inget lösenord behövs.</p>
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="namn@exempel.se"
            value={epost}
            onChange={(e) => setEpost(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={status === 'skickar' || !supabase}>
            {status === 'skickar' ? 'Skickar …' : 'Skicka länk'}
          </Button>
          {status === 'fel' && <p className="text-sm text-destructive">Det gick inte att skicka länken. Försök igen.</p>}
        </form>
      )}
    </Card>
  )
}
