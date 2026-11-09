import { APP_INFO } from '@/constants/app-info';
import { getLanguage } from '@/i18n';

/**
 * Naborabat links. The invite a neighbour sends links to the group's page on the website
 * (scripts/lib/group-page.js), which shows the group to anyone and opens the app with
 * fixmatch://faelles?kode=ABC123, where the code is filled in.
 */
export function groupLink(code: string, language = getLanguage()): string {
  return language === 'da'
    ? `${APP_INFO.website}/naborabat/?kode=${encodeURIComponent(code)}`
    : `${APP_INFO.website}/en/neighbours/?code=${encodeURIComponent(code)}`;
}

/** The code from a link: capitals and digits only, at most 6, as the code field takes it. */
export function codeFromLink(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}
