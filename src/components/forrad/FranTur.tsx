import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { Button } from '@/components/ui/button'
import { formateraVikt } from '@/lib/forrad'
import { franTur, type Turkandidat } from '@/lib/forradTillagg'
import { supabase } from '@/lib/supabase'
import type { PackradRad, PackstatusRad } from '@/lib/typer'

type Tur = { id: string; namn: string }

const fokus = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'

async function hamtaTurer(): Promise<Tur[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('turer').select('id, namn, avresa, skapad').order('avresa', { ascending: false, nullsFirst: false }).order('skapad', { ascending: false })
  return error ? null : ((data as Tur[] | null) ?? [])
}

/** Det jag bär i turen, som saker till förrådet. null när det inte gick att hämta. */
async function hamtaKandidater(turId: string, forrad: readonly { namn: string; produkt_id: string | null }[]): Promise<Turkandidat[] | null> {
  if (!supabase) return null
  const { data: anv } = await supabase.auth.getUser()
  if (!anv.user) return null
  const [jag, rader, status] = await Promise.all([
    supabase.from('deltagare').select('id').eq('tur_id', turId).eq('user_id', anv.user.id).maybeSingle(),
    supabase.from('packrader').select('*').eq('tur_id', turId),
    supabase.from('packstatus').select('*').eq('tur_id', turId),
  ])
  if (jag.error || rader.error || status.error || !jag.data) return null
  return franTur(rader.data as PackradRad[], status.data as PackstatusRad[], (jag.data as { id: string }).id, forrad)
}

/**
 * Lägg det man redan har i en turs packlista i förrådet: det man bär själv och det alla ska ha, med ens egen modell.
 * Det som redan finns i förrådet är inte valt från början.
 */
export function FranTur({
  forrad,
  onTillagda,
  onTillbaka,
}: {
  forrad: readonly { namn: string; produkt_id: string | null }[]
  onTillagda: (saker: { sakId: string; namn: string }[]) => void
  onTillbaka: () => void
}) {
  const [turer, setTurer] = useState<Tur[] | null | 'fel'>(null)
  const [vald, setVald] = useState<Tur | null>(null)
  const [kandidater, setKandidater] = useState<Turkandidat[] | null | 'fel'>(null)
  const [valda, setValda] = useState<Set<string>>(new Set())
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState(false)

  useEffect(() => {
    let aktuell = true
    hamtaTurer().then((t) => aktuell && setTurer(t ?? 'fel'))
    return () => {
      aktuell = false
    }
  }, [])

  async function valjTur(t: Tur) {
    setVald(t)
    setKandidater(null)
    const k = await hamtaKandidater(t.id, forrad)
    setKandidater(k ?? 'fel')
    if (k) setValda(new Set(k.filter((x) => !x.finnsRedan).map((x) => x.id)))
  }

  async function laggTill() {
    if (!supabase || !Array.isArray(kandidater)) return
    const nya = kandidater.filter((k) => valda.has(k.id))
    if (nya.length === 0) return
    setSparar(true)
    setFel(false)
    const { data, error } = await supabase.from('forradssaker').insert(nya.map((k) => k.varden)).select('id, namn')
    setSparar(false)
    if (error || !data) return setFel(true)
    onTillagda((data as { id: string; namn: string }[]).map((d) => ({ sakId: d.id, namn: d.namn })))
  }

  const tillbaka = (
    <Button variant="ghost" className="-ml-3" onClick={vald ? () => setVald(null) : onTillbaka}>
      <ArrowLeft className="size-4" aria-hidden />
      {vald ? 'Välj en annan tur' : 'Tillbaka till sökningen'}
    </Button>
  )

  if (!vald)
    return (
      <div className="space-y-3">
        {tillbaka}
        <h3 className="font-heading text-xl font-semibold">Från en tur</h3>
        <p className="text-sm text-muted-foreground">Välj en tur, så visas det du bär själv och det alla ska ha i packlistan.</p>
        {turer === null && (
          <Laddar text="Hämtar dina turer" className="space-y-2">
            <Skelett className="h-11 rounded-lg" />
            <Skelett className="h-11 rounded-lg" />
          </Laddar>
        )}
        {turer === 'fel' && <Laddfel vad="dina turer" />}
        {Array.isArray(turer) && turer.length === 0 && <TomtLage kompakt text="Du är inte med i någon tur än." />}
        {Array.isArray(turer) && turer.length > 0 && (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {turer.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => valjTur(t)} className={`flex min-h-11 w-full items-center px-3 py-2 text-left font-medium break-words hover:bg-muted ${fokus}`}>
                  {t.namn}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )

  const antal = valda.size
  return (
    <div className="space-y-3">
      {tillbaka}
      <h3 className="font-heading text-xl font-semibold break-words">Från {vald.namn}</h3>
      {kandidater === null && (
        <Laddar text="Hämtar packlistan" className="space-y-2">
          <Skelett className="h-11 rounded-lg" />
          <Skelett className="h-11 rounded-lg" />
        </Laddar>
      )}
      {kandidater === 'fel' && <Laddfel vad="packlistan" onForsokIgen={() => valjTur(vald)} />}
      {Array.isArray(kandidater) && kandidater.length === 0 && <TomtLage kompakt text="Du bär inget själv i den här turen än." />}
      {Array.isArray(kandidater) && kandidater.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">Det som redan finns i ditt förråd är inte valt.</p>
          <ul className="divide-y divide-border">
            {kandidater.map((k) => (
              <li key={k.id}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={valda.has(k.id)}
                    onChange={(e) =>
                      setValda((v) => {
                        const ny = new Set(v)
                        if (e.target.checked) ny.add(k.id)
                        else ny.delete(k.id)
                        return ny
                      })
                    }
                    className="size-5 shrink-0 accent-primary"
                  />
                  <span className="min-w-0 flex-1 break-words">
                    {k.varden.antal > 1 && `${k.varden.antal} × `}
                    {k.varden.namn}
                    {k.finnsRedan && <span className="block text-sm text-muted-foreground">Finns redan i ditt förråd</span>}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums">{k.varden.vikt_g === null ? 'Ingen vikt' : formateraVikt(k.varden.vikt_g * k.varden.antal)}</span>
                </label>
              </li>
            ))}
          </ul>
          {fel && (
            <p role="alert" className="text-sm text-destructive">
              Det gick inte att lägga till. Kontrollera uppkopplingen och försök igen.
            </p>
          )}
          <Button disabled={sparar || antal === 0} onClick={laggTill}>
            {sparar ? 'Lägger till …' : antal === 1 ? 'Lägg till 1 sak' : `Lägg till ${antal} saker`}
          </Button>
        </>
      )}
    </div>
  )
}
