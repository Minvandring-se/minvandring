import { describe, expect, it } from 'vitest'
import { aktivSida } from './meny'
import { arAppsida } from './navigering'

describe('navigering', () => {
  it('markerar rätt del av menyn, även med snedstreck sist', () => {
    expect(aktivSida('/turer')).toBe('turer')
    expect(aktivSida('/tur/abc')).toBe('turer')
    expect(aktivSida('/forrad')).toBe('forrad')
    expect(aktivSida('/profil/')).toBe('profil')
  })

  it('visar inte sidomenyn på startsidan, kontosidorna eller integritetssidan', () => {
    for (const s of ['/', '/logga-in', '/skapa-konto', '/integritet', '/ga-med/abc', '/turerna']) expect(arAppsida(s), s).toBe(false)
    for (const s of ['/turer', '/installningar', '/statistik', '/kom-ihag', '/hem', '/hitta-vandring/']) expect(arAppsida(s), s).toBe(true)
  })
})
