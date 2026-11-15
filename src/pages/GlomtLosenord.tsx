import { useState, type FormEvent } from 'react'
import { Falt, Felruta, KontoKort, Sidlank } from '@/components/konto/KontoDelar'
import { Button } from '@/components/ui/button'
import { authFel, kontrolleraEpost } from '@/lib/konto'
import { supabase } from '@/lib/supabase'

/** Skickar en länk för att välja nytt lösenord. Länken leder till /nytt-losenord. */
export function GlomtLosenord() {
  const [epost, setEpost] = useState('')
  const [epostFel, setEpostFel] = useState<string | null>(null)
  const [fel, setFel] = useState<string | null>(null)
  const [status, setStatus] = useState<'redo' | 'skickar' | 'skickat'>('redo')

  async function skicka(e: FormEvent) {
    e.preventDefault()
    const ef = kontrolleraEpost(epost)
    setEpostFel(ef)
    setFel(null)
    if (ef || !supabase) return

    setStatus('skickar')
    const { error } = await supabase.auth.resetPasswordForEmail(epost.trim(), {
      redirectTo: `${window.location.origin}/nytt-losenord`,
    })
    if (error) {
      setFel(authFel(error))
      setStatus('redo')
    } else {
      setStatus('skickat')
    }
  }

  if (status === 'skickat') {
    return (
      <KontoKort rubrik="Kolla din mejl">
        {/* Samma svar oavsett om kontot finns, så att sidan inte avslöjar vilka adresser som har konto. */}
        <p>
          Om det finns ett konto för <strong>{epost.trim()}</strong> har vi skickat en länk dit. Klicka på den för att välja ett
          nytt lösenord.
        </p>
        <p className="text-sm text-muted-foreground">Hittar du inte mejlet? Titta i skräpposten.</p>
        <Sidlank to="/logga-in">Tillbaka till inloggningen</Sidlank>
      </KontoKort>
    )
  }

  return (
    <KontoKort rubrik="Glömt lösenordet?">
      <p className="text-muted-foreground">Skriv din mejladress så skickar vi en länk där du kan välja ett nytt lösenord.</p>
      <form onSubmit={skicka} noValidate className="space-y-4">
        <Falt
          etikett="Mejladress"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={epost}
          onChange={(e) => setEpost(e.target.value)}
          fel={epostFel}
        />
        {fel && <Felruta>{fel}</Felruta>}
        <Button type="submit" className="w-full" disabled={status === 'skickar' || !supabase}>
          {status === 'skickar' ? 'Skickar …' : 'Skicka länk'}
        </Button>
      </form>
      <Sidlank to="/logga-in">Tillbaka till inloggningen</Sidlank>
    </KontoKort>
  )
}
