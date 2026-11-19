import { distanceKm } from './geo';
import type { Market } from './markets';
import type { Business, CategoryId, Coords, Currency, JobType, PriceUnit } from './types';

export interface JobPriceSummary {
  min: number;
  max: number;
  unit: PriceUnit;
  currency: Currency;
  /** How many prices the range is built on. 0 means the category's fallback estimate is used. */
  count: number;
  /**
   * Where the prices come from: what users paid ("Del, hvad du betalte"), the businesses'
   * own listed prices, or FixMatch's estimate.
   */
  source: 'paid' | 'listed' | 'estimate';
}

/** What a user paid for a job, per unit of the job (per m², per piece or for the whole job). */
export interface PaidPrice {
  job: string;
  /** Paid incl. VAT for the whole job. */
  total: number;
  quantity: number;
}

/** Shared prices count once at least this many users reported the job. */
export const MIN_PAID_PRICES = 3;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0];
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function roundPrice(value: number): number {
  const step = value >= 5000 ? 100 : value >= 1000 ? 50 : value >= 100 ? 10 : 5;
  return Math.round(value / step) * step;
}

/**
 * Typical price range for a job among the listed businesses in one country:
 * the 20th percentile of their minimums to the 80th percentile of their
 * maximums, so one outlier does not stretch the range. Pass only businesses
 * from `market`; prices in other currencies are ignored.
 */
export function summarizeJobPrice(
  job: JobType,
  businesses: Business[],
  market: Market,
  paid: PaidPrice[] = [],
): JobPriceSummary {
  // What users actually paid beats what businesses list, once enough have shared it.
  const perUnit = paid
    .filter((p) => p.job === job.id && p.total > 0)
    .map((p) => (job.unit === 'opgave' ? p.total : p.total / Math.max(1, p.quantity)))
    .sort((a, b) => a - b);
  if (perUnit.length >= MIN_PAID_PRICES) {
    const min = roundPrice(percentile(perUnit, 0.2));
    const max = Math.max(min, roundPrice(percentile(perUnit, 0.8)));
    return { min, max, unit: job.unit, currency: market.currency, count: perUnit.length, source: 'paid' };
  }
  const local = businesses.filter((b) => (b.pricing.currency ?? market.currency) === market.currency);
  const examples = local.flatMap((b) => b.pricing.examples.filter((e) => e.job === job.id && e.unit === job.unit));
  if (examples.length === 0) {
    const min = roundPrice(job.min * market.fromDkk);
    return {
      min,
      max: Math.max(min, roundPrice(job.max * market.fromDkk)),
      unit: job.unit,
      currency: market.currency,
      count: 0,
      source: 'estimate',
    };
  }
  const mins = examples.map((e) => e.min).sort((a, b) => a - b);
  const maxs = examples.map((e) => e.max).sort((a, b) => a - b);
  const min = roundPrice(percentile(mins, 0.2));
  const max = Math.max(min, roundPrice(percentile(maxs, 0.8)));
  return { min, max, unit: job.unit, currency: market.currency, count: examples.length, source: 'listed' };
}

/** The lowest hourly price of a trade near the user, for "fra 560 kr." on its tile. */
export interface TradeFromPrice {
  /** The lowest `hourlyMin` (incl. VAT where the market lists prices with VAT). */
  price: number;
  currency: Currency;
  /** How many businesses with a price the lowest is taken from. */
  businesses: number;
}

/** Same radius as the results list's default distance filter (DEFAULT_FILTERS.maxDistanceKm). */
export const FROM_PRICE_RADIUS_KM = 25;

/**
 * The lowest hourly price per trade: the lowest starting price (`hourlyMin`, "fra") that any
 * business within `maxKm` of `origin` lists (null: the whole country). Only `market`'s country
 * and currency count, since prices are never compared across countries. The radius defaults to
 * the results list's default distance filter, so the business behind "fra X kr." is in that
 * list. A trade without a priced business nearby is left out: show no price line for it.
 */
export function lowestHourlyByTrade(
  businesses: Business[],
  origin: Coords,
  market: Market,
  maxKm: number | null = FROM_PRICE_RADIUS_KM,
): Partial<Record<CategoryId, TradeFromPrice>> {
  const out: Partial<Record<CategoryId, TradeFromPrice>> = {};
  for (const business of businesses) {
    if ((business.country ?? 'DK') !== market.country) continue;
    if ((business.pricing.currency ?? market.currency) !== market.currency) continue;
    const price = business.pricing.hourlyMin;
    if (!Number.isFinite(price) || price <= 0) continue;
    if (maxKm !== null && distanceKm(origin, business.coords) > maxKm) continue;
    for (const trade of business.categories) {
      const current = out[trade];
      out[trade] = {
        price: current ? Math.min(current.price, price) : price,
        currency: market.currency,
        businesses: (current?.businesses ?? 0) + 1,
      };
    }
  }
  return out;
}
