// Mejlen om notiser: ämne, text och HTML. Rena funktioner utan Deno och utan nätverk, så att de går att testa med
// Vitest (mejl.test.ts). Används av index.ts i Edge Function skicka-mejl.

export const WEBBPLATS = 'https://www.minvandring.se'

/** En notis i kön, som mejlko() i databasen ger den. */
export interface Konotis {
  id: string
  typ: string
  text: string
  lank: string | null
  epost: string
  kod: string
}

export interface Mejl {
  amne: string
  text: string
  html: string
  /** Adressen för att avregistrera sig, också i rubriken List-Unsubscribe. */
  avregistrera: string
}

/** Varför man får mejlet och vad knappen heter, per sort. Bara de här sorterna mejlas. */
const SORTER: Record<string, { amne: (text: string) => string; varfor: string; knapp: string; standardlank: string }> = {
  tillagd_i_tur: {
    amne: (text) => text,
    varfor: 'Du får det här mejlet eftersom en vän lade till dig i en tur i MinVandring.',
    knapp: 'Öppna turen',
    standardlank: '/turer',
  },
  vanforfragan: {
    amne: () => 'Ny vänförfrågan i MinVandring',
    varfor: 'Du får det här mejlet eftersom någon skickade en vänförfrågan till dig i MinVandring.',
    knapp: 'Svara på förfrågan',
    standardlank: '/vanner',
  },
}

export const mejlbar = (typ: string) => typ in SORTER

/** Gör text säker i HTML. Namnen i notiserna har skrivits av användare. */
export function html(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** En länk inom MinVandring. Allt som inte är en sökväg i appen blir standardsidan, så att mejlet aldrig leder bort. */
export function appadress(lank: string | null, standard: string): string {
  const sokvag = lank && /^\/[^/\\]/.test(lank) && !/[\s<>"']/.test(lank) ? lank : standard
  return `${WEBBPLATS}${sokvag}`
}

/** Mejlet för en notis. Texten är notisens, en rad, utan radbrytningar. */
export function byggMejl(n: Pick<Konotis, 'typ' | 'text' | 'lank' | 'kod'>): Mejl {
  const sort = SORTER[n.typ]
  if (!sort) throw new Error(`Sorten ${n.typ} mejlas inte.`)
  const text = n.text.replace(/\s+/g, ' ').trim()
  const lank = appadress(n.lank, sort.standardlank)
  const avregistrera = `${WEBBPLATS}/avregistrera/${encodeURIComponent(n.kod)}`
  const installningar = `${WEBBPLATS}/installningar`
  const amne = sort.amne(text).slice(0, 150)
  return {
    amne,
    avregistrera,
    text: [
      text,
      '',
      `${sort.knapp}: ${lank}`,
      '',
      '--',
      sort.varfor,
      `Välj vilka mejl du får under Inställningar: ${installningar}`,
      `Vill du inte ha mejl från MinVandring? Avregistrera dig: ${avregistrera}`,
    ].join('\n'),
    html: `<!doctype html>
<html lang="sv"><body style="margin:0;padding:24px;background:#f4f6f3;font-family:Arial,Helvetica,sans-serif;color:#1f2a24">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px">
<p style="margin:0 0 16px;font-size:13px;color:#5b665f">MinVandring</p>
<p style="margin:0 0 24px;font-size:18px;line-height:1.4">${html(text)}</p>
<p style="margin:0 0 24px"><a href="${html(lank)}" style="display:inline-block;background:#1f3d2e;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${html(sort.knapp)}</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#5b665f">${html(sort.varfor)}</p>
<p style="margin:0;font-size:13px;color:#5b665f"><a href="${html(installningar)}" style="color:#1f3d2e">Välj vilka mejl du får</a> · <a href="${html(avregistrera)}" style="color:#1f3d2e">Avregistrera dig</a></p>
</div>
</body></html>`,
  }
}
