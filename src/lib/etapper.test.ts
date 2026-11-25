import { describe, expect, it } from 'vitest'
import { arPlanerad, etappdagar, etappfalt, etapprubrik, etappsumma, kmFran, kmText, nattText, tolkaEtapp, type Etappfalt } from './etapper'
import type { Etapp } from './typer'

function etapp(dag: number, ovrigt: Partial<Etapp> = {}): Etapp {
  return { id: `e${dag}`, tur_id: 't', dag, fran: null, till: null, km: null, natt: null, boende: null, bokad: false, notering: null, ...ovrigt }
}

const tomt: Etappfalt = { fran: '', till: '', km: '', natt: '', boende: '', bokad: false, notering: '' }

describe('tolkaEtapp', () => {
  it('trimmar, gör tomma fält tomma och läser kilometer med komma', () => {
    const r = tolkaEtapp({ ...tomt, fran: ' Abisko ', till: 'Abiskojaure', km: '12,54', boende: 'stuga', bokad: true })
    expect(r).toEqual({ ok: true, varden: { fran: 'Abisko', till: 'Abiskojaure', km: 12.5, natt: null, boende: 'stuga', bokad: true, notering: null } })
  })

  it('ett tält kan inte vara bokat, och ett tomt formulär är tillåtet', () => {
    const r = tolkaEtapp({ ...tomt, boende: 'talt', bokad: true })
    expect(r.ok && r.varden.bokad).toBe(false)
    expect(tolkaEtapp(tomt)).toEqual({ ok: true, varden: { fran: null, till: null, km: null, natt: null, boende: null, bokad: false, notering: null } })
  })

  it('stoppar fel sträcka och för långa texter', () => {
    expect(tolkaEtapp({ ...tomt, km: 'tolv' }).ok).toBe(false)
    expect(tolkaEtapp({ ...tomt, km: '0' }).ok).toBe(false)
    expect(tolkaEtapp({ ...tomt, km: '0,01' }).ok).toBe(false)
    expect(tolkaEtapp({ ...tomt, km: '100' }).ok).toBe(false)
    expect(tolkaEtapp({ ...tomt, km: '99,9' }).ok).toBe(true)
    expect(tolkaEtapp({ ...tomt, natt: 'x'.repeat(81) }).ok).toBe(false)
    expect(tolkaEtapp({ ...tomt, notering: 'x'.repeat(301) }).ok).toBe(false)
  })
})

describe('etappfalt', () => {
  it('fyller från med gårdagens mål när dagen är tom', () => {
    expect(etappfalt(null, etapp(1, { till: 'Alesjaure' })).fran).toBe('Alesjaure')
    expect(etappfalt(etapp(2, { fran: 'Eget', km: '20.5' }), etapp(1, { till: 'Alesjaure' }))).toMatchObject({ fran: 'Eget', km: '20,5' })
  })
})

describe('etappdagar och etappsumma', () => {
  const etapper = [
    etapp(2, { fran: 'B', till: 'C', km: '20.5', natt: 'Sälka', boende: 'stuga' }),
    etapp(1, { fran: 'A', till: 'B', km: 15, boende: 'stuga', bokad: true }),
    etapp(3, { boende: 'talt' }),
    etapp(6, { km: 30 }),
  ]

  it('ger turens dagar i ordning och lägger etapper efter sista dagen för sig', () => {
    const d = etappdagar(4, etapper)
    expect(d.map((x) => [x.dag, x.etapp?.id ?? null, x.efterTuren])).toEqual([
      [1, 'e1', false],
      [2, 'e2', false],
      [3, 'e3', false],
      [4, null, false],
      [6, 'e6', true],
    ])
    expect(etappdagar(null, [])).toEqual([])
  })

  it('räknar kilometer, längsta dagen, planerade dagar och obokade stugor, men inte dagar efter turen', () => {
    expect(etappsumma(etappdagar(4, etapper))).toEqual({ km: 35.5, langsta: { dag: 2, km: 20.5 }, planerade: 3, utanKm: 2, obokade: [2] })
  })
})

describe('texter', () => {
  it('rubrik, natt och kilometer', () => {
    expect(etapprubrik(etapp(1, { fran: 'Abisko', till: 'Abiskojaure' }))).toBe('Abisko till Abiskojaure')
    expect(etapprubrik(etapp(1, { till: 'Sälka' }))).toBe('Till Sälka')
    expect(etapprubrik(etapp(1))).toBeNull()
    expect(nattText(etapp(1, { natt: 'Sälka fjällstuga', boende: 'stuga' }))).toBe('Natt: Sälka fjällstuga')
    expect(nattText(etapp(1, { boende: 'annat' }))).toBe('Natt: annat boende')
    expect(nattText(etapp(1, { boende: 'talt' }))).toBe('Natt: tält')
    expect(kmText(12.5)).toBe('12,5 km')
    expect(kmFran('20.5')).toBe(20.5)
    expect(kmFran(null)).toBeNull()
    expect(arPlanerad(etapp(1))).toBe(false)
    expect(arPlanerad(etapp(1, { natt: 'Hemma' }))).toBe(true)
  })
})
