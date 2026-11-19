import {
  median,
  PRICE_LEVEL_BAND,
  PRICE_LEVEL_MIN_PEERS,
  priceIndex,
  priceLevel,
  pricePeers,
  type PriceLevel,
} from './ranking';
import type { Business, CategoryId } from './types';
import { msg, t } from '@/i18n';

/**
 * The price bar on the business page: where the hourly rate sits among the same businesses
 * that `priceLevel` compares with (same trade, same country, on FixMatch), by the same rule.
 * Positions are fractions of the bar, 0 at the lowest hourly rate in the group and 1 at the
 * highest, so the business's range, its midpoint and the "middel" band can be drawn on one axis.
 */
export interface PriceInsight {
  /** Businesses in the comparison, this one included when it is listed. */
  count: number;
  /** The level by `priceLevel`'s rule, or null with too few businesses to compare with. */
  level: PriceLevel | null;
  /** The ends of the bar: the lowest and the highest hourly rate in the group. */
  low: number;
  high: number;
  /** This business's hourly range on the bar. */
  from: number;
  to: number;
  /** The middle of the business's range: the value the level is based on. */
  point: number;
  /** The "middel" band: the group's median ± PRICE_LEVEL_BAND, and the median itself. Only with a level. */
  middle?: { from: number; to: number; at: number };
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function priceInsight(business: Business, all: Business[], category?: CategoryId): PriceInsight {
  const peers = pricePeers(business, all, category);
  const group = peers.some((b) => b.id === business.id) ? peers : [...peers, business];
  const low = Math.min(...group.map((b) => b.pricing.hourlyMin));
  const high = Math.max(...group.map((b) => b.pricing.hourlyMax));
  const span = high - low;
  const at = (value: number) => (span > 0 ? clamp01((value - low) / span) : 0.5);
  const enough = peers.length >= PRICE_LEVEL_MIN_PEERS;
  const typical = enough ? median(peers.map(priceIndex)) : undefined;
  return {
    count: peers.length,
    level: enough ? priceLevel(business, all, category) : null,
    low,
    high,
    from: at(business.pricing.hourlyMin),
    to: at(business.pricing.hourlyMax),
    point: at(priceIndex(business)),
    middle:
      typical === undefined
        ? undefined
        : { from: at(typical * (1 - PRICE_LEVEL_BAND)), to: at(typical * (1 + PRICE_LEVEL_BAND)), at: at(typical) },
  };
}

/** Neutral words for the level: the bar says where the price is, not whether it is good. */
const LABELS: Record<PriceLevel, string> = {
  1: msg('Lav pris'),
  2: msg('Middel'),
  3: msg('Høj pris'),
};

export function priceLevelLabel(level: PriceLevel): string {
  return t(LABELS[level]);
}

/** A trade's plural inside a sentence: "VVS'ere" stays, "Elektrikere" → "elektrikere". */
export function tradeInSentence(plural: string): string {
  return /^\p{Lu}{2}/u.test(plural) ? plural : plural.charAt(0).toLowerCase() + plural.slice(1);
}

/**
 * What the price is compared with, in words: "Blandt 13 VVS'ere på FixMatch i Danmark", or why
 * there is no level ("Ingen andre …", "For få at sammenligne med …").
 */
export function priceGroupText(insight: PriceInsight, plural: string, country: string): string {
  const values = { count: insight.count, trade: tradeInSentence(plural), country };
  if (insight.level !== null) return t('Blandt {count} {trade} på FixMatch i {country}', values);
  if (insight.count <= 1) return t('Ingen andre {trade} på FixMatch i {country} at sammenligne med endnu.', values);
  return t('For få at sammenligne med: kun {count} {trade} på FixMatch i {country}.', values);
}
