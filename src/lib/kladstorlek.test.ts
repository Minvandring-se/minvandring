import { describe, expect, it } from 'vitest'
import { forradsStorlekText, storlekHjalp, konEtikett, storlekarFor, utanKon, viktlage, viktlageText, viktstorlek } from './kladstorlek'

describe('kläders storlek', () => {
  it('tar bort M eller W sist i modellnamnet men inget annat', () => {
    expect(utanKon('Keb Fleece Hoodie M')).toBe('Keb Fleece Hoodie')
    expect(utanKon('Nallo Half Zip W ')).toBe('Nallo Half Zip')
    expect(utanKon('Power Houdi')).toBe('Power Houdi')
    expect(utanKon('Lumina 100 Down Jkt M')).toBe('Lumina 100 Down Jkt')
    expect(utanKon('Arc M')).toBe('Arc')
    expect(utanKon('XM')).toBe('XM')
  })

  it('läser kön och storleken vikten gäller', () => {
    expect(konEtikett({ kon: 'herr' })).toBe('Herr')
    expect(konEtikett({})).toBeNull()
    expect(viktstorlek({ viktstorlek: ' M ' })).toBe('M')
    expect(viktstorlek({ viktstorlek: '' })).toBeNull()
    expect(viktstorlek(null)).toBeNull()
  })

  it('väljer storlekslista efter hur tillverkaren skriver storleken', () => {
    expect(storlekarFor('M', 'Herr')).toEqual(['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'])
    expect(storlekarFor(null, null)).toContain('M')
    expect(storlekarFor('48', 'Herr')).toEqual(['44', '46', '48', '50', '52', '54', '56', '58', '60'])
    expect(storlekarFor('38', 'Dam')[0]).toBe('32')
    expect(storlekarFor('10 (UK)', 'Dam')).toContain('12 (UK)')
    expect(storlekarFor('42', 'Herr', 'kangor')).toEqual(['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'])
    expect(storlekarFor('42 2/3', 'Herr', 'kangor').slice(7, 10)).toEqual(['42', '42 2/3', '43'])
    expect(storlekarFor('UK 8', 'Herr', 'kangor')).toContain('UK 8,5')
    expect(storlekarFor(null, null, 'kangor')[0]).toBe('35')
  })

  it('säger om vikten gäller ens storlek', () => {
    expect(viktlage('M', 'm')).toEqual({ lage: 'samma' })
    expect(viktlage('M', 'L')).toEqual({ lage: 'annan', viktstorlek: 'M' })
    expect(viktlage('M', null)).toEqual({ lage: 'annan', viktstorlek: 'M' })
    expect(viktlage(null, 'L')).toEqual({ lage: 'okand' })
    expect(viktlageText({ lage: 'annan', viktstorlek: 'M' })).toBe('Vikten gäller storlek M. Din storlek kan väga lite mer eller mindre.')
  })

  it('skriver raden i förrådet', () => {
    expect(forradsStorlekText('Herr', 'L', 'M')).toBe('Herr, storlek L · vikten gäller M')
    expect(forradsStorlekText('Dam', 'S', 'S')).toBe('Dam, storlek S · vikten gäller din storlek')
    expect(forradsStorlekText('Herr', 'L', null)).toBe('Herr, storlek L · storleken för vikten anges inte')
    expect(forradsStorlekText('Herr', null, 'M')).toBe('Herr · vikt i storlek M')
    expect(forradsStorlekText(null, null, null)).toBeNull()
    expect(forradsStorlekText(null, null, 'M')).toBe('Vikt i storlek M')
  })

  it('ger hjälptexten under storleksvalet', () => {
    expect(storlekHjalp('M', null)).toBe('Vikten gäller storlek M.')
    expect(storlekHjalp('M', 'M')).toBe('Vikten gäller din storlek.')
    expect(storlekHjalp(null, null)).toBe('Tillverkaren anger inte vilken storlek vikten gäller.')
  })
})
