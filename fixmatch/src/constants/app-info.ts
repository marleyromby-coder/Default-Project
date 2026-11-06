/**
 * Publisher details shown in the app and in the legal texts, and on the website
 * (`npm run website:build` reads the plain string fields below).
 * Without a company, the publisher is the person who owns the Apple Developer
 * account; that name is shown on the App Store as the seller.
 */

/**
 * The public website with the privacy policy, terms, support and the business sign-up
 * (required by Apple). Hosted with Netlify Drop until FixMatch has its own domain; change
 * this one line when it moves (docs/lancering/hjemmeside.md).
 */
const WEBSITE = 'https://fixmatchh.netlify.app';

export const APP_INFO = {
  name: 'FixMatch',
  /** The publisher's name exactly as on the Apple Developer account (person or company). */
  company: 'Marley Romby Sangill',
  /** CVR number, once there is a company. Leave empty for a personal developer account. */
  cvr: '',
  /** The mailbox for customers and businesses. Change it when FixMatch has its own domain. */
  email: 'marleyromby@gmail.com',
  website: 'https://fixmatchh.netlify.app',
  privacyUrl: `${WEBSITE}/privatliv/`,
  privacyUrlEn: `${WEBSITE}/en/privacy/`,
  termsUrl: `${WEBSITE}/vilkaar/`,
  termsUrlEn: `${WEBSITE}/en/terms/`,
  supportUrl: `${WEBSITE}/support/`,
  supportUrlEn: `${WEBSITE}/en/support/`,
  /** Date the legal texts were last reviewed. */
  legalUpdated: '2026-11-06',
} as const;
