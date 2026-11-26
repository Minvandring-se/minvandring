import { Ikon, type IkonNamn } from '@/components/ikoner/Ikon'
import { kategoriFor, type KategoriNyckel } from '@/lib/forrad'
import { cn } from '@/lib/utils'

/** MinVandrings egna ikoner för kategorierna. Övrigt har ingen egen ikon och behåller sin Lucide-ikon från KATEGORIER. */
const EGEN: Partial<Record<KategoriNyckel, IkonNamn>> = {
  packning: 'mitt-forrad',
  talt: 'overnattning',
  kok: 'kok',
  vatten: 'vattenrening',
  klader: 'jacka',
  skor: 'skor',
  prylar: 'pannlampa',
  sakerhet: 'kompass',
  verktyg: 'kniv',
  medicin: 'forsta-hjalpen',
  vinter: 'sno',
  sova: 'sovsack',
  hygien: 'hygien',
}

/** Ikonen för en kategori i förrådet och utrustningskatalogen, 28 px som i listor. Dekor, eftersom kategorins namn står bredvid. */
export function Kategoriikon({ kategori, storlek = 28, className }: { kategori: KategoriNyckel; storlek?: number; className?: string }) {
  const egen = EGEN[kategori]
  if (egen) return <Ikon namn={egen} storlek={storlek} className={cn('text-primary', className)} />
  const Lucide = kategoriFor(kategori).ikon
  return <Lucide className={cn('size-5 shrink-0 text-primary', className)} aria-hidden />
}
