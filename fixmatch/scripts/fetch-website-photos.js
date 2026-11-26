/**
 * Downloads the photos of the website's front page from Pexels into website/photos/, as listed
 * in website/photos.json. The photos are free to use (https://www.pexels.com/license/) and are
 * the same ones the demo data names in src/data/photos.ts. Run it once on a computer with
 * internet access and commit the pictures; the website builder uses them when they are there
 * and leaves the photo sections out when they are not.
 *
 *   npm run website:photos           (add --force to download again)
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'website', 'photos');
const WIDTH = 1200;
const force = process.argv.includes('--force');

async function main() {
  const photos = JSON.parse(fs.readFileSync(path.join(ROOT, 'website', 'photos.json'), 'utf8'));
  fs.mkdirSync(DIR, { recursive: true });
  let failed = 0;
  for (const { key, pexelsId } of photos) {
    const file = path.join(DIR, `${key}.jpg`);
    if (fs.existsSync(file) && !force) {
      console.log(`✓ ${key}.jpg findes allerede`);
      continue;
    }
    const url = `https://images.pexels.com/photos/${pexelsId}/pexels-photo-${pexelsId}.jpeg?auto=compress&cs=tinysrgb&w=${WIDTH}`;
    try {
      const response = await fetch(url);
      const type = response.headers.get('content-type') ?? '';
      if (!response.ok || !type.startsWith('image/')) throw new Error(`HTTP ${response.status} (${type})`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 20000) throw new Error(`kun ${bytes.length} bytes`);
      fs.writeFileSync(file, bytes);
      console.log(`✓ ${key}.jpg hentet (${Math.round(bytes.length / 1024)} KB)`);
    } catch (error) {
      failed += 1;
      console.error(`✗ ${key}.jpg kunne ikke hentes fra Pexels: ${error.message}`);
    }
  }
  if (failed) {
    console.error(`\n${failed} billede(r) mangler. Hjemmesiden bygges uden foto-sektionerne, indtil alle er hentet.`);
    process.exit(1);
  }
  console.log('\nAlle billeder er på plads. Byg hjemmesiden igen med: npm run website:build');
}

main();
