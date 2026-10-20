import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { placeToLocation, POPULAR_PLACES, searchPlaces, type Place } from '@/data/places';
import { GPS_MESSAGES, useGps } from '@/hooks/use-gps';
import { useTheme } from '@/hooks/use-theme';
import { showDialog } from '@/lib/dialog';
import { useApp } from '@/state/app-state';

export default function LocationScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state, setLocation } = useApp();
  const { locate, busy } = useGps();
  const [query, setQuery] = useState('');
  const places = useMemo(() => (query.trim() ? searchPlaces(query) : POPULAR_PLACES), [query]);

  const choose = (place: Place) => {
    setLocation(placeToLocation(place));
    router.back();
  };

  const useGpsLocation = async () => {
    const result = await locate();
    if (result === 'ok') router.back();
    else showDialog(GPS_MESSAGES[result].title, GPS_MESSAGES[result].message);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.top}>
        <Button title={busy ? 'Finder din placering…' : 'Brug min nuværende placering'} icon="location" onPress={useGpsLocation} loading={busy} block />
        <AppText variant="caption" tone="textSecondary" align="center">
          Placeringen bruges kun på din telefon til at beregne afstande.
        </AppText>
        <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="search" size={17} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Postnummer eller by"
            placeholderTextColor={colors.textTertiary}
            autoCorrect={false}
            keyboardType="default"
            accessibilityLabel="Søg efter postnummer eller by"
            style={[styles.input, { color: colors.text }]}
          />
        </View>
        <AppText variant="footnote" tone="textSecondary" style={styles.label}>
          {query.trim() ? 'RESULTATER' : 'STORE BYER'}
        </AppText>
      </View>
      <FlatList
        data={places}
        keyExtractor={(p) => p.code + p.name}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: ScreenPadding, paddingBottom: insets.bottom + Spacing.xl }}
        renderItem={({ item, index }) => {
          const selected = state.location.postalCode === item.code && state.location.label === item.name;
          return (
            <View style={[styles.rowWrap, { backgroundColor: colors.surface, borderColor: colors.border }, index === 0 && styles.first, index === places.length - 1 && styles.last]}>
              {index > 0 ? <Divider inset={Spacing.lg} /> : null}
              <Tappable
                onPress={() => choose(item)}
                accessibilityLabel={`${item.code} ${item.name}, ${item.kommune}`}
                accessibilityState={{ selected }}
                pressedOpacity={0.5}
                style={styles.row}>
                <View style={styles.flex}>
                  <AppText variant="body">
                    {item.code} {item.name}
                  </AppText>
                  <AppText variant="footnote" tone="textSecondary">
                    {item.kommune}
                  </AppText>
                </View>
                {selected ? <Icon name="check" size={16} color={colors.brandText} weight="bold" /> : null}
              </Tappable>
            </View>
          );
        }}
        ListEmptyComponent={
          <AppText variant="subhead" tone="textSecondary" align="center" style={styles.empty}>
            Ingen danske postnumre eller byer matcher “{query}”.
          </AppText>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { padding: ScreenPadding, gap: Spacing.md },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 44,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  input: { flex: 1, fontSize: 17, minHeight: 44, outlineStyle: 'none' } as never,
  label: { letterSpacing: 0.3, paddingHorizontal: Spacing.xs, marginTop: Spacing.xs },
  rowWrap: { borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth },
  first: { borderTopWidth: StyleSheet.hairlineWidth, borderTopLeftRadius: Radius.md, borderTopRightRadius: Radius.md, overflow: 'hidden' },
  last: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomLeftRadius: Radius.md, borderBottomRightRadius: Radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 56, paddingVertical: Spacing.sm },
  empty: { padding: Spacing.xl },
});
