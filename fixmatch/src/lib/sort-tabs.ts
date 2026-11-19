import { bestBy, priceIndex, reviewCount, sortScored, type ScoredBusiness } from './ranking';
import type { SortMode } from './types';

/**
 * The business each sort tab puts first in the list that is shown, so the tab can show its
 * value ("Bedste match 82/100 · Billigste 560 kr./t · Nærmeste 2,6 km · Bedst anmeldt ★ 4,5").
 * The rules are sortScored's own: "Billigste" is the lowest price level (the middle of the
 * hourly range), and the tab shows that business's "fra" price, the same number its card shows
 * at the top of the list. "Bedst anmeldt" only counts businesses with FixMatch reviews and is
 * undefined when none has any, so the tab shows no number.
 */
export interface SortTabWinners {
  match?: ScoredBusiness;
  price?: ScoredBusiness;
  distance?: ScoredBusiness;
  rating?: ScoredBusiness;
}

export function sortTabWinners(items: ScoredBusiness[]): SortTabWinners {
  if (items.length === 0) return {};
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
 * outright on the sort's own measure (score, price level, distance to 0.1 km). A tie or a list of
 * one gives no ribbon, since nothing was beaten. A card that wins all three keeps two: the
 * current sort's first, then match, price and distance.
 */
export function resultRibbons(items: ScoredBusiness[], sort: SortMode): Map<string, Ribbon[]> {
  const winners: [Ribbon, string | undefined][] = [
    ['match', bestBy(items, (s) => s.score, false)],
    ['price', bestBy(items, (s) => priceIndex(s.business), true)],
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
