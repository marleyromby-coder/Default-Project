import { makeBusiness } from '@/__fixtures__/business';
import { getMarket } from '@/lib/markets';
import { FROM_PRICE_RADIUS_KM, lowestHourlyByTrade } from '@/lib/prices';
import type { Business } from '@/lib/types';

const KOEBENHAVN = { lat: 55.6761, lon: 12.5683 };
const ODENSE = { lat: 55.4038, lon: 10.4024 };
const DK = getMarket('DK');

const priced = (id: string, hourlyMin: number, overrides: Partial<Business> = {}) =>
  makeBusiness({
    id,
    pricing: { hourlyMin, hourlyMax: hourlyMin + 100, examples: [], updatedAt: '2026-10-01' },
    ...overrides,
  });

describe('lowestHourlyByTrade', () => {
  it('gives the lowest starting price per trade near the user', () => {
    const prices = lowestHourlyByTrade(
      [
        priced('a', 620),
        priced('b', 560),
        priced('c', 505, { categories: ['elektriker'] }),
        priced('d', 480, { categories: ['vvs', 'toemrer'] }),
      ],
      KOEBENHAVN,
      DK,
    );
    expect(prices.vvs).toEqual({ price: 480, currency: 'DKK', businesses: 3 });
    expect(prices.elektriker).toEqual({ price: 505, currency: 'DKK', businesses: 1 });
    expect(prices.toemrer).toEqual({ price: 480, currency: 'DKK', businesses: 1 });
  });

  it('leaves out trades with no priced business nearby', () => {
    const prices = lowestHourlyByTrade(
      [
        priced('far', 300, { coords: ODENSE }),
        priced('no-price', 0, { categories: ['maler'] }),
        priced('broken', Number.NaN, { categories: ['murer'] }),
      ],
      KOEBENHAVN,
      DK,
    );
    expect(prices).toEqual({});
    expect(prices.mekaniker).toBeUndefined();
  });

  it('uses the results list default radius, or the whole country with null', () => {
    const far = priced('far', 300, { coords: ODENSE });
    expect(FROM_PRICE_RADIUS_KM).toBe(25);
    expect(lowestHourlyByTrade([far], KOEBENHAVN, DK).vvs).toBeUndefined();
    expect(lowestHourlyByTrade([far], KOEBENHAVN, DK, null).vvs?.price).toBe(300);
  });

  it('never mixes countries or currencies', () => {
    const prices = lowestHourlyByTrade(
      [
        priced('se', 200, {
          country: 'SE',
          pricing: { hourlyMin: 200, hourlyMax: 300, currency: 'SEK', examples: [], updatedAt: '2026-10-01' },
        }),
        priced('eur', 100, {
          pricing: { hourlyMin: 100, hourlyMax: 150, currency: 'EUR', examples: [], updatedAt: '2026-10-01' },
        }),
        priced('dk', 540),
      ],
      KOEBENHAVN,
      DK,
      null,
    );
    expect(prices.vvs).toEqual({ price: 540, currency: 'DKK', businesses: 1 });
  });
});
