import { describe, expect, it, vi } from 'vitest'
import { animera, skapaAnimationsko } from './animationsko'

const tomKo = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve()
}

describe('animationskö', () => {
  it('kör bara en scen åt gången', async () => {
    const ko = skapaAnimationsko()
    const logg: string[] = []
    let slutfor!: () => void
    ko.laggTill(async () => {
      logg.push('a')
      await new Promise<void>((klar) => {
        slutfor = klar
      })
      logg.push('a-klar')
    })
    ko.laggTill(async () => {
      logg.push('b')
    })
    await tomKo()
    expect(logg).toEqual(['a'])
    slutfor()
    await tomKo()
    expect(logg).toEqual(['a', 'a-klar', 'b'])
  })

  it('kör inte en köad scen som hunnit lämna skärmen', async () => {
    const ko = skapaAnimationsko()
    let slutfor!: () => void
    ko.laggTill(
      () =>
        new Promise<void>((klar) => {
          slutfor = klar
        }),
    )
    const andra = vi.fn(async () => {})
    const avbryt = ko.laggTill(andra)
    avbryt()
    await tomKo()
    slutfor()
    await tomKo()
    expect(andra).not.toHaveBeenCalled()
  })

  it('avbryter en pågående scen och låter nästa börja', async () => {
    const ko = skapaAnimationsko()
    let avbruten = false
    const avbryt = ko.laggTill(
      (signal) =>
        new Promise<void>((klar) => {
          signal.addEventListener(
            'abort',
            () => {
              avbruten = true
              klar()
            },
            { once: true },
          )
        }),
    )
    const andra = vi.fn(async () => {})
    ko.laggTill(andra)
    await tomKo()
    avbryt()
    await tomKo()
    expect(avbruten).toBe(true)
    expect(andra).toHaveBeenCalledOnce()
  })

  it('går att använda igen efter cleanup i StrictMode', async () => {
    const ko = skapaAnimationsko()
    const gammal = vi.fn(async () => {})
    ko.laggTill(gammal)
    ko.avbrytAlla()
    const ny = vi.fn(async () => {})
    ko.laggTill(ny)
    await tomKo()
    expect(gammal).not.toHaveBeenCalled()
    expect(ny).toHaveBeenCalledOnce()
  })

  it('minns spelade scener bara inom sin egen kö', () => {
    const a = skapaAnimationsko()
    const b = skapaAnimationsko()
    a.markeraSpelad('packning')
    expect(a.harSpelat('packning')).toBe(true)
    expect(b.harSpelat('packning')).toBe(false)
  })

  it('fortsätter efter ett oväntat fel', async () => {
    const fel = vi.fn()
    const ko = skapaAnimationsko(fel)
    ko.laggTill(async () => {
      throw new Error('test')
    })
    const andra = vi.fn(async () => {})
    ko.laggTill(andra)
    await tomKo()
    expect(fel).toHaveBeenCalledOnce()
    expect(andra).toHaveBeenCalledOnce()
  })
})

describe('animera', () => {
  it('startar inte en redan avbruten animation', async () => {
    const controller = new AbortController()
    controller.abort()
    const animate = vi.fn()
    const element = { animate } as unknown as Element
    await expect(animera(element, [], {}, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
    expect(animate).not.toHaveBeenCalled()
  })

  it('tar bort avslutade animationer med fill forwards när scenen avslutas', async () => {
    const cancel = vi.fn()
    const element = { animate: () => ({ finished: Promise.resolve(), cancel }) } as unknown as Element
    const controller = new AbortController()
    await animera(element, [{ opacity: 0 }, { opacity: 1 }], { duration: 500 }, controller.signal)
    expect(cancel).not.toHaveBeenCalled()
    controller.abort()
    expect(cancel).toHaveBeenCalledOnce()
  })
})

describe('fortsättningar i den övre luften', () => {
  const topp = () => ({ visa: vi.fn(async () => {}), stilla: vi.fn() })

  it('hittar en registrerad fortsättning och tar bort den igen', () => {
    const ko = skapaAnimationsko()
    const t = topp()
    const taBort = ko.registreraTopp('packning', t)
    expect(ko.topp('packning')).toBe(t)
    expect(ko.topp(undefined)).toBeUndefined()
    taBort()
    expect(ko.topp('packning')).toBeUndefined()
  })

  it('tar inte bort en nyare registrering med samma id', () => {
    const ko = skapaAnimationsko()
    const gammal = ko.registreraTopp('packning', topp())
    const ny = topp()
    ko.registreraTopp('packning', ny)
    gammal()
    expect(ko.topp('packning')).toBe(ny)
  })
})
