/**
 * Builds src/data/world-cities.json for the location picker outside Denmark
 * (Denmark uses the postal towns in places.json). Source: GeoNames via the
 * all-the-cities package. GeoNames data is CC BY 4.0, so the app credits it.
 *
 *   node scripts/build-world-cities.js
 *
 * Rows are [name, country, lat, lon, population] to keep the file small.
 */
const fs = require('node:fs');
const path = require('node:path');
const cities = require('all-the-cities');

/** Markets where FixMatch lists businesses get smaller towns too. */
const MIN_POPULATION = { SE: 15000, NO: 15000, DE: 40000, GB: 40000, US: 75000 };
const WORLD_MIN_POPULATION = 200000;

const rows = cities
  .filter((c) => c.country !== 'DK')
  .filter((c) => c.featureCode === 'PPLC' || c.population >= (MIN_POPULATION[c.country] ?? WORLD_MIN_POPULATION))
  .sort((a, b) => b.population - a.population)
  .map((c) => [
    c.name,
    c.country,
    Math.round(c.loc.coordinates[1] * 10000) / 10000,
    Math.round(c.loc.coordinates[0] * 10000) / 10000,
    c.population,
  ]);

const out = path.join(__dirname, '..', 'src', 'data', 'world-cities.json');
fs.writeFileSync(out, JSON.stringify(rows) + '\n');
console.log(`Wrote ${rows.length} cities to ${path.relative(process.cwd(), out)}`);
