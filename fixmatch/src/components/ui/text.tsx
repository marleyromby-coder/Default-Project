import { Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts, type ColorName, Typography, type TypographyVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type Tone = Extract<
  ColorName,
  'text' | 'textSecondary' | 'textTertiary' | 'brandText' | 'success' | 'danger' | 'warning' | 'info' | 'onBrand'
>;

interface Props extends TextProps {
  variant?: TypographyVariant;
  tone?: Tone;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  /** Use the rounded system font (numbers in scores, prices). */
  rounded?: boolean;
  tabular?: boolean;
}

export function AppText({
  variant = 'body',
  tone = 'text',
  weight,
  align,
  rounded,
  tabular,
  style,
  maxFontSizeMultiplier = 1.6,
  ...rest
}: Props) {
  const colors = useTheme();
  const isHeading = variant === 'largeTitle' || variant === 'title1' || variant === 'title2' || variant === 'title3';
  return (
    <Text
      accessibilityRole={isHeading ? 'header' : undefined}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        Typography[variant],
        {
          color: colors[tone],
          fontFamily: rounded ? Fonts?.rounded : Fonts?.sans,
        },
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
      {...rest}
    />
  );
}
