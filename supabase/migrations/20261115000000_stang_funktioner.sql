-- Stänger SECURITY DEFINER-funktionerna i public för API:t (Security Advisor).
-- Supabase ger som standard execute på nya funktioner till anon och authenticated, så de går att anropa
-- via /rest/v1/rpc. Triggerfunktioner behöver inte execute för att triggern ska köras, och anon ska
-- inte kunna anropa något alls.

-- ─── Triggerfunktioner och interna funktioner: ingen får anropa dem direkt ──
revoke execute on function
  public.ny_anvandare(),
  public.ny_tur(),
  public.skydda_deltagare(),
  public.ny_deltagare_utan_konto(),
  public.synka_namn()
from public, anon, authenticated;

-- min_roll används bara inuti kan_andra och ar_agare, som körs som ägaren. Ingen behöver anropa den direkt.
revoke execute on function public.min_roll(uuid) from public, anon, authenticated;

-- rls_auto_enable skapas av Supabase (automatisk RLS) och finns inte i migreringarna. Stäng den om den finns.
do $$
declare
  f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'rls_auto_enable'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end $$;

-- ─── Hjälpfunktioner i RLS-policyerna och ga_med som appen anropar: bara inloggade ──
revoke execute on function
  public.ar_medlem(uuid),
  public.kan_andra(uuid),
  public.ar_agare(uuid),
  public.ga_med(text)
from public, anon;
grant execute on function
  public.ar_medlem(uuid),
  public.kan_andra(uuid),
  public.ar_agare(uuid),
  public.ga_med(text)
to authenticated;

-- ─── search_path på SECURITY DEFINER-funktioner i public som saknar den ──
-- Våra egna har redan search_path = ''. rls_auto_enable är Supabases och lämnas orörd, den stängs bara ovan.
do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.prosecdef
      and p.proname <> 'rls_auto_enable'
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
  loop
    execute format('alter function %s set search_path = pg_catalog, public', f);
  end loop;
end $$;
