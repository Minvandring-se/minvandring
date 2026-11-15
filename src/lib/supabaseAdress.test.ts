import { describe, expect, it } from 'vitest'
import { supabaseAdress } from './supabaseAdress'

const RATT = 'https://psvuzkkauiqhimnhtjep.supabase.co'

describe('supabaseAdress', () => {
  it('lämnar en rätt adress orörd', () => {
    expect(supabaseAdress(RATT)).toBe(RATT)
  })
  it('tar bort /rest/v1 och snedstreck på slutet', () => {
    expect(supabaseAdress(`${RATT}/rest/v1`)).toBe(RATT)
    expect(supabaseAdress(`${RATT}/rest/v1/`)).toBe(RATT)
    expect(supabaseAdress(`${RATT}/auth/v1`)).toBe(RATT)
    expect(supabaseAdress(`${RATT}/`)).toBe(RATT)
  })
  it('tar bort mellanslag', () => {
    expect(supabaseAdress(`  ${RATT}\n`)).toBe(RATT)
  })
  it('ger undefined när adressen saknas', () => {
    expect(supabaseAdress(undefined)).toBeUndefined()
    expect(supabaseAdress('  ')).toBeUndefined()
  })
})
