import { infoPagesDa, type InfoPage } from '@/data/content';
import { infoPagesEn } from '@/data/content-en';
import en from '@/i18n/en';
import { applyFilters, DEFAULT_FILTERS } from '@/lib/filters';
import {
  DEFAULT_PRIORITIES,
  PRICE_LEVEL_BAND,
  PRICE_LEVEL_MIN_PEERS,
  priceLevel,
  scoreBusinesses,
  type PriceLevel,
} from '@/lib/ranking';
import type { Business, Filters } from '@/lib/types';

import { makeBusiness } from '@/__fixtures__/business';

/**
 * "Sådan rangerer vi" → "Filtre" says what the price level filter compares (markedsføringsloven
 * § 6 a). These tests keep that text in step with priceLevel and the filter sheet's chips.
 */
const ORIGIN = { lat: 55.6941, lon: 12.5486 };
/** The chips under "Prisniveau" in app/filtre.tsx. */
const CHIPS = ['Alle', 'Lavt', 'Middel', 'Højt'] as const;

const filtersSection = (pages: { rangering: InfoPage }, heading: string) =>
  JSON.stringify(pages.rangering.sections.find((s) => s.heading === heading));

const at = (id: string, hourly: number, extra: Partial<Business> = {}) =>
  makeBusiness({
    id,
    pricing: { hourlyMin: hourly, hourlyMax: hourly, examples: [], updatedAt: '2026-10-01' },
    ...extra,
  });

const withLevel = (level: PriceLevel | null): Filters => ({
  ...DEFAULT_FILTERS,
  maxDistanceKm: null,
  priceLevel: level,
});

describe('the ranking page explains the price level filter', () => {
  it('gives the rule with the numbers the code uses, in Danish and English', () => {
    const band = Math.round(PRICE_LEVEL_BAND * 100);
    const da = filtersSection(infoPagesDa(), 'Filtre');
    expect(da).toContain('midten af timeprisen');
    expect(da).toContain('i samme fag og land, ikke kun dem på listen');
    expect(da).toContain(`inden for ${band} %`);
    expect(da).toContain(`færre end ${PRICE_LEVEL_MIN_PEERS} virksomheder i faget, har de intet prisniveau`);
    const english = filtersSection(infoPagesEn(), 'Filters');
    expect(english).toContain('the middle of the hourly range');
    expect(english).toContain('in the same trade and country, not just those on the list');
    expect(english).toContain(`within ${band} %`);
    expect(english).toContain(`fewer than ${PRICE_LEVEL_MIN_PEERS} businesses in the trade, they have no price level`);
  });

  it('names the chips the filter sheet shows', () => {
    const da = filtersSection(infoPagesDa(), 'Filtre');
    const english = filtersSection(infoPagesEn(), 'Filters');
    for (const chip of CHIPS) {
      expect(da).toContain(`\\"${chip}\\"`);
      expect(english).toContain(`\\"${en[chip]}\\"`);
    }
  });

  it('matches the code: too few in the trade gives no level, so only "Alle" shows them', () => {
    const few = Array.from({ length: PRICE_LEVEL_MIN_PEERS - 1 }, (_, i) => at(`few${i}`, 500 + 100 * i));
    const scored = scoreBusinesses(few, ORIGIN, DEFAULT_PRIORITIES);
    for (const level of [1, 2, 3] as const) {
      expect(applyFilters(scored, withLevel(level), { all: few, category: 'vvs' })).toEqual([]);
    }
    expect(applyFilters(scored, withLevel(null), { all: few, category: 'vvs' })).toHaveLength(few.length);
  });

  it('matches the code: the level compares with the whole trade in the country, not the list', () => {
    const trade = [450, 500, 550, 600, 650].map((p, i) => at(`dk${i}`, p));
    // Only the cheapest is on the list (e.g. after the distance filter), yet it is still "Lavt".
    const shown = scoreBusinesses([trade[0]], ORIGIN, DEFAULT_PRIORITIES);
    expect(applyFilters(shown, withLevel(1), { all: trade, category: 'vvs' })).toHaveLength(1);
    // Businesses in another country do not count towards the minimum.
    const swedish = [400, 500, 600].map((p, i) => at(`se${i}`, p, { country: 'SE' }));
    const two = trade.slice(0, PRICE_LEVEL_MIN_PEERS - 1);
    expect(priceLevel(two[0], [...two, ...swedish], 'vvs')).toBeNull();
  });
});
