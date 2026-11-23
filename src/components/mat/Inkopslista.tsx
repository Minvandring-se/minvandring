import { useId, useState } from 'react'
import { Select } from '@/components/ui/select'
import { Sektion } from '@/components/ui/sektion'
import { formateraVikt } from '@/lib/forrad'
import { inkopsgrupper, type Inkopsrad } from '@/lib/mat'
import type { DeltagareRad } from '@/lib/typer'
import { cn } from '@/lib/utils'

type Andring = { ansvarig?: string | null; klart?: boolean; varifran?: 'kopa' | 'hemifran' }

/** Mängden som den visas: "1,2 kg" för varor, "3 påsar, 900 g" för påsar. */
function mangd(r: Inkopsrad): string {
  if (r.typ === 'vara') return formateraVikt(r.gram)
  return `${r.pasar === 1 ? '1 påse' : `${r.pasar} påsar`}, ${formateraVikt(r.gram)}`
}

/**
 * Inköpslistan för hela turen: det som ska köpas, grupperat per ansvarig, och det som tas hemifrån.
 * Ägare och redigerare bockar av, väljer ansvarig och flyttar varor mellan köpa och hemifrån. Läsare ser listan.
 */
export function Inkopslista({
  rader,
  deltagare,
  kanAndra,
  onAndra,
}: {
  rader: readonly Inkopsrad[]
  deltagare: readonly DeltagareRad[]
  kanAndra: boolean
  onAndra: (rad: Inkopsrad, andring: Andring) => Promise<boolean>
}) {
  const [fel, setFel] = useState(false)
  const personer = deltagare.filter((d) => d.typ === 'person')
  const { attKopa, hemifran } = inkopsgrupper(
    rader,
    personer.map((d) => d.id),
  )
  const klara = rader.filter((r) => r.klart).length
  const namnFor = (id: string | null) => (id === null ? 'Ingen ansvarig' : (deltagare.find((d) => d.id === id)?.namn ?? 'Inte längre med i turen'))

  async function andra(rad: Inkopsrad, andring: Andring) {
    setFel(!(await onAndra(rad, andring)))
  }

  return (
    <Sektion
      rubrik="Inköpslista"
      atgard={rader.length > 0 && <span className="text-sm text-muted-foreground tabular-nums">{klara} av {rader.length} klara</span>}
    >
      {rader.length === 0 ? (
        <p className="text-muted-foreground">Listan fylls på när ni lägger rätter i matplanen.</p>
      ) : (
        <div className="space-y-5">
          {fel && (
            <p role="alert" className="text-sm text-destructive">
              Det gick inte att spara ändringen. Kontrollera uppkopplingen och försök igen.
            </p>
          )}
          {attKopa.map((g) => (
            <Grupp key={g.ansvarig ?? 'ingen'} rubrik={namnFor(g.ansvarig)} saknas={g.ansvarig === null} rader={g.rader} personer={personer} kanAndra={kanAndra} onAndra={andra} />
          ))}
          {hemifran.length > 0 && <Grupp rubrik="Tas hemifrån" rader={hemifran} personer={personer} kanAndra={kanAndra} onAndra={andra} />}
        </div>
      )}
    </Sektion>
  )
}

function Grupp({
  rubrik,
  saknas = false,
  rader,
  personer,
  kanAndra,
  onAndra,
}: {
  rubrik: string
  /** Det som ingen ansvarar för. Rubriken står i rost. */
  saknas?: boolean
  rader: readonly Inkopsrad[]
  personer: readonly DeltagareRad[]
  kanAndra: boolean
  onAndra: (rad: Inkopsrad, andring: Andring) => void
}) {
  return (
    <div className="space-y-1">
      <h3 className={cn('text-base', saknas && 'text-accent-strong')}>{rubrik}</h3>
      <ul className="divide-y divide-border">
        {rader.map((r) => (
          <Rad key={`${r.typ}-${r.id}`} rad={r} personer={personer} kanAndra={kanAndra} onAndra={(a) => onAndra(r, a)} />
        ))}
      </ul>
    </div>
  )
}

function Rad({ rad, personer, kanAndra, onAndra }: { rad: Inkopsrad; personer: readonly DeltagareRad[]; kanAndra: boolean; onAndra: (a: Andring) => void }) {
  const id = useId()
  return (
    <li className="space-y-2 py-2">
      <label className={cn('flex min-h-11 items-center gap-3', kanAndra && 'cursor-pointer')}>
        <input
          type="checkbox"
          checked={rad.klart}
          disabled={!kanAndra}
          onChange={(e) => onAndra({ klart: e.target.checked })}
          className="size-5 shrink-0 accent-primary"
        />
        <span className={cn('min-w-0 flex-1 break-words', rad.klart && 'text-muted-foreground line-through')}>{rad.namn}</span>
        <span className="shrink-0 text-sm tabular-nums">{mangd(rad)}</span>
      </label>
      {kanAndra && (
        <div className="grid grid-cols-2 gap-2 pl-8">
          <div className="min-w-0 space-y-1">
            <label htmlFor={`${id}-ansvarig`} className="block text-xs text-muted-foreground">
              Ansvarig
            </label>
            <Select id={`${id}-ansvarig`} value={rad.ansvarig ?? ''} onChange={(e) => onAndra({ ansvarig: e.target.value || null })}>
              <option value="">Ingen</option>
              {personer.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.namn}
                </option>
              ))}
            </Select>
          </div>
          {rad.typ === 'vara' && (
            <div className="min-w-0 space-y-1">
              <label htmlFor={`${id}-varifran`} className="block text-xs text-muted-foreground">
                Varifrån
              </label>
              <Select id={`${id}-varifran`} value={rad.varifran} onChange={(e) => onAndra({ varifran: e.target.value as 'kopa' | 'hemifran' })}>
                <option value="kopa">Köpa</option>
                <option value="hemifran">Hemifrån</option>
              </Select>
            </div>
          )}
        </div>
      )}
    </li>
  )
}
