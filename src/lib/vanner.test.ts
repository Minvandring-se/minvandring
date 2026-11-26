import { describe, expect, it } from 'vitest'
import { VANNER_I_TURER, giltigTillText, kontrolleraVanadress, sammaSom, skickadText, tillagdaText, turerIhopText, turerMedVanner, vanfel, vanlankAdress, vannerUtanfor } from './vanner'

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

describe('vänner i turer', () => {
  const vanner = [{ user_id: 'a' }, { user_id: 'b' }, { user_id: 'c' }]

  it('vannerUtanfor tar bort dem som redan är med', () => {
    expect(vannerUtanfor(vanner, ['b', null, 'x']).map((v) => v.user_id)).toEqual(['a', 'c'])
  })

  it('sammaSom väljer vännerna som var med i en annan tur', () => {
    expect([...sammaSom(vanner, [{ user_id: 'c' }, { user_id: null }, { user_id: 'jag' }, {}])]).toEqual(['c'])
  })

  it('turerMedVanner visar bara turer med minst en vän, senast skapad först', () => {
    const turer = [
      { id: '1', skapad: '2026-01-01', deltagare: [{ user_id: 'a' }] },
      { id: '2', skapad: '2026-06-01', deltagare: [{ user_id: 'x' }] },
      { id: '3', skapad: '2026-09-01', deltagare: [{ user_id: 'b' }, { user_id: null }] },
    ]
    expect(turerMedVanner(turer, vanner).map((t) => t.id)).toEqual(['3', '1'])
  })

  it('tillagdaText', () => {
    expect(tillagdaText(0)).toBe('Ingen ny lades till. De kan redan vara med i turen.')
    expect(tillagdaText(1, 'Anna')).toBe('Anna är tillagd i turen.')
    expect(tillagdaText(3)).toBe('3 vänner är tillagda i turen.')
  })
})

describe('VANNER_I_TURER', () => {
  it('säger att vänner kan lägga till en i turer och att man alltid kan lämna', () => {
    expect(VANNER_I_TURER).toBe('Vänner kan lägga till dig i sina turer. Du kan alltid lämna en tur.')
  })
})
