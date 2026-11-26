import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Panel } from '@/components/ui/panel'
import { SokFalt } from '@/components/ui/sokfalt'
import { Select } from '@/components/ui/select'
import { useId, useState } from 'react'
import { faltFran, formateraVikt, KATEGORIER, kategoriFor, medKategori, medUnderkategori, tolkaSak, underkategorierFor, type SakVarden } from '@/lib/forrad'
import { medKoket } from '@/lib/forradskok'
import type { Bars } from '@/lib/packlista'
import type { Forradssak } from '@/lib/typer'

type Vem = 'jag' | 'gemensam' | 'alla'

const VEM: readonly { varde: Vem; text: string; forklaring: string }[] = [
  { varde: 'jag', text: 'Jag', forklaring: 'Din egen sak, som du tar med' },
  { varde: 'gemensam', text: 'Gemensam, jag tar med den', forklaring: 'Till exempel tält eller kök. Du bär den åt gruppen.' },
  { varde: 'alla', text: 'Alla har var sin', forklaring: 'Var och en väljer sin egen, till exempel sovsäck' },
]

/**
 * Lägg till utrustning i turens packlista: saker ur ens förråd eller en ny egen sak. Man väljer först vem som bär.
 * Saken kopieras in i turen, så att en ändring i förrådet inte ändrar turen.
 */
export function LaggTillUtrustning({
  saker,
  mittId,
  onForsokIgen,
  onLaggTill,
  onNySak,
  onStang,
}: {
  saker: Forradssak[] | null | 'fel'
  mittId: string
  onForsokIgen: () => void
  onLaggTill: (saker: Forradssak[], bars: Bars) => Promise<boolean>
  onNySak: (varden: SakVarden, bars: Bars) => Promise<boolean>
  onStang: () => void
}) {
  const [vem, setVem] = useState<Vem>('jag')
  const [lage, setLage] = useState<'forrad' | 'ny'>('forrad')
  const [sok, setSok] = useState('')
  const [valda, setValda] = useState<Set<string>>(new Set())
  const [falt, setFalt] = useState(() => faltFran())
  const [fel, setFel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)
  const id = useId()
  const bars: Bars = vem === 'alla' ? { som: 'alla' } : { som: vem, id: mittId }

  const allaSaker = Array.isArray(saker) ? saker : []
  const antalDelar = (kokId: string) => medKoket(kokId, allaSaker).length - 1
  const lista = Array.isArray(saker) ? saker.filter((s) => s.namn.toLowerCase().includes(sok.trim().toLowerCase())) : []

  async function spara() {
    setFel(null)
    let ok: boolean
    if (lage === 'ny') {
      const tolkad = tolkaSak(falt)
      if (!tolkad.ok) {
        setFel(tolkad.fel)
        return
      }
      setSparar(true)
      ok = await onNySak(tolkad.varden, bars)
    } else {
      setSparar(true)
      ok = await onLaggTill(Array.isArray(saker) ? saker.filter((s) => valda.has(s.id)) : [], bars)
    }
    setSparar(false)
    if (!ok) setFel('Det gick inte att spara. Kontrollera uppkopplingen och försök igen.')
  }

  return (
    <Panel
      etikett="Lägg till utrustning"
      onStang={onStang}
      rubrik={<h2 className="text-2xl">{lage === 'ny' ? 'Ny egen sak' : 'Lägg till utrustning'}</h2>}
      fot={
        <div className="space-y-2">
          {fel && (
            <p role="alert" className="text-sm text-destructive">
              {fel}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={spara} disabled={sparar || (lage === 'forrad' && valda.size === 0)}>
              {sparar ? 'Sparar …' : lage === 'ny' ? 'Spara' : valda.size > 1 ? `Lägg till ${valda.size} saker` : 'Lägg till'}
            </Button>
            <Button variant="outline" onClick={onStang}>
              Avbryt
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <fieldset className="space-y-2">
          <legend className="mb-1 font-semibold">Vem tar med den?</legend>
          {VEM.map((v) => (
            <label key={v.varde} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input type="radio" name={`${id}-vem`} checked={vem === v.varde} onChange={() => setVem(v.varde)} className="size-5 shrink-0 accent-primary" />
              <span>
                {v.text}
                <span className="block text-sm text-muted-foreground">{v.forklaring}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {lage === 'forrad' ? (
          <div className="space-y-3">
            <SokFalt etikett="Ur ditt förråd" varde={sok} onAndra={setSok} placeholder="Sök bland dina saker" />
            {saker === null && (
              <Laddar text="Hämtar ditt förråd" className="space-y-2">
                <Skelett className="h-11 rounded-lg" />
                <Skelett className="h-11 rounded-lg" />
              </Laddar>
            )}
            {saker === 'fel' && <Laddfel vad="ditt förråd" onForsokIgen={onForsokIgen} />}
            {Array.isArray(saker) && lista.length === 0 && (
              <TomtLage kompakt text={saker.length === 0 ? 'Ditt förråd är tomt. Skriv in saken som en ny egen sak.' : 'Inga saker med det namnet.'} />
            )}
            {lista.length > 0 && (
              <ul className="divide-y divide-border">
                {lista.map((s) => (
                  <li key={s.id}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        checked={valda.has(s.id)}
                        onChange={(e) =>
                          setValda((v) => {
                            // Ett kök i förrådet väljs med sina kokkärl och sitt bränsle.
                            const ny = new Set(v)
                            for (const sakId of medKoket(s.id, allaSaker)) {
                              if (e.target.checked) ny.add(sakId)
                              else ny.delete(sakId)
                            }
                            return ny
                          })
                        }
                        className="size-5 shrink-0 accent-primary"
                      />
                      <span className="min-w-0 flex-1 break-words">
                        {s.namn}
                        {antalDelar(s.id) > 0 && (
                          <span className="block text-sm text-muted-foreground">Med {antalDelar(s.id) === 1 ? '1 del' : `${antalDelar(s.id)} delar`} ur ditt kök</span>
                        )}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums">{s.vikt_g === null ? 'Ingen vikt' : formateraVikt(s.vikt_g * s.antal)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" onClick={() => setLage('ny')}>
              Ny egen sak
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor={`${id}-namn`} className="block font-semibold">
                Namn
              </label>
              <Input id={`${id}-namn`} value={falt.namn} onChange={(e) => setFalt({ ...falt, namn: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${id}-kategori`} className="block font-semibold">
                Kategori
              </label>
              <Select id={`${id}-kategori`} value={falt.kategori} onChange={(e) => setFalt(medKategori(falt, e.target.value))}>
                <option value="">Välj kategori</option>
                {KATEGORIER.map((k) => (
                  <option key={k.nyckel} value={k.nyckel}>
                    {k.etikett}
                  </option>
                ))}
              </Select>
            </div>
            {underkategorierFor(falt.kategori).length > 1 && (
              <div className="space-y-1">
                <label htmlFor={`${id}-underkategori`} className="block font-semibold">
                  Sort <span className="font-normal text-muted-foreground">(frivilligt)</span>
                </label>
                <Select
                  id={`${id}-underkategori`}
                  value={falt.underkategori}
                  onChange={(e) => setFalt(medUnderkategori(falt, e.target.value))}
                >
                  <option value="">Annat i {kategoriFor(falt.kategori).etikett.toLowerCase()}</option>
                  {underkategorierFor(falt.kategori).map((u) => (
                    <option key={u.nyckel} value={u.nyckel}>
                      {u.etikett}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor={`${id}-vikt`} className="block font-semibold">
                  Vikt i gram
                </label>
                <Input id={`${id}-vikt`} inputMode="numeric" value={falt.vikt} onChange={(e) => setFalt({ ...falt, vikt: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label htmlFor={`${id}-antal`} className="block font-semibold">
                  Antal
                </label>
                <Input id={`${id}-antal`} inputMode="numeric" value={falt.antal} onChange={(e) => setFalt({ ...falt, antal: e.target.value })} />
              </div>
            </div>
            <Button variant="outline" onClick={() => setLage('forrad')}>
              Tillbaka till förrådet
            </Button>
          </div>
        )}
      </div>
    </Panel>
  )
}
