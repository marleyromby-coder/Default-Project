import { isPhotoKey } from '@/data/photos';
import demoJson from '@/data/demo-businesses.json';
import liveJson from '@/data/live-businesses.json';

import { isCountryCode, isLaunched } from './markets';
import { parseReviewLinks } from './review-links';
import type { Business, ReviewSummary } from './types';
import { isValidVerification } from './verification';

/**
 * Where business listings come from:
 *   demo – the fictional businesses in data/demo-businesses.json (default)
 *   live – the consented businesses in data/live-businesses.json, built with
 *          `npm run import:businesses`. Use this for App Store builds.
 * Set EXPO_PUBLIC_FIXMATCH_DATA in eas.json or .env to switch.
 *
 * EXPO_PUBLIC_FIXMATCH_DATA_URL may point to a hosted copy of the live JSON, so
 * listings can be updated without a new app release. The bundled file is the
 * fallback when the device is offline.
 */
export type DataMode = 'demo' | 'live';

export const DATA_MODE: DataMode = process.env.EXPO_PUBLIC_FIXMATCH_DATA === 'live' ? 'live' : 'demo';

export const REMOTE_DATA_URL: string | undefined =
  DATA_MODE === 'live' && process.env.EXPO_PUBLIC_FIXMATCH_DATA_URL?.startsWith('https://')
    ? process.env.EXPO_PUBLIC_FIXMATCH_DATA_URL
    : undefined;

const isString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** Structural check so a malformed remote file can never crash the app. */
export function isValidBusiness(value: unknown): value is Business {
  if (typeof value !== 'object' || value === null) return false;
  const b = value as Partial<Business>;
  return (
    isString(b.id) &&
    isString(b.name) &&
    Array.isArray(b.categories) &&
    b.categories.length > 0 &&
    typeof b.cvr === 'string' &&
    (b.country === undefined || isCountryCode(b.country)) &&
    typeof b.coords === 'object' &&
    isNumber(b.coords?.lat) &&
    isNumber(b.coords?.lon) &&
    typeof b.contact === 'object' &&
    isString(b.contact?.phone) &&
    typeof b.pricing === 'object' &&
    isNumber(b.pricing?.hourlyMin) &&
    isNumber(b.pricing?.hourlyMax) &&
    Array.isArray(b.pricing?.examples) &&
    Array.isArray(b.hours) &&
    b.hours.length === 7 &&
    typeof b.consent === 'object' &&
    isString(b.consent?.date)
  );
}

/** At most this many photos of finished work per business. */
export const MAX_WORK_PHOTOS = 6;

/**
 * The fields read from a data file or feed. Anything else is dropped, so an old or tampered file
 * cannot carry fields the app no longer uses (such as scores copied from other review sites).
 * `reviewSummary` is never read: FixMatch's own review numbers only come from the server.
 */
const FIELDS: Record<keyof Business, boolean> = {
  id: true,
  name: true,
  country: true,
  categories: true,
  tagline: true,
  description: true,
  cvr: true,
  address: true,
  coords: true,
  serviceRadiusKm: true,
  contact: true,
  pricing: true,
  reviewSummary: false,
  demoReviews: true,
  reviewLinks: true,
  authorizations: true,
  memberships: true,
  verified: true,
  insurer: true,
  guaranteeScheme: true,
  workPhotos: true,
  videoCheck: true,
  services: true,
  hours: true,
  timeZone: true,
  emergency: true,
  availableOn: true,
  responseTime: true,
  founded: true,
  employees: true,
  photo: true,
  promoted: true,
  consent: true,
  translations: true,
  demo: true,
  updatedAt: true,
};

function knownFields(business: Business): Business {
  return Object.fromEntries(
    Object.entries(business).filter(([key]) => FIELDS[key as keyof Business] === true),
  ) as unknown as Business;
}

/** Made-up review numbers for a demo business, if they make sense. */
function demoReviewsOf(business: Business): ReviewSummary | undefined {
  const value = business.demoReviews;
  if (business.demo !== true || typeof value !== 'object' || value === null) return undefined;
  const { average, reviews } = value;
  if (!isNumber(average) || average < 1 || average > 5) return undefined;
  if (!Number.isInteger(reviews) || reviews < 1) return undefined;
  return { average, reviews };
}

/**
 * Valid listings in the launched countries only. Live builds also drop demo records, e.g. from
 * a hosted feed. Listings for countries that are not launched yet are kept in the data for later.
 */
export function parseBusinesses(value: unknown, allowDemo = DATA_MODE === 'demo'): Business[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isValidBusiness)
    .filter((business) => isLaunched(business.country ?? 'DK'))
    .filter((business) => allowDemo || !business.demo)
    .map(knownFields)
    .map((business) => {
      const reviewLinks = parseReviewLinks(business.reviewLinks);
      return {
        ...business,
        authorizations: business.authorizations ?? [],
        memberships: business.memberships ?? [],
        services: business.services ?? [],
        emergency: business.emergency ?? false,
        // A malformed check never shows a badge; the listing itself stays.
        verified: isValidVerification(business.verified) ? business.verified : undefined,
        insurer: typeof business.insurer === 'string' && business.insurer.trim() ? business.insurer.trim() : undefined,
        videoCheck: business.videoCheck === true,
        workPhotos: Array.isArray(business.workPhotos)
          ? business.workPhotos
              .filter((p): p is string => typeof p === 'string' && (p.startsWith('https://') || isPhotoKey(p)))
              .slice(0, MAX_WORK_PHOTOS)
          : undefined,
        guaranteeScheme:
          typeof business.guaranteeScheme === 'string' && business.guaranteeScheme.trim()
            ? business.guaranteeScheme.trim()
            : undefined,
        demoReviews: demoReviewsOf(business),
        reviewLinks: reviewLinks.length > 0 ? reviewLinks : undefined,
      };
    });
}

export function bundledBusinesses(): Business[] {
  return parseBusinesses(DATA_MODE === 'live' ? liveJson : demoJson);
}
