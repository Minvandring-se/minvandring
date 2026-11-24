-- Kök delas i två underkategorier: brännare som säljs utan kokkärl (brannare, som förut) och kompletta kök
-- där kokkärl ingår (komplett_kok, ny). Inga befintliga nycklar ändras. Etiketterna står i src/lib/forrad.ts.
-- Katalogens kök med kokkärl flyttas till komplett_kok i nästa seed-migrering.

insert into public.underkategorier (kategori, nyckel) values ('kok', 'komplett_kok');
