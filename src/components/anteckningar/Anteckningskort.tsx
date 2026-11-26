import { Lock, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { AnteckningFormular } from '@/components/anteckningar/AnteckningFormular'
import { Button } from '@/components/ui/button'
import { andraAnteckning, taBortAnteckning } from '@/hooks/useAnteckningar'
import { anteckningsdatum, type Anteckning } from '@/lib/anteckningar'

/** En anteckning med vem som skrev den och när. Den egna går att ändra, och knappen Ta bort visas när man får. */
export function Anteckningskort({
  anteckning,
  vem,
  kanAndra,
  kanTaBort,
  onAndrad,
}: {
  anteckning: Anteckning
  vem: string
  kanAndra: boolean
  kanTaBort: boolean
  onAndrad: () => Promise<void>
}) {
  const [andrar, setAndrar] = useState(false)
  const [fel, setFel] = useState(false)
  const knappId = useId()
  const varAndring = useRef(false)

  // Fokus tillbaka till Ändra när formuläret stängs, så att tangentbord och skärmläsare inte hamnar överst på sidan.
  useEffect(() => {
    if (!andrar && varAndring.current) document.getElementById(knappId)?.focus()
    varAndring.current = andrar
  }, [andrar, knappId])

  async function taBort() {
    if (!window.confirm('Ta bort anteckningen? Den går inte att få tillbaka.')) return
    const ok = await taBortAnteckning(anteckning.id)
    setFel(!ok)
    if (ok) await onAndrad()
  }

  if (andrar) {
    return (
      <li className="py-4">
        <AnteckningFormular
          start={anteckning}
          knapptext="Spara"
          autoFocus
          onAvbryt={() => setAndrar(false)}
          onSpara={async (text, privat) => {
            const ok = await andraAnteckning(anteckning.id, text, privat)
            if (ok) {
              await onAndrad()
              setAndrar(false)
            }
            return ok
          }}
        />
      </li>
    )
  }

  return (
    <li className="flex items-start gap-3 py-4">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm break-words text-muted-foreground">
          <span className="font-semibold text-foreground">{vem}</span> · {anteckningsdatum(anteckning)}
        </p>
        <p className="break-words whitespace-pre-wrap">{anteckning.text}</p>
        {anteckning.privat && (
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            Bara du ser den
          </p>
        )}
        {fel && (
          <p role="alert" className="text-sm text-destructive">
            Det gick inte att ta bort. Försök igen.
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        {kanAndra && (
          <Button id={knappId} variant="ghost" size="ikon" aria-label="Ändra anteckningen" onClick={() => setAndrar(true)}>
            <Pencil className="size-4" aria-hidden />
          </Button>
        )}
        {kanTaBort && (
          <Button variant="ghost" size="ikon" aria-label="Ta bort anteckningen" onClick={taBort}>
            <Trash2 className="size-4" aria-hidden />
          </Button>
        )}
      </div>
    </li>
  )
}
