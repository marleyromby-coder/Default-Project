/**
 * Builds src/data/denmark-outline.json: Denmark's coastline as simplified
 * [lon, lat] rings for the web map. Source: Natural Earth (public domain) via
 * the world-atlas package.
 *
 *   node scripts/build-denmark-outline.js
 */
const fs = require('node:fs');
const path = require('node:path');
const { feature } = require('topojson-client');

const DENMARK = '208'; // ISO 3166-1 numeric
const MIN_POINTS = 4;

const topology = require('world-atlas/countries-10m.json');
const countries = feature(topology, topology.objects.countries);
const denmark = countries.features.find((f) => String(f.id) === DENMARK);
if (!denmark) throw new Error('Denmark not found in world-atlas');

const polygons = denmark.geometry.type === 'Polygon' ? [denmark.geometry.coordinates] : denmark.geometry.coordinates;

/** Drops points closer than `tolerance` degrees to the previous kept point. */
function thin(ring, tolerance) {
  const kept = [ring[0]];
  for (const point of ring.slice(1)) {
    const last = kept[kept.length - 1];
    if (Math.hypot(point[0] - last[0], point[1] - last[1]) >= tolerance) kept.push(point);
  }
  return kept.map(([lon, lat]) => [Math.round(lon * 1000) / 1000, Math.round(lat * 1000) / 1000]);
}

const rings = polygons
  .map((polygon) => thin(polygon[0], 0.012))
  .filter((ring) => ring.length >= MIN_POINTS);

const out = path.join(__dirname, '..', 'src', 'data', 'denmark-outline.json');
fs.writeFileSync(out, JSON.stringify(rings) + '\n');
console.log(`Wrote ${rings.length} rings, ${rings.reduce((n, r) => n + r.length, 0)} points to ${path.relative(process.cwd(), out)}`);
