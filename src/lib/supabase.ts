import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const nyckel = import.meta.env.VITE_SUPABASE_ANON_KEY

/** null när nycklarna saknas i .env.local. Då visar appen en ruta om hur man kommer igång. */
export const supabase: SupabaseClient | null = url && nyckel ? createClient(url, nyckel) : null
