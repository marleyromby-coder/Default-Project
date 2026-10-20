import {
  displayHost,
  formatCvr,
  formatDate,
  formatDistance,
  formatHourly,
  formatNumber,
  formatPhone,
  formatPriceRange,
  formatRating,
  phoneHref,
  pluralize,
} from '@/lib/format';

describe('format', () => {
  it('uses Danish thousands separators and decimal commas', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatNumber(950)).toBe('950');
    expect(formatRating(4.66)).toBe('4,7');
    expect(formatRating(4)).toBe('4,0');
  });

  it('formats price ranges with units', () => {
    expect(formatPriceRange(1200, 2500)).toBe('1.200–2.500 kr.');
    expect(formatPriceRange(350, 650, 'm2')).toBe('350–650 kr. pr. m²');
    expect(formatPriceRange(900, 900, 'stk')).toBe('900 kr. pr. stk.');
    expect(formatHourly(495, 650)).toBe('495–650 kr./time');
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
    expect(formatCvr('12345678')).toBe('12 34 56 78');
    expect(formatDate('2026-10-14')).toBe('14. okt. 2026');
    expect(formatDate('2026-05-01')).toBe('1. maj 2026');
    expect(pluralize(1, 'anmeldelse', 'anmeldelser')).toBe('1 anmeldelse');
    expect(pluralize(1200, 'anmeldelse', 'anmeldelser')).toBe('1.200 anmeldelser');
  });
});
