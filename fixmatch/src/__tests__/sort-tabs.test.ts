import { scoreBusinesses, sortScored } from '@/lib/ranking';
import { MAX_RIBBONS, resultRibbons, sortTabWinners } from '@/lib/sort-tabs';
import type { Business } from '@/lib/types';

import { makeBusiness } from '@/__fixtures__/business';

const ORIGIN = { lat: 55.6761, lon: 12.5683 }; // København K
/** Roughly `km` east of the origin. */
const east = (km: number) => ({ lat: ORIGIN.lat, lon: ORIGIN.lon + km / 62.8 });
const PRIORITIES = { price: 4, distance: 3, reviews: 3 };

function business(id: string, km: number, hourlyMin: number, hourlyMax: number, reviews?: [number, number]): Business {
  return makeBusiness({
    id,
    coords: east(km),
    pricing: { hourlyMin, hourlyMax, examples: [], updatedAt: '2026-10-01' },
    reviewSummary: reviews ? { average: reviews[0], reviews: reviews[1] } : undefined,
  });
}

const score = (list: Business[]) => scoreBusinesses(list, ORIGIN, PRIORITIES);

describe('sortTabWinners', () => {
  it('takes each value from the business the same sort puts first', () => {
    const items = score([
      business('near', 1, 600, 700, [4.2, 3]),
      business('cheap', 9, 480, 560),
      business('reviewed', 5, 560, 650, [4.8, 20]),
    ]);
    const winners = sortTabWinners(items);
    for (const mode of ['match', 'price', 'distance'] as const) {
      expect(winners[mode]?.business.id).toBe(sortScored(items, mode)[0].business.id);
    }
    expect(winners.price?.business.id).toBe('cheap');
    expect(winners.distance?.business.id).toBe('near');
    expect(winners.rating?.business.id).toBe('reviewed');
  });

  it('ranks "Billigste" by the middle of the hourly range, like the price sort', () => {
    // "wide" starts lower but its range is higher: the price sort puts "narrow" first.
    const items = score([business('wide', 2, 450, 900), business('narrow', 3, 500, 560)]);
    expect(sortTabWinners(items).price?.business.id).toBe('narrow');
    expect(sortScored(items, 'price')[0].business.id).toBe('narrow');
  });

  it('only counts businesses with reviews for "Bedst anmeldt"', () => {
    const items = score([business('none', 1, 500, 600), business('two', 4, 520, 620, [3.6, 2])]);
    expect(sortTabWinners(items).rating?.business.id).toBe('two');
  });

  it('gives "Bedst anmeldt" no winner when no one has reviews', () => {
    const items = score([business('a', 1, 500, 600), business('b', 2, 520, 620)]);
    expect(sortTabWinners(items).rating).toBeUndefined();
  });

  it('is empty for an empty list', () => {
    expect(sortTabWinners([])).toEqual({});
  });
});

describe('resultRibbons', () => {
  it('gives each ribbon to the one business that wins it', () => {
    const items = score([business('near', 1, 600, 700), business('cheap', 9, 480, 560)]);
    const ribbons = resultRibbons(items, 'match');
    expect(ribbons.get('cheap')).toContain('price');
    expect(ribbons.get('near')).toContain('distance');
    expect(ribbons.get('near')).not.toContain('price');
  });

  it('gives no ribbon on a tie', () => {
    // Same middle price (610) and the same distance.
    const items = score([business('a', 3, 560, 660), business('b', 3, 565, 655)]);
    const ribbons = resultRibbons(items, 'price');
    expect([...ribbons.values()].flat()).not.toContain('price');
    expect([...ribbons.values()].flat()).not.toContain('distance');
  });

  it('gives no ribbons to a list of one', () => {
    expect(resultRibbons(score([business('alone', 1, 500, 600)]), 'match').size).toBe(0);
  });

  it('keeps at most two ribbons, the current sort first', () => {
    // "best" is cheapest, nearest and therefore the best match.
    const items = score([business('best', 1, 400, 500), business('other', 12, 700, 800)]);
    expect(resultRibbons(items, 'match').get('best')).toEqual(['match', 'price']);
    expect(resultRibbons(items, 'distance').get('best')).toEqual(['distance', 'match']);
    for (const list of resultRibbons(items, 'price').values()) expect(list.length).toBeLessThanOrEqual(MAX_RIBBONS);
  });
});
