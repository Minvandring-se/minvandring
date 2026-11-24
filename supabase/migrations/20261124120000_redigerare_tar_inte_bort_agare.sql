-- En redigerare ska inte kunna ta bort en person utan konto som har rollen ägare.
-- 20261123235900_redigerare_andrar_bara_utan_konto stängde sådana rader för insert och update, men delete-policyn
-- släppte fortfarande igenom alla rader utan konto för owner och editor. Nu gäller samma regel som för update:
--
--   owner  tar bort alla rader i sin tur (triggern skydda_deltagare ser till att turen har kvar en ägare).
--   editor tar bort rader utan konto som inte har rollen owner (hundar och personer som inte har gått med).
--   alla   kan lämna turen genom att ta bort sin egen rad.

drop policy "ta bort deltagare eller lämna turen" on public.deltagare;

create policy "ta bort deltagare eller lämna turen" on public.deltagare for delete to authenticated
  using (
    public.ar_agare(tur_id)
    or (public.kan_andra(tur_id) and user_id is null and roll <> 'owner')
    or user_id = (select auth.uid())
  );
