// Färgvariablerna i src/index.css: ljust läge i @theme och mörkt läge i två block med samma värden.
// Ligger utanför src, som testerna i supabase/, eftersom det läser en fil från disken.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { fargvariabler, kontrast } from '../src/lib/farger'

const css = fs.readFileSync(path.join(import.meta.dirname, '..', 'src', 'index.css'), 'utf8').replaceAll('\r\n', '\n')
const temaStart = css.indexOf('@theme {')
const ljust = fargvariabler(css.slice(temaStart, css.indexOf('\n}\n', temaStart)))
const valtMorkt = fargvariabler(/html\[data-tema='mork'\] \{([^}]*)\}/.exec(css)?.[1] ?? '')
const enhetensMorka = fargvariabler(/html:not\(\[data-tema\]\) \{([^}]*)\}/.exec(css)?.[1] ?? '')

// Text och yta som används tillsammans. Text kräver 4,5:1 (WCAG AA), accent och fokusring som markering 3:1.
const PAR: [text: string, yta: string, krav: number][] = [
  ['foreground', 'background', 4.5],
  ['foreground', 'card', 4.5],
  ['foreground', 'muted', 4.5],
  ['foreground', 'primary-soft', 4.5],
  ['foreground', 'accent-soft', 4.5],
  ['foreground', 'sand', 4.5],
  ['muted-foreground', 'background', 4.5],
  ['muted-foreground', 'card', 4.5],
  ['muted-foreground', 'muted', 4.5],
  ['muted-foreground', 'primary-soft', 4.5],
  ['primary-foreground', 'primary', 4.5],
  ['primary-foreground', 'primary-hover', 4.5],
  ['primary', 'card', 4.5],
  ['primary', 'background', 4.5],
  ['primary', 'primary-soft', 4.5],
  ['primary', 'muted', 4.5],
  ['destructive', 'muted', 4.5],
  ['muted-foreground', 'accent-soft', 4.5],
  ['accent-strong', 'accent-soft', 4.5],
  ['accent-strong', 'card', 4.5],
  ['accent-strong', 'background', 4.5],
  ['destructive', 'card', 4.5],
  ['destructive', 'background', 4.5],
  ['yta-stark-foreground', 'yta-stark', 4.5],
  ['yta-stark-muted', 'yta-stark', 4.5],
  ['hjortron-strong', 'hjortron-soft', 4.5],
  ['foreground', 'hjortron-soft', 4.5],
  ['hjortron-strong', 'card', 4.5],
  ['hjortron-strong', 'background', 4.5],
  ['hjortron', 'yta-stark', 4.5],
  ['accent', 'card', 3],
  ['accent', 'background', 3],
  ['ring', 'background', 3],
  ['ring', 'card', 3],
]

describe('färgerna i index.css', () => {
  it('hittar båda lägena', () => {
    expect(Object.keys(ljust).length).toBeGreaterThan(10)
    expect(Object.keys(valtMorkt).length).toBeGreaterThan(10)
  })

  it('har samma variabler i ljust och mörkt läge', () => {
    // pa-bild är ljus i båda lägena och står bara i @theme.
    const ljusaNamn = Object.keys(ljust).filter((n) => n !== 'pa-bild')
    expect(Object.keys(valtMorkt).sort()).toEqual(ljusaNamn.sort())
  })

  it('har samma mörka värden när läget är valt och när det kommer från enheten', () => {
    expect(enhetensMorka).toEqual(valtMorkt)
  })

  const lagen: [string, Record<string, string>][] = [
    ['ljust', ljust],
    ['mörkt', { ...ljust, ...valtMorkt }],
  ]
  for (const [lage, farger] of lagen) {
    it.each(PAR)(`${lage} läge: %s på %s klarar %s:1`, (text, yta, krav) => {
      expect(kontrast(farger[text], farger[yta])).toBeGreaterThanOrEqual(krav)
    })
  }
})
