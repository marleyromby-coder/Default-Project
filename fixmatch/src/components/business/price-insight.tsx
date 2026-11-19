import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice, formatPriceRange } from '@/lib/format';
import type { Currency } from '@/lib/markets';
import { priceGroupText, priceLevelLabel, type PriceInsight as Insight } from '@/lib/price-insight';
import { PRICE_LEVEL_BAND } from '@/lib/ranking';
import type { Business } from '@/lib/types';
import { t } from '@/i18n';

const TRACK = 10;
/** A range narrower than this still shows as a short pill. */
const MIN_SEGMENT = 16;
/** Width of the "middel" label under the band. */
const MIDDLE_LABEL = 80;

/**
 * "Prisniveau" on the business page: the level in neutral words, what it is compared with, and a
 * bar from the lowest to the highest hourly rate in that group. The business's range sits on the
 * bar with its price above it, and the "middel" band shows the rule (src/lib/price-insight.ts).
 * With too few businesses to compare with, only the sentence that says so is shown.
 */
export function PriceInsightView({
  business,
  insight,
  tradePlural,
  country,
  currency,
}: {
  business: Business;
  insight: Insight;
  tradePlural: string;
  /** The country's name, already translated. */
  country: string;
  currency: Currency;
}) {
  const colors = useTheme();
  const [width, setWidth] = useState(0);
  const [bubble, setBubble] = useState(0);
  const group = priceGroupText(insight, tradePlural, country);
  const own = formatPriceRange(business.pricing.hourlyMin, business.pricing.hourlyMax, 'opgave', currency);

  const segmentWidth = Math.max(MIN_SEGMENT, (insight.to - insight.from) * width);
  const segmentLeft = Math.min(Math.max(0, insight.point * width - segmentWidth / 2), width - segmentWidth);
  const bubbleLeft = Math.min(Math.max(0, insight.point * width - bubble / 2), width - bubble);
  const pointer = Math.min(Math.max(10, insight.point * width - bubbleLeft), bubble - 10);
  const middle = insight.middle;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <AppText variant="headline" display style={styles.flex} accessibilityRole="header">
          {t('Prisniveau')}
        </AppText>
        {insight.level !== null ? (
          <Badge
            label={priceLevelLabel(insight.level)}
            tone={insight.level === 1 ? 'brand' : 'neutral'}
            icon={insight.level === 1 ? 'chevronDown' : insight.level === 3 ? 'chevronUp' : undefined}
          />
        ) : null}
      </View>
      <AppText variant="footnote" tone="textSecondary">
        {group}
      </AppText>

      {insight.level !== null ? (
        <View
          style={styles.chart}
          accessible
          accessibilityLabel={t('{level}. Timepris {price}. Laveste i gruppen {low}, højeste {high}.', {
            level: priceLevelLabel(insight.level),
            price: own,
            low: formatPrice(insight.low, currency),
            high: formatPrice(insight.high, currency),
          })}>
          <View style={styles.bubbleRow}>
            <View
              onLayout={(event) => setBubble(event.nativeEvent.layout.width)}
              style={[
                styles.bubble,
                { backgroundColor: colors.text, left: bubbleLeft, opacity: width > 0 && bubble > 0 ? 1 : 0 },
              ]}>
              <AppText
                variant="footnote"
                display
                weight="700"
                numberOfLines={1}
                maxFontSizeMultiplier={1.3}
                style={{ color: colors.surface }}>
                {own}
              </AppText>
              <View style={[styles.pointer, { left: pointer - 5, borderTopColor: colors.text }]} />
            </View>
          </View>
          <View
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
            style={[styles.track, { backgroundColor: colors.fill }]}>
            {middle ? (
              <View
                style={[
                  styles.band,
                  {
                    left: `${middle.from * 100}%`,
                    width: `${Math.max(0, middle.to - middle.from) * 100}%`,
                    backgroundColor: colors.textTertiary,
                  },
                ]}
              />
            ) : null}
            {width > 0 ? (
              <View
                style={[
                  styles.segment,
                  {
                    left: segmentLeft,
                    width: segmentWidth,
                    backgroundColor: colors.brand,
                    borderColor: colors.surface,
                  },
                ]}>
                {/* The middle of the range: the value the level is based on. */}
                <View style={[styles.mid, { backgroundColor: colors.surface }]} />
              </View>
            ) : null}
          </View>
          {middle ? (
            <View style={styles.bracketRow}>
              <View
                style={[
                  styles.bracket,
                  {
                    left: `${middle.from * 100}%`,
                    width: `${Math.max(0, middle.to - middle.from) * 100}%`,
                    borderColor: colors.textTertiary,
                  },
                ]}
              />
              {/* "middel" under the band, kept inside the bar so it never runs off the card. */}
              <AppText
                variant="footnote"
                tone="textSecondary"
                numberOfLines={1}
                style={[
                  styles.middleLabel,
                  { left: Math.min(Math.max(0, middle.at * width - MIDDLE_LABEL / 2), width - MIDDLE_LABEL) },
                ]}>
                {t('middel')}
              </AppText>
            </View>
          ) : null}
          <View style={styles.ends}>
            <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
              <AppText variant="footnote" weight="700">
                {formatPrice(insight.low, currency)}
              </AppText>{' '}
              {t('lav')}
            </AppText>
            <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
              {t('høj')}{' '}
              <AppText variant="footnote" weight="700">
                {formatPrice(insight.high, currency)}
              </AppText>
            </AppText>
          </View>
          <AppText variant="caption" tone="textSecondary">
            {t('Ud fra midten af timeprisen. Middel er inden for {band} % af den typiske timepris i gruppen.', {
              band: Math.round(PRICE_LEVEL_BAND * 100),
            })}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { gap: Spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chart: { gap: Spacing.xs + 2, marginTop: Spacing.sm },
  bubbleRow: { height: 34 },
  bubble: {
    position: 'absolute',
    top: 0,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderCurve: 'continuous',
  },
  pointer: {
    position: 'absolute',
    bottom: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  track: { height: TRACK, borderRadius: Radius.pill, marginTop: 2 },
  band: { position: 'absolute', top: 0, bottom: 0, opacity: 0.25 },
  segment: {
    position: 'absolute',
    top: -3,
    height: TRACK + 6,
    borderRadius: Radius.pill,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mid: { width: 5, height: 5, borderRadius: 3 },
  bracketRow: { height: 28, marginTop: 2 },
  bracket: {
    position: 'absolute',
    top: 0,
    height: 7,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  middleLabel: { position: 'absolute', top: 9, width: MIDDLE_LABEL, textAlign: 'center' },
});
