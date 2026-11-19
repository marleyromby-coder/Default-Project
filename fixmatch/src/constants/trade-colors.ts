import { TradeColors } from '@/constants/theme';
import type { CategoryId } from '@/lib/types';

/**
 * One solid colour per trade for map pins and business marks: the deep colour of the trade's
 * tile (TradeColors in theme.ts). Each reaches at least 5:1 against white, so white icons on it
 * stay readable in both modes. Trades always show their icon or name too, so colour is never
 * the only cue.
 */
export const TRADE_COLORS: Record<CategoryId, string> = Object.fromEntries(
  Object.entries(TradeColors.light).map(([id, colors]) => [id, colors.deep]),
) as Record<CategoryId, string>;

/** SF Symbol of each trade, shared by the app's icons and the widgets. */
export const TRADE_SYMBOLS = {
  vvs: 'drop.fill',
  elektriker: 'bolt.fill',
  toemrer: 'hammer.fill',
  murer: 'square.stack.3d.up.fill',
  mekaniker: 'car.fill',
  maler: 'paintbrush.fill',
  tagdaekker: 'house.fill',
  laasesmed: 'key.fill',
} as const satisfies Record<CategoryId, string>;

function mix(hex: string, other: string, amount: number): string {
  const channel = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) => Math.round(channel(hex, i) * (1 - amount) + channel(other, i) * amount));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** A slightly lighter or darker shade of a trade colour, so neighbouring marks differ. */
export function tradeShade(id: CategoryId, seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const shift = [0, 0.14, -0.14][hash % 3];
  return shift === 0 ? TRADE_COLORS[id] : mix(TRADE_COLORS[id], shift > 0 ? '#FFFFFF' : '#000000', Math.abs(shift));
}

/**
 * Colours of a business mark without a photo: a tint of the trade colour with the initials
 * in the colour itself, like a stamp. Decorative – the name is always written next to it.
 */
export function markTone(id: CategoryId, seed: string, scheme: 'light' | 'dark') {
  const solid = tradeShade(id, seed);
  return scheme === 'dark'
    ? { background: mix(solid, '#131D1A', 0.62), letters: mix(solid, '#FFFFFF', 0.62) }
    : { background: mix(solid, '#FFFFFF', 0.86), letters: solid };
}
