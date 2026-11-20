import type { Business, CategoryId } from './types';

/**
 * The trade every business in a comparison is listed in, or undefined when they have none in
 * common. When they share more than one, the first business's own order decides. A business can
 * be in two trades (e.g. tømrer and tagdækker), so its first trade is not always the one it was
 * compared in: next to two roofers it counts as a roofer.
 */
export function sharedTrade(businesses: Business[]): CategoryId | undefined {
  if (businesses.length === 0) return undefined;
  return businesses[0].categories.find((c) => businesses.every((b) => b.categories.includes(c)));
}

/**
 * The compare list after ticking or unticking `id`, or undefined when it is full (`max`) and
 * nothing changes. The picks stay when they and the new business share a trade, so a business in
 * two trades (tømrer and tagdækker) joins two roofers; a business in another trade starts over.
 */
export function toggleCompared(
  compare: string[],
  id: string,
  businesses: Business[],
  max: number,
): string[] | undefined {
  if (compare.includes(id)) return compare.filter((x) => x !== id);
  const business = businesses.find((b) => b.id === id);
  const picked = compare.map((x) => businesses.find((b) => b.id === x)).filter((b): b is Business => b !== undefined);
  if (!business || !sharedTrade([...picked, business])) return [id];
  if (picked.length >= max) return undefined;
  return [...picked.map((b) => b.id), id];
}

/**
 * The trade a business is scored in: `trade` when it is listed in it, otherwise its first trade.
 * The match score depends on the other businesses in that trade, so this keeps Sammenlign's score
 * the same as on that trade's list.
 */
export function scoringTrade(business: Business, trade?: CategoryId): CategoryId {
  return trade && business.categories.includes(trade) ? trade : business.categories[0];
}
