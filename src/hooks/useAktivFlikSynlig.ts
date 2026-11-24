import { useLayoutEffect, useRef } from 'react'
import { skrollForAktivFlik } from '@/lib/flikrad'

/**
 * Skrollar flikraden i sidled så att den aktiva fliken (aria-current) syns, när sidan öppnas och när fliken byts.
 * Gäller bara när raden går att skrolla, alltså i mobil. Lägg ref på elementet med overflow-x-auto.
 */
export function useAktivFlikSynlig<T extends HTMLElement>(aktiv: string | null | undefined) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const rad = ref.current
    const flik = rad?.querySelector<HTMLElement>('[aria-current]')
    if (!rad || !flik || rad.scrollWidth <= rad.clientWidth) return
    const vanster = flik.getBoundingClientRect().left - rad.getBoundingClientRect().left + rad.scrollLeft
    rad.scrollLeft = skrollForAktivFlik({ vanster, hoger: vanster + flik.offsetWidth, skroll: rad.scrollLeft, bredd: rad.clientWidth })
  }, [aktiv])
  return ref
}
