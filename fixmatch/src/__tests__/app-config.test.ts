/// <reference types="node" />
import appJson from '../../app.json';

// app.config.js is plain Node.js (CommonJS), read by the Expo CLI and EAS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const appConfig = require('../../app.config.js');

function versionWith(data: string | undefined): string {
  const before = process.env.EXPO_PUBLIC_FIXMATCH_DATA;
  if (data === undefined) delete process.env.EXPO_PUBLIC_FIXMATCH_DATA;
  else process.env.EXPO_PUBLIC_FIXMATCH_DATA = data;
  try {
    return appConfig({ config: appJson.expo }).version;
  } finally {
    if (before === undefined) delete process.env.EXPO_PUBLIC_FIXMATCH_DATA;
    else process.env.EXPO_PUBLIC_FIXMATCH_DATA = before;
  }
}

describe('app version', () => {
  it('keeps the App Store version only for live data', () => {
    expect(versionWith('live')).toBe(appJson.expo.version);
  });

  it('gives demo builds a lower version, so they can never be sent for the App Store version', () => {
    for (const data of [undefined, 'demo', 'anything']) {
      expect(versionWith(data)).toBe('0.9.0');
      expect(versionWith(data)).not.toBe(appJson.expo.version);
    }
  });
});
