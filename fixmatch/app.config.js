/**
 * The app's config is app.json. This file only changes the version of demo builds.
 *
 * Builds with demo data (TestFlight demos, simulator, `npm run ios:xcode` without live data) get
 * version 0.9.0, so App Store Connect can never attach one of them to the App Store version
 * (1.0.0 in app.json). Only builds with EXPO_PUBLIC_FIXMATCH_DATA=live, such as
 * `eas build --profile production`, keep app.json's version. See docs/lancering/testflight.md.
 */
const DEMO_VERSION = '0.9.0';

module.exports = ({ config }) => ({
  ...config,
  version: process.env.EXPO_PUBLIC_FIXMATCH_DATA === 'live' ? config.version : DEMO_VERSION,
});
