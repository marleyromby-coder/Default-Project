import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import type { Business } from '@/lib/types';
import { serverProviders, supabase } from '@/lib/supabase';

/** What a business sees when you contact it. */
export interface Profile {
  name: string;
  phone: string;
}

export type Account =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; userId: string; email?: string; profile: Profile | null };

/** How the user got in touch, kept with the contact so the business knows who called. */
export type ContactChannel = 'call' | 'email' | 'message';

const SKIPPED_KEY = 'fixmatch:account-skipped';
/**
 * The signed-in account is also kept on the phone: all of it without a server, and with one
 * the last known name and phone number, so starting without internet doesn't ask again.
 */
const ACCOUNT_KEY = 'fixmatch:account';
/** The businesses the user contacted, kept on the phone for the Profil tab (newest first). */
const CONTACTS_KEY = 'fixmatch:contacts';
const MAX_CONTACTS = 50;

export interface ContactRecord {
  businessId: string;
  channel: ContactChannel;
  /** ISO date and time. */
  at: string;
}

let contacts: ContactRecord[] = [];
AsyncStorage.getItem(CONTACTS_KEY)
  .then((value) => {
    const parsed: unknown = value ? JSON.parse(value) : [];
    if (Array.isArray(parsed)) {
      contacts = parsed.filter(
        (c): c is ContactRecord => typeof c?.businessId === 'string' && typeof c?.at === 'string',
      );
      emit();
    }
  })
  .catch(() => undefined);

let account: Account = { status: 'loading' };
let skipped = false;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const emit = () => listeners.forEach((listener) => listener());

function set(next: Account) {
  account = next;
  emit();
}

function save(next: Account) {
  set(next);
  const write =
    next.status === 'signedIn'
      ? AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(next))
      : AsyncStorage.removeItem(ACCOUNT_KEY);
  write.catch(() => undefined);
}

async function loadProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('name, phone').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? { name: data.name, phone: data.phone } : null;
}

/** Fetches the profile; offline, the copy kept on the phone is used. */
async function signedIn(userId: string, email: string | undefined, kept: Account = account) {
  let profile: Profile | null;
  try {
    profile = await loadProfile(userId);
  } catch {
    profile = kept.status === 'signedIn' && kept.userId === userId ? kept.profile : null;
  }
  save({ status: 'signedIn', userId, email, profile });
}

// Read once at start-up. The root layout waits until the status is known.
AsyncStorage.getItem(SKIPPED_KEY)
  .then((value) => {
    skipped = value === '1';
  })
  .catch(() => undefined)
  .finally(async () => {
    let kept: Account = { status: 'signedOut' };
    try {
      const stored = await AsyncStorage.getItem(ACCOUNT_KEY);
      if (stored) kept = JSON.parse(stored) as Account;
    } catch {
      // Unreadable: start signed out.
    }
    if (supabase) {
      // Signing in is handled where it happens; this only catches an expired or revoked session.
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') save({ status: 'signedOut' });
      });
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const session = data.session;
      if (session) await signedIn(session.user.id, session.user.email, kept);
      else save({ status: 'signedOut' });
      return;
    }
    set(kept.status === 'signedIn' ? kept : { status: 'signedOut' });
  });

export function useAccount(): Account {
  return useSyncExternalStore(subscribe, () => account);
}

/** True once the user has chosen "Spring over" on the sign-up screen at launch. */
export function useAccountSkipped(): boolean {
  return useSyncExternalStore(subscribe, () => skipped);
}

export function skipAccount() {
  skipped = true;
  emit();
  AsyncStorage.setItem(SKIPPED_KEY, '1').catch(() => undefined);
}

/** Signed in with a name and phone number, so businesses can see who contacts them. */
export function canContact(current: Account = account): boolean {
  return current.status === 'signedIn' && current.profile !== null;
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync().catch(() => false));
}

/**
 * Sign in with Apple. Returns the name Apple shares the first time (to fill in the profile),
 * or null if the user cancelled.
 */
export async function signInWithApple(): Promise<{ name: string } | null> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw error;
  }
  const name = credential.fullName ? AppleAuthentication.formatFullName(credential.fullName).trim() : '';
  if (supabase) {
    if (!credential.identityToken) throw new Error('Apple sent no identity token');
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error) throw error;
    await signedIn(data.user.id, data.user.email);
  } else {
    save({ status: 'signedIn', userId: credential.user, email: credential.email ?? undefined, profile: null });
  }
  return { name };
}

/** Log ind med Google is shown in the iPhone app when it is switched on in Supabase. */
export async function isGoogleSignInAvailable(): Promise<boolean> {
  if (Platform.OS === 'web' || !supabase) return false;
  return (await serverProviders())?.google === true;
}

/** Where Google sends the browser back to; must be listed under Redirect URLs in Supabase. */
export const GOOGLE_REDIRECT_PATH = 'auth/callback';

/**
 * Log ind med Google: Supabase's Google sign-in in a secure browser sheet, which returns to
 * the app with a one-time code that is exchanged for a session (PKCE). Returns the name
 * Google shares (to fill in the profile), or null if the user cancelled.
 */
export async function signInWithGoogle(): Promise<{ name: string } | null> {
  if (!supabase) throw new Error('Google sign-in needs the server');
  const redirectTo = Linking.createURL(GOOGLE_REDIRECT_PATH);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return null;
  const params = Linking.parse(result.url).queryParams ?? {};
  const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
  const code = first(params.code);
  if (typeof code !== 'string' || !code) {
    const reason = first(params.error_description) ?? first(params.error);
    throw new Error(typeof reason === 'string' && reason ? reason : 'Google sent no code');
  }
  const exchanged = await supabase.auth.exchangeCodeForSession(code, data.flowId ? { flowId: data.flowId } : undefined);
  if (exchanged.error) throw exchanged.error;
  const user = exchanged.data.user;
  await signedIn(user.id, user.email);
  const meta = user.user_metadata as { full_name?: unknown; name?: unknown } | undefined;
  const name = [meta?.full_name, meta?.name].find((value): value is string => typeof value === 'string') ?? '';
  return { name: name.trim() };
}

/** Sends a 6-digit code by e-mail. Without a server there is no code, and the e-mail is kept. */
export async function sendEmailCode(email: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, code: string): Promise<void> {
  if (!supabase) {
    save({ status: 'signedIn', userId: `local:${email}`, email, profile: null });
    return;
  }
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw error;
  if (data.user) await signedIn(data.user.id, data.user.email);
}

export async function saveProfile(profile: Profile): Promise<void> {
  if (account.status !== 'signedIn') throw new Error('Not signed in');
  if (supabase) {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: account.userId, name: profile.name, phone: profile.phone, updated_at: new Date().toISOString() });
    if (error) throw error;
  }
  save({ ...account, profile });
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut().catch(() => undefined);
  save({ status: 'signedOut' });
}

/** Deletes the account and everything stored with it (App Store guideline 5.1.1(v)). */
export async function deleteAccount(): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc('delete_account');
    if (error) throw error;
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  }
  save({ status: 'signedOut' });
  clearContacts();
}

/** Records that the user contacted a business, so the business can see who it was. */
export function logContact(business: Business, channel: ContactChannel) {
  contacts = [{ businessId: business.id, channel, at: new Date().toISOString() }, ...contacts].slice(0, MAX_CONTACTS);
  emit();
  AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts)).catch(() => undefined);
  if (!supabase || account.status !== 'signedIn' || business.demo) return;
  supabase
    .from('contacts')
    .insert({ user_id: account.userId, business_id: business.id, channel })
    .then(
      () => undefined,
      () => undefined,
    );
}

/** The businesses the user has contacted from this phone, newest first. */
export function useContacts(): ContactRecord[] {
  return useSyncExternalStore(subscribe, () => contacts);
}

/** Forgets the list of contacted businesses on this phone. */
export function clearContacts() {
  contacts = [];
  emit();
  AsyncStorage.removeItem(CONTACTS_KEY).catch(() => undefined);
}

/** Opens the sign-in sheet, e.g. from a "Log ind først" dialog. */
export function openSignIn() {
  router.push({ pathname: '/konto', params: { reason: 'settings' } });
}

let pending: ((ok: boolean) => void) | null = null;

/**
 * Makes sure the user has an account with a name and phone number before contacting a
 * business. Opens the sign-up screen if not, and resolves once it closes. A second tap while
 * the screen is open is ignored.
 */
export function requireContactProfile(): Promise<boolean> {
  if (canContact()) return Promise.resolve(true);
  if (pending) return Promise.resolve(false);
  return new Promise((resolve) => {
    pending = resolve;
    router.push({ pathname: '/konto', params: { reason: 'contact' } });
  });
}

/** Called by the sign-up screen when it closes. */
export function finishContactProfileRequest() {
  pending?.(canContact());
  pending = null;
}
