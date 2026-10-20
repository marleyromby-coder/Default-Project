#!/usr/bin/env node
/**
 * Imports consented businesses from a spreadsheet into src/data/live-businesses.json.
 *
 *   1. Fill in templates/virksomheder-skabelon.csv (or a Google Sheet with the same columns)
 *   2. Export as CSV
 *   3. npm run import:businesses -- sti/til/virksomheder.csv
 *
 * Rows with errors are skipped and listed, so nothing half-finished is published.
 * Rows without a consent date are always rejected.
 */
const fs = require('node:fs');
const path = require('node:path');

const { parseCsv, rowToBusiness } = require('./lib/business-csv');

const ROOT = path.join(__dirname, '..');

/** Job definitions are read from the app's categories file so both stay in sync. */
function loadJobs() {
  const source = fs.readFileSync(path.join(ROOT, 'src/data/categories.ts'), 'utf8');
  const jobs = {};
  let current;
  for (const line of source.split('\n')) {
    const category = line.match(/^\s+id: '([a-z]+)',$/);
    if (category) current = category[1];
    const job = line.match(/\{ id: '([^']+)', name: '([^']+)', unit: '([a-z0-9]+)',.*keywords: \[([^\]]*)\]/);
    if (job && current) {
      const keywords = [...job[4].matchAll(/'([^']+)'/g)].map((m) => m[1]);
      (jobs[current] ??= []).push({ id: job[1], name: job[2], unit: job[3], keywords });
    }
  }
  return jobs;
}

function loadPhotoKeys() {
  const source = fs.readFileSync(path.join(ROOT, 'src/data/photos.ts'), 'utf8');
  return [...source.matchAll(/^\s+'([a-z0-9-]+)': \{ pexelsId/gm)].map((m) => m[1]);
}

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Brug: npm run import:businesses -- sti/til/virksomheder.csv');
    process.exit(1);
  }
  const rows = parseCsv(fs.readFileSync(path.resolve(input), 'utf8'));
  const context = {
    places: JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/places.json'), 'utf8')),
    jobsByCategory: loadJobs(),
    photoKeys: loadPhotoKeys(),
    today: new Date().toISOString().slice(0, 10),
  };

  const accepted = [];
  const ids = new Set();
  let failed = 0;
  rows.forEach((row, index) => {
    const line = index + 2; // header is line 1
    const { business, errors, warnings } = rowToBusiness(row, context);
    if (ids.has(business.id)) errors.push(`Navnet giver samme id som en anden række (${business.id})`);
    const label = `Række ${line} (${row.navn || 'uden navn'})`;
    warnings.forEach((w) => console.warn(`⚠️  ${label}: ${w}`));
    if (errors.length) {
      failed += 1;
      errors.forEach((e) => console.error(`❌ ${label}: ${e}`));
      return;
    }
    ids.add(business.id);
    accepted.push(business);
  });

  const outPath = path.join(ROOT, 'src/data/live-businesses.json');
  fs.writeFileSync(outPath, JSON.stringify(accepted, null, 2) + '\n');
  console.log(`\n✅ ${accepted.length} virksomheder skrevet til ${path.relative(process.cwd(), outPath)}`);
  if (failed) {
    console.log(`❌ ${failed} rækker blev sprunget over – ret fejlene ovenfor og kør igen.`);
    process.exit(1);
  }
}

main();
