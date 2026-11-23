import { describe, expect, it } from 'vitest'
import { arAgare, kanAndra, kanAndraKostbehov, kanTaBort, type Roll } from './roller'

const agare = { id: '1', roll: 'owner' as const, userId: 'a' }
const redigerare = { id: '2', roll: 'editor' as const, userId: 'b' }
const lasare = { id: '3', roll: 'viewer' as const, userId: 'c' }
const hund = { id: '4', roll: 'editor' as const, userId: null }
const alla = [agare, redigerare, lasare, hund]

describe('kanAndra och arAgare', () => {
  it('ger owner och editor rätt att ändra, men bara owner är ägare', () => {
    expect(kanAndra('owner')).toBe(true)
    expect(kanAndra('editor')).toBe(true)
    expect(kanAndra('viewer')).toBe(false)
    expect(kanAndra(null)).toBe(false)
    expect(arAgare('owner')).toBe(true)
    expect(arAgare('editor')).toBe(false)
  })
})

describe('kanTaBort', () => {
  it('låter ägaren ta bort andra men inte sig själv som enda ägare', () => {
    expect(kanTaBort('owner', lasare, 'a', alla)).toBe(true)
    expect(kanTaBort('owner', agare, 'a', alla)).toBe(false)
  })

  it('låter redigerare ta bort hundar men inte andra personer', () => {
    expect(kanTaBort('editor', hund, 'b', alla)).toBe(true)
    expect(kanTaBort('editor', lasare, 'b', alla)).toBe(false)
  })

  it('låter vem som helst lämna turen', () => {
    expect(kanTaBort('viewer', lasare, 'c', alla)).toBe(true)
  })
})

describe('kanAndraKostbehov', () => {
  const person = (userId: string | null, roll: Roll = 'editor') => ({ typ: 'person' as const, roll, userId })

  it('låter var och en ändra sina egna, även läsaren', () => {
    expect(kanAndraKostbehov('viewer', person('c', 'viewer'), 'c')).toBe(true)
  })

  it('låter ingen ändra för någon annan med konto, inte ens ägaren', () => {
    expect(kanAndraKostbehov('owner', person('b'), 'a')).toBe(false)
    expect(kanAndraKostbehov('editor', person('a', 'owner'), 'b')).toBe(false)
  })

  it('låter ägare och redigerare ändra för personer utan konto, men inte läsare', () => {
    expect(kanAndraKostbehov('owner', person(null), 'a')).toBe(true)
    expect(kanAndraKostbehov('editor', person(null), 'b')).toBe(true)
    expect(kanAndraKostbehov('viewer', person(null), 'c')).toBe(false)
  })

  it('en platshållare med rollen owner ändras bara av ägaren', () => {
    expect(kanAndraKostbehov('owner', person(null, 'owner'), 'a')).toBe(true)
    expect(kanAndraKostbehov('editor', person(null, 'owner'), 'b')).toBe(false)
  })

  it('hundar har inga kostbehov', () => {
    expect(kanAndraKostbehov('owner', { typ: 'hund', roll: 'editor', userId: null }, 'a')).toBe(false)
  })
})
