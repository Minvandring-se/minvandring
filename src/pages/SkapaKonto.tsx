import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { Falt, Felruta, KontoKort, Sidlank } from '@/components/konto/KontoDelar'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'
import { authFel, kontrolleraEpost, kontrolleraLosenord, kontrolleraNamn, medVidare, MINSTA_LOSENORD, sakerVidare } from '@/lib/konto'
import { supabase } from '@/lib/supabase'

interface Fel {
  namn: string | null
  epost: string | null
  losenord: string | null
}

const INGA_FEL: Fel = { namn: null, epost: null, losenord: null }

/** Nytt konto med namn, mejl och lösenord. Namnet blir profilens namn. */
export function SkapaKonto() {
  const session = useSession()
  const [params] = useSearchParams()
  const vidare = sakerVidare(params.get('vidare'))
  const [namn, setNamn] = useState('')
  const [epost, setEpost] = useState('')
  const [losenord, setLosenord] = useState('')
  const [faltFel, setFaltFel] = useState<Fel>(INGA_FEL)
  const [fel, setFel] = useState<string | null>(null)
  const [status, setStatus] = useState<'redo' | 'skickar' | 'bekrafta'>('redo')

  if (session) return <Navigate to={vidare} replace />

  async function skapa(e: FormEvent) {
    e.preventDefault()
    const nyaFel = { namn: kontrolleraNamn(namn), epost: kontrolleraEpost(epost), losenord: kontrolleraLosenord(losenord) }
    setFaltFel(nyaFel)
    setFel(null)
    if (nyaFel.namn || nyaFel.epost || nyaFel.losenord || !supabase) return

    setStatus('skickar')
    const { data, error } = await supabase.auth.signUp({
      email: epost.trim(),
      password: losenord,
      options: {
        data: { namn: namn.trim() },
        emailRedirectTo: `${window.location.origin}${vidare}`,
      },
    })
    if (error) {
      setFel(authFel(error))
      setStatus('redo')
      return
    }
    // Utan session väntar Supabase på att mejladressen bekräftas. Med session tar Navigate ovan över.
    if (!data.session) setStatus('bekrafta')
  }

  if (status === 'bekrafta') {
    return (
      <KontoKort rubrik="Bekräfta din mejladress">
        <p>
          Vi har skickat ett mejl till <strong>{epost.trim()}</strong>. Klicka på länken i mejlet så är kontot klart och du blir
          inloggad.
        </p>
        <p className="text-sm text-muted-foreground">Hittar du inte mejlet? Titta i skräpposten.</p>
      </KontoKort>
    )
  }

  return (
    <KontoKort rubrik="Skapa konto">
      <form onSubmit={skapa} noValidate className="space-y-4">
        <Falt
          etikett="Ditt namn"
          autoComplete="name"
          maxLength={40}
          value={namn}
          onChange={(e) => setNamn(e.target.value)}
          hjalp="Så här ser de andra dig i turerna."
          fel={faltFel.namn}
        />
        <Falt
          etikett="Mejladress"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={epost}
          onChange={(e) => setEpost(e.target.value)}
          fel={faltFel.epost}
        />
        <Falt
          etikett="Lösenord"
          type="password"
          autoComplete="new-password"
          value={losenord}
          onChange={(e) => setLosenord(e.target.value)}
          hjalp={`Minst ${MINSTA_LOSENORD} tecken.`}
          fel={faltFel.losenord}
        />
        {fel && <Felruta>{fel}</Felruta>}
        <Button type="submit" className="w-full" disabled={status === 'skickar' || !supabase}>
          {status === 'skickar' ? 'Skapar konto …' : 'Skapa konto'}
        </Button>
      </form>
      <p className="text-muted-foreground">
        Har du redan ett konto? <Sidlank to={medVidare('/logga-in', vidare)}>Logga in</Sidlank>
      </p>
    </KontoKort>
  )
}
