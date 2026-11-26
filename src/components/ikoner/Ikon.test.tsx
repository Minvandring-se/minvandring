import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Ikon, type IkonNamn } from './Ikon'
import { IKONER, IKONOMGANG } from './ikondata'

const namn = Object.keys(IKONER) as IkonNamn[]

describe('MinVandrings ikoner i linosnitt', () => {
  it('har de 50 godkända ikonerna, tio i varje omgång, och sovsäck och hygien', () => {
    for (const o of [1, 2, 3, 4, 5]) expect(Object.values(IKONOMGANG).filter((x) => x === o), `omgång ${o}`).toHaveLength(10)
    expect(namn).toContain('hem')
    expect(namn).not.toContain('oversikt')
    expect(namn).toContain('sovsack')
    expect(namn).toContain('hygien')
    expect(namn).toHaveLength(52)
  })

  it('ritas inline i 24 px som standard, dold för skärmläsare utan etikett', () => {
    const html = renderToStaticMarkup(<Ikon namn="mina-turer" />)
    expect(html).toMatch(/^<svg [^>]*width="24" height="24" viewBox="0 0 24 24"/)
    expect(html).toContain('aria-hidden="true"')
    expect(renderToStaticMarkup(<Ikon namn="mina-turer" storlek={36} />)).toContain('width="36" height="36"')
  })

  it('läses upp med etikett', () => {
    const html = renderToStaticMarkup(<Ikon namn="hund" etikett="Hund" />)
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="Hund"')
    expect(html).not.toContain('aria-hidden')
  })

  it('tar färgen från currentColor och gör urtagen med en mask, utan metadata', () => {
    for (const n of namn) {
      const html = renderToStaticMarkup(<Ikon namn={n} />)
      expect(html, n).not.toContain('metadata')
      expect(html, n).toContain('fill="currentColor"')
      expect(html, n).toMatch(/<mask id="([^"]+)"[\s\S]*mask="url\(#\1\)"/)
      // Bara currentColor syns. Svart och vitt finns bara inne i masken, där de säger vad som skärs bort.
      const utanMask = html.replace(/<mask[\s\S]*?<\/mask>/g, '')
      const farger = [...utanMask.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1]).filter((f) => f !== 'none')
      expect(new Set(farger), n).toEqual(new Set(['currentColor']))
    }
  })

  it('ger varje ikon på sidan ett eget mask-id', () => {
    const html = renderToStaticMarkup(
      <div>
        <Ikon namn="hem" />
        <Ikon namn="hem" />
        <Ikon namn="kniv" />
      </div>,
    )
    const id = [...html.matchAll(/<mask id="([^"]+)"/g)].map((m) => m[1])
    expect(id).toHaveLength(3)
    expect(new Set(id).size).toBe(3)
    for (const i of id) expect(html).toContain(`url(#${i})`)
  })
})
