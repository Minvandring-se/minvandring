import { Printer } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { TomtLage } from '@/components/app/TomtLage'
import { Initial } from '@/components/mat/Initial'
import { PasNamn } from '@/components/mat/PasNamn'
import type { Person } from '@/components/mat/RadPanel'
import { knappStil } from '@/components/ui/knappStil'
import { Sektion } from '@/components/ui/sektion'
import { Select } from '@/components/ui/select'
import { AVDELNINGAR } from '@/lib/handla'
import { handlagrupper, type Handlarad } from '@/lib/handlingslista'
import { bokadText, garUtFore, hemma, jamforDatum, kopText, ledigaHemma, manadOchAr } from '@/lib/skafferi'
import { lokaltDatum } from '@/lib/turlista'
import type { Skafferirad } from '@/lib/typer'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Inköpslistan: det var och en köper, grupperat per person och butiksavdelning, och det som ingen köper än sist.
 * Var och en köper det hen bär i Vem tar med vad. Ägare och redigerare bockar av åt alla och väljer avdelning för
 * varorna. Var och en, även en läsare, bockar av sitt eget. Det man har hemma i sitt skafferi står bara i ens egen
 * lista, eftersom skafferiet är privat.
 */
export function Inkopslista({
  rader,
  personer,
  farger,
  kanAndra,
  mittDeltagareId,
  skafferi,
  bokade = new Map(),
  avresa = null,
  utskrift,
  onBocka,
  onAvdelning,
}: {
  rader: readonly Handlarad[]
  personer: readonly Person[]
  farger: ReadonlyMap<string, string>
  kanAndra: boolean
  /** Den inloggades rad i turen. */
  mittDeltagareId: string | null
  /** Ens eget skafferi. */
  skafferi: readonly Skafferirad[]
  /** Påsar hemma som går till turer före den här. */
  bokade?: ReadonlyMap<string, number>
  /** Turens första dag. Bäst före jämförs med den, eller med i dag när turen saknar datum. */
  avresa?: string | null
  /** Adressen till utskriften. */
  utskrift: string
  onBocka: (rad: Handlarad, klart: boolean) => Promise<boolean>
  onAvdelning: (varaId: string, avdelning: string | null) => Promise<boolean>
}) {
  const [bara, setBara] = useState<'alla' | 'mitt'>('alla')
  const [andraAvdelning, setAndraAvdelning] = useState(false)
  const [fel, setFel] = useState(false)
  const visade = bara === 'mitt' && mittDeltagareId ? rader.filter((r) => r.kopare === mittDeltagareId) : rader
  const grupper = handlagrupper(
    visade,
    personer.map((p) => p.id),
  )
  const attKopa = rader.filter((r) => r.kopare !== null)
  const klara = attKopa.filter((r) => r.klart).length

  const idag = lokaltDatum()
  // En påse räknas som hemma om bäst före är på eller efter turens första dag, eller saknas.
  const iSkafferiet = ledigaHemma(hemma(skafferi, jamforDatum(avresa, idag)), bokade)
  /** Det ens eget skafferi säger om en påse man själv köper. */
  const skafferiFor = (r: Handlarad): { text: string | null; bastFore: string | null } | null => {
    if (r.typ !== 'pase' || !r.matproduktId || !mittDeltagareId || r.kopare !== mittDeltagareId) return null
    const rad = skafferi.find((s) => s.matprodukt_id === r.matproduktId)
    const text = [kopText(r.pasar ?? 0, iSkafferiet.get(r.matproduktId) ?? 0), bokadText(bokade.get(r.matproduktId) ?? 0)].filter(Boolean).join(' ') || null
    const bastFore = rad && garUtFore(rad.bast_fore, jamforDatum(avresa, idag)) ? `Går ut före turen (bäst före ${manadOchAr(rad.bast_fore!)})` : null
    return text || bastFore ? { text, bastFore } : null
  }

  async function gor(fn: () => Promise<boolean>) {
    setFel(!(await fn()))
  }

  return (
    <Sektion rubrik="Inköpslista" atgard={attKopa.length > 0 && <span className="text-sm text-muted-foreground tabular-nums">{klara} av {attKopa.length} klara</span>}>
      {rader.length === 0 ? (
        <TomtLage kompakt text="Listan fylls på när ni lägger rätter i matplanen." />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {mittDeltagareId && (
              <div role="group" aria-label="Visa" className="flex gap-2">
                {(
                  [
                    ['alla', 'Alla'],
                    ['mitt', 'Bara mitt'],
                  ] as const
                ).map(([varde, text]) => (
                  <button
                    key={varde}
                    type="button"
                    aria-pressed={bara === varde}
                    onClick={() => setBara(varde)}
                    className={cn(
                      'h-11 rounded-full border px-4 text-sm font-medium transition-colors',
                      fokus,
                      bara === varde ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted',
                    )}
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}
            <Link to={utskrift} className={cn(knappStil({ variant: 'outline' }), 'ml-auto')}>
              <Printer className="size-4" aria-hidden />
              Skriv ut
            </Link>
          </div>
          {kanAndra && (
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" checked={andraAvdelning} onChange={(e) => setAndraAvdelning(e.target.checked)} className="size-5 accent-primary" />
              Ändra butiksavdelning för varorna
            </label>
          )}
          {fel && (
            <p role="alert" className="text-sm text-destructive">
              Det gick inte att spara. Kontrollera uppkopplingen och försök igen.
            </p>
          )}
          {grupper.length === 0 && <p className="text-muted-foreground">Du köper inget än. Välj en rätt som du bär i ”Vem tar med vad”.</p>}
          {grupper.map((g) => {
            const person = personer.find((p) => p.id === g.kopare)
            const namn = g.kopare === null ? 'Ingen köper än' : (person?.namn ?? 'Inte längre med i turen')
            return (
              <div key={g.kopare ?? 'ingen'} className="space-y-3">
                <h3 className={cn('flex items-center gap-3 text-base', g.kopare === null && 'text-accent-strong')}>
                  {g.kopare !== null && <Initial namn={namn} farg={farger.get(g.kopare)} className="size-8 text-sm" />}
                  <span className="min-w-0 wrap-anywhere">{g.kopare === mittDeltagareId ? `${namn} (du)` : namn}</span>
                </h3>
                {g.kopare === null && <p className="-mt-2 text-sm text-muted-foreground">Välj vem som bär rätterna i ”Vem tar med vad”, så hamnar varorna i hens lista.</p>}
                {g.avdelningar.map((a) => (
                  <div key={a.avdelning} className="space-y-0.5">
                    <h4 className="font-sans text-sm font-semibold text-muted-foreground">{AVDELNINGAR.find((x) => x.nyckel === a.avdelning)!.etikett}</h4>
                    <ul className="divide-y divide-border">
                      {a.rader.map((r) => (
                        <Rad
                          key={r.nyckel}
                          rad={r}
                          kanBocka={r.kopare !== null && (kanAndra || r.kopare === mittDeltagareId)}
                          skafferi={skafferiFor(r)}
                          andraAvdelning={andraAvdelning && kanAndra && r.typ === 'vara'}
                          onBocka={(klart) => gor(() => onBocka(r, klart))}
                          onAvdelning={(avd) => gor(() => onAvdelning(r.id, avd))}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </Sektion>
  )
}

/** En vara eller påse: bocken, namnet och mängden på en rad. */
function Rad({
  rad,
  kanBocka,
  skafferi,
  andraAvdelning,
  onBocka,
  onAvdelning,
}: {
  rad: Handlarad
  kanBocka: boolean
  skafferi: { text: string | null; bastFore: string | null } | null
  andraAvdelning: boolean
  onBocka: (klart: boolean) => void
  onAvdelning: (avdelning: string | null) => void
}) {
  const id = useId()
  const innehall = (
    <>
      <span className={cn('min-w-0 flex-1 break-words', rad.klart && 'text-muted-foreground line-through')}>
        {rad.pase ? <PasNamn marke={rad.pase.marke} namn={rad.pase.namn} /> : rad.namn}
        {rad.hemifran && <span className="text-sm text-muted-foreground"> (hemifrån)</span>}
      </span>
      {rad.mangd && <span className="shrink-0 text-sm tabular-nums">{rad.mangd}</span>}
    </>
  )
  return (
    <li className="py-0.5">
      {kanBocka ? (
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" checked={rad.klart} onChange={(e) => onBocka(e.target.checked)} className="size-5 shrink-0 accent-primary" />
          {innehall}
        </label>
      ) : (
        <p className={cn('flex min-h-11 items-center gap-3', rad.kopare !== null && 'pl-8')}>{innehall}</p>
      )}
      {skafferi && (
        <p className="pb-2 pl-8 text-sm">
          {skafferi.text && <span className="block font-medium text-primary">{skafferi.text}</span>}
          {skafferi.bastFore && <span className="block font-medium text-accent-strong">{skafferi.bastFore}</span>}
        </p>
      )}
      {andraAvdelning && (
        <div className="space-y-1 pb-2 pl-8">
          <label htmlFor={`${id}-avdelning`} className="block text-sm text-muted-foreground">
            Butiksavdelning för {rad.namn}
          </label>
          <Select id={`${id}-avdelning`} value={rad.avdelning} onChange={(e) => onAvdelning(e.target.value)}>
            {AVDELNINGAR.map((a) => (
              <option key={a.nyckel} value={a.nyckel}>
                {a.etikett}
              </option>
            ))}
          </Select>
        </div>
      )}
    </li>
  )
}
