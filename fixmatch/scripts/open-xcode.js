#!/usr/bin/env node
/**
 * Makes the Xcode project (ios/) from app.json, installs the CocoaPods and opens the workspace.
 *
 * Usage: npm run ios:xcode (on a Mac)
 *
 * Every step stops with an explanation in Danish if it fails. Without the pods, Xcode shows
 * "No such module 'ExpoWidgets'" in the widget target, so a failed `pod install` must never
 * be followed by opening the project. The same error comes from building FixMatch.xcodeproj
 * instead of the workspace, often in a window Xcode restores by itself, so Xcode is started
 * fresh with only the workspace.
 *
 * The signing team chosen in Xcode is kept: `prebuild --clean` makes ios/ again without it,
 * so it is read from the old project first and written into the new one (and remembered in
 * .xcode-team, which is not in git).
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const IOS = path.join(ROOT, 'ios');
const PBXPROJ = path.join(IOS, 'FixMatch.xcodeproj', 'project.pbxproj');
const TEAM_FILE = path.join(ROOT, '.xcode-team');

/** The Apple team ID (10 letters and digits) a project is signed with, if any. */
function readTeam(pbxproj) {
  return pbxproj.match(/\bDEVELOPMENT_TEAM = "?([A-Z0-9]{10})"?;/)?.[1];
}

/**
 * Signs every target (the app and the widget extension) with the team: the configurations
 * that have a bundle identifier are the targets', not the project's.
 */
function applyTeam(pbxproj, team) {
  return pbxproj
    .replace(/^\s*DEVELOPMENT_TEAM = [^;]*;\n/gm, '')
    .replace(/^(\s*)(PRODUCT_BUNDLE_IDENTIFIER = [^;]+;)$/gm, `$1$2\n$1DEVELOPMENT_TEAM = ${team};`);
}

/**
 * ▶︎ in Xcode builds Release without the debugger, so the app on the iPhone has its JavaScript
 * inside and opens by itself, also away from the Mac. A Debug build waits for the JavaScript
 * from `npx expo start` on the Mac and stays on the logo without it, and the debugger can hold
 * the first launch on a new iPhone for minutes. Profile and Archive stay Release; developers
 * who want Fast Refresh choose Debug under Product → Scheme → Edit Scheme.
 */
function configureScheme(scheme) {
  return scheme.replace(/<LaunchAction\b[^>]*>/, (tag) =>
    tag
      .replace(/buildConfiguration = "[^"]*"/, 'buildConfiguration = "Release"')
      .replace(/selectedDebuggerIdentifier = "[^"]*"/, 'selectedDebuggerIdentifier = ""')
      .replace(
        /selectedLauncherIdentifier = "[^"]*"/,
        'selectedLauncherIdentifier = "Xcode.IDEFoundation.Launcher.PosixSpawn"',
      ),
  );
}

/** Xcode's caches next to the projects' build folders that outlive a project: modules and compiled results. */
const SHARED_CACHES = ['ModuleCache.noindex', 'CompilationCache.noindex'];
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

function main() {
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
  if (!pod) {
    // Without CocoaPods there are no pods, and Xcode fails with "No such module 'ExpoWidgets'".
    stop(
      output('brew', ['--version'])
        ? 'CocoaPods mangler. Installer det med:\n  brew install cocoapods\nog kør npm run ios:xcode igen.'
        : 'CocoaPods mangler, og det gør Homebrew, der installerer det, også. Kør disse kommandoer én ad gangen\n' +
            '(den første beder om din Mac-adgangskode og tager et par minutter):\n\n' +
            '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"\n' +
            '  echo \'eval "$(/opt/homebrew/bin/brew shellenv)"\' >> ~/.zprofile\n' +
            '  eval "$(/opt/homebrew/bin/brew shellenv)"\n' +
            '  brew install cocoapods\n\n' +
            'Står der noget andet under "Next steps", når Homebrew er installeret, så brug de linjer i stedet for\n' +
            'de to med brew shellenv. Kør så npm run ios:xcode igen.',
    );
  }
  console.log(`✓ CocoaPods ${pod}`);

  // ios/ is deleted and made again below. An open Xcode keeps showing the old, deleted project
  // with missing files and errors everywhere, so Xcode is closed first (it asks about anything
  // unsaved).
  if (output('pgrep', ['-x', 'Xcode']) !== null) {
    console.log('› Lukker Xcode …');
    spawnSync('osascript', ['-e', 'tell application "Xcode" to quit']);
    for (let i = 0; i < 30 && output('pgrep', ['-x', 'Xcode']) !== null; i += 1) spawnSync('sleep', ['1']);
    if (output('pgrep', ['-x', 'Xcode']) !== null) {
      stop('Xcode er stadig åbent. Luk Xcode helt (⌘Q), og kør npm run ios:xcode igen.');
    }
  }

  // The team chosen under Signing & Capabilities last time.
  const team =
    (fs.existsSync(PBXPROJ) ? readTeam(fs.readFileSync(PBXPROJ, 'utf8')) : undefined) ??
    (fs.existsSync(TEAM_FILE) ? fs.readFileSync(TEAM_FILE, 'utf8').trim() : undefined);

  // After a git pull the packages may be out of date, and the native code must match them.
  const installedLock = path.join(ROOT, 'node_modules', '.package-lock.json');
  if (
    !fs.existsSync(installedLock) ||
    fs.statSync(installedLock).mtimeMs < fs.statSync(path.join(ROOT, 'package-lock.json')).mtimeMs
  ) {
    if (!run('npm', ['install', '--no-audit', '--no-fund'], { cwd: ROOT }))
      stop('npm install fejlede. Se fejlen ovenfor.');
  }

  // prebuild rewrites the "ios" and "android" scripts in package.json; keep the project's own,
  // so the file is unchanged and the next git pull is not blocked by a local change.
  const packageJson = path.join(ROOT, 'package.json');
  const packageText = fs.readFileSync(packageJson, 'utf8');
  const prebuilt = run('npx', ['expo', 'prebuild', '--platform', 'ios', '--clean', '--no-install'], { cwd: ROOT });
  if (fs.readFileSync(packageJson, 'utf8') !== packageText) fs.writeFileSync(packageJson, packageText);
  if (!prebuilt) stop('expo prebuild fejlede. Se fejlen ovenfor.');

  const schemes = path.join(IOS, 'FixMatch.xcodeproj', 'xcshareddata', 'xcschemes');
  for (const name of fs.existsSync(schemes) ? fs.readdirSync(schemes) : []) {
    if (name !== 'FixMatch.xcscheme') continue;
    const file = path.join(schemes, name);
    fs.writeFileSync(file, configureScheme(fs.readFileSync(file, 'utf8')));
    console.log('✓ ▶︎ bygger en Release-app, der åbner af sig selv på iPhonen');
  }

  if (team && /^[A-Z0-9]{10}$/.test(team)) {
    fs.writeFileSync(PBXPROJ, applyTeam(fs.readFileSync(PBXPROJ, 'utf8'), team));
    fs.writeFileSync(TEAM_FILE, `${team}\n`);
    console.log(`✓ Signering med samme team som sidst (${team})`);
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
  // The widget extension's own pods: without them, "No such module 'ExpoWidgets'".
  if (!fs.existsSync(path.join(IOS, 'Pods', 'Target Support Files', 'Pods-ExpoWidgetsTarget'))) {
    stop('pod install lavede ikke widgettens pods (Pods-ExpoWidgetsTarget). Kopiér outputtet ovenfor til Claude.');
  }

  // Xcode's build cache for the old project, and its shared module cache that still points into
  // it, keep reporting errors that are already fixed, such as "Unable to resolve module
  // dependency" and "module map file … not found". Both are rebuilt by the next build.
  const derivedData = path.join(os.homedir(), 'Library/Developer/Xcode/DerivedData');
  const projectName = workspace.replace('.xcworkspace', '');
  for (const name of fs.existsSync(derivedData) ? fs.readdirSync(derivedData) : []) {
    if (name.startsWith(`${projectName}-`) || SHARED_CACHES.includes(name)) {
      fs.rmSync(path.join(derivedData, name), { recursive: true, force: true });
      console.log(`✓ Gammel build-cache slettet (${name})`);
    }
  }

  // Xcode reopens the windows it had last time, which may be FixMatch.xcodeproj; that window
  // cannot build the widget. -F starts Xcode fresh with only the workspace.
  const xcodeApp = output('xcode-select', ['-p'])?.replace(/\/Contents\/Developer\/?$/, '');
  console.log(
    `\n✓ Klar. Åbner ios/${workspace}.\n` +
      `  Byg kun i vinduet ${workspace} (hvidt ikon) – aldrig ${projectName}.xcodeproj (blåt ikon).\n` +
      (team
        ? '  Vælg din iPhone øverst, og tryk ▶︎.'
        : '  Første gang: vælg dit team under Signing & Capabilities for FixMatch og ExpoWidgetsTarget. Næste gang huskes det.'),
  );
  run('open', xcodeApp ? ['-F', '-a', xcodeApp, path.join(IOS, workspace)] : [path.join(IOS, workspace)]);
}

if (require.main === module) main();

module.exports = { readTeam, applyTeam, configureScheme };
