import { Check, ChevronDown, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { Button } from '@/components/ui/button'
import { formateraVikt, underkategoriFor } from '@/lib/forrad'
import { BRANSLE, bransleMed, bransleRubrik, gemensamtSystem, KOKKARL, KOKVARMARE, kokvikt, passarMed, passarMedRubrik, sakerForKok } from '@/lib/kokkarl'
import { visaEgenskaper } from '@/lib/produktegenskaper'
import { produktnamn } from '@/lib/produktsok'
import { supabase } from '@/lib/supabase'
import type { Katalogprodukt } from '@/lib/typer'
import { cn } from '@/lib/utils'

/** Kolumnerna som katalogen hämtar för en produkt, med egenskaperna som avgör vad som passar ihop. */
export const KOLUMNER = 'id, marke, modell, version, kategori, underkategori, packvikt_g, kontrollerad, granskad, kalla_typ, minvikt_g, pris_sek_ca, kalla, egenskaper'

/** Brännaren och kokkärlen man har valt till den i Ditt kök. */
export type Kokval = { for: string; valda: Katalogprodukt[] }

/** Så många visas under Passar med innan man fäller ut resten. */
const FORST_PASSAR = 5
/** Supabase lämnar högst 1 000 rader per fråga. */
const OMGANG = 1000

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const radKlass = 'flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2 text-left text-sm'

function Radinnehall({ p, under }: { p: Katalogprodukt; under: string }) {
  return (
    <>
      <span className="min-w-0 break-words">
        {[p.marke, p.modell, p.version].filter(Boolean).join(' ')}
        <span className="block text-muted-foreground">{under}</span>
      </span>
      <span className="shrink-0 tabular-nums">{formateraVikt(p.packvikt_g)}</span>
    </>
  )
}

/**
 * Sparar köket i förrådet: brännaren, om den inte redan finns, och delarna kopplade till den med kok_id.
 * kokId är brännaren i förrådet när den är känd. Annars används den första som inte själv hör till ett annat kök.
 * Ger true om något gick fel.
 */
async function sparaKok(produkt: Katalogprodukt, saker: ReturnType<typeof sakerForKok>, brannarenFinns: boolean, kokId?: string): Promise<boolean> {
  if (!supabase) return true
  const delar = brannarenFinns ? saker : saker.slice(1)
  const kok = kokId
    ? { data: { id: kokId }, error: null }
    : brannarenFinns
      ? await supabase.from('forradssaker').select('id').eq('produkt_id', produkt.id).is('kok_id', null).order('skapad').limit(1).maybeSingle()
      : await supabase.from('forradssaker').insert(saker[0]).select('id').single()
  if (kok.error) return true
  if (delar.length === 0) return false
  const { error } = await supabase.from('forradssaker').insert(delar.map((d) => ({ ...d, kok_id: kok.data?.id ?? null })))
  return Boolean(error)
}

/**
 * Det som passar ihop med produkten i köket: kokkärl, stekpannor och bränsle till en brännare eller ett komplett kök,
 * och brännare och kompletta kök till ett kokkärl eller ett bränsle. På en brännare kan man lägga till kokkärl och
 * bränsle i "Ditt kök", som visar den sammanlagda vikten och lägger delarna i förrådet kopplade till brännaren.
 */
export function PassarMed({
  produkt,
  brannarenFinns,
  kokId,
  kok,
  onKok,
  onOppna,
  onSparat,
}: {
  produkt: Katalogprodukt
  brannarenFinns: boolean
  /** Brännaren i förrådet, när den just har lagts dit. */
  kokId?: string
  kok: Kokval | null
  onKok: (k: Kokval) => void
  /** Öppnar en produkt i katalogen. Utan den går raden inte att trycka på. */
  onOppna?: (id: string) => void
  onSparat: (produkter: Katalogprodukt[]) => void
}) {
  const rubrik = passarMedRubrik(produkt.underkategori)
  const brRubrik = bransleRubrik(produkt.underkategori)
  const harKok = Boolean(rubrik || brRubrik)
  const [kandidater, setKandidater] = useState<{ for: string; produkter: Katalogprodukt[] | 'fel' } | null>(null)
  const [visaAlla, setVisaAlla] = useState<Record<string, boolean>>({})
  const valda = kok?.for === produkt.id ? kok.valda : []
  const setValda = (f: (v: Katalogprodukt[]) => Katalogprodukt[]) => onKok({ for: produkt.id, valda: f(valda) })
  const [sparar, setSparar] = useState(false)
  const [besked, setBesked] = useState<{ fel: boolean; text: string } | null>(null)
  // Vad som just hände, för skärmläsare. Finns hela tiden, så att det läses upp.
  const [status, setStatus] = useState('')
  const beskedRef = useRef<HTMLParagraphElement>(null)
  const kokRubrik = useRef<HTMLHeadingElement>(null)
  const kanValja = (KOKVARMARE as readonly string[]).includes(produkt.underkategori)

  useEffect(() => {
    if (!supabase || !harKok) return
    let avbruten = false
    supabase
      .from('produkter')
      .select(KOLUMNER)
      .eq('kategori', 'kok')
      .in('underkategori', [...KOKVARMARE, KOKKARL, BRANSLE])
      .limit(OMGANG)
      .then(({ data, error }) => {
        if (!avbruten) setKandidater({ for: produkt.id, produkter: error ? 'fel' : ((data as Katalogprodukt[] | null) ?? []) })
      })
    return () => {
      avbruten = true
    }
  }, [produkt.id, harKok])

  if (!harKok) return null
  const hamtade = kandidater?.for === produkt.id && kandidater.produkter !== 'fel' ? kandidater.produkter : null
  // Panelen går att stänga och öppna igen, så felet har ingen Försök igen.
  if (kandidater?.for === produkt.id && kandidater.produkter === 'fel') return <Laddfel vad="det som passar ihop i köket" />
  const grupper = [
    rubrik && { id: 'kokkarl', rubrik, lista: hamtade && passarMed(produkt, hamtade) },
    brRubrik && { id: 'bransle', rubrik: brRubrik, lista: hamtade && bransleMed(produkt, hamtade) },
  ].filter((g) => !!g)
  // "Gjord för Trangia 27" på det som delar kokkärlssystem med produkten.
  const gjordFor = (p: Katalogprodukt) => {
    const system = gemensamtSystem(produkt.egenskaper, p.egenskaper)
    return system ? visaEgenskaper(KOKKARL, { system })[0]?.varde : null
  }
  const underText = (p: Katalogprodukt) =>
    [underkategoriFor(p.kategori, p.underkategori)?.etikett, gjordFor(p) && `Gjord för ${gjordFor(p)}`].filter(Boolean).join(', ')
  const arVald = (p: Katalogprodukt) => valda.some((v) => v.id === p.id)
  const vaxla = (p: Katalogprodukt) => {
    const namn = [p.marke, p.modell, p.version].filter(Boolean).join(' ')
    setBesked(null)
    setStatus(arVald(p) ? `Borttagen ur ditt kök: ${namn}` : `Tillagd i ditt kök: ${namn}`)
    setValda((v) => (v.some((x) => x.id === p.id) ? v.filter((x) => x.id !== p.id) : [...v, p]))
  }

  async function spara() {
    if (!supabase) return
    setSparar(true)
    setBesked(null)
    const saker = sakerForKok(produkt, valda, brannarenFinns)
    const error = await sparaKok(produkt, saker, brannarenFinns, kokId)
    setSparar(false)
    if (error) {
      setBesked({ fel: true, text: 'Det gick inte att spara. Kontrollera uppkopplingen och försök igen.' })
      return
    }
    onSparat(brannarenFinns ? valda : [produkt, ...valda])
    setBesked({ fel: false, text: saker.length === 1 ? 'En sak ligger nu i förrådet.' : `${saker.length} saker ligger nu i förrådet.` })
    setValda(() => [])
    // Knappen försvinner, så fokus flyttas till beskedet.
    requestAnimationFrame(() => beskedRef.current?.focus())
  }

  return (
    <section aria-label="Passar ihop i köket" className="space-y-5">
      {grupper.map(({ id, rubrik, lista }) => {
        const synliga = lista && !visaAlla[id] ? lista.slice(0, FORST_PASSAR) : lista
        return (
          <div key={id} className="space-y-3">
            <h3 id={`passar-${id}-${produkt.id}`} className="font-heading text-lg font-semibold">
              {rubrik}
            </h3>
            {!lista && (
              <Laddar text="Hämtar det som passar" className="space-y-2">
                <Skelett className="h-11 rounded-lg" />
                <Skelett className="h-11 rounded-lg" />
              </Laddar>
            )}
            {lista?.length === 0 && <TomtLage kompakt text="Inget i katalogen än." />}
            {lista && lista.length > 0 && (
              <ul aria-labelledby={`passar-${id}-${produkt.id}`} className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {synliga?.map((p) => (
                  <li key={p.id} className="flex items-stretch">
                    {onOppna ? (
                      <button
                        type="button"
                        onClick={() => onOppna(p.id)}
                        className={cn(radKlass, 'hover:bg-muted', fokus, 'focus-visible:-outline-offset-2')}
                      >
                        <Radinnehall p={p} under={underText(p)} />
                      </button>
                    ) : (
                      <div className={radKlass}>
                        <Radinnehall p={p} under={underText(p)} />
                      </div>
                    )}
                    {kanValja && (
                      <button
                        type="button"
                        onClick={() => vaxla(p)}
                        className={cn(
                          'flex min-h-11 w-24 shrink-0 items-center justify-center gap-1 border-l border-border px-2 text-sm font-medium',
                          fokus,
                          'focus-visible:-outline-offset-2',
                          arVald(p) ? 'bg-primary-soft text-primary' : 'text-primary hover:bg-muted',
                        )}
                      >
                        {arVald(p) ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
                        {arVald(p) ? 'Tillagd' : 'Lägg till'}
                        <span className="sr-only"> {[p.marke, p.modell, p.version].filter(Boolean).join(' ')}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {lista && lista.length > FORST_PASSAR && (
              <button
                type="button"
                aria-expanded={!!visaAlla[id]}
                onClick={() => setVisaAlla((v) => ({ ...v, [id]: !v[id] }))}
                className={cn('inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary', fokus)}
              >
                {visaAlla[id] ? 'Visa färre' : `Visa alla (${lista.length})`}
                <ChevronDown className={cn('size-4 transition-transform', visaAlla[id] && 'rotate-180')} aria-hidden />
              </button>
            )}
          </div>
        )
      })}

      {kanValja && (valda.length > 0 || besked) && (
        <div className="space-y-2 rounded-lg border border-primary bg-primary-soft p-3">
          {valda.length > 0 && (
            <>
              <h3 ref={kokRubrik} tabIndex={-1} className="font-heading text-lg font-semibold focus:outline-none">
                Ditt kök
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between gap-3">
                  <span className="min-w-0 break-words">
                    {produktnamn(produkt)} {produkt.version}
                    {brannarenFinns && <span className="text-muted-foreground"> (finns redan i förrådet)</span>}
                  </span>
                  <span className="shrink-0 tabular-nums">{formateraVikt(produkt.packvikt_g)}</span>
                </li>
                {valda.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 break-words">{[v.marke, v.modell, v.version].filter(Boolean).join(' ')}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <span className="tabular-nums">{formateraVikt(v.packvikt_g)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          vaxla(v)
                          kokRubrik.current?.focus()
                        }}
                        aria-label={`Ta bort ${v.modell} ur ditt kök`} className={cn('flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground', fokus)}>
                        <X className="size-4" aria-hidden />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
                <span>Tillsammans</span>
                <span className="tabular-nums">{formateraVikt(kokvikt([produkt, ...valda]))}</span>
              </p>
              <Button variant="outline" onClick={spara} disabled={sparar}>
                {sparar ? 'Sparar …' : 'Lägg köket i förrådet'}
              </Button>
            </>
          )}
          {besked && (
            <p ref={beskedRef} tabIndex={-1} className={cn('text-sm focus:outline-none', besked.fel ? 'text-destructive' : 'font-medium')}>
              {besked.text}
            </p>
          )}
        </div>
      )}

      <p role="status" className="sr-only">
        {status}
      </p>
    </section>
  )
}
