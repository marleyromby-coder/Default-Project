import { clusterPoints, DENMARK_REGION, inRegion, regionAround, regionForPoints } from '@/lib/cluster';

const KBH = { lat: 55.676, lon: 12.568 };
const FRB = { lat: 55.679, lon: 12.533 };
const AARHUS = { lat: 56.157, lon: 10.211 };
const RONNE = { lat: 55.1, lon: 14.7 };

describe('cluster', () => {
  const points = [KBH, FRB, AARHUS, RONNE];

  it('groups Copenhagen into one cluster when all of Denmark is shown', () => {
    const clusters = clusterPoints(points, (p) => p, DENMARK_REGION);
    expect(clusters).toHaveLength(3);
    expect(clusters.find((c) => c.items.length === 2)?.items).toEqual([KBH, FRB]);
  });

  it('shows every pin when zoomed in', () => {
    expect(clusterPoints(points, (p) => p, regionAround(KBH, 2))).toHaveLength(4);
  });

  it('keeps the selected pin out of clusters at city zoom only', () => {
    const NEXT_DOOR = { lat: 55.6765, lon: 12.5685 };
    const city = regionAround(KBH, 15);
    const pair = [KBH, NEXT_DOOR];
    expect(clusterPoints(pair, (p) => p, city)).toHaveLength(1);
    expect(clusterPoints(pair, (p) => p, city, { keepSeparate: (p) => p === NEXT_DOOR })).toHaveLength(2);
    expect(clusterPoints(points, (p) => p, DENMARK_REGION, { keepSeparate: (p) => p === FRB })).toHaveLength(3);
  });

  it('knows what is on screen', () => {
    expect(inRegion(DENMARK_REGION, RONNE)).toBe(true);
    expect(inRegion(regionAround(KBH, 10), AARHUS)).toBe(false);
    const fit = regionForPoints(points)!;
    for (const p of points) expect(inRegion(fit, p)).toBe(true);
  });
});
