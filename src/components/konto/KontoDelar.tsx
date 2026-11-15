import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** Ramen runt sidorna för inloggning, nytt konto och lösenord. */
export function KontoKort({ rubrik, children }: { rubrik: string; children: ReactNode }) {
  return (
    <Card className="mx-auto mt-10 max-w-md space-y-5">
      <h1 className="text-2xl">{rubrik}</h1>
      {children}
    </Card>
  )
}

interface FaltProps extends InputHTMLAttributes<HTMLInputElement> {
  etikett: string
  fel?: string | null
  hjalp?: string
  /** Knapp inuti fältet, till höger. Fältet får plats för den så att texten inte hamnar under. */
  knapp?: ReactNode
}

/** Ett formulärfält med etikett, hjälptext och felmeddelande kopplade till fältet. */
export function Falt({ etikett, fel, hjalp, knapp, id: egetId, ...props }: FaltProps) {
  const genereratId = useId()
  const id = egetId ?? genereratId
  const hjalpId = `${id}-hjalp`
  const felId = `${id}-fel`
  const beskrivning = [hjalp && hjalpId, fel && felId].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {etikett}
      </label>
      <div className="relative">
        <Input
          id={id}
          aria-invalid={fel ? true : undefined}
          aria-describedby={beskrivning}
          className={cn(fel && 'border-destructive', knapp && 'pr-12')}
          {...props}
        />
        {knapp && <div className="absolute inset-y-0 right-0 flex items-center">{knapp}</div>}
      </div>
      {hjalp && (
        <p id={hjalpId} className="text-sm text-muted-foreground">
          {hjalp}
        </p>
      )}
      {fel && (
        <p id={felId} className="text-sm text-destructive">
          {fel}
        </p>
      )}
    </div>
  )
}

type LosenordFaltProps = Omit<FaltProps, 'type' | 'knapp'> & {
  autoComplete: 'current-password' | 'new-password'
}

/** Lösenordsfält med en ögonknapp som visar eller döljer lösenordet. Det är alltid dolt från början. */
export function LosenordFalt(props: LosenordFaltProps) {
  const id = useId()
  const [synligt, setSynligt] = useState(false)
  const Ikon = synligt ? EyeOff : Eye

  return (
    <Falt
      {...props}
      id={id}
      type={synligt ? 'text' : 'password'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      knapp={
        <button
          type="button"
          onClick={() => setSynligt((v) => !v)}
          aria-label={synligt ? 'Dölj lösenord' : 'Visa lösenord'}
          aria-pressed={synligt}
          aria-controls={id}
          className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <Ikon className="size-5" aria-hidden />
        </button>
      }
    />
  )
}

/** Fel som gäller hela formuläret, till exempel fel lösenord. */
export function Felruta({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
      {children}
    </p>
  )
}

/** Länk under formuläret, t.ex. "Inget konto? Skapa konto". Minst 44 px hög. */
export function Sidlank({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-2 hover:text-primary-hover">
      {children}
    </Link>
  )
}
