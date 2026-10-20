import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useApp } from '@/state/app-state';

/** Shows where results are measured from; tap to change. */
export function LocationPill() {
  const colors = useTheme();
  const { state } = useApp();
  const { location } = state;
  return (
    <Tappable
      onPress={() => router.push('/placering')}
      accessibilityLabel={`Placering: ${location.label}. Skift placering`}
      style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Icon name={location.source === 'gps' ? 'location' : 'pin'} size={14} color={colors.brand} weight="semibold" />
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
    minHeight: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 200,
  },
  label: { flexShrink: 1 },
});
