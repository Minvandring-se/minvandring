import { turbildForm } from '@/lib/matt'
import { cn } from '@/lib/utils'

/**
 * Turens tecknade bildruta: himmel, sol, fjäll, kullar och leden med ledkrysset. Färgerna kommer från variablerna,
 * så bilden följer ljust och mörkt läge. Varje tur får sin egen variation, vald utifrån id. Dekor, så den är dold för skärmläsare.
 * Bilden fyller sin ruta och beskärs (slice), så ge den en höjd eller ett bildförhållande med className.
 */
export function Turbild({ turId, className }: { turId: string; className?: string }) {
  const { solX, solY, topp1, topp2, spegla } = turbildForm(turId)
  return (
    <svg aria-hidden viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice" className={cn('block bg-primary-soft', className)}>
      <rect width="600" height="460" className="fill-primary-soft" />
      <g transform={spegla ? 'translate(600 0) scale(-1 1)' : undefined}>
        <circle cx={solX} cy={solY} r="44" className="fill-accent-soft" />
        {/* Fjällen längst bort, med snö på de två högsta topparna. */}
        <path d={`M0 290 L80 205 L150 255 L250 ${topp1} L330 230 L420 ${topp2} L500 240 L600 180 V460 H0Z`} className="fill-illustration/45" />
        <path
          d={`M250 ${topp1} L282 ${topp1 + 26} L263 ${topp1 + 23} L250 ${topp1 + 35} L236 ${topp1 + 23} L218 ${topp1 + 27}Z M420 ${topp2} L446 ${topp2 + 20} L431 ${topp2 + 18} L420 ${topp2 + 28} L410 ${topp2 + 18} L396 ${topp2 + 21}Z`}
          className="fill-pa-bild/90"
        />
        {/* Kullarna och marken närmast. */}
        <path d="M0 345 C110 300 220 325 320 310 C420 296 510 330 600 312 V460 H0Z" className="fill-illustration/75" />
        <path d="M0 400 C150 378 300 394 600 380 V460 H0Z" className="fill-illustration" />
        {/* Leden och ledkrysset. */}
        <path
          d="M40 450 C160 410 260 375 360 355 C430 340 480 335 520 300"
          fill="none"
          strokeWidth="4"
          strokeDasharray="8 10"
          strokeLinecap="round"
          className="stroke-accent"
        />
        {/* Stolpen och granarna är mörka. I mörkt läge är himlen lika mörk som yta-stark, så där används bakgrunden. */}
        <rect x="516" y="266" width="4" height="36" className="fill-yta-stark mork:fill-background" />
        <path d="M507 274 l22 15 M529 274 l-22 15" strokeWidth="4" strokeLinecap="round" className="stroke-accent" />
        {/* Två granar. */}
        <path d="M60 388 l10-26 10 26z M82 394 l9-22 9 22z" className="fill-yta-stark mork:fill-background" />
      </g>
    </svg>
  )
}
