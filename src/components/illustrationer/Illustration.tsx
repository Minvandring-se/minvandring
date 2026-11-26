import { cn } from '@/lib/utils'

/**
 * Illustrationerna i matdelen: rutorna för måltider och kategorier och korten för tips och recept. De riktiga bilderna
 * kommer från Astra. Tills dess visas en enkel platt platshållare i appens färger.
 *
 * En riktig bild läggs i public/illustrationer/ och skrivs in i FILER med samma namn, till exempel
 * frukost: 'frukost.svg'. Då visas filen i stället för platshållaren.
 */
const FILER: Partial<Record<string, string>> = {}

/** Ytan och formen i platshållaren. Väljs utifrån namnet, så att samma namn alltid ser likadant ut. */
const YTOR = ['bg-primary-soft', 'bg-hjortron-soft', 'bg-accent-soft', 'bg-sand'] as const
const FORMER = ['fill-illustration', 'fill-hjortron', 'fill-trail-marker', 'fill-primary'] as const

function talFor(namn: string): number {
  let h = 0
  for (const t of namn) h = (h * 31 + t.charCodeAt(0)) >>> 0
  return h
}

/** Tre enkla platta motiv: en skål, en kopp och en kulle med sol. */
function Motiv({ typ, form }: { typ: number; form: string }) {
  if (typ === 0)
    return (
      <>
        <path d="M22 50 H78 C78 66 66 76 50 76 C34 76 22 66 22 50 Z" className={form} />
        <rect x="18" y="46" width="64" height="6" rx="3" className={form} />
      </>
    )
  if (typ === 1)
    return (
      <>
        <path d="M30 38 H66 V64 C66 72 60 76 54 76 H42 C36 76 30 72 30 64 Z" className={form} />
        <path d="M66 46 H72 C77 46 77 60 72 60 H66" className="fill-none stroke-current" strokeWidth="5" />
      </>
    )
  return (
    <>
      <circle cx="68" cy="38" r="9" className="fill-hjortron" />
      <path d="M2 100 L34 58 L52 78 L66 64 L98 100 Z" className={form} />
    </>
  )
}

export function Illustration({ namn, className }: { namn: string; className?: string }) {
  const fil = FILER[namn]
  if (fil) return <img src={`/illustrationer/${fil}`} alt="" aria-hidden className={cn('object-cover', className)} />
  const tal = talFor(namn)
  const typ = (tal >>> 3) % 3
  // Solen är hjortron, så kullen får aldrig samma färg.
  const form = typ === 2 && FORMER[tal % FORMER.length] === 'fill-hjortron' ? 'fill-illustration' : FORMER[tal % FORMER.length]
  return (
    // Ytan är bakgrunden, så att motivet syns helt och ytan fyller hela rutan oavsett form.
    <svg viewBox="0 0 100 100" aria-hidden focusable="false" className={cn('text-illustration', YTOR[tal % YTOR.length], className)} preserveAspectRatio="xMidYMax meet">
      <Motiv typ={typ} form={form} />
    </svg>
  )
}
