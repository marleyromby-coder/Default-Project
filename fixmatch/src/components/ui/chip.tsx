import { Platform, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { select } from '@/lib/haptics';

import { Icon, type IconName } from './icon';
import { Tappable } from './tappable';
import { AppText } from './text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** Leading icon. A selected chip without one shows a checkmark, so the state is not colour alone. */
  icon?: IconName;
  /** A small sun-yellow counter after the label, e.g. how many filters are on. Hidden at 0. */
  count?: number;
  accessibilityLabel?: string;
}

/** Toggleable filter pill: white with a border, ink when selected. */
export function Chip({ label, selected = false, onPress, icon, count, accessibilityLabel }: ChipProps) {
  const colors = useTheme();
  const fg = selected ? colors.onInk : colors.text;
  const leading = icon ?? (selected ? 'check' : undefined);
  return (
    <Tappable
      onPress={() => {
        select();
        onPress();
      }}
      accessibilityRole={Platform.OS === 'web' ? 'checkbox' : 'togglebutton'}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={{ top: 4, bottom: 4 }}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: colors.ink, borderColor: colors.ink }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      {leading ? (
        <Icon name={leading} size={14} color={selected ? colors.onInk : colors.textSecondary} weight="semibold" />
      ) : null}
      <AppText
        variant="subhead"
        weight={selected ? '600' : '500'}
        style={{ color: fg }}
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}>
        {label}
      </AppText>
      {count ? (
        <View style={[styles.count, { backgroundColor: colors.accent }]}>
          <AppText variant="caption2" weight="700" tone="onAccent" maxFontSizeMultiplier={1.2}>
            {count}
          </AppText>
        </View>
      ) : null}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  count: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
