import { bestBy, reviewCount, sortScored, type ScoredBusiness } from './ranking';
import type { JobType, SortMode } from './types';

/**
 * The business each sort tab puts first in the list that is shown, so the tab can show its
 * value ("Bedste match 82/100 · Billigste 560 kr./t · Nærmeste 2,6 km · Bedst anmeldt ★ 4,5 (19)").
 * The rules are sortScored's own: "Billigste" is the lowest "fra" price (the start of the hourly
 * range), the same number the cards and the trade tiles show. "Bedst anmeldt" only counts
 * businesses with FixMatch reviews and is undefined when none has any, so the tab shows no number.
 * A list of one compares nothing, so every tab is empty.
 */
export interface SortTabWinners {
  match?: ScoredBusiness;
  price?: ScoredBusiness;
  distance?: ScoredBusiness;
  rating?: ScoredBusiness;
}

export function sortTabWinners(items: ScoredBusiness[]): SortTabWinners {
  if (items.length < 2) return {};
  const first = (mode: SortMode, list: ScoredBusiness[]) => sortScored(list, mode)[0];
  const reviewed = items.filter((s) => reviewCount(s.business) > 0);
  return {
    match: first('match', items),
    price: first('price', items),
    distance: first('distance', items),
    rating: reviewed.length > 0 ? first('rating', reviewed) : undefined,
  };
}

/** The small ribbons on a result card. */
export type Ribbon = 'match' | 'price' | 'distance';

/** Most ribbons on one card, so they stay one short row. */
export const MAX_RIBBONS = 2;

/**
 * Which cards get "Bedste match", "Billigst" and "Nærmest": only the one business that wins
 * outright (highest score, lowest "fra" price, shortest distance to 0.1 km). With a job chosen,
 * "Billigst" goes to the lowest "fra" price for that job, and a business without a price for it
 * cannot get it. A tie or a list of one gives no ribbon, since nothing was beaten. A card that
 * wins all three keeps two: the current sort's first, then match, price and distance.
 */
export function resultRibbons(items: ScoredBusiness[], sort: SortMode, job?: JobType): Map<string, Ribbon[]> {
  const price = job
    ? (s: ScoredBusiness) => s.business.pricing.examples.find((e) => e.job === job.id)?.min ?? Infinity
    : (s: ScoredBusiness) => s.business.pricing.hourlyMin;
  const winners: [Ribbon, string | undefined][] = [
    ['match', bestBy(items, (s) => s.score, false)],
    // When nobody has a price for the job, all tie on Infinity and nobody gets "Billigst".
    ['price', bestBy(items, price, true)],
    ['distance', bestBy(items, (s) => Math.round(s.distanceKm * 10), true)],
  ];
  const ordered = [...winners].sort(([a], [b]) => Number(b === sort) - Number(a === sort));
  const out = new Map<string, Ribbon[]>();
  for (const [ribbon, id] of ordered) {
    if (!id) continue;
    const list = out.get(id) ?? [];
    if (list.length < MAX_RIBBONS) out.set(id, [...list, ribbon]);
  }
  return out;
}
