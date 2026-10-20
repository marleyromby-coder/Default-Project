import { TRUSTPILOT_ENABLED } from './features';
import { distanceKm } from './geo';
import type { Business, CategoryId, Coords, Priorities, SortMode } from './types';

/**
 * The FixMatch score.
 *
 * Every listed business gets three part scores between 0 and 1:
 *   - price:    cheapest hourly rate among the results = 1, most expensive = 0
 *   - distance: exp(−km / DISTANCE_SCALE_KM), so 0 km = 1, 15 km ≈ 0.37
 *   - reviews:  Bayesian average of the Trustpilot score, mapped from 2.5–5.0 to 0–1
 *
 * The total is the weighted sum × 100. The user sets the weights. Payment never
 * affects the score: promoted businesses only appear in the labelled "Annonce" slot.
 * Any change here must be reflected on the "Sådan rangerer vi" page (data/content.ts).
 */

export const DISTANCE_SCALE_KM = 15;
/** Review scores at or below this count as 0 in the review part score. */
export const REVIEW_FLOOR = 2.5;
/** Number of "virtual" average reviews mixed into every score. */
export const REVIEW_PRIOR_COUNT = 20;
/** The score those virtual reviews have. */
export const REVIEW_PRIOR_MEAN = 3.9;
/** A business without a Trustpilot profile is ranked as if it had this score. */
export const NO_REVIEWS_SCORE = 3.6;

export const DEFAULT_PRIORITIES: Priorities = { price: 4, distance: 3, reviews: 5 };

export const PRIORITY_PRESETS: { id: string; label: string; priorities: Priorities }[] = [
  { id: 'balanced', label: 'Balanceret', priorities: DEFAULT_PRIORITIES },
  { id: 'cheap', label: 'Lavest pris', priorities: { price: 5, distance: 2, reviews: 2 } },
  { id: 'near', label: 'Tættest på', priorities: { price: 2, distance: 5, reviews: 2 } },
  { id: 'quality', label: 'Bedst anmeldt', priorities: { price: 2, distance: 2, reviews: 5 } },
];

export interface Weights {
  price: number;
  distance: number;
  reviews: number;
}

export function clampPriority(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function weightsFromPriorities(priorities: Priorities, reviewsEnabled = TRUSTPILOT_ENABLED): Weights {
  const price = clampPriority(priorities.price);
  const distance = clampPriority(priorities.distance);
  const reviews = reviewsEnabled ? clampPriority(priorities.reviews) : 0;
  const total = price + distance + reviews;
  return { price: price / total, distance: distance / total, reviews: reviews / total };
}

/** Midpoint of the hourly range, used to compare price levels. */
export function priceIndex(business: Business): number {
  return (business.pricing.hourlyMin + business.pricing.hourlyMax) / 2;
}

/** Trustpilot score adjusted for how many reviews it is based on. */
export function reviewValue(business: Business): number {
  const tp = business.trustpilot;
  if (!tp || tp.reviews <= 0) return NO_REVIEWS_SCORE;
  return (tp.score * tp.reviews + REVIEW_PRIOR_MEAN * REVIEW_PRIOR_COUNT) / (tp.reviews + REVIEW_PRIOR_COUNT);
}

export interface ScoreParts {
  price: number;
  distance: number;
  reviews: number;
}

export interface ScoredBusiness {
  business: Business;
  distanceKm: number;
  /** 0–100 */
  score: number;
  parts: ScoreParts;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function scoreBusinesses(
  businesses: Business[],
  origin: Coords,
  priorities: Priorities,
): ScoredBusiness[] {
  const weights = weightsFromPriorities(priorities);
  const prices = businesses.map(priceIndex);
  const cheapest = Math.min(...prices);
  const priciest = Math.max(...prices);
  const spread = priciest - cheapest;

  return businesses.map((business, index) => {
    const km = distanceKm(origin, business.coords);
    const parts: ScoreParts = {
      price: spread > 0 ? 1 - (prices[index] - cheapest) / spread : 1,
      distance: Math.exp(-km / DISTANCE_SCALE_KM),
      reviews: clamp01((reviewValue(business) - REVIEW_FLOOR) / (5 - REVIEW_FLOOR)),
    };
    const score = Math.round(
      100 * (weights.price * parts.price + weights.distance * parts.distance + weights.reviews * parts.reviews),
    );
    return { business, distanceKm: km, score, parts };
  });
}

export function sortScored(list: ScoredBusiness[], mode: SortMode): ScoredBusiness[] {
  const sorted = [...list];
  const byName = (a: ScoredBusiness, b: ScoredBusiness) => a.business.name.localeCompare(b.business.name, 'da');
  switch (mode) {
    case 'price':
      sorted.sort((a, b) => priceIndex(a.business) - priceIndex(b.business) || a.distanceKm - b.distanceKm);
      break;
    case 'distance':
      sorted.sort((a, b) => a.distanceKm - b.distanceKm || byName(a, b));
      break;
    case 'rating':
      sorted.sort((a, b) => reviewValue(b.business) - reviewValue(a.business) || a.distanceKm - b.distanceKm);
      break;
    default:
      sorted.sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm || byName(a, b));
  }
  return sorted;
}

export type PriceLevel = 1 | 2 | 3;

export const PRICE_LEVEL_LABELS: Record<PriceLevel, string> = {
  1: 'Lavt prisniveau',
  2: 'Middel prisniveau',
  3: 'Højt prisniveau',
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Price level compared with the median hourly rate of the trade (±6 %). */
export function priceLevel(business: Business, all: Business[], category?: CategoryId): PriceLevel {
  const trade = category ?? business.categories[0];
  const peers = all.filter((b) => b.categories.includes(trade)).map(priceIndex);
  if (peers.length < 3) return 2;
  const ratio = priceIndex(business) / median(peers);
  if (ratio < 0.94) return 1;
  if (ratio > 1.06) return 3;
  return 2;
}

export function matchLabel(score: number): string {
  if (score >= 85) return 'Fremragende match';
  if (score >= 70) return 'Stærkt match';
  if (score >= 55) return 'Godt match';
  return 'Muligt match';
}
