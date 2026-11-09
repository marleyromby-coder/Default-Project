import { makeBusiness } from '@/__fixtures__/business';
import { getCategory } from '@/data/categories';
import { EMERGENCIES } from '@/data/emergencies';
import { applyFilters, DEFAULT_FILTERS } from '@/lib/filters';
import { codeFromLink, groupLink } from '@/lib/group-link';
import { createGroup, demoGroups, joinGroup, makeCode, resetGroups } from '@/state/groups';

describe('Naborabat', () => {
  beforeEach(() => resetGroups());

  it('links invites to the group page on the website, which opens the app with the code', () => {
    expect(groupLink('ABC123', 'da')).toBe('https://fixmatchh.netlify.app/naborabat/?kode=ABC123');
    expect(groupLink('ABC123', 'en')).toBe('https://fixmatchh.netlify.app/en/neighbours/?code=ABC123');
    expect(codeFromLink('abc-123x')).toBe('ABC123');
    expect(codeFromLink(['xyz789', 'nope'])).toBe('XYZ789');
    expect(codeFromLink(undefined)).toBe('');
  });

  it('makes readable 6-letter codes without look-alikes', () => {
    const code = makeCode(() => 0.999);
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    expect(code).not.toMatch(/[IO01]/);
  });

  it('creates and joins groups on the phone in the demo', async () => {
    const group = await createGroup(
      {
        country: 'DK',
        postalCode: '2200',
        area: 'Stefansgade',
        category: 'tagdaekker',
        job: 'tagrender',
        wantedFrom: '2026-11-20',
        wantedTo: '2026-12-10',
      },
      undefined,
    );
    expect(group).toMatchObject({ members: 1, status: 'open', mine: 'created' });
    await expect(joinGroup('ZZZZZZ', undefined)).rejects.toMatchObject({ reason: 'not-found' });
  });

  it('has demo groups whose jobs exist', () => {
    for (const group of demoGroups('2200', '2026-11-09')) {
      expect(getCategory(group.category)?.jobs.some((j) => j.id === group.job)).toBe(true);
      expect(group.wantedTo >= group.wantedFrom).toBe(true);
    }
  });
});

describe('Akut hjælp and videotjek', () => {
  it('every emergency points to a real trade and job, with 3–4 steps', () => {
    for (const item of EMERGENCIES) {
      const category = getCategory(item.category);
      expect(category).toBeDefined();
      if (item.job) expect(category?.jobs.some((j) => j.id === item.job)).toBe(true);
      expect(item.steps.length).toBeGreaterThanOrEqual(3);
      expect(item.steps.length).toBeLessThanOrEqual(4);
    }
    expect(EMERGENCIES.find((e) => e.id === 'gas')?.danger).toBeDefined();
  });

  it('filters on businesses that offer a video check', () => {
    const video = makeBusiness({ id: 'video', videoCheck: true });
    const plain = makeBusiness({ id: 'plain' });
    const scored = [
      { business: plain, distanceKm: 1, score: 90 },
      { business: video, distanceKm: 2, score: 80 },
    ] as Parameters<typeof applyFilters>[0];
    const filtered = applyFilters(scored, { ...DEFAULT_FILTERS, videoCheckOnly: true }, { all: [video, plain] });
    expect(filtered.map((s) => s.business.id)).toEqual(['video']);
  });
});
