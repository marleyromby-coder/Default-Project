import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessCard } from '@/components/business/business-card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { CATEGORIES, getCategory, isCategoryId } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { countryOf } from '@/lib/business-text';
import { DATA_MODE } from '@/lib/data-source';
import { currencySymbol, formatNumber, formatPrice, formatPriceRange } from '@/lib/format';
import { taxNote } from '@/lib/markets';
import { defaultQuantity } from '@/lib/matcher';
import {
  cheaperOptions,
  checkQuote,
  GREEN_DEDUCTION_MAX,
  GREEN_JOBS,
  greenDeduction,
  NEARBY_KM,
  quoteFactor,
  type QuoteVerdict,
} from '@/lib/quote-check';
import { scoreBusinesses } from '@/lib/ranking';
import type { CategoryId } from '@/lib/types';
import { useApp, useMarket } from '@/state/app-state';
import { loadSharedPrices, useSharedPrices } from '@/state/community';
import { msg, t } from '@/i18n';

/** "12.500 kr." typed in any way → 12500. Empty or zero → undefined. */
function amount(text: string): number | undefined {
  const value = Number(text.replace(/\D/g, ''));
  return value > 0 ? value : undefined;
}

const VERDICT: Record<
  QuoteVerdict,
  { title: string; icon: IconName; tone: 'info' | 'success' | 'warning' | 'danger' }
> = {
  low: { title: msg('Lav pris'), icon: 'info', tone: 'info' },
  normal: { title: msg('Normal pris'), icon: 'check', tone: 'success' },
  high: { title: msg('Lidt højt'), icon: 'info', tone: 'warning' },
  veryHigh: { title: msg('Højt'), icon: 'flag', tone: 'danger' },
};

/**
 * Tilbudstjek: the user types in a quote they already have, also one from another site, and
 * sees whether it is low, normal or high for the job, what the green deduction gives back,
 * and which businesses list the job for less. Everything stays on the phone.
 */
export default function QuoteCheckScreen() {
  const { column } = useLayout();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const { country, market } = useMarket();
  const params = useLocalSearchParams<{ kategori?: string; opgave?: string }>();
  const [categoryId, setCategoryId] = useState<CategoryId | undefined>(
    params.kategori && isCategoryId(params.kategori) ? params.kategori : undefined,
  );
  const [jobId, setJobId] = useState<string | undefined>(params.opgave);
  const [quantityText, setQuantityText] = useState('');
  const [priceText, setPriceText] = useState('');
  const [labourText, setLabourText] = useState('');
  const [greenValue, setGreenValue] = useState<boolean>();
  const shared = useSharedPrices();
  useEffect(() => {
    loadSharedPrices(market.country).catch(() => undefined);
  }, [market.country]);

  const category = categoryId ? getCategory(categoryId) : undefined;
  const job = category?.jobs.find((j) => j.id === jobId);
  const quantity = job && job.unit !== 'opgave' ? (amount(quantityText) ?? defaultQuantity(job)) : 1;
  const price = amount(priceText);
  const labour = amount(labourText);
  const green = greenValue ?? (job ? GREEN_JOBS.includes(job.id) : false);
  const symbol = currencySymbol(market.currency);

  // Cheap enough to run on every render; the React Compiler memoises it.
  const result =
    job && category && price
      ? checkQuote({
          price,
          job,
          category: category.id,
          quantity,
          businesses: state.businesses,
          market,
          origin: state.location.coords,
          paid: shared.filter((r) => r.country === market.country),
        })
      : undefined;

  const scored = category
    ? scoreBusinesses(
        state.businesses.filter((b) => countryOf(b) === country && b.categories.includes(category.id)),
        state.location.coords,
        state.priorities,
      )
    : [];
  const cheaper = result && job && price ? cheaperOptions(price, job, quantity, scored) : [];

  const pickCategory = (id: CategoryId) => {
    setCategoryId(id);
    setJobId(undefined);
    setQuantityText('');
    setGreenValue(undefined);
  };

  const verdict = result ? VERDICT[result.verdict] : undefined;
  const verdictText = !result
    ? ''
    : result.verdict === 'low'
      ? t(
          'Tilbuddet er {percent} % under det, virksomhederne i FixMatch normalt tager. Tjek, at materialer, moms og bortskaffelse er med.',
          { percent: result.percent },
        )
      : result.verdict === 'normal'
        ? t('Tilbuddet ligger inden for det, virksomhederne i FixMatch normalt tager for opgaven.')
        : result.verdict === 'high'
          ? t('Tilbuddet er {percent} % over det normale. Spørg, hvad der er med i prisen.', {
              percent: result.percent,
            })
          : t('Tilbuddet er {percent} % over det normale. Det kan betale sig at få et tilbud mere.', {
              percent: result.percent,
            });
  const sourceText = !result
    ? ''
    : result.source === 'paid'
      ? t('Bygger på {count} priser, som kunder har betalt.', { count: result.count })
      : result.count === 0
        ? t('Ingen virksomheder har oplyst en pris for opgaven endnu, så det er FixMatch’ eget skøn.')
        : result.scope === 'nearby'
          ? t('Bygger på {count} priser fra virksomheder inden for {km} km.', { count: result.count, km: NEARBY_KM })
          : t('Bygger på {count} priser fra virksomheder i hele {country}.', {
              count: result.count,
              country: t(market.name),
            });
  const deduction = labour ? greenDeduction(labour) : undefined;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <AppText variant="callout" tone="textSecondary">
          {t(
            'Har du fået et tilbud? Tast det ind, så ser du, om prisen er lav, normal eller høj i forhold til virksomhederne i FixMatch – også hvis tilbuddet kommer et andet sted fra.',
          )}
        </AppText>

        <View style={styles.block}>
          <AppText variant="subhead" weight="600" tone="textSecondary" accessibilityRole="header">
            {t('Fag')}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                icon={c.id}
                selected={c.id === category?.id}
                onPress={() => pickCategory(c.id)}
              />
            ))}
          </ScrollView>
        </View>

        {category ? (
          <View style={styles.block}>
            <AppText variant="subhead" weight="600" tone="textSecondary" accessibilityRole="header">
              {t('Opgave')}
            </AppText>
            <View style={styles.wrap}>
              {category.jobs.map((j) => (
                <Chip
                  key={j.id}
                  label={j.name}
                  selected={j.id === job?.id}
                  onPress={() => {
                    setJobId(j.id);
                    setQuantityText('');
                    setGreenValue(undefined);
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}

        {job ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {job.unit !== 'opgave' ? (
              <AmountField
                label={job.unit === 'm2' ? t('Antal m²') : t('Antal stk.')}
                value={quantityText}
                placeholder={String(defaultQuantity(job))}
                onChange={setQuantityText}
                suffix={job.unit === 'm2' ? 'm²' : t('stk.')}
              />
            ) : null}
            <AmountField
              label={t('Pris i tilbuddet, {tax}', { tax: taxNote(market) })}
              value={priceText}
              placeholder={formatNumber(Math.round(job.max * market.fromDkk * quoteFactor(job, quantity)))}
              onChange={setPriceText}
              suffix={symbol}
              large
            />
          </View>
        ) : null}

        {result && verdict ? (
          <View
            accessible
            accessibilityLiveRegion="polite"
            accessibilityLabel={`${t(verdict.title)}. ${verdictText} ${t('Normalt: {range}', {
              range: formatPrice(result.min, market.currency) + '–' + formatPrice(result.max, market.currency),
            })}`}
            style={[
              styles.result,
              { backgroundColor: colors[`${verdict.tone}Soft`], borderColor: colors[verdict.tone] },
            ]}>
            <View style={styles.row}>
              <Icon name={verdict.icon} size={20} color={colors[verdict.tone]} weight="bold" />
              <AppText variant="title3" style={{ color: colors[verdict.tone] }}>
                {t(verdict.title)}
              </AppText>
            </View>
            <AppText variant="subhead">{verdictText}</AppText>
            <PriceScale min={result.min} max={result.max} price={price ?? 0} tone={colors[verdict.tone]} />
            <AppText variant="footnote" tone="textSecondary">
              {t('Normalt: {range}', {
                range: formatPriceRange(result.min, result.max, 'opgave', market.currency),
              })}
              {' · '}
              {sourceText}
            </AppText>
          </View>
        ) : null}

        {job ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <AppText variant="headline">{t('Grøn energiforbedring')}</AppText>
                <AppText variant="footnote" tone="textSecondary">
                  {t('Fx isolering, vinduer, varmepumpe eller solceller. Så kan du få håndværkerfradrag.')}
                </AppText>
              </View>
              <Switch
                value={green}
                onValueChange={setGreenValue}
                trackColor={{ true: colors.brandStrong }}
                accessibilityLabel={t('Grøn energiforbedring')}
              />
            </View>
            {green ? (
              <>
                <AmountField
                  label={t('Heraf arbejdsløn')}
                  value={labourText}
                  placeholder={t('Står på tilbuddet')}
                  onChange={setLabourText}
                  suffix={symbol}
                />
                <AppText variant="subhead" accessibilityLiveRegion="polite">
                  {deduction
                    ? t('Du kan trække {deduction} fra og få ca. {saving} tilbage i skat.', {
                        deduction: formatPrice(deduction.deduction, market.currency),
                        saving: formatPrice(deduction.saving, market.currency),
                      })
                    : t('Skriv arbejdslønnen, så regner vi fradraget ud. Kun arbejdsløn tæller, ikke materialer.')}
                </AppText>
                <AppText variant="footnote" tone="textSecondary">
                  {t('Grænsen er {max} pr. voksen i husstanden i 2026. Tjek på skat.dk, om netop din opgave er med.', {
                    max: formatPrice(GREEN_DEDUCTION_MAX, market.currency),
                  })}
                </AppText>
              </>
            ) : null}
          </View>
        ) : null}

        {job ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="headline" accessibilityRole="header">
              {t('Tjek også tilbuddet for')}
            </AppText>
            {[
              t('CVR-nummer og firmanavn.'),
              t('Fast pris. Står der overslag, kan det blive dyrere.'),
              t('Arbejdsløn og materialer hver for sig. Det kræver fradraget.'),
              ...(category?.authorization ? [t('Autorisation. Den slår du op hos Sikkerhedsstyrelsen.')] : []),
              t('Garantiordning, fx Byg Garanti.'),
            ].map((line) => (
              <View key={line} style={styles.checkRow}>
                <Icon name="check" size={14} color={colors.brand} weight="bold" />
                <AppText variant="subhead" style={styles.flex}>
                  {line}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        {job && cheaper.length > 0 ? (
          <View style={styles.block}>
            <AppText variant="title3" accessibilityRole="header">
              {t('Tager mindre for opgaven')}
            </AppText>
            <AppText variant="footnote" tone="textSecondary">
              {t('Virksomheder i nærheden, hvis egen pris starter under dit tilbud. Verificerede står først.')}
            </AppText>
            {cheaper.map((item) => {
              const example = item.business.pricing.examples.find((e) => e.job === job.id);
              const factor = quoteFactor(job, quantity);
              return (
                <BusinessCard
                  key={item.business.id}
                  item={item}
                  job={job}
                  priceOverride={
                    example
                      ? `${job.name}: ${formatPriceRange(example.min * factor, example.max * factor, 'opgave', market.currency)}`
                      : undefined
                  }
                />
              );
            })}
          </View>
        ) : null}

        <View style={styles.privacy}>
          <Icon name="privacy" size={15} color={colors.textSecondary} />
          <AppText variant="caption" tone="textSecondary" style={styles.flex}>
            {DATA_MODE === 'demo'
              ? t(
                  'Vurderingen er vejledende og bygger på eksempelvirksomhedernes priser i demoen. Det, du skriver, bliver på din telefon.',
                )
              : t(
                  'Vurderingen er vejledende og bygger på de priser, virksomhederne selv har oplyst i FixMatch. Det, du skriver, bliver på din telefon.',
                )}
          </AppText>
        </View>
        <Button
          title={t('Om priserne og fradraget')}
          variant="plain"
          size="small"
          onPress={() => router.push({ pathname: '/info/[slug]', params: { slug: 'priser' } })}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AmountField({
  label,
  value,
  placeholder,
  onChange,
  suffix,
  large,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  suffix: string;
  large?: boolean;
}) {
  const colors = useTheme();
  return (
    <View style={styles.amountBlock}>
      <AppText variant="subhead" weight="600" tone="textSecondary">
        {label}
      </AppText>
      <View style={[styles.amountField, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.replace(/[^\d.\s]/g, '').slice(0, 9))}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
          accessibilityLabel={label}
          style={[styles.amountInput, large && styles.amountLarge, { color: colors.text }]}
        />
        <AppText variant="body" tone="textSecondary">
          {suffix}
        </AppText>
      </View>
    </View>
  );
}

/** The usual range as a band, with the quote as a dot on the same scale. */
function PriceScale({ min, max, price, tone }: { min: number; max: number; price: number; tone: string }) {
  const colors = useTheme();
  const lo = Math.min(min, price) * 0.85;
  const hi = Math.max(max, price) * 1.1;
  const at = (value: number) => `${Math.round(((value - lo) / (hi - lo)) * 1000) / 10}%` as const;
  return (
    <View style={styles.scale} importantForAccessibility="no-hide-descendants">
      <View style={[styles.track, { backgroundColor: colors.border }]} />
      <View style={[styles.band, { left: at(min), width: at(lo + max - min), backgroundColor: colors.success }]} />
      <View style={[styles.dot, { left: at(price), backgroundColor: tone, borderColor: colors.surface }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg },
  block: { gap: Spacing.sm },
  chips: { gap: Spacing.sm, paddingRight: Spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  result: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  amountBlock: { gap: Spacing.xs },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    paddingVertical: Spacing.sm,
    outlineStyle: 'none',
  } as never,
  amountLarge: { fontSize: 22, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  scale: { height: 22, justifyContent: 'center', marginVertical: Spacing.xs },
  track: { position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3 },
  band: { position: 'absolute', height: 6, borderRadius: 3, opacity: 0.55 },
  dot: { position: 'absolute', width: 18, height: 18, marginLeft: -9, borderRadius: 9, borderWidth: 3 },
  privacy: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xs },
});
