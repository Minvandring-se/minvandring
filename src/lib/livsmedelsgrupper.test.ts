import { describe, expect, it } from 'vitest'
import { allergenerForLivsmedel, arMatratt, MATRATTSGRUPPER } from './livsmedelsgrupper'

describe('arMatratt', () => {
  it('räknar färdiga rätter som maträtter, men inte råvaror', () => {
    expect(arMatratt('Kötträtt')).toBe(true)
    expect(arMatratt('Soppa')).toBe(true)
    expect(arMatratt('Pasta och liknande produkter')).toBe(false)
    expect(arMatratt(null)).toBe(false)
    expect(new Set(MATRATTSGRUPPER).size).toBe(MATRATTSGRUPPER.length)
  })
})

describe('allergenerForLivsmedel', () => {
  const a = allergenerForLivsmedel

  it('ger mjölk för mejerier, ägg för ägg och fisk för fisk', () => {
    expect(a('Mjölk standard fett 3%', 'Mjölk')).toEqual(['mjolk'])
    expect(a('Mjölk laktosfri', 'Mjölk')).toEqual(['mjolk'])
    expect(a('Äggula rå', 'Ägg')).toEqual(['agg'])
    expect(a('Lax odlad rå', 'Fisk')).toEqual(['fisk'])
  })

  it('räknar skaldjur som kräftdjur eller blötdjur och inte som fisk, även i gruppen Fisk', () => {
    expect(a('Räka kokt', 'Fisk och skaldjur')).toEqual(['kraftdjur'])
    expect(a('Krabba kokt', 'Fisk')).toEqual(['kraftdjur'])
    expect(a('Bläckfisk rå', 'Fisk')).toEqual(['blotdjur'])
    expect(a('Blåmussla kokt', 'Fisk och skaldjur')).toEqual(['blotdjur'])
  })

  it('ger gluten för vete, råg, korn, havre och dinkel, men inte för bovete, hirs, ris eller majs', () => {
    expect(a('Vetemjöl', 'Cerealier eller cerealielika mjölprodukter och derivat')).toEqual(['gluten'])
    expect(a('Havregryn fullkorn', 'Ris eller annat spannmål')).toEqual(['gluten'])
    expect(a('Korngryn ångprep. fullkorn', 'Ris eller annat spannmål')).toEqual(['gluten'])
    expect(a('Bovete hela el. krossade korn', 'Ris eller annat spannmål')).toEqual([])
    expect(a('Hirs hela el. krossade korn fullkorn', 'Ris eller annat spannmål')).toEqual([])
    expect(a('Ris vildris okokt', 'Ris eller annat spannmål')).toEqual([])
    expect(a('Majsgryn polenta kokt m. salt', 'Ris eller annat spannmål')).toEqual([])
  })

  it('ger gluten för pasta utom pasta av ris, majs eller bönor, glasnudlar och glutenfri pasta', () => {
    expect(a('Pasta okokt', 'Pasta och liknande produkter')).toEqual(['gluten'])
    expect(a('Nudlar äggnudlar okokta', 'Pasta och liknande produkter')).toEqual(['gluten', 'agg'])
    expect(a('Nudlar glasnudlar okokta', 'Pasta och liknande produkter')).toEqual([])
    expect(a('Pasta tagliatelle m. ägg okokt glutenfri', 'Pasta och liknande produkter')).toEqual(['agg'])
  })

  it('läser nötter, jordnötter, soja, sesam och selleri ur namnet, utan att förväxla dem med liknande ord', () => {
    expect(a('Hasselnötter', 'Nöt, frö eller kärna')).toEqual(['notter'])
    expect(a('Mandlar sötmandel', 'Nöt, frö eller kärna')).toEqual(['notter'])
    expect(a('Sellerikål pak choi', 'Grönsaker och svamp')).toEqual([])
    expect(a('Sojabönor torkade', 'Baljväxter')).toEqual(['soja'])
    expect(a('Sesamolja', 'Vegetabiliskt fett och olja')).toEqual(['sesam'])
    expect(a('Rotselleri', 'Grönsaker och svamp')).toEqual(['selleri'])
    expect(a('Potatis mandelpotatis rå', 'Potatis och stärkelserika rötter')).toEqual([])
    expect(a('Lamm lägg rå', 'Rött kött')).toEqual([])
    expect(a('Ostronskivling', 'Grönsaker och svamp')).toEqual([])
  })

  it('räknar raffinerade oljor som fria från allergener, utom sesam- och jordnötsolja', () => {
    expect(a('Sojaolja', 'Vegetabiliskt fett och olja')).toEqual([])
    expect(a('Vetegroddsolja', 'Vegetabiliskt fett och olja')).toEqual([])
  })

  it('ger tom lista för enkla råvaror utan allergener', () => {
    expect(a('Nöt ryggbiff rå', 'Rött kött')).toEqual([])
    expect(a('Linser torkade', 'Baljväxter')).toEqual([])
    expect(a('Äpple', 'Frukt och bär')).toEqual([])
  })

  it('är okänd för sammansatta livsmedel, maträtter, torkad frukt och grupper som inte är enkla', () => {
    expect(a('Risgrynsgröt', 'Ris eller annat spannmål')).toBeNull()
    expect(a('Flygande Jakob kyckling m. bacon jordnötter banan', 'Fågel')).toBeNull()
    expect(a('Kycklingfilé panerad', 'Fågel')).toBeNull()
    expect(a('Aprikos torkad', 'Frukt och bär')).toBeNull()
    expect(a('Köttbullar', 'Kötträtt')).toBeNull()
    expect(a('Chips', 'Snacks')).toBeNull()
    expect(a('Okänt', null)).toBeNull()
  })
})
