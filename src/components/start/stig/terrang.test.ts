import { describe, expect, it } from 'vitest'
import { beraknaStig, FIGUR, kopplaStig, type Matt, type Stigbit } from './geometri'
import { hojdkurvor, KURVOR, terrangMotiv, type Ruta, type Terrang } from './terrang'

/** Mellanrummen som de är på sidan: mobil, surfplatta och dator. */
const sidan: Matt[] = [
  { bredd: 366, hojd: 144, vanster: 0, hoger: 366 },
  { bredd: 720, hojd: 144, vanster: 0, hoger: 720 },
  { bredd: 1318, hojd: 160, vanster: 83, hoger: 1235 },
  { bredd: 1872, hojd: 160, vanster: 360, hoger: 1512 },
]

/** Bitarna som på startsidan. */
const bitar = kopplaStig([
  { id: 'borja', terrang: 'skog', detaljer: [{ typ: 'eld', lage: 0.72 }] },
  { id: 'packning', terrang: 'sjo', detaljer: [{ typ: 'talt', lage: 0.3 }, { typ: 'tassar', lage: 0.7 }] },
  { id: 'tanken', terrang: 'host', detaljer: [{ typ: 'ledkors', lage: 0.6 }] },
  { id: 'fragor', terrang: 'fjall' },
] as const)

const figurrutor = (m: Matt, b: Stigbit): Ruta[] => {
  const f = beraknaStig(m, b, b.id)!.figurer
  const ruta = (p: { x: number; y: number }, s: { bredd: number; hojd: number }) => ({ vanster: p.x - s.bredd / 2, hoger: p.x + s.bredd / 2, topp: p.y - s.hojd, botten: p.y })
  return [
    ...(f.ledkryss ? [ruta(f.ledkryss, FIGUR.ledkryss)] : []),
    ...(f.vagvisare ? [ruta(f.vagvisare, FIGUR.vagvisare)] : []),
    ...f.detaljer.map((d) => ruta(d.punkt, d.typ === 'tassar' ? { bredd: 100, hojd: 20 } : d.typ === 'ledkors' ? FIGUR.ledkryss : FIGUR.detalj)),
  ]
}
const overlappar = (a: Ruta, b: Ruta) => !(a.hoger <= b.vanster || a.vanster >= b.hoger || a.botten <= b.topp || a.topp >= b.botten)

describe('hojdkurvor', () => {
  it('ger några linjer över hela mellanrummet, inom dess höjd', () => {
    for (const m of sidan) {
      const k = hojdkurvor(m, 'borja')
      expect(k).toHaveLength(KURVOR)
      for (const d of k) {
        const tal = d.replace(/[ML]/g, ' ').trim().split(/\s+/).map(Number)
        const xs = tal.filter((_, i) => i % 2 === 0)
        const ys = tal.filter((_, i) => i % 2 === 1)
        expect(Math.min(...xs)).toBe(0)
        expect(Math.max(...xs)).toBe(m.bredd)
        expect(Math.min(...ys)).toBeGreaterThanOrEqual(2)
        expect(Math.max(...ys)).toBeLessThanOrEqual(m.hojd - 2)
      }
    }
  })

  it('ser likadana ut vid varje besök och olika i olika mellanrum', () => {
    expect(hojdkurvor(sidan[2], 'borja')).toEqual(hojdkurvor(sidan[2], 'borja'))
    expect(hojdkurvor(sidan[2], 'borja')).not.toEqual(hojdkurvor(sidan[2], 'tanken'))
  })
})

describe('terrangMotiv', () => {
  it('visar motivet i varje mellanrum, i mobil och på dator', () => {
    for (const m of sidan)
      for (const b of bitar) {
        const { rutor } = terrangMotiv(m, b.terrang as Terrang, b.id, figurrutor(m, b))
        expect(rutor.length, `${m.bredd} ${b.terrang}`).toBeGreaterThan(0)
      }
  })

  it('krockar aldrig med ledens figurer och håller sig inom panelernas bredd och mellanrummet', () => {
    for (const m of sidan)
      for (const b of bitar) {
        const figurer = figurrutor(m, b)
        for (const r of terrangMotiv(m, b.terrang as Terrang, b.id, figurer).rutor) {
          expect(figurer.some((f) => overlappar(r, f)), `${m.bredd} ${b.terrang}`).toBe(false)
          expect(r.vanster).toBeGreaterThanOrEqual(m.vanster)
          expect(r.hoger).toBeLessThanOrEqual(m.hoger)
          expect(r.topp).toBeGreaterThanOrEqual(0)
          expect(r.botten).toBeLessThanOrEqual(m.hojd)
        }
      }
  })

  it('har skog och höstbjörkar på båda sidor om leden, en sjö och en fjällkedja', () => {
    const m = sidan[3]
    const antal = (t: Terrang, id: string) => terrangMotiv(m, t, id, []).rutor.length
    expect(antal('skog', 'borja')).toBe(2)
    expect(antal('host', 'tanken')).toBe(2)
    expect(antal('sjo', 'packning')).toBe(1)
    expect(antal('fjall', 'fragor')).toBe(1)
  })
})
