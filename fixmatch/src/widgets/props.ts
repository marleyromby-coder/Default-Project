import { TRADE_SYMBOLS, tradeShade, TRADE_COLORS } from '@/constants/trade-colors';
import { getCategory } from '@/data/categories';
import { t } from '@/i18n';
import { currencyOf, initials, timeZoneOf } from '@/lib/business-text';
import { formatHourly } from '@/lib/format';
import { getOpenStatus } from '@/lib/opening-hours';
import type { Business, CategoryId, UserLocation } from '@/lib/types';

import type { QuickHelpProps, SavedProps, WidgetBusiness, WidgetTrade } from './types';

export interface WidgetInput {
  location: UserLocation;
  favorites: string[];
  businesses: Business[];
}

/** The most urgent trades first: they fill the medium widget. */
const TRADE_ORDER: CategoryId[] = [
  'vvs',
  'elektriker',
  'laasesmed',
  'mekaniker',
  'toemrer',
  'murer',
  'maler',
  'tagdaekker',
];

function trades(): WidgetTrade[] {
  return TRADE_ORDER.map((id) => ({
    id,
    label: getCategory(id)?.name ?? id,
    symbol: TRADE_SYMBOLS[id],
    color: TRADE_COLORS[id],
    url: `fixmatch://kategori/${id}`,
  }));
}

function saved(input: WidgetInput, date: Date): WidgetBusiness[] {
  return input.favorites
    .map((id) => input.businesses.find((b) => b.id === id))
    .filter((b): b is Business => b !== undefined)
    .map((business) => {
      const status = getOpenStatus(business.hours, date, timeZoneOf(business));
      return {
        id: business.id,
        name: business.name,
        initials: initials(business.name),
        color: tradeShade(business.categories[0], business.id),
        trade: getCategory(business.categories[0])?.name ?? '',
        status: !status.open && business.emergency ? `${status.label} · ${t('døgnvagt')}` : status.label,
        open: status.open,
        price: formatHourly(business.pricing.hourlyMin, business.pricing.hourlyMax, currencyOf(business)),
        url: `fixmatch://virksomhed/${business.id}`,
      };
    });
}

export function quickHelpProps(input: WidgetInput, date: Date): QuickHelpProps {
  return {
    place: input.location.label,
    describe: t('Beskriv dit problem'),
    describeHint: t('Vi finder dem, der passer – også til dit budget.'),
    describeUrl: 'fixmatch://beskriv',
    describeShort: t('Beskriv'),
    tradesTitle: t('Find et fag'),
    trades: trades(),
    urgent: t('Akut hjælp – døgnvagt'),
    urgentHint: t('Vandskade, låst ude, strømsvigt'),
    urgentUrl: 'fixmatch://kategori/vvs?akut=1',
    saved: saved(input, date),
    savedTitle: t('Gemte'),
  };
}

export function savedProps(input: WidgetInput, date: Date): SavedProps {
  const list = saved(input, date);
  const open = list.filter((b) => b.open).length;
  return {
    title: t('Gemte håndværkere'),
    empty: t('Ingen gemte endnu'),
    emptyHint: t('Tryk på hjertet ved en virksomhed for at se den her.'),
    openSummary: open === 0 ? '' : open === 1 ? t('1 åben nu') : t('{count} åbne nu', { count: open }),
    saved: list,
    appUrl: 'fixmatch://gemte',
  };
}

/**
 * Timeline entries every half hour for the next 12 hours, so opening hours in the widgets
 * stay right without the app running. Most opening hours start on the hour or half hour.
 */
export function widgetTimeline<P extends object>(build: (date: Date) => P, now: Date, hours = 12) {
  const start = new Date(now);
  start.setSeconds(0, 0);
  const entries = [{ date: start, props: build(start) }];
  const next = new Date(start);
  next.setMinutes(next.getMinutes() < 30 ? 30 : 60, 0, 0);
  for (const end = start.getTime() + hours * 3600_000; next.getTime() <= end; next.setMinutes(next.getMinutes() + 30)) {
    const date = new Date(next);
    entries.push({ date, props: build(date) });
  }
  return entries;
}
