import { describe, expect, it } from 'vitest'
import { personfarger } from './personfarg'

describe('personfarger', () => {
  it('ger deltagarna färger i ordning och börjar om efter åtta', () => {
    const ids = Array.from({ length: 10 }, (_, i) => `d${i}`)
    const farger = personfarger(ids)
    expect(farger.get('d0')).toBe('var(--color-person-a)')
    expect(farger.get('d7')).toBe('var(--color-person-h)')
    expect(farger.get('d8')).toBe('var(--color-person-a)')
    expect(new Set(ids.slice(0, 8).map((id) => farger.get(id))).size).toBe(8)
  })
})
