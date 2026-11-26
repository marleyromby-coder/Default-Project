/**
 * Builds website/map-land.json for the map on the website's front page: the land around
 * Denmark as [lon, lat] rings, more detailed than the app's web map because the website shows
 * only this corner of the world. Source: Natural Earth 1:10m (public domain) via world-atlas.
 * The website builder reads the JSON, so it still runs without any packages.
 *
 *   npm run website:map
 */
const fs = require('node:fs');
const path = require('node:path');
const { feature } = require('topojson-client');

/** What the map can show: Denmark with room around it. Land outside is cut off at the edge. */
const BOUNDS = { west: 6.5, east: 16.5, south: 53.8, north: 58.6 };
/** Points closer to the line between their neighbours than this (degrees) are dropped. */
const TOLERANCE = 0.0035;
const MIN_POINTS = 4;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const inside = ([lon, lat]) => lon >= BOUNDS.west && lon <= BOUNDS.east && lat >= BOUNDS.south && lat <= BOUNDS.north;

/** Douglas–Peucker: keeps the points that shape the coast. */
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    const [ax, ay] = points[first];
    const [bx, by] = points[last];
    const length = Math.hypot(bx - ax, by - ay);
    let worst = 0;
    let index = -1;
    for (let i = first + 1; i < last; i += 1) {
      // A ring starts and ends in the same point: measure from that point instead of from a line.
      const distance =
        length === 0
          ? Math.hypot(points[i][0] - ax, points[i][1] - ay)
          : Math.abs((by - ay) * points[i][0] - (bx - ax) * points[i][1] + bx * ay - by * ax) / length;
      if (distance > worst) {
        worst = distance;
        index = i;
      }
    }
    if (index > 0 && worst > tolerance) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const topology = require('world-atlas/land-10m.json');
const land = feature(topology, topology.objects.land);
const geometries = land.type === 'FeatureCollection' ? land.features.map((f) => f.geometry) : [land.geometry];

const rings = [];
for (const geometry of geometries) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const [outer] of polygons) {
    if (!outer.some(inside)) continue;
    // Land outside the map is pulled to its edge, where it cannot be seen, instead of being cut.
    const clamped = [];
    for (const [lon, lat] of outer) {
      const point = [clamp(lon, BOUNDS.west, BOUNDS.east), clamp(lat, BOUNDS.south, BOUNDS.north)];
      const last = clamped[clamped.length - 1];
      if (!last || last[0] !== point[0] || last[1] !== point[1]) clamped.push(point);
    }
    const ring = simplify(clamped, TOLERANCE).map(([lon, lat]) => [
      Math.round(lon * 1000) / 1000,
      Math.round(lat * 1000) / 1000,
    ]);
    if (ring.length >= MIN_POINTS) rings.push(ring);
  }
}

const file = path.join(__dirname, '..', 'website', 'map-land.json');
fs.writeFileSync(file, `${JSON.stringify({ bounds: BOUNDS, rings })}\n`);
const points = rings.reduce((sum, ring) => sum + ring.length, 0);
console.log(
  `Wrote ${rings.length} rings (${points} points) to ${path.relative(process.cwd(), file)} (${fs.statSync(file).size} bytes)`,
);
