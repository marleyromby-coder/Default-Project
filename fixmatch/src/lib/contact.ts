import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform, Share } from 'react-native';

import { APP_INFO } from '@/constants/app-info';
import { t } from '@/i18n';

import { showDialog } from './dialog';
import { formatPhone, phoneHref } from './format';
import { getMarket } from './markets';
import type { Business } from './types';
import { countryOf } from './business-text';

export const CVR_LOOKUP_URL = (cvr: string) => `https://datacvr.virk.dk/enhed/virksomhed/${cvr.replace(/\D/g, '')}`;

/** Public company register lookup for the business's country, if there is one. */
export function registryUrl(business: Business): string | undefined {
  const country = countryOf(business);
  if (country === 'DK') return CVR_LOOKUP_URL(business.cvr);
  return business.cvr ? getMarket(country).registryUrl?.(business.cvr) : undefined;
}

/** Sikkerhedsstyrelsen's public register of authorised el, VVS and kloak businesses. */
export const AUTHORIZATION_REGISTER_URL = 'https://www.sik.dk/';

export const SUPPORT_EMAIL = APP_INFO.email;

const BRAND = '#CC4A12';

function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
}

function demoNotice(business: Business, what: string) {
  showDialog(
    t('Eksempelvirksomhed'),
    t('{name} er en fiktiv demo-virksomhed. I den færdige app {what}', { name: business.name, what }),
  );
}

export async function openLink(url: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.open?.(url, '_blank', 'noopener');
    return;
  }
  try {
    await WebBrowser.openBrowserAsync(url, {
      controlsColor: BRAND,
      dismissButtonStyle: 'close',
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  } catch {
    await Linking.openURL(url).catch(() => undefined);
  }
}

export async function callBusiness(business: Business): Promise<void> {
  tap();
  const number = formatPhone(business.contact.phone);
  if (business.demo) {
    demoNotice(
      business,
      t('ringer knappen direkte op til virksomheden. Nummeret {number} er fiktivt, så opkald er slået fra.', {
        number,
      }),
    );
    return;
  }
  try {
    await Linking.openURL(phoneHref(business.contact.phone));
  } catch {
    await Clipboard.setStringAsync(number).catch(() => undefined);
    showDialog(
      t('Kan ikke ringe fra denne enhed'),
      t('Nummeret {number} er kopieret, så du kan ringe fra din telefon.', { number }),
    );
  }
}

export async function openWebsite(business: Business): Promise<void> {
  tap();
  if (!business.contact.website) return;
  if (business.demo) {
    demoNotice(business, t('åbner virksomhedens egen hjemmeside her.'));
    return;
  }
  await openLink(business.contact.website);
}

export async function openTrustpilot(business: Business): Promise<void> {
  tap();
  if (!business.trustpilot) return;
  if (business.demo) {
    demoNotice(business, t('åbner virksomhedens profil på Trustpilot, hvor du kan læse alle anmeldelserne.'));
    return;
  }
  await openLink(business.trustpilot.url);
}

export async function openDirections(business: Business): Promise<void> {
  tap();
  if (business.demo) {
    demoNotice(business, t('får du rutevejledning til virksomheden i Kort-appen.'));
    return;
  }
  const { lat, lon } = business.coords;
  const label = encodeURIComponent(business.name);
  const url = Platform.select({
    ios: `https://maps.apple.com/?daddr=${lat},${lon}&q=${label}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
  });
  await Linking.openURL(url).catch(() => openLink(url));
}

export async function openCvr(business: Business): Promise<void> {
  tap();
  if (business.demo) {
    demoNotice(business, t('kan du slå virksomheden op i det officielle virksomhedsregister.'));
    return;
  }
  const url = registryUrl(business);
  if (url) await openLink(url);
}

export async function shareBusiness(business: Business): Promise<void> {
  tap();
  const lines = [
    t('{name} – fundet på FixMatch', { name: business.name }),
    t('Telefon: {phone}', { phone: formatPhone(business.contact.phone) }),
    business.contact.website ? t('Hjemmeside: {website}', { website: business.contact.website }) : undefined,
    business.demo ? t('(eksempelvirksomhed)') : undefined,
  ].filter(Boolean);
  const message = lines.join('\n');
  try {
    if (Platform.OS === 'web' && !('share' in globalThis.navigator)) throw new Error('no share');
    await Share.share({ message, title: business.name });
  } catch {
    await Clipboard.setStringAsync(message).catch(() => undefined);
    showDialog(t('Kopieret'), t('Oplysningerne er kopieret, så du kan indsætte dem i en besked.'));
  }
}

export async function reportProblem(business?: Business): Promise<void> {
  tap();
  const subject = encodeURIComponent(
    business ? t('Fejl i oplysninger: {name}', { name: business.name }) : t('Henvendelse til FixMatch'),
  );
  const body = encodeURIComponent(
    business
      ? `${t('Virksomhed: {name} (id: {id})', { name: business.name, id: business.id })}\n\n${t('Hvad er forkert eller ulovligt?')}\n\n`
      : '',
  );
  const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  try {
    await Linking.openURL(url);
  } catch {
    await Clipboard.setStringAsync(SUPPORT_EMAIL).catch(() => undefined);
    showDialog(t('Skriv til os'), t('Send en mail til {SUPPORT_EMAIL}. Adressen er kopieret.', { SUPPORT_EMAIL }));
  }
}
