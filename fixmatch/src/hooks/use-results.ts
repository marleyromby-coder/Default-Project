import { useMemo } from 'react';

import { countryOf } from '@/lib/business-text';
import { applyFilters } from '@/lib/filters';
import { scoreBusinesses, sortScored, type ScoredBusiness } from '@/lib/ranking';
import type { CategoryId, Filters, SortMode } from '@/lib/types';
import { useApp, userCountry } from '@/state/app-state';

export interface Results {
  /** Results after filters, in the chosen order. */
  items: ScoredBusiness[];
  /** All businesses in the trade, scored, before filters. */
  total: number;
  /** Nearest result outside the distance filter, if every result was filtered out. */
  nearestOutside?: ScoredBusiness;
}

/**
 * Scores and filters the businesses in the user's country. Prices are only
 * compared within one country, so `scope: 'world'` (the map's world view)
 * scores each country on its own.
 */
export function useResults(
  category: CategoryId | undefined,
  sort: SortMode,
  filters?: Filters,
  scope: 'country' | 'world' = 'country',
): Results {
  const { state } = useApp();
  const activeFilters = filters ?? state.filters;
  const country = userCountry(state.location);

  return useMemo(() => {
    const inTrade = category ? state.businesses.filter((b) => b.categories.includes(category)) : state.businesses;
    if (scope === 'world') {
      const countries = [...new Set(inTrade.map(countryOf))];
      const scored = countries.flatMap((c) =>
        scoreBusinesses(
          inTrade.filter((b) => countryOf(b) === c),
          state.location.coords,
          state.priorities,
        ),
      );
      const items = sortScored(applyFilters(scored, activeFilters, { all: state.businesses, category }), sort);
      return { items, total: scored.length };
    }
    const pool = inTrade.filter((b) => countryOf(b) === country);
    if (pool.length === 0) return { items: [], total: 0 };
    const scored = scoreBusinesses(pool, state.location.coords, state.priorities);
    const filtered = applyFilters(scored, activeFilters, { all: state.businesses, category });
    const items = sortScored(filtered, sort);
    const nearestOutside =
      items.length === 0 ? sortScored(scored, 'distance').find((s) => !filtered.includes(s)) : undefined;
    return { items, total: scored.length, nearestOutside };
  }, [category, sort, activeFilters, scope, country, state.businesses, state.location.coords, state.priorities]);
}

/** Scores a fixed set of businesses (favorites, compare list) against the user's location. */
export function useScored(ids: string[]): ScoredBusiness[] {
  const { state } = useApp();
  return useMemo(() => {
    const chosen = ids
      .map((id) => state.businesses.find((b) => b.id === id))
      .filter((b): b is NonNullable<typeof b> => b !== undefined);
    if (chosen.length === 0) return [];
    // Price is scored against the whole trade, so a lone favorite still gets a fair price score.
    const byTrade = new Map<string, ScoredBusiness[]>();
    for (const key of new Set(chosen.map((b) => `${countryOf(b)}:${b.categories[0]}`))) {
      const [country, trade] = key.split(':');
      const peers = state.businesses.filter(
        (b) => countryOf(b) === country && b.categories.includes(trade as CategoryId),
      );
      byTrade.set(key, scoreBusinesses(peers, state.location.coords, state.priorities));
    }
    return chosen
      .map((b) => byTrade.get(`${countryOf(b)}:${b.categories[0]}`)?.find((s) => s.business.id === b.id))
      .filter((s): s is ScoredBusiness => s !== undefined);
  }, [ids, state.businesses, state.location.coords, state.priorities]);
}
