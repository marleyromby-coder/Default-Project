import { makeBusiness } from '@/__fixtures__/business';
import { getCategory } from '@/data/categories';
import { MARKETS } from '@/lib/markets';
import { summarizeJobPrice } from '@/lib/prices';
import { checkQuote } from '@/lib/quote-check';
import {
  communitySnapshot,
  postalArea,
  type PriceReport,
  reportPrice,
  resetCommunityStore,
  submitReview,
  summarize,
} from '@/state/community';

const drain = getCategory('vvs')!.jobs.find((j) => j.id === 'stoppet-afloeb')!;
const floor = getCategory('toemrer')!.jobs.find((j) => j.id === 'gulv')!;
const listed = makeBusiness({
  id: 'listed',
  pricing: {
    hourlyMin: 500,
    hourlyMax: 600,
    examples: [{ job: drain.id, label: drain.name, min: 1500, max: 2500, unit: 'opgave' }],
    updatedAt: '2026-10-01',
  },
});

const report = (total: number, extra: Partial<PriceReport> = {}): PriceReport => ({
  businessId: 'listed',
  country: 'DK',
  category: 'vvs',
  job: drain.id,
  total,
  quantity: 1,
  postalArea: '22',
  paidOn: '2026-10-01',
  ...extra,
});

beforeEach(() => resetCommunityStore());

describe('Del, hvad du betalte', () => {
  it('uses what customers paid once 3 have shared, and says so', () => {
    const two = summarizeJobPrice(drain, [listed], MARKETS.DK, [
      { job: drain.id, total: 900, quantity: 1 },
      { job: drain.id, total: 1100, quantity: 1 },
    ]);
    expect(two.source).toBe('listed');
    const paid = [900, 1000, 1100, 1200, 1300].map((total) => ({ job: drain.id, total, quantity: 1 }));
    const summary = summarizeJobPrice(drain, [listed], MARKETS.DK, paid);
    expect(summary).toMatchObject({ source: 'paid', count: 5 });
    expect(summary.min).toBeGreaterThanOrEqual(900);
    expect(summary.max).toBeLessThanOrEqual(1300);
    expect(summarizeJobPrice(drain, [], MARKETS.DK).source).toBe('estimate');
  });

  it('turns prices per m² into prices per unit', () => {
    const paid = [8000, 10000, 12000].map((total) => ({ job: floor.id, total, quantity: 20 }));
    const summary = summarizeJobPrice(floor, [], MARKETS.DK, paid);
    expect(summary.min).toBeGreaterThanOrEqual(400);
    expect(summary.max).toBeLessThanOrEqual(600);
  });

  it('lets Tilbudstjek compare with what customers paid', () => {
    const paid = [900, 1000, 1100].map((total) => ({ job: drain.id, total, quantity: 1 }));
    const result = checkQuote({
      price: 2400,
      job: drain,
      category: 'vvs',
      quantity: 1,
      businesses: [listed],
      market: MARKETS.DK,
      origin: listed.coords,
      paid,
    });
    expect(result).toMatchObject({ source: 'paid', verdict: 'veryHigh', count: 3 });
  });

  it('shares only the first two characters of the postal code', () => {
    expect(postalArea('2200')).toBe('22');
    expect(postalArea('N1 8XX')).toBe('N1');
    expect(postalArea(undefined)).toBe('00');
  });

  it('keeps the report on the phone without a server, one per business and job', async () => {
    await reportPrice(report(1200), undefined);
    await reportPrice(report(1400), undefined);
    expect(communitySnapshot().myPrices).toEqual([report(1400)]);
    expect(communitySnapshot().prices.map((r) => r.total)).toEqual([1400]);
  });
});

describe('Anmeldelser fra rigtige opkald', () => {
  it('keeps one review per business, with the initial only', async () => {
    const user = { id: undefined, name: 'Marley Romby Sangill' };
    await submitReview({ business: listed, rating: 4, text: '  God og hurtig.  ' }, user);
    await submitReview({ business: listed, rating: 5, text: 'Endnu bedre næste gang.' }, user);
    const { myReviews } = communitySnapshot();
    expect(myReviews).toHaveLength(1);
    expect(myReviews[0]).toMatchObject({ rating: 5, text: 'Endnu bedre næste gang.', initial: 'M', mine: true });
  });

  it('summarises the rating', () => {
    const base = { businessId: 'x', createdAt: '2026-11-01T10:00:00Z', initial: 'A' };
    expect(summarize([])).toBeUndefined();
    expect(
      summarize([
        { ...base, id: '1', rating: 5 },
        { ...base, id: '2', rating: 4 },
        { ...base, id: '3', rating: 3 },
      ]),
    ).toEqual({ average: 4, reviews: 3 });
  });
});
