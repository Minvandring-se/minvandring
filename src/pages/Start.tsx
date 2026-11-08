import { Backpack, CookingPot, Route, Users } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSession } from '@/hooks/useSession'

const delar = [
  { ikon: Users, rubrik: 'Planera tillsammans', text: 'Bjud in gänget med en länk. Alla ser samma tur.' },
  { ikon: Backpack, rubrik: 'Packa smart', text: 'Vem bär vad, vikt per ryggsäck och bocka av när du packat.' },
  { ikon: CookingPot, rubrik: 'Mat utan krångel', text: 'Matschema, kalorier, matvikt och inköpslista räknas ut åt dig.' },
  { ikon: Route, rubrik: 'Rutt och säkerhet', text: 'Dagsetapper, tider och en färdplan att lämna hemma.' },
]

export function Start() {
  const session = useSession()

  return (
    <div className="space-y-10 pt-6">
      <section className="space-y-4">
        <h1 className="text-4xl leading-tight sm:text-5xl">Planera. Packa. Upplev.</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Min Vandring hjälper er planera hela turen tillsammans: packning, mat, vikt och rutt på ett ställe.
        </p>
        <Link to={session ? '/turer' : '/logga-in'}>
          <Button size="lg">{session ? 'Till mina turer' : 'Kom igång'}</Button>
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {delar.map(({ ikon: Ikon, rubrik, text }) => (
          <Card key={rubrik} className="space-y-2">
            <Ikon className="size-6 text-primary" aria-hidden />
            <h2 className="text-lg">{rubrik}</h2>
            <p className="text-muted-foreground">{text}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
