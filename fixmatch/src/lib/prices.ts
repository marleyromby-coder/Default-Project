import type { Business, JobType, PriceUnit } from './types';

export interface JobPriceSummary {
  min: number;
  max: number;
  unit: PriceUnit;
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
  const step = value >= 5000 ? 100 : value >= 1000 ? 50 : 10;
  return Math.round(value / step) * step;
}

/**
 * Typical price range for a job among the listed businesses: the 20th percentile
 * of their minimums to the 80th percentile of their maximums, so one outlier
 * does not stretch the range.
 */
export function summarizeJobPrice(job: JobType, businesses: Business[]): JobPriceSummary {
  const examples = businesses.flatMap((b) => b.pricing.examples.filter((e) => e.job === job.id && e.unit === job.unit));
  if (examples.length === 0) return { min: job.min, max: job.max, unit: job.unit, count: 0 };
  const mins = examples.map((e) => e.min).sort((a, b) => a - b);
  const maxs = examples.map((e) => e.max).sort((a, b) => a - b);
  const min = roundPrice(percentile(mins, 0.2));
  const max = Math.max(min, roundPrice(percentile(maxs, 0.8)));
  return { min, max, unit: job.unit, count: examples.length };
}
