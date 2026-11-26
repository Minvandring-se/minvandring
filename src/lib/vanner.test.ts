import { describe, expect, it } from 'vitest'
import { giltigTillText, kontrolleraVanadress, skickadText, turerIhopText, vanfel, vanlankAdress } from './vanner'

describe('turerIhopText', () => {
  it('räknar turerna och visar den senaste', () => {
    expect(turerIhopText(0, null)).toBe('Inga turer ihop än')
    expect(turerIhopText(1, 'Kungsleden 2026')).toBe('1 tur ihop, senast Kungsleden 2026')
    expect(turerIhopText(3, 'Sörmlandsleden')).toBe('3 turer ihop, senast Sörmlandsleden')
    expect(turerIhopText(2, null)).toBe('2 turer ihop')
  })
})

describe('giltigTillText', () => {
  it('visar dagen i svensk tid', () => {
    expect(giltigTillText('2026-12-03T12:00:00Z')).toBe('Länken gäller till 3 december.')
    // 23.30 UTC den 3:e är den 4:e i Sverige.
    expect(giltigTillText('2026-12-03T23:30:00Z')).toBe('Länken gäller till 4 december.')
  })
})

describe('vanlankAdress', () => {
  it('pekar på www.minvandring.se/van/KOD', () => {
    expect(vanlankAdress('abc')).toBe('https://www.minvandring.se/van/abc')
  })
})

describe('kontrolleraVanadress', () => {
  it('säger till om adressen saknas eller ser fel ut', () => {
    expect(kontrolleraVanadress('')).toBe('Fyll i din väns mejladress.')
    expect(kontrolleraVanadress('anna')).toBe('Mejladressen ser inte rätt ut.')
    expect(kontrolleraVanadress(' anna@exempel.se ')).toBeNull()
  })
})

describe('vanfel', () => {
  it('översätter databasens fel och har ett allmänt fel för resten', () => {
    expect(vanfel('För många vänförfrågningar. Vänta till i morgon och försök igen.')).toMatch(/Vänta till i morgon/)
    expect(vanfel('För många försök. Vänta en stund och försök igen.')).toMatch(/Vänta en timme/)
    expect(vanfel('Det är din egen vänlänk')).toMatch(/din egen vänlänk/)
    expect(vanfel('Du måste vara inloggad')).toBe('Du är utloggad. Logga in och försök igen.')
    expect(vanfel(undefined)).toMatch(/Kontrollera uppkopplingen/)
  })
})

describe('skickadText', () => {
  const nu = new Date('2026-11-27T12:00:00+01:00')
  it('säger när förfrågan skickades', () => {
    expect(skickadText('2026-11-27T11:59:50+01:00', nu)).toBe('Förfrågan skickad nyss')
    expect(skickadText('2026-11-27T11:55:00+01:00', nu)).toBe('Förfrågan skickad för 5 min sedan')
    expect(skickadText('2026-11-27T09:00:00+01:00', nu)).toBe('Förfrågan skickad för 3 tim sedan')
    expect(skickadText('2026-11-26T09:00:00+01:00', nu)).toBe('Förfrågan skickad i går')
    expect(skickadText('2026-11-20T09:00:00+01:00', nu)).toBe('Förfrågan skickad den 20 nov')
  })
})
