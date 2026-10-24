import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PRICE_LEVEL_LABELS, type PriceLevel as Level } from '@/lib/ranking';
import { t } from '@/i18n';

/** Three segments, filled up to the level, plus the level in words. */
export function PriceLevel({ level, trade }: { level: Level; trade: string }) {
  const colors = useTheme();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={t('{value} sammenlignet med andre {trade}', { value: PRICE_LEVEL_LABELS[level], trade })}>
      <View style={styles.segments}>
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            style={[styles.segment, { backgroundColor: step <= level ? colors.brand : colors.border }]}
          />
        ))}
      </View>
      <AppText variant="footnote" tone="textSecondary">
        {t('{value} blandt {trade}', { value: PRICE_LEVEL_LABELS[level], trade })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  segments: { flexDirection: 'row', gap: 3 },
  segment: { width: 16, height: 6, borderRadius: 3 },
});
