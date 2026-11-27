import { Plus } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { Mallkort } from '@/components/packlistor/Mallkort'
import { Startmallkort } from '@/components/packlistor/Startmallkort'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { skapaMall, usePackmallar } from '@/hooks/usePackmallar'
import { useSidtitel } from '@/hooks/useSidtitel'
import { MALLNAMN_MAX, tolkaMallnamn } from '@/lib/packmallar'
import { STARTMALLAR } from '@/lib/startmallar'

/** Packlistor: dina egna packlistor, som bara du ser, och MinVandrings startmallar. Ett kort öppnar listan. */
export function Packlistor() {
  useSidtitel('Packlistor')
  const { lage, laddaOm } = usePackmallar()
  const [ny, setNy] = useState(false)

  return (
    <div className="space-y-6">
      <SidRubrik
        rubrik="Packlistor"
        text="Dina egna packlistor och färdiga listor att starta från. Lägg en packlista i en tur med Från packlista under Packning."
        knappar={
          !ny && (
            <Button onClick={() => setNy(true)}>
              <Plus className="size-4 text-hjortron-ikon" aria-hidden />
              Ny packlista
            </Button>
          )
        }
      />
      {ny && <NyPacklista onAvbryt={() => setNy(false)} />}

      <section aria-labelledby="dina-packlistor" className="space-y-3">
        <h2 id="dina-packlistor" className="text-xl lg:text-2xl">
          Dina packlistor
        </h2>
        <p className="text-sm text-muted-foreground">Gör en ny, spara en från Packning i en tur eller gör en färdig lista till din egen. Bara du ser dem.</p>
        {lage.lage === 'laddar' && (
          <Laddar text="Hämtar dina packlistor" className="grid gap-3 md:grid-cols-2">
            <Skelett className="h-24 rounded-lg" />
            <Skelett className="h-24 rounded-lg" />
          </Laddar>
        )}
        {lage.lage === 'fel' && <Laddfel vad="dina packlistor" onForsokIgen={laddaOm} />}
        {lage.lage === 'klar' &&
          (lage.mallar.length === 0 ? (
            <TomtLage kompakt rubrik="Inga packlistor än" text="Börja med en färdig lista nedanför, eller gör en ny packlista." />
          ) : (
            <ul className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
              {lage.mallar.map((m) => (
                <Mallkort key={m.id} mall={m} />
              ))}
            </ul>
          ))}
      </section>

      <section aria-labelledby="fran-minvandring" className="space-y-3">
        <h2 id="fran-minvandring" className="text-xl lg:text-2xl">
          Från MinVandring
        </h2>
        <p className="text-sm text-muted-foreground">Färdiga listor utan vikter. Gör en till din egen för att ändra den.</p>
        <ul className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          {STARTMALLAR.map((m) => (
            <Startmallkort key={m.id} mall={m} />
          ))}
        </ul>
      </section>
    </div>
  )
}

function NyPacklista({ onAvbryt }: { onAvbryt: () => void }) {
  const id = useId()
  const navigate = useNavigate()
  const [namn, setNamn] = useState('')
  const [fel, setFel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)

  async function skapa(e: FormEvent) {
    e.preventDefault()
    const t = tolkaMallnamn(namn)
    if ('fel' in t) return setFel(t.fel)
    setFel(null)
    setSparar(true)
    const r = await skapaMall(t.namn)
    setSparar(false)
    if ('fel' in r) return setFel(r.fel === 'namnet-finns' ? 'Du har redan en packlista med det namnet.' : 'Det gick inte att skapa packlistan. Kontrollera uppkopplingen och försök igen.')
    navigate(`/packlistor/${r.id}`)
  }

  return (
    <form onSubmit={skapa} noValidate className="space-y-2 rounded-lg border border-border bg-card p-4">
      <label htmlFor={id} className="block text-sm font-medium">
        Namn på packlistan
      </label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={id}
          value={namn}
          maxLength={MALLNAMN_MAX}
          placeholder="Till exempel Vinterfjäll"
          onChange={(e) => setNamn(e.target.value)}
          className="min-w-0 flex-1 basis-56"
          aria-invalid={fel ? true : undefined}
          aria-describedby={fel ? `${id}-fel` : undefined}
          autoFocus
        />
        <Button type="submit" disabled={sparar}>
          {sparar ? 'Skapar …' : 'Skapa'}
        </Button>
        <Button type="button" variant="ghost" onClick={onAvbryt}>
          Avbryt
        </Button>
      </div>
      {fel && (
        <p id={`${id}-fel`} role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}
    </form>
  )
}
