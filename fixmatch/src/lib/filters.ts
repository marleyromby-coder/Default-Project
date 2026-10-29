import { timeZoneOf } from './business-text';
import { formatRating } from './format';
import { isOpenNow } from './opening-hours';
import { priceLevel, type ScoredBusiness } from './ranking';
import type { Business, CategoryId, Filters } from './types';
import { t } from '@/i18n';

export const DEFAULT_FILTERS: Filters = {
  maxDistanceKm: 25,
  minRating: null,
  priceLevel: null,
  openNow: false,
  emergency: false,
  authorizedOnly: false,
  trustpilotOnly: false,
};

const KM_PER_MILE = 1.609344;

/** Distance chips in the market's unit: round kilometres, or round miles in the UK and the US. */
export function distanceOptions(unit: 'km' | 'mi'): { value: number | null; label: string }[] {
  const steps = unit === 'mi' ? [3, 5, 15, 30] : [5, 10, 25, 50];
  return [
    ...steps.map((n) => ({ value: unit === 'mi' ? n * KM_PER_MILE : n, label: `${n} ${unit}` })),
    { value: null, label: t('Hele landet') },
  ];
}

/** Whether a stored limit is the chip's distance, allowing for km/mile rounding (25 km ≈ 15 mi). */
export function isSameDistance(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return a === b;
  return Math.abs(a - b) <= 0.1 * Math.max(a, b);
}

export const RATING_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: t('Alle') },
  ...[3.5, 4, 4.5].map((value) => ({ value, label: `${formatRating(value)}+` })),
];

export function applyFilters(
  list: ScoredBusiness[],
  filters: Filters,
  context: { all: Business[]; category?: CategoryId; now?: Date },
): ScoredBusiness[] {
  const now = context.now ?? new Date();
  return list.filter(({ business, distanceKm }) => {
    if (filters.maxDistanceKm !== null && distanceKm > filters.maxDistanceKm) return false;
    if (filters.minRating !== null && (business.trustpilot?.score ?? 0) < filters.minRating) return false;
    if (filters.trustpilotOnly && !business.trustpilot) return false;
    if (filters.emergency && !business.emergency) return false;
    if (filters.authorizedOnly && business.authorizations.length === 0) return false;
    if (filters.openNow && !isOpenNow(business.hours, now, timeZoneOf(business)) && !business.emergency) return false;
    if (filters.priceLevel !== null && priceLevel(business, context.all, context.category) !== filters.priceLevel) {
      return false;
    }
    return true;
  });
}

/** Number of filters that differ from the defaults (shown as a badge). */
export function activeFilterCount(filters: Filters): number {
  let count = 0;
  if (filters.maxDistanceKm !== DEFAULT_FILTERS.maxDistanceKm) count += 1;
  if (filters.minRating !== null) count += 1;
  if (filters.priceLevel !== null) count += 1;
  if (filters.openNow) count += 1;
  if (filters.emergency) count += 1;
  if (filters.authorizedOnly) count += 1;
  if (filters.trustpilotOnly) count += 1;
  return count;
}
