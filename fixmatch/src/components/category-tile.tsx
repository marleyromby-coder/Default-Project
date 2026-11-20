import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { TradeArt } from '@/components/trade-art';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTradeColor } from '@/hooks/use-theme';
import { formatPrice, speakablePrice } from '@/lib/format';
import type { TradeFromPrice } from '@/lib/prices';
import type { Category } from '@/lib/types';
import { t } from '@/i18n';

function openTrade(category: Category) {
  router.push({ pathname: '/kategori/[id]', params: { id: category.id } });
}

function nearbyText(nearby: number) {
  return nearby === 1 ? t('1 i nærheden') : t('{nearby} i nærheden', { nearby });
}

interface TradeTileProps {
  category: Category;
  /**
   * The lowest hourly price nearby, from lowestHourlyByTrade (src/lib/prices.ts). Without it
   * the tile shows no price line.
   */
  fromPrice?: TradeFromPrice;
  /** How many businesses are nearby; read out by VoiceOver only. */
  nearby?: number;
  /** Defaults to opening the trade's results. */
  onPress?: () => void;
}

/**
 * A trade on Find, four to a row: a square in the trade's colour with its illustration, the
 * name below and "fra 560 kr." under that when a business nearby has a price. Give the parent
 * row `gap` and let each tile flex; the square follows the column width.
 */
export function TradeTile({ category, fromPrice, nearby, onPress }: TradeTileProps) {
  const trade = useTradeColor(category.id);
  const price = fromPrice ? formatPrice(fromPrice.price, fromPrice.currency) : undefined;
  const label = [
    category.plural,
    nearby === undefined ? undefined : nearbyText(nearby),
    price ? t('Timepris fra {price}', { price: speakablePrice(price) }) : undefined,
  ]
    .filter(Boolean)
    .join('. ');
  return (
    <Tappable
      onPress={onPress ?? (() => openTrade(category))}
      accessibilityLabel={label}
      accessibilityHint={category.description}
      pressedOpacity={0.75}
      style={styles.tradeTile}>
      <View style={[styles.square, { backgroundColor: trade.tile }]}>
        <TradeArt trade={category.id} size="100%" />
      </View>
      <AppText
        variant="subhead"
        display
        weight="700"
        align="center"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        maxFontSizeMultiplier={1.3}
        style={styles.name}>
        {category.name}
      </AppText>
      {price ? (
        // Up to two lines, with the amount and currency kept together, so a long line breaks as
        // "from" / "DKK 560" and the price itself is never the part that is cut.
        <AppText
          variant="footnote"
          tone="textSecondary"
          align="center"
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={1.3}>
          {t('fra {price}', { price: price.replace(/ /g, '\u00a0') })}
        </AppText>
      ) : null}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  tradeTile: { flex: 1, minWidth: 0, alignItems: 'stretch' },
  square: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  // 14 pt, so "Tagdækker" fits under a 77 pt tile (iPhone mini width) without shrinking.
  name: { marginTop: Spacing.sm, fontSize: 14, lineHeight: 18 },
});
