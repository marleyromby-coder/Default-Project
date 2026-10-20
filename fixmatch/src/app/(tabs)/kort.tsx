import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MatchBadge } from '@/components/business/match-badge';
import { TrustpilotRating } from '@/components/business/trustpilot-rating';
import { LocationPill } from '@/components/location-pill';
import { BusinessMap } from '@/components/map/business-map';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Photo } from '@/components/ui/photo';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { CATEGORIES, isCategoryId } from '@/data/categories';
import { useResults } from '@/hooks/use-results';
import { useTheme } from '@/hooks/use-theme';
import { callBusiness } from '@/lib/contact';
import { DEFAULT_FILTERS } from '@/lib/filters';
import { formatDistance, formatHourly } from '@/lib/format';
import type { CategoryId, Filters } from '@/lib/types';
import { useApp } from '@/state/app-state';

const MAP_FILTERS: Filters = { ...DEFAULT_FILTERS, maxDistanceKm: 40 };

export default function MapScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ kategori?: string }>();
  const initial = params.kategori && isCategoryId(params.kategori) ? params.kategori : undefined;
  const [category, setCategory] = useState<CategoryId | undefined>(initial);
  const [selectedId, setSelectedId] = useState<string>();
  const { state } = useApp();
  const results = useResults(category, 'distance', MAP_FILTERS);
  const selected = useMemo(() => results.items.find((s) => s.business.id === selectedId), [results.items, selectedId]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.flex}>
        <BusinessMap items={results.items} origin={state.location.coords} selectedId={selectedId} onSelect={setSelectedId} />
      </View>

      <View style={[styles.top, { paddingTop: insets.top + Spacing.sm }]} pointerEvents="box-none">
        <View style={styles.topRow} pointerEvents="box-none">
          <View style={[styles.titlePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="headline">{results.items.length} i nærheden</AppText>
          </View>
          <LocationPill />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Alle fag" selected={!category} onPress={() => setCategory(undefined)} />
          {CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.name} icon={c.id} selected={category === c.id} onPress={() => setCategory(c.id)} />
          ))}
        </ScrollView>
      </View>

      {selected ? (
        <View style={[styles.sheet, { bottom: insets.bottom + 90 }]}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <Tappable
              onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: selected.business.id } })}
              accessibilityLabel={`${selected.business.name}, ${formatDistance(selected.distanceKm)} væk. Åbn`}
              pressedOpacity={0.8}
              style={styles.cardMain}>
              <Photo photo={selected.business.photo} category={selected.business.categories[0]} width={300} style={styles.photo} />
              <View style={styles.cardBody}>
                <View style={styles.row}>
                  <AppText variant="headline" numberOfLines={1} style={styles.flex}>
                    {selected.business.name}
                  </AppText>
                  <MatchBadge score={selected.score} />
                </View>
                <TrustpilotRating trustpilot={selected.business.trustpilot} />
                <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
                  {formatHourly(selected.business.pricing.hourlyMin, selected.business.pricing.hourlyMax)} ·{' '}
                  {formatDistance(selected.distanceKm)}
                </AppText>
              </View>
            </Tappable>
            <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
              <Button title="Ring" icon="phone" size="small" onPress={() => callBusiness(selected.business)} style={styles.flex} />
              <Button
                title="Se side"
                variant="secondary"
                size="small"
                style={styles.flex}
                onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: selected.business.id } })}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { position: 'absolute', left: 0, right: 0, top: 0, gap: Spacing.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: ScreenPadding, gap: Spacing.sm },
  titlePill: { borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.md, minHeight: 36, justifyContent: 'center' },
  chips: { paddingHorizontal: ScreenPadding, gap: Spacing.sm },
  sheet: { position: 'absolute', left: ScreenPadding, right: ScreenPadding },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardMain: { flexDirection: 'row' },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  photo: { width: 96, minHeight: 96 },
  cardBody: { flex: 1, padding: Spacing.md, gap: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
