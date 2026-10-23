import { useMemo } from 'react';

import { inReach, matchBudget, type BudgetMatch, type BudgetMatchInput } from '@/lib/matcher';
import { scoreBusinesses } from '@/lib/ranking';
import { useApp } from '@/state/app-state';

export interface BudgetMatchResults {
  /** Businesses that work where the user is, best fit first. */
  items: BudgetMatch[];
  /** Businesses in the trade that do not cover the user's address. */
  outOfReach: BudgetMatch[];
}

export function useBudgetMatch(input: BudgetMatchInput | undefined): BudgetMatchResults {
  const { state } = useApp();
  const { category, job, quantity, budget, urgent } = input ?? {};

  return useMemo(() => {
    if (!category) return { items: [], outOfReach: [] };
    const pool = state.businesses.filter((b) => b.categories.includes(category));
    const scored = scoreBusinesses(pool, state.location.coords, state.priorities);
    const matched = matchBudget({ category, job, quantity, budget, urgent }, scored);
    return {
      items: matched.filter((m) => inReach(m, category)),
      outOfReach: matched.filter((m) => !inReach(m, category)),
    };
  }, [category, job, quantity, budget, urgent, state.businesses, state.location.coords, state.priorities]);
}
