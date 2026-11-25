import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import { Bricka } from '@/components/ui/bricka'
import { Input } from '@/components/ui/input'
import { useLivsmedelForslag, type Livsmedelsforslag } from '@/hooks/useLivsmedelForslag'
import { allergenetikett, uppraknade, type Allergen } from '@/lib/kost'
import { TILLSTAND_ETIKETT } from '@/lib/livsmedel'
import type { Vara } from '@/lib/typer'
import { cn } from '@/lib/utils'

/** En vara som redan finns i turen eller i ens recept. */
export type Varuforslag = Pick<Vara, 'namn' | 'kcal_per_100g' | 'protein_per_100g'>

type Alternativ = { typ: 'vara'; vara: Varuforslag } | { typ: 'livsmedel'; livsmedel: Livsmedelsforslag }

const MAX_VAROR = 3

/**
 * Fältet för en ingrediens med förslag medan man skriver: först varor som redan finns i turen eller i ens recept,
 * sedan baslivsmedel från Livsmedelsverket med tillstånd (torr, rå eller tillagad) och kcal per 100 g. Pilarna
 * flyttar i listan, Enter väljer och Esc stänger. Man kan alltid skriva en egen vara utan att välja något.
 */
export function IngrediensSok({
  id,
  varde,
  varor,
  onAndra,
  onValjVara,
  onValjLivsmedel,
}: {
  id: string
  varde: string
  varor: readonly Varuforslag[]
  onAndra: (text: string) => void
  onValjVara: (vara: Varuforslag) => void
  onValjLivsmedel: (livsmedel: Livsmedelsforslag) => void
}) {
  const listId = useId()
  const [oppen, setOppen] = useState(false)
  const [aktiv, setAktiv] = useState(-1)
  const livsmedel = useLivsmedelForslag(oppen ? varde : '')
  const sok = varde.trim().toLowerCase()
  const varuforslag = sok
    ? varor.filter((v) => v.namn.toLowerCase().includes(sok) && v.namn.toLowerCase() !== sok).slice(0, MAX_VAROR)
    : []
  const alternativ: Alternativ[] = [...varuforslag.map((vara) => ({ typ: 'vara' as const, vara })), ...livsmedel.map((l) => ({ typ: 'livsmedel' as const, livsmedel: l }))]
  const visas = oppen && alternativ.length > 0
  const aktivt = visas && aktiv >= 0 && aktiv < alternativ.length ? aktiv : -1

  function valj(a: Alternativ) {
    if (a.typ === 'vara') onValjVara(a.vara)
    else onValjLivsmedel(a.livsmedel)
    setOppen(false)
    setAktiv(-1)
  }

  function tangent(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!visas) return setOppen(true)
      e.preventDefault()
      const n = alternativ.length
      setAktiv((a) => (e.key === 'ArrowDown' ? (a + 1) % n : a <= 0 ? n - 1 : a - 1))
    } else if (e.key === 'Enter' && aktivt >= 0) {
      // Enter väljer förslaget i stället för att skicka formuläret.
      e.preventDefault()
      valj(alternativ[aktivt])
    } else if (e.key === 'Escape' && visas) {
      e.preventDefault()
      setOppen(false)
    }
  }

  const altId = (i: number) => `${listId}-${i}`

  // Det aktiva förslaget skrollas fram, så att det syns även längst ner i en panel som skrollar.
  useEffect(() => {
    if (aktivt >= 0) document.getElementById(altId(aktivt))?.scrollIntoView({ block: 'nearest' })
  })

  return (
    <div className="space-y-1.5">
      <Input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visas}
        aria-controls={listId}
        aria-activedescendant={aktivt >= 0 ? altId(aktivt) : undefined}
        autoComplete="off"
        value={varde}
        onChange={(e) => {
          onAndra(e.target.value)
          setOppen(true)
          setAktiv(-1)
        }}
        onFocus={() => setOppen(true)}
        onBlur={() => setOppen(false)}
        onKeyDown={tangent}
      />
      <div hidden={!visas} className="overflow-hidden rounded-knapp border border-border bg-card">
        <ul id={listId} role="listbox" aria-label="Förslag" className="divide-y divide-border">
          {alternativ.map((a, i) => (
            <li
              key={a.typ === 'vara' ? `v-${a.vara.namn}` : `l-${a.livsmedel.nummer}`}
              id={altId(i)}
              role="option"
              aria-selected={i === aktivt}
              // mousedown i stället för click, så att fältet inte hinner tappa fokus och stänga listan först.
              onMouseDown={(e) => {
                e.preventDefault()
                valj(a)
              }}
              onMouseEnter={() => setAktiv(i)}
              className={cn('flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 text-sm', i === aktivt && 'bg-primary-soft ring-2 ring-primary ring-inset')}
            >
              {a.typ === 'vara' ? <Rad namn={a.vara.namn} kcal={a.vara.kcal_per_100g} etikett="I turen" /> : <Rad namn={a.livsmedel.namn} kcal={a.livsmedel.kcal_per_100g} etikett={a.livsmedel.tillstand ? TILLSTAND_ETIKETT[a.livsmedel.tillstand] : null} allergener={a.livsmedel.allergener} />}
            </li>
          ))}
        </ul>
        {livsmedel.length > 0 && <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">Näringsvärden från Livsmedelsverket</p>}
      </div>
      {/* Antalet förslag läses upp när listan öppnas eller ändras, eftersom förslagen kommer efter en kort paus. */}
      <p className="sr-only" aria-live="polite">
        {visas ? `${alternativ.length} förslag` : ''}
      </p>
    </div>
  )
}

/** Ett förslag: namnet, tillståndet och kcal per 100 g, och för baslivsmedel de allergener som är kända. */
function Rad({ namn, kcal, etikett, allergener = null }: { namn: string; kcal: number | null; etikett: string | null; allergener?: readonly Allergen[] | null }) {
  return (
    <>
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="break-words">{namn}</span>
        {etikett && <Bricka>{etikett}</Bricka>}
        {allergener && allergener.length > 0 && (
          <span className="block w-full text-xs text-muted-foreground">Innehåller {uppraknade(allergener.map((a) => allergenetikett(a).toLowerCase()))}</span>
        )}
      </span>
      {kcal !== null && (
        <span className="shrink-0 text-muted-foreground tabular-nums">
          {kcal} kcal per 100 g
        </span>
      )}
    </>
  )
}
