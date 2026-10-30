import { getLanguage, msg, t } from '@/i18n';

import type { Region } from './cluster';

/**
 * The countries FixMatch lists businesses in, in launch order:
 * 1 Denmark → 2 Sweden and Norway → 3 Germany and the UK (London first).
 * Prices are compared within one country only, never across currencies.
 */

export type CountryCode = 'DK' | 'SE' | 'NO' | 'DE' | 'GB';
export type Currency = 'DKK' | 'SEK' | 'NOK' | 'EUR' | 'GBP';

export interface Market {
  country: CountryCode;
  /** Danish source text for t(). */
  name: string;
  currency: Currency;
  /** Whether listed prices include VAT. */
  taxIncluded: boolean;
  distanceUnit: 'km' | 'mi';
  /** IANA time zone for opening hours. A business can override it. */
  timeZone: string;
  emergencyNumber: string;
  /** The whole country on the map. */
  region: Region;
  /** Converts the DKK fallback job prices in data/categories.ts to a rough local estimate. */
  fromDkk: number;
  /** Name of the business register number, Danish source text for t(). Empty: not shown. */
  registryLabel: string;
  /** Public register search for a number, if there is one. */
  registryUrl?: (id: string) => string;
  /** Where trade authorisations can be checked, Danish source text for t(). */
  licenceNote: string;
  phase: 1 | 2 | 3;
}

export const MARKETS: Record<CountryCode, Market> = {
  DK: {
    country: 'DK',
    name: msg('Danmark'),
    currency: 'DKK',
    taxIncluded: true,
    distanceUnit: 'km',
    timeZone: 'Europe/Copenhagen',
    emergencyNumber: '112',
    region: { latitude: 56.15, longitude: 11.6, latitudeDelta: 3.6, longitudeDelta: 7.4 },
    fromDkk: 1,
    registryLabel: msg('CVR-nummer'),
    registryUrl: (id) => `https://datacvr.virk.dk/soegeresultater?fritekst=${encodeURIComponent(id)}`,
    licenceNote: msg('El, VVS og kloak kræver autorisation fra Sikkerhedsstyrelsen.'),
    phase: 1,
  },
  SE: {
    country: 'SE',
    name: msg('Sverige'),
    currency: 'SEK',
    taxIncluded: true,
    distanceUnit: 'km',
    timeZone: 'Europe/Stockholm',
    emergencyNumber: '112',
    region: { latitude: 62.5, longitude: 16.5, latitudeDelta: 14, longitudeDelta: 20 },
    fromDkk: 1.45,
    registryLabel: msg('Organisationsnummer'),
    licenceNote: msg('El-arbejde kræver autorisation fra Elsäkerhetsverket.'),
    phase: 2,
  },
  NO: {
    country: 'NO',
    name: msg('Norge'),
    currency: 'NOK',
    taxIncluded: true,
    distanceUnit: 'km',
    timeZone: 'Europe/Oslo',
    emergencyNumber: '112',
    region: { latitude: 64.5, longitude: 13, latitudeDelta: 15, longitudeDelta: 26 },
    fromDkk: 1.7,
    registryLabel: msg('Organisasjonsnummer'),
    registryUrl: (id) => `https://virksomhet.brreg.no/nb/oppslag/enheter/${encodeURIComponent(id.replace(/\D/g, ''))}`,
    licenceNote: msg('El-arbejde kræver registrering hos DSB (Direktoratet for samfunnssikkerhet og beredskap).'),
    phase: 2,
  },
  DE: {
    country: 'DE',
    name: msg('Tyskland'),
    currency: 'EUR',
    taxIncluded: true,
    distanceUnit: 'km',
    timeZone: 'Europe/Berlin',
    emergencyNumber: '112',
    region: { latitude: 51.2, longitude: 10.4, latitudeDelta: 9, longitudeDelta: 12 },
    fromDkk: 0.13,
    registryLabel: msg('Handelsregister'),
    licenceNote: msg('Mange håndværk kræver optagelse i Handwerksrolle hos Handwerkskammer.'),
    phase: 3,
  },
  GB: {
    country: 'GB',
    name: msg('Storbritannien'),
    currency: 'GBP',
    taxIncluded: true,
    distanceUnit: 'mi',
    timeZone: 'Europe/London',
    emergencyNumber: '999',
    region: { latitude: 54.6, longitude: -3.2, latitudeDelta: 11, longitudeDelta: 14 },
    fromDkk: 0.115,
    registryLabel: msg('Companies House-nummer'),
    registryUrl: (id) => `https://find-and-update.company-information.service.gov.uk/company/${encodeURIComponent(id)}`,
    licenceNote: msg('Gasarbejde kræver registrering i Gas Safe Register.'),
    phase: 3,
  },
};

export const COUNTRY_CODES = Object.keys(MARKETS) as CountryCode[];

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && value in MARKETS;
}

export function getMarket(country: CountryCode | undefined): Market {
  return MARKETS[country ?? 'DK'] ?? MARKETS.DK;
}

/** Every country FixMatch is in, from the UK to Norway, for the map's "all countries" view. */
export const MARKETS_REGION: Region = { latitude: 57, longitude: 9, latitudeDelta: 30, longitudeDelta: 44 };

export function countryName(country: string): string {
  if (isCountryCode(country)) return t(MARKETS[country].name);
  // Other countries: the platform's own name for them, when it has the data.
  try {
    return new Intl.DisplayNames([getLanguage()], { type: 'region' }).of(country) ?? country;
  } catch {
    return country;
  }
}

/** "inkl. moms" / "incl. VAT", or "ekskl. moms" / "excl. VAT" for prices listed before VAT. */
export function taxNote(market: Market): string {
  return market.taxIncluded ? t('inkl. moms') : t('ekskl. moms');
}
