import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { markTone } from '@/constants/trade-colors';
import { useIsDark } from '@/hooks/use-theme';
import { initials } from '@/lib/business-text';
import type { Business } from '@/lib/types';

/**
 * The business's own picture when it has one (an https URL from the import), otherwise
 * its initials in Fraunces on a tint of the trade colour – like a stamp, so a list never
 * repeats the same stock photo.
 */
export function BusinessMark({ business, size = 56 }: { business: Business; size?: number }) {
  const scheme = useIsDark() ? 'dark' : 'light';
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
  const tone = markTone(business.categories[0], business.id, scheme);
  const letters = initials(business.name);
  return (
    <View
      style={[styles.mark, { width: size, height: size, borderRadius: radius, backgroundColor: tone.background }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <AppText
        serif
        weight="700"
        allowFontScaling={false}
        style={{
          color: tone.letters,
          fontSize: size * (letters.length > 1 ? 0.4 : 0.5),
          lineHeight: size,
          textAlign: 'center',
        }}>
        {letters}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
