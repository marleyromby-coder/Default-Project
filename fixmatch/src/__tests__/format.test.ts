import {
  displayHost,
  formatDate,
  formatDistance,
  formatHourly,
  formatNumber,
  formatPhone,
  formatPriceRange,
  formatPrice,
  formatRating,
  formatRegistryNumber,
  phoneHref,
  setDistanceUnit,
  speakablePrice,
  pluralize,
} from '@/lib/format';
import { setLanguage } from '@/i18n';

describe('format', () => {
  it('uses Danish thousands separators and decimal commas', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatNumber(950)).toBe('950');
    expect(formatRating(4.66)).toBe('4,7');
    expect(formatRating(4)).toBe('4,0');
  });

  it('formats price ranges with units', () => {
    expect(formatPriceRange(1200, 2500, 'opgave', 'DKK')).toBe('1.200–2.500 kr.');
    expect(formatPriceRange(350, 650, 'm2', 'DKK')).toBe('350–650 kr. pr. m²');
    expect(formatPriceRange(900, 900, 'stk', 'DKK')).toBe('900 kr. pr. stk.');
    expect(formatHourly(495, 650, 'DKK')).toBe('495–650 kr./time');
    expect(speakablePrice('495–650 kr./time')).toBe('495 til 650 kroner i timen');
  });

  it('formats distances like iOS does', () => {
    expect(formatDistance(0.42)).toBe('400 m');
    expect(formatDistance(0.01)).toBe('50 m');
    expect(formatDistance(0.999)).toBe('1,0 km');
    expect(formatDistance(2.345)).toBe('2,3 km');
    expect(formatDistance(48.6)).toBe('49 km');
  });

  it('formats and links Danish phone numbers', () => {
    expect(formatPhone('+4512345678')).toBe('+45 12 34 56 78');
    expect(formatPhone('12 34 56 78')).toBe('+45 12 34 56 78');
    expect(formatPhone('not a number')).toBe('not a number');
    expect(phoneHref('+45 12 34 56 78')).toBe('tel:+4512345678');
    expect(phoneHref('12345678')).toBe('tel:+4512345678');
  });

  it('shortens hosts, CVR numbers and dates', () => {
    expect(displayHost('https://www.eksempel.dk/kontakt?x=1')).toBe('eksempel.dk');
    expect(formatRegistryNumber('12345678')).toBe('12 34 56 78');
    expect(formatRegistryNumber('05412345', 'GB')).toBe('05412345');
    expect(formatDate('2026-10-14')).toBe('14. okt. 2026');
    expect(formatDate('2026-05-01')).toBe('1. maj 2026');
    expect(pluralize(1, 'anmeldelse', 'anmeldelser')).toBe('1 anmeldelse');
    expect(pluralize(1200, 'anmeldelse', 'anmeldelser')).toBe('1.200 anmeldelser');
  });
});

describe('format in English and other currencies', () => {
  beforeAll(() => setLanguage('en'));
  afterAll(() => {
    setLanguage('da');
    setDistanceUnit('km');
  });

  it('uses English separators and currency symbols', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatRating(4.66)).toBe('4.7');
    expect(formatPrice(1200, 'GBP')).toBe('£1,200');
    expect(formatPriceRange(60, 90, 'opgave', 'EUR')).toBe('€60–90');
    expect(formatPriceRange(350, 650, 'm2', 'DKK')).toBe('DKK 350–650 per m²');
    expect(formatHourly(100, 175, 'USD')).toBe('$100–175/hr');
    expect(formatDate('2026-10-14')).toBe('14 Oct 2026');
  });

  it('shows miles in the UK and the US', () => {
    setDistanceUnit('mi');
    expect(formatDistance(1.609)).toBe('1.0 mi');
    expect(formatDistance(40)).toBe('25 mi');
  });

  it('formats phone numbers from other countries', () => {
    expect(formatPhone('+447700900123')).toBe('+44 7700 900123');
    expect(formatPhone('+12125550142')).toBe('+1 (212) 555-0142');
    expect(phoneHref('+44 7700 900123')).toBe('tel:+447700900123');
  });
});
