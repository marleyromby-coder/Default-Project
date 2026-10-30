import { Linking, Platform } from 'react-native';

import { APP_INFO } from '@/constants/app-info';
import { getLanguage, msg, t } from '@/i18n';

import { COUNTRY_CODES, type CountryCode } from './markets';
import { supabase } from './supabase';
import type { CategoryId } from './types';

/**
 * Businesses sign themselves up and give their consent in the app or on the website.
 * The consent is stored with the exact wording and the time it was given (in Supabase, see
 * supabase/migrations), which is the documentation docs/jura/samtykke-virksomhed.md asks for.
 * The team then checks the details and imports them with `npm run import:businesses`.
 */

/** Bump when the consent wording below changes, so every sign-up records what it agreed to. */
export const CONSENT_VERSION = '2026-10-30';

export const CONSENT_STATEMENTS = {
  listing: msg(
    'Vi giver FixMatch lov til gratis at vise oplysningerne ovenfor i appen og på hjemmesiden, indtil vi beder om at blive fjernet.',
  ),
  accurate: msg('Oplysningerne er korrekte, og priserne er vores egne og inkl. moms.'),
  authority: msg('Jeg må give samtykke på virksomhedens vegne.'),
} as const;

export type ConsentKey = keyof typeof CONSENT_STATEMENTS;
export const CONSENT_KEYS = Object.keys(CONSENT_STATEMENTS) as ConsentKey[];

export interface BusinessSignup {
  country: CountryCode;
  companyName: string;
  registryNumber: string;
  trades: CategoryId[];
  street: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  hourlyMin: string;
  hourlyMax: string;
  calloutFee: string;
  openingHours: string;
  emergency: boolean;
  description: string;
  contactName: string;
  contactRole: string;
  consent: Record<ConsentKey, boolean>;
}

export function emptySignup(country: CountryCode): BusinessSignup {
  return {
    country,
    companyName: '',
    registryNumber: '',
    trades: [],
    street: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    hourlyMin: '',
    hourlyMax: '',
    calloutFee: '',
    openingHours: '',
    emergency: false,
    description: '',
    contactName: '',
    contactRole: '',
    consent: { listing: false, accurate: false, authority: false },
  };
}

export type SignupField = Exclude<keyof BusinessSignup, 'emergency'>;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE = /^\+?[0-9 ()-]{6,20}$/;
const amount = (value: string) =>
  value.trim() === '' ? undefined : Number(value.replace(/[\s.]/g, '').replace(',', '.'));

/** Problems with the form, by field, in the user's language. Empty when it can be sent. */
export function signupErrors(signup: BusinessSignup): Partial<Record<SignupField, string>> {
  const errors: Partial<Record<SignupField, string>> = {};
  if (!COUNTRY_CODES.includes(signup.country)) errors.country = t('Vælg et land.');
  if (signup.companyName.trim().length < 2) errors.companyName = t('Skriv virksomhedens navn.');
  if (signup.registryNumber.replace(/\W/g, '').length < 4) errors.registryNumber = t('Skriv registreringsnummeret.');
  if (signup.trades.length === 0) errors.trades = t('Vælg mindst ét fag.');
  if (!signup.street.trim()) errors.street = t('Skriv adressen.');
  if (signup.postalCode.trim().length < 3) errors.postalCode = t('Skriv postnummeret.');
  if (!signup.city.trim()) errors.city = t('Skriv byen.');
  if (!PHONE.test(signup.phone.trim()) || signup.phone.replace(/\D/g, '').length < 6) {
    errors.phone = t('Skriv et telefonnummer, gerne med landekode.');
  }
  if (!EMAIL.test(signup.email.trim())) errors.email = t('Skriv en gyldig e-mailadresse.');
  const min = amount(signup.hourlyMin);
  const max = amount(signup.hourlyMax) ?? min;
  if (!(min !== undefined && Number.isInteger(min) && min > 0))
    errors.hourlyMin = t('Skriv timeprisen som et helt tal.');
  else if (!(max !== undefined && Number.isInteger(max) && max >= min)) {
    errors.hourlyMax = t('Den højeste timepris skal være mindst lige så høj som den laveste.');
  }
  const fee = amount(signup.calloutFee);
  if (fee !== undefined && !(Number.isInteger(fee) && fee >= 0))
    errors.calloutFee = t('Skriv kørselsgebyret som et helt tal.');
  if (signup.contactName.trim().length < 2) errors.contactName = t('Skriv dit navn.');
  if (!CONSENT_KEYS.every((key) => signup.consent[key]))
    errors.consent = t('Sæt flueben ved alle tre for at blive vist.');
  return errors;
}

/** The row for the business_signups table. */
export function signupRow(signup: BusinessSignup) {
  const min = amount(signup.hourlyMin) as number;
  const website = signup.website.trim();
  return {
    source: Platform.OS === 'web' ? 'web' : 'app',
    language: getLanguage(),
    country: signup.country,
    company_name: signup.companyName.trim(),
    registry_number: signup.registryNumber.trim(),
    trades: signup.trades,
    street: signup.street.trim(),
    postal_code: signup.postalCode.trim(),
    city: signup.city.trim(),
    phone: signup.phone.trim(),
    email: signup.email.trim(),
    website: website ? (/^https?:\/\//.test(website) ? website : `https://${website}`) : null,
    hourly_min: min,
    hourly_max: amount(signup.hourlyMax) ?? min,
    callout_fee: amount(signup.calloutFee) ?? null,
    opening_hours: signup.openingHours.trim() || null,
    emergency: signup.emergency,
    description: signup.description.trim() || null,
    contact_name: signup.contactName.trim(),
    contact_role: signup.contactRole.trim() || null,
    // The statements exactly as shown, so the consent can be documented later.
    consent: {
      ...signup.consent,
      statements: Object.fromEntries(CONSENT_KEYS.map((key) => [key, t(CONSENT_STATEMENTS[key])])),
    },
    consent_version: CONSENT_VERSION,
  };
}

/**
 * Sends the sign-up. Saved on the server when there is one; otherwise an e-mail to FixMatch
 * with everything in it is prepared, and the business sends it from its own mail app.
 */
export async function submitSignup(signup: BusinessSignup): Promise<'saved' | 'mail'> {
  const row = signupRow(signup);
  if (supabase) {
    const { error } = await supabase.from('business_signups').insert(row);
    if (error) throw error;
    return 'saved';
  }
  const lines = Object.entries(row).map(
    ([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`,
  );
  const subject = encodeURIComponent(t('Tilmelding: {name}', { name: row.company_name }));
  await Linking.openURL(`mailto:${APP_INFO.email}?subject=${subject}&body=${encodeURIComponent(lines.join('\n'))}`);
  return 'mail';
}
