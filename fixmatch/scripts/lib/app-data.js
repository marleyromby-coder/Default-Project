/**
 * Data the website shares with the app, read from the app's TypeScript sources as text so the
 * website builder needs no build step and the two never drift apart.
 */
const fs = require('node:fs');
const path = require('node:path');

/** A single- or double-quoted string literal. */
const STRING = String.raw`(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")`;
const unquote = (match, index) => (match[index] ?? match[index + 1] ?? '').replace(/\\(.)/g, '$1');

/**
 * The trades and their jobs, with Danish and English names, from src/data/categories.ts:
 * `{ vvs: { name: { da, en }, jobs: { 'stoppet-afloeb': { da, en }, … } }, … }`.
 */
function readJobs(root) {
  const source = fs.readFileSync(path.join(root, 'src/data/categories.ts'), 'utf8');
  const start = source.indexOf('export const CATEGORY_DATA');
  if (start < 0) throw new Error('src/data/categories.ts: CATEGORY_DATA findes ikke');
  const end = source.indexOf('\n];', start);
  const trades = {};
  for (const chunk of source
    .slice(start, end)
    .split(/\n {4}id: /)
    .slice(1)) {
    const id = chunk.match(new RegExp(`^${STRING}`));
    const name = chunk.match(new RegExp(`name: \\{ da: ${STRING}, en: ${STRING} \\}`));
    if (!id || !name) throw new Error('src/data/categories.ts: kunne ikke læse et fag');
    const jobs = {};
    for (const job of chunk.matchAll(new RegExp(`job\\(\\s*${STRING},\\s*${STRING},\\s*${STRING}`, 'g'))) {
      jobs[unquote(job, 1)] = { da: unquote(job, 3), en: unquote(job, 5) };
    }
    trades[unquote(id, 1)] = { name: { da: unquote(name, 1), en: unquote(name, 3) }, jobs };
  }
  return trades;
}

/** A numeric constant exported from an app source file, e.g. MIN_GROUP from src/state/groups.ts. */
function readNumber(root, file, name) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const value = source.match(new RegExp(`export const ${name} = (\\d+);`))?.[1];
  if (value === undefined) throw new Error(`${file}: ${name} findes ikke`);
  return Number(value);
}

/** The group discount range, `{ min, max }`, from src/state/groups.ts. */
function readGroupDiscount(root) {
  const source = fs.readFileSync(path.join(root, 'src/state/groups.ts'), 'utf8');
  const match = source.match(/export const GROUP_DISCOUNT = \{ min: (\d+), max: (\d+) \};/);
  if (!match) throw new Error('src/state/groups.ts: GROUP_DISCOUNT findes ikke');
  return { min: Number(match[1]), max: Number(match[2]) };
}

module.exports = { readGroupDiscount, readJobs, readNumber };
