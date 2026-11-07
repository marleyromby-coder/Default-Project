import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessMark } from '@/components/business/business-mark';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { APP_INFO } from '@/constants/app-info';
import { showDialog } from '@/lib/dialog';
import { loose } from '@/lib/text';
import type { Business } from '@/lib/types';
import { t } from '@/i18n';
import { useAccount } from '@/state/account';
import { useApp } from '@/state/app-state';
import { BusinessLoginError, claimBusiness } from '@/state/business-account';

/** Finds the business by name, CVR or id (the id is in the link from FixMatch). */
function findBusinesses(all: Business[], query: string): Business[] {
  const q = loose(query.trim());
  if (q.length < 2) return [];
  const digits = query.replace(/\D/g, '');
  return all
    .filter(
      (b) =>
        loose(b.name).includes(q) ||
        b.id === query.trim() ||
        (digits.length >= 6 && b.cvr.replace(/\D/g, '') === digits),
    )
    .slice(0, 6);
}

/**
 * "Log ind som virksomhed": the owner finds the business and enters the personal code from
 * FixMatch. Demo businesses can be tried without a code.
 */
export default function BusinessLoginScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { state } = useApp();
  const account = useAccount();
  const signedIn = account.status === 'signedIn';
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Business>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const results = useMemo(() => findBusinesses(state.businesses, query), [state.businesses, query]);
  const demoExample = state.businesses.find((b) => b.demo && b.verified);

  const login = async (business: Business) => {
    setBusy(true);
    try {
      await claimBusiness(business, code, signedIn);
      router.dismiss();
      router.push('/min-virksomhed');
    } catch (error) {
      const reason = error instanceof BusinessLoginError ? error.reason : 'network';
      const messages = {
        'wrong-code': [t('Koden passer ikke'), t('Brug koden fra linket, I har fået fra FixMatch.')],
        'signed-out': [t('Log ind først'), t('Log ind med din egen bruger, så kobler vi den til virksomheden.')],
        'no-server': [
          t('Ikke klar endnu'),
          t('Virksomheder kan logge ind, når FixMatch er klar til rigtige virksomheder.'),
        ],
        network: [t('Det lykkedes ikke'), t('Tjek internettet, og prøv igen.')],
      } as const;
      showDialog(messages[reason][0], messages[reason][1]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <View style={styles.block}>
          <AppText variant="title2">{t('Log ind som virksomhed')}</AppText>
          <AppText variant="callout" tone="textSecondary">
            {t(
              'Se hvem der har ringet, meld ledig tid, og ret jeres priser og åbningstider. Det er gratis. I skal bruge koden fra linket, I har fået fra FixMatch.',
            )}
          </AppText>
        </View>

        {!signedIn ? (
          <View style={[styles.notice, { backgroundColor: colors.infoSoft }]}>
            <Icon name="person" size={16} color={colors.info} weight="semibold" />
            <View style={styles.flex}>
              <AppText variant="footnote">
                {t('Log ind med din egen bruger først. Så kobler vi den til virksomheden.')}
              </AppText>
              <Button
                title={t('Log ind eller opret bruger')}
                variant="plain"
                size="small"
                onPress={() => router.push({ pathname: '/konto', params: { reason: 'settings' } })}
              />
            </View>
          </View>
        ) : null}

        {picked ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.brand }]}>
            <View style={styles.row}>
              <BusinessMark business={picked} size={44} />
              <View style={styles.flex}>
                <AppText variant="headline" numberOfLines={1}>
                  {picked.name}
                </AppText>
                <AppText variant="footnote" tone="textSecondary">
                  {[getCategory(picked.categories[0])?.name, picked.address.city].filter(Boolean).join(' · ')}
                </AppText>
              </View>
              <Button title={t('Skift')} variant="plain" size="small" onPress={() => setPicked(undefined)} />
            </View>
            {picked.demo ? (
              <AppText variant="footnote" tone="textSecondary">
                {t('Det er en eksempelvirksomhed, så I kan prøve uden kode. Opkaldene er opdigtede.')}
              </AppText>
            ) : (
              <TextField
                label={t('Jeres kode')}
                value={code}
                onChangeText={setCode}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                hint={t('Står i linket fra FixMatch efter "kode=".')}
              />
            )}
            <Button
              title={picked.demo ? t('Prøv som {name}', { name: picked.name }) : t('Log ind')}
              size="large"
              loading={busy}
              disabled={!picked.demo && code.trim().length < 8}
              onPress={() => login(picked)}
              block
            />
          </View>
        ) : (
          <>
            <TextField
              label={t('Find jeres virksomhed')}
              value={query}
              onChangeText={setQuery}
              placeholder={t('Navn eller CVR-nummer')}
              autoCorrect={false}
              autoFocus
            />
            {results.map((business) => (
              <Tappable
                key={business.id}
                onPress={() => setPicked(business)}
                accessibilityLabel={t('Vælg {name}', { name: business.name })}
                style={[styles.result, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <BusinessMark business={business} size={36} />
                <View style={styles.flex}>
                  <AppText variant="body" numberOfLines={1}>
                    {business.name}
                  </AppText>
                  <AppText variant="caption" tone="textSecondary">
                    {[getCategory(business.categories[0])?.name, business.address.city].filter(Boolean).join(' · ')}
                  </AppText>
                </View>
                <Icon name="chevronRight" size={13} color={colors.textTertiary} weight="semibold" />
              </Tappable>
            ))}
            {query.trim().length >= 2 && results.length === 0 ? (
              <AppText variant="footnote" tone="textSecondary">
                {t('Vi kan ikke finde den. Er I ikke på FixMatch endnu, så tilmeld jer først.')}
              </AppText>
            ) : null}
            {demoExample ? (
              <Button
                title={t('Prøv med en eksempelvirksomhed')}
                icon="store"
                variant="secondary"
                onPress={() => setPicked(demoExample)}
              />
            ) : null}
            <Button
              title={t('Tilmeld din virksomhed')}
              variant="plain"
              onPress={() => {
                router.dismiss();
                router.push('/tilmeld');
              }}
            />
          </>
        )}

        <AppText variant="caption" tone="textSecondary" align="center">
          {t('Har I ikke fået en kode? Skriv til {email}.', { email: APP_INFO.email })}
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg },
  block: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  card: { borderRadius: Radius.lg, borderWidth: 1.5, padding: Spacing.md, gap: Spacing.md },
  notice: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
