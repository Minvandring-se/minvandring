// Skriptet i index.html sätter läget innan React startar. Det kan inte importera src/lib/tema.ts,
// så det här testet kontrollerar att nyckeln och färgerna stämmer med den.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { TEMAFARG, TEMA_NYCKEL } from '../src/lib/tema'

const html = fs.readFileSync(path.join(import.meta.dirname, '..', 'index.html'), 'utf8')
const css = fs.readFileSync(path.join(import.meta.dirname, '..', 'src', 'index.css'), 'utf8')

describe('temaskriptet i index.html', () => {
  it('läser samma nyckel som src/lib/tema.ts', () => {
    expect(html).toContain(`localStorage.getItem('${TEMA_NYCKEL}')`)
  })

  it('har en theme-color för ljust och en för mörkt läge med samma färger som TEMAFARG', () => {
    expect(html).toContain(`<meta name="theme-color" content="${TEMAFARG.ljus}" media="(prefers-color-scheme: light)" />`)
    expect(html).toContain(`<meta name="theme-color" content="${TEMAFARG.mork}" media="(prefers-color-scheme: dark)" />`)
    expect(html).toContain(`val === 'mork' ? '${TEMAFARG.mork}' : '${TEMAFARG.ljus}'`)
  })

  it('har samma färger som bakgrunden i index.css', () => {
    expect(css).toContain(`--color-background: ${TEMAFARG.ljus};`)
    expect(css).toContain(`--color-background: ${TEMAFARG.mork};`)
  })
})
