import type { CountryCode, Currency } from './markets';

export type { CountryCode, Currency } from './markets';

export type CategoryId =
  | 'vvs'
  | 'elektriker'
  | 'toemrer'
  | 'murer'
  | 'mekaniker'
  | 'maler'
  | 'tagdaekker'
  | 'laasesmed';

export type PriceUnit = 'opgave' | 'm2' | 'stk';

export interface JobType {
  id: string;
  name: string;
  unit: PriceUnit;
  /** Fallback range (DKK incl. VAT) used only when no listed business prices the job. */
  min: number;
  max: number;
  /** Extra words people search for, e.g. "toilet" or "wc". */
  keywords: string[];
}

export type AuthorizationKind = 'el' | 'vvs' | 'kloak' | 'gas';

export interface Category {
  id: CategoryId;
  name: string;
  plural: string;
  description: string;
  photo: string;
  jobs: JobType[];
  keywords: string[];
  /** Work that legally requires a Sikkerhedsstyrelsen authorisation in Denmark. */
  authorization?: AuthorizationKind;
}

export interface PriceExample {
  /** Matches a JobType id when the example belongs to a standard job. */
  job?: string;
  label: string;
  min: number;
  max: number;
  unit: PriceUnit;
}

export interface Pricing {
  /** Hourly rate range in DKK, including VAT (moms). */
  hourlyMin: number;
  hourlyMax: number;
  /** Fixed fee per visit (kørsel/opstart) in DKK incl. VAT, if any. */
  calloutFee?: number;
  examples: PriceExample[];
  /** Currency of every price above. Defaults to DKK. */
  currency?: Currency;
  note?: string;
  updatedAt: string;
}

export interface TrustpilotInfo {
  score: number;
  reviews: number;
  url: string;
  updatedAt: string;
}

export interface Authorization {
  kind: AuthorizationKind;
  number: string;
}

/** Opening hours from Monday (index 0) to Sunday (index 6). `null` means closed. */
export type WeekHours = ([string, string] | null)[];

/** The business's own texts in another language. */
export interface BusinessTranslation {
  tagline?: string;
  description?: string;
  services?: string[];
  responseTime?: string;
}

export interface Business {
  id: string;
  name: string;
  /** Defaults to DK. */
  country?: CountryCode;
  categories: CategoryId[];
  tagline: string;
  description: string;
  cvr: string;
  address: { street: string; postalCode: string; city: string };
  coords: { lat: number; lon: number };
  serviceRadiusKm: number;
  contact: { phone: string; website?: string; email?: string };
  pricing: Pricing;
  trustpilot?: TrustpilotInfo;
  authorizations: Authorization[];
  memberships: string[];
  services: string[];
  hours: WeekHours;
  /** IANA time zone of the opening hours, when it differs from the country's. */
  timeZone?: string;
  /** Answers the phone outside opening hours (døgnvagt). */
  emergency: boolean;
  responseTime?: string;
  founded?: number;
  employees?: string;
  /** Photo registry key (see data/photos.ts) or an https URL. */
  photo: string;
  /** Paid promotion. Shown only in the labelled "Annonce" slot, never in the ranking. */
  promoted?: boolean;
  /** The written consent FixMatch holds to show this listing. */
  consent: { date: string; contact?: string };
  /** Texts in other languages, keyed by language code ("en", "da"). */
  translations?: Partial<Record<'da' | 'en', BusinessTranslation>>;
  /** Fictional business used for demos. Contact actions are disabled. */
  demo?: boolean;
  updatedAt: string;
}

export interface Coords {
  lat: number;
  lon: number;
}

export type LocationSource = 'gps' | 'manual' | 'default';

export interface UserLocation {
  source: LocationSource;
  coords: Coords;
  label: string;
  postalCode?: string;
  /** ISO 3166-1 alpha-2, e.g. "DK" or "FR". Defaults to DK. Countries without a market show no results. */
  country?: string;
}

/** How important each factor is to the user, from 1 (not important) to 5 (very important). */
export interface Priorities {
  price: number;
  distance: number;
  reviews: number;
}

export type SortMode = 'match' | 'price' | 'distance' | 'rating';

export interface Filters {
  maxDistanceKm: number | null;
  minRating: number | null;
  priceLevel: 1 | 2 | 3 | null;
  openNow: boolean;
  emergency: boolean;
  authorizedOnly: boolean;
  trustpilotOnly: boolean;
}
