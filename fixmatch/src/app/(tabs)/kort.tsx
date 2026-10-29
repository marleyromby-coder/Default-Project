import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessMark } from '@/components/business/business-mark';
import { OpenStatus } from '@/components/business/open-status';
import { TrustpilotRating } from '@/components/business/trustpilot-rating';
import { LocationPill } from '@/components/location-pill';
import { BusinessMap } from '@/components/map/business-map';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { MinTouchSize, Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { CATEGORIES, getCategory, isCategoryId } from '@/data/categories';
import { useLayout } from '@/hooks/use-layout';
import { useResults } from '@/hooks/use-results';
import { useTheme } from '@/hooks/use-theme';
import { countryOf, currencyOf } from '@/lib/business-text';
import { inRegion, regionAround, type Region } from '@/lib/cluster';
import { callBusiness } from '@/lib/contact';
import { DEFAULT_FILTERS } from '@/lib/filters';
import { formatDistance, formatHourly, speakablePrice } from '@/lib/format';
import { WORLD_REGION } from '@/lib/markets';
import type { ScoredBusiness } from '@/lib/ranking';
import type { CategoryId, Filters } from '@/lib/types';
import { t } from '@/i18n';
import { useApp, useMarket } from '@/state/app-state';

const NEARBY_KM = 7;
const MAX_CARDS = 40;
const CARD_GAP = Spacing.sm;
const CARD_HEIGHT = 136;
/** Height of the floating tab bar above the home indicator. */
const TAB_BAR = Platform.OS === 'web' ? 0 : 62;
/** Width of the list beside the map on wide screens. */
const SIDEBAR = 380;

/**
 * Overview map of every listed business, in Denmark and abroad, on Apple's muted map.
 * Each business is a price tag – its trade and lowest hourly price – so you can compare
 * before you call. Nearby pins merge into clusters, and the cards (or, on wide screens such
 * as an open iPhone Duo, the list beside the map) follow what is on screen.
 */
export default function MapScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { width: pageWidth, wide } = useLayout();
  const params = useLocalSearchParams<{ kategori?: string }>();
  const { state } = useApp();
  const { country, market } = useMarket();
  const origin = state.location.coords;
  const countryRegion = () => ({ ...market.region });

  const [category, setCategory] = useState<CategoryId | undefined>(
    params.kategori && isCategoryId(params.kategori) ? params.kategori : undefined,
  );
  const [openNow, setOpenNow] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [target, setTarget] = useState<Region>(() => regionAround(origin, NEARBY_KM));
  const [region, setRegion] = useState<Region>(target);
  const [selectedId, setSelectedId] = useState<string>();
  const cards = useRef<FlatList<ScoredBusiness>>(null);

  // Follow a new location or a trade picked on another screen.
  const originKey = `${origin.lat},${origin.lon}`;
  const [lastOrigin, setLastOrigin] = useState(originKey);
  if (originKey !== lastOrigin) {
    setLastOrigin(originKey);
    setTarget(regionAround(origin, NEARBY_KM));
  }
  const [lastParam, setLastParam] = useState(params.kategori);
  if (params.kategori !== lastParam) {
    setLastParam(params.kategori);
    if (params.kategori && isCategoryId(params.kategori)) setCategory(params.kategori);
  }

  const filters = useMemo<Filters>(
    () => ({ ...DEFAULT_FILTERS, maxDistanceKm: null, openNow, emergency }),
    [openNow, emergency],
  );
  const results = useResults(category, 'distance', filters, 'world');
  const onScreen = useMemo(
    () => results.items.filter((s) => inRegion(region, s.business.coords)).slice(0, MAX_CARDS),
    [results.items, region],
  );
  // The lowest hourly price on screen, in this country's currency only.
  const fromPrice = useMemo(() => {
    const local = onScreen.filter((s) => countryOf(s.business) === country);
    if (local.length === 0) return undefined;
    const min = Math.min(...local.map((s) => s.business.pricing.hourlyMin));
    return formatHourly(min, min, currencyOf(local[0].business));
  }, [onScreen, country]);

  const summary =
    onScreen.length === 0
      ? t('Ingen her – zoom ud')
      : t('{count} her', { count: onScreen.length === MAX_CARDS ? `${MAX_CARDS}+` : onScreen.length });

  // On the open iPhone Duo the cards stay card-sized, so the next one peeks in.
  const cardWidth = Math.min(pageWidth - ScreenPadding * 2 - 28, 380);
  const bottom = (Platform.OS === 'web' ? Spacing.md : insets.bottom + TAB_BAR) + Spacing.sm;
  const topHeight = insets.top + 108;

  const select = (id: string) => {
    setSelectedId(id);
    const index = onScreen.findIndex((s) => s.business.id === id);
    if (!wide && index >= 0) cards.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
  };
  // On wide screens a row in the list brings its pin to the middle, at the same zoom.
  const focus = (item: ScoredBusiness) => {
    setSelectedId(item.business.id);
    setTarget({ ...region, latitude: item.business.coords.lat, longitude: item.business.coords.lon });
  };

  // FlatList needs this callback to stay the same for the list's lifetime.
  const onViewable = useCallback(
    ({ viewableItems }: { viewableItems: { item: ScoredBusiness; isViewable: boolean }[] }) => {
      const first = viewableItems.find((v) => v.isViewable);
      if (first?.item) setSelectedId(first.item.business.id);
    },
    [],
  );

  const tradeCount = (id: CategoryId) =>
    state.businesses.filter((b) => countryOf(b) === country && b.categories.includes(id)).length;
  const showsUserLocation = state.location.source === 'gps' && Platform.OS !== 'web';

  const chips = (
    <>
      <Chip label={t('Åben nu')} icon="clock" selected={openNow} onPress={() => setOpenNow(!openNow)} />
      <Chip label={t('Døgnvagt')} icon="bolt" selected={emergency} onPress={() => setEmergency(!emergency)} />
      <View style={[styles.chipDivider, { backgroundColor: colors.border }]} />
      <Chip label={t('Alle fag')} selected={!category} onPress={() => setCategory(undefined)} />
      {CATEGORIES.map((c) => (
        <Chip
          key={c.id}
          label={c.name}
          icon={c.id}
          selected={category === c.id}
          onPress={() => setCategory(category === c.id ? undefined : c.id)}
          accessibilityLabel={t('{plural}, {tradeCount} på kortet', {
            plural: c.plural,
            tradeCount: tradeCount(c.id),
          })}
        />
      ))}
    </>
  );

  const describe = (
    <Tappable
      onPress={() => router.push('/beskriv')}
      accessibilityLabel={t('Beskriv dit problem og dit budget')}
      style={[
        styles.describe,
        styles.floating,
        { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
      ]}>
      <Icon name="wand" size={17} color={colors.brand} weight="semibold" />
      <AppText variant="subhead" tone="textSecondary" numberOfLines={1} style={styles.flexShrink}>
        {t('Beskriv dit problem …')}
      </AppText>
    </Tappable>
  );

  const summaryLine = (
    <AppText variant="footnote" weight="600" numberOfLines={1}>
      {summary}
      {fromPrice && onScreen.length > 0 ? (
        <AppText variant="footnote" tone="textSecondary">
          {' · '}
          {t('fra {price}', { price: fromPrice })}
        </AppText>
      ) : null}
    </AppText>
  );

  const controls = (
    <MapControls
      buttons={[
        {
          icon: 'crosshair',
          label: t('Vis området omkring {label}', { label: state.location.label }),
          onPress: () => setTarget(regionAround(origin, NEARBY_KM)),
        },
        {
          icon: 'map',
          label: t('Vis hele {country}', { country: t(market.name) }),
          onPress: () => setTarget(countryRegion()),
        },
        { icon: 'world', label: t('Vis alle lande'), onPress: () => setTarget({ ...WORLD_REGION }) },
      ]}
    />
  );

  const map = (padding: { top: number; bottom: number }) => (
    <BusinessMap
      items={results.items}
      origin={origin}
      showsUserLocation={showsUserLocation}
      selectedId={selectedId}
      onSelect={select}
      target={target}
      onRegionChange={setRegion}
      padding={padding}
    />
  );

  const empty = (width?: number) => (
    <View
      style={[
        styles.emptyCard,
        { width, backgroundColor: colors.surface, borderColor: colors.border },
        wide ? null : [styles.floating, { shadowColor: colors.shadow }],
      ]}>
      <AppText variant="headline">{t('Ingen virksomheder i kortudsnittet')}</AppText>
      <AppText variant="footnote" tone="textSecondary">
        {t('Zoom ud, eller se hele landet.')}
      </AppText>
      <Button title={t('Vis hele landet')} variant="tinted" size="small" onPress={() => setTarget(countryRegion())} />
    </View>
  );

  if (wide) {
    // Side by side: the list on the left, the map on the right (iPhone Duo open, iPad, desktop).
    return (
      <View style={[styles.row, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.sidebar,
            {
              paddingTop: insets.top + Spacing.md,
              borderRightColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}>
          <View style={styles.sidebarHeader}>
            <View style={styles.titleRow}>
              <AppText variant="largeTitle" style={styles.flexShrink}>
                {t('Kort')}
              </AppText>
              <LocationPill />
            </View>
            {describe}
            <View style={styles.chipWrap}>{chips}</View>
            {summaryLine}
          </View>
          <FlatList
            data={onScreen}
            keyExtractor={(s) => s.business.id}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + TAB_BAR + Spacing.lg }]}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            renderItem={({ item }) => (
              <MapRow item={item} selected={item.business.id === selectedId} onPress={() => focus(item)} />
            )}
            ListEmptyComponent={empty()}
          />
        </View>
        <View style={styles.flex}>
          {map({ top: insets.top + Spacing.md, bottom: insets.bottom + TAB_BAR })}
          <View style={[styles.side, { top: insets.top + Spacing.md }]} pointerEvents="box-none">
            {controls}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {map({ top: topHeight, bottom: bottom + CARD_HEIGHT + 44 })}

      <View style={[styles.top, { paddingTop: insets.top + Spacing.sm }]} pointerEvents="box-none">
        <View style={styles.topRow} pointerEvents="box-none">
          {describe}
          <LocationPill />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {chips}
        </ScrollView>
      </View>

      <View style={[styles.side, { top: topHeight + Spacing.sm }]} pointerEvents="box-none">
        {controls}
      </View>

      <View style={[styles.bottom, { bottom }]} pointerEvents="box-none">
        <View
          style={[
            styles.countPill,
            styles.floating,
            { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
          ]}>
          {summaryLine}
        </View>
        <FlatList
          ref={cards}
          data={onScreen}
          horizontal
          keyExtractor={(s) => s.business.id}
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + CARD_GAP}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.cards}
          ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
          getItemLayout={(_, index) => ({
            length: cardWidth + CARD_GAP,
            offset: (cardWidth + CARD_GAP) * index,
            index,
          })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
          renderItem={({ item }) => (
            <MapCard item={item} width={cardWidth} selected={item.business.id === selectedId} />
          )}
          ListEmptyComponent={empty(cardWidth)}
        />
      </View>
    </View>
  );
}

/** Apple Maps-style stack of round controls in one floating capsule. */
function MapControls({ buttons }: { buttons: { icon: IconName; label: string; onPress: () => void }[] }) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.controls,
        styles.floating,
        { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
      ]}>
      {buttons.map((button, index) => (
        <View key={button.icon}>
          {index > 0 ? <View style={[styles.controlDivider, { backgroundColor: colors.border }]} /> : null}
          <Tappable onPress={button.onPress} accessibilityLabel={button.label} style={styles.control}>
            <Icon name={button.icon} size={18} color={colors.brandText} weight="semibold" />
          </Tappable>
        </View>
      ))}
    </View>
  );
}

function openPage(id: string) {
  router.push({ pathname: '/virksomhed/[id]', params: { id } });
}

function cardLabel({ business, distanceKm }: ScoredBusiness) {
  return t('{name}, {name2}, {distance} væk, {hourly}. Åbn', {
    name: business.name,
    name2: getCategory(business.categories[0])?.name,
    distance: formatDistance(distanceKm),
    hourly: speakablePrice(formatHourly(business.pricing.hourlyMin, business.pricing.hourlyMax, currencyOf(business))),
  });
}

/** A business under the map: who, how far, open now, and the price – with Ring one tap away. */
function MapCard({ item, width, selected }: { item: ScoredBusiness; width: number; selected: boolean }) {
  const colors = useTheme();
  const { business, distanceKm } = item;
  const trade = getCategory(business.categories[0]);
  return (
    <View style={[styles.cardShadow, styles.floating, { width, shadowColor: colors.shadow }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: selected ? colors.brand : colors.border },
        ]}>
        <Tappable
          onPress={() => openPage(business.id)}
          accessibilityLabel={cardLabel(item)}
          pressedOpacity={0.8}
          style={styles.cardMain}>
          <BusinessMark business={business} size={52} />
          <View style={styles.cardBody}>
            <AppText variant="headline" numberOfLines={1}>
              {business.name}
            </AppText>
            <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
              {trade?.name} · {formatDistance(distanceKm)}
            </AppText>
            <OpenStatus business={business} />
            <TrustpilotRating trustpilot={business.trustpilot} />
          </View>
          <Icon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" />
        </Tappable>
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <AppText variant="title3" tabular numberOfLines={1} style={styles.flexShrink}>
            {formatHourly(business.pricing.hourlyMin, business.pricing.hourlyMax, currencyOf(business))}
          </AppText>
          <Button title={t('Ring')} icon="phone" size="small" onPress={() => callBusiness(business)} />
        </View>
      </View>
    </View>
  );
}

/** A business in the list beside the map. The selected one shows its buttons. */
function MapRow({ item, selected, onPress }: { item: ScoredBusiness; selected: boolean; onPress: () => void }) {
  const colors = useTheme();
  const { business, distanceKm } = item;
  const trade = getCategory(business.categories[0]);
  return (
    <View
      style={[
        styles.rowCard,
        { backgroundColor: colors.surface, borderColor: selected ? colors.brand : colors.border },
      ]}>
      <Tappable
        onPress={onPress}
        accessibilityLabel={cardLabel(item)}
        accessibilityState={{ selected }}
        pressedOpacity={0.8}
        style={styles.rowMain}>
        <BusinessMark business={business} size={44} />
        <View style={styles.cardBody}>
          <AppText variant="headline" numberOfLines={1}>
            {business.name}
          </AppText>
          <AppText variant="subhead" weight="700" tabular numberOfLines={1}>
            {formatHourly(business.pricing.hourlyMin, business.pricing.hourlyMax, currencyOf(business))}
          </AppText>
          <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
            {trade?.name} · {formatDistance(distanceKm)}
          </AppText>
          <OpenStatus business={business} />
        </View>
      </Tappable>
      {selected ? (
        <View style={styles.rowActions}>
          <Button
            title={t('Ring')}
            icon="phone"
            size="small"
            onPress={() => callBusiness(business)}
            style={styles.flex}
          />
          <Button
            title={t('Se side')}
            variant="secondary"
            size="small"
            onPress={() => openPage(business.id)}
            style={styles.flex}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flex: 1, flexDirection: 'row' },
  flexShrink: { flexShrink: 1 },
  floating: {
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  top: { position: 'absolute', left: 0, right: 0, top: 0, gap: Spacing.sm },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ScreenPadding,
    gap: Spacing.sm,
  },
  describe: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: MinTouchSize,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chips: { paddingHorizontal: ScreenPadding, gap: Spacing.sm, alignItems: 'center' },
  chipDivider: { width: StyleSheet.hairlineWidth, height: 22, marginHorizontal: 2 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center' },
  side: { position: 'absolute', right: ScreenPadding, alignItems: 'flex-end' },
  controls: { borderRadius: MinTouchSize / 2, borderWidth: StyleSheet.hairlineWidth },
  control: { width: MinTouchSize, height: MinTouchSize, alignItems: 'center', justifyContent: 'center' },
  controlDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 10 },
  bottom: { position: 'absolute', left: 0, right: 0, gap: Spacing.sm },
  countPill: {
    alignSelf: 'flex-start',
    marginLeft: ScreenPadding,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    minHeight: 30,
    justifyContent: 'center',
  },
  cards: { paddingHorizontal: ScreenPadding, paddingBottom: 6 },
  cardShadow: { height: CARD_HEIGHT, borderRadius: Radius.lg },
  card: { flex: 1, borderRadius: Radius.lg, borderWidth: 1.5, overflow: 'hidden' },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  cardBody: { flex: 1, gap: 2 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  emptyCard: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sidebar: { width: SIDEBAR, borderRightWidth: StyleSheet.hairlineWidth },
  sidebarHeader: { paddingHorizontal: ScreenPadding, gap: Spacing.md, paddingBottom: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  list: { paddingHorizontal: ScreenPadding },
  rowCard: { borderRadius: Radius.lg, borderWidth: 1.5, overflow: 'hidden' },
  rowMain: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.md },
  rowActions: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
});
