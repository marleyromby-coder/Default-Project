import { StyleSheet, View } from 'react-native';

import { Stars } from '@/components/ui/stars';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { formatNumber, formatRating } from '@/lib/format';
import { reviewRatingLabel } from '@/lib/review-label';
import type { ReviewSummary } from '@/lib/types';

/**
 * FixMatch's own reviews in one line: stars, the average and the count. Shown only when there
 * is at least one review, so cards stay clean while a business has none. `compact` draws one
 * star instead of five and never shrinks, for a line it shares with other text.
 */
export function ReviewRating({ summary, compact }: { summary?: ReviewSummary; compact?: boolean }) {
  if (!summary || summary.reviews < 1) return null;
  return (
    <View
      style={[styles.row, compact ? styles.fixed : null]}
      accessible
      accessibilityLabel={reviewRatingLabel(summary)}>
      {compact ? <Stars value={1} count={1} size={13} /> : <Stars value={summary.average} size={13} />}
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
  fixed: { flexShrink: 0 },
});
