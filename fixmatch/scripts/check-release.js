#!/usr/bin/env node
/**
 * Stops an App Store build that Apple would reject or that breaks our own rules.
 *
 * Runs automatically on EAS before dependencies are installed (the
 * `eas-build-pre-install` hook in package.json), and by hand with
 * `npm run check:release`. Demo builds (TestFlight, simulator) are skipped.
 *
 * Uses only Node's standard library, because it runs before `npm install`.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

/** Returns the problems that block a live build, in Danish like the import script. */
function releaseProblems(root = ROOT) {
  const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
  const problems = [];

  let businesses = [];
  try {
    businesses = JSON.parse(read('src/data/live-businesses.json'));
  } catch {
    problems.push('src/data/live-businesses.json kan ikke læses.');
  }
  if (!Array.isArray(businesses) || businesses.length === 0) {
    problems.push(
      'Der er ingen rigtige virksomheder i src/data/live-businesses.json. Apple afviser en tom app (retningslinje 2.1). Kør npm run import:businesses.',
    );
  } else {
    const demo = businesses.filter((b) => b.demo);
    if (demo.length > 0)
      problems.push(`${demo.length} virksomheder er markeret som demo. Demodata må ikke i App Store.`);
    const noConsent = businesses.filter((b) => !b.consent?.date);
    if (noConsent.length > 0)
      problems.push(
        `${noConsent.length} virksomheder mangler en samtykkedato: ${noConsent.map((b) => b.name).join(', ')}.`,
      );
  }

  if (read('src/constants/app-info.ts').includes('TODO'))
    problems.push(
      'src/constants/app-info.ts har stadig TODO-felter. Udfyld navn, e-mail og hjemmeside, og slet TODO-kommentarerne.',
    );

  return problems;
}

function main() {
  if (process.env.EXPO_PUBLIC_FIXMATCH_DATA !== 'live') {
    console.log('check-release: demo-build, intet at tjekke.');
    return;
  }
  const problems = releaseProblems();
  if (problems.length === 0) {
    console.log('check-release: klar til App Store.');
    return;
  }
  console.error('check-release: buildet er stoppet, før det når App Store:\n');
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error('\nSe docs/lancering/global-lancering.md.');
  process.exit(1);
}

if (require.main === module) main();

module.exports = { releaseProblems };
