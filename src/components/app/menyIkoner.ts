import {
  Backpack,
  BarChart3,
  BookOpen,
  ClipboardList,
  CookingPot,
  Map as Karta,
  NotebookPen,
  Search,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Sida } from '@/lib/meny'

/** Ikonen för varje sida i menyn, samma i sidomenyn och i mobilens meny. */
export const MENYIKON: Record<Sida, LucideIcon> = {
  turer: Karta,
  matplanering: CookingPot,
  packlistor: ClipboardList,
  forrad: Backpack,
  utrustning: Search,
  dagbok: BookOpen,
  'kom-ihag': NotebookPen,
  statistik: BarChart3,
  kompisar: Users,
  installningar: Settings,
  profil: UserRound,
}
