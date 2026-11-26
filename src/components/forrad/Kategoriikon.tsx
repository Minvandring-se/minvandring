import { Ikon, type IkonNamn } from '@/components/ikoner/Ikon'
import { kategoriFor, type KategoriNyckel } from '@/lib/forrad'
import { cn } from '@/lib/utils'

/** MinVandrings egna ikoner för kategorierna. Kategorier utan någon egen ikon behåller sin Lucide-ikon från KATEGORIER. */
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
}

/** Ikonen för en kategori i förrådet och utrustningskatalogen, 20 px. Dekor, eftersom kategorins namn står bredvid. */
export function Kategoriikon({ kategori, className }: { kategori: KategoriNyckel; className?: string }) {
  const egen = EGEN[kategori]
  if (egen) return <Ikon namn={egen} storlek={20} className={className} />
  const Lucide = kategoriFor(kategori).ikon
  return <Lucide className={cn('size-5 shrink-0 text-primary', className)} aria-hidden />
}
