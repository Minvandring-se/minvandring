import { describe, expect, it } from 'vitest'
import { rullmal } from './rullning'

describe('rullmal', () => {
  it('rullar till toppen på en ny sida', () => {
    expect(rullmal('PUSH', false, undefined)).toBe(0)
    expect(rullmal('REPLACE', false, 400)).toBe(0)
  })

  it('går tillbaka dit man var när man går bakåt', () => {
    expect(rullmal('POP', false, 659)).toBe(659)
    expect(rullmal('POP', false, undefined)).toBe(0)
  })

  it('rör inte läget för en länk inom sidan eller ett flikbyte', () => {
    expect(rullmal('PUSH', true, undefined)).toBeNull()
    expect(rullmal('REPLACE', false, undefined, true)).toBeNull()
  })
})
