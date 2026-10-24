/**
 * Publisher details shown in the app and in the legal texts.
 * Replace the placeholders (marked TODO) before submitting to the App Store.
 * Without a company, the publisher is the person who owns the Apple Developer
 * account; that name is shown on the App Store as the seller.
 */
export const APP_INFO = {
  name: 'FixMatch',
  /** TODO: the publisher's name exactly as on the Apple Developer account (person or company). */
  company: 'FixMatch',
  /** CVR number, once there is a company. Leave empty for a personal developer account. */
  cvr: '',
  /** TODO: a mailbox the team actually reads. */
  email: 'hej@fixmatch.dk',
  /** TODO: the public website hosting the privacy policy (required by Apple). */
  website: 'https://fixmatch.dk',
  privacyUrl: 'https://fixmatch.dk/privatliv',
  termsUrl: 'https://fixmatch.dk/vilkaar',
  forBusinessesUrl: 'https://fixmatch.dk/virksomheder',
  /** Date the legal texts were last reviewed. */
  legalUpdated: '2026-10-20',
} as const;
