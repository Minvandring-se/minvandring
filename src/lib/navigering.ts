// De inloggade sidorna: vilka sidor som har sidomenyn och bottenmenyn.
import { aktivSida } from '@/lib/meny'

/** Sidorna som visas i den inloggade ramen med sidomeny och bottenmeny: alla sidor i menyn (src/lib/meny.ts) och de utanför den. */
/** Inloggade sidor som inte står i menyn: den planerade kartan. */
const UTANFOR_MENYN = ['/hitta-vandring']

export function arAppsida(pathname: string): boolean {
  const sokvag = pathname.replace(/\/+$/, '') || '/'
  return aktivSida(pathname) !== null || UTANFOR_MENYN.includes(sokvag)
}
