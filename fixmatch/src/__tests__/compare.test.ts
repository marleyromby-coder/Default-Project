import { scoringTrade, sharedTrade, toggleCompared } from '@/lib/compare';
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

describe('toggleCompared', () => {
  const max = 3;
  const lund = trade('lund', 'toemrer', 'tagdaekker');
  const roofA = trade('roof-a', 'tagdaekker');
  const roofB = trade('roof-b', 'tagdaekker');
  const roofC = trade('roof-c', 'tagdaekker');
  const carpenter = trade('carpenter', 'toemrer');
  const vvs = [trade('vvs-a', 'vvs'), trade('vvs-b', 'vvs'), trade('vvs-c', 'vvs'), trade('vvs-d', 'vvs')];
  const painter = trade('painter', 'maler');
  const all = [lund, roofA, roofB, roofC, carpenter, ...vvs, painter];
  const tick = (ids: string[]) => ids.reduce<string[]>((list, id) => toggleCompared(list, id, all, max) ?? list, []);

  it('keeps the picks when a two-trade business shares their trade', () => {
    expect(tick(['roof-a', 'roof-b', 'lund'])).toEqual(['roof-a', 'roof-b', 'lund']);
    expect(tick(['lund', 'roof-a', 'roof-b'])).toEqual(['lund', 'roof-a', 'roof-b']);
    expect(tick(['lund', 'carpenter'])).toEqual(['lund', 'carpenter']);
  });

  it('keeps the demo’s roofers when Træværket Lund is ticked on the Tagdækker list', () => {
    const businesses = demo as unknown as Business[];
    const ids = ['tagpapfalken', 'rygningen-tagservice', 'traevaerket-lund'];
    const list = ids.reduce<string[]>((acc, id) => toggleCompared(acc, id, businesses, max) ?? acc, []);
    expect(list).toEqual(ids);
  });

  it('starts over with a business in another trade', () => {
    expect(tick(['vvs-a', 'vvs-b', 'painter'])).toEqual(['painter']);
    expect(tick(['vvs-a', 'vvs-b', 'vvs-c', 'painter'])).toEqual(['painter']);
  });

  it('keeps the picks that share a trade with the new business', () => {
    expect(tick(['roof-a', 'lund', 'carpenter'])).toEqual(['lund', 'carpenter']);
    expect(tick(['roof-a', 'roof-b', 'lund', 'carpenter'])).toEqual(['lund', 'carpenter']);
    expect(toggleCompared(['vvs-a', 'roof-a'], 'roof-b', all, max)).toEqual(['roof-a', 'roof-b']);
  });

  it('holds at most three and leaves a full list as it is', () => {
    const full = ['roof-a', 'roof-b', 'lund'];
    expect(toggleCompared(full, 'roof-c', all, max)).toBeUndefined();
    expect(toggleCompared(['vvs-a', 'vvs-b', 'vvs-c'], 'vvs-d', all, max)).toBeUndefined();
  });

  it('removes a ticked business, also from a full list', () => {
    expect(toggleCompared(['roof-a', 'roof-b', 'lund'], 'lund', all, max)).toEqual(['roof-a', 'roof-b']);
    expect(toggleCompared(['vvs-a', 'vvs-b', 'vvs-c'], 'vvs-b', all, max)).toEqual(['vvs-a', 'vvs-c']);
    expect(toggleCompared(['vvs-a'], 'vvs-a', all, max)).toEqual([]);
  });

  it('adds plain VVS businesses in the order they are ticked', () => {
    expect(tick(['vvs-c', 'vvs-a'])).toEqual(['vvs-c', 'vvs-a']);
    expect(tick(['vvs-a', 'vvs-b', 'vvs-c', 'vvs-d'])).toEqual(['vvs-a', 'vvs-b', 'vvs-c']);
  });

  it('drops saved picks that are no longer listed', () => {
    expect(toggleCompared(['gone', 'vvs-a'], 'vvs-b', all, max)).toEqual(['vvs-a', 'vvs-b']);
  });
});
