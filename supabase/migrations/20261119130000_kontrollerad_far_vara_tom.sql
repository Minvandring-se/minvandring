-- En produkt får ligga i katalogen innan någon av oss har kontrollerat den mot tillverkarens sida.
-- kontrollerad är tom tills dess. Sådana produkter syns i sökningen och visas som "Inte granskad än".
-- Jämförelser mellan produkter ska bara använda de kontrollerade.
alter table public.produkter alter column kontrollerad drop not null;
