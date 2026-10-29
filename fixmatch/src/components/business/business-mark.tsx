import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { tradeShade } from '@/constants/trade-colors';
import type { Business } from '@/lib/types';

/** "Hjertevarme VVS & Blik" → "HV", "Rørfalken" → "R". */
export function initials(name: string): string {
  const words = name.split(/[\s\-–&/]+/).filter((w) => /\p{L}/u.test(w));
  return words
    .slice(0, 2)
    .map((w) => w.match(/\p{L}/u)?.[0] ?? '')
    .join('')
    .toUpperCase();
}

/**
 * The business's own picture when it has one (an https URL from the import), otherwise
 * a mark with its initials in the trade's colour – like a logo, so a list never repeats
 * the same stock photo.
 */
export function BusinessMark({ business, size = 56 }: { business: Business; size?: number }) {
  const radius = size * 0.26;
  if (business.photo.startsWith('https://')) {
    return (
      <Image
        source={{ uri: business.photo }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
        accessibilityIgnoresInvertColors
        accessible={false}
      />
    );
  }
  const color = tradeShade(business.categories[0], business.id);
  const letters = initials(business.name);
  return (
    <View
      style={[styles.mark, { width: size, height: size, borderRadius: radius, backgroundColor: color }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <LinearGradient
        colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AppText
        rounded
        weight="700"
        allowFontScaling={false}
        style={[styles.letters, { fontSize: size * (letters.length > 1 ? 0.36 : 0.44), lineHeight: size }]}>
        {letters}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  letters: { color: '#FFFFFF', letterSpacing: 0.5, textAlign: 'center' },
});
