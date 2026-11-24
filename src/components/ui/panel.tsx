import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Dialog } from '@/components/ui/dialog'

/**
 * En detaljpanel byggd på Dialog: ett blad nerifrån i mobil (högst 90 % av skärmhöjden) och en panel från höger
 * från md. Fokus, Esc, tryck på slöjan och att fokus går tillbaka sköts av Dialog. Rubriken och stängknappen står
 * överst, innehållet scrollar och foten står fast längst ner.
 */
export function Panel({ etikett, rubrik, fot, onStang, children }: { etikett: string; rubrik: ReactNode; fot?: ReactNode; onStang: () => void; children: ReactNode }) {
  return (
    <Dialog
      etikett={etikett}
      onStang={onStang}
      className="mx-0 mt-auto mb-0 max-h-[90dvh] w-full overflow-hidden rounded-t-yta rounded-b-none bg-card md:my-0 md:mr-0 md:ml-auto md:h-dvh md:max-h-dvh md:w-[30rem] md:rounded-none"
    >
      <div className="flex max-h-[90dvh] flex-col md:h-dvh md:max-h-dvh">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 pt-4 pb-3 sm:px-5">
          <div className="min-w-0 flex-1">{rubrik}</div>
          <button
            type="button"
            aria-label="Stäng"
            onClick={onStang}
            className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-knapp text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{children}</div>
        {fot && <div className="border-t border-border bg-card px-4 py-3 sm:px-5">{fot}</div>}
      </div>
    </Dialog>
  )
}
