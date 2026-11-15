/**
 * Projektets grundadress, t.ex. https://abc.supabase.co.
 * Tar bort mellanslag, snedstreck på slutet och sökvägar som /rest/v1 eller /auth/v1,
 * så att en adress som klistrats in från fel ställe i Supabase ändå fungerar.
 */
export function supabaseAdress(url: string | undefined): string | undefined {
  if (!url) return undefined
  const rensad = url.trim().replace(/\/+$/, '').replace(/\/(rest|auth|storage|realtime|functions)\/v1$/, '')
  return rensad || undefined
}
