import { Illustration } from '@/components/illustrationer/Illustration'
import type { Receptkatalogrecept } from '@/lib/typer'
import { cn } from '@/lib/utils'

// Bilderna görs med npm run receptbilder och ligger i public/recept/.
const STORLEKAR = {
  kort: { bredder: [600, 1200], sizes: '(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw' },
  vy: { bredder: [900, 1800], sizes: '(min-width: 768px) 768px, 100vw' },
} as const

const fil = (id: string, typ: 'kort' | 'vy', bredd: number) => `/recept/${id}-${typ}-${bredd}.webp`

/**
 * Bilden till ett av MinVandrings recept, på receptkortet (kort) eller överst i receptvyn (vy). I kortbilden (600 × 288)
 * ligger motivet i den övre delen och nederkanten är tom, så kortet visar bilden från överkanten i en ruta som är 5:2
 * (kortets bildKlass): inget klipps upptill och den tomma nederkanten skärs bort. Receptvyn är 5:2 som bilden och
 * visar hela. Recept utan bild visar den tecknade platshållaren.
 */
export function Receptbild({ recept, typ, className }: { recept: Pick<Receptkatalogrecept, 'id' | 'namn' | 'bild'>; typ: 'kort' | 'vy'; className?: string }) {
  if (!recept.bild) return <Illustration namn={recept.id} className={className} />
  const { bredder, sizes } = STORLEKAR[typ]
  return (
    <img
      src={fil(recept.id, typ, bredder[0])}
      srcSet={bredder.map((b) => `${fil(recept.id, typ, b)} ${b}w`).join(', ')}
      sizes={sizes}
      alt={recept.namn}
      loading={typ === 'kort' ? 'lazy' : 'eager'}
      decoding="async"
      className={cn('object-cover', typ === 'kort' ? 'object-top' : 'object-center', className)}
    />
  )
}
