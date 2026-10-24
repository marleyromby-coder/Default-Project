// Tests run in Danish on a Danish phone unless a test says otherwise.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'da', regionCode: 'DK', languageTag: 'da-DK' }],
  getCalendars: () => [{ calendar: 'gregory', timeZone: 'Europe/Copenhagen' }],
}));
