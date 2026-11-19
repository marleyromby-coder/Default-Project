import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius } from '@/constants/theme';
import { useIsDark, useTheme, useTradeColor } from '@/hooks/use-theme';
import { initials } from '@/lib/business-text';
import type { Business, CategoryId } from '@/lib/types';

/**
 * A business's mark on the coloured panel: its own picture, or its initials in the trade's
 * colour on a white tile (a tint of the trade in dark mode), as in the design. Decorative: the
 * name is always written beside it.
 */
export function HeroMark({ business, size = 64 }: { business: Business; size?: number }) {
  const colors = useTheme();
  const dark = useIsDark();
  const trade = useTradeColor(business.categories[0] as CategoryId);
  const frame = { width: size, height: size, borderRadius: size >= 56 ? Radius.lg : Radius.md };
  if (business.photo.startsWith('https://')) {
    return (
      <Image
        source={{ uri: business.photo }}
        style={[styles.mark, frame]}
        contentFit="cover"
        accessibilityIgnoresInvertColors
        accessible={false}
      />
    );
  }
  const letters = initials(business.name);
  return (
    <View
      style={[styles.mark, frame, { backgroundColor: dark ? trade.soft : colors.surface }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <AppText
        display
        weight="800"
        allowFontScaling={false}
        style={{
          color: trade.onSoft,
          fontSize: size * (letters.length > 1 ? 0.375 : 0.47),
          lineHeight: size,
          textAlign: 'center',
        }}>
        {letters}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
