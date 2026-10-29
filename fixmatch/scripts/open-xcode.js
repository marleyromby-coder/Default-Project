#!/usr/bin/env node
/**
 * Makes the Xcode project (ios/) from app.json, installs the CocoaPods and opens the workspace.
 *
 * Usage: npm run ios:xcode (on a Mac)
 *
 * Every step stops with an explanation in Danish if it fails. Without the pods, Xcode shows
 * "No such module 'ExpoWidgets'" in the widget target, so a failed `pod install` must never
 * be followed by opening the project.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const IOS = path.join(ROOT, 'ios');
/** iPhone Duo's full inner display and the iOS 27 extra-large widget need the iOS 27.1 SDK. */
const RECOMMENDED_XCODE = [27, 1];

function stop(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function output(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

function run(command, args, options = {}) {
  console.log(`\n› ${command} ${args.join(' ')}`);
  return spawnSync(command, args, { stdio: 'inherit', ...options }).status === 0;
}

if (process.platform !== 'darwin') {
  stop(
    'Xcode findes kun på Mac. Kør npm run ios:xcode på din Mac, eller byg i skyen med EAS (docs/lancering/testflight.md).',
  );
}

const xcode = output('xcodebuild', ['-version']);
if (!xcode) {
  stop(
    'Xcode er ikke installeret eller ikke valgt. Installer Xcode fra App Store, åbn det én gang, og kør:\n  sudo xcode-select -s /Applications/Xcode.app',
  );
}
const [major = 0, minor = 0] = (xcode.match(/Xcode (\d+)(?:\.(\d+))?/) ?? []).slice(1).map(Number);
console.log(`✓ ${xcode.split('\n')[0]}`);
if (major < RECOMMENDED_XCODE[0] || (major === RECOMMENDED_XCODE[0] && minor < RECOMMENDED_XCODE[1])) {
  console.warn(
    `! Xcode ${RECOMMENDED_XCODE.join('.')} anbefales: med ældre Xcode får appen sorte kanter på den åbne iPhone Duo, og den ekstra store widget mangler.`,
  );
}

const pod = output('pod', ['--version']);
if (!pod) stop('CocoaPods mangler. Installer det med:\n  brew install cocoapods\nog kør npm run ios:xcode igen.');
console.log(`✓ CocoaPods ${pod}`);

if (!run('npx', ['expo', 'prebuild', '--platform', 'ios', '--clean', '--no-install'], { cwd: ROOT })) {
  stop('expo prebuild fejlede. Se fejlen ovenfor.');
}

// The build phases that bundle the JavaScript run node from Xcode, which does not see the
// PATH of your terminal (nvm, Homebrew).
fs.writeFileSync(path.join(IOS, '.xcode.env.local'), `export NODE_BINARY="${process.execPath}"\n`);

const podEnv = { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' };
const installed =
  run('pod', ['install'], { cwd: IOS, env: podEnv }) ||
  run('pod', ['install', '--repo-update'], { cwd: IOS, env: podEnv });
if (!installed) {
  stop(
    'pod install fejlede, så Xcode-projektet ville ikke kunne bygge. Kopiér fejlen ovenfor (den røde tekst) til Claude.',
  );
}

const workspace = fs.readdirSync(IOS).find((name) => name.endsWith('.xcworkspace'));
if (!workspace) stop('pod install lavede ingen .xcworkspace. Kopiér outputtet ovenfor til Claude.');

console.log(
  `\n✓ Klar. Åbner ios/${workspace}.\n  Åbn altid ${workspace} (hvidt ikon) – aldrig ${workspace.replace('.xcworkspace', '.xcodeproj')} (blåt ikon).`,
);
run('open', [path.join(IOS, workspace)]);
