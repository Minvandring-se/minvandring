import { Check, Copy, Dog, Plus, UserRound, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ROLLBESKRIVNING, ROLLNAMN, arAgare, kanAndra, kanTaBort, type Roll } from '@/lib/roller'
import { supabase } from '@/lib/supabase'
import type { DeltagareRad, Tur } from '@/lib/typer'

interface Props {
  tur: Tur
  deltagare: DeltagareRad[]
  minRoll: Roll | null
  mittUserId: string
  onAndrad: () => void
  onLamnat: () => void
}

const ROLLER: Roll[] = ['owner', 'editor', 'viewer']

export function Deltagarlista({ tur, deltagare, minRoll, mittUserId, onAndrad, onLamnat }: Props) {
  const [kopierad, setKopierad] = useState(false)
  const [nyttNamn, setNyttNamn] = useState('')
  const [nyTyp, setNyTyp] = useState<'person' | 'hund'>('hund')
  const [fel, setFel] = useState('')

  const lank = `${window.location.origin}/ga-med/${tur.inbjudningskod}`
  const alla = deltagare.map((d) => ({ id: d.id, roll: d.roll, userId: d.user_id }))

  async function kopiera() {
    await navigator.clipboard.writeText(lank)
    setKopierad(true)
    setTimeout(() => setKopierad(false), 2000)
  }

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
      <h2 className="text-lg">Vilka följer med</h2>

      <ul className="divide-y divide-border">
        {deltagare.map((d) => {
          const jag = d.user_id === mittUserId
          const harKonto = d.user_id !== null
          return (
            <li key={d.id} className="flex min-h-14 items-center gap-3 py-2">
              {d.typ === 'hund' ? (
                <Dog className="size-5 shrink-0 text-primary" aria-label="Hund" />
              ) : (
                <UserRound className="size-5 shrink-0 text-primary" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {d.namn}
                  {jag && <span className="font-normal text-muted-foreground"> (du)</span>}
                </p>
                {!harKonto && d.typ === 'person' && <p className="text-xs text-muted-foreground">Har inte gått med själv</p>}
              </div>

              {harKonto &&
                (arAgare(minRoll) ? (
                  <select
                    aria-label={`Roll för ${d.namn}`}
                    title={ROLLBESKRIVNING[d.roll]}
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
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium" title={ROLLBESKRIVNING[d.roll]}>
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

      {fel && <p className="text-sm text-destructive">{fel}</p>}

      {kanAndra(minRoll) && (
        <form onSubmit={laggTill} className="flex flex-col gap-2 sm:flex-row">
          <select
            aria-label="Typ"
            className="h-11 rounded-md border border-border bg-card px-3"
            value={nyTyp}
            onChange={(e) => setNyTyp(e.target.value as 'person' | 'hund')}
          >
            <option value="hund">Hund</option>
            <option value="person">Person utan konto</option>
          </select>
          <Input placeholder="Namn" maxLength={40} value={nyttNamn} onChange={(e) => setNyttNamn(e.target.value)} />
          <Button type="submit" variant="outline" disabled={!nyttNamn.trim()}>
            <Plus className="size-4" aria-hidden />
            Lägg till
          </Button>
        </form>
      )}

      <div className="space-y-2 rounded-md bg-muted p-3">
        <p className="text-sm font-medium">Bjud in fler</p>
        <p className="text-sm text-muted-foreground">Den som går med via länken blir redigerare. Ägaren kan ändra rollen efteråt.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-md bg-card px-3 py-2 text-sm">{lank}</code>
          <Button variant="outline" onClick={kopiera}>
            {kopierad ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {kopierad ? 'Kopierad' : 'Kopiera länk'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
