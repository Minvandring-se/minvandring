import { LogOut } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { Skelett } from '@/components/app/Laddar'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Profilbildsval } from '@/components/profil/Profilbildsval'
import { Utseende } from '@/components/profil/Utseende'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sektion } from '@/components/ui/sektion'
import { useSidtitel } from '@/hooks/useSidtitel'
import { supabase } from '@/lib/supabase'

/** Ändra sitt visningsnamn och sin profilbild, och logga ut. Namnet följer med till alla turer man är med i. */
export function Profil() {
  const { anvandarId, epost, profilHamtad, setNamn: setNamnIRamen, bildUppdaterad, setBildUppdaterad } = useApp()
  const navigate = useNavigate()
  const id = useId()
  const [namn, setNamn] = useState('')
  const [status, setStatus] = useState<'laddar' | 'laddfel' | 'redo' | 'sparar' | 'sparat' | 'fel'>('laddar')
  useSidtitel('Profil')

  useEffect(() => {
    if (!supabase || !anvandarId) return
    supabase
      .from('profiler')
      .select('namn')
      .eq('id', anvandarId)
      .maybeSingle()
      .then(({ data, error }) => {
        setNamn(data?.namn ?? '')
        setStatus(error ? 'laddfel' : 'redo')
      })
  }, [anvandarId])

  async function spara(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !anvandarId || !namn.trim()) return
    setStatus('sparar')
    const { error } = await supabase.from('profiler').update({ namn: namn.trim() }).eq('id', anvandarId)
    setStatus(error ? 'fel' : 'sparat')
    if (!error) setNamnIRamen(namn.trim())
  }

  async function loggaUt() {
    await supabase?.auth.signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-6">
      <SidRubrik rubrik="Profil" text="Ditt namn, din bild och hur appen ser ut." />

      {/* På dator: namn och bild till vänster, Utseende och Konto till höger. I mobil i en kolumn. */}
      <div className="grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
      <Sektion rubrik="Namn och bild">
        <Profilbildsval
          anvandarId={anvandarId}
          namn={namn || epost || '?'}
          bildUppdaterad={bildUppdaterad}
          onAndrad={setBildUppdaterad}
          laddar={!profilHamtad}
        />
        <div className="border-t border-border pt-3">
          <div className="min-w-0">
            {status === 'laddar' ? (
              <Skelett className="my-1 h-5 w-32" />
            ) : (
              <p className="truncate font-heading text-lg font-semibold">
                {namn || (status === 'laddfel' ? 'Namnet gick inte att hämta' : 'Inget namn än')}
              </p>
            )}
            <p className="text-sm break-all text-muted-foreground">{epost}</p>
          </div>
        </div>
        <form onSubmit={spara} className="space-y-3">
          <label htmlFor={id} className="block text-sm font-medium">
            Ditt namn
          </label>
          <Input
            id={id}
            value={namn}
            onChange={(e) => {
              setNamn(e.target.value)
              setStatus('redo')
            }}
            disabled={status === 'laddar' || status === 'laddfel'}
            maxLength={40}
            autoComplete="name"
            aria-describedby={`${id}-hjalp`}
          />
          <p id={`${id}-hjalp`} className="text-sm text-muted-foreground">
            Namnet visas för andra deltagare i dina turer.
          </p>
          {/* Beskedet står bredvid knappen, så att en tom statusrad inte ger luft under formuläret. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button type="submit" className="w-full sm:w-auto" disabled={status === 'laddar' || status === 'laddfel' || status === 'sparar' || !namn.trim()}>
              {status === 'sparar' ? 'Sparar …' : 'Spara namn'}
            </Button>
            <p role="status" className="text-sm">
              {status === 'sparat' && <span className="font-medium text-primary">Namnet har sparats.</span>}
              {status === 'fel' && (
                <span className="text-destructive">Namnet gick inte att spara. Kontrollera uppkopplingen och försök igen.</span>
              )}
              {status === 'laddfel' && (
                <span className="text-destructive">Det gick inte att hämta ditt namn. Ladda om sidan och försök igen.</span>
              )}
            </p>
          </div>
        </form>
      </Sektion>

      <div className="space-y-5">
        <Sektion rubrik="Utseende">
          <Utseende />
        </Sektion>

        <Sektion rubrik="Konto">
          <p className="text-sm text-muted-foreground">Logga ut från MinVandring på den här enheten.</p>
          <Button variant="outline" className="self-start" onClick={loggaUt}>
            <LogOut className="size-4" aria-hidden />
            Logga ut
          </Button>
        </Sektion>
      </div>
      </div>
    </div>
  )
}
