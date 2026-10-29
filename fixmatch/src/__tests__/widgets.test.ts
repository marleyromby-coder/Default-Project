import demo from '@/data/demo-businesses.json';
import { parseBusinesses } from '@/lib/data-source';
import type { UserLocation } from '@/lib/types';
import { quickHelpProps, savedProps, widgetTimeline } from '@/widgets/props';

const businesses = parseBusinesses(demo);
const location: UserLocation = {
  source: 'manual',
  coords: { lat: 55.6941, lon: 12.5486 },
  label: 'Nørrebro',
  postalCode: '2200',
};
const favorites = ['roerfalken', 'fjordvand-vvs', 'findes-ikke'];
// Thursday 29 October 2026 at 10:00 in Copenhagen.
const now = new Date('2026-10-29T09:00:00Z');

describe('widgets', () => {
  it('offers every trade with its colour, symbol and a deep link', () => {
    const props = quickHelpProps({ location, favorites, businesses }, now);
    expect(props.trades).toHaveLength(8);
    expect(props.trades[0]).toMatchObject({
      id: 'vvs',
      label: "VVS'er",
      symbol: 'drop.fill',
      url: 'fixmatch://kategori/vvs',
    });
    expect(props.place).toBe('Nørrebro');
    expect(props.describeUrl).toBe('fixmatch://beskriv');
  });

  it('lists saved businesses in order, skipping removed ones, with their opening status', () => {
    const props = savedProps({ location, favorites, businesses }, now);
    expect(props.saved.map((b) => b.id)).toEqual(['roerfalken', 'fjordvand-vvs']);
    const [first] = props.saved;
    expect(first.url).toBe('fixmatch://virksomhed/roerfalken');
    expect(first.initials).toBe('R');
    // Read in the business's own time zone, whatever the test machine's clock says.
    expect(first.status).toMatch(/^Åben til/);
    expect(props.openSummary).toBe('2 åbne nu');
  });

  it('shows the empty state when nothing is saved', () => {
    const props = savedProps({ location, favorites: [], businesses }, now);
    expect(props.saved).toEqual([]);
    expect(props.openSummary).toBe('');
  });

  it('plans a timeline every half hour for the next 12 hours', () => {
    const entries = widgetTimeline((date) => ({ at: date.toISOString() }), new Date('2026-10-29T09:10:00Z'));
    expect(entries[0].date.toISOString()).toBe('2026-10-29T09:10:00.000Z');
    expect(entries[1].date.toISOString()).toBe('2026-10-29T09:30:00.000Z');
    expect(entries.at(-1)?.date.toISOString()).toBe('2026-10-29T21:00:00.000Z');
    expect(entries).toHaveLength(25);
  });
});
