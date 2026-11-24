import { Pencil } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sektion } from '@/components/ui/sektion'
import { dagarMellan } from '@/lib/datum'
import { supabase } from '@/lib/supabase'
import { antalFranFalt, INTE_ANGETT } from '@/lib/turlista'
import type { Tur } from '@/lib/typer'

interface Props {
  tur: Tur
  kanAndra: boolean
  onSparad: (tur: Tur) => void
}

function Rad({ etikett, varde }: { etikett: string; varde: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <dt className="text-muted-foreground">{etikett}</dt>
      <dd className={varde && varde !== INTE_ANGETT ? 'min-w-0 text-right font-medium break-words' : 'text-right text-muted-foreground'}>
        {varde || INTE_ANGETT}
      </dd>
    </div>
  )
}

/** Turens grunduppgifter. Ägare och redigerare kan ändra dem, läsare ser dem. */
export function TurUppgifter({ tur, kanAndra, onSparad }: Props) {
  const [redigerar, setRedigerar] = useState(false)
  const [form, setForm] = useState(tur)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState('')

  const dagarFranDatum = dagarMellan(form.avresa, form.hemkomst)

  function andra<K extends keyof Tur>(nyckel: K, varde: Tur[K]) {
    setForm((f) => ({ ...f, [nyckel]: varde }))
  }

  async function spara(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !form.namn.trim()) return
    if (form.avresa && form.hemkomst && dagarFranDatum === null) {
      setFel('Hemkomsten kan inte vara före avresan.')
      return
    }
    setSparar(true)
    setFel('')
    const andringar = {
      namn: form.namn.trim(),
      destination: form.destination?.trim() || null,
      startpunkt: form.startpunkt?.trim() || null,
      avresa: form.avresa || null,
      hemkomst: form.hemkomst || null,
      dagar: dagarFranDatum ?? form.dagar,
      reservdagar: form.reservdagar,
    }
    const { data, error } = await supabase.from('turer').update(andringar).eq('id', tur.id).select().single()
    setSparar(false)
    if (error || !data) {
      setFel('Det gick inte att spara. Kontrollera uppkopplingen och försök igen.')
      return
    }
    onSparad(data as Tur)
    setRedigerar(false)
  }

  if (!redigerar) {
    return (
      // Namn, destination, datum och vandringsdagar står i turens huvud. Här står resten, och här ändrar man allt.
      <Sektion
        rubrik="Turens uppgifter"
        atgard={
          kanAndra && (
            <Button
              variant="outline"
              className="px-4 whitespace-nowrap"
              onClick={() => {
                setForm(tur)
                setRedigerar(true)
              }}
            >
              <Pencil className="size-4" aria-hidden />
              Ändra uppgifter
            </Button>
          )
        }
      >
        <dl className="text-sm">
          <Rad etikett="Startpunkt" varde={tur.startpunkt ?? ''} />
          <Rad etikett="Reservdagar" varde={String(tur.reservdagar)} />
        </dl>
      </Sektion>
    )
  }

  return (
    <Sektion rubrik="Ändra turen">
      <form onSubmit={spara} className="space-y-4">
        <Falt etikett="Namn">
          <Input required maxLength={80} value={form.namn} onChange={(e) => andra('namn', e.target.value)} />
        </Falt>
        <Falt etikett="Destination">
          <Input maxLength={80} placeholder="T.ex. Sarek" value={form.destination ?? ''} onChange={(e) => andra('destination', e.target.value)} />
        </Falt>
        <Falt etikett="Startpunkt">
          <Input maxLength={80} placeholder="T.ex. Aktse" value={form.startpunkt ?? ''} onChange={(e) => andra('startpunkt', e.target.value)} />
        </Falt>

        {/* Datumen står under varandra på smala skärmar, så att datumet inte klipps i fältet. */}
        <div className="grid grid-cols-1 gap-3 min-[28rem]:grid-cols-2">
          <Falt etikett="Avresa">
            <Input type="date" value={form.avresa ?? ''} onChange={(e) => andra('avresa', e.target.value || null)} />
          </Falt>
          <Falt etikett="Hemkomst">
            <Input type="date" value={form.hemkomst ?? ''} onChange={(e) => andra('hemkomst', e.target.value || null)} />
          </Falt>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Falt etikett="Vandringsdagar">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={30}
              value={dagarFranDatum ?? form.dagar ?? ''}
              disabled={dagarFranDatum !== null}
              onChange={(e) => andra('dagar', antalFranFalt(e.target.value))}
            />
          </Falt>
          <Falt etikett="Reservdagar">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={10}
              value={form.reservdagar}
              onChange={(e) => andra('reservdagar', antalFranFalt(e.target.value) ?? 0)}
            />
          </Falt>
        </div>
        {dagarFranDatum !== null && <p className="text-sm text-muted-foreground">Dagarna räknas från datumen.</p>}

        {fel && (
          <p role="alert" className="text-sm text-destructive">
            {fel}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={sparar || !form.namn.trim()}>
            {sparar ? 'Sparar …' : 'Spara'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setRedigerar(false)}>
            Avbryt
          </Button>
        </div>
      </form>
    </Sektion>
  )
}

function Falt({ etikett, children }: { etikett: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{etikett}</span>
      {children}
    </label>
  )
}
