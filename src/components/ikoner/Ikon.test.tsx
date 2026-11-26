import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Ikon, type IkonNamn } from './Ikon'
import { IKONER, IKONOMGANG } from './ikondata'

const namn = Object.keys(IKONER) as IkonNamn[]

describe('MinVandrings ikoner', () => {
  it('har de 50 ikonerna, tio i varje omgång', () => {
    expect(namn).toHaveLength(50)
    for (const o of [1, 2, 3, 4, 5]) expect(Object.values(IKONOMGANG).filter((x) => x === o)).toHaveLength(10)
  })

  it('ritas inline i 24 px, dold för skärmläsare utan etikett', () => {
    const html = renderToStaticMarkup(<Ikon namn="mina-turer" />)
    expect(html).toMatch(/^<svg [^>]*width="24" height="24" viewBox="0 0 24 24"/)
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('<path')
  })

  it('läses upp med etikett', () => {
    const html = renderToStaticMarkup(<Ikon namn="hund" etikett="Hund" storlek={20} />)
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="Hund"')
    expect(html).not.toContain('aria-hidden')
  })

  it('har färgerna från variablerna, utom den röda i ledkryss, kniv och första hjälpen, och ingen metadata', () => {
    for (const n of namn) {
      const html = renderToStaticMarkup(<Ikon namn={n} />)
      expect(html, n).not.toContain('metadata')
      const farger = [...html.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1]).filter((f) => f !== 'none')
      for (const f of farger) {
        if (f === '#c45a3b') expect(['ledkryss', 'kniv', 'forsta-hjalpen'], n).toContain(n)
        else expect(f, n).toMatch(/^var\(--ikon-(linje|yta|yta-2|accent),/)
      }
    }
  })
})
