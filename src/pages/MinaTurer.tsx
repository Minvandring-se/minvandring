import { Plus, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { TurBild } from '@/components/app/TurBild'
import { NastaTurKort, TurRadKort, type TurMedDeltagare } from '@/components/app/TurKort'
import { glomTurlistan, mindTurlista, minnsTurlistan } from '@/components/app/turlistaMinne'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSidtitel } from '@/hooks/useSidtitel'
import { supabase } from '@/lib/supabase'
import { delaUppTurer, flerTurer, lage, lokaltDatum } from '@/lib/turlista'
import { cn } from '@/lib/utils'

export function MinaTurer() {
  const { namn: mittNamn, anvandarId } = useApp()
  const [turer, setTurer] = useState<TurMedDeltagare[] | null>(() => mindTurlista(anvandarId))
  const [laddfel, setLaddfel] = useState(false)
  const [sok, setSok] = useSearchParams()
  const formularOppet = sok.get('ny') === '1'
  // Fliken man själv har valt. Innan dess gäller den förvalda (Tidigare när inga kommande turer finns).
  const [valdFlik, setValdFlik] = useState<'kommande' | 'tidigare' | null>(null)
  // Besked från sidan man kom ifrån, till exempel att en tur har raderats.
  const besked = (useLocation().state as { besked?: string } | null)?.besked
  useSidtitel('Mina turer')

  useEffect(() => {
    supabase
      ?.from('turer')
      .select('id, namn, destination, avresa, hemkomst, dagar, skapad, deltagare(namn, typ, sortering)')
      .order('sortering', { referencedTable: 'deltagare' })
      .then(({ data, error }) => {
        const hamtade = (data as TurMedDeltagare[] | null) ?? []
        // Går det inte att hämta om listan får den sparade stå kvar.
        if (error && mindTurlista(anvandarId)) return
        setLaddfel(!!error)
        setTurer(hamtade)
        if (!error && anvandarId) minnsTurlistan(anvandarId, hamtade)
      })
  }, [anvandarId])

  function visaFormular(oppet: boolean) {
    setSok(oppet ? { ny: '1' } : {}, { replace: true })
  }

  const idag = lokaltDatum()
  const { nasta, kommande, tidigare } = delaUppTurer(turer ?? [], idag)
  const hej = mittNamn ? `Hej ${mittNamn}.` : 'Hej.'
  const halsning = turer === null || laddfel
    ? hej
    : turer.length === 0
    ? `${hej} Här samlar du vandringarna du planerar.`
    : nasta && lage(nasta, idag) === 'pagar'
      ? `${hej} Du är ute på tur just nu.`
      : nasta
        ? `${hej} Här är din nästa vandring.`
        : `${hej} Dags att planera nästa vandring?`

  // På dator finns Ny tur i sidomenyn, så knappen i sidhuvudet visas bara i mobil.
  const nyTurKnapp = !formularOppet && (
    <Button className="lg:hidden" onClick={() => visaFormular(true)}>
      <Plus className="size-4" aria-hidden />
      Ny tur
    </Button>
  )

  const fler = flerTurer(kommande.length, tidigare.length)
  const flik = valdFlik ?? fler.forvald
  const lista = flik === 'kommande' ? kommande : tidigare

  return (
    <div className="space-y-8">
      <SidRubrik rubrik="Mina turer" text={halsning} knappar={turer?.length ? nyTurKnapp : null} />

      {besked && (
        <p role="status" className="rounded-md bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
          {besked}
        </p>
      )}

      {formularOppet && <NyTurFormular onStang={() => visaFormular(false)} />}

      {turer === null ? (
        <p role="status" className="text-muted-foreground">
          Hämtar dina turer …
        </p>
      ) : laddfel ? (
        <p className="text-destructive">Det gick inte att hämta dina turer. Ladda om sidan och försök igen.</p>
      ) : turer.length === 0 ? (
        !formularOppet && (
          <TomtLage
            bild={<TurBild turId="forsta-turen" sizes="(min-width: 1024px) 900px, 100vw" prioritet className="aspect-[16/9] w-full sm:aspect-[21/9] lg:aspect-[3/1]" />}
            rubrik="Planera din första vandring"
            text="Skapa en tur, bjud in de som ska med och samla datum, startpunkt och deltagare på ett ställe."
            knapp={
              <Button size="lg" onClick={() => visaFormular(true)}>
                <Plus className="size-5" aria-hidden />
                Ny tur
              </Button>
            }
          />
        )
      ) : (
        <>
          {nasta && <NastaTurKort tur={nasta} pagar={lage(nasta, idag) === 'pagar'} />}

          {!nasta && (
            <p className="rounded-lg border border-dashed border-border px-5 py-6 text-muted-foreground">
              Du har ingen kommande vandring. Skapa en ny tur när det är dags att planera nästa.
            </p>
          )}

          {fler.visa && (
          <section aria-labelledby="fler-turer" className="space-y-4">
            <h2 id="fler-turer" className="text-2xl">
              {nasta ? 'Fler turer' : 'Dina turer'}
            </h2>
            <div role="tablist" aria-label="Fler turer" className="flex gap-2">
              {(
                [
                  ['kommande', 'Kommande', kommande.length],
                  ['tidigare', 'Tidigare', tidigare.length],
                ] as const
              ).map(([varde, text, antal]) => (
                <button
                  key={varde}
                  type="button"
                  role="tab"
                  id={`flik-${varde}`}
                  aria-selected={flik === varde}
                  aria-controls="fler-turer-lista"
                  onClick={() => setValdFlik(varde)}
                  className={cn(
                    'h-11 rounded-full border px-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    flik === varde ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted',
                  )}
                >
                  {text} ({antal})
                </button>
              ))}
            </div>
            <div id="fler-turer-lista" role="tabpanel" aria-labelledby={`flik-${flik}`}>
              {lista.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-5 py-6 text-muted-foreground">
                  {flik === 'kommande' ? 'Inga fler kommande turer.' : 'Inga tidigare turer än.'}
                </p>
              ) : (
                <ul className="space-y-3">
                  {lista.map((t) => (
                    <li key={t.id}>
                      <TurRadKort tur={t} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          )}
        </>
      )}
    </div>
  )
}

/** Kort formulär för en ny tur: bara namnet. Resten fylls i inne i turen. */
function NyTurFormular({ onStang }: { onStang: () => void }) {
  const navigate = useNavigate()
  const id = useId()
  const falt = useRef<HTMLInputElement>(null)
  const [namn, setNamn] = useState('')
  const [skapar, setSkapar] = useState(false)
  const [fel, setFel] = useState('')

  useEffect(() => falt.current?.focus(), [])

  async function skapa(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !namn.trim()) return
    setSkapar(true)
    setFel('')
    // Id:t väljs här och raden läses inte tillbaka. Man blir deltagare först när raden finns,
    // och innan dess släpper databasen inte fram turen till någon.
    const id = crypto.randomUUID()
    const { error } = await supabase.from('turer').insert({ id, namn: namn.trim() })
    setSkapar(false)
    if (error) {
      setFel('Det gick inte att skapa turen. Försök igen.')
      return
    }
    glomTurlistan()
    navigate(`/tur/${id}`)
  }

  return (
    <form onSubmit={skapa} className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl">Ny tur</h2>
        <Button type="button" variant="ghost" className="-mt-2 -mr-2 size-11 px-0" aria-label="Stäng" onClick={onStang}>
          <X className="size-5" aria-hidden />
        </Button>
      </div>
      <label htmlFor={id} className="block text-sm font-medium">
        Vad heter turen?
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input id={id} ref={falt} placeholder="T.ex. Sarek 2027" maxLength={80} value={namn} onChange={(e) => setNamn(e.target.value)} />
        <Button type="submit" disabled={!namn.trim() || skapar} className="shrink-0">
          {skapar ? 'Skapar …' : 'Skapa tur'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Datum, startpunkt och deltagare lägger du till inne i turen.</p>
      {fel && <p className="text-sm text-destructive">{fel}</p>}
    </form>
  )
}
