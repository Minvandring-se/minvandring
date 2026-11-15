import { createContext, useContext } from 'react'
import type { Animationsko } from '@/components/start/stig/animationsko'

export const StigContext = createContext<Animationsko | null>(null)

export function useStigKo() {
  const ko = useContext(StigContext)
  if (!ko) throw new Error('Stigavsnitt måste ligga inuti StigProvider.')
  return ko
}
