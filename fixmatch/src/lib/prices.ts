import type { Market } from './markets';
import type { Business, Currency, JobType, PriceUnit } from './types';

export interface JobPriceSummary {
  min: number;
  max: number;
  unit: PriceUnit;
  currency: Currency;
  /** How many businesses priced the job. 0 means the category's fallback estimate is used. */
  count: number;
}

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
export function summarizeJobPrice(job: JobType, businesses: Business[], market: Market): JobPriceSummary {
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
    };
  }
  const mins = examples.map((e) => e.min).sort((a, b) => a - b);
  const maxs = examples.map((e) => e.max).sort((a, b) => a - b);
  const min = roundPrice(percentile(mins, 0.2));
  const max = Math.max(min, roundPrice(percentile(maxs, 0.8)));
  return { min, max, unit: job.unit, currency: market.currency, count: examples.length };
}
