import { describe, expect, it } from 'vitest'
import { KONTAKT_MEJL, felrapportLank } from './kontakt'

describe('felrapportLank', () => {
  const akto = { id: '11111111-2222-3333-4444-555555555555', marke: 'Hilleberg', modell: 'Akto', version: 'Red Label' }
  const delar = (lank: string) => {
    const url = new URL(lank)
    return { till: url.pathname, amne: url.searchParams.get('subject'), text: url.searchParams.get('body') }
  }

  it('går till kontaktadressen med märke, modell och version i ämnet', () => {
    const { till, amne } = delar(felrapportLank(akto)!)
    expect(till).toBe(KONTAKT_MEJL)
    expect(amne).toBe('Fel i katalogen: Hilleberg Akto Red Label')
  })

  it('har produktens id i texten', () => {
    expect(delar(felrapportLank(akto)!).text).toContain('Id: 11111111-2222-3333-4444-555555555555')
  })

  it('utelämnar versionen när den saknas', () => {
    expect(delar(felrapportLank({ ...akto, version: null })!).amne).toBe('Fel i katalogen: Hilleberg Akto')
  })

  it('kodar tecken som annars bryter länken', () => {
    const lank = felrapportLank({ ...akto, marke: 'Fjällräven', modell: 'Keb & Abisko 50%', version: '6′0″ #2' })!
    expect(lank).not.toMatch(/[ &#]Abisko|ä|″/)
    expect(delar(lank).amne).toBe('Fel i katalogen: Fjällräven Keb & Abisko 50% 6′0″ #2')
  })
})
