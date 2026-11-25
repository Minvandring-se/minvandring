-- Ditt kök i förrådet: kokkärl, stekpannor och bränsle kopplas till brännaren eller det kompletta köket de används
-- med. kok_id är saken de hör till. Kopplingen är bara ens egen: båda sakerna måste ha samma ägare, och policyn
-- "egna saker" gäller som förut. Tas brännaren bort finns delarna kvar i förrådet, utan koppling.

alter table public.forradssaker add constraint forradssaker_id_user_id unique (id, user_id);

alter table public.forradssaker add column kok_id uuid;

alter table public.forradssaker
  add constraint forradssaker_kok_samma_agare foreign key (kok_id, user_id)
  references public.forradssaker (id, user_id) on delete set null (kok_id);

alter table public.forradssaker
  add constraint forradssaker_kok_inte_sig_sjalv check (kok_id is null or kok_id <> id);

create index forradssaker_kok_id on public.forradssaker (kok_id) where kok_id is not null;

-- En del i köket är ett kokkärl eller ett bränsle, och den hör till en brännare eller ett komplett kök som inte självt
-- är en del i ett annat kök. Ett kök som har delar kan bara byta mellan brännare och komplett kök.
create function public.skydda_forradskok() returns trigger
language plpgsql set search_path = '' as $$
declare
  kok public.forradssaker;
begin
  if new.kok_id is not null then
    if new.underkategori is distinct from 'kastrull' and new.underkategori is distinct from 'bransle' then
      raise exception 'Bara kokkärl och bränsle kan ingå i ett kök';
    end if;
    -- Låser köket, så att det inte byter underkategori samtidigt som delen kopplas.
    select * into kok from public.forradssaker where id = new.kok_id for share;
    if kok.underkategori is distinct from 'brannare' and kok.underkategori is distinct from 'komplett_kok' then
      raise exception 'Ett kök byggs kring en brännare eller ett komplett kök';
    end if;
    if kok.kok_id is not null then
      raise exception 'Det här köket är redan en del i ett annat kök';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.underkategori is distinct from old.underkategori
    and new.underkategori is distinct from 'brannare' and new.underkategori is distinct from 'komplett_kok'
    and exists (select 1 from public.forradssaker d where d.kok_id = new.id) then
    raise exception 'Ta bort delarna ur köket innan du byter kategori';
  end if;
  return new;
end;
$$;

revoke execute on function public.skydda_forradskok() from public, anon, authenticated;

create trigger skydda_forradskok
  before insert or update of kok_id, underkategori on public.forradssaker
  for each row execute function public.skydda_forradskok();
