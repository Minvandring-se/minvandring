import { Plus, X } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formateraVikt } from '@/lib/forrad'
import { arKok, kokdelar, kokensVikt, kokForDel, kokkandidater } from '@/lib/forradskok'
import { supabase } from '@/lib/supabase'
import type { Forradssak } from '@/lib/typer'

const FEL = 'Det gick inte att spara. Kontrollera uppkopplingen och försök igen.'
// Databasen stoppade kopplingen (skydda_forradskok), till exempel när köket har ändrats i en annan flik.
const STOPPAD = 'Den här delen kan inte läggas i köket. Ladda om sidan och försök igen.'

function vikt(s: Forradssak) {
  return s.vikt_g === null ? 'Ingen vikt' : formateraVikt(s.vikt_g * s.antal)
}

/**
 * Ditt kök i den utfällda raden. På en brännare eller ett komplett kök: delarna, vad köket väger och det ur förrådet
 * som kan läggas till. På ett kokkärl eller ett bränsle: köket det hör till. Allt sparas direkt.
 */
export function DittKok({ sak, alla, onAndrad }: { sak: Forradssak; alla: Forradssak[]; onAndrad: () => void }) {
  const id = useId()
  const [sparar, setSparar] = useState<string | null>(null)
  const [fel, setFel] = useState('')
  const [visaLagg, setVisaLagg] = useState(false)

  async function koppla(delId: string, kokId: string | null) {
    if (!supabase) return
    setSparar(delId)
    setFel('')
    const { error } = await supabase.from('forradssaker').update({ kok_id: kokId }).eq('id', delId)
    setSparar(null)
    if (error) setFel(error.code === 'P0001' ? STOPPAD : FEL)
    else onAndrad()
  }

  const felruta = fel && (
    <p role="alert" className="text-sm text-destructive">
      {fel}
    </p>
  )

  if (!arKok(sak)) {
    const kok = kokForDel(sak, alla)
    if (!kok) return null
    return (
      <section aria-labelledby={`${id}-rubrik`} className="space-y-2">
        <h3 id={`${id}-rubrik`} className="font-sans text-sm font-semibold">
          Ditt kök
        </h3>
        <p className="text-sm">
          Ingår i köket med <span className="font-medium">{kok.namn}</span>.
        </p>
        <Button variant="ghost" disabled={sparar !== null} onClick={() => koppla(sak.id, null)}>
          <X className="size-4" aria-hidden />
          {sparar ? 'Sparar …' : 'Ta bort ur köket'}
        </Button>
        {felruta}
      </section>
    )
  }

  const delar = kokdelar(sak, alla)
  const { viktG, utanVikt } = kokensVikt(sak, delar)
  const { passar, ovriga } = kokkandidater(sak, alla)
  const kandidater = [...passar, ...ovriga]

  return (
    <section aria-labelledby={`${id}-rubrik`} className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`${id}-rubrik`} className="font-sans text-sm font-semibold">
          Ditt kök
        </h3>
        {delar.length > 0 && (
          <p className="text-sm tabular-nums">
            Väger <span className="font-semibold">{formateraVikt(viktG)}</span>
            {utanVikt > 0 && <span className="text-muted-foreground"> ({utanVikt} utan vikt)</span>}
          </p>
        )}
      </div>

      {delar.length === 0 ? (
        <p className="text-sm text-muted-foreground">Lägg till kokkärl och bränsle ur förrådet. Då ser du vad köket väger och kan ta med allt i packlistan.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {delar.map((d) => (
            <li key={d.id} className="flex min-h-11 items-center gap-3 px-3 py-1">
              <span className="min-w-0 flex-1 text-sm break-words">{d.namn}</span>
              <span className="shrink-0 text-sm tabular-nums">{vikt(d)}</span>
              <Button variant="ghost" size="ikon" disabled={sparar !== null} onClick={() => koppla(d.id, null)} aria-label={`Ta bort ${d.namn} ur köket`}>
                <X className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {kandidater.length > 0 ? (
        <>
          <Button variant="outline" aria-expanded={visaLagg} aria-controls={`${id}-lagg`} onClick={() => setVisaLagg((v) => !v)}>
            <Plus className="size-4" aria-hidden />
            Lägg till ur förrådet
          </Button>
          <div id={`${id}-lagg`} hidden={!visaLagg} className="space-y-3">
            <Kandidatlista rubrik="Passar enligt katalogen" saker={passar} sparar={sparar} onLagg={(d) => koppla(d, sak.id)} />
            <Kandidatlista
              rubrik={passar.length > 0 ? 'Övrigt i förrådet' : 'Kokkärl och bränsle i förrådet'}
              hjalp={sak.produkter ? 'Saker du har skrivit in själv, så appen vet inte om de passar.' : 'Köket är en egen sak, så appen vet inte vad som passar.'}
              saker={ovriga}
              sparar={sparar}
              onLagg={(d) => koppla(d, sak.id)}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Det finns inga kokkärl eller bränsle kvar i förrådet att lägga till.</p>
      )}
      {felruta}
    </section>
  )
}

function Kandidatlista({
  rubrik,
  hjalp,
  saker,
  sparar,
  onLagg,
}: {
  rubrik: string
  hjalp?: string
  saker: Forradssak[]
  sparar: string | null
  onLagg: (id: string) => void
}) {
  if (saker.length === 0) return null
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{rubrik}</p>
      {hjalp && <p className="text-sm text-muted-foreground">{hjalp}</p>}
      <ul className="divide-y divide-border">
        {saker.map((s) => (
          <li key={s.id} className="flex min-h-11 items-center gap-3 py-1">
            <span className="min-w-0 flex-1 text-sm break-words">{s.namn}</span>
            <span className="shrink-0 text-sm tabular-nums">{vikt(s)}</span>
            <Button variant="outline" disabled={sparar !== null} onClick={() => onLagg(s.id)} aria-label={`Lägg till ${s.namn} i köket`}>
              {sparar === s.id ? 'Sparar …' : 'Lägg till'}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
