// Mejl om notiser: valen under Inställningar. Mejlen själva byggs i supabase/functions/skicka-mejl/mejl.ts.

/** Valen som går att ändra, i samma ordning som under Inställningar. Kolumnerna finns i notisinstallningar. */
export const MEJLVAL = [
  { nyckel: 'mejl_tillagd_i_tur', etikett: 'någon lägger till mig i en tur' },
  { nyckel: 'mejl_vanforfragan', etikett: 'någon skickar en vänförfrågan till mig' },
  { nyckel: 'mejl_paminnelser', etikett: 'det är dags för en av mina påminnelser' },
  { nyckel: 'mejl_auto_paminnelser', etikett: 'en tur börjar om en vecka och dagen före' },
] as const

export type Mejlval = (typeof MEJLVAL)[number]['nyckel']

export type Mejlinstallningar = Record<Mejlval, boolean> & {
  /** När man avregistrerade sig via länken i ett mejl. Då går inga mejl alls. */
  avregistrerad: string | null
}
