import type { CategoryId } from '@/lib/types';

/**
 * One colour per trade for map pins. Each reaches at least 4.5:1 against the
 * white icon and border, in both light and dark mode. Pins always show the
 * trade icon too, so colour is never the only cue.
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
