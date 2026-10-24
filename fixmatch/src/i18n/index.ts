import { getLocales } from 'expo-localization';

import en from './en';

/**
 * Translations. The Danish text is the key, so screens read naturally and a
 * missing English translation falls back to Danish. Keys must be literal
 * strings: src/__tests__/i18n.test.ts checks that every t('…') has an English
 * translation.
 *
 * The language follows the phone. On iOS each app has its own language under
 * Settings → FixMatch → Language, and iOS restarts the app when it changes, so
 * the language is fixed for a whole run. The web demo also accepts ?lang=en.
 */

export type Language = 'da' | 'en';

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'da', label: 'Dansk' },
  { value: 'en', label: 'English' },
];

function fromUrl(): Language | undefined {
  if (typeof window === 'undefined' || !window.location?.search) return undefined;
  const value = new URLSearchParams(window.location.search).get('lang');
  return value === 'da' || value === 'en' ? value : undefined;
}

export function detectLanguage(): Language {
  const url = fromUrl();
  if (url) return url;
  try {
    for (const locale of getLocales()) {
      if (locale.languageCode === 'da') return 'da';
      if (locale.languageCode === 'en') return 'en';
    }
  } catch {
    // Fall through to English, the language for everyone who does not read Danish.
  }
  return 'en';
}

let current: Language = detectLanguage();

export function getLanguage(): Language {
  return current;
}

/** For tests and the web demo's language switch. */
export function setLanguage(language: Language): void {
  current = language;
}

const DICTIONARIES: Record<Language, Record<string, string>> = { da: {}, en };

/** Translates a Danish source text and fills in {placeholders}. */
export function t(source: string, params?: Record<string, string | number | undefined>): string {
  const text = current === 'da' ? source : (DICTIONARIES[current][source] ?? source);
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name] ?? '') : match));
}

/**
 * Marks a Danish text that is translated later with t(variable), e.g. in a
 * lookup table. The i18n test checks these too.
 */
export function msg(source: string): string {
  return source;
}

/** Picks the text for the current language from a { da, en } pair. */
export function pick<T>(texts: { da: T; en: T }): T {
  return texts[current];
}
