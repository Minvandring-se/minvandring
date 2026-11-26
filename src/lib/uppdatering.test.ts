import { describe, expect, it, vi } from 'vitest'
import { farLaddaOm, SOK_VAR_MS, SPARR_MS, startaUppdateringar, type Webblasare } from './uppdatering'

function falsk(opt: { utanServiceWorker?: boolean; registreringMisslyckas?: boolean } = {}) {
  const lyssnare: Record<string, (e: Event) => void> = {}
  const lagrat = new Map<string, string>()
  const update = vi.fn(async () => undefined)
  const register = vi.fn(async () => {
    if (opt.registreringMisslyckas) throw new Error('nej')
    return { update } as unknown as ServiceWorkerRegistration
  })
  let synlig = true
  let nu = 1_000_000
  const w: Webblasare = {
    serviceWorker: opt.utanServiceWorker ? undefined : { register },
    addEventListener: (typ, f) => void (lyssnare[typ] = f),
    synlig: () => synlig,
    sessionStorage: { getItem: (k) => lagrat.get(k) ?? null, setItem: (k, v) => void lagrat.set(k, v) },
    laddaOm: vi.fn(),
    setInterval: vi.fn(),
    nu: () => nu,
  }
  const fil = () => {
    const e = new Event('vite:preloadError', { cancelable: true })
    lyssnare['vite:preloadError'](e)
    return e
  }
  return { w, lyssnare, register, update, fil, satt: (s: boolean) => (synlig = s), tid: (ms: number) => (nu += ms) }
}

describe('appen uppdaterar sig själv', () => {
  it('registrerar service workern och söker efter en ny version när man kommer tillbaka och en gång i timmen', async () => {
    const f = falsk()
    await startaUppdateringar(f.w)
    expect(f.register).toHaveBeenCalledWith('/sw.js', { scope: '/' })
    expect(f.w.setInterval).toHaveBeenCalledWith(expect.any(Function), SOK_VAR_MS)
    f.satt(false)
    f.lyssnare.visibilitychange(new Event('visibilitychange'))
    expect(f.update).not.toHaveBeenCalled()
    f.satt(true)
    f.lyssnare.visibilitychange(new Event('visibilitychange'))
    expect(f.update).toHaveBeenCalledTimes(1)
  })

  it('laddar aldrig om sidan när den söker', async () => {
    const f = falsk()
    await startaUppdateringar(f.w)
    f.lyssnare.visibilitychange(new Event('visibilitychange'))
    expect(f.w.laddaOm).not.toHaveBeenCalled()
  })

  it('laddar om en gång när en fil från en gammal version saknas, men inte igen i en slinga', async () => {
    const f = falsk()
    await startaUppdateringar(f.w)
    expect(f.fil().defaultPrevented).toBe(true)
    expect(f.w.laddaOm).toHaveBeenCalledTimes(1)
    f.tid(5_000)
    expect(f.fil().defaultPrevented).toBe(false)
    expect(f.w.laddaOm).toHaveBeenCalledTimes(1)
    f.tid(SPARR_MS)
    f.fil()
    expect(f.w.laddaOm).toHaveBeenCalledTimes(2)
  })

  it('klarar sig utan service worker och när registreringen misslyckas', async () => {
    const utan = falsk({ utanServiceWorker: true })
    await startaUppdateringar(utan.w)
    expect(utan.lyssnare['vite:preloadError']).toBeDefined()
    expect(utan.lyssnare.visibilitychange).toBeUndefined()
    const misslyckas = falsk({ registreringMisslyckas: true })
    await expect(startaUppdateringar(misslyckas.w)).resolves.toBeUndefined()
    expect(misslyckas.w.setInterval).not.toHaveBeenCalled()
  })

  it('tillåter omladdning när den inte har skett nyss', () => {
    expect(farLaddaOm(null, 100_000)).toBe(true)
    expect(farLaddaOm('skräp', 100_000)).toBe(true)
    expect(farLaddaOm('90000', 100_000)).toBe(false)
    expect(farLaddaOm('60000', 100_000)).toBe(true)
    expect(farLaddaOm('200000', 100_000)).toBe(true)
  })
})
