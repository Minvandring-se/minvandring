import { ChevronDown, Lock } from 'lucide-react'
import { Ikon } from '@/components/ikoner/Ikon'
import { useId, useState, type FormEvent } from 'react'
import { Bricka } from '@/components/ui/bricka'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { ALLERGENER, KOSTVAL, kostsvar, kostsvarText, SAMTYCKE, uppraknade, type Allergen, type Kostval } from '@/lib/kost'
import { kanAndraKostbehov } from '@/lib/roller'
import type { DeltagareRad, Kostbehov as Behovsrad } from '@/lib/typer'
import { cn } from '@/lib/utils'

type Behovsval = Omit<Behovsrad, 'samtycke_tid'>

const TOMT: Omit<Behovsval, 'deltagare_id'> = { vegetarisk: false, vegansk: false, glutenfri: false, laktosfri: false, utan: [] }

/**
 * Kostbehoven i gruppen som en kompakt rad ovanför måltiderna: de kostbehov som finns syns direkt, och raden går att
 * öppna för alla personer och för att ändra sina egna. Bara personen själv anger sina, eftersom uppgifterna bygger på
 * personens eget samtycke. "Inga kostbehov" (sagt uttryckligen) skiljs från att någon inte har svarat.
 */
export function Kostbehov({
  deltagare,
  kostbehov,
  mittUserId,
  onSpara,
  onTaBort,
}: {
  deltagare: readonly DeltagareRad[]
  kostbehov: readonly Behovsrad[]
  mittUserId: string
  onSpara: (behov: Behovsval) => Promise<boolean>
  onTaBort: (deltagareId: string) => Promise<boolean>
}) {
  const [andrar, setAndrar] = useState<DeltagareRad | null>(null)
  const [oppen, setOppen] = useState(false)
  const id = useId()
  const behovFor = (deltagareId: string) => kostbehov.find((k) => k.deltagare_id === deltagareId)
  const personer = deltagare.filter((d) => d.typ === 'person').map((d) => ({ d, svar: kostsvar(d, behovFor(d.id)) }))
  const medBehov = personer.filter((p) => p.svar.lage === 'behov')
  const inga = personer.filter((p) => p.svar.lage === 'inga').map((p) => p.d.namn)
  const inteSvarat = personer.filter((p) => p.svar.lage !== 'behov' && p.svar.lage !== 'inga').map((p) => p.d.namn)

  return (
    <section aria-labelledby={`${id}-rubrik`} className="rounded-ruta border border-border bg-card">
      <h2 id={`${id}-rubrik`} className="font-sans text-base">
        <button
          type="button"
          aria-label="Kostbehov"
          aria-describedby={`${id}-sammanfattning`}
          aria-expanded={oppen}
          aria-controls={`${id}-detaljer`}
          onClick={() => setOppen((o) => !o)}
          className="flex min-h-14 w-full items-start gap-3 rounded-ruta px-4 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-5"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
            <span className="flex shrink-0 items-center gap-2 pt-0.5 font-semibold">
              <Ikon namn="allergi" className="text-primary" />
              Kostbehov
            </span>
            <span id={`${id}-sammanfattning`} className="flex min-w-0 flex-col gap-1.5 font-normal">
              {medBehov.length > 0 && (
                <span className="flex flex-wrap gap-1.5">
                  {medBehov.map((p) => (
                    <Bricka key={p.d.id}>
                      {p.d.namn}: {kostsvarText(p.svar).toLowerCase()}
                    </Bricka>
                  ))}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {[
                  inga.length > 0 && `Inga kostbehov: ${uppraknade(inga)}.`,
                  inteSvarat.length > 0 && `Har inte angett något: ${uppraknade(inteSvarat)}.`,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </span>
            </span>
          </span>
          <ChevronDown className={cn('mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform', oppen && 'rotate-180')} aria-hidden />
        </button>
      </h2>
      <div id={`${id}-detaljer`} hidden={!oppen} className="space-y-3 border-t border-border px-4 py-4 sm:px-5">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          Syns bara för er som är med i turen. Var och en anger sina egna.
        </p>
        <ul className="divide-y divide-border">
          {personer.map(({ d, svar }) => {
            const jag = kanAndraKostbehov({ typ: d.typ, userId: d.user_id }, mittUserId)
            return (
              <li key={d.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-words">{jag ? `${d.namn} (du)` : d.namn}</p>
                  <p className="text-sm text-muted-foreground">{kostsvarText(svar)}</p>
                </div>
                {jag && (
                  <Button variant="outline" onClick={() => setAndrar(d)} aria-label="Ändra dina kostbehov">
                    Ändra
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
      {andrar && (
        <Behovspanel
          finns={behovFor(andrar.id) !== undefined}
          forsta={behovFor(andrar.id) ?? { deltagare_id: andrar.id, ...TOMT }}
          onStang={() => setAndrar(null)}
          onSpara={async (b) => {
            const ok = await onSpara(b)
            if (ok) setAndrar(null)
            return ok
          }}
          onTaBort={async () => {
            const ok = await onTaBort(andrar.id)
            if (ok) setAndrar(null)
            return ok
          }}
        />
      )}
    </section>
  )
}

function Behovspanel({
  finns,
  forsta,
  onStang,
  onSpara,
  onTaBort,
}: {
  /** Har personen redan sparat kostbehov i turen? Då går de att ta bort. */
  finns: boolean
  forsta: Behovsval
  onStang: () => void
  onSpara: (b: Behovsval) => Promise<boolean>
  onTaBort: () => Promise<boolean>
}) {
  const formId = useId()
  const [behov, setBehov] = useState<Behovsval>({
    deltagare_id: forsta.deltagare_id,
    vegetarisk: forsta.vegetarisk,
    vegansk: forsta.vegansk,
    glutenfri: forsta.glutenfri,
    laktosfri: forsta.laktosfri,
    utan: forsta.utan,
  })
  // Samtycket är aldrig förvalt, inte heller när man ändrar uppgifter man redan har sparat.
  const [samtycke, setSamtycke] = useState(false)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  const vaxlaVal = (k: Kostval, pa: boolean) => setBehov((b) => ({ ...b, [k]: pa }))
  const vaxlaAllergen = (a: Allergen, pa: boolean) => setBehov((b) => ({ ...b, utan: pa ? [...b.utan, a] : b.utan.filter((x) => x !== a) }))

  async function gor(atgard: () => Promise<boolean>) {
    setFel(null)
    setSparar(true)
    const ok = await atgard()
    setSparar(false)
    if (!ok) setFel('Det gick inte att spara. Kontrollera uppkopplingen och försök igen.')
  }

  function spara(e: FormEvent) {
    e.preventDefault()
    // Allt urbockat sparas som att man inte har några kostbehov. Det kräver också samtycke.
    if (!samtycke) return setFel('Bocka i att du samtycker för att kunna spara.')
    void gor(() => onSpara(behov))
  }

  return (
    <Panel
      etikett="Dina kostbehov"
      onStang={onStang}
      rubrik={<h2 className="text-2xl">Dina kostbehov</h2>}
      fot={
        <div className="flex flex-wrap gap-2">
          <Button type="submit" form={formId} disabled={sparar}>
            {sparar ? 'Sparar …' : 'Spara'}
          </Button>
          {finns && (
            <Button variant="outline" disabled={sparar} onClick={() => gor(onTaBort)}>
              Ta bort mina kostbehov
            </Button>
          )}
        </div>
      }
    >
      <form id={formId} onSubmit={spara} noValidate className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Uppgifterna sparas bara för den här turen och syns för alla som är med i den, så att ni kan välja mat som passar. Det är
          frivilligt. Sparar du utan att bocka i något noteras det att du inte har några kostbehov. Ta bort dina kostbehov om du vill ta tillbaka samtycket.
        </p>
        <fieldset className="space-y-1">
          <legend className="mb-1 text-sm font-medium">Kost</legend>
          {KOSTVAL.map((k) => (
            <Kryss key={k.nyckel} etikett={k.etikett} checked={behov[k.nyckel]} onChange={(pa) => vaxlaVal(k.nyckel, pa)} />
          ))}
        </fieldset>
        <fieldset className="space-y-1">
          <legend className="mb-1 text-sm font-medium">Tål inte</legend>
          <div className="grid grid-cols-2 gap-x-3">
            {ALLERGENER.map((a) => (
              <Kryss key={a.nyckel} etikett={a.etikett} checked={behov.utan.includes(a.nyckel)} onChange={(pa) => vaxlaAllergen(a.nyckel, pa)} />
            ))}
          </div>
        </fieldset>
        <label className="flex cursor-pointer items-start gap-3 rounded-knapp border border-border p-3">
          <input type="checkbox" checked={samtycke} onChange={(e) => setSamtycke(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-primary" />
          <span className="text-sm">{SAMTYCKE}</span>
        </label>
        {fel && (
          <p role="alert" className="text-sm text-destructive">
            {fel}
          </p>
        )}
      </form>
    </Panel>
  )
}

function Kryss({ etikett, checked, onChange }: { etikett: string; checked: boolean; onChange: (pa: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 shrink-0 accent-primary" />
      {etikett}
    </label>
  )
}
