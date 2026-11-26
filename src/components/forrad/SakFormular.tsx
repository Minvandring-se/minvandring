import { Check } from 'lucide-react'
import { Kategoriikon } from '@/components/forrad/Kategoriikon'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  KATEGORIER,
  MAX_ANTAL,
  MAX_NAMN,
  MAX_NOTERING,
  TYPVAL,
  faltFran,
  kategoriFor,
  medKategori,
  medUnderkategori,
  tolkaSak,
  typEfterVal,
  type Forval,
  type SakFalt,
} from '@/lib/forrad'
import { konEtikett, storlekarFor, storlekHjalp, viktstorlek } from '@/lib/kladstorlek'
import { arKlader } from '@/lib/produktegenskaper'
import { supabase } from '@/lib/supabase'
import type { Forradssak } from '@/lib/typer'
import { tolkaVikt, visaTolkning } from '@/lib/viktfalt'
import { cn } from '@/lib/utils'

interface Props {
  /** Saken som ändras. Utelämnas för en ny sak. */
  sak?: Forradssak
  /** Förvalt namn, kategori och underkategori för en ny sak. */
  forval?: Forval
  /** Efter att saken sparats eller tagits bort. En ny sak skickar med sitt id. */
  onKlar: (nySakId?: string) => void
  onAvbryt: () => void
}

/** Ett val som ser ut som en knapp men är en radioknapp eller kryssruta, så att det går att nå med tangentbord och skärmläsare. */
// Valt alternativ syns med mer än färg: en tjockare kant (ring inåt, så att inget flyttar sig).
// På vald kategori byts ikonen också mot en bock i samma storlek, så att inget ändrar storlek när man väljer.
const valbarKlass =
  'group flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card font-medium transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary has-checked:ring-1 has-checked:ring-primary has-checked:ring-inset has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring'
/** Formuläret för en sak i förrådet: lägga till en egen sak, eller ändra och ta bort en som finns. */
export function SakFormular({ sak, forval, onKlar, onAvbryt }: Props) {
  const id = useId()
  const namnFalt = useRef<HTMLInputElement>(null)
  const [falt, setFalt] = useState<SakFalt>(() => faltFran(sak, forval))
  const [arbetar, setArbetar] = useState(false)
  const [fel, setFel] = useState('')
  // Storleken går att välja för kläder ur katalogen, där appen vet vilken storlek vikten gäller.
  const plagg = sak?.produkter && arKlader(sak.produkter.underkategori) ? sak.produkter : null
  const [storlek, setStorlek] = useState(sak?.storlek ?? '')

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
    // Id:t läses tillbaka, så att förrådet kan säga till om ett filter döljer en ny sak.
    const { data, error } = sak
      ? await supabase
          .from('forradssaker')
          .update(plagg ? { ...tolkad.varden, storlek: storlek || null } : tolkad.varden)
          .eq('id', sak.id)
          .select('id')
      : // En sak från katalogen sparas med sin produkt, som när man väljer produkten i Lägg till utrustning.
        await supabase
          .from('forradssaker')
          .insert({ ...tolkad.varden, produkt_id: forval?.produkt_id ?? null })
          .select('id')
    setArbetar(false)
    if (error) {
      setFel('Det gick inte att spara. Kontrollera uppkopplingen och försök igen.')
      return
    }
    onKlar(sak ? undefined : (data?.[0]?.id as string | undefined))
  }

  async function taBort() {
    if (!supabase || !sak) return
    if (!window.confirm(`Ta bort ${sak.namn} ur ditt förråd?`)) return
    setArbetar(true)
    setFel('')
    const { error } = await supabase.from('forradssaker').delete().eq('id', sak.id)
    setArbetar(false)
    if (error) {
      setFel('Det gick inte att ta bort. Kontrollera uppkopplingen och försök igen.')
      return
    }
    onKlar()
  }

  const under = falt.kategori ? kategoriFor(falt.kategori).under : []
  const vikt = tolkaVikt(falt.vikt)
  const viktfel = vikt.ok ? null : vikt.fel

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
          {KATEGORIER.map(({ nyckel, etikett }) => (
            <label key={nyckel} className={cn(valbarKlass, 'min-h-14 px-3 py-2 text-sm leading-tight')}>
              <input
                type="radio"
                name={`${id}-kategori`}
                className="sr-only"
                checked={falt.kategori === nyckel}
                onChange={() => setFalt((f) => medKategori(f, nyckel))}
              />
              <Kategoriikon kategori={nyckel} storlek={24} className="group-has-checked:hidden" />
              <Check className="hidden size-5 shrink-0 group-has-checked:block" aria-hidden />
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
            Vikt per styck
          </label>
          {/* Vanligt tangentbord, så att det går att skriva kg. Siffror utan enhet är gram. */}
          <Input
            id={`${id}-vikt`}
            autoComplete="off"
            placeholder="1250 eller 1,25 kg"
            maxLength={14}
            value={falt.vikt}
            aria-invalid={viktfel !== null}
            aria-describedby={`${id}-vikthjalp`}
            onChange={(e) => andra('vikt', e.target.value)}
          />
          {/* Tolkningen visas medan man skriver, så att man ser vad som sparas. */}
          <p id={`${id}-vikthjalp`} aria-live="polite" className={cn('min-h-5 text-sm', viktfel ? 'text-destructive' : 'text-muted-foreground')}>
            {viktfel ?? visaTolkning(falt.vikt) ?? 'Gram, eller kilo med kg.'}
          </p>
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

      {plagg && (
        <div className="space-y-1">
          <label htmlFor={`${id}-storlek`} className="block text-sm font-medium">
            Din storlek <span className="font-normal text-muted-foreground">(frivillig)</span>
          </label>
          <Select id={`${id}-storlek`} value={storlek} aria-describedby={`${id}-storlekhjalp`} onChange={(e) => setStorlek(e.target.value)}>
            <option value="">Ingen storlek</option>
            {/* En storlek som sparats men inte finns i listan visas ändå, så att den inte försvinner. */}
            {[...new Set([...storlekarFor(viktstorlek(plagg.egenskaper), konEtikett(plagg.egenskaper)), ...(sak?.storlek ? [sak.storlek] : [])])].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <p id={`${id}-storlekhjalp`} aria-live="polite" className="text-sm text-muted-foreground">
            {storlekHjalp(viktstorlek(plagg.egenskaper), storlek || null)}
          </p>
        </div>
      )}

      {/* Två kryssrutor som utesluter varandra. Ingen ikryssad betyder att saken ligger i ryggsäcken. */}
      <div className="space-y-1">
        {TYPVAL.map((v) => (
          <label key={v.typ} className="flex min-h-11 cursor-pointer items-center gap-3 py-1">
            <input
              type="checkbox"
              className="size-5 shrink-0 accent-primary"
              checked={falt.typ === v.typ}
              aria-describedby={`${id}-${v.typ}`}
              onChange={(e) => andra('typ', typEfterVal(v.typ, e.target.checked))}
            />
            <span>
              <span className="block text-sm font-medium">{v.etikett}</span>
              <span id={`${id}-${v.typ}`} className="block text-sm text-muted-foreground">
                {v.hjalp}
              </span>
            </span>
          </label>
        ))}
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
