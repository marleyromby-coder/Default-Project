import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as SMS from 'expo-sms';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform, Share } from 'react-native';

import { APP_INFO } from '@/constants/app-info';
import { t } from '@/i18n';
import { logContact, requireContactProfile } from '@/state/account';
import type { Problem } from '@/state/problem';

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

/** Pine (`brandText` in the light theme) for the in-app browser's buttons. */
const BRAND = '#1F5A46';

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

/** Calls the business. The first time, the user is asked for an account with a name and phone number. */
export async function callBusiness(business: Business): Promise<void> {
  tap();
  if (!(await requireContactProfile())) return;
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
  logContact(business, 'call');
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

/** The text sent with the problem's pictures. */
export function problemMessage(business: Business, problem: Problem): string {
  return [
    t('Hej {name}. Jeg har fundet jer på FixMatch.', { name: business.name }),
    problem.text.trim() || undefined,
    problem.photos.length > 0
      ? problem.photos.length === 1
        ? t('Jeg har vedhæftet et billede af problemet.')
        : t('Jeg har vedhæftet {count} billeder af problemet.', { count: problem.photos.length })
      : undefined,
    t('Har I mulighed for at hjælpe, og hvad vil det koste?'),
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * "Foto af problemet": sends the description and pictures to the business as a text message
 * (iMessage or SMS) from the user's own phone. FixMatch never receives the pictures.
 * Without Messages (iPad without SIM, web) the share sheet opens instead.
 */
export async function sendProblem(business: Business, problem: Problem): Promise<void> {
  tap();
  if (!(await requireContactProfile())) return;
  if (business.demo) {
    demoNotice(business, t('åbner Beskeder med din beskrivelse og dine billeder, klar til at sende til virksomheden.'));
    return;
  }
  const message = problemMessage(business, problem);
  try {
    if (Platform.OS !== 'web' && (await SMS.isAvailableAsync())) {
      const { result } = await SMS.sendSMSAsync([business.contact.phone], message, {
        attachments: problem.photos.map((photo, index) => ({
          uri: photo.uri,
          mimeType: photo.mimeType ?? 'image/jpeg',
          filename: photo.fileName ?? `problem-${index + 1}.jpg`,
        })),
      });
      if (result !== 'cancelled') logContact(business, 'message');
      return;
    }
    await Share.share({ message, url: problem.photos[0]?.uri, title: business.name });
  } catch {
    await Clipboard.setStringAsync(message).catch(() => undefined);
    showDialog(t('Kopieret'), t('Beskrivelsen er kopieret, så du kan indsætte den i en besked.'));
  }
}
