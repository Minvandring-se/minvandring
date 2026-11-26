-- Grupper: spara vänner man brukar vandra med som en grupp, till exempel "Fjällgänget", och starta en tur med hela
-- gruppen eller lägg till gruppen i en tur. Steg 4 i planen för notiser, vänner, grupper och påminnelser.
--
-- Grupperna är privata: en egen etikett som bara ägaren ser. De som är med i gruppen ser den inte och får ingen
-- notis om den. En medlem måste vara ägarens vän, och tas bort ur gruppen när vänskapen tas bort eller kontot raderas.
-- Att lägga till en grupp i en tur går genom lagg_till_vanner, med samma regler som för enskilda vänner.

-- ─── Grupperna ───────────────────────────────────────────────────────────────
create table public.grupper (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  namn text not null check (btrim(namn) <> '' and char_length(namn) <= 40),
  skapad timestamptz not null default now(),
  constraint grupper_id_user unique (id, user_id)
);
-- Samma namn bara en gång per person, oavsett stora och små bokstäver.
create unique index grupper_unikt_namn on public.grupper (user_id, lower(btrim(namn)));

revoke all on public.grupper from public, anon, authenticated;
grant select, delete on public.grupper to authenticated;
grant insert (id, namn) on public.grupper to authenticated;
grant update (namn) on public.grupper to authenticated;
alter table public.grupper enable row level security;

create policy "ägaren ser sina" on public.grupper for select to authenticated using (user_id = auth.uid());
create policy "ägaren skapar sina" on public.grupper for insert to authenticated with check (user_id = auth.uid());
create policy "ägaren byter namn på sina" on public.grupper for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ägaren tar bort sina" on public.grupper for delete to authenticated using (user_id = auth.uid());

-- ─── Medlemmarna ─────────────────────────────────────────────────────────────
-- En rad kan bara höra till en grupp med samma ägare (främmande nyckel på (grupp_id, user_id), som i recepten).
create table public.gruppmedlemmar (
  grupp_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  medlem_id uuid not null references auth.users (id) on delete cascade,
  primary key (grupp_id, medlem_id),
  foreign key (grupp_id, user_id) references public.grupper (id, user_id) on delete cascade,
  check (medlem_id <> user_id)
);
create index gruppmedlemmar_user_id on public.gruppmedlemmar (user_id);
create index gruppmedlemmar_medlem_id on public.gruppmedlemmar (medlem_id);

revoke all on public.gruppmedlemmar from public, anon, authenticated;
grant select, delete on public.gruppmedlemmar to authenticated;
grant insert (grupp_id, medlem_id) on public.gruppmedlemmar to authenticated;
alter table public.gruppmedlemmar enable row level security;

create policy "ägaren ser sina" on public.gruppmedlemmar for select to authenticated using (user_id = auth.uid());
create policy "ägaren lägger till i sina" on public.gruppmedlemmar for insert to authenticated with check (user_id = auth.uid());
create policy "ägaren tar bort ur sina" on public.gruppmedlemmar for delete to authenticated using (user_id = auth.uid());

-- Gruppen måste vara den inloggades egen, en medlem måste vara ägarens vän, och en grupp har högst 50 medlemmar
-- (lika många som lagg_till_vanner tar emot). Ägaren kontrolleras först, så att inget av de andra svaren säger något
-- om någon annans grupp. Gruppraden låses, så att två insättningar samtidigt inte kan passera taket.
-- Security definer, eftersom vänskaperna inte går att läsa direkt.
create function public.skydda_gruppmedlem() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.grupper g where g.id = new.grupp_id and g.user_id = new.user_id for update;
  if not found then
    raise exception 'Hittar ingen grupp';
  end if;
  if not public.ar_vanner(new.user_id, new.medlem_id) then
    raise exception 'Bara vänner kan vara med i en grupp';
  end if;
  if (select count(*) from public.gruppmedlemmar m where m.grupp_id = new.grupp_id) >= 50 then
    raise exception 'En grupp kan ha högst 50 vänner';
  end if;
  return new;
end;
$$;
revoke execute on function public.skydda_gruppmedlem() from public, anon, authenticated;
create trigger skydda_gruppmedlem before insert on public.gruppmedlemmar
  for each row execute function public.skydda_gruppmedlem();

-- När en vänskap tas bort försvinner vännerna ur varandras grupper.
create function public.grupper_utan_vanskap() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.gruppmedlemmar
   where (user_id = old.user_a and medlem_id = old.user_b) or (user_id = old.user_b and medlem_id = old.user_a);
  return old;
end;
$$;
revoke execute on function public.grupper_utan_vanskap() from public, anon, authenticated;
create trigger grupper_utan_vanskap after delete on public.vanskap
  for each row execute function public.grupper_utan_vanskap();

-- ─── Spara en grupp ──────────────────────────────────────────────────────────
-- Namnet och medlemmarna i en transaktion. Utan id skapas en ny grupp. Medlemmarna ersätts med de av personerna som
-- är ens vänner, andra hoppas över. Ger gruppens id.
create function public.spara_grupp(grupp uuid, namn text, medlemmar uuid[]) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  anvandare uuid := auth.uid();
  gid uuid := grupp;
begin
  if anvandare is null then
    raise exception 'Du måste vara inloggad';
  end if;
  if coalesce(cardinality(medlemmar), 0) > 50 then
    raise exception 'En grupp kan ha högst 50 vänner';
  end if;
  if gid is null then
    insert into public.grupper (user_id, namn) values (anvandare, btrim(spara_grupp.namn)) returning grupper.id into gid;
  else
    update public.grupper g set namn = btrim(spara_grupp.namn) where g.id = grupp and g.user_id = anvandare;
    if not found then
      raise exception 'Hittar ingen grupp';
    end if;
    delete from public.gruppmedlemmar m where m.grupp_id = grupp;
  end if;
  insert into public.gruppmedlemmar (grupp_id, user_id, medlem_id)
  select distinct gid, anvandare, x from unnest(medlemmar) x
   where x is not null and x <> anvandare and public.ar_vanner(anvandare, x);
  return gid;
end;
$$;
revoke execute on function public.spara_grupp(uuid, text, uuid[]) from public, anon;
grant execute on function public.spara_grupp(uuid, text, uuid[]) to authenticated;
