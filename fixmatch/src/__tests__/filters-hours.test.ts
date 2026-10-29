import { activeFilterCount, applyFilters, DEFAULT_FILTERS, distanceOptions, isSameDistance } from '@/lib/filters';
import { clockAt, getOpenStatus, summarizeHours } from '@/lib/opening-hours';
import { scoreBusinesses } from '@/lib/ranking';
import type { WeekHours } from '@/lib/types';

import { makeBusiness } from '@/__fixtures__/business';

const HOURS: WeekHours = [
  ['07:00', '15:30'],
  ['07:00', '15:30'],
  ['07:00', '15:30'],
  ['07:00', '15:30'],
  ['07:00', '14:00'],
  null,
  null,
];

// Tuesday 20 October 2026, local time.
const at = (hours: number, minutes = 0, day = 20) => new Date(2026, 9, day, hours, minutes);

describe('opening hours', () => {
  it('knows when a business is open', () => {
    expect(getOpenStatus(HOURS, at(10))).toEqual({ open: true, label: 'Åben til 15.30' });
    expect(getOpenStatus(HOURS, at(6, 30))).toEqual({ open: false, label: 'Åbner kl. 7.00' });
    expect(getOpenStatus(HOURS, at(16))).toEqual({ open: false, label: 'Åbner i morgen kl. 7.00' });
  });

  it('skips the weekend', () => {
    // Friday 23 October after closing → Monday.
    expect(getOpenStatus(HOURS, at(15, 0, 23)).label).toBe('Åbner man. kl. 7.00');
    // Sunday 25 October → Monday is "i morgen".
    expect(getOpenStatus(HOURS, at(12, 0, 25)).label).toBe('Åbner i morgen kl. 7.00');
  });

  it('reads the hours in the time zone of the business', () => {
    // Thursday 29 October 2026, 13:00 UTC: 14:00 in Copenhagen, 13:00 in London, 9:00 in New York.
    const now = new Date('2026-10-29T13:00:00Z');
    expect(clockAt(now, 'Europe/Copenhagen')).toEqual({ day: 3, minutes: 14 * 60 });
    expect(clockAt(now, 'America/New_York')).toEqual({ day: 3, minutes: 9 * 60 });
    const nineToFive: WeekHours = [null, null, null, ['10:00', '17:00'], null, null, null];
    expect(getOpenStatus(nineToFive, now, 'America/New_York').open).toBe(false);
    expect(getOpenStatus(nineToFive, now, 'Europe/London').open).toBe(true);
  });

  it('summarises equal days', () => {
    expect(summarizeHours(HOURS)).toEqual([
      { days: 'Man–tor', time: '7.00–15.30' },
      { days: 'Fre', time: '7.00–14.00' },
      { days: 'Lør–søn', time: 'Lukket' },
    ]);
  });
});

describe('filters', () => {
  const origin = { lat: 55.6941, lon: 12.5486 };
  const near = makeBusiness({
    id: 'near',
    hours: HOURS,
    trustpilot: { score: 4.6, reviews: 50, url: 'x', updatedAt: '2026-10-01' },
  });
  const far = makeBusiness({ id: 'far', coords: { lat: 56.1567, lon: 10.2108 }, emergency: true, hours: HOURS });
  const all = [near, far];
  const scored = scoreBusinesses(all, origin, { price: 3, distance: 3, reviews: 3 });
  const ids = (list: typeof scored) => list.map((s) => s.business.id);

  it('hides businesses outside the distance', () => {
    expect(ids(applyFilters(scored, DEFAULT_FILTERS, { all }))).toEqual(['near']);
    expect(ids(applyFilters(scored, { ...DEFAULT_FILTERS, maxDistanceKm: null }, { all }))).toEqual(['near', 'far']);
  });

  it('filters on rating, døgnvagt and opening hours', () => {
    const everywhere = { ...DEFAULT_FILTERS, maxDistanceKm: null };
    expect(ids(applyFilters(scored, { ...everywhere, minRating: 4.5 }, { all }))).toEqual(['near']);
    expect(ids(applyFilters(scored, { ...everywhere, emergency: true }, { all }))).toEqual(['far']);
    // Døgnvagt counts as open at night.
    expect(ids(applyFilters(scored, { ...everywhere, openNow: true }, { all, now: at(22) }))).toEqual(['far']);
  });

  it('offers distances in the unit of the market', () => {
    expect(distanceOptions('km').map((o) => o.label)).toEqual(['5 km', '10 km', '25 km', '50 km', 'Hele landet']);
    const miles = distanceOptions('mi');
    expect(miles[2].label).toBe('15 mi');
    // The default 25 km limit selects the 15 mi chip.
    expect(isSameDistance(DEFAULT_FILTERS.maxDistanceKm, miles[2].value)).toBe(true);
    expect(isSameDistance(DEFAULT_FILTERS.maxDistanceKm, miles[1].value)).toBe(false);
    expect(isSameDistance(null, null)).toBe(true);
  });

  it('counts active filters', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...DEFAULT_FILTERS, openNow: true, minRating: 4 })).toBe(2);
  });
});
