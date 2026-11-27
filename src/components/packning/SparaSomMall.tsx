import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Panel } from '@/components/ui/panel'
import { sparaPackmall } from '@/hooks/usePackmallar'
import { MALLNAMN_MAX, tolkaMallnamn } from '@/lib/packmallar'

const lank =
  'inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Spara turens packlista som en egen mall. Var och en i turen, även en läsare, kan spara. */
export function SparaSomMall({ turId, forslag, onStang }: { turId: string; forslag: string; onStang: () => void }) {
  const id = useId()
  const [namn, setNamn] = useState(forslag)
  const [fel, setFel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)
  const [sparad, setSparad] = useState<string | null>(null)

  async function spara(e: FormEvent) {
    e.preventDefault()
    const t = tolkaMallnamn(namn)
    if ('fel' in t) return setFel(t.fel)
    setFel(null)
    setSparar(true)
    const resultat = await sparaPackmall(turId, t.namn)
    setSparar(false)
    if (resultat === 'namnet-finns') setFel('Du har redan en packlista med det namnet. Välj ett annat.')
    else if (resultat) setFel('Det gick inte att spara. Kontrollera uppkopplingen och försök igen.')
    else setSparad(t.namn)
  }

  return (
    <Panel etikett="Spara som packlista" mitten onStang={onStang} rubrik={<h2 className="text-2xl">Spara som packlista</h2>}>
      {sparad ? (
        <div className="space-y-3" role="status">
          <p>Packlistan ”{sparad}” är sparad. Du hittar den under Packlistor och kan lägga den i nästa tur.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/packlistor" className={lank}>
              Till Packlistor
            </Link>
            <Button variant="outline" onClick={onStang}>
              Stäng
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={spara} className="space-y-4" noValidate>
          <p className="text-muted-foreground">
            Packlistan tar med det du bär själv, det gemensamma och det alla ska ha, med din egen modell. Det de andra bär själva följer inte med.
            Bara du ser dina packlistor.
          </p>
          <div className="space-y-1.5">
            <label htmlFor={`${id}-namn`} className="text-sm font-medium">
              Namn på packlistan
            </label>
            <Input
              id={`${id}-namn`}
              value={namn}
              maxLength={MALLNAMN_MAX}
              onChange={(e) => setNamn(e.target.value)}
              aria-invalid={fel ? true : undefined}
              aria-describedby={fel ? `${id}-fel` : undefined}
              data-autofokus
            />
          </div>
          {fel && (
            <p id={`${id}-fel`} role="alert" className="text-sm text-destructive">
              {fel}
            </p>
          )}
          <Button type="submit" disabled={sparar}>
            {sparar ? 'Sparar …' : 'Spara packlistan'}
          </Button>
        </form>
      )}
    </Panel>
  )
}
