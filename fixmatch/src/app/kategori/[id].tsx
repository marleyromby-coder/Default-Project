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
import { MAX_COMPARE, useApp } from '@/state/app-state';

const ALL_SORT_OPTIONS: { value: SortMode; label: string; accessibilityLabel: string }[] = [
  { value: 'match', label: 'Match', accessibilityLabel: 'Sortér efter bedste match' },
  { value: 'price', label: 'Pris', accessibilityLabel: 'Sortér efter laveste pris' },
  { value: 'distance', label: 'Afstand', accessibilityLabel: 'Sortér efter korteste afstand' },
  { value: 'rating', label: 'Anmeldelser', accessibilityLabel: 'Sortér efter bedste anmeldelser' },
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
            state.businesses.filter((b) => b.categories.includes(category.id)),
          )
        : null,
    [job, category, state.businesses],
  );

  if (!category) {
    return (
      <EmptyState
        icon="help"
        title="Faget findes ikke"
        message="Linket virker ikke længere."
        action={<Button title="Til forsiden" onPress={() => router.replace('/')} />}
      />
    );
  }

  const onCompareLimit = () =>
    showDialog(
      'Højst 3 ad gangen',
      `Du kan sammenligne op til ${MAX_COMPARE} virksomheder. Fjern en for at vælge en ny.`,
    );

  const toggle = (key: 'openNow' | 'emergency' | 'authorizedOnly') => setFilters({ ...filters, [key]: !filters[key] });

  const header = (
    <View style={styles.header}>
      <View style={styles.summaryRow}>
        <AppText variant="subhead" tone="textSecondary" style={styles.flex}>
          {results.items.length} {lowerTrade(results.items.length === 1 ? category.name : category.plural)}{' '}
          {filters.maxDistanceKm === null ? 'i hele landet' : `inden for ${filters.maxDistanceKm} km`} af{' '}
          {state.location.label}
        </AppText>
        <Tappable
          onPress={() => router.push({ pathname: '/info/[slug]', params: { slug: 'rangering' } })}
          accessibilityRole="link"
          accessibilityLabel="Sådan rangerer vi"
          style={styles.inlineLink}>
          <Icon name="info" size={14} color={colors.brandText} weight="semibold" />
          <AppText variant="footnote" tone="brandText" weight="600">
            Sådan rangerer vi
          </AppText>
        </Tappable>
      </View>

      {job && jobPrice ? (
        <View style={[styles.jobBanner, { backgroundColor: colors.brandSoft }]}>
          <AppText variant="subhead" weight="600">
            {job.name}
          </AppText>
          <AppText variant="footnote" tone="textSecondary">
            Typisk pris her: {formatPriceRange(jobPrice.min, jobPrice.max, jobPrice.unit)} inkl. moms. Vejledende – bed
            om et skriftligt tilbud.
          </AppText>
        </View>
      ) : null}

      <Segmented options={SORT_OPTIONS} value={sort} onChange={setSort} accessibilityLabel="Sortering" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip
          label="Filtre"
          icon="filter"
          count={filterCount}
          onPress={() => router.push({ pathname: '/filtre', params: { kategori: category.id } })}
          accessibilityLabel={filterCount ? `Filtre, ${filterCount} aktive` : 'Filtre'}
        />
        <Chip label="Åben nu" selected={filters.openNow} onPress={() => toggle('openNow')} />
        <Chip label="Døgnvagt" icon="bolt" selected={filters.emergency} onPress={() => toggle('emergency')} />
        {category.authorization ? (
          <Chip
            label="Autoriseret"
            icon="shield"
            selected={filters.authorizedOnly}
            onPress={() => toggle('authorizedOnly')}
          />
        ) : null}
        {TRUSTPILOT_ENABLED ? (
          <Chip
            label="4+ på Trustpilot"
            selected={filters.minRating === 4}
            onPress={() => setFilters({ ...filters, minRating: filters.minRating === 4 ? null : 4 })}
          />
        ) : null}
      </ScrollView>

      <Tappable
        onPress={() => router.push('/prioriteter')}
        accessibilityLabel={`Din vægtning: pris ${Math.round(weights.price * 100)} procent, afstand ${Math.round(weights.distance * 100)} procent, anmeldelser ${Math.round(weights.reviews * 100)} procent. Juster`}
        style={[styles.weights, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Icon name="sliders" size={16} color={colors.brand} weight="semibold" />
        <AppText variant="footnote" style={styles.flex} numberOfLines={2}>
          <AppText variant="footnote" weight="600">
            Din vægtning:{' '}
          </AppText>
          Pris {Math.round(weights.price * 100)} % · Afstand {Math.round(weights.distance * 100)} % · Anmeldelser{' '}
          {Math.round(weights.reviews * 100)} %
        </AppText>
        <AppText variant="footnote" tone="brandText" weight="700">
          Justér
        </AppText>
      </Tappable>

      {category.authorization ? (
        <AppText variant="caption" tone="textSecondary">
          Arbejde med {category.authorization === 'el' ? 'el-installationer' : 'vand og afløb'} kræver ifølge loven en{' '}
          {AUTHORIZATION_LABELS[category.authorization].toLowerCase()}.
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
              accessibilityLabel={`Vis ${category.plural.toLowerCase()} på kort`}
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
            title="Ingen resultater"
            message={
              results.nearestOutside
                ? `Ingen matcher dine filtre. Den nærmeste ${category.name.toLowerCase()} ligger ${formatDistance(results.nearestOutside.distanceKm)} væk.`
                : `Der er endnu ingen ${category.plural.toLowerCase()} på FixMatch her. Vi arbejder på at få flere med.`
            }
            action={
              filterCount > 0 ? (
                <Button
                  title={results.nearestOutside ? 'Vis hele landet' : 'Nulstil filtre'}
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
