import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { showDialog } from '@/lib/dialog';
import { t } from '@/i18n';
import { useAccount } from '@/state/account';
import { answerCall, callToAskAbout, dismissCall, usePendingCall } from '@/state/answers';
import { useApp } from '@/state/app-state';

/**
 * "Fik du fat i dem?": a small card at the bottom when the user comes back after a call.
 * One tap answers; "Nej" offers the businesses that are free today instead.
 */
export function CallFollowUp() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const account = useAccount();
  const pending = usePendingCall();
  const [askAbout, setAskAbout] = useState<string>();

  useEffect(() => {
    const check = () => setAskAbout(callToAskAbout()?.businessId);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') check();
    });
    return () => subscription.remove();
  }, []);

  const business = state.businesses.find((b) => b.id === askAbout);
  if (!business || !pending || pending.businessId !== business.id) return null;
  const userId = account.status === 'signedIn' ? account.userId : undefined;
  const category = getCategory(business.categories[0]);

  const answer = (answered: boolean) => {
    setAskAbout(undefined);
    answerCall(business, answered, userId).catch(() => undefined);
    if (answered || !category) return;
    showDialog(
      t('Ingen svarede'),
      t('Tak, det hjælper andre. Vil du se {plural}, der selv har meldt ledig tid i dag?', {
        plural: category.plural.toLowerCase(),
      }),
      [
        { text: t('Nej tak'), style: 'cancel' },
        {
          text: t('Vis dem'),
          onPress: () => router.push({ pathname: '/kategori/[id]', params: { id: category.id, ledig: '1' } }),
        },
      ],
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: insets.bottom + Spacing.md, paddingHorizontal: ScreenPadding }]}>
      <View
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        accessibilityLiveRegion="polite">
        <View style={styles.head}>
          <View style={[styles.icon, { backgroundColor: colors.brandSoft }]}>
            <Icon name="phone" size={16} color={colors.brand} weight="semibold" />
          </View>
          <View style={styles.flex}>
            <AppText variant="headline">{t('Fik du fat i {name}?', { name: business.name })}</AppText>
            <AppText variant="footnote" tone="textSecondary">
              {t('Dit svar viser andre, om de tager telefonen. Ingen ser, hvem der svarede.')}
            </AppText>
          </View>
          <Tappable
            onPress={() => {
              setAskAbout(undefined);
              dismissCall();
            }}
            accessibilityLabel={t('Luk')}
            hitSlop={10}
            style={styles.close}>
            <Icon name="close" size={14} color={colors.textSecondary} weight="bold" />
          </Tappable>
        </View>
        <View style={styles.buttons}>
          <View style={styles.flex}>
            <Button title={t('Ja')} icon="check" size="small" onPress={() => answer(true)} block />
          </View>
          <View style={styles.flex}>
            <Button
              title={t('Nej, ingen svarede')}
              variant="secondary"
              size="small"
              onPress={() => answer(false)}
              block
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  close: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  buttons: { flexDirection: 'row', gap: Spacing.sm },
});
