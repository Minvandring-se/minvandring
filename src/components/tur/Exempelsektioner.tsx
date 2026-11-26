import { Bus, Check, TrainFront } from 'lucide-react'
import type { ReactNode } from 'react'
import { Framsteg } from '@/components/ui/framsteg'
import { KommerSnart } from '@/components/ui/kommerSnart'
import { knappStil } from '@/components/ui/knappStil'
import { Matare } from '@/components/ui/matare'
import { Nyckeltal } from '@/components/ui/nyckeltal'
import { Sektion } from '@/components/ui/sektion'
import {
  ATT_GORA,
  DELA_OCH_SPARA,
  DIN_VIKT,
  EFTER_TUREN,
  FARDPLAN,
  GEMENSAM_UTRUSTNING,
  HOJDPROFIL,
  KOSTNADER,
  MAT_PER_DAG,
  OMROSTNING,
  PACKLAGE,
  REDO_FOR_AVFARD,
  RESAN,
  SENASTE_I_GRUPPEN,
  VIKT_PER_PERSON,
} from '@/lib/exempeldata'
import { cn } from '@/lib/utils'

// Delarna av turens översikt som inte är byggda än. De visar hur delen kommer att se ut, med exempelinnehåll från
// src/lib/exempeldata.ts och etiketten "Kommer snart". Inget här går att trycka på (se KommerSnart).
// När en del byggs på riktigt ersätts dess sektion här med den riktiga.

type Props = { className?: string }

/** En knapp i exemplen. Ser ut som en knapp men ligger i en inert del och går inte att trycka på. */
function Exempelknapp({ children, fylld = false, className }: { children: ReactNode; fylld?: boolean; className?: string }) {
  return (
    <span className={cn(knappStil({ variant: fylld ? 'default' : 'outline' }), 'cursor-default', fylld ? 'hover:bg-primary' : 'hover:bg-card', className)}>
      {children}
    </span>
  )
}

/** En textlänk i exemplen. */
function Exempellank({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex min-h-11 cursor-default items-center text-sm font-medium text-primary', className)}>{children}</span>
}

/** En rund bock: ifylld när något är klart, tom annars. */
function Bock({ klar }: { klar: boolean }) {
  return klar ? (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-illustration text-pa-bild">
      <Check className="size-3.5" strokeWidth={3} aria-hidden />
    </span>
  ) : (
    <span className="size-5 shrink-0 rounded-full border-2 border-muted-foreground/60" />
  )
}

export function RedoForAvfard({ className }: Props) {
  const r = REDO_FOR_AVFARD
  return (
    <Sektion rubrik="Redo för avfärd" kommerSnart className={className}>
      <KommerSnart text="Här ser ni hur mycket som är klart innan ni går och vad som är kvar.">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
          <Matare varde={r.andel} etikett="Redo för avfärd" undertext="redo" className="max-sm:hidden" />
          <Matare varde={r.andel} etikett="Redo för avfärd" storlek={76} tjocklek={7} className="sm:hidden" />
          <div className="min-w-0 flex-1 space-y-4">
            <ul className="grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2">
              {r.klart.map((t) => (
                <li key={t} className="flex items-center gap-2 text-muted-foreground">
                  <Bock klar />
                  {t}
                </li>
              ))}
              {r.ejKlart.map((t) => (
                <li key={t} className="flex items-center gap-2 font-medium">
                  <Bock klar={false} />
                  {t}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Exempelknapp fylld>Fortsätt packa</Exempelknapp>
              <Exempelknapp>Planera maten</Exempelknapp>
            </div>
          </div>
        </div>
      </KommerSnart>
    </Sektion>
  )
}

export function AttGora({ className }: Props) {
  return (
    <Sektion rubrik="Att göra i gruppen" kommerSnart atgard={<Exempellank>+ Ny uppgift</Exempellank>} className={className}>
      <KommerSnart text="Här fördelar ni uppgifter, till exempel att boka tåg och stugor, med vem som gör det och när.">
        <ul className="divide-y divide-border">
          {ATT_GORA.map((u) => (
            <li key={u.text} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 py-3 sm:grid-cols-[1.5rem_minmax(0,1fr)_8rem_7rem]">
              <Bock klar={u.klar} />
              <span className={cn('min-w-0', u.klar ? 'text-muted-foreground line-through' : 'font-medium')}>{u.text}</span>
              <span className="col-start-2 text-sm text-muted-foreground sm:col-start-auto">{u.vem}</span>
              <span className={cn('col-start-3 row-start-1 text-right text-sm sm:col-start-auto sm:row-start-auto', u.bradskar ? 'font-semibold text-accent-strong' : 'text-muted-foreground')}>
                {u.nar}
              </span>
            </li>
          ))}
        </ul>
      </KommerSnart>
    </Sektion>
  )
}

export function ResanDitOchHem({ className }: Props) {
  return (
    <Sektion rubrik="Resan dit och hem" kommerSnart className={className}>
      <KommerSnart text="Här samlar ni tåg, bussar och biljetter till och från leden.">
        <div className="space-y-3">
          {RESAN.map((r) => {
            const Ikon = r.riktning === 'dit' ? TrainFront : Bus
            return (
              <div key={r.rubrik} className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <Ikon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">{r.rubrik}</p>
                  <p className="text-sm text-muted-foreground">{r.nar}</p>
                </div>
              </div>
            )
          })}
          <Exempellank>Lägg till biljetter</Exempellank>
        </div>
      </KommerSnart>
    </Sektion>
  )
}

export function DinVikt({ className }: Props) {
  const v = DIN_VIKT
  const total = v.kategorier.reduce((s, k) => s + k.kg, 0)
  return (
    <Sektion rubrik="Din vikt" kommerSnart etikett={<span className="text-sm font-medium text-muted-foreground">{v.mal}</span>} className={className}>
      <KommerSnart text="Här kommer din vikt: total startvikt, basvikt, det som förbrukas och vikten per kategori.">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Total startvikt</p>
            <p className="font-heading text-4xl font-bold tracking-tight">{v.total}</p>
          </div>
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
            {v.kategorier.map((k) => (
              <span key={k.namn} className={k.farg} style={{ width: `${(k.kg / total) * 100}%` }} />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
            {v.kategorier.map((k) => (
              <li key={k.namn} className="flex items-center gap-1.5">
                <span className={cn('size-2.5 rounded-sm', k.farg)} />
                {k.namn} {k.kg.toLocaleString('sv-SE')} kg
              </li>
            ))}
          </ul>
          <Nyckeltal varden={v.nyckeltal} ram={false} className="border-t border-border" />
        </div>
      </KommerSnart>
    </Sektion>
  )
}

export function MatPerDag({ className }: Props) {
  const m = MAT_PER_DAG
  const dagar = m.kcal.map((_, i) => i + 1)
  return (
    <Sektion rubrik="Mat per dag" kommerSnart atgard={<span className="text-sm text-muted-foreground">{m.mal}</span>} className={className}>
      <KommerSnart text="Här kommer matplanen dag för dag, med energi och vikt per person och en inköpslista.">
        <div className="space-y-4">
          <div className="grid grid-cols-[3.75rem_repeat(7,minmax(0,1fr))] gap-1 text-xs sm:grid-cols-[5rem_repeat(7,minmax(0,1fr))] sm:gap-1.5 sm:text-sm">
            <span />
            {dagar.map((d) => (
              <span key={d} className="text-center text-muted-foreground">
                <span className="max-sm:hidden">Dag </span>
                {d}
              </span>
            ))}
            {m.maltider.map((maltid) => (
              <Maltidsrad key={maltid} namn={maltid} saknas={m.saknas[maltid] ?? []} dagar={dagar} />
            ))}
            {/* I mobil ryms inte fyrsiffriga tal, så där står energin i tusen kcal. */}
            <span className="self-center leading-tight">
              <span className="max-sm:hidden">Kcal</span>
              <span className="sm:hidden">Tusen kcal</span>
            </span>
            {m.kcal.map((k, i) => (
              <span key={i} className={cn('self-center text-center font-semibold tabular-nums', k < m.lagt && 'text-accent-strong')}>
                <span className="max-sm:hidden">{k.toLocaleString('sv-SE')}</span>
                <span className="sm:hidden">{(k / 1000).toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Exempelknapp>Inköpslista</Exempelknapp>
            <Exempelknapp>Proviantering i STF-stugor</Exempelknapp>
          </div>
        </div>
      </KommerSnart>
    </Sektion>
  )
}

function Maltidsrad({ namn, saknas, dagar }: { namn: string; saknas: number[]; dagar: number[] }) {
  return (
    <>
      <span className="self-center">{namn}</span>
      {dagar.map((d) =>
        saknas.includes(d) ? (
          <span key={d} className="flex h-8 items-center justify-center rounded-md border-2 border-dashed border-accent font-bold text-accent-strong">
            +
          </span>
        ) : (
          <span key={d} className="h-8 rounded-md bg-primary-soft" />
        ),
      )}
    </>
  )
}

export function ViktPerPerson({ className }: Props) {
  return (
    <Sektion rubrik="Vikt per person" kommerSnart className={className}>
      <KommerSnart text="Här ser ni hur tungt var och en bär, med den gemensamma utrustningen inräknad.">
        <div className="space-y-3.5">
          {VIKT_PER_PERSON.personer.map((p, i) => (
            <div key={p.namn} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>{p.namn}</span>
                <span className="font-semibold">{p.kg}</span>
              </div>
              <Framsteg varde={p.andel} etikett={`Vikt för ${p.namn}`} fargKlass={['bg-primary', 'bg-illustration', 'bg-illustration/50'][i]} />
            </div>
          ))}
          <p className="text-sm text-muted-foreground">{VIKT_PER_PERSON.tips}</p>
        </div>
      </KommerSnart>
    </Sektion>
  )
}

export function GemensamUtrustning({ className }: Props) {
  return (
    <Sektion rubrik="Gemensam utrustning" kommerSnart atgard={<Exempellank>Fördela om</Exempellank>} className={className}>
      <KommerSnart text="Här fördelar ni tält, kök och annat ni delar på, så att vikten blir jämn.">
        <ul className="divide-y divide-border">
          {GEMENSAM_UTRUSTNING.map((g) => (
            <li key={g.sak} className="grid grid-cols-[minmax(0,1fr)_auto_4rem] items-center gap-3 py-3">
              <span className="min-w-0 font-medium">{g.sak}</span>
              <span className="text-sm text-muted-foreground">{g.vem}</span>
              <span className="text-right tabular-nums">{g.kg}</span>
            </li>
          ))}
        </ul>
      </KommerSnart>
    </Sektion>
  )
}

export function DeladeKostnader({ className }: Props) {
  return (
    <Sektion rubrik="Delade kostnader" kommerSnart className={className}>
      <KommerSnart text="Här skriver ni in vad var och en har betalat och ser vem som ska betala vem.">
        <ul className="divide-y divide-border text-sm">
          {KOSTNADER.rader.map((k) => (
            <li key={k.text} className="flex justify-between gap-3 py-2">
              <span>{k.text}</span>
              <span className="font-semibold tabular-nums">{k.belopp}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-md bg-muted px-3.5 py-3 text-sm">
          <span className="font-semibold">{KOSTNADER.slutsats}</span> {KOSTNADER.efter}
        </p>
      </KommerSnart>
    </Sektion>
  )
}

export function KartaOchHojdprofil({ className }: Props) {
  return (
    <Sektion rubrik="Karta och höjdprofil" kommerSnart className={className}>
      <KommerSnart text="Här kommer leden på en karta med höjdprofil, stugor och vatten längs vägen.">
        <div className="space-y-3">
          <svg viewBox="0 0 700 220" preserveAspectRatio="none" className="block h-44 w-full rounded-md bg-primary-soft sm:h-56">
            <path d="M0 60 C120 40 200 90 320 70 C440 50 560 100 700 80" fill="none" strokeWidth="18" className="stroke-illustration/20" />
            <path d="M0 150 C150 120 260 170 400 140 C520 115 620 160 700 150" fill="none" strokeWidth="12" className="stroke-illustration/20" />
            <path
              d="M40 190 C140 150 220 120 300 110 C380 100 470 80 560 60 C610 50 640 40 670 30"
              fill="none"
              strokeWidth="4"
              strokeDasharray="8 8"
              strokeLinecap="round"
              className="stroke-accent"
            />
            <circle cx="40" cy="190" r="7" className="fill-yta-stark mork:fill-background" />
            <circle cx="670" cy="30" r="7" className="fill-yta-stark mork:fill-background" />
          </svg>
          <svg viewBox="0 0 700 70" preserveAspectRatio="none" className="block h-16 w-full">
            <path d="M0 60 L60 50 L120 30 L180 40 L260 15 L330 25 L400 10 L470 30 L540 20 L620 45 L700 55 V70 H0Z" className="fill-primary-soft" />
            <path d="M0 60 L60 50 L120 30 L180 40 L260 15 L330 25 L400 10 L470 30 L540 20 L620 45 L700 55" fill="none" strokeWidth="2" className="stroke-illustration" />
          </svg>
          <p className="text-sm text-muted-foreground">{HOJDPROFIL}</p>
        </div>
      </KommerSnart>
    </Sektion>
  )
}

export function SenasteIGruppen({ className }: Props) {
  return (
    <Sektion rubrik="Senaste i gruppen" kommerSnart className={className}>
      <KommerSnart text="Här ser ni det senaste som hänt i turen, till exempel vem som bockat av något.">
        <ul className="space-y-3 text-sm">
          {SENASTE_I_GRUPPEN.map((h, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{h.vem[0]}</span>
              <span>
                <span className="font-semibold">{h.vem}</span> {h.vad}
                <br />
                <span className="text-muted-foreground">{h.nar}</span>
              </span>
            </li>
          ))}
        </ul>
      </KommerSnart>
    </Sektion>
  )
}

export function Omrostning({ className }: Props) {
  return (
    <Sektion rubrik="Omröstning" kommerSnart className={className}>
      <KommerSnart text="Här röstar ni om datum, led eller om ni ska sova i stuga eller tält.">
        <p className="mb-3 text-sm text-muted-foreground">{OMROSTNING.fraga}</p>
        <div className="space-y-2 text-sm">
          {OMROSTNING.alternativ.map((a) => (
            <div key={a.text} className={cn('flex justify-between rounded-md px-3 py-2.5', a.vald ? 'border-2 border-primary font-semibold' : 'border border-border')}>
              <span>{a.text}</span>
              <span>{a.roster}</span>
            </div>
          ))}
        </div>
      </KommerSnart>
    </Sektion>
  )
}

export function Packlage({ className }: Props) {
  return (
    <Sektion rubrik="Packläge" kommerSnart className={className}>
      <KommerSnart text="Här kommer stora rutor att bocka av när ni packar kvällen före, även utan nät.">
        <p className="mb-3 text-sm text-muted-foreground">{PACKLAGE.text}</p>
        <div className="space-y-2">
          {PACKLAGE.saker.map((s) => (
            <div key={s.sak} className="flex min-h-11 items-center gap-2.5 rounded-md bg-muted px-3">
              {s.packad ? (
                <span className="flex size-6 items-center justify-center rounded-md bg-illustration text-pa-bild">
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                </span>
              ) : (
                <span className="size-6 rounded-md border-2 border-muted-foreground/60" />
              )}
              {s.sak}
            </div>
          ))}
        </div>
      </KommerSnart>
    </Sektion>
  )
}

export function DelaOchSpara({ className }: Props) {
  return (
    <Sektion rubrik="Dela och spara" kommerSnart className={className}>
      <KommerSnart text="Här kan ni dela packlistan, spara turen som mall och importera från andra listor.">
        <ul className="divide-y divide-border text-sm">
          {DELA_OCH_SPARA.map((d) => (
            <li key={d} className="flex min-h-11 items-center">
              {d}
            </li>
          ))}
        </ul>
      </KommerSnart>
    </Sektion>
  )
}

export function Fardplan({ className }: Props) {
  return (
    <Sektion rubrik="Färdplan" variant="stark" kommerSnart className={className}>
      <KommerSnart stark text="Här skickar ni en färdplan till någon hemma, med kontaktperson, hemkomst och nödinformation.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.3fr] lg:items-center">
          <p className="text-sm text-yta-stark-muted">Berätta för någon hemma var ni går och när ni är tillbaka.</p>
          <Nyckeltal
            stark
            ram={false}
            varden={[{ etikett: 'Kontaktperson hemma', varde: FARDPLAN.kontakt }]}
          />
          <Nyckeltal stark ram={false} varden={[{ etikett: 'Beräknad hemkomst', varde: FARDPLAN.hemkomst }]} />
          <div className="space-y-2">
            <p className="text-sm text-yta-stark-muted">{FARDPLAN.nod}</p>
            <span className="inline-flex h-11 items-center rounded-md bg-yta-stark-foreground px-5 text-sm font-semibold text-yta-stark">Skicka färdplan</span>
          </div>
        </div>
      </KommerSnart>
    </Sektion>
  )
}

export function EfterTuren({ className }: Props) {
  return (
    <Sektion rubrik="Efter turen" kommerSnart className={className}>
      <KommerSnart text="Här kommer dagbok, bilder och vad ni använde.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EFTER_TUREN.map((e) => (
            <div key={e.rubrik} className={cn('rounded-md p-4', e.accent ? 'bg-accent-soft' : 'bg-muted')}>
              <p className={cn('font-semibold', e.accent && 'text-accent-strong')}>{e.rubrik}</p>
              <p className="mt-1 text-sm text-muted-foreground">{e.text}</p>
            </div>
          ))}
        </div>
      </KommerSnart>
    </Sektion>
  )
}
