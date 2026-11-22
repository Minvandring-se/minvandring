-- Granskningsnivåer för produktkatalogen. En rad kan ha två nivåer, och den högsta visas i appen:
--   granskad     = Claude har låtit katalog-granskaren läsa tillverkarens sida och bekräfta vikten (dagen det skedde)
--   kontrollerad = en av grundarna har stickprovskontrollerat hela genomgången raden kom med (finns sedan tidigare)
-- Butiksrader, där vikten kommer från butikens sida eftersom tillverkaren saknar vikt, får ingen nivå.
-- Inga nya tabeller, så ingen ny GRANT eller policy behövs: authenticated läser hela tabellen, och ingen användare kan skriva.
-- Spärr: om någon rad redan har kontrollerad satt (utan granskad) skulle checken längre ned falla. Då stoppas migreringen här och allt rullas tillbaka.
do $
begin
  if exists (select 1 from public.produkter where kontrollerad is not null) then
    raise exception 'Någon rad har kontrollerad satt. Kontrollera raderna och granska dem innan granskningsnivåerna körs.';
  end if;
end $;

alter table public.produkter add column granskad date;

-- Var uppgifterna kommer från. Alla befintliga rader är tillverkarens tills seeden anger butik för reservraderna.
alter table public.produkter
  add column kalla_typ text not null default 'tillverkare' check (kalla_typ in ('tillverkare', 'butik'));

-- Stickprovskontroll kräver att raden först är granskad, och en butiksrad kan aldrig ha någon av nivåerna.
alter table public.produkter
  add constraint produkter_granskningsnivaer check (
    (kontrollerad is null or granskad is not null)
    and (kalla_typ <> 'butik' or (granskad is null and kontrollerad is null))
  );
