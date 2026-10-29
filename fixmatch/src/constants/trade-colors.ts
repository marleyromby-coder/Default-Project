import type { CategoryId } from '@/lib/types';

/**
 * One colour per trade, used for map pins, trade icons and business marks. Each reaches
 * at least 4.5:1 against white, so white icons and initials on it stay readable in both
 * modes. Trades always show their icon or name too, so colour is never the only cue.
 */
export const TRADE_COLORS: Record<CategoryId, string> = {
  vvs: '#1D4ED8',
  elektriker: '#A16207',
  toemrer: '#92400E',
  murer: '#B91C1C',
  mekaniker: '#475569',
  maler: '#7C3AED',
  tagdaekker: '#0F766E',
  laasesmed: '#BE185D',
};

function mix(hex: string, other: string, amount: number): string {
  const channel = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) => Math.round(channel(hex, i) * (1 - amount) + channel(other, i) * amount));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Colours for a trade on the current background: `solid` behind white content, `soft` as a
 * tinted surface and `onSoft` for an icon or text on that tint (lightened in dark mode).
 */
export function tradeTone(id: CategoryId, scheme: 'light' | 'dark') {
  const solid = TRADE_COLORS[id];
  return scheme === 'dark'
    ? { solid, soft: mix(solid, '#151B24', 0.72), onSoft: mix(solid, '#FFFFFF', 0.55) }
    : { solid, soft: mix(solid, '#FFFFFF', 0.9), onSoft: solid };
}

/** A slightly lighter or darker shade of a trade colour, so neighbouring marks differ. */
export function tradeShade(id: CategoryId, seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const shift = [0, 0.14, -0.14][hash % 3];
  return shift === 0 ? TRADE_COLORS[id] : mix(TRADE_COLORS[id], shift > 0 ? '#FFFFFF' : '#000000', Math.abs(shift));
}
