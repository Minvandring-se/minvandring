-- En redigerare ska bara kunna ändra deltagare utan konto (hundar och personer som inte har gått med själva).
-- Förut släppte policyn igenom alla uppdateringar från owner och editor, så en redigerare kunde med ett eget
-- anrop byta namn, typ, sortering, bärvikt och matandel på vilken deltagare som helst, också på ägaren.
--
--   owner  ändrar alla rader i sin tur.
--   editor ändrar bara rader utan konto. Inte sin egen rad och ingen annans.
--   viewer ändrar ingenting.
--
-- En rad utan konto som har rollen owner räknas som ägarens och är stängd för redigeraren,
-- på samma sätt som den inte går att lägga till (insert-policyn) eller ta över (ga_med).
--
-- Det som inte går via policyn är oförändrat, eftersom funktionerna är security definer och inte berörs av RLS:
--   ga_med      kopplar en person utan konto till den som går med.
--   synka_namn  för över namnet i profilen till ens egna rader.
-- Triggern skydda_deltagare gäller som förut: bara owner ändrar roller, ingen flyttar en deltagare
-- och turen har alltid en owner.

drop policy "owner och editor ändrar deltagare" on public.deltagare;

create policy "owner ändrar alla deltagare, editor bara de utan konto" on public.deltagare for update to authenticated
  using (public.ar_agare(tur_id) or (public.kan_andra(tur_id) and user_id is null and roll <> 'owner'))
  with check (public.ar_agare(tur_id) or (public.kan_andra(tur_id) and user_id is null and roll <> 'owner'));
