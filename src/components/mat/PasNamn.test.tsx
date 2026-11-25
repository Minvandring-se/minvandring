import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PasNamn } from '@/components/mat/PasNamn'

describe('PasNamn', () => {
  it('visar märket ovanför namnet, så att skärmläsare läser dem i den ordningen, och ett annat namn under', () => {
    const html = renderToStaticMarkup(<PasNamn marke="Real Turmat" namn="Reindeer Stew" ettAnnat="Viltgryta" />)
    expect(html.indexOf('Real Turmat')).toBeLessThan(html.indexOf('Reindeer Stew'))
    expect(html.indexOf('Reindeer Stew')).toBeLessThan(html.indexOf('Viltgryta'))
    // Namnet bryts i stället för att klippas.
    expect(html).not.toContain('truncate')
    expect(html).toContain('break-words')
  })
})
