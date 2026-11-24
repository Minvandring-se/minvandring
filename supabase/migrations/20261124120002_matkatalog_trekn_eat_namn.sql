-- Två påsar från Trek'n Eat hade märket i namnet, så att de visades som "Trek'n Eat Trek'n Eat …".
-- Namnen är rättade i supabase/katalog/mat/trekn-eat.csv. Seed-migreringen lägger in en ny rad när namnet ändras,
-- eftersom märke och namn är nyckeln, så de två raderna döps om här i stället. De behåller sitt id, och stjärnor,
-- skafferi och rätter i turer som pekar på dem följer med. Rätter som redan ligger i turer behåller sina namn.

update public.matprodukter set namn = 'Muesli with Oat Milk'
  where marke = 'Trek''n Eat' and namn = 'Trek''n Eat Muesli with Oat Milk';

update public.matprodukter set namn = 'Protein Porridge'
  where marke = 'Trek''n Eat' and namn = 'Trek''n Eat Protein Porridge';
