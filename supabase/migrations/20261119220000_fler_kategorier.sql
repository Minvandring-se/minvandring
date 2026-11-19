-- Fler kategorier för utrustning: en ny huvudkategori för vinterturer och åtta nya underkategorier.
-- Inga befintliga nycklar ändras. Etiketterna står i src/lib/forrad.ts.
-- Snöskor får en egen underkategori under vinter. broddar finns kvar under skor med samma nyckel.

insert into public.kategorier (nyckel) values ('vinter');

insert into public.underkategorier (kategori, nyckel) values
  ('vinter', 'skidor'), ('vinter', 'pulka'), ('vinter', 'snoskor'), ('vinter', 'snospade'), ('vinter', 'lavin'),
  ('klader', 'solglasogon'),
  ('sova', 'sittunderlag'), ('sova', 'pump'),
  ('kok', 'matforvaring'),
  ('ovrigt', 'fiske'), ('ovrigt', 'bocker');
