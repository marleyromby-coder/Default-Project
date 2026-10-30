#!/usr/bin/env node
/**
 * Generates src/data/demo-businesses.json: fictional businesses for demos and
 * screenshots. Everything here is made up. Names are invented, CVR numbers fail
 * the modulus-11 check, phone numbers use the unassigned 10-series, websites use
 * the reserved .example domain, and the app disables contact buttons for demo
 * listings. Never ship demo data in an App Store build.
 *
 * Usage: node scripts/generate-demo-data.js
 */
const fs = require('node:fs');
const path = require('node:path');

// Deterministic pseudo-random numbers so the file only changes when this script does.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(20261020);
const between = (min, max) => min + (max - min) * random();
const int = (min, max) => Math.floor(between(min, max + 1));
const pick = (list) => list[Math.floor(random() * list.length)];
const chance = (p) => random() < p;
const round = (value, step) => Math.round(value / step) * step;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const AREAS = {
  kbh: [
    ['København N', '2200', 55.6941, 12.5486],
    ['København Ø', '2100', 55.7075, 12.5774],
    ['København V', '1620', 55.67, 12.545],
    ['Frederiksberg', '2000', 55.68, 12.515],
    ['København S', '2300', 55.6603, 12.6],
    ['Valby', '2500', 55.6619, 12.5156],
    ['Brønshøj', '2700', 55.7046, 12.4919],
    ['Hvidovre', '2650', 55.6572, 12.4736],
    ['Glostrup', '2600', 55.6667, 12.4],
    ['Herlev', '2730', 55.7237, 12.44],
    ['Kongens Lyngby', '2800', 55.7704, 12.5038],
    ['Hellerup', '2900', 55.7316, 12.5714],
    ['Kastrup', '2770', 55.6333, 12.64],
    ['Rødovre', '2610', 55.6806, 12.4537],
    ['Søborg', '2860', 55.7333, 12.5167],
    ['Ballerup', '2750', 55.7317, 12.3633],
  ],
  aarhus: [
    ['Aarhus C', '8000', 56.1567, 10.2108],
    ['Aarhus N', '8200', 56.19, 10.19],
    ['Viby J', '8260', 56.13, 10.16],
    ['Risskov', '8240', 56.19, 10.23],
    ['Højbjerg', '8270', 56.12, 10.2],
    ['Brabrand', '8220', 56.15, 10.11],
  ],
  odense: [
    ['Odense C', '5000', 55.3959, 10.3883],
    ['Odense SØ', '5220', 55.375, 10.44],
    ['Odense NV', '5210', 55.415, 10.355],
    ['Odense M', '5230', 55.38, 10.41],
  ],
  aalborg: [
    ['Aalborg', '9000', 57.048, 9.9187],
    ['Aalborg SV', '9200', 57.02, 9.88],
    ['Nørresundby', '9400', 57.059, 9.923],
    ['Aalborg Øst', '9220', 57.04, 10.0],
  ],
};
const PER_CITY = { kbh: 6, aarhus: 3, odense: 2, aalborg: 2 };

const STREETS = ['Industrivej', 'Håndværkervej', 'Værkstedsvej', 'Erhvervsvej', 'Smedevej', 'Fabriksvej', 'Lagervej', 'Teglværksvej'];

const CATEGORY_SETUP = {
  vvs: {
    names: ['Fjordvand VVS', 'Kobberkilden VVS', 'Rørfalken', 'Hjertevarme VVS & Blik', 'Dryp-Stop Døgnservice', 'Bølgevand Rørteknik', 'Kildeklar VVS', 'Radiatorlauget', 'Klitvand VVS', 'Strømhvirvel Rør & Varme', 'Lyngkilde VVS', 'Isbjerg Varme & Sanitet', 'Ådalens Rørservice'],
    photos: ['vvs-1', 'vvs-2', 'vvs-3', 'vaerktoej-1'],
    hourly: [525, 650], spread: [75, 150], callout: [295, 495], emergency: 0.45,
    taglines: ['Badeværelser og akut VVS-hjælp', 'Vand, varme og afløb', 'Varmepumper og gasfyr', 'Fast pris på badeværelser', 'Døgnvagt ved vandskade'],
    services: ['Badeværelser', 'Afløb og kloak', 'Varmeanlæg', 'Gasfyr', 'Varmepumper', 'Vandskader', 'Køkkeninstallationer', 'Gulvvarme'],
    about: 'VVS-firma, der løser alt fra dryppende vandhaner til nye badeværelser. Vi giver gerne fast pris, og vi rydder altid op efter os.',
    membership: ['TEKNIQ Arbejdsgiverne', 0.7],
    auth: ['vvs'],
  },
  elektriker: {
    names: ['Lysfalken El', 'Gnist & Søn', 'Nordlys Elteknik', 'Voltkompagniet', 'Spændingsfeltet', 'Kobbertråd El', 'Fasekraft Elservice', 'Amperelauget', 'Lynvejen El', 'Strømlinjen El', 'Lysbuen El', 'Watt & Co. Elservice', 'Elværkstedet Glød'],
    photos: ['el-1', 'el-2', 'el-3', 'el-4', 'el-5', 'el-6'],
    hourly: [495, 625], spread: [75, 150], callout: [295, 450], emergency: 0.3,
    taglines: ['Ladestandere og el til hjemmet', 'Nye eltavler og fejlsøgning', 'Belysning og smart home', 'Autoriseret el til private', 'El til renovering og nybyg'],
    services: ['Elinstallationer', 'Ladestandere', 'Eltavler', 'Belysning', 'Fejlsøgning', 'Solceller', 'Smart home', 'Hvidevarer'],
    about: 'autoriseret el-firma med fokus på private hjem: ladestandere, nye eltavler, belysning og fejlsøgning. Vi fortæller prisen, før vi går i gang.',
    membership: ['TEKNIQ Arbejdsgiverne', 0.7],
    auth: ['el'],
  },
  toemrer: {
    names: ['Egeknasten Tømrer', 'Høvlspånen Tømrer & Snedker', 'Spær & Søn', 'Bjælkelauget', 'Træværket Lund', 'Fyrretræ Tømrerne', 'Lærkehøvl Byg', 'Bøgebakken Tømrer', 'Vinkeljernet', 'Tapsporet Tømrer', 'Stolpe & Spær', 'Kvistlauget', 'Laftehuset Tømrer'],
    photos: ['toemrer-1', 'toemrer-2', 'toemrer-3', 'toemrer-4', 'toemrer-5', 'toemrer-6', 'toemrer-7'],
    hourly: [450, 575], spread: [50, 125], callout: [0, 395], emergency: 0.05,
    taglines: ['Vinduer, døre og gulve', 'Terrasser og udestuer', 'Køkkenmontering og snedkerarbejde', 'Tilbygninger og renovering', 'Tagarbejde og kviste'],
    services: ['Vinduer og døre', 'Gulve', 'Terrasser', 'Køkkenmontering', 'Tagarbejde', 'Isolering', 'Lofter', 'Carporte'],
    about: 'tømrerfirma med erfarne svende og lærlinge. Vi laver både de små reparationer og de store renoveringer, og du har én fast kontaktperson hele vejen.',
    membership: ['DI Byggeri', 0.5],
    auth: [],
  },
  murer: {
    names: ['Teglværket Murerne', 'Murskeen & Co.', 'Lodsnoren Murerfirma', 'Kalk & Kvarts Murer', 'Mørtellauget', 'Fugen Murerservice', 'Rødsten Murerne', 'Klinkerkompagniet', 'Flisefalken', 'Facadelauget', 'Puds & Pensel Murer', 'Gavlen Murerfirma', 'Teglbakken Murer'],
    photos: ['murer-1', 'murer-2', 'murer-3', 'murer-4', 'murer-5'],
    hourly: [475, 595], spread: [50, 125], callout: [0, 395], emergency: 0.05,
    taglines: ['Badeværelser fra bund til fliser', 'Facader og omfugning', 'Murværk og skorstene', 'Fliser og klinker', 'Renovering af ældre huse'],
    services: ['Murværk', 'Fliser og klinker', 'Badeværelser', 'Facaderenovering', 'Skorstene', 'Omfugning', 'Betongulve', 'Pudsning'],
    about: 'murerfirma, der især laver badeværelser, facader og renovering af ældre huse. Vi koordinerer gerne med VVS og elektriker, så du kun har én at ringe til.',
    membership: ['DI Byggeri', 0.5],
    auth: [],
  },
  mekaniker: {
    names: ['Stempel & Søn Autoservice', 'Krumtap Autoværksted', 'Gearkassen Auto', 'Ventilen Bilservice', 'Fælgen Autocenter', 'Tændrøret Auto', 'Kardan Auto', 'Hjulspind Autoservice', 'Kobling & Co.', 'Motorlauget', 'Servo Autoværksted', 'Bremsefalken', 'Knastaksel Auto'],
    photos: ['mekaniker-1', 'mekaniker-2', 'mekaniker-3', 'mekaniker-4', 'mekaniker-5', 'mekaniker-6', 'mekaniker-7', 'mekaniker-8', 'mekaniker-9'],
    hourly: [595, 795], spread: [50, 150], callout: [0, 0], emergency: 0.1,
    taglines: ['Service på alle bilmærker', 'Dæk, bremser og syn', 'Specialister i elbiler og hybrid', 'Hurtig service – mens du venter', 'Fejlfinding og reparation'],
    services: ['Service og eftersyn', 'Bremser', 'Dæk og hjulskift', 'Syn og omsyn', 'Fejlfinding', 'Aircon', 'Elbiler og hybrid', 'Koblinger'],
    about: 'uafhængigt autoværksted, der servicerer alle bilmærker efter fabrikkens forskrifter, så garantien bevares. Du får altid et prisoverslag, før vi går i gang.',
    membership: ['AutoBranchen Danmark', 0.5],
    auth: [],
  },
  maler: {
    names: ['Penselstrøget', 'Rullen & Søn', 'Farvelauget', 'Kalkmalerne', 'Dækfarven', 'Spartel & Co.', 'Glans & Mat Malere', 'Nuance Malerne', 'Pigment Malerservice', 'Okker Malerfirma', 'Lasur Malerne', 'Kulør & Kvalitet', 'Skygge & Lys Malere'],
    photos: ['maler-1', 'maler-2', 'maler-3', 'maler-4', 'maler-5'],
    hourly: [425, 525], spread: [50, 100], callout: [0, 0], emergency: 0,
    taglines: ['Indvendig maling og spartling', 'Facader og vinduer', 'Fraflytning og istandsættelse', 'Malerarbejde med fast pris', 'Lejligheder og villaer'],
    services: ['Indvendig maling', 'Udvendig maling', 'Spartling', 'Tapetsering', 'Gulvbehandling', 'Vinduer og døre', 'Facader', 'Fraflytning'],
    about: 'malerfirma med uddannede malere. Vi dækker af, maler og rydder op, så du kan bruge boligen igen samme dag, opgaven er færdig.',
    membership: ['Danske Malermestre', 0.6],
    auth: [],
  },
  tagdaekker: {
    names: ['Tagrenden Tagdækning', 'Tagpapfalken', 'Kvistlyset Tag', 'Rygningen Tagservice', 'Tagfladen', 'Skifer & Søn', 'Tagstenen', 'Vindskeden Tag', 'Taglægten', 'Nedløbet Tagservice', 'Tagfoden', 'Mønning Tag', 'Sternbrædt Tag'],
    photos: ['tagdaekker-1', 'tagdaekker-2', 'tagdaekker-3', 'tagdaekker-4'],
    hourly: [495, 625], spread: [50, 125], callout: [0, 395], emergency: 0.15,
    taglines: ['Tagpap, tagrender og ovenlys', 'Tagreparation efter storm', 'Nye tage og inddækninger', 'Grønne tage og tagpap', 'Tagrender og nedløb'],
    services: ['Tagpap', 'Tagrender', 'Tagreparation', 'Ovenlysvinduer', 'Grønne tage', 'Inspektion med drone', 'Inddækninger'],
    about: 'tagdækkerfirma, der lægger nye tage og reparerer gamle. Vi inspicerer gerne taget med drone, så du kan se skaderne, før du siger ja til et tilbud.',
    membership: ['DI Byggeri', 0.5],
    auth: [],
  },
  laasesmed: {
    names: ['Nøglehullet Låseservice', 'Cylinderen Låsesmed', 'Dirk & Søn Låse', 'Slå & Lås Låsesmed', 'Fallen Låseservice', 'Nøglebundtet', 'Kode & Lås', 'Låsefalken', 'Riglen Låsesmed', 'Sikkerhedslauget', 'Dørgrebet Låse', 'Hasp & Hængsel', 'Nøglekompagniet'],
    photos: ['laasesmed-1', 'laasesmed-2', 'laasesmed-3'],
    hourly: [550, 695], spread: [100, 300], callout: [395, 695], emergency: 0.8,
    taglines: ['Låst ude? Vi kommer hurtigt', 'Sikring mod indbrud', 'Låse, cylindre og nøgler', 'Døgnvagt i hele byen', 'Adgangskontrol til private'],
    services: ['Døroplukning', 'Låse og cylindre', 'Sikkerhedsdøre', 'Adgangskontrol', 'Nøgler og kopier', 'Tyverisikring', 'Pengeskabe'],
    about: 'låsesmedefirma med vogne klar i hele området. Vi åbner døre uden at ødelægge låsen, når det kan lade sig gøre, og vi sikrer dit hjem mod indbrud.',
    membership: ['', 0],
    auth: [],
  },
};

/** English texts for each trade, in the same order as the Danish ones above. */
const ENGLISH = {
  vvs: {
    taglines: ['Bathrooms and emergency plumbing', 'Water, heating and drains', 'Heat pumps and gas boilers', 'Fixed prices on bathrooms', '24/7 help with water leaks'],
    services: ['Bathrooms', 'Drains and sewers', 'Heating systems', 'Gas boilers', 'Heat pumps', 'Water damage', 'Kitchen plumbing', 'Underfloor heating'],
    about: 'plumbing firm that fixes everything from dripping taps to new bathrooms. We are happy to give a fixed price, and we always clean up after ourselves.',
  },
  elektriker: {
    taglines: ['EV chargers and home electrics', 'New fuse boards and fault finding', 'Lighting and smart home', 'Licensed electricians for homes', 'Electrics for renovations and new builds'],
    services: ['Electrical installations', 'EV chargers', 'Fuse boards', 'Lighting', 'Fault finding', 'Solar panels', 'Smart home', 'Appliances'],
    about: 'licensed electrical firm focused on homes: EV chargers, new fuse boards, lighting and fault finding. We tell you the price before we start.',
  },
  toemrer: {
    taglines: ['Windows, doors and floors', 'Decks and conservatories', 'Kitchen fitting and joinery', 'Extensions and renovation', 'Roof work and dormers'],
    services: ['Windows and doors', 'Floors', 'Decks', 'Kitchen fitting', 'Roof work', 'Insulation', 'Ceilings', 'Carports'],
    about: 'carpentry firm with experienced carpenters and apprentices. We do small repairs and big renovations, and you have one contact all the way.',
  },
  murer: {
    taglines: ['Bathrooms from floor to tiles', 'Facades and repointing', 'Brickwork and chimneys', 'Tiles and paving', 'Renovating older houses'],
    services: ['Brickwork', 'Tiles', 'Bathrooms', 'Facade renovation', 'Chimneys', 'Repointing', 'Concrete floors', 'Rendering'],
    about: 'bricklaying firm that mostly does bathrooms, facades and older houses. We are happy to coordinate with plumbers and electricians, so you only have one number to call.',
  },
  mekaniker: {
    taglines: ['Servicing for all makes', 'Tyres, brakes and inspections', 'Electric and hybrid specialists', 'Quick service while you wait', 'Fault finding and repairs'],
    services: ['Servicing', 'Brakes', 'Tyres and wheel changes', 'Inspections', 'Fault finding', 'Air conditioning', 'Electric and hybrid cars', 'Clutches'],
    about: 'independent garage that services all makes to the manufacturer’s schedule, so your warranty is kept. You always get an estimate before we start.',
  },
  maler: {
    taglines: ['Interior painting and filling', 'Facades and windows', 'End-of-tenancy decorating', 'Painting at a fixed price', 'Flats and houses'],
    services: ['Interior painting', 'Exterior painting', 'Filling', 'Wallpapering', 'Floor finishing', 'Windows and doors', 'Facades', 'End of tenancy'],
    about: 'painting firm with trained painters. We cover up, paint and tidy, so you can use your home again the day the job is done.',
  },
  tagdaekker: {
    taglines: ['Felt roofs, gutters and skylights', 'Roof repairs after storms', 'New roofs and flashing', 'Green roofs and felt', 'Gutters and downpipes'],
    services: ['Felt roofs', 'Gutters', 'Roof repairs', 'Skylights', 'Green roofs', 'Drone inspections', 'Flashing'],
    about: 'roofing firm that lays new roofs and repairs old ones. We are happy to inspect the roof with a drone, so you can see the damage before you accept a quote.',
  },
  laasesmed: {
    taglines: ['Locked out? We come fast', 'Burglary protection', 'Locks, cylinders and keys', '24/7 across the city', 'Access control for homes'],
    services: ['Lockouts', 'Locks and cylinders', 'Security doors', 'Access control', 'Keys and copies', 'Burglary protection', 'Safes'],
    about: 'locksmith firm with vans ready across the area. We open doors without breaking the lock whenever we can, and we secure your home against burglary.',
  },
};

const RESPONSE_TIMES_EN = ['Usually replies within 1 hour', 'Usually replies the same day', 'Usually replies within 24 hours'];

// Kept in sync with src/data/categories.ts (job id, unit, fallback min, max).
const JOBS = {
  vvs: [['stoppet-afloeb', 'Stoppet afløb', 'opgave', 1200, 2800], ['skift-toilet', 'Udskiftning af toilet', 'opgave', 3500, 7000], ['blandingsbatteri', 'Nyt blandingsbatteri', 'opgave', 1200, 2400], ['service-fyr', 'Service af gasfyr', 'opgave', 1300, 1900], ['radiator', 'Udskiftning af radiator', 'opgave', 2500, 5000], ['vandskade', 'Akut vandskade', 'opgave', 1800, 4000]],
  elektriker: [['stikkontakt', 'Ny stikkontakt', 'opgave', 800, 1600], ['ladestander', 'Installation af ladestander', 'opgave', 4500, 9000], ['eltavle', 'Ny eltavle', 'opgave', 9000, 16000], ['fejlsoegning', 'Fejlsøgning på el', 'opgave', 900, 2200], ['lamper', 'Opsætning af 3 lamper', 'opgave', 1200, 2200]],
  toemrer: [['vindue', 'Montering af vindue', 'stk', 3500, 7500], ['doer', 'Udskiftning af dør', 'opgave', 2500, 5500], ['gulv', 'Nyt trægulv', 'm2', 350, 650], ['terrasse', 'Ny terrasse inkl. materialer', 'm2', 1200, 2400], ['koekken', 'Montering af køkken', 'opgave', 9000, 22000]],
  murer: [['omfugning', 'Omfugning', 'm2', 450, 900], ['fliser', 'Flisearbejde på badeværelse', 'm2', 900, 1700], ['skorsten', 'Reparation af skorsten', 'opgave', 4000, 12000], ['facade', 'Pudsning af facade', 'm2', 450, 950]],
  mekaniker: [['stort-service', 'Stort service', 'opgave', 2800, 4800], ['bremser', 'Nye bremseklodser (for)', 'opgave', 1400, 2800], ['hjulskift', 'Hjulskift', 'opgave', 300, 600], ['syn', 'Klargøring til syn', 'opgave', 900, 2200], ['fejlkode', 'Fejlkodelæsning', 'opgave', 400, 800], ['aircon', 'Aircon-service', 'opgave', 700, 1300]],
  maler: [['vaerelse', 'Maling af værelse (ca. 12 m²)', 'opgave', 3500, 7000], ['lejlighed', 'Maling af lejlighed (ca. 70 m²)', 'opgave', 22000, 42000], ['facademaling', 'Facademaling', 'm2', 180, 350], ['vinduesmaling', 'Maling af vindue', 'stk', 900, 1800]],
  tagdaekker: [['tagrender', 'Rensning af tagrender', 'opgave', 1200, 2800], ['tagpap', 'Nyt tagpap', 'm2', 750, 1300], ['tagreparation', 'Reparation af tag', 'opgave', 2500, 9000], ['ovenlys', 'Montering af ovenlysvindue', 'opgave', 6000, 12000]],
  laasesmed: [['doeroplukning', 'Døroplukning (dagtid)', 'opgave', 900, 1500], ['doeroplukning-aften', 'Døroplukning (aften/weekend)', 'opgave', 1500, 2600], ['cylinder', 'Udskiftning af cylinder', 'opgave', 1200, 2400], ['sikkerhedslaas', 'Montering af sikkerhedslås', 'opgave', 2200, 4500]],
};

const RESPONSE_TIMES = ['Svarer typisk inden for 1 time', 'Svarer typisk samme dag', 'Svarer typisk inden for 24 timer'];
const EMPLOYEES = ['1–4', '5–9', '10–19', '20–49'];

function slugify(name, and = 'og') {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').replace(/ß/g, 'ss')
    .replace(/&/g, and)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** An 8-digit number that fails the CVR modulus-11 check, so it can never be a real CVR. */
function fakeCvr(int) {
  const weights = [2, 7, 6, 5, 4, 3, 2, 1];
  for (;;) {
    const digits = String(int(10000000, 99999999)).split('').map(Number);
    const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
    if (sum % 11 !== 0) return digits.join('');
  }
}

/** Danish numbers starting with 1 are short codes, so 8-digit 10-numbers are never assigned. */
function fakePhone(int) {
  return `+4510${String(int(0, 999999)).padStart(6, '0')}`;
}

function hoursFor(category, chance) {
  const workday = chance(0.5) ? ['07:00', '15:30'] : ['07:00', '16:00'];
  const friday = chance(0.6) ? ['07:00', '14:00'] : workday;
  if (category === 'mekaniker') {
    const saturday = chance(0.4) ? ['09:00', '13:00'] : null;
    return [['07:30', '16:30'], ['07:30', '16:30'], ['07:30', '16:30'], ['07:30', '16:30'], ['07:30', '15:00'], saturday, null];
  }
  if (category === 'laasesmed') {
    return [['08:00', '17:00'], ['08:00', '17:00'], ['08:00', '17:00'], ['08:00', '17:00'], ['08:00', '16:00'], ['10:00', '14:00'], null];
  }
  return [workday, workday, workday, workday, friday, null, null];
}

function isoDay(month, day) {
  return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** A price in DKK converted to a market's currency and rounded to a believable step. */
function localPrice(dkk, market) {
  const value = dkk * market.fromDkk;
  const step = value >= 5000 ? 100 : value >= 1000 ? 50 : value >= 100 ? (market.fromDkk < 0.5 ? 5 : 10) : 1;
  return Math.max(step, Math.round(value / step) * step);
}

const DANISH_MARKET = { country: 'DK', currency: 'DKK', fromDkk: 1 };

function buildBusiness(category, name, area, quality, photo, index, market = DANISH_MARKET, rng = random) {
  const r = () => rng();
  const between = (min, max) => min + (max - min) * r();
  const int = (min, max) => Math.floor(between(min, max + 1));
  const chance = (p) => r() < p;
  const shuffleIndices = (n) => {
    const copy = [...Array(n).keys()];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(r() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const pickIndex = (n) => Math.floor(r() * n);

  const setup = CATEGORY_SETUP[category];
  const english = ENGLISH[category];
  const danish = market.country === 'DK';
  const [city, postalCode, lat, lon] = area;
  const priceFactor = clamp(0.6 * (quality - 0.5) * 2 + 0.4 * between(-1, 1), -1, 1);
  const hourlyMinDkk = round(setup.hourly[0] + ((priceFactor + 1) / 2) * (setup.hourly[1] - setup.hourly[0]), 5);
  const hourlyMaxDkk = round(hourlyMinDkk + between(...setup.spread), 5);
  const calloutDkk = setup.callout[1] > 0 && chance(0.75) ? round(between(...setup.callout), 5) : undefined;
  const hourlyMin = danish ? hourlyMinDkk : localPrice(hourlyMinDkk, market);
  const hourlyMax = danish ? hourlyMaxDkk : Math.max(hourlyMin + 1, localPrice(hourlyMaxDkk, market));
  const callout = calloutDkk === undefined ? undefined : danish ? calloutDkk : localPrice(calloutDkk, market);

  const jobOrder = shuffleIndices(JOBS[category].length).slice(0, Math.min(4, JOBS[category].length));
  const examples = jobOrder.map((i) => {
    const [job, label, unit, min, max] = JOBS[category][i];
    const factor = 1 + 0.18 * priceFactor;
    const step = max >= 5000 ? 100 : max >= 1000 ? 50 : 10;
    const lowDkk = round(min * factor * between(0.94, 1.04), step);
    const highDkk = Math.max(lowDkk + step, round(max * factor * between(0.94, 1.04), step));
    if (danish) return { job, label, min: lowDkk, max: highDkk, unit };
    const low = localPrice(lowDkk, market);
    return { job, label, min: low, max: Math.max(low + 1, localPrice(highDkk, market)), unit };
  });

  const hasTrustpilot = chance(0.9);
  const score = Math.round((3.6 + 1.3 * quality) * 10) / 10;
  const reviews = Math.round(Math.exp(between(Math.log(6), Math.log(900))));
  const slug = slugify(name, danish ? 'og' : 'and');
  const founded = int(1978, 2022);
  const auth = danish ? setup.auth.map((kind) => ({ kind, number: String(int(10000, 99999)) })) : market.auth(category, int);
  if (danish && category === 'vvs') {
    if (chance(0.4)) auth.push({ kind: 'kloak', number: String(int(10000, 99999)) });
    if (chance(0.3)) auth.push({ kind: 'gas', number: String(int(10000, 99999)) });
  }
  const [membership, membershipChance] = danish ? setup.membership : [market.memberships[category] ?? '', 0.6];
  const consentDay = int(1, 30);
  // Same order of random draws as before the English texts were added, so the Danish data does not change.
  const taglineIndex = pickIndex(setup.taglines.length);
  const cvr = danish ? fakeCvr(int) : market.registry(int);
  const streets = danish ? STREETS : market.streets;
  const streetName = streets[pickIndex(streets.length)];
  const houseNumber = int(2, 88);
  const coords = { lat: Number((lat + between(-0.012, 0.012)).toFixed(5)), lon: Number((lon + between(-0.02, 0.02)).toFixed(5)) };
  const serviceRadiusKm = [15, 20, 25, 30, 40][pickIndex(5)];
  const phone = danish ? fakePhone(int) : market.phone(int);
  const updatedPricing = isoDay(10, int(1, 15));
  const trustpilotDay = hasTrustpilot ? isoDay(10, int(10, 18)) : undefined;
  const memberships = membership && chance(membershipChance) ? [membership] : [];
  const serviceOrder = shuffleIndices(setup.services.length).slice(0, int(4, 6));
  const hours = hoursFor(category, chance);
  const emergency = chance(setup.emergency);
  const responseIndex = pickIndex(RESPONSE_TIMES.length);
  const employees = EMPLOYEES[pickIndex(EMPLOYEES.length)];
  const updatedAt = isoDay(10, int(10, 18));

  const da = {
    tagline: setup.taglines[taglineIndex],
    description: `${name} er et ${setup.about} Etableret i ${founded}.`,
    services: serviceOrder.map((i) => setup.services[i]),
    responseTime: RESPONSE_TIMES[responseIndex],
  };
  const en = {
    tagline: english.taglines[taglineIndex],
    description: `${name} is a ${english.about} Founded in ${founded}.`,
    services: serviceOrder.map((i) => english.services[i]),
    responseTime: RESPONSE_TIMES_EN[responseIndex],
  };
  // Danish businesses write in Danish, the others in English; both get the other language as a translation.
  const own = danish ? da : en;

  return {
    id: slug,
    name,
    ...(danish ? {} : { country: market.country }),
    categories: category === 'toemrer' && index % 5 === 4 ? ['toemrer', 'tagdaekker'] : [category],
    tagline: own.tagline,
    description: own.description,
    cvr,
    address: { street: market.streetFirst ? `${houseNumber} ${streetName}` : `${streetName} ${houseNumber}`, postalCode, city },
    coords,
    serviceRadiusKm,
    contact: { phone, website: `https://${slug}.example` },
    pricing: {
      hourlyMin,
      hourlyMax,
      ...(callout ? { calloutFee: callout } : {}),
      examples,
      ...(danish ? {} : { currency: market.currency }),
      updatedAt: updatedPricing,
    },
    ...(hasTrustpilot
      ? {
          trustpilot: {
            score,
            reviews,
            url: `https://${danish ? 'dk' : market.trustpilot}.trustpilot.com/review/${slug}.example`,
            updatedAt: trustpilotDay,
          },
        }
      : {}),
    authorizations: auth,
    memberships,
    services: own.services,
    hours,
    emergency,
    responseTime: own.responseTime,
    founded,
    employees,
    photo,
    consent: { date: isoDay(9, consentDay), contact: 'Demo' },
    translations: danish ? { en } : { da },
    demo: true,
    updatedAt,
  };
}

/**
 * Demo cities abroad. Everything is fictional: phone numbers come from ranges
 * reserved for drama and examples (UK 07700 900xxx, Sweden 070-1740 6xx) or are invalid (Norway and Germany starting with 0), and company
 * numbers are made up. Prices are the Danish ones converted with fromDkk
 * (kept in sync with src/lib/markets.ts).
 */
const TRADE_WORDS = {
  en: { vvs: 'Plumbing & Heating', elektriker: 'Electrical', toemrer: 'Carpentry', murer: 'Brickwork & Tiling', mekaniker: 'Motors', maler: 'Decorators', tagdaekker: 'Roofing', laasesmed: 'Locksmiths' },
  de: { vvs: 'Haustechnik', elektriker: 'Elektrotechnik', toemrer: 'Zimmerei', murer: 'Maurerbetrieb', mekaniker: 'Kfz-Werkstatt', maler: 'Malerbetrieb', tagdaekker: 'Dachdeckerei', laasesmed: 'Schlüsseldienst' },
  se: { vvs: 'VVS', elektriker: 'El', toemrer: 'Snickeri', murer: 'Mureri', mekaniker: 'Bilverkstad', maler: 'Måleri', tagdaekker: 'Tak', laasesmed: 'Lås' },
  no: { vvs: 'Rør', elektriker: 'Elektro', toemrer: 'Snekkeri', murer: 'Mur', mekaniker: 'Bilverksted', maler: 'Maler', tagdaekker: 'Tak', laasesmed: 'Låsservice' },
};

const digits = (int, n) => Array.from({ length: n }, () => int(0, 9)).join('');

const ABROAD = [
  {
    country: 'SE', currency: 'SEK', fromDkk: 1.45, trustpilot: 'se', words: TRADE_WORDS.se,
    prefixes: ['Kopparkällan', 'Ljusgnistan', 'Ekspånet', 'Tegelröd', 'Kolvverket', 'Färgklicken', 'Skifferhatten', 'Låskolven', 'Vattenfallet', 'Strömkretsen', 'Hyvelbänken', 'Kalkstenen', 'Kugghjulet', 'Penseldraget', 'Taknocken', 'Nyckelknippan', 'Rörverket', 'Gnistan', 'Bjälklaget', 'Fogmästaren', 'Vevaxeln', 'Färgglad', 'Hängrännan', 'Regelfast'],
    areas: [['Södermalm, Stockholm', '118 20', 59.315, 18.07], ['Vasastan, Stockholm', '113 21', 59.345, 18.05], ['Östermalm, Stockholm', '114 39', 59.338, 18.09], ['Kungsholmen, Stockholm', '112 21', 59.332, 18.03], ['Solna', '171 45', 59.36, 18.0], ['Nacka', '131 40', 59.31, 18.16]],
    streets: ['Industrigatan', 'Verkstadsvägen', 'Hantverkargatan', 'Smedjegatan'],
    phone: (int) => `+4670174${int(605, 699)}`,
    registry: (int) => `556${digits(int, 3)}-${digits(int, 4)}`,
    memberships: { vvs: 'Säker Vatten', elektriker: 'Installatörsföretagen', toemrer: 'Byggföretagen', murer: 'Byggföretagen', mekaniker: 'Motorbranschens Riksförbund', maler: 'Måleriföretagen', tagdaekker: 'Plåt & Ventföretagen', laasesmed: 'Sveriges Låssmeders Riksförening' },
    auth: (category, int) => (category === 'elektriker' ? [{ kind: 'el', number: `A${digits(int, 5)}` }] : []),
  },
  {
    country: 'NO', currency: 'NOK', fromDkk: 1.7, trustpilot: 'no', words: TRADE_WORDS.no,
    prefixes: ['Kobberbekken', 'Lysgnisten', 'Eikesponet', 'Teglrød', 'Stempelverket', 'Fargeklatten', 'Skiferhatten', 'Låsbolten', 'Fossefallet', 'Strømkretsen', 'Høvelbenken', 'Kalksteinen', 'Tannhjulet', 'Penselstrøket', 'Takmønet', 'Nøkkelknippet', 'Rørverket', 'Gnisten', 'Bjelkelaget', 'Fugemesteren', 'Veivakselen', 'Fargeglad', 'Takrenna', 'Regelfast'],
    areas: [['Grünerløkka, Oslo', '0552', 59.925, 10.76], ['Frogner, Oslo', '0263', 59.92, 10.71], ['Majorstuen, Oslo', '0367', 59.93, 10.715], ['Gamle Oslo', '0656', 59.905, 10.78], ['Nordstrand, Oslo', '1170', 59.86, 10.8], ['Sagene, Oslo', '0461', 59.94, 10.755]],
    streets: ['Industriveien', 'Verkstedveien', 'Håndverkerveien', 'Smiegata'],
    phone: (int) => `+4700${digits(int, 6)}`,
    registry: (int) => `9${digits(int, 2)} ${digits(int, 3)} ${digits(int, 3)}`,
    memberships: { vvs: 'Rørentreprenørene Norge', elektriker: 'Nelfo', toemrer: 'Mesterbrev', murer: 'Mesterbrev', mekaniker: 'Norges Bilbransjeforbund', maler: 'Mesterbrev', tagdaekker: 'Mesterbrev', laasesmed: 'Mesterbrev' },
    auth: (category, int) => (category === 'elektriker' ? [{ kind: 'el', number: `DSB-${digits(int, 6)}` }] : []),
  },
  {
    country: 'DE', currency: 'EUR', fromDkk: 0.13, trustpilot: 'de', words: TRADE_WORDS.de,
    prefixes: ['Kupferquelle', 'Lichtfunke', 'Eichenspan', 'Ziegelrot', 'Kolbenwerk', 'Farbtupfer', 'Schieferhut', 'Riegelfest', 'Wasserlauf', 'Stromkreis', 'Hobelbank', 'Kalkstein', 'Zahnrad', 'Pinselstrich', 'Dachfirst', 'Schlüsselbund', 'Rohrwerk', 'Funkenflug', 'Balkenwerk', 'Fugenmeister', 'Kurbelwelle', 'Farbenfroh', 'Regenrinne', 'Schließwerk'],
    areas: [['Mitte, Berlin', '10117', 52.52, 13.405], ['Prenzlauer Berg, Berlin', '10437', 52.54, 13.42], ['Kreuzberg, Berlin', '10997', 52.497, 13.41], ['Neukölln, Berlin', '12043', 52.48, 13.435], ['Charlottenburg, Berlin', '10585', 52.505, 13.3], ['Friedrichshain, Berlin', '10245', 52.515, 13.454]],
    streets: ['Gewerbestraße', 'Handwerkerweg', 'Werkstattstraße', 'Industriestraße'],
    phone: (int) => `+49030${digits(int, 7)}`,
    registry: (int) => `HRB ${digits(int, 6)} B`,
    memberships: { vvs: 'Handwerkskammer Berlin', elektriker: 'Handwerkskammer Berlin', toemrer: 'Handwerkskammer Berlin', murer: 'Handwerkskammer Berlin', mekaniker: 'Kfz-Innung Berlin', maler: 'Handwerkskammer Berlin', tagdaekker: 'Handwerkskammer Berlin', laasesmed: 'Handwerkskammer Berlin' },
    auth: () => [],
  },
  {
    country: 'GB', currency: 'GBP', fromDkk: 0.115, trustpilot: 'uk', words: TRADE_WORDS.en,
    prefixes: ['Copperleaf', 'Brightwire', 'Oakgrain', 'Redkiln', 'Torquelane', 'Freshcoat', 'Slatecrest', 'Keyhaven', 'Tidewell', 'Ambervolt', 'Larchwood', 'Flintmoor', 'Gearwright', 'Hueberry', 'Ridgeline', 'Latchley', 'Millbrook', 'Sparkhill', 'Timberline', 'Mortarby', 'Pistonbay', 'Brushfield', 'Eavesford', 'Boltwise'],
    areas: [['Islington, London', 'N1 8', 51.538, -0.103], ['Camden, London', 'NW1 7', 51.539, -0.143], ['Hackney, London', 'E8 1', 51.545, -0.055], ['Brixton, London', 'SW2 1', 51.462, -0.115], ['Clapham, London', 'SW4 7', 51.462, -0.138], ['Fulham, London', 'SW6 3', 51.473, -0.2], ['Greenwich, London', 'SE10 9', 51.483, 0.0]],
    streets: ['Station Road', 'Mill Lane', 'Works Yard', 'Foundry Street'],
    streetFirst: true,
    phone: (int) => `+447700900${digits(int, 3)}`,
    registry: (int) => `1${digits(int, 7)}`,
    memberships: { vvs: 'Gas Safe Register', elektriker: 'NICEIC', toemrer: 'Federation of Master Builders', murer: 'Federation of Master Builders', mekaniker: 'The Motor Ombudsman', maler: 'Painting & Decorating Association', tagdaekker: 'National Federation of Roofing Contractors', laasesmed: 'Master Locksmiths Association' },
    auth: (category, int) => (category === 'vvs' ? [{ kind: 'gas', number: digits(int, 6) }] : []),
  },
];
const PER_TRADE_ABROAD = 3;

function main() {
  const businesses = [];
  for (const category of Object.keys(CATEGORY_SETUP)) {
    const setup = CATEGORY_SETUP[category];
    const names = [...setup.names];
    let photoIndex = int(0, setup.photos.length - 1);
    let index = 0;
    for (const [cityKey, count] of Object.entries(PER_CITY)) {
      const areas = shuffle(AREAS[cityKey]).slice(0, count);
      for (const area of areas) {
        const name = names.shift();
        if (!name) throw new Error(`Not enough names for ${category}`);
        const quality = clamp(between(0, 1) ** 0.8, 0, 1);
        photoIndex = (photoIndex + 1) % setup.photos.length;
        businesses.push(buildBusiness(category, name, area, quality, setup.photos[photoIndex], index));
        index += 1;
      }
    }
  }

  // Abroad: a separate random stream, so the Danish data stays the same.
  const abroadRandom = mulberry32(20261023);
  for (const market of ABROAD) {
    // Prefixes come in rounds of one per trade, in the order of CATEGORY_SETUP.
    Object.keys(CATEGORY_SETUP).forEach((category, tradeIndex) => {
      const setup = CATEGORY_SETUP[category];
      for (let i = 0; i < PER_TRADE_ABROAD; i += 1) {
        const name = `${market.prefixes[tradeIndex + 8 * i]} ${market.words[category]}`;
        const area = market.areas[Math.floor(abroadRandom() * market.areas.length)];
        const quality = clamp(abroadRandom() ** 0.8, 0, 1);
        const photo = setup.photos[Math.floor(abroadRandom() * setup.photos.length)];
        businesses.push(buildBusiness(category, name, area, quality, photo, i, market, abroadRandom));
      }
    });
  }

  // One clearly labelled advertisement per trade in the Copenhagen demo area.
  for (const category of ['vvs', 'elektriker', 'mekaniker']) {
    const candidate = businesses.find((b) => !b.country && b.categories[0] === category && b.address.postalCode < '3000' && b.trustpilot);
    if (candidate) candidate.promoted = true;
  }

  const outPath = path.join(__dirname, '..', 'src', 'data', 'demo-businesses.json');
  fs.writeFileSync(outPath, JSON.stringify(businesses, null, 2) + '\n');
  console.log(`Wrote ${businesses.length} demo businesses to ${path.relative(process.cwd(), outPath)}`);
}

main();
