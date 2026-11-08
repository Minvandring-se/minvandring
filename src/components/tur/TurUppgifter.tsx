import { Pencil } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { dagarMellan, datumText } from '@/lib/datum'
import { supabase } from '@/lib/supabase'
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
      <dd className="text-right font-medium">{varde || '–'}</dd>
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
      setFel('Det gick inte att spara. Försök igen.')
      return
    }
    onSparad(data as Tur)
    setRedigerar(false)
  }

  if (!redigerar) {
    return (
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Om turen</h2>
          {kanAndra && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setForm(tur)
                setRedigerar(true)
              }}
            >
              <Pencil className="size-4" aria-hidden />
              Ändra
            </Button>
          )}
        </div>
        <dl className="text-sm">
          <Rad etikett="Destination" varde={tur.destination ?? ''} />
          <Rad etikett="Startpunkt" varde={tur.startpunkt ?? ''} />
          <Rad etikett="Avresa" varde={datumText(tur.avresa)} />
          <Rad etikett="Hemkomst" varde={datumText(tur.hemkomst)} />
          <Rad etikett="Vandringsdagar" varde={String(tur.dagar)} />
          <Rad etikett="Reservdagar" varde={String(tur.reservdagar)} />
        </dl>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={spara} className="space-y-4">
        <h2 className="text-lg">Ändra turen</h2>

        <Falt etikett="Namn">
          <Input required maxLength={80} value={form.namn} onChange={(e) => andra('namn', e.target.value)} />
        </Falt>
        <Falt etikett="Destination">
          <Input maxLength={80} placeholder="T.ex. Sarek" value={form.destination ?? ''} onChange={(e) => andra('destination', e.target.value)} />
        </Falt>
        <Falt etikett="Startpunkt">
          <Input maxLength={80} placeholder="T.ex. Aktse" value={form.startpunkt ?? ''} onChange={(e) => andra('startpunkt', e.target.value)} />
        </Falt>

        <div className="grid grid-cols-2 gap-3">
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
              value={dagarFranDatum ?? form.dagar}
              disabled={dagarFranDatum !== null}
              onChange={(e) => andra('dagar', Number(e.target.value))}
            />
          </Falt>
          <Falt etikett="Reservdagar">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={10}
              value={form.reservdagar}
              onChange={(e) => andra('reservdagar', Number(e.target.value))}
            />
          </Falt>
        </div>
        {dagarFranDatum !== null && <p className="text-sm text-muted-foreground">Dagarna räknas från datumen.</p>}

        {fel && <p className="text-sm text-destructive">{fel}</p>}

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={sparar || !form.namn.trim()}>
            {sparar ? 'Sparar …' : 'Spara'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setRedigerar(false)}>
            Avbryt
          </Button>
        </div>
      </form>
    </Card>
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
