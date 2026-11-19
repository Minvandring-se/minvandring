-- Profilbilder. Bilden ligger i en privat bucket i Supabase Storage som <user_id>/bild.webp.
-- Man ser sin egen bild och bilden för dem man delar minst en tur med. Bara man själv kan ladda upp, byta och ta bort.

-- ─── När bilden senast byttes ────────────────────────────────────────────────
-- Tom när bild saknas. Appen ser på den om det finns en bild, och använder tiden för att inte visa en gammal bild ur cacheminnet.
alter table public.profiler add column bild_uppdaterad timestamptz;

-- ─── Delar vi en tur? ────────────────────────────────────────────────────────
-- Sant när den inloggade och den andra användaren är deltagare i minst en gemensam tur.
-- Security definer så att den går att använda i policyer utan att deltagare-tabellens egna policyer frågas i en loop.
-- Den avslöjar bara det man redan ser i sina turer: vilka som är med.
create function public.delar_tur(annan_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
      from public.deltagare jag
      join public.deltagare annan on annan.tur_id = jag.tur_id
     where jag.user_id = auth.uid()
       and annan.user_id = annan_user_id
  );
$$;

revoke execute on function public.delar_tur(uuid) from public, anon;
grant execute on function public.delar_tur(uuid) to authenticated;

-- ─── Bucketen ────────────────────────────────────────────────────────────────
-- Privat: inget går att nå utan inloggning och en policy som släpper fram det.
-- Appen förminskar bilden till 256 × 256 px WebP före uppladdning. Gränserna här stoppar allt annat.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profilbilder', 'profilbilder', false, 512000, array['image/webp'])
on conflict (id) do nothing;

-- ─── Vem får vad ─────────────────────────────────────────────────────────────
-- Första delen av filens sökväg är ägarens user_id.
-- Läsa: sin egen bild, och bilden för den man delar en tur med.
-- CASE gör att sökvägen bara görs om till ett uuid när den ser ut som ett, så att en konstig sökväg inte ger ett fel.
create policy "profilbilder: läsa sin egen och turkamraters" on storage.objects for select to authenticated
  using (
    bucket_id = 'profilbilder'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or case
           when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             then public.delar_tur(((storage.foldername(name))[1])::uuid)
           else false
         end
    )
  );

-- Ladda upp, byta och ta bort: bara filen <eget user_id>/bild.webp.
create policy "profilbilder: ladda upp sin egen" on storage.objects for insert to authenticated
  with check (bucket_id = 'profilbilder' and name = (select auth.uid())::text || '/bild.webp');

create policy "profilbilder: byta sin egen" on storage.objects for update to authenticated
  using (bucket_id = 'profilbilder' and name = (select auth.uid())::text || '/bild.webp')
  with check (bucket_id = 'profilbilder' and name = (select auth.uid())::text || '/bild.webp');

create policy "profilbilder: ta bort sin egen" on storage.objects for delete to authenticated
  using (bucket_id = 'profilbilder' and name = (select auth.uid())::text || '/bild.webp');
