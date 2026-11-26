import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Laddfel } from '@/components/app/Laddfel'
import { Skelett } from '@/components/app/Laddar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { knappStil } from '@/components/ui/knappStil'
import { Sektion } from '@/components/ui/sektion'
import { VanVal } from '@/components/vanner/VanVal'
import { sparaGrupp, taBortGrupp, useGrupper } from '@/hooks/useGrupper'
import { GRUPPNAMN_MAX, gruppfel, kontrolleraGruppnamn, medlemsText, type Grupp } from '@/lib/grupper'
import type { Van } from '@/lib/vanner'

/**
 * Grupper på sidan Vänner: ens egna grupper av vänner, till exempel Fjällgänget, med Ny tur med gruppen, Ändra och
 * Ta bort. Bara man själv ser grupperna. De som är med i en grupp får ingen notis om den.
 */
export function Grupper({ vanner }: { vanner: readonly Van[] }) {
  const { grupper, laddaOm } = useGrupper()
  // null: inget formulär. 'ny': en ny grupp. Annars gruppen som ändras.
  const [formular, setFormular] = useState<'ny' | Grupp | null>(null)
  const [fel, setFel] = useState('')

  async function taBort(g: Grupp) {
    if (!window.confirm(`Ta bort gruppen ${g.namn}? Vännerna finns kvar.`)) return
    setFel('')
    if (!(await taBortGrupp(g.id))) setFel('Det gick inte att ta bort gruppen. Kontrollera uppkopplingen och försök igen.')
    await laddaOm()
  }

  return (
    <Sektion
      rubrik="Grupper"
      atgard={
        vanner.length > 0 &&
        formular === null && (
          <Button variant="outline" onClick={() => setFormular('ny')}>
            <Plus className="size-4" aria-hidden />
            Ny grupp
          </Button>
        )
      }
    >
      <p className="text-sm text-muted-foreground">
        {vanner.length > 0
          ? 'Samla vännerna du brukar vandra med i en grupp, så kan du starta nästa tur med alla på en gång. Bara du ser dina grupper.'
          : 'Lägg till vänner först, så kan du samla dem i grupper.'}
      </p>

      {formular !== null && Array.isArray(grupper) && (
        <GruppFormular
          grupp={formular === 'ny' ? null : formular}
          grupper={grupper}
          vanner={vanner}
          onKlar={async () => {
            setFormular(null)
            await laddaOm()
          }}
          onAvbryt={() => setFormular(null)}
        />
      )}

      {grupper === null && <Skelett className="h-16 rounded-md" />}
      {grupper === 'fel' && <Laddfel vad="dina grupper" onForsokIgen={laddaOm} />}
      {Array.isArray(grupper) && grupper.length > 0 && (
        <ul className="divide-y divide-border">
          {grupper.map((g) => (
            <li key={g.id} className="space-y-2 py-3">
              <div>
                <p className="font-semibold break-words">{g.namn}</p>
                <p className="text-sm break-words text-muted-foreground">{medlemsText(g, vanner)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/turer?ny=1&grupp=${g.id}`} className={knappStil({ variant: 'outline' })}>
                  Ny tur med gruppen
                </Link>
                <Button variant="ghost" onClick={() => setFormular(g)} aria-label={`Ändra ${g.namn}`}>
                  <Pencil className="size-4" aria-hidden />
                  Ändra
                </Button>
                <Button variant="ghost" onClick={() => void taBort(g)} aria-label={`Ta bort ${g.namn}`}>
                  <Trash2 className="size-4" aria-hidden />
                  Ta bort
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}
    </Sektion>
  )
}

function GruppFormular({
  grupp,
  grupper,
  vanner,
  onKlar,
  onAvbryt,
}: {
  grupp: Grupp | null
  grupper: readonly Grupp[]
  vanner: readonly Van[]
  onKlar: () => Promise<void>
  onAvbryt: () => void
}) {
  const id = useId()
  const [namn, setNamn] = useState(grupp?.namn ?? '')
  const [valda, setValda] = useState<Set<string>>(() => new Set(grupp?.medlemmar ?? []))
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState('')

  async function spara(e: FormEvent) {
    e.preventDefault()
    const namnfel = kontrolleraGruppnamn(namn, grupper, grupp?.id ?? null)
    if (namnfel) return setFel(namnfel)
    setSparar(true)
    setFel('')
    // Bara vänner sparas. En medlem som inte längre är vän följer inte med.
    const medlemmar = vanner.filter((v) => valda.has(v.user_id)).map((v) => v.user_id)
    const { fel: f } = await sparaGrupp(grupp?.id ?? null, namn, medlemmar)
    setSparar(false)
    if (f) return setFel(gruppfel(f))
    await onKlar()
  }

  return (
    <form onSubmit={spara} noValidate className="space-y-3 rounded-md bg-muted p-3">
      <div className="space-y-1">
        <label htmlFor={`${id}-namn`} className="block text-sm font-medium">
          Gruppens namn
        </label>
        <Input id={`${id}-namn`} maxLength={GRUPPNAMN_MAX} placeholder="T.ex. Fjällgänget" value={namn} onChange={(e) => setNamn(e.target.value)} />
      </div>
      <VanVal rubrik="Vänner i gruppen" vanner={vanner} valda={valda} onAndra={setValda} />
      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={sparar}>
          {grupp ? 'Spara gruppen' : 'Skapa gruppen'}
        </Button>
        <Button type="button" variant="ghost" onClick={onAvbryt}>
          Avbryt
        </Button>
      </div>
    </form>
  )
}
