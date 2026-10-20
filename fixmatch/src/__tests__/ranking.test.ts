import { distanceKm, isInDenmark } from '@/lib/geo';
import {
  DEFAULT_PRIORITIES,
  NO_REVIEWS_SCORE,
  priceLevel,
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

  it('drops the review weight when Trustpilot is switched off', () => {
    const w = weightsFromPriorities({ price: 3, distance: 3, reviews: 5 }, false);
    expect(w.reviews).toBe(0);
    expect(w.price).toBeCloseTo(0.5);
  });

  it('clamps out-of-range values', () => {
    const w = weightsFromPriorities({ price: 99, distance: -3, reviews: 1 });
    expect(w.price).toBeCloseTo(5 / 7);
    expect(w.distance).toBeCloseTo(1 / 7);
  });
});

describe('reviewValue', () => {
  it('pulls scores with few reviews towards the prior', () => {
    const few = makeBusiness({ id: 'few', trustpilot: { score: 5, reviews: 2, url: 'x', updatedAt: '2026-10-01' } });
    const many = makeBusiness({ id: 'many', trustpilot: { score: 4.8, reviews: 800, url: 'x', updatedAt: '2026-10-01' } });
    expect(reviewValue(many)).toBeGreaterThan(reviewValue(few));
  });

  it('gives businesses without reviews a neutral-low score', () => {
    expect(reviewValue(makeBusiness({ id: 'none' }))).toBe(NO_REVIEWS_SCORE);
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
    const cheapFirst = sortScored(scoreBusinesses([cheapFar, pricyNear], ORIGIN, { price: 5, distance: 1, reviews: 1 }), 'match');
    const nearFirst = sortScored(scoreBusinesses([cheapFar, pricyNear], ORIGIN, { price: 1, distance: 5, reviews: 1 }), 'match');
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
