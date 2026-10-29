import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { TRADE_COLORS } from '@/constants/trade-colors';
import { useTheme } from '@/hooks/use-theme';
import type { CategoryId } from '@/lib/types';

/** Transparent margin around every pin, so MapKit does not clip its shadow. */
export const PIN_MARGIN = 4;
/**
 * Price pills are about 80 × 32 pt, so they merge sooner across than down (shares of the
 * map width, see clusterPoints).
 */
export const PIN_SPACING = { x: 0.21, y: 0.1 };

export function clusterSize(count: number): number {
  return count >= 20 ? 52 : count >= 8 ? 46 : 40;
}

/**
 * A business on the map: its trade and its lowest hourly price, like a price tag. The
 * selected one turns pine. Showing the price up front is what sets FixMatch apart from
 * platforms where you post a job and wait for bids.
 */
export function PricePin({ category, price, selected }: { category: CategoryId; price: string; selected: boolean }) {
  const colors = useTheme();
  return (
    <View style={styles.frame}>
      <View
        style={[
          styles.pill,
          { shadowColor: colors.shadow },
          selected
            ? [styles.pillSelected, { backgroundColor: colors.ink, borderColor: colors.onInk }]
            : { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <View
          style={[styles.trade, selected ? styles.tradeSelected : null, { backgroundColor: TRADE_COLORS[category] }]}>
          <Icon name={category} size={selected ? 13 : 11} color="#FFFFFF" weight="bold" />
        </View>
        <AppText
          variant={selected ? 'subhead' : 'footnote'}
          weight="700"
          tabular
          numberOfLines={1}
          maxFontSizeMultiplier={1}
          style={{ color: selected ? colors.onInk : colors.text }}>
          {price}
        </AppText>
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
          styles.cluster,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.ink,
            borderColor: colors.onInk,
            shadowColor: colors.shadow,
          },
        ]}>
        <AppText
          variant="headline"
          serif
          weight="700"
          tabular
          style={{ color: colors.onInk }}
          maxFontSizeMultiplier={1}>
          {count}
        </AppText>
      </View>
    </View>
  );
}

/** The chosen town, when the system's own GPS dot is not shown: the ochre dot of the logo. */
export function OriginDot() {
  const colors = useTheme();
  return (
    <View style={[styles.halo, { backgroundColor: `${colors.accent}33` }]}>
      <View style={[styles.origin, { backgroundColor: colors.accent }]} />
    </View>
  );
}

const shadow = {
  shadowOpacity: 0.22,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  frame: { padding: PIN_MARGIN },
  pill: {
    ...shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingLeft: 4,
    paddingRight: 9,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillSelected: { height: 36, borderRadius: 18, paddingLeft: 5, paddingRight: 11, borderWidth: 2, shadowOpacity: 0.32 },
  trade: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tradeSelected: { width: 24, height: 24, borderRadius: 12 },
  cluster: { ...shadow, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5 },
  halo: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  origin: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: '#FFFFFF' },
});
