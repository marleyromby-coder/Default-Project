import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { MinTouchSize, Radius, Shadows, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { useApp } from '@/state/app-state';
import { t } from '@/i18n';

/**
 * Shows where results are measured from; tap to change. On the map it floats like the map's
 * other overlays, with a hairline and a soft shadow; elsewhere it is a borderless surface.
 */
export function LocationPill({ onMap = false }: { onMap?: boolean }) {
  const colors = useTheme();
  const dark = useIsDark();
  const { state } = useApp();
  const { location } = state;
  return (
    <Tappable
      onPress={() => router.push('/placering')}
      accessibilityLabel={t('Placering: {label}. Skift placering', { label: location.label })}
      style={[
        styles.pill,
        { backgroundColor: colors.surface },
        onMap
          ? [styles.onMap, { borderColor: colors.border, boxShadow: Shadows[dark ? 'dark' : 'light'].raised }]
          : null,
      ]}>
      <Icon name={location.source === 'gps' ? 'location' : 'pin'} size={15} color={colors.brand} weight="semibold" />
      <AppText variant="subhead" weight="600" numberOfLines={1} style={styles.label} maxFontSizeMultiplier={1.3}>
        {location.label}
      </AppText>
      <Icon name="chevronDown" size={12} color={colors.textSecondary} weight="semibold" />
    </Tappable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: MinTouchSize,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    maxWidth: 200,
  },
  onMap: { borderWidth: StyleSheet.hairlineWidth },
  label: { flexShrink: 1 },
});
