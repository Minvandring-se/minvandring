import { describe, expect, it } from 'vitest'
import { arAppLank, klockansNamn, notistid, olastaSiffra } from './notiser'

describe('olastaSiffra', () => {
  it('är tom utan olästa och 9+ över nio', () => {
    expect(olastaSiffra(0)).toBe('')
    expect(olastaSiffra(1)).toBe('1')
    expect(olastaSiffra(9)).toBe('9')
    expect(olastaSiffra(10)).toBe('9+')
  })
})

describe('klockansNamn', () => {
  it('säger hur många som är olästa', () => {
    expect(klockansNamn(0)).toBe('Notiser')
    expect(klockansNamn(1)).toBe('Notiser, 1 oläst')
    expect(klockansNamn(4)).toBe('Notiser, 4 olästa')
  })
})

describe('notistid', () => {
  const nu = new Date('2026-11-27T12:00:00+01:00')
  it('visar minuter och timmar samma dag', () => {
    expect(notistid('2026-11-27T11:59:40+01:00', nu)).toBe('nyss')
    expect(notistid('2026-11-27T11:55:00+01:00', nu)).toBe('5 min')
    expect(notistid('2026-11-27T09:00:00+01:00', nu)).toBe('3 tim')
  })
  it('visar i går och sedan datumet, med år bara för ett annat år', () => {
    expect(notistid('2026-11-26T23:30:00+01:00', nu)).toBe('i går')
    expect(notistid('2026-11-24T08:00:00+01:00', nu)).toBe('24 nov')
    expect(notistid('2025-12-31T08:00:00+01:00', nu)).toBe('31 dec 2025')
  })
  it('räknar dagen i svensk tid', () => {
    // 23.30 UTC den 26:e är 00.30 den 27:e i Sverige: samma dag som nu.
    expect(notistid('2026-11-26T23:30:00Z', nu)).toBe('11 tim')
  })
})

describe('arAppLank', () => {
  it('släpper bara fram sökvägar inom appen', () => {
    expect(arAppLank('/tur/abc#deltagare')).toBe(true)
    expect(arAppLank('//annan.se')).toBe(false)
    expect(arAppLank('https://annan.se')).toBe(false)
    expect(arAppLank(null)).toBe(false)
  })
})
