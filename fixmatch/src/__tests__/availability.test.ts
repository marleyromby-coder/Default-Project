import { makeBusiness } from '@/__fixtures__/business';
import {
  availableWhen,
  demoAvailability,
  localDay,
  nextDay,
  parseAvailability,
  withAvailability,
} from '@/lib/availability';
import { applyFilters, DEFAULT_FILTERS } from '@/lib/filters';
import { matchBudget } from '@/lib/matcher';

// 23:30 in Copenhagen on 7 November (22:30 UTC).
const lateEvening = new Date('2026-11-07T22:30:00Z');

describe('Hvem har tid i dag?', () => {
  it('counts days in the business’s own time zone', () => {
    expect(localDay(lateEvening, 'Europe/Copenhagen')).toBe('2026-11-07');
    expect(localDay(new Date('2026-11-07T23:30:00Z'), 'Europe/Copenhagen')).toBe('2026-11-08');
    expect(nextDay('2026-12-31')).toBe('2027-01-01');
  });

  it('says today or tomorrow, and forgets old days by itself', () => {
    const business = makeBusiness({ id: 'b', availableOn: ['2026-11-07'] });
    expect(availableWhen(business, lateEvening)).toBe('today');
    expect(availableWhen(business, new Date('2026-11-06T10:00:00Z'))).toBe('tomorrow');
    expect(availableWhen(business, new Date('2026-11-08T10:00:00Z'))).toBeUndefined();
    expect(availableWhen(makeBusiness({ id: 'none' }), lateEvening)).toBeUndefined();
  });

  it('reads only well-formed rows from the server', () => {
    expect(
      parseAvailability([
        { business_id: 'a', available_on: ['2026-11-07', 'nonsense'] },
        { business_id: 'b', available_on: [] },
        { business_id: 3, available_on: ['2026-11-07'] },
        null,
      ]),
    ).toEqual({ a: ['2026-11-07'] });
    expect(parseAvailability('nope')).toEqual({});
  });

  it('only makes up free days for demo businesses', () => {
    const demo = Array.from({ length: 40 }, (_, i) => makeBusiness({ id: `demo-${i}`, demo: true }));
    const real = makeBusiness({ id: 'real', demo: false });
    const map = demoAvailability([...demo, real], lateEvening);
    expect(map.real).toBeUndefined();
    const free = Object.keys(map).length;
    expect(free).toBeGreaterThan(5);
    expect(free).toBeLessThan(35);
    // The server's days replace the old ones; a business missing from the map has none.
    const [first] = withAvailability([makeBusiness({ id: 'x', availableOn: ['2026-11-01'] })], {});
    expect(first.availableOn).toBeUndefined();
  });

  it('filters on free time and puts free businesses first when it is urgent', () => {
    const free = makeBusiness({ id: 'free', availableOn: ['2026-11-07'] });
    const busy = makeBusiness({ id: 'busy' });
    const scored = [
      { business: busy, distanceKm: 1, score: 90 },
      { business: free, distanceKm: 1, score: 60 },
    ] as Parameters<typeof applyFilters>[0];
    const filtered = applyFilters(
      scored,
      { ...DEFAULT_FILTERS, availableSoon: true },
      { all: [free, busy], now: lateEvening },
    );
    expect(filtered.map((s) => s.business.id)).toEqual(['free']);
    const category = free.categories[0];
    expect(matchBudget({ category, urgent: true }, scored, lateEvening)[0].business.id).toBe('free');
    expect(matchBudget({ category }, scored, lateEvening)[0].business.id).toBe('busy');
  });
});
