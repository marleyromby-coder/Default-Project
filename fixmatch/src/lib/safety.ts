import { CATEGORIES } from '@/data/categories';
import { msg } from '@/i18n';

import { countryOf } from './business-text';
import type { Business, CategoryId } from './types';
import { isVerified } from './verification';

/**
 * "Tryghed": what a customer can check before saying yes, for one business. Each point says
 * whether FixMatch has checked it, the business has only stated it, or nothing is known.
 * FixMatch never gives a safety score; the customer sees the facts and decides.
 */
export type SafetyKey = 'cvr' | 'identity' | 'authorization' | 'insurance' | 'guarantee';
export type SafetyStatus = 'checked' | 'stated' | 'missing';

export interface SafetyItem {
  key: SafetyKey;
  status: SafetyStatus;
  /** The insurer's or guarantee scheme's name, or the authorisation numbers. */
  value?: string;
}

/** Danish source texts for t(): the heading of each point. */
export const SAFETY_TITLES: Record<SafetyKey, string> = {
  cvr: msg('Virksomheden findes'),
  identity: msg('Ejeren er bekræftet'),
  authorization: msg('Autorisation'),
  insurance: msg('Erhvervsansvarsforsikring'),
  guarantee: msg('Garantiordning'),
};

/** Whether the business's trades need a Sikkerhedsstyrelsen authorisation (Denmark). */
export function needsAuthorization(business: Pick<Business, 'categories'>): boolean {
  return business.categories.some((id) => CATEGORIES.find((c) => c.id === id)?.authorization);
}

export function safetyItems(business: Business, now = new Date()): SafetyItem[] {
  const checks = isVerified(business, now) ? (business.verified?.checks ?? []) : [];
  const has = (key: SafetyKey) => checks.includes(key);
  const items: SafetyItem[] = [
    // The registry number is always public, so the customer can look it up themselves.
    { key: 'cvr', status: has('cvr') ? 'checked' : business.cvr ? 'stated' : 'missing' },
    { key: 'identity', status: has('identity') ? 'checked' : 'missing' },
  ];
  const numbers = business.authorizations.map((a) => `${a.kind.toUpperCase()} ${a.number}`).join(', ');
  if (business.authorizations.length > 0 || needsAuthorization(business)) {
    items.push({
      key: 'authorization',
      status: has('authorization') ? 'checked' : business.authorizations.length > 0 ? 'stated' : 'missing',
      value: numbers || undefined,
    });
  }
  items.push({
    key: 'insurance',
    status: has('insurance') ? 'checked' : business.insurer ? 'stated' : 'missing',
    value: business.insurer,
  });
  items.push({
    key: 'guarantee',
    status: has('guarantee') ? 'checked' : business.guaranteeScheme ? 'stated' : 'missing',
    value: business.guaranteeScheme,
  });
  return items;
}

/** "3 af 5 punkter er tjekket af FixMatch". */
export function safetySummary(items: SafetyItem[]): { checked: number; total: number } {
  return { checked: items.filter((i) => i.status === 'checked').length, total: items.length };
}

export interface ComplaintBoard {
  /** Danish source text for t(). */
  name: string;
  /** Danish source text for t(): what the board handles. */
  detail: string;
  url?: string;
}

const BYGGERI: ComplaintBoard = {
  name: msg('Byggeriets Ankenævn'),
  detail: msg('Klager over byggearbejde.'),
};
const HAANDVAERK: ComplaintBoard = {
  name: msg('Håndværkets Ankenævn'),
  detail: msg('Klager over håndværksarbejde.'),
};
const INSTALLATIONER: ComplaintBoard = {
  name: msg('Ankenævnet for Tekniske Installationer'),
  detail: msg('Klager over el, VVS og andre installationer.'),
};
const BILER: ComplaintBoard = {
  name: msg('Ankenævnet for biler'),
  detail: msg('Reparation af privatbiler, når regningen er over 3.000 kr.'),
  url: 'https://bilklage.dk',
};

/** The boards that may handle a complaint about each trade in Denmark (as on "Hvis noget går galt"). */
const BOARDS: Record<CategoryId, ComplaintBoard[]> = {
  vvs: [INSTALLATIONER],
  elektriker: [INSTALLATIONER],
  toemrer: [BYGGERI, HAANDVAERK],
  murer: [BYGGERI, HAANDVAERK],
  tagdaekker: [BYGGERI, HAANDVAERK],
  maler: [HAANDVAERK],
  mekaniker: [BILER],
  laasesmed: [],
};

/** Where to complain, from the most specific to the general boards. Denmark only for now. */
export function complaintBoards(business: Business): ComplaintBoard[] {
  if (countryOf(business) !== 'DK') return [];
  const specific = [...new Set(business.categories.flatMap((id) => BOARDS[id] ?? []))];
  return [
    ...specific,
    {
      name: msg('Forbrugerklagenævnet'),
      detail: msg('Når intet andet nævn kan tage sagen. Klag via Nævnenes Hus.'),
      url: 'https://naevneneshus.dk',
    },
  ];
}
