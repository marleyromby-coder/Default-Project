import type { QuickHelpProps, SavedProps, WidgetTrade } from './types';

/**
 * What the widgets show in the widget gallery before the app has run once. Afterwards the
 * app sends real, translated props (src/widgets/props.ts). Kept free of app imports, because
 * the widget build bundles this file on its own.
 */
const trade = (id: string, label: string, symbol: string, color: string): WidgetTrade => ({
  id,
  label,
  symbol,
  color,
  url: `fixmatch://kategori/${id}`,
});

export const INITIAL_TRADES: WidgetTrade[] = [
  trade('vvs', "VVS'er", 'drop.fill', '#1D4ED8'),
  trade('elektriker', 'Elektriker', 'bolt.fill', '#A16207'),
  trade('laasesmed', 'Låsesmed', 'key.fill', '#BE185D'),
  trade('mekaniker', 'Mekaniker', 'car.fill', '#475569'),
  trade('toemrer', 'Tømrer', 'hammer.fill', '#92400E'),
  trade('murer', 'Murer', 'square.stack.3d.up.fill', '#B91C1C'),
  trade('maler', 'Maler', 'paintbrush.fill', '#7C3AED'),
  trade('tagdaekker', 'Tagdækker', 'house.fill', '#0F766E'),
];

export const INITIAL_QUICK_HELP: QuickHelpProps = {
  place: 'Danmark',
  describe: 'Beskriv dit problem',
  describeHint: 'Vi finder dem, der passer – også til dit budget.',
  describeUrl: 'fixmatch://beskriv',
  describeShort: 'Beskriv',
  tradesTitle: 'Find et fag',
  trades: INITIAL_TRADES,
  urgent: 'Akut hjælp – døgnvagt',
  urgentHint: 'Vandskade, låst ude, strømsvigt',
  urgentUrl: 'fixmatch://kategori/vvs?akut=1',
  saved: [],
  savedTitle: 'Gemte',
};

export const INITIAL_SAVED: SavedProps = {
  title: 'Gemte håndværkere',
  empty: 'Ingen gemte endnu',
  emptyHint: 'Tryk på hjertet ved en virksomhed for at se den her.',
  openSummary: '',
  saved: [],
  appUrl: 'fixmatch://gemte',
};
