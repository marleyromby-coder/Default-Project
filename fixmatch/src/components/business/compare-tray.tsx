import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { MinTouchSize, Radius, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { useApp } from '@/state/app-state';
import { t } from '@/i18n';

import { BusinessMark } from './business-mark';

/**
 * The dark bar in ink that appears when businesses are picked for comparison: their marks,
 * "3 valgt" and the sun-yellow "Sammenlign" button.
 */
export function CompareTray({ bottomOffset = 0 }: { bottomOffset?: number }) {
  const colors = useTheme();
  const dark = useIsDark();
  const insets = useSafeAreaInsets();
  const { state, clearCompare } = useApp();
  const count = state.compare.length;
  const chosen = state.compare
    .map((id) => state.businesses.find((b) => b.id === id))
    .filter((b): b is NonNullable<typeof b> => b !== undefined);
  if (count === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, Spacing.md) + bottomOffset }]}>
      <View
        style={[
          styles.tray,
          {
            backgroundColor: colors.ink,
            borderColor: colors.inkRaised,
            boxShadow: dark ? '0px 8px 24px rgba(0, 0, 0, 0.5)' : '0px 10px 28px rgba(11, 26, 21, 0.28)',
          },
        ]}>
        <Tappable
          onPress={clearCompare}
          accessibilityLabel={t('Ryd sammenligning')}
          hitSlop={{ left: 9, right: 9 }}
          style={styles.clear}>
          <Icon name="close" size={15} color={colors.onInkSoft} weight="bold" />
        </Tappable>
        <View style={styles.marks} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {chosen.map((business, index) => (
            <View
              key={business.id}
              style={[styles.mark, { borderColor: colors.ink, marginLeft: index === 0 ? 0 : -6 }]}>
              <BusinessMark business={business} size={26} />
            </View>
          ))}
        </View>
        <View style={styles.text}>
          <AppText variant="headline" display tone="onInk" numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {t('{count} valgt', { count })}
          </AppText>
          <AppText variant="caption" tone="onInkSoft" numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {count < 2 ? t('Vælg mindst én mere') : t('til sammenligning')}
          </AppText>
        </View>
        <Button
          title={t('Sammenlign')}
          variant="sun"
          onPress={() => router.push('/sammenlign')}
          disabled={count < 2}
          accessibilityLabel={t('Sammenlign {count} virksomheder', { count })}
          style={styles.go}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: Spacing.md, right: Spacing.md, alignItems: 'center' },
  tray: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.sm,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  clear: { width: 26, height: MinTouchSize, alignItems: 'center', justifyContent: 'center' },
  marks: { flexDirection: 'row' },
  mark: { borderWidth: 2, borderRadius: 9, borderCurve: 'continuous', overflow: 'hidden' },
  go: { paddingHorizontal: Spacing.sm },
  text: { flex: 1, minWidth: 0 },
});
