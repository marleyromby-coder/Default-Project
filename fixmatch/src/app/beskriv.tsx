import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { MinTouchSize, Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { CATEGORIES, getCategory } from '@/data/categories';
import { useBudgetMatch } from '@/hooks/use-budget-match';
import { useTheme } from '@/hooks/use-theme';
import { currencySymbol, formatNumber, formatPrice, formatPriceRange, pluralize } from '@/lib/format';
import { analyzeProblem, defaultQuantity, PROBLEM_EXAMPLES } from '@/lib/matcher';
import { summarizeJobPrice } from '@/lib/prices';
import type { CategoryId } from '@/lib/types';
import { t } from '@/i18n';
import { countryOf } from '@/lib/business-text';
import { taxNote } from '@/lib/markets';
import { useApp, useMarket } from '@/state/app-state';

/** Budget suggestions in DKK; scaled to the local currency with Market.fromDkk. */
const BUDGET_PRESETS_DKK = [1000, 2500, 5000, 10000, 25000];
const MAX_TEXT = 500;

/** Rounds a price to a friendly budget step: 1.250 → 1.300, 12.400 → 12.500. */
function niceBudget(value: number): number {
  const step = value >= 10000 ? 500 : value >= 2000 ? 250 : value >= 500 ? 50 : value >= 100 ? 10 : 5;
  return Math.ceil(value / step) * step;
}

export default function DescribeProblemScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const { country, market } = useMarket();
  const params = useLocalSearchParams<{ tekst?: string }>();
  const [text, setText] = useState(params.tekst ?? '');
  const [pickedCategory, setPickedCategory] = useState<CategoryId>();
  const [pickedJob, setPickedJob] = useState<string | null>();
  const [budgetText, setBudgetText] = useState<string>();
  const [quantityValue, setQuantityValue] = useState<number>();
  const [urgentValue, setUrgentValue] = useState<boolean>();

  const analysis = useMemo(() => analyzeProblem(text), [text]);
  const category = pickedCategory ? getCategory(pickedCategory) : analysis.category;
  // `null` means the user chose "Ved ikke" for the job.
  const job =
    pickedJob === null
      ? undefined
      : pickedJob
        ? category?.jobs.find((j) => j.id === pickedJob)
        : category?.id === analysis.category?.id
          ? analysis.job
          : undefined;
  const quantity =
    job && job.unit !== 'opgave' ? (quantityValue ?? analysis.quantity ?? defaultQuantity(job)) : undefined;
  const budgetDigits = budgetText ?? (analysis.budget ? String(analysis.budget) : '');
  const budget = budgetDigits ? Number(budgetDigits) : undefined;
  const urgent = urgentValue ?? analysis.urgent;

  const typical = useMemo(
    () =>
      job && category
        ? summarizeJobPrice(
            job,
            state.businesses.filter((b) => countryOf(b) === country && b.categories.includes(category.id)),
            market,
          )
        : undefined,
    [job, category, state.businesses, country, market],
  );
  const factor = job && job.unit !== 'opgave' ? (quantity ?? 1) : 1;
  const presets = typical
    ? [
        ...new Set(
          [typical.min * factor, ((typical.min + typical.max) / 2) * factor, typical.max * factor].map(niceBudget),
        ),
      ]
    : BUDGET_PRESETS_DKK.map((value) => niceBudget(value * market.fromDkk));

  const { items } = useBudgetMatch(category ? { category: category.id, job, quantity, budget, urgent } : undefined);
  const fitting = items.filter((m) => m.fit === 'within' || m.fit === 'maybe' || m.fit === 'close').length;

  const pickCategory = (id: CategoryId) => {
    setPickedCategory(id);
    setPickedJob(undefined);
    setQuantityValue(undefined);
  };

  const submit = () => {
    if (!category) return;
    router.push({
      pathname: '/match',
      params: {
        kategori: category.id,
        ...(job ? { job: job.id } : {}),
        ...(budget ? { budget: String(budget) } : {}),
        ...(quantity ? { antal: String(quantity) } : {}),
        ...(urgent ? { akut: '1' } : {}),
        ...(text.trim() ? { tekst: text.trim() } : {}),
      },
    });
  };

  const otherCategories = [
    ...analysis.alternatives.filter((c) => c.id !== category?.id),
    ...CATEGORIES.filter((c) => c.id !== category?.id && !analysis.alternatives.includes(c)),
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}>
        <View style={styles.intro}>
          <AppText variant="callout" tone="textSecondary">
            {t(
              'Skriv med dine egne ord, hvad der er galt, og hvad du vil give. Så finder vi dem, der passer – også dem, der ligger tæt på dit budget.',
            )}
          </AppText>
        </View>

        <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            value={text}
            onChangeText={(value) => setText(value.slice(0, MAX_TEXT))}
            placeholder={t('Fx: Køkkenvasken er stoppet, og vandet løber ikke ud')}
            placeholderTextColor={colors.textTertiary}
            multiline
            autoFocus={!params.tekst}
            textAlignVertical="top"
            accessibilityLabel={t('Beskriv dit problem')}
            style={[styles.textArea, { color: colors.text }]}
          />
          <AppText variant="caption" tone="textTertiary" style={styles.counter}>
            {text.length}/{MAX_TEXT}
          </AppText>
        </View>

        {text.trim().length === 0 ? (
          <View style={styles.block}>
            <AppText variant="subhead" tone="textSecondary" weight="600" accessibilityRole="header">
              {t('Prøv fx')}
            </AppText>
            <View style={styles.examples}>
              {PROBLEM_EXAMPLES.map((example) => (
                <Tappable
                  key={example}
                  onPress={() => setText(example)}
                  accessibilityLabel={t('Brug eksempel: {example}', { example })}
                  style={[
                    styles.example,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}>
                  <Icon name="chat" size={14} color={colors.textSecondary} />
                  <AppText variant="subhead" style={styles.flexShrink}>
                    {example}
                  </AppText>
                </Tappable>
              ))}
            </View>
          </View>
        ) : null}

        {text.trim().length > 0 || pickedCategory ? (
          <View
            style={[
              styles.understood,
              {
                backgroundColor: colors.surface,
                borderColor: category ? colors.brand : colors.border,
              },
            ]}>
            <View style={styles.row}>
              <View
                style={[
                  styles.tradeIcon,
                  {
                    backgroundColor: category ? colors.brandSoft : colors.surfaceAlt,
                  },
                ]}>
                <Icon
                  name={category ? category.id : 'help'}
                  size={18}
                  color={category ? colors.brand : colors.textSecondary}
                  weight="semibold"
                />
              </View>
              <View style={styles.flex} accessible accessibilityLiveRegion="polite">
                <AppText variant="caption" tone="textSecondary" weight="600">
                  {category ? t('Vi forstår det sådan') : t('Vælg fag')}
                </AppText>
                <AppText variant="headline">
                  {category ? `${category.name}${job ? ` · ${job.name}` : ''}` : t('Vi er ikke sikre på faget endnu')}
                </AppText>
                {typical ? (
                  <AppText variant="footnote" tone="textSecondary">
                    {t('Typisk pris: {priceRange} {tax}', {
                      priceRange: formatPriceRange(typical.min, typical.max, typical.unit, typical.currency),
                      tax: taxNote(market),
                    })}
                  </AppText>
                ) : null}
              </View>
            </View>

            {category ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {category.jobs.map((j) => (
                  <Chip
                    key={j.id}
                    label={j.name}
                    selected={job?.id === j.id}
                    onPress={() => setPickedJob(job?.id === j.id ? null : j.id)}
                  />
                ))}
                <Chip label={t('Ved ikke')} selected={!job} onPress={() => setPickedJob(null)} />
              </ScrollView>
            ) : null}

            <View style={styles.block}>
              <AppText variant="caption" tone="textSecondary" weight="600">
                {category ? t('ANDET FAG?') : t('HVILKET FAG?')}
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {otherCategories.map((c) => (
                  <Chip key={c.id} label={c.name} icon={c.id} onPress={() => pickCategory(c.id)} />
                ))}
              </ScrollView>
            </View>
          </View>
        ) : null}

        {job && quantity !== undefined ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <AppText variant="headline">{job.unit === 'm2' ? t('Hvor mange m²?') : t('Hvor mange?')}</AppText>
                <AppText variant="footnote" tone="textSecondary">
                  {t('Prisen ganges med antallet')}
                </AppText>
              </View>
              <Tappable
                onPress={() => setQuantityValue(Math.max(1, quantity - (job.unit === 'm2' ? 5 : 1)))}
                accessibilityLabel={t('Færre')}
                style={[styles.stepper, { backgroundColor: colors.surfaceAlt }]}>
                <Icon name="minus" size={16} color={colors.text} weight="bold" />
              </Tappable>
              <AppText
                variant="headline"
                style={styles.quantity}
                accessibilityLabel={t('{quantity} {value}', {
                  quantity,
                  value: job.unit === 'm2' ? t('kvadratmeter') : t('stk.'),
                })}>
                {quantity} {job.unit === 'm2' ? 'm²' : t('stk.')}
              </AppText>
              <Tappable
                onPress={() => setQuantityValue(quantity + (job.unit === 'm2' ? 5 : 1))}
                accessibilityLabel={t('Flere')}
                style={[styles.stepper, { backgroundColor: colors.surfaceAlt }]}>
                <Icon name="plus" size={16} color={colors.text} weight="bold" />
              </Tappable>
            </View>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText variant="headline">{t('Dit budget')}</AppText>
          <View
            style={[
              styles.budgetField,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
              },
            ]}>
            <Icon name="money" size={18} color={colors.textSecondary} />
            <TextInput
              value={budgetDigits ? formatNumber(Number(budgetDigits)) : ''}
              onChangeText={(value) => setBudgetText(value.replace(/\D/g, '').slice(0, 7))}
              placeholder={t('Ved ikke')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              returnKeyType="done"
              accessibilityLabel={t('Budget i {currency} {tax}', { currency: market.currency, tax: taxNote(market) })}
              style={[styles.budgetInput, { color: colors.text }]}
            />
            <AppText variant="body" tone="textSecondary">
              {`${currencySymbol(market.currency)} ${taxNote(market)}`}
            </AppText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {presets.map((value) => (
              <Chip
                key={value}
                label={formatPrice(value, market.currency)}
                selected={budget === value}
                onPress={() => setBudgetText(budget === value ? '' : String(value))}
              />
            ))}
          </ScrollView>
        </View>

        <View style={[styles.card, styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.tradeIcon, { backgroundColor: colors.warningSoft }]}>
            <Icon name="bolt" size={18} color={colors.warning} weight="semibold" />
          </View>
          <View style={styles.flex}>
            <AppText variant="headline">{t('Det haster')}</AppText>
            <AppText variant="footnote" tone="textSecondary">
              {t('Virksomheder med døgnvagt vises først')}
            </AppText>
          </View>
          <Switch
            value={urgent}
            onValueChange={setUrgentValue}
            trackColor={{ true: colors.brandStrong }}
            accessibilityLabel={t('Det haster')}
          />
        </View>

        <View style={styles.privacy}>
          <Icon name="privacy" size={14} color={colors.textSecondary} />
          <AppText variant="caption" tone="textSecondary" style={styles.flexShrink}>
            {t(
              'Din beskrivelse bliver på telefonen. Den sendes ikke til FixMatch eller til virksomhederne – du bestemmer selv, om du vil dele den, når du kontakter dem.',
            )}
          </AppText>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}>
        {category ? (
          <AppText variant="footnote" tone="textSecondary" style={styles.center}>
            {budget
              ? t('{fitting} af {countText} passer eller ligger tæt på dit budget', {
                  fitting,
                  countText: pluralize(items.length, t('virksomhed'), t('virksomheder')),
                })
              : t('{countText} kører ud til dig', {
                  countText: pluralize(items.length, t('virksomhed'), t('virksomheder')),
                })}
          </AppText>
        ) : null}
        <Button title={t('Find match')} icon="wand" size="large" disabled={!category} onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  center: { textAlign: 'center' },
  content: { padding: ScreenPadding, gap: Spacing.lg },
  intro: { gap: Spacing.xs },
  field: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
  },
  textArea: { minHeight: 110, fontSize: 17, lineHeight: 23, padding: 0 },
  counter: { alignSelf: 'flex-end' },
  block: { gap: Spacing.sm },
  examples: { gap: Spacing.sm },
  example: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    minHeight: MinTouchSize,
  },
  understood: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  tradeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { gap: Spacing.sm, paddingRight: Spacing.md },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  stepper: {
    width: MinTouchSize,
    height: MinTouchSize,
    borderRadius: MinTouchSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: { minWidth: 64, textAlign: 'center' },
  budgetField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  budgetInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 20,
    fontWeight: '600',
    paddingVertical: Spacing.sm,
  },
  privacy: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
