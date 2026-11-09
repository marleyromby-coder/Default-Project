import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GroupCard } from '@/components/group-card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { DEFAULT_LOCATION } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { localDay } from '@/lib/availability';
import { showDialog } from '@/lib/dialog';
import { useAccount } from '@/state/account';
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
 * button to start a new one.
 */
export default function GroupsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { state } = useApp();
  const { market } = useMarket();
  const account = useAccount();
  const mine = useMyGroups();
  const nearby = useNearbyGroups();
  const [code, setCode] = useState('');
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
      router.push({ pathname: '/faelles/[id]', params: { id: group.id } });
    } catch (error) {
      const reason = error instanceof GroupError ? error.reason : 'network';
      showDialog(
        reason === 'not-found'
          ? t('Ingen gruppe med den kode')
          : reason === 'signed-out'
            ? t('Log ind først')
            : t('Det lykkedes ikke'),
        reason === 'not-found'
          ? t('Tjek koden hos den nabo, der startede gruppen. Den er på 6 tegn.')
          : reason === 'signed-out'
            ? t('Opret en bruger eller log ind, så vi ved, at I er rigtige naboer.')
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

      <View style={[styles.intro, { backgroundColor: colors.ink }]}>
        <View style={[styles.introIcon, { backgroundColor: colors.accent }]}>
          <Icon name="people" size={20} color={colors.ink} weight="semibold" />
        </View>
        <View style={styles.flex}>
          <AppText variant="headline" style={{ color: colors.onInk }}>
            {t('Gå sammen med naboerne')}
          </AppText>
          <AppText variant="footnote" style={{ color: colors.onInkSoft }}>
            {t(
              'Rensning af tagrender, service af fyret eller hjulskift: er I mindst {min} i samme gade, sparer håndværkeren kørslen og giver typisk {min_pct}–{max_pct} % rabat.',
              { min: MIN_GROUP, min_pct: GROUP_DISCOUNT.min, max_pct: GROUP_DISCOUNT.max },
            )}
          </AppText>
        </View>
      </View>

      <Button title={t('Start en gruppe')} icon="plus" size="large" onPress={() => router.push('/faelles/ny')} block />

      <View style={[styles.codeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
        <Button title={t('Deltag')} size="small" disabled={code.trim().length !== 6} loading={busy} onPress={join} />
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
          {t('Åbne grupper nær {postal}', { postal: postalCode })}
        </AppText>
        {nearby.length === 0 ? (
          <AppText variant="footnote" tone="textSecondary">
            {t('Ingen åbne grupper i dit område endnu. Start den første, og del koden med naboerne.')}
          </AppText>
        ) : (
          nearby.map((group) => <GroupCard key={group.id} group={group} />)
        )}
      </View>

      <AppText variant="caption" tone="textSecondary" align="center">
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
  intro: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg },
  introIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  section: { gap: Spacing.sm },
});
