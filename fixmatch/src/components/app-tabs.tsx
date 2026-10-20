import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/hooks/use-theme';
import { useApp } from '@/state/app-state';

/** Native tab bar (Liquid Glass on iOS 26). The web build uses app-tabs.web.tsx. */
export default function AppTabs() {
  const colors = useTheme();
  const { state } = useApp();
  const saved = state.favorites.length;

  return (
    <NativeTabs tintColor={colors.brandText} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Find</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="kort">
        <NativeTabs.Trigger.Label>Kort</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="gemte">
        <NativeTabs.Trigger.Label>Gemte</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'heart', selected: 'heart.fill' }} md="favorite" />
        <NativeTabs.Trigger.Badge hidden={saved === 0}>{String(saved)}</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mere">
        <NativeTabs.Trigger.Label>Mere</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' }} md="more_horiz" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
