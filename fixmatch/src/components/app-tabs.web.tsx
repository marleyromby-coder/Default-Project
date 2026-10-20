import { TabList, TabSlot, Tabs, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useApp } from '@/state/app-state';

/** Bottom tab bar for the web demo, styled like the iOS tab bar. */
export default function AppTabs() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useApp();

  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList
        role="tablist"
        style={[
          styles.bar,
          { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 6) },
        ]}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon="search" label="Find" />
        </TabTrigger>
        <TabTrigger name="kort" href="/kort" asChild>
          <TabButton icon="map" label="Kort" />
        </TabTrigger>
        <TabTrigger name="gemte" href="/gemte" asChild>
          <TabButton icon="heartFill" label="Gemte" badge={state.favorites.length} />
        </TabTrigger>
        <TabTrigger name="mere" href="/mere" asChild>
          <TabButton icon="list" label="Mere" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

interface TabButtonProps extends Omit<TabTriggerSlotProps, 'ref'> {
  icon: IconName;
  label: string;
  badge?: number;
}

function TabButton({ icon, label, badge, isFocused, ...props }: TabButtonProps) {
  const colors = useTheme();
  const color = isFocused ? colors.brandText : colors.textSecondary;
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      style={styles.tab}>
      <View>
        <Icon name={icon} size={24} color={color} weight={isFocused ? 'semibold' : 'regular'} />
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.danger }]}>
            <AppText variant="caption2" style={styles.badgeText}>
              {badge}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="caption2" style={{ color }} maxFontSizeMultiplier={1.2}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 48, cursor: 'pointer' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF' },
});
