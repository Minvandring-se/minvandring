// Profilbilden: var den ligger, vilka filer som godtas, hur den beskärs och i vilket format den sparas.
// Reglerna är rena funktioner. Själva ritningen på en canvas ligger sist och kan bara köras i en webbläsare.

/** Bucketen i Supabase Storage. Privat: bilderna visas med signerade adresser. */
export const PROFILBILD_BUCKET = 'profilbilder'

/** Sidan på den sparade bilden, i pixlar. */
export const PROFILBILD_STORLEK = 256

/** Största fil man får välja. Bilden förminskas före uppladdning, så det som sparas är mycket mindre. */
export const MAX_FILSTORLEK = 10 * 1024 * 1024

/** Filtyperna som går att välja. Med just de här i filväljaren gör en iPhone om HEIC till JPEG. */
export const GODKANDA_FILTYPER = ['image/jpeg', 'image/png', 'image/webp'] as const

/** Värdet för filväljarens accept. */
export const FILVALJARE_ACCEPT = GODKANDA_FILTYPER.join(',')

export const JPEG_KVALITET = 0.85
export const WEBP_KVALITET = 0.85

/** Hur länge en signerad adress gäller, i sekunder. */
export const ADRESS_GILTIG_S = 3600

/** Hur länge en hämtad adress, eller beskedet att bild saknas, återanvänds i minnet, i millisekunder. */
export const MINNE_MS = 10 * 60 * 1000

/** Sökvägen till en användares bild: <user_id>/bild, utan filändelse. Filtypen står i filens content type. */
export function bildsokvag(userId: string): string {
  return `${userId}/bild`
}

/** Vad som är fel med den valda filen, eller null om den går att använda. */
export function kontrolleraFil(fil: { type: string; size: number }): string | null {
  const godkand: readonly string[] = GODKANDA_FILTYPER
  if (!godkand.includes(fil.type)) return 'Välj en bild i JPG, PNG eller WebP.'
  if (fil.size > MAX_FILSTORLEK) return 'Bilden är för stor. Välj en som är högst 10 MB.'
  if (fil.size === 0) return 'Filen är tom. Välj en annan bild.'
  return null
}

/** Den största kvadraten mitt i en bild: var den börjar och hur stor sidan är. */
export function kvadratFranMitten(bredd: number, hojd: number): { x: number; y: number; sida: number } {
  const sida = Math.max(0, Math.min(bredd, hojd))
  return { x: Math.round((bredd - sida) / 2), y: Math.round((hojd - sida) / 2), sida }
}

/**
 * Vilket format bilden sparas i. Vi ber webbläsaren om WebP. Safari kan inte skapa WebP från en canvas
 * och svarar då med en PNG. I så fall görs en JPEG i stället, som lagringen tar emot.
 */
export function valjFormat(typFranWebpForsok: string | null | undefined): 'image/webp' | 'image/jpeg' {
  return typFranWebpForsok === 'image/webp' ? 'image/webp' : 'image/jpeg'
}

/** En hämtad adress i minnet. adress är null när användaren saknar bild. */
export interface Minnesrad {
  adress: string | null
  hamtad: number
}

/** Vilka användares adresser som behöver hämtas: de som saknas i minnet eller är för gamla. Varje id en gång. */
export function behoverHamtas(userIds: readonly string[], minne: ReadonlyMap<string, Minnesrad>, nu: number): string[] {
  return [...new Set(userIds)].filter((id) => {
    const rad = minne.get(id)
    return !rad || nu - rad.hamtad >= MINNE_MS
  })
}

// ─── Webbläsaren ─────────────────────────────────────────────────────────────

function somBlob(canvas: HTMLCanvasElement, typ: string, kvalitet: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, typ, kvalitet))
}

/**
 * Beskär bilden till en kvadrat från mitten och förminskar den till 256 × 256 px.
 * Resultatet är WebP, eller JPEG i webbläsare som inte kan skapa WebP.
 */
export async function forminskaBild(fil: Blob): Promise<Blob> {
  const bild = await createImageBitmap(fil)
  try {
    const { x, y, sida } = kvadratFranMitten(bild.width, bild.height)
    if (sida === 0) throw new Error('Bilden har ingen storlek')
    const canvas = document.createElement('canvas')
    canvas.width = PROFILBILD_STORLEK
    canvas.height = PROFILBILD_STORLEK
    const yta = canvas.getContext('2d')
    if (!yta) throw new Error('Det gick inte att rita bilden')
    // Vit botten, så att en genomskinlig PNG inte blir svart som JPEG.
    yta.fillStyle = '#ffffff'
    yta.fillRect(0, 0, PROFILBILD_STORLEK, PROFILBILD_STORLEK)
    yta.imageSmoothingQuality = 'high'
    yta.drawImage(bild, x, y, sida, sida, 0, 0, PROFILBILD_STORLEK, PROFILBILD_STORLEK)

    const webp = await somBlob(canvas, 'image/webp', WEBP_KVALITET)
    if (webp && valjFormat(webp.type) === 'image/webp') return webp
    const jpeg = await somBlob(canvas, 'image/jpeg', JPEG_KVALITET)
    if (!jpeg || jpeg.type !== 'image/jpeg') throw new Error('Det gick inte att spara bilden som JPEG')
    return jpeg
  } finally {
    bild.close()
  }
}
