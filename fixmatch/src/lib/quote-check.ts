import { countryOf } from './business-text';
import { distanceKm } from './geo';
import type { Market } from './markets';
import { summarizeJobPrice } from './prices';
import type { ScoredBusiness } from './ranking';
import type { Business, CategoryId, Coords, JobType } from './types';
import { isVerified } from './verification';

/**
 * Tilbudstjek: is a quote the user already has low, normal or high compared with what the
 * businesses in FixMatch list for the same job? Runs on the phone; nothing is sent anywhere.
 */
export type QuoteVerdict = 'low' | 'normal' | 'high' | 'veryHigh';

/** Up to this much over the usual range is "a bit high"; more is "high". */
export const HIGH_MARGIN = 0.25;
/** Prices from businesses this close are used when at least MIN_NEARBY_PRICES of them price the job. */
export const NEARBY_KM = 40;
export const MIN_NEARBY_PRICES = 3;

/** The green håndværkerfradrag in Denmark, 2026: labour only, per adult in the household (skat.dk). */
export const GREEN_DEDUCTION_MAX = 9000;
/** Roughly what one krone of deduction is worth in tax. */
export const DEDUCTION_VALUE = 0.26;
/** Jobs that are usually an energy improvement the green deduction covers. The user can switch it. */
export const GREEN_JOBS: readonly string[] = ['vindue', 'ovenlys'];

export interface QuoteCheck {
  verdict: QuoteVerdict;
  /** The usual total for the job and quantity. */
  min: number;
  max: number;
  /** How far the quote is under the range (low) or over it (high), in whole percent. 0 when normal. */
  percent: number;
  /** How many price examples the range is built on. 0 means FixMatch's own estimate. */
  count: number;
  scope: 'nearby' | 'country';
}

export interface QuoteInput {
  price: number;
  job: JobType;
  category: CategoryId;
  /** m² or pieces for jobs priced per unit; ignored for a whole job. */
  quantity: number;
  businesses: Business[];
  market: Market;
  origin: Coords;
}

export function quoteFactor(job: JobType, quantity: number): number {
  return job.unit === 'opgave' ? 1 : Math.max(1, quantity);
}

export function checkQuote({ price, job, category, quantity, businesses, market, origin }: QuoteInput): QuoteCheck {
  const inTrade = businesses.filter((b) => countryOf(b) === market.country && b.categories.includes(category));
  const nearby = summarizeJobPrice(
    job,
    inTrade.filter((b) => distanceKm(origin, b.coords) <= NEARBY_KM),
    market,
  );
  const useNearby = nearby.count >= MIN_NEARBY_PRICES;
  const summary = useNearby ? nearby : summarizeJobPrice(job, inTrade, market);
  const factor = quoteFactor(job, quantity);
  const min = summary.min * factor;
  const max = summary.max * factor;

  let verdict: QuoteVerdict = 'normal';
  let percent = 0;
  if (price < min) {
    verdict = 'low';
    percent = Math.round((1 - price / min) * 100);
  } else if (price > max) {
    percent = Math.round((price / max - 1) * 100);
    verdict = price <= max * (1 + HIGH_MARGIN) ? 'high' : 'veryHigh';
  }
  return { verdict, min, max, percent, count: summary.count, scope: useNearby ? 'nearby' : 'country' };
}

/** Tax back on the labour of a green job: about 26 % of the labour, up to the yearly limit per adult. */
export function greenDeduction(labour: number, adults = 1): { deduction: number; saving: number } {
  const deduction = Math.min(Math.max(0, labour), GREEN_DEDUCTION_MAX * adults);
  return { deduction, saving: Math.round((deduction * DEDUCTION_VALUE) / 10) * 10 };
}

function jobExample(business: Business, job: JobType) {
  return business.pricing.examples.find((e) => e.job === job.id && e.unit === job.unit);
}

/**
 * Nearby businesses whose own price for the job starts below the quote: verified ones first,
 * then the lowest price.
 */
export function cheaperOptions(
  price: number,
  job: JobType,
  quantity: number,
  scored: ScoredBusiness[],
  limit = 3,
  now = new Date(),
): ScoredBusiness[] {
  const factor = quoteFactor(job, quantity);
  return scored
    .filter((s) => {
      const example = jobExample(s.business, job);
      return example !== undefined && example.min * factor < price && s.distanceKm <= NEARBY_KM;
    })
    .sort(
      (a, b) =>
        Number(isVerified(b.business, now)) - Number(isVerified(a.business, now)) ||
        (jobExample(a.business, job)?.min ?? 0) - (jobExample(b.business, job)?.min ?? 0),
    )
    .slice(0, limit);
}
