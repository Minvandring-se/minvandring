import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { KONTAKT_MEJL } from '@/lib/kontakt'

interface Props {
  children: ReactNode
  /** När värdet ändras, till exempel sökvägen, försvinner felet och sidan visas igen. */
  aterstall: string
}

/**
 * Fångar fel i sidan som visas, så att man får ett meddelande och kan ladda om i stället för en vit sida.
 * Felet försvinner när man byter sida.
 */
export class Felgrans extends Component<Props, { fel: boolean; aterstall: string }> {
  state = { fel: false, aterstall: this.props.aterstall }

  static getDerivedStateFromError() {
    return { fel: true }
  }

  static getDerivedStateFromProps(props: Props, state: { aterstall: string }) {
    return props.aterstall === state.aterstall ? null : { fel: false, aterstall: props.aterstall }
  }

  componentDidCatch(fel: Error, info: ErrorInfo) {
    console.error('Fel i sidan:', fel, info.componentStack)
  }

  render() {
    if (!this.state.fel) return this.props.children
    return (
      <div role="alert" className="mx-auto max-w-xl space-y-4 rounded-lg border border-border bg-card p-6 shadow-soft sm:p-8">
        <h1 className="text-2xl">Något gick fel</h1>
        <p className="text-muted-foreground">
          Sidan gick inte att visa. Ladda om sidan och försök igen.
          {KONTAKT_MEJL && (
            <>
              {' '}
              Om det fortsätter, hör av dig till <span className="break-all select-all">{KONTAKT_MEJL}</span>.
            </>
          )}
        </p>
        <Button onClick={() => window.location.reload()}>Ladda om sidan</Button>
      </div>
    )
  }
}
