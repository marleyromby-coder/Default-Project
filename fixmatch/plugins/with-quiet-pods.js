/**
 * Hides the compiler warnings of third-party pods (React Native, Expo modules, maps …) in
 * Xcode, so the Issue navigator only shows FixMatch's own code. The pods are not ours to
 * change, and hundreds of their warnings would hide a real problem. Errors are still shown.
 */
const fs = require('node:fs');
const path = require('node:path');

const { withDangerousMod } = require('expo/config-plugins');

const LINE = 'inhibit_all_warnings!';

const withQuietPods = (config) =>
  withDangerousMod(config, [
    'ios',
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      const podfile = fs.readFileSync(file, 'utf8');
      if (!podfile.includes(LINE)) {
        const platform = /^platform :ios.*$/m;
        if (!platform.test(podfile)) throw new Error('with-quiet-pods: no "platform :ios" line in the Podfile');
        fs.writeFileSync(file, podfile.replace(platform, (line) => `${line}\n# Added by plugins/with-quiet-pods.js\n${LINE}`));
      }
      return config;
    },
  ]);

module.exports = withQuietPods;
