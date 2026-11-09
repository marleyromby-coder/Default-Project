import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

/**
 * FixMatch's server: Supabase in the EU (Frankfurt). It holds user accounts, the name and
 * phone number businesses see, and businesses' own sign-ups with their consent.
 *
 * Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY (the project's publishable key,
 * which is meant to be in apps) in .env – see docs/lancering/supabase.md. Without them the
 * app still works: accounts are kept on the phone only and business sign-ups go by e-mail.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const supabase: SupabaseClient | null =
  url?.startsWith('https://') && key
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

/** Whether accounts and sign-ups are saved on the server. */
export const SERVER_ENABLED = supabase !== null;

/**
 * Log in with an e-mail code. Off until the project has its own e-mail sender (SMTP), because
 * Supabase's built-in sender only mails the team and cannot send a code on the free plan.
 * Set EXPO_PUBLIC_EMAIL_LOGIN=on when SMTP is set up (docs/lancering/supabase.md, step 4).
 */
export const EMAIL_LOGIN_ENABLED = !SERVER_ENABLED || process.env.EXPO_PUBLIC_EMAIL_LOGIN !== 'off';

// Tokens are only refreshed while the app is in front, as Supabase recommends for apps.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
