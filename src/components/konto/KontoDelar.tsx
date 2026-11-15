import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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
}

/** Ett formulärfält med etikett, hjälptext och felmeddelande kopplade till fältet. */
export function Falt({ etikett, fel, hjalp, ...props }: FaltProps) {
  const id = useId()
  const hjalpId = `${id}-hjalp`
  const felId = `${id}-fel`
  const beskrivning = [hjalp && hjalpId, fel && felId].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {etikett}
      </label>
      <Input
        id={id}
        aria-invalid={fel ? true : undefined}
        aria-describedby={beskrivning}
        className={fel ? 'border-destructive' : undefined}
        {...props}
      />
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
