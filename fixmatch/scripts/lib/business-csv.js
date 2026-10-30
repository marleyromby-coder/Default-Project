/**
 * Converts the team's business spreadsheet (CSV exported from Google Sheets or
 * Excel) into the JSON the app reads. Pure functions, so they can be tested.
 */

const CATEGORY_IDS = ['vvs', 'elektriker', 'toemrer', 'murer', 'mekaniker', 'maler', 'tagdaekker', 'laasesmed'];

/** Names people may type in the sheet, mapped to category ids. */
const CATEGORY_ALIASES = {
  vvs: 'vvs', "vvs'er": 'vvs', vvser: 'vvs', blikkenslager: 'vvs',
  el: 'elektriker', elektriker: 'elektriker', elinstallatoer: 'elektriker',
  toemrer: 'toemrer', tomrer: 'toemrer', snedker: 'toemrer',
  murer: 'murer',
  mekaniker: 'mekaniker', autovaerksted: 'mekaniker', vaerksted: 'mekaniker',
  maler: 'maler',
  tagdaekker: 'tagdaekker', tag: 'tagdaekker',
  laasesmed: 'laasesmed',
};

const AUTHORIZATION_KINDS = ['el', 'vvs', 'kloak', 'gas'];

// Danish and English day names, so businesses abroad can write "Mon-Fri 07-16".
const DAY_NAMES = {
  man: 0, tir: 1, ons: 2, tor: 3, fre: 4, loer: 5, lor: 5, soen: 6, son: 6,
  mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
};

/**
 * The countries FixMatch is in (src/lib/markets.ts): calling code, currency, prices relative
 * to DKK, and rough borders [south, north, west, east] to catch swapped coordinates.
 */
const COUNTRIES = {
  DK: { code: '45', currency: 'DKK', fromDkk: 1, box: [54.4, 57.9, 7.9, 15.3] },
  SE: { code: '46', currency: 'SEK', fromDkk: 1.45, box: [55, 69.1, 10.9, 24.2] },
  NO: { code: '47', currency: 'NOK', fromDkk: 1.7, box: [57.9, 71.2, 4.5, 31.2] },
  DE: { code: '49', currency: 'EUR', fromDkk: 0.13, box: [47.2, 55.1, 5.8, 15.1] },
  GB: { code: '44', currency: 'GBP', fromDkk: 0.115, box: [49.8, 60.9, -8.7, 1.8] },
};

function fold(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function slugify(name) {
  return fold(name)
    .replace(/&/g, 'og')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** RFC 4180 CSV parser. Detects ";" (Danish Excel) or "," as the separator. */
function parseCsv(text) {
  const source = text.replace(/^﻿/, '');
  const firstLine = source.split(/\r?\n/, 1)[0] ?? '';
  const separator = (firstLine.match(/;/g) ?? []).length >= (firstLine.match(/,/g) ?? []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === separator) {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ''));
  if (nonEmpty.length === 0) return [];
  const header = nonEmpty[0].map((h) => fold(h).replace(/\s+/g, '_'));
  return nonEmpty.slice(1).map((cells) => Object.fromEntries(header.map((key, i) => [key, (cells[i] ?? '').trim()])));
}

/**
 * Danish spreadsheet numbers: "1.200 kr." is 1200 and "4,5" is 4.5. Coordinates and scores
 * are never in the thousands, so for those (`decimal`) a dot is always a decimal point:
 * "55.676" is 55.676, not 55676.
 */
function toNumber(value, { decimal = false } = {}) {
  if (value === undefined || value === '') return undefined;
  let normalized = String(value).replace(/\s/g, '').replace(/kr\.?/i, '');
  if (!decimal) normalized = normalized.replace(/\.(?=\d{3}\b)/g, '');
  const number = Number(normalized.replace(',', '.'));
  return Number.isFinite(number) ? number : NaN;
}

function yes(value) {
  return ['ja', 'j', 'yes', 'y', 'x', '1', 'true', 'sand'].includes(fold(value));
}

/** CVR numbers use a modulus-11 check digit. */
function isValidCvr(cvr) {
  if (!/^\d{8}$/.test(cvr)) return false;
  const weights = [2, 7, 6, 5, 4, 3, 2, 1];
  const sum = cvr.split('').reduce((acc, digit, i) => acc + Number(digit) * weights[i], 0);
  return sum % 11 === 0;
}

/** "020 7946 0000" in the UK → "+442079460000". Numbers with + or 00 keep their country code. */
function normalizeIntlPhone(value, code) {
  const raw = String(value ?? '').trim();
  let digits = raw.replace(/\D/g, '');
  if (raw.startsWith('00')) digits = digits.slice(2);
  else if (!raw.startsWith('+')) digits = code + digits.replace(/^0/, '');
  return /^\d{8,15}$/.test(digits) && digits.startsWith(code) ? `+${digits}` : undefined;
}

function normalizePhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  const local = digits.length === 10 && digits.startsWith('45') ? digits.slice(2) : digits;
  return /^[2-9]\d{7}$/.test(local) ? `+45${local}` : undefined;
}

/** "man-tor 07:00-15:30; fre 07-14; lør lukket" → 7 slots, Monday first. */
function parseHours(value, errors) {
  const week = [null, null, null, null, null, null, null];
  if (!value) return week;
  for (const part of String(value).split(/[;\n]/)) {
    const text = fold(part);
    if (!text) continue;
    const match = text.match(/^([a-z]+)(?:\s*-\s*([a-z]+))?\s+(.+)$/);
    if (!match) {
      errors.push(`Åbningstider: kan ikke læse "${part.trim()}"`);
      continue;
    }
    const from = DAY_NAMES[match[1].slice(0, 4)] ?? DAY_NAMES[match[1].slice(0, 3)];
    const to = match[2] ? (DAY_NAMES[match[2].slice(0, 4)] ?? DAY_NAMES[match[2].slice(0, 3)]) : from;
    if (from === undefined || to === undefined) {
      errors.push(`Åbningstider: ukendt dag i "${part.trim()}"`);
      continue;
    }
    let slot = null;
    if (!/lukket|closed/.test(match[3])) {
      const times = match[3].match(/^(\d{1,2})(?:[:.](\d{2}))?\s*-\s*(\d{1,2})(?:[:.](\d{2}))?$/);
      if (!times) {
        errors.push(`Åbningstider: kan ikke læse tiden i "${part.trim()}"`);
        continue;
      }
      const fromMinutes = Number(times[1]) * 60 + Number(times[2] ?? 0);
      const toMinutes = Number(times[3]) * 60 + Number(times[4] ?? 0);
      if (Number(times[2] ?? 0) > 59 || Number(times[4] ?? 0) > 59 || fromMinutes >= 24 * 60 || toMinutes > 24 * 60) {
        errors.push(`Åbningstider: ugyldigt klokkeslæt i "${part.trim()}"`);
        continue;
      }
      if (fromMinutes >= toMinutes) {
        errors.push(`Åbningstider: lukketiden skal være efter åbningstiden i "${part.trim()}". Er der åbent om natten, så sæt doegnvagt=ja.`);
        continue;
      }
      const pad = (h, m) => `${String(Number(h)).padStart(2, '0')}:${m ?? '00'}`;
      slot = [pad(times[1], times[2]), pad(times[3], times[4])];
    }
    for (let day = from; day <= to; day += 1) week[day] = slot;
  }
  return week;
}

/** "Stoppet afløb=1200-2500; Nyt trægulv=350-650/m2" */
function parseExamples(value, jobsByCategory, categories, errors) {
  if (!value) return [];
  const examples = [];
  for (const part of String(value).split(/[;\n]/)) {
    if (!part.trim()) continue;
    const match = part.match(/^(.+?)=\s*([\d.\s]+)\s*-\s*([\d.\s]+)\s*(?:kr\.?)?\s*(?:\/\s*(m2|m²|stk))?\s*$/i);
    if (!match) {
      errors.push(`Prisexempler: kan ikke læse "${part.trim()}" (brug fx "Stoppet afløb=1200-2500")`);
      continue;
    }
    const label = match[1].trim();
    const min = toNumber(match[2]);
    const max = toNumber(match[3]);
    const unit = match[4] ? (fold(match[4]).startsWith('stk') ? 'stk' : 'm2') : 'opgave';
    if (!(min > 0) || !(max >= min)) {
      errors.push(`Prisexempler: ugyldigt prisinterval i "${part.trim()}"`);
      continue;
    }
    const wanted = fold(label);
    const job = categories
      .flatMap((c) => jobsByCategory[c] ?? [])
      .find((j) => fold(j.name) === wanted || j.keywords.some((k) => wanted.includes(fold(k))));
    examples.push({ ...(job && job.unit === unit ? { job: job.id } : {}), label, min, max, unit });
  }
  return examples;
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * Converts one spreadsheet row. Returns { business, errors, warnings }.
 * A row with errors must not be published.
 */
function rowToBusiness(row, context) {
  const { places, cities = [], jobsByCategory, photoKeys, today } = context;
  const errors = [];
  const warnings = [];

  // Denmark unless the "land" column says otherwise (sign-ups from business_signups_export).
  const country = String(row.land ?? '').trim().toUpperCase() || 'DK';
  const market = COUNTRIES[country] ?? COUNTRIES.DK;
  if (!COUNTRIES[country]) errors.push(`Land skal være ${Object.keys(COUNTRIES).join(', ')}`);
  const abroad = country !== 'DK';

  const name = row.navn;
  if (!name) errors.push('Navn mangler');

  const categories = [];
  for (const raw of String(row.kategorier ?? '').split(/[|,/]/)) {
    const key = fold(raw).replace(/\s+/g, '');
    if (!key) continue;
    const id = CATEGORY_ALIASES[key] ?? (CATEGORY_IDS.includes(key) ? key : undefined);
    if (id) categories.push(id);
    else errors.push(`Ukendt kategori "${raw.trim()}" (brug ${CATEGORY_IDS.join(', ')})`);
  }
  if (categories.length === 0) errors.push('Mindst én kategori skal angives');

  const cvr = abroad ? String(row.cvr ?? '').trim() : String(row.cvr ?? '').replace(/\D/g, '');
  if (abroad) {
    if (cvr.replace(/\W/g, '').length < 4) errors.push('Registreringsnummer mangler');
  } else if (!/^\d{8}$/.test(cvr)) errors.push('CVR skal være 8 cifre');
  else if (!isValidCvr(cvr)) warnings.push('CVR-nummeret består ikke kontrolcifferet – tjek det i CVR');

  const phone = abroad ? normalizeIntlPhone(row.telefon, market.code) : normalizePhone(row.telefon);
  if (!phone && abroad) errors.push(`Telefonnummer skal være et gyldigt nummer i ${country} (landekode +${market.code})`);
  else if (!phone) errors.push('Telefonnummer skal være et dansk nummer med 8 cifre');

  const website = row.hjemmeside ? (/^https?:\/\//.test(row.hjemmeside) ? row.hjemmeside : `https://${row.hjemmeside}`) : undefined;
  if (website && !/^https:\/\/[^\s.]+\.[^\s]+$/.test(website)) errors.push('Hjemmeside skal være en gyldig https-adresse');

  const hourlyMin = toNumber(row.timepris_min);
  const hourlyMax = toNumber(row.timepris_max) ?? hourlyMin;
  const [lowest, highest] = [100, 3000].map((dkk) => Math.round(dkk * market.fromDkk));
  if (!(hourlyMin >= lowest && hourlyMin <= highest)) {
    errors.push(`Timepris (min) skal være et tal mellem ${lowest} og ${highest} ${market.currency} inkl. moms`);
  }
  if (!(hourlyMax >= hourlyMin)) errors.push('Timepris (max) skal være mindst lige så høj som timepris (min)');
  const calloutFee = toNumber(row.koerselsgebyr);
  if (Number.isNaN(calloutFee)) errors.push('Kørselsgebyr skal være et tal');

  const postalCode = String(row.postnummer ?? '').trim();
  // Danish postcodes give the town and a midpoint; abroad the town is looked up by name.
  const city = abroad ? cities.find(([name, code]) => code === country && fold(name) === fold(row.by)) : undefined;
  const place = abroad
    ? city && { name: city[0], lat: city[2], lon: city[3] }
    : places.find((p) => {
        const value = Number(postalCode);
        return value >= Number(p.code) && value <= Number(p.to ?? p.code);
      });
  if (abroad) {
    if (postalCode.length < 3) errors.push('Postnummer mangler');
    if (!row.by) errors.push('By mangler');
  } else if (!/^\d{4}$/.test(postalCode) || !place) errors.push('Postnummer skal være et gyldigt dansk postnummer');

  let lat = toNumber(row.breddegrad, { decimal: true });
  let lon = toNumber(row.laengdegrad, { decimal: true });
  const [south, north, west, east] = market.box;
  if (lat === undefined || lon === undefined) {
    if (place) {
      lat = place.lat;
      lon = place.lon;
      warnings.push(
        abroad
          ? 'Ingen koordinater – bruger byens midtpunkt. Afstande bliver omtrentlige; tilføj breddegrad og længdegrad.'
          : 'Ingen koordinater – bruger postnummerets midtpunkt. Afstande bliver omtrentlige.',
      );
    } else if (abroad) {
      errors.push(`Byen "${row.by ?? ''}" findes ikke i listen – udfyld breddegrad og laengdegrad`);
    }
  } else if (!(lat >= south && lat <= north && lon >= west && lon <= east)) {
    errors.push(`Koordinaterne ligger ikke i ${country} (breddegrad ca. ${south}–${north}, længdegrad ca. ${west}–${east})`);
  }

  let trustpilot;
  if (row.trustpilot_score || row.trustpilot_url) {
    const score = toNumber(row.trustpilot_score, { decimal: true });
    const reviews = toNumber(row.trustpilot_antal);
    const url = row.trustpilot_url;
    if (!(score >= 1 && score <= 5)) errors.push('Trustpilot-score skal være mellem 1 og 5');
    if (!(reviews >= 0)) errors.push('Antal Trustpilot-anmeldelser skal være et tal');
    if (!/^https:\/\/([a-z]+\.)?trustpilot\.com\//.test(url ?? '')) errors.push('Trustpilot-link skal starte med https://dk.trustpilot.com/');
    const updatedAt = row.trustpilot_opdateret || today;
    if (!isIsoDate(updatedAt)) errors.push('Trustpilot opdateret skal være en dato (ÅÅÅÅ-MM-DD)');
    trustpilot = { score, reviews, url, updatedAt };
  }

  const authorizations = [];
  for (const part of String(row.autorisationer ?? '').split(/[|,;]/)) {
    if (!part.trim()) continue;
    const [kind, number] = part.split(':').map((x) => x.trim());
    if (!AUTHORIZATION_KINDS.includes(fold(kind)) || !number) {
      errors.push(`Autorisation "${part.trim()}" skal skrives som type:nummer, fx vvs:12345 (typer: ${AUTHORIZATION_KINDS.join(', ')})`);
    } else {
      authorizations.push({ kind: fold(kind), number });
    }
  }
  // Sikkerhedsstyrelsen's authorisations only exist in Denmark.
  if (!abroad && categories.includes('elektriker') && !authorizations.some((a) => a.kind === 'el')) {
    warnings.push('Elektriker uden el-autorisation – tjek Sikkerhedsstyrelsens register');
  }
  if (!abroad && categories.includes('vvs') && !authorizations.some((a) => a.kind === 'vvs')) {
    warnings.push("VVS'er uden VVS-autorisation – tjek Sikkerhedsstyrelsens register");
  }

  const consentDate = row.samtykke_dato;
  if (!isIsoDate(consentDate ?? '')) {
    errors.push('Samtykke mangler: udfyld samtykke_dato (ÅÅÅÅ-MM-DD), når virksomheden har underskrevet');
  }

  const photo = row.billede || '';
  if (photo && !photoKeys.includes(photo) && !/^https:\/\//.test(photo)) {
    errors.push('Billede skal være en foto-nøgle (fx vvs-1) eller en https-adresse');
  }

  const hours = parseHours(row.aabningstider, errors);
  const examples = parseExamples(row.prisexempler, jobsByCategory, categories, errors);
  const founded = toNumber(row.etableret);
  const radius = toNumber(row.koereradius_km);

  const business = {
    id: slugify(name || cvr),
    name,
    ...(abroad ? { country } : {}),
    categories,
    tagline: row.kort_beskrivelse || '',
    description: row.beskrivelse || '',
    cvr,
    address: { street: row.adresse || '', postalCode, city: row.by || place?.name || '' },
    coords: { lat, lon },
    serviceRadiusKm: radius > 0 ? radius : 25,
    contact: { phone, ...(website ? { website } : {}), ...(row.email ? { email: row.email } : {}) },
    pricing: {
      hourlyMin,
      hourlyMax,
      ...(calloutFee > 0 ? { calloutFee } : {}),
      examples,
      ...(abroad ? { currency: market.currency } : {}),
      updatedAt: row.priser_opdateret && isIsoDate(row.priser_opdateret) ? row.priser_opdateret : today,
    },
    ...(trustpilot ? { trustpilot } : {}),
    authorizations,
    memberships: String(row.medlemskaber ?? '').split('|').map((x) => x.trim()).filter(Boolean),
    services: String(row.ydelser ?? '').split('|').map((x) => x.trim()).filter(Boolean),
    hours,
    emergency: yes(row.doegnvagt),
    ...(row.svartid ? { responseTime: row.svartid } : {}),
    ...(founded > 1800 ? { founded } : {}),
    ...(row.ansatte ? { employees: row.ansatte } : {}),
    photo: photo || `${categories[0] === 'elektriker' ? 'el' : (categories[0] ?? 'vvs')}-1`,
    ...(yes(row.annonce) ? { promoted: true } : {}),
    consent: { date: consentDate, ...(row.samtykke_kontakt ? { contact: row.samtykke_kontakt } : {}) },
    updatedAt: today,
  };

  return { business, errors, warnings };
}

module.exports = { parseCsv, rowToBusiness, parseHours, isValidCvr, normalizePhone, slugify, fold, toNumber, CATEGORY_IDS };
