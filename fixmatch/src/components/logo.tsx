import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';

import MARK from '../../assets/brand/mark.json';

/**
 * The FixMatch mark: a serif "f" with the ochre dot of the wordmark, on pine. Fixed colours,
 * like the app icon, so it looks the same in light and dark mode. Same drawing as the icon
 * (scripts/render-brand-assets.js reads the same assets/brand/mark.json).
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  const { colors, dot } = MARK;
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${MARK.size} ${MARK.size}`}
      accessibilityElementsHidden
      importantForAccessibility="no">
      <Defs>
        <LinearGradient id="fixmatch-tile" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.tileTop} />
          <Stop offset="1" stopColor={colors.tile} />
        </LinearGradient>
      </Defs>
      <Rect width={MARK.size} height={MARK.size} rx={MARK.size * 0.234} fill="url(#fixmatch-tile)" />
      <Path d={MARK.f} fill={colors.letter} />
      <Circle cx={dot.cx} cy={dot.cy} r={dot.r} fill={colors.dot} />
    </Svg>
  );
}

/** The wordmark "fixmatch." in Fraunces, with the ochre full stop of the mark. */
export function Logo({ size = 26, mark = false }: { size?: number; mark?: boolean }) {
  const colors = useTheme();
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="FixMatch">
      {mark ? <LogoMark size={size * 1.15} /> : null}
      <AppText
        variant="title2"
        weight="700"
        allowFontScaling={false}
        style={{ fontSize: size, lineHeight: size * 1.2, letterSpacing: -size * 0.03 }}>
        fixmatch
        <Text style={{ color: colors.accent }}>.</Text>
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
