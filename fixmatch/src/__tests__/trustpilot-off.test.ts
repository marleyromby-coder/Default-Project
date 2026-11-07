import { infoPagesDa, isInfoSlug } from '@/data/content';
import { infoPagesEn } from '@/data/content-en';
import { PRIORITY_PRESETS, weightsFromPriorities, weightsText } from '@/lib/ranking';

// The App Store build runs without Trustpilot until there is a partner agreement.
jest.mock('@/lib/features', () => ({ TRUSTPILOT_ENABLED: false }));

// FixMatch's own reviews stay; only Trustpilot goes.
const TRUSTPILOT_WORDS = /trustpilot|trustscore/i;

describe('without Trustpilot', () => {
  it('leaves Trustpilot out of the info pages', () => {
    for (const pages of [infoPagesDa(), infoPagesEn()]) {
      for (const [slug, page] of Object.entries(pages)) {
        expect({ slug, text: JSON.stringify(page).match(TRUSTPILOT_WORDS)?.[0] }).toEqual({ slug, text: undefined });
      }
    }
  });

  it('keeps the page about FixMatch reviews', () => {
    expect(isInfoSlug('anmeldelser')).toBe(true);
    expect(isInfoSlug('rangering')).toBe(true);
    expect(JSON.stringify(infoPagesDa().anmeldelser)).toContain('kontaktet virksomheden gennem FixMatch');
  });

  it('ranks by price and distance only', () => {
    expect(PRIORITY_PRESETS.map((p) => p.id)).not.toContain('quality');
    const weights = weightsFromPriorities({ price: 4, distance: 3, reviews: 5 });
    expect(weights.reviews).toBe(0);
    expect(weightsText(weights)).toBe('Pris 57 % · Afstand 43 %');
    expect(weightsText(weights, true)).toBe('pris 57 procent, afstand 43 procent');
  });
});
