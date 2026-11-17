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

/** The env files Expo reads for a production build, the strongest first. */
const ENV_FILES = ['.env.production.local', '.env.local', '.env.production', '.env'];

/** A variable from the environment, or else from the project's env files like Expo reads them. */
function envValue(root, env, name) {
  if (env[name]) return env[name];
  for (const file of ENV_FILES) {
    let text;
    try {
      text = fs.readFileSync(path.join(root, file), 'utf8');
    } catch {
      continue;
    }
    const line = text.split(/\r?\n/).find((l) => l.trim().startsWith(`${name}=`));
    const value = line
      ?.slice(line.indexOf('=') + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');
    if (value) return value;
  }
  return undefined;
}

/** The App Store texts that are pasted into App Store Connect (the fenced blocks). */
const STORE_TEXTS = ['docs/app-store/app-store-tekster.md', 'docs/app-store/app-store-texts-en.md'];
/** "[Copenhagen, Denmark]", but not a markdown link "[text](url)". Same rule as the website. */
const PLACEHOLDER = /\[[^\]\n]+\](?!\()/;

/**
 * Placeholders left in the texts App Store Connect would show. Only the fenced blocks are
 * checked: the review sign-in (business id and code) is typed into App Store Connect and never
 * stored in git, so its placeholders outside the blocks are expected.
 */
function storeTextPlaceholders(root) {
  const found = [];
  for (const file of STORE_TEXTS) {
    let text;
    try {
      text = fs.readFileSync(path.join(root, file), 'utf8');
    } catch {
      continue;
    }
    const blocks = text.split('```').filter((_, index) => index % 2 === 1);
    for (const block of blocks) {
      const match = block.match(PLACEHOLDER);
      if (match) found.push(`${file}: ${match[0]}`);
    }
  }
  return found;
}

/** Returns the problems that block a live build, in Danish like the import script. */
function releaseProblems(root = ROOT, env = process.env) {
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
    // Review numbers only come from FixMatch's own reviews on the server, never from the data
    // file: no made-up demo reviews and no scores copied from other review sites.
    const scored = businesses.filter(
      (b) => b.demoReviews || b.reviewSummary || /"(score|rating|stars)"\s*:/i.test(JSON.stringify(b)),
    );
    if (scored.length > 0)
      problems.push(
        `${scored.length} virksomheder har anmeldelsestal i datafilen: ${scored.map((b) => b.name).join(', ')}. Anmeldelser må kun komme fra brugere via FixMatch.`,
      );
    // Trustpilot was dropped in November 2026; no field may carry its data (a plain link in
    // reviewLinks is fine, because that is a value, not a field).
    const trustpilot = businesses.filter((b) => /"trustpilot[^"]*"\s*:/i.test(JSON.stringify(b)));
    if (trustpilot.length > 0)
      problems.push(
        `${trustpilot.length} virksomheder har et trustpilot-felt: ${trustpilot.map((b) => b.name).join(', ')}. FixMatch viser ikke data fra Trustpilot. Fjern feltet, og kør npm run import:businesses igen.`,
      );
  }

  // Without them, accounts stay on the phone and reviews, prices and reports never reach FixMatch.
  const url = envValue(root, env, 'EXPO_PUBLIC_SUPABASE_URL');
  const key = envValue(root, env, 'EXPO_PUBLIC_SUPABASE_KEY');
  if (!url?.startsWith('https://') || !key)
    problems.push(
      'Supabase mangler: EXPO_PUBLIC_SUPABASE_URL (https://…) og EXPO_PUBLIC_SUPABASE_KEY (publishable key) skal stå i .env eller i buildets miljø. Se docs/lancering/supabase.md, trin 5.',
    );

  for (const placeholder of storeTextPlaceholders(root))
    problems.push(
      `Pladsholderen ${placeholder} står stadig i en tekst til App Store Connect. Udfyld den, før I indsender.`,
    );

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
