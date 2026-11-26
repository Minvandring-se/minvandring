import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sektion } from '@/components/ui/sektion'
import { Select } from '@/components/ui/select'
import { andraUppgift, bockaUppgift, laggTillUppgift, taBortUppgift, useUppgifter, type NyUppgift } from '@/hooks/useUppgifter'
import { lokaltDatum } from '@/lib/turlista'
import type { DeltagareRad } from '@/lib/typer'
import { UPPGIFT_MAX, forslagSomSaknas, narText, sorteraUppgifter, tolkaUppgift, type Uppgift } from '@/lib/uppgifter'
import { cn } from '@/lib/utils'

const FEL = 'Det gick inte att uppdatera uppgifterna. Kontrollera uppkopplingen och försök igen.'

/**
 * Att göra i gruppen: det som ska fixas före avfärd, med vem som gör det och när. Alla i turen ser listan. Ägare och
 * redigerare lägger till, ändrar och tar bort, och den som är ansvarig, även en läsare, bockar av sin egen uppgift.
 */
export function AttGoraITuren({
  turId,
  deltagare,
  mittId,
  kanAndra,
  className,
}: {
  turId: string
  deltagare: readonly DeltagareRad[]
  mittId: string | null
  kanAndra: boolean
  className?: string
}) {
  const { lage, laddaOm } = useUppgifter(turId)
  const [formular, setFormular] = useState<'ny' | string | null>(null)
  const [fel, setFel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)
  const personer = deltagare.filter((d) => d.typ === 'person')
  const namn = new Map(deltagare.map((d) => [d.id, d.id === mittId ? `${d.namn} (du)` : d.namn]))
  const idag = lokaltDatum()

  async function gor(atgard: () => Promise<boolean>): Promise<boolean> {
    setFel(null)
    setSparar(true)
    const ok = await atgard()
    setSparar(false)
    if (ok) await laddaOm()
    else setFel(FEL)
    return ok
  }

  const uppgifter = lage.lage === 'klar' ? sorteraUppgifter(lage.uppgifter) : []
  const sist = lage.lage === 'klar' ? Math.max(0, ...lage.uppgifter.map((u) => u.sortering)) : 0
  const forslag = lage.lage === 'klar' && kanAndra ? forslagSomSaknas(lage.uppgifter) : []
  const kvar = uppgifter.filter((u) => !u.klar).length

  return (
    <Sektion
      rubrik="Att göra i gruppen"
      className={className}
      atgard={
        kanAndra && formular !== 'ny' ? (
          <Button variant="outline" onClick={() => setFormular('ny')}>
            <Plus className="size-4" aria-hidden />
            Ny uppgift
          </Button>
        ) : undefined
      }
    >
      {lage.lage === 'laddar' && (
        <Laddar text="Hämtar uppgifterna">
          <Skelett className="h-11 rounded-lg" />
        </Laddar>
      )}
      {lage.lage === 'fel' && <Laddfel vad="uppgifterna" onForsokIgen={laddaOm} />}

      {formular === 'ny' && (
        <Uppgiftsformular
          personer={personer}
          sparar={sparar}
          onAvbryt={() => setFormular(null)}
          onSpara={async (ny) => {
            const ok = await gor(() => laggTillUppgift(turId, ny, sist + 1))
            if (ok) setFormular(null)
          }}
        />
      )}

      {lage.lage === 'klar' && uppgifter.length === 0 && formular !== 'ny' && (
        <p className="text-sm text-muted-foreground">
          {kanAndra ? 'Inga uppgifter än. Fördela det som ska fixas före avfärd, till exempel att boka stugor.' : 'Inga uppgifter än.'}
        </p>
      )}

      {uppgifter.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {kvar === 0 ? 'Allt är klart.' : kvar === 1 ? '1 uppgift kvar.' : `${kvar} uppgifter kvar.`}
          </p>
          <ul className="divide-y divide-border">
            {uppgifter.map((u) =>
              formular === u.id ? (
                <li key={u.id} className="py-3">
                  <Uppgiftsformular
                    uppgift={u}
                    personer={personer}
                    sparar={sparar}
                    onAvbryt={() => setFormular(null)}
                    onSpara={async (andring) => {
                      const ok = await gor(() => andraUppgift(u.id, andring))
                      if (ok) setFormular(null)
                    }}
                  />
                </li>
              ) : (
                <Uppgiftsrad
                  key={u.id}
                  uppgift={u}
                  ansvarig={u.ansvarig ? (namn.get(u.ansvarig) ?? null) : null}
                  nar={narText(u, idag)}
                  kanBocka={kanAndra || (mittId !== null && u.ansvarig === mittId)}
                  kanAndra={kanAndra}
                  sparar={sparar}
                  onBocka={(klar) => gor(() => (kanAndra ? andraUppgift(u.id, { klar }) : bockaUppgift(u.id, klar)))}
                  onAndra={() => setFormular(u.id)}
                  onTaBort={() => {
                    if (window.confirm(`Ta bort uppgiften ”${u.text}”?`)) void gor(() => taBortUppgift(u.id))
                  }}
                />
              ),
            )}
          </ul>
        </>
      )}

      {forslag.length > 0 && formular === null && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Förslag:</span>
          {forslag.map((f) => (
            <Button key={f} variant="outline" disabled={sparar} onClick={() => gor(() => laggTillUppgift(turId, { text: f, ansvarig: null, klart_till: null }, sist + 1))}>
              <Plus className="size-4 text-hjortron-ikon" aria-hidden />
              {f}
            </Button>
          ))}
        </div>
      )}

      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}
    </Sektion>
  )
}

function Uppgiftsrad({
  uppgift,
  ansvarig,
  nar,
  kanBocka,
  kanAndra,
  sparar,
  onBocka,
  onAndra,
  onTaBort,
}: {
  uppgift: Uppgift
  ansvarig: string | null
  nar: { text: string; bradskar: boolean } | null
  kanBocka: boolean
  kanAndra: boolean
  sparar: boolean
  onBocka: (klar: boolean) => void
  onAndra: () => void
  onTaBort: () => void
}) {
  const id = useId()
  return (
    <li className="flex items-start gap-3 py-2">
      <input
        id={id}
        type="checkbox"
        checked={uppgift.klar}
        disabled={!kanBocka || sparar}
        onChange={(e) => onBocka(e.target.checked)}
        className="mt-3 size-5 shrink-0 accent-primary disabled:opacity-60"
      />
      <label htmlFor={id} className="min-h-11 min-w-0 flex-1 py-2">
        <span className={cn('block break-words', uppgift.klar ? 'text-muted-foreground line-through' : 'font-medium')}>{uppgift.text}</span>
        <span className="block text-sm text-muted-foreground">
          {ansvarig ?? 'Ingen ansvarig'}
          {nar && (
            <>
              {' · '}
              <span className={cn(nar.bradskar && 'font-semibold text-accent-strong')}>{nar.text}</span>
            </>
          )}
        </span>
      </label>
      {kanAndra && (
        <>
          <Button variant="ghost" size="ikon" aria-label={`Ändra ${uppgift.text}`} onClick={onAndra}>
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="ikon" aria-label={`Ta bort ${uppgift.text}`} onClick={onTaBort}>
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </>
      )}
    </li>
  )
}

function Uppgiftsformular({
  uppgift,
  personer,
  sparar,
  onSpara,
  onAvbryt,
}: {
  uppgift?: Uppgift
  personer: readonly DeltagareRad[]
  sparar: boolean
  onSpara: (u: NyUppgift) => void
  onAvbryt: () => void
}) {
  const id = useId()
  const [text, setText] = useState(uppgift?.text ?? '')
  const [ansvarig, setAnsvarig] = useState(uppgift?.ansvarig ?? '')
  const [datum, setDatum] = useState(uppgift?.klart_till ?? '')
  const [fel, setFel] = useState<string | null>(null)

  function spara(e: FormEvent) {
    e.preventDefault()
    const t = tolkaUppgift(text)
    if ('fel' in t) return setFel(t.fel)
    setFel(null)
    onSpara({ text: t.text, ansvarig: ansvarig || null, klart_till: datum || null })
  }

  return (
    <form onSubmit={spara} noValidate className="space-y-3 rounded-lg border border-border p-3">
      <div className="space-y-1">
        <label htmlFor={`${id}-text`} className="block text-sm font-medium">
          Vad ska göras?
        </label>
        <Input
          id={`${id}-text`}
          value={text}
          maxLength={UPPGIFT_MAX}
          onChange={(e) => setText(e.target.value)}
          placeholder="Till exempel boka nattåget"
          aria-invalid={fel ? true : undefined}
          aria-describedby={fel ? `${id}-fel` : undefined}
          autoFocus
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`${id}-vem`} className="block text-sm font-medium">
            Vem gör det?
          </label>
          <Select id={`${id}-vem`} value={ansvarig} onChange={(e) => setAnsvarig(e.target.value)}>
            <option value="">Ingen än</option>
            {personer.map((p) => (
              <option key={p.id} value={p.id}>
                {p.namn}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-datum`} className="block text-sm font-medium">
            Klart senast (frivilligt)
          </label>
          <Input id={`${id}-datum`} type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
        </div>
      </div>
      {fel && (
        <p id={`${id}-fel`} role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={sparar}>
          {sparar ? 'Sparar …' : uppgift ? 'Spara' : 'Lägg till'}
        </Button>
        <Button type="button" variant="ghost" onClick={onAvbryt}>
          Avbryt
        </Button>
      </div>
    </form>
  )
}
