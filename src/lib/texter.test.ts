import { describe, expect, it } from 'vitest'
import { laddfelText } from './texter'

describe('laddfelText', () => {
  it('säger vad som inte gick att hämta, och samma råd överallt', () => {
    expect(laddfelText('dina turer')).toBe('Det gick inte att hämta dina turer. Kontrollera uppkopplingen och försök igen.')
    expect(laddfelText('katalogen')).toBe('Det gick inte att hämta katalogen. Kontrollera uppkopplingen och försök igen.')
  })
})
