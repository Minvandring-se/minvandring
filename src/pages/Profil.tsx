import { LogOut } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { Namnbricka } from '@/components/app/Namnbricka'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

/** Ändra sitt visningsnamn och logga ut. Namnet följer med till alla turer man är med i. */
export function Profil() {
  const { anvandarId, epost, setNamn: setNamnIRamen } = useApp()
  const navigate = useNavigate()
  const id = useId()
  const [namn, setNamn] = useState('')
  const [status, setStatus] = useState<'laddar' | 'redo' | 'sparar' | 'sparat' | 'fel'>('laddar')

  useEffect(() => {
    if (!supabase || !anvandarId) return
    supabase
      .from('profiler')
      .select('namn')
      .eq('id', anvandarId)
      .maybeSingle()
      .then(({ data }) => {
        setNamn(data?.namn ?? '')
        setStatus('redo')
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
    <div className="max-w-xl space-y-8">
      <SidRubrik rubrik="Profil" text="Ditt namn och ditt konto." />

      <Card className="space-y-5 sm:p-6">
        <div className="flex items-center gap-4">
          <Namnbricka namn={namn || epost || '?'} className="size-14 text-base" />
          <div className="min-w-0">
            <p className="truncate font-heading text-lg font-semibold">{namn || 'Inget namn än'}</p>
            <p className="truncate text-sm text-muted-foreground">{epost}</p>
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
            disabled={status === 'laddar'}
            maxLength={40}
            autoComplete="name"
            aria-describedby={`${id}-hjalp`}
          />
          <p id={`${id}-hjalp`} className="text-sm text-muted-foreground">
            Så här ser de andra dig i turerna.
          </p>
          <Button type="submit" className="w-full sm:w-auto" disabled={status === 'laddar' || status === 'sparar' || !namn.trim()}>
            {status === 'sparar' ? 'Sparar …' : 'Spara'}
          </Button>
          <p role="status" className="text-sm">
            {status === 'sparat' && <span className="text-primary">Sparat.</span>}
            {status === 'fel' && <span className="text-destructive">Det gick inte att spara. Försök igen.</span>}
          </p>
        </form>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4 sm:p-6">
        <div>
          <h2 className="text-lg">Konto</h2>
          <p className="text-sm text-muted-foreground">Logga ut från MinVandring på den här enheten.</p>
        </div>
        <Button variant="outline" onClick={loggaUt}>
          <LogOut className="size-4" aria-hidden />
          Logga ut
        </Button>
      </Card>
    </div>
  )
}
