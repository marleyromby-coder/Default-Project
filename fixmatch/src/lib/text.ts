/**
 * Folds Danish letters and accents so "tømrer", "toemrer" and "TOMRER" match.
 */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Same as normalize, but also turns "oe/ae/aa" into single vowels for loose matching. */
export function loose(value: string): string {
  return normalize(value).replace(/oe/g, 'o').replace(/ae/g, 'a').replace(/aa/g, 'a');
}
