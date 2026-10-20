import type { PriceUnit } from './types';

// Formatting is done by hand so output is identical on Hermes, web and Node,
// regardless of which Intl locale data a runtime ships with.

/** 1234 → "1.234" (Danish thousands separator). */
export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 4.7 → "4,7", 2.345 → "2,3" */
export function formatDecimal(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1).replace('.', ',');
}

export function formatRating(value: number): string {
  return formatDecimal(value);
}

export function formatPrice(value: number): string {
  return `${formatNumber(value)} kr.`;
}

const UNIT_SUFFIX: Record<PriceUnit, string> = {
  opgave: '',
  m2: ' pr. m²',
  stk: ' pr. stk.',
};

function range(min: number, max: number): string {
  return min === max ? formatNumber(min) : `${formatNumber(min)}–${formatNumber(max)}`;
}

/** (495, 650) → "495–650 kr." */
export function formatPriceRange(min: number, max: number, unit: PriceUnit = 'opgave'): string {
  return `${range(min, max)} kr.${UNIT_SUFFIX[unit]}`;
}

/** (495, 650) → "495–650 kr./time" */
export function formatHourly(min: number, max: number): string {
  return `${range(min, max)} kr./time`;
}

/** 0.42 → "400 m", 2.345 → "2,3 km", 48.6 → "49 km" */
export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.max(50, Math.round((km * 1000) / 50) * 50);
    return meters >= 1000 ? '1,0 km' : `${meters} m`;
  }
  if (km < 10) return `${formatDecimal(km)} km`;
  return `${formatNumber(km)} km`;
}

/** "+4512345678" → "+45 12 34 56 78" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const local = digits.length === 10 && digits.startsWith('45') ? digits.slice(2) : digits;
  if (local.length !== 8) return phone;
  return `+45 ${local.replace(/(\d{2})(?=\d)/g, '$1 ')}`;
}

/** Danish number to a tel: link, e.g. "tel:+4512345678". */
export function phoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
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

/** "12345678" → "12 34 56 78" (CVR numbers are printed in pairs). */
export function formatCvr(cvr: string): string {
  return cvr.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 ');
}

const MONTHS = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];

/** "2026-10-14" → "14. okt. 2026" */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day || month > 12) return iso;
  return `${day}. ${MONTHS[month - 1]} ${year}`;
}

/** (1, "anmeldelse", "anmeldelser") → "1 anmeldelse" */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
