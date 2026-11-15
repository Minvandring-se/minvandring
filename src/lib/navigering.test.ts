import { describe, expect, it } from 'vitest'
import { aktivDel, arAppsida } from './navigering'

describe('navigering', () => {
  it('markerar rätt del av menyn', () => {
    expect(aktivDel('/turer')).toBe('turer')
    expect(aktivDel('/tur/abc')).toBe('turer')
    expect(aktivDel('/forrad')).toBe('forrad')
    expect(aktivDel('/profil/')).toBe('profil')
  })

  it('visar inte sidomenyn på startsidan, kontosidorna eller integritetssidan', () => {
    for (const s of ['/', '/logga-in', '/skapa-konto', '/integritet', '/ga-med/abc', '/turerna']) expect(arAppsida(s), s).toBe(false)
    expect(arAppsida('/turer')).toBe(true)
  })
})
