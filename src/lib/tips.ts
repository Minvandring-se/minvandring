// Tipsen under Matplanering: korta guider om mat på tur. Innehållet ligger här, inte i databasen.
//
// Bara allmänna råd, inga påståenden om hälsa eller medicin. Varje siffra bygger på en källa som står i guiden.
// Siffror som är omräknade från källan (till exempel MJ till kcal) är avrundade och står som ungefärliga.

export interface Kalla {
  namn: string
  url: string
}

export interface Avsnitt {
  rubrik: string
  stycken: readonly string[]
  punkter?: readonly string[]
}

export interface Guide {
  nyckel: string
  rubrik: string
  ingress: string
  avsnitt: readonly Avsnitt[]
  kallor: readonly Kalla[]
}

const NNR: Kalla = {
  namn: 'Nordiska näringsrekommendationerna 2023, kapitlet om energi (på engelska)',
  url: 'https://pub.norden.org/nord2023-003/files/691f2f1cba022_energy.pdf',
}
const KYLA: Kalla = {
  namn: 'National Academies: Nutritional Needs in Cold and in High-Altitude Environments, kapitel 8 (på engelska)',
  url: 'https://www.nationalacademies.org/read/5197/chapter/8',
}

export const GUIDER: readonly Guide[] = [
  {
    nyckel: 'energi',
    rubrik: 'Hur mycket energi behöver man?',
    ingress: 'En dag med ryggsäck kräver mycket mer energi än en vanlig dag hemma, och ännu mer i kyla.',
    avsnitt: [
      {
        rubrik: 'En vanlig dag',
        stycken: [
          'De nordiska näringsrekommendationerna räknar med ungefär 2 150 kcal per dag för kvinnor och 2 700 kcal för män vid en måttligt aktiv vardag. Behovet skiljer sig mycket mellan personer.',
        ],
      },
      {
        rubrik: 'En dag med ryggsäck',
        stycken: [
          'I studier av vandring och jakt i vildmark har man mätt att deltagarna gjorde av med ungefär 4 300 till 5 000 kcal per dag. Samtidigt åt de bara omkring hälften av det.',
          'Det är vanligt att äta mindre än man gör av med på tur. Planera hellre lite för mycket mat än för lite, och ha något lätt att äta mellan måltiderna.',
        ],
      },
      {
        rubrik: 'I kyla',
        stycken: [
          'Amerikanska försvaret räknar med minst 4 500 kcal per dag för den som arbetar i kyla, mot omkring 3 200 kcal i tempererat klimat. Tunga kläder och kängor och att ta sig fram i snö gör att man gör av med mer.',
        ],
      },
    ],
    kallor: [
      NNR,
      { namn: 'Int J Sports Med 2008: energiförbrukning under en vandring på 160 km (på engelska)', url: 'https://pubmed.ncbi.nlm.nih.gov/18418809/' },
      { namn: 'Energiförbrukning under jakt i Alaskas vildmark (på engelska)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6236107' },
      KYLA,
    ],
  },
  {
    nyckel: 'vatten-och-bransle',
    rubrik: 'Vatten och bränsle till maten',
    ingress: 'Torkad mat är lätt att bära, men den behöver vatten och oftast bränsle för att bli mat.',
    avsnitt: [
      {
        rubrik: 'Att dricka',
        stycken: [
          'Räkna med ungefär 2 liter vätska per person och dygn, varav omkring en liter kommer från maten. Mer när det är varmt och när ni går långt. Ett allmänt råd är att dricka när man blir törstig.',
        ],
      },
      {
        rubrik: 'Vatten till påsarna',
        stycken: [
          'Hur mycket vatten en påse behöver står på påsen, och det skiljer sig mellan rätterna. En middagspåse från Real Turmat tar till exempel 3 dl. Räkna med det vattnet när ni planerar var ni fyller på.',
        ],
      },
      {
        rubrik: 'Bränsle',
        stycken: [
          'Primus riktlinje för en person med eget kök är en patron på 100 g för en dag, 230 g för en helg och 2 × 230 g för en vecka på sommaren. På vintern, då man också smälter snö, blir det 230 g, 450 g och 450 g + 230 g. Två personer med ett kök behöver enligt Primus omkring 50 % mer på vintern. MSR mätte att ett av deras kök kokar ungefär 2 liter vatten på 28 g gas, och skriver att kyla, snö och vind kan kräva 3 till 4 gånger så mycket.',
        ],
        punkter: ['Lock på kastrullen och lä för vinden gör att vattnet kokar fortare.', 'En kastrull med värmeväxlare sparar enligt Primus omkring hälften av bränslet.', 'Ta med en extra patron när det är kallt.'],
      },
    ],
    kallor: [
      { namn: 'Karolinska institutet: Sluta klunka, du dricker inte för lite vatten', url: 'https://ki.se/forskning/popularvetenskap-och-dialog/popularvetenskapliga-teman/tema-mat-och-halsa/sluta-klunka-du-dricker-inte-for-lite-vatten' },
      { namn: 'Real Turmat: Chili Stew (på norska)', url: 'https://realoutdoorfood.com/?p=186' },
      { namn: 'Primus: hur mycket gas behövs på turen? (på engelska)', url: 'https://primus.gorgias.help/en-GB/how-much-gas-do-i-need-on-my-trip-1107923' },
      { namn: 'MSR: hur mycket bränsle ska man bära? (på engelska)', url: 'https://www.cascadedesigns.com/blog/stoves-101-how-much-fuel-should-i-carry/' },
    ],
  },
  {
    nyckel: 'packa',
    rubrik: 'Packa maten smart',
    ingress: 'Mat är det tyngsta som blir lättare för varje dag. Med lite planering väger den mindre från början.',
    avsnitt: [
      {
        rubrik: 'Välj energität mat',
        stycken: [
          'Fett ger 9 kcal per gram, medan kolhydrater och protein ger 4 kcal per gram. Mat med mer fett ger därför mer energi för samma vikt.',
          'Som jämförelse väger de amerikanska försvarets fältransoner för kyla 1,3 till 1,4 kg per dag för 4 500 kcal, ungefär 330 kcal per 100 g. Vanliga ransoner väger ungefär dubbelt så mycket.',
        ],
      },
      {
        rubrik: 'Packa',
        stycken: [],
        punkter: [
          'Packa maten dag för dag, så ser du direkt om något saknas.',
          'Ta bort ytterförpackningar som inte behövs, men spara tillagningsanvisningen.',
          'Lägg dagens mellanmål där du når dem utan att packa upp.',
          'Planera mat för reservdagarna också.',
        ],
      },
    ],
    kallor: [NNR, KYLA],
  },
  {
    nyckel: 'kcal-per-100-g',
    rubrik: 'Så läser du kcal per 100 g',
    ingress: 'Kcal per 100 g visar hur mycket energi maten ger för sin vikt. Det gör det lätt att jämföra påsar av olika storlek.',
    avsnitt: [
      {
        rubrik: 'Räkna ut det själv',
        stycken: [
          'Dela påsens kcal med vikten i gram och gånga med 100. En påse som väger 150 g och ger 600 kcal har 400 kcal per 100 g.',
          'Real Turmats Chili Stew har till exempel ungefär 430 kcal per 100 g torrvikt. Ett högre tal betyder mer energi att bära på samma vikt.',
        ],
      },
      {
        rubrik: 'Tänk på',
        stycken: [],
        punkter: [
          'Jämför torrvikten, alltså påsen innan vattnet tillsätts. Vattnet hämtar du oftast på plats.',
          'Det finns ingen officiell gräns för vad som räknas som energitätt. Använd talet för att jämföra.',
          'Energin är inte allt: protein, smak och att maten blir uppäten spelar också roll.',
          'I Matkatalogen kan du sortera på mest energi per 100 g.',
        ],
      },
    ],
    kallor: [NNR, { namn: 'Real Turmat: Chili Stew (på norska)', url: 'https://realoutdoorfood.com/?p=186' }],
  },
]
