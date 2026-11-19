import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import {
  displayFont,
  DisplayTracking,
  DisplayVariants,
  Fonts,
  type ColorName,
  Typography,
  type TypographyVariant,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type Tone = Extract<
  ColorName,
  | 'text'
  | 'textSecondary'
  | 'textTertiary'
  | 'brandText'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'onBrand'
  | 'onPanel'
  | 'onPanelSoft'
  | 'onAccent'
  | 'accentText'
  | 'skyText'
  | 'coralText'
  | 'onInk'
  | 'onInkSoft'
>;

const HEADINGS: readonly TypographyVariant[] = ['largeTitle', 'title1', 'title2', 'title3'];

interface Props extends TextProps {
  variant?: TypographyVariant;
  tone?: Tone;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  /**
   * Set in Schibsted Grotesk, the display font: titles, prices, business names and button
   * labels. On by default for largeTitle, title1, price, title2 and title3. The weight picks the
   * family (600, 700, 800 or 900), with the tight letter-spacing of the design.
   */
  display?: boolean;
  /**
   * Numbers in SF Pro with tabular figures, so digits line up and do not jump. Display text
   * (titles, prices) keeps Schibsted's proportional figures, as the design asks.
   */
  tabular?: boolean;
  /** Deprecated: same as tabular. */
  rounded?: boolean;
}

export function AppText({
  variant = 'body',
  tone = 'text',
  weight,
  align,
  display,
  tabular,
  rounded,
  style,
  maxFontSizeMultiplier = 1.6,
  ...rest
}: Props) {
  const colors = useTheme();
  const base = Typography[variant];
  const isDisplay = display ?? DisplayVariants.includes(variant);
  const numeric = (tabular || rounded) && !isDisplay;
  // Schibsted ships one family per weight, so the weight picks the family and the text itself
  // stays at a normal weight (otherwise iOS and browsers fake a bold).
  let displayStyle: TextStyle | null = null;
  if (isDisplay) {
    const fontSize = StyleSheet.flatten(style)?.fontSize ?? base.fontSize;
    displayStyle = {
      fontFamily: displayFont(weight ?? (variant === 'headline' ? '700' : base.fontWeight)),
      fontWeight: 'normal',
      letterSpacing: DisplayTracking[variant] * fontSize,
    };
  }
  return (
    <Text
      accessibilityRole={HEADINGS.includes(variant) ? 'header' : undefined}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        base,
        { color: colors[tone], fontFamily: Fonts?.sans },
        !isDisplay && weight ? { fontWeight: weight } : null,
        displayStyle,
        align ? { textAlign: align } : null,
        numeric ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
      {...rest}
    />
  );
}
