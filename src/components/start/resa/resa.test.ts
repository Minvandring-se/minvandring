import { describe, expect, it } from 'vitest'
import { planeraResa, vikter, type Placerad, type Ruta, type Underlag } from './resa'

/** Startsidan i förenklad form: fem paneler med fyra glipor emellan, som i mobil eller på dator. */
function sidan(bredd: number, panelbredd: number, panelhojd: number, glipa: number): Underlag {
  const vanster = (bredd - panelbredd) / 2
  const hoger = vanster + panelbredd
  const hinder: Ruta[] = []
  const glipor: Ruta[] = []
  let y = 48
  for (let i = 0; i < 5; i++) {
    hinder.push({ vanster, hoger, topp: y, botten: y + panelhojd })
    y += panelhojd
    if (i < 4) {
      glipor.push({ vanster, hoger, topp: y, botten: y + glipa })
      y += glipa
    }
  }
  return { bredd, hojd: y, hinder, glipor }
}

const skarmar = {
  mobil: sidan(366, 366, 1100, 144),
  laptop: sidan(1318, 1152, 650, 160),
  stor: sidan(1872, 1152, 650, 160),
}

const ruta = (f: Placerad): Ruta => ({ vanster: f.x - f.bredd / 2, hoger: f.x + f.bredd / 2, topp: f.y - f.hojd, botten: f.y })
const overlappar = (a: Ruta, b: Ruta) => !(a.hoger <= b.vanster || a.vanster >= b.hoger || a.botten <= b.topp || a.topp >= b.botten)

describe('planeraResa', () => {
  it('ritar aldrig över panelerna och håller sig inom sidan', () => {
    for (const [namn, u] of Object.entries(skarmar)) {
      for (const f of planeraResa(u)) {
        const r = ruta(f)
        expect(u.hinder.some((h) => overlappar(r, h)), `${namn} ${f.typ}`).toBe(false)
        expect(r.vanster >= 0 && r.hoger <= u.bredd && r.topp >= 0 && r.botten <= u.hojd, `${namn} ${f.typ}`).toBe(true)
      }
    }
  })

  it('lämnar mitten av gliporna fri, där leden och dess figurer står', () => {
    for (const [namn, u] of Object.entries(skarmar)) {
      const fri = u.bredd < 640 ? 0.3 : 0.09
      for (const f of planeraResa(u)) {
        for (const g of u.glipor) {
          const mitt = { vanster: g.vanster + fri * (g.hoger - g.vanster) + 1, hoger: g.hoger - fri * (g.hoger - g.vanster) - 1, topp: g.topp, botten: g.botten }
          expect(overlappar(ruta(f), mitt), `${namn} ${f.typ}`).toBe(false)
        }
      }
    }
  })

  it('har landskap i varje glipa, även i mobil', () => {
    for (const [namn, u] of Object.entries(skarmar)) {
      const figurer = planeraResa(u)
      u.glipor.forEach((g, i) => {
        expect(figurer.some((f) => f.y > g.topp && f.y <= g.botten), `${namn} glipa ${i + 1}`).toBe(true)
      })
    }
  })

  it('går från skog via sjö och höst till fjäll', () => {
    const figurer = planeraResa(skarmar.stor)
    const h = skarmar.stor.hojd
    const medel = (typer: string[]) => {
      const ys = figurer.filter((f) => typer.includes(f.typ)).map((f) => f.y / h)
      return ys.reduce((a, b) => a + b, 0) / ys.length
    }
    expect(medel(['gran'])).toBeLessThan(medel(['sjo']))
    expect(medel(['sjo'])).toBeLessThan(medel(['fjallbjork']))
    expect(medel(['fjallbjork'])).toBeLessThan(medel(['fjall']))
    // Snö finns bara längst ner.
    expect(figurer.filter((f) => f.sno).every((f) => f.y / h > 0.75)).toBe(true)
  })

  it('är glest: stora delar av sidan är tomma', () => {
    const u = skarmar.stor
    const yta = planeraResa(u).reduce((a, f) => a + f.bredd * f.hojd, 0)
    const fritt = u.bredd * u.hojd - u.hinder.reduce((a, h) => a + (h.hoger - h.vanster) * (h.botten - h.topp), 0)
    expect(yta / fritt).toBeLessThan(0.1)
  })

  it('ser likadant ut vid varje besök', () => {
    expect(planeraResa(skarmar.laptop)).toEqual(planeraResa(skarmar.laptop))
  })

  it('är tomt utan mått', () => {
    expect(planeraResa({ bredd: 0, hojd: 100, hinder: [], glipor: [] })).toEqual([])
    expect(planeraResa({ bredd: Number.NaN, hojd: 100, hinder: [], glipor: [] })).toEqual([])
  })
})

describe('vikter', () => {
  it('ändras mjukt längs sidan, utan hopp', () => {
    for (let p = 0; p < 1; p += 0.01) {
      const a = vikter(p)
      const b = vikter(p + 0.01)
      for (const k of Object.keys(a) as (keyof typeof a)[]) expect(Math.abs(a[k] - b[k])).toBeLessThan(0.12)
    }
  })
})
