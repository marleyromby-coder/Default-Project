import { scoringTrade, sharedTrade } from '@/lib/compare';
import { scoreBusinesses } from '@/lib/ranking';
import type { Business, CategoryId } from '@/lib/types';

import { makeBusiness } from '@/__fixtures__/business';
import demo from '@/data/demo-businesses.json';

const trade = (id: string, ...categories: CategoryId[]) => makeBusiness({ id, categories });

describe('sharedTrade', () => {
  it('is the one trade of businesses that are only in that trade', () => {
    expect(sharedTrade([trade('a', 'vvs'), trade('b', 'vvs'), trade('c', 'vvs')])).toBe('vvs');
  });

  it('finds the trade a two-trade business shares with the others, wherever it is in the list', () => {
    const both = trade('lund', 'toemrer', 'tagdaekker');
    expect(sharedTrade([both, trade('a', 'tagdaekker'), trade('b', 'tagdaekker')])).toBe('tagdaekker');
    expect(sharedTrade([trade('a', 'tagdaekker'), both])).toBe('tagdaekker');
    expect(sharedTrade([both, trade('c', 'toemrer')])).toBe('toemrer');
  });

  it('takes the first business’s order when they share two trades', () => {
    expect(sharedTrade([trade('a', 'toemrer', 'tagdaekker'), trade('b', 'tagdaekker', 'toemrer')])).toBe('toemrer');
  });

  it('is undefined for a mix of trades or an empty list', () => {
    expect(sharedTrade([trade('a', 'vvs'), trade('b', 'maler')])).toBeUndefined();
    expect(sharedTrade([])).toBeUndefined();
  });
});

describe('scoringTrade', () => {
  it('uses the given trade when the business is in it, otherwise its first trade', () => {
    const both = trade('lund', 'toemrer', 'tagdaekker');
    expect(scoringTrade(both, 'tagdaekker')).toBe('tagdaekker');
    expect(scoringTrade(both)).toBe('toemrer');
    expect(scoringTrade(trade('a', 'vvs'), 'tagdaekker')).toBe('vvs');
  });

  it('gives a two-trade business the same match score as on the list of the shared trade', () => {
    // Træværket Lund is a tømrer first, and the cheapest roofer on the Tagdækker list.
    const businesses = demo as unknown as Business[];
    const origin = { lat: 55.6761, lon: 12.5683 };
    const priorities = { price: 4, distance: 3, reviews: 3 };
    const lund = businesses.find((b) => b.id === 'traevaerket-lund')!;
    const roofers = businesses.filter((b) => b.categories.includes('tagdaekker') && (b.country ?? 'DK') === 'DK');
    const compared = [lund, ...roofers.filter((b) => b.categories[0] === 'tagdaekker').slice(0, 2)];
    const shared = sharedTrade(compared);
    expect(shared).toBe('tagdaekker');
    const peers = businesses.filter(
      (b) => b.categories.includes(scoringTrade(lund, shared)) && (b.country ?? 'DK') === 'DK',
    );
    const onList = scoreBusinesses(roofers, origin, priorities).find((s) => s.business.id === lund.id)!;
    const inCompare = scoreBusinesses(peers, origin, priorities).find((s) => s.business.id === lund.id)!;
    expect(inCompare.score).toBe(onList.score);
    // Scored among the tømrere (its first trade) it would get another score.
    const carpenters = businesses.filter((b) => b.categories.includes('toemrer') && (b.country ?? 'DK') === 'DK');
    const asCarpenter = scoreBusinesses(carpenters, origin, priorities).find((s) => s.business.id === lund.id)!;
    expect(asCarpenter.score).not.toBe(onList.score);
  });
});
