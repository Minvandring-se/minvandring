import { describe, expect, it } from 'vitest'
import { ALLMANT_FEL, authFel, kontrolleraEpost, kontrolleraLosenord, kontrolleraNamn, medVidare, sakerVidare } from './konto'
import { KONTAKT_MEJL } from './kontakt'

describe('kontrolleraEpost', () => {
  it('godtar vanliga adresser, även med mellanslag runt', () => {
    expect(kontrolleraEpost('anna@exempel.se')).toBeNull()
    expect(kontrolleraEpost('  anna.berg+fjall@exempel.se ')).toBeNull()
  })

  it('säger till om adressen saknas eller ser fel ut', () => {
    expect(kontrolleraEpost('')).toBe('Fyll i din mejladress.')
    expect(kontrolleraEpost('   ')).toBe('Fyll i din mejladress.')
    expect(kontrolleraEpost('anna')).toBe('Mejladressen ser inte rätt ut.')
    expect(kontrolleraEpost('anna@exempel')).toBe('Mejladressen ser inte rätt ut.')
    expect(kontrolleraEpost('an na@exempel.se')).toBe('Mejladressen ser inte rätt ut.')
  })
})

describe('kontrolleraLosenord', () => {
  it('kräver minst 8 tecken', () => {
    expect(kontrolleraLosenord('')).toBe('Fyll i ett lösenord.')
    expect(kontrolleraLosenord('1234567')).toBe('Lösenordet behöver minst 8 tecken.')
    expect(kontrolleraLosenord('12345678')).toBeNull()
  })
})

describe('kontrolleraNamn', () => {
  it('kräver något annat än mellanslag', () => {
    expect(kontrolleraNamn('  ')).toBe('Fyll i ditt namn.')
    expect(kontrolleraNamn('Anna')).toBeNull()
  })
})

describe('sakerVidare', () => {
  it('släpper igenom sökvägar inom appen', () => {
    expect(sakerVidare('/tur/abc')).toBe('/tur/abc')
    expect(sakerVidare('/ga-med/KOD123')).toBe('/ga-med/KOD123')
  })

  it('behåller frågedelen och ankaret i adressen', () => {
    expect(sakerVidare('/forrad?kategori=talt&vy=rutnat')).toBe('/forrad?kategori=talt&vy=rutnat')
    expect(sakerVidare('/tur/abc#bjud-in')).toBe('/tur/abc#bjud-in')
    expect(medVidare('/skapa-konto', '/turer?ny=1')).toBe('/skapa-konto?vidare=%2Fturer%3Fny%3D1')
  })

  it('skickar till Mina turer när sökvägen saknas eller pekar ut från appen', () => {
    expect(sakerVidare(null)).toBe('/hem')
    expect(sakerVidare('')).toBe('/hem')
    expect(sakerVidare('https://ond.example')).toBe('/hem')
    expect(sakerVidare('//ond.example')).toBe('/hem')
    expect(sakerVidare('/\\ond.example')).toBe('/hem')
    expect(sakerVidare('javascript:alert(1)')).toBe('/hem')
  })
})

describe('medVidare', () => {
  it('lägger bara till vidare när den skiljer sig från standard', () => {
    expect(medVidare('/skapa-konto', '/hem')).toBe('/skapa-konto')
    expect(medVidare('/skapa-konto', '/ga-med/KOD')).toBe('/skapa-konto?vidare=%2Fga-med%2FKOD')
  })
})

describe('authFel', () => {
  it('översätter kända fel från Supabase', () => {
    expect(authFel({ code: 'invalid_credentials' })).toBe('Fel mejladress eller lösenord.')
    expect(authFel({ code: 'user_already_exists' })).toMatch(/finns redan ett konto/)
    expect(authFel({ code: 'over_email_send_rate_limit' })).toMatch(/För många försök/)
  })

  it('känner igen för många försök på statuskoden', () => {
    expect(authFel({ status: 429 })).toMatch(/För många försök/)
  })

  it('har ett allmänt meddelande för okända fel', () => {
    expect(authFel({ code: 'nagot_nytt' })).toBe(ALLMANT_FEL)
    expect(authFel(null)).toBe(ALLMANT_FEL)
  })

  it('ber en höra av sig till kontaktadressen om det allmänna felet fortsätter', () => {
    expect(ALLMANT_FEL).toMatch(/^Något gick fel\. Försök igen\./)
    expect(KONTAKT_MEJL).not.toBeNull()
    expect(ALLMANT_FEL).toContain(`Om det fortsätter, hör av dig till ${KONTAKT_MEJL}.`)
  })
})

describe('authFel när servern inte nås', () => {
  it('säger att servern inte gick att nå', () => {
    expect(authFel({ name: 'AuthRetryableFetchError', status: 0 })).toMatch(/^Det gick inte att nå servern/)
  })
})
