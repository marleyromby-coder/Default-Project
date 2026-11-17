import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GroupCard } from '@/components/group-card';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { DEFAULT_LOCATION } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { localDay } from '@/lib/availability';
import { codeFromLink } from '@/lib/group-link';
import { showDialog } from '@/lib/dialog';
import { success } from '@/lib/haptics';
import { openSignIn, useAccount } from '@/state/account';
import { useHiddenIds } from '@/state/reports';
import { useApp, useMarket } from '@/state/app-state';
import {
  GROUP_DISCOUNT,
  GroupError,
  joinGroup,
  loadGroups,
  MIN_GROUP,
  useMyGroups,
  useNearbyGroups,
} from '@/state/groups';
import { t } from '@/i18n';

/**
 * "Naborabat": the user's groups and the open ones nearby, a code field to join one, and a
 * button to start a new one. The group's page on the website opens this screen with the code
 * filled in, so the neighbour only has to tap "Deltag".
 */
export default function GroupsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { state } = useApp();
  const { market } = useMarket();
  const account = useAccount();
  const mine = useMyGroups();
  const hiddenGroups = useHiddenIds('group');
  // Groups the user reported are hidden on this phone.
  const nearby = useNearbyGroups().filter((group) => !hiddenGroups.has(group.id));
  const params = useLocalSearchParams<{ kode?: string; code?: string }>();
  const [code, setCode] = useState(() => codeFromLink(params.kode ?? params.code));
  const [busy, setBusy] = useState(false);
  const postalCode = state.location.postalCode ?? DEFAULT_LOCATION.postalCode ?? '';

  useEffect(() => {
    loadGroups(market.country, postalCode, localDay(new Date())).catch(() => undefined);
  }, [market.country, postalCode]);

  const join = async () => {
    setBusy(true);
    try {
      const group = await joinGroup(code, account.status === 'signedIn' ? account.userId : undefined);
      setCode('');
      success();
      router.push({ pathname: '/faelles/[id]', params: { id: group.id } });
    } catch (error) {
      const reason = error instanceof GroupError ? error.reason : 'network';
      if (reason === 'signed-out') {
        showDialog(t('Log ind først'), t('Opret en bruger eller log ind, så vi ved, at I er rigtige naboer.'), [
          { text: t('Annuller'), style: 'cancel' },
          { text: t('Log ind'), onPress: openSignIn },
        ]);
        return;
      }
      showDialog(
        reason === 'not-found' ? t('Ingen gruppe med den kode') : t('Det lykkedes ikke'),
        reason === 'not-found'
          ? t('Tjek koden hos den nabo, der startede gruppen. Den er på 6 tegn.')
          : t('Tjek internettet, og prøv igen.'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: t('Naborabat') }} />

      <View style={styles.intro}>
        <AppText variant="title3">{t('Gå sammen med naboerne')}</AppText>
        <AppText variant="callout" tone="textSecondary">
          {t(
            'Rensning af tagrender, service af fyret eller hjulskift: er I mindst {min} i samme gade, sparer håndværkeren kørslen og giver typisk {min_pct}–{max_pct} % rabat.',
            { min: MIN_GROUP, min_pct: GROUP_DISCOUNT.min, max_pct: GROUP_DISCOUNT.max },
          )}
        </AppText>
      </View>

      <Button title={t('Start en gruppe')} icon="plus" size="large" onPress={() => router.push('/faelles/ny')} block />

      <View style={[styles.codeBox, { backgroundColor: colors.surface }]}>
        <View style={styles.flex}>
          <TextField
            label={t('Har du fået en kode af en nabo?')}
            value={code}
            onChangeText={(value) => setCode(value.toUpperCase().slice(0, 6))}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="ABC123"
          />
        </View>
        <Button title={t('Deltag')} disabled={code.trim().length !== 6} loading={busy} onPress={join} />
      </View>

      {mine.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="title3" accessibilityRole="header">
            {t('Dine grupper')}
          </AppText>
          {mine.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <AppText variant="title3" accessibilityRole="header">
          {t('Åbne grupper nær {place}', { place: state.location.label })}
        </AppText>
        {nearby.length === 0 ? (
          <AppText variant="footnote" tone="textSecondary">
            {t('Ingen åbne grupper i dit område endnu. Start den første, og del koden med naboerne.')}
          </AppText>
        ) : (
          nearby.map((group) => <GroupCard key={group.id} group={group} />)
        )}
      </View>

      <AppText variant="caption" tone="textSecondary">
        {t(
          'Andre ser kun opgaven, gaden og hvor mange I er. Aldrig navne eller adresser. Prisen aftaler I selv med virksomheden.',
        )}
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg },
  intro: { gap: Spacing.xs },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
  },
  section: { gap: Spacing.sm },
});
