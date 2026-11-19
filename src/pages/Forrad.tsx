import { Pencil, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { SakFormular, type Forval } from '@/components/forrad/SakFormular'
import { ForradIllustration } from '@/components/illustrationer/ForradIllustration'
import { Button } from '@/components/ui/button'
import { useSidtitel } from '@/hooks/useSidtitel'
import { formateraVikt, summeraForrad, underkategoriFor, type Kategorigrupp } from '@/lib/forrad'
import { supabase } from '@/lib/supabase'
import type { Forradssak } from '@/lib/typer'

/** De tyngsta sakerna, som det lönar sig att börja med. */
const BORJA_MED: { text: string; forval: Forval }[] = [
  { text: 'Ryggsäck', forval: { kategori: 'packning', underkategori: 'ryggsack' } },
  { text: 'Tält', forval: { kategori: 'talt', underkategori: 'talt' } },
  { text: 'Sovsäck', forval: { kategori: 'sova', underkategori: 'sovsack' } },
]

/** Vad som är öppet: formuläret för en ny sak (med eller utan förval) eller för en sak som ändras. */
type Oppet = { ny: Forval | null } | { sakId: string } | null

function antalText(antal: number) {
  return antal === 1 ? '1 sak' : `${antal} saker`
}

/** Mitt förråd: ens egen utrustning med vikt, grupperad per huvudkategori. Bara man själv ser den. */
export function Forrad() {
  useSidtitel('Mitt förråd')
  const [saker, setSaker] = useState<Forradssak[] | null>(null)
  const [laddfel, setLaddfel] = useState(false)
  const [oppet, setOppet] = useState<Oppet>(null)

  // Räknas upp när något har sparats eller tagits bort, så att listan hämtas igen.
  const [omgang, setOmgang] = useState(0)

  useEffect(() => {
    supabase
      ?.from('forradssaker')
      .select('id, produkt_id, namn, kategori, underkategori, antal, vikt_g, typ, notering')
      .then(({ data, error }) => {
        setLaddfel(!!error)
        if (!error) setSaker((data as Forradssak[] | null) ?? [])
      })
  }, [omgang])

  function klar() {
    setOppet(null)
    setOmgang((n) => n + 1)
  }

  const summa = summeraForrad(saker ?? [])
  const ny = oppet !== null && 'ny' in oppet ? oppet : null
  const laggTillKnapp = !ny && (
    <Button onClick={() => setOppet({ ny: null })}>
      <Plus className="size-4" aria-hidden />
      Lägg till
    </Button>
  )

  return (
    <div className="space-y-8">
      <SidRubrik rubrik="Mitt förråd" text="Din egen utrustning, samlad på ett ställe." knappar={saker?.length ? laggTillKnapp : null} />

      {ny && <SakFormular key={ny.ny?.underkategori ?? 'ny'} forval={ny.ny ?? undefined} onKlar={klar} onAvbryt={() => setOppet(null)} />}

      {laddfel ? (
        <p role="alert" className="text-destructive">
          Det gick inte att hämta ditt förråd. Ladda om sidan och försök igen.
        </p>
      ) : saker === null ? (
        <p role="status" className="text-muted-foreground">
          Hämtar ditt förråd …
        </p>
      ) : saker.length === 0 ? (
        !ny && (
          <TomtLage
            bild={<ForradIllustration className="block aspect-[8/5] w-full sm:aspect-[21/9]" />}
            rubrik="Lägg in din utrustning en gång"
            text="Välj sedan vad som ska med på varje vandring. Börja gärna med det tyngsta: ryggsäck, tält och sovsäck."
            knapp={
              <div className="flex flex-wrap gap-2">
                {BORJA_MED.map(({ text, forval }) => (
                  <Button key={text} variant="outline" onClick={() => setOppet({ ny: forval })}>
                    <Plus className="size-4" aria-hidden />
                    {text}
                  </Button>
                ))}
                <Button variant="ghost" onClick={() => setOppet({ ny: null })}>
                  Något annat
                </Button>
              </div>
            }
          />
        )
      ) : (
        <>
          <div className="space-y-2">
            <dl className="grid grid-cols-2 gap-3 sm:max-w-md">
              <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
                <dt className="text-sm text-muted-foreground">Total vikt</dt>
                <dd className="text-2xl font-semibold">{formateraVikt(summa.viktG)}</dd>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
                <dt className="text-sm text-muted-foreground">I förrådet</dt>
                <dd className="text-2xl font-semibold">{antalText(summa.antal)}</dd>
              </div>
            </dl>
            {summa.utanVikt > 0 && (
              <p className="text-sm text-muted-foreground">
                {summa.utanVikt === 1 ? '1 sak saknar vikt och är inte med i summan.' : `${summa.utanVikt} saker saknar vikt och är inte med i summan.`}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {summa.grupper.map((grupp) => (
              <Kategoridel
                key={grupp.kategori.nyckel}
                grupp={grupp}
                oppenSak={oppet !== null && 'sakId' in oppet ? oppet.sakId : null}
                onOppna={(sakId) => setOppet({ sakId })}
                onKlar={klar}
                onAvbryt={() => setOppet(null)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Kategoridel({
  grupp,
  oppenSak,
  onOppna,
  onKlar,
  onAvbryt,
}: {
  grupp: Kategorigrupp
  oppenSak: string | null
  onOppna: (sakId: string) => void
  onKlar: () => void
  onAvbryt: () => void
}) {
  const { kategori, saker, antal, viktG } = grupp
  const Ikon = kategori.ikon
  const rubrikId = `kategori-${kategori.nyckel}`
  return (
    <section aria-labelledby={rubrikId} className="space-y-2">
      <div className="flex items-center gap-3">
        <Ikon className="size-5 shrink-0 text-primary" aria-hidden />
        <h2 id={rubrikId} className="min-w-0 flex-1 text-xl">
          {kategori.etikett}
        </h2>
        <p className="shrink-0 text-sm text-muted-foreground">
          {antalText(antal)} · {formateraVikt(viktG)}
        </p>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-soft">
        {saker.map((sak) =>
          oppenSak === sak.id ? (
            <li key={sak.id} className="p-2">
              <SakFormular sak={sak} onKlar={onKlar} onAvbryt={onAvbryt} />
            </li>
          ) : (
            <li key={sak.id}>
              <Sakrad sak={sak} onOppna={() => onOppna(sak.id)} />
            </li>
          ),
        )}
      </ul>
    </section>
  )
}

/** En sak i listan. Hela raden öppnar formuläret där saken ändras eller tas bort. */
function Sakrad({ sak, onOppna }: { sak: Forradssak; onOppna: () => void }) {
  // Underkategorin och anteckningen står diskret under namnet.
  const detaljer = [underkategoriFor(sak.kategori, sak.underkategori)?.etikett, sak.notering].filter(Boolean).join(' · ')
  return (
    <button
      type="button"
      onClick={onOppna}
      className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-medium break-words">
          <span className="sr-only">Ändra </span>
          {sak.namn}
          {sak.antal > 1 && <span className="font-normal text-muted-foreground"> × {sak.antal}</span>}
        </span>
        {detaljer && <span className="block text-sm break-words text-muted-foreground">{detaljer}</span>}
      </span>
      {sak.vikt_g === null ? (
        <span className="shrink-0 text-sm text-muted-foreground italic">vikt saknas</span>
      ) : (
        <span className="shrink-0 text-sm font-medium">{formateraVikt(sak.antal * sak.vikt_g)}</span>
      )}
      <Pencil className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}
