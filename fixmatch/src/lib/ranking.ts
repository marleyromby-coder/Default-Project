import { distanceKm } from './geo';
import type { Business, CategoryId, Coords, Priorities, SortMode } from './types';
import { t } from '@/i18n';

/**
 * The FixMatch score.
 *
 * Every listed business gets three part scores between 0 and 1:
 *   - price:    cheapest hourly rate among the results = 1, most expensive = 0
 *   - distance: exp(−km / DISTANCE_SCALE_KM), so 0 km = 1, 15 km ≈ 0.37
 *   - reviews:  Bayesian average of FixMatch's own reviews (from users who contacted the business
 *               through FixMatch), mapped from 2.5–5.0 to 0–1. No reviews counts as the prior.
 *
 * The total is the weighted sum × 100. The user sets the weights. Payment never
 * affects the score: promoted businesses only appear in the labelled "Annonce" slot.
 * Any change here must be reflected on the "Sådan rangerer vi" page (data/content.ts).
 */

export const DISTANCE_SCALE_KM = 15;
/** Review scores at or below this count as 0 in the review part score. */
export const REVIEW_FLOOR = 2.5;
/** Number of "virtual" average reviews mixed into every score. */
export const REVIEW_PRIOR_COUNT = 5;
/** The stars those virtual reviews have. A business without reviews counts as exactly this. */
export const REVIEW_PRIOR_MEAN = 4.0;

export const DEFAULT_PRIORITIES: Priorities = { price: 4, distance: 3, reviews: 3 };

export const PRIORITY_PRESETS: { id: string; label: string; priorities: Priorities }[] = [
  { id: 'balanced', label: t('Balanceret'), priorities: DEFAULT_PRIORITIES },
  { id: 'cheap', label: t('Lavest pris'), priorities: { price: 5, distance: 2, reviews: 2 } },
  { id: 'near', label: t('Tættest på'), priorities: { price: 2, distance: 5, reviews: 2 } },
  { id: 'quality', label: t('Bedst anmeldt'), priorities: { price: 2, distance: 2, reviews: 5 } },
];

/** The weights as text, e.g. "Pris 40 % · Afstand 30 % · Anmeldelser 30 %". */
export function weightsText(weights: Weights, spoken = false): string {
  const values = {
    price: Math.round(weights.price * 100),
    distance: Math.round(weights.distance * 100),
    reviews: Math.round(weights.reviews * 100),
  };
  return spoken
    ? t('pris {price} procent, afstand {distance} procent, anmeldelser {reviews} procent', values)
    : t('Pris {price} % · Afstand {distance} % · Anmeldelser {reviews} %', values);
}

export interface Weights {
  price: number;
  distance: number;
  reviews: number;
}

export function clampPriority(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function weightsFromPriorities(priorities: Priorities): Weights {
  const price = clampPriority(priorities.price);
  const distance = clampPriority(priorities.distance);
  const reviews = clampPriority(priorities.reviews);
  const total = price + distance + reviews;
  return { price: price / total, distance: distance / total, reviews: reviews / total };
}

/** Midpoint of the hourly range, used to compare price levels. */
export function priceIndex(business: Business): number {
  return (business.pricing.hourlyMin + business.pricing.hourlyMax) / 2;
}

/** Number of FixMatch reviews behind the business's average. */
export function reviewCount(business: Business): number {
  const count = business.reviewSummary?.reviews ?? 0;
  return Number.isFinite(count) && count > 0 ? count : 0;
}

/**
 * The average stars from FixMatch's own reviews, pulled towards REVIEW_PRIOR_MEAN by
 * REVIEW_PRIOR_COUNT virtual reviews, so a few reviews cannot give an extreme score.
 * Without reviews this is exactly the prior: neither better nor worse than average.
 */
export function reviewValue(business: Business): number {
  const count = reviewCount(business);
  const average = business.reviewSummary?.average;
  if (count === 0 || average === undefined || !Number.isFinite(average)) return REVIEW_PRIOR_MEAN;
  return (average * count + REVIEW_PRIOR_MEAN * REVIEW_PRIOR_COUNT) / (count + REVIEW_PRIOR_COUNT);
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

export function scoreBusinesses(businesses: Business[], origin: Coords, priorities: Priorities): ScoredBusiness[] {
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
      // Businesses without reviews come last: the prior they get in the score is not a rating.
      sorted.sort(
        (a, b) =>
          Number(reviewCount(b.business) > 0) - Number(reviewCount(a.business) > 0) ||
          reviewValue(b.business) - reviewValue(a.business) ||
          reviewCount(b.business) - reviewCount(a.business) ||
          a.distanceKm - b.distanceKm,
      );
      break;
    default:
      sorted.sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm || byName(a, b));
  }
  return sorted;
}

/** The id of the one business with the best value, or undefined on a tie or with fewer than two. */
export function bestBy(
  items: ScoredBusiness[],
  value: (s: ScoredBusiness) => number,
  lowest: boolean,
): string | undefined {
  if (items.length < 2) return undefined;
  const values = items.map(value);
  const target = lowest ? Math.min(...values) : Math.max(...values);
  const winners = items.filter((_, i) => values[i] === target);
  return winners.length === 1 ? winners[0].business.id : undefined;
}

/**
 * "Bedst anmeldt" on the compare screen. Only businesses with FixMatch reviews take part, so one
 * without reviews (shown as "Ingen endnu") never wins on the prior alone.
 */
export function bestReviewed(items: ScoredBusiness[]): string | undefined {
  return bestBy(
    items.filter((s) => reviewCount(s.business) > 0),
    (s) => reviewValue(s.business),
    false,
  );
}

export type PriceLevel = 1 | 2 | 3;

export const PRICE_LEVEL_LABELS: Record<PriceLevel, string> = {
  1: t('Lavt prisniveau'),
  2: t('Middel prisniveau'),
  3: t('Højt prisniveau'),
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Price level compared with the median hourly rate of the trade (±6 %). */
export function priceLevel(business: Business, all: Business[], category?: CategoryId): PriceLevel {
  const trade = category ?? business.categories[0];
  const country = business.country ?? 'DK';
  // Peers in the same country only: their prices are in the same currency.
  const peers = all.filter((b) => (b.country ?? 'DK') === country && b.categories.includes(trade)).map(priceIndex);
  if (peers.length < 3) return 2;
  const ratio = priceIndex(business) / median(peers);
  if (ratio < 0.94) return 1;
  if (ratio > 1.06) return 3;
  return 2;
}

export function matchLabel(score: number): string {
  if (score >= 85) return t('Fremragende match');
  if (score >= 70) return t('Stærkt match');
  if (score >= 55) return t('Godt match');
  return t('Muligt match');
}
