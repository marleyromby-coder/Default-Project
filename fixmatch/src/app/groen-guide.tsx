import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { Segmented } from '@/components/ui/segmented';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { openLink } from '@/lib/contact';
import { formatPrice, formatPriceRange } from '@/lib/format';
import { GREEN_MEASURES, greenBenefit, greenTaxBackCap } from '@/lib/green';
import { GREEN_DEDUCTION_MAX } from '@/lib/quote-check';
import { useMarket } from '@/state/app-state';
import { t } from '@/i18n';

/**
 * "Grøn guide": the green improvements that pay, what the tax deduction and subsidies give,
 * and the saving on the bills. Each one links to the tradespeople who do it.
 */
export default function GreenGuideScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { market } = useMarket();
  const [adults, setAdults] = useState<'1' | '2'>('1');
  const [open, setOpen] = useState<string>();
  const currency = market.currency;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: t('Grøn guide') }} />
      <AppText variant="callout" tone="textSecondary">
        {t('Du kan trække op til {max} i arbejdsløn fra pr. voksen om året. Det giver cirka {back} tilbage i skat.', {
          max: formatPrice(GREEN_DEDUCTION_MAX, currency),
          back: formatPrice(greenTaxBackCap(), currency),
        })}
      </AppText>
      <Segmented
        options={[
          { value: '1', label: t('1 voksen i husstanden') },
          { value: '2', label: t('2 voksne') },
        ]}
        value={adults}
        onChange={setAdults}
        accessibilityLabel={t('Voksne i husstanden')}
      />

      {GREEN_MEASURES.map((measure) => {
        const benefit = greenBenefit(measure, Number(adults));
        const category = getCategory(measure.category);
        const expanded = open === measure.id;
        // One quiet line instead of three badges: the saving, the tax back, and whether there is a subsidy.
        // The tax back is left out when it is just the yearly cap (the intro says it), so the line
        // only names it when it tells this measure apart. It stays in the expanded row.
        const facts = [
          measure.savingMax > 0
            ? t('Sparer {range} om året', {
                range: formatPriceRange(measure.savingMin, measure.savingMax, 'opgave', currency),
              })
            : undefined,
          benefit.taxBack > 0 && benefit.taxBack < greenTaxBackCap(Number(adults))
            ? t('{amount} tilbage i skat', { amount: formatPrice(benefit.taxBack, currency) })
            : undefined,
          measure.subsidy ? t('Tilskud') : undefined,
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <Card key={measure.id}>
            <Tappable
              onPress={() => setOpen(expanded ? undefined : measure.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={[t(measure.title), facts].filter(Boolean).join(', ')}
              pressedOpacity={0.7}
              style={styles.head}>
              <View style={styles.headText}>
                <AppText variant="headline">{t(measure.title)}</AppText>
                {facts ? (
                  <AppText variant="footnote" tone="textSecondary" tabular>
                    {facts}
                  </AppText>
                ) : null}
              </View>
              <Icon
                name={expanded ? 'chevronUp' : 'chevronDown'}
                size={14}
                color={colors.textTertiary}
                weight="semibold"
              />
            </Tappable>
            {expanded ? (
              <View style={styles.body}>
                <AppText variant="subhead">{t(measure.summary)}</AppText>
                <Row
                  label={t('Typisk pris')}
                  value={formatPriceRange(measure.priceMin, measure.priceMax, 'opgave', currency)}
                />
                <Row label={t('Heraf arbejdsløn, cirka')} value={formatPrice(benefit.labour, currency)} />
                {benefit.taxBack > 0 ? (
                  <Row label={t('Håndværkerfradrag giver')} value={formatPrice(benefit.taxBack, currency)} />
                ) : null}
                {benefit.paybackYears !== undefined ? (
                  <Row
                    label={t('Tjent hjem efter')}
                    value={t('ca. {years} år', { years: String(benefit.paybackYears).replace('.', ',') })}
                  />
                ) : null}
                {measure.subsidy ? <Notice text={t(measure.subsidy)} /> : null}
                <View style={styles.actions}>
                  {category ? (
                    <Button
                      title={t('Find {plural}', { plural: category.plural.toLowerCase() })}
                      icon={category.id}
                      size="small"
                      onPress={() =>
                        router.push({
                          pathname: '/kategori/[id]',
                          params: { id: category.id, ...(measure.job ? { job: measure.job } : {}) },
                        })
                      }
                    />
                  ) : null}
                  <Button
                    title={t('Tjek et tilbud')}
                    icon="receipt"
                    variant="secondary"
                    size="small"
                    onPress={() =>
                      router.push({
                        pathname: '/tilbudstjek',
                        params: { kategori: measure.category, ...(measure.job ? { opgave: measure.job } : {}) },
                      })
                    }
                  />
                </View>
              </View>
            ) : null}
          </Card>
        );
      })}

      <View style={[styles.note, { backgroundColor: colors.surface }]}>
        <AppText variant="footnote" tone="textSecondary">
          {t(
            'Priser og besparelser er typiske tal for et dansk parcelhus i 2026 og vejledende. Fradragets regler og puljerne ændrer sig hvert år. Tjek altid skat.dk og sparenergi.dk, og aftal tilskud, før arbejdet går i gang.',
          )}
        </AppText>
        <View style={styles.actions}>
          <Button
            title={t('Fradraget på skat.dk')}
            variant="plain"
            size="small"
            onPress={() => openLink('https://skat.dk')}
          />
          <Button
            title={t('Tilskud på sparenergi.dk')}
            variant="plain"
            size="small"
            onPress={() => openLink('https://sparenergi.dk')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="subhead" tone="textSecondary" style={styles.flex}>
        {label}
      </AppText>
      <AppText variant="subhead" weight="600" tabular>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headText: { flex: 1, gap: Spacing.xxs },
  body: { gap: Spacing.sm, marginTop: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  note: { borderRadius: Radius.lg, borderCurve: 'continuous', padding: Spacing.md, gap: Spacing.sm },
});
