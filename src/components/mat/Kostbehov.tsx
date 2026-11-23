import { Lock } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { Sektion } from '@/components/ui/sektion'
import { ALLERGENER, behovstext, KOSTVAL, SAMTYCKE, type Allergen, type Kostval } from '@/lib/kost'
import { kanAndraKostbehov } from '@/lib/roller'
import type { DeltagareRad, Kostbehov as Behovsrad } from '@/lib/typer'

type Behovsval = Omit<Behovsrad, 'samtycke_tid'>

const TOMT: Omit<Behovsval, 'deltagare_id'> = { vegetarisk: false, vegansk: false, glutenfri: false, laktosfri: false, utan: [] }

/**
 * Kostbehoven i gruppen: en rad per person. Bara personen själv anger sina, eftersom uppgifterna bygger på
 * personens eget samtycke. Personer utan konto kan fylla i själva när de har gått med.
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
          const jag = kanAndraKostbehov({ typ: d.typ, userId: d.user_id }, mittUserId)
          const text = d.user_id === null ? 'Kan fylla i själv när hen har gått med.' : (behov && behovstext(behov)) || 'Inga kostbehov angivna'
          return (
            <li key={d.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium break-words">{jag ? `${d.namn} (du)` : d.namn}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
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
    </Sektion>
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

  const tomt = !behov.vegetarisk && !behov.vegansk && !behov.glutenfri && !behov.laktosfri && behov.utan.length === 0
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
    // Allt urbockat betyder att uppgifterna tas bort. Det kräver inget samtycke.
    if (tomt) return void gor(finns ? onTaBort : async () => true)
    if (!samtycke) return setFel('Kryssa i att du samtycker för att kunna spara.')
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
          frivilligt. Bockar du ur allt och sparar, eller tar bort dem, raderas de och samtycket är återkallat.
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
        {!tomt && (
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
            <input type="checkbox" checked={samtycke} onChange={(e) => setSamtycke(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-primary" />
            <span className="text-sm">{SAMTYCKE}</span>
          </label>
        )}
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
