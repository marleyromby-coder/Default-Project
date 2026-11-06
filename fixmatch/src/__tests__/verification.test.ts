import { makeBusiness } from '@/__fixtures__/business';
import demo from '@/data/demo-businesses.json';
import { parseBusinesses } from '@/lib/data-source';
import { applyFilters, DEFAULT_FILTERS } from '@/lib/filters';
import { scoreBusinesses } from '@/lib/ranking';
import {
  isTopRated,
  isValidVerification,
  isVerified,
  passedChecks,
  requiredChecks,
  verificationExpiry,
} from '@/lib/verification';

const NOW = new Date('2026-11-06T12:00:00Z');
const checked = { date: '2026-10-01', checks: ['cvr', 'identity', 'authorization', 'insurance'] as const };

describe('Verificeret', () => {
  it('needs CVR and the owner, plus the authorisation in trades that require one', () => {
    expect(requiredChecks({ categories: ['vvs'] })).toEqual(['cvr', 'identity', 'authorization']);
    expect(requiredChecks({ categories: ['maler'] })).toEqual(['cvr', 'identity']);
    const plumber = makeBusiness({ id: 'p', verified: { date: '2026-10-01', checks: ['cvr', 'identity'] } });
    expect(isVerified(plumber, NOW)).toBe(false);
    const painter = makeBusiness({ id: 'm', categories: ['maler'], verified: plumber.verified });
    expect(isVerified(painter, NOW)).toBe(true);
    expect(isVerified(makeBusiness({ id: 'x', verified: { ...checked, checks: [...checked.checks] } }), NOW)).toBe(
      true,
    );
  });

  it('lapses a year after the check and ignores dates in the future', () => {
    const business = makeBusiness({ id: 'p', verified: { ...checked, checks: [...checked.checks] } });
    expect(verificationExpiry(business.verified!).toISOString().slice(0, 10)).toBe('2027-10-01');
    expect(isVerified(business, new Date('2027-09-30T12:00:00Z'))).toBe(true);
    expect(isVerified(business, new Date('2027-10-02T12:00:00Z'))).toBe(false);
    expect(
      isVerified(
        makeBusiness({ id: 'f', verified: { date: '2027-01-01', checks: ['cvr', 'identity', 'authorization'] } }),
        NOW,
      ),
    ).toBe(false);
  });

  it('lists the checks in a fixed order and rejects malformed data', () => {
    const business = makeBusiness({
      id: 'p',
      verified: { date: '2026-10-01', checks: ['insurance', 'cvr', 'identity'] },
    });
    expect(passedChecks(business)).toEqual(['cvr', 'identity', 'insurance']);
    expect(isValidVerification({ date: '1. oktober', checks: ['cvr'] })).toBe(false);
    expect(isValidVerification({ date: '2026-10-01', checks: ['cvr', 'blue-tick'] })).toBe(false);
    expect(isValidVerification({ date: '2026-10-01', checks: [] })).toBe(false);
    const [first] = parseBusinesses([{ ...demo[0], verified: { date: 'nope', checks: ['cvr'] } }]);
    expect(first.verified).toBeUndefined();
  });

  it('gives Topbedømt only to verified businesses with many good reviews, and only with Trustpilot on', () => {
    const trustpilot = { score: 4.7, reviews: 80, url: 'x', updatedAt: '2026-10-01' };
    const verified = makeBusiness({ id: 'v', trustpilot, verified: { ...checked, checks: [...checked.checks] } });
    expect(isTopRated(verified, NOW, true)).toBe(true);
    expect(isTopRated(verified, NOW, false)).toBe(false);
    expect(isTopRated({ ...verified, trustpilot: { ...trustpilot, reviews: 10 } }, NOW, true)).toBe(false);
    expect(isTopRated({ ...verified, verified: undefined }, NOW, true)).toBe(false);
  });

  it('can filter the list to verified businesses without changing the score', () => {
    const verified = makeBusiness({ id: 'v', verified: { ...checked, checks: [...checked.checks] } });
    const other = makeBusiness({ id: 'o' });
    const scored = scoreBusinesses(
      [verified, other],
      { lat: 55.69, lon: 12.55 },
      { price: 3, distance: 3, reviews: 3 },
    );
    expect(scored.find((s) => s.business.id === 'v')!.score).toBe(scored.find((s) => s.business.id === 'o')!.score);
    const filtered = applyFilters(
      scored,
      { ...DEFAULT_FILTERS, verifiedOnly: true },
      { all: [verified, other], now: NOW },
    );
    expect(filtered.map((s) => s.business.id)).toEqual(['v']);
  });

  it('has verified demo businesses to show', () => {
    const businesses = parseBusinesses(demo);
    const verified = businesses.filter((b) => isVerified(b, NOW));
    expect(verified.length).toBeGreaterThan(30);
    expect(verified.length).toBeLessThan(businesses.length);
  });
});
