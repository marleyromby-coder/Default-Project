import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { BusinessCard } from '@/components/business/business-card';
import { CompareTray } from '@/components/business/compare-tray';
import { SortTabs } from '@/components/business/sort-tabs';
import { HeroPanel, panelHeaderOptions } from '@/components/hero-panel';
import { TradeArt } from '@/components/trade-art';
import { Button, IconButton } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Hint } from '@/components/ui/hint';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { AUTHORIZATION_LABELS, getCategory } from '@/data/categories';
import { useResults } from '@/hooks/use-results';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { showDialog } from '@/lib/dialog';
import { activeFilterCount, DEFAULT_FILTERS } from '@/lib/filters';
import { formatDistance, formatPriceRange } from '@/lib/format';
import { summarizeJobPrice } from '@/lib/prices';
import { weightsFromPriorities, weightsText } from '@/lib/ranking';
import { resultRibbons } from '@/lib/sort-tabs';
import type { SortMode } from '@/lib/types';
import { t } from '@/i18n';
import { countryOf } from '@/lib/business-text';
import { taxNote } from '@/lib/markets';
import { MAX_COMPARE, useApp, useMarket } from '@/state/app-state';

const SORT_MODES: readonly SortMode[] = ['match', 'price', 'distance', 'rating'];
/** How far the sort tabs reach up into the panel. */
const OVERLAP = 36;

/** "Elektrikere" → "elektrikere", but "VVS'ere" keeps its capitals. */
const lowerTrade = (word: string) => (word.startsWith('VVS') ? word : word.toLowerCase());

/** "efter match", "efter pris" …: how the list is sorted, after the count. */
function sortedBy(sort: SortMode): string {
  switch (sort) {
    case 'price':
      return t('efter pris');
    case 'distance':
      return t('efter afstand');
    case 'rating':
      return t('efter anmeldelser');
    default:
      return t('efter match');
  }
}

export default function CategoryScreen() {
  const { column } = useLayout();
  const colors = useTheme();
  const {
    id,
    job: jobId,
    akut,
    ledig,
    sort: sortParam,
  } = useLocalSearchParams<{ id: string; job?: string; akut?: string; ledig?: string; sort?: string }>();
  const category = getCategory(id);
  const job = category?.jobs.find((j) => j.id === jobId);
  const { state, setFilters } = useApp();
  const { country, market } = useMarket();
  const [sort, setSort] = useState<SortMode>(() =>
    SORT_MODES.includes(sortParam as SortMode) ? (sortParam as SortMode) : 'match',
  );
  const filters = state.filters;

  // Opening from "Akut hjælp" turns on the døgnvagt filter once.
  useEffect(() => {
    if (akut === '1') setFilters({ ...DEFAULT_FILTERS, emergency: true });
    // ... and "Fik du fat i dem?" the free-today filter.
    if (ledig === '1') setFilters({ ...DEFAULT_FILTERS, availableSoon: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [akut, ledig]);

  const results = useResults(category?.id, sort);
  const ribbons = useMemo(() => resultRibbons(results.items, sort), [results.items, sort]);
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

  const toggle = (key: 'openNow' | 'emergency' | 'authorizedOnly' | 'verifiedOnly') =>
    setFilters({ ...filters, [key]: !filters[key] });

  const header = (
    <View>
      {/* Panel colour above the band, so pulling the list down shows no gap under the bar. */}
      <View pointerEvents="none" style={[styles.overscroll, { backgroundColor: colors.panel }]} />
      <HeroPanel safeArea={false} overlap={OVERLAP}>
        <Tappable
          onPress={() => router.push('/placering')}
          accessibilityLabel={t('Placering: {label}. Skift placering', { label: state.location.label })}
          pressedOpacity={0.8}
          style={styles.band}>
          <TradeArt trade={category.id} size={48} tile />
          <View style={styles.bandText}>
            <View style={styles.bandTitle}>
              <AppText variant="title3" tone="onPanel" numberOfLines={1} style={styles.flexShrink}>
                {t('Nær {place}', { place: state.location.label })}
              </AppText>
              <Icon name="chevronDown" size={13} color={colors.onPanelSoft} weight="bold" />
            </View>
            <AppText variant="footnote" tone="onPanelSoft" numberOfLines={2}>
              {filters.maxDistanceKm === null
                ? t('I hele landet · priser {tax}', { tax: taxNote(market) })
                : t('Inden for {distance} · priser {tax}', {
                    distance: formatDistance(filters.maxDistanceKm),
                    tax: taxNote(market),
                  })}
            </AppText>
          </View>
        </Tappable>
      </HeroPanel>

      <View style={[styles.headerBody, column]}>
        <SortTabs items={results.items} value={sort} onChange={setSort} />

        {/* Only the chips that open a sheet have an icon. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chips}>
          <Chip
            label={t('Filtre')}
            icon="sliders"
            count={filterCount}
            onPress={() => router.push({ pathname: '/filtre', params: { kategori: category.id } })}
            accessibilityLabel={filterCount ? t('Filtre, {count} aktive', { count: filterCount }) : t('Filtre')}
          />
          <Chip label={t('Åben nu')} selected={filters.openNow} onPress={() => toggle('openNow')} />
          <Chip label={t('Verificeret')} selected={filters.verifiedOnly} onPress={() => toggle('verifiedOnly')} />
          {category.authorization ? (
            <Chip label={t('Autoriseret')} selected={filters.authorizedOnly} onPress={() => toggle('authorizedOnly')} />
          ) : null}
          <Chip label={t('Døgnvagt')} selected={filters.emergency} onPress={() => toggle('emergency')} />
          <Chip
            label={t('Vægtning')}
            icon="scale"
            onPress={() => router.push('/prioriteter')}
            accessibilityLabel={t('Din vægtning: {weights}. Juster', { weights: weightsText(weights, true) })}
          />
        </ScrollView>

        <View style={styles.countRow}>
          <AppText variant="footnote" tone="textSecondary" style={styles.flexShrink}>
            <AppText variant="footnote" weight="700">
              {results.items.length} {tradeWord}
            </AppText>
            {' · '}
            {sortedBy(sort)}
          </AppText>
          <Tappable
            onPress={() => router.push({ pathname: '/info/[slug]', params: { slug: 'rangering' } })}
            accessibilityRole="link"
            accessibilityLabel={t('Rækkefølgen kan ikke købes. Sådan rangerer vi')}
            hitSlop={{ top: 12, bottom: 12 }}
            style={styles.paidLine}>
            <Icon name="shield" size={14} color={colors.brand} weight="semibold" />
            <AppText variant="footnote" weight="600" tone="brandText" numberOfLines={1}>
              {t('Rækkefølgen kan ikke købes')}
            </AppText>
          </Tappable>
        </View>

        {job && jobPrice ? (
          <View style={[styles.job, { backgroundColor: colors.surface }]}>
            <View style={styles.jobHead}>
              <AppText variant="subhead" weight="600" style={styles.flexShrink}>
                {job.name}
              </AppText>
              <Tappable
                onPress={() => router.push({ pathname: '/prisguide', params: { fag: category.id } })}
                accessibilityRole="link"
                accessibilityLabel={t('Skift opgave i prisguiden')}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
                <AppText variant="footnote" weight="600" tone="brandText" maxFontSizeMultiplier={1.3}>
                  {t('Skift opgave')}
                </AppText>
              </Tappable>
            </View>
            <AppText variant="footnote" tone="textSecondary">
              {t('Typisk pris her: {priceRange} {tax}. Vejledende – bed om et skriftligt tilbud.', {
                priceRange: formatPriceRange(jobPrice.min, jobPrice.max, jobPrice.unit, jobPrice.currency),
                tax: taxNote(market),
              })}
            </AppText>
          </View>
        ) : (
          <Tappable
            onPress={() => router.push({ pathname: '/prisguide', params: { fag: category.id } })}
            accessibilityRole="link"
            accessibilityLabel={t('Prisguide: hvad koster en opgave typisk hos {plural}?', {
              plural: category.plural.toLowerCase(),
            })}
            style={[styles.guide, { backgroundColor: colors.surface }]}>
            <Icon name="tag" size={16} color={colors.brandText} weight="semibold" />
            <AppText variant="subhead" weight="600" style={styles.flex}>
              {t('Hvad koster en opgave typisk?')}
            </AppText>
            <AppText variant="footnote" weight="600" tone="brandText" maxFontSizeMultiplier={1.3}>
              {t('Prisguide')}
            </AppText>
            <Icon name="chevronRight" size={12} color={colors.brandText} weight="bold" />
          </Tappable>
        )}

        {results.items.length > 0 ? (
          <Hint
            id="list"
            title={t('Sådan læser du listen')}
            points={[
              { icon: 'sliders', text: t('Sortér øverst på match, pris, afstand eller anmeldelser.') },
              { icon: 'tag', text: t('“fra” er firmaets egen timepris {tax}.', { tax: taxNote(market) }) },
              {
                icon: 'compare',
                text: t('Vælg op til {MAX_COMPARE} med Sammenlign, og se dem side om side.', { MAX_COMPARE }),
              },
            ]}
          />
        ) : null}
      </View>
    </View>
  );

  const footer = category.authorization ? (
    <View style={[styles.item, column]}>
      <AppText variant="footnote" tone="textSecondary" style={styles.footer}>
        {country === 'DK'
          ? t('Arbejde med {work} kræver ifølge loven en {licence}.', {
              work: category.authorization === 'el' ? t('el-installationer') : t('vand og afløb'),
              licence: AUTHORIZATION_LABELS[category.authorization].toLowerCase(),
            })
          : t(market.licenceNote)}
      </AppText>
    </View>
  ) : undefined;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          ...panelHeaderOptions(colors),
          title: category.plural,
          headerRight: () => (
            <IconButton
              icon="map"
              onPress={() => router.navigate({ pathname: '/kort', params: { kategori: category.id } })}
              accessibilityLabel={t('Vis {plural} på kort', { plural: category.plural.toLowerCase() })}
              background="transparent"
              color={colors.onPanel}
            />
          ),
        }}
      />
      <FlatList
        data={results.items}
        keyExtractor={(item) => item.business.id}
        renderItem={({ item, index }) => (
          <View style={[styles.item, column]}>
            <BusinessCard
              item={item}
              job={job}
              rank={sort === 'match' ? index + 1 : undefined}
              ribbons={ribbons.get(item.business.id)}
              onCompareLimit={onCompareLimit}
            />
          </View>
        )}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={
          <View style={column}>
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
          </View>
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
  flexShrink: { flexShrink: 1 },
  list: { paddingBottom: 120 },
  overscroll: { position: 'absolute', left: 0, right: 0, top: -600, height: 600 },
  band: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 56 },
  bandText: { flex: 1, gap: 2 },
  bandTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBody: {
    marginTop: -OVERLAP,
    paddingHorizontal: ScreenPadding,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  item: { paddingHorizontal: ScreenPadding },
  job: { gap: 2, padding: Spacing.md, borderRadius: Radius.lg, borderCurve: 'continuous' },
  jobHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  guide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 48,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
  },
  // The chips scroll out to the screen edge, and start in line with the text above.
  chipScroll: { marginHorizontal: -ScreenPadding },
  chips: { gap: Spacing.sm, paddingHorizontal: ScreenPadding },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: Spacing.md,
    rowGap: Spacing.xs,
  },
  paidLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footer: { marginTop: Spacing.lg },
});
