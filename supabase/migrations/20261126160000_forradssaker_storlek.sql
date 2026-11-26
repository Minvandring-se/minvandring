-- Ens egen storlek på ett klädesplagg i förrådet, till exempel L eller 48. Appen jämför den med storleken
-- tillverkarens vikt gäller (produkter.egenskaper.viktstorlek). Samma åtkomst som resten av förrådet: bara ägaren.
alter table public.forradssaker
  add column storlek text,
  add constraint forradssaker_storlek_langd check (btrim(storlek) <> '' and char_length(storlek) <= 12);
