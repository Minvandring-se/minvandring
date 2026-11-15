import { useEffect, useState, type ReactNode } from 'react'
import { skapaAnimationsko } from '@/components/start/stig/animationsko'
import { StigContext } from '@/components/start/stig/stigKo'

/** Gemensam animationskö för ledens bitar. En ny montering av sidan räknas som ett nytt sidbesök. */
export function StigProvider({ children }: { children: ReactNode }) {
  const [ko] = useState(skapaAnimationsko)
  useEffect(() => () => ko.avbrytAlla(), [ko])
  return <StigContext.Provider value={ko}>{children}</StigContext.Provider>
}
