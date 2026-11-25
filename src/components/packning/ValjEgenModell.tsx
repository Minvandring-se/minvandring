import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { Panel } from '@/components/ui/panel'
import { useState } from 'react'
import { Link } from 'react-router'
import { formateraVikt } from '@/lib/forrad'
import { passarRaden } from '@/lib/packlista'
import type { Forradssak, PackradRad } from '@/lib/typer'

const fokus = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'

/** Välj sin egen modell ur förrådet på en rad som alla ska ha, till exempel sin egen sovsäck. */
export function ValjEgenModell({
  rad,
  saker,
  onForsokIgen,
  onValj,
  onStang,
}: {
  rad: PackradRad
  saker: Forradssak[] | null | 'fel'
  onForsokIgen: () => void
  onValj: (sak: Forradssak) => Promise<boolean>
  onStang: () => void
}) {
  const [fel, setFel] = useState(false)
  const [sparar, setSparar] = useState<string | null>(null)
  const passar = Array.isArray(saker) ? passarRaden(saker, rad) : []

  return (
    <Panel etikett={`Välj din modell, ${rad.namn.toLowerCase()}`} onStang={onStang} rubrik={<h2 className="text-2xl break-words">Välj din modell: {rad.namn}</h2>}>
      <div className="space-y-3">
        {saker === null && (
          <Laddar text="Hämtar ditt förråd" className="space-y-2">
            <Skelett className="h-11 rounded-lg" />
            <Skelett className="h-11 rounded-lg" />
          </Laddar>
        )}
        {saker === 'fel' && <Laddfel vad="ditt förråd" onForsokIgen={onForsokIgen} />}
        {Array.isArray(saker) && passar.length === 0 && (
          <TomtLage
            kompakt
            text="Ditt förråd har inget i den här kategorin. Skapa saken i Mitt förråd först."
            knapp={
              <Link to="/forrad" className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                Till Mitt förråd
              </Link>
            }
          />
        )}
        {passar.length > 0 && (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {passar.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={sparar !== null}
                  onClick={async () => {
                    setFel(false)
                    setSparar(s.id)
                    const ok = await onValj(s)
                    setSparar(null)
                    if (!ok) setFel(true)
                  }}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted ${fokus}`}
                >
                  <span className="min-w-0 break-words">{s.namn}</span>
                  <span className="shrink-0 text-sm tabular-nums">{sparar === s.id ? 'Sparar …' : s.vikt_g === null ? 'Ingen vikt' : formateraVikt(s.vikt_g)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {fel && (
          <p role="alert" className="text-sm text-destructive">
            Det gick inte att spara. Kontrollera uppkopplingen och försök igen.
          </p>
        )}
      </div>
    </Panel>
  )
}
