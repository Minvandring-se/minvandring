import { describe, expect, it } from 'vitest'
import { tolkaRad } from './hamtning'

describe('tolkaRad', () => {
  it('ger raden när den finns', () => {
    expect(tolkaRad({ data: { id: '1' }, error: null })).toEqual({ lage: 'klar', data: { id: '1' } })
  })

  it('säger att raden saknas när svaret är tomt, till exempel när man inte är med i turen', () => {
    expect(tolkaRad({ data: null, error: null })).toEqual({ lage: 'saknas' })
  })

  it('räknar ett ogiltigt id i adressen som att raden saknas', () => {
    expect(tolkaRad({ data: null, error: { code: '22P02', message: 'invalid input syntax for type uuid' } })).toEqual({ lage: 'saknas' })
  })

  it('skiljer ut nätverksfel och andra fel, så att de inte visas som att turen saknas', () => {
    expect(tolkaRad({ data: null, error: { code: '', message: 'TypeError: Failed to fetch' } })).toEqual({ lage: 'fel' })
    expect(tolkaRad({ data: null, error: { message: 'timeout' } })).toEqual({ lage: 'fel' })
    expect(tolkaRad({ data: null, error: { code: '42501', message: 'permission denied' } })).toEqual({ lage: 'fel' })
  })
})
