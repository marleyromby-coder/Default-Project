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
 *    Swift reports the warnings of the C headers it imports separately, so every Swift
 *    target (ours and the pods) also gets `-Xcc -w`.
 * 5. Hermes warns about React Native's own globals when it compiles the JavaScript for an
 *    archive; it runs with -w.
 * 6. Expo's template says it was last checked by Xcode 11.3, so Xcode keeps offering "Update
 *    to recommended settings" (and its iOS deployment target change would break the app). The
 *    project and its scheme are marked as checked by the Xcode CI builds with.
 * 7. In Release, pods' debug-only files compile to nothing, and libtool warns "'X.o' has no
 *    symbols" for each; the pods' libtool runs with -no_warning_for_no_symbols.
 */
const fs = require('node:fs');
const path = require('node:path');

const { withDangerousMod, withXcodeProject } = require('expo/config-plugins');

const MARK = '# Added by plugins/with-quiet-xcode.js';
const EXPO_CORE_WARNING = 'is internal, so the generated modules provider cannot reference it';
/** Silences the C and Objective-C headers that Swift imports. */
const SWIFT_HEADER_FLAGS = '-Xcc -w';
/** Xcode 27.1, written as Xcode stores it: the version the project is up to date with. */
const CHECKED_BY_XCODE = '2710';

/** Static libraries whose files are empty in Release (debug-only code). */
const LIBTOOL_FLAGS = '-no_warning_for_no_symbols';

/** "$(inherited) -D DEBUG" → "$(inherited) -D DEBUG -Xcc -w", keeping the pbxproj quotes. */
function withSwiftHeaderFlags(value) {
  const flags = String(value ?? '$(inherited)').replace(/^"|"$/g, '');
  return flags.includes(SWIFT_HEADER_FLAGS) ? value : `"${flags} ${SWIFT_HEADER_FLAGS}"`;
}

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
${indent}    target.build_configurations.each do |configuration|
${indent}      flags = configuration.build_settings['OTHER_SWIFT_FLAGS'] || '$(inherited)'
${indent}      configuration.build_settings['OTHER_SWIFT_FLAGS'] = "#{flags} ${SWIFT_HEADER_FLAGS}" unless flags.include?('${SWIFT_HEADER_FLAGS}')
${indent}      libtool = configuration.build_settings['OTHER_LIBTOOLFLAGS'] || '$(inherited)'
${indent}      configuration.build_settings['OTHER_LIBTOOLFLAGS'] = "#{libtool} ${LIBTOOL_FLAGS}" unless libtool.include?('${LIBTOOL_FLAGS}')
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

      for (const project of fs.readdirSync(ios).filter((name) => name.endsWith('.xcodeproj'))) {
        const schemes = path.join(ios, project, 'xcshareddata', 'xcschemes');
        for (const name of fs.existsSync(schemes) ? fs.readdirSync(schemes) : []) {
          const file = path.join(schemes, name);
          const scheme = fs.readFileSync(file, 'utf8');
          fs.writeFileSync(
            file,
            scheme.replace(/LastUpgradeVersion = "\d+"/, `LastUpgradeVersion = "${CHECKED_BY_XCODE}"`),
          );
        }
      }
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
    const project = config.modResults.getFirstProject().firstProject;
    project.attributes = { ...project.attributes, LastUpgradeCheck: Number(CHECKED_BY_XCODE) };
    for (const configuration of Object.values(config.modResults.pbxXCBuildConfigurationSection())) {
      if (typeof configuration !== 'object' || !configuration.buildSettings) continue;
      configuration.buildSettings.GCC_WARN_INHIBIT_ALL_WARNINGS = 'YES';
      configuration.buildSettings.SWIFT_SUPPRESS_WARNINGS = 'YES';
      configuration.buildSettings.OTHER_SWIFT_FLAGS = withSwiftHeaderFlags(
        configuration.buildSettings.OTHER_SWIFT_FLAGS,
      );
    }
    return config;
  });
};

module.exports = withQuietXcode;
module.exports.patchPodfile = patchPodfile;
module.exports.withSwiftHeaderFlags = withSwiftHeaderFlags;
