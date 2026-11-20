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
 * nothing changes. The picks that share a trade with the new business stay, so a business in two
 * trades (tømrer and tagdækker) joins two roofers, and a roofer ticked after a tømrer-and-roofer
 * keeps that one. When several of the new business's trades fit, the one that keeps the most picks
 * wins. A business that shares no trade with any pick starts over.
 */
export function toggleCompared(
  compare: string[],
  id: string,
  businesses: Business[],
  max: number,
): string[] | undefined {
  if (compare.includes(id)) return compare.filter((x) => x !== id);
  const business = businesses.find((b) => b.id === id);
  if (!business) return [id];
  const picked = compare.map((x) => businesses.find((b) => b.id === x)).filter((b): b is Business => b !== undefined);
  const kept = business.categories
    .map((trade) => picked.filter((b) => b.categories.includes(trade)))
    .reduce<Business[]>((best, list) => (list.length > best.length ? list : best), []);
  if (kept.length === picked.length && picked.length >= max) return undefined;
  return [...kept.slice(0, max - 1).map((b) => b.id), id];
}

/**
 * The trade a business is scored in: `trade` when it is listed in it, otherwise its first trade.
 * The match score depends on the other businesses in that trade, so this keeps Sammenlign's score
 * the same as on that trade's list.
 */
export function scoringTrade(business: Business, trade?: CategoryId): CategoryId {
  return trade && business.categories.includes(trade) ? trade : business.categories[0];
}
