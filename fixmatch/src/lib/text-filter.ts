import { msg } from '@/i18n';

/**
 * A simple check of text that other users will see (review texts, Naborabat groups) before it
 * is posted (App Store guideline 1.2). It stops the obvious cases only: slurs and obscenities in
 * Danish and English, phone numbers, and links or e-mail addresses. Everything else is handled
 * by "Rapportér" and FixMatch's own review of reports.
 */
export type TextProblem = 'offensive' | 'phone' | 'link';

/** Never fine, also inside a longer word ("fucking", "lortekælling"). */
const ANYWHERE = [
  'fuck',
  'shit',
  'cunt',
  'nigger',
  'nigga',
  'faggot',
  'asshole',
  'bitch',
  'whore',
  'wanker',
  'perker',
  'fisse',
  'kusse',
  'røvhul',
  'kælling',
  'horeunge',
  'pikhoved',
  'bøsserøv',
  'svagpisser',
];

/**
 * Only as a whole word, because they are part of ordinary words too ("pik" in "pikant", "spasser"
 * in "huspasser"). Words that are also ordinary Danish ("slut", "fag") are left out.
 */
const WHOLE_WORDS = new Set([
  'pik',
  'hore',
  'horer',
  'luder',
  'ludere',
  'neger',
  'negre',
  'kneppe',
  'kneppet',
  'knepper',
  'twat',
  'retard',
  'retarded',
  'spic',
  'kike',
  'paki',
  'tranny',
  'bastard',
  'dickhead',
  'spasser',
  'spasseren',
  'spassere',
  'spasserne',
]);

/**
 * 8 or more digits with at most one space between them: "12 34 56 78", "+45 12345678". Hyphens
 * are left out, so a date like 17-11-2026 is not taken for a phone number.
 */
const PHONE = /\d(?:\s?\d){7,}/;
/** A date written with spaces, "10 11 2026". Taken out before looking for phone numbers. */
const DATE = /\b(?:0[1-9]|[12]\d|3[01]) (?:0[1-9]|1[0-2]) (?:19|20)\d\d\b/g;
const URL = /https?:\/\/|www\./i;
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
/** A bare domain in lower case, so "godt arbejde.De kom" (a missing space) is not a link. */
const DOMAIN = /\b[a-zA-Z0-9-]{2,}\.(?:dk|com|net|org|eu|se|no|de|uk|io|info|biz|co|me|app)\b/;

/** What is wrong with the text, if anything. Whole letters only: "f.u.c.k" is not caught. */
export function findTextProblem(text: string | undefined): TextProblem | undefined {
  const original = text ?? '';
  const value = original.toLowerCase();
  if (!value.trim()) return undefined;
  const words = value.split(/[^a-z0-9æøåäöüé]+/).filter(Boolean);
  if (words.some((word) => WHOLE_WORDS.has(word)) || ANYWHERE.some((part) => value.includes(part))) return 'offensive';
  if (URL.test(value) || EMAIL.test(value) || DOMAIN.test(original)) return 'link';
  if (PHONE.test(value.replace(DATE, ' '))) return 'phone';
  return undefined;
}

/** What to tell the user, translated with t(). */
export const TEXT_PROBLEM_MESSAGES: Record<TextProblem, string> = {
  offensive: msg('Teksten har grove eller krænkende ord. Ret den, og prøv igen.'),
  phone: msg('Skriv ikke telefonnumre i teksten. Andre kan se den.'),
  link: msg('Skriv ikke links eller e-mailadresser i teksten. Andre kan se den.'),
};
