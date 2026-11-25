import { useEffect, useState } from 'react'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { KOLUMNER, PassarMed, type Kokval } from '@/components/forrad/PassarMed'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { Katalogprodukt } from '@/lib/typer'

/**
 * Steget efter att en brännare eller ett komplett kök har lagts i förrådet: kokkärl och bränsle ur katalogen som
 * passar, så att hela köket kommer med på en gång. Det man väljer sparas kopplat till brännaren.
 */
export function KokSteg({ sakId, namn, produktId, onKlar }: { sakId: string; namn: string; produktId: string; onKlar: () => void }) {
  const [produkt, setProdukt] = useState<Katalogprodukt | null | 'fel'>(null)
  const [kok, setKok] = useState<Kokval | null>(null)

  useEffect(() => {
    if (!supabase) return
    let avbruten = false
    supabase
      .from('produkter')
      .select(KOLUMNER)
      .eq('id', produktId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!avbruten) setProdukt(error || !data ? 'fel' : (data as Katalogprodukt))
      })
    return () => {
      avbruten = true
    }
  }, [produktId])

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-heading text-xl font-semibold">Kokkärl och bränsle till köket</h3>
        <p className="text-sm text-muted-foreground">
          {namn} ligger nu i förrådet. Lägg till det du har som hör till köket, så sparas allt som ett kök.
        </p>
      </div>
      {produkt === null && (
        <Laddar text="Hämtar det som passar" className="space-y-2">
          <Skelett className="h-11 rounded-lg" />
          <Skelett className="h-11 rounded-lg" />
        </Laddar>
      )}
      {produkt === 'fel' && <Laddfel vad="det som passar ihop i köket" />}
      {produkt && produkt !== 'fel' && (
        <PassarMed produkt={produkt} brannarenFinns kokId={sakId} kok={kok} onKok={setKok} onSparat={onKlar} />
      )}
      <Button variant="outline" onClick={onKlar}>
        {kok?.valda.length ? 'Hoppa över' : 'Klar'}
      </Button>
    </div>
  )
}
