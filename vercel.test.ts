// Säkerhetsrubrikerna i vercel.json. CSP:n tillåter bara skript från sajten och skripten i index.html med rätt hash,
// så en ändring i ett skript i index.html måste följas av en ny hash i vercel.json.
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const rot = import.meta.dirname
const vercel = JSON.parse(fs.readFileSync(path.join(rot, 'vercel.json'), 'utf8')) as {
  headers: { source: string; headers: { key: string; value: string }[] }[]
}
const rubriker = Object.fromEntries(vercel.headers.find((h) => h.source === '/(.*)')!.headers.map((h) => [h.key, h.value]))
const csp = rubriker['Content-Security-Policy']

describe('säkerhetsrubriker', () => {
  it('har hash i CSP:n för varje skript direkt i index.html', () => {
    // Git sparar index.html med LF, och det är så Vercel bygger den.
    const html = fs.readFileSync(path.join(rot, 'index.html'), 'utf8').replace(/\r\n/g, '\n')
    const skript = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
    expect(skript.length).toBeGreaterThan(0)
    for (const s of skript) {
      const hash = `'sha256-${createHash('sha256').update(s).digest('base64')}'`
      expect(csp, 'Uppdatera hashen i vercel.json').toContain(hash)
    }
  })

  it('släpper bara fram Supabase-projektet och stoppar inbäddning', () => {
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).not.toContain('unsafe-inline')
    expect(csp).not.toContain('unsafe-eval')
    expect(csp).toMatch(/connect-src 'self' https:\/\/[a-z0-9]+\.supabase\.co wss:\/\/[a-z0-9]+\.supabase\.co;/)
    // Profilbilder: förhandsvisningen är en blob, och de sparade bilderna kommer från projektets lagring.
    expect(csp).toMatch(/img-src 'self' data: blob: https:\/\/[a-z0-9]+\.supabase\.co;/)
    expect(/img-src[^;]*\*/.test(csp)).toBe(false)
    expect(rubriker['X-Frame-Options']).toBe('DENY')
    expect(rubriker['X-Content-Type-Options']).toBe('nosniff')
    expect(rubriker['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(rubriker['Permissions-Policy']).toContain('camera=()')
  })
})
