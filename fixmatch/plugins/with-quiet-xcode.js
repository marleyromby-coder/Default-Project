/**
 * Keeps Xcode's Issue navigator empty, so a real problem is never hidden among hundreds of
 * warnings from code that isn't ours. Errors are always shown. All native code in ios/ is
 * generated (React Native, Expo and CocoaPods), and FixMatch's own code is checked by
 * `npm run check`, so these warnings are about other people's code:
 *
 * 1. Third-party pods: `inhibit_all_warnings!` in the Podfile.
 * 2. Pod scripts without outputs (e.g. "[CP-User] react-native-maps patches") run on every
 *    build anyway; marking them so stops Xcode's "will be run during every build" warning.
 * 3. expo-modules-autolinking warns that expo-modules-core's own CoreModule is internal on
 *    every build. That line is filtered out of its configure script.
 * 4. The app and widget targets compile only generated code that imports React's and
 *    Expo's prebuilt headers, which trigger nullability and module warnings in Xcode 27.
 * 5. Hermes warns about React Native's own globals when it compiles the JavaScript for an
 *    archive; it runs with -w.
 */
const fs = require('node:fs');
const path = require('node:path');

const { withDangerousMod, withXcodeProject } = require('expo/config-plugins');

const MARK = '# Added by plugins/with-quiet-xcode.js';
const EXPO_CORE_WARNING = 'is internal, so the generated modules provider cannot reference it';

function patchPodfile(podfile) {
  if (podfile.includes(MARK)) return podfile;
  const platform = /^platform :ios.*$/m;
  const postInstall = /^([ \t]*)post_install do \|installer\|$/m;
  if (!platform.test(podfile) || !postInstall.test(podfile)) {
    throw new Error('with-quiet-xcode: the Podfile has no "platform :ios" line or post_install block');
  }
  return `${podfile
    .replace(platform, (line) => `${line}\n${MARK}\ninhibit_all_warnings!`)
    .replace(
      postInstall,
      (line, indent) => `${line}
${indent}  ${MARK}
${indent}  installer.pods_project.targets.each do |target|
${indent}    target.shell_script_build_phases.each do |phase|
${indent}      phase.always_out_of_date = '1' if Array(phase.output_paths).empty? && Array(phase.output_file_list_paths).empty?
${indent}    end
${indent}  end`,
    )}
${MARK}
post_integrate do |installer|
  Dir.glob(File.join(installer.sandbox.root, 'Target Support Files', '*', 'expo-configure-project.sh')).each do |file|
    script = File.read(file)
    next if script.include?('${EXPO_CORE_WARNING}')
    File.write(file, script.sub(/(--packages[^\\n]*)$/) { "#{$1} 2> >(grep -v '${EXPO_CORE_WARNING}' >&2)" })
  end
end
`;
}

const HERMESC = `#!/bin/sh
${MARK}
# The hermes-engine pod's compiler, without warnings about React Native's own globals.
exec "$PODS_ROOT/hermes-engine/destroot/bin/hermesc" -w "$@"
`;

const withQuietXcode = (config) => {
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const ios = config.modRequest.platformProjectRoot;
      const podfile = path.join(ios, 'Podfile');
      fs.writeFileSync(podfile, patchPodfile(fs.readFileSync(podfile, 'utf8')));

      fs.writeFileSync(path.join(ios, 'hermesc-quiet.sh'), HERMESC, { mode: 0o755 });
      const env = path.join(ios, '.xcode.env');
      const current = fs.existsSync(env) ? fs.readFileSync(env, 'utf8') : '';
      if (!current.includes(MARK)) {
        fs.writeFileSync(
          env,
          `${current.trimEnd()}\n\n${MARK}\nexport HERMES_CLI_PATH="$PODS_ROOT/../hermesc-quiet.sh"\n`,
        );
      }
      return config;
    },
  ]);

  return withXcodeProject(config, (config) => {
    for (const configuration of Object.values(config.modResults.pbxXCBuildConfigurationSection())) {
      if (typeof configuration !== 'object' || !configuration.buildSettings) continue;
      configuration.buildSettings.GCC_WARN_INHIBIT_ALL_WARNINGS = 'YES';
      configuration.buildSettings.SWIFT_SUPPRESS_WARNINGS = 'YES';
    }
    return config;
  });
};

module.exports = withQuietXcode;
module.exports.patchPodfile = patchPodfile;
