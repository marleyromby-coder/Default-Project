import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, type Palette, Radius, Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';

interface HeroPanelProps {
  children?: ReactNode;
  /**
   * Add the status bar's height above the content (default true), for screens without a
   * navigation bar. Turn it off when a navigation bar sits above the panel.
   */
  safeArea?: boolean;
  /**
   * Extra room at the bottom for a card that overlaps the panel's lower edge: give the card the
   * same value as a negative `marginTop` (e.g. `overlap={56}` and `marginTop: -56`).
   */
  overlap?: number;
  /**
   * The faint circles in the top right corner (default: same as `safeArea`, so no circles under a
   * navigation bar, where the panel's top edge would cut the large disc into a visible seam).
   */
  decoration?: boolean;
  /** Radius of the bottom corners (default Radius.panel). 0 gives a straight band. */
  radius?: number;
  /** White status bar text while the screen is in front (default true). */
  lightStatusBar?: boolean;
  /** The outer panel, e.g. a negative margin to sit under a transparent header. */
  style?: StyleProp<ViewStyle>;
  /** The inner column that holds `children`. Padding defaults to the screen gutter. */
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * The coloured panel at the top of Find, results and business pages: an emerald gradient
 * (`panel` → `panel2`) with rounded bottom corners. Text and icons on it use `onPanel` and
 * `onPanelSoft`; the logo takes `onPanel`, buttons can use `panelRaised` as their fill.
 * The content is centred in the readable column on wide screens (useLayout), like scroll content.
 */
export function HeroPanel({
  children,
  safeArea = true,
  overlap = 0,
  decoration = safeArea,
  radius = Radius.panel,
  lightStatusBar = true,
  style,
  contentStyle,
}: HeroPanelProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column, gutter } = useLayout();
  const focused = useIsFocused();
  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colors.panel2,
          backgroundImage: `linear-gradient(180deg, ${colors.panel} 0%, ${colors.panel2} 100%)`,
          borderBottomLeftRadius: radius,
          borderBottomRightRadius: radius,
          paddingTop: (safeArea ? insets.top : 0) + Spacing.sm,
          paddingBottom: Spacing.xl + overlap,
          paddingHorizontal: gutter,
        },
        style,
      ]}>
      {lightStatusBar && focused ? <StatusBar style="light" /> : null}
      {decoration ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.circle, styles.circleLarge, { backgroundColor: colors.onPanel }]} />
          <View style={[styles.circle, styles.circleSmall, { borderColor: colors.onPanel }]} />
        </View>
      ) : null}
      <View style={[column, contentStyle]}>{children}</View>
    </View>
  );
}

/**
 * Navigation bar options for a screen whose HeroPanel starts right under the bar: the bar takes
 * the panel's top colour, with white title, back chevron and buttons, and no hairline, so bar
 * and panel read as one. Use with `<HeroPanel safeArea={false} />`, which also turns the status
 * bar white: `<Stack.Screen options={{ ...panelHeaderOptions(colors), title }} />`.
 */
export function panelHeaderOptions(colors: Palette) {
  return {
    headerStyle: { backgroundColor: colors.panel },
    headerTintColor: colors.onPanel,
    // Same as the root layout's title style, in white.
    headerTitleStyle: {
      color: colors.onPanel,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? Fonts.sans : undefined,
    },
    headerShadowVisible: false,
    headerLargeTitleEnabled: false,
  } as const;
}

const styles = StyleSheet.create({
  panel: { overflow: 'hidden', borderCurve: 'continuous' },
  circle: { position: 'absolute', borderRadius: 999 },
  // A big soft disc, mostly outside the panel, like light on the corner of the screen.
  circleLarge: { width: 300, height: 300, top: -150, right: -110, opacity: 0.07 },
  circleSmall: { width: 150, height: 150, top: 40, right: -70, borderWidth: 1.5, opacity: 0.08 },
});
