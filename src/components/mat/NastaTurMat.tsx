import { ArrowRight } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Skelett } from '@/components/app/Laddar'
import { Bildkort } from '@/components/ui/bildkort'
import { knappStil } from '@/components/ui/knappStil'
import { Hojdkurvor } from '@/components/ui/sokruta'
import { Turbild } from '@/components/ui/turbild'
import { dagensDatum } from '@/lib/datum'
import { borjaMed, maltidsAdress, matplanstext, saknasText, type Matstatus } from '@/lib/mat'
import { turdelAdress } from '@/lib/turdelar'
import type { DinTur } from '@/hooks/useDinaTurer'
import { datumIntervall, lage, lokaltDatum } from '@/lib/turlista'
import { cn } from '@/lib/utils'

/**
 * Nästa tur på Mina matplaner: den mörkgröna ytan med turens namn, datum, hur många måltider som saknas (i hjortron)
 * och knappen Planera maten, som öppnar turens matflik vid den första måltiden som saknas. Till höger, och överst i
 * mobil, ett foto utan text. Går fotot inte att visa visas turens tecknade bild i stället.
 */
export function NastaTurMat({ tur, status }: { tur: DinTur; status: Matstatus | null | 'fel' }) {
  const id = useId()
  // Delas än så länge bara ut till pågående och kommande turer, men en avslutad tur följer samma regel som i listan.
  const avslutad = lage(tur, lokaltDatum()) === 'tidigare'
  const klar = status !== null && status !== 'fel' && status.totalt > 0 && status.saknas === 0
  const forsta = status !== null && status !== 'fel' && !avslutad ? status.forsta : null
  const till = forsta ? maltidsAdress(tur.id, forsta.dag.dag, forsta.maltid) : turdelAdress(tur.id, 'mat')

  return (
    <Bildkort
      element="section"
      aria-labelledby={id}
      ton="stark"
      bild={<Matfoto turId={tur.id} />}
      // Utan sken: bilden ligger redan till höger, och skenet skulle synas som en kant mot bågen och toningen.
      bakgrund={<Hojdkurvor variant="tur" sken={false} className="-z-10" />}
      textKlass="gap-4 px-6 pt-1 pb-6 sm:px-8 sm:pb-8 @2xl:p-8">
      <p className="text-sm text-yta-stark-muted lg:text-[0.9375rem]">Nästa tur</p>
      <h2 id={id} className="text-[1.875rem] leading-tight wrap-anywhere lg:text-[2.75rem]">
        {tur.namn}
      </h2>
      {/* Två rader under 380 px, annars en rad med en tunn linje emellan. */}
      <ul className="flex flex-col gap-y-1 text-[0.9375rem] text-yta-stark-muted min-[23.75rem]:flex-row lg:text-base">
        <li className="min-[23.75rem]:pr-4">{datumIntervall(tur.avresa, tur.hemkomst)}</li>
        {tur.dagar !== null && (
          <li className="min-[23.75rem]:border-l min-[23.75rem]:border-yta-stark-linje min-[23.75rem]:pl-4">
            {tur.dagar} {tur.dagar === 1 ? 'vandringsdag' : 'vandringsdagar'}
          </li>
        )}
      </ul>
      <Status tur={tur} status={status} avslutad={avslutad} />
      <Link to={till} className={cn(knappStil({ variant: 'ljus', size: 'lg' }), 'mt-1 w-full sm:w-auto sm:self-start')}>
        {klar || avslutad ? 'Öppna matplanen' : 'Planera maten'}
        <ArrowRight className="size-[1.125rem]" aria-hidden />
      </Link>
    </Bildkort>
  )
}

function Status({ tur, status, avslutad }: { tur: DinTur; status: Matstatus | null | 'fel'; avslutad: boolean }) {
  // Felet visas en gång ovanför listorna, inte här.
  if (status === 'fel') return null
  if (status === null)
    return (
      <div aria-hidden className="space-y-2">
        <Skelett className="h-7 w-48 bg-yta-stark-linje" />
        <Skelett className="h-4 w-64 bg-yta-stark-linje" />
      </div>
    )
  const text = matplanstext(status, avslutad)
  if (text === null) return null
  if (text === 'inga-dagar') return <p className="text-yta-stark-muted">Ange antalet vandringsdagar i turens översikt, så delas matplanen upp dag för dag.</p>
  if (text === 'klar') return <p className="font-heading text-2xl font-semibold text-hjortron lg:text-[1.75rem]">Matplanen är klar</p>
  return (
    <div className="space-y-1">
      <p className="font-heading text-2xl font-semibold text-hjortron lg:text-[1.75rem]">{saknasText(status.saknas)}</p>
      {status.forsta && <p className="text-[0.9375rem] text-yta-stark-muted">{borjaMed(status.forsta, dagensDatum(tur.avresa, status.forsta.dag.dag))}</p>}
    </div>
  )
}

/** Fotot av stekpannan över elden (Ivan Shemereko, Unsplash), i två storlekar. Fyller bildkortets bildruta. */
function Matfoto({ turId }: { turId: string }) {
  const [fel, setFel] = useState(false)
  return (
    <>
      {fel ? (
        <Turbild turId={turId} className="absolute inset-0 size-full" />
      ) : (
        <img
          src="/bilder/mat-stekpanna-640.webp"
          srcSet="/bilder/mat-stekpanna-640.webp 640w, /bilder/mat-stekpanna-1280.webp 1280w"
          sizes="(min-width: 768px) 45vw, 100vw"
          alt=""
          width={1280}
          height={854}
          decoding="async"
          onError={() => setFel(true)}
          className="absolute inset-0 size-full object-cover object-[50%_45%]"
        />
      )}
    </>
  )
}
