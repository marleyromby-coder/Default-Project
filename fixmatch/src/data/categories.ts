import type { Category, CategoryId } from '@/lib/types';

/**
 * Trades shown in the app. Job ranges are fallback estimates in DKK incl. VAT,
 * used only when no listed business has priced the job itself.
 */
export const CATEGORIES: Category[] = [
  {
    id: 'vvs',
    name: "VVS'er",
    plural: "VVS'ere",
    description: 'Vand, varme, sanitet og afløb',
    photo: 'vvs-1',
    authorization: 'vvs',
    keywords: ['vvs', 'blikkenslager', 'vand', 'varme', 'rør', 'afløb', 'kloak', 'fyr', 'sanitet', 'badeværelse'],
    jobs: [
      { id: 'stoppet-afloeb', name: 'Stoppet afløb', unit: 'opgave', min: 1200, max: 2800, keywords: ['afløb', 'stop', 'vask', 'kloak'] },
      { id: 'skift-toilet', name: 'Udskiftning af toilet', unit: 'opgave', min: 3500, max: 7000, keywords: ['toilet', 'wc', 'lokum'] },
      { id: 'blandingsbatteri', name: 'Nyt blandingsbatteri', unit: 'opgave', min: 1200, max: 2400, keywords: ['vandhane', 'hane', 'batteri', 'armatur'] },
      { id: 'service-fyr', name: 'Service af gasfyr', unit: 'opgave', min: 1300, max: 1900, keywords: ['fyr', 'gas', 'kedel', 'service'] },
      { id: 'radiator', name: 'Udskiftning af radiator', unit: 'opgave', min: 2500, max: 5000, keywords: ['radiator', 'varme', 'termostat'] },
      { id: 'vandskade', name: 'Akut vandskade', unit: 'opgave', min: 1800, max: 4000, keywords: ['lækage', 'utæt', 'vandskade', 'akut', 'sprunget'] },
    ],
  },
  {
    id: 'elektriker',
    name: 'Elektriker',
    plural: 'Elektrikere',
    description: 'El-installationer, tavler og ladestandere',
    photo: 'el-1',
    authorization: 'el',
    keywords: ['el', 'elektriker', 'strøm', 'elinstallatør', 'kontakt', 'lys', 'sikring', 'tavle'],
    jobs: [
      { id: 'stikkontakt', name: 'Ny stikkontakt', unit: 'opgave', min: 800, max: 1600, keywords: ['stikkontakt', 'kontakt', 'stik'] },
      { id: 'ladestander', name: 'Installation af ladestander', unit: 'opgave', min: 4500, max: 9000, keywords: ['ladestander', 'elbil', 'lader', 'ladeboks'] },
      { id: 'eltavle', name: 'Ny eltavle', unit: 'opgave', min: 9000, max: 16000, keywords: ['tavle', 'gruppetavle', 'sikringer', 'hpfi', 'hfi'] },
      { id: 'fejlsoegning', name: 'Fejlsøgning på el', unit: 'opgave', min: 900, max: 2200, keywords: ['fejl', 'kortslutning', 'strømafbrydelse', 'slår fra'] },
      { id: 'lamper', name: 'Opsætning af 3 lamper', unit: 'opgave', min: 1200, max: 2200, keywords: ['lampe', 'lamper', 'spot', 'belysning'] },
    ],
  },
  {
    id: 'toemrer',
    name: 'Tømrer',
    plural: 'Tømrere',
    description: 'Vinduer, døre, gulve, terrasser og køkkener',
    photo: 'toemrer-1',
    keywords: ['tømrer', 'snedker', 'træ', 'vindue', 'dør', 'gulv', 'terrasse', 'køkken', 'tag'],
    jobs: [
      { id: 'vindue', name: 'Montering af vindue', unit: 'stk', min: 3500, max: 7500, keywords: ['vindue', 'vinduer', 'rude'] },
      { id: 'doer', name: 'Udskiftning af dør', unit: 'opgave', min: 2500, max: 5500, keywords: ['dør', 'hoveddør', 'indvendig dør'] },
      { id: 'gulv', name: 'Nyt trægulv', unit: 'm2', min: 350, max: 650, keywords: ['gulv', 'trægulv', 'parket', 'plankegulv'] },
      { id: 'terrasse', name: 'Ny terrasse inkl. materialer', unit: 'm2', min: 1200, max: 2400, keywords: ['terrasse', 'træterrasse', 'have'] },
      { id: 'koekken', name: 'Montering af køkken', unit: 'opgave', min: 9000, max: 22000, keywords: ['køkken', 'skabe', 'montering'] },
    ],
  },
  {
    id: 'murer',
    name: 'Murer',
    plural: 'Murere',
    description: 'Murværk, fliser, fuger og facader',
    photo: 'murer-1',
    keywords: ['murer', 'mur', 'mursten', 'fliser', 'fuger', 'facade', 'puds', 'skorsten', 'badeværelse'],
    jobs: [
      { id: 'omfugning', name: 'Omfugning', unit: 'm2', min: 450, max: 900, keywords: ['fuger', 'omfugning', 'fugning'] },
      { id: 'fliser', name: 'Flisearbejde på badeværelse', unit: 'm2', min: 900, max: 1700, keywords: ['fliser', 'klinker', 'badeværelse'] },
      { id: 'skorsten', name: 'Reparation af skorsten', unit: 'opgave', min: 4000, max: 12000, keywords: ['skorsten'] },
      { id: 'facade', name: 'Pudsning af facade', unit: 'm2', min: 450, max: 950, keywords: ['facade', 'puds', 'vandskuring'] },
    ],
  },
  {
    id: 'mekaniker',
    name: 'Mekaniker',
    plural: 'Mekanikere',
    description: 'Service, reparation, dæk og syn',
    photo: 'mekaniker-1',
    keywords: ['mekaniker', 'bil', 'værksted', 'autoværksted', 'bilværksted', 'service', 'dæk', 'bremser', 'syn'],
    jobs: [
      { id: 'stort-service', name: 'Stort service', unit: 'opgave', min: 2800, max: 4800, keywords: ['service', 'eftersyn', 'olieskift'] },
      { id: 'bremser', name: 'Nye bremseklodser (for)', unit: 'opgave', min: 1400, max: 2800, keywords: ['bremser', 'bremseklodser', 'bremseskiver'] },
      { id: 'hjulskift', name: 'Hjulskift', unit: 'opgave', min: 300, max: 600, keywords: ['dæk', 'hjul', 'vinterdæk', 'sommerdæk', 'hjulskift'] },
      { id: 'syn', name: 'Klargøring til syn', unit: 'opgave', min: 900, max: 2200, keywords: ['syn', 'synet', 'omsyn'] },
      { id: 'fejlkode', name: 'Fejlkodelæsning', unit: 'opgave', min: 400, max: 800, keywords: ['fejlkode', 'motorlampe', 'diagnose'] },
      { id: 'aircon', name: 'Aircon-service', unit: 'opgave', min: 700, max: 1300, keywords: ['aircon', 'klima', 'klimaanlæg'] },
    ],
  },
  {
    id: 'maler',
    name: 'Maler',
    plural: 'Malere',
    description: 'Indvendig og udvendig maling',
    photo: 'maler-1',
    keywords: ['maler', 'maling', 'male', 'vægge', 'loft', 'facade', 'tapet', 'spartel'],
    jobs: [
      { id: 'vaerelse', name: 'Maling af værelse (ca. 12 m²)', unit: 'opgave', min: 3500, max: 7000, keywords: ['værelse', 'vægge', 'loft'] },
      { id: 'lejlighed', name: 'Maling af lejlighed (ca. 70 m²)', unit: 'opgave', min: 22000, max: 42000, keywords: ['lejlighed', 'fraflytning', 'hus'] },
      { id: 'facademaling', name: 'Facademaling', unit: 'm2', min: 180, max: 350, keywords: ['facade', 'udvendig'] },
      { id: 'vinduesmaling', name: 'Maling af vindue', unit: 'stk', min: 900, max: 1800, keywords: ['vindue', 'vinduer', 'karme'] },
    ],
  },
  {
    id: 'tagdaekker',
    name: 'Tagdækker',
    plural: 'Tagdækkere',
    description: 'Tagpap, tagrender og tagreparationer',
    photo: 'tagdaekker-1',
    keywords: ['tag', 'tagdækker', 'tagpap', 'tagrende', 'tagrender', 'utæt tag', 'tagsten'],
    jobs: [
      { id: 'tagrender', name: 'Rensning af tagrender', unit: 'opgave', min: 1200, max: 2800, keywords: ['tagrender', 'tagrende', 'nedløb'] },
      { id: 'tagpap', name: 'Nyt tagpap', unit: 'm2', min: 750, max: 1300, keywords: ['tagpap', 'fladt tag', 'garage'] },
      { id: 'tagreparation', name: 'Reparation af tag', unit: 'opgave', min: 2500, max: 9000, keywords: ['utæt', 'lækage', 'reparation', 'tagsten'] },
      { id: 'ovenlys', name: 'Montering af ovenlysvindue', unit: 'opgave', min: 6000, max: 12000, keywords: ['ovenlys', 'tagvindue', 'velux'] },
    ],
  },
  {
    id: 'laasesmed',
    name: 'Låsesmed',
    plural: 'Låsesmede',
    description: 'Døroplukning, låse og sikring',
    photo: 'laasesmed-1',
    keywords: ['låsesmed', 'lås', 'nøgle', 'låst ude', 'døroplukning', 'cylinder', 'sikring', 'tyverisikring'],
    jobs: [
      { id: 'doeroplukning', name: 'Døroplukning (dagtid)', unit: 'opgave', min: 900, max: 1500, keywords: ['låst ude', 'døroplukning', 'nøgle', 'smækket'] },
      { id: 'doeroplukning-aften', name: 'Døroplukning (aften/weekend)', unit: 'opgave', min: 1500, max: 2600, keywords: ['låst ude', 'nat', 'weekend', 'akut'] },
      { id: 'cylinder', name: 'Udskiftning af cylinder', unit: 'opgave', min: 1200, max: 2400, keywords: ['cylinder', 'lås', 'ny lås'] },
      { id: 'sikkerhedslaas', name: 'Montering af sikkerhedslås', unit: 'opgave', min: 2200, max: 4500, keywords: ['sikkerhedslås', 'tyverisikring', 'indbrud'] },
    ],
  },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category | undefined {
  return BY_ID.get(id as CategoryId);
}

export function isCategoryId(id: string): id is CategoryId {
  return BY_ID.has(id as CategoryId);
}

export const AUTHORIZATION_LABELS = {
  el: 'Autoriseret elinstallatør',
  vvs: 'Autoriseret VVS-installatør',
  kloak: 'Autoriseret kloakmester',
  gas: 'Godkendt gasinstallatør',
} as const;
