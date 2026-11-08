import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSession } from '@/hooks/useSession'
import { supabase } from '@/lib/supabase'

/** Ändra sitt visningsnamn. Namnet följer med till alla turer man är med i. */
export function Profil() {
  const session = useSession()
  const anvandare = session?.user
  const [namn, setNamn] = useState('')
  const [status, setStatus] = useState<'laddar' | 'redo' | 'sparar' | 'sparat' | 'fel'>('laddar')

  useEffect(() => {
    if (!supabase || !anvandare) return
    supabase
      .from('profiler')
      .select('namn')
      .eq('id', anvandare.id)
      .maybeSingle()
      .then(({ data }) => {
        setNamn(data?.namn ?? '')
        setStatus('redo')
      })
  }, [anvandare])

  async function spara(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !anvandare || !namn.trim()) return
    setStatus('sparar')
    const { error } = await supabase.from('profiler').update({ namn: namn.trim() }).eq('id', anvandare.id)
    setStatus(error ? 'fel' : 'sparat')
  }

  return (
    <Card className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl">Din profil</h1>
      <p className="text-sm text-muted-foreground">Inloggad som {anvandare?.email}</p>
      <form onSubmit={spara} className="space-y-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Ditt namn</span>
          <Input
            value={namn}
            onChange={(e) => {
              setNamn(e.target.value)
              setStatus('redo')
            }}
            disabled={status === 'laddar'}
            maxLength={40}
            autoComplete="name"
          />
        </label>
        <p className="text-sm text-muted-foreground">Så här ser de andra dig i turerna.</p>
        <Button type="submit" className="w-full" disabled={status === 'laddar' || status === 'sparar' || !namn.trim()}>
          {status === 'sparar' ? 'Sparar …' : 'Spara'}
        </Button>
        {status === 'sparat' && <p className="text-sm text-primary">Sparat.</p>}
        {status === 'fel' && <p className="text-sm text-destructive">Det gick inte att spara. Försök igen.</p>}
      </form>
    </Card>
  )
}
