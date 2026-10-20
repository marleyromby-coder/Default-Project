import { Platform, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { Tappable } from './tappable';
import { AppText } from './text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  count?: number;
  accessibilityLabel?: string;
}

/** Toggleable filter pill. */
export function Chip({ label, selected = false, onPress, icon, count, accessibilityLabel }: ChipProps) {
  const colors = useTheme();
  const fg = selected ? colors.onBrand : colors.text;
  return (
    <Tappable
      onPress={onPress}
      accessibilityRole={Platform.OS === 'web' ? 'checkbox' : 'togglebutton'}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={{ top: 6, bottom: 6 }}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: colors.brandStrong, borderColor: colors.brandStrong }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      {icon ? <Icon name={icon} size={14} color={selected ? colors.onBrand : colors.textSecondary} weight="semibold" /> : null}
      <AppText variant="subhead" weight="500" style={{ color: fg }} maxFontSizeMultiplier={1.3} numberOfLines={1}>
        {label}
      </AppText>
      {count ? (
        <View style={[styles.count, { backgroundColor: selected ? colors.onBrand : colors.brandStrong }]}>
          <AppText variant="caption2" style={{ color: selected ? colors.brandStrong : colors.onBrand }} maxFontSizeMultiplier={1.2}>
            {count}
          </AppText>
        </View>
      ) : null}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 34,
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
