import { getLanguage } from '@/i18n';

import type { CountryCode, Currency } from './markets';
import type { PriceUnit } from './types';

// Formatting is done by hand so output is identical on Hermes, web and Node,
// regardless of which Intl locale data a runtime ships with.

const separators = () => (getLanguage() === 'da' ? { thousands: '.', decimal: ',' } : { thousands: ',', decimal: '.' });

/** 1234 → "1.234" in Danish, "1,234" in English. */
export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, separators().thousands);
}

/** 4.7 → "4,7" in Danish, "4.7" in English. */
export function formatDecimal(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1).replace('.', separators().decimal);
}

export function formatRating(value: number): string {
  return formatDecimal(value);
}

type Affix = { prefix?: string; suffix?: string };

const CURRENCY: Record<'da' | 'en', Record<Currency, Affix>> = {
  da: {
    DKK: { suffix: ' kr.' },
    SEK: { suffix: ' SEK' },
    NOK: { suffix: ' NOK' },
    EUR: { suffix: ' €' },
    GBP: { prefix: '£' },
  },
  en: {
    DKK: { prefix: 'DKK ' },
    SEK: { prefix: 'SEK ' },
    NOK: { prefix: 'NOK ' },
    EUR: { prefix: '€' },
    GBP: { prefix: '£' },
  },
};

function money(amount: string, currency: Currency): string {
  const { prefix = '', suffix = '' } = CURRENCY[getLanguage()][currency];
  return `${prefix}${amount}${suffix}`;
}

/** "kr." for DKK in Danish, "DKK" in English, "£", "€", "$" … */
export function currencySymbol(currency: Currency): string {
  const { prefix, suffix } = CURRENCY[getLanguage()][currency];
  return (suffix ?? prefix ?? currency).trim();
}

/** 1200 → "1.200 kr.", "£1,200", "€1,200" … */
export function formatPrice(value: number, currency: Currency): string {
  return money(formatNumber(value), currency);
}

const UNIT_SUFFIX: Record<'da' | 'en', Record<PriceUnit, string>> = {
  da: { opgave: '', m2: ' pr. m²', stk: ' pr. stk.' },
  en: { opgave: '', m2: ' per m²', stk: ' each' },
};

function range(min: number, max: number): string {
  return min === max ? formatNumber(min) : `${formatNumber(min)}–${formatNumber(max)}`;
}

/** (495, 650) → "495–650 kr." or "£60–90 per m²" */
export function formatPriceRange(min: number, max: number, unit: PriceUnit, currency: Currency): string {
  return `${money(range(min, max), currency)}${UNIT_SUFFIX[getLanguage()][unit]}`;
}

/** (495, 650) → "495–650 kr./time" or "£60–90/hr" */
export function formatHourly(min: number, max: number, currency: Currency): string {
  return `${money(range(min, max), currency)}${getLanguage() === 'da' ? '/time' : '/hr'}`;
}

/** How VoiceOver should read a price: "495–650 kr./time" → "495 til 650 kroner i timen". */
export function speakablePrice(text: string): string {
  if (getLanguage() === 'da')
    return text.replace('–', ' til ').replace('kr./time', 'kroner i timen').replace('kr.', 'kroner');
  return text.replace('–', ' to ').replace('/hr', ' per hour');
}

// Miles in the UK. The app state sets this from the user's country.
let distanceUnit: 'km' | 'mi' = 'km';

export function setDistanceUnit(unit: 'km' | 'mi'): void {
  distanceUnit = unit;
}

/** 0.42 → "400 m", 2.345 → "2,3 km", 48.6 → "49 km"; in miles 2.345 → "1.5 mi" */
export function formatDistance(km: number): string {
  if (distanceUnit === 'mi') {
    const miles = km * 0.621371;
    if (miles < 10) return `${formatDecimal(Math.max(0.1, miles))} mi`;
    return `${formatNumber(miles)} mi`;
  }
  if (km < 1) {
    const meters = Math.max(50, Math.round((km * 1000) / 50) * 50);
    return meters >= 1000 ? `${formatDecimal(1)} km` : `${meters} m`;
  }
  if (km < 10) return `${formatDecimal(km)} km`;
  return `${formatNumber(km)} km`;
}

/** How numbers are grouped after the country code: "+44" → 4, 6 digits. */
const PHONE_GROUPS: Record<string, number[]> = {
  '45': [2, 2, 2, 2],
  '46': [2, 3, 2, 2],
  '47': [3, 2, 3],
  '49': [2, 4, 4],
  '44': [4, 6],
  '1': [3, 3, 4],
};

/** "+4512345678" → "+45 12 34 56 78", "+447700900123" → "+44 7700 900123" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!phone.trim().startsWith('+')) {
    // Danish numbers are stored without the country code in older data.
    if (digits.length === 8) return formatPhone(`+45${digits}`);
    return phone;
  }
  const code = ['1', '44', '45', '46', '47', '49'].find((c) => digits.startsWith(c) && PHONE_GROUPS[c]);
  if (!code) return phone;
  let rest = digits.slice(code.length);
  const parts: string[] = [];
  for (const size of PHONE_GROUPS[code]) {
    if (!rest) break;
    parts.push(rest.slice(0, size));
    rest = rest.slice(size);
  }
  if (rest) parts.push(rest);
  if (code === '1' && parts.length >= 3) return `+1 (${parts[0]}) ${parts[1]}-${parts.slice(2).join('')}`;
  return `+${code} ${parts.join(' ')}`;
}

/** A phone number to a tel: link, e.g. "tel:+4512345678". Numbers without a country code are Danish. */
export function phoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+')) return `tel:+${digits}`;
  const local = digits.length === 10 && digits.startsWith('45') ? digits.slice(2) : digits;
  return `tel:+45${local}`;
}

/** "https://www.example.dk/kontakt" → "example.dk" */
export function displayHost(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[/?#].*$/, '');
}

/** Danish CVR numbers are printed in pairs ("12 34 56 78"); other registers as given. */
export function formatRegistryNumber(id: string, country: CountryCode = 'DK'): string {
  if (country !== 'DK') return id;
  return id.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 ');
}

const MONTHS = {
  da: ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** "2026-10-14" → "14. okt. 2026" or "14 Oct 2026" */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day || month > 12) return iso;
  const language = getLanguage();
  return language === 'da' ? `${day}. ${MONTHS.da[month - 1]} ${year}` : `${day} ${MONTHS.en[month - 1]} ${year}`;
}

/** (1, "anmeldelse", "anmeldelser") → "1 anmeldelse" */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
