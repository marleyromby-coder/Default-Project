import { getLanguage, t } from '@/i18n';
import type { AuthorizationKind, Category, CategoryId, JobType, PriceUnit } from '@/lib/types';

/**
 * Trades shown in the app, in Danish and English. Job ranges are fallback
 * estimates in DKK incl. VAT, used only when no listed business has priced the
 * job itself (other currencies: Market.fromDkk). Search keywords are kept in
 * both languages whatever the app's language, so "toilet" and "wc" both work.
 */

type Text = { da: string; en: string };

interface JobData {
  id: string;
  name: Text;
  unit: PriceUnit;
  min: number;
  max: number;
  keywords: string[];
}

interface CategoryData {
  id: CategoryId;
  name: Text;
  plural: Text;
  description: Text;
  photo: string;
  authorization?: AuthorizationKind;
  keywords: string[];
  jobs: JobData[];
}

const job = (
  id: string,
  da: string,
  en: string,
  unit: PriceUnit,
  min: number,
  max: number,
  keywords: string[],
): JobData => ({
  id,
  name: { da, en },
  unit,
  min,
  max,
  keywords,
});

export const CATEGORY_DATA: CategoryData[] = [
  {
    id: 'vvs',
    name: { da: "VVS'er", en: 'Plumber' },
    plural: { da: "VVS'ere", en: 'Plumbers' },
    description: { da: 'Vand, varme, sanitet og afløb', en: 'Water, heating, bathrooms and drains' },
    photo: 'vvs-1',
    authorization: 'vvs',
    keywords: [
      'vvs',
      'blikkenslager',
      'vand',
      'varme',
      'rør',
      'afløb',
      'kloak',
      'fyr',
      'sanitet',
      'badeværelse',
      'plumber',
      'plumbing',
      'water',
      'heating',
      'pipe',
      'drain',
      'boiler',
      'bathroom',
      'leak',
    ],
    jobs: [
      job('stoppet-afloeb', 'Stoppet afløb', 'Blocked drain', 'opgave', 1200, 2800, [
        'afløb',
        'stop',
        'vask',
        'kloak',
        'drain',
        'blocked',
        'clogged',
        'sink',
      ]),
      job('skift-toilet', 'Udskiftning af toilet', 'Replace a toilet', 'opgave', 3500, 7000, [
        'toilet',
        'wc',
        'lokum',
        'loo',
      ]),
      job('blandingsbatteri', 'Nyt blandingsbatteri', 'New mixer tap', 'opgave', 1200, 2400, [
        'vandhane',
        'hane',
        'batteri',
        'armatur',
        'tap',
        'faucet',
        'mixer',
      ]),
      job('service-fyr', 'Service af gasfyr', 'Gas boiler service', 'opgave', 1300, 1900, [
        'fyr',
        'gas',
        'kedel',
        'service',
        'boiler',
        'furnace',
      ]),
      job('radiator', 'Udskiftning af radiator', 'Replace a radiator', 'opgave', 2500, 5000, [
        'radiator',
        'varme',
        'termostat',
        'thermostat',
      ]),
      job('vandskade', 'Akut vandskade', 'Emergency water leak', 'opgave', 1800, 4000, [
        'lækage',
        'utæt',
        'vandskade',
        'akut',
        'sprunget',
        'leak',
        'leaking',
        'flood',
        'burst',
      ]),
    ],
  },
  {
    id: 'elektriker',
    name: { da: 'Elektriker', en: 'Electrician' },
    plural: { da: 'Elektrikere', en: 'Electricians' },
    description: { da: 'El-installationer, tavler og ladestandere', en: 'Wiring, fuse boards and EV chargers' },
    photo: 'el-1',
    authorization: 'el',
    keywords: [
      'el',
      'elektriker',
      'strøm',
      'elinstallatør',
      'kontakt',
      'lys',
      'sikring',
      'tavle',
      'electrician',
      'electrical',
      'electric',
      'power',
      'wiring',
      'socket',
      'outlet',
      'light',
      'fuse',
    ],
    jobs: [
      job('stikkontakt', 'Ny stikkontakt', 'New socket', 'opgave', 800, 1600, [
        'stikkontakt',
        'kontakt',
        'stik',
        'socket',
        'outlet',
        'plug',
      ]),
      job('ladestander', 'Installation af ladestander', 'EV charger installation', 'opgave', 4500, 9000, [
        'ladestander',
        'elbil',
        'lader',
        'ladeboks',
        'charger',
        'ev',
        'wallbox',
      ]),
      job('eltavle', 'Ny eltavle', 'New fuse board', 'opgave', 9000, 16000, [
        'tavle',
        'gruppetavle',
        'sikringer',
        'hpfi',
        'hfi',
        'fuse board',
        'consumer unit',
        'breaker panel',
        'panel',
      ]),
      job('fejlsoegning', 'Fejlsøgning på el', 'Electrical fault finding', 'opgave', 900, 2200, [
        'fejl',
        'kortslutning',
        'strømafbrydelse',
        'slår fra',
        'fault',
        'tripping',
        'trips',
        'short circuit',
      ]),
      job('lamper', 'Opsætning af 3 lamper', 'Fit 3 lights', 'opgave', 1200, 2200, [
        'lampe',
        'lamper',
        'spot',
        'belysning',
        'lamp',
        'lights',
        'lighting',
        'spotlights',
      ]),
    ],
  },
  {
    id: 'toemrer',
    name: { da: 'Tømrer', en: 'Carpenter' },
    plural: { da: 'Tømrere', en: 'Carpenters' },
    description: {
      da: 'Vinduer, døre, gulve, terrasser og køkkener',
      en: 'Windows, doors, floors, decks and kitchens',
    },
    photo: 'toemrer-1',
    keywords: [
      'tømrer',
      'snedker',
      'træ',
      'vindue',
      'dør',
      'gulv',
      'terrasse',
      'køkken',
      'tag',
      'carpenter',
      'joiner',
      'carpentry',
      'wood',
      'window',
      'door',
      'floor',
      'deck',
      'kitchen',
    ],
    jobs: [
      job('vindue', 'Montering af vindue', 'Fit a window', 'stk', 3500, 7500, [
        'vindue',
        'vinduer',
        'rude',
        'window',
        'windows',
      ]),
      job('doer', 'Udskiftning af dør', 'Replace a door', 'opgave', 2500, 5500, [
        'dør',
        'hoveddør',
        'indvendig dør',
        'door',
        'front door',
      ]),
      job('gulv', 'Nyt trægulv', 'New wooden floor', 'm2', 350, 650, [
        'gulv',
        'trægulv',
        'parket',
        'plankegulv',
        'floor',
        'flooring',
        'wooden floor',
        'parquet',
      ]),
      job('terrasse', 'Ny terrasse inkl. materialer', 'New deck incl. materials', 'm2', 1200, 2400, [
        'terrasse',
        'træterrasse',
        'have',
        'deck',
        'decking',
        'patio',
      ]),
      job('koekken', 'Montering af køkken', 'Kitchen fitting', 'opgave', 9000, 22000, [
        'køkken',
        'skabe',
        'montering',
        'kitchen',
        'cabinets',
      ]),
    ],
  },
  {
    id: 'murer',
    name: { da: 'Murer', en: 'Bricklayer' },
    plural: { da: 'Murere', en: 'Bricklayers' },
    description: { da: 'Murværk, fliser, fuger og facader', en: 'Brickwork, tiling, pointing and facades' },
    photo: 'murer-1',
    keywords: [
      'murer',
      'mur',
      'mursten',
      'fliser',
      'fuger',
      'facade',
      'puds',
      'skorsten',
      'badeværelse',
      'bricklayer',
      'brick',
      'bricks',
      'brickwork',
      'tiles',
      'tiler',
      'tiling',
      'plaster',
      'chimney',
    ],
    jobs: [
      job('omfugning', 'Omfugning', 'Repointing', 'm2', 450, 900, [
        'fuger',
        'omfugning',
        'fugning',
        'repointing',
        'pointing',
        'mortar',
      ]),
      job('fliser', 'Flisearbejde på badeværelse', 'Bathroom tiling', 'm2', 900, 1700, [
        'fliser',
        'klinker',
        'badeværelse',
        'tiles',
        'tiling',
        'bathroom',
      ]),
      job('skorsten', 'Reparation af skorsten', 'Chimney repair', 'opgave', 4000, 12000, ['skorsten', 'chimney']),
      job('facade', 'Pudsning af facade', 'Facade rendering', 'm2', 450, 950, [
        'facade',
        'puds',
        'vandskuring',
        'render',
        'rendering',
        'stucco',
      ]),
    ],
  },
  {
    id: 'mekaniker',
    name: { da: 'Mekaniker', en: 'Mechanic' },
    plural: { da: 'Mekanikere', en: 'Mechanics' },
    description: { da: 'Service, reparation, dæk og syn', en: 'Servicing, repairs, tyres and inspections' },
    photo: 'mekaniker-1',
    keywords: [
      'mekaniker',
      'bil',
      'værksted',
      'autoværksted',
      'bilværksted',
      'service',
      'dæk',
      'bremser',
      'syn',
      'mechanic',
      'car',
      'garage',
      'auto',
      'repair shop',
      'tyres',
      'tires',
      'brakes',
      'mot',
    ],
    jobs: [
      job('stort-service', 'Stort service', 'Full service', 'opgave', 2800, 4800, [
        'service',
        'eftersyn',
        'olieskift',
        'full service',
        'oil change',
      ]),
      job('bremser', 'Nye bremseklodser (for)', 'New front brake pads', 'opgave', 1400, 2800, [
        'bremser',
        'bremseklodser',
        'bremseskiver',
        'brakes',
        'brake pads',
        'brake',
      ]),
      job('hjulskift', 'Hjulskift', 'Tyre change', 'opgave', 300, 600, [
        'dæk',
        'hjul',
        'vinterdæk',
        'sommerdæk',
        'hjulskift',
        'tyre',
        'tyres',
        'tire',
        'tires',
        'winter tyres',
      ]),
      job('syn', 'Klargøring til syn', 'Inspection prep (MOT)', 'opgave', 900, 2200, [
        'syn',
        'synet',
        'omsyn',
        'mot',
        'inspection',
      ]),
      job('fejlkode', 'Fejlkodelæsning', 'Fault code reading', 'opgave', 400, 800, [
        'fejlkode',
        'motorlampe',
        'diagnose',
        'engine light',
        'check engine',
        'diagnostics',
      ]),
      job('aircon', 'Aircon-service', 'Air conditioning service', 'opgave', 700, 1300, [
        'aircon',
        'klima',
        'klimaanlæg',
        'air conditioning',
        'ac',
      ]),
    ],
  },
  {
    id: 'maler',
    name: { da: 'Maler', en: 'Painter' },
    plural: { da: 'Malere', en: 'Painters' },
    description: { da: 'Indvendig og udvendig maling', en: 'Interior and exterior painting' },
    photo: 'maler-1',
    keywords: [
      'maler',
      'maling',
      'male',
      'vægge',
      'loft',
      'facade',
      'tapet',
      'spartel',
      'painter',
      'painting',
      'paint',
      'decorator',
      'decorating',
      'walls',
      'ceiling',
      'wallpaper',
    ],
    jobs: [
      job('vaerelse', 'Maling af værelse (ca. 12 m²)', 'Paint a room (approx. 12 m²)', 'opgave', 3500, 7000, [
        'værelse',
        'vægge',
        'loft',
        'room',
        'bedroom',
        'walls',
      ]),
      job('lejlighed', 'Maling af lejlighed (ca. 70 m²)', 'Paint a flat (approx. 70 m²)', 'opgave', 22000, 42000, [
        'lejlighed',
        'fraflytning',
        'hus',
        'flat',
        'apartment',
        'house',
      ]),
      job('facademaling', 'Facademaling', 'Exterior painting', 'm2', 180, 350, [
        'facade',
        'udvendig',
        'exterior',
        'outside',
      ]),
      job('vinduesmaling', 'Maling af vindue', 'Paint a window', 'stk', 900, 1800, [
        'vindue',
        'vinduer',
        'karme',
        'window frames',
      ]),
    ],
  },
  {
    id: 'tagdaekker',
    name: { da: 'Tagdækker', en: 'Roofer' },
    plural: { da: 'Tagdækkere', en: 'Roofers' },
    description: { da: 'Tagpap, tagrender og tagreparationer', en: 'Flat roofs, gutters and roof repairs' },
    photo: 'tagdaekker-1',
    keywords: [
      'tag',
      'tagdækker',
      'tagpap',
      'tagrende',
      'tagrender',
      'utæt tag',
      'tagsten',
      'roof',
      'roofer',
      'roofing',
      'gutter',
      'gutters',
      'leaking roof',
      'shingles',
      'felt roof',
    ],
    jobs: [
      job('tagrender', 'Rensning af tagrender', 'Gutter cleaning', 'opgave', 1200, 2800, [
        'tagrender',
        'tagrende',
        'nedløb',
        'gutter',
        'gutters',
        'downpipe',
      ]),
      job('tagpap', 'Nyt tagpap', 'New felt roof', 'm2', 750, 1300, [
        'tagpap',
        'fladt tag',
        'garage',
        'felt',
        'flat roof',
      ]),
      job('tagreparation', 'Reparation af tag', 'Roof repair', 'opgave', 2500, 9000, [
        'utæt',
        'lækage',
        'reparation',
        'tagsten',
        'leaking roof',
        'roof leak',
        'missing tiles',
      ]),
      job('ovenlys', 'Montering af ovenlysvindue', 'Fit a skylight', 'opgave', 6000, 12000, [
        'ovenlys',
        'tagvindue',
        'velux',
        'skylight',
        'roof window',
      ]),
    ],
  },
  {
    id: 'laasesmed',
    name: { da: 'Låsesmed', en: 'Locksmith' },
    plural: { da: 'Låsesmede', en: 'Locksmiths' },
    description: { da: 'Døroplukning, låse og sikring', en: 'Lockouts, locks and home security' },
    photo: 'laasesmed-1',
    keywords: [
      'låsesmed',
      'lås',
      'nøgle',
      'låst ude',
      'døroplukning',
      'cylinder',
      'sikring',
      'tyverisikring',
      'locksmith',
      'lock',
      'locks',
      'key',
      'keys',
      'locked out',
      'lockout',
      'security',
    ],
    jobs: [
      job('doeroplukning', 'Døroplukning (dagtid)', 'Lockout (daytime)', 'opgave', 900, 1500, [
        'låst ude',
        'døroplukning',
        'nøgle',
        'smækket',
        'locked out',
        'lockout',
        'lost keys',
      ]),
      job('doeroplukning-aften', 'Døroplukning (aften/weekend)', 'Lockout (evening/weekend)', 'opgave', 1500, 2600, [
        'låst ude',
        'nat',
        'weekend',
        'akut',
        'night',
        'evening',
        'urgent',
      ]),
      job('cylinder', 'Udskiftning af cylinder', 'Replace a lock cylinder', 'opgave', 1200, 2400, [
        'cylinder',
        'lås',
        'ny lås',
        'new lock',
        'lock change',
      ]),
      job('sikkerhedslaas', 'Montering af sikkerhedslås', 'Fit a security lock', 'opgave', 2200, 4500, [
        'sikkerhedslås',
        'tyverisikring',
        'indbrud',
        'security lock',
        'burglary',
        'deadbolt',
      ]),
    ],
  },
];

function localize(data: CategoryData): Category {
  const language = getLanguage();
  return {
    id: data.id,
    name: data.name[language],
    plural: data.plural[language],
    description: data.description[language],
    photo: data.photo,
    authorization: data.authorization,
    keywords: [...data.keywords, data.name.da, data.name.en, data.plural.da, data.plural.en],
    jobs: data.jobs.map(
      (j): JobType => ({
        id: j.id,
        name: j.name[language],
        unit: j.unit,
        min: j.min,
        max: j.max,
        keywords: [...j.keywords, j.name.da, j.name.en],
      }),
    ),
  };
}

/** Trades in the app's language. The language is fixed for a run (see src/i18n). */
export const CATEGORIES: Category[] = CATEGORY_DATA.map(localize);

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category | undefined {
  return BY_ID.get(id as CategoryId);
}

export function isCategoryId(id: string): id is CategoryId {
  return BY_ID.has(id as CategoryId);
}

/** Authorisation labels. The Danish ones name what Sikkerhedsstyrelsen issues. */
export const AUTHORIZATION_LABELS: Record<AuthorizationKind, string> = {
  el: t('Autoriseret elinstallatør'),
  vvs: t('Autoriseret VVS-installatør'),
  kloak: t('Autoriseret kloakmester'),
  gas: t('Godkendt gasinstallatør'),
};
