import { describe, expect, it } from 'vitest'
import { forslagSomSaknas, minaKvar, narText, sorteraUppgifter, tolkaUppgift } from './uppgifter'

describe('tolkaUppgift', () => {
  it('tar bort mellanslag och stoppar tom och för lång text', () => {
    expect(tolkaUppgift('  Köp gas ')).toEqual({ text: 'Köp gas' })
    expect(tolkaUppgift(' ')).toEqual({ fel: 'Skriv vad som ska göras.' })
    expect(tolkaUppgift('a'.repeat(201))).toHaveProperty('fel')
  })
})

describe('forslagSomSaknas', () => {
  it('hoppar över förslag som redan finns, oavsett stora och små bokstäver', () => {
    expect(forslagSomSaknas([{ text: 'köp gas' }])).toEqual(['Boka stugor', 'Boka resan dit och hem', 'Lämna en färdplan hemma'])
  })
})

describe('sorteraUppgifter', () => {
  it('det som är kvar först efter datum, utan datum sist och det klara sist', () => {
    const u = (text: string, klar: boolean, klart_till: string | null, sortering = 0) => ({ text, klar, klart_till, sortering })
    const s = sorteraUppgifter([u('a', true, '2027-01-01'), u('b', false, null), u('c', false, '2027-07-01'), u('d', false, '2027-06-01'), u('e', false, null, -1)])
    expect(s.map((x) => x.text)).toEqual(['d', 'c', 'e', 'b', 'a'])
  })
})

describe('narText', () => {
  const idag = '2027-07-01'
  it('säger datumet, i dag och försenad, och brådskar inom en vecka', () => {
    expect(narText({ klar: false, klart_till: '2027-08-01' }, idag)).toEqual({ text: 'Senast 1 aug', bradskar: false })
    expect(narText({ klar: false, klart_till: '2027-07-08' }, idag)).toEqual({ text: 'Senast 8 juli', bradskar: true })
    expect(narText({ klar: false, klart_till: '2027-07-01' }, idag)).toEqual({ text: 'Senast i dag', bradskar: true })
    expect(narText({ klar: false, klart_till: '2027-06-28' }, idag)).toEqual({ text: 'Försenad, 28 juni', bradskar: true })
  })

  it('en klar uppgift är klar, och utan datum blir det ingen text', () => {
    expect(narText({ klar: true, klart_till: '2027-06-28' }, idag)).toEqual({ text: 'Klar', bradskar: false })
    expect(narText({ klar: false, klart_till: null }, idag)).toBeNull()
  })
})

describe('minaKvar', () => {
  it('räknar mina uppgifter som inte är klara', () => {
    const u = [
      { ansvarig: 'jag', klar: false },
      { ansvarig: 'jag', klar: true },
      { ansvarig: 'du', klar: false },
    ]
    expect(minaKvar(u, 'jag')).toBe(1)
    expect(minaKvar(u, null)).toBe(0)
  })
})
