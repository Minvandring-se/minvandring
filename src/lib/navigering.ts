// De inloggade sidorna: vilka sidor som har sidomenyn och bottenmenyn.
import { aktivSida } from '@/lib/meny'

/** Sidorna som visas i den inloggade ramen med sidomeny och bottenmeny: alla sidor i menyn (src/lib/meny.ts). */
export function arAppsida(pathname: string): boolean {
  return aktivSida(pathname) !== null
}
