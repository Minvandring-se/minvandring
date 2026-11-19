import { Dog, Plus, UserPlus, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Namnbricka } from '@/components/app/Namnbricka'
import { Inbjudan } from '@/components/tur/Inbjudan'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ROLLBESKRIVNING, ROLLNAMN, arAgare, kanAndra, kanTaBort, type Roll } from '@/lib/roller'
import { supabase } from '@/lib/supabase'
import type { DeltagareRad, Tur } from '@/lib/typer'

interface Props {
  tur: Tur
  deltagare: DeltagareRad[]
  /** Adresser till profilbilderna, per user_id. Bara de som har en bild finns med. */
  bilder: Record<string, string>
  minRoll: Roll | null
  mittUserId: string
  onAndrad: () => void
  onLamnat: () => void
}

const ROLLER: Roll[] = ['owner', 'editor', 'viewer']

export function Deltagarlista({ tur, deltagare, bilder, minRoll, mittUserId, onAndrad, onLamnat }: Props) {
  const [nyttNamn, setNyttNamn] = useState('')
  const [nyTyp, setNyTyp] = useState<'person' | 'hund'>('hund')
  const [fel, setFel] = useState('')
  const [bjuderIn, setBjuderIn] = useState(false)
  const faltId = useId()
  // Samma roller som får bjuda in i dag: ägare och redigerare.
  const farBjudaIn = minRoll !== null && kanAndra(minRoll)

  const alla = deltagare.map((d) => ({ id: d.id, roll: d.roll, userId: d.user_id }))

  async function bytRoll(id: string, roll: Roll) {
    if (!supabase) return
    setFel('')
    const { error } = await supabase.from('deltagare').update({ roll }).eq('id', id)
    if (error) setFel(error.message.includes('minst en ägare') ? 'Turen måste ha minst en ägare.' : 'Det gick inte att ändra rollen.')
    onAndrad()
  }

  async function taBort(d: DeltagareRad) {
    if (!supabase) return
    const lamnar = d.user_id === mittUserId
    const fraga = lamnar ? 'Vill du lämna turen? Du behöver en ny inbjudan för att komma tillbaka.' : `Ta bort ${d.namn} från turen?`
    if (!window.confirm(fraga)) return
    setFel('')
    const { error } = await supabase.from('deltagare').delete().eq('id', d.id)
    if (error) {
      setFel('Det gick inte att ta bort.')
      return
    }
    if (lamnar) onLamnat()
    else onAndrad()
  }

  async function laggTill(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !nyttNamn.trim()) return
    setFel('')
    const { error } = await supabase.from('deltagare').insert({
      tur_id: tur.id,
      namn: nyttNamn.trim(),
      typ: nyTyp,
      sortering: deltagare.length,
    })
    if (error) {
      setFel('Det gick inte att lägga till.')
      return
    }
    setNyttNamn('')
    onAndrad()
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-xl">Deltagare</h2>
        {farBjudaIn && (
          <Button variant="outline" aria-expanded={bjuderIn} aria-controls={`${faltId}-inbjudan`} onClick={() => setBjuderIn((b) => !b)}>
            <UserPlus className="size-4" aria-hidden />
            Bjud in
          </Button>
        )}
      </div>

      {farBjudaIn && minRoll && (
        <div id={`${faltId}-inbjudan`} hidden={!bjuderIn}>
          {/* Länken hämtas först när rutan öppnas. */}
          {bjuderIn && <Inbjudan turId={tur.id} minRoll={minRoll} />}
        </div>
      )}

      <ul className="divide-y divide-border">
        {deltagare.map((d) => {
          const jag = d.user_id === mittUserId
          const harKonto = d.user_id !== null
          return (
            <li key={d.id} className="flex min-h-14 items-center gap-3 py-2">
              {d.typ === 'hund' ? (
                <span className="inline-flex size-9 shrink-0 items-center justify-center">
                  <Dog className="size-5 text-primary" aria-label="Hund" />
                </span>
              ) : (
                // Profilbilden när den finns, annars bokstaven. Personer utan konto har alltid bokstaven.
                <Namnbricka namn={d.namn} bild={d.user_id ? bilder[d.user_id] : null} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {d.namn}
                  {jag && <span className="font-normal text-muted-foreground"> (du)</span>}
                </p>
                {!harKonto && d.typ === 'person' && <p className="text-sm text-muted-foreground">Har inte gått med själv</p>}
              </div>

              {harKonto &&
                (arAgare(minRoll) ? (
                  <select
                    aria-label={`Roll för ${d.namn}`}
                    className="h-11 rounded-md border border-border bg-card px-2 text-sm"
                    value={d.roll}
                    onChange={(e) => bytRoll(d.id, e.target.value as Roll)}
                  >
                    {ROLLER.map((r) => (
                      <option key={r} value={r}>
                        {ROLLNAMN[r]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium">
                    {ROLLNAMN[d.roll]}
                  </span>
                ))}

              {minRoll && kanTaBort(minRoll, { id: d.id, roll: d.roll, userId: d.user_id }, mittUserId, alla) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-11 px-0"
                  aria-label={jag ? 'Lämna turen' : `Ta bort ${d.namn}`}
                  onClick={() => taBort(d)}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              )}
            </li>
          )
        })}
      </ul>

      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}

      {/* Rollerna i klartext. Syns även i mobilen, där en hjälptext vid muspekaren inte går att få fram. */}
      <details className="rounded-md border border-border">
        <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
          Vad betyder rollerna?
        </summary>
        <dl className="space-y-2 px-3 pb-3 text-sm">
          {ROLLER.map((r) => (
            <div key={r}>
              <dt className="font-medium">{ROLLNAMN[r]}</dt>
              <dd className="text-muted-foreground">{ROLLBESKRIVNING[r]}</dd>
            </div>
          ))}
        </dl>
      </details>

      {kanAndra(minRoll) && (
        <form onSubmit={laggTill} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1">
          <p className="col-span-2 text-sm font-medium">Lägg till en hund eller någon utan konto</p>
          <label htmlFor={`${faltId}-typ`} className="col-span-2 text-sm text-muted-foreground">
            Typ
          </label>
          <select
            id={`${faltId}-typ`}
            className="col-span-2 mb-1 h-11 rounded-md border border-border bg-card px-3"
            value={nyTyp}
            onChange={(e) => setNyTyp(e.target.value as 'person' | 'hund')}
          >
            <option value="hund">Hund</option>
            <option value="person">Person utan konto</option>
          </select>
          <label htmlFor={`${faltId}-namn`} className="col-span-2 text-sm text-muted-foreground">
            Namn
          </label>
          <Input id={`${faltId}-namn`} maxLength={40} value={nyttNamn} onChange={(e) => setNyttNamn(e.target.value)} />
          <Button type="submit" variant="outline" disabled={!nyttNamn.trim()}>
            <Plus className="size-4" aria-hidden />
            Lägg till
          </Button>
        </form>
      )}

    </Card>
  )
}
