import { ChevronDown, Clock, Settings } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { DinaTurer } from '@/components/app/DinaTurer'
import { Skelett } from '@/components/app/Laddar'
import { Menyikon } from '@/components/app/Menyikon'
import { Menykurvor } from '@/components/app/Menykurvor'
import { Namnbricka } from '@/components/app/Namnbricka'
import { Logotyp } from '@/components/Logotyp'
import { Sidfot } from '@/components/Sidfot'
import { Ikon, type IkonNamn } from '@/components/ikoner/Ikon'
import { GRUPPSTART, MENYGRUPPER, oppnaGrupper, SIDOR, UNDERSIDOR, type Gruppnyckel, type Menygrupp, type Sida } from '@/lib/meny'
import type { TurIListan } from '@/lib/turlista'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Den aktiva raden är en fylld mörkgrön ruta med vit text och vit ikon (i mörkt läge ljusgrön med mörk text). */
const radKlass = (aktiv: boolean) =>
  cn(
    'flex min-h-11 items-center gap-3 rounded-lg px-3 py-1.5 text-[0.9375rem] transition-colors 3xl:min-h-12 3xl:text-base',
    fokus,
    aktiv ? 'bg-primary font-semibold text-primary-foreground' : 'text-foreground hover:bg-muted',
  )

/** Ikonen för en grupp. Kommer snart har en klocka från Lucide, eftersom det inte finns någon egen ikon för den. */
const GRUPPIKON: Record<Exclude<Gruppnyckel, 'snart'>, IkonNamn> = { planera: 'mina-turer', utrustning: 'mitt-forrad', vandrare: 'vandringskompisar', minnen: 'dagbok' }

/** En sida i menyn. Sidor på översta nivån (Hem) har ikon, sidor i en grupp är indragna och utan ikon. */
function Menyrad({ sida, aktiv, iGrupp = false }: { sida: Sida; aktiv: boolean; iGrupp?: boolean }) {
  const { namn, till } = SIDOR[sida]
  return (
    <Link
      to={till}
      // En sida med delar markerar delen som page, och sidan bara som aktuell.
      aria-current={aktiv ? (UNDERSIDOR[sida] ? 'true' : 'page') : undefined}
      className={cn(radKlass(aktiv), iGrupp && 'pl-12')}
    >
      {!iGrupp && <Menyikon sida={sida} storlek={24} aktiv={aktiv} />}
      {/* Långa namn som Utrustningskatalog avstavas. */}
      <span className="min-w-0 flex-1 hyphens-auto wrap-break-word">{namn}</span>
    </Link>
  )
}

/**
 * En grupp som fälls ut: rubriken med ikon och pil, och sidorna under. Har gruppen en startsida (GRUPPSTART) är
 * rubriken en länk som öppnar gruppen och går dit, och pilen är en egen knapp som fäller ut och ihop.
 */
function Grupp({ grupp, aktiv, oppen, onVaxla, onOppna }: { grupp: Menygrupp; aktiv: Sida | null; oppen: boolean; onVaxla: () => void; onOppna: () => void }) {
  const id = useId()
  const ikon = grupp.nyckel === 'snart' ? <Clock className="size-6 shrink-0" strokeWidth={1.75} aria-hidden /> : <Ikon namn={GRUPPIKON[grupp.nyckel]} />
  const pil = <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none', oppen && 'rotate-180')} aria-hidden />
  const start = GRUPPSTART[grupp.nyckel]
  return (
    <li>
      {start ? (
        <div className="flex items-center gap-0.5">
          <Link to={SIDOR[start].till} onClick={onOppna} className={cn(radKlass(false), 'min-w-0 flex-1 font-medium')}>
            {ikon}
            <span className="min-w-0 flex-1">{grupp.rubrik}</span>
          </Link>
          <button
            type="button"
            aria-expanded={oppen}
            aria-controls={id}
            aria-label={`${oppen ? 'Fäll ihop' : 'Fäll ut'} ${grupp.rubrik}`}
            onClick={onVaxla}
            className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted 3xl:size-12', fokus)}
          >
            {pil}
          </button>
        </div>
      ) : (
        <button type="button" aria-expanded={oppen} aria-controls={id} onClick={onVaxla} className={cn(radKlass(false), 'w-full font-medium')}>
          {ikon}
          <span className="min-w-0 flex-1 text-left">{grupp.rubrik}</span>
          {pil}
        </button>
      )}
      <ul id={id} hidden={!oppen} className="mt-0.5 space-y-0.5">
        {grupp.sidor.map((s) => (
          <li key={s}>
            <Menyrad sida={s} aktiv={aktiv === s} iGrupp />
          </li>
        ))}
      </ul>
    </li>
  )
}

/**
 * Sidomenyn på dator, enligt skissen Meny-ljus och Meny-mork: en vit meny mot den tonade innehållsytan (i mörkt läge
 * mörkare än innehållet). Logotypen leder till Hem. Överst Hem, sedan grupperna Planera, Utrustning, Minnen och Kommer
 * snart, som fälls ut. Gruppen med den aktiva sidan är öppen, och Kommer snart är stängd från början. Under grupperna
 * Dina turer med nedräkning, och längst ner profilen och Inställningar på en rad. Ligger kvar när man scrollar.
 */
export function Sidomeny({
  aktiv,
  turer,
  oppenTurId,
  namn,
  epost,
  bild,
  bildLaddar,
  profilHamtad,
}: {
  aktiv: Sida | null
  turer: TurIListan[] | null
  oppenTurId: string | null
  namn: string
  epost: string
  bild: string | undefined
  bildLaddar: boolean
  profilHamtad: boolean
}) {
  // Gruppen med den aktiva sidan öppnas när man byter sida. Grupper man själv har öppnat eller stängt ligger kvar.
  const [oppna, setOppna] = useState<Set<Gruppnyckel>>(() => oppnaGrupper(aktiv))
  const [forraAktiv, setForraAktiv] = useState(aktiv)
  if (aktiv !== forraAktiv) {
    setForraAktiv(aktiv)
    setOppna((o) => new Set([...o, ...oppnaGrupper(aktiv)]))
  }
  const vaxla = (g: Gruppnyckel) =>
    setOppna((o) => {
      const ny = new Set(o)
      if (ny.has(g)) ny.delete(g)
      else ny.add(g)
      return ny
    })

  return (
    <aside className="hidden border-r border-border bg-meny lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto">
      {/* Kurvorna följer menyns hela höjd, så att de ligger längst ner även när menyn är högre än skärmen. */}
      <div className="relative isolate flex flex-1 flex-col">
        <Menykurvor />
        <div className="flex flex-1 flex-col px-4 pt-6 pb-4">
          <Link to="/hem" className={cn('flex min-h-11 items-center rounded-md px-2', fokus)}>
            <Logotyp className="text-xl 3xl:text-2xl" />
          </Link>
          <nav aria-label="Huvudmeny" className="mt-4">
            <ul className="space-y-0.5">
              <li>
                <Menyrad sida="hem" aktiv={aktiv === 'hem'} />
              </li>
              {MENYGRUPPER.map((g) => (
                <Grupp key={g.nyckel} grupp={g} aktiv={aktiv} oppen={oppna.has(g.nyckel)} onVaxla={() => vaxla(g.nyckel)} onOppna={() => setOppna((o) => new Set([...o, g.nyckel]))} />
              ))}
            </ul>
          </nav>
          <DinaTurer turer={turer} oppenTurId={oppenTurId} />
        </div>

        <div className="border-t border-border px-4 pt-3 pb-3">
          <div className="flex items-center gap-1">
            <Link
              to="/profil"
              aria-current={aktiv === 'profil' ? 'page' : undefined}
              className={cn('flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 transition-colors', fokus, aktiv === 'profil' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
            >
              <Namnbricka namn={namn || epost || '?'} bild={bild} laddar={bildLaddar} />
              {profilHamtad ? (
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium 3xl:text-[1.0625rem]">{namn || 'Din profil'}</span>
                  <span className={cn('block text-xs', aktiv === 'profil' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>Profil</span>
                </span>
              ) : (
                <>
                  <Skelett className="h-4 w-24" />
                  <span className="sr-only">Din profil</span>
                </>
              )}
            </Link>
            <Link
              to="/installningar"
              aria-label="Inställningar"
              aria-current={aktiv === 'installningar' ? 'page' : undefined}
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors',
                fokus,
                aktiv === 'installningar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Settings className="size-5" aria-hidden />
            </Link>
          </div>
          <Sidfot variant="meny" className="px-3 pt-2 text-xs" />
        </div>
      </div>
    </aside>
  )
}
