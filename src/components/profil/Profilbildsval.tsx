import { ImagePlus, Trash2 } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { Skelett } from '@/components/app/Laddar'
import { Namnbricka } from '@/components/app/Namnbricka'
import { Button } from '@/components/ui/button'
import { arProfilbildHamtad, glomProfilbild, useProfilbilder } from '@/hooks/useProfilbilder'
import { FILVALJARE_ACCEPT, PROFILBILD_BUCKET, bildsokvag, forminskaBild, kontrolleraFil } from '@/lib/profilbild'
import { supabase } from '@/lib/supabase'

interface Props {
  anvandarId: string
  /** Namnet eller mejladressen, för bokstaven som visas när bild saknas. */
  namn: string
  /** När bilden senast byttes. null när bild saknas. */
  bildUppdaterad: string | null
  /** Bilden har sparats (ny tid) eller tagits bort (null). */
  onAndrad: (bildUppdaterad: string | null) => void
  /** Profilen hämtas fortfarande, så vi vet inte om det finns en bild. */
  laddar?: boolean
}

type Besked = { sort: 'ok' | 'fel'; text: string } | null

/**
 * Profilbilden i Profil: välj en bild, se den beskuren och förminskad, och spara eller avbryt.
 * Bilden görs om i webbläsaren innan den laddas upp, så originalet lämnar aldrig enheten.
 */
export function Profilbildsval({ anvandarId, namn, bildUppdaterad, onAndrad, laddar = false }: Props) {
  const id = useId()
  const filfalt = useRef<HTMLInputElement>(null)
  const [vald, setVald] = useState<{ blob: Blob; adress: string } | null>(null)
  const [arbetar, setArbetar] = useState<'laser' | 'sparar' | 'tarbort' | null>(null)
  const [besked, setBesked] = useState<Besked>(null)
  const sparad = useProfilbilder(bildUppdaterad ? [anvandarId] : [], bildUppdaterad)[anvandarId]
  // Platshållare tills vi vet om det finns en bild, och tills bilden i så fall har hämtats.
  const bildLaddar = laddar || (!!bildUppdaterad && !sparad && !arProfilbildHamtad(anvandarId))

  // Förhandsvisningens adress pekar på bilden i minnet och ska lämnas tillbaka när den inte används.
  useEffect(() => {
    if (!vald) return
    return () => URL.revokeObjectURL(vald.adress)
  }, [vald])

  async function valjFil(e: ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0]
    // Töms, så att samma fil går att välja igen efter ett fel eller ett avbrott.
    e.target.value = ''
    if (!fil) return
    const fel = kontrolleraFil(fil)
    if (fel) {
      setBesked({ sort: 'fel', text: fel })
      return
    }
    setArbetar('laser')
    setBesked(null)
    try {
      const blob = await forminskaBild(fil)
      setVald({ blob, adress: URL.createObjectURL(blob) })
    } catch {
      setBesked({ sort: 'fel', text: 'Bilden gick inte att läsa. Prova en annan bild.' })
    } finally {
      setArbetar(null)
    }
  }

  async function spara() {
    if (!supabase || !vald) return
    setArbetar('sparar')
    setBesked(null)
    const uppladdning = await supabase.storage
      .from(PROFILBILD_BUCKET)
      .upload(bildsokvag(anvandarId), vald.blob, { upsert: true, contentType: vald.blob.type, cacheControl: '3600' })
    const nu = new Date().toISOString()
    const profil = uppladdning.error ? null : await supabase.from('profiler').update({ bild_uppdaterad: nu }).eq('id', anvandarId)
    setArbetar(null)
    if (uppladdning.error || profil?.error) {
      // Förhandsvisningen står kvar, så att samma knapp går att trycka igen.
      setBesked({ sort: 'fel', text: 'Bilden gick inte att spara. Kontrollera uppkopplingen och försök igen.' })
      return
    }
    glomProfilbild(anvandarId)
    setVald(null)
    onAndrad(nu)
    setBesked({ sort: 'ok', text: 'Bilden har sparats.' })
  }

  async function taBort() {
    if (!supabase) return
    setArbetar('tarbort')
    setBesked(null)
    const borttagning = await supabase.storage.from(PROFILBILD_BUCKET).remove([bildsokvag(anvandarId)])
    const profil = borttagning.error ? null : await supabase.from('profiler').update({ bild_uppdaterad: null }).eq('id', anvandarId)
    setArbetar(null)
    if (borttagning.error || profil?.error) {
      setBesked({ sort: 'fel', text: 'Bilden gick inte att ta bort. Kontrollera uppkopplingen och försök igen.' })
      return
    }
    glomProfilbild(anvandarId)
    onAndrad(null)
    setBesked({ sort: 'ok', text: 'Bilden är borttagen.' })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <Namnbricka namn={namn} bild={vald?.adress ?? sparad} laddar={bildLaddar && !vald} className="size-20 text-xl" />
        <div className="flex flex-wrap gap-2">
          {laddar ? (
            <Skelett className="h-11 w-32" />
          ) : vald ? (
            <>
              <Button type="button" disabled={arbetar !== null} onClick={spara}>
                {arbetar === 'sparar' ? 'Sparar …' : 'Spara bild'}
              </Button>
              <Button type="button" variant="outline" disabled={arbetar !== null} onClick={() => setVald(null)}>
                Avbryt
              </Button>
            </>
          ) : (
            <>
              {/* Filfältet är dolt och öppnas av knappen. Med de här filtyperna gör en iPhone om HEIC till JPEG. */}
              <input ref={filfalt} id={`${id}-fil`} type="file" accept={FILVALJARE_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden onChange={valjFil} />
              <Button type="button" variant="outline" disabled={arbetar !== null} onClick={() => filfalt.current?.click()}>
                <ImagePlus className="size-4" aria-hidden />
                {arbetar === 'laser' ? 'Läser bilden …' : bildUppdaterad ? 'Byt bild' : 'Välj bild'}
              </Button>
              {bildUppdaterad && (
                <Button type="button" variant="ghost" disabled={arbetar !== null} onClick={taBort}>
                  <Trash2 className="size-4" aria-hidden />
                  {arbetar === 'tarbort' ? 'Tar bort …' : 'Ta bort bild'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {vald ? 'Så här kommer bilden att se ut.' : 'JPG, PNG eller WebP, högst 10 MB. Bilden syns för dig och dem du delar en tur med.'}
      </p>
      <p role="status" aria-live="polite" className="min-h-5 text-sm">
        {besked && <span className={besked.sort === 'ok' ? 'font-medium text-primary' : 'text-destructive'}>{besked.text}</span>}
      </p>
    </div>
  )
}
