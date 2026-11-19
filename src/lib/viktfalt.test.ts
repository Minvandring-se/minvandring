import { describe, expect, it } from 'vitest'
import { gramText, tolkaVikt, visaTolkning } from './viktfalt'

const gram = (text: string) => {
  const svar = tolkaVikt(text)
  return svar.ok ? svar.g : 'fel'
}

describe('tolkaVikt', () => {
  it('tolkar siffror utan enhet som gram', () => {
    expect(gram('1200')).toBe(1200)
    expect(gram('0')).toBe(0)
    expect(gram(' 850 ')).toBe(850)
  })

  it('tar emot gram med enhet', () => {
    expect(gram('1200 g')).toBe(1200)
    expect(gram('1200g')).toBe(1200)
    expect(gram('1200 G')).toBe(1200)
    expect(gram('1200 gram')).toBe(1200)
  })

  it('tar emot kilo med komma eller punkt, med eller utan mellanslag', () => {
    expect(gram('1,2 kg')).toBe(1200)
    expect(gram('1.2 kg')).toBe(1200)
    expect(gram('1,2kg')).toBe(1200)
    expect(gram('0,85 kg')).toBe(850)
    expect(gram('2 kg')).toBe(2000)
    expect(gram('1,25 KG')).toBe(1250)
    expect(gram('3 kilo')).toBe(3000)
  })

  it('avrundar kilo till hela gram utan räknefel', () => {
    expect(gram('1,005 kg')).toBe(1005)
    expect(gram('0,1 kg')).toBe(100)
    expect(gram('2,675 kg')).toBe(2675)
    expect(gram('1,2345 kg')).toBe(1235)
  })

  it('läser mellanslag mellan siffror som tusentalsavgränsare', () => {
    expect(gram('1 200')).toBe(1200)
    expect(gram('1 200 g')).toBe(1200)
    expect(gram('12 500 g')).toBe(12500)
  })

  it('låter fältet vara tomt', () => {
    expect(tolkaVikt('')).toEqual({ ok: true, g: null })
    expect(tolkaVikt('   ')).toEqual({ ok: true, g: null })
  })

  it('godtar inte decimaler utan enhet, eftersom det kan vara gram eller kilo', () => {
    expect(gram('1,2')).toBe('fel')
    expect(gram('1.2')).toBe('fel')
    expect(gram('1,5 g')).toBe('fel')
  })

  it.each(['tungt', '-5', '1,2 kg extra', 'kg', '1,,2 kg', '1.2.3 kg', '12 lbs', '1e3', '+5', ',5 kg'])('ger fel för "%s"', (text) => {
    const svar = tolkaVikt(text)
    expect(svar.ok).toBe(false)
    if (!svar.ok) expect(svar.fel.length).toBeGreaterThan(10)
  })

  it('godtar högst 100 kg', () => {
    expect(gram('100000')).toBe(100000)
    expect(gram('100 kg')).toBe(100000)
    expect(gram('100001')).toBe('fel')
    expect(gram('100,5 kg')).toBe('fel')
  })
})

describe('visaTolkning', () => {
  it('visar vad det man skrev blir i gram', () => {
    expect(visaTolkning('1,2 kg')).toBe('= 1\u00a0200\u00a0g')
    expect(visaTolkning('1200')).toBe('= 1\u00a0200\u00a0g')
    expect(visaTolkning('0,85 kg')).toBe('= 850\u00a0g')
    expect(visaTolkning('12,5 kg')).toBe('= 12\u00a0500\u00a0g')
  })

  it('visar ingenting för ett tomt eller ogiltigt fält', () => {
    expect(visaTolkning('')).toBeNull()
    expect(visaTolkning('1,2')).toBeNull()
    expect(visaTolkning('tungt')).toBeNull()
  })
})

describe('gramText', () => {
  it('sätter mellanslag mellan tusental', () => {
    expect(gramText(0)).toBe('0\u00a0g')
    expect(gramText(999)).toBe('999\u00a0g')
    expect(gramText(1000)).toBe('1\u00a0000\u00a0g')
    expect(gramText(100000)).toBe('100\u00a0000\u00a0g')
  })
})
