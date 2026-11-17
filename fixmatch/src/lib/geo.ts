import type { Coords } from './types';

const EARTH_RADIUS_KM = 6371.0088;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle ("luftlinje") distance in kilometres. */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing from `a` to `b` in degrees (0 = north, 90 = east). */
export function bearingDegrees(a: Coords, b: Coords): number {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const dLon = toRadians(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

/**
 * Denmark's borders as a polygon of [lon, lat] points, west to east along the border with Germany,
 * then north past Bornholm, Øresund and Kattegat. The land border follows Natural Earth (1:10m,
 * public domain). The sea borders run through open water, at least a few kilometres from land.
 */
const DANISH_BORDERS: [lon: number, lat: number][] = [
  [7, 55.08],
  [8.42, 55.08],
  [8.47, 55.058],
  [8.6, 54.91],
  [8.66, 54.896],
  [8.696, 54.889],
  [8.732, 54.889],
  [8.8, 54.905],
  [8.825, 54.906],
  [8.905, 54.898],
  [8.984, 54.879],
  [9.196, 54.851],
  [9.211, 54.842],
  [9.214, 54.832],
  [9.218, 54.819],
  [9.225, 54.807],
  [9.243, 54.802],
  [9.319, 54.802],
  [9.333, 54.803],
  [9.34, 54.808],
  [9.355, 54.812],
  [9.365, 54.817],
  [9.383, 54.82],
  [9.405, 54.808],
  [9.423, 54.807],
  [9.437, 54.81],
  [9.45, 54.82],
  [9.5, 54.84],
  [9.53, 54.86],
  [9.56, 54.878],
  [9.59, 54.88],
  [9.63, 54.845],
  [9.68, 54.827],
  [9.73, 54.82],
  [10, 54.8],
  [10.7, 54.66],
  [11.3, 54.6],
  [12, 54.5],
  [12.6, 54.55],
  [13, 54.62],
  [13.3, 54.75],
  [15.6, 54.85],
  [15.6, 55.45],
  [14.6, 55.45],
  [14.4, 55.3],
  [12.9, 55.25],
  [12.72, 55.45],
  [12.85, 55.62],
  [12.62, 55.93],
  [12.66, 56.03],
  [12.45, 56.15],
  [12.1, 56.7],
  [11.5, 57.5],
  [11, 57.95],
  [10, 58.05],
  [7, 57.85],
];

/** Whether a position is inside Denmark's borders, by land or sea (DANISH_BORDERS). */
export function isInsideDanishBorders({ lat, lon }: Coords): boolean {
  let inside = false;
  for (let i = 0, j = DANISH_BORDERS.length - 1; i < DANISH_BORDERS.length; j = i++) {
    const [xi, yi] = DANISH_BORDERS[i];
    const [xj, yj] = DANISH_BORDERS[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Rough bounding box of Denmark incl. Bornholm, used to sanity-check coordinates. */
export function isInDenmark({ lat, lon }: Coords): boolean {
  return lat >= 54.4 && lat <= 57.9 && lon >= 7.9 && lon <= 15.3;
}
