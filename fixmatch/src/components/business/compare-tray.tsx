import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { MinTouchSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import { MAX_COMPARE, useApp } from '@/state/app-state';
import { t } from '@/i18n';

/** Floating bar that appears when businesses are picked for comparison. */
export function CompareTray({ bottomOffset = 0 }: { bottomOffset?: number }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state, clearCompare } = useApp();
  const count = state.compare.length;
  if (count === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, Spacing.md) + bottomOffset }]}>
      <View style={[styles.tray, { backgroundColor: colors.text, shadowColor: colors.shadow }]}>
        <Tappable onPress={clearCompare} accessibilityLabel={t('Ryd sammenligning')} style={styles.clear}>
          <Icon name="close" size={16} color={colors.background} weight="bold" />
        </Tappable>
        <View style={styles.text}>
          <AppText variant="subhead" weight="600" style={{ color: colors.background }}>
            {t('{count} af {MAX_COMPARE} valgt', { count, MAX_COMPARE })}
          </AppText>
          <AppText variant="caption" style={{ color: colors.background, opacity: 0.75 }}>
            {count < 2
              ? t('Vælg mindst én mere')
              : TRUSTPILOT_ENABLED
                ? t('Pris, afstand og anmeldelser side om side')
                : t('Pris og afstand side om side')}
          </AppText>
        </View>
        <Tappable
          onPress={() => router.push('/sammenlign')}
          disabled={count < 2}
          accessibilityLabel={t('Sammenlign {count} virksomheder', { count })}
          style={[styles.go, { backgroundColor: colors.brandStrong }]}>
          <Icon name="compare" size={16} color={colors.onBrand} weight="semibold" />
          <AppText variant="subhead" weight="700" style={{ color: colors.onBrand }} maxFontSizeMultiplier={1.3}>
            {t('Sammenlign')}
          </AppText>
        </Tappable>
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
    padding: Spacing.sm,
    borderRadius: Radius.xl,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  clear: { width: MinTouchSize - 6, height: MinTouchSize - 6, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  go: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    minHeight: MinTouchSize,
    borderRadius: Radius.lg,
  },
});
