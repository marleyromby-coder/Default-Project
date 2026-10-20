import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MinTouchSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { Tappable } from './tappable';
import { AppText } from './text';

type Variant = 'primary' | 'secondary' | 'tinted' | 'plain' | 'destructive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  size?: 'regular' | 'large' | 'small';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  /** Stretch to the full width of the parent. */
  block?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  size = 'regular',
  disabled,
  loading,
  accessibilityLabel,
  accessibilityHint,
  style,
  block,
}: ButtonProps) {
  const colors = useTheme();
  const palette = {
    primary: { bg: colors.brandStrong, fg: colors.onBrand, border: 'transparent' },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.border },
    tinted: { bg: colors.brandSoft, fg: colors.brandText, border: 'transparent' },
    plain: { bg: 'transparent', fg: colors.brandText, border: 'transparent' },
    destructive: { bg: colors.dangerSoft, fg: colors.danger, border: 'transparent' },
  }[variant];
  const height = size === 'large' ? 54 : size === 'small' ? 36 : MinTouchSize + 4;

  return (
    <Tappable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      hitSlop={size === 'small' ? 4 : 0}
      style={[
        styles.base,
        {
          minHeight: height,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingHorizontal: size === 'small' ? Spacing.md : Spacing.lg,
        },
        block ? styles.block : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={size === 'small' ? 15 : 18} color={palette.fg} weight="semibold" /> : null}
          <AppText
            variant={size === 'small' ? 'subhead' : 'headline'}
            weight="600"
            style={{ color: palette.fg }}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}>
            {title}
          </AppText>
        </View>
      )}
    </Tappable>
  );
}

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
  background?: string;
  size?: number;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Round icon button with a 44 pt touch target. */
export function IconButton({ icon, onPress, accessibilityLabel, color, background, size = 20, selected, style }: IconButtonProps) {
  const colors = useTheme();
  return (
    <Tappable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected === undefined ? undefined : { selected }}
      style={[styles.iconButton, { backgroundColor: background ?? colors.surfaceAlt }, style]}>
      <Icon name={icon} size={size} color={color ?? colors.text} weight="semibold" />
    </Tappable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  block: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconButton: {
    width: MinTouchSize,
    height: MinTouchSize,
    borderRadius: MinTouchSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
