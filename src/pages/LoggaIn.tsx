import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { Falt, Felruta, KontoKort, LosenordFalt, Sidlank } from '@/components/konto/KontoDelar'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'
import { authFel, kontrolleraEpost, medVidare, sakerVidare } from '@/lib/konto'
import { supabase } from '@/lib/supabase'

/** Inloggning med mejl och lösenord. */
export function LoggaIn() {
  const session = useSession()
  const [params] = useSearchParams()
  const vidare = sakerVidare(params.get('vidare'))
  const [epost, setEpost] = useState('')
  const [losenord, setLosenord] = useState('')
  const [epostFel, setEpostFel] = useState<string | null>(null)
  const [losenordFel, setLosenordFel] = useState<string | null>(null)
  const [fel, setFel] = useState<string | null>(null)
  const [skickar, setSkickar] = useState(false)

  if (session) return <Navigate to={vidare} replace />

  async function loggaIn(e: FormEvent) {
    e.preventDefault()
    const ef = kontrolleraEpost(epost)
    const lf = losenord ? null : 'Fyll i ditt lösenord.'
    setEpostFel(ef)
    setLosenordFel(lf)
    setFel(null)
    if (ef || lf || !supabase) return

    setSkickar(true)
    const { error } = await supabase.auth.signInWithPassword({ email: epost.trim(), password: losenord })
    setSkickar(false)
    if (error) setFel(authFel(error))
    // Lyckas det byter useSession till inloggad och Navigate ovan tar över.
  }

  return (
    <KontoKort rubrik="Logga in">
      <form onSubmit={loggaIn} noValidate className="space-y-4">
        <Falt
          etikett="Mejladress"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={epost}
          onChange={(e) => setEpost(e.target.value)}
          fel={epostFel}
        />
        <LosenordFalt
          etikett="Lösenord"
          autoComplete="current-password"
          value={losenord}
          onChange={(e) => setLosenord(e.target.value)}
          fel={losenordFel}
        />
        {fel && <Felruta>{fel}</Felruta>}
        <Button type="submit" className="w-full" disabled={skickar || !supabase}>
          {skickar ? 'Loggar in …' : 'Logga in'}
        </Button>
      </form>
      <div className="flex flex-col items-start">
        <Sidlank to="/glomt-losenord">Glömt lösenordet?</Sidlank>
        <p className="text-muted-foreground">
          Inget konto? <Sidlank to={medVidare('/skapa-konto', vidare)}>Skapa konto</Sidlank>
        </p>
      </div>
    </KontoKort>
  )
}
