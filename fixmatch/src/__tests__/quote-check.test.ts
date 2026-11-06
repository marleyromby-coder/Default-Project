import { makeBusiness } from '@/__fixtures__/business';
import { getCategory } from '@/data/categories';
import { MARKETS } from '@/lib/markets';
import { cheaperOptions, checkQuote, greenDeduction, HIGH_MARGIN, NEARBY_KM } from '@/lib/quote-check';
import { scoreBusinesses } from '@/lib/ranking';
import type { Business } from '@/lib/types';

const NOW = new Date('2026-11-06T12:00:00Z');
const ORIGIN = { lat: 55.6941, lon: 12.5486 }; // København N
const toilet = getCategory('vvs')!.jobs.find((j) => j.id === 'skift-toilet')!;
const floor = getCategory('toemrer')!.jobs.find((j) => j.id === 'gulv')!;

/** A plumber who replaces a toilet for min–max kr. */
function plumber(id: string, min: number, max: number, extra: Partial<Business> = {}): Business {
  return makeBusiness({
    id,
    pricing: {
      hourlyMin: 500,
      hourlyMax: 600,
      examples: [{ job: toilet.id, label: toilet.name, min, max, unit: 'opgave' }],
      updatedAt: '2026-10-01',
    },
    ...extra,
  });
}

const plumbers = [
  plumber('a', 4000, 5000),
  plumber('b', 4200, 5200),
  plumber('c', 4500, 5500),
  plumber('d', 3800, 4800),
];
const input = (price: number, businesses = plumbers) => ({
  price,
  job: toilet,
  category: 'vvs' as const,
  quantity: 1,
  businesses,
  market: MARKETS.DK,
  origin: ORIGIN,
});

describe('Tilbudstjek', () => {
  it('says low, normal, a bit high or high', () => {
    const normal = checkQuote(input(4800));
    expect(normal).toMatchObject({ verdict: 'normal', percent: 0, count: 4, scope: 'nearby' });
    expect(normal.min).toBeLessThan(4800);
    expect(normal.max).toBeGreaterThan(4800);
    expect(checkQuote(input(2000))).toMatchObject({ verdict: 'low' });
    expect(checkQuote(input(normal.max * (1 + HIGH_MARGIN / 2)))).toMatchObject({ verdict: 'high', percent: 13 });
    expect(checkQuote(input(normal.max * 2))).toMatchObject({ verdict: 'veryHigh', percent: 100 });
  });

  it('uses the whole country when too few nearby businesses price the job, and its own estimate when none do', () => {
    const farAway = plumbers.map((b) => ({ ...b, coords: { lat: 57.048, lon: 9.9187 } })); // Aalborg
    expect(checkQuote(input(4800, farAway)).scope).toBe('country');
    const none = checkQuote(input(4800, []));
    expect(none.count).toBe(0);
    expect([none.min, none.max]).toEqual([toilet.min, toilet.max]);
  });

  it('multiplies prices per m² by the area', () => {
    const result = checkQuote({ ...input(20 * 500), job: floor, category: 'toemrer', quantity: 20, businesses: [] });
    expect(result.min).toBe(floor.min * 20);
    expect(result.verdict).toBe('normal');
  });

  it('works out the green deduction: 26 % of the labour, up to 9.000 kr. per adult', () => {
    expect(greenDeduction(3000)).toEqual({ deduction: 3000, saving: 780 });
    expect(greenDeduction(20000)).toEqual({ deduction: 9000, saving: 2340 });
    expect(greenDeduction(20000, 2)).toEqual({ deduction: 18000, saving: 4680 });
    expect(greenDeduction(-5)).toEqual({ deduction: 0, saving: 0 });
  });

  it('suggests nearby businesses that start below the quote, verified first', () => {
    const verified = plumber('verified', 4400, 5400, {
      verified: { date: '2026-10-01', checks: ['cvr', 'identity', 'authorization'] },
    });
    const far = plumber('far', 3000, 3500, { coords: { lat: 57.048, lon: 9.9187 } });
    const scored = scoreBusinesses([...plumbers, verified, far], ORIGIN, { price: 3, distance: 3, reviews: 3 });
    const cheaper = cheaperOptions(4450, toilet, 1, scored, 3, NOW);
    expect(cheaper.map((s) => s.business.id)).toEqual(['verified', 'd', 'a']);
    expect(cheaper.every((s) => s.distanceKm <= NEARBY_KM)).toBe(true);
    expect(cheaperOptions(1000, toilet, 1, scored, 3, NOW)).toEqual([]);
  });
});
