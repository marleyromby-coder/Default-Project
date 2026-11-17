import { StyleSheet, View } from 'react-native';

import { Stars } from '@/components/ui/stars';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { formatNumber, formatRating } from '@/lib/format';
import type { ReviewSummary } from '@/lib/types';
import { t } from '@/i18n';

/**
 * FixMatch's own reviews in one line: stars, the average and the count. Shown only when there
 * is at least one review, so cards stay clean while a business has none.
 */
export function ReviewRating({ summary }: { summary?: ReviewSummary }) {
  if (!summary || summary.reviews < 1) return null;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={t('{rating} af 5 stjerner fra {count} brugere via FixMatch', {
        rating: formatRating(summary.average),
        count: summary.reviews,
      })}>
      <Stars value={summary.average} size={13} />
      <AppText variant="footnote" weight="600" tabular>
        {formatRating(summary.average)}
      </AppText>
      <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
        ({formatNumber(summary.reviews)})
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 1, flexShrink: 1 },
});
