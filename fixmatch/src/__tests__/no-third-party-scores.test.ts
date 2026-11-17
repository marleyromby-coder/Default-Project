/// <reference types="node" />
import fs from 'node:fs';
import path from 'node:path';

import { infoPagesDa, isInfoSlug } from '@/data/content';
import { infoPagesEn } from '@/data/content-en';
import demo from '@/data/demo-businesses.json';
import en from '@/i18n/en';
import { parseBusinesses } from '@/lib/data-source';
import { PRIORITY_PRESETS, REVIEW_PRIOR_COUNT, weightsFromPriorities, weightsText } from '@/lib/ranking';

/**
 * FixMatch has no agreement with any other review site, so the app never shows, stores or ranks
 * on their scores, stars or counts. A business may only give plain links to its own profiles
 * (data/review-sites.json). The reviews factor uses FixMatch's own reviews.
 */
const OTHER_SITES = /trustpilot|trustscore/i;
const SRC = path.join(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir).flatMap((name: string) => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) return name === '__tests__' ? [] : sourceFiles(full);
    return /\.(ts|tsx|js|json)$/.test(name) ? [full] : [];
  });
}

describe('no scores from other review sites', () => {
  it('leaves other review sites out of the info pages and the app texts', () => {
    for (const pages of [infoPagesDa(), infoPagesEn()]) {
      for (const [slug, page] of Object.entries(pages)) {
        expect({ slug, text: JSON.stringify(page).match(OTHER_SITES)?.[0] }).toEqual({ slug, text: undefined });
      }
    }
    const texts = Object.entries(en).filter(([da, english]) => OTHER_SITES.test(da) || OTHER_SITES.test(english));
    expect(texts).toEqual([]);
  });

  it('names other review sites only in the list of sites a business may link to', () => {
    const files = sourceFiles(SRC)
      .filter((file) => OTHER_SITES.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(SRC, file).split(path.sep).join('/'));
    expect(files).toEqual(['data/review-sites.json']);
  });

  it('keeps only plain links in the demo data', () => {
    for (const business of demo as Record<string, unknown>[]) {
      expect(Object.keys(business).filter((key) => OTHER_SITES.test(key))).toEqual([]);
      for (const link of (business.reviewLinks ?? []) as Record<string, unknown>[]) {
        expect(Object.keys(link).sort()).toEqual(['site', 'url']);
      }
    }
  });

  it('never reads review numbers from a data file', () => {
    const tampered = {
      ...demo[0],
      demo: false,
      trustpilot: { score: 4.9, reviews: 812, url: 'https://example.com', updatedAt: '2026-10-01' },
      reviewSummary: { average: 5, reviews: 400 },
      demoReviews: { average: 5, reviews: 400 },
    };
    const [business] = parseBusinesses([tampered], true);
    expect(business).not.toHaveProperty('trustpilot');
    expect(business.reviewSummary).toBeUndefined();
    expect(business.demoReviews).toBeUndefined();
  });

  it('keeps made-up reviews for demo businesses only, and only when they make sense', () => {
    const parse = (demoReviews: unknown) => parseBusinesses([{ ...demo[0], demo: true, demoReviews }], true)[0];
    expect(parse({ average: 4.2, reviews: 3 }).demoReviews).toEqual({ average: 4.2, reviews: 3 });
    expect(parse({ average: 7, reviews: 3 }).demoReviews).toBeUndefined();
    expect(parse({ average: 4.2, reviews: 0 }).demoReviews).toBeUndefined();
    expect(parse({ average: 4.2, reviews: 2.5 }).demoReviews).toBeUndefined();
  });
});

describe('ranking on FixMatch reviews', () => {
  it('offers all three factors and the "Bedst anmeldt" preset', () => {
    expect(PRIORITY_PRESETS.map((p) => p.id)).toContain('quality');
    const weights = weightsFromPriorities({ price: 4, distance: 3, reviews: 3 });
    expect(weightsText(weights)).toBe('Pris 40 % · Afstand 30 % · Anmeldelser 30 %');
    expect(weightsText(weights, true)).toBe('pris 40 procent, afstand 30 procent, anmeldelser 30 procent');
  });

  it('explains the reviews factor and how reviews are checked (markedsføringsloven § 6 a and § 6 b)', () => {
    expect(isInfoSlug('rangering')).toBe(true);
    expect(isInfoSlug('anmeldelser')).toBe(true);
    const ranking = JSON.stringify(infoPagesDa().rangering);
    expect(ranking).toContain(`${REVIEW_PRIOR_COUNT} neutrale anmeldelser på 4,0`);
    expect(ranking).toContain('kontaktet virksomheden gennem FixMatch');
    const reviews = JSON.stringify(infoPagesDa().anmeldelser);
    expect(reviews).toContain('kontaktet virksomheden gennem FixMatch');
    expect(reviews).toContain('én gang');
    expect(reviews).toContain('§ 6 b');
    expect(reviews).not.toContain('påvirker ikke FixMatch-scoren');
    expect(JSON.stringify(infoPagesEn().rangering)).toContain(`${REVIEW_PRIOR_COUNT} neutral reviews of 4.0`);
  });
});
