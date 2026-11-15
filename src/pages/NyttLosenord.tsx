import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Felruta, KontoKort, LosenordFalt, Sidlank } from '@/components/konto/KontoDelar'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'
import { authFel, kontrolleraLosenord, MINSTA_LOSENORD, STANDARD_VIDARE } from '@/lib/konto'
import { supabase } from '@/lib/supabase'

/**
 * Hit leder länken i mejlet om glömt lösenord. Supabase loggar in med länken,
 * och sedan väljer man ett nytt lösenord. Utan inloggning har länken gått ut.
 */
export function NyttLosenord() {
  const session = useSession()
  const navigate = useNavigate()
  const [losenord, setLosenord] = useState('')
  const [losenordFel, setLosenordFel] = useState<string | null>(null)
  const [fel, setFel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)

  if (session === undefined) return <p role="status" className="text-muted-foreground">Laddar …</p>

  if (session === null) {
    return (
      <KontoKort rubrik="Länken fungerar inte">
        <p>Länken har gått ut eller redan använts. Be om en ny så får du ett nytt mejl.</p>
        <Sidlank to="/glomt-losenord">Skicka en ny länk</Sidlank>
      </KontoKort>
    )
  }

  async function spara(e: FormEvent) {
    e.preventDefault()
    const lf = kontrolleraLosenord(losenord)
    setLosenordFel(lf)
    setFel(null)
    if (lf || !supabase) return

    setSparar(true)
    const { error } = await supabase.auth.updateUser({ password: losenord })
    setSparar(false)
    if (error) setFel(authFel(error))
    else navigate(STANDARD_VIDARE, { replace: true })
  }

  return (
    <KontoKort rubrik="Välj nytt lösenord">
      <p className="text-sm text-muted-foreground">För {session.user.email}</p>
      <form onSubmit={spara} noValidate className="space-y-4">
        {/* Dolt fält så att lösenordshanteraren vet vilket konto lösenordet hör till. */}
        <input type="email" autoComplete="username" value={session.user.email ?? ''} readOnly hidden />
        <LosenordFalt
          etikett="Nytt lösenord"
          autoComplete="new-password"
          value={losenord}
          onChange={(e) => setLosenord(e.target.value)}
          hjalp={`Minst ${MINSTA_LOSENORD} tecken.`}
          fel={losenordFel}
        />
        {fel && <Felruta>{fel}</Felruta>}
        <Button type="submit" className="w-full" disabled={sparar}>
          {sparar ? 'Sparar …' : 'Spara lösenord'}
        </Button>
      </form>
    </KontoKort>
  )
}
