import { getLanguage, msg, t } from '@/i18n';

import type { Region } from './cluster';

/**
 * The countries FixMatch lists businesses in, in launch order:
 * 1 Denmark → 2 Sweden and Norway → 3 Germany and the UK → 4 the USA.
 * Prices are compared within one country only, never across currencies.
 */

export type CountryCode = 'DK' | 'SE' | 'NO' | 'DE' | 'GB' | 'US';
export type Currency = 'DKK' | 'SEK' | 'NOK' | 'EUR' | 'GBP' | 'USD';

export interface Market {
  country: CountryCode;
  /** Danish source text for t(). */
  name: string;
  currency: Currency;
  /** Whether listed prices include VAT. US prices are listed before sales tax. */
  taxIncluded: boolean;
  distanceUnit: 'km' | 'mi';
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
  phase: 1 | 2 | 3 | 4;
}

export const MARKETS: Record<CountryCode, Market> = {
  DK: {
    country: 'DK',
    name: msg('Danmark'),
    currency: 'DKK',
    taxIncluded: true,
    distanceUnit: 'km',
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
    emergencyNumber: '999',
    region: { latitude: 54.6, longitude: -3.2, latitudeDelta: 11, longitudeDelta: 14 },
    fromDkk: 0.115,
    registryLabel: msg('Companies House-nummer'),
    registryUrl: (id) => `https://find-and-update.company-information.service.gov.uk/company/${encodeURIComponent(id)}`,
    licenceNote: msg('Gasarbejde kræver registrering i Gas Safe Register.'),
    phase: 3,
  },
  US: {
    country: 'US',
    name: msg('USA'),
    currency: 'USD',
    taxIncluded: false,
    distanceUnit: 'mi',
    emergencyNumber: '911',
    region: { latitude: 39.5, longitude: -98.5, latitudeDelta: 30, longitudeDelta: 62 },
    fromDkk: 0.17,
    registryLabel: '',
    licenceNote: msg('Krav til licens for håndværkere fastsættes af hver delstat.'),
    phase: 4,
  },
};

export const COUNTRY_CODES = Object.keys(MARKETS) as CountryCode[];

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && value in MARKETS;
}

export function getMarket(country: CountryCode | undefined): Market {
  return MARKETS[country ?? 'DK'] ?? MARKETS.DK;
}

/** The whole world, for the map's world view. */
export const WORLD_REGION: Region = { latitude: 45, longitude: -20, latitudeDelta: 70, longitudeDelta: 150 };

export function countryName(country: string): string {
  if (isCountryCode(country)) return t(MARKETS[country].name);
  // Other countries: the platform's own name for them, when it has the data.
  try {
    return new Intl.DisplayNames([getLanguage()], { type: 'region' }).of(country) ?? country;
  } catch {
    return country;
  }
}

/** "inkl. moms" / "incl. VAT", or "ekskl. skat" / "before tax" in the US. */
export function taxNote(market: Market): string {
  return market.taxIncluded ? t('inkl. moms') : t('ekskl. skat');
}
