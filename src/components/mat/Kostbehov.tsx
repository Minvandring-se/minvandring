import { Lock } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { Sektion } from '@/components/ui/sektion'
import { ALLERGENER, behovstext, KOSTVAL, type Allergen, type Kostval } from '@/lib/kost'
import { kanAndraKostbehov, type Roll } from '@/lib/roller'
import type { DeltagareRad, Kostbehov as Behovsrad } from '@/lib/typer'

const TOMT: Omit<Behovsrad, 'deltagare_id'> = { vegetarisk: false, vegansk: false, glutenfri: false, laktosfri: false, utan: [] }

/**
 * Kostbehoven i gruppen: en rad per person. Var och en ändrar sina egna, och ägare och redigerare ändrar för
 * personer utan konto. Uppgifterna syns bara för deltagarna i turen.
 */
export function Kostbehov({
  deltagare,
  kostbehov,
  minRoll,
  mittUserId,
  onSpara,
}: {
  deltagare: readonly DeltagareRad[]
  kostbehov: readonly Behovsrad[]
  minRoll: Roll | null
  mittUserId: string
  onSpara: (behov: Behovsrad) => Promise<boolean>
}) {
  const [andrar, setAndrar] = useState<DeltagareRad | null>(null)
  const personer = deltagare.filter((d) => d.typ === 'person')
  const behovFor = (id: string) => kostbehov.find((k) => k.deltagare_id === id)

  return (
    <Sektion rubrik="Kostbehov i gruppen">
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
        Syns bara för er som är med i turen. Var och en anger sina egna.
      </p>
      <ul className="divide-y divide-border">
        {personer.map((d) => {
          const behov = behovFor(d.id)
          const text = behov ? behovstext(behov) : ''
          const kan = kanAndraKostbehov(minRoll, { typ: d.typ, roll: d.roll, userId: d.user_id }, mittUserId)
          const jag = d.user_id === mittUserId
          return (
            <li key={d.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium break-words">{jag ? `${d.namn} (du)` : d.namn}</p>
                <p className="text-sm text-muted-foreground">{text || 'Inga kostbehov angivna'}</p>
              </div>
              {kan && (
                <Button variant="outline" onClick={() => setAndrar(d)} aria-label={jag ? 'Ändra dina kostbehov' : `Ändra kostbehov för ${d.namn}`}>
                  Ändra
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      {andrar && (
        <Behovspanel
          deltagare={andrar}
          jag={andrar.user_id === mittUserId}
          forsta={behovFor(andrar.id) ?? { deltagare_id: andrar.id, ...TOMT }}
          onStang={() => setAndrar(null)}
          onSpara={async (b) => {
            const ok = await onSpara(b)
            if (ok) setAndrar(null)
            return ok
          }}
        />
      )}
    </Sektion>
  )
}

function Behovspanel({
  deltagare,
  jag,
  forsta,
  onStang,
  onSpara,
}: {
  deltagare: DeltagareRad
  jag: boolean
  forsta: Behovsrad
  onStang: () => void
  onSpara: (b: Behovsrad) => Promise<boolean>
}) {
  const formId = useId()
  const [behov, setBehov] = useState(forsta)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState(false)
  const rubrik = jag ? 'Dina kostbehov' : `Kostbehov för ${deltagare.namn}`

  const vaxlaVal = (k: Kostval, pa: boolean) => setBehov((b) => ({ ...b, [k]: pa }))
  const vaxlaAllergen = (a: Allergen, pa: boolean) =>
    setBehov((b) => ({ ...b, utan: pa ? [...b.utan, a] : b.utan.filter((x) => x !== a) }))

  async function spara(e: FormEvent) {
    e.preventDefault()
    setFel(false)
    setSparar(true)
    const ok = await onSpara(behov)
    setSparar(false)
    if (!ok) setFel(true)
  }

  return (
    <Panel
      etikett={rubrik}
      onStang={onStang}
      rubrik={<h2 className="text-2xl break-words">{rubrik}</h2>}
      fot={
        <div className="flex flex-wrap gap-2">
          <Button type="submit" form={formId} disabled={sparar}>
            {sparar ? 'Sparar …' : 'Spara'}
          </Button>
          <Button variant="outline" onClick={onStang}>
            Avbryt
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={spara} className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Uppgifterna syns för alla som är med i turen, så att ni kan välja mat som passar. Vill du ta bort uppgifterna bockar du ur allt och sparar.
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
        {fel && (
          <p role="alert" className="text-sm text-destructive">
            Det gick inte att spara. Kontrollera uppkopplingen och försök igen.
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
