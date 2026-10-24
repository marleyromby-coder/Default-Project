import { getLanguage } from '@/i18n';

import { getMarket } from './markets';
import type { Business, CountryCode, Currency } from './types';

export function countryOf(business: Business): CountryCode {
  return business.country ?? 'DK';
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
