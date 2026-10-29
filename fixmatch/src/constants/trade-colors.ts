import type { CategoryId } from '@/lib/types';

/**
 * One colour per trade, used for map pins and business marks: muted, earthy tones that sit
 * on the warm paper background (slate, ochre, oak, brick, graphite, plum, teal, wine). Each
 * reaches at least 5:1 against white, so white icons on it stay readable in both modes.
 * Trades always show their icon or name too, so colour is never the only cue.
 */
export const TRADE_COLORS: Record<CategoryId, string> = {
  vvs: '#2F5D84',
  elektriker: '#8A6212',
  toemrer: '#7B4A26',
  murer: '#A0402F',
  mekaniker: '#4C5558',
  maler: '#6E4C7A',
  tagdaekker: '#2E6461',
  laasesmed: '#86405A',
};

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
    ? { background: mix(solid, '#1A1D18', 0.62), letters: mix(solid, '#FFFFFF', 0.62) }
    : { background: mix(solid, '#FFFFFF', 0.86), letters: solid };
}
