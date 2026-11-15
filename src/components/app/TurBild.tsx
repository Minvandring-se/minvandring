import { useState } from 'react'
import { bildForTur } from '@/lib/turlista'
import { cn } from '@/lib/utils'

/**
 * Turens bild. Turerna har inga egna foton, så varje tur får en av bilderna i public/hero, vald utifrån id.
 * Går bilden inte att ladda visas en sandfärgad yta. Dekorativ, så alt är tom.
 */
export function TurBild({ turId, sizes, className, prioritet }: { turId: string; sizes: string; className?: string; prioritet?: boolean }) {
  const [fel, setFel] = useState(false)
  const bild = bildForTur(turId)
  if (fel) return <div aria-hidden className={cn('bg-sand', className)} />
  return (
    <img
      src={`/hero/${bild}-640.webp`}
      srcSet={`/hero/${bild}-640.webp 640w, /hero/${bild}-1280.webp 1280w`}
      sizes={sizes}
      alt=""
      loading={prioritet ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFel(true)}
      className={cn('bg-sand object-cover', className)}
    />
  )
}
