// Tests run in Danish on a Danish phone unless a test says otherwise.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'da', regionCode: 'DK', languageTag: 'da-DK' }],
  getCalendars: () => [{ calendar: 'gregory', timeZone: 'Europe/Copenhagen' }],
}));

// The tests cover the full model, Trustpilot included (it is off unless a build says "on");
// trustpilot-off.test.ts checks the texts without it.
process.env.EXPO_PUBLIC_FIXMATCH_TRUSTPILOT = 'on';
