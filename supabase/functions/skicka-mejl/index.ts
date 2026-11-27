// Edge Function skicka-mejl: skickar mejl om notiser via Resend. Anropas av det schemalagda jobbet i databasen
// (public.kor_mejlko, varannan minut) med hemligheten CRON_HEMLIGHET. Publiceras med
//   npx supabase functions deploy skicka-mejl --no-verify-jwt
// eftersom jobbet skickar hemligheten och inte en inloggning. Hemligheterna läggs in i Supabase, aldrig i en fil:
// RESEND_API_KEY, MEJL_FRAN och CRON_HEMLIGHET. SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY finns redan i funktionen.
// Service role används bara här på servern, aldrig i appen.
import { byggMejl, mejlbar, type Konotis } from './mejl.ts'

declare const Deno: {
  env: { get(namn: string): string | undefined }
  serve(hanterare: (req: Request) => Response | Promise<Response>): void
}

const env = (namn: string) => {
  const v = Deno.env.get(namn)
  if (!v) throw new Error(`${namn} saknas`)
  return v
}

/** Jämför två texter på samma tid oavsett var de skiljer sig, så att hemligheten inte går att gissa tecken för tecken. */
function lika(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let skillnad = 0
  for (let i = 0; i < a.length; i++) skillnad |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return skillnad === 0
}

async function rpc<T>(funktion: string, argument: Record<string, unknown>): Promise<T> {
  const nyckel = env('SUPABASE_SERVICE_ROLE_KEY')
  const svar = await fetch(`${env('SUPABASE_URL')}/rest/v1/rpc/${funktion}`, {
    method: 'POST',
    headers: { apikey: nyckel, Authorization: `Bearer ${nyckel}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(argument),
  })
  if (!svar.ok) throw new Error(`${funktion}: ${svar.status}`)
  const text = await svar.text()
  return (text ? JSON.parse(text) : null) as T
}

async function skicka(n: Konotis): Promise<boolean> {
  const mejl = byggMejl(n)
  const svar = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env('MEJL_FRAN'),
      to: [n.epost],
      subject: mejl.amne,
      text: mejl.text,
      html: mejl.html,
      headers: { 'List-Unsubscribe': `<${mejl.avregistrera}>` },
    }),
  })
  return svar.ok
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Fel metod', { status: 405 })
  const hemlighet = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '')
  if (!lika(hemlighet, env('CRON_HEMLIGHET'))) return new Response('Nekad', { status: 401 })

  const ko = await rpc<Konotis[]>('mejlko', { antal: 20 })
  let skickade = 0
  for (const n of ko) {
    // En sort utan mejltext markeras som misslyckad och slutar försökas efter tre gånger.
    const ok = mejlbar(n.typ) ? await skicka(n).catch(() => false) : false
    await rpc('mejl_markera', { notis: n.id, ok })
    if (ok) skickade++
  }
  return Response.json({ skickade, totalt: ko.length })
})
