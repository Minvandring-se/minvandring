import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  KATEGORIER,
  MAX_ANTAL,
  MAX_NAMN,
  MAX_NOTERING,
  MAX_VIKT_G,
  TYPNAMN,
  faltFran,
  kategoriFor,
  medKategori,
  medUnderkategori,
  tolkaSak,
  type KategoriNyckel,
  type SakFalt,
  type UnderkategoriNyckel,
} from '@/lib/forrad'
import { supabase } from '@/lib/supabase'
import type { Forradssak } from '@/lib/typer'
import type { Typ } from '@/lib/vikt'
import { cn } from '@/lib/utils'

export interface Forval {
  kategori: KategoriNyckel
  underkategori?: UnderkategoriNyckel
}

interface Props {
  /** Saken som ändras. Utelämnas för en ny sak. */
  sak?: Forradssak
  /** Förvald kategori och underkategori för en ny sak. */
  forval?: Forval
  onKlar: () => void
  onAvbryt: () => void
}

const valKlass =
  'h-11 w-full rounded-md border border-border bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20'

/** Ett val som ser ut som en knapp men är en radioknapp eller kryssruta, så att det går att nå med tangentbord och skärmläsare. */
const valbarKlass =
  'flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card font-medium transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring'

/** Formuläret för en sak i förrådet: lägga till en egen sak, eller ändra och ta bort en som finns. */
export function SakFormular({ sak, forval, onKlar, onAvbryt }: Props) {
  const id = useId()
  const namnFalt = useRef<HTMLInputElement>(null)
  const [falt, setFalt] = useState<SakFalt>(() => faltFran(sak, forval))
  const [arbetar, setArbetar] = useState(false)
  const [fel, setFel] = useState('')

  useEffect(() => namnFalt.current?.focus(), [])

  function andra(nyckel: keyof SakFalt, varde: string) {
    setFalt((f) => ({ ...f, [nyckel]: varde }))
  }

  async function spara(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    const tolkad = tolkaSak(falt)
    if (!tolkad.ok) {
      setFel(tolkad.fel)
      return
    }
    setArbetar(true)
    setFel('')
    const { error } = sak
      ? await supabase.from('forradssaker').update(tolkad.varden).eq('id', sak.id)
      : await supabase.from('forradssaker').insert(tolkad.varden)
    setArbetar(false)
    if (error) {
      setFel('Det gick inte att spara. Försök igen.')
      return
    }
    onKlar()
  }

  async function taBort() {
    if (!supabase || !sak) return
    if (!window.confirm(`Ta bort ${sak.namn} ur ditt förråd?`)) return
    setArbetar(true)
    setFel('')
    const { error } = await supabase.from('forradssaker').delete().eq('id', sak.id)
    setArbetar(false)
    if (error) {
      setFel('Det gick inte att ta bort. Försök igen.')
      return
    }
    onKlar()
  }

  const under = falt.kategori ? kategoriFor(falt.kategori).under : []

  return (
    <form onSubmit={spara} noValidate className="space-y-5 rounded-lg border border-border bg-card p-5 shadow-soft sm:p-6">
      <h2 className="text-xl">{sak ? 'Ändra saken' : 'Lägg till en sak'}</h2>

      <div className="space-y-1">
        <label htmlFor={`${id}-namn`} className="block text-sm font-medium">
          Vad är det?
        </label>
        <Input
          id={`${id}-namn`}
          ref={namnFalt}
          maxLength={MAX_NAMN}
          placeholder="T.ex. märke och modell"
          value={falt.namn}
          onChange={(e) => andra('namn', e.target.value)}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Kategori</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {KATEGORIER.map(({ nyckel, etikett, ikon: Ikon }) => (
            <label key={nyckel} className={cn(valbarKlass, 'min-h-14 px-3 py-2 text-sm leading-tight')}>
              <input
                type="radio"
                name={`${id}-kategori`}
                className="sr-only"
                checked={falt.kategori === nyckel}
                onChange={() => setFalt((f) => medKategori(f, nyckel))}
              />
              <Ikon className="size-5 shrink-0" aria-hidden />
              {etikett}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Visas först när en huvudkategori är vald. Ett tryck till på den valda tar bort valet. */}
      {under.length > 1 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Vilken sorts sak? <span className="font-normal text-muted-foreground">(frivilligt)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {under.map((u) => (
              <label key={u.nyckel} className={cn(valbarKlass, 'min-h-11 rounded-full px-4 text-sm')}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={falt.underkategori === u.nyckel}
                  onChange={(e) => setFalt((f) => medUnderkategori(f, e.target.checked ? u.nyckel : ''))}
                />
                {u.etikett}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor={`${id}-vikt`} className="block text-sm font-medium">
            Vikt per styck (gram)
          </label>
          <Input
            id={`${id}-vikt`}
            inputMode="numeric"
            placeholder="T.ex. 1250"
            maxLength={String(MAX_VIKT_G).length}
            value={falt.vikt}
            onChange={(e) => andra('vikt', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-antal`} className="block text-sm font-medium">
            Antal
          </label>
          <Input
            id={`${id}-antal`}
            inputMode="numeric"
            maxLength={String(MAX_ANTAL).length}
            value={falt.antal}
            onChange={(e) => andra('antal', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor={`${id}-typ`} className="block text-sm font-medium">
          Var bärs den?
        </label>
        <select id={`${id}-typ`} className={valKlass} value={falt.typ} onChange={(e) => andra('typ', e.target.value)}>
          {(Object.keys(TYPNAMN) as Typ[]).map((t) => (
            <option key={t} value={t}>
              {TYPNAMN[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor={`${id}-notering`} className="block text-sm font-medium">
          Anteckning <span className="font-normal text-muted-foreground">(frivillig)</span>
        </label>
        <Input id={`${id}-notering`} maxLength={MAX_NOTERING} value={falt.notering} onChange={(e) => andra('notering', e.target.value)} />
      </div>

      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={arbetar}>
          {arbetar ? 'Sparar …' : sak ? 'Spara' : 'Lägg till'}
        </Button>
        <Button type="button" variant="outline" disabled={arbetar} onClick={onAvbryt}>
          Avbryt
        </Button>
        {sak && (
          <Button type="button" variant="ghost" disabled={arbetar} className="ml-auto text-destructive" onClick={taBort}>
            Ta bort
          </Button>
        )}
      </div>
    </form>
  )
}
