#!/usr/bin/env node
/**
 * Imports consented businesses from a spreadsheet into src/data/live-businesses.json.
 *
 *   1. Fill in templates/virksomheder-skabelon.csv (or a Google Sheet with the same columns)
 *   2. Export as CSV
 *   3. npm run import:businesses -- sti/til/virksomheder.csv
 *
 * Rows with errors are listed, and then nothing is saved, so a broken sheet can never
 * wipe businesses that are already imported. Add --spring-fejl-over to save only the
 * valid rows. Rows without a consent date are always rejected.
 */
const fs = require('node:fs');
const path = require('node:path');

const { parseCsv, rowToBusiness } = require('./lib/business-csv');

const ROOT = path.join(__dirname, '..');

const STRING = `(?:'([^']*)'|"([^"]*)")`;

/**
 * Job definitions are read from the app's categories file so both stay in sync. Jobs are
 * written as job(id, danish, english, unit, min, max, [keywords]) under their category's id.
 */
function loadJobs(source = fs.readFileSync(path.join(ROOT, 'src/data/categories.ts'), 'utf8')) {
  const categories = [...source.matchAll(/^ {4}id: '([a-z]+)',$/gm)].map((m) => ({ id: m[1], at: m.index }));
  const jobPattern = new RegExp(
    `job\\(\\s*${STRING},\\s*${STRING},\\s*${STRING},\\s*'([a-z0-9]+)',\\s*[\\d.]+,\\s*[\\d.]+,\\s*\\[([^\\]]*)\\]`,
    'g',
  );
  const jobs = {};
  for (const m of source.matchAll(jobPattern)) {
    const category = categories.filter((c) => c.at < m.index).pop();
    if (!category) continue;
    const [id, da, en] = [m[1] ?? m[2], m[3] ?? m[4], m[5] ?? m[6]];
    const keywords = [...m[8].matchAll(new RegExp(STRING, 'g'))].map((k) => k[1] ?? k[2]);
    (jobs[category.id] ??= []).push({ id, name: da, unit: m[7], keywords: [en, ...keywords] });
  }
  return jobs;
}

function loadPhotoKeys() {
  const source = fs.readFileSync(path.join(ROOT, 'src/data/photos.ts'), 'utf8');
  return [...source.matchAll(/^\s+'([a-z0-9-]+)': \{ pexelsId/gm)].map((m) => m[1]);
}

function main() {
  const args = process.argv.slice(2);
  const skipErrors = args.includes('--spring-fejl-over');
  const input = args.find((a) => !a.startsWith('--'));
  if (!input) {
    console.error('Brug: npm run import:businesses -- sti/til/virksomheder.csv [--spring-fejl-over]');
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
  if (failed && !skipErrors) {
    console.log(`\n❌ ${failed} rækker har fejl, så intet er gemt. Ret fejlene og kør igen.`);
    console.log('   Vil du kun gemme de gyldige rækker, så tilføj --spring-fejl-over.');
    process.exit(1);
  }
  if (accepted.length === 0) {
    console.log('\n❌ Ingen gyldige rækker, så intet er gemt.');
    process.exit(1);
  }
  fs.writeFileSync(outPath, JSON.stringify(accepted, null, 2) + '\n');
  console.log(`\n✅ ${accepted.length} virksomheder skrevet til ${path.relative(process.cwd(), outPath)}`);
  if (failed) {
    console.log(`⚠️  ${failed} rækker blev sprunget over.`);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { loadJobs };
