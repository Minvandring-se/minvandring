import { Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface TurRad {
  id: string
  namn: string
  destination: string | null
  avresa: string | null
}

export function MinaTurer() {
  const navigate = useNavigate()
  const [turer, setTurer] = useState<TurRad[] | null>(null)
  const [namn, setNamn] = useState('')

  useEffect(() => {
    supabase
      ?.from('turer')
      .select('id, namn, destination, avresa')
      .order('skapad', { ascending: false })
      .then(({ data }) => setTurer(data ?? []))
  }, [])

  async function skapa(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !namn.trim()) return
    const { data, error } = await supabase.from('turer').insert({ namn: namn.trim() }).select('id').single()
    if (!error && data) navigate(`/tur/${data.id}`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Mina turer</h1>

      <Card>
        <form onSubmit={skapa} className="flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Ny tur, t.ex. Sarek 2027" value={namn} onChange={(e) => setNamn(e.target.value)} />
          <Button type="submit" disabled={!namn.trim()}>
            <Plus className="size-4" aria-hidden />
            Skapa tur
          </Button>
        </form>
      </Card>

      {turer === null ? (
        <p className="text-muted-foreground">Laddar …</p>
      ) : turer.length === 0 ? (
        <p className="text-muted-foreground">Du har inga turer än. Skapa din första ovanför.</p>
      ) : (
        <ul className="space-y-3">
          {turer.map((t) => (
            <li key={t.id}>
              <Link to={`/tur/${t.id}`}>
                <Card className="transition-colors hover:bg-muted">
                  <p className="font-semibold">{t.namn}</p>
                  <p className="text-sm text-muted-foreground">
                    {[t.destination, t.avresa].filter(Boolean).join(' · ') || 'Inga detaljer än'}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
