import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { supabase } from '@/lib/supabase';
import type { Business } from '@/lib/types';

/**
 * "Fik du fat i dem?": after a call through FixMatch the user is asked whether anyone
 * answered. The answers give each business its answer rate ("Tager telefonen 9 ud af 10
 * gange"). An iPhone app cannot see the call itself, so the user's answer is the only
 * source. Rates are shown from MIN_ANSWERS answers, so one missed call never labels anyone.
 */
export interface AnswerRate {
  answered: number;
  total: number;
}

export interface PendingCall {
  businessId: string;
  /** ISO time the user tapped "Ring". */
  at: string;
}

export const MIN_ANSWERS = 5;
/** Ask only if the user comes back within this long; later it is probably not about the call. */
const ASK_WITHIN_MS = 30 * 60_000;
/** And not before this long: coming straight back means the call never started. */
const ASK_AFTER_MS = 8_000;

const PENDING_KEY = 'fixmatch:pending-call';
const MY_ANSWERS_KEY = 'fixmatch:call-answers';

interface Store {
  rates: Record<string, AnswerRate>;
  pending: PendingCall | null;
  /** The user's own answers, newest first, so the rate updates at once on this phone. */
  mine: { businessId: string; answered: boolean; at: string }[];
}

let store: Store = { rates: {}, pending: null, mine: [] };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
function set(next: Partial<Store>) {
  store = { ...store, ...next };
  listeners.forEach((listener) => listener());
}

Promise.all([AsyncStorage.getItem(PENDING_KEY), AsyncStorage.getItem(MY_ANSWERS_KEY)])
  .then(([pending, mine]) => {
    const parsedPending = pending ? (JSON.parse(pending) as PendingCall) : null;
    const parsedMine = mine ? (JSON.parse(mine) as Store['mine']) : [];
    set({
      pending:
        parsedPending && typeof parsedPending.businessId === 'string' && typeof parsedPending.at === 'string'
          ? parsedPending
          : null,
      mine: Array.isArray(parsedMine) ? parsedMine.slice(0, 200) : [],
    });
  })
  .catch(() => undefined);

/** Remembered when the user taps "Ring", so the question can be asked when they come back. */
export function rememberCall(business: Business) {
  const pending = { businessId: business.id, at: new Date().toISOString() };
  set({ pending });
  AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending)).catch(() => undefined);
}

function clearPending() {
  set({ pending: null });
  AsyncStorage.removeItem(PENDING_KEY).catch(() => undefined);
}

/** The call to ask about when the app comes back, if it is recent enough; otherwise forgotten. */
export function callToAskAbout(now = Date.now()): PendingCall | null {
  const pending = store.pending;
  if (!pending) return null;
  const age = now - Date.parse(pending.at);
  if (age < ASK_AFTER_MS) return null;
  if (age > ASK_WITHIN_MS) {
    clearPending();
    return null;
  }
  return pending;
}

export function usePendingCall(): PendingCall | null {
  return useSyncExternalStore(subscribe, () => store.pending);
}

/** The user said whether anyone answered. Stored on the phone and, with an account, on the server. */
export async function answerCall(business: Business, answered: boolean, userId: string | undefined): Promise<void> {
  clearPending();
  const mine = [{ businessId: business.id, answered, at: new Date().toISOString() }, ...store.mine].slice(0, 200);
  set({ mine });
  AsyncStorage.setItem(MY_ANSWERS_KEY, JSON.stringify(mine)).catch(() => undefined);
  if (!supabase || !userId || business.demo) return;
  await supabase.from('call_answers').insert({ user_id: userId, business_id: business.id, answered });
}

/** The user does not want to say: forget the call. */
export function dismissCall() {
  clearPending();
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Made-up answer rates for demo businesses: most answer well, a few do not. */
export function demoAnswerRate(business: Business): AnswerRate | undefined {
  if (!business.demo) return undefined;
  const roll = hash(`answers|${business.id}`) % 100;
  if (roll < 20) return undefined;
  const total = 6 + (roll % 19);
  const share = roll < 35 ? 0.55 : roll < 60 ? 0.8 : 0.93;
  return { answered: Math.round(total * share), total };
}

/** Fetches every business's answer rate from the server (one small row per business). */
export async function loadAnswerRates(): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.from('answer_rates').select('business_id, answered, total').limit(5000);
  if (error || !data) return;
  const rates: Record<string, AnswerRate> = {};
  for (const row of data as { business_id: string; answered: number; total: number }[]) {
    rates[row.business_id] = { answered: Number(row.answered), total: Number(row.total) };
  }
  set({ rates });
}

/** The business's rate: the server's (or the demo's), plus the user's own answers on this phone. */
export function answerRateOf(business: Business, state: Store = store): AnswerRate | undefined {
  const base = state.rates[business.id] ?? demoAnswerRate(business);
  const own = state.mine.filter((a) => a.businessId === business.id);
  if (!base && own.length === 0) return undefined;
  const rate = { answered: base?.answered ?? 0, total: base?.total ?? 0 };
  // Own answers are already in the server's numbers once it has them; only count them until then.
  if (!state.rates[business.id]) {
    rate.total += own.length;
    rate.answered += own.filter((a) => a.answered).length;
  }
  return rate;
}

export function useAnswerRate(business: Business | undefined): AnswerRate | undefined {
  const current = useSyncExternalStore(subscribe, () => store);
  return business ? answerRateOf(business, current) : undefined;
}

/** "9 ud af 10" when there are enough answers to mean something. */
export function answerRateText(rate: AnswerRate | undefined): { answered: number; outOf: number } | undefined {
  if (!rate || rate.total < MIN_ANSWERS) return undefined;
  const outOf = 10;
  return { answered: Math.round((rate.answered / rate.total) * outOf), outOf };
}

export function clearAnswers() {
  set({ mine: [], pending: null });
  AsyncStorage.multiRemove([PENDING_KEY, MY_ANSWERS_KEY]).catch(() => undefined);
}

/** For tests. */
export function resetAnswers() {
  store = { rates: {}, pending: null, mine: [] };
  listeners.forEach((listener) => listener());
}
