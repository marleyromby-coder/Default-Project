import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PRICE_LEVEL_LABELS, type PriceLevel as Level } from '@/lib/ranking';

/** Three segments, filled up to the level, plus the level in words. */
export function PriceLevel({ level, trade }: { level: Level; trade: string }) {
  const colors = useTheme();
  return (
    <View style={styles.row} accessible accessibilityLabel={`${PRICE_LEVEL_LABELS[level]} sammenlignet med andre ${trade}`}>
      <View style={styles.segments}>
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            style={[styles.segment, { backgroundColor: step <= level ? colors.brand : colors.border }]}
          />
        ))}
      </View>
      <AppText variant="footnote" tone="textSecondary">
        {PRICE_LEVEL_LABELS[level]} blandt {trade}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  segments: { flexDirection: 'row', gap: 3 },
  segment: { width: 16, height: 6, borderRadius: 3 },
});
