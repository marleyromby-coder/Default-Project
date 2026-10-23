import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TrustpilotRating } from '@/components/business/trustpilot-rating';
import { LocationPill } from '@/components/location-pill';
import { BusinessMap } from '@/components/map/business-map';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Photo } from '@/components/ui/photo';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { MaxContentWidth, MinTouchSize, Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { TRADE_COLORS } from '@/constants/trade-colors';
import { CATEGORIES, getCategory, isCategoryId } from '@/data/categories';
import { useResults } from '@/hooks/use-results';
import { useTheme } from '@/hooks/use-theme';
import { DENMARK_REGION, inRegion, regionAround, type Region } from '@/lib/cluster';
import { callBusiness } from '@/lib/contact';
import { DEFAULT_FILTERS } from '@/lib/filters';
import { formatDistance, formatHourly } from '@/lib/format';
import type { ScoredBusiness } from '@/lib/ranking';
import type { CategoryId, Filters } from '@/lib/types';
import { useApp } from '@/state/app-state';

const NEARBY_KM = 7;
const MAX_CARDS = 40;
const CARD_GAP = Spacing.sm;
const CARD_HEIGHT = 148;
/** Height of the floating tab bar above the home indicator. */
const TAB_BAR = Platform.OS === 'web' ? 0 : 62;

/**
 * Overview map of every listed business in Denmark. Pins are coloured by
 * trade, nearby pins merge into clusters, and the cards at the bottom follow
 * what is on screen. Swipe the cards or tap a pin to pick a business.
 */
export default function MapScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const params = useLocalSearchParams<{ kategori?: string }>();
  const { state } = useApp();
  const origin = state.location.coords;

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
  const results = useResults(category, 'distance', filters);
  const onScreen = useMemo(
    () => results.items.filter((s) => inRegion(region, s.business.coords)).slice(0, MAX_CARDS),
    [results.items, region],
  );

  const pageWidth = Math.min(window.width, MaxContentWidth);
  const cardWidth = pageWidth - ScreenPadding * 2 - 28;
  const bottom = (Platform.OS === 'web' ? Spacing.md : insets.bottom + TAB_BAR) + Spacing.sm;
  const topHeight = insets.top + 108;

  const select = (id: string) => {
    setSelectedId(id);
    const index = onScreen.findIndex((s) => s.business.id === id);
    if (index >= 0) cards.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
  };

  // FlatList needs this callback to stay the same for the list's lifetime.
  const onViewable = useCallback(
    ({ viewableItems }: { viewableItems: { item: ScoredBusiness; isViewable: boolean }[] }) => {
      const first = viewableItems.find((v) => v.isViewable);
      if (first?.item) setSelectedId(first.item.business.id);
    },
    [],
  );

  const tradeCount = (id: CategoryId) => state.businesses.filter((b) => b.categories.includes(id)).length;
  const showsUserLocation = state.location.source === 'gps' && Platform.OS !== 'web';

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <BusinessMap
        items={results.items}
        origin={origin}
        showsUserLocation={showsUserLocation}
        selectedId={selectedId}
        onSelect={select}
        target={target}
        onRegionChange={setRegion}
        padding={{ top: topHeight, bottom: bottom + CARD_HEIGHT + 44 }}
      />

      <View style={[styles.top, { paddingTop: insets.top + Spacing.sm }]} pointerEvents="box-none">
        <View style={styles.topRow} pointerEvents="box-none">
          <Tappable
            onPress={() => router.push('/beskriv')}
            accessibilityLabel="Beskriv dit problem og dit budget"
            style={[
              styles.describe,
              styles.floating,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}>
            <Icon name="wand" size={17} color={colors.brand} weight="semibold" />
            <AppText variant="subhead" tone="textSecondary" numberOfLines={1} style={styles.flexShrink}>
              Beskriv dit problem …
            </AppText>
          </Tappable>
          <LocationPill />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Alle fag" selected={!category} onPress={() => setCategory(undefined)} />
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              icon={c.id}
              count={category === c.id ? undefined : tradeCount(c.id)}
              selected={category === c.id}
              onPress={() => setCategory(category === c.id ? undefined : c.id)}
              accessibilityLabel={`${c.plural}, ${tradeCount(c.id)} på kortet`}
            />
          ))}
          <Chip label="Åben nu" icon="clock" selected={openNow} onPress={() => setOpenNow(!openNow)} />
          <Chip label="Døgnvagt" icon="bolt" selected={emergency} onPress={() => setEmergency(!emergency)} />
        </ScrollView>
      </View>

      <View style={[styles.side, { top: topHeight + Spacing.sm }]} pointerEvents="box-none">
        <Tappable
          onPress={() => setTarget(regionAround(origin, NEARBY_KM))}
          accessibilityLabel={`Vis området omkring ${state.location.label}`}
          style={[
            styles.roundButton,
            styles.floating,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}>
          <Icon name="crosshair" size={18} color={colors.brandText} weight="semibold" />
        </Tappable>
        <Tappable
          onPress={() => setTarget({ ...DENMARK_REGION })}
          accessibilityLabel="Vis hele Danmark"
          style={[
            styles.textButton,
            styles.floating,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}>
          <AppText variant="caption" weight="700" tone="brandText">
            Hele DK
          </AppText>
        </Tappable>
      </View>

      <View style={[styles.bottom, { bottom }]} pointerEvents="box-none">
        <View
          style={[
            styles.countPill,
            styles.floating,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}>
          <AppText variant="footnote" weight="600">
            {onScreen.length === 0
              ? 'Ingen her – zoom ud'
              : `${results.items.length > MAX_CARDS && onScreen.length === MAX_CARDS ? `${MAX_CARDS}+` : onScreen.length} her`}
            <AppText variant="footnote" tone="textSecondary">
              {' '}
              · {results.items.length} i Danmark
            </AppText>
          </AppText>
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
          ListEmptyComponent={
            <View
              style={[
                styles.emptyCard,
                {
                  width: cardWidth,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}>
              <AppText variant="headline">Ingen virksomheder i kortudsnittet</AppText>
              <AppText variant="footnote" tone="textSecondary">
                Zoom ud, eller se {category ? getCategory(category)?.plural.toLowerCase() : 'alle'} i hele Danmark.
              </AppText>
              <Button
                title="Vis hele Danmark"
                variant="tinted"
                size="small"
                onPress={() => setTarget({ ...DENMARK_REGION })}
              />
            </View>
          }
        />
      </View>
    </View>
  );
}

function MapCard({ item, width, selected }: { item: ScoredBusiness; width: number; selected: boolean }) {
  const colors = useTheme();
  const { business, distanceKm } = item;
  const trade = getCategory(business.categories[0]);
  const open = () => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } });
  return (
    <View style={[styles.cardShadow, styles.floating, { width, shadowColor: colors.shadow }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: selected ? colors.brand : colors.border,
          },
        ]}>
        <Tappable
          onPress={open}
          accessibilityLabel={`${business.name}, ${trade?.name}, ${formatDistance(distanceKm)} væk, ${formatHourly(business.pricing.hourlyMin, business.pricing.hourlyMax).replace('–', ' til ')}. Åbn`}
          pressedOpacity={0.8}
          style={styles.cardMain}>
          <Photo photo={business.photo} category={business.categories[0]} width={240} style={styles.photo} />
          <View style={styles.cardBody}>
            <View style={styles.tradeRow}>
              <View style={[styles.tradeDot, { backgroundColor: TRADE_COLORS[business.categories[0]] }]}>
                <Icon name={business.categories[0]} size={10} color="#FFFFFF" weight="bold" />
              </View>
              <AppText variant="caption" weight="700" tone="textSecondary" numberOfLines={1} style={styles.flexShrink}>
                {trade?.name.toUpperCase()} · {formatDistance(distanceKm)}
              </AppText>
            </View>
            <AppText variant="headline" numberOfLines={1}>
              {business.name}
            </AppText>
            <TrustpilotRating trustpilot={business.trustpilot} />
            <AppText variant="footnote" weight="600" numberOfLines={1}>
              {formatHourly(business.pricing.hourlyMin, business.pricing.hourlyMax)}
              {business.emergency ? (
                <AppText variant="footnote" tone="warning" weight="600">
                  {' '}
                  · Døgnvagt
                </AppText>
              ) : null}
            </AppText>
          </View>
        </Tappable>
        <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
          <Button title="Ring" icon="phone" size="small" onPress={() => callBusiness(business)} style={styles.flex} />
          <Button title="Se side" variant="secondary" size="small" onPress={open} style={styles.flex} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  floating: {
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
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
  chips: { paddingHorizontal: ScreenPadding, gap: Spacing.sm },
  side: {
    position: 'absolute',
    right: ScreenPadding,
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  roundButton: {
    width: MinTouchSize,
    height: MinTouchSize,
    borderRadius: MinTouchSize / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButton: {
    minHeight: MinTouchSize,
    minWidth: MinTouchSize,
    paddingHorizontal: Spacing.md,
    borderRadius: MinTouchSize / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  card: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardMain: { flex: 1, flexDirection: 'row' },
  photo: { width: 92 },
  cardBody: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 3,
    justifyContent: 'center',
  },
  tradeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tradeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  emptyCard: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
});
