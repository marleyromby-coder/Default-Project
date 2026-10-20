import { isOpenNow } from './opening-hours';
import { priceLevel, type ScoredBusiness } from './ranking';
import type { Business, CategoryId, Filters } from './types';

export const DEFAULT_FILTERS: Filters = {
  maxDistanceKm: 25,
  minRating: null,
  priceLevel: null,
  openNow: false,
  emergency: false,
  authorizedOnly: false,
  trustpilotOnly: false,
};

export const DISTANCE_OPTIONS: { value: number | null; label: string }[] = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: null, label: 'Hele landet' },
];

export const RATING_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Alle' },
  { value: 3.5, label: '3,5+' },
  { value: 4, label: '4,0+' },
  { value: 4.5, label: '4,5+' },
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
    if (filters.openNow && !isOpenNow(business.hours, now) && !business.emergency) return false;
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
