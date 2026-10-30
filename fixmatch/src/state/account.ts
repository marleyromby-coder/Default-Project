import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import type { Business } from '@/lib/types';
import { supabase } from '@/lib/supabase';

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
/** Without a server, the account lives on the phone only. */
const LOCAL_KEY = 'fixmatch:local-account';

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

function saveLocal(next: Account) {
  set(next);
  if (supabase) return;
  const write =
    next.status === 'signedIn'
      ? AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(next))
      : AsyncStorage.removeItem(LOCAL_KEY);
  write.catch(() => undefined);
}

async function loadProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('profiles').select('name, phone').eq('id', userId).maybeSingle();
  return data ? { name: data.name, phone: data.phone } : null;
}

async function signedIn(userId: string, email: string | undefined) {
  const profile = await loadProfile(userId).catch(() => null);
  set({ status: 'signedIn', userId, email, profile });
}

// Read once at start-up. The root layout waits until the status is known.
AsyncStorage.getItem(SKIPPED_KEY)
  .then((value) => {
    skipped = value === '1';
  })
  .catch(() => undefined)
  .finally(async () => {
    if (supabase) {
      // Signing in is handled where it happens; this only catches an expired or revoked session.
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') set({ status: 'signedOut' });
      });
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const session = data.session;
      if (session) await signedIn(session.user.id, session.user.email);
      else set({ status: 'signedOut' });
      return;
    }
    const stored = await AsyncStorage.getItem(LOCAL_KEY).catch(() => null);
    try {
      const parsed = stored ? (JSON.parse(stored) as Account) : null;
      set(parsed?.status === 'signedIn' ? parsed : { status: 'signedOut' });
    } catch {
      set({ status: 'signedOut' });
    }
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
    saveLocal({ status: 'signedIn', userId: credential.user, email: credential.email ?? undefined, profile: null });
  }
  return { name };
}

/** Sends a 6-digit code by e-mail. Without a server there is no code, and the e-mail is kept. */
export async function sendEmailCode(email: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, code: string): Promise<void> {
  if (!supabase) {
    saveLocal({ status: 'signedIn', userId: `local:${email}`, email, profile: null });
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
  saveLocal({ ...account, profile });
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut().catch(() => undefined);
  saveLocal({ status: 'signedOut' });
}

/** Deletes the account and everything stored with it (App Store guideline 5.1.1(v)). */
export async function deleteAccount(): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc('delete_account');
    if (error) throw error;
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  }
  saveLocal({ status: 'signedOut' });
}

/** Records that the user contacted a business, so the business can see who it was. */
export function logContact(business: Business, channel: ContactChannel) {
  if (!supabase || account.status !== 'signedIn' || business.demo) return;
  supabase
    .from('contacts')
    .insert({ user_id: account.userId, business_id: business.id, channel })
    .then(
      () => undefined,
      () => undefined,
    );
}

let pending: ((ok: boolean) => void) | null = null;

/**
 * Makes sure the user has an account with a name and phone number before contacting a
 * business. Opens the sign-up screen if not, and resolves once it closes.
 */
export function requireContactProfile(): Promise<boolean> {
  if (canContact()) return Promise.resolve(true);
  pending?.(false);
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
