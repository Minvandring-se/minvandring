import { Backpack, Check, CookingPot, Copy, Route } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface Tur {
  id: string
  namn: string
  destination: string | null
  dagar: number
  reservdagar: number
  inbjudningskod: string
}

interface DeltagareRad {
  id: string
  namn: string
  typ: 'person' | 'hund'
}

/** Turens översikt. Packa, Mat och Rutt byggs i version 1 (se docs/version-1.md). */
export function TurSida() {
  const { id } = useParams()
  const [tur, setTur] = useState<Tur | null | undefined>(undefined)
  const [deltagare, setDeltagare] = useState<DeltagareRad[]>([])
  const [kopierad, setKopierad] = useState(false)

  useEffect(() => {
    if (!supabase || !id) return
    supabase
      .from('turer')
      .select('id, namn, destination, dagar, reservdagar, inbjudningskod')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setTur(data))
    supabase
      .from('deltagare')
      .select('id, namn, typ')
      .eq('tur_id', id)
      .order('sortering')
      .then(({ data }) => setDeltagare(data ?? []))
  }, [id])

  if (tur === undefined) return <p className="text-muted-foreground">Laddar …</p>
  if (tur === null) return <p>Turen finns inte, eller så är du inte med i den.</p>

  const lank = `${window.location.origin}/ga-med/${tur.inbjudningskod}`

  async function kopiera() {
    await navigator.clipboard.writeText(lank)
    setKopierad(true)
    setTimeout(() => setKopierad(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">{tur.namn}</h1>
        <p className="text-muted-foreground">
          {[tur.destination, `${tur.dagar} dagar + ${tur.reservdagar} reserv`].filter(Boolean).join(' · ')}
        </p>
      </div>

      <Card className="space-y-3">
        <h2 className="text-lg">Vilka följer med</h2>
        <ul className="flex flex-wrap gap-2">
          {deltagare.map((d) => (
            <li key={d.id} className="rounded-full bg-primary-soft px-3 py-1 text-sm">
              {d.typ === 'hund' ? '🐕 ' : ''}
              {d.namn}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">{lank}</code>
          <Button variant="outline" onClick={kopiera}>
            {kopierad ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {kopierad ? 'Kopierad' : 'Kopiera inbjudan'}
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { ikon: Backpack, namn: 'Packa' },
          { ikon: CookingPot, namn: 'Mat' },
          { ikon: Route, namn: 'Rutt' },
        ].map(({ ikon: Ikon, namn }) => (
          <Card key={namn} className="flex items-center gap-3 opacity-60">
            <Ikon className="size-5 text-primary" aria-hidden />
            <span className="font-medium">{namn}</span>
            <span className="ml-auto text-xs text-muted-foreground">Kommer snart</span>
          </Card>
        ))}
      </div>
    </div>
  )
}
