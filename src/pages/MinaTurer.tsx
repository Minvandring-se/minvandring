import { Plus, X } from 'lucide-react'
import { Ikon } from '@/components/ikoner/Ikon'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { FlikAntal } from '@/components/ui/bricka'
import { TurBild } from '@/components/app/TurBild'
import { NastaTurKort, TurRadKort, type TurMedDeltagare } from '@/components/app/TurKort'
import { glomTurlistan, mindTurlista, minnsTurlistan } from '@/components/app/turlistaMinne'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { VanVal } from '@/components/vanner/VanVal'
import { useSidtitel } from '@/hooks/useSidtitel'
import { useGrupper } from '@/hooks/useGrupper'
import { laggTillVannerITur, useMinaVanner } from '@/hooks/useVanner'
import { supabase } from '@/lib/supabase'
import { delaUppTurer, flerTurer, halsning, lokaltDatum } from '@/lib/turlista'
import { cn } from '@/lib/utils'
import { valjGrupp } from '@/lib/grupper'
import { sammaSom, turerMedVanner } from '@/lib/vanner'

export function MinaTurer() {
  const { namn: mittNamn, anvandarId, profilHamtad } = useApp()
  const [turer, setTurer] = useState<TurMedDeltagare[] | null>(() => mindTurlista(anvandarId))
  const [laddfel, setLaddfel] = useState(false)
  // Räknas upp av Försök igen, så att listan hämtas igen.
  const [omgang, setOmgang] = useState(0)
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
      .select('id, namn, destination, avresa, hemkomst, dagar, skapad, deltagare(namn, typ, sortering, user_id)')
      .order('sortering', { referencedTable: 'deltagare' })
      .then(({ data, error }) => {
        const hamtade = (data as TurMedDeltagare[] | null) ?? []
        // Går det inte att hämta om listan får den sparade stå kvar.
        if (error && mindTurlista(anvandarId)) return
        setLaddfel(!!error)
        setTurer(hamtade)
        if (!error && anvandarId) minnsTurlistan(anvandarId, hamtade)
      })
  }, [anvandarId, omgang])

  function visaFormular(oppet: boolean) {
    setSok(oppet ? { ny: '1' } : {}, { replace: true })
  }

  const idag = lokaltDatum()
  const { nasta, kommande, tidigare } = delaUppTurer(turer ?? [], idag)
  // Hälsningen visas först när både namnet och turerna är hämtade, så att den inte byter text medan sidan laddas.
  const halsningstext =
    !profilHamtad || turer === null ? (
      <Skelett className="h-6 w-40 lg:h-7" />
    ) : (
      halsning(mittNamn, laddfel ? 'laddar' : turer.length === 0 ? 'inga-turer' : nasta ? 'nasta-visas' : 'bara-tidigare')
    )

  // En knapp med kant, eftersom Öppna turen är sidans huvudknapp. Sidomenyn på dator har också en länk till Ny tur.
  const nyTurKnapp = !formularOppet && (
    <Button variant="outline" onClick={() => visaFormular(true)}>
      <Plus className="size-4" aria-hidden />
      Ny tur
    </Button>
  )

  const fler = flerTurer(kommande.length, tidigare.length)
  const flik = valdFlik ?? fler.forvald
  const lista = flik === 'kommande' ? kommande : tidigare

  return (
    <div className="space-y-8">
      <SidRubrik rubrik="Mina turer" text={halsningstext ?? undefined} knappar={turer?.length ? nyTurKnapp : null} />

      {besked && (
        <p role="status" className="rounded-md bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
          {besked}
        </p>
      )}

      {formularOppet && <NyTurFormular turer={turer ?? []} grupp={sok.get('grupp')} onStang={() => visaFormular(false)} />}

      {turer === null ? (
        <Laddar text="Hämtar dina turer">
          <div className="overflow-hidden rounded-[1.375rem] border border-border bg-card md:grid md:grid-cols-2">
            <Skelett className="h-44 rounded-none sm:h-56 md:order-2 md:h-full md:min-h-80" />
            <div className="space-y-3 p-5 sm:p-7">
              <Skelett className="h-8 w-3/4" />
              <Skelett className="h-5 w-1/2" />
              <Skelett className="h-5 w-1/3" />
            </div>
          </div>
        </Laddar>
      ) : laddfel ? (
        <Laddfel vad="dina turer" onForsokIgen={() => setOmgang((n) => n + 1)} />
      ) : turer.length === 0 ? (
        !formularOppet && (
          <TomtLage
            bild={<TurBild turId="forsta-turen" sizes="(min-width: 1024px) 900px, 100vw" prioritet className="aspect-[16/9] w-full sm:aspect-[21/9] lg:aspect-[3/1]" />}
            rubrik="Planera din första tur"
            text="Skapa en tur, bjud in de som ska med och samla datum, startpunkt och deltagare på ett ställe."
            knapp={
              <Button size="lg" onClick={() => visaFormular(true)}>
                <Plus className="size-5 text-hjortron-ikon" aria-hidden />
                Ny tur
              </Button>
            }
          />
        )
      ) : (
        <>
          {nasta && <NastaTurKort tur={nasta} idag={idag} />}

          {!nasta && (
            <TomtLage kompakt ikon={<Ikon namn="fjall" storlek={32} className="text-primary" />} text="Du har ingen kommande tur. Skapa en ny tur när det är dags att planera nästa." />
          )}

          {fler.visa && (
          <section aria-labelledby="fler-turer" className="space-y-4">
            <h2 id="fler-turer" className="text-2xl">
              {nasta ? 'Övriga turer' : 'Dina turer'}
            </h2>
            <div role="tablist" aria-labelledby="fler-turer" className="flex gap-2">
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
                  // Som flikar brukar fungera: Tab når den valda fliken, och piltangenterna byter flik.
                  tabIndex={flik === varde ? 0 : -1}
                  onClick={() => setValdFlik(varde)}
                  onKeyDown={(e) => {
                    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
                    e.preventDefault()
                    const annan = varde === 'kommande' ? 'tidigare' : 'kommande'
                    setValdFlik(annan)
                    document.getElementById(`flik-${annan}`)?.focus()
                  }}
                  className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    flik === varde ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted',
                  )}
                >
                  {text}
                  <FlikAntal antal={antal} />
                </button>
              ))}
            </div>
            <div id="fler-turer-lista" role="tabpanel" aria-labelledby={`flik-${flik}`}>
              {lista.length === 0 ? (
                <TomtLage kompakt text={flik === 'kommande' ? 'Inga fler kommande turer.' : 'Inga tidigare turer än.'} />
              ) : (
                // En kolumn i mobil, två på dator och tre på stora skärmar.
                <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
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

/**
 * Kort formulär för en ny tur: namnet, och de vänner som ska med. Vännerna kan fyllas i från en grupp eller från en
 * tidigare tur, och från gruppen i adressen (?grupp=, från Ny tur med gruppen på sidan Vänner). Resten fylls i inne i
 * turen. Vännerna läggs till direkt som redigerare när turen har skapats.
 */
function NyTurFormular({ turer, grupp, onStang }: { turer: readonly TurMedDeltagare[]; grupp: string | null; onStang: () => void }) {
  const navigate = useNavigate()
  const id = useId()
  const falt = useRef<HTMLInputElement>(null)
  const [namn, setNamn] = useState('')
  const [skapar, setSkapar] = useState(false)
  const [fel, setFel] = useState('')
  const vanner = useMinaVanner(true)
  const [valda, setValda] = useState<Set<string>>(new Set())
  const { grupper } = useGrupper()
  // Det valda i Fyll i från: g:<grupp> eller t:<tur>.
  const [fran, setFran] = useState(grupp ? `g:${grupp}` : '')
  const [forifyllt, setForifyllt] = useState(!grupp)
  const tidigare = Array.isArray(vanner) ? turerMedVanner(turer, vanner).slice(0, 10) : []
  const minaGrupper = Array.isArray(grupper) ? grupper.filter((g) => g.medlemmar.length > 0) : []
  // Gruppen från adressen fylls i när vännerna och grupperna har hämtats, en gång.
  if (!forifyllt && Array.isArray(vanner) && Array.isArray(grupper)) {
    setForifyllt(true)
    const g = grupper.find((x) => x.id === grupp)
    if (g) setValda(valjGrupp(g, vanner))
    else setFran('')
  }

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
    if (error) {
      setSkapar(false)
      setFel('Det gick inte att skapa turen. Kontrollera uppkopplingen och försök igen.')
      return
    }
    // Gick det inte att lägga till vännerna öppnas inbjudan i turen, så att man kan försöka igen där.
    const tillagda = valda.size > 0 ? await laggTillVannerITur(id, [...valda]) : null
    setSkapar(false)
    glomTurlistan()
    navigate(tillagda?.fel ? `/tur/${id}#bjud-in` : `/tur/${id}`)
  }

  function fyllI(varde: string) {
    setFran(varde)
    if (!Array.isArray(vanner)) return
    const [sort, id] = [varde.slice(0, 2), varde.slice(2)]
    const g = sort === 'g:' && Array.isArray(grupper) ? grupper.find((x) => x.id === id) : undefined
    const t = sort === 't:' ? turer.find((x) => x.id === id) : undefined
    if (g) setValda(valjGrupp(g, vanner))
    if (t) setValda(sammaSom(vanner, t.deltagare))
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
          {skapar ? 'Skapar …' : 'Skapa turen'}
        </Button>
      </div>
      {Array.isArray(vanner) && vanner.length > 0 && (
        <div className="space-y-3 pt-1">
          {(minaGrupper.length > 0 || tidigare.length > 0) && (
            <div className="space-y-1">
              <label htmlFor={`${id}-fran`} className="block text-sm font-medium">
                Fyll i vännerna från
              </label>
              <Select id={`${id}-fran`} value={fran} onChange={(e) => fyllI(e.target.value)}>
                <option value="">Välj en grupp eller en tidigare tur</option>
                {minaGrupper.length > 0 && (
                  <optgroup label="Grupper">
                    {minaGrupper.map((g) => (
                      <option key={g.id} value={`g:${g.id}`}>
                        {g.namn}
                      </option>
                    ))}
                  </optgroup>
                )}
                {tidigare.length > 0 && (
                  <optgroup label="Samma som i">
                    {tidigare.map((t) => (
                      <option key={t.id} value={`t:${t.id}`}>
                        {t.namn}
                      </option>
                    ))}
                  </optgroup>
                )}
              </Select>
            </div>
          )}
          <VanVal rubrik="Vänner som ska med" vanner={vanner} valda={valda} onAndra={setValda} />
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        {Array.isArray(vanner) && vanner.length > 0
          ? 'Vännerna läggs till som redigerare och får en notis. Datum, startpunkt och fler deltagare lägger du till inne i turen.'
          : 'Datum, startpunkt och deltagare lägger du till inne i turen.'}
      </p>
      {fel && <p className="text-sm text-destructive">{fel}</p>}
    </form>
  )
}
