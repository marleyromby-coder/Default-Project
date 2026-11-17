import { distanceKm, isInDenmark } from '@/lib/geo';
import {
  bestReviewed,
  DEFAULT_PRIORITIES,
  priceLevel,
  REVIEW_PRIOR_COUNT,
  REVIEW_PRIOR_MEAN,
  reviewValue,
  scoreBusinesses,
  sortScored,
  weightsFromPriorities,
} from '@/lib/ranking';

import { makeBusiness } from '@/__fixtures__/business';

const ORIGIN = { lat: 55.6941, lon: 12.5486 }; // Nørrebro

describe('geo', () => {
  it('measures straight-line distances', () => {
    const aarhus = { lat: 56.1567, lon: 10.2108 };
    expect(distanceKm(ORIGIN, aarhus)).toBeGreaterThan(150);
    expect(distanceKm(ORIGIN, aarhus)).toBeLessThan(160);
    expect(distanceKm(ORIGIN, ORIGIN)).toBe(0);
  });

  it('knows roughly where Denmark is', () => {
    expect(isInDenmark(ORIGIN)).toBe(true);
    expect(isInDenmark({ lat: 55.1, lon: 14.7 })).toBe(true); // Bornholm
    expect(isInDenmark({ lat: 59.33, lon: 18.06 })).toBe(false); // Stockholm
  });
});

describe('weights', () => {
  it('always add up to 100 %', () => {
    const w = weightsFromPriorities({ price: 5, distance: 1, reviews: 3 });
    expect(w.price + w.distance + w.reviews).toBeCloseTo(1);
    expect(w.price).toBeCloseTo(5 / 9);
  });

  it('weighs price, distance and reviews 40/30/30 by default', () => {
    const w = weightsFromPriorities(DEFAULT_PRIORITIES);
    expect([w.price, w.distance, w.reviews].map((x) => Math.round(x * 100))).toEqual([40, 30, 30]);
  });

  it('clamps out-of-range values', () => {
    const w = weightsFromPriorities({ price: 99, distance: -3, reviews: 1 });
    expect(w.price).toBeCloseTo(5 / 7);
    expect(w.distance).toBeCloseTo(1 / 7);
  });
});

describe('reviewValue (FixMatch reviews)', () => {
  const reviewed = (id: string, average: number, reviews: number) =>
    makeBusiness({ id, reviewSummary: { average, reviews } });

  it('uses a prior of 5 reviews of 4.0', () => {
    expect(REVIEW_PRIOR_COUNT).toBe(5);
    expect(REVIEW_PRIOR_MEAN).toBe(4);
    expect(reviewValue(reviewed('one', 5, 1))).toBeCloseTo(25 / 6);
    expect(reviewValue(reviewed('ten', 4.8, 10))).toBeCloseTo(4.5333, 3);
  });

  it('pulls few reviews towards the prior, so many good reviews beat one perfect one', () => {
    expect(reviewValue(reviewed('many', 4.8, 40))).toBeGreaterThan(reviewValue(reviewed('few', 5, 1)));
  });

  it('counts a business without reviews as exactly the prior, neither better nor worse', () => {
    expect(reviewValue(makeBusiness({ id: 'none' }))).toBe(REVIEW_PRIOR_MEAN);
    expect(reviewValue(reviewed('zero', 1, 0))).toBe(REVIEW_PRIOR_MEAN);
  });

  it('ranks bad reviews below no reviews', () => {
    const bad = reviewed('bad', 2, 6);
    const none = makeBusiness({ id: 'none' });
    expect(reviewValue(bad)).toBeLessThan(reviewValue(none));
    const [badScore, noneScore] = scoreBusinesses([bad, none], ORIGIN, DEFAULT_PRIORITIES);
    expect(badScore.parts.reviews).toBeLessThan(noneScore.parts.reviews);
    expect(badScore.score).toBeLessThan(noneScore.score);
  });
});

describe('scoreBusinesses', () => {
  const cheapFar = makeBusiness({
    id: 'cheap-far',
    coords: { lat: 55.78, lon: 12.55 },
    pricing: { hourlyMin: 450, hourlyMax: 500, examples: [], updatedAt: '2026-10-01' },
  });
  const pricyNear = makeBusiness({
    id: 'pricy-near',
    pricing: { hourlyMin: 700, hourlyMax: 800, examples: [], updatedAt: '2026-10-01' },
  });

  it('scores price and distance parts in the right direction', () => {
    const [far, near] = scoreBusinesses([cheapFar, pricyNear], ORIGIN, DEFAULT_PRIORITIES);
    expect(far.parts.price).toBe(1);
    expect(near.parts.price).toBe(0);
    expect(near.parts.distance).toBeGreaterThan(far.parts.distance);
    expect(near.distanceKm).toBeCloseTo(0, 5);
  });

  it('follows the user priorities', () => {
    const cheapFirst = sortScored(
      scoreBusinesses([cheapFar, pricyNear], ORIGIN, { price: 5, distance: 1, reviews: 1 }),
      'match',
    );
    const nearFirst = sortScored(
      scoreBusinesses([cheapFar, pricyNear], ORIGIN, { price: 1, distance: 5, reviews: 1 }),
      'match',
    );
    expect(cheapFirst[0].business.id).toBe('cheap-far');
    expect(nearFirst[0].business.id).toBe('pricy-near');
  });

  it('ignores paid promotion', () => {
    const plain = scoreBusinesses([cheapFar, pricyNear], ORIGIN, DEFAULT_PRIORITIES);
    const promoted = scoreBusinesses([{ ...cheapFar }, { ...pricyNear, promoted: true }], ORIGIN, DEFAULT_PRIORITIES);
    expect(promoted.map((s) => s.score)).toEqual(plain.map((s) => s.score));
  });

  it('keeps every score between 0 and 100', () => {
    for (const s of scoreBusinesses([cheapFar, pricyNear], ORIGIN, DEFAULT_PRIORITIES)) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
    }
  });

  it('sorts by price, distance and rating', () => {
    const scored = scoreBusinesses([cheapFar, pricyNear], ORIGIN, DEFAULT_PRIORITIES);
    expect(sortScored(scored, 'price')[0].business.id).toBe('cheap-far');
    expect(sortScored(scored, 'distance')[0].business.id).toBe('pricy-near');
    // Nobody has reviews: the rating sort falls back to distance.
    expect(sortScored(scored, 'rating').map((s) => s.business.id)).toEqual(['pricy-near', 'cheap-far']);
  });

  it('sorts by reviews, then by the number of reviews, then by distance', () => {
    const at = (id: string, lat: number, summary?: { average: number; reviews: number }) =>
      makeBusiness({ id, coords: { lat, lon: 12.5486 }, reviewSummary: summary });
    const list = [
      at('none-near', 55.6941),
      at('two-at-4', 55.7, { average: 4, reviews: 2 }),
      at('ten-at-4', 55.75, { average: 4, reviews: 10 }),
      at('good', 55.8, { average: 4.8, reviews: 12 }),
      at('none-far', 55.9),
    ];
    const order = sortScored(scoreBusinesses(list, ORIGIN, DEFAULT_PRIORITIES), 'rating');
    expect(order.map((s) => s.business.id)).toEqual(['good', 'ten-at-4', 'two-at-4', 'none-near', 'none-far']);
  });

  it('puts businesses without reviews after every reviewed one in the rating sort', () => {
    const at = (id: string, lat: number, summary?: { average: number; reviews: number }) =>
      makeBusiness({ id, coords: { lat, lon: 12.5486 }, reviewSummary: summary });
    const list = [
      at('none-near', 55.6941),
      at('low', 55.9, { average: 3.9, reviews: 10 }),
      at('one-bad', 56, { average: 2, reviews: 1 }),
      at('good', 55.8, { average: 4.8, reviews: 12 }),
      at('none-far', 55.95),
    ];
    // Without reviews a business has the prior (4.0) in the score, more than 'low' and 'one-bad'.
    expect(reviewValue(list[0])).toBeGreaterThan(reviewValue(list[1]));
    const order = sortScored(scoreBusinesses(list, ORIGIN, DEFAULT_PRIORITIES), 'rating');
    expect(order.map((s) => s.business.id)).toEqual(['good', 'low', 'one-bad', 'none-near', 'none-far']);
  });

  it('keeps the order of price and distance while nobody has reviews (as at launch)', () => {
    const list = [
      ['a', 450, 55.75],
      ['b', 520, 55.7],
      ['c', 600, 55.6941],
      ['d', 480, 55.95],
      ['e', 700, 55.72],
      ['f', 800, 56.1],
    ].map(([id, price, lat]) =>
      makeBusiness({
        id: id as string,
        coords: { lat: lat as number, lon: 12.5486 },
        pricing: { hourlyMin: price as number, hourlyMax: price as number, examples: [], updatedAt: '2026-10-01' },
      }),
    );
    const scored = scoreBusinesses(list, ORIGIN, DEFAULT_PRIORITIES);
    expect(new Set(scored.map((s) => s.parts.reviews)).size).toBe(1);
    const { price, distance } = weightsFromPriorities(DEFAULT_PRIORITIES);
    const byPriceAndDistance = [...scored]
      .sort((x, y) => price * (y.parts.price - x.parts.price) + distance * (y.parts.distance - x.parts.distance))
      .map((s) => s.business.id);
    expect(sortScored(scored, 'match').map((s) => s.business.id)).toEqual(byPriceAndDistance);
  });
});

describe('priceLevel', () => {
  it('compares with the median of the trade', () => {
    const peers = [500, 550, 600, 650, 700].map((p, i) =>
      makeBusiness({ id: `p${i}`, pricing: { hourlyMin: p, hourlyMax: p, examples: [], updatedAt: '2026-10-01' } }),
    );
    expect(priceLevel(peers[0], peers)).toBe(1);
    expect(priceLevel(peers[2], peers)).toBe(2);
    expect(priceLevel(peers[4], peers)).toBe(3);
  });
});

describe('bestReviewed (compare screen)', () => {
  const scored = (...list: { id: string; summary?: { average: number; reviews: number } }[]) =>
    scoreBusinesses(
      list.map(({ id, summary }) => makeBusiness({ id, reviewSummary: summary })),
      ORIGIN,
      DEFAULT_PRIORITIES,
    );

  it('never gives "Bedst anmeldt" to a business without reviews', () => {
    const none = { id: 'none' };
    const low = { id: 'low', summary: { average: 3.9, reviews: 10 } };
    const good = { id: 'good', summary: { average: 4.6, reviews: 8 } };
    // Fewer than two reviewed businesses: nothing to compare, no badge.
    expect(bestReviewed(scored(none, low))).toBeUndefined();
    expect(bestReviewed(scored(none, { id: 'zero', summary: { average: 5, reviews: 0 } }))).toBeUndefined();
    expect(bestReviewed(scored(none, low, good))).toBe('good');
    expect(bestReviewed(scored(low, good))).toBe('good');
    expect(bestReviewed(scored(good, { ...good, id: 'same' }))).toBeUndefined();
  });
});
