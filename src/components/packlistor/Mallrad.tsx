import { Pencil, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formateraVikt } from '@/lib/forrad'
import { MALLVEM_TEXT, mallvem, visadVikt, visatNamn, type Mallvem, type Packmallrad } from '@/lib/packmallar'
import { tolkaVikt, visaTolkning } from '@/lib/viktfalt'

export interface Mallandring {
  namn: string
  antal: number
  vikt_g: number | null
  vem: Mallvem
}

/**
 * En rad i en mall, som en rad i turens packlista: antal, namn, vikt och vem som tar med den. I en egen mall går raden
 * att ändra och ta bort.
 */
export function Mallrad({
  rad,
  redigerbar,
  sparar,
  onAndra,
  onTaBort,
}: {
  rad: Packmallrad
  redigerbar: boolean
  sparar: boolean
  onAndra?: (andring: Mallandring) => Promise<boolean>
  onTaBort?: () => void
}) {
  const [lage, setLage] = useState<'visa' | 'andra' | 'fraga'>('visa')
  const vikt = visadVikt(rad)

  if (lage === 'andra' && onAndra)
    return (
      <li className="py-2">
        <Andra rad={rad} sparar={sparar} onAvbryt={() => setLage('visa')} onSpara={async (a) => (await onAndra(a)) && setLage('visa')} />
      </li>
    )

  return (
    <li className="space-y-1 py-2">
      <div className="flex min-h-11 items-center gap-2">
        <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
          <span className="line-clamp-2 min-w-0 [overflow-wrap:normal]">
            {rad.antal > 1 && `${rad.antal} × `}
            {rad.namn.replaceAll('-', '‑')}
          </span>
          <span className="shrink-0 text-sm tabular-nums">{vikt === null ? 'Ingen vikt' : formateraVikt(vikt * Math.max(1, rad.antal))}</span>
        </span>
        {redigerbar && lage === 'visa' && (
          <>
            <Button variant="ghost" size="ikon" aria-label={`Ändra ${rad.namn}`} className="text-muted-foreground" onClick={() => setLage('andra')}>
              <Pencil className="size-4" aria-hidden />
            </Button>
            <Button variant="ghost" size="ikon" aria-label={`Ta bort ${rad.namn}`} className="text-muted-foreground" onClick={() => setLage('fraga')}>
              <X className="size-4" aria-hidden />
            </Button>
          </>
        )}
      </div>
      {rad.egen_namn && <p className="text-sm break-words">Din modell: {visatNamn(rad)}</p>}
      <p className="text-sm text-muted-foreground">{MALLVEM_TEXT[mallvem(rad)]}</p>
      {lage === 'fraga' && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-sm font-medium">Ta bort ur packlistan?</span>
          <Button variant="outline" className="text-destructive" disabled={sparar} onClick={onTaBort}>
            Ta bort
            <span className="sr-only"> {rad.namn}</span>
          </Button>
          <Button variant="ghost" onClick={() => setLage('visa')}>
            Avbryt
          </Button>
        </div>
      )}
    </li>
  )
}

function Andra({ rad, sparar, onSpara, onAvbryt }: { rad: Packmallrad; sparar: boolean; onSpara: (a: Mallandring) => void; onAvbryt: () => void }) {
  const id = useId()
  const [namn, setNamn] = useState(rad.namn)
  const [antal, setAntal] = useState(String(rad.antal))
  const [vikt, setVikt] = useState(rad.vikt_g === null ? '' : String(rad.vikt_g))
  const [vem, setVem] = useState<Mallvem>(mallvem(rad))
  const [fel, setFel] = useState<string | null>(null)
  const tolkning = visaTolkning(vikt)

  function spara(e: FormEvent) {
    e.preventDefault()
    const n = namn.trim()
    if (!n) return setFel('Skriv vad saken heter.')
    if (n.length > 120) return setFel('Namnet får vara högst 120 tecken.')
    const a = Number(antal)
    if (!Number.isInteger(a) || a < 1 || a > 999) return setFel('Antal ska vara ett heltal från 1 till 999.')
    const v = tolkaVikt(vikt)
    if (!v.ok) return setFel(v.fel)
    setFel(null)
    onSpara({ namn: n, antal: a, vikt_g: v.g, vem })
  }

  return (
    <form onSubmit={spara} noValidate className="space-y-3 rounded-lg border border-border p-3">
      <div className="space-y-1">
        <label htmlFor={`${id}-namn`} className="block text-sm font-medium">
          Namn
        </label>
        <Input id={`${id}-namn`} value={namn} maxLength={120} onChange={(e) => setNamn(e.target.value)} autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor={`${id}-antal`} className="block text-sm font-medium">
            Antal
          </label>
          <Input id={`${id}-antal`} value={antal} inputMode="numeric" onChange={(e) => setAntal(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-vikt`} className="block text-sm font-medium">
            Vikt per styck
          </label>
          <Input id={`${id}-vikt`} value={vikt} inputMode="decimal" placeholder="g eller kg" onChange={(e) => setVikt(e.target.value)} aria-describedby={`${id}-tolkning`} />
        </div>
      </div>
      {tolkning && (
        <p id={`${id}-tolkning`} className="text-sm text-muted-foreground">
          {tolkning}
        </p>
      )}
      <div className="space-y-1">
        <label htmlFor={`${id}-vem`} className="block text-sm font-medium">
          Vem tar med den?
        </label>
        <Select id={`${id}-vem`} value={vem} onChange={(e) => setVem(e.target.value as Mallvem)}>
          <option value="jag">Du</option>
          <option value="gemensam">Gemensam, en person bär den</option>
          <option value="alla">Alla har var sin</option>
        </Select>
      </div>
      {rad.egen_namn && vem !== 'alla' && <p className="text-sm text-muted-foreground">Din modell ({rad.egen_namn}) tas bort när raden inte längre är något som alla har var sin av.</p>}
      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={sparar}>
          {sparar ? 'Sparar …' : 'Spara'}
        </Button>
        <Button type="button" variant="ghost" onClick={onAvbryt}>
          Avbryt
        </Button>
      </div>
    </form>
  )
}
