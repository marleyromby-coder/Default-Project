/**
 * Turns off Xcode's explicitly built modules (Xcode 26 and later) for the app and the widget
 * extension.
 *
 * With explicit modules, Xcode scans every module before building and stops with
 * "Unable to resolve module dependency" and "Clang dependency scanning failure: module map
 * file … not found" as soon as a cached module map points at a build folder that is gone –
 * after a `prebuild --clean`, a deleted DerivedData or a project opened without its pods.
 * Implicit modules build the same code and simply rebuild what is missing. CocoaPods still
 * recommends them.
 */
const { withXcodeProject } = require('expo/config-plugins');

const withImplicitModules = (config) =>
  withXcodeProject(config, (config) => {
    const configurations = config.modResults.pbxXCBuildConfigurationSection();
    for (const configuration of Object.values(configurations)) {
      if (typeof configuration !== 'object' || !configuration.buildSettings) continue;
      configuration.buildSettings.SWIFT_ENABLE_EXPLICIT_MODULES = 'NO';
      configuration.buildSettings.CLANG_ENABLE_EXPLICIT_MODULES = 'NO';
    }
    return config;
  });

module.exports = withImplicitModules;
