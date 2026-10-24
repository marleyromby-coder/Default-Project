/**
 * Builds src/data/map-outline.json for the web demo map: simplified country
 * outlines as [lon, lat] rings. FixMatch's countries are detailed, the rest of
 * the world is coarse. Source: Natural Earth (public domain) via world-atlas.
 *
 *   node scripts/build-map-outline.js
 */
const fs = require('node:fs');
const path = require('node:path');
const { feature } = require('topojson-client');

/** ISO 3166-1 numeric ids, with the source scale and how far apart points may be (degrees). */
const DETAILED = {
  208: ['10m', 0.012], // Denmark
  752: ['50m', 0.015], // Sweden
  578: ['50m', 0.03], // Norway
  276: ['50m', 0.015], // Germany
  826: ['50m', 0.015], // United Kingdom
  840: ['50m', 0.04], // United States
};
const MIN_POINTS = 4;

const load = (scale) => {
  const topology = require(`world-atlas/countries-${scale}.json`);
  return feature(topology, topology.objects.countries).features;
};

function rings(geometry, tolerance) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons
    .map(([outer]) => {
      const kept = [outer[0]];
      for (const point of outer.slice(1)) {
        const last = kept[kept.length - 1];
        if (Math.hypot(point[0] - last[0], point[1] - last[1]) >= tolerance) kept.push(point);
      }
      return kept.map(([lon, lat]) => [Math.round(lon * 1000) / 1000, Math.round(lat * 1000) / 1000]);
    })
    .filter((ring) => ring.length >= MIN_POINTS);
}

const out = [];
for (const country of load('110m')) {
  if (DETAILED[Number(country.id)] || !country.geometry) continue;
  out.push(...rings(country.geometry, 0.2));
}
const byScale = { '10m': load('10m'), '50m': load('50m') };
for (const [id, [scale, tolerance]] of Object.entries(DETAILED)) {
  const country = byScale[scale].find((f) => Number(f.id) === Number(id));
  if (!country) throw new Error(`Country ${id} missing in world-atlas ${scale}`);
  out.push(...rings(country.geometry, tolerance));
}

const file = path.join(__dirname, '..', 'src', 'data', 'map-outline.json');
fs.writeFileSync(file, JSON.stringify(out) + '\n');
console.log(`Wrote ${out.length} rings to ${path.relative(process.cwd(), file)} (${fs.statSync(file).size} bytes)`);
