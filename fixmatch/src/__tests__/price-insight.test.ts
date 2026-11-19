import { setLanguage } from '@/i18n';
import { priceGroupText, priceInsight, priceLevelLabel, tradeInSentence } from '@/lib/price-insight';
import { priceLevel } from '@/lib/ranking';
import type { Business } from '@/lib/types';

import { makeBusiness } from '@/__fixtures__/business';

const priced = (id: string, min: number, max: number, overrides: Partial<Business> = {}) =>
  makeBusiness({
    id,
    pricing: { hourlyMin: min, hourlyMax: max, examples: [], updatedAt: '2026-10-01' },
    ...overrides,
  });

// Midpoints 500, 550, 600, 650, 700: the median is 600, "middel" is 564–636.
const GROUP = [
  priced('a', 450, 550),
  priced('b', 500, 600),
  priced('c', 550, 650),
  priced('d', 600, 700),
  priced('e', 650, 750),
];

describe('priceInsight', () => {
  beforeAll(() => setLanguage('da'));

  it('gives the same level as priceLevel, from the same businesses', () => {
    for (const business of GROUP) {
      const insight = priceInsight(business, GROUP);
      expect(insight.level).toBe(priceLevel(business, GROUP));
      expect(insight.count).toBe(GROUP.length);
    }
    expect(priceInsight(GROUP[0], GROUP).level).toBe(1);
    expect(priceInsight(GROUP[2], GROUP).level).toBe(2);
    expect(priceInsight(GROUP[4], GROUP).level).toBe(3);
  });

  it('places the range, its middle and the "middel" band on a bar from the lowest to the highest rate', () => {
    const insight = priceInsight(GROUP[1], GROUP);
    expect(insight.low).toBe(450);
    expect(insight.high).toBe(750);
    expect(insight.from).toBeCloseTo(50 / 300);
    expect(insight.to).toBeCloseTo(150 / 300);
    expect(insight.point).toBeCloseTo(100 / 300);
    expect(insight.middle?.at).toBeCloseTo(150 / 300);
    expect(insight.middle?.from).toBeCloseTo((600 * 0.94 - 450) / 300);
    expect(insight.middle?.to).toBeCloseTo((600 * 1.06 - 450) / 300);
    // The cheapest starts at the left end, the most expensive ends at the right.
    expect(priceInsight(GROUP[0], GROUP).from).toBe(0);
    expect(priceInsight(GROUP[4], GROUP).to).toBe(1);
  });

  it('puts a business whose middle is in the band at "middel", and outside it at lav or høj', () => {
    for (const business of GROUP) {
      const { point, middle, level } = priceInsight(business, GROUP);
      const expected = point < middle!.from ? 1 : point > middle!.to ? 3 : 2;
      expect(level).toBe(expected);
    }
  });

  it('only compares within one trade and one country', () => {
    const others = [priced('el', 100, 200, { categories: ['elektriker'] }), priced('se', 900, 1000, { country: 'SE' })];
    const insight = priceInsight(GROUP[2], [...GROUP, ...others]);
    expect(insight.count).toBe(GROUP.length);
    expect(insight.low).toBe(450);
    expect(insight.high).toBe(750);
  });

  it('counts a business with several trades in the trade asked for', () => {
    const both = priced('both', 600, 600, { categories: ['elektriker', 'vvs'] });
    expect(priceInsight(both, [...GROUP, both], 'vvs').count).toBe(GROUP.length + 1);
    expect(priceInsight(both, [...GROUP, both]).count).toBe(1);
  });

  it('gives no level with fewer than three businesses', () => {
    const alone = priceInsight(GROUP[0], [GROUP[0]]);
    expect(alone.count).toBe(1);
    expect(alone.level).toBeNull();
    expect(alone.middle).toBeUndefined();
    const two = priceInsight(GROUP[0], GROUP.slice(0, 2));
    expect(two.count).toBe(2);
    expect(two.level).toBeNull();
  });

  it('handles a business that is not in the list, and a group with one price', () => {
    const outside = priceInsight(GROUP[0], []);
    expect(outside.count).toBe(0);
    expect(outside.level).toBeNull();
    expect([outside.from, outside.to, outside.point]).toEqual([0, 1, 0.5]);
    const same = [priced('x', 500, 500), priced('y', 500, 500), priced('z', 500, 500)];
    const flat = priceInsight(same[0], same);
    expect(flat.level).toBe(2);
    expect([flat.from, flat.to, flat.point, flat.middle?.at]).toEqual([0.5, 0.5, 0.5, 0.5]);
  });
});

describe('price insight texts', () => {
  beforeAll(() => setLanguage('da'));
  afterAll(() => setLanguage('da'));

  it('uses neutral words for the levels', () => {
    expect([1, 2, 3].map((level) => priceLevelLabel(level as 1 | 2 | 3))).toEqual(['Lav pris', 'Middel', 'Høj pris']);
  });

  it('names what the price is compared with', () => {
    expect(priceGroupText(priceInsight(GROUP[0], GROUP), "VVS'ere", 'Danmark')).toBe(
      "Blandt 5 VVS'ere på FixMatch i Danmark",
    );
    expect(priceGroupText(priceInsight(GROUP[0], GROUP), 'Elektrikere', 'Danmark')).toBe(
      'Blandt 5 elektrikere på FixMatch i Danmark',
    );
  });

  it('says when there is nothing or too little to compare with', () => {
    expect(priceGroupText(priceInsight(GROUP[0], [GROUP[0]]), "VVS'ere", 'Danmark')).toBe(
      "Ingen andre VVS'ere på FixMatch i Danmark at sammenligne med endnu.",
    );
    expect(priceGroupText(priceInsight(GROUP[0], GROUP.slice(0, 2)), "VVS'ere", 'Danmark')).toBe(
      "For få at sammenligne med: kun 2 VVS'ere på FixMatch i Danmark.",
    );
  });

  it('keeps a trade written in capitals as it is', () => {
    expect(tradeInSentence("VVS'ere")).toBe("VVS'ere");
    expect(tradeInSentence('Låsesmede')).toBe('låsesmede');
    expect(tradeInSentence('Plumbers')).toBe('plumbers');
  });

  it('has English texts', () => {
    setLanguage('en');
    expect(priceLevelLabel(1)).toBe('Low price');
    expect(priceGroupText(priceInsight(GROUP[0], GROUP), 'Plumbers', 'Denmark')).toBe(
      'Among 5 plumbers on FixMatch in Denmark',
    );
  });
});
