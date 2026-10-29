import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Line, Rect } from 'react-native-svg';

import { AppText } from '@/components/ui/text';

/** Brand colours of the mark. Fixed, like the app icon, so the logo looks the same in light and dark mode. */
const MARK = { tile: '#1A2640', steel: '#4B5E84', vial: '#F2541B', white: '#FFFFFF' };

/**
 * The FixMatch mark: a spirit level with the bubble dead centre – "i vater", everything is
 * right. Same drawing as the app icon (scripts/render-brand-assets.js).
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no">
      <Rect x="0" y="0" width="64" height="64" rx="15" fill={MARK.tile} />
      {/* Same proportions as the app icon: the glyph spans 76 % of the tile. */}
      <Rect x="7.68" y="27.87" width="48.64" height="8.27" rx="2.43" fill={MARK.steel} />
      <Rect x="17.89" y="20.81" width="28.21" height="22.37" rx="11.19" fill={MARK.vial} />
      <Line x1="25.77" y1="24.8" x2="25.77" y2="39.2" stroke={MARK.white} strokeWidth="2.24" strokeLinecap="round" />
      <Line x1="38.23" y1="24.8" x2="38.23" y2="39.2" stroke={MARK.white} strokeWidth="2.24" strokeLinecap="round" />
      <Ellipse cx="32" cy="32" rx="4.18" ry="3.79" fill={MARK.white} />
    </Svg>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="FixMatch">
      <LogoMark size={size} />
      <AppText variant="title2" style={[styles.word, { fontSize: size * 0.75, lineHeight: size }]}>
        Fix
        <AppText variant="title2" tone="brandText" style={[styles.word, { fontSize: size * 0.75, lineHeight: size }]}>
          Match
        </AppText>
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { letterSpacing: -0.4 },
});
