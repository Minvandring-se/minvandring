import { ChevronDown, Dog, Plus, UserPlus, X } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router'
import { Namnbricka } from '@/components/app/Namnbricka'
import { arProfilbildHamtad } from '@/hooks/useProfilbilder'
import { Inbjudan } from '@/components/tur/Inbjudan'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sektion } from '@/components/ui/sektion'
import { Select } from '@/components/ui/select'
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
  // Samma roller som får bjuda in i dag: ägare och redigerare.
  const farBjudaIn = minRoll !== null && kanAndra(minRoll)
  // Knappen Bjud in i turens huvud leder hit med #bjud-in, och då öppnas inbjudan, varje gång man trycker.
  // key byts vid varje tryck, även när adressen är densamma.
  const { hash, key } = useLocation()
  const [bjuderIn, setBjuderIn] = useState(hash === '#bjud-in')
  const [forraKey, setForraKey] = useState(key)
  if (key !== forraKey) {
    setForraKey(key)
    if (hash === '#bjud-in') setBjuderIn(true)
  }
  const faltId = useId()
  // Sidan rullar ner till deltagarna (#deltagare och #bjud-in), och vid Bjud in flyttas fokus till inbjudan.
  useEffect(() => {
    if (hash !== '#bjud-in' && hash !== '#deltagare') return
    document.getElementById('deltagare')?.scrollIntoView({ block: 'start' })
    if (hash === '#bjud-in') document.getElementById(`${faltId}-inbjudan`)?.focus({ preventScroll: true })
  }, [hash, key, faltId])

  const alla = deltagare.map((d) => ({ id: d.id, roll: d.roll, userId: d.user_id }))

  async function bytRoll(id: string, roll: Roll) {
    if (!supabase) return
    setFel('')
    const { error } = await supabase.from('deltagare').update({ roll }).eq('id', id)
    if (error) setFel(error.message.includes('minst en ägare') ? 'Turen måste ha minst en ägare.' : 'Det gick inte att ändra rollen. Försök igen.')
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
      setFel('Det gick inte att ta bort deltagaren. Försök igen.')
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
      setFel('Det gick inte att lägga till deltagaren. Försök igen.')
      return
    }
    setNyttNamn('')
    onAndrad()
  }

  return (
    <Sektion
      rubrik="Deltagare"
      atgard={
        farBjudaIn && (
          <Button variant="outline" aria-expanded={bjuderIn} aria-controls={`${faltId}-inbjudan`} onClick={() => setBjuderIn((b) => !b)}>
            <UserPlus className="size-4" aria-hidden />
            Bjud in
          </Button>
        )
      }
    >
      {farBjudaIn && minRoll && (
        <div id={`${faltId}-inbjudan`} hidden={!bjuderIn} tabIndex={-1} role="group" aria-label="Inbjudan" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">

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
                  <Dog className="size-5 text-primary" role="img" aria-label="Hund" />
                </span>
              ) : (
                // Profilbilden när den finns, annars bokstaven. Personer utan konto har alltid bokstaven.
                <Namnbricka namn={d.namn} bild={d.user_id ? bilder[d.user_id] : null} laddar={!!d.user_id && !arProfilbildHamtad(d.user_id)} />
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
                  <Select
                    aria-label={`Roll för ${d.namn}`}
                    className="w-auto shrink-0 px-2"
                    value={d.roll}
                    onChange={(e) => bytRoll(d.id, e.target.value as Roll)}
                  >
                    {ROLLER.map((r) => (
                      <option key={r} value={r}>
                        {ROLLNAMN[r]}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium">
                    {ROLLNAMN[d.roll]}
                  </span>
                ))}

              {minRoll && kanTaBort(minRoll, { id: d.id, roll: d.roll, userId: d.user_id }, mittUserId, alla) && (
                <Button
                  variant="ghost"
                  size="ikon"
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
      {/* Ser ut som en länk med en pil, inte som ett fält. Pilen vänds när förklaringen är öppen. */}
      <details className="group">
        <summary className="-mx-1 inline-flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-md px-1 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
          Vad betyder rollerna?
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <dl className="space-y-2 rounded-md bg-muted px-3 py-3 text-sm">
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
          <Select
            id={`${faltId}-typ`}
            className="col-span-2 mb-1"
            value={nyTyp}
            onChange={(e) => setNyTyp(e.target.value as 'person' | 'hund')}
          >
            <option value="hund">Hund</option>
            <option value="person">Person utan konto</option>
          </Select>
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

    </Sektion>
  )
}
