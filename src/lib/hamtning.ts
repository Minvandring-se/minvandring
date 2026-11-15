// Tolkar svar från Supabase när en enskild rad hämtas, så att sidan kan skilja på
// "finns inte" och "gick inte att hämta".

export type Hamtning<T> = { lage: 'klar'; data: T } | { lage: 'saknas' } | { lage: 'fel' }

interface Svar<T> {
  data: T | null
  error: { code?: string; message?: string } | null
}

/** Postgres-kod för ett värde som inte går att tolka, till exempel ett id i adressen som inte är ett uuid. */
const OGILTIGT_VARDE = '22P02'

/**
 * Tolkar svaret när en rad hämtas med maybeSingle().
 * Saknas raden, eller är id:t i adressen ogiltigt, finns den inte (eller så får man inte se den).
 * Alla andra fel, till exempel att nätet är nere, är fel som går att försöka igen.
 */
export function tolkaRad<T>({ data, error }: Svar<T>): Hamtning<T> {
  if (error) return error.code === OGILTIGT_VARDE ? { lage: 'saknas' } : { lage: 'fel' }
  return data === null ? { lage: 'saknas' } : { lage: 'klar', data }
}
