import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GroupCard } from '@/components/group-card';
import { HeroPanel, panelHeaderOptions } from '@/components/hero-panel';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Shadows, Spacing } from '@/constants/theme';
import { DEFAULT_LOCATION } from '@/data/places';
import { useIsDark, useTheme } from '@/hooks/use-theme';
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

/** How far the start button and code field reach up into the panel. */
const OVERLAP = 32;

/**
 * "Naborabat": the user's groups and the open ones nearby, a code field to join one, and a
 * button to start a new one. The group's page on the website opens this screen with the code
 * filled in, so the neighbour only has to tap "Deltag".
 */
export default function GroupsScreen() {
  const colors = useTheme();
  const shadows = Shadows[useIsDark() ? 'dark' : 'light'];
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
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ ...panelHeaderOptions(colors), title: t('Naborabat') }} />

      <HeroPanel safeArea={false} overlap={OVERLAP} contentStyle={styles.intro}>
        <AppText variant="title1" tone="onPanel">
          {t('Gå sammen med naboerne')}
        </AppText>
        <AppText variant="callout" tone="onPanel">
          {t(
            'Rensning af tagrender, service af fyret eller hjulskift: er I mindst {min} i samme gade, sparer håndværkeren kørslen og giver typisk {min_pct}–{max_pct} % rabat.',
            { min: MIN_GROUP, min_pct: GROUP_DISCOUNT.min, max_pct: GROUP_DISCOUNT.max },
          )}
        </AppText>
      </HeroPanel>

      <View style={[styles.content, column]}>
        <View style={[styles.start, { backgroundColor: colors.surface, boxShadow: shadows.raised }]}>
          {/* The one main action of the screen, in sun yellow. */}
          <Button
            title={t('Start en gruppe')}
            icon="plus"
            variant="sun"
            size="large"
            onPress={() => router.push('/faelles/ny')}
            block
          />
          {/* The label spans the card, so only the field and "Deltag" share the row. */}
          <View style={styles.code}>
            <AppText
              variant="subhead"
              weight="600"
              tone="textSecondary"
              accessibilityElementsHidden
              importantForAccessibility="no">
              {t('Har du fået en kode af en nabo?')}
            </AppText>
            <View style={styles.codeBox}>
              <View style={styles.flex}>
                <TextField
                  label={t('Har du fået en kode af en nabo?')}
                  labelHidden
                  value={code}
                  onChangeText={(value) => setCode(value.toUpperCase().slice(0, 6))}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="ABC123"
                />
              </View>
              <Button title={t('Deltag')} disabled={code.trim().length !== 6} loading={busy} onPress={join} />
            </View>
          </View>
        </View>

        {mine.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="title2" accessibilityRole="header">
              {t('Dine grupper')}
            </AppText>
            {mine.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <AppText variant="title2" accessibilityRole="header">
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
            'Alle kan se opgaven, gaden, postnummeret, perioden og beskeden, og hvor mange I er – aldrig hvem. Prisen aftaler I selv med virksomheden.',
          )}
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: ScreenPadding, gap: Spacing.lg },
  intro: { gap: Spacing.sm, paddingTop: Spacing.xs },
  // The start button and the code field, raised onto the panel.
  start: {
    marginTop: -OVERLAP,
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.card,
    borderCurve: 'continuous',
  },
  code: { gap: Spacing.xs },
  codeBox: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  section: { gap: Spacing.sm },
});
