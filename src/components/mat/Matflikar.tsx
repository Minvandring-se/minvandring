import { useLocation } from 'react-router'
import { Flikrad } from '@/components/ui/flikrad'
import { aktivUndersida, UNDERSIDOR } from '@/lib/meny'

/**
 * Flikraden överst på Matplaneringens delar: Mina matplaner, Matkatalog, Recept, Skafferi och Tips. Samma flikar som
 * turens. Delarna står bara här, inte i sidomenyn, så att de inte syns två gånger på dator.
 */
export function Matflikar() {
  const { pathname } = useLocation()
  return <Flikrad etikett="Matplanering" aktiv={aktivUndersida(pathname)} flikar={UNDERSIDOR.matplanering!.map((u) => ({ nyckel: u.till, namn: u.namn, till: u.till }))} />
}
