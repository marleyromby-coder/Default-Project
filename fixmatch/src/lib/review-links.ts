import sites from '@/data/review-sites.json';

import type { ReviewLink } from './types';

/**
 * "Se anmeldelser andre steder": a business may give plain links to its own profiles on other
 * review sites. FixMatch only shows the site's name as a text link. It never fetches, shows or
 * stores scores, stars or counts from those sites, and they never count in the FixMatch score.
 *
 * Only links that start with one of the prefixes in data/review-sites.json are kept, so a
 * business cannot link to arbitrary pages. The CSV import (scripts/lib/business-csv.js) and the
 * website's sign-up form read the same file.
 */
export interface ReviewSite {
  id: string;
  name: string;
  prefixes: string[];
}

export const REVIEW_SITES: readonly ReviewSite[] = sites;
export const MAX_REVIEW_LINKS = 3;
const MAX_URL_LENGTH = 300;

/** The allowed site a link points to, or undefined. */
export function reviewSiteOf(url: unknown): ReviewSite | undefined {
  if (typeof url !== 'string' || url.length > MAX_URL_LENGTH || /[\s<>"'\\`]/.test(url)) return undefined;
  const lower = url.toLowerCase();
  return REVIEW_SITES.find((site) =>
    site.prefixes.some((prefix) => lower.startsWith(prefix) && url.length > prefix.length),
  );
}

/** The name to show for a site id, e.g. "Google". */
export function reviewSiteName(id: string): string {
  return REVIEW_SITES.find((site) => site.id === id)?.name ?? id;
}

/** Valid links from imported data: allowed sites only, no duplicates, at most MAX_REVIEW_LINKS. */
export function parseReviewLinks(value: unknown): ReviewLink[] {
  if (!Array.isArray(value)) return [];
  const links: ReviewLink[] = [];
  for (const item of value) {
    const url = typeof item === 'string' ? item : (item as Partial<ReviewLink> | null)?.url;
    const site = reviewSiteOf(url);
    if (!site || typeof url !== 'string' || links.some((link) => link.url === url)) continue;
    links.push({ site: site.id, url });
  }
  return links.slice(0, MAX_REVIEW_LINKS);
}

/** Links typed or pasted into a form: split on spaces, commas or new lines, with https:// added. */
export function splitReviewLinks(text: string): string[] {
  return text
    .split(/[\s,|]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (/^[a-z]+:\/\//i.test(part) ? part : `https://${part}`));
}
