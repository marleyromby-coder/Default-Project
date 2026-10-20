import demoJson from '@/data/demo-businesses.json';
import liveJson from '@/data/live-businesses.json';

import type { Business } from './types';

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
    isString(b.cvr) &&
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

export function parseBusinesses(value: unknown): Business[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isValidBusiness).map((business) => ({
    authorizations: [],
    memberships: [],
    services: [],
    emergency: false,
    ...business,
  }));
}

export function bundledBusinesses(): Business[] {
  return parseBusinesses(DATA_MODE === 'live' ? liveJson : demoJson);
}
