-- Allergener för baslivsmedlen: EU:s 14, som för påsarna i matkatalogen (domänen allergenlista).
-- Null betyder okänt, och okänt räknas aldrig som att livsmedlet passar. En tom lista betyder att livsmedlet inte
-- innehåller någon av de 14. Värdena räknas ut med reglerna i src/lib/livsmedelsgrupper.ts, bara för enkla råvaror,
-- och läggs in med seed-migreringen efter den här (20261124231001_livsmedel_allergener_seed.sql).
-- Rättigheterna är som för resten av tabellen: inloggade läser, ingen roll skriver.
alter table public.livsmedel add column allergener public.allergenlista;
