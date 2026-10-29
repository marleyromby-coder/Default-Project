import type { Coords } from './types';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface Cluster<T> {
  key: string;
  coords: Coords;
  items: T[];
}

/** The whole of Denmark, Bornholm included. */
export const DENMARK_REGION: Region = {
  latitude: 56.15,
  longitude: 11.6,
  latitudeDelta: 3.6,
  longitudeDelta: 7.4,
};

/** Below this width (in degrees of longitude) every business gets its own pin. */
export const NO_CLUSTER_BELOW = 0.08;

/** The selected pin is only lifted out of its cluster at city zoom, so it never hides a big cluster. */
export const SEPARATE_SELECTED_BELOW = 0.8;

/** Pins closer than this share of the map width merge. 0.11 ≈ 43 pt on an iPhone. */
const MERGE_DISTANCE = 0.11;
/** One degree of latitude is this many degrees of longitude on screen in Denmark (1 / cos 56°). */
const LAT_STRETCH = 1.79;

export function regionAround(center: Coords, km: number): Region {
  const latitudeDelta = (km * 2) / 111;
  const longitudeDelta = latitudeDelta / Math.cos((center.lat * Math.PI) / 180);
  return {
    latitude: center.lat,
    longitude: center.lon,
    latitudeDelta,
    longitudeDelta,
  };
}

export function inRegion(region: Region, { lat, lon }: Coords): boolean {
  return (
    Math.abs(lat - region.latitude) <= region.latitudeDelta / 2 &&
    Math.abs(lon - region.longitude) <= region.longitudeDelta / 2
  );
}

/** Smallest region that contains all points, with some margin. */
export function regionForPoints(points: Coords[], margin = 1.4): Region | undefined {
  if (points.length === 0) return undefined;
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max(0.01, (maxLat - minLat) * margin),
    longitudeDelta: Math.max(0.016, (maxLon - minLon) * margin),
  };
}

/**
 * Groups points that would overlap on screen. The merge distance snaps to
 * powers of two of the visible width, so clusters stay put while the user pans
 * and only regroup when the zoom level really changes.
 */
export function clusterPoints<T>(
  items: T[],
  coordsOf: (item: T) => Coords,
  region: Region,
  options: {
    keepSeparate?: (item: T) => boolean;
    /**
     * For pins wider than they are tall (the price pills): merge when they are closer than
     * this share of the map width across and down, instead of the round default.
     */
    spacing?: { x: number; y: number };
  } = {},
): Cluster<T>[] {
  if (region.longitudeDelta < NO_CLUSTER_BELOW) {
    return items.map((item, i) => ({ key: `p${i}`, coords: coordsOf(item), items: [item] }));
  }
  const zoom = Math.round(Math.log2(360 / region.longitudeDelta));
  const width = 360 / 2 ** zoom;
  const radius = width * MERGE_DISTANCE;
  const { spacing } = options;
  const near = spacing
    ? (a: Coords, b: Coords) =>
        Math.abs(a.lon - b.lon) < width * spacing.x && Math.abs(a.lat - b.lat) * LAT_STRETCH < width * spacing.y
    : (a: Coords, b: Coords) => Math.hypot(a.lon - b.lon, (a.lat - b.lat) * LAT_STRETCH) < radius;
  const center = (points: Coords[]) => ({
    lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
    lon: points.reduce((sum, p) => sum + p.lon, 0) / points.length,
  });

  const separate: Cluster<T>[] = [];
  const pool: { item: T; coords: Coords; index: number }[] = [];
  items.forEach((item, index) => {
    const coords = coordsOf(item);
    if (region.longitudeDelta < SEPARATE_SELECTED_BELOW && options.keepSeparate?.(item)) {
      separate.push({ key: `s${index}`, coords, items: [item] });
    } else {
      pool.push({ item, coords, index });
    }
  });
  // A fixed order (west to east) makes the result independent of the input order.
  pool.sort((a, b) => a.coords.lon - b.coords.lon || a.coords.lat - b.coords.lat);

  // Greedy pass: each point starts a group or joins the first group it is near.
  let groups: { members: typeof pool; coords: Coords }[] = [];
  for (const point of pool) {
    const group = groups.find((g) => near(g.coords, point.coords));
    if (group) {
      group.members.push(point);
      group.coords = center(group.members.map((m) => m.coords));
    } else {
      groups.push({ members: [point], coords: point.coords });
    }
  }
  // Moving centres can bring two groups on top of each other; merge those.
  for (let merged = true; merged; ) {
    merged = false;
    for (let i = 0; i < groups.length && !merged; i += 1) {
      for (let j = i + 1; j < groups.length; j += 1) {
        if (near(groups[i].coords, groups[j].coords)) {
          const members = [...groups[i].members, ...groups[j].members];
          groups[i] = { members, coords: center(members.map((m) => m.coords)) };
          groups = groups.filter((_, k) => k !== j);
          merged = true;
          break;
        }
      }
    }
  }

  const clusters = groups.map(({ members, coords }) => {
    const first = Math.min(...members.map((m) => m.index));
    return {
      key: members.length === 1 ? `one:${first}` : `many:${zoom}:${first}`,
      coords,
      items: members.sort((a, b) => a.index - b.index).map((m) => m.item),
    };
  });
  return [...clusters, ...separate];
}
