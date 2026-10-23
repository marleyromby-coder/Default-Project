import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { TRADE_COLORS } from '@/constants/trade-colors';
import { useTheme } from '@/hooks/use-theme';
import type { CategoryId } from '@/lib/types';

export const PIN_SIZE = 34;
export const PIN_SELECTED_SIZE = 46;
/** Transparent margin around every pin, so MapKit does not clip its shadow. */
export const PIN_MARGIN = 3;

export function clusterSize(count: number): number {
  return count >= 20 ? 52 : count >= 8 ? 46 : 40;
}

/** Round map pin with the trade's colour and icon. */
export function MapPin({ category, selected }: { category: CategoryId; selected: boolean }) {
  const size = selected ? PIN_SELECTED_SIZE : PIN_SIZE;
  return (
    <View style={styles.frame}>
      <View
        style={[
          styles.pin,
          selected ? styles.pinSelected : null,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: TRADE_COLORS[category] },
        ]}>
        <Icon name={category} size={selected ? 21 : 16} color="#FFFFFF" weight="semibold" />
      </View>
    </View>
  );
}

/** Bubble for several businesses close together; tap to zoom in. */
export function ClusterBubble({ count }: { count: number }) {
  const colors = useTheme();
  const size = clusterSize(count);
  return (
    <View style={styles.frame}>
      <View
        style={[
          styles.pin,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.brandStrong },
        ]}>
        <AppText variant="headline" tabular style={styles.count} maxFontSizeMultiplier={1}>
          {count}
        </AppText>
      </View>
    </View>
  );
}

/** The chosen town, when the system's own blue GPS dot is not shown. */
export function OriginDot() {
  const colors = useTheme();
  return <View style={[styles.origin, { backgroundColor: colors.info }]} />;
}

const styles = StyleSheet.create({
  frame: { padding: PIN_MARGIN },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinSelected: { shadowOpacity: 0.45, shadowRadius: 8 },
  count: { color: '#FFFFFF' },
  origin: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: '#FFFFFF' },
});
