import { getLanguage } from '@/i18n';

import { COUNTRY_CODES, getMarket } from './markets';
import type { Business, CountryCode, Currency } from './types';

export function countryOf(business: Business): CountryCode {
  return business.country ?? 'DK';
}

/**
 * Countries FixMatch has businesses in. The live data may cover only some of the markets,
 * e.g. Denmark at launch; with no data at all, every market counts as open.
 */
export function openCountries(businesses: Business[]): CountryCode[] {
  const present = new Set(businesses.map(countryOf));
  const open = COUNTRY_CODES.filter((c) => present.has(c));
  return open.length > 0 ? open : COUNTRY_CODES;
}

export function currencyOf(business: Business): Currency {
  return business.pricing.currency ?? getMarket(business.country).currency;
}

/** The business's own texts in the app's language, when it has written them. */
export function businessText(business: Business) {
  const translated = business.translations?.[getLanguage()];
  return {
    tagline: translated?.tagline ?? business.tagline,
    description: translated?.description ?? business.description,
    services: translated?.services ?? business.services,
    responseTime: translated?.responseTime ?? business.responseTime,
  };
}
