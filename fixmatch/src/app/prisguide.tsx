import { router, useLocalSearchParams } from 'expo-router';
import { Fragment, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { TradeArt } from '@/components/trade-art';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, Divider } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { ScreenPadding, Spacing } from '@/constants/theme';
import { CATEGORIES, getCategory } from '@/data/categories';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { countryOf } from '@/lib/business-text';
import { formatPriceRange, speakablePrice } from '@/lib/format';
import { taxNote } from '@/lib/markets';
import { summarizeJobPrice } from '@/lib/prices';
import { useApp, useMarket } from '@/state/app-state';

/**
 * Prisguide: what the common jobs of a trade typically cost, with the same numbers as
 * "Hvad koster det typisk?" on Find and the list's "Typisk pris her". A job opens the trade's
 * list with that job chosen, so each business shows its own price for it.
 */
export default function PriceGuideScreen() {
  const { column } = useLayout();
  const colors = useTheme();
  const { fag } = useLocalSearchParams<{ fag?: string }>();
  const { state } = useApp();
  const { country, market } = useMarket();
  const [selected, setSelected] = useState(() => getCategory(fag ?? '')?.id ?? CATEGORIES[0].id);
  const category = getCategory(selected) ?? CATEGORIES[0];
  // Only this country's businesses in the trade: prices are never compared across currencies.
  const peers = useMemo(
    () => state.businesses.filter((b) => countryOf(b) === country && b.categories.includes(category.id)),
    [state.businesses, country, category.id],
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic">
      <View style={[styles.block, column]}>
        <AppText variant="body" tone="textSecondary">
          {t(
            'Typiske priser {tax} for almindelige opgaver. Vejledende – den endelige pris aftaler du med virksomheden.',
            { tax: taxNote(market) },
          )}
        </AppText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        accessibilityLabel={t('Vælg fag')}>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.name} selected={c.id === category.id} onPress={() => setSelected(c.id)} />
        ))}
      </ScrollView>

      <View style={[styles.block, column]}>
        <Card padded={false}>
          <View style={styles.tradeHead}>
            <TradeArt trade={category.id} size={44} tile />
            <AppText variant="title3" accessibilityRole="header" style={styles.flex}>
              {category.name}
            </AppText>
          </View>
          {category.jobs.map((job) => {
            const price = summarizeJobPrice(job, peers, market);
            const range = formatPriceRange(price.min, price.max, price.unit, price.currency);
            return (
              <Fragment key={job.id}>
                <Divider inset={Spacing.lg} />
                <Tappable
                  onPress={() => router.push({ pathname: '/kategori/[id]', params: { id: category.id, job: job.id } })}
                  accessibilityRole="link"
                  accessibilityLabel={t('{name}, typisk {priceRange}. Vis {plural}', {
                    name: job.name,
                    priceRange: speakablePrice(range),
                    plural: category.plural,
                  })}
                  style={styles.row}>
                  <AppText variant="body" style={styles.flex}>
                    {job.name}
                  </AppText>
                  {/* Two lines, so the unit ("pr. m²", "pr. stk.") is never the part that is cut. */}
                  <AppText
                    variant="headline"
                    display
                    weight="800"
                    numberOfLines={2}
                    maxFontSizeMultiplier={1.3}
                    style={styles.price}>
                    {range}
                  </AppText>
                  <Icon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" />
                </Tappable>
              </Fragment>
            );
          })}
        </Card>
        <Button
          title={t('Se {plural} nær dig', {
            plural: category.plural.startsWith('VVS') ? category.plural : category.plural.toLowerCase(),
          })}
          variant="tinted"
          trailingIcon="arrowRight"
          onPress={() => router.push({ pathname: '/kategori/[id]', params: { id: category.id } })}
          block
        />
      </View>

      <View style={[styles.block, column]}>
        <Card style={styles.quote}>
          <CardTitle title={t('Har du fået et tilbud?')} />
          <AppText variant="subhead" tone="textSecondary">
            {t('Tilbudstjek siger, om prisen er lav, normal eller høj.')}
          </AppText>
          <Button title={t('Tjek dit tilbud')} icon="receipt" onPress={() => router.push('/tilbudstjek')} block />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  block: { paddingHorizontal: ScreenPadding, gap: Spacing.md },
  chips: { gap: Spacing.sm, paddingHorizontal: ScreenPadding },
  tradeHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 56,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  price: { textAlign: 'right', flexShrink: 0, maxWidth: '50%' },
  quote: { gap: Spacing.md },
});
