import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { BusinessCard } from '@/components/business/business-card';
import { CompareTray } from '@/components/business/compare-tray';
import { Button, IconButton } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Segmented } from '@/components/ui/segmented';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { AUTHORIZATION_LABELS, getCategory } from '@/data/categories';
import { useResults } from '@/hooks/use-results';
import { useTheme } from '@/hooks/use-theme';
import { showDialog } from '@/lib/dialog';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import { activeFilterCount, DEFAULT_FILTERS } from '@/lib/filters';
import { formatDistance, formatPriceRange } from '@/lib/format';
import { summarizeJobPrice } from '@/lib/prices';
import { weightsFromPriorities } from '@/lib/ranking';
import type { SortMode } from '@/lib/types';
import { t } from '@/i18n';
import { countryOf } from '@/lib/business-text';
import { taxNote } from '@/lib/markets';
import { MAX_COMPARE, useApp, useMarket } from '@/state/app-state';

const ALL_SORT_OPTIONS: { value: SortMode; label: string; accessibilityLabel: string }[] = [
  { value: 'match', label: 'Match', accessibilityLabel: t('Sortér efter bedste match') },
  { value: 'price', label: t('Pris'), accessibilityLabel: t('Sortér efter laveste pris') },
  { value: 'distance', label: t('Afstand'), accessibilityLabel: t('Sortér efter korteste afstand') },
  { value: 'rating', label: t('Anmeldelser'), accessibilityLabel: t('Sortér efter bedste anmeldelser') },
];
/** "Elektrikere" → "elektrikere", but "VVS'ere" keeps its capitals. */
const lowerTrade = (word: string) => (word.startsWith('VVS') ? word : word.toLowerCase());

const SORT_OPTIONS = ALL_SORT_OPTIONS.filter((o) => TRUSTPILOT_ENABLED || o.value !== 'rating');

export default function CategoryScreen() {
  const colors = useTheme();
  const { id, job: jobId, akut } = useLocalSearchParams<{ id: string; job?: string; akut?: string }>();
  const category = getCategory(id);
  const job = category?.jobs.find((j) => j.id === jobId);
  const { state, setFilters } = useApp();
  const { country, market } = useMarket();
  const [sort, setSort] = useState<SortMode>('match');
  const filters = state.filters;

  // Opening from "Akut hjælp" turns on the døgnvagt filter once.
  useEffect(() => {
    if (akut === '1') setFilters({ ...DEFAULT_FILTERS, emergency: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [akut]);

  const results = useResults(category?.id, sort);
  const filterCount = activeFilterCount(filters);
  const weights = weightsFromPriorities(state.priorities);
  const jobPrice = useMemo(
    () =>
      job && category
        ? summarizeJobPrice(
            job,
            state.businesses.filter((b) => countryOf(b) === country && b.categories.includes(category.id)),
            market,
          )
        : null,
    [job, category, state.businesses, country, market],
  );

  if (!category) {
    return (
      <EmptyState
        icon="help"
        title={t('Faget findes ikke')}
        message={t('Linket virker ikke længere.')}
        action={<Button title={t('Til forsiden')} onPress={() => router.replace('/')} />}
      />
    );
  }

  const tradeWord = lowerTrade(results.items.length === 1 ? category.name : category.plural);

  const onCompareLimit = () =>
    showDialog(
      t('Højst 3 ad gangen'),
      t('Du kan sammenligne op til {MAX_COMPARE} virksomheder. Fjern en for at vælge en ny.', { MAX_COMPARE }),
    );

  const toggle = (key: 'openNow' | 'emergency' | 'authorizedOnly') => setFilters({ ...filters, [key]: !filters[key] });

  const header = (
    <View style={styles.header}>
      <View style={styles.summaryRow}>
        <AppText variant="subhead" tone="textSecondary" style={styles.flex}>
          {filters.maxDistanceKm === null
            ? t('{count} {trade} i hele landet', { count: results.items.length, trade: tradeWord })
            : t('{count} {trade} inden for {distance} af {place}', {
                count: results.items.length,
                trade: tradeWord,
                distance: formatDistance(filters.maxDistanceKm),
                place: state.location.label,
              })}
        </AppText>
        <Tappable
          onPress={() => router.push({ pathname: '/info/[slug]', params: { slug: 'rangering' } })}
          accessibilityRole="link"
          accessibilityLabel={t('Sådan rangerer vi')}
          style={styles.inlineLink}>
          <Icon name="info" size={14} color={colors.brandText} weight="semibold" />
          <AppText variant="footnote" tone="brandText" weight="600">
            {t('Sådan rangerer vi')}
          </AppText>
        </Tappable>
      </View>

      {job && jobPrice ? (
        <View style={[styles.jobBanner, { backgroundColor: colors.brandSoft }]}>
          <AppText variant="subhead" weight="600">
            {job.name}
          </AppText>
          <AppText variant="footnote" tone="textSecondary">
            {t('Typisk pris her: {priceRange} {tax}. Vejledende – bed om et skriftligt tilbud.', {
              priceRange: formatPriceRange(jobPrice.min, jobPrice.max, jobPrice.unit, jobPrice.currency),
              tax: taxNote(market),
            })}
          </AppText>
        </View>
      ) : null}

      <Segmented options={SORT_OPTIONS} value={sort} onChange={setSort} accessibilityLabel={t('Sortering')} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip
          label={t('Filtre')}
          icon="filter"
          count={filterCount}
          onPress={() => router.push({ pathname: '/filtre', params: { kategori: category.id } })}
          accessibilityLabel={filterCount ? t('Filtre, {count} aktive', { count: filterCount }) : t('Filtre')}
        />
        <Chip label={t('Åben nu')} selected={filters.openNow} onPress={() => toggle('openNow')} />
        <Chip label={t('Døgnvagt')} icon="bolt" selected={filters.emergency} onPress={() => toggle('emergency')} />
        {category.authorization ? (
          <Chip
            label={t('Autoriseret')}
            icon="shield"
            selected={filters.authorizedOnly}
            onPress={() => toggle('authorizedOnly')}
          />
        ) : null}
        {TRUSTPILOT_ENABLED ? (
          <Chip
            label={t('4+ på Trustpilot')}
            selected={filters.minRating === 4}
            onPress={() => setFilters({ ...filters, minRating: filters.minRating === 4 ? null : 4 })}
          />
        ) : null}
      </ScrollView>

      <Tappable
        onPress={() => router.push('/prioriteter')}
        accessibilityLabel={t(
          'Din vægtning: pris {price} procent, afstand {distance} procent, anmeldelser {reviews} procent. Juster',
          {
            price: Math.round(weights.price * 100),
            distance: Math.round(weights.distance * 100),
            reviews: Math.round(weights.reviews * 100),
          },
        )}
        style={[styles.weights, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Icon name="sliders" size={16} color={colors.brand} weight="semibold" />
        <AppText variant="footnote" style={styles.flex} numberOfLines={2}>
          <AppText variant="footnote" weight="600">
            {t('Din vægtning:')}{' '}
          </AppText>
          {t('Pris {price} % · Afstand {distance} % · Anmeldelser {reviews} %', {
            price: Math.round(weights.price * 100),
            distance: Math.round(weights.distance * 100),
            reviews: Math.round(weights.reviews * 100),
          })}
        </AppText>
        <AppText variant="footnote" tone="brandText" weight="700">
          {t('Justér')}
        </AppText>
      </Tappable>

      {category.authorization ? (
        <AppText variant="caption" tone="textSecondary">
          {country === 'DK'
            ? t('Arbejde med {work} kræver ifølge loven en {licence}.', {
                work: category.authorization === 'el' ? t('el-installationer') : t('vand og afløb'),
                licence: AUTHORIZATION_LABELS[category.authorization].toLowerCase(),
              })
            : t(market.licenceNote)}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: category.plural,
          headerRight: () => (
            <IconButton
              icon="map"
              onPress={() => router.navigate({ pathname: '/kort', params: { kategori: category.id } })}
              accessibilityLabel={t('Vis {plural} på kort', { plural: category.plural.toLowerCase() })}
              background="transparent"
              color={colors.brandText}
            />
          ),
        }}
      />
      <FlatList
        data={results.items}
        keyExtractor={(item) => item.business.id}
        renderItem={({ item, index }) => (
          <BusinessCard
            item={item}
            job={job}
            rank={sort === 'match' ? index + 1 : undefined}
            onCompareLimit={onCompareLimit}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title={t('Ingen resultater')}
            message={
              results.nearestOutside
                ? t('Ingen matcher dine filtre. Den nærmeste {name} ligger {distance} væk.', {
                    name: category.name.toLowerCase(),
                    distance: formatDistance(results.nearestOutside.distanceKm),
                  })
                : t('Der er endnu ingen {plural} på FixMatch her. Vi arbejder på at få flere med.', {
                    plural: category.plural.toLowerCase(),
                  })
            }
            action={
              filterCount > 0 ? (
                <Button
                  title={results.nearestOutside ? t('Vis hele landet') : t('Nulstil filtre')}
                  variant="tinted"
                  onPress={() =>
                    setFilters({
                      ...DEFAULT_FILTERS,
                      maxDistanceKm: results.nearestOutside ? null : DEFAULT_FILTERS.maxDistanceKm,
                    })
                  }
                />
              ) : undefined
            }
          />
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        contentInsetAdjustmentBehavior="automatic"
        initialNumToRender={6}
      />
      <CompareTray />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: ScreenPadding, paddingBottom: 120 },
  header: { gap: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  inlineLink: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36 },
  jobBanner: { borderRadius: Radius.md, padding: Spacing.md, gap: 2 },
  chips: { gap: Spacing.sm, paddingRight: Spacing.lg },
  weights: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
});
