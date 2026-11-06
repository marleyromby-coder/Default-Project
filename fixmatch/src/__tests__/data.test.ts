import { CATEGORIES } from '@/data/categories';
import demo from '@/data/demo-businesses.json';
import {
  DANISH_PLACES,
  INTERNATIONAL_PLACES,
  PLACES,
  findPlaceByPostalCode,
  nearestPlace,
  searchPlaces,
} from '@/data/places';
import { isPhotoKey } from '@/data/photos';
import { openCountries } from '@/lib/business-text';
import { isValidBusiness, parseBusinesses } from '@/lib/data-source';
import { isInDenmark } from '@/lib/geo';
import { getMarket, LAUNCHED_COUNTRIES, MARKETS } from '@/lib/markets';
import type { Business } from '@/lib/types';
import { summarizeJobPrice } from '@/lib/prices';
import { search } from '@/lib/search';

/** What the app shows: the launched countries (Denmark). */
const businesses = parseBusinesses(demo);
/** The whole demo file, including the markets that open later. */
const everyMarket = (demo as unknown[]).filter(isValidBusiness) as Business[];

describe('demo data', () => {
  it('is valid and complete', () => {
    expect(everyMarket).toHaveLength(demo.length);
    expect(new Set(everyMarket.map((b) => b.id)).size).toBe(everyMarket.length);
    for (const category of CATEGORIES) {
      expect(everyMarket.filter((b) => !b.country && b.categories.includes(category.id)).length).toBeGreaterThanOrEqual(
        10,
      );
      for (const country of ['SE', 'NO', 'DE', 'GB']) {
        expect(
          everyMarket.filter((b) => b.country === country && b.categories.includes(category.id)).length,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('can never be mistaken for real businesses', () => {
    const weights = [2, 7, 6, 5, 4, 3, 2, 1];
    // Number ranges reserved for fiction or impossible numbers, per country.
    const fakePhone: Record<string, RegExp> = {
      DK: /^\+4510\d{6}$/,
      SE: /^\+46701746\d{2}$/,
      NO: /^\+4700\d{6}$/,
      DE: /^\+490\d+$/,
      GB: /^\+447700900\d{3}$/,
    };
    for (const b of everyMarket) {
      const country = b.country ?? 'DK';
      expect(b.demo).toBe(true);
      expect(b.contact.phone).toMatch(fakePhone[country]);
      expect(b.contact.website?.endsWith('.example') ?? true).toBe(true); // reserved domain
      if (country === 'DK') {
        const sum = b.cvr.split('').reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
        expect(sum % 11).not.toBe(0); // fails the CVR check digit on purpose
      }
    }
  });

  it('has sane prices, places, photos and texts in both languages', () => {
    for (const b of everyMarket) {
      const market = getMarket(b.country);
      expect(nearestPlace(b.coords).country).toBe(market.country);
      expect(b.pricing.currency ?? 'DKK').toBe(market.currency);
      expect(isPhotoKey(b.photo)).toBe(true);
      expect(b.pricing.hourlyMin).toBeGreaterThanOrEqual(300 * market.fromDkk);
      expect(b.pricing.hourlyMax).toBeGreaterThanOrEqual(b.pricing.hourlyMin);
      for (const e of b.pricing.examples) expect(e.max).toBeGreaterThan(e.min);
      if (b.trustpilot) {
        expect(b.trustpilot.score).toBeGreaterThanOrEqual(1);
        expect(b.trustpilot.score).toBeLessThanOrEqual(5);
      }
      const other = b.country ? b.translations?.da : b.translations?.en;
      expect(other?.tagline).toBeTruthy();
      expect(other?.services?.length).toBe(b.services.length);
    }
    expect(new Set(everyMarket.map((b) => b.country ?? 'DK')).size).toBe(5);
    for (const b of everyMarket.filter((x) => !x.country)) expect(isInDenmark(b.coords)).toBe(true);
  });

  it('keeps demo records out of live data', () => {
    expect(parseBusinesses(demo, false)).toHaveLength(0);
    expect(parseBusinesses(demo, true)).toHaveLength(everyMarket.filter((b) => !b.country).length);
  });

  it('shows only the launched countries (Denmark first)', () => {
    expect(LAUNCHED_COUNTRIES).toEqual(['DK']);
    expect(businesses.length).toBeGreaterThan(100);
    expect(businesses.every((b) => (b.country ?? 'DK') === 'DK')).toBe(true);
  });

  it('rejects malformed records', () => {
    expect(isValidBusiness({ id: 'x' })).toBe(false);
    expect(isValidBusiness(null)).toBe(false);
    expect(parseBusinesses('nope')).toEqual([]);
    const withoutConsent = { ...demo[0], consent: {} };
    expect(isValidBusiness(withoutConsent)).toBe(false);
  });
});

describe('markets', () => {
  it('opens only the countries that have businesses', () => {
    expect(openCountries(businesses)).toEqual(['DK']);
    // Listings for markets that are not launched yet never open them.
    expect(openCountries(everyMarket)).toEqual(['DK']);
    expect(openCountries([])).toEqual(LAUNCHED_COUNTRIES);
  });
});

describe('categories', () => {
  it('have unique job ids and photo keys that exist', () => {
    const jobs = CATEGORIES.flatMap((c) => c.jobs.map((j) => j.id));
    expect(new Set(jobs).size).toBe(jobs.length);
    for (const c of CATEGORIES) expect(isPhotoKey(c.photo)).toBe(true);
  });

  it('summarise job prices from the businesses', () => {
    const vvs = CATEGORIES.find((c) => c.id === 'vvs')!;
    const job = vvs.jobs[0];
    const danish = businesses.filter((b) => (b.country ?? 'DK') === 'DK');
    const summary = summarizeJobPrice(job, danish, MARKETS.DK);
    expect(summary.count).toBeGreaterThan(0);
    expect(summary.currency).toBe('DKK');
    expect(summary.max).toBeGreaterThanOrEqual(summary.min);
    const fallback = summarizeJobPrice(job, [], MARKETS.GB);
    expect(fallback.count).toBe(0);
    expect(fallback.currency).toBe('GBP');
    expect(fallback.max).toBeLessThan(job.max);
  });
});

describe('places', () => {
  it('covers Danish postal codes', () => {
    expect(DANISH_PLACES.length).toBeGreaterThan(550);
    expect(findPlaceByPostalCode('1310')?.name).toBe('København K');
    expect(findPlaceByPostalCode('8000')?.name).toBe('Aarhus C');
    expect(findPlaceByPostalCode('0000')).toBeUndefined();
    for (const p of DANISH_PLACES) expect(isInDenmark(p)).toBe(true);
  });

  it('knows cities abroad but only offers places in Denmark', () => {
    expect(PLACES.length).toBeGreaterThan(3000);
    expect(PLACES.some((p) => p.name === 'London' && p.country === 'GB')).toBe(true);
    expect(nearestPlace({ lat: 52.52, lon: 13.4 }).country).toBe('DE');
    expect(searchPlaces('london').every((p) => p.country === 'DK')).toBe(true);
    expect(searchPlaces('aarhus')[0]).toMatchObject({ name: 'Aarhus C', country: 'DK' });
    expect(INTERNATIONAL_PLACES).toEqual([]);
  });

  it('searches by name and number', () => {
    expect(searchPlaces('aarhus')[0].name).toBe('Aarhus C');
    expect(searchPlaces('kobenhavn')[0].name.startsWith('København')).toBe(true);
    expect(searchPlaces('9000')[0].name).toBe('Aalborg');
  });

  it('names a GPS position after the nearest town', () => {
    expect(nearestPlace({ lat: 55.405, lon: 10.39 }).name).toBe('Odense C');
  });
});

describe('search', () => {
  it('understands everyday words', () => {
    expect(search('låst ude', businesses).categories.map((c) => c.id)).toContain('laasesmed');
    expect(search('toilet', businesses).jobs.map((j) => j.job.id)).toContain('skift-toilet');
    expect(search('tomrer', businesses).categories.map((c) => c.id)).toContain('toemrer');
    expect(search('bilværksted', businesses).categories.map((c) => c.id)).toContain('mekaniker');
    expect(search('a', businesses).categories).toHaveLength(0);
  });
});
