import { describe, expect, it } from 'vitest'
import { FIGUR } from './geometri'
import { FJALLRAV_STORLEK } from './Fjallrav'

describe('Fjallrav', () => {
  it('har samma mått som figuren som placeras längs leden', () => {
    expect(FIGUR.gryt).toEqual(FJALLRAV_STORLEK)
  })
})
