import { Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts, SerifFonts, type ColorName, Typography, type TypographyVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type Tone = Extract<
  ColorName,
  'text' | 'textSecondary' | 'textTertiary' | 'brandText' | 'success' | 'danger' | 'warning' | 'info' | 'onBrand'
>;

const TITLES: readonly TypographyVariant[] = ['largeTitle', 'title1', 'title2', 'title3'];
const BOLD: readonly TextStyle['fontWeight'][] = ['700', '800', '900', 'bold'];

interface Props extends TextProps {
  variant?: TypographyVariant;
  tone?: Tone;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  /** Use the rounded system font (numbers in scores, prices). */
  rounded?: boolean;
  /** Set in Fraunces, the serif of the logo. On by default for the title variants. */
  serif?: boolean;
  tabular?: boolean;
}

export function AppText({
  variant = 'body',
  tone = 'text',
  weight,
  align,
  rounded,
  serif,
  tabular,
  style,
  maxFontSizeMultiplier = 1.6,
  ...rest
}: Props) {
  const colors = useTheme();
  const isHeading = TITLES.includes(variant);
  const isSerif = !rounded && (serif ?? isHeading);
  // Fraunces ships one family per weight, so the weight picks the family and the text
  // itself stays at a normal weight (otherwise iOS and browsers fake a bold).
  const serifFamily = BOLD.includes(weight) ? SerifFonts.bold : SerifFonts.regular;
  const fontFamily = isSerif ? serifFamily : rounded ? Fonts?.rounded : Fonts?.sans;
  return (
    <Text
      accessibilityRole={isHeading ? 'header' : undefined}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        Typography[variant],
        { color: colors[tone], fontFamily },
        isSerif ? { fontWeight: 'normal' } : weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
      {...rest}
    />
  );
}
