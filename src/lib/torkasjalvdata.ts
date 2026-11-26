// Innehållet i Torka själv: 30 recept, 20 råvaruguider och Kom igång. Från underlaget i
// Claude outputs/torka-sjalv/ (catalog.json, 01-recept.md och 02-ravaror-och-snacks.md, granskat 26 november 2026),
// utan källornas betyg och utan status. Texten kan ha **fetstil** och [länkar](https://…), som visas med textdelar i
// src/lib/torkasjalv.ts. Id:na är beständiga. Logiken och typerna står i src/lib/torkasjalv.ts.
import type { Torkavsnitt, Torkguide, Torkrecept } from './torkasjalv'

export const TORKRECEPT: readonly Torkrecept[] = [
  {
    "id": "recept-001",
    "nummer": 1,
    "slug": "pasta-med-tomat-och-linssas",
    "titel": "Pasta med tomat- och linssås",
    "kategori": "huvudratt",
    "svarighet": "Lätt",
    "anvandning": "huvudrätt",
    "borjaHar": true,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "Sats",
        "text": "originalet anger 4 små portioner; räkna hellre med 2–3 huvudrätter beroende på pasta. 1,2 dl torra röda linser, 400 g krossade tomater, 3,6 dl buljong, 1 vitlöksklyfta, 1 tsk vardera oregano och basilika, ¼ tsk vardera salt och socker. Pasta: originalets ingredienslista anger 2,4 dl totalt men instruktionen föreslår 1,2 dl per person. Välj portionsmängd efter aptit. Packa 1 msk olja per person och eventuell ost separat."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "sjud såsingredienserna cirka 15 minuter tills linserna är mjuka. Bred tunt på täta torkunderlägg. Torka vid **57 °C i 8–12 timmar**, till genomtorr sås."
      },
      {
        "rubrik": "På tur",
        "text": "täck sås och pasta med vatten. Koka upp och sjud cirka 12 minuter, tills pastan är färdig. Tillsätt olja och eventuell ost."
      },
      {
        "rubrik": "Sverige",
        "text": "vanliga basvaror; fungerar utan ost. Portionsuppgifterna i originalet stämmer inte överens med varandra, se ovan."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/dehydrated-red-lentil-marinara/"
      }
    ]
  },
  {
    "id": "recept-002",
    "nummer": 2,
    "slug": "rod-linschili-med-kidneybonor",
    "titel": "Röd linschili med kidneybönor",
    "kategori": "huvudratt",
    "svarighet": "Lätt",
    "anvandning": "huvudrätt",
    "borjaHar": true,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "4 portioner",
        "text": "2,4 dl röda linser, 2,4 dl hackad lök, 2,4 dl paprika, 4,8 dl skivad zucchini, 6 vitlöksklyftor, 400 g krossade tomater, en burk kidneybönor 400 g, 2 msk tomatpuré, minst 4,8 dl buljong, 1 msk olja, 1 msk spiskummin, 3 msk mild chilikryddblandning, 1 tsk socker och salt efter smak. Packa extra olja separat."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "mjuka grönsakerna i oljan, tillsätt vitlök och kryddor. Tillsätt tomat, avrunna bönor, puré, buljong och linser. Sjud cirka 20 minuter tills linserna är färdiga. Bred tunt och torka vid **57 °C i 8–12 timmar**, till torr och smulig chili."
      },
      {
        "rubrik": "På tur",
        "text": "börja med **2,4 dl vatten per portion**. Koka upp och sjud cirka 10 minuter, längre om bönorna är hårda. Rör ner olja."
      },
      {
        "rubrik": "Sverige",
        "text": "billig storkoksmat. Originalet dubblerar saltraden; här anges salt efter smak."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/red-lentil-chili/"
      }
    ]
  },
  {
    "id": "recept-003",
    "nummer": 3,
    "slug": "risotto-med-svamp-zucchini-och-arter",
    "titel": "Risotto med svamp, zucchini och ärter",
    "kategori": "huvudratt",
    "svarighet": "Medel",
    "anvandning": "huvudrätt",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "2 portioner",
        "text": "2,4 dl arborioris, 1 liten lök, 1 msk olja, 1,2 dl vitt vin, 4,8 dl buljong samt extra vatten vid behov, 1 liten zucchini, 6–8 champinjoner, 0,6 dl frysta ärter, salt. Separat: 2 msk parmesan och 2 msk olivolja."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "gör risotton färdig genom att mjuka löken, tillsätta ris/vin och sedan buljong successivt. Skiva grönsakerna tunt. Torka risotton enligt **G, 63 °C**, till hårda korn; grönsakerna separat vid **57 °C**, till helt torra. Originalet anger 57 °C och 4–8 timmar för allt; spannmålsdelen är metodanpassad här."
      },
      {
        "rubrik": "På tur",
        "text": "börja med cirka **2,4 dl vatten per person**. Sjud under omrörning tills ris och grönsaker är mjuka; späd vid behov. Tillsätt olja och ost."
      },
      {
        "rubrik": "Sverige",
        "text": "champinjoner gör receptet lätt att handla till. Packa ost enligt produktens förvaringsanvisning."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/dehydrated-risotto-vegetables/"
      }
    ]
  },
  {
    "id": "recept-004",
    "nummer": 4,
    "slug": "minestrone-med-vita-bonor-och-pasta",
    "titel": "Minestrone med vita bönor och pasta",
    "kategori": "soppa",
    "svarighet": "Lätt",
    "anvandning": "lunch/huvudrätt",
    "borjaHar": true,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "2 portioner",
        "text": "1 liten lök, 1 zucchini, 1 selleristjälk, 1 morot, en burk vita bönor 400 g, 400 g krossade tomater, 1,2 dl små makaroner, ½ tsk vardera vitlökspulver, oregano och timjan, lite chiliflakes. Buljong enligt förpackningens dosering. Separat: 2 msk olja."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "finfördela grönsakerna. Förväll moroten först, ett tillägg enligt den svenska grundguiden. Torka grönsaker, avrunna bönor och tomater i tunna separata lager vid **57 °C i cirka 10–12 timmar**, tills allt är torrt. Blanda med pasta och kryddor."
      },
      {
        "rubrik": "På tur",
        "text": "tillsätt cirka **4,8 dl vatten per person**, koka upp och sjud minst 8–10 minuter tills pasta och grönsaker är mjuka. Tillsätt oljan."
      },
      {
        "rubrik": "Sverige",
        "text": "ingredienserna är lättillgängliga. Originalets pastamängd är liten för en hungrig vandrare; öka eller servera knäckebröd till."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/dehydrated-minestrone-soup/"
      }
    ]
  },
  {
    "id": "recept-005",
    "nummer": 5,
    "slug": "chili-med-makaroner-och-notfars",
    "titel": "Chili med makaroner och nötfärs",
    "kategori": "huvudratt",
    "svarighet": "Medel",
    "anvandning": "huvudrätt",
    "borjaHar": false,
    "brickor": [
      "kött"
    ],
    "avsnitt": [
      {
        "rubrik": "4 portioner",
        "text": "454 g mycket mager nötfärs, 1,2 dl ströbröd, 1 lök, 4 vitlöksklyftor, 0,6 dl tomatpuré, 3 msk mild chilikryddblandning, 2 msk spiskummin, 2 tsk paprika, salt efter smak, 7,1 dl buljong, 224 g makaroner, en burk kidneybönor cirka 400 g, 1 msk majsstärkelse och 3 salladslökar. Separat: 4 msk olja; ostpulver valfritt."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "blanda färs och ströbröd. Finfördela och genomstek med lök/vitlök till minst **71 °C**. Tillsätt puré, kryddor, buljong och pasta; sjud nästan färdigt. Red med stärkelsen utrörd i 3 msk vatten, blanda i avrunna bönor. Bred tunt; torka vid **63 °C i 6–12 timmar**, till helt hårt och torrt. Torka salladslöken samtidigt."
      },
      {
        "rubrik": "På tur",
        "text": "**3 dl vatten/person**. Koka en minut och låt stå varmt under lock cirka 10 minuter; fortsätt värma vid behov. Tillsätt olja."
      },
      {
        "rubrik": "Sverige",
        "text": "ostpulver kan utelämnas. Följ köttråden."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/dehydrated-chili-mac/"
      }
    ]
  },
  {
    "id": "recept-006",
    "nummer": 6,
    "slug": "svampstroganoff-med-cashewsas",
    "titel": "Svampstroganoff med cashewsås",
    "kategori": "huvudratt",
    "svarighet": "Medel",
    "anvandning": "huvudrätt",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "2 portioner",
        "text": "112 g breda nudlar, 227 g champinjoner eller annan matsvamp, 0,6 dl hackad lök, 2 tsk grönsaksbuljongpulver, 1 tsk vardera vitlöks- och lökpulver, salt. Sås: 1,2 dl cashewnötter, saft av ½ citron, 1 msk näringsjäst, 1 tsk dijonsenap och cirka 0,8 dl vatten. Separat: 2 msk olja."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "blötlägg cashew en timme, häll av och mixa såsen slät. Koka nudlarna. Skiva svampen cirka 6 mm tunt. Torka sås, nudlar, lök och svamp separat vid **52 °C i 6–12 timmar**. Såsen måste bli helt torr; mal den efter avsvalning."
      },
      {
        "rubrik": "På tur",
        "text": "börja med **2 dl vatten/person**. Koka upp, låt stå varmt cirka 10 minuter eller sjud tills mjukt. Späd och tillsätt olja."
      },
      {
        "rubrik": "Sverige",
        "text": "välj äggfria nudlar för vegansk rätt. Näringsjäst kan kräva större butik. Innehåller nötter och senap; nötfettet motiverar frysförvaring inför senare tur."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/backpacking-mushroom-stroganoff/"
      }
    ]
  },
  {
    "id": "recept-007",
    "nummer": 7,
    "slug": "quinoaskal-med-svarta-bonor-och-majs",
    "titel": "Quinoaskål med svarta bönor och majs",
    "kategori": "huvudratt",
    "svarighet": "Medel",
    "anvandning": "huvudrätt",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "2 portioner",
        "text": "1,2 dl quinoa, 400 g krossade tomater, 0,6 dl vatten, en burk svarta bönor 400 g, ½ röd paprika, 1,2 dl majs, 0,6 dl korianderblad, ¼ tsk vardera vitlöks- och lökpulver, 1 tsk mild chilikryddblandning, ½ tsk vardera spiskummin och oregano, salt. Separat: 2 msk olja och 28 g tortillachips."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "skölj quinoa och koka med tomat/vatten tills mjuk; fyll på vid behov. Torka quinoabasen enligt **G vid 63 °C**. Torka avrunna bönor, majs, finhackad paprika och koriander separat till genomtorrt. Originalets 52 °C för hela rätten har här ersatts för spannmålsdelen."
      },
      {
        "rubrik": "På tur",
        "text": "börja med **1,5 dl vatten/person**, låt dra 5–10 minuter. Koka en minut och låt stå varmt cirka 10 minuter; tillsätt mer vatten vid behov. Toppa med olja/chips."
      },
      {
        "rubrik": "Sverige",
        "text": "vanliga krossade tomater ersätter eldrostat; amerikanskt limepulver är utelämnat."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/backpacking-quinoa-burrito-bowl/"
      }
    ]
  },
  {
    "id": "recept-008",
    "nummer": 8,
    "slug": "tortillasoppa-med-svarta-bonor",
    "titel": "Tortillasoppa med svarta bönor",
    "kategori": "soppa",
    "svarighet": "Lätt",
    "anvandning": "lunch/huvudrätt",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "2 portioner",
        "text": "en burk svarta bönor 400 g, 400 g krossade tomater, 2,4 dl majs, 1 liten lök, 2 msk koriander, 1 jalapeño efter smak, ½ tsk vardera mild chilikryddblandning, vitlökspulver och spiskummin. Buljong enligt dosering. Separat: tortillachips och 2 msk olja."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "skölj och häll av bönorna. Finhacka lök och chili. Sprid råvarorna i tunna separata lager och torka vid **57 °C i 8–12 timmar**, tills allt är genomtorrt. Dela i två påsar med kryddor/buljong."
      },
      {
        "rubrik": "På tur",
        "text": "börja med **3,5 dl vatten/person**. Koka upp och sjud cirka 10 minuter, eller tills bönor och majs är mjuka. Tillsätt olja och toppa med chips."
      },
      {
        "rubrik": "Sverige",
        "text": "använd vanlig majs och krossad tomat; ett förslag är lite rökt paprika för rostad smak. Anpassa buljongen efter volymen så att soppan inte blir för salt."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/dehydrated-tortilla-soup/"
      }
    ]
  },
  {
    "id": "recept-009",
    "nummer": 9,
    "slug": "pasta-primavera-med-zucchini-och-kapris",
    "titel": "Pasta primavera med zucchini och kapris",
    "kategori": "huvudratt",
    "svarighet": "Lätt",
    "anvandning": "lätt huvudrätt",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "2 små portioner",
        "text": "2 små zucchini, 14 körsbärstomater, 2 msk kapris, 2 msk persilja, 2,4 dl små pastasnäckor, 1 tsk basilika, ½ tsk vardera oregano, vitlökspulver och salt. Separat: 2 msk olivolja och eventuell ost."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "skiva zucchini tunt och dela tomaterna. Torka grönsaker, avrunnen kapris och persilja vid **57 °C i 8–12 timmar**, tills helt torra. Blanda med okokt pasta och kryddor, alternativt använd P för förkokt pasta."
      },
      {
        "rubrik": "På tur",
        "text": "täck nätt med vatten. Koka upp och sjud cirka 10 minuter eller tills allt är mjukt. Rör i olja och eventuell ost."
      },
      {
        "rubrik": "Svensk anpassning",
        "text": "grön zucchini ersätter gul sommarsquash. Originalets 2 msk smörpulver är utelämnade, vilket även författaren tillåter. Öka pastan för större middag och justera vattenmängden. Ost är valfri och packas separat."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/dehydrated-backpacking-pasta-primavera/"
      }
    ]
  },
  {
    "id": "recept-010",
    "nummer": 10,
    "slug": "sotpotatisgryta-med-kikarter-och-jordnotter",
    "titel": "Sötpotatisgryta med kikärter och jordnötter",
    "kategori": "huvudratt",
    "svarighet": "Lätt–medel",
    "anvandning": "huvudrätt",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "2 portioner",
        "text": "1 liten lök, 2 vitlöksklyftor, cirka 4,8 dl sötpotatis i små tärningar, 400 g krossade tomater, 1,2 dl buljong, 2 tsk mild chili, ¼ tsk ingefära, salt, 4,8 dl hackad grönkål, en burk kikärter 400 g och 0,6 dl hackade jordnötter. Separat: jordnötssmör och lite olja."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "mjuka löken i lite vatten. Tillsätt övriga grönsaker, tomat, kryddor och buljong. Sjud tills sötpotatisen är mjuk, cirka 10 minuter för små tärningar. Rör i avrunna kikärter. Torka tunt vid **57 °C i 8–12 timmar**, till helt torrt även inuti kikärterna. Packa nötterna separat."
      },
      {
        "rubrik": "På tur",
        "text": "täck grytan med vatten och sjud **15–20 minuter**, tills kikärterna är mjuka. Rör ner jordnötssmör och olja; toppa med nötter."
      },
      {
        "rubrik": "Sverige",
        "text": "vanligt jordnötssmör i en liten tät burk ersätter portionspåsarna. Källan anger två påsar utan gram; ett eget startförslag är 1–2 msk per person. Jordnötsallergi måste märkas."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/backpacking-peanut-stew/"
      }
    ]
  },
  {
    "id": "recept-011",
    "nummer": 11,
    "slug": "quinoagrot-med-apple-och-kanel",
    "titel": "Quinoagröt med äpple och kanel",
    "kategori": "frukost",
    "svarighet": "Lätt",
    "anvandning": "frukost",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "2 portioner",
        "text": "2,4 dl quinoa, 2 äpplen, 4,8 dl vatten, 1 tsk kanel, ¼ tsk salt, 0,6 dl lönnsirap och 1 tsk vaniljextrakt. Efter torkning: 0,6 dl kokosmjölkspulver och 1,2 dl hackade pekannötter."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "skölj quinoa. Koka med små äppelbitar, vatten, kanel och salt cirka 15–20 minuter. Smaksätt med sirap och vanilj. Sprid tunt. Torka enligt **G vid 63 °C** tills gryn och äpple är helt torra; originalets 57 °C och 8–12 timmar är en orientering, inte en testad tid för anpassningen. Fördela pulvret och packa nötter separat."
      },
      {
        "rubrik": "På tur",
        "text": "börja med **2,4 dl vatten/person**. Sjud tills mjukt och späd till önskad gröt. Toppa med nötter."
      },
      {
        "rubrik": "Sverige",
        "text": "kokosmjölkspulver kan ersättas med mjölkpulver enligt källans förslag, men då blir rätten inte vegansk. Kontrollera även om kokosmjölkspulvret innehåller mjölk."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/dehydrated-apple-quinoa-porridge/"
      }
    ]
  },
  {
    "id": "recept-012",
    "nummer": 12,
    "slug": "quinoagrot-med-jordgubbar-och-kokos",
    "titel": "Quinoagröt med jordgubbar och kokos",
    "kategori": "frukost",
    "svarighet": "Lätt",
    "anvandning": "frukost",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "2 portioner",
        "text": "2,4 dl quinoa, 4,8 dl vatten, en nypa salt, 3 msk lönnsirap, 1 tsk kanel, 1 tsk vaniljextrakt och 227 g jordgubbar. Efter torkning: 0,6 dl kokosmjölkspulver och 0,6 dl kokosflakes."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "skölj och koka quinoa 20–25 minuter; tillsätt vatten vid behov. Smaksätt med sirap, kanel och vanilj. Sprid tunt och torka enligt **G vid 63 °C**. Skiva jordgubbar tunt och torka separat vid **57 °C**, tills torra. Originalet anger 6–8 timmar vid 57 °C för båda; spannmålsdelen är anpassad. Blanda med pulvret efter avsvalning, packa kokosflakes separat."
      },
      {
        "rubrik": "På tur",
        "text": "täck nätt med vatten och sjud cirka **10–15 minuter**, tills mjukt. Tillsätt mer vatten vid behov och toppa med kokos."
      },
      {
        "rubrik": "Sverige",
        "text": "svenska jordgubbar passar bra när de är i säsong. Kokosmjölkspulver är en specialingrediens. Kontrollera produktens allergenmärkning."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/dehydrated-strawberries-cream-quinoa-porridge/"
      }
    ]
  },
  {
    "id": "recept-013",
    "nummer": 13,
    "slug": "bulgurgryta-med-bonor-och-mork-choklad",
    "titel": "Bulgurgryta med bönor och mörk choklad",
    "kategori": "huvudratt",
    "svarighet": "Lätt",
    "anvandning": "huvudrätt",
    "borjaHar": true,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "1 portion",
        "text": "1 tsk olja, ½ rödlök, ½ röd paprika, 1,2 dl krossade tomater, 0,6 dl snabbkokt bulgur, 1 tsk mild mexikansk kryddblandning, 0,6 dl avrunna konserverade kidneybönor, salt, peppar. Separat: 10 g mörk choklad."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "mjuka löken i oljan. Tillsätt paprika, bulgur och kryddor. Häll i tomater och 1,2 dl vatten. Tillsätt bönorna; sjud cirka 6–7 minuter eller tills bulgurn är färdig. Torka tunt vid **63 °C enligt G**, till genomtorrt. Originalet anger 52 °C i 8–10 timmar; här är spannmålsmetoden anpassad."
      },
      {
        "rubrik": "På tur",
        "text": "tillsätt **2,4 dl vatten**, koka upp och sjud cirka 5 minuter. Låt stå varmt under lock ytterligare cirka 5 minuter. Rör ner chokladen."
      },
      {
        "rubrik": "Sverige",
        "text": "vanliga råvaror och enkel portionsskalning. Bulgur innehåller gluten; välj mjölkfri choklad om rätten ska vara vegansk."
      }
    ],
    "kallor": [
      {
        "namn": "Trail Recipes",
        "url": "https://trail.recipes/recipes/bulgur-chili/"
      }
    ]
  },
  {
    "id": "recept-014",
    "nummer": 14,
    "slug": "chana-masala-med-ris",
    "titel": "Chana masala med ris",
    "kategori": "huvudratt",
    "svarighet": "Lätt",
    "anvandning": "lätt huvudrätt",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "4 små källportioner",
        "text": "1 msk olja, 1 rödlök, 2 vitlöksklyftor, 1 tsk riven ingefära, 1 msk chana masala-krydda, 400 g krossade tomater, en burk kikärter 400 g, 1 msk socker, salt och en näve koriander. Dessutom **2,4 dl hemtorkat kokt basmatiris**, inte rått ris."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "mjuka lök, vitlök och ingefära; tillsätt kryddan. Sjud med tomater cirka 10 minuter, tillsätt avrunna kikärter och koriander och sjud ytterligare ett par minuter. Torka tunt vid **63 °C i 8–10 timmar**, till spröd gryta. Dela i fyra påsar med 0,6 dl ris enligt G i varje."
      },
      {
        "rubrik": "På tur",
        "text": "**2,4 dl vatten/portion**. Koka cirka 5 minuter och låt stå varmt 10 minuter, tills kikärterna mjuknat."
      },
      {
        "rubrik": "Sverige",
        "text": "chana masala-mix kan kräva asiatisk butik. Garam masala är ett föreslaget smakbyte, inte samma originalblandning. Portionerna kan behöva förstoras för vandringsmiddag."
      }
    ],
    "kallor": [
      {
        "namn": "Trail Recipes",
        "url": "https://trail.recipes/recipes/chana-masala/"
      }
    ]
  },
  {
    "id": "recept-015",
    "nummer": 15,
    "slug": "pumpasoppa-med-curry-och-kokos",
    "titel": "Pumpasoppa med curry och kokos",
    "kategori": "soppa",
    "svarighet": "Lätt–medel",
    "anvandning": "lätt lunch/tillbehör",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "Pulversats",
        "text": "1 kg skalad urkärnad pumpa, 1 stor lök, 2 vitlöksklyftor, 1 tsk ingefära, 2 tsk mild curry, ½ tsk spiskummin, 2,4 dl buljong, 1 msk olja och salt. Antal portioner beror på pulverutbytet."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "mjuka lök i oljan, tillsätt vitlök, ingefära och kryddor. Tillsätt pumpa/buljong och sjud tills mjukt. Mixa. Torka tunt vid **52 °C i 8–10 timmar**, tills sprött. Låt svalna och mal."
      },
      {
        "rubrik": "Per portionspåse",
        "text": "0,6 dl currypumpapulver och 3 msk kokosmjölkspulver. Packa 1 tsk pumpafrön separat."
      },
      {
        "rubrik": "På tur",
        "text": "vispa ner i **2,4 dl vatten**, koka upp och rör till slät soppa. Toppa med frön."
      },
      {
        "rubrik": "Sverige",
        "text": "använd exempelvis butternutpumpa. Komplettera med knäckebröd för lunch. Källans näringsvärden är motsägelsefulla och har inte återanvänts."
      }
    ],
    "kallor": [
      {
        "namn": "Recept",
        "url": "https://trail.recipes/recipes/curried-pumpkin-soup/"
      },
      {
        "namn": "Hemgjort currypumpapulver",
        "url": "https://trail.recipes/blog/dehydrating123-how-to-make-pumpkin-powder/"
      }
    ]
  },
  {
    "id": "recept-016",
    "nummer": 16,
    "slug": "zucchinisoppa-med-curry",
    "titel": "Zucchinisoppa med curry",
    "kategori": "soppa",
    "svarighet": "Lätt",
    "anvandning": "lätt lunch/tillbehör",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "1 portion",
        "text": "4 msk hemtorkat zucchinipulver, 2 msk kokosmjölkspulver och 1 tsk mild curry. Separat: en näve krutonger om önskat."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "tvätta zucchini och skiva 3–6 mm tunt. Torka utan överlappning vid **57 °C i 6–12 timmar**, till helt spröda skivor. Låt svalna och mal till pulver. Väg gärna färsk och torr mängd för framtida satser; källan ger inget fast utbyte som behövs för exakt fyra matskedar. Blanda portionspåsen."
      },
      {
        "rubrik": "På tur",
        "text": "tillsätt gradvis **2,4 dl kokhett vatten** under omrörning. Täck och låt dra cirka 5 minuter. Toppa med krutonger."
      },
      {
        "rubrik": "Sverige",
        "text": "mild curry är ett alternativ som källan själv anger till torkad grön currypasta. Enkel att göra när svensk zucchini finns i säsong. Soppan är ett komplement, inte ensam en rejäl vandringsmiddag."
      }
    ],
    "kallor": [
      {
        "namn": "Recept",
        "url": "https://trail.recipes/recipes/curried-zucchini-soup/"
      },
      {
        "namn": "Torkning och pulver",
        "url": "https://trail.recipes/blog/dehydrating123-how-to-dehydrate-zucchini-for-backpacking-meals/"
      }
    ]
  },
  {
    "id": "recept-017",
    "nummer": 17,
    "slug": "rostad-ratatouille",
    "titel": "Rostad ratatouille",
    "kategori": "tillbehor",
    "svarighet": "Lätt",
    "anvandning": "grönsakstillbehör",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "3 portioner tillbehör",
        "text": "1 aubergine, 2 små zucchini, 1 röd och 1 gul paprika, 1 rödlök, 2 vitlöksklyftor, 400 g krossade tomater, 1 msk olja, 1 msk herbes de Provence, salt och peppar."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "dela aubergine, zucchini och paprika i små bitar och rosta vid **200 °C cirka 30 minuter**. Mjuka lök/vitlök i oljan, tillsätt grönsaker, tomater och örter och sjud cirka 10 minuter. Torka tunt vid **63 °C i 10–12 timmar**, tills bitarna är helt torra och spröda."
      },
      {
        "rubrik": "På tur",
        "text": "tillsätt **2,4 dl vatten per portion** och sjud cirka 10 minuter, eller tills mjukt."
      },
      {
        "rubrik": "Sverige",
        "text": "lätta råvaror att hitta. Servera med couscous, pasta eller ris och en proteinkälla. Tillbehören tillkommer utöver receptet och kräver egen tillagning/vatten. Rätten har valts för smakvariation, inte som komplett middag på egen hand."
      }
    ],
    "kallor": [
      {
        "namn": "Trail Recipes",
        "url": "https://trail.recipes/recipes/roasted-ratatouille/"
      }
    ]
  },
  {
    "id": "recept-018",
    "nummer": 18,
    "slug": "mujadara-ris-och-linser-med-rostad-lok",
    "titel": "Mujadara, ris och linser med rostad lök",
    "kategori": "huvudratt",
    "svarighet": "Lätt",
    "anvandning": "lätt huvudrätt",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "1 källportion",
        "text": "**1,2 dl hemtorkat kokt ris**, **0,6 dl hemtorkade kokta linser**, 2 msk färdig rostad lök, ¼ tsk spiskummin, ¼ tsk malen koriander och grönsaksbuljong efter dosering."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "förbered ris enligt G och linser enligt B; rått ris eller okokta torra linser fungerar inte som direkt ersättning. Blanda när helt torrt och svalt. Packa gärna den rostade löken separat för krispigare topping, ett eget serveringsförslag."
      },
      {
        "rubrik": "På tur",
        "text": "börja med **2,4 dl vatten**. Koka upp och sjud cirka 10 minuter tills ris/linser är mjuka; späd efter behov. Tillsätt löken."
      },
      {
        "rubrik": "Sverige",
        "text": "bra satsrecept med få ingredienser. Rostad lök kan innehålla vetemjöl; använd inte automatiskt källans glutenfria etikett. Källans näringsvärden och viktangivelse är motsägelsefulla; provväg och portionsbedöm i stället. För en större middag, öka satsen eller lägg till bröd/olja."
      }
    ],
    "kallor": [
      {
        "namn": "Trail Recipes",
        "url": "https://trail.recipes/recipes/mujadara-lebanese-lentil-stew/"
      }
    ]
  },
  {
    "id": "recept-019",
    "nummer": 19,
    "slug": "pasta-bolognese-med-torr-sojafars",
    "titel": "Pasta bolognese med torr sojafärs",
    "kategori": "huvudratt",
    "svarighet": "Lätt",
    "anvandning": "huvudrätt",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "1 portion",
        "text": "cirka **60 g hemtorkad kokt pasta**, 0,8 dl torr sojafärs/TVP-granulat, 3 msk hemtorkat tomatsåspulver enligt T, 1 tsk italienska örter, salt. Eventuell ost packas separat."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "förbered pasta enligt P och tomatsåspulver enligt T. Blanda med färdig torr sojafärs och örter. Sojafärsen ska vara en produkt som lämpar sig för kokning enligt tiden nedan; kontrollera förpackningen."
      },
      {
        "rubrik": "På tur",
        "text": "tillsätt **3,6 dl vatten**. Koka upp och sjud cirka 5 minuter, låt sedan stå varmt 5–10 minuter. Följ längre tillagningstid om sojafärsens förpackning kräver det. Tillsätt eventuell ost."
      },
      {
        "rubrik": "Svensk anpassning",
        "text": "originalets frystorkade parmesan har utelämnats; vanlig ost kan tillsättas om den förvaras enligt märkning. Utan ost blir grundreceptet veganskt. Torr sojafärs är inte samma produkt som kyl- eller frysfärs. Innehåller soja och normalt gluten."
      }
    ],
    "kallor": [
      {
        "namn": "Trail Recipes",
        "url": "https://trail.recipes/recipes/tvp-bolognese/"
      }
    ]
  },
  {
    "id": "recept-020",
    "nummer": 20,
    "slug": "marockansk-farsgryta-med-ris-och-baljvaxter",
    "titel": "Marockansk färsgryta med ris och baljväxter",
    "kategori": "huvudratt",
    "svarighet": "Medel",
    "anvandning": "huvudrätt",
    "borjaHar": false,
    "brickor": [
      "kött"
    ],
    "avsnitt": [
      {
        "rubrik": "1 portion",
        "text": "**1,2 dl hemtorkad tillagad nötfärs**, 2 msk hemtorkade kokta kikärter, 1 msk hemtorkade kokta linser, 1 msk hemtorkat kokt ris, 1 msk hemtorkat tomatsåspulver, 1 msk rostad lök och 1 tsk marockansk kryddblandning."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "förbered färs enligt K, baljväxter enligt B, ris enligt G och såspulver enligt T. Mät först efter torkning. Blanda till en portionspåse; förvara i frys inför turen."
      },
      {
        "rubrik": "På tur",
        "text": "tillsätt **2,4 dl vatten**. Koka upp och sjud cirka 10 minuter. Låt stå varmt under lock ytterligare cirka 5 minuter, tills färs och kikärter är ordentligt mjuka."
      },
      {
        "rubrik": "Sverige",
        "text": "ett föreslaget kryddval är ras el hanout. Det är en ersättning för originalets ospecificerade marockanska blandning, så smaka av styrkan. Rostad lök kan innehålla gluten. Receptet kräver fler torkade basingredienser och passar bäst efter ett par enklare försök."
      }
    ],
    "kallor": [
      {
        "namn": "Trail Recipes",
        "url": "https://trail.recipes/recipes/moroccan-stew/"
      }
    ]
  },
  {
    "id": "recept-021",
    "nummer": 21,
    "slug": "enkel-rod-linsdal",
    "titel": "Enkel röd linsdal",
    "kategori": "huvudratt",
    "svarighet": "Lätt",
    "anvandning": "huvudrätt med tillbehör",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "2 portioner",
        "text": "200 g röda linser, 6 dl vatten, ¼ tsk gurkmeja, ½ tsk hel spiskummin, 1 schalottenlök, 2–3 små torkade chilifrukter efter styrka, salt. Originalet har 2 msk kokosolja/ghee."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "skölj linserna och koka med vatten/gurkmeja cirka 20–25 minuter. Mjuka finhackad lök och kryddor i lite vatten och rör ner i linserna. **Egen anpassning:** packa fettet separat i stället för att steka i det. Torka tunt vid **57 °C i cirka 6–8 timmar**, till helt spröda flak; smula."
      },
      {
        "rubrik": "På tur",
        "text": "täck med kokhett vatten och rör. Låt stå varmt tills mjukt; källan anger 1–2 minuter men kontrollera din sats. Tillsätt oljan och servera med ris eller tunnbröd."
      },
      {
        "rubrik": "Granskningsnotis",
        "text": "källans metod nämner asafoetida utan mängd i ingredienslistan. Den är därför utelämnad här, inte uppskattad. Använd mildare chili efter smak."
      }
    ],
    "kallor": [
      {
        "namn": "Eat Sleep Wild",
        "url": "https://eatsleepwild.com/dehydrated-red-lentil-dal/"
      }
    ]
  },
  {
    "id": "recept-022",
    "nummer": 22,
    "slug": "morots-och-linssoppa-med-spiskummin",
    "titel": "Morots- och linssoppa med spiskummin",
    "kategori": "soppa",
    "svarighet": "Lätt",
    "anvandning": "lunch",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "Sats för 2 större eller 4 små portioner",
        "text": "600 g morötter, 140 g röda linser, 1 liter grönsaksbuljong, ½ msk hel spiskummin och en nypa chiliflakes. 2 msk olja packas separat i denna anpassning."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "rosta kryddorna kort i torr kastrull. Tillsätt hackade morötter, linser och buljong. Sjud tills allt är mjukt, minst cirka 15 minuter; mixa slätt. Bred tunt och torka vid **55 °C i 4–6 timmar eller längre**, till helt torra smulor. Låt svalna och mal."
      },
      {
        "rubrik": "På tur",
        "text": "för tvåportionersindelningen, börja med **5 dl vatten/person**. Vispa ner pulvret och sjud 1–2 minuter tills slätt. För fyra mindre portioner används ungefär halva mängden vatten. Tillsätt oljan och komplettera med knäckebröd."
      },
      {
        "rubrik": "Granskningsnotis",
        "text": "källans brödtext anger fyra portioner men metoden två. Båda visas öppet här. Olja efter återfuktning är vår anpassning; originalet steker morötterna i oljan."
      }
    ],
    "kallor": [
      {
        "namn": "Eat Sleep Wild",
        "url": "https://eatsleepwild.com/dehydrated-red-lentil-carrot-cumin-soup/"
      }
    ]
  },
  {
    "id": "recept-023",
    "nummer": 23,
    "slug": "kryddigt-svampris-med-dill",
    "titel": "Kryddigt svampris med dill",
    "kategori": "huvudratt",
    "svarighet": "Medel",
    "anvandning": "huvudrätt/tillbehör",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "4 portioner",
        "text": "300 g basmatiris, 250 g färsk matsvamp plus 275 g champinjoner, 2 lökar, 6 vitlöksklyftor, 2 tsk hel spiskummin, 1 tsk fänkålsfrö, 1 lagerblad, 4 cm kanelstång, 1½ tsk garam masala, ½ tsk vardera svartpeppar och mild chili, 6 dl buljong, 25 g dill/koriander och eventuellt spenat."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "skiva svampen och tillaga med lök och kryddor i lite vatten. Tillsätt sköljt ris/buljong och koka under lock tills färdigt, cirka 20 minuter; låt efterdra. Ta bort hela lagerblad/kanelstång. Blanda i örter. Torka tunt vid **63 °C i 6–8 timmar eller längre**, till hårda korn."
      },
      {
        "rubrik": "På tur",
        "text": "täck med vatten, koka upp och låt stå varmt 5–10 minuter eller tills mjukt. Tillsätt separat olja efter önskemål."
      },
      {
        "rubrik": "Svensk anpassning",
        "text": "färsk svamp väljs framför källans alternativ med 80 g torkad vildsvamp. Originalets stora mängd smör/olja utelämnas under torkning, i linje med författarens torkråd. Välj säkert identifierad matsvamp, enklast köpt."
      }
    ],
    "kallor": [
      {
        "namn": "Eat Sleep Wild",
        "url": "https://eatsleepwild.com/wild-mushroom-pilau-dehydrated-recipe/"
      }
    ]
  },
  {
    "id": "recept-024",
    "nummer": 24,
    "slug": "linscurryflak-med-ris-och-gronsaker",
    "titel": "Linscurryflak med ris och grönsaker",
    "kategori": "huvudratt",
    "svarighet": "Medel",
    "anvandning": "huvudrätt",
    "borjaHar": false,
    "brickor": [
      "bra storkok"
    ],
    "avsnitt": [
      {
        "rubrik": "Stor sats curryflak",
        "text": "4,8 dl röda linser, 1 lök, 1 vitlöksklyfta, 1 msk riven ingefära, 3 msk mild curry, 1 msk hel spiskummin, 1,44 liter vatten, 2 tsk olja och 1 tsk salt."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "mjuka lök/vitlök/ingefära i oljan. Tillsätt kryddor och lite vatten; låt utveckla smak på svag värme. Häll i resten av vattnet och linserna. Sjud cirka 15 minuter tills mjuka, salta och mixa. Torka tunt vid **57 °C i 8–10 timmar**, till spröda flak."
      },
      {
        "rubrik": "1 portionspåse",
        "text": "0,6 dl curryflak, 1,2 dl hemtorkat ris enligt G och 1,2 dl hemtorkade grönsaker. Ett enkelt val är finfördelad morot/paprika som förvällts vid behov och torkats helt."
      },
      {
        "rubrik": "På tur",
        "text": "tillsätt **3 dl vatten**, låt dra 5 minuter, koka en minut och låt stå varmt cirka 10 minuter."
      },
      {
        "rubrik": "Sverige",
        "text": "vanliga ingredienser; satsen ger flera måltider. Risets torkning följer G, inte originalets lägre temperatur."
      }
    ],
    "kallor": [
      {
        "namn": "Backpacking Chef",
        "url": "https://www.backpackingchef.com/Trail_Bytes-trail-bytes-2017-03.html"
      }
    ]
  },
  {
    "id": "recept-025",
    "nummer": 25,
    "slug": "svensk-fruktsoppa-pa-hemtorkad-frukt",
    "titel": "Svensk fruktsoppa på hemtorkad frukt",
    "kategori": "snacks",
    "svarighet": "Lätt",
    "anvandning": "efterrätt/mellanmål",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "2 portioner",
        "text": "2 dl hemtorkade äppelbitar, alternativt äpple/päron, 6 msk socker, 5 dl vatten plus 1 dl kallt vatten, 1 msk potatismjöl."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "torka exempelvis äpple enligt receptet Torkade äppelringar. Mät sedan 2 dl torr frukt. Packa frukt och socker samt potatismjöl i en egen liten påse."
      },
      {
        "rubrik": "På tur",
        "text": "koka upp frukten i 5 dl vatten. Låt stå cirka 10 minuter. Tillsätt sockret. Rör ut potatismjölet i den separata decilitern kallt vatten och vispa ner. Värm till första uppkok och ta av värmen."
      },
      {
        "rubrik": "Sverige",
        "text": "svenska äpplen passar väl; inget specialpulver behövs. Originalet är sött. Mindre socker kan väljas efter smak, men då är det en egen smakjustering. Detta är efterrätt eller mellanmål, inte en komplett frukost utan tillägg."
      }
    ],
    "kallor": [
      {
        "namn": "Friluftsfrämjandet / Eric Tornblad",
        "url": "https://www.friluftsframjandet.se/lat-aventyret-borja/kunskap--guider/ata-ute/torka-din-egen-friluftsmat-en-kom-i-gang-guide/"
      }
    ]
  },
  {
    "id": "recept-026",
    "nummer": 26,
    "slug": "torkade-appelringar-med-valfri-kanel",
    "titel": "Torkade äppelringar med valfri kanel",
    "kategori": "snacks",
    "svarighet": "Mycket lätt",
    "anvandning": "snacks/frukosttopping",
    "borjaHar": true,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "Sats",
        "text": "10 äpplen, eller så många som ryms glest i torken. Eventuellt citronjuice och vatten i lika delar för att minska brunfärgning. Kanel efter smak är valfritt."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "tvätta, kärna ur och skiva jämnt, cirka 6 mm eller tunnare för krispigare resultat. Doppa eventuellt i citronvattnet 3–5 minuter, låt rinna av och badda torrt. Lägg i ett lager. Torka vid **57 °C i 6–12 timmar**. Kontrollera avsvalnade bitar: ingen fukt ska kunna pressas ur mitten. De kan vara sega eller spröda beroende på tjocklek."
      },
      {
        "rubrik": "På tur",
        "text": "ät direkt eller klipp ner i gröt. Ingen uppvärmning krävs."
      },
      {
        "rubrik": "Sverige",
        "text": "ett av de enklaste projekten med svenska äpplen. Kanelalternativet finns i källans text. Följ fuktutjämningen i Kom igång inför längre förvaring. Källan anger tio snackportioner, men verkligt utbyte varierar med äppelstorlek och torkgrad."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/dehydrating-apples/"
      }
    ]
  },
  {
    "id": "recept-027",
    "nummer": 27,
    "slug": "torkade-bananskivor",
    "titel": "Torkade bananskivor",
    "kategori": "snacks",
    "svarighet": "Mycket lätt",
    "anvandning": "snacks/frukosttopping",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "Sats",
        "text": "cirka 1,36 kg bananer enligt källan, eller valfri mängd som ryms i ett glest lager. Använd mogna men fortfarande fasta bananer för lättskurna skivor."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "skala och skiva cirka 6 mm jämnt. Lägg utan överlappning på torkgaller med lämpligt underlägg. Torka vid **57 °C i 6–12 timmar**. Kontrollera efter avsvalning: skivorna får vara sega men ska sakna fuktig kärna och inte släppa vätska när de bryts/pressas."
      },
      {
        "rubrik": "På tur",
        "text": "ät direkt eller tillsätt i gröt och müsli. Ingen särskild vattenmängd behövs för snacks."
      },
      {
        "rubrik": "Sverige",
        "text": "vanliga bananer räcker, inget tillsatt fett behövs. Hemmatorkade bananer blir ofta sega; förvänta dig inte samma konsistens som friterade bananchips. Följ fuktutjämningen i Kom igång. Källans löptext innehåller en felaktig Fahrenheit/Celsius-omräkning; här följs receptkortets korrekta **135 °F ≈ 57 °C**."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/dehydrating-bananas/"
      }
    ]
  },
  {
    "id": "recept-028",
    "nummer": 28,
    "slug": "appelremmar-med-ingefara",
    "titel": "Äppelremmar med ingefära",
    "kategori": "snacks",
    "svarighet": "Lätt",
    "anvandning": "snacks",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "Sats för cirka 18 små remmar",
        "text": "9,6 dl skalat, urkärnat och hackat äpple, saft av ½ citron, 1 msk finhackad ingefära, 1,2 dl vatten och 2 msk lönnsirap."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "sjud äpple, citron, ingefära och vatten cirka 10 minuter tills mjukt. Mixa slätt med sirapen. Bred ut cirka 3 mm tunt på silikonunderlägg avsett för mat/torkning; låt kanterna vara något tjockare. Torka vid **57 °C, ungefär 3–6 timmar**, men fortsätt tills mitten också är torr och remsan kan lossas hel utan fuktiga partier."
      },
      {
        "rubrik": "Packa/på tur",
        "text": "låt svalna, rulla med bakplåtspapper emellan och klipp till små remmar. Ät direkt. Packa tätt så att de inte tar upp fukt."
      },
      {
        "rubrik": "Sverige",
        "text": "bra användning för svenska äpplen. Ett lätt sätt att lära sig torka puré. Antalet remmar är ett skärmått, inte antal fullvärdiga mellanmål."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/apple-ginger-fruit-leather/"
      }
    ]
  },
  {
    "id": "recept-029",
    "nummer": 29,
    "slug": "fruktremmar-med-mango-och-jordgubbar",
    "titel": "Fruktremmar med mango och jordgubbar",
    "kategori": "snacks",
    "svarighet": "Lätt",
    "anvandning": "snacks",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "Sats för cirka 12 små portioner",
        "text": "454 g mango, 227 g jordgubbar, saft av ½ citron, eventuellt 1 msk socker och mycket lite kokosolja till underlaget om det behövs."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "tina fryst frukt om sådan används. Mixa mango med citron och eventuellt socker; mixa jordgubbar separat. Bred mangopuré cirka 3 mm tunt på lämpligt torkunderlägg. Klicka över jordgubbspuré och dra ett mönster med gaffel. Torka vid **57 °C i cirka 6–10 timmar**, tills även mitten är torr men remsan fortfarande böjlig."
      },
      {
        "rubrik": "Packa/på tur",
        "text": "låt svalna, skär och rulla med papper emellan. Ät direkt. Källan beskriver främst kortare turer och rekommenderar kylförvaring om remmarna sparas längre än en vecka."
      },
      {
        "rubrik": "Sverige",
        "text": "fryst mango gör inköpet enkelt; jordgubbar kan vara färska eller frysta. Följ alltid förpackningens eventuella upphettningsråd för fryst frukt/bär innan purén torkas."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/mango-strawberry-fruit-leathers/"
      }
    ]
  },
  {
    "id": "recept-030",
    "nummer": 30,
    "slug": "paprikahummus-till-knackebrod-eller-tortilla",
    "titel": "Paprikahummus till knäckebröd eller tortilla",
    "kategori": "tillbehor",
    "svarighet": "Lätt",
    "anvandning": "lunchpålägg/mellanmål",
    "borjaHar": false,
    "brickor": [],
    "avsnitt": [
      {
        "rubrik": "3 portioner pålägg",
        "text": "en burk kikärter 400 g, 100 g rostad paprika i vattenlag eller egenrostad, 3 msk sesamfrön, 2 vitlöksklyftor, cirka 4 tsk citronsaft, salt och cirka 1,2 dl vatten. Separat: 1 msk olivolja per person samt knäckebröd/tortilla."
      },
      {
        "rubrik": "Hemma/torka",
        "text": "häll av kikärterna. Mixa sesamfröna fint och mixa sedan med resten till slät hummus. Bred tunt på täta underlägg. Torka vid **52 °C i 4–6 timmar eller längre**, tills helt torr och pulverlik när den smulas. Låt svalna och mal om önskat."
      },
      {
        "rubrik": "På tur",
        "text": "rör ner dricksvatten lite i taget till önskad konsistens. Tillsätt olivolja och ät direkt med bröd. Ingen kokning krävs i källans metod."
      },
      {
        "rubrik": "Sverige",
        "text": "undvik paprika i olja. Sesam är allergen; brödet kan innehålla gluten. Hummusen innehåller fett från fröna, så förvara gärna fryst inför senare turer. Det är pålägg, inte en hel lunch utan bröd/tillbehör."
      }
    ],
    "kallor": [
      {
        "namn": "Fresh Off The Grid",
        "url": "https://www.freshoffthegrid.com/dehydrated-roasted-pepper-hummus/"
      }
    ]
  }
]

export const TORKGUIDER: readonly Torkguide[] = [
  {
    "id": "ravara-apple",
    "slug": "appelringar",
    "titel": "Äppelringar",
    "kategori": "frukt",
    "temperatur": 57,
    "timmarMin": 6,
    "timmarMax": 12,
    "forbered": "Tvätta, kärna ur och skiva cirka 6 mm. Lite kanel är ett valfritt smaktillägg. Lägg utan överlapp.",
    "torrhet": "Böjliga till spröda, utan fukt när en sval bit rivs itu.",
    "paTur": "Ät direkt, eller lägg i gröt och fruktsoppa.",
    "notis": null,
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrating-apples/"
      }
    ],
    "recept": "recept-026"
  },
  {
    "id": "ravara-banana",
    "slug": "bananskivor",
    "titel": "Bananskivor",
    "kategori": "frukt",
    "temperatur": 57,
    "timmarMin": 6,
    "timmarMax": 12,
    "forbered": "Skala och skiva cirka 6 mm. Sprid i ett lager.",
    "torrhet": "Torra och läderartade eller hårda; ingen fuktig kärna.",
    "paTur": "Ät direkt eller använd i gröt. Hemtorkade skivor blir inte som friterade bananchips.",
    "notis": null,
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrating-bananas/"
      }
    ],
    "recept": "recept-027"
  },
  {
    "id": "ravara-mango",
    "slug": "mango",
    "titel": "Mango",
    "kategori": "frukt",
    "temperatur": 57,
    "timmarMin": 6,
    "timmarMax": 12,
    "forbered": "Skala, ta bort stenen och skär i cirka 6 mm tunna skivor. Frysta stora bitar behöver delas tunt.",
    "torrhet": "Böjlig, läderartad och torr också inuti.",
    "paTur": "Ät direkt som sött snacks, eller skär smått till gröt.",
    "notis": "Fryst frukt: följ förpackningens upphettningsråd; sådan tillagning kan ändra konsistensen.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dried-mango/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-strawberry",
    "slug": "jordgubbar",
    "titel": "Jordgubbar",
    "kategori": "frukt",
    "temperatur": 57,
    "timmarMin": 6,
    "timmarMax": 12,
    "forbered": "Skölj, snoppa och skiva jämnt, cirka 6 mm. Sprid glest på torkunderlägg.",
    "torrhet": "Läderartade till krispiga, utan fukt i de tjockaste bitarna.",
    "paTur": "Ät direkt eller smula över gröt.",
    "notis": "Guiden avser färska bär. För frysta bär gäller även förpackningens tillagningsråd.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dried-strawberries/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-pineapple",
    "slug": "ananas",
    "titel": "Ananas",
    "kategori": "frukt",
    "temperatur": 57,
    "timmarMin": 8,
    "timmarMax": 16,
    "forbered": "Skala och ta bort den hårda stocken. Skär bitar högst cirka 12 mm tjocka. Konserverad ananas ska rinna av väl.",
    "torrhet": "Torr och böjlig; ingen vätska när en sval bit kläms eller delas.",
    "paTur": "Ät direkt eller blanda med separat packade nötter.",
    "notis": "Källans brödtext har en felaktig Celsiusomräkning: 135 °F motsvarar cirka 57 °C, inte 52 °C.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrating-pineapple/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-carrot",
    "slug": "morot",
    "titel": "Morot",
    "kategori": "gronsak",
    "temperatur": 52,
    "timmarMin": 8,
    "timmarMax": 12,
    "forbered": "Skala och skär i cirka 3 mm skivor eller riv grovt. Förväll i kokande vatten 2 minuter enligt denna receptkälla, kyl snabbt i kallt vatten och låt rinna av.",
    "torrhet": "Hårda och spröda bitar utan mjuk kärna.",
    "paTur": "Låt koka med i soppa eller gryta tills mjuk.",
    "notis": "Förvällningen är ett valt steg här; källan beskriver den som valfri. Andra guider anger andra förvällningstider.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrating-carrots/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-pepper",
    "slug": "paprika",
    "titel": "Paprika",
    "kategori": "gronsak",
    "temperatur": 52,
    "timmarMin": 8,
    "timmarMax": 12,
    "forbered": "Tvätta, ta bort kärnhus och skär i små bitar eller tunna strimlor. Förväll gärna 4 minuter, kyl snabbt och låt rinna av.",
    "torrhet": "Hård och torr efter avsvalning.",
    "paTur": "Återfukta i hett vatten cirka 15–20 minuter eller sjud i rätten.",
    "notis": null,
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrating-bell-peppers/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-zucchini",
    "slug": "zucchini",
    "titel": "Zucchini",
    "kategori": "gronsak",
    "temperatur": 57,
    "timmarMin": 6,
    "timmarMax": 12,
    "forbered": "Tvätta och skär jämna skivor, cirka 3–6 mm. Sprid i ett lager.",
    "torrhet": "Krispiga, genomtorra skivor.",
    "paTur": "Använd i pasta, risotto eller soppa och sjud tills mjuk.",
    "notis": null,
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://trail.recipes/blog/dehydrating123-how-to-dehydrate-zucchini-for-backpacking-meals/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-mushroom",
    "slug": "champinjoner",
    "titel": "Champinjoner",
    "kategori": "gronsak",
    "temperatur": 60,
    "timmarMin": 8,
    "timmarMax": 12,
    "forbered": "Rengör, ta bort sega delar och skiva cirka 6 mm. Doppa enligt källan 10 minuter i vatten med cirka 1 tsk citronsyra per 0,95 liter; låt rinna av.",
    "torrhet": "Torra, läderartade bitar utan fukt inuti.",
    "paTur": "Återfukta och tillaga i soppa eller risotto.",
    "notis": "Välj köpta matsvampar för ett enkelt förstaförsök. Torkning oskadliggör inte giftiga svampar. 60 °C är guidens allmänna torknivå.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://extension.colostate.edu/resource/drying-vegetables/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-leek",
    "slug": "purjolok",
    "titel": "Purjolök",
    "kategori": "gronsak",
    "temperatur": 50,
    "timmarMin": null,
    "timmarMax": null,
    "forbered": "Skölj noggrant mellan bladen. Skär tunna ringar, separera dem och sprid glest.",
    "torrhet": "Helt torra, spröda bitar; kontrollera även tjockare delar.",
    "paTur": "Sjud i potatissoppa, gryta eller nudelrätt.",
    "notis": "Källan anger 50 °C men ingen torktid. Torka tills bitarna klarar torrhetskontrollen.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.utsidan.se/cldoc/torkad-purjolok.htm"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-potato",
    "slug": "potatis",
    "titel": "Potatis",
    "kategori": "gronsak",
    "temperatur": 50,
    "timmarMin": 10,
    "timmarMax": 10,
    "forbered": "Skala och skär mycket tunna jämna skivor. Förväll i kokande vatten minst 1 minut, längre för tjockare bitar enligt källan. Kyl snabbt och låt rinna av.",
    "torrhet": "Helt hårda, genomtorra skivor utan mjuk mitt.",
    "paTur": "Blöt upp i hett vatten och koka sedan färdigt i soppa eller gryta.",
    "notis": "Cirka 10 timmar är källans riktvärde, ingen färdighetsgaranti. Receptet är en användarpublicerad erfarenhetskälla; inte myndighetsvaliderat. Förvällning innebär inte att potatisen är färdigkokt.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.utsidan.se/cldoc/torkad-potatis.htm"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-sweet-potato",
    "slug": "sotpotatis",
    "titel": "Sötpotatis",
    "kategori": "gronsak",
    "temperatur": 52,
    "timmarMin": 8,
    "timmarMax": 12,
    "forbered": "Skala och skär små tärningar, mindre än cirka 12 mm. Förbaka utan extra olja vid cirka 177 °C omkring 20 minuter tills nästan mjuk. Sprid sedan glest.",
    "torrhet": "Hårda och spröda tärningar utan mjuk kärna.",
    "paTur": "Sjud cirka 10–15 minuter och kontrollera mjukheten; passar i jordnötsgryta och curry.",
    "notis": null,
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrating-sweet-potatoes/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-spinach",
    "slug": "spenat",
    "titel": "Spenat",
    "kategori": "gronsak",
    "temperatur": 52,
    "timmarMin": 4,
    "timmarMax": 8,
    "forbered": "Skölj färska blad ordentligt, ta bort dåliga blad och grova stjälkar. Torka av sköljvatten och sprid tunt på finmaskigt underlägg.",
    "torrhet": "Krispiga blad som lätt smulas.",
    "paTur": "Smula ner i en varm soppa, sås eller gryta.",
    "notis": "Denna receptkälla använder oförvällda blad. Det finns även universitetsguider som föreskriver förvällning. Detta är källans metod, inte en enhetlig myndighetsstandard.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrating-spinach/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-peas",
    "slug": "grona-arter",
    "titel": "Gröna ärter",
    "kategori": "gronsak",
    "temperatur": 52,
    "timmarMin": 6,
    "timmarMax": 10,
    "forbered": "Använd frysta ärter och följ förpackningens eventuella tillagningsråd först. Sprid avrunna ärter i ett lager på finmaskigt underlägg.",
    "torrhet": "Hårda ärter som inte ger efter vid tryck.",
    "paTur": "Återfukta i hett vatten cirka 15–20 minuter eller sjud i maten tills mjuka.",
    "notis": "Källans brödtext anger 6–10 timmar, receptkortet 4–10. Här används brödtextens intervall. Torkade ärter är här en matbas, inte ett färdigt snacks.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrating-peas/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-rice",
    "slug": "fardigkokt-ris",
    "titel": "Färdigkokt ris",
    "kategori": "bas",
    "temperatur": 63,
    "timmarMin": 6,
    "timmarMax": 12,
    "forbered": "Koka utan tillsatt fett. Sprid tunt och påbörja torkning utan onödig väntan.",
    "torrhet": "Hårda, separerbara korn.",
    "paTur": "Sjud med vatten tills mjukt.",
    "notis": "Följ alltid den gemensamma säkerhetsguiden för ris. Varken torkning eller uppkok gör felaktigt förvarat ris säkert.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrating-food/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-pasta",
    "slug": "fardigkokt-pasta",
    "titel": "Färdigkokt pasta",
    "kategori": "bas",
    "temperatur": 57,
    "timmarMin": 6,
    "timmarMax": 12,
    "forbered": "Koka, häll av och sprid tunt.",
    "torrhet": "Spröd och helt torr.",
    "paTur": "Återfukta i varm rätt tills mjuk.",
    "notis": "Detta avser redan kokt pasta. Vanlig torr pasta från affären behöver inte torkas, men måste kokas färdig på turen.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrating-food/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-chickpea",
    "slug": "kikarter",
    "titel": "Kikärter",
    "kategori": "bas",
    "temperatur": 52,
    "timmarMin": 6,
    "timmarMax": 12,
    "forbered": "Använd avrunna konserver eller helt färdigkokta kikärter. Dela stora ärter och sprid tunt.",
    "torrhet": "Hårda och genomtorra.",
    "paTur": "Sjud i gryta tills mjuka.",
    "notis": "Avser matlagning, inte rostade kikärtssnacks. Hela ärter kan behöva längre återfuktning; provkoka en portion hemma.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrating-food/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-lentil",
    "slug": "grona-eller-bruna-linser",
    "titel": "Gröna eller bruna linser",
    "kategori": "bas",
    "temperatur": 52,
    "timmarMin": 6,
    "timmarMax": 12,
    "forbered": "Använd helt färdigkokta linser. Låt rinna av och sprid tunt.",
    "torrhet": "Hårda och torra.",
    "paTur": "Sjud i soppa eller gryta.",
    "notis": "Röda linser som kokat sönder passar bättre som en del av dal eller soppa. Råa torra linser är en annan produkt.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrating-food/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-mince",
    "slug": "mager-notfars",
    "titel": "Mager nötfärs",
    "kategori": "protein",
    "temperatur": 63,
    "timmarMin": 6,
    "timmarMax": 12,
    "forbered": "Finfördela och genomstek mager nötfärs till minst 71 °C kärntemperatur. Avlägsna överflödigt fett. Sprid tunt.",
    "torrhet": "Hårda, helt torra smulor.",
    "paTur": "Sjud i rätten tills mjuk.",
    "notis": "Mer krävande än frukt och grönsaker. Förvara portionsförpackat i frys inför senare turer. Torkens lufttemperatur ersätter inte uppmätt kärntemperatur.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrating-food/"
      }
    ],
    "recept": null
  },
  {
    "id": "ravara-tomato",
    "slug": "tomater",
    "titel": "Tomater",
    "kategori": "gronsak",
    "temperatur": 57,
    "timmarMin": 6,
    "timmarMax": 12,
    "forbered": "Skölj och skär stora tomater i högst cirka 6 mm skivor; dela små tomater. Lägg eventuellt skinn nedåt.",
    "torrhet": "Torra och hårda efter avsvalning, utan fukt i tjocka delar.",
    "paTur": "Återfukta i hett vatten cirka 10–15 minuter, eller sjud i sås och soppa.",
    "notis": "Källans brödtext anger 52 °C/8–14 timmar men receptkortet 57 °C/6–12. Här följs receptkortet. Förvara dessa torra; guiden avser inte tomater inlagda i olja.",
    "kallor": [
      {
        "namn": "Metodkälla",
        "url": "https://www.freshoffthegrid.com/dehydrated-tomatoes/"
      }
    ],
    "recept": null
  }
]

export const KOM_IGANG: readonly Torkavsnitt[] = [
  {
    "id": "grundmetod",
    "rubrik": "Grundmetod",
    "stycken": [
      "Arbeta med rena händer, redskap och torkbrickor. Skär jämnstora små bitar och sprid tunt utan att blockera luftflödet. Tillaga råvaror som behöver kokas innan de torkas. Håll nere mängden fett under torkningen och packa extra olja, nötter och ost separat. Börja med vegetabiliska rätter; kött kräver noggrannare temperaturkontroll.",
      "Arbeta rent, skär jämnt och lägg i ett tunt lager med luft mellan bitarna. Låt svalna helt före tät packning. Märk innehåll, datum och förbehandling."
    ]
  },
  {
    "id": "utrustning",
    "rubrik": "Utrustning",
    "stycken": [
      "Alla torktider är ungefärliga **tider i mattork**, inte löften om färdig eller säker mat efter ett visst antal timmar. Följ torrhetskontrollen. Använd temperaturreglerad mattork; ugn behöver kontrollerad temperatur och fungerande luftväxling enligt ugnstillverkarens anvisningar.",
      "Alla temperaturer avser luften i en temperaturreglerad mattork. Tider är ungefärliga; maskin, luftfuktighet, mängd och bitarnas tjocklek påverkar. Kontrollera flera avsvalnade bitar, särskilt de tjockaste. Varken känselkontroll eller torktid är en laboratoriemätning av säker hållbarhet.",
      "Guiderna använder ibland olika metodkällor och därför olika temperaturer. Blanda inte allt på en bricka och välj ett medelvärde. Kör separata omgångar när metoderna skiljer sig. Ugn kräver kontrollerad låg temperatur och luftväxling enligt tillverkaren; anta inte att mattorkstider gäller i ugn."
    ]
  },
  {
    "id": "sakerhet",
    "rubrik": "Säkerhet: tillagad mat och kött",
    "stycken": [
      "**Tillagad mat får inte stå och vänta ljummen i timmar.** Gå vidare till torkningen utan onödig väntan. Om maten ska vänta: kyl snabbt och förvara kallt. Livsmedelsverket anger snabb nedkylning, högst två timmar, och cirka 4 °C för ris, pasta och potatismos. Torkning eller senare uppkok förstör inte säkert redan bildat Bacillus cereus-toxin. [Livsmedelsverkets svar](https://fragor.livsmedelsverket.se/org/livsmedelsverket/d/nedkylning-av-ris-pasta-och-potatismos/) · [Bacillus cereus](https://www.livsmedelsverket.se/livsmedel-och-innehall/bakterier-virus-parasiter-och-mogelsvampar1/bakterier/bacillus-cereus/).",
      "**Kött:** tillaga nötfärs till minst cirka 71 °C i maten före torkning; kyckling kräver cirka 74 °C. Torkens inställda lufttemperatur är inte samma sak som köttets kärntemperatur. USDA beskriver vikten av upphettning före torkning. [USDA](https://ask.fsis.usda.gov/article/How-do-I-dry-jerky)."
    ]
  },
  {
    "id": "torrhet",
    "rubrik": "Torrhetskontroll och förvaring",
    "stycken": [
      "**Efter torkningen:** kontrollera flera bitar, även de tjockaste, efter avsvalning. Grytor, grönsaker och spannmål ska vara genomtorra, hårda eller spröda, utan fuktig kärna. Frukt får vara böjlig men inte fuktig. Låt svalna helt före tät packning. Förvara svalt, torrt och mörkt; frys portionsförpackade blandrätter om de ska sparas inför senare turer. Låt en fryst påse bli rumstempererad innan den öppnas för att minska kondensrisken. Någon gemensam garanterad hållbarhet för alla hemtorkade maträtter går inte att ange.",
      "För fruktbitar som ska lagras: låt svalna, lägg löst i en genomskinlig sluten burk i 7–10 dagar och skaka/kontrollera dagligen. Kondens utan tecken på förskämning betyder att mer torkning behövs. Mögel betyder att maten ska kastas. [NCHFP: förpackning, lagring och fuktutjämning](https://nchfp.uga.edu/how/dry/recipes/packaging-and-storing-dried-foods/)."
    ]
  },
  {
    "id": "pa-tur",
    "rubrik": "Upphettning och återfuktning på tur",
    "stycken": [
      "Återfukta med dricksvatten nära måltiden och ät direkt. Bär inte uppblötta rätter i rumstemperatur hela dagen. Använd kastrull eller värmetålig matkåsa för hett vatten."
    ]
  },
  {
    "id": "matt",
    "rubrik": "Mått och mängder",
    "punkter": [
      "Mängder avser hela satsen och angivet portionsantal. När en ingrediens anges som **hemtorkad** mäts den efter torkning; rått torrt ris eller råa torkade baljväxter är inte samma sak.",
      "Amerikanska mått är omräknade: 1 cup ≈ 2,4 dl, 1 tablespoon = 1 msk, 1 teaspoon = 1 tsk, 1 oz ≈ 28 g och 1 lb ≈ 454 g. Temperaturer är avrundade till hela °C.",
      "**Svensk anpassning:** amerikanska tomatburkar på cirka 400–425 g har avrundats till 400 g. För baljväxter avser ”en burk 400 g” förpackningens nettovikt före avrinning, om inte annat anges. Använd innehållet avrunnet. Det ger mindre avvikelser från originalen och kan påverka vattenbehovet.",
      "Amerikansk chili powder är ofta en mild kryddblandning. Byt inte matskedsmängder rakt av mot rent svenskt chilipulver eller cayenne. Här används mild chilikryddblandning med paprika/spiskummin; hetta tillsätts försiktigt.",
      "Kokosmjölkspulver, näringsjäst och torr sojafärs kan kräva en större butik eller nätbutik. De är markerade där de förekommer. Köp pulver färdigt; torka inte vanlig mjölk eller ägg som ett nybörjarprojekt.",
      "Vattenmängder ute är startmängder. Torkgrad, pastasort och portionsstorlek påverkar behovet. Prova en portion hemma och skriv den fungerande mängden på påsen.",
      "Mängden i råvaruguiderna kan anpassas till torkens kapacitet. Väg gärna den egna satsen före och efter torkning, så vet du vad en portion väger."
    ]
  },
  {
    "id": "basingredienser",
    "rubrik": "Basingredienser som några recept bygger på",
    "stycken": [
      "**G, hemtorkat ris/quinoa:** koka i vatten eller fettfattig buljong. Sprid tunt och torka vid **63 °C, ungefär 6–12 timmar**, till hårda, separerbara korn. Detta följer Fresh Off The Grids generella spannmålsguide. Några äldre recept på samma webbplats anger 52–57 °C; här används 63 °C för spannmålsdelen, uttryckligen som metodanpassning. Deras äldre tider är därför bara orienterande.",
      "**B, hemtorkade bönor/linser:** använd avrunna konserver eller helt färdigkokta baljväxter. Sprid i ett lager och torka vid **52 °C, cirka 6–12 timmar**, tills de är hårda. Dela gärna stora kikärter för jämnare återfuktning.",
      "**P, hemtorkad pasta:** koka, häll av och sprid tunt. Torka vid **57 °C, cirka 6–12 timmar**, tills pastan är spröd. Vanlig okokt pasta fungerar i flera recept men måste då kokas färdigt ute.",
      "**K, hemtorkad nötfärs:** använd mycket mager färs, finfördela och tillaga till minst 71 °C. Torka bort överflödigt fett. Torka vid **63 °C, cirka 6–12 timmar**, till helt hårda smulor. Förvara portionsförpackat i frys inför turen.",
      "Källa till G/B/P/K: [Fresh Off The Grid, torkguide](https://www.freshoffthegrid.com/dehydrating-food/). K ska läsas tillsammans med USDA-rådet ovan.",
      "**T, tomatsåspulver:** koka 800 g krossade tomater, en hackad lök, två vitlöksklyftor, 1 tsk olja samt 1 tsk vardera basilika, oregano och mejram; smaka av med salt, peppar och eventuellt socker. Mjuka först löken, tillsätt resten och sjud cirka 10 minuter. Bred cirka 3 mm tunt. Torka vid **52 °C, 8–10 timmar eller längre**, till spröd sås. Låt svalna och mal. [Trail Recipes, tomatsåspulver](https://trail.recipes/blog/dehydrating123-how-to-make-tomato-sauce-powder/)."
    ]
  },
  {
    "id": "borja",
    "rubrik": "Enkel start",
    "stycken": [
      "**Enkel start:** äpple, banan och mango för direktätna snacks; paprika och purjolök som matbaser. Detta är en redaktionell rekommendation. Svamp, potatis, ris, pasta, linser och kikärter är här ingredienser att tillaga/återfukta i mat, inte chips. Ett sött fruktsnacks ersätter inte automatiskt en full måltid."
    ]
  }
]
