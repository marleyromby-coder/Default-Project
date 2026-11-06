import { CATEGORIES } from '@/data/categories';
import { msg } from '@/i18n';

import { TRUSTPILOT_ENABLED } from './features';
import type { Business, Verification, VerificationCheck } from './types';

/**
 * "Verificeret": FixMatch has checked who the business is, like a blue tick on Instagram, but
 * for tradespeople. It is free, follows fixed criteria (info page "Sådan verificerer vi") and
 * never changes the FixMatch score. A check lasts a year; then FixMatch checks again.
 */
export const VERIFICATION_VALID_DAYS = 365;
/** "Topbedømt": a verified business with at least this TrustScore and this many reviews. */
export const TOP_RATED_MIN_SCORE = 4.5;
export const TOP_RATED_MIN_REVIEWS = 25;

const DAY_MS = 86_400_000;

/** Every check FixMatch can make, in the order they are shown. */
export const VERIFICATION_CHECKS: readonly VerificationCheck[] = [
  'cvr',
  'identity',
  'authorization',
  'insurance',
  'guarantee',
];

/** Danish source texts for t(). */
export const CHECK_TEXT: Record<VerificationCheck, string> = {
  cvr: msg('CVR-nummeret er aktivt og hører til virksomheden'),
  identity: msg('Ejeren har bekræftet, hvem de er'),
  authorization: msg('Autorisationen er tjekket hos Sikkerhedsstyrelsen'),
  insurance: msg('Har en erhvervsansvarsforsikring'),
  guarantee: msg('Er med i en garantiordning'),
};

export function isVerificationCheck(value: unknown): value is VerificationCheck {
  return typeof value === 'string' && (VERIFICATION_CHECKS as readonly string[]).includes(value);
}

/** Structural check for data from the import or a hosted feed. */
export function isValidVerification(value: unknown): value is Verification {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<Verification>;
  return (
    typeof v.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
    Number.isFinite(Date.parse(v.date)) &&
    Array.isArray(v.checks) &&
    v.checks.length > 0 &&
    v.checks.every(isVerificationCheck)
  );
}

/** The checks a business needs for the badge: CVR and identity, plus the authorisation its trade requires. */
export function requiredChecks(business: Pick<Business, 'categories'>): VerificationCheck[] {
  const needsAuthorization = business.categories.some((id) => CATEGORIES.find((c) => c.id === id)?.authorization);
  return needsAuthorization ? ['cvr', 'identity', 'authorization'] : ['cvr', 'identity'];
}

/** The day the badge lapses unless FixMatch checks again. */
export function verificationExpiry(verification: Verification): Date {
  return new Date(Date.parse(verification.date) + VERIFICATION_VALID_DAYS * DAY_MS);
}

/** Whether the business shows the Verificeret badge right now. */
export function isVerified(business: Pick<Business, 'categories' | 'verified'>, now = new Date()): boolean {
  const verification = business.verified;
  if (!verification || !isValidVerification(verification)) return false;
  const checked = Date.parse(verification.date);
  if (checked > now.getTime() + DAY_MS || verificationExpiry(verification).getTime() < now.getTime()) return false;
  return requiredChecks(business).every((check) => verification.checks.includes(check));
}

/** The checks to list on the business's page, in the standard order. */
export function passedChecks(business: Pick<Business, 'verified'>): VerificationCheck[] {
  const checks = business.verified?.checks ?? [];
  return VERIFICATION_CHECKS.filter((check) => checks.includes(check));
}

/**
 * "Topbedømt": verified and rated highly by many customers. Reviews come from Trustpilot, so the
 * badge only exists while Trustpilot is switched on.
 */
export function isTopRated(
  business: Pick<Business, 'categories' | 'verified' | 'trustpilot'>,
  now = new Date(),
  reviews = TRUSTPILOT_ENABLED,
): boolean {
  const trustpilot = business.trustpilot;
  return (
    reviews &&
    isVerified(business, now) &&
    trustpilot !== undefined &&
    trustpilot.score >= TOP_RATED_MIN_SCORE &&
    trustpilot.reviews >= TOP_RATED_MIN_REVIEWS
  );
}
