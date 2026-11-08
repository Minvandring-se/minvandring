import { describe, expect, it } from 'vitest'
import { arAgare, kanAndra, kanTaBort } from './roller'

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
