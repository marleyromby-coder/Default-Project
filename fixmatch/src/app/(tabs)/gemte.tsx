import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessCard } from '@/components/business/business-card';
import { CompareTray } from '@/components/business/compare-tray';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenPadding, Spacing } from '@/constants/theme';
import { useScored } from '@/hooks/use-results';
import { useTheme } from '@/hooks/use-theme';
import { showDialog } from '@/lib/dialog';
import { MAX_COMPARE, useApp } from '@/state/app-state';

export default function SavedScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const items = useScored(state.favorites);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.business.id}
        renderItem={({ item }) => (
          <BusinessCard
            item={item}
            onCompareLimit={() => showDialog('Højst 3 ad gangen', `Du kan sammenligne op til ${MAX_COMPARE} virksomheder.`)}
          />
        )}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + Spacing.md, marginHorizontal: -ScreenPadding }}>
            <ScreenHeader
              title="Gemte"
              subtitle={items.length ? 'Tryk på “Sammenlign” ved op til tre, så ser du dem side om side.' : undefined}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="heart"
            title="Ingen gemte endnu"
            message="Tryk på hjertet ved en virksomhed, så finder du den hurtigt her næste gang."
            action={<Button title="Find håndværkere" variant="tinted" onPress={() => router.navigate('/')} />}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 160 }]}
        contentInsetAdjustmentBehavior="never"
      />
      <CompareTray bottomOffset={60} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: ScreenPadding },
});
