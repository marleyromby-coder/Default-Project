import type { StyleProp, TextStyle } from 'react-native';

import { AppText, type Tone } from '@/components/ui/text';
import { Typography, type TypographyVariant } from '@/constants/theme';
import { formatNumber, formatPrice } from '@/lib/format';
import type { Currency } from '@/lib/markets';

interface Props {
  value: number;
  currency: Currency;
  /** The size of the number. The currency and `unit` are set smaller beside it. */
  variant?: TypographyVariant;
  /** Text after the price, in the small size, e.g. "/t". */
  unit?: string;
  tone?: Tone;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
}

/**
 * A price in Schibsted Grotesk with the number large and the currency small, like "560 kr." on a
 * result card or a sort tab. Works for prefixes too ("£60"). One line; shrinks to fit on iOS.
 */
export function PriceText({ value, currency, variant = 'price', unit = '', tone = 'text', align, style }: Props) {
  const full = formatPrice(value, currency);
  const number = formatNumber(value);
  const at = full.indexOf(number);
  const prefix = at > 0 ? full.slice(0, at) : '';
  const suffix = `${at >= 0 ? full.slice(at + number.length) : ''}${unit}`;
  const small = Math.round(Typography[variant].fontSize * 0.56);
  const affix = { fontSize: Math.max(12, small), lineHeight: Typography[variant].lineHeight };
  return (
    <AppText
      variant={variant}
      display
      weight="800"
      tone={tone}
      align={align}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.6}
      maxFontSizeMultiplier={1.2}
      style={style}>
      {prefix ? (
        <AppText variant={variant} display weight="700" tone={tone} style={affix}>
          {prefix}
        </AppText>
      ) : null}
      {at >= 0 ? number : full}
      {suffix ? (
        <AppText variant={variant} display weight="700" tone={tone} style={affix}>
          {suffix}
        </AppText>
      ) : null}
    </AppText>
  );
}
