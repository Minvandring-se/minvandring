import { Plus } from 'lucide-react'
import { Ikon } from '@/components/ikoner/Ikon'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { FlikAntal } from '@/components/ui/bricka'
import { TurBild } from '@/components/app/TurBild'
import { NastaTurKort, TurRadKort, type TurMedDeltagare } from '@/components/app/TurKort'
import { mindTurlista, minnsTurlistan } from '@/components/app/turlistaMinne'
import { Button } from '@/components/ui/button'
import { useSidtitel } from '@/hooks/useSidtitel'
import { supabase } from '@/lib/supabase'
import { delaUppTurer, flerTurer, halsning, lokaltDatum } from '@/lib/turlista'
import { cn } from '@/lib/utils'

export function MinaTurer() {
  const { namn: mittNamn, anvandarId, profilHamtad } = useApp()
  const [turer, setTurer] = useState<TurMedDeltagare[] | null>(() => mindTurlista(anvandarId))
  const [laddfel, setLaddfel] = useState(false)
  // Räknas upp av Försök igen, så att listan hämtas igen.
  const [omgang, setOmgang] = useState(0)
  const [, setSok] = useSearchParams()
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

  /** Ny tur öppnas som en stor ruta i ramen (AppSkal), med ?ny=1 i adressen. */
  function visaFormular() {
    setSok({ ny: '1' })
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
  const nyTurKnapp = (
    <Button variant="outline" onClick={visaFormular}>
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
        <TomtLage
            bild={<TurBild turId="forsta-turen" sizes="(min-width: 1024px) 900px, 100vw" prioritet className="aspect-[16/9] w-full sm:aspect-[21/9] lg:aspect-[3/1]" />}
            rubrik="Planera din första tur"
            text="Skapa en tur, bjud in de som ska med och samla datum, startpunkt och deltagare på ett ställe."
            knapp={
              <Button size="lg" onClick={visaFormular}>
                <Plus className="size-5 text-hjortron-ikon" aria-hidden />
                Ny tur
              </Button>
            }
          />
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
