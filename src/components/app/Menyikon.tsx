import { NotebookPen, Settings, UserRound, type LucideIcon } from 'lucide-react'
import { Ikon, type IkonNamn } from '@/components/ikoner/Ikon'
import type { Sida } from '@/lib/meny'

/**
 * Ikonen för varje sida i menyn, samma i sidomenyn och i mobilens meny: MinVandrings egna ikoner, och Lucide för de
 * sidor som inte har någon egen (Kom ihåg, Inställningar och Profil).
 */
const MENYIKON: Record<Sida, IkonNamn | LucideIcon> = {
  hem: 'hem',
  turer: 'mina-turer',
  matplanering: 'matplanering',
  packlistor: 'packlistor',
  forrad: 'mitt-forrad',
  utrustning: 'utrustningskatalog',
  dagbok: 'dagbok',
  'kom-ihag': NotebookPen,
  statistik: 'statistik',
  vanner: 'vandringskompisar',
  installningar: Settings,
  profil: UserRound,
}

/** Menyns ikon för en sida, alltid dekor (namnet står bredvid). Den aktiva sidan får en fetare linje i Lucide-ikonerna. */
export function Menyikon({ sida, storlek, aktiv = false, className }: { sida: Sida; storlek: number; aktiv?: boolean; className?: string }) {
  const ikon = MENYIKON[sida]
  if (typeof ikon === 'string') return <Ikon namn={ikon} storlek={storlek} className={className} />
  const Lucide = ikon
  return <Lucide size={storlek} className={className} aria-hidden strokeWidth={aktiv ? 2.25 : 1.75} />
}
