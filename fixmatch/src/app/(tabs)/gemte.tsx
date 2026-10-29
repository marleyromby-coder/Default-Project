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
import { useLayout } from '@/hooks/use-layout';
import { showDialog } from '@/lib/dialog';
import { MAX_COMPARE, useApp } from '@/state/app-state';
import { t } from '@/i18n';

export default function SavedScreen() {
  const { column } = useLayout();
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
            onCompareLimit={() =>
              showDialog(
                t('Højst 3 ad gangen'),
                t('Du kan sammenligne op til {MAX_COMPARE} virksomheder.', { MAX_COMPARE }),
              )
            }
          />
        )}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + Spacing.md, marginHorizontal: -ScreenPadding }}>
            <ScreenHeader
              title={t('Gemte')}
              subtitle={
                items.length ? t('Tryk på “Sammenlign” ved op til tre, så ser du dem side om side.') : undefined
              }
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="heart"
            title={t('Ingen gemte endnu')}
            message={t('Tryk på hjertet ved en virksomhed, så finder du den hurtigt her næste gang.')}
            action={<Button title={t('Find håndværkere')} variant="tinted" onPress={() => router.navigate('/')} />}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        contentContainerStyle={[styles.list, column, { paddingBottom: insets.bottom + 160 }]}
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
