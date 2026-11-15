// De inloggade sidorna: vilka sidor som har sidomenyn och vilken del av menyn som är aktiv.

export type Del = 'turer' | 'forrad' | 'profil'

/** Sidorna som visas i den inloggade ramen med sidomeny och bottennavigation. */
export function arAppsida(pathname: string): boolean {
  return aktivDel(pathname) !== null
}

/** Vilken del av menyn sidan hör till. En enskild tur hör till Mina turer. */
export function aktivDel(pathname: string): Del | null {
  const sokvag = pathname.replace(/\/+$/, '') || '/'
  if (sokvag === '/turer' || sokvag.startsWith('/tur/')) return 'turer'
  if (sokvag === '/forrad') return 'forrad'
  if (sokvag === '/profil') return 'profil'
  return null
}
