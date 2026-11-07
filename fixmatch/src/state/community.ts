import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { supabase } from '@/lib/supabase';
import type { Business, CategoryId, CountryCode } from '@/lib/types';

import { useContacts } from './account';

/**
 * What users share with each other: what they paid ("Del, hvad du betalte") and reviews
 * from real calls. Both come from users who contacted the business through FixMatch, which
 * the server checks against the contacts table (supabase/migrations). Without a server the
 * user's own entries are kept on the phone, so the screens work in the demo too.
 */

export interface PriceReport {
  businessId: string;
  country: CountryCode;
  category: CategoryId;
  job: string;
  /** Paid incl. VAT, whole units of the country's currency. */
  total: number;
  /** The labour part, when the invoice shows it. */
  labour?: number;
  quantity: number;
  /** First two characters of the postal code, never the whole address. */
  postalArea: string;
  /** YYYY-MM-DD. */
  paidOn: string;
}

export interface Review {
  id: string;
  businessId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text?: string;
  job?: string;
  /** ISO date and time. */
  createdAt: string;
  /** The reviewer's first initial. */
  initial: string;
  /** True for the signed-in user's own review. */
  mine?: boolean;
}

export interface ReviewSummary {
  average: number;
  reviews: number;
}

const PRICES_KEY = 'fixmatch:price-reports';
const REVIEWS_KEY = 'fixmatch:reviews';
export const MAX_REVIEW_LENGTH = 500;

interface Store {
  /** Shared prices from the server. */
  shared: PriceReport[];
  /** Shared prices from everyone, plus the user's own. */
  prices: PriceReport[];
  /** Reviews by business, fetched when a business page opens. */
  reviews: Record<string, Review[]>;
  summaries: Record<string, ReviewSummary>;
  /** The user's own price reports and reviews, kept on the phone. */
  myPrices: PriceReport[];
  myReviews: Review[];
}

let store: Store = { shared: [], prices: [], reviews: {}, summaries: {}, myPrices: [], myReviews: [] };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
function set(next: Partial<Store>) {
  store = { ...store, ...next };
  listeners.forEach((listener) => listener());
}

export function postalArea(postalCode: string | undefined): string {
  return (postalCode ?? '').replace(/\s/g, '').slice(0, 2).toUpperCase() || '00';
}

export function isValidPriceReport(value: unknown): value is PriceReport {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Partial<PriceReport>;
  return (
    typeof r.businessId === 'string' &&
    typeof r.job === 'string' &&
    typeof r.category === 'string' &&
    typeof r.total === 'number' &&
    r.total > 0 &&
    typeof r.paidOn === 'string'
  );
}

function isValidReview(value: unknown): value is Review {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Partial<Review>;
  return typeof r.businessId === 'string' && typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 5;
}

// The user's own entries, read once at start-up.
Promise.all([AsyncStorage.getItem(PRICES_KEY), AsyncStorage.getItem(REVIEWS_KEY)])
  .then(([prices, reviews]) => {
    const myPrices = ((prices ? JSON.parse(prices) : []) as unknown[]).filter(isValidPriceReport);
    const myReviews = ((reviews ? JSON.parse(reviews) : []) as unknown[]).filter(isValidReview);
    set({ myPrices, myReviews, prices: mergePrices(store.shared, myPrices) });
  })
  .catch(() => undefined);

/** Everyone's reports, with the user's own on top of the server's (which may lag). */
const priceKey = (r: PriceReport) => `${r.businessId}|${r.job}|${r.paidOn}|${r.total}`;

function mergePrices(shared: PriceReport[], mine: PriceReport[]): PriceReport[] {
  const key = priceKey;
  const seen = new Set(mine.map(key));
  return [...mine, ...shared.filter((r) => !seen.has(key(r)))];
}

/** Fetches every shared price in the country (small: one row per report). */
export async function loadSharedPrices(country: CountryCode = 'DK'): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('shared_prices')
    .select('business_id, country, category, job, total, labour, quantity, postal_area, paid_on')
    .eq('country', country)
    .limit(5000);
  if (error || !data) return;
  const shared = data.map(
    (row): PriceReport => ({
      businessId: row.business_id,
      country: row.country,
      category: row.category,
      job: row.job,
      total: row.total,
      labour: row.labour ?? undefined,
      quantity: row.quantity,
      postalArea: row.postal_area,
      paidOn: row.paid_on,
    }),
  );
  set({ shared, prices: mergePrices(shared, store.myPrices) });
}

/** Shares what the user paid. Kept on the phone, and sent to the server when there is one. */
export async function reportPrice(report: PriceReport, userId: string | undefined): Promise<void> {
  const sameJob = (r: PriceReport) => r.businessId === report.businessId && r.job === report.job;
  const previous = store.myPrices.find(sameJob);
  const myPrices = [report, ...store.myPrices.filter((r) => !sameJob(r))];
  // The server replaces the user's old report too, so drop it from what was loaded.
  const shared = previous ? store.shared.filter((r) => priceKey(r) !== priceKey(previous)) : store.shared;
  set({ myPrices, shared, prices: mergePrices(shared, myPrices) });
  AsyncStorage.setItem(PRICES_KEY, JSON.stringify(myPrices)).catch(() => undefined);
  if (!supabase || !userId) return;
  const { error } = await supabase.from('price_reports').upsert(
    {
      user_id: userId,
      business_id: report.businessId,
      country: report.country,
      category: report.category,
      job: report.job,
      total: report.total,
      labour: report.labour ?? null,
      quantity: report.quantity,
      postal_area: report.postalArea,
      paid_on: report.paidOn,
    },
    { onConflict: 'user_id,business_id,job' },
  );
  if (error) throw error;
}

/** Shared prices for a job in a country: the user's own included. */
export function useSharedPrices(): PriceReport[] {
  return useSyncExternalStore(subscribe, () => store.prices);
}

export function useMyPriceReport(businessId: string, job?: string): PriceReport | undefined {
  const mine = useSyncExternalStore(subscribe, () => store.myPrices);
  return mine.find((r) => r.businessId === businessId && (job === undefined || r.job === job));
}

/** Loads a business's reviews and summary when its page opens. */
export async function loadReviews(businessId: string): Promise<void> {
  if (!supabase) return;
  const [list, summary] = await Promise.all([
    supabase
      .from('public_reviews')
      .select('id, business_id, rating, text, job, created_at, initial')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('review_summary').select('average, reviews').eq('business_id', businessId).maybeSingle(),
  ]);
  if (list.error || !list.data) return;
  const mine = store.myReviews.find((r) => r.businessId === businessId);
  const reviews = list.data.map(
    (row): Review => ({
      id: String(row.id),
      businessId: row.business_id,
      rating: row.rating as Review['rating'],
      text: row.text ?? undefined,
      job: row.job ?? undefined,
      createdAt: row.created_at,
      initial: row.initial || '–',
      mine: mine !== undefined && mine.id === String(row.id),
    }),
  );
  set({
    reviews: { ...store.reviews, [businessId]: reviews },
    summaries: {
      ...store.summaries,
      ...(summary.data
        ? { [businessId]: { average: Number(summary.data.average), reviews: summary.data.reviews } }
        : {}),
    },
  });
}

/** The reviews of a business: the server's when loaded, else the user's own. */
export function useReviews(businessId: string): Review[] {
  const all = useSyncExternalStore(subscribe, () => store.reviews);
  const mine = useSyncExternalStore(subscribe, () => store.myReviews);
  const loaded = all[businessId];
  if (loaded) return loaded;
  return mine.filter((r) => r.businessId === businessId);
}

export function useReviewSummary(businessId: string): ReviewSummary | undefined {
  const summaries = useSyncExternalStore(subscribe, () => store.summaries);
  const reviews = useReviews(businessId);
  if (summaries[businessId]) return summaries[businessId];
  return summarize(reviews);
}

export function summarize(reviews: Review[]): ReviewSummary | undefined {
  if (reviews.length === 0) return undefined;
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { average: Math.round(average * 100) / 100, reviews: reviews.length };
}

export function useMyReview(businessId: string): Review | undefined {
  const mine = useSyncExternalStore(subscribe, () => store.myReviews);
  return mine.find((r) => r.businessId === businessId);
}

/** Whether the user may review the business: only after contacting it through FixMatch. */
export function useCanReview(businessId: string | undefined): boolean {
  const contacts = useContacts();
  return businessId !== undefined && contacts.some((c) => c.businessId === businessId);
}

/** Writes or rewrites the user's review of a business. */
export async function submitReview(
  input: { business: Business; rating: Review['rating']; text?: string; job?: string },
  user: { id: string | undefined; name: string | undefined },
): Promise<void> {
  const text = input.text?.trim().slice(0, MAX_REVIEW_LENGTH) || undefined;
  const existing = store.myReviews.find((r) => r.businessId === input.business.id);
  const review: Review = {
    id: existing?.id ?? `local-${Date.now()}`,
    businessId: input.business.id,
    rating: input.rating,
    text,
    job: input.job,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    initial: (user.name ?? '').trim().charAt(0).toUpperCase() || '–',
    mine: true,
  };
  const myReviews = [review, ...store.myReviews.filter((r) => r.businessId !== review.businessId)];
  const others = (store.reviews[review.businessId] ?? []).filter((r) => !r.mine);
  set({
    myReviews,
    reviews: store.reviews[review.businessId]
      ? { ...store.reviews, [review.businessId]: [review, ...others] }
      : store.reviews,
  });
  AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(myReviews)).catch(() => undefined);
  if (!supabase || !user.id || input.business.demo) return;
  const { data, error } = await supabase
    .from('reviews')
    .upsert(
      {
        user_id: user.id,
        business_id: review.businessId,
        rating: review.rating,
        text: text ?? null,
        job: review.job ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,business_id' },
    )
    .select('id')
    .single();
  if (error) throw error;
  if (data) {
    const withId = myReviews.map((r) => (r.businessId === review.businessId ? { ...r, id: String(data.id) } : r));
    set({ myReviews: withId });
    AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(withId)).catch(() => undefined);
  }
  loadReviews(review.businessId).catch(() => undefined);
}

/** Forgets the user's own entries on this phone (sign-out, account deletion). */
export function clearCommunity() {
  set({ myPrices: [], myReviews: [] });
  AsyncStorage.multiRemove([PRICES_KEY, REVIEWS_KEY]).catch(() => undefined);
}

/** For tests: the current state of the store. */
export function communitySnapshot(): Readonly<Store> {
  return store;
}

/** For tests. */
export function resetCommunityStore() {
  store = { shared: [], prices: [], reviews: {}, summaries: {}, myPrices: [], myReviews: [] };
  listeners.forEach((listener) => listener());
}
