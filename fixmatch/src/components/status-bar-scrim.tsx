import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

/**
 * A strip in the background colour behind the status bar on a tab's root screen, which has
 * no navigation bar, so content no longer scrolls under the clock and the Dynamic Island.
 * Render it after the screen's scroll view. It is 0 pt high on the web. On a screen that
 * starts with HeroPanel, pass `color={colors.panel}` so the strip matches the panel.
 */
export function StatusBarScrim({ color }: { color?: string }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={[styles.scrim, { height: insets.top, backgroundColor: color ?? colors.background }]}
    />
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0.96 },
});
