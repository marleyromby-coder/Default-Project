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

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .replace(/&/g, 'og')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** An 8-digit number that fails the CVR modulus-11 check, so it can never be a real CVR. */
function fakeCvr() {
  const weights = [2, 7, 6, 5, 4, 3, 2, 1];
  for (;;) {
    const digits = String(int(10000000, 99999999)).split('').map(Number);
    const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
    if (sum % 11 !== 0) return digits.join('');
  }
}

/** Danish numbers starting with 1 are short codes, so 8-digit 10-numbers are never assigned. */
function fakePhone() {
  return `+4510${String(int(0, 999999)).padStart(6, '0')}`;
}

function hoursFor(category) {
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

function buildBusiness(category, name, area, quality, photo, index) {
  const setup = CATEGORY_SETUP[category];
  const [city, postalCode, lat, lon] = area;
  const priceFactor = clamp(0.6 * (quality - 0.5) * 2 + 0.4 * between(-1, 1), -1, 1);
  const hourlyMin = round(setup.hourly[0] + ((priceFactor + 1) / 2) * (setup.hourly[1] - setup.hourly[0]), 5);
  const hourlyMax = round(hourlyMin + between(...setup.spread), 5);
  const callout = setup.callout[1] > 0 && chance(0.75) ? round(between(...setup.callout), 5) : undefined;

  const jobs = shuffle(JOBS[category]).slice(0, Math.min(4, JOBS[category].length));
  const examples = jobs.map(([job, label, unit, min, max]) => {
    const factor = 1 + 0.18 * priceFactor;
    const step = max >= 5000 ? 100 : max >= 1000 ? 50 : 10;
    const low = round(min * factor * between(0.94, 1.04), step);
    const high = Math.max(low + step, round(max * factor * between(0.94, 1.04), step));
    return { job, label, min: low, max: high, unit };
  });

  const hasTrustpilot = chance(0.9);
  const score = Math.round((3.6 + 1.3 * quality) * 10) / 10;
  const reviews = Math.round(Math.exp(between(Math.log(6), Math.log(900))));
  const slug = slugify(name);
  const founded = int(1978, 2022);
  const auth = setup.auth.map((kind) => ({ kind, number: String(int(10000, 99999)) }));
  if (category === 'vvs') {
    if (chance(0.4)) auth.push({ kind: 'kloak', number: String(int(10000, 99999)) });
    if (chance(0.3)) auth.push({ kind: 'gas', number: String(int(10000, 99999)) });
  }
  const [membership, membershipChance] = setup.membership;
  const consentDay = int(1, 30);

  return {
    id: slug,
    name,
    categories: category === 'toemrer' && index % 5 === 4 ? ['toemrer', 'tagdaekker'] : [category],
    tagline: pick(setup.taglines),
    description: `${name} er et ${setup.about} Etableret i ${founded}.`,
    cvr: fakeCvr(),
    address: { street: `${pick(STREETS)} ${int(2, 88)}`, postalCode, city },
    coords: { lat: Number((lat + between(-0.012, 0.012)).toFixed(5)), lon: Number((lon + between(-0.02, 0.02)).toFixed(5)) },
    serviceRadiusKm: pick([15, 20, 25, 30, 40]),
    contact: { phone: fakePhone(), website: `https://${slug}.example` },
    pricing: {
      hourlyMin,
      hourlyMax,
      ...(callout ? { calloutFee: callout } : {}),
      examples,
      updatedAt: isoDay(10, int(1, 15)),
    },
    ...(hasTrustpilot
      ? { trustpilot: { score, reviews, url: `https://dk.trustpilot.com/review/${slug}.example`, updatedAt: isoDay(10, int(10, 18)) } }
      : {}),
    authorizations: auth,
    memberships: membership && chance(membershipChance) ? [membership] : [],
    services: shuffle(setup.services).slice(0, int(4, 6)),
    hours: hoursFor(category),
    emergency: chance(setup.emergency),
    responseTime: pick(RESPONSE_TIMES),
    founded,
    employees: pick(EMPLOYEES),
    photo,
    consent: { date: isoDay(9, consentDay), contact: 'Demo' },
    demo: true,
    updatedAt: isoDay(10, int(10, 18)),
  };
}

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

  // One clearly labelled advertisement per trade in the Copenhagen demo area.
  for (const category of ['vvs', 'elektriker', 'mekaniker']) {
    const candidate = businesses.find((b) => b.categories[0] === category && b.address.postalCode < '3000' && b.trustpilot);
    if (candidate) candidate.promoted = true;
  }

  const outPath = path.join(__dirname, '..', 'src', 'data', 'demo-businesses.json');
  fs.writeFileSync(outPath, JSON.stringify(businesses, null, 2) + '\n');
  console.log(`Wrote ${businesses.length} demo businesses to ${path.relative(process.cwd(), outPath)}`);
}

main();
