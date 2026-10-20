import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform, Share } from 'react-native';

import { APP_INFO } from '@/constants/app-info';

import { showDialog } from './dialog';
import { formatPhone, phoneHref } from './format';
import type { Business } from './types';

export const CVR_LOOKUP_URL = (cvr: string) => `https://datacvr.virk.dk/enhed/virksomhed/${cvr.replace(/\D/g, '')}`;

/** Sikkerhedsstyrelsen's public register of authorised el, VVS and kloak businesses. */
export const AUTHORIZATION_REGISTER_URL = 'https://www.sik.dk/';

export const SUPPORT_EMAIL = APP_INFO.email;

const BRAND = '#CC4A12';

function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
}

function demoNotice(business: Business, what: string) {
  showDialog(
    'Eksempelvirksomhed',
    `${business.name} er en fiktiv demo-virksomhed. I den færdige app ${what}`,
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
    demoNotice(business, `ringer knappen direkte op til virksomheden. Nummeret ${number} er fiktivt, så opkald er slået fra.`);
    return;
  }
  try {
    await Linking.openURL(phoneHref(business.contact.phone));
  } catch {
    await Clipboard.setStringAsync(number).catch(() => undefined);
    showDialog('Kan ikke ringe fra denne enhed', `Nummeret ${number} er kopieret, så du kan ringe fra din telefon.`);
  }
}

export async function openWebsite(business: Business): Promise<void> {
  tap();
  if (!business.contact.website) return;
  if (business.demo) {
    demoNotice(business, 'åbner virksomhedens egen hjemmeside her.');
    return;
  }
  await openLink(business.contact.website);
}

export async function openTrustpilot(business: Business): Promise<void> {
  tap();
  if (!business.trustpilot) return;
  if (business.demo) {
    demoNotice(business, 'åbner virksomhedens profil på Trustpilot, hvor du kan læse alle anmeldelserne.');
    return;
  }
  await openLink(business.trustpilot.url);
}

export async function openDirections(business: Business): Promise<void> {
  tap();
  if (business.demo) {
    demoNotice(business, 'får du rutevejledning til virksomheden i Kort-appen.');
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
    demoNotice(business, 'kan du slå virksomheden op i det officielle CVR-register.');
    return;
  }
  await openLink(CVR_LOOKUP_URL(business.cvr));
}

export async function shareBusiness(business: Business): Promise<void> {
  tap();
  const lines = [
    `${business.name} – fundet på FixMatch`,
    `Telefon: ${formatPhone(business.contact.phone)}`,
    business.contact.website ? `Hjemmeside: ${business.contact.website}` : undefined,
    business.demo ? '(eksempelvirksomhed)' : undefined,
  ].filter(Boolean);
  const message = lines.join('\n');
  try {
    if (Platform.OS === 'web' && !('share' in globalThis.navigator)) throw new Error('no share');
    await Share.share({ message, title: business.name });
  } catch {
    await Clipboard.setStringAsync(message).catch(() => undefined);
    showDialog('Kopieret', 'Oplysningerne er kopieret, så du kan indsætte dem i en besked.');
  }
}

export async function reportProblem(business?: Business): Promise<void> {
  tap();
  const subject = encodeURIComponent(business ? `Fejl i oplysninger: ${business.name}` : 'Henvendelse til FixMatch');
  const body = encodeURIComponent(
    business
      ? `Virksomhed: ${business.name} (id: ${business.id})\n\nHvad er forkert eller ulovligt?\n\n`
      : '',
  );
  const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  try {
    await Linking.openURL(url);
  } catch {
    await Clipboard.setStringAsync(SUPPORT_EMAIL).catch(() => undefined);
    showDialog('Skriv til os', `Send en mail til ${SUPPORT_EMAIL}. Adressen er kopieret.`);
  }
}
