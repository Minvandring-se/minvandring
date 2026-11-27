import { useEffect, useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MEJLVAL, type Mejlinstallningar, type Mejlval as Val } from '@/lib/mejl'
import { supabase } from '@/lib/supabase'

/**
 * Vilka notiser som också kommer som mejl. Raden i notisinstallningar skapas när man ändrar något första gången,
 * annars gäller standardvärdena. Har man avregistrerat sig via länken i ett mejl går mejlen att slå på igen här.
 */
export function Mejlval({ anvandarId }: { anvandarId: string | null }) {
  const id = useId()
  const [val, setVal] = useState<Mejlinstallningar | null | 'fel'>(null)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState('')

  // Räknas upp när mejlen slås på igen, så att valen hämtas på nytt.
  const [omgang, setOmgang] = useState(0)

  useEffect(() => {
    if (!supabase || !anvandarId) return
    let aktuell = true
    supabase
      .from('notisinstallningar')
      .select('mejl_tillagd_i_tur, mejl_vanforfragan, mejl_paminnelser, mejl_auto_paminnelser, avregistrerad')
      .eq('user_id', anvandarId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!aktuell) return
        setVal(error ? 'fel' : ((data as Mejlinstallningar | null) ?? { mejl_tillagd_i_tur: true, mejl_vanforfragan: true, mejl_paminnelser: true, mejl_auto_paminnelser: false, avregistrerad: null }))
      })
    return () => {
      aktuell = false
    }
  }, [anvandarId, omgang])

  async function andra(nyckel: Val, pa: boolean) {
    if (!supabase || !anvandarId || val === null || val === 'fel') return
    setSparar(true)
    setFel('')
    const { error } = await supabase.from('notisinstallningar').upsert({ user_id: anvandarId, [nyckel]: pa })
    setSparar(false)
    if (error) return setFel('Det gick inte att spara. Försök igen.')
    setVal({ ...val, [nyckel]: pa })
  }

  async function slaPaIgen() {
    if (!supabase) return
    setSparar(true)
    const { error } = await supabase.rpc('mejl_pa_igen')
    setSparar(false)
    if (error) return setFel('Det gick inte att slå på mejlen. Försök igen.')
    setOmgang((n) => n + 1)
  }

  if (val === null) return <p className="text-sm text-muted-foreground">Hämtar …</p>
  if (val === 'fel') return <p className="text-sm text-destructive">Det gick inte att hämta dina val för mejl.</p>

  return (
    <div className="space-y-3">
      {val.avregistrerad ? (
        <div className="space-y-2">
          <p className="text-sm">Du har avregistrerat dig, så MinVandring skickar inga mejl till dig.</p>
          <Button variant="outline" onClick={slaPaIgen} disabled={sparar}>
            Slå på mejlen igen
          </Button>
        </div>
      ) : (
        <fieldset className="space-y-1" disabled={sparar}>
          <legend className="mb-1 text-sm text-muted-foreground">Mejla mig när</legend>
          {MEJLVAL.map((m) => (
            <label key={m.nyckel} htmlFor={`${id}-${m.nyckel}`} className="flex min-h-11 items-center gap-3">
              <input id={`${id}-${m.nyckel}`} type="checkbox" checked={val[m.nyckel]} onChange={(e) => andra(m.nyckel, e.target.checked)} className="size-5 accent-primary" />
              <span>{m.etikett}</span>
            </label>
          ))}
        </fieldset>
      )}
      <p className="text-sm text-muted-foreground">Mejlen går till adressen du loggar in med. Varje mejl har en länk för att avregistrera dig.</p>
      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}
    </div>
  )
}
