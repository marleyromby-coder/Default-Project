import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useSyncExternalStore } from 'react';
import { Linking } from 'react-native';

import { APP_INFO } from '@/constants/app-info';
import { showDialog } from '@/lib/dialog';
import { supabase } from '@/lib/supabase';
import { msg, t } from '@/i18n';

/**
 * "Rapportér" on content other users wrote: a review or a Naborabat group (App Store guideline
 * 1.2, DSA art. 16). The report goes to FixMatch's content_reports table (supabase/migrations),
 * or by e-mail without a server, and FixMatch looks at it within 24 hours on weekdays. The item
 * is hidden on this phone at once, and stays hidden.
 */
export type ReportKind = 'review' | 'group' | 'photo';

export interface ReportTarget {
  kind: ReportKind;
  id: string;
  /** The e-mail used without a server: subject and the first line of the text. */
  subject: string;
  body: string;
}

/** Why the user reports it. The Danish text is what FixMatch receives. */
export const REPORT_REASONS = [
  msg('Krænkende eller grov'),
  msg('Personoplysninger'),
  msg('Falsk, spam eller reklame'),
] as const;

export const MAX_REASON_LENGTH = 300;

const HIDDEN_KEY = 'fixmatch:hidden-content';
const MAX_HIDDEN = 500;

/** Hidden items as "kind:id", newest first. */
let hidden: string[] = [];
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
function set(next: string[]) {
  hidden = next;
  listeners.forEach((listener) => listener());
}

AsyncStorage.getItem(HIDDEN_KEY)
  .then((raw) => {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) set([...hidden, ...parsed.filter((x): x is string => typeof x === 'string')]);
  })
  .catch(() => undefined);

const keyOf = (kind: ReportKind, id: string) => `${kind}:${id}`;

/** Hides the item on this phone, also after a restart. */
export function hideContent(kind: ReportKind, id: string) {
  const key = keyOf(kind, id);
  if (hidden.includes(key)) return;
  const next = [key, ...hidden].slice(0, MAX_HIDDEN);
  set(next);
  AsyncStorage.setItem(HIDDEN_KEY, JSON.stringify(next)).catch(() => undefined);
}

/** The ids of the items of this kind the user has reported on this phone. */
export function useHiddenIds(kind: ReportKind): ReadonlySet<string> {
  const list = useSyncExternalStore(subscribe, () => hidden);
  return useMemo(() => {
    const prefix = `${kind}:`;
    return new Set(list.filter((key) => key.startsWith(prefix)).map((key) => key.slice(prefix.length)));
  }, [list, kind]);
}

/** Made-up demo content and the user's own items on the phone are never sent anywhere. */
const isLocal = (id: string) => id.startsWith('demo-') || id.startsWith('local-');

async function emailReport(target: ReportTarget, reason: string): Promise<void> {
  const subject = encodeURIComponent(target.subject);
  const body = encodeURIComponent(`${target.body}\n\n${t(reason)}\n\n`);
  try {
    await Linking.openURL(`mailto:${APP_INFO.email}?subject=${subject}&body=${body}`);
  } catch {
    await Clipboard.setStringAsync(APP_INFO.email).catch(() => undefined);
    showDialog(
      t('Skriv til os'),
      t('Send en mail til {SUPPORT_EMAIL}. Adressen er kopieret.', { SUPPORT_EMAIL: APP_INFO.email }),
    );
  }
}

/**
 * Reports the item and hides it on this phone. Returns how it was sent: to the server, as an
 * e-mail the user still has to send, or not at all for demo content.
 */
export async function reportContent(target: ReportTarget, reason: string): Promise<'sent' | 'email' | 'local'> {
  hideContent(target.kind, target.id);
  if (isLocal(target.id)) return 'local';
  if (supabase) {
    try {
      const { error } = await supabase
        .from('content_reports')
        .insert({ kind: target.kind, target_id: target.id, reason: reason.slice(0, MAX_REASON_LENGTH) });
      if (!error) return 'sent';
    } catch {
      // No connection: the e-mail below still works.
    }
  }
  await emailReport(target, reason);
  return 'email';
}

/**
 * Asks why, reports the item and thanks the user. `onHidden` runs once the item is hidden, e.g.
 * to leave the group's page.
 */
export function confirmReport(target: ReportTarget, onHidden?: () => void) {
  const title = target.kind === 'review' ? t('Rapportér anmeldelsen') : t('Rapportér gruppen');
  showDialog(
    title,
    t('Hvad er galt? Vi ser på det inden for 24 timer på hverdage, og du ser det ikke mere på din telefon.'),
    [
      ...REPORT_REASONS.map((reason) => ({
        text: t(reason),
        onPress: () => {
          reportContent(target, reason)
            .then((how) => {
              onHidden?.();
              if (how !== 'email')
                showDialog(
                  t('Tak for din rapport'),
                  t('Vi ser på det inden for 24 timer på hverdage. Det er skjult på din telefon.'),
                );
            })
            .catch(() => onHidden?.());
        },
      })),
      { text: t('Annuller'), style: 'cancel' as const },
    ],
  );
}

/** For tests. */
export function resetReports() {
  set([]);
}

/** For tests: the hidden items as "kind:id". */
export function hiddenSnapshot(): readonly string[] {
  return hidden;
}
