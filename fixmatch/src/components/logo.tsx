import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { AppText } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';

/** The FixMatch mark: a check mark that ends in a wrench head. Same drawing as the app icon. */
export function LogoMark({ size = 32 }: { size?: number }) {
  const colors = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no">
      <Rect x="0" y="0" width="64" height="64" rx="15" fill={colors.brand} />
      <Path d="M16 34 L27.5 45.5 L45 24" stroke="#FFFFFF" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx="47.5" cy="20.5" r="9" fill="#FFFFFF" />
      <Rect x="48" y="9" width="7" height="11" rx="1.5" fill={colors.brand} transform="rotate(45 51.5 14.5)" />
    </Svg>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="FixMatch">
      <LogoMark size={size} />
      <AppText variant="title2" style={{ fontSize: size * 0.75, lineHeight: size }}>
        Fix<AppText variant="title2" tone="brandText" style={{ fontSize: size * 0.75, lineHeight: size }}>Match</AppText>
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
