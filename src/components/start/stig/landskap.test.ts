import { describe, expect, it } from 'vitest'
import type { Matt } from './geometri'
import { ritaLandskap, type Landskap } from './landskap'

const typer: Landskap[] = ['fjall', 'skog', 'sjo']
const sidan: Matt[] = [
  { bredd: 366, hojd: 144, vanster: 0, hoger: 366 },
  { bredd: 1318, hojd: 160, vanster: 83, hoger: 1235 },
]

/** Alla koordinatpar i en sökväg, utom de relativa i vågorna (q). */
function punkter(d: string): [number, number][] {
  const ut: [number, number][] = []
  for (const del of d.split(/(?=[MLHZq])/)) {
    const tal = del.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number)
    if (del[0] === 'M' || del[0] === 'L') ut.push([tal[0], tal[1]])
  }
  return ut
}

describe('ritaLandskap', () => {
  it('håller sig inom panelernas bredd och inom mellanrummet', () => {
    const fel: string[] = []
    for (const m of sidan) {
      for (const typ of typer) {
        for (const f of ritaLandskap(m, typ, 'borja')) {
          for (const [x, y] of punkter(f.d)) {
            if (x < m.vanster - 8 || x > m.hoger + 8 || y < 0 || y > m.hojd) fel.push(`${m.bredd} ${typ}: ${x},${y}`)
          }
        }
      }
    }
    expect(fel).toEqual([])
  })

  it('ser likadant ut vid varje besök och olika för olika sektioner', () => {
    const m = sidan[1]
    expect(ritaLandskap(m, 'fjall', 'borja')).toEqual(ritaLandskap(m, 'fjall', 'borja'))
    expect(ritaLandskap(m, 'fjall', 'borja')).not.toEqual(ritaLandskap(m, 'fjall', 'fragor'))
  })

  it('fjällen har två kedjor och snö, och skogen har granar', () => {
    const m = sidan[1]
    const fjall = ritaLandskap(m, 'fjall', 'borja')
    expect(fjall).toHaveLength(3)
    expect(ritaLandskap(m, 'skog', 'packning').some((f) => f.klass.includes('fill-illustration') && f.d.length > 0)).toBe(true)
  })

  it('är tomt när mellanrummet saknar mått', () => {
    expect(ritaLandskap({ bredd: Number.NaN, hojd: 160, vanster: 0, hoger: 100 }, 'sjo', 'a')).toEqual([])
    expect(ritaLandskap({ bredd: 100, hojd: 160, vanster: 50, hoger: 50 }, 'sjo', 'a')).toEqual([])
  })
})
