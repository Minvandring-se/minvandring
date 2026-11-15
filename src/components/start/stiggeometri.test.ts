import { describe, expect, it } from 'vitest'
import { kopplaStig, skapaStig, type Stigmal } from './stiggeometri'

/** En sektion på 1440 px med innehåll på 1152 px i mitten och 80 px padding. */
const mal: Stigmal = {
  bredd: 1440,
  hojd: 800,
  innehallVanster: 144,
  innehallHoger: 1296,
  innehallTopp: 80,
  innehallBotten: 720,
}

describe('kopplaStig', () => {
  it('låter varje bit börja där förra slutade', () => {
    const delar = kopplaStig([
      { id: 'a', slut: 'hoger' as const },
      { id: 'b', slut: 'vanster' as const },
      { id: 'c', slut: 'vanster' as const },
    ])
    expect(delar.map((d) => [d.start, d.slut])).toEqual([
      ['vanster', 'hoger'],
      ['hoger', 'vanster'],
      ['vanster', 'vanster'],
    ])
  })

  it('kan börja till höger', () => {
    expect(kopplaStig([{ slut: 'vanster' as const }], 'hoger')[0].start).toBe('hoger')
  })

  it('markerar första och sista biten utifrån ordningen', () => {
    const delar = kopplaStig([{ slut: 'hoger' as const }, { slut: 'vanster' as const }, { slut: 'hoger' as const }])
    expect(delar.map((d) => [d.forsta, d.sista])).toEqual([
      [true, false],
      [false, false],
      [false, true],
    ])
  })

  it('en ensam bit är både första och sista', () => {
    const [bit] = kopplaStig([{ slut: 'hoger' as const }])
    expect(bit.forsta).toBe(true)
    expect(bit.sista).toBe(true)
  })

  it('behåller övriga egenskaper, som id och svang', () => {
    const [bit] = kopplaStig([{ id: 'packning', slut: 'hoger' as const, svang: 12 }])
    expect(bit).toMatchObject({ id: 'packning', svang: 12 })
  })

  it('ger en tom lista för inga bitar', () => {
    expect(kopplaStig([])).toEqual([])
  })
})

describe('skapaStig', () => {
  const bit = { start: 'vanster' as const, slut: 'hoger' as const }

  it('går 48 px utanför innehållet på båda sidor', () => {
    const stig = skapaStig(mal, bit)
    expect(stig).not.toBeNull()
    expect(stig?.startX).toBe(96)
    expect(stig?.slutX).toBe(1344)
  })

  it('returnerar null när marginalen är för smal', () => {
    // 1360 px bred men innehållet når 95 px från kanten.
    expect(skapaStig({ ...mal, bredd: 1360, innehallVanster: 95, innehallHoger: 1265 }, bit)).toBeNull()
    // Bara högermarginalen är för smal.
    expect(skapaStig({ ...mal, innehallHoger: 1345 }, bit)).toBeNull()
    // Precis 96 px räcker.
    expect(skapaStig({ ...mal, bredd: 1360, innehallVanster: 96, innehallHoger: 1264 }, bit)).not.toBeNull()
  })

  it('räknar på sektionens bredd, så en rullningslist i fönstret inte döljer stigen', () => {
    // Fönster på 1366 px med en rullningslist på 17 px i Windows.
    expect(skapaStig({ ...mal, bredd: 1349, innehallVanster: 98.5, innehallHoger: 1250.5 }, bit)).not.toBeNull()
  })

  it('returnerar null när paddingen uppe eller nere är för liten', () => {
    expect(skapaStig({ ...mal, innehallTopp: 64 }, bit)).toBeNull()
    expect(skapaStig({ ...mal, innehallBotten: 736 }, bit)).toBeNull()
  })

  it('returnerar null för mått som inte är tal', () => {
    expect(skapaStig({ ...mal, hojd: Number.NaN }, bit)).toBeNull()
  })

  it('lämnar plats för vägvisarna i första och sista biten', () => {
    const stig = skapaStig(mal, { ...bit, forsta: true, sista: true })
    expect(stig?.startY).toBe(68)
    expect(stig?.slutY).toBe(792)
    const mitten = skapaStig(mal, bit)
    expect(mitten?.startY).toBe(0)
    expect(mitten?.slutY).toBe(800)
  })

  it('håller alla kontrollpunkter utanför innehållet', () => {
    for (const b of [bit, { start: 'hoger' as const, slut: 'vanster' as const, svang: 24 }]) {
      const d = skapaStig(mal, b)?.d ?? ''
      const tal = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
      for (let i = 0; i < tal.length; i += 2) {
        const [x, y] = [tal[i], tal[i + 1]]
        const iInnehallet = x > mal.innehallVanster && x < mal.innehallHoger && y > mal.innehallTopp && y < mal.innehallBotten
        expect(iInnehallet, `punkten ${x} ${y}`).toBe(false)
      }
    }
  })
})
