import type { ReactNode } from 'react'
import { KONTAKT_LANK } from '@/lib/kontakt'

/** Länk till kontaktadressen. Saknas adressen (se src/lib/kontakt.ts) visas innehållet som vanlig text. */
export function Kontaktlank({ children, className }: { children: ReactNode; className?: string }) {
  if (!KONTAKT_LANK) return <>{children}</>
  return (
    <a href={KONTAKT_LANK} className={className}>
      {children}
    </a>
  )
}
