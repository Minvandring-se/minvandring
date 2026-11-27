import { Trash2 } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { Skelett } from '@/components/app/Laddar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sektion } from '@/components/ui/sektion'
import { PAMINNELSE_MAX, sorteraPaminnelser, tolkaPaminnelse, type Paminnelse } from '@/lib/paminnelser'
import { supabase } from '@/lib/supabase'
import { lokaltDatum } from '@/lib/turlista'
import { cn } from '@/lib/utils'

const FEL = 'Det gick inte att uppdatera påminnelserna. Kontrollera uppkopplingen och försök igen.'

/** "12 juni" eller "12 juni 2028" när det inte är i år. */
function dagText(datum: string, idag: string): string {
  const d = new Date(`${datum}T12:00:00`)
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', ...(datum.slice(0, 4) !== idag.slice(0, 4) && { year: 'numeric' }) })
}

/**
 * Mina påminnelser i turen: det man själv vill bli påmind om, till exempel att boka tåget. Bara man själv ser dem. På
 * morgonen den valda dagen kommer en notis i klockan, och ett mejl om man har valt det under Inställningar.
 */
export function MinaPaminnelser({ turId, className }: { turId: string; className?: string }) {
  const id = useId()
  const idag = lokaltDatum()
  const [lista, setLista] = useState<Paminnelse[] | null | 'fel'>(null)
  const [omgang, setOmgang] = useState(0)
  const [text, setText] = useState('')
  const [datum, setDatum] = useState('')
  const [falt, setFalt] = useState('')
  const [fel, setFel] = useState('')
  const [sparar, setSparar] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let aktuell = true
    supabase
      .from('paminnelser')
      .select('id, tur_id, text, datum, klar, skickad')
      .eq('tur_id', turId)
      .then(({ data, error }) => {
        if (aktuell) setLista(error ? 'fel' : (data as Paminnelse[]))
      })
    return () => {
      aktuell = false
    }
  }, [turId, omgang])

  async function gor(atgard: PromiseLike<{ error: unknown }>) {
    setFel('')
    setSparar(true)
    const { error } = await atgard
    setSparar(false)
    if (error) return setFel(FEL)
    setOmgang((n) => n + 1)
  }

  async function laggTill(e: FormEvent) {
    e.preventDefault()
    const tolkad = tolkaPaminnelse(text, datum, idag)
    if (!tolkad.ok) return setFalt(tolkad.fel)
    setFalt('')
    if (!supabase) return
    await gor(supabase.from('paminnelser').insert({ tur_id: turId, text: tolkad.text, datum: tolkad.datum }))
    setText('')
    setDatum('')
  }

  return (
    <Sektion rubrik="Mina påminnelser" className={className}>
      <p className="text-sm text-muted-foreground">Bara du ser dem. På morgonen den dagen får du en notis.</p>
      {lista === null && <Skelett className="h-11 w-full" />}
      {lista === 'fel' && <p className="text-sm text-destructive">Det gick inte att hämta dina påminnelser.</p>}
      {Array.isArray(lista) && lista.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {sorteraPaminnelser(lista).map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-1.5">
              <input
                id={`${id}-${p.id}`}
                type="checkbox"
                checked={p.klar}
                disabled={sparar}
                onChange={(e) => supabase && gor(supabase.from('paminnelser').update({ klar: e.target.checked }).eq('id', p.id))}
                className="size-5 shrink-0 accent-primary"
              />
              <label htmlFor={`${id}-${p.id}`} className={cn('flex min-h-11 min-w-0 flex-1 flex-col justify-center break-words', p.klar && 'text-muted-foreground line-through')}>
                <span>{p.text}</span>
                <span className="text-sm text-muted-foreground">{dagText(p.datum, idag)}</span>
              </label>
              <Button
                type="button"
                variant="ghost"
                className="size-11 shrink-0 px-0"
                aria-label={`Ta bort påminnelsen ${p.text}`}
                disabled={sparar}
                onClick={() => supabase && gor(supabase.from('paminnelser').delete().eq('id', p.id))}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={laggTill} noValidate className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-end">
          <div className="space-y-1">
            <label htmlFor={`${id}-text`} className="block text-sm font-medium">
              Påminn mig om
            </label>
            <Input id={`${id}-text`} value={text} maxLength={PAMINNELSE_MAX} placeholder="Till exempel boka tåget" onChange={(e) => setText(e.target.value)} aria-invalid={!!falt} />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-datum`} className="block text-sm font-medium">
              Dag
            </label>
            <Input id={`${id}-datum`} type="date" min={idag} value={datum} onChange={(e) => setDatum(e.target.value)} aria-invalid={!!falt} />
          </div>
          <Button type="submit" variant="outline" disabled={sparar}>
            Lägg till
          </Button>
        </div>
        {(falt || fel) && (
          <p role="alert" className="text-sm text-destructive">
            {falt || fel}
          </p>
        )}
      </form>
    </Sektion>
  )
}
