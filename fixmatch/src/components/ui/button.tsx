import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MinTouchSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { Tappable } from './tappable';
import { AppText } from './text';

/**
 * `link` is a left-aligned text button in the brand colour, for "read more" links and quiet
 * actions inside a card. `plain` is the same, centred, for EmptyState and "Spring over".
 */
type Variant = 'primary' | 'secondary' | 'tinted' | 'plain' | 'link' | 'destructive';

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
  /** A small chevron after the title, for links that open another page. */
  chevron?: boolean;
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
  chevron,
}: ButtonProps) {
  const colors = useTheme();
  const textOnly = variant === 'plain' || variant === 'link';
  // Disabled buttons get a neutral look with readable text instead of a faded colour.
  const palette =
    disabled && !loading
      ? textOnly
        ? { bg: 'transparent', fg: colors.textTertiary, border: 'transparent' }
        : { bg: colors.fill, fg: colors.textSecondary, border: 'transparent' }
      : {
          primary: { bg: colors.brandStrong, fg: colors.onBrand, border: 'transparent' },
          secondary: { bg: colors.surface, fg: colors.text, border: colors.border },
          tinted: { bg: colors.brandSoft, fg: colors.brandText, border: 'transparent' },
          plain: { bg: 'transparent', fg: colors.brandText, border: 'transparent' },
          link: { bg: 'transparent', fg: colors.brandText, border: 'transparent' },
          destructive: { bg: colors.dangerSoft, fg: colors.danger, border: 'transparent' },
        }[variant];
  const link = variant === 'link';
  const height = link ? MinTouchSize : size === 'large' ? 54 : size === 'small' ? 36 : MinTouchSize + 4;
  const labelVariant = link ? (size === 'small' ? 'footnote' : 'subhead') : size === 'small' ? 'subhead' : 'headline';

  return (
    <Tappable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityRole={link ? 'link' : 'button'}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      hitSlop={size === 'small' && !link ? 4 : 0}
      dimWhenDisabled={false}
      style={[
        styles.base,
        {
          minHeight: height,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingHorizontal: link ? 0 : size === 'small' ? Spacing.md : Spacing.lg,
        },
        link ? styles.link : null,
        block ? styles.block : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={[styles.content, link ? styles.linkContent : null]}>
          {icon ? (
            <Icon name={icon} size={size === 'small' || link ? 15 : 18} color={palette.fg} weight="semibold" />
          ) : null}
          <AppText
            variant={labelVariant}
            weight="600"
            style={[{ color: palette.fg }, link ? styles.linkLabel : null]}
            numberOfLines={link ? 2 : 1}
            maxFontSizeMultiplier={1.3}>
            {title}
          </AppText>
          {chevron ? <Icon name="chevronRight" size={12} color={palette.fg} weight="semibold" /> : null}
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
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  color,
  background,
  size = 20,
  selected,
  style,
}: IconButtonProps) {
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
  link: { alignSelf: 'flex-start', justifyContent: 'flex-start' },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  linkContent: { gap: Spacing.xs + 2, flexShrink: 1 },
  linkLabel: { flexShrink: 1 },
  iconButton: {
    width: MinTouchSize,
    height: MinTouchSize,
    borderRadius: MinTouchSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
