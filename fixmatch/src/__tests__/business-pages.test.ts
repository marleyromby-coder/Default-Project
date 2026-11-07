import { makeBusiness } from '@/__fixtures__/business';
import { parseHours } from '@/lib/opening-hours';
import { complaintBoards, safetyItems, safetySummary } from '@/lib/safety';
import {
  changedFields,
  claimBusiness,
  demoContacts,
  resetBusinessAccount,
  summarizeMonths,
} from '@/state/business-account';

const now = new Date('2026-11-07T12:00:00Z');

describe('Min virksomhed', () => {
  beforeEach(() => resetBusinessAccount());

  it('lets anyone try a demo business, but a real one needs a server and a code', async () => {
    await expect(claimBusiness(makeBusiness({ id: 'demo', demo: true }), '', false)).resolves.toBeUndefined();
    await expect(claimBusiness(makeBusiness({ id: 'real' }), 'secret-code', true)).rejects.toMatchObject({
      reason: 'no-server',
    });
  });

  it('makes up the same demo calls every time and sums them per month', () => {
    const calls = demoContacts('fjordvand-vvs', now);
    expect(calls).toEqual(demoContacts('fjordvand-vvs', now));
    expect(calls.length).toBeGreaterThan(5);
    expect(calls.every((c) => c.name && c.phone)).toBe(true);
    const months = summarizeMonths(calls);
    expect(months.reduce((sum, m) => sum + m.calls + m.messages, 0)).toBe(calls.length);
    expect(months[0].month >= months[months.length - 1].month).toBe(true);
  });

  it('only sends what the owner changed', () => {
    const business = makeBusiness({ id: 'b' });
    expect(changedFields(business, { hourlyMin: 500, hourlyMax: 600, description: '', emergency: false })).toEqual({});
    expect(
      changedFields(business, {
        hourlyMin: 550,
        hourlyMax: 600,
        hours: business.hours,
        examples: [{ job: 'stoppet-afloeb', min: 900, max: 1800, unit: 'opgave' }],
        note: '  Nyt nummer  ',
      }),
    ).toEqual({
      hourlyMin: 550,
      examples: [{ job: 'stoppet-afloeb', min: 900, max: 1800, unit: 'opgave' }],
      note: 'Nyt nummer',
    });
  });

  it('understands opening hours the way people type them', () => {
    expect(parseHours('7-16')).toEqual(['07:00', '16:00']);
    expect(parseHours('07.30 – 15.30')).toEqual(['07:30', '15:30']);
    expect(parseHours('')).toBeNull();
    expect(parseHours('Lukket')).toBeNull();
    expect(parseHours('16-7')).toBe('invalid');
    expect(parseHours('hele dagen')).toBe('invalid');
  });
});

describe('Tryghed', () => {
  it('says what FixMatch checked, what the business only stated, and what is missing', () => {
    const business = makeBusiness({
      id: 'vvs',
      authorizations: [{ kind: 'vvs', number: '41413' }],
      insurer: 'Kyst Forsikring',
      verified: { date: '2026-10-01', checks: ['cvr', 'identity', 'authorization'] },
    });
    const items = safetyItems(business, now);
    expect(items.map((i) => [i.key, i.status])).toEqual([
      ['cvr', 'checked'],
      ['identity', 'checked'],
      ['authorization', 'checked'],
      ['insurance', 'stated'],
      ['guarantee', 'missing'],
    ]);
    expect(safetySummary(items)).toEqual({ checked: 3, total: 5 });
  });

  it('warns when a trade needs an authorisation and none is given, and skips it otherwise', () => {
    const plumber = safetyItems(makeBusiness({ id: 'p' }), now);
    expect(plumber.find((i) => i.key === 'authorization')?.status).toBe('missing');
    const painter = safetyItems(makeBusiness({ id: 'm', categories: ['maler'] }), now);
    expect(painter.find((i) => i.key === 'authorization')).toBeUndefined();
  });

  it('does not count an expired check', () => {
    const old = makeBusiness({ id: 'old', verified: { date: '2025-01-01', checks: ['cvr', 'identity'] } });
    expect(safetyItems(old, now).find((i) => i.key === 'identity')?.status).toBe('missing');
  });

  it('points to the right complaint boards, ending with Forbrugerklagenævnet', () => {
    const names = (categories: Parameters<typeof makeBusiness>[0]['categories']) =>
      complaintBoards(makeBusiness({ id: 'x', categories })).map((b) => b.name);
    expect(names(['vvs'])).toEqual(['Ankenævnet for Tekniske Installationer', 'Forbrugerklagenævnet']);
    expect(names(['mekaniker'])[0]).toBe('Ankenævnet for biler');
    expect(names(['laasesmed'])).toEqual(['Forbrugerklagenævnet']);
  });
});
