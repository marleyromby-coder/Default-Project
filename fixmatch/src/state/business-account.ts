import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { supabase } from '@/lib/supabase';
import type { Business, PriceUnit } from '@/lib/types';

/**
 * "Min virksomhed": the business the signed-in user manages. The owner links the account with
 * the personal code FixMatch sends (the same as for "Ledig i dag" on the website); the server
 * checks it (supabase/migrations/…_business_accounts.sql). Demo businesses can be tried
 * without a code or a server, with made-up calls, so the feature can be shown.
 */
export interface ManagedBusiness {
  businessId: string;
  /** A demo business tried out without a server: nothing is sent anywhere. */
  demo: boolean;
}

export interface BusinessContact {
  at: string;
  channel: 'call' | 'email' | 'message';
  name?: string;
  phone?: string;
}

export interface MonthSummary {
  /** First day of the month, YYYY-MM-DD. */
  month: string;
  calls: number;
  messages: number;
}

/** What the owner can ask FixMatch to change. Only the fields they touched are sent. */
export interface ChangeRequest {
  hourlyMin?: number;
  hourlyMax?: number;
  calloutFee?: number | null;
  emergency?: boolean;
  videoCheck?: boolean;
  /** Monday to Sunday, "07:00–16:00" or null for closed. */
  hours?: ([string, string] | null)[];
  description?: string;
  examples?: { job: string; min: number; max: number; unit: PriceUnit }[];
  note?: string;
}

const KEY = 'fixmatch:my-business';
const REQUESTS_KEY = 'fixmatch:my-business-requests';

let managed: ManagedBusiness | null = null;
let requests: { at: string; businessId: string }[] = [];
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
function emit() {
  listeners.forEach((listener) => listener());
}

function isManaged(value: unknown): value is ManagedBusiness {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ManagedBusiness>;
  return typeof v.businessId === 'string' && v.businessId.length > 0 && typeof v.demo === 'boolean';
}

Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(REQUESTS_KEY)])
  .then(([stored, sent]) => {
    const parsed = stored ? JSON.parse(stored) : null;
    managed = isManaged(parsed) ? parsed : null;
    const list = sent ? JSON.parse(sent) : [];
    requests = Array.isArray(list)
      ? list.filter((r) => typeof r?.at === 'string' && typeof r?.businessId === 'string')
      : [];
    emit();
  })
  .catch(() => undefined);

export function useManagedBusiness(): ManagedBusiness | null {
  return useSyncExternalStore(subscribe, () => managed);
}

/** When the owner last asked for changes to this business, if they did. */
export function useLastChangeRequest(businessId: string | undefined): string | undefined {
  const list = useSyncExternalStore(subscribe, () => requests);
  return list.find((r) => r.businessId === businessId)?.at;
}

function remember(next: ManagedBusiness | null) {
  managed = next;
  emit();
  if (next) AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
  else AsyncStorage.removeItem(KEY).catch(() => undefined);
}

export class BusinessLoginError extends Error {
  constructor(public reason: 'wrong-code' | 'signed-out' | 'no-server' | 'network') {
    super(reason);
  }
}

/**
 * Links the user to the business. Demo businesses need no code. A real business needs a
 * server, a signed-in user and the right code.
 */
export async function claimBusiness(business: Business, code: string, signedIn: boolean): Promise<void> {
  if (business.demo) {
    remember({ businessId: business.id, demo: true });
    return;
  }
  if (!supabase) throw new BusinessLoginError('no-server');
  if (!signedIn) throw new BusinessLoginError('signed-out');
  const { error } = await supabase.rpc('claim_business', { p_business_id: business.id, p_key: code.trim() });
  if (error) {
    throw new BusinessLoginError(error.code === '28000' || error.code === '42501' ? 'wrong-code' : 'network');
  }
  remember({ businessId: business.id, demo: false });
}

/** Stops managing the business on this phone (and on the server, for a real one). */
export async function leaveBusiness(): Promise<void> {
  const current = managed;
  remember(null);
  if (current && !current.demo && supabase) {
    await supabase.from('business_members').delete().eq('business_id', current.businessId);
  }
}

/** Forgets the link on this phone only (sign-out, account deletion). */
export function forgetManagedBusiness() {
  remember(null);
}

/** Made-up customers for the demo; first names and fictitious 555-style numbers. */
const DEMO_NAMES = ['Mette Holm', 'Jonas Berg', 'Sara Ali', 'Peter Juhl', 'Line Krogh', 'Ahmad Nasser', 'Anna Lund'];

export function demoContacts(businessId: string, now = new Date()): BusinessContact[] {
  let seed = [...businessId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const list: BusinessContact[] = [];
  let daysAgo = 0;
  for (let i = 0; i < 14; i += 1) {
    daysAgo += Math.floor(next() * 4);
    const at = new Date(now);
    at.setDate(at.getDate() - daysAgo);
    // During the working day, 7–19.
    at.setHours(7 + Math.floor(next() * 12), Math.floor(next() * 60), 0, 0);
    if (at > now) at.setDate(at.getDate() - 1);
    const person = Math.floor(next() * DEMO_NAMES.length);
    list.push({
      at: at.toISOString(),
      channel: next() < 0.8 ? 'call' : 'message',
      name: DEMO_NAMES[person],
      // One fictitious number per person.
      phone: `+45 20 ${String(11 + person * 7)} 00 ${String(30 + person)}`,
    });
  }
  return list.sort((a, b) => b.at.localeCompare(a.at));
}

/** Contacts per month (first day of month in local time) from a list of contacts. */
export function summarizeMonths(contacts: BusinessContact[]): MonthSummary[] {
  const months = new Map<string, MonthSummary>();
  for (const contact of contacts) {
    const date = new Date(contact.at);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    const entry = months.get(month) ?? { month, calls: 0, messages: 0 };
    if (contact.channel === 'call') entry.calls += 1;
    else entry.messages += 1;
    months.set(month, entry);
  }
  return [...months.values()].sort((a, b) => b.month.localeCompare(a.month));
}

/** Who contacted the business in the last 90 days, newest first. */
export async function loadBusinessContacts(current: ManagedBusiness): Promise<BusinessContact[]> {
  if (current.demo || !supabase) return demoContacts(current.businessId);
  const { data, error } = await supabase.rpc('business_contacts', { p_business_id: current.businessId });
  if (error) throw error;
  return ((data ?? []) as { created_at: string; channel: string; name: string | null; phone: string | null }[]).map(
    (row) => ({
      at: row.created_at,
      channel: row.channel === 'call' || row.channel === 'email' ? row.channel : 'message',
      name: row.name ?? undefined,
      phone: row.phone ?? undefined,
    }),
  );
}

/** Contacts per month for the last 12 months. */
export async function loadMonthSummary(current: ManagedBusiness): Promise<MonthSummary[]> {
  if (current.demo || !supabase) return summarizeMonths(demoContacts(current.businessId));
  const { data, error } = await supabase.rpc('business_month_summary', { p_business_id: current.businessId });
  if (error) throw error;
  return ((data ?? []) as { month: string; calls: number; messages: number }[]).map((row) => ({
    month: row.month.slice(0, 10),
    calls: row.calls,
    messages: row.messages,
  }));
}

/** Marks free days. Returns the days the server kept. */
export async function setMyAvailability(current: ManagedBusiness, days: string[]): Promise<string[]> {
  if (current.demo || !supabase) return days;
  const { data, error } = await supabase.rpc('set_my_availability', {
    p_business_id: current.businessId,
    p_days: days,
  });
  if (error) throw error;
  return Array.isArray(data) ? (data as string[]) : days;
}

/** Only the fields that differ from the listing. */
export function changedFields(business: Business, wanted: ChangeRequest): ChangeRequest {
  const changes: ChangeRequest = {};
  if (wanted.hourlyMin !== undefined && wanted.hourlyMin !== business.pricing.hourlyMin) {
    changes.hourlyMin = wanted.hourlyMin;
  }
  if (wanted.hourlyMax !== undefined && wanted.hourlyMax !== business.pricing.hourlyMax) {
    changes.hourlyMax = wanted.hourlyMax;
  }
  if (wanted.calloutFee !== undefined && (wanted.calloutFee ?? undefined) !== business.pricing.calloutFee) {
    changes.calloutFee = wanted.calloutFee;
  }
  if (wanted.emergency !== undefined && wanted.emergency !== business.emergency) changes.emergency = wanted.emergency;
  if (wanted.videoCheck !== undefined && wanted.videoCheck !== (business.videoCheck ?? false)) {
    changes.videoCheck = wanted.videoCheck;
  }
  if (wanted.hours && JSON.stringify(wanted.hours) !== JSON.stringify(business.hours)) changes.hours = wanted.hours;
  if (wanted.description !== undefined && wanted.description.trim() !== business.description.trim()) {
    changes.description = wanted.description.trim();
  }
  if (wanted.examples) {
    const differs = wanted.examples.filter((e) => {
      const old = business.pricing.examples.find((x) => x.job === e.job);
      return !old || old.min !== e.min || old.max !== e.max;
    });
    if (differs.length > 0) changes.examples = differs;
  }
  if (wanted.note?.trim()) changes.note = wanted.note.trim();
  return changes;
}

/** Sends the changes to FixMatch, who checks them and updates the listing within 2 working days. */
export async function requestChanges(current: ManagedBusiness, changes: ChangeRequest): Promise<void> {
  if (!current.demo && supabase) {
    const { data } = await supabase.auth.getUser();
    const { error } = await supabase.from('business_change_requests').insert({
      business_id: current.businessId,
      user_id: data.user?.id,
      changes,
    });
    if (error) throw error;
  }
  requests = [
    { at: new Date().toISOString(), businessId: current.businessId },
    ...requests.filter((r) => r.businessId !== current.businessId),
  ];
  emit();
  AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(requests)).catch(() => undefined);
}

/** For tests. */
export function resetBusinessAccount() {
  managed = null;
  requests = [];
  emit();
}
