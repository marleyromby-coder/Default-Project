import { useMemo, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { currencyOf } from '@/lib/business-text';
import { formatDistance, formatNumber, formatPrice, formatRating, speakablePrice } from '@/lib/format';
import { select } from '@/lib/haptics';
import type { ScoredBusiness } from '@/lib/ranking';
import { reviewRatingLabel } from '@/lib/review-label';
import { sortTabWinners } from '@/lib/sort-tabs';
import type { SortMode } from '@/lib/types';
import { t } from '@/i18n';

import { PriceText } from './price-text';

interface Props {
  /** The list that is shown, after filters: the values come from it. */
  items: ScoredBusiness[];
  value: SortMode;
  onChange: (mode: SortMode) => void;
}

interface Tab {
  mode: SortMode;
  label: string;
  hint: string;
  /** What VoiceOver reads after the label; undefined when the tab has no value. */
  spoken?: string;
  shown?: ReactNode;
}

/**
 * The sort tabs at the top of the results, each with the value that wins it in the list shown:
 * Bedste match 82/100 · Billigste 560 kr./t · Nærmeste 2,6 km · Bedst anmeldt ★ 4,5 (19). The values
 * follow the same rules as the sort (sortTabWinners), and "Bedst anmeldt" shows no number when no
 * business in the list has reviews. A white card meant to overlap the panel above it.
 */
export function SortTabs({ items, value, onChange }: Props) {
  const colors = useTheme();
  const winners = useMemo(() => sortTabWinners(items), [items]);
  const { match, price, distance, rating } = winners;
  const small = { color: colors.textSecondary };
  // On iOS a value that does not fit shrinks just enough instead of being cut, e.g. at large text sizes on
  // 375 pt phones. iOS ignores minimumFontScale (its only floor is 4 pt); Android stops at 0.75.
  const fit = { numberOfLines: 1, adjustsFontSizeToFit: true, minimumFontScale: 0.75, maxFontSizeMultiplier: 1.2 };

  const tabs: Tab[] = [
    {
      mode: 'match',
      label: t('Bedste match'),
      hint: t('Sortér efter bedste match'),
      spoken: match ? t('{score} ud af 100', { score: match.score }) : undefined,
      shown: match ? (
        <AppText variant="headline" display weight="800" {...fit}>
          {match.score}
          <AppText variant="caption" display weight="700" style={small}>
            /100
          </AppText>
        </AppText>
      ) : undefined,
    },
    {
      mode: 'price',
      label: t('Billigste'),
      hint: t('Sortér efter laveste pris'),
      spoken: price
        ? t('fra {price} i timen', {
            price: speakablePrice(formatPrice(price.business.pricing.hourlyMin, currencyOf(price.business))),
          })
        : undefined,
      shown: price ? (
        <PriceText
          value={price.business.pricing.hourlyMin}
          currency={currencyOf(price.business)}
          variant="headline"
          unit={t('/t')}
        />
      ) : undefined,
    },
    {
      mode: 'distance',
      label: t('Nærmeste'),
      hint: t('Sortér efter korteste afstand'),
      spoken: distance ? formatDistance(distance.distanceKm) : undefined,
      shown: distance ? (
        <AppText variant="headline" display weight="800" {...fit}>
          {formatDistance(distance.distanceKm)}
        </AppText>
      ) : undefined,
    },
    {
      mode: 'rating',
      label: t('Bedst anmeldt'),
      hint: t('Sortér efter bedste anmeldelser'),
      spoken: reviewRatingLabel(rating?.business.reviewSummary),
      shown: rating?.business.reviewSummary ? (
        <View style={styles.rating}>
          <Icon name="star" size={14} color={colors.star} />
          <AppText variant="headline" display weight="800" style={styles.flexShrink} {...fit}>
            {formatRating(rating.business.reviewSummary.average)}
            <AppText variant="caption" display weight="700" style={small}>
              {` (${formatNumber(rating.business.reviewSummary.reviews)})`}
            </AppText>
          </AppText>
        </View>
      ) : undefined,
    },
  ];

  return (
    <Card elevation="raised" padded={false} style={styles.card}>
      <View accessibilityRole="tablist" accessibilityLabel={t('Sortering')} style={styles.row}>
        {tabs.map((tab) => {
          const selected = tab.mode === value;
          return (
            <Tappable
              key={tab.mode}
              onPress={() => {
                if (selected) return;
                select();
                onChange(tab.mode);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              aria-selected={Platform.OS === 'web' ? selected : undefined}
              accessibilityLabel={tab.spoken ? `${tab.label}: ${tab.spoken}` : tab.label}
              accessibilityHint={tab.hint}
              pressedOpacity={0.7}
              style={[styles.tab, selected ? { backgroundColor: colors.brandSoft } : null]}>
              <AppText
                variant="label"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                maxFontSizeMultiplier={1.2}
                style={{ color: selected ? colors.brandText : colors.textSecondary }}>
                {tab.label}
              </AppText>
              {tab.shown ?? (
                <AppText variant="headline" display weight="800" tone="textTertiary" maxFontSizeMultiplier={1.2}>
                  –
                </AppText>
              )}
              {selected ? <View style={[styles.underline, { backgroundColor: colors.brand }]} /> : null}
            </Tappable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.card, padding: Spacing.xs },
  row: { flexDirection: 'row', gap: 2 },
  // Each tab takes its own width plus an equal share of the rest, so long labels get the room.
  tab: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    minHeight: 58,
    paddingHorizontal: Spacing.sm - 2,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm + 2,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    gap: 2,
    overflow: 'hidden',
  },
  underline: { position: 'absolute', left: Spacing.sm, right: Spacing.sm, bottom: 0, height: 3, borderRadius: 2 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  flexShrink: { flexShrink: 1 },
});
