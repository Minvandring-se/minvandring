import { ChevronDown, ExternalLink, Pencil, Plus } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { Granskad } from '@/components/forrad/Granskad'
import { ProduktSok } from '@/components/forrad/ProduktSok'
import { SakFormular } from '@/components/forrad/SakFormular'
import { ForradIllustration } from '@/components/illustrationer/ForradIllustration'
import { Button } from '@/components/ui/button'
import { useSidtitel } from '@/hooks/useSidtitel'
import { formateraVikt, sakdetaljer, summeraForrad, underkategoriFor, type Forval, type Kategorigrupp } from '@/lib/forrad'
import { supabase } from '@/lib/supabase'
import type { Forradssak } from '@/lib/typer'
import { cn } from '@/lib/utils'

/**
 * Vad som är öppet: sökningen i katalogen (första steget i Lägg till), formuläret för en egen sak,
 * eller formuläret för en sak som ändras.
 */
type Oppet = { sok: true } | { ny: Forval } | { sakId: string } | null

function antalText(antal: number) {
  return antal === 1 ? '1 sak' : `${antal} saker`
}

/** Mitt förråd: ens egen utrustning med vikt, grupperad per huvudkategori. Bara man själv ser den. */
export function Forrad() {
  useSidtitel('Mitt förråd')
  const [saker, setSaker] = useState<Forradssak[] | null>(null)
  const [laddfel, setLaddfel] = useState(false)
  const [oppet, setOppet] = useState<Oppet>(null)
  // Det senaste som lades till från katalogen, så att man kan gå vidare och ändra antal eller anteckning.
  const [tillagd, setTillagd] = useState<{ sakId: string; namn: string } | null>(null)

  // Räknas upp när något har sparats eller tagits bort, så att listan hämtas igen.
  const [omgang, setOmgang] = useState(0)

  useEffect(() => {
    supabase
      ?.from('forradssaker')
      .select('id, produkt_id, namn, kategori, underkategori, antal, vikt_g, typ, notering, produkter(kontrollerad, version, underkategori, minvikt_g, kalla, egenskaper)')
      .then(({ data, error }) => {
        setLaddfel(!!error)
        if (!error) setSaker((data as unknown as Forradssak[] | null) ?? [])
      })
  }, [omgang])

  function hamtaOm() {
    setOmgang((n) => n + 1)
  }

  function klar() {
    setOppet(null)
    setTillagd(null)
    hamtaOm()
  }

  const summa = summeraForrad(saker ?? [])
  const sokOppen = oppet !== null && 'sok' in oppet
  const ny = oppet !== null && 'ny' in oppet ? oppet.ny : null
  const laggerTill = sokOppen || ny !== null
  const oppnaSok = () => {
    setTillagd(null)
    setOppet({ sok: true })
  }
  const laggTillKnapp = !laggerTill && (
    <Button onClick={oppnaSok}>
      <Plus className="size-4" aria-hidden />
      Lägg till
    </Button>
  )
  const finnsRedan = new Set((saker ?? []).flatMap((s) => (s.produkt_id ? [s.produkt_id] : [])))

  return (
    <div className="space-y-8">
      <SidRubrik rubrik="Mitt förråd" text="Din egen utrustning, samlad på ett ställe." knappar={saker?.length ? laggTillKnapp : null} />

      {sokOppen && (
        <ProduktSok
          finnsRedan={finnsRedan}
          onTillagd={(sakId, namn) => {
            setTillagd({ sakId, namn })
            hamtaOm()
          }}
          onEgen={(soktext, kategori) => {
            setTillagd(null)
            setOppet({ ny: { namn: soktext, kategori } })
          }}
          onStang={() => setOppet(null)}
        />
      )}

      {ny && <SakFormular forval={ny} onKlar={klar} onAvbryt={oppnaSok} />}

      {tillagd && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md bg-primary-soft px-4 py-2 text-sm text-primary">
          <p className="font-medium">{tillagd.namn} ligger nu i ditt förråd.</p>
          <button
            type="button"
            className="min-h-11 font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={() => {
              setOppet({ sakId: tillagd.sakId })
              setTillagd(null)
            }}
          >
            Ändra antal eller anteckning
          </button>
        </div>
      )}

      {laddfel ? (
        <p role="alert" className="text-destructive">
          Det gick inte att hämta ditt förråd. Ladda om sidan och försök igen.
        </p>
      ) : saker === null ? (
        <p role="status" className="text-muted-foreground">
          Hämtar ditt förråd …
        </p>
      ) : saker.length === 0 ? (
        !laggerTill && (
          <TomtLage
            bild={<ForradIllustration className="block aspect-[8/5] w-full sm:aspect-[21/9]" />}
            rubrik="Lägg in din utrustning en gång"
            text="Så har du koll på vad du har och vad allt väger. Börja gärna med det tyngsta: ryggsäck, tält och sovsäck."
            knapp={
              <Button size="lg" onClick={oppnaSok}>
                <Plus className="size-5" aria-hidden />
                Lägg till din första sak
              </Button>
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
              <Sakrad sak={sak} onAndra={() => onOppna(sak.id)} />
            </li>
          ),
        )}
      </ul>
    </section>
  )
}

/** En sak i listan. Ett tryck på raden fäller ut informationen om saken, där den också går att ändra. */
function Sakrad({ sak, onAndra }: { sak: Forradssak; onAndra: () => void }) {
  const id = useId()
  const [utfalld, setUtfalld] = useState(false)
  // Underkategorin och anteckningen står diskret under namnet.
  const detaljer = [underkategoriFor(sak.kategori, sak.underkategori)?.etikett, sak.notering].filter(Boolean).join(' · ')
  return (
    <>
      <button
        type="button"
        aria-expanded={utfalld}
        aria-controls={id}
        onClick={() => setUtfalld((u) => !u)}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-medium break-words">
            {sak.namn}
            {sak.antal > 1 && <span className="font-normal text-muted-foreground"> × {sak.antal}</span>}
          </span>
          {/* Versionen, till exempel Regular eller Red Label, står under namnet som i träfflistan. */}
          {sak.produkter?.version && <span className="block text-sm break-words text-muted-foreground">{sak.produkter.version}</span>}
          {detaljer && <span className="block text-sm break-words text-muted-foreground">{detaljer}</span>}
        </span>
        {sak.vikt_g === null ? (
          <span className="shrink-0 text-sm text-muted-foreground italic">vikt saknas</span>
        ) : (
          <span className="shrink-0 text-sm font-medium">{formateraVikt(sak.antal * sak.vikt_g)}</span>
        )}
        <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform', utfalld && 'rotate-180')} aria-hidden />
      </button>

      {/* Bara saker från katalogen har en märkning. Den ligger utanför knappen, eftersom etiketten själv går att trycka på. */}
      {sak.produkter && <Granskad kontrollerad={sak.produkter.kontrollerad} className="px-4 pb-2" />}

      <div id={id} hidden={!utfalld} className="space-y-3 border-t border-border bg-muted/40 px-4 py-3">
        <dl className="text-sm">
          {sakdetaljer(sak).map((rad) => (
            <div key={rad.etikett} className="flex justify-between gap-4 border-b border-border py-1.5 last:border-0">
              <dt className="text-muted-foreground">{rad.etikett}</dt>
              <dd className="min-w-0 text-right font-medium break-words">{rad.varde}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Button variant="outline" onClick={onAndra}>
            <Pencil className="size-4" aria-hidden />
            Ändra
          </Button>
          {sak.produkter && (
            <a
              href={sak.produkter.kalla}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Tillverkarens sida
              <ExternalLink className="size-4" aria-hidden />
              <span className="sr-only">(öppnas i ny flik)</span>
            </a>
          )}
        </div>
      </div>
    </>
  )
}
